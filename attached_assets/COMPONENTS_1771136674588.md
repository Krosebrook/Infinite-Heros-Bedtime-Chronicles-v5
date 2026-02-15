# Infinity Heroes: Bedtime Chronicles -- Component Documentation

## Table of Contents

1. [Component Hierarchy Tree](#component-hierarchy-tree)
2. [Shared Types (types.ts)](#shared-types)
3. [Top-Level Components](#top-level-components)
4. [Setup Components](#setup-components)
5. [Reading Components](#reading-components)
6. [Shared / Utility Components](#shared--utility-components)
7. [Custom Hooks](#custom-hooks)
8. [Singleton Services](#singleton-services)
9. [State Flow](#state-flow)
10. [Animation Patterns](#animation-patterns)
11. [Styling Patterns](#styling-patterns)

---

## Component Hierarchy Tree

```
index.tsx
  └── <App />                           (App.tsx)
        ├── <ApiKeyDialog />            (ApiKeyDialog.tsx)
        ├── <SettingsModal />           (components/SettingsModal.tsx)
        ├── <LoadingFX />               (LoadingFX.tsx) -- Suspense fallback
        ├── <ErrorBoundary />           (components/ErrorBoundary.tsx)
        │     └── <Setup />             (Setup.tsx)
        │           ├── <HeroHeader />  (HeroHeader.tsx)
        │           ├── <ModeSetup />   (components/setup/ModeSetup.tsx)
        │           │     ├── <ClassicSetup />   (components/setup/ClassicSetup.tsx)
        │           │     │     ├── <GeminiWizardStep />   (components/setup/SetupShared.tsx)
        │           │     │     └── <HeroAvatarDisplay />  (components/setup/SetupShared.tsx)
        │           │     ├── <MadlibsSetup />   (components/setup/MadlibsSetup.tsx)
        │           │     │     ├── <HeroAvatarDisplay />
        │           │     │     └── <MadLibField />        (components/setup/SetupShared.tsx)
        │           │     └── <SleepSetup />     (components/setup/SleepSetup.tsx)
        │           │           ├── <HeroAvatarDisplay />
        │           │           └── <SensoryInputCard />   (components/setup/SetupShared.tsx)
        │           ├── <LengthSlider />         (components/setup/SetupShared.tsx)
        │           ├── <VoiceSelector />        (components/setup/VoiceSelector.tsx)
        │           ├── <MemoryJar />            (components/setup/MemoryJar.tsx)
        │           └── <LoadingFX />            (LoadingFX.tsx) -- embedded overlay
        │
        └── <ErrorBoundary />
              └── <ReadingView />        (components/ReadingView.tsx)
                    └── <SyncedText />   (components/SyncedText.tsx)

Legacy (not rendered by App but importable):
  ├── <Book />                           (Book.tsx)
  │     └── <Panel />                    (Panel.tsx)
  └── <CompletionView />                 (components/CompletionView.tsx)
```

---

## Shared Types

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\types.ts`

### Type Aliases

| Type | Definition |
|------|-----------|
| `AppMode` | `'classic' \| 'madlibs' \| 'sleep'` |
| `SleepSubMode` | `'automatic' \| 'parent-madlib' \| 'child-friendly'` |
| `StoryLength` | `'short' \| 'medium' \| 'long' \| 'eternal'` |
| `AmbientTheme` | `'space' \| 'rain' \| 'forest' \| 'magic' \| 'ocean' \| 'crickets' \| 'auto'` |
| `AppPhase` | `'setup' \| 'reading' \| 'finished'` |

### Interfaces

#### `SleepConfig`
```ts
interface SleepConfig {
    subMode: SleepSubMode;
    texture: string;
    sound: string;
    scent: string;
    theme: string;
    ambientTheme: AmbientTheme;
}
```

#### `MadLibState`
```ts
interface MadLibState {
    adjective: string;
    place: string;
    food: string;
    sillyWord: string;
    animal: string;
}
```

#### `StoryState`
The primary input/configuration object that flows through the Setup phase and into story generation.
```ts
interface StoryState {
    heroName: string;
    heroPower: string;
    setting: string;
    sidekick: string;
    problem: string;
    heroAvatarUrl?: string;
    mode: AppMode;
    madlibs: MadLibState;
    sleepConfig: SleepConfig;
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr' | 'Leda';
    storyLength: StoryLength;
}
```

#### `StoryPart`
```ts
interface StoryPart {
    text: string;
    choices?: string[];
    partIndex: number;
}
```

#### `StoryFull`
The complete AI-generated story structure.
```ts
interface StoryFull {
    title: string;
    parts: StoryPart[];
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
    rewardBadge: { emoji: string; title: string; description: string };
}
```

#### `ComicFace`
Used by the legacy Book/Panel components for comic-book page rendering.
```ts
interface ComicFace {
    pageIndex?: number;
    type: 'cover' | 'story' | 'back_cover';
    imageUrl?: string;
    isLoading?: boolean;
    isDecisionPage?: boolean;
    choices: string[];
    resolvedChoice?: string;
}
```

#### `UserPreferences`
Persisted user settings stored in IndexedDB.
```ts
interface UserPreferences {
    narratorVoice: StoryState['narratorVoice'];
    storyLength: StoryLength;
    sleepTheme: string;
    fontSize: 'normal' | 'large';
    isMuted: boolean;
    reducedMotion: boolean;
}
```

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `DEFAULT_PREFERENCES` | `{ narratorVoice: 'Kore', storyLength: 'medium', sleepTheme: 'Cloud Kingdom', fontSize: 'normal', isMuted: false, reducedMotion: false }` | Fallback user preferences |
| `TOTAL_PAGES` | `18` | Total comic pages (legacy Book component) |
| `INITIAL_PAGES` | `6` | Pages generated before book opens (legacy) |
| `GATE_PAGE` | `1` | Minimum page required to open book (legacy) |

---

## Top-Level Components

### App

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\App.tsx`

**Purpose:** Root application component. Orchestrates phase transitions (setup -> reading), manages global UI state, and delegates all story logic to `useStoryEngine`.

**Props:** None (root component).

**State Management:**
- `isSettingsOpen: boolean` -- Controls visibility of the SettingsModal.
- All story-related state is delegated to the `useStoryEngine` hook.
- API key dialog state is delegated to the `useApiKey` hook.
- Narration sync state is delegated to the `useNarrationSync` hook.

**Key Behaviors:**
- Lazy-loads `Setup` and `ReadingView` with `React.lazy()` and `Suspense` for code splitting.
- Displays an offline banner when `isOnline` is false.
- Applies `reducedMotion` preference globally by toggling `scrollBehavior` on `documentElement`.
- Wraps phase-specific views in `ErrorBoundary` components.
- Renders `ApiKeyDialog` and `SettingsModal` via `AnimatePresence` for enter/exit animations.

**Child Components:** `ApiKeyDialog`, `SettingsModal`, `LoadingFX` (Suspense fallback), `ErrorBoundary`, `Setup`, `ReadingView`.

**Hooks Used:** `useState`, `useApiKey`, `useStoryEngine`, `useNarrationSync`.

---

### Setup

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\Setup.tsx`

**Purpose:** The story configuration/creation phase. Lets users pick a mode, configure story parameters, select narrator voice and length, and launch story generation.

**Props Interface (`SetupProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `StoryState` | Yes | Current story configuration state |
| `onChange` | `(field: keyof StoryState, value: any) => void` | Yes | Field-level state updater |
| `handleMadLibChange` | `(field: keyof MadLibState, value: string) => void` | Yes | Mad Libs field updater |
| `onLaunch` | `() => void` | Yes | Triggers story generation |
| `onGenerateAvatar` | `() => void` | Yes | Triggers AI avatar generation |
| `isLoading` | `boolean` | Yes | Whether story is currently generating |
| `isAvatarLoading` | `boolean` | Yes | Whether avatar is currently generating |
| `isOnline` | `boolean` | Yes | Network connectivity status |
| `history` | `CachedStory[]` | Yes | Previously saved stories |
| `onLoadHistory` | `(cached: CachedStory) => void` | Yes | Load a saved story for reading |
| `handleSleepConfigChange` | `(field: keyof SleepConfig, value: string) => void` | Yes | Sleep config field updater |
| `onDeleteHistory` | `(id: string) => void` | Yes | Delete a saved story |
| `onPrepareSequel` | `(cached: CachedStory) => void` | Yes | Pre-fill setup for a sequel |
| `error` | `string \| null` | No | Current error message to display |
| `onClearError` | `() => void` | No | Dismiss error banner |
| `onOpenSettings` | `() => void` | Yes | Open global settings modal |

**State Management:**
- `isMemoryJarOpen: boolean` -- Controls the Memory Jar drawer visibility.
- Derived: `isReady` (memoized) -- Whether current config is valid for launch.
- Derived: `launchButtonText` (memoized) -- Context-aware button label.

**Key Behaviors:**
- Readiness validation varies by mode: Classic requires heroName + setting; Mad Libs requires all fields filled; Sleep requires heroName.
- Launch button is disabled when `!isReady || isLoading || !isOnline`.
- The main setup card transitions background color for Sleep mode (dark indigo) vs other modes (white).
- Embeds `LoadingFX` as an overlay within the setup card during story generation.
- Error banner animates in/out with expand/collapse.

**Child Components:** `HeroHeader`, `ModeSetup`, `LengthSlider`, `VoiceSelector`, `MemoryJar`, `LoadingFX`.

**Hooks Used:** `useMemo`, `useState`.

---

### HeroHeader

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\HeroHeader.tsx`

**Purpose:** Animated hero banner with the "INFINITY HEROES" title, mode-aware gradient backgrounds, parallax scrolling, mode selection dock, and optional image upload.

**Props Interface (`HeroHeaderProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeMode` | `AppMode` | Yes | Currently selected story mode |
| `onModeChange` | `(mode: AppMode) => void` | Yes | Callback when mode tab is clicked |
| `onImageUpload` | `(base64: string) => void` | No | Callback with base64 image data on file upload |

**State Management:**
- `stars` (memoized) -- Array of 60 star objects for Sleep mode star field.
- No explicit `useState` -- relies on Framer Motion scroll values.

**Key Behaviors:**
- Parallax effect on scroll using `useScroll` and `useTransform` (y translation, opacity fade, scale reduction over 0-300px scroll).
- Mode-specific background gradients: blue (classic), red/orange (madlibs), deep indigo (sleep).
- Sleep mode renders an animated star field with 60 twinkling stars.
- Floating mode dock at the bottom uses `layoutId="activeTab"` for smooth tab indicator animation.
- Clicking the logo triggers a hidden file input for hero avatar upload.
- Each mode has: id, label, icon emoji, color class, and tagline.

**Child Components:** None (leaf component).

**Hooks Used:** `useRef`, `useMemo`, `useScroll` (Framer Motion), `useTransform` (Framer Motion).

---

## Setup Components

### ModeSetup

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\ModeSetup.tsx`

**Purpose:** Router component that conditionally renders the appropriate setup form based on the current `input.mode`.

**Props Interface (`ModeSetupProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `StoryState` | Yes | Current story configuration |
| `onChange` | `(field: keyof StoryState, value: any) => void` | Yes | Field updater |
| `handleMadLibChange` | `(field: keyof MadLibState, value: string) => void` | Yes | Mad Libs field updater |
| `handleSleepConfigChange` | `(field: keyof SleepConfig, value: string) => void` | Yes | Sleep config updater |
| `isAvatarLoading` | `boolean` | Yes | Avatar loading state |
| `onGenerateAvatar` | `() => void` | Yes | Avatar generation trigger |

**Key Behaviors:**
- Simple switch statement renders `ClassicSetup`, `SleepSetup`, or `MadlibsSetup`.
- No internal state.

**Child Components:** `ClassicSetup`, `MadlibsSetup`, `SleepSetup`.

---

### ClassicSetup

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\ClassicSetup.tsx`

**Purpose:** Multi-step wizard for the Classic adventure mode. Collects hero name, setting, and avatar.

**Props Interface (`ClassicSetupProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `StoryState` | Yes | Current story configuration |
| `onChange` | `(field: keyof StoryState, value: any) => void` | Yes | Field updater |
| `isAvatarLoading` | `boolean` | Yes | Avatar loading state |
| `onGenerateAvatar` | `() => void` | Yes | Avatar generation trigger |

**State Management:**
- `wizardStep: number` -- Tracks current wizard step (0: hero name, 1: setting, 2: review/avatar).

**Key Behaviors:**
- Step 0: Hero name input with robot prompt ("Who is our hero today?").
- Step 1: Setting input ("Where does the adventure begin?").
- Step 2: Summary view showing hero name + setting, avatar display, and link to go back.
- Uses `GeminiWizardStep` wrapper for consistent wizard UI across steps.

**Child Components:** `GeminiWizardStep`, `HeroAvatarDisplay`.

---

### MadlibsSetup

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\MadlibsSetup.tsx`

**Purpose:** Mad Libs style story input. Displays a fill-in-the-blank sentence with inline `MadLibField` inputs.

**Props Interface (`MadlibsSetupProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `StoryState` | Yes | Current story configuration |
| `handleMadLibChange` | `(field: keyof MadLibState, value: string) => void` | Yes | Individual Mad Lib field updater |
| `onChange` | `(field: keyof StoryState, value: any) => void` | Yes | General field updater |
| `isAvatarLoading` | `boolean` | Yes | Avatar loading state |
| `onGenerateAvatar` | `() => void` | Yes | Avatar generation trigger |

**Key Behaviors:**
- Renders a narrative sentence with inline blank fields for: Adjective, Place, Food, Animal, Silly Word.
- Each `MadLibField` has pre-defined suggestion lists.
- Includes a `HeroAvatarDisplay` at the top.

**Child Components:** `HeroAvatarDisplay`, `MadLibField`.

---

### SleepSetup

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\SleepSetup.tsx`

**Purpose:** Configuration UI for Sleep/bedtime mode. Supports two sub-modes: "Dream Pick" (child-friendly theme selection) and "Parent's Path" (sensory detail input).

**Props Interface (`SleepSetupProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `StoryState` | Yes | Current story configuration |
| `onChange` | `(field: keyof StoryState, value: any) => void` | Yes | Field updater |
| `handleSleepConfigChange` | `(field: keyof SleepConfig, value: string) => void` | Yes | Sleep config updater |
| `isAvatarLoading` | `boolean` | Yes | Avatar loading state |
| `onGenerateAvatar` | `() => void` | Yes | Avatar generation trigger |

**State Management:**
- No explicit state. Relies on `input.sleepConfig` from parent.

**Key Behaviors:**
- Sub-mode toggle between `child-friendly` ("Dream Pick") and `parent-madlib` ("Parent's Path") with animated pill indicator (`layoutId="submode-pill"`).
- Left column: In "parent-madlib" mode, shows three `SensoryInputCard` components for texture, sound, and scent. In "child-friendly" mode, shows a large preview of the selected dreamscape theme.
- Right column: Grid of 5 dreamscape theme buttons (Cloud Kingdom, Starry Space, Magic Forest, Deep Ocean, Moonlight Meadow) with selection glow animation (`layoutId="selection-glow"`).
- Bottom: Ambient sound selector with 6 themes (Rain, Forest, Ocean, Crickets, Space, Magic) plus Silence.
- Manages ambient audio via `soundManager.playAmbient()` in a `useEffect` that starts/stops based on selected theme.
- All theme buttons include descriptive text that animates with blur transitions.

**Child Components:** `HeroAvatarDisplay`, `SensoryInputCard`.

**Hooks Used:** `useEffect`.

---

### VoiceSelector

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\VoiceSelector.tsx`

**Purpose:** Radio button group for selecting the TTS narrator voice.

**Props Interface (`VoiceSelectorProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedVoice` | `StoryState['narratorVoice']` | Yes | Currently selected voice |
| `onVoiceChange` | `(voice: StoryState['narratorVoice']) => void` | Yes | Voice change callback |
| `mode` | `AppMode` | Yes | Current mode (affects styling) |

**Key Behaviors:**
- Renders 7 voice options: Kore (Soothing), Aoede (Melodic), Zephyr (Gentle), Leda (Ethereal), Puck (Playful), Charon (Deep), Fenrir (Bold).
- Uses ARIA `role="radiogroup"` and `role="radio"` for accessibility.
- Selected voice has elevated styling; sleep mode uses indigo tones, other modes use black/blue.

**Exported Constants:**
- `VOICES` -- Array of `{ id, icon, label }` objects used by both `VoiceSelector` and `SettingsModal`.

**Child Components:** None (leaf component).

---

### MemoryJar

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\MemoryJar.tsx`

**Purpose:** Slide-in drawer displaying saved stories (from IndexedDB). Allows loading, downloading, sharing, and deleting stories.

**Props Interface (`MemoryJarProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls drawer visibility |
| `onClose` | `() => void` | Yes | Close drawer callback |
| `history` | `CachedStory[]` | Yes | Array of cached stories |
| `onLoadHistory` | `(cached: CachedStory) => void` | Yes | Load story for reading |
| `onDeleteHistory` | `(id: string) => void` | Yes | Delete a story |

**Key Behaviors:**
- Slides in from the right with spring animation.
- Renders a backdrop overlay that closes the drawer on click.
- Each story card shows: avatar thumbnail, title, date, part count, and "Offline Ready" badge.
- Action bar per story: Save (downloads JSON), Share (Web Share API with clipboard fallback), Delete.
- Empty state shows a ghost icon with "Your jar is currently empty..." message.
- Uses ARIA `role="dialog"` and `aria-modal="true"`.

**Child Components:** None (leaf component).

---

### SetupShared (Shared Setup Components)

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\setup\SetupShared.tsx`

This file exports multiple reusable sub-components used across setup modes:

#### DefaultAvatar

**Purpose:** Placeholder avatar shown when no hero image has been generated.

**Props:** `{ mode: AppMode }`

**Key Behaviors:** Displays a mode-specific emoji icon (sleep: sleepy face, madlibs: wacky face, classic: superhero) with halftone dot pattern background. Shows "No Image" label.

---

#### HeroAvatarDisplay

**Purpose:** Circular avatar display with loading spinner, image preview, and generate/repaint action button.

**Props:** `{ url?: string, isLoading: boolean, onGenerate: () => void, mode: AppMode }`

**Key Behaviors:**
- Shows loading spinner with "Painting..." text when generating.
- Shows `DefaultAvatar` when no URL and not loading.
- Shows the generated image when URL is present.
- Hover overlay with "REPAINT" (if image exists) or "CREATE HERO" (if empty) button.
- Decorative bounce badge when no avatar exists.

---

#### MadLibField

**Purpose:** Inline text input with validation styling and suggestion dropdown for Mad Libs mode.

**Props:** `{ label: string, value: string, onChange: (val: string) => void, suggestions: string[] }`

**State:** `isFocused: boolean`

**Key Behaviors:**
- Dashed underline input with validation colors: red pulsing when empty, blue when valid/focused.
- Focus reveals a dropdown with pre-defined suggestions.
- "Required" tooltip appears on hover when empty and unfocused.
- Uses delayed blur (200ms) to allow clicking suggestions.

---

#### GeminiWizardStep

**Purpose:** Wrapper component providing a consistent wizard step layout with robot avatar, speech bubble prompt, content area, and navigation buttons.

**Props:** `{ prompt: string, children: ReactNode, onNext: () => void, onBack: () => void, isFirst: boolean, isLast: boolean }`

**Key Behaviors:** Renders a robot emoji in a gradient circle with a speech bubble containing the prompt. Shows back/next navigation with the last step showing "Finish!" in green.

---

#### LengthSlider

**Purpose:** Visual step selector for story length (Short, Medium, Long, Eternal).

**Props:** `{ value: StoryLength, onChange: (val: StoryLength) => void, mode: AppMode }`

**Key Behaviors:**
- Renders 4 circular step buttons along a progress track.
- Each step has an icon, color, label, and duration estimate (~3 min to ~25 min).
- Active progress track fills to the selected step.
- Selected step shows animated duration label.
- Sleep mode applies dark indigo styling to inactive steps.

---

#### SensoryInputCard

**Purpose:** Rich input card for Sleep mode sensory details (texture, sound, scent).

**Props Interface (`SensoryInputProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `string` | Yes | Emoji icon |
| `label` | `string` | Yes | Field label |
| `description` | `string` | Yes | Helper text |
| `placeholder` | `string` | Yes | Input placeholder |
| `value` | `string` | Yes | Current value |
| `onChange` | `(val: string) => void` | Yes | Change callback |
| `suggestions` | `string[]` | No | Pre-defined suggestion chips (default: `[]`) |

**Key Behaviors:**
- Card with icon, label, description, and a text input.
- Clear button appears when value is non-empty (animated in/out).
- Suggestion chips below the input; selected suggestion is highlighted.
- Dark indigo theme consistent with Sleep mode.

---

## Reading Components

### ReadingView

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\ReadingView.tsx`

**Purpose:** The main reading experience. Displays story text with synced narration highlighting, playback controls, choice buttons, and completion content.

**Props Interface (`ReadingViewProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `story` | `StoryFull` | Yes | The generated story |
| `input` | `StoryState` | Yes | Story configuration (for mode, voice, avatar) |
| `currentPartIndex` | `number` | Yes | Index of the current story part |
| `narrationTime` | `number` | Yes | Current narration playback time in seconds |
| `narrationDuration` | `number` | Yes | Total duration of current narration |
| `isNarrating` | `boolean` | Yes | Whether narration is actively playing |
| `isNarrationLoading` | `boolean` | Yes | Whether narration audio is loading |
| `scenes` | `Record<number, string>` | No | Map of part index to scene image URL |
| `isSceneLoading` | `boolean` | No | Whether a scene is being generated |
| `onGenerateScene` | `() => void` | No | Generate scene for current part |
| `onGenerateSceneIndex` | `(index: number) => void` | No | Generate scene for specific part |
| `onTogglePlayback` | `() => void` | Yes | Play/pause narration |
| `onStopNarration` | `() => void` | Yes | Stop narration completely |
| `onChoice` | `(choice: string) => void` | Yes | Handle story choice selection |
| `onReset` | `() => void` | Yes | Return to setup phase |
| `toggleMute` | `() => void` | Yes | Toggle audio mute |
| `isMuted` | `boolean` | Yes | Current mute state |
| `playbackRate` | `number` | Yes | Current playback speed |
| `setPlaybackRate` | `(rate: number) => void` | Yes | Set playback speed |
| `onSubmitFeedback` | `(rating: number, text: string) => void` | No | Submit story feedback |
| `fontSize` | `'normal' \| 'large'` | Yes | Current font size preference |
| `onChangeFontSize` | `(size: 'normal' \| 'large') => void` | Yes | Change font size |

**State Management:**
- No explicit local state. Derived values:
  - `progressPercent` -- Narration progress as percentage.
  - `storyProgress` -- Story completion percentage (parts read / total parts).
  - `isSleepMode` -- Boolean from `input.mode`.

**Key Behaviors:**
- Header controls: "Menu" button (reset), font size toggle, mute button.
- Story content scrolls vertically with each part rendered as a `<section>`.
- Future parts are dimmed (`opacity-10 grayscale blur-[2px]`) and non-interactive.
- Each part uses `SyncedText` for word-level narration highlighting.
- Choice buttons appear after the current part (not in Sleep mode) as a grid.
- On the final part, renders a footer with: lesson quote, joke, and "MISSION COMPLETE" reset button.
- Bottom control bar includes: journey segment tracker with progress bar, play/pause/stop buttons with circular progress ring, narrator name, and playback speed selector (0.8x, 1.0x, 1.2x).
- Auto-scrolls to current part in Sleep mode via `scrollIntoView`.
- Sleep mode applies indigo color scheme; default uses warm parchment (`bg-[#fcf8ef]`).

**Child Components:** `SyncedText`.

**Hooks Used:** `useRef`, `useEffect`.

---

### SyncedText

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\SyncedText.tsx`

**Purpose:** Renders story text with real-time word-level highlighting synchronized to narration audio playback.

**Props Interface (`SyncedTextProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `text` | `string` | Yes | The story text to render |
| `isActive` | `boolean` | Yes | Whether this text's narration is currently playing |
| `currentTime` | `number` | Yes | Current narration time in seconds |
| `duration` | `number` | Yes | Total narration duration in seconds |

**Key Behaviors:**
- Splits text into sentences (by `.!?` punctuation), then into words.
- Uses character-offset-based heuristic to map each word/sentence to a time range.
- Active sentence receives yellow background highlight.
- Active word turns blue, scales up 1.05x, and gets a subtle glow.
- Non-active sentences are dimmed to 0.7 opacity.
- When not active or duration is 0, renders plain unstyled text.
- Wrapped in `React.memo` for performance (avoids re-renders when props unchanged).

**Child Components:** None (leaf component).

**Animation:** Framer Motion `animate` on each `<span>` for color, scale, textShadow, and opacity transitions with 0.1s duration.

---

## Shared / Utility Components

### LoadingFX

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\LoadingFX.tsx`

**Purpose:** Full-screen or embedded loading animation with mode-specific themes, particle effects, progress bar, and rotating status messages.

**Props Interface (`LoadingFXProps`):**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `embedded` | `boolean` | No | `false` | If true, renders as absolute overlay within parent; if false, as fixed fullscreen |
| `mode` | `AppMode` | No | `'classic'` | Determines visual theme |
| `heroName` | `string` | No | `undefined` | Personalizes the loading title |

**State Management:**
- `particles` -- Array of floating word particles (e.g., "ZAP!", "POW!").
- `stepIndex` -- Current loading step message index.
- `progress` -- Non-linear progress bar value (0-99).
- `backgroundParticles` (memoized) -- Array of cosmic background dots.

**Key Behaviors:**
- Three visual themes: Classic (blue, warp-speed particles), Sleep (indigo, gentle drifting stars), Mad Libs (orange, chaotic jitter).
- Word particles ("ZAP!", "BOOM!", etc.) only appear in non-sleep modes.
- Central icon pulses with scale animation; Mad Libs adds rotation wobble.
- Progress bar with striped background and shimmer overlay.
- Loading step messages cycle every 2 seconds with slide animation.
- Progress increments non-linearly (slows down above 85%) for realism.

**Child Components:** None.

**Hooks Used:** `useState`, `useEffect`, `useMemo`.

---

### ApiKeyDialog

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\ApiKeyDialog.tsx`

**Purpose:** Modal dialog informing users about paid API key requirements.

**Props Interface (`ApiKeyDialogProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onContinue` | `() => void` | Yes | Callback to dismiss dialog |

**Key Behaviors:**
- Comic-book themed modal with floating key badge icon.
- Provides link to Gemini billing documentation.
- "Unlock The Multiverse" button dismisses the dialog.
- Slightly rotated card design (`rotate-1`) with heavy drop shadow.

**Child Components:** None (leaf component).

---

### SettingsModal

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\SettingsModal.tsx`

**Purpose:** Global settings panel with tabbed navigation for General, Voice/Audio, and Accessibility settings.

**Props Interface (`SettingsModalProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls visibility |
| `onClose` | `() => void` | Yes | Close callback |
| `currentPrefs` | `UserPreferences` | Yes | Current user preferences |
| `onSave` | `(prefs: UserPreferences) => void` | Yes | Save preferences callback |
| `onReset` | `() => void` | Yes | Reset to defaults callback |

**State Management:**
- `activeTab: string` -- Current settings tab ('general', 'voice', 'accessibility').
- `prefs: UserPreferences` -- Local copy of preferences for editing before save.
- `showSuccess: boolean` -- Briefly shows save confirmation overlay.

**Key Behaviors:**
- **General tab:** Story length selector (grid of 4 buttons), preferred dreamscape dropdown.
- **Voice tab:** Mute toggle, narrator voice grid (uses shared `VOICES` constant).
- **Accessibility tab:** Font size toggle (Normal/Large), reduced motion toggle switch.
- Syncs local state with `currentPrefs` when modal opens.
- Save shows a green success overlay for 1.2 seconds then auto-closes.
- Reset sets local state to `DEFAULT_PREFERENCES`.
- Three category tabs in a sidebar (horizontal on mobile).

**Child Components:** None (leaf component).

**Hooks Used:** `useState`, `useEffect`.

---

### ErrorBoundary

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\ErrorBoundary.tsx`

**Purpose:** React class component error boundary with comic-themed fallback UI.

**Props Interface:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | No | Child components to wrap |
| `fallback` | `ReactNode` | No | Custom fallback UI (optional) |

**State:** `{ hasError: boolean, error: Error | null }`

**Key Behaviors:**
- Catches rendering errors via `getDerivedStateFromError` and `componentDidCatch`.
- Default fallback shows "POW! SPLAT!" header, error message in monospace, and "Try Again" button.
- "Try Again" resets `hasError` to re-attempt rendering children.
- If custom `fallback` prop provided, renders that instead.

---

### CompletionView

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\components\CompletionView.tsx`

**Purpose:** Story completion screen showing the earned reward badge and vocabulary word. (Currently not rendered in the main App flow -- the completion content is instead shown inline in ReadingView's footer.)

**Props Interface (`CompletionViewProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `story` | `StoryFull` | Yes | Completed story data |
| `onReset` | `() => void` | Yes | Return to setup |

**Key Behaviors:**
- Full-screen overlay with scale-in animation.
- Displays: reward badge emoji + title + description, vocabulary word + definition, "BACK TO BASE" button.

---

### Book (Legacy)

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\Book.tsx`

**Purpose:** Page-flip comic book component. Renders `ComicFace` data as a series of flippable sheets with front/back panels.

**Props Interface (`BookProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `comicFaces` | `ComicFace[]` | Yes | Array of comic page data |
| `currentSheetIndex` | `number` | Yes | Currently visible sheet |
| `isStarted` | `boolean` | Yes | Whether reading has started |
| `isSetupVisible` | `boolean` | Yes | Whether setup overlay is visible |
| `onSheetClick` | `(index: number) => void` | Yes | Sheet click handler |
| `onChoice` | `(pageIndex: number, choice: string) => void` | Yes | Decision choice handler |
| `onOpenBook` | `() => void` | Yes | Open book from cover |
| `onDownload` | `() => void` | Yes | Download comic |
| `onReset` | `() => void` | Yes | Reset to setup |

**Child Components:** `Panel`.

---

### Panel (Legacy)

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\Panel.tsx`

**Purpose:** Individual comic book panel. Renders cover actions, story panels with images, and decision buttons.

**Props Interface (`PanelProps`):**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `face` | `ComicFace` | No | Panel data (renders empty dark div if undefined) |
| `allFaces` | `ComicFace[]` | Yes | All faces (for cover printing status) |
| `onChoice` | `(pageIndex: number, choice: string) => void` | Yes | Decision handler |
| `onOpenBook` | `() => void` | Yes | Open book action |
| `onDownload` | `() => void` | Yes | Download action |
| `onReset` | `() => void` | Yes | Reset action |

---

## Custom Hooks

### useStoryEngine

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\hooks\useStoryEngine.ts`

**Purpose:** Central state management hook that controls the entire story lifecycle: configuration, generation, narration, caching, and navigation.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `validateApiKey` | `() => Promise<boolean>` | Async function to validate API key |
| `setShowApiKeyDialog` | `(show: boolean) => void` | Toggle API key dialog visibility |

**Return Value:**

```ts
{
    // State
    phase: AppPhase;
    isLoading: boolean;
    isAvatarLoading: boolean;
    isSceneLoading: boolean;
    input: StoryState;
    story: StoryFull | null;
    currentPartIndex: number;
    scenes: Record<number, string>;
    isNarrating: boolean;
    isNarrationLoading: boolean;
    isOnline: boolean;
    history: CachedStory[];
    error: string | null;
    userPreferences: UserPreferences;

    // Actions
    handleInputChange: (field: keyof StoryState, value: any) => void;
    handleMadLibChange: (field: keyof MadLibState, value: string) => void;
    handleSleepConfigChange: (field: keyof SleepConfig, value: string) => void;
    generateAvatar: () => Promise<void>;
    generateStory: () => Promise<void>;
    generateCurrentScene: () => void;
    generateScene: (index: number) => Promise<void>;
    handleChoice: (choice: string) => void;
    reset: () => void;
    playNarration: () => Promise<void>;
    stopNarration: () => void;
    loadStoryFromHistory: (cached: CachedStory) => void;
    prepareSequel: (cached: CachedStory) => void;
    deleteStory: (id: string) => Promise<void>;
    submitFeedback: (rating: number, text: string) => Promise<void>;
    saveUserPreferences: (prefs: UserPreferences) => Promise<void>;
    clearError: () => void;
}
```

**Key Behaviors:**
- **Initialization:** Loads user preferences and story history from IndexedDB on mount. Registers online/offline event listeners.
- **Story generation:** Validates connectivity and API key, calls `AIClient.streamStory()`, saves result to IndexedDB, transitions phase to `'reading'`.
- **Avatar generation:** Calls `AIClient.generateAvatar()` with hero name and power derived from current mode.
- **Scene generation:** Calls `AIClient.generateSceneIllustration()` for a specific story part and caches the result.
- **Narration:** Delegates to the `narrationManager` singleton. Supports play/pause/stop. Preloads the next part's audio while current is playing.
- **Sleep mode auto-advance:** After narration ends in sleep mode, automatically advances `currentPartIndex` and triggers playback of the next part with a 500ms delay.
- **Choice handling:** Stops narration, advances to next part, plays page turn sound.
- **Reset:** Stops narration, clears story/scenes, returns to setup phase.
- **Preferences:** Saves to IndexedDB and updates live managers (e.g., `soundManager.setMuted()`).
- **Error handling:** Catches errors from all async operations, displays user-friendly messages, and shows API key dialog on 404 responses.

**Usage Example:**
```tsx
const storyEngine = useStoryEngine(validateApiKey, setShowApiKeyDialog);
// Access: storyEngine.phase, storyEngine.generateStory(), etc.
```

---

### useNarrationSync

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\hooks\useNarrationSync.ts`

**Purpose:** Bridges the imperative `NarrationManager` singleton with React's declarative state by polling audio time via `requestAnimationFrame`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `isNarrating` | `boolean` | Whether narration is currently active |

**Return Value:**

```ts
{
    narrationTime: number;      // Current playback position in seconds
    narrationDuration: number;  // Total duration of current audio in seconds
    playbackRate: number;       // Current playback speed multiplier
    setPlaybackRate: (rate: number) => void; // Updates both React state and NarrationManager
}
```

**Key Behaviors:**
- When `isNarrating` is true, starts a `requestAnimationFrame` loop polling `narrationManager.getCurrentTime()` and `narrationManager.getDuration()`.
- When `isNarrating` becomes false, resets `narrationTime` to 0.
- `setPlaybackRate` updates both the local state and the `narrationManager` singleton.
- Cleans up animation frame on unmount or when `isNarrating` changes.

**Usage Example:**
```tsx
const { narrationTime, narrationDuration, playbackRate, setPlaybackRate } = useNarrationSync(isNarrating);
```

---

### useApiKey

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\useApiKey.ts`

**Purpose:** Manages API key validation dialog state. Currently simplified since the API key is managed server-side via Vercel environment variables.

**Parameters:** None.

**Return Value:**

```ts
{
    showApiKeyDialog: boolean;
    setShowApiKeyDialog: (show: boolean) => void;
    validateApiKey: () => Promise<boolean>;         // Always returns true
    handleApiKeyDialogContinue: () => Promise<void>; // Closes dialog
}
```

**Key Behaviors:**
- `validateApiKey` always returns `true` (server-side key management).
- `handleApiKeyDialogContinue` sets `showApiKeyDialog` to `false`.

---

## Singleton Services

### SoundManager

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\SoundManager.ts`

**Purpose:** Web Audio API-based sound effects and ambient audio generator. Exported as `soundManager` singleton.

**Public Methods:**
- `setMuted(muted: boolean)` -- Mutes/unmutes all audio.
- `playChoice()` -- Short ascending sine tone (440Hz -> 880Hz, 100ms).
- `playPageTurn()` -- Triangle wave sweep (150Hz -> 300Hz, 300ms).
- `playSparkle()` -- Ascending arpeggio of 4 sine tones (C5-E5-G5-C6).
- `playDelete()` -- Descending sawtooth (150Hz -> 50Hz, 200ms).
- `playAmbient(mode: AmbientTheme)` -- Starts looping procedurally-generated ambient soundscapes.
- `stopAmbient()` -- Fades out and stops ambient audio.

**Ambient Themes:**
- **Cosmic Hum (space):** Brown noise + detuned sine drones at A1 with LFO modulation and stereo panning.
- **Gentle Rain (rain):** Pink noise base + white noise patter layer with bandpass filter and LFO modulation.
- **Forest Night (forest):** Pink noise wind base with lowpass + pink noise rustling leaves with highpass. Both LFO-modulated.
- **Midnight Ocean (ocean):** Brown noise deep waves + pink noise spray/foam, synchronized by a master LFO for wave cycles.
- **Summer Night (crickets):** Pink noise base + procedural cricket chirps (4.5kHz sine with square wave AM and rhythm LFO).
- **Ethereal (magic):** White noise through high-Q bandpass filter with LFO frequency modulation.

---

### NarrationManager

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\NarrationManager.ts`

**Purpose:** TTS audio fetching, caching, and playback management. Handles raw PCM audio decoding for Gemini TTS output. Exported as `narrationManager` singleton.

**Public API:**
- `fetchNarration(text, voiceName, autoPlay)` -- Fetches TTS from cache or API, optionally auto-plays.
- `play()` -- Starts or resumes playback.
- `pause()` -- Pauses playback, tracking position.
- `stop()` -- Fully stops and resets.
- `setRate(rate)` / `getRate()` -- Playback speed control.
- `getCurrentTime()` / `getDuration()` -- Time tracking.
- `state` getter -- Returns `{ isPlaying, isPaused, hasBuffer, currentTime, duration }`.
- `onEnded` callback -- Set by `useStoryEngine` for auto-advance in sleep mode.

**Caching Strategy:**
1. In-memory `Map<string, AudioBuffer>` for instant replay within session.
2. IndexedDB persistent cache via `StorageManager` for offline support.
3. API fetch as last resort.

---

### AIClient

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\AIClient.ts`

**Purpose:** Static class wrapping all AI API calls (story generation, avatar generation, scene illustration) with retry logic.

**Static Methods:**
- `streamStory(input: StoryState): Promise<StoryFull>` -- Generates a structured story via `/api/generate-story`.
- `generateAvatar(heroName, heroPower): Promise<string | null>` -- Generates hero portrait via `/api/generate-avatar`.
- `generateSceneIllustration(context, heroDescription): Promise<string | null>` -- Generates scene art via `/api/generate-scene`.

---

### StorageManager

**File:** `C:\Users\kyler\Downloads\infinity-heroes_-bedtime-chronicles\lib\StorageManager.ts`

**Purpose:** IndexedDB persistence layer for stories, audio cache, and user preferences. Exported as `storageManager` singleton.

**IndexedDB Schema (v4):**
- `stories` store -- Keyed by UUID, stores `CachedStory` objects.
- `audio` store -- Key-value for TTS audio buffers.
- `preferences` store -- Key-value for user settings.

**Exported Interface:** `CachedStory` -- `{ id, timestamp, story, avatar?, scenes?, feedback? }`

---

## State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        useStoryEngine                           │
│  (Central state: phase, input, story, scenes, narration, etc.)  │
└──────────┬──────────────────────────────────────┬───────────────┘
           │                                      │
     Props down                             Callbacks up
           │                                      │
    ┌──────▼──────┐                      ┌────────▼────────┐
    │    Setup     │──── onChange ────────►│  handleInput    │
    │  (phase:    │──── onLaunch ────────►│  generateStory  │
    │   setup)    │──── onGenAvatar ─────►│  generateAvatar │
    └─────────────┘                      └─────────────────┘
           │
    ┌──────▼──────┐                      ┌─────────────────┐
    │ ReadingView  │──── onChoice ───────►│  handleChoice   │
    │  (phase:    │──── onTogglePlay ────►│  playNarration  │
    │   reading)  │──── onReset ────────►│  reset          │
    └─────────────┘                      └─────────────────┘

  ┌───────────────────────────────────────────────────┐
  │              Singleton Services                    │
  │  narrationManager ←── useNarrationSync ──► React  │
  │  soundManager     ←── direct calls from UI        │
  │  storageManager   ←── useStoryEngine (IndexedDB)  │
  │  AIClient         ←── useStoryEngine (API calls)  │
  └───────────────────────────────────────────────────┘
```

**Data flow summary:**
1. `useStoryEngine` owns all primary application state and exposes it via return object.
2. `App` destructures the return object and passes props down to `Setup` and `ReadingView`.
3. User interactions trigger callbacks that flow back up to `useStoryEngine` actions.
4. `useNarrationSync` polls the `narrationManager` singleton via `requestAnimationFrame` and provides reactive time values.
5. `SoundManager` is called directly from UI event handlers for immediate feedback sounds.
6. `StorageManager` is accessed by `useStoryEngine` for persistence and by `NarrationManager` for audio caching.

---

## Animation Patterns

The application uses **Framer Motion** extensively for all animations.

### Entry/Exit Animations
- `AnimatePresence` wraps conditional renders (`ApiKeyDialog`, `SettingsModal`, error banners, mode transitions, loading overlays) for smooth mount/unmount transitions.
- Common pattern: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`.

### Layout Animations
- `motion.section layout` on the main Setup card for smooth size transitions when mode changes.
- `layoutId="activeTab"` on the mode dock for smooth tab indicator sliding.
- `layoutId="submode-pill"` on Sleep sub-mode toggle.
- `layoutId="selection-glow"` on Sleep theme selection.
- `layoutId="avatar"` on the reading view avatar for shared element transitions.

### Scroll-Driven
- `useScroll()` + `useTransform()` on `HeroHeader` for parallax (y, opacity, scale over 0-300px).

### Continuous/Looping
- Star twinkle in Sleep mode: `animate={{ opacity: [0.1, 0.8, 0.1] }}` with infinite repeat.
- Loading icon pulse: `animate={{ scale: [0.9, 1.1, 0.9] }}` with infinite repeat.
- Progress bar shimmer: CSS `@keyframes shimmer` with `translateX` sweep.
- Background particles: Mode-specific motion (drift for sleep, upward warp for classic, chaotic jitter for madlibs).

### Viewport-Triggered
- Story parts: `whileInView={{ opacity: 1, y: 0 }}` with `viewport={{ once: true }}` for scroll reveal.

### Micro-Interactions
- `whileHover={{ scale: 1.05 }}` and `whileTap={{ scale: 0.95 }}` on theme selection buttons.
- Button hover effects via Tailwind (`hover:scale-110`, `active:scale-95`).
- `SyncedText` word highlighting: `animate={{ color, scale, textShadow, opacity }}` with 0.1s transitions.

---

## Styling Patterns

### Framework
- **Tailwind CSS** for all styling. No separate CSS files except `index.css` for base styles.
- Extensive use of arbitrary values: `shadow-[12px_12px_0px_rgba(30,58,138,0.3)]`, `bg-[#fcf8ef]`.

### Comic-Book Theme
- **Font:** `font-comic` custom class (likely mapped to a comic-style font family).
- **Borders:** Heavy black borders (`border-[6px] border-black`) on panels, cards, and modals.
- **Shadows:** Comic-style offset box shadows (`shadow-[8px_8px_0px_black]`, `shadow-[12px_12px_0px_black]`).
- **Buttons:** `.comic-btn` class with bold borders and shadows; active state drops shadow.
- **Text Treatment:** All-caps (`uppercase`), wide tracking (`tracking-widest`), drop shadows on headers.
- **Colors:** Bold primaries -- red-600 for action buttons, blue-500 for interactive elements, yellow-400 for highlights.

### Mode-Specific Theming
- **Classic Mode:** White backgrounds, blue accents, black shadows, standard comic-book energy.
- **Mad Libs Mode:** Red/orange backgrounds, chaotic energy, yellow highlights, wacky emojis.
- **Sleep Mode:** Deep indigo/slate-950 backgrounds, soft glow effects (`shadow-[0_0_20px_rgba(...)]`), reduced saturation, blur effects, gentle animations, star fields.

### Responsive Design
- Mobile-first with `md:` breakpoints throughout.
- Font sizes scale: `text-base md:text-xl lg:text-2xl`.
- Padding scales: `p-4 md:p-10`.
- Layout shifts: Single column on mobile, multi-column (`grid-cols-2`, `md:flex-row`) on desktop.
- Memory Jar drawer: Full-width mobile, `md:w-96` on desktop.

### Accessibility
- ARIA roles: `role="main"`, `role="radiogroup"`, `role="radio"`, `role="dialog"`, `role="group"`.
- ARIA attributes: `aria-label`, `aria-pressed`, `aria-checked`, `aria-modal`.
- Focus rings: `outline-none ring-blue-500 focus:ring-2`.
- Reduced motion support: Toggles `scrollBehavior` and is available as a user preference.
- Font size toggle: Normal/Large reading modes.
- Screen reader labels on all icon-only buttons.
