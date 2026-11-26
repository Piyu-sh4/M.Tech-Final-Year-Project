const database = require('../config/db');
const { query, transaction } = require('./database');

const passingPercentage = 80;
const assessmentError = (status, message) => Object.assign(new Error(message), { status });

async function ensure(connection) {
  await query(connection, `CREATE TABLE IF NOT EXISTS training_assessments (
    course_id INT PRIMARY KEY,
    questions JSON NOT NULL,
    FOREIGN KEY (course_id) REFERENCES training_courses(course_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await query(connection, `CREATE TABLE IF NOT EXISTS training_assessment_results (
    enrollment_id INT PRIMARY KEY,
    best_score TINYINT UNSIGNED NOT NULL,
    passed_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(enrollment_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 15 || questions.length > 20)
    throw assessmentError(400, 'Include between 15 and 20 questions.');
  const validText = (value, max) => typeof value === 'string' && value.trim() && value.length <= max;
  const validated = questions.map(question => {
    if (!validText(question?.prompt, 400) || !Array.isArray(question.choices) ||
        question.choices.length !== 4 || !question.choices.every(choice => validText(choice, 200)) ||
        new Set(question.choices.map(choice => choice.trim().toLowerCase())).size !== 4 ||
        !Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3)
      throw assessmentError(400, 'Each question needs a prompt, four distinct options, and one correct answer.');
    return { prompt: question.prompt.trim(), choices: question.choices.map(choice => choice.trim()), correct: question.correct };
  });
  if (new Set(validated.map(question => question.prompt.toLowerCase())).size !== validated.length)
    throw assessmentError(400, 'Use a distinct prompt for every question.');
  return validated;
}

async function publish(courseId, questions) {
  const validated = validateQuestions(questions);
  await transaction(async run => {
    const [course] = await run('SELECT course_id FROM training_courses WHERE course_id=? FOR UPDATE', [courseId]);
    if (!course) throw assessmentError(404, 'Course not found.');
    const [published] = await run('SELECT course_id FROM training_assessments WHERE course_id=?', [courseId]);
    if (published) throw assessmentError(409, 'This course already has a published assessment.');
    await run('INSERT INTO training_assessments (course_id,questions) VALUES (?,?)', [courseId, JSON.stringify(validated)]);
  });
}

async function learningAssessment(run, courseId, userId, lock = false) {
  const [enrollment] = await run(`SELECT enrollment.enrollment_id,enrollment.progress_pct,assessment.questions,
    result.passed_at,certificate.enrollment_id AS certificate_id
    FROM training_enrollments enrollment JOIN training_assessments assessment USING(course_id)
    LEFT JOIN training_assessment_results result USING(enrollment_id)
    LEFT JOIN training_certificates certificate USING(enrollment_id)
    WHERE enrollment.course_id=? AND enrollment.user_id=?${lock ? ' FOR UPDATE' : ''}`, [courseId, userId]);
  if (!enrollment) throw assessmentError(404, 'Assessment not found for your enrollment.');
  if (enrollment.progress_pct !== 100) throw assessmentError(409, 'Record 100% learning progress to unlock the assessment.');
  if (enrollment.passed_at || enrollment.certificate_id) throw assessmentError(409, 'You have already satisfied this assessment.');
  return enrollment;
}

async function read(courseId, userId) {
  const enrollment = await learningAssessment((sql, params) => query(database, sql, params), courseId, userId);
  const questions = JSON.parse(enrollment.questions).map(({ prompt, choices }) => ({ prompt, choices }));
  return { passing_percentage: passingPercentage, questions };
}

async function submit(courseId, userId, answers) {
  return transaction(async run => {
    const enrollment = await learningAssessment(run, courseId, userId, true);
    const questions = JSON.parse(enrollment.questions);
    if (!Array.isArray(answers) || answers.length !== questions.length ||
        !answers.every(answer => Number.isInteger(answer) && answer >= 0 && answer < 4))
      throw assessmentError(400, 'Choose one answer for every question.');
    const correct = questions.filter((question, index) => question.correct === answers[index]).length;
    const score = Math.floor(correct * 100 / questions.length);
    const passed = score >= passingPercentage;
    await run(`INSERT INTO training_assessment_results (enrollment_id,best_score,passed_at)
      VALUES (?,?,IF(?,CURRENT_TIMESTAMP,NULL))
      ON DUPLICATE KEY UPDATE best_score=GREATEST(best_score,VALUES(best_score)),
      passed_at=COALESCE(passed_at,VALUES(passed_at))`, [enrollment.enrollment_id, score, passed]);
    return { score, passed, message: passed ? 'Assessment passed. HR can now review your certificate.' :
      'Assessment score: ' + score + '%. Review the course material and try again.' };
  });
}

module.exports = { ensure, publish, read, submit };
