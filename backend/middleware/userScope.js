const database = require('../config/db');
const { query } = require('../services/database');

async function managesUser(managerId, userId) {
  const [report] = await query(database,
    'SELECT user_id FROM users WHERE user_id=? AND reporting_manager_id=?',
    [userId, managerId]);
  return Boolean(report);
}

function userScope(parameter, { allowStaff = false } = {}) {
  return async (request, response, next) => {
    const userId = Number(request.params[parameter]);
    if (!Number.isSafeInteger(userId) || userId < 1)
      return response.status(400).json({ message: 'Choose a valid user.' });
    const actor = request.user;
    if (userId === actor.user_id) return next();
    try {
      if (allowStaff && ([1, 4].includes(actor.role_id) ||
          (actor.role_id === 3 && await managesUser(actor.user_id, userId)))) return next();
      response.status(403).json({ message: 'You cannot access this user’s records.' });
    } catch (error) { next(error); }
  };
}

module.exports = { userScope, managesUser };
