
# System Architecture

Infinity Heroes is built as a modular "Fat Client" SPA to minimize server-side dependencies and maximize privacy/offline performance.

## 1. UI Composition & Design System
- **HeroHeader.tsx**: The visual anchor of the application. It handles the "Attract Mode" aesthetics (kinetic typography, particle effects) and global AppMode state switching.
- **Modular Setup**: The setup phase is broken down into mode-specific components:
  - `Setup.tsx`: Main orchestrator container.
  - `ModeSetup.tsx`: Routes to the specific form based on `AppMode`.
  - `VoiceSelector.tsx`: Grid-based selection for AI narrator personalities.
  - `LoadingFX.tsx`: Full-screen cinematic overlay that masks async AI generation times.
  - `ClassicSetup.tsx`: Wizard-style input for hero adventures.
  - `MadlibsSetup.tsx`: Single-screen input with validation for word games.
  - `SleepSetup.tsx`: Sensory-focused configuration for bedtime stories.
- **Framer Motion Integration**: Heavy use of `layoutId` for shared element transitions between Setup, Reading, and Completion views.

## 2. The Story Engine (`useStoryEngine.ts`)
The central orchestrator of the application state. It manages:
- **Phase Control**: Transitions between `setup`, `reading`, and `finished`.
- **Input Management**: Deep state tracking for Hero, Setting, and Sleep Configs.
- **Async Orchestration**: Coordinates AI generation, Image caching, and Persistence.

## 3. Resilient AI Layer (`AIClient.ts`)
- **Exponential Backoff**: Automatically retries failed API requests (excluding 4xx client errors) to handle network jitter or model overloading.
- **Robust JSON Parsing**: Extracts JSON objects from potentially "chatty" model responses that include preamble text or markdown formatting.
- **Schema Enforcement**: Uses `responseSchema` to guarantee strict type adherence for the complex `StoryFull` object.

## 4. Persistence Layer (`StorageManager.ts`)
Uses IndexedDB via the browser's native API (no external wrappers) for high-performance binary storage:
- **`stories` store**: Stores structured JSON story data and Base64 scene imagery.
- **`audio` store**: Caches raw PCM audio buffers from the TTS engine.
- **Versioning**: Currently at v4 to support schema changes for "Sleep Mode" sensory anchors.

## 5. Audio Synthesis Engine (`SoundManager.ts`)
Utilizes a procedural approach instead of static MP3 loops to save bandwidth and provide infinite variety.
- **Noise Generation**: Procedural Brown/Pink noise for nature sounds.
- **LFO Modulation**: Low-frequency oscillators drive filter cutoffs to create "breathing" wind and wave effects.
- **Polyphony**: Supports simultaneous playback of ambient soundscapes and voice narration.

## 6. Narration & Sync (`NarrationManager.ts` & `SyncedText.tsx`)
- **Raw PCM Decoding**: Manually decodes Gemini's 24kHz Mono output to a standard AudioBuffer.
- **Time Polling**: `useNarrationSync` uses `requestAnimationFrame` to poll `audioCtx.currentTime`, ensuring word-level highlighting matches the voice precisely.
