const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

async function signIn(page, email, password) {
  await page.goto(base + '/login.html');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/dashboard\.html/);
}

async function api(page, path, method = 'GET', data) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return page.request.fetch(base + '/api' + path, {
    method, data, headers: { Authorization: 'Bearer ' + token }
  });
}

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  const administrator = await browser.newPage();
  const email = 'password-recovery-' + engine + '-' + Date.now() + '@example.test';
  const fullName = 'Password Recovery Test ' + engine;
  let password = 'InitialBrowser123!';
  try {
    await signIn(administrator, 'admin@wip.com', 'P123/');
    const imported = await api(administrator, '/upload/import/employees', 'POST', {
      rows: [{ full_name: fullName, email, password }]
    });
    assert.equal((await imported.json()).imported, 1);
    const users = await api(administrator, '/admin/users');
    const user = (await users.json()).find(row => row.email === email);
    assert.equal(user.status, 'pending');
    assert.equal((await api(administrator, '/admin/users/' + user.user_id + '/approve', 'PATCH', {})).status(), 200);
    for (const width of [390, 1440]) {
      const employee = await browser.newPage({ viewport: { width, height: 850 } });
      const recovery = await browser.newPage({ viewport: { width, height: 850 } });
      await administrator.setViewportSize({ width, height: 850 });
      await signIn(employee, email, password);
      assert.equal((await api(employee, '/admin/users/' + user.user_id + '/reset-link', 'POST')).status(), 403);

      await recovery.goto(base + '/login.html');
      await recovery.getByRole('link', { name: 'Forgot password?' }).click();
      await recovery.getByLabel('Work email').fill(email);
      await recovery.getByRole('button', { name: 'Send reset link' }).click();
      await recovery.getByRole('status').filter({ hasText: 'Contact your Workforce Intelligence administrator' }).waitFor();

      await administrator.goto(base + '/admin-dashboard.html');
      await administrator.getByRole('button', { name: /Users/ }).first().click();
      const record = administrator.locator('#userTableBody tr').filter({ hasText: email });
      await record.locator('.btn-reset').click();
      administrator.once('dialog', dialog => dialog.accept());
      await administrator.getByRole('button', { name: 'Create reset link' }).click();
      await administrator.locator('#resetPwMsg').filter({ hasText: 'Link ready' }).waitFor();
      const resetUrl = await administrator.getByLabel('One-time reset link').inputValue();
      await recovery.goto(resetUrl);
      const newPassword = 'UpdatedBrowser' + width + '!';
      await recovery.getByLabel('New password', { exact: true }).fill(newPassword);
      await recovery.getByLabel('Confirm new password').fill('DifferentPassword123!');
      await recovery.getByRole('button', { name: 'Update password' }).click();
      await recovery.getByRole('status').filter({ hasText: 'The passwords do not match.' }).waitFor();
      await recovery.getByLabel('Confirm new password').fill(newPassword);
      await recovery.getByRole('button', { name: 'Update password' }).click();
      await recovery.getByRole('status').filter({ hasText: 'Password updated.' }).waitFor();
      assert.equal((await api(employee, '/auth/me')).status(), 401);
      await signIn(recovery, email, newPassword);
      password = newPassword;
      await employee.close();
      await recovery.close();
      console.log('PASS', engine, width, 'employee import, approval, recovery, password change, and session revocation');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
