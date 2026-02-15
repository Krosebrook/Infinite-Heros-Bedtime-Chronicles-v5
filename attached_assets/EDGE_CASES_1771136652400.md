# Edge Cases and Error States Documentation

Comprehensive documentation of every error handling path, edge case, and failure mode in the Infinity Heroes: Bedtime Chronicles application.

---

## Table of Contents

1. [Network Failures](#1-network-failures)
2. [AI Response Failures](#2-ai-response-failures)
3. [Audio Edge Cases](#3-audio-edge-cases)
4. [Storage Edge Cases](#4-storage-edge-cases)
5. [UI Edge Cases](#5-ui-edge-cases)
6. [PWA Edge Cases](#6-pwa-edge-cases)
7. [Server-Side API Edge Cases](#7-server-side-api-edge-cases)
8. [Error Recovery Matrix](#8-error-recovery-matrix)
9. [Graceful Degradation Table](#9-graceful-degradation-table)

---

## 1. Network Failures

### 1.1 API Timeout During Story Generation

**Source:** `AIClient.ts:128-150`, `api/generate-story.ts`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `fetch('/api/generate-story')` times out or network drops mid-request |
| **Handling** | `AIClient.retry()` catches the error. Since network errors have no `.status` property (not 4xx), they pass the retry guard at line 14. The request is retried up to 3 times with exponential backoff (1s, 2s, 4s). |
| **User Impact** | Loading screen (`LoadingFX`) shows for potentially 1s + 2s + 4s + request durations. After all retries fail, `useStoryEngine.generateStory` catches the error and sets `error` state with message `"Mission Failed: <message>"`. |
| **Recovery** | User sees error banner in Setup view with dismiss button. Can retry by pressing "ENGAGE MISSION" again. |
| **Data Impact** | None. No story data was generated or persisted. |

### 1.2 API Timeout During Image Generation (Avatar)

**Source:** `AIClient.ts:153-168`, `api/generate-avatar.ts`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `fetch('/api/generate-avatar')` fails or times out |
| **Handling** | `AIClient.retry()` with 2 retries and 1s initial delay (2 retries, not 3). Same retry logic as story generation -- non-4xx errors are retried. |
| **User Impact** | Avatar loading spinner (`isAvatarLoading`) shows during retries. On failure, `useStoryEngine.generateAvatar` sets error state: `"Avatar Error: <message>"`. If error message contains "404", the `ApiKeyDialog` is shown instead. |
| **Recovery** | User dismisses error banner. Can retry avatar generation. Story generation is not blocked by avatar failure. |
| **Data Impact** | None. `heroAvatarUrl` remains empty string. |

### 1.3 API Timeout During Scene Illustration Generation

**Source:** `AIClient.ts:170-185`, `api/generate-scene.ts`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `fetch('/api/generate-scene')` fails or times out |
| **Handling** | Same retry pattern as avatar (2 retries, 1s initial delay). |
| **User Impact** | `isSceneLoading` flag is set. On failure, error is logged via `logger.error` but NO user-visible error is displayed. If 404, ApiKeyDialog is shown. |
| **Recovery** | Silent failure. User can attempt to generate scene again. |
| **Data Impact** | None. Scene is not added to `scenes` state map. |

### 1.4 API Timeout During TTS Generation

**Source:** `NarrationManager.ts:138-163`, `api/generate-narration.ts`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `fetch('/api/generate-narration')` fails or times out |
| **Handling** | NO retry logic for TTS. Single attempt wrapped in try/catch. On failure, `console.error("TTS synthesis failed", error)` is logged. |
| **User Impact** | `isNarrationLoading` set to false in `finally` block. Narration button returns to idle state. NO user-visible error message is displayed. Audio simply does not play. |
| **Recovery** | User can press play button again to retry manually. |
| **Data Impact** | None. No audio cached. |

### 1.5 Complete Offline With No Cached Data

**Source:** `hooks/useStoryEngine.ts:19, 77-86`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `navigator.onLine` returns false, no IndexedDB cached stories |
| **Handling** | `isOnline` state is set via event listeners on `window` online/offline events. When offline: (1) Yellow banner shown: "OFFLINE MODE: Reading from Memory Jar only." (2) Generate buttons disabled via `!isOnline` check in button's `disabled` prop. (3) `generateStory` returns early with error: "You are currently offline. Please connect to the internet to generate a new story." (4) `generateAvatar` returns early with error: "You are offline. Connect to internet to generate avatar." (5) `generateScene` returns early (silent, no error message). |
| **User Impact** | Offline banner displayed at top of screen. All generation buttons disabled. Memory Jar (history) still accessible if previously loaded. |
| **Recovery** | When connectivity restored, `online` event fires, `isOnline` becomes true, buttons re-enable, banner disappears. |
| **Data Impact** | None. Read-only access to previously cached data. |

### 1.6 Offline With Cached Data (Graceful Degradation)

**Source:** `NarrationManager.ts:123-136`, `hooks/useStoryEngine.ts:70-71`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `navigator.onLine` false but IndexedDB has stories and/or audio |
| **Handling** | (1) Story history loaded from IndexedDB on init (`storageManager.getAllStories()`). (2) User can browse and load cached stories via Memory Jar. (3) Cached narration audio served from IndexedDB via `storageManager.getAudio()`. (4) In-memory audio cache (`memoryCache`) also checked first. |
| **User Impact** | Can read previously generated stories. Can listen to previously cached narration audio. Cannot generate new content. |
| **Recovery** | Automatic when online status returns. |
| **Data Impact** | Read-only. Existing data intact. |

### 1.7 Intermittent Connectivity

**Source:** `hooks/useStoryEngine.ts:77-86`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Connection drops and reconnects during a session |
| **Handling** | `online`/`offline` event listeners update `isOnline` state reactively. The offline banner appears/disappears dynamically. However, if a request is in-flight when connectivity drops, the retry logic in `AIClient.retry()` will attempt retries. There is NO AbortController usage, so in-flight fetch requests may hang until browser timeout. |
| **Gap** | No request cancellation on connectivity change. No queuing of failed requests for retry when back online. The retry mechanism only handles immediate failures, not mid-stream disconnects that cause long hangs. |

---

## 2. AI Response Failures

### 2.1 Malformed JSON From Gemini (Markdown-Wrapped)

**Source:** `AIClient.ts:139-145`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini returns JSON wrapped in markdown code fences (e.g., ````json ... ````) |
| **Handling** | Explicit stripping of markdown fences: checks for `"```json"` prefix and `"```"` prefix, strips them with regex. Handles both ```` ```json ```` and bare ```` ``` ```` fences. |
| **User Impact** | Transparent. User sees correctly parsed story. |
| **Gap** | Only strips fences at the exact start/end of string. Does not handle: (1) Leading/trailing whitespace before fences. (2) Multiple code blocks. (3) Mixed markdown content. (4) Fences with language identifiers other than `json`. |

### 2.2 Truncated JSON Response

**Source:** `AIClient.ts:145`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini response is cut off mid-JSON due to token limits or timeout |
| **Handling** | `JSON.parse(jsonStr)` throws `SyntaxError`. This propagates to the `retry()` wrapper. Since `SyntaxError` has no `.status` property, the retry guard (`error.status >= 400 && error.status < 500`) evaluates to false (undefined is not >= 400), so the error IS retried. |
| **User Impact** | After all retries, user sees `"Mission Failed: <SyntaxError message>"`. |
| **Gap** | No attempt to repair truncated JSON. No streaming/partial result handling. Retrying may yield the same truncated result if the prompt consistently produces responses exceeding token limits (especially `eternal` length stories). |

### 2.3 Empty/Null Story Parts Array

**Source:** `AIClient.ts:146-148`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini returns valid JSON but with empty or missing `parts` array |
| **Handling** | Explicit validation: `if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0)` throws `Error("Invalid story structure: 'parts' array is missing or empty.")`. This error has no `.status`, so it IS retried. |
| **User Impact** | After retries, user sees `"Mission Failed: Invalid story structure: 'parts' array is missing or empty."` |
| **Data Impact** | None. Invalid story not saved to IndexedDB. |

### 2.4 Missing Required Fields in Response

**Source:** `AIClient.ts:95-126`, `types.ts:48-56`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini omits required fields like `title`, `vocabWord`, `joke`, `lesson`, `tomorrowHook`, or `rewardBadge` |
| **Handling** | The `responseSchema` sent to Gemini specifies `required` fields, which should constrain the model. However, there is NO client-side validation beyond the `parts` array check. Missing fields result in `undefined` values that propagate to UI components. |
| **User Impact** | Components may render `undefined` as empty text. `CompletionView` would show blank badge emoji, title, description, vocabulary word, etc. No crash unless a component calls a method on `undefined` (e.g., `story.vocabWord.word` throws if `vocabWord` is null). |
| **Gap** | No defensive validation of individual fields beyond `parts`. Schema enforcement relies entirely on the AI model respecting the schema. Consider adding field-level validation with sensible defaults. |

### 2.5 Safety Filter Triggered (No Image Returned)

**Source:** `api/generate-avatar.ts:19-21`, `api/generate-scene.ts:19-21`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini image generation triggers content safety filter, returning no `inlineData` |
| **Handling** | Server checks `response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)`. If no inline data found, returns `500` with `{ error: 'No image data received' }`. Client-side, this triggers the retry mechanism (status 500 is retried). |
| **User Impact** | After retries, avatar/scene generation fails silently or shows error message depending on which generation type. |
| **Gap** | Safety filter results are deterministic for the same prompt. Retrying the identical prompt will yield the same safety block. No prompt modification or alternative image strategy is attempted. |

### 2.6 Rate Limiting (429)

**Source:** `AIClient.ts:12-18`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini API returns HTTP 429 (Too Many Requests) |
| **Handling** | In `retry()`, status 429 is explicitly excluded from the "don't retry 4xx" guard: `error.status !== 429`. So 429 errors ARE retried with exponential backoff (1s, 2s, 4s for story; 1s, 2s for images). |
| **User Impact** | Extended loading time. If all retries fail, user sees error message. |
| **Gap** | No `Retry-After` header parsing. Fixed backoff timing may not align with the rate limit window. No user notification that rate limiting is occurring. |

### 2.7 Model Overloaded (503)

**Source:** `AIClient.ts:12-18`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini API returns HTTP 503 (Service Unavailable) |
| **Handling** | Status 503 is >= 500, not in the 400-499 range, so it passes the retry guard and IS retried with exponential backoff. Server-side, `error.status` is forwarded: `res.status(error.status || 500)`. |
| **User Impact** | Same as rate limiting -- extended loading, eventual failure message. |
| **Gap** | Same as 429 -- no adaptive backoff based on server hints. |

### 2.8 No Audio Data in TTS Response

**Source:** `api/generate-narration.ts:27-29`, `NarrationManager.ts:152-159`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Gemini TTS returns response without audio data |
| **Handling** | Server checks `response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data`. If null, returns `500: 'No audio data received'`. Client throws `Error('TTS synthesis failed')`. |
| **User Impact** | Silent failure. `console.error` logged. Play button returns to idle. |
| **Gap** | No user-visible error message for narration failures. User may not understand why audio is not playing. |

---

## 3. Audio Edge Cases

### 3.1 AudioContext Suspended (Requires User Gesture)

**Source:** `NarrationManager.ts:37-46`, `SoundManager.ts:19-26`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Browser autoplay policy blocks AudioContext creation/resumption without user interaction |
| **Handling** | Both `NarrationManager.init()` and `SoundManager.init()` check `if (this.audioCtx.state === 'suspended')` and call `this.audioCtx.resume()`. `init()` is called lazily -- for NarrationManager, at the start of `fetchNarration()`, which is called from `playNarration()` (triggered by user button click). For SoundManager, `init()` is called at the start of each `playChoice()`, `playPageTurn()`, etc. |
| **User Impact** | Transparent in normal use because init is called in response to user gestures. However, in sleep mode auto-advance (`useEffect` triggering `playNarration()` at line 182-191), the first auto-play happens after user already clicked play initially, so the context should already be active. |
| **Gap** | If the AudioContext becomes suspended during a long sleep mode session (e.g., browser puts tab to sleep), the `resume()` call inside `init()` may fail silently or require a new user gesture. No explicit handling for this mid-session suspension. |

### 3.2 Safari Web Audio Quirks

**Source:** `NarrationManager.ts:39`, `SoundManager.ts:21`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Safari uses `webkitAudioContext` instead of standard `AudioContext` |
| **Handling** | Both managers use the pattern `new (window.AudioContext || (window as any).webkitAudioContext)(...)` to handle the vendor prefix. |
| **Gap** | Safari has additional quirks: (1) `createStereoPanner` may not be available -- SoundManager handles this via `createPanner()` helper which returns `null` if unavailable, and each ambient setup has a fallback path without panning. (2) Safari may not support 24kHz sample rate for AudioContext -- NarrationManager hardcodes `{ sampleRate: 24000 }` which could fail on Safari. SoundManager uses `{ sampleRate: 44100 }`. (3) No explicit error handling if AudioContext constructor throws. |

### 3.3 Corrupt Base64 Audio Data

**Source:** `NarrationManager.ts:71-79`

| Aspect | Detail |
|--------|--------|
| **Trigger** | API returns invalid/corrupt base64 string for audio data |
| **Handling** | `atob(base64)` will throw `DOMException` if the string contains invalid base64 characters. This error propagates up to the `try/catch` in `fetchNarration()` (line 161), which logs `console.error("TTS synthesis failed", error)`. |
| **User Impact** | Silent failure. No audio plays. No user-visible error. |
| **Gap** | No base64 validation before decode attempt. No fallback or user notification. |

### 3.4 PCM Decode Failure

**Source:** `NarrationManager.ts:85-102`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Audio data bytes are not valid 16-bit PCM, or byte length is odd (not evenly divisible into Int16 samples) |
| **Handling** | `decodeAudioData` creates an `Int16Array` view on the raw bytes. If data length is odd, the last byte is silently truncated. If data is not actually PCM, the resulting audio will be noise/static but won't throw an error. `ctx.createBuffer()` could throw if `frameCount` is 0 or negative. |
| **User Impact** | Could hear static/noise instead of speech. Or silent failure if buffer creation throws. |
| **Gap** | No validation of audio data format. No sanity check on decoded audio (e.g., checking if it sounds like speech vs. noise). No minimum data length check. |

### 3.5 Audio Playback Interrupted by Browser Tab Switching

**Source:** `NarrationManager.ts:169-189`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User switches browser tabs or minimizes window during audio playback |
| **Handling** | Modern browsers may suspend the AudioContext when the tab is backgrounded. The `onended` callback (line 184) will fire when the buffer source completes, even if the tab is backgrounded. However, `audioCtx.currentTime` may freeze while suspended, causing `getCurrentTime()` to return stale values. When the tab is foregrounded, the context resumes but the time tracking (`startTime`-based calculation) may be skewed. |
| **Gap** | No `visibilitychange` event listener to handle tab switching. No correction of time tracking after tab resume. The progress bar in `useNarrationSync` will show incorrect progress if the tab was backgrounded. Sleep mode auto-advance may be disrupted. |

### 3.6 Concurrent Narration Requests

**Source:** `NarrationManager.ts:110-163`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User rapidly clicks play on different parts, or sleep mode auto-advance triggers while a fetch is pending |
| **Handling** | `fetchNarration` has no request cancellation or deduplication. Multiple concurrent fetch calls can complete out of order. The last one to set `this.currentBuffer` wins, and if `autoPlay` is true, it calls `play()` which calls `stop()` first (clearing any active source). |
| **Gap** | Race condition: if request A starts, then request B starts and completes first, B's audio plays. When A completes later, it overwrites `currentBuffer` and if `autoPlay` is true, interrupts B's playback. No AbortController to cancel stale requests. The preload mechanism (fire-and-forget with `autoPlay=false`) mitigates this partially for the next-part scenario. |

### 3.7 Speed Change During Playback (Time Offset Recalculation)

**Source:** `NarrationManager.ts:51-62`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User changes playback speed while audio is playing |
| **Handling** | `setRate()` recalculates `startTime` to maintain continuity: `currentAudioTime = (now - startTime) * oldRate`, then `startTime = now - (currentAudioTime / newRate)`. Also sets `source.playbackRate.value = rate`. |
| **User Impact** | Playback speed changes smoothly without interruption. Progress tracking stays accurate. |
| **Gap** | If `setRate()` is called while paused, the rate is stored but `source.playbackRate` is not updated (no active source). On resume, `play()` creates a new source with `this.playbackRate`, so it correctly uses the new rate. However, `pausedAt` is not recalculated, which is correct since it represents absolute audio time, not wall-clock time. |

### 3.8 Pause/Resume Offset Tracking Accuracy

**Source:** `NarrationManager.ts:195-200, 169-189`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User pauses and resumes narration |
| **Handling** | `pause()` calculates `pausedAt = (audioCtx.currentTime - startTime) * playbackRate`. `play()` starts the new source at `offset = this.pausedAt` and recalculates `startTime = audioCtx.currentTime - (offset / playbackRate)`. |
| **Gap** | Potential floating-point precision drift over many pause/resume cycles. The `source.start(0, offset)` call may have slight granularity limitations depending on the browser's audio scheduling precision. For long sleep mode stories, accumulated drift could cause `getCurrentTime()` to diverge from actual playback position, affecting SyncedText word highlighting accuracy. |

### 3.9 AudioBufferSourceNode.stop() Called on Already-Stopped Source

**Source:** `NarrationManager.ts:207-209`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `stop()` called when source has already ended or been stopped |
| **Handling** | Wrapped in `try { this.source.stop(); } catch(e) {}` -- error is silently caught. Similarly, `SoundManager.stopAmbient()` at lines 480-481 wraps `s.stop()` and `l.stop()` in individual try/catch blocks. |
| **User Impact** | None. Silent error suppression is intentional here. |

---

## 4. Storage Edge Cases

### 4.1 IndexedDB Quota Exceeded

**Source:** `lib/StorageManager.ts` (all write operations)

| Aspect | Detail |
|--------|--------|
| **Trigger** | Browser storage quota exceeded, particularly with large audio buffers and base64 image data |
| **Handling** | Each write operation (`saveStory`, `saveAudio`, `savePreferences`, `saveStoryScene`, `updateFeedback`) wraps IndexedDB requests in Promises with `request.onerror = () => reject(request.error)`. The quota error will surface as a `DOMException` with name `QuotaExceededError`. |
| **User Impact** | For `saveStory` (called in `generateStory`): the error propagates and would cause story generation to appear to fail, even though the story was successfully generated. The story data is lost. For `saveAudio` (called in `fetchNarration`): the error is caught locally: `.catch(err => console.error("Save audio failed", err))`. Audio still plays but is not persisted for offline use. |
| **Gap** | No quota monitoring. No LRU eviction of old stories or audio. No user notification about storage limits. No fallback to in-memory-only operation when storage is full. |

### 4.2 IndexedDB Blocked/Unavailable (Private Browsing)

**Source:** `lib/StorageManager.ts:36-66`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Private/incognito browsing mode, or IndexedDB disabled by browser settings, or `indexedDB.open()` blocked by another connection holding a version change |
| **Handling** | `init()` wraps `indexedDB.open()` in a Promise with `request.onerror = () => reject(request.error)`. Since every storage operation calls `await this.init()` first, the rejection propagates to each caller. |
| **User Impact** | On app startup, `useStoryEngine.initData()` catches the error at line 72: `console.error("Failed to load data", e)`. Preferences fall back to `DEFAULT_PREFERENCES`. History remains empty. Story generation will fail at the `storageManager.saveStory()` step, causing the generation to appear to fail. Narration may work in-memory but won't cache. |
| **Gap** | No detection of IndexedDB availability before attempting to use it. No graceful fallback to `localStorage` or in-memory storage. No user notification that persistence is unavailable. The app could function in a fully ephemeral mode but currently doesn't have that pathway. |

### 4.3 Corrupt Stored Data

**Source:** `lib/StorageManager.ts` (all read operations)

| Aspect | Detail |
|--------|--------|
| **Trigger** | Stored data becomes corrupt (e.g., partial write, browser crash during transaction) |
| **Handling** | No data integrity validation on reads. `getAllStories()` casts results directly: `request.result as CachedStory[]`. `getAudio()` returns `request.result` directly. If data is corrupt (e.g., story object missing required fields), the corruption propagates to the UI components. |
| **Gap** | No checksums or schema validation on stored data. No try/catch around individual story deserialization in `getAllStories()` -- one corrupt entry could crash the entire list. No data repair or cleanup mechanism. |

### 4.4 Database Version Upgrade Migration

**Source:** `lib/StorageManager.ts:49-64`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `DB_VERSION` changes (currently 4), triggering `onupgradeneeded` |
| **Handling** | The upgrade handler checks for existence of each store before creating it: `if (!db.objectStoreNames.contains(STORE_NAME))`. This is additive-only -- new stores are created without modifying existing ones. Data in existing stores is preserved. |
| **Gap** | No migration logic for schema changes within existing stores. If the `CachedStory` interface changes (e.g., new required fields), existing stored data won't have those fields. No versioned data format. No migration from older data shapes to newer ones. |

### 4.5 Concurrent Read/Write

**Source:** `lib/StorageManager.ts` (all operations)

| Aspect | Detail |
|--------|--------|
| **Trigger** | Multiple async operations on the same store simultaneously (e.g., saving audio while saving story) |
| **Handling** | Each operation creates its own transaction. IndexedDB transactions are scoped to object stores, so operations on different stores (`stories` vs `audio` vs `preferences`) don't conflict. Operations on the same store are serialized by the browser's IndexedDB implementation. |
| **Gap** | `saveStoryScene` performs a read-modify-write pattern (get story, add scene, put story) within a single transaction, which is safe. However, `updateFeedback` does the same pattern. If two `updateFeedback` calls are made concurrently for the same story (unlikely but possible), the second could overwrite the first's changes since they each read the same base state. |

### 4.6 Story Not Found During Scene Save or Feedback Update

**Source:** `lib/StorageManager.ts:132-133, 153-155`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `saveStoryScene` or `updateFeedback` called with an ID that doesn't exist in the store (e.g., story was deleted concurrently) |
| **Handling** | Both functions check `if (data)` after the get request. If not found, they `reject(new Error("Story not found for scene update"))` or `reject(new Error("Story not found"))`. |
| **User Impact** | For `saveStoryScene`: error is caught in `useStoryEngine.generateScene` at line 276, logged via `logger.error`. No user-visible error. Scene still displays in current session (set in React state) but is not persisted. For `updateFeedback`: unhandled rejection since `submitFeedback` does `await storageManager.updateFeedback(...)` without try/catch. |
| **Gap** | `submitFeedback` in `useStoryEngine.ts:333-337` lacks error handling. An unhandled promise rejection will occur if the story ID is invalid. |

---

## 5. UI Edge Cases

### 5.1 Very Long Hero Names / Story Titles

**Source:** `LoadingFX.tsx:123`, `ReadingView.tsx:113-116`, `Setup.tsx:41-52`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User enters extremely long hero name or AI generates very long story title |
| **Handling** | `LoadingFX` truncates hero names over 12 characters: `heroName.substring(0, 10) + '...'` (line 123). Story titles in `ReadingView` use responsive font classes but no explicit truncation or text overflow handling. `PrepareSequel` extracts hero name from title: `cached.story.title.split(' ')[0]` which only takes the first word. |
| **Gap** | No `maxLength` attribute on hero name input fields. No CSS `text-overflow: ellipsis` or `line-clamp` on story title display. Very long names could break layout in the Memory Jar history cards or header areas. The `cacheKey` in NarrationManager uses `text.substring(0, 30)` which is safe for key length. |

### 5.2 Empty/Missing Form Fields

**Source:** `Setup.tsx:41-52`, `hooks/useStoryEngine.ts:193-206, 229-233`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User attempts to generate content without filling required fields |
| **Handling** | `checkIsReady()` validates per mode: Classic requires `heroName` and `setting` (non-empty after trim). Mad Libs requires ALL five fields non-empty. Sleep requires `heroName`. The "ENGAGE MISSION" button is disabled when `!isReady`. Additionally, `generateAvatar` checks: `if (!name || name.trim().length === 0)` and sets error "Please name your hero first!". |
| **User Impact** | Button is grayed out and unclickable. `cursor-not-allowed` class applied. |
| **Gap** | No per-field validation feedback (e.g., red borders on empty required fields). No indication of WHICH fields are missing. The `setting` field in classic mode has a default value in the AI prompt (`'a mysterious land'`) but `checkIsReady` still requires it to be non-empty in the UI. Sleep mode optional fields (`texture`, `sound`, `scent`) fall back to defaults in the AI prompt (line 82: `'softness'`, `'quietness'`, `'sweetness'`). |

### 5.3 Rapid Mode Switching During Generation

**Source:** `hooks/useStoryEngine.ts:107-119`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User switches between Classic/Mad Libs/Sleep modes while a story is generating |
| **Handling** | Mode switching updates `input.mode` via `handleInputChange`. However, `generateStory` closes over `input` at call time. If mode switches after generation starts, the in-flight request uses the original mode. The loading overlay (`LoadingFX`) adapts to the current mode visually. |
| **Gap** | Mode switching is not disabled during generation (only the launch button is disabled via `isLoading`). The mode tabs in `HeroHeader` remain interactive. If the user switches mode, the loading animation changes style but the generation continues with the original prompt. The resulting story may not match the visible mode. No request cancellation on mode switch. |

### 5.4 Double-Click on Generate Button

**Source:** `Setup.tsx:170-177`, `hooks/useStoryEngine.ts:236`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User double-clicks "ENGAGE MISSION" quickly |
| **Handling** | The button is disabled when `isLoading` is true (line 172). `generateStory` sets `isLoading(true)` synchronously at line 236. However, React state updates are batched, so two rapid clicks could potentially both pass the `isLoading` check before the first render cycle applies the disabled state. |
| **Gap** | No `useRef`-based guard for in-progress generation. The `isLoading` state guard depends on React's render cycle. In practice, React 18's automatic batching makes this unlikely but not impossible under concurrent mode. Two simultaneous API calls could result in two stories being saved. |

### 5.5 Browser Back/Forward During Story

**Source:** (No explicit handling found)

| Aspect | Detail |
|--------|--------|
| **Trigger** | User presses browser back button while reading a story |
| **Handling** | NO history API integration. The app is a single-page application with no route-based navigation. The browser back button will navigate away from the entire app. |
| **Gap** | No `popstate` event listener. No `beforeunload` warning. No URL-based state (e.g., `/story/123`). User loses their reading position entirely. Story data is persisted in IndexedDB, so they can reload from Memory Jar, but they lose current part index and narration state. |

### 5.6 Window Resize During Animations

**Source:** `HeroHeader.tsx:27-32`, `ReadingView.tsx`, `LoadingFX.tsx`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User resizes browser window during animated transitions |
| **Handling** | Layout uses responsive Tailwind classes (`md:`, `lg:` breakpoints). Framer Motion `motion.div` elements with `layoutId` will re-animate on layout changes. `useScroll`/`useTransform` in HeroHeader recalculate automatically. |
| **Gap** | Heavy animation during resize may cause jank. The `LoadingFX` component has many animated particles that are positioned with percentage-based values, which should scale. However, the progress bar and SVG progress circle in `ReadingView` have fixed pixel dimensions that may not adapt gracefully. No `ResizeObserver` for manual recalculation. |

### 5.7 Extremely Long Stories (Eternal Mode)

**Source:** `AIClient.ts:25-27, 42`, `ReadingView.tsx:119-144`

| Aspect | Detail |
|--------|--------|
| **Trigger** | User selects "eternal" story length |
| **Handling** | Eternal mode requests ~4500 words, 15-18 parts (classic) or ~30 parts in sleep mode (`15 * 2 = 30`). Each part is rendered as a `motion.section` with `whileInView` animation. Parts beyond `currentPartIndex` are blurred and non-interactive. |
| **Gap** | All parts are rendered in the DOM simultaneously (no virtualization). For a 30-part sleep story, this means 30 animated sections in the DOM, each with word-level `motion.span` elements in `SyncedText`. Could cause: (1) Slow initial render. (2) High memory usage from Framer Motion animation instances. (3) `requestAnimationFrame` polling in `useNarrationSync` runs continuously during narration, updating state every frame. (4) No pagination or windowing for long stories. |

### 5.8 Image Loading Failures in ReadingView

**Source:** `ReadingView.tsx:111`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Avatar image or scene image fails to load (corrupt base64, or image not set) |
| **Handling** | The `img` element uses `src={scenes[currentPartIndex] || input.heroAvatarUrl}`. If both are empty strings, the img element renders with an empty src, which may cause a broken image icon. No `onError` handler on the `img` element. |
| **Gap** | No fallback/placeholder image. No `onerror` handler to show a default avatar. No loading state for images. |

### 5.9 Error Banner Persistence Across Phase Changes

**Source:** `hooks/useStoryEngine.ts:237, 295, 305`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Error occurs, then user navigates to a different phase |
| **Handling** | `reset()` clears error (line 325). `loadStoryFromHistory()` clears error (line 305). `prepareSequel()` clears error (line 295). `generateStory` on success transitions to 'reading' phase (line 247), and error was cleared at line 237. |
| **User Impact** | Errors are properly cleared on all phase transitions. |

---

## 6. PWA Edge Cases

### 6.1 Service Worker Registration and Auto-Update

**Source:** `vite.config.ts:15-32`, `dist/sw.js`

| Aspect | Detail |
|--------|--------|
| **Trigger** | New deployment with updated assets |
| **Handling** | `VitePWA` configured with `registerType: 'autoUpdate'`. Service worker calls `self.skipWaiting()` and `clientsClaim()`. Precaches HTML, JS, CSS, and static assets. Uses `cleanupOutdatedCaches()` to remove stale caches. |
| **User Impact** | Updates happen automatically in the background. No user prompt for update. Next page load uses new assets. |
| **Gap** | `skipWaiting()` + `clientsClaim()` means the new service worker takes over immediately, potentially while the user is actively using the app. If the JavaScript bundle has breaking changes, the running app could reference cached old assets while new requests go to the new cache. No reload prompt to the user. |

### 6.2 Cache Invalidation

**Source:** `vite.config.ts:19-31`, `dist/sw.js`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Asset hashes change between deployments |
| **Handling** | Workbox precache manifest includes hashed filenames (`Setup-Dp_wH8XM.js`, etc.). `cleanupOutdatedCaches()` removes caches from previous service worker versions. Google Fonts use `CacheFirst` strategy with 1-year max age and 10-entry limit. |
| **Gap** | Runtime API calls (`/api/*`) are NOT cached by the service worker. Only static assets and Google Fonts are cached. The `navigateFallback: '/index.html'` ensures the shell loads offline, but all API calls will fail. No `NetworkFirst` or `StaleWhileRevalidate` strategy for API responses. |

### 6.3 Install Prompt Timing

**Source:** `vite.config.ts:17`

| Aspect | Detail |
|--------|--------|
| **Trigger** | Browser detects installable PWA criteria |
| **Handling** | `manifest: false` in VitePWA config, meaning it relies on an existing metadata file. No custom install prompt handling in app code. |
| **Gap** | No `beforeinstallprompt` event listener. No custom install UI. The browser's native install prompt (if shown) is not customized or deferred. No tracking of installation status. |

### 6.4 Multiple Tabs Open

**Source:** (No explicit handling found)

| Aspect | Detail |
|--------|--------|
| **Trigger** | User opens the app in multiple browser tabs |
| **Handling** | IndexedDB is shared across tabs. `AudioContext` is per-tab. No cross-tab communication. |
| **Gap** | Two tabs could write to the same IndexedDB story simultaneously (e.g., both saving scenes for the same story). No `BroadcastChannel` or `SharedWorker` for coordination. IndexedDB version changes in one tab would block the other tab's `onupgradeneeded` from completing until the first tab closes its connection. The singleton `NarrationManager` and `SoundManager` are per-tab, so both tabs could play audio simultaneously. |

---

## 7. Server-Side API Edge Cases

### 7.1 Missing API Key (All Endpoints)

**Source:** `api/generate-story.ts:7-8`, `api/generate-avatar.ts:7-8`, `api/generate-scene.ts:7-8`, `api/generate-narration.ts:7-8`

| Aspect | Detail |
|--------|--------|
| **Trigger** | `GEMINI_API_KEY` environment variable not set in Vercel |
| **Handling** | All four endpoints check `if (!apiKey)` and return `500: { error: 'API key not configured' }`. |
| **User Impact** | Client receives 500 error. AIClient retries (status 500 is retried). After exhausting retries, user sees "Mission Failed: API key not configured" or "Avatar Error: API key not configured". |

### 7.2 Wrong HTTP Method

**Source:** All four `api/*.ts` files, line 5

| Aspect | Detail |
|--------|--------|
| **Trigger** | GET, PUT, DELETE, etc. request to any API endpoint |
| **Handling** | All endpoints check `if (req.method !== 'POST')` and return `405: { error: 'Method not allowed' }`. |
| **User Impact** | N/A for normal app usage. Only relevant for direct API access. Client-side always uses POST. |

### 7.3 Invalid/Expired API Key

**Source:** All four `api/*.ts` catch blocks

| Aspect | Detail |
|--------|--------|
| **Trigger** | `GEMINI_API_KEY` is set but invalid or expired |
| **Handling** | Google GenAI SDK throws an error with `status` property. Server-side catch block forwards: `res.status(error.status || 500).json({ error: error.message })`. Typically returns 401 or 403. |
| **User Impact** | Client receives 4xx. AIClient retry logic does NOT retry 4xx (except 429). User sees "Mission Failed: <auth error message>". If message contains "404", ApiKeyDialog is shown. |
| **Gap** | The 404 check in client code (`error.message?.includes("404")`) is checking the error message string for "404", which may or may not match actual API authentication errors. This seems intended to detect "model not found" errors rather than auth errors. |

### 7.4 Malformed Request Body

**Source:** All four `api/*.ts` files

| Aspect | Detail |
|--------|--------|
| **Trigger** | Missing `text`, `prompt`, `systemInstruction`, etc. in request body |
| **Handling** | No explicit request body validation. Missing fields are passed to the Google GenAI SDK, which may throw. The catch block handles any thrown error. |
| **Gap** | No input sanitization. No field presence validation. No request body size limits (Vercel has its own limits). Malformed inputs could cause confusing error messages from the SDK. |

### 7.5 Vercel Serverless Function Timeout

**Source:** (Implicit -- Vercel platform limit)

| Aspect | Detail |
|--------|--------|
| **Trigger** | AI model takes longer than Vercel's function timeout (default 10s for Hobby, 60s for Pro) |
| **Handling** | Vercel terminates the function. Client receives a gateway timeout error. |
| **Gap** | Story generation with "eternal" length may take significant time. No streaming response implemented. No function timeout configuration visible. Consider Vercel Pro plan or streaming responses for long operations. |

---

## 8. Error Recovery Matrix

| Error Type | User-Visible Behavior | Recovery Action | Data Impact |
|---|---|---|---|
| **Story API timeout** | Loading screen, then red error banner: "Mission Failed: ..." | Dismiss error, retry "ENGAGE MISSION" button | None |
| **Avatar API timeout** | Avatar spinner, then error banner: "Avatar Error: ..." | Dismiss error, retry avatar generation | None |
| **Scene API timeout** | Scene loading indicator, then silent failure | Retry scene generation button | None |
| **TTS API timeout** | Play button returns to idle state | Press play again | None |
| **Malformed JSON response** | Red error banner: "Mission Failed: ..." after retries | Dismiss error, retry generation | None |
| **Empty parts array** | Red error banner: "Mission Failed: Invalid story structure..." | Dismiss error, retry generation | None |
| **Safety filter (no image)** | Avatar/scene shows blank or error after retries | Modify hero name/power, retry | None |
| **Rate limit (429)** | Extended loading (retries with backoff), then error if all fail | Wait and retry manually | None |
| **Complete offline** | Yellow "OFFLINE MODE" banner, all generate buttons disabled | Reconnect to internet | None, read-only access to cached data |
| **IndexedDB unavailable** | Console error. Generation appears to fail at save step | None available. App partially functional | Stories not persisted |
| **IndexedDB quota exceeded** | For stories: generation appears to fail. For audio: silent, audio plays but not cached | Delete old stories from Memory Jar | Partial data loss (new data not saved) |
| **AudioContext suspended** | Audio doesn't play | Click any button (user gesture), then retry play | None |
| **Corrupt audio data** | Silence or static noise | Stop and retry play | Corrupt data cached if persisting succeeded |
| **React render error** | ErrorBoundary: "POW! SPLAT!" crash screen with error message | Click "Try Again" button (resets ErrorBoundary state) | None |
| **API key not configured** | "Mission Failed: API key not configured" | Configure GEMINI_API_KEY in Vercel env vars | None |
| **API key invalid (404 trigger)** | ApiKeyDialog modal: "Secret Identity Required!" | Click "Unlock The Multiverse" to dismiss | None |
| **Vercel function timeout** | Loading screen, then error after client-side timeout/retries | Retry with shorter story length | None |

---

## 9. Graceful Degradation Table

| Capability | No Network | No IndexedDB | No Web Audio | No Service Worker |
|---|---|---|---|---|
| **View app shell** | Yes (if cached by SW) | Yes | Yes | Yes (if loaded) |
| **Generate new stories** | NO | Partially (generates but cannot save) | Yes | Yes |
| **Read cached stories** | Yes (from IndexedDB) | NO | Yes | Yes |
| **Play narration (new)** | NO | Yes (in-memory only) | NO | Yes |
| **Play narration (cached)** | Yes (from IndexedDB cache) | NO | NO | Yes |
| **Generate avatars** | NO | Yes | Yes | Yes |
| **Generate scenes** | NO | Yes | Yes | Yes |
| **Play SFX (clicks, page turns)** | Yes | Yes | NO | Yes |
| **Play ambient sounds** | Yes | Yes | NO | Yes |
| **Save preferences** | Yes | NO (uses defaults) | Yes | Yes |
| **View story history** | Yes (loaded on init) | NO (empty list) | Yes | Yes |
| **Install as PWA** | NO (needs manifest) | Yes | Yes | NO |
| **Offline navigation** | Yes (SW cached shell) | Yes | Yes | NO |
| **Word-synced text highlight** | Yes | Yes | N/A (requires audio) | Yes |
| **Mode switching** | Yes | Yes | Yes | Yes |
| **Settings persistence** | Yes (if loaded) | NO (uses defaults each session) | Yes | Yes |

### Combined Failure Scenarios

| Scenario | Outcome |
|---|---|
| **No Network + No IndexedDB** | App shell loads (if SW cached). No stories viewable. No generation possible. Essentially a blank shell. |
| **No Network + No Service Worker** | App fails to load entirely if not in browser cache. |
| **No IndexedDB + No Web Audio** | Stories generate and display but cannot be saved or narrated. Text-only, ephemeral experience. |
| **No Web Audio + No Network** | Can read cached stories from IndexedDB (text only). No audio of any kind. |
| **All four unavailable** | App cannot function at all. |

---

## Appendix: Error Handling Code Locations

| File | Line(s) | Error Type |
|---|---|---|
| `AIClient.ts` | 9-18 | Retry logic with exponential backoff |
| `AIClient.ts` | 134-136 | HTTP error construction with status |
| `AIClient.ts` | 140-144 | Markdown fence stripping |
| `AIClient.ts` | 145 | JSON.parse failure |
| `AIClient.ts` | 146-148 | Story structure validation |
| `AIClient.ts` | 161-163, 178-180 | Image generation HTTP errors |
| `NarrationManager.ts` | 43-45 | AudioContext resume from suspended |
| `NarrationManager.ts` | 124-136 | IndexedDB audio cache miss |
| `NarrationManager.ts` | 146-148 | TTS HTTP error |
| `NarrationManager.ts` | 155 | Audio save failure (fire-and-forget) |
| `NarrationManager.ts` | 161-163 | TTS synthesis catch-all |
| `NarrationManager.ts` | 208 | Source.stop() on already-stopped node |
| `SoundManager.ts` | 23-25 | AudioContext resume from suspended |
| `SoundManager.ts` | 109-113 | StereoPanner fallback for Safari |
| `SoundManager.ts` | 480-481 | Safe stop for sources and LFOs |
| `hooks/useStoryEngine.ts` | 19 | navigator.onLine initial state |
| `hooks/useStoryEngine.ts` | 72-74 | Init data load failure |
| `hooks/useStoryEngine.ts` | 156 | Preload failure (fire-and-forget) |
| `hooks/useStoryEngine.ts` | 159-163 | Narration play failure |
| `hooks/useStoryEngine.ts` | 194-196 | Offline guard for avatar |
| `hooks/useStoryEngine.ts` | 202-204 | Empty name guard for avatar |
| `hooks/useStoryEngine.ts` | 217-223 | Avatar generation failure |
| `hooks/useStoryEngine.ts` | 230-233 | Offline guard for story |
| `hooks/useStoryEngine.ts` | 250-257 | Story generation failure |
| `hooks/useStoryEngine.ts` | 264 | Offline/loading guard for scene |
| `hooks/useStoryEngine.ts` | 276-278 | Scene generation failure |
| `lib/StorageManager.ts` | 42 | IndexedDB open error |
| `lib/StorageManager.ts` | 77, 90 | Preferences read/write errors |
| `lib/StorageManager.ts` | 112, 131-136 | Story save/scene update errors |
| `lib/StorageManager.ts` | 152-158 | Feedback update errors |
| `lib/StorageManager.ts` | 173, 184 | Story list/delete errors |
| `lib/StorageManager.ts` | 197, 208 | Audio save/get errors |
| `components/ErrorBoundary.tsx` | 34-36 | getDerivedStateFromError |
| `components/ErrorBoundary.tsx` | 38-40 | componentDidCatch logging |
| `components/ErrorBoundary.tsx` | 59 | State reset on "Try Again" |
| `api/generate-story.ts` | 5-8 | Method/API key guards |
| `api/generate-story.ts` | 25-28 | Catch-all with status forwarding |
| `api/generate-avatar.ts` | 5-8, 20-21 | Method/API key/no-image guards |
| `api/generate-avatar.ts` | 28-31 | Catch-all with status forwarding |
| `api/generate-scene.ts` | 5-8, 20-21 | Method/API key/no-image guards |
| `api/generate-scene.ts` | 28-31 | Catch-all with status forwarding |
| `api/generate-narration.ts` | 5-8, 28-29 | Method/API key/no-audio guards |
| `api/generate-narration.ts` | 33-36 | Catch-all with status forwarding |
| `useApiKey.ts` | 11-14 | Always returns true (server-side key) |
