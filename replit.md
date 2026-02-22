# Infinity Heroes

## Overview

Infinity Heroes is a children's bedtime story app built with Expo (React Native) and an Express backend. Kids choose a superhero character, pick story options (mode, duration, voice, speed), and the app generates a unique bedtime story using Google Gemini 2.5 Flash. The app features a space/cosmic theme with animated starfields, hero cards, ElevenLabs text-to-speech narration, AI-powered setting suggestions, and three story modes (Classic, Mad Libs, Sleep). Targets ages 3-9 with strict child safety content filtering.

The project follows a monorepo structure with the mobile/web frontend (Expo Router) and backend (Express) living in the same repository, sharing types through a `shared/` directory.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: Expo Router v6 with file-based routing (`app/` directory). Single-page combined layout:
  - `index.tsx` — Combined single-page with dark "INFINITY HEROES" header, profile selector, AI suggestion card (contextual recommendations based on time of day, hero, and child age), mode tabs (Classic/Mad Libs/Sleepy), hero picker (circular avatar + prev/next arrows), duration timeline (5 connected nodes), narrator voice chips, narration speed presets (Gentle 0.8x/Medium 0.9x/Normal 1.0x), and "BEGIN ADVENTURE" button. Navigation to trophies, parent controls, and Memory Jar.
  - `madlibs.tsx` — Mad Libs word input screen
  - `sleep-setup.tsx` — Sleep mode soundscape and timer setup
  - `story.tsx` — Story generation and display with streaming text; also supports re-reading saved stories via `replayJson` param
  - `completion.tsx` — Post-story celebration screen with badge awarding and streak tracking
  - `trophies.tsx` — Trophy Shelf screen showing earned badges, current/longest streaks, and locked badge previews
  - `options.tsx` — Legacy screen (no longer used in main flow)
- **State Management**: TanStack React Query for server state, React Context for profile state (`lib/ProfileContext.tsx`), local component state with useState
- **Local Storage**: AsyncStorage for profiles, badges, streaks, parent controls, favorites, and read story tracking (`lib/storage.ts`)
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
  - `POST /api/suggest-settings` — AI-powered story setting suggestions via Gemini (mode, duration, speed, voice, tip based on time of day, hero, and child age/name)
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
- **Google Gemini AI** (via Replit AI Integrations): Story generation and setting suggestions with `gemini-2.5-flash`, image generation with `gemini-2.5-flash-image`
  - Configured through `AI_INTEGRATIONS_GEMINI_API_KEY` and `AI_INTEGRATIONS_GEMINI_BASE_URL`
- **OpenAI** (direct API key): Video generation with Sora 2 (`sora-2-2025-12-08`), fallback image generation with `gpt-image-1`
  - Configured through `OPENAI_API_KEY` (required for video and image fallback features)
  - Note: Replit AI integrations proxy does NOT support video outputs — requires direct API key
- **ElevenLabs** (via Replit connector): Text-to-speech narration with `eleven_multilingual_v2` model, 9 voice options in 3 categories
  - Configured through `ELEVENLABS_API_KEY`
- **PostgreSQL**: Database provisioned through Replit, connected via `DATABASE_URL`

### Key NPM Packages
- **Frontend**: expo, expo-router, react-native-reanimated, react-native-gesture-handler, expo-av, expo-haptics, expo-linear-gradient, @tanstack/react-query, @react-native-async-storage/async-storage
- **Backend**: express, @google/genai, drizzle-orm, pg, http-proxy-middleware
- **Shared**: drizzle-zod, zod
- **Build**: drizzle-kit, esbuild, tsx, patch-package

## Recent Changes

- **Feb 2026 — Child Profiles & Personalization**: Added ProfileContext (`lib/ProfileContext.tsx`) with AsyncStorage persistence, ProfileModal for creating/editing/deleting child profiles (name, age, avatar emoji, favorite hero). Personalized "Welcome back" greeting on home screen. AI suggestions now accept `childAge` and `childName` for age-tailored recommendations.
- **Feb 2026 — Badge & Streak System**: 12 collectible badges (first_story, night_story, morning_story, all_heroes, madlibs_3, sleep_3, classic_5, streak_3, streak_7, total_10, total_25, vocab_5) with persistent storage. Daily streak tracking with automatic reset. Badges awarded on story completion in `completion.tsx` with animated celebration display.
- **Feb 2026 — Trophy Shelf**: New `trophies.tsx` screen showing earned badges with glow effects, current/longest streak counters, and locked badge previews with requirements.
- **Feb 2026 — Parent Controls**: PIN-protected parent controls modal with bedtime hour/minute settings, max story length limits (short/medium-short/medium/long/epic), and content theme filtering (6 themes).
- **Feb 2026 — Continue Story from Memory Jar**: Tapping a saved story in the Memory Jar opens it in the story screen for re-reading via `replayJson` param, with re-read button and card tap navigation.
- **Feb 2026 — AI-Powered Setting Suggestions**: Added `POST /api/suggest-settings` endpoint using Gemini 2.5 Flash (with `thinkingBudget: 0` to prevent token truncation). Frontend AI suggestion card auto-fetches on page load and hero change, shows contextual tip and setting chips (mode, duration, speed, voice), with Apply/Refresh/Dismiss controls.
- **Feb 2026 — Narration Speed Control**: Added adjustable narration speed presets (Gentle 0.8x, Medium 0.9x, Normal 1.0x) on setup screen and mid-playback on story screen via expo-av rate control with pitch correction. Sleepy mode defaults to Gentle, others to Medium.
- **Feb 2026 — ElevenLabs TTS Integration**: Replaced basic speech with ElevenLabs `eleven_multilingual_v2` model via Replit connector, 7 natural voice options, cached audio serving with 24h TTL and hourly cleanup.
- **Feb 2026 — Background Music**: Added royalty-free static MP3 tracks served from Express backend — Gymnopedie No. 1 (classic), Dreamy Flashback (sleep), Merry Go (madlibs), all CC-BY Kevin MacLeod.
- **Feb 2026 — Security Hardening**: Input sanitization (string length caps), rate limiting (10 req/min/IP on AI endpoints), path traversal protection on TTS audio, 100KB body size limit, graceful shutdown on SIGTERM/SIGINT.
- **Feb 2026 — AI Provider Migration**: Migrated from OpenAI GPT-4o-mini to Google Gemini 2.5 Flash for story generation, setting suggestions, and image generation.
- **Feb 2026 — AI Video Scenes (Sora 2)**: Added optional AI-generated video clips (4 seconds, 1280x720) between story scenes using OpenAI Sora 2 (`sora-2-2025-12-08`). Toggleable via Parent Controls (`videoEnabled`, default off). Backend async job system with polling, cached in `/tmp/video-cache` with 24h expiry. Endpoints: `POST /api/generate-video`, `GET /api/video-status/:id`, `GET /api/video/:id`, `GET /api/video-available`. Frontend `SceneVideoPlayer` component with progress bar and inline `expo-av Video` playback. Requires direct `OPENAI_API_KEY` (Replit AI integrations proxy doesn't support video outputs).
- **Feb 2026 — OpenAI Image Fallback**: Added `gpt-image-1` as fallback image provider for avatar and scene generation. If Gemini image generation fails, automatically falls back to OpenAI (requires `OPENAI_API_KEY`). Used for both `POST /api/generate-avatar` and `POST /api/generate-scene`.
- **Feb 2026 — 9-Voice System**: Redesigned voice system with 9 voices in 3 categories — Sleep (moonbeam/whisper/stardust), Classic (captain/professor/aurora), Fun (giggles/blaze/ziggy). Per-voice ElevenLabs settings (stability, style, similarity), mode-aware suggestions, voice preview endpoint.

## Roadmap

### Completed
- Child profiles (name, age, favorite heroes) stored locally via AsyncStorage
- AI suggestions tailored to the child's age
- Story history per child
- "Welcome back, [name]!" greeting on the setup screen
- Collectible badges (12 achievements) earned after completing stories
- Badge gallery / trophy shelf screen with streak display
- Streak tracking — consecutive nights of bedtime stories
- Animated celebration effects when earning badges
- "Continue the story" — re-read saved stories from Memory Jar
- Parent controls — bedtime reminder settings, story length limits, content theme filtering with PIN protection

### Future Enhancements
- Ambient sound effects layered on background music (rain, crickets, ocean waves)
- Multi-language story generation
- Collaborative story mode (parent + child)