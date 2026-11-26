/**
 * letterController.js — HR Letter Generation (8 types)
 * Offer · Confirmation · Experience · Relieving · Salary Cert · NOC · Warning · Promotion
 */
const db = require('../config/db');
const q  = (s, p) => new Promise((r, j) => db.query(s, p || [], (e, res) => e ? j(e) : r(res)));

// ── helpers ──────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : '—';
const today   = () => new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
const refNo   = type => `WIQ/${type.toUpperCase().slice(0,3)}/${new Date().getFullYear()}/${Math.floor(1000+Math.random()*9000)}`;

// ── templates ─────────────────────────────────────────────────
function buildContent(type, emp, extra = {}) {
  const name = emp.full_name;
  const eid  = emp.employee_id;
  const dept = emp.department || 'Engineering';
  const desig= emp.designation || 'Employee';
  const doj  = fmtDate(emp.join_date);
  const ctc  = extra.ctc ? `₹${Number(extra.ctc).toLocaleString('en-IN')} per annum` : '—';
  const ref  = refNo(type);

  const header = `Workforce Intelligence Pvt Ltd\nRef: ${ref}\nDate: ${today()}\n\nTo,\n${name}\nEmployee ID: ${eid}\nDepartment: ${dept}\n\n`;

  switch (type) {
    case 'offer_letter':
      return header +
        `Subject: Offer of Employment — ${desig}\n\nDear ${name},\n\n` +
        `We are pleased to offer you the position of ${desig} in the ${dept} department at Workforce Intelligence Pvt Ltd, effective ${extra.joining_date ? fmtDate(extra.joining_date) : '(date TBD)'}.\n\n` +
        `Your annual Cost to Company (CTC) will be ${ctc}. This offer is subject to successful completion of background verification and submission of all required documents.\n\n` +
        `Please confirm acceptance of this offer by signing and returning a copy.\n\nWarm regards,\nHuman Resources\nWorkforce Intelligence Pvt Ltd`;

    case 'confirmation_letter':
      return header +
        `Subject: Confirmation of Employment\n\nDear ${name},\n\n` +
        `We are pleased to confirm your employment with Workforce Intelligence Pvt Ltd as ${desig} in the ${dept} department, effective ${today()}.\n\n` +
        `You have successfully completed your probation period and your performance has been found satisfactory. Your employment is now confirmed on our permanent rolls.\n\n` +
        `Your CTC remains ${ctc}. Please continue to maintain the same level of dedication and performance.\n\nWarm regards,\nHuman Resources\nWorkforce Intelligence Pvt Ltd`;

    case 'experience_letter':
      return header +
        `Subject: Experience Certificate\n\nTo Whom It May Concern,\n\n` +
        `This is to certify that ${name} (Employee ID: ${eid}) was employed with Workforce Intelligence Pvt Ltd from ${doj} to ${fmtDate(extra.last_working_day) || today()}.\n\n` +
        `During their tenure, ${name} served as ${desig} in the ${dept} department. We found them to be sincere, hardworking, and technically proficient.\n\n` +
        `We wish them the very best in their future endeavours.\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    case 'relieving_letter':
      return header +
        `Subject: Relieving Letter\n\nDear ${name},\n\n` +
        `This is to confirm that you have been relieved from your duties as ${desig} in the ${dept} department, effective ${fmtDate(extra.last_working_day) || today()}.\n\n` +
        `We confirm that you have completed all exit formalities. Your Full & Final settlement is being processed as per company policy. You are free to join your new organisation.\n\n` +
        `We appreciate your contributions and wish you all the best.\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    case 'salary_certificate':
      return header +
        `Subject: Salary Certificate\n\nTo Whom It May Concern,\n\n` +
        `This is to certify that ${name} (Employee ID: ${eid}) is employed with Workforce Intelligence Pvt Ltd as ${desig} in the ${dept} department since ${doj}.\n\n` +
        `Their current gross monthly salary is ₹${extra.gross_monthly ? Number(extra.gross_monthly).toLocaleString('en-IN') : '—'} and net take-home salary is ₹${extra.net_monthly ? Number(extra.net_monthly).toLocaleString('en-IN') : '—'}.\n\n` +
        `This certificate is issued at the request of the employee for ${extra.purpose || 'personal use'}.\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    case 'noc_letter':
      return header +
        `Subject: No Objection Certificate\n\nTo Whom It May Concern,\n\n` +
        `This is to certify that ${name} (Employee ID: ${eid}), ${desig} in the ${dept} department, has been employed with Workforce Intelligence Pvt Ltd since ${doj}.\n\n` +
        `Workforce Intelligence Pvt Ltd has no objection to ${name} ${extra.purpose || 'applying for the mentioned purpose'}. This certificate is issued at the request of the employee.\n\n` +
        `For Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    case 'warning_letter':
      return header +
        `Subject: Warning Letter — ${extra.violation || 'Policy Violation'}\n\nDear ${name},\n\n` +
        `This letter serves as a formal ${extra.warning_level || 'written'} warning regarding ${extra.violation || 'a policy violation'} that occurred on ${extra.incident_date ? fmtDate(extra.incident_date) : today()}.\n\n` +
        `${extra.description || 'The details of the incident have been noted and documented.'}\n\n` +
        `You are hereby advised to immediately rectify this behaviour and ensure compliance with company policies. Repetition of such conduct may result in further disciplinary action, up to and including termination.\n\n` +
        `Please acknowledge receipt of this letter.\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    case 'promotion_letter':
      return header +
        `Subject: Promotion Letter\n\nDear ${name},\n\n` +
        `We are pleased to inform you that, in recognition of your outstanding performance and contributions, you have been promoted to the position of ${extra.new_designation || desig}, effective ${extra.effective_date ? fmtDate(extra.effective_date) : today()}.\n\n` +
        `Your revised CTC will be ${ctc}. We are confident that you will continue to excel in your new role and take on greater responsibilities.\n\nCongratulations!\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;

    default:
      return header + `Subject: HR Letter\n\nDear ${name},\n\nPlease find the requested letter enclosed.\n\nFor Workforce Intelligence Pvt Ltd,\nHuman Resources`;
  }
}

// ── GET /api/letters/employees — search employees ─────────────
exports.searchEmployees = async (req, res) => {
  try {
    const { q: search } = req.query;
    const rows = await q(
      `SELECT u.user_id, u.full_name, u.employee_id, u.date_of_joining, u.designation,
              d.name AS department, s.gross_salary, s.net_salary
       FROM users u
       LEFT JOIN departments d ON d.dept_id = u.department_id
       LEFT JOIN salary_records s ON s.salary_id = (SELECT MAX(sr2.salary_id) FROM salary_records sr2 WHERE sr2.user_id = u.user_id)
       WHERE u.full_name LIKE ? OR u.employee_id LIKE ?
       LIMIT 10`,
      [`%${search||''}%`, `%${search||''}%`]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── POST /api/letters/generate ────────────────────────────────
exports.generateLetter = async (req, res, next) => {
  try {
    const { user_id, letter_type, extra = {} } = req.body;
    if (!/^[1-9]\d*$/.test(String(user_id)) ||
        !['offer_letter','confirmation_letter','experience_letter','relieving_letter','salary_certificate','noc_letter','warning_letter','promotion_letter'].includes(letter_type))
      return res.status(400).json({ message: 'Choose a valid employee and letter type.' });
    if (Number(user_id) === req.user.user_id)
      return res.status(403).json({ message: 'A separate reviewer must issue your letter.' });

    const [emp] = await q(
      `SELECT u.user_id, u.full_name, u.employee_id, u.designation, u.join_date, u.base_salary, d.dept_name AS department FROM users u
       LEFT JOIN departments d ON d.dept_id = u.department_id
       WHERE u.user_id = ?`, [user_id]
    );
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const content = buildContent(letter_type, emp, extra);
    const ref_no  = refNo(letter_type);

    await q(
      `INSERT INTO hr_letters (user_id, letter_type, content, ref_no, generated_by, issued_date)
       VALUES (?,?,?,?,?,CURDATE())`,
      [user_id, letter_type, content, ref_no, req.user.user_id]
    );

    res.json({ message: 'Letter generated successfully', content, ref_no, employee: emp });
  } catch (e) { next(e); }
};

// ── GET /api/letters — list all generated letters ─────────────
exports.listLetters = async (req, res) => {
  try {
    const rows = await q(
      `SELECT l.*, u.full_name, u.employee_id
       FROM hr_letters l JOIN users u ON u.user_id = l.user_id
       ORDER BY l.issued_date DESC LIMIT 50`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── GET /api/letters/my — employee's own letters ──────────────
exports.myLetters = async (req, res) => {
  try {
    const rows = await q(
      `SELECT * FROM hr_letters WHERE user_id = ? ORDER BY issued_date DESC`,
      [req.user.user_id]
    );
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
