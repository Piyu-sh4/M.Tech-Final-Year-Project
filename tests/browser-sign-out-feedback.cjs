const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

const accounts = [
  { email: 'admin@wip.com', dashboard: 'admin-dashboard.html', hour: 11, greeting: 'morning' },
  { email: 'employee@wfintelligence.com', dashboard: 'employee-dashboard.html', hour: 12, greeting: 'afternoon' },
  { email: 'manager@wfintelligence.com', dashboard: 'manager.html', hour: 17, greeting: 'afternoon' },
  { email: 'hr@wfintelligence.com', dashboard: 'admin-dashboard.html', hour: 18, greeting: 'evening' }
];

async function signIn(page, account) {
  await page.goto(base + '/login.html');
  if (await page.getByLabel('Access code').count()) {
    await page.getByLabel('Access code').fill(process.env.DEMO_ACCESS_CODE);
    await page.getByRole('button', { name: 'Open demo' }).click();
  }
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill('P123/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/' + account.dashboard);
}

async function signOut(page) {
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL('**/login.html');
  await page.getByRole('heading', { name: 'Thanks for connecting, Workforce Intelligence' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
}

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    for (const width of [390, 1440]) {
      const comment = 'Feedback ' + engine + ' ' + width + ' ' + Date.now() + ' — menus & search';
      let reviewer;
      for (const [index, account] of accounts.entries()) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, timezoneId: 'UTC' });
        const now = new Date();
        now.setUTCHours(account.hour, 0, 0, 0);
        await page.clock.setFixedTime(now);
        await signIn(page, account);
        const name = await page.evaluate(() => localStorage.getItem('full_name'));
        await page.getByText('Good ' + account.greeting + ', ' + name + ' 👋', { exact: true }).waitFor();
        if (index === 0) {
          reviewer = page;
          await page.getByRole('link', { name: 'Feedback history' }).waitFor();
          continue;
        }

        assert.equal(await page.getByRole('link', { name: 'Feedback history' }).count(), 0);
        const history = await page.evaluate(async () => {
          const headers = { Authorization: 'Bearer ' + localStorage.getItem('token') };
          return (await fetch('/api/auth/sign-out-feedback', { headers })).status;
        });
        assert.equal(history, 403);
        if (index === 3) {
          await page.route('**/api/auth/logout', route => route.abort());
          await signOut(page);
          assert.equal(await page.getByLabel('Rate your experience').isVisible(), false);
        } else {
          await signOut(page);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
          if (index === 1) {
            await page.getByLabel('Rate your experience').selectOption('4');
            await page.getByLabel('Comments or suggestions').fill(comment);
            await page.getByRole('button', { name: 'Send feedback' }).click();
            await page.getByText('Thank you for your feedback, ' + name + '.', { exact: false }).waitFor();
            assert.equal(await page.evaluate(() => sessionStorage.getItem('wfi-sign-out-feedback')), null);
          } else {
            await page.getByRole('button', { name: 'Continue without feedback' }).click();
            await page.getByLabel('Email address').waitFor();
            assert.equal(await page.getByLabel('Rate your experience').isVisible(), false);
          }
        }
        await page.close();
      }
      await reviewer.getByRole('link', { name: 'Feedback history' }).click();
      await reviewer.reload();
      await reviewer.getByLabel('Search records').fill(comment);
      const saved = reviewer.getByRole('row').filter({ hasText: comment });
      await saved.waitFor();
      assert.match(await saved.getByRole('cell').nth(2).textContent(), /4$/);
      assert.equal(await saved.count(), 1);
      assert(await reviewer.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      if (process.env.WFI_REVIEW_FEEDBACK === '1') {
        await saved.getByRole('button', { name: 'View', exact: true }).click();
        await reviewer.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
        await saved.getByRole('button', { name: 'Mark as read' }).click();
        await saved.getByRole('button', { name: 'Mark as unread' }).waitFor();
        await saved.getByRole('button', { name: 'Add or edit review note' }).click();
        const dialog = reviewer.getByRole('dialog');
        await dialog.getByLabel('Comment or suggestion for administrators').fill('Review navigation labels');
        await dialog.getByRole('button', { name: 'Add or edit review note' }).click();
        await reviewer.locator('#message').filter({ hasText: 'Review note saved.' }).waitFor();
        await saved.getByRole('button', { name: 'Forward as build request' }).click();
        const requestTitle = 'Review navigation labels ' + Date.now();
        await dialog.getByLabel('Build instructions (first line becomes the title)').fill(requestTitle + '\nCheck the link labels.');
        await dialog.getByRole('button', { name: 'Forward as build request' }).click();
        await reviewer.locator('#message').filter({ hasText: 'Queued build request #' }).waitFor();
        await reviewer.getByRole('link', { name: 'Build requests' }).click();
        await reviewer.getByRole('button', { name: new RegExp(requestTitle) }).waitFor();
        await reviewer.goBack();
        await reviewer.getByLabel('Search records').fill(comment);
        assert.equal(await saved.getByRole('button', { name: 'Forward as build request' }).count(), 0);
        reviewer.once('dialog', prompt => prompt.accept());
        await saved.getByRole('button', { name: 'Delete feedback' }).click();
        await reviewer.locator('#message').filter({ hasText: 'Feedback removed from history.' }).waitFor();
        await saved.waitFor({ state: 'hidden' });
      }
      await signOut(reviewer);
      await reviewer.getByRole('button', { name: 'Continue without feedback' }).click();
      await reviewer.close();
      console.log('PASS', engine, width, 'four roles, local time, sign-out, skip, failure, and saved admin feedback');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
