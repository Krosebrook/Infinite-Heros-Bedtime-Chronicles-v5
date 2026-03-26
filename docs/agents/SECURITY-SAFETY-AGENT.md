<!-- Last verified: 2026-03-26 -->
# SECURITY-SAFETY-AGENT.md — Security & Child Safety Expert

Specialized agent context for all work touching application security, child safety enforcement, input sanitization, and access controls.

---

## Domain Scope

This agent is authoritative for:
- `CHILD_SAFETY_RULES` constant and its enforcement in every AI prompt
- Input sanitization (`sanitizeString()`, `sanitizeErrorMessage()`)
- Rate limiting middleware configuration
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- CORS configuration
- TTS filename and video ID validation
- Firebase authentication (`lib/AuthContext.tsx`)
- Parent controls (`components/ParentControlsModal.tsx`)
- PIN protection logic

---

## Non-Negotiable Rules

These rules can **never** be bypassed, relaxed, or removed:

1. **No API keys on the client.** All provider keys are server-side env vars only. Never add `EXPO_PUBLIC_AI_*` or similar.
2. **`sanitizeString()` is mandatory** for all user-provided strings before AI prompt inclusion.
3. **`CHILD_SAFETY_RULES` must be in every story generation system prompt.** Never omit it.
4. **`sanitizeErrorMessage()` is mandatory** in all error responses. Never return raw errors, `err.message`, or stack traces to clients.
5. **Rate limiting applies to all POST endpoints.** Never create endpoints that bypass the rate limiter.
6. **TTS filenames must match `/^[a-f0-9]+\.mp3$/`** before serving. Do not relax this regex.
7. **Video IDs must match `/^[a-f0-9]+$/`** before processing.
8. **CORS is restricted** to Replit domains + localhost. Never add wildcards.

---

## Child Safety Rules (Content Policy)

The `CHILD_SAFETY_RULES` constant enforces these content restrictions in all AI story prompts:

### Prohibited Content
- Violence, weapons, fighting, or scary/horror elements
- Real-world brands, celebrities, or copyrighted characters
- Death, injury, illness, abandonment, or loss
- Bullying, exclusion, meanness, or anxiety-inducing language
- Negative outcomes — all choices must lead to positive resolutions
- Dark themes, moral ambiguity, or adult concepts

### Required Content Tone
- Courage, kindness, friendship, wonder, imagination, comfort
- Age-appropriate vocabulary (calibrated to `ageRange` setting: `2-4`, `4-6`, `6-8`, `8-10`)
- Positive resolution for all story branches
- Gentle, calming language for Sleep mode stories

### Enforcement in Code
```typescript
// server/routes.ts — ALWAYS prepend to every story system prompt
const systemPrompt = `${CHILD_SAFETY_RULES}
${STORY_SYSTEM_PROMPT}`;
```

If you ever see a prompt that omits `CHILD_SAFETY_RULES`, that is a **bug** — fix it and flag for review.

---

## Input Sanitization

### `sanitizeString(input, maxLength?)`

Strips potentially unsafe characters, normalizes whitespace, and truncates. Default `maxLength` is 500.

```typescript
// Standard fields (500 char limit)
const safeName = sanitizeString(heroName);
const safeTheme = sanitizeString(theme);

// Scene description (higher limit — explicitly set)
const safeScene = sanitizeString(sceneText, 2000);
```

**When to use:** Before any user string is:
- Embedded in an AI prompt
- Logged (to avoid log injection)
- Stored (defensive against injection at rest)

### `sanitizeErrorMessage(err)`

Converts any `Error` or unknown value to a safe, truncated string (strips newlines, max 200 chars).

```typescript
try {
  await riskyOperation();
} catch (err) {
  return res.status(500).json({ error: sanitizeErrorMessage(err) });
}
```

**Never** return `err.message`, `err.stack`, or a raw error object to the client.

---

## Security Headers

Applied by `server/index.ts` middleware before all routes:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |

Do not remove or downgrade these headers.

---

## CORS Configuration

```typescript
// Allowed origins — server/index.ts
const allowedOrigins = [
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.repl\.co$/,
  /^https?:\/\/localhost(:\d+)?$/,
];
```

**Never** add `*` as an allowed origin. Changes to this list require human review.

---

## Rate Limiting

Per-IP sliding window rate limiter applied to all POST endpoints:

```typescript
app.post('/api/any-endpoint', rateLimiter, async (req, res) => { ... });
```

Environment configuration:
```
RATE_LIMIT_WINDOW_MS=60000   # 1 minute window
RATE_LIMIT_MAX=10            # 10 requests per window per IP
```

Changes to these parameters require human review.

---

## TTS File Serving Security

TTS cache is in `/tmp/tts-cache`. Files are named by hex hash to prevent path traversal.

```typescript
// Route: GET /api/tts-audio/:file
const filename = req.params.file;

// Validation — NEVER relax this
if (!/^[a-f0-9]+\.mp3$/.test(filename)) {
  return res.status(400).json({ error: 'Invalid filename' });
}

const filePath = path.join(TTS_CACHE_DIR, filename);
// Use path.resolve + startsWith check to prevent directory traversal
if (!path.resolve(filePath).startsWith(path.resolve(TTS_CACHE_DIR))) {
  return res.status(400).json({ error: 'Invalid path' });
}
```

---

## Parent Controls

Parent controls are PIN-protected. The PIN is stored hashed in AsyncStorage via `lib/storage.ts`.

- `components/ParentControlsModal.tsx` — UI for parent control management
- PIN verification must happen server-side for any sensitive operation
- Parent controls settings key: `@infinity_heroes_parent_controls`

---

## Firebase Authentication

Anonymous Firebase auth is used for request attribution. Auth context is in `lib/AuthContext.tsx`.

- Token validation happens server-side via Firebase Admin SDK
- Never trust client-provided user IDs without server-side token verification
- Auth is currently anonymous — full auth additions require human review

---

## Security Audit Reference

Full OWASP assessment: `docs/SECURITY.md`

Key areas covered:
- A01 Broken Access Control — parent PIN, rate limiting
- A03 Injection — `sanitizeString()` on all AI inputs
- A05 Security Misconfiguration — headers, CORS, no debug in production
- A06 Vulnerable Components — `npm audit` via patch-package
- A09 Security Logging — request logging without sensitive data

---

## What This Agent Must Flag for Human Review

- ANY change to `CHILD_SAFETY_RULES` content or its placement in prompts
- Changes to CORS allowed origins
- Changes to rate limiter parameters or enforcement points
- Changes to TTS filename or video ID validation regex
- New `EXPO_PUBLIC_*` environment variables
- Any authentication or authorization logic changes
- Changes to PIN storage or verification logic
- Dependency updates that affect security-critical packages

---

## Related Agent Files

- [`AI-INTEGRATION-AGENT.md`](./AI-INTEGRATION-AGENT.md) — AI provider routing and prompt safety
- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — Route patterns, error handling
- [`STORY-GENERATION-AGENT.md`](./STORY-GENERATION-AGENT.md) — Story content safety
