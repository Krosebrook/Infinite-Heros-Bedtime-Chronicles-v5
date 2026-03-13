# Infinity Heroes: Bedtime Chronicles

An AI-powered interactive bedtime story app for children ages 3-9. Kids create their own superhero and embark on magical, personalized adventures with AI-generated stories, illustrations, and narration.

## Features

- **3 Story Modes:** Classic (adventure), Mad Libs (silly/funny), Sleep (calming/meditative)
- **AI Story Generation:** Multi-provider AI routing (Gemini, OpenAI, Anthropic, OpenRouter) with automatic fallback
- **AI Scene Illustrations:** Unique art for each story scene in randomized styles (watercolor, cel-shaded, collage, etc.)
- **Text-to-Speech Narration:** 8 unique narrator voices via ElevenLabs with per-mode voice matching
- **Hero Creator:** Create custom superheroes with name, title, power, and AI-generated avatar
- **Child Profiles:** Multi-child support with per-profile story history, badges, and streaks
- **Gamification:** 12 achievement badges, reading streaks, vocabulary words, and story completion rewards
- **Parent Controls:** Story length limits, bedtime scheduling, theme filtering, PIN protection
- **Voice Chat:** Talk to your hero (requires OpenAI audio API + PostgreSQL)
- **Video Generation:** Animated story scenes via OpenAI Sora (optional)
- **Background Music:** Mode-specific ambient music
- **Smart Suggestions:** AI-powered story setting recommendations based on time of day and child profile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | Expo SDK 54 (React Native) |
| Router | Expo Router (file-based) |
| Backend | Express.js (Node.js) |
| AI Providers | Google Gemini, OpenAI, Anthropic Claude, OpenRouter (xAI, Mistral, Cohere, Meta Llama) |
| TTS | ElevenLabs |
| Database | PostgreSQL + Drizzle ORM (for voice chat) |
| Client Storage | AsyncStorage (stories, profiles, settings, badges) |
| Styling | React Native StyleSheet + Reanimated |
| Animations | react-native-reanimated |

## Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- At least one AI provider API key (Gemini recommended as primary)
- ElevenLabs API key (for narration)
- PostgreSQL database (optional, for voice chat feature)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server (Expo + Express)
npm run dev

# Or start components separately:
npm run server    # Express backend on port 5000
npx expo start   # Expo dev server
```

## Project Structure

```
app/                    # Expo Router screens
  (tabs)/               # Tab navigation (home, create, library, profile)
  story.tsx             # Story reading/playback screen
  completion.tsx        # Story completion + badge awarding
  settings.tsx          # App settings screen
  story-details.tsx     # Story customization (classic mode)
  quick-create.tsx      # Onboarding hero creation
components/             # Reusable React Native components
  SettingsModal.tsx     # Settings modal (voice, accessibility)
  HeroCard.tsx          # Hero selection card (reserved for reuse)
constants/              # Types, colors, hero definitions
  types.ts              # TypeScript interfaces
  heroes.ts             # Hero definitions
  colors.ts             # Color palette
lib/                    # Client utilities
  SettingsContext.tsx    # Unified settings (React Context)
  storage.ts            # AsyncStorage helpers (stories, profiles, badges)
server/                 # Express backend
  index.ts              # Server bootstrap, CORS, security headers
  routes.ts             # API route registration
  ai/                   # Multi-provider AI router
    index.ts            # Router with fallback chain
    providers/          # Gemini, OpenAI, Anthropic, OpenRouter providers
  elevenlabs.ts         # TTS voice definitions + speech generation
  suno.ts               # Background music file serving
  video.ts              # Video generation via OpenAI Sora
  db.ts                 # Drizzle database client
  replit_integrations/  # Voice chat & conversation modules
    audio/              # Voice messaging (STT + GPT-audio + format conversion)
    chat/               # Text chat with conversation history (PostgreSQL)
    image/              # Gemini image generation (standalone)
    batch/              # Rate-limit-aware batch processing utilities
shared/                 # Shared between client & server
  schema.ts             # Drizzle ORM schema (users, conversations, messages)
  models/chat.ts        # Chat table definitions
docs/                   # Project documentation
  DEAD-CODE-TRIAGE.md   # Dead code audit report
  ARCHITECTURE.md       # System architecture
  API.md                # API endpoint reference
  SECURITY.md           # Security posture
  ROADMAP.md            # Prioritized roadmap
  CHANGELOG.md          # Change history
patches/                # Expo patch-package fixes
```

## API Endpoints

See [docs/API.md](docs/API.md) for full reference.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ai-providers` | Provider availability status |
| POST | `/api/generate-story` | Generate a complete story (JSON) |
| POST | `/api/generate-story-stream` | Generate story via SSE stream |
| POST | `/api/generate-avatar` | Generate hero avatar image |
| POST | `/api/generate-scene` | Generate story scene illustration |
| POST | `/api/tts` | Text-to-speech (returns audio URL) |
| GET | `/api/tts-audio/:file` | Serve cached TTS audio |
| POST | `/api/tts-preview` | Voice preview audio |
| GET | `/api/voices` | List available narrator voices |
| GET | `/api/music/:mode` | Serve background music |
| POST | `/api/suggest-settings` | AI-powered story setting suggestions |
| POST | `/api/generate-video` | Start video generation job |
| GET | `/api/video-status/:id` | Check video generation progress |
| GET | `/api/video/:id` | Serve generated video |
| GET | `/api/conversations` | List voice chat conversations |
| POST | `/api/conversations` | Create new conversation |
| POST | `/api/conversations/:id/messages` | Send voice message (SSE response) |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design and data flow
- [API Reference](docs/API.md) — All endpoints with request/response schemas
- [Security](docs/SECURITY.md) — Security posture and OWASP assessment
- [Roadmap](docs/ROADMAP.md) — Prioritized development roadmap
- [Changelog](docs/CHANGELOG.md) — Version history
- [Dead Code Triage](docs/DEAD-CODE-TRIAGE.md) — Code audit report

## License

Private project. All rights reserved.
