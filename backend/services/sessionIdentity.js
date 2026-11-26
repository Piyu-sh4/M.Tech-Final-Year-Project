const jwt = require('jsonwebtoken');
const database = require('../config/db');
const {query} = require('./database');

module.exports = async function sessionIdentity(token, allowLegacyRefresh = false) {
  let claims;
  try { claims = jwt.verify(token, process.env.JWT_SECRET); }
  catch (error) { throw Object.assign(new Error(error.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : 'Sign in with a valid session.'), {status:401}); }
  if (!claims.jti && !allowLegacyRefresh) throw Object.assign(new Error('Please refresh your session.'), {status:401});
  const [user] = await query(database,`SELECT u.user_id,u.full_name,u.email,u.role_id,u.status,u.department_id,
    (s.session_id IS NOT NULL AND s.revoked_at IS NULL AND s.expires_at>NOW()) session_valid
    FROM users u LEFT JOIN user_sessions s ON s.user_id=u.user_id AND s.session_id=? WHERE u.user_id=?`,
    [claims.jti || null,claims.user_id]);
  if (!user || user.status !== 'active' || (claims.jti && !user.session_valid))
    throw Object.assign(new Error('This session has ended. Please sign in again.'),{status:401});
  return {...claims,...user};
};
