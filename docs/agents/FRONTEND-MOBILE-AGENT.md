<!-- Last verified: 2026-03-26 -->
# FRONTEND-MOBILE-AGENT.md — Expo / React Native Expert

Specialized agent context for all work touching the Expo mobile frontend: screens, components, navigation, and animations.

---

## Domain Scope

This agent is authoritative for:
- `app/` — Expo Router screen files (file-based routing)
- `components/` — Reusable React Native components
- `constants/colors.ts`, `constants/timing.ts`, `constants/heroes.ts`
- `lib/SettingsContext.tsx`, `lib/ProfileContext.tsx`, `lib/AuthContext.tsx`
- `lib/storage.ts` — AsyncStorage helper layer
- Animation code (`react-native-reanimated`)
- Navigation patterns (Expo Router v6, `expo-router/stack`, `expo-router/tabs`)

---

## Tech Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Expo SDK | 54 |
| Runtime | React Native (New Architecture) | 0.81 |
| Routing | Expo Router (file-based) | v6 |
| Animations | react-native-reanimated | v4 |
| Safe area | react-native-safe-area-context | latest |
| Gestures | react-native-gesture-handler | latest |
| Storage | AsyncStorage (via `lib/storage.ts`) | latest |
| State | React Context + TanStack Query v5 | — |

---

## File & Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screen files | `kebab-case.tsx` | `story-details.tsx` |
| Component files | `PascalCase.tsx` | `HeroCard.tsx` |
| Hook files | `useCamelCase.ts` | `useSettings.ts` |
| Constants | `camelCase.ts` | `colors.ts` |

### AsyncStorage Key Pattern
All keys follow `@infinity_heroes_<descriptor>`. **Never** call `AsyncStorage` directly — use `lib/storage.ts` helpers.

---

## Screen Catalog

| File | Route | Description |
|------|-------|-------------|
| `app/_layout.tsx` | Root | Providers: ErrorBoundary → QueryClient → Profile → Settings → Gesture → Keyboard |
| `app/(tabs)/_layout.tsx` | Tab bar | 5 tabs: home, create, library, saved, profile (60px + bottom inset) |
| `app/(tabs)/index.tsx` | `/` | Home feed |
| `app/(tabs)/create.tsx` | `/create` | Hero creation wizard |
| `app/(tabs)/library.tsx` | `/library` | Story library with filters |
| `app/(tabs)/saved.tsx` | `/saved` | Saved/favorites view |
| `app/(tabs)/profile.tsx` | `/profile` | Child profile management |
| `app/story.tsx` | `/story` | Story reading/playback (~49KB, fullScreen fade modal) |
| `app/story-details.tsx` | `/story-details` | Story customization (slide from right) |
| `app/completion.tsx` | `/completion` | Post-story celebration + badge awarding |
| `app/quick-create.tsx` | `/quick-create` | Fast hero creation (modal from bottom) |
| `app/madlibs.tsx` | `/madlibs` | Mad Libs wizard (slide from right) |
| `app/sleep-setup.tsx` | `/sleep-setup` | Sleep mode setup (slide from right) |
| `app/settings.tsx` | `/settings` | App settings (slide from right) |
| `app/trophies.tsx` | `/trophies` | Badge collection view |
| `app/welcome.tsx` | `/welcome` | Onboarding splash (fade) |

---

## Styling Rules

```typescript
// ✅ CORRECT — use StyleSheet.create()
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,  // from constants/colors.ts
    flex: 1,
  },
});

// ❌ WRONG — no bare inline objects
<View style={{ backgroundColor: '#05051e' }} />

// ❌ WRONG — no hardcoded hex values
backgroundColor: '#6366f1'

// ✅ CORRECT
backgroundColor: colors.accent
```

### Cosmic Theme Reference
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.background` | `#05051e` | Screen/card backgrounds |
| `colors.accent` | `#6366f1` | Primary interactive elements |
| `colors.starlight` | `#E8E4F0` | Primary text, icons |
| `colors.glass` | `rgba(255,255,255,0.03)` | Glassmorphism card backgrounds |
| `colors.glassBorder` | `rgba(255,255,255,0.1)` | Glassmorphism borders |

Always use `userInterfaceStyle: "dark"` (enforced by `app.json`). Portrait orientation only.

---

## Animation Patterns

Use `react-native-reanimated` v4 — **never** `Animated` from React Native core.

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { timing } from '@/constants/timing';

// Use timing constants — never hardcode ms values
const opacity = useSharedValue(0);
const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
withTiming(opacity, { duration: timing.fadeIn });
```

---

## Navigation Patterns

```typescript
import { router, useLocalSearchParams } from 'expo-router';

// Navigate to a screen
router.push('/story');
router.push({ pathname: '/story', params: { storyId: id } });

// Modal presentation — defined in _layout.tsx as presentation: 'fullScreenModal'
router.push('/completion');

// Back navigation
router.back();
```

### Adding a New Screen
1. Create `app/<name>.tsx` — Expo Router registers it automatically.
2. Tab screens go in `app/(tabs)/<name>.tsx`.
3. Add the screen's modal presentation type to `app/_layout.tsx` if needed.
4. Always wrap in `SafeAreaView` from `react-native-safe-area-context`.
5. Use colors from `constants/colors.ts`.

---

## Settings & Context Access

```typescript
// ✅ CORRECT — use SettingsContext hook
import { useSettings } from '@/lib/SettingsContext';
const { settings, updateSettings } = useSettings();

// ✅ CORRECT — use ProfileContext hook
import { useProfile } from '@/lib/ProfileContext';
const { activeProfile, profiles } = useProfile();

// ❌ WRONG — never create a second settings system
// ❌ WRONG — never call AsyncStorage directly from a screen
```

---

## Keyboard & Safe Area

```typescript
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// Use insets.bottom to pad tab bar or floating buttons
```

---

## Component Patterns

### Error Boundaries
Wrap each major screen area:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
<ErrorBoundary fallback={<ErrorFallback />}>
  <ScreenContent />
</ErrorBoundary>
```

### Loading States
Use skeleton shimmer or `ActivityIndicator` with `colors.accent` color. Never leave blank screens.

---

## Performance Rules

- Never create component instances inside render without `useCallback` / `useMemo` guards.
- Lists: use `FlatList` or `FlashList` — never `ScrollView` for dynamic item counts.
- Images: use `expo-image` not `Image` from React Native core for caching benefits.
- Avoid `useEffect` for derived state — compute inline or use `useMemo`.

---

## What This Agent Must Flag for Human Review

- Changes to `app/_layout.tsx` (root provider order affects the whole app)
- Changes to tab bar configuration in `app/(tabs)/_layout.tsx`
- Any new `EXPO_PUBLIC_*` environment variable (client-visible, security sensitive)
- Orientation lock changes in `app.json`
- New `patches/` entries for Expo dependencies

---

## Related Agent Files

- [`DESIGN-SYSTEM-AGENT.md`](./DESIGN-SYSTEM-AGENT.md) — Color system, typography, animations
- [`PERFORMANCE-AGENT.md`](./PERFORMANCE-AGENT.md) — React Query, bundle optimization
- [`CONTENT-UX-AGENT.md`](./CONTENT-UX-AGENT.md) — Children's UX, badge system
- [`TESTING-QA-AGENT.md`](./TESTING-QA-AGENT.md) — Component testing patterns
