/**
 * transferController.js — Family & Marriage Transfer Portal v9.0
 */
const db = require('../config/db');
function query(sql, p) {
  return new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));
}

/* ── Family Info ── */
exports.getMyFamily = async (req, res) => {
  try {
    const [row] = await query(`SELECT * FROM family_information WHERE user_id=?`, [req.user.user_id]);
    res.json(row || {});
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.upsertFamily = async (req, res) => {
  try {
    const { marital_status, spouse_name, spouse_employer, spouse_location, marriage_date, children_count, emergency_contact_1, emergency_contact_2 } = req.body;
    await query(
      `INSERT INTO family_information (user_id, marital_status, spouse_name, spouse_employer, spouse_location, marriage_date, children_count, emergency_contact_1, emergency_contact_2)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         marital_status=VALUES(marital_status), spouse_name=VALUES(spouse_name),
         spouse_employer=VALUES(spouse_employer), spouse_location=VALUES(spouse_location),
         marriage_date=VALUES(marriage_date), children_count=VALUES(children_count),
         emergency_contact_1=VALUES(emergency_contact_1), emergency_contact_2=VALUES(emergency_contact_2)`,
      [req.user.user_id, marital_status, spouse_name || null, spouse_employer || null, spouse_location || null,
       marriage_date || null, children_count || 0, emergency_contact_1 || null, emergency_contact_2 || null]
    );
    res.json({ message: 'Family information saved' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Transfer Requests ── */
exports.getMyTransfers = async (req, res) => {
  try {
    const rows = await query(
      `SELECT tr.*, u2.full_name AS manager_name, u3.full_name AS hr_name
       FROM transfer_requests tr
       LEFT JOIN users u2 ON u2.user_id=tr.manager_id
       LEFT JOIN users u3 ON u3.user_id=tr.hr_id
       WHERE tr.user_id=? ORDER BY tr.created_at DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllTransfers = async (req, res) => {
  try {
    const { status } = req.query;
    const sql = `SELECT tr.*, u.full_name, u.email,
                   u2.full_name AS manager_name, u3.full_name AS hr_name, u4.full_name AS admin_name
                 FROM transfer_requests tr
                 JOIN users u ON u.user_id=tr.user_id
                 LEFT JOIN users u2 ON u2.user_id=tr.manager_id
                 LEFT JOIN users u3 ON u3.user_id=tr.hr_id
                 LEFT JOIN users u4 ON u4.user_id=tr.admin_id
                 ${status ? 'WHERE tr.status=?' : ''}
                 ORDER BY tr.created_at DESC`;
    const rows = await query(sql, status ? [status] : []);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.applyTransfer = async (req, res) => {
  try {
    const { transfer_type, from_location, to_location, reason, preferred_date, is_urgent } = req.body;
    if (!transfer_type || !reason) return res.status(400).json({ message: 'Type and reason required' });
    const result = await query(
      `INSERT INTO transfer_requests (user_id, transfer_type, from_location, to_location, reason, preferred_date, is_urgent)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, transfer_type, from_location || null, to_location || null, reason, preferred_date || null, is_urgent ? 1 : 0]
    );
    res.json({ message: 'Transfer request submitted', transfer_id: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.managerReview = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    await query(
      `UPDATE transfer_requests SET manager_action=?, manager_id=?, manager_at=NOW(), manager_remarks=?,
       status=IF(?='approved','under_review',?) WHERE transfer_id=?`,
      [action, req.user.user_id, remarks || null, action, action === 'approved' ? 'under_review' : 'rejected', req.params.id]
    );
    res.json({ message: `Manager ${action}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.hrReview = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    await query(
      `UPDATE transfer_requests SET hr_action=?, hr_id=?, hr_at=NOW(), hr_remarks=?,
       status=IF(?='approved','under_review',?) WHERE transfer_id=?`,
      [action, req.user.user_id, remarks || null, action, action === 'approved' ? 'under_review' : 'rejected', req.params.id]
    );
    res.json({ message: `HR ${action}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.adminReview = async (req, res) => {
  try {
    const { action, remarks, effective_date } = req.body;
    await query(
      `UPDATE transfer_requests SET admin_action=?, admin_id=?, admin_at=NOW(), admin_remarks=?,
       effective_date=?, status=? WHERE transfer_id=?`,
      [action, req.user.user_id, remarks || null, effective_date || null,
       action === 'approved' ? 'approved' : 'rejected', req.params.id]
    );
    if (action === 'approved') {
      const [tr] = await query(`SELECT * FROM transfer_requests WHERE transfer_id=?`, [req.params.id]);
      if (tr) await query(
        `INSERT INTO relocation_history (user_id, transfer_id, from_location, to_location, moved_date)
         VALUES (?,?,?,?,?)`,
        [tr.user_id, tr.transfer_id, tr.from_location, tr.to_location, effective_date || new Date().toISOString().split('T')[0]]
      );
    }
    res.json({ message: `Transfer ${action}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getRelocationHistory = async (req, res) => {
  try {
    const uid = req.params.userId || req.user.user_id;
    const rows = await query(`SELECT * FROM relocation_history WHERE user_id=? ORDER BY moved_date DESC`, [uid]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
