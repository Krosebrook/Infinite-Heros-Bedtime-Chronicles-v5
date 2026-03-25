# ADR-0004 — Use AsyncStorage as the Client-Side Data Store

**Status:** accepted
**Date:** 2026-03-11

---

## Context

The app needs to persist data client-side: stories, child profiles, badges, streaks, favorites, settings, and parent controls. This data must survive app restarts. The app has no user authentication system — all data is local to the device.

Requirements:
- Works on iOS, Android, and Web from the same API
- No server required for core story browsing and profile management
- Data is non-sensitive (story text, badge names, settings preferences)
- Simple key-value or JSON serialization is sufficient

---

## Decision

Use **`@react-native-async-storage/async-storage`** (v2.2.0) as the client-side persistent storage mechanism for all local app data.

All AsyncStorage access is centralized through typed helper functions in `lib/storage.ts`. Keys follow the `@infinity_heroes_<descriptor>` naming convention. App settings are additionally managed through `SettingsContext` (`lib/SettingsContext.tsx`), which wraps the AsyncStorage key `@infinity_heroes_app_settings` in a React Context + Reducer pattern.

---

## Consequences

### Positive
- Works across iOS, Android, and React Native Web without platform-specific code
- Simple, well-supported API with Expo SDK integration
- No server infrastructure needed for core browsing and profile management
- Data stays on-device — no privacy concerns for non-sensitive story data

### Negative
- Data is lost if the app is uninstalled or storage is cleared
- No cross-device sync (each device has independent data)
- Not suitable for sensitive data (though no sensitive data is currently stored)
- Large story libraries may hit storage limits on low-end devices

### Neutral
- JSON serialization is used throughout — all data round-trips through `JSON.parse`/`JSON.stringify`
- Legacy `@infinity_heroes_preferences` key is migrated to `@infinity_heroes_app_settings` on first load

---

## Alternatives Considered

| Option | Why Not Chosen |
|--------|---------------|
| SQLite (`expo-sqlite`) | Overkill for key-value/document storage needs; no benefits over AsyncStorage here |
| Supabase / cloud DB | Requires user authentication; adds complexity and infrastructure cost |
| MMKV (`react-native-mmkv`) | Marginally faster but not supported in Expo managed workflow |
| Redux Persist | Adds Redux dependency; React Context is sufficient for this app's state complexity |
