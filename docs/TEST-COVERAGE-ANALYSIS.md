# Test Coverage Analysis

## Current State

**The codebase has zero automated tests.** There are no test files, no test framework configured, and no test script in `package.json`. The project currently relies solely on TypeScript type checking and ESLint for code quality.

## Recommended Test Framework Setup

Install **Vitest** (fast, TypeScript-native, compatible with the existing Vite/ESBuild toolchain):

```bash
npm install -D vitest @testing-library/react-native @testing-library/jest-native
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Priority Areas for Test Coverage

### 1. Badge & Streak Logic (`lib/storage.ts:282-335`) — HIGH PRIORITY

The `checkAndAwardBadges()` function contains the core gamification logic with 12 distinct badge conditions evaluated via a switch statement. This is complex, purely algorithmic, and highly testable.

**What to test:**
- Each of the 12 badge conditions triggers correctly (first_story, night_story, morning_story, all_heroes, madlibs_3, sleep_3, classic_5, streak_3, streak_7, total_10, total_25, vocab_5)
- Duplicate badge prevention (same badge not awarded twice)
- Time-of-day badges (night_owl at hour >= 20, early_bird at 5 <= hour < 10)
- Edge cases: exactly at thresholds (e.g., exactly 3 madlibs stories)

**Why it matters:** Badge logic is user-visible — awarding wrong badges or missing them affects the child's experience directly. The time-based badges depend on `new Date()` which makes them easy to get wrong without tests.

### 2. Streak Calculation (`lib/storage.ts:252-280`) — HIGH PRIORITY

The `updateStreak()` function has date arithmetic to determine consecutive days. Date math is notoriously error-prone.

**What to test:**
- First-ever story creates a streak of 1
- Same-day story doesn't increment streak
- Consecutive-day story increments currentStreak
- Gap of 2+ days resets currentStreak to 1
- `longestStreak` is preserved when current streak resets
- `longestStreak` updates when currentStreak exceeds it

**Why it matters:** The streak calculation uses `new Date()` and day-diff arithmetic. Timezone edge cases (story at 11:59 PM vs 12:01 AM) could break streaks. This logic is impossible to verify manually for all cases.

### 3. AI Router Fallback Logic (`server/ai/router.ts:54-93`) — HIGH PRIORITY

The `AIRouter.generateText()` method implements a multi-provider fallback chain with JSON validation. This is critical infrastructure.

**What to test:**
- Successful response from the first provider returns immediately
- First provider failure falls through to second provider
- All providers failing throws the last error
- JSON mode validation: rejects non-JSON responses and tries next provider
- JSON mode validation: rejects malformed JSON and tries next provider
- Empty provider chain throws descriptive error
- Provider availability filtering works correctly

**Why it matters:** If the fallback logic has bugs, the app silently fails to generate stories or uses the wrong provider. The JSON cleaning regex (`/\{[\s\S]*\}/`) could also match incorrectly.

### 4. Rate Limiter (`server/routes.ts:52-61`) — MEDIUM PRIORITY

The `checkRateLimit()` function is a simple sliding-window rate limiter. It's small but critical for abuse prevention.

**What to test:**
- First request from an IP is allowed
- Requests up to `RATE_LIMIT_MAX` are allowed
- Request at `RATE_LIMIT_MAX + 1` is denied
- After window expires, requests are allowed again
- Different IPs have independent limits

### 5. Input Sanitization (`server/routes.ts:70-73`) — MEDIUM PRIORITY

The `sanitizeString()` function is the first line of defense against malicious input for all API endpoints.

**What to test:**
- Non-string input returns empty string
- Strings longer than maxLen are truncated
- Whitespace is trimmed
- `undefined`, `null`, numbers, objects all return empty string

### 6. Story Prompt Construction (`server/routes.ts:149-295`) — MEDIUM PRIORITY

Functions `getPartCount()`, `getWordCount()`, `getStorySystemPrompt()`, and `getStoryUserPrompt()` build the AI prompts. These are pure functions, making them ideal test candidates.

**What to test:**
- `getPartCount()` returns correct values for each duration
- `getWordCount()` returns correct ranges for each duration
- `getStorySystemPrompt()` includes correct mode-specific rules
- Sleep mode prompt excludes choices instruction
- Mad Libs prompt includes provided words
- Classic mode includes optional setting/tone/sidekick/problem when provided
- Child safety rules are always included

### 7. Client Storage CRUD Operations (`lib/storage.ts:26-178`) — MEDIUM PRIORITY

The storage layer manages stories, profiles, favorites, and preferences via AsyncStorage.

**What to test:**
- `toggleFavorite()`: adds new favorite, removes existing favorite
- `saveStory()` / `getAllStories()`: round-trip persistence, sorted by timestamp descending
- `saveProfile()`: creates new profile, updates existing profile by ID
- `deleteProfile()`: removes only the targeted profile
- `saveStoryScene()`: attaches scene to correct story, no-ops for missing story
- `getPreferences()`: returns defaults when no data stored

### 8. TTS File Path Validation (`server/routes.ts:550-568`) — MEDIUM PRIORITY

The `/api/tts-audio/:file` endpoint validates filenames and prevents path traversal.

**What to test:**
- Valid hex filename with `.mp3` extension is served
- Path traversal attempts (`../../etc/passwd`) are rejected
- Filenames with non-hex characters are rejected
- Missing files return 404

### 9. API Route Integration Tests (`server/routes.ts:297-769`) — LOW PRIORITY (but high value)

End-to-end tests for the Express routes with mocked AI providers.

**What to test:**
- `POST /api/generate-story`: validates required fields, returns proper story structure
- `POST /api/generate-story`: rate limiting returns 429
- `POST /api/generate-avatar`: validates heroName required
- `POST /api/tts`: rejects text exceeding MAX_TTS_TEXT_LENGTH
- `GET /api/health`: returns status ok
- `GET /api/voices`: returns voice list with defaults

### 10. Settings Migration (`lib/SettingsContext.tsx`) — LOW PRIORITY

The SettingsContext includes migration logic from legacy preferences. If this breaks, users lose their settings on update.

**What to test:**
- Fresh install uses default preferences
- Legacy preferences are migrated correctly
- Already-migrated preferences are not re-migrated

---

## Summary Table

| Area | Files | Risk if Untested | Effort to Test | Priority |
|------|-------|-------------------|----------------|----------|
| Badge awarding logic | `lib/storage.ts` | High — wrong badges shown | Low (pure logic) | HIGH |
| Streak calculation | `lib/storage.ts` | High — broken streaks | Low (date math) | HIGH |
| AI Router fallbacks | `server/ai/router.ts` | High — story gen fails | Medium (mocks) | HIGH |
| Rate limiter | `server/routes.ts` | Medium — abuse risk | Low | MEDIUM |
| Input sanitization | `server/routes.ts` | Medium — security | Low | MEDIUM |
| Prompt construction | `server/routes.ts` | Medium — bad stories | Low (pure funcs) | MEDIUM |
| Storage CRUD | `lib/storage.ts` | Medium — data loss | Medium (mock AS) | MEDIUM |
| TTS path validation | `server/routes.ts` | High — path traversal | Low | MEDIUM |
| API route integration | `server/routes.ts` | Medium — broken API | High (full setup) | LOW |
| Settings migration | `lib/SettingsContext.tsx` | Low — one-time issue | Low | LOW |

## Quick Win: First 3 Test Files to Create

1. **`__tests__/badges.test.ts`** — Test all 12 badge conditions and streak logic with mocked AsyncStorage
2. **`__tests__/ai-router.test.ts`** — Test fallback chains, JSON validation, and error propagation with mock providers
3. **`__tests__/routes-utils.test.ts`** — Test `sanitizeString`, `checkRateLimit`, `getPartCount`, `getWordCount`, and prompt builders
