# Runbook: Rollback

This runbook covers how to roll back a bad deployment of Infinity Heroes: Bedtime Chronicles.

**Last Updated:** 2026-03-16

---

## Overview

The deployment target is Replit Cloud Run. Rollback is achieved by redeploying from the last known-good commit.

---

## Step 1: Identify the Problem

Before rolling back, confirm the issue:
1. Check the deployment URL — is it returning errors?
2. Check Replit deployment logs for build or runtime errors
3. Check `/api/health` endpoint response

```bash
curl https://<your-deployment>.replit.app/api/health
```

If the issue is a server crash or broken endpoint, proceed with rollback. If the issue is an AI provider outage (not a code problem), see [incident-response.md](./incident-response.md) instead.

---

## Step 2: Find the Last Known-Good Commit

```bash
# View recent commit history
git log --oneline -20

# Find the last commit before the breaking change
# Note the commit SHA (e.g., abc1234)
```

Alternatively, use the GitHub repository UI: go to **Commits** and identify the last good state.

---

## Step 3: Revert to the Last Good State

### Option A: Revert the breaking commit (preserves history — preferred)
```bash
# Revert the most recent commit
git revert HEAD --no-edit

# Push the revert commit
git push origin main
```

### Option B: Roll back to a specific commit (if multiple commits are bad)
```bash
# Create a revert-to commit from the known-good SHA
git revert <bad-sha-1> <bad-sha-2> --no-edit

# Push
git push origin main
```

### Option C: Hard reset (destructive — only if revert is not possible)
```bash
# WARNING: This rewrites history. Coordinate with the team first.
git reset --hard <last-known-good-sha>
git push --force-with-lease origin main
```

---

## Step 4: Redeploy

After reverting:
1. In Replit, click **Deploy** to trigger a new build from the reverted code
2. Monitor build logs
3. Run the post-deploy verification steps from [deploy.md](./deploy.md#post-deploy-verification)

---

## Step 5: Root Cause Analysis

After the rollback is confirmed stable:
1. Identify what change caused the failure
2. Fix the issue in a new branch
3. Test locally with `npm run server:dev`
4. Run `npm run typecheck && npm run lint`
5. Submit a PR with the fix and a description of what went wrong

---

## Quick Reference — Critical File Locations

| File | Purpose |
|------|---------|
| `server/index.ts` | Server bootstrap — first place to check for startup errors |
| `server/routes.ts` | Route handlers — check for async errors |
| `server/ai/index.ts` | AI router — check if provider config changed |
| `server_dist/index.js` | Production bundle — check if build succeeded |
| `web-build/` | Expo static bundle — check if frontend build succeeded |
