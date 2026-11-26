const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');
const stamp = process.env.WFI_TEST_ID || 'Finance E2E ' + Date.now();
const access = process.env.DEMO_ACCESS_CODE || (fs.existsSync('.env') ? fs.readFileSync('.env','utf8').match(/^DEMO_ACCESS_CODE=(.+)$/m)?.[1] : undefined);
const engine = process.env.ENGINE || 'chromium';
const accounts = {admin:'admin@wip.com',manager:'manager@wfintelligence.com',hr:'hr@wfintelligence.com',employee:'employee@wfintelligence.com',finance:'finance-ready@example.test'};
const errors = [];

async function fit(page) {
  const size = await page.evaluate(() => ({viewport:document.documentElement.clientWidth,width:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)}));
  assert(size.width <= size.viewport+2, 'Page overflow at ' + page.url() + ': ' + JSON.stringify(size));
}
async function open(page,slug,title) {
  await page.goto(base+'/'+slug+'.html');
  await page.getByRole('heading',{name:title,exact:true}).waitFor();
  await page.waitForFunction(() => document.getElementById('message')?.dataset.error !== undefined && !document.getElementById('message').textContent.startsWith('Loading'));
  assert.equal(await page.locator('#message').getAttribute('data-error'),'false',await page.locator('#message').textContent());
  await fit(page);
}
async function state(browser,email,password = 'P123/') {
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(base+'/login.html');
  if(await page.locator('#code').count()) {
    await page.getByLabel('Access code').fill(access);
    await page.getByRole('button',{name:'Open demo'}).click();
  }
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.waitForURL(/(?:admin-dashboard|employee-dashboard|manager)\.html/);
  const saved=await context.storageState();await context.close();return saved;
}
async function row(page,text) {
  await page.getByLabel('Search records').fill(text);
  const record=page.getByRole('row').filter({hasText:text}).first();await record.waitFor();return record;
}
async function saved(page,text) { await page.locator('#message').filter({hasText:text}).waitFor(); }
async function api(page,route,method='GET',payload) {
  return page.evaluate(async ({route,method,payload}) => {
    const response=await fetch('/api'+route,{method,headers:{Authorization:'Bearer '+localStorage.getItem('token'),'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});
    return {status:response.status,data:await response.json()};
  },{route,method,payload});
}
(async()=>{
 const browser=engine==='webkit' ? await webkit.launch() : await chromium.launch({...chromiumOptions,headless:true});
 try {
  const states={admin:await state(browser,accounts.admin)};
  const setup=await browser.newContext({storageState:states.admin});
  const adminPage=await setup.newPage();await adminPage.goto(base+'/modules.html');
  const email='browser-finance-'+engine+'-'+Date.now()+'@example.test';
  const password='BrowserTest123!';
  const fullName="Demo Finance O'Neil "+engine+' '+Date.now();
  let result=await api(adminPage,'/auth/register','POST',{full_name:fullName,email,password,role_id:2});
  assert.equal(result.status,201);const id=result.data.user_id;
  const managers=await api(adminPage,'/admin/users');
  const assigned=managers.data.find(user=>user.email===accounts.manager);
  result=await api(adminPage,'/admin/users/'+id,'PATCH',{base_salary:75000,join_date:'2022-04-01',department_id:assigned.department_id,reporting_manager_id:assigned.user_id});
  assert.equal(result.status,200,result.data.message);
  result=await api(adminPage,'/admin/users/'+id+'/approve','PATCH',{});assert.equal(result.status,200);
  result=await api(adminPage,'/admin/users/'+id+'/permissions','PUT',{can_request_advance:1,can_use_chat:1,can_clock_in_out:1,can_view_salary:1});assert.equal(result.status,200);
  await setup.close();
  for(const [role,address] of Object.entries(accounts)) if(role!=='admin') states[role]=await state(browser,role==='finance'?email:address,role==='finance'?password:'P123/');
  let previouslyApprovedAdvance = 0;
  for(const width of [390,1440]) {
    const contexts={},pages={};
    for(const role of ['admin','manager','hr','finance','employee']) {
      const context=await browser.newContext({storageState:states[role],viewport:{width,height:900},hasTouch:width<600});
      context.setDefaultTimeout(15000);
      contexts[role]=context; pages[role]=await context.newPage();
      pages[role].on('pageerror',error=>errors.push(error.message));
    }
    const person=pages.finance, admin=pages.admin, hr=pages.hr, manager=pages.manager;
    const marker=stamp+' '+engine+' '+width;
    const fy=width===390?'2026-27':'2025-26';
    await open(person,'bank-directory','Bank directory');
    await person.getByLabel('Search records').fill('State Bank of India');
    const bank=person.getByRole('row').filter({hasText:'State Bank of India'});
    assert.match(await bank.getByRole('link',{name:'Visit bank'}).getAttribute('href'),/sbi\.bank\.in/);
    await person.getByLabel('Search records').fill('');
    await person.getByRole('button',{name:'Next',exact:true}).click();
    assert.match(await person.locator('#page-indicator').textContent(),/Page 2 of/);
    await person.getByRole('button',{name:'Previous',exact:true}).click();
    await open(person,'credit-score','Credit report and financial wellness');
    assert.equal(await person.getByRole('link',{name:'CIBIL report'}).getAttribute('href'),'https://www.cibil.com/freecibilscore');
    await person.getByLabel('Credit score',{exact:true}).fill(width===390?'775':'785');
    await person.getByRole('button',{name:'Save reported score'}).click();
    await person.getByRole('status').filter({hasText:'Self-reported credit score saved'}).waitFor();
    await person.reload(); await person.getByLabel('Credit score',{exact:true}).waitFor();
    assert.equal(await person.getByLabel('Credit score',{exact:true}).inputValue(),width===390?'775':'785');
    await open(person,'tax-portal','Income tax');
    assert.match(await person.getByRole('link',{name:'Income tax filing and payment'}).getAttribute('href'),/^https:\/\/www\.incometax\.gov\.in\//);
    await person.getByLabel('Annual salary for estimate').fill('1275000');
    await person.getByRole('button',{name:'Estimate tax',exact:true}).click();
    await person.getByRole('status').filter({hasText:'Estimate ready.'}).waitFor();
    const annual=person.locator('.finance-metrics > div').filter({has:person.getByText('Annual tax',{exact:true})});
    assert.match(await annual.textContent(),/₹0\.00/);
    await person.getByRole('button',{name:'Save tax declaration'}).click();
    const form=person.getByRole('dialog');
    await form.getByLabel('Financial year',{exact:true}).fill(fy);
    await form.getByLabel('Annual salary income').fill('900000');
    await form.getByRole('button',{name:'Save',exact:true}).click();await saved(person,'Draft saved');
    const taxrow=await row(person,fy);
    await taxrow.getByRole('button',{name:'Submit for review'}).click();await saved(person,'Declaration submitted');
    await open(hr,'tax-portal','Income tax');
    await hr.getByLabel('Search records').fill(fullName);
    const review=hr.getByRole('row').filter({hasText:fullName}).filter({hasText:fy});
    await review.getByRole('button',{name:'Approve declaration'}).click();await saved(hr,'Declaration approved');
    await person.reload();await row(person,fy);assert.match(await (await row(person,fy)).textContent(),/approved/);
    await open(person,'loan-portal','Loan applications');
    await person.getByRole('button',{name:'Calculate EMI',exact:true}).click();
    await person.getByRole('status').filter({hasText:'Estimate ready. The final installment'}).waitFor();
    await person.getByRole('button',{name:'Apply for employee loan'}).click();
    await person.getByRole('dialog').getByLabel('Requested amount').fill('120000');
    await person.getByRole('dialog').getByLabel('Repayment months').fill('12');
    await person.getByRole('dialog').getByLabel('Purpose',{exact:true}).fill(marker);
    await person.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(person,'Loan application submitted');
    for(const [role,page] of [['manager',manager],['hr',hr],['admin',admin]]) {
      await open(page,'loan-portal','Loan applications');
      const record=await row(page,marker);
      await record.getByRole('button',{name:'Approve '+role+' review',exact:true}).click();
      await saved(page,'Loan approved by '+role);
    }
    await (await row(admin,marker)).getByRole('button',{name:'Record disbursement'}).click();await saved(admin,'Disbursement and repayment');
    await person.reload();
    await (await row(person,marker)).getByRole('button',{name:'Repayments',exact:true}).click();
    await person.getByRole('dialog').locator('li').first().waitFor();
    assert.equal(await person.getByRole('dialog').locator('li').count(),12);
    await person.getByRole('dialog').getByRole('button',{name:'Close repayments'}).click();
    await (await row(admin,marker)).getByRole('button',{name:'Repayments',exact:true}).click();
    const repayments=admin.getByRole('dialog');
    await repayments.locator('li').first().waitFor(); assert.equal(await repayments.locator('li').count(),12);
    await repayments.getByRole('button',{name:'Record installment 1 paid',exact:true}).click();
    await repayments.getByRole('status').filter({hasText:'Repayment recorded'}).waitFor();
    await repayments.getByRole('button',{name:'Record full settlement'}).click();
    await repayments.getByRole('status').filter({hasText:'Settlement recorded'}).waitFor();
    await repayments.getByRole('button',{name:'Close repayments'}).click();
    await (await row(admin,marker)).getByText('foreclosed',{exact:true}).waitFor();
    await person.reload();assert.match(await (await row(person,marker)).textContent(),/foreclosed/);
    await open(person,'document-vault','Document register');
    await person.getByRole('button',{name:'Upload document'}).click();
    await person.getByRole('dialog').getByLabel('Document name').fill(marker);
    await person.getByRole('dialog').getByLabel('PDF or image').setInputFiles(path.join(process.cwd(),'frontend/assets/demo-workforce-handbook.pdf'));
    await person.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(person,'Document uploaded');
    const doc=await row(person,marker);
    const download=person.waitForEvent('download');await doc.getByRole('button',{name:'Download file'}).click();
    assert.equal(fs.readFileSync(await (await download).path()).subarray(0,5).toString(),'%PDF-');
    await doc.getByRole('button',{name:'Share with HR'}).click();await saved(person,'Document shared with HR');
    await open(hr,'document-vault','Document register');
    await (await row(hr,marker)).getByRole('button',{name:'Verify document'}).click();await saved(hr,'Document verified');
    await person.reload();assert.match(await (await row(person,marker)).textContent(),/verified/);
    await open(person,'goals-okr','Goals and key results');
    await person.getByRole('button',{name:'Add record',exact:true}).click();
    const unicode=marker+' café — दिल्ली';
    await person.getByRole('dialog').getByLabel('Objective',{exact:true}).fill(unicode);
    for(const [name,value] of Object.entries({metric:'Handbook progress',baseline:'0',target:'100',actual:'25'}))await person.getByRole('dialog').locator('[name="'+name+'"]').fill(value);
    await person.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(person,'Record saved');
    assert((await (await row(person,unicode)).textContent()).includes(unicode));
    const csv=person.waitForEvent('download');await person.getByRole('button',{name:'Export CSV'}).click();
    const bytes=fs.readFileSync(await (await csv).path());assert.equal(bytes.subarray(0,3).toString('hex'),'efbbbf');assert(bytes.toString().includes(unicode));
    await fit(person);
    const day=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
    const offset=width===390?30:35;
    const holidays=(await api(admin,'/modules/data/holidays')).data;
    let holidayOffset=offset+60+(engine==='webkit'?180:0);
    while(holidays.some(row=>row.holiday_date.slice(0,10)===day(holidayOffset))) holidayOffset++;
    const cases=[
      ['dependents','Dependents','Add dependent',person,{name:marker,relation:'other',dob:'2010-01-01'}],
      ['leave','Leave requests','Request leave',person,{leave_type:'casual',from_date:day(offset),to_date:day(offset),reason:marker}],
      ['expenses','Expense claims','Submit expense',person,{expense_date:day(0),category:'equipment',amount:'109.25',description:marker}],
      ['travel','Travel requests','Request travel',person,{travel_type:'domestic',from_location:'Demo HQ',to_location:'Demo North',travel_date:day(offset+10),return_date:day(offset+11),purpose:marker,estimated_cost:'500'}],
      ['salary-advance','Salary advances','Request an advance',person,{percentage:'10',reason:marker}],
      ['holiday-calendar','Holiday calendar','Add holiday',admin,{name:marker,holiday_date:day(holidayOffset),holiday_type:'optional',description:marker}],
      ['employee-referral','Employee referrals','Submit referral',person,{referral_name:marker,referral_email:'referral-'+engine+'-'+width+'@example.test',relationship:'Professional contact',cover_note:marker}],
      ['assets','Asset register','Add asset',admin,{asset_code:'UI-'+engine+'-'+width+'-'+Date.now().toString(36),asset_name:marker,category:'monitor',location:'Demo HQ'}],
      ['cab-booking','Cab bookings','Book a cab',person,{booking_date:day(offset+20),trip_type:'pickup'}],
      ['meetings','Meetings','Schedule meeting',person,{title:marker,scheduled_at:day(offset)+'T10:30',duration_mins:'30',meeting_type:'internal',description:marker}],
      ['family-transfer','Transfer requests','Request transfer',person,{transfer_type:'personal',from_location:'Demo HQ',to_location:'Demo North',reason:marker,preferred_date:day(offset+30)}],
      ['exit','Exit requests','Submit demo resignation',person,{reason:'personal',comments:marker,last_working_day:day(offset+90)}]
    ];
    const definitions=(await api(person,'/modules')).data;
    const adminDefinitions=(await api(admin,'/modules')).data;
    for(const [slug,title,button,page,values] of cases) {
      await open(page,slug,title);
      await page.getByRole('button',{name:button,exact:true}).click();
      const dialog=page.getByRole('dialog');
      const definition=(page===admin?adminDefinitions:definitions).find(item=>item.slug===slug).form;
      for(const field of definition.fields) {
        const input=dialog.locator('[name="'+field.key+'"]');
        if(values[field.key]!==undefined) {
          if(field.type==='select'||field.type==='lookup') await input.selectOption(values[field.key]);
          else await input.fill(values[field.key]);
        } else if(field.type==='lookup') await input.selectOption({index:0});
      }
      let advanceQuote;
      if (slug === 'salary-advance') {
        advanceQuote = (await api(person, '/admin/salary-advances/quote')).data;
        assert(await dialog.getByLabel('Reason for the advance').evaluate(input => input.required));
        await dialog.getByText(/Requested .*Remaining after recovery/).waitFor();
      }
      const responsePromise=page.waitForResponse(response=>new URL(response.url()).pathname==='/api'+definition.path&&response.request().method()==='POST');
      await dialog.getByRole('button',{name:'Save',exact:true}).click();
      const response=await responsePromise;
      assert(response.ok(),slug+' form failed '+response.status()+' '+await response.text());
      const responseBody=await response.json();
      await dialog.waitFor({state:'hidden'});
      await saved(page,responseBody.message || 'Record saved');
      assert.equal(await page.locator('#message').getAttribute('data-error'),'false',slug);
      await fit(page);
      if (advanceQuote) {
        assert.equal(responseBody.amount, Math.floor(Math.round(advanceQuote.payout * 100) * 10 / 100) / 100);
        await open(hr, 'salary-advance', 'Salary advances');
        await (await row(hr, marker)).getByRole('button', { name:'Approve advance' }).click();
        await saved(hr, 'Advance approved');
        const { month, year } = advanceQuote;
        const generation = await api(admin, '/admin/salary/generate', 'POST', { month, year });
        assert.equal(generation.status, 200);
        const pay = (await api(person, '/admin/salary/my')).data.find(entry => entry.month === month && entry.year === year);
        previouslyApprovedAdvance += responseBody.amount;
        assert.equal(Math.round((advanceQuote.payout - previouslyApprovedAdvance) * 100), Math.round(pay.net_salary * 100));
        assert.equal(pay.line_items.filter(item => item.component_name === 'Cash Advance Recovery').length, 1);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        assert.equal(pay.credit_due_on, nextYear + '-' + String(nextMonth).padStart(2, '0') + '-07');
        await fit(hr);
      }
      if (slug === 'expenses') {
        await open(manager,'expenses','Expense claims');
        await (await row(manager,marker)).getByRole('button',{name:'Approve expense'}).click();
        await saved(manager,'Expense claim approved');
        await open(hr,'expenses','Expense claims');
        await (await row(hr,marker)).getByRole('button',{name:'Record payment'}).click();
        await saved(hr,'Expense claim paid');
        await open(person,'expenses','Expense claims');
        assert.match(await (await row(person,marker)).textContent(),/paid/);
      }
      if(slug==='exit') {
        await page.getByRole('button',{name:'Withdraw resignation'}).click();await saved(page,'withdrawn');
      }
      console.log('PASS',engine,width,'form',slug);
    }
    const salary = await api(hr,'/admin/salary','POST',{user_id:id,month:width===390?1:2,year:2041,base_salary:80000});
    assert.equal(salary.status,200);
    await open(person,'payslip-portal','Payslips');
    const receipt = person.waitForEvent('download');
    await (await row(person,'2041')).getByRole('button',{name:'Download PDF'}).click();
    assert.equal(fs.readFileSync(await (await receipt).path()).subarray(0,5).toString(),'%PDF-');
    assert.equal((await api(admin,'/admin/salary/'+salary.data.salary_id,'DELETE')).status,409);
    await person.goto(base+'/salary.html');
    const legacyPayslip = person.locator('#mySlipBody').getByRole('row').filter({hasText:'2041'}).first();
    const openPayslip = legacyPayslip.getByRole('button',{name:'View'});
    await openPayslip.click();
    const legacyDialog = person.getByRole('dialog',{name:'Payslip details'});
    await legacyDialog.getByText(fullName,{exact:true}).waitFor();
    const legacyDownload = person.waitForEvent('download');
    await legacyDialog.getByRole('button',{name:'Download PDF'}).click();
    assert.equal(fs.readFileSync(await (await legacyDownload).path()).subarray(0,5).toString(),'%PDF-');
    await person.keyboard.press('Escape');
    await legacyDialog.waitFor({state:'hidden'});
    await person.waitForFunction(button => document.activeElement === button, await openPayslip.elementHandle());
    await fit(person);

    const unsafe=marker+" <b data-wfi-review>literal</b> 'quoted'";
    const task=await api(person,'/tasks','POST',{title:unsafe,description:unsafe});assert.equal(task.status,201);
    await person.goto(base+'/tasks.html');
    const taskRow=person.getByRole('row').filter({hasText:unsafe});await taskRow.waitFor();
    assert.equal(await person.locator('[data-wfi-review]').count(),0);
    await taskRow.getByText('Task actions',{exact:true}).click();
    await taskRow.getByRole('button',{name:'View',exact:true}).click();
    await person.locator('#detailModal.open').waitFor();assert.equal(await person.locator('[data-wfi-review]').count(),0);
    const project=await api(admin,'/projects','POST',{name:unsafe,description:unsafe,status:'planning'});assert.equal(project.status,200);assert(project.data.project_id);
    await admin.goto(base+'/projects.html');
    const card=admin.locator('.project-card').filter({hasText:unsafe});await card.waitFor();
    assert.equal(await admin.locator('[data-wfi-review]').count(),0);
    await card.getByRole('button',{name:/Details/}).click();
    assert.equal(await admin.locator('[data-wfi-review]').count(),0);
    console.log('PASS',engine,width,'task and project text is rendered literally');
    if(process.env.WFI_SCREENSHOT_DIR) {
      await fs.promises.mkdir(process.env.WFI_SCREENSHOT_DIR,{recursive:true});
      await open(person,'loan-portal','Loan applications');
      await person.screenshot({path:path.join(process.env.WFI_SCREENSHOT_DIR,'workforce-finance-'+engine+'-'+width+'.png'),fullPage:true});
    }
    console.log('PASS',engine,width,'tax, credit, bank links, loan approvals, disbursement, repayments, settlement, documents, Unicode and CSV');
    for(const context of Object.values(contexts))await context.close();
  }
  assert.deepEqual(errors,[]);
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
