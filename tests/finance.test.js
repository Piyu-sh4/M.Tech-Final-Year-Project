process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'workforce_intelligence_test';
const request = require('supertest');
const app = require('../backend/app');
const db = require('../backend/config/db');
const {query} = require('../backend/services/database');
const {repaymentSchedule,calculateEMI} = require('../backend/services/loanMath');
const {calculateTax} = require('../backend/services/taxCalculator');
const tokens = {}, users = {};
let loanId, declarationId;
const auth = role => ({Authorization:'Bearer ' + tokens[role]});
const terms = {loan_type:'personal',amount_requested:120000,tenure_months:12,purpose:'Integration loan workflow'};

beforeAll(async () => {
  for (const [role,email] of Object.entries({admin:'admin@wip.com',manager:'manager@wfintelligence.com',hr:'hr@wfintelligence.com',
    employee:'employee@wfintelligence.com',ready:'finance-ready@example.test',new:'finance-new@example.test',zero:'finance-no-salary@example.test'})) {
    const result = await request(app).post('/api/auth/login').send({email,password:'P123/'}).expect(200);
    tokens[role] = result.body.token; users[role] = result.body.user;
  }
});
afterAll(async () => { await new Promise(resolve => db.end(resolve)); });

describe('Tax estimates',() => {
  test.each([
    [1275000,'new',0], [1285000,'new',10400], [550000,'old',0], [600000,'old',23400]
  ])('computes salary %s under %s regime', (gross,regime,expected) => {
    const result = calculateTax({financial_year:'2025-26',gross_income:gross,regime});
    expect(result.tax_payable).toBe(expected);
    expect(result.monthly_tds).toBe(Math.round(expected/12));
  });
  test.each([-1,'NaN',Infinity,5000001])('rejects unsupported income %s',value => {
    expect(() => calculateTax({gross_income:value})).toThrow();
  });
  test('zero-interest schedule balances and month ends remain valid',() => {
    expect(calculateEMI(1000,0,3).emi).toBe(333.33);
    const rows=repaymentSchedule(1000,0,3,'2027-01-31');
    expect(rows.map(row=>row.due)).toEqual(['2027-01-31','2027-02-28','2027-03-31']);
    expect(rows.reduce((sum,row)=>sum+row.principal,0)).toBe(1000);
  });
});

describe('Finance API and approval workflow',() => {
  test('travel expenses can only link to the claimant’s own travel request', async () => {
    const travel = await request(app).post('/api/travel/requests').set(auth('ready')).send({
      travel_type:'domestic', from_location:'Demo HQ', to_location:'Demo North',
      travel_date:'2027-08-01', return_date:'2027-08-02', purpose:'Expense linkage check', estimated_cost:500
    }).expect(200);
    const expense = {travel_request_id:travel.body.request_id, expense_date:'2027-08-01',
      category:'travel', description:'Rail fare', amount:400};
    expect(expense.travel_request_id).toEqual(expect.any(Number));
    await request(app).post('/api/travel/expenses').set(auth('employee')).send(expense).expect(404);
    await request(app).post('/api/travel/expenses').set(auth('ready')).send(expense).expect(200);
  });
  test('staff need a separate reviewer for their own salary and payment record', async () => {
    const payload = {user_id:users.hr.user_id, month:1, year:2048, base_salary:10000};
    await request(app).post('/api/admin/salary').set(auth('hr')).send(payload).expect(403);
    const salary = await request(app).post('/api/admin/salary').set(auth('admin')).send(payload).expect(200);
    await request(app).patch('/api/admin/salary/'+salary.body.salary_id+'/paid').set(auth('hr')).send({}).expect(403);
  });
  test('RBI bank directory is stored in MySQL',async()=>{
    const result=await request(app).get('/api/loans/bank-partners').set(auth('ready')).expect(200);
    expect(result.body).toHaveLength(123);
    expect(result.body.every(bank=>/^https?:\/\//.test(bank.website_url))).toBe(true);
  });
  test('new starter and missing salary cannot apply',async()=>{
    for(const role of ['new','zero']) {
      const result=await request(app).get('/api/loans/eligibility').set(auth(role)).expect(200);
      expect(result.body.eligible).toBe(false);
      await request(app).post('/api/loans/apply').set(auth(role)).send(terms).expect(409);
    }
  });
  test.each([-1,0,'invalid',100000001])('rejects invalid principal %s',async amount=>{
    await request(app).post('/api/loans/apply').set(auth('ready')).send({...terms,amount_requested:amount}).expect(400);
  });
  test('company amount and EMI caps are enforced',async()=>{
    await request(app).post('/api/loans/apply').set(auth('ready')).send({...terms,amount_requested:900000}).expect(400);
    await request(app).post('/api/loans/apply').set(auth('ready')).send({...terms,tenure_months:1}).expect(400);
  });
  test('concurrent applications produce one saved application',async()=>{
    const results=await Promise.all([1,2].map(()=>request(app).post('/api/loans/apply').set(auth('ready')).send(terms)));
    expect(results.map(result=>result.status).sort()).toEqual([201,409]);
    loanId=results.find(result=>result.status===201).body.loan_id;
    const [row]=await query(db,'SELECT * FROM loan_applications WHERE loan_id=?',[loanId]);
    expect(Number(row.principal)).toBe(terms.amount_requested);
  });
  test('approval sequence and role restrictions are enforced',async()=>{
    await request(app).patch('/api/loans/'+loanId+'/admin-approve').set(auth('admin')).send({action:'approved'}).expect(409);
    await request(app).patch('/api/loans/'+loanId+'/manager-review').set(auth('ready')).send({action:'approved'}).expect(403);
    await request(app).patch('/api/loans/'+loanId+'/hr-review').set(auth('hr')).send({action:'other'}).expect(400);
    for(const role of ['manager','hr','admin']) {
      await request(app).patch('/api/loans/'+loanId+'/' + (role==='admin'?'admin-approve':role+'-review')).set(auth(role)).send({action:'approved'}).expect(200);
    }
    const [row]=await query(db,'SELECT status FROM loan_applications WHERE loan_id=?',[loanId]);
    expect(row.status).toBe('approved');
  });
  test('disbursement retries retain exactly one complete schedule',async()=>{
    for(let retry=0;retry<2;retry++) await request(app).post('/api/loans/'+loanId+'/disburse').set(auth('admin'))
      .send({repayment_start:'2027-01-31'}).expect(200);
    const result=await request(app).get('/api/loans/'+loanId+'/repayments/my').set(auth('ready')).expect(200);
    expect(result.body).toHaveLength(12);
    expect(result.body[1].due_date.slice(0,10)).toBe('2027-02-28');
    expect(Math.round(result.body.reduce((sum,row)=>sum+Number(row.principal_part),0)*100)/100).toBe(120000);
  });
  test('other employees cannot read the schedule or record payments',async()=>{
    await request(app).get('/api/loans/'+loanId+'/repayments/my').set(auth('employee')).expect(404);
    const [repayment]=await query(db,'SELECT repayment_id FROM loan_repayments WHERE loan_id=? LIMIT 1',[loanId]);
    await request(app).patch('/api/loans/repayments/'+repayment.repayment_id+'/paid').set(auth('manager')).send({}).expect(403);
    await request(app).patch('/api/loans/repayments/'+repayment.repayment_id+'/paid').set(auth('admin')).send({}).expect(200);
  });
  test('credit score validation and persistence',async()=>{
    await request(app).put('/api/loans/credit-profile').set(auth('ready')).send({bureau:'CIBIL',score:901,checked_on:'2026-11-01'}).expect(400);
    await request(app).put('/api/loans/credit-profile').set(auth('ready')).send({bureau:'CIBIL',score:780,checked_on:'2026-11-01'}).expect(200);
    const result=await request(app).get('/api/loans/credit-profile').set(auth('ready')).expect(200);
    expect(result.body.score).toBe(780);
  });
  test('tax saves, submits, and approves one declaration',async()=>{
    const saved=await request(app).post('/api/tax/declaration/draft').set(auth('ready'))
      .send({financial_year:'2026-27',gross_income:1275000,regime:'new'}).expect(200);
    declarationId=saved.body.declaration_id;
    await request(app).post('/api/tax/declaration/'+declarationId+'/submit').set(auth('ready')).send({}).expect(200);
    await request(app).post('/api/tax/declaration/review').set(auth('hr'))
      .send({user_id:users.ready.user_id,financial_year:'2026-27',action:'approved'}).expect(200);
    const result=await request(app).get('/api/tax/declaration/my?fy=2026-27').set(auth('ready')).expect(200);
    expect(result.body.status).toBe('approved'); expect(Number(result.body.tax_liability)).toBe(0);
    await request(app).post('/api/tax/declaration/draft').set(auth('ready')).send({financial_year:'2026-27',gross_income:500000}).expect(409);
  });
  test('a failed tax save cannot produce a submitted declaration',async()=>{
    await request(app).post('/api/tax/declaration/submit').set(auth('ready'))
      .send({financial_year:'2025-26',gross_income:-1}).expect(400);
    const result=await request(app).get('/api/tax/declaration/my?fy=2025-26').set(auth('ready')).expect(200);
    expect(result.body).toBe(null);
  });
  test('suspension invalidates an existing JWT',async()=>{
    await query(db,"UPDATE users SET status='suspended' WHERE user_id=?",[users.zero.user_id]);
    try { await request(app).get('/api/auth/me').set(auth('zero')).expect(401); }
    finally { await query(db,"UPDATE users SET status='active' WHERE user_id=?",[users.zero.user_id]); }
  });
  test('revoking a session invalidates its token without affecting other sessions',async()=>{
    const session=await request(app).post('/api/auth/login').send({email:'finance-ready@example.test',password:'P123/'}).expect(200);
    const id=require('jsonwebtoken').decode(session.body.token).jti;
    await request(app).delete('/api/auth/sessions/'+id).set(auth('ready')).expect(200);
    await request(app).get('/api/auth/me').set('Authorization','Bearer '+session.body.token).expect(401);
    await request(app).get('/api/auth/me').set(auth('ready')).expect(200);
  });
  test('document upload saves the file and enforces private downloads',async()=>{
    const data=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lKYAAAAASUVORK5CYII=','base64');
    const saved=await request(app).post('/api/documents/upload').set(auth('ready')).field('doc_name','Integration upload').field('category','other')
      .attach('document',data,'test.png').expect(200);
    const list=await request(app).get('/api/documents').set(auth('ready')).expect(200);
    const document=list.body.find(row=>row.file_url===saved.body.file_url);
    expect(document.file_path).toBe(saved.body.file_url);
    await request(app).get('/api/documents/'+document.doc_id+'/download').set(auth('ready')).expect(200);
    await request(app).get('/api/documents/'+document.doc_id+'/download').set(auth('employee')).expect(404);
    await request(app).get(saved.body.file_url).expect(401);
    await request(app).delete('/api/documents/'+document.doc_id).set(auth('ready')).expect(200);
  });
  test('employees cannot read or update another employee task',async()=>{
    const created=await request(app).post('/api/tasks').set(auth('admin')).send({title:'Private integration task',assigned_to:users.ready.user_id}).expect(201);
    const url='/api/tasks/'+created.body.task_id;
    await request(app).get(url).set(auth('employee')).expect(404);
    await request(app).put(url).set(auth('employee')).send({status:'Completed'}).expect(404);
    await request(app).delete(url).set(auth('admin')).expect(200);
  });

  test('partial user updates preserve the existing name and email',async()=>{
    const [before]=await query(db,'SELECT full_name,email FROM users WHERE user_id=?',[users.zero.user_id]);
    await request(app).patch('/api/admin/users/'+users.zero.user_id).set(auth('admin')).send({base_salary:11000}).expect(200);
    const [after]=await query(db,'SELECT full_name,email,base_salary FROM users WHERE user_id=?',[users.zero.user_id]);
    expect(after.full_name).toBe(before.full_name);expect(after.email).toBe(before.email);expect(Number(after.base_salary)).toBe(11000);
  });

  test('refresh upgrades an older token into a revocable session',async()=>{
    const jwt=require('jsonwebtoken');
    const legacy=jwt.sign({user_id:users.ready.user_id,email:users.ready.email,role_id:2},process.env.JWT_SECRET,{expiresIn:'5m'});
    const response=await request(app).post('/api/auth/refresh').set('Authorization','Bearer '+legacy).send({}).expect(200);
    const session=jwt.decode(response.body.token).jti;expect(session).toBeDefined();
    await request(app).delete('/api/auth/sessions/'+session).set(auth('ready')).expect(200);
    await request(app).get('/api/auth/me').set('Authorization','Bearer '+response.body.token).expect(401);
  });

  test('resignation validates the reason and supports withdrawal',async()=>{
    await request(app).post('/api/exit/resign').set(auth('ready')).send({reason:'Invalid free text',last_working_day:'2027-03-01'}).expect(400);
    await request(app).post('/api/exit/resign').set(auth('ready')).send({reason:'personal',last_working_day:'2027-03-01',comments:'Integration exit test'}).expect(200);
    await request(app).post('/api/exit/resign').set(auth('ready')).send({reason:'personal',last_working_day:'2027-03-01'}).expect(409);
    await request(app).post('/api/exit/withdraw').set(auth('ready')).send({}).expect(200);
  });
  test('duplicate holiday date returns a conflict without overwriting the first',async()=>{
    const first=await request(app).post('/api/admin/holidays').set(auth('admin')).send({name:'Integration calendar',holiday_date:'2031-03-17',holiday_type:'company'}).expect(201);
    await request(app).post('/api/admin/holidays').set(auth('admin')).send({name:'Duplicate calendar',holiday_date:'2031-03-17',holiday_type:'public'}).expect(409);
    await request(app).delete('/api/admin/holidays/'+first.body.holiday_id).set(auth('admin')).expect(200);
  });

  test('a blocked account deletion preserves payroll, attendance and permissions',async()=>{
    const user=users.zero.user_id;
    const task=await query(db,`INSERT INTO tasks (title,assigned_by,assigned_to) VALUES ('Deletion integrity regression',?,?)`,[user,users.ready.user_id]);
    await query(db,"INSERT INTO attendance (user_id,work_date,status) VALUES (?,'2034-01-05','present')",[user]);
    await query(db,"INSERT INTO salary_records (user_id,month,year,base_salary,net_salary) VALUES (?,1,2034,11000,11000)",[user]);
    try {
      await request(app).delete('/api/admin/users/'+user).set(auth('admin')).expect(409);
      for(const table of ['users','user_permissions','attendance','salary_records']) {
        const [row]=await query(db,'SELECT COUNT(*) n FROM ?? WHERE user_id=?',[table,user]);
        expect(row.n).toBeGreaterThan(0);
      }
    } finally {
      await query(db,'DELETE FROM tasks WHERE task_id=?',[task.insertId]);
      await query(db,"DELETE FROM attendance WHERE user_id=? AND work_date='2034-01-05'",[user]);
      await query(db,'DELETE FROM salary_records WHERE user_id=? AND year=2034 AND month=1',[user]);
    }
  });

});
