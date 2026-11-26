> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# PRD — Workforce Intelligence
## Product Requirements Document

**Version:** 12.0  
**Date:** July 2026  
**Status:** Complete — Production Ready  
**Owner:** HR Engineering Team  

---

## 1. Executive Summary

Workforce Intelligence v12.0 is a full-stack HRMS (Human Resource Management System) platform designed for mid-to-large Indian enterprises. It covers every HR lifecycle — from hiring through retirement — in a single, integrated platform with AI-powered assistance, real-time monitoring, statutory compliance, and 14 enterprise-grade security controls.

---

## 2. Problem Statement

Indian enterprises managing 100–5,000 employees face:

| Problem | Impact |
|---|---|
| Fragmented tools (payroll, leave, attendance in different systems) | Data silos, reconciliation errors, 3–5 hours/day lost per HR |
| Manual statutory compliance (PF, ESI, LWF, POSH, DPDP) | Risk of ₹10,000–₹50,000 fines per violation |
| No AI assistance for HR queries | Repeated queries to HR consume 40% of HR team's time |
| No real-time visibility into employee productivity | Managers unaware of attendance/idle time patterns |
| Siloed data — no attrition prediction | 30%+ annual attrition in IT sector without early warning |

---

## 3. Product Vision

> "One platform where every employee, manager, and HR professional has everything they need — from payslip to promotion, from POSH compliance to AI-powered HR answers — with zero need for separate tools."

---

## 4. Target Users

| Role | Primary Use Cases |
|---|---|
| **Admin** | User management, audit log, security controls, system settings |
| **HR Manager** | Payroll processing, compliance, hiring, exit, reporting |
| **Manager** | Team leave approval, performance review, OKR tracking, attendance |
| **Employee** | Payslip, leave application, tax portal, AI chat, cab booking |

---

## 5. Core Functional Requirements

### 5.1 Payroll & Tax Engine
- [ ] Full CTC structure with component-level configuration
- [ ] HRA exemption calculator (Metro/Non-Metro rules)
- [ ] Perquisite tax u/s 17(2) — car, accommodation, ESOPs
- [ ] Advance tax 4-instalment calculator (Jun/Sep/Dec/Mar)
- [ ] New vs Old tax regime comparison with optimal recommendation
- [ ] Form 16 Part A and Part B generation
- [ ] Form 24Q quarterly TDS return
- [ ] AIS/TIS download integration stub
- [ ] Leave encashment payout with 10(10AA) exemption
- [ ] Section 80EEA, 80GG, 80TTA/TTB deductions
- [ ] FBP (Flexible Benefit Plan) restructuring

### 5.2 Leave & Attendance
- [ ] 18-day annual leave, sick leave, casual leave tracking
- [ ] LOP calculator: Basic ÷ 26 × LOP days
- [ ] COMP-OFF application with worked date and avail date
- [ ] Sandwich rule auto-detection (Friday-Monday leave)
- [ ] Maternity Benefit Act 2017 — 26-week / 12-week / crèche
- [ ] WFH tracker with productivity self-rating
- [ ] Shift roster with day/evening/night/rotational patterns
- [ ] OT tracker with approval workflow and 1.5x pay note
- [ ] Biometric sync status and offline punch reconciliation

### 5.3 Performance Management
- [ ] 9-Box talent grid (Performance × Potential)
- [ ] OKR tracking with Google's 0.7 standard
- [ ] PIP (Performance Improvement Plan) — 30/60/90 day
- [ ] 360-degree feedback — peer, manager, subordinate
- [ ] Mid-year review with goal re-alignment
- [ ] Promotion recommendation with committee workflow
- [ ] Bell curve calibration
- [ ] Continuous feedback (CF) — not limited to review cycles

### 5.4 Compliance
- [ ] PF: 12% employee + 12% employer (8.33% EPS)
- [ ] ESI: 0.75% employee + 3.25% employer
- [ ] Gratuity: Basic × 15 × Years ÷ 26
- [ ] LWF — all states with correct rates and due dates
- [ ] POSH: ICC committee, complaint, hearing, annual report (Jan 31)
- [ ] DPDP Act 2023: consent dashboard, data portability, erasure
- [ ] Equal Remuneration Act: pay parity dashboard
- [ ] Payment of Wages Act: payment date compliance tracker
- [ ] Maternity Benefit Act 2017: complete lifecycle

### 5.5 AI Features
- [ ] HR Copilot: RAG with 27 knowledge chunks, [Sources] citations
- [ ] AI Assistant: document upload (PDF/DOCX/Image), 8 quick actions
- [ ] Flight Risk Model: 30-day resignation probability per employee
- [ ] Attrition prediction: Python ML model (scikit-learn)
- [ ] Compensation benchmark: P50/P75/P90 market comparison
- [ ] Offline fallback when Anthropic API is unavailable

### 5.6 Security (14 Controls)
- [ ] JWT HS256 — 7-day token, role claim, middleware on every route
- [ ] bcrypt SALT_ROUNDS=12 — password hashing
- [ ] RBAC — 4 roles, server-side enforcement
- [ ] Rate limiting — 300 API / 10 login / 5 register per 15 min
- [ ] XSS prevention — input sanitisation
- [ ] SQL injection guard — parameterised queries
- [ ] 7 security headers (Helmet)
- [ ] Full audit trail — every action logged
- [ ] Brute force block — lockout after 5 failed attempts
- [ ] Session management — view and force-terminate
- [ ] CORS policy — configurable origin whitelist
- [ ] DPDP consent — immutable consent audit log
- [ ] Fraud detection — ghost employee, payroll anomaly
- [ ] File upload security — MIME type, 10MB limit, extension whitelist

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (frontend) | < 2 seconds on LAN |
| API response time | < 300ms for standard queries |
| Concurrent users | 500 simultaneous users |
| Database | MySQL 8.0, utf8mb4, 125 tables |
| Uptime | 99.5% (PM2 cluster mode + health check) |
| Browser support | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| Mobile | Responsive — minimum 768px wide |
| Accessibility | WCAG 2.1 Level AA |
| Data retention | Payroll: 7 yrs, HR records: 5 yrs, Audit: 2 yrs |

---

## 7. Research Gap Features (v12.0 Additions)

17 pages enhanced with 39 research-backed features identified from Indian HR practice gaps:

| Category | Features Added |
|---|---|
| Leave | COMP-OFF, Sandwich Rule, Encashment Calculator |
| Attendance | OT Tracker, Core Hours Compliance, Biometric Sync |
| Performance | Mid-year Review, Promotion Recommendation |
| Compliance | Equal Remuneration Act, Payment of Wages, POSH Annual Report |
| Onboarding | Day 30/60/90 Surveys, Buddy Program |
| Tax | Section 80EEA, 80GG, 80TTA/TTB |
| Workforce | Cost of Vacancy Calculator, Internal Mobility Map |
| AI | Flight Risk Warning, Market Compensation Benchmark |
| Benefits | GTL Nominee, Critical Illness, Voluntary Top-up |
| Data Rights | DPDP Portability, Erasure, Consent Audit Log |
| Fraud | Ghost Employee Detection, Expense Fraud Scanner |
| Diversity | Pay Equity Audit, PWD Tracker (RPWD Act 2016) |

---

## 8. Out of Scope (v12.0)

- Mobile native app (iOS/Android)
- Multi-tenant SaaS (single-tenant only)
- Payroll bank file ACH/NEFT direct integration
- Third-party HRMS import (SAP/Workday migration)
- Real biometric device SDK integration (stub only)
- Live video interview recording
- Advanced ML model training UI

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| JS Errors | 0 (Playwright verified) |
| Pages delivered | 106 |
| DB tables | 125 |
| Security controls | 14 |
| Research gap features | 39 |
| Test coverage | > 70% backend |
| Lighthouse score | > 85 |

---

## 10. Glossary

| Term | Definition |
|---|---|
| COMP-OFF | Compensatory Off — leave earned for working on holiday |
| Sandwich Rule | Weekends between leave days counted as leave |
| FBP | Flexible Benefit Plan — employee-configurable salary components |
| RAG | Retrieval-Augmented Generation — AI grounded in local knowledge |
| LOP | Loss of Pay — salary deducted for unplanned absence |
| DPDP | Digital Personal Data Protection Act 2023 |
| POSH | Prevention of Sexual Harassment Act 2013 |
| ICC | Internal Complaints Committee (under POSH) |
| RPWD | Rights of Persons with Disabilities Act 2016 |
| TDS | Tax Deducted at Source |
| CTC | Cost to Company — total employer expense per employee |
