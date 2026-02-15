# Edge Cases Priority Matrix & Unfixed Risks

This document identifies gaps NOT covered by the existing EDGE_CASES.md documentation - specifically, risks that have no current handling and need fixes before production deployment.

---

## P0 - Must Fix Before Deployment

### RISK-1: Dead-End Story (No Choices on Non-Final Part)

**Location**: `ReadingView.tsx:130-141`

**Problem**: In classic/madlibs mode, if the AI generates a part with empty `choices` array before the final part, the user has no way to advance. The choices block only renders when `part.choices && part.choices.length > 0`. Without choices, there's no "Continue" button either.

**Impact**: User gets permanently stuck. Only escape is "Menu" button (loses all progress).

**Likelihood**: Medium - Gemini sometimes returns fewer choices than requested, especially on shorter stories.

**Fix**: Add a fallback "Continue the Adventure" button when a non-final part has no choices in classic/madlibs mode:

```tsx
// After the choices nav in ReadingView.tsx
{i === currentPartIndex && (!part.choices || part.choices.length === 0)
  && i < story.parts.length - 1 && !isSleepMode && (
  <button onClick={() => onChoice('continue')}
    className="comic-btn mt-8 p-4 bg-green-500 text-white rounded-2xl border-4 border-black">
    Continue the Adventure →
  </button>
)}
```

---

### RISK-2: Mobile AudioContext Autoplay Failure (Sleep Mode)

**Location**: `useStoryEngine.ts:166-191`, `NarrationManager.ts:175-195`

**Problem**: Sleep mode auto-advances between parts and auto-plays narration. On mobile browsers (especially iOS Safari), AudioContext requires a user gesture for EACH play call, not just the first. The auto-advance at line 173 calls `playNarration()` via `setTimeout`, which may not have gesture context.

**Impact**: Narration silently stops after the first part. Sleep mode's core feature (continuous auto-narration) breaks on mobile.

**Likelihood**: High on iOS, Medium on Android Chrome.

**Fix**: The `NarrationManager.play()` method should be `async` and call `await this.audioCtx.resume()` before starting playback. Additionally, consider using a continuous `AudioBufferSourceNode` chain rather than stopping and starting.

---

### RISK-3: No API Error Differentiation for User

**Location**: `useStoryEngine.ts:250-261`

**Problem**: All Gemini API errors surface as "Mission Failed: {message}". Users can't distinguish between rate limiting (temporary, wait and retry), invalid API key (config issue), content filtering (change inputs), or server outage (nothing to do).

**Impact**: Users repeatedly retry when they should wait, or give up when a simple input change would fix it.

**Fix**: Parse error status codes and provide specific guidance:
- 429: "The storytelling engine is busy. Please wait 30 seconds and try again."
- 400: "Something about your story setup confused the AI. Try different inputs."
- 403: "API access denied. Check your Gemini API key configuration."
- 500+: "The AI service is temporarily down. Please try again later."

---

## P1 - Fix Soon After Launch

### RISK-4: Tab Backgrounding Desyncs Narration Highlighting

**Location**: `hooks/useNarrationSync.ts:32-54`

**Problem**: `requestAnimationFrame` pauses when the tab is backgrounded, but `AudioContext` may continue playing. When the user returns, the word highlighting jumps to catch up or shows wrong position.

**Fix**: Add `document.addEventListener('visibilitychange', ...)` to resync `narrationTime` from `narrationManager.getCurrentTime()` when tab becomes visible.

---

### RISK-5: No Request Cancellation

**Location**: `AIClient.ts` (all fetch calls), `NarrationManager.ts:141`

**Problem**: If a user clicks "Menu" to return to setup while a story is generating, the fetch continues in background. The response will still trigger `setStory` and `setPhase('reading')`, potentially flashing the reading view unexpectedly.

**Fix**: Pass an `AbortController.signal` to all fetch calls. Abort in the `reset()` callback of `useStoryEngine`.

---

### RISK-6: Narration Cache Key Weakness

**Location**: `NarrationManager.ts:115`

**Problem**: Cache key `v1:{voice}:{text.substring(0,30)}_{text.length}` is weak. Two parts starting with the same 30 characters and having the same total length would collide. The `substring(0, 30)` could also split a multi-byte Unicode character.

**Fix**: Use a proper hash function (e.g., `crypto.subtle.digest('SHA-256', ...)` or a simple djb2 hash of the full text).

---

## P2 - Address When Convenient

### RISK-7: IndexedDB Storage Exhaustion

**Location**: `lib/StorageManager.ts`

**Problem**: No storage quota monitoring. Each story with avatar + scenes + audio can consume 1-5MB. Heavy usage will eventually hit browser limits (Safari ~1GB, Chrome ~quota-based).

**Fix**: Check `navigator.storage.estimate()` on app load. Warn user when >80% full. Add "Clear Audio Cache" in settings.

---

### RISK-8: Large Image Upload via HeroHeader

**Location**: `HeroHeader.tsx:62-73`

**Problem**: Custom avatar upload has no size limit. A 50MB raw iPhone photo gets converted to base64 and stored in React state, then persisted to IndexedDB. This could crash the tab.

**Fix**: Validate max 5MB file size. Resize via Canvas API to 512x512 JPEG before storing.

---

### RISK-9: Service Worker Strategy Post-Migration

**Location**: `sw.js` (being replaced by vite-plugin-pwa)

**Problem**: If vite-plugin-pwa is not configured with proper update strategy, users could get stuck on stale cached versions indefinitely.

**Fix**: Configure `registerType: 'autoUpdate'` in vite-plugin-pwa config. Or add a manual "Update Available" toast.

---

### RISK-10: SyncedText Performance on Very Long Parts

**Location**: `components/SyncedText.tsx`

**Problem**: The component splits text into sentences, then words, and creates individual `motion.span` for EVERY word. An "eternal" sleep story part could have 400+ words, each with independent `animate` props updating at 60fps via requestAnimationFrame.

**Fix**: Only animate words within the active sentence (skip rendering motion spans for non-active sentences). Use CSS transitions instead of framer-motion for word highlighting.

---

## P3 - Low Priority / Cosmetic

### RISK-11: Framer Motion layoutId Conflicts

If `HeroHeader` is ever rendered more than once (e.g., in a modal preview), `layoutId="activeTab"` would conflict and cause animation glitches.

### RISK-12: Settings Not Synced Across Tabs

Preferences saved in one tab via IndexedDB won't reflect in another open tab until reload.

### RISK-13: Sleep Mode Ambient Audio Overlaps Narration

`SoundManager` plays ambient sounds (rain, forest, etc.) simultaneously with narration. No ducking or volume reduction of ambient when narration starts. On mobile speakers, this can make narration hard to hear.

**Fix**: Reduce ambient volume to 20% when `isNarrating` is true.

---

## Summary Table

| ID | Risk | Severity | Status | Effort |
|----|------|----------|--------|--------|
| RISK-1 | Dead-end story (no choices) | P0 | Unfixed | 15 min |
| RISK-2 | Mobile AudioContext autoplay | P0 | Unfixed | 1 hour |
| RISK-3 | Generic API error messages | P0 | Unfixed | 30 min |
| RISK-4 | Tab backgrounding desync | P1 | Unfixed | 30 min |
| RISK-5 | No request cancellation | P1 | Unfixed | 45 min |
| RISK-6 | Weak narration cache key | P1 | Unfixed | 20 min |
| RISK-7 | IndexedDB quota exhaustion | P2 | Unfixed | 1 hour |
| RISK-8 | Large image upload | P2 | Unfixed | 45 min |
| RISK-9 | SW update strategy | P2 | Unfixed | 30 min |
| RISK-10 | SyncedText performance | P2 | Unfixed | 1 hour |
| RISK-11 | layoutId conflicts | P3 | Unfixed | N/A |
| RISK-12 | Multi-tab settings sync | P3 | Unfixed | N/A |
| RISK-13 | Ambient/narration overlap | P3 | Unfixed | 20 min |
