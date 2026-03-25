# Test Coverage Analysis — Full Codebase Audit

## Current State

**The codebase has zero automated tests.** There are no test files, no test framework configured, and no test script in `package.json`. The project relies solely on TypeScript strict mode and ESLint for code quality.

**Codebase scope:** ~55 production TypeScript/TSX files across frontend screens (15), components (10), client libraries (4), server modules (6), AI provider layer (7), shared schemas (2), and Replit integrations (11).

## Recommended Test Framework Setup

Install **Vitest** (fast, TypeScript-native, compatible with the existing ESBuild toolchain):

```bash
npm install -D vitest @testing-library/react-native @testing-library/jest-native supertest
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Note: The project uses `@/*` path aliases via `tsconfig.json` — the Vitest config must resolve these.

---

## Priority Areas for Test Coverage

### 1. Badge & Streak Logic (`lib/storage.ts:252-335`) — CRITICAL

The `checkAndAwardBadges()` function contains the core gamification logic with 12 distinct badge conditions evaluated via a switch statement. The `updateStreak()` function uses date arithmetic to determine consecutive-day streaks.

**What to test:**
- Each of the 12 badge conditions triggers correctly (first_story, night_story, morning_story, all_heroes, madlibs_3, sleep_3, classic_5, streak_3, streak_7, total_10, total_25, vocab_5)
- Duplicate badge prevention (same badge not awarded twice for same profile)
- Time-of-day badges (night_owl at hour >= 20, early_bird at 5 <= hour < 10)
- Edge cases: exactly at thresholds (e.g., exactly 3 madlibs stories, exactly 10 total)
- First-ever story creates a streak of 1
- Same-day story doesn't increment streak
- Consecutive-day story increments currentStreak
- Gap of 2+ days resets currentStreak to 1
- `longestStreak` is preserved when current streak resets
- `longestStreak` updates when currentStreak exceeds it

**Known bugs/risks found in audit:**
- `updateStreak()` uses `new Date(streak.lastStoryDate)` — timezone-sensitive. A story at 11:59 PM could calculate as the same day or next day depending on locale.
- `checkAndAwardBadges()` condition `vocab_5` checks `totalStories >= 5` rather than counting actual vocabulary words learned — this appears to be a logic error.
- Badge `all_heroes` compares `uniqueHeroes.size >= HEROES.length` (8), but custom heroes aren't in the HEROES array, so using only custom heroes would never earn this badge.

**Why it matters:** Badge logic is user-visible and gamification is a core product feature for children. Wrong badges or missing streaks directly degrade the child's experience.

---

### 2. AI Router Fallback Logic (`server/ai/router.ts:54-148`) — CRITICAL

The `AIRouter` class implements multi-provider fallback chains for text, streaming, and image generation. This is the backbone of all content generation.

**What to test:**
- Successful response from the first provider returns immediately
- First provider failure falls through to second provider
- All providers failing throws the last error
- JSON mode validation: rejects non-JSON responses and tries next provider
- JSON mode validation: rejects malformed JSON and tries next provider
- Empty provider chain throws descriptive error
- Provider availability filtering respects `isAvailable()` and capability checks
- Streaming skips providers without `generateTextStream` or `streaming` capability
- Image generation skips providers without `generateImage` method
- Default chain fallback returns `["gemini", "openai"]` for unknown task types

**Known bugs found in audit:**
- **Greedy JSON regex** (line 71): `\{[\s\S]*\}` is greedy — if the AI response contains multiple JSON objects, it matches from the first `{` to the *last* `}`, potentially grabbing garbage between them. Should use `\{[\s\S]*?\}` or a proper JSON extractor.
- **Parsed JSON discarded** (line 78): The router validates JSON by parsing it, then discards the result. The caller re-parses the raw text again in `routes.ts`, duplicating work and risking inconsistency.
- **Streaming model name bug** (line 113): `model: provider.name` reports the provider name as the model, not the actual model ID (e.g., "gemini" instead of "gemini-2.5-flash").

---

### 3. Server Security Layer (`server/routes.ts:52-73, 550-568`) — HIGH

The rate limiter, input sanitizer, and file-serving endpoints are the first line of defense.

**What to test — Rate Limiter (`checkRateLimit`):**
- First request from an IP is allowed
- Requests up to `RATE_LIMIT_MAX` are allowed
- Request at `RATE_LIMIT_MAX + 1` is denied
- After window expires, requests are allowed again
- Different IPs have independent limits
- Cleanup interval removes expired entries

**What to test — Input Sanitization (`sanitizeString`):**
- Non-string input (`undefined`, `null`, numbers, objects) returns empty string
- Strings longer than maxLen are truncated
- Whitespace is trimmed
- Empty string input returns empty string

**What to test — TTS Audio File Serving:**
- Valid hex filename with `.mp3` extension is served
- Path traversal attempts (`../../../etc/passwd`) are rejected by regex
- Path traversal attempts that pass regex but resolve outside cache dir are rejected by `path.resolve` check
- Filenames with non-hex characters are rejected
- Missing files return 404

**Known risk:** Rate limiter is in-memory only — resets on server restart. No persistence, no distributed coordination.

---

### 4. Story Prompt Construction (`server/routes.ts:149-295`) — HIGH

Pure functions `getPartCount()`, `getWordCount()`, `getStorySystemPrompt()`, and `getStoryUserPrompt()` build the AI prompts. Bugs here produce wrong story structures or unsafe content.

**What to test:**
- `getPartCount()` returns correct values: short=3, medium-short=4, medium=5, long=6, epic=7, unknown=5
- `getWordCount()` returns correct ranges for each duration
- `getStorySystemPrompt()` includes mode-specific rules (classic/madlibs/sleep)
- Sleep mode prompt says "do NOT include choices"
- Classic/madlibs prompt says "include exactly 3 choices"
- `CHILD_SAFETY_RULES` are included in every prompt regardless of mode
- Mad Libs prompt includes all provided words (up to 20, sanitized)
- Classic mode includes optional setting/tone/sidekick/problem when provided
- Sleep mode includes soundscape description when provided
- Child name is woven into prompt when provided
- Default soundscape is "peaceful quiet" when no soundscape selected

---

### 5. ElevenLabs Voice System (`server/elevenlabs.ts`) — HIGH

Voice selection, mode-based adjustments, and TTS generation.

**What to test:**
- `getVoicesForMode()` returns only voices matching the mode's category
- Voice fallback: unknown voice key defaults to "moonbeam" configuration
- Sleep mode override: non-sleep voices get stability boosted, style reduced, speaker_boost disabled
- Audio buffer concatenation from streaming chunks produces valid audio
- Missing API credentials throw descriptive error

**Known risk:** `generateSpeech()` has no error handling — any ElevenLabs API failure will throw an unhandled error up to the route handler.

---

### 6. Video Generation Pipeline (`server/video.ts`) — HIGH

Job lifecycle management with polling, caching, and file download.

**What to test:**
- `isVideoAvailable()` returns false when no API key is set
- `createVideoJob()` creates a job with "pending" status and starts polling
- Job transitions: pending → processing → completed (or → failed)
- Polling times out after 60 attempts (10 minutes) and marks job as failed
- Downloaded video file path is stored correctly
- `getVideoJob()` returns null for expired jobs (30-minute TTL)
- Cache cleanup removes files older than 24 hours
- `getVideoFilePath()` returns null if file doesn't exist on disk (even if job record exists)

**Known risk:** Race condition — file existence check in `getVideoFilePath()` is non-atomic. File could be deleted by cache cleanup between the check and the `res.sendFile()` call.

---

### 7. Client Storage CRUD Operations (`lib/storage.ts:26-206`) — MEDIUM

The storage layer manages stories, profiles, favorites, and preferences via AsyncStorage.

**What to test:**
- `toggleFavorite()`: adds new favorite, removes existing favorite (toggle behavior)
- `saveStory()` / `getAllStories()`: round-trip persistence, sorted by timestamp descending
- `saveStoryWithProfile()`: attaches profileId to story correctly
- `getStoriesForProfile()`: filters only stories matching profileId
- `saveProfile()`: creates new profile, updates existing profile by ID
- `deleteProfile()`: removes only the targeted profile, leaves others intact
- `saveStoryScene()`: attaches scene to correct story, no-ops for missing story ID
- `updateFeedback()`: attaches feedback to correct story, no-ops for missing story ID
- `getPreferences()` / `getParentControls()`: return defaults when no data stored
- `setActiveProfileId(null)`: removes the key from storage

**Known risk:** All functions silently catch errors and return empty defaults — data corruption would be invisible to the user.

---

### 8. Settings Context Migration (`lib/SettingsContext.tsx`) — MEDIUM

The SettingsContext manages 27 app settings with a reducer pattern and includes a one-time migration from legacy storage.

**What to test:**
- Fresh install loads `DEFAULT_SETTINGS` (27 fields with correct defaults)
- Legacy preferences under `@infinity_heroes_preferences` migrate to new key
- `MIGRATION_DONE_KEY` flag prevents re-migration on subsequent loads
- `isLoaded` flag prevents writing to AsyncStorage during initial load
- `UPDATE` action shallow-merges without overwriting other fields
- `RESET` action returns to `DEFAULT_SETTINGS`
- Corrupt JSON in storage is handled gracefully (doesn't crash the app)

**Known risk:** Silent error swallowing — AsyncStorage read/write failures are caught with empty catch blocks. Users could lose settings without knowing.

---

### 9. Parent Controls (`components/ParentControlsModal.tsx`) — MEDIUM

PIN-based access control, bedtime scheduling, and theme filtering.

**What to test:**
- PIN comparison: correct PIN unlocks, wrong PIN clears input
- No PIN set = automatically unlocked (no gate)
- PIN set requires minimum 4 digits
- PIN remove clears the code entirely
- Bedtime hour wraps correctly (23+1=0, 0-1=23)
- Bedtime minute wraps correctly (59+1=0, 0-1=59)
- 24-hour to 12-hour AM/PM conversion is correct for all hours
- Theme toggle prevents empty selection (at least one theme required)
- Story length selection persists immediately

**Known risk:** No brute force protection on PIN — unlimited attempts with no lockout or delay.

---

### 10. Profile Management (`lib/ProfileContext.tsx`, `components/ProfileModal.tsx`) — MEDIUM

Multi-child profile lifecycle with auto-activation.

**What to test:**
- Creating a profile auto-activates it
- Deleting the active profile sets active to null
- Deleting a non-active profile doesn't change the active profile
- Switching to a non-existent profile ID sets active to null
- Profile name validation: empty/whitespace-only names rejected
- Profile name max length: 20 characters
- Age range constrained to 3-9

**Known risk:** No confirmation dialog on profile deletion — immediate, irreversible removal of all profile data.

---

### 11. API Route Integration Tests (`server/routes.ts:297-769`) — MEDIUM

End-to-end tests for Express routes with mocked AI providers.

**What to test:**
- `GET /api/health`: returns `{ status: "ok", timestamp: <number> }`
- `GET /api/voices`: returns voice list with mode defaults
- `GET /api/video-available`: reflects `isVideoAvailable()` state
- `POST /api/generate-story`: validates heroName required (400), rate limits (429), returns valid story JSON
- `POST /api/generate-story`: mode falls back to "classic", duration falls back to "medium" for invalid values
- `POST /api/generate-avatar`: validates heroName required (400)
- `POST /api/generate-scene`: validates sceneText required (400)
- `POST /api/tts`: rejects text exceeding `MAX_TTS_TEXT_LENGTH` (5000 chars)
- `POST /api/tts`: caches audio by md5 hash of voice+mode+text
- `GET /api/tts-audio/:file`: serves cached files, rejects invalid names
- `GET /api/music/:mode`: validates mode against `VALID_MODES`, serves file
- `POST /api/suggest-settings`: validates and clamps suggestion values against known enums
- `POST /api/generate-video`: validates sceneText required (400)
- `GET /api/video-status/:id`: returns 404 for unknown job ID
- `GET /api/video/:id`: validates hex-only job ID pattern

---

### 12. AI Provider Implementations (`server/ai/providers/*.ts`) — MEDIUM

Four provider files implementing the `AIProvider` interface.

**What to test:**
- Each provider's `isAvailable()` returns true only when required env vars are set
- Each provider's `capabilities` object is accurate (text, image, streaming flags)
- Gemini: JSON mode sets `responseMimeType: "application/json"`
- Gemini: thinking budget passed as `thinkingConfig`
- OpenAI: prefers integrations client for text, direct client for images
- OpenAI: handles both `b64_json` and `url` image response formats
- Anthropic: extracts first "text" content block, returns "" if none
- OpenRouter: factory creates 4 providers with correct model IDs (grok-3-mini, mistral-small-3.1, command-a, llama-4-scout)
- All providers throw descriptive errors when not configured

---

### 13. Batch Processing (`server/replit_integrations/batch/utils.ts`) — LOW

Concurrency-limited batch processing with retry logic.

**What to test:**
- `isRateLimitError()` detects 429 status, "RATELIMIT_EXCEEDED", "quota", "rate limit" in error messages
- `batchProcess()` respects concurrency limit (default 2)
- Rate limit errors trigger retries with exponential backoff
- Non-rate-limit errors abort immediately (no retry)
- Results maintain original item order despite parallel execution
- `batchProcessWithSSE()` emits events in correct sequence: started → processing → progress → complete
- Failed items tracked separately with error count

---

### 14. Audio/Voice Chat Integration (`server/replit_integrations/audio/`) — LOW

Voice processing pipeline with format detection, conversion, and streaming.

**What to test:**
- `detectAudioFormat()` identifies WAV, WebM, MP3, MP4, OGG from magic bytes
- Unknown format returns "unknown"
- `convertToWav()` spawns FFmpeg and cleans up temp files
- SSE message pipeline: user_transcript → transcript deltas → audio deltas → done
- 50MB body limit enforced

---

### 15. Screen-Level Business Logic — LOW (but high user impact)

Complex state management in screen components that could be extracted and tested.

**What to test in `app/story.tsx`:**
- Story generation request constructs correct payload from 10+ route params
- Reading time calculation: `wordCount * MS_PER_WORD`, minimum `MIN_READING_TIME_MS`
- Sleep timer countdown decrements correctly and auto-stops
- Video polling stops on completion or failure
- Mode-specific music volume adjustment

**What to test in `app/completion.tsx`:**
- First story sets onboarding complete flag
- Streak updated before badges checked (ordering matters)
- Save button disabled after first save (no duplicate saves)
- Scene images saved with correct story ID and part indices

**What to test in `app/madlibs.tsx`:**
- Minimum 3 of 6 words required (not all 6)
- Whitespace-only values don't count as filled
- Words trimmed before passing to story generation

**What to test in `app/(tabs)/library.tsx`:**
- Profile-aware loading: with profile loads filtered, without loads all
- Relative date formatting: today, yesterday, X days ago, month+day
- Favorite toggle updates local state immediately
- Delete confirmation prevents accidental removal

**What to test in `app/(tabs)/create.tsx`:**
- AI suggestion values validated against known enums before applying
- Mode change resets speed and voice to mode-appropriate defaults
- Hero change invalidates stale suggestions

---

## Bugs & Code Issues Found During Audit

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| Wrong badge condition | `lib/storage.ts:316` | Medium | `vocab_5` checks `totalStories >= 5` instead of counting vocabulary words learned |
| Greedy JSON regex | `server/ai/router.ts:71` | High | `\{[\s\S]*\}` matches first `{` to last `}` — could grab invalid JSON if response has multiple objects |
| Parsed JSON discarded | `server/ai/router.ts:78` | Low | JSON is validated then thrown away; caller re-parses, wasting cycles and risking inconsistency |
| Wrong model in stream | `server/ai/router.ts:113` | Low | Reports `provider.name` as model instead of actual model ID |
| No error handling in TTS | `server/elevenlabs.ts` | Medium | `generateSpeech()` has no try/catch — API failures propagate as unhandled errors |
| Race condition in video | `server/video.ts:174` | Low | File existence check is non-atomic with `sendFile()` — cache cleanup could delete between check and serve |
| Silent data loss | `lib/storage.ts`, `lib/SettingsContext.tsx` | Medium | All storage errors silently caught with empty catch blocks — users never know when data is lost |
| No PIN brute force protection | `components/ParentControlsModal.tsx` | Medium | Unlimited PIN attempts with no lockout, delay, or logging |
| No delete confirmation | `components/ProfileModal.tsx` | Low | Profile deletion is immediate with no confirmation dialog |
| Relative path in suno.ts | `server/suno.ts` | Low | `path.resolve()` with relative paths depends on CWD — fragile if server started from different directory |

---

## Summary Table

| # | Area | Files | Risk if Untested | Effort | Priority |
|---|------|-------|------------------|--------|----------|
| 1 | Badge & streak logic | `lib/storage.ts` | High — wrong badges, broken streaks | Low | CRITICAL |
| 2 | AI Router fallbacks | `server/ai/router.ts` | High — story gen fails silently | Medium | CRITICAL |
| 3 | Security layer (rate limit, sanitize, paths) | `server/routes.ts` | High — abuse, path traversal | Low | HIGH |
| 4 | Story prompt construction | `server/routes.ts` | Medium — wrong story structure | Low | HIGH |
| 5 | ElevenLabs voice system | `server/elevenlabs.ts` | Medium — wrong voice, no audio | Medium | HIGH |
| 6 | Video generation pipeline | `server/video.ts` | Medium — stuck jobs, lost video | Medium | HIGH |
| 7 | Client storage CRUD | `lib/storage.ts` | Medium — silent data loss | Medium | MEDIUM |
| 8 | Settings migration | `lib/SettingsContext.tsx` | Medium — lost preferences | Low | MEDIUM |
| 9 | Parent controls | `ParentControlsModal.tsx` | Medium — bypassed controls | Low | MEDIUM |
| 10 | Profile management | `ProfileContext/Modal` | Low — orphaned data | Low | MEDIUM |
| 11 | API route integration | `server/routes.ts` | Medium — broken endpoints | High | MEDIUM |
| 12 | AI provider implementations | `server/ai/providers/*` | Medium — wrong models/configs | Medium | MEDIUM |
| 13 | Batch processing | `replit_integrations/batch` | Low — failed retries | Low | LOW |
| 14 | Audio/voice chat | `replit_integrations/audio` | Low — broken voice chat | High | LOW |
| 15 | Screen business logic | `app/*.tsx` | Medium — broken UX flows | High | LOW |

---

## Recommended Implementation Plan

### Phase 1: Foundation (Week 1)
Set up Vitest, configure path aliases, create test utilities (AsyncStorage mock, AI provider mock factory).

**Create these 3 test files:**
1. **`__tests__/unit/badges-and-streaks.test.ts`** — All 12 badge conditions, streak arithmetic, edge cases around day boundaries
2. **`__tests__/unit/ai-router.test.ts`** — Fallback chains, JSON validation, streaming provider selection, error propagation
3. **`__tests__/unit/routes-utils.test.ts`** — `sanitizeString`, `checkRateLimit`, `getPartCount`, `getWordCount`, prompt builders

### Phase 2: Server Coverage (Week 2)
4. **`__tests__/unit/elevenlabs.test.ts`** — Voice selection, mode overrides, credential validation
5. **`__tests__/unit/video.test.ts`** — Job lifecycle, polling, cache cleanup, timeout handling
6. **`__tests__/integration/api-routes.test.ts`** — Supertest-based route tests with mocked AI router

### Phase 3: Client Coverage (Week 3)
7. **`__tests__/unit/storage-crud.test.ts`** — All storage functions with mocked AsyncStorage
8. **`__tests__/unit/settings-migration.test.ts`** — Migration logic, default loading, corruption handling
9. **`__tests__/unit/parent-controls.test.ts`** — PIN validation, time wrapping, theme filtering

### Phase 4: CI/CD (Week 4)
10. Add GitHub Actions workflow: lint + typecheck + test on every PR
11. Add test coverage reporting with minimum threshold (aim for 60% on server, 40% on client)
