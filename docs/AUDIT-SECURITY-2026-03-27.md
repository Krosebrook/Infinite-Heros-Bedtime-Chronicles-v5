# Security Audit Report — Infinity Heroes: Bedtime Chronicles v5

**Date:** 2026-03-27 | **Auditor:** Security Engineer (AI Agent)

---

## CRITICAL

### CRIT-1: Authentication Completely Bypassed in Development Mode
**File:** `server/auth.ts:53-59`
When `FIREBASE_SERVICE_ACCOUNT_KEY` is not set, `requireAuth` silently assigns `req.user = { uid: req.ip, isAnonymous: true }` and calls `next()` — granting full unauthenticated access. No enforcement prevents this from reaching production.
**Fix:** Add startup check: exit with error if key missing in `NODE_ENV=production`.

### CRIT-2: Voice Chat Endpoints Completely Unauthenticated
**Files:** `server/replit_integrations/audio/routes.ts`, `server/replit_integrations/chat/routes.ts`
All `/api/conversations` endpoints bypass `requireAuth`. An attacker can POST unlimited 50MB audio blobs, exhaust OpenAI budget, read all conversation history, and DELETE any conversation.
**Fix:** Apply `requireAuth` and `checkRateLimit` to all chat/audio routes.

### CRIT-3: IDOR — Conversation IDs Are Sequential Integers with No Ownership Check
**Files:** `server/replit_integrations/audio/routes.ts:21-35`, `chat/routes.ts:22-59`
`parseInt(req.params.id)` — no check that the authenticated user owns the conversation. Any user can read/post/delete any conversation by incrementing the ID. **COPPA-level PII exposure risk** for children's voice transcripts.
**Fix:** Store `userId` on conversation, verify ownership on every operation.

### CRIT-4: Parent PIN Stored in Plaintext, No Brute-Force Protection
**Files:** `components/ParentControlsModal.tsx:59-66`, `lib/storage.ts:337-348`
PIN stored as plaintext in AsyncStorage. Direct string comparison. No attempt throttling — 10,000 combinations brute-forceable in milliseconds.
**Fix:** Hash with `expo-crypto` SHA-256 + salt. Add lockout after 5 failed attempts.

## HIGH

### HIGH-1: CSP Contains `'unsafe-inline'` for Scripts
**File:** `server/index.ts:65` — Nullifies XSS protection.

### HIGH-2: Any `*.vercel.app` Subdomain Allowed for Credentialed CORS
**File:** `server/index.ts:108-112` — Any Vercel deployment can make authenticated cross-origin requests.

### HIGH-3: 50MB Unauthenticated Body Parser — DoS Vector
**File:** `server/replit_integrations/audio/routes.ts:6` — Overrides 100KB global limit with no auth/rate limiting.

### HIGH-4: Prompt Injection via Child Name and Hero Fields
**File:** `server/routes.ts:262-263` — `childName`, `heroName`, etc. injected verbatim into AI prompts. A crafted value can override `CHILD_SAFETY_RULES`.

### HIGH-5: Voice Chat Has Zero Child Safety Guardrails
**Files:** `audio/routes.ts:86-91`, `chat/routes.ts:72-77` — Full conversation sent to GPT-4o with no `CHILD_SAFETY_RULES` system prompt.

### HIGH-6: `sanitizeString` Only Truncates — No HTML Stripping
**File:** `server/routes.ts:71-74` — Vulnerable to stored XSS if content is ever rendered as HTML.

## MEDIUM

| ID | Issue | File |
|----|-------|------|
| MED-1 | In-memory rate limiter ineffective on serverless | `routes.ts:49` |
| MED-2 | `getVideoFilePath` lacks path traversal guard | `video.ts:171` |
| MED-3 | MD5 used for TTS cache keys | `routes.ts:558` |
| MED-4 | HSTS header sent over HTTP in dev | `index.ts:66` |
| MED-5 | Parent controls enforced client-side only | `ParentControlsModal.tsx` |
| MED-6 | `parseInt(NaN)` not validated before DB call | `chat/routes.ts:25` |

## LOW

| ID | Issue | File |
|----|-------|------|
| LOW-1 | Deprecated `X-XSS-Protection` header | `index.ts:64` |
| LOW-2 | No `Permissions-Policy` header | `index.ts` |
| LOW-3 | Story IDs use `Math.random()` | `lib/storage.ts:80` |
| LOW-4 | No security headers in `vercel.json` | `vercel.json` |

## Priority Order
CRIT-2 → CRIT-3 → CRIT-1 → CRIT-4 → HIGH-3 → HIGH-4 → HIGH-5 → MED-1
