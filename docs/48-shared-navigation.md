> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# Shared responsive header and navigation

All 30 served HTML templates load `navigation.js` and `navigation.css`. Together with catalog-backed routes and the showcase redirect, the shared header covers all 124 application URLs.

Authenticated pages share Dashboard, Modules, Tasks, Projects, AI Chat, Helpdesk and Profile links, Back/Forward controls and server-backed sign-out. Dashboard links respect the signed-in role. Native pages retain their workspace sidebar controls. Catalog and provider-settings pages get an accessible mobile navigation disclosure with Escape dismissal. Public landing, login, registration, policy and offline pages use the same brand and navigation styling with public links.

The mobile header collapses navigation to keep the page content visible. Brand text does not wrap into vertical letters. Sign-out uses a compact labelled icon on phones. Tablet and desktop layouts expose the primary links. Employee shortcuts remain a separate scrolling row.

Legacy navbar elements remain hidden and inert because existing page controllers still update some of their IDs. Interactive controls that need existing listeners are moved into the shared header. Tests explicitly reject a visible legacy navbar, rather than relying only on page-overflow measurements.

## Verification

- 124 URLs at 320, 768 and 1440 px in Chromium and WebKit, totaling 744 page/viewport checks. No failed loads, uncaught page errors, detected mojibake, document overflow, clipped/wrapped brands or visible duplicate headers.
- Mobile menu opening and Escape dismissal checked throughout the page sweep. A Safari/WebKit focus difference found by this check was fixed with a document-level Escape handler.
- Admin and employee dashboard headers checked at 320, 390, 768 and 1440 px.
- Navigation link activation, browser Back/Forward, native-page sign-out and provider-settings sign-out passed at mobile, tablet and desktop widths in both engines.
- Visual inspection caught a legacy CSS override that displayed the old header beneath the shared one. The offline page's horizontal flex layout also clipped its brand and was corrected.
- Public Cloudflare verification checks the deployed dashboard headers and navigation behavior separately from the isolated page sweep.

## Reproduce

Use the Playwright Core setup described in the root README and point `WFI_URL` at a separate Compose project. Run each script in both browser engines with `ENGINE=webkit` for the second run.

```sh
node tests/browser-pages.cjs
node tests/browser-headers.cjs
node tests/browser-navigation.cjs
```

Repeated sign-in scenarios can exceed the login rate limit. Separate test phases or restart only the isolated review API between phases. This change does not modify database schema, seed records or financial workflows. The backend suite was not rerun for this frontend-only change.
