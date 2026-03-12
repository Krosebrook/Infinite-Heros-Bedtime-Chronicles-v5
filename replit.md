# Infinity Heroes

## Overview
Infinity Heroes is a children's bedtime story app built with Expo (React Native) and an Express backend. It allows kids to choose a superhero, select story options (mode, duration, voice, speed), and generate a unique bedtime story using Google Gemini 2.5 Flash. The app features a space/cosmic theme with animated elements, character cards, ElevenLabs text-to-speech, and AI-powered setting suggestions. It targets children ages 3-9 with strict child safety content filtering. The project uses a monorepo structure, sharing types between the frontend and backend.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, new architecture.
- **Routing**: Expo Router v6 with file-based routing and tab navigation. Uses `app/(tabs)/` group for 5-tab layout (Home, Library, Create, Saved, Profile). Key screens: `(tabs)/index.tsx` (library/browse home), `(tabs)/create.tsx` (story creation wizard), `story-details.tsx` (story personalization), `story.tsx` (story generation/reader), `completion.tsx` (post-story celebration), `trophies.tsx` (badge display).
- **State Management**: TanStack React Query for server state, React Context for profile state, and local component state.
- **Local Storage**: AsyncStorage for profiles, badges, streaks, parent controls, and saved stories.
- **Typography**: Plus Jakarta Sans (400 Regular through 800 ExtraBold) via `@expo-google-fonts/plus-jakarta-sans`.
- **Styling**: React Native StyleSheet with midnight/indigo/purple glassmorphism theme (`constants/colors.ts`). Key colors: accent `#6366f1`, cardBg `rgba(255,255,255,0.05)`, cardBorder `rgba(255,255,255,0.1)`.
- **Animations**: React Native Reanimated for various UI effects.
- **Text-to-Speech**: ElevenLabs via Replit connector for natural narration, with adjustable speed via `expo-av` and pitch correction.
- **Background Music**: Royalty-free MP3 files served from the Express backend, played via `expo-av`.

### Backend (Express)
- **Runtime**: Node.js with TypeScript.
- **API Server**: Express v5, serving API routes and static web assets.
- **Key Endpoints**:
    - `/api/generate-story`: Generates bedtime stories using Gemini.
    - `/api/tts`: Handles ElevenLabs text-to-speech requests.
    - `/api/suggest-settings`: Provides AI-powered story setting suggestions.
    - `/api/generate-avatar`, `/api/generate-scene`: AI-driven image generation.
- **AI Integration**: Multi-provider AI abstraction layer with automatic fallback, supporting Gemini (primary), OpenAI, Anthropic, xAI, Mistral, Cohere, and Meta Llama via Replit AI Integrations and OpenRouter.
- **Security**: Includes input sanitization, rate limiting, and path traversal protection.

### Shared Code (`shared/`)
- Contains Drizzle ORM schema definitions (e.g., `schema.ts`) and Zod schemas for validation.

### Database
- **ORM**: Drizzle ORM with PostgreSQL. Configured via `DATABASE_URL`.
- The core story generation functionality primarily uses in-memory storage, with the database schema existing for future user management and chat features.

### Replit Integrations (`server/replit_integrations/`)
- Provides pre-built integration modules for functionalities like chat, audio processing, and image generation, though not all are fully utilized by the main application.

### Build & Deployment
- Supports separate dev processes for frontend and backend, and production builds that bundle both.
- Uses environment variables like `EXPO_PUBLIC_DOMAIN` and `DATABASE_URL`.

## External Dependencies

### Services & APIs
- **Google Gemini AI** (via Replit AI Integrations): Primary provider for story generation, setting suggestions, and image generation (`gemini-2.5-flash`, `gemini-2.5-flash-image`).
- **OpenAI** (via Replit AI Integrations + direct key): Text fallback (`gpt-4o-mini`), image fallback (`gpt-image-1`), video generation (Sora 2, direct key only).
- **Anthropic Claude** (via Replit AI Integrations): Primary story generation provider via `claude-sonnet-4-6`.
- **OpenRouter** (via Replit AI Integrations): Access to xAI Grok 3 Mini, Mistral Small 3.1, Cohere Command A, Meta Llama 4 Scout for text generation fallbacks.
- **ElevenLabs** (via Replit connector): Provides text-to-speech narration with the `eleven_multilingual_v2` model.
- **PostgreSQL**: Database provisioned through Replit.

### Key NPM Packages
- **Frontend**: `expo`, `expo-router`, `react-native-reanimated`, `@tanstack/react-query`, `@react-native-async-storage/async-storage`.
- **Backend**: `express`, `@google/genai`, `drizzle-orm`, `pg`.
- **Shared**: `drizzle-zod`, `zod`.