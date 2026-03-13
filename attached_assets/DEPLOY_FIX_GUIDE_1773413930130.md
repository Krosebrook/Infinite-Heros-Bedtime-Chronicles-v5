# Infinity Heroes: Bedtime Chronicles — Fix & Deploy Guide

**Date:** March 13, 2026
**Target:** Vercel deployment with custom domain `bedtime-chronicles.com`
**Repo:** `github.com/Krosebrook/infinity-heroes-bedtime-chronicles`

---

## Summary of Issues & Fixes

| # | Severity | Issue | File(s) Changed | Root Cause |
|---|----------|-------|-----------------|------------|
| ~~1~~ | ~~CRITICAL~~ | ~~API routes on Replit~~ | N/A | Eliminated — deploying to Vercel |
| 2 | CRITICAL | CORS blocks custom domain | `api/_middleware.ts` | `bedtime-chronicles.com` (with hyphen) missing from allowed origins |
| 3 | HIGH | Gemini models expired/rotated | `api/generate-story.ts`, `api/generate-avatar.ts`, `api/generate-scene.ts` | All 3 were date-stamped preview builds |
| 4 | MEDIUM | Images always look the same | `AIClient.ts` | Static prompt with no style variation |
| 5 | MEDIUM | Story generation fragile | `api/generate-story.ts` | No `responseSchema` enforcement |
| 6 | LOW | CSP blocks cross-origin API | `vercel.json` | `connect-src 'self'` too restrictive for custom domain |

---

## Model Migration Map

| Endpoint | Old Model (DEAD/EXPIRING) | New Model (STABLE) |
|----------|--------------------------|-------------------|
| Story generation | `gemini-2.5-flash-preview-05-20` | `gemini-2.5-flash` |
| Avatar generation | `gemini-2.0-flash-preview-image-generation` | `gemini-2.5-flash-image` |
| Scene illustration | `gemini-2.0-flash-preview-image-generation` | `gemini-2.5-flash-image` |
| TTS narration | `gemini-2.5-flash-preview-tts` | `gemini-2.5-flash-preview-tts` (unchanged — still active) |

**Important:** The new image model (`gemini-2.5-flash-image`) requires `responseModalities: [Modality.IMAGE]` in the config object. The old model accepted image requests without this. This is the most likely reason image generation silently broke.

---

## Files to Replace

Copy these files from the `fixes/` directory directly into your repo, replacing the existing versions:

```
fixes/
├── api/
│   ├── _middleware.ts      → replaces api/_middleware.ts
│   ├── generate-story.ts   → replaces api/generate-story.ts
│   ├── generate-avatar.ts  → replaces api/generate-avatar.ts
│   └── generate-scene.ts   → replaces api/generate-scene.ts
├── AIClient.ts             → replaces AIClient.ts (root)
└── vercel.json             → replaces vercel.json (root)
```

**Files NOT changed** (confirmed working):
- `api/generate-narration.ts` — TTS model still active, no changes needed
- `hooks/useStoryEngine.ts` — client logic is sound
- `NarrationManager.ts` — audio pipeline is correct
- `components/*` — UI layer is functional
- `types.ts` — type definitions are correct

---

## Deployment Steps (Vercel)

### 1. Apply the fixes locally

```bash
cd infinity-heroes-bedtime-chronicles

# Replace files
cp fixes/api/_middleware.ts api/_middleware.ts
cp fixes/api/generate-story.ts api/generate-story.ts
cp fixes/api/generate-avatar.ts api/generate-avatar.ts
cp fixes/api/generate-scene.ts api/generate-scene.ts
cp fixes/AIClient.ts AIClient.ts
cp fixes/vercel.json vercel.json
```

### 2. Update @google/genai SDK

Your `package.json` has `"@google/genai": "^1.36.0"`. The `Modality` import used in the image endpoints requires a recent version. Update:

```bash
npm install @google/genai@latest
```

Current latest is `1.44.0` (March 2026). This is required because `Modality.IMAGE` enum was added in a version after 1.36.

### 3. Set environment variable in Vercel

```bash
# In Vercel dashboard → Settings → Environment Variables
# Or via CLI:
vercel env add GEMINI_API_KEY
```

Paste your Google AI Studio API key. Ensure it has access to:
- `gemini-2.5-flash` (text generation)
- `gemini-2.5-flash-image` (Nano Banana image gen)
- `gemini-2.5-flash-preview-tts` (TTS)

### 4. Deploy

```bash
# Verify build works locally first
npm run typecheck
npm run build

# Deploy to Vercel
vercel --prod
```

### 5. Configure custom domain

In Vercel dashboard → Settings → Domains:
- Add `bedtime-chronicles.com`
- Add `www.bedtime-chronicles.com`
- Point DNS (A record to Vercel's IP or CNAME to `cname.vercel-dns.com`)

### 6. Verify

After deployment, test each feature:

```
✅ Story generation (Classic mode) — creates story with parts + choices
✅ Story generation (Sleep mode) — creates long story, no choices
✅ Story generation (Mad Libs) — creates silly story from keywords
✅ Avatar generation — creates hero portrait (VARIES IN STYLE now)
✅ Scene illustration — creates scene image (VARIES IN STYLE now)
✅ TTS narration — plays audio with selected voice
✅ Offline mode — loads cached stories from IndexedDB
```

---

## What the Style Randomizer Does (Fix #4)

Each image generation now randomly selects from 12 art styles:

1. Soft watercolor with dreamy washes
2. Bold cel-shaded cartoon
3. Textured paper cutout collage
4. Warm gouache painting
5. Playful crayon drawing
6. Luminous digital painting with glow effects
7. Retro 1960s storybook illustration
8. Whimsical ink and wash
9. Cozy pastel illustration
10. Vibrant pop art with halftone
11. Gentle chalk on dark paper
12. Modern flat design with geometric shapes

Each story will have a unique visual identity. If you want per-story consistency (same style across all scenes in one story), you can store the selected style in the `useStoryEngine` hook and pass it through. Current implementation picks a random style per individual image call.

---

## Known Remaining Gaps (Not Fixed Here)

| Gap | Priority | Notes |
|-----|----------|-------|
| 0% test coverage | HIGH | Add Vitest + RTL per TESTING.md |
| No CI lint enforcement | HIGH | Add `npm run lint` to GitHub Actions |
| 17 console.log instances | MEDIUM | Migrate to `lib/Logger.ts` |
| No error tracking | MEDIUM | Add Sentry or equivalent |
| SDK version pinning | LOW | Pin `@google/genai` to exact version after confirming 1.44.0 works |

---

## Verification Checklist

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run build` succeeds under 5 seconds
- [ ] `vercel dev` runs locally with all 4 API routes working
- [ ] Story generation returns valid JSON matching StoryFull schema
- [ ] Avatar generates with visible style variation across 3+ attempts
- [ ] Scene illustrations vary visually from avatars
- [ ] TTS plays audio with correct voice selection
- [ ] CORS headers allow `bedtime-chronicles.com` origin
- [ ] CSP headers don't block API calls on custom domain
- [ ] Offline mode loads previously cached stories
