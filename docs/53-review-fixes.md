# Payroll, approvals, privacy and recovery

This follow-up addresses the six findings from the review of commit `1d96fef`. It applies to the shared workforce installation. Company selection continues to identify an employee's organization within that installation.

## Changes by workflow

| Workflow | Current behavior | Verification |
| --- | --- | --- |
| Payroll | A pending payslip can be deleted before issuance. Payment or a PDF download protects the record and its line items. A correction requires a reason. The previous record and items, actor and reason are retained in MySQL. | The regression checks an attempted deletion after issuance and a correction with and without a reason. Browser tests download a real PDF and then verify that deletion is refused. |
| Expenses and entitlements | Managers can approve or reject pending expenses for direct reports. A separate HR user or administrator records payment after approval. Both expense APIs enforce these rules. Approved expenses can be assigned to one reimbursement batch and payment commits with the batch. HR and administrators maintain leave entitlements. | API tests exercise own, team and unrelated claims, premature payment, duplicate payment paths and batch processing. Browser tests submit as employee, approve as manager, record payment as HR and reload as employee. |
| Leave | Submission reserves the balance in the same transaction as the request. Approval, rejection and cancellation lock the request. Attendance and balance changes commit with the decision. | Two simultaneous approvals produce one deduction. An injected attendance failure leaves the request pending and the balance reserved. |
| Sessions | HTTP and Socket.IO validate the account and session against MySQL. Logout and explicit session revocation disconnect sockets for the affected session. Older tokens can use the existing HTTP refresh path to obtain a session ID. | A real Socket.IO client connects, signs out, receives a disconnect and fails to reconnect with the revoked token. Passkey sign-in and verified attendance also passed using a virtual authenticator. |
| Location | Omitted preferences keep their previous values. New settings default to opt-out. Coordinate weather requests check consent before calling providers. Requests to record location follow the saved source. IP lookup uses HTTPS. | A temperature-unit change preserved opt-out, and the denied weather request made zero external HTTPS requests. |
| Seeds and recovery | The Git snapshot is generated from fixture SQL in a temporary Compose project. It excludes operational audit rows, sessions and private credentials. The installation encrypts generated demo banking identifiers once using its own key. Private backups capture the live database, uploads, private keys and the local Compose environment. | A fresh install restored from the seed. Its schema included every pre-upgrade live column and type. A separate restore from the private backup reproduced 219 users, 1,180 salary records and 3,617 line items. All backed-up upload and state files passed checksum comparison. |

## Verification and operation

The isolated MySQL suite passed 127 tests across nine suites. Chromium and WebKit exercised all 125 application URLs at 320, 768 and 1440 pixels with zero reported failures. Both engines completed financial journeys at 390 and 1440 pixels. All 21 typed workflows passed creation, review, history and reload at those two widths in both engines (84 workflow checks). Public Cloudflare checks covered authenticated menu navigation, history controls and sign-out. See `tests/review-regressions.test.js`, `tests/browser-finance.cjs` and `tests/browser-pages.cjs` for the assertions.

Run `sh scripts/snapshot-db.sh` to rebuild the synthetic database for distribution. For operational recovery, run the following commands with a private directory outside Git. The backup briefly pauses the API. The verification script creates and removes an independent Compose project with no published application port.

```sh
sh scripts/backup-private.sh "/path/to/private/backups"
sh scripts/verify-private-backup.sh "/path/to/private/backups/workforce-XXXXXXXX"
```

Verification covered a local restore. Copying a private backup to another host and testing recovery after host loss is an additional operational step. External bureau scoring, lender decisions and statutory filing still depend on authorized provider access.
