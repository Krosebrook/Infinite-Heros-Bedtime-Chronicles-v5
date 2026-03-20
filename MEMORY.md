<!-- Last verified: 2026-03-20 -->
<!-- Update this file when significant architectural changes occur or new major work begins -->

# MEMORY.md — Persistent AI Agent Context

Read this file at session start to rapidly build project context. Keep it dense and factual.

**Last Updated:** 2026-03-20

---

## Project Identity

- **Name:** Infinity Heroes: Bedtime Chronicles
- **Type:** Children's bedtime story app (ages 3–9)
- **Platform:** Expo SDK 54 (React Native) + Express.js v5 backend
- **Language:** TypeScript (strict throughout)
- **Status:** Active development; Android Play Store deployment in progress

---

## Current State (as of 2026-03-20)

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

### Mobile Deployment (added 2026-03-20)
- **eas.json** configured — 3 profiles: development (APK+DevClient), preview (APK), production (AAB)
- **scripts/build-android.sh** — EAS build helper with all 4 operations (dev/preview/production/submit)
- **docs/operations/PLAY_STORE_DEPLOYMENT.md** — full EAS runbook with store listing copy
- **.gitignore** updated — google-services-key.json and *.keystore protected
- Android package: `com.infinityheroes.bedtime` (set in app.json)
- iOS bundle: `com.infinityheroes.bedtime` (set in app.json, no App Store path active)
- **CI pipeline**: .github/workflows/ci.yml exists in source but Zapier connector cannot push to .github/ paths — needs manual commit (see README)

### In Progress / Partially Done
- Voice chat mobile UI (backend is ready; Expo screen not built yet)
- HeroCard component exists but not yet rendered in any screen
- Read/unread story indicators (storage helpers exist; UI not wired up)
- Story feedback/rating UI (storage function `updateFeedback` exists; no UI)

### Blocked / Not Started
- EAS init (requires `eas login` + `eas init` run locally to add projectId to app.json)
- EAS secrets (API keys must be set via `eas secret:create` before production builds work)
- CI pipeline commit (Zapier blocks .github/ path — manual `git push` required for ci.yml)
- Automated test suite (Jest/Vitest) — top roadmap priority
- Expo SDK 55 upgrade (blocked on patch compatibility)

---

## Repository Structure

```
app/              Expo Router screens (file = route)
app/(tabs)/       Tab screens: index, create, library, saved, profile
components/       Reusable React Native components
constants/        types.ts, heroes.ts, colors.ts, timing.ts
lib/              Client utilities: storage.ts, ProfileContext, SettingsContext, query-client
server/           Express backend
server/ai/        Multi-provider AI router (router.ts, index.ts, providers/)
server/ai/providers/  gemini.ts, openai.ts, anthropic.ts, openrouter.ts
server/replit_integrations/audio/  Voice chat routes (wired, UI pending)
shared/           Drizzle schema + Zod types (used by client AND server)
scripts/          Build helpers: build-android.sh (new), build.js
docs/             Architecture, API, security, roadmap, CHANGELOG
docs/operations/  PLAY_STORE_DEPLOYMENT.md (new)
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile framework | Expo + React Native | SDK 54 / RN 0.81.5 |
| Router | Expo Router | v6 |
| Backend | Express.js | v5 |
| AI (primary) | Google Gemini | gemini-2.5-flash |
| AI (fallbacks) | OpenAI, Anthropic, OpenRouter | gpt-4o-mini / claude-sonnet-4-6 |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.39 |
| Client storage | AsyncStorage | 2.2.0 |
| Animation | react-native-reanimated | v4 |
| Build (Android) | EAS Build | eas-cli latest |

---

## Android Package: com.infinityheroes.bedtime

Set in `app.json` → `expo.android.package`. This is the permanent Play Store identifier.
Cannot be changed after first Play Store submission.

## EAS Deployment Order

1. `npm install -g eas-cli`
2. `eas login`
3. `eas init` (adds projectId to app.json — commit this)
4. `eas credentials --platform android` (set up managed keystore)
5. Set all API keys as EAS secrets: `eas secret:create --scope project --name KEY --value val`
6. `bash scripts/build-android.sh preview` (test APK)
7. `bash scripts/build-android.sh production` (Play Store AAB)
8. Upload .aab to Play Console or `bash scripts/build-android.sh submit`

---

## Environment Variables Required

See `.env.example` for full list. For EAS builds, ALL vars must be set as EAS secrets.
Key vars:
- `AI_INTEGRATIONS_GEMINI_API_KEY` + `AI_INTEGRATIONS_GEMINI_BASE_URL` (required)
- `ELEVENLABS_API_KEY` (required for narration)
- `EXPO_PUBLIC_API_URL` (required — points to Express server)
- `DATABASE_URL` (required for voice chat only)
- OpenAI, Anthropic, OpenRouter keys (optional, for AI fallback chain)

---

## Key Conventions

- All screens in `app/` use Expo Router file-based routing
- Server data access goes through `server/storage.ts` IStorage interface
- AI generation goes through `server/ai/router.ts` (not direct provider calls)
- Client-side data via AsyncStorage (`lib/storage.ts`) — no auth, session-based
- `EXPO_PUBLIC_*` vars are bundled into client APK — never put secrets there
