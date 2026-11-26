const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const page = await browser.newPage();
    await page.goto(base + '/login.html', { waitUntil: 'domcontentloaded' });
    if (await page.getByLabel('Access code').count()) {
      const { parse } = require('dotenv');
      await page.getByLabel('Access code').fill(parse(fs.readFileSync('.env')).DEMO_ACCESS_CODE);
      await page.getByRole('button', { name: 'Open demo' }).click();
    }
    await page.getByLabel('Email address').fill('admin@wip.com');
    await page.getByLabel('Password', { exact: true }).fill('P123/');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/admin-dashboard.html', { waitUntil: 'commit' });
    const requests = [];
    await page.route('**/api/chat/send', route => {
      const payload = route.request().postDataJSON();
      if (['Show my overdue tasks', 'Active employee count'].includes(payload.messages.at(-1).content)) return route.continue();
      requests.push(payload);
      return route.fulfill({ json: { provider: 'test', model: 'fixture', content: [{ type: 'text', text: 'See Training courses.' }] } });
    });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/chat.html', { waitUntil: 'domcontentloaded' });
      await page.getByText('Workspace guide', { exact: true }).click();
      await page.getByLabel('Find a workspace module').fill('Training courses');
      const moduleLink = page.locator('#assistantModules').getByRole('link', { name: 'Training courses', exact: true });
      await moduleLink.waitFor();
      assert.equal(await moduleLink.getAttribute('href'), '/training.html');
      await page.getByText('My recent activity', { exact: true }).click();
      await page.getByRole('link', { name: 'Open activity history', exact: true }).waitFor();
      await page.waitForFunction(() => !document.getElementById('assistantActivityStatus').textContent.startsWith('Loading'));
      const consent = page.getByRole('checkbox', { name: /Share workforce totals/ });
      assert.equal(await consent.isChecked(), false);
      assert.equal(await consent.isVisible(), true);
      await page.getByRole('button', { name: 'My overdue tasks', exact: true }).click();
      await page.locator('.chat-msg-assistant').getByText('Source: Workforce database', { exact: true }).waitFor();
      await page.locator('.chat-msg-assistant').getByText(/Tasks assigned to you/).waitFor();
      // A new conversation shows the role-specific tools again.
      await page.reload();
      await page.getByRole('button', { name: 'Active employee count', exact: true }).click();
      await page.locator('.chat-msg-assistant').getByText(/Active employee accounts:/).waitFor();
      for (const share of [false, true]) {
        if (share) await consent.check();
        await page.getByLabel('Message to Workforce Intelligence Assistant').fill('Where can I find training courses?');
        await page.getByRole('button', { name: 'Send message', exact: true }).click();
        await page.locator('.chat-msg-assistant').getByText('See Training courses.', { exact: true }).last().waitFor();
        assert.equal(requests.at(-1).include_context, share);
        assert(!JSON.stringify(requests.at(-1).messages).includes('Show my overdue tasks'));
        assert(!JSON.stringify(requests.at(-1).messages).includes('Tasks assigned to you'));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      console.log('PASS', engine, width, 'live database answers, workspace search, privacy and context consent');
    }
    await page.getByRole('button', { name: 'Account', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.waitForURL('**/login.html');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
