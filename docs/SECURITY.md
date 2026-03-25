# Security Posture

**Last Updated:** 2026-03-25

## Security Controls

### Implemented

| Control | Status | Details |
|---------|--------|---------|
| Server-side API proxy | Active | All AI provider keys stay on the server; client never sees them |
| Security headers | Active | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy, X-Permitted-Cross-Domain-Policies |
| CORS restrictions | Active | Dynamic origin matching — only Replit domains + localhost allowed |
| HTTP body size limits | Active | 100KB for general requests, 50MB for audio payloads |
| Input sanitization | Active | All user inputs truncated to max length via `sanitizeString()` |
| Input validation | Active | Whitelisted modes, durations, speeds; validated voice keys; parseInt guards on route params |
| Conversation ID validation | Active | `parseIdParam()` rejects NaN, zero, negative, and non-integer IDs with 400 |
| Message content validation | Active | Type check, empty check, max 10,000 character limit |
| Audio payload validation | Active | Type check, base64 size estimation, max 25MB limit |
| Voice parameter validation | Active | Allowlist: alloy, echo, fable, onyx, nova, shimmer |
| Conversation title sanitization | Active | Trimmed and capped at 200 characters |
| Conversation pagination | Active | `limit`/`offset` query params with bounds (max 200 per page) |
| Safe JSON parsing | Active | AI response `JSON.parse` wrapped in try-catch to prevent crashes |
| Typed error handling | Active | `catch (error: any)` replaced with `error instanceof Error` checks |
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
| Authentication | Low | Free children's app with no user accounts (client-side profiles only) |
| Client-side encryption | Low | Cached data is non-sensitive (story text, audio); no PII stored |
| Explicit prompt injection defense | Low | AI safety filters + child-safety system prompt constrain output |
| CSP headers | Medium | Not applicable — API-only server; no HTML served to browsers except landing page |
| Authentication on chat routes | Low | Free children's app; conversations are ephemeral and non-sensitive |
| Per-user rate limiting | Low | IP-based limiting is sufficient for single-instance deployment |

## OWASP Top 10 Assessment

| # | Vulnerability | Status |
|---|--------------|--------|
| A01 | Broken Access Control | N/A — no authentication layer (by design) |
| A02 | Cryptographic Failures | N/A — no secrets stored client-side; API keys server-only |
| A03 | Injection | Mitigated — input sanitization, parameterized DB queries (Drizzle ORM) |
| A04 | Insecure Design | Low risk — child safety rules in prompts; no sensitive operations |
| A05 | Security Misconfiguration | Mitigated — security headers set; CORS restricted; body limits enforced |
| A06 | Vulnerable Components | Monitor — dependencies should be audited regularly via `npm audit` |
| A07 | Auth Failures | N/A — no authentication |
| A08 | Data Integrity Failures | Low risk — server validates AI responses before returning to client |
| A09 | Logging Failures | Mitigated — request logging with timing; error logging without PII |
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
