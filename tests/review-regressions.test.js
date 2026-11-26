const request = require('supertest');
const http = require('node:http');
const {once} = require('node:events');
const {io: connect} = require('socket.io-client');
// Exercise real MySQL issuance and history. Browser E2E verifies PDF rendering in Chromium.
jest.mock('../backend/services/pdfService', () => ({
  generatePayslipPDF: async () => ({buffer:Buffer.from('%PDF-1.4'),filename:'regression.pdf'})
}));
const app = require('../backend/app');
const database = require('../backend/config/db');
const sql = (statement,args) => require('../backend/services/database').query(database,statement,args);
const accounts = {};
const headers = role => ({Authorization:'Bearer '+accounts[role].token});
beforeAll(async()=>{
  for(const [role,email] of Object.entries({employee:'finance-ready@example.test',manager:'manager@wfintelligence.com',admin:'admin@wip.com',hr:'hr@wfintelligence.com'})){
    const login = await request(app).post('/api/auth/login').send({email,password:'P123/'}).expect(200);
    accounts[role]=login.body;
  }
});
afterAll(()=>new Promise(resolve=>database.end(resolve)));

test('issued payslips survive deletion and corrections retain the previous amounts and items',async()=>{
  const [component] = await sql('SELECT component_id FROM salary_components LIMIT 1');
  const record = {user_id:accounts.employee.user.user_id,month:1,year:2041,base_salary:10000,line_items:[{...component,amount:1200}]};
  const create = await request(app).post('/api/admin/salary').set(headers('hr')).send(record).expect(200);
  const id=create.body.salary_id;
  await request(app).get('/api/admin/salary/'+id+'/payslip-pdf').set(headers('employee')).expect(200);
  await request(app).delete('/api/admin/salary/'+id).set(headers('admin')).expect(409);
  expect((await sql('SELECT amount FROM salary_line_items WHERE salary_id=?',[id]))[0].amount).toEqual(1200);
  await request(app).post('/api/admin/salary').set(headers('hr')).send(record).expect(409);
  await request(app).post('/api/admin/salary').set(headers('hr')).send({...record,base_salary:11000,correction_reason:'Corrected January hours'}).expect(200);
  const [history]=await sql('SELECT previous_record,previous_items FROM payslip_corrections WHERE salary_id=?',[id]);
  expect(Number(JSON.parse(history.previous_record).base_salary)).toBe(10000);
  expect(Number(JSON.parse(history.previous_items)[0].amount)).toBe(1200);
});

test('leave approval is atomic during duplicate decisions and attendance failures',async()=>{
  const id=accounts.employee.user.user_id;
  await sql("INSERT INTO leave_balances(user_id,year,leave_type,entitled) VALUES (?,2042,'casual',10)",[id]);
  const make = date => request(app).post('/api/admin/leave').set(headers('employee')).send({from_date:date,to_date:date,leave_type:'casual'}).expect(201);
  const leave=(await make('2042-06-01')).body.leave_id;
  const approve = leaveId => request(app).patch('/api/admin/leave/'+leaveId+'/approve').set(headers('manager')).send({});
  const results=await Promise.all([approve(leave),approve(leave)]);
  expect(results.map(r=>r.status).sort()).toEqual([200,409]);
  const other=(await make('2042-06-02')).body.leave_id;
  await sql("CREATE TRIGGER review_injected_failure BEFORE INSERT ON attendance FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Injected attendance failure'");
  try {await approve(other).expect(500);} finally {await sql('DROP TRIGGER review_injected_failure');}
  expect((await sql('SELECT status FROM leave_requests WHERE leave_id=?',[other]))[0].status).toBe('pending');
  const [balance]=await sql("SELECT taken,pending FROM leave_balances WHERE user_id=? AND year=2042 AND leave_type='casual'",[id]);
  expect(balance).toEqual({taken:1,pending:1});
});

test('expense entry points enforce reviewer scope, payment stages and batch ownership',async()=>{
  const claim=async role=>(await request(app).post('/api/admin/expense-claims').set(headers(role)).send({amount:80,claim_date:'2026-11-10',description:'Regression'}).expect(201)).body.claim_id;
  const team=await claim('employee'), own=await claim('manager'), outsider=await claim('hr');
  for(const id of [own,outsider]){
    await request(app).patch('/api/travel/expenses/'+id).set(headers('manager')).send({action:'approve'}).expect(403);
    await request(app).patch('/api/admin/expense-claims/'+id+'/review').set(headers('manager')).send({status:'approved'}).expect(403);
  }
  await request(app).put('/api/admin/leave-balances').set(headers('manager')).send({user_id:accounts.hr.user.user_id}).expect(403);
  const pay=role=>request(app).patch('/api/admin/expense-claims/'+team+'/review').set(headers(role)).send({status:'paid'});
  await pay('hr').expect(409);
  await request(app).patch('/api/travel/expenses/'+team).set(headers('manager')).send({action:'approve'}).expect(200);
  await pay('manager').expect(403);
  const batch=(await request(app).post('/api/travel/batches').set(headers('hr')).send({claim_ids:[team]}).expect(200)).body.batch_id;
  await pay('hr').expect(409);
  await request(app).post('/api/travel/batches/'+batch+'/process').set(headers('hr')).send({}).expect(200);
  expect((await sql('SELECT status FROM expense_claims WHERE claim_id=?',[team]))[0].status).toBe('paid');
});

test('unit changes preserve opt-out and weather refuses external lookups without consent',async()=>{
  const set=body=>request(app).patch('/api/location/preferences').set(headers('employee')).send(body).expect(200);
  await set({location_enabled:0,weather_enabled:0,location_source:'manual'});
  await set({temp_unit:'fahrenheit'});
  const prefs=(await request(app).get('/api/location/me').set(headers('employee')).expect(200)).body.preferences;
  expect(prefs).toMatchObject({location_enabled:0,weather_enabled:0,location_source:'manual',temp_unit:'fahrenheit'});
  const spy=jest.spyOn(require('node:https'),'get');
  try {
    await request(app).get('/api/location/live?lat=12&lng=77').set(headers('employee')).expect(403);
    expect(spy).not.toHaveBeenCalled();
  }finally{spy.mockRestore();}
});

test('travel and night-shift requests support owner cancellation and a scoped decision', async () => {
  const employeeId = accounts.employee.user.user_id;
  const samples = [
    {path:'/api/travel/requests', id:'request_id', body:{travel_type:'domestic',from_location:'HQ',to_location:'Office',
      travel_date:'2043-07-01',estimated_cost:100,purpose:'Review fixture'}, createStatus:200,
      decision: {action:'approve'}, reviewSuffix:''},
    {path:'/api/safety/night-shift', id:'approval_id', body:{shift_date:'2043-07-01',shift_start:'21:00',shift_end:'05:00',
      transport_mode:'company_cab'}, createStatus:201, decision:{action:'approved'}, reviewSuffix:'/review'},
  ];
  for (const sample of samples) {
    const create = async role => (await request(app).post(sample.path).set(headers(role))
      .send(sample.body).expect(sample.createStatus)).body[sample.id];
    const review = (role, id) => request(app).patch(sample.path+'/'+id+sample.reviewSuffix).set(headers(role)).send(sample.decision);
    const cancel = (role, id) => request(app).post(sample.path+'/'+id+'/cancel').set(headers(role));
    const own = await create('employee');
    const cancelled = await create('employee');
    const unrelated = await create('hr');
    const self = await create('manager');
    const team = (await request(app).get(sample.path).set(headers('manager')).expect(200)).body;
    expect(team.find(record=>record[sample.id]===own)).toMatchObject({user_id:employeeId,status:'pending'});
    expect(team.some(record=>record[sample.id]===unrelated)).toBe(false);
    await review('manager',unrelated).expect(403);
    await review('manager',self).expect(403);
    await cancel('manager',cancelled).expect(404);
    await cancel('employee',cancelled).expect(200);
    await cancel('employee',cancelled).expect(200);
    await review('manager',cancelled).expect(409);
    const decisions = await Promise.all([review('manager',own),review('manager',own)]);
    expect(decisions.map(result=>result.status).sort()).toEqual([200,409]);
    await cancel('employee',own).expect(409);
  }
});

test('resignation and settlement decisions preserve the current stage and the recorded amount', async () => {
  const employee = accounts.employee.user.user_id;
  const path = '/api/exit';
  const post = (route,role,data) => request(app).post(path+route).set(headers(role)).send(data);
  const body = {reason:'personal',last_working_day:'2043-06-30'};
  const created = [];
  try {
    const first = (await post('/resign','employee',body).expect(200)).body.resignation_id;
    created.push(first);
    await post('/withdraw','hr',{resignation_id:first}).expect(404);
    await post('/withdraw','employee',{resignation_id:first}).expect(200);
    await post('/manager-acknowledge','manager',{resignation_id:first}).expect(409);
    const id = (await post('/resign','employee',body).expect(200)).body.resignation_id;
    created.push(id);
    await post('/hr-approve','hr',{resignation_id:id,action:'approve'}).expect(409);
    await post('/manager-acknowledge','manager',{resignation_id:id}).expect(200);
    await post('/withdraw','employee',{resignation_id:id}).expect(409);
    await post('/hr-approve','hr',{resignation_id:id,action:'approve'}).expect(200);
    const payment = {user_id:employee,reference:'Fixture transfer reference'};
    await post('/fnf/disburse','hr',payment).expect(409);
    const preview = (await request(app).get(path+'/fnf/'+employee).set(headers('hr')).expect(200)).body;
    expect(await sql('SELECT status FROM fnf_settlements WHERE user_id=?',[employee])).toHaveLength(0);
    await post('/fnf/approve','hr',{user_id:employee,approved_amount:preview.net_fnf+1}).expect(409);
    await post('/fnf/approve','hr',{user_id:employee,approved_amount:preview.net_fnf}).expect(200);
    await post('/fnf/disburse','hr',payment).expect(200);
    await post('/fnf/disburse','hr',payment).expect(200);
    await post('/fnf/disburse','hr',{...payment,reference:'Different reference'}).expect(409);
    const [record] = await sql('SELECT status,approved_amount,payment_reference FROM fnf_settlements WHERE user_id=?',[employee]);
    expect(record).toMatchObject({status:'disbursed',approved_amount:preview.net_fnf,payment_reference:payment.reference});
    expect((await sql('SELECT status FROM users WHERE user_id=?',[employee]))[0].status).toBe('active');
  } finally {
    await sql('DELETE FROM fnf_settlements WHERE user_id=?',[employee]);
    if (created.length) await sql('DELETE FROM resignations WHERE resignation_id IN (?)',[created]);
  }
});

test('confidential cases protect anonymous attribution and keep assigned review private', async () => {
  const path = '/api/safety/complaints';
  const admin = accounts.admin.user.user_id;
  const hr = accounts.hr.user.user_id;
  const employee = accounts.employee.user.user_id;
  const created = (await request(app).post(path).set(headers('employee')).send({
    is_anonymous:true,complaint_type:'other',against_user_id:admin,incident_date:'2025-12-10',
    description:'Synthetic case for confidentiality regression.'
  }).expect(201)).body.complaint_id;
  const [stored] = await sql('SELECT reporter_id,is_anonymous FROM safety_complaints WHERE complaint_id=?',[created]);
  expect(stored).toEqual({reporter_id:null,is_anonymous:1});
  const all = async role => (await request(app).get(path).set(headers(role)).expect(200)).body;
  expect((await all('hr')).find(record=>record.complaint_id===created)).toMatchObject({reporter_name:null,status:'filed'});
  expect((await all('admin')).some(record=>record.complaint_id===created)).toBe(false);
  await request(app).get(path).set(headers('manager')).expect(403);
  const patch= (role,id,data) => request(app).patch(path+'/'+id).set(headers(role)).send(data);
  await patch('admin',created,{status:'under_review'}).expect(404);
  await patch('hr',created,{assigned_to:admin}).expect(400);
  await patch('hr',created,{status:'resolved',resolution:'Test resolution.'}).expect(409);
  await patch('hr',created,{status:'under_review',assigned_to:hr}).expect(200);
  await patch('hr',created,{status:'resolved',resolution:'Test resolution.'}).expect(200);
  const assigned = (await request(app).post(path).set(headers('employee')).send({
    complaint_type:'other',incident_date:'2025-12-10',description:'Synthetic assigned review.'
  }).expect(201)).body.complaint_id;
  await patch('admin',assigned,{assigned_to:hr}).expect(200);
  expect((await all('admin')).some(record=>record.complaint_id===assigned)).toBe(false);
  expect((await all('hr')).some(record=>record.complaint_id===assigned)).toBe(true);
  expect((await request(app).get(path+'/my').set(headers('employee')).expect(200)).body
    .some(record=>record.complaint_id===assigned)).toBe(true);
  const [audit] = await sql("SELECT COUNT(*) AS total FROM audit_logs WHERE actor_id=? AND entity_type='safety_complaints'",[employee]);
  expect(audit.total).toBe(0);
});

test('helpdesk decisions are limited to the assigned manager and preserve closure',async()=>{
  const path='/api/helpdesk';
  const manager = accounts.manager.user.user_id;
  const id = (await request(app).post(path).set(headers('employee'))
    .send({category:'hr_query',subject:'Scoped helpdesk fixture',description:'Test private ticket.'}).expect(200)).body.ticket_id;
  const update = (role,body) => request(app).patch(path+'/'+id).set(headers(role)).send(body);
  const list = async () => (await request(app).get(path).set(headers('manager')).expect(200)).body;
  expect((await list()).some(record=>record.ticket_id===id)).toBe(false);
  await update('manager',{status:'in_progress'}).expect(404);
  await update('hr',{status:'in_progress',assigned_to:manager}).expect(200);
  expect((await list()).some(record=>record.ticket_id===id)).toBe(true);
  await update('manager',{status:'in_progress',assigned_to:null}).expect(403);
  await update('manager',{status:'pending_user'}).expect(200);
  const [ticket] = await sql('SELECT assigned_to FROM helpdesk_tickets WHERE ticket_id=?',[id]);
  expect(ticket.assigned_to).toBe(manager);
  await request(app).post(path+'/my/'+id+'/close').set(headers('employee')).expect(200);
  await update('manager',{status:'in_progress'}).expect(409);
  await request(app).post(path+'/'+id+'/escalate').set(headers('hr')).send({reason:'Test escalation'}).expect(409);
});

test('cab and benefit cancellations preserve terminal states', async () => {
  const employee = accounts.employee.user.user_id;
  const [route] = await sql('SELECT route_id FROM cab_routes ORDER BY route_id LIMIT 1');
  const [vehicle] = await sql('SELECT vehicle_id FROM cab_vehicles ORDER BY vehicle_id LIMIT 1');
  const cab = await sql(`INSERT INTO cab_bookings (user_id,route_id,vehicle_id,booking_date,status,journey_status)
    VALUES (?,?,?,'2043-07-01','approved','in_transit'),(?,?,?,'2043-07-02','pending','waiting')`,
  [employee,route.route_id,vehicle.vehicle_id,employee,route.route_id,vehicle.vehicle_id]);
  const cancelCab = id => request(app).delete('/api/cab/my/'+id).set(headers('employee'));
  await cancelCab(cab.insertId).expect(409);
  await cancelCab(cab.insertId+1).expect(200);
  await cancelCab(cab.insertId+1).expect(200);
  const [plan] = await sql('SELECT plan_id FROM insurance_plans ORDER BY plan_id LIMIT 1');
  const benefit = await sql("INSERT INTO employee_benefits (user_id,plan_id,enrollment_date,status) VALUES (?,?,CURRENT_DATE,'active')",
    [employee,plan.plan_id]);
  const path = '/api/benefits/'+benefit.insertId;
  await request(app).put(path).set(headers('employee')).send({status:'expired'}).expect(400);
  await request(app).patch(path+'/cancel').set(headers('employee')).expect(200);
  await request(app).patch(path+'/cancel').set(headers('employee')).expect(200);
  await request(app).put(path).set(headers('employee')).send({status:'active'}).expect(409);
});

test('sign-out disconnects the active socket and rejects a new handshake',async()=>{
  const server=http.createServer(app);
  const sockets=require('../backend/socketServer').createSocketServer(server);
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const client=connect('http://127.0.0.1:'+server.address().port,{auth:{token:accounts.manager.token},reconnection:false,autoConnect:false});
  try{
    const connected=once(client,'connect');client.connect();await connected;
    const disconnected=once(client,'disconnect');
    await request(app).post('/api/auth/logout').set(headers('manager')).send({}).expect(200);
    await disconnected;
    const refused=once(client,'connect_error');client.connect();await refused;
  }finally{client.disconnect();await new Promise(resolve=>sockets.close(resolve));}
});
