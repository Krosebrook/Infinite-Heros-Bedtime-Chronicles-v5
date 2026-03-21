<!-- Last verified: 2026-03-21 -->
# Contributing to Infinity Heroes: Bedtime Chronicles

Thank you for your interest in contributing! This guide covers the development workflow, code standards, and process for submitting changes.

---

## Table of Contents

- [Branch Naming](#branch-naming)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Local Development Setup](#local-development-setup)
- [Release Process](#release-process)

---

## Branch Naming

Use the following prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/voice-chat-ui` |
| `fix/` | Bug fix | `fix/story-id-mismatch` |
| `chore/` | Maintenance, refactoring | `chore/upgrade-expo-55` |
| `docs/` | Documentation only | `docs/update-api-reference` |
| `security/` | Security fix | `security/rate-limit-headers` |
| `test/` | Add/update tests | `test/story-generation-unit` |

Branch names should be lowercase kebab-case, descriptive, and under 60 characters.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `security`

**Scopes (optional):** `server`, `client`, `ai`, `tts`, `audio`, `db`, `storage`, `ui`, `ci`, `docs`

**Examples:**

```
feat(ai): add OpenRouter as fourth fallback provider
fix(server): prevent path traversal in TTS audio serving
docs(api): add madlibs endpoint examples
chore(deps): upgrade expo to 55.0.0
```

- Subject line: ≤72 characters, imperative mood, no trailing period
- Body: wrap at 72 characters; explain *what* and *why*, not *how*
- Footer: reference issues with `Closes #123` or `Fixes #456`

---

## Pull Request Process

1. **Fork or branch** from `main`. Never commit directly to `main`.
2. **Open a draft PR** early to signal work-in-progress.
3. **Fill out the PR description** with:
   - What changed and why
   - How to test it
   - Screenshots/recordings for UI changes
4. **Ensure all checks pass** before requesting review:
   - `npm run typecheck` — zero TypeScript errors
   - `npm run lint` — zero lint errors
5. **Request review** from at least one maintainer when ready.
6. **Squash merge** after approval. Keep commit history clean.

---

## Code Style

The project uses ESLint with the `expo` config. Run the linter before pushing:

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix what's fixable
npm run typecheck    # Check TypeScript types
```

See [CONVENTIONS.md](./CONVENTIONS.md) for detailed naming, file organization, error handling, and API design rules.

Key rules:
- TypeScript strict mode — no `any` without an explicit comment justifying it
- React Native `StyleSheet.create()` for all styles — no inline style objects except for dynamic values
- All user-facing string inputs must pass through `sanitizeString()` before use in AI prompts
- No secrets or API keys in source code; all secrets via environment variables

---

## Testing Requirements

> **Current state:** The project does not yet have an automated test suite. Adding one (Jest or Vitest) is the top item on the [roadmap](./docs/ROADMAP.md).

Until a test framework is in place:
- Manually verify the happy path for any feature you add
- Verify error states (missing API keys, network failure, invalid input)
- For server-side changes, test with `curl` or Postman against `http://localhost:5000`

When a test framework is added, PRs touching server logic or shared utilities must include unit tests with ≥80% branch coverage for changed files.

---

## Documentation Requirements

Update documentation alongside code changes:

| Change Type | Required Doc Update |
|-------------|-------------------|
| New API endpoint | `docs/API.md` — add method, path, request/response schema |
| New environment variable | `.env.example` + `README.md` env table |
| Architecture change | `docs/ARCHITECTURE.md` |
| New significant decision | `docs/adr/` — create a new ADR |
| New component or hook | Inline JSDoc comment on the export |
| New AI provider | `docs/ARCHITECTURE.md` AI routing section + `README.md` tech stack table |
| Security change | `docs/SECURITY.md` |

All changes go in `docs/CHANGELOG.md` under `[Unreleased]` before each release.

---

## Local Development Setup

See [README.md](./README.md#quick-start) for the full setup guide.

**Quick reference:**

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — add at minimum AI_INTEGRATIONS_GEMINI_API_KEY

# Start backend
npm run server:dev   # Express on http://localhost:5000

# Start frontend (in a separate terminal)
npm run expo:dev     # Expo dev server
```

**Replit development:** Use the run button or `npm run expo:dev` — it sets the correct `EXPO_PACKAGER_PROXY_URL` and `REPLIT_DEV_DOMAIN` automatically.

**Database (optional):** Required only for voice chat. Set `DATABASE_URL` and run `npm run db:push` to create tables.

---

## Release Process

This project does not yet have a formal release pipeline. When one is established:

1. Update `docs/CHANGELOG.md` — move `[Unreleased]` items under a new version header `[x.y.z] — YYYY-MM-DD`
2. Bump `version` in `package.json`
3. Tag the commit: `git tag v<x.y.z>`
4. Push the tag: `git push origin v<x.y.z>`
5. Deploy per [docs/runbooks/deploy.md](./docs/runbooks/deploy.md)

Version numbers follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- **MAJOR** — breaking API change or major UX redesign
- **MINOR** — new feature, backward-compatible
- **PATCH** — bug fix, security patch, documentation
