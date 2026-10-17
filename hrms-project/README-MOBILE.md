# ZEO mobile app (1.25.0) – build it and put it on Google Play

The ZEO app for Android is in this frontend project. It is the same Angular code as the web, packaged with **Capacitor 8**: the app opens the phone screens (`/m`) and uses the phone for fingerprint sign-in, push notifications, GPS, camera and files. The Android project is in `android/`; the app id is **`ae.adept.zeo`** (it can never change after the first upload – change it in `capacitor.config.ts` and `android/app/build.gradle` *before* that if Adept prefers another one).

What the app does: choose ZEO Cloud or a company server · sign in (password, code for office users) · fingerprint / face sign-in · company list · home with a one-tap check in / out (GPS and selfie when the company asks) · leave balance, request and withdraw leave · payslips as PDF · my requests · approvals for managers (approve / reject) · English and Arabic · open full ZEO.

The server must run ZEO **1.25.0 or later** (it answers `/mobile/api/info/`) and should be on **https**.

---

## 1. Build the app

### A. On GitHub (no Android Studio needed) – recommended
1. Put the frontend in a GitHub repository (the workflow is `.github/workflows/zeo-android.yml` at the root of `zeo-frontend`).
2. GitHub → **Actions** → **ZEO Android app** → **Run workflow** (version name `1.25.0`, version code `12500`).
3. After about 15 minutes: the run → **Artifacts** → `zeo-android-1.25.0.zip` with
   - `zeo-1.25.0-debug.apk` – install on a test phone (copy to the phone, open it, allow "install unknown apps");
   - `zeo-1.25.0-release.aab` – the file for Google Play (signed when the secrets below are set).
4. Secrets (repository → Settings → Secrets and variables → Actions):

| Secret | What |
|---|---|
| `ZEO_KEYSTORE_BASE64` | the upload key file as base64 (step 2.3) |
| `ZEO_KEYSTORE_PASSWORD`, `ZEO_KEY_ALIAS`, `ZEO_KEY_PASSWORD` | its passwords and alias |
| `GOOGLE_SERVICES_JSON` | content of `google-services.json` from Firebase (push notifications, step 4) |
| `ZEO_CLOUD_URL` | ZEO Cloud address offered on the first screen (default `https://app.zeocloud.ae`) |

### B. On a PC with Android Studio
1. Install **Node 22**, **Android Studio** (it brings Java 21 and the Android SDK).
2. In `hrms-project`: `npm ci`, then
   - Windows: `build-android.bat` · Mac / Linux: `./build-android.sh`
   - or step by step: `npm run mobile:build` then `npm run mobile:open` (opens Android Studio → ▶ Run on a phone or emulator).
3. Results: `android/app/build/outputs/apk/debug/app-debug.apk` and `android/app/build/outputs/bundle/release/app-release.aab`.
4. Signing on the PC: copy `android/keystore.properties.example` to `android/keystore.properties` and fill it in (never share it).

**Every Play Store upload needs a higher version code** (`ZEO_VERSION_CODE`, e.g. 12500 → 12501). Icons and splash come from `resources/` (`npm run mobile:icons` after changing them).

---

## 2. Google Play – first time

### 2.1 Developer account
- Go to **play.google.com/console** and create the account with Adept's Google account. One-time registration fee (US$25 when this was written).
- Choose **Organization** (Adept Business Solutions): it needs a **D-U-N-S number** for the company and identity verification of the account owner. Do this first – it can take days.
- Why organization: new **personal** accounts must run a closed test with **at least 12 testers for 14 days in a row** before they may publish to everyone. The app is published under the organization's name.

### 2.2 Create the app
Play Console → **Create app**: name **ZEO HR** (or the name Adept chooses), default language English, **App**, **Free**, accept the declarations.

### 2.3 Upload key (once – keep it safe)
Google keeps the real signing key (**Play App Signing**, on by default). Adept signs uploads with an *upload key*:
```
keytool -genkeypair -v -keystore zeo-upload.jks -alias zeo-upload -keyalg RSA -keysize 2048 -validity 10000
```
(`keytool` is in Android Studio's `jbr/bin`.) Store `zeo-upload.jks` and its passwords in Adept's password safe. For GitHub: `base64 -w0 zeo-upload.jks` (Mac: `base64 -i zeo-upload.jks`) → secret `ZEO_KEYSTORE_BASE64`. If the upload key is lost, Google can reset it – the app is not lost.

### 2.4 Store listing (Grow → Store presence → Main store listing)
Ready files are in `store/` of the package:

| Item | File / text |
|---|---|
| App icon 512 × 512 | `store/app-icon-512.png` |
| Feature graphic 1024 × 500 | `store/feature-graphic-1024x500.png` |
| Phone screenshots (2–8) | `store/phone-1.png` … `phone-6.png` (1080 × 1920) |
| Short description (80) | *Check in, request leave, see payslips and approve requests – ZEO HR on your phone.* |
| Full description | see 2.7 |
| Category | Business |
| Contact | Adept support e-mail and website |
| Privacy policy | a public page on Adept's website (required: the app uses location and camera) |

### 2.5 App content (Policy → App content) – answer every item
- **Privacy policy** – the URL above.
- **App access** – *All or some functionality is restricted*: give the reviewers a demo server address (https), a login and password of a **demo employee** and of a **demo manager** with approvals waiting, and say that office logins get a code by e-mail (give an ESS login without code to keep it simple).
- **Ads** – No.
- **Content rating** – questionnaire, category *Utility / productivity*; no violence etc. → Everyone.
- **Target audience** – 18 and over.
- **Data safety** – the app collects: *Location – precise* (only at check in / out, for attendance; not shared); *Photos* (selfie with the punch, if the company asks); *Personal info* – name, e-mail, employee code; *Financial info* – salary on payslips; *App info and performance* none; *Device or other IDs* – push token. All sent encrypted (https), not sold, not shared with third parties except Google Firebase for delivering notifications. Data is kept by the employer's ZEO; deletion through the employer (HR).
- **Location permission** – only while the app is open (foreground), so no background-location form is needed.
- **Account deletion** – the app does not create accounts (the employer does); give the support address where an employee can ask for deletion.
- **Government / financial / health apps** – No.

### 2.6 Test, then publish
1. **Testing → Internal testing** → Create release → upload `zeo-1.25.0-release.aab` → release notes → **Save → Review → Start rollout**. Add testers (e-mail list) → they open the opt-in link and install from Play. Internal tests are available within minutes and need no review.
2. Test on several phones: first screen, sign-in (ESS and office with code), fingerprint, check in with GPS / selfie, leave, payslip PDF, approvals, Arabic, notifications.
3. **Production** → Create release → the same (or a newer) .aab → **Countries**: United Arab Emirates, Saudi Arabia, Oman, Qatar, Bahrain, Kuwait (or all) → **Review → Start rollout**. Google's review usually takes from a few hours to a few days.
4. Updates: raise the version code, build, upload a new release in Production (or test first).

### 2.7 Full description (draft)
> ZEO HR is the mobile app of ZEO, the HR and payroll system for UAE and GCC companies.
> • Check in and out with one tap – with location and a selfie when your company asks for them
> • See your leave balance, request leave and follow its approval
> • Open and share your payslips as PDF
> • Managers approve or reject leave and other requests on the go
> • Fingerprint or face sign-in, notifications for approvals, decisions and payslips
> • English and Arabic
> You need a ZEO login from your employer. The app works with ZEO Cloud and with your company's own ZEO server (version 1.25 or later).

---

## 3. iPhone (later)
`npm i @capacitor/ios@8.5.3 && npx cap add ios` on a Mac with Xcode, an Apple Developer account (yearly fee) and the same steps in App Store Connect. Push on iPhone uses the same Firebase project with an APNs key.

## 4. Push notifications (Firebase – free)
1. **console.firebase.google.com** → Add project *ZEO* (Analytics not needed).
2. Add app → Android → package **`ae.adept.zeo`** → download **`google-services.json`** → put it in `android/app/` (or the GitHub secret) and build again. Without it the app works, without notifications.
3. Project settings → **Service accounts** → *Generate new private key* → a JSON file. On **every ZEO server** (cloud and customers' own servers) put the file outside the code and set `ZEO_FCM_CREDENTIALS=/path/to/file.json` in `.env`, restart the API. (One Firebase project serves every server; each server only sends to its own users' phones.)
4. Check: sign in on a phone, then *Leave* → request → the manager's phone gets *"Leave to approve"*. The server keeps a log: Django admin → *Push logs*.

## 5. Good to know
- The app contains the ZEO screens; a newer server keeps working with older apps (mobile API level 1). The server tells old apps to update (`min_app`).
- Company servers on **http** work only for testing (the app warns); use **https** for real data.
- The app sends location **only** with a punch – never in the background.
- `X-ZEO-App` header: every call says the app version and platform (for support).
