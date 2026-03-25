#!/usr/bin/env bash
# build-android.sh — EAS Build helper for Infinity Heroes Android
# Run from project root. Requires: npm install -g eas-cli + expo login

set -euo pipefail

PROFILE="${1:-preview}"

echo ""
echo "Infinity Heroes - Android EAS Build"
echo "Profile: $PROFILE"
echo ""

# Preflight
if ! command -v eas &>/dev/null; then
  echo "Installing eas-cli..."
  npm install -g eas-cli
fi

if ! eas whoami &>/dev/null 2>&1; then
  echo "ERROR: Not logged in to Expo. Run: eas login"
  exit 1
fi

case "$PROFILE" in
  development)
    echo "Building development APK (internal distribution)..."
    echo "Use this to test with Expo Dev Client on a real device."
    eas build --platform android --profile development
    ;;
  preview)
    echo "Building preview APK (internal distribution)..."
    echo "Use this to share with testers before Play Store."
    eas build --platform android --profile preview
    ;;
  production)
    echo "Building production AAB for Play Store..."
    echo "This will auto-increment the version code."
    eas build --platform android --profile production
    echo ""
    echo "After build completes, submit to Play Store:"
    echo "  eas submit --platform android --profile production"
    echo ""
    echo "Or manually upload the .aab from: https://expo.dev"
    echo "To: https://play.google.com/console"
    ;;
  submit)
    echo "Submitting latest production build to Play Store..."
    echo "Requires google-services-key.json in project root."
    echo ""
    if [[ ! -f "google-services-key.json" ]]; then
      echo "ERROR: google-services-key.json not found."
      echo "Download from: Google Play Console -> Setup -> API access -> Service accounts"
      exit 1
    fi
    eas submit --platform android --profile production
    ;;
  *)
    echo "Usage: bash scripts/build-android.sh [development|preview|production|submit]"
    echo ""
    echo "  development  Build APK with Expo Dev Client (local testing)"
    echo "  preview      Build APK for internal testers (default)"
    echo "  production   Build AAB for Play Store submission"
    echo "  submit       Submit latest production build to Play Store"
    exit 1
    ;;
esac
