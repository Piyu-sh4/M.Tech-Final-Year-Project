/**
 * gradesController.js — Employee Grades, Promotions, Skills & Certifications v9.0
 * Roles: 1=Admin  2=Employee  3=Manager  4=HR
 */
const db = require('../config/db');
function query(sql, p) {
  return new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));
}

/* ── Grade ── */
exports.getMyGrade = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eg.*, u2.full_name AS assigned_by_name
       FROM employee_grades eg
       LEFT JOIN users u2 ON u2.user_id = eg.assigned_by
       WHERE eg.user_id = ?
       ORDER BY eg.effective_date DESC LIMIT 1`,
      [req.user.user_id]
    );
    res.json(rows[0] || null);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserGrade = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eg.*, u2.full_name AS assigned_by_name
       FROM employee_grades eg
       LEFT JOIN users u2 ON u2.user_id = eg.assigned_by
       WHERE eg.user_id = ? ORDER BY eg.effective_date DESC LIMIT 1`,
      [req.params.userId]
    );
    res.json(rows[0] || null);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllGrades = async (req, res) => {
  try {
    const rows = await query(
      `SELECT eg.*, u.full_name, u.email, u2.full_name AS assigned_by_name
       FROM employee_grades eg
       JOIN users u ON u.user_id = eg.user_id
       LEFT JOIN users u2 ON u2.user_id = eg.assigned_by
       ORDER BY eg.grade_level, u.full_name`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.assignGrade = async (req, res) => {
  try {
    const { user_id, grade_level, designation, department, effective_date, salary_band_min, salary_band_max, notes } = req.body;
    const result = await query(
      `INSERT INTO employee_grades (user_id, grade_level, designation, department, effective_date, salary_band_min, salary_band_max, notes, assigned_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [user_id, grade_level, designation, department, effective_date, salary_band_min || null, salary_band_max || null, notes || null, req.user.user_id]
    );
    res.json({ message: 'Grade assigned', grade_id: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateGrade = async (req, res) => {
  try {
    const { grade_level, designation, department, effective_date, salary_band_min, salary_band_max, notes } = req.body;
    await query(
      `UPDATE employee_grades SET grade_level=?, designation=?, department=?, effective_date=?, salary_band_min=?, salary_band_max=?, notes=? WHERE grade_id=?`,
      [grade_level, designation, department, effective_date, salary_band_min || null, salary_band_max || null, notes || null, req.params.id]
    );
    res.json({ message: 'Grade updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Promotions ── */
exports.getMyPromotions = async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.*, u2.full_name AS approved_by_name
       FROM promotions p LEFT JOIN users u2 ON u2.user_id = p.approved_by
       WHERE p.user_id = ? ORDER BY p.effective_date DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllPromotions = async (req, res) => {
  try {
    const { status } = req.query;
    const sql = status
      ? `SELECT p.*, u.full_name, u.email, u2.full_name AS approved_by_name
         FROM promotions p JOIN users u ON u.user_id=p.user_id LEFT JOIN users u2 ON u2.user_id=p.approved_by
         WHERE p.status=? ORDER BY p.created_at DESC`
      : `SELECT p.*, u.full_name, u.email, u2.full_name AS approved_by_name
         FROM promotions p JOIN users u ON u.user_id=p.user_id LEFT JOIN users u2 ON u2.user_id=p.approved_by
         ORDER BY p.created_at DESC`;
    const rows = await query(sql, status ? [status] : []);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.requestPromotion = async (req, res) => {
  try {
    const { user_id, from_grade, to_grade, from_designation, to_designation, reason, effective_date, salary_revision } = req.body;
    const result = await query(
      `INSERT INTO promotions (user_id, from_grade, to_grade, from_designation, to_designation, reason, effective_date, salary_revision)
       VALUES (?,?,?,?,?,?,?,?)`,
      [user_id || req.user.user_id, from_grade, to_grade, from_designation, to_designation, reason, effective_date, salary_revision || 0]
    );
    res.json({ message: 'Promotion request submitted', promotion_id: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.reviewPromotion = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    if (!['approved', 'rejected'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    await query(
      `UPDATE promotions SET status=?, approved_by=? WHERE promotion_id=?`,
      [action, req.user.user_id, req.params.id]
    );
    if (action === 'approved') {
      const [promo] = await query(`SELECT * FROM promotions WHERE promotion_id=?`, [req.params.id]);
      if (promo) {
        await query(
          `INSERT INTO employee_grades (user_id, grade_level, designation, effective_date, assigned_by, notes)
           VALUES (?,?,?,?,?,?)`,
          [promo.user_id, promo.to_grade, promo.to_designation, promo.effective_date, req.user.user_id, `Promoted from ${promo.from_grade}`]
        );
      }
    }
    res.json({ message: `Promotion ${action}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Skills ── */
exports.getAllSkills = async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM skills ORDER BY category, skill_name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMySkills = async (req, res) => {
  try {
    const rows = await query(
      `SELECT sa.*, s.skill_name, s.category
       FROM skill_assessments sa JOIN skills s ON s.skill_id=sa.skill_id
       WHERE sa.user_id=? ORDER BY s.category, s.skill_name`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.upsertSkill = async (req, res) => {
  try {
    const { skill_id, proficiency } = req.body;
    await query(
      `INSERT INTO skill_assessments (user_id, skill_id, proficiency)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE proficiency=VALUES(proficiency), last_updated=CURRENT_TIMESTAMP`,
      [req.user.user_id, skill_id, proficiency]
    );
    res.json({ message: 'Skill updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.verifySkill = async (req, res) => {
  try {
    await query(
      `UPDATE skill_assessments SET verified=1, verified_by=? WHERE assessment_id=?`,
      [req.user.user_id, req.params.id]
    );
    res.json({ message: 'Skill verified' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* ── Certifications ── */
exports.getMyCerts = async (req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM certifications WHERE user_id=? ORDER BY issue_date DESC`,
      [req.user.user_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addCert = async (req, res) => {
  try {
    const { cert_name, issuing_body, cert_number, issue_date, expiry_date, cert_url } = req.body;
    const result = await query(
      `INSERT INTO certifications (user_id, cert_name, issuing_body, cert_number, issue_date, expiry_date, cert_url)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, cert_name, issuing_body || null, cert_number || null, issue_date || null, expiry_date || null, cert_url || null]
    );
    res.json({ message: 'Certification added', cert_id: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCert = async (req, res) => {
  try {
    await query(`DELETE FROM certifications WHERE cert_id=? AND user_id=?`, [req.params.id, req.user.user_id]);
    res.json({ message: 'Certification removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
