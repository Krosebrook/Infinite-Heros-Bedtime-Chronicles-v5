# Play Store Deployment — Infinity Heroes: Bedtime Chronicles v5

## Overview

v5 is a native Expo React Native app. Play Store distribution uses **EAS Build** to produce
a signed Android App Bundle (.aab) directly — no TWA wrapper, no web build step.

EAS handles the signing keystore, the Gradle build, and optionally the Play Store submission.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | via nvm |
| EAS CLI | Latest | `npm install -g eas-cli` |
| Expo Account | — | [expo.dev](https://expo.dev) |
| Google Play Dev Account | — | [play.google.com/console](https://play.google.com/console) — $25 one-time |

---

## Step 1 — Expo Account & EAS Login

```bash
# Create account at expo.dev if needed, then:
eas login

# Verify:
eas whoami
```

---

## Step 2 — Link Project to EAS

```bash
# From project root — this generates an EAS project ID
eas init

# This adds "extra.eas.projectId" to app.json
# Commit that change:
git add app.json
git commit -m "chore: add EAS project ID"
git push
```

---

## Step 3 — Configure Android Signing

EAS manages the keystore for you. No manual keytool commands needed.

```bash
eas credentials --platform android
```

Select: **EAS managed credentials** → EAS generates and securely stores the keystore.
The keystore is tied to your Expo account. Back up your Expo credentials via:

```bash
eas credentials --platform android
# Select: Download existing keystore
# Save the .jks file in a password manager — treat it like the other repo's .keystore
```

**Critical:** If you ever lose EAS access and haven't backed up the keystore, you cannot
update the Play Store app. Download and backup immediately after first build.

---

## Step 4 — First Preview Build (APK — Internal Testing)

```bash
# Build a preview APK for side-loading / internal testing
bash scripts/build-android.sh preview

# Or directly:
eas build --platform android --profile preview
```

Build runs in EAS cloud (~15 min). When done, download the APK from expo.dev and install on device:
```bash
adb install infinity-heroes-preview.apk
```

Verify:
- [ ] App launches correctly
- [ ] Story generation works (requires API keys set in EAS environment)
- [ ] ElevenLabs narration plays
- [ ] All 3 story modes functional

---

## Step 5 — Configure Environment Variables in EAS

API keys must be set as EAS secrets — never in source code.

```bash
# Set each secret (run once per variable):
eas secret:create --scope project --name AI_INTEGRATIONS_GEMINI_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_GEMINI_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENAI_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENAI_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_ANTHROPIC_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_ANTHROPIC_BASE_URL --value "your-url"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENROUTER_API_KEY --value "your-key"
eas secret:create --scope project --name AI_INTEGRATIONS_OPENROUTER_BASE_URL --value "your-url"
eas secret:create --scope project --name ELEVENLABS_API_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-server-domain.com"

# View all secrets:
eas secret:list
```

---

## Step 6 — Production Build (AAB — Play Store)

```bash
bash scripts/build-android.sh production

# Or directly:
eas build --platform android --profile production
```

The `autoIncrement: true` in `eas.json` bumps the `versionCode` automatically.
The AAB is available at expo.dev → your project → builds.

---

## Step 7 — Play Store Console Setup

### App Creation (first time only)

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app → Android → Free → "Infinity Heroes: Bedtime Chronicles"
3. Package name: `com.infinityheroes.bedtime` (must match `app.json`)

### Required Assets

| Asset | Size | Notes |
|-------|------|-------|
| App icon | 512×512 PNG (no alpha) | Use `assets/images/icon.png` — verify no transparency |
| Feature graphic | 1024×500 PNG | Create in Canva or Figma |
| Screenshots (phone) | min 2, 320–3840px | Take from device or emulator |
| Short description | max 80 chars | See listing copy below |
| Full description | max 4000 chars | See listing copy below |

### Store Listing Copy

**Short description (79 chars):**
```
AI bedtime stories with narration, illustrations & sleep mode for kids 3–9.
```

**Full description:**
```
Infinity Heroes: Bedtime Chronicles turns bedtime into the best part of your child's day.

Your child creates their own superhero — name, title, power — and the app generates a
fully personalized story with AI illustrations and a narrator that reads it aloud.

THREE STORY MODES

Classic Adventure — branching choices at every chapter, vocabulary words, and a
hook that sets up tomorrow night's sequel.

Mad Libs — fill in silly words and watch the AI build the most ridiculous story imaginable.

Sleep Mode — a slow, soothing, conflict-free story that eases kids gently into sleep,
with ambient soundscapes (rain, forest, ocean, space).

FEATURES
- AI story generation with automatic fallback across multiple providers
- Scene illustrations generated for each chapter
- 8 narrator voices via ElevenLabs (calm, adventurous, playful)
- Background ambient music per story mode
- Child profiles with 12 achievement badges and reading streaks
- Parent controls with PIN protection and bedtime scheduling
- Story library — save and revisit favorites offline
- No ads, no in-app purchases, no accounts required

SAFETY
Every story is generated with strict child-safety guardrails. Zero violence, zero
scary content. No social features, no external links.
```

### Content Rating

Complete the questionnaire in Play Console → Policy → App content → Content rating:
- User-generated content: No
- User interaction: No
- Location sharing: No
- Violence: No
- Sexual content: No
- Profanity: No
- Controlled substances: No
- Primarily directed at children under 13: **Yes**

Expected rating: **Everyone** or **Everyone 3+**

### Privacy Policy

Host `public/privacy-policy.html` at your server domain and submit the URL.
Play Store requires a privacy policy URL for any child-directed app.

---

## Step 8 — Submit to Play Store

### Option A — EAS Submit (automated)

```bash
# Requires google-services-key.json (Google Play service account key)
# Download from: Play Console → Setup → API access → Create service account

bash scripts/build-android.sh submit
```

### Option B — Manual Upload

1. Download the .aab file from expo.dev
2. Play Console → your app → Testing → Internal testing → Create new release
3. Upload the .aab
4. Add release notes
5. Review and roll out

---

## Updating the App (subsequent releases)

```bash
# Bump version in app.json (versionCode auto-increments via eas.json)
# Update CHANGELOG.md

bash scripts/build-android.sh production
# Wait for build to complete at expo.dev
bash scripts/build-android.sh submit
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Build fails: "missing credentials" | EAS keystore not set up | Run `eas credentials --platform android` |
| Build fails: "invalid package name" | `app.json` android.package mismatch | Ensure `com.infinityheroes.bedtime` in app.json |
| App crashes on launch | Missing env vars | Check `eas secret:list`, verify all AI keys are set |
| API calls fail in production build | `EXPO_PUBLIC_API_URL` not set | `eas secret:create --name EXPO_PUBLIC_API_URL --value "https://your-server"` |
| ElevenLabs narration silent | `ELEVENLABS_API_KEY` not set | Set as EAS secret |
| Play Store rejects icon | Alpha channel in PNG | Flatten icon.png — remove transparency |

---

## Security Checklist

- [ ] `google-services-key.json` in `.gitignore` and NOT committed
- [ ] All API keys set as EAS secrets — never in source code
- [ ] EAS keystore backed up (download via `eas credentials`)
- [ ] `EXPO_PUBLIC_*` variables contain NO secrets (they are bundled into the client)

---

## CLAIMS
- [GENERATED] EAS Build is the official Expo-recommended path for React Native app distribution
- [GENERATED] `autoIncrement: true` in eas.json bumps versionCode automatically on each production build
- [GENERATED] EAS managed credentials stores your Android keystore securely on Expo servers

## COUNTEREXAMPLE
- EAS Build requires an internet connection and an Expo account — local-only builds require Gradle setup

## CONTRADICTIONS
- `EXPO_PUBLIC_*` vars are bundled into the client app and visible to anyone who decompiles the APK — never put secrets in EXPO_PUBLIC_ vars
