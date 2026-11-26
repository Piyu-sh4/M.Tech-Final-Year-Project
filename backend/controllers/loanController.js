const db = require('../config/db');
const { query, transaction } = require('../services/database');
const { calculateEMI, repaymentSchedule, round } = require('../services/loanMath');
const { isISODate: isDate } = require('../services/validation');
const q = (sql, params) => query(db, sql, params);
const types = ['home','vehicle','education','marriage','medical','emergency','personal'];
const failure = (message, status = 400) => Object.assign(new Error(message), { status });
const handle = work => (req, res, next) => Promise.resolve(work(req, res)).catch(next);
const today = () => new Date().toISOString().slice(0,10);

function terms(body) {
  const raw = body.amount_requested ?? body.principal ?? body.amount;
  const principal = Number(raw);
  const months = Number(body.tenure_months);
  const requestedType=body.loan_type || 'personal';
  const type=['bike','car'].includes(requestedType)?'vehicle':requestedType;
  const vehicleKind=requestedType==='bike'?'two_wheeler':requestedType==='car'?'four_wheeler':null;
  if (!['number','string'].includes(typeof raw) || !Number.isFinite(principal) || principal < .01 || principal > 100000000 ||
      !Number.isInteger(months) || months < 1 || months > 84 || !types.includes(type)) {
    throw failure('Enter a positive amount, a supported loan type, and a term of 1–84 months.');
  }
  return { principal: round(principal), months, type,vehicleKind };
}

async function rateFor(run, type) {
  const [row] = await run('SELECT setting_value FROM company_settings WHERE setting_key=?', ['loan_interest_' + type]);
  const rate = Number(row?.setting_value ?? 9);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw failure('The company loan rate needs review.', 409);
  return rate;
}

async function eligibility(run, id) {
  const [user] = await run(`SELECT user_id,base_salary,reporting_manager_id,department_id,
    GREATEST(0,TIMESTAMPDIFF(MONTH,join_date,CURRENT_DATE)) tenure_months FROM users WHERE user_id=?`, [id]);
  if (!user) throw failure('User not found.', 404);
  const settings = Object.fromEntries((await run("SELECT setting_key,setting_value FROM company_settings WHERE setting_key LIKE 'loan_%'"))
    .map(item => [item.setting_key,Number(item.setting_value)]));
  const multiplier = settings.loan_max_multiplier ?? 6;
  const minTenure = settings.loan_min_tenure_months ?? 12;
  const maxTenure = settings.loan_max_tenure_months ?? 84;
  const emiPercent = settings.loan_max_monthly_emi_pct ?? 40;
  if (![multiplier,minTenure,maxTenure,emiPercent].every(Number.isFinite) || multiplier <= 0 || emiPercent <= 0 || emiPercent > 100) {
    throw failure('The company loan limits need review.', 409);
  }
  const [{ active_count }] = await run(`SELECT COUNT(*) active_count FROM loan_applications
    WHERE user_id=? AND status IN ('pending','under_review','approved','disbursed')`, [id]);
  const [credit] = await run('SELECT bureau,score,checked_on FROM credit_profiles WHERE user_id=?', [id]);
  const salary = Number(user.base_salary) || 0;
  const reasons = [];
  if (salary <= 0) reasons.push('A recorded monthly salary is required.');
  if (user.tenure_months === null || user.tenure_months < minTenure) reasons.push('Minimum employment tenure is ' + minTenure + ' months.');
  if (active_count > 0) reasons.push('An active employee loan or application already exists.');
  return { ...user, eligible: reasons.length === 0, monthly_salary: salary,
    max_loan_amount: round(salary * multiplier), max_monthly_emi: round(salary * emiPercent / 100),
    min_tenure_months: minTenure, max_tenure_months: Math.min(84,maxTenure), active_loans: active_count,
    credit_profile: credit || null, credit_source: 'Self reported', reasons,
    scope: 'Company employee loan policy. Each bank performs its own credit assessment.' };
}

function stage(loan) {
  if (!['pending','under_review'].includes(loan.status)) return loan.status === 'approved' ? 'disburse' : null;
  if (loan.manager_action !== 'approved') return 'manager';
  if (loan.hr_action !== 'approved') return 'hr';
  return 'admin';
}

function readable(loan, user) {
  return [1,4].includes(user.role_id) || loan.user_id === user.user_id ||
    (user.role_id === 3 && loan.manager_id === user.user_id);
}

async function loanFor(run, id, user, lock = false) {
  if (!/^\d+$/.test(String(id))) throw failure('Invalid loan reference.');
  const [loan] = await run('SELECT * FROM loan_applications WHERE loan_id=?' + (lock ? ' FOR UPDATE' : ''), [id]);
  if (!loan || !readable(loan,user)) throw failure('Loan not found.',404);
  return loan;
}

exports.getMyLoans = handle(async (req,res) => {
  const rows = await q(`SELECT l.*,u.full_name,m.full_name manager_name FROM loan_applications l
    JOIN users u ON u.user_id=l.user_id LEFT JOIN users m ON m.user_id=l.manager_id
    WHERE l.user_id=? ORDER BY l.loan_id DESC`, [req.user.user_id]);
  res.json(rows.map(row => ({ ...row,review_stage:stage(row) })));
});
exports.getAllLoans = handle(async (req,res) => {
  const params = [];
  let sql = `SELECT l.*,u.full_name,m.full_name manager_name FROM loan_applications l
    JOIN users u ON u.user_id=l.user_id LEFT JOIN users m ON m.user_id=l.manager_id WHERE 1=1`;
  if (req.user.role_id === 3) { sql += ' AND (l.manager_id=? OR l.user_id=?)'; params.push(req.user.user_id,req.user.user_id); }
  if (req.query.status) { sql += ' AND l.status=?'; params.push(req.query.status); }
  const rows = await q(sql + ' ORDER BY l.loan_id DESC',params);
  res.json(rows.map(row => ({ ...row,review_stage:stage(row) })));
});
exports.checkEligibility = handle(async (req,res) => res.json(await eligibility(q,req.user.user_id)));
exports.calculateEMIRoute = handle(async (req,res) => {
  const {principal,months,type,vehicleKind} = terms(req.body);
  const rate = await rateFor(q,type);
  res.json({principal,tenure_months:months,annual_rate:rate,...calculateEMI(principal,rate,months)});
});
exports.applyLoan = handle(async (req,res) => {
  const {principal,months,type,vehicleKind} = terms(req.body);
  if (typeof req.body.purpose !== 'string' || !req.body.purpose.trim() || req.body.purpose.length > 1500) throw failure('Enter the purpose of the loan.');
  const result = await transaction(async run => {
    // Serializing on the applicant prevents concurrent requests bypassing the active-loan limit.
    await run('SELECT user_id FROM users WHERE user_id=? FOR UPDATE', [req.user.user_id]);
    const policy = await eligibility(run,req.user.user_id);
    if (!policy.eligible) throw failure(policy.reasons.join(' '),409);
    const rate = await rateFor(run,type);
    const calculation = calculateEMI(principal,rate,months);
    if (principal > policy.max_loan_amount || months > policy.max_tenure_months || calculation.emi > policy.max_monthly_emi) {
      throw failure('The requested amount, term, or monthly EMI exceeds the company policy limit.');
    }
    let manager = policy.reporting_manager_id;
    if (!manager) {
      const [candidate] = await run("SELECT user_id FROM users WHERE role_id=3 AND department_id=? AND status='active' ORDER BY user_id LIMIT 1", [policy.department_id]);
      manager = candidate?.user_id || null;
    }
    const row = await run(`INSERT INTO loan_applications
      (user_id,loan_type,principal,amount_requested,tenure_months,interest_rate,emi_amount,total_payable,purpose,manager_id,vehicle_kind)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [req.user.user_id,type,principal,principal,months,rate,calculation.emi,calculation.total,req.body.purpose.trim(),manager,vehicleKind]);
    return { loan_id:row.insertId,...calculation };
  });
  res.status(201).json({message:'Loan application submitted',...result,total_payable:result.total});
});

async function review(req,res,role) {
  const {action,note = ''} = req.body;
  if (!['approved','rejected'].includes(action) || typeof note !== 'string' || note.length > 1500) throw failure('Choose approve or reject and enter a note under 1,500 characters.');
  await transaction(async run => {
    const loan = await loanFor(run,req.params.id,req.user,true);
    if (loan.user_id === req.user.user_id) throw failure('Another reviewer must review your application.',403);
    if (role === 'manager' && req.user.role_id !== 1 && loan.manager_id !== req.user.user_id) throw failure('This application is assigned to another manager.',403);
    if (stage(loan) !== role) throw failure('This application is no longer awaiting this review.',409);
    if (action === 'approved' && role === 'admin') {
      const policy = await eligibility(run,loan.user_id);
      if (Number(loan.principal) > policy.max_loan_amount || Number(loan.emi_amount) > policy.max_monthly_emi) throw failure('The application exceeds the current company approval limit.');
    }
    const status = action === 'rejected' ? 'rejected' : role === 'admin' ? 'approved' : 'under_review';
    await run(`UPDATE loan_applications SET ${role}_action=?,${role}_id=?,${role}_note=?,${role}_remarks=?,${role}_at=NOW(),status=? WHERE loan_id=?`,
      [action,req.user.user_id,note,note,status,loan.loan_id]);
  });
  res.json({message:'Loan ' + action + ' by ' + role});
}
exports.managerReview = handle((req,res) => review(req,res,'manager'));
exports.hrReview = handle((req,res) => review(req,res,'hr'));
exports.adminApprove = handle((req,res) => review(req,res,'admin'));

exports.disburseLoan = handle(async (req,res) => {
  const result = await transaction(async run => {
    const loan = await loanFor(run,req.params.id,req.user,true);
    if (loan.user_id === req.user.user_id) throw failure('Another administrator must record this disbursement.',403);
    if (loan.status === 'disbursed') return {message:'Disbursement already recorded'};
    if (loan.status !== 'approved') throw failure('Complete manager, HR, and administrator approval first.',409);
    const amount = Number(req.body.amount_disbursed ?? loan.principal);
    const current = new Date();
    const start = req.body.repayment_start || new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,1)).toISOString().slice(0,10);
    if (!isDate(start) || start < today() || !Number.isFinite(amount) || amount <= 0 || amount > Number(loan.principal)) throw failure('Enter a valid repayment start and an amount within the approved principal.');
    const policy = await eligibility(run,loan.user_id);
    if (amount > policy.max_loan_amount || calculateEMI(amount,Number(loan.interest_rate),loan.tenure_months).emi > policy.max_monthly_emi) throw failure('This disbursement exceeds the current company limit.');
    const schedule = repaymentSchedule(round(amount),Number(loan.interest_rate),loan.tenure_months,start);
    if ((await run('SELECT repayment_id FROM loan_repayments WHERE loan_id=? LIMIT 1',[loan.loan_id])).length) throw failure('A repayment schedule already exists. Review the existing records.',409);
    for (const row of schedule) await run(`INSERT INTO loan_repayments
      (loan_id,user_id,installment_no,due_date,amount_due,emi_amount,principal_part,principal_comp,interest_part,interest_comp)
      VALUES (?,?,?,?,?,?,?,?,?,?)`, [loan.loan_id,loan.user_id,row.number,row.due,row.amount,row.amount,row.principal,row.principal,row.interest,row.interest]);
    await run(`UPDATE loan_applications SET status='disbursed',disbursed_at=NOW(),disbursal_date=CURRENT_DATE,
      disbursed_by=?,amount_disbursed=?,repayment_start=?,total_payable=?,emi_amount=? WHERE loan_id=?`,
      [req.user.user_id,amount,start,round(schedule.reduce((sum,row) => sum+row.amount,0)),schedule[0].amount,loan.loan_id]);
    return {message:'Disbursement and repayment schedule recorded',installments:schedule.length};
  });
  res.json(result);
});

async function repayments(req,res,ownOnly) {
  const loan = await loanFor(q,req.params.id,req.user);
  if (ownOnly && loan.user_id !== req.user.user_id) throw failure('Loan not found.',404);
  res.json(await q('SELECT * FROM loan_repayments WHERE loan_id=? ORDER BY installment_no',[loan.loan_id]));
}
exports.getMyRepayments = handle((req,res) => repayments(req,res,true));
exports.getLoanRepayments = handle((req,res) => repayments(req,res,false));
exports.markRepaymentPaid = handle(async (req,res) => {
  await transaction(async run => {
    const [reference] = await run('SELECT loan_id FROM loan_repayments WHERE repayment_id=?',[req.params.repayment_id]);
    if (!reference) throw failure('Repayment not found.',404);
    const loan = await loanFor(run,reference.loan_id,req.user,true);
    const [item] = await run('SELECT * FROM loan_repayments WHERE repayment_id=? FOR UPDATE',[req.params.repayment_id]);
    if (!item) throw failure('Repayment not found.',404);
    if (loan.user_id === req.user.user_id) throw failure('Another reviewer must record your repayment.',403);
    if (loan.status !== 'disbursed') throw failure('This loan is not awaiting repayments.',409);
    if (item.status === 'paid') return;
    const amount = Number(req.body.amount_paid ?? item.amount_due ?? item.emi_amount);
    const date = req.body.paid_date || today();
    if (!isDate(date) || date > today() || amount !== Number(item.amount_due ?? item.emi_amount)) throw failure('Record the full installment amount and a valid payment date.');
    await run("UPDATE loan_repayments SET status='paid',paid_date=?,amount_paid=?,paid_amount=? WHERE repayment_id=?",[date,amount,amount,item.repayment_id]);
    const [{remaining}] = await run("SELECT COUNT(*) remaining FROM loan_repayments WHERE loan_id=? AND status<>'paid'",[loan.loan_id]);
    if (!remaining) await run("UPDATE loan_applications SET status='closed' WHERE loan_id=?",[loan.loan_id]);
  });
  res.json({message:'Repayment recorded'});
});

exports.getBankPartners = handle(async (req,res) => res.json(await q('SELECT * FROM bank_directory ORDER BY category,name')));
exports.getBankOffers = handle(async (req,res) => {
  const policy = await eligibility(q,req.user.user_id);
  const rows = await q("SELECT * FROM bank_directory WHERE category NOT LIKE '%Payments%' ORDER BY name");
  res.json(rows.map(row => ({...row,bank:row.name,eligible_amount:policy.eligible ? policy.max_loan_amount : 0,
    scope:'Company policy estimate. Visit the bank for its eligibility, rates and application.'})));
});
exports.verifyDualEligibility = handle(async (req,res) => {
  const policy = await eligibility(q,req.user.user_id);
  const ids = req.body.bank_ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 123 || !ids.every(Number.isInteger)) throw failure('Choose valid banks.');
  const banks = await q('SELECT * FROM bank_directory WHERE bank_id IN (?)',[ids]);
  if (banks.length !== new Set(ids).size) throw failure('A selected bank was not found.');
  res.json({dual_eligibility:banks.map(bank => ({bank_id:bank.bank_id,eligible:policy.eligible,max_amount:policy.max_loan_amount,
    reason:policy.reasons.join(' ') || policy.scope,website_url:bank.website_url})),employee_gross:policy.monthly_salary,
    tenure_years:round((policy.tenure_months || 0)/12),scope:policy.scope});
});
exports.shareEligibilityResult = handle(async (req,res) => {
  await loanFor(q,req.body.loan_id,req.user);
  res.json({message:'Use Export CSV to download the application summary.',delivered:false});
});
exports.forecloseLoan = handle(async (req,res) => {
  const result = await transaction(async run => {
    const loan = await loanFor(run,req.params.id,req.user,true);
    if (loan.status !== 'disbursed') throw failure('Only disbursed loans can be settled.',409);
    const rows = await run("SELECT * FROM loan_repayments WHERE loan_id=? AND status<>'paid'",[loan.loan_id]);
    const outstanding = round(rows.reduce((sum,row) => sum+Number(row.principal_part || row.principal_comp),0));
    if (req.method === 'POST') {
      if (req.body.confirm !== true) throw failure('Confirm settlement before recording it.');
      if (outstanding <= 0 || (req.body.expected_amount !== undefined && Number(req.body.expected_amount) !== outstanding)) throw failure('The outstanding amount has changed. Refresh the schedule before recording settlement.',409);
      await run("UPDATE loan_applications SET status='foreclosed',foreclosed_at=NOW(),foreclosure_penalty=0 WHERE loan_id=?",[loan.loan_id]);
      await run(`UPDATE loan_repayments SET status='paid',paid_date=CURRENT_DATE,
        amount_paid=COALESCE(NULLIF(principal_part,0),principal_comp),paid_amount=COALESCE(NULLIF(principal_part,0),principal_comp)
        WHERE loan_id=? AND status<>'paid'`,[loan.loan_id]);
    }
    return {loan_id:loan.loan_id,outstanding_principal:outstanding,foreclosure_penalty:0,total_foreclosure_amount:outstanding,
      message:req.method === 'POST' ? 'Settlement recorded' : 'Company loan settlement estimate'};
  });
  res.json(result);
});
exports.getCreditProfile = handle(async (req,res) => {
  const [row] = await q('SELECT bureau,score,checked_on,updated_at FROM credit_profiles WHERE user_id=?',[req.user.user_id]);
  res.json(row || null);
});
exports.saveCreditProfile = handle(async (req,res) => {
  const {bureau,score,checked_on} = req.body;
  if (!['CIBIL','Experian','Equifax','CRIF High Mark'].includes(bureau) || !Number.isInteger(Number(score)) || Number(score)<300 || Number(score)>900 || !isDate(checked_on) || checked_on>today()) throw failure('Enter a bureau, a score from 300 to 900, and a report date up to today.');
  await q(`INSERT INTO credit_profiles (user_id,bureau,score,checked_on) VALUES (?,?,?,?)
    ON DUPLICATE KEY UPDATE bureau=VALUES(bureau),score=VALUES(score),checked_on=VALUES(checked_on)`,[req.user.user_id,bureau,score,checked_on]);
  res.json({message:'Self-reported credit score saved'});
});
