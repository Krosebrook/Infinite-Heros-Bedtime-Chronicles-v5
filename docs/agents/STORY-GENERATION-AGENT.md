<!-- Last verified: 2026-03-26 -->
# STORY-GENERATION-AGENT.md — Story Generation Expert

Specialized agent context for all work touching story creation, AI prompt engineering for story content, story modes, and the story lifecycle.

---

## Domain Scope

This agent is authoritative for:
- `POST /api/generate-story` — Synchronous story generation endpoint
- `POST /api/generate-story-stream` — Streaming story generation (SSE)
- `POST /api/suggest-settings` — AI-powered story recommendation
- Story prompt construction and schema enforcement
- `CHILD_SAFETY_RULES` in story prompts
- `app/story.tsx` — Story playback screen (most complex, ~49KB)
- `app/story-details.tsx` — Story customization wizard
- `app/madlibs.tsx` — Mad Libs story mode
- `app/sleep-setup.tsx` — Sleep story mode configuration
- `app/completion.tsx` — Post-story celebration + badge awarding
- `constants/types.ts` — `StoryPart`, `CachedStory` interfaces

---

## Story Modes

| Mode | Description | Voice Default | Music |
|------|-------------|--------------|-------|
| `classic` | Adventure stories with 3-choice branches | `captain` | classic.mp3 |
| `madlibs` | Silly fill-in-the-blank stories | `giggles` | fun.mp3 |
| `sleep` | Calming, meditative, no-choice stories | `moonbeam` | sleep.mp3 |

Sleep mode stories differ structurally:
- No `choices` array (no branching)
- Calm, soothing language
- Progressive relaxation arc (active → calm → sleepy)
- Voice parameters adjusted for extra stability/softness

---

## Story Duration Configuration

| Key | Parts | Target Word Count |
|-----|-------|------------------|
| `short` | 3 | 200–300 |
| `medium-short` | 4 | 350–450 |
| `medium` | 5 | 500–650 |
| `long` | 6 | 750–950 |
| `epic` | 7 | 1000–1300 |

---

## Hero Templates

8 pre-defined heroes in `constants/heroes.ts`:

| Name | Title | Theme |
|------|-------|-------|
| Nova | Guardian of Light | Courage, illumination |
| Coral | Heart of the Ocean | Kindness, nature |
| Orion | Star of Friendship | Friendship, wonder |
| Luna | Dream Weaver | Imagination, dreams |
| Nimbus | Brave Cloud | Bravery, adventure |
| Bloom | Garden Keeper | Growth, nurturing |
| Whistle | Night Train Conductor | Comfort, journey |
| Shade | Shadow Friend | Acceptance, comfort |

Users can also create custom heroes with AI-generated avatar images.

---

## Story Request Schema (Client → Server)

```typescript
interface GenerateStoryRequest {
  heroName: string;          // sanitized, max 100 chars
  heroType: string;          // from hero templates or custom
  heroPower: string;         // hero's special ability
  theme: string;             // 'courage' | 'kindness' | 'friendship' | 'wonder' | 'imagination' | 'comfort'
  setting: string;           // story world/location
  storyMode: 'classic' | 'madlibs' | 'sleep';
  duration: 'short' | 'medium-short' | 'medium' | 'long' | 'epic';
  ageRange: '2-4' | '4-6' | '6-8' | '8-10';
  childName?: string;        // optional personalization
  madlibsWords?: string[];   // required for madlibs mode
}
```

---

## Story Response Schema (AI → Server → Client)

```typescript
interface StoryResponse {
  title: string;             // 3-6 word title
  parts: StoryPart[];
  vocabWord: {
    word: string;
    definition: string;      // child-friendly explanation
  };
  joke: string;              // age-appropriate joke
  lesson: string;            // gentle life lesson (1-2 sentences)
  tomorrowHook: string;      // teaser for next story
  rewardBadge: {
    emoji: string;
    title: string;           // 2-3 words
    description: string;
  };
}

interface StoryPart {
  text: string;              // 2-4 paragraphs
  choices?: string[];        // 3 choices for classic mode; omitted for sleep
  partIndex: number;         // 0-based
}
```

---

## Content Themes

| Theme | Description | Example Story Arc |
|-------|-------------|------------------|
| `courage` | Overcoming fear or doubt | Hero faces a challenge, finds inner strength |
| `kindness` | Helping others | Hero shares, includes, or supports a friend |
| `friendship` | Making or keeping friends | Hero and new friend work together |
| `wonder` | Discovery and curiosity | Hero explores a magical place |
| `imagination` | Creative problem-solving | Hero invents a clever solution |
| `comfort` | Safety and warmth | Hero finds or creates a cozy, safe space |

---

## AI Prompt Construction

### System Prompt Template

```typescript
const systemPrompt = `${CHILD_SAFETY_RULES}

You are a master children's story writer for ages ${ageRange}. 
Write a ${storyMode} story featuring ${heroName}, a ${heroType} with the power of ${heroPower}.
Setting: ${safeSetting}
Theme: ${theme}
Duration: ${duration} (${partCount} parts, ${minWords}–${maxWords} words total)

${storyMode === 'sleep' ? SLEEP_MODE_PROMPT : CLASSIC_MODE_PROMPT}

Return ONLY valid JSON matching this schema (no markdown, no preamble):
${JSON.stringify(STORY_RESPONSE_SCHEMA, null, 2)}`;
```

### Mad Libs Mode

Mad Libs stories use user-provided words inserted into a pre-generated template. Words must be sanitized and validated for child-appropriateness before inclusion.

```typescript
// Sanitize all mad libs words
const safeWords = madlibsWords.map(w => sanitizeString(w, 50));
```

---

## Story Setting Suggestions

```
POST /api/suggest-settings
Body: { heroName, heroType, ageRange, timeOfDay? }
Response: { suggestions: SettingSuggestion[] }
```

Suggestions are time-of-day aware — sleep mode settings are recommended in evening hours.

---

## Story Streaming (SSE)

```
POST /api/generate-story-stream
```

Returns a Server-Sent Events stream. The client consumes parts as they arrive, enabling progressive display.

```typescript
// Client consumption pattern
const eventSource = new EventSource('/api/generate-story-stream');
eventSource.onmessage = (e) => {
  const part = JSON.parse(e.data) as StoryPart;
  appendPart(part);
};
eventSource.onerror = () => eventSource.close();
```

---

## Story Data Model (`constants/types.ts`)

```typescript
interface CachedStory {
  id: string;
  title: string;
  heroName: string;
  heroType: string;
  theme: string;
  storyMode: 'classic' | 'madlibs' | 'sleep';
  parts: StoryPart[];
  vocabWord: VocabWord;
  joke: string;
  lesson: string;
  tomorrowHook: string;
  rewardBadge: Badge;
  createdAt: string;          // ISO timestamp
  isRead: boolean;
  isFavorite: boolean;
  feedback?: StoryFeedback;   // optional rating
}
```

---

## Story Lifecycle

```
User selects hero + settings
    ↓
story-details.tsx (customization wizard)
    ↓
POST /api/generate-story (or stream variant)
    ↓
app/story.tsx (playback + TTS + music + images)
    ↓
User makes choices (classic mode) → next parts
    ↓
app/completion.tsx (badge award + streak update)
    ↓
Story saved to AsyncStorage via lib/storage.ts
```

---

## What This Agent Must Flag for Human Review

- Any change to `CHILD_SAFETY_RULES` in story generation prompts
- Changes to `rewardBadge` generation that could award inappropriate content
- Vocabulary word selection that may be above age range
- Story prompts that remove or weaken content restrictions
- Changes to Mad Libs word validation

---

## Related Agent Files

- [`AI-INTEGRATION-AGENT.md`](./AI-INTEGRATION-AGENT.md) — Provider routing and prompt safety
- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Child safety enforcement
- [`AUDIO-TTS-AGENT.md`](./AUDIO-TTS-AGENT.md) — Story narration via TTS
- [`CONTENT-UX-AGENT.md`](./CONTENT-UX-AGENT.md) — Badge system and gamification
