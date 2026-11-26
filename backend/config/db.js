/**
 * db.js — MySQL Connection Pool
 *
 * Docker  → DB_HOST=db     (set in docker-compose environment)
 * Local   → DB_HOST=localhost (set in .env)
 */
const mysql  = require('mysql');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             parseInt(process.env.DB_PORT || '3306'),
  user:             process.env.DB_USER     || 'wfi_user',
  password:         process.env.DB_PASSWORD || 'P123/',
  database:         process.env.DB_NAME     || 'workforce_intelligence',
  waitForConnections: true,
  connectionLimit:  20,
  queueLimit:       0,
  charset:          'utf8mb4',
  timezone:         'local',
  acquireTimeout:   10000,
  connectTimeout:   10000,
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    const code = err.code || 'UNKNOWN';
    console.error(`❌  MySQL FAILED [${code}]: ${err.message}`);
    console.error(`    Host : ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.error(`    DB   : ${process.env.DB_NAME || 'workforce_intelligence'}`);
    console.error(`    User : ${process.env.DB_USER || 'wfi_user'}`);
    if ((process.env.DB_HOST || 'localhost') === 'db') {
      console.error('    → Docker: ensure MySQL container is running (docker compose up -d)');
    } else {
      console.error('    → Local : ensure MySQL is running and .env values are correct');
      console.error('    → Setup : mysql -u root -p  then run database/init/*.sql');
    }
  } else {
    console.log(`✅  MySQL connected — ${process.env.DB_NAME || 'workforce_intelligence'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
  }
});

module.exports = pool;
