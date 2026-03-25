# Changelog

All notable changes to Infinity Heroes: Bedtime Chronicles are documented here.

## [Unreleased] — 2026-03-25

### Fixed
- **Input validation hardened** — All `parseInt` calls on route `:id` params now use `parseIdParam()` which rejects NaN, zero, negative, and non-integer values with 400 responses.
- **Unsafe JSON parsing** — `JSON.parse` on AI-extracted JSON in `/api/generate-story` and `/api/suggest-settings` now wrapped in try-catch, returning clean 500 instead of crashing.
- **Typed error handling** — All `catch (error: any)` replaced with `error instanceof Error` checks across `server/routes.ts`.

### Added
- **Conversation pagination** — `GET /api/conversations` now supports `limit` (1-200, default 50) and `offset` query params. Response shape changed to `{ data, total, limit, offset }`.
- **Message content validation** — Chat messages validated for type, emptiness, and max length (10,000 chars).
- **Audio payload validation** — Voice messages validated for type, base64 size estimation (max 25MB), and voice param allowlisted against `alloy|echo|fable|onyx|nova|shimmer`.
- **Conversation title sanitization** — Titles trimmed and capped at 200 characters.
- **Security headers** — Added `Permissions-Policy` (camera=(), microphone=(self), geolocation=()) and `X-Permitted-Cross-Domain-Policies: none`.

### Changed
- `GET /api/conversations` response format changed from array to `{ data: [], total, limit, offset }` for pagination support.

---

## [Unreleased] — 2026-03-13

### Fixed
- **Dual settings system merged** — `SettingsModal.tsx` now uses `SettingsContext` instead of separate `getPreferences`/`savePreferences`. Both UIs share a single AsyncStorage key. Legacy preferences auto-migrate on first load.
- **Dead code triage resolved** — All 3 open NEEDS_DECISION items closed (HeroCard: keep, replit_integrations: wired up, settings: merged).

### Added
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection` on all responses.
- **Voice chat routes** — `server/replit_integrations/audio/` routes registered in Express (gated behind `AI_INTEGRATIONS_OPENAI_API_KEY` + `DATABASE_URL`). Adds `/api/conversations/*` endpoints for voice messaging with conversation history.
- **Database client** — `server/db.ts` created for Drizzle ORM + PostgreSQL connection.
- **Chat schema exports** — `shared/schema.ts` now exports `conversations` and `messages` tables.
- **Comprehensive documentation** — README.md, ARCHITECTURE.md, API.md, SECURITY.md, ROADMAP.md, CHANGELOG.md.
- **Updated .env.example** — All environment variables documented with descriptions.

### Changed
- `AppSettings` type expanded with `sleepTheme`, `isMuted`, `reducedMotion`, `fontSize` fields.
- `storyLength` type widened to include `medium-short` and `epic`.
- `drizzle.config.ts` schema array now includes `shared/models/chat.ts`.

## 2026-03-13 (996e238)

### Changed
- Updated AI model strings across all providers to latest versions.
- Fixed dead code in backend systems.

## 2026-03-13 (7cd5717)

### Added
- Detailed audit and proposal for AI model configurations (Phase 1 audit).

## 2026-03-13 (fa34c87)

### Added
- Automatic retries and caching for story scene images.

## 2026-03-13 (0c8fdb5)

### Fixed
- Restored scene image persistence (`saveStoryScene` was orphaned).
- Fixed storyId mismatch bug in completion screen.
- Fixed profile avatar display.

## 2026-03-13 (1918b1f)

### Added
- Dead code triage report (`docs/DEAD-CODE-TRIAGE.md`).

## 2026-03-12 (41d8c06)

### Added
- Detailed customization options for personalized story adventures (settings, tone, sidekick, problem).

## 2026-03-12 (1769fba)

### Added
- Onboarding flow (quick-create hero experience).
- App settings screen with SettingsContext.

## 2026-03-12 (f861169)

### Changed
- Redesigned story reading experience with improved UI and interactive elements.

## 2026-03-11 (551d0cb)

### Added
- Story library: view and manage saved stories.
- Story browsing and management functionality.

## 2026-03-11 (7914d09)

### Added
- Tabbed navigation structure (home, create, library, profile).
- Story details screen.
- Initial app architecture.
