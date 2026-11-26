/**
 * db.js — MySQL Connection v6.0 FIXED
 * Uses mysql (not mysql2) to maintain callback compatibility with all models.
 * mysql2 pool was causing silent failures on registration.
 */
const mysql  = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'workforce_intelligence',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           'local'
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌  MySQL connection error:', err.code, '—', err.message);
    console.error('    Fix: check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in .env');
  } else {
    console.log(`✅  MySQL ready — ${process.env.DB_NAME || 'workforce_intelligence'} @ ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
  }
});

module.exports = pool;
