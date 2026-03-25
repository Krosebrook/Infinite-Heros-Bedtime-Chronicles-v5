# API Reference

Base URL: `http://localhost:5000` (development)

All endpoints return JSON unless otherwise noted. Rate limiting applies to all POST endpoints (10 req/min per IP by default).

---

## Authentication

All POST endpoints require a valid Firebase Auth token in the `Authorization: Bearer <token>` header.

- **Dev mode**: If `FIREBASE_SERVICE_ACCOUNT_KEY` is not set, auth is bypassed and requests are accepted without tokens.
- **Production**: The server validates tokens using Firebase Admin SDK. Invalid/expired tokens return `401 Unauthorized`.
- **GET endpoints** (`/api/health`, `/api/voices`, `/api/ai-providers`, etc.) do not require authentication.

Rate limiting uses the authenticated user's UID when available, falling back to IP-based limiting.

---

## Health & Status

### `GET /api/health`
Returns server health status.

**Response:**
```json
{ "status": "ok", "timestamp": 1710000000000 }
```

### `GET /api/ai-providers`
Returns availability status of all configured AI providers.

**Response:**
```json
{ "providers": { "gemini": true, "openai": true, "anthropic": false, "openrouter": true } }
```

---

## Story Generation

### `POST /api/generate-story`
Generates a complete story as a single JSON response.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroTitle": "Guardian of Stars",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut who protects the constellations",
  "duration": "medium",
  "mode": "classic",
  "setting": "enchanted forest",
  "tone": "gentle",
  "childName": "Emma",
  "sidekick": "a talking owl",
  "problem": "finding a lost star",
  "soundscape": "rain",
  "madlibWords": { "noun": "banana", "adjective": "sparkly" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| heroName | string | Yes | Hero's name (max 500 chars) |
| heroTitle | string | No | Hero's title |
| heroPower | string | No | Hero's superpower |
| heroDescription | string | No | Hero background |
| duration | string | No | `short` \| `medium-short` \| `medium` \| `long` \| `epic` |
| mode | string | No | `classic` \| `madlibs` \| `sleep` (default: classic) |
| setting | string | No | Adventure setting (classic mode) |
| tone | string | No | `gentle` \| `adventurous` \| `funny` \| `mysterious` |
| childName | string | No | Child's name to weave into story |
| sidekick | string | No | Companion character |
| problem | string | No | Central challenge |
| soundscape | string | No | `rain` \| `ocean` \| `crickets` \| `wind` \| `fire` \| `forest` (sleep mode) |
| madlibWords | object | No | Word substitutions (madlibs mode) |

**Response:**
```json
{
  "title": "The Starlight Adventure",
  "parts": [
    { "text": "Once upon a time...", "choices": ["Go left", "Go right", "Fly up"], "partIndex": 0 },
    { "text": "The story continues...", "partIndex": 1 }
  ],
  "vocabWord": { "word": "constellation", "definition": "A group of stars forming a pattern" },
  "joke": "Why did the star go to school? To get brighter!",
  "lesson": "True friends help each other shine.",
  "tomorrowHook": "Tomorrow, Luna discovers a secret galaxy...",
  "rewardBadge": { "emoji": "⭐", "title": "Star Finder", "description": "Found a lost constellation!" }
}
```

### `POST /api/generate-story-stream`
Same parameters as `/api/generate-story`. Returns a Server-Sent Events stream.

**SSE Events:**
```
data: {"type":"provider","provider":"gemini","model":"gemini-2.5-flash"}
data: {"type":"chunk","text":"Once upon..."}
data: {"type":"chunk","text":" a time..."}
data: {"type":"done"}
```

---

## Image Generation

### `POST /api/generate-avatar`
Generates a hero portrait image.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroTitle": "Guardian of Stars",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "image": "data:image/png;base64,..." }
```

### `POST /api/generate-scene`
Generates a story scene illustration.

**Request Body:**
```json
{
  "heroName": "Luna",
  "sceneText": "Luna flew through the shimmering crystal cave...",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "image": "data:image/png;base64,..." }
```

---

## Text-to-Speech

### `POST /api/tts`
Converts text to speech audio.

**Request Body:**
```json
{
  "text": "Once upon a time, in a land far away...",
  "voice": "moonbeam",
  "mode": "classic"
}
```

**Response:**
```json
{ "audioUrl": "/api/tts-audio/abc123.mp3" }
```

### `GET /api/tts-audio/:file`
Serves a cached TTS audio file. File name must match `/^[a-f0-9]+\.mp3$/`.

**Response:** `audio/mpeg` binary

### `POST /api/tts-preview`
Generates a short voice preview sample.

**Request Body:**
```json
{ "voice": "moonbeam" }
```

**Response:**
```json
{ "audioUrl": "/api/tts-audio/def456.mp3" }
```

### `GET /api/voices`
Lists all available narrator voices with metadata.

**Response:**
```json
{
  "voices": [
    { "id": "moonbeam", "name": "Moonbeam", "characterName": "...", "description": "...", "accent": "...", "personality": "...", "category": "sleep" }
  ],
  "defaults": { "classic": "moonbeam", "madlibs": "ziggy", "sleep": "moonbeam" }
}
```

---

## Music

### `GET /api/music/:mode`
Serves background music for a story mode (`classic`, `madlibs`, or `sleep`).

**Response:** `audio/mpeg` binary

---

## Smart Suggestions

### `POST /api/suggest-settings`
AI-powered story setting suggestions based on context.

**Request Body:**
```json
{
  "heroName": "Luna",
  "heroPower": "star magic",
  "heroDescription": "A brave astronaut",
  "hour": 20,
  "childAge": 5,
  "childName": "Emma"
}
```

**Response:**
```json
{
  "mode": "sleep",
  "duration": "short",
  "speed": "gentle",
  "voice": "moonbeam",
  "tip": "It's bedtime — a short, calming sleep story is perfect."
}
```

---

## Video Generation

### `GET /api/video-available`
Checks if video generation is available (requires `OPENAI_API_KEY`).

**Response:**
```json
{ "available": true }
```

### `POST /api/generate-video`
Starts an async video generation job.

**Request Body:**
```json
{
  "sceneText": "Luna flew through the crystal cave...",
  "heroName": "Luna",
  "heroDescription": "A brave astronaut"
}
```

**Response:**
```json
{ "jobId": "abc123" }
```

### `GET /api/video-status/:id`
Checks video generation progress.

**Response:**
```json
{ "status": "processing", "progress": 65 }
```
or
```json
{ "status": "completed", "progress": 100, "videoUrl": "/api/video/abc123" }
```

### `GET /api/video/:id`
Serves a completed video file. ID must match `/^[a-f0-9]+$/`.

**Response:** `video/mp4` binary

---

## Voice Chat (requires DATABASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY)

### `GET /api/conversations`
Lists all conversations.

### `POST /api/conversations`
Creates a new conversation.

**Request Body:**
```json
{ "title": "Chat with Luna" }
```

### `GET /api/conversations/:id`
Gets a conversation with all messages.

### `DELETE /api/conversations/:id`
Deletes a conversation and all its messages.

### `POST /api/conversations/:id/messages`
Sends a voice message and receives a streaming audio response.

**Request Body:**
```json
{
  "audio": "<base64-encoded-audio>",
  "voice": "alloy"
}
```

**SSE Response Events:**
```
data: {"type":"user_transcript","data":"Hello hero!"}
data: {"type":"transcript","data":"Hi there!"}
data: {"type":"audio","data":"<base64-pcm16-chunk>"}
data: {"type":"done","transcript":"Hi there! How are you?"}
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid request (missing/invalid parameters) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 401 | Unauthorized (missing/invalid Firebase Auth token) |
| 503 | Service unavailable |
