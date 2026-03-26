<!-- Last verified: 2026-03-26 -->
# PERFORMANCE-AGENT.md — Performance & Optimization Expert

Specialized agent context for all work touching app performance, caching strategies, bundle optimization, React Query configuration, and memory management.

---

## Domain Scope

This agent is authoritative for:
- `lib/query-client.ts` — TanStack React Query client configuration
- React Query caching strategies across all API calls
- Bundle size optimization (Metro bundler, esbuild)
- React Native render performance (memoization, list optimization)
- TTS audio cache management
- Server-side in-memory story cache (`server/storage.ts`)
- `react-native-reanimated` performance (JS thread vs UI thread)
- `expo-image` for image caching
- Memory leak prevention (sound unloading, effect cleanup)

---

## React Query Configuration (`lib/query-client.ts`)

```typescript
// Current configuration — modify carefully
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,          // Never stale — all data is considered fresh
      retry: false,                  // No automatic retries (costs AI credits)
      refetchOnWindowFocus: false,   // Never refetch on focus (mobile UX)
      gcTime: 1000 * 60 * 30,        // 30 min garbage collection
    },
    mutations: {
      retry: false,
    },
  },
});
```

### Query Key Conventions

```typescript
// Stable, serializable query keys
queryKeys.stories = ['stories'] as const;
queryKeys.story = (id: string) => ['story', id] as const;
queryKeys.voices = ['voices'] as const;
queryKeys.aiProviders = ['ai-providers'] as const;
queryKeys.suggestions = (heroType: string, ageRange: string) =>
  ['suggestions', heroType, ageRange] as const;
```

### Cache Invalidation
Story cache is invalidated after successful save/delete:
```typescript
await queryClient.invalidateQueries({ queryKey: queryKeys.stories });
```

---

## Server-Side Caching

### TTS Cache

TTS audio files are cached in `/tmp/tts-cache` with hex-hash filenames:
- TTL: `TTS_CACHE_MAX_AGE_MS` (default 24h)
- Cache is **not** shared across server restarts in Replit serverless
- Identical text+voice combos return the same cached file (hash collision prevention via content hash)

```typescript
// Cache hit check before calling ElevenLabs
const hash = computeHash(text + voiceKey);
const cachedPath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);
if (await fileExists(cachedPath)) {
  return cachedPath;  // Skip expensive TTS call
}
```

---

## React Native Render Performance

### Memoization Rules

```typescript
// ✅ Memoize expensive computations
const sortedStories = useMemo(
  () => stories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [stories]
);

// ✅ Stabilize callback refs
const handlePress = useCallback(() => {
  router.push('/story');
}, []); // stable — no deps

// ✅ Memoize pure child components with expensive renders
const StoryCard = memo(({ story }: Props) => { ... });
```

### List Performance

```typescript
// ✅ Use FlatList (or FlashList from @shopify/flash-list for very long lists)
<FlatList
  data={stories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <StoryCard story={item} />}
  getItemLayout={(_, index) => ({        // ✅ Enable if items have fixed height
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>

// ❌ Never use ScrollView for dynamic item counts
```

---

## Animation Performance

`react-native-reanimated` runs animations on the UI thread — this is the key performance advantage over the JS-thread `Animated` API.

```typescript
// ✅ Worklet-safe — runs on UI thread
const animatedStyle = useAnimatedStyle(() => {
  'worklet';
  return { opacity: opacity.value };
});

// ❌ WRONG — don't access React state inside useAnimatedStyle
// (state reads are not worklet-safe)
```

### Avoid Re-renders During Animation

- Use `useSharedValue` for animation values — never `useState`.
- Pass animation targets via `withTiming` / `withSpring` parameters.
- `useAnimatedStyle` should only read `sharedValues` — not component state.

---

## Image Performance

```typescript
// ✅ Use expo-image for automatic caching
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={styles.heroImage}
  cachePolicy="memory-disk"    // Cache in both memory and disk
  contentFit="cover"
  placeholder={blurhash}       // Show placeholder while loading
/>

// ❌ Don't use React Native's built-in Image (no disk caching)
```

---

## Audio Memory Management

Always unload audio when component unmounts:

```typescript
const soundRef = useRef<Audio.Sound | null>(null);

useEffect(() => {
  return () => {
    soundRef.current?.unloadAsync();
    soundRef.current = null;
  };
}, []);
```

Release sound on track switch:
```typescript
const playNewTrack = async (uri: string) => {
  await soundRef.current?.unloadAsync();
  const { sound } = await Audio.Sound.createAsync({ uri });
  soundRef.current = sound;
  await sound.playAsync();
};
```

---

## Bundle Size Optimization

### Metro (Client Bundle)

Metro blocklist (`metro.config.js`) excludes:
- `.local/state/workflow-logs/**`

Keep client bundle lean:
- Avoid importing server-only modules in client code
- Use `@shared/*` path for truly shared code only
- Tree-shaking is active — export only what's needed

### esbuild (Server Bundle)

Server bundle config (`scripts/build.js`):
```javascript
// ESM output, node18 target, all deps external
esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  format: 'esm',
  target: 'node18',
  outfile: 'server_dist/index.js',
  // external: ['pg', 'drizzle-orm'] — native deps kept external
});
```

---

## React Compiler

React Compiler is enabled via `app.json`:
```json
{ "experiments": { "reactCompiler": true } }
```

This automatically applies memoization where safe. However, still manually memoize in performance-critical list renders.

---

## New Architecture

React Native New Architecture is enabled (`newArchEnabled: true` in `app.json`). This enables:
- JSI (faster JS ↔ native bridge)
- Concurrent rendering
- Turbo Modules

Avoid legacy bridge APIs — prefer the new architecture-compatible Expo SDK APIs.

---

## Performance Monitoring Checklist

Before merging performance-sensitive changes:

- [ ] No unnecessary re-renders (check with React DevTools profiler)
- [ ] Lists use `FlatList` / `FlashList`, not `ScrollView`
- [ ] Callbacks are memoized with `useCallback`
- [ ] Expensive computations use `useMemo`
- [ ] Animations run on UI thread (use `reanimated`, not `Animated`)
- [ ] Sounds are unloaded on unmount
- [ ] Images use `expo-image` with appropriate `cachePolicy`
- [ ] No inline `StyleSheet` objects in render (use `StyleSheet.create`)

---

## What This Agent Must Flag for Human Review

- Changes to React Query `staleTime` or `gcTime` defaults (affects all queries)
- Changes to TTS cache TTL (affects audio freshness)
- New dependencies that significantly increase bundle size
- Disabling React Compiler in `app.json`

---

## Related Agent Files

- [`FRONTEND-MOBILE-AGENT.md`](./FRONTEND-MOBILE-AGENT.md) — Component and screen patterns
- [`DESIGN-SYSTEM-AGENT.md`](./DESIGN-SYSTEM-AGENT.md) — Animation patterns
- [`DEVOPS-DEPLOYMENT-AGENT.md`](./DEVOPS-DEPLOYMENT-AGENT.md) — Build system
- [`AUDIO-TTS-AGENT.md`](./AUDIO-TTS-AGENT.md) — Audio memory management
