import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';
import { ORG_KEYS$, orgKeys } from './z-org-keys';
import { OrgSettingsService } from '../org-structure/org-settings.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { DirEmp, ZListService } from './z-list.service';
import { XItem, XModel, csvText, exportCsv, exportExcel, exportModelCsv, exportModelExcel, exportModelPdf, modelCsv, readSheet } from './z-export';
import { SavedViewItem, ViewData, ZSavedViewsService } from './z-saved-views';   // v1.16.0 saved views
import { ZRecordService } from './z-record.service';
import { showValue } from './field-types';
import { VCol, VIEW_LABEL, ViewKind, ViewState, availableViews, calendarHtml, defaults, graphHtml, kanbanHtml, pivotData, pivotHtml } from './z-views';
import { i18nOriginal, i18nT as T } from './i18n-core';   // v1.15.0: list texts in the user's language
import { paintColumns, personCell, presentEl, rawText, setUserNames } from './z-present';   // v1.62.0 ui

/**
 * Same list experience on every screen (attaches itself to every data table):
 *   search box with field suggestions, Filters (Branch / Department / Designation / Category,
 *   status-like columns, date periods, custom filter), Group by (two levels, counts and totals),
 *   column sorting, select all, 50 / 100 / 500 / 1000 rows per page,
 *   Export (Excel, CSV, PDF) and Import (template + checked upload through the screen's own API).
 * v1.7.0: Columns (show / hide, saved per user), views (List, Kanban, Calendar, Graph, Pivot) and the
 *   extra fields of the form designer as columns.
 * v1.16.0: exports follow the screen (columns in their order, filters, sort and the group by levels with counts and
 *   subtotals); columns can be moved and resized; saved views (search, filters, group by, sort, columns with order and
 *   widths, rows per page, view mode) are stored on the server – personal or shared – and one can be the user's default.
 *
 * It works on the rendered rows, so every screen keeps its own buttons, forms and actions.
 * Opt out with <table zPlain>.
 */

type Kind = 'text' | 'number' | 'date';
interface Col { idx: number; label: string; kind: Kind; skip: boolean; facet: boolean; org?: OrgKey; }
interface Row { el: HTMLTableRowElement; seq: number; cells: string[]; raw: string[]; emp?: DirEmp | null; }   // v1.62.0 ui raw: the cell texts before the presentation pass
type OrgKey = string;   // v1.12.0: branch, department, designation, category + the org fields switched on (see z-org-keys.ts)
interface Chip { type: 'search' | 'filter' | 'custom' | 'date'; key: string; label: string; values?: string[]; col?: number; op?: string; text?: string; from?: string; to?: string; }

// v1.12.0: the org filters (Branch / Department / Designation / Category + switched-on org fields) come from orgKeys()
const SKIP_HEAD = /^(actions?|action buttons?|edit|delete|select|options?|#|no\.?|s\.?\s?no\.?|sl\.?\s?no\.?|sr\.?\s?no\.?|view|operations?|)$/i;
const EMP_HEAD = /(employee|^emp\b|emp code|emp id|staff|^name$|employee name|requested by|applicant)/i;
const SIZES = [50, 100, 500, 1000];
const EXCLUDE = '.modal, .modal-content, .modal-dialog, mat-dialog-container, .cdk-overlay-pane, .zd-panel, .hr-modal, .hr-detail, .zl-modal, .payslip, .print-area, #print-section, .no-zlist, [zPlain], .fc, mat-calendar';

const OPS: Record<string, string> = { '>': 'greater than', '<': 'less than', '=': 'equals', contains: 'contains', empty: 'is empty', past: 'date passed', soon: 'date within (days)' };   // v1.46.0
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
  views: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
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
  const t = (s || '').replace(/[,\s]|AED|USD|INR|SAR|QAR|OMR|BHD|KWD|%|days?|hrs?|h$/gi, '');   // v1.14.0: GCC currencies
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
  // v1.40.1: a screen with its own checkbox column (header select-all + row checkboxes, e.g. payslip approval) keeps
  // that one column: the list adopts it for Export / "N selected" instead of adding a second one. The screen's
  // checkbox is then the single source of truth – the list reads it and, when it selects rows itself, sets it and
  // fires `change` so the screen's ngModel follows.
  private ownSel = false;
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
  // v1.46.0 totals row, colour rules, editing cells in the list
  private totals = '';
  private rules: { col: string; op: string; value: string; color: string; scope: 'row' | 'cell' }[] = [];
  private inline = false;
  private teams: { id: number; name: string }[] = [];
  private teamsLoaded = false;
  private hasLayout = false;   // v1.13.0: a saved column layout exists
  private optDone = false;     // v1.13.0: optional columns hidden once
  private viewEl?: HTMLElement;
  private layoutKey = '';
  private saveTimer: any;
  private extra: { endpoint: string; fields: any[]; values: Record<string, Record<string, any>>; ids: Map<HTMLTableRowElement, string> } | null = null;
  private extraSig = '';

  private orgSettings = inject(OrgSettingsService);   // v1.12.0: loads the org fields for the filters
  // v1.16.0: column order / widths and saved views
  private sv = inject(ZSavedViewsService);
  private order: string[] = [];                  // column names in the order the user wants (empty = as the screen has them)
  private widths: Record<string, number> = {};   // column name -> width in px
  private views: SavedViewItem[] = [];
  private viewId: number | null = null;          // saved view in use
  private defaultId: number | null = null;
  private canShare = false;
  private viewsLoaded = false;
  private pending: ViewData | null = null;       // view to apply once the columns are known
  private applied = false;                       // a saved view was applied: the last-used layout does not overwrite it
  private legacyFavs: any[] = [];                // v1.8.0 favourites, moved into saved views once

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
    this.loadViews();   // v1.16.0
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
    // v1.62.0 ui: sign-in names (gdis_rajesh) in lists show the person
    this.subs.push(this.z.userNames().subscribe(list => { setUserNames(list, this.z.schema); this.schedule(0); }));
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
    // v1.16.0: buttons shown later (after the rights load) are checked again, so a screen keeps one export – the list's
    this.timer = setTimeout(() => { this.scan(); this.usePending(); this.render(); this.hideOwnControls(); }, ms);
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

  /** v1.16.0: row containers – the bodies, and the table itself when screens put their rows straight in it (no tbody). */
  private bodies(): HTMLElement[] {
    const out: HTMLElement[] = Array.from(this.table.tBodies).filter(b => b.dataset['zl'] === undefined);
    if (Array.from(this.table.children).some(c => c.tagName === 'TR')) { out.push(this.table); }
    return out;
  }

  private bodyRows(b: HTMLElement): HTMLTableRowElement[] {
    return b === this.table ? Array.from(b.children).filter(c => c.tagName === 'TR') as HTMLTableRowElement[] : Array.from((b as HTMLTableSectionElement).rows);
  }

  private unit(r: Row): HTMLElement { return this.multi ? (r.el.parentElement as HTMLElement) : r.el; }

  private dataRows(): HTMLTableRowElement[] {
    const out: HTMLTableRowElement[] = [];
    const headRow = this.headRow();
    const multi = this.multi;
    for (const tb of this.bodies()) {
      for (const tr of this.bodyRows(tb)) {
        if (tr === headRow || tr.dataset['zl'] !== undefined) { continue; }
        const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell'));
        if (!cells.length) { continue; }
        if (cells.length === 1 && (cells[0] as HTMLTableCellElement).colSpan > 1) {
          const txt = i18nOriginal(cells[0]).trim();   // v1.15.0: the English text, even when translated on screen
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

  /** v1.15.0: column names stay the English captions (saved layouts, filters); they are shown with T() */
  private labelOf(h: HTMLElement): string {
    const t = i18nOriginal(h, '[data-zl], mat-icon, .mat-icon, i.fa, input').replace(/[▲▼↕]/g, '').replace(/\s+/g, ' ').trim();
    return t && t === t.toUpperCase() && /[A-Z]/.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t;
  }

  private scan(): void {
    if (!this.active) { return; }
    // v1.16.0: designer fields and the user's column order first, so the headings below are read in screen order
    this.quiet(() => { this.adoptOwnSel(); this.addExtraCells(); this.applyOrder(); });   // v1.40.1 adoptOwnSel
    const heads = this.headCells();
    const labels = heads.map(h => this.labelOf(h));
    this.ownGroups = false;
    const trs = this.dataRows();
    // phones show each row as a card: every cell needs its column name (data-label) for that
    this.quiet(() => trs.forEach(tr => Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell')).forEach((c, i) => {
      if (!c.getAttribute('data-label') && labels[i]) { c.setAttribute('data-label', T(labels[i])); }
    })));
    // v1.62.0 ui: one way to show values – dd/mm/yyyy dates, Yes / No, labels for codes, names for sign-in names
    const cellsOf = (tr: HTMLTableRowElement) => Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell')) as HTMLElement[];
    this.quiet(() => trs.forEach(tr => cellsOf(tr).forEach((c, i) => { if (c.dataset['zl'] === undefined && !SKIP_HEAD.test(labels[i] || 'x')) { presentEl(c); } })));
    this.rows = trs.map(tr => {
      if (!this.seqOf.has(tr)) { this.seqOf.set(tr, ++SEQ); }
      const cells = cellsOf(tr).map(c => this.cellText(c as HTMLElement));
      const raw = cellsOf(tr).map(c => rawText(c).replace(/\s+/g, ' ').trim());
      this.tagStatus(tr);
      return { el: tr, seq: this.seqOf.get(tr)!, cells, raw };
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
    // v1.62.0 ui: an employee column with the code only shows the name first; column types set alignment and wrapping
    this.quiet(() => {
      if (empIdx >= 0) {
        for (const r of this.rows) {
          const td = cellsOf(r.el)[empIdx];
          if (td && r.emp && r.emp.code && !r.cells.some((x, i) => i !== empIdx && r.emp && x.toLowerCase().includes((r.emp.name || '~').toLowerCase()))) { personCell(td, r.emp.name, r.emp.code); }
        }
      }
      paintColumns(heads, cols, trs, cellsOf, empIdx);
    });
    this.rows.forEach(r => { r.cells = cellsOf(r.el).map(c => this.cellText(c)); });
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
        r.el.classList.toggle('zl-picked', this.isSel(r.el));
        this.ensureSelCell(r.el);
      }
      this.table.querySelectorAll('tr.zl-placeholder').forEach(p => (p as HTMLElement).classList.toggle('zl-off', this.rows.length > 0));
      if (this.groupBy.length) { this.insertGroupRows(ordered.filter(r => pageRows.has(r)), tb); }
      if (!ordered.length && this.rows.length) {
        const tr = document.createElement('tr'); tr.dataset['zl'] = 'empty'; tr.className = 'zl-emptyrow';
        tr.innerHTML = `<td colspan="${this.headCells().length + 1}">${T('No records match these filters.')} <button type="button" class="zl-link" data-act="clear">${T('Clear filters')}</button></td>`;
        tb.appendChild(this.wrap(tr, multi));
      }
    });
    this.paintBar();
    this.paintFoot(ordered.length, start, grouped ? ordered.length : Math.min(start + this.size, ordered.length), pages);
    this.applyColumns();
    this.paintViews();
    this.paintTotals(ordered);   // v1.46.0
    this.paintRules();
  }

  // ------------------------------------------------------------------ v1.46.0 totals row and colour rules
  private numberCols(): Col[] {
    return this.cols.filter(c => c.kind === 'number' && !c.skip && !/(^id$|code|phone|mobile|no\.?$|number|year)/i.test(c.label));
  }

  private paintTotals(list: Row[]): void {
    this.quiet(() => {
      this.table.querySelectorAll('tfoot[data-zl="tot"]').forEach(x => x.remove());
      if (!this.totals || !list.length || this.view !== 'list') { return; }
      const nc = new Map(this.numberCols().map(c => [c.idx, c]));
      if (!nc.size) { return; }
      const heads = this.headCells();
      const tf = document.createElement('tfoot'); tf.dataset['zl'] = 'tot';
      const tr = document.createElement('tr'); tr.className = 'zl-totrow';
      const sel = document.createElement('td'); sel.className = 'zl-selcell'; tr.appendChild(sel);
      heads.forEach((th, i) => {
        const td = document.createElement('td');
        td.className = th.classList.contains('zl-colhide') ? 'zl-colhide' : '';
        const c = nc.get(i);
        if (c) {
          const vals = list.map(r => num(r.cells[i])).filter((v): v is number => v !== null);
          const sum = vals.reduce((a, b) => a + b, 0);
          const f = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
          const parts = [];
          if (this.totals === 'sum' || this.totals === 'both') { parts.push(`<b>${f(sum)}</b>`); }
          if ((this.totals === 'avg' || this.totals === 'both') && vals.length) { parts.push(`<span class="zl-avg">${T('avg')} ${f(sum / vals.length)}</span>`); }
          td.innerHTML = parts.join('<br>');
        } else if (i === 0) { td.innerHTML = `<b>${T(this.totals === 'avg' ? 'Average' : 'Total')}</b> <span class="zl-muted">(${list.length})</span>`; }
        tr.appendChild(td);
      });
      tf.appendChild(tr);
      this.table.appendChild(tf);
    });
  }

  private ruleHit(rule: { op: string; value: string }, text: string): boolean {
    const t = (text || '').trim();
    const v = (rule.value || '').trim();
    const n = num(t), nv = num(v);
    switch (rule.op) {
      case '>': return n !== null && nv !== null && n > nv;
      case '<': return n !== null && nv !== null && n < nv;
      case '=': return n !== null && nv !== null ? n === nv : t.toLowerCase() === v.toLowerCase();
      case 'contains': return !!v && t.toLowerCase().includes(v.toLowerCase());
      case 'empty': return !t || t === '–' || t === '-';
      case 'past': { const d = parseDate(t); return !!d && d.getTime() < new Date(new Date().toDateString()).getTime(); }
      case 'soon': { const d = parseDate(t); const now = new Date(new Date().toDateString()).getTime(); return !!d && d.getTime() >= now && d.getTime() <= now + (Number(v) || 30) * 86400000; }
      default: return false;
    }
  }

  private paintRules(): void {
    const colours = ['red', 'amber', 'green', 'blue', 'grey'];
    this.quiet(() => {
      for (const r of this.rows) {
        colours.forEach(c => r.el.classList.remove('zl-rc-' + c));
        Array.from(r.el.cells).forEach(td => colours.forEach(c => td.classList.remove('zl-cc-' + c)));
      }
      if (!this.rules.length) { return; }
      for (const r of this.rows) {
        for (const rule of this.rules) {
          const col = this.cols.find(c => c.label === rule.col);
          if (!col || !this.ruleHit(rule, r.cells[col.idx])) { continue; }
          if (rule.scope === 'cell') {
            const tds = Array.from(r.el.cells).filter(c => !c.classList.contains('zl-selcell'));
            tds[col.idx]?.classList.add('zl-cc-' + rule.color);
          } else { r.el.classList.add('zl-rc-' + rule.color); }
        }
      }
    });
  }

  // ------------------------------------------------------------------ v1.46.0 editing a cell in the list (double-click)
  private editKey(item: any, text: string, label: string): string | null {
    if (!item || typeof item !== 'object') { return null; }
    const t = (text || '').trim();
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hits = Object.keys(item).filter(k => {
      const v = item[k];
      if (k === 'id' || /(_label|_display|_name|_by|_at|number)$/i.test(k) || (v !== null && typeof v === 'object')) { return false; }
      if (v === null || v === '') { return t === '' || t === '–' || t === '-'; }
      const sv = String(v).trim();
      if (sv === t) { return true; }
      const a = num(sv), b = num(t);
      return a !== null && b !== null && a === b && typeof v === 'number' || (a !== null && b !== null && a === b && /^-?\d+(\.\d+)?$/.test(sv));
    });
    if (hits.length === 1) { return hits[0]; }
    const byName = hits.find(k => norm(k).includes(norm(label)) || norm(label).includes(norm(k)));
    return byName || null;
  }

  private startEdit(td: HTMLTableCellElement): void {
    const tr = td.parentElement as HTMLTableRowElement;
    const row = this.rows.find(r => r.el === tr);
    if (!row || td.classList.contains('zl-selcell') || td.querySelector('input,button,select,a') || td.dataset['zl']) { return; }
    const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell'));
    const idx = cells.indexOf(td);
    const col = this.cols[idx];
    const hit = this.rec.rowRecord(tr);
    const ep = hit?.endpoint || this.endpoint;
    const key = hit ? this.editKey(hit.item, row.raw[idx] ?? row.cells[idx], col?.label || '') : null;   // v1.62.0 ui raw text
    if (!hit || !ep || !key) { this.toast('This cell cannot be changed in the list – open the record.', true); return; }
    const old = hit.item[key];
    const inp = document.createElement('input');
    inp.className = 'zl-cellin';
    inp.type = typeof old === 'number' || (col?.kind === 'number') ? 'number' : /^\d{4}-\d{2}-\d{2}$/.test(String(old || '')) ? 'date' : 'text';
    inp.value = old === null || old === undefined ? '' : String(old);
    const keep = td.innerHTML;
    this.quiet(() => { td.innerHTML = ''; td.appendChild(inp); });
    inp.focus(); inp.select();
    let done = false;
    const finish = async (save: boolean) => {
      if (done) { return; } done = true;
      const val: any = inp.type === 'number' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
      if (!save || String(val ?? '') === String(old ?? '')) { this.quiet(() => { td.innerHTML = keep; }); return; }
      try {
        const saved = await this.call('PATCH', `${ep}${hit.id}/`, { [key]: val });
        hit.item[key] = saved && saved[key] !== undefined ? saved[key] : val;
        const show = saved && saved[key] !== undefined ? saved[key] : val;
        this.quiet(() => { td.textContent = show === null ? '' : String(show); });
        row.cells[idx] = td.textContent || ''; row.raw[idx] = row.cells[idx];
        td.classList.add('zl-saved'); setTimeout(() => td.classList.remove('zl-saved'), 1500);
        this.toast('Saved.');
      } catch (e: any) {
        this.quiet(() => { td.innerHTML = keep; });
        this.toast(e?.message || 'Not saved.', true);
      }
    };
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { finish(true); } if (ev.key === 'Escape') { finish(false); } });
    inp.addEventListener('blur', () => finish(true));
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
          return `<span class="zl-gsum">${esc(T(c.label))} <b>${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></span>`;
        }).join('');
        const tr = document.createElement('tr');
        tr.dataset['zl'] = 'group';
        tr.className = 'zl-grow lvl' + lvl + (this.collapsed.has(path) ? ' closed' : '');
        tr.innerHTML = `<td colspan="${span}"><button type="button" class="zl-gbtn" data-act="toggle" data-path="${esc(path)}" style="padding-inline-start:${8 + lvl * 22}px">
          <span class="zl-caret">${ICON['caret']}</span><span class="zl-gname">${esc(T(this.facetLabel(g)))}: <b>${esc(v)}</b></span>
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

  // ------------------------------------------------------------------ v1.40.1: selection helpers (own column aware)
  private ownCb(tr: HTMLTableRowElement): HTMLInputElement | null {
    const c = tr.cells[0];
    return c && c.classList.contains('zl-own') ? c.querySelector('input[type=checkbox]') as HTMLInputElement | null : null;
  }
  private isSel(tr: HTMLTableRowElement): boolean { const cb = this.ownCb(tr); return cb ? cb.checked : this.selected.has(tr); }
  private setSel(tr: HTMLTableRowElement, on: boolean): void {
    const cb = this.ownCb(tr);
    // a click toggles it the way the user would (ngModel / mat-checkbox follow); setting .checked alone would not
    if (cb) { if (cb.checked !== on) { cb.click(); } return; }
    on ? this.selected.add(tr) : this.selected.delete(tr);
  }
  private static checkCell(c: HTMLTableCellElement | undefined): boolean {
    if (!c || c.classList.contains('zl-selcell')) { return false; }
    const cb = c.querySelector('input[type=checkbox]');
    return !!cb && !c.querySelector('input:not([type=checkbox]), select, textarea, button, a') && SKIP_HEAD.test(i18nOriginal(c, 'input').replace(/\s+/g, ' ').trim());
  }
  /** The screen's own checkbox column (first cell of the heading and of the rows) becomes the list's selection column. */
  private adoptOwnSel(): void {
    const hr = this.headRow();
    if (!hr) { return; }
    const th = hr.cells[0] as HTMLTableCellElement | undefined;
    if (th && !th.classList.contains('zl-selcell') && ZListDirective.checkCell(th)) {
      const sample = this.dataRows().find(tr => tr.cells.length > 1);
      if (!sample || ZListDirective.checkCell(sample.cells[0] as HTMLTableCellElement)) { this.ownSel = true; th.classList.add('zl-selcell', 'zl-own'); }
    }
    if (!this.ownSel) { return; }
    for (const tr of this.dataRows()) {
      const c = tr.cells[0] as HTMLTableCellElement | undefined;
      if (c && !c.classList.contains('zl-selcell') && c.querySelector('input[type=checkbox]')) { c.classList.add('zl-selcell', 'zl-own'); }
    }
  }

  private ensureSelCell(tr: HTMLTableRowElement): void {
    let first = tr.cells[0] as HTMLTableCellElement | undefined;
    if (first && first.classList.contains('zl-selcell')) {
      if (first.classList.contains('zl-own')) { return; }   // v1.40.1: the screen's checkbox is the state
      const cb = first.querySelector('input') as HTMLInputElement; if (cb) { cb.checked = this.selected.has(tr); }
      return;
    }
    if (this.ownSel && first && first.querySelector('input[type=checkbox]')) { first.classList.add('zl-selcell', 'zl-own'); return; }   // v1.40.1: row re-drawn by the screen
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
        // v1.16.0: drag the right edge of a heading to change the column width (saved with the layout / view)
        if (c && !th.querySelector(':scope > .zl-grip')) {
          const g = document.createElement('span'); g.className = 'zl-grip'; g.dataset['zl'] = 'grip';
          g.title = T('Drag to change the column width');
          if (getComputedStyle(th).position === 'static') { th.style.position = 'relative'; }
          th.appendChild(g);
        }
      });
    });
    if (!hr.dataset['zlGrip']) {
      hr.dataset['zlGrip'] = '1';
      hr.addEventListener('mousedown', (ev) => this.startResize(ev));
    }
    hr.onclick = (ev) => {
      const th = (ev.target as HTMLElement).closest('th') as HTMLElement | null;
      if (Date.now() - this.resized < 400 || (ev.target as HTMLElement).closest('.zl-grip')) { return; }
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
        // v1.40.1: the screen's own select-all means every listed row (its handler sets them all), not just the page
        (this.ownSel ? this.visible : this.visible.slice(start, start + this.size)).forEach(r => this.setSel(r.el, all.checked));
        this.render();
        if (this.ownSel) { setTimeout(() => { this.paintBar(); this.paintFootSel(); }, 0); }
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
        <input type="text" class="zl-input" placeholder="${T('Search…')}" aria-label="${T('Search this list')}" autocomplete="off">
        <div class="zl-suggest" hidden></div>
      </div>
      <div class="zl-tools">
        <button type="button" class="zl-btn zl-vwbtn" data-menu="views" title="${T('Saved views: search, filters, group by, sort and columns')}">${ICON['views']}<span>${T('Views')}</span></button>
        <div class="zl-views" role="tablist" aria-label="${T('View')}"></div>
        <button type="button" class="zl-btn" data-menu="filters">${ICON['filter']}<span>${T('Filters')}</span></button>
        <button type="button" class="zl-btn" data-menu="group">${ICON['group']}<span>${T('Group by')}</span></button>
        <button type="button" class="zl-btn" data-menu="columns">${ICON['cols']}<span>${T('Columns')}</span></button>
        <span class="zl-sep"></span>
        <button type="button" class="zl-btn" data-menu="export">${ICON['down']}<span>${T('Export')}</span></button>
        ${/\/report-options\//.test(location.pathname) ? '' : `<button type="button" class="zl-btn" data-menu="import">${ICON['up']}<span>${T('Import')}</span></button>`}
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
    const opts: string[] = [`<button type="button" class="zl-sug on" data-act="search" data-col="-1">${T('Search {0} for:', [`<b>${T('all columns')}</b>`])} <i>${esc(t)}</i></button>`];
    for (const c of this.cols) {
      if (c.skip) { continue; }
      opts.push(`<button type="button" class="zl-sug" data-act="search" data-col="${c.idx}">${T('Search {0} for:', [`<b>${esc(T(c.label))}</b>`])} <i>${esc(t)}</i></button>`);
    }
    if (this.hasEmp) {
      for (const o of orgKeys()) {
        if (!this.cols.some(c => c.org === o.key)) {
          opts.push(`<button type="button" class="zl-sug" data-act="search" data-org="${o.key}">${T('Search {0} for:', [`<b>${esc(T(o.label))}</b>`])} <i>${esc(t)}</i></button>`);
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
      if (c.type === 'search') { body = `<span class="zl-ck">${esc(T(c.label))}</span> ${esc(c.text)}`; }
      if (c.type === 'filter') { body = `<span class="zl-ck">${esc(T(c.label))}</span> ${(c.values || []).map(esc).join(` <span class="zl-or">${T('or')}</span> `)}`; }
      if (c.type === 'date') { body = `<span class="zl-ck">${esc(T(c.label))}</span> ${esc(c.text || '')}`; }
      if (c.type === 'custom') { body = `<span class="zl-ck">${esc(c.label)}</span> ${esc(c.text || '')}`; }
      return `<span class="zl-chip ${c.type}">${body}<button type="button" data-act="chip-x" data-i="${i}" aria-label="${T('Remove')}">${ICON['x']}</button></span>`;
    });
    if (this.groupBy.length) {
      parts.push(`<span class="zl-chip grp"><span class="zl-ck">${T('Group by')}</span> ${this.groupBy.map(g => esc(T(this.facetLabel(g)))).join(' › ')}<button type="button" data-act="chip-x" data-i="-1" aria-label="${T('Remove grouping')}">${ICON['x']}</button></span>`);
    }
    box.innerHTML = parts.join('');
    (this.bar.querySelector('.zl-input') as HTMLInputElement).placeholder = parts.length ? '' : T('Search…');
    const f = this.bar.querySelector('[data-menu=filters]') as HTMLElement;
    const g = this.bar.querySelector('[data-menu=group]') as HTMLElement;
    f.classList.toggle('on', this.chips.some(c => c.type !== 'search'));
    g.classList.toggle('on', this.groupBy.length > 0);
    g.style.display = this.ownGroups ? 'none' : '';  // the screen groups its own rows
    const ex = this.bar.querySelector('[data-menu=export] span') as HTMLElement;
    const n = this.selCount();
    ex.textContent = n ? T('Export {0}', [n]) : T('Export');
    this.paintViewsBtn();
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
    if (kind === 'views') {
      this.fillViews(m);
      if (!this.teamsLoaded) {   // v1.46.0 teams to share a view with
        this.teamsLoaded = true;
        this.sv.groups().subscribe({ next: g => {
          this.teams = g;
          const sel = m.querySelector('[data-vwteam]') as HTMLSelectElement | null;
          if (sel) { sel.innerHTML = `<option value="">${T('– only me –')}</option>` + g.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join(''); }
        }, error: () => { /* older server */ } });
      }
    }
    const r = btn.getBoundingClientRect();
    const w = m.offsetWidth;
    m.style.top = `${r.bottom + window.scrollY + 6}px`;
    // v1.15.0 (langrtl): right-to-left – the menu opens from the button's right edge towards the left
    const x = document.documentElement.dir === 'rtl' ? r.right + window.scrollX - w : r.left + window.scrollX;
    m.style.left = `${Math.max(8, Math.min(x, window.innerWidth - w - 12))}px`;
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
      sections.push(`<div class="zl-sec" data-key="${key}"><div class="zl-sec-h">${esc(T(this.facetLabel(key)))}</div>
        ${many ? `<input class="zl-mini" placeholder="${esc(T('Find {0}…', [T(this.facetLabel(key)).toLowerCase()]))}" data-find>` : ''}
        <div class="zl-opts">${vals.slice(0, 40).map(([v, n]) => `<label class="zl-opt"><input type="checkbox" value="${esc(v)}" ${cur.includes(v.toLowerCase()) ? 'checked' : ''}><span>${esc(v)}</span><em>${n}</em></label>`).join('')}</div></div>`);
    }
    const dateCols = this.cols.filter(c => c.kind === 'date' && !c.skip);
    for (const c of dateCols) {
      sections.push(`<div class="zl-sec" data-date="${c.idx}"><div class="zl-sec-h">${esc(T(c.label))}</div>
        <div class="zl-period">
          <button type="button" data-p="today">${T('Today')}</button><button type="button" data-p="week">${T('This week')}</button>
          <button type="button" data-p="month">${T('This month')}</button><button type="button" data-p="lmonth">${T('Last month')}</button>
          <button type="button" data-p="year">${T('This year')}</button>
        </div>
        <div class="zl-range"><input type="date" data-from aria-label="${T('From')}"><span>${T('to')}</span><input type="date" data-to aria-label="${T('To')}"><button type="button" class="zl-apply" data-range>${T('Apply')}</button></div></div>`);
    }
    const colOpts = this.cols.filter(c => !c.skip).map(c => `<option value="c:${c.idx}">${esc(T(c.label))}</option>`).join('')
      + (this.hasEmp ? orgKeys().filter(o => !this.cols.some(c => c.org === o.key)).map(o => `<option value="o:${o.key}">${esc(T(o.label))}</option>`).join('') : '');
    sections.push(`<div class="zl-sec zl-custom"><div class="zl-sec-h">${T('Custom filter')}</div>
      <div class="zl-cf"><select data-cf-col>${colOpts}</select>
      <select data-cf-op><option value="contains">${T('contains')}</option><option value="not">${T('does not contain')}</option><option value="is">${T('is equal to')}</option>
        <option value="gt">${T('is greater than')}</option><option value="lt">${T('is less than')}</option><option value="set">${T('is set')}</option><option value="empty">${T('is not set')}</option></select>
      <input data-cf-val placeholder="${T('Value')}"><button type="button" class="zl-apply" data-cf>${T('Add')}</button></div></div>`);
    // v1.16.0: favourites became saved views (Views button) – they also keep columns, sort and rows per page
    m.innerHTML = `<div class="zl-menu-scroll">${sections.join('') || `<p class="zl-muted">${T('Nothing to filter yet.')}</p>`}</div>`;
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
      return `<button type="button" class="zl-gopt ${lvl >= 0 ? 'on' : ''}" data-g="${k}"><span>${esc(T(this.facetLabel(k)))}</span>${lvl >= 0 ? `<em>${lvl + 1}</em>` : ''}</button>`;
    });
    m.innerHTML = `<div class="zl-menu-scroll"><div class="zl-sec-h">${T('Group rows by (up to two levels)')}</div>${items.join('') || `<p class="zl-muted">${T('No columns to group by.')}</p>`}
      ${this.groupBy.length ? `<div class="zl-gfoot"><button type="button" class="zl-link" data-g-expand>${T('Expand all')}</button><button type="button" class="zl-link" data-g-collapse>${T('Collapse all')}</button><button type="button" class="zl-link" data-g-clear>${T('Remove grouping')}</button></div>` : ''}</div>`;
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

  /**
   * v1.16.0: what the list shows, ready to export – the visible columns in their order, the filtered and sorted rows,
   * and the group by levels as group rows (name, value, number of rows, subtotals of the number columns). Collapsed
   * groups are exported in full. Screens that draw their own group rows (reports) keep those groups.
   */
  private exportModel(selectedOnly: boolean): XModel {
    // v1.12.0: designer fields not ticked "Export" in the form designer stay out of exports
    const noExport = new Set<string>((this.extra?.fields || []).filter((f: any) => f.show_in_export === false).map((f: any) => f.label));
    const cols = this.cols.filter(c => !c.skip && !this.hideCols.has(c.label) && !noExport.has(c.label));
    const extra = this.hasEmp ? orgKeys().filter(o => !this.cols.some(c => c.org === o.key)) : [];
    const src = selectedOnly ? this.visible.filter(r => this.isSel(r.el)) : this.visible;
    const headers = [...cols.map(c => T(c.label)), ...extra.map(o => T(o.label))];   // v1.15.0: in the user's language
    const cellsOf = (r: Row) => [...cols.map(c => r.cells[c.idx] || ''), ...extra.map(o => (r.emp as any)?.[o.key] || '')];
    // number columns get subtotals – the same columns as the group rows on screen
    const numeric = [...cols.map(c => c.kind === 'number' && !/(^id$|code|phone|mobile|no\.?$|number|year)/i.test(c.label)), ...extra.map(() => false)];
    const sums = (members: Row[]) => numeric.map((isNum, i) => {
      if (!isNum) { return null; }
      const c = cols[i];
      return Math.round(members.reduce((a, x) => a + (num(x.cells[c.idx]) || 0), 0) * 100) / 100;
    });
    const filters = this.chips.map(c => `${T(c.label)} ${c.values ? c.values.join('/') : c.text || ''}`.trim());
    const title = this.title();
    if (this.ownGroups) { return this.ownGroupModel(title, headers, src, cellsOf, sums, filters); }
    if (!this.groupBy.length) {
      return { title, subtitle: filters.join(', '), headers, levels: [], items: src.map(r => ({ cells: cellsOf(r) })) };
    }
    const levels = this.groupBy.map(g => T(this.facetLabel(g)));
    const valsOf = (r: Row) => this.groupBy.map(g => this.facetValue(r, g) || '(none)');
    const members = new Map<string, Row[]>();
    const paths = new Map<Row, string[]>();
    for (const r of src) {
      const v = valsOf(r); paths.set(r, v);
      let p = '';
      v.forEach(x => { p += '\u0001' + x; const l = members.get(p); if (l) { l.push(r); } else { members.set(p, [r]); } });
    }
    const items: XItem[] = [];
    let last: string[] = [];
    for (const r of src) {
      const v = paths.get(r)!;
      let p = '';
      let changed = false;
      v.forEach((x, lvl) => {
        p += '\u0001' + x;
        if (changed || last[lvl] !== x) {
          changed = true;
          const m = members.get(p) || [];
          items.push({ group: { level: lvl, field: levels[lvl], value: x, count: m.length, sums: sums(m) } });
        }
      });
      last = v;
      items.push({ cells: cellsOf(r), path: v });
    }
    const subtitle = [...filters, T('Grouped by {0}', [levels.join(' › ')])].join(', ');
    return { title, subtitle, headers, levels, items };
  }

  /** v1.16.0: the list as CSV text, exactly as an export (report centre "E-mail me"); null before the list is ready. */
  csvNow(): { text: string; rows: number } | null {
    if (!this.active || !this.cols.length) { return null; }
    const c = modelCsv(this.exportModel(false));
    return { text: csvText(c.headers, c.rows), rows: c.rows.length };
  }

  /** Reports with their own group rows: those rows become the groups of the export. */
  private ownGroupModel(title: string, headers: string[], src: Row[], cellsOf: (r: Row) => string[], sums: (m: Row[]) => (number | null)[], filters: string[]): XModel {
    const want = new Set(src.map(r => r.el));
    const byEl = new Map(this.rows.map(r => [r.el, r] as [HTMLTableRowElement, Row]));
    const items: XItem[] = [];
    let cur: { label: string; members: Row[]; item: XItem | null } | null = null;
    const close = () => { if (cur?.item) { cur.item.group!.count = cur.members.length; cur.item.group!.sums = sums(cur.members); } };
    const hr = this.headRow();
    for (const tb of this.bodies()) {
      for (const tr of this.bodyRows(tb)) {
        if (tr === hr || tr.dataset['zl'] !== undefined || tr.classList.contains('zl-placeholder')) { continue; }
        const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell'));
        if (cells.length === 1 && (cells[0] as HTMLTableCellElement).colSpan > 1) {
          close();
          cur = { label: this.cellText(cells[0] as HTMLElement), members: [], item: null };
          continue;
        }
        const r = byEl.get(tr);
        if (!r || !want.has(tr)) { continue; }
        if (cur && !cur.item) { cur.item = { group: { level: 0, field: T('Group'), value: cur.label, count: 0, sums: [] } }; items.push(cur.item); }
        cur?.members.push(r);
        items.push({ cells: cellsOf(r), path: cur ? [cur.label] : [''] });
      }
    }
    close();
    if (!items.some(i => i.group)) { return { title, subtitle: filters.join(', '), headers, levels: [], items: src.map(r => ({ cells: cellsOf(r) })) }; }
    return { title, subtitle: [...filters, T('Grouped by {0}', [T('Group')])].join(', '), headers, levels: [T('Group')], items };
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
    const grouped = (this.groupBy.length > 0 && !this.ownGroups) ? this.groupBy.map(g => T(this.facetLabel(g))).join(' › ') : '';
    m.innerHTML = `<div class="zl-sec-h">${n ? T('Export {0} selected rows', [n]) : this.chips.length ? T('Export {0} rows (filtered)', [total]) : T('Export {0} rows', [total])}</div>
      ${grouped ? `<p class="zl-muted zl-xnote">${T('Grouped by {0}: the file has a row per group with the count and subtotals.', [esc(grouped)])}</p>` : ''}
      <button type="button" class="zl-item" data-x="xlsx"><b>Excel</b><span>${T('.xlsx – opens in Excel, numbers stay numbers')}</span></button>
      <button type="button" class="zl-item" data-x="csv"><b>CSV</b><span>${T('.csv – for other systems (UTF-8)')}</span></button>
      <button type="button" class="zl-item" data-x="pdf"><b>PDF</b><span>${T('.pdf – ready to print or e-mail')}</span></button>`;
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-x]') as HTMLElement | null;
      if (!b) { return; }
      this.runExport(b.dataset['x'] as 'xlsx' | 'csv' | 'pdf', n > 0);
      this.closeMenu();
    });
  }

  /** v1.16.0: Excel / CSV / PDF of exactly what the list shows (grouping included). */
  private runExport(kind: 'xlsx' | 'csv' | 'pdf', selectedOnly: boolean): void {
    const model = this.exportModel(selectedOnly);
    const fail = () => this.toast('The file could not be made. Try again.', true);
    try {
      if (kind === 'xlsx') { exportModelExcel(model).catch(fail); }
      if (kind === 'csv') { exportModelCsv(model); }
      if (kind === 'pdf') { exportModelPdf(model).catch(fail); }
    } catch { fail(); }
  }

  private ownImportButton(): HTMLElement | null {
    const sec = this.anchor.closest('.comapny_section, .container, .hr-page') || this.anchor.parentElement!;
    const btns = Array.from(sec.querySelectorAll('button, a')) as HTMLElement[];
    return btns.find(b => !b.closest('[data-zl]') && !b.closest('.modal, .modal-content, mat-dialog-container')
      && /^\s*(\S+\s+)?(import|bulk upload|upload)\s*$/i.test(i18nOriginal(b).replace(/system_update_alt|sync_alt|upload_file|file_upload|cloud_upload/g, '').replace(/\s+/g, ' ').trim())) || null;
  }

  private fillImport(m: HTMLElement): void {
    if (!this.endpoint) { this.endpoint = this.z.endpointFor(this.rows.map(r => r.raw)); }   // v1.62.0 ui raw
    const own = this.ownImportButton();
    const parts: string[] = [];
    if (this.endpoint) {
      parts.push(`<div class="zl-sec-h">${T('Import into this list')}</div>
        <button type="button" class="zl-item" data-i="tpl-xlsx"><b>${T('Download template (Excel)')}</b><span>${T('Columns of this screen, with a "How to fill" sheet')}</span></button>
        <button type="button" class="zl-item" data-i="tpl-csv"><b>${T('Download template (CSV)')}</b><span>${T('Same columns as plain CSV')}</span></button>
        <button type="button" class="zl-item" data-i="upload"><b>${T('Import a file…')}</b><span>${T('Excel or CSV – rows are checked before anything is saved')}</span></button>`);
    }
    const std = this.standardKind();
    if (std) { parts.push(`<button type="button" class="zl-item" data-i="std"><b>${T('Load the standard list…')}</b><span>${T('Adds the usual UAE {0}s that are missing; nothing is changed or removed', [std])}</span></button>`); }
    if (own) { parts.push(`<button type="button" class="zl-item" data-i="own"><b>${T("This screen's own upload")}</b><span>${T('Opens the existing bulk upload of this screen')}</span></button>`); }
    if (!parts.length) { parts.push(`<p class="zl-muted">${T('This list is filled by the system (for example from requests or payroll), so it cannot be imported here.')}</p>`); }
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
    modal.innerHTML = `<div class="zl-dialog" role="dialog" aria-modal="true" aria-label="${T('Import')}">
      <div class="zl-dh"><h3>${T('Import – {0}', [esc(this.title())])}</h3><button type="button" class="zl-x" data-close aria-label="${T('Close')}">${ICON['x']}</button></div>
      <div class="zl-db">
        <p class="zl-muted">${T('Use the template from this screen. Linked columns (branch, department, employee …) take the code or the name. Nothing is saved until you press Import.')}</p>
        <label class="zl-drop"><input type="file" accept=".xlsx,.xls,.csv"><span>${T('Choose an Excel or CSV file')}</span></label>
        <div class="zl-result"></div>
      </div>
      <div class="zl-df"><button type="button" class="zl-btn" data-tpl>${T('Download template')}</button><span class="zl-grow"></span>
        <button type="button" class="zl-btn" data-close>${T('Cancel')}</button><button type="button" class="zl-btn primary" data-go disabled>${T('Import')}</button></div>
    </div>`;
    document.body.appendChild(modal);
    // v1.52.0: the columns can be matched by hand, the matching is remembered for the same file layout, and an import can be undone
    let ready: any[] = [];
    let sheet: { headers: string[]; rows: any[] } = { headers: [], rows: [] };
    let fields: any[] = [];
    let fileName = '';
    const map = new Map<string, string>();
    let remembered = false;
    const res = modal.querySelector('.zl-result') as HTMLElement;
    const go = modal.querySelector('[data-go]') as HTMLButtonElement;
    let imported = false;   // v1.37.1: the list reloads however the window is closed (X, outside click, Escape) once rows were imported
    const close = () => { modal.remove(); if (imported) { location.reload(); } };
    const mapping = () => { const o: any = {}; sheet.headers.forEach(h => { o[h] = map.get(h) || ''; }); return o; };
    const buildRows = () => sheet.rows.map(r => { const o: any = {}; map.forEach((k, h) => { if (k) { o[k] = r[h]; } }); return o; });
    const mapTable = () => {
      const opts = (h: string) => `<option value="">${T('– not imported –')}</option>` + fields.map(f =>
        `<option value="${esc(f.key)}"${map.get(h) === f.key ? ' selected' : ''}>${esc(f.label)}${f.required ? ' *' : ''}</option>`).join('');
      return `<details class="zl-map"${remembered || [...map.values()].some(v => !v) ? ' open' : ''}><summary>${T('Columns of the file')}${remembered ? ' – ' + T('matched as last time') : ''}</summary>
        <table class="zl-ptable" zPlain><thead><tr><th>${T('Column in the file')}</th><th>${T('Field')}</th></tr></thead><tbody>${sheet.headers.map((h, i) =>
          `<tr><td>${esc(h)}</td><td><select data-map="${i}" aria-label="${esc(h)}">${opts(h)}</select></td></tr>`).join('')}</tbody></table></details>`;
    };
    const check = () => {
      const missing = fields.filter(f => f.required && ![...map.values()].includes(f.key));
      if (![...map.values()].some(v => v)) { res.innerHTML = `<div class="zl-sum bad">${T('None of the columns match this screen. Choose the field of each column below, or download the template.')}</div>${mapTable()}`; go.disabled = true; return; }
      const rows = buildRows();
      if (!rows.length) { res.innerHTML = `<div class="zl-sum bad">${T('The file has no data rows.')}</div>`; return; }
      go.disabled = true; ready = [];
      this.z.importRows(this.endpoint!, rows, true).subscribe({
        next: (r: any) => {
          const bad = (r.results || []).filter((x: any) => !x.ok);
          ready = (r.results || []).filter((x: any) => x.ok).map((x: any) => rows[x.row - 1]);
          res.innerHTML = `<div class="zl-sum ${bad.length ? 'warn' : 'ok'}">${bad.length ? T('{0} rows ready · {1} rows need fixing (they will be skipped).', [`<b>${r.ok}</b>`, `<b>${bad.length}</b>`]) : T('{0} rows ready.', [`<b>${r.ok}</b>`])}</div>
            ${missing.length ? `<p class="zl-warn">${T('Required columns not in the file: {0}', [missing.map(m2 => esc(m2.label)).join(', ')])}</p>` : ''}
            ${mapTable()}${this.problemTable(bad)}`;
          go.disabled = !ready.length; go.textContent = ready.length ? T('Import {0} rows', [ready.length]) : T('Import');
        },
        error: (err: any) => { res.innerHTML = `<div class="zl-sum bad">${esc(err?.error?.detail || T('The file could not be checked.'))}</div>${mapTable()}`; },
      });
    };
    modal.addEventListener('change', (e) => {
      const sel = (e.target as HTMLElement).closest('select[data-map]') as HTMLSelectElement | null;
      if (!sel) { return; }
      const h = sheet.headers[Number(sel.dataset['map'])];
      if (sel.value) { map.forEach((k, hh) => { if (k === sel.value && hh !== h) { map.set(hh, ''); } }); }   // one column per field
      map.set(h, sel.value); remembered = false; check();
    });
    modal.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t === modal || t.closest('[data-close]')) { close(); return; }
      if (t.closest('[data-tpl]')) { this.downloadTemplate(false); return; }
      const ub = t.closest('[data-undo-import]') as HTMLButtonElement | null;
      if (ub) {
        if (!confirm(T('Undo this import? The records it created are deleted.'))) { return; }
        ub.disabled = true;
        this.z.undoImport(Number(ub.dataset['undoImport'])).subscribe({
          next: (u: any) => { ub.replaceWith(Object.assign(document.createElement('div'), { className: 'zl-sum warn', textContent: T('Undone: {0} records deleted.', [u.deleted]) + (u.kept?.length ? ' ' + T('{0} kept – they are used by other records.', [u.kept.length]) : '') })); },
          error: (err: any) => { ub.disabled = false; this.toast(err?.error?.detail || T('It could not be undone.'), true); },
        });
        return;
      }
      if (t.closest('[data-go]') && ready.length) {
        go.disabled = true; go.textContent = T('Importing…');
        this.z.importRows(this.endpoint!, ready, false, { headers: sheet.headers, mapping: mapping(), file_name: fileName, label: this.title() }).subscribe({
          next: (r: any) => {
            const bad = (r.results || []).filter((x: any) => !x.ok);
            res.innerHTML = `<div class="zl-sum ok">${T('{0} of {1} rows imported.', [r.ok, r.total])}</div>${this.problemTable(bad)}
              ${r.batch && r.ok ? `<p><button type="button" class="zl-btn" data-undo-import="${r.batch}">${T('Undo this import')}</button>
                <span class="zl-muted">${T('Also later under Settings › Import history.')}</span></p>` : ''}
              <p class="zl-muted">${T('The list refreshes when you close this window.')}</p>`;
            go.textContent = T('Imported'); ready = []; imported = true;
          },
          error: (err: any) => { res.innerHTML = `<div class="zl-sum bad">${esc(err?.error?.detail || T('Import failed.'))}</div>`; go.textContent = T('Import'); go.disabled = false; },
        });
      }
    });
    (modal.querySelector('input[type=file]') as HTMLInputElement).addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { return; }
      fileName = file.name;
      (modal.querySelector('.zl-drop span') as HTMLElement).textContent = file.name;
      res.innerHTML = `<p class="zl-muted">${T('Checking the file…')}</p>`; go.disabled = true; ready = [];
      try {
        [fields, sheet] = await Promise.all([this.loadFields(), readSheet(file)]);
        map.clear(); remembered = false;
        let saved: any = null;
        try { saved = (await firstValueFrom(this.z.importMapping(this.endpoint!, sheet.headers)))?.mapping; } catch { saved = null; }
        const norm = (s: string) => s.toLowerCase().replace(/\*/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
        for (const h of sheet.headers) {
          if (saved && h in saved && (saved[h] === '' || fields.some(f => f.key === saved[h]))) { map.set(h, saved[h]); remembered = true; continue; }
          const f = fields.find(x => norm(x.label) === norm(h) || norm(x.key) === norm(h));
          map.set(h, f ? f.key : '');
        }
        check();
      } catch (err: any) {
        res.innerHTML = `<div class="zl-sum bad">${esc(typeof err === 'string' ? err : err?.message || T('The file could not be read.'))}</div>`;
      }
    });
  }

  private problemTable(bad: any[]): string {
    if (!bad.length) { return ''; }
    return `<table class="zl-ptable" zPlain><thead><tr><th>${T('Row')}</th><th>${T('What to fix')}</th></tr></thead><tbody>${bad.slice(0, 200).map(b =>
      `<tr><td>${b.row + 1}</td><td>${(b.errors || []).map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>`;
  }

  private toast(msg: string, bad = false): void {
    const t = document.createElement('div');
    t.className = 'zl-toast' + (bad ? ' bad' : ''); t.textContent = T(msg);
    document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
  }

  // ------------------------------------------------------------------ footer
  private buildFoot(): void {
    const f = document.createElement('div');
    f.className = 'zl-foot'; f.dataset['zl'] = 'foot';
    f.innerHTML = `
      <label class="zl-selall"><input type="checkbox" data-selall><span>${T('Select all')}</span></label>
      <span class="zl-selinfo"></span>
      <span class="zl-grow"></span>
      <label class="zl-size">${T('Rows per page')} <select data-size>${SIZES.map(s => `<option value="${s}">${s}</option>`).join('')}</select></label>
      <span class="zl-range-t"></span>
      <button type="button" class="zl-pg" data-pg="-1" aria-label="${T('Previous page')}">${ICON['prev']}</button>
      <button type="button" class="zl-pg" data-pg="1" aria-label="${T('Next page')}">${ICON['next']}</button>`;
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
        this.visible.forEach(r => this.setSel(r.el, on));
        this.render();
      }
    });
    f.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('[data-pg],[data-act]') as HTMLElement | null;
      if (!b) { return; }
      if (b.dataset['pg']) { this.page += Number(b.dataset['pg']); this.render(); this.anchor.scrollIntoView({ block: 'nearest' }); }
      if (b.dataset['act'] === 'unselect') { this.rows.forEach(r => this.setSel(r.el, false)); this.render(); }
      if (b.dataset['act'] === 'exportsel') { this.openMenu('export', this.bar!.querySelector('[data-menu=export]') as HTMLElement); }
      if (b.dataset['act'] === 'mass') { this.openMass(); }   // v1.45.0
    });
    // row checkboxes + group toggles + "clear filters" (delegated on the table)
    this.table.addEventListener('change', (e) => {
      const cb = e.target as HTMLInputElement;
      const cell = cb.closest('td.zl-selcell');
      if (!cell) { return; }
      const tr = cell.parentElement as HTMLTableRowElement;
      if (!cell.classList.contains('zl-own')) { cb.checked ? this.selected.add(tr) : this.selected.delete(tr); }   // v1.40.1 own column: the checkbox is the state
      tr.classList.toggle('zl-picked', cb.checked);
      this.paintBar(); this.paintFootSel();
    });
    this.table.addEventListener('dblclick', (e) => {   // v1.46.0 edit a cell in the list
      if (!this.inline) { return; }
      const td = (e.target as HTMLElement).closest('td') as HTMLTableCellElement | null;
      if (td && td.closest('tbody') && !td.closest('[data-zl]')) { e.preventDefault(); e.stopPropagation(); this.startEdit(td); }
    }, true);
    this.table.addEventListener('click', (e) => {
      // v1.40.1: the screen's own row checkbox (mat-checkbox stops the change event) – the state is read after the click
      const own = (e.target as HTMLElement).closest('td.zl-own');
      if (own) { setTimeout(() => { const tr = own.parentElement as HTMLTableRowElement; tr.classList.toggle('zl-picked', this.isSel(tr)); this.paintBar(); this.paintFootSel(); }, 0); }
      const b = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!b || !b.closest('[data-zl]')) { return; }
      if (b.dataset['act'] === 'toggle') { const p = b.dataset['path']!; this.collapsed.has(p) ? this.collapsed.delete(p) : this.collapsed.add(p); this.render(); }
      if (b.dataset['act'] === 'clear') { this.chips = []; this.page = 1; this.render(); }
    });
  }

  private selCount(): number { return this.rows.filter(r => this.isSel(r.el)).length; }

  private paintFootSel(): void {
    if (!this.foot) { return; }
    const n = this.selCount();
    const info = this.foot.querySelector('.zl-selinfo') as HTMLElement;
    info.innerHTML = n ? `${T('{0} selected', [`<b>${n}</b>`])} <button type="button" class="zl-btn primary zl-massbtn" data-act="mass">${T('Action')} ▾</button><button type="button" class="zl-link" data-act="exportsel">${T('Export')}</button><button type="button" class="zl-link" data-act="unselect">${T('Clear')}</button>` : '';
    const all = this.foot.querySelector('[data-selall]') as HTMLInputElement;
    all.checked = n > 0 && n >= this.visible.length;
    all.indeterminate = n > 0 && n < this.visible.length;
    (this.foot.querySelector('.zl-selall span') as HTMLElement).textContent = this.visible.length ? T('Select all {0}', [this.visible.length]) : T('Select all');
  }

  private paintFoot(total: number, from: number, to: number, pages: number): void {
    if (!this.foot) { return; }
    const groups = this.groupBy.length ? new Set(this.visible.map(r => this.facetValue(r, this.groupBy[0]) || '(none)')).size : 0;
    (this.foot.querySelector('.zl-range-t') as HTMLElement).textContent = this.groupBy.length
      ? T('{0} groups · {1} rows', [groups, total])
      : total ? T('{0}–{1} of {2}', [from + 1, to, total]) + (total !== this.rows.length ? ' ' + T('({0} in list)', [this.rows.length]) : '') : T('0 of {0}', [this.rows.length]);
    (this.foot.querySelector('[data-pg="-1"]') as HTMLButtonElement).disabled = this.page <= 1;
    (this.foot.querySelector('[data-pg="1"]') as HTMLButtonElement).disabled = this.page >= pages;
    (this.foot.querySelector('[data-size]') as HTMLSelectElement).value = String(this.size);
    this.paintFootSel();
    const hp = this.headRow()?.querySelector('th.zl-selcell input') as HTMLInputElement | null;
    if (hp) {
      const start = (this.page - 1) * this.size;
      const pageRows = this.visible.slice(start, start + this.size);
      hp.checked = pageRows.length > 0 && pageRows.every(r => this.isSel(r.el));
    }
  }

  // ------------------------------------------------------------------ the screen's own search / pager
  // ------------------------------------------------------------------ v1.7.0: layout (columns + view), saved per user
  private loadLayout(): void {
    const idx = Array.from(document.querySelectorAll('table.zl-table')).indexOf(this.table);
    this.layoutKey = location.pathname + '|' + Math.max(0, idx);
    try { const c = JSON.parse(localStorage.getItem('zl-layout:' + this.layoutKey) || 'null'); if (c) { this.useLayout(c); } } catch { /* storage off */ }
    this.subs.push(this.rec.layout('list', this.layoutKey).subscribe({
      next: d => { if (d && Object.keys(d).length && !this.applied) { this.rekey(() => this.useLayout(d)); } else if (d?.fav) { this.useLayout(d); this.migrateFavs(); } },
      error: () => { /* keep defaults */ },
    }));
  }

  private useLayout(d: any): void {
    if (Array.isArray(d.fav) && d.fav.length) { this.legacyFavs = d.fav.filter((f: any) => f && f.name && Array.isArray(f.chips)); }
    if (this.applied) { return; }   // v1.16.0: a saved view is in use
    if (d.view && VIEW_LABEL[d.view as ViewKind]) { this.view = d.view; }
    if (d.vst) { this.vst = d.vst; }
    this.hideCols = new Set(Array.isArray(d.hide) ? d.hide : []);
    if (Array.isArray(d.order)) { this.order = d.order.filter((x: any) => typeof x === 'string'); }
    if (d.widths && typeof d.widths === 'object') { this.widths = { ...d.widths }; }
    this.totals = typeof d.totals === 'string' ? d.totals : '';
    this.rules = Array.isArray(d.rules) ? d.rules.filter((r: any) => r && r.col && r.op) : [];
    this.inline = !!d.inline;
    this.table.classList.toggle('zl-inline', this.inline);
    this.hasLayout = true;
  }

  private saveLayout(): void {
    const data: any = { view: this.view, vst: this.vst, hide: [...this.hideCols], order: this.order, widths: this.widths,
                        totals: this.totals, rules: this.rules, inline: this.inline };   // v1.46.0
    if (this.legacyFavs.length) { data.fav = this.legacyFavs; }
    try { localStorage.setItem('zl-layout:' + this.layoutKey, JSON.stringify(data)); } catch { /* ignore */ }
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.rec.saveLayout('list', this.layoutKey, data).subscribe({ error: () => { /* offline */ } }), 800);
    this.paintViewsBtn();
  }

  private fillColumns(m: HTMLElement): void {
    const movable = this.canOrder();
    const paint = () => {
      const cols = this.cols.filter(c => c.label);
      m.innerHTML = `<div class="zl-sec-h">${T('Columns')}${movable ? ` <span class="zl-hint">${T('– use the arrows to move a column, drag a heading edge to resize')}</span>` : ''}</div>
      <div class="zl-colist">${cols.map((c, i) => `<div class="zl-colrow"><label class="zl-check"><input type="checkbox" data-col="${esc(c.label)}" ${this.hideCols.has(c.label) ? '' : 'checked'}> ${esc(T(c.label))}</label>${movable ? `<span class="zl-mv">
        <button type="button" data-mv="-1" data-mvcol="${esc(c.label)}" aria-label="${esc(T('Move {0} up', [T(c.label)]))}" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-mv="1" data-mvcol="${esc(c.label)}" aria-label="${esc(T('Move {0} down', [T(c.label)]))}" ${i === cols.length - 1 ? 'disabled' : ''}>▼</button></span>` : ''}</div>`).join('')}</div>
      <div class="zl-sec-h">${T('Totals row')}</div>
      <select class="zl-sel" data-totals><option value="">${T('No totals')}</option><option value="sum" ${this.totals === 'sum' ? 'selected' : ''}>${T('Sum of the number columns')}</option>
        <option value="avg" ${this.totals === 'avg' ? 'selected' : ''}>${T('Average')}</option><option value="both" ${this.totals === 'both' ? 'selected' : ''}>${T('Sum and average')}</option></select>
      <div class="zl-sec-h">${T('Colour rules')}</div>
      <div class="zl-rules">${this.rules.map((r, i) => `<div class="zl-rule"><span class="zl-sw zl-cc-${esc(r.color)}"></span>${esc(T(r.col))} ${esc(OPS[r.op] || r.op)} ${esc(r.value || '')} <small class="zl-muted">(${r.scope === 'cell' ? T('cell') : T('row')})</small>
        <button type="button" class="zl-link" data-rdel="${i}" aria-label="${T('Remove rule')}">×</button></div>`).join('') || `<p class="zl-muted">${T('Colour rows or cells, e.g. expiry date passed → red.')}</p>`}</div>
      <div class="zl-ruleadd"><select data-rcol>${cols.map(c => `<option value="${esc(c.label)}">${esc(T(c.label))}</option>`).join('')}</select>
        <select data-rop>${Object.entries(OPS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select>
        <input data-rval placeholder="${T('value')}" size="8">
        <select data-rcolor><option value="red">${T('Red')}</option><option value="amber">${T('Amber')}</option><option value="green">${T('Green')}</option><option value="blue">${T('Blue')}</option><option value="grey">${T('Grey')}</option></select>
        <select data-rscope><option value="row">${T('whole row')}</option><option value="cell">${T('the cell')}</option></select>
        <button type="button" class="zl-apply" data-radd>${T('Add')}</button></div>
      <label class="zl-check zl-inl"><input type="checkbox" data-inline ${this.inline ? 'checked' : ''}> ${T('Edit cells in the list (double-click a cell; Enter saves, Esc cancels)')}</label>
      <div class="zl-mfoot"><button type="button" class="zl-link" data-all>${T('Show all')}</button>${movable || Object.keys(this.widths).length ? `<button type="button" class="zl-link" data-colreset>${T('Original order and widths')}</button>` : ''}<span class="zl-grow"></span><span class="zl-muted">${T('Saved for you on this screen')}</span></div>`;
    };
    paint();
    m.addEventListener('change', (e) => {
      const cb = e.target as HTMLInputElement; const lab = cb.dataset['col'];
      if (cb.hasAttribute('data-totals')) { this.totals = (cb as any).value; this.saveLayout(); this.render(); return; }   // v1.46.0
      if (cb.hasAttribute('data-inline')) { this.inline = cb.checked; this.saveLayout(); this.table.classList.toggle('zl-inline', this.inline); return; }
      if (!lab) { return; }
      cb.checked ? this.hideCols.delete(lab) : this.hideCols.add(lab);
      if (this.cols.filter(c => c.label && !this.hideCols.has(c.label)).length === 0) { this.hideCols.delete(lab); cb.checked = true; }
      this.saveLayout(); this.applyColumns();
    });
    m.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-all]')) { this.hideCols.clear(); this.saveLayout(); this.applyColumns(); m.querySelectorAll('input').forEach(i => (i as HTMLInputElement).checked = true); }
      const mv = t.closest('[data-mv]') as HTMLElement | null;
      if (mv) {
        const labels = this.cols.map(c => c.label);
        const i = labels.indexOf(mv.dataset['mvcol'] || ''), j = i + Number(mv.dataset['mv']);
        if (i < 0 || j < 0 || j >= labels.length) { return; }
        [labels[i], labels[j]] = [labels[j], labels[i]];
        this.rekey(() => { this.order = labels; });
        this.saveLayout(); paint();
        (m.querySelector(`[data-mvcol="${CSS.escape(labels[j])}"][data-mv="${mv.dataset['mv']}"]`) as HTMLElement | null)?.focus();
      }
      if (t.closest('[data-colreset]')) { this.widths = {}; this.rekey(() => { this.order = []; }); this.saveLayout(); paint(); }
      if (t.closest('[data-radd]')) {   // v1.46.0 colour rule
        const g = (k: string) => (m.querySelector(`[data-${k}]`) as HTMLInputElement).value;
        this.rules = [...this.rules, { col: g('rcol'), op: g('rop'), value: g('rval'), color: g('rcolor'), scope: g('rscope') as any }];
        this.saveLayout(); this.paintRules(); paint();
      }
      const del = t.closest('[data-rdel]') as HTMLElement | null;
      if (del) { this.rules = this.rules.filter((_, i) => i !== Number(del.dataset['rdel'])); this.saveLayout(); this.paintRules(); paint(); }
    });
  }

  private applyColumns(): void {
    const hide = new Set(this.cols.filter(c => this.hideCols.has(c.label)).map(c => c.idx));
    this.quiet(() => {
      const hr = this.headRow();
      if (hr) {
        this.headCells().forEach((th, i) => {
          th.classList.toggle('zl-colhide', hide.has(i));
          // v1.16.0: saved column widths
          const w = this.widths[this.cols[i]?.label];
          if (w) { th.style.width = th.style.minWidth = w + 'px'; th.dataset['zw'] = '1'; } else if (th.dataset['zw']) { th.style.width = th.style.minWidth = ''; delete th.dataset['zw']; }
        });
      }
      for (const r of this.rows) {
        Array.from(r.el.cells).filter(c => !c.classList.contains('zl-selcell')).forEach((td, i) => td.classList.toggle('zl-colhide', hide.has(i)));
      }
    });
    const b = this.bar?.querySelector('[data-menu=columns]') as HTMLElement | null;
    if (b) { b.classList.toggle('on', hide.size > 0); (b.querySelector('span') as HTMLElement).textContent = hide.size ? T('Columns ({0} hidden)', [hide.size]) : T('Columns'); }
  }

  // ------------------------------------------------------------------ v1.16.0: column order and widths
  /** Columns can be moved on plain tables only (one heading row, no merged headings, one body per table). */
  private canOrder(): boolean {
    const hr = this.headRow();
    if (!hr || this.multi) { return false; }
    const th = this.table.tHead;
    if (th && th.rows.length > 1) { return false; }
    return !this.headCells().some(c => c.colSpan > 1);
  }

  /** Puts the cells of the heading and of every row in the user's column order (cells keep a key: data-zo). */
  private applyOrder(): void {
    if (!this.canOrder()) { return; }
    const hr = this.headRow()!;
    const heads = this.headCells() as HTMLElement[];
    if (!this.order.length && !heads.some(h => h.dataset['zo'] !== undefined && !h.dataset['zo'].startsWith('x'))) { return; }
    const tag = (cells: HTMLElement[]) => {
      if (cells.filter(c => !(c.dataset['zo'] || '').startsWith('x')).every(c => c.dataset['zo'] === undefined)) {
        cells.forEach((c, i) => { if (c.dataset['zo'] === undefined) { c.dataset['zo'] = String(i); } });
      }
    };
    tag(heads);
    const natural = (k: string) => k.startsWith('x') ? 500 + Number(k.slice(1)) : Number(k);
    const rank = new Map<string, number>();
    heads.forEach(h => {
      const k = h.dataset['zo'] || '';
      const at = this.order.indexOf(this.labelOf(h));
      rank.set(k, at >= 0 ? at : 1000 + natural(k));
    });
    const sortRow = (tr: HTMLTableRowElement, head: boolean) => {
      const cells = Array.from(tr.cells).filter(c => !c.classList.contains('zl-selcell')) as HTMLElement[];
      if (cells.length !== heads.length) { return; }
      if (!head) { tag(cells); }
      const want = cells.slice().sort((a, b) => (rank.get(a.dataset['zo'] ?? '') ?? 9999) - (rank.get(b.dataset['zo'] ?? '') ?? 9999));
      if (want.every((c, i) => c === cells[i])) { return; }
      const after = cells[cells.length - 1].nextSibling;
      want.forEach(c => tr.insertBefore(c, after));
    };
    sortRow(hr, true);
    for (const tb of this.bodies()) {
      for (const tr of this.bodyRows(tb)) { if (tr !== hr && tr.dataset['zl'] === undefined) { sortRow(tr, false); } }
    }
  }

  private resized = 0;

  private startResize(ev: MouseEvent): void {
    const grip = (ev.target as HTMLElement).closest('.zl-grip') as HTMLElement | null;
    if (!grip || ev.button !== 0) { return; }
    ev.preventDefault(); ev.stopPropagation();
    const th = grip.parentElement as HTMLElement;
    const idx = this.headCells().indexOf(th as HTMLTableCellElement);
    const label = this.cols[idx]?.label;
    if (!label) { return; }
    const x0 = ev.clientX, w0 = th.getBoundingClientRect().width;
    const rtl = document.documentElement.dir === 'rtl';
    let w = w0;
    const move = (e: MouseEvent) => {
      w = Math.max(40, Math.min(1200, Math.round(w0 + (e.clientX - x0) * (rtl ? -1 : 1))));
      this.quiet(() => { th.style.width = th.style.minWidth = w + 'px'; th.dataset['zw'] = '1'; });
    };
    const up = () => {
      document.removeEventListener('mousemove', move, true); document.removeEventListener('mouseup', up, true);
      this.resized = Date.now();
      if (Math.abs(w - w0) >= 2) { this.widths[label] = w; this.saveLayout(); }
    };
    document.addEventListener('mousemove', move, true); document.addEventListener('mouseup', up, true);
  }

  /** Change something that moves columns, keeping filters, grouping and sort on the same columns (by name). */
  private rekey(change: () => void): void {
    const st = { chips: this.chips.map(c => this.chipToRef(c)), groupBy: this.groupBy.map(k => this.keyToRef(k)), sort: this.sortRef() };
    change();
    this.scan();
    this.chips = st.chips.map(c => this.refToChip(c)).filter((c): c is Chip => !!c);
    this.groupBy = st.groupBy.map(k => this.refToKey(k)).filter((k): k is string => !!k);
    this.sort = this.sortFromRef(st.sort);
    this.paintHead();
    this.render();
  }

  private keyToRef(k: string): string {
    const m = k.match(/^([cm]):(\d+)$/);
    if (!m) { return k; }
    const c = this.cols[+m[2]];
    return c ? `${m[1]}@${c.label}` : k;
  }

  private refToKey(r: string): string | null {
    if (!r) { return null; }
    const m = r.match(/^([cm])@(.*)$/s);
    if (m) { const c = this.cols.find(x => x.label === m[2]); return c ? `${m[1]}:${c.idx}` : null; }
    if (/^[cm]:\d+$/.test(r)) { return this.cols[+r.slice(2)] ? r : null; }   // v1.8.0 favourites
    if (r.startsWith('o:')) { return r; }
    return null;
  }

  private chipToRef(c: Chip): any {
    const o: any = JSON.parse(JSON.stringify(c));
    o.key = c.key === 'all' ? 'all' : this.keyToRef(c.key);
    if (typeof c.col === 'number' && c.col >= 0 && this.cols[c.col]) { o.colRef = this.cols[c.col].label; }
    delete o.col;
    return o;
  }

  private refToChip(o: any): Chip | null {
    if (!o || typeof o !== 'object' || !['search', 'filter', 'custom', 'date'].includes(o.type)) { return null; }
    const c: Chip = { ...o };
    delete (c as any).colRef;
    if (o.key !== 'all') { const k = this.refToKey(o.key); if (!k) { return null; } c.key = k; }
    if (o.colRef !== undefined) {
      const idx = this.cols.findIndex(x => x.label === o.colRef);
      if (idx < 0) { return null; }
      c.col = idx;
    } else if (typeof o.col !== 'number') { c.col = c.type === 'search' ? -1 : 0; }
    return c;
  }

  private sortRef(): { col: string; dir: 1 | -1 } | null {
    return this.sort && this.cols[this.sort.idx] ? { col: this.cols[this.sort.idx].label, dir: this.sort.dir } : null;
  }

  private sortFromRef(s: { col: string; dir: 1 | -1 } | null | undefined): { idx: number; dir: 1 | -1 } | null {
    if (!s) { return null; }
    const idx = this.cols.findIndex(c => c.label === s.col);
    return idx >= 0 && !this.cols[idx].skip ? { idx, dir: s.dir === -1 ? -1 : 1 } : null;
  }

  // ------------------------------------------------------------------ v1.16.0: saved views
  /** Everything the user set up on this list, with columns named (not numbered). */
  private currentState(): ViewData {
    return {
      v: 1,
      chips: this.chips.map(c => this.chipToRef(c)),
      groupBy: this.groupBy.map(k => this.keyToRef(k)),
      sort: this.sortRef(),
      columns: { order: this.order.length ? this.cols.map(c => c.label) : [], hide: [...this.hideCols], widths: { ...this.widths } },
      totals: this.totals, rules: this.rules,
      size: this.size,
      view: this.view,
      vst: this.vst,
      collapsed: [...this.collapsed],
    };
  }

  private applyState(d: ViewData, remember = true): void {
    const cols = d.columns || {};
    this.hideCols = new Set(Array.isArray(cols.hide) ? cols.hide : []);
    this.widths = cols.widths && typeof cols.widths === 'object' ? { ...cols.widths } : {};
    this.size = SIZES.includes(Number(d.size)) ? Number(d.size) : 50;
    this.view = d.view && VIEW_LABEL[d.view as ViewKind] ? d.view as ViewKind : 'list';
    this.vst = d.vst && typeof d.vst === 'object' ? { ...d.vst } : {};
    this.order = Array.isArray(cols.order) ? cols.order.filter(x => typeof x === 'string') : [];
    this.totals = typeof d.totals === 'string' ? d.totals : '';   // v1.46.0
    this.rules = Array.isArray(d.rules) ? d.rules : [];
    this.applied = true;
    this.hasLayout = true;
    this.scan();   // moves the columns
    const zq = new URLSearchParams(location.search).get('zq');
    const keep = this.chips.filter(c => c.type === 'search' && c.key === 'all' && zq && c.text === zq);   // drill-down search stays
    this.chips = [...(d.chips || []).map(c => this.refToChip(c)).filter((c): c is Chip => !!c), ...keep];
    this.groupBy = (d.groupBy || []).map(k => this.refToKey(k)).filter((k): k is string => !!k).slice(0, 2);
    this.sort = this.sortFromRef(d.sort);
    this.collapsed = new Set(Array.isArray(d.collapsed) ? d.collapsed : []);
    this.page = 1;
    try { localStorage.setItem('zl-size:' + location.pathname, String(this.size)); } catch { /* ignore */ }
    this.paintHead();
    this.render();
    if (remember) { this.saveLayout(); } else { this.paintViewsBtn(); }
  }

  /** A view (the default) waiting for the columns of the screen. */
  private usePending(): void {
    if (this.pending && this.cols.length >= 2) { const d = this.pending; this.pending = null; this.applyState(d, false); }
    this.migrateFavs();
  }

  private loadViews(): void {
    this.subs.push(this.sv.list(this.layoutKey).subscribe({
      next: r => {
        this.views = r.views || [];
        this.defaultId = r.default_id ?? null;
        this.canShare = !!r.can_share;
        this.viewsLoaded = true;
        const def = this.views.find(v => v.id === this.defaultId);
        if (def && this.viewId === null) { this.viewId = def.id; this.pending = def.data || {}; this.schedule(0); } else { this.migrateFavs(); }
        this.paintViewsBtn();
      },
      error: () => { this.viewsLoaded = false; },
    }));
  }

  /** v1.8.0 favourites (filters + grouping) become personal saved views, once. */
  private migrateFavs(): void {
    if (!this.legacyFavs.length || !this.viewsLoaded || this.cols.length < 2) { return; }
    const favs = this.legacyFavs;
    this.legacyFavs = [];
    for (const f of favs) {
      if (this.views.some(v => v.mine && v.name.toLowerCase() === String(f.name).toLowerCase())) { continue; }
      const data: ViewData = { v: 1, chips: (f.chips || []).map((c: Chip) => this.chipToRef(c)), groupBy: (f.groupBy || []).map((k: string) => this.keyToRef(k)),
        sort: null, columns: { order: [], hide: [...this.hideCols], widths: {} }, size: this.size, view: 'list' };
      this.sv.create({ screen: this.layoutKey, name: String(f.name).slice(0, 80), data }).subscribe({ next: v => { this.views.push(v); this.paintViewsBtn(); }, error: () => { /* keep going */ } });
    }
    this.saveLayout();
  }

  private stable(x: any): string {
    if (Array.isArray(x)) { return '[' + x.map(v => this.stable(v)).join(',') + ']'; }
    if (x && typeof x === 'object') { return '{' + Object.keys(x).filter(k => x[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + this.stable(x[k])).join(',') + '}'; }
    return JSON.stringify(x ?? null);
  }

  /** The list differs from the view in use (filters, grouping, sort, columns, rows per page or view mode). */
  private changedFrom(v: SavedViewItem): boolean {
    const pick = (d: ViewData) => ({ chips: d.chips || [], groupBy: d.groupBy || [], sort: d.sort || null, order: d.columns?.order || [],
      hide: [...(d.columns?.hide || [])].sort(), widths: d.columns?.widths || {}, size: d.size || 50, view: d.view || 'list' });
    return this.stable(pick(this.currentState())) !== this.stable(pick(v.data || {}));
  }

  private paintViewsBtn(): void {
    const b = this.bar?.querySelector('[data-menu=views]') as HTMLElement | null;
    if (!b) { return; }
    const cur = this.views.find(v => v.id === this.viewId);
    const span = b.querySelector('span') as HTMLElement;
    const txt = cur ? cur.name + (this.changedFrom(cur) ? ' *' : '') : T('Views');
    if (span.textContent !== txt) { span.textContent = txt; }
    b.classList.toggle('on', !!cur);
    b.title = cur ? T('View in use: {0}', [cur.name]) + (this.changedFrom(cur) ? ' – ' + T('changed since it was applied') : '') : T('Saved views: search, filters, group by, sort and columns');
  }

  private fillViews(m: HTMLElement): void {
    const cur = this.views.find(v => v.id === this.viewId) || null;
    const star = (v: SavedViewItem) => v.id === this.defaultId ? `<span class="zl-vwstar" title="${T('Your default view')}">${ICON['star']}</span>` : '';
    const list = this.views.length
      ? `<div class="zl-vwlist">${this.views.map(v => `<button type="button" class="zl-vw${v.id === this.viewId ? ' on' : ''}" data-vw="${v.id}">
          ${star(v)}<span class="zl-vwname">${esc(v.name)}</span>${v.shared ? `<span class="zl-vwtag">${T('Shared')}</span>` : (v.share_groups || []).length ? `<span class="zl-vwtag">${T('Team')}</span>` : ''}${!v.mine ? `<span class="zl-vwby">${esc(T('by {0}', [v.owner || T('another user')]))}</span>` : ''}</button>`).join('')}</div>`
      : `<p class="zl-muted">${T('No saved views yet. Set up the list – search, filters, group by, sort, columns – then save it below.')}</p>`;
    const changed = cur ? this.changedFrom(cur) : false;
    const curSec = cur ? `<div class="zl-sec"><div class="zl-sec-h">${T('View in use: {0}', [esc(cur.name)])}</div>
      ${changed ? `<p class="zl-muted">${T('You changed the list since this view was applied.')}</p>` : ''}
      <div class="zl-vwacts">
        ${cur.can_edit ? `<button type="button" class="zl-apply" data-va="update" ${changed ? '' : 'disabled'}>${T('Save changes to this view')}</button>` : ''}
        ${cur.can_edit ? `<button type="button" class="zl-btn" data-va="rename">${T('Rename')}</button>` : ''}
        <button type="button" class="zl-btn" data-va="default">${cur.id === this.defaultId ? T('Stop using as my default') : T('Make it my default')}</button>
        ${cur.can_edit && this.canShare ? `<button type="button" class="zl-btn" data-va="share">${cur.shared ? T('Make it personal') : T('Share with everyone')}</button>` : ''}
        ${cur.can_edit ? `<button type="button" class="zl-btn zl-bad" data-va="delete">${T('Delete')}</button>` : ''}
      </div>
      <div class="zl-range zl-renamebox" hidden><input class="zl-favname" data-rename maxlength="80" value="${esc(cur.name)}" aria-label="${T('New name of the view')}"><button type="button" class="zl-apply" data-va="rename-save">${T('Rename')}</button></div>
    </div>` : '';
    m.innerHTML = `<div class="zl-menu-scroll">
      <div class="zl-sec"><div class="zl-sec-h">${T('Saved views')}</div>${list}</div>
      ${curSec}
      <div class="zl-sec"><div class="zl-sec-h">${T('Save the current list as a new view')}</div>
        <div class="zl-range"><input class="zl-favname" data-vwname maxlength="80" placeholder="${T('Name of the view')}" aria-label="${T('Name of the view')}"><button type="button" class="zl-apply" data-va="save">${T('Save view')}</button></div>
        <label class="zl-check"><input type="checkbox" data-vwdef> ${T('Make it my default (the list opens like this)')}</label>
        ${this.canShare ? `<label class="zl-check"><input type="checkbox" data-vwshare> ${T('Share with everyone in the company')}</label>` : ''}
        <label class="zl-check zl-team">${T('Share with a team')} <select data-vwteam><option value="">${T('– only me –')}</option>${this.teams.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>
        <p class="zl-muted">${T('A view keeps the search, filters, group by, sort, columns (order and widths), rows per page and the view mode.')}</p>
      </div>
      <p class="zl-vwerr" data-vwerr hidden></p>
      <div class="zl-mfoot"><button type="button" class="zl-link" data-va="reset">${T('Show the standard list')}</button><span class="zl-grow"></span><button type="button" class="zl-link" data-va="excel">${T('Export this view to Excel')}</button></div>
    </div>`;
    const err = (e: any, fallback: string) => {
      const p = m.querySelector('[data-vwerr]') as HTMLElement;
      p.textContent = e?.error?.detail || e?.error?.name?.[0] || (typeof e === 'string' ? e : T(fallback)); p.hidden = false;
    };
    const reopen = () => { this.closeMenu(); this.openMenu('views', this.bar!.querySelector('[data-menu=views]') as HTMLElement); };
    m.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') { return; }
      const t = e.target as HTMLElement;
      if (t.hasAttribute('data-vwname')) { (m.querySelector('[data-va=save]') as HTMLElement).click(); }
      if (t.hasAttribute('data-rename')) { (m.querySelector('[data-va=rename-save]') as HTMLElement).click(); }
    });
    m.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const vw = t.closest('[data-vw]') as HTMLElement | null;
      if (vw) {
        const v = this.views.find(x => x.id === Number(vw.dataset['vw']));
        if (v) { this.viewId = v.id; this.closeMenu(); this.applyState(v.data || {}); this.toast(T('View "{0}" applied.', [v.name])); }
        return;
      }
      const b = t.closest('[data-va]') as HTMLButtonElement | null;
      if (!b || b.disabled) { return; }
      const act = b.dataset['va'];
      if (act === 'save') {
        const name = ((m.querySelector('[data-vwname]') as HTMLInputElement).value || '').trim();
        if (!name) { err('', 'Give the view a name.'); (m.querySelector('[data-vwname]') as HTMLInputElement).focus(); return; }
        const def = (m.querySelector('[data-vwdef]') as HTMLInputElement).checked;
        const shared = !!(m.querySelector('[data-vwshare]') as HTMLInputElement | null)?.checked;
        const team = Number((m.querySelector('[data-vwteam]') as HTMLSelectElement | null)?.value || 0);
        b.disabled = true;
        this.sv.create({ screen: this.layoutKey, name, data: this.currentState(), shared, default: def, share_groups: team ? [team] : [] }).subscribe({
          next: v => { this.views = [...this.views.filter(x => x.id !== v.id), v].sort((a, c) => Number(!a.mine) - Number(!c.mine) || a.name.localeCompare(c.name)); this.viewId = v.id; if (def) { this.defaultId = v.id; } this.paintViewsBtn(); this.toast(T('View "{0}" saved.', [v.name])); this.closeMenu(); },
          error: x => { b.disabled = false; err(x, 'The view could not be saved. Try again.'); },
        });
      } else if (act === 'update' && cur) {
        this.sv.update(cur.id, { data: this.currentState() }).subscribe({ next: v => { this.replaceView(v); this.toast(T('View "{0}" updated.', [v.name])); reopen(); }, error: x => err(x, 'The view could not be saved. Try again.') });
      } else if (act === 'rename' && cur) {
        const box = m.querySelector('.zl-renamebox') as HTMLElement; box.hidden = !box.hidden;
        if (!box.hidden) { (box.querySelector('input') as HTMLInputElement).select(); }
      } else if (act === 'rename-save' && cur) {
        const name = ((m.querySelector('[data-rename]') as HTMLInputElement).value || '').trim();
        if (!name) { err('', 'Give the view a name.'); return; }
        this.sv.update(cur.id, { name }).subscribe({ next: v => { this.replaceView(v); reopen(); }, error: x => err(x, 'The view could not be renamed. Try again.') });
      } else if (act === 'default' && cur) {
        const on = cur.id !== this.defaultId;
        this.sv.setDefault(this.layoutKey, on ? cur.id : null).subscribe({ next: r => { this.defaultId = r.default_id ?? null; this.toast(on ? T('"{0}" is now your default view on this screen.', [cur.name]) : T('This screen opens with the standard list again.')); reopen(); }, error: x => err(x, 'The default could not be changed. Try again.') });
      } else if (act === 'share' && cur) {
        this.sv.update(cur.id, { shared: !cur.shared }).subscribe({ next: v => { this.replaceView(v); reopen(); }, error: x => err(x, 'The view could not be shared. Try again.') });
      } else if (act === 'delete' && cur) {
        if (!confirm(T('Delete the view "{0}"? Everyone it is shared with loses it too.', [cur.name]))) { return; }
        this.sv.remove(cur.id).subscribe({ next: () => { this.views = this.views.filter(v => v.id !== cur.id); if (this.defaultId === cur.id) { this.defaultId = null; } this.viewId = null; this.paintViewsBtn(); reopen(); }, error: x => err(x, 'The view could not be deleted. Try again.') });
      } else if (act === 'reset') {
        this.viewId = null; this.closeMenu();
        this.applyState({ chips: [], groupBy: [], sort: null, columns: { order: [], hide: [], widths: {} }, size: 50, view: 'list' });
        this.applied = false;
      } else if (act === 'excel') {
        this.closeMenu(); this.runExport('xlsx', false);
      }
    });
  }

  private replaceView(v: SavedViewItem): void {
    this.views = this.views.map(x => x.id === v.id ? v : x);
    this.paintViewsBtn();
  }

  // ------------------------------------------------------------------ v1.7.0: views
  private vcols(): VCol[] { return this.cols.filter(c => !this.hideCols.has(c.label)).map(c => ({ idx: c.idx, label: c.label, kind: c.kind, skip: c.skip, facet: c.facet })); }

  private paintViews(): void {
    if (!this.bar) { return; }
    const cols = this.vcols();
    let avail = this.ownGroups ? ['list' as ViewKind] : availableViews(cols);
    if (/\/report-options\/r\//.test(location.pathname)) { avail = avail.filter(v => v !== 'kanban' && v !== 'calendar'); }   // v1.62.0 reports: List · Graph · Pivot
    if (!avail.includes(this.view)) { this.view = 'list'; }
    const box = this.bar.querySelector('.zl-views') as HTMLElement;
    const html = avail.length > 1 ? avail.map(v => `<button type="button" role="tab" class="zl-vbtn${v === this.view ? ' on' : ''}" aria-selected="${v === this.view}" data-act="view" data-view="${v}" title="${T(VIEW_LABEL[v])}">${ICON[v]}<span>${T(VIEW_LABEL[v])}</span></button>`).join('') : '';
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
    const ep = this.z.endpointFor(this.rows.slice(0, 40).map(r => r.raw));   // v1.62.0 ui raw
    if (!ep) { return; }
    const ids = new Map<HTMLTableRowElement, string>();
    for (const r of this.rows) { const hit = this.rec.rowRecord(r.el); if (hit) { ids.set(r.el, hit.id); } }
    const sig = ep + ':' + [...ids.values()].join(',');
    if (sig === this.extraSig || !ids.size) { return; }
    this.extraSig = sig;
    const uniq = [...new Set(ids.values())];
    // v1.45.0: the colour tags of the rows come as one more column (filter and group by work on it like on any column)
    let fields: any[] | null = null, values: Record<string, Record<string, any>> = {}, tags: Record<string, any[]> | null = null;
    const done = () => {
      if (fields === null || tags === null) { return; }
      const cols = [...fields];
      const tagged = Object.values(tags).some(t => (t || []).length);
      if (tagged) {
        cols.push({ name: '__tags', label: T('Tags'), tags: true });
        for (const [id, t] of Object.entries(tags)) { (values[id] ||= {})['__tags'] = t; }
      }
      if (!cols.length) { if (this.extra) { this.extra = null; this.removeExtraCells(); this.schedule(0); } return; }
      this.extra = { endpoint: ep, fields: cols, values, ids };
      this.removeExtraCells();
      this.schedule(0);
    };
    this.rec.listValues(ep, uniq).subscribe({
      next: (res: any) => { fields = (res.fields || []).filter((f: any) => f.show_in_list); values = res.values || {}; done(); },
      error: () => { fields = []; done(); },
    });
    this.rec.tagValues(ep, uniq).subscribe({ next: (t: any) => { tags = t || {}; done(); }, error: () => { tags = {}; done(); } });
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
      fields.forEach((f: any, i: number) => { const th = document.createElement('th'); th.dataset['zl'] = 'xh'; th.dataset['zo'] = 'x' + i; th.textContent = f.label; th.title = 'Extra field (form designer)'; hr.appendChild(th); });
    }
    for (const tr of this.dataRows()) {
      if (tr.querySelectorAll('[data-zl="xc"]').length === fields.length) { continue; }
      tr.querySelectorAll('[data-zl="xc"]').forEach(x => x.remove());
      let id = this.extra.ids.get(tr);
      if (!id) { id = this.rec.rowRecord(tr)?.id; if (id) { this.extra.ids.set(tr, id); } }
      const vals = (id && this.extra.values[id]) || {};
      fields.forEach((f: any, i: number) => {
        const td = document.createElement('td'); td.dataset['zl'] = 'xc'; td.dataset['zo'] = 'x' + i;
        if (f.tags) {   // v1.45.0 colour tags: the text is the tag names (filter / group by), shown as chips
          const t = (vals[f.name] || []) as any[];
          td.innerHTML = t.map(x => `<span class="zr-tag c-${esc(x.color)}">${esc(x.name)}</span>`).join(' ');
          td.title = t.map(x => x.name).join(', ');
        } else { td.textContent = showValue(vals[f.name]); }
        tr.appendChild(td);
      });
    }
  }

  // ------------------------------------------------------------------ v1.45.0 mass actions on the selected rows
  private async call(method: string, path: string, body?: any): Promise<any> {
    const sch = localStorage.getItem('selectedSchema') || '';
    const res = await fetch(`${this.z.api}${path}${path.includes('?') ? '&' : '?'}schema=${encodeURIComponent(sch)}`, {
      method, headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || ''), 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const txt = await res.text();
    let data: any = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
    if (!res.ok) { throw new Error((data && (data.detail || data.error)) || `Error ${res.status}`); }
    return data;
  }

  private selectedIds(): { ids: string[]; rows: Map<string, HTMLTableRowElement>; missing: number } {
    const rows = new Map<string, HTMLTableRowElement>();
    let missing = 0;
    for (const r of this.rows) {
      if (!this.isSel(r.el)) { continue; }
      const hit = this.rec.rowRecord(r.el);
      if (hit?.id) { rows.set(String(hit.id), r.el); } else { missing++; }
    }
    return { ids: [...rows.keys()], rows, missing };
  }

  private async openMass(): Promise<void> {
    const ep = this.endpoint || this.z.endpointFor(this.rows.slice(0, 40).map(r => r.raw));   // v1.62.0 ui raw
    const sel = this.selectedIds();
    if (!ep || !sel.ids.length) { this.toast('The selected rows could not be matched to their records – open them one by one.', true); return; }
    const kit = /^\/(zeo-[a-z]+)\/api\/r\/([a-z_]+)\/$/.exec(ep);
    let reg: any = null;
    if (kit) {
      try { reg = ((await this.call('GET', `/${kit[1]}/api/registers/`)) || []).find((r: any) => r.kind === kit[2]) || null; } catch { reg = null; }
    }
    const opts: { v: string; l: string }[] = [
      { v: 'tag_add', l: T('Add a tag') }, { v: 'tag_remove', l: T('Remove a tag') }, { v: 'message', l: T('Send a message to the followers') },
      { v: 'activity', l: T('Schedule an activity') }, { v: 'follow', l: T('Follow') }, { v: 'export', l: T('Export the selected rows') },
    ];
    if (reg) {
      for (const a of reg.actions || []) { opts.push({ v: 'do:' + a.name, l: a.label }); }
      for (const f of (reg.form || []).filter((x: any) => x.type === 'choice' && (x.choices || []).length)) { opts.push({ v: 'set:' + f.name, l: T('Change {0}', [f.label]) }); }
      if (reg.deletable) { opts.push({ v: 'delete', l: T('Delete') }); }
    } else {
      opts.push({ v: 'delete', l: T('Delete') });
    }
    const modal = document.createElement('div');
    modal.className = 'zl-modal'; modal.dataset['zl'] = 'modal';
    modal.innerHTML = `<div class="zl-dialog zl-mass" role="dialog" aria-modal="true" aria-label="${T('Action on the selected rows')}">
      <div class="zl-dh"><h3>${T('{0} selected rows', [sel.ids.length])}</h3><button type="button" class="zl-x" data-close aria-label="${T('Close')}">${ICON['x']}</button></div>
      <div class="zl-db">
        ${sel.missing ? `<p class="zl-muted">${T('{0} selected rows could not be matched to a record and are left out.', [sel.missing])}</p>` : ''}
        <label class="zl-fl">${T('Action')}<select data-what>${opts.map(o => `<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}</select></label>
        <div class="zl-mass-f"></div>
        <div class="zl-result"></div>
      </div>
      <div class="zl-df"><span class="zl-grow"></span><button type="button" class="zl-btn" data-close>${T('Cancel')}</button><button type="button" class="zl-btn primary" data-go>${T('Apply')}</button></div>
    </div>`;
    document.body.appendChild(modal);
    const what = modal.querySelector('[data-what]') as HTMLSelectElement;
    const box = modal.querySelector('.zl-mass-f') as HTMLElement;
    const res = modal.querySelector('.zl-result') as HTMLElement;
    let users: any[] = [], tags: any[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const input = (name: string, label: string, type = 'text', extra = '') => `<label class="zl-fl">${esc(label)}<input data-f="${name}" type="${type}" ${extra}></label>`;
    const paint = async () => {
      const v = what.value;
      if (v === 'tag_add' || v === 'tag_remove') {
        if (!tags.length) { try { tags = await this.call('GET', '/chatter/api/tags/'); } catch { tags = []; } }
        box.innerHTML = input('tag', T('Tag'), 'text', 'list="zl-mass-tags" placeholder="' + T('Type or pick a tag') + '"') +
          `<datalist id="zl-mass-tags">${tags.map(t => `<option value="${esc(t.name)}">`).join('')}</datalist>`;
      } else if (v === 'message') {
        box.innerHTML = input('subject', T('Subject (optional)')) + `<label class="zl-fl">${T('Message')}<textarea data-f="body" rows="4"></textarea></label>
          <p class="zl-muted">${T('Each record gets the message in its history; its followers get it in their inbox and by e-mail.')}</p>`;
      } else if (v === 'activity') {
        if (!users.length) { try { users = await this.call('GET', '/chatter/api/users/'); } catch { users = []; } }
        box.innerHTML = `<label class="zl-fl">${T('Type')}<select data-f="activity_type">${[['todo', 'To-do'], ['call', 'Call'], ['meeting', 'Meeting'], ['email', 'E-mail'], ['follow_up', 'Follow-up']]
          .map(([a, b]) => `<option value="${a}">${T(b)}</option>`).join('')}</select></label>` + input('summary', T('Summary')) + input('due_date', T('Due date'), 'date', `value="${today}"`) +
          `<label class="zl-fl">${T('Assigned to')}<select data-f="assigned_to">${users.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></label>`;
      } else if (v.startsWith('do:')) {
        const a = (reg?.actions || []).find((x: any) => 'do:' + x.name === v);
        const parts: string[] = [];
        for (const f of a?.fields || []) {
          if (String(f.type).startsWith('opt:')) {
            let o: any[] = [];
            try { o = await this.call('GET', `/${kit![1]}/api/options/${String(f.type).slice(4)}/`); } catch { o = []; }
            parts.push(`<label class="zl-fl">${esc(f.label)}${f.required ? ' *' : ''}<select data-f="${esc(f.name)}"><option value="">–</option>${o.map((x: any) => `<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select></label>`);
          } else if (f.type === 'bool') {
            parts.push(`<label class="zl-chk"><input type="checkbox" data-f="${esc(f.name)}"> ${esc(f.label)}</label>`);
          } else if (f.type === 'file' || f.type === 'files') {
            parts.push(`<p class="zl-muted">${T('"{0}" needs a file – run this action one record at a time.', [esc(f.label)])}</p>`);
          } else {
            parts.push(input(f.name, f.label + (f.required ? ' *' : ''), f.type === 'date' ? 'date' : f.type === 'number' || f.type === 'money' ? 'number' : 'text'));
          }
        }
        box.innerHTML = (a?.confirm ? `<p class="zl-warn">${esc(a.confirm)}</p>` : '') + parts.join('') +
          `<p class="zl-muted">${T('Rows where this is not possible now are skipped and listed.')}</p>`;
      } else if (v.startsWith('set:')) {
        const f = (reg?.form || []).find((x: any) => 'set:' + x.name === v);
        box.innerHTML = `<label class="zl-fl">${esc(f?.label || '')}<select data-f="value">${(f?.choices || []).map((c: any) => `<option value="${esc(c[0] ?? c.value)}">${esc(c[1] ?? c.label)}</option>`).join('')}</select></label>`;
      } else if (v === 'delete') {
        box.innerHTML = `<p class="zl-warn">${T('The selected records are deleted. Records in use are skipped. This cannot be undone.')}</p>`;
      } else { box.innerHTML = ''; }
    };
    const val = (n: string): any => { const el = box.querySelector(`[data-f="${n}"]`) as HTMLInputElement | null; return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; };
    const vals = (): any => { const o: any = {}; box.querySelectorAll('[data-f]').forEach(e => { const el = e as HTMLInputElement; o[el.dataset['f']!] = el.type === 'checkbox' ? el.checked : el.value; }); return o; };
    what.addEventListener('change', paint);
    await paint();
    let changed = false;
    const close = () => { modal.remove(); if (changed) { document.dispatchEvent(new CustomEvent('zeo-list-changed', { detail: { endpoint: ep } })); this.extraSig = ''; this.loadExtras(); } };
    modal.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t === modal || t.closest('[data-close]')) { close(); return; }
      if (!t.closest('[data-go]')) { return; }
      const v = what.value;
      const go = t.closest('[data-go]') as HTMLButtonElement;
      if (v === 'export') { modal.remove(); this.openMenu('export', this.bar!.querySelector('[data-menu=export]') as HTMLElement); return; }
      if (v === 'delete' && !confirm(T('Delete {0} records?', [sel.ids.length]))) { return; }
      go.disabled = true; res.innerHTML = `<p class="zl-muted">${T('Working…')}</p>`;
      try {
        let okN = 0; const bad: { id: string; error: string }[] = [];
        if (['tag_add', 'tag_remove', 'message', 'activity', 'follow'].includes(v)) {
          const body: any = { endpoint: ep, ids: sel.ids, action: v, page: location.pathname.replace(/\/\d+$/, '') };
          if (v.startsWith('tag')) { if (!val('tag').trim()) { throw new Error(T('Type the tag.')); } body.tags = [val('tag').trim()]; }
          Object.assign(body, v === 'message' || v === 'activity' ? vals() : {});
          const r = await this.call('POST', '/chatter/api/mass/', body);
          okN = r.done; if (r.skipped) { bad.push({ id: '', error: T('{0} rows not allowed for you', [r.skipped]) }); }
        } else if (kit && (v.startsWith('do:') || v.startsWith('set:') || v === 'delete')) {
          const body: any = { ids: sel.ids.map(Number), ...vals() };
          if (v.startsWith('do:')) { body.action = v; } else if (v.startsWith('set:')) { body.action = 'set'; body.field = v.slice(4); } else { body.action = 'delete'; }
          const r = await this.call('POST', `/${kit[1]}/api/r/${kit[2]}/bulk/`, body);
          okN = (r.done || []).length; for (const f of r.failed || []) { bad.push({ id: String(f.id), error: f.error }); }
          if (v === 'delete') { for (const id of r.done || []) { sel.rows.get(String(id))?.classList.add('zl-gone'); } }
        } else if (v === 'delete') {
          for (const id of sel.ids) {
            try { await this.call('DELETE', `${ep}${id}/`); okN++; sel.rows.get(id)?.classList.add('zl-gone'); }
            catch (err: any) { bad.push({ id, error: err.message }); }
          }
        }
        changed = okN > 0;
        res.innerHTML = `<div class="zl-sum ${bad.length ? 'bad' : 'ok'}">${T('Done for {0} of {1} records.', [okN, sel.ids.length])}</div>` +
          (bad.length ? `<table class="zl-ptable" zPlain><thead><tr><th>${T('Record')}</th><th>${T('Why not')}</th></tr></thead><tbody>${bad.slice(0, 100).map(b =>
            `<tr><td>${esc(b.id ? (this.rowLabel(sel.rows.get(b.id)) || '#' + b.id) : '')}</td><td>${esc(b.error)}</td></tr>`).join('')}</tbody></table>` : '');
        go.textContent = T('Done');
        if (!bad.length) { setTimeout(close, 900); } else { go.disabled = false; go.textContent = T('Apply'); }
      } catch (err: any) {
        res.innerHTML = `<div class="zl-sum bad">${esc(err?.message || T('It could not be done.'))}</div>`; go.disabled = false;
      }
    });
  }

  private rowLabel(tr?: HTMLTableRowElement): string {
    if (!tr) { return ''; }
    const c = Array.from(tr.cells).filter(td => !td.classList.contains('zl-selcell')).slice(0, 2).map(td => (td.innerText || '').trim()).filter(Boolean);
    return c.join(' · ').slice(0, 80);
  }

  private hideOwnControls(): void {
    const sec = (this.anchor.closest('.comapny_section, .hr-page, .container, .tab-pane, mat-tab-body') || this.anchor.parentElement) as HTMLElement;
    if (!sec) { return; }
    // v1.16.0: a table that only frames another table (no headings of its own) does not count as a second list
    const tables = Array.from(sec.querySelectorAll('table.zl-table, table:not([zPlain])'))
      .filter(t => !(t.querySelector('table') && !Array.from(t.querySelectorAll('th')).some(th => th.closest('table') === t)));
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
    this.hidden = Array.from(new Set([...this.hidden, ...own]));
  }
}
