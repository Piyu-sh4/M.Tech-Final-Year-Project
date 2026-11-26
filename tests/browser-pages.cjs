const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium,webkit} = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const catalog = require('../backend/config/moduleCatalog');
const { base, chromiumOptions } = require('./support/browser-target.cjs');
const widths = (process.env.WFI_WIDTHS || '320,768,1440').split(',').map(Number);
const paths = [...new Set([...fs.readdirSync('frontend').filter(file=>file.endsWith('.html')),...Object.keys(catalog).map(slug=>slug+'.html'),'showcase.html'])];
const code = process.env.DEMO_ACCESS_CODE || (fs.existsSync('.env') ? fs.readFileSync('.env','utf8').match(/^DEMO_ACCESS_CODE=(.+)$/m)?.[1] : undefined);
const engine = process.env.ENGINE || 'chromium';
(async()=>{
 const browser=engine==='webkit' ? await webkit.launch() : await chromium.launch({...chromiumOptions,headless:true});
 try {
  const context=await browser.newContext({serviceWorkers:'block'});
  const auth=await context.newPage();
  await auth.goto(base+'/login.html');
  if(await auth.locator('#code').count()) {
    await auth.getByLabel('Access code').fill(code);
    await auth.getByRole('button',{name:'Open demo'}).click();
  }
  await auth.getByLabel('Email address').fill('admin@wip.com');
  await auth.getByLabel('Password',{exact:true}).fill('P123/');
  await auth.getByRole('button',{name:'Sign in',exact:true}).click();
  await auth.waitForURL('**/admin-dashboard.html');
  const jobs=widths.flatMap(width=>paths.map(file=>({width,file})));
  const results=[];
  await Promise.all(Array.from({length:4},async()=>{
    const page=await context.newPage();
    for(let job;(job=jobs.shift());) {
      const errors=[];const watch=error=>errors.push(error.message);
      page.on('pageerror',watch);
      const started=Date.now();
      try {
        await page.setViewportSize({width:job.width,height:900});
        const response=await page.goto(base+'/'+job.file,{waitUntil:'domcontentloaded',timeout:20000});
        assert(response.status()<400,'HTTP '+response.status());
        if(await page.locator('script[src="/modules.js"]').count()) await page.waitForFunction(()=>document.querySelector('#message')?.dataset.error !== undefined && !document.querySelector('#message').textContent.startsWith('Loading'),{},{timeout:15000});
        else if (job.file === 'admin-dashboard.html') await page.waitForFunction(()=>/^\d+$/.test(document.querySelector('#statUsers')?.textContent || ''));
        else if (job.file === 'application-settings.html') await page.locator('#connection-ip').filter({hasText:'Connection IP:'}).waitFor();
        else await page.waitForLoadState('load');
        if(engine==='webkit') await page.waitForLoadState('networkidle',{timeout:2500}).catch(()=>{});
        if(await page.locator('#message[data-error="true"]').count()) errors.push(await page.locator('#message').textContent());
        const state=await page.evaluate(()=>({screen:document.documentElement.clientWidth,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
          missingActions:[...document.querySelectorAll('button[onclick],a[onclick]')].filter(element=>element.getClientRects().length && !element.closest('[inert]')).flatMap(element=>{const match=element.getAttribute('onclick').match(/^\s*(?:return\s+)?([A-Za-z_$][\w$]*)\s*\(/);return match && !['if','confirm','alert'].includes(match[1]) && typeof window[match[1]]!=='function'?[{name:match[1],label:element.textContent.trim()}]:[];}),
          garbled:/\uFFFD|Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|â(?:€|™|œ)|ðŸ/.test(document.body.innerText)}));
        if(state.scroll>state.screen+2) errors.push('Horizontal overflow '+state.scroll+'/'+state.screen);
        if(state.missingActions.length) errors.push('Missing actions: '+JSON.stringify(state.missingActions));
        const theme = await page.evaluate(()=>({count:document.querySelectorAll('link[href="/theme.css"]').length, fonts:[document.body,...document.querySelectorAll('h1,h2,label,button,input')].filter(e=>e.getClientRects().length).map(e=>getComputedStyle(e).fontFamily)}));
        if(theme.count!==1 || new Set(theme.fonts).size!==1) errors.push('Central theme or font mismatch '+JSON.stringify(theme));
        const clippedControls = await page.evaluate(()=>[...document.querySelectorAll('main button,main input,main select,main textarea,.dashboard button,.dashboard input,.dashboard select')].filter(e=>e.getClientRects().length && !e.closest('[inert]')).filter(e=>{const rect=e.getBoundingClientRect();return rect.width>0 && (rect.left < -2 || rect.right > innerWidth+2) && !e.closest('.wfi-table-scroll,.table-wrap');}).map(e=>e.id || e.textContent.trim().slice(0,40)));
        if(clippedControls.length) errors.push('Controls outside viewport: '+JSON.stringify(clippedControls));
        if(state.garbled) errors.push('Garbled text detected');
        const header=await page.evaluate(()=>{const list=document.querySelectorAll('.wfi-unified-header');const b=list[0]?.querySelector('.wfi-header-brand');return {count:list.length,brandHeight:b?.getBoundingClientRect().height,brandWidth:b?.clientWidth,brandScroll:b?.scrollWidth};});
        const menu=page.locator('.wfi-unified-header .wfi-mobile-menu, .wfi-unified-header .wfi-header-toggle');
        if(await menu.count() && await menu.isVisible()){assert.equal(await menu.evaluate(e=>getComputedStyle(e).fontSize),'0px','Compact menu label must stay visually hidden');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');}
        if(await page.locator('[data-legacy-nav]').count() && await page.locator('[data-legacy-nav]').isVisible())errors.push('Legacy header is still visible');
        if(!['grid','flex'].includes(await page.locator('.wfi-unified-header').evaluate(e=>getComputedStyle(e).display))) errors.push('Shared header styling missing');
        if(header.count!==1)errors.push('Expected one shared header, found '+header.count);
        if(header.brandHeight>45 || header.brandScroll>header.brandWidth+2)errors.push('Brand wrapping or clipping '+JSON.stringify(header));
        results.push({...job,...state,ms:Date.now()-started,errors});
      } catch(error) {results.push({...job,ms:Date.now()-started,errors:[...errors,error.message.split('\n')[0]]});}
      page.off('pageerror',watch);
      if(results.length%50===0)console.log('Checked',results.length,'page and viewport combinations');
    }
    await page.close();
  }));
  fs.writeFileSync(process.env.WFI_PAGE_RESULTS || '/tmp/wfi-browser-pages-'+engine+'.json',JSON.stringify(results,null,2));
  for(const width of widths) {
    const rows=results.filter(row=>row.width===width),timings=rows.map(row=>row.ms).sort((a,b)=>a-b);
    console.log(engine,width,rows.length,'pages',rows.filter(row=>row.errors.length).length,'failures','p95',timings[Math.floor(timings.length*.95)]+'ms');
  }
  const failures=results.filter(row=>row.errors.length);
  for(const failure of failures)console.log(JSON.stringify(failure));
  assert.equal(failures.length,0,'Page audit failures');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
