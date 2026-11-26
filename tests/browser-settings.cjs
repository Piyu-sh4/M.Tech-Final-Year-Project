const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_CORE || "playwright-core",
);
const { base, chromiumOptions } = require('./support/browser-target.cjs');
(async () => {
  const engine = process.env.ENGINE || "chromium";
  const browser =
    engine === "webkit"
      ? await webkit.launch()
      : await chromium.launch({
          ...chromiumOptions,
        });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(base + "/login.html");
    if (await page.locator("#code").count()) {
      const code =
        process.env.DEMO_ACCESS_CODE ||
        fs.readFileSync(".env", "utf8").match(/^DEMO_ACCESS_CODE=(.+)$/m)?.[1];
      await page.getByLabel("Access code").fill(code);
      await page.getByRole("button", { name: "Open demo" }).click();
    }
    await page.goto(base + "/register.html");
    await page
      .locator("select")
      .filter({
        has: page.locator("option", { hasText: "Workforce Intelligence" }),
      })
      .waitFor();
    await page.goto(base + "/login.html");
    await page.getByLabel("Email address").fill("admin@wip.com");
    await page.getByLabel("Password", { exact: true }).fill("P123/");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/admin-dashboard.html");
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/application-settings.html");
      await page
        .locator("#connection-ip")
        .filter({ hasText: "Connection IP:" })
        .waitFor();
      for (const [theme, accent] of [["light", "white"], ["day", "emerald"], ["night", "berry"], ["dark", "slate"], ["system", "default"]]) {
        await page.locator("#theme").selectOption(theme);
        await page.locator("#accent").selectOption(accent);
        await page.locator("#appearance-form button").click();
        await page.waitForFunction(() =>
          document
            .querySelector("#settings-message")
            .textContent.includes("Appearance saved"),
        );
        await page.reload();
        await page.waitForFunction(
          (theme) => document.querySelector("#theme").value === theme,
          theme,
        );
        await page.waitForFunction(
          accent => document.querySelector("#accent").value === accent && document.body.dataset.accent === accent,
          accent,
        );
        const fit = await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 2,
        );
        assert(fit, "Theme overflow: " + theme + " at " + width);
      }
      console.log(
        "PASS",
        engine,
        width,
        "account themes persist and fit; connection IP displayed",
      );
    }
    assert.equal(await page.locator('#accent option').count(),26);
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const paint = canvas.getContext('2d');
      paint.fillStyle = '#357881'; paint.fillRect(0,0,64,64);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await page.locator('#wallpaper').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
    await page.getByRole('button',{name:'Use background image'}).click();
    await page.locator('#settings-message').filter({hasText:'Background saved'}).waitFor();
    await page.reload();
    await page.locator('body[data-wallpaper]').waitFor();
    await page.goto(base + '/admin-dashboard.html');
    await page.locator('body[data-wallpaper]').waitFor();
    assert.equal(await page.locator('.wiq-main').evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)');
    await page.goto(base + '/application-settings.html');
    await page.getByRole('button',{name:'Remove background image'}).click();
    await page.locator('body[data-wallpaper]').waitFor({state:'detached'});
    console.log('PASS',engine,'background image uploaded, persisted and removed');
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(base + "/admin-dashboard.html");
    await page.waitForFunction(
      () => document.querySelector("#liveDate")?.textContent !== "Loading…",
    );
    await page.waitForTimeout(1200);
    await page.screenshot({ path: "/tmp/wfi-final-mobile-" + engine + ".png" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/application-settings.html");
    await page
      .locator("#connection-ip")
      .filter({ hasText: "Connection IP:" })
      .waitFor();
    await page.waitForFunction(
      () => !document.querySelector("#company-settings").hidden,
    );
    await page.screenshot({
      path: "/tmp/wfi-final-settings-" + engine + ".png",
    });
    console.log(
      "PASS",
      base,
      "company choices, authenticated dashboard and settings",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
