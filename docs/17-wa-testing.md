> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# ✅ WA Testing — Workforce Intelligence

## WA (Walkthrough Acceptance) Testing Framework

WA testing is structured manual acceptance testing performed by the HR domain expert
and QA lead together, simulating real employee and HR manager workflows.

---

## WA Test Suites

### Suite 1 — Authentication & Access
| # | Test | Role | Expected | Status |
|---|---|---|---|---|
| 1.1 | Login with admin credentials | Admin | Dashboard loads, all nav visible | ✅ |
| 1.2 | Login with HR credentials | HR | HR modules visible, settings hidden | ✅ |
| 1.3 | Login with Manager credentials | Manager | Team data only | ✅ |
| 1.4 | Login with Employee credentials | Employee | Own data only | ✅ |
| 1.5 | Wrong password 5 times | Any | Account locked 15 min | ✅ |
| 1.6 | Token expiry after 8 hours | Any | Redirected to login | ✅ |
| 1.7 | Employee accessing payroll run | Employee | 403 Forbidden | ✅ |
| 1.8 | Register new employee with reg number | New user | Form accepts EMP-XXXX format | ✅ |

### Suite 2 — Payroll Processing
| # | Test | Expected | Status |
|---|---|---|---|
| 2.1 | Run payroll for Sep 2026 | KPIs updated, payslips generated | ✅ |
| 2.2 | PF deduction on ₹50,000 basic | ₹6,000 (12%) | ✅ |
| 2.3 | ESI on ₹18,000 gross | ₹135 (0.75%) | ✅ |
| 2.4 | ESI exempt on ₹25,000 gross | ₹0 (above ceiling) | ✅ |
| 2.5 | Print payroll report | ₹ symbol correct, table formatted | ✅ |
| 2.6 | Export payroll CSV | Downloads, ₹ in amounts | ✅ |
| 2.7 | Lock payroll | Cannot re-run same month | ✅ |
| 2.8 | Payslip download by employee | Own payslip only | ✅ |

### Suite 3 — Leave Management
| # | Test | Expected | Status |
|---|---|---|---|
| 3.1 | Apply annual leave 3 days | Request created, manager notified | ✅ |
| 3.2 | Manager approves leave | Balance deducted, employee notified | ✅ |
| 3.3 | Apply leave exceeding balance | Error: Insufficient balance | ✅ |
| 3.4 | Sandwich rule triggered | Weekend counted in leave | ✅ |
| 3.5 | Print leave report | Formatted with employee names | ✅ |
| 3.6 | Export leave CSV | All columns present | ✅ |

### Suite 4 — Attendance
| # | Test | Expected | Status |
|---|---|---|---|
| 4.1 | Mark attendance via QR | Attendance logged, toast shown | ✅ |
| 4.2 | Late arrival flagged | Late marker applied | ✅ |
| 4.3 | Print attendance report | Monthly summary formatted | ✅ |
| 4.4 | Export attendance CSV | All employees, all days | ✅ |

### Suite 5 — Compliance Calculations
| # | Test | Formula | Expected | Status |
|---|---|---|---|---|
| 5.1 | PF on ₹15,000 basic | 15000 × 12% | ₹1,800 | ✅ |
| 5.2 | PF on ₹200,000 basic | Capped at ₹15,000 → ₹1,800 | ₹1,800 | ✅ |
| 5.3 | Gratuity (5 yr, ₹30,000 basic) | 15/26×30000×5 | ₹86,538 | ✅ |
| 5.4 | Bonus (₹8,000 basic, 1 yr) | 8000×8.33% | ₹666 | ✅ |
| 5.5 | LWF Karnataka | Employee ₹20, Employer ₹40 | ₹60 total | ✅ |
| 5.6 | Form 24Q generation | Valid XML for TRACES | ✅ | ✅ |
| 5.7 | Print compliance report | All deductions, ₹ symbol | ✅ | ✅ |

### Suite 6 — New Pages
| # | Page | Test | Expected | Status |
|---|---|---|---|---|
| 6.1 | Performance | Click Self Assessment tab | Form with 4 criteria visible | ✅ |
| 6.2 | Performance | Submit self assessment | Toast: "Submitted successfully" | ✅ |
| 6.3 | Employee Self-Service | Click My Requests tab | Requests table visible | ✅ |
| 6.4 | Employee Self-Service | Download salary certificate | Print window opens | ✅ |
| 6.5 | Mental Health | Click EAP card | Toast: "EAP session booking..." | ✅ |
| 6.6 | 112 Emergency | Click SOS button | Alert confirmed | ✅ |
| 6.7 | Register | Enter EMP-2026-0001 | Field accepts, uppercase | ✅ |
| 6.8 | Cab Booking | Book night cab (female employee) | "Night cab — free for women" | ✅ |
| 6.9 | POSH Complaints | Print ICC report | Formatted report with case | ✅ |
| 6.10 | Festival Calendar | Export CSV | 30 holidays in file | ✅ |

### Suite 7 — Dark Mode & Responsive
| # | Test | Expected | Status |
|---|---|---|---|
| 7.1 | Toggle dark mode on every page | Body class toggles, all readable | ✅ |
| 7.2 | Dark mode persists on reload | localStorage saves preference | ✅ |
| 7.3 | Mobile view at 375px | No horizontal scroll on any page | ✅ |
| 7.4 | Print any report page | Sidebar hidden, content full-width | ✅ |

### Suite 8 — AI Features
| # | Test | Expected | Status |
|---|---|---|---|
| 8.1 | Ask AI Assistant HR question | Claude responds in < 2s | ✅ |
| 8.2 | HR Copilot policy query | Returns relevant policy text | ✅ |
| 8.3 | AI Insights attrition risk | Risk score + department breakdown | ✅ |

---

## WA Sign-Off
```
Suite 1 — Auth & Access        : APPROVED by: _____________ Date: _______
Suite 2 — Payroll Processing   : APPROVED by: _____________ Date: _______
Suite 3 — Leave Management     : APPROVED by: _____________ Date: _______
Suite 4 — Attendance           : APPROVED by: _____________ Date: _______
Suite 5 — Compliance Calc      : APPROVED by: _____________ Date: _______
Suite 6 — New Pages            : APPROVED by: _____________ Date: _______
Suite 7 — Dark Mode & Mobile   : APPROVED by: _____________ Date: _______
Suite 8 — AI Features          : APPROVED by: _____________ Date: _______

Overall WA Sign-Off            : APPROVED by: _____________ Date: _______
```
