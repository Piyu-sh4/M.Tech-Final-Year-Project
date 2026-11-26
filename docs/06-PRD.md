> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 📄 Product Requirements Document (PRD)
# Workforce Intelligence — Enterprise HRMS

**Version**: 12.0  
**Date**: October 2026  
**Status**: Production Released  
**Owner**: Product Team  

---

## 1. Executive Summary

Workforce Intelligence (WFI) v12.0 is a production-ready, full-stack Enterprise HR Management System for Indian businesses. It replaces fragmented HR tools with a single, AI-powered, biometric-enabled, DPDP Act 2023-compliant platform covering every HR function from hire to exit.

**Key Numbers**: 121 pages · 96 API files · 0 JS errors · Claude Sonnet AI · 6-method biometrics · 14 statutory calculators · 4 user roles

---

## 2. Goals & Non-Goals

### Goals
- Automate monthly payroll with statutory accuracy (PF, ESI, TDS, LWF, Gratuity, Bonus)
- Provide AI-powered HR assistance via Claude Sonnet (Assistant + Copilot)
- Enable biometric attendance with 6 capture methods
- Ensure full DPDP Act 2023 + PoSH Act 2013 compliance
- Give employees 24/7 self-service for leave, payslip, requests, cab booking
- Deliver real-time fraud detection and cybersecurity monitoring
- Be self-hosted, Docker-based — zero per-seat SaaS fees

### Non-Goals (v12.0)
- Mobile native app (iOS/Android) — planned for v12.1
- Multi-tenant / multi-company — planned for v13.0
- Global payroll (non-India) — planned for v13.0
- Third-party ATS integrations (LinkedIn, Naukri) — backlog
- Offline-first PWA (partial PWA only) — backlog

---

## 3. User Personas

| Persona | Role | Primary Need |
|---|---|---|
| Priya Sharma | System Admin | Full control, audit, security |
| Ravi Kumar | HR Manager | Payroll, compliance, reports |
| Sneha Reddy | Team Manager | Approvals, team analytics |
| Arjun Nair | Employee | Self-service, payslip, leave |

---

## 4. Features & Requirements

### 4.1 Core HR Management

| Feature | Priority | Status |
|---|---|---|
| Admin Dashboard with live KPIs | P0 | ✅ Done |
| Employee Dashboard (personalised) | P0 | ✅ Done |
| Manager Dashboard | P0 | ✅ Done |
| Activity History & Audit Trail | P0 | ✅ Done |
| Employee Directory (search, filter) | P1 | ✅ Done |
| Org Chart | P1 | ✅ Done |
| Employee Grades & Bands | P1 | ✅ Done |
| Diversity & Headcount Analytics | P2 | ✅ Done |

### 4.2 Attendance & Leave

| Feature | Priority | Status |
|---|---|---|
| Biometric Attendance (6 methods) | P0 | ✅ Done |
| Face Recognition + Liveness | P0 | ✅ Done |
| Biometric Enrollment Center | P0 | ✅ Done |
| Shift Roster & Management | P1 | ✅ Done |
| Shift Bidding & Exchange | P2 | ✅ Done |
| WFH Tracker | P1 | ✅ Done |
| Time Tracker (project-based) | P2 | ✅ Done |
| Leave Management (8 types) | P0 | ✅ Done |
| Holiday / Festival Calendar | P1 | ✅ Done |

### 4.3 Payroll & Finance

| Feature | Priority | Status |
|---|---|---|
| Monthly Payroll Processing | P0 | ✅ Done |
| Payslip Portal (self-service) | P0 | ✅ Done |
| Salary Revision & Increment | P1 | ✅ Done |
| Salary Advance | P2 | ✅ Done |
| TDS / IT Returns Portal | P0 | ✅ Done |
| Investment Declaration (80C/80D) | P0 | ✅ Done |
| Form 24Q Quarterly Return | P0 | ✅ Done |
| Statutory Bonus Calculation | P1 | ✅ Done |
| LWF Tracker (12 states) | P1 | ✅ Done |
| Benefits Management | P1 | ✅ Done |
| Flexible Benefits | P2 | ✅ Done |
| Loan Portal | P2 | ✅ Done |
| Minimum Wages Compliance | P1 | ✅ Done |
| Banking & Salary Transfer | P1 | ✅ Done |

### 4.4 Compliance

| Feature | Priority | Status |
|---|---|---|
| PF / ESI / PT / TDS Calculators | P0 | ✅ Done |
| LWF / Gratuity Calculator | P0 | ✅ Done |
| Statutory Compliance Dashboard | P0 | ✅ Done |
| DPDP Act 2023 Privacy Policy | P0 | ✅ Done |
| Cookie Policy (GDPR + DPDP) | P0 | ✅ Done |
| PoSH Complaints & ICC | P0 | ✅ Done |
| Company Policies (47 policies) | P1 | ✅ Done |
| IT Security Policy | P1 | ✅ Done |

### 4.5 Hiring & Onboarding

| Feature | Priority | Status |
|---|---|---|
| Hiring & ATS | P0 | ✅ Done |
| Interview Scheduler | P1 | ✅ Done |
| Background Verification | P1 | ✅ Done |
| Employee Referral Portal | P2 | ✅ Done |
| Onboarding Checklist | P0 | ✅ Done |
| Registration Tracker | P1 | ✅ Done |
| Confirmation Letter Generator | P1 | ✅ Done |

### 4.6 Performance & Development

| Feature | Priority | Status |
|---|---|---|
| Performance Reviews (360°) | P0 | ✅ Done |
| Self-Assessment Form | P0 | ✅ Done (added v12) |
| Goals & OKR Framework | P1 | ✅ Done |
| Training & LMS | P1 | ✅ Done |
| Skills Matrix | P2 | ✅ Done |
| Career Roadmap | P2 | ✅ Done |
| Probation Tracker | P1 | ✅ Done |
| Leaderboard | P2 | ✅ Done |
| Awards & Recognition | P2 | ✅ Done |
| Exit Management | P1 | ✅ Done |

### 4.7 AI & Intelligence

| Feature | Priority | Status |
|---|---|---|
| AI HR Assistant (Claude Sonnet) | P0 | ✅ Done |
| HR Copilot (RAG-based) | P0 | ✅ Done |
| AI Insights (predictive) | P1 | ✅ Done |
| Fraud Detection Engine | P0 | ✅ Done |
| Cybersecurity / SIEM | P1 | ✅ Done |
| Threat Monitor | P1 | ✅ Done |

### 4.8 Safety & Welfare

| Feature | Priority | Status |
|---|---|---|
| 112 Emergency & SOS | P0 | ✅ Done |
| Women Safety Policy | P0 | ✅ Done |
| Cab & Transport Booking | P0 | ✅ Done |
| Mental Health & EAP | P1 | ✅ Done |
| Visitor Management | P2 | ✅ Done |
| Pulse Survey | P2 | ✅ Done |
| Team Connect | P2 | ✅ Done |
| Welfare Hub | P2 | ✅ Done |

### 4.9 Analytics & Reports

| Feature | Priority | Status |
|---|---|---|
| Analytics Dashboard | P0 | ✅ Done |
| Reports Center (40+ templates) | P0 | ✅ Done |
| Workforce Planning | P1 | ✅ Done |
| Real-Time Monitor | P2 | ✅ Done |

### 4.10 Employee Self-Service

| Feature | Priority | Status |
|---|---|---|
| Employee Self-Service Portal | P0 | ✅ Done |
| My Requests Tab | P0 | ✅ Done (added v12) |
| Registration Number Field | P1 | ✅ Done (added v12) |
| Document Vault | P1 | ✅ Done |
| Profile Management | P1 | ✅ Done |

---

## 5. Acceptance Criteria

### System-Wide
- [ ] All 116 app pages load with 0 JS runtime errors
- [ ] dlPrint opens formatted print window on 116/116 pages
- [ ] dlCSV downloads CSV on 116/116 pages
- [ ] Dark mode toggles on 116/116 pages
- [ ] Cookie banner present on 116/116 pages
- [ ] ₹ symbol displayed correctly (never Rs or â‚¹)
- [ ] All pages mobile-responsive at 375px

### Payroll Accuracy (Must be 100%)
- [ ] PF: 12% employee, 13.61% employer, ceiling ₹15,000
- [ ] ESI: 0.75%/3.25%, eligible ≤ ₹21,000
- [ ] Gratuity: 15/26 × Basic × Years
- [ ] Bonus: 8.33%–20% on ₹7,000/min wage
- [ ] TDS: current FY new regime slabs

### Performance
- [ ] API p95 < 200ms under 200 concurrent users
- [ ] Page load < 3s on 3G
- [ ] Payroll run (500 employees) < 30s

### Security
- [ ] JWT auth on all non-public endpoints
- [ ] Biometric data AES-256-GCM encrypted
- [ ] 0 critical npm vulnerabilities
- [ ] OWASP Top 10 scan passes

---

## 6. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Payroll processing time | < 30s/500 emp | Automated test |
| HR time saved per month | 20+ hours | User survey |
| Employee self-service adoption | > 80% | Usage analytics |
| Statutory filing accuracy | 100% | Audit comparison |
| System uptime | > 99.5% | CloudWatch |
| User satisfaction (NPS) | > 50 | Quarterly survey |

---

## 7. Constraints & Dependencies

- **Anthropic Claude API**: Required for AI features; outage degrades AI sections gracefully
- **Browser**: Modern browsers (Chrome 110+, Firefox 110+, Safari 16+) required
- **Node.js 18+**: LTS version required for all backend features
- **Docker**: Required for standard deployment
- **India-specific**: PF/ESI/TDS rates are India-specific; international expansion needs new rate engine
