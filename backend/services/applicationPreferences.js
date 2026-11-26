const { query } = require("./database");
const database = require("../config/db");
/** Additive schema changes preserve every existing workforce record. */
async function ensure(connection) {
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS companies(company_id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(150) NOT NULL UNIQUE,is_active BOOLEAN NOT NULL DEFAULT TRUE)`,
  );
  const companyName = process.env.COMPANY_NAME || "Workforce Intelligence";
  await query(connection, `INSERT IGNORE INTO companies(name)
    SELECT ? WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name=?)`, [companyName, companyName]);
  async function column(table, name, definition) {
    const rows = await query(
      connection,
      "SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?",
      [table, name],
    );
    if (!rows.length)
      await query(connection, "ALTER TABLE ?? ADD COLUMN ?? " + definition, [
        table,
        name,
      ]);
  }
  await column(
    "users",
    "company_id",
    "INT NULL REFERENCES companies(company_id)",
  );
  const foreignKeys = await query(
    connection,
    "SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='company_id' AND REFERENCED_TABLE_NAME='companies'",
  );
  if (!foreignKeys.length)
    await query(
      connection,
      "ALTER TABLE users ADD FOREIGN KEY(company_id) REFERENCES companies(company_id)",
    );
  const [company] = await query(
    connection,
    "SELECT company_id FROM companies WHERE is_active=1 ORDER BY company_id LIMIT 1",
  );
  if (company)
    await query(
      connection,
      "UPDATE users SET company_id=? WHERE company_id IS NULL",
      [company.company_id],
    );
  await column("loan_applications", "vehicle_kind", "VARCHAR(25) NULL");
  await column(
    "meetings",
    "meeting_provider",
    "VARCHAR(30) NOT NULL DEFAULT 'internal'",
  );
  await column("meetings", "cancellation_reason", "VARCHAR(500) NULL");
  await column("meetings", "meeting_url", "VARCHAR(1000) NULL");
  await column("user_sessions", "ip_address", "VARCHAR(45) NULL");
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS application_preferences(user_id INT PRIMARY KEY,theme VARCHAR(15) NOT NULL DEFAULT 'system',updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE)`,
  );
  await column("application_preferences", "accent", "VARCHAR(15) NOT NULL DEFAULT 'default'");
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS attendance_security_audit(audit_id INT AUTO_INCREMENT PRIMARY KEY,attendance_id INT NOT NULL,actor_id INT NOT NULL,action VARCHAR(20) NOT NULL,verification_method VARCHAR(20) NOT NULL,ip_address VARCHAR(45),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(attendance_id) REFERENCES attendance(attendance_id),FOREIGN KEY(actor_id) REFERENCES users(user_id))`,
  );
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS payslip_downloads(download_id INT AUTO_INCREMENT PRIMARY KEY,salary_id INT NOT NULL,actor_id INT NOT NULL,ip_address VARCHAR(45),downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(salary_id) REFERENCES salary_records(salary_id),FOREIGN KEY(actor_id) REFERENCES users(user_id))`,
  );
  await query(connection, `CREATE TABLE IF NOT EXISTS payslip_corrections (
    correction_id INT AUTO_INCREMENT PRIMARY KEY, salary_id INT NOT NULL,
    actor_id INT NOT NULL, reason VARCHAR(500) NOT NULL, previous_record JSON NOT NULL,
    previous_items JSON NOT NULL, corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(salary_id) REFERENCES salary_records(salary_id),
    FOREIGN KEY(actor_id) REFERENCES users(user_id))`);

}
async function get(userId) {
  const [preference] = await query(
    database,
    "SELECT theme,accent FROM application_preferences WHERE user_id=?",
    [userId],
  );
  return { theme: preference?.theme || "system", accent: preference?.accent || "default" };
}
async function save(userId, { theme, accent }) {
  const themes = ["system", "light", "day", "night", "dark"];
  const accents = require("../../frontend/appearance-accents.json").map(({id}) => id);
  if (!themes.includes(theme) || (accent !== undefined && !accents.includes(accent))) {
    throw Object.assign(new Error("Choose a supported theme and accent."), { status: 400 });
  }
  // Existing callers such as the quick appearance toggle update only the theme.
  await query(database, `INSERT INTO application_preferences(user_id,theme,accent) VALUES (?,?,?)
    ON DUPLICATE KEY UPDATE theme=VALUES(theme), accent=IF(?,VALUES(accent),accent)`,
  [userId, theme, accent ?? "default", accent !== undefined]);
  return get(userId);
}

module.exports = { ensure, get, save };
