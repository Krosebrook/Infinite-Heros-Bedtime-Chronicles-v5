# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Infinity Heroes: Bedtime Chronicles.

## What is an ADR?

An ADR is a short document that captures a significant architectural decision made during the development of the project. It records:
- The **context** — what problem or situation prompted the decision
- The **decision** — what was chosen and why
- The **consequences** — what the decision enables, constrains, or requires

ADRs are immutable after acceptance. If a decision is reversed or superseded, a new ADR is created that references the old one.

## Process

1. Copy `template.md` to `NNNN-short-title.md` (use the next available number)
2. Fill in all sections
3. Set status to `proposed`
4. Submit as a PR for review
5. After discussion and acceptance, update status to `accepted`

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./0001-use-expo-react-native.md) | Use Expo + React Native for cross-platform mobile | accepted | 2026-03-11 |
| [0002](./0002-multi-provider-ai-fallback-chain.md) | Multi-provider AI fallback chain | accepted | 2026-03-11 |
| [0003](./0003-elevenlabs-for-tts.md) | Use ElevenLabs for text-to-speech narration | accepted | 2026-03-11 |
| [0004](./0004-asyncstorage-as-client-data-store.md) | Use AsyncStorage as client-side data store | accepted | 2026-03-11 |
| [0005](./0005-express-backend-api-server.md) | Use Express.js as the API backend | accepted | 2026-03-11 |

## Status Definitions

- `proposed` — Under discussion, not yet accepted
- `accepted` — Decision made and in effect
- `deprecated` — No longer recommended (but not yet superseded)
- `superseded` — Replaced by a newer ADR (link to the superseding ADR)
