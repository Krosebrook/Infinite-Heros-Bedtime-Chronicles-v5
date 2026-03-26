<!-- Last verified: 2026-03-26 -->
# AGENTS.md — AI Agent Coordination

This is the single source of truth for how all AI coding agents interact with this repository.

---

## Agent Configuration Files

### General-Purpose Agents

| Agent | Config File | Purpose |
|-------|------------|---------|
| Claude Code | [`CLAUDE.md`](./CLAUDE.md) | Full project context, conventions, security rules, common tasks, gotchas |
| Gemini CLI | [`GEMINI.md`](./GEMINI.md) | Project context, conventions, build commands, constraints |
| GitHub Copilot | [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) | Coding patterns, naming rules, anti-patterns, comment style |

All three files share the same underlying rules. Agent-specific files are formatted for each agent's instruction parsing style.

### Specialized Domain Expert Agents

12 specialized agent instruction files cover cross-domain expertise areas. Select the appropriate agent when working in a specific domain. See [`docs/agents/README.md`](./docs/agents/README.md) for the full selection guide.

| # | Agent | Domain | Key Files |
|---|-------|--------|----------|
| 1 | [`FRONTEND-MOBILE-AGENT`](./docs/agents/FRONTEND-MOBILE-AGENT.md) | Expo/React Native, screens, navigation, animations | `app/`, `components/`, `constants/` |
| 2 | [`BACKEND-API-AGENT`](./docs/agents/BACKEND-API-AGENT.md) | Express routes, middleware, server patterns | `server/index.ts`, `server/routes.ts` |
| 3 | [`AI-INTEGRATION-AGENT`](./docs/agents/AI-INTEGRATION-AGENT.md) | Multi-provider AI routing, prompt engineering | `server/ai/` |
| 4 | [`SECURITY-SAFETY-AGENT`](./docs/agents/SECURITY-SAFETY-AGENT.md) | Child safety rules, sanitization, rate limiting | `CHILD_SAFETY_RULES`, security middleware |
| 5 | [`DATABASE-AGENT`](./docs/agents/DATABASE-AGENT.md) | Drizzle ORM, PostgreSQL, schema management | `shared/schema.ts`, `server/db.ts` |
| 6 | [`AUDIO-TTS-AGENT`](./docs/agents/AUDIO-TTS-AGENT.md) | ElevenLabs TTS, voice chat, background music | `server/elevenlabs.ts`, `server/suno.ts` |
| 7 | [`STORY-GENERATION-AGENT`](./docs/agents/STORY-GENERATION-AGENT.md) | Story content, AI prompts, story modes | Story endpoints, `app/story.tsx` |
| 8 | [`DESIGN-SYSTEM-AGENT`](./docs/agents/DESIGN-SYSTEM-AGENT.md) | Cosmic theme, StyleSheet patterns, animations | `constants/colors.ts`, `constants/timing.ts` |
| 9 | [`TESTING-QA-AGENT`](./docs/agents/TESTING-QA-AGENT.md) | Vitest tests, mocking strategy, coverage | `*.test.ts`, `vitest.config.ts` |
| 10 | [`DEVOPS-DEPLOYMENT-AGENT`](./docs/agents/DEVOPS-DEPLOYMENT-AGENT.md) | EAS builds, Replit deployment, CI/CD | `eas.json`, `scripts/`, `.github/workflows/` |
| 11 | [`PERFORMANCE-AGENT`](./docs/agents/PERFORMANCE-AGENT.md) | React Query, caching, bundle optimization | `lib/query-client.ts`, Metro/esbuild |
| 12 | [`CONTENT-UX-AGENT`](./docs/agents/CONTENT-UX-AGENT.md) | Children's UX, badge system, gamification | `app/completion.tsx`, `app/trophies.tsx` |

---

## Shared Rules — All Agents

These rules apply regardless of which agent is in use:

### Security (Non-Negotiable)
1. Never commit API keys, secrets, tokens, or credentials. Use environment variables.
2. All user string inputs must pass through `sanitizeString()` before AI prompt inclusion.
3. `CHILD_SAFETY_RULES` must be in every story generation system prompt — never remove it.
4. Error responses must use `sanitizeErrorMessage()` — no stack traces to clients.
5. Rate limiting middleware applies to all new POST endpoints.
6. TTS file serving validates filenames against `/^[a-f0-9]+\.mp3$/`.

### Code Quality
- TypeScript strict mode — no `any` without justification comment
- `StyleSheet.create()` for all styles — no bare inline objects
- Colors from `constants/colors.ts` — no hardcoded hex values
- Zod for all input validation

### Architecture
- AI calls: route through `server/ai/index.ts` only
- Settings: use `SettingsContext` (`lib/SettingsContext.tsx`) only
- Storage: use `lib/storage.ts` helpers — not AsyncStorage directly
- Database: Drizzle ORM client from `server/db.ts` only

### Documentation
- New endpoints → `docs/API.md`
- Architecture changes → `docs/ARCHITECTURE.md`
- Significant decisions → `docs/adr/` (new ADR)
- Env variable changes → `.env.example` + `README.md`

---

## Agent-Specific Capabilities

### General-Purpose Agents

| Capability | Claude | Gemini CLI | Copilot |
|-----------|--------|-----------|---------|
| Large refactors | ✅ Primary | ✅ | ⚠️ Inline only |
| New features | ✅ | ✅ | ✅ |
| Code completions | ✅ | ✅ | ✅ Primary |
| Documentation generation | ✅ Primary | ✅ | ⚠️ Limited |
| Database migrations | ✅ | ✅ | ⚠️ Review required |
| Security-sensitive changes | ✅ (human review required) | ✅ (human review required) | ⚠️ Flag for review |

### Specialized Domain Agents

Load the relevant domain agent file into context before beginning domain-specific work. Multiple agents may be combined.

| Task Category | Recommended Agent(s) |
|--------------|---------------------|
| New screen or component | FRONTEND-MOBILE + DESIGN-SYSTEM |
| New API endpoint | BACKEND-API + SECURITY-SAFETY |
| AI prompt changes | AI-INTEGRATION + SECURITY-SAFETY |
| Story mode changes | STORY-GENERATION + SECURITY-SAFETY |
| TTS or audio features | AUDIO-TTS + BACKEND-API |
| Database schema changes | DATABASE + SECURITY-SAFETY |
| Test additions | TESTING-QA |
| Build / deploy changes | DEVOPS-DEPLOYMENT |
| Performance work | PERFORMANCE |
| Badge / gamification | CONTENT-UX + FRONTEND-MOBILE |

---

## Workflow Coordination

### How Agent Outputs Are Reviewed
1. AI-generated code is treated as a PR from a junior contributor — always reviewed before merge
2. Security-sensitive files (`.env.example`, `server/routes.ts`, `server/index.ts`, `shared/schema.ts`) require explicit human review
3. Run `npm run typecheck && npm run lint` on all AI-generated changes before accepting

### What Agents Should Handle Autonomously
- Adding new screens following existing patterns
- Updating documentation
- Adding new API endpoints following the existing `server/routes.ts` pattern
- Adding new AI provider following the `server/ai/providers/` pattern
- Fixing TypeScript type errors
- Updating dependencies in `package.json` (after advisory check)

### What Agents Must Flag for Human Review
- Any change to `CHILD_SAFETY_RULES` in AI prompts
- Database schema changes (`shared/schema.ts`, `shared/models/chat.ts`)
- Authentication/authorization logic (none exists yet, but additions are high-risk)
- Rate limiting parameters or bypass logic
- Changes to CORS configuration
- Any new environment variable that starts with `EXPO_PUBLIC_` (client-visible)
- Changes to `patches/` directory

---

## Escalation Rules

Agents should stop and request human input when:
- The correct approach requires a business or product decision (e.g., "should we add authentication?")
- A change would affect the database schema and production data
- A security vulnerability is discovered in existing code (open an issue; don't silently patch)
- External API behavior has changed and the correct adaptation is unclear
- The task requires access to credentials or secrets not present in the environment

---

## Context Budget Guidance

### Small tasks (code completion, bug fix, single endpoint)
Include in context:
- The specific file(s) being changed
- `constants/types.ts` for type definitions
- `server/routes.ts` for server-side tasks

### Large tasks (new feature, refactor, architecture change)
Include in context:
- `CLAUDE.md` or `GEMINI.md` (full project context)
- `docs/ARCHITECTURE.md`
- Relevant source files
- `docs/API.md` if adding endpoints

### Documentation tasks
Include:
- This file (`AGENTS.md`)
- `CLAUDE.md` for conventions
- The specific doc file being updated

---

## Links to Agent Config Files

### General-Purpose
- [CLAUDE.md](./CLAUDE.md) — Claude Code / Claude agent context
- [GEMINI.md](./GEMINI.md) — Gemini CLI / Gemini agent context
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) — GitHub Copilot instructions
- [MEMORY.md](./MEMORY.md) — Persistent cross-session project context
- [CONVENTIONS.md](./CONVENTIONS.md) — Detailed code standards
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System architecture reference

### Specialized Domain Experts
- [docs/agents/README.md](./docs/agents/README.md) — Agent index and selection guide
- [docs/agents/FRONTEND-MOBILE-AGENT.md](./docs/agents/FRONTEND-MOBILE-AGENT.md) — Expo/React Native expert
- [docs/agents/BACKEND-API-AGENT.md](./docs/agents/BACKEND-API-AGENT.md) — Express server expert
- [docs/agents/AI-INTEGRATION-AGENT.md](./docs/agents/AI-INTEGRATION-AGENT.md) — AI provider routing expert
- [docs/agents/SECURITY-SAFETY-AGENT.md](./docs/agents/SECURITY-SAFETY-AGENT.md) — Security & child safety expert
- [docs/agents/DATABASE-AGENT.md](./docs/agents/DATABASE-AGENT.md) — Database & schema expert
- [docs/agents/AUDIO-TTS-AGENT.md](./docs/agents/AUDIO-TTS-AGENT.md) — Audio & TTS expert
- [docs/agents/STORY-GENERATION-AGENT.md](./docs/agents/STORY-GENERATION-AGENT.md) — Story generation expert
- [docs/agents/DESIGN-SYSTEM-AGENT.md](./docs/agents/DESIGN-SYSTEM-AGENT.md) — Design system expert
- [docs/agents/TESTING-QA-AGENT.md](./docs/agents/TESTING-QA-AGENT.md) — Testing & QA expert
- [docs/agents/DEVOPS-DEPLOYMENT-AGENT.md](./docs/agents/DEVOPS-DEPLOYMENT-AGENT.md) — DevOps & deployment expert
- [docs/agents/PERFORMANCE-AGENT.md](./docs/agents/PERFORMANCE-AGENT.md) — Performance & optimization expert
- [docs/agents/CONTENT-UX-AGENT.md](./docs/agents/CONTENT-UX-AGENT.md) — Children's UX & content expert
