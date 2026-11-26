const assert = require('node:assert/strict');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');
(async()=>{
 const engine=process.env.ENGINE || 'chromium';
 const browser=engine==='webkit'?await webkit.launch():await chromium.launch({...chromiumOptions});
 try {
  const page=await browser.newPage();
  await page.goto(base+'/login.html');
  if(await page.locator('#code').count()){
   const code=require('dotenv').parse(require('fs').readFileSync('.env')).DEMO_ACCESS_CODE;
   await page.getByLabel('Access code').fill(code);await page.getByRole('button',{name:'Open demo'}).click();
  }
  await page.goto(base+'/index.html');
  await page.getByRole('heading',{name:'Workforce Intelligence',exact:true}).waitFor();
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   assert.equal(await page.locator('.home-card').count(),6);
  }
  await page.goto(base+'/login.html');
  await page.getByLabel('Email address').fill('admin@wip.com');await page.getByLabel('Password',{exact:true}).fill('P123/');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin-dashboard.html');
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.goto(base+'/index.html');
   await page.getByRole('link',{name:'Open my dashboard',exact:true}).waitFor();
   assert.equal(await page.getByRole('link',{name:'Open my dashboard'}).getAttribute('href'),'/admin-dashboard.html');
   await page.screenshot({path:'/tmp/workforce-home-'+engine+'-'+width+'.png'});
   if(process.env.WFI_PUBLIC_READ_ONLY){console.log('PASS',engine,width,'public and authenticated home layout');continue;}
   await page.getByRole('link',{name:'Open my dashboard'}).click();
   await page.getByRole('button',{name:'👥 Users',exact:true}).click();
   const rows=page.locator('#userTableBody .wfi-record-row');await rows.first().waitFor();
   if(width<=1000)assert.equal(await rows.first().evaluate(e=>getComputedStyle(e).display),'grid');
   const fixture=rows.filter({hasText:'finance-ready@example.test'}).first();
   await fixture.locator('.btn-edit').click();
   await page.locator('#editUserModal').waitFor({state:'visible'});
   const phone='555000'+width;
   await page.locator('#editPhone').fill(phone);
   const fits=await page.locator('#editUserModal .modal-box').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;});assert(fits);
   await page.screenshot({path:'/tmp/workforce-edit-'+engine+'-'+width+'.png'});
   const saved=page.waitForResponse(r=>r.url().includes('/api/admin/users/') && r.request().method()==='PATCH');
   await page.locator('#editUserModal').getByRole('button',{name:'Save Changes',exact:true}).click();
   assert((await saved).ok());
   await page.locator('#editUserModal').waitFor({state:'hidden'});
   await page.reload();
   await page.getByRole('button',{name:'👥 Users',exact:true}).click();
   await page.locator('#userTableBody tr').filter({hasText:'finance-ready@example.test'}).locator('.btn-edit').click();
   assert.equal(await page.locator('#editPhone').inputValue(),phone);
   await page.locator('#editUserModal').getByRole('button',{name:'Cancel',exact:true}).click();
   console.log('PASS',engine,width,'public home, account home, labeled record cards and edit form');
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
