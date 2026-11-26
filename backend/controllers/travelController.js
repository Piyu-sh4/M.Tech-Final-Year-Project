/**
 * travelController.js — v12.0
 * Travel Requests, Expense Claims, Reimbursement Batches
 */
const db = require('../config/db');
const { transaction } = require('../services/database');
const { fail, teamReadScope, requireIndependentReviewer, decisionId, cancelOwnedRequest } = require('../services/workforceDecisions');
const { isISODate } = require('../services/validation');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p||[], (e,res) => e ? j(e) : r(res)));

// ── TRAVEL REQUESTS ──────────────────────────────────────────────────────────
exports.getMyTravelRequests = async (req, res) => {
  try {
    const rows = await q(
      `SELECT tr.*, u.full_name AS approved_by_name FROM travel_requests tr
       LEFT JOIN users u ON u.user_id=tr.approved_by
       WHERE tr.user_id=? ORDER BY tr.created_at DESC`, [req.user.user_id]
    );
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllTravelRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT tr.*, u.full_name, u.employee_id FROM travel_requests tr
      JOIN users u ON u.user_id=tr.user_id WHERE 1=1`;
    const scope = teamReadScope(req.user);
    sql += scope.sql;
    const p = scope.params;
    if (status) { sql += ' AND tr.status=?'; p.push(status); }
    sql += ' ORDER BY tr.travel_date ASC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createTravelRequest = async (req, res, next) => {
  try {
    const { travel_type, from_location, to_location, travel_date, return_date,
      purpose, estimated_cost = 0, mode_of_travel = 'flight', accommodation_required, notes } = req.body;
    const cost = Number(estimated_cost);
    if (!['domestic','international'].includes(travel_type) ||
        [from_location, to_location, purpose].some(value => typeof value !== 'string' || !value.trim()) ||
        from_location.length > 150 || to_location.length > 150 || purpose.length > 1500 ||
        !isISODate(travel_date) || (return_date && (!isISODate(return_date) || return_date < travel_date)) ||
        !Number.isFinite(cost) || cost < 0 || cost > 99999999.99 ||
        !['flight','train','bus','car','other'].includes(mode_of_travel) ||
        (notes != null && (typeof notes !== 'string' || notes.length > 1500)))
      fail(400, 'Enter a valid destination, dates, purpose and travel estimate.');
    const result = await q(`INSERT INTO travel_requests (user_id,travel_type,from_location,to_location,
      travel_date,return_date,purpose,estimated_cost,mode_of_travel,accommodation_required,notes,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')`,
    [req.user.user_id,travel_type,from_location,to_location,travel_date,return_date||null,purpose,cost,
      mode_of_travel,accommodation_required ? 1 : 0,notes || null]);
    res.json({ message: 'Travel request submitted', request_id: result.insertId });
  } catch (error) { next(error); }
};

exports.reviewTravelRequest = async (req, res, next) => {
  try {
    const id = decisionId(req.params.id);
    const { action, note, approved_amount } = req.body;
    if (!['approve','reject'].includes(action) || (note != null && (typeof note !== 'string' || note.length > 1500)))
      fail(400, 'Choose a valid travel decision.');
    const status = action === 'approve' ? 'approved' : 'rejected';
    await transaction(async run => {
      const [record] = await run(`SELECT t.user_id,t.status,t.estimated_cost,u.reporting_manager_id
        FROM travel_requests t JOIN users u ON u.user_id=t.user_id WHERE t.request_id=? FOR UPDATE`, [id]);
      if (!record) fail(404, 'Travel request not found.');
      requireIndependentReviewer(req.user, record);
      if (record.status !== 'pending') fail(409, 'Only a pending travel request can be reviewed.');
      const amount = Number(approved_amount ?? record.estimated_cost);
      if (status === 'approved' && (!Number.isFinite(amount) || amount < 0 || amount > Number(record.estimated_cost)))
        fail(400, 'Approved amount must be within the travel estimate.');
      await run(`UPDATE travel_requests SET status=?,approved_by=?,review_note=?,approved_amount=?,reviewed_at=NOW()
        WHERE request_id=?`, [status,req.user.user_id,note || null,status === 'approved' ? amount : null,id]);
    });
    res.json({ message: 'Travel request ' + status });
  } catch (error) { next(error); }
};

exports.cancelTravelRequest = async (req, res, next) => {
  try {
    await cancelOwnedRequest(req.user, decisionId(req.params.id),
      'SELECT status FROM travel_requests WHERE request_id=? AND user_id=? FOR UPDATE',
      "UPDATE travel_requests SET status='cancelled' WHERE request_id=?");
    res.json({ message: 'Travel request cancelled.' });
  } catch (error) { next(error); }
};

// ── EXPENSE CLAIMS ───────────────────────────────────────────────────────────
exports.getMyExpenses = async (req, res) => {
  try {
    const rows = await q(
      `SELECT ec.*,COALESCE(ec.expense_date,ec.claim_date) expense_date, tr.to_location AS trip_destination, tr.travel_date
       FROM expense_claims ec
       LEFT JOIN travel_requests tr ON tr.request_id=ec.travel_request_id
       WHERE ec.user_id=? ORDER BY ec.created_at DESC`, [req.user.user_id]
    );
    res.json(rows.map(row => ({...row,full_name:req.user.full_name})));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const { status, month, year } = req.query;
    let sql = `SELECT ec.*,COALESCE(ec.expense_date,ec.claim_date) expense_date, u.full_name, u.employee_id FROM expense_claims ec
      JOIN users u ON u.user_id=ec.user_id WHERE 1=1`;
    const p = [];
    if (req.user.role_id === 3) {
      sql += ' AND (ec.user_id=? OR u.reporting_manager_id=?)';
      p.push(req.user.user_id, req.user.user_id);
    }
    if (status) { sql += ' AND ec.status=?'; p.push(status); }
    if (month)  { sql += ' AND MONTH(COALESCE(ec.expense_date,ec.claim_date))=?'; p.push(month); }
    if (year)   { sql += ' AND YEAR(COALESCE(ec.expense_date,ec.claim_date))=?';  p.push(year); }
    sql += ' ORDER BY ec.created_at DESC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.submitExpenseClaim = async (req, res) => {
  try {
    const { travel_request_id, expense_date, category, description,
            amount, currency, receipt_url, notes } = req.body;
    if (!expense_date || !category || !amount)
      return res.status(400).json({ message: 'date, category, amount required' });
    const hasTravel = travel_request_id != null && travel_request_id !== '';
    const travelId = hasTravel ? Number(travel_request_id) : null;
    if (hasTravel && (!Number.isSafeInteger(travelId) || travelId < 1))
      return res.status(400).json({ message: 'Choose a valid travel request.' });
    const r = await q(
      `INSERT INTO expense_claims (user_id, travel_request_id, expense_date, claim_date, category,
        description, amount, currency, receipt_url, notes, status)
       SELECT ?,?,?,?,?,?,?,?,?,?,'pending'
       WHERE ? IS NULL OR EXISTS (SELECT 1 FROM travel_requests WHERE request_id=? AND user_id=? )`,
      [req.user.user_id, travelId, expense_date, expense_date, category,
       description||null, amount, currency||'INR', receipt_url||null, notes||null, travelId, travelId, req.user.user_id]
    );
    if (!r.affectedRows) return res.status(404).json({ message: 'Travel request unavailable.' });
    res.json({ message: 'Expense claim submitted', claim_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.reviewExpenseClaim = require('../services/expenseReview').review;

// ── REIMBURSEMENT BATCHES ────────────────────────────────────────────────────
exports.getReimbursementBatches = async (req, res) => {
  try {
    res.json(await q(
      `SELECT rb.*, COUNT(rbi.item_id) AS claim_count,
        SUM(ec.approved_amount) AS total_amount
       FROM reimbursement_batches rb
       LEFT JOIN reimbursement_batch_items rbi ON rbi.batch_id=rb.batch_id
       LEFT JOIN expense_claims ec ON ec.claim_id=rbi.claim_id
       GROUP BY rb.batch_id ORDER BY rb.created_at DESC`
    ));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createReimbursementBatch = async (request,response,next) => {
  try {
    const {batch_name,claim_ids,payment_date} = request.body;
    if (!Array.isArray(claim_ids) || !claim_ids.length || !claim_ids.every(id=>Number.isSafeInteger(Number(id)) && Number(id)>0))
      return response.status(400).json({message:'Choose approved claims.'});
    const ids = [...new Set(claim_ids.map(Number))].sort((a,b)=>a-b);
    const batch = await require('../services/database').transaction(async run => {
      const claims = await run('SELECT claim_id,status,user_id FROM expense_claims WHERE claim_id IN (?) ORDER BY claim_id FOR UPDATE',[ids]);
      if (claims.length !== ids.length || claims.some(claim=>claim.status !== 'approved' || claim.user_id === request.user.user_id))
        throw Object.assign(new Error('Choose approved claims belonging to other employees.'),{status:409});
      const assigned = await run('SELECT claim_id FROM reimbursement_batch_items WHERE claim_id IN (?)',[ids]);
      if (assigned.length) throw Object.assign(new Error('A selected claim already belongs to a batch.'),{status:409});
      const result = await run("INSERT INTO reimbursement_batches(batch_name,payment_date,created_by,status) VALUES (?,?,?,'created')",
        [batch_name || 'Reimbursement batch',payment_date || null,request.user.user_id]);
      await run('INSERT INTO reimbursement_batch_items(batch_id,claim_id) VALUES ?', [ids.map(id=>[result.insertId,id])]);
      return result.insertId;
    });
    response.json({message:'Reimbursement batch created',batch_id:batch});
  } catch(error){next(error);}
};

exports.processBatch = async (request,response,next) => {
  try {
    await require('../services/database').transaction(async run => {
      const [batch] = await run('SELECT status FROM reimbursement_batches WHERE batch_id=? FOR UPDATE',[request.params.id]);
      if (!batch || batch.status !== 'created') throw Object.assign(new Error('Choose an unprocessed batch.'),{status:409});
      const claims = await run('SELECT c.claim_id,c.user_id,c.status FROM expense_claims c JOIN reimbursement_batch_items i ON c.claim_id=i.claim_id WHERE i.batch_id=? FOR UPDATE',[request.params.id]);
      if (!claims.length || claims.some(c=>c.status !== 'approved' || c.user_id === request.user.user_id))
        throw Object.assign(new Error('Batch contains an ineligible claim.'),{status:409});
      await run("UPDATE expense_claims SET status='paid',paid_on=CURRENT_DATE WHERE claim_id IN (?)",[claims.map(c=>c.claim_id)]);
      await run("UPDATE reimbursement_batches SET status='processed',payment_reference=?,processed_at=NOW() WHERE batch_id=?",[request.body.payment_reference || null,request.params.id]);
    });
    response.json({message:'Batch processed and claims marked paid'});
  } catch(error){next(error);}
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();
    const [totals] = await q(
      `SELECT COUNT(*) AS total_claims, SUM(amount) AS total_submitted,
        SUM(approved_amount) AS total_approved,
        SUM(status='pending') AS pending, SUM(status='approved') AS approved,
        SUM(status='rejected') AS rejected, SUM(status='paid') AS reimbursed
       FROM expense_claims WHERE MONTH(COALESCE(expense_date,claim_date))=? AND YEAR(COALESCE(expense_date,claim_date))=?`, [m, y]
    );
    const byCategory = await q(
      `SELECT category, COUNT(*) AS count, SUM(amount) AS total
       FROM expense_claims WHERE MONTH(COALESCE(expense_date,claim_date))=? AND YEAR(COALESCE(expense_date,claim_date))=?
       GROUP BY category ORDER BY total DESC`, [m, y]
    );
    res.json({ period: `${m}/${y}`, ...totals, by_category: byCategory });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
