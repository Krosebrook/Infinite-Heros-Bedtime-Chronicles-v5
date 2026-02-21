# Infinity Heroes

## Overview

Infinity Heroes is a children's bedtime story app built with Expo (React Native) and an Express backend. Kids choose a superhero character, pick story options (duration, voice), and the app generates a unique bedtime story using OpenAI's GPT-4o-mini via streaming Server-Sent Events. The app features a space/cosmic theme with animated starfields, hero cards, and text-to-speech capabilities.

The project follows a monorepo structure with the mobile/web frontend (Expo Router) and backend (Express) living in the same repository, sharing types through a `shared/` directory.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router v6 with file-based routing (`app/` directory). Single-page combined layout:
  - `index.tsx` — Combined single-page with dark "INFINITY HEROES" header, mode tabs (Classic/Mad Libs/Sleepy), hero picker (circular avatar + prev/next arrows), duration timeline (5 connected nodes), narrator voice chips, narration speed presets (Gentle 0.8x/Medium 0.9x/Normal 1.0x), and "BEGIN ADVENTURE" button
  - `madlibs.tsx` — Mad Libs word input screen
  - `sleep-setup.tsx` — Sleep mode soundscape and timer setup
  - `story.tsx` — Story generation and display with streaming text
  - `completion.tsx` — Post-story celebration screen
  - `options.tsx` — Legacy screen (no longer used in main flow)
- **State Management**: TanStack React Query for server state, local component state with useState
- **Local Storage**: AsyncStorage for favorites and read story tracking (`lib/storage.ts`)
- **Styling**: React Native StyleSheet with a dark cosmic color theme defined in `constants/colors.ts`
- **Animations**: React Native Reanimated for entrance animations, pulsing effects, and star twinkling
- **Fonts**: Nunito (Google Fonts) in multiple weights via `@expo-google-fonts/nunito`
- **Haptics**: Expo Haptics for touch feedback on interactions
- **Text-to-Speech**: ElevenLabs via Replit connector for natural voice narration (7 voice options), with expo-av for audio playback. Adjustable narration speed (Gentle 0.8x, Medium 0.9x, Normal 1.0x) via expo-av rate control with pitch correction. Speed can be set on setup screen and adjusted mid-playback on story screen. Sleepy mode defaults to Gentle, others to Medium.
- **Background Music**: Static royalty-free MP3 files served from Express backend (`assets/music/`), played via expo-av with looping. Three tracks: Gymnopedie No. 1 (classic), Dreamy Flashback (sleep), Merry Go (madlibs) — all CC-BY Kevin MacLeod

### Backend (Express)
- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production bundling)
- **API Server**: Express v5 running on the same deployment, serves both API routes and (in production) static web assets
- **Key Endpoints**:
  - `GET /api/health` — Health check (returns `{"status":"ok","timestamp":...}`)
  - `POST /api/generate-story` — Generates bedtime story using Gemini 2.5 Flash
  - `POST /api/generate-avatar` — AI hero avatar generation via Gemini image model
  - `POST /api/generate-scene` — Scene illustration generation
  - `POST /api/tts` — Text-to-speech via ElevenLabs (max 5000 chars)
  - `GET /api/tts-audio/:file` — Serves cached TTS audio (hex hash filenames only)
  - `GET /api/music/:mode` — Serves static background music files (classic, sleep, madlibs)
  - `POST /api/suggest-settings` — AI-powered story setting suggestions via Gemini (mode, duration, speed, voice, tip based on time of day and hero)
  - `GET /api/voices` — Lists available narrator voices
- **AI Integration**: Google Gemini AI via Replit AI Integrations (`AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`), using `gemini-2.5-flash` for text and `gemini-2.5-flash-image` for images
- **CORS**: Dynamic origin handling supporting Replit dev domains and localhost for Expo web development
- **Security**: Input sanitization (string length caps), rate limiting (10 req/min/IP on AI endpoints), path traversal protection on TTS audio serving, 100KB body size limit
- **Reliability**: Graceful shutdown on SIGTERM/SIGINT, TTS cache auto-eviction (24h TTL, hourly cleanup)

### Shared Code (`shared/`)
- **Schema**: Drizzle ORM schema definitions shared between frontend and backend
  - `schema.ts` — Users table (PostgreSQL with `gen_random_uuid()`)
  - `models/chat.ts` — Conversations and messages tables (for chat integration features)
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory
- **Push**: `npm run db:push` for schema synchronization
- **Current Usage**: The main app functionality (story generation) doesn't require the database — it uses in-memory storage (`server/storage.ts` with `MemStorage`). The database schema exists for user management and chat/conversation features in the Replit integrations.

### Replit Integrations (`server/replit_integrations/`)
Pre-built integration modules available but not all actively used by the main app:
- **Chat**: Conversation CRUD with message history, OpenAI streaming
- **Audio**: Voice recording, speech-to-text, text-to-speech, voice chat with PCM16 streaming
- **Image**: Image generation via `gpt-image-1`
- **Batch**: Batch processing with rate limiting (`p-limit`) and retries (`p-retry`)

### Build & Deployment
- **Dev Mode**: Two processes — `expo:dev` (Expo Metro bundler) and `server:dev` (Express with tsx)
- **Production Build**: `expo:static:build` creates a static web export, `server:build` bundles the Express server with esbuild, `server:prod` runs the production server which serves both the API and static files
- **Environment Variables**: `EXPO_PUBLIC_DOMAIN` connects the frontend to the backend API, `DATABASE_URL` for PostgreSQL, Replit-specific variables for domain routing

### API Communication
- Frontend uses a custom `apiRequest` helper and `getApiUrl()` in `lib/query-client.ts` that constructs the API URL from `EXPO_PUBLIC_DOMAIN`
- Story generation uses `expo/fetch` with streaming support for SSE consumption on the client
- The Express server proxies Expo dev requests in development mode via `http-proxy-middleware`

## External Dependencies

### Services & APIs
- **OpenAI API** (via Replit AI Integrations): Story generation with `gpt-4o-mini`, image generation with `gpt-image-1`
  - Configured through `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **PostgreSQL**: Database provisioned through Replit, connected via `DATABASE_URL`

### Key NPM Packages
- **Frontend**: expo, expo-router, react-native-reanimated, react-native-gesture-handler, expo-speech, expo-haptics, expo-linear-gradient, @tanstack/react-query, @react-native-async-storage/async-storage
- **Backend**: express, openai, drizzle-orm, pg, http-proxy-middleware
- **Shared**: drizzle-zod, zod
- **Build**: drizzle-kit, esbuild, tsx, patch-package