const mysql = require('mysql');

module.exports = async function globalSetup() {
  const database = process.env.TEST_DB_NAME || 'workforce_intelligence_test';
  if (!/^[a-zA-Z0-9_]+_test$/.test(database)) throw new Error('Integration tests require an isolated database ending in _test.');
  process.env.DB_NAME = database;
  const connection = mysql.createConnection({
    host:process.env.DB_HOST || 'localhost',
    port:Number(process.env.DB_PORT || 3306),
    user:process.env.DB_USER || 'wfi_test',
    password:process.env.DB_PASSWORD || '',
    database,charset:'utf8mb4'
  });
  const query = (sql,args) => new Promise((resolve,reject) => connection.query(sql,args || [],(error,rows) => error ? reject(error) : resolve(rows)));
  try {
    await query('SELECT id FROM wfi_bootstrap WHERE id=1');
    await require('../backend/services/demoBootstrap').bootstrap();
  } finally {
    await new Promise(resolve => connection.end(resolve));
    await new Promise(resolve => require('../backend/config/db').end(resolve));
  }
};
