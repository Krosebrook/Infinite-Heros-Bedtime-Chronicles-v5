<!-- Last verified: 2026-03-26 -->
# BACKEND-API-AGENT.md — Express Server Expert

Specialized agent context for all work touching the Express.js backend: routes, middleware, server bootstrap, and API design.

---

## Domain Scope

This agent is authoritative for:
- `server/index.ts` — Server bootstrap, middleware stack, graceful shutdown
- `server/routes.ts` — All API route handlers (~33KB, 30+ endpoints)
- `server/storage.ts` — In-memory MemStorage for users (not the client storage)
- `server/db.ts` — Drizzle ORM client
- `server/elevenlabs.ts` — TTS voice generation
- `server/suno.ts` — Background music serving
- `server/video.ts` — Sora video generation
- `server/replit_integrations/` — Audio, chat, image, batch modules

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | Express.js v5 |
| Runtime | Node.js 18+ |
| Language | TypeScript (strict) |
| Validation | Zod v3 |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Build | esbuild → `server_dist/index.js` (ESM format) |

---

## Server Bootstrap Order (`server/index.ts`)

The middleware stack is applied in this exact order — do not reorder:

1. Environment validation (warns on missing providers)
2. Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`)
3. CORS — restricted to Replit domains + localhost; methods: `GET/POST/PUT/DELETE/OPTIONS`
4. Body parsing — JSON + URL-encoded, **100KB limit**
5. Request logging
6. Expo manifest routing (dev server integration)
7. Static file serving
8. Route registration (`registerRoutes`)
9. Global error handler (sanitizes messages, never leaks stack traces)

---

## Route Design Pattern

```typescript
// Standard pattern for a new route in server/routes.ts
app.post('/api/my-endpoint', rateLimiter, async (req, res) => {
  const schema = z.object({
    heroName: z.string().min(1).max(100),
    userInput: z.string().max(500),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const { heroName, userInput } = result.data;

  // ALWAYS sanitize strings before AI prompt inclusion
  const safeHeroName = sanitizeString(heroName);
  const safeInput = sanitizeString(userInput);

  try {
    const output = await someLogic(safeHeroName, safeInput);
    return res.json({ result: output });
  } catch (err) {
    const message = sanitizeErrorMessage(err);
    return res.status(500).json({ error: message });
  }
});
```

### Rules for New Endpoints
1. **Validate input** with Zod — define schema inline or in `shared/schema.ts`.
2. **Sanitize** all user string fields with `sanitizeString()` before AI prompt use.
3. **Apply rate limiter** to all POST endpoints that call external APIs.
4. **Return JSON** — always use `res.json({ ... })`.
5. **Error messages** — always use `sanitizeErrorMessage()`, never return raw errors.
6. **Document** in `docs/API.md` with method, path, body, response, and error shapes.

---

## Rate Limiting

Rate limiter is a per-IP sliding window, configured via environment variables:

```
RATE_LIMIT_WINDOW_MS=60000   # default 60 seconds
RATE_LIMIT_MAX=10            # default 10 requests per window
```

Apply to new POST endpoints:
```typescript
app.post('/api/new-endpoint', rateLimiter, async (req, res) => { ... });
```

**Never** create endpoints that bypass the rate limiter.

---

## CORS Configuration

CORS is restricted to:
- Replit domains (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` env vars)
- `localhost` (all ports)

**Never** add wildcard CORS (`*`). Changes to CORS config require human review.

---

## Input Sanitization

```typescript
// sanitizeString() — strips potentially unsafe characters, truncates to max length
// Default max: 500 chars. Higher limits for specific fields (e.g., sceneText: 2000 chars)
const safeText = sanitizeString(req.body.text);
const safeLongText = sanitizeString(req.body.sceneText, 2000);
```

---

## Error Handling

```typescript
// Global error handler in server/index.ts — never return raw errors
// sanitizeErrorMessage() strips newlines, truncates to 200 chars
try {
  // ... logic
} catch (err) {
  const message = sanitizeErrorMessage(err);
  return res.status(500).json({ error: message });
}
```

HTTP status codes:
- `400` — bad input (Zod validation failure)
- `404` — resource not found
- `429` — rate limit exceeded
- `500` — unexpected server error

---

## Conditional Route Registration

Voice chat routes are only registered when required env vars are present:

```typescript
// Voice chat — requires database + OpenAI connector
if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
    process.env.DATABASE_URL) {
  registerConversationRoutes(app);
}
```

---

## API Endpoint Reference (Key Endpoints)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/ai-providers` | Provider availability status |
| `POST` | `/api/generate-story` | Synchronous story generation |
| `POST` | `/api/generate-story-stream` | Streaming story generation (SSE) |
| `POST` | `/api/generate-avatar` | Hero portrait image |
| `POST` | `/api/generate-scene` | Story scene illustration |
| `POST` | `/api/suggest-settings` | AI story recommendations |
| `POST` | `/api/tts` | Generate TTS narration (max 5000 chars) |
| `GET` | `/api/tts-audio/:file` | Retrieve cached TTS audio |
| `POST` | `/api/tts-preview` | Voice preview |
| `GET` | `/api/voices` | Available narrator voices |
| `GET` | `/api/music/:mode` | Background music track |
| `POST` | `/api/generate-video` | Sora 2 video generation |
| `GET` | `/api/video-status/:id` | Video job status |
| `GET` | `/api/video/:id` | Retrieve generated video |

Full reference: `docs/API.md`

---

## TTS File Security

TTS audio files are cached in `/tmp/tts-cache`. Filename validation is **mandatory**:

```typescript
// Only files matching this pattern are served — do NOT relax this regex
const TTS_FILENAME_REGEX = /^[a-f0-9]+\.mp3$/;
if (!TTS_FILENAME_REGEX.test(filename)) {
  return res.status(400).json({ error: 'Invalid filename' });
}
```

---

## Video ID Validation

```typescript
// Only hex IDs accepted
const VIDEO_ID_REGEX = /^[a-f0-9]+$/;
if (!VIDEO_ID_REGEX.test(videoId)) {
  return res.status(400).json({ error: 'Invalid video ID' });
}
```

---

## Environment Variables

```
PORT=5000                    # Default
NODE_ENV=development|production
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=10
TTS_CACHE_MAX_AGE_MS=86400000  # 24 hours
REPLIT_DEV_DOMAIN=           # Auto-set by Replit
REPLIT_DOMAINS=              # Auto-set by Replit
```

Full list: `.env.example`

---

## Build & Run

```bash
npm run server:dev           # tsx server/index.ts (hot reload)
npm run server:build         # esbuild → server_dist/index.js (ESM)
npm run server:prod          # NODE_ENV=production node server_dist/index.js
```

Server binds to `0.0.0.0:5000` with `reusePort: true`.

---

## What This Agent Must Flag for Human Review

- Changes to CORS configuration
- Changes to rate limiting parameters or bypass logic
- Changes to TTS filename or video ID validation regex
- New `EXPO_PUBLIC_*` env vars (client-visible keys)
- Any authentication/authorization additions
- Changes to `server/index.ts` middleware order

---

## Related Agent Files

- [`AI-INTEGRATION-AGENT.md`](./AI-INTEGRATION-AGENT.md) — AI provider routing
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Child safety, sanitization
- [`DATABASE-AGENT.md`](./DATABASE-AGENT.md) — Drizzle ORM, schema
- [`AUDIO-TTS-AGENT.md`](./AUDIO-TTS-AGENT.md) — ElevenLabs TTS system
