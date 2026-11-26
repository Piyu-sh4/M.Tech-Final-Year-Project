const db = require('../config/db');
const { query, transaction } = require('./database');
const { fail, decisionId } = require('./workforceDecisions');
const templates = ['classic','modern','course'];
const read = (sql, values) => query(db,sql,values);

async function ensure(connection) {
  for (const [name,definition] of [
    ['template',"VARCHAR(12) NOT NULL DEFAULT 'classic'"],
    ['revoked_at','TIMESTAMP NULL'],
    ['revoked_by','INT NULL'],
  ]) {
    const [column] = await query(connection,`SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='training_certificates' AND COLUMN_NAME=?`,[name]);
    if (!column) await query(connection,'ALTER TABLE training_certificates ADD COLUMN ?? '+definition,[name]);
  }
  await query(connection,`CREATE TABLE IF NOT EXISTS training_certificate_corrections (
    correction_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    proposed_name VARCHAR(150) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    original_name VARCHAR(150) NULL,
    INDEX certificate_requests (enrollment_id,correction_id),
    FOREIGN KEY (enrollment_id) REFERENCES training_certificates(enrollment_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
}

async function list(request,response,staff = false) {
  const id = request.user.user_id;
  response.json(await read(`SELECT c.enrollment_id,e.user_id,c.learner_name,c.course_title,c.issued_at,c.template,
    IF(c.revoked_at IS NULL,'issued','revoked') status, IF(c.revoked_at IS NULL,1,0) downloadable,
    COALESCE(r.status,'none') correction_status,r.proposed_name
    FROM training_certificates c JOIN training_enrollments e USING(enrollment_id)
    LEFT JOIN training_certificate_corrections r ON r.correction_id=(
      SELECT recent.correction_id FROM training_certificate_corrections recent
      WHERE recent.enrollment_id=c.enrollment_id ORDER BY recent.correction_id DESC LIMIT 1)
    ${staff ? '' : 'WHERE e.user_id=?'}
    ORDER BY (r.status='pending' AND c.revoked_at IS NULL) DESC,c.issued_at DESC,c.enrollment_id DESC`,staff ? [] : [id]));
}

async function lockCertificate(run, id) {
  const [certificate] = await run(`SELECT c.*,e.user_id FROM training_certificates c
    JOIN training_enrollments e USING(enrollment_id) WHERE c.enrollment_id=? FOR UPDATE`,[id]);
  if (!certificate) fail(404,'Certificate not found.');
  return certificate;
}

async function requestCorrection(request,response) {
  const id = decisionId(request.params.enrollmentId);
  const input = request.body?.proposed_name;
  if (typeof input !== 'string' || input.trim().length < 2 || input.length > 150 || /[\x00-\x1f\x7f]/.test(input))
    fail(400,'Enter a corrected name between 2 and 150 characters.');
  const name = input.trim();
  await transaction(async run=>{
    const certificate = await lockCertificate(run,id);
    if (certificate.user_id !== request.user.user_id || certificate.revoked_at) fail(404,'Certificate not found.');
    if (certificate.learner_name === name) fail(400,'Enter a name different from the issued certificate.');
    const [pending] = await run("SELECT correction_id FROM training_certificate_corrections WHERE enrollment_id=? AND status='pending'",[id]);
    if (pending) fail(409,'This certificate already has a pending correction.');
    await run('INSERT INTO training_certificate_corrections (enrollment_id,proposed_name) VALUES (?,?)',[id,name]);
  });
  response.status(201).json({ message:'Certificate correction requested.' });
}

async function decide(request,response) {
  const id = decisionId(request.params.enrollmentId);
  const { action } = request.body || {};
  if (!['approve','reject','revoke'].includes(action)) fail(400,'Choose a supported certificate decision.');
  await transaction(async run=>{
    const certificate = await lockCertificate(run,id);
    if (certificate.user_id === request.user.user_id) fail(403,'Ask a separate reviewer to decide this certificate.');
    if (certificate.revoked_at) fail(409,'This certificate has been revoked.');
    if (action === 'revoke') {
      await run('UPDATE training_certificates SET revoked_at=NOW(),revoked_by=? WHERE enrollment_id=?',[request.user.user_id,id]);
      await run(`UPDATE training_certificate_corrections SET status='rejected',reviewed_at=NOW(),reviewed_by=?
        WHERE enrollment_id=? AND status='pending'`,[request.user.user_id,id]);
      return;
    }
    const [pending] = await run("SELECT correction_id,proposed_name FROM training_certificate_corrections WHERE enrollment_id=? AND status='pending' FOR UPDATE",[id]);
    if (!pending) fail(409,'No pending correction was found.');
    if (action === 'approve') {
      await run('UPDATE training_certificates SET learner_name=? WHERE enrollment_id=?',[pending.proposed_name,id]);
    }
    await run(`UPDATE training_certificate_corrections SET status=?,reviewed_at=NOW(),reviewed_by=?,original_name=?
      WHERE correction_id=?`,[action === 'approve' ? 'approved' : 'rejected',request.user.user_id,certificate.learner_name,pending.correction_id]);
  });
  response.json({message: action === 'revoke' ? 'Certificate revoked.' : 'Correction decision saved.'});
}

module.exports = {
  ensure, requestCorrection, decide, templates,
  listOwn: (request,response) => list(request,response),
  listForReview: (request,response) => list(request,response,true),
};
