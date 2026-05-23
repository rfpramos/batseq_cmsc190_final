const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
  acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT_MS || 5000),
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
