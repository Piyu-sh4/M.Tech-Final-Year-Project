const profiles = require("../config/workflowProfiles.json");
const { query, transaction } = require("./database");
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const isStaff = (user) => [1, 4].includes(user.role_id);
const canManageDraft = (record, user) => isStaff(user) || record.created_by === user.user_id;
const canComment = (record, user) => canManageDraft(record, user) || record.owner_id === user.user_id;
function transitions(item, row, user) {
  const paths = {
    "goals-okr": ["Planned", "In progress", "Achieved"],
    regularization: ["Submitted", "Under review", "Approved"],
    "wfh-tracker": ["Requested", "Approved", "Completed"],
    "shift-bidding": ["Requested", "Waitlisted", "Approved"],
    "vendor-management": ["Proposed", "Under review", "Active", "Inactive"],
    "visitor-management": ["Scheduled", "Checked in", "Checked out"],
    "maternity-leave": ["Draft", "Submitted", "Approved", "Closed"],
  };
  if (item.slug === "biometric-enrollment" && row.status === "Requested") {
    if (isStaff(user) && row.created_by !== user.user_id)
      return ["Reviewed", "Withdrawn"];
    return row.created_by === user.user_id ? ["Withdrawn"] : [];
  }
  const path = paths[item.slug] || item.states;
  const index = path.indexOf(row.status);
  if (index < 0 || index === path.length - 1) return [];
  const next = path[index + 1];
  const decision =
    /Approved|Verified|Reviewed|Resolved|Cleared|Active|Closed/.test(next);
  const author = row.created_by === user.user_id;
  if (decision && (!isStaff(user) || author)) return [];
  const result = [next];
  if (
    item.states.includes("Declined") &&
    isStaff(user) &&
    !author &&
    ["Requested", "Submitted", "Under review", "Waitlisted"].includes(
      row.status,
    )
  )
    result.push("Declined");
  if (item.slug === "visitor-management" && row.status === "Scheduled")
    result.push("Cancelled");
  if (
    item.slug === "goals-okr" &&
    ["Planned", "In progress"].includes(row.status)
  )
    result.push("Deferred");
  return result;
}
async function ensure(connection) {
  for (const profile of Object.values(profiles)) {
    const fields = profile.fields
      .map(
        (f) =>
          `\`${f.key}\` ${f.type === "number" ? "DECIMAL(14,2)" : f.type === "date" ? "DATE" : "VARCHAR(500)"} NULL`,
      )
      .join(",");
    await query(
      connection,
      `CREATE TABLE IF NOT EXISTS \`${profile.table}\` (record_id INT AUTO_INCREMENT PRIMARY KEY,legacy_id INT UNIQUE,owner_id INT NULL,created_by INT NOT NULL,title VARCHAR(150) NOT NULL,details VARCHAR(1500) NOT NULL DEFAULT '',status VARCHAR(45) NOT NULL,target_date DATE NULL,version INT NOT NULL DEFAULT 1,${fields},created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,FOREIGN KEY(owner_id) REFERENCES users(user_id),FOREIGN KEY(created_by) REFERENCES users(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
  }
  // Draft removal is reversible in storage and never erases review history.
  for(const profile of Object.values(profiles)){
    const [column]=await query(connection,"SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='deleted_at'",[profile.table]);
    if(!column)await query(connection,'ALTER TABLE ?? ADD COLUMN deleted_at TIMESTAMP NULL',[profile.table]);
  }
  // Enforce domain references in MySQL as well as in request validation.
  for (const profile of Object.values(profiles)) {
    for (const field of profile.fields.filter((field) =>
      field.key.endsWith("_id"),
    )) {
      const [existing] = await query(
        connection,
        `SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [profile.table, field.key],
      );
      if (!existing)
        await query(
          connection,
          "ALTER TABLE ?? MODIFY ?? INT NULL, ADD FOREIGN KEY (??) REFERENCES ?? (??)",
          [
            profile.table,
            field.key,
            field.key,
            field.key === "shift_id" ? "shifts" : "users",
            field.key === "shift_id" ? "shift_id" : "user_id",
          ],
        );
    }
  }
  await query(
    connection,
    `CREATE TABLE IF NOT EXISTS workflow_events (event_id INT AUTO_INCREMENT PRIMARY KEY,module_slug VARCHAR(64) NOT NULL,record_id INT NOT NULL,actor_id INT NOT NULL,from_status VARCHAR(45),to_status VARCHAR(45) NOT NULL,note VARCHAR(1500) NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX module_record(module_slug,record_id),FOREIGN KEY(actor_id) REFERENCES users(user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
}
async function migrate(connection) {
  const [admin] = await query(
    connection,
    "SELECT user_id FROM users WHERE email='admin@wip.com'",
  );
  for (const [slug, profile] of Object.entries(profiles)) {
    const old = await query(
      connection,
      "SELECT * FROM demo_module_records WHERE module_slug=?",
      [slug],
    );
    for (const row of old) {
      const fields = profile.fields.map((f) => f.key);
      const values = profile.fields.map((f) =>
        f.type === "date"
          ? "2026-11-12"
          : f.type === "number"
            ? f.key.endsWith("_id")
              ? admin.user_id
              : 1
            : f.type === "email"
              ? "workflow@example.test"
              : f.type === "url"
                ? "https://www.who.int/"
                : "Seed example — review before approval",
      );
      // Seed realistic attendance values and references rather than treating a generic note as a clock time.
      for (let i = 0; i < fields.length; i++) {
        if (fields[i] === "requested_clock_in") values[i] = "09:00";
        if (fields[i] === "requested_clock_out") values[i] = "17:00";
        if (fields[i] === "shift_id") {
          const [shift] = await query(
            connection,
            "SELECT shift_id FROM shifts ORDER BY shift_id LIMIT 1",
          );
          values[i] = shift?.shift_id || 1;
        }
      }
      const r = await query(
        connection,
        "INSERT IGNORE INTO ?? (legacy_id,owner_id,created_by,title,details,status,target_date,??) VALUES (" +
          Array(7 + fields.length)
            .fill("?")
            .join(",") +
          ")",
        [
          profile.table,
          fields,
          row.record_id,
          row.owner_id,
          row.owner_id || admin.user_id,
          row.title,
          row.details,
          row.status,
          row.target_date,
          ...values,
        ],
      );
      if (r.affectedRows)
        await query(
          connection,
          "INSERT INTO workflow_events (module_slug,record_id,actor_id,to_status,note) VALUES (?,?,?,?,?)",
          [
            slug,
            r.insertId,
            admin.user_id,
            row.status,
            "Migrated existing record and preserved its status. Domain fields are synthetic review fixtures.",
          ],
        );
    }
  }
}
function validate(item, body) {
  const fields = [
    "title",
    "details",
    "target_date",
    ...item.workflow.fields.map((f) => f.key),
  ];
  const value = {};
  for (const key of fields)
    value[key] = body[key] ?? (key === "details" ? "" : null);
  value.target_date = value.target_date || null;
  if (
    item.slug === "regularization" &&
    value.work_date > new Date().toISOString().slice(0, 10)
  )
    throw fail("Attendance corrections cannot be requested for a future date.");
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 150 ||
    typeof value.details !== "string" ||
    value.details.length > 1500
  )
    throw fail("Enter a title and valid details.");
  for (const f of item.workflow.fields) {
    const v = value[f.key];
    if (f.optional && (v === null || v === "")) {
      value[f.key] = null;
      continue;
    }
    if (v === null || v === "") throw fail(f.label + " is required.");
    if (f.type === "number") {
      if (!Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100000000)
        throw fail("Invalid " + f.label);
      value[f.key] = Number(v);
    } else if (typeof v !== "string" || v.length > 500)
      throw fail("Invalid " + f.label);
    if (f.type === "date" && !require("./validation").isISODate(v))
      throw fail("Invalid " + f.label);
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      throw fail("Invalid email.");
    if (f.type === "url" && !/^https?:\/\//.test(v))
      throw fail("Use an HTTP or HTTPS resource URL.");
  }
  if (
    value.target_date &&
    !require("./validation").isISODate(value.target_date)
  )
    throw fail("Invalid target date.");
  if (
    (value.from_date && value.to_date < value.from_date) ||
    (value.contract_start && value.contract_end < value.contract_start)
  )
    throw fail("End date must follow start date.");
  for (const key of ["bonus_percent", "completion_percent"])
    if (value[key] > 100) throw fail("Percentage cannot exceed 100.");
  if (
    item.slug === "regularization" &&
    (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.requested_clock_in) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.requested_clock_out) ||
      value.requested_clock_out <= value.requested_clock_in)
  )
    throw fail("Enter clock times in HH:mm order within one day.");
  return value;
}
function routes(router, catalog, db) {
  router.use("/:slug/records", (req, res, next) => {
    const item = catalog[req.params.slug];
    if (!item?.workflow) return next();
    // Confidential registers can require a narrower role set than ordinary trackers.
    if (item.roles && !item.roles.includes(req.user.role_id))
      return res.status(403).json({ message: "You cannot access this workflow." });
    if (item.scope !== "own" && ![1, 3, 4].includes(req.user.role_id))
      return res.status(403).json({ message: "Staff access required." });
    req.workflow = item;
    next();
  });
  const wrap = (fn) => (req, res, next) =>
    req.workflow ? Promise.resolve(fn(req, res)).catch(next) : next();
  const scope = (req) =>
    req.workflow.scope === "own" && !isStaff(req.user)
      ? [" AND owner_id=?", [req.user.user_id]]
      : ["", []];
  async function row(run, req, lock = false, includeArchived = false) {
    const [where, args] = scope(req);
    const [r] = await run(
      "SELECT * FROM ?? WHERE record_id=?" +
        where +
        (lock ? " FOR UPDATE" : ""),
      [req.workflow.workflow.table, req.params.id, ...args],
    );
    if (!r || r.deleted_at && !includeArchived && req.method!=="GET") throw fail("Record not found", 404);
    return r;
  }
  router.get(
    "/:slug/records",
    wrap(async (req, res) => {
      const [where, args] = scope(req);
      const archived = req.query.archive === '1';
      const creatorFilter = archived && !isStaff(req.user) ? ' AND created_by=?' : '';
      if (creatorFilter) args.push(req.user.user_id);
      const rows = await query(
        db,
        `SELECT * FROM ?? WHERE deleted_at IS ${archived ? 'NOT ' : ''}NULL` +
          where + creatorFilter +
          ' ORDER BY ' + (archived ? 'deleted_at DESC,' : '') + 'record_id DESC LIMIT 500',
        [req.workflow.workflow.table, ...args],
      );
      res.json(
        rows.map((r) => ({
          ...r,
          restorable: archived && canManageDraft(r, req.user),
          commentable: !archived && canComment(r, req.user),
          allowed_transitions: archived ? [] : transitions(req.workflow, r, req.user),
          editable:!archived && canManageDraft(r, req.user) && !/Approved|Verified|Reviewed|Resolved|Cleared|Closed|Achieved|Complete|Archived|Inactive|Checked out|Cancelled|Declined|Withdrawn|Deferred/.test(r.status),
          deletable:!archived && canManageDraft(r, req.user) && r.status===req.workflow.states[0],
        })),
      );
    }),
  );
  router.get(
    "/:slug/records/:id/history",
    wrap(async (req, res) => {
      await row((s, p) => query(db, s, p), req);
      res.json(
        await query(
          db,
          "SELECT e.*,u.full_name actor_name FROM workflow_events e JOIN users u ON u.user_id=e.actor_id WHERE module_slug=? AND record_id=? ORDER BY event_id",
          [req.workflow.slug, req.params.id],
        ),
      );
    }),
  );
  router.post('/:slug/records/:id/comments', wrap(async (req, res) => {
    const text = req.body.comment;
    if (typeof text !== 'string' || !text.trim() || text.length > 1480)
      throw fail('Enter a comment up to 1,480 characters.');
    await transaction(async run => {
      const record = await row(run, req, true);
      if (!canComment(record, req.user)) throw fail('You cannot comment on this record.', 403);
      // Comments append to the timeline without changing the workflow state or version.
      await event(run, req, record.record_id, record.status, record.status, 'Comment: ' + text.trim());
    });
    res.status(201).json({ message: 'Comment added.' });
  }));
  router.post(
    "/:slug/records",
    wrap(async (req, res) => {
      const value = validate(req.workflow, req.body);
      const id = await transaction(async (run) => {
        await references(run, value);
        const r = await run("INSERT INTO ?? SET ?", [
          req.workflow.workflow.table,
          {
            ...value,
            owner_id: req.workflow.scope === "own" ? req.user.user_id : null,
            created_by: req.user.user_id,
            status: req.workflow.states[0],
          },
        ]);
        await event(
          run,
          req,
          r.insertId,
          null,
          req.workflow.states[0],
          "Created",
        );
        return r.insertId;
      });
      res.status(201).json({ record_id: id });
    }),
  );
  router.patch(
    "/:slug/records/:id",
    wrap(async (req, res) => {
      const value = validate(req.workflow, req.body);
      await transaction(async (run) => {
        const r = await row(run, req, true);
        if (r.created_by !== req.user.user_id && !isStaff(req.user))
          throw fail("Only the author or HR can edit this record.", 403);
        if (
          /Approved|Verified|Reviewed|Resolved|Cleared|Closed|Achieved|Complete|Archived|Inactive|Checked out|Cancelled|Declined|Withdrawn|Deferred/.test(
            r.status,
          )
        )
          throw fail("Final decisions cannot be edited.", 409);
        if (Number(req.body.version) !== r.version)
          throw fail("This record changed. Refresh before editing.", 409);
        await references(run, value);
        await run("UPDATE ?? SET ?,version=version+1 WHERE record_id=?", [
          req.workflow.workflow.table,
          value,
          r.record_id,
        ]);
        await event(
          run,
          req,
          r.record_id,
          r.status,
          r.status,
          "Details edited",
        );
      });
      res.json({ message: "Saved" });
    }),
  );
  router.delete('/:slug/records/:id',wrap(async(req,res)=>{
    await transaction(async run=>{const record=await row(run,req,true);
      if(!canManageDraft(record, req.user))throw fail('Only the author or HR can remove a draft.',403);
      if(record.status!==req.workflow.states[0])throw fail('Reviewed records retain their audit history. Use a supported workflow decision.',409);
      await run('UPDATE ?? SET deleted_at=NOW(),version=version+1 WHERE record_id=?',[req.workflow.workflow.table,record.record_id]);
      await event(run,req,record.record_id,record.status,record.status,'Draft removed from active records; history retained.');
    });res.json({message:'Draft removed. Audit history retained.'});
  }));
  router.post('/:slug/records/:id/restore', wrap(async (req, res) => {
    await transaction(async run => {
      const record = await row(run, req, true, true);
      if (!canManageDraft(record, req.user)) throw fail('Only the author or HR can restore a draft.', 403);
      if (!record.deleted_at || record.status !== req.workflow.states[0] || record.version !== Number(req.body.version))
        throw fail('This draft changed. Refresh the archive before restoring.', 409);
      await run('UPDATE ?? SET deleted_at=NULL,version=version+1 WHERE record_id=?',
        [req.workflow.workflow.table, record.record_id]);
      await event(run, req, record.record_id, record.status, record.status, 'Draft restored to active records.');
    });
    res.json({ message: 'Draft restored.' });
  }));
  router.post(
    "/:slug/records/:id/transition",
    wrap(async (req, res) => {
      await transaction(async (run) => {
        const r = await row(run, req, true);
        if (Number(req.body.version) !== r.version)
          throw fail("This record changed. Refresh before deciding.", 409);
        if (!transitions(req.workflow, r, req.user).includes(req.body.status))
          throw fail(
            "Transition is not permitted for this role or stage.",
            403,
          );
        if (
          typeof req.body.note !== "string" ||
          !req.body.note.trim() ||
          req.body.note.length > 1500
        )
          throw fail("A decision note is required.");
        const closure = {
          disciplinary: "resolution",
          grievance: "resolution",
          cybersecurity: "remediation",
          "threat-monitor": "containment",
          "fraud-detection": "review_findings",
        };
        const required = closure[req.workflow.slug];
        if (
          required &&
          ["Resolved", "Closed", "Cleared"].includes(req.body.status) &&
          !String(r[required] || "").trim()
        )
          throw fail(
            "Add " +
              required.replaceAll("_", " ") +
              " before closing this case.",
          );
        await references(run, r);
        await applyDecision(run, req, r);
        await run(
          "UPDATE ?? SET status=?,version=version+1 WHERE record_id=?",
          [req.workflow.workflow.table, req.body.status, r.record_id],
        );
        await event(
          run,
          req,
          r.record_id,
          r.status,
          req.body.status,
          req.body.note,
        );
      });
      res.json({ message: "Workflow decision recorded" });
    }),
  );
}
async function references(run, value) {
  for (const key of ["employee_id", "host_id", "reviewer_id", "mentor_id"])
    if (value[key] != null) {
      const [u] = await run("SELECT user_id FROM users WHERE user_id=?", [
        value[key],
      ]);
      if (!u) throw fail("Choose an existing employee for " + key);
    }
  if (value.shift_id != null) {
    const [s] = await run("SELECT shift_id FROM shifts WHERE shift_id=?", [
      value.shift_id,
    ]);
    if (!s) throw fail("Choose an existing shift.");
  }
}
async function event(run, req, id, from, to, note) {
  await run(
    "INSERT INTO workflow_events (module_slug,record_id,actor_id,from_status,to_status,note) VALUES (?,?,?,?,?,?)",
    [req.workflow.slug, id, req.user.user_id, from, to, note],
  );
}
async function applyDecision(run, req, row) {
  if (req.body.status !== "Approved") return;
  if (req.workflow.slug === "regularization") {
    validate(req.workflow, {
      ...row,
      work_date:
        typeof row.work_date === "string"
          ? row.work_date.slice(0, 10)
          : row.work_date.toISOString().slice(0, 10),
      target_date: null,
    });
    const start = row.requested_clock_in,
      end = row.requested_clock_out;
    const hours =
      (Number(end.slice(0, 2)) * 60 +
        Number(end.slice(3)) -
        Number(start.slice(0, 2)) * 60 -
        Number(start.slice(3))) /
      60;
    const date =
      typeof row.work_date === "string"
        ? row.work_date.slice(0, 10)
        : row.work_date.toISOString().slice(0, 10);
    await run(
      `INSERT INTO attendance (user_id,work_date,clock_in,clock_out,total_hours,status,remarks)
   VALUES (?,?,?,?,?,'present',?) ON DUPLICATE KEY UPDATE clock_in=VALUES(clock_in),clock_out=VALUES(clock_out),total_hours=VALUES(total_hours),status='present',remarks=VALUES(remarks)`,
      [
        row.owner_id,
        date,
        date + " " + start + ":00",
        date + " " + end + ":00",
        hours,
        "Approved correction #" + row.record_id,
      ],
    );
  }
  if (
    req.workflow.slug === "shift-bidding" &&
    new Date(row.effective_date).toISOString().slice(0, 10) >
      new Date().toISOString().slice(0, 10)
  )
    throw fail("Approve the shift on or after its effective date.", 409);
  if (req.workflow.slug === "shift-bidding")
    await run("UPDATE users SET shift_id=? WHERE user_id=?", [
      row.shift_id,
      row.owner_id,
    ]);
}
module.exports = { ensure, migrate, routes, transitions };
