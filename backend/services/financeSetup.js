const { query } = require('./database');
const directory = require('../config/bankDirectory.json');

async function ensureSchema(connection) {
  await query(connection, `CREATE TABLE IF NOT EXISTS bank_directory (
    bank_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    checked_on DATE NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await query(connection, `CREATE TABLE IF NOT EXISTS credit_profiles (
    user_id INT PRIMARY KEY,
    bureau ENUM('CIBIL','Experian','Equifax','CRIF High Mark') NOT NULL,
    score SMALLINT NOT NULL,
    checked_on DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [column] = await query(connection, `SELECT COLUMN_TYPE FROM information_schema.columns
    WHERE table_schema=DATABASE() AND table_name='tax_declarations' AND column_name='status'`);
  if (!column.COLUMN_TYPE.includes("'rejected'")) {
    await query(connection, "ALTER TABLE tax_declarations MODIFY status ENUM('draft','submitted','approved','rejected') DEFAULT 'draft'");
  }
  await seedDirectory(connection);
}

async function seedDirectory(connection) {
  if ((await query(connection,'SELECT bank_id FROM bank_directory LIMIT 1')).length) return;
  const rows = directory.banks.map(bank => [bank.name,bank.category,bank.website_url,directory.source,directory.checked_on]);
  await query(connection,'INSERT IGNORE INTO bank_directory (name,category,website_url,source_url,checked_on) VALUES ?',[rows]);
}

async function seed(connection) {
  await seedDirectory(connection);
  await query(connection, `INSERT IGNORE INTO company_settings (setting_key,setting_value)
    VALUES ('loan_min_tenure_months','12'),('loan_max_tenure_months','84'),('loan_max_monthly_emi_pct','40')`);
  const bcrypt = require('bcryptjs');
  const password = await bcrypt.hash('P123/', 12);
  const [manager] = await query(connection, "SELECT user_id,department_id FROM users WHERE email='manager@wfintelligence.com'");
  for (const [name,email,salary,joined,score] of [
    ['Demo Finance Ready','finance-ready@example.test',75000,'2022-04-01',760],
    ['Demo Finance New Starter','finance-new@example.test',55000,new Date().toISOString().slice(0,10),null],
    ['Demo Finance No Salary','finance-no-salary@example.test',0,'2022-04-01',620],
  ]) {
    await query(connection, `INSERT IGNORE INTO users
      (full_name,email,password_hash,role_id,status,base_salary,join_date,department_id,reporting_manager_id)
      VALUES (?,?,?,2,'active',?,?,?,?)`, [name,email,password,salary,joined,manager?.department_id || null,manager?.user_id || null]);
    const [user] = await query(connection, 'SELECT user_id FROM users WHERE email=?', [email]);
    await query(connection, 'INSERT IGNORE INTO user_permissions (user_id) VALUES (?)', [user.user_id]);
    if (score) await query(connection, `INSERT IGNORE INTO credit_profiles (user_id,bureau,score,checked_on)
      VALUES (?,'CIBIL',?,CURRENT_DATE)`, [user.user_id,score]);
  }
}

module.exports = { ensureSchema, seed };
