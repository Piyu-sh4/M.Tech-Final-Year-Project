const bcrypt = require('bcryptjs');
const { query } = require('./database');

async function hashPassword(password) {
  if (password == null || password === '') return null;
  if (typeof password !== 'string' || Buffer.byteLength(password) > 72)
    throw Object.assign(new Error('Meeting passwords can be up to 72 bytes.'), { status: 400 });
  return bcrypt.hash(password, 12);
}

async function matchesPassword(password, storedHash) {
  return !storedHash || (typeof password === 'string' && Buffer.byteLength(password) <= 72 &&
    await bcrypt.compare(password, storedHash));
}

async function ensure(database) {
  const [column] = await query(database, "SHOW COLUMNS FROM meetings LIKE 'password'");
  if (column.Type !== 'varchar(60)')
    await query(database, 'ALTER TABLE meetings MODIFY password VARCHAR(60) DEFAULT NULL');
  // The original column was limited to 20 characters, so legacy values cannot be bcrypt hashes.
  const meetings = await query(database, 'SELECT meeting_id,password FROM meetings WHERE CHAR_LENGTH(password) BETWEEN 1 AND 20');
  for (const meeting of meetings) {
    await query(database, 'UPDATE meetings SET password=? WHERE meeting_id=? AND BINARY password=?',
      [await hashPassword(meeting.password), meeting.meeting_id, meeting.password]);
  }
}

module.exports = { hashPassword, matchesPassword, ensure };
