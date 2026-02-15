# Infinity Heroes: Bedtime Chronicles -- Developer Guide

This guide covers day-to-day development patterns, conventions, and how-tos for contributors working on the Infinity Heroes: Bedtime Chronicles project.

---

## 1. Development Environment Setup

### Required Tools and Versions

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ (LTS recommended) | Required for Vite and Vercel serverless functions |
| npm | 9+ | Ships with Node.js |
| Git | 2.x+ | Version control |
| TypeScript | ~5.8.2 | Installed as a dev dependency |

### IDE Recommendations

**VS Code** is the recommended editor. Install these extensions:

- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) -- autocomplete for Tailwind v4 classes, including arbitrary values like `shadow-[8px_8px_0px_black]`.
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`) -- component scaffolding shortcuts.
- **TypeScript Importer** or **Auto Import** -- resolves `@/` path alias imports automatically.
- **Prettier** (`esbenp.prettier-vscode`) -- consistent formatting.
- **Error Lens** (`usernamehw.errorlens`) -- surfaces TypeScript errors inline.

### Environment Configuration

The app uses Vercel Serverless Functions for its API layer. API keys are managed server-side.

1. Set the `GEMINI_API_KEY` environment variable:
   - **Local development**: Create a `.env` file in the project root:
     ```
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```
   - **Production (Vercel)**: Configure via Vercel Dashboard > Settings > Environment Variables.

2. The client-side code never touches the API key directly. The `useApiKey` hook currently returns `true` for validation since all key management is handled by the serverless API routes in `api/`.

---

## 2. Running the App

### Dev Server

```bash
npm run dev
```

Starts the Vite dev server on **port 3000** (configured in `vite.config.ts` with `host: '0.0.0.0'` for network access). Hot Module Replacement (HMR) is enabled automatically via `@vitejs/plugin-react`.

### Build

```bash
npm run build
```

Produces an optimized production build in `dist/`. This also generates the PWA service worker via `vite-plugin-pwa`.

### Preview

```bash
npm run preview
```

Serves the production build locally for verification before deploying.

### Testing API Functions Locally

The Vercel serverless functions in `api/` are not served by the Vite dev server. To test them locally:

1. Install the Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Run the full development environment with Vercel:
   ```bash
   vercel dev
   ```
   This starts both the Vite frontend and the serverless API functions, proxying `/api/*` requests to the functions in the `api/` directory.

3. Alternatively, you can test individual API functions with `curl`:
   ```bash
   curl -X POST http://localhost:3000/api/generate-story \
     -H "Content-Type: application/json" \
     -d '{"systemInstruction":"...","userPrompt":"...","responseSchema":{...}}'
   ```

---

## 3. Code Organization

### Directory Structure

```
infinity-heroes_-bedtime-chronicles/
|-- api/                          # Vercel Serverless Functions (backend)
|   |-- generate-story.ts         # Story generation via Gemini text model
|   |-- generate-avatar.ts        # Hero avatar image generation via Gemini
|   |-- generate-scene.ts         # Scene illustration generation via Gemini
|   |-- generate-narration.ts     # Text-to-speech via Gemini TTS model
|
|-- components/                   # Reusable UI components
|   |-- setup/                    # Setup wizard sub-components
|   |   |-- ClassicSetup.tsx      # Classic adventure mode form
|   |   |-- MadlibsSetup.tsx      # Mad Libs mode form
|   |   |-- SleepSetup.tsx        # Sleep/dream mode form
|   |   |-- ModeSetup.tsx         # Mode router component
|   |   |-- VoiceSelector.tsx     # Narrator voice picker
|   |   |-- MemoryJar.tsx         # Saved stories drawer
|   |   |-- SetupShared.tsx       # Shared UI primitives (wizard steps, avatar, length slider)
|   |-- ReadingView.tsx           # Main reading/playback screen
|   |-- SyncedText.tsx            # Word-by-word narration highlighting
|   |-- ErrorBoundary.tsx         # React error boundary with comic theme
|   |-- CompletionView.tsx        # Story completion screen
|   |-- SettingsModal.tsx         # User preferences modal
|
|-- hooks/                        # Custom React hooks
|   |-- useStoryEngine.ts         # Central state machine for the app
|   |-- useNarrationSync.ts       # Bridges NarrationManager audio state to React
|
|-- lib/                          # Utility modules
|   |-- StorageManager.ts         # IndexedDB persistence layer
|   |-- Logger.ts                 # Structured console logger
|
|-- App.tsx                       # Root component, phase routing
|-- index.tsx                     # React DOM entry point
|-- index.html                    # HTML shell
|-- index.css                     # Global styles, Tailwind import, custom classes
|-- types.ts                      # All TypeScript type definitions
|-- AIClient.ts                   # Client-side API abstraction with retry logic
|-- NarrationManager.ts           # Singleton for TTS audio playback (Web Audio API)
|-- SoundManager.ts               # Singleton for ambient sound and UI sound effects
|-- useApiKey.ts                  # API key validation hook (server-managed)
|-- HeroHeader.tsx                # Animated header with mode dock
|-- Setup.tsx                     # Setup page container
|-- LoadingFX.tsx                 # Full-screen loading animations
|-- Panel.tsx                     # Comic panel component
|-- Book.tsx                      # Book layout component
|-- ApiKeyDialog.tsx              # API key prompt dialog
|
|-- vite.config.ts                # Vite configuration (plugins, aliases, PWA)
|-- tsconfig.json                 # TypeScript compiler options
|-- package.json                  # Dependencies and scripts
```

### File Naming Conventions

- **Components**: PascalCase with `.tsx` extension (e.g., `ReadingView.tsx`, `SyncedText.tsx`).
- **Hooks**: camelCase prefixed with `use` (e.g., `useStoryEngine.ts`, `useNarrationSync.ts`).
- **Utilities / Singletons**: PascalCase for class-based modules (e.g., `SoundManager.ts`, `AIClient.ts`).
- **Types**: Defined centrally in `types.ts`. No separate `.d.ts` files.
- **API routes**: kebab-case (e.g., `generate-story.ts`, `generate-narration.ts`).

### Where to Add New Code

| Type of code | Location |
|---|---|
| New UI component | `components/` (or `components/setup/` if setup-specific) |
| New custom hook | `hooks/` |
| New API endpoint | `api/` |
| New type/interface | `types.ts` |
| New utility class | `lib/` |
| New global CSS class | `index.css` |

---

## 4. Working with the AI Client

### Architecture Overview

The AI layer follows a client-server split:

- **Client** (`AIClient.ts`): Builds prompts, schemas, and calls `/api/*` endpoints. Runs in the browser.
- **Server** (`api/*.ts`): Vercel Serverless Functions that hold the `GEMINI_API_KEY` and call the Google Gemini API.

### How to Add a New API Endpoint

**Step 1: Create the serverless function.**

Create a new file in `api/`, e.g. `api/generate-quiz.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { topic } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: `Generate a quiz about ${topic}` }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: "OBJECT",
          properties: {
            questions: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["questions"]
        },
      },
    });

    res.status(200).json({ text: result.text });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(error.status || 500).json({ error: error.message || 'Generation failed' });
  }
}
```

**Step 2: Add the client-side method in `AIClient.ts`.**

```typescript
static async generateQuiz(topic: string): Promise<string[]> {
  return this.retry(async () => {
    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.error || 'Quiz generation failed'), { status: res.status });
    }
    const data = await res.json();
    return JSON.parse(data.text).questions;
  });
}
```

### Schema Building

The Gemini API uses inline type strings for response schemas (not TypeScript types). The supported type values are:

- `"STRING"`, `"INTEGER"`, `"NUMBER"`, `"BOOLEAN"`, `"OBJECT"`, `"ARRAY"`

Nest them using `properties` (for objects) and `items` (for arrays). Always include a `required` array for object types. See `AIClient.streamStory()` for a comprehensive example.

### Error Handling and Retry Pattern

`AIClient` has a built-in `retry` method:

```typescript
private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T>
```

Key behaviors:
- Retries up to 3 times with exponential backoff (1s, 2s, 4s).
- **Does NOT retry** on 4xx errors (client errors) except `429` (rate limit).
- **Does retry** on 5xx errors and network failures.
- Each API method wraps its fetch call inside `this.retry(async () => { ... })`.

Error objects are augmented with `{ status }` so callers can detect specific HTTP codes:
```typescript
throw Object.assign(new Error(err.error || 'Failed'), { status: res.status });
```

---

## 5. Working with Components

### Creating New Components

Follow this pattern for new components:

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

interface MyComponentProps {
    title: string;
    onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_black]"
        >
            <h2 className="font-comic text-2xl uppercase">{title}</h2>
            <button onClick={onAction} className="comic-btn bg-blue-500 text-white px-6 py-2 mt-4">
                Go!
            </button>
        </motion.div>
    );
};
```

Key conventions:
- Always include the Apache-2.0 license header.
- Export as named exports (not default), except for lazy-loaded components.
- Define a TypeScript interface for props.
- Use `React.FC<Props>` for typing.

### Using Framer Motion Animations

The project uses Framer Motion extensively. Common patterns:

**Entrance animations:**
```tsx
<motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
>
```

**Scroll-triggered reveal (used in ReadingView):**
```tsx
<motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-10% 0% -10% 0%" }}
>
```

**Layout animations for smooth reflow:**
```tsx
<motion.div layout>
<motion.div layoutId="activeTab">  // Shared layout animation between elements
```

**AnimatePresence for mount/unmount transitions:**
```tsx
<AnimatePresence mode="wait">
    {condition && (
        <motion.div
            key={uniqueKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
```

**Parallax scrolling (HeroHeader):**
```tsx
const { scrollY } = useScroll();
const y = useTransform(scrollY, [0, 300], [0, 100]);
const opacity = useTransform(scrollY, [0, 300], [1, 0]);
```

### Tailwind CSS Patterns Used in the Project

**Arbitrary values** are used frequently for the comic book aesthetic:
```tsx
className="shadow-[8px_8px_0px_black] border-[6px] rounded-[2.5rem]"
```

**Responsive prefixes** (`md:`, `lg:`) for mobile-first design:
```tsx
className="text-base md:text-xl lg:text-2xl p-4 md:p-10"
```

**Conditional classes** are applied inline with template literals:
```tsx
className={`comic-btn ${isReady ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
```

**Dynamic color theming** by mode:
```tsx
className={`${isSleepMode ? 'bg-indigo-950 text-indigo-100/90' : 'bg-[#fcf8ef] text-gray-800'}`}
```

### Comic Book Theme Classes

The following custom classes are defined in `index.css` and used throughout:

| Class | Purpose |
|-------|---------|
| `comic-btn` | Bold comic-style button with thick border, box-shadow offset, hover/active transforms |
| `font-comic` | Applies the `Bangers` font family with letter-spacing |
| `animate-float` | Gentle floating animation (3s cycle, translateY) |
| `animate-breathe` | Slow breathing scale+brightness animation (6s cycle, for sleep mode) |
| `custom-scrollbar` | Minimal translucent scrollbar styling |

Usage example:
```tsx
<button className="comic-btn bg-red-600 text-white px-6 py-3 text-xl rounded-2xl">
    ENGAGE MISSION
</button>
```

---

## 6. Working with Hooks

### Custom Hook Patterns

Hooks in this project follow these conventions:
- Exported as named arrow function exports.
- Accept dependencies (callbacks, flags) as parameters rather than importing global state.
- Return an object of state values and action functions.
- Use `useCallback` for all returned functions to prevent unnecessary re-renders.

### Story Engine Hook (`useStoryEngine`)

**Location:** `hooks/useStoryEngine.ts`

This is the central state machine for the entire application. It manages:

- **Phase transitions**: `setup` -> `reading` -> (back to `setup` on reset)
- **Story generation**: Calls `AIClient.streamStory()`, saves to IndexedDB, updates history.
- **Avatar/scene generation**: Calls `AIClient.generateAvatar()` and `AIClient.generateSceneIllustration()`.
- **Narration control**: Delegates to `NarrationManager` singleton for play/pause/stop.
- **Input state**: All form fields for all three modes (classic, madlibs, sleep).
- **User preferences**: Persisted to IndexedDB via `StorageManager`.
- **Online/offline detection**: Listens to `navigator.onLine` events.
- **Error state**: Centralized error handling with `clearError`.

**Adding new functionality**: If you need a new action (e.g., sharing a story), add it as a `useCallback` inside this hook and include it in the return object.

```typescript
const shareStory = useCallback(async () => {
    if (!story) return;
    // ... implementation
}, [story]);

return {
    // ... existing returns
    shareStory,
};
```

### Sound/Narration Hooks

**`useNarrationSync`** (`hooks/useNarrationSync.ts`):

Bridges the imperative `NarrationManager` singleton with React's declarative state. It:
- Polls audio time via `requestAnimationFrame` while `isNarrating` is true.
- Exposes `narrationTime`, `narrationDuration`, `playbackRate`, and `setPlaybackRate`.
- Resets `narrationTime` to 0 when narration stops.

The `NarrationManager` and `SoundManager` are both singletons (not hooks). They are imported directly where needed:

```typescript
import { narrationManager } from './NarrationManager';
import { soundManager } from './SoundManager';
```

**SoundManager** provides UI sound effects:
- `playChoice()` -- button click feedback
- `playPageTurn()` -- page navigation
- `playSparkle()` -- avatar generation success (ascending arpeggio)
- `playDelete()` -- destructive action confirmation
- `playAmbient(mode)` -- ambient soundscapes for sleep mode (space, rain, forest, magic, ocean, crickets)
- `stopAmbient()` -- fades out ambient audio
- `setMuted(boolean)` -- global mute toggle

---

## 7. TypeScript Patterns

### Type Definitions in `types.ts`

All shared types are centralized in `types.ts`. Key types:

```typescript
type AppMode = 'classic' | 'madlibs' | 'sleep';
type AppPhase = 'setup' | 'reading' | 'finished';
type StoryLength = 'short' | 'medium' | 'long' | 'eternal';
type AmbientTheme = 'space' | 'rain' | 'forest' | 'magic' | 'ocean' | 'crickets' | 'auto';

interface StoryState { ... }     // All input form fields
interface StoryFull { ... }      // Complete generated story structure
interface StoryPart { ... }      // Individual story segment
interface UserPreferences { ... } // Persisted user settings
interface ComicFace { ... }      // Comic panel rendering data
```

Constants are also exported from `types.ts`:
```typescript
export const DEFAULT_PREFERENCES: UserPreferences = { ... };
export const TOTAL_PAGES = 18;
export const INITIAL_PAGES = 6;
export const GATE_PAGE = 1;
```

### Path Aliases (`@/`)

The project uses the `@/` alias to reference files from the project root. Configured in both:

- **`tsconfig.json`**: `"paths": { "@/*": ["./*"] }`
- **`vite.config.ts`**: `resolve.alias: { '@': path.resolve(__dirname, '.') }`

Usage:
```typescript
import { StoryState } from '@/types';
import { AIClient } from '@/AIClient';
```

In practice, the codebase primarily uses relative imports (`../types`, `./SoundManager`). Either style works.

### Strict Mode Considerations

The `tsconfig.json` does **not** enable `strict: true`, but uses these individual settings:

- `"target": "ES2022"` -- modern JavaScript output.
- `"module": "ESNext"` -- ESM modules.
- `"isolatedModules": true` -- required by Vite for fast transpilation.
- `"moduleDetection": "force"` -- treats all files as modules.
- `"allowImportingTsExtensions": true` -- allows `.ts` in import paths.
- `"noEmit": true` -- TypeScript is only used for type checking; Vite handles compilation.
- `"jsx": "react-jsx"` -- uses the automatic JSX runtime (no need to `import React` in every file, though the codebase still does).
- `"types": []` -- no global type packages are auto-included.
- `"skipLibCheck": true` -- skips type checking of `node_modules`.

When adding new code, be aware that strict null checks are not enforced. You will see patterns like `this.ctx!.createOscillator()` using non-null assertions.

---

## 8. Styling Guide

### Tailwind v4 with `@import` Syntax

The project uses **Tailwind CSS v4** with the Vite plugin (`@tailwindcss/vite`). The CSS entry point is `index.css`:

```css
@import "tailwindcss";
```

This single import replaces the older `@tailwind base/components/utilities` directives. Tailwind v4 auto-detects your source files and generates utilities on demand.

### Custom CSS Classes in `index.css`

The `index.css` file defines global custom classes that extend the Tailwind utility layer:

```css
body {
  font-family: 'Comic Neue', cursive;   /* Default body font */
  background-color: #0f172a;            /* Dark slate background */
}

.font-comic { font-family: 'Bangers', cursive; letter-spacing: 1px; }
.comic-btn { /* Bold button with thick border and offset box-shadow */ }
.custom-scrollbar { /* Minimalist translucent scrollbar */ }
.animate-float { /* 3s vertical float keyframes */ }
.animate-breathe { /* 6s scale+brightness breathing keyframes */ }
```

### Font Families

Three font families are used, loaded via Google Fonts in `index.html`:

| Font | CSS Class / Usage | Purpose |
|------|-------------------|---------|
| **Bangers** | `.font-comic` / `font-family: 'Bangers'` | Headlines, buttons, comic text. Bold, impactful. |
| **Comic Neue** | Body default (`font-family: 'Comic Neue'`) | General UI text. Friendly, readable. |
| **Lora** (serif) | `font-serif` (Tailwind default) | Story body text in ReadingView. Elegant, book-like. |

### Animation Classes

**CSS animations** (defined in `index.css`):
- `animate-float` -- gentle up/down hover effect
- `animate-breathe` -- slow scale pulse with brightness shift (sleep mode)

**Tailwind animation utilities** used inline:
- `animate-pulse` -- opacity fade in/out
- `animate-bounce` -- vertical bounce
- `animate-spin` -- continuous rotation
- `animate-[spin_8s_linear_infinite]` -- custom spin duration via arbitrary values

**Inline `@keyframes`** (defined in component `<style>` tags):
- `shimmer` in `LoadingFX.tsx` -- horizontal shine effect on progress bars

---

## 9. Adding New Story Modes

The app currently supports three modes: `classic`, `madlibs`, and `sleep`. To add a new mode:

### Step 1: Define the mode type

In `types.ts`, extend the `AppMode` union:

```typescript
export type AppMode = 'classic' | 'madlibs' | 'sleep' | 'quiz';
```

Add any mode-specific configuration interfaces and extend `StoryState` if needed.

### Step 2: Create the setup component

Create `components/setup/QuizSetup.tsx` following the pattern of `ClassicSetup.tsx`:

```typescript
export const QuizSetup: React.FC<QuizSetupProps> = ({ input, onChange, ... }) => {
    // Mode-specific form fields
};
```

### Step 3: Register the mode in `ModeSetup.tsx`

Add a new `case` to the mode switch:

```typescript
case 'quiz':
    return <QuizSetup input={input} onChange={onChange} ... />;
```

### Step 4: Add the mode tab in `HeroHeader.tsx`

Add an entry to the `MODES` array:

```typescript
{ id: 'quiz', label: 'Quiz', icon: '🧠', color: 'bg-green-600', tagline: 'Test Your Knowledge' }
```

### Step 5: Build the prompt in `AIClient.ts`

Add mode-specific `systemInstruction` and `userPrompt` logic in `streamStory()`, plus any new schema fields.

### Step 6: Add the mode to readiness check

In `Setup.tsx`, extend the `checkIsReady()` function:

```typescript
case 'quiz':
    return !!input.heroName && input.heroName.trim().length > 0;
```

### Step 7: Handle mode-specific reading behavior

In `ReadingView.tsx` and `useStoryEngine.ts`, add any mode-specific logic (e.g., auto-advance for sleep mode is handled via effects in `useStoryEngine`).

---

## 10. Debugging Tips

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `GEMINI_API_KEY not configured` | Missing environment variable | Set `GEMINI_API_KEY` in `.env` (local) or Vercel dashboard (production) |
| API calls return 404 | Running with `npm run dev` instead of `vercel dev` | Serverless functions require the Vercel CLI. Use `vercel dev` to serve both frontend and API. |
| Story generation returns invalid JSON | Gemini sometimes wraps response in markdown code fences | `AIClient.streamStory()` already strips `` ```json `` wrappers. Check the raw `data.text` in Network tab if parsing still fails. |
| Audio does not play | AudioContext suspended (browser autoplay policy) | `SoundManager.init()` and `NarrationManager.init()` call `ctx.resume()`. Ensure the first audio trigger comes from a user gesture (click). |
| `Parts array is missing or empty` | Gemini returned a malformed story | The client validates `parsed.parts`. Retry the generation or adjust the prompt length configuration. |
| Ambient sound plays after muting | `setMuted` was not called | Muting is applied via `soundManager.setMuted(bool)` in `useStoryEngine.saveUserPreferences()`. Verify the preference is saved and propagated. |
| PWA not updating | Stale service worker cache | In DevTools > Application > Service Workers, click "Update" or "Unregister" and reload. |

### Browser DevTools Usage

**Network Tab:**
- Filter by `api/` to monitor all Gemini API calls.
- Check response payloads for `text` (story), `data` (images as base64), and `audioData` (TTS as base64).
- Look for non-200 status codes; error messages are in the JSON response body.

**Application Tab:**
- **IndexedDB > BedtimeChroniclesDB**: Inspect saved stories (`stories` store), cached audio (`audio` store), and user preferences (`preferences` store).
- **Service Workers**: Manage PWA registration and caching.

**Console:**
- The `Logger` utility (`lib/Logger.ts`) writes structured logs with timestamps:
  ```
  [INFO] 2026-02-14T12:00:00.000Z - Avatar generation started
  [ERROR] 2026-02-14T12:00:05.000Z - Story generation failed { ... }
  ```
- `NarrationManager` logs cache hits/misses: `"Offline audio cache miss"`.
- `useStoryEngine` logs preload failures: `"Preload failed"`.

### Audio Debugging

**Narration issues (NarrationManager):**
1. Check that the AudioContext is not suspended: In console, run:
   ```javascript
   // Access via the singleton
   narrationManager.state
   // Returns: { isPlaying, isPaused, hasBuffer, currentTime, duration }
   ```
2. Verify audio data arrives from the API: Network tab > `generate-narration` > Response should have `audioData` (base64 string).
3. The NarrationManager decodes raw 16-bit PCM at 24kHz mono. If the Gemini TTS model output format changes, `decodeAudioData()` will produce silence or noise.
4. Check the in-memory cache: `narrationManager.memoryCache` (private, but inspectable via breakpoint).

**Ambient sound issues (SoundManager):**
1. The `SoundManager` uses procedural audio (oscillators + noise buffers), not audio files. No network requests are involved.
2. If ambient sound cuts out, check that `ambientGain` is connected and its value is above 0.
3. Each ambient mode (`space`, `rain`, `forest`, `magic`, `ocean`, `crickets`) creates different Web Audio node graphs. Set breakpoints in the corresponding `setup*()` method.
4. LFO oscillators are tracked in `this.activeLFOs[]` and stopped during `stopAmbient()`. If sounds linger after stopping, check that the cleanup timeout (2100ms) is firing.

**UI sound effects:**
- All UI sounds (`playChoice`, `playPageTurn`, `playSparkle`, `playDelete`) are short oscillator-based sounds. They check `this.muted` before playing.
- If sounds are not playing, verify that `soundManager.setMuted(false)` has been called and that the AudioContext has been initialized via a user interaction.
