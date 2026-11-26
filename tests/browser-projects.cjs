const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

(async () => {
  const browser = process.env.ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const page = await browser.newPage();
    await page.goto(base + '/login.html');
    await page.getByLabel('Email address').fill('admin@wip.com');
    await page.getByLabel('Password', { exact: true }).fill('P123/');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/admin-dashboard.html');
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(base + '/projects.html');
      const create = page.getByRole('button', { name: 'New Project' });
      const title = `Project workflow ${process.env.ENGINE || 'chromium'} ${width} ${Date.now()}`;
      await create.focus();
      await page.keyboard.press('Enter');
      let editor = page.getByRole('dialog', { name: 'Create New Project' });
      await editor.getByLabel('Project name').fill(title);
      await editor.getByLabel('Progress (%)').fill('37');
      await editor.getByLabel('Tech stack').fill('QA fixture, MySQL');
      await editor.getByRole('button', { name: 'Save Project' }).click();
      await editor.waitFor({ state: 'hidden' });
      const card = page.locator('.project-card').filter({ hasText: title });
      await card.getByText('37%', { exact: true }).waitFor();
      await card.getByText('QA fixture', { exact: true }).waitFor();
      const details = card.getByRole('button', { name: 'Details' });
      await details.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('dialog', { name: title }).waitFor();
      await page.keyboard.press('Escape');
      assert(await details.evaluate(element => element === document.activeElement));
      await card.getByRole('button', { name: 'Edit' }).click();
      editor = page.getByRole('dialog', { name: 'Edit Project' });
      await editor.getByLabel('Progress (%)').fill('64');
      await editor.getByRole('button', { name: 'Save Project' }).click();
      await editor.waitFor({ state: 'hidden' });
      await page.reload();
      await card.getByText('64%', { exact: true }).waitFor();
      await card.getByText('MySQL', { exact: true }).waitFor();
      console.log('PASS', width, 'create, details, keyboard dismissal, edit and persisted progress and tags');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
