/**
 * authMiddleware.js — JWT Token Verification v6.0
 *
 * Roles: 1=Admin  2=Employee  3=Manager  4=HR
 *
 * Exported helpers:
 *   protect         — any authenticated user
 *   adminOnly       — role_id === 1
 *   managerOrAbove  — role_id 1 or 3
 *   hrOrAbove       — role_id 1 or 4
 *   staffOrAbove    — role_id 1, 3, or 4
 */
const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'WIP@JWT#Secret2024!Change_Before_Deploy';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'No token provided. Please login first.' });
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ message: 'Invalid token format. Expected: Bearer <token>' });
  try {
    req.user = jwt.verify(token, SECRET()); // { user_id, email, role_id, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    return res.status(401).json({ message: 'Invalid token. Please login again.' });
  }
};

const adminOnly = (req, res, next) =>
  [1].includes(req.user.role_id) ? next()
    : res.status(403).json({ message: 'Admin access required' });

const managerOrAbove = (req, res, next) =>
  [1, 3].includes(req.user.role_id) ? next()
    : res.status(403).json({ message: 'Manager or Admin access required' });

const hrOrAbove = (req, res, next) =>
  [1, 4].includes(req.user.role_id) ? next()
    : res.status(403).json({ message: 'HR or Admin access required' });

const staffOrAbove = (req, res, next) =>
  [1, 3, 4].includes(req.user.role_id) ? next()
    : res.status(403).json({ message: 'Elevated role required (Admin / Manager / HR)' });

module.exports              = protect;
module.exports.adminOnly    = adminOnly;
module.exports.managerOrAbove = managerOrAbove;
module.exports.hrOrAbove    = hrOrAbove;
module.exports.staffOrAbove = staffOrAbove;
