# Release verification — 14 November 2026

These results describe the synthetic demonstration environment. They do not certify all possible user journeys, legal correctness or real hardware/provider compatibility.

## Completed checks

- **122/122 tests, eight Jest suites** using an isolated MySQL Compose stack. Includes account/company persistence, roles, meeting authorization/atomicity, payroll permissions, invalid/expired attendance proofs, location consent, encrypted banking, provider request contracts and workflow state boundaries.
- **750 page/viewport combinations**: all 125 application URLs at 320, 768 and 1440 px in Chromium and WebKit. Zero failed loads, uncaught errors, undefined visible inline handlers, detected garbled text, document overflow, duplicate headers or clipped brands. Mobile disclosure and Escape dismissal checked. Local p95 sweep timings: Chromium 318/251/208 ms; WebKit 676/597/557 ms. These are local navigation timings, not an internet performance benchmark.
- All 21 domain workflows exercised with create, review, history and reload at 390/1440 px in Chromium and WebKit (84 module/browser/viewport workflows). Generic draft deletion retains decision history; financial records remain protected.
- Finance regression in Chromium and WebKit at mobile/desktop widths: declarations, self-reported score, official links, loan stages, disbursement records, repayment/settlement, documents, Unicode, CSV and native module forms.
- Actual signed WebAuthn enrollment, passwordless login, verified clock-in/out, persisted audit and device removal passed using Chromium's virtual authenticator. Physical fingerprint/Face ID hardware was not tested.
- Account theme presets saved and persisted through reload at 320/768/1440 via the public HTTPS URL. Company choices and server connection IP were visible. Screenshots were visually inspected; checkbox sizing was corrected.
- Production dependency audit: zero known vulnerabilities reported by `npm audit --omit=dev` at review time. This is not a code-security certificate.
- Docker main stack healthy with existing named volumes. Refreshed synthetic snapshot restored into an independent new Compose project: **161 base tables, ten completed migrations, 24,802 restored rows**, and matching business-table row counts against the export source. Session/location/security tables are intentionally excluded from snapshot data. Existing live volume was never reset.

## Reproduction

Use a separate project for state-changing tests:

```sh
WFI_PORT=5503 docker compose --env-file .env.compose.example -p workforce_review up -d --build --wait
npm run test:docker
# Install Playwright Core and its Chromium/WebKit runtime separately as described in README.
WFI_URL=http://localhost:5503 npm run test:browser
WFI_URL=http://localhost:5503 npm run test:browser:workflows
WFI_URL=http://localhost:5503 npm run test:browser:settings
WFI_URL=http://localhost:5503 npm run test:browser:device
```

Set `ENGINE=webkit` for the page, finance, workflow and settings scripts. Set `PLAYWRIGHT_CORE` to the installed module path if it is outside this checkout. The device script requires Chromium and creates a fresh approved synthetic account for each run. Tests may hit the ten-attempt login limiter; separate phases or restart only the isolated API between phases. Do not disable live authentication controls to run tests.

The UI scripts inspect browser behavior. API contracts for external services use mocks; no paid model call, live bureau query, bank transfer, government filing or provider-created video meeting was performed. Settings screenshots are taken after data loads. Earlier numbered reports retain historical results and should not be read as current deployment evidence.
