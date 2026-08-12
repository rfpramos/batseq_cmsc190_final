
/**
 * 
 * @file dataController.js
 * @description  Controller for handling data-related operations, including CRUD operations,
 * user management, authentication, data sharing, and BLASTN functionality.
 * This file contains methods for adding, editing, deleting, and retrieving data,
 * as well as user authentication and authorization checks.
 * @author Ramnick Francis Ramos
 * 
 * @version 1.0.0
 * @since 2024-08-11
 * @purpose Backend Auditing - Revisting Code for Data Management
 * @sprint 1, Ticket 1
 * 
 * 
 * @todo Implement seqviz and phyloTree methods in dataController.js
 * Remaining To-Do:
 * 1. Implement Routes (if needed) for seqviz
 * 2. Implement Routes for phylogenetic tree generation using phylotreeJS
 * 
 */



const connection = require('../db'); // connection to the database
const fs = require('fs'); // file system module for reading and writing files
const { execFile } = require('child_process'); // execFile avoids shell interpretation
const path = require('path'); // path module for handling file paths
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const APP_JWT_SECRET = process.env.APP_JWT_SECRET || 'replace-this-jwt-secret-in-production';
const APP_JWT_EXPIRES_IN = process.env.APP_JWT_EXPIRES_IN || '7d';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'batseq_session';
const SESSION_COOKIE_MAX_AGE_MS = Number(process.env.SESSION_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';

const sanitizeUserRow = (row) => {
  if (!row) {
    return row;
  }

  const { password, ...safeRow } = row;
  return safeRow;
};

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const normalizeEmail = (email) => email.trim().toLowerCase();

const queryAsync = (query, values) => new Promise((resolve, reject) => {
  connection.query(query, values, (err, results) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(results);
  });
});

const createAuthToken = (user) => jwt.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
  },
  APP_JWT_SECRET,
  { expiresIn: APP_JWT_EXPIRES_IN }
);

const setSessionCookie = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
  });
};

const clearSessionCookie = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: '/',
  });
};

const parseCookieHeader = (cookieHeader) => {
  if (!isNonEmptyString(cookieHeader)) {
    return {};
  }

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separatorIndex = pair.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = pair.substring(0, separatorIndex).trim();
      const value = pair.substring(separatorIndex + 1).trim();
      if (key) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});
};

const getSessionUser = async (req) => {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE_NAME];

  if (!isNonEmptyString(token)) {
    return null;
  }

  const decoded = jwt.verify(token, APP_JWT_SECRET);
  const userId = Number(decoded.sub);

  if (!Number.isFinite(userId)) {
    return null;
  }

  const results = await queryAsync(
    'SELECT id, username, email, role, approved, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (results.length === 0) {
    return null;
  }

  return results[0];
};


const verifyPassword = (plainPassword, storedPassword, callback) => {
  if (typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
    bcrypt.compare(plainPassword, storedPassword, callback);
    return;
  }

  if (plainPassword === storedPassword) {
    bcrypt.hash(plainPassword, SALT_ROUNDS, (hashErr, hashedPassword) => {
      if (hashErr) {
        callback(hashErr);
        return;
      }

      callback(null, true, hashedPassword);
    });
    return;
  }

  callback(null, false);
};

// MariaDB [cinterlabs]> desc users;
// +------------+----------------------+------+-----+---------------------+-------------------------------+
// | Field      | Type                 | Null | Key | Default             | Extra                         |
// +------------+----------------------+------+-----+---------------------+-------------------------------+
// | id         | int(11)              | NO   | PRI | NULL                | auto_increment                |
// | username   | varchar(50)          | NO   | UNI | NULL                |                               |
// | password   | varchar(255)         | NO   |     | NULL                |                               |
// | email      | varchar(100)         | NO   | UNI | NULL                |                               |
// | role       | enum('admin','user') | NO   |     | user                |                               |
// | created_at | timestamp            | YES  |     | current_timestamp() |                               |
// | updated_at | timestamp            | YES  |     | current_timestamp() | on update current_timestamp() |
// | approved   | tinyint(1)           | YES  |     | 0                   |                               |
// +------------+----------------------+------+-----+---------------------+-------------------------------+


/**
 * Adds a new user to the database.
 *
 * @function addUser
 * @param {Object} req - Express request object containing user details in req.body.
 * @param {string} req.body.username - The username of the new user.
 * @param {string} req.body.password - The password of the new user.
 * @param {string} req.body.email - The email address of the new user.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */
exports.addUser = (req, res) => {
  const { username, password, email } = req.body;

  if (!isNonEmptyString(username) || !isNonEmptyString(password) || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid username, email, and password are required' });
  }

  bcrypt.hash(password, SALT_ROUNDS, (hashErr, hashedPassword) => {
    if (hashErr) {
      console.error('Error hashing password:', hashErr);
      res.status(500).json({ error: 'Failed to add user' });
      return;
    }

    const query = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
    connection.query(query, [username.trim(), hashedPassword, email.trim().toLowerCase()], (err, results) => {
      if (err) {
        console.error('Error adding user:', err);
        res.status(500).json({ error: 'Failed to add user' });
        return;
      }
      res.status(201).json({ message: 'User added successfully', results });
    });
  });
};

/** * Approves a user by updating their status in the database.
 *
 * @function approveUser
 * @param {Object} req - Express request object containing user details in req.body.
 * @param {string} req.body.email - The email address of the user to approve.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */
exports.approveUser = (req, res) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const query = 'UPDATE users SET approved = 1 WHERE email = ?';
  connection.query(query, [normalizeEmail(email)], (err, results) => {
    if (err) {
      console.error('Error approving user:', err);
      res.status(500).json({ error: 'Failed to approve user' });
      return;
    }
    res.status(200).json({ message: 'User approved successfully', results });
  });
};

/** * Restricts a user by updating their status in the database.
 *
 * @function restrictUser
 * @param {Object} req - Express request object containing user details in req.body.
 * @param {string} req.body.email - The email address of the user to restrict.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */
exports.restrictUser = (req, res) => { 
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  const query = 'UPDATE users SET approved = 0 WHERE email = ?';
  connection.query(query, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error('Error restricting user:', err);
      res.status(500).json({ error: 'Failed to restrict user' });
      return;
    }
    res.status(200).json({ message: 'User restricted successfully', results });
  });
};

/** * Retrieves all users from the database.
 *
 * @function getUsers
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with an array of users on success, or an error message on failure.
 */ 

exports.getUsers = (req, res) => {
  const query = `
    SELECT
      u.*,
      COALESCE(sample_stats.uploaded_sample_count, 0) AS uploaded_sample_count,
      COALESCE(sample_stats.uploaded_samples, '') AS uploaded_samples
    FROM users u
    LEFT JOIN (
      SELECT
        LOWER(TRIM(s.email)) AS email,
        COUNT(DISTINCT s.isolate_code) AS uploaded_sample_count,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            s.isolate_code,
            '::',
            COALESCE(i.type_of_sample, 'Unknown sample'),
            '::',
            COALESCE(i.sampling_site, 'Unknown site')
          )
          ORDER BY s.isolate_code SEPARATOR '||'
        ) AS uploaded_samples
      FROM is_shared_to s
      LEFT JOIN isolate i ON i.isolate_code = s.isolate_code
      GROUP BY LOWER(TRIM(s.email))
    ) sample_stats ON sample_stats.email = LOWER(TRIM(u.email))
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }

    const users = results.map((row) => {
      const safeRow = sanitizeUserRow(row);
      const uploadedSamples = typeof row.uploaded_samples === 'string' && row.uploaded_samples.length > 0
        ? row.uploaded_samples.split('||').map((entry) => {
            const [isolateCode, sampleType, samplingSite] = entry.split('::');
            return {
              isolate_code: isolateCode,
              type_of_sample: sampleType,
              sampling_site: samplingSite,
            };
          })
        : [];

      return {
        ...safeRow,
        uploaded_sample_count: Number(row.uploaded_sample_count) || 0,
        uploaded_samples: uploadedSamples,
      };
    });

    res.status(200).json(users);
  });
};

/** * Checks if a user is allowed to access data based on their email and isolate code.
 * @function checkDataAccess
 * @param {Object} req - Express request object containing user details in req.body.
 * @param {string} req.body.email - The email address of the user to check.
 * @param {string} req.body.isolate_code - The isolate code to check access for.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */

exports.checkDataAccess = (req, res, next) => {
  // console.log('req.body:', req.body);

  const { email, isolate_code } = req.body;
  if (!isValidEmail(email) || !isNonEmptyString(isolate_code)) {
    return res.status(400).json({ error: 'Valid email and isolate_code are required' });
  }

  const query = 'SELECT EXISTS(SELECT 1 FROM is_shared_to WHERE email = ? AND isolate_code = ?) AS record_exists';
  connection.query(query, [email.trim().toLowerCase(), isolate_code.trim()], (err, results) => {
    if (err) {
      console.error('Error checking access:', err);
      res.status(500).json({ error: 'Failed to check access' });
      return;
    }
    if (!results[0].record_exists) {
      res.status(401).json({ error: 'Access denied' });
      return;
    }
    // If the record exists, return true
    res.json({ access: true });
  });
};

/** * Checks if a user is an admin based on their email.
 * @function checkIfAdmin
 * @param {Object} req - Express request object containing user details in req.body.
 * @param {string} req.body.email - The email address of the user to check.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */
exports.checkIfAdmin = (req, res, next) => {
  const { email } = req.body;
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const query = "SELECT role FROM users WHERE email = ? and role='admin' LIMIT 1";
  connection.query(query, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error('Error checking if admin:', err);
      res.status(500).json({ error: 'Failed to check if admin' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: 'Not admin' });
      return;
    }
    // If the user is an admin, return true
    res.json({ isAdmin: true });
  });
};


/** * Retrieves all data from the isolate table.
 * @function getAllData
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with an array of data on success, or an error message on failure.
 * 
 * @note getSharedData is for only the data that is shared to the user
 */
exports.getSharedData = (req, res) => {
  const { email } = req.query; 
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  // console.log('email:', email);
  const query = `
    SELECT isolate.* FROM isolate
    JOIN is_shared_to ON isolate.isolate_code = is_shared_to.isolate_code
    WHERE is_shared_to.email = ?
  `;
  connection.query(query, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error('Error fetching shared data:', err);
      res.status(500).json({ error: 'Failed to fetch shared data' });
      return;
    }
    res.status(200).json(results);
  });
};


// MariaDB [cinterlabs]> desc is_shared_to;
// +--------------+--------------+------+-----+---------+-------+
// | Field        | Type         | Null | Key | Default | Extra |
// +--------------+--------------+------+-----+---------+-------+
// | email        | varchar(255) | NO   | PRI | NULL    |       |
// | isolate_code | varchar(255) | NO   | PRI | NULL    |       |
// +--------------+--------------+------+-----+---------+-------+

/** * Shares data with another user by inserting a record into the is_shared_to table.
 * * @function shareDataToUser
 * @param {Object} req - Express request object containing share details in req.body.
 * @param {string} req.body.email - The email address of the user to share data with.
 * @param {string} req.body.isolate_code - The isolate code of the data to share.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with a success message and results on success, or an error message on failure.
 * 
 * @deprecated data sharing is deprecated and will be removed in future versions.
 * */
exports.shareDataToUser = (req, res) => {
  const { email, isolate_code } = req.body;
  if (!isValidEmail(email) || !isNonEmptyString(isolate_code)) {
    return res.status(400).json({ error: 'Valid email and isolate_code are required' });
  }
  const query = 'INSERT INTO is_shared_to (email, isolate_code) VALUES (?, ?)';
  connection.query(query, [email.trim().toLowerCase(), isolate_code.trim()], (err, results) => {
    if (err) {
      console.error('Error adding shared to:', err);
      res.status(500).json({ error: 'Failed to add shared to' });
      return;
    }
    res.status(201).json({ message: 'Shared to added successfully', results });
  });
};
 


/** * Authenticates a user by checking their email and password.
 * * @function authenticateUser
 * @param {Object} req - Express request object containing user credentials in req.body.
 * @param {string} req.body.email - The email address of the user.
 * @param {string} req.body.password - The password of the user.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with a success message and results on success, or an error message on failure.
 * * @note This method checks if the user is a regular user and is approved.
 * 
 * 
 * @bug This method is having issues with the query, it is not returning the expected results. Error is showing up in red in frontend.
 * */
exports.authenticateUser = (req, res) => {
  
  const { email, password } = req.body;
  if (!isValidEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }

  const query = "SELECT id, username, password, email, role, approved, created_at, updated_at FROM users WHERE email = ? AND role='user' AND approved=1 LIMIT 1";
  connection.query(query, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error('Error authenticating user:', err);
      res.status(500).json({ error: 'Failed to authenticate user' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    verifyPassword(password, results[0].password, (verifyErr, isMatch, migratedHash) => {
      if (verifyErr) {
        console.error('Error comparing password:', verifyErr);
        res.status(500).json({ error: 'Failed to authenticate user' });
        return;
      }

      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (migratedHash) {
        const safeUser = sanitizeUserRow(results[0]);
        const sessionToken = createAuthToken(safeUser);

        connection.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [migratedHash, results[0].id],
          (updateErr) => {
            if (updateErr) {
              console.warn('Failed to migrate legacy user password hash:', updateErr);
            }

            setSessionCookie(res, sessionToken);
            res.status(200).json({ message: 'User authenticated successfully', user: safeUser });
          }
        );
        return;
      }

      const safeUser = sanitizeUserRow(results[0]);
      const sessionToken = createAuthToken(safeUser);
      setSessionCookie(res, sessionToken);
      res.status(200).json({ message: 'User authenticated successfully', user: safeUser });
    });
  });
};

/** * Authenticates an admin user by checking their email and password.
 * * @function authenticateAdmin
 *  @param {Object} req - Express request object containing admin credentials in req.body.
 * @param {string} req.body.email - The email address of the admin user.
 * @param {string} req.body.password - The password of the admin user.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with a success message and results on success, or an error message on failure.
 * * @note This method checks if the user is an admin.
 * 
 * @bug This method is having issues with the query, it is not returning the expected results. Error is showing up in red in frontend.
 *
 */
exports.authenticateAdmin = (req, res) => {
  // console.log('req.body:', req.body); 
  const { email, password } = req.body;
  if (!isValidEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Valid email and password are required' });
  }

  const query = "SELECT id, username, password, email, role, approved, created_at, updated_at FROM users WHERE email = ? AND role = 'admin' LIMIT 1";
  connection.query(query, [normalizeEmail(email)], (err, results) => {
    if (err) {
      console.error('Error authenticating user:', err);
      res.status(500).json({ error: 'Failed to authenticate user' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    verifyPassword(password, results[0].password, (verifyErr, isMatch, migratedHash) => {
      if (verifyErr) {
        console.error('Error comparing password:', verifyErr);
        res.status(500).json({ error: 'Failed to authenticate user' });
        return;
      }

      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (migratedHash) {
        const safeUser = sanitizeUserRow(results[0]);
        const sessionToken = createAuthToken(safeUser);

        connection.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [migratedHash, results[0].id],
          (updateErr) => {
            if (updateErr) {
              console.warn('Failed to migrate legacy admin password hash:', updateErr);
            }

            setSessionCookie(res, sessionToken);
            res.status(200).json({ message: 'User authenticated successfully', user: safeUser });
          }
        );
        return;
      }

      const safeUser = sanitizeUserRow(results[0]);
      const sessionToken = createAuthToken(safeUser);
      setSessionCookie(res, sessionToken);
      res.status(200).json({ message: 'User authenticated successfully', user: safeUser });
    });
  });
};

exports.getSessionStatus = async (req, res) => {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      res.status(401).json({ isAuthenticated: false });
      return;
    }

    res.status(200).json({
      isAuthenticated: true,
      user: sanitizeUserRow(user),
    });
  } catch (err) {
    console.error('Error validating session:', err);
    clearSessionCookie(res);
    res.status(401).json({ isAuthenticated: false });
  }
};

exports.logout = (req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
};


/** * Gets all the data in the isolate table.
 * * @function getAllData
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with an array of data on success, or an error message on failure.
 *
 */
exports.getAllData = (req, res) => {
  const query = 'SELECT * FROM isolate';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Failed to fetch data' });
      return;
    }
    // console.log('Fetched data:', results);
    res.status(200).json(results);
  });
};

/** * Deletes data from the isolate table by isolate code.
 * * @function deleteDataByIsolateCode
 * @param {Object} req - Express request object containing isolate code in req.params.
 * @param {string} req.params.isolate_code - The isolate code of the data to delete.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with a success message and results on success, or an error message on failure.
 * * @note This method deletes data from both the is_shared_to and isolate tables.
 *
 */
exports.deleteDataByIsolateCode = (req, res) => {
  const { isolate_code } = req.params;
  const query1 = 'DELETE FROM is_shared_to WHERE isolate_code = ?';
  const query2 = 'DELETE FROM isolate WHERE isolate_code = ?';

  connection.query(query1, [isolate_code], (err, results1) => {
    if (err) {
      console.error('Error deleting data from is_shared_to:', err);
      return res.status(500).json({ error: 'Failed to delete data from is_shared_to' });
    }

    connection.query(query2, [isolate_code], (err, results2) => {
      if (err) {
        console.error('Error deleting data from isolate:', err);
        return res.status(500).json({ error: 'Failed to delete data from isolate' });
      }

      res.status(200).json({
        message: 'Data deleted successfully',
        results: {
          is_shared_to: results1,
          isolate: results2
        }
      });
    });
  });
};

/** * Adds new data to the isolate table.
 * * @function addData
 * @param {Object} req - Express request object containing data details in req.body.
 * @param {string} req.body.isolate_code - The isolate code of the new data.
 * @param {string} req.body.type_of_sample - The type of sample.
 * @param {string} req.body.bat_source - The source of the bat sample.
 * @param {string} req.body.sampling_site - The site where the sample was collected.
 */
exports.addData = (req, res) => {
  const {
    isolate_code, type_of_sample, bat_source, sampling_site, gram_reaction, cell_shape,
    oxygen_requirement, presence_of_cytochrome_c_oxidase, endospore_forming_capability,
    antibiotic_resistance_profile, identity, pathogenicity, gene_seq, image_url,
  } = req.body;

  const query = `
    INSERT INTO isolate (
      isolate_code, type_of_sample, bat_source, sampling_site, gram_reaction, cell_shape,
      oxygen_requirement, presence_of_cytochrome_c_oxidase, endospore_forming_capability,
      antibiotic_resistance_profile, identity, pathogenicity, gene_seq, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [
      isolate_code, type_of_sample, bat_source, sampling_site, gram_reaction, cell_shape,
      oxygen_requirement, presence_of_cytochrome_c_oxidase, endospore_forming_capability,
      antibiotic_resistance_profile, identity, pathogenicity, gene_seq, image_url
    ],
    (err, results) => {
      if (err) {
        console.error('Error adding data:', err);
        res.status(500).json({ error: 'Failed to add data' });
        return;
      }
      res.status(201).json({ message: 'Data added successfully', results });
    }
  );
};

/** * Edits data in the isolate table by isolate code.
 * * @function editDataByIsolateCode
 * @param {Object} req - Express request object containing isolate code in req.params and data details in req.body.
 *  @param {string} req.params.isolate_code - The isolate code of the data to edit.
 * @param {Object} req.body - The data to update in the isolate table.
 * @param {string} req.body.type_of_sample - The type of sample.
 * @param {string} req.body.bat_source - The source of the bat sample.
 * @param {string} req.body.sampling_site - The site where the sample was collected.
 * @param {string} req.body.gram_reaction - The gram reaction of the sample.
 * @param {string} req.body.cell_shape - The shape of the cells in the sample.
 * @param {string} req.body.oxygen_requirement - The oxygen requirement of the sample.
 * @param {string} req.body.presence_of_cytochrome_c_oxidase - The presence of cytochrome c oxidase in the sample.
 * @param {string} req.body.endospore_forming_capability - The endospore forming capability of the sample.
 * @param {string} req.body.antibiotic_resistance_profile - The antibiotic resistance profile of the sample.
 * @param {string} req.body.identity - The identity of the sample.
 * @param {string} req.body.pathogenicity - The pathogenicity of the sample.
 * @param {string} req.body.gene_seq - The gene sequence of the sample.
 * @param {string} req.body.image_url - The URL of the image associated with the sample.
 * @param {Object} res - Express response object used to send the result.
 * @returns {void} Responds with a success message and results on success, or an error message on failure.
 */
exports.editDataByIsolateCode = (req, res) => {
  const { isolate_code } = req.params;
  const {
    type_of_sample, bat_source, sampling_site, gram_reaction, cell_shape,
    oxygen_requirement, presence_of_cytochrome_c_oxidase, endospore_forming_capability,
    antibiotic_resistance_profile, identity, pathogenicity, gene_seq, image_url,
  } = req.body;

  const query = `
    UPDATE isolate SET
      type_of_sample = ?, bat_source = ?, sampling_site = ?, gram_reaction = ?,
      cell_shape = ?, oxygen_requirement = ?, presence_of_cytochrome_c_oxidase = ?,
      endospore_forming_capability = ?, antibiotic_resistance_profile = ?,
      identity = ?, pathogenicity = ?, gene_seq = ?, image_url = ?
    WHERE isolate_code = ?
  `;

  connection.query(
    query,
    [
      type_of_sample, bat_source, sampling_site, gram_reaction, cell_shape,
      oxygen_requirement, presence_of_cytochrome_c_oxidase, endospore_forming_capability,
      antibiotic_resistance_profile, identity, pathogenicity, gene_seq, image_url, isolate_code
    ],
    (err, results) => {
      if (err) {
        console.error('Error editing data:', err);
        res.status(500).json({ error: 'Failed to edit data' });
        return;
      }
      res.status(200).json({ message: 'Data edited successfully', results });
    }
  );
}



/**
 * Performs a BLASTN search using the provided sequence.
 *
 * @function blastn
 * @param {Object} req - Express request object containing the sequence in req.body.
 * @param {string} req.body.sequence - The nucleotide sequence to search.
 * @param {Object} res - Express response object used to send the result.
 *
 * @returns {void} Responds with the BLASTN results on success,
 * or an error message on failure.
 */

exports.blastn = (req, res) => {
  const sequence = req.body.sequence;

  if (!sequence || sequence.trim() === '') {
    return res.status(400).json({
      error: 'Sequence is required and cannot be empty',
    });
  }

  if (!/^[ACGTRYSWKMBDHVN\s>\-\n\r]+$/i.test(sequence.trim())) {
    return res.status(400).json({
      error: 'Sequence contains invalid characters',
    });
  }

  const tempFastaFile = path.join(__dirname, 'temp_sequence.fa');
  const dbFilePath = path.join(__dirname, 'data', 'mybatdb');

  // ---------------------------------------------------------
  // Ensure BLAST database files exist
  // ---------------------------------------------------------

  const requiredFiles = ['.nhr', '.nin', '.nsq'];

  for (const ext of requiredFiles) {
    if (!fs.existsSync(`${dbFilePath}${ext}`)) {
      return res.status(500).json({
        error: `Database file ${dbFilePath}${ext} is missing.`,
      });
    }
  }

  // ---------------------------------------------------------
  // Prepare FASTA input
  // ---------------------------------------------------------

  const fastaContent = sequence.trim().startsWith('>')
    ? sequence.trim()
    : `>query\n${sequence.trim()}\n`;

  try {
    fs.writeFileSync(tempFastaFile, fastaContent, 'utf8');
  } catch (writeErr) {
    console.error('Error writing temporary FASTA file:', writeErr);

    return res.status(500).json({
      error: 'Failed to write temporary FASTA file',
    });
  }

  // ---------------------------------------------------------
  // BLAST output fields
  // ---------------------------------------------------------

  /*
   * qseqid    = Query sequence ID
   * stitle    = Subject/matched sequence title
   * pident    = Percentage of identical matches
   * length    = Alignment length
   * mismatch  = Number of mismatches
   * gapopen   = Number of gap openings
   * evalue    = Expect value
   * bitscore  = Bit score
   *
   * qstart/qend/sstart/send are omitted because they are
   * not needed for the main results table.
   */

  const outfmtFields =
    'qseqid stitle pident length mismatch gapopen evalue bitscore';

  const commandArgs = [
    '-query', tempFastaFile,
    '-db', dbFilePath,
    '-outfmt', `6 ${outfmtFields}`,
  ];

  execFile(
    'blastn',
    commandArgs,
    { maxBuffer: 10 * 1024 * 1024 },
    (error, stdout, stderr) => {

      // -----------------------------------------------------
      // Clean up temporary FASTA file
      // -----------------------------------------------------

      try {
        if (fs.existsSync(tempFastaFile)) {
          fs.unlinkSync(tempFastaFile);
        }
      } catch (cleanupErr) {
        console.warn(
          'Failed to remove temporary FASTA file:',
          cleanupErr
        );
      }

      // -----------------------------------------------------
      // Handle BLAST execution errors
      // -----------------------------------------------------

      if (error) {
        console.error('Error executing blastn:', error);

        return res.status(500).json({
          error: error.message || 'BLAST execution failed',
        });
      }

      // BLAST may write warnings to stderr even when successful
      if (stderr) {
        console.warn('BLAST stderr:', stderr);
      }

      // -----------------------------------------------------
      // No BLAST matches
      // -----------------------------------------------------

      if (!stdout || stdout.trim() === '') {
        return res.status(200).json({
          columns: [
            'querySequenceId',
            'matchedSequence',
            'percentIdentity',
            'alignmentLength',
            'mismatchCount',
            'gapOpenings',
            'eValue',
            'bitScore',
          ],
          rows: [],
        });
      }

      // -----------------------------------------------------
      // Parse BLAST output
      // -----------------------------------------------------

      const blastColumns = outfmtFields.split(/\s+/);

      const columnNames = {
        qseqid: 'querySequenceId',
        stitle: 'matchedSequence',
        pident: 'percentIdentity',
        length: 'alignmentLength',
        mismatch: 'mismatchCount',
        gapopen: 'gapOpenings',
        evalue: 'eValue',
        bitscore: 'bitScore',
      };

      const numericFields = new Set([
        'pident',
        'length',
        'mismatch',
        'gapopen',
        'evalue',
        'bitscore',
      ]);

      // -----------------------------------------------------
      // Parse biological metadata from stitle
      // -----------------------------------------------------

      const parseMetadata = (title) => {
        if (!title) {
          return {
            isolateCode: null,
            sampleType: null,
            batSource: null,
            samplingSite: null,
            gramReaction: null,
            cellShape: null,
            oxygenRequirement: null,
            cytochromeCOxidase: null,
            endosporeFormation: null,
            antibioticResistanceProfile: null,
            identity: null,
            pathogenicity: null,
          };
        }

        /*
         * Example stitle:
         *
         * B1I1
         * |Bat fecal pellet
         * |Rhinolophus rufus
         * |Cavinti Underground River and Cave Complex, Cavinti, Laguna
         * |Gram-negative
         * |Rod-shaped
         * |Facultative anaerobe
         * |Oxidase-negative
         * |Non-endospore-forming
         * |Escherichia coli
         * |Potentially pathogenic to humans
         */

        const metadata = title
          .split('|')
          .map((value) => value.trim());

        return {
          isolateCode: metadata[0] || null,

          sampleType: metadata[1] || null,

          batSource: metadata[2] || null,

          samplingSite: metadata[3] || null,

          gramReaction: metadata[4] || null,

          cellShape: metadata[5] || null,

          oxygenRequirement: metadata[6] || null,

          cytochromeCOxidase: metadata[7] || null,

          endosporeFormation: metadata[8] || null,

          /*
           * Your current metadata does not contain an
           * antibiotic resistance field, so leave this
           * as null for now.
           */
          antibioticResistanceProfile: null,

          identity: metadata[9] || null,

          pathogenicity: metadata[10] || null,
        };
      };

      // -----------------------------------------------------
      // Parse each BLAST row
      // -----------------------------------------------------

      const rows = stdout
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim() !== '')
        .map((line) => {
          const parts = line.split('\t');
          const row = {};

          for (let i = 0; i < blastColumns.length; i++) {
            const blastColumn = blastColumns[i];
            const jsonColumn = columnNames[blastColumn];

            const value =
              parts[i] !== undefined && parts[i] !== ''
                ? parts[i]
                : null;

            if (value === null) {
              row[jsonColumn] = null;
            } else if (numericFields.has(blastColumn)) {
              row[jsonColumn] = Number(value);
            } else {
              row[jsonColumn] = value;
            }
          }

          // Parse the metadata contained in stitle
          row.metadata = parseMetadata(row.matchedSequence);

          return row;
        });

      // -----------------------------------------------------
      // Return frontend-ready JSON
      // -----------------------------------------------------

      return res.status(200).json({
        columns: [
          'querySequenceId',
          'matchedSequence',
          'percentIdentity',
          'alignmentLength',
          'mismatchCount',
          'gapOpenings',
          'eValue',
          'bitScore',
        ],
        rows,
      });
    }
  );
};