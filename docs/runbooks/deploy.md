# Runbook: Deploy

This runbook covers deploying Infinity Heroes: Bedtime Chronicles to production on Replit.

**Last Updated:** 2026-03-16

---

## Overview

The app is deployed on **Replit** using Google Cloud Run (`deploymentTarget = "cloudrun"`) as the infrastructure provider.

**Build process:**
1. Expo static web build → `web-build/` directory
2. Express server bundle → `server_dist/index.js`

**Run process:**
- Express server starts on port 5000, serving both the API and the Expo web bundle as static files

---

## Prerequisites

Before deploying, ensure:
- [ ] All environment variables are set in Replit Secrets (Settings → Secrets)
- [ ] `DATABASE_URL` is configured if voice chat is enabled
- [ ] At least one AI provider key (`AI_INTEGRATIONS_GEMINI_API_KEY`) is configured
- [ ] ElevenLabs is connected via Replit Connectors (Settings → Connectors) or `ELEVENLABS_API_KEY` is set
- [ ] `npm run typecheck` passes: zero TypeScript errors
- [ ] `npm run lint` passes: zero lint errors
- [ ] Manual smoke test complete (story generation, TTS, image generation)

---

## Deploy Steps (Replit)

### Option A: Deploy via Replit UI (recommended)
1. Open the Replit workspace
2. Click the **Deploy** button in the top bar
3. Confirm the build and run commands are correct:
   - Build: `npm run expo:static:build && npm run server:build`
   - Run: `npm run server:prod`
4. Click **Deploy**
5. Monitor the build logs for errors
6. Once live, verify the deployment URL is responding

### Option B: Deploy via CLI
```bash
# From within the Replit workspace terminal:
npm run expo:static:build   # Builds Expo web bundle
npm run server:build        # Bundles server with esbuild → server_dist/

# Verify the build artifacts exist:
ls server_dist/index.js
ls web-build/

# Run production locally (test before deploying):
npm run server:prod
```

---

## Post-Deploy Verification

After deployment, verify the following endpoints respond correctly:

```bash
# Replace <deployment-url> with your Replit deployment URL
BASE_URL=https://<your-replit-deployment>.replit.app

# 1. Health check
curl $BASE_URL/api/health
# Expected: {"status":"ok","timestamp":...}

# 2. AI providers status
curl $BASE_URL/api/ai-providers
# Expected: {"providers":{"gemini":true,...}}

# 3. Landing page
curl -I $BASE_URL/
# Expected: HTTP 200 with Content-Type: text/html

# 4. Voice list
curl $BASE_URL/api/voices
# Expected: {"voices":[...],"defaults":{...}}
```

If any check fails, see [incident-response.md](./incident-response.md).

---

## Environment Variables Reference

All secrets are managed in Replit Settings → Secrets. See `.env.example` for the full list with descriptions.

Critical variables for production:
| Variable | Required | Purpose |
|----------|---------|---------|
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Yes | Primary AI provider |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Recommended | AI fallback |
| `ELEVENLABS_API_KEY` | Recommended | TTS narration |
| `DATABASE_URL` | Optional | Voice chat feature |
| `OPENAI_API_KEY` | Optional | Sora video generation |

---

## Rollback

If the deployment is broken, see [rollback.md](./rollback.md).
