const { query } = require('./database');

async function ensure(connection) {
  await query(connection, `CREATE TABLE IF NOT EXISTS training_skill_resources (
    course_id INT PRIMARY KEY,
    skill_id INT NOT NULL,
    video_url VARCHAR(255) NULL,
    FOREIGN KEY (course_id) REFERENCES training_courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await query(connection, `CREATE TABLE IF NOT EXISTS training_certificates (
    enrollment_id INT PRIMARY KEY,
    issuer_id INT NULL,
    learner_name VARCHAR(150) NOT NULL,
    course_title VARCHAR(200) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES training_enrollments(enrollment_id) ON DELETE CASCADE,
    FOREIGN KEY (issuer_id) REFERENCES users(user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  await require('./certificateRegister').ensure(connection);
  const [videoColumn] = await query(connection, `SELECT IS_NULLABLE AS nullable
    FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()
      AND TABLE_NAME='training_skill_resources' AND COLUMN_NAME='video_url'`);
  if (videoColumn?.nullable === 'NO') {
    // A documentation-led course can be linked to a skill without a video.
    await query(connection, 'ALTER TABLE training_skill_resources MODIFY video_url VARCHAR(255) NULL');
  }
  await query(connection, `CREATE TABLE IF NOT EXISTS training_study_guides (
    course_id INT PRIMARY KEY,
    guide TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES training_courses(course_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
  await require('./trainingAssessment').ensure(connection);
}

const starterCourses = [
  ['JavaScript', 'JavaScript foundations', 'freeCodeCamp and MDN',
    'https://www.youtube.com/watch?v=Zi-Q0t4gMC8', 'https://developer.mozilla.org/en-US/docs/Learn_web_development'],
  ['Python', 'Python foundations', 'Microsoft Learn and Python Documentation',
    'https://learn.microsoft.com/en-us/shows/intro-to-python-development/', 'https://docs.python.org/3/tutorial/'],
  ['Docker', 'Docker and containers', 'Docker',
    'https://www.youtube.com/@DockerInc', 'https://docs.docker.com/get-started/'],
];

async function seed(connection) {
  for (const [skill, title, provider, video, website] of starterCourses) {
    const [topic] = await query(connection, 'SELECT skill_id FROM skills WHERE skill_name=? ORDER BY skill_id LIMIT 1', [skill]);
    if (!topic) continue;
    const result = await query(connection, `INSERT INTO training_courses
      (title,description,category,format,provider,url,target_grades)
      VALUES (?,?,'technical','external',?,?,'all')`,
    [title, 'Follow the video and complete the exercises in the reference material.', provider, website]);
    await query(connection, 'INSERT INTO training_skill_resources (course_id,skill_id,video_url) VALUES (?,?,?)',
      [result.insertId, topic.skill_id, video]);
  }
}

async function seedAssessments(connection) {
  for (const [title, questions] of Object.entries(require('./demo/trainingAssessmentQuestions'))) {
    // Match the starter learning paths by title, provider, and skill so custom courses are preserved.
    const [skill, , provider] = starterCourses.find(course => course[1] === title);
    await query(connection, `INSERT INTO training_assessments (course_id,questions)
      SELECT course.course_id,? FROM training_courses course
      JOIN training_skill_resources resource USING(course_id) JOIN skills skill USING(skill_id)
      WHERE course.title=? AND course.provider=? AND skill.skill_name=?
      ON DUPLICATE KEY UPDATE questions=training_assessments.questions`,
    [JSON.stringify(questions), title, provider, skill]);
  }
}

async function seedCurriculum(connection) {
  const { curriculum, toAssessment } = require('./demo/trainingCurriculum');
  const starterGuides = [
    'Study: Functions, arrays, objects, DOM events and promises.\nPractice: Make a reading list with add, filter and remove actions. Keep course titles as text and test an empty state.',
    'Study: Built-in types, control flow, functions, files and exceptions.\nPractice: Read a CSV inventory and group entries by category. Report helpful errors for missing or malformed input.',
    'Study: Images, containers, networking, named volumes and Compose.\nPractice: Run a local app and database with Compose. Recreate the app container and confirm the database data persists.',
  ];
  for (const [index, [, title, provider]] of starterCourses.entries()) {
    await query(connection, `INSERT IGNORE INTO training_study_guides (course_id,guide)
      SELECT course_id,? FROM training_courses WHERE title=? AND provider=?`,
    [starterGuides[index], title, provider]);
  }
  for (const entry of curriculum) {
    await query(connection, 'INSERT IGNORE INTO skills (skill_name,category) VALUES (?,?)',
      [entry.skill, entry.required ? 'Product' : 'Technical']);
    const [skill] = await query(connection, 'SELECT skill_id FROM skills WHERE skill_name=?', [entry.skill]);
    const [existing] = await query(connection, 'SELECT course_id FROM training_courses WHERE title=? AND provider=? ORDER BY course_id LIMIT 1',
      [entry.title, entry.provider]);
    let courseId = existing?.course_id;
    if (!courseId) {
      const created = await query(connection, `INSERT INTO training_courses
        (title,description,provider,url,category,format,is_mandatory,target_grades)
        VALUES (?,?,?,?,?,'document',?,'all')`,
      [entry.title, 'Read the study guide and complete the practice assignment before taking the assessment.',
        entry.provider, entry.url ?? null, entry.required ? 'product' : 'technical', entry.required ? 1 : 0]);
      courseId = created.insertId;
    }
    const legacy = entry.legacyTitle ?
      await query(connection, 'SELECT course_id FROM training_courses WHERE title=? AND provider=?', [entry.legacyTitle, entry.legacyProvider]) : [];
    for (const id of [courseId, ...legacy.map(course => course.course_id)]) {
      await query(connection, 'INSERT IGNORE INTO training_skill_resources (course_id,skill_id) VALUES (?,?)', [id, skill.skill_id]);
      await query(connection, 'INSERT IGNORE INTO training_study_guides (course_id,guide) VALUES (?,?)', [id, entry.guide]);
      await query(connection, 'INSERT IGNORE INTO training_assessments (course_id,questions) VALUES (?,?)',
        [id, JSON.stringify(toAssessment(entry.questions))]);
    }
    if (legacy.length) {
      await query(connection, `UPDATE training_courses SET url=COALESCE(NULLIF(url,''),?) WHERE course_id IN (?)`,
        [entry.url, legacy.map(course => course.course_id)]);
    }
  }
}

async function seedCurriculumVideos(connection) {
  const { curriculum } = require('./demo/trainingCurriculum');
  const videos = {
    Java: 'https://www.youtube.com/@java',
    React: 'https://www.youtube.com/watch?v=T8TZQ6k4SLE&t=5542s',
    Bootstrap: 'https://www.youtube.com/watch?v=-qfEOE4vtxE',
    'Tailwind CSS': 'https://www.youtube.com/@TailwindLabs',
    Angular: 'https://www.youtube.com/@Angular',
    MySQL: 'https://www.youtube.com/watch?v=uWkcxasFWzQ'
  };
  for (const entry of curriculum) {
    if (!videos[entry.skill]) continue;
    for (const [title, provider] of [[entry.title, entry.provider], [entry.legacyTitle, entry.legacyProvider]]) {
      if (!title || !provider) continue;
      await query(connection, `UPDATE training_skill_resources resource
        JOIN training_courses course USING(course_id) JOIN skills skill USING(skill_id)
        SET resource.video_url=? WHERE course.title=? AND course.provider=? AND skill.skill_name=?
          AND resource.video_url IS NULL`, [videos[entry.skill],title,provider,entry.skill]);
    }
  }
}

module.exports = { ensure, seed, seedAssessments, seedCurriculum, seedCurriculumVideos };
