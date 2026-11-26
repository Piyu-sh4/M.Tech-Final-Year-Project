const assert = require("assert/strict"),
  fs = require("fs");
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
    for (const [role, email] of [
      ["admin", "admin@wip.com"],
      ["employee", "employee@wfintelligence.com"],
    ]) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      await p.goto(base + "/login.html");
      if (await p.locator("#code").count()) {
        await p
          .getByLabel("Access code")
          .fill(
            fs
              .readFileSync(".env", "utf8")
              .match(/^DEMO_ACCESS_CODE=(.+)$/m)[1],
          );
        await p.getByRole("button", { name: "Open demo" }).click();
      }
      await p.getByLabel("Email address").fill(email);
      await p.getByLabel("Password", { exact: true }).fill("P123/");
      await p.getByRole("button", { name: "Sign in", exact: true }).click();
      await p.waitForURL("**/" + role + "-dashboard.html");
      for (const width of [320, 390, 768, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        await p.locator(".wfi-workspace").waitFor();
        await p.locator(".wfi-unified-header").waitFor();
        const state = await p.evaluate(() => {
          const n = document.querySelector(".wfi-unified-header"),
            b = n.querySelector(".wfi-header-brand");
          return {
            width: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
            height: n.getBoundingClientRect().height,
            brandHeight: b.getBoundingClientRect().height,
            brandWidth: b.clientWidth,
            brandScroll: b.scrollWidth,
          };
        });
        assert(state.scroll <= state.width + 2, JSON.stringify(state));
        assert(state.brandHeight < 50, JSON.stringify(state));
        assert(
          state.brandScroll <= state.brandWidth + 2,
          JSON.stringify(state),
        );
        if (width < 600) {
          const menu = p.getByRole("button", { name: "☰ Menu", exact: true });
          await menu.click();
          await p
            .getByRole("button", { name: "Close menu", exact: true })
            .waitFor();
          await p.keyboard.press("Escape");
          assert.equal(await menu.getAttribute("aria-expanded"), "false");
        }
        if (process.env.WFI_SCREENSHOT_DIR)
          await p.screenshot({
            path:
              process.env.WFI_SCREENSHOT_DIR +
              "/header-" +
              role +
              "-" +
              width +
              ".png",
          });
        console.log("PASS", role, width, "readable brand, layout, menu");
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
