# Best Practices

Comprehensive best practice guides for Infinity Heroes: Bedtime Chronicles v5. These documents codify lessons learned from the 2026-03-27 comprehensive audit (5-persona, 585-test audit).

---

## Guides

| Guide | Description | Audience |
|-------|-------------|----------|
| [SECURITY.md](./SECURITY.md) | Authentication, input validation, child safety, rate limiting, PIN hashing, API security | All contributors |
| [TESTING.md](./TESTING.md) | Vitest configuration, test patterns, mocking, coverage targets, adding new tests | All contributors |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | WCAG 2.1 AA, accessibilityLabel patterns, touch targets, color contrast, child-friendly UX | Frontend contributors |
| [PERFORMANCE.md](./PERFORMANCE.md) | Vercel serverless optimization, AI provider timeouts, TTS caching, bundle size, rate limiting | All contributors |

---

## When to Read These

| Scenario | Read |
|----------|------|
| Adding a new API endpoint | SECURITY, TESTING |
| Adding a new screen/component | ACCESSIBILITY, TESTING |
| Modifying AI generation | SECURITY (child safety), PERFORMANCE (timeouts) |
| Modifying parent controls | SECURITY (PIN hashing), ACCESSIBILITY |
| Deploying to production | PERFORMANCE (serverless), SECURITY (auth guard) |
| Writing tests | TESTING |
| PR review | All four guides as review checklist |

---

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) — PR workflow, commit format, branch naming
- [CONVENTIONS.md](../../CONVENTIONS.md) — Code style, naming, file organization
- [CLAUDE.md](../../CLAUDE.md) — Project context for AI assistants
- [docs/SECURITY.md](../SECURITY.md) — Security posture overview (updated 2026-03-27)
- [docs/ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture
- [docs/API.md](../API.md) — API endpoint reference
- [docs/COMPREHENSIVE-AUDIT-2026-03-27.md](../COMPREHENSIVE-AUDIT-2026-03-27.md) — Full audit report
- [docs/SECURITY-FIXES-2026-03-27.md](../SECURITY-FIXES-2026-03-27.md) — Security fix documentation

---

## Origin

These guides were created as part of the comprehensive 5-persona audit conducted 2026-03-27:

- **Security Engineer** — OWASP Top 10, COPPA, API security, dependency audit
- **QA Lead** — Test coverage gaps, edge cases, error handling, data integrity
- **Performance Engineer** — Serverless bottlenecks, cold start, memory, bundle size
- **DevOps Engineer** — CI/CD, deployment, monitoring, operational readiness
- **UX/Accessibility Specialist** — WCAG compliance, child usability, error states

The audit expanded the test suite from 65 to 585 tests and identified/fixed 5 critical security vulnerabilities. These best practices encode the findings as actionable guidelines for ongoing development.
