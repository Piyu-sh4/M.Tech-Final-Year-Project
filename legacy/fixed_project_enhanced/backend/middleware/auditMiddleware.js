/**
 * auditMiddleware.js — Automatic Audit Log v6.0
 */
const db = require('../config/db');
function query(sql, p) {
  return new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));
}

module.exports = function audit(action, entity) {
  return async (req, res, next) => {
    const _json = res.json.bind(res);
    res.json = async function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const entity_id = parseInt(
            req.params.id || req.params.user_id || req.params.task_id ||
            req.params.salary_id || req.params.leave_id || req.params.dept_id
          ) || null;
          const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
            || req.socket?.remoteAddress || null;
          await query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES (?,?,?,?,?,?)`,
            [req.user?.user_id || null, action, entity, entity_id,
              JSON.stringify({ body: req.body, params: req.params }), ip]
          );
        } catch (_) {}
      }
      return _json(body);
    };
    next();
  };
};
