# Runbook: Incident Response

This runbook covers how to respond when Infinity Heroes: Bedtime Chronicles has a production incident.

**Last Updated:** 2026-03-16

---

## Incident Severity Levels

| Level | Description | Example | Response Time |
|-------|-------------|---------|---------------|
| P1 — Critical | App is completely down | Server not responding, all story generation broken | Immediate |
| P2 — High | Core feature broken | Story generation failing, TTS not working | < 1 hour |
| P3 — Medium | Degraded functionality | One AI provider down, images not generating | < 4 hours |
| P4 — Low | Minor issue | Slow response times, non-critical feature broken | Next business day |

---

## Triage: Is This a Code Problem or a Provider Problem?

Before taking any action:

```bash
# 1. Check server health
curl https://<your-deployment>.replit.app/api/health
# Expected: {"status":"ok","timestamp":...}

# 2. Check which AI providers are available
curl https://<your-deployment>.replit.app/api/ai-providers
# Expected: {"providers":{"gemini":true,"openai":false,...}}

# 3. Check Replit deployment logs
# → Replit dashboard → Deployments → Latest deployment → Logs
```

**If `/api/health` returns an error:** Code or server problem → escalate to P1/P2
**If `/api/health` returns OK but `/api/ai-providers` shows providers down:** External provider outage → P3 (no code fix possible)
**If story generation fails but providers show as available:** Likely a prompt or response parsing issue → P2

---

## Response Playbooks

### P1: Server is down
1. Check Replit deployment logs for crash/startup errors
2. If a recent deploy caused the issue → see [rollback.md](./rollback.md)
3. If no recent deploy → check if Replit infrastructure has an incident at https://replit.statuspage.io
4. If Replit is healthy → check `server/index.ts` for startup errors (port conflicts, missing env vars)
5. Check that required env vars are set in Replit Secrets

### P2: Story generation broken
1. Check `/api/ai-providers` — are all providers down?
   - If yes: external provider outage. No code action possible. Monitor provider status pages.
   - If no: continue investigation.
2. Test story generation directly:
   ```bash
   curl -X POST https://<deployment>/api/generate-story \
     -H "Content-Type: application/json" \
     -d '{"heroName":"Test","mode":"classic","duration":"short"}'
   ```
3. Check the response — is it an error from a specific provider?
4. Check if a recent code change modified `server/ai/index.ts` or any provider file
5. If code change caused it → [rollback.md](./rollback.md)

### P3: TTS narration not working
1. Check if `ELEVENLABS_API_KEY` is set (or Replit Connector is connected)
2. Test TTS endpoint:
   ```bash
   curl -X POST https://<deployment>/api/tts \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello","voice":"nova_guardian"}'
   ```
3. If 503: ElevenLabs API is down or key is invalid
   - Check https://status.elevenlabs.io
   - Verify `ELEVENLABS_API_KEY` in Replit Secrets
4. If TTS was working before and now isn't: check if Replit Connector was re-wired (reconnect in Settings → Connectors)

### P3: Image generation not working
1. Check `/api/ai-providers` — is Gemini (primary) or OpenAI (fallback) available?
2. Test directly:
   ```bash
   curl -X POST https://<deployment>/api/generate-avatar \
     -H "Content-Type: application/json" \
     -d '{"heroName":"Test","heroPower":"flight"}'
   ```
3. If all providers show as available but images still fail: check `server/ai/index.ts` image routing

### P4: Rate limit complaints
1. Default limit is 10 requests/60 seconds per IP
2. This is configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` env vars
3. If legitimate users are being rate-limited: increase `RATE_LIMIT_MAX` in Replit Secrets
4. If abuse is suspected: the current in-memory limiter is IP-based; consider adding Redis (roadmap item)

---

## External Provider Status Pages

| Provider | Status URL |
|----------|-----------|
| Google Gemini | https://status.cloud.google.com |
| OpenAI | https://status.openai.com |
| Anthropic | https://status.anthropic.com |
| OpenRouter | https://openrouter.ai (check their Discord/Twitter) |
| ElevenLabs | https://status.elevenlabs.io |
| Replit | https://replit.statuspage.io |

---

## Post-Incident Review

After every P1 or P2 incident:
1. Document what happened, when it started, when it was resolved
2. Identify root cause
3. Create a GitHub issue with the `postmortem` label (or equivalent)
4. Add a TODO item to `TODO.md` if a code change would prevent recurrence
5. Update this runbook if the response steps were unclear or incorrect
