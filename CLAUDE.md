# CLAUDE.md - Infinity Heroes: Bedtime Chronicles v5

## Project Overview

AI-powered interactive bedtime story app for children ages 3-9. Kids create custom superheroes and experience personalized, AI-generated adventures with illustrations, narration, and gamification. Full-stack mobile-first app using Expo (React Native) frontend with Express.js backend.

## Tech Stack

- **Frontend:** Expo SDK 54, React Native 0.81 (New Architecture), Expo Router v6 (file-based routing)
- **State:** TanStack React Query (server state) + React Context (app settings, profiles)
- **Local Storage:** AsyncStorage for stories, profiles, badges, streaks, parent controls
- **Styling:** React Native StyleSheet + react-native-reanimated for animations
- **Backend:** Express.js v5, TypeScript, Node.js 18+
- **Database:** PostgreSQL + Drizzle ORM (voice chat features only)
- **AI:** Multi-provider router with fallback chain (Anthropic Claude > Gemini > OpenAI > OpenRouter)
- **TTS:** ElevenLabs API (eleven_multilingual_v2, 8 narrator voices)
- **Video:** OpenAI Sora 2 (optional)
- **Build:** esbuild (server), Metro (client), Babel with React Compiler

## Project Structure

```
app/                    # Expo Router screens (file-based routing)
  (tabs)/               # Tab navigation (home, create, library, saved, profile)
  story.tsx             # Story reading/playback (largest screen ~49KB)
  story-details.tsx     # Story customization wizard
  completion.tsx        # Post-story celebration + badge awarding
  quick-create.tsx      # Fast onboarding hero creation
  madlibs.tsx           # Mad Libs mode wizard
  sleep-setup.tsx       # Sleep mode setup
  settings.tsx          # App settings
components/             # Reusable React Native components
constants/              # Types, hero templates, colors, timing
  types.ts              # Core TypeScript interfaces
  heroes.ts             # Pre-defined hero templates
  colors.ts             # Cosmic theme palette
lib/                    # Client utilities
  SettingsContext.tsx    # Unified settings provider (React Context)
  ProfileContext.tsx     # Child profile context
  storage.ts            # AsyncStorage helpers
  query-client.ts       # TanStack React Query config
server/                 # Express.js backend
  index.ts              # Server bootstrap, security middleware, CORS
  routes.ts             # All API endpoints (~33KB, 20+ endpoints)
  ai/                   # Multi-provider AI router
    router.ts           # AIRouter class with fallback chain
    providers/          # Gemini, OpenAI, Anthropic, OpenRouter
  elevenlabs.ts         # TTS voice definitions & generation
  suno.ts               # Background music serving
  video.ts              # Sora video generation
  db.ts                 # Drizzle ORM client
  replit_integrations/  # Audio, chat, image, batch modules
shared/                 # Shared between client & server
  schema.ts             # Drizzle ORM schema (users table)
  models/chat.ts        # Conversation & message tables
docs/                   # Project documentation
  ARCHITECTURE.md       # System design & data flow
  API.md                # API endpoint reference (40+ endpoints)
  SECURITY.md           # OWASP assessment
  ROADMAP.md            # Development roadmap
  CHANGELOG.md          # Version history
patches/                # patch-package fixes for dependencies
scripts/                # Build scripts (build.js)
```

## Common Commands

```bash
# Development (parallel frontend + backend)
npm run server:dev          # Backend on port 5000 (tsx server/index.ts)
npm run expo:dev            # Frontend on port 8081

# Build
npm run server:build        # esbuild → server_dist/index.js
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
[Expo Mobile App] → HTTP/JSON → [Express Server]
                                   ├→ [AI Router] → Anthropic → Gemini → OpenAI → OpenRouter
                                   ├→ [ElevenLabs TTS]
                                   ├→ [PostgreSQL + Drizzle] (voice chat history)
                                   └→ [OpenAI Sora] (video generation)
```

### AI Provider Fallback Chain
- **Text:** Anthropic Claude (claude-sonnet-4-6) → Gemini 2.5 Flash → OpenAI gpt-4o-mini → OpenRouter (xAI, Mistral, Cohere, Meta Llama)
- **Image:** Gemini 2.5 Flash Image → OpenAI gpt-image-1

### Story Modes
- **Classic** — Adventure stories with choices
- **Mad Libs** — Silly stories with user-provided words
- **Sleep** — Calming, meditative stories for bedtime

## Key Patterns & Conventions

### TypeScript
- Strict mode enabled in tsconfig.json
- Path aliases: `@/*` (project root), `@shared/*` (shared folder)
- Interfaces defined in `constants/types.ts` (StoryPart, CachedStory, ChildProfile, EarnedBadge, ParentControls)

### API Design
- All endpoints under `/api/*` prefix
- Response format: JSON or Server-Sent Events (SSE) for streaming
- Rate limiting: 10 req/min per IP (configurable via env)
- Error responses: `{ "error": "Human-readable message" }`
- Input sanitization: max 500 chars for string inputs
- No authentication (client-side profiles only)

### Client Storage Keys (AsyncStorage)
- `@infinity_heroes_app_settings` — App settings JSON
- `@infinity_heroes_profiles` — Child profiles
- `@infinity_heroes_stories` — Saved stories
- `@infinity_heroes_badges` — Earned badges
- `@infinity_heroes_streaks` — Reading streaks
- `@infinity_heroes_parent_controls` — Parent controls
- `@infinity_heroes_favorites` — Favorite stories
- `@infinity_heroes_onboarding_complete` — Onboarding flag

### Styling
- Cosmic theme with indigo/purple palette (see `constants/colors.ts`)
- Dark UI by default (`userInterfaceStyle: "dark"` in app.json)
- Glassmorphism effects throughout
- Portrait orientation only

### Security (Implemented)
- Server-side API proxy (no API keys exposed to client)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CORS restrictions (Replit domains + localhost)
- Child safety rules enforced in AI prompts
- Graceful shutdown (SIGTERM/SIGINT handlers)
- Error sanitization (no internal errors leaked)

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
DATABASE_URL=                # PostgreSQL (required for voice chat)

# Server Config (optional)
PORT=5000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
TTS_CACHE_MAX_AGE_MS=86400000
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

## Important Gotchas

- `server/routes.ts` is very large (~33KB) — contains all API route handlers
- `app/story.tsx` is the most complex screen (~49KB) — story playback with audio/image integration
- AI router automatically falls back through providers if one fails — check `server/ai/router.ts`
- ElevenLabs voices are hardcoded in `server/elevenlabs.ts` with specific voice IDs
- The app uses Expo Router v6 file-based routing — screen paths map to file paths in `app/`
- `postinstall` runs `patch-package` — don't skip it when installing dependencies
