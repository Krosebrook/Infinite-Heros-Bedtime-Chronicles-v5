# Security Posture

**Last Updated:** 2026-03-27

## Security Controls

### Implemented

| Control | Status | Details |
|---------|--------|---------|
| Server-side API proxy | Active | All AI provider keys stay on the server; client never sees them |
| Security headers | Active | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection |
| CORS restrictions | Active | Dynamic origin matching — only Replit domains + localhost allowed |
| HTTP body size limits | Active | 100KB for general requests, 50MB for audio payloads |
| Input sanitization | Active | All user inputs truncated to max length via `sanitizeString()` |
| Input validation | Active | Whitelisted modes, durations, speeds; validated voice keys |
| Rate limiting | Active | Per-IP, 10 req/min (configurable via env vars) |
| Rate limit cleanup | Active | Expired entries pruned every 5 minutes |
| TTS file validation | Active | Filename regex (`/^[a-f0-9]+\.mp3$/`) + path traversal prevention |
| Video ID validation | Active | Regex validation (`/^[a-f0-9]+$/`) |
| Error sanitization | Active | Internal errors not leaked to clients |
| Graceful shutdown | Active | SIGTERM/SIGINT handlers with 10s timeout |
| Child safety prompts | Active | CHILD_SAFETY_RULES system prompt enforces age-appropriate content |
| Database cascade deletes | Active | Deleting a conversation cascades to all messages |

### Not Implemented (Acceptable Risk)

| Item | Risk Level | Rationale |
|------|-----------|-----------|
| Client-side encryption | Low | Cached data is non-sensitive (story text, audio); no PII stored |

### Recently Implemented (2026-03-27)

| Control | Status | Details |
|---------|--------|---------|
| Firebase Authentication | Active | Firebase Auth with Bearer tokens; anonymous sign-in for frictionless UX |
| Production auth guard | Active | Blocks all requests in NODE_ENV=production without Firebase key |
| Parent PIN hashing | Active | SHA-256 hash + random salt via expo-crypto; 5-attempt lockout |
| Voice chat child safety | Active | VOICE_CHAT_SAFETY_PROMPT prepended to all AI conversations |
| Voice chat auth | Active | requireAuth middleware on all /api/conversations/* endpoints |
| Dual-layer rate limiting | Active | IP-based (10/min) + user-based (5/min via Firebase UID) |
| Conversation ID validation | Active | parseInt with NaN/negative rejection |
| Audio body limit reduction | Active | Reduced from 50MB to 10MB |
| Chat history cap | Active | Max 20 messages sent to AI provider |

## OWASP Top 10 Assessment

| # | Vulnerability | Status |
|---|--------------|--------|
| A01 | Broken Access Control | Mitigated — Firebase Auth on all POST endpoints; conversation ID validation; production auth guard |
| A02 | Cryptographic Failures | Mitigated — parent PIN hashed with SHA-256 + salt; API keys server-only |
| A03 | Injection | Mitigated — input sanitization via sanitizeString(); parameterized DB queries (Drizzle ORM); prompt injection risk acknowledged |
| A04 | Insecure Design | Mitigated — CHILD_SAFETY_RULES + VOICE_CHAT_SAFETY_PROMPT; dual-layer rate limiting |
| A05 | Security Misconfiguration | Mitigated — security headers; CORS restricted; body limits enforced; production auth guard |
| A06 | Vulnerable Components | Monitor — dependencies should be audited regularly via `npm audit` |
| A07 | Auth Failures | Mitigated — Firebase Auth with Bearer tokens; brute-force lockout on parent PIN |
| A08 | Data Integrity Failures | Low risk — server validates AI responses before returning to client |
| A09 | Logging Failures | Mitigated — request logging; rate limit violation logging; auth failure logging |
| A10 | SSRF | Low risk — server only makes outbound calls to known AI provider URLs |

## Rate Limiting Details

- **Algorithm:** Sliding window (in-memory Map)
- **Window:** 60 seconds (configurable: `RATE_LIMIT_WINDOW_MS`)
- **Max requests:** 10 per window (configurable: `RATE_LIMIT_MAX`)
- **Key:** Client IP (`req.ip || req.socket.remoteAddress`)
- **Response on limit:** `429 Too Many Requests`
- **Cleanup:** Expired entries pruned every 5 minutes

## Recommendations

1. **Add `npm audit` to CI** — Catch vulnerable dependencies before deployment
2. **Monitor API costs** — Track AI provider usage to detect abuse even within rate limits
3. **Add request logging dashboard** — Aggregate logs to detect patterns (e.g., single IP hitting limits repeatedly)
4. **Consider authentication** — If the app grows, add anonymous session tokens to prevent cross-user data access
