> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 🔄 Iteration Plan — Workforce Intelligence

## Iteration Philosophy
WFI follows **2-week sprint cycles** with continuous delivery to staging
and monthly releases to production. Each iteration follows:
`Plan → Build → Test → Review → Deploy → Monitor → Repeat`

---

## Current Version — v12.0 (Released)

### What's In v12.0
- 121 HTML pages — complete HRMS coverage
- 0 JS runtime errors across all app pages
- dlPrint + dlCSV working on 116/116 pages
- ₹ symbol fixed on all financial pages
- Self-Assessment form added to Performance
- My Requests tab added to Employee Self-Service
- Registration Number field added
- EAP cards made clickable in Mental Health
- 14 new safety & welfare pages
- Biometric face recognition + enrollment
- DPDP Act 2023 + PoSH Act 2013 compliance
- Claude Sonnet AI integration (Assistant + Copilot)
- Print @media styles on all 117 pages

---

## Iteration v12.1 — Planned (Sprint 1–2)

### Priority 1 — Stability
- [ ] Fix remaining 4 tab-panel ID mismatches in payroll pages
- [ ] Improve mobile sidebar animation (slide-in on small screens)
- [ ] Fix print layout on 3 pages with overflow tables
- [ ] Add loading skeletons for API-dependent content

### Priority 2 — Payroll Enhancements
- [ ] Add New Tax Regime vs Old Regime comparison calculator
- [ ] Auto-generate Form 16 for all employees on year-end
- [ ] Bulk payslip email dispatch (one click → all employees)
- [ ] Salary bank transfer SFTP integration (HDFC/ICICI format)

### Priority 3 — HR Features
- [ ] Performance review approval workflow (HR → Manager → Employee)
- [ ] Training completion auto-trigger certificate generation
- [ ] 360° feedback reminder emails (automated)
- [ ] Exit clearance digital signature

---

## Iteration v12.2 — Planned (Sprint 3–4)

### Mobile App (React Native)
- [ ] iOS + Android app scaffold
- [ ] Push notifications (leave approval, payslip ready)
- [ ] Biometric login on mobile (Face ID, fingerprint)
- [ ] Mobile-first payslip viewer
- [ ] Quick leave application from mobile

### Integrations
- [ ] Google SSO (OAuth 2.0)
- [ ] Microsoft Azure AD SSO (SAML)
- [ ] Slack bot for approvals (@WFI approve leave-123)
- [ ] WhatsApp notifications (Twilio)
- [ ] Tally ERP payroll data export

---

## Iteration v12.3 — Planned (Sprint 5–6)

### Advanced AI
- [ ] Predictive attrition model (ML-based, 90-day forecast)
- [ ] Smart interview scheduling (AI suggests optimal times)
- [ ] AI-generated job descriptions (from role template)
- [ ] Sentiment analysis on pulse surveys
- [ ] Automated compliance risk alerts

### Reporting
- [ ] Scheduled report delivery (daily/weekly/monthly email)
- [ ] Custom report builder (drag-drop columns)
- [ ] Executive dashboard (Board-level KPIs)
- [ ] Headcount forecast model

---

## Iteration v13.0 — Future (Q2 2027)

### Multi-Tenant Architecture
- [ ] Company onboarding self-serve
- [ ] Tenant isolation (separate DB schemas or DBs)
- [ ] Custom branding per company (logo, colours, domain)
- [ ] Tenant-level billing and usage tracking

### Global Expansion
- [ ] Multi-currency (USD, GBP, AED, SGD)
- [ ] Multi-language (Hindi, Tamil, Telugu, Kannada, Marathi)
- [ ] UAE labour law compliance
- [ ] Singapore MOM compliance
- [ ] UK PAYE integration

---

## Feedback Loop

### Sources of Iteration Input
1. **Bug reports** — GitHub Issues, in-app feedback button
2. **Feature requests** — HR Director, Employee survey (quarterly)
3. **Usage analytics** — Most-used pages, highest drop-off
4. **Audit failures** — Any page failing the frontend audit
5. **Support tickets** — Recurring issues from HR team
6. **Security alerts** — Vulnerabilities, CVEs, compliance changes
7. **Regulatory changes** — DPDP amendments, new statutory rates

### Iteration Retrospective (Every 2 Weeks)
```
What worked well?
What slowed us down?
What do we do differently next sprint?
Were all WA tests completed?
Was staging deploy smooth?
```

---

## Version History

| Version | Date | Highlights |
|---|---|---|
| v1.0 | Jan 2025 | MVP: login, dashboard, payroll, leave |
| v5.0 | May 2025 | Biometrics, AI Assistant, 60 pages |
| v8.0 | Sep 2025 | DPDP compliance, PoSH, 85 pages |
| v10.0 | Jan 2026 | 100 pages, HR Copilot, fraud detection |
| v11.0 | Jun 2026 | 110 pages, face recognition, new safety pages |
| v12.0 | Oct 2026 | 121 pages, 0 JS errors, all issues fixed, 14 new pages |
| v12.1 | Nov 2026 | Mobile app, Form 16, bank SFTP (planned) |
| v13.0 | Q2 2027 | Multi-tenant, global expansion (planned) |
