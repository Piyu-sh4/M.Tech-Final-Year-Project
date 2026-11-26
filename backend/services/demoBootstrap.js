const pool = require('../config/db');
const catalog = require('../config/moduleCatalog');

const { query } = require('./database');

async function bootstrap() {
  require('./demo/seedReviewCoverage').ensureFiles();
  const conn = await new Promise((resolve, reject) =>
    pool.getConnection((error, connection) => error ? reject(error) : resolve(connection)));
  try {
    await query(conn, 'SELECT id FROM wfi_bootstrap WHERE id = 1');
    const [lock] = await query(conn, "SELECT GET_LOCK(CONCAT(DATABASE(), ':wfi:demo'), 30) AS locked");
    if (lock.locked !== 1) throw new Error('Could not acquire demo migration lock');
    await query(conn, 'CREATE TABLE IF NOT EXISTS demo_migrations (version VARCHAR(80) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    await require('./financeSetup').ensureSchema(conn);
    await require('./workforceDecisions').ensure(conn);
    await require('./applicationPreferences').ensure(conn);
    await require('./passkeys').ensure(conn);
    await require('./bankingEncryption').ensure(conn);
    await require('./workflows').ensure(conn);
    await require('./buildRequests').ensure(conn);
    await require('./meetingPasswords').ensure(conn);
    await require('./cashAdvances').ensure(conn);
    await require('./trainingSetup').ensure(conn);
    await require('./signOutFeedback').ensure(conn);
    await require('./passwordRecovery').ensure(conn);
    await runOnce(conn, '2026-11-skill-learning-paths', () => require('./trainingSetup').seed(conn));
    await runOnce(conn, '2026-11-training-assessments', () => require('./trainingSetup').seedAssessments(conn));
    await runOnce(conn, '2026-11-training-curriculum', () => require('./trainingSetup').seedCurriculum(conn));
    await runOnce(conn, '2026-11-training-curriculum-videos', () => require('./trainingSetup').seedCurriculumVideos(conn));
    await query(conn, `CREATE TABLE IF NOT EXISTS demo_module_records (
      record_id INT AUTO_INCREMENT PRIMARY KEY,
      module_slug VARCHAR(64) NOT NULL,
      owner_id INT NULL,
      title VARCHAR(150) NOT NULL,
      details VARCHAR(1500) NOT NULL DEFAULT '',
      status VARCHAR(45) NOT NULL,
      target_date DATE NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX module_owner (module_slug, owner_id),
      FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`);
    await runOnce(conn, '2026-11-demo-modules-v1', async () => {
      const accounts = await query(conn, `SELECT user_id, email FROM users
        WHERE email IN ('admin@wip.com','employee@wfintelligence.com','piyush.sharma@wip.com','manager@wfintelligence.com','hr@wfintelligence.com')`);
      const ids = Object.fromEntries(accounts.map(u => [u.email, u.user_id]));
      const admin = ids['admin@wip.com'];
      const employees = ['employee@wfintelligence.com','piyush.sharma@wip.com'].map(email => ids[email]);
      if (!admin || employees.some(id => !id)) throw new Error('Expected demo accounts are missing');
      // Drop contact and identity fields that aren't needed to demonstrate HR workflows.
      await query(conn, 'UPDATE users SET phone=NULL, address=NULL, emergency_contact=NULL, date_of_birth=NULL, profile_notes=NULL');
      for (const entry of Object.values(catalog).filter(x => x.states && x.slug !== 'lwf-tracker')) {
        for (const owner of entry.scope === 'own' ? [...employees, admin] : [null]) {
          await query(conn, `INSERT INTO demo_module_records
            (module_slug, owner_id, title, details, status, target_date)
            VALUES (?, ?, ?, ?, ?, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY))`,
          [entry.slug, owner, entry.example, entry.details, entry.states[0]]);
        }
      }
      const checkinUsers = [...employees, admin, ids['manager@wfintelligence.com'], ids['hr@wfintelligence.com']].filter(Boolean);
      for (const id of checkinUsers) {
        for (const [offset, status, hours] of [[1,'present',8], [2,'late',7.5], [5,'present',8], [6,'present',8]]) {
          await query(conn, `INSERT IGNORE INTO attendance (user_id, work_date, clock_in, clock_out, status, total_hours, remarks)
            SELECT ?, d, TIMESTAMP(d,'09:00:00'), TIMESTAMP(d,'17:00:00'), ?, ?, 'Demo attendance'
            FROM (SELECT DATE_SUB(CURRENT_DATE, INTERVAL ? DAY) AS d) dates`, [id, status, hours, offset]);
        }
        for (const [type, days] of [['casual',12],['sick',12],['earned',15]]) {
          await query(conn, 'INSERT IGNORE INTO leave_balances (user_id, year, leave_type, entitled) VALUES (?, YEAR(CURRENT_DATE), ?, ?)',
            [id, type, days]);
        }
      }
      for (const id of employees) {
        await query(conn, `INSERT IGNORE INTO salary_records (user_id, month, year, base_salary, bonus, deductions, net_salary, payment_status, paid_on, remarks)
          SELECT ?, MONTH(d), YEAR(d), 65000, 3000, 5000, 63000, 'paid', d, 'Demo payroll'
          FROM (SELECT LAST_DAY(CURRENT_DATE - INTERVAL 1 MONTH) d) dates`, [id]);
        await query(conn, `INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, status, due_date)
          VALUES ('Review the demo handbook', 'Read the updated onboarding checklist and note any missing steps.', ?, ?, 'Medium', 'Pending', CURRENT_DATE + INTERVAL 7 DAY)`, [admin, id]);
        await query(conn, `INSERT INTO performance_reviews (user_id, reviewer_id, review_cycle, review_type, overall_score, rating, strengths, status)
          VALUES (?, ?, CONCAT('Q', QUARTER(CURRENT_DATE), '-', YEAR(CURRENT_DATE)), '360', 4.2, 'exceeds', 'Clear handovers and reliable follow-through.', 'submitted')`, [id, admin]);
      }
    });
    await runOnce(conn, '2026-11-workflow-examples-v2', () => require('./seedWorkflowExamples')(conn, query));
    await runOnce(conn, '2026-11-workforce-coverage-v3', () => require('./demo/seedCoverage')(conn, query));
    await runOnce(conn, '2026-11-finance-workflows-v4', () => require('./financeSetup').seed(conn));
    await runOnce(conn, '2026-11-review-coverage-v5', () => require('./demo/seedReviewCoverage').seed(conn));
    await runOnce(conn, '2026-11-text-encoding-v6', () => require('./demo/repairTextEncoding')(conn));
    await runOnce(conn, '2026-11-legacy-relations-v7', () => require('./demo/repairLegacyRelations')(conn));
    await runOnce(conn, '2026-11-domain-workflows-v8', () => require('./workflows').migrate(conn));
    await runOnce(conn,'2026-11-account-meeting-device-v9',async()=>{
      await query(conn,"INSERT IGNORE INTO application_preferences(user_id,theme) SELECT user_id,'system' FROM users");
      await query(conn,"INSERT IGNORE INTO user_location_prefs(user_id,location_enabled,weather_enabled,location_source) SELECT user_id,0,0,'manual' FROM users");
    });
    await runOnce(conn,'2026-11-banking-encryption-v10',()=>require('./bankingEncryption').migrate(conn));
    await runOnce(conn, '2026-11-monthly-payroll-guidance', async () => {
      const { creditDay } = require('./payrollSchedule');
      const title = 'Monthly payroll payment schedule';
      const guidance = `Payroll releases monthly salary and arranges bank credit by the end of day ${creditDay} of the following month. Generate payroll and review approved advance recoveries before arranging payment. Once the bank credit is confirmed, record the actual credit date and payment reference. Workforce Intelligence records payment details for payroll reconciliation.`;
      await query(conn, `INSERT INTO company_policies (policy_name, title, category, policy_type, content, version, effective_date)
        SELECT ?, ?, 'Payroll', 'salary', ?, '1.0', CURRENT_DATE
        WHERE NOT EXISTS (SELECT 1 FROM company_policies WHERE policy_name=?)`,
      [title, title, guidance, title]);
      // Replace only the shipped sample wording. Preserve policies edited by an administrator.
      await query(conn, `UPDATE company_policies SET content=?, version='1.3'
        WHERE policy_name='Loan & Advance Policy' AND version='1.2' AND BINARY content=?`,
      ['Employees requesting a cash advance must explain why they need it. The advance is capped at the next unpaid take-home salary. Approved advances are recovered from that payout. Loan eligibility is assessed separately.',
       'Employees completing 1 year of service are eligible for salary advance up to 2 months salary. Loans up to 6x monthly salary are available based on eligibility.']);
    });
  } finally {
    try { await query(conn, "SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':wfi:demo'))"); }
    finally { conn.release(); }
  }
}

async function runOnce(conn, version, apply) {
  if ((await query(conn, 'SELECT version FROM demo_migrations WHERE version = ?', [version])).length) return;
  await query(conn, 'START TRANSACTION');
  try {
    await apply();
    await query(conn, 'INSERT INTO demo_migrations (version) VALUES (?)', [version]);
    await query(conn, 'COMMIT');
    console.log('[BOOT] Applied ' + version);
  } catch (error) {
    await query(conn, 'ROLLBACK');
    throw error;
  }
}

module.exports = { bootstrap, query };
