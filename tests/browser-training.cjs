const assert = require('node:assert/strict');
const fs = require('node:fs');
const spreadsheet = require('xlsx');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

async function signIn(browser, email) {
  const page = await browser.newPage({ acceptDownloads: true });
  await page.goto(base + '/login.html');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('P123/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/dashboard\.html/);
  return page;
}

async function setupCourse(reviewer, title) {
  await reviewer.goto(base + '/training.html');
  await reviewer.getByRole('button', { name: 'Add course' }).click();
  const editor = reviewer.getByRole('dialog');
  await editor.getByLabel('Course title').fill(title);
  await editor.getByLabel('Related skill').selectOption({ label: 'JavaScript' });
  await editor.getByLabel('Learning video (HTTPS)').fill('https://www.youtube.com/watch?v=Zi-Q0t4gMC8');
  await editor.getByLabel('Learning website (HTTPS)').fill('https://developer.mozilla.org/en-US/docs/Learn_web_development');
  await editor.getByLabel('Study guide and practice assignment').fill('Practice: Build an accessible course checklist.');
  await editor.getByRole('button', { name: 'Save' }).click();
  await reviewer.locator('#message').filter({ hasText: 'Course created.' }).waitFor();
  await reviewer.getByLabel('Search records').fill(title);
  await reviewer.getByRole('row').filter({ hasText: title }).getByRole('button', { name: 'Edit course' }).click();
  await editor.getByLabel('Duration in minutes').fill('45');
  await editor.getByRole('button', { name: 'Save' }).click();
  await reviewer.locator('#message').filter({ hasText: 'Course updated.' }).waitFor();
  await reviewer.getByRole('row').filter({ hasText: title }).getByRole('button', { name: 'Publish assessment' }).click();
  for (const [index, question] of (await editor.locator('fieldset').all()).entries()) {
    await question.getByLabel('Prompt').fill('Course question ' + (index + 1));
    for (let option = 1; option <= 4; option++) await question.getByLabel('Option ' + option, { exact: true }).fill('Choice ' + option);
    await question.getByLabel('Correct option').selectOption(String(index % 4));
  }
  await editor.getByRole('button', { name: 'Publish assessment' }).click();
  await reviewer.locator('#message').filter({ hasText: 'Assessment published.' }).waitFor();
}

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const learner = await signIn(browser, 'employee@wfintelligence.com');
    const reviewer = await signIn(browser, 'hr@wfintelligence.com');
    for (const width of [390, 1440]) {
      for (const page of [learner, reviewer]) await page.setViewportSize({ width, height: 900 });
      const title = `+Learning workflow ${engine} ${width} ${Date.now()}`;
      await setupCourse(reviewer, title);
      await learner.goto(base + '/skills-matrix.html');
      await learner.getByLabel('Search records').fill('JavaScript');
      await learner.getByRole('row').filter({ hasText: 'JavaScript' }).getByRole('link', { name: 'Find training' }).first().click();
      await learner.waitForURL(/training\.html\?skill_id=\d+/);
      await learner.getByLabel('Search records').fill(title);
      const course = learner.getByRole('row').filter({ hasText: title });
      assert.match(await course.getByRole('link', { name: 'Watch learning video' }).getAttribute('href'), /^https:\/\/www\.youtube\.com\//);
      assert.match(await course.getByRole('link', { name: 'Open learning website' }).getAttribute('rel'), /noreferrer/);
      const guideDownload = learner.waitForEvent('download');
      await course.getByRole('button', { name: 'Download study guide PDF' }).click();
      const guide = await guideDownload;
      assert.match(guide.suggestedFilename(), /^study-guide-\d+\.pdf$/);
      assert.equal(fs.readFileSync(await guide.path()).subarray(0, 5).toString(), '%PDF-');
      if (process.env.WFI_STUDY_GUIDE_SAMPLE) fs.copyFileSync(await guide.path(), process.env.WFI_STUDY_GUIDE_SAMPLE);
      await course.getByRole('button', { name: 'Enroll' }).click();
      await learner.locator('#message').filter({ hasText: 'Enrollment is active.' }).waitFor();
      await learner.getByRole('link', { name: 'My learning' }).click();
      await learner.getByLabel('Search records').fill(title);
      const record = learner.getByRole('row').filter({ hasText: title });
      const checklist = record.getByRole('list', { name: 'Course checklist' });
      await checklist.getByText('Coursework · 0%', { exact: true }).waitFor();
      await checklist.getByText('Assessment · After coursework', { exact: true }).waitFor();
      const excelDownload = learner.waitForEvent('download');
      await learner.getByRole('button', { name: 'Export Excel' }).click();
      const workbookFile = await excelDownload;
      assert.equal(workbookFile.suggestedFilename(), 'my-learning.xlsx');
      const workbook = spreadsheet.read(fs.readFileSync(await workbookFile.path()));
      const worksheet = workbook.Sheets.Records;
      const exported = spreadsheet.utils.sheet_to_json(worksheet, { header: 1 });
      assert.equal(exported.length, 2, 'Workbook contains only the filtered record and headers');
      assert.equal(worksheet.A2.t, 's');
      assert.equal(worksheet.A2.v, title);
      assert.equal(worksheet.A2.f, undefined);
      const csvDownload = learner.waitForEvent('download');
      await learner.getByRole('button', { name: 'Export CSV' }).click();
      assert.ok(fs.readFileSync(await (await csvDownload).path(), 'utf8').includes("'" + title));
      await record.getByRole('button', { name: 'Update progress' }).click();
      const form = learner.getByRole('dialog');
      await form.getByLabel('Progress (%)').fill('100');
      await form.getByRole('button', { name: 'Update progress' }).click();
      await learner.locator('#message').filter({ hasText: 'Completion recorded' }).waitFor();
      await checklist.getByText('Coursework · Complete', { exact: true }).waitFor();
      await checklist.getByText('Assessment · Ready', { exact: true }).waitFor();
      assert.equal(await record.getByRole('button', { name: 'Download certificate PDF' }).count(), 0);

      await reviewer.goto(base + '/training-review.html');
      await reviewer.getByLabel('Search records').fill(title);
      const reviewRow = reviewer.getByRole('row').filter({ hasText: title });
      await reviewRow.getByText('Assessment pending', { exact: true }).waitFor();
      assert.equal(await reviewRow.getByRole('button', { name: 'Issue certificate' }).count(), 0);
      await record.getByRole('button', { name: 'Take assessment' }).click();
      const quiz = learner.getByRole('dialog', { name: 'Course assessment' });
      await quiz.waitFor();
      const questions = await quiz.locator('fieldset').all();
      assert.equal(questions.length, 15);
      assert.equal(await quiz.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth + 1), true);
      for (const [index, question] of questions.entries()) {
        await question.getByRole('radio', { name: 'Choice ' + (index % 4 + 1) }).check();
      }
      await quiz.getByRole('button', { name: 'Submit answers' }).click();
      await learner.locator('#message').filter({ hasText: 'Assessment passed.' }).waitFor();
      await checklist.getByText('Assessment · Passed', { exact: true }).waitFor();
      await checklist.getByText('Certificate · Awaiting issuance', { exact: true }).waitFor();
      await reviewer.reload();
      await reviewer.getByLabel('Search records').fill(title);
      await reviewer.getByRole('row').filter({ hasText: title }).getByRole('button', { name: 'Issue certificate' }).click();
      const confirmation = reviewer.getByRole('dialog', { name: 'Issue certificate', exact: true });
      await confirmation.getByText(title, { exact: true }).waitFor();
      await confirmation.getByLabel('Certificate template').selectOption(width === 390 ? 'modern' : 'course');
      await confirmation.getByRole('button', { name: 'Confirm issue' }).click();
      await reviewer.locator('#message').filter({ hasText: 'Certificate issued.' }).waitFor();
      await learner.reload();
      await learner.getByLabel('Search records').fill(title);
      await record.getByText('Certificate available', { exact: true }).waitFor();
      await checklist.getByText('Certificate · Available', { exact: true }).waitFor();
      const download = learner.waitForEvent('download');
      await record.getByRole('button', { name: 'Download certificate PDF' }).click();
      const file = fs.readFileSync(await (await download).path());
      assert.equal(file.subarray(0, 5).toString(), '%PDF-');
      if (process.env.WFI_CERTIFICATE_SAMPLE) fs.writeFileSync(process.env.WFI_CERTIFICATE_SAMPLE, file);
      await learner.goto(base + '/profile.html');
      await learner.getByRole('link',{name:'My training certificates',exact:true}).click();
      await learner.getByLabel('Search records').fill(title);
      const issued = learner.getByRole('row').filter({hasText:title});
      assert.equal(await learner.getByRole('button', { name: 'Export Excel' }).count(), 0);
      await issued.getByRole('button',{name:'View certificate',exact:true}).click();
      const preview = learner.getByRole('dialog',{name:'Certificate',exact:true});
      assert.match(await preview.getByRole('link',{name:'Open certificate PDF'}).getAttribute('href'),/^blob:/);
      await preview.getByRole('button',{name:'Close',exact:true}).click();
      await issued.getByRole('button',{name:'Request name correction'}).click();
      const correction = learner.getByRole('dialog',{name:'Request name correction'});
      await correction.getByLabel('Corrected name').fill('Demo Learner Corrected');
      await correction.getByRole('button',{name:'Request name correction'}).click();
      await learner.locator('#message').filter({hasText:'Certificate correction requested.'}).waitFor();
      await reviewer.goto(base+'/certificate-register.html');
      await reviewer.getByLabel('Search records').fill(title);
      const register = reviewer.getByRole('row').filter({hasText:title});
      reviewer.once('dialog', dialog => dialog.accept());
      await register.getByRole('button',{name:'Approve name correction'}).click();
      await reviewer.locator('#message').filter({hasText:'Correction decision saved.'}).waitFor();
      reviewer.once('dialog', dialog => dialog.accept());
      await register.getByRole('button',{name:'Revoke certificate'}).click();
      await reviewer.locator('#message').filter({hasText:'Certificate revoked.'}).waitFor();
      await learner.reload();
      await learner.getByLabel('Search records').fill(title);
      await issued.getByText('revoked',{exact:true}).waitFor();
      assert.equal(await issued.getByRole('button',{name:'Download certificate PDF'}).count(),0);
      await learner.goto(base + '/my-learning.html');
      await learner.getByLabel('Search records').fill(title);
      await checklist.getByText('Certificate · Revoked', { exact: true }).waitFor();
      console.log('PASS', engine, width, 'course checklist, Excel/CSV, assessment, template, PDF, correction and revocation');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
