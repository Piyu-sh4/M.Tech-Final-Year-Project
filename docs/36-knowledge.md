> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# KNOWLEDGE.md — Workforce Intelligence
## Domain Knowledge, Indian HR Laws & Business Rules

---

## 1. Statutory Compliance

### PF (Provident Fund) — EPF Act 1952
- Employee: 12% of Basic + DA
- Employer: 12% (EPS 8.33% capped at ₹15,000 Basic, EPF 3.67%)
- Applicability: 20+ employee establishments
- Due: 15th of following month
- UAN mandatory for all members

### ESI — ESI Act 1948
- Employee: 0.75% of gross, Employer: 3.25%
- Wage ceiling: ₹21,000/month gross — above = no ESI
- Applicability: 10+ employees in notified areas

### Gratuity — Gratuity Act 1972
- Formula: (Basic + DA) × 15/26 × Years
- Minimum 5 years service (waived for death/disability)
- Maximum: ₹20 Lakh (tax-exempt u/s 10(10))
- Payment: within 30 days of separation

### Professional Tax — State level
- Maharashtra: ₹2,500/year | Karnataka: ₹2,400 | TN: ₹2,400
- Not applicable: Delhi, Rajasthan, UP, Haryana

### LWF — State level
- Maharashtra: Employee ₹12, Employer ₹24 (6-monthly)
- Karnataka: ₹10 / ₹20 (annual Dec)
- Gujarat: ₹6 / ₹12 (6-monthly)

### Statutory Bonus — Bonus Act 1965
- Eligible: ≤ ₹21,000/month gross
- Calculation cap: ₹7,000/month
- Minimum: 8.33% | Maximum: 20%
- Minimum 30 working days in year
- Payment: within 8 months of accounting year end

### POSH — SH Act 2013
- ICC mandatory for 10+ employees
- Presiding officer: senior woman employee
- External member: mandatory (NGO for women)
- Annual report: January 31 each year to District Officer
- Penalty: ₹50,000 for non-filing

### DPDP Act 2023
- Right to access: 30 days
- Right to erasure: non-statutory data only
- Statutory retention: Payroll 7 yrs, PF 8 yrs, TDS 7 yrs
- Consent: explicit, purpose-limited, withdrawable

### Maternity Benefit Act 2017
- 26 weeks (< 2 children) | 12 weeks (3+ children)
- Adoption: 12 weeks (child < 3 months)
- Crèche: mandatory for 50+ employees

---

## 2. Payroll Calculations

### Salary Components
| Component | % of CTC | Tax |
|---|---|---|
| Basic | 40-50% | Fully taxable |
| HRA | 40-50% of Basic | Partial exempt 10(13A) |
| Special Allowance | Residual | Fully taxable |
| NPS Employer | 10% Basic | Exempt 80CCD(2) no cap |

### HRA Exemption — Minimum of 3:
1. Actual HRA received
2. 50% Basic (Metro) / 40% (Non-Metro)
3. Rent paid minus 10% of Basic

Metro cities: Delhi, Mumbai, Chennai, Kolkata

### LOP = (Basic + DA) ÷ 26 × LOP days

### Leave Encashment = Basic ÷ 26 × days encashed
Tax-exempt u/s 10(10AA) up to ₹25 Lakh

### Advance Tax Instalments
- Jun 15: 15% | Sep 15: 45% | Dec 15: 75% | Mar 15: 100%

---

## 3. Leave Rules

### Standard Leave Types
- Annual/Earned Leave: 15-18 days/year, carry forward, encashable
- Sick Leave: 7-12 days/year, no carry forward
- Casual Leave: 5-8 days/year, no carry forward
- COMP-OFF: earned by working weekends/holidays, 30-day claim limit
- Maternity: 26 weeks (MBA 2017)

### Sandwich Rule
If leave taken on Friday AND Monday → Saturday and Sunday ALSO counted as leave days.
Example: Leave Fri-Mon (4 calendar days) = 4 leave days deducted (not 2).

### COMP-OFF Rules
- 2-4 hours worked = 0.5 day COMP-OFF
- 6+ hours worked = 1 full day COMP-OFF
- Must apply within 30 days of worked date
- Requires manager approval

---

## 4. Tax Deductions Reference

| Section | Deduction | Limit |
|---|---|---|
| 80C | PF, ELSS, LIC, PPF, Home Loan Principal | ₹1,50,000 |
| 80D | Medical insurance | ₹25,000 (₹50,000 senior) |
| 80CCD(1B) | NPS voluntary | ₹50,000 |
| 80CCD(2) | NPS employer | 10% Basic (no cap) |
| 80EEA | Additional home loan interest | ₹1,50,000 |
| 80GG | Rent (no HRA) | Min of ₹5K/month, 25% income, Rent-10% income |
| 80TTA | Savings bank interest | ₹10,000 |
| 80TTB | All interest (senior 60+) | ₹50,000 |
| 24(b) | Home loan interest | ₹2,00,000 |
| 10(10AA) | Leave encashment | ₹25,00,000 private sector |

---

## 5. Performance Framework

### Bell Curve Distribution
- 5 Exceptional: 5-10% | 4 Exceeds: 20-25% | 3 Meets: 50-60%
- 2 Partially Meets: 10-15% | 1 Does Not Meet: 2-5%

### OKR — Google 0.7 Standard
- 1.0 = fully achieved (too easy)
- 0.7 = target (ambitious but achievable)
- < 0.5 = not achieved, review and adjust

### 9-Box Grid
- High Perf + High Potential = Stars → fast-track, succession
- High Perf + Low Potential = Solid Contributors → retain, reward
- Low Perf + High Potential = Diamonds in Rough → develop, coach
- Low Perf + Low Potential = Underperformers → PIP or exit

---

## 6. Band/Grade Structure

| Band | Level | Typical Role | CTC Range |
|---|---|---|---|
| L1 | Intern | Trainee, Apprentice | ₹2-4 LPA |
| L2 | Associate | Junior Developer | ₹4-7 LPA |
| L3 | Analyst | Developer, Analyst | ₹7-12 LPA |
| L4 | Senior Analyst | Senior Developer | ₹12-18 LPA |
| L5 | Manager/Lead | Tech Lead, Manager | ₹18-28 LPA |
| L6 | Senior Manager | Staff Engineer, Sr Manager | ₹28-45 LPA |
| L7 | Director | Principal, Director | ₹45-80 LPA |
| L8 | VP/C-Suite | VP, CHRO, CTO, CFO | ₹80 LPA+ |

---

## 7. Key HR Metrics

| Metric | Formula |
|---|---|
| Attrition Rate | Employees left ÷ Avg headcount × 100 |
| eNPS | % Promoters − % Detractors |
| Absenteeism Rate | Days absent ÷ Scheduled days × 100 |
| Revenue per Employee | Total revenue ÷ Headcount |
| HR:Employee Ratio | HR staff ÷ Total employees (benchmark 1:15-20) |
| Span of Control | Avg direct reports per manager (benchmark 5-8) |
| Time to Fill | Date join − Date requisition opened |
| Cost of Vacancy | Productivity loss + Recruitment + Training + Mgmt overhead |
