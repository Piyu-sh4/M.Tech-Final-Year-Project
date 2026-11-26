const assert = require("node:assert/strict");
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_CORE || "playwright-core",
);
const { base, chromiumOptions } = require('./support/browser-target.cjs');
(async () => {
  const browser =
    process.env.ENGINE === "webkit"
      ? await webkit.launch()
      : await chromium.launch({
          ...chromiumOptions,
        });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const account = page.getByRole("button", { name: /^Account\b/ });
    async function assertAccountPosition() {
      const position = await account.evaluate(button => {
        const header = button.closest(".wfi-unified-header");
        const bounds = button.getBoundingClientRect();
        const brand = header.querySelector(".wfi-header-brand").getBoundingClientRect();
        const history = header.querySelector(".wfi-header-history")?.getBoundingClientRect();
        const rightPadding = parseFloat(getComputedStyle(header).paddingRight);
        return {
          edge: header.getBoundingClientRect().right - rightPadding - bounds.right,
          sameRow: Math.abs((brand.top + brand.bottom) / 2 - (bounds.top + bounds.bottom) / 2) < 2,
          followsHistory: !history || history.top >= bounds.bottom || history.right <= bounds.left,
          fitsBesideBrand: brand.right <= bounds.left,
        };
      });
      assert(Math.abs(position.edge) < 2, "Profile is not at the right edge");
      assert(position.sameRow && position.followsHistory && position.fitsBesideBrand,
        "Profile should be beside the brand on mobile and after history on wider screens");
    }
    async function login() {
      await page.goto(base + "/index.html");
      if (await page.locator("#code").count()) {
        await page.getByLabel("Access code").fill(require("dotenv").parse(require("node:fs").readFileSync(".env")).DEMO_ACCESS_CODE);
        await page.getByRole("button", { name: "Open demo" }).click();
        await page.goto(base + "/index.html");
      }
      await assertAccountPosition();
      await account.click();
      await page.locator("#wfi-account-links").getByRole("link", { name: "Sign in", exact: true }).click();
      await page.getByLabel("Email address").fill("admin@wip.com");
      await page.getByLabel("Password", { exact: true }).fill("P123/");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.waitForURL("**/admin-dashboard.html");
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await login();
    for (const width of [320, 390, 600, 601, 768, 1200, 1201, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await assertAccountPosition();
    }
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/modules.html");
      await page.getByLabel("Find a module").waitFor();
      await assertAccountPosition();
      await account.focus();
      await page.keyboard.press("Enter");
      assert.equal(await account.getAttribute("aria-expanded"), "true");
      const accountLinks = page.locator("#wfi-account-links");
      await accountLinks.getByRole("link", { name: "Profile", exact: true }).waitFor();
      await accountLinks.getByRole("link", { name: "Settings", exact: true }).waitFor();
      const bounds = await accountLinks.boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width);
      if (process.env.ENGINE === "webkit") {
        // WebKit's default keyboard preference skips links when tabbing.
        await accountLinks.getByRole("link", { name: "Profile", exact: true }).focus();
      } else {
        await page.keyboard.press("Tab");
      }
      assert.equal(await page.evaluate(() => document.activeElement.textContent), "Profile");
      await page.keyboard.press("Escape");
      assert.equal(await account.getAttribute("aria-expanded"), "false");
      assert.equal(await account.evaluate(element => document.activeElement === element), true);
      await account.click();
      await page.getByLabel("Find a module").click();
      assert.equal(await account.getAttribute("aria-expanded"), "false");
      if (width <= 600) {
        await page.locator(".wfi-header-toggle").click();
        assert.equal(
          await page
            .locator(".wfi-header-toggle")
            .getAttribute("aria-expanded"),
          "true",
        );
        await assertAccountPosition();
      }
      await page
        .locator(".wfi-header-links")
        .getByRole("link", { name: "Tasks", exact: true })
        .click();
      await page.waitForURL("**/tasks.html");
      await page.locator("#history-back").click();
      await page.waitForURL("**/modules.html");
      await page.locator("#history-forward").click();
      await page.waitForURL("**/tasks.html");
      assert.equal(await page.locator("[data-legacy-nav]").isVisible(), false);
      console.log("PASS", width, "right-aligned Profile, menu links and browser back/forward");
    }
    const previousToken = await page.evaluate(() => localStorage.getItem("token"));
    await page.evaluate(() => localStorage.setItem("wfi_sidebar", "light"));
    await account.click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/login.html");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("token")),
      null,
    );
    assert.equal(await page.evaluate(() => localStorage.getItem("wfi_sidebar")), "light");
    const revoked = await context.request.get(base + "/api/auth/me", { headers: { Authorization: "Bearer " + previousToken } });
    assert.equal(revoked.status(), 401);
    await login();
    await page.goto(base + "/ai-chat-settings.html");
    await page
      .getByRole("heading", { name: "AI Chat Settings", exact: true })
      .waitFor();
    await account.click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/login.html");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("token")),
      null,
    );
    console.log("PASS native and provider settings sign out");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
