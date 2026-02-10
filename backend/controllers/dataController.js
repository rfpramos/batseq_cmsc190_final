
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
const { exec } = require('child_process'); // exec function to execute shell commands
const path = require('path'); // path module for handling file paths


// How the Database is shown in the MySQL CLI:
// MySQL [cinterlabs]> desc users;
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
  const query = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
  connection.query(query, [username, password, email], (err, results) => {
    if (err) {
      console.error('Error adding user:', err);
      res.status(500).json({ error: 'Failed to add user' });
      return;
    }
    res.status(201).json({ message: 'User added successfully', results });
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
  const query = 'UPDATE users SET approved = 1 WHERE email = ?';
  connection.query(query, [email], (err, results) => {
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
  const query = 'UPDATE users SET approved = 0 WHERE email = ?';
  connection.query(query, [email], (err, results) => {
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
  const query = 'SELECT * FROM users';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }
    res.status(200).json(results);
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
  const query = 'SELECT EXISTS(SELECT 1 FROM is_shared_to WHERE email = ? AND isolate_code = ?) AS record_exists';
  connection.query(query, [email, isolate_code], (err, results) => {
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
  const query = 'SELECT role FROM users WHERE email = ? and role="admin"';
  connection.query(query, [email], (err, results) => {
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
  // console.log('email:', email);
  const query = `
    SELECT isolate.* FROM isolate
    JOIN is_shared_to ON isolate.isolate_code = is_shared_to.isolate_code
    WHERE is_shared_to.email = ?
  `;
  connection.query(query, [email], (err, results) => {
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
  const query = 'INSERT INTO is_shared_to (email, isolate_code) VALUES (?, ?)';
  connection.query(query, [email, isolate_code], (err, results) => {
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
  const query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role="user" AND approved=1';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error authenticating user:', err);
      res.status(500).json({ error: 'Failed to authenticate user' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.status(200).json({ message: 'User authenticated successfully', results });
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
  const query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = "admin"';
  connection.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error authenticating user:', err);
      res.status(500).json({ error: 'Failed to authenticate user' });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    res.status(200).json({ message: 'User authenticated successfully', results });
  });
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


/** * Performs a BLASTN search using the provided sequence.
 * * @function blastn
 * @param {Object} req - Express request object containing the sequence in req.body.
 * @param {string} req.body.sequence - The nucleotide sequence to search.
 * @param {Object} res - Express response object used to send the result.
 * * @returns {void} Responds with the BLASTN results on success, or an error message on failure.
 * * @note This method writes the sequence to a temporary FASTA file, executes the BLASTN command,
 * and returns the results.
 * 
 * @todo Return a frontend-ready JSON object with the BLASTN results.
 */
exports.blastn = (req, res) => {
  const sequence = req.body.sequence;

  if (!sequence || sequence.trim() === '') {
    return res.status(400).json({ error: 'Sequence is required and cannot be empty' });
  }

  const tempFastaFile = path.join(__dirname, 'temp_sequence.fa');
  const dbFilePath = path.join(__dirname, 'data', 'mybatdb'); // Path to the BLAST database

  // Ensure BLAST DB files exist
  const requiredFiles = ['.nhr', '.nin', '.nsq'];
  for (const ext of requiredFiles) {
    if (!fs.existsSync(`${dbFilePath}${ext}`)) {
      return res.status(500).json({ error: `Database file ${dbFilePath}${ext} is missing.` });
    }
  }

  // Prepare FASTA: add header if not provided
  const fastaContent = sequence.trim().startsWith('>') ? sequence.trim() : `>query\n${sequence.trim()}\n`;

  try {
    fs.writeFileSync(tempFastaFile, fastaContent, 'utf8');
  } catch (writeErr) {
    console.error('Error writing temp FASTA file:', writeErr);
    return res.status(500).json({ error: 'Failed to write temporary FASTA file' });
  }

  // Use tabular outfmt for easy parsing
  const outfmtFields = 'qseqid stitle  pident length mismatch gapopen qstart qend sstart send evalue bitscore';
  const command = `blastn -query "${tempFastaFile}" -db "${dbFilePath}" -outfmt "6 ${outfmtFields}"`;

  exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    // Clean up temp file
    try {
      if (fs.existsSync(tempFastaFile)) fs.unlinkSync(tempFastaFile);
    } catch (cleanupErr) {
      console.warn('Failed to remove temp FASTA file:', cleanupErr);
    }

    if (error) {
      console.error('Error executing blastn:', error);
      return res.status(500).json({ error: error.message || 'BLAST execution failed' });
    }
    if (stderr) {
      // BLAST writes warnings to stderr sometimes; don't always treat as fatal.
      console.warn('BLAST stderr:', stderr);
    }

    // Parse tabular output into JSON table
    const columns = outfmtFields.split(' ');
    const rows = stdout
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.split('\t');
        const obj = {};
        for (let i = 0; i < columns.length; i++) {
          // convert numeric-looking fields to numbers where appropriate
          const colName = columns[i];
          const val = parts[i] === undefined ? null : parts[i];
          if (val === null) {
            obj[colName] = null;
          } else if (['pident', 'length', 'mismatch', 'gapopen', 'qstart', 'qend', 'sstart', 'send'].includes(colName)) {
            obj[colName] = Number(val);
          } else if (['evalue', 'bitscore'].includes(colName)) {
            obj[colName] = Number(val);
          } else {
            obj[colName] = val;
          }
        }
        return obj;
      });

    // Return frontend-ready JSON table: columns + rows
    return res.status(200).json({ columns, rows });
  });
};