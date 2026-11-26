> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Domain workflows and dashboard headers

This update replaces the 21 generic register write paths with separate, typed MySQL workflow tables. Each module has its own domain fields, validated inputs, explicit stages, role checks, optimistic version checks and an append-only decision/edit history. Case resolution/findings are optional at submission and required before closure. Consent authors can withdraw enrollment requests before review. Existing records and statuses are copied once by migration `2026-11-domain-workflows-v8`. Original generic rows remain available as historical source data.

Administrators and HR review records created by someone else. An author cannot approve their own request. Requests expose only the transitions available at their current stage. Employee-owned records are scoped to that employee, with HR/admin review access. Other registers require staff access. Concurrent edits/decisions with a stale version return a conflict. Final decisions cannot be edited through the record form.

Approved attendance corrections update the attendance record in the same transaction as the workflow decision. Approved shift requests update the employee's assigned shift in that transaction. Declined requests do not apply those changes. Visitors support check-in/check-out and cancellation. Other modules maintain their domain records and review decisions, rather than automatically performing external or statutory actions.

## Header correction

The employee dashboard previously placed dozens of white shortcut links directly inside a shrinking navbar. This could squeeze the brand, user name and menu into vertical text. Shortcuts now occupy a separate horizontally scrolling row with readable text. On phones the menu has a fixed 44 px target, the brand remains on one line, and the main actions form a consistent grid. Empty logo badges are hidden. Both dashboard headers are checked at 320, 390, 768 and 1440 px, including menu opening, Escape dismissal and brand dimensions.

## Validation

- 103 tests passed across seven suites, including all 21 workflow APIs, required fields, stale edits, rejected stage skipping, history, HR transitions, attendance reconciliation and shift assignment.
- All 21 workflows passed browser creation, stage decisions, history inspection and reload persistence at 390 and 1440 px in Chromium and WebKit (84 module/viewport/browser scenarios).
- All 124 page URLs passed at 320, 768 and 1440 px in both engines (744 checks), with no uncaught errors, detected encoding defects or document-level overflow.
- Existing finance/document/native-form regressions passed on phone and desktop in both engines against an isolated Compose project.
- The refreshed SQL snapshot has 154 base tables, two views, 24,581 application rows and eight migration records. A fresh restore matches all 149 application-table checksums. Its credential/session tables restore empty. MySQL enforces 262 foreign-key relationships. Existing volume data is preserved.

## Operational limits

These are internal request, review and case-management workflows. Biometric enrollment and face review record consent/review references; they do not capture biometric templates or identify faces. Security and fraud modules record investigations and remediation rather than providing a live detection feed. Credit scores remain self-reported. Bonus and LWF records support review of supplied figures and references; they do not certify statutory eligibility, file returns or execute payroll. Maternity and remote-work records maintain plans/approvals; automatic leave-balance/payroll reconciliation is not implemented for these modules. Clinical services, emergency dispatch, bank decisions and external integrations need their respective providers and operational policies.

Future-dated shift requests remain pending until their effective date, rather than changing the employee assignment early. Attendance corrections reject future work dates. Employee and shift references are enforced by MySQL foreign keys as well as API validation.

The earlier senior review remains relevant for legacy endpoints, external integrations, specialized authoring screens outside these 21 modules, and production hardening. This update does not claim that every earlier gap or every possible defect has been eliminated.

## Modules

| Module | MySQL table | Domain fields | States (including branches) |
| --- | --- | --- | --- |
| Attendance corrections | workflow_regularization | work_date, requested_clock_in, requested_clock_out, reason | Submitted, Under review, Approved, Declined |
| Remote work requests | workflow_wfh_tracker | from_date, to_date, work_location, deliverables | Requested, Approved, Declined, Completed |
| Shift preferences | workflow_shift_bidding | shift_id, effective_date, preference_reason | Requested, Waitlisted, Approved, Declined |
| Statutory bonus review | workflow_statutory_bonus | employee_id, financial_year, eligible_wages, bonus_percent | Draft, Under review, Approved |
| Probation reviews | workflow_probation | review_date, reviewer_id, rating, recommendation | Scheduled, In progress, Completed |
| Goals and key results | workflow_goals_okr | metric, baseline, target, actual | Planned, In progress, Achieved, Deferred |
| Career plans | workflow_career_roadmap | target_role, skill, mentor_id, completion_percent | Planned, In progress, Achieved |
| Contract labour register | workflow_contract_labour | contractor, contract_start, contract_end, worker_count, registration_reference | Draft, Under review, Verified, Closed |
| Vendor register | workflow_vendor_management | legal_name, contact_email, service_category, contract_end | Proposed, Under review, Active, Inactive |
| Visitor register | workflow_visitor_management | visitor_name, host_id, visit_date, purpose | Scheduled, Checked in, Checked out, Cancelled |
| Case register | workflow_disciplinary | employee_id, incident_date, policy_reference, resolution | Open, Under review, Resolved |
| Grievance register | workflow_grievance | category, incident_date, requested_remedy, resolution | Submitted, Under review, Resolved |
| Maternity leave planning | workflow_maternity_leave | from_date, to_date, handover_contact, handover_plan | Draft, Submitted, Approved, Closed |
| Wellbeing resources | workflow_mental_health | resource_url, contact, availability | Available, In review, Archived |
| Credit report and financial wellness | workflow_credit_score | bureau, report_date, follow_up | Planned, In progress, Complete |
| Biometric enrollment register | workflow_biometric_enrollment | consent_reference, purpose, retention_until | Requested, Reviewed, Withdrawn |
| Biometric review register | workflow_face_recognition | consent_reference, system_owner, retention_until | Open, Reviewed, Closed |
| Security review register | workflow_cybersecurity | system, control, evidence_reference, remediation | Open, In review, Closed |
| Security incident register | workflow_threat_monitor | system, severity, incident_date, containment | Reported, Triaged, Resolved |
| Payroll review register | workflow_fraud_detection | employee_id, claim_reference, amount, review_findings | Flagged, In review, Cleared |
| Labour welfare fund review | workflow_lwf_tracker | state, financial_year, employee_contribution, employer_contribution | Draft, In review, Verified |

## Run browser regressions

Use the separate review Compose project and the Playwright Core installation described in the root README.

```sh
export WFI_URL=http://127.0.0.1:5503
export PLAYWRIGHT_CORE=/tmp/wfi-qa/node_modules/playwright-core
node tests/browser-workflows.cjs
ENGINE=webkit node tests/browser-workflows.cjs
node tests/browser-headers.cjs
ENGINE=webkit node tests/browser-headers.cjs
```

Separate test phases can exceed the login rate limit. Restart only the isolated review API between phases. Run `npm run test:docker` for the isolated backend suite. Browser workflow tests create synthetic records and should not target the public database.
