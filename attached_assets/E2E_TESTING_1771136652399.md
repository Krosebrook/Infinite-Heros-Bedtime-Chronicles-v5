# E2E Testing Specification - Infinity Heroes: Bedtime Chronicles

## Testing Stack Recommendation

- **Framework**: Playwright (best Vercel integration, cross-browser)
- **Assertions**: Playwright built-in `expect`
- **API Mocking**: Playwright `page.route()` to intercept `/api/*` calls
- **Visual Regression**: Playwright screenshots + `toHaveScreenshot()`

---

## Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000, // AI generation can be slow
  retries: 1,
  use: {
    baseURL: 'http://localhost:4173', // vite preview
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 720 } } },
  ],
});
```

### API Mock Setup (Required for all tests)

All tests MUST mock the API routes to avoid real Gemini API calls and ensure deterministic results.

```typescript
// tests/fixtures/mocks.ts
export const MOCK_STORY: StoryFull = {
  title: "The Quest of Brave Luna",
  parts: [
    { text: "Luna stood at the edge of the enchanted forest...", choices: ["Enter the forest", "Follow the river", "Climb the mountain"], partIndex: 0 },
    { text: "The path revealed a hidden waterfall...", choices: ["Swim across", "Build a bridge"], partIndex: 1 },
    { text: "Luna saved the day and returned home a hero.", choices: [], partIndex: 2 }
  ],
  vocabWord: { word: "Courageous", definition: "Not deterred by danger" },
  joke: "Why did the hero bring a ladder? To reach new heights!",
  lesson: "True bravery means helping others even when you're scared.",
  tomorrowHook: "But little did Luna know, the forest had one more secret...",
  rewardBadge: { emoji: "🏅", title: "Forest Guardian", description: "Protected the enchanted creatures" }
};

export const MOCK_AVATAR_RESPONSE = {
  mimeType: "image/png",
  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
};

export const MOCK_NARRATION_RESPONSE = {
  audioData: "AAAA" // Minimal base64 PCM
};

export async function mockAllAPIs(page: Page) {
  await page.route('/api/generate-story', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: JSON.stringify(MOCK_STORY) }) })
  );
  await page.route('/api/generate-avatar', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AVATAR_RESPONSE) })
  );
  await page.route('/api/generate-scene', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_AVATAR_RESPONSE) })
  );
  await page.route('/api/generate-narration', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NARRATION_RESPONSE) })
  );
}
```

---

## Test Suites

### Suite 1: App Launch & Initial State

```
TEST: app-launch.spec.ts

TC-1.1: App renders without crash
  - Navigate to /
  - Expect: HeroHeader visible with "INFINITY HEROES" text
  - Expect: Mode dock visible with 3 tabs (Classic, Mad Libs, Sleepy)
  - Expect: Classic tab is active by default
  - Expect: No console errors

TC-1.2: Classic mode is default
  - Expect: Hero name input visible with placeholder "Hero's name..."
  - Expect: Wizard prompt "Who is our hero today?" visible
  - Expect: Launch button shows "ENGAGE MISSION"
  - Expect: Launch button is DISABLED (no input yet)

TC-1.3: Utility bar is visible
  - Expect: Memory Jar button (🏺) in top-right
  - Expect: Settings button (⚙️) in top-right

TC-1.4: Offline banner hidden when online
  - Expect: No "OFFLINE MODE" banner visible
```

### Suite 2: Mode Switching

```
TEST: mode-switching.spec.ts

TC-2.1: Switch to Mad Libs mode
  - Click Mad Libs tab (🤪)
  - Expect: Background gradient changes to red/orange
  - Expect: Tagline changes to "Unleash The Chaos"
  - Expect: Mad lib sentence form appears with 5 inline fields
  - Expect: Launch button text remains "ENGAGE MISSION"

TC-2.2: Switch to Sleep mode
  - Click Sleepy tab (🌙)
  - Expect: Background gradient changes to deep indigo
  - Expect: Tagline changes to "Drift Into Dreams"
  - Expect: Star field animation appears in header
  - Expect: Hero name input appears with "The Sleepy Hero" label
  - Expect: Dreamscape theme grid appears (5 options)
  - Expect: Ambient sound picker appears
  - Expect: Launch button text changes to "BEGIN DREAM-LOG"

TC-2.3: Switch back to Classic
  - Click Classic tab (⚔️)
  - Expect: Wizard step 1 reappears
  - Expect: Previously entered data persists

TC-2.4: Mode dock has animated pill indicator
  - Switch between all 3 modes
  - Expect: layoutId="activeTab" pill smoothly transitions (spring animation)
```

### Suite 3: Classic Mode Setup Flow

```
TEST: classic-setup.spec.ts

TC-3.1: Wizard Step 1 - Hero Name
  - Type "Luna" into hero name input
  - Click "Next ➡"
  - Expect: Step 2 appears with "Where does the adventure begin?"

TC-3.2: Wizard Step 2 - Setting
  - Type "Enchanted Forest" into setting input
  - Click "Next ➡"
  - Expect: Step 3 appears with review summary
  - Expect: Shows "The Hero: Luna" and "The World: Enchanted Forest"

TC-3.3: Wizard Step 3 - Review & Avatar
  - Expect: Avatar display shows DefaultAvatar (🦸 emoji)
  - Expect: "CREATE HERO" button visible with bounce badge
  - Click "CREATE HERO"
  - Expect: Spinner shows "Painting..."
  - Expect: After API response, avatar image renders in circle

TC-3.4: Navigate back through wizard
  - Click back arrow from Step 3
  - Expect: Step 2 appears with "Enchanted Forest" still filled
  - Click back arrow from Step 2
  - Expect: Step 1 appears with "Luna" still filled
  - Expect: Back button disabled on Step 1

TC-3.5: Launch button enables when ready
  - Fill hero name + setting
  - Expect: Launch button changes from gray/disabled to red/active
  - Expect: Button has shadow-[10px_10px_0px_black] styling

TC-3.6: Empty fields keep button disabled
  - Clear hero name
  - Expect: Launch button returns to disabled state
```

### Suite 4: Mad Libs Setup Flow

```
TEST: madlibs-setup.spec.ts

TC-4.1: All 5 fields render with correct labels
  - Expect: Adjective, Place, Food, Animal, Silly Word fields visible
  - Expect: Each has placeholder text matching its label

TC-4.2: Suggestion dropdown appears on focus
  - Click Adjective field
  - Expect: Dropdown appears with "Ideas for Adjective" header
  - Expect: Suggestions: "brave", "tiny", "glowing", "invisible"
  - Click "brave"
  - Expect: Field fills with "brave"
  - Expect: Dropdown closes

TC-4.3: Validation styling
  - Leave all fields empty, blur
  - Expect: All empty fields have red border + animate-pulse class
  - Expect: "Required" tooltip appears on hover
  - Fill adjective field
  - Expect: That field changes to blue border (valid)

TC-4.4: Launch requires all 5 fields filled
  - Fill 4 of 5 fields
  - Expect: Launch button disabled
  - Fill last field
  - Expect: Launch button enabled

TC-4.5: Avatar uses animal name
  - Fill "Dragon" in Animal field
  - Click "CREATE HERO"
  - Expect: API called with heroName="Dragon"
```

### Suite 5: Sleep Mode Setup Flow

```
TEST: sleep-setup.spec.ts

TC-5.1: Dream Pick sub-mode (default child-friendly)
  - Expect: "Dream Pick" toggle is active
  - Expect: Large theme icon preview panel visible (left side)
  - Expect: Dreamscape grid visible (right side, 5 themes)

TC-5.2: Select dreamscape theme
  - Click "Magic Forest" (🍄)
  - Expect: Theme card gets indigo border + checkmark
  - Expect: Preview panel updates to show 🍄 icon + "Magic Forest" label
  - Expect: Description shows "Whispering trees and glowing flowers."

TC-5.3: Switch to Parent's Path sub-mode
  - Click "Parent's Path" toggle
  - Expect: Sensory input cards appear (texture, sound, scent)
  - Expect: Each card has icon, label, description, input, suggestion chips

TC-5.4: Sensory input with suggestions
  - Click "Soft velvet cloud" chip in texture section
  - Expect: Input fills with "Soft velvet cloud"
  - Expect: Chip becomes highlighted (indigo bg)
  - Click clear button (✕) in input
  - Expect: Input clears
  - Expect: Chip returns to default state

TC-5.5: Ambient sound selection
  - Click "Gentle Rain" (🌧️) button
  - Expect: Button becomes highlighted
  - Expect: Ambient audio begins playing (SoundManager.playAmbient)
  - Click "Silence" (🔇)
  - Expect: Audio stops

TC-5.6: Only hero name required for launch
  - Select a theme (no sensory inputs needed in Dream Pick mode)
  - Leave hero name empty
  - Expect: Launch button disabled
  - Type "Milo"
  - Expect: Launch button enabled with "BEGIN DREAM-LOG" text
```

### Suite 6: Voice & Length Selection

```
TEST: voice-length.spec.ts

TC-6.1: Voice selector renders 7 voices
  - Expect: 7 voice buttons visible
  - Expect: Kore (🌸 Soothing) is selected by default
  - Expect: Selected voice has border-black + shadow styling

TC-6.2: Select different voice
  - Click Puck (🦊 Playful)
  - Expect: Puck gets selected styling
  - Expect: Kore loses selected styling
  - Expect: ARIA role="radio" and aria-checked update correctly

TC-6.3: Length slider renders 4 options
  - Expect: 4 step buttons (⚡ Short, 📖 Medium, 📜 Long, ♾️ Eternal)
  - Expect: Medium is selected by default
  - Expect: Active track fills to selected position

TC-6.4: Select story length
  - Click "Long" (📜)
  - Expect: Track extends to 3rd position
  - Expect: Duration label shows "~15 mins"
  - Click "Short" (⚡)
  - Expect: Track shrinks to 1st position
  - Expect: Duration label shows "~3 mins"
```

### Suite 7: Story Generation & Loading

```
TEST: story-generation.spec.ts

TC-7.1: Loading overlay appears on launch
  - Fill classic mode inputs (name + setting)
  - Mock API with 2-second delay
  - Click "ENGAGE MISSION"
  - Expect: LoadingFX overlay appears
  - Expect: Title shows "LAUNCHING {NAME}..."
  - Expect: Progress bar animates from 0%
  - Expect: Status messages rotate (e.g., "Initializing Imagination Engines...")

TC-7.2: Loading overlay mode-specific theming
  - In sleep mode: Expect "WEAVING DREAMS..." title, indigo theme, no word particles
  - In madlibs mode: Expect "GENERATING CHAOS..." title, orange theme, chaotic particles

TC-7.3: Transition to Reading View on success
  - Wait for API mock response
  - Expect: LoadingFX fades out
  - Expect: Reading View renders with story title
  - Expect: First story part text visible

TC-7.4: Error handling on API failure
  - Mock API to return 500
  - Click launch
  - Expect: Error banner appears with "Transmission Interrupted!"
  - Expect: Error details shown in monospace text
  - Expect: Dismiss button present
  - Click dismiss
  - Expect: Error banner disappears

TC-7.5: Retry behavior
  - Mock API to fail twice then succeed
  - Click launch
  - Expect: Story eventually renders (AIClient retries with exponential backoff)
```

### Suite 8: Reading View

```
TEST: reading-view.spec.ts

TC-8.1: Story renders correctly
  - Generate story (mocked)
  - Expect: Story title displayed in header
  - Expect: Avatar image shown
  - Expect: First part text visible
  - Expect: Future parts are blurred/dimmed (opacity-10, blur-[2px])

TC-8.2: Choice navigation (classic mode)
  - Expect: 3 choice buttons visible at end of first part
  - Expect: Choices styled as comic buttons (blue bg, black border)
  - Click first choice
  - Expect: Next part becomes visible (opacity-100)
  - Expect: Previous choices disappear
  - Expect: New choices appear (if not last part)

TC-8.3: No choices in sleep mode
  - Generate sleep mode story
  - Expect: No choice buttons anywhere
  - Expect: All parts have empty choices arrays

TC-8.4: Story completion
  - Navigate to last part
  - Expect: "The Wise Hero's Lesson" section visible
  - Expect: Lesson text displayed
  - Expect: "A Chuckle for the Road" section with joke
  - Expect: "MISSION COMPLETE" button visible
  - Click "MISSION COMPLETE"
  - Expect: Returns to Setup phase

TC-8.5: Header controls
  - Expect: "Menu" button (top-left) -> returns to setup
  - Expect: Font size toggle (A/A+) -> toggles between normal/large text
  - Expect: Mute button (🔊/🔇) -> toggles audio

TC-8.6: Control Hub (bottom bar)
  - Expect: Progress indicator ("Journey Segment 1 / 3")
  - Expect: Progress bar fills proportionally
  - Expect: Play/Pause button (▶️/⏸️)
  - Expect: Stop button (⏹️)
  - Expect: Narrator voice label (e.g., "Kore Spirit")
  - Expect: Playback speed buttons (0.8x, 1.0x, 1.2x)
```

### Suite 9: Narration & Audio

```
TEST: narration.spec.ts

TC-9.1: Play narration
  - Click play button (▶️)
  - Expect: Button shows loading spinner (⏳) briefly
  - Expect: Button changes to pause (⏸️)
  - Expect: API call to /api/generate-narration with correct text and voice
  - Expect: Progress ring around play button animates

TC-9.2: Pause and resume
  - Start narration
  - Click pause (⏸️)
  - Expect: Button changes back to play (▶️)
  - Expect: Progress ring freezes
  - Click play again
  - Expect: Narration resumes from paused position (not restart)

TC-9.3: Stop narration
  - Start narration
  - Click stop (⏹️)
  - Expect: Narration stops completely
  - Expect: Progress resets to 0

TC-9.4: Playback speed
  - Click 1.2x speed button
  - Expect: 1.2x button gets active styling
  - Expect: Narration plays at 1.2x speed (NarrationManager.setRate)
  - Click 0.8x
  - Expect: Speed changes to 0.8x

TC-9.5: Sleep mode auto-advance
  - Generate sleep story, start narration
  - Wait for first part narration to end
  - Expect: currentPartIndex advances to 1 after ~500ms
  - Expect: Next part auto-plays without user interaction
  - Expect: Auto-scroll brings new part into view

TC-9.6: Synced text highlighting
  - Start narration on a part
  - Expect: Current sentence has yellow background highlight
  - Expect: Current word is blue, bold, slightly scaled up
  - Expect: Non-active sentences are slightly dimmed (opacity: 0.7)
  - Expect: Highlighting advances as audio plays
```

### Suite 10: Memory Jar

```
TEST: memory-jar.spec.ts

TC-10.1: Open and close drawer
  - Click 🏺 button
  - Expect: Backdrop appears (bg-black/80)
  - Expect: Drawer slides in from right
  - Expect: Title "Memory Jar" visible
  - Click backdrop OR close button
  - Expect: Drawer slides out

TC-10.2: Empty state
  - Clear IndexedDB before test
  - Open Memory Jar
  - Expect: "Your jar is currently empty..." message with 🌫️ icon

TC-10.3: Story cards render correctly
  - Generate and save a story first
  - Open Memory Jar
  - Expect: Story card with title, avatar, date, part count
  - Expect: "Offline Ready" badge visible
  - Expect: Action bar with Save, Share, Delete buttons

TC-10.4: Load story from history
  - Click on a story card
  - Expect: Drawer closes
  - Expect: App transitions to Reading View
  - Expect: Story content matches saved data
  - Expect: Saved scenes load (if any)

TC-10.5: Download story as JSON
  - Click "Save" (💾) on a story card
  - Expect: JSON file downloads with sanitized filename
  - Expect: File contains story data

TC-10.6: Delete story
  - Click delete (🗑️) on a story card
  - Expect: Story removed from list
  - Expect: IndexedDB entry deleted

TC-10.7: Share story
  - Click "Share" (🔗) on a story card
  - Expect: Web Share API called (if available) OR clipboard copy fallback
```

### Suite 11: Settings Modal

```
TEST: settings.spec.ts

TC-11.1: Open and navigate tabs
  - Click ⚙️ button
  - Expect: Modal opens with "Mission Control" header
  - Expect: General tab active by default
  - Click "Voice & Audio" tab
  - Expect: Voice settings appear
  - Click "Accessibility" tab
  - Expect: Accessibility settings appear

TC-11.2: Change story length default
  - In General tab, click "Long"
  - Click "Save As Default"
  - Expect: Green flash "Preferences Saved"
  - Expect: Modal closes
  - Expect: Length slider in setup now defaults to Long

TC-11.3: Change narrator voice default
  - In Voice tab, click Fenrir (🐺)
  - Save
  - Expect: Voice selector in setup now defaults to Fenrir

TC-11.4: Toggle mute
  - In Voice tab, click mute toggle
  - Expect: Label changes from "ACTIVE" to "MUTED"
  - Save
  - Expect: SoundManager muted globally

TC-11.5: Change font size
  - In Accessibility tab, click "Large"
  - Save
  - Expect: Reading view text uses larger font class

TC-11.6: Toggle reduced motion
  - In Accessibility tab, toggle reduced motion ON
  - Save
  - Expect: document.documentElement.style.scrollBehavior === 'auto'

TC-11.7: Reset defaults
  - Change multiple settings
  - Click "Reset Defaults"
  - Expect: All settings revert to DEFAULT_PREFERENCES values
  - Expect: Voice: Kore, Length: medium, Font: normal, Mute: off, Motion: off

TC-11.8: Settings persist across page reload
  - Change and save settings
  - Reload page
  - Expect: Settings loaded from IndexedDB match saved values
```

### Suite 12: Offline Behavior

```
TEST: offline.spec.ts

TC-12.1: Offline banner appears
  - Simulate offline: page.context().setOffline(true)
  - Expect: Yellow banner appears "OFFLINE MODE: Reading from Memory Jar only."

TC-12.2: Launch button disabled offline
  - Go offline
  - Fill all classic mode inputs
  - Expect: Launch button disabled (isOnline check)

TC-12.3: Avatar generation blocked offline
  - Go offline
  - Attempt to generate avatar
  - Expect: Error "You are offline. Connect to internet to generate avatar."

TC-12.4: Saved stories readable offline
  - Generate story while online, save to IndexedDB
  - Go offline
  - Open Memory Jar
  - Click saved story
  - Expect: Story loads and renders correctly
  - Expect: Cached audio plays if previously fetched

TC-12.5: Return to online
  - page.context().setOffline(false)
  - Expect: Offline banner disappears
  - Expect: Launch button re-enables
```

### Suite 13: Error Handling

```
TEST: error-handling.spec.ts

TC-13.1: Network error on story generation
  - Mock /api/generate-story to return network error
  - Launch story
  - Expect: Error banner with "Mission Failed: ..."
  - Expect: Loading overlay disappears
  - Expect: App remains on Setup phase (not stuck)

TC-13.2: Invalid JSON response
  - Mock API to return `{ text: "not valid json" }`
  - Launch story
  - Expect: Error about invalid story structure

TC-13.3: Missing parts array
  - Mock API to return `{ text: '{"title":"test"}' }` (no parts)
  - Launch story
  - Expect: Error "Invalid story structure: 'parts' array is missing or empty."

TC-13.4: 429 Rate Limited
  - Mock API to return 429, then 200
  - Launch story
  - Expect: AIClient retries after exponential backoff
  - Expect: Story eventually loads

TC-13.5: 4xx Client Error (non-429)
  - Mock API to return 400
  - Launch story
  - Expect: Error thrown immediately (no retry for client errors)

TC-13.6: ErrorBoundary catches render crash
  - Inject a component that throws during render
  - Expect: "POW! SPLAT!" error screen appears
  - Expect: Error message shown
  - Expect: "Try Again" button resets error state

TC-13.7: Error banner dismissal
  - Trigger an error
  - Click "Dismiss" on error banner
  - Expect: Error clears
  - Expect: User can retry operation
```

### Suite 14: Accessibility

```
TEST: accessibility.spec.ts

TC-14.1: Keyboard navigation through setup
  - Tab through all interactive elements
  - Expect: Focus visible on each (ring indicator)
  - Expect: Enter/Space activates buttons
  - Expect: Tab order follows visual layout

TC-14.2: Screen reader landmarks
  - Expect: main role on Setup and ReadingView
  - Expect: dialog role on MemoryJar and SettingsModal
  - Expect: radiogroup role on VoiceSelector
  - Expect: nav role on story choices

TC-14.3: ARIA states
  - Voice buttons: aria-checked matches selection
  - Length buttons: aria-pressed matches selection
  - Play button: aria-label updates ("Play" vs "Pause")
  - MemoryJar: aria-modal="true"

TC-14.4: Color contrast
  - Run axe-core accessibility audit
  - Expect: No critical contrast violations
  - Note: Sleep mode uses intentionally low contrast (indigo on dark) - may need exceptions

TC-14.5: Reduced motion respect
  - Enable reduced motion in settings
  - Expect: No parallax scrolling
  - Expect: Scroll behavior set to 'auto'
  - Note: Framer Motion animations still run (future improvement to check prefers-reduced-motion)
```

### Suite 15: Performance

```
TEST: performance.spec.ts

TC-15.1: Initial load time
  - Measure time to interactive
  - Expect: < 3 seconds on broadband connection
  - Expect: Setup and ReadingView are lazy loaded (code splitting)

TC-15.2: Memory Jar with many stories
  - Seed IndexedDB with 50 stories
  - Open Memory Jar
  - Expect: Drawer opens within 500ms
  - Expect: Smooth scrolling through list
  - Expect: No jank or memory warnings

TC-15.3: Loading FX particle performance
  - Open LoadingFX
  - Expect: Maintains 60fps with particle animations
  - Expect: Particle count limited (8 word particles, 60-100 bg particles)

TC-15.4: SyncedText with long text
  - Generate story with "eternal" length (~4500 words per part)
  - Start narration
  - Expect: Word highlighting remains smooth (requestAnimationFrame loop)
  - Expect: No visible lag in text updates
```

---

## Test Data Requirements

| Data | Source | Notes |
|------|--------|-------|
| Mock story JSON | `tests/fixtures/mocks.ts` | Must match `StoryFull` interface exactly |
| Mock avatar base64 | Minimal 1x1 PNG | Avoid large test fixtures |
| Mock audio base64 | Minimal PCM data | Just enough to not crash AudioContext |
| IndexedDB seeds | Programmatic via `page.evaluate()` | Use `storageManager` API |
| Offline simulation | `page.context().setOffline()` | Playwright built-in |
