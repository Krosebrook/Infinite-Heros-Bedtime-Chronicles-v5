# Infinity Heroes: Bedtime Chronicles -- Complete UI States Documentation

> Generated: 2026-02-14
> Covers every component, button, input, modal, and conditional render in the application.

---

## Table of Contents

1. [Application Architecture Overview](#1-application-architecture-overview)
2. [Component State Matrices](#2-component-state-matrices)
3. [Loading States Inventory](#3-loading-states-inventory)
4. [Error States Inventory](#4-error-states-inventory)
5. [Empty States](#5-empty-states)
6. [Button States](#6-button-states)
7. [Input Field States](#7-input-field-states)
8. [Modal / Dialog States](#8-modal--dialog-states)
9. [Conditional Rendering Map](#9-conditional-rendering-map)

---

## 1. Application Architecture Overview

### Phase System

The app has two primary phases controlled by `AppPhase` (`'setup' | 'reading' | 'finished'`):

- **Setup Phase** -- User configures hero name, mode, and story parameters.
- **Reading Phase** -- Story is displayed with narration controls, scene images, and choices.

### Mode System

Three modes change the visual theme and content across nearly every component:

| Mode | ID | Visual Theme | Primary Colors |
|---|---|---|---|
| Classic | `classic` | Comic-book superhero | Blue/Red, white backgrounds |
| Mad Libs | `madlibs` | Chaotic, silly, colorful | Red/Orange/Yellow, white backgrounds |
| Sleep | `sleep` | Calm, dark, dreamy | Indigo/Purple, dark backgrounds |

---

## 2. Component State Matrices

### 2.1 App (App.tsx)

**Location:** Root component

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default (Online, Setup) | Dark slate-950 background, Setup component rendered inside Suspense | App loads, `phase === 'setup'` | `phase`, `isOnline` |
| Default (Online, Reading) | Dark slate-950 background, ReadingView rendered | `phase === 'reading'` and `story` is not null | `phase`, `story` |
| Offline Banner Visible | Fixed amber-500 banner at top: "OFFLINE MODE: Reading from Memory Jar only." slides down from y:-50 | `!isOnline` | `isOnline` (navigator.onLine) |
| API Key Dialog Open | ApiKeyDialog overlay rendered inside AnimatePresence | `showApiKeyDialog === true` | `showApiKeyDialog` |
| Settings Modal Open | SettingsModal overlay rendered inside AnimatePresence | `isSettingsOpen === true` | `isSettingsOpen` |
| Suspense Fallback | Full-screen `<LoadingFX />` (no props, classic mode default) | Lazy-loaded Setup or ReadingView not yet loaded | JS chunk loading state |
| Reduced Motion Active | `document.documentElement.style.scrollBehavior` set to `'auto'` | `userPreferences.reducedMotion === true` | `userPreferences` |

---

### 2.2 HeroHeader (HeroHeader.tsx)

**Location:** Top of Setup page

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Classic Mode | Blue-900 to slate-900 gradient, "HEROES" text in blue-400, tagline "Choose Your Destiny" | `activeMode === 'classic'` | `activeMode` |
| Mad Libs Mode | Red-900 to orange-950 gradient, "HEROES" text in yellow-400, tagline "Unleash The Chaos" | `activeMode === 'madlibs'` | `activeMode` |
| Sleep Mode | Near-black indigo gradient, "HEROES" text in indigo-400, tagline "Drift Into Dreams", 60 twinkling star particles overlaid | `activeMode === 'sleep'` | `activeMode` |
| Parallax Scrolled | Title block translates Y up to 100px, fades to 0 opacity, scales to 0.95 as user scrolls 0-300px | User scrolls page | `scrollY` |
| Logo Hover (with upload) | Logo block scales to 1.05, cursor becomes pointer | Mouse hovers over logo when `onImageUpload` callback is provided | `onImageUpload` |
| Mode Tab Active | Active tab has colored background pill (blue-600/red-500/indigo-600), white text; spring animation on layoutId "activeTab" | Tab clicked | `activeMode` |
| Mode Tab Inactive | Slate-400 text, no background, transparent | Not selected | `activeMode` |
| Mode Tab Hover | No explicit hover style beyond default focus | Mouse over inactive tab | -- |

---

### 2.3 Setup (Setup.tsx)

**Location:** Rendered when `phase === 'setup'`

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default (Classic/Madlibs) | White background panel, black text, blue-900 shadow, border-6 black | `input.mode !== 'sleep'` | `input.mode` |
| Default (Sleep) | Indigo-950 background panel, indigo-50 text | `input.mode === 'sleep'` | `input.mode` |
| Loading Overlay | `<LoadingFX embedded={true}>` absolute overlay covers the setup panel | `isLoading === true` | `isLoading` |
| Error Banner Visible | Red-500 banner with warning icon, error message, and Dismiss button; animates in with height/opacity | `error` is truthy | `error` |
| Error Banner Dismissed | Banner animates out (height:0, opacity:0) | User clicks Dismiss or `onClearError()` | `error` |
| Launch Button Ready (Classic) | Red-600 background, white text, shadow-[10px_10px_0px_black], "ENGAGE MISSION" | `isReady && !isLoading` and mode is classic/madlibs | `isReady`, `isLoading`, `input.mode` |
| Launch Button Ready (Sleep) | Indigo-600 background, white text, white border, glowing shadow, "BEGIN DREAM-LOG" | `isReady && !isLoading` and mode is sleep | `isReady`, `isLoading`, `input.mode` |
| Launch Button Disabled | Slate-200 background, slate-400 text, no shadow, cursor-not-allowed | `!isReady` or `isLoading` or `!isOnline` | `isReady`, `isLoading`, `isOnline` |
| Launch Button Loading | Text changes to "INITIATING..." | `isLoading === true` | `isLoading` |
| Memory Jar Open | MemoryJar drawer slides in from right | `isMemoryJarOpen === true` | `isMemoryJarOpen` |

---

### 2.4 ModeSetup (components/setup/ModeSetup.tsx)

**Location:** Inside Setup panel, switches between setup sub-components

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Classic Mode | Renders `<ClassicSetup>` | `input.mode === 'classic'` | `input.mode` |
| Mad Libs Mode | Renders `<MadlibsSetup>` | `input.mode === 'madlibs'` | `input.mode` |
| Sleep Mode | Renders `<SleepSetup>` | `input.mode === 'sleep'` | `input.mode` |

---

### 2.5 ClassicSetup (components/setup/ClassicSetup.tsx)

**Location:** Inside ModeSetup when mode is `classic`

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Wizard Step 0 | GeminiWizardStep: "Who is our hero today?" with hero name input, Back button disabled | `wizardStep === 0` (default) | `wizardStep` |
| Wizard Step 1 | GeminiWizardStep: "Where does the adventure begin?" with setting input, Back enabled | `wizardStep === 1` | `wizardStep` |
| Wizard Step 2 (Summary) | Shows HeroAvatarDisplay, summary of hero name and world, "Adjust Origin Story" link | `wizardStep === 2` | `wizardStep`, `input.heroName`, `input.setting` |
| Avatar Loading | Spinner inside HeroAvatarDisplay circle | `isAvatarLoading === true` | `isAvatarLoading` |
| Avatar Present | Hero image rendered inside circular avatar frame | `input.heroAvatarUrl` is truthy | `input.heroAvatarUrl` |
| Avatar Empty | DefaultAvatar placeholder with superhero emoji, "No Image" label, bouncing paint badge | `input.heroAvatarUrl` is falsy and not loading | `input.heroAvatarUrl` |

---

### 2.6 MadlibsSetup (components/setup/MadlibsSetup.tsx)

**Location:** Inside ModeSetup when mode is `madlibs`

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default | Sentence template with 5 inline MadLibField inputs interspersed in serif text | Always | `input.madlibs` |
| All Fields Filled | All MadLibField borders turn blue-400, no pulse animation | All 5 madlib values are non-empty | `input.madlibs` |
| Some Fields Empty | Empty fields pulse with red-400 border, filled fields show blue | Mixed state | `input.madlibs` |
| Avatar Section | Same HeroAvatarDisplay as ClassicSetup, using `input.madlibs.animal` for name context | Always rendered above sentence | `input.heroAvatarUrl`, `isAvatarLoading` |

---

### 2.7 SleepSetup (components/setup/SleepSetup.tsx)

**Location:** Inside ModeSetup when mode is `sleep`

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default | Dark indigo theme, hero name input, sub-mode toggle, theme grid, ambient sound buttons | Always | `input.sleepConfig` |
| Sub-mode: Dream Pick (child-friendly) | Left panel shows large animated theme icon with description, right panel shows dreamscape grid | `input.sleepConfig.subMode === 'child-friendly'` | `sleepConfig.subMode` |
| Sub-mode: Parent's Path (parent-madlib) | Left panel shows 3 SensoryInputCard fields (texture, sound, scent), right panel still shows theme grid | `input.sleepConfig.subMode === 'parent-madlib'` | `sleepConfig.subMode` |
| Theme Selected | Selected theme card has indigo-300 border, glow shadow, checkmark icon in top-right, icon at full opacity/color | User clicks a theme | `sleepConfig.theme` |
| Theme Unselected | Indigo-500/10 border, icon at 60% opacity with grayscale | Not selected | `sleepConfig.theme` |
| Theme Hover | Border brightens to indigo-400/30, icon de-grayscales and scales to 110% | Mouse over unselected theme | -- |
| Ambient Sound Active | Selected button has indigo-600 bg, white text, indigo-400 border, shadow glow, icon scales to 125% and rotates 6deg | `sleepConfig.ambientTheme === theme.id` | `sleepConfig.ambientTheme` |
| Ambient Sound Silence | Silence button has indigo-50 bg, indigo-950 text, white border, scale-105 | `sleepConfig.ambientTheme === 'auto'` | `sleepConfig.ambientTheme` |
| Ambient Sound Inactive | Dark bg, low-opacity indigo text | Not selected | `sleepConfig.ambientTheme` |
| Theme Description Display | Animated text fades/blurs in showing selected theme description in italics | A theme is selected | `activeTheme` |
| No Theme Selected | Shows "Select Your World" in very faint indigo text | No theme selected (edge case) | `activeTheme` |

---

### 2.8 SetupShared Components (components/setup/SetupShared.tsx)

#### 2.8.1 DefaultAvatar

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Classic Mode | Light slate background, grayscale superhero emoji at 40% opacity, "No Image" label | `mode === 'classic'` | `mode` |
| Mad Libs Mode | Light slate background, grayscale silly face emoji at 40% opacity | `mode === 'madlibs'` | `mode` |
| Sleep Mode | Dark indigo-900/40 background, sleeping emoji at 60% opacity with slight blur, indigo "No Image" label | `mode === 'sleep'` | `mode` |

#### 2.8.2 HeroAvatarDisplay

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Loading | Spinning blue circle (border-4 border-blue-500 border-t-transparent), "Painting..." text pulsing below | `isLoading === true` | `isLoading` |
| Empty (No URL) | DefaultAvatar rendered, "CREATE HERO" green pulsing button visible at 100% opacity, bouncing badge icon (palette or sparkle) in top-right | `!url && !isLoading` | `url`, `isLoading` |
| Populated | Hero image fills circle, "REPAINT" yellow button hidden until hover | `url` is truthy | `url` |
| Hover (Populated) | Dark overlay (bg-black/40) fades in to 100% opacity, "REPAINT" button becomes visible | Mouse over avatar when `url` exists | -- |
| Hover (Empty) | Overlay remains at bg-black/10 (always visible since no image) | Mouse over avatar when `url` is empty | -- |
| Classic Mode Border | Black border-6, black box-shadow | `mode === 'classic'` or `mode === 'madlibs'` | `mode` |
| Sleep Mode Border | Indigo-400/50 border, indigo glow shadow | `mode === 'sleep'` | `mode` |

#### 2.8.3 MadLibField

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Empty + Not Focused | Red-400 dashed bottom border, red-50/50 background, pulsing animation, "Required" tooltip visible on parent hover | `value.trim().length === 0` and `!isFocused` | `value`, `isFocused` |
| Empty + Focused | Blue-500 dashed bottom border, blue-50 background, suggestions dropdown visible | `value.trim().length === 0` and `isFocused` | `value`, `isFocused` |
| Filled + Not Focused | Blue-400 dashed bottom border, blue-50/50 background, no pulse | `value.trim().length > 0` and `!isFocused` | `value`, `isFocused` |
| Filled + Focused | Blue-500 dashed bottom border, blue-50 background, suggestions dropdown visible | `value.trim().length > 0` and `isFocused` | `value`, `isFocused` |
| Suggestions Dropdown Open | White panel with black border-4, yellow header "Ideas for {label}", list of clickable suggestion buttons | `isFocused === true` | `isFocused`, `suggestions` |
| Suggestions Dropdown Closed | No dropdown visible | `isFocused === false` | `isFocused` |

#### 2.8.4 GeminiWizardStep

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default | Robot avatar (gradient blue-purple circle), speech bubble with prompt, children content, nav buttons | Always | `prompt`, `children` |
| First Step | Back button at 20% opacity, cursor-not-allowed, slate-100 bg | `isFirst === true` | `isFirst` |
| Non-First Step | Back button has white bg, black border, shadow, fully interactive | `isFirst === false` | `isFirst` |
| Last Step | Next button says "Finish!" with green-500 bg | `isLast === true` | `isLast` |
| Non-Last Step | Next button says "Next" with right arrow, blue-500 bg | `isLast === false` | `isLast` |

#### 2.8.5 LengthSlider

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Step Selected | Active step has colored background circle (yellow/blue/purple/red), colored border, white text, shadow, translated up -1, description label below | `value === step` | `value` |
| Step Active (at or before selected) | Circle filled with step's color, elevated | `i <= currentIndex` | `value` |
| Step Inactive | White bg circle, slate-300 border, slate-300 text, grayscale | `i > currentIndex` | `value` |
| Sleep Mode Inactive | Indigo-950 bg circle, indigo-800 border/text (overrides default inactive) | `mode === 'sleep'` and step inactive | `mode`, `value` |
| Progress Track | Colored bar from left to selected step position, rounded, 80% opacity | Always visible | `value` |
| Duration Label | Animates in below selected step: "~3 mins" / "~8 mins" / "~15 mins" / "~25 mins" | Selected step changes | `value` |

#### 2.8.6 SensoryInputCard

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default Empty | Dark indigo card, icon on left, label + description, input with placeholder in indigo-300/20 | `value` is empty | `value` |
| Filled | Input shows text in indigo-50, clear button (X) appears on right side of input | `value` is non-empty | `value` |
| Focused | Input border changes to indigo-400/80, inner glow shadow appears | Input focused | -- |
| Hover | Card border brightens to indigo-400/40, shadow appears, icon scales to 110% | Mouse over card | -- |
| Suggestion Selected | Selected suggestion pill has indigo-500 bg, indigo-400 border, white text, glow, scale-105 | `value === suggestion` | `value`, `suggestions` |
| Suggestion Unselected | Dark pill, indigo-700/30 border, indigo-300/50 text | `value !== suggestion` | `value`, `suggestions` |
| Clear Button | Small round button with X, indigo-800/50 bg, appears with scale animation | `value` is non-empty | `value` |

---

### 2.9 VoiceSelector (components/setup/VoiceSelector.tsx)

**Location:** Inside Setup panel, below mode-specific setup

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Voice Selected (Classic/Madlibs) | Black border, blue-50 bg, black text, shadow-[6px_6px_0px_black], scale-105 | `selectedVoice === v.id` and mode is not sleep | `selectedVoice`, `mode` |
| Voice Selected (Sleep) | Indigo-400 border, indigo-900/40 bg, white text, indigo glow shadow | `selectedVoice === v.id` and `mode === 'sleep'` | `selectedVoice`, `mode` |
| Voice Unselected | Transparent border, 40% opacity | `selectedVoice !== v.id` | `selectedVoice` |
| Voice Hover (Unselected) | Opacity goes to 100%, white/5 background | Mouse over unselected voice | -- |

Available voices (7 total):
- Kore (Soothing), Aoede (Melodic), Zephyr (Gentle/Soft), Leda (Ethereal/Soft), Puck (Playful), Charon (Deep), Fenrir (Bold)

---

### 2.10 MemoryJar (components/setup/MemoryJar.tsx)

**Location:** Slide-out drawer from right side

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Closed | Not rendered (inside AnimatePresence) | `isOpen === false` | `isOpen` |
| Open (Empty) | Full-height right drawer, dark slate-900 bg, "Your jar is currently empty..." with fog emoji at 30% opacity, centered | `isOpen === true` and `history.length === 0` | `isOpen`, `history` |
| Open (Populated) | Scrollable list of story cards, each with avatar thumbnail, title, date, part count, "Offline Ready" badge | `isOpen === true` and `history.length > 0` | `isOpen`, `history` |
| Backdrop | Black/80 overlay behind drawer, clicking it closes drawer | `isOpen === true` | `isOpen` |
| Story Card Default | Slate-800 bg, slate-700 border, avatar thumbnail (or book emoji), blue-300 title | Always | `history` item |
| Story Card Hover | Border changes to blue-500, avatar rotates 3deg, bg lightens to slate-700/50 | Mouse over card | -- |
| Story Card Focus | Ring-4 ring-blue-500/50 appears | Keyboard focus | -- |
| Action Bar | Three buttons at card bottom: Save (download JSON), Share, Delete | Always visible per card | -- |
| Save Button Hover | Text turns white, bg becomes white/10 | Mouse over | -- |
| Share Button Hover | Text turns white, bg becomes white/10 | Mouse over | -- |
| Delete Button Hover | Text turns red-400, bg becomes red-900/20 | Mouse over | -- |
| Drawer Entrance | Slides from x: 100% to x: 0 with spring animation (damping:25, stiffness:200) | `isOpen` becomes true | `isOpen` |
| Drawer Exit | Slides to x: 100% | `isOpen` becomes false | `isOpen` |
| Mobile | Drawer takes full width (`w-full`) | Viewport < md breakpoint | Viewport width |
| Desktop | Drawer is 384px wide (`md:w-96`) | Viewport >= md breakpoint | Viewport width |

---

### 2.11 ReadingView (components/ReadingView.tsx)

**Location:** Rendered when `phase === 'reading'`

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default (Classic/Madlibs) | Warm parchment background (#fcf8ef), gray-800 text, serif font | `input.mode !== 'sleep'` | `input.mode` |
| Default (Sleep) | Indigo-950 background, indigo-100/90 text | `input.mode === 'sleep'` | `input.mode` |
| Entrance Animation | Entire view fades in from opacity:0 to opacity:1 | Component mounts | -- |
| Story Header | Avatar image (scene or hero), story title in large uppercase, red divider line | Always | `story.title`, `scenes`, `input.heroAvatarUrl` |
| Story Part Visible (Current or Past) | Full opacity, no filters, text rendered with SyncedText | `i <= currentPartIndex` | `currentPartIndex` |
| Story Part Hidden (Future) | 10% opacity, grayscale, blur-[2px], pointer-events-none | `i > currentPartIndex` | `currentPartIndex` |
| Story Part Entrance | Fades in from opacity:0 and y:40 when scrolled into viewport (once) | Scroll into viewport | -- |
| Choice Buttons Visible | Grid of 1-2 choice buttons below current part text | `i === currentPartIndex` and `part.choices.length > 0` and `!isSleepMode` | `currentPartIndex`, `part.choices`, `input.mode` |
| Choice Buttons Hidden (Sleep) | No choice buttons rendered even if choices exist | `isSleepMode === true` | `input.mode` |
| Final Part Footer | Lesson section, joke section, and "MISSION COMPLETE" button appear | `currentPartIndex === story.parts.length - 1` | `currentPartIndex`, `story` |
| Normal Font | text-base / md:text-xl / lg:text-2xl | `fontSize === 'normal'` | `fontSize` |
| Large Font | text-xl / md:text-3xl / lg:text-4xl | `fontSize === 'large'` | `fontSize` |
| Narration Playing | Play button shows pause icon, progress ring animates around button, SyncedText highlights words | `isNarrating === true` | `isNarrating` |
| Narration Loading | Play button shows hourglass icon, pulsing, 50% opacity | `isNarrationLoading === true` | `isNarrationLoading` |
| Narration Stopped | Play button shows play triangle icon, progress ring at 0% | `isNarrating === false` and `isNarrationLoading === false` | `isNarrating`, `isNarrationLoading` |
| Muted | Speaker button shows muted icon | `isMuted === true` | `isMuted` |
| Unmuted | Speaker button shows sound icon | `isMuted === false` | `isMuted` |
| Playback Rate Selected | Selected rate button has bg-current, text-white, scale-110 | `playbackRate === rate` | `playbackRate` |
| Playback Rate Unselected | 30% opacity, hover:60% opacity | `playbackRate !== rate` | `playbackRate` |
| Sleep Mode Auto-Scroll | Container auto-scrolls to current part when `currentPartIndex` changes | `isSleepMode` and `currentPartIndex` changes | `currentPartIndex`, `input.mode` |

---

### 2.12 SyncedText (components/SyncedText.tsx)

**Location:** Inside ReadingView for each story part

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Inactive (Not Narrating) | Plain gray-800 text, no highlighting | `isActive === false` or `duration <= 0` | `isActive`, `duration` |
| Active -- Word Highlighted | Current word turns blue (#2563eb), scales to 1.05, gains text-shadow glow, becomes bold | `isActive` and `currentTime` is within word's time range | `currentTime`, `duration` |
| Active -- Sentence Highlighted | Words in current sentence turn dark blue (#1e3a8a), yellow-100/30 background highlight spans sentence | `isActive` and `currentTime` is within sentence's time range | `currentTime`, `duration` |
| Active -- Non-Current Sentence | Words dim to 70% opacity | `isActive` but sentence is not currently being read | `currentTime`, `duration` |

---

### 2.13 CompletionView (components/CompletionView.tsx)

**Location:** Fixed overlay (currently not connected to App.tsx phase flow but available)

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Default | Fixed overlay, dark bg, centered white card with reward badge emoji, title, description, vocab word, "BACK TO BASE" button | Component rendered | `story.rewardBadge`, `story.vocabWord` |
| Entrance | Card scales from 0.9 to 1, fades in from opacity:0 | Component mounts | -- |

---

### 2.14 ErrorBoundary (components/ErrorBoundary.tsx)

**Location:** Wraps Setup and ReadingView in App.tsx

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Normal (No Error) | Renders children transparently | `hasError === false` | `hasError` |
| Error (Default Fallback) | Dark slate-900 panel, red-500 border, bouncing "POW! SPLAT!" heading, error message in monospace box, "Try Again" blue button | Render error caught, no custom `fallback` prop | `hasError`, `error` |
| Error (Custom Fallback) | Renders whatever ReactNode is passed as `fallback` prop | Render error caught, `fallback` prop provided | `hasError`, `fallback` |
| Reset | Returns to rendering children | User clicks "Try Again" (sets `hasError: false`) | -- |

---

### 2.15 Book (Book.tsx) and Panel (Panel.tsx)

**Note:** These components appear to be from an earlier version of the app (comic-book page-flip UI). They are defined but not directly rendered in the current App.tsx flow. Documented here for completeness.

#### Book

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| Closed | Book container, no sheets flipped | `currentSheetIndex === 0` | `currentSheetIndex` |
| Opened | "opened" class added, sheets can be flipped | `currentSheetIndex > 0` | `currentSheetIndex` |
| Setup Visible (Background) | Book pushed back in 3D (translateZ:-600px), blurred, dimmed, non-interactive | `isSetupVisible === true` | `isSetupVisible` |
| Flipped Sheet | Sheet has "flipped" class, z-index changes | Sheet index < `currentSheetIndex` | `currentSheetIndex` |

#### Panel

| State | Visual Description | Trigger | Data Dependencies |
|---|---|---|---|
| No Face | Empty dark (gray-950) div | `face` is undefined | `face` |
| Loading (No Image) | Full-screen LoadingFX | `face.isLoading && !face.imageUrl` | `face.isLoading`, `face.imageUrl` |
| Cover Page | Full-bleed image, "READ ISSUE #1" button (or "PRINTING..." if gate page not ready) | `face.type === 'cover'` | `face.type`, gate page status |
| Story Page | Image with gloss overlay | `face.type === 'story'` | `face.type` |
| Decision Page (Unresolved) | Gradient overlay at bottom, "What drives you?" text pulsing, 1-2 choice buttons (yellow/blue) | `face.isDecisionPage && face.choices.length > 0 && !face.resolvedChoice` | `face.isDecisionPage`, `face.choices`, `face.resolvedChoice` |
| Decision Page (Resolved) | Buttons fade to 0 opacity, pointer-events-none | `face.resolvedChoice` is set | `face.resolvedChoice` |
| Back Cover | Full-bleed image, "DOWNLOAD ISSUE" blue button, "CREATE NEW ISSUE" green button | `face.type === 'back_cover'` | `face.type` |

---

### 2.16 LoadingFX (LoadingFX.tsx)

See Section 3 for detailed breakdown.

---

### 2.17 ApiKeyDialog (ApiKeyDialog.tsx)

See Section 8.1 for detailed breakdown.

---

### 2.18 SettingsModal (components/SettingsModal.tsx)

See Section 8.2 for detailed breakdown.

---

## 3. Loading States Inventory

### 3.1 LoadingFX Component -- All Variants

The LoadingFX component has **two rendering contexts** and **three mode variants**.

#### Rendering Contexts

| Context | Trigger | Positioning | Size |
|---|---|---|---|
| **Full-Screen** (Suspense fallback) | React.lazy chunk not yet loaded | `position: fixed`, fills viewport | Full-size title/icon/progress |
| **Embedded** (Setup overlay) | `isLoading === true` during story generation | `position: absolute`, fills parent panel | Scaled-down title/icon/progress (scale-90) |

#### Mode Variants

| Mode | Title | Icon | Background Gradient | Progress Bar Colors | Particles |
|---|---|---|---|---|---|
| Classic (default) | "INITIATING CORTEX..." or "LAUNCHING {HERO}..." | Lightning bolt emoji | Blue-900 radial to black | Blue-600 to cyan-400 to blue-200 | 60 white star dots + comic word particles (ZAP!, POW!, etc.) |
| Sleep | "WEAVING DREAMS..." or "DREAMING WITH {HERO}..." | Moon emoji | Indigo-950 elliptical to black | Indigo-600 to purple-400 to indigo-200 | 100 white/glow star dots, NO word particles (kept calm) |
| Mad Libs | "GENERATING CHAOS..." | Crazy face emoji | Orange-800 radial to black | Orange-500 to yellow-400 to red-500 | 50 multicolored dots (yellow, red, blue, purple, green) + word particles with chaotic jitter/rotation |

#### Loading Steps (Cycling Messages)

**Classic:**
1. "Initializing Imagination Engines..."
2. "Querying the Multiverse Archives..."
3. "Drafting the Heroic Plotlines..."
4. "Rendering Scenic Wonderlands..."
5. "Polishing the Dialogue Synthesizer..."
6. "Finalizing Destiny Parameters..."

**Sleep:**
1. "Dimming the Lights..."
2. "Fluffing the Clouds..."
3. "Gathering Starlight..."
4. "Quieting the World..."
5. "Weaving Soft Dreams..."
6. "Preparing for Slumber..."

**Mad Libs:**
1. "Mixing Chaos Potions..."
2. "Scrambling the Dictionary..."
3. "Injecting Silly Serums..."
4. "Confusing the Narrator..."
5. "Maximizing Wackiness..."
6. "Launching Logic out the Window..."

#### Progress Bar Behavior
- Starts at 0%, increments randomly
- Below 85%: increments up to 1.5% per 100ms tick
- Above 85%: increments only 0.2% per tick (slows dramatically)
- Never reaches 100% (caps at 99%)
- Spring animation on width transitions
- Shimmer overlay animation (1.5s infinite translateX loop)
- "Processing..." label pulses on left, percentage shown on right

#### Animated Elements
- **Central icon:** Pulsing scale [0.9, 1.1, 0.9] over 3s infinite loop; madlibs mode adds rotation [0, 10, -10, 0]; brightness filter cycles [100%, 130%, 100%]
- **Spinning rings:** Two dashed/dotted rings around icon, spinning at 8s and 12s (reverse)
- **Glowing aura:** 60px blur colored circle behind icon, pulsing opacity
- **Background particles:** Mode-specific animation (sleep: gentle drift; classic: upward warp; madlibs: chaotic jitter + 360deg rotation)
- **Floating word particles:** New comic word every 300ms, scales up then floats upward and fades (classic/madlibs only)
- **Status message flipper:** Cycles through loading steps every 2s with slide-up/fade transition

### 3.2 Story Generation Loading

| Component | Visual | Duration |
|---|---|---|
| Setup panel | LoadingFX embedded overlay covers entire setup card | From "ENGAGE MISSION" click until story data returns or error |
| Launch button | Text changes to "INITIATING..." | Same duration as above |

### 3.3 Avatar Generation Loading

| Component | Visual | Duration |
|---|---|---|
| HeroAvatarDisplay | Blue spinner (border-4 border-blue-500 border-t-transparent, animate-spin), "Painting..." text pulsing below | From generate click until avatar URL returns or error |

### 3.4 Scene Illustration Loading

| Component | Visual | Duration |
|---|---|---|
| (Scenes are loaded into `scenes` record by index) | No explicit loading skeleton in ReadingView; images simply appear when available. `isSceneLoading` is tracked in state but not rendered as a visual indicator in the current ReadingView. | From generate scene click until image URL returns |

### 3.5 Narration Loading

| Component | Visual | Duration |
|---|---|---|
| ReadingView play button | Changes from play/pause icon to hourglass emoji, pulsing animation, 50% opacity | From play click until audio buffer is fetched and starts playing |

### 3.6 Skeleton States

The application does not use traditional skeleton loading patterns. Loading states are handled by the LoadingFX component overlay and individual spinners.

### 3.7 Progress Indicators

| Indicator | Location | Type |
|---|---|---|
| LoadingFX progress bar | Center of loading screen | Indeterminate (non-linear random increment, never reaches 100%) |
| Story progress bar | ReadingView bottom control bar | Determinate: `(currentPartIndex + 1) / story.parts.length * 100%` |
| Narration progress ring | ReadingView play button | SVG circle, `strokeDashoffset` based on `narrationTime / narrationDuration` |

---

## 4. Error States Inventory

### 4.1 ErrorBoundary Crash Screen

**File:** `components/ErrorBoundary.tsx`

| Property | Value |
|---|---|
| Heading | "POW! SPLAT!" with bounce animation |
| Message | "Something went wrong in the multiverse." |
| Error Details | Monospace text in dark box showing `error.message` or "Unknown error" |
| Recovery | "Try Again" blue button resets `hasError` to false |
| Styling | Dark slate-900 bg, red-500 border-4, rounded-xl, comic shadow |
| Scope | Wraps Setup phase and Reading phase independently |

### 4.2 API Failure Messages (Setup Error Banner)

**File:** `Setup.tsx`

| Error Type | Message Pattern | Trigger |
|---|---|---|
| Offline (story) | "You are currently offline. Please connect to the internet to generate a new story." | `generateStory()` called when `!isOnline` |
| Offline (avatar) | "You are offline. Connect to internet to generate avatar." | `generateAvatar()` called when `!isOnline` |
| No hero name | "Please name your hero first!" | `generateAvatar()` called with empty name |
| API Key error | "Invalid API Key configuration." | Story generation error containing "API_KEY" |
| 404 error | ApiKeyDialog opened (not error banner) | Error message contains "404" |
| Avatar failure | "Avatar Error: {message}" or "Avatar Error: Could not generate hero." | `generateAvatar()` catch block |
| Story failure | "Mission Failed: {message}" | `generateStory()` catch block |

**Error Banner Visual:**
- Red-500 background, white text
- Warning triangle emoji on left
- "Transmission Interrupted!" title in comic font, uppercase
- Error message in monospace below
- "Dismiss" button on right (black/20 bg, hover black/40)
- Animates in/out with height and opacity
- z-50 within setup panel

### 4.3 Network Offline Indicator

**File:** `App.tsx`

| Property | Value |
|---|---|
| Position | Fixed, top of viewport, full width |
| Background | Amber-500 |
| Text | "OFFLINE MODE: Reading from Memory Jar only." |
| Animation | Slides down from y:-50 on mount |
| z-index | 500 |
| Visibility | Only when `!isOnline` |
| Border | 2px black bottom border |
| Font | Bold, small, black text |

### 4.4 Validation Error Displays

**MadLibField validation:**
- Empty unfocused field: red-400 dashed border, red-50/50 bg, pulsing animation
- "Required" tooltip: appears on group hover, 8px uppercase text, positioned below field, fades in via opacity transition

---

## 5. Empty States

### 5.1 No Stories Saved (Memory Jar Empty)

**File:** `components/setup/MemoryJar.tsx`

| Property | Value |
|---|---|
| Icon | Fog/cloud emoji (6xl size) |
| Message | "Your jar is currently empty..." (italic, lg size) |
| Opacity | 30% overall |
| Layout | Centered vertically and horizontally in drawer |
| Text Color | White |

### 5.2 No Avatar Generated Yet

**File:** `components/setup/SetupShared.tsx` -- `DefaultAvatar` + `HeroAvatarDisplay`

| Mode | Placeholder Icon | Background | Badge |
|---|---|---|---|
| Classic | Superhero emoji, 40% opacity, grayscale | Slate-100 | Red-500 circle with palette emoji, bouncing |
| Mad Libs | Silly face emoji, 40% opacity, grayscale | Slate-100 | Red-500 circle with palette emoji, bouncing |
| Sleep | Sleeping emoji, 60% opacity, slight blur | Indigo-900/40 | Indigo-500 circle with sparkle emoji, bouncing |

All modes show:
- "No Image" label at bottom of avatar circle
- "CREATE HERO" green pulsing button overlaid at 100% opacity (visible without hover)
- Dot pattern background at 10% opacity

### 5.3 No Narration Available / Stopped

**File:** `components/ReadingView.tsx`

| Property | Value |
|---|---|
| Play Button | Shows play triangle emoji |
| Progress Ring | At 0% (full dashoffset) |
| SyncedText | Plain gray-800 text, no highlighting |
| Narration Time | Reset to 0 |

### 5.4 First-Time User (No Preferences)

**File:** `hooks/useStoryEngine.ts`, `types.ts`

Default preferences loaded from `DEFAULT_PREFERENCES`:

| Preference | Default Value |
|---|---|
| narratorVoice | 'Kore' |
| storyLength | 'medium' |
| sleepTheme | 'Cloud Kingdom' |
| fontSize | 'normal' |
| isMuted | false |
| reducedMotion | false |

Default input state:
- heroName: '' (empty)
- heroPower: '' (empty)
- setting: '' (empty)
- sidekick: '' (empty)
- problem: '' (empty)
- heroAvatarUrl: '' (empty)
- mode: 'classic'
- All madlib fields: '' (empty)
- sleepConfig.subMode: 'automatic'

---

## 6. Button States

### 6.1 Launch / Primary Action Button (Setup.tsx)

| Property | Value |
|---|---|
| **Name** | Launch Button |
| **Location** | Bottom of Setup panel |
| **Label (Classic/Madlibs)** | "ENGAGE MISSION" |
| **Label (Sleep)** | "BEGIN DREAM-LOG" |
| **Label (Loading)** | "INITIATING..." |
| **Default (Classic, Ready)** | `bg-red-600 text-white shadow-[10px_10px_0px_black]`, `comic-btn` class, rounded-2xl, text-2xl/4xl |
| **Default (Sleep, Ready)** | `bg-indigo-600 text-white border-white shadow-[0_10px_40px_rgba(99,102,241,0.5)]` |
| **Hover** | Inherited from `comic-btn` class (likely scale/translate effect) |
| **Active/Pressed (Classic)** | `active:translate-y-1` |
| **Disabled** | `bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-slate-300` |
| **Disabled When** | `!isReady` (missing required fields) OR `isLoading` OR `!isOnline` |

### 6.2 Memory Jar Button (Setup.tsx)

| Property | Value |
|---|---|
| **Name** | Memory Jar Open Button |
| **Location** | Top-right utility bar, position absolute |
| **Label** | Jar emoji, aria-label "Open Memory Jar" |
| **Default** | `w-12 h-12 bg-indigo-900 rounded-full border-4 border-black shadow-[4px_4px_0px_black]` |
| **Hover** | `hover:scale-110` |
| **Active** | `active:scale-95` |

### 6.3 Settings Button (Setup.tsx)

| Property | Value |
|---|---|
| **Name** | Settings Open Button |
| **Location** | Top-right utility bar, next to Memory Jar |
| **Label** | Gear emoji, aria-label "Settings" |
| **Default** | `w-12 h-12 bg-white rounded-full border-4 border-black shadow-[4px_4px_0px_black]` |
| **Hover** | `hover:scale-110 hover:rotate-90` |
| **Active** | `active:scale-95` |

### 6.4 Error Dismiss Button (Setup.tsx)

| Property | Value |
|---|---|
| **Name** | Error Dismiss |
| **Location** | Right side of error banner |
| **Label** | "Dismiss" |
| **Default** | `bg-black/20 p-2 rounded-lg text-sm font-bold uppercase` |
| **Hover** | `hover:bg-black/40` |

### 6.5 Menu Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Menu / Back Button |
| **Location** | Top-left of ReadingView header |
| **Label** | "Menu" |
| **Default** | `bg-black/40 px-3 py-2 rounded-full border border-white/20 backdrop-blur-lg text-white font-comic text-[10px] uppercase` |
| **Hover** | `hover:bg-black/60` |
| **Focus** | `ring-blue-500 focus:ring-2` |

### 6.6 Font Size Toggle Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Font Size Toggle |
| **Location** | Top-right of ReadingView header |
| **Label (Normal)** | "A" |
| **Label (Large)** | "A+" |
| **Default** | `bg-black/40 w-10 h-10 rounded-full border border-white/20 backdrop-blur-lg text-white` |
| **Hover** | `hover:bg-black/60` |
| **Focus** | `ring-blue-500 focus:ring-2` |

### 6.7 Mute Toggle Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Mute Toggle |
| **Location** | Top-right of ReadingView header, next to font size |
| **Label (Unmuted)** | Speaker emoji |
| **Label (Muted)** | Muted speaker emoji |
| **Default** | `bg-black/40 w-10 h-10 rounded-full border border-white/20 backdrop-blur-lg` |
| **Hover** | `hover:bg-black/60` |
| **Focus** | `ring-blue-500 focus:ring-2` |

### 6.8 Play/Pause Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Narration Play/Pause |
| **Location** | Center of ReadingView bottom control bar |
| **Label (Stopped)** | Play triangle emoji (3xl/5xl) |
| **Label (Playing)** | Pause emoji |
| **Label (Loading)** | Hourglass emoji, pulsing, 50% opacity |
| **Hover** | `hover:scale-110` |
| **Active** | `active:scale-90` |
| **Disabled When** | `isNarrationLoading === true` |
| **Progress Ring** | SVG circle wrapping button, stroke-dashoffset based on narration progress |

### 6.9 Stop Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Narration Stop |
| **Location** | Right of Play/Pause in bottom control bar |
| **Label** | Stop square emoji (2xl/3xl) |
| **Default** | 30% opacity |
| **Hover** | `hover:opacity-100 hover:text-red-500` |

### 6.10 Playback Rate Buttons (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Speed Control (0.8x, 1.0x, 1.2x) |
| **Location** | Right section of bottom control bar |
| **Selected** | `bg-current text-white scale-110` |
| **Unselected** | `opacity-30 hover:opacity-60` |
| **Size** | `text-[8px] md:text-[10px] font-black border-2 px-2 py-0.5 rounded-full` |

### 6.11 Story Choice Buttons (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Story Decision Buttons |
| **Location** | Below current story part text |
| **Default** | `bg-blue-500 text-white rounded-2xl border-4 border-black shadow-[6px_6px_0px_black] comic-btn` |
| **Hover** | `hover:scale-[1.03]` |
| **Active** | `active:scale-[0.97]` |
| **Hidden When** | Sleep mode, or not on current part, or no choices available |

### 6.12 Mission Complete Button (ReadingView.tsx)

| Property | Value |
|---|---|
| **Name** | Mission Complete / Reset |
| **Location** | Bottom of story after last part |
| **Label** | "MISSION COMPLETE" |
| **Default** | `bg-red-600 text-white py-5 text-2xl rounded-2xl shadow-[10px_10px_0px_black] comic-btn w-full` |

### 6.13 ApiKeyDialog Continue Button (ApiKeyDialog.tsx)

| Property | Value |
|---|---|
| **Name** | Unlock The Multiverse |
| **Location** | Bottom of API key dialog |
| **Label** | "Unlock The Multiverse" |
| **Default** | `bg-blue-500 text-white text-2xl px-8 py-4 w-full comic-btn uppercase` |
| **Hover** | `hover:bg-blue-400` |
| **Active** | `active:scale-95` |

### 6.14 Settings Modal Save Button (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Name** | Save As Default |
| **Location** | Settings modal footer, right side |
| **Label (Default)** | "Save As Default" |
| **Label (Success)** | "Saved! (checkmark)" |
| **Default** | `bg-green-500 text-white px-8 py-3 text-lg comic-btn shadow-[6px_6px_0px_rgba(0,0,0,0.2)]` |
| **Hover** | `hover:bg-green-400` |

### 6.15 Settings Modal Reset Button (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Name** | Reset Defaults |
| **Location** | Settings modal footer, left side |
| **Label** | "Reset Defaults" |
| **Default** | `text-slate-400 text-xs uppercase font-bold tracking-widest` |
| **Hover** | `hover:text-red-500` |

### 6.16 Settings Modal Close Button (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Name** | Close Settings |
| **Location** | Settings modal header, right side |
| **Label** | X character (4xl) |
| **Hover** | `hover:scale-110` |

### 6.17 MemoryJar Close Button (MemoryJar.tsx)

| Property | Value |
|---|---|
| **Name** | Close Memory Jar |
| **Location** | Memory Jar drawer header, right side |
| **Label** | X character |
| **Default** | `w-10 h-10 bg-black/30 text-white rounded-full` |
| **Hover** | `hover:bg-black/50` |

### 6.18 Mode Tab Buttons (HeroHeader.tsx)

| Property | Value |
|---|---|
| **Name** | Classic / Mad Libs / Sleepy mode tabs |
| **Location** | Floating dock at bottom of HeroHeader |
| **Active** | Colored background pill (blue/red/indigo) via layoutId animation, white text |
| **Inactive** | Slate-400 text, no background |
| **Count** | 3 buttons |

### 6.19 Wizard Navigation Buttons (SetupShared.tsx -- GeminiWizardStep)

| Property | Value |
|---|---|
| **Back Button Default** | `w-12 h-12 rounded-full border-4 border-black bg-white shadow-[4px_4px_0px_black]` |
| **Back Button Disabled** | `opacity-20 cursor-not-allowed bg-slate-100`, no shadow |
| **Back Button Hover** | `hover:bg-slate-50` |
| **Next Button Default** | `h-12 px-6 rounded-full border-4 border-black bg-blue-500 text-white shadow-[4px_4px_0px_black]` |
| **Next Button (Last)** | `bg-green-500 text-white`, label "Finish!" |
| **Next Button Hover** | `hover:-translate-y-1` |

### 6.20 Avatar Generate/Repaint Button (SetupShared.tsx -- HeroAvatarDisplay)

| Property | Value |
|---|---|
| **Label (No Avatar)** | "CREATE HERO" |
| **Label (Has Avatar)** | "REPAINT" |
| **Style (No Avatar)** | `bg-green-500 text-white animate-pulse` |
| **Style (Has Avatar)** | `bg-yellow-400 text-black -rotate-3 hover:rotate-0` |
| **Size** | `text-xs px-3 py-1 comic-btn border-2 border-black shadow-[4px_4px_0px_black]` |

### 6.21 Sleep Sub-Mode Toggle Buttons (SleepSetup.tsx)

| Property | Value |
|---|---|
| **Name** | Dream Pick / Parent's Path toggle |
| **Active** | `bg-indigo-50 text-indigo-950 shadow-[0_10px_20px_rgba(0,0,0,0.3)]`, layoutId pill animation |
| **Inactive** | `text-indigo-400 hover:text-indigo-100` |
| **Size** | `px-8 py-3 rounded-full text-[10px] uppercase` |

### 6.22 Dreamscape Theme Buttons (SleepSetup.tsx)

| Property | Value |
|---|---|
| **Selected** | `border-indigo-300 bg-indigo-900/50 shadow-glow`, icon at full opacity/scale, checkmark in top-right |
| **Unselected** | `border-indigo-500/10 bg-indigo-950/30`, icon at 60% opacity with grayscale |
| **Hover (Unselected)** | `hover:border-indigo-400/30 hover:bg-indigo-900/30`, icon de-grayscales and scales 110% |
| **whileHover** | `scale: 1.05` (Framer Motion) |
| **whileTap** | `scale: 0.95` (Framer Motion) |
| **Size** | `h-32 md:h-40 rounded-3xl` |

### 6.23 Ambient Sound Buttons (SleepSetup.tsx)

| Property | Value |
|---|---|
| **Selected** | `bg-indigo-600 text-white border-indigo-400 shadow-glow scale-105`, icon scales 125% and rotates 6deg |
| **Unselected** | `bg-indigo-950/40 border-indigo-400/10 text-indigo-400` |
| **Hover (Unselected)** | `hover:border-indigo-400/30` |
| **Silence Button Selected** | `bg-indigo-50 text-indigo-950 border-white scale-105` |
| **Count** | 7 (1 Silence + 6 ambient themes) |

### 6.24 Length Slider Step Buttons (SetupShared.tsx -- LengthSlider)

| Property | Value |
|---|---|
| **Selected** | Step's color bg, colored border, white text, shadow, translate-y -1, scale-110, duration label below |
| **Active (before selected)** | Same color, elevated |
| **Inactive** | White/slate bg, grayscale |
| **Hover** | `hover:scale-105` |
| **Focus** | `focus:scale-110` |
| **Size** | `w-12 h-12 md:w-16 md:h-16 rounded-full border-4` |

### 6.25 Voice Selector Buttons (VoiceSelector.tsx)

| Property | Value |
|---|---|
| **Selected (Classic)** | `border-black bg-blue-50 text-black shadow-[6px_6px_0px_black] scale-105` |
| **Selected (Sleep)** | `border-indigo-400 bg-indigo-900/40 text-white shadow-glow` |
| **Unselected** | `border-transparent opacity-40` |
| **Hover (Unselected)** | `hover:opacity-100 hover:bg-white/5` |
| **Size** | `w-24 md:w-32 p-3 md:p-4 rounded-3xl border-2` |
| **Count** | 7 voices |

### 6.26 Sensory Suggestion Chips (SetupShared.tsx -- SensoryInputCard)

| Property | Value |
|---|---|
| **Selected** | `bg-indigo-500 border-indigo-400 text-white shadow-glow scale-105` |
| **Unselected** | `bg-indigo-950/40 border-indigo-700/30 text-indigo-300/50` |
| **Hover (Unselected)** | `hover:text-indigo-100 hover:border-indigo-500 hover:bg-indigo-800/30` |
| **Size** | `px-3 py-1.5 rounded-xl text-[9px] md:text-[10px] uppercase` |

### 6.27 MadLib Suggestion Buttons (SetupShared.tsx -- MadLibField)

| Property | Value |
|---|---|
| **Location** | Dropdown below focused MadLibField |
| **Default** | `px-3 py-2 text-sm font-comic border-b border-gray-100` |
| **Hover** | `hover:bg-blue-100` |
| **Visible When** | Parent MadLibField is focused |

### 6.28 Memory Jar Story Action Buttons (MemoryJar.tsx)

| Button | Default | Hover |
|---|---|---|
| Save (Download) | `text-slate-400 text-xs uppercase` | `hover:text-white hover:bg-white/10` |
| Share | `text-slate-400 text-xs uppercase` | `hover:text-white hover:bg-white/10` |
| Delete | `text-red-900/50 text-xs uppercase` | `hover:text-red-400 hover:bg-red-900/20` |

### 6.29 Settings Category Tab Buttons (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Active** | `bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]` |
| **Inactive** | `text-slate-500 hover:bg-slate-200` |
| **Count** | 3 (General, Voice & Audio, Accessibility) |

### 6.30 Settings Story Length Buttons (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Selected** | `bg-yellow-400 border-black shadow-[4px_4px_0px_black]` |
| **Unselected** | `bg-white border-slate-200 text-slate-400 hover:border-slate-300` |
| **Size** | `p-4 rounded-xl border-4 font-comic uppercase text-sm` |

### 6.31 Settings Narrator Voice Buttons (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Selected** | `bg-blue-50 border-blue-500 text-blue-900 shadow-md scale-105` |
| **Unselected** | `bg-white border-slate-200 text-slate-400 hover:bg-slate-50` |
| **Size** | `p-3 rounded-xl border-2` |

### 6.32 Settings Mute Toggle (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Active (Muted)** | `bg-red-100 text-red-600 border-red-200`, label "MUTED" |
| **Active (Unmuted)** | `bg-green-100 text-green-600 border-green-200`, label "ACTIVE" |
| **Size** | `px-4 py-1 rounded-full text-xs font-black uppercase border-2` |

### 6.33 Settings Font Size Buttons (SettingsModal.tsx)

| Property | Value |
|---|---|
| **Selected** | `bg-white border-black shadow-[4px_4px_0px_black]` |
| **Unselected** | `bg-slate-100 border-slate-300 opacity-50` |
| **Size** | `flex-1 p-6 rounded-xl border-4` |

### 6.34 Settings Reduced Motion Toggle (SettingsModal.tsx)

| Property | Value |
|---|---|
| **On** | Pill bg: `bg-blue-500`, knob translated right (`translate-x-6`) |
| **Off** | Pill bg: `bg-slate-300`, knob at left (`translate-x-0`) |
| **Size** | `w-14 h-8 rounded-full`, knob `w-6 h-6 rounded-full` |

### 6.35 "Adjust Origin Story" Link (ClassicSetup.tsx)

| Property | Value |
|---|---|
| **Default** | `text-slate-400 underline decoration-dotted text-sm` |
| **Hover** | `hover:text-blue-500` |
| **Action** | Resets wizard to step 0 |

### 6.36 Panel Decision Choice Buttons (Panel.tsx)

| Property | Value |
|---|---|
| **First Choice** | `bg-yellow-400 hover:bg-yellow-300 comic-btn py-3 text-xl w-full` |
| **Second Choice** | `bg-blue-500 text-white hover:bg-blue-400 comic-btn py-3 text-xl w-full` |

### 6.37 Panel Cover "Read Issue" Button (Panel.tsx)

| Property | Value |
|---|---|
| **Enabled** | `bg-yellow-400 px-10 py-4 text-3xl comic-btn animate-bounce hover:scale-105`, label "READ ISSUE #1" |
| **Disabled (Printing)** | `bg-gray-400 cursor-wait`, no bounce animation, label "PRINTING... X/Y" |
| **Disabled When** | Gate page image not yet generated |

### 6.38 Panel Back Cover Buttons (Panel.tsx)

| Button | Style |
|---|---|
| Download Issue | `bg-blue-500 text-white px-8 py-3 text-xl comic-btn hover:scale-105` |
| Create New Issue | `bg-green-500 text-white px-8 py-4 text-2xl comic-btn hover:scale-105` |

### 6.39 CompletionView "Back to Base" Button (CompletionView.tsx)

| Property | Value |
|---|---|
| **Default** | `bg-red-600 text-white py-4 text-2xl comic-btn w-full` |

---

## 7. Input Field States

### 7.1 Hero Name Input -- Classic Mode (ClassicSetup.tsx)

| State | Visual Description |
|---|---|
| **Empty** | Placeholder "Hero's name..." visible, transparent bg |
| **Focused** | Blue underline visible (border-b-4 border-blue-500), outline removed |
| **Filled** | User text in 3xl/5xl comic font, centered |
| **Auto-focused** | Input gets `autoFocus` on wizard step 0 |
| **Type** | text |
| **Size** | `text-3xl md:text-5xl font-comic` |

### 7.2 Story Setting Input -- Classic Mode (ClassicSetup.tsx)

| State | Visual Description |
|---|---|
| **Empty** | Placeholder "Place name..." visible |
| **Focused** | Purple underline (border-b-4 border-purple-500), outline removed |
| **Filled** | User text in 3xl/5xl comic font, centered |
| **Auto-focused** | Input gets `autoFocus` on wizard step 1 |
| **Type** | text |

### 7.3 Hero Name Input -- Sleep Mode (SleepSetup.tsx)

| State | Visual Description |
|---|---|
| **Empty** | Placeholder "Hero's name..." in indigo-900, italic serif label "The Sleepy Hero" above |
| **Focused** | Bottom border changes to indigo-400, gradient underline scales from 0 to full width (scale-x-0 to scale-x-100 on focus-within) |
| **Filled** | White text in 4xl/6xl serif font, centered |
| **Type** | text |
| **Size** | `text-4xl md:text-6xl font-serif` |

### 7.4 MadLib Fields (SetupShared.tsx -- MadLibField)

5 inline fields: Adjective, Place, Food, Animal, Silly Word

| State | Visual Description |
|---|---|
| **Empty + Not Focused** | Red-400 dashed bottom border, red-50/50 bg, pulse animation |
| **Empty + Focused** | Blue-500 dashed bottom border, blue-50 bg, suggestions dropdown opens |
| **Filled + Not Focused** | Blue-400 dashed bottom border, blue-50/50 bg |
| **Filled + Focused** | Blue-500 dashed bottom border, blue-50 bg, suggestions dropdown opens |
| **Validation Error** | "Required" tooltip visible on hover when empty and not focused |
| **Type** | text |
| **Size** | `w-28 md:w-36 text-center font-bold text-xl` |
| **Placeholder** | Label name (e.g. "Adjective", "Place") |

### 7.5 Sensory Input Cards -- Sleep Mode (SetupShared.tsx -- SensoryInputCard)

3 fields: World Texture, Gentle Echoes, Dream Aromas

| State | Visual Description |
|---|---|
| **Empty** | Placeholder in very faint indigo-300/20 |
| **Focused** | Border changes to indigo-400/80, inner glow shadow appears |
| **Filled** | Indigo-50 text, clear button (X) appears on right |
| **Type** | text |
| **Size** | `text-lg font-serif rounded-2xl py-3.5 px-5` |
| **Background** | `bg-indigo-900/40 border-2 border-indigo-800/60` |

### 7.6 Dreamscape Select (SettingsModal.tsx)

| State | Visual Description |
|---|---|
| **Default** | Select dropdown with border-4 border-black, serif text, options with emoji prefixes |
| **Focused** | `focus:ring-4 ring-blue-200` |
| **Options** | Cloud Kingdom, Starry Space, Magic Forest, Deep Ocean, Moonlight Meadow |

### 7.7 File Upload Input (HeroHeader.tsx)

| State | Visual Description |
|---|---|
| **Default** | Hidden (`className="hidden"`), triggered by clicking logo |
| **Accept** | `image/*` |
| **Interaction** | Clicking HeroHeader logo opens native file picker |

---

## 8. Modal / Dialog States

### 8.1 ApiKeyDialog (ApiKeyDialog.tsx)

| State | Visual Description | Trigger |
|---|---|---|
| **Closed** | Not rendered | `showApiKeyDialog === false` |
| **Open** | Fixed overlay z-400, black/80 backdrop with backdrop-blur, centered white card with 6px black border, comic shadow, slight rotation (rotate-1) | `showApiKeyDialog === true` |
| **Elements** | Bouncing key emoji badge (-top-8 -left-8), "Secret Identity Required!" red heading, explanation text, "Mission Briefing" section with billing docs link, "Unlock The Multiverse" blue button, "ERROR_CODE: PAYWALL_VILLAIN_DETECTED" footer | -- |
| **Entrance** | `animate-in fade-in zoom-in duration-300` | Component mounts |
| **Backdrop Click** | Does NOT close (no backdrop click handler) | -- |
| **Close Action** | Only via "Unlock The Multiverse" button calling `onContinue` | Button click |

### 8.2 SettingsModal (components/SettingsModal.tsx)

| State | Visual Description | Trigger |
|---|---|---|
| **Closed** | Returns null, not rendered | `isOpen === false` |
| **Open** | Fixed overlay z-1000, black/80 backdrop with backdrop-blur-md, centered white card with rounded-3xl, 6px black border, comic shadow | `isOpen === true` |
| **Entrance** | Scale from 0.9 to 1, fade from 0 to 1 | Component enters AnimatePresence |
| **Exit** | Scale to 0.9, fade to 0 | Component exits AnimatePresence |
| **General Tab** | Default Mission Length grid (4 buttons), Preferred Dreamscape dropdown | `activeTab === 'general'` |
| **Voice & Audio Tab** | System Sound mute toggle, Default Narrator voice grid (7 buttons) | `activeTab === 'voice'` |
| **Accessibility Tab** | Reading Size toggle (Normal/Large), Reduced Motion switch | `activeTab === 'accessibility'` |
| **Tab Transition** | Content area: `animate-in fade-in slide-in-from-right-4 duration-300` | Tab changes |
| **Save Success** | Green overlay slides up from bottom covering entire footer: "Preferences Saved" with floppy disk emoji | After save button clicked, persists 1.2 seconds then closes modal |
| **Backdrop Click** | Does NOT close (no backdrop click handler; only X button closes) | -- |
| **Mobile Layout** | Tabs become horizontal scrollable bar at top of content; full-width layout | Viewport < md |
| **Desktop Layout** | Tabs in 192px left sidebar; content in remaining space | Viewport >= md |

### 8.3 MemoryJar Drawer (components/setup/MemoryJar.tsx)

| State | Visual Description | Trigger |
|---|---|---|
| **Closed** | Not rendered (inside AnimatePresence) | `isOpen === false` |
| **Open** | Right-side drawer slides in from x:100%, dark slate-900 bg, 6px black left border, z-210 | `isOpen === true` |
| **Backdrop** | Separate black/80 overlay div at z-200, clicking closes drawer | `isOpen === true` |
| **Entrance** | Spring animation: `damping: 25, stiffness: 200` | Opening |
| **Exit** | Slides back to x:100% | Closing |

---

## 9. Conditional Rendering Map

### 9.1 App.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `!isOnline` | Amber offline banner at top of screen | Nothing (banner hidden) |
| `showApiKeyDialog` | `<ApiKeyDialog>` overlay | Nothing |
| `isSettingsOpen` | `<SettingsModal>` overlay | Nothing |
| `phase === 'setup'` | `<Setup>` wrapped in `<ErrorBoundary>` | Nothing |
| `phase === 'reading' && story` | `<ReadingView>` wrapped in `<ErrorBoundary>` | Nothing |
| Suspense not resolved | `<LoadingFX />` fallback | Resolved lazy component |
| `userPreferences.reducedMotion` | `scrollBehavior: 'auto'` on documentElement | `scrollBehavior: 'smooth'` |

### 9.2 Setup.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `isLoading` | `<LoadingFX embedded>` overlay on panel | No overlay |
| `error` (truthy) | Red error banner with message and dismiss button | No error banner |
| `isReady && !isLoading` (Classic) | Red-600 launch button with shadow | Slate disabled button |
| `isReady && !isLoading` (Sleep) | Indigo-600 launch button with glow | Slate disabled button |
| `isMemoryJarOpen` | MemoryJar drawer slides in | Drawer hidden |
| `input.mode === 'sleep'` | Panel bg: indigo-950, text: indigo-50 | Panel bg: white, text: black |

### 9.3 HeroHeader.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `activeMode === 'sleep'` | Star field overlay (60 twinkling particles) | No star field |
| `onImageUpload` provided | Logo is clickable, cursor-pointer, hover:scale-105 | Logo is cursor-default, not clickable |
| `isActive` (per mode tab) | Animated background pill (layoutId "activeTab") | No background, slate text |

### 9.4 ClassicSetup.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `wizardStep === 0` | Hero name input step | Hidden |
| `wizardStep === 1` | Setting input step | Hidden |
| `wizardStep === 2` | Summary with avatar, details, and "Adjust" link | Hidden |

### 9.5 SleepSetup.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `sleepConfig.subMode === 'parent-madlib'` | 3 SensoryInputCard fields (texture, sound, scent) on left | Animated theme preview panel with large icon on left |
| `sleepConfig.subMode === 'child-friendly'` | Theme preview panel on left | SensoryInputCard fields on left |
| `sleepConfig.ambientTheme !== 'auto'` | Ambient sound plays via SoundManager | Ambient sound stopped |
| `activeTheme` exists | Theme description shows animated italic text | "Select Your World" placeholder text |
| Theme `isSelected` | Checkmark in top-right, gradient glow overlay | No checkmark, no glow |

### 9.6 SetupShared.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `isLoading` (HeroAvatarDisplay) | Spinner + "Painting..." | Avatar image or DefaultAvatar |
| `url` truthy (HeroAvatarDisplay) | Hero image rendered | DefaultAvatar placeholder |
| `!url && !isLoading` (HeroAvatarDisplay) | Bouncing badge icon in top-right | No badge |
| `url` truthy (HeroAvatarDisplay button) | Overlay hidden by default, shows on hover | Overlay always at 10% opacity |
| `isFocused` (MadLibField) | Suggestions dropdown visible | Dropdown hidden |
| `!isValid && !isFocused` (MadLibField) | "Required" tooltip on hover | No tooltip |
| `value` truthy (SensoryInputCard) | Clear (X) button visible in input | No clear button |
| `suggestions.length > 0` (SensoryInputCard) | Suggestion chips rendered below input | No chips |
| `isSelected` (LengthSlider step) | Duration label animates in below step | No label |

### 9.7 ReadingView.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `i <= currentPartIndex` | Part at full opacity, interactive | Part at 10% opacity, grayscale, blurred, non-interactive |
| `i === currentPartIndex && part.choices.length > 0 && !isSleepMode` | Choice button grid below text | No choice buttons |
| `currentPartIndex === story.parts.length - 1` | Footer with lesson, joke, and "MISSION COMPLETE" button | No footer |
| `isNarrationLoading` | Hourglass icon, pulsing, button disabled | Play or Pause icon, button enabled |
| `isNarrating` | Pause icon | Play icon |
| `isMuted` | Muted speaker emoji | Speaker emoji |
| `fontSize === 'normal'` | Smaller text classes | Larger text classes |
| `isSleepMode` | Auto-scroll to current part, indigo theme, no choice buttons | Parchment theme, choice buttons shown |

### 9.8 SyncedText.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `!isActive \|\| duration <= 0` | Plain paragraph, no highlighting | (falls to active rendering below) |
| `isActive && duration > 0` | Per-word highlighting with color, scale, shadow animations | (handled above) |
| `isSentenceActive` | Yellow background highlight on sentence span | No highlight |
| `isWordActive` | Blue text, bold, scale 1.05, glow shadow | Dark text, normal weight, scale 1 |

### 9.9 SettingsModal.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `!isOpen` | Returns null (component not rendered) | Full modal rendered |
| `activeTab === 'general'` | Story length + dreamscape settings | Hidden |
| `activeTab === 'voice'` | Mute toggle + narrator voice grid | Hidden |
| `activeTab === 'accessibility'` | Font size + reduced motion toggles | Hidden |
| `showSuccess` | Green success overlay in footer | Normal footer |

### 9.10 MemoryJar.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `isOpen` | Backdrop + Drawer rendered | Nothing rendered |
| `history.length === 0` | Empty state (fog emoji + message) | Story card list |
| `history.length > 0` | Scrollable list of story cards | (handled above) |
| `h.avatar` truthy | Avatar thumbnail image in card | Book emoji placeholder |

### 9.11 Panel.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `!face` | Empty gray-950 div | Panel content |
| `face.isLoading && !face.imageUrl` | Full LoadingFX | Panel content |
| `face.imageUrl` truthy | Image element rendered | No image |
| `face.isDecisionPage && choices.length > 0` | Decision overlay with choice buttons | No overlay |
| `face.resolvedChoice` truthy | Decision overlay fades to 0 opacity | Decision overlay at full opacity |
| `face.type === 'cover'` | "READ ISSUE" button overlay | No cover button |
| `face.type === 'back_cover'` | Download + Create New buttons | No back cover buttons |

### 9.12 ModeSetup.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `input.mode === 'classic'` | `<ClassicSetup>` | -- |
| `input.mode === 'sleep'` | `<SleepSetup>` | -- |
| `input.mode === 'madlibs'` | `<MadlibsSetup>` | -- |
| default | `null` | -- |

### 9.13 ErrorBoundary.tsx Conditionals

| Condition | Renders When True | Renders When False |
|---|---|---|
| `hasError && fallback` | Custom fallback ReactNode | -- |
| `hasError && !fallback` | Default crash screen with error details and "Try Again" | -- |
| `!hasError` | `children` rendered normally | -- |

---

## Appendix: Sound Effects Triggered by UI Interactions

| Sound | Method | Triggered By |
|---|---|---|
| Choice / Click | `soundManager.playChoice()` | Mode tab click, Memory Jar open, Settings open, input focus (MadLib), all button clicks in ReadingView, voice/length/theme selection, sub-mode toggle |
| Page Turn | `soundManager.playPageTurn()` | Story generated and phase transitions to reading, story loaded from history, choice advances part |
| Sparkle | `soundManager.playSparkle()` | Avatar generated/uploaded, MadLib suggestion selected, Settings saved |
| Delete | `soundManager.playDelete()` | Story deleted from Memory Jar, Settings reset to defaults |
| Ambient | `soundManager.playAmbient(theme)` | Sleep mode ambient theme selected (6 variants: space, rain, forest, magic, ocean, crickets) |
| Stop Ambient | `soundManager.stopAmbient()` | Ambient theme set to 'auto'/silence, mode changes away from sleep, component unmounts |

All sounds are suppressed when `isMuted === true`.
