const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.addInitScript(() => { window.print = () => { window.didPrint = true; }; });
    await page.goto(base + '/login.html', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email address').fill('admin@wip.com');
    await page.getByLabel('Password', { exact: true }).fill('P123/');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/admin-dashboard.html', { waitUntil: 'commit' });
    await page.goto(base + '/profile.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#idName').filter({ hasText: 'System Administrator' }).waitFor();
    const photo = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPgKjwERAwQCgAf2gT1XacT8wAAAABJRU5ErkJggg==';
    await page.locator('#photoInput').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
    await page.waitForFunction(() => document.querySelector('#idPhotoWrap img')?.naturalWidth === 2);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const sizes = await page.locator('#idCardEl').evaluate(card => {
        const grid = card.querySelector('.id-grid').getBoundingClientRect();
        const field = card.querySelector('.id-field').getBoundingClientRect();
        const photo = card.querySelector('.id-photo').getBoundingClientRect();
        return { left: grid.left, right: grid.right, top: grid.top, photoBottom: photo.bottom,
          width: grid.width, field: field.width, scroll: card.scrollWidth, visible: card.clientWidth };
      });
      assert(sizes.left >= 0 && sizes.right <= width && sizes.scroll <= sizes.visible + 1);
      assert(sizes.top > sizes.photoBottom && sizes.field >= 90 && sizes.width / sizes.field < 2.2, JSON.stringify(sizes));
      if (width === 390 && process.env.WFI_MOBILE_CARD_SAMPLE)
        await page.locator('#idCardEl').screenshot({ path: process.env.WFI_MOBILE_CARD_SAMPLE });
      console.log('PASS', engine, width, 'ID card layout');
    }
    await page.getByRole('button', { name: 'Print ID card', exact: true }).click();
    assert(await page.evaluate(() => window.didPrint));
    await page.emulateMedia({ media: 'print' });
    assert(await page.locator('#idCardEl').isVisible());
    assert.equal(await page.locator('#idcardSection').evaluate(section => getComputedStyle(section).borderTopWidth), '0px');
    for (const selector of ['.wfi-unified-header', '#avatarWrap', '.id-card-actions', '.wiq-footer'])
      assert.equal(await page.locator(selector).first().isVisible(), false, selector);
    if (process.env.WFI_NATIVE_PRINT_SAMPLE && engine === 'chromium') {
      await page.pdf({ path: process.env.WFI_NATIVE_PRINT_SAMPLE, format: 'A4' });
    }
    await page.emulateMedia({ media: 'screen' });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
    const saved = await download;
    assert.equal(saved.suggestedFilename(), 'employee-id-card.pdf');
    const data = fs.readFileSync(await saved.path());
    assert.equal(data.subarray(0, 5).toString(), '%PDF-');
    if (process.env.WFI_ID_CARD_SAMPLE) fs.writeFileSync(process.env.WFI_ID_CARD_SAMPLE, data);
    console.log('PASS', engine, 'native print isolation and authenticated PDF download');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
