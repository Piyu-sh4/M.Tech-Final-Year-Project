# End-to-end review for build request 5

Reviewed the shared frontend templates, Express routes and authorization, MySQL startup and persistence, the current payroll and expense flows, and the open items from the [previous review](59-issue-backlog-review.md). Browser checks and workflow writes use fresh Compose projects populated from the synthetic snapshot, with separate databases from the live site.

## Findings fixed

| Area | Finding | Change |
| --- | --- | --- |
| Shared record presentation | The general record viewer and older payroll page had separate dialogs. The older one embedded record data in click handlers and pointed to missing print and download functions. | Both use a shared, keyboard-accessible record dialog. The payroll download calls the existing authenticated PDF endpoint. Escape closes the modal and focus returns to the original control. |
| Shared tables | Currency fields displayed raw amounts and date-only fields were often displayed in machine format. | Shared table and detail rendering now formats the selected INR fields, payroll dates, and employment types. CSV keeps data values, and search accepts the stored value or the formatted display. |
| Payroll controls | The status filter was ignored, export sent the bearer token in the URL, and the legacy page showed actions for roles that could not use them. | The list and CSV apply the status filter, downloads authenticate with the Authorization header, and controls follow server roles. Staff need another reviewer to create, update, or record payment on their own salary. |
| Loan workflow | The repayment dialog could display a success message before refreshing the underlying register, leading to a stale status immediately after settlement. | Success feedback now follows the schedule and register refresh. |
| Travel expense linkage | A claim could reference a trip belonging to another employee. | Creating the claim and verifying trip ownership now occur in the same database statement. |
| Device enrollment configuration | Compose did not forward the application's configured passkey origin. | Custom HTTPS or local development origins can now be supplied via `APP_ORIGINS` in Compose. |

## Verification scope

- The route survey covers 126 distinct URLs, the shared navigation, consistent typography, overflow, clipped controls, and visible JavaScript errors. It exercises Chromium at 320, 768 and 1440 pixels and WebKit at 390 and 1440 pixels.
- Browser workflow coverage includes the 21 tracker lifecycles at phone and desktop widths, employee and staff finance, payslips, settings and navigation, build requests, meeting notifications, task editing, and employee-role restrictions.
- The MySQL suite covers persisted state, authorization, payroll and expense regression cases. The browser smoke test now submits the required objective metrics and follows the current review stages. The approval and payment tests exercise local application records with synthetic data.

## Remaining review gaps

- Route coverage is broader than workflow coverage. Some legacy admin sections and third-party provider responses still need individual verification. Production verification is limited to read-only smoke paths and isolated test data is used for writes.
- The earlier authorization backlog stays open for the remaining object-level policies, approval workflows, confidential complaints, and import onboarding. The travel and payroll guards in this change close specific paths within that work.
- Full accessibility conformance, load testing, privacy-policy reconciliation, and independent statutory validation of every financial rule remain distinct audit tasks.
