# ADR-0001 — Use Expo + React Native for Cross-Platform Mobile

**Status:** accepted
**Date:** 2026-03-11

---

## Context

Infinity Heroes: Bedtime Chronicles needs to run on iOS, Android, and potentially web from a single TypeScript codebase. The primary development environment is Replit (browser-based IDE). The team is TypeScript-first and does not have native iOS/Android expertise.

Key requirements:
- Cross-platform (iOS + Android + Web) from one codebase
- TypeScript throughout
- Works in Replit's development environment
- File-based routing for simplicity
- Access to native device APIs (audio, haptics, fonts, local storage)

---

## Decision

Use **Expo SDK 54** with **React Native 0.81.5** and **Expo Router v6** (file-based routing) as the mobile application framework.

Expo was chosen because it provides a fully managed cross-platform mobile development experience with React Native's new architecture enabled by default, an extensive SDK covering all needed native APIs, and deep Replit integration via Expo Go and web browser preview.

---

## Consequences

### Positive
- Single TypeScript codebase targets iOS, Android, and Web
- Expo SDK covers all needed native APIs (audio, haptics, fonts, image picking, async storage)
- File-based routing (Expo Router) reduces navigation boilerplate
- Expo Go enables rapid iteration without native builds
- Strong community and documentation

### Negative
- Expo's managed workflow restricts access to some advanced native modules
- `expo-asset` patch required for HTTPS dev server (see `patches/expo-asset+12.0.12.patch`)
- Expo SDK upgrades can be disruptive and require testing

### Neutral
- Native code (Swift/Kotlin) is off-limits without ejecting to bare workflow
- New Expo architecture (Fabric/TurboModules) is the default; old bridge is deprecated

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| React Native CLI (bare) | Requires native toolchain; more complex Replit setup |
| Flutter | Different language (Dart); team is TypeScript-focused |
| PWA / web-only | No native audio and haptics APIs; poor mobile UX for children |
| Capacitor + React | Extra complexity; Expo gives better RN integration |
