# Module and learning review

Build request 9 covers record actions across the workspace. Build request 10 covers skill-based learning, enrollment, and certificates. The catalog contains 95 shared workspace modules in five sections, plus standalone pages. The responsive survey loads 128 routes including standalone pages and redirects.

| Section | Shared modules | Workflow and integration checks |
| --- | ---: | --- |
| People | 13 | Employee directory rendering, dependent forms, role checks, and the probation tracker |
| Time & pay | 22 | Attendance and leave, salary advances and payroll, expenses, PDF exports, and six trackers |
| Hiring & development | 20 | Referrals, course setup and learning, and three development trackers |
| Operations | 17 | Cab, assets, meetings, notifications, and four operations trackers |
| Governance | 23 | Policy and finance registers, tax and loan workflows, and seven governance trackers |

## Changes

- All 21 workflow trackers can record comments from the author, owner, or HR/admin. Comments appear in the existing history with attribution and leave the status and revision unchanged. Draft deletion still retains the history. The history dialog uses the shared record dialog.
- The skills matrix links to the courses for a specific skill when the catalog has resources for it. Employees can enroll, open the learning resources, update progress, or withdraw from an unfinished enrollment. HR and administrators can add and edit courses, select a related skill, and attach HTTPS resource links.
- The demo migration adds links for JavaScript, Python, and Docker once. Existing records and courses are retained. HR/admin can add material for other skills without another deployment. [JavaScript course](https://www.youtube.com/watch?v=Zi-Q0t4gMC8) · [MDN learning material](https://developer.mozilla.org/en-US/docs/Learn_web_development) · [Microsoft Python lessons](https://learn.microsoft.com/en-us/shows/intro-to-python-development/) · [Python tutorial](https://docs.python.org/3/tutorial/) · [Docker guides](https://docs.docker.com/get-started/)
- The learner records progress. A separate HR/admin reviewer can issue a PDF after completion. The PDF is available to the learner and is backed by the stored issue record, with learner and course names, issue date, and reference. It represents internal completion, with no external accreditation. Issued records preserve their original names and are locked against progress resets.

## Verification scope

The MySQL suite exercises enrollment idempotency, course editing and input validation, review authority, certificate ownership, withdrawal, and comments on all trackers. Browser checks exercise all 21 tracker lifecycles with comments on phone and desktop widths in Chromium and WebKit. The course test follows course creation and edit, skill-linked resources, enrollment, completion, review, and PDF download. A generated certificate was rendered and inspected as a single A4 page.

The route survey tests loading, actions, layout, and overflow on Chromium and WebKit. It does not exercise every action in every module. Organization-specific approval policies, archived-record access, and external provider actions still require individual review. Posted comments are visible to the authorized viewers of the workflow record.
