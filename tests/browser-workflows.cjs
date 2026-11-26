const fs = require("fs"),
  assert = require("assert/strict");
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_CORE || "playwright-core",
);
const profiles = require("../backend/config/workflowProfiles.json"),
  catalog = require("../backend/config/moduleCatalog");
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
    const pages = {},
      contexts = {},
      errors = [];
    for (const [role, email] of Object.entries({
      admin: "admin@wip.com",
      employee: "employee@wfintelligence.com",
      hr: "hr@wfintelligence.com",
    })) {
      const c = await browser.newContext();
      contexts[role] = c;
      const p = await c.newPage();
      pages[role] = p;
      await p.goto(base + "/login.html");
      await p.getByLabel("Email address").fill(email);
      await p.getByLabel("Password", { exact: true }).fill("P123/");
      await p.getByRole("button", { name: "Sign in", exact: true }).click();
      await p.waitForURL(/(?:dashboard|manager)\.html/);
      await p.goto(base + "/modules.html");
      await p.getByLabel("Find a module").waitFor();
      p.on("pageerror", (e) => errors.push(e.message));
    }
    const api = (p, path) =>
      p.evaluate(async (path) => {
        const r = await fetch("/api" + path, {
          headers: { Authorization: "Bearer " + localStorage.token },
        });
        return r.json();
      }, path);
    const users = await api(pages.admin, "/admin/users"),
      uid = users.find(
        (u) => u.email === "employee@wfintelligence.com",
      ).user_id;
    const shifts = await api(pages.admin, "/admin/shifts");
    async function open(p, slug, title) {
      await p.goto(base + "/" + slug + ".html");
      await p.getByRole("heading", { name: title, exact: true }).waitFor();
      await p.waitForFunction(
        () =>
          document.querySelector("#message")?.dataset.error === "false" &&
          !document.querySelector("#message").textContent.startsWith("Loading"),
      );
    }
    for (const width of [390, 1440]) {
      for (const p of Object.values(pages))
        await p.setViewportSize({ width, height: 900 });
      for (const [slug, profile] of Object.entries(profiles)) {
        const item = catalog[slug],
          p = item.scope === "own" ? pages.employee : pages.admin;
        const title =
          "E2E " + slug + " " + engine + " " + width + " " + Date.now();
        await open(p, slug, item.title);
        await p
          .getByRole("button", { name: "Add record", exact: true })
          .click();
        const dialog = p.getByRole("dialog");
        await dialog.locator("[name=title]").fill(title);
        await dialog
          .locator("[name=details]")
          .fill("Domain evidence and reviewer notes");
        for (const f of profile.fields) {
          let v =
            f.type === "number"
              ? String(f.key.endsWith("_id") ? uid : 10)
              : f.type === "date"
                ? "2026-11-01"
                : f.type === "email"
                  ? "workflow@example.test"
                  : f.type === "url"
                    ? "https://example.test/"
                    : "Workflow evidence";
          if (f.key === "shift_id") v = String(shifts[0].shift_id);
          if (f.key === "requested_clock_in") v = "09:00";
          if (f.key === "requested_clock_out") v = "17:00";
          await dialog.locator('[name="' + f.key + '"]').fill(v);
        }
        await dialog.getByRole("button", { name: "Save", exact: true }).click();
        await p
          .locator("#message")
          .filter({ hasText: "Record saved" })
          .waitFor();
        await p.getByLabel("Search records").fill(title);
        let record = (await api(p, "/modules/" + slug + "/records")).find(
          (r) => r.title === title,
        );
        assert(record);
        const authoredRecord = p.getByRole("row").filter({ hasText: title });
        await authoredRecord.getByRole("button", { name: "Add comment", exact: true }).click();
        const commentDialog = p.getByRole("dialog", { name: "Add comment" });
        await commentDialog.getByLabel("Comment", { exact: true }).fill("Evidence attached for review");
        await commentDialog.getByRole("button", { name: "Add comment", exact: true }).click();
        await p.locator("#message").filter({ hasText: "Comment added." }).waitFor();
        p.once("dialog", dialog => dialog.accept());
        await authoredRecord.getByRole("button", { name: "Delete draft", exact: true }).click();
        await p.locator("#message").filter({ hasText: "Draft removed." }).waitFor();
        const archived = p.getByRole("button", { name: "Archived drafts", exact: true });
        await archived.click();
        await authoredRecord.getByRole("button", { name: "Restore draft", exact: true }).click();
        await p.locator("#message").filter({ hasText: "Draft restored." }).waitFor();
        await archived.click();
        await authoredRecord.getByRole("button", { name: "View", exact: true }).waitFor();
        // HR records review decisions for independently authored records.
        const reviewer = pages.hr;
        for (let step = 0; step < 5; step++) {
          await open(reviewer, slug, item.title);
          await reviewer.getByLabel("Search records").fill(title);
          record = (await api(reviewer, "/modules/" + slug + "/records")).find(
            (r) => r.title === title,
          );
          const next = record.allowed_transitions[0];
          if (!next) break;
          await reviewer
            .getByRole("row")
            .filter({ hasText: title })
            .getByRole("button", { name: next, exact: true })
            .click();
          const decision = reviewer.getByRole("dialog", { name: next });
          await decision.getByLabel("Decision note").fill("Reviewed the submitted evidence");
          await decision.getByRole("button", { name: next, exact: true }).click();
          await reviewer
            .locator("#message")
            .filter({ hasText: "Workflow decision recorded" })
            .waitFor();
        }
        await reviewer
          .getByRole("row")
          .filter({ hasText: title })
          .getByRole("button", { name: "History", exact: true })
          .click();
        await reviewer
          .getByRole("dialog")
          .getByRole("heading", { name: "Workflow history" })
          .waitFor();
        assert(
          (await reviewer.getByRole("dialog").innerText()).includes("Evidence attached for review"),
        );
        await reviewer
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await reviewer.reload();
        await reviewer.getByLabel("Search records").fill(title);
        await reviewer.getByRole("row").filter({ hasText: title }).waitFor();
        const dims = await reviewer.evaluate(() => [
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
        ]);
        assert(dims[1] <= dims[0] + 2);
        console.log(
          "PASS",
          engine,
          width,
          slug,
          "create, review, history, reload",
        );
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
