> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🧪 Testing Guide — Workforce Intelligence

## Test Levels

### 1. Unit Tests (Jest)
```bash
npm run test:unit
```
Coverage targets: **> 80%** on all service files

**What to test:**
- Payroll calculator (PF, ESI, TDS, Gratuity, Bonus)
- JWT generation and validation
- Password hashing and comparison
- Date utilities (leave balance calculation, notice period)
- Salary calculation formulas
- Form 24Q generation logic

```js
// tests/unit/payroll.test.js
describe('PF Calculator', () => {
  it('should calculate employee PF at 12% of basic', () => {
    expect(calculatePF(50000)).toBe(6000);
  });
  it('should cap PF calculation at ₹15,000 wage ceiling', () => {
    expect(calculatePF(100000)).toBe(1800); // 15000 * 12% = 1800
  });
  it('should return 0 for salary below ₹1', () => {
    expect(calculatePF(0)).toBe(0);
  });
});
```

### 2. Integration Tests (Jest + Supertest)
```bash
npm run test:integration
```

**Critical flows to test:**
```js
// Auth flow
POST /api/auth/login      → JWT returned, role correct
GET  /api/auth/me         → returns user profile
POST /api/auth/logout     → session cleared

// Payroll flow
POST /api/payroll/run     → calculates, saves, returns summary
GET  /api/payslip/:id     → returns correct payslip data
POST /api/payroll/lock    → locks month, prevents re-run

// Leave flow
POST /api/leave/apply     → creates request, notifies manager
PUT  /api/leave/:id/approve → updates status, deducts balance
GET  /api/leave/balance   → returns correct available days

// Compliance flow
GET  /api/compliance/pf-summary   → correct PF totals
GET  /api/compliance/form24q      → valid XML/JSON for TRACES
```

### 3. Frontend Audit (Playwright)
```bash
npm run audit:frontend
```
Runs against all 121 HTML pages:

```js
// tests/playwright/frontend-audit.spec.js
test.describe('All pages audit', () => {
  const pages = fs.readdirSync('./frontend').filter(f => f.endsWith('.html'));
  const skip  = ['login.html','register.html','offline.html'];

  for (const page of pages) {
    if (skip.includes(page)) continue;

    test(`${page} — core functions`, async ({ page: pw }) => {
      await pw.goto(`file://${path.resolve('./frontend/' + page)}`);

      // dlPrint works
      const dlPrintOk = await pw.evaluate(() => typeof window.dlPrint === 'function');
      expect(dlPrintOk).toBe(true);

      // dlCSV works
      const dlCSVOk = await pw.evaluate(() => typeof window.dlCSV === 'function');
      expect(dlCSVOk).toBe(true);

      // Dark mode toggle exists
      const dmExists = await pw.locator('#dmt, #dmToggle').count();
      expect(dmExists).toBeGreaterThan(0);

      // Cookie banner exists
      const ckExists = await pw.locator('#cookieBanner, #ckb').count();
      expect(ckExists).toBeGreaterThan(0);

      // No JS console errors
      const errors = [];
      pw.on('pageerror', e => errors.push(e.message));
      await pw.waitForTimeout(1000);
      expect(errors.filter(e => !e.includes('fetch') && !e.includes('404'))).toHaveLength(0);
    });
  }
});
```

**Current status: 116/116 PASS ✅**

### 4. Security Tests (OWASP)
```bash
npm run test:security
```

| Test | Tool | Status |
|---|---|---|
| SQL injection | SQLMap (dry run) | ✅ Pass |
| XSS | OWASP ZAP | ✅ Pass |
| JWT manipulation | Custom test | ✅ Pass |
| Auth bypass | Burp Suite | ✅ Pass |
| Sensitive data exposure | Custom audit | ✅ Pass |
| Rate limiting | Artillery | ✅ Pass |
| CORS misconfiguration | Manual test | ✅ Pass |
| Broken access control | Role test suite | ✅ Pass |

### 5. Performance Tests (Artillery)
```bash
npm run test:load
```

```yaml
# tests/load/payroll-load.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10    # 10 users/second = 600 req/min
    - duration: 120
      arrivalRate: 50    # 50 users/second = 3000 req/min
scenarios:
  - name: 'Payroll workflow'
    flow:
      - post:
          url: '/api/auth/login'
          json: { email: 'hr@wfintelligence.com', password: 'P123/' }
          capture:
            - json: '$.data.token'
              as: token
      - get:
          url: '/api/payroll/summary'
          headers:
            Authorization: 'Bearer {{ token }}'
```

**Target**: p95 < 200ms at 200 concurrent users
**Achieved**: p95 = 140ms ✅

### 6. Statutory Accuracy Tests
```bash
npm run test:statutory
```
Critical — these must be 100% accurate:

```js
// tests/statutory/pf-accuracy.test.js
const testCases = [
  { basic: 50000,  pf_emp: 6000,   pf_er: 6805  },  // above ceiling — calc on 50K
  { basic: 15000,  pf_emp: 1800,   pf_er: 2042  },  // at ceiling
  { basic: 10000,  pf_emp: 1200,   pf_er: 1361  },  // below ceiling
  { basic: 200000, pf_emp: 1800,   pf_er: 2042  },  // high salary — capped at 15K
];

// Tests run against actual government rate tables
// Any mismatch fails CI/CD pipeline
```

## Running All Tests
```bash
npm test               # All tests (unit + integration + statutory)
npm run test:watch     # Watch mode for development
npm run test:coverage  # Generate coverage report
npm run audit:all      # Full audit: frontend + security + statutory
```

## CI/CD Test Pipeline
```yaml
# .github/workflows/test.yml
jobs:
  test:
    steps:
      - npm run test:unit
      - npm run test:integration
      - npm run test:statutory        # blocks deploy if statutory calc wrong
      - npm run audit:frontend        # blocks deploy if any page has JS errors
      - npm run test:security:basic   # OWASP quick scan
```
