const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const { base, chromiumOptions } = require('./support/browser-target.cjs');
(async () => {
  const browser = await chromium.launch({
    ...chromiumOptions,
  });
  try {
    const context = await browser.newContext(),
      page = await context.newPage();
    // Create a new approved fixture so repeated runs never reuse today's attendance.
    const email = "device-" + Date.now() + "@example.test";
    const administrator = await context.request.post(base + "/api/auth/login", {
      data: { email: "admin@wip.com", password: "P123/" },
    });
    assert.equal(administrator.status(), 200);
    const administratorToken = (await administrator.json()).token;
    const registration = await context.request.post(
      base + "/api/auth/register",
      {
        data: {
          full_name: "Device regression",
          email,
          password: "DeviceTest123!",
          company_id: 1,
        },
      },
    );
    assert.equal(registration.status(), 201);
    const approval = await context.request.patch(
      base +
        "/api/admin/users/" +
        (await registration.json()).user_id +
        "/approve",
      { headers: { Authorization: "Bearer " + administratorToken }, data: {} },
    );
    assert.equal(approval.status(), 200);
    const session = await context.newCDPSession(page);
    await session.send("WebAuthn.enable");
    await session.send("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    await page.goto(base + "/login.html");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("DeviceTest123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/employee-dashboard.html");
    await page.goto(base + "/application-settings.html");
    await page
      .getByLabel("Confirm your current password")
      .fill("DeviceTest123!");
    await page.getByRole("button", { name: "Enroll this device" }).click();
    await page
      .locator("#settings-message")
      .filter({ hasText: "Passkey enrolled" })
      .waitFor();
    await page.getByRole("button", { name: /^Account\b/ }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL("**/login.html");
    await page.getByLabel("Email address").fill(email);
    await page
      .getByRole("button", { name: "Sign in with a passkey", exact: true })
      .click();
    await page.waitForURL("**/employee-dashboard.html");
    console.log(
      "PASS virtual authenticator enrollment and passwordless sign-in",
    );
    await page.goto(base + "/attendance.html");
    await page
      .getByRole("button", { name: "Device-verified clock in", exact: true })
      .click();
    await page
      .locator("#message")
      .filter({ hasText: "Clocked in at" })
      .waitFor();
    await page
      .getByRole("button", { name: "Device-verified clock out", exact: true })
      .click();
    await page
      .locator("#message")
      .filter({ hasText: "Clocked out at" })
      .waitFor();
    const audit = await page.evaluate(async () => {
      const response = await fetch("/api/auth/attendance-audit", {
        headers: { Authorization: "Bearer " + localStorage.token },
      });
      return response.json();
    });
    assert(
      audit.filter((event) => event.verification_method === "passkey").length >=
        2,
    );
    await page.goto(base + "/application-settings.html");
    await page
      .getByRole("button", { name: "Remove passkey", exact: true })
      .click();
    await page.getByText("No device is enrolled.", { exact: true }).waitFor();
    console.log(
      "PASS signed attendance proofs, persisted audit and device removal",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
