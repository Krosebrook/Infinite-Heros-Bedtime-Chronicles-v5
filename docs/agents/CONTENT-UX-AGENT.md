<!-- Last verified: 2026-03-26 -->
# CONTENT-UX-AGENT.md — Children's UX & Content Expert

Specialized agent context for all work touching children's user experience, the gamification system, badge awarding, reading streaks, and age-appropriate content design.

---

## Domain Scope

This agent is authoritative for:
- `app/(tabs)/index.tsx` — Home screen UX and content layout
- `app/(tabs)/profile.tsx` — Child profile experience
- `app/trophies.tsx` — Badge collection and achievements display
- `app/completion.tsx` — Post-story celebration and badge awarding
- `app/welcome.tsx` — Onboarding flow
- `app/quick-create.tsx` — Fast hero creation modal
- `components/ParentControlsModal.tsx` — Parent controls UX
- `components/ProfileModal.tsx` — Profile management UX
- `lib/storage.ts` badge, streak, profile, and feedback helpers
- `constants/heroes.ts` — Hero template definitions
- Badge system (12 achievements)
- Reading streak logic
- Story feedback/rating system

---

## Children's UX Principles

This app targets children ages 3–9. Every UX decision must account for:

### Core Principles
1. **Simple, clear affordances** — Large touch targets (≥44×44pt), obvious buttons
2. **Positive reinforcement only** — Celebrate successes; never penalize failure
3. **Low cognitive load** — Maximum 3 choices at once (classic story branches)
4. **Delight through animation** — Confetti, star bursts, glowing badges on achievements
5. **Reassuring tone** — Friendly copy, no time pressure, no failure states
6. **Parental confidence** — Clear parent controls, PIN-protected settings

### Age-Range Calibration
| Range | Story Vocabulary | Sentence Length | Choice Complexity |
|-------|-----------------|-----------------|------------------|
| `2-4` | Simple, concrete | Short (5–8 words) | Binary (2 choices) |
| `4-6` | Expanding vocabulary | Medium (8–12 words) | 3 simple choices |
| `6-8` | Richer, more varied | Varied (10–15 words) | 3 nuanced choices |
| `8-10` | Advanced for age | Full sentences | 3 complex choices |

---

## Child Profiles

```typescript
interface ChildProfile {
  id: string;
  name: string;                  // Child's name (used in personalization)
  avatarEmoji: string;           // Profile avatar
  ageRange: '2-4' | '4-6' | '6-8' | '8-10';
  favoriteHero?: string;         // Default hero for this profile
  createdAt: string;
}
```

AsyncStorage key: `@infinity_heroes_profiles`
Active profile key: `@infinity_heroes_active_profile`

### Profile Switching
Profiles are managed via `ProfileContext` — never store the active profile in component state. Always read from context to ensure consistency across screens.

---

## Badge System (12 Achievements)

| Badge ID | Emoji | Title | Unlock Condition |
|----------|-------|-------|-----------------|
| `first_adventure` | 🌟 | First Adventure | Complete first story |
| `night_owl` | 🦉 | Night Owl | Listen after 8:00 PM |
| `early_bird` | 🌅 | Early Bird | Listen 5:00–10:00 AM |
| `hero_collector` | 🦸 | Hero Collector | Use every hero template at least once |
| `silly_storyteller` | 🤪 | Silly Storyteller | Complete 3 Mad Libs stories |
| `dream_weaver` | 💤 | Dream Weaver | Complete 3 Sleep mode stories |
| `classic_champion` | 🏆 | Classic Champion | Complete 5 Classic stories |
| `on_fire` | 🔥 | On Fire! | 3-day reading streak |
| `diamond_reader` | 💎 | Diamond Reader | 7-day reading streak |
| `bookworm` | 📚 | Bookworm | Complete 10 total stories |
| `story_legend` | 🌠 | Story Legend | Complete 25 total stories |
| `word_wizard` | 🔤 | Word Wizard | Learn 5 vocabulary words |

### Badge Awarding Logic

Badges are awarded in `app/completion.tsx` after a story completes:

```typescript
// Check and award applicable badges
const newBadges = evaluateBadges({
  completedStories,
  currentStreak,
  timeOfDay: new Date().getHours(),
  storyMode,
  heroesUsed,
  vocabWordsLearned,
});

for (const badge of newBadges) {
  await saveBadge(badge);
  triggerBadgeCelebration(badge); // animation + haptic feedback
}
```

### Badge Celebration
When a new badge is earned, show:
1. Confetti animation (full screen)
2. Badge card with emoji, title, and description
3. Positive copy: "Amazing! You earned a new badge!"
4. Haptic feedback (if available)

---

## Reading Streaks

```typescript
interface Streak {
  currentStreak: number;         // Consecutive days
  longestStreak: number;
  lastReadDate: string;          // ISO date string (date only, no time)
  totalStoriesRead: number;
}
```

AsyncStorage key: `@infinity_heroes_streaks`

Streak logic:
- Incremented when a story is completed (not just started)
- Streak maintained if a story is completed on the same day or the following day
- Streak resets if more than 1 day passes without completing a story
- Stored per active profile

---

## Story Feedback / Rating

```typescript
interface StoryFeedback {
  rating: 1 | 2 | 3 | 4 | 5;   // Star rating
  emoji: '😴' | '😐' | '😊' | '🌟' | '🚀';  // Quick emoji reaction
  note?: string;                  // Optional text note
}
```

AsyncStorage key: `@infinity_heroes_stories` (embedded in `CachedStory.feedback`)

**Note:** The rating UI in `app/completion.tsx` is not fully implemented yet. The storage helper `updateFeedback` exists but the UI is not wired up.

---

## Parent Controls

```typescript
interface ParentControls {
  enabled: boolean;
  pin: string;                    // Hashed PIN
  maxDailyStories?: number;
  allowedAgeRange?: string;
  disabledFeatures?: string[];    // Feature flags parents can disable
}
```

AsyncStorage key: `@infinity_heroes_parent_controls`

Parent control access is always PIN-protected. UI: `components/ParentControlsModal.tsx`.

---

## Onboarding Flow

```
app/welcome.tsx (fade animation)
    ↓
app/quick-create.tsx (create first hero, modal from bottom)
    ↓
app/(tabs)/index.tsx (home feed)
```

Onboarding complete flag: `@infinity_heroes_onboarding_complete`

After onboarding is complete, `app/_layout.tsx` redirects directly to home.

---

## Library & Story Management

| Feature | AsyncStorage Key | Status |
|---------|-----------------|--------|
| Save story | `@infinity_heroes_stories` | ✅ Working |
| Read/unread tracking | `@infinity_heroes_read` | ✅ Working (UI partially wired) |
| Favorites | `@infinity_heroes_favorites` | ✅ Working |
| Library sort order | In `app_settings` | ✅ Working |
| Show favorites only | In `app_settings` | ✅ Working |
| Story feedback | In `stories` (embedded) | ⚠️ Storage ready, UI pending |

---

## Copy Style Guide

When writing copy for UI text, buttons, and notifications:

- **Warm and encouraging:** "Great choice!" not "Selected"
- **Simple language:** Use words a 6-year-old knows
- **Active voice:** "Start your adventure" not "Story generation initiated"
- **Emoji for delight:** Use sparingly but consistently at key moments
- **No negative framing:** "Try again!" not "Failed"
- **Present tense:** "Nova is building a cloud castle" not "Nova built"

---

## Accessibility for Children

- Minimum touch target: 44×44pt (Apple/Google HIG)
- Large text mode (`fontSize: 'large'`) scales body text by 1.15×
- Color contrast ratio ≥ 4.5:1 for all body text
- `reducedMotion` setting disables animations for children sensitive to motion
- All images have `accessibilityLabel` props

---

## What This Agent Must Flag for Human Review

- Changes to badge unlock conditions (affects all existing users)
- Changes to streak calculation logic
- New parent control features (requires product approval)
- Copy changes that affect the tone or age-appropriateness of the app
- Changes to the onboarding flow (first-run UX is critical)

---

## Related Agent Files

- [`STORY-GENERATION-AGENT.md`](./STORY-GENERATION-AGENT.md) — Story content and modes
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Child safety enforcement
- [`DESIGN-SYSTEM-AGENT.md`](./DESIGN-SYSTEM-AGENT.md) — Visual design for children's UI
- [`FRONTEND-MOBILE-AGENT.md`](./FRONTEND-MOBILE-AGENT.md) — Screen and component patterns
