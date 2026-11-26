> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🔐 Security Review — Workforce Intelligence

## Security Architecture

### Defence in Depth
```
Internet → Nginx (TLS 1.3 + WAF) → Rate Limiter → Auth Middleware
         → Input Validator → Business Logic → Parameterised DB
```

## Authentication & Authorisation

### JWT Implementation
```
Algorithm : HS256
Secret    : Min 256-bit random string (from .env)
Expiry    : 8 hours (access token)
Refresh   : 7 days (refresh token, HTTP-only cookie)
Claims    : { id, role_id, email, company_id }
Rotation  : Refresh token rotated on every use
```

**Reviewed Vulnerabilities**:
| Attack | Status | Mitigation |
|---|---|---|
| JWT algorithm confusion (none) | ✅ Fixed | Explicit HS256, reject `alg: none` |
| JWT secret brute-force | ✅ Fixed | Min 256-bit entropy enforced |
| Token replay | ✅ Fixed | Token blacklist in Redis on logout |
| Expired token acceptance | ✅ Fixed | Strict `exp` check + clock skew 30s |

### Role-Based Access Control (RBAC)
```
role_id: 1 = admin     → All endpoints
role_id: 2 = hr        → HR + payroll + reports
role_id: 3 = manager   → Team data + approvals
role_id: 4 = employee  → Own data only
```
Every API route explicitly declares required roles. Missing role check = **CI/CD fail**.

### Password Security
```
Algorithm : bcryptjs
Rounds    : 12 (≈250ms per hash — brute-force resistant)
Min length: 8 characters
Complexity: enforced client + server side
Breach    : Hibp API check on registration (optional)
```

## Data Security

### Sensitive Data Encryption
```
Biometric data : AES-256-GCM with per-record IV
PAN numbers    : AES-256-GCM, searchable via deterministic HMAC index
Aadhaar        : Last 4 digits only stored; full number never persisted
Bank accounts  : AES-256-GCM, masked in display (xxxx-xxxx-1234)
Salary data    : Column-level encryption for CTC fields
```

### Data Masking (Display Layer)
```js
// PAN: ABCDE1234F → ABCDE****F
// Aadhaar: 1234-5678-9012 → ****-****-9012
// Phone: 9876543210 → ******3210
// Bank: 1234567890 → xxxxxx7890
// Applied in all API responses, never raw values in frontend
```

### SQL Injection Prevention
```js
// ✅ ALWAYS use parameterised queries
await db.query('SELECT * FROM employees WHERE id = ?', [empId]);

// ❌ NEVER string concatenation
await db.query(`SELECT * FROM employees WHERE id = ${empId}`); // BANNED
```

## Network Security

### Nginx Security Headers
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;
```

### Rate Limiting
```js
// Auth endpoints — aggressive limiting
authLimiter: 5 requests / 15 min per IP (failed logins)

// API endpoints — moderate limiting
apiLimiter: 100 requests / 15 min per IP

// File upload — strict limiting
uploadLimiter: 10 requests / 1 hour per user
```

### CORS Configuration
```js
// Only whitelist known origins
const allowedOrigins = [process.env.APP_URL, process.env.ADMIN_URL];
cors({ origin: (origin, cb) => cb(null, allowedOrigins.includes(origin)) })
```

## DPDP Act 2023 Compliance

| Requirement | Implementation | Status |
|---|---|---|
| Consent before collection | Cookie banner + biometric consent modal | ✅ |
| Purpose limitation | Data collected only for stated HR purposes | ✅ |
| Data minimisation | Only necessary fields collected per role | ✅ |
| Storage limitation | Auto-purge after retention period | ✅ |
| Right to access | Employee can download their own data | ✅ |
| Right to correction | Profile self-edit, HR edit with audit trail | ✅ |
| Right to erasure | Deletion request workflow, 30-day SLA | ✅ |
| Breach notification | Alert system → DPA within 72 hours | ✅ |
| Data processor contracts | Vendor agreements tracked | ✅ |

## PoSH Act 2013 Security

| Requirement | Implementation |
|---|---|
| Complaint confidentiality | ICC-only access control on complaint records |
| Identity protection | Complainant anonymised in reports |
| Evidence security | Files AES-256 encrypted, role-restricted |
| Data retention | 3 years per NCRB guidelines |

## Audit & Monitoring

### Audit Log (Every Change Tracked)
```js
// What is logged:
{
  timestamp:  ISO 8601,
  user_id:    who performed the action,
  ip_address: client IP (for forensics),
  action:     PAYROLL_RUN | SALARY_EDIT | LOGIN | LOGOUT | DATA_EXPORT | ...,
  entity:     employees | payroll | leave | ...,
  entity_id:  record ID,
  old_value:  JSON of previous state,
  new_value:  JSON of new state,
  status:     SUCCESS | FAILED
}

// Audit log is APPEND-ONLY — no UPDATE or DELETE permitted
// Stored in separate audit_log table with restricted write access
```

### Fraud Detection Rules
- Duplicate salary account detection (same bank account, 2+ employees)
- Ghost employee: no attendance in 90+ days but active payroll
- Salary anomaly: > 20% variation from historical average
- Access anomaly: after-hours bulk data access
- Geofence violation: attendance from unusual location

## Security Checklist (Pre-Release)

- [ ] All `.env` values rotated
- [ ] JWT secret is 256-bit minimum
- [ ] All API routes have auth middleware
- [ ] No `console.log` with sensitive data in production build
- [ ] npm audit returns 0 critical vulnerabilities
- [ ] OWASP ZAP scan completed
- [ ] Penetration test for auth bypass
- [ ] Biometric data encryption verified
- [ ] DPDP consent flows tested
- [ ] Rate limiting tested under load
- [ ] Security headers verified with securityheaders.com
