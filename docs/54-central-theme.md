# Central theme and page templates

All 31 served HTML templates load `frontend/theme.css` once as their final stylesheet. These templates serve 125 URLs, including the catalog modules. The demo access gate reads that same stylesheet on startup.

The central stylesheet owns the font stack, type scale, page canvas, surface colors, border colors, radii, shadows, content width, responsive gutters, page headings, cards, form controls, tables, focus outlines and shared header appearance. The existing system font stack is used consistently without remote font downloads. Code blocks retain a monospace stack. The home page uses the shared workspace template and the account appearance preset.

`workspace.css` supplies the sidebar and workspace structure. `navigation.css` supplies the shared header's layout and behavior. `modules.css` supplies catalog grids and tables. Domain styles continue to position their own controls and widgets, while the final theme layer controls their common presentation. Page layout declarations remain where they support domain-specific behavior.

Palette definitions were consolidated out of the workspace and preference stylesheets. Embedded page font declarations and chat styles now reference the common font variable. Duplicate appearance stylesheet imports were removed. The theme preserves the compact menu and sign-out labels on phones, including the native dashboard menu control.

## Verification

The all-page browser sweep now asserts one central theme import and a consistent computed font family on visible headings, labels, buttons and input controls. It also checks that compact menu text stays visually hidden, the menu opens and dismisses with Escape, branding fits, no duplicate header appears, pages load, visible inline handlers exist and the document stays within the viewport.

The release checks cover all 125 URLs at 320, 768 and 1440 pixels in Chromium and WebKit (750 combinations). Theme persistence checks cover system, light, daylight, night and dark presets at all three widths. Financial E2E checks cover mobile and desktop forms, expense approvals, PDF downloads, declarations, loan stages and repayment records. The API suite remains 127 tests across nine suites.

## Making a visual change

Update shared tokens and component rules in `theme.css`. Load new page-specific styles before it. Use the `--wfi-*` variables for domain widgets. Add a page-specific layout rule only when its content needs a different arrangement. Preserve accessible labels when a control displays an icon on small screens. Run `tests/browser-pages.cjs` in both engines after global changes and inspect loaded desktop/mobile screenshots.
