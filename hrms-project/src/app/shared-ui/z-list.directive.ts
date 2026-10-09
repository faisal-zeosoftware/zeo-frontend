import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { ORG_KEYS$, orgKeys } from './z-org-keys';
import { OrgSettingsService } from '../org-structure/org-settings.service';
import { Subscription } from 'rxjs';
import { DirEmp, ZListService } from './z-list.service';
import { exportCsv, exportExcel, exportPdf, readSheet } from './z-export';
import { ZRecordService } from './z-record.service';
import { showValue } from './field-types';
import { VCol, VIEW_LABEL, ViewKind, ViewState, availableViews, calendarHtml, defaults, graphHtml, kanbanHtml, pivotData, pivotHtml } from './z-views';

/**
 * Same list experience on every screen (attaches itself to every data table):
 *   search box with field suggestions, Filters (Branch / Department / Designation / Category,
 *   status-like columns, date periods, custom filter), Group by (two levels, counts and totals),
 *   column sorting, select all, 50 / 100 / 500 / 1000 rows per page,
 *   Export (Excel, CSV, PDF) and Import (template + checked upload through the screen's own API).
 * v1.7.0: Columns (show / hide, saved per user), views (List, Kanban, Calendar, Graph, Pivot) and the
 *   extra fields of the form designer as columns.
 *
 * It works on the rendered rows, so every screen keeps its own buttons, forms and actions.
 * Opt out with <table zPlain>.
 */

type Kind = 'text' | 'number' | 'date';
interface Col { idx: number; label: string; kind: Kind; skip: boolean; facet: boolean; org?: OrgKey; }
interface Row { el: HTMLTableRowElement; seq: number; cells: string[]; emp?: DirEmp | null; }
type OrgKey = string;   // v1.12.0: branch, department, designation, category + the org fields switched on (see z-org-keys.ts)
interface Chip { type: 'search' | 'filter' | 'custom' | 'date'; key: string; label: string; values?: string[]; col?: number; op?: string; text?: string; from?: string; to?: string; }

// v1.12.0: the org filters (Branch / Department / Designation / Category + switched-on org fields) come from orgKeys()
const SKIP_HEAD = /^(actions?|action buttons?|edit|delete|select|options?|#|no\.?|s\.?\s?no\.?|sl\.?\s?no\.?|sr\.?\s?no\.?|view|operations?|)$/i;
const EMP_HEAD = /(employee|^emp\b|emp code|emp id|staff|^name$|employee name|requested by|applicant)/i;
const SIZES = [50, 100, 500, 1000];
const EXCLUDE = '.modal, .modal-content, .modal-dialog, mat-dialog-container, .cdk-overlay-pane, .zd-panel, .hr-modal, .hr-detail, .zl-modal, .payslip, .print-area, #print-section, .no-zlist, [zPlain], .fc, mat-calendar';

const ICON: Record<string, string> = {
  star: '<svg viewBox="0 0 24 24" width="13" height="13" fill="#f5b301" stroke="#d99a00" stroke-width="1.5"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  filter: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>',
  group: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h13M10 18h10"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V9m0 0-4 4m4-4 4 4M5 4h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  caret: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m9 6 6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m15 6-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 6 6 6-6 6"/></svg>',
  cols: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  kanban: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="5" height="14" rx="1"/><rect x="10" y="4" width="5" height="9" rx="1"/><rect x="17" y="4" width="4" height="12" rx="1"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  graph: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  pivot: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
};

let SEQ = 0;

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

export function parseDate(s: string): Date | null {
  const t = (s || '').trim();
  if (!t) { return null; }
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) { return new Date(+m[1], +m[2] - 1, +m[3]); }
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1]); }
  m = t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})/);
  if (m && MONTHS[m[2].slice(0, 4).toLowerCase()] !== undefined) { return new Date(+m[3], MONTHS[m[2].slice(0, 4).toLowerCase()], +m[1]); }
  m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()] !== undefined) { return new Date(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]); }
  return null;
}

function num(s: string): number | null {
  const t = (s || '').replace(/[,\s]|AED|USD|INR|SAR|%|days?|hrs?|h$/gi, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) { return null; }
  return Number(t);
}

@Directive({ selector: 'table:not([zPlain])', standalone: true })
export class ZListDirective implements AfterViewInit, OnDestroy {
  private table!: HTMLTableElement;
  private anchor!: HTMLElement;
  private bar?: HTMLElement;
  private foot?: HTMLElement;
  private menu?: HTMLElement;
  private active = false;
  private obs?: MutationObserver;
  private waitObs?: MutationObserver;
  private ownGroups = false;   // the screen draws its own group rows (reports): keep them, no re-ordering
  private timer: any;
  private mutating = false;
  private hidden: HTMLElement[] = [];
  private subs: Subscription[] = [];

  private cols: Col[] = [];
  private rows: Row[] = [];
  private seqOf = new WeakMap<HTMLTableRowElement, number>();
  private selected = new WeakSet<HTMLTableRowElement>();
  private dir: DirEmp[] = [];
  private dirByCode = new Map<string, DirEmp>();
  private dirByName = new Map<string, DirEmp>();
  private hasEmp = false;

  private chips: Chip[] = [];
  private groupBy: string[] = [];          // 'c:3' column, 'o:branch' org facet, 'm:3' month of date column
  private collapsed = new Set<string>();
  private sort: { idx: number; dir: 1 | -1 } | null = null;
  private size = 50;
  private page = 1;
  private visible: Row[] = [];
  private suggestText = '';
  private endpoint: string | null = null;
  // v1.7.0
  private view: ViewKind = 'list';
  private vst: ViewState = {};
  private hideCols = new Set<string>();
  private hasLayout = false;   // v1.13.0: a saved column layout exists
  private optDone = false;     // v1.13.0: optional columns hidden once
  private favs: { name: string; chips: Chip[]; groupBy: string[] }[] = [];   // v1.8.0 saved filters
  private viewEl?: HTMLElement;
  private layoutKey = '';
  private saveTimer: any;
  private extra: { endpoint: string; fields: any[]; values: Record<string, Record<string, any>>; ids: Map<HTMLTableRowElement, string> } | null = null;
  private extraSig = '';

  private orgSettings = inject(OrgSettingsService);   // v1.12.0: loads the org fields for the filters

  constructor(private host: ElementRef<HTMLTableElement>, private zone: NgZone, private z: ZListService, private rec: ZRecordService) {}

  // ------------------------------------------------------------------ lifecycle
  ngAfterViewInit(): void {
    this.table = this.host.nativeElement;
    this.zone.runOutsideAngular(() => setTimeout(() => this.init(), 0));
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
    this.waitObs?.disconnect();
    clearTimeout(this.timer);
    this.subs.forEach(s => s.unsubscribe());
    this.bar?.remove(); this.foot?.remove(); this.menu?.remove(); this.viewEl?.remove();
    this.anchor?.classList.remove('zl-hidden');
    clearTimeout(this.saveTimer);
    this.hidden.forEach(h => h.classList.remove('zl-hidden'));
    document.removeEventListener('mousedown', this.outside, true);
    document.removeEventListener('keydown', this.onKey, true);
  }

  private onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && this.menu) { this.closeMenu(); } };

  private init(): void {
    const t = this.table;
    if (!t.isConnected || t.closest(EXCLUDE)) { return; }
    // a table inside another table: enhance it only when the outer one is just a frame (no headings of its own)
    const outer = t.parentElement?.closest('table') as HTMLTableElement | null;
    if (outer && Array.from(outer.querySelectorAll('th')).some(th => !t.contains(th))) { return; }
    const heads = this.headCells();
    if (heads.length < 2 && t.querySelector('table')) { return; }   // only a frame around another table
    if (heads.length < 2) {
      // columns built after the data loads (reports): try again when the table changes
      if (!this.waitObs) {
        this.waitObs = new MutationObserver(() => { if (this.headCells().length >= 2) { this.waitObs?.disconnect(); this.waitObs = undefined; this.init(); } });
        this.waitObs.observe(t, { childList: true, subtree: true });
      }
      return;
    }
    this.anchor = (t.closest('.table-responsive, .table-container, .table-wrapper, .mat-elevation-z8') as HTMLElement) || t;
    if (this.anchor.contains(this.anchor.querySelector('table table'))) { this.anchor = t; }
    this.active = true;
    t.classList.add('zl-table');
    // tablets and narrow windows: wide tables scroll sideways inside their own box, not the page
    (this.anchor === t ? t.parentElement : this.anchor)?.classList.add('zl-scroll');
    const key = 'zl-size:' + location.pathname;
    try { const v = Number(localStorage.getItem(key)); if (SIZES.includes(v)) { this.size = v; } } catch { /* storage off */ }
    this.buildBar();
    this.buildFoot();
    this.loadLayout();
    // v1.8.1: opened from a drill-down ("Open in <screen>"): search for the record straight away
    const zq = new URLSearchParams(location.search).get('zq');
    if (zq && !this.chips.some(c => c.type === 'search') && Array.from(document.querySelectorAll('table.zl-table')).indexOf(t) === 0) {
      this.chips.push({ type: 'search', key: 'all', label: 'Search', text: zq, col: -1 });
    }
    this.subs.push(this.z.permissions().subscribe(a => {
      // employees without HR rights (ESS) export their own rows but do not import
      const imp = this.bar?.querySelector('[data-menu=import]') as HTMLElement | null;
      if (imp) { imp.style.display = !a.admin && a.codes.size === 0 ? 'none' : ''; }
    }));
    this.hideOwnControls();
    let orgFirst = true;   // v1.12.0: org filters follow Organisation settings
    this.subs.push(ORG_KEYS$.subscribe(() => { if (orgFirst) { orgFirst = false; return; } this.schedule(0); }));
    this.orgSettings.load().subscribe();
    this.subs.push(this.z.directory().subscribe(list => {
      this.dir = list || [];
      this.dirByCode.clear(); this.dirByName.clear();
      for (const e of this.dir) {
        if (e.code) { this.dirByCode.set(e.code.toLowerCase(), e); }
        if (e.name) { this.dirByName.set(e.name.toLowerCase(), e); }
      }
      this.schedule(0);
    }));
    this.obs = new MutationObserver(recs => {
      if (this.mutating) { return; }
      const relevant = recs.some(r => {
        const el = (r.target.nodeType === 1 ? r.target : r.target.parentElement) as HTMLElement | null;
        if (!el || el.closest('[data-zl]')) { return false; }
        if (r.type === 'childList') {
          const nodes = [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)];
          if (nodes.length && nodes.every(n => (n as HTMLElement).dataset?.['zl'] !== undefined)) { return false; }
        }
        return true;
      });
      if (relevant) { this.schedule(150); }
    });
    this.obs.observe(t, { childList: true, subtree: true, characterData: true });
    document.addEventListener('mousedown', this.outside, true);
    document.addEventListener('keydown', this.onKey, true);
    this.schedule(0);
  }

  private schedule(ms: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.scan(); this.render(); }, ms);
  }

  private quiet(fn: () => void): void {
    this.mutating = true;
    try { fn(); } finally { this.obs?.takeRecords(); this.mutating = false; }
  }

  // ------------------------------------------------------------------ reading the table
  private headRow(): HTMLTableRowElement | null {
    const th = this.table.tHead;
    if (th && th.rows.length) { return th.rows[th.rows.length - 1]; }
    const first = this.table.rows[0];
    return first && first.querySelector('th') ? first : null;
  }

  private headCells(): HTMLTableCellElement[] {
    const r = this.headRow();
    return r ? Array.from(r.cells).filter(c => !c.classList.contains('zl-selcell')) as HTMLTableCellElement[] : [];
  }

  private cellText(td: HTMLElement): string {
    const field = td.querySelector('input:not([type=checkbox]):not([type=hidden]), select, textarea') as any;
    if (field && !td.innerText.trim()) {
      if (field.tagName === 'SELECT') { return (field.selectedOptions?.[0]?.text || '').trim(); }
      return String(field.value || '').trim();
    }
    return (td.innerText || '').replace(/\s+/g, ' ').trim();
  }

  /** Tables with one <tbody> per record (main row + detail rows) move and hide whole bodies. */
  private get multi(): boolean { return Array.from(this.table.tBodies).filter(b => b.dataset['zl'] === undefined).length > 1; }

  private unit(r: Row): HTMLElement { return this.multi ? (r.el.parentElement as HTMLElement) : r.el; }

  private dataRows(): HTMLTableRowElement[] {
    const out: HTMLTableRowElement[] = [];
    const headRow = this.headRow();
    const multi = this.multi;
    for (const tb of Array.from(this.table.tBodies)) {
      if (tb.dataset['zl'] !== undefined) { continue; }
      for (const tr of Array.from(tb.rows)) {
        if (tr === headRow || tr.dataset['zl'] !== undefined) { continue; }
        const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell'));
        if (!cells.length) { continue; }
        if (cells.length === 1 && (cells[0] as HTMLTableCellElement).colSpan > 1) {
          const txt = (cells[0].textContent || '').trim();
          if (!txt || /^(no |nothing|0 record|loading|empty)/i.test(txt) || tr.classList.contains('no-logs-row')) { tr.classList.add('zl-placeholder'); } else { this.ownGroups = true; }
          continue;
        }
        if (tr.querySelector('th') && !tr.querySelector('td')) { continue; }
        out.push(tr);
        if (multi) { break; }  // detail rows travel with their body
      }
    }
    return out;
  }

  private scan(): void {
    if (!this.active) { return; }
    const heads = this.headCells();
    const labels = heads.map(h => {
      const clone = h.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-zl], mat-icon, .mat-icon, i.fa, input').forEach(x => x.remove());
      const t = (clone.textContent || '').replace(/[▲▼↕]/g, '').replace(/\s+/g, ' ').trim();
      return t && t === t.toUpperCase() && /[A-Z]/.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t;
    });
    this.ownGroups = false;
    this.quiet(() => this.addExtraCells());
    const trs = this.dataRows();
    // phones show each row as a card: every cell needs its column name (data-label) for that
    this.quiet(() => trs.forEach(tr => Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell')).forEach((c, i) => {
      if (!c.getAttribute('data-label') && labels[i]) { c.setAttribute('data-label', labels[i]); }
    })));
    this.rows = trs.map(tr => {
      if (!this.seqOf.has(tr)) { this.seqOf.set(tr, ++SEQ); }
      const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell')).map(c => this.cellText(c as HTMLElement));
      this.tagStatus(tr);
      return { el: tr, seq: this.seqOf.get(tr)!, cells };
    });
    // columns
    const cols: Col[] = labels.map((label, idx) => {
      const vals = this.rows.map(r => r.cells[idx] || '').filter(Boolean).slice(0, 300);
      let kind: Kind = 'text';
      if (vals.length) {
        const d = vals.filter(v => parseDate(v)).length, n = vals.filter(v => num(v) !== null).length;
        if (d / vals.length >= 0.8 && !/^\d+(\.\d+)?$/.test(vals[0])) { kind = 'date'; } else if (n / vals.length >= 0.85) { kind = 'number'; }
      }
      const skip = SKIP_HEAD.test(label) || label.length > 40;
      const distinct = new Set(vals.map(v => v.toLowerCase())).size;
      const avg = vals.length ? vals.reduce((a, v) => a + v.length, 0) / vals.length : 0;
      const org = orgKeys().find(o => o.re.test(label))?.key;
      const facet = !skip && kind === 'text' && distinct >= 1 && distinct <= 40 && avg <= 32 && (distinct <= Math.max(3, vals.length * 0.6) || !!org);
      return { idx, label: label || `Column ${idx + 1}`, kind, skip, facet, org };
    });
    this.cols = cols;
    // v1.13.0: <th data-zl-optional> columns start hidden until the user shows them under Columns (only without a saved layout)
    if (!this.optDone && heads.length) {
      this.optDone = true;
      if (!this.hasLayout) { heads.forEach((h, i) => { if (h.hasAttribute('data-zl-optional') && cols[i]) { this.hideCols.add(cols[i].label); } }); }
    }
    // employee link (for Branch / Department / Designation / Category)
    let empIdx = -1;
    if (this.dir.length) {
      let best = 0;
      cols.forEach(c => {
        if (c.skip || c.kind !== 'text') { return; }
        const sample = this.rows.slice(0, 60);
        const hits = sample.filter(r => !!this.matchEmp(r.cells[c.idx])).length;
        const score = hits / Math.max(sample.length, 1) + (EMP_HEAD.test(c.label) ? 0.2 : 0);
        if (hits && score > best) { best = score; empIdx = c.idx; }
      });
      if (best < 0.5) { empIdx = -1; }
    }
    this.hasEmp = empIdx >= 0;
    for (const r of this.rows) { r.emp = empIdx >= 0 ? this.matchEmp(r.cells[empIdx]) : null; }
    this.endpoint = null;
    this.paintHead();
    this.loadExtras();
  }

  /** Same status colours on every screen: approved / pending / rejected ... */
  private tagStatus(tr: HTMLTableRowElement): void {
    tr.querySelectorAll('.badge, .status-badge, .status, .tag, .chip, [class*="status-"], [class*="badge-"]').forEach(b => {
      const el = b as HTMLElement;
      if (el.closest('[data-zl]') || el.children.length > 1) { return; }
      const t = (el.innerText || '').trim().toLowerCase();
      let k = '';
      if (/^(approved|active|paid|completed|confirmed|valid|present|yes|accepted|processed|closed|deducted|assigned|hired|passed|done)$/.test(t)) { k = 'good'; }
      else if (/^(pending|in[ _]progress|draft|submitted|waiting|open|on[ _]hold|requested|partially.*|to[ _]do|scheduled|planned|in review|expiring)$/.test(t)) { k = 'warn'; }
      else if (/^(rejected|cancel+ed|inactive|expired|failed|absent|no|declined|terminated|overdue|lost)$/.test(t)) { k = 'bad'; }
      if (k) { el.dataset['zlStatus'] = k; } else { delete el.dataset['zlStatus']; }
    });
  }

  private matchEmp(text: string): DirEmp | null {
    const t = (text || '').trim().toLowerCase();
    if (!t) { return null; }
    const code = t.match(/emp[-_ ]?\d+|[a-z]{2,4}-?\d{3,}/i);
    if (code && this.dirByCode.has(code[0].toLowerCase())) { return this.dirByCode.get(code[0].toLowerCase())!; }
    if (this.dirByCode.has(t)) { return this.dirByCode.get(t)!; }
    const name = t.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
    if (this.dirByName.has(name)) { return this.dirByName.get(name)!; }
    for (const [n, e] of this.dirByName) { if (n.length > 5 && t.includes(n)) { return e; } }
    return null;
  }

  // value used by filters / groups for a facet key
  private facetValue(r: Row, key: string): string {
    if (key.startsWith('o:')) {
      const org = key.slice(2) as OrgKey;
      const col = this.cols.find(c => c.org === org && !c.skip);
      if (col) { return r.cells[col.idx] || ''; }
      return (r.emp && (r.emp as any)[org]) || '';
    }
    if (key.startsWith('m:')) {
      const d = parseDate(r.cells[+key.slice(2)] || '');
      return d ? d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }) : '';
    }
    return r.cells[+key.slice(2)] || '';
  }

  private facetLabel(key: string): string {
    if (key.startsWith('o:')) { return orgKeys().find(o => o.key === key.slice(2))?.label || key.slice(2); }
    const c = this.cols[+key.slice(2)];
    return key.startsWith('m:') ? `${c?.label} (month)` : (c?.label || '');
  }

  /** Branch / Department / Designation / Category first, then status-like columns. */
  private facetKeys(): string[] {
    const keys: string[] = [];
    for (const o of orgKeys()) {
      const col = this.cols.find(c => c.org === o.key && !c.skip);
      if (col || this.hasEmp) { keys.push('o:' + o.key); }
    }
    for (const c of this.cols) { if (c.facet && !c.org) { keys.push('c:' + c.idx); } }
    return keys;
  }

  // ------------------------------------------------------------------ filtering, grouping, sorting
  private passes(r: Row): boolean {
    for (const ch of this.chips) {
      if (ch.type === 'search') {
        const t = (ch.text || '').toLowerCase();
        const hay = ch.key === 'all'
          ? r.cells.join(' \u0001 ').toLowerCase() + ' ' + (r.emp ? `${r.emp.code} ${r.emp.branch} ${r.emp.department} ${r.emp.designation} ${r.emp.category}`.toLowerCase() : '')
          : this.facetValue(r, ch.key).toLowerCase();
        if (!hay.includes(t)) { return false; }
      } else if (ch.type === 'filter') {
        const v = this.facetValue(r, ch.key).toLowerCase();
        if (!(ch.values || []).some(x => x.toLowerCase() === v)) { return false; }
      } else if (ch.type === 'date') {
        const d = parseDate(r.cells[ch.col!] || '');
        if (!d) { return false; }
        if (ch.from && d < new Date(ch.from + 'T00:00:00')) { return false; }
        if (ch.to && d > new Date(ch.to + 'T23:59:59')) { return false; }
      } else if (ch.type === 'custom') {
        const raw = ch.key.startsWith('o:') ? this.facetValue(r, ch.key) : (r.cells[ch.col!] || '');
        const v = raw.toLowerCase(), q = (ch.text || '').toLowerCase();
        const nv = num(raw), nq = num(ch.text || '');
        const dv = parseDate(raw), dq = parseDate(ch.text || '');
        switch (ch.op) {
          case 'contains': if (!v.includes(q)) { return false; } break;
          case 'not': if (v.includes(q)) { return false; } break;
          case 'is': if (v !== q) { return false; } break;
          case 'empty': if (v) { return false; } break;
          case 'set': if (!v) { return false; } break;
          case 'gt': if (nv !== null && nq !== null ? !(nv > nq) : dv && dq ? !(dv > dq) : !(v > q)) { return false; } break;
          case 'lt': if (nv !== null && nq !== null ? !(nv < nq) : dv && dq ? !(dv < dq) : !(v < q)) { return false; } break;
        }
      }
    }
    return true;
  }

  private compare(a: Row, b: Row, idx: number): number {
    const c = this.cols[idx];
    const x = a.cells[idx] || '', y = b.cells[idx] || '';
    if (c?.kind === 'number') { return (num(x) ?? -Infinity) - (num(y) ?? -Infinity); }
    if (c?.kind === 'date') { return (parseDate(x)?.getTime() ?? 0) - (parseDate(y)?.getTime() ?? 0); }
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
  }

  // ------------------------------------------------------------------ rendering
  private render(): void {
    if (!this.active) { return; }
    const list = this.rows.filter(r => this.passes(r));
    let ordered = list.slice();
    if (this.sort) { const s = this.sort; ordered.sort((a, b) => this.compare(a, b, s.idx) * s.dir || a.seq - b.seq); }
    if (this.groupBy.length) {
      const keyOf = (r: Row) => this.groupBy.map(g => this.facetValue(r, g) || '(none)');
      ordered = ordered.map((r, i) => ({ r, i, k: keyOf(r) })).sort((a, b) => {
        for (let j = 0; j < a.k.length; j++) {
          const c = this.groupBy[j].startsWith('m:')
            ? (parseDate(a.r.cells[+this.groupBy[j].slice(2)] || '')?.getTime() ?? 0) - (parseDate(b.r.cells[+this.groupBy[j].slice(2)] || '')?.getTime() ?? 0)
            : a.k[j].localeCompare(b.k[j], undefined, { numeric: true });
          if (c) { return c; }
        }
        return a.i - b.i;
      }).map(x => x.r);
    }
    this.visible = ordered;
    // grouped lists show every group (collapsed / expanded) instead of pages
    const grouped = this.groupBy.length > 0;
    const pages = grouped ? 1 : Math.max(1, Math.ceil(ordered.length / this.size));
    if (this.page > pages) { this.page = pages; }
    const start = grouped ? 0 : (this.page - 1) * this.size;
    const pageRows = new Set(grouped ? ordered : ordered.slice(start, start + this.size));
    this.quiet(() => {
      const multi = this.multi;
      this.table.querySelectorAll('tr[data-zl="group"], tr[data-zl="empty"], tbody[data-zl]').forEach(x => x.remove());
      const tb = (multi ? this.table : this.rows[0]?.el.parentElement || this.table.tBodies[0]) as HTMLElement;
      if (!tb) { return; }
      const units = (list: Row[]) => list.map(r => this.unit(r)).filter(u => u && u.parentElement === tb);
      if (this.ownGroups) { this.groupBy = []; this.sort = null; }
      const reorder = !this.ownGroups && !!(this.sort || this.groupBy.length);
      if (reorder) {
        for (const u of units(ordered.filter(r => pageRows.has(r)))) { tb.appendChild(u); }
      } else {
        const seqUnits = units(this.rows.slice().sort((a, b) => a.seq - b.seq));
        let prev: Element | null = null;
        let inOrder = true;
        for (const u of seqUnits) { if (prev && prev.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_PRECEDING) { inOrder = false; break; } prev = u; }
        if (!inOrder) { for (const u of seqUnits) { tb.appendChild(u); } }
      }
      for (const r of this.rows) {
        const show = pageRows.has(r) && !this.isCollapsed(r);
        this.unit(r).classList.toggle('zl-off', !show);
        r.el.classList.toggle('zl-picked', this.selected.has(r.el));
        this.ensureSelCell(r.el);
      }
      this.table.querySelectorAll('tr.zl-placeholder').forEach(p => (p as HTMLElement).classList.toggle('zl-off', this.rows.length > 0));
      if (this.groupBy.length) { this.insertGroupRows(ordered.filter(r => pageRows.has(r)), tb); }
      if (!ordered.length && this.rows.length) {
        const tr = document.createElement('tr'); tr.dataset['zl'] = 'empty'; tr.className = 'zl-emptyrow';
        tr.innerHTML = `<td colspan="${this.headCells().length + 1}">No records match these filters. <button type="button" class="zl-link" data-act="clear">Clear filters</button></td>`;
        tb.appendChild(this.wrap(tr, multi));
      }
    });
    this.paintBar();
    this.paintFoot(ordered.length, start, grouped ? ordered.length : Math.min(start + this.size, ordered.length), pages);
    this.applyColumns();
    this.paintViews();
  }

  private isCollapsed(r: Row): boolean {
    if (!this.groupBy.length || !this.collapsed.size) { return false; }
    let path = '';
    for (const g of this.groupBy) {
      path += '\u0001' + (this.facetValue(r, g) || '(none)');
      if (this.collapsed.has(path)) { return true; }
    }
    return false;
  }

  private wrap(tr: HTMLTableRowElement, multi: boolean): HTMLElement {
    if (!multi) { return tr; }
    const body = document.createElement('tbody');
    body.dataset['zl'] = tr.dataset['zl'] || 'x';
    body.appendChild(tr);
    return body;
  }

  private insertGroupRows(rows: Row[], tb: HTMLElement): void {
    const multi = this.multi;
    const span = this.headCells().length + 1;
    const numCols = this.cols.filter(c => c.kind === 'number' && !c.skip && !/(^id$|code|phone|mobile|no\.?$|number|year)/i.test(c.label));
    const all = this.visible;
    const seen = new Set<string>();
    for (const r of rows) {
      let path = '';
      for (let lvl = 0; lvl < this.groupBy.length; lvl++) {
        const g = this.groupBy[lvl];
        const v = this.facetValue(r, g) || '(none)';
        const parent = path;
        path += '\u0001' + v;
        if (seen.has(path)) { continue; }
        seen.add(path);
        if (lvl > 0 && this.collapsedAbove(parent)) { continue; }
        const members = all.filter(x => {
          let p = '';
          for (let j = 0; j <= lvl; j++) { p += '\u0001' + (this.facetValue(x, this.groupBy[j]) || '(none)'); }
          return p === path;
        });
        const sums = numCols.map(c => {
          const total = members.reduce((a, x) => a + (num(x.cells[c.idx]) || 0), 0);
          return `<span class="zl-gsum">${esc(c.label)} <b>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></span>`;
        }).join('');
        const tr = document.createElement('tr');
        tr.dataset['zl'] = 'group';
        tr.className = 'zl-grow lvl' + lvl + (this.collapsed.has(path) ? ' closed' : '');
        tr.innerHTML = `<td colspan="${span}"><button type="button" class="zl-gbtn" data-act="toggle" data-path="${esc(path)}" style="padding-left:${8 + lvl * 22}px">
          <span class="zl-caret">${ICON['caret']}</span><span class="zl-gname">${esc(this.facetLabel(g))}: <b>${esc(v)}</b></span>
          <span class="zl-gcount">${members.length}</span>${sums}</button></td>`;
        const unit = this.unit(r);
        // rows can sit in another tbody than the first (reports with their own grouping markup)
        if (unit.parentNode) { unit.parentNode.insertBefore(this.wrap(tr, multi), unit); } else { (multi ? tb.parentNode || tb : tb).appendChild(this.wrap(tr, multi)); }
      }
    }
  }

  /** Start grouped lists with every top-level group closed (counts and totals visible). */
  private collapseTop(): void {
    this.collapsed.clear();
    if (!this.groupBy.length) { return; }
    for (const r of this.rows) { if (this.passes(r)) { this.collapsed.add('\u0001' + (this.facetValue(r, this.groupBy[0]) || '(none)')); } }
  }

  private collapsedAbove(path: string): boolean {
    const parts = path.split('\u0001').slice(1);
    let p = '';
    for (const part of parts) { p += '\u0001' + part; if (this.collapsed.has(p)) { return true; } }
    return false;
  }

  private ensureSelCell(tr: HTMLTableRowElement): void {
    let first = tr.cells[0] as HTMLTableCellElement | undefined;
    if (first && first.classList.contains('zl-selcell')) {
      const cb = first.querySelector('input') as HTMLInputElement; if (cb) { cb.checked = this.selected.has(tr); }
      return;
    }
    const td = document.createElement('td');
    td.className = 'zl-selcell'; td.dataset['zl'] = 'sel';
    td.innerHTML = `<input type="checkbox" aria-label="Select row" ${this.selected.has(tr) ? 'checked' : ''}>`;
    tr.insertBefore(td, tr.firstChild);
  }

  private paintHead(): void {
    const hr = this.headRow();
    if (!hr) { return; }
    this.quiet(() => {
      if (!(hr.cells[0] && hr.cells[0].classList.contains('zl-selcell'))) {
        const th = document.createElement('th');
        th.className = 'zl-selcell'; th.dataset['zl'] = 'sel';
        th.innerHTML = '<input type="checkbox" aria-label="Select all rows on this page">';
        hr.insertBefore(th, hr.firstChild);
        // other header rows (multi-row headers) keep their alignment
        const thead = this.table.tHead;
        if (thead) { Array.from(thead.rows).filter(r => r !== hr).forEach(r => { const f = document.createElement('th'); f.className = 'zl-selcell'; f.dataset['zl'] = 'sel'; r.insertBefore(f, r.firstChild); }); }
      }
      this.headCells().forEach((th, idx) => {
        const c = this.cols[idx];
        th.classList.toggle('zl-sortable', !!c && !c.skip);
        let ind = th.querySelector('.zl-sort') as HTMLElement | null;
        if (c && !c.skip) {
          if (!ind) { ind = document.createElement('span'); ind.className = 'zl-sort'; ind.dataset['zl'] = 'sort'; th.appendChild(ind); }
          ind.textContent = this.sort?.idx === idx ? (this.sort.dir === 1 ? '▲' : '▼') : '';
          th.dataset['zlIdx'] = String(idx);
        }
      });
    });
    hr.onclick = (ev) => {
      const th = (ev.target as HTMLElement).closest('th') as HTMLElement | null;
      if (!th || th.classList.contains('zl-selcell') || (ev.target as HTMLElement).closest('input,button,select,a,mat-checkbox')) { return; }
      const idx = Number(th.dataset['zlIdx']);
      if (isNaN(idx) || this.cols[idx]?.skip || this.ownGroups) { return; }
      this.sort = !this.sort || this.sort.idx !== idx ? { idx, dir: 1 } : this.sort.dir === 1 ? { idx, dir: -1 } : null;
      this.paintHead(); this.render();
    };
    const all = hr.querySelector('th.zl-selcell input') as HTMLInputElement | null;
    if (all) {
      all.onchange = () => {
        const start = (this.page - 1) * this.size;
        this.visible.slice(start, start + this.size).forEach(r => all.checked ? this.selected.add(r.el) : this.selected.delete(r.el));
        this.render();
      };
    }
  }

  // ------------------------------------------------------------------ toolbar
  private buildBar(): void {
    const bar = document.createElement('div');
    bar.className = 'zl-bar'; bar.dataset['zl'] = 'bar';
    bar.innerHTML = `
      <div class="zl-search">
        <span class="zl-sicon">${ICON['search']}</span>
        <div class="zl-chips"></div>
        <input type="text" class="zl-input" placeholder="Search…" aria-label="Search this list" autocomplete="off">
        <div class="zl-suggest" hidden></div>
      </div>
      <div class="zl-tools">
        <div class="zl-views" role="tablist" aria-label="View"></div>
        <button type="button" class="zl-btn" data-menu="filters">${ICON['filter']}<span>Filters</span></button>
        <button type="button" class="zl-btn" data-menu="group">${ICON['group']}<span>Group by</span></button>
        <button type="button" class="zl-btn" data-menu="columns">${ICON['cols']}<span>Columns</span></button>
        <span class="zl-sep"></span>
        <button type="button" class="zl-btn" data-menu="export">${ICON['down']}<span>Export</span></button>
        ${/\/report-options\//.test(location.pathname) ? '' : `<button type="button" class="zl-btn" data-menu="import">${ICON['up']}<span>Import</span></button>`}
      </div>`;
    this.quiet(() => this.anchor.parentElement!.insertBefore(bar, this.anchor));
    this.bar = bar;
    const input = bar.querySelector('.zl-input') as HTMLInputElement;
    input.addEventListener('input', () => { this.suggestText = input.value; this.paintSuggest(); });
    input.addEventListener('keydown', (e) => {
      const box = bar.querySelector('.zl-suggest') as HTMLElement;
      const items = Array.from(box.querySelectorAll('.zl-sug')) as HTMLElement[];
      const cur = items.findIndex(i => i.classList.contains('on'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = items.length ? (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length : -1;
        items.forEach((i, k) => i.classList.toggle('on', k === n));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        (items[cur >= 0 ? cur : 0])?.click();
      } else if (e.key === 'Backspace' && !input.value && this.chips.length) {
        this.chips.pop(); this.page = 1; this.render();
      } else if (e.key === 'Escape') {
        input.value = ''; this.suggestText = ''; this.paintSuggest();
      }
    });
    bar.addEventListener('click', (e) => this.onBarClick(e));
  }

  private paintSuggest(): void {
    const box = this.bar!.querySelector('.zl-suggest') as HTMLElement;
    const t = this.suggestText.trim();
    if (!t) { box.hidden = true; box.innerHTML = ''; return; }
    const opts: string[] = [`<button type="button" class="zl-sug on" data-act="search" data-col="-1">Search <b>all columns</b> for: <i>${esc(t)}</i></button>`];
    for (const c of this.cols) {
      if (c.skip) { continue; }
      opts.push(`<button type="button" class="zl-sug" data-act="search" data-col="${c.idx}">Search <b>${esc(c.label)}</b> for: <i>${esc(t)}</i></button>`);
    }
    if (this.hasEmp) {
      for (const o of orgKeys()) {
        if (!this.cols.some(c => c.org === o.key)) {
          opts.push(`<button type="button" class="zl-sug" data-act="search" data-org="${o.key}">Search <b>${o.label}</b> for: <i>${esc(t)}</i></button>`);
        }
      }
    }
    box.innerHTML = opts.slice(0, 14).join('');
    box.hidden = false;
  }

  private onBarClick(e: Event): void {
    const el = (e.target as HTMLElement).closest('[data-act],[data-menu]') as HTMLElement | null;
    if (!el) { if ((e.target as HTMLElement).closest('.zl-search')) { (this.bar!.querySelector('.zl-input') as HTMLElement).focus(); } return; }
    const act = el.dataset['act'];
    if (el.dataset['menu']) { this.openMenu(el.dataset['menu']!, el); return; }
    if (act === 'view') { this.view = el.dataset['view'] as ViewKind; this.saveLayout(); this.render(); return; }
    if (act === 'search') {
      const input = this.bar!.querySelector('.zl-input') as HTMLInputElement;
      const t = input.value.trim();
      if (!t) { return; }
      const org = el.dataset['org'];
      const col = Number(el.dataset['col'] ?? -1);
      const label = org ? (orgKeys().find(o => o.key === org)?.label || org) : col >= 0 ? this.cols[col].label : 'Search';
      this.chips.push({ type: 'search', key: org ? 'o:' + org : col >= 0 ? 'c:' + col : 'all', label, text: t, col });
      input.value = ''; this.suggestText = ''; this.paintSuggest(); this.page = 1; this.render();
    } else if (act === 'chip-x') {
      const i = Number(el.dataset['i']);
      if (i >= 0) { this.chips.splice(i, 1); } else { this.groupBy = []; this.collapsed.clear(); }
      this.page = 1; this.render();
    }
  }

  private paintBar(): void {
    if (!this.bar) { return; }
    const box = this.bar.querySelector('.zl-chips') as HTMLElement;
    const parts = this.chips.map((c, i) => {
      let body = '';
      if (c.type === 'search') { body = `<span class="zl-ck">${esc(c.label)}</span> ${esc(c.text)}`; }
      if (c.type === 'filter') { body = `<span class="zl-ck">${esc(c.label)}</span> ${(c.values || []).map(esc).join(' <span class="zl-or">or</span> ')}`; }
      if (c.type === 'date') { body = `<span class="zl-ck">${esc(c.label)}</span> ${esc(c.text || '')}`; }
      if (c.type === 'custom') { body = `<span class="zl-ck">${esc(c.label)}</span> ${esc(c.text || '')}`; }
      return `<span class="zl-chip ${c.type}">${body}<button type="button" data-act="chip-x" data-i="${i}" aria-label="Remove">${ICON['x']}</button></span>`;
    });
    if (this.groupBy.length) {
      parts.push(`<span class="zl-chip grp"><span class="zl-ck">Group by</span> ${this.groupBy.map(g => esc(this.facetLabel(g))).join(' › ')}<button type="button" data-act="chip-x" data-i="-1" aria-label="Remove grouping">${ICON['x']}</button></span>`);
    }
    box.innerHTML = parts.join('');
    (this.bar.querySelector('.zl-input') as HTMLInputElement).placeholder = parts.length ? '' : 'Search…';
    const f = this.bar.querySelector('[data-menu=filters]') as HTMLElement;
    const g = this.bar.querySelector('[data-menu=group]') as HTMLElement;
    f.classList.toggle('on', this.chips.some(c => c.type !== 'search'));
    g.classList.toggle('on', this.groupBy.length > 0);
    g.style.display = this.ownGroups ? 'none' : '';  // the screen groups its own rows
    const ex = this.bar.querySelector('[data-menu=export] span') as HTMLElement;
    const n = this.selCount();
    ex.textContent = n ? `Export ${n}` : 'Export';
  }

  // ------------------------------------------------------------------ menus
  private outside = (e: Event) => {
    const t = e.target as HTMLElement;
    if (this.menu && !this.menu.contains(t) && !t.closest('[data-menu]')) { this.closeMenu(); }
    if (this.bar && !this.bar.querySelector('.zl-search')!.contains(t)) {
      const box = this.bar.querySelector('.zl-suggest') as HTMLElement; if (box && !box.hidden) { box.hidden = true; }
    }
  };

  private closeMenu(): void { this.menu?.remove(); this.menu = undefined; this.bar?.querySelectorAll('[data-menu]').forEach(b => b.classList.remove('open')); }

  private openMenu(kind: string, btn: HTMLElement): void {
    const wasOpen = this.menu?.dataset['kind'] === kind;
    this.closeMenu();
    if (wasOpen) { return; }
    const m = document.createElement('div');
    m.className = 'zl-menu zl-menu-' + kind; m.dataset['zl'] = 'menu'; m.dataset['kind'] = kind;
    btn.classList.add('open');
    document.body.appendChild(m);
    this.menu = m;
    if (kind === 'filters') { this.fillFilters(m); }
    if (kind === 'group') { this.fillGroup(m); }
    if (kind === 'export') { this.fillExport(m); }
    if (kind === 'import') { this.fillImport(m); }
    if (kind === 'columns') { this.fillColumns(m); }
    const r = btn.getBoundingClientRect();
    const w = m.offsetWidth;
    m.style.top = `${r.bottom + window.scrollY + 6}px`;
    m.style.left = `${Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - w - 12))}px`;
  }

  private valueCounts(key: string): [string, number][] {
    const counts = new Map<string, { v: string; n: number }>();
    for (const r of this.rows) {
      const v = this.facetValue(r, key);
      if (!v) { continue; }
      const k = v.toLowerCase();
      const cur = counts.get(k); if (cur) { cur.n++; } else { counts.set(k, { v, n: 1 }); }
    }
    return Array.from(counts.values()).sort((a, b) => b.n - a.n || a.v.localeCompare(b.v)).map(x => [x.v, x.n]);
  }

  private fillFilters(m: HTMLElement): void {
    const sections: string[] = [];
    for (const key of this.facetKeys()) {
      const vals = this.valueCounts(key);
      if (!vals.length) { continue; }
      const cur = this.chips.find(c => c.type === 'filter' && c.key === key)?.values?.map(v => v.toLowerCase()) || [];
      const many = vals.length > 8;
      sections.push(`<div class="zl-sec" data-key="${key}"><div class="zl-sec-h">${esc(this.facetLabel(key))}</div>
        ${many ? `<input class="zl-mini" placeholder="Find ${esc(this.facetLabel(key).toLowerCase())}…" data-find>` : ''}
        <div class="zl-opts">${vals.slice(0, 40).map(([v, n]) => `<label class="zl-opt"><input type="checkbox" value="${esc(v)}" ${cur.includes(v.toLowerCase()) ? 'checked' : ''}><span>${esc(v)}</span><em>${n}</em></label>`).join('')}</div></div>`);
    }
    const dateCols = this.cols.filter(c => c.kind === 'date' && !c.skip);
    for (const c of dateCols) {
      sections.push(`<div class="zl-sec" data-date="${c.idx}"><div class="zl-sec-h">${esc(c.label)}</div>
        <div class="zl-period">
          <button type="button" data-p="today">Today</button><button type="button" data-p="week">This week</button>
          <button type="button" data-p="month">This month</button><button type="button" data-p="lmonth">Last month</button>
          <button type="button" data-p="year">This year</button>
        </div>
        <div class="zl-range"><input type="date" data-from aria-label="From"><span>to</span><input type="date" data-to aria-label="To"><button type="button" class="zl-apply" data-range>Apply</button></div></div>`);
    }
    const colOpts = this.cols.filter(c => !c.skip).map(c => `<option value="c:${c.idx}">${esc(c.label)}</option>`).join('')
      + (this.hasEmp ? orgKeys().filter(o => !this.cols.some(c => c.org === o.key)).map(o => `<option value="o:${o.key}">${o.label}</option>`).join('') : '');
    sections.push(`<div class="zl-sec zl-custom"><div class="zl-sec-h">Custom filter</div>
      <div class="zl-cf"><select data-cf-col>${colOpts}</select>
      <select data-cf-op><option value="contains">contains</option><option value="not">does not contain</option><option value="is">is equal to</option>
        <option value="gt">is greater than</option><option value="lt">is less than</option><option value="set">is set</option><option value="empty">is not set</option></select>
      <input data-cf-val placeholder="Value"><button type="button" class="zl-apply" data-cf>Add</button></div></div>`);
    // v1.8.0: favourites – the current filters and grouping saved under a name, per user and screen
    const canSave = this.chips.length > 0 || this.groupBy.length > 0;
    sections.unshift(`<div class="zl-sec zl-favs"><div class="zl-sec-h">Favourites</div>
      ${this.favs.length ? `<div class="zl-favlist">${this.favs.map((f, i) => `<span class="zl-fav"><button type="button" data-fav="${i}" title="Apply">${ICON['star'] || '★'} ${esc(f.name)}</button><button type="button" class="zl-favx" data-favx="${i}" aria-label="Delete ${esc(f.name)}">×</button></span>`).join('')}</div>` : '<p class="zl-muted">No favourites yet. Pick filters or a grouping, then save them here.</p>'}
      <div class="zl-range"><input class="zl-favname" data-favname placeholder="Name of this favourite"><button type="button" class="zl-apply" data-favsave ${canSave ? '' : 'disabled'}>Save current filters</button></div></div>`);
    m.innerHTML = `<div class="zl-menu-scroll">${sections.join('') || '<p class="zl-muted">Nothing to filter yet.</p>'}</div>`;
    const favState = () => setTimeout(() => { const sv = m.querySelector('[data-favsave]') as HTMLButtonElement | null; if (sv) { sv.disabled = !(this.chips.length || this.groupBy.length); } });
    m.addEventListener('change', favState); m.addEventListener('click', favState);
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b) { return; }
      if (b.dataset['fav'] !== undefined) {
        const f = this.favs[+b.dataset['fav']!];
        if (f) { this.chips = JSON.parse(JSON.stringify(f.chips)); this.groupBy = [...(f.groupBy || [])]; this.collapsed.clear(); this.page = 1; this.closeMenu(); this.render(); }
      } else if (b.dataset['favx'] !== undefined) {
        this.favs.splice(+b.dataset['favx']!, 1); this.saveLayout(); this.closeMenu(); this.openMenu('filters', this.bar!.querySelector('[data-menu="filters"]') as HTMLElement);
      } else if (b.hasAttribute('data-favsave')) {
        const inp = m.querySelector('[data-favname]') as HTMLInputElement;
        const name = (inp.value || '').trim() || `Favourite ${this.favs.length + 1}`;
        this.favs = this.favs.filter(f => f.name.toLowerCase() !== name.toLowerCase());
        this.favs.push({ name, chips: JSON.parse(JSON.stringify(this.chips)), groupBy: [...this.groupBy] });
        this.saveLayout(); this.closeMenu(); this.openMenu('filters', this.bar!.querySelector('[data-menu="filters"]') as HTMLElement);
      }
    });
    m.addEventListener('change', (e) => {
      const cb = e.target as HTMLInputElement;
      if (cb.type !== 'checkbox') { return; }
      const key = (cb.closest('.zl-sec') as HTMLElement).dataset['key']!;
      const picked = Array.from(m.querySelectorAll(`.zl-sec[data-key="${key}"] input[type=checkbox]:checked`)).map(x => (x as HTMLInputElement).value);
      const i = this.chips.findIndex(c => c.type === 'filter' && c.key === key);
      if (!picked.length) { if (i >= 0) { this.chips.splice(i, 1); } } else if (i >= 0) { this.chips[i].values = picked; } else { this.chips.push({ type: 'filter', key, label: this.facetLabel(key), values: picked }); }
      this.page = 1; this.render();
    });
    m.addEventListener('input', (e) => {
      const f = e.target as HTMLInputElement;
      if (!f.hasAttribute('data-find')) { return; }
      const q = f.value.toLowerCase();
      f.parentElement!.querySelectorAll('.zl-opt').forEach(o => (o as HTMLElement).style.display = (o.textContent || '').toLowerCase().includes(q) ? '' : 'none');
    });
    m.addEventListener('click', (e) => {
      const b = e.target as HTMLElement;
      const sec = b.closest('.zl-sec') as HTMLElement | null;
      if (!sec) { return; }
      if (b.dataset['p'] || b.hasAttribute('data-range')) {
        const col = Number(sec.dataset['date']);
        let from = '', to = '', text = '';
        const d = new Date(); const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        const p = b.dataset['p'];
        if (p === 'today') { from = to = iso(d); text = 'Today'; }
        if (p === 'week') { const s = new Date(d); s.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const e2 = new Date(s); e2.setDate(s.getDate() + 6); from = iso(s); to = iso(e2); text = 'This week'; }
        if (p === 'month') { from = iso(new Date(d.getFullYear(), d.getMonth(), 1)); to = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); text = d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }); }
        if (p === 'lmonth') { const s = new Date(d.getFullYear(), d.getMonth() - 1, 1); from = iso(s); to = iso(new Date(d.getFullYear(), d.getMonth(), 0)); text = s.toLocaleString('en-GB', { month: 'long', year: 'numeric' }); }
        if (p === 'year') { from = `${d.getFullYear()}-01-01`; to = `${d.getFullYear()}-12-31`; text = String(d.getFullYear()); }
        if (b.hasAttribute('data-range')) {
          from = (sec.querySelector('[data-from]') as HTMLInputElement).value; to = (sec.querySelector('[data-to]') as HTMLInputElement).value;
          if (!from && !to) { return; }
          text = `${from || '…'} → ${to || '…'}`;
        }
        this.chips = this.chips.filter(c => !(c.type === 'date' && c.col === col));
        this.chips.push({ type: 'date', key: 'c:' + col, label: this.cols[col].label, col, from, to, text });
        this.page = 1; this.render(); this.closeMenu();
      }
      if (b.hasAttribute('data-cf')) {
        const key = (sec.querySelector('[data-cf-col]') as HTMLSelectElement).value;
        const op = (sec.querySelector('[data-cf-op]') as HTMLSelectElement).value;
        const val = (sec.querySelector('[data-cf-val]') as HTMLInputElement).value.trim();
        if (!val && !['set', 'empty'].includes(op)) { return; }
        const opText: any = { contains: 'contains', not: 'does not contain', is: '=', gt: '>', lt: '<', set: 'is set', empty: 'is not set' };
        this.chips.push({ type: 'custom', key, label: this.facetLabel(key), col: key.startsWith('c:') ? +key.slice(2) : 0, op, text: `${opText[op]} ${val}`.trim() });
        const last = this.chips[this.chips.length - 1]; last.text = val; last.label = `${this.facetLabel(key)} ${opText[op]}`;
        this.page = 1; this.render(); this.closeMenu();
      }
    });
  }

  private fillGroup(m: HTMLElement): void {
    const keys = this.facetKeys();
    for (const c of this.cols) { if (c.kind === 'date' && !c.skip) { keys.push('m:' + c.idx); } }
    const items = keys.map(k => {
      const lvl = this.groupBy.indexOf(k);
      return `<button type="button" class="zl-gopt ${lvl >= 0 ? 'on' : ''}" data-g="${k}"><span>${esc(this.facetLabel(k))}</span>${lvl >= 0 ? `<em>${lvl + 1}</em>` : ''}</button>`;
    });
    m.innerHTML = `<div class="zl-menu-scroll"><div class="zl-sec-h">Group rows by (up to two levels)</div>${items.join('') || '<p class="zl-muted">No columns to group by.</p>'}
      ${this.groupBy.length ? `<div class="zl-gfoot"><button type="button" class="zl-link" data-g-expand>Expand all</button><button type="button" class="zl-link" data-g-collapse>Collapse all</button><button type="button" class="zl-link" data-g-clear>Remove grouping</button></div>` : ''}</div>`;
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b) { return; }
      if (b.dataset['g']) {
        const k = b.dataset['g']!;
        const i = this.groupBy.indexOf(k);
        if (i >= 0) { this.groupBy.splice(i, 1); } else { if (this.groupBy.length >= 2) { this.groupBy.shift(); } this.groupBy.push(k); }
        this.collapseTop();
      } else if (b.hasAttribute('data-g-clear')) { this.groupBy = []; this.collapsed.clear(); } else if (b.hasAttribute('data-g-expand')) { this.collapsed.clear(); } else if (b.hasAttribute('data-g-collapse')) {
        this.collapseTop();
      }
      this.page = 1; this.render(); this.fillGroup(m);
    }, { once: true });
  }

  private exportData(selectedOnly: boolean): { headers: string[]; rows: string[][] } {
    // v1.12.0: designer fields not ticked "Export" in the form designer stay out of exports
    const noExport = new Set<string>((this.extra?.fields || []).filter((f: any) => f.show_in_export === false).map((f: any) => f.label));
    const cols = this.cols.filter(c => !c.skip && !this.hideCols.has(c.label) && !noExport.has(c.label));
    const extra = this.hasEmp ? orgKeys().filter(o => !this.cols.some(c => c.org === o.key)) : [];
    const src = selectedOnly ? this.visible.filter(r => this.selected.has(r.el)) : this.visible;
    return {
      headers: [...cols.map(c => c.label), ...extra.map(o => o.label)],
      rows: src.map(r => [...cols.map(c => r.cells[c.idx] || ''), ...extra.map(o => (r.emp as any)?.[o.key] || '')]),
    };
  }

  private title(): string {
    const sec = this.anchor.closest('.comapny_section, .container, .hr-page, section, .card') || document.body;
    const h = sec.querySelector('.header_section h1, h1, h2, h3, .card-title') as HTMLElement | null;
    const t = (h?.textContent || document.title || 'List').replace(/\s+/g, ' ').trim();
    return t === t.toUpperCase() && /[A-Z]/.test(t) ? t.replace(/\w\S*/g, w => w.charAt(0) + w.slice(1).toLowerCase()) : t;
  }

  private fillExport(m: HTMLElement): void {
    const n = this.selCount();
    const total = this.visible.length;
    m.innerHTML = `<div class="zl-sec-h">${n ? `Export ${n} selected rows` : `Export ${total} rows${this.chips.length ? ' (filtered)' : ''}`}</div>
      <button type="button" class="zl-item" data-x="xlsx"><b>Excel</b><span>.xlsx – opens in Excel, numbers stay numbers</span></button>
      <button type="button" class="zl-item" data-x="csv"><b>CSV</b><span>.csv – for other systems (UTF-8)</span></button>
      <button type="button" class="zl-item" data-x="pdf"><b>PDF</b><span>.pdf – ready to print or e-mail</span></button>`;
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-x]') as HTMLElement | null;
      if (!b) { return; }
      const { headers, rows } = this.exportData(n > 0);
      const title = this.title();
      if (b.dataset['x'] === 'xlsx') { exportExcel(title, headers, rows); }
      if (b.dataset['x'] === 'csv') { exportCsv(title, headers, rows); }
      if (b.dataset['x'] === 'pdf') { exportPdf(title, headers, rows, this.chips.map(c => `${c.label} ${c.values ? c.values.join('/') : c.text || ''}`).join(', ')); }
      this.closeMenu();
    });
  }

  private ownImportButton(): HTMLElement | null {
    const sec = this.anchor.closest('.comapny_section, .container, .hr-page') || this.anchor.parentElement!;
    const btns = Array.from(sec.querySelectorAll('button, a')) as HTMLElement[];
    return btns.find(b => !b.closest('[data-zl]') && !b.closest('.modal, .modal-content, mat-dialog-container')
      && /^\s*(\S+\s+)?(import|bulk upload|upload)\s*$/i.test((b.textContent || '').replace(/system_update_alt|sync_alt|upload_file|file_upload|cloud_upload/g, '').replace(/\s+/g, ' ').trim())) || null;
  }

  private fillImport(m: HTMLElement): void {
    if (!this.endpoint) { this.endpoint = this.z.endpointFor(this.rows.map(r => r.cells)); }
    const own = this.ownImportButton();
    const parts: string[] = [];
    if (this.endpoint) {
      parts.push(`<div class="zl-sec-h">Import into this list</div>
        <button type="button" class="zl-item" data-i="tpl-xlsx"><b>Download template (Excel)</b><span>Columns of this screen, with a "How to fill" sheet</span></button>
        <button type="button" class="zl-item" data-i="tpl-csv"><b>Download template (CSV)</b><span>Same columns as plain CSV</span></button>
        <button type="button" class="zl-item" data-i="upload"><b>Import a file…</b><span>Excel or CSV – rows are checked before anything is saved</span></button>`);
    }
    const std = this.standardKind();
    if (std) { parts.push(`<button type="button" class="zl-item" data-i="std"><b>Load the standard list…</b><span>Adds the usual UAE ${std}s that are missing; nothing is changed or removed</span></button>`); }
    if (own) { parts.push(`<button type="button" class="zl-item" data-i="own"><b>This screen's own upload</b><span>Opens the existing bulk upload of this screen</span></button>`); }
    if (!parts.length) { parts.push('<p class="zl-muted">This list is filled by the system (for example from requests or payroll), so it cannot be imported here.</p>'); }
    m.innerHTML = parts.join('');
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-i]') as HTMLElement | null;
      if (!b) { return; }
      const what = b.dataset['i'];
      this.closeMenu();
      if (what === 'own') { this.zone.run(() => own?.click()); return; }
      if (what === 'tpl-xlsx' || what === 'tpl-csv') { this.downloadTemplate(what === 'tpl-csv'); return; }
      if (what === 'upload') { this.openImport(); }
      if (what === 'std' && std) { this.loadStandard(std); }
    });
  }

  /** Department, Designation and Category lists offer the standard list. */
  private standardKind(): string | null {
    const e = this.endpoint || '';
    if (/\/organisation\/api\/Department\//i.test(e)) { return 'department'; }
    if (/\/organisation\/api\/Designation\//i.test(e)) { return 'designation'; }
    if (/\/organisation\/api\/Catogory\//i.test(e)) { return 'category'; }
    return null;
  }

  private loadStandard(kind: string): void {
    this.z.standardList(kind).subscribe({
      next: (r: any) => {
        const missing = (r.items || []).filter((i: any) => !i.exists);
        if (!missing.length) { this.toast(`Every standard ${kind} is already in the list.`); return; }
        const names = missing.map((i: any) => '• ' + i.name).join('\n');
        if (!confirm(`Add these ${missing.length} ${kind}s to the list?\n\n${names}\n\nThey are linked to your branches. Existing ${kind}s are not changed.`)) { return; }
        this.z.loadStandardList(kind).subscribe({
          next: (res: any) => {
            this.toast(`${res.created?.length || 0} ${kind}s added.`);
            setTimeout(() => location.reload(), 1200);
          },
          error: (e: any) => this.toast(e?.error?.detail || 'The standard list could not be loaded.', true),
        });
      },
      error: (e: any) => this.toast(e?.error?.detail || 'The standard list could not be loaded.', true),
    });
  }

  private loadFields(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.z.fields(this.endpoint!).subscribe({
        next: (r: any) => resolve(r.fields || []),
        error: (err: any) => reject(err?.error?.detail || 'Import is not available for this list.'),
      });
    });
  }

  private async downloadTemplate(csv: boolean): Promise<void> {
    try {
      const fields = await this.loadFields();
      const headers = fields.map(f => f.label + (f.required ? ' *' : ''));
      const example = fields.map(f => f.type === 'link' ? (f.examples?.[0] || '') : f.type === 'choice' ? (f.choices?.[0]?.label || '') : f.type === 'date' ? '31/12/2026' : f.type === 'yes/no' ? 'Yes' : '');
      if (csv) { exportCsv(this.title() + ' template', headers, [example]); return; }
      const help: any[][] = [['Column', 'Required', 'What to enter', 'Allowed values / examples']];
      for (const f of fields) {
        const what = f.type === 'link' ? `${f.link}${f.many ? ' (several: separate with commas)' : ''} – code, name or id` : f.type === 'choice' ? 'One of the allowed values'
          : f.type === 'date' ? 'Date, e.g. 31/12/2026' : f.type === 'yes/no' ? 'Yes or No' : f.type === 'number' ? 'Number' : f.type === 'file' ? 'Not supported in import – add later on the screen' : 'Text';
        const allowed = f.type === 'choice' ? (f.choices || []).map((c: any) => c.label).join(', ') : f.type === 'link' ? (f.examples || []).join(', ') : '';
        help.push([f.label, f.required ? 'Yes' : '', what, allowed]);
      }
      exportExcel(this.title() + ' template', headers, [example], [{ name: 'How to fill', rows: help }]);
    } catch (e: any) { this.toast(String(e), true); }
  }

  private openImport(): void {
    const modal = document.createElement('div');
    modal.className = 'zl-modal'; modal.dataset['zl'] = 'modal';
    modal.innerHTML = `<div class="zl-dialog" role="dialog" aria-modal="true" aria-label="Import">
      <div class="zl-dh"><h3>Import – ${esc(this.title())}</h3><button type="button" class="zl-x" data-close aria-label="Close">${ICON['x']}</button></div>
      <div class="zl-db">
        <p class="zl-muted">Use the template from this screen. Linked columns (branch, department, employee …) take the code or the name. Nothing is saved until you press Import.</p>
        <label class="zl-drop"><input type="file" accept=".xlsx,.xls,.csv"><span>Choose an Excel or CSV file</span></label>
        <div class="zl-result"></div>
      </div>
      <div class="zl-df"><button type="button" class="zl-btn" data-tpl>Download template</button><span class="zl-grow"></span>
        <button type="button" class="zl-btn" data-close>Cancel</button><button type="button" class="zl-btn primary" data-go disabled>Import</button></div>
    </div>`;
    document.body.appendChild(modal);
    let ready: any[] = [];
    const res = modal.querySelector('.zl-result') as HTMLElement;
    const go = modal.querySelector('[data-go]') as HTMLButtonElement;
    const close = () => modal.remove();
    modal.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t === modal || t.closest('[data-close]')) { close(); return; }
      if (t.closest('[data-tpl]')) { this.downloadTemplate(false); return; }
      if (t.closest('[data-go]') && ready.length) {
        go.disabled = true; go.textContent = 'Importing…';
        this.z.importRows(this.endpoint!, ready, false).subscribe({
          next: (r: any) => {
            const bad = (r.results || []).filter((x: any) => !x.ok);
            res.innerHTML = `<div class="zl-sum ok">${r.ok} of ${r.total} rows imported.</div>${this.problemTable(bad)}
              <p class="zl-muted">The list refreshes when you close this window.</p>`;
            go.textContent = 'Imported'; ready = [];
            modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => location.reload(), { once: true }));
          },
          error: (err: any) => { res.innerHTML = `<div class="zl-sum bad">${esc(err?.error?.detail || 'Import failed.')}</div>`; go.textContent = 'Import'; go.disabled = false; },
        });
      }
    });
    (modal.querySelector('input[type=file]') as HTMLInputElement).addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { return; }
      (modal.querySelector('.zl-drop span') as HTMLElement).textContent = file.name;
      res.innerHTML = '<p class="zl-muted">Checking the file…</p>'; go.disabled = true; ready = [];
      try {
        const [fields, sheet] = await Promise.all([this.loadFields(), readSheet(file)]);
        const norm = (s: string) => s.toLowerCase().replace(/\*/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
        const map = new Map<string, string>();
        for (const h of sheet.headers) {
          const f = fields.find(x => norm(x.label) === norm(h) || norm(x.key) === norm(h));
          if (f) { map.set(h, f.key); }
        }
        const missing = fields.filter(f => f.required && ![...map.values()].includes(f.key));
        if (!map.size) { res.innerHTML = '<div class="zl-sum bad">None of the columns match this screen. Download the template and copy your data into it.</div>'; return; }
        const rows = sheet.rows.map(r => { const o: any = {}; map.forEach((k, h) => { o[k] = r[h]; }); return o; });
        if (!rows.length) { res.innerHTML = '<div class="zl-sum bad">The file has no data rows.</div>'; return; }
        this.z.importRows(this.endpoint!, rows, true).subscribe({
          next: (r: any) => {
            const bad = (r.results || []).filter((x: any) => !x.ok);
            ready = (r.results || []).filter((x: any) => x.ok).map((x: any) => rows[x.row - 1]);
            const unknown = sheet.headers.filter(h => !map.has(h));
            res.innerHTML = `<div class="zl-sum ${bad.length ? 'warn' : 'ok'}"><b>${r.ok}</b> rows ready${bad.length ? ` · <b>${bad.length}</b> rows need fixing (they will be skipped)` : ''}.</div>
              ${missing.length ? `<p class="zl-warn">Required columns not in the file: ${missing.map(m2 => esc(m2.label)).join(', ')}</p>` : ''}
              ${unknown.length ? `<p class="zl-muted">Ignored columns: ${unknown.map(esc).join(', ')}</p>` : ''}
              ${this.problemTable(bad)}`;
            go.disabled = !ready.length; go.textContent = ready.length ? `Import ${ready.length} rows` : 'Import';
          },
          error: (err: any) => { res.innerHTML = `<div class="zl-sum bad">${esc(err?.error?.detail || 'The file could not be checked.')}</div>`; },
        });
      } catch (err: any) {
        res.innerHTML = `<div class="zl-sum bad">${esc(typeof err === 'string' ? err : err?.message || 'The file could not be read.')}</div>`;
      }
    });
  }

  private problemTable(bad: any[]): string {
    if (!bad.length) { return ''; }
    return `<table class="zl-ptable" zPlain><thead><tr><th>Row</th><th>What to fix</th></tr></thead><tbody>${bad.slice(0, 200).map(b =>
      `<tr><td>${b.row + 1}</td><td>${(b.errors || []).map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>`;
  }

  private toast(msg: string, bad = false): void {
    const t = document.createElement('div');
    t.className = 'zl-toast' + (bad ? ' bad' : ''); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
  }

  // ------------------------------------------------------------------ footer
  private buildFoot(): void {
    const f = document.createElement('div');
    f.className = 'zl-foot'; f.dataset['zl'] = 'foot';
    f.innerHTML = `
      <label class="zl-selall"><input type="checkbox" data-selall><span>Select all</span></label>
      <span class="zl-selinfo"></span>
      <span class="zl-grow"></span>
      <label class="zl-size">Rows per page <select data-size>${SIZES.map(s => `<option value="${s}">${s}</option>`).join('')}</select></label>
      <span class="zl-range-t"></span>
      <button type="button" class="zl-pg" data-pg="-1" aria-label="Previous page">${ICON['prev']}</button>
      <button type="button" class="zl-pg" data-pg="1" aria-label="Next page">${ICON['next']}</button>`;
    this.quiet(() => this.anchor.parentElement!.insertBefore(f, this.anchor.nextSibling));
    this.foot = f;
    (f.querySelector('[data-size]') as HTMLSelectElement).value = String(this.size);
    f.addEventListener('change', (e) => {
      const t = e.target as HTMLElement;
      if (t.hasAttribute('data-size')) {
        this.size = Number((t as HTMLSelectElement).value); this.page = 1;
        try { localStorage.setItem('zl-size:' + location.pathname, String(this.size)); } catch { /* ignore */ }
        this.render();
      }
      if (t.hasAttribute('data-selall')) {
        const on = (t as HTMLInputElement).checked;
        this.visible.forEach(r => on ? this.selected.add(r.el) : this.selected.delete(r.el));
        this.render();
      }
    });
    f.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-pg],[data-act]') as HTMLElement | null;
      if (!b) { return; }
      if (b.dataset['pg']) { this.page += Number(b.dataset['pg']); this.render(); this.anchor.scrollIntoView({ block: 'nearest' }); }
      if (b.dataset['act'] === 'unselect') { this.rows.forEach(r => this.selected.delete(r.el)); this.render(); }
      if (b.dataset['act'] === 'exportsel') { this.openMenu('export', this.bar!.querySelector('[data-menu=export]') as HTMLElement); }
    });
    // row checkboxes + group toggles + "clear filters" (delegated on the table)
    this.table.addEventListener('change', (e) => {
      const cb = e.target as HTMLInputElement;
      const cell = cb.closest('td.zl-selcell');
      if (!cell) { return; }
      const tr = cell.parentElement as HTMLTableRowElement;
      cb.checked ? this.selected.add(tr) : this.selected.delete(tr);
      tr.classList.toggle('zl-picked', cb.checked);
      this.paintBar(); this.paintFootSel();
    });
    this.table.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!b || !b.closest('[data-zl]')) { return; }
      if (b.dataset['act'] === 'toggle') { const p = b.dataset['path']!; this.collapsed.has(p) ? this.collapsed.delete(p) : this.collapsed.add(p); this.render(); }
      if (b.dataset['act'] === 'clear') { this.chips = []; this.page = 1; this.render(); }
    });
  }

  private selCount(): number { return this.rows.filter(r => this.selected.has(r.el)).length; }

  private paintFootSel(): void {
    if (!this.foot) { return; }
    const n = this.selCount();
    const info = this.foot.querySelector('.zl-selinfo') as HTMLElement;
    info.innerHTML = n ? `<b>${n}</b> selected <button type="button" class="zl-link" data-act="exportsel">Export</button><button type="button" class="zl-link" data-act="unselect">Clear</button>` : '';
    const all = this.foot.querySelector('[data-selall]') as HTMLInputElement;
    all.checked = n > 0 && n >= this.visible.length;
    all.indeterminate = n > 0 && n < this.visible.length;
    (this.foot.querySelector('.zl-selall span') as HTMLElement).textContent = this.visible.length ? `Select all ${this.visible.length}` : 'Select all';
  }

  private paintFoot(total: number, from: number, to: number, pages: number): void {
    if (!this.foot) { return; }
    const groups = this.groupBy.length ? new Set(this.visible.map(r => this.facetValue(r, this.groupBy[0]) || '(none)')).size : 0;
    (this.foot.querySelector('.zl-range-t') as HTMLElement).textContent = this.groupBy.length
      ? `${groups} groups · ${total} rows`
      : total ? `${from + 1}–${to} of ${total}${total !== this.rows.length ? ` (${this.rows.length} in list)` : ''}` : `0 of ${this.rows.length}`;
    (this.foot.querySelector('[data-pg="-1"]') as HTMLButtonElement).disabled = this.page <= 1;
    (this.foot.querySelector('[data-pg="1"]') as HTMLButtonElement).disabled = this.page >= pages;
    (this.foot.querySelector('[data-size]') as HTMLSelectElement).value = String(this.size);
    this.paintFootSel();
    const hp = this.headRow()?.querySelector('th.zl-selcell input') as HTMLInputElement | null;
    if (hp) {
      const start = (this.page - 1) * this.size;
      const pageRows = this.visible.slice(start, start + this.size);
      hp.checked = pageRows.length > 0 && pageRows.every(r => this.selected.has(r.el));
    }
  }

  // ------------------------------------------------------------------ the screen's own search / pager
  // ------------------------------------------------------------------ v1.7.0: layout (columns + view), saved per user
  private loadLayout(): void {
    const idx = Array.from(document.querySelectorAll('table.zl-table')).indexOf(this.table);
    this.layoutKey = location.pathname + '|' + Math.max(0, idx);
    try { const c = JSON.parse(localStorage.getItem('zl-layout:' + this.layoutKey) || 'null'); if (c) { this.useLayout(c); } } catch { /* storage off */ }
    this.subs.push(this.rec.layout('list', this.layoutKey).subscribe({ next: d => { if (d && Object.keys(d).length) { this.useLayout(d); this.render(); } }, error: () => { /* keep defaults */ } }));
  }

  private useLayout(d: any): void {
    if (d.view && VIEW_LABEL[d.view as ViewKind]) { this.view = d.view; }
    if (d.vst) { this.vst = d.vst; }
    this.hideCols = new Set(Array.isArray(d.hide) ? d.hide : []);
    this.hasLayout = true;
    if (Array.isArray(d.fav)) { this.favs = d.fav.filter((f: any) => f && f.name && Array.isArray(f.chips)); }
  }

  private saveLayout(): void {
    const data = { view: this.view, vst: this.vst, hide: [...this.hideCols], fav: this.favs };
    try { localStorage.setItem('zl-layout:' + this.layoutKey, JSON.stringify(data)); } catch { /* ignore */ }
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.rec.saveLayout('list', this.layoutKey, data).subscribe({ error: () => { /* offline */ } }), 800);
  }

  private fillColumns(m: HTMLElement): void {
    const cols = this.cols.filter(c => c.label);
    m.innerHTML = `<div class="zl-sec-h">Columns</div>
      <div class="zl-colist">${cols.map(c => `<label class="zl-check"><input type="checkbox" data-col="${esc(c.label)}" ${this.hideCols.has(c.label) ? '' : 'checked'}> ${esc(c.label)}</label>`).join('')}</div>
      <div class="zl-mfoot"><button type="button" class="zl-link" data-all>Show all</button><span class="zl-grow"></span><span class="zl-muted">Saved for you on this screen</span></div>`;
    m.addEventListener('change', (e) => {
      const cb = e.target as HTMLInputElement; const lab = cb.dataset['col'];
      if (!lab) { return; }
      cb.checked ? this.hideCols.delete(lab) : this.hideCols.add(lab);
      if (this.cols.filter(c => c.label && !this.hideCols.has(c.label)).length === 0) { this.hideCols.delete(lab); cb.checked = true; }
      this.saveLayout(); this.applyColumns();
    });
    m.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-all]')) { this.hideCols.clear(); this.saveLayout(); this.applyColumns(); m.querySelectorAll('input').forEach(i => (i as HTMLInputElement).checked = true); }
    });
  }

  private applyColumns(): void {
    const hide = new Set(this.cols.filter(c => this.hideCols.has(c.label)).map(c => c.idx));
    this.quiet(() => {
      const hr = this.headRow();
      if (hr) { this.headCells().forEach((th, i) => th.classList.toggle('zl-colhide', hide.has(i))); }
      for (const r of this.rows) {
        Array.from(r.el.cells).filter(c => !c.classList.contains('zl-selcell')).forEach((td, i) => td.classList.toggle('zl-colhide', hide.has(i)));
      }
    });
    const b = this.bar?.querySelector('[data-menu=columns]') as HTMLElement | null;
    if (b) { b.classList.toggle('on', hide.size > 0); (b.querySelector('span') as HTMLElement).textContent = hide.size ? `Columns (${hide.size} hidden)` : 'Columns'; }
  }

  // ------------------------------------------------------------------ v1.7.0: views
  private vcols(): VCol[] { return this.cols.filter(c => !this.hideCols.has(c.label)).map(c => ({ idx: c.idx, label: c.label, kind: c.kind, skip: c.skip, facet: c.facet })); }

  private paintViews(): void {
    if (!this.bar) { return; }
    const cols = this.vcols();
    const avail = this.ownGroups ? ['list' as ViewKind] : availableViews(cols);
    if (!avail.includes(this.view)) { this.view = 'list'; }
    const box = this.bar.querySelector('.zl-views') as HTMLElement;
    const html = avail.length > 1 ? avail.map(v => `<button type="button" role="tab" class="zl-vbtn${v === this.view ? ' on' : ''}" aria-selected="${v === this.view}" data-act="view" data-view="${v}" title="${VIEW_LABEL[v]}">${ICON[v]}<span>${VIEW_LABEL[v]}</span></button>`).join('') : '';
    if (box.innerHTML !== html) { box.innerHTML = html; }
    const listMode = this.view === 'list';
    this.quiet(() => {
      this.anchor.classList.toggle('zl-hidden', !listMode);
      this.foot?.classList.toggle('zl-hidden', !listMode);
    });
    if (listMode) { this.viewEl?.remove(); this.viewEl = undefined; return; }
    if (!this.viewEl) {
      const v = document.createElement('div');
      v.className = 'zv'; v.dataset['zl'] = 'view';
      this.quiet(() => this.anchor.parentElement!.insertBefore(v, this.anchor));
      v.addEventListener('change', (e) => {
        const sel = (e.target as HTMLElement).closest('[data-v]') as HTMLSelectElement | null;
        if (sel) { (this.vst as any)[sel.dataset['v']!] = Number(sel.value); this.saveLayout(); this.paintViews(); }
      });
      v.addEventListener('click', (e) => this.onViewClick(e));
      this.viewEl = v;
    }
    this.vst = defaults(cols, this.vst);
    const rows = this.visible.map(r => ({ key: r.seq, cells: r.cells }));
    const html2 = this.view === 'kanban' ? kanbanHtml(cols, rows, this.vst) : this.view === 'calendar' ? calendarHtml(cols, rows, this.vst)
      : this.view === 'graph' ? graphHtml(cols, rows, this.vst) : pivotHtml(cols, rows, this.vst);
    this.viewEl.innerHTML = html2;
  }

  private onViewClick(e: Event): void {
    const t = e.target as HTMLElement;
    const cal = t.closest('[data-cal]') as HTMLElement | null;
    if (cal) { this.vst.calMonth = cal.dataset['cal']; this.saveLayout(); this.paintViews(); return; }
    const gt = t.closest('[data-gt]') as HTMLElement | null;
    if (gt) { this.vst.graphType = gt.dataset['gt'] as any; this.saveLayout(); this.paintViews(); return; }
    if (t.closest('[data-pivot-export]')) {
      const { head, body } = pivotData(this.vcols(), this.visible.map(r => ({ key: r.seq, cells: r.cells })), this.vst);
      exportExcel(this.title() + ' pivot', head, body); return;
    }
    const card = t.closest('[data-row]') as HTMLElement | null;
    if (card) { this.openRow(Number(card.dataset['row'])); }
  }

  /** Open a record from a card: the row's own view / edit action, or a click on the row. */
  private openRow(seq: number): void {
    const r = this.rows.find(x => x.seq === seq);
    if (!r) { return; }
    const lab = (b: Element) => ((b as HTMLElement).innerText + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '')).toLowerCase();
    const acts = Array.from(r.el.querySelectorAll('button, a, [role=button]')).filter(b => !b.closest('.zl-selcell'));
    const pick = acts.find(b => /view|visibility|open|details/.test(lab(b))) || acts.find(b => /edit|draw/.test(lab(b)));
    this.view = 'list'; this.render();
    setTimeout(() => {
      r.el.scrollIntoView({ block: 'center' });
      r.el.classList.add('zl-flash'); setTimeout(() => r.el.classList.remove('zl-flash'), 1600);
      if (pick) { (pick as HTMLElement).click(); } else { (r.el.cells[1] || r.el).dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    }, 60);
  }

  // ------------------------------------------------------------------ v1.7.0: designer fields as columns
  private loadExtras(): void {
    if (this.ownGroups || !this.rows.length) { return; }
    const ep = this.z.endpointFor(this.rows.slice(0, 40).map(r => r.cells));
    if (!ep) { return; }
    const ids = new Map<HTMLTableRowElement, string>();
    for (const r of this.rows) { const hit = this.rec.rowRecord(r.el); if (hit) { ids.set(r.el, hit.id); } }
    const sig = ep + ':' + [...ids.values()].join(',');
    if (sig === this.extraSig || !ids.size) { return; }
    this.extraSig = sig;
    this.rec.listValues(ep, [...new Set(ids.values())]).subscribe({
      next: (res: any) => {
        const fields = (res.fields || []).filter((f: any) => f.show_in_list);
        if (!fields.length) { if (this.extra) { this.extra = null; this.removeExtraCells(); this.schedule(0); } return; }
        this.extra = { endpoint: ep, fields, values: res.values || {}, ids };
        this.schedule(0);
      },
      error: () => { /* no extra fields */ },
    });
  }

  private removeExtraCells(): void {
    this.quiet(() => this.table.querySelectorAll('[data-zl="xh"], [data-zl="xc"]').forEach(x => x.remove()));
  }

  private addExtraCells(): void {
    if (!this.extra) { return; }
    const hr = this.headRow();
    if (!hr) { return; }
    const fields = this.extra.fields;
    if (hr.querySelectorAll('[data-zl="xh"]').length !== fields.length) {
      hr.querySelectorAll('[data-zl="xh"]').forEach(x => x.remove());
      for (const f of fields) { const th = document.createElement('th'); th.dataset['zl'] = 'xh'; th.textContent = f.label; th.title = 'Extra field (form designer)'; hr.appendChild(th); }
    }
    for (const tr of this.dataRows()) {
      if (tr.querySelectorAll('[data-zl="xc"]').length === fields.length) { continue; }
      tr.querySelectorAll('[data-zl="xc"]').forEach(x => x.remove());
      let id = this.extra.ids.get(tr);
      if (!id) { id = this.rec.rowRecord(tr)?.id; if (id) { this.extra.ids.set(tr, id); } }
      const vals = (id && this.extra.values[id]) || {};
      for (const f of fields) { const td = document.createElement('td'); td.dataset['zl'] = 'xc'; td.textContent = showValue(vals[f.name]); tr.appendChild(td); }
    }
  }

  private hideOwnControls(): void {
    const sec = (this.anchor.closest('.comapny_section, .hr-page, .container, .tab-pane, mat-tab-body') || this.anchor.parentElement) as HTMLElement;
    if (!sec) { return; }
    const tables = sec.querySelectorAll('table.zl-table, table:not([zPlain])');
    const own: HTMLElement[] = [];
    if (tables.length <= 1) {
      sec.querySelectorAll('.search-container, .search-box, .search-bar, .hr-search').forEach(s => { if (!s.closest('[data-zl]') && !s.closest('.modal')) { own.push(s as HTMLElement); } });
    }
    // pagers that sit with this table (whole section when it has one list, else near the table)
    const scope = (tables.length <= 1 ? sec : (this.anchor.parentElement?.parentElement || this.anchor.parentElement || sec)) as HTMLElement;
    Array.from(scope.querySelectorAll('.pagination, .pagination-container, .pagination-controls, .pager, .hr-pager, .page-controls, nav[aria-label*="agination"], .table-pagination, .paginator'))
      .forEach(p => { if (!p.closest('[data-zl]') && !p.querySelector('table')) { own.push(p as HTMLElement); } });
    Array.from(scope.querySelectorAll('div, nav')).filter(el => !el.closest('[data-zl]') && !el.querySelector('table, div div div') && /^(«\s*)?(previous|prev)\b[\s\S]{0,80}\bnext(\s*»)?$/i.test(((el as HTMLElement).innerText || '').trim()))
      .forEach(el => own.push(el as HTMLElement));
    Array.from(scope.children).forEach(ch => {
      const el = ch as HTMLElement;
      if (el === this.anchor || el.dataset['zl'] !== undefined || el.querySelector('table')) { return; }
      const txt = (el.innerText || '').trim();
      if (/^(«\s*)?(previous|prev)\b[\s\S]{0,60}\bnext(\s*»)?$/i.test(txt) || /^page \d+ of \d+/i.test(txt)) { own.push(el); }
    });
    // v1.7.0: one search and one export per list – the page's own search box and Export button go
    if (tables.length <= 1) {
      const page = (this.anchor.closest('.comapny_section, .hr-page, .container, mat-tab-body') || sec) as HTMLElement;
      const outside = (el: Element) => !el.closest('[data-zl], table, .modal, .modal-content, mat-dialog-container, z-record-panel, form');
      page.querySelectorAll('input[type=text], input[type=search], input:not([type])').forEach(i => {
        const inp = i as HTMLInputElement;
        if (!outside(inp) || !/search|find/i.test(inp.placeholder || inp.getAttribute('aria-label') || '')) { return; }
        let box: HTMLElement = inp;
        // the input with its own search / filter icon
        while (box.parentElement && box.parentElement !== page && box.parentElement.querySelectorAll('input, select').length <= 1 && !box.parentElement.querySelector('table, h1, h2, h3')) { box = box.parentElement; }
        own.push(box);
        const opts = box.parentElement?.querySelector('.ser_sub, .search-options, .search-dropdown') as HTMLElement | null;
        if (opts) { own.push(opts); }
      });
      const label = (b: Element) => { const c = b.cloneNode(true) as HTMLElement; c.querySelectorAll('mat-icon, i, svg').forEach(x => x.remove()); return (c.textContent || '').replace(/\s+/g, ' ').trim(); };
      page.querySelectorAll('button, a.btn').forEach(b => {
        if (!outside(b)) { return; }
        if (/^(export|download)( to)?( (excel|csv|pdf|list|data|all))?$|^export (to )?(excel|csv|pdf)$|^excel$|^csv$|^pdf$/i.test(label(b)) && !/template/i.test(label(b))) { own.push(b as HTMLElement); }
      });
    }
    // the screen's own Import / Bulk upload button moves into the shared Import menu (still opens its own upload)
    const imp = this.ownImportButton();
    if (imp) { own.push(imp); }
    own.forEach(el => el.classList.add('zl-hidden'));
    this.hidden = own;
  }
}
