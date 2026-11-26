process.env.DB_NAME = process.env.TEST_DB_NAME || "workforce_intelligence_test";
const request = require("supertest"),
  app = require("../backend/app"),
  db = require("../backend/config/db");
const profiles = require("../backend/config/workflowProfiles.json"),
  catalog = require("../backend/config/moduleCatalog");
const { query } = require("../backend/services/database");
let admin, employee, hr, uid;
beforeAll(async () => {
  admin = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@wip.com", password: "P123/" })
  ).body.token;
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "employee@wfintelligence.com", password: "P123/" });
  employee = login.body.token;
  uid = login.body.user.user_id;
  hr = (
    await request(app)
      .post("/api/auth/login")
      .send({ email: "hr@wfintelligence.com", password: "P123/" })
  ).body.token;
});
afterAll(() => new Promise((resolve) => db.end(resolve)));
test.each(Object.entries(profiles))(
  "%s validates, persists and audits domain records",
  async (slug, profile) => {
    const item = catalog[slug],
      token = item.scope === "own" ? employee : admin;
    const body = {
      title: "Workflow regression " + slug,
      details: "Domain fixture",
      target_date: "",
    };
    for (const f of profile.fields)
      body[f.key] =
        f.type === "number"
          ? f.key.endsWith("_id")
            ? uid
            : 10
          : f.type === "date"
            ? "2026-11-01"
            : f.type === "email"
              ? "test@example.test"
              : f.type === "url"
                ? "https://example.test/"
                : "Regression fixture";
    if (body.shift_id)
      body.shift_id = (
        await query(db, "SELECT shift_id FROM shifts LIMIT 1")
      )[0].shift_id;
    if (slug === "regularization") {
      body.requested_clock_in = "09:00";
      body.requested_clock_out = "17:00";
    }
    const path = "/api/modules/" + slug + "/records";
    await request(app)
      .post(path)
      .set("Authorization", "Bearer " + token)
      .send({ title: "Incomplete" })
      .expect(400);
    if (slug === "regularization")
      await request(app)
        .post(path)
        .set("Authorization", "Bearer " + token)
        .send({ ...body, work_date: "2099-01-01" })
        .expect(400);
    const created = await request(app)
      .post(path)
      .set("Authorization", "Bearer " + token)
      .send(body)
      .expect(201);
    let rows = (
      await request(app)
        .get(path)
        .set("Authorization", "Bearer " + token)
        .expect(200)
    ).body;
    let row = rows.find((r) => r.record_id === created.body.record_id);
    expect(row.title).toBe(body.title);
    expect(row.version).toBe(1);
    await request(app)
      .patch(path + "/" + row.record_id)
      .set("Authorization", "Bearer " + token)
      .send({ ...body, version: 0 })
      .expect(409);
    await request(app)
      .patch(path + "/" + row.record_id)
      .set("Authorization", "Bearer " + token)
      .send({ ...body, version: 1 })
      .expect(200);
    await request(app)
      .post(path + "/" + row.record_id + "/transition")
      .set("Authorization", "Bearer " + token)
      .send({
        status: "Impossible transition",
        version: 2,
        note: "Cannot skip stages",
      })
      .expect(403);
    await request(app)
      .post(path + "/" + row.record_id + "/comments")
      .set("Authorization", "Bearer " + token)
      .send({ comment: "Evidence received", status: "Ignored" })
      .expect(201);
    const history = (
      await request(app)
        .get(path + "/" + row.record_id + "/history")
        .set("Authorization", "Bearer " + token)
        .expect(200)
    ).body;
    expect(history).toHaveLength(3);
    expect(history.at(-1)).toMatchObject({ note: "Comment: Evidence received", from_status: row.status, to_status: row.status });
    for (let step = 0; step < 5; step++) {
      const current = (
        await request(app)
          .get(path)
          .set("Authorization", "Bearer " + hr)
          .expect(200)
      ).body.find((r) => r.record_id === row.record_id);
      const status = current.allowed_transitions[0];
      if (!status) break;
      await request(app)
        .post(path + "/" + row.record_id + "/transition")
        .set("Authorization", "Bearer " + hr)
        .send({
          status,
          version: current.version,
          note: "HR reviewed domain evidence",
        })
        .expect(200);
    }
    if (slug === "regularization") {
      const [a] = await query(
        db,
        "SELECT total_hours FROM attendance WHERE user_id=? AND work_date='2026-11-01'",
        [uid],
      );
      expect(Number(a.total_hours)).toBe(8);
    }
    if (slug === "shift-bidding") {
      const [u] = await query(
        db,
        "SELECT shift_id FROM users WHERE user_id=?",
        [uid],
      );
      expect(u.shift_id).toBe(body.shift_id);
    }
    if (item.scope === "own")
      await request(app)
        .get(path + "/" + row.record_id + "/history")
        .set("Authorization", "Bearer " + admin)
        .expect(200);
  },
);

test("case closure requires findings after review rather than at submission", async () => {
  const path = "/api/modules/grievance/records";
  const body = {
    title: "Closure evidence regression",
    category: "Access",
    incident_date: "2026-11-01",
    requested_remedy: "Review access",
    resolution: "",
  };
  const result = await request(app)
    .post(path)
    .set("Authorization", "Bearer " + employee)
    .send(body)
    .expect(201);
  const id = result.body.record_id;
  await request(app)
    .post(path + "/" + id + "/transition")
    .set("Authorization", "Bearer " + hr)
    .send({ status: "Under review", version: 1, note: "Investigation started" })
    .expect(200);
  await request(app)
    .post(path + "/" + id + "/transition")
    .set("Authorization", "Bearer " + hr)
    .send({ status: "Resolved", version: 2, note: "Premature closure" })
    .expect(400);
  await request(app)
    .patch(path + "/" + id)
    .set("Authorization", "Bearer " + hr)
    .send({ ...body, resolution: "Access restored and confirmed", version: 2 })
    .expect(200);
  await request(app)
    .post(path + "/" + id + "/transition")
    .set("Authorization", "Bearer " + hr)
    .send({ status: "Resolved", version: 3, note: "Remedy verified" })
    .expect(200);
});
test("an enrollment author can withdraw consent before review", async () => {
  const path = "/api/modules/biometric-enrollment/records";
  const created = await request(app)
    .post(path)
    .set("Authorization", "Bearer " + employee)
    .send({
      title: "Consent withdrawal regression",
      consent_reference: "Synthetic consent",
      purpose: "Access review",
      retention_until: "2027-01-01",
    })
    .expect(201);
  await request(app)
    .post(path + "/" + created.body.record_id + "/transition")
    .set("Authorization", "Bearer " + employee)
    .send({
      status: "Withdrawn",
      version: 1,
      note: "Consent withdrawn by author",
    })
    .expect(200);
});

test("archived drafts preserve history and require the current version to restore", async () => {
  const path = "/api/modules/grievance/records";
  const bearer = "Bearer " + employee;
  const create = await request(app).post(path).set("Authorization", bearer)
    .send({ title: "Draft archive fixture", category: "Access", incident_date: "2026-11-01", requested_remedy: "Review" })
    .expect(201);
  const id = create.body.record_id;
  await request(app).delete(path + "/" + id).set("Authorization", bearer).expect(200);
  const archived = (await request(app).get(path + "?archive=1").set("Authorization", bearer).expect(200))
    .body.find(row => row.record_id === id);
  expect(archived).toMatchObject({ version: 2, restorable: true, editable: false, commentable: false, allowed_transitions: [] });
  await request(app).post(path + "/" + id + "/restore").set("Authorization", bearer).send({ version: 1 }).expect(409);
  await request(app).post(path + "/" + id + "/restore").set("Authorization", bearer).send({ version: 2 }).expect(200);
  await request(app).post(path + "/" + id + "/restore").set("Authorization", bearer).send({ version: 2 }).expect(409);
  const restored = (await request(app).get(path).set("Authorization", bearer).expect(200))
    .body.find(row => row.record_id === id);
  expect(restored).toMatchObject({ version: 3, deleted_at: null, restorable: false });
  const history = (await request(app).get(path + "/" + id + "/history").set("Authorization", bearer).expect(200)).body;
  expect(history.map(item => item.note)).toContain("Draft restored to active records.");
});
