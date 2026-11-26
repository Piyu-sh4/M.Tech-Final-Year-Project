/**
 * pdfService.js — PDF Payslip Generator (4th Semester)
 * ═════════════════════════════════════════════════════
 * Generates a professional payslip PDF using Puppeteer (headless Chrome).
 * Stores the PDF in backend/uploads/payslips/ and saves path to employee_documents.
 *
 * Install: npm install puppeteer
 *
 * Route:  GET /api/admin/salary/:id/payslip-pdf
 * Called from: adminController.js → downloadPayslipPDF()
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');
const db        = require('../config/db');

function query(sql, p = []) {
  return new Promise((res, rej) =>
    db.query(sql, p, (e, rows) => e ? rej(e) : res(rows))
  );
}

const PAYSLIP_DIR = path.join(__dirname, '../uploads/payslips');
if (!fs.existsSync(PAYSLIP_DIR)) fs.mkdirSync(PAYSLIP_DIR, { recursive: true });

// ── Month name helper ──────────────────────────────────────────────────
function monthName(m) {
  return ['','January','February','March','April','May','June',
    'July','August','September','October','November','December'][m] || m;
}

// ── Fetch all payslip data from DB ─────────────────────────────────────
async function fetchPayslipData(salary_id) {
  const [salary] = await query(`
    SELECT sr.*, u.full_name, u.email, u.designation, u.join_date,
           u.employment_type, u.phone, u.department_id,
           d.dept_name, r.role_name
    FROM salary_records sr
    JOIN users        u ON sr.user_id = u.user_id
    LEFT JOIN departments d ON u.department_id = d.dept_id
    LEFT JOIN roles   r ON u.role_id = r.role_id
    WHERE sr.salary_id = ?
  `, [salary_id]);

  if (!salary) throw new Error(`Salary record #${salary_id} not found`);

  const lineItems = await query(`
    SELECT sli.amount, sli.is_deduction,
           sc.component_name, sc.component_type
    FROM salary_line_items sli
    JOIN salary_components sc ON sli.component_id = sc.component_id
    WHERE sli.salary_id = ?
    ORDER BY sli.is_deduction ASC, sc.component_name ASC
  `, [salary_id]);

  return { salary, lineItems };
}

// ── Build HTML template for the payslip ───────────────────────────────
function buildPayslipHTML({ salary, lineItems }) {
  const earnings   = lineItems.filter(l => !l.is_deduction);
  const deductions = lineItems.filter(l =>  l.is_deduction);
  const totalEarn  = earnings.reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalDed   = deductions.reduce((s, l) => s + parseFloat(l.amount), 0);

  const fmtINR = (n) =>
    '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const earningRows = earnings.map(l =>
    `<tr><td>${l.component_name}</td><td>${fmtINR(l.amount)}</td></tr>`
  ).join('');

  const deductionRows = deductions.map(l =>
    `<tr><td>${l.component_name}</td><td>${fmtINR(l.amount)}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1e293b; padding:32px; }
  .header { display:flex; justify-content:space-between; align-items:center;
            border-bottom:3px solid #1A3C6E; padding-bottom:16px; margin-bottom:20px; }
  .company h1 { font-size:22px; color:#1A3C6E; font-weight:700; }
  .company p  { color:#64748b; font-size:12px; margin-top:2px; }
  .payslip-title { text-align:right; }
  .payslip-title h2 { font-size:18px; color:#1A3C6E; }
  .payslip-title p  { color:#64748b; font-size:12px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
  .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; }
  .info-box h3 { font-size:11px; text-transform:uppercase; color:#64748b;
                 letter-spacing:0.5px; margin-bottom:8px; }
  .info-row { display:flex; justify-content:space-between; margin-bottom:4px; }
  .info-row .label { color:#64748b; }
  .info-row .value { font-weight:600; }
  .sal-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; }
  table th { background:#1A3C6E; color:white; padding:8px 10px; text-align:left; font-size:12px; }
  table td { padding:7px 10px; border-bottom:1px solid #f1f5f9; }
  table tr:nth-child(even) td { background:#f8fafc; }
  .sal-box h3 { font-size:12px; font-weight:700; color:#1A3C6E; margin-bottom:8px; }
  .total-row td { font-weight:700; background:#e0f2fe !important; color:#1A3C6E; }
  .net-box { background:#1A3C6E; color:white; border-radius:8px; padding:18px;
             display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
  .net-box .net-label { font-size:13px; opacity:0.85; }
  .net-box .net-amount { font-size:26px; font-weight:700; }
  .footer { border-top:2px solid #e2e8f0; padding-top:14px;
            display:flex; justify-content:space-between; align-items:flex-end; }
  .sig-line { border-top:1px solid #1A3C6E; width:180px; text-align:center;
              padding-top:4px; font-size:11px; color:#64748b; margin-top:40px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px;
           font-weight:600; }
  .badge-paid { background:#dcfce7; color:#166534; }
  .badge-pending { background:#fef3c7; color:#92400e; }
  .note { font-size:11px; color:#64748b; text-align:center; margin-top:12px; }
</style>
</head>
<body>

<div class="header">
  <div class="company">
    <h1>Workforce Intelligence Platform</h1>
    <p>AI-Powered HR & Payroll System  ·  v7.0</p>
  </div>
  <div class="payslip-title">
    <h2>PAYSLIP</h2>
    <p>${monthName(salary.month)} ${salary.year}</p>
    <p>Salary ID: #${salary.salary_id}</p>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h3>Employee Details</h3>
    <div class="info-row"><span class="label">Name</span>       <span class="value">${salary.full_name}</span></div>
    <div class="info-row"><span class="label">Email</span>      <span class="value">${salary.email}</span></div>
    <div class="info-row"><span class="label">Role</span>       <span class="value">${salary.role_name || '—'}</span></div>
    <div class="info-row"><span class="label">Designation</span><span class="value">${salary.designation || '—'}</span></div>
    <div class="info-row"><span class="label">Department</span> <span class="value">${salary.dept_name || '—'}</span></div>
    <div class="info-row"><span class="label">Emp. Type</span> <span class="value">${(salary.employment_type || 'Full Time').replace('_',' ')}</span></div>
    <div class="info-row"><span class="label">Join Date</span> <span class="value">${salary.join_date ? new Date(salary.join_date).toLocaleDateString('en-IN') : '—'}</span></div>
  </div>
  <div class="info-box">
    <h3>Payroll Details</h3>
    <div class="info-row"><span class="label">Pay Period</span>  <span class="value">${monthName(salary.month)} ${salary.year}</span></div>
    <div class="info-row"><span class="label">Base Salary</span> <span class="value">${fmtINR(salary.base_salary)}</span></div>
    <div class="info-row"><span class="label">Bonus</span>       <span class="value">${fmtINR(salary.bonus)}</span></div>
    <div class="info-row"><span class="label">Status</span>
      <span class="value">
        <span class="badge ${salary.payment_status === 'paid' ? 'badge-paid' : 'badge-pending'}">
          ${(salary.payment_status || 'pending').toUpperCase()}
        </span>
      </span>
    </div>
    ${salary.paid_on ? `<div class="info-row"><span class="label">Paid On</span><span class="value">${new Date(salary.paid_on).toLocaleDateString('en-IN')}</span></div>` : ''}
    <div class="info-row"><span class="label">Generated</span>  <span class="value">${new Date(salary.created_at).toLocaleDateString('en-IN')}</span></div>
  </div>
</div>

<div class="sal-grid">
  <div class="sal-box">
    <h3>Earnings</h3>
    <table>
      <tr><th>Component</th><th>Amount</th></tr>
      ${earningRows || '<tr><td colspan="2">—</td></tr>'}
      <tr class="total-row"><td>Total Earnings</td><td>${fmtINR(totalEarn)}</td></tr>
    </table>
  </div>
  <div class="sal-box">
    <h3>Deductions</h3>
    <table>
      <tr><th>Component</th><th>Amount</th></tr>
      ${deductionRows || '<tr><td colspan="2">—</td></tr>'}
      <tr class="total-row"><td>Total Deductions</td><td>${fmtINR(totalDed)}</td></tr>
    </table>
  </div>
</div>

<div class="net-box">
  <div>
    <div class="net-label">NET SALARY PAYABLE</div>
    <div style="font-size:11px;opacity:0.7;">Gross ${fmtINR(totalEarn)} – Deductions ${fmtINR(totalDed)}</div>
  </div>
  <div class="net-amount">${fmtINR(salary.net_salary)}</div>
</div>

<div class="footer">
  <div>
    <div class="note">This is a system-generated payslip. No physical signature required.</div>
    <div class="note">Generated by Workforce Intelligence Platform v7.0 on ${new Date().toLocaleDateString('en-IN')}</div>
  </div>
  <div class="sig-line">Authorised Signatory</div>
</div>

</body>
</html>`;
}

// ── Main export: generate PDF buffer ──────────────────────────────────
async function generatePayslipPDF(salary_id, requestingUserId) {
  const { salary, lineItems } = await fetchPayslipData(salary_id);

  const html     = buildPayslipHTML({ salary, lineItems });
  const filename = `payslip_${salary.user_id}_${salary.year}_${salary.month}.pdf`;
  const filepath = path.join(PAYSLIP_DIR, filename);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format:             'A4',
      printBackground:    true,
      margin:             { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    // Save to disk
    fs.writeFileSync(filepath, pdfBuffer);

    // Record in employee_documents table
    await query(
      `INSERT INTO employee_documents (user_id, document_type, file_path, uploaded_by)
       VALUES (?, 'payslip', ?, ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), uploaded_by = VALUES(uploaded_by)`,
      [salary.user_id, `uploads/payslips/${filename}`, requestingUserId || salary.user_id]
    ).catch(() => {}); // table may not exist in older installs

    return { buffer: pdfBuffer, filename, filepath };
  } finally {
    await browser.close();
  }
}

module.exports = { generatePayslipPDF };
