# Infinity Heroes: Bedtime Chronicles -- Complete Interactive Features Reference

## 1. Feature Catalog (Master Table)

| # | Feature | Description | Component(s) | Trigger | User-Visible Behavior |
|---|---------|-------------|---------------|---------|----------------------|
| 1 | Mode Selector | Switch between Classic, Mad Libs, and Sleep story modes | `HeroHeader.tsx` | Click mode tab in floating dock | Background gradient, tagline, and setup form change; sound effect plays |
| 2 | Classic Story Setup Wizard | Multi-step guided hero creation (name, setting, review) | `ClassicSetup.tsx`, `SetupShared.tsx` | Click Next/Back buttons | Animated wizard transitions between steps 0-2 |
| 3 | Mad Libs Story Setup | Fill-in-the-blank sentence with inline inputs | `MadlibsSetup.tsx`, `SetupShared.tsx` | Type or click suggestion chips | Inline fields highlight; suggestion dropdown appears on focus |
| 4 | Sleep Story Setup | Dreamscape theme selector + sensory anchors | `SleepSetup.tsx`, `SetupShared.tsx` | Select theme card, sub-mode toggle, fill sensory fields | Theme grid animates selection glow; ambient sound starts |
| 5 | Sleep Sub-Mode Toggle | Switch between "Dream Pick" (child-friendly) and "Parent's Path" (parent-madlib) | `SleepSetup.tsx` | Click toggle pill | Left panel switches between sensory inputs or theme preview |
| 6 | Hero Avatar Generation | AI-generated portrait of the hero | `SetupShared.tsx` (HeroAvatarDisplay), `useStoryEngine.ts` | Click avatar circle (CREATE HERO / REPAINT) | Spinner during load; sparkle sound; image appears in circle |
| 7 | Hero Image Upload | Upload custom image from device as avatar | `HeroHeader.tsx` | Click the INFINITY HEROES logo | File picker opens; image set as heroAvatarUrl |
| 8 | Voice Selector | Choose narrator voice from 7 options | `VoiceSelector.tsx` | Click voice card | Selected card gets border/shadow highlight; radio group semantics |
| 9 | Story Length Slider | Choose story duration (Short/Medium/Long/Eternal) | `SetupShared.tsx` (LengthSlider) | Click length step button | Active track fills; duration label animates in |
| 10 | Story Generation | Full AI story creation via Gemini API | `AIClient.ts`, `useStoryEngine.ts`, `api/generate-story.ts` | Click ENGAGE MISSION / BEGIN DREAM-LOG button | Loading overlay with progress bar; page-turn sound on completion |
| 11 | Story Reading View | Scrollable narrative with part-by-part progression | `ReadingView.tsx` | Automatic after story generation | Full-screen reading layout with avatar, title, story parts |
| 12 | Choice Selection | Branch story via choice buttons | `ReadingView.tsx`, `useStoryEngine.ts` | Click a choice button on current part | Choice sound; advances to next part; page-turn sound |
| 13 | Narration Playback (Play/Pause/Stop) | TTS audio via Gemini TTS API | `NarrationManager.ts`, `ReadingView.tsx`, `useStoryEngine.ts` | Click play/pause/stop buttons | Play button toggles icon; progress ring animates; text highlights |
| 14 | Narration Speed Control | Adjust playback rate (0.8x, 1.0x, 1.2x) | `ReadingView.tsx`, `useNarrationSync.ts`, `NarrationManager.ts` | Click speed button | Active speed pill highlights; playback rate changes in real time |
| 15 | SyncedText Highlighting | Word-by-word karaoke-style text highlight during narration | `SyncedText.tsx` | Automatic during narration | Active word turns blue+bold; active sentence gets yellow background |
| 16 | Auto-Advance (Sleep Mode) | Automatically progresses parts and starts narration in sleep mode | `useStoryEngine.ts` | Narration ends in sleep mode | 500ms delay then next part loads and auto-plays |
| 17 | Auto-Scroll (Sleep Mode) | Scroll to current part during sleep mode playback | `ReadingView.tsx` | Part index changes in sleep mode | Smooth scroll to current part element |
| 18 | Narration Preloading | Prefetch next part TTS while current plays | `useStoryEngine.ts` | Narration starts for any part except last | Next part audio cached silently in background |
| 19 | Scene Illustration Generation | AI-generated illustration for current story part | `AIClient.ts`, `useStoryEngine.ts`, `api/generate-scene.ts` | `onGenerateScene` callback (available in ReadingView) | Loading state; image appears in avatar display area |
| 20 | Memory Jar (Saved Stories) | Slide-out drawer of all saved stories | `MemoryJar.tsx` | Click jar button (top-right of setup) | Drawer slides in from right with story list |
| 21 | Load Saved Story | Re-open a previously generated story | `MemoryJar.tsx`, `useStoryEngine.ts` | Click a story card in Memory Jar | Reading view opens with saved story + scenes; page-turn sound |
| 22 | Delete Saved Story | Remove story from IndexedDB | `MemoryJar.tsx`, `useStoryEngine.ts` | Click trash button on story card | Delete sound; story removed from list |
| 23 | Download Story JSON | Export story as downloadable JSON file | `MemoryJar.tsx` | Click Save button on story card | Browser downloads .json file |
| 24 | Share Story | Share story title via Web Share API or clipboard | `MemoryJar.tsx` | Click Share button on story card | Native share sheet or clipboard copy alert |
| 25 | Ambient Soundscape Selector | Choose from 6 procedural soundscapes or silence | `SleepSetup.tsx`, `SoundManager.ts` | Click soundscape button in sleep setup | Selected sound fades in over 4 seconds; previous fades out |
| 26 | Mute Toggle | Global mute for all sound effects and ambient | `ReadingView.tsx`, `SettingsModal.tsx`, `SoundManager.ts` | Click speaker icon or toggle in Settings | Sound icon changes; all audio silenced or restored |
| 27 | Font Size Toggle | Switch between Normal and Large reading text | `ReadingView.tsx`, `SettingsModal.tsx` | Click "A" button in reading header or set in Settings | Text size class changes; button label updates |
| 28 | Settings Modal | Three-tab preferences panel (General, Voice & Audio, Accessibility) | `SettingsModal.tsx` | Click gear icon on setup page | Modal with tabbed navigation and save/reset actions |
| 29 | Sequel Preparation | Pre-fill setup with hero name from a saved story | `useStoryEngine.ts` | `onPrepareSequel` callback | Hero name and avatar pre-populated; returns to setup |
| 30 | Story Feedback | Submit rating and text feedback for current story | `useStoryEngine.ts`, `StorageManager.ts` | `onSubmitFeedback` callback | Feedback saved to IndexedDB with story record |
| 31 | Error Banner | Animated error display with dismiss button | `Setup.tsx` | API failure, validation error, offline state | Red banner slides in with error message; dismiss button |
| 32 | Error Boundary | Catches rendering crashes with comic-themed fallback | `ErrorBoundary.tsx` | Uncaught render error | "POW! SPLAT!" fallback UI with Try Again button |
| 33 | API Key Dialog | Paywall/billing prompt for Gemini API | `ApiKeyDialog.tsx`, `useApiKey.ts` | 404 error from API calls | Modal with billing docs link and continue button |
| 34 | Offline Status Banner | Connection status indicator | `App.tsx`, `useStoryEngine.ts` | Browser goes offline | Yellow banner at top: "OFFLINE MODE" |
| 35 | Reduced Motion Setting | Disable animations globally | `SettingsModal.tsx`, `App.tsx` | Toggle in Accessibility settings | `scrollBehavior` set to `auto`; preference persisted |
| 36 | Loading Screen | Animated full-screen/embedded loading experience | `LoadingFX.tsx` | Story generation starts | Mode-specific particles, progress bar, status messages |
| 37 | Preferences Persistence | Save/load user settings to IndexedDB | `StorageManager.ts`, `useStoryEngine.ts` | Settings save, app launch | Preferences restored on next visit |
| 38 | Audio Caching | TTS audio persisted to IndexedDB for offline | `NarrationManager.ts`, `StorageManager.ts` | Any narration fetch | Audio plays from cache on repeat; works offline |
| 39 | PWA / Service Worker | Installable app with offline asset caching | `vite.config.ts` (VitePWA) | Browser install prompt | App installable; cached assets served offline |

---

## 2. Story Generation Features

### 2.1 Classic Story Generation

| Aspect | Detail |
|--------|--------|
| **Component** | `AIClient.streamStory()`, `api/generate-story.ts` |
| **AI Model** | `gemini-3-pro-preview` |
| **System Instruction** | "You are a best-selling Children's Book Author (genre: Fantasy/Adventure). Your goal is to write an exciting, empowering story for kids aged 7-9." |
| **User Prompt Fields** | `heroName`, `heroPower`, `setting`, `sidekick`, `problem` |
| **Response Schema** | Structured JSON: `title`, `parts[]` (text + choices + partIndex), `vocabWord`, `joke`, `lesson`, `tomorrowHook`, `rewardBadge` |
| **Interactivity** | 3 meaningful choices at the end of each part (except final) |
| **Parsing** | Strips markdown code fences; validates `parts` array exists and is non-empty |
| **Retry Logic** | Up to 3 retries with exponential backoff (1s, 2s, 4s); skips retries on 4xx errors (except 429) |

### 2.2 Sleep Story Generation

| Aspect | Detail |
|--------|--------|
| **System Instruction** | "You are a master Sleep Hypnotist and Storyteller. Your goal is to induce deep sleep through a very long, boringly pleasant, and sensory-rich narrative." |
| **Rules** | ZERO CONFLICT. Dreamy, lyrical, slow, repetitive. Soothing vocabulary. |
| **User Prompt Fields** | `heroName`, `sleepConfig.theme`, `sleepConfig.texture`, `sleepConfig.sound`, `sleepConfig.scent` |
| **Interactivity** | NONE -- `choices` array is explicitly empty for all parts |
| **Length Multiplier** | Short: 0.7x, Medium: 1.0x, Long: 1.5x, Eternal: 2.0x of base (15 parts, 4000-6000 words) |
| **Parts Count** | `Math.floor(15 * multiplier)` -- e.g., Short=10, Medium=15, Long=22, Eternal=30 |
| **Word Count** | Short: 2800-4200, Medium: 4000-6000, Long: 6000-9000, Eternal: 8000-12000 |

### 2.3 Mad Libs Story Generation

| Aspect | Detail |
|--------|--------|
| **System Instruction** | "You are a Mad Libs Generator and Comedian. Your goal is to create a hilarious, chaotic, and nonsensical story using provided keywords." |
| **Rules** | Silly, unexpected, high-energy. Maximum usage of provided random words. |
| **User Prompt Fields** | `madlibs.adjective`, `madlibs.place`, `madlibs.food`, `madlibs.animal`, `madlibs.sillyWord` |
| **Interactivity** | 3 choices per part (same as classic) |

### 2.4 Story Length Options

| Length | Classic Config | Sleep Config | Approx. Duration |
|--------|---------------|--------------|-------------------|
| **Short** | ~400 words, 3-4 parts | ~2800-4200 words, 10 parts | ~3 mins |
| **Medium** | ~1200 words, 5-7 parts | ~4000-6000 words, 15 parts | ~8 mins |
| **Long** | ~2500 words, 8-10 parts | ~6000-9000 words, 22 parts | ~15 mins |
| **Eternal** | ~4500 words, 15-18 parts | ~8000-12000 words, 30 parts | ~25 mins |

---

## 3. AI Image Generation

### 3.1 Avatar Generation

| Aspect | Detail |
|--------|--------|
| **Component** | `AIClient.generateAvatar()`, `api/generate-avatar.ts` |
| **AI Model** | `gemini-2.5-flash-image` |
| **Prompt Template** | "A professional children's book illustration portrait of {heroName} who has the power of {heroPower}. High-contrast, friendly, vibrant style. Close-up on the hero's face." |
| **Trigger** | Click CREATE HERO or REPAINT button on the avatar circle |
| **Validation** | Hero name must be non-empty; must be online |
| **Output** | Base64 data URI (`data:{mimeType};base64,{data}`) displayed in avatar circle |
| **Retry** | 2 retries with exponential backoff |
| **Loading State** | Spinner inside avatar circle with "Painting..." label |
| **Sound Effect** | Sparkle sound on success (`soundManager.playSparkle()`) |

### 3.2 Scene Illustration Generation

| Aspect | Detail |
|--------|--------|
| **Component** | `AIClient.generateSceneIllustration()`, `api/generate-scene.ts` |
| **AI Model** | `gemini-2.5-flash-image` |
| **Prompt Template** | "Vibrant children's storybook scene: {partText (first 400 chars)}. Featuring: {heroName} with {heroPower}. Whimsical, magical atmosphere." |
| **Trigger** | `onGenerateScene` / `onGenerateSceneIndex` callbacks in ReadingView |
| **Output** | Base64 data URI stored in `scenes` record keyed by part index |
| **Persistence** | Saved to IndexedDB via `storageManager.saveStoryScene()` |
| **Display** | Shown in the avatar/scene image area at top of reading view |

---

## 4. Text-to-Speech (Narration)

### 4.1 Narration Generation and Playback

| Aspect | Detail |
|--------|--------|
| **Manager** | `NarrationManager` singleton (`NarrationManager.ts`) |
| **API Model** | `gemini-2.5-flash-preview-tts` via `api/generate-narration.ts` |
| **Audio Format** | Raw 16-bit PCM at 24000Hz, Mono channel |
| **Decoding** | Manual Base64 to Uint8Array to Int16Array to AudioBuffer (no native `decodeAudioData`) |
| **Playback** | Web Audio API: `AudioBufferSourceNode` -> `GainNode` -> `AudioContext.destination` |
| **Last Part Enhancement** | Appends lesson, joke, and tomorrowHook text to the final part's narration |

### 4.2 Playback Controls

| Control | Action | Implementation |
|---------|--------|----------------|
| **Play** | Start narration from beginning | `narrationManager.fetchNarration(text, voice, true)` |
| **Pause** | Pause at current position, track offset | `narrationManager.pause()` -- stores `pausedAt` in seconds |
| **Resume** | Resume from paused position | `narrationManager.play()` -- starts from `pausedAt` offset |
| **Stop** | Full stop, reset position to 0 | `narrationManager.stop()` -- clears source node, resets offsets |
| **Toggle** | Smart play/pause/start | If paused: resume. If playing: pause. If stopped: fetch & play. |

### 4.3 Speed Control

| Speed | Button Label | Effect |
|-------|-------------|--------|
| 0.8x | `0.8x` | Slower narration; `source.playbackRate.value = 0.8` |
| 1.0x | `1.0x` | Normal speed (default) |
| 1.2x | `1.2x` | Faster narration; `source.playbackRate.value = 1.2` |

Speed changes mid-playback correctly recalculate the `startTime` offset to maintain position.

### 4.4 Voice Selection

| Voice ID | Icon | Label | Suggested Tone |
|----------|------|-------|----------------|
| `Kore` | flower | Soothing | Default; gentle female voice |
| `Aoede` | bird | Melodic | Musical quality |
| `Zephyr` | leaf | Gentle (Soft) | Whisper-like |
| `Leda` | sparkle | Ethereal (Soft) | Dreamy quality |
| `Puck` | fox | Playful | Energetic, child-friendly |
| `Charon` | bear | Deep | Low, resonant |
| `Fenrir` | wolf | Bold | Strong, commanding |

### 4.5 Auto-Preloading

When narration starts for any part except the last, the next part's audio is fetched with `autoPlay = false` and cached in both memory (`Map<string, AudioBuffer>`) and IndexedDB. This ensures seamless transitions, especially in sleep mode auto-advance.

---

## 5. Ambient Audio (Procedural Soundscapes)

All soundscapes are procedurally generated using the Web Audio API -- no audio file downloads required.

### 5.1 Soundscape Inventory

| Theme ID | Name | Icon | Technique | Description |
|----------|------|------|-----------|-------------|
| `space` | Cosmic Hum | satellite | Brown noise (lowpass 80Hz) + 2 detuned sine drones (55Hz / 55.5Hz) with LFO filter modulation + stereo panning | Deep space rumble with binaural beating |
| `rain` | Gentle Rain | rain cloud | Pink noise (lowpass 1200Hz) + white noise (bandpass 2500Hz) patter layer with LFO amplitude modulation + stereo panning | Gentle rainfall with patter variations |
| `forest` | Forest Night | tree | Pink noise wind (lowpass 400Hz, LFO-modulated) + pink noise leaves (highpass 2500Hz, LFO-modulated) + stereo panning | Wind gusts with rustling leaves |
| `magic` | Ethereal Spark | sparkles | White noise through narrow bandpass (Q=20, center 2000Hz) with LFO sweeping center frequency across 1000Hz range | Shimmering, crystalline texture |
| `ocean` | Midnight Ocean | wave | Brown noise waves (lowpass 350Hz, LFO volume) + pink noise spray (highpass 2000Hz, synced LFO volume) + stereo panning | Rolling deep waves with foam crests |
| `crickets` | Night Crickets | cricket | Pink noise base (lowpass 600Hz) + sine oscillator (4500Hz) with square-wave amplitude modulation (25Hz chirp rate) + rhythmic sine LFO (0.4Hz) | Ambient night with rhythmic cricket chirps |

### 5.2 Soundscape Behavior

- **Fade In**: Linear ramp to volume 0.08 over 4 seconds
- **Fade Out**: Exponential ramp to 0.0001 over 2 seconds, then nodes stopped after 2.1s
- **Switching**: Previous soundscape fades out before new one starts
- **Silence Option**: `auto` theme stops all ambient audio
- **Mute Integration**: Ambient gain node ramped to 0 when muted, back to 0.06 when unmuted

### 5.3 UI Sound Effects

| Sound | Method | Trigger | Audio Profile |
|-------|--------|---------|---------------|
| **Choice Click** | `playChoice()` | Button clicks, mode changes, settings changes | Sine 440Hz->880Hz sweep, 0.1s, volume 0.3 |
| **Page Turn** | `playPageTurn()` | Story start, load from history, part advance | Triangle 150Hz->300Hz sweep, 0.3s, volume 0.1 |
| **Sparkle** | `playSparkle()` | Avatar generated, image uploaded, settings saved | 4-note arpeggio (C5-E5-G5-C6), 0.4s each, staggered 0.1s |
| **Delete** | `playDelete()` | Story deleted from Memory Jar, settings reset | Sawtooth 150Hz->50Hz descend, 0.2s, volume 0.2 |

---

## 6. Story Interaction

### 6.1 Choice Selection (Classic & Mad Libs Modes)

| Aspect | Detail |
|--------|--------|
| **Component** | `ReadingView.tsx` |
| **Display** | 1-3 choice buttons in a responsive grid (1 col mobile, 2 col desktop) at the bottom of the current part |
| **Condition** | Only visible when `part.choices` exists, has length > 0, and mode is NOT sleep |
| **On Click** | `soundManager.playChoice()` -> stop narration -> advance `currentPartIndex` -> `playPageTurn()` -> if was narrating, auto-restart narration after 1.2s delay |
| **Styling** | Comic-book styled blue buttons with black border and offset shadow |

### 6.2 Part-by-Part Navigation

| Aspect | Detail |
|--------|--------|
| **Progress Display** | "Journey Segment X / Y" label + animated progress bar in the control hub |
| **Visibility** | Future parts rendered with `opacity-10 grayscale blur-[2px] pointer-events-none` |
| **Current Part** | Full opacity, interactive, with `whileInView` entrance animation |
| **Scroll Behavior** | Parts animate in with `initial={{ opacity: 0, y: 40 }}` on viewport intersection |

### 6.3 Auto-Advance (Sleep Mode)

| Step | Timing | Action |
|------|--------|--------|
| 1 | Narration ends | `narrationManager.onEnded` fires |
| 2 | +500ms | `currentPartIndex` increments |
| 3 | +100ms | `playNarration()` auto-triggered via effect watching `currentPartIndex` |
| 4 | Immediate | Pre-loaded audio starts instantly from cache |

### 6.4 SyncedText Narration Highlighting

| Aspect | Detail |
|--------|--------|
| **Component** | `SyncedText.tsx` (memoized) |
| **Algorithm** | Character-proportional timing: word start/end times derived from `(charOffset / totalChars) * duration` |
| **Sentence Level** | Active sentence gets `bg-yellow-100/30` highlight and slightly darker text (`#1e3a8a`) |
| **Word Level** | Active word turns blue (`#2563eb`), bold, `scale(1.05)`, with blue text shadow glow |
| **Inactive** | Non-active sentences dimmed to `opacity: 0.7` |
| **Sync Source** | `useNarrationSync` hook polls `narrationManager.getCurrentTime()` via `requestAnimationFrame` loop |

---

## 7. Persistence Features

### 7.1 Memory Jar (Story Archive)

| Operation | Method | Storage | UI Element |
|-----------|--------|---------|------------|
| **Save Story** | `storageManager.saveStory()` | IndexedDB `stories` store with `crypto.randomUUID()` key | Automatic on story generation |
| **Load Story** | `storageManager.getAllStories()` | Sorted by `timestamp` descending (newest first) | Story cards in Memory Jar drawer |
| **Delete Story** | `storageManager.deleteStory(id)` | Removes by ID from IndexedDB | Trash button on story card |
| **Save Scene** | `storageManager.saveStoryScene()` | Adds base64 image to story record's `scenes` map | Automatic on scene generation |
| **Submit Feedback** | `storageManager.updateFeedback()` | Appends `{rating, text, timestamp}` to story record | `onSubmitFeedback` callback |
| **Download** | `handleDownload()` | Creates `Blob` -> `URL.createObjectURL()` -> triggers `<a>` click | Save button on story card |
| **Share** | `handleShare()` | `navigator.share()` with fallback to `navigator.clipboard.writeText()` | Share button on story card |

### 7.2 Story Card Display

Each card in Memory Jar shows:
- Avatar thumbnail (or book emoji fallback)
- Story title (truncated to 2 lines)
- Creation date
- Part count
- "Offline Ready" badge
- Action bar: Save (download JSON), Share, Delete

### 7.3 User Preferences Persistence

| Preference | Type | Default | Stored Key |
|------------|------|---------|------------|
| `narratorVoice` | enum (7 values) | `'Kore'` | IndexedDB `preferences` store, key `'user_settings'` |
| `storyLength` | `'short' \| 'medium' \| 'long' \| 'eternal'` | `'medium'` | same |
| `sleepTheme` | string | `'Cloud Kingdom'` | same |
| `fontSize` | `'normal' \| 'large'` | `'normal'` | same |
| `isMuted` | boolean | `false` | same |
| `reducedMotion` | boolean | `false` | same |

Preferences are loaded on app startup (`useEffect` in `useStoryEngine`) and applied to the session. Changes are persisted immediately on save.

### 7.4 Audio Caching (Offline Playback)

| Layer | Storage | Key Format | Behavior |
|-------|---------|-----------|----------|
| **Memory Cache** | `Map<string, AudioBuffer>` in `NarrationManager` | `v1:{voiceName}:{text first 30 chars}_{text length}` | Instant playback within session |
| **Persistent Cache** | IndexedDB `audio` store | Same key format | Survives page reload; enables offline narration playback |
| **Lookup Order** | 1. Memory Map -> 2. IndexedDB -> 3. API fetch | -- | Falls back gracefully through layers |

---

## 8. PWA Features

### 8.1 Service Worker Configuration

| Aspect | Detail |
|--------|--------|
| **Plugin** | `vite-plugin-pwa` with `VitePWA` config in `vite.config.ts` |
| **Register Type** | `autoUpdate` -- service worker updates automatically without user prompt |
| **Precache Pattern** | `**/*.{js,css,html,ico,png,svg,woff2}` |
| **Navigate Fallback** | `/index.html` (SPA routing support) |
| **Runtime Caching** | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) with `CacheFirst` strategy, 365-day expiration, max 10 entries |
| **Manifest** | Set to `false` -- using existing metadata configuration |

### 8.2 Offline Capabilities

| Feature | Offline Support | Mechanism |
|---------|----------------|-----------|
| App shell (HTML/CSS/JS) | Yes | Service worker precache |
| Read saved stories | Yes | IndexedDB `stories` store |
| Play cached narration | Yes | IndexedDB `audio` store |
| Generate new stories | No | Requires Gemini API |
| Generate images | No | Requires Gemini API |
| Generate narration (new) | No | Requires Gemini API |

### 8.3 Online/Offline Detection

| Aspect | Detail |
|--------|--------|
| **Detection** | `navigator.onLine` + `window.addEventListener('online'/'offline')` |
| **State** | `isOnline` boolean in `useStoryEngine` |
| **UI Indication** | Yellow banner: "OFFLINE MODE: Reading from Memory Jar only." |
| **Feature Gating** | Story generation, avatar generation, scene generation buttons disabled when offline |

---

## 9. UI Interactions -- Complete Element Inventory

### 9.1 Buttons

| Button | Location | Action | Disabled When |
|--------|----------|--------|---------------|
| Memory Jar (jar emoji) | Setup top-right | Opens Memory Jar drawer | Never |
| Settings (gear emoji) | Setup top-right | Opens Settings modal | Never |
| Mode tabs (Classic/Mad Libs/Sleepy) | HeroHeader floating dock | Switches `input.mode` | Never |
| CREATE HERO / REPAINT | Avatar circle overlay | Generates AI avatar | Offline |
| Wizard Back (arrow left) | ClassicSetup wizard footer | Goes to previous wizard step | On first step |
| Wizard Next / Finish | ClassicSetup wizard footer | Advances wizard step | Never |
| Adjust Origin Story | ClassicSetup step 2 | Returns to wizard step 0 | Never |
| Length step buttons (Short/Medium/Long/Eternal) | LengthSlider | Changes `storyLength` | Never |
| Voice cards (7 options) | VoiceSelector | Changes `narratorVoice` | Never |
| ENGAGE MISSION / BEGIN DREAM-LOG | Setup main CTA | Starts story generation | Not ready, loading, or offline |
| Sub-mode toggle (Dream Pick / Parent's Path) | SleepSetup | Switches sleep sub-mode | Never |
| Theme cards (5 dreamscapes) | SleepSetup grid | Sets `sleepConfig.theme` | Never |
| Ambient sound buttons (6 + Silence) | SleepSetup bottom | Sets `sleepConfig.ambientTheme` and starts/stops ambient audio | Never |
| Sensory suggestion chips | SleepSetup/SensoryInputCard | Auto-fills sensory input field | Never |
| Sensory clear button (X) | SensoryInputCard | Clears input field | When field is empty |
| Mad Libs suggestion chips | MadlibsSetup/MadLibField dropdown | Auto-fills Mad Lib field | Never |
| Menu | ReadingView top-left | Resets to setup phase | Never |
| Font size toggle (A / A+) | ReadingView top-right | Toggles `fontSize` between normal/large | Never |
| Mute toggle (speaker emoji) | ReadingView top-right | Toggles `isMuted` | Never |
| Play/Pause | ReadingView control hub | Toggles narration playback | During narration loading |
| Stop | ReadingView control hub | Stops narration completely | Never |
| Speed buttons (0.8x/1.0x/1.2x) | ReadingView control hub | Sets playback rate | Never |
| Choice buttons (up to 3) | ReadingView story part | Selects choice, advances story | Never (only shown when applicable) |
| MISSION COMPLETE | ReadingView story end footer | Resets to setup phase | Never |
| Open story | Memory Jar story card | Loads saved story into reading view | Never |
| Save (download) | Memory Jar story action bar | Downloads story as JSON | Never |
| Share | Memory Jar story action bar | Shares via Web Share API or clipboard | Never |
| Delete (trash) | Memory Jar story action bar | Deletes story from IndexedDB | Never |
| Close Memory Jar (X) | Memory Jar header | Closes drawer | Never |
| Settings tab buttons (General/Voice & Audio/Accessibility) | SettingsModal sidebar | Switches settings tab | Never |
| Story length buttons (in Settings) | SettingsModal General tab | Sets default story length preference | Never |
| Dreamscape dropdown | SettingsModal General tab | Sets default sleep theme preference | Never |
| Sound mute toggle | SettingsModal Voice tab | Toggles `isMuted` preference | Never |
| Voice cards (in Settings) | SettingsModal Voice tab | Sets default narrator voice preference | Never |
| Font size buttons (Normal/Large) | SettingsModal Accessibility tab | Sets `fontSize` preference | Never |
| Reduced Motion toggle | SettingsModal Accessibility tab | Toggles `reducedMotion` preference | Never |
| Reset Defaults | SettingsModal footer | Resets all preferences to defaults | Never |
| Save As Default | SettingsModal footer | Persists preferences to IndexedDB and closes modal | Never |
| Close Settings (X) | SettingsModal header | Closes modal without saving | Never |
| Error Dismiss | Setup error banner | Clears error state | Never |
| Try Again | ErrorBoundary fallback | Resets error boundary state | Never |
| Unlock The Multiverse | ApiKeyDialog | Dismisses API key dialog | Never |

### 9.2 Input Fields

| Field | Component | Validation | Behavior |
|-------|-----------|-----------|----------|
| Hero Name (classic) | `ClassicSetup.tsx` | Required (non-empty) for launch readiness | Auto-focused; underline style; 3xl-5xl font |
| Setting (classic) | `ClassicSetup.tsx` | Required (non-empty) for launch readiness | Auto-focused; underline style |
| Hero Name (sleep) | `SleepSetup.tsx` | Required (non-empty) for launch readiness | Centered serif font; gradient underline on focus |
| Adjective (madlibs) | `MadlibsSetup.tsx` / `MadLibField` | Required; red pulsing border when empty | Inline; suggestion dropdown on focus |
| Place (madlibs) | `MadlibsSetup.tsx` / `MadLibField` | Required; red pulsing border when empty | Inline; suggestion dropdown on focus |
| Food (madlibs) | `MadlibsSetup.tsx` / `MadLibField` | Required; red pulsing border when empty | Inline; suggestion dropdown on focus |
| Silly Word (madlibs) | `MadlibsSetup.tsx` / `MadLibField` | Required; red pulsing border when empty | Inline; suggestion dropdown on focus |
| Animal (madlibs) | `MadlibsSetup.tsx` / `MadLibField` | Required; red pulsing border when empty | Inline; suggestion dropdown on focus |
| World Texture (sleep) | `SensoryInputCard` | Optional | Dark-themed input with suggestion chips |
| Gentle Echoes (sleep) | `SensoryInputCard` | Optional | Dark-themed input with suggestion chips |
| Dream Aromas (sleep) | `SensoryInputCard` | Optional | Dark-themed input with suggestion chips |
| Dreamscape dropdown (settings) | `SettingsModal.tsx` | N/A (select element) | 5 options: Cloud Kingdom, Starry Space, Magic Forest, Deep Ocean, Moonlight Meadow |
| Image file upload | `HeroHeader.tsx` | Accepts `image/*` | Hidden `<input type="file">`; triggered by logo click |

### 9.3 Modals and Dialogs

| Modal | Component | Trigger | Close Method |
|-------|-----------|---------|-------------|
| Settings Modal | `SettingsModal.tsx` | Gear button click | X button or save button |
| Memory Jar Drawer | `MemoryJar.tsx` | Jar button click | X button or backdrop click |
| API Key Dialog | `ApiKeyDialog.tsx` | 404 API error | "Unlock The Multiverse" button |
| Mad Lib Suggestions Dropdown | `MadLibField` in `SetupShared.tsx` | Input focus | Input blur (200ms delay) or suggestion click |

### 9.4 Toggles and Switches

| Toggle | Component | Visual |
|--------|-----------|--------|
| Mute/Unmute (reading view) | `ReadingView.tsx` | Emoji swap: muted/speaker |
| Mute/Unmute (settings) | `SettingsModal.tsx` | Pill button: "MUTED" (red) / "ACTIVE" (green) |
| Reduced Motion | `SettingsModal.tsx` | Sliding circle toggle (custom, not native `<input type="checkbox">`) |
| Font Size (reading view) | `ReadingView.tsx` | Button label swap: "A" / "A+" |
| Font Size (settings) | `SettingsModal.tsx` | Two card buttons: Normal (Aa small) / Large (Aa big) |
| Sleep Sub-Mode | `SleepSetup.tsx` | Animated pill toggle with `layoutId` shared animation |

---

## 10. Accessibility Features

### 10.1 Keyboard Navigation

| Element | Support |
|---------|---------|
| All buttons | Focusable by default (`<button>` elements) |
| Voice Selector | `role="radiogroup"` with `role="radio"` and `aria-checked` on each voice button |
| Playback Speed | `role="group"` with `aria-pressed` on each speed button |
| Dreamscape Themes | `aria-pressed` on each theme button |
| Length Steps | `aria-pressed` on each step with descriptive `aria-label` including duration estimate |
| Focus Indicators | `outline-none ring-blue-500 focus:ring-2` on reading view buttons; `focus:ring-4 focus:ring-indigo-500/50` on theme buttons |

### 10.2 Screen Reader Support

| Feature | Implementation |
|---------|---------------|
| Main landmark | `role="main"` on both Setup and ReadingView |
| Story title announcement | `aria-label="Reading story: {title}"` on ReadingView main |
| Playback button state | `aria-label` toggles between "Pause" and "Play" |
| Stop button | `aria-label="Stop Playback"` |
| Mute button | `aria-label` toggles between "Unmute" and "Mute" |
| Memory Jar dialog | `role="dialog"`, `aria-modal="true"`, `aria-label="Memory Jar - Saved Stories"` |
| Story cards | `aria-label="Open story {title}"` on load button; `aria-label="Delete {title}"` on delete |
| Avatar generation | `aria-label="Generate new avatar"` |
| Back to home | `aria-label="Back to home"` on Menu button |
| Font size | `aria-label="Adjust font size"` |
| Story decisions | `aria-label="Story Decisions"` on choice navigation |
| Input fields | `aria-label` on all text inputs (e.g., "Hero Name", "Story Setting", "Enter a {label}") |
| Backdrop | `aria-hidden="true"` on Memory Jar backdrop overlay |

### 10.3 Reduced Motion

| Aspect | Detail |
|--------|--------|
| **Setting** | Toggle in Settings > Accessibility > Reduced Motion |
| **Persistence** | Saved to `userPreferences.reducedMotion` in IndexedDB |
| **Effect** | `document.documentElement.style.scrollBehavior` set to `'auto'` (instead of `'smooth'`) |
| **Scope** | Primarily affects scroll behavior; Framer Motion animations are not conditionally disabled in current implementation |

### 10.4 Font Scaling

| Size | Reading View Classes | Toggle |
|------|---------------------|--------|
| Normal | `text-base md:text-xl lg:text-2xl` | Button in reading header or Settings modal |
| Large | `text-xl md:text-3xl lg:text-4xl` | Same |

Responsive breakpoints ensure readability across all device sizes.

### 10.5 Color Contrast and Visual Design

| Mode | Background | Text | Contrast Notes |
|------|-----------|------|---------------|
| Classic (Setup) | White (`bg-white`) | Black (`text-black`) | High contrast |
| Classic (Reading) | Warm parchment (`bg-[#fcf8ef]`) | Dark gray (`text-gray-800`) | Readable warm tone |
| Sleep (Setup) | Deep indigo (`bg-indigo-950`) | Light indigo (`text-indigo-50`) | Dark mode optimized |
| Sleep (Reading) | Deep indigo (`bg-indigo-950`) | Soft indigo (`text-indigo-100/90`) | Low stimulation for bedtime |
| Error states | Red background (`bg-red-500`) | White text | High visibility |
| Offline banner | Amber background (`bg-amber-500`) | Black text | High visibility |

---

## 11. API Architecture

### 11.1 Server-Side API Routes (Vercel Serverless Functions)

| Endpoint | File | Model | Purpose |
|----------|------|-------|---------|
| `POST /api/generate-story` | `api/generate-story.ts` | `gemini-3-pro-preview` | Story text generation with structured JSON schema |
| `POST /api/generate-avatar` | `api/generate-avatar.ts` | `gemini-2.5-flash-image` | Hero portrait image generation |
| `POST /api/generate-scene` | `api/generate-scene.ts` | `gemini-2.5-flash-image` | Scene illustration generation |
| `POST /api/generate-narration` | `api/generate-narration.ts` | `gemini-2.5-flash-preview-tts` | Text-to-speech audio generation |

All routes:
- Accept only POST requests (405 on other methods)
- Read `GEMINI_API_KEY` from `process.env` (500 if missing)
- Use `@google/genai` SDK
- Return structured JSON responses
- Pass errors through with status codes

### 11.2 Client-Side AI Client

| Method | Retry Count | Backoff | Skips Retry On |
|--------|-------------|---------|---------------|
| `streamStory()` | 3 | 1s, 2s, 4s exponential | 4xx errors (except 429) |
| `generateAvatar()` | 2 | 1s, 2s exponential | 4xx errors (except 429) |
| `generateSceneIllustration()` | 2 | 1s, 2s exponential | 4xx errors (except 429) |

---

## 12. Data Flow Summary

### 12.1 IndexedDB Schema

| Store Name | Key Path | Description |
|------------|----------|-------------|
| `stories` | `id` (UUID) | Full story records with `{id, timestamp, story, avatar, scenes, feedback}` |
| `audio` | Manual key | TTS audio `ArrayBuffer` keyed by `v1:{voice}:{textSnippet}_{length}` |
| `preferences` | Manual key | Single record at key `'user_settings'` with `UserPreferences` object |

Database version: **4** (`DB_VERSION`).

### 12.2 State Management

All application state is managed through the `useStoryEngine` custom hook, which serves as the central state store. It manages:
- App phase (`'setup'` | `'reading'`)
- Story data and current part index
- Loading states for story, avatar, scene, and narration
- Online/offline status
- History (cached stories)
- User preferences
- Error state

The `useNarrationSync` hook bridges the imperative `NarrationManager` singleton with React's declarative model using `requestAnimationFrame` polling.

### 12.3 Logging

The `Logger` utility (`lib/Logger.ts`) provides timestamped console logging at three levels:
- `logger.info(msg, data?)` -- general information
- `logger.warn(msg, data?)` -- warnings
- `logger.error(msg, err)` -- error conditions

Used for avatar generation failures, story generation failures, and scene generation failures.
