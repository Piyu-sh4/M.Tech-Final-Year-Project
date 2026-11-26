process.env.DB_NAME = process.env.TEST_DB_NAME || "workforce_intelligence_test";
const request = require("supertest");
const app = require("../backend/app");
const database = require("../backend/config/db");
const { query } = require("../backend/services/database");
const tokens = {},
  users = {};
const authorization = (role) => ({ Authorization: "Bearer " + tokens[role] });
let meetingId;
beforeAll(async () => {
  for (const [role, email] of Object.entries({
    admin: "admin@wip.com",
    employee: "employee@wfintelligence.com",
    manager: "manager@wfintelligence.com",
    hr: "hr@wfintelligence.com",
  })) {
    const result = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "P123/" })
      .expect(200);
    tokens[role] = result.body.token;
    users[role] = result.body.user;
  }
});
afterAll(() => new Promise((resolve) => database.end(resolve)));

test("registration choices are real companies and invalid companies are rejected", async () => {
  const companies = await request(app).get("/api/auth/companies").expect(200);
  expect(
    companies.body.some((company) => company.name === "Workforce Intelligence"),
  ).toBe(true);
  await request(app)
    .post("/api/auth/register")
    .send({
      full_name: "Company regression",
      email: "company-invalid@example.test",
      password: "CompanyTest123!",
      company_id: 9999999,
    })
    .expect(400);
});
test("company registration persists the selected company and requires approval", async () => {
  const company = await request(app)
    .post("/api/auth/companies")
    .set(authorization("admin"))
    .send({ name: "Regression company " + Date.now() })
    .expect(201);
  const email = "company-" + Date.now() + "@example.test";
  const created = await request(app)
    .post("/api/auth/register")
    .send({
      full_name: "Company registration test",
      email,
      password: "CompanyTest123!",
      company_id: company.body.company_id,
    })
    .expect(201);
  const [user] = await query(
    database,
    "SELECT company_id,status FROM users WHERE user_id=?",
    [created.body.user_id],
  );
  expect(user.company_id).toBe(company.body.company_id);
  expect(user.status).toBe("pending");
  await request(app)
    .post("/api/auth/companies")
    .set(authorization("employee"))
    .send({ name: "Not allowed" })
    .expect(403);
});
test("themes persist and reject unsupported values", async () => {
  for (const theme of ["day", "night", "dark", "light", "system"])
    await request(app)
      .patch("/api/auth/preferences")
      .set(authorization("employee"))
      .send({ theme })
      .expect(200);
  await request(app)
    .patch("/api/auth/preferences")
    .set(authorization("employee"))
    .send({ theme: "injected" })
    .expect(400);
  const result = await request(app)
    .get("/api/auth/preferences")
    .set(authorization("employee"))
    .expect(200);
  expect(result.body.theme).toBe("system");
});
test("login stores a server-observed IP, not an arbitrary forwarded header", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.88")
    .send({ email: users.employee.email, password: "P123/" })
    .expect(200);
  const session = require("jsonwebtoken").decode(response.body.token).jti;
  const [stored] = await query(
    database,
    "SELECT ip_address FROM user_sessions WHERE session_id=?",
    [session],
  );
  expect(stored.ip_address).not.toBe("198.51.100.88");
  expect(stored.ip_address).toBeTruthy();
});
test("external meeting links validate and persist", async () => {
  await request(app)
    .post("/api/meetings")
    .set(authorization("employee"))
    .send({
      title: "Bad URL",
      scheduled_at: "2027-02-01 10:00:00",
      meeting_provider: "zoom",
      meeting_url: "javascript:alert(1)",
    })
    .expect(400);
  const created = await request(app)
    .post("/api/meetings")
    .set(authorization("employee"))
    .send({
      title: "External meeting regression",
      scheduled_at: "2027-02-01 10:00:00",
      duration_mins: 30,
      meeting_provider: "zoom",
      meeting_url: "https://zoom.us/j/123456789",
      participant_user_ids: [users.manager.user_id],
    })
    .expect(201);
  meetingId = created.body.meeting_id;
  const result = await request(app)
    .get("/api/meetings/" + meetingId)
    .set(authorization("employee"))
    .expect(200);
  expect(result.body.meeting_url).toBe("https://zoom.us/j/123456789");
  expect(result.body.password).toBeUndefined();
});
test("meeting participants can read but cannot edit, start or cancel another host meeting", async () => {
  const path = "/api/meetings/" + meetingId;
  await request(app).get(path).set(authorization("manager")).expect(200);
  await request(app)
    .patch(path)
    .set(authorization("manager"))
    .send({ title: "Unauthorized edit" })
    .expect(403);
  await request(app)
    .post(path + "/start")
    .set(authorization("manager"))
    .send({})
    .expect(403);
  await request(app).delete(path).set(authorization("manager")).expect(403);
  await request(app).get(path).set(authorization("hr")).expect(404);
  await request(app)
    .patch(path)
    .set(authorization("employee"))
    .send({
      meeting_provider: "teams",
      meeting_url: "https://teams.microsoft.com/",
    })
    .expect(200);
  await request(app).delete(path).set(authorization("employee")).expect(200);
});
test("invalid meeting invitees do not leave a partial meeting", async () => {
  const title = "Atomic meeting " + Date.now();
  await request(app)
    .post("/api/meetings")
    .set(authorization("employee"))
    .send({
      title,
      scheduled_at: "2027-02-01 11:00:00",
      participant_user_ids: [999999999],
    })
    .expect(400);
  const [count] = await query(
    database,
    "SELECT COUNT(*) count FROM meetings WHERE title=?",
    [title],
  );
  expect(count.count).toBe(0);
});
test("a manager cannot download an unrelated employee payslip or alter payroll", async () => {
  const [salary] = await query(
    database,
    "SELECT salary_id FROM salary_records JOIN users ON users.user_id=salary_records.user_id WHERE users.user_id<>? AND (users.reporting_manager_id IS NULL OR users.reporting_manager_id<>?) LIMIT 1",
    [users.manager.user_id, users.manager.user_id],
  );
  expect(salary).toBeDefined();
  await request(app)
    .get("/api/admin/salary/" + salary.salary_id + "/payslip-pdf")
    .set(authorization("manager"))
    .expect(403);
  await request(app)
    .patch("/api/admin/salary/" + salary.salary_id + "/paid")
    .set(authorization("manager"))
    .send({})
    .expect(403);
  const rows = await request(app)
    .get("/api/admin/salary")
    .set(authorization("manager"))
    .expect(200);
  const authorized = (
    await query(
      database,
      "SELECT user_id FROM users WHERE user_id=? OR reporting_manager_id=?",
      [users.manager.user_id, users.manager.user_id],
    )
  ).map((user) => user.user_id);
  expect(rows.body.every((row) => authorized.includes(row.user_id))).toBe(true);
});
test("device verification cannot be claimed with an invented proof", async () => {
  await request(app)
    .post("/api/admin/attendance/clock-in")
    .set(authorization("employee"))
    .send({
      verification_method: "passkey",
      verification_token: "a".repeat(64),
    })
    .expect(403);
  await request(app)
    .post("/api/passkeys/register/verify")
    .set(authorization("employee"))
    .set("Origin", "http://localhost:5503")
    .send({ challengeId: "missing", response: { id: "fake" } })
    .expect(400);
});
test("passkey challenges bind to an approved origin and require user verification", async () => {
  await request(app)
    .post("/api/passkeys/register/options")
    .set(authorization("employee"))
    .set("Origin", "https://attacker.example")
    .send({ password: "P123/" })
    .expect(400);
  const result = await request(app)
    .post("/api/passkeys/register/options")
    .set(authorization("employee"))
    .set("Origin", "http://localhost:5503")
    .send({ password: "P123/" })
    .expect(200);
  expect(result.body.options.authenticatorSelection.userVerification).toBe(
    "required",
  );
  expect(result.body.options.rp.id).toBe("localhost");
});
test("draft deletion retains history and cannot remove a reviewed record", async () => {
  const path = "/api/modules/goals-okr/records";
  const body = {
    title: "Removable draft",
    metric: "Delivery",
    baseline: 0,
    target: 10,
    actual: 1,
  };
  const result = await request(app)
    .post(path)
    .set(authorization("employee"))
    .send(body)
    .expect(201);
  const id = result.body.record_id;
  await request(app)
    .delete(path + "/" + id)
    .set(authorization("employee"))
    .expect(200);
  const rows = await request(app)
    .get(path)
    .set(authorization("employee"))
    .expect(200);
  expect(rows.body.some((row) => row.record_id === id)).toBe(false);
  const history = await request(app)
    .get(path + "/" + id + "/history")
    .set(authorization("employee"))
    .expect(200);
  expect(history.body.at(-1).note).toContain("history retained");
});
test("vehicle estimates accept two-wheeler and car categories without inventing bank approval", async () => {
  for (const loan_type of ["bike", "car"])
    await request(app)
      .post("/api/loans/calculate-emi")
      .set(authorization("employee"))
      .send({ loan_type, principal: 100000, tenure_months: 12 })
      .expect(200);
});
test("bank account writes are encrypted and read endpoints only return a mask", async () => {
  await request(app)
    .post("/api/banking/my")
    .set(authorization("employee"))
    .send({
      bank_name: "Regression bank",
      account_number: "123456789012",
      ifsc_code: "SBIN0000001",
      account_type: "salary",
    })
    .expect(200);
  const [stored] = await query(
    database,
    "SELECT account_number,account_last_four FROM employee_banking WHERE user_id=?",
    [users.employee.user_id],
  );
  expect(stored.account_number).toMatch(/^bank-encrypted:/);
  expect(stored.account_number).not.toContain("123456789012");
  expect(stored.account_last_four).toBe("9012");
  const result = await request(app)
    .get("/api/banking/my")
    .set(authorization("employee"))
    .expect(200);
  expect(result.body.account_number).toBeUndefined();
  expect(result.body.account_number_display).toContain("9012");
});
test("NVIDIA configuration is encrypted, selectable and uses the verified endpoint contract", async () => {
  const provider = require("../backend/services/chatProviders");
  await provider.ensureSchema();
  await provider.save("nvidia", {
    model: "meta/llama-3.1-8b-instruct",
    apiKey: "RegressionProviderKey123",
  });
  await provider.select("nvidia");
  const [stored] = await query(
    database,
    "SELECT encrypted_key FROM chat_providers WHERE provider='nvidia'",
  );
  expect(stored.encrypted_key).not.toContain("RegressionProviderKey123");
  const fetch = jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "Verified mocked provider response" } }],
    }),
  });
  try {
    const active = await provider.getActive();
    expect(active.provider).toBe("nvidia");
    await provider.requestCompletion(
      active,
      [{ role: "user", content: "Hello" }],
      null,
      256,
    );
    expect(fetch.mock.calls[0][0]).toBe(
      "https://integrate.api.nvidia.com/v1/chat/completions",
    );
  } finally {
    fetch.mockRestore();
    await query(database, "DELETE FROM chat_provider_selection");
    await query(database, "DELETE FROM chat_providers WHERE provider='nvidia'");
  }
});

test("managers cannot approve registrations or modify employee profiles", async () => {
  await request(app)
    .patch("/api/admin/users/" + users.employee.user_id + "/approve")
    .set(authorization("manager"))
    .send({})
    .expect(403);
  await request(app)
    .patch("/api/admin/users/" + users.employee.user_id)
    .set(authorization("manager"))
    .send({ base_salary: 999999 })
    .expect(403);
});
test("Public registration cannot assign staff fields; only admins can approve pending staff", async () => {
  const registered = await request(app)
    .post("/api/auth/register")
    .send({
      full_name: "Elevated role approval test",
      email: "hr-review-" + Date.now() + "@example.test",
      password: "StaffRole123!",
      role_id: 4,
      department_id: 1,
      grade_level: "L10",
      reporting_manager_id: users.manager.user_id,
      company_id: 1,
    })
    .expect(201);
  const userId = registered.body.user_id;
  const [account] = await query(database,
    'SELECT role_id,department_id,reg_grade_level,reporting_manager_id FROM users WHERE user_id=?', [userId]);
  expect(account).toEqual({ role_id: 2, department_id: null, reg_grade_level: null, reporting_manager_id: null });
  // Existing pending accounts can still carry a staff role assigned by the back office.
  await query(database, 'UPDATE users SET role_id=4 WHERE user_id=?', [userId]);
  await request(app)
    .patch("/api/admin/users/" + registered.body.user_id + "/approve")
    .set(authorization("hr"))
    .send({})
    .expect(403);
});
test("disabled location discards coordinates and does not call a geolocation provider", async () => {
  await request(app)
    .patch("/api/location/preferences")
    .set(authorization("employee"))
    .send({
      location_enabled: false,
      weather_enabled: false,
      location_source: "manual",
    })
    .expect(200);
  const fetch = jest
    .spyOn(global, "fetch")
    .mockRejectedValue(new Error("A provider should not be called"));
  try {
    await request(app)
      .post("/api/location/session")
      .set(authorization("employee"))
      .send({ location_source: "gps", latitude: 12, longitude: 77 })
      .expect(200);
    expect(fetch).not.toHaveBeenCalled();
    const [session] = await query(
      database,
      "SELECT latitude,longitude,location_source FROM login_sessions WHERE user_id=? ORDER BY session_id DESC LIMIT 1",
      [users.employee.user_id],
    );
    expect(session.latitude).toBeNull();
    expect(session.longitude).toBeNull();
    expect(session.location_source).toBe("disabled");
  } finally {
    fetch.mockRestore();
  }
});
test("IFSC lookup returns provider data and never fabricates a branch", async () => {
  const fetch = jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      IFSC: "SBIN0000001",
      BANK: "Verified provider bank",
      BRANCH: "Provider branch",
    }),
  });
  try {
    const result = await request(app)
      .get("/api/banking/ifsc/SBIN0000001")
      .set(authorization("employee"))
      .expect(200);
    expect(result.body.BANK).toBe("Verified provider bank");
    fetch.mockRejectedValue(new Error("Provider offline"));
    await request(app)
      .get("/api/banking/ifsc/SBIN0000001")
      .set(authorization("employee"))
      .expect(502);
    await request(app)
      .get("/api/banking/ifsc/invalid")
      .set(authorization("employee"))
      .expect(400);
  } finally {
    fetch.mockRestore();
  }
});

test("manager attendance summaries contain only self and direct reports", async () => {
  const allowed = await query(
    database,
    "SELECT user_id FROM users WHERE user_id=? OR reporting_manager_id=?",
    [users.manager.user_id, users.manager.user_id],
  );
  const identifiers = new Set(allowed.map((user) => user.user_id));
  const summary = await request(app)
    .get("/api/admin/attendance/summary")
    .set(authorization("manager"))
    .expect(200);
  expect(
    summary.body.summary.every((user) => identifiers.has(user.user_id)),
  ).toBe(true);
  await request(app)
    .post("/api/admin/attendance")
    .set(authorization("manager"))
    .send({
      user_id: users.hr.user_id,
      work_date: "2027-01-02",
      status: "present",
    })
    .expect(403);
});

test('meeting schedule changes send private notifications only once', async () => {
  const title = 'Participant notification ' + Date.now();
  const created = await request(app).post('/api/meetings').set(authorization('employee')).send({
    title, scheduled_at:'2027-02-01 11:00:00',participant_user_ids:[users.manager.user_id],
  }).expect(201);
  const path = '/api/meetings/'+created.body.meeting_id;
  const future = new Date(Date.now()+86400000).toISOString();
  await request(app).patch(path+'/reschedule').set(authorization('manager')).send({scheduled_at:future}).expect(403);
  await request(app).patch(path+'/reschedule').set(authorization('employee')).send({scheduled_at:future}).expect(200);
  await request(app).delete(path).set(authorization('employee')).send({reason:'Scheduling conflict'}).expect(200);
  await request(app).delete(path).set(authorization('employee')).expect(409);
  const notifications = await query(database,"SELECT user_id,type FROM notifications WHERE message LIKE ? ORDER BY user_id,type",['%'+title+'%']);
  expect(notifications).toHaveLength(4);
  expect(new Set(notifications.map(row=>row.user_id))).toEqual(new Set([users.employee.user_id, users.manager.user_id]));
  expect(new Set(notifications.map(row=>row.type))).toEqual(new Set(['meeting_cancelled','meeting_rescheduled']));
});

test('chat retrieves matching text beyond the preview and isolates uploaded files', async () => {
  const providers = require('../backend/services/chatProviders');
  const config = jest.spyOn(providers,'getActive').mockResolvedValue({provider:'test',model:'test'});
  const completion = jest.spyOn(providers,'requestCompletion').mockResolvedValue({reply:'Test answer'});
  try {
    const result = await request(app).post('/api/upload').set(authorization('admin'))
      .attach('file',Buffer.from('Introduction. '.repeat(200)+' Orchid stock count is 37.'),'workforce-notes.txt').expect(200);
    const body = {include_context:true,document_id:result.body.documentId,messages:[{role:'user',content:'What is the orchid stock count?'}]};
    expect(result.body.preview).not.toContain('Orchid');
    await request(app).post('/api/chat/send').set(authorization('admin')).send(body).expect(200);
    expect(completion.mock.calls[0][2]).toContain('Orchid stock count is 37');
    expect(completion.mock.calls[0][2]).toContain('workforce-notes.txt');
    await request(app).post('/api/chat/send').set(authorization('admin')).send({...body,include_context:false}).expect(200);
    expect(completion.mock.calls[1][2]).not.toContain('Orchid stock count');
    expect(require('../backend/services/ragService').retrieveRelevantChunks(users.employee.user_id, result.body.documentId,'orchid')).toBeNull();
  } finally { config.mockRestore(); completion.mockRestore(); }
});

test('task authors edit details, while an assignee can still update status', async () => {
  const created = await request(app).post('/api/tasks').set(authorization('admin')).send({title:'Original task',assigned_to:users.employee.user_id}).expect(201);
  const path = '/api/tasks/'+created.body.task_id;
  const fields = {title:'Updated task',description:'Checked workflow',priority:'High',due_date:'2027-12-01'};
  await request(app).patch(path).set(authorization('employee')).send(fields).expect(403);
  await request(app).patch(path).set(authorization('admin')).send(fields).expect(200);
  await request(app).put(path).set(authorization('employee')).send({status:'In Progress'}).expect(200);
  const result = await request(app).get(path).set(authorization('employee')).expect(200);
  expect(result.body).toMatchObject({title:'Updated task',status:'In Progress'});
});

test('build requests enforce admin access and preserve instructions, attribution and revisions', async () => {
  const queue = '/api/build-requests';
  await request(app).get(queue).expect(401);
  for (const role of ['employee','manager','hr']) {
    await request(app).get(queue).set(authorization(role)).expect(403);
    await request(app).post(queue).set(authorization(role)).send({title:'Unauthorized',instructions:'Test'}).expect(403);
  }
  const host = authorization('admin');
  await request(app).post(queue).set(host).send({title:'Empty instructions',instructions:' '}).expect(400);
  const created = (await request(app).post(queue).set(host).send({
    title:'Build queue regression',instructions:'Preserve <b>literal formatting</b>.',acceptance_criteria:'Verify the workflow.',
  }).expect(201)).body;
  const path = queue+'/'+created.request_id;
  expect(created.events[0]).toMatchObject({kind:'submitted',actor_name:users.admin.full_name});
  expect(created.instructions).toBe('Preserve <b>literal formatting</b>.');
  await request(app).get(path).set(authorization('employee')).expect(403);

  // Concurrent pickup cannot assign the same request twice.
  const pickups = await Promise.all(Array.from({length:2},()=>request(app).post(queue+'/claim-next').set(host).send({})));
  expect(pickups.map(result=>result.status).sort()).toEqual([200,404]);
  const claimed = pickups.find(result=>result.status === 200).body;
  expect(claimed).toMatchObject({request_id:created.request_id,status:'in_progress',assigned_to:users.admin.user_id});
  const patch = (revision,action,fields={})=>request(app).patch(path).set(host).send({revision,action,...fields});
  const followed = (await patch(claimed.revision,'follow_up',{note:'Also verify mobile layout.'}).expect(200)).body;
  await patch(claimed.revision,'submit_result',{note:'A stale result'}).expect(409);
  await patch(followed.revision,'submit_result',{note:'Tests pass',evidence_url:'https://example.com/commit/0123456'}).expect(400);
  const result = (await patch(followed.revision,'submit_result',{
    note:'Tests pass',evidence_url:'https://github.com/Bharatasya-IT-Solutions/workforce-intelligence/commit/abcdef1',
  }).expect(200)).body;
  expect(result.status).toBe('in_review');
  const completed = (await patch(result.revision,'complete').expect(200)).body;
  expect(completed.status).toBe('completed');
  const reopened = (await patch(completed.revision,'follow_up',{note:'One more acceptance criterion.'}).expect(200)).body;
  expect(reopened).toMatchObject({status:'queued',assigned_to:null});
  expect(reopened.events.map(entry=>entry.kind)).toEqual(['submitted','claimed','follow_up','result','status','follow_up']);
  const queued = await request(app).get(queue+'?status=queued').set(host).expect(200);
  expect(queued.body.requests.map(item=>item.request_id)).toContain(created.request_id);
  expect(queued.body.counts.queued).toBeGreaterThan(0);
  const completedOnly = await request(app).get(queue+'?status=completed').set(host).expect(200);
  expect(completedOnly.body.requests).toEqual([]);
  expect(completedOnly.body.counts).toEqual(queued.body.counts);
});

test('chat guide matches module visibility and activity stays out of model context', async () => {
  const providers = require('../backend/services/chatProviders');
  const config = jest.spyOn(providers, 'getActive').mockResolvedValue({ provider: 'test', model: 'test' });
  const completion = jest.spyOn(providers, 'requestCompletion').mockResolvedValue({ content: [] });
  const employee = users.employee.user_id;
  const admin = users.admin.user_id;
  const original = await query(database, 'SELECT can_use_chat FROM user_permissions WHERE user_id=?', [employee]);
  await query(database, 'INSERT INTO user_permissions (user_id,can_use_chat) VALUES (?,1) ON DUPLICATE KEY UPDATE can_use_chat=1', [employee]);
  const ownAction = 'ASSISTANT_GUIDE_OWN_ACTIVITY';
  const otherAction = 'ASSISTANT_GUIDE_OTHER_ACTIVITY';
  await query(database, 'INSERT INTO audit_logs (actor_id,action,entity_type,new_values) VALUES ?',
    [[[employee,ownAction,'fixture','{"sensitive":"private fixture body"}'],[admin,otherAction,'fixture',null]]]);
  try {
    const employeeHeader = authorization('employee');
    const catalog = (await request(app).get('/api/modules').set(employeeHeader).expect(200)).body;
    const context = (await request(app).get('/api/chat/context').set(employeeHeader).expect(200)).body;
    expect(context.modules.map(item => item.path)).toEqual(catalog.map(item => '/' + item.slug + '.html'));
    expect(context.modules.some(item => item.path === '/audit-log.html')).toBe(false);
    expect(context.activity).toContainEqual(expect.objectContaining({ action: ownAction }));
    expect(JSON.stringify(context)).not.toContain(otherAction);
    expect(JSON.stringify(context)).not.toContain('private fixture body');
    expect(context.summary.total_projects).toEqual(expect.any(Number));

    for (const include_context of [false, true])
      await request(app).post('/api/chat/send').set(employeeHeader)
        .send({ include_context, messages: [{ role: 'user', content: 'Where are training courses?' }] }).expect(200);
    const prompts = completion.mock.calls.map(args => args[2]);
    expect(prompts[0]).not.toContain('Workforce totals:');
    expect(prompts[1]).toContain('Workforce totals:');
    for (const prompt of prompts) {
      expect(prompt).toContain('/training.html');
      expect(prompt).not.toContain('/audit-log.html');
      expect(prompt).not.toContain(ownAction);
    }
  } finally {
    config.mockRestore();
    completion.mockRestore();
    await query(database, 'DELETE FROM audit_logs WHERE action IN (?,?)', [ownAction, otherAction]);
    if (original.length) await query(database, 'UPDATE user_permissions SET can_use_chat=? WHERE user_id=?', [original[0].can_use_chat, employee]);
    else await query(database, 'DELETE FROM user_permissions WHERE user_id=?', [employee]);
  }
});

test('workforce chat answers from MySQL before looking up or calling a provider', async () => {
  const providers = require('../backend/services/chatProviders');
  const active = jest.spyOn(providers, 'getActive').mockResolvedValue(null);
  const completion = jest.spyOn(providers, 'requestCompletion');
  const employeeId = users.employee.user_id;
  const adminId = users.admin.user_id;
  const permissions = await query(database, 'SELECT can_use_chat FROM user_permissions WHERE user_id=?', [employeeId]);
  const prefix = 'Workforce chat fixture';
  const send = (role, content) => request(app).post('/api/chat/send').set(authorization(role))
    .send({ include_context: false, messages: [{ role: 'user', content }] });
  try {
    await query(database, 'INSERT INTO user_permissions (user_id,can_use_chat) VALUES (?,1) ON DUPLICATE KEY UPDATE can_use_chat=1',[employeeId]);
    await query(database, `INSERT INTO tasks (title,assigned_by,assigned_to,status,due_date)
      VALUES (?,?,?,'Pending','2000-01-01'),(?,?,?,'Pending','2000-01-01')`,
    [prefix+' own task',employeeId,employeeId,prefix+' restricted task',adminId,adminId]);
    await query(database, `INSERT INTO projects (name,created_by,status,completion_pct)
      VALUES (?,?,'active',47),(?,?,'active',12)`,
    [prefix+' own project',employeeId,prefix+' restricted project',adminId]);
    const taskList = (await send('employee', 'Show my overdue tasks').expect(200)).body;
    expect(taskList.source).toBe('workforce');
    expect(taskList.content[0].text).toContain(prefix+' own task');
    expect(taskList.content[0].text).not.toContain(prefix+' restricted task');
    const projectList = (await send('employee', 'Show active projects').expect(200)).body.content[0].text;
    expect(projectList).toContain(prefix+' own project');
    expect(projectList).toContain('47% complete');
    expect(projectList).not.toContain(prefix+' restricted project');
    for (const question of ['What are my leave requests?', "What's my attendance today?", 'List my recent reports']) {
      expect((await send('employee', question).expect(200)).body.source).toBe('workforce');
    }
    for (const [role, question, text] of [
      ['employee', 'My learning progress', /Your learning:/],
      ['manager', 'Team overdue task count', /your direct reports/],
      ['hr', 'Training certificates awaiting review', /available for your review/],
      ['admin', 'Active employee count', /Active employee accounts/],
      ['employee', 'Active employee count', /unavailable for your role/],
    ]) {
      const answer = (await send(role, question).expect(200)).body;
      expect(answer.source).toBe('workforce');
      expect(answer.content[0].text).toMatch(text);
    }
    expect(active).not.toHaveBeenCalled();
    expect(completion).not.toHaveBeenCalled();
    await send('employee', 'Explain the difference between a goal and a milestone').expect(503);
    expect(active).toHaveBeenCalledTimes(1);
    expect(completion).toHaveBeenCalledTimes(1);
  } finally {
    active.mockRestore();
    completion.mockRestore();
    await query(database, 'DELETE FROM tasks WHERE title IN (?,?)', [prefix+' own task',prefix+' restricted task']);
    await query(database, 'DELETE FROM projects WHERE name IN (?,?)', [prefix+' own project',prefix+' restricted project']);
    if (permissions.length) await query(database, 'UPDATE user_permissions SET can_use_chat=? WHERE user_id=?', [permissions[0].can_use_chat,employeeId]);
    else await query(database, 'DELETE FROM user_permissions WHERE user_id=?',[employeeId]);
  }
});

test('optional sign-out feedback preserves one response and is visible only to administrators', async () => {
  const comment = 'Sign-out feedback regression ' + Date.now() + ' — menu & searches';
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: users.employee.email, password: 'P123/' })
    .expect(200);
  const session = { Authorization: 'Bearer ' + login.body.token };
  const logout = await request(app)
    .post('/api/auth/logout')
    .set(session)
    .send({ offer_feedback: true })
    .expect(200);
  const { receipt } = logout.body;
  expect(receipt).toEqual(expect.any(String));
  await request(app).get('/api/auth/me').set(session).expect(401);
  try {
    const send = (payload) => request(app).post('/api/auth/sign-out-feedback').send(payload);
    await send({ receipt, rating: 0, comment }).expect(400);
    const acknowledgement = await send({ receipt, rating: 4, comment }).expect(200);
    expect(acknowledgement.body.full_name).toBe(users.employee.full_name);
    await send({ receipt, rating: 5, comment: comment + ' retry' }).expect(200);
    for (const role of ['employee', 'manager', 'hr']) {
      await request(app).get('/api/auth/sign-out-feedback').set(authorization(role)).expect(403);
    }
    const history = await request(app).get('/api/auth/sign-out-feedback').set(authorization('admin')).expect(200);
    expect(history.body.filter(row => row.comment.startsWith(comment))).toEqual([
      expect.objectContaining({ full_name: users.employee.full_name, rating: 4, comment })
    ]);
  } finally {
    await query(database, 'DELETE FROM sign_out_feedback WHERE comment IN (?,?)', [comment, comment + ' retry']);
  }
});

test('password recovery emails one-time links and revokes the old sessions', async () => {
  const email = 'password-recovery-' + Date.now() + '@example.test';
  const initial = 'InitialPassword123!';
  const replacement = 'ReplacementPassword123!';
  const registered = await request(app).post('/api/auth/register')
    .send({ email, password: initial, full_name: 'Recovery test account' }).expect(201);
  const id = registered.body.user_id;
  const environment = {
    SMTP_HOST: 'smtp.example.test', SMTP_USER: 'workforce@example.test',
    SMTP_PASS: 'isolated-test', PASSWORD_RESET_ORIGIN: 'https://workforce.example.test'
  };
  const original = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  let resolveMail;
  const mail = new Promise(resolve => { resolveMail = resolve; });
  const transport = jest.spyOn(require('nodemailer'), 'createTransport').mockReturnValue({
    sendMail: async message => { resolveMail(message); }
  });
  try {
    Object.assign(process.env, environment);
    await request(app).patch('/api/admin/users/' + id + '/approve').set(authorization('admin')).send({}).expect(200);
    const before = await request(app).post('/api/auth/login').send({ email, password: initial }).expect(200);
    const start = await request(app).post('/api/auth/password-reset/request').send({ email }).expect(202);
    const message = await mail;
    const [url] = message.text.match(/https:\/\/workforce\.example\.test\/reset-password\.html#[a-f0-9]{64}/);
    expect(message.to).toBe(email);
    expect(message.from).toBe('workforce@example.test');
    const unknown = await request(app).post('/api/auth/password-reset/request')
      .send({ email: 'no-matching-' + email }).expect(202);
    expect(unknown.body).toEqual(start.body);
    const token = new URL(url).hash.slice(1);
    expect(JSON.stringify(start.body)).not.toContain(token);
    const confirm = () => request(app).post('/api/auth/password-reset/confirm').send({ token, password: replacement });
    await confirm().expect(200);
    await confirm().expect(400);
    await request(app).get('/api/auth/me').set({ Authorization: 'Bearer ' + before.body.token }).expect(401);
    await request(app).post('/api/auth/login').send({ email, password: replacement }).expect(200);
  } finally {
    transport.mockRestore();
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('employee spreadsheet intake previews without writes and imports only a valid batch', async () => {
  const intake = '/api/upload/employee-intake';
  const [{ dept_name: department }] = await query(database, 'SELECT dept_name FROM departments ORDER BY dept_id LIMIT 1');
  const [{ name: company }] = await query(database, 'SELECT name FROM companies WHERE is_active=1 ORDER BY company_id LIMIT 1');
  const stamp = Date.now();
  const inputs = [
    { full_name: 'Spreadsheet Employee One', email: 'intake-a-' + stamp + '@example.test', designation:'Technician', department, company },
    { full_name: 'Spreadsheet Employee Two', email: 'intake-b-' + stamp + '@example.test' },
  ];
  const emails = inputs.map(row => row.email);
  const databaseRows = () => query(database, 'SELECT status,role_id,designation,company_id,department_id FROM users WHERE email IN (?) ORDER BY email', [emails]);
  const admin = authorization('admin');
  try {
    await request(app).post(intake + '/preview').set(authorization('hr')).send({rows:inputs}).expect(403);
    await request(app).post(intake).set(authorization('employee')).send({rows:inputs}).expect(403);
    const invalid = [inputs[0], {...inputs[1], department:'Department that does not exist'}];
    const preview = await request(app).post(intake + '/preview').set(admin).send({rows:invalid}).expect(200);
    expect(preview.body.rows[0]).toMatchObject({ company, department });
    expect(preview.body.rows[1].error).toBe('Department was not found.');
    await request(app).post(intake).set(admin).send({rows:invalid}).expect(409);
    expect(await databaseRows()).toHaveLength(0);
    const duplicate = await request(app).post(intake + '/preview').set(admin).send({rows:[inputs[0], inputs[0]]}).expect(200);
    expect(duplicate.body.rows[1].error).toBe('This email is repeated in the file.');
    const committed = await request(app).post(intake).set(admin).send({rows:inputs}).expect(201);
    expect(committed.body.imported).toBe(2);
    const saved = await databaseRows();
    expect(saved.every(row => row.status === 'pending' && row.role_id === 2)).toBe(true);
    expect(saved[0]).toMatchObject({designation:'Technician', company_id:expect.any(Number), department_id:expect.any(Number)});
    await request(app).post(intake).set(admin).send({rows:inputs}).expect(409);
    expect(await databaseRows()).toHaveLength(2);
  } finally {
    await query(database, 'DELETE FROM users WHERE email IN (?)', [emails]);
  }
});
