# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Expo App (Client)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Screens │ │Components│ │  Context  │ │Storage │ │
│  │ (Router) │ │          │ │(Settings)│ │(Async) │ │
│  └────┬─────┘ └──────────┘ └──────────┘ └────────┘ │
│       │ HTTP                                         │
└───────┼─────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────┐
│                  Express Server                       │
│  ┌──────────────────────────────────────────────┐   │
│  │              Security Layer                    │   │
│  │  Security Headers → CORS → Body Parser        │   │
│  │  → Rate Limiter → Request Logger              │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │              Route Handlers                    │   │
│  │  /api/generate-story    → AI Router            │   │
│  │  /api/generate-avatar   → AI Router (image)    │   │
│  │  /api/generate-scene    → AI Router (image)    │   │
│  │  /api/tts               → ElevenLabs           │   │
│  │  /api/suggest-settings  → AI Router            │   │
│  │  /api/generate-video    → OpenAI Sora           │   │
│  │  /api/conversations/*   → Voice Chat Module     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │              AI Router                         │   │
│  │  Gemini → OpenAI → Anthropic → OpenRouter     │   │
│  │  (automatic fallback on failure)               │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │ElevenLabs│ │OpenAI Sora│ │  PostgreSQL (DB)   │  │
│  │  (TTS)   │ │  (Video)  │ │ conversations/msgs │  │
│  └──────────┘ └───────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## AI Provider Routing

The AI Router (`server/ai/`) implements a priority-based fallback chain:

### Text Generation
1. **Gemini** (`gemini-2.5-flash`) — Primary, budget-tier
2. **OpenAI** (`gpt-4o-mini`) — First fallback
3. **Anthropic** (`claude-sonnet-4-6`) — Second fallback
4. **OpenRouter** — Third fallback, rotates between:
   - xAI Grok (`x-ai/grok-3-mini`)
   - Mistral (`mistralai/mistral-small-3.1-24b-instruct`)
   - Cohere (`cohere/command-a-03-2025`)
   - Meta Llama (`meta-llama/llama-4-scout-17b-16e-instruct`)

### Image Generation
1. **Gemini** (`gemini-2.5-flash-image`) — Primary
2. **OpenAI** (`gpt-image-1`) — Fallback

If the primary provider fails, the router automatically tries the next in the chain.

## Data Flow

### Story Generation Flow
```
User selects hero + mode + settings
  → Client POST /api/generate-story
    → Server validates & sanitizes input
    → Server builds system prompt (mode-specific) + user prompt
    → AI Router calls provider chain until success
    → Server parses JSON response, normalizes parts
    → Client receives story, begins playback
      → Per-part: optional scene image generation (POST /api/generate-scene)
      → Per-part: optional TTS narration (POST /api/tts)
    → On completion: save story + scenes to AsyncStorage
    → Award badges based on profile history
```

### Settings Architecture
```
SettingsContext (lib/SettingsContext.tsx)
  ├── AppSettings interface (canonical source of truth)
  ├── AsyncStorage key: @infinity_heroes_app_settings
  ├── Used by: SettingsModal.tsx, settings.tsx, story.tsx
  └── Legacy migration: reads @infinity_heroes_preferences on first load
```

## Client State Management

| Data | Storage | Mechanism |
|------|---------|-----------|
| App Settings | AsyncStorage (`@infinity_heroes_app_settings`) | React Context + Reducer |
| Stories | AsyncStorage (`@infinity_heroes_stories`) | Direct read/write |
| Child Profiles | AsyncStorage (`@infinity_heroes_profiles`) | Direct read/write |
| Badges | AsyncStorage (`@infinity_heroes_badges`) | Direct read/write |
| Streaks | AsyncStorage (`@infinity_heroes_streaks`) | Direct read/write |
| Parent Controls | AsyncStorage (`@infinity_heroes_parent_controls`) | Direct read/write |
| Favorites | AsyncStorage (`@infinity_heroes_favorites`) | Direct read/write |

## Server Architecture

### Middleware Stack (in order)
1. **Security Headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection
2. **CORS** — Dynamic origin matching (Replit domains + localhost)
3. **Body Parser** — JSON (100KB limit)
4. **Auth Middleware** — Firebase JWT validation (skipped in dev mode)
5. **Request Logger** — API request timing and response logging
6. **Route Handlers** — All /api/* endpoints
7. **Error Handler** — Sanitized error responses via `sanitizeErrorMessage()`

### Rate Limiting
- In-memory rate limiter, keyed by authenticated user UID (falls back to IP)
- Default: 10 requests per 60 seconds
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`
- Applied to all generation endpoints (story, avatar, scene, TTS, video, suggestions)

### TTS Caching
- Generated audio cached to `/tmp/tts-cache/` as MP3 files
- Cache key: MD5 of `voice:mode:text`
- Auto-cleanup of expired files every hour
- Configurable max age via `TTS_CACHE_MAX_AGE_MS` (default: 24h)

## Authentication Flow

1. App launches → `AuthProvider` in `app/_layout.tsx` initializes Firebase Auth
2. If no existing user, `signInAnonymously()` creates an anonymous Firebase user
3. `AuthBridge` component passes the token getter to `query-client.ts`
4. All API requests include `Authorization: Bearer <token>` header
5. Server middleware (`server/auth.ts`) validates the token via Firebase Admin SDK
6. Rate limiting keys on `req.user.uid` instead of IP address

## Voice Chat Module

When `AI_INTEGRATIONS_OPENAI_API_KEY` and `DATABASE_URL` are set:
- Conversation history stored in PostgreSQL (`conversations` + `messages` tables)
- Audio input: auto-format detection (WAV, MP3, WebM, MP4, OGG) with ffmpeg conversion
- Speech-to-text: OpenAI `gpt-4o-mini-transcribe`
- Voice response: OpenAI `gpt-audio` model with streaming audio output
- Response delivery: Server-Sent Events (SSE)
