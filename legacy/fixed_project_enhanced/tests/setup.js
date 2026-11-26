/**
 * tests/setup.js — Global test setup
 * Runs once before all test suites.
 * Creates the test database if it doesn't exist.
 */

const mysql = require('mysql');
require('dotenv').config({ path: '.env.test' });

module.exports = async function globalSetup() {
  const conn = mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  return new Promise((resolve, reject) => {
    conn.connect((err) => {
      if (err) {
        // If DB isn't available, skip setup (tests will fail naturally)
        console.warn('[TEST SETUP] DB connect failed — tests may fail:', err.message);
        return resolve();
      }

      const testDB = process.env.TEST_DB_NAME || 'workforce_intelligence_test';

      conn.query(`CREATE DATABASE IF NOT EXISTS \`${testDB}\``, (err) => {
        if (err) {
          console.warn('[TEST SETUP] Could not create test DB:', err.message);
        } else {
          console.log(`[TEST SETUP] Test database "${testDB}" ready`);
        }
        conn.end(() => resolve());
      });
    });
  });
};
