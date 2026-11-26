const pool = require('../config/db');

function query(connection, sql, params = []) {
  return new Promise((resolve, reject) => connection.query(sql, params,
    (error, result) => error ? reject(error) : resolve(result)));
}

async function transaction(work) {
  const connection = await new Promise((resolve, reject) => pool.getConnection(
    (error, value) => error ? reject(error) : resolve(value)));
  try {
    await query(connection, 'START TRANSACTION');
    const result = await work((sql, params) => query(connection, sql, params));
    await query(connection, 'COMMIT');
    return result;
  } catch (error) {
    await query(connection, 'ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { query, transaction };
