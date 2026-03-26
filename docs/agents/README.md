<!-- Last verified: 2026-03-26 -->
# docs/agents/ — Specialized Domain Expert Agents

This directory contains 12 specialized AI agent instruction files, each covering a specific cross-domain expertise area of the Infinity Heroes: Bedtime Chronicles codebase.

Each agent file provides:
- Authoritative scope definition
- Key file and directory inventory
- Technology stack reference
- Code patterns and conventions
- Security/review escalation rules
- Cross-agent links

---

## Agent Index

| # | Agent File | Domain | Primary Files |
|---|-----------|--------|--------------|
| 1 | [FRONTEND-MOBILE-AGENT.md](./FRONTEND-MOBILE-AGENT.md) | Expo/React Native screens, navigation, animations | `app/`, `components/`, `constants/` |
| 2 | [BACKEND-API-AGENT.md](./BACKEND-API-AGENT.md) | Express routes, middleware, server patterns | `server/index.ts`, `server/routes.ts` |
| 3 | [AI-INTEGRATION-AGENT.md](./AI-INTEGRATION-AGENT.md) | Multi-provider AI routing, prompt engineering | `server/ai/` |
| 4 | [SECURITY-SAFETY-AGENT.md](./SECURITY-SAFETY-AGENT.md) | Child safety rules, sanitization, rate limiting | `CHILD_SAFETY_RULES`, `sanitizeString()` |
| 5 | [DATABASE-AGENT.md](./DATABASE-AGENT.md) | Drizzle ORM, PostgreSQL, schema management | `shared/schema.ts`, `server/db.ts` |
| 6 | [AUDIO-TTS-AGENT.md](./AUDIO-TTS-AGENT.md) | ElevenLabs TTS, voice chat, background music | `server/elevenlabs.ts`, `server/suno.ts` |
| 7 | [STORY-GENERATION-AGENT.md](./STORY-GENERATION-AGENT.md) | Story content, AI prompts, story modes | `server/routes.ts` (story endpoints), `app/story.tsx` |
| 8 | [DESIGN-SYSTEM-AGENT.md](./DESIGN-SYSTEM-AGENT.md) | Cosmic theme, StyleSheet, animations | `constants/colors.ts`, `constants/timing.ts` |
| 9 | [TESTING-QA-AGENT.md](./TESTING-QA-AGENT.md) | Vitest tests, mocking, coverage targets | `*.test.ts`, `vitest.config.ts` |
| 10 | [DEVOPS-DEPLOYMENT-AGENT.md](./DEVOPS-DEPLOYMENT-AGENT.md) | EAS builds, Replit deployment, CI/CD | `eas.json`, `scripts/`, `.github/workflows/` |
| 11 | [PERFORMANCE-AGENT.md](./PERFORMANCE-AGENT.md) | React Query, caching, bundle optimization | `lib/query-client.ts`, `server_dist/` |
| 12 | [CONTENT-UX-AGENT.md](./CONTENT-UX-AGENT.md) | Children's UX, badge system, gamification | `app/completion.tsx`, `app/trophies.tsx` |

---

## Selecting the Right Agent

Use this decision tree to select the right agent for your task:

```
Is the task about...

Visual UI / Screens?
  → FRONTEND-MOBILE-AGENT + DESIGN-SYSTEM-AGENT

Server endpoint or middleware?
  → BACKEND-API-AGENT

AI provider or prompt?
  → AI-INTEGRATION-AGENT + STORY-GENERATION-AGENT

Child safety or security?
  → SECURITY-SAFETY-AGENT (mandatory context for any AI/story change)

Database schema or queries?
  → DATABASE-AGENT

Audio, voices, or TTS?
  → AUDIO-TTS-AGENT

Story content, modes, or lifecycle?
  → STORY-GENERATION-AGENT

Colors, fonts, or animations?
  → DESIGN-SYSTEM-AGENT

Tests or quality assurance?
  → TESTING-QA-AGENT

Build, deploy, or CI?
  → DEVOPS-DEPLOYMENT-AGENT

Performance, caching, or bundle?
  → PERFORMANCE-AGENT

Badges, streaks, or children's UX?
  → CONTENT-UX-AGENT
```

---

## Parent Coordination Document

See [`AGENTS.md`](../../AGENTS.md) for the full agent coordination framework, shared rules, and escalation policy.
