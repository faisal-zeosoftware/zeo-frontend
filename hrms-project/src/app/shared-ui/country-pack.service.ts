import { flagAllows } from './zeo-flags';
import { ChangeDetectorRef, Directive, Injectable, Input, NgZone, OnDestroy, Pipe, PipeTransform, TemplateRef, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription, filter } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * v1.14.0 – country packs (frontend side).
 *
 * The company's country decides which country-specific captions, fields and buttons the screens show.
 * The resolved pack comes from `GET /country-pack/api/current/?schema=…` (built by cpback). Until it has
 * loaded – or when the call fails and nothing is cached for the company – the built-in UAE (AE) pack below
 * is used, so a UAE company looks exactly as before.
 *
 * Use in templates:
 *   {{ 'national_id' | zc }}            → "Emirates ID" (AE) / the pack's caption
 *   {{ 'Amount (AED)' | zc }}           → any caption: UAE terms in it are swapped for the pack's terms
 *   <div *zCountry="'wps_sif'">         → shown only when the feature is on ('!wps_sif' = only when off,
 *                                         'pack:AE' / '!pack:AE' = only for / not for that pack)
 *   {{ amount | zmoney }}               → "AED 1,250.00" (company currency, its decimals)
 *   {{ amount | zmoney:'1.0-0' }}       → "AED 1,250"
 * In code: inject CountryPackService → label(key), feature(key), allows(expr), currency(), text(caption), money(v).
 * Plain functions (no injector) can call cpPack() / cpText() / cpMoney().
 */

export interface CountryPack {
  pack: string;
  country_code: string;
  country_name: string;
  currency: { code: string; symbol: string; decimals: number };
  labels: Record<string, string>;
  features: Record<string, boolean>;
  rules?: { rule_set_id?: number | null; rule_set_name?: string; weekend_days?: number[] };
  overridden?: { labels: string[]; features: string[] };
}

/** The UAE pack – identical to the contract (CONTRACT14.md); used while loading and as fallback. */
export const AE_PACK: CountryPack = {
  pack: 'AE',
  country_code: 'AE', country_name: 'United Arab Emirates',
  currency: { code: 'AED', symbol: 'AED', decimals: 2 },
  labels: {
    national_id: 'Emirates ID', national_id_no: 'Emirates ID no.', national_id_expiry: 'Emirates ID expiry',
    work_permit: 'Labour card', work_permit_no: 'Labour card no.', work_permit_expiry: 'Labour card expiry',
    labour_contract: 'MOHRE contract', labour_authority: 'MOHRE',
    residence_visa: 'Residence visa', visa_uid: 'UID number', visa_file_no: 'Visa file no.',
    wps: 'WPS', wps_file: 'WPS SIF file', employer_id: 'Employer unique ID (MOHRE)', routing_code: 'Bank routing code',
    gratuity: 'Gratuity', end_of_service: 'End of service gratuity',
    nationals: 'Emirati', nationals_plural: 'Emiratis', state: 'Emirate', states: 'Emirates',
    insurance_card: 'Medical insurance card', tax_id: 'TRN',
  },
  features: {
    national_id: true, work_permit: true, labour_contract: true, residence_visa: true,
    wps: true, wps_sif: true, gratuity: true, nationals_reports: true, states: true,
  },
  rules: { rule_set_id: 3, rule_set_name: 'UAE private sector (Federal Decree-Law 33/2021)', weekend_days: [5, 6] },
  overridden: { labels: [], features: [] },
};

/** Neutral captions, used when a pack leaves a caption empty (the field is normally hidden then anyway). */
const NEUTRAL: Record<string, string> = {
  national_id: 'National ID', national_id_no: 'National ID no.', national_id_expiry: 'National ID expiry',
  work_permit: 'Work permit', work_permit_no: 'Work permit no.', work_permit_expiry: 'Work permit expiry',
  labour_contract: 'Labour contract', labour_authority: 'Labour ministry',
  residence_visa: 'Residence permit', visa_uid: 'Residence file no.', visa_file_no: 'Visa file no.',
  wps: 'Salary transfer', wps_file: 'Salary transfer file', employer_id: 'Employer ID', routing_code: 'Bank routing code',
  gratuity: 'End of service', end_of_service: 'End of service benefit',
  nationals: 'National', nationals_plural: 'Nationals', state: 'Region', states: 'Regions',
  insurance_card: 'Medical insurance card', tax_id: 'Tax number',
};

const SCHEMA_KEY = 'selectedSchema';
const CACHE_PREFIX = 'zeoCountryPack:';

let CURRENT: CountryPack = AE_PACK;
let TEXT_RE: RegExp | null = null;
let TEXT_MAP: Map<string, string> = new Map();

function lcFirst(s: string): string { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Merge a server answer on top of the AE defaults so every key is always present. */
function normalise(p: any): CountryPack {
  if (!p || typeof p !== 'object') { return AE_PACK; }
  const cur = { ...AE_PACK.currency, ...(p.currency || {}) };
  if (typeof cur.decimals !== 'number' || cur.decimals < 0 || cur.decimals > 4) { cur.decimals = 2; }
  return {
    pack: p.pack || p.country_code || 'AE',
    country_code: p.country_code || p.pack || 'AE',
    country_name: p.country_name || '',
    currency: cur,
    labels: { ...AE_PACK.labels, ...(p.labels || {}) },
    features: { ...AE_PACK.features, ...(p.features || {}) },
    rules: p.rules || {},
    overridden: p.overridden || { labels: [], features: [] },
  };
}

function labelOf(p: CountryPack, key: string): string {
  const v = p.labels[key];
  if (v === undefined) { return ''; }
  return v || NEUTRAL[key] || '';
}

/** Build the "UAE term → pack term" table used by text(); empty when nothing differs (fast path for AE). */
function buildText(p: CountryPack): void {
  const m = new Map<string, string>();
  const add = (from: string, to: string) => {
    if (!from || from === to || m.has(from)) { return; }
    m.set(from, to);
    const lf = lcFirst(from);
    if (/^[A-Z][a-z]/.test(from) && !m.has(lf)) { m.set(lf, /^[A-Z]{2,}/.test(to) ? to : lcFirst(to)); }
  };
  const L = (k: string) => labelOf(p, k);
  const changed = (k: string) => L(k) !== AE_PACK.labels[k];
  // the regex alternation below is ordered longest first, so "Emirates ID expiry" wins over "Emirates ID"
  for (const k of Object.keys(AE_PACK.labels)) { add(AE_PACK.labels[k], L(k)); }
  if (changed('national_id')) {
    add('Emirates Id', L('national_id')); add('Emirates ID', L('national_id')); add('EID', L('national_id'));
  }
  if (changed('work_permit')) { add('Labour Card', L('work_permit')); }
  if (changed('work_permit') || changed('labour_authority')) { add('Labour (MOHRE)', L('work_permit') + ' (' + L('labour_authority') + ')'); }
  if (changed('nationals_plural')) { add('UAE nationals', L('nationals_plural')); }
  if (changed('nationals')) { add('UAE National', L('nationals')); }
  if (changed('states')) { add('States / emirates', L('states')); }
  if (p.pack !== 'AE') {
    add('Emiratisation', 'Nationalisation'); add('Nafis / Emiratisation position', 'Nationalisation position');
    add('Nafis position', 'Nationalisation position');
    add('UAE identity', 'Identity');
    add('Pension (GPSSA)', 'Pension'); add('GPSSA', 'social insurance');
    add('UAE', p.country_name || 'the country');
    add('AED, whole dirhams', p.currency.code + ', whole units');
    add('Dirhams', p.currency.code); add('dirhams', p.currency.code); add('dirham', p.currency.code);
  }
  if (p.currency.code && p.currency.code !== 'AED') { m.set('AED', p.currency.code); }
  TEXT_MAP = m;
  if (!m.size) { TEXT_RE = null; return; }
  const keys = Array.from(m.keys()).sort((a, b) => b.length - a.length).map(esc);
  // "Emirates" in "Emirates NBD" (a bank) is not a region
  TEXT_RE = new RegExp('(?<![A-Za-z])(' + keys.join('|') + ')(?![A-Za-z]|\\s(?:NBD|ID|Id)\\b)', 'g');
}
buildText(AE_PACK);

/** The pack in force (for plain functions that have no injector). */
export function cpPack(): CountryPack { return CURRENT; }

/** Swap the UAE terms of a caption for the company's terms ("Emirates ID expiry" → "Iqama expiry", "AED" → "SAR"). */
export function cpText(s: any, keepCurrency = false): string {
  if (s === null || s === undefined) { return ''; }
  const t = String(s);
  if (!TEXT_RE) { return t; }
  return t.replace(TEXT_RE, (x: string) => (keepCurrency && x === 'AED') ? x : (TEXT_MAP.get(x) ?? x));
}

/** "AED 1,250.00" in the company currency. digits: Angular digitsInfo ('1.0-0') or a decimals count. */
export function cpMoney(v: any, digits?: string | number, withCode = true): string {
  if (v === null || v === undefined || v === '') { return withCode ? '–' : ''; }
  const n = Number(String(v).replace(/,/g, ''));
  if (isNaN(n)) { return String(v); }
  const c = CURRENT.currency;
  let min = c.decimals, max = c.decimals;
  if (typeof digits === 'number') { min = max = digits; }
  else if (typeof digits === 'string') {
    const m = /^\d+\.(\d+)-(\d+)$/.exec(digits);
    if (m) { min = +m[1]; max = +m[2]; }
  }
  const s = n.toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max });
  return withCode ? `${c.code} ${s}` : s;
}

@Injectable({ providedIn: 'root' })
export class CountryPackService implements OnDestroy {
  private api = environment.apiBaseUrl;
  private loadedFor: string | null = null;
  private loading = false;
  private lastCheck = 0;
  private sub?: Subscription;

  /** The resolved pack in force (AE until the company's pack has loaded). */
  readonly pack$ = new BehaviorSubject<CountryPack>(AE_PACK);

  constructor(private http: HttpClient, private zone: NgZone, router: Router) {
    this.sub = router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.ensure());
    this.ensure();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  get pack(): CountryPack { this.tick(); return this.pack$.value; }

  /** Caption for a contract label key ("national_id" → "Emirates ID"). Unknown keys come back as they are. */
  label(key: string): string {
    const p = this.pack;
    if (!(key in p.labels)) { return key; }
    return labelOf(p, key);
  }

  /** Is a country feature on? Unknown features count as on (nothing disappears by mistake). */
  feature(key: string): boolean {
    const v = this.pack.features[key];
    return v === undefined ? true : !!v;
  }

  /**
   * A `country` condition: 'wps_sif' (feature on), '!wps_sif' (feature off), 'pack:AE' / '!pack:AE' (pack is / is not),
   * several joined with ',' must all hold. Empty = always.
   */
  allows(expr: string | null | undefined): boolean {
    if (!expr) { return true; }
    return String(expr).split(',').map(s => s.trim()).filter(Boolean).every(e => {
      const neg = e.startsWith('!');
      const k = neg ? e.slice(1).trim() : e;
      const fl = flagAllows(k);   // v1.23.0 app: / cloud: flags
      const on = fl !== null ? fl : k.startsWith('pack:')
        ? k.slice(5).split('|').map(x => x.trim().toUpperCase()).includes(String(this.pack.pack).toUpperCase())
        : this.feature(k);
      return neg ? !on : on;
    });
  }

  currency(): { code: string; symbol: string; decimals: number } { return this.pack.currency; }

  /** Caption with the UAE terms swapped for the company's terms (identity for a UAE company). */
  text(s: any, keepCurrency = false): string { this.tick(); return cpText(s, keepCurrency); }

  money(v: any, digits?: string | number): string { this.tick(); return cpMoney(v, digits); }

  /** Reload the pack (e.g. after the Country settings screen saved). */
  reload(): void { this.loadedFor = null; this.ensure(true); }

  // ------------------------------------------------------------------ loading
  private tick(): void {
    const now = Date.now();
    if (now - this.lastCheck < 1000) { return; }
    this.lastCheck = now;
    this.ensure();
  }

  private schema(): string { try { return localStorage.getItem(SCHEMA_KEY) || ''; } catch { return ''; } }

  /** Load the pack when the selected company changed (or force). */
  ensure(force = false): void {
    const s = this.schema();
    if (!force && (s === this.loadedFor || this.loading)) { return; }
    this.loadedFor = s;
    if (!s) { this.set(AE_PACK); return; }
    // instant start from the browser copy of this company's pack, then refresh from the server
    let cached: CountryPack | null = null;
    try { const raw = localStorage.getItem(CACHE_PREFIX + s); cached = raw ? normalise(JSON.parse(raw)) : null; } catch { cached = null; }
    this.set(cached || AE_PACK);
    let token = '';
    try { token = localStorage.getItem('auth_token') || ''; } catch { /* no storage */ }
    if (!token) { return; }
    this.loading = true;
    this.http.get<any>(`${this.api}/country-pack/api/current/?schema=${encodeURIComponent(s)}`).subscribe({
      next: (r) => {
        this.loading = false;
        if (this.schema() !== s) { this.ensure(); return; }
        const p = normalise(r);
        try { localStorage.setItem(CACHE_PREFIX + s, JSON.stringify(p)); } catch { /* storage full */ }
        this.set(p);
      },
      // not available yet (older server) or failed: keep the browser copy, else the UAE defaults
      error: () => { this.loading = false; if (this.schema() !== s) { this.ensure(); } },
    });
  }

  private set(p: CountryPack): void {
    if (JSON.stringify(p) === JSON.stringify(this.pack$.value)) { return; }
    CURRENT = p;
    buildText(p);
    this.zone.run(() => this.pack$.next(p));
  }
}

/** {{ 'national_id' | zc }} → the pack caption; {{ 'Any caption (AED)' | zc }} → caption with the company's terms. */
@Pipe({ name: 'zc', standalone: true, pure: false })
export class ZcPipe implements PipeTransform {
  constructor(private cp: CountryPackService) {}
  transform(v: any): string {
    if (v === null || v === undefined) { return ''; }
    const s = String(v);
    if (/^[a-z_]+$/.test(s) && s in this.cp.pack.labels) { return this.cp.label(s); }
    return this.cp.text(s);
  }
}

/** {{ amount | zmoney }} → "AED 1,250.00"; {{ amount | zmoney:'1.0-0' }}; {{ amount | zmoney:'1.2-2':false }} without the code. */
@Pipe({ name: 'zmoney', standalone: true, pure: false })
export class ZMoneyPipe implements PipeTransform {
  constructor(private cp: CountryPackService) {}
  transform(v: any, digits?: string | number, withCode = true): string { this.cp.pack; return cpMoney(v, digits, withCode); }
}

/** *zCountry="'wps_sif'" – shows the element only when the condition holds (see CountryPackService.allows). */
@Directive({ selector: '[zCountry]', standalone: true })
export class ZCountryDirective implements OnDestroy {
  private expr = '';
  private shown: boolean | null = null;
  private sub: Subscription;

  constructor(private tpl: TemplateRef<any>, private vcr: ViewContainerRef, private cp: CountryPackService, private cd: ChangeDetectorRef) {
    this.sub = this.cp.pack$.subscribe(() => this.update());
  }

  @Input() set zCountry(v: string | null | undefined) { this.expr = v || ''; this.update(); }

  private update(): void {
    const show = this.cp.allows(this.expr);
    if (show === this.shown) { return; }
    this.shown = show;
    this.vcr.clear();
    if (show) { this.vcr.createEmbeddedView(this.tpl); }
    this.cd.markForCheck();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}

/** Everything a template needs: add to a standalone component's imports or to an NgModule's imports. */
export const COUNTRY_PACK_UI = [ZcPipe, ZMoneyPipe, ZCountryDirective];

/**
 * Copy of a config object tree with captions localised and `country`-gated entries removed (used by config-driven pages).
 * A config with `fixedCurrency: 'AED'` at the top keeps its "AED" captions (the server works in AED for it, e.g. Expenses).
 */
export function cpLocalize<T>(cfg: T, cp: CountryPackService): T {
  const keep = !!(cfg && typeof cfg === 'object' && (cfg as any).fixedCurrency);
  const TEXT_KEYS = new Set(['label', 'title', 'intro', 'help', 'placeholder', 'hint', 'emptyText', 'confirm', 'itemName', 'suffix', 'ph', 'l']);
  const walk = (v: any): any => {
    if (Array.isArray(v)) {
      return v.filter(x => !(x && typeof x === 'object' && !Array.isArray(x) && typeof x.country === 'string' && !cp.allows(x.country))).map(walk);
    }
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      const o: any = {};
      for (const [k, x] of Object.entries(v)) {
        o[k] = k === 'lookup' || k === 'params' || k === 'tagColors' ? x            // API property names, not captions
          : TEXT_KEYS.has(k) && typeof x === 'string' ? cp.text(x, keep) : walk(x);
      }
      // a "currency" field that defaults to AED defaults to the company currency
      if (!keep && o.key === 'currency' && o.default === 'AED') { o.default = cp.currency().code; }
      return o;
    }
    return v;
  };
  return walk(cfg);
}

/**
 * Field names (server field keys) that belong to a country feature. Used for field lists the server sends
 * (self-service profile groups, ESS field policies, import templates …) – see cpServerFields().
 */
export const FIELD_COUNTRY: Array<[RegExp, string]> = [
  [/^(emirates_id|eid)(_|$)/, 'national_id'],
  [/^labour_card(_|$)/, 'work_permit'],
  [/^work_permit(_|$)/, 'pack:AE'],            // UAE: separate mission permit; elsewhere the labour card fields are the permit
  [/^mohre(_|$)/, 'labour_contract'],
  [/^visa_(uid|file_no)$/, 'residence_visa'],
  [/^driving_licence_emirate$/, 'pack:AE'],     // UAE emirates pick list
  [/^(wps_agent|employer_unique_id|routing_code|wps_routing_code)$/, 'wps_sif'],
  [/^is_emiratisation$/, 'nationals_reports'],
];

/** The country condition of a server field key ('' = none). */
export function cpFieldCountry(key: any): string {
  const k = String(key || '');
  for (const [re, c] of FIELD_COUNTRY) { if (re.test(k)) { return c; } }
  return '';
}

/**
 * Copy of a server answer that lists fields: entries ({key|field: …}) whose field belongs to a feature that is off
 * are removed, and captions (label, group_label, title, hint, help) use the company's country terms.
 */
export function cpServerFields<T>(data: T, cp: CountryPackService): T {
  const TEXT = new Set(['label', 'group_label', 'title', 'hint', 'help', 'intro']);
  const walk = (v: any): any => {
    if (Array.isArray(v)) {
      return v.filter(x => {
        if (!x || typeof x !== 'object' || Array.isArray(x)) { return true; }
        const c = cpFieldCountry(x.key ?? x.field);
        return !c || cp.allows(c);
      }).map(walk);
    }
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      const o: any = {};
      for (const [k, x] of Object.entries(v)) { o[k] = TEXT.has(k) && typeof x === 'string' ? cp.text(x) : walk(x); }
      return o;
    }
    return v;
  };
  return walk(data);
}
