# Copilot Instructions — Infinite Heroes Bedtime Chronicles

## Project Overview

A cross-platform (iOS, Android, Web) AI-powered children's bedtime story app.
Kids pick a hero, customize story settings, and receive a fully narrated,
illustrated, interactive bedtime story with TTS audio, background music,
AI-generated images, and a gamification badge system.

**Target audience:** Children ages 3-9. All generated content MUST be child-safe.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile/Web | Expo SDK 54 + React Native + React 19 |
| Routing | Expo Router 6 (file-based, `app/` directory) |
| Backend | Express 5 on Node 22 |
| Database | PostgreSQL + Drizzle ORM |
| AI Text | Multi-provider router: Anthropic Claude, Google Gemini, OpenAI, OpenRouter |
| AI Images | Gemini 2.5-flash-image, DALL-E 3 |
| TTS | ElevenLabs (8 narrator voices) |
| Video | OpenAI Sora (optional) |
| State | React Context (SettingsContext, ProfileContext) + AsyncStorage |
| Server State | TanStack React Query 5 |
| Animations | react-native-reanimated 4 |
| Types | TypeScript 5.9 strict mode |

## Repository Layout

```
app/(tabs)/          # Tab screens: create, library, profile, saved, index
app/                 # Flow screens: story, completion, madlibs, sleep-setup, welcome
components/          # Reusable RN components (PascalCase.tsx)
constants/           # heroes.ts, colors.ts, types.ts, timing.ts
lib/                 # Client utilities: storage.ts, ProfileContext, SettingsContext, query-client
server/              # Express backend
server/routes.ts     # All REST API endpoints
server/ai/           # AIRouter + provider implementations (gemini, openai, anthropic, openrouter)
server/elevenlabs.ts # TTS voice definitions & speech generation
server/video.ts      # Sora video job management
shared/schema.ts     # Drizzle ORM database schema
docs/                # API.md, ARCHITECTURE.md, SECURITY.md, ROADMAP.md
```

## Coding Conventions

### General
- TypeScript strict mode — no `any` unless unavoidable; prefer explicit types.
- Named function exports for components: `export function HeroCard() {}`.
- Styles at module level via `StyleSheet.create()`, variable named `s` or `styles`.
- Use `Platform.OS` checks when behavior differs between web and native.
- Import paths use `@/` alias (maps to project root).

### React Native / Expo
- Haptic feedback (`expo-haptics`) on every interactive press.
- Safe area handling with `useSafeAreaInsets()`.
- Animations via `react-native-reanimated` (entering/exiting transitions, shared values).
- Gradients via `expo-linear-gradient`.
- Icons exclusively from `@expo/vector-icons` (Ionicons, MaterialCommunityIcons).
- Fonts: PlusJakartaSans (primary UI), Nunito (story text), Bangers (display).

### Server / API
- All API routes in `server/routes.ts` via `registerRoutes()`.
- Input sanitization: `sanitizeString(val, maxLen)` on every user-supplied field.
- Rate limiting: per-IP via `checkRateLimit(ip)`.
- AI calls go through `aiRouter.generateText()` / `aiRouter.generateImage()` — never call providers directly.
- TTS audio is disk-cached in `/tmp/tts-cache/` with 24-hour TTL.
- SSE streaming for long-running responses (story generation).

### API Request Pattern (Client)
```typescript
import { apiRequest } from "@/lib/query-client";
// apiRequest(method, route, body?) — handles base URL, JSON headers, error throwing
const res = await apiRequest("POST", "/api/generate-story", { heroName, ... });
const data = await res.json();
```

### State Management
- **App settings** — `useSettings()` from `SettingsContext`.
- **Child profiles** — `useProfile()` from `ProfileContext`.
- **Local persistence** — `lib/storage.ts` wrapping AsyncStorage (stories, badges, streaks, profiles).
- **Server data** — TanStack React Query with `staleTime: Infinity` (manual invalidation only).

## 8 Heroes (constants/heroes.ts)

Nova (Guardian of Light), Coral (Heart of the Ocean), Orion (Star of Friendship),
Luna (Dream Weaver), Nimbus (Brave Cloud), Bloom (Garden Keeper),
Whistle (Night Train Conductor), Shade (Shadow Friend).

Each has: `id`, `name`, `title`, `power`, `description`, `iconName`, `color`, `gradient`, `constellation`.

## 3 Story Modes

- **Classic** — Choose-your-own-adventure with branching choices.
- **Mad Libs** — Child fills in silly words that get woven into the story.
- **Sleep** — Zero-conflict guided meditation disguised as a story. No choices.

## Child Safety (CRITICAL)

All AI-generated content must follow these non-negotiable rules:
- NO violence, weapons, fighting, scary/dark/horror elements
- NO real-world brands, celebrities, copyrighted characters
- NO death, injury, illness, abandonment, bullying
- Every choice leads to a positive outcome — no failures
- Content must be 100% appropriate for ages 3-9
- Themes: courage, kindness, friendship, wonder, imagination, comfort

When writing prompts for AI generation, always include the `CHILD_SAFETY_RULES`
constant from `server/routes.ts`.

## Key API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/generate-story | Full story as JSON |
| POST | /api/generate-story-stream | Story via SSE |
| POST | /api/generate-avatar | Hero portrait (base64 data URI) |
| POST | /api/generate-scene | Story scene illustration |
| POST | /api/tts | Text-to-speech (returns audio URL) |
| POST | /api/tts-preview | Voice preview clip |
| POST | /api/suggest-settings | AI setting recommendations |
| GET | /api/music/:mode | Background music |
| GET | /api/voices | Available narrator voices |
| POST | /api/generate-video | Start Sora video job |
| GET | /api/video-status/:id | Poll video job |

## Environment Variables

At least one AI provider key is required:
- `AI_INTEGRATIONS_GEMINI_API_KEY` (primary)
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- `AI_INTEGRATIONS_OPENROUTER_API_KEY`

Optional: `ELEVENLABS_API_KEY`, `DATABASE_URL`, `OPENAI_API_KEY` (Sora).

## What NOT To Do

- Do not add `console.log` in production paths — use `if (__DEV__)` guard.
- Do not bypass the AIRouter and call providers directly.
- Do not hardcode API URLs — use `getApiUrl()` from `@/lib/query-client`.
- Do not skip input sanitization on any server endpoint.
- Do not introduce content that violates child safety rules.
- Do not add new dependencies without justification — the bundle is already large.
- Do not use `any` in new code — type everything explicitly.
- Do not add `@ts-ignore` — fix the type error instead.
