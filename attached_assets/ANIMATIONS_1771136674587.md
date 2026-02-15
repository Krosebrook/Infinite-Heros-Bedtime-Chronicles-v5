# Infinity Heroes: Bedtime Chronicles -- Animation & Visual Effects Reference

> Comprehensive catalog of every animation, transition, and visual effect in the application.

---

## Table of Contents

1. [CSS Keyframe Animations](#1-css-keyframe-animations)
2. [Framer Motion Entrance Animations](#2-framer-motion-entrance-animations)
3. [Framer Motion Exit Animations](#3-framer-motion-exit-animations)
4. [Hover Effects](#4-hover-effects)
5. [Tap / Press Effects](#5-tap--press-effects)
6. [Page Transitions](#6-page-transitions)
7. [Loading Animations](#7-loading-animations)
8. [Scroll Animations](#8-scroll-animations)
9. [Stagger Animations](#9-stagger-animations)
10. [Parallax Effects](#10-parallax-effects)
11. [Continuous Animations](#11-continuous-animations)
12. [Sound-Synced Animations](#12-sound-synced-animations)
13. [Comic Book Effects](#13-comic-book-effects)
14. [Animation Timing Table](#14-animation-timing-table)

---

## 1. CSS Keyframe Animations

All custom `@keyframes` rules defined in `index.css`.

### 1.1 `float`

**File:** `index.css` (line 49)
**Utility class:** `.animate-float`

| Frame | Property | Value |
|-------|----------|-------|
| `0%` | `transform` | `translateY(0px)` |
| `50%` | `transform` | `translateY(-10px)` |
| `100%` | `transform` | `translateY(0px)` |

- **Duration:** 3s
- **Easing:** ease-in-out
- **Iteration:** infinite

A gentle up-and-down bobbing motion used on floating elements.

---

### 1.2 `breathe`

**File:** `index.css` (line 60)
**Utility class:** `.animate-breathe`

| Frame | Property | Value |
|-------|----------|-------|
| `0%` | `transform`, `filter` | `scale(1)`, `brightness(100%)` |
| `50%` | `transform`, `filter` | `scale(1.05)`, `brightness(110%)` |
| `100%` | `transform`, `filter` | `scale(1)`, `brightness(100%)` |

- **Duration:** 6s
- **Easing:** ease-in-out
- **Iteration:** infinite

A slow scaling and brightness pulse that simulates organic breathing. Used on avatars and sleep-mode elements.

---

### 1.3 `shimmer` (inline)

**File:** `LoadingFX.tsx` (line 281, inline `<style>` tag)

| Frame | Property | Value |
|-------|----------|-------|
| `0%` | `transform` | `translateX(-100%)` |
| `100%` | `transform` | `translateX(100%)` |

- **Duration:** 1.5s
- **Easing:** (default, linear implied)
- **Iteration:** infinite

A horizontal shimmer that sweeps across the progress bar fill to simulate a reflective shine.

---

### 1.4 Tailwind Utility Animations (used via class names)

These are standard Tailwind/CSS animations used throughout the codebase:

| Class | Animation | Where Used |
|-------|-----------|------------|
| `animate-pulse` | Opacity oscillation (0 to 1) | Loading text, required-field borders, glowing auras, "What drives you?" prompt, "Processing..." label, "CREATE HERO" button, SensoryInputCard dot indicator |
| `animate-bounce` | Vertical bounce | ApiKeyDialog key icon, "READ ISSUE #1" button on Panel cover, decorative badge on empty avatar, ErrorBoundary heading |
| `animate-spin` | 360-degree rotation | Avatar loading spinner (`border-t-transparent` trick) |
| `animate-[spin_8s_linear_infinite]` | Slow clockwise spin | LoadingFX outer dashed ring |
| `animate-[spin_12s_linear_infinite_reverse]` | Slow counter-clockwise spin | LoadingFX inner dotted ring |
| `animate-[shimmer_1.5s_infinite]` | Shimmer (see 1.3) | Progress bar fill overlay in LoadingFX |
| `animate-in fade-in zoom-in duration-300` | Combined entrance | ApiKeyDialog container |
| `animate-in fade-in slide-in-from-right-4 duration-300` | Slide-in from right | SettingsModal content tabs (general, voice, accessibility) |
| `animate-in fade-in slide-in-from-bottom-4 duration-700` | Slide-in from bottom | SleepSetup main container |
| `animate-in fade-in slide-in-from-left-4 duration-500` | Slide-in from left | SleepSetup parent-madlib and child-friendly panels |
| `animate-in fade-in slide-in-from-right-4 duration-500` | Slide-in from right | SleepSetup dreamscape selection panel |
| `animate-in zoom-in duration-500` | Zoom entrance | MadlibsSetup container |

---

## 2. Framer Motion Entrance Animations

Every component's mount/entrance animation using Framer Motion's `initial` and `animate` props.

### 2.1 App -- Offline Banner

**File:** `App.tsx` (line 79)

```
initial={{ y: -50 }}
animate={{ y: 0 }}
```

- Slides down from 50px above into view. No explicit transition (uses Framer defaults).

---

### 2.2 Setup -- Error Banner

**File:** `Setup.tsx` (line 129)

```
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
```

- Expands from zero height and fades in. Collapses and fades out on dismiss.

---

### 2.3 LoadingFX -- Root Container

**File:** `LoadingFX.tsx` (line 131)

```
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.5 }}
```

- Simple 500ms fade in/out.

---

### 2.4 LoadingFX -- Background Particles (per mode)

**File:** `LoadingFX.tsx` (line 168)

All particles share:
```
initial={{ opacity: 0, scale: 0 }}
```

**Sleep mode variant:**
```
animate={{ opacity: [0, 0.7, 0], scale: [1, 1.2, 1], y: [0, -20, 0] }}
transition={{ duration: 3-6s (random), repeat: Infinity, delay: 0-5s (random), ease: "easeInOut" }}
```

**Classic mode variant:**
```
animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [100, -100] }}
transition={{ duration: 0.5-2s (random), repeat: Infinity, delay: 0-5s (random), ease: "linear" }}
```

**Mad Libs mode variant:**
```
animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: [0, random(-50,50)], y: [0, random(-50,50)], rotate: [0, 360] }}
transition={{ duration: 0.5-2s (random), repeat: Infinity, delay: 0-5s (random), ease: "linear" }}
```

---

### 2.5 LoadingFX -- Floating Word Particles (POW, ZAP, etc.)

**File:** `LoadingFX.tsx` (line 196)

```
initial={{ scale: 0, opacity: 0, rotate: random(-30,30), y: 0 }}
animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], y: -100 }}
exit={{ scale: 0, opacity: 0 }}
transition={{ duration: 1.5 }}
```

- Pops in, scales up to 1.5x, floats upward 100px, and fades out over 1.5s. Only in classic/madlibs modes (not sleep).

---

### 2.6 LoadingFX -- Central Icon Pulse

**File:** `LoadingFX.tsx` (line 216)

```
initial={{ scale: 0.8 }}
animate={{
    scale: [0.9, 1.1, 0.9],
    rotate: mode === 'madlibs' ? [0, 10, -10, 0] : 0,
    filter: ["brightness(100%)", "brightness(130%)", "brightness(100%)"]
}}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
```

- Pulsing scale between 0.9 and 1.1 with brightness oscillation. In madlibs mode adds a wobble rotation.

---

### 2.7 LoadingFX -- Status Message Flipper

**File:** `LoadingFX.tsx` (line 246)

```
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
```

- Text slides up from 20px below, exits sliding up 20px. Wrapped in `AnimatePresence mode="wait"`. Cycles every 2000ms.

---

### 2.8 LoadingFX -- Progress Bar Fill

**File:** `LoadingFX.tsx` (line 264)

```
initial={{ width: 0 }}
animate={{ width: `${progress}%` }}
transition={{ type: 'spring', stiffness: 20, damping: 10 }}
```

- Spring-animated width from 0 to current progress percentage. Low stiffness gives a smooth, springy feel.

---

### 2.9 HeroHeader -- Star Field Container (sleep mode)

**File:** `HeroHeader.tsx` (line 94)

```
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 1.5 }}
```

- 1.5-second fade in/out of the entire star field when entering/leaving sleep mode.

---

### 2.10 HeroHeader -- Individual Stars (sleep mode)

**File:** `HeroHeader.tsx` (line 111)

```
animate={{ opacity: [0.1, 0.8, 0.1] }}
transition={{ duration: 2-4s (random), repeat: Infinity, delay: 0-2s (random), ease: "easeInOut" }}
```

- Each star independently twinkles between 10% and 80% opacity in a continuous loop.

---

### 2.11 HeroHeader -- Tagline Text

**File:** `HeroHeader.tsx` (line 148)

```
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
```

- Slides up 10px into view. Exits sliding up 10px and fading out. Uses `AnimatePresence mode="wait"`.

---

### 2.12 HeroHeader -- Active Tab Indicator (layoutId)

**File:** `HeroHeader.tsx` (line 177)

```
layoutId="activeTab"
transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
```

- Shared layout animation that morphs the colored background pill between mode tabs with a 0.6s spring.

---

### 2.13 ReadingView -- Main Container

**File:** `ReadingView.tsx` (line 64)

```
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
```

- Simple fade-in on mount.

---

### 2.14 ReadingView -- Avatar (layoutId)

**File:** `ReadingView.tsx` (line 108)

```
layoutId="avatar"
```

- Shared layout animation enabling the avatar to morph position/size between Setup and Reading views.

---

### 2.15 ReadingView -- Story Progress Bar

**File:** `ReadingView.tsx` (line 181)

```
initial={{ width: 0 }}
animate={{ width: `${storyProgress}%` }}
transition={{ type: 'spring', stiffness: 50 }}
```

- Spring-animated progress indicator for journey segment tracking.

---

### 2.16 CompletionView -- Card

**File:** `CompletionView.tsx` (line 20)

```
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
```

- Scales up from 90% with fade-in.

---

### 2.17 SettingsModal -- Dialog Container

**File:** `SettingsModal.tsx` (line 62)

```
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.9, opacity: 0 }}
```

- Scales from 90% with fade, reverses on close.

---

### 2.18 SettingsModal -- Success Overlay

**File:** `SettingsModal.tsx` (line 234)

```
initial={{ y: '100%' }}
animate={{ y: 0 }}
exit={{ y: '100%' }}
```

- Slides up from below the footer to fill it, then slides back down on exit.

---

### 2.19 SetupShared -- GeminiWizardStep

**File:** `SetupShared.tsx` (line 143)

```
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
```

- Slides in from 20px right, exits sliding 20px left. Creates a left-to-right wizard flow.

---

### 2.20 SetupShared -- MadLibField Suggestions Dropdown

**File:** `SetupShared.tsx` (line 111)

```
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
```

- Drops down from slightly above with a subtle scale-up.

---

### 2.21 SetupShared -- LengthSlider Selected Label

**File:** `SetupShared.tsx` (line 227)

```
initial={{ opacity: 0, y: 5 }}
animate={{ opacity: 1, y: 0 }}
```

- Duration label fades in and shifts up 5px when its corresponding step is selected.

---

### 2.22 SetupShared -- SensoryInputCard Clear Button

**File:** `SetupShared.tsx` (line 283)

```
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.8 }}
```

- Small scale-pop when the clear "X" button appears/disappears.

---

### 2.23 SleepSetup -- Sparkle Icon

**File:** `SleepSetup.tsx` (line 69)

```
animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
transition={{ duration: 4, repeat: Infinity }}
```

- Continuous pulsing sparkle above the hero name input.

---

### 2.24 SleepSetup -- Active Theme Preview Icon

**File:** `SleepSetup.tsx` (line 150)

```
animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1], y: [0, -10, 0] }}
transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
```

- Gentle rocking, bobbing, and scaling for the large theme icon in the preview panel.

---

### 2.25 SleepSetup -- Sub-mode Pill (layoutId)

**File:** `SleepSetup.tsx` (line 104)

```
layoutId="submode-pill"
transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
```

- Shared layout animation that morphs the active sub-mode background pill between "Dream Pick" and "Parent's Path".

---

### 2.26 SleepSetup -- Selection Glow (layoutId)

**File:** `SleepSetup.tsx` (line 199)

```
layoutId="selection-glow"
initial={{ opacity: 0 }}
animate={{ opacity: 0.2 }}
exit={{ opacity: 0 }}
```

- Shared layout gradient glow that follows the selected theme card.

---

### 2.27 SleepSetup -- Theme Checkmark

**File:** `SleepSetup.tsx` (line 226)

```
initial={{ scale: 0 }}
animate={{ scale: 1 }}
```

- Pops in from scale 0 when a theme card is selected.

---

### 2.28 SleepSetup -- Theme Description Text

**File:** `SleepSetup.tsx` (line 244)

```
initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
```

- Fades in with upward motion and deblur. Exits with upward motion and blur. Uses `AnimatePresence mode="wait"`.

---

### 2.29 MemoryJar -- Backdrop

**File:** `MemoryJar.tsx` (line 64)

```
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
```

- Simple fade for the dark overlay.

---

### 2.30 MemoryJar -- Drawer Panel

**File:** `MemoryJar.tsx` (line 74)

```
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
```

- Slides in from the right edge with a spring transition. Slides back out on close.

---

### 2.31 SyncedText -- Word Highlighting

**File:** `SyncedText.tsx` (line 63)

```
initial={false}
animate={{
    color: isWordActive ? '#2563eb' : (isSentenceActive ? '#1e3a8a' : '#1f2937'),
    scale: isWordActive ? 1.05 : 1,
    textShadow: isWordActive ? "0px 0px 8px rgba(37,99,235,0.2)" : "none",
    opacity: isSentenceActive || !isActive ? 1 : 0.7
}}
transition={{ duration: 0.1 }}
```

- Real-time word-level highlighting synchronized to narration audio playback. Active word scales to 1.05x and turns blue with a glow. Sentence-level dimming for non-active sentences.

---

## 3. Framer Motion Exit Animations

All exit transitions managed through `AnimatePresence`.

| # | Component | File | Exit Values | Notes |
|---|-----------|------|-------------|-------|
| 3.1 | ApiKeyDialog | `App.tsx:88` | Wrapped in `AnimatePresence` (no explicit exit) | Unmounts when `showApiKeyDialog` is false |
| 3.2 | SettingsModal | `App.tsx:90` | `exit={{ scale: 0.9, opacity: 0 }}` | Scale-down and fade |
| 3.3 | Error Banner | `Setup.tsx:132` | `exit={{ height: 0, opacity: 0 }}` | Collapses to zero height |
| 3.4 | LoadingFX | `Setup.tsx:117`, `LoadingFX.tsx:134` | `exit={{ opacity: 0 }}` | 500ms fade out |
| 3.5 | LoadingFX Word Particles | `LoadingFX.tsx:199` | `exit={{ scale: 0, opacity: 0 }}` | Shrink and vanish |
| 3.6 | Status Message Flipper | `LoadingFX.tsx:249` | `exit={{ opacity: 0, y: -20 }}` | Slides up and fades |
| 3.7 | Star Field (HeroHeader) | `HeroHeader.tsx:97` | `exit={{ opacity: 0 }}` | 1.5s fade out |
| 3.8 | Tagline | `HeroHeader.tsx:151` | `exit={{ opacity: 0, y: -10 }}` | Slides up 10px |
| 3.9 | MadLibField Dropdown | `SetupShared.tsx:113` | `exit={{ opacity: 0, y: 10, scale: 0.95 }}` | Collapses back downward |
| 3.10 | SensoryInput Clear Btn | `SetupShared.tsx:285` | `exit={{ opacity: 0, scale: 0.8 }}` | Shrinks away |
| 3.11 | GeminiWizardStep | `SetupShared.tsx:143` | `exit={{ opacity: 0, x: -20 }}` | Slides left on step change |
| 3.12 | Theme Description | `SleepSetup.tsx:246` | `exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}` | Blurs and slides up |
| 3.13 | Selection Glow | `SleepSetup.tsx:203` | `exit={{ opacity: 0 }}` | Fades out |
| 3.14 | MemoryJar Backdrop | `MemoryJar.tsx:67` | `exit={{ opacity: 0 }}` | Fades out |
| 3.15 | MemoryJar Drawer | `MemoryJar.tsx:77` | `exit={{ x: '100%' }}` | Slides off-screen right with spring |
| 3.16 | Settings Success | `SettingsModal.tsx:234` | `exit={{ y: '100%' }}` | Slides down below footer |

---

## 4. Hover Effects

### CSS-based Hover Effects

| # | Element | File | Effect | Details |
|---|---------|------|--------|---------|
| 4.1 | `.comic-btn` | `index.css:24` | Lift + shadow growth | `translate(-2px, -2px)`, shadow `8px 8px 0px black` |
| 4.2 | Memory Jar button | `Setup.tsx:91` | Scale up | `hover:scale-110` via Tailwind `transition-transform` |
| 4.3 | Settings gear button | `Setup.tsx:98` | Scale up + rotate | `hover:scale-110 hover:rotate-90` via Tailwind `transition-transform` |
| 4.4 | HeroHeader logo | `HeroHeader.tsx:132` | Scale up | `hover:scale-105 transition-transform` (when `onImageUpload` is available) |
| 4.5 | SettingsModal close | `SettingsModal.tsx:75` | Scale up | `hover:scale-110 transition-transform` |
| 4.6 | HeroAvatarDisplay | `SetupShared.tsx:40` | Scale up | `group-hover:scale-105` via Tailwind `transition-transform duration-300` |
| 4.7 | SensoryInputCard icon | `SetupShared.tsx:258` | Scale up | `group-hover:scale-110 transition-transform` |
| 4.8 | Play button (ReadingView) | `ReadingView.tsx:205` | Scale up | `hover:scale-110 transition-transform` |
| 4.9 | Panel buttons | `Panel.tsx:48,57,58` | Scale up | `hover:scale-105` |
| 4.10 | Story choice buttons | `ReadingView.tsx:136` | Scale up | `hover:scale-[1.03] transition-all` |
| 4.11 | Memory Jar story thumbnail | `MemoryJar.tsx:114` | Rotate | `group-hover:rotate-3 transition-transform` |
| 4.12 | Sleep theme card icons | `SleepSetup.tsx:211` | Grayscale removal + scale | `group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110` |
| 4.13 | SleepSetup bar reveal | `SleepSetup.tsx:239` | Width expansion | `w-2 group-hover:w-full transition-all duration-1000` |
| 4.14 | SleepSetup child-friendly radial | `SleepSetup.tsx:146` | Scale up background | `group-hover:scale-150 transition-transform duration-2000` |
| 4.15 | Wizard "Next" button | `SetupShared.tsx:160` | Lift | `hover:-translate-y-1` |

### Framer Motion Hover Effects

| # | Element | File | `whileHover` Values |
|---|---------|------|---------------------|
| 4.16 | SleepSetup theme buttons | `SleepSetup.tsx:184` | `{{ scale: 1.05 }}` |

---

## 5. Tap / Press Effects

### CSS-based Press Effects

| # | Element | File | Effect | Details |
|---|---------|------|--------|---------|
| 5.1 | `.comic-btn` | `index.css:29` | Press-in + shadow shrink | `translate(3px, 3px)`, shadow `2px 2px 0px black` |
| 5.2 | Memory Jar / Settings buttons | `Setup.tsx:91,98` | Scale down | `active:scale-95` |
| 5.3 | ApiKeyDialog button | `ApiKeyDialog.tsx:42` | Scale down | `active:scale-95` |
| 5.4 | Story choice buttons | `ReadingView.tsx:136` | Scale down | `active:scale-[0.97] transition-all` |
| 5.5 | Launch button | `Setup.tsx:173` | Translate down | `active:translate-y-1` |
| 5.6 | Play button | `ReadingView.tsx:205` | Scale down | `active:scale-90 transition-transform` |

### Framer Motion Tap Effects

| # | Element | File | `whileTap` Values |
|---|---------|------|-------------------|
| 5.7 | SleepSetup theme buttons | `SleepSetup.tsx:185` | `{{ scale: 0.95 }}` |

---

## 6. Page Transitions

### 6.1 Setup-to-Reading Phase Transition

**File:** `App.tsx` (lines 101-153)

The application uses a `phase` state variable (`'setup'` or `'reading'`) to conditionally render entire view trees. The transition mechanism is:

- **Setup unmounts** when `phase` changes to `'reading'` -- React unmounts the `<Setup>` component tree.
- **ReadingView mounts** with `initial={{ opacity: 0 }}` and `animate={{ opacity: 1 }}` -- a fade-in entrance.
- There is no shared `AnimatePresence` wrapping both views, so the transition is an instant swap with a fade-in on the new view.
- The `layoutId="avatar"` on the avatar image (ReadingView line 108) enables a smooth shared element transition where the avatar morphs from its Setup position to its Reading position.

### 6.2 Setup Section Layout Animation

**File:** `Setup.tsx` (line 113)

```jsx
<motion.section layout ...>
```

The main setup form panel uses Framer's `layout` prop, causing it to animate smoothly when its dimensions change (e.g., when switching modes or showing/hiding the error banner).

### 6.3 Reading Control Bar Layout Animation

**File:** `ReadingView.tsx` (line 171)

```jsx
<motion.nav layout ...>
```

The persistent playback control bar uses `layout` for smooth dimension changes.

### 6.4 Book Page Flip (Legacy/Panel System)

**File:** `Book.tsx` (line 35)

```
className="transition-all duration-1000 ease-in-out"
```

- The book container applies a 1-second CSS transition for all property changes.
- When setup is visible, the book transforms with: `translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)` plus `blur(6px) brightness(0.7)`.
- Individual paper pages use CSS class-based flip transitions via `.flipped` class toggling.

### 6.5 Mode Transition (Setup)

**File:** `Setup.tsx` (line 114)

```
transition-colors duration-1000
```

The setup panel background color transitions over 1 second when switching between modes (white for classic, indigo-950 for sleep).

### 6.6 HeroHeader Background Gradient Transition

**File:** `HeroHeader.tsx` (line 78)

```
transition-colors duration-1000
```

The header background gradient transitions over 1 second when switching modes (blue for classic, red for madlibs, deep indigo for sleep).

---

## 7. Loading Animations

### 7.1 LoadingFX Component (Full-Screen & Embedded)

**File:** `LoadingFX.tsx`

The LoadingFX component is a cinematic loading overlay with multiple layered effects:

**Background Particles:**
- **Classic mode:** 60 white particles fly upward (warp speed effect), `y: [100, -100]`, random durations 0.5-2s.
- **Sleep mode:** 100 white particles with glow, gently drift upward `y: [0, -20, 0]`, random durations 3-6s with easeInOut.
- **Mad Libs mode:** 50 multi-colored particles (yellow, red, blue, purple, green), chaotic jitter with random x/y offsets and 360-degree rotation.

**Foreground Word Particles (non-sleep only):**
- Words like "ZAP!", "POW!", "KABOOM!" appear every 300ms at random positions.
- Scale from 0 to 1.5x, float upward 100px, and fade over 1.5s.
- Up to 8 particles visible at once (FIFO).

**Central Icon:**
- Pulsing scale `[0.9, 1.1, 0.9]` over 3s, infinite loop.
- Brightness oscillation `[100%, 130%, 100%]`.
- Madlibs adds wobble rotation `[0, 10, -10, 0]`.

**Spinning Rings:**
- Outer dashed ring: `animate-[spin_8s_linear_infinite]` -- clockwise, 8s per revolution.
- Inner dotted ring: `animate-[spin_12s_linear_infinite_reverse]` -- counter-clockwise, 12s per revolution.

**Glowing Aura:**
- `animate-pulse` on a blurred 60px circle behind the icon.

**Status Messages:**
- Cycle through themed messages every 2000ms with slide-up entrance/exit.
- Classic: "Initializing Imagination Engines..." etc.
- Sleep: "Dimming the Lights..." etc.
- Mad Libs: "Mixing Chaos Potions..." etc.

**Progress Bar:**
- Spring-animated width: `type: 'spring', stiffness: 20, damping: 10`.
- Non-linear progress increment (slows down above 85%).
- Shimmer overlay sweeps horizontally every 1.5s.
- "Processing..." text pulses via `animate-pulse`.

**Cinematic Texture:**
- Stardust pattern overlay at 20% opacity with `animate-pulse` and `mix-blend-overlay`.

### 7.2 Avatar Loading Spinner

**File:** `SetupShared.tsx` (line 43)

```
<div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
<span className="... animate-pulse ...">Painting...</span>
```

- Classic CSS spinner (border trick) with continuous rotation.
- "Painting..." text pulses below.

### 7.3 Panel Loading State

**File:** `Panel.tsx` (line 21)

```
if (face.isLoading && !face.imageUrl) return <LoadingFX />;
```

- Full-screen LoadingFX rendered inside panel when loading.

### 7.4 Narration Loading State

**File:** `ReadingView.tsx` (line 205)

```
className={`... ${isNarrationLoading ? 'animate-pulse opacity-50' : ''}`}
```

- Play button pulses and dims to 50% opacity while narration audio is loading.

### 7.5 Panel Cover "PRINTING..." Button

**File:** `Panel.tsx` (line 48)

```
className="... animate-bounce disabled:animate-none ..."
```

- "READ ISSUE #1" button bounces when ready. When disabled (still printing), bounce is removed and shows progress count.

---

## 8. Scroll Animations

### 8.1 Story Part Viewport-Triggered Entrance

**File:** `ReadingView.tsx` (line 121)

```jsx
<motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
>
```

- Each story section fades in and slides up 40px when it enters the viewport.
- `once: true` -- animation only fires once (no re-triggering on scroll back).
- Viewport margin of -10% top and bottom creates a delayed trigger zone.

### 8.2 Auto-Scroll for Sleep Mode

**File:** `ReadingView.tsx` (line 53)

```javascript
currentPart.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

- Programmatic smooth scroll that centers the current story part when navigating in sleep mode.

### 8.3 Locked Story Sections

**File:** `ReadingView.tsx` (line 126)

```
className={`... ${i > currentPartIndex ? 'opacity-10 grayscale blur-[2px] pointer-events-none' : 'opacity-100'} transition-all duration-1000`}
```

- Future story sections are shown at 10% opacity with grayscale and blur(2px).
- When unlocked, they transition to full visibility over 1000ms.

---

## 9. Stagger Animations

The application does not use explicit `staggerChildren` or `delayChildren` Framer Motion variants. However, several implicit stagger-like patterns exist:

### 9.1 LoadingFX Background Particles

**File:** `LoadingFX.tsx` (line 173)

Each particle has a random `delay` value between 0 and 5 seconds, creating a natural staggered appearance as they begin their animation loops at different times.

### 9.2 HeroHeader Stars (Sleep Mode)

**File:** `HeroHeader.tsx` (line 115)

Each star has a random `delay` between 0 and 2 seconds, causing them to begin twinkling at staggered intervals.

### 9.3 LoadingFX Word Particles

**File:** `LoadingFX.tsx` (line 69)

New word particles spawn every 300ms via `setInterval`, creating a time-based stagger effect.

### 9.4 SoundManager Sparkle Arpeggio

**File:** `SoundManager.ts` (line 528)

Though audio rather than visual, the sparkle sound staggers 4 tones at 100ms intervals: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz).

---

## 10. Parallax Effects

### 10.1 HeroHeader Scroll Parallax

**File:** `HeroHeader.tsx` (lines 28-32)

```javascript
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 300], [0, 100]);
const opacity = useTransform(scrollY, [0, 300], [1, 0]);
const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
```

Applied to the header content container (line 126):
```jsx
<motion.div style={{ y, opacity, scale }}>
```

- **Vertical parallax:** Content drifts downward 100px as the user scrolls 300px, creating a slower-than-scroll effect.
- **Fade out:** Content fades to transparent over the same 300px scroll range.
- **Scale down:** Content shrinks to 95% size over the scroll range.

### 10.2 Book 3D Perspective (Legacy)

**File:** `Book.tsx` (line 36)

```
transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)'
```

- When setup is visible, the book is pushed 600px into z-space, shifted up 100px, tilted 20 degrees, and scaled to 90%, creating a dramatic 3D depth effect.

---

## 11. Continuous Animations

Animations that loop indefinitely during normal app operation.

| # | Animation | File | Properties | Duration | Notes |
|---|-----------|------|-----------|----------|-------|
| 11.1 | Float | `index.css` | `translateY(0 -> -10px -> 0)` | 3s | General floating effect |
| 11.2 | Breathe | `index.css` | `scale(1 -> 1.05 -> 1)`, `brightness(100% -> 110% -> 100%)` | 6s | Organic breathing pulse |
| 11.3 | Shimmer | `LoadingFX.tsx` (inline) | `translateX(-100% -> 100%)` | 1.5s | Progress bar shine |
| 11.4 | Spin (slow CW) | `LoadingFX.tsx` | `rotate(0 -> 360deg)` | 8s | Outer dashed ring |
| 11.5 | Spin (slow CCW) | `LoadingFX.tsx` | `rotate(360 -> 0deg)` | 12s | Inner dotted ring |
| 11.6 | Icon Pulse | `LoadingFX.tsx` | `scale(0.9 -> 1.1)`, `brightness(100% -> 130%)` | 3s | Central loading icon |
| 11.7 | Star Twinkle | `HeroHeader.tsx` | `opacity(0.1 -> 0.8 -> 0.1)` | 2-4s (random) | Sleep mode stars |
| 11.8 | Sparkle Pulse | `SleepSetup.tsx` | `opacity(0.2 -> 0.8 -> 0.2)`, `scale(1 -> 1.2 -> 1)` | 4s | Sparkle above hero name |
| 11.9 | Theme Icon Bob | `SleepSetup.tsx` | `rotate(0 -> 5 -> -5 -> 0)`, `scale(1 -> 1.05 -> 1)`, `y(0 -> -10 -> 0)` | 6s | Active theme preview icon |
| 11.10 | Background Particles | `LoadingFX.tsx` | Mode-dependent (see Section 2.4) | 0.5-6s (random) | Cosmic background during loading |
| 11.11 | Word Highlight | `SyncedText.tsx` | `color`, `scale(1 -> 1.05)`, `textShadow` | 0.1s (reactive) | Synchronized to audio playback |
| 11.12 | Connector Arrow Pulse | `SleepSetup.tsx` | `animate-pulse` | Default | Visual connector between panels |
| 11.13 | SensoryInput Dot | `SetupShared.tsx` | `animate-pulse` | Default | Small indicator dot next to labels |

---

## 12. Sound-Synced Animations

### 12.1 Word-Level Narration Sync (SyncedText)

**File:** `SyncedText.tsx`

The primary sound-synced animation in the application. Uses `narrationTime` and `narrationDuration` from `useNarrationSync` to calculate which word should be highlighted at any given moment.

**Mechanism:**
1. Total text is split into sentences, then words.
2. Character offset proportional to duration determines each word's time window.
3. `currentTime` is compared against each word's time window.
4. Active word receives:
   - `color: '#2563eb'` (blue-600)
   - `scale: 1.05`
   - `textShadow: '0px 0px 8px rgba(37,99,235,0.2)'`
   - `font-bold` class
5. Active sentence receives:
   - Background highlight `bg-yellow-100/30`
   - Sentence words colored `#1e3a8a` (blue-900)
6. Inactive sentences dim to `opacity: 0.7`

**Timing:** Animation transitions happen in 100ms (`transition={{ duration: 0.1 }}`), keeping word highlighting snappy.

### 12.2 Narration Progress Ring

**File:** `ReadingView.tsx` (lines 191-201)

An SVG circle whose `strokeDashoffset` is driven by the narration playback percentage:

```jsx
strokeDashoffset={260 - (260 * progressPercent) / 100}
```

Where `progressPercent = (narrationTime / narrationDuration) * 100`.

This creates a circular progress indicator around the play/pause button that fills as audio plays.

### 12.3 Sound Effects on User Actions

While not visual animations per se, these sound effects are tightly coupled with visual transitions:

| Sound | Trigger | Visual Pair |
|-------|---------|-------------|
| `playChoice()` | Button clicks | Button hover/press animations |
| `playSparkle()` | Avatar upload, MadLib suggestion pick, settings save | Sparkle visual, success overlay |
| `playPageTurn()` | Load story from history | View transition |
| `playDelete()` | Delete story, reset settings | Removal animation |
| `playAmbient(theme)` | Sleep mode ambient selection | Star field, breathing animations |

---

## 13. Comic Book Effects

### 13.1 Onomatopoeia Word Particles

**File:** `LoadingFX.tsx` (line 11)

```javascript
const PARTICLES_WORDS = ["ZAP!", "POW!", "KABOOM!", "GLOW!", "SHINE!", "SPARK!", "WONDER!", "WHAM!", "BOOM!", "CRASH!"];
```

These words appear as floating particles during loading (classic and madlibs modes only), styled with:
- `font-comic` (Bangers font)
- `text-4xl md:text-6xl`
- `font-black`
- Random rotation (`-30` to `+30` degrees)
- Random colors: `text-yellow-400`, `text-red-500`, `text-blue-400`, `text-purple-400`, `text-white`, `text-pink-500`
- `textShadow: '3px 3px 0 #000'` (black outline)
- `drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`

### 13.2 Comic Button Style

**File:** `index.css` (line 15)

```css
.comic-btn {
    font-family: 'Bangers', cursive;
    border: 4px solid black;
    box-shadow: 6px 6px 0px black;
    transition: all 0.1s ease;
    text-transform: uppercase;
}
```

Thick black borders, solid black offset shadows, and uppercase Bangers font create a classic comic panel button aesthetic. Used on every primary action button throughout the app.

### 13.3 Panel Borders and Shadows

**File:** `Setup.tsx` (line 114)

```
border-[6px] border-black shadow-[12px_12px_0px_rgba(30,58,138,0.3)]
```

The main setup card uses a 6px black border with a large offset shadow, mimicking a comic book panel.

### 13.4 ApiKeyDialog Comic Panel

**File:** `ApiKeyDialog.tsx` (line 16)

```
border-[6px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] p-8 rotate-1
```

- 6px black border with maximum black offset shadow.
- Slight 1-degree rotation for a playful, hand-drawn feel.
- Bouncing key icon badge with thick borders.

### 13.5 Speech Bubble (GeminiWizardStep)

**File:** `SetupShared.tsx` (line 146)

```
bg-white border-4 border-black rounded-3xl rounded-tl-none p-4 md:p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]
```

A speech bubble shape (rounded corners except top-left) with a robot avatar emoji, creating a comic-style dialog interaction.

### 13.6 ErrorBoundary Comic Heading

**File:** `ErrorBoundary.tsx` (line 52)

```jsx
<h2 className="text-4xl font-comic text-red-500 mb-4 animate-bounce">POW! SPLAT!</h2>
```

Comic exclamation text with bounce animation when errors occur.

### 13.7 Decision Prompt (Panel)

**File:** `Panel.tsx` (line 33)

```
<p className="... animate-pulse">What drives you?</p>
```

Pulsing prompt text over story decision panels.

### 13.8 Memory Jar Item Card

**File:** `MemoryJar.tsx` (line 108)

```
border-4 border-slate-700 hover:border-blue-500
```

- Thick bordered cards with color-change hover.
- Story thumbnails rotate 3 degrees on hover for a comic-book tilt.

### 13.9 Title Typography

**Files:** `HeroHeader.tsx` (line 134), `Setup.tsx`

```
font-comic text-6xl md:text-8xl lg:text-9xl drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]
```

Large-scale comic title typography with thick drop shadows, mimicking embossed comic book lettering.

---

## 14. Animation Timing Table

Complete table of every animation with component, trigger, property, duration, easing, and delay.

| # | Component | Trigger | Property | Duration | Easing | Delay |
|---|-----------|---------|----------|----------|--------|-------|
| 1 | `index.css` float | CSS class | translateY | 3s | ease-in-out | 0 |
| 2 | `index.css` breathe | CSS class | scale, brightness | 6s | ease-in-out | 0 |
| 3 | `LoadingFX` shimmer | CSS class (inline) | translateX | 1.5s | linear | 0 |
| 4 | `LoadingFX` spin ring (outer) | CSS class | rotate | 8s | linear | 0 |
| 5 | `LoadingFX` spin ring (inner) | CSS class | rotate (reverse) | 12s | linear | 0 |
| 6 | `LoadingFX` root | Mount/Unmount | opacity | 0.5s | default | 0 |
| 7 | `LoadingFX` bg particles (sleep) | Mount | opacity, scale, y | 3-6s (random) | easeInOut | 0-5s (random) |
| 8 | `LoadingFX` bg particles (classic) | Mount | opacity, scale, y | 0.5-2s (random) | linear | 0-5s (random) |
| 9 | `LoadingFX` bg particles (madlibs) | Mount | opacity, scale, x, y, rotate | 0.5-2s (random) | linear | 0-5s (random) |
| 10 | `LoadingFX` word particles | Interval (300ms) | scale, opacity, y | 1.5s | default | 0 |
| 11 | `LoadingFX` icon pulse | Mount | scale, filter, (rotate) | 3s | easeInOut | 0 |
| 12 | `LoadingFX` status message | Interval (2000ms) | opacity, y | default | default | 0 |
| 13 | `LoadingFX` progress bar | State change | width | spring (k=20, c=10) | spring | 0 |
| 14 | `LoadingFX` aura | CSS class | opacity | default pulse | default | 0 |
| 15 | `App` offline banner | Mount | y | default | default | 0 |
| 16 | `Setup` error banner | Error state | height, opacity | default | default | 0 |
| 17 | `Setup` section | Layout change | dimensions | default (layout) | default | 0 |
| 18 | `Setup` bg color | Mode change | background-color | 1s | CSS transition | 0 |
| 19 | `HeroHeader` star field | Mode=sleep | opacity | 1.5s | default | 0 |
| 20 | `HeroHeader` individual stars | Mode=sleep | opacity | 2-4s (random) | easeInOut | 0-2s (random) |
| 21 | `HeroHeader` tagline | Mode change | opacity, y | default | default | 0 |
| 22 | `HeroHeader` active tab pill | Tab click | layout position | 0.6s | spring (bounce=0.2) | 0 |
| 23 | `HeroHeader` parallax (y) | Scroll (0-300px) | translateY | continuous | linear interp | 0 |
| 24 | `HeroHeader` parallax (opacity) | Scroll (0-300px) | opacity | continuous | linear interp | 0 |
| 25 | `HeroHeader` parallax (scale) | Scroll (0-300px) | scale | continuous | linear interp | 0 |
| 26 | `HeroHeader` bg gradient | Mode change | background-color | 1s | CSS transition | 0 |
| 27 | `ReadingView` main | Mount | opacity | default | default | 0 |
| 28 | `ReadingView` avatar | Layout (layoutId) | position, size | default (layout) | default | 0 |
| 29 | `ReadingView` story sections | Viewport entry | opacity, y (40px) | default | default | 0 |
| 30 | `ReadingView` locked sections | Part unlock | opacity, grayscale, blur | 1s | CSS transition | 0 |
| 31 | `ReadingView` story progress | Part change | width | spring (k=50) | spring | 0 |
| 32 | `ReadingView` narration ring | Audio playback | strokeDashoffset | 0.3s | CSS transition | 0 |
| 33 | `ReadingView` nav bar | Layout change | dimensions | default (layout) | default | 0 |
| 34 | `SyncedText` word highlight | Audio time | color, scale, textShadow, opacity | 0.1s | default | 0 |
| 35 | `CompletionView` card | Mount | scale, opacity | default | default | 0 |
| 36 | `SettingsModal` dialog | Mount/Unmount | scale, opacity | default | default | 0 |
| 37 | `SettingsModal` success bar | Save action | y | default | default | 0 |
| 38 | `SettingsModal` tab content | Tab switch | CSS animate-in | 0.3s | default | 0 |
| 39 | `SetupShared` wizard step | Step change | opacity, x | default | default | 0 |
| 40 | `SetupShared` MadLib dropdown | Focus | opacity, y, scale | default | default | 0 |
| 41 | `SetupShared` length label | Selection | opacity, y (5px) | default | default | 0 |
| 42 | `SetupShared` clear button | Value change | opacity, scale | default | default | 0 |
| 43 | `SetupShared` avatar spinner | Loading state | rotate | continuous (spin) | linear | 0 |
| 44 | `SetupShared` "Painting..." text | Loading state | opacity | default pulse | default | 0 |
| 45 | `SetupShared` empty avatar badge | No avatar | translateY (bounce) | continuous (bounce) | default | 0 |
| 46 | `SetupShared` empty MadLib field | Empty+unfocused | opacity | default pulse | default | 0 |
| 47 | `SetupShared` "CREATE HERO" btn | No avatar | opacity | default pulse | default | 0 |
| 48 | `SleepSetup` sparkle | Mount | opacity, scale | 4s | default | 0 |
| 49 | `SleepSetup` theme icon bob | Mount | rotate, scale, y | 6s | easeInOut | 0 |
| 50 | `SleepSetup` sub-mode pill | Toggle | layout position | 0.6s | spring (bounce=0.2) | 0 |
| 51 | `SleepSetup` selection glow | Theme select | layout position, opacity | default (layout) | default | 0 |
| 52 | `SleepSetup` checkmark | Theme select | scale (0 -> 1) | default | default | 0 |
| 53 | `SleepSetup` theme description | Theme select | opacity, y, blur | default | default | 0 |
| 54 | `SleepSetup` theme card (hover) | Hover | scale (1.05) | default | default | 0 |
| 55 | `SleepSetup` theme card (tap) | Tap | scale (0.95) | default | default | 0 |
| 56 | `SleepSetup` input focus line | Focus | scaleX (0 -> 1) | 0.7s | CSS transition | 0 |
| 57 | `SleepSetup` radial bg (child) | Hover | scale (1.5) | 2s | CSS transition | 0 |
| 58 | `SleepSetup` connector arrow | Always | opacity | default pulse | default | 0 |
| 59 | `SleepSetup` bar reveal | Hover | width (2px -> full) | 1s | CSS transition | 0 |
| 60 | `SleepSetup` container | Mount | CSS animate-in | 0.7s | default | 0 |
| 61 | `SleepSetup` panels (L/R) | Mount | CSS animate-in | 0.5s | default | 0 |
| 62 | `MadlibsSetup` container | Mount | CSS animate-in zoom | 0.5s | default | 0 |
| 63 | `MemoryJar` backdrop | Open/Close | opacity | default | default | 0 |
| 64 | `MemoryJar` drawer | Open/Close | x (100% -> 0) | spring (d=25, k=200) | spring | 0 |
| 65 | `MemoryJar` thumbnail | Hover | rotate (3deg) | default | CSS transition | 0 |
| 66 | `ApiKeyDialog` container | Mount | CSS animate-in | 0.3s | default | 0 |
| 67 | `ApiKeyDialog` key badge | Always | translateY (bounce) | continuous (bounce) | default | 0 |
| 68 | `comic-btn` hover | Hover | translate(-2px,-2px), shadow | 0.1s | ease | 0 |
| 69 | `comic-btn` active | Press | translate(3px,3px), shadow | 0.1s | ease | 0 |
| 70 | `Book` container | Setup visible | transform (3D), filter | 1s | ease-in-out | 0 |
| 71 | `Panel` decision overlay | Resolved | opacity (1 -> 0) | 0.5s | CSS transition | 0 |
| 72 | `VoiceSelector` selected card | Selection | scale (1.05), shadow | default | CSS transition | 0 |
| 73 | `ErrorBoundary` heading | Error | translateY (bounce) | continuous (bounce) | default | 0 |

---

## Accessibility Note

The application supports a **Reduced Motion** preference (`UserPreferences.reducedMotion`) accessible via the Settings Modal. When enabled:

- `document.documentElement.style.scrollBehavior` is set to `'auto'` (instant scroll instead of smooth).
- The preference is stored and persisted, but does not currently disable Framer Motion animations. Full `prefers-reduced-motion` media query support would need to be added for comprehensive motion reduction.

---

## Architecture Notes

- **Animation Library:** [Framer Motion](https://www.framer.com/motion/) v11+ is the primary animation library.
- **CSS Animations:** Tailwind CSS utility classes and custom `@keyframes` in `index.css`.
- **Layout Animations:** `layout` prop and `layoutId` used for shared element transitions.
- **Sound Integration:** `SoundManager.ts` provides synthesized audio (Web Audio API) that pairs with visual interactions but is not frame-synced to animations.
- **Narration Sync:** `useNarrationSync` hook polls audio time via `requestAnimationFrame` for real-time word highlighting in `SyncedText`.
- **Mode-Aware Theming:** Most animations adapt their intensity and color based on the active `AppMode` (`classic`, `madlibs`, `sleep`). Sleep mode uses calmer, slower animations; madlibs mode uses chaotic, energetic ones.
