#!/usr/bin/env bash
# ZEO 1.25.0 – build the Android app on your PC (Mac / Linux). Windows: build-android.bat
# Needs: Node 22, Java 21 (Android Studio's bundled JDK is fine) and the Android SDK (Android Studio).
# Result: android/app/build/outputs/apk/debug/app-debug.apk  and  android/app/build/outputs/bundle/release/app-release.aab
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=6144}"
npm run mobile:build
cd android
chmod +x gradlew
./gradlew assembleDebug bundleRelease
echo
echo "Test on a phone:   android/app/build/outputs/apk/debug/app-debug.apk"
echo "Upload to Google Play: android/app/build/outputs/bundle/release/app-release.aab (signed when android/keystore.properties exists)"
