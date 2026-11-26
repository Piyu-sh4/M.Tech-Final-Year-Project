const { query, transaction } = require('./database');

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function teamReadScope(actor, employeeAlias = 'u') {
  return actor.role_id === 3
    ? { sql: ` AND (${employeeAlias}.user_id=? OR ${employeeAlias}.reporting_manager_id=?)`, params: [actor.user_id, actor.user_id] }
    : { sql: '', params: [] };
}

function requireIndependentReviewer(actor, record) {
  if (actor.user_id === record.user_id ||
      (actor.role_id === 3 && actor.user_id !== record.reporting_manager_id)) {
    fail(403, 'A separate authorized reviewer must decide this request.');
  }
}

function decisionId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(id) || id < 1) {
    fail(400, 'Choose a valid request.');
  }
  return id;
}

async function cancelOwnedRequest(actor, id, select, update) {
  await transaction(async run => {
    const [record] = await run(select, [id, actor.user_id]);
    if (!record) fail(404, 'Request not found.');
    // Repeating a successful cancellation must preserve the original record.
    if (record.status === 'cancelled') return;
    if (record.status !== 'pending') fail(409, 'Only a pending request can be cancelled.');
    await run(update, [id]);
  });
}

async function ensure(connection) {
  const tables = [
    ['travel_requests', "ENUM('pending','approved','rejected','completed','cancelled')"],
    ['safety_night_shift_approvals', "ENUM('pending','approved','rejected','cancelled')"],
  ];
  for (const [table, definition] of tables) {
    const [column] = await query(connection, `SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='status'`, [table]);
    if (column && !column.type.includes("'cancelled'")) {
      await query(connection, "ALTER TABLE ?? MODIFY status " + definition + " DEFAULT 'pending'", [table]);
    }
  }
  const [reporter] = await query(connection, `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='safety_complaints' AND COLUMN_NAME='reporter_id'`);
  if (reporter?.nullable === 'NO') {
    await query(connection, 'ALTER TABLE safety_complaints MODIFY reporter_id INT NULL');
  }
}

module.exports = { fail, teamReadScope, requireIndependentReviewer, decisionId, cancelOwnedRequest, ensure };
