const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const { base, chromiumOptions } = require('./support/browser-target.cjs');
const access = process.env.DEMO_ACCESS_CODE ||
  (fs.existsSync('.env') ? fs.readFileSync('.env','utf8').match(/^DEMO_ACCESS_CODE=(.+)$/m)?.[1] : undefined);
const smokeId = process.env.WFI_SMOKE_ID || 'Browser smoke ' + Date.now();
const command = process.argv[2] || 'write';
const browserArgs = process.env.WFI_DNS_OVERRIDE ? ['--host-resolver-rules=' + process.env.WFI_DNS_OVERRIDE] : [];
const diagnostics = [];

async function login(browser, role, viewport) {
  const context = await browser.newContext({viewport, acceptDownloads:true});
  context.setDefaultTimeout(12000);
  const page = await context.newPage();
  page.on('pageerror', error => diagnostics.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === base && url.pathname.startsWith('/api/') && response.status() >= 500)
      diagnostics.push(response.status() + ' ' + url.pathname);
  });
  await page.goto(base+'/login.html');
  if (await page.locator('#code').count()) {
    assert(access,'The access gate requires DEMO_ACCESS_CODE');
    await page.getByLabel('Access code').fill(access);
    await page.getByRole('button',{name:'Open demo'}).click();
  }
  await page.locator('#email').fill(role === 'admin' ? 'admin@wip.com' : 'employee@wfintelligence.com');
  await page.locator('#password').fill('P123/');
  await page.locator('#loginBtn').click();
  await page.waitForURL(role === 'admin' ? '**/admin-dashboard.html' : '**/employee-dashboard.html');
  return {page,context};
}
async function open(page, slug, heading) {
  await page.goto(base+'/'+slug+'.html',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:heading,exact:true}).waitFor();
  await page.waitForFunction(() => !document.querySelector('#message')?.textContent.startsWith('Loading'));
  assert.equal(await page.locator('#message').getAttribute('data-error'),'false',
    await page.locator('#message').textContent());
}
async function saved(page, text) {
  await page.getByRole('status').filter({hasText:text}).waitFor({timeout:12000});
}
async function row(page, text) {
  const match = page.getByRole('row').filter({hasText:text}).first();
  await match.waitFor();
  return match;
}
async function main() {
  const browser = await chromium.launch({
    ...chromiumOptions,
    headless:true,args:browserArgs
  });
  try {
    const {page} = await login(browser,'employee',{width:390,height:844});
    await open(page,'modules','Modules');
    await page.getByLabel('Find a module').fill('Employee directory');
    await page.getByRole('link',{name:'Employee directory',exact:true}).click();
    await page.getByRole('heading',{name:'Employee directory',exact:true}).waitFor();
    await page.waitForFunction(() => document.querySelector('#count')?.textContent.match(/[0-9]+ records/));
    const directory = page.locator('table tbody tr');
    assert(await directory.count() > 25);
    console.log('Employee sign-in, mobile module navigation, and database directory passed');
    await open(page,'goals-okr','Goals and key results');
    if (command === 'write') {
      await row(page,'Publish the employee handbook');
      await page.getByRole('button',{name:'Add record'}).click();
      await page.getByLabel('Objective').fill(smokeId);
      await page.getByLabel('Details').fill('Verify that this record persists after Docker Compose recreates the services.');
      const objective = page.getByRole('dialog');
      await objective.getByLabel('Metric',{exact:true}).fill('Handbook publication');
      await objective.getByLabel('Baseline',{exact:true}).fill('0');
      await objective.getByLabel('Target',{exact:true}).fill('1');
      await objective.getByLabel('Actual',{exact:true}).fill('0');
      await page.getByRole('button',{name:'Save',exact:true}).click();
      await saved(page,'Record saved');
      await (await row(page,smokeId)).getByRole('button',{name:'Edit'}).click();
      await page.getByRole('dialog').getByLabel('Actual',{exact:true}).fill('1');
      await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
      await saved(page,'Saved');
      for (const next of ['In progress','Achieved']) {
        await (await row(page,smokeId)).getByRole('button',{name:next,exact:true}).click();
        const decision = page.getByRole('dialog',{name:next,exact:true});
        await decision.getByLabel('Decision note').fill('Browser smoke workflow verification');
        await decision.getByRole('button',{name:next,exact:true}).click();
        await saved(page,'Workflow decision recorded');
        await (await row(page,smokeId)).getByText(next,{exact:true}).first().waitFor();
      }
    }
    await page.getByLabel('Search records').fill(smokeId);
    assert.match(await (await row(page,smokeId)).textContent(),/Achieved/);
    const csvPromise = page.waitForEvent('download');
    await page.getByRole('button',{name:'Export CSV'}).click();
    assert.match(fs.readFileSync(await (await csvPromise).path(),'utf8'),/Achieved/);
    console.log((command === 'write' ? 'Objective create/edit/search' : 'Objective state after recreation') + ' and CSV passed');

    await open(page,'leave','Leave requests');
    await row(page,'Demo personal day');
    if (command === 'write') {
      await page.getByRole('button',{name:'Request leave'}).click();
      const day = new Date(Date.now()+20*86400000).toISOString().slice(0,10);
      await page.getByLabel('From date').fill(day);
      await page.getByLabel('To date').fill(day);
      await page.getByLabel('Reason').fill(smokeId);
      await page.getByRole('button',{name:'Save',exact:true}).click();
      await saved(page,'Leave request submitted');
      assert.match(await (await row(page,smokeId)).textContent(),/pending/);
    }
    await open(page,'expenses','Expense claims');
    if (command === 'write') {
      await page.getByRole('button',{name:'Submit expense'}).click();
      await page.getByLabel('Claim date').fill(new Date().toISOString().slice(0,10));
      await page.getByLabel('Category').selectOption('equipment');
      await page.getByLabel('Amount').fill('109.25');
      await page.getByLabel('Description').fill(smokeId);
      await page.getByRole('button',{name:'Save',exact:true}).click();
      await saved(page,'Expense claim submitted');
    }
    assert.match(await (await row(page,smokeId)).textContent(),/109.25/);
    await open(page,'payslip-portal','Payslips');
    const pdfPromise = page.waitForEvent('download');
    await page.getByRole('button',{name:'Download PDF'}).first().click();
    const pdf = fs.readFileSync(await (await pdfPromise).path());
    assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
    console.log('Employee leave, expense and payslip PDF passed');

    const forbiddenStatus = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/modules/vendor-management/records',{headers:{Authorization:'Bearer '+token}});
      return response.status;
    });
    assert.equal(forbiddenStatus,403);
    const admin = await login(browser,'admin',{width:1280,height:850});
    await open(admin.page,'leave','Leave requests');
    const leave = await row(admin.page,smokeId);
    if (command === 'write') {
      await leave.getByRole('button',{name:'Approve',exact:true}).click();
      await saved(admin.page,'Leave approved');
    }
    assert.match(await (await row(admin.page,smokeId)).textContent(),/approved/);
    await open(page,'leave','Leave requests');
    assert.match(await (await row(page,smokeId)).textContent(),/approved/);
    console.log('Employee role restriction and admin approval reflected in employee view passed');
    if (process.env.WFI_SCREENSHOT) {
      await open(admin.page,'modules','Modules');
      await admin.page.screenshot({path:process.env.WFI_SCREENSHOT});
    }
    assert.deepEqual(diagnostics,[]);
    console.log('PASS', smokeId);
  } finally { await browser.close(); }
}
main().catch(error=>{ console.error(error); process.exitCode=1; });
