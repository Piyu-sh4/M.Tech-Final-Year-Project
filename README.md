<<<<<<< HEAD
# Start this private backup

This copy restores the database from the Cloudflare-connected local installation, together with its uploads and application encryption keys. Sign in with the same email and password you used on that installation. The copy creates its own browser sessions.

1. Start Docker Desktop. On Windows, use Linux containers.
2. Extract the ZIP and open a terminal inside the `workforce-intelligence` folder.
3. Run `docker compose up -d --wait` and open [the local sign-in page](http://127.0.0.1:5500/login.html). Docker downloads images and builds the app on first use.
4. Use `docker compose down` and `docker compose up -d --wait` to stop and restart while keeping your test changes.

This package uses the separate Compose project `workforce_intelligence_portable` and publishes the web port on localhost only. If port 5500 is occupied, create a local `.env` with `WFI_PORT=5537` and open port 5537 instead. If an older copy of this private package already has volumes on the machine, use a new project name with `docker compose -p workforce_validation up -d --wait` to restore this snapshot into fresh volumes. A new port is also needed if the older copy is still running.

The database initializes only on a fresh volume. `docker compose down -v` deletes that project's local test data and future starts restore from the included snapshot.

**Private database backup.** The ZIP includes account password hashes, application data, uploads, and keys used to open encrypted database records, including saved provider credentials. Store it privately and give it only to testers authorized to access the source data. Keep it off public repositories and shared download sites. Deployment secrets for browser sessions and the Cloudflare tunnel are machine-specific.

Source release: `1ffa6bef859063aa0627f79aaa69e19de269fc22`  
Database captured: 2026-11-26T02:04:11Z

The original repository documentation follows. Its demo account table describes the default fixtures. Use your existing password for any account you changed on the source installation.

---
 
[Current workflow review and fixes](docs/56-workflow-review.md)

The latest [home page and mobile record update](docs/55-mobile-home-and-records.md) aligns the entry page with the dashboard and improves phone/tablet editing.

# Workforce Intelligence

This checkout contains an Express application, browser pages, MySQL 8 schema and demo data, plus a Redis cache. The SQL uses MySQL procedures, generated columns and date functions. Compose uses MySQL so the existing features can share the same data.

The [central theme](docs/54-central-theme.md) controls typography, shared components and responsive spacing across all application templates.

The [follow-up fixes and verification](docs/53-review-fixes.md) address the payroll, permission, session, privacy and backup findings. The earlier [implementation and gap review](docs/49-current-review.md), [security review](docs/50-security-review.md), [test evidence](docs/51-testing.md) and [contributor process](docs/52-development-process.md) describe the current release. Pages share the same navigation and module catalog.

Current workflow and responsive-header changes are documented in the [workflow upgrade](docs/47-workflow-upgrade.md).

## Install, run and edit

Use the [terminal and VS Code setup guide](docs/67-local-setup.md) to install the prerequisites, clone the repository, start an isolated development stack, and run the checks.

## Start the demo

```sh
docker compose up -d --build --wait
```

Open [http://127.0.0.1:5500/login.html](http://127.0.0.1:5500/login.html). A fresh database volume imports the committed `database/snapshot.sql.gz`, which contains the populated schema, demo records and completed seed migration history. The dashboard's **Browse live modules** link opens the searchable module catalog.

| Role | Email | Demo password |
| --- | --- | --- |
| Employee | employee@wfintelligence.com | `P123/` |
| Administrator | admin@wip.com | `P123/` |
| Manager | manager@wfintelligence.com | `P123/` |
| HR | hr@wfintelligence.com | `P123/` |

Compose's `mysql_data` volume stores the database, and `uploads_data` holds uploads. MySQL restores the snapshot only when the database volume is new. The snapshot includes `demo_migrations`, so the API skips the seed jobs already applied to it. Later versioned migrations still run under a database lock when needed. Restarts and container rebuilds preserve edits. `docker compose down` followed by `docker compose up -d --wait` preserves the volumes. `docker compose down -v` deletes the data, and the next start restores the committed snapshot. If initial import fails, inspect `docker compose logs db` before trying to recover the volume.

See [.env.compose.example](.env.compose.example) for overrides. An externally reachable demo should have a random `DEMO_ACCESS_CODE` and `JWT_SECRET` set in the ignored `.env`. The access code unlocks the demo in the browser; login still enforces the user's role. MySQL and Redis have no published host ports.

## Database snapshot

The committed database comes from the repository's synthetic fixtures. To refresh it, run the command below. The script creates a temporary Compose project from the fixture SQL, runs the application seed jobs, exports the database and removes the temporary project. Operational logs, sessions, location preferences and provider credentials are excluded. Generated demo bank identifiers are encrypted under each installation's private key at first startup.

```sh
sh scripts/snapshot-db.sh
```

Use a private backup for records entered in a running installation. Choose a directory outside the repository on encrypted storage. The script briefly pauses the API, captures a consistent database dump, uploads, private keys and local Compose environment, then resumes the API. Store this backup privately.

```sh
sh scripts/backup-private.sh "/path/to/private/backups"
```

Existing database volumes retain their data when a newer snapshot is pulled. A fresh checkout with a new volume restores the newer snapshot automatically. `database/init/02_master.sql` remains available as the historical schema and seed source.

## Seed coverage

The workforce coverage migration adds 112 synthetic staff and three sign-in fixtures. It uses the date of first application as an anchor for up to 120 days of attendance and eight payroll periods, with linked payroll line items. It also seeds leave and balances, project tasks and milestones, candidates and interviews, training progress, expenses and reimbursements, assets, cab bookings, and the status options used by all 21 demo registers. The migration runs once and preserves existing records and changes on later starts.

| Test scenario | Email | Expected sign-in |
| --- | --- | --- |
| Empty payroll and tasks | demo-empty@example.test | Employee dashboard |
| Registration awaiting approval | demo-pending@example.test | Pending approval message |
| Suspended account | demo-suspended@example.test | Suspended account message |
| Eligible company-loan applicant | finance-ready@example.test | Long tenure, salary and self-reported credit fixture |
| New starter | finance-new@example.test | Loan blocked by minimum employment tenure |
| Missing salary | finance-no-salary@example.test | Loan blocked until salary is configured |

Use the same demo password for these fixtures. The other generated staff are records for directory and workflow tests and do not have a usable password. The review migration also adds current attendance, cab bookings, emergency contacts, leave balances and a bundled sample document. One-time repairs correct historical mojibake and invalid seed relationships without rerunning the seed on later starts.

## What the UI uses

- Original API-backed screens still include the role dashboards, tasks, projects, helpdesk, payroll, announcements and notifications.
- The module catalog uses the existing workforce tables for attendance, leave, payroll, people, assets, travel, expenses, hiring, training, meetings and compliance data. The supported forms write to those same tables.
- The 21 former generic registers now have typed MySQL workflow tables, domain fields, stage decisions, history and version checks. Attendance correction and shift approval apply their corresponding domain updates. External identity, biometric, scoring and detection services remain separate integrations.
- AI Chat Settings supports OpenAI, Anthropic, Google Gemini/AI Studio, NVIDIA, and OpenRouter. See [the admin audit](docs/45-admin-feature-audit.md) for the workflow and current limitations.

The [senior developer review](docs/46-senior-review.md) contains the current verification results, full 93-module matrix, resolved bugs and remaining operational gaps. It supersedes the earlier admin audit's findings where fixes are described. Superseded HTML designs are archived under `legacy/page-prototypes`; live catalog URLs use the common renderer rather than those prototype files.

## Finance workflows

Open **Income tax**, **Loan applications**, **Financial wellness checklist** or **Bank directory** from the catalog. Tax declarations save, submit and support HR review. Official Income Tax links handle actual filing. The salary estimate states its supported financial years and income scope.

Employees must give a reason when requesting a salary advance. **Payslips** and **Salary transfer history** show the credit deadline separately from the actual payment date. The standard monthly deadline is the seventh day of the next month. Payroll staff record the credit after the bank confirms it. [India Code on Wages, section 17](https://www.indiacode.nic.in/bitstream/123456789/15793/1/aA2019-29.pdf)

Loan requests enforce configured salary, tenure and EMI limits, then proceed through manager, HR and administrator review. Administrators can record disbursement, installment payment and settlement; borrowers can inspect their schedule. These are local workflow records, not external money transfers or bank approvals. The bank directory links to 123 official sites listed by RBI. Credit-bureau links open the bureau portals, and a saved credit score is explicitly self-reported.

## Automated review tests

```sh
npm run test:docker
```

This command creates an isolated tmpfs MySQL database, restores the committed snapshot and runs the integration and calculation tests, including checks of the database foreign-key relationships and all 21 domain workflows. Runtime containers do not include Jest or other test dependencies.

`tests/browser-finance.cjs` exercises the native forms and cross-role finance/document workflows at phone and desktop sizes. `tests/browser-pages.cjs` checks the current route catalog at phone, tablet and desktop sizes. Both support `ENGINE=webkit`, `PLAYWRIGHT_CORE`, and `WFI_URL`. See the review report for installation and isolation instructions. Browser write tests create records, so run them against a separate Compose project.

## Configure AI chat

As an administrator, open **Settings → AI Chat Settings**. Select a provider, enter an available model ID and API key, save, then make the provider active. A model may be listed by the provider and still be unavailable to a specific API key. For this demo, Gemini was verified with `gemini-3.5-flash-lite`. Use a short general prompt to check provider connectivity and a workforce prompt to verify database answers. Switch providers or disable chat from the same page. With no saved selection, the server can use the existing `AI_PROVIDER`, `AI_MODEL`, and provider key environment variables.

MySQL stores encrypted provider credentials. The separate `ai_keys` volume stores the encryption key. Keep both volumes together when backing up or restoring settings. The browser only receives the provider name, model, and whether a key is saved.

## Browser smoke test

Install Playwright Core separately and point the script at an installed Chromium or Chrome executable:

```sh
npm install --prefix /tmp/wfi-qa playwright-core
export PLAYWRIGHT_CORE=/tmp/wfi-qa/node_modules/playwright-core
export WFI_URL=http://127.0.0.1:5503
export WFI_SMOKE_ID="Smoke $(date +%s)"
# Set CHROME_PATH if Chrome is not in the standard macOS Applications folder.
node tests/browser-smoke.cjs write
docker compose down
docker compose up -d --wait
node tests/browser-smoke.cjs verify
```

The smoke test creates sample objective, leave and expense records, verifies role enforcement and approval, and downloads a CSV and PDF. Set `WFI_URL` to the isolated test origin before running browser tests. It reads the optional demo access code from `.env` or the process environment.
=======
# M.Tech-Final-Year-Project
>>>>>>> 4096321282c1941403d310dc26df5ee05e8ec670
