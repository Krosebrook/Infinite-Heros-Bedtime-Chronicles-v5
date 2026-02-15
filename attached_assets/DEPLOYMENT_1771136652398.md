# Infinity Heroes: Bedtime Chronicles -- Deployment Guide

This guide covers everything needed to develop, deploy, and maintain **Infinity Heroes: Bedtime Chronicles**, a React 19 + Vite progressive web application with Vercel serverless API functions powered by Google Gemini AI.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Security Headers](#5-security-headers)
6. [PWA Configuration](#6-pwa-configuration)
7. [Domain Setup](#7-domain-setup)
8. [Monitoring and Debugging](#8-monitoring-and-debugging)
9. [Performance Optimization](#9-performance-optimization)
10. [CI/CD Considerations](#10-cicd-considerations)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### Node.js

- **Required:** Node.js 18.x or later (LTS recommended; Node 20.x or 22.x preferred).
- Vite 6 requires Node.js 18+. Vercel serverless functions also target Node 18+ by default.
- Verify your version:

```bash
node --version
```

### npm

- **Required:** npm 9.x or later (ships with Node.js 18+).
- Verify your version:

```bash
npm --version
```

### Vercel Account

- Sign up at [vercel.com](https://vercel.com) if you do not already have an account.
- Install the Vercel CLI globally for local testing of serverless functions:

```bash
npm install -g vercel
```

### Google Gemini API Key

- Obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey).
- The application uses three Gemini models:
  - **gemini-3-pro-preview** -- story text generation with structured JSON output.
  - **gemini-2.5-flash-image** -- avatar and scene image generation.
  - **gemini-2.5-flash-preview-tts** -- text-to-speech narration.
- A single API key provides access to all three models. Ensure your Google Cloud project has the Generative Language API enabled.

---

## 2. Local Development Setup

### 2.1 Clone the Repository

```bash
git clone <your-repo-url> infinity-heroes-bedtime-chronicles
cd infinity-heroes-bedtime-chronicles
```

### 2.2 Install Dependencies

```bash
npm install
```

This installs all production and development dependencies, including:

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` (^19.2.3) | UI framework |
| `@google/genai` (^1.36.0) | Google Gemini AI SDK |
| `framer-motion` (11.18.2) | Animations |
| `vite` (^6.2.0) | Build tool and dev server |
| `@tailwindcss/vite` / `tailwindcss` (^4.1.18) | Utility-first CSS |
| `vite-plugin-pwa` (^1.2.0) | Progressive Web App support |
| `@vercel/node` (^5.6.3) | Vercel serverless function types |
| `typescript` (~5.8.2) | Type checking |

### 2.3 Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# .env.local
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Important:** Never commit this file. Add `.env.local` to `.gitignore` if it is not already present.

### 2.4 Running the Dev Server (Frontend Only)

```bash
npm run dev
```

This starts the Vite development server on **http://localhost:3000** (configured in `vite.config.ts`). The dev server provides hot module replacement (HMR) for rapid frontend iteration.

Note: The frontend dev server alone cannot execute the serverless API functions in the `api/` directory. For full-stack local development, use `vercel dev` as described below.

### 2.5 Testing API Functions Locally

To test the complete application including serverless functions, use the Vercel CLI:

```bash
vercel dev
```

This command:
- Starts the Vite dev server for the frontend.
- Spins up a local serverless runtime that serves the four API endpoints:
  - `POST /api/generate-story` -- generates structured story JSON via Gemini 3 Pro.
  - `POST /api/generate-avatar` -- generates character avatar images via Gemini 2.5 Flash Image.
  - `POST /api/generate-scene` -- generates scene illustrations via Gemini 2.5 Flash Image.
  - `POST /api/generate-narration` -- generates TTS audio via Gemini 2.5 Flash TTS.

On the first run, `vercel dev` will prompt you to link the project to your Vercel account. You can skip linking if you only want local testing by pressing Enter through the prompts.

The local environment reads `.env.local` automatically, making `GEMINI_API_KEY` available to the serverless functions via `process.env.GEMINI_API_KEY`.

### 2.6 Preview a Production Build

```bash
npm run build
npm run preview
```

This builds optimized production assets into `dist/` and serves them locally. Note that `vite preview` does not serve the API functions; use `vercel dev` for full-stack previewing.

---

## 3. Vercel Deployment

### 3.1 Connecting Your GitHub Repository

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New Project**.
3. Import the GitHub repository containing this project.
4. Vercel auto-detects the framework as **Vite**.

### 3.2 Framework Preset and Build Settings

Vercel should auto-detect these settings, but verify them:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` (equivalent to `vite build`) |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x, 20.x, or 22.x |

The `api/` directory is automatically recognized by Vercel. Each `.ts` file becomes a serverless function endpoint at `/api/<filename>` (without the `.ts` extension). No additional configuration is required.

### 3.3 Environment Variables

Before deploying, set the required environment variable in the Vercel dashboard:

1. Go to **Project Settings** > **Environment Variables**.
2. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Google Gemini API key
   - **Environments:** Production, Preview, Development (select all).
3. Click **Save**.

### 3.4 Deploy

- **Automatic:** Every push to the connected branch (typically `main`) triggers a new deployment.
- **Manual:** Click **Redeploy** in the Vercel dashboard, or run:

```bash
vercel --prod
```

### 3.5 Vercel Configuration (vercel.json)

The project includes a `vercel.json` that applies security headers to all routes. Vercel reads this file automatically during deployment. No routes or rewrites are configured; the default Vite SPA behavior handles client-side routing.

---

## 4. Environment Variables Reference

| Variable | Required | Used By | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | All 4 API functions | Google Gemini API key for story generation, image generation, and text-to-speech. Obtain from [Google AI Studio](https://aistudio.google.com/apikey). |

### Where to Set

| Context | Location |
|---------|----------|
| Local development (Vite) | `.env.local` in project root |
| Local development (Vercel CLI) | `.env.local` in project root, or Vercel project environment variables |
| Production / Preview | Vercel Dashboard > Project Settings > Environment Variables |

### Security Notes

- Never commit API keys to version control.
- The `GEMINI_API_KEY` is only accessed server-side in the `api/` functions. It is never exposed to the browser client.
- Vercel encrypts environment variables at rest.

---

## 5. Security Headers

The `vercel.json` file applies the following security headers to every route (`/(.*)`):

### Content-Security-Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self' https://generativelanguage.googleapis.com;
```

Directive-by-directive breakdown:

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Baseline: only allow resources from the same origin. |
| `script-src` | `'self' 'unsafe-inline'` | Allow scripts from the same origin and inline scripts (needed for Vite-injected code and React). |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Allow stylesheets from same origin, inline styles (Tailwind CSS, Framer Motion), and Google Fonts CSS. |
| `font-src` | `'self' https://fonts.gstatic.com` | Allow font files from same origin and Google Fonts CDN. |
| `img-src` | `'self' data: blob:` | Allow images from same origin, inline data URIs (base64 images from Gemini), and blob URLs (dynamically created images). |
| `connect-src` | `'self' https://generativelanguage.googleapis.com` | Allow API calls to same origin (the `/api/*` endpoints) and directly to Google's Generative Language API if needed. |

### Additional Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents the app from being embedded in iframes, protecting against clickjacking. |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses, reducing drive-by download attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full referrer for same-origin requests but only the origin for cross-origin requests, balancing analytics with privacy. |

---

## 6. PWA Configuration

### 6.1 Service Worker

The `vite-plugin-pwa` plugin (configured in `vite.config.ts`) automatically generates a service worker during the build using [Workbox](https://developer.chrome.com/docs/workbox/). Key configuration:

- **Register type:** `autoUpdate` -- the service worker updates silently in the background without prompting the user.
- **Precache patterns:** `**/*.{js,css,html,ico,png,svg,woff2}` -- all static assets are precached during installation.
- **Navigate fallback:** `/index.html` -- offline navigation requests fall back to the SPA shell, enabling offline routing.

### 6.2 Runtime Caching

Google Fonts are cached with a `CacheFirst` strategy:

```
URL pattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i
Cache name:  google-fonts
Expiration:  max 10 entries, 365-day max age
```

This means Google Fonts are fetched from the network once and then served from cache for up to a year, significantly improving load times on repeat visits.

### 6.3 Web App Manifest

The manifest is provided by `metadata.json` in the project root (the PWA plugin has `manifest: false` to avoid generating a competing manifest). Key manifest properties:

| Property | Value |
|----------|-------|
| `name` | Infinity Heroes: Bedtime Chronicles |
| `short_name` | BedtimeHero |
| `display` | standalone |
| `orientation` | portrait |
| `background_color` | #020617 (slate-950) |
| `theme_color` | #2563eb (blue-600) |
| `start_url` | / |
| `id` | com.infinityheroes.bedtime |
| `categories` | education, entertainment, lifestyle |

Ensure that `metadata.json` is served at `/metadata.json` and that your `index.html` includes a `<link rel="manifest" href="/metadata.json">` tag.

### 6.4 Offline Capabilities

- **Static assets:** Fully available offline after the first visit (precached by the service worker).
- **API responses:** Not cached by the service worker. Story generation, image generation, and narration require a network connection to reach the Gemini API.
- **Navigation:** Works offline. The SPA shell loads from cache, and previously visited pages render correctly (minus dynamic AI content).

---

## 7. Domain Setup

### 7.1 Adding a Custom Domain on Vercel

1. Go to **Project Settings** > **Domains** in the Vercel dashboard.
2. Enter your custom domain (e.g., `bedtimeheroes.com`).
3. Click **Add**.
4. Vercel provides DNS configuration instructions:
   - **For root domains:** Add an `A` record pointing to `76.76.21.21`.
   - **For subdomains (e.g., `app.bedtimeheroes.com`):** Add a `CNAME` record pointing to `cname.vercel-dns.com`.

### 7.2 SSL/TLS

Vercel automatically provisions and renews SSL certificates via Let's Encrypt. No manual configuration is needed. HTTPS is enforced by default.

### 7.3 Redirect Configuration

To redirect `www` to the apex domain (or vice versa), add both variants in the Vercel Domains settings. Vercel lets you designate one as the primary and automatically redirects the other.

---

## 8. Monitoring and Debugging

### 8.1 Vercel Function Logs

- **Real-time logs:** Go to the Vercel dashboard > your project > **Logs** tab.
- **Filter by function:** Select a specific API function (e.g., `api/generate-story`) to see its logs.
- Each API function uses `console.error()` to log failures. These appear in the function logs with timestamps and request IDs.

### 8.2 Vercel Deployment Logs

- View build output for each deployment under the **Deployments** tab.
- Click any deployment to see the full build log, including Vite bundle output and any build errors.

### 8.3 Browser DevTools

- **Network tab:** Inspect API calls to `/api/generate-story`, `/api/generate-avatar`, `/api/generate-scene`, and `/api/generate-narration`. Verify request payloads and response data.
- **Application tab:** Inspect the service worker status, cached resources, and manifest under the "Application" panel.
- **Console:** Watch for CSP violations (reported as console errors) and JavaScript runtime errors.

### 8.4 Common Log Patterns

| Log Message | Meaning |
|-------------|---------|
| `Story generation error: ...` | The Gemini story API call failed (see `api/generate-story.ts`). |
| `Avatar generation error: ...` | The Gemini image API call failed for avatars (see `api/generate-avatar.ts`). |
| `Scene generation error: ...` | The Gemini image API call failed for scenes (see `api/generate-scene.ts`). |
| `Narration generation error: ...` | The Gemini TTS API call failed (see `api/generate-narration.ts`). |

---

## 9. Performance Optimization

### 9.1 Bundle Analysis

To analyze your production bundle size:

```bash
npx vite-bundle-visualizer
```

Or install it as a dev dependency:

```bash
npm install -D rollup-plugin-visualizer
```

Then add to `vite.config.ts`:

```ts
import { visualizer } from 'rollup-plugin-visualizer';

// Inside plugins array:
visualizer({ open: true, gzipSize: true })
```

### 9.2 Caching Strategies

| Resource | Strategy | TTL | Details |
|----------|----------|-----|---------|
| Static assets (JS, CSS, images) | Precache (service worker) | Until next deploy | Workbox precaches all matched glob patterns on service worker install. |
| Google Fonts | CacheFirst (service worker) | 365 days, max 10 entries | Font files cached on first fetch and served from cache thereafter. |
| HTML (index.html) | NetworkFirst (default) | Revalidated on each visit | Ensures users get the latest app shell. |
| API responses | NetworkOnly (default) | Not cached | AI-generated content is unique per request; caching is not applicable. |

### 9.3 Asset Optimization

- **Code splitting:** Vite automatically code-splits dynamic imports.
- **Tree shaking:** Unused exports are removed during production builds.
- **CSS:** Tailwind CSS v4 with the Vite plugin purges unused styles at build time.
- **Images:** Gemini-generated images are returned as base64 inline data. Consider implementing client-side caching (e.g., IndexedDB) for previously generated images if users revisit stories.

### 9.4 Serverless Function Performance

- Vercel serverless functions have a cold start time of ~250-500ms. Subsequent invocations on the same instance are faster.
- Gemini API latency is typically 2-10 seconds depending on the model and output complexity (images and TTS take longer than text).
- The functions are stateless; each request creates a new `GoogleGenAI` client instance. This is by design and has negligible overhead.

---

## 10. CI/CD Considerations

### 10.1 Automatic Deployments via Vercel

By default, Vercel deploys automatically on every push:

| Branch | Deployment Type |
|--------|----------------|
| `main` (or configured production branch) | **Production** deployment |
| Any other branch | **Preview** deployment with a unique URL |
| Pull requests | **Preview** deployment linked to the PR |

### 10.2 Adding a CI Pipeline (Optional)

If you want to run checks before deployment, configure a GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build
```

### 10.3 Recommended Checks

- **TypeScript compilation:** `npx tsc --noEmit` -- catches type errors before deployment.
- **Build verification:** `npm run build` -- ensures the production build completes without errors.
- **Linting (if configured):** Add ESLint and run `npx eslint .` in CI.
- **Testing (if configured):** Add Vitest or similar and run tests in CI.

### 10.4 Environment Variable Management

- Use Vercel's environment variable scoping (Production, Preview, Development) to manage different API keys per environment if needed.
- For CI pipelines, set `GEMINI_API_KEY` as a GitHub Actions secret and pass it as an environment variable if you run integration tests.

---

## 11. Troubleshooting

### Build Failures

| Issue | Cause | Solution |
|-------|-------|----------|
| `Cannot find module '@google/genai'` | Dependencies not installed | Run `npm install`. Verify `@google/genai` is in `package.json` dependencies. |
| TypeScript errors in `api/` files | Type mismatches with `@vercel/node` | Ensure `@vercel/node` is installed as a dev dependency. Run `npx tsc --noEmit` to see all errors. |
| `vite: command not found` | Vite not installed or not in PATH | Run `npm install`. Use `npx vite build` instead of `vite build`. |
| Build succeeds locally but fails on Vercel | Node.js version mismatch | Set the Node.js version in Vercel project settings to match your local version (18.x, 20.x, or 22.x). |

### API Function Errors

| Issue | Cause | Solution |
|-------|-------|----------|
| `405 Method not allowed` | Sending a GET request to an API endpoint | All four API endpoints only accept `POST` requests. Ensure your frontend sends POST with the correct body. |
| `500 API key not configured` | `GEMINI_API_KEY` not set in environment | Add the variable in Vercel dashboard (production) or `.env.local` (local). Redeploy after adding. |
| `500 No image data received` | Gemini returned no image in response | The image generation prompt may have been rejected by safety filters. Check the prompt content. Also verify the model name (`gemini-2.5-flash-image`) is still valid. |
| `500 No audio data received` | Gemini returned no audio in response | Similar to above. The TTS model may have rejected the input text. Verify the model name (`gemini-2.5-flash-preview-tts`). |
| `500 Generation failed` (generic) | Gemini API returned an error | Check Vercel function logs for the full error message. Common causes: quota exceeded, invalid API key, model deprecation, or network timeout. |
| Function timeout | Gemini API took too long to respond | Vercel serverless functions have a default timeout of 10 seconds (Hobby) or 60 seconds (Pro). Image and TTS generation may exceed 10 seconds. Upgrade to Vercel Pro for longer timeouts, or add `export const config = { maxDuration: 60 }` to function files. |

### PWA Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| App not installable | Missing or misconfigured manifest | Verify `metadata.json` is served at the correct path. Check that `index.html` has `<link rel="manifest" href="/metadata.json">`. Ensure icons are accessible. |
| Service worker not registering | HTTPS not available | Service workers require HTTPS (or localhost). Ensure you are accessing the app via HTTPS in production. |
| Stale content after deploy | Old service worker serving cached assets | The `autoUpdate` register type should handle this automatically. If users see stale content, they can hard-refresh (Ctrl+Shift+R) or clear the browser cache. |
| Offline mode shows blank page | `navigateFallback` not working | Verify the build output includes `index.html` and that the Workbox config has `navigateFallback: '/index.html'`. |

### CSP Violations

| Issue | Cause | Solution |
|-------|-------|----------|
| Fonts not loading | `font-src` missing the font CDN | The CSP allows `https://fonts.gstatic.com`. If using a different font CDN, add it to the `font-src` directive in `vercel.json`. |
| API calls blocked | `connect-src` missing the API domain | The CSP allows `https://generativelanguage.googleapis.com`. Since API calls go through your own `/api/*` endpoints (`'self'`), this should not be an issue in normal operation. |
| Inline styles blocked | `style-src` missing `'unsafe-inline'` | The CSP already includes `'unsafe-inline'` for styles. If this error appears, verify `vercel.json` was deployed correctly. |
| Third-party scripts blocked | `script-src` too restrictive | By design, only same-origin and inline scripts are allowed. To add a third-party script (e.g., analytics), add its domain to the `script-src` directive. |

### Local Development Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `vercel dev` not finding API functions | Project not linked or wrong directory | Run `vercel dev` from the project root. If prompted, link to your Vercel project. |
| Port 3000 already in use | Another process on port 3000 | Stop the other process, or change the port in `vite.config.ts` (`server.port`). |
| CORS errors in browser | API endpoint returning wrong headers | `vercel dev` handles CORS for local development. If issues persist, check that requests go to the same origin (e.g., `http://localhost:3000/api/...`). |

---

## Quick Reference: Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] `npm install` completed successfully
- [ ] `.env.local` created with valid `GEMINI_API_KEY`
- [ ] `vercel dev` runs and all four API endpoints respond
- [ ] `npm run build` completes without errors
- [ ] GitHub repository connected to Vercel
- [ ] `GEMINI_API_KEY` set in Vercel Environment Variables (all environments)
- [ ] Framework preset set to Vite in Vercel
- [ ] Build command verified as `npm run build`
- [ ] Output directory verified as `dist`
- [ ] First production deployment successful
- [ ] Custom domain configured (optional)
- [ ] PWA installable from browser (verify with Lighthouse)
- [ ] Security headers verified (check with securityheaders.com)
