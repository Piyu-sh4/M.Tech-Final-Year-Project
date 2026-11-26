# Home page and mobile record workflows

The home page now uses the shared workspace template, theme and header. Its primary action opens the signed-in account's dashboard after the API confirms the user. Visitors can sign in or register. Six responsive cards open real workforce tools. The previous static dashboard mockup and standalone marketing styling were removed.

Native workspace record tables now become labeled cards below 1000 pixels. Header labels remain associated with the table data, and action buttons remain usable within each card. Updated and newly loaded rows receive labels through the existing workspace observer. Tables with spanning headers retain their scrollable region to preserve the header relationships. Catalog records use their existing card renderer at the same breakpoint.

Phone layouts stack form grids, constrain edit dialogs to the viewport and allow panels and button groups to wrap. Record actions and modal-footer buttons have a minimum height of 44 pixels. At 320 pixels, records use a single column for readability.

## Verification

- All 125 URLs checked in Chromium and WebKit at 320, 768 and 1440 pixels. The sweep checks typography, theme loading, viewport overflow, shared header styling, navigation controls and visible form controls extending outside the viewport. Wide desktop tables can scroll within their labeled region.
- Public and signed-in home layouts checked at 320, 390, 768 and 1440 pixels in both engines, including the account-specific dashboard link.
- Native user record cards and edit dialogs exercised at all four widths in both engines. A synthetic account's phone field was edited, saved and verified after reload in the isolated test database.
- Financial browser workflows passed on mobile and desktop in both engines, covering form entry, expense submission and review, declarations, loan stages, document downloads, payslip PDFs, repayments and settlement.
- Public Cloudflare home checks used the read-only mode of the home test. Test employee edits were confined to the isolated Compose project.

Reproduce the focused checks with `node tests/browser-mobile-home.cjs`. Use `WFI_URL` to select an isolated application, `PLAYWRIGHT_CORE` to locate Playwright, and `ENGINE=webkit` for the second browser. Set `WFI_PUBLIC_READ_ONLY=1` to check the home page without exercising employee edits.
