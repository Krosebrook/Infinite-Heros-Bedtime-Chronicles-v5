# End-to-End Test Specifications

## Infinity Heroes: Bedtime Chronicles

**Document Version:** 1.0
**Date:** 2026-02-14
**Format:** BDD (Given/When/Then)
**Priority Scale:** P0 = Critical / P1 = High / P2 = Medium

---

## Table of Contents

1. [Test Suite: App Launch](#1-test-suite-app-launch)
2. [Test Suite: Classic Mode Setup](#2-test-suite-classic-mode-setup)
3. [Test Suite: Mad Libs Mode Setup](#3-test-suite-mad-libs-mode-setup)
4. [Test Suite: Sleep Mode Setup](#4-test-suite-sleep-mode-setup)
5. [Test Suite: Story Reading - Classic](#5-test-suite-story-reading---classic)
6. [Test Suite: Story Reading - Sleep](#6-test-suite-story-reading---sleep)
7. [Test Suite: Story Reading - Mad Libs](#7-test-suite-story-reading---mad-libs)
8. [Test Suite: Narration](#8-test-suite-narration)
9. [Test Suite: Memory Jar](#9-test-suite-memory-jar)
10. [Test Suite: Settings](#10-test-suite-settings)
11. [Test Suite: Error Handling](#11-test-suite-error-handling)
12. [Test Suite: Offline/PWA](#12-test-suite-offlinepwa)
13. [Test Suite: Responsive/Mobile](#13-test-suite-responsivemobile)
14. [Test Suite: Accessibility](#14-test-suite-accessibility)

---

## 1. Test Suite: App Launch

### TC-APP-001: First-time user experience (cold start)

**Priority:** P0
**Preconditions:** IndexedDB is empty (no prior visits). Browser is online. No `user_settings` key exists in the `preferences` object store.

**Given** a first-time user navigates to the application URL
**When** the application finishes loading (Suspense fallback resolves)
**Then** the following should occur:
  - The app renders the Setup phase (`phase === 'setup'`)
  - The HeroHeader component displays with "INFINITY HEROES" branding
  - The mode dock defaults to "Classic" mode (blue highlight, `activeMode === 'classic'`)
  - The tagline reads "Choose Your Destiny"
  - The classic wizard step 0 ("Who is our hero today?") is displayed with an autofocused input
  - The `heroName` input field is empty
  - The `setting` input field is empty (accessible on wizard step 1)
  - The VoiceSelector shows "Kore" (Soothing) as the default selected voice
  - The LengthSlider shows "Medium" (~8 mins) as the default selected length
  - The "ENGAGE MISSION" button is disabled (grayed out, `bg-slate-200 text-slate-400 cursor-not-allowed`)
  - The Memory Jar button (jar icon) is visible in the top-right corner
  - The Settings button (gear icon) is visible in the top-right corner
  - No offline banner is shown
  - No error banner is displayed
  - No `ApiKeyDialog` overlay is shown

**Data Assertions:**
  - `userPreferences` equals `DEFAULT_PREFERENCES`: `{ narratorVoice: 'Kore', storyLength: 'medium', sleepTheme: 'Cloud Kingdom', fontSize: 'normal', isMuted: false, reducedMotion: false }`
  - `input.mode === 'classic'`
  - `history` array is empty (`[]`)
  - `phase === 'setup'`

---

### TC-APP-002: Returning user with saved preferences

**Priority:** P0
**Preconditions:** IndexedDB `preferences` store contains a `user_settings` record with `{ narratorVoice: 'Puck', storyLength: 'long', sleepTheme: 'Starry Space', fontSize: 'large', isMuted: true, reducedMotion: true }`. IndexedDB `stories` store contains 2 previously saved stories.

**Given** a returning user navigates to the application
**When** the `useStoryEngine` hook runs `initData()` on mount
**Then** the following should occur:
  - The VoiceSelector defaults to "Puck" (Playful)
  - The LengthSlider defaults to "Long" (~15 mins)
  - `userPreferences.isMuted` is `true`
  - `userPreferences.reducedMotion` is `true`
  - `document.documentElement.style.scrollBehavior` is set to `'auto'` (reduced motion active)
  - The `history` state contains 2 `CachedStory` entries, sorted by `timestamp` descending
  - `input.narratorVoice === 'Puck'`
  - `input.storyLength === 'long'`
  - `input.sleepConfig.theme === 'Starry Space'`

**Data Assertions:**
  - `storageManager.getPreferences()` resolves with the stored preferences
  - `storageManager.getAllStories()` resolves with 2 stories

---

### TC-APP-003: Offline launch with cached data

**Priority:** P1
**Preconditions:** Browser is offline (`navigator.onLine === false`). IndexedDB contains 1 saved story and saved preferences.

**Given** the user opens the app while offline
**When** the app finishes loading
**Then** the following should occur:
  - The offline banner appears at the top: "OFFLINE MODE: Reading from Memory Jar only."
  - The offline banner is styled with `bg-amber-500 text-black` and is fixed at the top with `z-[500]`
  - The offline banner animates in from `y: -50` to `y: 0`
  - Saved preferences are loaded from IndexedDB
  - The "ENGAGE MISSION" button is disabled (the `!isOnline` condition prevents it)
  - Opening the Memory Jar shows the 1 cached story with "Offline Ready" badge visible
  - The user can load the cached story for reading

**Data Assertions:**
  - `isOnline === false`
  - Launch button `disabled` attribute is `true`

---

### TC-APP-004: PWA installed launch

**Priority:** P2
**Preconditions:** The app has been installed as a PWA. Service worker is registered and active. App is launched from the home screen.

**Given** the user launches the PWA from their device home screen
**When** the app loads via the service worker
**Then** the following should occur:
  - The app renders in standalone mode (no browser chrome)
  - The `min-h-screen bg-slate-950` full-screen layout fills the viewport
  - Cached assets (fonts, images, scripts) load from the service worker cache
  - IndexedDB preferences and stories are accessible
  - If online, full functionality is available
  - If offline, the offline banner appears and generation is disabled

---

## 2. Test Suite: Classic Mode Setup

### TC-CLS-001: Fill all fields and generate story

**Priority:** P0
**Preconditions:** App is on setup phase, classic mode selected, browser online.

**Given** the user is on the Classic Setup wizard step 0
**When** the user types "Captain Brave" into the hero name field
**And** clicks the "Next" button to advance to wizard step 1
**And** types "Enchanted Forest" into the setting field
**And** clicks "Next" to advance to wizard step 2 (Mission Parameters summary)
**And** the summary displays "The Hero: Captain Brave" and "The World: Enchanted Forest"
**And** the "ENGAGE MISSION" button becomes enabled (red, with shadow)
**And** the user clicks "ENGAGE MISSION"
**Then** the following should occur:
  - `isLoading` transitions to `true`
  - The button text changes to "INITIATING..."
  - The `LoadingFX` overlay appears embedded within the setup card with mode `'classic'`
  - Loading steps cycle through: "Initializing Imagination Engines...", "Querying the Multiverse Archives...", etc.
  - A progress bar animates from 0% toward 100% (non-linear)
  - Floating word particles ("ZAP!", "POW!", etc.) appear in the overlay
  - The `AIClient.streamStory()` is called with the current `input` state
  - Upon successful API response, the story is saved to IndexedDB via `storageManager.saveStory()`
  - `history` is refreshed from IndexedDB
  - `phase` transitions to `'reading'`
  - `currentPartIndex` is set to `0`
  - `soundManager.playPageTurn()` fires
  - The `ReadingView` component renders with the story

**Data Assertions:**
  - `input.heroName === 'Captain Brave'`
  - `input.setting === 'Enchanted Forest'`
  - `input.mode === 'classic'`
  - POST to `/api/generate-story` includes `systemInstruction` containing "Children's Book Author"
  - POST body `userPrompt` includes "HERO: Captain Brave" and "SETTING: Enchanted Forest"
  - Response is parsed as valid `StoryFull` with non-empty `parts` array

---

### TC-CLS-002: Generate with minimal fields (defaults)

**Priority:** P1
**Preconditions:** App is on setup phase, classic mode. Only `heroName` and `setting` are provided.

**Given** the user enters "Luna" as hero name and "Mountain" as setting
**And** leaves `heroPower`, `sidekick`, and `problem` fields empty
**When** the user clicks "ENGAGE MISSION"
**Then** the following should occur:
  - The `checkIsReady` function returns `true` (only `heroName` and `setting` are required for classic)
  - `AIClient.streamStory()` is called with fallback values in the prompt:
    - POWER: "boundless imagination"
    - SIDEKICK: "none"
    - PROBLEM: "a mystery to solve"
  - Story generates successfully with these defaults

**Data Assertions:**
  - `userPrompt` includes "POWER: boundless imagination"
  - `userPrompt` includes "SIDEKICK: none"

---

### TC-CLS-003: Generate avatar, verify display

**Priority:** P1
**Preconditions:** App is on Classic Setup, wizard step 2 visible, `heroName` is "Star Knight", browser online.

**Given** the user has entered "Star Knight" as the hero name
**And** the `HeroAvatarDisplay` shows the `DefaultAvatar` (no image yet) with a bouncing paint badge
**When** the user clicks the "CREATE HERO" button on the avatar display
**Then** the following should occur:
  - `isAvatarLoading` transitions to `true`
  - The avatar area shows a spinning loader with "Painting..." text
  - `AIClient.generateAvatar('Star Knight', 'Dreaming')` is called (heroPower defaults to 'Dreaming' when empty)
  - POST to `/api/generate-avatar` includes prompt with hero name and power
  - On success, `input.heroAvatarUrl` is set to `data:<mimeType>;base64,<data>`
  - `soundManager.playSparkle()` fires (ascending arpeggio: C5, E5, G5, C6)
  - The avatar image replaces the default silhouette
  - The "CREATE HERO" button changes to "REPAINT" on hover
  - The bouncing badge disappears

**Data Assertions:**
  - `input.heroAvatarUrl` starts with `data:image/`
  - Avatar `<img>` tag `src` matches `input.heroAvatarUrl`

---

### TC-CLS-004: Change voice selection

**Priority:** P1
**Preconditions:** App is on Classic Setup. Default voice is "Kore".

**Given** the VoiceSelector is visible below the setup form
**And** "Kore" (Soothing) is the currently selected voice with `aria-checked="true"`
**When** the user clicks on "Puck" (Playful) voice button
**Then** the following should occur:
  - `soundManager.playChoice()` fires (440Hz to 880Hz sine chirp)
  - "Puck" button gains active styling: `border-black bg-blue-50 text-black shadow-[6px_6px_0px_black] scale-105`
  - "Kore" button loses active styling and becomes `opacity-40`
  - `input.narratorVoice` changes to `'Puck'`
  - "Puck" button `aria-checked` becomes `"true"`, "Kore" becomes `"false"`

**Data Assertions:**
  - `input.narratorVoice === 'Puck'`
  - All 7 voices are rendered: Kore, Aoede, Zephyr, Leda, Puck, Charon, Fenrir

---

### TC-CLS-005: Adjust story length

**Priority:** P1
**Preconditions:** App is on Classic Setup. Default length is "medium".

**Given** the LengthSlider is visible with "Medium" selected (book icon active, blue)
**And** the duration label shows "~8 mins"
**When** the user clicks the "Eternal" (infinity icon) step
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - "Eternal" step button becomes active with `bg-red-500 border-red-700` styling
  - All steps up to and including "Eternal" become active (colored, elevated)
  - The progress track fills to 100% width
  - Duration label changes to "~25 mins"
  - `input.storyLength` changes to `'eternal'`

**Data Assertions:**
  - `input.storyLength === 'eternal'`
  - API call `lengthConfig` will contain "approx 4500 words, 15-18 parts"

---

### TC-CLS-006: Load story from Memory Jar

**Priority:** P0
**Preconditions:** IndexedDB contains a saved story with title "The Dragon Quest", avatar image, and 2 scene images. App is on setup phase.

**Given** the user clicks the Memory Jar button (jar icon, top-right)
**And** `soundManager.playChoice()` fires
**When** the Memory Jar drawer slides in from the right
**Then** the drawer should display:
  - Header: "Memory Jar" with jar emoji
  - The saved story card showing:
    - Avatar thumbnail (or book emoji fallback)
    - Title "The Dragon Quest" in blue
    - Date of creation
    - Part count (e.g., "5 Parts")
    - "Offline Ready" badge
  - Action bar with Save (download), Share, and Delete buttons

**When** the user clicks on "The Dragon Quest" story card
**Then** the following should occur:
  - `loadStoryFromHistory(cached)` is called
  - `story` state is set to the cached `StoryFull` object
  - `input.heroAvatarUrl` is set to the cached avatar
  - `scenes` state is set to the cached scene images
  - `phase` transitions to `'reading'`
  - `currentPartIndex` is set to `0`
  - `soundManager.playPageTurn()` fires
  - The Memory Jar drawer closes
  - The `ReadingView` renders with the loaded story

**Data Assertions:**
  - `story.title === 'The Dragon Quest'`
  - `scenes` object contains 2 entries
  - `phase === 'reading'`

---

## 3. Test Suite: Mad Libs Mode Setup

### TC-MAD-001: Fill all mad lib fields

**Priority:** P0
**Preconditions:** App is on setup phase, classic mode initially selected.

**Given** the user clicks "Mad Libs" in the mode dock
**When** the mode switches to mad libs
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - The mode dock animates the `activeTab` layout ID to the Mad Libs button (`bg-red-500`)
  - The tagline changes to "Unleash The Chaos"
  - The header gradient transitions to `from-red-900 via-orange-950 to-black`
  - The `MadlibsSetup` component renders with the fill-in-the-blank sentence template
  - Five `MadLibField` inputs appear: Adjective, Place, Food, Animal, Silly Word
  - All fields show red pulsing borders (`border-red-400 bg-red-50/50 animate-pulse`) indicating required
  - The "ENGAGE MISSION" button is disabled (not all madlibs fields are filled)

**When** the user fills in each field:
  - Adjective: "sparkly"
  - Place: "Candy Lab"
  - Food: "Taco"
  - Animal: "Penguin"
  - Silly Word: "Zoinks!"
**Then** the following should occur:
  - Each field's border changes to `border-blue-400 bg-blue-50/50` (valid state)
  - The "Required" tooltip no longer appears on hover
  - `checkIsReady` returns `true` (all madlib values are non-empty)
  - "ENGAGE MISSION" button becomes enabled (red with shadow)

**When** the user clicks "ENGAGE MISSION"
**Then** story generation proceeds with madlibs mode:
  - `LoadingFX` renders with `mode='madlibs'`, title "GENERATING CHAOS..."
  - Loading steps cycle: "Mixing Chaos Potions...", "Scrambling the Dictionary...", etc.
  - Background particles are multi-colored and chaotic
  - API `systemInstruction` includes "Mad Libs Generator and Comedian"
  - API `userPrompt` includes "ADJECTIVE: sparkly", "PLACE: Candy Lab", etc.

**Data Assertions:**
  - `input.mode === 'madlibs'`
  - `input.madlibs === { adjective: 'sparkly', place: 'Candy Lab', food: 'Taco', sillyWord: 'Zoinks!', animal: 'Penguin' }`

---

### TC-MAD-002: Use randomize/suggestion feature

**Priority:** P1
**Preconditions:** App is on Mad Libs setup. Adjective field is focused.

**Given** the user focuses on the Adjective `MadLibField` input
**And** `soundManager.playChoice()` fires on focus
**When** the suggestions dropdown appears
**Then** the dropdown should display:
  - Yellow header: "Ideas for Adjective"
  - Suggestion buttons: "brave", "tiny", "glowing", "invisible"

**When** the user clicks "glowing"
**Then** the following should occur:
  - `soundManager.playSparkle()` fires
  - The Adjective field value changes to "glowing"
  - The dropdown closes (`isFocused` set to `false`)
  - The field border changes to valid blue styling

**Data Assertions:**
  - `input.madlibs.adjective === 'glowing'`

---

### TC-MAD-003: Switch from classic to mad libs (state preservation)

**Priority:** P1
**Preconditions:** App is on Classic Setup. User has entered heroName "Max" and setting "Castle".

**Given** `input.heroName === 'Max'` and `input.setting === 'Castle'`
**When** the user clicks "Mad Libs" in the mode dock
**Then** the following should occur:
  - `input.mode` changes to `'madlibs'`
  - The `MadlibsSetup` component renders
  - `input.heroName` retains "Max" (state is not reset)
  - `input.setting` retains "Castle" (state is not reset)
  - The madlib fields remain at their prior values (empty if never filled)
  - The setup card background remains `bg-white` (not sleep mode dark)

**When** the user switches back to "Classic"
**Then** the Classic Setup renders and `input.heroName` still shows "Max"

**Data Assertions:**
  - Mode change only updates `input.mode`, not other fields
  - `handleInputChange('mode', 'madlibs')` is the only mutation

---

## 4. Test Suite: Sleep Mode Setup

### TC-SLP-001: Configure sensory inputs (Parent's Path sub-mode)

**Priority:** P0
**Preconditions:** App is on setup phase. Browser online.

**Given** the user clicks "Sleepy" in the mode dock
**When** the mode switches to sleep
**Then** the following should occur:
  - The header gradient transitions to `from-[#020617] via-[#0f172a] to-black`
  - Star field animation appears (60 white dots with varying opacity)
  - The tagline reads "Drift Into Dreams"
  - The setup card background transitions to `bg-indigo-950 text-indigo-50`
  - The hero name input has sleep-themed styling (indigo underline, serif font)
  - Sub-mode toggle shows two options: "Dream Pick" (child-friendly) and "Parent's Path" (parent-madlib)
  - Default sub-mode is "child-friendly"
  - The launch button text changes to "BEGIN DREAM-LOG"

**When** the user types "Luna" in the hero name field
**And** clicks "Parent's Path" sub-mode
**Then** the left panel switches from the theme preview to the Sensory Weaving panel with three `SensoryInputCard` components:
  - World Texture (cloud icon): placeholder "Soft and pillowy..."
  - Gentle Echoes (shell icon): placeholder "A distant hum..."
  - Dream Aromas (cookie icon): placeholder "Warm honey..."
  - Each card has suggestion chips below the input

**When** the user enters:
  - Texture: "Giant marshmallow"
  - Sound: "Whispering leaves"
  - Scent: "Warm apple pie"
**And** selects "Magic Forest" theme from the right panel grid
**Then** the following should occur:
  - Each `SensoryInputCard` input shows an X clear button when value is non-empty
  - "Magic Forest" theme card shows checkmark, glow effect, and `border-indigo-300`
  - The active description display shows: "Whispering trees and glowing flowers."
  - `checkIsReady` returns `true` (heroName is non-empty for sleep mode)
  - "BEGIN DREAM-LOG" button is enabled

**Data Assertions:**
  - `input.sleepConfig.subMode === 'parent-madlib'`
  - `input.sleepConfig.texture === 'Giant marshmallow'`
  - `input.sleepConfig.sound === 'Whispering leaves'`
  - `input.sleepConfig.scent === 'Warm apple pie'`
  - `input.sleepConfig.theme === 'Magic Forest'`

---

### TC-SLP-002: Select theme and ambient sound

**Priority:** P1
**Preconditions:** App is on Sleep Setup, child-friendly sub-mode.

**Given** the left panel shows the theme preview area with a floating animated icon
**And** 5 themes are displayed in a 2-column grid on the right: Cloud Kingdom, Starry Space, Magic Forest, Deep Ocean, Moonlight Meadow
**When** the user clicks "Deep Ocean"
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - The "Deep Ocean" card gains: `border-indigo-300 bg-indigo-900/50 shadow-[0_0_25px_rgba(99,102,241,0.4)]`
  - A checkmark icon animates in at the top-right corner of the card
  - A cyan-to-cyan gradient overlay appears on the card
  - The left preview panel updates to show the octopus emoji, "Deep Ocean" title, and description
  - The active description bar transitions to: "Gentle waves and glowing sea friends."

**When** the user scrolls to the ambient sounds section
**And** clicks "Midnight Ocean"
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - `soundManager.playAmbient('ocean')` is called via the SleepSetup `useEffect`
  - The "Midnight Ocean" button gains active styling: `bg-indigo-600 text-white border-indigo-400 shadow-[0_10px_30px_rgba(99,102,241,0.4)] scale-105`
  - The wave icon scales up to 125% and rotates 6 degrees
  - Brown noise with wave LFO modulation begins playing through Web Audio API
  - The "Silence" button loses active styling

**When** the user clicks "Silence"
**Then** `soundManager.stopAmbient()` is called and audio fades out over 2 seconds

**Data Assertions:**
  - `input.sleepConfig.theme === 'Deep Ocean'`
  - `input.sleepConfig.ambientTheme === 'ocean'` (then `'auto'` after silence)

---

### TC-SLP-003: Verify no choice options in sleep mode story generation

**Priority:** P0
**Preconditions:** Sleep mode setup complete. Story generation triggered.

**Given** the user has configured sleep mode and clicked "BEGIN DREAM-LOG"
**When** the `AIClient.streamStory(input)` call is made
**Then** the `systemInstruction` should contain:
  - "ZERO CONFLICT. No monsters, no scares, no sudden noises, no tension."
  - "INTERACTIVITY: NONE. The 'choices' array MUST be empty for all parts."
  - "Dreamy, lyrical, slow, and repetitive"
  - The word count and parts count scaled by `storyLength` multiplier

**And** when the story is returned and displayed in `ReadingView`:
  - `part.choices` is empty for every part
  - No choice buttons (`<nav aria-label="Story Decisions">`) are rendered (the `!isSleepMode` guard prevents it)

**Data Assertions:**
  - `lengthConfig` includes "INTERACTIVITY: NONE"
  - Every `story.parts[i].choices` is `[]` or `undefined`

---

## 5. Test Suite: Story Reading - Classic

### TC-RDC-001: Story displays correctly after generation

**Priority:** P0
**Preconditions:** A classic mode story has been generated with title "The Crystal Cavern", 5 parts, each part having 3 choices (except the last). Avatar URL is set.

**Given** the app transitions to `phase === 'reading'`
**When** the `ReadingView` component renders
**Then** the following should occur:
  - The main element has `role="main"` and `aria-label="Reading story: The Crystal Cavern"`
  - The background is `bg-[#fcf8ef] text-gray-800` (parchment theme, not sleep mode)
  - The story title "THE CRYSTAL CAVERN" displays in uppercase, large font
  - A decorative red divider line appears below the title
  - The avatar image renders in a rounded square frame (28x28 to 40x40)
  - Part 1 text is fully visible (`opacity-100`)
  - Parts 2-5 are dimmed: `opacity-10 grayscale blur-[2px] pointer-events-none`
  - Part 1 shows 3 choice buttons in a grid layout
  - Choice buttons are styled: `bg-blue-500 text-white rounded-2xl border-4 border-black shadow-[6px_6px_0px_black]`
  - The bottom control hub shows:
    - "Journey Segment 1 / 5" label
    - Progress bar at 20% (1/5)
    - Play button (triangle emoji)
    - Stop button
    - Narrator voice label showing the selected voice name + "Spirit"
    - Speed selector with 0.8x, 1.0x, 1.2x buttons (1.0x active)
  - Header controls show "Menu" button (top-left) and font size + mute buttons (top-right)

**Data Assertions:**
  - `story.title === 'The Crystal Cavern'`
  - `story.parts.length === 5`
  - `currentPartIndex === 0`
  - `storyProgress === 20` (1/5 * 100)

---

### TC-RDC-002: Navigate between parts via choices

**Priority:** P0
**Preconditions:** Story is loaded at part index 0 with 3 choices displayed.

**Given** the user is reading part 1 of a 5-part classic story
**And** three choice buttons are visible
**When** the user clicks the second choice button
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - `stopNarration()` is called (stops any active narration)
  - `currentPartIndex` advances from `0` to `1`
  - `soundManager.playPageTurn()` fires (triangle wave 150Hz to 300Hz)
  - Part 2 becomes fully visible (`opacity-100`)
  - Part 2's choices appear (if not the last part)
  - Parts 3-5 remain dimmed
  - Progress bar advances to 40% (2/5)
  - "Journey Segment" label updates to "2 / 5"
  - The content scrolls the new part into view

**Data Assertions:**
  - `currentPartIndex === 1`
  - `storyProgress === 40`

---

### TC-RDC-003: Select choices at end of each part (full story traversal)

**Priority:** P0
**Preconditions:** A 5-part classic story is loaded.

**Given** the user starts at part 1
**When** the user makes a choice at each part (1 through 4)
**Then** after each choice:
  - `currentPartIndex` increments by 1
  - The page turn sound plays
  - The next part's text and choices appear
  - Previous parts remain visible but scrolled above

**When** the user reaches part 5 (the final part, `currentPartIndex === 4`)
**Then** the following should occur:
  - No choice buttons appear for the final part (final parts have no choices)
  - A footer section appears with:
    - "The Wise Hero's Lesson" heading with the `story.lesson` text
    - "A Chuckle for the Road" section with `story.joke`
    - "MISSION COMPLETE" button (red, full width, comic-btn styling)
  - Progress bar shows 100%

**When** the user clicks "MISSION COMPLETE"
**Then** `onReset()` is called:
  - `stopNarration()` stops any active audio
  - `phase` transitions back to `'setup'`
  - `story` is set to `null`
  - `currentPartIndex` resets to `0`
  - `scenes` is cleared to `{}`
  - `input.heroAvatarUrl` is cleared

**Data Assertions:**
  - At final part: `currentPartIndex === story.parts.length - 1`
  - `story.parts[4].choices` is empty or undefined
  - After reset: `phase === 'setup'`, `story === null`

---

### TC-RDC-004: Scene illustrations load

**Priority:** P1
**Preconditions:** Story is loaded, no scenes cached, browser online.

**Given** the user is on part 1 of a classic story
**And** the avatar area shows `input.heroAvatarUrl` (since no scene for index 0 exists)
**When** `onGenerateScene()` is triggered (via UI or automatic generation)
**Then** the following should occur:
  - `isSceneLoading` transitions to `true`
  - `AIClient.generateSceneIllustration()` is called with:
    - `context`: the text of the current part
    - `heroDescription`: `"${input.heroName} with ${input.heroPower}"`
  - POST to `/api/generate-scene` with prompt containing the story text excerpt
  - On success, `scenes[currentPartIndex]` is set to the data URL
  - `storageManager.saveStoryScene(currentStoryId, index, imageUrl)` persists the image
  - The avatar/scene image updates to show the new scene illustration

**Data Assertions:**
  - `scenes[0]` is a data URL string starting with `data:image/`
  - The `<img>` tag `src` switches from `input.heroAvatarUrl` to `scenes[0]`

---

### TC-RDC-005: Narration plays for current part

**Priority:** P0
**Preconditions:** Story is loaded at part 0. No cached narration. Browser online.

**Given** the user clicks the Play button in the control hub
**When** `onTogglePlayback()` (which calls `playNarration()`) is invoked
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - `isNarrating` transitions to `true`
  - `isNarrationLoading` transitions to `true`
  - The play button shows the hourglass emoji (`isNarrationLoading` is true)
  - `narrationManager.fetchNarration(text, voice, true)` is called with:
    - `text`: the current part's text (for non-final parts)
    - `voiceName`: `input.narratorVoice`
    - `autoPlay: true`
  - POST to `/api/generate-narration` with `{ text, voiceName }`
  - Audio data is decoded from base64, converted to PCM 24kHz mono AudioBuffer
  - Audio is saved to IndexedDB via `storageManager.saveAudio()`
  - Audio is cached in memory (`memoryCache`)
  - Playback begins through Web Audio API
  - `isNarrationLoading` transitions to `false`
  - The play button changes to the pause emoji
  - The circular SVG progress ring around the play button animates based on `progressPercent`
  - `SyncedText` component highlights the active sentence/word as narration progresses:
    - Active sentence gets `bg-yellow-100/30` background
    - Active word turns `#2563eb` (blue), scales to `1.05`, becomes bold
    - Non-active sentences dim to `opacity: 0.7`
  - After current part, the next part's narration is preloaded (fire-and-forget)

**Data Assertions:**
  - `isNarrating === true`
  - `narrationTime` increments via `requestAnimationFrame` polling
  - `narrationDuration > 0`
  - `progressPercent` = `(narrationTime / narrationDuration) * 100`

---

### TC-RDC-006: Pause/resume narration

**Priority:** P0
**Preconditions:** Narration is actively playing for part 1.

**Given** the narration is playing (`isNarrating === true`, `narrationManager.state.isPlaying === true`)
**When** the user clicks the Pause button (pause emoji)
**Then** the following should occur:
  - `narrationManager.pause()` is called
  - `pausedAt` records the current audio position in seconds
  - The audio buffer source stops but position is saved
  - The button icon changes to the play emoji (triangle)
  - `narrationManager.state.isPaused === true`
  - Word highlighting freezes at the current position

**When** the user clicks Play again (to resume)
**Then** the following should occur:
  - `narrationManager.play()` is called (the `isPaused` branch in `playNarration`)
  - A new AudioBufferSourceNode is created
  - Playback resumes from `pausedAt` offset
  - `isPaused` resets to `false`
  - Word highlighting resumes from where it paused
  - The button icon returns to the pause emoji

**Data Assertions:**
  - After pause: `narrationManager.state.isPaused === true`, `narrationManager.state.isPlaying === false`
  - After resume: `narrationManager.state.isPaused === false`, `narrationManager.state.isPlaying === true`
  - `getCurrentTime()` after resume continues from `pausedAt`

---

### TC-RDC-007: Change narration speed

**Priority:** P1
**Preconditions:** Narration is playing at 1.0x speed.

**Given** the speed selector shows three buttons: 0.8x, 1.0x, 1.2x
**And** 1.0x is active (`aria-pressed="true"`, filled styling)
**When** the user clicks 1.2x
**Then** the following should occur:
  - `soundManager.playChoice()` fires
  - `setPlaybackRate(1.2)` is called
  - `narrationManager.setRate(1.2)` updates the source's playback rate
  - The start time is recalculated to maintain position continuity
  - Audio speed increases perceptibly
  - 1.2x button gains active styling, 1.0x loses it
  - Word highlighting speed adjusts to match the new rate

**Data Assertions:**
  - `playbackRate === 1.2`
  - `narrationManager.getRate() === 1.2`
  - `source.playbackRate.value === 1.2`

---

### TC-RDC-008: Complete story (see completion footer)

**Priority:** P0
**Preconditions:** User is on the last part of a story.

**Given** the user is reading the final part (`currentPartIndex === story.parts.length - 1`)
**When** narration plays for the final part
**Then** the narration text includes appended content:
  - Original part text
  - `". Today's lesson is: ${story.lesson}."`
  - `" Here is a joke: ${story.joke}."`
  - `" ${story.tomorrowHook}"`

**And** the visual footer section displays:
  - The lesson in a rounded section with red heading
  - The joke in a yellow-tinted section
  - A "MISSION COMPLETE" button

**When** the user clicks "MISSION COMPLETE"
**Then** `reset()` is called and the app returns to setup phase

---

## 6. Test Suite: Story Reading - Sleep

### TC-RDS-001: Auto-advance between parts

**Priority:** P0
**Preconditions:** A sleep mode story has been generated with 15 parts. Narration is enabled.

**Given** the app is in reading phase with `input.mode === 'sleep'`
**When** narration for part 1 finishes playing naturally
**Then** the `narrationManager.onEnded` callback fires:
  - `isNarrating` is set to `false`
  - Since `input.mode === 'sleep'` and `currentPartIndex < story.parts.length - 1`:
    - After a 500ms delay, `currentPartIndex` increments by 1
  - The `useEffect` detecting `currentPartIndex` change in sleep mode triggers:
    - After a 100ms delay, `playNarration()` is called automatically
  - Narration for part 2 begins (using preloaded audio if available)
  - The content scrolls the new part into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`)

**Data Assertions:**
  - Auto-advance only occurs when `input.mode === 'sleep'`
  - `currentPartIndex` increments sequentially until the last part

---

### TC-RDS-002: No choices displayed in sleep mode

**Priority:** P0
**Preconditions:** Sleep mode story loaded in reading view.

**Given** the story is displayed in sleep mode (`isSleepMode === true`)
**When** any part is the current active part
**Then** the choice navigation (`<nav aria-label="Story Decisions">`) is never rendered
  - The rendering condition `!isSleepMode` prevents choice buttons
  - Even if `part.choices` contains values, they are not displayed

**Expected Visual Behavior:**
  - Continuous text flow without interactive decision points
  - Sleep mode background: `bg-indigo-950 text-indigo-100/90`
  - Avatar frame has `opacity-80` in sleep mode

---

### TC-RDS-003: Ambient soundscape plays during sleep reading

**Priority:** P1
**Preconditions:** Sleep mode story generated with `ambientTheme` set to `'rain'`.

**Given** the SleepSetup had `ambientTheme` set to `'rain'` during configuration
**When** the story transitions to reading phase
**Then** if the ambient sound was started during setup:
  - The ambient audio continues playing (it was started via `SleepSetup` useEffect)
  - Pink noise base with low-pass filter at 1200Hz plays
  - White noise patter layer with bandpass at 2500Hz provides rain texture
  - LFO modulates patter gain at 0.3Hz frequency
  - Stereo panning adds spatial width

**Note:** The ambient sound is initiated in `SleepSetup` via `soundManager.playAmbient()` and persists until `soundManager.stopAmbient()` is called (on component unmount or explicit stop).

---

### TC-RDS-004: Extended length content for sleep mode

**Priority:** P1
**Preconditions:** Sleep mode with "eternal" story length selected.

**Given** the user selects "Eternal" story length in sleep mode
**When** story generation is triggered
**Then** the API receives:
  - `multiplier = 2`
  - `partsCount = 30` (15 * 2)
  - `wordCountMin = 8000` (4000 * 2)
  - `wordCountMax = 12000` (6000 * 2)
  - `lengthConfig` includes "ULTIMATE SLUMBER EDITION"

**Data Assertions:**
  - Story length calculation: `Math.floor(15 * 2) === 30` parts
  - Word count range: 8000-12000 words

---

## 7. Test Suite: Story Reading - Mad Libs

### TC-RDM-001: Mad lib words appear in story

**Priority:** P0
**Preconditions:** Mad libs story generated with words: adjective="sparkly", place="Candy Lab", food="Taco", animal="Penguin", sillyWord="Zoinks!".

**Given** the story has been generated and the reading view is displayed
**When** the user reads through the story text
**Then** the story should incorporate the provided mad lib words:
  - The API `userPrompt` sent was: "Generate a Mad Libs story using these words: ADJECTIVE: sparkly, PLACE: Candy Lab, FOOD: Taco, ANIMAL: Penguin, SILLYWORD: Zoinks!"
  - The system instruction specified "Maximum usage of the provided random words in funny contexts"
  - The story text across parts should contain references to these words

**Data Assertions:**
  - `input.mode === 'madlibs'`
  - API call included all 5 mad lib values in the prompt

---

### TC-RDM-002: Humorous tone verification

**Priority:** P2
**Preconditions:** Mad libs story loaded.

**Given** the mad libs story is displayed
**When** examining the story structure
**Then** the following should be true:
  - The `systemInstruction` sent was: "Mad Libs Generator and Comedian" with "Silly, unexpected, high-energy" tone
  - The story has a `joke` field containing a comedic punchline
  - The story has a `rewardBadge` with emoji, title, and description
  - The `LoadingFX` during generation used "GENERATING CHAOS..." title
  - The reading view displays in the normal parchment theme (not sleep dark theme)

---

## 8. Test Suite: Narration

### TC-NAR-001: Generate and play narration

**Priority:** P0
**Preconditions:** Story loaded, part 0 active, no cached audio, browser online.

**Given** no narration has been played yet
**When** the user clicks the Play button
**Then** the following sequence occurs:
  1. `playNarration()` checks `narrationManager.state`: not paused, not playing
  2. `isNarrating` set to `true`, `isNarrationLoading` set to `true`
  3. `narrationManager.fetchNarration(text, voice, true)` called
  4. `narrationManager.init()` creates AudioContext at 24000Hz sample rate if not exists
  5. Memory cache miss for the cache key `v1:{voice}:{text30chars}_{textLength}`
  6. IndexedDB audio cache miss
  7. POST to `/api/generate-narration` with `{ text, voiceName }`
  8. Response contains `{ audioData: "<base64 encoded PCM>" }`
  9. Base64 decoded to `Uint8Array` via manual `atob` decoding
  10. Raw bytes saved to IndexedDB audio store
  11. PCM bytes decoded to `AudioBuffer` (16-bit, 24kHz, mono)
  12. Buffer cached in memory Map
  13. `play()` creates `AudioBufferSourceNode`, connects to `GainNode`, starts at offset 0
  14. `isNarrationLoading` set to `false`
  15. Audio plays through speakers
  16. Preload of next part fires (autoPlay=false)

**Data Assertions:**
  - `narrationManager.memoryCache` has 1 entry after play
  - `narrationManager.state.isPlaying === true`
  - `narrationManager.getCurrentTime()` returns increasing values

---

### TC-NAR-002: Pause and resume at correct position

**Priority:** P0
**Preconditions:** Narration is playing, currently at ~10 seconds into a 30-second clip.

**Given** narration has been playing for approximately 10 seconds
**When** the user clicks Pause
**Then**:
  - `narrationManager.pause()` records `pausedAt = (audioCtx.currentTime - startTime) * playbackRate`
  - `pausedAt` is approximately 10 seconds
  - Audio stops

**When** the user waits 5 seconds and clicks Play
**Then**:
  - `narrationManager.play()` starts from `offset = pausedAt` (approx 10 seconds)
  - Audio resumes from the 10-second mark, not from the beginning
  - `getCurrentTime()` continues from ~10 seconds

**Data Assertions:**
  - Resume offset matches pause position within 0.1 second tolerance

---

### TC-NAR-003: Change speed during playback

**Priority:** P1
**Preconditions:** Narration playing at 1.0x, currently at 15 seconds.

**Given** audio is playing at 1.0x speed, position approximately 15 seconds
**When** the user clicks 0.8x speed button
**Then**:
  - `narrationManager.setRate(0.8)` is called
  - Current audio position is calculated: `currentAudioTime = (now - startTime) * 1.0`
  - `startTime` is recalculated: `now - (currentAudioTime / 0.8)`
  - `source.playbackRate.value` set to 0.8
  - Audio slows down perceptibly
  - `getCurrentTime()` continues smoothly from ~15 seconds (no jump)

---

### TC-NAR-004: Switch parts during narration

**Priority:** P1
**Preconditions:** Narration is playing on part 1 of a classic story.

**Given** narration is actively playing part 1
**When** the user clicks a choice button to advance to part 2
**Then** `handleChoice()` executes:
  - `soundManager.playChoice()` fires
  - `stopNarration()` is called: narration stops, `isNarrating` set to `false`
  - `currentPartIndex` advances to 1
  - `soundManager.playPageTurn()` fires
  - Since `isNarrating` was `true` before the choice, narration auto-resumes after 1200ms delay via `setTimeout(() => playNarration(), 1200)`

---

### TC-NAR-005: Narration from cache (second play)

**Priority:** P1
**Preconditions:** Part 1 narration has been played once (audio in memory cache and IndexedDB).

**Given** the user has already heard part 1 narration
**And** the user resets and loads the same story from memory jar
**When** the user clicks Play for part 1 again
**Then** `narrationManager.fetchNarration()` hits the memory cache:
  - Cache key matches `v1:{voice}:{text30chars}_{textLength}`
  - `memoryCache.has(cacheKey)` returns `true`
  - No API call is made
  - `currentBuffer` is set from cache
  - Playback starts immediately (near-zero latency)

**Data Assertions:**
  - No POST to `/api/generate-narration`
  - `isNarrationLoading` duration is near-zero

---

### TC-NAR-006: Offline narration from IndexedDB cache

**Priority:** P1
**Preconditions:** Narration for a part was previously generated and cached in IndexedDB. Browser is now offline. Memory cache is empty (new session).

**Given** the app is offline and the user loads a story from Memory Jar
**When** the user clicks Play
**Then** `narrationManager.fetchNarration()` proceeds:
  1. Memory cache miss (new session)
  2. IndexedDB `getAudio(cacheKey)` returns the cached `ArrayBuffer`
  3. The bytes are decoded into an AudioBuffer
  4. Buffer is stored in memory cache
  5. Playback begins without network access

**Data Assertions:**
  - `storageManager.getAudio(cacheKey)` returns non-undefined `ArrayBuffer`
  - No network request is made

---

## 9. Test Suite: Memory Jar

### TC-MEM-001: Save a completed story

**Priority:** P0
**Preconditions:** A new story has just been generated.

**Given** the user clicks "ENGAGE MISSION" and story generation succeeds
**When** `generateStory()` completes successfully
**Then** the following save operations occur:
  - `storageManager.saveStory(data, input.heroAvatarUrl)` is called
  - A new `CachedStory` record is created with:
    - `id`: generated via `crypto.randomUUID()`
    - `timestamp`: `Date.now()`
    - `story`: the full `StoryFull` object
    - `avatar`: the base64 avatar data URL
    - `scenes`: empty `{}`
  - The record is written to IndexedDB `stories` object store
  - `currentStoryId` is set to the new ID
  - `history` is refreshed: `storageManager.getAllStories()` returns updated list sorted by newest first

**Data Assertions:**
  - IndexedDB `stories` store contains the new entry
  - `history.length` increased by 1
  - `history[0].story.title` matches the generated story title

---

### TC-MEM-002: Load a saved story

**Priority:** P0
**Preconditions:** Memory Jar contains 3 saved stories.

**Given** the user opens the Memory Jar drawer
**And** 3 story cards are displayed sorted by newest first
**When** the user clicks on the second story card
**Then**:
  - `loadStoryFromHistory(cached)` sets `story` to the cached story
  - `input.heroAvatarUrl` is updated to the cached avatar
  - `scenes` is populated from cached scenes
  - `phase` changes to `'reading'`
  - `currentPartIndex` resets to `0`
  - `soundManager.playPageTurn()` fires
  - The Memory Jar drawer closes
  - The reading view displays the loaded story

---

### TC-MEM-003: Delete a saved story

**Priority:** P1
**Preconditions:** Memory Jar contains 2 stories.

**Given** the Memory Jar drawer is open showing 2 stories
**When** the user clicks the trash icon button on the first story
**Then**:
  - `e.stopPropagation()` prevents the card click handler from firing
  - `onDeleteHistory(id)` calls `storageManager.deleteStory(id)`
  - `soundManager.playDelete()` fires (sawtooth wave 150Hz descending to 50Hz)
  - The deleted story is removed from IndexedDB
  - `history` is refreshed and now contains 1 story
  - The deleted card disappears from the drawer

**Data Assertions:**
  - `history.length === 1` after deletion
  - IndexedDB `stories` store no longer contains the deleted ID

---

### TC-MEM-004: Download story as JSON

**Priority:** P2
**Preconditions:** Memory Jar is open with at least 1 story.

**Given** a story card with title "Space Adventure" is visible
**When** the user clicks the "Save" (download) button on the action bar
**Then**:
  - `e.stopPropagation()` prevents card click
  - `soundManager.playChoice()` fires
  - A `Blob` is created from `JSON.stringify(story.story, null, 2)` with type `application/json`
  - A temporary `<a>` element is created with:
    - `href` set to `URL.createObjectURL(blob)`
    - `download` set to `space_adventure.json` (title sanitized: non-alphanumeric replaced with `_`, lowercased)
  - The link is clicked programmatically, triggering a file download
  - The temporary link and object URL are cleaned up

---

### TC-MEM-005: Share story

**Priority:** P2
**Preconditions:** Memory Jar is open. Browser supports `navigator.share` API.

**Given** a story with title "Moon Quest" exists
**When** the user clicks the "Share" button
**Then**:
  - `e.stopPropagation()` prevents card click
  - `soundManager.playChoice()` fires
  - `navigator.share()` is called with:
    - `title`: "Moon Quest"
    - `text`: `I just created a story called "Moon Quest" with Infinity Heroes!`
  - The native share sheet appears

**When** `navigator.share` is not available (desktop fallback)
**Then**:
  - `navigator.clipboard.writeText()` copies the share text
  - An `alert("Story title copied to clipboard!")` is shown

---

### TC-MEM-006: Empty memory jar state

**Priority:** P1
**Preconditions:** IndexedDB `stories` store is empty.

**Given** the user opens the Memory Jar drawer
**When** the drawer renders with `history.length === 0`
**Then** the empty state is displayed:
  - A cloud/fog emoji (size 6xl) centered vertically
  - Italic text: "Your jar is currently empty..."
  - Both elements have `opacity-30` and white text
  - No story cards are rendered
  - The footer still shows "Drift into dreams..."

---

## 10. Test Suite: Settings

### TC-SET-001: Open/close settings modal

**Priority:** P1
**Preconditions:** App is on setup phase.

**Given** the user clicks the gear icon button in the top-right corner
**When** `onOpenSettings()` is called
**Then**:
  - `soundManager.playChoice()` fires
  - `isSettingsOpen` state becomes `true`
  - The `SettingsModal` renders as a fixed overlay with `z-[1000]`
  - The backdrop is `bg-black/80 backdrop-blur-md`
  - The modal animates in: `scale: 0.9 -> 1, opacity: 0 -> 1`
  - Header shows "Mission Control" with wrench emoji and toolbox icon
  - Three sidebar tabs: General (gear), Voice & Audio (speaker), Accessibility (eye)
  - Default active tab is "General"
  - The modal body shows the "Default Mission Length" grid and "Preferred Dreamscape" dropdown

**When** the user clicks the X (close) button in the header
**Then**:
  - `onClose()` sets `isSettingsOpen` to `false`
  - The modal animates out: `scale: 1 -> 0.9, opacity: 1 -> 0`
  - The backdrop disappears

---

### TC-SET-002: Change preferences in settings

**Priority:** P1
**Preconditions:** Settings modal is open. Current prefs: narratorVoice='Kore', storyLength='medium', fontSize='normal', isMuted=false, reducedMotion=false.

**Given** the user is on the General tab
**When** the user clicks "Long" story length button
**Then**:
  - `soundManager.playChoice()` fires
  - The "Long" button gains active styling: `bg-yellow-400 border-black shadow-[4px_4px_0px_black]`
  - The local `prefs.storyLength` state changes to `'long'`

**When** the user navigates to the "Voice & Audio" tab
**And** clicks "Charon" (Deep) narrator
**Then**:
  - `soundManager.playChoice()` fires
  - "Charon" gains selected styling: `bg-blue-50 border-blue-500 text-blue-900 shadow-md scale-105`
  - Local `prefs.narratorVoice` changes to `'Charon'`

**When** the user clicks the "MUTED/ACTIVE" toggle
**Then** the toggle switches between `bg-red-100 text-red-600` (muted) and `bg-green-100 text-green-600` (active)

**When** the user navigates to "Accessibility" tab
**And** clicks "Large" font size
**And** toggles "Reduced Motion" on
**Then** the local prefs update: `fontSize='large'`, `reducedMotion=true`

**When** the user clicks "Save As Default"
**Then**:
  - `onSave(prefs)` is called with the updated preferences
  - `storageManager.savePreferences(newPrefs)` writes to IndexedDB
  - `soundManager.playSparkle()` fires
  - The footer shows a green success overlay: "Preferences Saved" with disk emoji
  - After 1200ms, the success overlay hides and the modal closes
  - `soundManager.setMuted(newPrefs.isMuted)` updates the global sound state

**Data Assertions:**
  - `userPreferences.storyLength === 'long'`
  - `userPreferences.narratorVoice === 'Charon'`
  - `userPreferences.fontSize === 'large'`
  - `userPreferences.reducedMotion === true`

---

### TC-SET-003: Preferences persist across sessions

**Priority:** P0
**Preconditions:** User saved preferences: `{ narratorVoice: 'Fenrir', storyLength: 'short', fontSize: 'large', isMuted: true, reducedMotion: false, sleepTheme: 'Deep Ocean' }`.

**Given** the preferences were saved to IndexedDB in a prior session
**When** the user reloads the page (new session)
**And** `useStoryEngine` mounts and calls `initData()`
**Then**:
  - `storageManager.getPreferences()` reads from IndexedDB `preferences` store
  - `userPreferences` state is set to the stored values
  - `input.narratorVoice` is set to `'Fenrir'`
  - `input.storyLength` is set to `'short'`
  - `input.sleepConfig.theme` is set to `'Deep Ocean'`
  - `soundManager.setMuted(true)` is applied when `isMuted` preference is used
  - The VoiceSelector shows "Fenrir" (Bold) as selected
  - The LengthSlider shows "Short" as selected

**When** the user opens settings
**Then** the modal reflects the persisted preferences across all tabs

---

### TC-SET-004: Reset defaults

**Priority:** P2
**Preconditions:** Settings modal open with modified preferences.

**Given** the user has changed multiple preferences
**When** the user clicks "Reset Defaults" link in the footer
**Then**:
  - `soundManager.playDelete()` fires
  - Local `prefs` state resets to `DEFAULT_PREFERENCES`:
    - `narratorVoice: 'Kore'`
    - `storyLength: 'medium'`
    - `sleepTheme: 'Cloud Kingdom'`
    - `fontSize: 'normal'`
    - `isMuted: false`
    - `reducedMotion: false`
  - All UI controls visually revert to default selections
  - Note: This does NOT persist until "Save As Default" is clicked

---

## 11. Test Suite: Error Handling

### TC-ERR-001: API failure during story generation

**Priority:** P0
**Preconditions:** Classic mode setup complete. API endpoint will return a 500 error.

**Given** the user clicks "ENGAGE MISSION"
**And** the `/api/generate-story` endpoint returns HTTP 500 with `{ error: "Internal Server Error" }`
**When** `AIClient.streamStory()` receives the error
**Then** the retry mechanism activates:
  - Up to 3 retries with exponential backoff (1000ms, 2000ms, 4000ms)
  - 500 errors are retried (only 4xx except 429 are not retried)
  - After all retries fail, the error propagates to `generateStory()`

**And** the error is handled:
  - `isLoading` transitions to `false`
  - `error` state is set to `"Mission Failed: Internal Server Error"`
  - An error banner animates in at the top of the setup card:
    - Red background with warning emoji
    - Title: "Transmission Interrupted!"
    - Error message text
    - "Dismiss" button
  - The app remains on the setup phase
  - The user can dismiss the error by clicking "Dismiss" or making any input change

**When** the API returns a 404 error
**Then** `setShowApiKeyDialog(true)` is called instead, showing the `ApiKeyDialog`:
  - Fixed overlay with `z-[400]`
  - Title: "Secret Identity Required!"
  - Explanation about paid API key requirement
  - Link to billing docs
  - "Unlock The Multiverse" button that dismisses the dialog

**Data Assertions:**
  - `error` contains the error message string
  - `phase` remains `'setup'`
  - `isLoading === false`

---

### TC-ERR-002: API failure during image generation

**Priority:** P1
**Preconditions:** Avatar generation triggered, API will fail.

**Given** the user clicks "CREATE HERO" to generate an avatar
**And** `/api/generate-avatar` returns HTTP 500
**When** `AIClient.generateAvatar()` retries fail (2 retries for avatar)
**Then**:
  - `isAvatarLoading` transitions to `false`
  - `error` is set to `"Avatar Error: <message>"`
  - The error banner appears in the setup card
  - The avatar area returns to the `DefaultAvatar` display
  - The user can try again

**Data Assertions:**
  - `input.heroAvatarUrl` remains unchanged (empty or previous value)

---

### TC-ERR-003: API failure during narration

**Priority:** P1
**Preconditions:** Story loaded, user clicks Play, narration API will fail.

**Given** `/api/generate-narration` returns an error
**When** `narrationManager.fetchNarration()` catches the error
**Then**:
  - The error is logged to console: `"TTS synthesis failed"`
  - `isNarrationLoading` transitions to `false`
  - No audio plays
  - The play button returns to the play emoji (not stuck on hourglass)
  - No crash occurs; the reading view remains functional

**Data Assertions:**
  - `isNarrating` remains `true` (but no audio source is active)
  - User can retry by clicking Play again

---

### TC-ERR-004: ErrorBoundary catches render error

**Priority:** P0
**Preconditions:** A component within the Setup or ReadingView throws a render error.

**Given** a component inside an `<ErrorBoundary>` throws an unhandled JavaScript error during render
**When** `getDerivedStateFromError(error)` is triggered
**Then** the `ErrorBoundary` fallback UI renders:
  - Dark slate background with red border: `bg-slate-900 text-white border-4 border-red-500`
  - Bouncing title: "POW! SPLAT!" in red with bounce animation
  - Message: "Something went wrong in the multiverse."
  - Error message displayed in monospace font within a dark box
  - "Try Again" button (blue, comic-btn styling)
  - `componentDidCatch` logs the error and error info to console

**When** the user clicks "Try Again"
**Then**:
  - `setState({ hasError: false, error: null })` resets the boundary
  - The child components attempt to re-render
  - If the error was transient, normal UI restores

---

### TC-ERR-005: Recovery from errors (dismiss and retry)

**Priority:** P1
**Preconditions:** An error banner is displayed after a failed story generation.

**Given** the error banner shows "Mission Failed: Network timeout"
**When** the user clicks "Dismiss"
**Then** `onClearError()` calls `setError(null)` and the banner animates out

**When** the user types in any input field
**Then** `handleInputChange` clears the error: `if (error) setError(null)`

**When** the user retries "ENGAGE MISSION" (assuming network is restored)
**Then** story generation proceeds normally

---

### TC-ERR-006: Offline generation attempt

**Priority:** P1
**Preconditions:** Browser goes offline during setup.

**Given** the user fills in classic mode fields while online
**And** the browser goes offline (`navigator.onLine === false`)
**When** the `offline` event fires
**Then**:
  - `isOnline` state transitions to `false`
  - The offline banner appears at the top
  - The "ENGAGE MISSION" button becomes disabled (`!isOnline` condition)

**When** the user somehow triggers `generateStory()` (e.g., via keyboard shortcut)
**Then**:
  - The early return fires: `if (!isOnline) { setError("You are currently offline..."); return; }`
  - Error banner displays the offline message

**When** the browser comes back online
**Then**:
  - `isOnline` transitions to `true`
  - The offline banner disappears
  - The launch button re-enables (if other conditions met)

---

## 12. Test Suite: Offline/PWA

### TC-OFF-001: Load cached story while offline

**Priority:** P0
**Preconditions:** IndexedDB contains a saved story with scenes. Browser is offline.

**Given** the app is offline (banner visible)
**And** the user opens the Memory Jar
**When** the user clicks on a saved story
**Then**:
  - `loadStoryFromHistory(cached)` executes successfully
  - Story data is loaded from the `CachedStory` object (already in memory from `initData`)
  - Avatar and scenes are loaded from the cached data
  - Phase transitions to `'reading'`
  - The story renders fully with all text parts
  - The user can navigate between parts using choices

---

### TC-OFF-002: Play cached narration while offline

**Priority:** P1
**Preconditions:** Browser offline. A narration audio buffer was previously cached in IndexedDB audio store.

**Given** the user is reading a cached story offline
**When** the user clicks Play
**Then**:
  - `narrationManager.fetchNarration()` misses memory cache
  - IndexedDB `getAudio(cacheKey)` returns the cached `ArrayBuffer`
  - The audio is decoded and plays successfully
  - No network request is attempted after the cache hit

---

### TC-OFF-003: Attempt generation while offline

**Priority:** P1
**Preconditions:** Browser offline.

**Given** the user is on the setup phase while offline
**When** the user attempts any generation action:
  - Story generation: button is disabled by `!isOnline` in the disabled prop
  - Avatar generation: `generateAvatar()` early returns with error "You are offline. Connect to internet to generate avatar."
  - Scene generation: `generateScene()` early returns when `!isOnline`
  - Narration generation: `fetchNarration()` will attempt API call and fail, but cached audio still works
**Then** no network requests are made for generation (early returns)

---

### TC-OFF-004: Service worker update

**Priority:** P2
**Preconditions:** App is running with an older service worker. A new version is available.

**Given** the service worker detects an update
**When** the new service worker activates
**Then**:
  - Cached assets are updated
  - The app continues functioning with new code on next navigation
  - IndexedDB data (stories, audio, preferences) is preserved across updates

---

## 13. Test Suite: Responsive/Mobile

### TC-RSP-001: Layout at mobile breakpoint (< 768px)

**Priority:** P1
**Preconditions:** Viewport width set to 375px (iPhone SE).

**Given** the app renders at mobile width
**When** the setup phase displays
**Then**:
  - The main container has `py-6 px-4` padding
  - The setup card has `p-4` padding (not `p-10`)
  - Hero name input is `text-3xl` (not `text-5xl`)
  - Voice selector buttons are `w-24 p-3` (not `w-32 p-4`)
  - Length slider icons are `w-12 h-12` (not `w-16 h-16`)
  - The launch button is `py-5 text-2xl` (not `py-6 text-4xl`)
  - The mode dock buttons show icons stacked above labels at compact size
  - Settings and Memory Jar buttons remain in the top-right corner

**When** the reading view displays
**Then**:
  - Content padding is `px-4 py-16` (not `px-12 py-24`)
  - Story title is `text-3xl` (not `text-5xl` or `text-6xl`)
  - Avatar is `w-28 h-28` (not `w-40 h-40`)
  - Choice buttons are single column (`grid-cols-1`)
  - Control hub play button is `text-3xl w-14 h-14` (not `text-5xl w-20 h-20`)
  - Speed buttons are `text-[8px]` (not `text-[10px]`)
  - Header controls use `p-3` padding

---

### TC-RSP-002: Layout at tablet breakpoint (768px - 1024px)

**Priority:** P2
**Preconditions:** Viewport width set to 768px (iPad).

**Given** the app renders at tablet width
**When** examining the layout
**Then**:
  - The `md:` breakpoint styles activate
  - Setup card has `md:p-10` padding
  - Voice selector buttons are `md:w-32 md:p-4`
  - Choice buttons are 2-column grid (`md:grid-cols-2`)
  - Control hub has `md:p-6` padding with `md:gap-12` gaps
  - Sleep mode theme grid is 2 columns
  - The Memory Jar drawer is `md:w-96` (not full width)
  - Settings modal sidebar is vertical (`md:flex-col`, `md:w-48`)

---

### TC-RSP-003: Layout at desktop breakpoint (>= 1024px)

**Priority:** P2
**Preconditions:** Viewport width set to 1440px.

**Given** the app renders at desktop width
**When** examining the layout
**Then**:
  - The `lg:` breakpoint styles activate
  - Story title in reading view is `lg:text-6xl`
  - Text content is `lg:text-2xl` (normal) or `lg:text-4xl` (large font)
  - Content padding includes `lg:px-24`
  - The `max-w-prose` constraint keeps text at readable width
  - The `max-w-4xl` constraint limits the setup card width
  - The header title is `lg:text-9xl`

---

### TC-RSP-004: Touch interactions

**Priority:** P1
**Preconditions:** Device with touch input.

**Given** the user interacts via touch
**When** the user taps the launch button
**Then** the `active:translate-y-1` class provides tactile press feedback

**When** the user taps a choice button
**Then** `active:scale-[0.97]` provides press feedback

**When** the user taps the play button
**Then** `active:scale-90` provides press feedback

**When** the user swipes the Memory Jar drawer
**Then** the drawer can be dismissed by clicking the backdrop (no swipe-to-close implemented, but backdrop click works)

---

## 14. Test Suite: Accessibility

### TC-A11Y-001: Keyboard-only navigation through setup

**Priority:** P1
**Preconditions:** App loaded, no mouse/touch input.

**Given** the user navigates using only keyboard (Tab, Shift+Tab, Enter, Space)
**When** the user presses Tab from the page start
**Then** focus moves through the following elements in order:
  1. Memory Jar button (`aria-label="Open Memory Jar"`)
  2. Settings button (`aria-label="Settings"`)
  3. Mode dock buttons (Classic, Mad Libs, Sleepy)
  4. Hero name input (autofocused on classic step 0)
  5. Back button (disabled on step 0, `aria-label="Go back"`)
  6. Next button
  7. (After advancing) Setting input, then navigation buttons
  8. (On step 2) Avatar generate button (`aria-label="Generate new avatar"`)
  9. Length slider step buttons (each with `aria-label` and `aria-pressed`)
  10. Voice selector buttons (each with `role="radio"` and `aria-checked`)
  11. Launch button (`aria-label="Start Story"`)

**And** all interactive elements have visible focus indicators:
  - Voice buttons: `ring-blue-500 focus:ring-2` (via outline styles)
  - Sleep theme buttons: `focus:ring-4 focus:ring-indigo-500/50`
  - Reading view controls: `ring-blue-500 focus:ring-2`

---

### TC-A11Y-002: Keyboard-only navigation through reading

**Priority:** P1
**Preconditions:** Story loaded in reading view.

**Given** the user navigates the reading view with keyboard
**When** the user presses Tab
**Then** focus moves through:
  1. "Menu" button (`aria-label="Back to home"`)
  2. Font size button (`aria-label="Adjust font size"`)
  3. Mute/unmute button (`aria-label` changes based on state)
  4. Choice buttons (when visible, within `<nav aria-label="Story Decisions">`)
  5. "MISSION COMPLETE" button (when on last part)
  6. Play button (`aria-label` toggles between "Pause" and "Play")
  7. Stop button (`aria-label="Stop Playback"`)
  8. Speed buttons (within `role="group" aria-label="Playback speed"`, each with `aria-pressed`)

**When** the user presses Enter on a choice button
**Then** the choice is selected and the story advances

---

### TC-A11Y-003: Screen reader announcements

**Priority:** P1
**Preconditions:** Screen reader enabled (NVDA, VoiceOver, or JAWS).

**Given** a screen reader is active
**When** the setup page loads
**Then** the following ARIA landmarks and labels are announced:
  - `<main role="main">` identifies the main content
  - Memory Jar button: "Open Memory Jar"
  - Settings button: "Settings"
  - Each voice option: `role="radio"`, `aria-checked` state announced
  - Voice group: `role="radiogroup"`, `aria-label="Narrator Voices"`
  - Length options: `aria-pressed` state and `aria-label` with duration info
  - Launch button: "Start Story"

**When** the reading view loads
**Then**:
  - `<main aria-label="Reading story: {title}">` announces the story title
  - Choice navigation: `<nav aria-label="Story Decisions">`
  - Playback controls: `<nav aria-label="Playback Controls">`
  - Speed group: `role="group" aria-label="Playback speed"`
  - Play button: "Play" or "Pause" based on state

**When** the Memory Jar drawer opens
**Then**:
  - `role="dialog"`, `aria-modal="true"`, `aria-label="Memory Jar - Saved Stories"` announced
  - Each story card button: `aria-label="Open story {title}"`
  - Delete button: `aria-label="Delete {title}"`
  - Close button: `aria-label="Close Memory Jar"`

---

### TC-A11Y-004: Focus management on transitions

**Priority:** P1
**Preconditions:** App functional with keyboard navigation.

**Given** the user is on the setup phase
**When** a story generates and the phase transitions to `'reading'`
**Then**:
  - The `ReadingView` component renders with `initial={{ opacity: 0 }}`
  - Focus should move to the reading view main element
  - The story title and content are immediately accessible

**When** the user clicks "Menu" to return to setup
**Then**:
  - `reset()` returns to setup phase
  - Focus should move to the setup main content area
  - The hero name input (autofocus on classic step 0) receives focus

**When** the Settings modal opens
**Then**:
  - Focus is trapped within the modal (`z-[1000]` overlay)
  - The first focusable element (General tab) is accessible
  - Pressing Escape or clicking X closes the modal and returns focus

**When** the Memory Jar drawer opens
**Then**:
  - The drawer has `role="dialog"` and `aria-modal="true"`
  - Focus should move into the drawer
  - Clicking the backdrop or Close button dismisses and returns focus

**When** the error banner appears
**Then**:
  - The "Dismiss" button is focusable
  - Screen readers announce the error content

---

## Appendix: Test Data Fixtures

### Default Story Input (Classic)
```json
{
  "heroName": "",
  "heroPower": "",
  "setting": "",
  "sidekick": "",
  "problem": "",
  "heroAvatarUrl": "",
  "mode": "classic",
  "madlibs": { "adjective": "", "place": "", "food": "", "sillyWord": "", "animal": "" },
  "sleepConfig": {
    "subMode": "automatic",
    "texture": "",
    "sound": "",
    "scent": "",
    "theme": "Cloud Kingdom",
    "ambientTheme": "auto"
  },
  "narratorVoice": "Kore",
  "storyLength": "medium"
}
```

### Default User Preferences
```json
{
  "narratorVoice": "Kore",
  "storyLength": "medium",
  "sleepTheme": "Cloud Kingdom",
  "fontSize": "normal",
  "isMuted": false,
  "reducedMotion": false
}
```

### Sample StoryFull Response
```json
{
  "title": "The Crystal Cavern",
  "parts": [
    { "text": "Once upon a time...", "choices": ["Go left", "Go right", "Stay put"], "partIndex": 0 },
    { "text": "The hero ventured forth...", "choices": ["Fight", "Flee", "Talk"], "partIndex": 1 },
    { "text": "At the summit...", "choices": [], "partIndex": 2 }
  ],
  "vocabWord": { "word": "Luminescent", "definition": "Giving off light without heat" },
  "joke": "Why did the hero cross the road? To get to the adventure!",
  "lesson": "True courage is being afraid and doing it anyway.",
  "tomorrowHook": "But little did they know, a new mystery was just beginning...",
  "rewardBadge": { "emoji": "🏆", "title": "Crystal Champion", "description": "You conquered the Crystal Cavern!" }
}
```

### Available Narrator Voices
| ID | Icon | Label |
|---|---|---|
| Kore | flower | Soothing |
| Aoede | bird | Melodic |
| Zephyr | leaf | Gentle (Soft) |
| Leda | sparkle | Ethereal (Soft) |
| Puck | fox | Playful |
| Charon | bear | Deep |
| Fenrir | wolf | Bold |

### Available Ambient Themes
| ID | Label | Audio Type |
|---|---|---|
| rain | Gentle Rain | Pink noise + white noise patter |
| forest | Forest Night | Pink noise wind + high-pass leaves |
| ocean | Midnight Ocean | Brown noise waves + pink noise spray |
| crickets | Night Crickets | Pink noise + procedural chirps (4500Hz) |
| space | Cosmic Hum | Brown noise + detuned sine drones (55Hz) |
| magic | Ethereal Spark | White noise bandpass sweep |
| auto | Silence | No audio |

### IndexedDB Schema
| Store Name | Key | Description |
|---|---|---|
| `stories` | `id` (keyPath) | CachedStory objects |
| `audio` | string (manual key) | ArrayBuffer of PCM audio |
| `preferences` | `'user_settings'` | UserPreferences object |

**DB Name:** `BedtimeChroniclesDB`
**DB Version:** 4
