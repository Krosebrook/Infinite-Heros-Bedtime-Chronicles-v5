# Infinity Heroes: Bedtime Chronicles -- API Documentation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Security](#security)
- [Endpoints](#endpoints)
  - [POST /api/generate-story](#post-apigenerate-story)
  - [POST /api/generate-avatar](#post-apigenerate-avatar)
  - [POST /api/generate-scene](#post-apigenerate-scene)
  - [POST /api/generate-narration](#post-apigenerate-narration)
- [Common Error Codes](#common-error-codes)
- [Error Handling Patterns](#error-handling-patterns)
- [Rate Limiting](#rate-limiting)

---

## Overview

The Infinity Heroes: Bedtime Chronicles API consists of four Vercel serverless endpoints that proxy requests to Google Gemini AI models. These endpoints power the core application features:

| Endpoint | Purpose | Gemini Model |
|----------|---------|--------------|
| `/api/generate-story` | Interactive story generation (structured JSON) | `gemini-3-pro-preview` |
| `/api/generate-avatar` | Character portrait illustration | `gemini-2.5-flash-image` |
| `/api/generate-scene` | Scene illustration for story pages | `gemini-2.5-flash-image` |
| `/api/generate-narration` | Text-to-speech audio narration | `gemini-2.5-flash-preview-tts` |

All endpoints accept `POST` requests with `application/json` bodies and return JSON responses.

## Architecture

```
Browser Client                Vercel Serverless Functions          Google Gemini AI
+------------------+          +------------------------+          +------------------+
|                  |  POST    |                        |  SDK     |                  |
|  AIClient.ts     +--------->+  /api/generate-story   +--------->+  gemini-3-pro    |
|  NarrationMgr.ts |          |  /api/generate-avatar  |          |  gemini-2.5-flash|
|                  |<---------+  /api/generate-scene   |<---------+  -image / -tts   |
|                  |  JSON    |  /api/generate-narration|  Result  |                  |
+------------------+          +------------------------+          +------------------+
```

### Why proxy through serverless functions instead of calling Gemini directly?

1. **API Key Protection** -- The `GEMINI_API_KEY` is stored as a server-side environment variable and never exposed to the client. Direct browser-to-Gemini calls would require embedding the key in client-side code, making it trivially extractable by anyone inspecting network traffic or the JavaScript bundle.

2. **Request Control** -- The server can validate, sanitize, and shape requests before forwarding them to Gemini, preventing prompt injection or abuse from malicious clients.

3. **Cost Containment** -- Server-side proxying enables future addition of rate limiting, usage quotas, and request logging without requiring client-side changes.

4. **Model Abstraction** -- The client does not need to know which Gemini model is in use. Model upgrades or swaps happen server-side with zero client impact. For example, the story endpoint currently uses `gemini-3-pro-preview` but could be switched to any compatible model without changing `AIClient.ts`.

## Security

### API Key Management

- The `GEMINI_API_KEY` environment variable is configured in the Vercel project settings (Settings > Environment Variables).
- It is read server-side at request time via `process.env.GEMINI_API_KEY`.
- The key is **never** included in any response body or client-side bundle.
- If the key is missing or misconfigured, all endpoints return `500` with `{ "error": "API key not configured" }` and refuse to call Gemini.

### Request Validation

- All endpoints reject non-POST methods with `405 Method Not Allowed`.
- Request bodies are consumed as JSON via the Vercel request parser; malformed JSON will produce a parse error before reaching handler logic.
- There is no client-side authentication on these endpoints. See recommendations below.

### Recommendations for Production

- Rotate `GEMINI_API_KEY` periodically.
- Add authentication middleware (e.g., session tokens, JWT, or API keys for your own users) before deploying publicly.
- Configure CORS restrictions in `vercel.json` to limit which origins can call these endpoints.
- Implement request body size limits to prevent abuse.

---

## Endpoints

---

### POST /api/generate-story

Generates a complete interactive story using structured JSON output from the Gemini text model. This is the primary endpoint that powers the core story experience, supporting three modes: classic adventure, mad libs, and sleep stories.

**Source:** `api/generate-story.ts`

#### Gemini Model

`gemini-3-pro-preview` -- configured with `responseMimeType: 'application/json'` to enforce structured output.

#### Request Headers

| Header         | Value              | Required |
|----------------|--------------------|----------|
| `Content-Type` | `application/json` | Yes      |

#### Request Body

```json
{
  "systemInstruction": "string",
  "userPrompt": "string",
  "responseSchema": { }
}
```

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| `systemInstruction`| string | Yes      | System-level prompt that sets the AI persona and rules. Controls story mode (classic adventure, mad libs, or sleep), tone, length, and interactivity rules. |
| `userPrompt`       | string | Yes      | User-facing prompt containing story parameters such as hero name, power, setting, sidekick, and problem (classic mode), or sensory anchors and theme (sleep mode), or random words (mad libs mode). |
| `responseSchema`   | object | Yes      | A JSON Schema object using Gemini schema type strings (`"STRING"`, `"ARRAY"`, `"OBJECT"`, `"INTEGER"`) that constrains the model's output structure. The model returns JSON conforming to this schema. |

#### Response Schema Detail

The client (`AIClient.ts`) sends the following schema, which defines the shape of the generated story:

```json
{
  "type": "OBJECT",
  "properties": {
    "title": { "type": "STRING" },
    "parts": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "text": { "type": "STRING", "description": "The story text for this part." },
          "choices": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "3 choices for the reader (empty array for sleep mode or final part)." },
          "partIndex": { "type": "INTEGER", "description": "Zero-based index of this story part." }
        },
        "required": ["text", "partIndex"]
      }
    },
    "vocabWord": {
      "type": "OBJECT",
      "properties": {
        "word": { "type": "STRING" },
        "definition": { "type": "STRING" }
      },
      "required": ["word", "definition"]
    },
    "joke": { "type": "STRING" },
    "lesson": { "type": "STRING" },
    "tomorrowHook": { "type": "STRING" },
    "rewardBadge": {
      "type": "OBJECT",
      "properties": {
        "emoji": { "type": "STRING" },
        "title": { "type": "STRING" },
        "description": { "type": "STRING" }
      },
      "required": ["emoji", "title", "description"]
    }
  },
  "required": ["title", "parts", "vocabWord", "joke", "lesson", "tomorrowHook", "rewardBadge"]
}
```

#### Success Response

**Status:** `200 OK`

```json
{
  "text": "<JSON string conforming to the provided responseSchema>"
}
```

| Field  | Type   | Description |
|--------|--------|-------------|
| `text` | string | A JSON string (possibly wrapped in markdown code fences like `` ```json ... ``` ``) that the client parses into a `StoryFull` object. |

**Parsed `StoryFull` object structure (TypeScript `types.ts`):**

| Field          | Type     | Description |
|----------------|----------|-------------|
| `title`        | string   | The story title. |
| `parts`        | `StoryPart[]` | Array of story parts. |
| `parts[].text` | string   | The narrative text for this part. |
| `parts[].choices` | string[] (optional) | Array of 3 choices for the reader. Absent or empty for the final part, and always empty in sleep mode. |
| `parts[].partIndex` | number | Zero-based index of this story part. |
| `vocabWord`    | object   | A vocabulary word introduced in the story. |
| `vocabWord.word` | string | The vocabulary word. |
| `vocabWord.definition` | string | Its definition. |
| `joke`         | string   | A joke related to the story. |
| `lesson`       | string   | A moral or life lesson from the story. |
| `tomorrowHook` | string   | A teaser to entice the child back for the next story session. |
| `rewardBadge`  | object   | A reward badge earned for completing the story. |
| `rewardBadge.emoji` | string | An emoji representing the badge. |
| `rewardBadge.title` | string | The badge title (e.g., "Crown Rescuer"). |
| `rewardBadge.description` | string | A short description of why the badge was earned. |

**Note:** The client strips markdown code fences before parsing:

```javascript
let jsonStr = data.text || "{}";
if (jsonStr.startsWith("```json")) {
  jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
}
```

#### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `405`  | `{ "error": "Method not allowed" }` | Non-POST HTTP method used. |
| `500`  | `{ "error": "API key not configured" }` | `GEMINI_API_KEY` environment variable is missing. |
| `500`  | `{ "error": "<message>" }` | Gemini API error or generation failure. The message is forwarded from the Gemini SDK. |
| _varies_ | `{ "error": "<message>" }` | If the Gemini SDK error has a `.status` property (e.g., `429`), that status code is forwarded to the client. |

#### Example: cURL

```bash
curl -X POST https://your-app.vercel.app/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{
    "systemInstruction": "You are a best-selling Children'\''s Book Author (genre: Fantasy/Adventure). Your goal is to write an exciting, empowering story for kids aged 7-9. RULES: 1. HEROIC TONE: Inspiring, brave, and wondrous. 2. STRUCTURE: A clear beginning, middle, and end. 3. VOCABULARY: Engaging but accessible, with one vocabWord to learn. - LENGTH: approx 1200 words, 5-7 parts. - INTERACTIVITY: Provide 3 meaningful, distinct choices at the end of each part (except the final part).",
    "userPrompt": "Generate an adventure story: HERO: Luna. POWER: telekinesis. SETTING: enchanted forest. SIDEKICK: a talking fox. PROBLEM: a stolen crown.",
    "responseSchema": {
      "type": "OBJECT",
      "properties": {
        "title": { "type": "STRING" },
        "parts": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "text": { "type": "STRING" },
              "choices": { "type": "ARRAY", "items": { "type": "STRING" } },
              "partIndex": { "type": "INTEGER" }
            },
            "required": ["text", "partIndex"]
          }
        },
        "vocabWord": {
          "type": "OBJECT",
          "properties": { "word": { "type": "STRING" }, "definition": { "type": "STRING" } },
          "required": ["word", "definition"]
        },
        "joke": { "type": "STRING" },
        "lesson": { "type": "STRING" },
        "tomorrowHook": { "type": "STRING" },
        "rewardBadge": {
          "type": "OBJECT",
          "properties": { "emoji": { "type": "STRING" }, "title": { "type": "STRING" }, "description": { "type": "STRING" } },
          "required": ["emoji", "title", "description"]
        }
      },
      "required": ["title", "parts", "vocabWord", "joke", "lesson", "tomorrowHook", "rewardBadge"]
    }
  }'
```

#### Example: fetch (JavaScript)

```javascript
const response = await fetch('/api/generate-story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    systemInstruction: "You are a best-selling Children's Book Author...",
    userPrompt: "Generate an adventure story: HERO: Luna. POWER: telekinesis...",
    responseSchema: { /* schema object as shown above */ }
  }),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.error);
}

const data = await response.json();

// Strip markdown code fences if present
let jsonStr = data.text || "{}";
if (jsonStr.startsWith("```json")) {
  jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
}

const story = JSON.parse(jsonStr);
// story.title, story.parts, story.vocabWord, etc.
```

---

### POST /api/generate-avatar

Generates a character portrait illustration using Gemini's image generation model. Returns a base64-encoded image that the client renders as a data URI.

**Source:** `api/generate-avatar.ts`

#### Gemini Model

`gemini-2.5-flash-image`

#### Request Headers

| Header         | Value              | Required |
|----------------|--------------------|----------|
| `Content-Type` | `application/json` | Yes      |

#### Request Body

```json
{
  "prompt": "string"
}
```

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `prompt` | string | Yes      | A text prompt describing the avatar to generate. Typically includes the hero's name, power, and style instructions for a children's book illustration. |

**How the client builds the prompt (`AIClient.ts`):**

```typescript
const prompt = `A professional children's book illustration portrait of ${heroName} `
  + `who has the power of ${heroPower}. High-contrast, friendly, vibrant style. `
  + `Close-up on the hero's face.`;
```

#### Success Response

**Status:** `200 OK`

```json
{
  "mimeType": "image/png",
  "data": "<base64-encoded image bytes>"
}
```

| Field      | Type   | Description |
|------------|--------|-------------|
| `mimeType` | string | MIME type of the generated image (typically `image/png` or `image/jpeg`). |
| `data`     | string | Base64-encoded image bytes. |

**Client usage:** The client constructs a data URI for rendering:

```javascript
const imageUrl = `data:${data.mimeType};base64,${data.data}`;
```

#### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `405`  | `{ "error": "Method not allowed" }` | Non-POST HTTP method used. |
| `500`  | `{ "error": "API key not configured" }` | `GEMINI_API_KEY` environment variable is missing. |
| `500`  | `{ "error": "No image data received" }` | Gemini returned a response but it contained no inline image data. This can happen if the model decides not to generate an image or if the prompt triggers a safety filter. |
| `500`  | `{ "error": "<message>" }` | Gemini API error. The message is forwarded from the Gemini SDK. |
| _varies_ | `{ "error": "<message>" }` | Upstream Gemini error with a specific status code (e.g., `429` for rate limiting). |

#### Example: cURL

```bash
curl -X POST https://your-app.vercel.app/api/generate-avatar \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A professional children'\''s book illustration portrait of Luna who has the power of telekinesis. High-contrast, friendly, vibrant style. Close-up on the hero'\''s face."
  }'
```

**Response:**

```json
{
  "mimeType": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### Example: fetch (JavaScript)

```javascript
const response = await fetch('/api/generate-avatar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "A professional children's book illustration portrait of Luna who has the power of telekinesis. High-contrast, friendly, vibrant style. Close-up on the hero's face."
  }),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.error);
}

const data = await response.json();
const imageUrl = `data:${data.mimeType};base64,${data.data}`;
// Use imageUrl as the src for an <img> element
```

---

### POST /api/generate-scene

Generates a scene illustration for a story page using Gemini's image generation model. Functionally identical to the avatar endpoint but used for full scene illustrations rather than character portraits.

**Source:** `api/generate-scene.ts`

#### Gemini Model

`gemini-2.5-flash-image`

#### Request Headers

| Header         | Value              | Required |
|----------------|--------------------|----------|
| `Content-Type` | `application/json` | Yes      |

#### Request Body

```json
{
  "prompt": "string"
}
```

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `prompt` | string | Yes      | A text prompt describing the scene to illustrate. Typically includes a truncated story excerpt (up to 400 characters), a hero description, and style directions. |

**How the client builds the prompt (`AIClient.ts`):**

```typescript
const prompt = `Vibrant children's storybook scene: ${context.substring(0, 400)}. `
  + `Featuring: ${heroDescription}. Whimsical, magical atmosphere.`;
```

- `context` is the story text for the current page (truncated to 400 characters).
- `heroDescription` is a string like `"Luna, a young hero with telekinesis"`.

#### Success Response

**Status:** `200 OK`

```json
{
  "mimeType": "image/png",
  "data": "<base64-encoded image bytes>"
}
```

| Field      | Type   | Description |
|------------|--------|-------------|
| `mimeType` | string | MIME type of the generated image (typically `image/png` or `image/jpeg`). |
| `data`     | string | Base64-encoded image bytes. |

**Client usage:** Same as the avatar endpoint:

```javascript
const imageUrl = `data:${data.mimeType};base64,${data.data}`;
```

#### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `405`  | `{ "error": "Method not allowed" }` | Non-POST HTTP method used. |
| `500`  | `{ "error": "API key not configured" }` | `GEMINI_API_KEY` environment variable is missing. |
| `500`  | `{ "error": "No image data received" }` | Gemini returned no inline image data. |
| `500`  | `{ "error": "<message>" }` | Gemini API error. |
| _varies_ | `{ "error": "<message>" }` | Upstream Gemini error with forwarded status code. |

#### Example: cURL

```bash
curl -X POST https://your-app.vercel.app/api/generate-scene \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Vibrant children'\''s storybook scene: Luna raised her hands and the ancient crown lifted into the air, glowing with a soft purple light. The fox beside her gasped in wonder. Featuring: Luna, a young hero with telekinesis. Whimsical, magical atmosphere."
  }'
```

**Response:**

```json
{
  "mimeType": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### Example: fetch (JavaScript)

```javascript
const response = await fetch('/api/generate-scene', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Vibrant children's storybook scene: Luna raised her hands and the ancient crown lifted into the air... Featuring: Luna, a young hero with telekinesis. Whimsical, magical atmosphere."
  }),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(err.error);
}

const data = await response.json();
const imageUrl = `data:${data.mimeType};base64,${data.data}`;
```

---

### POST /api/generate-narration

Generates text-to-speech audio narration using Gemini's TTS model. Returns raw PCM audio data encoded as base64. The client decodes this into a Web Audio API `AudioBuffer` for playback.

**Source:** `api/generate-narration.ts`

#### Gemini Model

`gemini-2.5-flash-preview-tts` -- configured with `responseModalities: [Modality.AUDIO]` and a `speechConfig` for voice selection.

#### Request Headers

| Header         | Value              | Required |
|----------------|--------------------|----------|
| `Content-Type` | `application/json` | Yes      |

#### Request Body

```json
{
  "text": "string",
  "voiceName": "string"
}
```

| Field       | Type   | Required | Default  | Description |
|-------------|--------|----------|----------|-------------|
| `text`      | string | Yes      | --       | The text content to convert to speech. |
| `voiceName` | string | No       | `"Kore"` | The name of the Gemini prebuilt voice profile to use (see table below). |

#### Available Voice Names

These are the prebuilt Gemini voices defined in the `StoryState` type (`types.ts`):

| Voice    | Notes |
|----------|-------|
| `Puck`   | Prebuilt Gemini voice |
| `Charon` | Prebuilt Gemini voice |
| `Kore`   | Prebuilt Gemini voice (**default**) |
| `Fenrir` | Prebuilt Gemini voice |
| `Aoede`  | Prebuilt Gemini voice |
| `Zephyr` | Prebuilt Gemini voice |
| `Leda`   | Prebuilt Gemini voice |

#### Success Response

**Status:** `200 OK`

```json
{
  "audioData": "<base64-encoded raw PCM audio>"
}
```

| Field       | Type   | Description |
|-------------|--------|-------------|
| `audioData` | string | Base64-encoded raw 16-bit signed PCM audio at 24,000 Hz sample rate, mono channel. This is **not** a standard audio container format (not WAV, not MP3, not OGG). It must be decoded as raw PCM by the client. |

#### Audio Format Specification

| Property | Value |
|----------|-------|
| Encoding | Raw PCM (no header, no container) |
| Sample format | 16-bit signed integer (little-endian) |
| Sample rate | 24,000 Hz |
| Channels | 1 (mono) |
| Byte order | Little-endian (Int16) |

#### Client-Side Decoding

The `NarrationManager.ts` decodes the audio through the following steps:

1. **Base64 decode** to a `Uint8Array`:
   ```javascript
   const binaryString = atob(base64);
   const bytes = new Uint8Array(binaryString.length);
   for (let i = 0; i < binaryString.length; i++) {
     bytes[i] = binaryString.charCodeAt(i);
   }
   ```

2. **Interpret as signed 16-bit integers** and **normalize to float32**:
   ```javascript
   const dataInt16 = new Int16Array(bytes.buffer);
   const frameCount = dataInt16.length;
   const buffer = audioCtx.createBuffer(1, frameCount, 24000);
   const channelData = buffer.getChannelData(0);
   for (let i = 0; i < frameCount; i++) {
     channelData[i] = dataInt16[i] / 32768.0;
   }
   ```

3. **Play via Web Audio API** using an `AudioBufferSourceNode`.

#### Client-Side Caching

The `NarrationManager` implements a two-tier cache to avoid redundant API calls:

1. **In-memory cache** (`Map<string, AudioBuffer>`) -- fast switching within a session.
2. **IndexedDB persistent cache** -- survives page reloads and enables offline playback.

Cache keys are constructed as: `v1:{voiceName}:{first 30 chars of text}_{text length}`

#### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `405`  | `{ "error": "Method not allowed" }` | Non-POST HTTP method used. |
| `500`  | `{ "error": "API key not configured" }` | `GEMINI_API_KEY` environment variable is missing. |
| `500`  | `{ "error": "No audio data received" }` | Gemini returned a response but it contained no audio data in `inlineData`. |
| `500`  | `{ "error": "<message>" }` | Gemini API error. |
| _varies_ | `{ "error": "<message>" }` | Upstream Gemini error with forwarded status code. |

#### Example: cURL

```bash
curl -X POST https://your-app.vercel.app/api/generate-narration \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Once upon a time, in a land of soft clouds and gentle starlight, a little dreamer named Luna closed her eyes.",
    "voiceName": "Kore"
  }'
```

**Response:**

```json
{
  "audioData": "AAAAAAABAAEAAQACAAIA..."
}
```

(The `audioData` value is a base64 string representing raw 16-bit PCM at 24 kHz.)

#### Example: fetch (JavaScript)

```javascript
const response = await fetch('/api/generate-narration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Once upon a time, in a land of soft clouds and gentle starlight...",
    voiceName: "Kore"
  }),
});

if (!response.ok) {
  const err = await response.json().catch(() => ({}));
  throw new Error(err.error || 'TTS synthesis failed');
}

const data = await response.json();
const base64Audio = data.audioData;

// Decode base64 to Uint8Array
const binaryString = atob(base64Audio);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

// Decode raw PCM to AudioBuffer
const audioCtx = new AudioContext({ sampleRate: 24000 });
const dataInt16 = new Int16Array(bytes.buffer);
const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
const channelData = buffer.getChannelData(0);
for (let i = 0; i < dataInt16.length; i++) {
  channelData[i] = dataInt16[i] / 32768.0;
}

// Play
const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start();
```

---

## Common Error Codes

| HTTP Status | Error Message                | Description                                              | Retryable? |
|-------------|------------------------------|----------------------------------------------------------|------------|
| `400`       | _(varies)_                   | Malformed request body or invalid parameters.            | No         |
| `405`       | `Method not allowed`         | Endpoint was called with a non-POST HTTP method.         | No         |
| `429`       | _(varies)_                   | Gemini API rate limit exceeded. Forwarded from SDK.      | Yes (with backoff) |
| `500`       | `API key not configured`     | `GEMINI_API_KEY` environment variable is not set.        | No (server config issue) |
| `500`       | `No image data received`     | Gemini returned no image in its response (avatar/scene). | Yes |
| `500`       | `No audio data received`     | Gemini returned no audio in its response (narration).    | Yes |
| `500`       | `Generation failed`          | Generic fallback for unrecognized server-side failures.  | Yes |
| `503`       | _(varies)_                   | Gemini service temporarily unavailable.                  | Yes (with backoff) |

## Error Handling Patterns

### Server-Side Pattern

All four endpoints follow an identical error handling pattern:

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Method check
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  // 2. API key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'API key not configured' });

  try {
    // 3. Call Gemini and return result
    // ...
    res.status(200).json({ /* success payload */ });
  } catch (error: any) {
    // 4. Forward error with status code
    console.error('<Context> error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Generation failed'
    });
  }
}
```

**Key behaviors:**

1. **Status code forwarding** -- If the Gemini SDK error object has a `.status` property (e.g., `429` for rate limiting, `503` for service unavailable), that status code is forwarded to the client. Otherwise, `500` is used.
2. **Message forwarding** -- The Gemini error message is forwarded as-is in the `error` field. If no message is available, a generic fallback (`"Generation failed"`) is used.
3. **Server-side logging** -- All errors are logged via `console.error` with a contextual prefix (e.g., `"Story generation error:"`, `"Avatar generation error:"`) for debugging in Vercel's function logs.

### Client-Side Retry Logic (`AIClient.ts`)

The `AIClient` class implements exponential backoff for story, avatar, and scene generation:

```typescript
private static async retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    // Don't retry 4xx errors (client errors), except 429 (rate limit)
    if (error.status >= 400 && error.status < 500 && error.status !== 429)
      throw error;
    await new Promise(res => setTimeout(res, delay));
    return this.retry(fn, retries - 1, delay * 2);
  }
}
```

| Endpoint | Max Retries | Initial Delay | Backoff Schedule |
|----------|-------------|---------------|------------------|
| `/api/generate-story` | 3 | 1,000 ms | 1s, 2s, 4s |
| `/api/generate-avatar` | 2 | 1,000 ms | 1s, 2s |
| `/api/generate-scene` | 2 | 1,000 ms | 1s, 2s |
| `/api/generate-narration` | 0 (no retry) | -- | -- |

**Retry rules:**

- **Retryable:** `5xx` errors, `429` (rate limit), network errors.
- **Non-retryable:** `4xx` errors other than `429` (e.g., `400`, `405`).
- **Narration:** The `NarrationManager` does not implement retries. Narration failures are logged and silently ignored to avoid blocking the reading experience.

### Client-Side Error Object Construction

The `AIClient` attaches the HTTP status to thrown errors so the retry logic can inspect it:

```javascript
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw Object.assign(
    new Error(err.error || 'Generation failed'),
    { status: res.status }
  );
}
```

## Rate Limiting

There is currently **no application-level rate limiting** implemented on these endpoints. Rate limiting is enforced at two external levels:

### 1. Vercel Platform Limits

Vercel serverless functions are subject to plan-based limits:

| Metric | Hobby | Pro |
|--------|-------|-----|
| Function duration | 10s | 60s |
| Concurrent executions | 10 | 100 |
| Invocations per day | 100,000 | 1,000,000 |

See [Vercel Function Limitations](https://vercel.com/docs/functions/limitations) for current values.

### 2. Google Gemini API Limits

Gemini enforces its own rate limits per API key. When exceeded, the SDK returns an error with HTTP status `429`, which is forwarded to the client. Limits vary by model and pricing tier. Consult [Google AI Studio](https://aistudio.google.com/) for current quotas.

### Recommendations for Production

- Implement per-user or per-session rate limiting middleware (e.g., using Vercel KV or Upstash Redis).
- Add request cost tracking to monitor Gemini API usage and spending.
- Leverage client-side caching (the `NarrationManager` already caches audio in IndexedDB) and consider server-side response caching for identical prompts.
- Implement request queuing for expensive operations (story generation) to prevent burst overload.
