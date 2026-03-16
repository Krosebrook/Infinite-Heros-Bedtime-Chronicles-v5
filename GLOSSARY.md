<!-- Last verified: 2026-03-16 -->
# GLOSSARY.md — Domain Vocabulary

Alphabetical reference for all domain-specific terms, abbreviations, and internal jargon used in this codebase, commit messages, and documentation.

**Target audience:** New developer, AI coding agent, or non-technical stakeholder encountering these terms for the first time.

---

## A

**ADR** — Architecture Decision Record. A short document capturing a significant architectural decision: its context, the choice made, and the consequences. Stored in `docs/adr/`. See [docs/adr/README.md](./docs/adr/README.md).

**AI Router** — The multi-provider abstraction layer at `server/ai/index.ts` that routes AI requests through a priority fallback chain (Gemini → OpenAI → Anthropic → OpenRouter). Callers never interact with provider SDKs directly.

**AsyncStorage** — React Native's persistent key-value storage mechanism (similar to `localStorage` on the web). Used as the primary client-side data store for stories, profiles, settings, and badges. All access is through helpers in `lib/storage.ts`.

---

## B

**Badge** — A gamification achievement awarded after story completion. 12 badges total, defined in `lib/storage.ts`. Examples: "First Story", "Sleep Champion", "Mad Libs Master". Stored as `EarnedBadge[]` in AsyncStorage under `@infinity_heroes_badges`.

**Bedtime Chronicles** — The subtitle of the app. Refers to the collection of personalized bedtime stories created by a child across sessions.

---

## C

**CachedStory** — The TypeScript interface (`constants/types.ts`) for a saved story. Contains the full story JSON, scene images (as base64 data URIs), hero ID, mode, profile ID, and optional feedback. Stored in AsyncStorage under `@infinity_heroes_stories`.

**Child Profile** — A named profile representing a child user. Stores name, age, favorite hero ID, avatar emoji, and creation timestamp. Multiple profiles supported. Defined as `ChildProfile` in `constants/types.ts`.

**Child Safety Rules** — A system prompt constant (`CHILD_SAFETY_RULES`) injected into every story generation request. Enforces age-appropriate content (no violence, no scary content, positive values). Located in `server/routes.ts`.

**Classic Mode** — One of three story modes. Generates a traditional adventure story with 3–5 parts and branching choices. Identified as `"classic"` in the `mode` field.

**Completion Screen** — The screen shown after all story parts are read (`app/completion.tsx`). Awards badges, displays the vocabulary word and joke, and shows streak progress.

**Constellation** — A decorative attribute of each built-in hero (e.g., "The Shield", "The Wave"). Displayed in hero selection UI. Defined in `constants/heroes.ts`.

---

## D

**Data URI** — A base64-encoded image embedded directly in a string (e.g., `data:image/png;base64,...`). Used to store AI-generated scene images and avatars in AsyncStorage without a file server.

**Drizzle ORM** — The TypeScript ORM used for PostgreSQL database access (`drizzle-orm` package). Schema defined in `shared/schema.ts`. Used only for voice chat features.

**Duration** — Story length parameter. Valid values: `"short"`, `"medium-short"`, `"medium"`, `"long"`, `"epic"`. Controls the number of story parts and word count per part.

---

## E

**ElevenLabs** — Third-party text-to-speech service. Generates natural-sounding narration audio from story text using the `eleven_multilingual_v2` model. Integrated via `server/elevenlabs.ts`. API key injected via Replit Connectors or `ELEVENLABS_API_KEY` env var.

**Expo** — The React Native framework and toolchain used for this app. Provides the SDK, build tools, file-based routing (Expo Router), and access to native APIs. Version: SDK 54.

**Expo Router** — Expo's file-based routing library (v6). Screen files in `app/` are automatically registered as routes. Tab screens are under `app/(tabs)/`.

---

## F

**Fallback Chain** — The ordered list of AI providers tried in sequence if the primary fails: Gemini → OpenAI → Anthropic → OpenRouter. Implemented in `server/ai/index.ts`.

**Favorites** — Stories the user has starred. Stored as an array of story IDs in AsyncStorage under `@infinity_heroes_favorites`.

---

## G

**Gemini** — Google's AI model family. The primary provider for text generation (`gemini-2.5-flash`) and image generation (`gemini-2.5-flash-image`) in this app.

**Glassmorphism** — The visual design style used in this app: semi-transparent cards with frosted-glass blur effects on a dark midnight/indigo/purple background.

---

## H

**Hero** — A pre-defined or custom superhero character. Pre-defined heroes are listed in `constants/heroes.ts` (Nova, Coral, Zephyr, etc.). Custom heroes can have a user-provided name, title, and AI-generated avatar.

**HeroCard** — A React Native component (`components/HeroCard.tsx`) for displaying a hero in a card layout. Currently exists but is not rendered anywhere — preserved for future use.

---

## I

**Infinity Heroes** — The app name. The full title is "Infinity Heroes: Bedtime Chronicles".

---

## L

**Landing Page** — A branded HTML page served at `GET /` from the Express server. Targets parents/visitors discovering the app. Source: `server/templates/landing-page.html`.

**Library** — The tab screen (`app/(tabs)/library.tsx`) that shows saved stories. Supports sorting, filtering by favorites, and browsing story history.

---

## M

**Mad Libs Mode** — One of three story modes. Fills user-provided words (noun, adjective, etc.) into a story template for a silly, comedic result. Identified as `"madlibs"` in the `mode` field.

**Memory Jar** — A feature allowing children to record memorable story moments. Referenced in UI but details depend on current implementation.

**Mode** — Story generation mode. One of: `"classic"` (adventure), `"madlibs"` (fill-in-the-blank comedy), `"sleep"` (calming/meditative).

---

## N

**Narration** — Audio playback of story text using ElevenLabs TTS. Each story part can be narrated by a selected voice at an adjustable speed.

---

## O

**OpenRouter** — An AI gateway service providing access to multiple model providers (xAI Grok, Mistral, Cohere, Meta Llama). Used as the fourth fallback in the AI chain.

---

## P

**Parent Controls** — Settings accessible via PIN that restrict story content: max story length, bedtime scheduling, theme filtering. Stored as `ParentControls` in AsyncStorage under `@infinity_heroes_parent_controls`.

**Part** — A single segment of a story. A story contains 3–5 parts (depending on duration). Each part has text, optional branching choices, and an optional scene illustration. Defined as `StoryPart` in `constants/types.ts`.

**Patch-package** — npm package that applies patches to `node_modules` after installation. Used for `patches/expo-asset+12.0.12.patch` (a temporary Expo dev server fix).

**Profile** — See *Child Profile*.

---

## Q

**Quick Create** — An onboarding screen (`app/quick-create.tsx`) for first-time users to choose a theme and create their first story without going through the full hero creation flow.

---

## R

**Rate Limiter** — Server-side per-IP request throttle. Sliding window algorithm, 10 requests/60 seconds by default. Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` env vars.

**Reading View** — The screen where a story is read and played back (`app/story.tsx`). Handles part progression, TTS playback, and scene image display.

**Replit** — The cloud development and deployment platform where this project was bootstrapped and primarily developed.

**Replit Connectors** — Replit's managed service integration mechanism. Used to auto-provision ElevenLabs API key and PostgreSQL without manual credential setup.

**Replit Integrations** — Pre-built Express route modules in `server/replit_integrations/` for voice chat, audio processing, image generation, and batch processing.

---

## S

**Sanitization** — The process of cleaning and truncating user-provided string inputs before use in AI prompts. Handled by `sanitizeString()` in `server/routes.ts`.

**Scene** — An AI-generated illustration for a story part. Generated as a data URI image. Stored in `CachedStory.scenes` as a map of `partIndex → dataURI`.

**Settings** — App-wide configuration managed by `SettingsContext` (`lib/SettingsContext.tsx`). Includes audio volume, story length, voice selection, auto-play, and accessibility options. Persisted under `@infinity_heroes_app_settings`.

**Sleep Mode** — One of three story modes. Generates a calming, meditative story intended to help children fall asleep. Uses soft pacing, soothing imagery, and a slower narration style. Identified as `"sleep"` in the `mode` field.

**Soundscape** — Ambient background audio (crickets, rain, ocean, fire, wind) layered under story narration. Audio files in `assets/sounds/`.

**SSE** — Server-Sent Events. Used by `/api/generate-story-stream` to stream story parts to the client as they are generated.

**Streak** — A gamification mechanic tracking how many consecutive days a child has read a story. Stored as `StreakData` in AsyncStorage under `@infinity_heroes_streaks`.

---

## T

**Tomorrow Hook** — A story epilogue teaser ("What happens tomorrow...") included in every generated story. Encourages the child to return the next night.

**TTS** — Text-to-Speech. Audio narration of story text generated by ElevenLabs. Audio files cached server-side under a hex-named `.mp3` filename.

---

## V

**Vocab Word** — An age-appropriate vocabulary word introduced in each story. Part of the `StoryFull` interface (`vocabWord.word` + `vocabWord.definition`). Shown in the completion screen.

**Voice** — A TTS voice character. 8 voices available, curated by story mode (sleep, classic, fun). Defined in `server/elevenlabs.ts` as `VoiceConfig` objects in a `VOICE_MAP`.

**Voice Chat** — A feature allowing the child to speak to their hero via audio messages. Backend routes are functional in `server/replit_integrations/audio/`; mobile UI screen not yet built.

**VoiceCategory** — TypeScript type (`"sleep" | "classic" | "fun"`) used to match narrator voices to story modes. Defined in `server/elevenlabs.ts`.

---

## W

**WSJF** — Weighted Shortest Job First. A backlog prioritization formula: `(Business Value + Time Criticality + Risk Reduction) / Job Size`. Used in `TODO.md` and `docs/ROADMAP.md`.

---

## Z

**Zod** — TypeScript-first schema validation library. Used to validate all API request bodies. Schemas defined inline in `server/routes.ts` or in `shared/schema.ts`.
