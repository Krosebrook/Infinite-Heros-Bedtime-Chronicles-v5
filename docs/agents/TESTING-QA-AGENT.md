<!-- Last verified: 2026-03-26 -->
# TESTING-QA-AGENT.md — Testing & QA Expert

Specialized agent context for all work touching the test suite, test patterns, mocking strategies, and quality assurance.

---

## Domain Scope

This agent is authoritative for:
- `vitest.config.ts` — Test runner configuration
- `lib/storage.test.ts` — AsyncStorage helper tests
- `lib/query-client.test.ts` — React Query client tests
- `server/routes.test.ts` — API route tests
- All `*.test.ts` files across the codebase
- Mocking strategy for AI providers, ElevenLabs, and AsyncStorage
- Test coverage targets and reporting

---

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Test runner | Vitest v4 |
| Coverage | @vitest/coverage-v8 |
| Mocking | Vitest built-in mocks (`vi.mock`, `vi.fn`) |
| React testing | @testing-library/react-native (if added) |

---

## Commands

```bash
npm test                # vitest run (single pass, CI-friendly)
npm run test:watch      # vitest (watch mode, development)
npm run test:coverage   # vitest run --coverage (generates lcov report)
```

---

## Test File Conventions

| Convention | Rule |
|-----------|------|
| File location | `<module>.test.ts` alongside the source file |
| Naming | `describe('<module name>', () => { it('<behavior>', ...) })` |
| Server tests | `server/<module>.test.ts` |
| Client tests | `lib/<module>.test.ts` |
| Component tests | `components/<Name>.test.tsx` |

Examples:
- `lib/storage.ts` → `lib/storage.test.ts`
- `server/routes.ts` → `server/routes.test.ts`
- `lib/query-client.ts` → `lib/query-client.test.ts`

---

## Test Coverage Targets

- **Server utilities:** ≥80% branch coverage
- **Client storage helpers:** ≥80% branch coverage
- **AI router:** ≥80% branch coverage
- **Happy path + empty/null input + API failure path** must be covered for every external-API-calling module

---

## Vitest Configuration (`vitest.config.ts`)

Key settings:
- `environment`: `node` for server tests, `jsdom` for client/React tests
- `globals: true` — `describe`, `it`, `expect`, `vi` available without imports
- `coverage.provider`: `v8`
- TS path aliases (`@/*`, `@shared/*`) are resolved

---

## Mocking Strategy

### AI Providers — Always Mock in Tests

```typescript
// vi.mock before imports
vi.mock('@/server/ai/index', () => ({
  generateText: vi.fn().mockResolvedValue('Mock story text'),
  generateImage: vi.fn().mockResolvedValue('data:image/png;base64,...'),
}));
```

### ElevenLabs TTS — Always Mock

```typescript
vi.mock('@/server/elevenlabs', () => ({
  generateTTS: vi.fn().mockResolvedValue('/tmp/tts-cache/abcdef1234.mp3'),
  VOICE_MAP: {
    moonbeam: { id: 'voice-id-1', name: 'Laura' },
  },
}));
```

### AsyncStorage — Always Mock in Client Tests

```typescript
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
}));
```

### Express App — Use Supertest

```typescript
import request from 'supertest';
import { createApp } from '@/server/index';

const app = createApp();

it('POST /api/generate-story returns 200', async () => {
  const res = await request(app)
    .post('/api/generate-story')
    .send({ heroName: 'Nova', theme: 'courage', /* ... */ });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('title');
});
```

---

## Test Structure Pattern

Every test file should follow this structure:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// imports...

// Mock external dependencies BEFORE other imports that use them
vi.mock('dependency', () => ({ ... }));

describe('ModuleName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('functionName', () => {
    it('returns expected result for valid input', async () => {
      // Arrange
      const input = buildValidInput();
      // Act
      const result = await functionUnderTest(input);
      // Assert
      expect(result).toMatchObject({ key: 'value' });
    });

    it('handles empty/null input gracefully', async () => {
      await expect(functionUnderTest(null)).rejects.toThrow();
    });

    it('handles API failure and returns error', async () => {
      vi.mocked(externalApi).mockRejectedValueOnce(new Error('Network error'));
      const result = await functionUnderTest(validInput);
      expect(result).toBeNull(); // or check error response
    });
  });
});
```

---

## Required Test Paths

For each new feature, cover these three paths:

| Path | Description |
|------|-------------|
| **Happy path** | Valid input, all dependencies succeed, expected output |
| **Empty/null input** | Missing required fields, empty strings, null values |
| **API failure** | External dependency (AI, ElevenLabs, DB) throws error |

---

## Input Sanitization Tests

`sanitizeString()` and `sanitizeErrorMessage()` should be tested with:
- Normal strings (passthrough)
- Very long strings (truncation at limit)
- Strings with injection characters (`<script>`, SQL metacharacters)
- Empty string and null
- Unicode characters

---

## Storage Tests (`lib/storage.test.ts`)

Storage functions to cover:
- `saveStory` / `getStories` — CRUD round-trip
- `saveProfile` / `getProfiles` / `getActiveProfile`
- `saveBadge` / `getBadges`
- `saveStreak` / `getStreak`
- `markStoryRead` / `getReadStories`
- `toggleFavorite` / `getFavoriteStories`
- `getParentControls` / `saveParentControls`
- Settings save/load round-trip
- Legacy `@infinity_heroes_preferences` migration

---

## What Tests Must NOT Do

- **Never** call real AI provider APIs in tests (cost + flakiness)
- **Never** write to a real database in unit tests (use mocks or in-memory)
- **Never** call real ElevenLabs TTS in tests
- **Never** read from real AsyncStorage in tests (mock it)
- **Never** remove or modify unrelated existing tests

---

## CI Integration

Tests run in CI via `.github/workflows/ci.yml`. The pipeline runs:
```bash
npm run typecheck && npm run lint && npm test
```

All tests must pass before merging. Coverage report is generated as an artifact.

---

## Related Agent Files

- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — Server route patterns to test
- [`AI-INTEGRATION-AGENT.md`](./AI-INTEGRATION-AGENT.md) — AI router mocking strategy
- [`FRONTEND-MOBILE-AGENT.md`](./FRONTEND-MOBILE-AGENT.md) — Client patterns to test
- [`DEVOPS-DEPLOYMENT-AGENT.md`](./DEVOPS-DEPLOYMENT-AGENT.md) — CI pipeline context
