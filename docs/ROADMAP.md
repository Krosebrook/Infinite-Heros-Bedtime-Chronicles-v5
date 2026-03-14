# Development Roadmap

**Last Updated:** 2026-03-13

Items are scored using Weighted Shortest Job First (WSJF): `(Business Value + Time Criticality + Risk Reduction) / Job Size`

## Completed

| Item | Category | Date |
|------|----------|------|
| Unify dual settings systems | Bug Fix | 2026-03-13 |
| Add security headers | Security | 2026-03-13 |
| Wire up voice chat routes | Feature | 2026-03-13 |
| Resolve dead code triage | Maintenance | 2026-03-13 |
| Restore saveStoryScene persistence | Bug Fix | 2026-03-13 |
| Fix storyId mismatch in completion | Bug Fix | 2026-03-13 |
| Create comprehensive documentation | Docs | 2026-03-13 |
| Update .env.example | Docs | 2026-03-13 |

## Backlog (Prioritized)

### High Priority (WSJF > 8)

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 1 | Add testing framework (Jest/Vitest) | 8 | 5 | 8 | 3 | 7.0 | No tests exist; prevents regressions |
| 2 | Upgrade to Expo SDK 55 | 5 | 8 | 5 | 3 | 6.0 | Removes need for expo-asset patch (TODO in patches/) |
| 3 | Add `npm audit` to CI | 3 | 5 | 8 | 2 | 8.0 | Zero effort, high security value |

### Medium Priority (WSJF 4-8)

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 4 | Build voice chat UI screen | 8 | 3 | 2 | 5 | 2.6 | Backend routes ready; needs Expo screen + audio recording |
| 5 | Use HeroCard.tsx in quick-create | 3 | 2 | 1 | 2 | 3.0 | Reuse orphaned component |
| 6 | Add KeyboardAwareScrollView to forms | 3 | 3 | 2 | 1 | 8.0 | Component exists, just needs wiring |
| 7 | Implement read/unread story indicators | 3 | 2 | 1 | 2 | 3.0 | Storage functions exist (getReadStories/markStoryRead) |
| 8 | Build story feedback/rating UI | 3 | 2 | 1 | 3 | 2.0 | Storage function exists (updateFeedback) |

### Low Priority (WSJF < 4)

| # | Item | Value | Criticality | Risk | Size | WSJF | Notes |
|---|------|-------|-------------|------|------|------|-------|
| 9 | Add persistent rate limiting (Redis) | 3 | 1 | 3 | 3 | 2.3 | Current in-memory is sufficient for single-instance |
| 10 | Add authentication | 5 | 1 | 3 | 8 | 1.1 | Only needed if costs become a concern |
| 11 | Encrypt client-side storage | 2 | 1 | 2 | 5 | 1.0 | Data is non-sensitive (stories, badges) |

## Dependencies

- Item 2 (Expo 55) blocks removal of `patches/expo-asset+12.0.12.patch`
- Item 4 (Voice chat UI) depends on audio recording permissions and expo-av
- Item 10 (Auth) would require significant architecture changes

## Tracked TODOs in Code

| Location | TODO | Blocked By |
|----------|------|------------|
| `patches/expo-asset+12.0.12.patch:9` | Remove HTTPS dev server patch | Expo SDK 55 upgrade |
