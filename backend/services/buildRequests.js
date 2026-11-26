const database = require('../config/db');
const {query, transaction} = require('./database');

async function ensure(connection) {
  await query(connection, `CREATE TABLE IF NOT EXISTS build_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    instructions TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    status ENUM('queued','in_progress','blocked','in_review','completed') NOT NULL DEFAULT 'queued',
    created_by INT NULL,
    assigned_to INT NULL,
    revision INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX queue_order(status, request_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
  )`);
  await query(connection, `CREATE TABLE IF NOT EXISTS build_request_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    actor_id INT NULL,
    actor_name VARCHAR(200) NOT NULL,
    kind ENUM('submitted','claimed','follow_up','status','result') NOT NULL,
    body TEXT NOT NULL,
    evidence_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX request_history(request_id, event_id),
    FOREIGN KEY (request_id) REFERENCES build_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(user_id) ON DELETE SET NULL
  )`);
}

function fail(status, message) {
  throw Object.assign(new Error(message), {status});
}

function textField(value, label, limit, required = true) {
  if (!required && value === undefined) return '';
  if (typeof value !== 'string' || value.trim().length > limit || (required && !value.trim()))
    fail(400, label+' must '+(required ? 'contain 1–' : 'contain at most ')+limit+' characters.');
  return value.trim();
}

function event(run, requestId, user, kind, body = '', evidence = null) {
  return run('INSERT INTO build_request_events(request_id,actor_id,actor_name,kind,body,evidence_url) VALUES (?,?,?,?,?,?)',
    [requestId,user.user_id,user.full_name,kind,body,evidence]);
}

async function list(before, status) {
  const where = [];
  const values = [];
  if (before !== undefined) { where.push('r.request_id < ?'); values.push(requestId(before)); }
  if (status !== undefined && status !== '') {
    if (!['queued','in_progress','blocked','in_review','completed'].includes(status)) fail(400,'Choose a valid status.');
    where.push('r.status = ?');
    values.push(status);
  }
  return transaction(async run => {
    const rows = await run(`SELECT r.request_id,r.title,r.status,r.assigned_to,r.revision,r.updated_at,
      author.full_name AS author,assignee.full_name AS assignee FROM build_requests r
      LEFT JOIN users author ON author.user_id=r.created_by LEFT JOIN users assignee ON assignee.user_id=r.assigned_to
      ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY r.request_id DESC LIMIT 31`,values);
    // Summary counters describe the whole queue, including rows on later pages.
    const totals = await run('SELECT status, COUNT(*) AS total FROM build_requests GROUP BY status');
    const counts = Object.fromEntries(totals.map(({status,total})=>[status,Number(total)]));
    return {requests:rows.slice(0,30),next_before:rows.length > 30 ? rows[29].request_id : null,counts};
  });
}

function requestId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) fail(400,'Invalid build request reference.');
  return id;
}

async function detail(value) {
  const id = requestId(value);
  // Read the request and its history in one snapshot so the prompt reflects its revision.
  return transaction(async run => {
    const [request] = await run(`SELECT r.*, author.full_name AS author,assignee.full_name AS assignee FROM build_requests r
      LEFT JOIN users author ON author.user_id=r.created_by LEFT JOIN users assignee ON assignee.user_id=r.assigned_to
      WHERE r.request_id=?`,[id]);
    if (!request) fail(404,'Build request not found.');
    const events = await run('SELECT event_id,actor_name,kind,body,evidence_url,created_at FROM build_request_events WHERE request_id=? ORDER BY event_id',[id]);
    return {...request, events};
  });
}

async function createInTransaction(run, user, body) {
  const title = textField(body.title,'Title',150);
  const instructions = textField(body.instructions,'Instructions',12000);
  const criteria = textField(body.acceptance_criteria,'Acceptance criteria',4000,false);
  const result = await run('INSERT INTO build_requests(title,instructions,acceptance_criteria,created_by) VALUES (?,?,?,?)',
    [title,instructions,criteria,user.user_id]);
  await event(run,result.insertId,user,'submitted');
  return result.insertId;
}

function create(user, body) {
  return transaction(run => createInTransaction(run, user, body));
}

async function claimNext(user) {
  return transaction(async run => {
    // FIFO pickup is serialized by the queue index. A second admin cannot claim the same row.
    const [request] = await run("SELECT request_id FROM build_requests WHERE status='queued' ORDER BY request_id LIMIT 1 FOR UPDATE");
    if (!request) return null;
    await claim(run,request.request_id,user);
    return request.request_id;
  });
}

async function claim(run, id, user) {
  await run("UPDATE build_requests SET status='in_progress',assigned_to=?,revision=revision+1 WHERE request_id=?", [user.user_id,id]);
  await event(run,id,user,'claimed');
}

async function mutate(value, user, body) {
  const id = requestId(value);
  return transaction(async run => {
    const [request] = await run('SELECT * FROM build_requests WHERE request_id=? FOR UPDATE',[id]);
    if (!request) fail(404,'Build request not found.');
    if (body.revision !== request.revision) fail(409,'This request changed. Reopen it and review the latest instructions.');
    if (body.action === 'claim') {
      if (request.status !== 'queued') fail(409,'Only queued requests can be picked up.');
      await claim(run,id,user);
      return;
    }
    let status = request.status;
    let assignee = request.assigned_to;
    let kind = 'status';
    let note = '';
    let evidence = null;
    switch (body.action) {
      case 'follow_up':
        kind = 'follow_up';
        note = textField(body.note,'Follow-up',8000);
        if (status !== 'queued' && status !== 'in_progress') { status = 'queued'; assignee = null; }
        break;
      case 'submit_result': {
        if (status !== 'in_progress' || assignee !== user.user_id) fail(409,'The admin who picked up this request can submit its result.');
        note = textField(body.note,'Changes and test results',8000);
        evidence = textField(body.evidence_url,'Commit or pull request link',500,false) || null;
        if (evidence && !/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:commit\/[0-9a-f]{7,40}|pull\/[1-9]\d*)\/?$/i.test(evidence))
          fail(400,'Enter a GitHub commit or pull request URL.');
        status = 'in_review';
        kind = 'result';
        break;
      }
      case 'block':
        if (status !== 'in_progress' || assignee !== user.user_id) fail(409,'Pick up the request before marking it blocked.');
        note = 'Blocked: '+textField(body.note,'Blocker',8000);
        status = 'blocked';
        break;
      case 'complete':
        if (status !== 'in_review') fail(409,'Submit a result before completing the review.');
        note = 'Review marked complete.';
        status = 'completed';
        break;
      case 'return_to_queue':
        if (!['blocked','in_progress','in_review'].includes(status)) fail(409,'This request cannot be returned to the queue.');
        note = 'Returned to queue: '+textField(body.note,'Reason for returning to the queue',8000);
        status = 'queued';
        assignee = null;
        break;
      default: fail(400,'Choose a build request action.');
    }
    await run('UPDATE build_requests SET status=?,assigned_to=?,revision=revision+1 WHERE request_id=?',[status,assignee,id]);
    await event(run,id,user,kind,note,evidence);
  });
}

module.exports = {ensure,list,detail,create,createInTransaction,claimNext,mutate};
