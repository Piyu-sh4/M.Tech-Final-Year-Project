const database = require('../config/db');
const assessment = require('../services/trainingAssessment');
const { query, transaction } = require('../services/database');

const run = (sql, params) => query(database, sql, params);
const fail = (status, message) => Object.assign(new Error(message), { status });

function positiveId(value) {
  const identifier = Number(value);
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(identifier) || identifier < 1)
    throw fail(400, 'Choose a valid course, skill, or enrollment.');
  return identifier;
}

exports.getCourses = async (request, response) => {
  const { category, skill_id } = request.query;
  const params = [request.user.user_id];
  let filter = '';
  if (category) { filter += ' AND course.category=?'; params.push(category); }
  if (skill_id !== undefined) { filter += ' AND resource.skill_id=?'; params.push(positiveId(skill_id)); }
  response.json(await run(`SELECT course.*,skill.skill_name,resource.skill_id,resource.video_url,
    guide.guide AS study_guide, (guide.course_id IS NOT NULL) AS has_study_guide,
    (assessment.course_id IS NOT NULL) AS has_assessment, COALESCE(enrollment.status,'available') status
    FROM training_courses course
    LEFT JOIN training_skill_resources resource ON resource.course_id=course.course_id
    LEFT JOIN training_study_guides guide ON guide.course_id=course.course_id
    LEFT JOIN training_assessments assessment ON assessment.course_id=course.course_id
    LEFT JOIN skills skill ON skill.skill_id=resource.skill_id
    LEFT JOIN training_enrollments enrollment ON enrollment.course_id=course.course_id AND enrollment.user_id=?
    WHERE 1=1 ${filter} ORDER BY course.is_mandatory DESC,course.title`, params));
};

exports.getMyEnrollments = async (request, response) => {
  response.json(await run(`SELECT enrollment.enrollment_id,enrollment.course_id,enrollment.status,enrollment.progress_pct,
    enrollment.score,enrollment.enrolled_at,enrollment.completed_at,course.title,course.category,course.format,
    course.duration_mins,course.is_mandatory,course.provider,course.url,resource.video_url,
    (certificate.enrollment_id IS NOT NULL AND certificate.revoked_at IS NULL) AS has_certificate,
    (guide.course_id IS NOT NULL) AS has_study_guide,
    CASE
      WHEN certificate.revoked_at IS NOT NULL THEN 'Certificate revoked'
      WHEN certificate.enrollment_id IS NOT NULL THEN 'Certificate available'
      WHEN COALESCE(enrollment.progress_pct,0) < 100 THEN 'Finish your coursework'
      WHEN assessment.course_id IS NOT NULL AND result.passed_at IS NULL THEN 'Take the course assessment'
      ELSE 'Waiting for HR or admin to issue certificate'
    END AS next_step,
    (result.passed_at IS NOT NULL) AS assessment_passed,
    (certificate.revoked_at IS NOT NULL) AS certificate_revoked,
    (assessment.course_id IS NOT NULL) AS has_assessment,
    result.best_score AS assessment_score,
    (result.passed_at IS NOT NULL OR certificate.enrollment_id IS NOT NULL) AS progress_locked,
    (assessment.course_id IS NOT NULL AND enrollment.progress_pct=100
      AND result.passed_at IS NULL AND certificate.enrollment_id IS NULL) AS can_take_assessment
    FROM training_enrollments enrollment JOIN training_courses course USING(course_id)
    LEFT JOIN training_skill_resources resource USING(course_id)
    LEFT JOIN training_certificates certificate ON certificate.enrollment_id=enrollment.enrollment_id
    LEFT JOIN training_study_guides guide ON guide.course_id=course.course_id
    LEFT JOIN training_assessments assessment ON assessment.course_id=course.course_id
    LEFT JOIN training_assessment_results result ON result.enrollment_id=enrollment.enrollment_id
    WHERE enrollment.user_id=? ORDER BY enrollment.enrolled_at DESC,enrollment.enrollment_id DESC`, [request.user.user_id]));
};

exports.enroll = async (request, response) => {
  const courseId = positiveId(request.body.course_id);
  const result = await run(`INSERT INTO training_enrollments (user_id,course_id)
    SELECT ?,course_id FROM training_courses WHERE course_id=?
    ON DUPLICATE KEY UPDATE enrollment_id=training_enrollments.enrollment_id`, [request.user.user_id,courseId]);
  if (!result.affectedRows) throw fail(404, 'Course not found.');
  response.json({ message: 'Enrollment is active.' });
};

exports.updateProgress = async (request, response) => {
  const courseId = positiveId(request.params.courseId);
  const rawProgress = request.body.progress_pct;
  const progress = Number(rawProgress);
  if (!/^\d+$/.test(String(rawProgress)) || !Number.isInteger(progress) || progress < 0 || progress > 100)
    throw fail(400, 'Enter progress between 0 and 100 percent.');
  await transaction(async run => {
    // Certificate issuance, withdrawal and progress share the enrollment lock.
    const [enrollment] = await run(`SELECT enrollment_id FROM training_enrollments
      WHERE user_id=? AND course_id=? FOR UPDATE`, [request.user.user_id, courseId]);
    if (!enrollment) throw fail(404, 'Enrollment not found.');
    const [certificate] = await run('SELECT enrollment_id FROM training_certificates WHERE enrollment_id=?', [enrollment.enrollment_id]);
    const [assessmentResult] = await run('SELECT passed_at FROM training_assessment_results WHERE enrollment_id=?', [enrollment.enrollment_id]);
    if (assessmentResult?.passed_at) throw fail(409, 'Progress is locked after you pass the assessment.');
    if (certificate) throw fail(409, 'Progress is locked after a certificate is issued.');
    await run(`UPDATE training_enrollments
      SET progress_pct=?,status=IF(?=100,'completed','in_progress'),
          completed_at=IF(?=100,COALESCE(completed_at,NOW()),NULL)
      WHERE enrollment_id=?`, [progress, progress, progress, enrollment.enrollment_id]);
  });
  response.json({ message: progress === 100 ? 'Completion recorded. See My learning for your next step.' : 'Progress updated.' });
};

exports.withdraw = async (request, response) => {
  const courseId = positiveId(request.params.courseId);
  const result = await run(`DELETE enrollment FROM training_enrollments enrollment
    WHERE enrollment.user_id=? AND enrollment.course_id=? AND enrollment.status IN ('enrolled','in_progress','failed')`,
  [request.user.user_id, courseId]);
  if (!result.affectedRows) throw fail(404, 'No active enrollment is available to withdraw.');
  response.json({ message: 'Enrollment withdrawn.' });
};

exports.getSkills = async (_request, response) => {
  response.json(await run('SELECT skill_id,skill_name FROM skills ORDER BY skill_name'));
};

function optionalResource(value) {
  if (value == null || value === '') return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 255)
      return url.href;
  } catch {
    // Return the same validation message for malformed and unsupported URLs.
  }
  throw fail(400, 'Enter an HTTPS resource link of up to 255 characters.');
}

async function saveCourse(request, identifier) {
  const { title, description, category = 'technical', format = 'video', duration_mins,
    provider, url, is_mandatory, target_grades, skill_id, video_url, study_guide } = request.body;
  const length = Number(duration_mins || 0);
  if (typeof title !== 'string' || !title.trim() || title.length > 200 ||
      !['technical','soft_skills','compliance','leadership','product','security'].includes(category) ||
      !['video','document','quiz','workshop','webinar','external'].includes(format) ||
      !Number.isInteger(length) || length < 0 || length > 100000)
    throw fail(400, 'Enter a valid course title, category, format, and duration.');
  if (provider && (typeof provider !== 'string' || provider.length > 100))
    throw fail(400, 'Enter a provider name of up to 100 characters.');
  if (description && (typeof description !== 'string' || description.length > 1500))
    throw fail(400, 'Enter a description of up to 1,500 characters.');
  const website = optionalResource(url);
  const video = optionalResource(video_url);
  const skillId = skill_id ? positiveId(skill_id) : null;
  if (video && !skillId) throw fail(400, 'Choose a skill for the video link.');
  if (study_guide != null && (typeof study_guide !== 'string' || study_guide.length > 4000))
    throw fail(400, 'Enter a study guide of up to 4,000 characters.');
  return transaction(async run => {
    if (skillId && !(await run('SELECT skill_id FROM skills WHERE skill_id=?', [skillId])).length)
      throw fail(400, 'Choose an existing skill.');
    const values = {
      title: title.trim(), description: description || null, category, format, duration_mins: length,
      provider: provider || null, url: website,
    };
    if (is_mandatory !== undefined) values.is_mandatory = Number(Boolean(Number(is_mandatory)));
    if (target_grades !== undefined) values.target_grades = target_grades || 'all';
    let courseId = identifier;
    if (courseId) {
      if (!(await run('UPDATE training_courses SET ? WHERE course_id=?', [values, courseId])).affectedRows)
        throw fail(404, 'Course not found.');
    } else {
      const created = await run('INSERT INTO training_courses SET ?', [{ ...values, created_by: request.user.user_id }]);
      courseId = created.insertId;
    }
    if (skillId) {
      await run(`INSERT INTO training_skill_resources (course_id,skill_id,video_url) VALUES (?,?,?)
        ON DUPLICATE KEY UPDATE skill_id=VALUES(skill_id),video_url=VALUES(video_url)`, [courseId, skillId, video]);
    } else {
      await run('DELETE FROM training_skill_resources WHERE course_id=?', [courseId]);
    }
    if (study_guide !== undefined) {
      const guide = study_guide?.trim();
      if (guide) {
        await run(`INSERT INTO training_study_guides (course_id,guide) VALUES (?,?)
          ON DUPLICATE KEY UPDATE guide=VALUES(guide)`, [courseId, guide]);
      } else {
        await run('DELETE FROM training_study_guides WHERE course_id=?', [courseId]);
      }
    }
    return courseId;
  });
}

exports.createCourse = async (request, response) => {
  const courseId = await saveCourse(request);
  response.json({ message: 'Course created.', course_id: courseId });
};

exports.updateCourse = async (request, response) => {
  const courseId = await saveCourse(request, positiveId(request.params.courseId));
  response.json({ message: 'Course updated.', course_id: courseId });
};

exports.getAllEnrollments = async (request, response) => {
  response.json(await run(`SELECT e.*,u.full_name,u.email,c.title,c.category,c.is_mandatory,
    (certificate.enrollment_id IS NOT NULL AND certificate.revoked_at IS NULL) AS has_certificate,
    result.best_score AS assessment_score,
    CASE
      WHEN certificate.revoked_at IS NOT NULL THEN 'Certificate revoked'
      WHEN certificate.enrollment_id IS NOT NULL THEN 'Issued'
      WHEN e.status<>'completed' OR COALESCE(e.progress_pct,0)<100 OR e.completed_at IS NULL THEN 'Coursework incomplete'
      WHEN assessment.course_id IS NOT NULL AND result.passed_at IS NULL THEN 'Assessment pending'
      WHEN e.user_id=? THEN 'Another reviewer required'
      ELSE 'Ready to issue'
    END AS certificate_stage,
    (e.status='completed' AND e.progress_pct=100 AND e.completed_at IS NOT NULL
      AND certificate.enrollment_id IS NULL
      AND (assessment.course_id IS NULL OR result.passed_at IS NOT NULL)) AS can_issue
    FROM training_enrollments e JOIN users u ON u.user_id=e.user_id
    JOIN training_courses c ON c.course_id=e.course_id
    LEFT JOIN training_certificates certificate ON certificate.enrollment_id=e.enrollment_id
    LEFT JOIN training_assessments assessment ON assessment.course_id=c.course_id
    LEFT JOIN training_assessment_results result ON result.enrollment_id=e.enrollment_id
    ORDER BY can_issue DESC,c.title,u.full_name`, [request.user.user_id]));
};

exports.issueCertificate = async (request, response) => {
  const identifier = positiveId(request.params.enrollmentId);
  const template = request.body?.template ?? 'classic';
  if (!require('../services/certificateRegister').templates.includes(template)) throw fail(400,'Choose a certificate template.');
  await transaction(async run => {
    const [enrollment] = await run(`SELECT e.*,u.full_name,c.title,assessment.course_id AS assessment_id,result.passed_at
      FROM training_enrollments e
      JOIN users u ON u.user_id=e.user_id JOIN training_courses c ON c.course_id=e.course_id
      LEFT JOIN training_assessments assessment ON assessment.course_id=c.course_id
      LEFT JOIN training_assessment_results result ON result.enrollment_id=e.enrollment_id
      WHERE e.enrollment_id=? FOR UPDATE`, [identifier]);
    if (!enrollment) throw fail(404, 'Enrollment not found.');
    if (enrollment.user_id === request.user.user_id) throw fail(403, 'Ask another reviewer to issue your certificate.');
    if (enrollment.status !== 'completed' || enrollment.progress_pct !== 100 || !enrollment.completed_at)
      throw fail(409, 'Completion must be recorded before issuing a certificate.');
    const [existing] = await run('SELECT revoked_at FROM training_certificates WHERE enrollment_id=?', [identifier]);
    if (existing?.revoked_at) throw fail(409, 'This certificate has been revoked.');
    if (existing) return;
    if (enrollment.assessment_id && !enrollment.passed_at)
      throw fail(409, 'The learner must pass the course assessment before receiving a certificate.');
    await run(`INSERT INTO training_certificates (enrollment_id,issuer_id,learner_name,course_title,template)
      VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE enrollment_id=training_certificates.enrollment_id`,
    [identifier,request.user.user_id,enrollment.full_name,enrollment.title,template]);
  });
  response.json({ message: 'Certificate issued.' });
};

exports.getStats = async (_request, response) => {
  const [summary] = await run(`SELECT COUNT(DISTINCT user_id) AS learners,COUNT(*) AS enrollments,
    SUM(status='completed') AS completions,AVG(score) AS avg_score FROM training_enrollments`);
  const mandatory = await run(`SELECT c.title,COUNT(e.user_id) AS enrolled,SUM(e.status='completed') AS completed
    FROM training_courses c LEFT JOIN training_enrollments e USING(course_id)
    WHERE c.is_mandatory=1 GROUP BY c.course_id`);
  response.json({ ...summary, mandatory_courses: mandatory });
};

let activeCertificates = 0;
async function downloadCertificate(request, response, staff = false) {
  const enrollmentId = positiveId(request.params.enrollmentId);
  const [certificate] = await run(`SELECT certificate.*,course.category FROM training_certificates certificate
    JOIN training_enrollments enrollment USING(enrollment_id) JOIN training_courses course USING(course_id)
    WHERE certificate.enrollment_id=? AND certificate.revoked_at IS NULL
    ${staff ? '' : 'AND enrollment.user_id=?'}`, staff ? [enrollmentId] : [enrollmentId,request.user.user_id]);
  if (!certificate) throw fail(404, 'Certificate not found.');
  if (activeCertificates >= 2) throw fail(503, 'Certificate exports are busy. Try again shortly.');
  activeCertificates++;
  try {
    const pdf = await require('../services/trainingCertificatePdf').renderCertificate(certificate);
    if (request.query.view === '1') response.set('Content-Disposition','inline; filename="training-certificate-' + enrollmentId + '.pdf"');
    else response.attachment('training-certificate-' + enrollmentId + '.pdf');
    response.type('application/pdf').send(pdf);
  } finally {
    activeCertificates--;
  }
}
exports.downloadCertificate = (request,response) => downloadCertificate(request,response);
exports.downloadReviewedCertificate = (request,response) => downloadCertificate(request,response,true);

exports.downloadStudyGuide = async (request, response) => {
  const courseId = positiveId(request.params.courseId);
  const [course] = await run(`SELECT course.title,course.url,guide.guide
    FROM training_courses course JOIN training_study_guides guide USING(course_id) WHERE course.course_id=?`, [courseId]);
  if (!course) throw fail(404, 'This course does not have a study guide.');
  const fields = [['Study guide and practice assignment', course.guide]];
  if (course.url) fields.push(['Course reference', course.url]);
  const pdf = await require('../services/recordPdf').renderRecordPdf(course.title, fields, 'Study guide');
  response.attachment('study-guide-' + courseId + '.pdf').type('application/pdf').send(pdf);
};

exports.publishAssessment = async (request, response) => {
  await assessment.publish(positiveId(request.params.courseId), request.body.questions);
  response.status(201).json({ message: 'Assessment published.' });
};

exports.getAssessment = async (request, response) => {
  response.json(await assessment.read(positiveId(request.params.courseId), request.user.user_id));
};

exports.submitAssessment = async (request, response) => {
  response.json(await assessment.submit(positiveId(request.params.courseId), request.user.user_id, request.body.answers));
};
