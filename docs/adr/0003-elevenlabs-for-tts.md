# ADR-0003 — Use ElevenLabs for Text-to-Speech Narration

**Status:** accepted
**Date:** 2026-03-11

---

## Context

Bedtime story narration is a core feature of the app. The TTS voice must sound natural and warm enough to be soothing for children ages 3–9. The app requires:
- Multiple distinct voice characters (at least 6–8 voices)
- Per-mode voice matching (sleep voices are softer; classic voices are energetic)
- Adjustable playback speed
- Audio file caching to avoid repeated API calls for the same text

---

## Decision

Use **ElevenLabs** with the `eleven_multilingual_v2` model for all TTS narration.

8 voices are curated and configured with per-voice stability, similarity, and style settings in `server/elevenlabs.ts`. Voices are categorized as `"sleep"`, `"classic"`, or `"fun"`. Generated audio is cached server-side as hex-named `.mp3` files.

ElevenLabs is accessed via Replit Connectors (auto-provisioned API key) with fallback to a direct `ELEVENLABS_API_KEY` environment variable.

---

## Consequences

### Positive
- Best-in-class voice quality for children's content
- 8 distinct voice characters with tuned per-mode settings
- Replit Connectors provides zero-config API key provisioning
- Disk-cached audio avoids repeated API calls for identical text

### Negative
- ElevenLabs has usage costs — every TTS call is billable
- TTS is optional but degrades the experience when unavailable
- Replit Connector can be fragile if the Replit workspace is re-wired

### Neutral
- TTS playback is handled client-side via `expo-av`
- Audio files are served from `/api/tts-audio/:file` with regex filename validation

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| `expo-speech` (on-device TTS) | Robotic voice quality; unsuitable for bedtime storytelling |
| OpenAI TTS (`tts-1`) | Lower quality than ElevenLabs for character voices |
| Google Cloud TTS | No Replit Connector; complex key management |
| AWS Polly | Limited voice variety; less natural sounding |
