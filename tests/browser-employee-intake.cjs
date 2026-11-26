const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const spreadsheet = require('xlsx');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

async function signIn(page, email) {
  await page.goto(base + '/login.html');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('P123/');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/dashboard\.html/);
}

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const administrator = await browser.newPage({ acceptDownloads: true });
    await signIn(administrator, 'admin@wip.com');
    for (const width of [390, 1440]) {
      const template = 'full_name,email,designation,department,company';
      const email = 'intake-browser-' + engine + '-' + width + '-' + Date.now() + '@example.test';
      const row = ['Browser intake employee', email, 'Test engineer', '', ''];
      await administrator.setViewportSize({ width, height: 850 });
      await administrator.goto(base + '/registration-tracker.html');
      await administrator.getByRole('link', { name: 'Import employees', exact: true }).click();
      const file = administrator.getByLabel('Employee spreadsheet');
      await file.waitFor();
      const download = administrator.waitForEvent('download');
      await administrator.getByRole('link', { name: 'Download CSV template' }).click();
      assert.equal(fs.readFileSync(await (await download).path(), 'utf8').trim(), template);

      await file.setInputFiles({ name: 'needs-review.csv', mimeType: 'text/csv',
        buffer: Buffer.from(template + '\nKnown account,employee@wfintelligence.com,Technician,,') });
      const preview = administrator.getByRole('button', { name: 'Preview spreadsheet' });
      await preview.click();
      await administrator.getByText('This email already has an account.', { exact: true }).waitFor();
      assert.equal(await administrator.getByRole('button', { name: 'Send to registration review' }).isVisible(), false);
      await administrator.getByRole('button', { name: 'Discard spreadsheet' }).click();
      await administrator.getByText('Spreadsheet discarded.', { exact: true }).waitFor();
      await administrator.getByRole('heading', { name: 'Employee preview' }).waitFor({ state:'hidden' });

      const workbook = spreadsheet.utils.book_new();
      spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.aoa_to_sheet([template.split(','), row]), 'Employees');
      const attachment = width === 390 ? {
        name: 'employees.csv', mimeType: 'text/csv', buffer: Buffer.from(template + '\n' + row.join(','))
      } : {
        name: 'employees.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: spreadsheet.write(workbook, { bookType:'xlsx', type:'buffer' })
      };
      await file.setInputFiles(attachment);
      await preview.click();
      await administrator.getByRole('row').filter({ hasText: email }).getByText('Ready', { exact:true }).waitFor();
      assert(await administrator.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      await administrator.getByRole('button', { name: 'Send to registration review' }).click();
      await administrator.getByText('1 employee sent to registration review.', { exact: true }).waitFor();
      await administrator.getByRole('link', { name: 'Registration tracker', exact: true }).click();
      await administrator.getByLabel('Search records').fill(email);
      await administrator.getByRole('row').filter({ hasText: email }).getByRole('button', { name: 'Approve', exact: true }).waitFor();
      console.log('PASS', engine, width, 'template, validation, discard, import, and pending registration');
    }
    const employee = await browser.newPage();
    await signIn(employee, 'employee@wfintelligence.com');
    await employee.goto(base + '/employee-import.html');
    await employee.getByText('Administrator access is required to import employees.', {exact:true}).waitFor();
    assert.equal(await employee.getByLabel('Employee spreadsheet').isVisible(), false);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
