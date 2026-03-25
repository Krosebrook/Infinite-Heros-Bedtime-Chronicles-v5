# GitHub Copilot Custom Instructions
# Infinity Heroes: Bedtime Chronicles

## Project Patterns

- TypeScript strict mode throughout — `any` requires an inline justification comment
- Expo Router for navigation — screens are files under `app/`, tabs under `app/(tabs)/`
- Express v5 for the API server — all routes registered in `server/routes.ts`
- Zod for all input validation — define schemas inline or in `shared/schema.ts`
- TanStack React Query v5 for server state on the client
- React Context (`lib/SettingsContext.tsx`, `lib/ProfileContext.tsx`) for app-level state

## Preferred Libraries

- **Storage:** `lib/storage.ts` helpers (wraps AsyncStorage) — never call AsyncStorage directly
- **Colors:** `constants/colors.ts` — never hardcode hex values
- **Animations:** `react-native-reanimated` — not `Animated` from React Native core
- **AI routing:** `server/ai/index.ts` — never call AI provider SDKs directly from routes
- **Validation:** Zod schemas — not manual type checks or `if typeof`

## Testing Patterns

- No automated test suite exists yet — verify manually before committing
- When tests are added: `<module>.test.ts` alongside source, Jest or Vitest
- Mock all external API calls (AI providers, ElevenLabs)
- Test happy path + empty/null input + API failure path

## Security Patterns — Always Follow

- All user string inputs → `sanitizeString()` before AI prompt inclusion
- `CHILD_SAFETY_RULES` constant → included in every story generation system prompt
- No API keys in client code — server-side env vars only
- TTS filenames → validated against `/^[a-f0-9]+\.mp3$/` before serving
- Rate limiter middleware → applied to all new POST endpoints
- Error responses → `sanitizeErrorMessage()` — no stack traces to clients
- CORS restricted to Replit domains + localhost — no wildcards

## Anti-Patterns — Avoid

- **Do not** create a second settings system — use `SettingsContext` from `lib/SettingsContext.tsx`
- **Do not** call `AsyncStorage` directly from screens — use `lib/storage.ts` helpers
- **Do not** call AI provider SDKs from route handlers — use `server/ai/index.ts`
- **Do not** hardcode colors, spacing, or font sizes — use `constants/colors.ts` and `StyleSheet`
- **Do not** use inline style objects except for values that must be computed at render time
- **Do not** remove or bypass the `CHILD_SAFETY_RULES` prompt in story generation
- **Do not** add `process.env.EXPO_PUBLIC_*` vars that expose AI keys or secrets

## File Organization Rules

- New screens → `app/<name>.tsx` (Expo Router auto-registers)
- New tab screens → `app/(tabs)/<name>.tsx`
- New reusable components → `components/PascalCase.tsx`
- New client utilities → `lib/camelCase.ts`
- New server utilities → `server/camelCase.ts`
- New AI providers → `server/ai/providers/<name>.ts`
- Shared types/schemas → `shared/schema.ts` or `constants/types.ts`
- Documentation → `docs/<TOPIC>.md`

## Naming Conventions

- Components: `PascalCase` (file and export)
- Hooks: `useXxx` prefix, camelCase
- Utilities/services: camelCase file names
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config maps
- AsyncStorage keys: `@infinity_heroes_<descriptor>`
- Screen files: `kebab-case.tsx`
- API routes: `/api/kebab-case`

## Comment Style

- JSDoc for all exported functions and components: `/** Description */`
- Inline comments for non-obvious logic only — do not narrate the code
- TODO format: `// TODO(#<issue>): <description>` — always link to an issue
- Security-sensitive code: `// SECURITY: <reason>` comment

## Architecture Rules

- The AI provider fallback chain order is: Gemini → OpenAI → Anthropic → OpenRouter
- Database access only via Drizzle ORM client from `server/db.ts`
- `shared/` code is imported by both client and server — keep it dependency-free of platform-specific APIs
- `replit.md` is a Replit workspace config file — do not use it for user-facing docs
