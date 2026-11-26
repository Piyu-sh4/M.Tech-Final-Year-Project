const request = require('supertest');
const app = require('../backend/app');
const database = require('../backend/config/db');
const { query } = require('../backend/services/database');

const headers = {};
beforeAll(async () => {
  for (const [role, email] of Object.entries({
    learner: 'employee@wfintelligence.com',
    reviewer: 'hr@wfintelligence.com',
    admin: 'admin@wip.com',
  })) {
    const login = await request(app).post('/api/auth/login').send({ email, password: 'P123/' }).expect(200);
    headers[role] = { Authorization: 'Bearer ' + login.body.token };
  }
});
afterAll(() => new Promise(resolve => database.end(resolve)));

test('the skills matrix points to matching course resources and current enrollment', async () => {
  const [skill] = await query(database, "SELECT skill_id FROM skills WHERE skill_name='JavaScript'");
  const course = (await request(app).get('/api/training/courses').query({ skill_id: skill.skill_id })
    .set(headers.learner).expect(200)).body.find(item => item.title === 'JavaScript foundations');
  expect(course).toMatchObject({ skill_name: 'JavaScript', status: 'available' });
  expect(course.video_url).toMatch(/^https:\/\/www\.youtube\.com\//);
  expect(course.url).toMatch(/^https:\/\/developer\.mozilla\.org\//);
  await request(app).get('/api/training/courses?skill_id=invalid').set(headers.learner).expect(400);
});

test('training enrollment and certificate issuance use the learner and independent reviewer roles', async () => {
  const path = '/api/training';
  const fixture = { title: 'Training approval fixture', category: 'technical', format: 'video' };
  await request(app).post(path + '/courses').set(headers.learner).send(fixture).expect(403);
  await request(app).post(path + '/courses').set(headers.reviewer)
    .send({ ...fixture, url: 'http://example.test/' }).expect(400);
  const { course_id: course } = (await request(app).post(path + '/courses').set(headers.reviewer).send(fixture).expect(200)).body;
  try {
    await request(app).patch(path + '/courses/' + course).set(headers.reviewer)
      .send({ ...fixture, title: 'Updated training fixture' }).expect(200);
    for (const role of ['learner', 'reviewer']) {
      await request(app).post(path + '/enroll').set(headers[role]).send({ course_id: course }).expect(200);
      await request(app).post(path + '/enroll').set(headers[role]).send({ course_id: course }).expect(200);
    }
    const myTraining = async role => (await request(app).get(path + '/my').set(headers[role]).expect(200)).body
      .filter(item => item.course_id === course);
    const [learner] = await myTraining('learner');
    const [reviewer] = await myTraining('reviewer');
    expect(await myTraining('learner')).toHaveLength(1);
    expect(learner.title).toBe('Updated training fixture');
    const certificate = path + '/certificates/' + learner.enrollment_id;
    await request(app).get(certificate).set(headers.learner).expect(404);
    await request(app).post(certificate).set(headers.reviewer).expect(409);
    await request(app).patch(path + '/progress/' + course).set(headers.learner).send({ progress_pct: 101 }).expect(400);
    for (const role of ['learner', 'reviewer'])
      await request(app).patch(path + '/progress/' + course).set(headers[role]).send({ progress_pct: 100 }).expect(200);
    await request(app).post(certificate).set(headers.learner).expect(403);
    await request(app).post(path + '/certificates/' + reviewer.enrollment_id).set(headers.reviewer).expect(403);
    await request(app).post(certificate).set(headers.reviewer).expect(200);
    await request(app).get(certificate).set(headers.reviewer).expect(404);
    await request(app).patch(path + '/progress/' + course).set(headers.learner).send({ progress_pct: 50 }).expect(409);
    await request(app).delete(path + '/my/' + course).set(headers.learner).expect(404);
    expect((await myTraining('learner'))[0]).toMatchObject({ has_certificate: 1, progress_pct: 100 });
    await request(app).post(path + '/enroll').set(headers.admin).send({ course_id: course }).expect(200);
    await request(app).delete(path + '/my/' + course).set(headers.admin).expect(200);
    expect(await myTraining('admin')).toEqual([]);
  } finally {
    await query(database, 'DELETE FROM training_courses WHERE course_id=?', [course]);
  }
});

test('course assessments unlock after progress, are scored on the server, and gate certificates', async () => {
  const path = '/api/training';
  const course = (await request(app).post(path + '/courses').set(headers.reviewer)
    .send({ title: 'Course assessment fixture' }).expect(200)).body.course_id;
  const editor = path + '/courses/' + course + '/assessment';
  const assessment = path + '/my/' + course + '/assessment';
  const questions = Array.from({ length: 15 }, (_, index) => ({
    prompt: 'Topic ' + (index + 1), choices: ['A', 'B', 'C', 'D'], correct: index % 4,
  }));
  try {
    await request(app).put(editor).set(headers.learner).send({ questions }).expect(403);
    await request(app).put(editor).set(headers.reviewer).send({ questions: questions.slice(1) }).expect(400);
    await request(app).put(editor).set(headers.reviewer).send({ questions }).expect(201);
    await request(app).put(editor).set(headers.reviewer).send({ questions }).expect(409);
    await request(app).get(assessment).set(headers.learner).expect(404);
    await request(app).post(path + '/enroll').set(headers.learner).send({ course_id: course }).expect(200);
    await request(app).get(assessment).set(headers.learner).expect(409);
    await request(app).patch(path + '/progress/' + course).set(headers.learner).send({ progress_pct: 100 }).expect(200);
    const enrollment = (await request(app).get(path + '/my').set(headers.learner).expect(200)).body
      .find(item => item.course_id === course);
    expect(enrollment).toMatchObject({ can_take_assessment: 1, next_step: 'Take the course assessment' });
    const reviewing = async () => (await request(app).get(path + '/all-enrollments')
      .set(headers.reviewer).expect(200)).body.find(record => record.enrollment_id === enrollment.enrollment_id);
    expect(await reviewing()).toMatchObject({ certificate_stage: 'Assessment pending', can_issue: 0 });
    const certificate = path + '/certificates/' + enrollment.enrollment_id;
    await request(app).post(certificate).set(headers.reviewer).expect(409);
    const quiz = (await request(app).get(assessment).set(headers.learner).expect(200)).body;
    expect(quiz.questions).toEqual(questions.map(({ prompt, choices }) => ({ prompt, choices })));
    await request(app).post(assessment).set(headers.learner).send({ answers: [0] }).expect(400);
    const failed = await request(app).post(assessment).set(headers.learner)
      .send({ answers: questions.map(question => (question.correct + 1) % 4) }).expect(200);
    expect(failed.body).toMatchObject({ passed: false, score: 0 });
    await request(app).post(certificate).set(headers.reviewer).expect(409);
    const passed = await request(app).post(assessment).set(headers.learner)
      .send({ answers: questions.map((question, index) => index < 3 ? (question.correct + 1) % 4 : question.correct) }).expect(200);
    expect(passed.body).toMatchObject({ passed: true, score: 80 });
    const [result] = await query(database, 'SELECT best_score,passed_at FROM training_assessment_results WHERE enrollment_id=?',
      [enrollment.enrollment_id]);
    expect(result).toMatchObject({ best_score: 80, passed_at: expect.any(Date) });
    await request(app).post(assessment).set(headers.learner).send({ answers: questions.map(question => question.correct) }).expect(409);
    expect(await reviewing()).toMatchObject({ certificate_stage: 'Ready to issue', can_issue: 1 });
    await request(app).post(certificate).set(headers.reviewer).expect(200);
    expect(await reviewing()).toMatchObject({ certificate_stage: 'Issued', can_issue: 0 });
    const register = path + '/certificate-register';
    const listed = (await request(app).get(register+'/my').set(headers.learner).expect(200)).body
      .find(row=>row.enrollment_id===enrollment.enrollment_id);
    expect(listed).toMatchObject({ status:'issued', correction_status:'none', downloadable:1 });
    await request(app).get(register+'/review').set(headers.learner).expect(403);
    const correction = register+'/my/'+enrollment.enrollment_id+'/correction';
    await request(app).post(correction).set(headers.admin).send({proposed_name:'Other Name'}).expect(404);
    await request(app).post(correction).set(headers.learner).send({proposed_name:'Demo Learner Corrected'}).expect(201);
    await request(app).post(correction).set(headers.learner).send({proposed_name:'Another Name'}).expect(409);
    const reviewCertificate = register+'/review/'+enrollment.enrollment_id;
    await request(app).patch(reviewCertificate).set(headers.reviewer).send({action:'approve'}).expect(200);
    const corrected = (await request(app).get(register+'/my').set(headers.learner).expect(200)).body
      .find(row=>row.enrollment_id===enrollment.enrollment_id);
    expect(corrected).toMatchObject({ learner_name:'Demo Learner Corrected', correction_status:'approved' });
    await request(app).patch(reviewCertificate).set(headers.reviewer).send({action:'revoke'}).expect(200);
    await request(app).post(certificate).set(headers.reviewer).expect(409);
    await request(app).get(certificate).set(headers.learner).expect(404);
    const revoked = (await request(app).get(register+'/my').set(headers.learner).expect(200)).body
      .find(row=>row.enrollment_id===enrollment.enrollment_id);
    expect(revoked).toMatchObject({ status:'revoked', downloadable:0 });
  } finally {
    await query(database, 'DELETE FROM training_courses WHERE course_id=?', [course]);
  }
});

test('demo skill courses have reviewable assessments and downloadable study guides', async () => {
  const { curriculum } = require('../backend/services/demo/trainingCurriculum');
  const path = '/api/training';
  const courses = (await request(app).get(path + '/courses').set(headers.learner).expect(200)).body;
  for (const entry of curriculum) {
    expect(courses.find(course => course.title === entry.title)).toMatchObject({
      skill_name: entry.skill, has_study_guide: 1, has_assessment: 1,
      is_mandatory: entry.required ? 1 : 0, url: entry.url || null,
    });
  }
  const java = courses.find(course => course.title === 'Java foundations');
  const studyGuidePath = path + '/courses/' + java.course_id + '/study-guide';
  await request(app).get(studyGuidePath).expect(401);
  const [guide] = await query(database, 'SELECT guide FROM training_study_guides WHERE course_id=?', [java.course_id]);
  expect(guide.guide).toContain('Practice: Build a console inventory app');
  const [assessment] = await query(database, 'SELECT questions FROM training_assessments WHERE course_id=?', [java.course_id]);
  const questions = JSON.parse(assessment.questions);
  expect(questions).toHaveLength(15);
  expect(questions.every(question => question.choices.length === 4)).toBe(true);
});
