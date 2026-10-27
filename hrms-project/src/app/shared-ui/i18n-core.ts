/**
 * v1.15.0 – language packs: the plain (Angular-free) core used by I18nService.
 *
 * - the pack in force (terms {english: translation}) with exact, whitespace-normalised and `{0}` template lookups;
 * - i18nT(text, params) for code; i18nLocalize(config) for config-driven captions;
 * - DomTranslator: the runtime translator (MutationObserver) that translates the rendered text of the 223 existing
 *   templates without editing them. It keeps the original text per node (WeakMap), so switching back to English
 *   restores it, and it never touches inputs, data cells, code, icons or [data-no-translate].
 * No Angular imports here: the file is also compiled on its own for the translator tests.
 */

export interface LangPack {
  lang: string;
  name?: string;
  english_name?: string;
  dir: 'ltr' | 'rtl' | string;
  date_format: string;
  number?: { decimal: string; group: string };
  terms: Record<string, string>;
  version: number;
  partial?: boolean;
}

export const EN_PACK: LangPack = {
  lang: 'en', name: 'English', english_name: 'English', dir: 'ltr', date_format: 'dd/MM/yyyy',
  number: { decimal: '.', group: ',' }, terms: {}, version: 0,
};

interface Pat { re: RegExp; order: number[]; tr: string; suffix: number[]; lit: number; words: number; }

let PACK: LangPack = EN_PACK;
let MAP: Map<string, string> = new Map();
let LOWER: Map<string, string> = new Map();   // v1.19.0: case-insensitive fallback (labels moved to sentence case keep their translation)
let BY_FIRST: Map<string, Pat[]> = new Map();
let BY_LAST: Map<string, Pat[]> = new Map();
let OTHER: Pat[] = [];
const WS = /\s+/g;
const PH = /\{(\w+)\}/g;
const HAS_LETTER = /[A-Za-z]/;

function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Load a pack: exact map + `{0}` templates indexed by their first / last whole word. */
export function setPack(p: LangPack | null | undefined): void {
  PACK = p && p.lang ? p : EN_PACK;
  MAP = new Map(); LOWER = new Map();
  BY_FIRST = new Map(); BY_LAST = new Map(); OTHER = [];
  if (PACK.lang === 'en') { return; }
  const terms = PACK.terms || {};
  for (const k of Object.keys(terms)) {
    const v = terms[k];
    if (!v) { continue; }
    MAP.set(k, v);
    const lk = k.toLowerCase();
    if (!LOWER.has(lk)) { LOWER.set(lk, v); }
    if (k.indexOf('{') < 0 || !/\{\d+\}/.test(k)) { continue; }
    // template: literal parts escaped, {n} → lazy group
    const order: number[] = [];
    const body = k.split(/(\{\d+\})/).map(part => {
      const m = /^\{(\d+)\}$/.exec(part);
      if (m) { order.push(+m[1]); return '(.+?)'; }
      return esc(part);
    }).join('');
    const pat: Pat = { re: new RegExp('^' + body + '$'), order, tr: v, suffix: suffixSlots(k), lit: letters(k.replace(/\{\d+\}/g, '')), words: (k.replace(/\{\d+\}/g, '').match(/[A-Za-z]+/g) || []).length };
    const words = k.split(' ');
    const first = words[0], last = words[words.length - 1];
    if (!/\{\d+\}/.test(first)) { push(BY_FIRST, first, pat); }
    else if (!/\{\d+\}/.test(last)) { push(BY_LAST, last, pat); }
    else { OTHER.push(pat); }
  }
}

/** v1.15.0: placeholders written straight after letters in the English text ("day{1}", "entr{1}") carry an English
 *  plural ending; another language drops them. */
function suffixSlots(k: string): number[] {
  const out: number[] = []; const re = /[A-Za-z]\{(\d+)\}/g; let m: RegExpExecArray | null;
  while ((m = re.exec(k))) { out.push(+m[1]); }
  return out;
}

function push(m: Map<string, Pat[]>, k: string, p: Pat): void {
  const a = m.get(k);
  if (a) { a.push(p); } else { m.set(k, [p]); }
}

export function packLang(): string { return PACK.lang; }
export function packDir(): string { return PACK.dir === 'rtl' ? 'rtl' : 'ltr'; }
export function currentPack(): LangPack { return PACK; }

/** Fill {0} / {name} placeholders. */
export function fill(s: string, params?: any[] | Record<string, any> | null): string {
  if (!params) { return s; }
  return s.replace(PH, (m, k) => {
    const v = Array.isArray(params) ? (/^\d+$/.test(k) ? params[+k] : undefined) : (params as any)[k];
    return v === undefined || v === null ? m : String(v);
  });
}

/** v1.17.0: number of Latin letters (the "substance" of a template's literal part or of a captured value). */
function letters(s: string): number { const m = s.match(/[A-Za-z]/g); return m ? m.length : 0; }

/** v1.17.0 (dash17, audit H4): a `{0}` template may only translate a text when its literal part is substantial – at least
 *  4 letters (so "{0} in {1}", "New {0}", "{0} of {1}" never match) – and the placeholders do not carry most of the text
 *  (more letters in the captures than max(12, 2 × the literal letters) = a sentence of data, e.g. an announcement or a holiday
 *  name, which must stay as entered instead of being translated word by word). */
function substantial(p: Pat, caps: string[]): boolean {
  if (p.lit < 4) { return false; }
  // one literal word ("{0} approved", "Payroll {0}"): only numbers / dates / codes may fill the placeholders, never words
  // ("Entries not approved" must not become "Entries not معتمد")
  if (p.words < 2 && caps.some(c => /[A-Za-z]{2,}/.test(c || ''))) { return false; }
  const capLetters = caps.reduce((n, c) => n + letters(c || ''), 0);
  return capLetters <= Math.max(12, 2 * p.lit);
}

function matchTemplate(text: string): string | null {
  if (!BY_FIRST.size && !BY_LAST.size && !OTHER.length) { return null; }
  const sp = text.indexOf(' ');
  const first = sp < 0 ? text : text.slice(0, sp);
  const last = text.slice(text.lastIndexOf(' ') + 1);
  const lists = [BY_FIRST.get(first), BY_LAST.get(last), OTHER];
  for (const list of lists) {
    if (!list) { continue; }
    for (const p of list) {
      const m = p.re.exec(text);
      if (m && substantial(p, m.slice(1))) {
        const vals: string[] = [];
        p.order.forEach((n, i) => { vals[n] = m[i + 1]; });
        p.suffix.forEach(n => { if (/^[a-z]{1,3}$/.test(vals[n] || '')) { vals[n] = ''; } });   // v1.15.0 English plural endings (s / y / ies)
        return p.tr.replace(/\{(\d+)\}/g, (x, n) => vals[+n] !== undefined ? vals[+n] : x);
      }
    }
  }
  return null;
}

/** Translation of a whole text (exact, then whitespace-normalised, then a `{0}` template), or null. */
export function lookup(text: string): string | null {
  if (PACK.lang === 'en' || !text) { return null; }
  let v = MAP.get(text);
  if (v !== undefined) { return v; }
  const k = text.replace(WS, ' ').trim();
  if (k !== text) {
    v = MAP.get(k);
    if (v !== undefined) { return v; }
  }
  v = LOWER.get(k.toLowerCase());
  if (v !== undefined) { return v; }
  return matchTemplate(k);
}

/** t(): the translated text (English when missing), placeholders filled. */
export function i18nT(text: any, params?: any[] | Record<string, any> | null): string {
  if (text === null || text === undefined) { return ''; }
  const s = String(text);
  if (PACK.lang === 'en') { return params ? fill(s, params) : s; }
  const v = MAP.get(s) ?? lookup(s);
  if (v && Array.isArray(params)) {
    const slots = suffixSlots(s);
    if (slots.length) { const ps: any[] = params.slice(); for (const n of slots) { if (/^[a-z]{0,3}$/.test(String(ps[n] ?? ''))) { ps[n] = ''; } } params = ps; }
  }
  return fill(v ?? s, params);
}

/** A message for alert() / confirm(): whole text, else its first line / the part before ': ' translated. */
export function i18nMessage(msg: any): any {
  if (typeof msg !== 'string' || PACK.lang === 'en') { return msg; }
  const whole = lookup(msg);
  if (whole !== null) { return whole; }
  const m = /^([^\n:]{2,200}?)(:\s+|\n+)([\s\S]*)$/.exec(msg);
  if (m) {
    const head = lookup(m[1]) ?? lookup(m[1] + ':');
    const rest = lookup(m[3]) ?? m[3];
    if (head !== null) { return head.replace(/:$/, '') + m[2] + rest; }
  }
  return msg;
}

const TEXT_KEYS = new Set(['label', 'title', 'intro', 'help', 'placeholder', 'hint', 'emptyText', 'confirm', 'itemName', 'suffix',
  'ph', 'l', 'description', 'subtitle', 'caption', 'tooltip', 'text', 'message', 'singular', 'plural', 'unit', 'group', 'section']);
const SKIP_KEYS = new Set(['lookup', 'params', 'tagColors', 'key', 'api', 'url', 'link', 'icon', 'perms', 'country', 'type', 'field', 'value']);

/** Copy of a config tree with its captions translated (after the country-pack step: country first, then language). */
export function i18nLocalize<T>(cfg: T): T {
  if (PACK.lang === 'en' || !cfg) { return cfg; }
  const walk = (v: any): any => {
    if (Array.isArray(v)) { return v.map(walk); }
    if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      const o: any = {};
      for (const [k, x] of Object.entries(v)) {
        o[k] = SKIP_KEYS.has(k) ? x : TEXT_KEYS.has(k) && typeof x === 'string' ? i18nT(x) : walk(x);
      }
      return o;
    }
    return v;
  };
  return walk(cfg);
}

// ---------------------------------------------------------------------------------------------------- runtime translator
/** Never translated (with everything inside). */
const HARD_TAGS = new Set(['INPUT', 'TEXTAREA', 'CODE', 'PRE', 'SCRIPT', 'STYLE', 'MAT-ICON', 'svg', 'SVG', 'NOSCRIPT', 'KBD', 'SAMP']);
const HARD_CLASS = /(^|\s)(zl-data|material-icons[\w-]*|material-symbols[\w-]*|zl-cell-data)(\s|$)/;
/** Inside data cells (tbody td) only these are translated: buttons and the list footer / empty-state rows. */
// v1.38.0: short status / choice words that are texts of the application even inside a data cell (Approved, Pending, Yes …).
// User data (names, codes, free text) is never in this list, so it stays as typed.
const CELL_TERMS = new Set(['approved', 'rejected', 'pending', 'cancelled', 'canceled', 'active', 'inactive', 'draft', 'submitted', 'closed', 'open', 'paid',
  'unpaid', 'yes', 'no', 'completed', 'complete', 'in progress', 'on hold', 'expired', 'processing', 'published', 'confirmed', 'available', 'assigned',
  'new', 'done', 'overdue', 'partial', 'partially paid', 'reviewed', 'to review', 'waiting', 'won', 'lost', 'qualified', 'converted', 'disqualified',
  'nurture', 'sent', 'accepted', 'released', 'locked', 'hot', 'warm', 'cold', 'good', 'fair', 'poor', 'low', 'medium', 'high', 'very high', 'critical',
  'urgent', 'normal', 'resolved', 'escalated', 'reopened', 'scheduled', 'started', 'planned', 'posted', 'cleared', 'bounced', 'returned', 'issued',
  'verified', 'missing', 'damaged', 'found', 'not found', 'under review', 'not started', 'half day', 'full day', 'present', 'absent', 'late', 'leave',
  'holiday', 'weekend', 'male', 'female', 'checked out / assigned', 'in store', 'in use', 'maintenance', 'disposed', 'retired', 'archived', 'blocked',
  'approval', 'auto approval', 'requested', 'enrolled', 'ended', 'suspended', 'delivered', 'invoiced', 'quoted', 'ordered', 'received', 'minor damage',
  'major damage', 'healthy', 'ok', 'failed', 'running', 'success', 'error', 'skipped', 'retry', 'changes requested', 'waiting for approval', 'exception',
  'to do', 'in review', 'finished', 'live', 'expiring', 'valid', 'invalid', 'manual', 'automatic', 'monthly', 'yearly', 'weekly', 'daily', 'quarterly',
  'rent', 'sale', 'buy', 'lease', 'owned', 'leased', 'rented', 'borrowed', 'ready', 'not ready', 'n/a', 'none', 'all', 'other', 'others', 'unknown']);
function isCellTerm(s: string): boolean { const t = s.trim().toLowerCase(); return t.length > 0 && t.length <= 24 && CELL_TERMS.has(t); }

const ALLOW_ROW = /(^|\s)(zl-emptyrow|zl-placeholder|no-data|empty-row|zl-empty)(\s|$)/;
const ATTRS = ['placeholder', 'title', 'aria-label'];
/** Form fields: their value / content is never touched, their placeholder / title / aria-label is. */
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

interface Orig { orig: string; tr: string; }

/** Original (English) texts / attributes of the nodes the translator changed – shared, so code can read the English. */
const TEXTS = new WeakMap<Text, Orig>();
const ATTR_ORIG = new WeakMap<Element, Record<string, Orig>>();

/**
 * The English text of an element as the code wrote it, even after the runtime translator changed it
 * (z-list uses it for column keys and placeholder-row detection). `skip`: CSS selector of descendants to leave out.
 */
export function i18nOriginal(el: Element | null | undefined, skip?: string): string {
  if (!el) { return ''; }
  let out = '';
  const visit = (n: Node) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        const r = TEXTS.get(c as Text);
        out += r && (c as Text).data === r.tr ? r.orig : (c as Text).data;
      } else if (c.nodeType === 1) {
        if (skip && (c as Element).matches(skip)) { continue; }
        visit(c);
      }
    }
  };
  visit(el);
  return out;
}

/** English value of an attribute changed by the translator. */
export function i18nOriginalAttr(el: Element, a: string): string | null {
  const r = ATTR_ORIG.get(el)?.[a];
  const v = el.getAttribute(a);
  return r && v === r.tr ? r.orig : v;
}

export interface TranslatorStats { texts: number; attrs: number; batches: number; lastMs: number; maxMs: number; totalMs: number; }

export class DomTranslator {
  private obs: MutationObserver | null = null;
  private texts = TEXTS;
  private attrs = ATTR_ORIG;
  private queue: Node[] = [];
  private attrQueue: Array<[Element, string]> = [];
  private scheduled = false;
  private root: HTMLElement | null = null;
  readonly stats: TranslatorStats = { texts: 0, attrs: 0, batches: 0, lastMs: 0, maxMs: 0, totalMs: 0 };

  constructor(private translate: (s: string) => string | null = lookup) {}

  get running(): boolean { return !!this.obs; }

  /** Start (or re-run after a pack change): translate everything now, then watch the page. */
  start(root: HTMLElement = document.body): void {
    this.root = root;
    const t0 = now();
    this.walk(root, false, true);
    this.note(t0);
    if (!this.obs) {
      this.obs = new MutationObserver(recs => this.onMutations(recs));
      this.obs.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS, 'value'] });
    }
  }

  /** Stop watching; restore = put the English text back everywhere it was translated. */
  stop(restore = true): void {
    this.obs?.disconnect();
    this.obs = null;
    this.queue = []; this.attrQueue = [];
    if (restore && this.root) { this.restore(this.root); }
  }

  /** Translate a subtree now (tests / explicit refresh). */
  translateNow(root: Node = this.root || document.body): void { this.walk(root, this.inCell(root), true); }

  private onMutations(recs: MutationRecord[]): void {
    for (const r of recs) {
      if (r.type === 'childList') {
        r.addedNodes.forEach(n => this.queue.push(n));
      } else if (r.type === 'characterData') {
        this.queue.push(r.target);
      } else if (r.type === 'attributes' && r.attributeName) {
        this.attrQueue.push([r.target as Element, r.attributeName]);
      }
    }
    if (!this.scheduled && (this.queue.length || this.attrQueue.length)) {
      this.scheduled = true;
      const run = () => { this.scheduled = false; this.flush(); };
      if (typeof requestAnimationFrame === 'function' && typeof document !== 'undefined' && !document.hidden) {
        requestAnimationFrame(run);
      } else { setTimeout(run, 16); }
    }
  }

  /** One batch per animation frame. */
  flush(): void {
    const t0 = now();
    const q = this.queue; this.queue = [];
    const aq = this.attrQueue; this.attrQueue = [];
    const seen = new Set<Node>();
    for (const n of q) {
      if (seen.has(n) || !n.isConnected) { continue; }
      seen.add(n);
      if (n.nodeType === 3) {
        if (!this.excluded(n.parentElement)) { this.text(n as Text, false); }
      } else if (n.nodeType === 1) {
        const el = n as Element;
        if (this.excluded(el.parentElement, true, true)) { continue; }          // inside a never-translated block
        if (this.hard(el)) { if (this.formField(el)) { this.attrsOf(el, false); } continue; }
        const cell = this.inCell(el);                                            // inside a data cell: buttons / attributes only
        this.attrsOf(el, false);
        this.walk(el, cell, false);
      }
    }
    for (const [el, a] of aq) {
      // attributes: everywhere except inside never-translated blocks (data cells are fine: attributes are not cell text)
      if (!el.isConnected || (this.hard(el) && !this.formField(el)) || this.excluded(el.parentElement, true, true)) { continue; }
      this.attr(el, a, false);
    }
    this.stats.batches++;
    this.note(t0);
  }

  private note(t0: number): void {
    const ms = now() - t0;
    this.stats.lastMs = ms; this.stats.totalMs += ms;
    if (ms > this.stats.maxMs) { this.stats.maxMs = ms; }
  }

  private formField(el: Element): boolean {
    return FORM_TAGS.has(el.tagName) && !el.hasAttribute('data-no-translate') && !el.hasAttribute('contenteditable');
  }

  private hard(el: Element): boolean {
    if (HARD_TAGS.has(el.tagName)) { return true; }
    const c = el.getAttribute('class');
    if (c && HARD_CLASS.test(c)) { return true; }
    return el.hasAttribute('data-no-translate') || el.hasAttribute('contenteditable');
  }

  /** Is a data cell (tbody td) – its texts stay as they are, except buttons and empty / footer rows. */
  private dataCell(el: Element): boolean {
    if (el.tagName !== 'TD') { return false; }
    const tr = el.parentElement;
    if (!tr || tr.parentElement?.tagName !== 'TBODY') { return false; }
    const c = tr.getAttribute('class');
    if (c && ALLOW_ROW.test(c)) { return false; }
    // a row with one wide cell is a message row ("No records found", "Loading…"), not data
    return !((tr as HTMLTableRowElement).cells?.length === 1 && (el as HTMLTableCellElement).colSpan > 1);
  }

  /** Is the node inside a data cell (and not inside a button within it)? */
  private inCell(n: Node): boolean {
    let el: Element | null = n.nodeType === 1 ? n as Element : n.parentElement;
    let freed = false;
    while (el && el !== this.root) {
      if (el.tagName === 'BUTTON' || el.getAttribute('data-translate') !== null) { freed = true; }
      if (this.dataCell(el)) { return !freed; }
      el = el.parentElement;
    }
    return false;
  }

  /** Inside something never translated (input, code, icon, [data-no-translate] …) or a data cell? */
  private excluded(start: Element | null, freedBelow = false, hardOnly = false): boolean {
    let el = start;
    let freed = freedBelow || hardOnly;
    while (el && el !== this.root) {
      if (this.hard(el)) { return true; }
      if (el.tagName === 'BUTTON') { freed = true; }
      if (!freed && this.dataCell(el)) { return true; }
      el = el.parentElement;
    }
    return false;
  }

  private walk(node: Node, cell: boolean, force: boolean): void {
    for (let c = node.firstChild; c; c = c.nextSibling) {
      const type = c.nodeType;
      if (type === 3) {
        if (!cell || isCellTerm((c as Text).data)) { this.text(c as Text, force); }   // v1.38.0: status words in data cells follow the language
      } else if (type === 1) {
        const el = c as Element;
        if (this.hard(el)) {
          if (el.hasAttributes() && this.formField(el)) { this.attrsOf(el, force); }   // placeholder of inputs
          continue;
        }
        let cm = cell;
        if (!cm) { if (el.tagName === 'TD' && this.dataCell(el)) { cm = true; } }
        else if (el.tagName === 'BUTTON' || el.hasAttribute('data-translate')) { cm = false; }
        if (el.hasAttributes()) { this.attrsOf(el, force); }
        if (el.firstChild) { this.walk(el, cm, force); }
      }
    }
  }

  private text(n: Text, force: boolean): void {
    const data = n.data;
    if (!data || data.length > 2000) { return; }
    const rec = this.texts.get(n);
    if (rec && rec.tr === data) {
      if (!force) { return; }               // our own change
      const tr2 = this.tr(rec.orig);         // pack changed: translate the original again
      if (tr2 === null) { n.data = rec.orig; this.texts.delete(n); }
      else if (tr2 !== data) { rec.tr = tr2; n.data = tr2; }
      return;
    }
    if (!HAS_LETTER.test(data)) { if (rec) { this.texts.delete(n); } return; }
    let tr = this.tr(data);
    if (tr !== null && data.trim() === 'No' && n.parentElement && n.parentElement.closest('th')) { tr = data.replace('No', PACK.terms['No.'] || 'No.'); }   // v1.15.0 row-number column, not the answer "No"
    if (tr === null) { if (rec) { this.texts.delete(n); } return; }
    this.texts.set(n, { orig: data, tr });
    this.stats.texts++;
    n.data = tr;
  }

  private attrsOf(el: Element, force: boolean): void {
    for (const a of ATTRS) { if (el.hasAttribute(a)) { this.attr(el, a, force); } }
    if (el.tagName === 'INPUT') { /* inputs are hard-excluded */ }
  }

  private attr(el: Element, a: string, force: boolean): void {
    if (a === 'value') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (el.tagName !== 'BUTTON' && !(el.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(type))) { return; }
    }
    const v = el.getAttribute(a);
    if (!v) { return; }
    let recs = this.attrs.get(el);
    const rec = recs?.[a];
    if (rec && rec.tr === v) {
      if (!force) { return; }
      const tr2 = this.tr(rec.orig);
      if (tr2 === null) { delete recs![a]; el.setAttribute(a, rec.orig); }
      else if (tr2 !== v) { rec.tr = tr2; el.setAttribute(a, tr2); }
      return;
    }
    if (!HAS_LETTER.test(v)) { return; }
    const tr = this.tr(v);
    if (tr === null) { if (rec) { delete recs![a]; } return; }
    if (!recs) { recs = {}; this.attrs.set(el, recs); }
    recs[a] = { orig: v, tr };
    this.stats.attrs++;
    el.setAttribute(a, tr);
  }

  /** Translation keeping the leading / trailing spaces of the node. */
  private tr(data: string): string | null {
    const key = data.trim();
    if (!key) { return null; }
    const v = this.translate(key);
    if (v === null || v === key) { return null; }
    if (key.length === data.length) { return v; }
    const lead = data.slice(0, data.indexOf(key[0]));
    const trail = data.slice(data.lastIndexOf(key[key.length - 1]) + 1);
    return lead + v + trail;
  }

  private restore(root: Node): void {
    const visit = (node: Node) => {
      for (let c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          const r = this.texts.get(c as Text);
          if (r) { if ((c as Text).data === r.tr) { (c as Text).data = r.orig; } this.texts.delete(c as Text); }
        } else if (c.nodeType === 1) {
          const recs = this.attrs.get(c as Element);
          if (recs) {
            for (const a of Object.keys(recs)) { if ((c as Element).getAttribute(a) === recs[a].tr) { (c as Element).setAttribute(a, recs[a].orig); } }
            this.attrs.delete(c as Element);
          }
          if (c.firstChild) { visit(c); }
        }
      }
    };
    visit(root);
  }
}

function now(): number { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
