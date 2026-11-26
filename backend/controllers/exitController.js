/**
 * exitController.js — v12.0
 * Exit Management: Resignation → FnF Settlement → BGV → Exit Interview → Documents
 */
const db = require('../config/db');
const { transaction } = require('../services/database');
const { isISODate } = require('../services/validation');
const { fail, decisionId, teamReadScope, requireIndependentReviewer } = require('../services/workforceDecisions');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

const defaultChecklist = [
  'Return laptop and accessories', 'Return access card / ID badge',
  'Clear outstanding tasks and handover', 'Submit pending expense claims',
  'Return company assets (phone, tab, etc.)', 'Revoke all system accesses',
  'Clearance from IT department', 'Clearance from Finance department',
  'Clearance from Admin department', 'Submit final timesheet',
  'Complete exit interview', 'Collect experience letter'
];

// ── RESIGNATION ──────────────────────────────────────────────────────────────
exports.submitResignation = async (req,res,next) => {
  const {reason,last_working_day,notice_period_days=60,comments=''} = req.body;
  const reasons = ['better_opportunity','higher_salary','relocation','personal','health','work_environment','career_change','other'];
  if (!reasons.includes(reason) || !isISODate(last_working_day) || last_working_day<new Date().toISOString().slice(0,10) ||
      !Number.isInteger(Number(notice_period_days)) || Number(notice_period_days)<0 || Number(notice_period_days)>365 ||
      typeof comments !== 'string' || comments.length>1500) return res.status(400).json({message:'Choose a listed reason, a future last working day, and valid notice period.'});
  try {
    const result = await transaction(async run => {
      await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[req.user.user_id]);
      const existing = await run("SELECT resignation_id FROM resignations WHERE user_id=? AND status NOT IN ('withdrawn','rejected')",[req.user.user_id]);
      if (existing.length) throw Object.assign(new Error('An active resignation already exists.'),{status:409});
      const resignation = await run(`INSERT INTO resignations (user_id,reason,last_working_day,notice_period_days,comments,status)
        VALUES (?,?,?,?,?,'submitted')`,[req.user.user_id,reason,last_working_day,Number(notice_period_days),comments]);
      const [existingChecklist] = await run('SELECT id FROM exit_checklist WHERE user_id=? LIMIT 1', [req.user.user_id]);
      if (!existingChecklist) {
        await run('INSERT INTO exit_checklist (user_id, item, sort_order) VALUES ?',
          [defaultChecklist.map((item, index) => [req.user.user_id, item, index + 1])]);
      }
      return resignation;
    });
    res.json({message:'Resignation submitted successfully',resignation_id:result.insertId});
  } catch (error) { next(error); }
};

exports.getMyResignation = async (req, res) => {
  try {
    const [r] = await q(
      `SELECT rg.*, u.full_name, u.employee_id, d.dept_name AS department,
        m.full_name AS manager_name
       FROM resignations rg JOIN users u ON u.user_id=rg.user_id
       LEFT JOIN departments d ON d.dept_id=u.department_id
       LEFT JOIN users m ON m.user_id=u.reporting_manager_id
       WHERE rg.user_id=? ORDER BY rg.created_at DESC LIMIT 1`, [req.user.user_id]
    );
    res.json(r || null);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.withdrawResignation = async (req, res, next) => {
  try {
    const id = req.body.resignation_id == null ? null : decisionId(req.body.resignation_id);
    await transaction(async run => {
      const [record] = await run(`SELECT resignation_id,status FROM resignations WHERE user_id=?
        AND (? IS NULL OR resignation_id=?) ORDER BY resignation_id DESC LIMIT 1 FOR UPDATE`,
      [req.user.user_id,id,id]);
      if (!record) fail(404, 'Resignation not found.');
      if (record.status === 'withdrawn') return;
      if (record.status !== 'submitted') fail(409, 'Only a submitted resignation can be withdrawn.');
      await run("UPDATE resignations SET status='withdrawn' WHERE resignation_id=?", [record.resignation_id]);
    });
    res.json({ message: 'Resignation withdrawn' });
  } catch (error) { next(error); }
};

async function reviewResignation(req, decision) {
  const id = decisionId(req.body.resignation_id);
  const { manager_note, action, hr_note, revised_lwd } = req.body;
  const note = decision ? hr_note : manager_note;
  if (note != null && (typeof note !== 'string' || note.length > 1500)) fail(400, 'Enter a valid review note.');
  if (decision && (!['approve','reject'].includes(action) || (revised_lwd && !isISODate(revised_lwd))))
    fail(400, 'Choose approve or reject and enter a valid revised date if needed.');
  return transaction(async run => {
    const [record] = await run(`SELECT r.*,u.reporting_manager_id FROM resignations r
      JOIN users u ON u.user_id=r.user_id WHERE r.resignation_id=? FOR UPDATE`, [id]);
    if (!record) fail(404, 'Resignation not found.');
    requireIndependentReviewer(req.user, record);
    if (!decision) {
      if (record.status !== 'submitted') fail(409, 'Only a submitted resignation can be acknowledged.');
      await run(`UPDATE resignations SET status='manager_acknowledged', manager_note=?,acknowledged_at=NOW()
        WHERE resignation_id=?`, [note || null,id]);
      return 'acknowledged';
    }
    if (record.status !== 'manager_acknowledged') fail(409, 'A manager must acknowledge this resignation before HR can decide it.');
    const status = action === 'approve' ? 'hr_approved' : 'rejected';
    await run(`UPDATE resignations SET status=?,hr_note=?,revised_lwd=?,hr_actioned_at=NOW()
      WHERE resignation_id=?`, [status,note || null,action === 'approve' ? revised_lwd || null : null,id]);
    return status;
  });
}

exports.managerAcknowledge = async (req, res, next) => {
  try {
    await reviewResignation(req, false);
    res.json({ message: 'Resignation acknowledged' });
  } catch (error) { next(error); }
};

exports.hrApprove = async (req, res, next) => {
  try {
    const status = await reviewResignation(req, true);
    res.json({ message: status === 'hr_approved' ? 'Resignation approved' : 'Resignation rejected' });
  } catch (error) { next(error); }
};

exports.getAllResignations = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT rg.*, u.full_name, u.employee_id, d.dept_name AS department,
      m.full_name AS manager_name
      FROM resignations rg JOIN users u ON u.user_id=rg.user_id
      LEFT JOIN departments d ON d.dept_id=u.department_id
      LEFT JOIN users m ON m.user_id=u.reporting_manager_id WHERE 1=1`;
    const scope = teamReadScope(req.user);
    sql += scope.sql;
    const p = scope.params;
    if (status) { sql += ' AND rg.status=?'; p.push(status); }
    sql += ' ORDER BY rg.created_at DESC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── EXIT CHECKLIST ───────────────────────────────────────────────────────────
exports.getChecklist = async (req, res) => {
  try {
    const { user_id } = req.params;
    const uid = user_id || req.user.user_id;
    const items = await q('SELECT * FROM exit_checklist WHERE user_id=? ORDER BY sort_order', [uid]);
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.completeChecklistItem = async (req, res) => {
  try {
    const { item_id, completed } = req.body;
    if (!Number.isSafeInteger(item_id) || item_id < 1 || typeof completed !== 'boolean')
      return res.status(400).json({ message: 'Choose a checklist item and completion status.' });
    const result = await q('UPDATE exit_checklist SET completed=?, completed_at=? WHERE id=? AND user_id=?',
      [completed ? 1 : 0, completed ? new Date() : null, item_id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Checklist item not found.' });
    res.json({ message: 'Checklist item updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── FULL & FINAL SETTLEMENT ──────────────────────────────────────────────────
async function calculateSettlement(run, userId) {
  const [resignation] = await run(`SELECT DATE_FORMAT(COALESCE(revised_lwd,last_working_day),'%Y-%m-%d') last_day
    FROM resignations WHERE user_id=? AND status='hr_approved' ORDER BY resignation_id DESC LIMIT 1`, [userId]);
  if (!resignation) fail(409, 'No approved resignation found.');
  const [salary] = await run(`SELECT gross_salary,basic_salary FROM salary_records
    WHERE user_id=? ORDER BY year DESC,month DESC,salary_id DESC LIMIT 1`, [userId]);
  if (!salary) fail(409, 'A salary record is required to calculate settlement.');
  const [year, month, day] = resignation.last_day.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const gross = Number(salary.gross_salary || 0);
  const proRataSalary = Math.round((gross / daysInMonth) * day);
  const [balance] = await run(`SELECT COALESCE(SUM(remaining),0) earned_leave FROM leave_balances
    WHERE user_id=? AND leave_type='earned' AND year=?`, [userId,year]);
  const leaveEncashment = Math.round((gross / 26) * Number(balance.earned_leave));
  const [employee] = await run(`SELECT COALESCE(join_date,date_of_joining) joined,
    TIMESTAMPDIFF(YEAR,COALESCE(join_date,date_of_joining),?) service_years FROM users WHERE user_id=?`,
  [resignation.last_day,userId]);
  const years = Number(employee?.service_years || 0);
  const gratuity = years >= 5 ? Math.round((Number(salary.basic_salary || 0) / 26) * 15 * years) : 0;
  const [deductions] = await run(`SELECT COALESCE(SUM(GREATEST(COALESCE(r.amount_due,r.emi_amount,0)
    - COALESCE(r.amount_paid,r.paid_amount,0),0)),0) total
    FROM loan_repayments r JOIN loan_applications la ON la.loan_id=r.loan_id
    WHERE la.user_id=? AND r.status IN ('upcoming','overdue')`, [userId]);
  const outstanding = Number(deductions.total);
  const total = proRataSalary + leaveEncashment + gratuity;
  return {
    user_id: userId, last_working_day: resignation.last_day,
    components: {pro_rata_salary: proRataSalary, leave_encashment: leaveEncashment, gratuity, bonus: 0},
    deductions: {loan_outstanding: outstanding, notice_period_short: 0},
    gross_fnf: total, net_fnf: Math.round((total - outstanding) * 100) / 100,
    status: 'calculated', calculated_at: new Date()
  };
}

exports.calculateFnF = async (req, res, next) => {
  try {
    const userId = decisionId(req.params.user_id);
    if (req.user.user_id === userId) fail(403, 'Ask a separate reviewer to calculate your settlement.');
    const [saved] = await q('SELECT details_json,status,approved_amount,payment_reference FROM fnf_settlements WHERE user_id=?', [userId]);
    res.json(saved?.status === 'approved' || saved?.status === 'disbursed'
      ? {...JSON.parse(saved.details_json), status: saved.status, approved_amount: saved.approved_amount, payment_reference: saved.payment_reference} : await calculateSettlement(q, userId));
  } catch (error) { next(error); }
};

exports.approveFnF = async (req, res, next) => {
  try {
    const userId = decisionId(req.body.user_id);
    const { approved_amount, hr_note } = req.body;
    if (req.user.user_id === userId) fail(403, 'A separate reviewer must approve this settlement.');
    if (hr_note != null && (typeof hr_note !== 'string' || hr_note.length > 1500))
      fail(400, 'Enter a valid review note.');
    await transaction(async run => {
      // Lock the employee before calculating or persisting an approval, including the first one.
      const [employee] = await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE', [userId]);
      if (!employee) fail(404, 'Employee not found.');
      const [saved] = await run('SELECT status FROM fnf_settlements WHERE user_id=? FOR UPDATE', [userId]);
      if (saved && saved.status !== 'calculated') fail(409, 'This settlement has already been decided.');
      const summary = await calculateSettlement(run,userId);
      if (summary.net_fnf < 0) fail(409, 'A negative settlement balance requires payroll review.');
      if (approved_amount != null && Number(approved_amount) !== summary.net_fnf)
        fail(409, 'The amount differs from the calculated balance. Refresh the settlement.');
      await run(`INSERT INTO fnf_settlements (user_id,details_json,status,approved_amount,hr_note,approved_at)
        VALUES (?,?,'approved',?,?,NOW()) ON DUPLICATE KEY UPDATE details_json=VALUES(details_json),status='approved',
        approved_amount=VALUES(approved_amount),hr_note=VALUES(hr_note),approved_at=NOW()`,
      [userId,JSON.stringify(summary),summary.net_fnf,hr_note || null]);
    });
    res.json({ message: 'FnF approved' });
  } catch (error) { next(error); }
};

exports.disburseFnF = async (req, res, next) => {
  try {
    const userId = decisionId(req.body.user_id);
    const { payment_mode = 'bank_transfer', reference } = req.body;
    if (req.user.user_id === userId) fail(403, 'A separate reviewer must record this settlement payment.');
    if (typeof payment_mode !== 'string' || !payment_mode.trim() || payment_mode.length > 50 ||
        typeof reference !== 'string' || !reference.trim() || reference.length > 100)
      fail(400, 'Enter the payment method and reference.');
    await transaction(async run => {
      const [employee] = await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE', [userId]);
      if (!employee) fail(404, 'Employee not found.');
      const [saved] = await run(`SELECT status,approved_amount,payment_mode,payment_reference FROM fnf_settlements
        WHERE user_id=? FOR UPDATE`, [userId]);
      if (saved?.status === 'disbursed' && saved.payment_mode === payment_mode.trim() &&
          saved.payment_reference === reference.trim()) return;
      if (saved?.status !== 'approved' || saved.approved_amount == null)
        fail(409, 'Approve the settlement before recording payment.');
      await run(`UPDATE fnf_settlements SET status='disbursed',payment_mode=?,payment_reference=?,disbursed_at=NOW()
        WHERE user_id=?`, [payment_mode.trim(),reference.trim(),userId]);
    });
    res.json({ message: 'Settlement payment recorded.' });
  } catch (error) { next(error); }
};

// ── EXIT INTERVIEW ───────────────────────────────────────────────────────────
exports.submitExitInterview = async (req, res) => {
  try {
    const {
      primary_reason, secondary_reason, satisfaction_rating,
      recommend_company, improvement_suggestions,
      liked_most, liked_least, would_return
    } = req.body;
    await q(
      `INSERT INTO exit_interviews (user_id, primary_reason, secondary_reason, satisfaction_rating,
        recommend_company, improvement_suggestions, liked_most, liked_least, would_return)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE primary_reason=VALUES(primary_reason), submitted_at=NOW()`,
      [req.user.user_id, primary_reason, secondary_reason || null, satisfaction_rating,
       recommend_company, improvement_suggestions || null, liked_most || null, liked_least || null, would_return]
    );
    res.json({ message: 'Exit interview submitted. Thank you for your feedback.' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── BACKGROUND VERIFICATION ──────────────────────────────────────────────────
exports.submitBGVRequest = async (req, res) => {
  try {
    const { user_id, agency_name, checks_requested } = req.body;
    const r = await q(
      `INSERT INTO bgv_requests (user_id, agency_name, checks_requested, status, requested_by)
       VALUES (?,?,?,'initiated',?)`,
      [user_id, agency_name || 'Internal', JSON.stringify(checks_requested || ['identity','education','employment']), req.user.user_id]
    );
    res.json({ message: 'BGV request submitted', bgv_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.consentBGV = async (req, res) => {
  try {
    const result = await q(`UPDATE bgv_requests SET consent_given=1, consent_at=COALESCE(consent_at,NOW())
      WHERE bgv_id=? AND user_id=?`, [req.params.id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Background verification request not found.' });
    res.json({ message: 'BGV consent recorded' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.completeBGV = async (req, res) => {
  try {
    const { result, remarks } = req.body;
    await q('UPDATE bgv_requests SET status=?, result=?, remarks=?, completed_at=NOW() WHERE bgv_id=?',
      ['completed', result, remarks || null, req.params.id]);
    res.json({ message: 'BGV marked complete' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── EXIT DASHBOARD ───────────────────────────────────────────────────────────
exports.getExitDashboard = async (req, res) => {
  try {
    const [stats] = await q(
      `SELECT COUNT(*) AS total,
        SUM(status='submitted') AS pending,
        SUM(status='hr_approved') AS approved,
        SUM(status='withdrawn') AS withdrawn
       FROM resignations WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`
    );
    const byReason = await q(
      `SELECT reason, COUNT(*) AS count FROM resignations GROUP BY reason ORDER BY count DESC LIMIT 5`
    );
    const fnfPending = await q(
      `SELECT COUNT(*) AS count FROM fnf_settlements WHERE status IN ('calculated','approved')`
    );
    const upcoming = await q(
      `SELECT rg.resignation_id, u.full_name, rg.last_working_day, rg.status
       FROM resignations rg JOIN users u ON u.user_id=rg.user_id
       WHERE rg.last_working_day >= CURDATE() AND rg.status='hr_approved'
       ORDER BY rg.last_working_day LIMIT 10`
    );
    res.json({ stats, reasons: byReason, fnf_pending: fnfPending[0]?.count || 0, upcoming_exits: upcoming });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── EXPERIENCE LETTER / EXIT DOCUMENT ───────────────────────────────────────
exports.generateExitDocument = async (req, res) => {
  try {
    const { user_id, doc_type } = req.body;
    const [u] = await q(
      `SELECT u.full_name, u.employee_id, u.date_of_joining, d.dept_name AS department,
        r.last_working_day
       FROM users u LEFT JOIN departments d ON d.dept_id=u.department_id
       LEFT JOIN resignations r ON r.user_id=u.user_id
       WHERE u.user_id=? ORDER BY r.created_at DESC LIMIT 1`, [user_id]
    );
    if (!u) return res.status(404).json({ message: 'Employee not found' });
    const doc = {
      doc_type, employee: u,
      issued_date: new Date().toISOString().split('T')[0],
      content: doc_type === 'experience_letter'
        ? `This is to certify that ${u.full_name} (ID: ${u.employee_id}) was employed with Workforce Intelligence Pvt Ltd from ${new Date(u.date_of_joining).toLocaleDateString('en-IN')} to ${new Date(u.last_working_day).toLocaleDateString('en-IN')} in the ${u.department} department.`
        : `Relieving Letter for ${u.full_name}`
    };
    await q('INSERT INTO exit_documents (user_id, doc_type, content_json, generated_by) VALUES (?,?,?,?)',
      [user_id, doc_type, JSON.stringify(doc), req.user.user_id]);
    res.json({ message: 'Document generated', document: doc });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
