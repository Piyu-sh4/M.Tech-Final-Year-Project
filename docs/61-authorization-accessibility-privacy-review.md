# Build requests 5 and 6 follow-up

The review used the same MySQL snapshot as production startup in a separate Compose project. Test records, provider fixtures and load requests used that project. Production smoke checks cover navigation, authenticated reads and session revocation.

## Changes

| Area | Finding and correction |
| --- | --- |
| Project register | Project lists, details, counts and calendar entries use the same participant policy. Admin and HR have oversight. Project managers and creators manage their own membership and milestones. A milestone update must also match its parent project. Counts exclude duplicate tasks. Project editing uses labelled dialogs with keyboard dismissal and persists progress and tags. |
| Policies | The acknowledgement action and alternate policy catalog use the same audience check as the main policy list and attachment downloads. |
| Benefits and training | Company registers are limited to Admin and HR. Employees and managers retain their own enrollment and benefit views. Self-service changes report a missing record when no record belongs to the caller. |
| Confidential workflows | Disciplinary cases now require Admin or HR. New audit entries for banking, benefits, loans, dependents, tax, confidential helpdesk records and safety actions record action metadata without copying the submitted form contents. |
| Employee imports | Both import paths create pending employees. The chat endpoint requires an explicit initial password. Employee file imports can omit passwords and receive unique, undisclosed credentials until an administrator sets them. Imports report row-level issues without exposing database errors. |
| Account menu | The shared header exposes Sign in for guests and Profile, Settings, and Sign out for authenticated users. The menu supports keyboard activation, Escape with focus return and outside-click dismissal. Sign-out revokes the server session and preserves browser display preferences. |
| Accessibility | Shared contrast styles cover legacy tabs, task priorities, action buttons and footer links. Dashboard fields and icon buttons now have accessible labels. |
| Privacy notice | The privacy and browser-storage notices document observed behavior, including opt-in location lookups, passkey handling, AI provider payloads, browser session storage, and the demo-access cookie. |

## Verification

- The browser route survey covers 126 pages in Chromium at 320, 768 and 1440 pixels and WebKit at 390 and 1440 pixels. It checks shared styling, horizontal overflow, clipped controls, missing actions, browser errors and garbled text.
- Browser workflow coverage includes account navigation and session revocation, request queue, tax and credit links, loan lifecycle, meeting link and notifications, task edit and PDF download, and role-specific finance actions, and project creation and editing with persisted progress and tags.
- The targeted axe-core review uses WCAG 2 A/AA and 2.1 A/AA rules at 390 and 1440 pixels. It covers the home, login, notices, admin dashboard, module directory, projects, application settings, request queue and AI chat settings.
- Five AI adapters are checked using simulated responses for request format, provider response shape, invalid payloads and redacted errors. The banking route has deterministic tests for valid responses, unavailable providers and invalid branch codes. A live IFSC check from isolated Compose also returned the expected public branch code. External meeting and bank or tax links hand off to the provider.
- A bounded localhost load run made 900 authenticated read requests across session, projects, calendar, policies and queue routes. At 1, 8 and 16 concurrent clients, the release run returned p95 times of 12 ms, 31 ms and 38 ms, with zero errors. An earlier concurrent run reached 214 ms at 16 clients. This is a short seeded-data baseline.

## Remaining work

- The PoSH committee permission model, conflict-of-interest checks, anonymous submissions and historical audit payloads require further work. Historical records were preserved. Review earlier employee imports for accounts that may still have the old shared initial password. A one-time password setup flow and permission-flag audit remain open.
- Continue the route-by-route review for legacy admin operations and manager scopes. Track authorization changes against the original ownership and confidential-case issues.
- Broader manual accessibility coverage is still due, including assistive technology, dark themes, and individual legacy workflows. A sustained load run on production-sized data and separate database migration and index reviews are also due.
- Provider account permissions, billing, authenticated filing and lending actions, and statutory validation require separate verification with the appropriate accounts or domain reviewers. The demo uses synthetic records and does not submit personal data or applications.
