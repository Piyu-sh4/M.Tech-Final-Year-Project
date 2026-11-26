const { createHash, randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const pool = require('../config/db');
const { query, transaction } = require('./database');

const digest = token => createHash('sha256').update(token).digest('hex');
const failure = (status, message) => Object.assign(new Error(message), { status });
const invalidLink = () => failure(400, 'This reset link is invalid or has expired. Request a new link.');

function ensure(connection) {
  return query(connection, `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    INDEX password_reset_user (user_id),
    INDEX password_reset_expiry (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

function mailSettings() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, PASSWORD_RESET_ORIGIN } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !PASSWORD_RESET_ORIGIN) return null;
  let origin;
  try { origin = new URL(PASSWORD_RESET_ORIGIN); }
  catch { return null; }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.href !== origin.origin + '/') return null;
  const secure = SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465;
  return {
    origin: origin.origin,
    sender: SMTP_FROM || SMTP_USER,
    transport: {
      host: SMTP_HOST, port: Number(SMTP_PORT || (secure ? 465 : 587)), secure,
      requireTLS: !secure, auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000
    }
  };
}

async function deliver(email, mail) {
  const [user] = await query(pool, "SELECT user_id,email FROM users WHERE email=? AND status='active'", [email]);
  if (!user) return;
  const token = await issue(user.user_id);
  const hash = digest(token);
  try {
    const link = new URL('/reset-password.html', mail.origin);
    // A fragment keeps the one-time token out of request URLs and access logs.
    link.hash = token;
    await nodemailer.createTransport(mail.transport).sendMail({
      from: mail.sender, to: user.email, subject: 'Reset your Workforce Intelligence password',
      text: 'Open this link within 20 minutes to reset your password:\n\n' + link +
        '\n\nIf you did not request a new password, you can ignore this email.'
    });
  } catch (error) {
    await query(pool, 'DELETE FROM password_reset_tokens WHERE token_hash=?', [hash]);
    throw error;
  }
}

async function issue(userId) {
  const token = randomBytes(32).toString('hex');
  await query(pool, 'DELETE FROM password_reset_tokens WHERE expires_at <= NOW() LIMIT 100');
  const created = await query(pool, `INSERT INTO password_reset_tokens (token_hash,user_id,expires_at)
    SELECT ?,user_id,NOW() + INTERVAL 20 MINUTE FROM users WHERE user_id=? AND status='active'`, [digest(token),userId]);
  if (!created.affectedRows) throw failure(404, 'An active account is required to create a reset link.');
  return token;
}

function requestReset(email) {
  if (typeof email !== 'string' || email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw failure(400, 'Enter your work email address.');
  const mail = mailSettings();
  if (!mail) throw failure(503, 'Reset email is unavailable. Contact your Workforce Intelligence administrator for help signing in.');
  // Send after accepting the request so lookup and delivery time do not reveal account membership.
  setImmediate(() => deliver(email.trim().toLowerCase(), mail).catch(error =>
    console.error('Password reset delivery failed:', error.code || 'delivery_error')));
}

function validPassword(password) {
  return typeof password === 'string' && Buffer.byteLength(password, 'utf8') <= 72 &&
    /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(password);
}

async function redeem({ token, password } = {}) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw invalidLink();
  if (!validPassword(password))
    throw failure(400, 'Use at least 8 characters, including an uppercase letter and a number. The maximum is 72 bytes.');
  const hash = digest(token);
  const [ticket] = await query(pool, 'SELECT user_id FROM password_reset_tokens WHERE token_hash=? AND expires_at>NOW()', [hash]);
  if (!ticket) throw invalidLink();
  const passwordHash = await bcrypt.hash(password, 12);
  const sessions = await transaction(async run => {
    const [user] = await run("SELECT user_id FROM users WHERE user_id=? AND status='active' FOR UPDATE", [ticket.user_id]);
    if (!user) throw invalidLink();
    const claim = await run('DELETE FROM password_reset_tokens WHERE token_hash=? AND expires_at>NOW()', [hash]);
    if (!claim.affectedRows) throw invalidLink();
    await run('DELETE FROM password_reset_tokens WHERE user_id=?', [user.user_id]);
    await run('UPDATE users SET password_hash=? WHERE user_id=?', [passwordHash,user.user_id]);
    const active = await run('SELECT session_id FROM user_sessions WHERE user_id=? AND revoked_at IS NULL FOR UPDATE', [user.user_id]);
    await run('UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=? AND revoked_at IS NULL', [user.user_id]);
    return active;
  });
  for (const session of sessions) require('../socketServer').disconnectSession(session.session_id);
}

module.exports = { ensure, issue, requestReset, redeem };
