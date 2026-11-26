/**
 * hiringController.js — v12.0
 * Full Hiring Pipeline: Job Postings → Candidates → Interviews → Offer Letters → Joining
 * Supports both Fresher & Experienced flows
 */
const db = require('../config/db');
const q  = (sql, p) => new Promise((r, j) => db.query(sql, p || [], (e, res) => e ? j(e) : r(res)));

// ─── JOB POSTINGS ──────────────────────────────────────────────────────────

exports.getJobs = async (req, res) => {
  try {
    const { status, candidate_type, department_id } = req.query;
    let sql = `SELECT jp.*, d.name AS dept_name, u.full_name AS posted_by_name,
      (SELECT COUNT(*) FROM candidates c WHERE c.job_id=jp.job_id) AS total_applicants,
      (SELECT COUNT(*) FROM candidates c WHERE c.job_id=jp.job_id AND c.status='shortlisted') AS shortlisted,
      (SELECT COUNT(*) FROM candidates c WHERE c.job_id=jp.job_id AND c.status='selected') AS selected
      FROM job_postings jp
      LEFT JOIN departments d ON d.dept_id=jp.department_id
      LEFT JOIN users u ON u.user_id=jp.posted_by
      WHERE 1=1`;
    const p = [];
    if (status) { sql += ' AND jp.status=?'; p.push(status); }
    if (candidate_type) { sql += ' AND (jp.candidate_type=? OR jp.candidate_type="both")'; p.push(candidate_type); }
    if (department_id) { sql += ' AND jp.department_id=?'; p.push(department_id); }
    sql += ' ORDER BY jp.created_at DESC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getJob = async (req, res) => {
  try {
    const [job] = await q(`SELECT jp.*, d.name AS dept_name, u.full_name AS posted_by_name
      FROM job_postings jp
      LEFT JOIN departments d ON d.dept_id=jp.department_id
      LEFT JOIN users u ON u.user_id=jp.posted_by
      WHERE jp.job_id=?`, [req.params.id]);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createJob = async (req, res) => {
  try {
    const { title, department_id, location, job_type, candidate_type, min_experience, max_experience,
            min_salary, max_salary, skills_required, description, requirements, benefits, openings, closes_at } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Title and description required' });
    const r = await q(`INSERT INTO job_postings (title,department_id,location,job_type,candidate_type,
      min_experience,max_experience,min_salary,max_salary,skills_required,description,requirements,benefits,
      openings,posted_by,closes_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft')`,
      [title, department_id || null, location || null, job_type || 'full_time', candidate_type || 'both',
       min_experience || 0, max_experience || 50, min_salary || null, max_salary || null,
       skills_required || null, description, requirements || null, benefits || null,
       openings || 1, req.user.user_id, closes_at || null]);
    res.json({ message: 'Job posting created', job_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateJob = async (req, res) => {
  try {
    const fields = ['title','department_id','location','job_type','candidate_type','min_experience',
      'max_experience','min_salary','max_salary','skills_required','description','requirements',
      'benefits','openings','status','closes_at'];
    const updates = [], vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); }
    }
    if (req.body.status === 'active') { updates.push('approved_by=?'); vals.push(req.user.user_id); }
    vals.push(req.params.id);
    await q(`UPDATE job_postings SET ${updates.join(',')} WHERE job_id=?`, vals);
    res.json({ message: 'Job updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteJob = async (req, res) => {
  try {
    await q('UPDATE job_postings SET status="cancelled" WHERE job_id=?', [req.params.id]);
    res.json({ message: 'Job cancelled' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── CANDIDATES ─────────────────────────────────────────────────────────────

exports.getCandidates = async (req, res) => {
  try {
    const { job_id, status, candidate_type, search } = req.query;
    let sql = `SELECT c.*, jp.title AS job_title,
      u.full_name AS referred_by_name,
      (SELECT COUNT(*) FROM interview_rounds ir WHERE ir.candidate_id=c.candidate_id) AS total_rounds,
      (SELECT MAX(ir.round_number) FROM interview_rounds ir WHERE ir.candidate_id=c.candidate_id AND ir.result='pass') AS rounds_passed
      FROM candidates c
      LEFT JOIN job_postings jp ON jp.job_id=c.job_id
      LEFT JOIN users u ON u.user_id=c.referred_by
      WHERE 1=1`;
    const p = [];
    if (job_id) { sql += ' AND c.job_id=?'; p.push(job_id); }
    if (status) { sql += ' AND c.status=?'; p.push(status); }
    if (candidate_type) { sql += ' AND c.candidate_type=?'; p.push(candidate_type); }
    if (search) { sql += ' AND (c.full_name LIKE ? OR c.email LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY c.created_at DESC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCandidate = async (req, res) => {
  try {
    const [c] = await q(`SELECT c.*, jp.title AS job_title, jp.department_id,
      u.full_name AS referred_by_name FROM candidates c
      LEFT JOIN job_postings jp ON jp.job_id=c.job_id
      LEFT JOIN users u ON u.user_id=c.referred_by
      WHERE c.candidate_id=?`, [req.params.id]);
    if (!c) return res.status(404).json({ message: 'Candidate not found' });
    const rounds = await q(`SELECT ir.*, u.full_name AS interviewer_name
      FROM interview_rounds ir LEFT JOIN users u ON u.user_id=ir.interviewer_id
      WHERE ir.candidate_id=? ORDER BY ir.round_number`, [req.params.id]);
    const docs = await q('SELECT * FROM candidate_documents WHERE candidate_id=?', [req.params.id]);
    const [offer] = await q('SELECT * FROM offer_letters WHERE candidate_id=? ORDER BY created_at DESC LIMIT 1', [req.params.id]);
    res.json({ ...c, rounds, documents: docs, offer: offer || null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addCandidate = async (req, res) => {
  try {
    const {
      job_id, full_name, email, phone, dob, gender, current_location, candidate_type,
      // fresher
      college_name, degree, branch, graduation_year, cgpa,
      // experienced
      current_company, current_designation, total_experience, current_ctc, expected_ctc, notice_period,
      // common
      resume_url, linkedin_url, github_url, portfolio_url, cover_letter, source, referred_by
    } = req.body;
    if (!job_id || !full_name || !email || !candidate_type)
      return res.status(400).json({ message: 'job_id, full_name, email, candidate_type required' });
    const r = await q(`INSERT INTO candidates (job_id,full_name,email,phone,dob,gender,current_location,
      candidate_type,college_name,degree,branch,graduation_year,cgpa,
      current_company,current_designation,total_experience,current_ctc,expected_ctc,notice_period,
      resume_url,linkedin_url,github_url,portfolio_url,cover_letter,source,referred_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [job_id, full_name, email, phone || null, dob || null, gender || null, current_location || null,
       candidate_type, college_name || null, degree || null, branch || null, graduation_year || null, cgpa || null,
       current_company || null, current_designation || null, total_experience || 0, current_ctc || null,
       expected_ctc || null, notice_period || 0, resume_url || null, linkedin_url || null,
       github_url || null, portfolio_url || null, cover_letter || null, source || 'portal', referred_by || null]);
    res.json({ message: 'Candidate added', candidate_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status, reject_reason, notes } = req.body;
    await q('UPDATE candidates SET status=?,reject_reason=?,notes=? WHERE candidate_id=?',
      [status, reject_reason || null, notes || null, req.params.id]);
    res.json({ message: 'Candidate status updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── INTERVIEW ROUNDS ────────────────────────────────────────────────────────

exports.getInterviews = async (req, res) => {
  try {
    const { candidate_id, interviewer_id, status } = req.query;
    let sql = `SELECT ir.*, c.full_name AS candidate_name, c.email AS candidate_email,
      c.candidate_type, jp.title AS job_title, u.full_name AS interviewer_name
      FROM interview_rounds ir
      JOIN candidates c ON c.candidate_id=ir.candidate_id
      JOIN job_postings jp ON jp.job_id=ir.job_id
      LEFT JOIN users u ON u.user_id=ir.interviewer_id
      WHERE 1=1`;
    const p = [];
    if (candidate_id) { sql += ' AND ir.candidate_id=?'; p.push(candidate_id); }
    if (interviewer_id) { sql += ' AND ir.interviewer_id=?'; p.push(interviewer_id); }
    if (status) { sql += ' AND ir.status=?'; p.push(status); }
    // Outside HR and administrators, interviewers only see their assignments.
    if (![1, 4].includes(req.user.role_id)) { sql += ' AND ir.interviewer_id=?'; p.push(req.user.user_id); }
    sql += ' ORDER BY ir.scheduled_at ASC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const { candidate_id, job_id, round_number, round_type, round_name, mode,
            interviewer_id, scheduled_at, duration_mins, location } = req.body;
    if (!candidate_id || !round_type || !scheduled_at)
      return res.status(400).json({ message: 'candidate_id, round_type, scheduled_at required' });
    // Get job_id from candidate if not provided
    let jid = job_id;
    if (!jid) { const [c] = await q('SELECT job_id FROM candidates WHERE candidate_id=?',[candidate_id]); jid = c?.job_id; }
    const r = await q(`INSERT INTO interview_rounds (candidate_id,job_id,round_number,round_type,round_name,
      mode,interviewer_id,scheduled_at,duration_mins,location,recorded_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [candidate_id, jid, round_number || 1, round_type, round_name || round_type,
       mode || 'online', interviewer_id || null, scheduled_at, duration_mins || 60,
       location || null, req.user.user_id]);
    // Auto-update candidate status to shortlisted on first round
    await q(`UPDATE candidates SET status='shortlisted' WHERE candidate_id=? AND status='applied'`, [candidate_id]);
    res.json({ message: 'Interview scheduled', round_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.submitInterviewFeedback = async (request, response, next) => {
  const { result, technical_score, communication_score, problem_solving_score,
    overall_score, strengths, weaknesses, feedback, recommendation } = request.body;
  const actor = request.user;
  try {
    const [round] = await q('SELECT interviewer_id FROM interview_rounds WHERE round_id=?', [request.params.id]);
    if (!round || (![1, 4].includes(actor.role_id) && round.interviewer_id !== actor.user_id))
      return response.status(404).json({ message: 'Interview not found.' });

    const scores = [technical_score, communication_score, problem_solving_score, overall_score];
    if (!['pass','fail','on_hold'].includes(result) ||
        scores.some(score => score != null && (!Number.isInteger(score) || score < 0 || score > 100)) ||
        [strengths, weaknesses, feedback].some(text => text != null && (typeof text !== 'string' || text.length > 5000)) ||
        (recommendation != null && !['strongly_recommend','recommend','neutral','not_recommend','strongly_not_recommend'].includes(recommendation)))
      return response.status(400).json({ message: 'Choose an interview result and enter any scores from 0 to 100.' });

    const saved = await q(`UPDATE interview_rounds SET status='completed',result=?,technical_score=?,communication_score=?,
      problem_solving_score=?,overall_score=?,strengths=?,weaknesses=?,feedback=?,recommendation=?
      WHERE round_id=? AND status IN ('scheduled','rescheduled') AND (interviewer_id=? OR ? IN (1,4))`,
    [result, ...scores.map(score => score ?? null), strengths || null,
      weaknesses || null, feedback || null, recommendation || null,
      request.params.id, actor.user_id, actor.role_id]);
    if (!saved.affectedRows) return response.status(409).json({ message: 'Feedback has already been submitted or the interview is closed.' });
    // Hiring staff make the final candidate decision separately from interview feedback.
    response.json({ message: 'Feedback submitted' });
  } catch (error) { next(error); }
};

// ─── OFFER LETTERS ───────────────────────────────────────────────────────────

exports.getOffers = async (req, res) => {
  try {
    const rows = await q(`SELECT ol.*, c.full_name AS candidate_name, c.email AS candidate_email,
      jp.title AS job_title, d.name AS dept_name, u.full_name AS generated_by_name
      FROM offer_letters ol
      JOIN candidates c ON c.candidate_id=ol.candidate_id
      JOIN job_postings jp ON jp.job_id=ol.job_id
      LEFT JOIN departments d ON d.dept_id=ol.department_id
      LEFT JOIN users u ON u.user_id=ol.generated_by
      ORDER BY ol.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.generateOffer = async (req, res) => {
  try {
    const { candidate_id, job_id, designation, department_id, joining_date, offer_ctc,
            basic_salary, hra, allowances, probation_months, work_location, work_mode, offer_valid_till } = req.body;
    if (!candidate_id || !offer_ctc) return res.status(400).json({ message: 'candidate_id and offer_ctc required' });
    const r = await q(`INSERT INTO offer_letters (candidate_id,job_id,designation,department_id,joining_date,
      offer_ctc,basic_salary,hra,allowances,probation_months,work_location,work_mode,offer_valid_till,generated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [candidate_id, job_id, designation, department_id || null, joining_date || null,
       offer_ctc, basic_salary || null, hra || null, allowances || null,
       probation_months || 3, work_location || null, work_mode || 'onsite',
       offer_valid_till || null, req.user.user_id]);
    // Mark candidate status
    await q(`UPDATE candidates SET status='offer_sent' WHERE candidate_id=?`, [candidate_id]);
    res.json({ message: 'Offer letter generated', offer_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateOfferStatus = async (req, res) => {
  try {
    const { status, decline_reason } = req.body;
    const now = new Date();
    let extra = '', extras = [];
    if (status === 'accepted') { extra = ',accepted_at=?'; extras = [now]; }
    if (status === 'declined') { extra = ',declined_at=?'; extras = [now]; }
    await q(`UPDATE offer_letters SET status=?,decline_reason=?${extra} WHERE offer_id=?`,
      [status, decline_reason || null, ...extras, req.params.id]);
    // Sync candidate status
    const statusMap = { accepted:'offer_accepted', declined:'offer_declined', sent:'offer_sent' };
    if (statusMap[status]) {
      const [ol] = await q('SELECT candidate_id FROM offer_letters WHERE offer_id=?', [req.params.id]);
      if (ol) await q('UPDATE candidates SET status=? WHERE candidate_id=?', [statusMap[status], ol.candidate_id]);
    }
    res.json({ message: 'Offer status updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── EMPLOYEE REFERRALS ──────────────────────────────────────────────────────

exports.getMyReferrals = async (req, res) => {
  try {
    const rows = await q(`SELECT er.*, jp.title AS job_title, c.status AS candidate_status
      FROM employee_referrals er LEFT JOIN job_postings jp ON jp.job_id=er.job_id
      LEFT JOIN candidates c ON c.candidate_id=er.candidate_id
      WHERE er.referred_by=? ORDER BY er.created_at DESC`, [req.user.user_id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllReferrals = async (req, res) => {
  try {
    const rows = await q(`SELECT er.*, jp.title AS job_title, u.full_name AS referred_by_name,
      c.status AS candidate_status FROM employee_referrals er
      LEFT JOIN job_postings jp ON jp.job_id=er.job_id
      LEFT JOIN users u ON u.user_id=er.referred_by
      LEFT JOIN candidates c ON c.candidate_id=er.candidate_id
      ORDER BY er.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.submitReferral = async (req, res) => {
  try {
    const { job_id, referral_name, referral_email, referral_phone, relationship, cover_note } = req.body;
    if (!job_id || !referral_name || !referral_email) return res.status(400).json({ message: 'job_id, name, email required' });
    const r = await q(`INSERT INTO employee_referrals (referred_by,job_id,referral_name,referral_email,referral_phone,relationship,cover_note)
      VALUES (?,?,?,?,?,?,?)`,
      [req.user.user_id, job_id, referral_name, referral_email, referral_phone || null, relationship || null, cover_note || null]);
    res.json({ message: 'Referral submitted successfully', referral_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

exports.getCandidateDocs = async (req, res) => {
  try {
    res.json(await q('SELECT * FROM candidate_documents WHERE candidate_id=?', [req.params.id]));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.uploadDoc = async (req, res) => {
  try {
    const { candidate_id, doc_type, doc_name, file_url } = req.body;
    await q(`INSERT INTO candidate_documents (candidate_id,doc_type,doc_name,file_url) VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE doc_name=VALUES(doc_name),file_url=VALUES(file_url),status='uploaded'`,
      [candidate_id, doc_type, doc_name || doc_type, file_url]);
    res.json({ message: 'Document uploaded' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.verifyDoc = async (req, res) => {
  try {
    const { status, reject_reason } = req.body;
    await q('UPDATE candidate_documents SET status=?,verified_by=?,verified_at=NOW(),reject_reason=? WHERE doc_id=?',
      [status, req.user.user_id, reject_reason || null, req.params.docId]);
    res.json({ message: 'Document status updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── HIRING DASHBOARD STATS ──────────────────────────────────────────────────

exports.getHiringStats = async (req, res) => {
  try {
    const [jobs]       = await q(`SELECT COUNT(*) AS total, SUM(status='active') AS active, SUM(status='closed') AS closed FROM job_postings`);
    const [candidates] = await q(`SELECT COUNT(*) AS total, SUM(status='applied') AS applied, SUM(status='shortlisted') AS shortlisted,
      SUM(status='selected') AS selected, SUM(status='rejected') AS rejected, SUM(status='joined') AS joined,
      SUM(candidate_type='fresher') AS freshers, SUM(candidate_type='experienced') AS experienced FROM candidates`);
    const [interviews] = await q(`SELECT COUNT(*) AS total, SUM(status='scheduled') AS upcoming, SUM(result='pass') AS passed, SUM(result='fail') AS failed FROM interview_rounds`);
    const [offers]     = await q(`SELECT COUNT(*) AS total, SUM(status='sent') AS sent, SUM(status='accepted') AS accepted, SUM(status='declined') AS declined FROM offer_letters`);
    const pipeline     = await q(`SELECT jp.title, COUNT(c.candidate_id) AS total,
      SUM(c.status='applied') AS applied, SUM(c.status='shortlisted') AS shortlisted,
      SUM(c.status='selected') AS selected, SUM(c.status='joined') AS joined
      FROM job_postings jp LEFT JOIN candidates c ON c.job_id=jp.job_id
      WHERE jp.status='active' GROUP BY jp.job_id ORDER BY total DESC LIMIT 5`);
    res.json({ jobs, candidates, interviews, offers, pipeline });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
