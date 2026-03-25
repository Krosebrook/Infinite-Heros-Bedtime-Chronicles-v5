<!-- Last verified: 2026-03-21 -->
# GEMINI.md — Gemini CLI Agent Context

Custom instructions for Gemini CLI and Gemini-based coding agents working on this repository.

---

## Project Context

**Project:** Infinity Heroes: Bedtime Chronicles
**Type:** Children's bedtime story mobile app (ages 3–9)
**Architecture:** Expo SDK 54 (React Native) frontend + Express.js v5 backend, TypeScript throughout
**Repo structure:** Single full-stack app — `app/` (screens), `components/`, `lib/`, `server/`, `shared/`, `constants/`, `docs/`

The app lets children pick a superhero character and generate personalized bedtime stories using a multi-provider AI fallback chain (Gemini → OpenAI → Anthropic → OpenRouter). Stories include AI-generated scene illustrations, ElevenLabs TTS narration, and background music.

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Mobile | Expo SDK 54, React Native 0.81.5 |
| Routing | Expo Router v6 (file-based) |
| Server | Express.js v5, Node.js, TypeScript |
| Primary AI | Google Gemini (`gemini-2.5-flash`, `gemini-2.5-flash-image`) |
| AI fallback 1 | OpenAI (`gpt-4o-mini`, `gpt-image-1`) |
| AI fallback 2 | Anthropic Claude (`claude-sonnet-4-6`) |
| AI fallback 3 | OpenRouter (xAI Grok, Mistral, Cohere, Meta Llama) |
| TTS | ElevenLabs `eleven_multilingual_v2` |
| Database | PostgreSQL + Drizzle ORM (voice chat only) |
| Client state | React Context + TanStack React Query v5 |
| Client storage | AsyncStorage |
| Validation | Zod v3 |
| Animations | react-native-reanimated v4 |

---

## Code Conventions

### Naming Rules
- Screen files: `kebab-case.tsx` under `app/`
- Component files: `PascalCase.tsx` under `components/`
- Utility files: `camelCase.ts` under `lib/` or `server/`
- Constants: `SCREAMING_SNAKE_CASE` (true constants), `camelCase` (config objects)
- AsyncStorage keys: `@infinity_heroes_<descriptor>` pattern (e.g., `@infinity_heroes_app_settings`)
- Hooks: `useXxx` prefix

### Import Order
1. React / React Native core imports
2. Expo SDK imports
3. Third-party library imports
4. Internal imports (`constants/`, `lib/`, `components/`, `shared/`)
5. Relative imports

### TypeScript
- `strict: true` — never use `any` without an inline comment explaining why
- Define component props as interfaces directly above the component
- API schemas: define with Zod in `shared/schema.ts` or inline

### Styling
- `StyleSheet.create()` always — no bare inline style objects
- Colors from `constants/colors.ts` — never hardcode hex values
- Safe area insets via `react-native-safe-area-context` on all screens

---

## Security Constraints

These rules are non-negotiable:

1. **No API keys on the client.** All AI provider keys are server-side env vars only.
2. **All user string inputs must pass through `sanitizeString()`** before inclusion in AI prompts. This is defined in `server/routes.ts`.
3. **Child safety prompt always included.** The `CHILD_SAFETY_RULES` constant must be part of every story generation system prompt.
4. **TTS file serving**: only filenames matching `/^[a-f0-9]+\.mp3$/` are served. Do not loosen this check.
5. **Rate limiting**: the per-IP sliding window rate limiter applies to all POST endpoints. New POST routes must be inside the rate-limiter middleware.
6. **Error responses**: use `sanitizeErrorMessage()` — never return raw error objects or stack traces to clients.

---

## Architecture Constraints

- **AI calls through `server/ai/index.ts` only.** Never call provider SDKs directly from route handlers.
- **Settings only via `SettingsContext`.** Do not create parallel settings storage mechanisms.
- **AsyncStorage via `lib/storage.ts` helpers.** Do not call AsyncStorage directly from screens or components.
- **No direct database queries from routes.** Use the Drizzle ORM client from `server/db.ts`.

---

## Build, Test, and Deploy Commands

```bash
# Development
npm install                 # Install deps (patch-package runs automatically)
npm run server:dev          # Express server on port 5000
npm run expo:dev            # Expo dev client (Replit environment)
npx expo start              # Expo dev client (non-Replit)

# Type and lint checks
npm run typecheck           # TypeScript, no emit
npm run lint                # ESLint
npm run lint:fix            # ESLint auto-fix

# Production build
npm run server:build        # esbuild → server_dist/index.js
npm run server:prod         # Run production bundle
npm run expo:static:build   # Static Expo web bundle

# Database
npm run db:push             # Apply Drizzle schema to DATABASE_URL
```

---

## Known Constraints and Gotchas

- `npm run dev` does not exist. Use `npm run server:dev` and `npm run expo:dev` separately.
- Expo dev commands embed `REPLIT_DEV_DOMAIN` — outside Replit, use `npx expo start` instead.
- `patches/expo-asset+12.0.12.patch` is a temporary fix; will be removed on Expo SDK 55 upgrade.
- `server/replit_integrations/` is Replit-provided boilerplate; the voice chat backend is wired up but the mobile UI screen does not exist yet.
- `components/HeroCard.tsx` is intentionally kept but not currently rendered anywhere — it's preserved for future reuse.
- `lib/storage.ts` (client AsyncStorage helpers) and `server/storage.ts` (server in-memory cache) are different files serving different purposes.
- No automated test suite exists yet. Verify changes manually.

---

## Common Workflows

### Add a new API endpoint
1. Add route in `server/routes.ts`
2. Validate input with Zod; sanitize string fields with `sanitizeString()`
3. Place AI calls inside `server/ai/index.ts` router
4. Apply rate limiting middleware
5. Document in `docs/API.md`

### Add a new screen
1. Create `app/<name>.tsx` — Expo Router registers it automatically
2. Tab screens go in `app/(tabs)/`
3. Use `SafeAreaView` and colors from `constants/colors.ts`
4. Add to project structure in `README.md` if significant

### Update environment variables
1. Add to `.env.example` with a blank value and inline comment
2. Update the env table in `README.md`
3. Use `process.env.VAR_NAME` in server code; `process.env.EXPO_PUBLIC_VAR_NAME` for client-safe vars

### Modify database schema
1. Edit `shared/schema.ts` (or `shared/models/chat.ts`)
2. Run `npm run db:push` against a dev database
3. Test migration before committing
