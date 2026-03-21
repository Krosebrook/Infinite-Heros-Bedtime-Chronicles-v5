# Beta Testing Guide — Infinity Heroes: Bedtime Chronicles

## For Beta Testers

### Installing the App

1. You will receive an invite link to join the Google Play internal testing track
2. Open the link on your Android device
3. Accept the invitation in Google Play
4. Install "Infinity Heroes" from the Play Store

### What to Test

- **Create a hero**: Tap "Create Hero", fill in name/title/power, generate an avatar
- **Generate a story**: Choose Classic, Mad Libs, or Sleep mode and generate a story
- **Listen to narration**: Tap the play button during story reading
- **View library**: Check that completed stories appear in the Library tab
- **Badges & streaks**: Complete stories and check the Trophies screen

### Reporting Issues

Please report any issues you encounter:
- App crashes or freezes
- Stories that contain inappropriate content
- Audio playback problems
- UI bugs or confusing navigation

Report via: [TBD — add feedback channel]

### Known Limitations (Beta)

- Rate limiting resets on server restart (in-memory)
- No account system — data is stored on-device only
- Avatar/scene generation may take 10-30 seconds depending on AI provider load
- Background music files must be pre-loaded (first play may have a delay)

## For Developers

### Building a Beta APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK
eas build --platform android --profile preview

# Build production AAB for Play Store
eas build --platform android --profile production
```

### Required EAS Secrets

Set these before building:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://your-api.example.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "..."
```

### Server Deployment

The Express server must be deployed separately. Set `FIREBASE_SERVICE_ACCOUNT_KEY` as an environment variable containing the JSON service account key.

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```
