# UI/UX Documentation - Infinity Heroes: Bedtime Chronicles

## Application Overview

A React 19 SPA that generates interactive AI bedtime stories for children using Google Gemini. Three distinct modes offer different storytelling experiences, each with tailored UI/UX.

---

## Information Architecture

```
App
├── Setup Phase (/)
│   ├── HeroHeader (mode switcher + logo)
│   ├── Mode-Specific Setup Form
│   │   ├── ClassicSetup (wizard: name -> setting -> review)
│   │   ├── MadlibsSetup (inline fill-in-the-blank)
│   │   └── SleepSetup (sensory config + dreamscape picker)
│   ├── VoiceSelector (narrator voice grid)
│   ├── LengthSlider (story duration selector)
│   └── Launch Button
├── Reading Phase
│   ├── Story Header (avatar + title)
│   ├── Story Content (synced text with word-level highlighting)
│   ├── Choice Navigation (branching decisions, classic/madlibs only)
│   ├── Completion Footer (lesson, joke, badge, reset)
│   └── Control Hub (play/pause, speed, mute, progress)
├── Overlays
│   ├── MemoryJar Drawer (saved stories, right-slide panel)
│   ├── SettingsModal (preferences: voice, length, accessibility)
│   ├── LoadingFX (cinematic loading overlay per mode)
│   ├── ApiKeyDialog (API key prompt - legacy, now server-side)
│   └── ErrorBoundary (crash recovery)
└── Background Systems
    ├── SoundManager (procedural ambient audio)
    ├── NarrationManager (TTS playback + caching)
    └── StorageManager (IndexedDB persistence)
```

---

## User Flows

### Flow 1: Classic Adventure Story

```
[Land on App] -> [HeroHeader: Classic mode active]
  -> [Wizard Step 1: "Who is our hero today?" - enter name]
  -> [Wizard Step 2: "Where does the adventure begin?" - enter setting]
  -> [Wizard Step 3: Review + optional avatar generation]
  -> [Select narrator voice (7 options)]
  -> [Select story length (short/medium/long/eternal)]
  -> [Click "ENGAGE MISSION"]
  -> [LoadingFX: "INITIATING CORTEX..." with comic word particles]
  -> [Reading View: story text with word-level highlighting]
  -> [Choose from 3 branching choices at end of each part]
  -> [Last part: see lesson, joke, reward badge]
  -> [Click "MISSION COMPLETE" -> return to Setup]
```

### Flow 2: Mad Libs Story

```
[Switch to Mad Libs tab in HeroHeader dock]
  -> [Single-screen form: fill 5 inline fields (adjective, place, food, animal, silly word)]
  -> [Each field has suggestion dropdown on focus]
  -> [Optional: generate avatar from animal name]
  -> [Select voice + length]
  -> [Click "ENGAGE MISSION"]
  -> [LoadingFX: "GENERATING CHAOS..." with chaotic particle effects]
  -> [Reading View: story incorporates all mad lib words]
  -> [Branching choices available]
  -> [Completion with lesson + joke]
```

### Flow 3: Sleep / Bedtime Story

```
[Switch to Sleepy tab in HeroHeader dock]
  -> [Ambient sound begins playing if theme selected]
  -> [Enter hero name]
  -> [Toggle sub-mode: "Dream Pick" (auto) or "Parent's Path" (manual)]
  -> [If Parent's Path: fill sensory inputs (texture, sound, scent)]
  -> [Select dreamscape theme (Cloud Kingdom, Starry Space, etc.)]
  -> [Select ambient sound (rain, forest, ocean, crickets, space, magic)]
  -> [Select voice + length]
  -> [Click "BEGIN DREAM-LOG"]
  -> [LoadingFX: "WEAVING DREAMS..." with gentle star drift]
  -> [Reading View: dark indigo theme, no choices, auto-scroll]
  -> [Narration auto-advances between parts with 500ms gap]
  -> [Completion with softer lesson]
```

### Flow 4: Memory Jar (Saved Stories)

```
[Click jar icon (top-right)]
  -> [Right drawer slides in over backdrop]
  -> [List of saved stories with avatar, title, date, part count]
  -> [Each story card has: Open, Download JSON, Share, Delete]
  -> [Click story -> loads into Reading View]
  -> [Works offline (IndexedDB)]
```

### Flow 5: Settings

```
[Click gear icon (top-right)]
  -> [Modal with 3 tabs: General, Voice & Audio, Accessibility]
  -> [General: default story length, preferred dreamscape]
  -> [Voice & Audio: mute toggle, default narrator]
  -> [Accessibility: font size (normal/large), reduced motion toggle]
  -> [Save -> flash green confirmation -> modal closes]
  -> [Reset Defaults available]
```

---

## Component Inventory

### Core Layout

| Component | File | Purpose |
|-----------|------|---------|
| `App` | `App.tsx` | Root orchestrator. Phase router (setup/reading). Manages modals. |
| `Setup` | `Setup.tsx` | Setup phase container. Utility bar, hero header, form panel, launch button. |
| `ReadingView` | `components/ReadingView.tsx` | Reading phase. Story display, controls, progress tracking. |
| `CompletionView` | `components/CompletionView.tsx` | Post-story reward screen (badge, vocab word, reset). Currently inlined in ReadingView footer. |

### Setup Components

| Component | File | Purpose |
|-----------|------|---------|
| `HeroHeader` | `HeroHeader.tsx` | Title block with parallax, mode dock (Classic/MadLibs/Sleepy tabs), star field (sleep mode). |
| `ModeSetup` | `components/setup/ModeSetup.tsx` | Router that renders the correct setup form based on `AppMode`. |
| `ClassicSetup` | `components/setup/ClassicSetup.tsx` | 3-step wizard (name -> setting -> review). |
| `MadlibsSetup` | `components/setup/MadlibsSetup.tsx` | Inline sentence with fill-in-the-blank fields. |
| `SleepSetup` | `components/setup/SleepSetup.tsx` | Sensory config (texture/sound/scent), dreamscape grid, ambient sound picker. |
| `VoiceSelector` | `components/setup/VoiceSelector.tsx` | Grid of 7 narrator voices with emoji icons. |
| `MemoryJar` | `components/setup/MemoryJar.tsx` | Right-slide drawer for saved story history. |

### Shared UI Primitives

| Component | File | Purpose |
|-----------|------|---------|
| `GeminiWizardStep` | `components/setup/SetupShared.tsx` | Chat-bubble wizard step with back/next navigation. |
| `HeroAvatarDisplay` | `components/setup/SetupShared.tsx` | Circular avatar with loading spinner, generate/repaint button, decorative badge. |
| `MadLibField` | `components/setup/SetupShared.tsx` | Inline input with validation styling and suggestion dropdown. |
| `LengthSlider` | `components/setup/SetupShared.tsx` | Visual track with 4 duration steps (short/medium/long/eternal). |
| `SensoryInputCard` | `components/setup/SetupShared.tsx` | Icon + label + description + input + suggestion chips. Used in sleep mode. |
| `DefaultAvatar` | `components/setup/SetupShared.tsx` | Placeholder shown when no avatar is generated. |

### Reading Components

| Component | File | Purpose |
|-----------|------|---------|
| `SyncedText` | `components/SyncedText.tsx` | Word-level text highlighting synced to narration audio time. |

### System Components

| Component | File | Purpose |
|-----------|------|---------|
| `LoadingFX` | `LoadingFX.tsx` | Full-screen or embedded loading overlay with mode-specific theming, particle effects, and progress bar. |
| `SettingsModal` | `components/SettingsModal.tsx` | 3-tab settings dialog (General, Voice, Accessibility). |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` | React error boundary with comic-themed crash screen. |
| `ApiKeyDialog` | `ApiKeyDialog.tsx` | Legacy API key prompt (now bypassed since keys are server-side). |

---

## Design System

### Visual Language

- **Style**: Comic book / graphic novel aesthetic
- **Font stack**: `font-comic` (custom comic font), `font-serif` (story text), `font-mono` (metadata/timestamps)
- **Color modes**:
  - Classic: Blue/slate palette, white backgrounds, bold black borders
  - Mad Libs: Red/orange/yellow palette, chaotic energy
  - Sleep: Deep indigo/purple palette, subtle glows, minimal contrast

### Animation Patterns

| Pattern | Technology | Usage |
|---------|-----------|-------|
| Shared element transitions | `framer-motion layoutId` | Avatar between Setup -> Reading |
| Tab indicator | `framer-motion layoutId="activeTab"` | Mode dock sliding pill |
| Page entry | `whileInView` with stagger | Story parts revealing on scroll |
| Loading particles | `setInterval` + `framer-motion` | Comic words floating up during load |
| Parallax | `useScroll` + `useTransform` | Header logo scroll compression |
| Star field | `useMemo` + CSS keyframes | 60 twinkling stars in sleep mode |
| Suggestion dropdown | `AnimatePresence` | Mad lib field focus/blur |

### Sound Design

| Sound | Trigger | Implementation |
|-------|---------|---------------|
| `playChoice()` | Any button click | Short UI feedback tone |
| `playSparkle()` | Avatar generated, suggestion selected | Sparkle effect |
| `playPageTurn()` | Story loads, history opened | Page turn sound |
| `playDelete()` | Story deleted, settings reset | Delete confirmation |
| `playAmbient(theme)` | Sleep mode theme selected | Procedural noise (brown/pink noise, LFO filters) |
| `stopAmbient()` | Leave sleep mode, cleanup | Fade out ambient |

### Accessibility Features

| Feature | Implementation |
|---------|---------------|
| Semantic HTML | `role="main"`, `role="radiogroup"`, `role="dialog"`, `aria-modal` |
| ARIA labels | All buttons have `aria-label`, voice selector has `aria-checked` |
| Focus indicators | `focus:ring-2 ring-blue-500` on interactive elements |
| Reduced motion | Global toggle in settings, applies `scrollBehavior: auto` |
| Font size control | Normal/Large toggle in settings + reading view header |
| Keyboard navigation | Standard tab order, radio groups for voices |
| Offline indicator | Banner at top when `navigator.onLine` is false |
| Error recovery | ErrorBoundary with retry button, dismissible error banners |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| Mobile (<768px) | Single column, smaller text, compressed controls, full-width memory jar drawer |
| Tablet (768px-1024px) | 2-column sleep setup, wider reading margin |
| Desktop (1024px+) | Max-width containers, generous padding, side-by-side layouts |

### Key Responsive Adaptations

- **HeroHeader**: `text-6xl` -> `text-9xl` title scaling
- **Setup form panel**: `p-4` -> `p-10` padding
- **Reading controls**: Wrap to 2 rows on mobile, single row on desktop
- **Memory Jar**: Full-width overlay on mobile, 384px sidebar on desktop
- **Loading FX**: Scaled down when `embedded`, full-screen otherwise
- **Wizard step buttons**: `w-12 h-12` -> `w-14 h-14`

---

## State Management

### Global State (useStoryEngine hook)

| State | Type | Description |
|-------|------|-------------|
| `phase` | `'setup' \| 'reading'` | Current app phase |
| `input` | `StoryState` | All form inputs (hero, setting, mode, madlibs, sleep config, voice, length) |
| `story` | `StoryFull \| null` | Generated story data |
| `currentPartIndex` | `number` | Active story part |
| `scenes` | `Record<number, string>` | Generated scene images by part index |
| `isLoading` | `boolean` | Story generation in progress |
| `isAvatarLoading` | `boolean` | Avatar generation in progress |
| `isSceneLoading` | `boolean` | Scene generation in progress |
| `isNarrating` | `boolean` | TTS playback active |
| `isNarrationLoading` | `boolean` | TTS audio fetching |
| `isOnline` | `boolean` | Network connectivity |
| `history` | `CachedStory[]` | Saved stories from IndexedDB |
| `error` | `string \| null` | Current error message |
| `userPreferences` | `UserPreferences` | Persisted user settings |

### Singletons

| Manager | Scope | Persistence |
|---------|-------|-------------|
| `soundManager` | Audio context, ambient loops | Session only |
| `narrationManager` | TTS buffer cache, playback state | In-memory + IndexedDB audio cache |
| `storageManager` | IndexedDB connection | IndexedDB (stories, audio, preferences) |

---

## Data Persistence (IndexedDB)

| Store | Key | Value | Purpose |
|-------|-----|-------|---------|
| `stories` | `id` (UUID) | `CachedStory` | Story content, avatar, scenes, feedback, timestamp |
| `audio` | `v1:{voice}:{text_snippet}_{length}` | `ArrayBuffer` | Raw PCM audio buffers for offline TTS |
| `preferences` | `"user_settings"` | `UserPreferences` | Voice, length, theme, font, mute, reduced motion |

Database version: **4** (bumped for preferences store).
