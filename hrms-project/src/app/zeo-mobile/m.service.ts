import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';
import { APP_VERSION } from '../shared-ui/version';
import { i18nLang, i18nT } from '../shared-ui/i18n.service';

/**
 * v1.25.0 – the ZEO mobile app (Capacitor): which server, sign-in, fingerprint unlock, push notifications, GPS, camera
 * and files. Every native feature has a browser fallback, so the same screens run (and are tested) in a phone-size
 * browser at /m.
 *
 * Talks to the server's mobile API (/mobile/…, /mobile-co/…, API level 1) and the existing self-service, leave,
 * payslip and attendance APIs.
 */
export const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
const K = { server: 'zeo_server', info: 'zeo_server_info', uid: 'zeo_device_uid', dev: 'zeo_device_id', bio: 'zeo_bio',
  refresh: 'zeo_refresh', user: 'zeo_m_user', token: 'auth_token', token2: 'access_token', schema: 'selectedSchema', cname: 'zeo_m_company' };
/** ZEO Cloud address offered on the first screen – set window.ZEO_CLOUD_URL in assets/env.js (mobile build) when the domain is final. */
export const CLOUD_URL: string = ((window as any).ZEO_CLOUD_URL || 'https://app.zeocloud.ae').replace(/\/+$/, '');

function ls(k: string): string { try { return localStorage.getItem(k) || ''; } catch { return ''; } }
function lsSet(k: string, v: string | null): void { try { if (v === null) { localStorage.removeItem(k); } else { localStorage.setItem(k, v); } } catch { /* storage off */ } }

export function errText(e: any, fallback: string): string {
  const b = e?.error;
  if (e?.name === 'TimeoutError') { return T('The server did not answer. Check the internet connection.'); }
  if (e?.status === 0) { return T('The server could not be reached. Check the internet connection and the server address.'); }
  if (Array.isArray(b) && typeof b[0] === 'string') { return b[0]; }
  if (b && typeof b === 'object') {
    if (typeof b.detail === 'string') { return b.detail; }
    if (typeof b.error === 'string') { return b.error; }
    const first = Object.values(b)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') { return first[0]; }
    if (typeof first === 'string' && first.length < 300) { return first; }
  }
  if (typeof b === 'string' && b.length < 200) { return b; }
  return T(fallback);
}

@Injectable({ providedIn: 'root' })
export class ZeoMobileService {
  readonly native = Capacitor.isNativePlatform();
  readonly platform = Capacitor.getPlatform();   // 'android' | 'ios' | 'web'
  readonly appVersion = APP_VERSION;
  home: any = null;            // last home answer (shared by the tabs)
  private pushStarted = false;

  constructor(private http: HttpClient, private router: Router, private zone: NgZone) {}

  // ------------------------------------------------------------------ server
  server(): string { return (ls(K.server) || environment.apiBaseUrl || '').replace(/\/+$/, ''); }
  hasServer(): boolean { return !!ls(K.server) || !this.native; }
  serverInfo(): any { try { return JSON.parse(ls(K.info) || 'null'); } catch { return null; } }
  isCloud(): boolean { return this.server() === CLOUD_URL || !!this.serverInfo()?.cloud; }

  /** Check an address: it must answer /mobile/api/info/ as a ZEO server. Returns the info. */
  async check(url: string): Promise<any> {
    let u = (url || '').trim().replace(/\/+$/, '');
    if (!u) { throw new Error(T('Enter the server address.')); }
    if (!/^https?:\/\//i.test(u)) { u = 'https://' + u; }
    let info: any;
    try {
      info = await firstValueFrom(this.http.get<any>(`${u}/mobile/api/info/`).pipe(timeout(12000)));
    } catch (e: any) {
      throw new Error(e?.status === 404 ? T('This server has ZEO older than 1.25.0. Ask your IT team to update it.')
        : T('No ZEO server answered at {0}. Check the address and the internet connection.', u));
    }
    if (info?.product !== 'ZEO') { throw new Error(T('No ZEO server answered at {0}. Check the address and the internet connection.', u)); }
    info.url = u;
    return info;
  }

  /** Keep the server; the app starts again so every screen uses it. */
  useServer(info: any): void {
    const changed = info.url !== ls(K.server);
    lsSet(K.server, info.url);
    lsSet(K.info, JSON.stringify(info));
    if (changed) { this.clearLogin(true); }
    if (this.native && changed) { location.replace('/m/login'); }   // start again: every service reads the new address
  }

  /** The app is older than the server allows (min_app). */
  outdated(): boolean {
    const min = this.serverInfo()?.min_app;
    if (!min) { return false; }
    const a = this.appVersion.split('.').map(Number), b = String(min).split('.').map(Number);
    for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) { return (a[i] || 0) < (b[i] || 0); } }
    return false;
  }

  // ------------------------------------------------------------------ http
  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-ZEO-App': `${this.appVersion} ${this.platform}` });
  }
  url(path: string, company = false, q: Record<string, any> = {}): string {
    const ps = new URLSearchParams();
    if (company) { ps.set('schema', this.schema()); }
    Object.entries(q).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') { ps.set(k, String(v)); } });
    const s = ps.toString();
    return `${this.server()}${path}${s ? (path.includes('?') ? '&' : '?') + s : ''}`;
  }
  /** v1.56.1: uploaded files need a login – the phone app adds ?zm=<token> to file addresses (no shared cookie with the server). */
  mediaToken = ''; private mediaAt = 0;
  async refreshMedia(): Promise<void> {
    if (this.mediaToken && Date.now() - this.mediaAt < 6 * 3600 * 1000) { return; }
    try { const r: any = await this.post('/users/media-cookie/', {}, false); this.mediaToken = r?.token || ''; this.mediaAt = Date.now(); } catch { /* files without the token stay closed */ }
  }
  file(url: string | null | undefined): string {
    if (!url) { return ''; }
    if (!this.mediaToken || !/\/media\//.test(url) || /[?&]zm=/.test(url)) { return url; }
    return url + (url.includes('?') ? '&' : '?') + 'zm=' + encodeURIComponent(this.mediaToken);
  }

  get<T = any>(path: string, company = true, q: Record<string, any> = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.url(path, company, q), { headers: this.headers() }).pipe(timeout(30000)));
  }
  post<T = any>(path: string, body: any = {}, company = true): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.url(path, company), body, { headers: this.headers() }).pipe(timeout(45000)));
  }
  del<T = any>(path: string, company = true): Promise<T> {
    return firstValueFrom(this.http.delete<T>(this.url(path, company), { headers: this.headers() }).pipe(timeout(30000)));
  }
  blob(path: string): Promise<Blob> {
    return firstValueFrom(this.http.get(this.url(path, true), { responseType: 'blob', headers: this.headers() }).pipe(timeout(60000)));
  }

  // ------------------------------------------------------------------ login state
  schema(): string { return ls(K.schema); }
  companyName(): string { return ls(K.cname); }
  setCompany(schema: string, name: string): void { lsSet(K.schema, schema); lsSet(K.cname, name); this.home = null; }
  user(): any { try { return JSON.parse(ls(K.user) || 'null'); } catch { return null; } }
  tokenOk(): boolean {
    const t = ls(K.token);
    if (!t) { return false; }
    try { const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return !p.exp || p.exp * 1000 > Date.now() + 60000; }
    catch { return false; }
  }
  storeLogin(r: any, extra: any = {}): void {
    if (r.access) { lsSet(K.token, r.access); lsSet(K.token2, r.access); }   // the web screens read both names
    if (r.refresh) { lsSet(K.refresh, r.refresh); }
    lsSet(K.user, JSON.stringify({ id: r.user_id ?? extra.id, username: r.username ?? extra.username, email: r.email ?? extra.email,
      is_ess: r.is_ess ?? extra.is_ess, is_superuser: r.is_superuser ?? extra.is_superuser }));
  }
  clearLogin(company = true): void {
    [K.token, K.token2, K.refresh, K.user].forEach(k => lsSet(k, null));
    if (company) { [K.schema, K.cname].forEach(k => lsSet(k, null)); }
    this.home = null;
  }
  async signOut(): Promise<void> {
    this.clearLogin(true);
    this.zone.run(() => this.router.navigate(['/m/login']));
  }

  /** After a successful sign-in: where to go (one company → home, several → list). */
  async afterLogin(): Promise<void> {
    const r: any = await this.get('/users/api/my-companies/', false);
    const list: any[] = r?.companies || [];
    const keep = list.find(c => c.schema_name === this.schema());
    if (keep) { this.setCompany(keep.schema_name, keep.name); }
    else if (list.length === 1) { this.setCompany(list[0].schema_name, list[0].name); }
    else { this.setCompany('', ''); }
    this.zone.run(() => this.router.navigate([this.schema() ? '/m/home' : '/m/companies']));
    void this.registerDevice({});   // last seen, app version, language (no key)
    void this.startPush();
  }

  // ------------------------------------------------------------------ this phone
  async uid(): Promise<string> {
    let v = '';
    try { const { Preferences } = await import('@capacitor/preferences'); v = (await Preferences.get({ key: K.uid })).value || ''; } catch { v = ls(K.uid); }
    if (!v) {
      v = (crypto as any).randomUUID ? (crypto as any).randomUUID() : 'p' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { const { Preferences } = await import('@capacitor/preferences'); await Preferences.set({ key: K.uid, value: v }); } catch { /* web */ }
      lsSet(K.uid, v);
    }
    return v;
  }
  private async deviceInfo(): Promise<any> {
    try { const { Device } = await import('@capacitor/device'); const d = await Device.getInfo(); return { model: `${d.manufacturer || ''} ${d.model || ''}`.trim(), os_version: `${d.operatingSystem} ${d.osVersion}` }; }
    catch { return { model: navigator.userAgent.slice(0, 100), os_version: '' }; }
  }
  /** Register / update this phone (POST /mobile/api/devices/). Returns the server answer (with `key` when a new one was made). */
  async registerDevice(extra: any): Promise<any> {
    try {
      const body = { uid: await this.uid(), platform: this.native ? this.platform : 'web', app_version: this.appVersion, lang: i18nLang(),
        schema: this.schema(), ...(await this.deviceInfo()), ...extra };
      const r: any = await this.post('/mobile/api/devices/', body, false);
      if (r?.id) { lsSet(K.dev, String(r.id)); }
      return r;
    } catch (e) { if (extra && Object.keys(extra).length) { throw e; } return null; }
  }

  // ------------------------------------------------------------------ fingerprint / face
  async biometricAvailable(): Promise<{ ok: boolean; kind: string }> {
    if (!this.native) { return { ok: false, kind: '' }; }
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      const r: any = await NativeBiometric.isAvailable();
      const kind = ({ 1: 'Touch ID', 2: 'Face ID', 3: 'fingerprint', 4: 'face', 5: 'iris' } as any)[r.biometryType] || 'fingerprint';
      return { ok: !!r.isAvailable, kind };
    } catch { return { ok: false, kind: '' }; }
  }
  biometricOn(): boolean { return ls(K.bio) === '1'; }

  /** Turn fingerprint sign-in on: the server makes an unlock key, the phone keeps it behind the fingerprint. */
  async enableBiometric(): Promise<void> {
    const { NativeBiometric, AccessControl } = await import('@capgo/capacitor-native-biometric');
    await NativeBiometric.verifyIdentity({ reason: T('Confirm it is you'), title: T('Fingerprint sign-in'), negativeButtonText: T('Cancel') });
    const r = await this.registerDevice({ biometric: true, new_key: true });
    if (!r?.key) { throw new Error(T('The server did not give an unlock key.')); }
    await NativeBiometric.setCredentials({ username: `${r.id}:${await this.uid()}`, password: r.key, server: this.server(), accessControl: AccessControl.BIOMETRY_ANY });
    lsSet(K.bio, '1');
  }
  async disableBiometric(): Promise<void> {
    lsSet(K.bio, null);
    try { const { NativeBiometric } = await import('@capgo/capacitor-native-biometric'); await NativeBiometric.deleteCredentials({ server: this.server() }); } catch { /* none kept */ }
    try { await this.registerDevice({ biometric: false }); } catch { /* signed out already */ }
  }
  /** Fingerprint → unlock key from the keystore → new login from the server. */
  async unlock(): Promise<void> {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const c = await NativeBiometric.getSecureCredentials({ server: this.server(), reason: T('Sign in to ZEO'), title: T('Sign in to ZEO'), negativeButtonText: T('Use password') });
    const [dev, uid] = String(c.username).split(':');
    try {
      const r: any = await this.post('/mobile/api/unlock/', { device: Number(dev), uid, key: c.password }, false);
      this.storeLogin(r);
    } catch (e: any) {
      if (e?.status === 401) { await this.disableBiometric(); }
      throw new Error(errText(e, 'Fingerprint sign-in did not work. Sign in with your password.'));
    }
  }

  // ------------------------------------------------------------------ push notifications
  /** Built with Firebase (google-services.json) – set by the build script in env.js. */
  pushBuilt(): boolean { return this.native && !!(window as any).ZEO_PUSH; }
  async startPush(): Promise<void> {
    if (this.pushStarted || !this.pushBuilt()) { return; }
    this.pushStarted = true;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      let p = await PushNotifications.checkPermissions();
      if (p.receive === 'prompt' || p.receive === 'prompt-with-rationale') { p = await PushNotifications.requestPermissions(); }
      if (p.receive !== 'granted') { return; }
      await PushNotifications.createChannel({ id: 'zeo', name: 'ZEO', importance: 4, visibility: 1 }).catch(() => undefined);
      await PushNotifications.addListener('registration', t => { void this.registerDevice({ push_token: t.value }); });
      await PushNotifications.addListener('pushNotificationActionPerformed', a => {
        const d: any = a.notification?.data || {};
        if (d.schema && d.schema !== this.schema()) { this.setCompany(d.schema, ''); }
        this.zone.run(() => this.router.navigateByUrl(d.route && String(d.route).startsWith('/m/') ? d.route : '/m/home'));
      });
      await PushNotifications.register();
    } catch { this.pushStarted = false; }
  }

  // ------------------------------------------------------------------ GPS, camera, files
  async position(): Promise<{ lat: number; lng: number; acc: number } | null> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      if (this.native) {
        let p = await Geolocation.checkPermissions();
        if (p.location !== 'granted') { p = await Geolocation.requestPermissions({ permissions: ['location'] }); }
        if (p.location !== 'granted') { return null; }
      }
      const r = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
      return { lat: +r.coords.latitude.toFixed(6), lng: +r.coords.longitude.toFixed(6), acc: Math.round(r.coords.accuracy || 0) };
    } catch { return null; }
  }

  /** A selfie (front camera) as a data URL, or null when cancelled. */
  async selfie(): Promise<string | null> {
    if (this.native) {
      try {
        const { Camera, CameraResultType, CameraSource, CameraDirection } = await import('@capacitor/camera');
        const r = await Camera.getPhoto({ source: CameraSource.Camera, direction: CameraDirection.Front, resultType: CameraResultType.DataUrl,
          quality: 60, width: 900, correctOrientation: true, allowEditing: false, saveToGallery: false });
        return r.dataUrl || null;
      } catch { return null; }
    }
    return new Promise(resolve => {   // browser: camera on phones, file chooser elsewhere
      const i = document.createElement('input');
      i.type = 'file'; i.accept = 'image/*'; i.setAttribute('capture', 'user');
      i.onchange = () => {
        const f = i.files?.[0];
        if (!f) { resolve(null); return; }
        const rd = new FileReader();
        rd.onload = () => resolve(String(rd.result || '') || null);
        rd.onerror = () => resolve(null);
        rd.readAsDataURL(f);
      };
      i.click();
    });
  }

  /** Save a downloaded file and offer it to a viewer (phone) / download it (browser). */
  async openFile(blob: Blob, name: string): Promise<void> {
    if (!this.native) {
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = href; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(href), 20000);
      return;
    }
    const data: string = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const w = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
    const { Share } = await import('@capacitor/share');
    await Share.share({ title: name, url: w.uri, dialogTitle: T('Open with') });
  }

  /** Back button (Android) and app resume. */
  async startApp(): Promise<void> {
    if (!this.native) { return; }
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('backButton', ({ canGoBack }) => {
        const u = this.router.url;
        if (['/m/home', '/m/login', '/m/connect'].some(p => u.startsWith(p)) || !canGoBack) { void App.minimizeApp(); }
        else { this.zone.run(() => history.back()); }
      });
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
      await StatusBar.setBackgroundColor({ color: '#2a1638' }).catch(() => undefined);
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide().catch(() => undefined);
    } catch { /* plugins missing in an old build */ }
  }
}
