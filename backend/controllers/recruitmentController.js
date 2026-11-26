/**
 * recruitmentController.js — v12.0
 * Requisitions, Candidates, Interviews, Offers, Onboarding Tasks
 */
const db = require('../config/db');
const q = (sql, p) => new Promise((r, j) => db.query(sql, p||[], (e,res) => e ? j(e) : r(res)));

exports.getRequisitions = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT jr.*, d.name AS dept_name, u.full_name AS requested_by_name,
      COUNT(c.candidate_id) AS applicant_count
      FROM job_requisitions jr
      LEFT JOIN departments d ON d.dept_id=jr.department_id
      LEFT JOIN users u ON u.user_id=jr.requested_by
      LEFT JOIN candidates c ON c.job_id=jr.requisition_id
      WHERE 1=1`;
    const p = [];
    if (status) { sql += ' AND jr.status=?'; p.push(status); }
    sql += ' GROUP BY jr.requisition_id ORDER BY jr.created_at DESC';
    res.json(await q(sql, p));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createRequisition = async (req, res) => {
  try {
    const { title, department_id, positions, reason, expected_start, job_level, budget_ctc } = req.body;
    if (!title || !department_id) return res.status(400).json({ message: 'title and department required' });
    const r = await q(
      `INSERT INTO job_requisitions (title, department_id, positions, reason,
        expected_start, job_level, budget_ctc, requested_by, status)
       VALUES (?,?,?,?,?,?,?,?,'pending')`,
      [title, department_id, positions||1, reason||null, expected_start||null,
       job_level||null, budget_ctc||null, req.user.user_id]
    );
    res.json({ message: 'Requisition created', requisition_id: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateRequisitionStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    await q(
      'UPDATE job_requisitions SET status=?, review_note=?, reviewed_by=?, reviewed_at=NOW() WHERE requisition_id=?',
      [status, note||null, req.user.user_id, req.params.id]
    );
    res.json({ message: 'Requisition updated' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ATS Resume Scoring
exports.scoreResumeText = async (req, res) => {
  try {
    const { resume_text, job_id } = req.body;
    if (!resume_text) return res.status(400).json({ message: 'resume_text required' });
    const [job] = job_id ? await q('SELECT skills_required, description FROM job_postings WHERE job_id=?', [job_id]) : [null];
    const skills = (job?.skills_required || 'JavaScript,Python,SQL,React,Node.js').split(',').map(s => s.trim().toLowerCase());
    const resumeLower = resume_text.toLowerCase();
    const matched = skills.filter(s => resumeLower.includes(s));
    const keywordScore = skills.length ? Math.round((matched.length / skills.length) * 40) : 20;
    const hasEmail = /[\w.]+@[\w.]+/.test(resume_text) ? 10 : 0;
    const hasPhone = /[6-9]\d{9}/.test(resume_text) ? 10 : 0;
    const hasEducation = /b\.?tech|m\.?tech|mba|bsc|msc|degree|university|college/i.test(resume_text) ? 15 : 0;
    const hasExperience = /experience|worked|years|employer|company/i.test(resume_text) ? 15 : 0;
    const hasProjects = /project|built|developed|created|designed/i.test(resume_text) ? 10 : 0;
    const total = Math.min(100, keywordScore + hasEmail + hasPhone + hasEducation + hasExperience + hasProjects);
    res.json({
      ats_score: total,
      grade: total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D',
      breakdown: { keyword_match: keywordScore, contact_info: hasEmail + hasPhone,
        education: hasEducation, experience: hasExperience, projects: hasProjects },
      matched_skills: matched,
      missing_skills: skills.filter(s => !matched.includes(s)),
      recommendation: total >= 70 ? 'Strong candidate — shortlist' : total >= 50 ? 'Average — consider' : 'Weak match — skip'
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Resume Templates
exports.getResumeTemplates = async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Classic Professional', category: 'experienced', description: 'Clean single-column format', preview_color: '#1e293b' },
      { id: 2, name: 'Modern Two-Column', category: 'experienced', description: 'Modern sidebar layout', preview_color: '#0891b2' },
      { id: 3, name: 'Fresher Template', category: 'fresher', description: 'Academic focus with project highlights', preview_color: '#7c3aed' },
      { id: 4, name: 'Tech Template', category: 'both', description: 'Skills-first layout for developers', preview_color: '#059669' },
      { id: 5, name: 'Minimal', category: 'both', description: 'Clean minimalist design', preview_color: '#dc2626' }
    ]);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getTemplateForJob = async (req, res) => {
  try {
    const [job] = await q('SELECT candidate_type, skills_required FROM job_postings WHERE job_id=?', [req.params.job_id]);
    const template = !job ? 1 : job.candidate_type === 'fresher' ? 3 : job.skills_required?.includes('React') || job.skills_required?.includes('Python') ? 4 : 1;
    res.json({ recommended_template_id: template, job_type: job?.candidate_type || 'both' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Interview Prep Notes
exports.getPrepNotes = async (req, res) => {
  try {
    const { round_type, job_id } = req.query;
    const [job] = job_id ? await q('SELECT title, skills_required FROM job_postings WHERE job_id=?', [job_id]) : [null];
    const notes = {
      screening: ['Research the company thoroughly', 'Prepare 60-second elevator pitch', 'Have your resume ready', 'Know your salary expectation'],
      technical: ['Practice coding on whiteboard/paper', 'Revise data structures & algorithms', `Focus on: ${job?.skills_required || 'core skills'}`, 'Prepare project walkthroughs', 'Review system design basics'],
      hr: ['Prepare STAR-format answers', 'Know your strengths/weaknesses', 'Research company culture', 'Prepare questions to ask', 'Be ready for salary negotiation'],
      managerial: ['Prepare leadership examples', 'Know your career goals', 'Be ready for situational questions', 'Show business acumen'],
      final: ['Comprehensive review of all rounds', 'Clear offer/joining expectations', 'Background check documents ready']
    };
    res.json({
      round_type,
      job_title: job?.title,
      preparation_tips: notes[round_type] || notes.screening,
      common_questions: {
        screening: ['Tell me about yourself', 'Why this company?', 'Current/expected CTC?', 'Notice period?'],
        technical: ['Explain your architecture choices', 'How do you handle performance issues?', 'Code a [data structure]', 'Debug this code snippet'],
        hr: ['Greatest strength/weakness?', 'Where do you see yourself in 5 years?', 'Describe a conflict and how you resolved it'],
        managerial: ['Describe your management style', 'How do you handle underperforming team members?'],
        final: ['Any questions for us?', 'When can you join?', 'Salary expectations?']
      }[round_type] || []
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// Joining Letters
exports.generateJoiningLetter = async (req, res) => {
  try {
    const { candidate_id, joining_date, reporting_manager, probation_months } = req.body;
    const [c] = await q(
      `SELECT c.*, jp.title, d.name AS dept_name FROM candidates c
       LEFT JOIN job_postings jp ON jp.job_id=c.job_id
       LEFT JOIN departments d ON d.dept_id=jp.department_id
       WHERE c.candidate_id=?`, [candidate_id]
    );
    if (!c) return res.status(404).json({ message: 'Candidate not found' });
    const letter = {
      ref: `JL-${Date.now()}`,
      candidate_name: c.full_name,
      position: c.job_title || c.designation,
      department: c.dept_name,
      joining_date,
      reporting_manager: reporting_manager || 'TBD',
      probation: probation_months || 3,
      content: `Dear ${c.full_name}, We are pleased to offer you the position of ${c.designation || c.title} in our ${c.dept_name} department. Your date of joining will be ${joining_date}. Your probation period will be ${probation_months || 3} months. Please report to ${reporting_manager || 'HR'} on your first day.`,
      generated_at: new Date()
    };
    await q(
      `UPDATE candidates SET status='joining_letter_sent', joining_date=? WHERE candidate_id=?`,
      [joining_date, candidate_id]
    );
    await q(
      `INSERT INTO joining_letters (candidate_id, ref_number, content_json, generated_by)
       VALUES (?,?,?,?)`,
      [candidate_id, letter.ref, JSON.stringify(letter), req.user.user_id]
    );
    res.json({ message: 'Joining letter generated', letter });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getJoiningLetters = async (req, res) => {
  try {
    res.json(await q(
      `SELECT jl.*, c.full_name AS candidate_name, c.email FROM joining_letters jl
       JOIN candidates c ON c.candidate_id=jl.candidate_id
       ORDER BY jl.generated_at DESC`
    ));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.acknowledgeJoiningLetter = async (req, res) => {
  try {
    const result = await q(
      `UPDATE joining_letters letter JOIN candidates candidate ON candidate.candidate_id=letter.candidate_id
       SET letter.acknowledged=1, letter.acknowledged_at=COALESCE(letter.acknowledged_at,NOW())
       WHERE letter.letter_id=? AND candidate.email=?`,
      [req.params.id, req.user.email]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Joining letter not found.' });
    res.json({ message: 'Joining letter acknowledged' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markJoined = async (req, res) => {
  try {
    const { candidate_id, actual_joining_date } = req.body;
    await q('UPDATE candidates SET status="joined", actual_joining_date=? WHERE candidate_id=?',
      [actual_joining_date || new Date().toISOString().split('T')[0], candidate_id]);
    res.json({ message: 'Candidate marked as joined' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getHiringFunnel = async (req, res) => {
  try {
    const funnel = await q(
      `SELECT jp.job_id, jp.title,
        COUNT(c.candidate_id) AS total,
        SUM(c.status='applied') AS applied,
        SUM(c.status='shortlisted') AS shortlisted,
        SUM(c.status IN ('selected','offer_sent','offer_accepted')) AS selected,
        SUM(c.status='joined') AS joined,
        SUM(c.candidate_type='fresher') AS freshers,
        SUM(c.candidate_type='experienced') AS experienced
       FROM job_postings jp LEFT JOIN candidates c ON c.job_id=jp.job_id
       WHERE jp.status='active' GROUP BY jp.job_id ORDER BY total DESC LIMIT 10`
    );
    const [overall] = await q(
      `SELECT COUNT(*) AS total, SUM(status='applied') AS applied,
        SUM(status='shortlisted') AS shortlisted, SUM(status='selected') AS selected,
        SUM(status='offer_accepted') AS offers_accepted, SUM(status='joined') AS joined
       FROM candidates`
    );
    res.json({ overall, by_job: funnel });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
