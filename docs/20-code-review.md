> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 👀 Code Review Checklist — Workforce Intelligence

## Before Submitting a PR

### Author Checklist
- [ ] Code follows project naming conventions (kebab-case files, camelCase JS)
- [ ] No `.env` values, secrets, or credentials in code
- [ ] All `console.log` debug statements removed
- [ ] Error handling in every async function (try/catch + window.st toast)
- [ ] All user inputs validated server-side
- [ ] No raw SQL string concatenation
- [ ] Currency displayed as `₹` (never `Rs` or `Rs.`)
- [ ] New HTML page includes: cookie banner, dark mode toggle, toast div, wfi-utils
- [ ] dlPrint strings are single-line (no multiline JS string literals)
- [ ] `window.showTab` IDs follow `tab{Name}` camelCase pattern
- [ ] All onclick functions are on `window` object (not local scope)
- [ ] Audit log entry added for any data-modifying API
- [ ] Unit tests written for new payroll/statutory calculation
- [ ] `npm run audit:frontend` passes (0 JS errors)
- [ ] PR description has: What, Why, Screenshots (if UI), Test steps

---

## Reviewer Checklist

### Security
- [ ] No SQL injection risk (parameterised queries only)
- [ ] Auth middleware on every new API route
- [ ] Role check matches business requirement
- [ ] No sensitive data (PAN, password, token) in response or log
- [ ] File upload validates type and size
- [ ] User can only access their own data (not other employees)

### Payroll / Statutory Accuracy
- [ ] PF rate: 12% employee, 13.61% employer, ceiling ₹15,000
- [ ] ESI rate: 0.75% employee, 3.25% employer, eligible ≤ ₹21,000
- [ ] TDS: current FY slab rates applied, new regime default
- [ ] Gratuity: 15/26 × Basic × Years formula
- [ ] Bonus: 8.33% min, 20% max on ₹7,000 or min wage
- [ ] All amounts in paise (integers) internally, displayed as ₹X,XXX.XX

### Frontend Quality
- [ ] Page renders correctly in dark mode
- [ ] Page is mobile responsive (test at 375px width)
- [ ] Print layout correct (`@media print` — sidebar hidden)
- [ ] Tab switching works (IDs match pattern)
- [ ] Export buttons (Print/CSV) generate correct data
- [ ] No duplicate copyright notices
- [ ] No encoding errors (â‚¹ / â€™ etc.)

### Performance
- [ ] No N+1 query problem (use JOINs or batch queries)
- [ ] Redis cache applied for read-heavy operations
- [ ] Large lists paginated (default 25 per page)
- [ ] Images compressed and lazy-loaded
- [ ] No synchronous operations blocking the event loop

### Code Quality
- [ ] Function does one thing (single responsibility)
- [ ] No magic numbers (use named constants)
- [ ] DRY — no copy-paste code (extract to utility function)
- [ ] Error messages are user-friendly (not stack traces in response)
- [ ] Comments explain WHY, not WHAT

---

## Common Issues Found in Review

### 🔴 Critical (Block merge)
```js
// BAD: Raw SQL string
const q = `SELECT * FROM employees WHERE id = ${req.params.id}`;

// BAD: Missing auth middleware
router.get('/salary-data', getAll); // No auth!

// BAD: Hardcoded secret
const secret = 'mysecret123'; // Should be process.env.JWT_SECRET

// BAD: Multiline JS string in dlPrint
var h = '<html>...
</html>'; // Splits string across lines — syntax error!
```

### 🟡 Warning (Fix before merge)
```js
// BAD: Rs instead of ₹
'Net Pay: Rs ' + amount  // Should be '₹' + amount

// BAD: onclick function not on window
function submitForm() {...}  // Can't be called from onclick="submitForm()"
// GOOD:
window.submitForm = function() {...}  // Accessible from onclick=""

// BAD: Tab ID mismatch
onclick="showTab('overview')"  // Looks for id="taboverview"
<div id="tabOverview">         // Won't match! Use lowercase or fix showTab

// BAD: No toast on error
} catch (err) {
  console.error(err); // Silent failure — user has no idea
}
// GOOD:
} catch (err) {
  window.st('Failed to load data: ' + err.message, false);
}
```

### 🟢 Style (Nice to fix)
```js
// VERBOSE:
if (value === true) return true; else return false;
// BETTER:
return !!value;

// VERBOSE:
const result = [];
for (let i = 0; i < items.length; i++) { result.push(items[i].name); }
// BETTER:
const result = items.map(item => item.name);
```

---

## Review Process

### Timeline
- PR opened → reviewer assigned within **4 hours**
- Review completed within **24 hours**
- Critical fixes → PR author responds within **4 hours**
- Approved PRs merged within **2 hours**

### Merge Requirements
1. ✅ At least 1 approval from senior dev
2. ✅ All CI checks green (unit tests, frontend audit, security scan)
3. ✅ No unresolved comments marked "blocking"
4. ✅ PR description complete (What, Why, Screenshots, Test steps)
5. ✅ Branch up to date with `develop`

### Escalation
- Statutory calculation disputes → CFO sign-off required
- Security vulnerabilities → Security lead + CTO review
- DPDP/PoSH data handling → Legal team review
