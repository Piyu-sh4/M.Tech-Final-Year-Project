/**
 * settingsController.js — Company Settings Center v8.0
 * Manages: company_settings, company_policies, office_locations
 */
const db = require('../config/db');

function query(sql, params) {
  return new Promise((resolve, reject) =>
    db.query(sql, params || [], (err, res) => err ? reject(err) : resolve(res))
  );
}

/* ══════════════════════════════════════════════════════
   COMPANY SETTINGS (key-value store)
══════════════════════════════════════════════════════ */

exports.getAllSettings = async (req, res) => {
  try {
    const { group } = req.query;
    const sql = group
      ? 'SELECT * FROM company_settings WHERE setting_group=? ORDER BY setting_key'
      : 'SELECT * FROM company_settings ORDER BY setting_group, setting_key';
    const rows = await query(sql, group ? [group] : []);
    // Build nested { group: { key: { value, description, type } } } for frontend
    const structured = {};
    for (const r of rows) {
      if (!structured[r.setting_group]) structured[r.setting_group] = {};
      let val = r.setting_value;
      if (r.value_type === 'number')  val = Number(val);
      if (r.value_type === 'boolean') val = val === '1' || val === 'true';
      if (r.value_type === 'json')    { try { val = JSON.parse(val); } catch(e) {} }
      structured[r.setting_group][r.setting_key] = { value: val, description: r.description, type: r.value_type };
    }
    res.json({ settings: structured, raw: rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch settings', error: err.message });
  }
};

exports.getSettingByKey = async (req, res) => {
  try {
    const [row] = await query(`SELECT * FROM company_settings WHERE setting_key = ?`, [req.params.key]);
    if (!row) return res.status(404).json({ message: 'Setting not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching setting', error: err.message });
  }
};

exports.upsertSetting = async (req, res) => {
  try {
    const { setting_key, setting_value, setting_group = 'general', label, description } = req.body;
    if (!setting_key) return res.status(400).json({ message: 'setting_key is required' });
    await query(
      `INSERT INTO company_settings (setting_key, setting_value, setting_group, label, description, updated_by)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         setting_value=VALUES(setting_value),
         setting_group=VALUES(setting_group),
         label=COALESCE(VALUES(label), label),
         description=COALESCE(VALUES(description), description),
         updated_by=VALUES(updated_by)`,
      [setting_key, setting_value, setting_group, label, description, req.user.user_id]
    );
    const [updated] = await query(`SELECT * FROM company_settings WHERE setting_key = ?`, [setting_key]);
    res.json({ message: 'Setting saved', setting: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error saving setting', error: err.message });
  }
};

exports.bulkUpsertSettings = async (req, res) => {
  try {
    const { settings } = req.body; // [{ setting_group, setting_key, setting_value }]
    if (!Array.isArray(settings) || settings.length === 0)
      return res.status(400).json({ message: 'settings array required' });
    for (const s of settings) {
      await query(
        `INSERT INTO company_settings (setting_group, setting_key, setting_value, updated_by)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE
           setting_value=VALUES(setting_value),
           updated_by=VALUES(updated_by)`,
        [s.setting_group || 'general', s.setting_key, String(s.setting_value ?? ''), req.user.user_id]
      );
    }
    res.json({ message: `${settings.length} settings saved`, count: settings.length });
  } catch (err) {
    res.status(500).json({ message: 'Bulk save failed', error: err.message });
  }
};

exports.deleteSetting = async (req, res) => {
  try {
    await query(`DELETE FROM company_settings WHERE setting_key = ?`, [req.params.key]);
    res.json({ message: 'Setting deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting setting', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   COMPANY POLICIES
══════════════════════════════════════════════════════ */

exports.getPolicies = async (req, res) => {
  try {
    const { type } = req.query;
    let sql = `
      SELECT p.*, u.full_name AS created_by_name, ub.full_name AS updated_by_name
      FROM company_policies p
      LEFT JOIN users u  ON p.created_by = u.user_id
      LEFT JOIN users ub ON p.updated_by = ub.user_id
      WHERE p.is_active = 1
    `;
    const params = [];
    if (type) { sql += ` AND p.policy_type = ?`; params.push(type); }
    sql += ` ORDER BY p.policy_type, p.policy_name`;
    const policies = await query(sql, params);
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch policies', error: err.message });
  }
};

exports.getPolicyById = async (req, res) => {
  try {
    const [policy] = await query(
      `SELECT p.*, u.full_name AS created_by_name FROM company_policies p
       LEFT JOIN users u ON COALESCE(p.created_by,p.uploaded_by) = u.user_id
       WHERE p.policy_id = ?`, [req.params.id]
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching policy', error: err.message });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const { policy_name, policy_type, content, version, effective_from } = req.body;
    if (!policy_name || !content) return res.status(400).json({ message: 'policy_name and content are required' });
    const result = await query(
      `INSERT INTO company_policies (policy_name, title, category, policy_type, content, version, effective_from, effective_date, created_by, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [policy_name, policy_name, policy_type || 'general', policy_type || 'general', content, version || '1.0', effective_from || null, effective_from || null,
       req.user.user_id, req.user.user_id]
    );
    res.status(201).json({ message: 'Policy created', policy_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating policy', error: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { policy_name, policy_type, content, version, effective_from, is_active } = req.body;
    await query(
      `UPDATE company_policies
       SET policy_name=COALESCE(?,policy_name), title=COALESCE(?,title),
           category=COALESCE(?,category), effective_date=COALESCE(?,effective_date),
           policy_type=COALESCE(?,policy_type),
           content=COALESCE(?,content),
           version=COALESCE(?,version),
           effective_from=COALESCE(?,effective_from),
           is_active=COALESCE(?,is_active),
           updated_by=?
       WHERE policy_id=?`,
      [policy_name, policy_name, policy_type, effective_from, policy_type, content, version, effective_from,
       is_active !== undefined ? is_active : null, req.user.user_id, req.params.id]
    );
    res.json({ message: 'Policy updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating policy', error: err.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    await query(`UPDATE company_policies SET is_active=0 WHERE policy_id=?`, [req.params.id]);
    res.json({ message: 'Policy archived' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting policy', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   OFFICE LOCATIONS
══════════════════════════════════════════════════════ */

exports.getLocations = async (req, res) => {
  try {
    const locations = await query(
      `SELECT l.*, u.full_name AS hr_contact_name, u.email AS hr_contact_email,
              u.phone AS hr_contact_phone
       FROM office_locations l
       LEFT JOIN users u ON l.hr_contact_id = u.user_id
       WHERE l.is_active = 1
       ORDER BY l.city`
    );
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch locations', error: err.message });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const [loc] = await query(
      `SELECT l.*, u.full_name AS hr_contact_name
       FROM office_locations l
       LEFT JOIN users u ON l.hr_contact_id = u.user_id
       WHERE l.location_id = ?`, [req.params.id]
    );
    if (!loc) return res.status(404).json({ message: 'Location not found' });
    // Attach employee count
    const [{ emp_count }] = await query(
      `SELECT COUNT(*) AS emp_count FROM users WHERE status='active'`
    ).catch(() => [{ emp_count: 0 }]);
    res.json({ ...loc, emp_count });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching location', error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { location_name, city, state, address, pincode, capacity, hr_contact_id, emergency_phone, lat, lng } = req.body;
    if (!location_name || !city) return res.status(400).json({ message: 'location_name and city required' });
    const result = await query(
      `INSERT INTO office_locations (location_name, city, state, address, pincode, capacity, hr_contact_id, emergency_phone, lat, lng)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [location_name, city, state, address, pincode, capacity || 0, hr_contact_id || null, emergency_phone, lat || null, lng || null]
    );
    res.status(201).json({ message: 'Location created', location_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating location', error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const ALLOWED = ['city','state','address','pincode','capacity','hr_contact',
                     'emergency_contact','latitude','longitude','is_active'];
    const fields = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.includes(k)));
    if (!Object.keys(fields).length) return res.status(400).json({ message: 'No valid fields to update' });
    const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
    const vals = [...Object.values(fields), req.params.id];
    await query(`UPDATE office_locations SET ${sets} WHERE location_id=?`, vals);
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating location', error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await query(`UPDATE office_locations SET is_active=0 WHERE location_id=?`, [req.params.id]);
    res.json({ message: 'Location deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting location', error: err.message });
  }
};
