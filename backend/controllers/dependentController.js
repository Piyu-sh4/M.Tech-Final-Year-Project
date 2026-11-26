/**
 * dependentController.js — v12.0
 * Dependent Management, Insurance Enrollment, Health Cards, Renewal Alerts
 */
const db = require('../config/db');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p||[], (e,res) => e ? j(e) : r(res)));

exports.getMyDependents = async (req, res) => {
  try {
    res.json(await q('SELECT * FROM dependents WHERE user_id=? ORDER BY relationship', [req.user.user_id]));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addDependent = async (req, res) => {
  try {
    const { full_name, relationship, dob, gender, aadhaar, is_insured } = req.body;
    if (!full_name || !relationship) return res.status(400).json({ message: 'full_name and relationship required' });
    const r = await q(
      `INSERT INTO dependents (user_id, full_name, relationship, dob, gender, aadhaar, is_insured)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, full_name, relationship, dob||null, gender||null, aadhaar||null, is_insured?1:0]
    );
    res.json({ message: 'Dependent added', dependent_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateDependent = async (req, res) => {
  try {
    const { full_name, relationship, dob, gender, aadhaar, is_insured } = req.body;
    await q(
      `UPDATE dependents SET full_name=?, relationship=?, dob=?, gender=?, aadhaar=?, is_insured=?
       WHERE dependent_id=? AND user_id=?`,
      [full_name, relationship, dob||null, gender||null, aadhaar||null, is_insured?1:0, req.params.id, req.user.user_id]
    );
    res.json({ message: 'Dependent updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteDependent = async (req, res) => {
  try {
    await q('DELETE FROM dependents WHERE dependent_id=? AND user_id=?', [req.params.id, req.user.user_id]);
    res.json({ message: 'Dependent removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getInsurancePlans = async (req, res) => {
  try {
    res.json(await q('SELECT * FROM insurance_plans WHERE is_active=1 ORDER BY premium_annual'));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.enroll = async (req, res) => {
  try {
    const { plan_id, dependent_ids, coverage_start } = req.body;
    if (!plan_id) return res.status(400).json({ message: 'plan_id required' });
    const [plan] = await q('SELECT * FROM insurance_plans WHERE plan_id=?', [plan_id]);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Enroll self
    await q(
      `INSERT INTO insurance_enrollments (user_id, plan_id, coverage_start, coverage_end, status, premium)
       VALUES (?,?,?,?,'active',?)
       ON DUPLICATE KEY UPDATE plan_id=VALUES(plan_id), coverage_start=VALUES(coverage_start), status='active'`,
      [req.user.user_id, plan_id, coverage_start || new Date().toISOString().split('T')[0],
       new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0], plan.premium_annual]
    );

    // Enroll dependents if provided
    if (dependent_ids?.length) {
      for (const did of dependent_ids) {
        await q(
          `INSERT INTO insurance_enrollments (user_id, dependent_id, plan_id, coverage_start, status, premium)
           VALUES (?,?,?,?,'active',?)
           ON DUPLICATE KEY UPDATE status='active'`,
          [req.user.user_id, did, plan_id, coverage_start || new Date().toISOString().split('T')[0],
           Math.round(plan.premium_annual * 0.7)]
        );
      }
    }
    res.json({ message: 'Insurance enrollment successful', plan_name: plan.plan_name });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyInsurance = async (req, res) => {
  try {
    const enrollments = await q(
      `SELECT ie.*, ip.plan_name, ip.coverage_amount, ip.insurer,
        ip.cashless_hospitals, d.full_name AS dependent_name, d.relationship
       FROM insurance_enrollments ie
       JOIN insurance_plans ip ON ip.plan_id=ie.plan_id
       LEFT JOIN dependents d ON d.dependent_id=ie.dependent_id
       WHERE ie.user_id=? AND ie.status='active'`, [req.user.user_id]
    );
    res.json(enrollments);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.generateHealthCard = async (req, res) => {
  try {
    const uid = req.params.user_id || req.user.user_id;
    const [u] = await q('SELECT * FROM users WHERE user_id=?', [uid]);
    const [ins] = await q(
      `SELECT ie.*, ip.plan_name, ip.coverage_amount, ip.insurer, ip.policy_number
       FROM insurance_enrollments ie JOIN insurance_plans ip ON ip.plan_id=ie.plan_id
       WHERE ie.user_id=? AND ie.dependent_id IS NULL AND ie.status='active'
       ORDER BY ie.created_at DESC LIMIT 1`, [uid]
    );
    if (!ins) return res.status(404).json({ message: 'No active insurance enrollment found' });
    const card = {
      card_number: `HLTG-${String(uid).padStart(6,'0')}-${new Date().getFullYear()}`,
      employee_name: u.full_name,
      employee_id: u.employee_id,
      plan_name: ins.plan_name,
      insurer: ins.insurer,
      policy_number: ins.policy_number,
      coverage_amount: ins.coverage_amount,
      coverage_start: ins.coverage_start,
      coverage_end: ins.coverage_end,
      valid_until: ins.coverage_end,
      emergency_number: '1800-XXX-HLTH',
      tpa_name: 'Workforce Intelligence TPA',
      issued_at: new Date().toISOString()
    };
    await q(
      `INSERT INTO health_cards (user_id, card_number, enrollment_id, issued_at)
       VALUES (?,?,?,NOW()) ON DUPLICATE KEY UPDATE card_number=VALUES(card_number)`,
      [uid, card.card_number, ins.enrollment_id]
    );
    res.json(card);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyHealthCards = async (req, res) => {
  try {
    res.json(await q(
      `SELECT hc.*, ip.plan_name, ip.insurer, ip.coverage_amount
       FROM health_cards hc
       JOIN insurance_enrollments ie ON ie.enrollment_id=hc.enrollment_id
       JOIN insurance_plans ip ON ip.plan_id=ie.plan_id
       WHERE hc.user_id=? ORDER BY hc.issued_at DESC`, [req.user.user_id]
    ));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getRenewalAlerts = async (req, res) => {
  try {
    const alerts = await q(
      `SELECT ie.*, ip.plan_name, ip.insurer, u.full_name, u.email,
        DATEDIFF(ie.coverage_end, NOW()) AS days_remaining
       FROM insurance_enrollments ie
       JOIN insurance_plans ip ON ip.plan_id=ie.plan_id
       JOIN users u ON u.user_id=ie.user_id
       WHERE ie.status='active' AND DATEDIFF(ie.coverage_end, NOW()) <= 30
       ORDER BY days_remaining ASC`
    );
    res.json(alerts);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
