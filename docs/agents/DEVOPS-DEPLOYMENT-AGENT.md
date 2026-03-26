<!-- Last verified: 2026-03-26 -->
# DEVOPS-DEPLOYMENT-AGENT.md — DevOps & Deployment Expert

Specialized agent context for all work touching builds, deployments, CI/CD pipelines, environment management, and operational runbooks.

---

## Domain Scope

This agent is authoritative for:
- `package.json` — build and run scripts
- `scripts/build.js` — Expo static build script
- `scripts/build-android.sh` — EAS Android build helper
- `eas.json` — EAS Build profiles
- `.github/workflows/ci.yml` — CI pipeline
- `.env.example` — Environment variable documentation
- `app.json` — Expo app configuration
- `drizzle.config.ts` — Database migration config
- `server_dist/` — Production server bundle output
- `docs/operations/PLAY_STORE_DEPLOYMENT.md` — Play Store runbook
- `docs/runbooks/` — Operational procedures

---

## Build System

### Server Build

```bash
npm run server:build
# esbuild → server_dist/index.js (ESM format)
# Format: esm, target: node18, bundle: true, minify: false
```

Output: `server_dist/index.js` — single-file ESM bundle for production.

### Expo (Mobile) Build

```bash
# Development (non-Replit)
npx expo start

# Replit development
npm run expo:dev       # Sets EXPO_PUBLIC_DOMAIN=... then runs expo start

# Static web build
npm run expo:static:build   # node scripts/build.js
```

**Note:** `npm run dev` does NOT exist. Use `npm run server:dev` + `npm run expo:dev` separately.

### Android Builds (EAS)

```bash
# scripts/build-android.sh operations
./scripts/build-android.sh dev        # Development APK + DevClient
./scripts/build-android.sh preview    # Preview APK (internal testing)
./scripts/build-android.sh prod       # Production AAB
./scripts/build-android.sh submit     # Submit to Play Store
```

EAS Build profiles (`eas.json`):
| Profile | Output | Distribution |
|---------|--------|-------------|
| `development` | APK + DevClient | Internal only |
| `preview` | APK | Internal testing |
| `production` | AAB | Play Store |

---

## EAS Configuration

```json
// eas.json structure
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./google-services-key.json" }
    }
  }
}
```

**Security:** `google-services-key.json` is in `.gitignore` and must never be committed.

---

## App Configuration (`app.json`)

Key fields:
```json
{
  "expo": {
    "name": "Infinity Heroes: Bedtime Chronicles",
    "slug": "infinity-heroes-bedtime-chronicles",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "android": {
      "package": "com.infinityheroes.bedtime"
    },
    "ios": {
      "bundleIdentifier": "com.infinityheroes.bedtime"
    },
    "extra": {
      "eas": {
        "projectId": "6aea7a34-65d8-4036-a1b8-9caed0b850fb"
      }
    },
    "experiments": {
      "reactCompiler": true
    },
    "newArchEnabled": true
  }
}
```

`appVersionSource: "local"` — version managed in `app.json`, not by EAS.

---

## CI Pipeline (`.github/workflows/ci.yml`)

Pipeline steps:
1. Install Node.js 18
2. `npm ci` — clean install
3. `npm run typecheck` — TypeScript check
4. `npm run lint` — ESLint
5. `npm test` — Vitest test suite
6. `npm run server:build` — Verify server builds

All steps must pass before merge.

**Note:** The CI file exists in source but Replit's Zapier connector cannot push to `.github/` paths — requires manual commit outside of Replit.

---

## Replit Deployment

The app deploys to Google Cloud Run via Replit push-to-deploy:

1. `npm run server:build` — produces `server_dist/index.js`
2. Server runs as `NODE_ENV=production node server_dist/index.js`
3. Binds to `0.0.0.0:${PORT}` (default 5000) with `reusePort: true`
4. `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` are auto-set by Replit

### Graceful Shutdown
Server handles `SIGTERM`/`SIGINT` — drains in-flight requests before exiting.

---

## Environment Variable Management

### `.env.example` — Source of Truth for Env Docs

When adding a new environment variable:
1. Add to `.env.example` with a blank value and an inline comment explaining its purpose.
2. Update the env table in `README.md`.
3. If required for production, add to the Replit Secrets panel.
4. If required for EAS builds, add via `eas secret:create`.

### EAS Secrets (Production Builds)
```bash
# Required before production builds
eas secret:create --scope project --name AI_INTEGRATIONS_GEMINI_API_KEY --value <key>
eas secret:create --scope project --name ELEVENLABS_API_KEY --value <key>
# ... repeat for all AI provider keys
```

### Client-Visible Variables
Only variables prefixed `EXPO_PUBLIC_` are bundled into the client. **Never** add AI provider keys or secrets with this prefix.

Safe client vars:
```
EXPO_PUBLIC_DOMAIN=   # API server domain (set by dev script, not a secret)
```

---

## Database Operations

```bash
# Apply schema changes
npm run db:push
# Requires DATABASE_URL to be set

# Connect to database directly (production)
# Use Replit database panel or psql with DATABASE_URL
```

Always test migrations on a dev database before applying to production.

---

## patch-package

`postinstall` runs `patch-package` to apply patches in `patches/`:

| Patch | Fixes |
|-------|-------|
| `expo-asset+12.0.12.patch` | Expo dev server HTTPS compatibility (remove on SDK 55 upgrade) |

**Do not modify `patches/` without explicit approval.** Never skip `postinstall`.

---

## Production Checklist

Before deploying to production:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run server:build` succeeds
- [ ] All required env vars set in Replit Secrets
- [ ] `DATABASE_URL` configured (if voice chat enabled)
- [ ] ElevenLabs API key set (if TTS required)
- [ ] CORS allowed origins include production domain
- [ ] `NODE_ENV=production` set

---

## Play Store Deployment

Full runbook: `docs/operations/PLAY_STORE_DEPLOYMENT.md`

Key steps:
1. Bump version in `app.json`
2. `./scripts/build-android.sh prod`
3. Set EAS secrets if not already set
4. `./scripts/build-android.sh submit`
5. Review in Google Play Console

Android package: `com.infinityheroes.bedtime`

---

## What This Agent Must Flag for Human Review

- Changes to CORS configuration (production security)
- New `EXPO_PUBLIC_*` environment variables (client-visible)
- Changes to rate limiting parameters
- Changes to `eas.json` production profile
- Changes to `.replit` file (affects all contributors' dev environment)
- Dependency major version upgrades

---

## Related Agent Files

- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — Server configuration
- [`TESTING-QA-AGENT.md`](./TESTING-QA-AGENT.md) — CI test suite
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Production security requirements
- [`PERFORMANCE-AGENT.md`](./PERFORMANCE-AGENT.md) — Build optimization
