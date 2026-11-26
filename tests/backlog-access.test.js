jest.mock('../backend/services/pdfService', () => ({ renderPDF: jest.fn(async () => Buffer.from('%PDF-')) }));

const request = require('supertest');
const app = require('../backend/app');
const database = require('../backend/config/db');
const { query } = require('../backend/services/database');

const tokens = {};
const actors = {};
const authorization = (role) => ({ Authorization: 'Bearer ' + tokens[role] });

beforeAll(async () => {
  for (const [role, email] of Object.entries({
    admin: 'admin@wip.com',
    manager: 'manager@wfintelligence.com',
    employee: 'employee@wfintelligence.com',
    hr: 'hr@wfintelligence.com'
  })) {
    const result = await request(app).post('/api/auth/login').send({ email, password: 'P123/' }).expect(200);
    tokens[role] = result.body.token;
    actors[role] = result.body.user;
  }
});

afterAll(() => new Promise(resolve => database.end(resolve)));

test.each([
  ['get', '/api/cab/all'], ['get', '/api/cab/drivers'],
  ['get', '/api/cab/drivers/1'], ['post', '/api/cab/drivers'],
  ['patch', '/api/cab/drivers/1'], ['delete', '/api/cab/drivers/1'],
  ['patch', '/api/cab/1/approve'], ['patch', '/api/cab/1/reject'],
  ['post', '/api/cab/ping'], ['patch', '/api/cab/journey/1/complete'],
  ['patch', '/api/cab/journey/1/acknowledge'], ['get', '/api/cab/notifications'],
  ['get', '/api/cab/sos'], ['patch', '/api/cab/sos/1/resolve'],
  ['get', '/api/cab/sos-alerts'], ['patch', '/api/cab/sos-alerts/1/resolve'],
  ['get', '/api/cab/issues'], ['get', '/api/cab/issues/stats'],
  ['patch', '/api/cab/issues/1'], ['get', '/api/cab-safety/driver/1/id-card'],
  ['post', '/api/cab-safety/assign-driver'], ['get', '/api/cab-safety/driver-cards'],
  ['get', '/api/reports'], ['get', '/api/reports/1'],
  ['get', '/api/reports/preview/Productivity'], ['get', '/api/reports/1/export'],
  ['get', '/api/analytics/summary'], ['get', '/api/analytics/hr-summary']
])('%s %s requires staff authorization', async (method, path) => {
  await request(app)[method](path).expect(401);
  await request(app)[method](path).set(authorization('employee')).expect(403);
});

test('cab staff can list and complete operations only with a passenger OTP', async () => {
  const result = await request(app).get('/api/cab/all').set(authorization('admin')).expect(200);
  expect(result.body.length).toBeGreaterThan(0);
  expect(result.body.every(booking => !Object.hasOwn(booking, 'otp'))).toBe(true);
  const [existing] = await query(database, 'SELECT booking_id,otp,status,journey_status FROM cab_bookings LIMIT 1');
  await query(database, "UPDATE cab_bookings SET otp='123456',status='approved',journey_status='waiting' WHERE booking_id=?",
    [existing.booking_id]);
  try {
    await request(app).patch('/api/cab/journey/' + existing.booking_id + '/complete')
      .set(authorization('admin')).send({}).expect(400);
    const [current] = await query(database, 'SELECT journey_status FROM cab_bookings WHERE booking_id=?', [existing.booking_id]);
    expect(current.journey_status).toBe('waiting');
  } finally {
    await query(database, 'UPDATE cab_bookings SET otp=?,status=?,journey_status=? WHERE booking_id=?',
      [existing.otp, existing.status, existing.journey_status, existing.booking_id]);
  }
});

test('cab tracking, vehicle and panel responses require the corresponding passenger or staff', async () => {
  const [booking] = await query(database, 'SELECT booking_id FROM cab_bookings WHERE user_id<>? LIMIT 1', [actors.employee.user_id]);
  for (const path of ['/api/cab/track/', '/api/cab-safety/tracking/', '/api/cab-safety/vehicle/', '/api/cab-safety/panel/']) {
    await request(app).get(path + booking.booking_id).set(authorization('employee')).expect(404);
    const staff = await request(app).get(path + booking.booking_id).set(authorization('admin')).expect(200);
    expect(staff.body).not.toHaveProperty('otp');
  }
});

test.each([
  '/api/tasks/productivity/', '/api/ai/leave-forecast/',
  '/api/exit/checklist/', '/api/achievements/', '/api/suggestions/'
])('%s denies access to a different employee record', async path => {
  await request(app).get(path + actors.admin.user_id).set(authorization('employee')).expect(403);
});

test.each([
  ['post', '/api/admin/holidays'], ['delete', '/api/admin/holidays/1'],
  ['post', '/api/admin/alerts'], ['post', '/api/admin/attendance'],
  ['post', '/api/admin/departments/1/assign'], ['post', '/api/settings/policies'],
  ['put', '/api/settings/policies/1'], ['put', '/api/announcements/1'],
  ['delete', '/api/announcements/1'], ['post', '/api/notifications/broadcast'],
  ['patch', '/api/projects/1'], ['delete', '/api/projects/1'],
  ['get', '/api/compliance/pf'], ['get', '/api/analytics/hr-summary'],
  ['get', '/api/analytics/summary?refresh=1']
])('%s %s denies a manager access to company administration', async (method, path) => {
  await request(app)[method](path).set(authorization('manager')).expect(403);
});

test('public health and password failures expose only the intended response', async () => {
  const health = await request(app).get('/api/health').expect(200);
  expect(health.body).toEqual({ status: 'healthy' });
  const results = [];
  for (const email of ['unregistered@example.test', actors.employee.email]) {
    results.push((await request(app).post('/api/auth/login')
      .send({ email, password: 'Incorrect-test-password' }).expect(401)).body);
  }
  expect(results[0]).toEqual(results[1]);
});

test('invalid helpdesk categories and letter types return validation errors', async () => {
  await request(app).post('/api/helpdesk').set(authorization('employee'))
    .send({ category: 'it', subject: 'Support', description: 'Need help' }).expect(400);
  await request(app).post('/api/letters/generate').set(authorization('hr'))
    .send({ user_id: actors.employee.user_id, letter_type: 'unknown' }).expect(400);
});

test('profile photo upload validates the file format and only serves it to the owner', async () => {
  await request(app).post('/api/auth/profile/photo').set(authorization('employee'))
    .attach('photo', Buffer.from('plain text'), { filename: 'note.png', contentType: 'image/png' }).expect(400);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9twAAAAASUVORK5CYII=', 'base64');
  const uploaded = await request(app).post('/api/auth/profile/photo').set(authorization('employee'))
    .attach('photo', png, { filename: 'profile.png', contentType: 'image/png' }).expect(200);
  const [profile] = await query(database, 'SELECT photo_url FROM users WHERE user_id=?', [actors.employee.user_id]);
  const me = await request(app).get('/api/auth/me').set(authorization('employee')).expect(200);
  expect(me.body.photo_url).toBe(uploaded.body.photo_url);
  expect(me.body.photo_url).not.toBe(profile.photo_url);
  await request(app).get(profile.photo_url).expect(401);
  await request(app).get(uploaded.body.photo_url).expect(401);
  await request(app).get(uploaded.body.photo_url).set(authorization('manager')).expect(404);
  await request(app).get(uploaded.body.photo_url).set(authorization('employee'))
    .expect('Content-Type', /image\/png/).expect('Content-Disposition', /attachment/).expect(200);
});

test('meeting passwords are hashed and participants submit chat messages only', async () => {
  const created = await request(app).post('/api/meetings').set(authorization('manager')).send({
    title: 'Protected meeting', scheduled_at: '2027-03-01 10:00:00', password: 'meeting secret',
    participant_user_ids: [actors.employee.user_id]
  }).expect(201);
  const id = created.body.meeting_id;
  const [meeting] = await query(database, 'SELECT password FROM meetings WHERE meeting_id=?', [id]);
  expect(meeting.password).toHaveLength(60);
  expect(await require('bcryptjs').compare('meeting secret', meeting.password)).toBe(true);
  const base = '/api/meetings/' + id;
  const joined = await request(app).post(base + '/join').set(authorization('employee'))
    .send({ password: 'meeting secret' }).expect(200);
  expect(joined.body.meeting).not.toHaveProperty('password');
  await request(app).post(base + '/messages').set(authorization('employee'))
    .send({ content: 'Meeting text' }).expect(201);
  const [message] = await query(database,
    "SELECT msg_type FROM meeting_messages WHERE meeting_id=? AND content='Meeting text'", [id]);
  expect(message.msg_type).toBe('chat');
});

test('policy attachments are available only to authenticated readers in the audience', async () => {
  const policy = await request(app).post('/api/policies/upload').set(authorization('hr'))
    .field('title', 'HR policy regression')
    .field('applicable_to', 'HR')
    .attach('policy_pdf', Buffer.from('%PDF-1.4\n'), { filename: 'policy.pdf', contentType: 'application/pdf' })
    .expect(200);
  await request(app).get(policy.body.file_url).expect(401);
  await request(app).get(policy.body.file_url).set(authorization('employee')).expect(404);
  await request(app).get(policy.body.file_url).set(authorization('hr'))
    .expect('Content-Disposition', /attachment/).expect('X-Content-Type-Options', 'nosniff').expect(200);
});

test('an ordinary profile update cannot write bank account details', async () => {
  await request(app).put('/api/auth/profile').set(authorization('employee'))
    .send({ full_name: actors.employee.full_name, account_number: '111122223333' }).expect(400);
  const profile = await request(app).get('/api/auth/me').set(authorization('employee')).expect(200);
  expect(profile.body).not.toHaveProperty('account_number');
});

test('interview feedback requires an assigned interviewer or HR', async () => {
  const [round] = await query(database,
    'SELECT round_id FROM interview_rounds WHERE NOT (interviewer_id <=> ?) LIMIT 1',
    [actors.employee.user_id]);
  expect(round).toBeDefined();
  await request(app).patch('/api/hiring/interviews/' + round.round_id + '/feedback')
    .set(authorization('employee')).send({ result: 'on_hold' }).expect(404);
});

test('forwarded address headers cannot substitute the peer when no proxy was configured', async () => {
  const session = await request(app).get('/api/auth/session-context').set(authorization('employee'))
    .set('CF-Connecting-IP', '198.51.100.12').expect(200);
  expect(session.body.ip_address).not.toBe('198.51.100.12');
});

test('password requests are bounded per normalized account', async () => {
  const previous = process.env.RATE_LIMIT_LOGIN_ACCOUNT;
  process.env.RATE_LIMIT_LOGIN_ACCOUNT = '2';
  try {
    const login = email => request(app).post('/api/auth/login')
      .send({ email, password: 'Incorrect-test-password' });
    await login('rate-limit-demo@example.test').expect(401);
    await login(' RATE-LIMIT-DEMO@EXAMPLE.TEST ').expect(401);
    await login('rate-limit-demo@example.test').expect('Retry-After', /^\d+$/).expect(429);
    await login('different-rate-limit@example.test').expect(401);
  } finally {
    if (previous === undefined) delete process.env.RATE_LIMIT_LOGIN_ACCOUNT;
    else process.env.RATE_LIMIT_LOGIN_ACCOUNT = previous;
  }
});

test('project access follows membership across lists, details, totals and the calendar', async () => {
  const create = async (role, name) => (await request(app).post('/api/projects')
    .set(authorization(role)).send({ name, due_date: '2027-01-15', completion_pct: 35 }).expect(200)).body.project_id;
  const internal = await create('hr', 'Authorization fixture: HR project');
  const managed = await create('manager', 'Authorization fixture: manager project');
  try {
    const employee = authorization('employee');
    const manager = authorization('manager');
    const statsBefore = (await request(app).get('/api/projects/stats').set(employee).expect(200)).body.total;
    await request(app).get('/api/projects/' + internal).set(employee).expect(404);
    await request(app).post('/api/projects/' + internal + '/members').set(manager)
      .send({ user_id: actors.employee.user_id }).expect(404);
    await request(app).post('/api/projects/' + managed + '/members').set(manager)
      .send({ user_id: actors.employee.user_id }).expect(200);
    for (const path of ['/api/projects', '/api/projects/my']) {
      const list = (await request(app).get(path).set(employee).expect(200)).body;
      expect(list.map(project => project.project_id)).toContain(managed);
      expect(list.map(project => project.project_id)).not.toContain(internal);
    }
    const stats = (await request(app).get('/api/projects/stats').set(employee).expect(200)).body;
    expect(stats.total).toBe(statsBefore + 1);
    const calendar = (await request(app).get('/api/modules/data/calendar').set(employee).expect(200)).body;
    expect(calendar.map(event => event.title)).toContain('Authorization fixture: manager project');
    expect(calendar.map(event => event.title)).not.toContain('Authorization fixture: HR project');
    const project = (await request(app).get('/api/projects/' + managed).set(employee).expect(200)).body;
    expect(project.completion_pct).toBe(35);
    const milestone = (await request(app).post('/api/projects/' + internal + '/milestones')
      .set(authorization('hr')).send({ title: 'HR project milestone' }).expect(200)).body.milestone_id;
    await request(app).patch(`/api/projects/${managed}/milestones/${milestone}`).set(manager)
      .send({ status: 'completed' }).expect(404);
    await request(app).patch(`/api/projects/${internal}/milestones/${milestone}`).set(authorization('hr'))
      .send({ status: 'completed' }).expect(200);
  } finally {
    await query(database, 'DELETE FROM projects WHERE project_id IN (?,?)', [internal, managed]);
  }
});

test('policy audience checks apply to the catalog and acknowledgements', async () => {
  const result = await query(database, `INSERT INTO company_policies
    (title,policy_name,content,category,applicable_to,is_active) VALUES (?,?,?,'General','hr',1)`,
    ['Audience fixture', 'Audience fixture', 'Restricted policy']);
  const policyId = result.insertId;
  try {
    const employee = authorization('employee');
    await request(app).post('/api/policies/' + policyId + '/acknowledge').set(employee).expect(404);
    const list = (await request(app).get('/api/modules/data/policies').set(employee).expect(200)).body;
    expect(list.map(policy => policy.policy_name)).not.toContain('Audience fixture');
    await request(app).post('/api/policies/' + policyId + '/acknowledge').set(authorization('hr')).expect(200);
  } finally {
    await query(database, 'DELETE FROM policy_acknowledgements WHERE policy_id=?', [policyId]);
    await query(database, 'DELETE FROM company_policies WHERE policy_id=?', [policyId]);
  }
});

test('disciplinary records require specific oversight roles', async () => {
  await request(app).get('/api/modules/disciplinary/records').set(authorization('manager')).expect(403);
  await request(app).get('/api/modules/disciplinary/records').set(authorization('employee')).expect(403);
  await request(app).get('/api/modules/disciplinary/records').set(authorization('hr')).expect(200);
});

test('chat imports require explicit credentials and register accounts for approval as employees', async () => {
  const importedEmail = 'authorization-import@example.test';
  try {
    const imported = await request(app).post('/api/chat/import').set(authorization('admin')).send({
      type: 'users',
      rows: [
        { name: 'Incomplete account', email: 'missing-password@example.test' },
        { name: 'Imported employee', email: importedEmail, role_id: 4, status: 'active', password: 'Initial2026!' },
      ],
    }).expect(200);
    expect(imported.body.inserted).toBe(1);
    expect(imported.body.errors).toHaveLength(1);
    const [account] = await query(database, 'SELECT role_id,status FROM users WHERE email=?', [importedEmail]);
    expect(account).toMatchObject({ role_id: 2, status: 'pending' });
  } finally {
    await query(database, 'DELETE FROM users WHERE email=?', [importedEmail]);
  }
});

test('company benefits and learning registers require HR oversight', async () => {
  for (const route of ['/api/benefits', '/api/benefits/user/' + actors.employee.user_id,
    '/api/training/all-enrollments', '/api/training/stats']) {
    await request(app).get(route).set(authorization('manager')).expect(403);
    await request(app).get(route).set(authorization('hr')).expect(200);
  }
  await request(app).get('/api/benefits/my').set(authorization('manager')).expect(200);
  await request(app).get('/api/training/my').set(authorization('manager')).expect(200);
  await request(app).patch('/api/benefits/2147483647/cancel').set(authorization('employee')).expect(404);
  await request(app).patch('/api/training/progress/2147483647').set(authorization('employee'))
    .send({ progress_pct: 15 }).expect(404);
});

test('employee file imports create pending accounts with no shared password', async () => {
  const addresses = ['file-import-first@example.test', 'file-import-second@example.test'];
  try {
    const result = await request(app).post('/api/upload/import/employees').set(authorization('admin'))
      .send({ rows: addresses.map(email => ({ email, name: 'File import fixture', role_id: 4, status: 'active' })) }).expect(200);
    expect(result.body.imported).toBe(2);
    const accounts = await query(database, 'SELECT role_id,status,password_hash FROM users WHERE email IN (?)', [addresses]);
    expect(accounts).toHaveLength(2);
    expect(new Set(accounts.map(account => account.password_hash)).size).toBe(2);
    for (const account of accounts) {
      expect(account).toMatchObject({ role_id: 2, status: 'pending' });
      expect(await require('bcryptjs').compare('Welcome@123', account.password_hash)).toBe(false);
    }
  } finally {
    await query(database, 'DELETE FROM users WHERE email IN (?)', [addresses]);
  }
});

test('employee ID cards require sign-in and export the current profile as PDF', async () => {
  const path = '/api/auth/profile/id-card.pdf';
  await request(app).get(path).expect(401);
  await request(app).get(path + '?user_id=' + actors.admin.user_id).set(authorization('employee'))
    .expect('Content-Type', /application\/pdf/)
    .expect('Content-Disposition', /attachment.*employee-id-card\.pdf/)
    .expect(200);
  const { renderPDF } = require('../backend/services/pdfService');
  const [html] = renderPDF.mock.lastCall;
  expect(html).toContain(actors.employee.email);
  expect(html).not.toContain(actors.admin.email);
});

test('account accents persist independently of the quick theme toggle', async () => {
  const path = '/api/auth/preferences';
  const employee = authorization('employee');
  const original = (await request(app).get(path).set(employee).expect(200)).body;
  try {
    await request(app).patch(path).set(employee).send({ theme: 'day', accent: 'unknown' }).expect(400);
    await request(app).patch(path).set(employee).send({ theme: 'day', accent: 'teal' }).expect(200);
    await request(app).patch(path).set(employee).send({ theme: 'night' }).expect(200);
    const saved = await request(app).get(path).set(employee).expect(200);
    expect(saved.body).toEqual({ theme: 'night', accent: 'teal' });
  } finally {
    await request(app).patch(path).set(employee).send(original).expect(200);
  }
});

test('report PDFs use the stored record and enforce report catalog visibility', async () => {
  const reports = await request(app).get('/api/modules/data/reports').set(authorization('admin')).expect(200);
  const ownReports = await request(app).get('/api/modules/data/reports').set(authorization('employee')).expect(200);
  const employeeReportIds = new Set(ownReports.body.map(report => report.report_id));
  const report = reports.body.find(report => !employeeReportIds.has(report.report_id));
  const path = '/api/reports/' + report.report_id + '/pdf';
  await request(app).get(path).expect(401);
  await request(app).get(path).set(authorization('employee')).expect(404);
  const download = await request(app).get(path).set(authorization('admin')).expect(200);
  expect(download.headers['content-type']).toMatch(/^application\/pdf/);
  expect(download.headers['content-disposition']).toContain('report-' + report.report_id + '.pdf');
});

test('personal task filters only return matching tasks assigned to the signed-in user', async () => {
  const employee = authorization('employee');
  const admin = authorization('admin');
  const marker = 'Personal task filter fixture';
  const personal = await request(app).post('/api/tasks').set(employee)
    .send({ title: marker, priority: 'High' }).expect(201);
  const unrelated = await request(app).post('/api/tasks').set(admin)
    .send({ title: marker, priority: 'High' }).expect(201);
  try {
    const filtered = await request(app).get('/api/tasks').query({ scope: 'mine', q: marker, priority: 'High' })
      .set(employee).expect(200);
    expect(filtered.body.map(task => task.task_id)).toEqual([personal.body.task_id]);
    const noMatches = await request(app).get('/api/tasks').query({ scope: 'mine', q: marker, priority: 'Low' })
      .set(employee).expect(200);
    expect(noMatches.body).toEqual([]);
  } finally {
    await request(app).delete('/api/tasks/' + personal.body.task_id).set(admin).expect(200);
    await request(app).delete('/api/tasks/' + unrelated.body.task_id).set(admin).expect(200);
  }
});

test('a requester can close an active ticket and retain its history', async () => {
  const path = '/api/helpdesk';
  const employee = authorization('employee');
  const created = await request(app).post(path).set(employee)
    .send({ subject: 'Requester ticket fixture', description: 'Please review the sample device.', category: 'it_hardware' }).expect(200);
  const id = created.body.ticket_id;
  const closePath = path + '/my/' + id + '/close';
  try {
    await request(app).post(closePath).set(authorization('admin')).expect(404);
    await request(app).post(closePath).set(employee).expect(200);
    await request(app).post(closePath).set(employee).expect(200);
    const list = await request(app).get(path + '/my').set(employee).expect(200);
    expect(list.body.find(ticket => ticket.ticket_id === id)).toMatchObject({ status: 'closed', subject: 'Requester ticket fixture' });
  } finally {
    await query(database, 'DELETE FROM helpdesk_tickets WHERE ticket_id=?', [id]);
  }
});
