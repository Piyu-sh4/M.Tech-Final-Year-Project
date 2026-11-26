const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

async function login(page, email) {
  await page.goto(base+'/login.html');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('P123/');
  await page.locator('#loginBtn').click();
  await page.waitForURL(/dashboard\.html/);
}

(async()=>{
  const browser = process.env.ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch({
    ...chromiumOptions,
  });
  try {
    const page = await browser.newPage({viewport:{width:320,height:850}});
    await page.addInitScript(()=>{
      // Exercise the fallback in browsers that restrict clipboard access.
      Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Clipboard unavailable');}}});
    });
    await login(page,'admin@wip.com');
    await page.getByRole('link',{name:'Build requests',exact:true}).click();
    const pickNext = page.getByRole('button',{name:'Pick up next request',exact:true});
    const emptyHint = page.getByText('No queued requests to pick up. Refresh to check for new submissions.');
    await emptyHint.waitFor();
    assert(await pickNext.isDisabled());
    const marker = 'Build request browser check '+Date.now();
    await page.getByLabel('Title',{exact:true}).fill(marker);
    await page.getByLabel('Instructions',{exact:true}).fill('Implement the task and test narrow screens.');
    await page.getByLabel('Acceptance criteria (optional)').fill('Results include a browser check.');
    await page.getByRole('button',{name:'Submit request',exact:true}).click();
    const detail = page.locator('#build-detail');
    await detail.getByRole('heading',{name:new RegExp(marker)}).waitFor();
    const queue = page.getByRole('region',{name:'Request queue'});
    const queueItem = queue.getByRole('listitem').filter({hasText:marker});
    assert.equal(await queueItem.locator('.build-status').textContent(),'Queued');
    const queued = queue.getByRole('button',{name:/^Queued \([1-9][0-9]*\)$/});
    await queued.click();
    await queue.locator('button[data-status=queued][aria-pressed=true]').waitFor();
    assert(await pickNext.isEnabled());
    // Simulate another admin claiming the last item just before this pickup.
    const nextRoute = '**/api/build-requests/claim-next';
    await page.route(nextRoute, route=>route.fulfill({status:404,json:{message:'There are no queued build requests.'}}));
    await pickNext.click();
    await page.getByText('No queued requests were available. The queue has been refreshed.').waitFor();
    await page.unroute(nextRoute);
    await pickNext.click();
    await detail.getByText(/In progress · Revision 2/).waitFor();
    await queueItem.waitFor({state:'hidden'});
    await emptyHint.waitFor();
    assert(await pickNext.isDisabled());
    await queue.getByRole('button',{name:/^In progress \([1-9][0-9]*\)$/}).click();
    await queueItem.locator('.build-status').filter({hasText:'In progress'}).waitFor();
    await detail.getByText('Add follow-up',{exact:true}).click();
    await detail.getByLabel('Further instructions').fill('Include a tablet check.');
    await detail.getByRole('button',{name:'Save follow-up'}).click();
    await detail.getByText('Include a tablet check.',{exact:true}).waitFor();
    await detail.getByRole('button',{name:'Copy prompt for Codex'}).click();
    const prompt = await detail.getByLabel('Build request prompt').inputValue();
    assert.match(prompt,/revision 3/);
    assert.match(prompt,/Results include a browser check/);
    assert.match(prompt,/Include a tablet check/);

    for (const width of [320,768,1440]) {
      await page.setViewportSize({width,height:850});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2),'Layout overflow at '+width);
    }

    await detail.getByText('Submit result for review',{exact:true}).click();
    await detail.getByLabel('Changes and test results').fill('Verified phone, tablet and desktop.');
    await detail.getByLabel('GitHub commit or pull request URL (optional)').fill(
      'https://github.com/Bharatasya-IT-Solutions/workforce-intelligence/commit/e5431b4');
    await detail.getByRole('button',{name:'Submit result',exact:true}).click();
    await detail.getByRole('link',{name:'Open commit or pull request'}).waitFor();
    await detail.getByRole('button',{name:'Mark review complete'}).click();
    await detail.getByText(/Completed · Revision 5/).waitFor();
    await page.reload();
    await page.getByRole('button',{name:new RegExp(marker)}).click();
    await detail.getByText('Verified phone, tablet and desktop.',{exact:true}).waitFor();

    const employee = await browser.newPage();
    await login(employee,'employee@wfintelligence.com');
    await employee.goto(base+'/build-requests.html');
    await employee.getByText('Administrator access is required.',{exact:true}).waitFor();
    assert.equal(await employee.locator('#build-workspace').isVisible(),false);
    console.log('PASS admin submission, pickup, prompt, follow-up, evidence, review, reload and employee access denial');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
