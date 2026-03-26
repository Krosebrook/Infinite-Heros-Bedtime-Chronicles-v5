<!-- Last verified: 2026-03-26 -->
# DESIGN-SYSTEM-AGENT.md — Design System Expert

Specialized agent context for all work touching the visual design system: the Cosmic theme, typography, colors, spacing, animations, and component styling.

---

## Domain Scope

This agent is authoritative for:
- `constants/colors.ts` — Canonical color palette (single source of truth)
- `constants/timing.ts` — Animation timing constants
- `StyleSheet.create()` patterns across all components and screens
- `react-native-reanimated` v4 animation patterns
- Typography: Nunito, Plus Jakarta Sans, Bangers fonts
- Glassmorphism card patterns
- `components/StarField.tsx` — Background star animation
- `components/PulsingOrb.tsx` — Animated orb effect
- Dark mode (UI always dark — `userInterfaceStyle: "dark"`)

---

## The Cosmic Theme

The app uses a deep-space, cosmic aesthetic with glassmorphism cards and animated star fields.

### Core Design Principles
1. **Always dark** — Pure dark background (`#05051e`), no light mode
2. **Glassmorphism cards** — Semi-transparent bg + subtle border + blur
3. **Cosmic depth** — Star field backgrounds, glowing orbs, gradient accents
4. **Child-appropriate** — Round corners, large touch targets, playful but not garish
5. **Portrait only** — Vertical layout optimized for phone portrait orientation

---

## Color System (`constants/colors.ts`)

**Never hardcode hex values in components or screens.** Always import from `constants/colors.ts`.

### Background & Surface
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.background` | `#05051e` | Primary screen background |
| `colors.surface` | `#0d0d2b` | Secondary surfaces, bottom sheets |
| `colors.elevated` | `#141430` | Elevated cards, modals |
| `colors.glass` | `rgba(255,255,255,0.03)` | Glassmorphism card fill |
| `colors.glassBorder` | `rgba(255,255,255,0.1)` | Glassmorphism card border |

### Brand & Accent
| Token | Hex | Usage |
|-------|-----|-------|
| `colors.accent` | `#6366f1` | Primary interactive, CTA buttons |
| `colors.accentLight` | `#818cf8` | Hover/focus states, secondary CTA |
| `colors.accentDim` | `rgba(99,102,241,0.2)` | Subtle accent fills, chip backgrounds |
| `colors.gold` | `#f59e0b` | Badges, achievements, star ratings |
| `colors.starlight` | `#E8E4F0` | Primary text, icons |

### Text
| Token | Usage |
|-------|-------|
| `colors.text` | Body text (high contrast) |
| `colors.textMuted` | Secondary/helper text |
| `colors.textDim` | Placeholder, disabled |

### Semantic
| Token | Usage |
|-------|-------|
| `colors.success` | Positive states, completion |
| `colors.warning` | Caution states |
| `colors.error` | Error states, destructive actions |

---

## Typography

### Font Families
| Family | Weight | Usage |
|--------|--------|-------|
| **Bangers** | 400 | Display titles, hero names, celebration text |
| **Nunito** | 400, 600, 700, 800 | Body text, UI labels, primary content |
| **Plus Jakarta Sans** | 400, 500, 600 | UI chrome, navigation, system text |

Fonts are loaded in `app/_layout.tsx` using `expo-font`.

### Type Scale

```typescript
// Consistent scale — use these sizes, not arbitrary values
const TYPE_SCALE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  display: 48,
};
```

### Text Size Setting
Users can choose `fontSize: 'normal' | 'large'` in settings. Large mode multiplies base sizes by `1.15`. Always check the setting when rendering body text.

---

## Styling Rules

### Always Use `StyleSheet.create()`

```typescript
// ✅ CORRECT
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
});

// ❌ WRONG — no bare inline objects
<View style={{ backgroundColor: '#05051e', padding: 16 }} />

// ✅ EXCEPTION — computed-at-render values only
<View style={[styles.card, { opacity: animatedValue }]} />
```

### Glassmorphism Card Pattern

```typescript
const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: colors.glass,          // rgba(255,255,255,0.03)
    borderWidth: 1,
    borderColor: colors.glassBorder,        // rgba(255,255,255,0.1)
    borderRadius: 16,
    overflow: 'hidden',
    // Optional: backdrop blur via expo-blur
  },
});
```

---

## Animation Patterns

Use `react-native-reanimated` v4 — **never** `Animated` from React Native core.

### Fade In
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { timing } from '@/constants/timing';

const opacity = useSharedValue(0);

useEffect(() => {
  opacity.value = withTiming(1, { duration: timing.fadeIn });
}, []);

const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
```

### Spring Bounce
```typescript
import { withSpring } from 'react-native-reanimated';

scale.value = withSpring(1, {
  damping: 12,
  stiffness: 180,
  mass: 0.8,
});
```

### Reduced Motion
Always respect the `reducedMotion` setting from `SettingsContext`:
```typescript
const { settings } = useSettings();
const duration = settings.reducedMotion ? 0 : timing.fadeIn;
opacity.value = withTiming(1, { duration });
```

---

## Timing Constants (`constants/timing.ts`)

```typescript
// Use these — never hardcode millisecond values
timing.fadeIn         // Standard fade-in (e.g., 300ms)
timing.fadeOut        // Standard fade-out (e.g., 200ms)
timing.slideIn        // Modal/sheet slide (e.g., 350ms)
timing.bounce         // Spring bounce duration
timing.stagger        // List item stagger delay
```

---

## Safe Area & Layout

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

// Always account for top/bottom safe areas
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 60, // 60px = tab bar height
  },
});
```

---

## Component Visual Standards

### Buttons
- Primary CTA: `backgroundColor: colors.accent`, `borderRadius: 12`, min height 48px
- Secondary: `backgroundColor: colors.accentDim`, `borderRadius: 12`
- Destructive: `backgroundColor: colors.error`
- All interactive elements: min 44×44pt touch target (Apple HIG)

### Cards
- Glassmorphism style with `borderRadius: 16`
- `overflow: 'hidden'` to clip child content
- Optional glow: `shadowColor: colors.accent, shadowOpacity: 0.3`

### Loading States
- Use skeleton shimmer with `colors.glass` and `colors.glassBorder`
- Animated pulse using `react-native-reanimated` `withRepeat`

---

## What This Agent Must Flag for Human Review

- Changes to `constants/colors.ts` (affects entire app visually)
- Changes to font loading in `app/_layout.tsx`
- Removal of `reducedMotion` guards in animations
- Hardcoded hex values or pixel values that bypass the design system

---

## Related Agent Files

- [`FRONTEND-MOBILE-AGENT.md`](./FRONTEND-MOBILE-AGENT.md) — Screen and component development
- [`CONTENT-UX-AGENT.md`](./CONTENT-UX-AGENT.md) — Children's UX, badge and gamification UI
- [`PERFORMANCE-AGENT.md`](./PERFORMANCE-AGENT.md) — Animation performance
