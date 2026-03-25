<!-- Last verified: 2026-03-25 -->
# CLAUDE.md - Infinity Heroes: Bedtime Chronicles v5

## Project Overview

AI-powered interactive bedtime story app for children ages 3-9. Kids create custom superheroes and experience personalized, AI-generated adventures with illustrations, narration, and gamification. Full-stack mobile-first app using Expo (React Native) frontend with Express.js backend.

**Repository type:** Single full-stack app (Expo mobile + Express API server)
**Primary language:** TypeScript (strict)
**Package manager:** npm

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile framework | Expo + React Native | SDK 54 / RN 0.81 |
| Router | Expo Router (file-based) | v6 |
| Backend | Express.js | v5 |
| AI (primary) | Anthropic Claude | claude-sonnet-4-6 |
| AI (fallbacks) | Gemini, OpenAI, OpenRouter | gemini-2.5-flash / gpt-4o-mini |
| TTS | ElevenLabs | eleven_multilingual_v2 |
| Database | PostgreSQL + Drizzle ORM | drizzle-orm 0.39 |
| Client storage | AsyncStorage | 2.2.0 |
| State management | React Context + TanStack React Query | v5 |
| Animation | react-native-reanimated | v4 |
| Build/bundle | esbuild (server), Metro (client) | — |

Additional details:
- **Fonts:** Nunito (primary), Plus Jakarta Sans (UI), Bangers (display/titles)
- **Video:** OpenAI Sora 2 (optional)
- **Build:** Babel with React Compiler enabled

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  _layout.tsx           # Root layout — providers: ErrorBoundary → QueryClient → Profile → Settings → Gesture → Keyboard
  (tabs)/               # Tab navigation (home, create, library, saved, profile)
    _layout.tsx          # Tab bar layout (5 tabs, 60px height + bottom inset)
  story.tsx             # Story reading/playback (largest screen ~49KB, fullScreen fade modal)
  story-details.tsx     # Story customization wizard (slide from right)
  completion.tsx        # Post-story celebration + badge awarding (fullScreen fade modal)
  quick-create.tsx      # Fast onboarding hero creation (modal from bottom)
  madlibs.tsx           # Mad Libs mode wizard (slide from right)
  sleep-setup.tsx       # Sleep mode setup (slide from right)
  settings.tsx          # App settings (slide from right)
  trophies.tsx          # Badge collection view (slide from right)
  welcome.tsx           # Onboarding splash (fade animation)
components/             # Reusable React Native components
  ErrorBoundary.tsx     # Error boundary wrapper
  HeroCard.tsx          # Hero template card (orphaned — kept for future reuse)
  MemoryJar.tsx         # Story memory display
  ParentControlsModal.tsx  # Parent controls (PIN-protected)
  ProfileModal.tsx      # Child profile management
  SettingsModal.tsx     # Settings overlay
  PulsingOrb.tsx        # Animated orb effect
  StarField.tsx         # Background star animation
constants/              # Types, hero templates, colors, timing
  types.ts              # Core TypeScript interfaces
  heroes.ts             # 8 pre-defined hero templates
  colors.ts             # Cosmic theme palette
  timing.ts             # Animation timing constants
lib/                    # Client utilities
  SettingsContext.tsx    # Unified settings provider (React Context)
  ProfileContext.tsx     # Child profile context
  storage.ts            # AsyncStorage helpers
  query-client.ts       # TanStack React Query config (staleTime: Infinity, retry: false)
server/                 # Express.js backend
  index.ts              # Server bootstrap, security middleware, CORS, graceful shutdown
  routes.ts             # All API endpoints (~33KB, 30+ endpoints)
  ai/                   # Multi-provider AI router
    index.ts            # Provider registration & status checking
    router.ts           # AIRouter class with fallback chain
    types.ts            # AI provider interface definitions
    providers/          # Gemini, OpenAI, Anthropic, OpenRouter
  elevenlabs.ts         # TTS voice definitions & generation
  suno.ts               # Background music serving
  video.ts              # Sora video generation
  storage.ts            # Server-side storage utilities
  db.ts                 # Drizzle ORM client
  replit_integrations/  # Audio, chat, image, batch modules (conditionally registered)
  templates/            # HTML templates (landing page)
shared/                 # Shared between client & server
  schema.ts             # Drizzle ORM schema (users table)
  models/chat.ts        # Conversation & message tables
docs/                   # Project documentation
  ARCHITECTURE.md       # System design & data flow
  API.md                # API endpoint reference (40+ endpoints)
  SECURITY.md           # OWASP assessment
  ROADMAP.md            # Development roadmap
  CHANGELOG.md          # Version history
  DEAD-CODE-TRIAGE.md   # Code audit report
patches/                # patch-package fixes for dependencies
scripts/                # Build scripts (build.js)
```

## Common Commands

```bash
# Development (parallel frontend + backend)
npm run server:dev          # Backend on port 5000 (tsx server/index.ts)
npm run expo:dev            # Frontend on port 8081 (Replit environment)
npx expo start              # Frontend (non-Replit)

# Build
npm run server:build        # esbuild → server_dist/index.js (ESM format)
npm run expo:static:build   # Expo static build (node scripts/build.js)

# Production
npm run server:prod         # NODE_ENV=production node server_dist/index.js

# Code Quality
npm run lint                # npx expo lint
npm run lint:fix            # npx expo lint --fix
npm run typecheck           # npx tsc --noEmit

# Database
npm run db:push             # Drizzle schema migration (needs DATABASE_URL)
```

## Architecture

```
[Expo Mobile App] → HTTP/JSON → [Express Server (port 5000, 0.0.0.0)]
                                   ├→ [AI Router] → Anthropic → Gemini → OpenAI → OpenRouter
                                   ├→ [ElevenLabs TTS] → /tmp/tts-cache (24h TTL)
                                   ├→ [PostgreSQL + Drizzle] (voice chat history)
                                   └→ [OpenAI Sora] (video generation)
```

### AI Provider Fallback Chain

**Text Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Anthropic | `claude-sonnet-4-6` |
| 2 | Gemini | `gemini-2.5-flash` |
| 3 | OpenAI | `gpt-4o-mini` |
| 4 | OpenRouter/xAI | `x-ai/grok-3-mini` |
| 5 | OpenRouter/Mistral | `mistralai/mistral-small-3.1-24b-instruct` |
| 6 | OpenRouter/Cohere | `cohere/command-a-03-2025` |
| 7 | OpenRouter/Meta | `meta-llama/llama-4-scout-17b-16e-instruct` |

**Image Generation:**
| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini | `gemini-2.5-flash` |
| 2 | OpenAI | `gpt-image-1` |

### Story Modes
- **Classic** — Adventure stories with choices
- **Mad Libs** — Silly stories with user-provided words
- **Sleep** — Calming, meditative stories for bedtime

### Story Duration Configuration
| Duration | Parts | Word Count |
|----------|-------|------------|
| short | 3 | 200-300 |
| medium-short | 4 | 350-450 |
| medium | 5 | 500-650 |
| long | 6 | 750-950 |
| epic | 7 | 1000-1300 |

## Key API Endpoints

**Story Generation:**
- `POST /api/generate-story` — Synchronous story generation (JSON)
- `POST /api/generate-story-stream` — Streaming story generation (SSE)
- `POST /api/generate-avatar` — Hero portrait image
- `POST /api/generate-scene` — Story scene illustration (random art style from 12 presets)
- `POST /api/suggest-settings` — AI-powered story recommendations

**Text-to-Speech:**
- `POST /api/tts` — Generate narration (max 5000 chars)
- `GET /api/tts-audio/:file` — Retrieve cached audio file
- `POST /api/tts-preview` — Voice preview for selection

**Configuration:**
- `GET /api/voices` — Available narrator voices for current mode
- `GET /api/music/:mode` — Background music track
- `GET /api/health` — Server health check
- `GET /api/ai-providers` — Provider availability status

**Video (optional):**
- `POST /api/generate-video` — Create video via Sora 2
- `GET /api/video-status/:id` — Check video job status
- `GET /api/video/:id` — Retrieve generated video

**Voice Chat (requires DATABASE_URL + OPENAI_API_KEY):**
- `POST /api/conversations/send` — Send voice message
- `GET /api/conversations/:id` — Get conversation history

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
- Path aliases: `@/*` (project root), `@shared/*` (shared folder)

### Styling
- Use `StyleSheet.create()` — no inline style objects except for dynamic values
- Color constants from `constants/colors.ts` — never hardcode color hex values
- Theme: cosmic midnight/indigo/purple glassmorphism; accent `#6366f1`
- Glassmorphism: `rgba(255,255,255,0.03)` bg + `rgba(255,255,255,0.1)` border
- Portrait orientation only; dark UI by default (`userInterfaceStyle: "dark"`)

### Error Handling
- Server: catch errors, log with context, return `{ error: string }` with appropriate HTTP status. Never leak stack traces to clients.
- Client: use React Error Boundaries for screen-level errors; show user-friendly message, not raw error
- AI calls: the AI router handles provider fallback automatically; callers should still catch final failure

## Key Patterns & Conventions

### Story Response Schema (AI must return)
```json
{
  "title": "3-6 word title",
  "parts": [{ "text": "2-4 paragraphs", "choices": ["A", "B", "C"], "partIndex": 0 }],
  "vocabWord": { "word": "...", "definition": "child-friendly definition" },
  "joke": "age-appropriate joke",
  "lesson": "gentle life lesson (1-2 sentences)",
  "tomorrowHook": "teaser for next adventure",
  "rewardBadge": { "emoji": "...", "title": "2-3 words", "description": "..." }
}
```

### Child Safety Rules (enforced in AI prompts)
- No violence, weapons, fighting, scary/horror elements
- No real-world brands, celebrities, or copyrighted characters
- No death, injury, illness, abandonment, or loss
- No bullying, meanness, exclusion, or anxiety-inducing language
- All choices lead to positive outcomes
- Focus on: courage, kindness, friendship, wonder, imagination, comfort

### Client Storage Keys (AsyncStorage)
- `@infinity_heroes_app_settings` — App settings JSON
- `@infinity_heroes_profiles` — Child profiles
- `@infinity_heroes_active_profile` — Currently selected profile
- `@infinity_heroes_stories` — Saved stories
- `@infinity_heroes_read` — Read story tracking
- `@infinity_heroes_badges` — Earned badges
- `@infinity_heroes_streaks` — Reading streaks
- `@infinity_heroes_parent_controls` — Parent controls
- `@infinity_heroes_favorites` — Favorite stories
- `@infinity_heroes_onboarding_complete` — Onboarding flag
- `@infinity_heroes_preferences` — Legacy key (auto-migrates to app_settings)

### App Settings (defaults)
```typescript
{
  audioVolume: 80,           // 0-100
  audioSpeed: 1.0,
  narratorVoice: "moonbeam",
  autoPlay: false,
  storyLength: "medium",     // short | medium-short | medium | long | epic
  ageRange: "4-6",           // 2-4 | 4-6 | 6-8 | 8-10
  defaultTheme: "fantasy",
  autoGenerateImages: false,
  textSize: "medium",        // small | medium | large
  librarySortOrder: "recent", // recent | alphabetical | theme
  autoSave: true,
  isMuted: false,
  reducedMotion: false,
  fontSize: "normal",        // normal | large
  sleepTheme: "Cloud Kingdom"
}
```

### Narrator Voices (ElevenLabs)
**Sleep mode:** moonbeam (Laura), whisper (Sarah), stardust (Gigi)
**Classic mode:** captain (Charlotte), professor (Callum), aurora (Rachel)
**Fun mode:** giggles (Freya), blaze (Dave), ziggy (Matilda)

Sleep mode dynamically adjusts non-sleep voices: +stability, -style, no speaker boost.

### Content Themes
`courage` | `kindness` | `friendship` | `wonder` | `imagination` | `comfort`

### Hero Templates (8 pre-defined)
Nova (Guardian of Light), Coral (Heart of the Ocean), Orion (Star of Friendship), Luna (Dream Weaver), Nimbus (Brave Cloud), Bloom (Garden Keeper), Whistle (Night Train Conductor), Shade (Shadow Friend)

### Badge System (12 achievements)
| Badge | Condition |
|-------|-----------|
| First Adventure | Complete first story |
| Night Owl | Listen after 8 PM |
| Early Bird | Listen 5-10 AM |
| Hero Collector | Use every hero at least once |
| Silly Storyteller | Complete 3 Mad Libs stories |
| Dream Weaver | Complete 3 Sleep mode stories |
| Classic Champion | Complete 5 Classic stories |
| On Fire! | 3-day reading streak |
| Diamond Reader | 7-day reading streak |
| Bookworm | Complete 10 total stories |
| Story Legend | Complete 25 total stories |
| Word Wizard | Learn 5 vocabulary words |

## Architecture Constraints

- **AI calls must go through `server/ai/index.ts`** — never call AI provider SDKs directly from routes.
- **No AI keys on the client** — all AI provider keys are server-side environment variables only.
- **Input sanitization is mandatory** — all user-provided string inputs must pass through `sanitizeString()` before inclusion in AI prompts.
- **Child safety system prompt** — the `CHILD_SAFETY_RULES` constant must be included in every story generation prompt. Never remove or bypass it.
- **Rate limiting** — per-IP sliding window rate limiter protects all POST endpoints. Do not add endpoints that bypass it.
- **AsyncStorage** is the canonical client-side storage mechanism. Use the helpers in `lib/storage.ts` rather than calling AsyncStorage directly.
- **Settings** live exclusively in `SettingsContext` (`lib/SettingsContext.tsx`). Do not create parallel settings systems.

## Security

### Rules
- Never commit secrets, API keys, or credentials. Use environment variables.
- All server responses must use `sanitizeErrorMessage()` — never return raw error objects.
- TTS filename serving: only files matching `/^[a-f0-9]+\.mp3$/` are served — do not relax this regex.
- Video ID validation: only IDs matching `/^[a-f0-9]+$/` are accepted.
- CORS is restricted to Replit domains + localhost — do not add wildcards.
- Input truncation via `sanitizeString()` is mandatory before any prompt inclusion.

### Implemented
- Server-side API proxy (no API keys exposed to client)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CORS restrictions (Replit domains + localhost)
- Graceful shutdown (SIGTERM/SIGINT, 10s timeout)
- Error sanitization (no internal errors leaked)
- Rate limiting per IP (10 req/min, cleanup every 5 min)

### Server Middleware Order
1. Environment validation (warns on missing providers)
2. Security headers
3. CORS (Replit domains + localhost, methods: GET/POST/PUT/DELETE/OPTIONS)
4. Body parsing (JSON + URL-encoded, 100KB limit)
5. Request logging
6. Expo manifest routing
7. Static file serving
8. Route registration
9. Error handler (sanitizes messages)

## Testing Approach

**No automated test suite exists yet.** This is the top item on the roadmap.

Until tests are added: verify happy path + error states manually before committing. Document manual test steps in the PR description.

When a test framework is added, target:
- File naming: `<module>.test.ts` alongside the source file
- Coverage: ≥80% branch coverage for server utilities
- Mocks: mock all external API calls (Gemini, OpenAI, ElevenLabs)

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

## Environment Variables

```
# AI Providers (via Replit integrations)
AI_INTEGRATIONS_GEMINI_API_KEY=
AI_INTEGRATIONS_OPENAI_API_KEY=
AI_INTEGRATIONS_ANTHROPIC_API_KEY=
AI_INTEGRATIONS_OPENROUTER_API_KEY=
OPENAI_API_KEY=              # Direct key for video generation

# TTS & Database
ELEVENLABS_API_KEY=
DATABASE_URL=                # PostgreSQL (required for voice chat only)

# Server Config (optional)
PORT=5000                    # Default 5000
NODE_ENV=                    # development | production
RATE_LIMIT_WINDOW_MS=60000   # Default 60000ms
RATE_LIMIT_MAX=10            # Default 10 requests
TTS_CACHE_MAX_AGE_MS=86400000  # Default 24 hours

# Replit-specific (auto-set)
REPLIT_DEV_DOMAIN=           # Dev server domain
REPLIT_DOMAINS=              # Production domains (comma-separated)
EXPO_PUBLIC_DOMAIN=          # Client API domain (set by dev script)
```

## Development Notes

- **No test framework configured** — MVP stage, no Jest/Vitest/Mocha
- **No CI/CD pipelines** — Deployment via Replit push-to-deploy (Google Cloud Run)
- **React Compiler** enabled via app.json experiments
- **New Architecture** (React Native) enabled
- **Typed Routes** enabled for Expo Router
- **patch-package** used for dependency fixes (applied via postinstall)
- Database (PostgreSQL) is only required for voice chat features; core story functionality uses AsyncStorage only
- Server uses esbuild for production bundling to `server_dist/`
- Voice chat routes only registered when `AI_INTEGRATIONS_OPENAI_API_KEY` and `DATABASE_URL` are set
- React Query configured with `staleTime: Infinity`, `retry: false`, `refetchOnWindowFocus: false`
- TTS audio cached at `/tmp/tts-cache` with configurable max age
- 12 randomized art styles for scene illustrations (watercolor, cel-shaded, paper cutout, gouache, crayon, digital, retro storybook, ink wash, pastel, pop art, chalk, flat design)

## Known Gotchas

- **`npm run dev` does not exist** — use `npm run server:dev` (backend) and `npm run expo:dev` (frontend) separately
- **`expo:dev` requires Replit env vars** — the `EXPO_PACKAGER_PROXY_URL` / `REPLIT_DEV_DOMAIN` are injected by the Replit shell; outside Replit, use `npx expo start` directly
- **`server/routes.ts` is very large (~33KB)** — contains all API route handlers
- **`app/story.tsx` is the most complex screen (~49KB)** — story playback with audio/image integration
- **AI router automatically falls back** through providers if one fails — check `server/ai/router.ts`
- **ElevenLabs voices are hardcoded** in `server/elevenlabs.ts` with specific voice IDs
- **`patches/expo-asset+12.0.12.patch`** — a patch-package fix for Expo dev server HTTPS. Will be removed when Expo upgrades to SDK 55+
- **`server/replit_integrations/`** — these modules are wired up but the voice chat UI screen doesn't exist yet; backend routes are functional
- **`lib/storage.ts` vs `server/storage.ts`** — both files exist; `lib/storage.ts` is client-side AsyncStorage helpers; `server/storage.ts` is server-side in-memory story cache
- **`shared/schema.ts` vs `shared/models/chat.ts`** — `schema.ts` re-exports from `models/chat.ts`; both included in `drizzle.config.ts`
- **Legacy `@infinity_heroes_preferences` key** auto-migrates to `@infinity_heroes_app_settings`
- **Server binds to `0.0.0.0`** with `reusePort: true`
- **JSON body limit is 100KB** — large story payloads may need chunking
- **`HeroCard.tsx`** — this component exists but is not yet used anywhere (orphaned); kept intentionally for future reuse
- **`getReadStories` / `markStoryRead`** — these AsyncStorage helpers exist in `lib/storage.ts` but no UI reads/displays the unread state yet

## Files/Directories — Do Not Modify Without Explicit Approval

- `patches/` — patch-package fixes; modifying breaks the postinstall step
- `server/replit_integrations/` — Replit-provided integration boilerplate; upstream updates may overwrite changes
- `shared/schema.ts` — database schema changes require coordinated migration; do not modify alone
- `.replit` — Replit workspace config; changes affect the dev environment for all contributors
