const { createHash, createHmac } = require('node:crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { query, transaction } = require('./database');
const { createInTransaction } = require('./buildRequests');

const audience = 'workforce-sign-out-feedback';
const signingKey = () => createHmac('sha256', process.env.JWT_SECRET).update(audience).digest();
const failure = (status, message) => Object.assign(new Error(message), { status });

async function ensure(connection) {
  await query(connection, `CREATE TABLE IF NOT EXISTS sign_out_feedback (
    session_digest CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment VARCHAR(4000) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX sign_out_feedback_history (submitted_at),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await query(connection, `CREATE TABLE IF NOT EXISTS sign_out_feedback_review (
    session_digest CHAR(64) PRIMARY KEY,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    review_note TEXT NULL,
    build_request_id INT NULL,
    deleted_at TIMESTAMP NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_digest) REFERENCES sign_out_feedback(session_digest) ON DELETE CASCADE,
    FOREIGN KEY (build_request_id) REFERENCES build_requests(request_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// The derived key prevents a feedback receipt from serving as a sign-in token.
function offer(sessionId) {
  return jwt.sign({}, signingKey(), { audience, subject: sessionId, expiresIn: '15m', algorithm: 'HS256' });
}

async function submit({ receipt, rating, comment = '' } = {}) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== 'string' || comment.length > 4000)
    throw failure(400, 'Choose a rating from 1 to 5 and keep comments within 1,000 characters.');
  // The shared sanitizer encodes certain characters. Decode those entities for plain-text rendering.
  const characters = { amp: '&', lt: '<', gt: '>', quot: '"' };
  const feedback = comment.replace(/&(amp|lt|gt|quot);/g, (_, name) => characters[name]);
  if (feedback.length > 1000) throw failure(400, 'Keep comments within 1,000 characters.');

  let sessionId;
  try {
    if (typeof receipt !== 'string' || receipt.length > 512) throw new Error();
    sessionId = jwt.verify(receipt, signingKey(), { audience, algorithms: ['HS256'] }).sub;
    if (typeof sessionId !== 'string' || !/^[a-f0-9]{64}$/.test(sessionId)) throw new Error();
  } catch {
    throw failure(403, 'This feedback link is no longer available.');
  }

  const digest = createHash('sha256').update(sessionId).digest('hex');
  // Retry without duplicating or changing feedback when the browser loses a response.
  await query(pool, `INSERT INTO sign_out_feedback (session_digest,user_id,rating,comment)
    SELECT ?,user_id,?,? FROM user_sessions WHERE session_id=? AND revoked_at IS NOT NULL
    ON DUPLICATE KEY UPDATE session_digest=sign_out_feedback.session_digest`, [digest,rating,feedback,sessionId]);
  const [saved] = await query(pool, `SELECT users.full_name FROM sign_out_feedback feedback
    JOIN users ON users.user_id=feedback.user_id WHERE feedback.session_digest=?`, [digest]);
  if (!saved) throw failure(403, 'This feedback link is no longer available.');
  return saved;
}

function list() {
  return query(pool, `SELECT feedback.session_digest AS feedback_id,feedback.submitted_at,users.full_name,
    feedback.rating,feedback.comment,IF(review.is_read,'Read','Unread') AS status,
    review.review_note,review.build_request_id
    FROM sign_out_feedback feedback JOIN users ON users.user_id=feedback.user_id
    LEFT JOIN sign_out_feedback_review review ON review.session_digest=feedback.session_digest
    WHERE review.deleted_at IS NULL
    ORDER BY feedback.submitted_at DESC,feedback.session_digest DESC LIMIT 500`);
}

async function review(feedbackId, user, { action, note } = {}) {
  if (!/^[a-f0-9]{64}$/.test(feedbackId)) throw failure(404, 'Feedback not found.');
  if (!['read', 'unread', 'note', 'forward', 'delete'].includes(action)) throw failure(400, 'Choose a feedback action.');
  const text = typeof note === 'string' ? note.trim() : '';
  if (['note','forward'].includes(action) && (!text || text.length > 1480))
    throw failure(400, 'Enter a note of up to 1,480 characters.');
  return transaction(async run => {
    // Lock the source so two administrators cannot forward the same item twice.
    const [source] = await run('SELECT session_digest FROM sign_out_feedback WHERE session_digest=? FOR UPDATE', [feedbackId]);
    if (!source) throw failure(404, 'Feedback not found.');
    await run('INSERT IGNORE INTO sign_out_feedback_review (session_digest) VALUES (?)', [feedbackId]);
    const [previous] = await run('SELECT * FROM sign_out_feedback_review WHERE session_digest=?', [feedbackId]);
    if (previous.deleted_at) {
      if (action === 'delete') return { message: 'Feedback removed from history.' };
      throw failure(404, 'Feedback not found.');
    }
    switch (action) {
      case 'read':
      case 'unread':
        await run('UPDATE sign_out_feedback_review SET is_read=?,updated_by=? WHERE session_digest=?', [action === 'read',user.user_id,feedbackId]);
        return { message: action === 'read' ? 'Marked as read.' : 'Marked as unread.' };
      case 'note':
        await run('UPDATE sign_out_feedback_review SET review_note=?,updated_by=? WHERE session_digest=?', [text,user.user_id,feedbackId]);
        return { message: 'Review note saved.' };
      case 'delete':
        await run('UPDATE sign_out_feedback_review SET deleted_at=NOW(),updated_by=? WHERE session_digest=?', [user.user_id,feedbackId]);
        return { message: 'Feedback removed from history.' };
      case 'forward': {
        if (previous.build_request_id) return { message: 'Already forwarded as build request #' + previous.build_request_id + '.' };
        // Only the administrator’s instructions enter the queue. The private feedback remains in its history.
        const title = text.split(/\r?\n/)[0].slice(0, 100);
        const requestId = await createInTransaction(run, user, { title, instructions: text });
        await run('UPDATE sign_out_feedback_review SET build_request_id=?,is_read=1,updated_by=? WHERE session_digest=?',
          [requestId,user.user_id,feedbackId]);
        return { message: 'Queued build request #' + requestId + '.', request_id: requestId };
      }
    }
  });
}

module.exports = { ensure, offer, submit, list, review };
