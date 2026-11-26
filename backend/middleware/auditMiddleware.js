/**
 * auditMiddleware.js — Automatic Audit Log v6.0
 */
// The underlying records retain sensitive details under their own access rules.
const metadataOnly = new Set([
  'safety_sos_events', 'safety_night_shift_approvals', 'employee_banking',
  'loan_applications', 'tax_declarations', 'dependent_members', 'employee_benefits', 'helpdesk_tickets',
]);
const db = require('../config/db');
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,
    /password|token|secret|api.?key|account_number|aadhaar|pan_number/i.test(key) ? '[redacted]' : redact(item)]));
}
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
          const ip = require('../services/requestIdentity').clientIp(req);
          await query(
            `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_values, ip_address)
             VALUES (?,?,?,?,?,?)`,
            [req.user?.user_id || null, action, entity, entity_id,
              JSON.stringify(metadataOnly.has(entity) ? { params: req.params } : { body: redact(req.body), params: req.params }), ip]
          );
        } catch (_) {}
      }
      return _json(body);
    };
    next();
  };
};
