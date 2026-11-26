const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

const images = [
  { width: 2, bytes: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPgKjwERAwQCgAf2gT1XacT8wAAAABJRU5ErkJggg==' },
  { width: 3, bytes: 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAEElEQVR4nGPYbegKQQxwFgBKVAcnBNQ6LwAAAABJRU5ErkJggg==' },
];

(async () => {
  const browser = process.env.ENGINE === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    const page = await browser.newPage();
    await page.goto(base + '/login.html', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email address').fill('admin@wip.com');
    await page.getByLabel('Password', { exact: true }).fill('P123/');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/admin-dashboard.html', { waitUntil: 'commit' });
    const photoIsVisible = width => page.waitForFunction(expected => {
      const avatar = document.querySelector('#avatarWrap img');
      const card = document.querySelector('#idPhotoWrap img');
      return avatar?.complete && avatar.naturalWidth === expected && avatar.getBoundingClientRect().width > 0 &&
        card?.complete && card.naturalWidth === expected;
    }, width);
    for (const [index, width] of [390, 1440].entries()) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/profile.html', { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'System Administrator', exact: true }).waitFor();
      const sample = images[index];
      await page.locator('#photoInput').setInputFiles({
        name: 'synthetic-profile.png', mimeType: 'image/png', buffer: Buffer.from(sample.bytes, 'base64'),
      });
      await photoIsVisible(sample.width);
      await page.getByRole('status').filter({ hasText: 'Photo updated.' }).waitFor();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await photoIsVisible(sample.width);
      console.log('PASS', width, 'photo and ID card render immediately and after reload');
    }
    await page.locator('#photoInput').setInputFiles({
      name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('This is not an image.'),
    });
    await page.getByRole('status').filter({ hasText: 'Choose a JPEG, PNG, or WebP image.' }).waitFor();
    await photoIsVisible(3);
    console.log('PASS invalid upload preserves the last visible photo');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
