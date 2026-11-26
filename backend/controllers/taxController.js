const db = require('../config/db');
const { query: execute, transaction } = require('../services/database');
const { calculateTax, getCurrentFY, validateYear } = require('../services/taxCalculator');
const query = (sql,params) => execute(db,sql,params);
const failure = (message,status=400) => Object.assign(new Error(message),{status});
const handle = work => (req,res,next) => Promise.resolve(work(req,res)).catch(next);
const year = value => {
  const fy = value || getCurrentFY();
  if (!validateYear(fy)) throw failure('Enter a valid financial year, for example 2026-27.');
  return fy;
};
exports.calculateTax = handle(async (req,res) => res.json(calculateTax(req.body)));
exports.getMyDeclaration = handle(async (req,res) => {
  const [row] = await query('SELECT * FROM tax_declarations WHERE user_id=? AND financial_year=?',[req.user.user_id,year(req.query.fy)]);
  res.json(row || null);
});
exports.getAllDeclarations = handle(async (req,res) => res.json(await query(`SELECT d.*,u.full_name,u.email
  FROM tax_declarations d JOIN users u ON u.user_id=d.user_id WHERE d.financial_year=? ORDER BY d.declaration_id DESC`,[year(req.query.fy)])));

async function save(run,uid,body) {
  const fy = year(body.financial_year);
  const calculation = calculateTax({...body,financial_year:fy});
  await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[uid]);
  const [existing] = await run('SELECT * FROM tax_declarations WHERE user_id=? AND financial_year=? FOR UPDATE',[uid,fy]);
  if (existing && !['draft','rejected'].includes(existing.status)) throw failure('Submitted or approved declarations cannot be edited.',409);
  const fields = ['ded_80c','ded_80d','ded_80e','ded_80g','ded_nps','ded_hra','ded_other','rent_paid'];
  const values = fields.map(key => calculation.deductions_detail[key]);
  const result = await run(`INSERT INTO tax_declarations
    (user_id,financial_year,regime,ded_80c,ded_80d,ded_80e,ded_80g,ded_nps,ded_hra,ded_other,rent_paid,gross_income,taxable_income,tax_liability)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
    regime=VALUES(regime),ded_80c=VALUES(ded_80c),ded_80d=VALUES(ded_80d),ded_80e=VALUES(ded_80e),ded_80g=VALUES(ded_80g),
    ded_nps=VALUES(ded_nps),ded_hra=VALUES(ded_hra),ded_other=VALUES(ded_other),rent_paid=VALUES(rent_paid),
    gross_income=VALUES(gross_income),taxable_income=VALUES(taxable_income),tax_liability=VALUES(tax_liability),
    status='draft',approved_by=NULL,approved_at=NULL,notes=NULL`,
    [uid,fy,calculation.regime,...values,calculation.gross_income,calculation.taxable_income,calculation.tax_payable]);
  return existing?.declaration_id || result.insertId;
}
exports.saveDraft = handle(async (req,res) => {
  const id = await transaction(run => save(run,req.user.user_id,req.body));
  res.json({message:'Draft saved',declaration_id:id});
});
exports.submitDeclaration = handle(async (req,res) => {
  const id = await transaction(async run => {
    await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE',[req.user.user_id]);
    let id = req.params.id;
    if (!id && Object.hasOwn(req.body,'gross_income')) id = await save(run,req.user.user_id,req.body);
    const [row] = await run('SELECT * FROM tax_declarations WHERE user_id=? AND ' + (id ? 'declaration_id=?' : 'financial_year=?') + ' FOR UPDATE',
      [req.user.user_id,id || year(req.body.financial_year)]);
    if (!row) throw failure('Save a declaration before submitting it.',404);
    if (row.status !== 'draft') throw failure('Only a draft can be submitted.',409);
    await run("UPDATE tax_declarations SET status='submitted',submitted_at=NOW() WHERE declaration_id=?",[row.declaration_id]);
    return row.declaration_id;
  });
  res.json({message:'Declaration submitted for review',declaration_id:id});
});
exports.reviewDeclaration = handle(async (req,res) => {
  const {user_id,financial_year,action,notes=''} = req.body;
  if (!['approved','rejected'].includes(action) || typeof notes !== 'string' || notes.length>1500) throw failure('Choose a valid review action and note.');
  if (Number(user_id) === req.user.user_id) throw failure('Another reviewer must review your declaration.',403);
  const result = await query(`UPDATE tax_declarations SET status=?,approved_by=?,approved_at=NOW(),notes=?
    WHERE user_id=? AND financial_year=? AND status='submitted'`,[action,req.user.user_id,notes,user_id,year(financial_year)]);
  if (!result.affectedRows) throw failure('No submitted declaration was found for this review.',409);
  res.json({message:'Declaration ' + action});
});

exports.getMyForm16 = async (req, res) => {
  try {
    const records = await query(
      `SELECT * FROM form16_records WHERE user_id=? ORDER BY financial_year DESC`,
      [req.user.user_id]
    );
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching Form 16', error: err.message });
  }
};

exports.getAllForm16 = async (req, res) => {
  try {
    const fy = year(req.query.fy);
    const rows = await query(
      `SELECT f.*, u.full_name, u.email, u.designation
       FROM form16_records f
       JOIN users u ON f.user_id = u.user_id
       WHERE f.financial_year=?
       ORDER BY u.full_name`,
      [fy]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching Form 16 records', error: err.message });
  }
};

exports.generateForm16 = async (req, res) => {
  try {
    const { user_id, financial_year, gross_salary, total_tds } = req.body;
    if (!user_id || !financial_year) return res.status(400).json({ message: 'user_id and financial_year required' });
    const [setting] = await query(`SELECT setting_value FROM company_settings WHERE setting_key='company_name'`);
    const employer_name = setting?.setting_value || 'Workforce Intelligence Pvt. Ltd.';
    await query(
      `INSERT INTO form16_records (user_id, financial_year, employer_name, employer_tan, gross_salary, total_tds, net_salary)
       VALUES (?,?,?,'BLRW12345D',?,?,?)
       ON DUPLICATE KEY UPDATE gross_salary=VALUES(gross_salary), total_tds=VALUES(total_tds), net_salary=VALUES(net_salary)`,
      [user_id, financial_year, employer_name, gross_salary, total_tds, gross_salary - total_tds]
    );
    res.json({ message: 'Form 16 generated', financial_year });
  } catch (err) {
    res.status(500).json({ message: 'Error generating Form 16', error: err.message });
  }
};

exports.getTdsSummary = async (req, res) => {
  try {
    const fy = req.query.fy || getCurrentFY();
    if (typeof fy !== 'string' || !/^\d{4}-\d{2}$/.test(fy) || Number(fy.slice(-2)) !== (Number(fy.slice(0,4))+1)%100)
      return res.status(400).json({message:'Enter a financial year such as 2026-27.'});
    const uid = req.user.user_id;
    // Pull from salary records where available
    const [decl] = await query(
      `SELECT tds_deducted, tax_liability FROM tax_declarations WHERE user_id=? AND financial_year=?`,
      [uid, fy]
    );
    const salary_rows = await query(
      `SELECT CONCAT(year,'-',LPAD(month,2,'0')) AS month_year, net_salary, basic_salary FROM salary_records
       WHERE user_id=? AND payment_status='paid' AND ((year=? AND month>=4) OR (year=? AND month<=3))
       ORDER BY year DESC, month DESC`,
      [uid,Number(fy.slice(0,4)),Number(fy.slice(0,4))+1]
    );
    res.json({ financial_year: fy, declaration: decl || null, salary_history: salary_rows });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching TDS summary', error: err.message });
  }
};
