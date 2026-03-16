<!-- Last verified: 2026-03-16 -->
<!-- Update this file when significant architectural changes occur or new major work begins -->

# MEMORY.md — Persistent AI Agent Context

Read this file at session start to rapidly build project context. Keep it dense and factual.

**Last Updated:** 2026-03-16

---

## Project Identity

- **Name:** Infinity Heroes: Bedtime Chronicles
- **Type:** Children's bedtime story app (ages 3–9)
- **Platform:** Expo SDK 54 (React Native) + Express.js v5 backend
- **Language:** TypeScript (strict throughout)
- **Status:** Active development; no formal release yet

---

## Current State (as of 2026-03-16)

### What Works
- Story generation via multi-provider AI fallback chain (Gemini → OpenAI → Anthropic → OpenRouter)
- Three story modes: Classic (adventure), Mad Libs (fill-in-the-blank), Sleep (calming)
- Scene illustration generation (Gemini primary, OpenAI fallback)
- ElevenLabs TTS narration with 8 voices
- Background music (mode-specific MP3 assets)
- Hero creation with AI-generated avatar
- Child profiles with badges (12), streaks, and story history
- Parent controls with PIN protection
- Story library with favorites and read tracking (storage exists; UI partially implemented)
- Smart story setting suggestions (AI-powered, time-of-day aware)
- Voice chat backend (PostgreSQL + Express routes wired up)
- Onboarding flow (welcome → quick-create → home)
- Unified settings system (SettingsContext + SettingsModal both using single AsyncStorage key)
- Security headers, CORS restrictions, rate limiting, input sanitization

### In Progress / Partially Done
- Voice chat mobile UI (backend is ready; Expo screen not built yet)
- HeroCard component exists but not yet rendered in any screen
- Read/unread story indicators (storage helpers exist; UI not wired up)
- Story feedback/rating UI (storage function `updateFeedback` exists; no UI)

### Blocked / Not Started
- Automated test suite (Jest/Vitest) — top roadmap priority
- Expo SDK 55 upgrade (blocked by `patches/expo-asset+12.0.12.patch` removal decision)
- Redis-backed persistent rate limiting (low priority; in-memory is sufficient)
- Authentication layer (not planned unless cost abuse becomes an issue)

---

## Architecture Summary

```
Expo App (React Native)
  └── Expo Router v6 (file-based routing)
  └── React Context (Settings, Profile state)
  └── AsyncStorage (stories, profiles, badges, settings)
  └── TanStack React Query (server state)
        │  HTTP
Express Server (port 5000)
  └── Security middleware → Rate limiter → Routes
  └── AI Router (server/ai/index.ts)
        └── Gemini (primary) → OpenAI → Anthropic → OpenRouter
  └── ElevenLabs TTS (server/elevenlabs.ts)
  └── OpenAI Sora video generation (server/video.ts)
  └── Voice chat (server/replit_integrations/audio + chat)
        └── PostgreSQL (Drizzle ORM) — conversations + messages
```

---

## Key Decisions Made

### ADR-001: Expo + React Native
Chosen for cross-platform mobile (iOS + Android + Web) from a single TypeScript codebase, with Replit dev environment support. File-based routing via Expo Router v6.

### ADR-002: Multi-Provider AI Fallback Chain
Single `server/ai/index.ts` router with priority chain. If Gemini fails → OpenAI → Anthropic → OpenRouter (xAI/Mistral/Cohere/Meta). No single provider dependency. All keys server-side.

### ADR-003: ElevenLabs for TTS
Best voice quality for children's content. 8 voices curated by story mode. `eleven_multilingual_v2` model. Cached to disk (TTS_CACHE_MAX_AGE_MS).

### ADR-004: AsyncStorage as Client-Side Data Store
No PII, no sensitive data — story text, audio refs, badges, settings. Acceptable for this use case. Avoids needing a user auth system.

### ADR-005: Single SettingsContext
Previously two parallel settings systems (SettingsModal with local state + direct AsyncStorage, and SettingsContext). Merged into SettingsContext. Legacy key auto-migrates on first load.

---

## Known Tech Debt

| Debt | Location | Severity | Linked Item |
|------|---------|---------|-------------|
| No test suite | Entire codebase | High | Roadmap #1 |
| `patches/expo-asset+12.0.12.patch` | `patches/` | Medium | Roadmap #2 (Expo 55) |
| `HeroCard.tsx` unused | `components/HeroCard.tsx` | Low | Roadmap #5 |
| Read/unread UI missing | `lib/storage.ts` helpers orphaned | Low | Roadmap #7 |
| Story feedback UI missing | `lib/storage.ts` `updateFeedback` orphaned | Low | Roadmap #8 |
| Voice chat mobile UI missing | `server/replit_integrations/` ready | Medium | Roadmap #4 |
| In-memory rate limiter resets on restart | `server/routes.ts` | Low | Roadmap #9 |

---

## Patterns Tried and Rejected

- **Dual settings system** — `SettingsModal` previously had its own `getPreferences`/`savePreferences` functions using a separate AsyncStorage key. Rejected: data divergence bugs. Replaced with single SettingsContext.
- **Direct AI provider calls from routes** — Early pattern called OpenAI/Gemini SDKs directly from `server/routes.ts`. Rejected: no fallback, fragile. Replaced with `server/ai/index.ts` abstraction.

---

## Recent Significant Changes

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-16 | Added CONTRIBUTING.md, CLAUDE.md, GEMINI.md, AGENTS.md, MEMORY.md, TODO.md, CONVENTIONS.md, GLOSSARY.md, ADRs, CODEOWNERS, runbooks | Documentation complete |
| 2026-03-13 | Merged dual settings systems into SettingsContext | Eliminated storage divergence bug |
| 2026-03-13 | Added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) | Security improvement |
| 2026-03-13 | Wired up voice chat routes (replit_integrations/audio) | Backend voice chat functional |
| 2026-03-13 | Created comprehensive documentation suite (initial) | README, ARCHITECTURE, API, SECURITY, CHANGELOG, ROADMAP |
| 2026-03-13 | Fixed storyId mismatch in completion screen | Bug fix |
| 2026-03-12 | Added onboarding flow (welcome → quick-create) | New feature |
| 2026-03-12 | Added app settings screen + SettingsContext | New feature |
| 2026-03-12 | Redesigned story reading experience | UX improvement |
| 2026-03-11 | Added story library (saved stories + management) | New feature |
| 2026-03-11 | Added tabbed navigation (5 tabs) | Architecture change |

---

## Environment Snapshot

Required env vars for full functionality:
- `AI_INTEGRATIONS_GEMINI_API_KEY` — primary AI (required for story gen)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — fallback AI + image gen
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — fallback AI
- `AI_INTEGRATIONS_OPENROUTER_API_KEY` — final fallback AI
- `ELEVENLABS_API_KEY` — TTS narration
- `DATABASE_URL` — PostgreSQL (voice chat only)
- `OPENAI_API_KEY` — direct key for Sora video (optional)

Auto-injected by Replit (do not set manually): `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPL_IDENTITY`

---

## Contributor Context

This project was bootstrapped on Replit. The primary development environment is Replit. External contributors can develop locally using `npx expo start` (no Replit-specific env vars needed) but will need their own API keys.

The `replit.md` file is a Replit workspace configuration (system context for the Replit agent) — it is not a user-facing document and should not be treated as canonical documentation.
