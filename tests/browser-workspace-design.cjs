const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const { base, chromiumOptions } = require('./support/browser-target.cjs');

const dashboards = [
  ['admin@wip.com', 'admin-dashboard.html', 'Admin dashboard'],
  ['employee@wfintelligence.com', 'employee-dashboard.html', 'Employee dashboard'],
  ['manager@wfintelligence.com', 'manager.html', 'Manager workspace'],
  ['hr@wfintelligence.com', 'admin-dashboard.html', 'HR dashboard'],
];

(async () => {
  const engine = process.env.ENGINE || 'chromium';
  const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch(chromiumOptions);
  try {
    for (const [email, dashboard, heading] of dashboards) {
      const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(base + '/login.html');
      await page.getByLabel('Email address').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('P123/');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL('**/' + dashboard);
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await page.locator('.stat-card').first().waitFor();
      await page.locator('[data-workspace-greeting]').waitFor();
      if (heading === 'HR dashboard') {
        assert.equal(await page.getByRole('link', { name: 'Feedback history', exact: true }).count(), 0);
      }
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert(await page.evaluate(() => {
          const hero = document.querySelector('.wfi-page-lead');
          return getComputedStyle(hero).borderInlineStartWidth === '4px' &&
            document.documentElement.scrollWidth <= innerWidth + 2;
        }), heading + ' at ' + width);
      }
      if (heading !== 'Admin dashboard') {
        await page.close();
        continue;
      }
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + '/modules.html');
        const moduleSearch = page.getByLabel('Find a module');
        await page.getByRole('button', { name: 'People', exact: true }).click();
        await moduleSearch.fill('details without a matching module');
        await page.getByRole('status').filter({ hasText: 'No matching modules.' }).waitFor();
        await page.getByRole('button', { name: 'Clear filters' }).click();
        assert.equal(await moduleSearch.inputValue(), '');
        assert.equal(await page.getByRole('button', { name: 'All modules', exact:true }).getAttribute('aria-pressed'), 'true');
        assert(await moduleSearch.evaluate(input => input === document.activeElement));
        await moduleSearch.fill('Employee directory');
        await page.getByRole('status').filter({ hasText: '1 module found' }).waitFor();
        await page.getByRole('link', { name: 'Employee directory', exact: true }).click();
        await page.getByRole('row').nth(2).waitFor();
        const recordSearch = page.getByLabel('Search records');
        await recordSearch.fill('no records with this text');
        await page.getByText('No records match your search.').waitFor();
        await page.getByRole('button', { name: 'Clear search' }).click();
        assert(await recordSearch.evaluate(input => input === document.activeElement));
        await page.getByRole('row').nth(2).waitFor();
        const styles = await page.evaluate(() => {
          window.WorkforceAppearance.apply('dark', 'default');
          const row = document.querySelector('tbody tr:nth-child(2)');
          const surface = getComputedStyle(row);
          // Compare the actual stripe and text colors using their rendered RGB channels.
          const context = document.createElement('canvas').getContext('2d');
          function luminance(color) {
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0,3).map(value => value / 255);
            return channels.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
              .reduce((total,value,index) => total + value * [.2126,.7152,.0722][index], 0);
          }
          function ratio(text, background) {
            const first = luminance(text);
            const second = luminance(background);
            return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
          }
          const button = getComputedStyle(row.querySelector('button'));
          return {
            rowContrast: ratio(getComputedStyle(row.firstElementChild).color, surface.backgroundColor),
            buttonContrast: ratio(button.color, button.backgroundColor),
            dark: luminance(surface.backgroundColor),
            fits: document.documentElement.scrollWidth <= innerWidth + 2
          };
        });
        assert(styles.dark < .3 && styles.rowContrast >= 4.5 && styles.buttonContrast >= 4.5 && styles.fits, JSON.stringify(styles));
        console.log('PASS', engine, width, 'module and record search recovery, dark-mode contrast');
      }
      await page.close();
    }
    console.log('PASS', engine, 'four role dashboards at phone, tablet and desktop widths');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
