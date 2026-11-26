/**
 * complianceController.js — v12.0
 * Statutory Compliance: PF / ESI / Gratuity / Professional Tax
 * All calculations follow Indian statutory rules (FY 2025-26)
 */
const db = require('../config/db');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

// ── PF (Provident Fund) ─────────────────────────────────────────────────────
// Employee: 12% of Basic. Employer: 12% (3.67% to EPF + 8.33% to EPS)
exports.calculatePF = async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;
    const [sal] = await q(
      `SELECT sr.basic_salary, u.full_name, u.employee_id AS emp_code
       FROM salary_records sr JOIN users u ON u.user_id = sr.user_id
       WHERE sr.user_id = ? AND sr.month = ? AND sr.year = ?`,
      [employee_id, month, year]
    );
    if (!sal) return res.status(404).json({ message: 'Salary record not found' });

    const basic = parseFloat(sal.basic_salary) || 0;
    const pfWage = Math.min(basic, 15000); // PF wage ceiling ₹15,000
    const employeeContribution = Math.round(pfWage * 0.12);
    const employerEPF = Math.round(pfWage * 0.0367);
    const employerEPS = Math.round(pfWage * 0.0833);
    const totalEmployer = employerEPF + employerEPS;
    const edliContribution = Math.round(pfWage * 0.005);

    res.json({
      employee_id, month, year,
      employee_name: sal.full_name,
      basic_salary: basic,
      pf_wage: pfWage,
      employee_contribution: employeeContribution,
      employer_epf: employerEPF,
      employer_eps: employerEPS,
      total_employer_contribution: totalEmployer,
      edli_contribution: edliContribution,
      total_pf: employeeContribution + totalEmployer
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPFRecords = async (req, res) => {
  try {
    const { month, year } = req.query;
    let sql = `SELECT sr.user_id, u.full_name, u.employee_id AS emp_code,
      sr.basic_salary, sr.month, sr.year,
      LEAST(sr.basic_salary, 15000) AS pf_wage,
      ROUND(LEAST(sr.basic_salary, 15000) * 0.12) AS employee_pf,
      ROUND(LEAST(sr.basic_salary, 15000) * 0.0367) AS employer_epf,
      ROUND(LEAST(sr.basic_salary, 15000) * 0.0833) AS employer_eps
      FROM salary_records sr JOIN users u ON u.user_id = sr.user_id
      WHERE sr.basic_salary > 0`;
    const p = [];
    if (month) { sql += ' AND sr.month = ?'; p.push(month); }
    if (year)  { sql += ' AND sr.year = ?';  p.push(year); }
    sql += ' ORDER BY u.full_name';
    const rows = await q(sql, p);
    const totals = rows.reduce((acc, r) => ({
      employee_pf: acc.employee_pf + r.employee_pf,
      employer_pf: acc.employer_pf + r.employer_epf + r.employer_eps
    }), { employee_pf: 0, employer_pf: 0 });
    res.json({ records: rows, totals, count: rows.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.generatePFChallan = async (req, res) => {
  try {
    const { month, year } = req.query;
    const rows = await q(
      `SELECT u.employee_id AS uan, u.full_name, LEAST(sr.basic_salary,15000) AS wage,
        ROUND(LEAST(sr.basic_salary,15000)*0.12) AS emp_pf,
        ROUND(LEAST(sr.basic_salary,15000)*0.0367) AS er_epf,
        ROUND(LEAST(sr.basic_salary,15000)*0.0833) AS er_eps,
        ROUND(LEAST(sr.basic_salary,15000)*0.005) AS edli
       FROM salary_records sr JOIN users u ON u.user_id=sr.user_id
       WHERE sr.month=? AND sr.year=?`, [month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );
    const total = rows.reduce((a, r) => a + r.emp_pf + r.er_epf + r.er_eps + r.edli, 0);
    res.json({
      challan_type: 'ECR',
      month, year,
      establishment_name: 'Workforce Intelligence Pvt Ltd',
      wage_month: `${month}/${year}`,
      records: rows,
      total_payable: total,
      generated_at: new Date()
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── ESI (Employee State Insurance) ─────────────────────────────────────────
// Applicable if gross salary <= ₹21,000/month
// Employee: 0.75% of gross. Employer: 3.25% of gross
exports.calculateESI = async (req, res) => {
  try {
    const { employee_id, month, year } = req.body;
    const [sal] = await q(
      `SELECT sr.gross_salary, u.full_name FROM salary_records sr
       JOIN users u ON u.user_id=sr.user_id
       WHERE sr.user_id=? AND sr.month=? AND sr.year=?`,
      [employee_id, month, year]
    );
    if (!sal) return res.status(404).json({ message: 'Salary record not found' });

    const gross = parseFloat(sal.gross_salary) || 0;
    if (gross > 21000) return res.json({ eligible: false, message: 'Gross salary exceeds ESI ceiling of ₹21,000' });

    res.json({
      eligible: true,
      employee_id, month, year,
      employee_name: sal.full_name,
      gross_salary: gross,
      employee_contribution: Math.round(gross * 0.0075),
      employer_contribution: Math.round(gross * 0.0325),
      total: Math.round(gross * 0.04)
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getESIRecords = async (req, res) => {
  try {
    const { month, year } = req.query;
    const rows = await q(
      `SELECT u.full_name, u.employee_id AS emp_code, sr.gross_salary,
        ROUND(sr.gross_salary*0.0075) AS emp_esi,
        ROUND(sr.gross_salary*0.0325) AS er_esi
       FROM salary_records sr JOIN users u ON u.user_id=sr.user_id
       WHERE sr.gross_salary <= 21000
       ${month ? 'AND sr.month=?' : ''} ${year ? 'AND sr.year=?' : ''}
       ORDER BY u.full_name`,
      [month, year].filter(Boolean)
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── GRATUITY ────────────────────────────────────────────────────────────────
// Formula: (Last Basic / 26) × 15 × Years of Service
// Eligible after 5 continuous years
exports.calculateGratuity = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [u] = await q(
      `SELECT u.full_name, u.date_of_joining, sr.basic_salary
       FROM users u LEFT JOIN salary_records sr ON sr.user_id=u.user_id
       WHERE u.user_id=? ORDER BY sr.created_at DESC LIMIT 1`,
      [employee_id]
    );
    if (!u) return res.status(404).json({ message: 'Employee not found' });

    const doj = new Date(u.date_of_joining || Date.now());
    const yearsOfService = (Date.now() - doj) / (1000 * 60 * 60 * 24 * 365.25);
    const eligible = yearsOfService >= 5;
    const basic = parseFloat(u.basic_salary) || 0;
    const gratuity = eligible ? Math.round((basic / 26) * 15 * Math.floor(yearsOfService)) : 0;

    res.json({
      employee_id,
      employee_name: u.full_name,
      date_of_joining: u.date_of_joining,
      years_of_service: parseFloat(yearsOfService.toFixed(2)),
      last_basic: basic,
      eligible,
      gratuity_amount: gratuity,
      taxable_limit: 2000000,
      tax_exempt: Math.min(gratuity, 2000000),
      formula: '(Basic/26) × 15 × Years'
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGratuityEstimate = async (req, res) => {
  try {
    const rows = await q(
      `SELECT u.user_id, u.full_name, u.date_of_joining,
        COALESCE(sr.basic_salary,0) AS basic_salary,
        TIMESTAMPDIFF(YEAR, u.date_of_joining, NOW()) AS years_service
       FROM users u
       LEFT JOIN salary_records sr ON sr.user_id=u.user_id
       WHERE u.status='active' AND u.date_of_joining IS NOT NULL
       ORDER BY years_service DESC`
    );
    const result = rows.map(r => ({
      ...r,
      eligible: r.years_service >= 5,
      gratuity_estimate: r.years_service >= 5
        ? Math.round((r.basic_salary / 26) * 15 * r.years_service)
        : 0
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── PROFESSIONAL TAX (State-wise) ───────────────────────────────────────────
// State slabs differ; we implement the most common ones
const PT_SLABS = {
  karnataka: [
    { max: 14999, pt: 0 }, { max: 19999, pt: 150 }, { max: Infinity, pt: 200 }
  ],
  maharashtra: [
    { max: 7499, pt: 0 }, { max: 9999, pt: 175 }, { max: Infinity, pt: 200 }
  ],
  west_bengal: [
    { max: 8500, pt: 0 }, { max: 10000, pt: 90 }, { max: 15000, pt: 110 },
    { max: 25000, pt: 130 }, { max: 40000, pt: 150 }, { max: Infinity, pt: 200 }
  ],
  telangana: [
    { max: 14999, pt: 0 }, { max: Infinity, pt: 200 }
  ],
  default: [
    { max: 14999, pt: 0 }, { max: Infinity, pt: 200 }
  ]
};

exports.calculatePT = async (req, res) => {
  try {
    const { employee_id, month, year, state = 'karnataka' } = req.body;
    const [sal] = await q(
      `SELECT sr.gross_salary, u.full_name FROM salary_records sr
       JOIN users u ON u.user_id=sr.user_id WHERE sr.user_id=? AND sr.month=? AND sr.year=?`,
      [employee_id, month, year]
    );
    if (!sal) return res.status(404).json({ message: 'Salary record not found' });

    const gross = parseFloat(sal.gross_salary) || 0;
    const slabs = PT_SLABS[state.toLowerCase()] || PT_SLABS.default;
    const slab = slabs.find(s => gross <= s.max);
    const ptAmount = slab ? slab.pt : 200;

    res.json({
      employee_id, employee_name: sal.full_name,
      gross_salary: gross, state,
      professional_tax: ptAmount,
      month, year
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── COMPLIANCE SUMMARY ───────────────────────────────────────────────────────
exports.getComplianceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const [totals] = await q(
      `SELECT COUNT(*) AS employees,
        SUM(LEAST(basic_salary, 15000) * 0.12) AS employee_pf,
        SUM(LEAST(basic_salary, 15000) * 0.12) AS employer_pf,
        SUM(IF(gross_salary <= 21000, gross_salary * 0.0075, 0)) AS employee_esi,
        SUM(IF(gross_salary <= 21000, gross_salary * 0.0325, 0)) AS employer_esi,
        SUM(gross_salary) AS total_gross
       FROM salary_records WHERE month=? AND year=?`, [m, y]
    );

    res.json({
      period: `${m}/${y}`,
      employees: totals.employees || 0,
      pf: {
        employee: Math.round(totals.employee_pf || 0),
        employer: Math.round(totals.employer_pf || 0),
        total: Math.round((totals.employee_pf || 0) + (totals.employer_pf || 0))
      },
      esi: {
        employee: Math.round(totals.employee_esi || 0),
        employer: Math.round(totals.employer_esi || 0),
        total: Math.round((totals.employee_esi || 0) + (totals.employer_esi || 0))
      },
      total_gross: Math.round(totals.total_gross || 0),
      filing_due: new Date(y, m, 15).toISOString().split('T')[0]
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
