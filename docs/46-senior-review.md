> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Senior developer review — November 12, 2026

Follow-up: the [domain workflow and header upgrade](47-workflow-upgrade.md) replaces the 21 generic register write paths and updates the dashboard headers. Read that report for the current workflow coverage and persistence results.

The reviewed demo runs with Docker Compose, Express, MySQL 8 and Redis. The public deployment is at [workforce.bharatmedha.com](https://workforce.bharatmedha.com). All 93 catalog modules read authenticated API data. Seventy-two use domain tables or APIs, and 21 use persisted demo registers. The distinction matters when evaluating operational readiness.

## Changes delivered

- Added the official income-tax filing links, a scoped salary-tax estimate, and declaration save, submit and HR review controls. Fixed fiscal-year filtering, rebate and marginal-relief calculations, invalid input handling, and failed saves incorrectly continuing to submission.
- Added a MySQL bank directory with 123 entries from the [RBI bank-links directory](https://www.rbi.org.in/scripts/banklinks.aspx). Search and pagination cover public, private, small finance, payments, local area, regional rural and foreign banks. Links open the banks' own sites. Products and eligibility remain the bank's decision.
- Added official credit-bureau links and a persisted, explicitly self-reported credit profile. Company-loan eligibility uses salary, tenure, existing loans and configured amount/EMI limits. Replaced fabricated partner rates with reference links.
- Repaired loan field/status mismatches and connected manager → HR → admin review, disbursement, borrower schedules, installment recording and foreclosure settlement. Transactions, applicant locks and idempotent disbursement prevent duplicate applications or schedules. These operations record demo workflow state.
- Fixed multipart document uploads, required file-path storage, private downloads, sharing, HR review and deletion. Fixed a shadowed company-policy route and incomplete policy upload fields.
- Added revocable login sessions and server logout. Protected HTTP requests recheck the current user status and role. Suspension and session revocation invalidate existing sessions. Chat now enforces the user's chat permission.
- Restricted task reads/writes to the relevant user or team and added task-log retrieval. Partial admin user updates preserve omitted fields and salary history. Account deletion now rolls back all child-record deletions if a linked record blocks the operation, returning a useful conflict response.
- Corrected SQL result aliases that left UI cells blank. Corrected dropdown values for holidays, assets, transfers and resignations to match MySQL enums. Added resignation withdrawal and useful holiday-conflict errors.
- Replaced static admin KPI/action narratives with live SQL counts. Added responsive finance cards, searchable records, pagination, upload/download controls, Back/Forward navigation, mobile menu behavior, and loading/empty/error states.
- Escaped dynamic text in active legacy screens and PDFs, including task/project content and names containing quotes. CSV exports include a UTF-8 BOM and preserve quoted fields.
- Repaired 257 persisted fields with mojibake using a lossless, versioned encoding migration. Existing valid Unicode is retained. Updated SQL import encoding to utf8mb4.
- Repaired 56 legacy fixture relationships. The original SQL assumed auto-increment department IDs despite `INSERT IGNORE`. The migration resolves explicitly identified synthetic accounts by department name and preserves assignments already changed away from their legacy value. Two orphaned demo tasks retain their content and assignee, with the demo administrator as creator.
- Archived 93 superseded HTML prototypes under `legacy/page-prototypes`. Their live URLs resolve through the shared module renderer. The showcase redirects to the catalog. The served frontend shrank from approximately 22 MB to 3.5 MB.
- Added separate Docker integration tests, shared database/transaction helpers, finance calculation services, versioned fixtures, and browser workflow/layout tests. Updated vulnerable runtime dependencies and removed the custom multipart parser. Gzip reduced the shared module script from 19,827 to 6,670 bytes in the measured response.

## Verification

Tests ran on isolated Compose databases restored from the committed snapshot. They did not replace the persistent public database with browser-test records.

| Check | Result |
| --- | --- |
| Jest integration and calculation tests | 80/80 passed across six suites, including a final run against the refreshed snapshot |
| Role/module data contracts | 344 reads across admin, HR, manager and employee. No unexpected response failures or missing displayed columns |
| Demo-register workflows | 106 status transitions passed |
| Broad admin API reads | 167 routes checked. 166 returned success. Cab availability correctly returned 400 without its required route/date inputs |
| Parameterized API reads | 25 passed, including cab availability with valid inputs |
| Additional API writes | 17 workflows passed, covering people, tasks, departments, clocking, leave, expenses, travel, payroll/PDF, projects, assets, support, announcements, training, onboarding, meetings, cabs and registers |
| Native UI forms and finance lifecycle | All 15 native forms exercised in Chromium and WebKit at 390 px and 1440 px. Cross-role finance, document review, persisted data, Unicode, literal HTML text and CSV assertions passed |
| Full page render sweep | 124 URLs × 3 widths × 2 browser engines = 744 checks. Zero page errors, failed loads, detected mojibake or document-level horizontal overflow |
| Responsive widths | 320 px phone, 768 px tablet and 1440 px desktop. Workflow tests additionally cover 390 px |
| Local render timing | Chromium p95 835/404/319 ms and WebKit p95 916/599/641 ms at the three widths. Automated local observations, not a public-network performance SLA |
| Inline JavaScript syntax | 188 scripts parsed successfully |
| Foreign-key integrity | All 212 relationships checked by the regression suite |
| Restart persistence | All 132 table row counts and 127 application-table checksums matched before and after container recreation with edited browser fixtures |
| Fresh snapshot restore | 23,231 application rows, all 127 application-table checksums, seven migration records and two views matched the deployed source. Credential and session tables restored empty |
| Public deployment | Chromium and WebKit passed mobile menus, keyboard navigation, search/pagination, dialog dismissal, chat tools, provider settings and the desktop dashboard. Both also verified official tax/bureau links, the persisted credit fixture, loan eligibility and bank-directory data at 390 px and 1440 px |
| Dependency audit | Production dependencies have zero reported vulnerabilities. Five low-severity test-toolchain advisories remain, including [deepmerge prototype pollution](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). The observed registry had no patched deepmerge release |

The broad read sweep omitted four endpoints requiring an optional service, location parameters or document generation. Those omissions are not successful tests. Browser checks cover the specified scenarios, not every possible input, accessibility condition, browser version or external dependency failure.

## Persistence and fixtures

Seven versioned migrations run once under a MySQL lock. A fresh volume imports `database/snapshot.sql.gz`; existing volumes retain edits and run only new migrations. The current snapshot includes 219 users, 8,614 attendance records, 1,180 payroll records, 674 editable-register records and 123 bank references. It contains 132 base tables and two views. Seeded scenarios include pending/suspended/empty accounts, multiple workflow statuses, long-tenure borrowers, a new starter, missing salary, credit profiles, uploaded sample documents, transport, leave balances and current-day attendance.

Demo password is `P123/`. Admin is `admin@wip.com`, HR is `hr@wfintelligence.com`, manager is `manager@wfintelligence.com`, and employee is `employee@wfintelligence.com`. Finance fixtures are `finance-ready@example.test`, `finance-new@example.test` and `finance-no-salary@example.test`.

The snapshot deliberately empties provider credentials/selection, login sessions and push registrations. API keys must be configured per installation. Uploads and the AI encryption key use separate persistent volumes. The original sample handbook is restored from its bundled asset if missing. A SQL snapshot cannot restore arbitrary uploaded files without their upload volume.

## Remaining gaps and recommended direction

1. **External finance services.** Tax links open the [official Income Tax portal](https://www.incometax.gov.in/iec/foportal/). The local estimate covers the stated resident salary case, financial years 2024–25 through 2026–27, and income up to ₹50 lakh. It does not cover all tax situations. Credit profiles are self-reported. The app does not fetch bureau reports, obtain bank approval, submit loan applications to banks, transfer money, or file tax returns. The company workflow's approval/disbursement/payment statuses record local state. Demo Form 16/24Q and reference wage data require authoritative reconciliation before statutory use. [Official tax guidance](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1) is linked for comparison.
2. **Registers versus domain workflows.** The 21 generic modules provide create/edit/status persistence. Biometrics, fraud detection, cybersecurity monitoring, emergency dispatch and similar labels do not imply functioning detection or external-service integrations. Attendance correction and WFH/shift registers do not reconcile attendance and leave automatically. The matrix below identifies each module's actual controls.
3. **Read-only domain views.** Search, pagination and CSV work. Some specialized workflows such as candidate/offer management, interview feedback, survey participation, statutory exports and review authoring still need dedicated controls and domain transitions. Their existing read views should not be presented as complete operational modules.
4. **AI configuration.** Administrators can save encrypted provider profiles and switch the active OpenAI, Anthropic, Gemini or OpenRouter configuration. Prior isolated provider tests used simulated responses. The public installation has no saved provider key. A real response, model access, quota and billing require a valid administrator-supplied key. Meeting-summary generation still uses its separate environment configuration.
5. **Operational hardening.** Before using real employee or financial records, replace demo banking encodings and synthetic statutory identifiers, establish backup/restore of all volumes, review authorization across legacy endpoints, and add provider failure/retry and concurrency coverage. This review is not a production security or statutory certification.
6. **Structure.** Shared catalog rendering removes duplicated prototype screens, and calculation/transaction/encoding services now have focused boundaries. Several native pages still contain inline controllers/styles, and legacy controllers remain large. Incrementally extract those by feature with contract tests rather than doing a high-risk rewrite alongside bug fixes. Server-side filtering/pagination will be needed beyond demo-scale datasets.

## Reproduce

```sh
docker compose up -d --build --wait
npm run test:docker

# Install browser tooling separately from runtime dependencies.
npm install --prefix /tmp/wfi-qa playwright-core
export PLAYWRIGHT_CORE=/tmp/wfi-qa/node_modules/playwright-core
# Point WFI_URL at an isolated Compose stack for tests that create records.
export WFI_URL=http://127.0.0.1:5503
node tests/browser-finance.cjs
node tests/browser-pages.cjs
node /tmp/wfi-qa/node_modules/playwright-core/cli.js install webkit
ENGINE=webkit node tests/browser-finance.cjs
ENGINE=webkit node tests/browser-pages.cjs
```

Use a separate Compose project and port for browser writes. The default production volumes must be preserved. Browser workflows create synthetic records. Allow the login rate-limit window to reset between repeated full workflow runs. `npm run test:docker` uses a separate project and tmpfs database whose name must end in `_test`.

## Module matrix

The table describes the catalog controls. Native pages such as tasks, projects, helpdesk, announcements and settings have additional dedicated interfaces outside this matrix. Domain views often include several related database tables. A persisted register uses `demo_module_records` and is intentionally identified separately.

| Module | Data source | Controls |
| --- | --- | --- |
| Employee directory | /modules/data/directory | Search, pagination, CSV |
| Reporting relationships | /modules/data/reporting | Search, pagination, CSV |
| Headcount by department | /modules/data/headcount | Search, pagination, CSV |
| Workforce planning | /modules/data/headcount | Search, pagination, CSV |
| Workforce distribution | /modules/data/diversity | Search, pagination, CSV |
| Employee self service | /auth/me | Search, pagination, CSV |
| Dependents | /benefits/dependents | Search, pagination, CSV, Add dependent |
| Employee welfare & insurance | /benefits/plans | Search, pagination, CSV |
| Flexible benefits | /benefits/plans | Search, pagination, CSV |
| Salary transfer history | /admin/salary/my | Search, pagination, CSV |
| Leave requests | /admin/leave/my | Search, pagination, CSV, Request leave, Approve |
| Attendance | /admin/attendance/my | Search, pagination, CSV, Clock in, Clock out |
| Time tracker | /admin/attendance/my | Search, pagination, CSV, Clock in, Clock out |
| Expense claims | /travel/expenses/my | Search, pagination, CSV, Submit expense |
| Travel requests | /travel/requests/my | Search, pagination, CSV, Request travel |
| Payslips | /admin/salary/my | Search, pagination, CSV, Download PDF |
| Salary revisions | /modules/data/revisions | Search, pagination, CSV |
| Salary advances | /modules/data/advances | Search, pagination, CSV, Request an advance |
| Holiday calendar | /modules/data/holidays | Search, pagination, CSV, Add holiday |
| Festival calendar | /modules/data/holidays | Search, pagination, CSV |
| HR calendar | /modules/data/calendar | Search, pagination, CSV |
| Shift roster | /modules/data/roster | Search, pagination, CSV |
| Performance reviews | /performance/my | Search, pagination, CSV, Acknowledge |
| 360° feedback | /modules/data/feedback | Search, pagination, CSV |
| Training courses | /training/courses | Search, pagination, CSV, Enroll |
| Skills matrix | /modules/data/skills | Search, pagination, CSV |
| Job openings | /hiring/jobs | Search, pagination, CSV |
| Interviews | /modules/data/interviews | Search, pagination, CSV |
| Employee referrals | /hiring/referrals/my | Search, pagination, CSV, Submit referral |
| Background verification | /modules/data/bgv | Search, pagination, CSV |
| Registration tracker | /admin/users/pending | Search, pagination, CSV, Approve |
| Onboarding checklist | /onboarding/my | Search, pagination, CSV, Mark complete |
| Confirmation letters | /modules/data/confirmations | Search, pagination, CSV |
| Asset register | /assets/my | Search, pagination, CSV, Add asset |
| Asset retirement register | /modules/data/retired-assets | Search, pagination, CSV |
| Cab bookings | /modules/data/cabs | Search, pagination, CSV, Book a cab, Cancel booking |
| Team connect | /modules/data/teams | Search, pagination, CSV |
| Attendance monitor | /modules/data/today | Search, pagination, CSV |
| Activity history | /modules/data/activity | Search, pagination, CSV |
| Account sessions | /modules/data/sessions | Search, pagination, CSV, Revoke session |
| Audit log | /admin/audit-logs | Search, pagination, CSV |
| Compliance overview | /modules/data/compliance | Search, pagination, CSV |
| Meetings | /meetings | Search, pagination, CSV, Schedule meeting |
| Transfer requests | /transfers/my | Search, pagination, CSV, Request transfer |
| HR letters | /letters/my | Search, pagination, CSV |
| Cab drivers | /modules/data/drivers | Search, pagination, CSV |
| Driver assignments | /modules/data/dispatch | Search, pagination, CSV |
| Company policies | /modules/data/policies | Search, pagination, CSV |
| Policy library | /modules/data/policies | Search, pagination, CSV |
| PoSH case register | /modules/data/posh | Search, pagination, CSV |
| PoSH training | /modules/data/posh-training | Search, pagination, CSV |
| Minimum wages reference | /modules/data/wages | Search, pagination, CSV |
| Income tax | /modules/data/tax | Search, pagination, CSV, Save tax declaration, Submit for review, Approve declaration, Return declaration, salary estimate, official filing links |
| Investment declarations | /modules/data/investments | Search, pagination, CSV |
| Form 24Q reference | /modules/data/tds | Search, pagination, CSV |
| Reports | /modules/data/reports | Search, pagination, CSV |
| Data export | /modules/data/directory | Search, pagination, CSV |
| Employee ID | /auth/me | Search, pagination, CSV |
| Pulse surveys | /modules/data/surveys | Search, pagination, CSV |
| Recognition and awards | /modules/data/awards | Search, pagination, CSV |
| Emergency resources | /modules/data/emergency | Search, pagination, CSV |
| Safety requests | /safety/night-shift/my | Search, pagination, CSV |
| SOS incident register | /modules/data/sos | Search, pagination, CSV |
| Labour welfare fund review | Demo register | Create, edit, delete, status transitions |
| Workforce analytics | /modules/data/analytics | Search, pagination, CSV |
| Loan applications | /loans/my | Search, pagination, CSV, Apply for employee loan, Approve manager review, Reject manager review, Approve hr review, Reject hr review, Approve admin review, Reject admin review, Record disbursement, eligibility, EMI, schedule, payment and settlement |
| Bank directory | /loans/bank-partners | Search, pagination, CSV, official bank websites |
| Exit requests | /exit/my-resignation | Search, pagination, CSV, Submit demo resignation, Withdraw resignation |
| Document register | /modules/data/documents | Search, pagination, CSV, Upload document, Share with HR, Verify document, Return document, Download file |
| Workforce insights | /modules/data/analytics | Search, pagination, CSV |
| Workforce assistant | /modules/data/analytics | Search, pagination, CSV |
| Emergency contacts | /modules/data/emergency | Search, pagination, CSV |
| Workplace safety policies | /modules/data/policies | Search, pagination, CSV |
| Attendance corrections | Demo register | Create, edit, delete, status transitions |
| Remote work requests | Demo register | Create, edit, delete, status transitions |
| Shift preferences | Demo register | Create, edit, delete, status transitions |
| Statutory bonus review | Demo register | Create, edit, delete, status transitions |
| Probation reviews | Demo register | Create, edit, delete, status transitions |
| Goals and key results | Demo register | Create, edit, delete, status transitions |
| Career plans | Demo register | Create, edit, delete, status transitions |
| Contract labour register | Demo register | Create, edit, delete, status transitions |
| Vendor register | Demo register | Create, edit, delete, status transitions |
| Visitor register | Demo register | Create, edit, delete, status transitions |
| Case register | Demo register | Create, edit, delete, status transitions |
| Grievance register | Demo register | Create, edit, delete, status transitions |
| Maternity leave planning | Demo register | Create, edit, delete, status transitions |
| Wellbeing resources | Demo register | Create, edit, delete, status transitions |
| Credit report and financial wellness | Demo register | Create, edit, delete, status transitions, save self-reported profile, bureau links |
| Biometric enrollment register | Demo register | Create, edit, delete, status transitions |
| Biometric review register | Demo register | Create, edit, delete, status transitions |
| Security review register | Demo register | Create, edit, delete, status transitions |
| Security incident register | Demo register | Create, edit, delete, status transitions |
| Payroll review register | Demo register | Create, edit, delete, status transitions |
