const request = require('supertest');
const app = require('../backend/app');
const database = require('../backend/config/db');
const { query } = require('../backend/services/database');

const sql = (statement, params) => query(database, statement, params);
const routes = '/api/admin/salary-advances';
const sessions = {};
const authorization = role => ({ Authorization: 'Bearer ' + sessions[role].token });

async function login(role, email) {
  const response = await request(app).post('/api/auth/login').send({ email, password: 'P123/' }).expect(200);
  sessions[role] = response.body;
}

async function fixture(role, salary) {
  const email = role + '-cash-advance@example.test';
  await sql(`INSERT INTO users (full_name,email,password_hash,role_id,status,base_salary,company_id)
    SELECT ?,?,password_hash,2,'active',?,company_id FROM users WHERE email='employee@wfintelligence.com'`, [role, email, salary]);
  await login(role, email);
}

beforeAll(async () => {
  await login('admin', 'admin@wip.com');
  await login('hr', 'hr@wfintelligence.com');
  await fixture('prepared', 40000);
  await fixture('estimated', 30000);
  await fixture('no-salary', 0);
});
afterAll(() => new Promise(resolve => database.end(resolve)));

const getQuote = role => request(app).get(routes + '/quote').set(authorization(role)).expect(200);
const submit = (role, percentage, reason = '  Cover an urgent expense  ') =>
  request(app).post(routes).set(authorization(role)).send({ percentage, reason });
const review = (id, status) => request(app).patch(routes + '/' + id + '/review').set(authorization('hr')).send({ status });
const generate = (month, year) => request(app).post('/api/admin/salary/generate').set(authorization('admin')).send({ month, year }).expect(200);
const settle = id => request(app).patch('/api/admin/salary/' + id + '/paid').set(authorization('hr')).send({}).expect(200);

async function payslip(userId, year, month) {
  return (await sql('SELECT * FROM salary_records WHERE user_id=? AND year=? AND month=?', [userId, year, month]))[0];
}
async function recoveryItems(salaryId) {
  return sql(`SELECT item.amount FROM salary_line_items item JOIN salary_components component USING(component_id)
    WHERE item.salary_id=? AND component.name='Cash Advance Recovery'`, [salaryId]);
}

test('a prepared payout caps concurrent requests and applies approved amounts exactly once', async () => {
  const userId = sessions.prepared.user.user_id;
  const { month, year } = (await getQuote('prepared')).body;
  const record = await request(app).post('/api/admin/salary').set(authorization('hr'))
    .send({ user_id:userId, month, year, base_salary:25000, deductions:5000 }).expect(200);
  const salaryId = record.body.salary_id;
  expect((await getQuote('prepared')).body).toMatchObject({ payout:20000, available:20000, estimated:false, max_percentage:100 });

  const simultaneous = await Promise.all([submit('prepared', 60), submit('prepared', 60)]);
  expect(simultaneous.map(result => result.status).sort()).toEqual([201, 409]);
  const first = simultaneous.find(result => result.status === 201).body;
  expect(first.amount).toBe(12000);
  expect(await sql('SELECT reason FROM salary_advances WHERE advance_id=?', [first.advance_id]))
    .toEqual([{ reason:'Cover an urgent expense' }]);
  expect((await getQuote('prepared')).body).toMatchObject({ reserved:12000, available:8000, max_percentage:40 });
  const second = (await submit('prepared', 40).expect(201)).body;
  await submit('prepared', 1).expect(409);

  await review(first.advance_id, 'approved').expect(200);
  await review(first.advance_id, 'approved').expect(409);
  await generate(month, year);
  expect(await payslip(userId, year, month)).toMatchObject({ net_salary:8000, deductions:17000, cash_advance_deduction:12000 });
  expect(await recoveryItems(salaryId)).toEqual([{ amount:12000 }]);
  await generate(month, year);
  expect(await recoveryItems(salaryId)).toEqual([{ amount:12000 }]);

  // A later payout cannot bypass recovery tied to the next unpaid month.
  await request(app).post('/api/admin/salary').set(authorization('hr'))
    .send({ user_id:userId, month, year:year+1, base_salary:25000, payment_status:'paid' }).expect(409);
  await review(second.advance_id, 'approved').expect(200);
  const [{ date: actualDate }] = await sql("SELECT DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '%Y-%m-%d') AS date");
  await request(app).patch('/api/admin/salary/' + salaryId + '/paid').set(authorization('hr'))
    .send({ paid_on:'2999-01-01' }).expect(400);
  const settled = await request(app).patch('/api/admin/salary/' + salaryId + '/paid').set(authorization('hr'))
    .send({ paid_on:actualDate, payment_method:'NEFT', transaction_ref:'example-credit-ref' }).expect(200);
  const [credit] = await sql("SELECT DATE_FORMAT(paid_on, '%Y-%m-%d') AS date, transaction_ref FROM salary_records WHERE salary_id=?", [salaryId]);
  expect(credit).toEqual({ date:actualDate, transaction_ref:'example-credit-ref' });
  expect(settled.body.net_salary).toBe(0);
  expect(await payslip(userId, year, month)).toMatchObject({ net_salary:0, deductions:25000, cash_advance_deduction:20000, payment_status:'paid' });
  expect(await recoveryItems(salaryId)).toEqual([{ amount:20000 }]);
  await settle(salaryId);
  await generate(month, year);
  expect(await recoveryItems(salaryId)).toEqual([{ amount:20000 }]);
  expect(await sql('SELECT status,repaid_amount FROM salary_advances WHERE user_id=? ORDER BY advance_id', [userId]))
    .toEqual([{ status:'repaid', repaid_amount:12000 }, { status:'repaid', repaid_amount:8000 }]);
  const subsequent = (await getQuote('prepared')).body;
  expect(subsequent.year * 100 + subsequent.month).toBeGreaterThan(year * 100 + month);
  expect(subsequent.reserved).toBe(0);
});

test('forecast and new payroll use the same amount and rejected requests release their reservation', async () => {
  const userId = sessions.estimated.user.user_id;
  const quote = (await getQuote('estimated')).body;
  const { payout, year, month } = quote;
  expect(payout).toBeGreaterThan(0);
  // Other test suites can already have generated this month. Exercise a genuinely new payroll record.
  const [existing] = await sql('SELECT salary_id FROM salary_records WHERE user_id=? AND year=? AND month=?', [userId, year, month]);
  if (existing) await request(app).delete('/api/admin/salary/' + existing.salary_id).set(authorization('admin')).expect(200);
  expect((await getQuote('estimated')).body).toMatchObject({ estimated:true, payout });
  const rejected = (await submit('estimated', 70).expect(201)).body;
  await review(rejected.advance_id, 'rejected').expect(200);
  expect((await getQuote('estimated')).body.max_percentage).toBe(100);
  const approved = (await submit('estimated', 25).expect(201)).body;
  await review(approved.advance_id, 'approved').expect(200);
  await generate(month, year);
  const generated = await payslip(userId, year, month);
  expect(generated.net_salary).toBeCloseTo(payout - approved.amount, 2);
  expect(await recoveryItems(generated.salary_id)).toEqual([{ amount:approved.amount }]);
  await request(app).delete('/api/admin/salary/' + generated.salary_id).set(authorization('admin')).expect(200);
  await generate(month, year);
  const regenerated = await payslip(userId, year, month);
  expect(await recoveryItems(regenerated.salary_id)).toEqual([{ amount:approved.amount }]);
});

test('bad percentages and unavailable pay are rejected', async () => {
  for (const value of [0, 101, 50.5, '25']) await submit('prepared', value).expect(400);
  const userId = sessions['no-salary'].user.user_id;
  // Keep this fixture free of the standard allowance-only payroll generated by other tests.
  await sql("DELETE FROM salary_records WHERE user_id=? AND payment_status='pending'", [userId]);
  expect((await getQuote('no-salary')).body.available).toBe(0);
  await submit('no-salary', 25).expect(409);
});

test('an advance reason is required and length is enforced', async () => {
  await request(app).post(routes).set(authorization('prepared')).send({ percentage:10 }).expect(400);
  for (const reason of ['', '   ', 'x'.repeat(1501)])
    await submit('prepared', 10, reason).expect(400);
});

test('employees can see the monthly policy and December credit deadline', async () => {
  const policies = await request(app).get('/api/modules/data/policies').set(authorization('prepared')).expect(200);
  expect(policies.body.find(policy => policy.policy_name === 'Monthly payroll payment schedule').content)
    .toMatch(/day 7 of the following month/);

  const user_id = sessions.prepared.user.user_id;
  const saved = await request(app).post('/api/admin/salary').set(authorization('hr'))
    .send({ user_id, month:12, year:2099, base_salary:25000 }).expect(200);
  const salaries = await request(app).get('/api/admin/salary/my').set(authorization('prepared')).expect(200);
  expect(salaries.body.find(salary => salary.salary_id === saved.body.salary_id))
    .toMatchObject({ credit_due_on:'2100-01-07', paid_on:null });
});
