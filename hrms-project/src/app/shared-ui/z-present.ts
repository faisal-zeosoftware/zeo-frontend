// v1.62.0 ui – app-wide presentation conventions for every list (used by the z-list directive on every data table).
//
// The screens keep rendering their own cells; this pass only changes how raw values READ:
//   dates           ISO 2026-10-01 / 2026-10-26T08:54:06+00:00 / "01 Oct 2026"  → 01/10/2026 (date-time 26/10/2026 08:54)
//   yes / no        true / false                                                  → Yes / No
//   nothing         null / undefined / None / NaN / [object Object]               → –
//   codes           NOT_SENT / payroll_audit / PENDING / paid                     → Not sent / Payroll audit / Pending / Paid
//   people          gdis_rajesh (sign-in name)                                    → Rajesh Menon
//                   GD-0035 alone in the employee column                          → Nadia Rahman  GD-0035 (code muted)
//   money           25000 / 25000.5 in an amount column                           → 25,000.00 (right-aligned, company currency in the heading)
//   layout          dates, amounts, codes and statuses never wrap; long texts end with … and show in full on hover
//
// The original text of every changed node is kept (rawText), so record matching, inline editing and the import
// endpoint detection keep comparing with the values the API sent.
import { cpPack } from './country-pack.service';
import { i18nT as T } from './i18n-core';

/** Original text of the nodes this pass changed (node → [original, shown]). */
const ORIG = new WeakMap<Text, [string, string]>();

export interface PersonName { name: string; code: string; }
let USERS = new Map<string, PersonName>();
let SCHEMA_PREFIX = '';
/** Sign-in name → person (ZListService.userNames()). */
export function setUserNames(list: { username: string; name: string; code: string }[], schema: string): void {
  const m = new Map<string, PersonName>();
  for (const u of list || []) { if (u && u.username && u.name) { m.set(u.username.toLowerCase(), { name: u.name, code: u.code || '' }); } }
  USERS = m;
  SCHEMA_PREFIX = schema ? schema.toLowerCase() + '_' : '';
}
function schemaPrefix(): string {   // before the user list has loaded: the company of the session
  try { const s = localStorage.getItem('selectedSchema') || ''; return s ? s.toLowerCase() + '_' : ''; } catch { return ''; }
}
export function userName(username: string): string | null {
  const p = USERS.get((username || '').trim().toLowerCase());
  return p ? p.name : null;
}

const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const p2 = (n: number) => (n < 10 ? '0' : '') + n;
/** dd/mm/yyyy (and HH:mm) – the one display format of the application. */
export function dmy(d: Date, time = false): string {
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` + (time ? ` ${p2(d.getHours())}:${p2(d.getMinutes())}` : '');
}

const ISO_DT = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const ISO_D_IN = /(?<![\w\/.-])(\d{4})-(\d{2})-(\d{2})(?![\w\/.:-])/g;
const DMY_TEXT = /^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?$/;
const MDY_TEXT = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?)?$/i;
const NOTHING = /^(null|undefined|none|nan|\[object object\]|invalid date)$/i;
const ACRONYMS = new Set(['hr', 'pro', 'wps', 'aed', 'sar', 'usd', 'id', 'uae', 'gcc', 'gpssa', 'eos', 'ot', 'it', 'ai', 'mol', 'mohre', 'vat', 'pdc', 'ess', 'kpi',
  'pip', 'mrf', 'sif', 'iban', 'cv', 'ceo', 'cfo', 'hse', 'crm', 'pdf', 'csv', 'sms', 'otp', 'api', 'ip', 'gps', 'nfc', 'qr', 'po', 'grn', 'lpo', 'jv', 'gl', 'ppe']);
const STATUS = new Set(['pending', 'approved', 'rejected', 'draft', 'active', 'inactive', 'paid', 'unpaid', 'open', 'closed', 'cancelled', 'canceled', 'completed',
  'submitted', 'late', 'absent', 'present', 'processed', 'published', 'posted', 'new', 'hold', 'verified', 'expired', 'returned', 'issued', 'allocated', 'available',
  'assigned', 'resolved', 'escalated', 'scheduled', 'planned', 'running', 'done', 'failed', 'sent', 'accepted', 'declined', 'hired', 'withdrawn', 'archived',
  'locked', 'confirmed', 'deducted', 'settled', 'overdue', 'partial', 'waiting', 'started', 'reviewed', 'disposed', 'lost', 'damaged', 'repaired', 'expiring',
  'valid', 'invalid', 'yes', 'no', 'male', 'female', 'single', 'married', 'monthly', 'weekly', 'daily', 'yearly', 'annual', 'fixed', 'variable', 'manual', 'auto',
  'automatic', 'low', 'medium', 'high', 'critical', 'urgent', 'normal', 'internal', 'external', 'permanent', 'temporary', 'contract', 'full', 'none']);

/** Sign-in name or code → readable words: NOT_SENT → "Not sent", payroll_audit → "Payroll audit", hr_letter → "HR letter". */
export function humanize(code: string): string {
  const words = code.replace(/[_]+/g, ' ').trim().toLowerCase().split(/\s+/);
  const out = words.map((w, i) => ACRONYMS.has(w) ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w);
  return out.join(' ');
}

function isoDate(y: string, m: string, d: string): string | null {
  const mm = +m, dd = +d;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) { return null; }
  return `${d}/${m}/${y}`;
}

/** The display text of one raw value (whole text of a cell or text node), or null when it stays as it is. */
export function presentText(t: string, opt: { cell?: boolean } = {}): string | null {
  const s = t.trim();
  if (!s || s.length > 400) { return null; }
  let m = ISO_DT.exec(s);
  if (m) {
    if (m[7]) { const d = new Date(s.replace(' ', 'T')); if (!isNaN(d.getTime())) { return dmy(d, true); } }
    return isoDate(m[1], m[2], m[3]) ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : null;
  }
  if (ISO_D_IN.test(s)) {
    ISO_D_IN.lastIndex = 0;
    const r = s.replace(ISO_D_IN, (x, y, mo, d) => isoDate(y, mo, d) || x);
    ISO_D_IN.lastIndex = 0;
    return r !== s ? r : null;
  }
  ISO_D_IN.lastIndex = 0;
  m = DMY_TEXT.exec(s);
  const mo = m ? (MON[m[2].slice(0, 4).toLowerCase()] ?? MON[m[2].slice(0, 3).toLowerCase()]) : undefined;
  if (m && mo !== undefined) {
    const out = `${p2(+m[1])}/${p2(mo)}/${m[3]}`;
    return m[4] ? `${out} ${p2(+m[4])}:${m[5]}` : out;
  }
  m = MDY_TEXT.exec(s);
  if (m && MON[m[1].slice(0, 3).toLowerCase()] !== undefined) {
    let out = `${p2(+m[2])}/${p2(MON[m[1].slice(0, 3).toLowerCase()])}/${m[3]}`;
    if (m[4]) { let h = +m[4]; if (m[6]) { h = h % 12 + (/pm/i.test(m[6]) ? 12 : 0); } out += ` ${p2(h)}:${m[5]}`; }
    return out;
  }
  if (/^(true|false)$/i.test(s)) { return T(/^true$/i.test(s) ? 'Yes' : 'No'); }
  if (NOTHING.test(s)) { return '–'; }
  const lower = s.toLowerCase();
  if (/^[a-z0-9][a-z0-9._-]*_[a-z0-9._-]+$/i.test(s) && USERS.has(lower)) { return USERS.get(lower)!.name; }
  const pre = SCHEMA_PREFIX || schemaPrefix();
  if (pre && USERS.size && lower.includes(pre) && /^[a-z0-9]+_$/.test(pre)) {   // "Manager: gdis_samuel" → "Manager: Samuel …"
    const r = s.replace(new RegExp('(?<![\\w.-])' + pre + '[a-z0-9._-]+', 'gi'), x => USERS.get(x.toLowerCase())?.name || x);
    if (r !== s) { return r; }
  }
  if (pre && lower.startsWith(pre)) { return null; }   // a sign-in name not (yet) known stays as it is – never "Gdis rajesh"
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(s) || /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(s)) { return T(humanize(s)); }
  if (opt.cell && /^[A-Z]{3,}$/.test(s) && STATUS.has(lower)) { return T(humanize(lower)); }
  if (opt.cell && /^[a-z]{2,}$/.test(s) && STATUS.has(lower)) { return T(humanize(lower)); }
  return null;
}

const SKIP_EL = 'input, select, textarea, button, mat-icon, .mat-icon, svg, code, pre, [contenteditable], [data-zl], [data-raw], .material-icons, i.fa';

/** Rewrite the raw values in one element (a data cell / record value). Returns true when something changed. */
export function presentEl(root: Element, cell = true): boolean {
  let changed = false;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = w.nextNode())) { nodes.push(n as Text); }
  for (const t of nodes) {
    const el = t.parentElement;
    if (!el || (el !== root && el.closest(SKIP_EL) && root.contains(el.closest(SKIP_EL)))) { continue; }
    const rec = ORIG.get(t);
    if (rec && rec[1] === t.data) { continue; }        // ours, unchanged since
    const data = t.data;
    if (!data.trim()) { continue; }
    const out = presentText(data, { cell });
    if (out === null || out === data.trim()) { if (rec) { ORIG.delete(t); } continue; }
    const shown = data.replace(data.trim(), out);
    ORIG.set(t, [data, shown]);
    t.data = shown;
    changed = true;
  }
  return changed;
}

/** The text of an element as the screen (the API) wrote it – before this pass changed it; [data-zl] parts left out. */
export function rawText(el: Element | null | undefined): string {
  if (!el) { return ''; }
  let out = '';
  const visit = (p: Node) => {
    for (let c = p.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        const r = ORIG.get(c as Text);
        out += r && (c as Text).data === r[1] ? r[0] : (c as Text).data;
      } else if (c.nodeType === 1) {
        if ((c as Element).hasAttribute('data-zl')) { continue; }
        visit(c);
      }
    }
  };
  visit(el);
  return out;
}

// ------------------------------------------------------------------ columns
const MONEY_HEAD = /(amount|salary|salaries|\bpay\b|paid|payable|gross|\bnet\b|basic|allowance|deduction|cost|price|\bfees?\b|\brent\b|\bloan\b|advance|\bemi\b|instal+ment|\baed\b|\bsar\b|gratuity|wage|premium|refund|reimburs|expense|\bdebit\b|\bcredit\b)/i;
// weak words: money only with decimals in the values and not on a leave / time screen (Leave balance is in days)
const MONEY_WEAK = /(balance|total|value|outstanding|\bdue\b|limit|budget|liability|accrual|provision|earning|encash|recover)/i;
const TIME_PAGE = /(leave|attendance|shift|overtime|punch|roster|timesheet|late|absence)/i;
const NOT_MONEY_HEAD = /(days?\b|hours?|hrs|count|\bno\.?$|number|\bqty\b|quantity|%|percent|\brate\b|level|months?\b|year|period|date|code|\bid\b|\bref|employees?|headcount|score|rating|age\b|status|type|name|frequency|cycle|method|mode|by\b|account|plan\b|policy|terms?)/i;
const CODE_HEAD = /(code|\bid\b|\bno\.?$|number|ref)/i;
const PLAIN_NUM = /^-?\d+(\.\d+)?$/;
const GROUPED_NUM = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;

export interface PCol { idx: number; label: string; kind: 'text' | 'number' | 'date'; skip: boolean; }

/** Classes and formats per column: money / numbers right-aligned, short values never wrap, long texts end with … */
export function paintColumns(heads: HTMLElement[], cols: PCol[], trs: HTMLTableRowElement[], cellsOf: (tr: HTMLTableRowElement) => HTMLElement[], empIdx: number): void {
  const cur = cpPack().currency;
  for (const c of cols) {
    const th = heads[c.idx];
    if (!th) { continue; }
    const tds = trs.map(tr => cellsOf(tr)[c.idx]).filter(Boolean) as HTMLElement[];
    const texts = tds.map(td => (td.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const lens = texts.map(x => x.length);
    const max = lens.length ? Math.max(...lens) : 0;
    const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
    const label = c.label || '';
    const hasCur = texts.some(x => x.includes(cur.code)) || label.includes(cur.code);
    const numeric = texts.filter(x => PLAIN_NUM.test(x) || GROUPED_NUM.test(x) || /^(–|-)$/.test(x) || x.startsWith(cur.code + ' ')).length;
    const strong = MONEY_HEAD.test(label);
    const weak = !strong && MONEY_WEAK.test(label) && !TIME_PAGE.test(location.pathname + ' ' + label) && texts.some(x => /\.\d{2}$/.test(x));
    const forced = th.getAttribute('data-ztype') || '';   // a screen can name the type: <th data-ztype="money">
    const money = forced === 'money' || !forced && !c.skip && texts.length > 0 && (strong || weak) && !NOT_MONEY_HEAD.test(label) && numeric / texts.length >= 0.8
      && texts.some(x => /\d/.test(x));
    const num = !money && (forced === 'number' || !forced && c.kind === 'number' && !CODE_HEAD.test(label));
    const kind = money ? 'money' : num ? 'num' : (c.kind === 'date' || forced === 'date') ? 'date' : forced === 'code' ? 'short' : forced === 'text' ? '' : c.idx === empIdx && max <= 34 ? 'person' : (!c.skip && max > 0 && max <= 16) ? 'short' : (!c.skip && avg > 48) ? 'long' : '';
    setKind(th, kind);
    if (money) {
      let tag = th.querySelector(':scope > .zl-cur') as HTMLElement | null;
      if (!hasCur && !tag) { tag = document.createElement('span'); tag.className = 'zl-cur'; tag.dataset['zl'] = 'cur'; th.insertBefore(tag, th.querySelector(':scope > .zl-sort')); }
      if (tag) { if (hasCur) { tag.remove(); } else { tag.textContent = ' (' + cur.code + ')'; } }
    } else { th.querySelector(':scope > .zl-cur')?.remove(); }
    for (const td of tds) {
      setKind(td, kind);
      if (money) { moneyCell(td, cur.decimals); }
      if (kind === 'long' && !td.querySelector('button, input, select, a, img, ul, ol, table')) {
        const full = (td.innerText || '').trim();
        if (full.length > 40 && td.getAttribute('title') === null) { td.setAttribute('title', full); td.dataset['zlTip'] = '1'; }
      }
    }
  }
}

function setKind(el: HTMLElement, kind: string): void {
  const old = el.dataset['zlKind'] || '';
  if (old === kind) { return; }
  if (old) { el.classList.remove('zl-k-' + old); }
  if (kind) { el.classList.add('zl-k-' + kind); el.dataset['zlKind'] = kind; } else { delete el.dataset['zlKind']; }
}

/** 25000 → 25,000.00 in a money column (the text node keeps its original for record matching). */
function moneyCell(td: HTMLElement, decimals: number): void {
  const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const t = n as Text;
    const el = t.parentElement;
    if (!el || el.closest('input, select, textarea, button, [data-zl]')) { continue; }
    const rec = ORIG.get(t);
    if (rec && rec[1] === t.data) { continue; }
    const s = t.data.trim();
    if (!(PLAIN_NUM.test(s) || GROUPED_NUM.test(s))) { continue; }
    const v = Number(s.replace(/,/g, ''));
    if (!isFinite(v)) { continue; }
    const out = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (out === s) { continue; }
    const shown = t.data.replace(s, out);
    ORIG.set(t, [t.data, shown]);
    t.data = shown;
  }
}

/** An employee column that shows only the code: the person's name first, the code muted after it. */
export function personCell(td: HTMLElement, name: string, code: string): void {
  let span = td.querySelector(':scope [data-zl="pname"]') as HTMLElement | null;
  const txt = (rawText(td) || '').replace(/\s+/g, ' ').trim();
  const only = txt.toLowerCase() === code.toLowerCase();
  if (!only || !name) { if (span) { span.remove(); td.classList.remove('zl-hascode'); } return; }
  if (!span) {
    span = document.createElement('span'); span.className = 'zl-pname'; span.dataset['zl'] = 'pname';
    const first = td.firstElementChild && (td.firstElementChild as HTMLElement).innerText.trim().toLowerCase() === code.toLowerCase() ? td.firstElementChild : null;
    (first || td).insertBefore(span, (first || td).firstChild);
  }
  if (span.textContent !== name) { span.textContent = name; }
  td.classList.add('zl-hascode');
}
