# Security Best Practices

> **Infinity Heroes: Bedtime Chronicles v5** -- Comprehensive Security Guide

---

## Quick Reference

| Rule | Priority | File |
|------|----------|------|
| Every AI call MUST include `CHILD_SAFETY_RULES` in the system prompt | CRITICAL | `server/routes.ts` |
| Every voice chat call MUST include `VOICE_CHAT_SAFETY_PROMPT` | CRITICAL | `server/replit_integrations/audio/routes.ts` |
| All POST `/api/*` and all `/api/conversations/*` routes require `requireAuth` | CRITICAL | `server/routes.ts`, `server/replit_integrations/audio/routes.ts` |
| Sanitize ALL user strings with `sanitizeString(val, maxLen)` before AI prompt inclusion | CRITICAL | `server/routes.ts` |
| Never expose stack traces, SQL details, or internal paths in error responses | HIGH | `server/index.ts` |
| Validate mode/duration against whitelists, not arbitrary user input | HIGH | `server/routes.ts` |
| PIN hashed with SHA-256 + random salt; 5-attempt lockout | HIGH | `lib/storage.ts` |
| Dual-layer rate limiting on all generation endpoints | HIGH | `server/routes.ts` |
| TTS/video filenames validated with regex to prevent path traversal | MEDIUM | `server/routes.ts` |
| API keys live server-side only via `process.env` | CRITICAL | `server/index.ts`, `server/video.ts` |

---

## 1. Authentication

### Firebase Auth Flow

Authentication is implemented in `server/auth.ts`. The `requireAuth` middleware validates a Firebase ID token from the `Authorization` header and attaches decoded user info to `req.user`.

```typescript
// server/auth.ts — Token extraction pattern
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Authentication required' });
}

const token = authHeader.slice(7);
const decoded = await auth.verifyIdToken(token);
req.user = {
  uid: decoded.uid,
  isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
};
```

### Production Guard

In production, if `FIREBASE_SERVICE_ACCOUNT_KEY` is not configured, **all requests are rejected** with a 503 unless `AUTH_DISABLED` is explicitly set:

```typescript
// server/auth.ts — Production safety net
if (!auth) {
  if (process.env.NODE_ENV === 'production' && !process.env.AUTH_DISABLED) {
    console.error('[Auth] CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set in production. Rejecting request.');
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  // Development mode only: allow with warning
  req.user = { uid: req.ip || 'anonymous', isAnonymous: true };
  return next();
}
```

### Auth Applied to Routes

`requireAuth` is applied as blanket middleware to all POST `/api/*` endpoints and individually to all `/api/conversations/*` routes (GET, POST, DELETE):

```typescript
// server/routes.ts — Blanket auth for all POST /api/*
app.use('/api', async (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireAuth(req, res, next);
});

// server/replit_integrations/audio/routes.ts — Per-route auth on conversations
app.get("/api/conversations", requireAuth, async (req, res) => { ... });
app.get("/api/conversations/:id", requireAuth, async (req, res) => { ... });
app.post("/api/conversations", requireAuth, async (req, res) => { ... });
app.delete("/api/conversations/:id", requireAuth, async (req, res) => { ... });
app.post("/api/conversations/:id/messages", requireAuth, audioBodyParser, async (req, res) => { ... });
```

### DO / DON'T

| DO | DON'T |
|----|-------|
| Always include `requireAuth` on new endpoints that mutate data | Skip auth on any POST endpoint |
| Use `req.user?.uid` for user identification | Trust client-supplied user IDs |
| Set `FIREBASE_SERVICE_ACCOUNT_KEY` in production | Deploy production without auth configured |
| Use `AUTH_DISABLED=true` only for explicit dev bypass | Leave auth silently disabled in production |

---

## 2. Input Validation & Sanitization

### `sanitizeString(val, maxLen)`

Every user-provided string MUST be sanitized before inclusion in an AI prompt or any processing logic. This function truncates to a maximum length and trims whitespace:

```typescript
// server/routes.ts
function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen).trim();
}
```

**Usage in story generation:**

```typescript
const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);  // 500 chars
const heroTitle = sanitizeString(req.body.heroTitle, MAX_INPUT_STRING_LENGTH);
const heroPower = sanitizeString(req.body.heroPower, MAX_INPUT_STRING_LENGTH);
const duration = sanitizeString(req.body.duration, 20);
const mode = sanitizeString(req.body.mode, 20);
const soundscape = sanitizeString(req.body.soundscape, 30) || undefined;
const childName = sanitizeString(req.body.childName, 50) || undefined;
```

### `validateMadlibWords()`

Validates the Mad Libs word dictionary with strict limits to prevent abuse:

```typescript
// server/routes.ts
function validateMadlibWords(input: unknown): Record<string, string> | undefined {
  if (input == null) return undefined;
  if (typeof input !== 'object' || Array.isArray(input)) return undefined;
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > 20) return undefined;           // Max 20 key/value pairs
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (typeof key !== 'string' || key.length > 100) continue;  // Max 100-char keys
    const val = obj[key];
    if (typeof val !== 'string') continue;
    result[key.slice(0, 100)] = String(val).slice(0, 100);      // Max 100-char values
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
```

### VALID_MODES and VALID_DURATIONS Whitelisting

User-supplied mode and duration values are validated against explicit whitelists. Invalid values fall back to safe defaults:

```typescript
// server/routes.ts
const VALID_MODES = ["classic", "madlibs", "sleep"];
const VALID_DURATIONS = ["short", "medium-short", "medium", "long", "epic"];

// Usage — never trust raw input
const storyMode = VALID_MODES.includes(mode) ? mode : "classic";
const storyDuration = VALID_DURATIONS.includes(duration) ? duration : "medium";
```

### `sanitizeErrorMessage()`

Error responses MUST never leak internal details. The global error handler strips stack traces:

```typescript
// server/index.ts
function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message.replace(/\n.*/gs, '').slice(0, 200);
  }
  return 'Internal Server Error';
}
```

### `parseConversationId()`

All conversation ID parameters are validated to reject NaN, negative, and zero values:

```typescript
// server/replit_integrations/audio/routes.ts
function parseConversationId(req: Request, res: Response): number | null {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idParam, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return null;
  }
  return id;
}
```

### Zod Schema Validation

Database insert schemas are generated from Drizzle table definitions using `drizzle-zod`:

```typescript
// shared/models/chat.ts
import { createInsertSchema } from "drizzle-zod";

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
```

### DO / DON'T

| DO | DON'T |
|----|-------|
| `sanitizeString(req.body.heroName, 500)` | `req.body.heroName` directly in a prompt |
| `VALID_MODES.includes(mode) ? mode : "classic"` | `const mode = req.body.mode` without validation |
| `parseConversationId()` with NaN/negative checks | `parseInt(req.params.id)` without validation |
| `sanitizeErrorMessage(err)` in error responses | `res.json({ error: err.message, stack: err.stack })` |
| Use Zod schemas for database input validation | Insert raw request bodies into the database |

---

## 3. Child Safety

### CHILD_SAFETY_RULES System Prompt

This constant MUST be included in every story generation call. It is the primary content safety guardrail:

```typescript
// server/routes.ts
const CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind
- NEVER include scary, frightening, dark, or horror elements — no monsters, villains, or threats
- NEVER reference real-world brands, products, celebrities, or copyrighted characters
- NEVER include death, injury, illness, abandonment, or loss themes
- NEVER include bullying, meanness, exclusion, or unkind behavior that isn't immediately resolved
- NEVER use language that could cause anxiety, fear, or nightmares
- Every choice the hero makes leads to a positive, heroic, or interesting outcome — there are no failures
- Keep all content 100% appropriate for children ages 3-9
- Focus on themes of courage, kindness, friendship, wonder, imagination, and comfort
- All conflicts should be gentle (e.g., solving puzzles, helping friends, finding lost items) and resolve peacefully`;
```

**Inclusion in the story system prompt:**

```typescript
// server/routes.ts — getStorySystemPrompt()
return `${modeRules}

${CHILD_SAFETY_RULES}

You MUST respond with valid JSON matching this exact structure: ...`;
```

### VOICE_CHAT_SAFETY_PROMPT

A separate safety prompt for voice chat interactions, applied at the system level:

```typescript
// server/replit_integrations/audio/routes.ts
const VOICE_CHAT_SAFETY_PROMPT = `You are a friendly, gentle storytelling companion for children ages 3-9.
CRITICAL RULES:
- NEVER discuss violence, weapons, scary topics, or anything inappropriate for young children
- NEVER reference real brands, celebrities, or copyrighted characters
- Keep all responses warm, encouraging, and age-appropriate
- If a child asks about something inappropriate, gently redirect to a fun, safe topic
- Use simple vocabulary appropriate for young children
- Be encouraging and positive in all interactions`;
```

### 20-Message History Cap

Voice chat history is capped at 20 messages to prevent unbounded token usage and keep the safety prompt effective:

```typescript
// server/replit_integrations/audio/routes.ts
const messagesWithSafety = [
  { role: "system" as const, content: VOICE_CHAT_SAFETY_PROMPT },
  ...chatHistory.slice(-20), // Cap at 20 messages to prevent unbounded token usage
];
```

### Content Themes Controlled by Parent Settings

Parents can restrict which story themes are available via the `allowedThemes` field:

```typescript
// constants/types.ts
export interface ParentControls {
  allowedThemes: string[];  // e.g., ['courage', 'kindness', 'friendship', 'wonder', 'imagination', 'comfort']
  // ...
}
```

### DO / DON'T

| DO | DON'T |
|----|-------|
| Include `CHILD_SAFETY_RULES` in EVERY story generation system prompt | Add a new story endpoint without the safety rules |
| Include `VOICE_CHAT_SAFETY_PROMPT` in EVERY voice chat call | Skip the safety prompt for "performance optimization" |
| Cap voice chat history at 20 messages | Allow unbounded conversation history |
| Use age-appropriate vocabulary (ages 3-9) | Use complex or mature language in AI prompts |
| Ensure all story conflicts resolve peacefully | Allow negative outcomes, failure states, or scary elements |

---

## 4. Rate Limiting

### Dual-Layer Rate Limiting

The application implements two independent rate limiting layers:

**Layer 1: IP-based (broad) -- 10 requests per minute**

```typescript
// server/routes.ts
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10", 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}
```

**Layer 2: User-based (stricter) -- 5 requests per minute via Firebase UID**

```typescript
// server/routes.ts
const USER_RATE_LIMIT_MAX = 5;

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimitMap.set(userId, { count: 1, resetAt: now + USER_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= USER_RATE_LIMIT_MAX;
}
```

**Both layers applied to generation endpoints:**

```typescript
// server/routes.ts — /api/generate-story
const clientIp = req.ip || req.socket.remoteAddress || "unknown";
const userId = req.user?.uid || clientIp;

// Layer 1: IP-based rate limit (broad)
if (!checkRateLimit(clientIp)) {
  return res.status(429).json({ error: "Too many requests. Please wait a moment." });
}
// Layer 2: User-based rate limit (stricter, survives serverless better with stable UIDs)
if (!checkUserRateLimit(userId)) {
  return res.status(429).json({ error: "Too many requests. Please wait a moment." });
}
```

### Serverless Detection

The in-memory rate limiter has limited effectiveness in serverless environments (each cold start gets a fresh map). A warning is logged:

```typescript
// server/routes.ts
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER);
if (IS_SERVERLESS) {
  console.warn('[RateLimit] Running in serverless environment — in-memory rate limiter has limited effectiveness. Consider adding @upstash/ratelimit for distributed rate limiting.');
}
```

### vercel.json Rate Limit Headers

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-RateLimit-Limit", "value": "60" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### Production Recommendation

For production deployments on Vercel, replace or supplement the in-memory rate limiter with **Upstash Redis** (`@upstash/ratelimit`) for distributed, persistent rate limiting that survives cold starts.

### DO / DON'T

| DO | DON'T |
|----|-------|
| Apply both IP and user rate limits to all AI generation endpoints | Add a generation endpoint without rate limiting |
| Use `req.user?.uid` for the user-based limit | Rely solely on IP-based limiting (easily bypassed) |
| Plan migration to Upstash Redis for production | Assume in-memory maps persist across serverless invocations |
| Return 429 with a user-friendly message | Silently drop requests without informing the client |

---

## 5. Parent Controls Security

### PIN Hashing with SHA-256

PINs are never stored in plaintext. They are hashed with SHA-256 using `expo-crypto` with a random 16-byte salt:

```typescript
// lib/storage.ts
export async function hashPin(pin: string, salt: string): Promise<string> {
  const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, salt + pin);
}

export async function generatePinSalt(): Promise<string> {
  const { getRandomBytes } = await import('expo-crypto');
  const bytes = getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Data Model

```typescript
// constants/types.ts
export interface ParentControls {
  pinCode: string;        // Stores SHA-256 hash, not plaintext
  pinSalt: string;        // Random salt for PIN hashing
  failedAttempts: number;  // Brute-force counter
  lockoutUntil: number;    // Timestamp when lockout expires (0 = not locked)
  // ...
}
```

### Brute-Force Protection

5 failed attempts trigger a 30-second lockout:

```typescript
// lib/storage.ts
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

export function isPinLockedOut(controls: ParentControls): boolean {
  if (controls.lockoutUntil === 0) return false;
  return Date.now() < controls.lockoutUntil;
}

export async function recordFailedPinAttempt(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls };
  updated.failedAttempts = (updated.failedAttempts || 0) + 1;
  if (updated.failedAttempts >= MAX_PIN_ATTEMPTS) {
    updated.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    updated.failedAttempts = 0; // Reset counter after lockout
  }
  await saveParentControls(updated);
  return updated;
}

export async function resetPinAttempts(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls, failedAttempts: 0, lockoutUntil: 0 };
  await saveParentControls(updated);
  return updated;
}
```

### PIN Data Cleared on Removal

When a parent removes the PIN, all related data is wiped:

```typescript
// constants/types.ts — DEFAULT_PARENT_CONTROLS
{
  pinCode: '',
  pinSalt: '',
  failedAttempts: 0,
  lockoutUntil: 0,
}
```

### Known Limitation

> **TODO:** Parent controls enforcement is currently client-side only. A determined user could bypass PIN checks by modifying the app. Server-side PIN validation should be added for robust enforcement.

### DO / DON'T

| DO | DON'T |
|----|-------|
| Hash PINs with `hashPin(pin, salt)` before storing | Store plaintext PINs |
| Generate a unique salt per PIN with `generatePinSalt()` | Reuse salts or use a fixed salt |
| Check `isPinLockedOut()` before every PIN verification | Allow unlimited PIN attempts |
| Clear all PIN data (hash, salt, attempts, lockout) on removal | Leave stale PIN data after removal |

---

## 6. Data Protection

### No Child PII Server-Side

Stories are generated via stateless API calls. No child names, profiles, or personal information is persisted on the server. All personalization data stays on-device via `AsyncStorage`.

### API Keys Server-Side Only

All API keys are accessed exclusively through `process.env` on the server:

```typescript
// server/video.ts
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
```

```typescript
// server/auth.ts
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
```

**Never bundle API keys in client code or commit them to version control.**

### CORS Restricted to Known Origins

CORS is locked to specific domains, Vercel preview URLs, and development localhost ports:

```typescript
// server/index.ts — setupCors()
origins.add("https://bedtime-chronicles.com");
origins.add("https://www.bedtime-chronicles.com");

if (process.env.VERCEL_URL) {
  origins.add(`https://${process.env.VERCEL_URL}`);
}

// Allow Vercel preview URLs (*.vercel.app)
const isVercelPreview = origin ? /\.vercel\.app$/.test(new URL(origin).hostname) : false;

const ALLOWED_LOCAL_PORTS = [5000, 8081, 19000, 19001, 19002, 19003, 19004, 19005, 19006];
```

### Security Headers

Applied globally to every response:

```typescript
// server/index.ts — setupSecurityHeaders()
res.setHeader("X-Content-Type-Options", "nosniff");
res.setHeader("X-Frame-Options", "DENY");
res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
res.setHeader("X-XSS-Protection", "1; mode=block");
res.setHeader("Content-Security-Policy", "default-src 'self'; ...");
res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
```

### TTS/Video Filename Regex Validation

File-serving endpoints validate filenames with strict regex patterns to prevent path traversal attacks:

```typescript
// server/routes.ts — TTS audio serving
app.get("/api/tts-audio/:file", (req, res) => {
  const fileName = req.params.file;
  if (!fileName || !/^[a-f0-9]+\.mp3$/.test(fileName)) {
    return res.status(400).json({ error: "Invalid file name" });
  }

  const filePath = path.join(TTS_CACHE_DIR, fileName);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(TTS_CACHE_DIR)) {
    return res.status(400).json({ error: "Invalid file path" });
  }
  // ...
});

// server/routes.ts — Video serving
app.get("/api/video/:id", (req, res) => {
  const jobId = req.params.id;
  if (!jobId || !/^[a-f0-9]+$/.test(jobId)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }
  // ...
});
```

### Body Size Limits

Request body size is capped to mitigate denial-of-service:

```typescript
// server/index.ts
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// server/replit_integrations/audio/routes.ts — Audio payloads (larger)
const audioBodyParser = express.json({ limit: "10mb" });
```

### DO / DON'T

| DO | DON'T |
|----|-------|
| Access API keys via `process.env` on the server | Embed API keys in client bundles or source code |
| Validate filenames with regex before serving | Use `req.params` directly in `path.join()` |
| Double-check resolved paths with `path.resolve().startsWith()` | Trust user input for file paths |
| Set CORS to known origins only | Use `Access-Control-Allow-Origin: *` |
| Set security headers on every response | Forget HSTS, X-Frame-Options, or CSP |
| Limit request body size (`100kb` default, `10mb` for audio) | Accept unlimited body sizes |

---

## 7. API Security Checklist

### New Endpoint Checklist

Every new API endpoint MUST satisfy all items in this checklist before merging:

| # | Requirement | How |
|---|-------------|-----|
| 1 | **Authentication** | Apply `requireAuth` middleware (automatic for POST via blanket middleware, explicit for GET) |
| 2 | **Input validation** | Validate request body with Zod schemas where applicable |
| 3 | **String sanitization** | Use `sanitizeString(val, maxLen)` on every user-provided string |
| 4 | **Whitelist validation** | Check enum values against whitelists (`VALID_MODES`, `VALID_DURATIONS`, etc.) |
| 5 | **Rate limiting** | Apply `checkRateLimit(clientIp)` and `checkUserRateLimit(userId)` on generation endpoints |
| 6 | **Error sanitization** | Return generic error messages; never leak internals |
| 7 | **Child safety** | If the endpoint generates AI content, include `CHILD_SAFETY_RULES` or `VOICE_CHAT_SAFETY_PROMPT` |
| 8 | **File path safety** | If serving files, validate filenames with regex and verify resolved paths |

### Never Expose

The following MUST never appear in API responses:

| Category | Examples |
|----------|----------|
| Stack traces | `err.stack`, full `Error` objects |
| SQL details | Query strings, table names, column names |
| Internal paths | Server filesystem paths, directory structures |
| Provider API keys | OpenAI, ElevenLabs, Firebase, Anthropic keys |
| System architecture | Provider fallback chains, internal routing logic |
| User data from other users | Other users' Firebase UIDs, conversation content |

### Example: Correct Error Handling Pattern

```typescript
// DO: Sanitized error response
app.post("/api/my-endpoint", async (req, res) => {
  try {
    // ... business logic
  } catch (error) {
    console.error("Error in my-endpoint:", error);  // Full error to server logs only
    res.status(500).json({ error: "Failed to process request" });  // Generic message to client
  }
});

// DON'T: Leaking internals
app.post("/api/my-endpoint", async (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({
      error: error.message,     // May contain SQL, paths, or API key info
      stack: error.stack,       // Full stack trace
      query: sqlQuery,          // SQL query text
    });
  }
});
```

### Example: Correct Endpoint Pattern

```typescript
app.post("/api/new-feature", async (req, res) => {
  // 1. Rate limiting (auth is automatic via blanket POST middleware)
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const userId = req.user?.uid || clientIp;
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  if (!checkUserRateLimit(userId)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  try {
    // 2. Sanitize all input
    const userInput = sanitizeString(req.body.userInput, MAX_INPUT_STRING_LENGTH);
    const mode = sanitizeString(req.body.mode, 20);

    // 3. Whitelist validation
    const validMode = VALID_MODES.includes(mode) ? mode : "classic";

    // 4. Required field check
    if (!userInput) {
      return res.status(400).json({ error: "Input is required" });
    }

    // 5. AI call with child safety rules
    const response = await aiRouter.generateText("story", {
      systemPrompt: `${CHILD_SAFETY_RULES}\n\nYour additional instructions here...`,
      userPrompt: userInput,
      temperature: 0.9,
      maxTokens: 4096,
    });

    // 6. Sanitized success response
    res.json({ result: response.text });
  } catch (error) {
    // 7. Sanitized error response
    console.error("New feature error:", error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: "Failed to process request" });
  }
});
```

---

## Appendix: Environment Variables (Security-Relevant)

| Variable | Purpose | Required in Production |
|----------|---------|----------------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK auth | Yes (or set `AUTH_DISABLED`) |
| `AUTH_DISABLED` | Explicitly bypass auth (NOT recommended for production) | No |
| `NODE_ENV` | Controls production guard behavior | Yes (`production`) |
| `OPENAI_API_KEY` | OpenAI API access (server-side only) | Optional |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (server-side only) | Optional |
| `AI_INTEGRATIONS_*_API_KEY` | Provider API keys (server-side only) | At least one |
| `RATE_LIMIT_MAX` | IP-based rate limit ceiling (default: 10) | Optional |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (default: 60000ms) | Optional |
