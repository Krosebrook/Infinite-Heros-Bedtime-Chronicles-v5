# Infinity Heroes: Bedtime Chronicles -- Design System

> Comprehensive UI/UX documentation covering every visual token, pattern, and convention used across the application.

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing & Layout](#3-spacing--layout)
4. [Custom CSS Classes](#4-custom-css-classes)
5. [Shadows & Borders](#5-shadows--borders)
6. [Gradients](#6-gradients)
7. [Icons & Imagery](#7-icons--imagery)
8. [Responsive Design](#8-responsive-design)
9. [Dark Theme](#9-dark-theme)
10. [Motion Design Tokens](#10-motion-design-tokens)

---

## 1. Color Palette

The application uses three distinct color schemes tied to the `AppMode` type: **Classic** (blue), **Sleep** (indigo/purple), and **Mad Libs** (amber/orange/red). A shared dark foundation (`slate-950` / `#0f172a`) unifies all modes.

### 1.1 Global Foundation Colors

| Role              | Tailwind Class      | Hex / Value                | Usage                                          |
|-------------------|---------------------|----------------------------|-------------------------------------------------|
| Body Background   | `bg-slate-950`      | Tailwind `slate-950`       | `<body>` background, app root                   |
| Body Background (CSS) | --              | `#0f172a`                  | Set in `index.css` on `body`                     |
| Page Surface      | `bg-slate-950`      | Tailwind `slate-950`       | `App.tsx` root div, Setup main                   |
| Selection         | `selection:bg-yellow-200` | Tailwind `yellow-200` | Text selection highlight across the app          |
| Theme Meta Color  | --                  | `#2563eb` (blue-600)       | `<meta name="theme-color">` in HTML head         |

### 1.2 Classic Mode (Blue)

| Role               | Tailwind Class(es)                  | Context                                      |
|--------------------|-------------------------------------|----------------------------------------------|
| Primary Accent     | `bg-blue-600`, `text-blue-600`      | Mode tab active color, headings              |
| Hero Title         | `text-blue-400`                     | "HEROES" title text in header                |
| Input Accent       | `border-blue-500`                   | Classic setup input underline                |
| Card Background    | `bg-white`                          | Setup form card, reading footer              |
| Card Text          | `text-black`                        | Default text on white backgrounds            |
| CTA Button         | `bg-red-600 text-white`             | "ENGAGE MISSION" launch button               |
| Choice Buttons     | `bg-blue-500 text-white`            | In-story decision buttons                    |
| Decision Alt       | `bg-yellow-400`                     | Panel first-choice button (Panel.tsx)        |
| Wizard Bubble      | `bg-gradient-to-br from-blue-400 to-purple-500` | GeminiWizardStep avatar icon      |
| Progress Bar       | `bg-blue-500`                       | Story journey progress bar                   |
| Active Word Sync   | `#2563eb` (blue-600)                | SyncedText active word color                 |
| Active Sentence    | `#1e3a8a` (blue-900)                | SyncedText active sentence text              |
| Header Gradient    | `from-blue-900 via-slate-900 to-black` | HeroHeader background                     |

### 1.3 Sleep Mode (Indigo/Purple)

| Role               | Tailwind Class(es)                       | Context                                   |
|--------------------|------------------------------------------|-------------------------------------------|
| Primary Accent     | `bg-indigo-600`, `text-indigo-400`       | Mode tab, hero title "HEROES"             |
| Surface            | `bg-indigo-950`                          | Setup card, reading content area          |
| Text Primary       | `text-indigo-50`, `text-indigo-100/90`   | Card text, reading body text              |
| Text Secondary     | `text-indigo-300`, `text-indigo-400`     | Labels, descriptions, secondary info      |
| Text Muted         | `text-indigo-300/60`, `text-indigo-500`  | Italicized descriptions, voice ID label   |
| Border             | `border-indigo-400/50`, `border-indigo-500/20` | Avatar, card borders                |
| Input Background   | `bg-indigo-900/40`                       | SensoryInputCard input field              |
| Input Border       | `border-indigo-800/60`                   | SensoryInputCard default border           |
| Input Focus        | `border-indigo-400/80`                   | SensoryInputCard focused state            |
| Suggestion Pill Active | `bg-indigo-500 border-indigo-400 text-white` | Selected suggestion tag            |
| Suggestion Pill    | `bg-indigo-950/40 border-indigo-700/30`  | Unselected suggestion tag                 |
| CTA Button         | `bg-indigo-600 text-white`               | "BEGIN DREAM-LOG" launch button           |
| CTA Glow           | `shadow-[0_10px_40px_rgba(99,102,241,0.5)]` | Launch button glow effect             |
| Footer Bar         | `bg-indigo-900 text-white`               | ReadingView playback controls             |
| Avatar Glow        | `shadow-[0_0_20px_rgba(99,102,241,0.3)]` | Hero avatar border glow                  |
| Stars              | `bg-white rounded-full shadow-[0_0_2px_#fff]` | Twinkling star field in header      |
| Header Gradient    | `from-[#020617] via-[#0f172a] to-black`  | HeroHeader sleep mode background          |
| Sub-mode Active    | `bg-indigo-50 text-indigo-950`           | Active sub-mode toggle pill               |

### 1.4 Mad Libs Mode (Amber/Orange/Red)

| Role               | Tailwind Class(es)                           | Context                                |
|--------------------|----------------------------------------------|----------------------------------------|
| Primary Accent     | `bg-red-500`                                 | Mode tab active color                  |
| Hero Title         | `text-yellow-400`                            | "HEROES" title text in header          |
| MadLib Input       | `text-blue-900`, `border-blue-500`           | MadLib inline field text/border        |
| MadLib Bg Focus    | `bg-blue-50`                                 | MadLib focused field background        |
| MadLib Bg Invalid  | `bg-red-50/50`, `border-red-400`             | MadLib empty field validation          |
| Suggestion Header  | `bg-yellow-300`                              | Dropdown "Ideas for..." header         |
| Header Gradient    | `from-red-900 via-orange-950 to-black`       | HeroHeader madlibs mode background     |
| Loading Particles  | `#FCD34D`, `#EF4444`, `#60A5FA`, `#A78BFA`, `#34D399` | Colorful particle system      |

### 1.5 Shared UI Colors

| Role                 | Tailwind Class(es)                        | Context                                  |
|----------------------|-------------------------------------------|------------------------------------------|
| Error Banner         | `bg-red-500 text-white`                   | Error notification banner                |
| Error Title          | `text-red-600`                            | ApiKeyDialog headline                    |
| Error Border         | `border-red-500`                          | ErrorBoundary fallback                   |
| Offline Banner       | `bg-amber-500 text-black`                | Connection status banner                 |
| Success Overlay      | `bg-green-500 text-white`                | SettingsModal save confirmation          |
| Green CTA            | `bg-green-500 text-white`                | "CREATE NEW ISSUE", save button          |
| Yellow Accent        | `bg-yellow-400`                          | ApiKeyDialog badge, active story length  |
| Yellow Lesson Bg     | `bg-yellow-100/50`, `border-yellow-200`  | Joke section in completion footer        |
| Vocab Box            | `bg-yellow-50`, `border-black border-dashed` | CompletionView vocabulary section    |
| Orange Accent        | `text-orange-600`                        | Vocab word label                         |
| Disabled State       | `bg-slate-200 text-slate-400`            | Disabled launch button                   |
| Muted Label          | `text-slate-400`, `text-slate-500`       | Section labels, metadata text            |
| Reading Surface (Classic) | `bg-[#fcf8ef]`                      | Story reading area (warm parchment)      |
| Reading Text         | `text-gray-800`                          | Story paragraph body text                |
| Separator            | `bg-red-600`                             | Title divider bar (ReadingView header)   |

---

## 2. Typography

Three font families are loaded via Google Fonts in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
```

### 2.1 Bangers (Display / Headers)

- **CSS class**: `.font-comic` (declared in `index.css`)
- **Font stack**: `'Bangers', cursive`
- **Letter spacing**: `1px` (via `.font-comic`)
- **Weight**: 400 (single weight font)

| Usage                          | Size Classes                              | File / Component                |
|--------------------------------|-------------------------------------------|---------------------------------|
| App title "INFINITY"           | `text-6xl md:text-8xl lg:text-9xl`        | HeroHeader.tsx                  |
| App title "HEROES"             | `text-6xl md:text-8xl lg:text-9xl`        | HeroHeader.tsx                  |
| Loading screen title           | `text-2xl md:text-4xl` (embedded) / `text-5xl md:text-7xl` (full) | LoadingFX.tsx |
| ApiKeyDialog headline          | `text-5xl`                                | ApiKeyDialog.tsx                |
| Story title (reading)          | `text-3xl md:text-5xl lg:text-6xl`        | ReadingView.tsx                 |
| Completion badge title         | `text-4xl`                                | CompletionView.tsx              |
| Launch button text             | `text-2xl md:text-4xl`                    | Setup.tsx                       |
| Section headings               | `text-xl md:text-3xl`                     | ReadingView.tsx footer          |
| Mode tab labels                | `text-[10px]`                             | HeroHeader.tsx                  |
| Tiny labels                    | `text-[10px] md:text-xs`                  | VoiceSelector, LengthSlider     |
| Memory Jar title               | `text-2xl`                                | MemoryJar.tsx                   |
| Settings heading               | `text-2xl md:text-3xl`                    | SettingsModal.tsx               |
| Error boundary heading         | `text-4xl`                                | ErrorBoundary.tsx               |
| Floating word particles        | `text-4xl md:text-6xl`                    | LoadingFX.tsx                   |

**Text transforms commonly applied**: `uppercase`, `tracking-wider`, `tracking-widest`, `tracking-[0.2em]`, `tracking-[0.3em]`, `tracking-[0.4em]`, `tracking-tight`, `tracking-tighter`.

### 2.2 Comic Neue (Body / UI)

- **CSS**: Set as the default body font in `index.css`: `font-family: 'Comic Neue', cursive;`
- **Weights loaded**: 400 (regular), 700 (bold)

| Usage                          | Size Classes                              | Context                         |
|--------------------------------|-------------------------------------------|---------------------------------|
| General body text              | Inherited base size                       | Default for all UI elements     |
| ApiKeyDialog body              | `text-xl`                                 | ApiKeyDialog.tsx                |
| Wizard prompt bubble           | `text-lg md:text-2xl`                     | GeminiWizardStep                |
| Classic input fields           | `text-3xl md:text-5xl`                    | ClassicSetup.tsx                |
| MadLib inline inputs           | `text-xl`                                 | MadLibField                     |
| Header menu button             | `text-[10px] md:text-xs`                  | ReadingView.tsx                 |
| Joke text                      | `text-lg md:text-xl`                      | ReadingView.tsx footer          |

### 2.3 Lora (Story / Serif)

- **CSS usage**: Applied via Tailwind `font-serif` (Lora is the loaded serif font)
- **Weights loaded**: 400-700 (regular and italic)

| Usage                          | Size Classes                              | Context                         |
|--------------------------------|-------------------------------------------|---------------------------------|
| Story prose text               | `text-base md:text-xl lg:text-2xl` (normal) / `text-xl md:text-3xl lg:text-4xl` (large) | ReadingView.tsx |
| Loading step messages          | `text-base md:text-xl` (embedded) / `text-xl md:text-3xl` (full) | LoadingFX.tsx   |
| SyncedText paragraphs          | `leading-relaxed font-serif`              | SyncedText.tsx                  |
| Sleep hero name input          | `text-4xl md:text-6xl font-serif`         | SleepSetup.tsx                  |
| Sensory input fields           | `text-lg font-serif`                      | SensoryInputCard                |
| MadLibs fill-in sentence       | `text-lg md:text-2xl font-serif`          | MadlibsSetup.tsx                |
| Completion description         | `text-lg font-serif`                      | CompletionView.tsx              |
| Settings dreamscape select     | `text-lg font-serif`                      | SettingsModal.tsx               |
| Sleep theme description        | `text-xs md:text-sm font-serif italic`    | SleepSetup.tsx                  |

### 2.4 Monospace

- **Font**: Tailwind `font-mono` (system monospace)

| Usage                      | Size                       | Context                          |
|----------------------------|----------------------------|----------------------------------|
| Error code text            | `text-xs`, `text-sm`       | ApiKeyDialog, ErrorBoundary      |
| Progress percentage        | `text-[10px] md:text-sm`   | LoadingFX.tsx                    |
| Voice ID label             | `text-[8px] md:text-[9px]` | VoiceSelector.tsx                |
| Timestamp                  | `text-[10px]`              | MemoryJar.tsx                    |

### 2.5 Line Heights

- **`leading-none`**: Used on large display headings (HeroHeader titles, story title)
- **`leading-relaxed`**: Story prose paragraphs, SyncedText, sensory descriptions
- **`leading-snug`**: Wizard prompt bubble text
- **`leading-tight`**: Memory Jar story titles, sensory card descriptions

---

## 3. Spacing & Layout

### 3.1 Page-Level Layout

The app uses a full-viewport flex column layout:

```
App.tsx:         min-h-screen flex flex-col items-center justify-center
Setup.tsx:       min-h-screen w-full flex flex-col items-center py-6 md:py-10 px-4 md:px-8
ReadingView.tsx: w-full h-[100dvh] flex flex-col
```

### 3.2 Content Width Constraints

| Constraint      | Class              | Usage                                       |
|-----------------|--------------------|---------------------------------------------|
| Main card       | `max-w-4xl w-full` | Setup form card container                   |
| Reading prose   | `max-w-prose`      | Story article text (approximately 65ch)     |
| Mode dock       | `max-w-lg`         | Floating mode tab bar in header             |
| Loading content | `max-w-2xl`        | LoadingFX central content                   |
| Progress bar    | `max-w-lg`         | LoadingFX progress bar                      |
| Settings modal  | `max-w-2xl`        | SettingsModal container                     |
| Completion card | `max-w-md`         | CompletionView card                         |
| ApiKey dialog   | `max-w-lg`         | API key prompt card                         |
| Memory Jar      | `w-full md:w-96`   | Slide-out drawer                            |
| Wizard children | `max-w-lg`         | Classic setup wizard step contents          |
| Sleep name      | `max-w-md`         | Sleep hero name input wrapper               |
| Length slider   | `max-w-xl`         | Story duration selector                     |

### 3.3 Padding Conventions

| Pattern                                | Usage                                          |
|----------------------------------------|------------------------------------------------|
| `p-4 md:p-10`                          | Setup main card inner padding                  |
| `px-4 md:px-12 lg:px-24`              | ReadingView content horizontal padding         |
| `py-16 md:py-24`                       | ReadingView content vertical padding           |
| `p-3 md:p-4`                          | ReadingView header controls                    |
| `p-3 md:p-6`                          | ReadingView playback control bar               |
| `p-6 md:p-10`                         | Story lesson section                           |
| `p-6 md:p-8`                          | Settings content area, joke section            |
| `p-4 md:p-6`                          | Settings header, wizard chat bubble            |
| `p-8`                                 | CompletionView card, ApiKeyDialog              |
| `p-5`                                 | SensoryInputCard                               |
| `p-2`                                 | Mode dock container, settings sidebar          |

### 3.4 Gap / Spacing Patterns

| Pattern                      | Usage                                           |
|------------------------------|------------------------------------------------|
| `gap-2 md:gap-4`            | Mode dock buttons, header control buttons       |
| `gap-4 md:gap-8`            | Playback controls                              |
| `gap-3 md:gap-4`            | Header right-side controls                      |
| `space-y-12 md:space-y-16`  | Story article sections                          |
| `space-y-6 md:space-y-10`   | SleepSetup main content                        |
| `space-y-4`                 | MemoryJar story list                            |
| `space-y-8`                 | Settings category content                       |

### 3.5 Grid Patterns

| Grid                                    | Usage                                       |
|----------------------------------------|----------------------------------------------|
| `grid grid-cols-1 md:grid-cols-2`      | Story choice buttons, sleep setup layout     |
| `grid grid-cols-2 gap-4`              | Settings story length options                |
| `grid grid-cols-2 md:grid-cols-3 gap-3`| Settings narrator voice grid                |
| `grid grid-cols-2 gap-3 sm:gap-4`     | Sleep dreamscape theme cards                 |

### 3.6 Key Vertical Rhythm

- **Header to content**: `mb-20` (HeroHeader bottom margin, space for floating dock)
- **Story sections**: `space-y-12 md:space-y-16` between story parts
- **Title to content**: `mb-8` (ReadingView avatar to title), `mb-12` (title header section)
- **Form sections**: `mt-6 md:mt-10` (VoiceSelector), `mt-10 md:mt-12` (launch button)
- **Footer padding**: `pb-48` (ReadingView article for bottom overscroll)

---

## 4. Custom CSS Classes

### 4.1 `.font-comic`

Defined in `index.css`. Applies the Bangers display typeface.

```css
.font-comic {
  font-family: 'Bangers', cursive;
  letter-spacing: 1px;
}
```

**Visual effect**: Bold, comic-book style lettering with slight letter spacing. Used for all headings, button labels, and UI chrome.

### 4.2 `.comic-btn`

The signature comic-book button style. Applied to all primary action buttons throughout the application.

```css
.comic-btn {
  font-family: 'Bangers', cursive;
  border: 4px solid black;
  box-shadow: 6px 6px 0px black;
  transition: all 0.1s ease;
  cursor: pointer;
  text-transform: uppercase;
}

.comic-btn:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0px black;
}

.comic-btn:active:not(:disabled) {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0px black;
}
```

**Visual effect**: Flat-design comic button with a solid black drop shadow that grows on hover (popping forward) and shrinks on press (pushing into the page). The Bangers font and uppercase transform reinforce the comic-book aesthetic.

**Used in**: Setup launch button, reading choice buttons, completion "BACK TO BASE" button, Panel decision buttons, ApiKeyDialog submit, ErrorBoundary retry, Settings save, wizard navigation buttons, MemoryJar is not using this class but utilizes similar patterns.

### 4.3 `.font-story`

**Note**: While referenced conceptually, `font-story` is not explicitly defined as a CSS class. Story text uses Tailwind's `font-serif` utility which maps to the loaded Lora font family.

### 4.4 `.animate-float`

A gentle vertical floating animation.

```css
@keyframes float {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**Visual effect**: Elements drift up 10px and back down in a smooth 3-second cycle. Creates a weightless, hovering sensation.

**Not directly applied in component code** but available as a utility class.

### 4.5 `.animate-breathe`

A slow, calm breathing animation used for sleep mode elements.

```css
@keyframes breathe {
  0%   { transform: scale(1); filter: brightness(100%); }
  50%  { transform: scale(1.05); filter: brightness(110%); }
  100% { transform: scale(1); filter: brightness(100%); }
}

.animate-breathe {
  animation: breathe 6s ease-in-out infinite;
}
```

**Visual effect**: A subtle 5% scale-up combined with a 10% brightness increase, cycling over 6 seconds. Mimics natural breathing rhythm. Designed for sleep/relaxation contexts.

### 4.6 `.custom-scrollbar`

Custom styled WebKit scrollbar.

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 12px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: content-box;
}
```

**Visual effect**: A thin, rounded, semi-transparent scrollbar thumb with no visible track. The `background-clip: content-box` with transparent border creates padding around the thumb for a modern, minimal look.

**Used in**: ReadingView content scroller, MemoryJar story list.

### 4.7 Inline `@keyframes shimmer`

Defined inline within `LoadingFX.tsx` via a `<style>` tag:

```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Visual effect**: A bright highlight sweeps horizontally across the progress bar fill, creating a polished loading indicator. Applied with `animate-[shimmer_1.5s_infinite]`.

---

## 5. Shadows & Borders

### 5.1 The Comic Book Shadow System

The app uses a consistent layered shadow system inspired by comic book art, built with Tailwind arbitrary shadow values:

| Shadow                                        | Usage                                              |
|-----------------------------------------------|---------------------------------------------------|
| `shadow-[6px_6px_0px_black]`                  | `.comic-btn` default state                        |
| `shadow-[8px_8px_0px_black]`                  | `.comic-btn` hover state                          |
| `shadow-[2px_2px_0px_black]`                  | `.comic-btn` active/pressed state                 |
| `shadow-[4px_4px_0px_black]`                  | Small buttons (utility, settings), Memory Jar icon|
| `shadow-[10px_10px_0px_black]`                | Large CTA buttons (launch, mission complete)      |
| `shadow-[12px_12px_0px_rgba(30,58,138,0.3)]`  | Setup form card (blue-tinted shadow)              |
| `shadow-[16px_16px_0px_rgba(0,0,0,1)]`        | ApiKeyDialog (maximum depth)                      |
| `shadow-[16px_16px_0px_rgba(0,0,0,0.5)]`      | SettingsModal                                     |
| `shadow-[8px_8px_0px_rgba(0,0,0,0.5)]`        | ErrorBoundary fallback                            |
| `shadow-[8px_8px_0px_rgba(0,0,0,0.1)]`        | GeminiWizardStep chat bubble                      |
| `shadow-[8px_8px_0px_rgba(0,0,0,0.2)]`        | Avatar display                                    |
| `shadow-[0_-10px_30px_rgba(0,0,0,0.3)]`       | ReadingView bottom control bar (upward shadow)    |
| `shadow-[-10px_0_40px_rgba(0,0,0,0.5)]`       | MemoryJar drawer (leftward shadow)                |
| `shadow-[0_10px_40px_rgba(99,102,241,0.5)]`   | Sleep mode launch button glow                     |
| `shadow-[0_0_20px_rgba(99,102,241,0.3)]`       | Sleep mode avatar glow                            |
| `shadow-[0_0_25px_rgba(99,102,241,0.4)]`       | Selected sleep theme card glow                    |
| `shadow-[0_10px_20px_rgba(0,0,0,0.3)]`         | Active sub-mode pill (SleepSetup)                 |
| `shadow-[0_10px_30px_rgba(99,102,241,0.4)]`   | Active ambient theme button glow                  |
| `shadow-[0_0_15px_rgba(99,102,241,0.3)]`       | Sensory input field focus glow                    |
| `shadow-[0_0_15px_rgba(99,102,241,0.5)]`       | Active suggestion pill glow                       |

### 5.2 Border Patterns

| Border Pattern                        | Usage                                          |
|---------------------------------------|-------------------------------------------------|
| `border-4 border-black`              | Standard comic panel border (buttons, cards)    |
| `border-[6px] border-black`          | Heavy-weight card borders (setup card, completion, reading avatar, MemoryJar drawer) |
| `border-2 border-black`              | Medium-weight borders (settings sidebar)        |
| `border-2 border-black border-dashed`| Dashed mission briefing box, vocab box          |
| `border-4 border-dashed border-slate-300` | Classic setup review panel                 |
| `border-b-4 border-black`            | Section dividers (settings header, footer, MemoryJar header) |
| `border-b-[6px] border-black`        | ReadingView playback control bar top border     |
| `border-t-4 border-dashed border-black/10` | Story completion footer divider            |
| `border-b-4 border-black/20`         | HeroHeader bottom border                       |
| `border-l-[6px] border-black`        | MemoryJar drawer left border                    |
| `border-l-4 border-indigo-600`       | Sleep mode section label accent bar             |
| `border border-white/10`             | Mode dock container subtle ring                 |
| `border-[3px]`                        | Sleep theme cards                               |
| `border-b-4 border-dashed`           | MadLib input underline                          |

### 5.3 Border Radius Conventions

| Radius                                 | Usage                                        |
|----------------------------------------|----------------------------------------------|
| `rounded-sm`                           | Setup form card (minimal rounding)           |
| `rounded-xl`                           | Small cards, settings tabs, error banner     |
| `rounded-2xl`                          | Choice buttons, length slider steps, ambient buttons, MemoryJar cards |
| `rounded-3xl`                          | Voice selector buttons, sensory cards, lesson/joke sections, theme cards, settings content sections |
| `rounded-[2.5rem]`                     | Active description display, reading avatar (md) |
| `rounded-[4rem]`                       | Sleep child-friendly preview panel           |
| `rounded-b-[2.5rem] md:rounded-b-[4rem]` | HeroHeader bottom corners                |
| `rounded-full`                         | Avatar displays, circular buttons, progress bars, pills, mode dock, sub-mode toggle |
| `rounded-3xl rounded-tl-none`          | Chat bubble (GeminiWizardStep)               |

### 5.4 Drop Shadows (CSS filter)

| Drop Shadow                                      | Usage                                   |
|---------------------------------------------------|-----------------------------------------|
| `drop-shadow-[0_4px_0_rgba(0,0,0,0.6)]`          | HeroHeader title text shadow            |
| `drop-shadow-[4px_4px_0px_#000]`                  | Loading screen title text               |
| `drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`        | Floating word particles                 |
| `drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]`   | Loading icon emoji glow                 |
| `drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]`   | Sleep theme preview large icon          |
| `drop-shadow-sm`                                  | Story title, selected length label      |
| `drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]`        | Selected sleep theme icon               |

---

## 6. Gradients

### 6.1 Background Gradients

| Gradient                                                      | Usage                                  |
|--------------------------------------------------------------|----------------------------------------|
| `bg-gradient-to-b from-blue-900 via-slate-900 to-black`     | HeroHeader (Classic mode)              |
| `bg-gradient-to-b from-[#020617] via-[#0f172a] to-black`    | HeroHeader (Sleep mode)               |
| `bg-gradient-to-b from-red-900 via-orange-950 to-black`     | HeroHeader (Mad Libs mode)            |
| `bg-gradient-to-br from-blue-400 to-purple-500`             | Wizard step avatar circle              |
| `bg-gradient-to-t from-black/90 via-black/50 to-transparent`| Panel decision overlay                 |
| `bg-gradient-to-r from-transparent via-indigo-500 to-transparent` | Sleep input underline focus animation |
| `bg-gradient-to-br from-blue-600/40 to-blue-900/60`         | Cloud Kingdom theme glow              |
| `bg-gradient-to-br from-indigo-600/40 to-indigo-900/60`     | Starry Space theme glow               |
| `bg-gradient-to-br from-green-600/40 to-green-900/60`       | Magic Forest theme glow               |
| `bg-gradient-to-br from-cyan-600/40 to-cyan-900/60`         | Deep Ocean theme glow                  |
| `bg-gradient-to-br from-purple-600/40 to-purple-900/60`     | Moonlight Meadow theme glow           |
| `bg-[radial-gradient(circle_at_center,...)]`                  | LoadingFX background (Classic)        |
| `bg-[radial-gradient(ellipse_at_top,...)]`                    | LoadingFX background (Sleep)          |
| `bg-[radial-gradient(circle_at_bottom_left,...)]`             | LoadingFX background (Mad Libs)       |
| `bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]` | Sleep preview hover glow |

### 6.2 Progress Bar Fill Gradients

| Gradient                                          | Mode       |
|--------------------------------------------------|------------|
| `from-blue-600 via-cyan-400 to-blue-200`         | Classic    |
| `from-indigo-600 via-purple-400 to-indigo-200`   | Sleep      |
| `from-orange-500 via-yellow-400 to-red-500`      | Mad Libs   |

### 6.3 Overlay / Stripe Gradients

| Gradient                                                                                | Usage                        |
|-----------------------------------------------------------------------------------------|------------------------------|
| `bg-[linear-gradient(45deg,transparent_25%,...)]` (diagonal stripes)                     | Progress bar background      |
| `bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]`              | Progress bar shimmer         |

---

## 7. Icons & Imagery

### 7.1 Emoji Usage Patterns

The application uses emoji extensively as iconographic elements instead of traditional SVG icon libraries.

**Mode Identifiers**:
| Mode      | Primary | Secondary |
|-----------|---------|-----------|
| Classic   | `⚔️`   | `🦸`     |
| Mad Libs  | `🤪`   | --        |
| Sleep     | `🌙`   | `😴`     |

**UI Action Icons**:
| Emoji | Context                                      |
|-------|----------------------------------------------|
| `🏺`  | Memory Jar button                            |
| `⚙️`  | Settings button                              |
| `🔧`  | Settings modal header icon                   |
| `🔑`  | API key dialog badge                         |
| `🎨`  | Avatar creation badge (classic)              |
| `✨`  | Avatar creation badge (sleep), sparkle FX    |
| `⚠️`  | Error alert icon                             |
| `💥`  | Error boundary crash icon                    |
| `📘`  | Default story thumbnail (Memory Jar)         |
| `🌫️`  | Empty Memory Jar state                       |
| `💾`  | Save/download, preferences saved             |
| `🔗`  | Share action                                 |
| `🗑️`  | Delete action                                |
| `📶🚫` | Offline-ready indicator                     |
| `⏳`  | Narration loading state                      |
| `⏸️`  | Pause playback                               |
| `▶️`  | Play/resume playback                         |
| `⏹️`  | Stop playback                                |
| `🔇`  | Sound muted                                  |
| `🔊`  | Sound active                                 |

**Voice Selector Icons**:
| Voice   | Emoji | Description   |
|---------|-------|---------------|
| Kore    | `🌸`  | Soothing      |
| Aoede   | `🐦`  | Melodic       |
| Zephyr  | `🍃`  | Gentle (Soft) |
| Leda    | `✨`  | Ethereal (Soft)|
| Puck    | `🦊`  | Playful       |
| Charon  | `🐻`  | Deep          |
| Fenrir  | `🐺`  | Bold          |

**Story Duration Icons**:
| Duration | Emoji |
|----------|-------|
| Short    | `⚡`  |
| Medium   | `📖`  |
| Long     | `📜`  |
| Eternal  | `♾️`  |

**Sleep Theme Icons**:
| Theme             | Emoji |
|-------------------|-------|
| Cloud Kingdom     | `☁️`  |
| Starry Space      | `🚀`  |
| Magic Forest      | `🍄`  |
| Deep Ocean        | `🐙`  |
| Moonlight Meadow  | `🌙`  |

**Ambient Sound Icons**:
| Sound          | Emoji |
|----------------|-------|
| Gentle Rain    | `🌧️`  |
| Forest Night   | `🌲`  |
| Midnight Ocean | `🌊`  |
| Night Crickets | `🦗`  |
| Cosmic Hum     | `🛰️`  |
| Ethereal Spark | `✨`  |
| Silence        | `🔇`  |

**Settings Category Icons**: `⚙️` General, `🗣️` Voice & Audio, `👁️` Accessibility

**Settings Dreamscape Picker**: `☁️`, `🚀`, `🍄`, `🐙`, `🌙`

**Loading Screen Floating Words**: "ZAP!", "POW!", "KABOOM!", "GLOW!", "SHINE!", "SPARK!", "WONDER!", "WHAM!", "BOOM!", "CRASH!" (Classic/MadLibs modes only -- omitted in Sleep mode for calm)

### 7.2 SVG Icons

Only one inline SVG is used in the codebase:

- **Checkmark circle** (SleepSetup.tsx): A filled checkmark icon (`viewBox="0 0 20 20"`) shown on the selected dreamscape theme card, rendered in `text-indigo-300`.

- **Progress ring** (ReadingView.tsx): An SVG `<circle>` element used as a radial progress indicator around the play/pause button, with `strokeDasharray="260"` and a dynamic `strokeDashoffset` controlled by narration progress.

### 7.3 Avatar Display

Hero avatars are displayed as circular or rounded-rectangle images:

- **Setup (HeroAvatarDisplay)**: `w-32 h-32 md:w-40 md:h-40` circle with `rounded-full`, `border-[6px]`
- **ReadingView header**: `w-28 h-28 md:w-40 md:h-40` with `rounded-3xl md:rounded-[2.5rem]`, `border-[6px] border-black`, slight `rotate-1` tilt
- **Memory Jar thumbnail**: `w-14 h-14` with `rounded-xl`, `border-2 border-black`

**Default avatar (no image)**: Uses mode-specific emoji (`🦸`, `🤪`, `😴`) over a dot-grid radial pattern background with a "No Image" label badge.

### 7.4 Background Textures

- **Stardust texture**: External URL `https://www.transparenttextures.com/patterns/stardust.png` applied at `opacity-20` with `mix-blend-overlay` on the HeroHeader and LoadingFX backgrounds.
- **Dot grid pattern** (inline CSS): `radial-gradient(circle, currentColor 1px, transparent 1px)` at `backgroundSize: '8px 8px'` on the default avatar and `24px 24px` on the sleep preview panel.

---

## 8. Responsive Design

### 8.1 Breakpoint Strategy

The app follows Tailwind's default mobile-first breakpoints:

| Breakpoint | Min Width | Prefix |
|------------|-----------|--------|
| Base       | 0px       | (none) |
| sm         | 640px     | `sm:`  |
| md         | 768px     | `md:`  |
| lg         | 1024px    | `lg:`  |

**Primary breakpoint**: `md:` is the most heavily used breakpoint, serving as the dividing line between mobile and desktop layouts.

### 8.2 Layout Adaptations

**HeroHeader**:
- Title: `text-6xl` -> `md:text-8xl` -> `lg:text-9xl`
- Bottom radius: `rounded-b-[2.5rem]` -> `md:rounded-b-[4rem]`
- Mode icon: `text-2xl` -> `md:text-3xl`

**Setup**:
- Container: `py-6 px-4` -> `md:py-10 md:px-8`
- Card padding: `p-4` -> `md:p-10`
- Card min-height: `min-h-[450px]` -> `md:min-h-[500px]`
- Launch button: `py-5 text-2xl` -> `md:py-6 md:text-4xl`
- Sleep layout: `grid-cols-1` -> `md:grid-cols-2`

**ReadingView**:
- Content padding: `px-4` -> `md:px-12` -> `lg:px-24`
- Vertical padding: `py-16` -> `md:py-24`
- Avatar: `w-28 h-28` -> `md:w-40 md:h-40`
- Title: `text-3xl` -> `md:text-5xl` -> `lg:text-6xl`
- Control bar: `p-3` -> `md:p-6`
- Play button: `text-3xl` -> `md:text-5xl`
- Playback rate controls: `text-[8px]` -> `md:text-[10px]`
- Header button: `w-10 h-10` -> `md:w-12 md:h-12`

**Settings Modal**:
- Layout: stacked `flex-col` -> `md:flex-row` (sidebar + content)
- Sidebar: horizontal scroll at mobile -> `md:w-48` vertical column
- Narrator grid: `grid-cols-2` -> `md:grid-cols-3`

**Memory Jar**:
- Width: `w-full` (full screen on mobile) -> `md:w-96` (sidebar on desktop)

**LoadingFX**:
- Icon: `w-24 h-24` -> `md:w-32 md:h-32` (embedded) / `w-40 h-40` -> `md:w-64 md:h-64` (full)
- Title: `text-2xl` -> `md:text-4xl` (embedded) / `text-5xl` -> `md:text-7xl` (full)
- Emoji: `text-5xl` -> `md:text-6xl` (embedded) / `text-8xl` -> `md:text-[10rem]` (full)

### 8.3 Mobile-Specific Patterns

- **Touch targets**: All interactive elements maintain a minimum 44x44px touch area (buttons: `w-10 h-10` minimum, `py-3` minimum on list items)
- **dvh unit**: ReadingView uses `h-[100dvh]` (dynamic viewport height) to account for mobile browser chrome
- **Overflow**: `overflow-x: hidden` on body and key containers to prevent horizontal scroll from animations
- **Horizontal scroll**: Settings sidebar tabs use `overflow-x-auto` on mobile for swipeable tabs

---

## 9. Dark Theme

The entire application runs on a persistent dark foundation. There is no light/dark toggle; the base theme is always dark with mode-specific color overlays.

### 9.1 Base Dark Surfaces

| Surface                  | Color                    | Usage                              |
|--------------------------|--------------------------|-------------------------------------|
| Body                     | `#0f172a` (slate-900ish) | CSS body background                 |
| App root                 | `slate-950`              | Main app container                  |
| Setup main               | `slate-950`              | Setup page background               |
| Reading background       | `slate-950`              | ReadingView wrapper                 |
| Mode dock                | `slate-900/90`           | Floating tab bar                    |
| Memory Jar drawer        | `slate-900`              | Saved stories panel                 |
| Memory Jar header        | `slate-800`              | Drawer header bar                   |
| Memory Jar cards         | `slate-800`              | Individual story cards              |
| Memory Jar action bar    | `slate-900/50`           | Download/share/delete bar           |
| Panel empty              | `gray-950`               | Empty comic panel                   |

### 9.2 Content Surfaces (Elevated)

The app creates contrast by placing light surfaces over the dark base:

| Surface              | Color                     | Usage                               |
|----------------------|---------------------------|--------------------------------------|
| Setup card (Classic) | `bg-white`                | Main setup form card                 |
| Setup card (Sleep)   | `bg-indigo-950`           | Sleep mode form card                 |
| Reading area (Classic)| `bg-[#fcf8ef]`           | Warm parchment reading surface       |
| Reading area (Sleep) | `bg-indigo-950`           | Deep indigo reading surface          |
| Control bar (Classic)| `bg-white`                | ReadingView bottom controls          |
| Control bar (Sleep)  | `bg-indigo-900`           | ReadingView bottom controls          |
| Settings modal       | `bg-white`                | Modal container                      |
| ApiKey dialog        | `bg-white`                | Dialog card                          |
| Completion card      | `bg-white`                | Badge reward card                    |

### 9.3 Overlay Patterns

| Overlay                           | Usage                                    |
|----------------------------------|------------------------------------------|
| `bg-black/80 backdrop-blur-sm`   | ApiKeyDialog backdrop                    |
| `bg-black/80 backdrop-blur-md`   | SettingsModal backdrop                   |
| `bg-black/80`                    | MemoryJar backdrop                       |
| `bg-black/40`                    | ReadingView header buttons               |
| `bg-black/40 hover:bg-black/60`  | ReadingView button hover state           |
| `bg-black/50 backdrop-blur-md`   | Progress bar container                   |

### 9.4 Text Contrast on Dark

- Primary text on dark: `text-white`
- Secondary text on dark: `text-white/80`, `text-slate-400`
- Muted text on dark: `text-slate-500`, `text-white/60`
- Labels on dark: `text-indigo-400`, `text-slate-400` at `text-[10px]` uppercase
- Footer hints: `text-[10px] text-slate-500 uppercase tracking-widest`

---

## 10. Motion Design Tokens

The application uses [Framer Motion](https://www.framer.com/motion/) extensively for all animation.

### 10.1 Spring Configurations

| Config                                          | Usage                                      |
|------------------------------------------------|---------------------------------------------|
| `type: "spring", bounce: 0.2, duration: 0.6`  | Mode tab `layoutId` transition, sub-mode pill |
| `type: "spring", damping: 25, stiffness: 200` | MemoryJar drawer slide-in                   |
| `type: "spring", stiffness: 20, damping: 10`  | Progress bar width animation (LoadingFX)    |
| `type: "spring", stiffness: 50`               | Story journey progress bar (ReadingView)    |

### 10.2 Duration Values

| Duration  | Usage                                                  |
|-----------|--------------------------------------------------------|
| `0.1s`    | `.comic-btn` transition, SyncedText word color         |
| `0.3s`    | ApiKeyDialog animate-in, header button hover, SVG progress circle |
| `0.5s`    | LoadingFX fade in/out, Panel decision overlay, sensory card hover, theme icon hover |
| `0.6s`    | Mode tab spring animation                              |
| `0.7s`    | SleepSetup fade-in slide animation                     |
| `1.0s`    | Mode transition color changes (partial), Book page flip|
| `1.5s`    | Star field fade in/out, shimmer cycle, floating word lifecycle |
| `2.0s`    | Loading step message cycle interval                    |
| `3.0s`    | `.animate-float` cycle, LoadingFX icon pulse           |
| `4.0s`    | Sleep sparkle decorative animation                     |
| `6.0s`    | `.animate-breathe` cycle, Sleep theme preview float    |
| `8.0s`    | Loading spinner ring 1 rotation                        |
| `12.0s`   | Loading spinner ring 2 rotation (reverse)              |
| `1000ms`  | `transition-colors duration-1000` for mode color transitions |
| `2000ms`  | `transition-colors duration-2000` for reading area transitions, radial gradient hover |

### 10.3 Easing Curves

| Easing        | Usage                                              |
|---------------|-----------------------------------------------------|
| `ease`        | `.comic-btn` transition                             |
| `ease-in-out` | `.animate-float`, `.animate-breathe`, sleep star twinkling, sleep icon float, LoadingFX pulsing elements |
| `linear`      | Loading spinner rotations, classic/madlibs particle motion |
| `ease-out`    | LengthSlider progress track transition              |

### 10.4 Common Animation Patterns

**Fade + Slide Enter/Exit**:
```ts
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
// Used for story part reveal
```

**Scale + Fade Modal**:
```ts
initial={{ scale: 0.9, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
exit={{ scale: 0.9, opacity: 0 }}
// Used for SettingsModal, CompletionView
```

**Slide-in Drawer**:
```ts
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ type: 'spring', damping: 25, stiffness: 200 }}
// Used for MemoryJar
```

**Connection Status Banner**:
```ts
initial={{ y: -50 }}
animate={{ y: 0 }}
// Slides down from top
```

**Tagline Text Swap**:
```ts
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
// AnimatePresence mode="wait"
```

**Loading Step Flipper**:
```ts
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
// AnimatePresence mode="wait"
```

**Error Banner Expand/Collapse**:
```ts
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
```

**Floating Word Particle Lifecycle**:
```ts
initial={{ scale: 0, opacity: 0, rotate: randomDeg, y: 0 }}
animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], y: -100 }}
exit={{ scale: 0, opacity: 0 }}
transition={{ duration: 1.5 }}
```

**Star Twinkling** (Sleep mode header):
```ts
animate={{ opacity: [0.1, 0.8, 0.1] }}
transition={{ duration: 2-4s (random), repeat: Infinity, ease: "easeInOut" }}
```

**Loading Icon Breathe**:
```ts
animate={{
    scale: [0.9, 1.1, 0.9],
    rotate: mode === 'madlibs' ? [0, 10, -10, 0] : 0,
    filter: ["brightness(100%)", "brightness(130%)", "brightness(100%)"]
}}
transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
```

**Sleep Theme Preview Float**:
```ts
animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1], y: [0, -10, 0] }}
transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
```

**Suggestion Dropdown**:
```ts
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
```

**Success Footer Slide-Up**:
```ts
initial={{ y: '100%' }}
animate={{ y: 0 }}
exit={{ y: '100%' }}
```

**Sleep Theme Description Blur Transition**:
```ts
initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
```

### 10.5 Interactive Motion

| Interaction     | Transform                                  | Component                |
|-----------------|-------------------------------------------|--------------------------|
| `whileHover`    | `scale: 1.05`                             | Sleep theme buttons      |
| `whileTap`      | `scale: 0.95`                             | Sleep theme buttons      |
| `hover:scale-110` | CSS transition                          | Utility buttons, play button |
| `hover:scale-105` | CSS transition                          | Logo block, length steps |
| `hover:scale-[1.03]` | CSS transition                       | Story choice buttons     |
| `active:scale-95` | CSS transition                           | Utility buttons          |
| `active:scale-[0.97]` | CSS transition                       | Story choice buttons     |
| `hover:rotate-90` | CSS transition                           | Settings gear icon       |
| `hover:-translate-y-1` | CSS transition                      | Wizard next button       |
| `active:translate-y-1` | CSS transition                      | Launch button press      |

### 10.6 Parallax (HeroHeader)

The HeroHeader uses scroll-linked transforms via Framer Motion's `useScroll` and `useTransform`:

```ts
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 300], [0, 100]);
const opacity = useTransform(scrollY, [0, 300], [1, 0]);
const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
```

As the user scrolls the first 300px, the header content translates downward 100px, fades to transparent, and scales down to 95%.

### 10.7 Layout Animations

- **`layout`**: Applied to Setup card container (`motion.section`) and ReadingView control bar (`motion.nav`) for smooth resizing
- **`layoutId="activeTab"`**: Shared layout animation for the mode dock active indicator, creating a smooth sliding pill effect between Classic/MadLibs/Sleep tabs
- **`layoutId="avatar"`**: Shared layout animation on the ReadingView avatar for potential route transitions
- **`layoutId="selection-glow"`**: Shared layout animation for the sleep theme selection highlight
- **`layoutId="submode-pill"`**: Shared layout animation for the sleep sub-mode toggle

### 10.8 Viewport-Triggered Animations

Story parts use `whileInView` for progressive reveal:

```ts
<motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
/>
```

The `-10%` margin triggers the animation slightly before elements enter the viewport, with `once: true` ensuring the animation runs only on first appearance.

### 10.9 Reduced Motion Support

The app respects the `reducedMotion` user preference (from `UserPreferences`):

```ts
if (userPreferences.reducedMotion) {
    document.documentElement.style.scrollBehavior = 'auto';
} else {
    document.documentElement.style.scrollBehavior = 'smooth';
}
```

When enabled, smooth scrolling is disabled. The toggle is exposed in the Settings modal under the Accessibility tab.

### 10.10 Tailwind Animation Utilities Used

| Utility              | Usage                                       |
|----------------------|--------------------------------------------|
| `animate-spin`       | Avatar loading spinner                     |
| `animate-pulse`      | Processing label, MadLib validation, loading screen overlay, star pulse indicator |
| `animate-bounce`     | ApiKeyDialog badge, "READ ISSUE" button, avatar creation badge, error heading |
| `animate-in fade-in` | Settings content transitions               |
| `animate-in zoom-in` | MadLibs setup enter                        |
| `animate-in fade-in slide-in-from-bottom-4` | SleepSetup enter               |
| `animate-in fade-in slide-in-from-right-4`  | Settings tab content switch    |
| `animate-in fade-in slide-in-from-left-4`   | Sleep setup left column        |
| `animate-[spin_8s_linear_infinite]`          | Loading ring 1 rotation       |
| `animate-[spin_12s_linear_infinite_reverse]` | Loading ring 2 rotation       |
| `animate-[shimmer_1.5s_infinite]`            | Progress bar shimmer          |

---

## Appendix A: Z-Index Layering

| Z-Index    | Element                                          |
|------------|--------------------------------------------------|
| `z-0`      | Background particles, textures                   |
| `z-10`     | HeroHeader content, SyncedText active word, sleep preview content |
| `z-20`     | Setup form card, HeroHeader mode dock, Panel overlays |
| `z-30`     | LoadingFX central content                        |
| `z-50`     | Utility bar (settings/memory jar buttons), error banner, MadLib suggestion dropdown |
| `z-[120]`  | ReadingView header controls                      |
| `z-[130]`  | ReadingView playback control bar                 |
| `z-[200]`  | CompletionView, MemoryJar backdrop               |
| `z-[210]`  | MemoryJar drawer                                 |
| `z-[400]`  | ApiKeyDialog                                     |
| `z-[500]`  | Offline status banner                            |
| `z-[1000]` | LoadingFX overlay, SettingsModal                 |

---

## Appendix B: Accessibility Patterns

- **ARIA roles**: `role="main"`, `role="dialog"`, `role="radiogroup"`, `role="radio"`, `role="group"`
- **ARIA labels**: Applied to all interactive elements (`aria-label`), story reader (`aria-label={story title}`)
- **ARIA state**: `aria-pressed` on toggle buttons, `aria-checked` on voice radio buttons, `aria-modal="true"` on dialogs
- **Focus rings**: `outline-none ring-blue-500 focus:ring-2` on ReadingView controls; `focus:ring-4 focus:ring-indigo-500/50` on theme cards
- **Keyboard**: Navigation through tab order; wizard steps have explicit back/forward buttons
- **Font sizing**: User-configurable `normal` / `large` font size preference
- **Reduced motion**: Toggleable in settings to disable smooth scrolling
- **Color contrast**: Light text on dark backgrounds (white on slate-950), dark text on light surfaces (black on white)

---

## Appendix C: File Reference

| File                                     | Design Role                                 |
|------------------------------------------|---------------------------------------------|
| `index.css`                              | Custom CSS classes, animations, scrollbar   |
| `index.html`                             | Font loading, meta theme-color              |
| `App.tsx`                                | Root layout, global background, phase routing|
| `HeroHeader.tsx`                         | Mode-specific header gradients, parallax, star field, mode dock |
| `Setup.tsx`                              | Setup page layout, utility bar, launch CTA  |
| `LoadingFX.tsx`                          | Loading screen particles, progress bar, mode-specific visuals |
| `Panel.tsx`                              | Comic panel display, decision overlays      |
| `Book.tsx`                               | Book/page-flip container                    |
| `ApiKeyDialog.tsx`                       | Modal dialog with comic styling             |
| `components/ReadingView.tsx`             | Reading layout, playback controls, prose styling |
| `components/CompletionView.tsx`          | Reward badge card                           |
| `components/SyncedText.tsx`              | Word-level narration highlighting           |
| `components/ErrorBoundary.tsx`           | Error fallback with comic styling           |
| `components/SettingsModal.tsx`           | Settings UI with tabbed layout              |
| `components/setup/SetupShared.tsx`       | Avatar display, MadLib field, wizard step, length slider, sensory card |
| `components/setup/ClassicSetup.tsx`      | Classic mode wizard flow                    |
| `components/setup/MadlibsSetup.tsx`      | Mad Libs fill-in-the-blank layout           |
| `components/setup/SleepSetup.tsx`        | Sleep mode theme/sensory configuration      |
| `components/setup/VoiceSelector.tsx`     | Narrator voice picker                       |
| `components/setup/MemoryJar.tsx`         | Saved stories drawer                        |
| `components/setup/ModeSetup.tsx`         | Mode routing (classic/sleep/madlibs)        |
| `types.ts`                               | AppMode, UserPreferences, theme-related types|
