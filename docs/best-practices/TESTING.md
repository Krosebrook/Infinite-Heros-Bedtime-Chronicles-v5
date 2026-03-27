# Testing Best Practices

> Infinity Heroes: Bedtime Chronicles v5 -- Comprehensive Testing Guide

**Current status:** 585 passing tests across 14 files, all green.

---

## 1. Testing Framework & Configuration

### Stack

- **Vitest v4** -- fast, ESM-native test runner
- **@vitest/coverage-v8** -- V8-based code coverage provider
- **TypeScript** -- all tests written in `.test.ts`

### Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'lib/**/*.test.ts', 'shared/**/*.test.ts'],
    exclude: ['node_modules', 'server_dist', 'static-build'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'server/replit_integrations/**',
        'server/templates/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
      },
    },
    testTimeout: 10000,
  },
});
```

Key settings:

| Setting | Value | Why |
|---|---|---|
| `globals: true` | Enables `describe`, `it`, `expect` without imports (though we import them explicitly for clarity) | Convenience |
| `environment: 'node'` | Tests run in a Node.js context, not jsdom | Server-focused codebase |
| `testTimeout: 10000` | 10-second timeout per test | Prevents hanging async tests |
| `thresholds.branches: 80` | CI fails if branch coverage drops below 80% | Quality gate |

### Test File Naming

- **Unit tests:** `<module>.test.ts` -- placed alongside the source file
- **Comprehensive tests:** `<module>.comprehensive.test.ts` -- deeper coverage of the same module
- Both patterns are valid and picked up by the `include` globs.

---

## 2. Test Structure Conventions

### describe / it / expect Pattern

All tests follow the nested `describe` / `it` / `expect` structure. Group by **feature**, then by **function**, then by **scenario**.

```typescript
// From server/ai/router.comprehensive.test.ts
describe('AIRouter', () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter();
  });

  describe('registerProvider', () => {
    it('registers a single provider', () => {
      const provider = createMockProvider('gemini');
      router.registerProvider(provider);
      expect(router.getProvider('gemini' as any)).toBe(provider);
    });

    it('overwrites a provider with the same name', () => {
      const p1 = createMockProvider('gemini', { textResponse: 'v1' });
      const p2 = createMockProvider('gemini', { textResponse: 'v2' });
      router.registerProvider(p1);
      router.registerProvider(p2);
      expect(router.getProvider('gemini' as any)).toBe(p2);
    });
  });

  describe('generateText', () => {
    const baseReq: TextGenerationRequest = {
      systemPrompt: 'You are a storyteller',
      userPrompt: 'Tell me a story',
    };

    it('throws when no providers available', async () => {
      await expect(router.generateText('story', baseReq)).rejects.toThrow(
        /No AI providers available/
      );
    });
  });
});
```

### Rules of Thumb

1. **Descriptive test names** -- each `it(...)` should read as a sentence explaining the expected behavior: `'blocks 6th request per user'`, `'locks out after 5 failures'`.
2. **`beforeEach` for state reset** -- clear mocks and shared state before every test to prevent leakage.
3. **One assertion focus per test** -- prefer a single logical assertion per `it(...)`. Multiple `expect` calls are fine when they verify facets of the same outcome.

---

## 3. What to Test (Coverage Map)

| Source File | Test File(s) | Status |
|---|---|---|
| `server/ai/router.ts` | `router.test.ts`, `router.comprehensive.test.ts` | Covered |
| `server/routes.ts` | `routes.test.ts`, `routes.comprehensive.test.ts` | Covered (logic mirrors) |
| `server/elevenlabs.ts` | `elevenlabs.test.ts`, `elevenlabs.comprehensive.test.ts` | Covered |
| `server/auth.ts` | `auth.comprehensive.test.ts`, `security-fixes.test.ts` | Covered |
| `server/storage.ts` | `storage.comprehensive.test.ts` | Covered |
| `server/video.ts` | `video.comprehensive.test.ts` | Covered |
| `lib/storage.ts` | `storage.test.ts`, `storage.comprehensive.test.ts` | Covered |
| `lib/query-client.ts` | `query-client.test.ts` | Partial |
| `shared/schema.ts` | `schema.comprehensive.test.ts` | Covered |

**Total:** 14 test files, 585 tests, all passing.

---

## 4. Mocking Patterns

### AsyncStorage Mock

Client-side storage tests run in Node, so AsyncStorage must be fully mocked. This pattern provides a working in-memory key-value store:

```typescript
// From lib/storage.comprehensive.test.ts
const mockStore: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStore[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { mockStore[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete mockStore[key]; }),
    clear: vi.fn(async () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
  },
}));

// Reset between tests
beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  vi.clearAllMocks();
});
```

### AI Provider Mock (`createMockProvider`)

The router tests use a factory function that produces configurable mock providers:

```typescript
// From server/ai/router.comprehensive.test.ts
function createMockProvider(
  name: string,
  opts: {
    available?: boolean;
    text?: boolean;
    image?: boolean;
    streaming?: boolean;
    textResponse?: string;
    shouldFail?: boolean;
    failMessage?: string;
  } = {}
): AIProvider {
  const {
    available = true,
    text = true,
    image = false,
    streaming = false,
    textResponse = '{"title":"Test Story"}',
    shouldFail = false,
    failMessage = 'Provider error',
  } = opts;

  return {
    name: name as any,
    displayName: `Mock ${name}`,
    isAvailable: () => available,
    capabilities: { text, image, streaming },
    generateText: shouldFail
      ? vi.fn().mockRejectedValue(new Error(failMessage))
      : vi.fn().mockResolvedValue({
          text: textResponse,
          provider: name,
          model: `${name}-model`,
        } as TextGenerationResponse),
    generateImage: image
      ? shouldFail
        ? vi.fn().mockRejectedValue(new Error(failMessage))
        : vi.fn().mockResolvedValue({
            imageDataUri: 'data:image/png;base64,abc',
            provider: name,
            model: `${name}-model`,
          } as ImageGenerationResponse)
      : undefined,
    generateTextStream: streaming
      ? vi.fn(async function* () {
          yield { text: 'chunk1', done: false };
          yield { text: 'chunk2', done: true };
        })
      : undefined,
  };
}
```

This pattern lets you test:

- Fallback chains (`shouldFail: true` on primary, secondary picks up)
- Availability filtering (`available: false`)
- Capability gating (`image: true/false`, `streaming: true/false`)

### Constants Mocks

When testing client modules that depend on app constants, mock them at the top of the test file:

```typescript
// From lib/storage.comprehensive.test.ts
vi.mock('@/constants/types', () => ({
  DEFAULT_PREFERENCES: { audioVolume: 80, narratorVoice: 'moonbeam' },
  DEFAULT_PARENT_CONTROLS: { pin: null, isLocked: false, dailyLimit: 0 },
  BADGE_DEFINITIONS: [
    { id: 'first_adventure', emoji: '...', title: 'First Adventure', description: '...', condition: 'first_story' },
    { id: 'night_owl', emoji: '...', title: 'Night Owl', description: '...', condition: 'night_story' },
    // ... remaining badge definitions
  ],
  CachedStory: {},
  StoryFull: {},
  UserPreferences: {},
  ChildProfile: {},
  EarnedBadge: {},
  StreakData: {},
  ParentControls: {},
}));

vi.mock('@/constants/heroes', () => ({
  HEROES: [
    { id: 'nova' }, { id: 'coral' }, { id: 'orion' }, { id: 'luna' },
    { id: 'nimbus' }, { id: 'bloom' }, { id: 'whistle' }, { id: 'shade' },
  ],
}));
```

**Important:** `vi.mock()` calls are hoisted to the top of the file by Vitest. Always place them before your `import` statements for the module under test.

---

## 5. Testing Security Fixes

The project has a dedicated `server/security-fixes.test.ts` file that covers all critical security behaviors. Use the patterns below when adding new security features.

### Rate Limiter Behavior

```typescript
// From server/security-fixes.test.ts
describe('per-user rate limiter', () => {
  const USER_RATE_LIMIT_MAX = 5;
  const USER_RATE_LIMIT_WINDOW_MS = 60 * 1000;
  let userRateLimitMap: Map<string, { count: number; resetAt: number }>;

  function checkUserRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = userRateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
      userRateLimitMap.set(userId, { count: 1, resetAt: now + USER_RATE_LIMIT_WINDOW_MS });
      return true;
    }
    entry.count++;
    return entry.count <= USER_RATE_LIMIT_MAX;
  }

  beforeEach(() => {
    userRateLimitMap = new Map();
  });

  it('allows first 5 requests per user', () => {
    for (let i = 0; i < USER_RATE_LIMIT_MAX; i++) {
      expect(checkUserRateLimit('user1')).toBe(true);
    }
  });

  it('blocks 6th request per user', () => {
    for (let i = 0; i < USER_RATE_LIMIT_MAX; i++) {
      checkUserRateLimit('user1');
    }
    expect(checkUserRateLimit('user1')).toBe(false);
  });

  it('tracks users independently', () => {
    for (let i = 0; i < USER_RATE_LIMIT_MAX; i++) {
      checkUserRateLimit('user1');
    }
    expect(checkUserRateLimit('user1')).toBe(false);
    expect(checkUserRateLimit('user2')).toBe(true); // Different user, fresh quota
  });

  it('resets after window expires', () => {
    userRateLimitMap.set('user1', {
      count: USER_RATE_LIMIT_MAX + 1,
      resetAt: Date.now() - 1, // Expired
    });
    expect(checkUserRateLimit('user1')).toBe(true);
  });
});
```

Test these scenarios for rate limiters:

- Requests within the limit pass
- The N+1 request is blocked
- Different users/IPs are tracked independently
- The window expiration resets the counter
- Dual-layer (IP + user) both must pass

### Auth Middleware (Production Guard, Dev Mode, Token Validation)

```typescript
// From server/auth.comprehensive.test.ts
describe('production mode (Firebase configured)', () => {
  it('rejects request without Authorization header', () => {
    const authHeader: string | undefined = undefined;
    const hasBearerToken = authHeader?.startsWith('Bearer ');
    expect(hasBearerToken).toBeFalsy();
  });

  it('rejects request with non-Bearer auth', () => {
    const authHeader = 'Basic abc123';
    expect(authHeader.startsWith('Bearer ')).toBe(false);
  });

  it('extracts token correctly from valid Bearer header', () => {
    const authHeader = 'Bearer eyJhbGciOiJSUzI1NiJ9.test.sig';
    const token = authHeader.slice(7);
    expect(token).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
  });
});
```

Test these auth scenarios:

- Production mode blocks when Firebase key is missing
- `AUTH_DISABLED` env var overrides the production guard
- Dev mode assigns anonymous user with IP as uid
- Missing, malformed, and valid Bearer tokens
- Error responses never leak internal details (no Firebase, token, or stack references)

### PIN Hashing (Lockout Thresholds, Expiry, Counter Reset)

```typescript
// From server/security-fixes.test.ts
describe('lockout logic', () => {
  const MAX_PIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30 * 1000;

  it('not locked out initially', () => {
    expect(isPinLockedOut({ failedAttempts: 0, lockoutUntil: 0 })).toBe(false);
  });

  it('locks out after 5 failures', () => {
    let c: Controls = { failedAttempts: 0, lockoutUntil: 0 };
    for (let i = 0; i < 5; i++) {
      c = recordFailedAttempt(c);
    }
    expect(c.lockoutUntil).toBeGreaterThan(Date.now());
    expect(c.failedAttempts).toBe(0); // Reset after lockout triggers
  });

  it('lockout expires after 30 seconds', () => {
    const c: Controls = { failedAttempts: 0, lockoutUntil: Date.now() - 1 };
    expect(isPinLockedOut(c)).toBe(false);
  });
});
```

Test these PIN scenarios:

- Clean state is not locked
- Incremental failures below threshold do not lock
- The 5th failure triggers lockout and resets the counter
- Lockout is active during the 30-second window
- Lockout expires once the window passes

### Conversation ID Validation

```typescript
// From server/security-fixes.test.ts
describe('conversation ID validation', () => {
  it('accepts valid positive integer', () => {
    expect(parseConversationId('42')).toBe(42);
  });

  it('rejects zero', () => {
    expect(parseConversationId('0')).toBeNull();
  });

  it('rejects negative numbers', () => {
    expect(parseConversationId('-1')).toBeNull();
  });

  it('rejects non-numeric strings', () => {
    expect(parseConversationId('abc')).toBeNull();
  });

  it('rejects path traversal attempts', () => {
    expect(parseConversationId('../1')).toBeNull();
  });
});
```

---

## 6. Running Tests

```bash
# Single run (all tests)
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Run a specific test file
npx vitest run server/ai/router.comprehensive.test.ts

# Run tests matching a pattern
npx vitest run --grep "rate limiter"

# Run only tests in one directory
npx vitest run server/
```

---

## 7. Coverage Targets

| Metric | Threshold | Enforced |
|---|---|---|
| Branches | 80% minimum | Yes (CI fails below) |
| Lines | -- | Not enforced (recommended >= 70%) |
| Functions | -- | Not enforced (recommended >= 70%) |
| Statements | -- | Not enforced (recommended >= 70%) |

### Current Stats

- **585 tests** across **14 files**, all passing
- Branch coverage meets the 80% threshold

### Coverage Exclusions

These paths are excluded from coverage measurement:

- `server/replit_integrations/**` -- platform integration code, not unit-testable
- `server/templates/**` -- HTML/static templates
- `**/*.test.ts` -- test files themselves
- `**/index.ts` -- barrel exports / entry points

---

## 8. Known Limitations

### Routes Tested via Logic Mirrors

Route tests (`routes.test.ts`, `routes.comprehensive.test.ts`) verify business logic by mirroring the handler functions rather than sending real HTTP requests. This catches logic bugs but misses middleware ordering, header parsing, and Express routing issues.

**Recommendation:** Add HTTP-level integration tests using [supertest](https://github.com/ladjs/supertest) for critical API endpoints.

### No React Native Component Tests

The project has no tests for React Native UI components (screens, navigation, animations). All tests target server-side and client-side logic modules.

**Recommendation:** Add component tests using [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/) for screens that contain conditional rendering or user interaction logic.

### No End-to-End Tests

There are no E2E tests that exercise the full app from the user's perspective (launch, navigate, generate story, play audio).

**Recommendation:** Evaluate [Detox](https://wix.github.io/Detox/) or [Maestro](https://maestro.mobile.dev/) for E2E test coverage of critical user flows.

### AsyncStorage is Mocked

Client storage tests use an in-memory mock of AsyncStorage. They validate the serialization/deserialization logic and state management, but do not exercise real device storage behavior (quota limits, persistence across app restarts, platform differences).

---

## 9. Adding New Tests Checklist

When adding a new feature or module, follow this checklist:

1. **Create the test file** alongside the source file:
   - `server/my-feature.ts` -> `server/my-feature.test.ts`
   - For deeper coverage later: `server/my-feature.comprehensive.test.ts`

2. **Cover all paths:**
   - Happy path (expected input, expected output)
   - Error cases (invalid input, thrown exceptions, rejected promises)
   - Edge cases (empty arrays, null values, boundary numbers)
   - Boundary values (rate limits at N-1, N, N+1; timeouts at 0, max, max+1)

3. **Mock all external dependencies:**
   - AI providers -- use the `createMockProvider` factory
   - Text-to-speech (ElevenLabs) -- mock the SDK client
   - AsyncStorage -- use the in-memory mock pattern
   - Firebase Auth -- mock `verifyIdToken` and admin SDK
   - Database -- mock Drizzle queries or use an in-memory SQLite
   - Environment variables -- set/unset in `beforeEach`

4. **Verify coverage:**
   ```bash
   npm run test:coverage
   ```
   Confirm that branch coverage remains at or above **80%**. If a new module drops coverage below the threshold, add tests before merging.

5. **Add to CI** (if not already present):
   Ensure `npm test` and `npm run test:coverage` are steps in your CI pipeline. The coverage threshold enforcement in `vitest.config.ts` will cause CI to fail if branches drop below 80%.

6. **Security-sensitive code** gets its own dedicated test section:
   - Auth changes -> update `auth.comprehensive.test.ts` or `security-fixes.test.ts`
   - New rate limits -> add threshold, window, and reset tests
   - New input validation -> add positive, negative, and adversarial input tests
   - Error responses -> verify no internal details are leaked

---

## Quick Reference

```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report
npx vitest run <file>       # Run one file
npx vitest run --grep "X"   # Run tests matching pattern
```

**Test file locations:**
```
server/ai/router.test.ts
server/ai/router.comprehensive.test.ts
server/routes.test.ts
server/routes.comprehensive.test.ts
server/elevenlabs.test.ts
server/elevenlabs.comprehensive.test.ts
server/auth.comprehensive.test.ts
server/security-fixes.test.ts
server/storage.comprehensive.test.ts
server/video.comprehensive.test.ts
lib/storage.test.ts
lib/storage.comprehensive.test.ts
lib/query-client.test.ts
shared/schema.comprehensive.test.ts
```
