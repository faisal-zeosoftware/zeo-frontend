@echo off
rem ZEO 1.25.0 - build the Android app on Windows. Needs Node 22, Java 21 and the Android SDK (Android Studio).
cd /d "%~dp0"
if not exist node_modules call npm ci
set NODE_OPTIONS=--max-old-space-size=6144
call npm run mobile:build || exit /b 1
cd android
call gradlew.bat assembleDebug bundleRelease || exit /b 1
echo.
echo Test on a phone:      android\app\build\outputs\apk\debug\app-debug.apk
echo Upload to Google Play: android\app\build\outputs\bundle\release\app-release.aab
