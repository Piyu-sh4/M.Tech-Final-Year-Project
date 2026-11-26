/**
 * safetyController.js — Women Safety Module v8.0
 * Features: SOS alerts, complaints (POSH), night-shift approvals,
 *           emergency contacts management
 */
const db = require('../config/db');
const { transaction } = require('../services/database');
const { isISODate } = require('../services/validation');
const { fail, teamReadScope, requireIndependentReviewer, decisionId, cancelOwnedRequest } = require('../services/workforceDecisions');

function query(sql, params) {
  return new Promise((resolve, reject) =>
    db.query(sql, params || [], (err, res) => err ? reject(err) : resolve(res))
  );
}

/* ══════════════════════════════════════════════════════
   SOS EVENTS
══════════════════════════════════════════════════════ */

exports.triggerSOS = async (req, res, next) => {
  try {
    const { lat, lng, address, trigger_type = 'panic_button' } = req.body;
    if (!['panic_button','app_shake','auto_timer','manual','voice'].includes(trigger_type) ||
        (lat != null && (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90)) ||
        (lng != null && (typeof lng !== 'number' || !Number.isFinite(lng) || Math.abs(lng) > 180)) ||
        (address != null && (typeof address !== 'string' || address.length > 255)))
      fail(400, 'Enter a valid SOS trigger and optional location.');
    const result = await transaction(async run => {
      const event = await run(`INSERT INTO safety_sos_events (user_id,trigger_type,lat,lng,address)
        VALUES (?,?,?,?,?)`, [req.user.user_id,trigger_type,lat ?? null,lng ?? null,address ?? null]);
      const notice = await run(`INSERT INTO alerts (user_id,alert_type,alert_message)
        SELECT user_id,'sos',? FROM users WHERE role_id IN (1,4) AND status='active' AND user_id<>?`,
      ['An SOS incident needs attention. Open the incident register.',req.user.user_id]);
      return { id: event.insertId, notified: notice.affectedRows };
    });
    res.status(201).json({
      message: 'SOS recorded. Use local emergency services if you need immediate assistance.',
      sos_id: result.id, notified: result.notified, emergency_contacts_notified: 0,
    });
  } catch (error) { next(error); }
};

exports.getActiveSOS = async (req, res) => {
  try {
    const events = await query(
      `SELECT s.*, u.full_name, u.phone, u.email, u.designation,
              r.full_name AS resolved_by_name
       FROM safety_sos_events s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN users r ON s.resolved_by = r.user_id
       WHERE s.status IN ('active','responding')
       ORDER BY s.created_at DESC`
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching SOS events', error: err.message });
  }
};

exports.getAllSOS = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let sql = `
      SELECT s.*, u.full_name, u.phone, u.designation,
             r.full_name AS resolved_by_name
      FROM safety_sos_events s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN users r ON s.resolved_by = r.user_id
    `;
    const params = [];
    if (status) { sql += ` WHERE s.status=?`; params.push(status); }
    sql += ` ORDER BY s.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    const events = await query(sql, params);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching SOS events', error: err.message });
  }
};

async function updateIncident(req, stage) {
  const id = decisionId(req.params.id);
  const { resolution_notes, status } = req.body;
  if ((status != null && status !== stage) ||
      (resolution_notes != null && (typeof resolution_notes !== 'string' || resolution_notes.length > 1500)))
    fail(400, 'Choose a valid incident decision.');
  await transaction(async run => {
    const [incident] = await run('SELECT user_id,status FROM safety_sos_events WHERE sos_id=? FOR UPDATE', [id]);
    if (!incident) fail(404, 'Incident not found.');
    requireIndependentReviewer(req.user,incident);
    if (incident.status === stage) return;
    if (stage === 'responding' ? incident.status !== 'active' : !['active','responding'].includes(incident.status))
      fail(409, 'This incident has already been resolved.');
    if (stage === 'responding') {
      await run("UPDATE safety_sos_events SET status='responding' WHERE sos_id=?", [id]);
    } else {
      await run(`UPDATE safety_sos_events SET status='resolved',resolved_by=?,resolved_at=NOW(),resolution_notes=?
        WHERE sos_id=?`, [req.user.user_id,resolution_notes ?? null,id]);
    }
  });
}

exports.respondSOS = async (req, res, next) => {
  try {
    await updateIncident(req,'responding');
    res.json({ message: 'Marked as responding' });
  } catch (error) { next(error); }
};

exports.resolveSOS = async (req, res, next) => {
  try {
    await updateIncident(req,'resolved');
    res.json({ message: 'SOS marked as resolved' });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════════
   COMPLAINTS (POSH / Harassment)
══════════════════════════════════════════════════════ */

const complaintCategories = {
  harassment: 'verbal', discrimination: 'other', unsafe_environment: 'other', stalking: 'other', other: 'other',
};
const complaintTransitions = {
  filed: ['under_review'],
  under_review: ['icc_referred','resolved'],
  icc_referred: ['resolved'],
  resolved: ['closed'],
  closed: [],
};

// Unassigned cases go to existing HR/admin intake. A case assigned to a reviewer
// is visible only to that reviewer. Legacy accused and ICC columns still apply.
const complaintReviewScope = `NOT (c.accused_id <=> ?) AND NOT (c.against_user_id <=> ?)
  AND NOT (c.reporter_id <=> ?) AND (COALESCE(c.assigned_to,c.icc_member_id) IS NULL
    OR COALESCE(c.assigned_to,c.icc_member_id)=?)`;
const complaintReviewerParams = actorId => [actorId,actorId,actorId,actorId];

exports.fileComplaint = async (req, res, next) => {
  try {
    const { is_anonymous = false, complaint_type, against_user_id, department_id,
      incident_date, incident_location, description } = req.body;
    if (![true,false,'yes','no'].includes(is_anonymous) || !Object.hasOwn(complaintCategories,complaint_type) ||
        !isISODate(incident_date) || incident_date > new Date().toISOString().slice(0,10) ||
        typeof description !== 'string' || !description.trim() || description.length > 6000 ||
        (incident_location && (typeof incident_location !== 'string' || incident_location.length > 200)))
      fail(400, 'Choose a complaint type and enter the incident date and description.');
    const anonymous = is_anonymous === true || is_anonymous === 'yes';
    const accused = against_user_id ? decisionId(against_user_id) : null;
    const department = department_id ? decisionId(department_id) : null;
    const actorId = req.user.user_id;
    const result = await transaction(async run => {
      if (accused && (accused === actorId || !(await run('SELECT user_id FROM users WHERE user_id=?', [accused])).length))
        fail(400, 'Choose a valid other employee.');
      if (department && !(await run('SELECT dept_id FROM departments WHERE dept_id=?', [department])).length)
        fail(400, 'Choose a valid department.');
      const created = await run(`INSERT INTO safety_complaints
        (reporter_id,is_anonymous,complaint_type,category,against_user_id,accused_id,department_id,
         incident_date,incident_location,location,description)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [anonymous ? null : actorId,anonymous ? 1 : 0,complaint_type,complaintCategories[complaint_type],
        accused,accused,department,incident_date,incident_location || null,incident_location || null,description]);
      // Keep the reporter and case content out of the notification and audit streams.
      await run(`INSERT INTO alerts (user_id,alert_type,alert_message)
        SELECT user_id,'complaint',? FROM users WHERE role_id IN (1,4) AND status='active'
          AND NOT (user_id <=> ?) AND user_id<>?`,
      ['A confidential case is ready for intake.',accused,actorId]);
      return created;
    });
    res.status(201).json({ message: 'Confidential complaint filed. Case reference: ' + result.insertId + '.', complaint_id: result.insertId });
  } catch (error) { next(error); }
};

exports.getMyComplaints = async (req, res, next) => {
  try {
    res.json(await query(`SELECT complaint_id,COALESCE(complaint_type,category) complaint_type,incident_date,
      description,status,resolution,created_at FROM safety_complaints WHERE reporter_id=? AND COALESCE(is_anonymous,0)=0 ORDER BY created_at DESC`,
    [req.user.user_id]));
  } catch (error) { next(error); }
};

exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status } = req.query;
    const params = [...complaintReviewerParams(req.user.user_id),req.user.user_id];
    if (status) params.push(status);
    res.json(await query(`SELECT c.complaint_id,COALESCE(c.complaint_type,c.category) complaint_type,
      CASE WHEN c.is_anonymous=1 THEN NULL ELSE c.reporter_id END user_id,
      c.incident_date,c.description,c.status,c.resolution,c.created_at,c.is_anonymous,
      CASE WHEN c.is_anonymous=1 THEN NULL ELSE reporter.full_name END reporter_name, accused.full_name against_name,
      COALESCE(c.assigned_to,c.icc_member_id) assigned_to, reviewer.full_name assigned_to_name
      FROM safety_complaints c
      LEFT JOIN users reporter ON reporter.user_id=c.reporter_id
      LEFT JOIN users accused ON accused.user_id=COALESCE(c.against_user_id,c.accused_id)
      LEFT JOIN users reviewer ON reviewer.user_id=COALESCE(c.assigned_to,c.icc_member_id)
      WHERE (${complaintReviewScope} OR (c.reporter_id=? AND COALESCE(c.is_anonymous,0)=0))${status ? ' AND c.status=?' : ''} ORDER BY c.created_at DESC`,
    params));
  } catch (error) { next(error); }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const id = decisionId(req.params.id);
    const { status, assigned_to, icc_case_no, resolution } = req.body;
    if ((status != null && !Object.hasOwn(complaintTransitions,status)) ||
        (icc_case_no != null && (typeof icc_case_no !== 'string' || icc_case_no.length > 50)) ||
        (resolution != null && (typeof resolution !== 'string' || resolution.length > 1500)))
      fail(400, 'Choose a valid case status, reference and resolution.');
    await transaction(async run => {
      const [record] = await run(`SELECT c.* FROM safety_complaints c WHERE c.complaint_id=?
        AND ${complaintReviewScope} FOR UPDATE`, [id,...complaintReviewerParams(req.user.user_id)]);
      if (!record) fail(404, 'Complaint not found.');
      if (record.status === 'closed') fail(409, 'This complaint is closed.');
      if (status != null && status !== record.status && !complaintTransitions[record.status]?.includes(status))
        fail(409, 'The requested complaint decision is unavailable at this stage.');
      const assigned = assigned_to == null ? null : decisionId(assigned_to);
      if (assigned) {
        if ([record.reporter_id,record.accused_id,record.against_user_id].includes(assigned))
          fail(400, 'Choose an independent reviewer.');
        const [reviewer] = await run("SELECT user_id FROM users WHERE user_id=? AND role_id IN (1,4) AND status='active'", [assigned]);
        if (!reviewer) fail(400, 'Choose an active HR or admin reviewer.');
      }
      if (status === 'resolved' && !(resolution ?? record.resolution)?.trim())
        fail(400, 'Enter a resolution before resolving the complaint.');
      await run(`UPDATE safety_complaints
        SET status=COALESCE(?,status),assigned_to=COALESCE(?,assigned_to),icc_case_no=COALESCE(?,icc_case_no),
          resolution=COALESCE(?,resolution),resolved_at=IF(?='resolved',COALESCE(resolved_at,NOW()),resolved_at)
        WHERE complaint_id=?`, [status ?? null,assigned,icc_case_no ?? null,resolution ?? null,status ?? null,id]);
    });
    res.json({ message: 'Complaint updated' });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════════
   NIGHT SHIFT APPROVALS
══════════════════════════════════════════════════════ */

exports.requestNightShiftApproval = async (req, res, next) => {
  try {
    const { shift_date, shift_start, shift_end, transport_mode = 'company_cab', guardian_phone } = req.body;
    const time = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
    if (!isISODate(shift_date) || typeof shift_start !== 'string' || typeof shift_end !== 'string' ||
        !time.test(shift_start) || !time.test(shift_end) || shift_start === shift_end ||
        !['company_cab','own_vehicle','public','escort'].includes(transport_mode) ||
        (guardian_phone && (typeof guardian_phone !== 'string' || guardian_phone.length > 20)))
      fail(400, 'Enter a valid shift date, time and transport mode.');
    const userId = req.user.user_id;
    const result = await transaction(async run => {
      // The older start/end fields are required by existing deployments and read by the shared register.
      const created = await run(`INSERT INTO safety_night_shift_approvals
        (user_id,shift_date,start_time,end_time,shift_start,shift_end,cab_required,transport_mode,guardian_phone)
        VALUES (?,?,?,?,?,?,?,?,?)`,
      [userId,shift_date,shift_start,shift_end,shift_start,shift_end,transport_mode === 'company_cab' ? 1 : 0,transport_mode,guardian_phone || null]);
      await run(`INSERT INTO alerts (user_id,alert_type,alert_message)
        SELECT reviewer.user_id,'night_shift',? FROM users reviewer JOIN users employee ON employee.user_id=?
        WHERE reviewer.status='active' AND reviewer.user_id<>employee.user_id AND
          (reviewer.role_id IN (1,4) OR (reviewer.role_id=3 AND reviewer.user_id=employee.reporting_manager_id))`,
      ['A night shift request is ready for review.',userId]);
      return created;
    });
    res.status(201).json({ message: 'Night shift approval requested', approval_id: result.insertId });
  } catch (error) { next(error); }
};

exports.getMyNightShiftRequests = async (req, res, next) => {
  try {
    res.json(await query(`SELECT n.*,u.full_name,a.full_name AS approved_by_name
      FROM safety_night_shift_approvals n JOIN users u ON u.user_id=n.user_id
      LEFT JOIN users a ON n.approved_by=a.user_id WHERE n.user_id=? ORDER BY n.created_at DESC`, [req.user.user_id]));
  } catch (error) { next(error); }
};

exports.getAllNightShiftRequests = async (req, res, next) => {
  try {
    const scope = teamReadScope(req.user);
    res.json(await query(`SELECT n.approval_id,n.user_id,n.shift_date,n.start_time,n.end_time,n.cab_required,n.status,
      u.full_name,a.full_name AS approved_by_name
      FROM safety_night_shift_approvals n JOIN users u ON u.user_id=n.user_id
      LEFT JOIN users a ON n.approved_by=a.user_id WHERE 1=1${scope.sql} ORDER BY n.shift_date DESC`, scope.params));
  } catch (error) { next(error); }
};

exports.reviewNightShift = async (req, res, next) => {
  try {
    const id = decisionId(req.params.id);
    const { action, notes } = req.body;
    if (!['approved','rejected'].includes(action) || (notes != null && (typeof notes !== 'string' || notes.length > 1500)))
      fail(400, 'Choose a valid night shift decision.');
    await transaction(async run => {
      const [record] = await run(`SELECT n.user_id,n.status,u.reporting_manager_id
        FROM safety_night_shift_approvals n JOIN users u ON u.user_id=n.user_id WHERE n.approval_id=? FOR UPDATE`, [id]);
      if (!record) fail(404, 'Night shift request not found.');
      requireIndependentReviewer(req.user, record);
      if (record.status !== 'pending') fail(409, 'Only a pending night shift request can be reviewed.');
      await run(`UPDATE safety_night_shift_approvals SET status=?,approved_by=?,approved_at=NOW(),notes=?
        WHERE approval_id=?`, [action,req.user.user_id,notes || null,id]);
      await run("INSERT INTO alerts (user_id,alert_type,alert_message) VALUES (?,'night_shift',?)",
        [record.user_id,'Your night shift request was ' + action + '.']);
    });
    res.json({ message: 'Night shift ' + action });
  } catch (error) { next(error); }
};

exports.cancelNightShift = async (req, res, next) => {
  try {
    await cancelOwnedRequest(req.user, decisionId(req.params.id),
      'SELECT status FROM safety_night_shift_approvals WHERE approval_id=? AND user_id=? FOR UPDATE',
      "UPDATE safety_night_shift_approvals SET status='cancelled' WHERE approval_id=?");
    res.json({ message: 'Night shift request cancelled.' });
  } catch (error) { next(error); }
};

/* ══════════════════════════════════════════════════════
   EMERGENCY CONTACTS
══════════════════════════════════════════════════════ */

exports.getMyEmergencyContacts = async (req, res) => {
  try {
    const contacts = await query(
      `SELECT * FROM safety_emergency_contacts WHERE user_id=? ORDER BY is_primary DESC, created_at`,
      [req.user.user_id]
    );
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching contacts', error: err.message });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const { name, relation, phone, email, is_primary = false, notify_on_sos = true, notify_on_late = true } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'name and phone required' });
    if (is_primary) {
      await query(`UPDATE safety_emergency_contacts SET is_primary=0 WHERE user_id=?`, [req.user.user_id]);
    }
    const result = await query(
      `INSERT INTO safety_emergency_contacts (user_id, name, relation, phone, email, is_primary, notify_on_sos, notify_on_late)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.user_id, name, relation, phone, email, is_primary ? 1 : 0, notify_on_sos ? 1 : 0, notify_on_late ? 1 : 0]
    );
    res.status(201).json({ message: 'Emergency contact added', contact_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error adding contact', error: err.message });
  }
};

exports.updateEmergencyContact = async (req, res) => {
  try {
    const { name, relation, phone, email, is_primary, notify_on_sos, notify_on_late } = req.body;
    if (is_primary) {
      await query(`UPDATE safety_emergency_contacts SET is_primary=0 WHERE user_id=?`, [req.user.user_id]);
    }
    await query(
      `UPDATE safety_emergency_contacts
       SET name=COALESCE(?,name), relation=COALESCE(?,relation), phone=COALESCE(?,phone),
           email=COALESCE(?,email), is_primary=COALESCE(?,is_primary),
           notify_on_sos=COALESCE(?,notify_on_sos), notify_on_late=COALESCE(?,notify_on_late)
       WHERE contact_id=? AND user_id=?`,
      [name, relation, phone, email, is_primary !== undefined ? (is_primary ? 1 : 0) : null,
       notify_on_sos !== undefined ? (notify_on_sos ? 1 : 0) : null,
       notify_on_late !== undefined ? (notify_on_late ? 1 : 0) : null,
       req.params.id, req.user.user_id]
    );
    res.json({ message: 'Contact updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating contact', error: err.message });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    await query(`DELETE FROM safety_emergency_contacts WHERE contact_id=? AND user_id=?`,
      [req.params.id, req.user.user_id]);
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting contact', error: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   DASHBOARD STATS (Admin/HR)
══════════════════════════════════════════════════════ */

exports.getSafetyDashboard = async (req, res) => {
  try {
    const [sos_active]     = await query(`SELECT COUNT(*) AS n FROM safety_sos_events WHERE status='active'`);
    const [sos_total]      = await query(`SELECT COUNT(*) AS n FROM safety_sos_events`);
    const [complaints_open] = await query(`SELECT COUNT(*) AS n FROM safety_complaints c
      WHERE c.status IN ('filed','under_review','icc_referred') AND ${complaintReviewScope}`,
    complaintReviewerParams(req.user.user_id));
    const [night_pending]  = await query(`SELECT COUNT(*) AS n FROM safety_night_shift_approvals WHERE status='pending'`);
    const recent_sos       = await query(
      `SELECT s.*, u.full_name FROM safety_sos_events s JOIN users u ON s.user_id=u.user_id
       ORDER BY s.created_at DESC LIMIT 5`
    );
    res.json({
      sos_active: sos_active.n,
      sos_total: sos_total.n,
      complaints_open: complaints_open.n,
      night_shift_pending: night_pending.n,
      recent_sos
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching safety dashboard', error: err.message });
  }
};
