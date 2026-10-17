import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';
import { i18nLang, I18nService } from './i18n.service';
import { i18nOriginal, i18nOriginalAttr, i18nT } from './i18n-core';
import { cpPack } from './country-pack.service';

/**
 * v1.16.0 – field help: when the user puts the cursor in ANY field (input, select, textarea, date picker, mat-select …)
 * a help panel next to it shows what the field means, its format, an example, its rules (required, length, allowed
 * values from the screen and the model) and UAE notes – for the company's country pack and in the user's language.
 * Mouse users get a small “?” button on the field they point at.
 *
 * Applied to every screen without template changes: one document-level focusin / mouseover listener (outside Angular,
 * so typing never triggers change detection). The help catalogue (GET /tools/api/field-help/?lang=) is loaded on the
 * first focus and cached (memory + localStorage per language and version). Lookup order: form designer field (help
 * text / example from the designer) → the company's edits → catalogue entry by label → by control name →
 * knowledge-base pattern on the label → generic help of the field type, worded with the field's own label.
 * Each user can switch it off (the panel's link, Settings → Field help); the choice is kept per login.
 */
interface Parts { w?: string; f?: string; x?: string; r?: string; u?: string; }
interface Info { label: string; labelShown: string; key: string; nameKey: string; type: string; star: boolean; }
interface Shown { title: string; parts: Parts; rules: string[]; noteTitle: string; }

const CONTROL = 'input, select, textarea, [role=combobox], .mat-mdc-select, mat-select';
const SKIP_TYPES = ['hidden', 'submit', 'button', 'reset', 'image'];
const LABELISH = 'label, mat-label, .zf-label, .form-label, .k, legend, .control-label, .field-label';
const LS_OFF = 'zeo.fieldHelp.off';
const LS_CAT = 'zeo.fieldHelp.cat.';

@Injectable({ providedIn: 'root' })
export class FieldHelpService {
  private cat: any = null;
  private catLang = '';
  private loading: Promise<any> | null = null;
  private kbRe: Array<{ id: string; re: RegExp | null; nm: RegExp | null }> | null = null;
  private infos = new WeakMap<Element, Info>();
  private panel: HTMLElement | null = null;
  private icon: HTMLElement | null = null;
  private target: HTMLElement | null = null;
  private hoverEl: HTMLElement | null = null;
  private hideIconTimer: any = null;
  private started = false;
  private raf = 0;
  private rafMove = 0;
  /** last help shown (for tests / support: window.__zfh.last) */
  last: { key: string; label: string; title: string; text: string; source: string } | null = null;

  constructor(private zone: NgZone, private i18n: I18nService) {}

  // ------------------------------------------------------------------ switch per user
  get enabled(): boolean { try { return localStorage.getItem(LS_OFF) !== '1'; } catch { return true; } }
  setEnabled(on: boolean): void {
    try { on ? localStorage.removeItem(LS_OFF) : localStorage.setItem(LS_OFF, '1'); } catch { /* private window */ }
    if (!on) { this.hide(); this.hideIcon(); }
    this.savePref(on);
  }
  private api(path: string, q = ''): string {
    return `${environment.apiBaseUrl}${path}?schema=${localStorage.getItem('selectedSchema') || ''}${q}`;
  }
  private headers(): Record<string, string> {
    const t = localStorage.getItem('auth_token');
    return t ? { Authorization: 'Bearer ' + t, 'X-Language': i18nLang() } : { 'X-Language': i18nLang() };
  }
  /** The user's choice is also kept on the server (Chatter list layout 'pref:field-help'), so it follows the login. */
  private savePref(on: boolean): void {
    if (!localStorage.getItem('auth_token')) { return; }
    fetch(this.api('/chatter/api/layout/list/', '&key=pref:field-help'), { method: 'PUT', headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ off: !on }) }).catch(() => { /* offline */ });
  }
  private async loadPref(): Promise<void> {
    if (!localStorage.getItem('auth_token') || !localStorage.getItem('selectedSchema')) { return; }
    try {
      const r = await fetch(this.api('/chatter/api/layout/list/', '&key=pref:field-help'), { headers: this.headers() });
      if (r.ok) { const d = await r.json(); const off = !!(d?.off ?? d?.data?.off); try { off ? localStorage.setItem(LS_OFF, '1') : localStorage.removeItem(LS_OFF); } catch { /* */ } }
    } catch { /* keep the local choice */ }
  }

  // ------------------------------------------------------------------ start (once, from AppComponent)
  start(): void {
    if (this.started || typeof document === 'undefined') { return; }
    this.started = true;
    (window as any).__zfh = this;
    this.zone.runOutsideAngular(() => {
      document.addEventListener('focusin', this.onFocus, true);
      document.addEventListener('focusout', this.onBlur, true);
      document.addEventListener('mouseover', this.onHover, { capture: true, passive: true });
      document.addEventListener('keydown', this.onKey, true);
      document.addEventListener('mousedown', this.onDown, true);   // v1.26.0
      document.addEventListener('mousedown', this.onDownAlways, true);   // v1.26.0
      window.addEventListener('scroll', this.onMove, { capture: true, passive: true });
      window.addEventListener('resize', this.onMove, { passive: true });
    });
    setTimeout(() => this.loadPref(), 4000);
  }

  // ------------------------------------------------------------------ catalogue (lazy, cached)
  private async load(): Promise<any> {
    const lang = i18nLang() || 'en';
    if (this.cat && this.catLang === lang) { return this.cat; }
    if (this.loading && this.catLang === lang) { return this.loading; }
    this.catLang = lang;
    let cached: any = null;
    try { cached = JSON.parse(localStorage.getItem(LS_CAT + lang) || 'null'); } catch { cached = null; }
    if (cached) { this.setCat(cached); }
    this.loading = (async () => {
      try {
        const r = await fetch(this.api('/tools/api/field-help/', `&lang=${lang}`), { headers: this.headers() });
        if (r.ok) {
          const d = await r.json();
          if (!cached || d.version !== cached.version) {
            this.setCat(d);
            try { localStorage.setItem(LS_CAT + lang, JSON.stringify(d)); } catch { /* storage full: memory only */ }
          }
        }
      } catch { /* offline: the cached copy or the built-in generic help */ }
      return this.cat;
    })();
    return cached || this.loading;
  }
  private byLa: Record<string, string> = {};
  private setCat(d: any): void {
    this.cat = d; this.kbRe = null; this.infos = new WeakMap();
    // translated labels -> catalogue key (a label whose English original is not known, e.g. a translated placeholder)
    this.byLa = {};
    for (const [k, e] of Object.entries<any>(d?.fields || {})) { if (e.la) { this.byLa[laKey(e.la)] ??= k; } }
  }
  /** Drop the cached catalogue (after an admin edit) so the next focus loads the new texts. */
  refresh(): void {
    try { Object.keys(localStorage).filter(k => k.startsWith(LS_CAT)).forEach(k => localStorage.removeItem(k)); } catch { /* */ }
    this.cat = null; this.loading = null; this.catLang = '';
  }

  // ------------------------------------------------------------------ events
  private isField(el: any): el is HTMLElement {
    if (!el || el.nodeType !== 1) { return false; }
    const e = el as HTMLElement;
    if (e.closest('[data-no-help], .zfh, .zfh-icon')) { return false; }
    const tag = e.tagName;
    if (tag === 'INPUT') { return !SKIP_TYPES.includes(((e as HTMLInputElement).type || 'text').toLowerCase()); }
    if (tag === 'SELECT' || tag === 'TEXTAREA') { return true; }
    return e.matches('mat-select, .mat-mdc-select, [role=combobox]');
  }

  private onFocus = (ev: FocusEvent) => {
    const el = ev.target as HTMLElement;
    if (!this.isField(el)) { return; }
    if (!this.enabled) { return; }
    this.target = el;
    // v1.28.1: the panel no longer opens by itself when a field gets the focus – the team found it in the way.
    // The field shows its “?” (click it, or press F1) and the panel opens on request only.
    this.hoverEl = el;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.showIcon(el));
  };
  private onBlur = (ev: FocusEvent) => {
    const next = ev.relatedTarget as HTMLElement | null;
    if (next && (next.closest('.zfh') || this.isField(next))) { return; }
    setTimeout(() => { if (!document.activeElement || !this.isField(document.activeElement) ) { if (!this.panel?.matches(':hover')) { this.hide(); } } }, 150);
  };
  /** v1.26.0: a click that opens a list (mat-select, drop-down arrow, date picker) hides the panel so it does not cover the options. */
  private onDown = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    if (!t || !this.panel || this.panel.style.display === 'none') { return; }
    if (t.closest('mat-select, .mat-mdc-select, .searchable-arrow, .dropdown-toggle, select, .mat-datepicker-toggle')) { this.hide(); }
  };
  private quietUntil = 0;
  /** v1.26.0: the focus that follows a click on a list comes before the list opens – stay hidden for a moment. */
  private onDownAlways = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    if (t && typeof t.closest === 'function' && t.closest('mat-select, .mat-mdc-select, .searchable-arrow, .dropdown-toggle, select, .mat-datepicker-toggle')) {
      this.quietUntil = Date.now() + 700;
    }
  };
  private onKey = (ev: KeyboardEvent) => {
    // v1.26.0: typing in the field or opening a list hides the panel – it covered the search results / options
    if (this.panel && this.panel.style.display !== 'none' && this.target && ev.target === this.target
        && (ev.key.length === 1 || ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ')) { this.hide(); return; }
    if (ev.key === 'Escape' && this.panel && this.panel.style.display !== 'none') { this.hide(); }
    else if (ev.key === 'F1' && this.target && this.enabled) { ev.preventDefault(); this.showFor(this.target); }
  };
  private onMove = () => {
    if (this.panel && this.panel.style.display !== 'none' && this.listOpen(this.target)) { this.hide(); return; }
    if (this.panel && this.panel.style.display !== 'none' && this.target) {
      cancelAnimationFrame(this.rafMove);   // own frame handle: a scroll caused by the focus must not cancel the pending help
      this.rafMove = requestAnimationFrame(() => { if (this.target && this.target.isConnected) { this.place(this.panel!, this.target); } else { this.hide(); } });
    }
    this.hideIcon();
  };
  private onHover = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement;
    if (!this.enabled || !t || t.nodeType !== 1) { return; }
    if (typeof t.closest === 'function' && t.closest('.zfh-icon')) { clearTimeout(this.hideIconTimer); return; }
    const host: HTMLElement | null = this.isField(t) ? t : ((t as HTMLElement).closest('mat-select, .mat-mdc-select') as HTMLElement | null);
    if (host && host !== this.hoverEl) {
      this.hoverEl = host;
      clearTimeout(this.hideIconTimer);
      requestAnimationFrame(() => this.showIcon(host));
    } else if (!host && this.hoverEl) {
      clearTimeout(this.hideIconTimer);
      this.hideIconTimer = setTimeout(() => this.hideIcon(), 600);
    }
  };

  // ------------------------------------------------------------------ field identity
  /** Label (English original + as shown), help key, control name and type of a field. */
  info(el: HTMLElement): Info {
    let i = this.infos.get(el);
    if (i) { return i; }
    const lab = this.labelOf(el);
    const english = clean(lab.english) || clean(i18nOriginalAttr(el, 'placeholder') || el.getAttribute('aria-label') || el.getAttribute('title') || '');
    const shown = clean(lab.shown) || clean(el.getAttribute('placeholder') || el.getAttribute('aria-label') || '') || english;
    const name = el.getAttribute('formcontrolname') || el.getAttribute('name') || el.getAttribute('ng-reflect-name') || el.id || '';
    const star = /\*/.test(lab.raw || '') || !!lab.req;
    i = { label: english, labelShown: shown, key: english ? 'label:' + keyOf(english) : '', nameKey: nameKeyOf(name), type: typeOf(el), star };
    this.infos.set(el, i);
    return i;
  }

  private labelOf(el: HTMLElement): { english: string; shown: string; raw?: string; req?: boolean } {
    const txt = (n: Element | null) => n ? { english: i18nOriginal(n, 'mat-icon, .material-icons, .zf-req, input, select, textarea, option, button, .zfh-icon'),
      shown: textOf(n), raw: n.textContent || '', req: !!n.querySelector('.zf-req, .required, .text-danger') } : null;
    const lb = el.getAttribute('aria-labelledby');
    // v1.26.0: a mat-select without <mat-label> points aria-labelledby at its own value text ("Head Office – Dubai"), which
    // matched the "head / owner" rule and showed "The person (employee or user) for this role" on a Branch field. Ids that
    // point inside the field itself are skipped; the caption next to the field is used instead.
    if (lb) {
      for (const id of lb.split(' ')) {
        const n = document.getElementById(id);
        if (n && !el.contains(n) && !n.closest('.mat-mdc-select-value, .mat-select-value, mat-select')) { return txt(n)!; }
      }
    }
    if (el.id) {
      try { const n = document.querySelector(`label[for="${(window as any).CSS?.escape ? CSS.escape(el.id) : el.id}"]`); if (n) { return txt(n)!; } } catch { /* odd id */ }
    }
    const wrap = el.closest('label');
    if (wrap && clean(textOf(wrap))) { return txt(wrap)!; }
    const mff = el.closest('mat-form-field');
    if (mff) { const ml = mff.querySelector('mat-label'); if (ml) { return txt(ml)!; } }
    // a container that holds only this field: its caption
    let a: HTMLElement | null = el.parentElement;
    for (let depth = 0; a && depth < 4 && a !== document.body; depth++, a = a.parentElement) {
      const controls = a.querySelectorAll(CONTROL);
      if (controls.length > 1) {
        // several fields: the caption right before the field (or before its wrapper)
        let cur: Element | null = depth === 0 ? el : this.childOf(a, el);
        for (let s = cur?.previousElementSibling; s; s = s.previousElementSibling) {
          if (s.matches(LABELISH)) { return txt(s)!; }
          if (s.querySelector(CONTROL)) { break; }
        }
        break;
      }
      const cap = a.querySelector(LABELISH);
      if (cap && !cap.contains(el) && clean(textOf(cap))) { return txt(cap)!; }
    }
    return { english: '', shown: '', raw: '' };
  }
  private childOf(a: Element, el: Element): Element | null {
    let c: Element | null = el;
    while (c && c.parentElement !== a) { c = c.parentElement; }
    return c;
  }

  // ------------------------------------------------------------------ help text
  /** The help for a field (null when the catalogue is not loaded yet). Public for tests. */
  helpFor(el: HTMLElement): (Shown & { key: string; source: string }) | null {
    const cat = this.cat;
    const i = this.info(el);
    const pack = cpPack().pack || 'AE';
    const lang = i18nLang() || 'en';
    const tr = (s: string) => (s ? i18nT(s) : s);
    const ui = (s: string, p?: any[]) => { const v = cat?.ui?.[s] || s; return p ? v.replace(/\{(\d+)\}/g, (_: string, n: string) => String(p[+n] ?? '')) : v; };
    let parts: Parts = {}; let source = 'generic'; let key = i.key || (i.nameKey ? 'name:' + i.nameKey : '');
    let ae = false; let native = true;

    // 1. a form designer field: help text and example from the designer
    const zf = el.closest('.zf[data-help], .zf[data-example]') as HTMLElement | null;
    if (zf && (zf.dataset['help'] || zf.dataset['example'])) {
      parts = { w: zf.dataset['help'] || '', x: zf.dataset['example'] || '' }; source = 'designer'; native = lang === 'en';
    }
    const ov = cat?.overrides || {};
    const fields = cat?.fields || {};
    if (!fields[i.key] && i.labelShown && this.byLa[laKey(i.labelShown)]) { key = this.byLa[laKey(i.labelShown)]; }
    let entry = fields[key] || fields[i.key] || (i.nameKey && cat?.names?.[i.nameKey] ? fields[cat.names[i.nameKey]] : null);
    if (!entry && i.nameKey && fields['name:' + i.nameKey]) { entry = fields['name:' + i.nameKey]; }
    if (entry && !fields[i.key] && cat?.names?.[i.nameKey]) { key = cat.names[i.nameKey]; }
    let kbId = entry?.kb && this.kbFits(entry.kb, i.type) ? entry.kb : '';
    if (!kbId && source !== 'designer') { kbId = this.kbMatch(i.label || (entry?.l ?? ''), i.nameKey, i.type); }
    let kb = kbId ? cat?.kb?.[kbId] : null;
    if (source !== 'designer') {
      if (kb) {
        parts = { ...kb.txt }; source = 'kb:' + kbId; ae = !!kb.ae; native = kb.native;
        if (pack !== 'AE') {
          const cc = kb.cc?.[pack] || kb.cc?.['GEN'];
          if (cc) { parts = { ...parts, ...cc }; } else { parts.u = ''; }
        }
      } else if (cat) {
        const g = cat.generic?.[i.type] || cat.generic?.['text'];
        if (g) {
          parts = { ...g.txt }; native = g.native;
          if (pack !== 'AE' && g.cc?.['GEN']) { parts = { ...parts, ...(g.cc[pack] || g.cc['GEN']) }; }
          const lab = lang === 'en' ? (i.label || i.labelShown) : (entry?.la || i.labelShown || i.label);
          const name = lab ? lab.charAt(0).toLowerCase() + lab.slice(1) : ui('this field');
          for (const k of Object.keys(parts) as Array<keyof Parts>) { if (parts[k]) { parts[k] = String(parts[k]).replace('{0}', name).replace('“' + name + '”', '“' + lab + '”'); } }
          if (entry?.h) { parts.w = entry.h; }
          source = entry ? 'catalogue-generic' : 'type-generic';
        }
      }
    }
    // the company's own edits win (per field, per knowledge-base entry or per field type)
    const mine = ov[key] || (kbId ? ov['kb:' + kbId] : null) || (!kbId ? ov['generic:' + i.type] : null);
    if (mine) { parts = { ...parts, ...Object.fromEntries(Object.entries(mine).filter(([, v]) => v)) }; source += '+edited'; native = true; }
    if (!native) { for (const k of Object.keys(parts) as Array<keyof Parts>) { parts[k] = tr(parts[k] || ''); } }
    if (!parts.x && i.type !== 'checkbox') {
      // no example in the catalogue: the field's own hint (placeholder "e.g. …") or the first real choice of a list
      const ph = clean(el.getAttribute('placeholder') || '');
      if (el.tagName === 'SELECT') {
        const o = Array.from((el as HTMLSelectElement).options).map(x => clean(x.text)).find(t => t && !/^(select|choose|--|—|-|–|all|any)\b|…$/i.test(t));
        if (o) { parts.x = o; }
      } else if (ph && !/^(search|type|enter|select|choose)\b|…$|\.\.\.$/i.test(ph) && !/بحث|اكتب|أدخل|اختر/.test(ph)) {
        parts.x = ph.replace(/^(e\.g\.|eg|for example|مثال|مثلاً)[:\s]*/i, '');
      }
    }
    if (!cat && source === 'generic') { return null; }

    // rules from the screen (required, length, range, options) and from the model
    const rules: string[] = [];
    const inp = el as HTMLInputElement;
    const required = inp.required || el.getAttribute('aria-required') === 'true' || i.star;
    rules.push(ui(required ? 'Required' : 'Optional'));
    const maxLen = inp.maxLength > 0 && inp.maxLength < 100000 ? inp.maxLength : (entry?.m?.max || 0);
    if (maxLen && ['text', 'textarea', 'email', 'tel', 'url', 'password', 'search'].includes(i.type)) { rules.push(ui('Up to {0} characters', [maxLen])); }
    if (inp.minLength > 0) { rules.push(ui('At least {0} characters', [inp.minLength])); }
    const zfd = el.closest('.zf') as HTMLElement | null;
    const min = inp.min || zfd?.dataset['min'] || ''; const max = inp.max || zfd?.dataset['max'] || '';
    if (min) { rules.push(ui('Lowest: {0}', [min])); }
    if (max) { rules.push(ui('Highest: {0}', [max])); }
    if (el.tagName === 'SELECT') {
      const opts = Array.from((el as HTMLSelectElement).options).map(o => clean(o.text)).filter(t => t && !/^(select|choose|--|—|-|–|all|any)\b|…$/i.test(t));
      if (opts.length) { rules.push(ui('Allowed values: {0}', [opts.slice(0, 8).join(', ') + (opts.length > 8 ? ' ' + ui('and {0} more', [opts.length - 8]) : '')])); }
    } else if (entry?.m?.choices?.length && i.type !== 'checkbox') {
      rules.push(ui('Allowed values: {0}', [entry.m.choices.slice(0, 8).map((c: string) => tr(c)).join(', ')]));
    }
    const title = i.labelShown || i.label || ui('Field help');
    const noteTitle = pack === 'AE' ? ui('UAE note') : ui('Country note');
    return { title, parts, rules, noteTitle: ae || parts.u ? noteTitle : noteTitle, key, source };
  }

  private kbFits(id: string, type: string): boolean {
    const only: string[] = this.cat?.kb?.[id]?.only || [];
    return !only.length || only.includes(type);
  }
  private kbMatch(label: string, nameKey: string, type: string): string {
    const kb = this.cat?.kb;
    if (!kb) { return ''; }
    if (!this.kbRe) {
      this.kbRe = Object.keys(kb).map(id => {
        let re: RegExp | null = null; let nm: RegExp | null = null;
        try { re = kb[id].re ? new RegExp('^(?:' + kb[id].re + ')$') : null; } catch { re = null; }
        try { nm = kb[id].nm ? new RegExp('^(?:' + kb[id].nm + ')$') : null; } catch { nm = null; }
        return { id, re, nm };
      });
    }
    const lk = keyOf(label);
    if (lk) { for (const r of this.kbRe) { if (r.re && r.re.test(lk) && this.kbFits(r.id, type)) { return r.id; } } }
    const nk = nameKey.replace(/^(emp_|temp_emp_|temp_|ef_)/, '');
    if (nk) { for (const r of this.kbRe) { if (r.nm && (r.nm.test(nk) || r.nm.test(nameKey)) && this.kbFits(r.id, type)) { return r.id; } } }
    return '';
  }

  // ------------------------------------------------------------------ panel
  /** v1.26.0: an open list (mat-select options, autocomplete, date picker) – the panel would cover it and take its clicks. */
  private listOpen(el?: HTMLElement | null): boolean {
    if (el && (el.getAttribute('aria-expanded') === 'true' || el.closest('[aria-expanded="true"]'))) { return true; }
    return !!document.querySelector('.cdk-overlay-container .mat-mdc-select-panel, .cdk-overlay-container .mat-select-panel, '
      + '.cdk-overlay-container .mat-mdc-autocomplete-panel, .cdk-overlay-container .mat-datepicker-content');
  }

  async showFor(el: HTMLElement): Promise<void> {
    if (!this.enabled || !el.isConnected || this.listOpen(el) || Date.now() < this.quietUntil) { return; }
    this.target = el;
    let h = this.helpFor(el);
    if (!h) { await this.load(); if (this.target !== el) { return; } h = this.helpFor(el); }
    if (!h || this.listOpen(el)) { return; }
    const p = this.ensurePanel();
    const ui = (s: string) => this.cat?.ui?.[s] || s;
    const esc = (s: string) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
    const row = (label: string, v?: string, cls = '') => v ? `<div class="zfh-row ${cls}"><span class="zfh-k">${esc(ui(label))}</span><span class="zfh-v" dir="auto">${esc(v)}</span></div>` : '';
    p.innerHTML = `<div class="zfh-h"><span class="zfh-q" aria-hidden="true">?</span><b dir="auto">${esc(h.title)}</b>
        <button type="button" class="zfh-x" aria-label="${esc(ui('Close help'))}">×</button></div>
      ${h.parts.w ? `<p class="zfh-w" dir="auto">${esc(h.parts.w)}</p>` : ''}
      ${row('Format', h.parts.f)}${row('Example', h.parts.x, 'zfh-ex')}
      <div class="zfh-row"><span class="zfh-k">${esc(ui('Rules'))}</span><span class="zfh-v" dir="auto">${esc([...h.rules, h.parts.r || ''].filter(Boolean).join(' · '))}</span></div>
      ${h.parts.u ? `<div class="zfh-note" dir="auto"><b>${esc(h.noteTitle)}</b> ${esc(h.parts.u)}</div>` : ''}
      <div class="zfh-f"><button type="button" class="zfh-off">${esc(ui('Turn off field help'))}</button></div>`;
    p.setAttribute('dir', this.i18n.dir);
    p.setAttribute('data-key', h.key);
    p.setAttribute('data-source', h.source);
    p.style.display = 'block';
    this.place(p, el);
    const id = 'zfh-panel';
    const prev = el.getAttribute('aria-describedby') || '';
    if (!prev.includes(id)) { el.setAttribute('aria-describedby', (prev + ' ' + id).trim()); }
    this.last = { key: h.key, label: h.title, title: h.title, text: p.innerText, source: h.source };
  }

  private ensurePanel(): HTMLElement {
    if (this.panel && this.panel.isConnected) { return this.panel; }
    if (!document.getElementById('zfh-style')) {
      const st = document.createElement('style');
      st.id = 'zfh-style';
      st.textContent = FIELD_HELP_CSS;
      document.head.appendChild(st);
    }
    const p = document.createElement('div');
    p.className = 'zfh'; p.id = 'zfh-panel'; p.setAttribute('role', 'note'); p.setAttribute('data-no-translate', '');
    p.style.display = 'none';
    p.addEventListener('mousedown', e => { if (!(e.target as HTMLElement).closest('button')) { e.preventDefault(); } });   // keep the cursor in the field
    p.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button');
      if (!b) { return; }
      if (b.classList.contains('zfh-x')) { this.hide(); }
      if (b.classList.contains('zfh-off')) { this.setEnabled(false); }
    });
    document.body.appendChild(p);
    this.panel = p;
    return p;
  }

  private place(p: HTMLElement, el: HTMLElement): void {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(340, vw - 24);
    p.style.width = w + 'px';
    const ph = p.offsetHeight || 160;
    const rtl = this.i18n.dir === 'rtl';
    let left = rtl ? r.right - w : r.left;
    left = Math.max(12, Math.min(left, vw - w - 12));
    let top = r.bottom + 6;
    if (top + ph > vh - 8 && r.top - ph - 6 > 8) { top = r.top - ph - 6; }
    p.style.left = left + 'px';
    p.style.top = Math.max(8, Math.min(top, vh - ph - 8)) + 'px';
  }

  hide(): void {
    if (this.panel) { this.panel.style.display = 'none'; }
    if (this.target) {
      const d = (this.target.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== 'zfh-panel').join(' ');
      d ? this.target.setAttribute('aria-describedby', d) : this.target.removeAttribute('aria-describedby');
    }
  }

  // ------------------------------------------------------------------ "?" button for mouse users
  private showIcon(el: HTMLElement): void {
    if (!el.isConnected || !this.enabled) { return; }
    this.ensurePanel();
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 12) { return; }
    let ic = this.icon;
    if (!ic || !ic.isConnected) {
      const b = document.createElement('button');
      b.type = 'button';
      ic = b; ic.className = 'zfh-icon'; ic.textContent = '?'; ic.setAttribute('data-no-translate', '');
      ic.addEventListener('mousedown', e => e.preventDefault());
      ic.addEventListener('click', () => { if (this.hoverEl) { this.showFor(this.hoverEl); } });
      document.body.appendChild(ic);
      this.icon = ic;
    }
    ic.setAttribute('aria-label', this.cat?.ui?.['Show help for this field'] || 'Show help for this field');
    ic.title = ic.getAttribute('aria-label') || '';
    const rtl = this.i18n.dir === 'rtl';
    ic.style.left = (rtl ? r.left - 9 : r.right - 9) + 'px';
    ic.style.top = (r.top - 9) + 'px';
    ic.style.display = 'block';
  }
  private hideIcon(): void { if (this.icon) { this.icon.style.display = 'none'; } this.hoverEl = null; }
}

// ------------------------------------------------------------------ helpers (same normalisation as tools/fieldhelp)
function clean(s: string | null | undefined): string {
  return String(s || '').replace(/\s+/g, ' ').replace(/\{\{.*?\}\}/g, '').trim().replace(/^[\s:*]+|[\s:*]+$/g, '');
}
function textOf(n: Element): string {
  const c = n.cloneNode(true) as HTMLElement;
  c.querySelectorAll('mat-icon, .material-icons, .zf-req, input, select, textarea, option, button, .zfh-icon').forEach(x => x.remove());
  return c.textContent || '';
}
function laKey(s: string): string { return clean(s).replace(/[.…:*]+$/g, '').trim(); }
export function keyOf(label: string): string {
  return String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
export function nameKeyOf(name: string): string {
  let s = String(name || '').trim();
  s = s.replace(/^(f|form|model|formModel|vals|data|this|item|row|edit|draft|obj|record|newItem|filters?)\./, '').replace(/\[.*?\]/g, '');
  const parts = s.split('.');
  s = parts.length > 1 && ['id', 'value', 'name', 'selected'].includes(parts[parts.length - 1]) ? parts.slice(-2).join('_') : parts[parts.length - 1];
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/[^a-z0-9_]+/g, '');
}
function typeOf(el: HTMLElement): string {
  const tag = el.tagName;
  if (tag === 'SELECT') { return (el as HTMLSelectElement).multiple ? 'multiselect' : 'select'; }
  if (tag === 'TEXTAREA') { return 'textarea'; }
  if (tag !== 'INPUT') { return 'select'; }
  const t = ((el as HTMLInputElement).type || 'text').toLowerCase();
  const map: Record<string, string> = { 'datetime-local': 'datetime', week: 'date', radio: 'radio', checkbox: 'checkbox', number: 'number', range: 'range' };
  if (map[t]) { return map[t]; }
  if (['date', 'time', 'month', 'email', 'tel', 'url', 'password', 'search', 'file', 'color'].includes(t)) { return t; }
  const zf = el.closest('.zf[data-ftype]') as HTMLElement | null;   // designer fields: integer / currency … are text inputs
  const ft = zf?.dataset['ftype'] || '';
  if (['integer', 'decimal', 'currency', 'percent', 'rating'].includes(ft)) { return 'number'; }
  if (ft === 'phone') { return 'tel'; }
  return 'text';
}

/** Styles of the help panel and the "?" button (injected once; light and dark, LTR and RTL). */
const FIELD_HELP_CSS = `
.zfh{position:fixed;z-index:10050;background:#fff;color:#1f2433;border:1px solid #d5d9e6;border-radius:10px;box-shadow:0 10px 28px rgba(20,24,40,.18);
  padding:10px 12px 8px;font:13px/1.45 inherit;font-family:inherit;max-height:60vh;overflow:auto}
.zfh-h{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.zfh-h b{flex:1;font-size:13.5px}
.zfh-q{display:inline-flex;width:18px;height:18px;border-radius:50%;background:#0f766e;color:#fff;font-size:12px;font-weight:700;align-items:center;justify-content:center}
.zfh-x{border:0;background:transparent;font-size:18px;line-height:1;cursor:pointer;color:#6b7185;padding:0 2px}
.zfh-w{margin:2px 0 6px}
.zfh-row{display:grid;grid-template-columns:78px 1fr;gap:6px;padding:2px 0}
.zfh-k{color:#6b7185;font-size:12px}
.zfh-ex .zfh-v{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#f3f5fa;border-radius:4px;padding:0 4px;unicode-bidi:plaintext}
.zfh-note{margin-top:6px;padding:6px 8px;border-radius:6px;background:#ecfdf5;color:#065f46;font-size:12.5px}
.zfh-f{margin-top:6px;text-align:end}
.zfh-off{border:0;background:transparent;color:#4f46e5;cursor:pointer;font-size:12px;padding:0}
.zfh-icon{position:fixed;z-index:10049;display:none;width:18px;height:18px;border-radius:50%;border:1px solid #0f766e;background:#fff;color:#0f766e;
  font:700 11px/16px sans-serif;text-align:center;padding:0;cursor:help;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.zfh-icon:hover{background:#0f766e;color:#fff}
@media print{.zfh,.zfh-icon{display:none!important}}
`;
