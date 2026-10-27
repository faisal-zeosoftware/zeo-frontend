import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injectable, Input, NgZone, OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { Direction, Directionality } from '@angular/cdk/bidi';
import { setRtlMirror } from './z-rtl';
import { CommonModule, formatDate } from '@angular/common';
import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DomTranslator, EN_PACK, LangPack, currentPack, i18nLocalize, i18nMessage, i18nT, packLang, setPack } from './i18n-core';

export { i18nT, i18nLocalize, i18nOriginal, i18nOriginalAttr, EN_PACK } from './i18n-core';
export type { LangPack } from './i18n-core';

/**
 * v1.15.0 – language packs (frontend side, like Odoo).
 *
 * The English text in the templates is the key. The user's language comes from `GET /language/api/me/` (own choice →
 * company default → English) and its pack from `GET /language/api/pack/<lang>/` (cached in the browser per language +
 * version). Every API call carries `X-Language` (I18nInterceptor), so server messages, reports and PDFs follow.
 *
 * Use in templates:   {{ 'Save changes' | t }}     {{ 'Showing {0} of {1}' | t:from:total }}     {{ d | zdate }}
 *                     <z-lang-picker></z-lang-picker>   (language picker; variant="menu" | "select")
 * In code:            inject I18nService → t(text, params), lang, dir, setLang(code); plain functions: i18nT(text, params).
 * Existing templates need no edit: when the language is not English the runtime translator (DomTranslator) translates the
 * rendered texts / placeholders / titles that exactly match a term. For English nothing runs (no observer, no lookups).
 */

export interface LangInfo { code: string; name: string; english_name: string; dir: string; date_format?: string; version?: number; }

const LANG_KEY = 'zeoLang';
const PENDING_KEY = 'zeoLangPending';   // chosen on the login page: saved to the account at the first call after login
const PACK_PREFIX = 'zeoLangPack:';
const TOKEN_KEY = 'auth_token';
const SCHEMA_KEY = 'selectedSchema';

let LANG = 'en';

/** Current language code (for code without an injector, e.g. the interceptor). */
export function i18nLang(): string { return LANG; }

function store(): Storage | null { try { return window.localStorage; } catch { return null; } }
function get(k: string): string { try { return store()?.getItem(k) || ''; } catch { return ''; } }
function put(k: string, v: string): void { try { store()?.setItem(k, v); } catch { /* storage full / blocked */ } }

@Injectable({ providedIn: 'root' })
export class I18nService implements OnDestroy {
  private api = environment.apiBaseUrl + '/language/api';
  private loadedKey: string | null = null;
  private sub?: Subscription;
  private translator: DomTranslator | null = null;
  private origAlert: ((m?: any) => void) | null = null;
  private origConfirm: ((m?: string) => boolean) | null = null;
  /** v1.15.0 (langrtl): Angular Material / CDK read the direction from this service (sidenav margins, menus, overlays). */
  private bidi = inject(Directionality, { optional: true });

  /** Current language code ('en', 'ar' …); emits after the pack is in force. */
  readonly lang$ = new BehaviorSubject<string>('en');
  /** Languages offered (company list after login, every active language before). */
  readonly languages$ = new BehaviorSubject<LangInfo[]>([{ code: 'en', name: 'English', english_name: 'English', dir: 'ltr' }]);

  constructor(private http: HttpClient, private zone: NgZone, router: Router) {
    this.sub = router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.ensure());
    // instant start in the last language used in this browser (cached pack), then confirm with the server
    const last = get(LANG_KEY);
    if (last && last !== 'en') { const c = this.cached(last); if (c) { this.apply(c); } }
    this.ensure();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); this.translator?.stop(false); }

  get lang(): string { return LANG; }
  get dir(): string { return currentPack().dir === 'rtl' ? 'rtl' : 'ltr'; }
  get dateFormat(): string { return currentPack().date_format || 'dd/MM/yyyy'; }
  get pack(): LangPack { return currentPack(); }

  t(text: any, params?: any[] | Record<string, any> | null): string { return i18nT(text, params); }

  /** Config tree with its captions translated (use after cpLocalize). */
  localize<T>(cfg: T): T { return i18nLocalize(cfg); }

  /** The runtime translator's counters (performance checks). */
  get stats() { return this.translator?.stats; }

  // ------------------------------------------------------------------------------------------------ loading
  private token(): string { return get(TOKEN_KEY); }
  private schema(): string { return get(SCHEMA_KEY); }
  private q(): string { const s = this.schema(); return s ? `?schema=${encodeURIComponent(s)}` : ''; }

  /** (Re)load when the login or the company changed. */
  ensure(force = false): void {
    const key = (this.token() ? 'u' + this.token().slice(-16) : 'anon') + '|' + this.schema();
    if (!force && key === this.loadedKey) { return; }
    this.loadedKey = key;
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      if (this.token()) {
        let me = await firstValueFrom(this.http.get<any>(`${this.api}/me/${this.q()}`));
        const pending = get(PENDING_KEY);
        if (pending) {
          try { localStorage.removeItem(PENDING_KEY); } catch { /* storage off */ }
          if (pending !== me?.lang && (me?.languages || []).some((l: LangInfo) => l.code === pending)) {
            try { me = await firstValueFrom(this.http.put<any>(`${this.api}/me/${this.q()}`, { lang: pending })); } catch { /* keep the server answer */ }
          }
        }
        if (Array.isArray(me?.languages) && me.languages.length) { this.zone.run(() => this.languages$.next(me.languages)); }
        const lang = me?.lang || 'en';
        put(LANG_KEY, lang);
        await this.loadPack(lang, me?.version, false);
      } else {
        try {
          const langs = await firstValueFrom(this.http.get<LangInfo[]>(`${this.api}/languages/`));
          if (Array.isArray(langs) && langs.length) { this.zone.run(() => this.languages$.next(langs)); }
        } catch { /* older server: English only */ }
        const lang = get(LANG_KEY) || 'en';
        await this.loadPack(lang, undefined, true);
      }
    } catch {
      // server without language packs, or offline: keep what is in force (English by default)
    }
  }

  private cached(lang: string): LangPack | null {
    try { const raw = get(PACK_PREFIX + lang); return raw ? JSON.parse(raw) as LangPack : null; } catch { return null; }
  }

  private async loadPack(lang: string, version: number | undefined, anonymous: boolean): Promise<void> {
    if (!lang || lang === 'en') { this.apply(EN_PACK); return; }
    const c = this.cached(lang);
    if (c && version !== undefined && c.version === version && (anonymous || !c.partial)) { this.apply(c); return; }
    if (c && (anonymous || !c.partial)) { this.apply(c); }      // show at once, refresh below
    try {
      const p = await firstValueFrom(this.http.get<LangPack>(`${this.api}/pack/${encodeURIComponent(lang)}/${this.q()}`));
      if (p && p.lang) {
        if (!(p.partial && c && !c.partial)) { put(PACK_PREFIX + lang, JSON.stringify(p)); }
        this.apply(p.partial && c && !c.partial && c.version === p.version ? c : p);
      }
    } catch {
      if (!c) { this.apply(EN_PACK); }
    }
  }

  /** Switch the user's language (saved on the server when logged in, else in this browser only). */
  async setLang(code: string): Promise<void> {
    const lang = code || 'en';
    put(LANG_KEY, lang);
    if (this.token()) {
      try {
        const me = await firstValueFrom(this.http.put<any>(`${this.api}/me/${this.q()}`, { lang }));
        await this.loadPack(me?.lang || lang, me?.version, false);
        return;
      } catch { /* fall back to the browser choice */ }
    }
    put(PENDING_KEY, lang);   // not logged in: remember it for the account
    await this.loadPack(lang, undefined, !this.token());
  }

  // ------------------------------------------------------------------------------------------------ apply
  private apply(p: LangPack): void {
    const before = packLang() + ':' + currentPack().version;
    setPack(p);
    LANG = p.lang || 'en';
    const rtl = p.dir === 'rtl';
    try {
      const html = document.documentElement;
      html.setAttribute('lang', LANG);
      html.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      document.body?.classList.toggle('rtl', rtl);
    } catch { /* no DOM (server rendering) */ }
    // v1.15.0 (langrtl): Material components created before or after the switch use the same direction as <html dir>
    const d: Direction = rtl ? 'rtl' : 'ltr';
    if (this.bidi && this.bidi.value !== d) {
      (this.bidi as { value: Direction }).value = d;
      this.zone.run(() => this.bidi?.change.emit(d));
    }
    // observers of the mirror run outside Angular: their callbacks must not trigger change detection
    this.zone.runOutsideAngular(() => { try { setRtlMirror(rtl); } catch { /* old browser: src/zrtl.css still applies */ } });
    this.zone.runOutsideAngular(() => {
      if (LANG === 'en') {
        this.translator?.stop(true);            // English: no observer at all; translated texts restored
        this.unpatchDialogs();
      } else {
        if (!this.translator) { this.translator = new DomTranslator(); }
        this.translator.start(document.body);   // (re)translates everything with the new pack
        this.patchDialogs();
      }
    });
    if (before !== LANG + ':' + p.version || this.lang$.value !== LANG) {
      this.zone.run(() => { this.lang$.next(LANG); });   // impure t / zdate pipes refresh with this change detection
    }
  }

  /** alert() / confirm() messages (1,800 calls in the screens) are translated too while the language is not English. */
  private patchDialogs(): void {
    if (this.origAlert || typeof window === 'undefined') { return; }
    this.origAlert = window.alert;
    this.origConfirm = window.confirm;
    const a = this.origAlert, c = this.origConfirm;
    window.alert = (m?: any) => a.call(window, i18nMessage(m));
    window.confirm = (m?: string) => c.call(window, i18nMessage(m));
  }

  private unpatchDialogs(): void {
    if (!this.origAlert) { return; }
    window.alert = this.origAlert;
    window.confirm = this.origConfirm!;
    this.origAlert = null; this.origConfirm = null;
  }
}

/** Adds `X-Language` to every call to the ZEO API (the server answers in that language). */
@Injectable()
export class I18nInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith(environment.apiBaseUrl) && !req.headers.has('X-Language')) {
      req = req.clone({ setHeaders: { 'X-Language': LANG } });
    }
    return next.handle(req);
  }
}

/** {{ 'Save changes' | t }}  ·  {{ 'Showing {0} of {1}' | t:a:b }}  ·  {{ 'Hello {name}' | t:{name: n} }} */
@Pipe({ name: 't', standalone: true, pure: false })
export class TPipe implements PipeTransform {
  transform(v: any, ...params: any[]): string {
    if (params.length === 1 && params[0] && typeof params[0] === 'object') { return i18nT(v, params[0]); }
    return i18nT(v, params.length ? params : null);
  }
}

/** {{ d | zdate }} → the pack's date format (dd/MM/yyyy); {{ d | zdate:'datetime' }} adds the time. Digits stay 0-9. */
@Pipe({ name: 'zdate', standalone: true, pure: false })
export class ZDatePipe implements PipeTransform {
  transform(v: any, mode: 'date' | 'datetime' | 'time' = 'date'): string {
    if (v === null || v === undefined || v === '') { return ''; }
    const fmt = currentPack().date_format || 'dd/MM/yyyy';
    // v1.62.0 ui: one display format everywhere – dd/MM/yyyy (was "12 May 1990" in English views)
    const f = mode === 'time' ? 'HH:mm' : mode === 'datetime' ? fmt + ' HH:mm' : fmt;
    try { return formatDate(v, f, 'en-US'); } catch { return String(v); }
  }
}

/** Language picker: variant "menu" (top bar button), "select" (profile / login page). reload: reload the page after the switch. */
@Component({
  selector: 'z-lang-picker',
  standalone: true,
  imports: [CommonModule, TPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
  <ng-container *ngIf="(svc.languages$ | async) as langs">
    <ng-container *ngIf="langs.length > 1 || showAlways">
      <label *ngIf="variant === 'select'" class="zlp-sel">
        <span class="zlp-label" *ngIf="label">{{ label | t }}</span>
        <select [value]="svc.lang" (change)="pick($any($event.target).value)" [attr.aria-label]="'Language' | t" [disabled]="busy">
          <option *ngFor="let l of langs" [value]="l.code" [selected]="l.code === svc.lang">{{ l.name }}{{ l.name !== l.english_name ? ' – ' + l.english_name : '' }}</option>
        </select>
      </label>
      <span *ngIf="variant === 'menu'" class="zlp-menu" (keydown.escape)="open = false">
        <button type="button" class="zlp-btn" (click)="open = !open" [attr.aria-expanded]="open" [attr.aria-label]="'Language' | t" [title]="'Language' | t">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
          <span class="zlp-code">{{ svc.lang | uppercase }}</span>
        </button>
        <div class="zlp-pop" *ngIf="open" role="menu">
          <button type="button" role="menuitemradio" *ngFor="let l of langs" [attr.aria-checked]="l.code === svc.lang"
                  [class.on]="l.code === svc.lang" (click)="pick(l.code)" [disabled]="busy" [attr.lang]="l.code" [attr.dir]="l.dir">
            <span>{{ l.name }}</span><small *ngIf="l.name !== l.english_name">{{ l.english_name }}</small>
          </button>
        </div>
      </span>
    </ng-container>
  </ng-container>`,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .zlp-sel { display: inline-flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .zlp-sel select { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font-size: 13px; min-width: 160px; }
    .zlp-label { font-weight: 600; color: #334155; }
    .zlp-menu { position: relative; display: inline-flex; }
    .zlp-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 8px; border: 1px solid transparent; border-radius: 6px;
               background: transparent; color: inherit; cursor: pointer; font-size: 12px; font-weight: 600; }
    .zlp-btn:hover, .zlp-btn[aria-expanded=true] { background: rgba(99,102,241,.08); border-color: rgba(99,102,241,.25); }
    .zlp-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 1px; }
    .zlp-pop { position: absolute; top: calc(100% + 6px); inset-inline-end: 0; z-index: 1100; min-width: 170px; padding: 4px;
               background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.14); }
    .zlp-pop button { all: unset; box-sizing: border-box; display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
                      width: 100%; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #0f172a; }
    .zlp-pop button:hover, .zlp-pop button:focus-visible { background: #f1f5f9; }
    .zlp-pop button.on { background: #eef2ff; color: #3730a3; font-weight: 600; }
    .zlp-pop small { color: #64748b; font-size: 11px; }
  `],
})
export class ZLangPickerComponent implements OnDestroy {
  @Input() variant: 'menu' | 'select' = 'menu';
  @Input() label = '';
  /** Reload the page after switching (screens built in code then show the new language everywhere). */
  @Input() reload = true;
  @Input() showAlways = false;
  open = false;
  busy = false;
  private sub: Subscription;

  constructor(public svc: I18nService, private cd: ChangeDetectorRef) {
    this.sub = svc.lang$.subscribe(() => this.cd.markForCheck());
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  async pick(code: string): Promise<void> {
    this.open = false;
    if (!code || code === this.svc.lang) { return; }
    this.busy = true;
    try { await this.svc.setLang(code); } finally { this.busy = false; }
    if (this.reload) { location.reload(); }
  }
}

/** APP_INITIALIZER factory: creates the service at start (language + pack before the first screen when cached). */
export function startI18n(svc: I18nService): () => void { return () => { svc.ensure(); }; }

/** Everything a template needs: add to a standalone component's imports or to an NgModule's imports. */
export const I18N_UI = [TPipe, ZDatePipe, ZLangPickerComponent];
