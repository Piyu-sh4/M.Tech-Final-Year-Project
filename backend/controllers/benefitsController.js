/**
 * benefitsController.js — Employee Benefits & Insurance v9.0
 */
const db = require('../config/db');
const { transaction } = require('../services/database');
const { decisionId, fail } = require('../services/workforceDecisions');
function query(sql, p) {
  return new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));
}

/* ── Insurance Plans ── */
exports.getPlans = async (req, res) => {
  try {
    const { type } = req.query;
    const rows = type
      ? await query(`SELECT * FROM insurance_plans WHERE plan_type=? AND is_active=1 ORDER BY plan_name`, [type])
      : await query(`SELECT * FROM insurance_plans WHERE is_active=1 ORDER BY plan_type, plan_name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createPlan = async (req, res) => {
  try {
    const { plan_name, plan_type, provider, coverage_amount, premium_monthly, employee_share, company_share, description } = req.body;
    const r = await query(
      `INSERT INTO insurance_plans (plan_name, plan_type, provider, coverage_amount, premium_monthly, employee_share, company_share, description)
       VALUES (?,?,?,?,?,?,?,?)`,
      [plan_name, plan_type, provider || null, coverage_amount || 0, premium_monthly || 0, employee_share || 0, company_share || 0, description || null]
    );
    res.json({ message: 'Plan created', plan_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePlan = async (req, res) => {
  try {
    const { plan_name, plan_type, provider, coverage_amount, premium_monthly, employee_share, company_share, description, is_active } = req.body;
    await query(
      `UPDATE insurance_plans SET plan_name=?,plan_type=?,provider=?,coverage_amount=?,premium_monthly=?,employee_share=?,company_share=?,description=?,is_active=? WHERE plan_id=?`,
      [plan_name, plan_type, provider || null, coverage_amount || 0, premium_monthly || 0, employee_share || 0, company_share || 0, description || null, is_active ?? 1, req.params.id]
    );
    res.json({ message: 'Plan updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Employee Benefits ── */
exports.getMyBenefits = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eb.*, ip.plan_name, ip.plan_type, ip.provider, ip.coverage_amount, ip.premium_monthly, ip.employee_share, ip.company_share
       FROM employee_benefits eb JOIN insurance_plans ip ON ip.plan_id=eb.plan_id
       WHERE eb.user_id=? ORDER BY eb.status, ip.plan_type`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserBenefits = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eb.*, ip.plan_name, ip.plan_type, ip.coverage_amount, ip.premium_monthly,
              u.full_name
       FROM employee_benefits eb
       JOIN insurance_plans ip ON ip.plan_id=eb.plan_id
       JOIN users u ON u.user_id=eb.user_id
       WHERE eb.user_id=? ORDER BY eb.status, ip.plan_type`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllBenefits = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eb.*, ip.plan_name, ip.plan_type, ip.coverage_amount, u.full_name, u.email
       FROM employee_benefits eb
       JOIN insurance_plans ip ON ip.plan_id=eb.plan_id
       JOIN users u ON u.user_id=eb.user_id
       ORDER BY u.full_name, ip.plan_type`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.enrollBenefit = async (req, res) => {
  try {
    const { plan_id, enrollment_date, expiry_date, nominee_name, nominee_relation, policy_number } = req.body;
    const r = await query(
      `INSERT INTO employee_benefits (user_id, plan_id, enrollment_date, expiry_date, nominee_name, nominee_relation, policy_number)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, plan_id, enrollment_date || new Date().toISOString().split('T')[0], expiry_date || null,
       nominee_name || null, nominee_relation || null, policy_number || null]
    );
    res.json({ message: 'Enrolled in benefit', benefit_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateBenefit = async (req, res, next) => {
  try {
    const id = decisionId(req.params.id);
    const { status, nominee_name, nominee_relation, policy_number, expiry_date } = req.body;
    await transaction(async run => {
      const [benefit] = await run('SELECT status FROM employee_benefits WHERE benefit_id=? AND user_id=? FOR UPDATE',
        [id,req.user.user_id]);
      if (!benefit) fail(404, 'Benefit not found.');
      if (!['active','pending'].includes(benefit.status)) fail(409, 'Only a current benefit can be edited.');
      if (status !== undefined && status !== benefit.status) fail(400, 'Use the cancellation action to change enrollment status.');
      await run(`UPDATE employee_benefits SET nominee_name=COALESCE(?,nominee_name),nominee_relation=COALESCE(?,nominee_relation),
        policy_number=COALESCE(?,policy_number),expiry_date=COALESCE(?,expiry_date) WHERE benefit_id=?`,
      [nominee_name ?? null,nominee_relation ?? null,policy_number ?? null,expiry_date ?? null,id]);
    });
    res.json({ message: 'Benefit updated' });
  } catch (error) { next(error); }
};

exports.cancelBenefit = async (req, res, next) => {
  try {
    const id = decisionId(req.params.id);
    await transaction(async run => {
      const [benefit] = await run('SELECT status FROM employee_benefits WHERE benefit_id=? AND user_id=? FOR UPDATE',
        [id,req.user.user_id]);
      if (!benefit) fail(404, 'Benefit not found.');
      if (benefit.status === 'cancelled') return;
      if (!['active','pending'].includes(benefit.status)) fail(409, 'Only a current benefit can be cancelled.');
      await run("UPDATE employee_benefits SET status='cancelled' WHERE benefit_id=?", [id]);
    });
    res.json({ message: 'Benefit cancelled' });
  } catch (error) { next(error); }
};

/* ── Dependents ── */
exports.getMyDependents = async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM dependent_members WHERE user_id=? ORDER BY relation`, [req.user.user_id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addDependent = async (req, res) => {
  try {
    const { name, relation, dob, is_covered } = req.body;
    const r = await query(
      `INSERT INTO dependent_members (user_id, name, relation, dob, is_covered) VALUES (?,?,?,?,?)`,
      [req.user.user_id, name, relation, dob || null, is_covered ? 1 : 0]
    );
    res.json({ message: 'Dependent added', dependent_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateDependent = async (req, res) => {
  try {
    const { name, relation, dob, is_covered } = req.body;
    const result = await query(
      `UPDATE dependent_members SET name=?, relation=?, dob=?, is_covered=? WHERE dependent_id=? AND user_id=?`,
      [name, relation, dob || null, is_covered ? 1 : 0, req.params.id, req.user.user_id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Dependent not found.' });
    res.json({ message: 'Dependent updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.removeDependent = async (req, res) => {
  try {
    const result = await query(`DELETE FROM dependent_members WHERE dependent_id=? AND user_id=?`, [req.params.id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Dependent not found.' });
    res.json({ message: 'Dependent removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Summary ── */
exports.getBenefitsSummary = async (req, res) => {
  try {
    const uid = req.user.user_id;
    const [active]  = await query(`SELECT COUNT(*) AS cnt, SUM(ip.coverage_amount) AS total_cover FROM employee_benefits eb JOIN insurance_plans ip ON ip.plan_id=eb.plan_id WHERE eb.user_id=? AND eb.status='active'`, [uid]);
    const [deps]    = await query(`SELECT COUNT(*) AS cnt FROM dependent_members WHERE user_id=?`, [uid]);
    const [monthly] = await query(`SELECT SUM(ip.employee_share) AS emp_premium, SUM(ip.company_share) AS co_premium FROM employee_benefits eb JOIN insurance_plans ip ON ip.plan_id=eb.plan_id WHERE eb.user_id=? AND eb.status='active'`, [uid]);
    res.json({
      active_plans: active.cnt || 0,
      total_coverage: active.total_cover || 0,
      dependents: deps.cnt || 0,
      employee_premium: monthly.emp_premium || 0,
      company_contribution: monthly.co_premium || 0
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
