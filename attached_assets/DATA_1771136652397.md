# Data Layer & Storage Documentation

Infinity Heroes: Bedtime Chronicles uses a three-tier storage architecture combining in-memory caches, IndexedDB for persistent client-side storage, and service worker caching for offline PWA support. This document covers every storage mechanism in the application.

---

## 1. Storage Overview

The application stores data across three distinct tiers, each serving a different purpose:

| Tier | Technology | Scope | Persistence | Primary Use |
|------|-----------|-------|-------------|-------------|
| **L1 - Memory Cache** | JavaScript `Map` / React state | Current browser session | Until page refresh | Audio buffers (decoded), current story state |
| **L2 - IndexedDB** | `BedtimeChroniclesDB` (version 4) | Per-origin, persistent | Survives refresh and browser restart | Stories, audio (raw PCM), user preferences |
| **L3 - Service Worker** | Workbox (vite-plugin-pwa) | Per-origin, persistent | Managed by Workbox expiration rules | Static assets, Google Fonts |

Data flows downward on write (API response -> memory -> IndexedDB) and upward on read (memory first, then IndexedDB, then network).

---

## 2. IndexedDB Schema

### Database Identity

- **Database name:** `BedtimeChroniclesDB`
- **Current version:** `4`
- **Defined in:** `lib/StorageManager.ts`

### Object Stores

#### `stories`

Stores complete generated stories with associated metadata, avatar images, scene illustrations, and user feedback.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` (keyPath) | UUID generated via `crypto.randomUUID()` |
| `timestamp` | `number` | `Date.now()` at creation time |
| `story` | `StoryFull` | The complete story object (see below) |
| `avatar` | `string?` | Base64 data URI of the hero avatar image |
| `scenes` | `Record<number, string>?` | Map of `partIndex` to base64 data URI scene illustrations |
| `feedback` | `{ rating: number, text: string, timestamp: number }?` | User-submitted feedback |

**Key configuration:** `{ keyPath: 'id' }` -- uses inline keys.
**Indexes:** None defined.

The `StoryFull` type stored within each record:

```typescript
interface StoryFull {
    title: string;
    parts: StoryPart[];           // Array of { text, choices?, partIndex }
    vocabWord: { word: string; definition: string };
    joke: string;
    lesson: string;
    tomorrowHook: string;
    rewardBadge: { emoji: string; title: string; description: string };
}
```

#### `audio`

Stores raw PCM audio data for text-to-speech narration. Uses out-of-line keys (no keyPath).

| Key | Value Type | Description |
|-----|-----------|-------------|
| Cache key string (see Section 4) | `ArrayBuffer` | Raw 16-bit PCM audio at 24kHz mono |

**Key configuration:** No keyPath (out-of-line keys passed to `put(data, key)`).
**Indexes:** None defined.

#### `preferences`

Stores user settings. Uses out-of-line keys with a single well-known key.

| Key | Value Type | Description |
|-----|-----------|-------------|
| `"user_settings"` | `UserPreferences` | User configuration object |

**Key configuration:** No keyPath (out-of-line keys).
**Indexes:** None defined.

The `UserPreferences` type:

```typescript
interface UserPreferences {
    narratorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede' | 'Zephyr' | 'Leda';
    storyLength: 'short' | 'medium' | 'long' | 'eternal';
    sleepTheme: string;
    fontSize: 'normal' | 'large';
    isMuted: boolean;
    reducedMotion: boolean;
}
```

Default values when no preferences exist:

```typescript
const DEFAULT_PREFERENCES: UserPreferences = {
    narratorVoice: 'Kore',
    storyLength: 'medium',
    sleepTheme: 'Cloud Kingdom',
    fontSize: 'normal',
    isMuted: false,
    reducedMotion: false
};
```

### Version History

| Version | Change |
|---------|--------|
| 1 | Initial: `stories` store created |
| 2-3 | Added `audio` store |
| 4 | Added `preferences` store |

---

## 3. StorageManager API

**File:** `lib/StorageManager.ts`
**Export:** Singleton instance `storageManager`

The `StorageManager` class wraps all IndexedDB operations behind an async Promise-based API. It auto-initializes the database connection on first use via lazy `init()`.

### Methods

#### `init(): Promise<void>`

Initializes the IndexedDB connection. Called automatically by all other methods. Safe to call multiple times (no-ops if already connected). Handles the `onupgradeneeded` event to create object stores.

#### `savePreferences(prefs: UserPreferences): Promise<void>`

Persists user preferences to the `preferences` store under the key `"user_settings"`. Uses `put()` so it overwrites any existing value.

```typescript
await storageManager.savePreferences({
    narratorVoice: 'Puck',
    storyLength: 'long',
    sleepTheme: 'Starlight Forest',
    fontSize: 'large',
    isMuted: false,
    reducedMotion: false
});
```

#### `getPreferences(): Promise<UserPreferences>`

Retrieves user preferences. Returns `DEFAULT_PREFERENCES` if no saved preferences exist.

```typescript
const prefs = await storageManager.getPreferences();
// prefs.narratorVoice === 'Kore' (default if never saved)
```

#### `saveStory(story: StoryFull, avatar?: string): Promise<string>`

Saves a newly generated story. Generates a UUID via `crypto.randomUUID()`, timestamps it, and returns the new ID. Initializes an empty `scenes` map.

```typescript
const storyId = await storageManager.saveStory(generatedStory, avatarDataUri);
// storyId: "a1b2c3d4-..."
```

#### `saveStoryScene(id: string, partIndex: number, image: string): Promise<void>`

Attaches a scene illustration to an existing story. Performs a get-then-put within a single readwrite transaction. Throws if the story ID is not found.

```typescript
await storageManager.saveStoryScene(storyId, 2, base64ImageDataUri);
```

#### `updateFeedback(id: string, rating: number, text: string): Promise<void>`

Adds or updates feedback on a story. Performs a get-then-put. Throws if the story ID is not found.

```typescript
await storageManager.updateFeedback(storyId, 5, "My kid loved this story!");
```

#### `getAllStories(): Promise<CachedStory[]>`

Retrieves all stories, sorted by timestamp descending (newest first).

```typescript
const stories = await storageManager.getAllStories();
// stories[0] is the most recently created
```

#### `deleteStory(id: string): Promise<void>`

Deletes a story by ID from the `stories` store.

```typescript
await storageManager.deleteStory("a1b2c3d4-...");
```

#### `saveAudio(key: string, data: ArrayBuffer): Promise<void>`

Saves raw PCM audio data to the `audio` store. Uses `put()` so it overwrites if the key already exists.

```typescript
await storageManager.saveAudio("v1:Kore:Once upon a time in a l_142", pcmArrayBuffer);
```

#### `getAudio(key: string): Promise<ArrayBuffer | undefined>`

Retrieves cached audio data by key. Returns `undefined` on cache miss.

```typescript
const audioData = await storageManager.getAudio(cacheKey);
if (audioData) {
    // Decode and play
}
```

### Error Handling

All methods propagate IndexedDB errors as rejected Promises. Callers are responsible for catching errors. The `useStoryEngine` hook wraps most calls in try/catch blocks and surfaces errors to the UI via `setError()`. Audio save failures are caught and logged but do not interrupt playback:

```typescript
storageManager.saveAudio(cacheKey, bytes.buffer)
    .catch(err => console.error("Save audio failed", err));
```

---

## 4. Audio Caching

### Cache Key Format

Audio cache keys follow this pattern:

```
v1:{voiceName}:{first 30 chars of text}_{text length}
```

Examples:
- `v1:Kore:Once upon a time in a land f_523`
- `v1:Puck:The brave hero stepped forwar_892`

The `v1` prefix acts as a cache version namespace. Changing voices or text content produces different keys, ensuring correct audio retrieval.

**Defined in:** `NarrationManager.ts`, line 114:
```typescript
const cacheKey = `v1:${voiceName}:${text.substring(0, 30)}_${text.length}`;
```

### Memory Cache (L1)

- **Type:** `Map<string, AudioBuffer>` (in `NarrationManager`)
- **Scope:** Lives for the duration of the page session
- **Content:** Decoded `AudioBuffer` objects ready for immediate playback via Web Audio API
- **Eviction:** Cleared on page refresh; no explicit size limits

### Persistent Cache (L2)

- **Type:** `ArrayBuffer` stored in IndexedDB `audio` object store
- **Content:** Raw 16-bit PCM bytes at 24kHz mono (the format returned by Gemini TTS API, before decoding into AudioBuffer)
- **Eviction:** None currently implemented; data persists until manually cleared or browser storage eviction

### Cache Lookup Flow

```
fetchNarration(text, voice)
        |
        v
  [1] Memory Cache (Map)  ──hit──> decode not needed, play immediately
        |
      miss
        v
  [2] IndexedDB (audio store) ──hit──> decode PCM to AudioBuffer
        |                                 |
      miss                          store in Memory Cache
        v                                 |
  [3] API (/api/generate-narration)       play
        |
     response
        |
     decode base64 to Uint8Array
        |
     save to IndexedDB (fire-and-forget)
        |
     decode PCM to AudioBuffer
        |
     store in Memory Cache
        |
     play
```

### Preloading

In sleep mode and during manual narration, the engine preloads the next story part's audio with `autoPlay: false`. This populates both caches without starting playback, enabling near-instant transitions between parts.

```typescript
// Current part plays immediately
await narrationManager.fetchNarration(currentText, voice, true);

// Next part preloads silently
narrationManager.fetchNarration(nextText, voice, false)
    .catch(err => console.warn("Preload failed", err));
```

---

## 5. Story Persistence

### How Stories Are Saved

1. User fills out the setup form (hero name, power, setting, etc.)
2. `generateStory()` in `useStoryEngine` calls `AIClient.streamStory(input)` to get the `StoryFull` object from the API
3. The story is immediately saved to IndexedDB via `storageManager.saveStory(data, avatarUrl)`
4. A UUID is returned and stored as `currentStoryId` in React state
5. The story history list is refreshed from IndexedDB

### Subsequent Updates

- **Scene illustrations** are saved as they are generated: `storageManager.saveStoryScene(id, partIndex, imageDataUri)`
- **Feedback** is saved when submitted: `storageManager.updateFeedback(id, rating, text)`

### How Stories Are Loaded

1. On app initialization, `useStoryEngine` loads all stories via `storageManager.getAllStories()`
2. Stories appear in the "Memory Jar" sidebar (`MemoryJar.tsx`), sorted newest-first
3. Clicking a saved story calls `loadStoryFromHistory(cached)`, which:
   - Sets the story in React state
   - Restores the avatar and scene images
   - Switches to reading phase

### Data Format (CachedStory)

```typescript
interface CachedStory {
    id: string;                              // UUID
    timestamp: number;                       // Date.now() at creation
    story: StoryFull;                        // Full story content
    avatar?: string;                         // Base64 data URI
    scenes?: Record<number, string>;         // partIndex -> base64 data URI
    feedback?: {
        rating: number;
        text: string;
        timestamp: number;
    };
}
```

### Export/Download

Users can download stories as JSON files from the Memory Jar. The download contains only the `StoryFull` object (not the avatar or scenes):

```typescript
const blob = new Blob([JSON.stringify(story.story, null, 2)], { type: 'application/json' });
```

---

## 6. PWA Caching Strategy

**Configuration file:** `vite.config.ts`
**Plugin:** `vite-plugin-pwa` with Workbox

### Registration

```typescript
VitePWA({
    registerType: 'autoUpdate',
    manifest: false,  // Uses existing metadata.json instead of generated manifest
    ...
})
```

The `autoUpdate` registration type means the service worker updates automatically in the background and takes control on next navigation.

### Precache (Build-Time)

```typescript
workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: '/index.html',
    ...
}
```

| Pattern | Assets Cached |
|---------|--------------|
| `**/*.js` | Compiled JavaScript bundles |
| `**/*.css` | Stylesheets |
| `**/*.html` | HTML pages (index.html) |
| `**/*.ico` | Favicon |
| `**/*.png` | Static images |
| `**/*.svg` | SVG icons and illustrations |
| `**/*.woff2` | Web fonts bundled with the app |

The `navigateFallback: '/index.html'` ensures all navigation requests fall back to the SPA shell, enabling offline navigation.

### Runtime Caching

| Rule | URL Pattern | Strategy | Cache Name | Expiration |
|------|------------|----------|------------|------------|
| Google Fonts | `^https://fonts.(googleapis\|gstatic).com/.*` | **CacheFirst** | `google-fonts` | 10 entries, 365 days |

**CacheFirst** means the service worker serves from cache if available, only going to the network on a cache miss. This is appropriate for Google Fonts since they are immutable versioned resources.

### What Is NOT Cached by the Service Worker

- API responses (`/api/*`) -- story generation, avatar generation, narration generation, scene generation
- IndexedDB data (handled separately by the application layer)
- Dynamic audio content (handled by NarrationManager + IndexedDB)

---

## 7. Data Lifecycle

### Creation

| Data Type | Created When | Where Stored |
|-----------|-------------|--------------|
| User preferences | First time user changes a setting | IndexedDB `preferences` store |
| Story | User clicks "Launch" / generates a story | IndexedDB `stories` store |
| Avatar image | User clicks "Generate Avatar" | Inline in `stories` record as base64 data URI |
| Scene illustration | User requests scene for a story part | Added to `stories` record's `scenes` map |
| Audio narration | First time a text+voice combo is narrated | Memory cache (AudioBuffer) + IndexedDB `audio` store (ArrayBuffer) |
| Feedback | User submits rating/feedback | Added to `stories` record |

### Updates

- **Preferences** are overwritten on every save (single `"user_settings"` key)
- **Stories** are updated in-place when scenes or feedback are added (get-then-put pattern)
- **Audio** entries are written once and never updated (immutable by key design)

### Deletion

- **Stories** can be deleted individually by the user from the Memory Jar UI
- **Audio** cache entries are never explicitly deleted by the application
- **Preferences** are never deleted (only overwritten)

### Storage Limits and Cleanup

The application does **not** implement explicit storage quota management or cleanup routines. Storage is subject to browser-imposed limits:

- **IndexedDB:** Browsers typically allow up to a percentage of available disk space (e.g., Chrome allows up to 80% of total disk, capped per origin). When the quota is exceeded, writes will fail with `QuotaExceededError`.
- **Service Worker Cache:** Subject to the same origin storage quota.
- **Potential concern:** The `audio` store grows unboundedly since there is no eviction policy. Each audio entry is a raw PCM buffer (typically 50KB-500KB depending on text length). Over time with heavy usage, this could accumulate significant storage.

---

## 8. Offline Support

### What Works Offline

| Feature | Offline Support | Notes |
|---------|----------------|-------|
| Reading saved stories | Yes | Full text, avatar, and scenes loaded from IndexedDB |
| Browsing Memory Jar | Yes | Story list loaded from IndexedDB on init |
| Playing cached narration | Yes | Audio retrieved from IndexedDB, decoded to AudioBuffer |
| Changing preferences | Yes | Saved to IndexedDB locally |
| App shell / navigation | Yes | Service worker serves precached assets |
| Sound effects | Yes | Procedurally generated via Web Audio API (no files needed) |
| Ambient sounds | Yes | Procedurally generated via Web Audio API (no files needed) |

### What Requires Network

| Feature | Requires Network | Notes |
|---------|-----------------|-------|
| Generating new stories | Yes | Calls `/api/generate-narration` (Gemini API) |
| Generating avatars | Yes | Calls `/api/generate-avatar` (Gemini API) |
| Generating scene illustrations | Yes | Calls `/api/generate-scene` (Gemini API) |
| Generating new narration audio | Yes | Calls `/api/generate-narration` (Gemini TTS) |
| Google Fonts (first load) | Yes | Cached by service worker after first fetch |

### Online/Offline Detection

The `useStoryEngine` hook monitors connectivity via browser events:

```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

window.addEventListener('online', handleStatus);
window.addEventListener('offline', handleStatus);
```

When offline, the UI prevents users from attempting network-dependent operations (story generation, avatar generation, scene generation) and displays appropriate error messages.

---

## 9. Migration Considerations

### IndexedDB Version Upgrades

The `onupgradeneeded` handler in `StorageManager.init()` uses a defensive pattern -- it checks for existence of each store before creating it:

```typescript
request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio');
    }
    if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences');
    }
};
```

This means the upgrade runs correctly regardless of which previous version the user is on (version 1, 2, 3, or fresh install). All stores are created if missing.

### Adding New Object Stores

To add a new object store:

1. Increment `DB_VERSION` in `lib/StorageManager.ts`
2. Add a new `if (!db.objectStoreNames.contains('new_store'))` block inside `onupgradeneeded`
3. Add corresponding read/write methods to the `StorageManager` class

### Adding Indexes to Existing Stores

Adding indexes to existing stores requires care:

1. Increment `DB_VERSION`
2. In `onupgradeneeded`, access the existing store via `transaction.objectStore('storeName')` and call `createIndex()`
3. Note: the upgrade transaction provides access to existing stores

### Audio Cache Key Versioning

The audio cache key prefix (`v1:`) provides a namespace for future format changes. If the TTS API output format changes (e.g., different sample rate, encoding), a new version prefix (`v2:`) would effectively invalidate old cache entries without needing to delete them -- they simply would never be looked up again.

### Data Migration Risks

- **No schema validation on read:** Data retrieved from IndexedDB is cast directly to `CachedStory` or `UserPreferences` without runtime validation. If the shape of these types changes, old records may cause runtime errors.
- **No data migration logic:** There is no code to transform existing records when upgrading. If `StoryFull` gains new required fields, old stories loaded from IndexedDB will be missing those fields.
- **Recommendation:** Consider adding runtime validation or default-merging when reading records, particularly for `UserPreferences` (which already falls back to `DEFAULT_PREFERENCES` on miss but not on partial/malformed data).
