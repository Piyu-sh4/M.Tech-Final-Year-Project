const { query, transaction } = require('./database');

const recoveryComponent = 'Cash Advance Recovery';
const cents = value => Math.round(Number(value || 0) * 100);
const money = value => value / 100;
const periodOf = (year, month) => Number(year) * 100 + Number(month);
const error = (message, status = 409) => Object.assign(new Error(message), { status });

async function ensure(database) {
  const [advance] = await query(database, "SHOW COLUMNS FROM salary_advances LIKE 'payroll_period'");
  if (!advance) await query(database, `ALTER TABLE salary_advances
    ADD payroll_period INT DEFAULT NULL, ADD requested_percentage TINYINT UNSIGNED DEFAULT NULL,
    ADD INDEX cash_advance_period (user_id, payroll_period, status)`);
  const [salary] = await query(database, "SHOW COLUMNS FROM salary_records LIKE 'cash_advance_deduction'");
  if (!salary) await query(database, 'ALTER TABLE salary_records ADD cash_advance_deduction DECIMAL(12,2) NOT NULL DEFAULT 0');
  await query(database, `INSERT INTO salary_components (name,component_type,description)
    SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM salary_components WHERE name=?)`,
    [recoveryComponent, 'deduction', 'Recovery of cash advanced against this payout', recoveryComponent]);
}

// Use the same pay calculation in the advance estimate and payroll generation.
async function calculatePayroll(run, employee, year, month) {
  const [{ absent_days }] = await run(`SELECT COUNT(*) AS absent_days FROM attendance
    WHERE user_id=? AND MONTH(work_date)=? AND YEAR(work_date)=? AND status='absent'`,
  [employee.user_id, month, year]);
  const base = cents(employee.base_salary);
  const allowances = [
    ['Basic Salary', base], ['HRA', Math.round(base * 0.40)],
    ['Travel Allowance', 160000], ['Medical Allowance', 125000],
    ['Special Allowance', Math.round(base * 0.10)]
  ];
  const deductions = [
    ['Provident Fund', Math.round(base * 0.12)],
    ['ESI', base <= 2100000 ? Math.round(base * 0.0075) : 0],
    ['Professional Tax', base > 2500000 ? 20000 : base > 1500000 ? 15000 : 8000],
    ['Leave Deduction', Math.round(absent_days * base / 26)]
  ];
  const gross = allowances.reduce((sum, [, amount]) => sum + amount, 0);
  const totalDeductions = deductions.reduce((sum, [, amount]) => sum + amount, 0);
  return { gross, deductions: totalDeductions, net: gross - totalDeductions, items: [...allowances, ...deductions] };
}

// Request, review and all payroll writes lock the employee before processing one of their payouts.
async function lockEmployee(run, userId) {
  const [employee] = await run('SELECT user_id,role_id,status,base_salary FROM users WHERE user_id=? FOR UPDATE', [userId]);
  if (!employee) throw error('Employee not found.', 404);
  return employee;
}

async function payout(run, employee, year, month) {
  const [salary] = await run('SELECT * FROM salary_records WHERE user_id=? AND month=? AND year=? FOR UPDATE',
    [employee.user_id, month, year]);
  const net = salary ? cents(salary.net_salary) + cents(salary.cash_advance_deduction) :
    (employee.base_salary > 0 ? (await calculatePayroll(run, employee, year, month)).net : 0);
  return { salary, net: Math.max(0, net) };
}

async function commitments(run, userId, period) {
  const advances = await run(`SELECT amount,status FROM salary_advances
    WHERE user_id=? AND payroll_period=? AND status IN ('pending','approved') FOR UPDATE`, [userId, period]);
  return advances.reduce((totals, advance) => {
    const amount = cents(advance.amount);
    totals.reserved += amount;
    if (advance.status === 'approved') totals.approved += amount;
    return totals;
  }, { reserved: 0, approved: 0 });
}

async function quote(run, employee) {
  const [{ year, month }] = await run('SELECT YEAR(CURRENT_DATE) AS year, MONTH(CURRENT_DATE) AS month');
  let currentYear = year;
  let currentMonth = month;
  let upcoming = await payout(run, employee, currentYear, currentMonth);
  while (upcoming.salary?.payment_status === 'paid') {
    currentMonth++;
    if (currentMonth === 13) {
      currentMonth = 1;
      currentYear++;
    }
    upcoming = await payout(run, employee, currentYear, currentMonth);
  }
  const { reserved } = await commitments(run, employee.user_id, periodOf(currentYear, currentMonth));
  const eligible = employee.role_id !== 1 && employee.status === 'active';
  const amount = eligible ? upcoming.net : 0;
  const available = Math.max(0, amount - reserved);
  return {
    year: currentYear, month: currentMonth, estimated: !upcoming.salary,
    payout: money(amount), reserved: money(reserved), available: money(available),
    max_percentage: amount > 0 ? Math.min(100, Math.floor(100 * available / amount)) : 0
  };
}

const getQuote = userId => transaction(async run => quote(run, await lockEmployee(run, userId)));

async function requestAdvance(userId, percentage, reason, expectedPayout) {
  if (!Number.isInteger(percentage) || percentage < 1 || percentage > 100)
    throw error('Choose a whole percentage from 1 to 100.', 400);
  if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 1500)
    throw error('Enter an advance reason of 1 to 1,500 characters.', 400);
  return transaction(async run => {
    const next = await quote(run, await lockEmployee(run, userId));
    if (expectedPayout && (expectedPayout.year !== next.year || expectedPayout.month !== next.month ||
        expectedPayout.payout !== next.payout))
      throw error('The upcoming payout changed. Reopen this form to check the updated estimate.');
    const amount = Math.floor(cents(next.payout) * percentage / 100);
    if (!amount) throw error('No positive upcoming payout is available for this request.');
    if (amount > cents(next.available))
      throw error('This request would exceed the upcoming payout after existing advances.');
    const inserted = await run(`INSERT INTO salary_advances
      (user_id, amount, reason, repay_months, payroll_period, requested_percentage) VALUES (?,?,?,1,?,?)`,
    [userId, money(amount), reason.trim(), periodOf(next.year, next.month), percentage]);
    return { advance_id: inserted.insertId, amount: money(amount), year: next.year, month: next.month };
  });
}

async function reviewAdvance(id, actorId, status) {
  if (!['approved', 'rejected'].includes(status)) throw error('Choose approved or rejected.', 400);
  return transaction(async run => {
    const [reference] = await run('SELECT user_id FROM salary_advances WHERE advance_id=?', [id]);
    if (!reference) throw error('Advance not found.', 404);
    if (reference.user_id === actorId) throw error('A separate reviewer must review this advance.', 403);
    const employee = await lockEmployee(run, reference.user_id);
    const [advance] = await run('SELECT * FROM salary_advances WHERE advance_id=? FOR UPDATE', [id]);
    if (!advance || advance.status !== 'pending') throw error('This advance has already been reviewed.');
    let period = advance.payroll_period;
    if (status === 'approved') {
      if (!period) {
        if (advance.repay_months !== 1) throw error('This older installment request must be resubmitted for next-payout recovery.');
        const next = await quote(run, employee);
        if (next.available < Number(advance.amount)) throw error('This advance would exceed the upcoming payout.');
        period = periodOf(next.year, next.month);
      }
      const year = Math.floor(period / 100);
      const month = period % 100;
      const upcoming = await payout(run, employee, year, month);
      if (upcoming.salary?.payment_status === 'paid') throw error('This payout was already paid. Ask the employee to submit a new request.');
      const { reserved } = await commitments(run, employee.user_id, period);
      if (reserved > upcoming.net) throw error('The outstanding advances exceed this payout. Review the payout or reject the request.');
    }
    await run('UPDATE salary_advances SET status=?, approved_by=?, approved_at=NOW(), payroll_period=? WHERE advance_id=?',
      [status, actorId, period, id]);
  });
}

async function writeRecoveryItem(run, salaryId, recovery) {
  const [component] = await run('SELECT component_id FROM salary_components WHERE name=?', [recoveryComponent]);
  await run('DELETE FROM salary_line_items WHERE salary_id=? AND component_id=?', [salaryId, component.component_id]);
  if (recovery > 0) await run('INSERT INTO salary_line_items (salary_id,component_id,amount) VALUES (?,?,?)',
    [salaryId, component.component_id, money(recovery)]);
}

async function checkPayoutOrder(run, userId, period) {
  const [earlier] = await run(`SELECT payroll_period FROM salary_advances
    WHERE user_id=? AND status='approved' AND payroll_period<? ORDER BY payroll_period LIMIT 1 FOR UPDATE`,
    [userId, period]);
  if (earlier) {
    const year = Math.floor(earlier.payroll_period / 100);
    const month = earlier.payroll_period % 100;
    throw error(`Settle the cash advance against payroll for ${month}/${year} before marking a later payout paid.`);
  }
}

async function recoverApproved(run, salary) {
  await run(`UPDATE salary_advances SET status='repaid', repaid_amount=amount
    WHERE user_id=? AND payroll_period=? AND status='approved'`, [salary.user_id, periodOf(salary.year, salary.month)]);
}

async function reconcileDraft(run, salary, actorId) {
  const previous = cents(salary.cash_advance_deduction);
  const { approved } = await commitments(run, salary.user_id, periodOf(salary.year, salary.month));
  const net = cents(salary.net_salary) + previous - approved;
  if (approved > 0 && net < 0) throw error('Approved cash advances exceed the payout. Review the payroll amounts before continuing.');
  if (approved === previous) return false;

  const [issued] = await run('SELECT download_id FROM payslip_downloads WHERE salary_id=? LIMIT 1', [salary.salary_id]);
  if (issued) {
    const items = await run('SELECT * FROM salary_line_items WHERE salary_id=?', [salary.salary_id]);
    await run('INSERT INTO payslip_corrections(salary_id,actor_id,reason,previous_record,previous_items) VALUES (?,?,?,?,?)',
      [salary.salary_id, actorId, 'Apply approved cash advance to the next payout', JSON.stringify(salary), JSON.stringify(items)]);
  }
  await run('UPDATE salary_records SET deductions=?, net_salary=?, cash_advance_deduction=? WHERE salary_id=?',
    [money(cents(salary.deductions) - previous + approved), money(net), money(approved), salary.salary_id]);
  await writeRecoveryItem(run, salary.salary_id, approved);
  return true;
}

module.exports = {
  ensure, cents, money, periodOf, calculatePayroll, lockEmployee, commitments, getQuote,
  requestAdvance, reviewAdvance, writeRecoveryItem, checkPayoutOrder, recoverApproved, reconcileDraft, recoveryComponent
};
