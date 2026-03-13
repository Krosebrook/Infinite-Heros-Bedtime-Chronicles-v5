# Dead Code Triage Report
**Project:** Infinity Heroes — Bedtime Chronicles  
**Audit Date:** 2026-03-13  
**Auditor:** Automated scan + manual review  
**Branch:** main (HEAD: 7a483ba)

---

## Summary

| Metric | Count |
|--------|-------|
| Total candidates found | 9 |
| Orphaned exports | 6 |
| Duplicate implementations | 1 |
| Architectural drift (dual systems) | 1 |
| Renamed/suffixed files (.old/.bak) | 0 |
| Commented-out code blocks | 0 |
| Always-false dead branches (`if (false)`) | 0 |

**The codebase is notably clean of commented-out blocks and renamed backup files.** All dead code found is in the form of orphaned exports and parallel implementations introduced by successive agent rewrites.

---

## Triage Entries

---

### 1. `server/storage.ts:1-38`

**Type:** Orphaned export  
**What it does:** Defines `IStorage` interface, `MemStorage` class (in-memory user store with `getUser`, `getUserByUsername`, `createUser`), and exports a singleton `storage` instance. This is a server-side user storage layer.  
**Current replacement:** The app has no server-side user management. Client-side user/profile data is handled entirely by `lib/storage.ts` (AsyncStorage). No equivalent server-side logic exists.  
**Current replacement working?** N/A — server-side user storage is not a feature that currently exists in the app.  
**Recommendation:** KEEP_CURRENT  

No restore needed. This is scaffold code from the initial project template. It is not broken — it was never connected. It will become relevant if server-side user accounts are added in the future. Deleting it would be premature. Risk of keeping it: zero (it is never imported).

---

### 2. `components/HeroCard.tsx:1-103`

**Type:** Orphaned export / duplicate implementation  
**What it does:** A full 103-line `HeroCard` component — a pressable hero selection card with gradient background, power badge, and haptic feedback — accepting a `Hero` object and `onPress` handler. It is a complete, working component.  
**Current replacement:** `app/(tabs)/create.tsx:467` — heroes are rendered inline with `HEROES.map()` using bespoke JSX directly within the screen. The inline version has its own styling and selection state logic.  
**Current replacement working?** YES — the inline version in create.tsx is active and functional.  
**Recommendation:** NEEDS_DECISION  

**Tradeoff:**  
- **HeroCard.tsx** is a clean, reusable component following good separation-of-concerns principles. It accepts a `Hero` prop and an `onPress`, making it testable in isolation.  
- **Inline in create.tsx** is tightly coupled to the screen's state (heroIndex, selection animation) and has been customized for the carousel/swiper interaction pattern used in the create flow.  
- Restoring HeroCard would require refactoring create.tsx's hero rendering, which is a non-trivial change that could regress the carousel UX.  
- `quick-create.tsx` (onboarding) also renders hero cards inline and might benefit from the component if restored.  

**Decision needed:** Should `HeroCard.tsx` become the canonical hero card component used everywhere, or should it be deleted as replaced by the inline version?

---

### 3. `components/KeyboardAwareScrollViewCompat.tsx:1-30`

**Type:** Orphaned export  
**What it does:** A thin platform-compatibility wrapper that renders `KeyboardAwareScrollView` from `react-native-keyboard-controller` on native, and falls back to a plain `ScrollView` on web. Marked `// template` at the top of the file, suggesting it was generated as starter scaffolding.  
**Current replacement:** Forms in the app (story-details.tsx, quick-create.tsx) use `ScrollView` directly without keyboard avoidance. No direct replacement — this feature is simply absent.  
**Current replacement working?** PARTIALLY — keyboard avoidance is missing from form screens; the component exists but nothing uses it.  
**Recommendation:** KEEP_CURRENT  

This component is not broken — it was never connected. It is a useful utility that the app would benefit from using in `story-details.tsx` (which has a text input that could be obscured by the keyboard). No regression risk to keeping it dormant. If the keyboard-obscures-input bug is reported, this is the fix.

---

### 4. `server/replit_integrations/` — entire directory

**Type:** Orphaned module set (4 subdirectories: `audio/`, `batch/`, `chat/`, `image/`)  
**What it does:**  
- `chat/` — OpenAI-powered multi-turn chat with conversation history stored in PostgreSQL via Drizzle ORM. Full routes: `POST /chat/message`, `GET /chat/history/:id`, `DELETE /chat/:id`.  
- `audio/` — OpenAI audio pipeline: speech-to-text, GPT-4o-audio responses, format conversion via ffmpeg. Routes for audio message/response cycle.  
- `image/` — Google Gemini image generation (separate from the main AI router). Route: `POST /generate-image`.  
- `batch/` — Rate-limiting and batch processing utilities (no routes, just helpers).  

**Current replacement:** `server/routes.ts` implements its own image generation via the multi-provider `AI Router` (Gemini → OpenAI fallback). Chat and audio have no equivalent in the current app. The main AI router (`server/ai/`) handles all text/image generation.  
**Current replacement working?** YES for image generation. Chat and audio have NO current equivalent.  
**Recommendation:** NEEDS_DECISION  

**Tradeoff:**  
- `chat/` and `audio/` represent substantial features (voice-interactive chat with memory) that do not exist anywhere in the current app. If a "chat with your hero" or "voice narration input" feature is planned, this code is ready to be wired up.  
- `image/` overlaps with the existing AI router's image generation. The replit_integrations version uses Gemini only; the AI router version has multi-provider fallback. The AI router version is superior.  
- `batch/` utilities are generic rate-limit helpers that could be useful but are currently redundant with the inline rate-limiting in routes.ts.  

**Decision needed:** Should `chat/` and `audio/` be registered in server/index.ts as additional routes (adding the chat-with-hero feature), or should this entire directory be removed as unfinished work?

---

### 5. `lib/storage.ts` — Four orphaned exports

**Type:** Orphaned exports (4 functions never called from outside lib/storage.ts)

#### 5a. `lib/storage.ts:47` — `getReadStories()`
**What it does:** Returns an array of story IDs that have been marked as read, stored in AsyncStorage under `@read_stories`.  
**Current replacement:** None — read/unread tracking is not implemented in the current UI.  
**Current replacement working?** N/A  
**Recommendation:** KEEP_CURRENT — represents an unfinished "unread indicator" feature. No harm keeping it.

#### 5b. `lib/storage.ts:56` — `markStoryRead(storyId)`
**What it does:** Adds a story ID to the read-stories list.  
**Current replacement:** None.  
**Recommendation:** KEEP_CURRENT — companion to `getReadStories()` above.

#### 5c. `lib/storage.ts:101` — `saveStoryScene(storyId, partIndex, imageDataUri)`
**What it does:** Persists a generated story scene image (base64) into a cached story record, keyed by part index.  
**Current replacement:** Scene images are generated on-demand in `story.tsx` via `/api/generate-scene` but never persisted back to the cached story. The cache is therefore scene-less on reload.  
**Current replacement working?** PARTIALLY — images generate but do NOT persist. If this function were called, scene images would survive app reload.  
**Recommendation:** RESTORE — This is a real regression. The function exists and works; it is just never called. `story.tsx` generates scenes but drops the result on the floor instead of persisting it. Calling `saveStoryScene()` after a scene is generated would restore persistence.

#### 5d. `lib/storage.ts:114` — `updateFeedback(storyId, rating, text)`
**What it does:** Attaches a `{ rating, text, timestamp }` feedback record to a saved story.  
**Current replacement:** None — the feedback/rating UI existed at some point (the `CachedStory` type in `constants/types.ts` still has a `feedback` field) but no UI currently captures or displays feedback.  
**Recommendation:** KEEP_CURRENT — represents an unfinished feedback/rating feature. Harmless.

---

### 6. Dual Settings Systems

**Type:** Duplicate implementation  

**System A (older):** `components/SettingsModal.tsx` + `constants/types.ts:UserPreferences` + `lib/storage.ts:getPreferences/savePreferences`  
- Stores in AsyncStorage key: `@preferences`  
- Covers: theme, notifications, auto-play, parental controls toggle, language  
- UI: A tabbed modal (general / voice / accessibility) opened from `create.tsx` and `profile.tsx`

**System B (newer, added by agent session):** `lib/SettingsContext.tsx` + `app/settings.tsx`  
- Stores in AsyncStorage key: `@infinity_heroes_app_settings`  
- Covers: audio volume, speed, voice, auto-play, story length, age range, auto-images, extend mode, auto-next, text size, library sort, favorites filter  
- UI: A standalone screen accessible from `index.tsx` via a gear icon

**Current replacement working?** Both are active and working independently. They do NOT sync. A user changing "auto-play" in System A's modal and "auto-play" in System B's screen are writing to different storage keys.  
**Recommendation:** NEEDS_DECISION  

**Tradeoff:**  
- System B is more comprehensive and uses proper React Context (provider pattern). System A is a standalone modal with local state.  
- System A covers some settings System B does not (language, parental controls toggle).  
- The duplicate auto-play setting is the most dangerous: two places claim to control the same behavior but write to different keys.  
- The clean solution is to migrate System A's unique settings (language, parental controls display toggle) into System B's `AppSettings` type and remove System A's preference storage. The `SettingsModal` component UI can remain as a modal shell that reads/writes from `SettingsContext` instead.

**Decision needed:** Should System A's `getPreferences/savePreferences` be migrated to use `SettingsContext`, or should both systems continue to coexist?

---

## Summary Table

| # | File / Location | Type | Recommendation | Risk if Restored/Changed |
|---|-----------------|------|----------------|--------------------------|
| 1 | `server/storage.ts:1-38` | Orphaned export | KEEP_CURRENT | None — never imported |
| 2 | `components/HeroCard.tsx:1-103` | Orphaned export / duplicate impl | NEEDS_DECISION | Medium — restoring requires create.tsx refactor |
| 3 | `components/KeyboardAwareScrollViewCompat.tsx:1-30` | Orphaned export | KEEP_CURRENT | None — never imported |
| 4 | `server/replit_integrations/` (all) | Orphaned module set | NEEDS_DECISION | Low to register chat/audio; Medium to remove |
| 5a | `lib/storage.ts:47` `getReadStories` | Orphaned export | KEEP_CURRENT | None — represents planned feature |
| 5b | `lib/storage.ts:56` `markStoryRead` | Orphaned export | KEEP_CURRENT | None — represents planned feature |
| 5c | `lib/storage.ts:101` `saveStoryScene` | Orphaned export | **RESTORE** | Low — call after scene image generated in story.tsx |
| 5d | `lib/storage.ts:114` `updateFeedback` | Orphaned export | KEEP_CURRENT | None — represents planned feature |
| 6 | `components/SettingsModal.tsx` vs `lib/SettingsContext.tsx` | Duplicate settings system | NEEDS_DECISION | High — merging requires careful state migration |

---

## One Actionable Restoration

Of the 9 candidates, **only candidate 5c (`saveStoryScene`) is a clear regression** where working code is being silently dropped on the floor. All others are either harmless scaffold or require a user decision before acting.

**Candidate 5c restoration plan:**  
In `app/story.tsx`, after a scene image is generated (the `fetchSceneImage` function succeeds and sets `sceneImages[partIndex]`), call:  
```typescript
import { saveStoryScene } from "@/lib/storage";
// After: setSceneImages(prev => ({ ...prev, [partIndex]: imageDataUri }));
saveStoryScene(currentStoryId, partIndex, imageDataUri).catch(() => {});
```  
This is a single-line addition with no user-facing impact — it silently persists generated images so they reload correctly.

---

## Awaiting approval to proceed with restorations.

Please review this report and indicate:
1. For each **NEEDS_DECISION** item — which path to take
2. Whether to apply the one **RESTORE** recommendation (5c — scene image persistence)
3. Any items marked KEEP_CURRENT that you'd prefer to clean up/delete instead
