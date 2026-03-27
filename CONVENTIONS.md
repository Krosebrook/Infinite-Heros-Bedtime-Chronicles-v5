<!-- Last verified: 2026-03-27 -->
# CONVENTIONS.md — Code Standards and Patterns

This document is the canonical reference for all code conventions in this repository. AI agents and human contributors must follow these rules. When a linter or type checker enforces a rule, that tooling takes precedence over this document.

See also: [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR/commit workflow.

---

## Table of Contents

- [File Naming](#file-naming)
- [Directory Organization](#directory-organization)
- [TypeScript](#typescript)
- [React Native & Expo](#react-native--expo)
- [Styling](#styling)
- [Imports](#imports)
- [Error Handling](#error-handling)
- [API Design](#api-design)
- [Database](#database)
- [AsyncStorage](#asyncstorage)
- [Testing](#testing)
- [Git Conventions](#git-conventions)
- [Comments](#comments)

---

## File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Expo Router screens | `kebab-case.tsx` | `story-details.tsx` |
| React Native components | `PascalCase.tsx` | `HeroCard.tsx` |
| Hooks | `use-camel-case.ts` or `useCamelCase.ts` | `useSettings.ts` |
| Server utilities | `camelCase.ts` | `elevenlabs.ts` |
| Client utilities | `camelCase.ts` | `storage.ts` |
| Constants files | `camelCase.ts` | `colors.ts`, `heroes.ts` |
| Shared schemas | `camelCase.ts` | `schema.ts` |
| Documentation | `SCREAMING-KEBAB.md` | `ARCHITECTURE.md` |
| ADRs | `NNNN-kebab-title.md` | `0001-use-expo-react-native.md` |

---

## Directory Organization

```
app/               # Expo Router screens only — file path = route path
  (tabs)/          # Tab-navigated screens (5 tabs: index, create, library, saved, profile)
  _layout.tsx      # Root layout: fonts, onboarding redirect, safe area
components/        # Reusable React Native components (not full screens)
constants/         # Static data and configuration
  types.ts         # All TypeScript interfaces (canonical type definitions)
  colors.ts        # Color palette (canonical color values)
  heroes.ts        # Hero definitions
  timing.ts        # Animation/transition duration constants
lib/               # Client-side utilities and state management
  storage.ts       # AsyncStorage read/write helpers (canonical client storage layer)
  SettingsContext.tsx  # App settings state (canonical settings source)
  ProfileContext.tsx   # Child profile state
  query-client.ts  # TanStack React Query client configuration
server/            # Express backend
  index.ts         # Server bootstrap: middleware, port, shutdown handlers
  routes.ts        # All route registrations
  ai/              # Multi-provider AI abstraction layer
    index.ts       # AI router with fallback chain
    providers/     # One file per provider: gemini.ts, openai.ts, anthropic.ts, openrouter.ts
  elevenlabs.ts    # TTS voice definitions and audio generation
  suno.ts          # Background music file serving
  video.ts         # OpenAI Sora video generation
  db.ts            # Drizzle ORM + PostgreSQL client
  replit_integrations/  # Replit-provided boilerplate modules (voice chat, audio, image)
shared/            # Code imported by both client and server
  schema.ts        # Drizzle ORM table definitions (re-exports from models/)
  models/          # Individual table definitions
    chat.ts        # conversations + messages tables
docs/              # All project documentation
  adr/             # Architecture Decision Records
  runbooks/        # Operational procedures
patches/           # patch-package patches (do not modify without approval)
assets/            # Static assets: images, music, sounds
```

**Rules:**
- Max nesting depth: 4 levels deep for source files
- No `index.ts` barrel files in `components/` or `app/` — import directly
- New screens always go in `app/` (Expo Router auto-registers them)
- Shared types used by both client and server go in `constants/types.ts` or `shared/`

---

## TypeScript

- **Strict mode** (`"strict": true` in `tsconfig.json`) — enforced by the compiler
- Never use `any` without an inline comment: `// intentional: <reason>`
- Prefer `interface` over `type` for object shapes (consistent with existing code)
- Define component props as an inline interface directly above the component function:
  ```tsx
  interface HeroCardProps {
    heroId: string;
    onSelect: () => void;
  }
  export function HeroCard({ heroId, onSelect }: HeroCardProps) { ... }
  ```
- Use `unknown` instead of `any` for error catch variables, then narrow:
  ```ts
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
  }
  ```
- Prefer discriminated unions over optional fields when modeling state variants
- Zod schemas go in `shared/schema.ts` or inline if used only in one file

---

## React Native & Expo

- Wrap all screens in `<SafeAreaView>` with `style={{ flex: 1 }}`
- Use `expo-router`'s `<Link>` and `useRouter()` for navigation — not React Navigation directly
- Fonts: Plus Jakarta Sans from `@expo-google-fonts/plus-jakarta-sans`; load via `useFonts` in `app/_layout.tsx`
- Images: use `<Image>` from `expo-image` for performance (not React Native's `Image`)
- Icons: `@expo/vector-icons` (`Ionicons`, `MaterialCommunityIcons`)
- Audio: `expo-av` — use `Audio.Sound` for music/narration, `expo-speech` is not used
- Haptics: `expo-haptics` for interactive feedback (already used in completion screen)
- AsyncStorage: always use helpers in `lib/storage.ts` — never call `AsyncStorage` directly

---

## Styling

- **`StyleSheet.create()`** for all styles. No bare inline style objects:
  ```tsx
  // ✅ correct
  const styles = StyleSheet.create({ container: { flex: 1 } });
  <View style={styles.container} />

  // ✅ also correct (dynamic value must be inline)
  <View style={[styles.container, { opacity: isVisible ? 1 : 0 }]} />

  // ❌ wrong
  <View style={{ flex: 1, backgroundColor: '#05051e' }} />
  ```
- Colors: use `Colors` from `constants/colors.ts` — never hardcode hex values:
  ```tsx
  import Colors from '@/constants/colors';
  backgroundColor: Colors.primary   // ✅
  backgroundColor: '#05051e'         // ❌
  ```
- Theme: midnight/indigo/purple glassmorphism. Key values:
  - Background: `Colors.background` (`#02021a`)
  - Accent: `Colors.accent` (`#6366f1`)
  - Card: `Colors.cardBg` + `Colors.cardBorder`
  - Text: `Colors.textPrimary`, `Colors.textSecondary`, `Colors.textMuted`
- Font sizes: use multiples of 4 (12, 16, 20, 24, 28, 32)
- Border radius: multiples of 4 (8, 12, 16, 20)

---

## Imports

Order (enforced by ESLint when configured):
1. React and React Native core: `import React from 'react'`
2. Expo SDK: `import { useRouter } from 'expo-router'`
3. Third-party libraries: `import { useQuery } from '@tanstack/react-query'`
4. Internal absolute imports (use `@/` alias): `import Colors from '@/constants/colors'`
5. Relative imports: `import { sanitize } from './utils'`

Separate each group with a blank line.

---

## Error Handling

### Server
- Wrap all route handlers in try/catch
- Log errors with context: `console.error('[route /api/endpoint]', err)`
- Return sanitized error to client:
  ```ts
  return res.status(500).json({ error: sanitizeErrorMessage(err) });
  ```
- Never return: raw `Error` objects, stack traces, internal file paths, or SQL query details
- HTTP status codes:
  - `400` — invalid client input (validation failed)
  - `404` — resource not found
  - `429` — rate limit exceeded
  - `500` — unexpected server error
  - `503` — AI provider unavailable (all providers failed)

### Client
- Screen-level errors: wrap in `<ErrorBoundary>` from `components/ErrorBoundary.tsx` (if it exists) or a local try/catch
- Show user-friendly messages — no raw error strings in UI
- Network errors: TanStack React Query handles retries; surface `isError` state in UI
- Log client errors: `console.error('[ComponentName]', err)` — prefix with component name

---

## API Design

- Base path: `/api/`
- All routes: lowercase kebab-case (`/api/generate-story`, `/api/tts-audio/:file`)
- Request body: JSON with camelCase keys
- Response body: JSON with camelCase keys
- Error response shape: `{ error: string }`
- Success response: resource directly (not wrapped in `{ data: ... }`)
- Rate limiting: applied to all POST endpoints via the existing middleware
- Input validation: Zod schema inline in the route handler
- Input sanitization: `sanitizeString()` on all user-provided strings before AI prompt inclusion
- Streaming: Server-Sent Events (SSE) for streaming responses (`/api/generate-story-stream`)

---

## Database

- ORM: Drizzle ORM only — no raw SQL queries
- Client: import from `server/db.ts` — `import { db } from './db'`
- Schema: define tables in `shared/models/<entity>.ts`, export from `shared/schema.ts`
- Migration: `npm run db:push` applies schema changes; no migration files needed (push mode)
- Column names: `snake_case` in database, `camelCase` in TypeScript via Drizzle mapping
- Cascade deletes: required when a parent record deletion should remove child records
- No raw UUIDs in URLs — use opaque hex IDs

---

## AsyncStorage

- All keys follow the pattern: `@infinity_heroes_<descriptor>`

| Key | Data | Helper Location |
|-----|------|----------------|
| `@infinity_heroes_app_settings` | `AppSettings` | `lib/SettingsContext.tsx` |
| `@infinity_heroes_stories` | `CachedStory[]` | `lib/storage.ts` |
| `@infinity_heroes_profiles` | `ChildProfile[]` | `lib/storage.ts` |
| `@infinity_heroes_badges` | `EarnedBadge[]` | `lib/storage.ts` |
| `@infinity_heroes_streaks` | `Record<string, StreakData>` | `lib/storage.ts` |
| `@infinity_heroes_parent_controls` | `ParentControls` | `lib/storage.ts` |
| `@infinity_heroes_favorites` | `string[]` (story IDs) | `lib/storage.ts` |
| `@infinity_heroes_onboarding_complete` | `"true"` | `app/_layout.tsx` |
| `@infinity_heroes_preferences` | Legacy — migrated on first load | `lib/SettingsContext.tsx` |

- Always use typed helper functions from `lib/storage.ts` — never call `AsyncStorage.getItem`/`setItem` directly from screens
- Serialize/deserialize with `JSON.parse`/`JSON.stringify` — always wrap in try/catch

---

## Testing

**Framework:** Vitest v4 with @vitest/coverage-v8 — **585 tests, 14 files, all passing**

See [docs/best-practices/TESTING.md](./docs/best-practices/TESTING.md) for the full guide.

- File naming: `<module>.test.ts` or `<module>.comprehensive.test.ts` alongside the source file
- Test structure:
  ```ts
  describe('moduleName', () => {
    describe('functionName', () => {
      it('should <expected behavior>', () => { ... });
    });
  });
  ```
- Mocks: mock all external APIs (AI providers, ElevenLabs, AsyncStorage, Firebase)
- Coverage target: ≥80% branch coverage for server utilities
- Do not test implementation details — test behavior and outputs
- Run with: `npm test` (single run), `npm run test:watch` (watch mode), `npm run test:coverage` (with report)

---

## Git Conventions

- Branch naming: `<type>/<kebab-description>` — see [CONTRIBUTING.md](./CONTRIBUTING.md#branch-naming)
- Commit format: Conventional Commits — see [CONTRIBUTING.md](./CONTRIBUTING.md#commit-message-format)
- Merge strategy: squash merge to keep `main` history clean
- Tags: `v<MAJOR>.<MINOR>.<PATCH>` — e.g., `v1.0.0`
- Never commit directly to `main`

---

## Comments

- **JSDoc** for all exported functions and components:
  ```ts
  /**
   * Generates a bedtime story using the AI fallback chain.
   * @param params - Story generation parameters (hero, mode, settings)
   * @returns Parsed story JSON or throws if all providers fail
   */
  export async function generateStory(params: StoryParams): Promise<StoryFull>
  ```
- Inline comments: only for non-obvious logic. Do not narrate the code.
  ```ts
  // ✅ explains why, not what
  // Using hex ID instead of UUID to avoid URL-unsafe characters in TTS file paths
  const id = randomBytes(16).toString('hex');

  // ❌ narrates what the code already says
  // Convert to hex string
  const id = randomBytes(16).toString('hex');
  ```
- TODO format: `// TODO(#<issue-number>): <description>` — always link to an issue
- Security-sensitive code: `// SECURITY: <reason>` comment explaining the constraint
- `intentional: <reason>` for any suppressed lint rule or `any` type usage
