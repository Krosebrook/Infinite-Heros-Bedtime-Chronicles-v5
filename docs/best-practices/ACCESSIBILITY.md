# Accessibility Best Practices

**Last Updated:** 2026-03-27 | **Standard:** WCAG 2.1 AA (Mobile) | **Target Users:** Children ages 3-9

---

## Quick Reference

| Rule | Applies To | Required |
|------|-----------|----------|
| `accessibilityLabel` on all interactive elements | Pressable, Switch, TextInput | Always |
| `accessibilityRole` on all interactive elements | Pressable, Switch, TextInput | Always |
| Touch targets >= 44pt (48pt+ for children) | All tappable elements | Always |
| Color contrast >= 4.5:1 for text | All text on dark backgrounds | Always |
| `reducedMotion` setting respected | All animations | Always |
| Child-friendly error messages | ErrorFallback, alerts | Always |

---

## 1. Accessibility Labels

Every interactive element must have `accessibilityLabel` and `accessibilityRole`.

### DO

```tsx
<Pressable
  onPress={handleFavorite}
  accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
  accessibilityRole="button"
>
  <Ionicons name={isFav ? "heart" : "heart-outline"} />
</Pressable>

<Switch
  value={controls.bedtimeEnabled}
  onValueChange={(val) => update("bedtimeEnabled", val)}
  accessibilityLabel="Enable bedtime reminder"
  accessibilityRole="switch"
/>

<TextInput
  placeholder="Search stories"
  accessibilityLabel="Search stories"
  accessibilityRole="search"
/>
```

### DON'T

```tsx
// Missing labels — screen reader reads nothing
<Pressable onPress={handleFavorite}>
  <Ionicons name="heart" />
</Pressable>

// Icon-only button with no context
<Pressable onPress={onClose}>
  <Ionicons name="close" size={22} />
</Pressable>
```

### Dynamic Labels

For elements with dynamic content, use template literals:

```tsx
<Pressable
  accessibilityLabel={`Open story: ${story.title}`}
  accessibilityRole="button"
>
  <Text>{story.title}</Text>
</Pressable>

<Pressable
  accessibilityLabel={`Theme: ${theme.label}${isActive ? ", selected" : ""}`}
  accessibilityRole="button"
>
  <Text>{theme.emoji} {theme.label}</Text>
</Pressable>
```

### Valid `accessibilityRole` Values

| Role | Use For |
|------|---------|
| `"button"` | Pressable, TouchableOpacity |
| `"link"` | Navigation links |
| `"search"` | Search text inputs |
| `"tab"` | Tab bar buttons |
| `"switch"` | Toggle switches |
| `"header"` | Section headers |
| `"image"` | Decorative images |
| `"none"` | Elements that should not be announced |

---

## 2. Touch Targets

### Minimum Sizes

| Audience | Minimum Size | Recommended |
|----------|-------------|-------------|
| Adults (WCAG) | 44 x 44 pt | 44 x 44 pt |
| Children ages 6-9 | 48 x 48 pt | 48 x 48 pt |
| Children ages 3-5 | 48 x 48 pt | 56 x 56 pt |

### Implementation

```tsx
// Use hitSlop for elements that can't be visually enlarged
<Pressable
  onPress={handleSettings}
  style={styles.gearBtn}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessibilityLabel="Open settings"
  accessibilityRole="button"
>
  <Ionicons name="settings-outline" size={20} />
</Pressable>

// For buttons, set minimum dimensions in styles
const styles = StyleSheet.create({
  timeBtn: {
    width: 44,    // Was 28 — increased for accessibility
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
```

### Tab Bar

```tsx
// Tab icons need explicit labels since tabBarShowLabel is false
<Tabs.Screen
  name="index"
  options={{
    title: "Home",
    tabBarAccessibilityLabel: "Home",
    tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
  }}
/>
```

---

## 3. Color Contrast

### Current Theme Contrast Issues

| Color Pair | Contrast Ratio | WCAG AA (4.5:1) |
|------------|---------------|------------------|
| `#FFFFFF` on `#05051e` | 18.1:1 | Pass |
| `#94a3b8` (textSecondary) on `#05051e` | 6.2:1 | Pass |
| `#64748b` (textMuted) on `#05051e` | 3.8:1 | **FAIL** |
| `rgba(255,255,255,0.4)` on `#05051e` | ~2.7:1 | **FAIL** |
| `rgba(255,255,255,0.5)` on `#05051e` | ~3.4:1 | **FAIL** |

### Fix

Replace low-contrast colors:
- `textMuted` should be `#8899aa` or higher (>= 4.5:1)
- Semi-transparent whites: use >= 60% opacity (`rgba(255,255,255,0.6)`)
- Never use `rgba(255,255,255,0.3)` for readable text

### Testing Contrast

Use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) with:
- Background: `#05051e` (Colors.primary)
- Foreground: your text color

---

## 4. Reduced Motion

The app has a `reducedMotion` setting in `SettingsContext`. ALL animations must check it.

### Pattern

```tsx
import { useSettings } from "@/lib/SettingsContext";
import { useReducedMotion } from "react-native-reanimated";

function AnimatedComponent() {
  const { settings } = useSettings();
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = settings.reducedMotion || systemReducedMotion;

  // Skip animation if reduced motion is enabled
  const entering = shouldReduceMotion ? undefined : FadeInDown.duration(400);

  return (
    <Animated.View entering={entering}>
      <Content />
    </Animated.View>
  );
}
```

### Components That Need This

- `components/StarField.tsx` — background star animation
- `components/PulsingOrb.tsx` — pulsing orb effect
- `app/completion.tsx` — FloatingStar, PulsingBadge animations
- `app/welcome.tsx` — onboarding animations
- All screens using `FadeIn`, `FadeInDown` entering animations

---

## 5. Child-Friendly Language

### Error Messages

```tsx
// DO — child-friendly, directs to adult
<Text style={styles.errorTitle}>Oops! Something got a little mixed up</Text>
<Text style={styles.errorSubtitle}>Ask a grown-up to tap the button below</Text>

// DON'T — technical, scary for children
<Text>Something went wrong</Text>
<Text>Please reload the app to continue.</Text>
```

### Loading States

```tsx
// DO — engaging, themed
<Text>Your story is being written by the stars...</Text>
<PulsingOrb />

// DON'T — generic, boring for children
<ActivityIndicator />
<Text>Loading...</Text>
```

### Empty States

```tsx
// DO — encouraging, actionable
<Text>No adventures yet!</Text>
<Text>Let's create your first story</Text>

// DON'T — technical
<Text>No stories found.</Text>
```

---

## 6. Accessibility Audit Checklist

Run this checklist before every release:

- [ ] Every `Pressable` has `accessibilityLabel` and `accessibilityRole`
- [ ] Every `Switch` has `accessibilityLabel` and `accessibilityRole="switch"`
- [ ] Every `TextInput` has `accessibilityLabel`
- [ ] Tab bar has `tabBarAccessibilityLabel` on all screens
- [ ] All touch targets are >= 44pt (48pt for child-facing UI)
- [ ] All text has >= 4.5:1 contrast ratio on its background
- [ ] `reducedMotion` setting disables all non-essential animations
- [ ] Error messages are child-friendly (no technical language)
- [ ] Loading states are engaging (not generic spinners)
- [ ] VoiceOver (iOS) navigation tested manually
- [ ] TalkBack (Android) navigation tested manually
- [ ] Font scaling works at "Large" text size setting
- [ ] Dynamic content changes are announced to screen readers

---

## 7. Files Modified for Accessibility (2026-03-27)

| File | Changes |
|------|---------|
| `app/(tabs)/_layout.tsx` | Tab labels, create button |
| `app/(tabs)/index.tsx` | Settings, profile, search, categories, story cards |
| `app/(tabs)/library.tsx` | Story cards, favorites |
| `app/(tabs)/saved.tsx` | Story cards, actions |
| `app/(tabs)/profile.tsx` | Profile cards, parent controls, settings |
| `app/(tabs)/create.tsx` | Heroes, modes, voices, duration, create CTA |
| `components/ParentControlsModal.tsx` | PIN, switches, time buttons (28→44pt), themes |
| `components/ProfileModal.tsx` | Edit, delete, add, close |
| `components/SettingsModal.tsx` | Close, tabs, switches |
| `components/HeroCard.tsx` | Hero name + title label |
| `components/ErrorFallback.tsx` | Child-friendly error messages |
