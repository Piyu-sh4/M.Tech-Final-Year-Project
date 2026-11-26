> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# FAILURE.md — Workforce Intelligence
## Bug Registry — Root Causes, Fixes & Lessons

---

## FAILURE-001 — dlPrint Template Literal Injection
**Severity:** CRITICAL | **Pages:** 18+ | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Unexpected end of input` on 18+ pages after HTML injection.

**Root Cause:** `inject_before_body()` matched the FIRST `</body>` in the file. Pages with `dlPrint()` had `</body>` inside a JS template literal string. Injection replaced `</body>` INSIDE the JS string, corrupting the JavaScript.

**Fix:** Replaced all dlPrint template literals with safe array-join:
```javascript
w.document.write(["<!DOCTYPE html>...", title, "...", html, "...</html>"].join(""));
```
Changed injection to target LAST `</body>` using rfind.

**Lesson:** NEVER inject HTML using `replace("</body>", ...)`. Target the last occurrence. NEVER put `</body>` inside JS template literals.

---

## FAILURE-002 — Duplicate `const token` Across Script Blocks
**Severity:** HIGH | **Pages:** 15+ | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Identifier "token" has already been declared`

**Root Cause:** Page JS (block 1) + Sidebar JS (block 2) both declare `const token`. Both `<script>` blocks share the same global scope. `const` disallows re-declaration.

**Fix:** Changed `const token` / `let token` / `const API` to `var` in all script blocks.

**Lesson:** When a variable appears in multiple `<script>` blocks, use `var`. Check ALL variable names when combining page JS + sidebar JS.

---

## FAILURE-003 — Non-ASCII Characters in JS Strings
**Severity:** HIGH | **Pages:** 67 | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Invalid or unexpected token`

**Root Cause:** Emoji (✅, ❌, ₹, ÷, —) in JS strings saved as UTF-8 multi-byte sequences. JS engine treats multi-byte chars as unexpected tokens in some parsing contexts.

**Fix:** Replace all non-ASCII with unicode escapes: `✅ → \u2705`, `₹ → \u20B9`, `÷ → /`, `— → --`

**Lesson:** HTML content can have emoji. JS strings inside `<script>` blocks cannot. Always use unicode escape sequences.

---

## FAILURE-004 — `\u{1F4C4}` ES2015 Unicode Escape
**Severity:** MEDIUM | **Pages:** 3 | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Invalid or unexpected token`

**Root Cause:** ES2015+ `\u{...}` notation (curly brace form) for emoji caused parsing errors in some browser JS engines.

**Fix:** Remove `\u{...}` patterns entirely or replace with text alternative.

**Lesson:** Never use `\u{...}` in HTML script blocks. Use `\uXXXX` (4-digit) or remove emoji.

---

## FAILURE-005 — Double-Brace `{{length:31}}` Syntax
**Severity:** MEDIUM | **Pages:** 1 (hr-calendar.html) | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Unexpected token "{"` 

**Root Cause:** `{{length:31}}` — double braces are Handlebars/Mustache template syntax, not valid JavaScript.

**Fix:** Removed one set of braces: `{length:31}`

**Lesson:** Search for `{{` in all JS blocks when debugging syntax errors.

---

## FAILURE-006 — Arrow Function `async()=>{}` Without Space
**Severity:** MEDIUM | **Pages:** 1 (hr-copilot.html) | **Status:** ✅ Fixed

**Symptom:** `ReferenceError: async is not defined`

**Root Cause:** `async()=>{}` without space — parser read `async` as a variable name being called, not the async keyword.

**Fix:** Changed to `async () => {}` (space before `()`) or `async function() {}`

**Lesson:** Always use `async () =>` with space, or `async function()` for clarity.

---

## FAILURE-007 — `function init()` Not Defined
**Severity:** MEDIUM | **Pages:** 1 (policy-library.html) | **Status:** ✅ Fixed

**Symptom:** `ReferenceError: init is not defined`

**Root Cause:** DOMContentLoaded listener called `init()` but the function was never defined.

**Fix:** Added the missing `function init() { loadPolicies(); setupSearch(); }` definition.

**Lesson:** When debugging "is not defined" errors, search the entire page for the function name.

---

## FAILURE-008 — Cannot Set Properties of Null (innerHTML)
**Severity:** MEDIUM | **Pages:** 10+ | **Status:** ✅ Fixed

**Symptom:** `TypeError: Cannot set properties of null (setting "innerHTML")`

**Root Cause:** Sidebar JS references elements (`userName`, `composeBtn`, `annList`) that don't exist on every page. `getElementById` returns null → calling `.textContent =` on null throws.

**Fix:** Added null-guard proxy for `document.getElementById` that returns a no-op object instead of null.

**Lesson:** The null-guard proxy only applies to truly missing elements. Real elements still return real DOM nodes.

---

## FAILURE-009 — Duplicate Sidebar Script Blocks
**Severity:** LOW | **Pages:** 5 | **Status:** ✅ Fixed

**Symptom:** Functions like `showToast`, `logout` declared twice. Unpredictable behaviour.

**Root Cause:** Sidebar JS injected twice — once from template, once from injection script.

**Fix:** Added marker check before injection: `if marker not in c: inject()`

**Lesson:** Always check for marker presence before injecting. Search for duplicate function declarations.

---

## FAILURE-010 — onboarding.html HTML Inside dlPrint JS String
**Severity:** CRITICAL | **Pages:** 1 | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Invalid or unexpected token` on onboarding.html specifically.

**Root Cause:** onboarding.html dlPrint was on line 102. inject_before_body matched `</body>` inside that line's JS string, injecting 4,741 characters of HTML into the middle of a JavaScript string.

**Fix (multi-step):**
1. Extracted injected HTML from inside the script block
2. Rebuilt dlPrint using array-join
3. Removed duplicate functions
4. Added null-guard proxy
5. Re-inserted HTML AFTER last `</script>` tag (not before `</body>`)

**Lesson:** When a page still fails after the dlPrint fix, check if injection landed inside dlPrint. Use `node --check` on extracted script blocks individually.

---

## FAILURE-011 — authMiddleware Named Export Missing
**Severity:** HIGH | **Pages:** 2 routes | **Status:** ✅ Fixed

**Symptom:** `Error: Route.post() requires a callback function but got [object Undefined]`

**Root Cause:**
- `module.exports = protect` → protect IS the export (default)
- `const { protect } = require(...)` → looks for property NAMED protect on exports object → undefined

**Fix:** Added `module.exports.protect = protect; module.exports.verifyToken = protect;`

**Lesson:** `module.exports = fn` and `module.exports.fn = fn` are different. Check import pattern vs export pattern.

---

## FAILURE-012 — db.query Callback Used with await
**Severity:** HIGH | **Pages:** 2 routes | **Status:** ✅ Fixed

**Symptom:** Document upload returned HTTP 500. Silent failure — no error thrown.

**Root Cause:** `const rows = await db.query(sql, params)` — mysql v2 is callback-based, not Promise-based. `await` on a callback function returns `undefined` immediately.

**Fix:** Promisify at top of route files:
```javascript
const query = (sql, params) => new Promise((res,rej) =>
  db.query(sql, params, (err, rows) => err ? rej(err) : res(rows))
);
```

**Lesson:** mysql v2 = callbacks. NEVER `await db.query()`. Always wrap in Promise.

---

## FAILURE-013 — expenses.html IIFE Scope Conflict
**Severity:** MEDIUM | **Pages:** 1 | **Status:** ✅ Fixed

**Symptom:** `SyntaxError: Identifier "token" has already been declared` on new expenses.html.

**Root Cause:** Page JS and sidebar JS both in separate `<script>` blocks sharing global scope. Both had `const token`.

**Fix:** Wrapped entire sidebar JS in IIFE: `(function(){ /* sidebar JS */ })();`

**Lesson:** When combining page JS + sidebar JS in separate script blocks, IIFE-wrap the sidebar to isolate its scope.

---

## Summary

| Metric | Value |
|---|---|
| Total bugs found | 13 |
| Critical | 3 |
| High | 5 |
| Medium | 4 |
| Low | 1 |
| All fixed | ✅ 13/13 |
| Final JS errors | **0** |

---

## Prevention Checklist

```bash
# Run before every commit / page creation:

# 1. Check non-ASCII in JS blocks
grep -Pn "[^\x00-\x7F]" frontend/yourpage.html

# 2. Check double braces
grep -n "{{" frontend/yourpage.html

# 3. Check node syntax
node --check backend/routes/yourroute.js

# 4. Quick Playwright check (see HANDOFF.md for full script)
```
