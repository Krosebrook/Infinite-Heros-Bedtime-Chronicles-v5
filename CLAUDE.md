<!-- Last verified: 2026-03-21 -->
# CLAUDE.md — Agent Context for Claude Code

This file provides Claude with the project context needed to work effectively on this repository.

---

## Project Summary

**Infinity Heroes: Bedtime Chronicles** is a children's bedtime story app (ages 3–9) built with Expo SDK 54 (React Native) and an Express.js backend. Children create a custom superhero and generate personalized AI stories with narration, illustrations, and background music.

**Repository type:** Single full-stack app (Expo mobile + Express API server)
**Primary language:** TypeScript (strict)
**Package manager:** npm

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile framework | Expo + React Native | SDK 54 / RN 0.81.5 |
| Router | Expo Router (file-based) | v6 |
| Backend | Express.js | v5 |
| AI (primary) | Google Gemini | gemini-2.5-flash |
| AI (fallbacks) | OpenAI, Anthropic Claude, OpenRouter | gpt-4o-mini / claude-sonnet-4-6 |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.39 |
| Client storage | AsyncStorage | 2.2.0 |
| State management | React Context + TanStack React Query | v5 |
| Animation | react-native-reanimated | v4 |
| Validation | Zod | v3 |
| Build/bundle | esbuild (server), Metro (client) | — |

---

## Code Conventions

### File Organization
- `app/` — Expo Router screens only (file = route)
- `app/(tabs)/` — Tab-navigated screens: `index`, `create`, `library`, `saved`, `profile`
- `components/` — Reusable React Native components
- `constants/` — Static data: `types.ts`, `heroes.ts`, `colors.ts`, `timing.ts`
- `lib/` — Client-side utilities and contexts: `storage.ts`, `SettingsContext.tsx`, `ProfileContext.tsx`, `query-client.ts`
- `server/` — Express backend: `index.ts` (bootstrap), `routes.ts` (route registration)
- `server/ai/` — Multi-provider AI router with fallback chain
- `server/ai/providers/` — One file per AI provider (gemini, openai, anthropic, openrouter)
- `server/replit_integrations/` — Voice chat, audio, image, batch utilities
- `shared/` — Code shared between client and server (Drizzle schema, Zod models)
- `docs/` — All project documentation

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- React components: PascalCase
- Hooks: `use` prefix, camelCase (`useSettings`, `useProfileStore`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects
- AsyncStorage keys: `@infinity_heroes_<descriptor>` pattern

### TypeScript
- Strict mode enabled — never use `any` without a `// intentional: <reason>` comment
- All API request/response shapes defined in `shared/schema.ts` or inline Zod schemas
- Component props typed inline as interfaces above the component

### Styling
- Use `StyleSheet.create()` — no inline style objects except for dynamic values (e.g., `{ width: progress * 100 + '%' }`)
- Color constants from `constants/colors.ts` — never hardcode color hex values
- Theme: midnight/indigo/purple glassmorphism; accent `#6366f1`

### Error Handling
- Server: catch errors, log with context, return `{ error: string }` with appropriate HTTP status. Never leak stack traces to clients.
- Client: use React Error Boundaries for screen-level errors; show user-friendly message, not raw error
- AI calls: the AI router handles provider fallback automatically; callers should still catch final failure

---

## Testing Approach

**No automated test suite exists yet.** This is the top item on the roadmap.

Until tests are added: verify happy path + error states manually before committing. Document manual test steps in the PR description.

When a test framework is added, target:
- File naming: `<module>.test.ts` alongside the source file
- Coverage: ≥80% branch coverage for server utilities
- Mocks: mock all external API calls (Gemini, OpenAI, ElevenLabs)

---

## Architecture Constraints

- **AI calls must go through `server/ai/index.ts`** — never call AI provider SDKs directly from routes.
- **No AI keys on the client** — all AI provider keys are server-side environment variables only.
- **Input sanitization is mandatory** — all user-provided string inputs must pass through `sanitizeString()` before inclusion in AI prompts.
- **Child safety system prompt** — the `CHILD_SAFETY_RULES` constant must be included in every story generation prompt. Never remove or bypass it.
- **Rate limiting** — per-IP sliding window rate limiter protects all POST endpoints. Do not add endpoints that bypass it.
- **AsyncStorage** is the canonical client-side storage mechanism. Use the helpers in `lib/storage.ts` rather than calling AsyncStorage directly.
- **Settings** live exclusively in `SettingsContext` (`lib/SettingsContext.tsx`). Do not create parallel settings systems.

---

## Security Rules

- Never commit secrets, API keys, or credentials. Use environment variables.
- All server responses must use `sanitizeErrorMessage()` — never return raw error objects.
- TTS filename serving: only files matching `/^[a-f0-9]+\.mp3$/` are served — do not relax this regex.
- Video ID validation: only IDs matching `/^[a-f0-9]+$/` are accepted.
- CORS is restricted to Replit domains + localhost — do not add wildcards.
- Input truncation via `sanitizeString()` is mandatory before any prompt inclusion.

---

## Common Tasks

### Add a new API endpoint
1. Add the route handler in `server/routes.ts` (or a new file under `server/`)
2. Follow the existing pattern: validate input with Zod, call logic, return JSON
3. Apply rate limiting if the endpoint calls external APIs
4. Document in `docs/API.md`
5. Update `README.md` endpoint table if it's a primary endpoint

### Add a new AI provider
1. Create `server/ai/providers/<name>.ts` mirroring the existing provider pattern
2. Add it to the fallback chain in `server/ai/index.ts`
3. Add the API key env var to `.env.example`
4. Update `docs/ARCHITECTURE.md` AI routing section

### Add a new screen
1. Create `app/<screen-name>.tsx` (Expo Router auto-registers it)
2. For tab screens, place under `app/(tabs)/`
3. Import styles from `constants/colors.ts`, wrap in `SafeAreaView`
4. Update `README.md` project structure if it's a significant screen

### Add a new AsyncStorage key
1. Add the helper functions in `lib/storage.ts`
2. Use the `@infinity_heroes_<descriptor>` key naming convention
3. Document the key and data shape in `lib/storage.ts` with a JSDoc comment

### Run a database migration
```bash
npm run db:push   # Applies schema changes to DATABASE_URL target
```

---

## Known Gotchas

- **`npm run dev` does not exist** — use `npm run server:dev` (backend) and `npm run expo:dev` (frontend) separately
- **`expo:dev` requires Replit env vars** — the `EXPO_PACKAGER_PROXY_URL` / `REPLIT_DEV_DOMAIN` are injected by the Replit shell; outside Replit, use `npx expo start` directly
- **`patches/expo-asset+12.0.12.patch`** — a patch-package fix for Expo dev server HTTPS. Will be removed when Expo upgrades to SDK 55+.
- **`server/replit_integrations/`** — these modules are wired up but the voice chat UI screen doesn't exist yet; the backend routes are functional
- **`lib/storage.ts` vs `server/storage.ts`** — both files exist; `lib/storage.ts` is client-side AsyncStorage helpers; `server/storage.ts` is server-side in-memory story cache
- **`shared/schema.ts` vs `shared/models/chat.ts`** — `schema.ts` re-exports from `models/chat.ts`; both included in `drizzle.config.ts`
- **`HeroCard.tsx` in `components/`** — this component exists but is not yet used anywhere (orphaned); it's kept intentionally for future reuse
- **`getReadStories` / `markStoryRead`** — these AsyncStorage helpers exist in `lib/storage.ts` but no UI reads/displays the unread state yet

---

## Build & Run Commands

```bash
npm install                 # Install dependencies (runs patch-package postinstall)
npm run server:dev          # Start Express server (development, port 5000)
npm run expo:dev            # Start Expo dev server (Replit environment)
npx expo start              # Start Expo dev server (non-Replit)
npm run server:build        # Bundle server with esbuild → server_dist/
npm run server:prod         # Run production server bundle
npm run expo:static:build   # Build static Expo web bundle
npm run db:push             # Push Drizzle schema to PostgreSQL
npm run lint                # ESLint check
npm run lint:fix            # ESLint auto-fix
npm run typecheck           # TypeScript type check (no emit)
```

---

## Environment Setup

Copy `.env.example` to `.env` and provide at minimum:

```
AI_INTEGRATIONS_GEMINI_API_KEY=<your-gemini-key>
```

Optional (for full feature set):
```
AI_INTEGRATIONS_OPENAI_API_KEY=<openai-key>
AI_INTEGRATIONS_ANTHROPIC_API_KEY=<anthropic-key>
ELEVENLABS_API_KEY=<elevenlabs-key>
DATABASE_URL=postgres://...
```

---

## Files/Directories — Do Not Modify Without Explicit Approval

- `patches/` — patch-package fixes; modifying breaks the postinstall step
- `server/replit_integrations/` — Replit-provided integration boilerplate; upstream updates may overwrite changes
- `shared/schema.ts` — database schema changes require coordinated migration; do not modify alone
- `.replit` — Replit workspace config; changes affect the dev environment for all contributors
