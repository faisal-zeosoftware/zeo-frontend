import type { CapacitorConfig } from '@capacitor/cli';

/**
 * v1.25.0 – ZEO mobile app (Android first, iPhone later).
 * The app contains the ZEO screens (built by `npm run mobile:build`) and opens /m; the server is chosen in the app.
 * appId is the Play Store id – it can never change after the first upload.
 */
const config: CapacitorConfig = {
  appId: 'ae.adept.zeo',
  appName: 'ZEO',
  webDir: 'dist/hrms-project/browser',
  android: {
    // company servers on plain http (testing only) – https servers do not need this
    allowMixedContent: true,
    backgroundColor: '#2a1638',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: { launchShowDuration: 1500, launchAutoHide: true, backgroundColor: '#ffffff', androidScaleType: 'CENTER_INSIDE', showSpinner: false },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
    StatusBar: { style: 'DARK', backgroundColor: '#2a1638' },
  },
};

export default config;
