const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

const engine = process.env.ENGINE || 'chromium';
const viewport = { width: Number(process.env.WFI_WIDTH || 390), height: 900 };

async function signIn(browser, email, password = 'P123/') {
  const page = await browser.newPage({ viewport });
  await page.goto(base + '/login.html');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/(?:admin-dashboard|employee-dashboard|manager)\.html/);
  return page;
}

async function api(page, path, expected, method = 'GET', payload) {
  const result = await page.evaluate(async ({ path, method, payload }) => {
    const response = await fetch('/api' + path, {
      method,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }, { path, method, payload });
  assert.equal(result.status, expected, JSON.stringify(result.body));
  return result.body;
}

async function open(page, slug) {
  await page.goto(base + '/' + slug + '.html');
  await page.getByLabel('Search records').waitFor();
  await page.waitForFunction(() => document.querySelector('#message')?.dataset.error !== undefined);
  assert.equal(await page.locator('#message').getAttribute('data-error'), 'false');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
}

async function find(page, marker) {
  await page.getByLabel('Search records').fill(marker);
  const row = page.getByRole('row').filter({ hasText: marker }).first();
  await row.waitFor();
  return row;
}

async function create(page, action, fields) {
  await page.getByRole('button', { name: action, exact: true }).click();
  const form = page.getByRole('dialog');
  for (const [name,value] of Object.entries(fields)) {
    const input = form.locator('[name="' + name + '"]');
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value);
    else await input.fill(value);
  }
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await form.waitFor({ state:'hidden' });
}

async function act(page, row, action, confirmation = false) {
  if (confirmation) page.once('dialog', dialog => dialog.accept());
  await row.getByRole('button', { name: action, exact: true }).click();
}

(async () => {
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const admin = await signIn(browser, 'admin@wip.com');
    const manager = await signIn(browser, 'manager@wfintelligence.com');
    const hr = await signIn(browser, 'hr@wfintelligence.com');
    const marker = 'Approval review ' + engine + ' ' + Date.now();
    const email = 'legacy-workflow-' + engine + '-' + Date.now() + '@example.test';
    const password = 'BrowserTest123!';
    const managerId = (await api(manager,'/auth/me',200)).user_id;
    const hrId = (await api(hr,'/auth/me',200)).user_id;
    const {user_id:id} = await api(admin,'/auth/register',201,'POST',{full_name:marker,email,password});
    await api(admin,'/admin/users/'+id,200,'PATCH',{base_salary:75000,join_date:'2022-04-01',reporting_manager_id:managerId});
    await api(admin,'/admin/users/'+id+'/approve',200,'PATCH',{});
    const employee = await signIn(browser,email,password);

    await open(employee,'travel');
    const travel = {travel_type:'domestic',from_location:'HQ',to_location:'Office',
      travel_date:'2043-08-11',return_date:'2043-08-13',purpose:marker,estimated_cost:'100'};
    await create(employee,'Request travel',travel);
    const cancelled = await find(employee,marker);
    await act(employee,cancelled,'Cancel travel request',true);
    await cancelled.getByText('cancelled',{exact:true}).waitFor();
    await create(employee,'Request travel',{...travel,purpose:marker+' decision'});
    await open(manager,'travel');
    const decision = await find(manager,marker+' decision');
    await act(manager,decision,'Approve travel');
    await decision.getByText('approved',{exact:true}).waitFor();

    await open(employee,'women-safety');
    await create(employee,'Request night shift',{shift_date:'2043-08-15',shift_start:'21:00',
      shift_end:'05:00',transport_mode:'company_cab'});
    await open(manager,'women-safety');
    const shift = await find(manager,marker);
    await act(manager,shift,'Approve night shift');
    await shift.getByText('approved',{exact:true}).waitFor();

    await open(employee,'exit');
    await create(employee,'Submit demo resignation',{reason:'personal',last_working_day:'2043-08-31',comments:marker});
    await open(manager,'exit');
    const resignationForManager = await find(manager,marker);
    await act(manager,resignationForManager,'Acknowledge resignation');
    await resignationForManager.getByText('manager_acknowledged',{exact:true}).waitFor();
    await open(hr,'exit');
    const resignationForHr = await find(hr,marker);
    await act(hr,resignationForHr,'Approve resignation',true);
    await resignationForHr.getByText('hr_approved',{exact:true}).waitFor();
    await api(hr,'/admin/salary',200,'POST',{user_id:id,month:8,year:2043,base_salary:75000});
    await act(hr,resignationForHr,'View settlement');
    const settlement = hr.getByRole('dialog',{name:'Final settlement'});
    await settlement.getByRole('button',{name:'Approve settlement',exact:true}).click();
    await settlement.getByLabel('Payment reference').fill('QA reference ' + engine);
    await settlement.getByRole('button',{name:'Record settlement payment',exact:true}).click();
    await settlement.getByText('disbursed',{exact:true}).waitFor();
    await settlement.getByText('QA reference '+engine,{exact:true}).waitFor();
    await settlement.getByRole('button',{name:'Close settlement'}).click();

    await open(employee,'confidential-cases');
    await create(employee,'File confidential complaint',{incident_date:'2025-12-10',complaint_type:'other',
      is_anonymous:'no',description:marker});
    const personalCase = await find(employee,marker);
    assert.equal(await personalCase.getByRole('button',{name:'Begin review'}).count(),0);
    await open(admin,'confidential-cases');
    const intake = await find(admin,marker);
    await act(admin,intake,'Assign reviewer');
    const assignment = admin.getByRole('dialog',{name:'Assign reviewer'});
    await assignment.getByLabel('Reviewer employee ID').fill(String(hrId));
    await assignment.getByRole('button',{name:'Assign reviewer',exact:true}).click();
    await admin.getByText('No records match your search.').waitFor();
    await open(hr,'confidential-cases');
    const assigned = await find(hr,marker);
    await act(hr,assigned,'Begin review');
    await assigned.getByText('under_review',{exact:true}).waitFor();
    await act(hr,assigned,'Resolve case');
    const resolution = hr.getByRole('dialog',{name:'Resolve case'});
    await resolution.getByLabel('Case resolution').fill('Review fixture resolved.');
    await resolution.getByRole('button',{name:'Resolve case',exact:true}).click();
    await assigned.getByText('resolved',{exact:true}).waitFor();
    console.log('PASS',engine,viewport.width,'travel cancellation and review, shift review, exit settlement, and confidential assignment');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
