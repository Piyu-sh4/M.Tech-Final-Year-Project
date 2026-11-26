> Historical document: preserved for context. See [the current implementation review](49-current-review.md), [security review](50-security-review.md) and [test evidence](51-testing.md) for release status and known gaps.

# 📚 Documentation Index — Workforce Intelligence

All project documentation is in this `/docs` folder.

## Product
| File | Description |
|---|---|
| [PRD.md](06-PRD.md) | Product Requirements Document — features, priorities, acceptance criteria |
| [idea.md](01-idea.md) | Project idea, vision, value proposition, differentiators |
| [research.md](02-research.md) | Market research, competitor analysis, technical choices |
| [define-users.md](03-define-users.md) | User personas, journeys, accessibility |
| [missing.md](24-missing.md) | Known gaps, backlog, what was fixed in v12.0 |

## Design
| File | Description |
|---|---|
| [appflow.md](08-appflow.md) | Complete app flow maps for every module |
| [ui.md](09-ui.md) | Design system: colors, typography, components, layouts |
| [ux.md](10-ux.md) | UX patterns, interaction design, copy guidelines |

## Engineering
| File | Description |
|---|---|
| [TRD.md](07-TRD.md) | Technical Requirements Document — specs for every layer |
| [tech-stack.md](04-tech-stack.md) | Full tech stack with versions, rationale, dependency matrix |
| [backend-schema.md](11-backend-schema.md) | Complete MySQL schema — all 20+ tables with SQL |
| [project-rules.md](05-project-rules.md) | Coding standards, Git workflow, security rules |

## Process
| File | Description |
|---|---|
| [implementation-plan.md](12-implementation-plan.md) | 22-week plan with all 200+ tasks, owners, status |
| [task-breakdown.md](13-task-breakdown.md) | Phase-by-phase task checklist |
| [setup.md](14-setup.md) | Complete setup guide: Docker, .env, manual setup |
| [development.md](15-development.md) | Dev workflow, API patterns, page template |
| [code-review.md](20-code-review.md) | PR checklists, common issues, review process |

## Quality
| File | Description |
|---|---|
| [testing.md](51-testing.md) | Unit, integration, Playwright, security, load tests |
| [wa-testing.md](17-wa-testing.md) | 50+ WA test cases with expected results and sign-off |
| [preview-development.md](18-preview-development.md) | Preview environments, visual review steps |
| [security-review.md](19-security-review.md) | Security architecture, DPDP compliance, audit |

## Operations
| File | Description |
|---|---|
| [production-deploy.md](21-production-deploy.md) | Step-by-step AWS deploy, Nginx, SSL, CI/CD, rollback |
| [monitoring.md](22-monitoring.md) | Metrics, CloudWatch alarms, logging, incident response |
| [iteration.md](23-iteration.md) | Version history, v12.1–v13.0 roadmap, feedback loop |

---

## Quick Reference

```bash
# Start locally
docker compose up -d
open http://localhost:5000/login.html

# Credentials
admin@wip.com / P123/          (Admin — full access)
hr@wfintelligence.com / P123/  (HR Manager)
manager@wfintelligence.com / P123/ (Manager)
employee@wfintelligence.com / P123/ (Employee)

# Run all tests
npm test

# Frontend audit (116/116 pages must pass)
npm run audit:frontend

# Project stats
121 pages · 96 API files · 0 JS errors · Claude AI · DPDP 2023
```
