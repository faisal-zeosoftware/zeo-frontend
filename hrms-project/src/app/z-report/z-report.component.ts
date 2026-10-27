import { ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZRecordService } from '../shared-ui/z-record.service';
import { EmployeeService } from '../employee-master/employee.service';
import { employeeUrl, recordUrl, reportLink } from '../shared-ui/z-nav';
import { CountryPackService, cpServerFields } from '../shared-ui/country-pack.service';   // v1.14.0
import { I18N_UI, i18nLocalize, i18nT } from '../shared-ui/i18n.service';   // v1.15.0
import { ZLocationService } from '../shared-ui/z-location.service';   // v1.31.1 location level
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';   // v1.62.0 reports
import { ZReportChartComponent } from './z-report-chart.component';   // v1.62.0 reports

// v1.62.0 reports: fmt / status / long / hidden come from the report centre (DashboardManagement/report_present.py)
interface Col { key: string; label: string; type: 'text' | 'number' | 'date'; fmt?: string; status?: boolean; long?: boolean; hidden?: boolean; daycode?: boolean; nowrap?: boolean; }

/** v1.62.0 reports – favourites and recently run reports of this user on this device (the report home reads them). */
export function zrepGet(name: 'fav' | 'recent'): string[] {
  try { const v = JSON.parse(localStorage.getItem('zrep:' + name + ':' + (localStorage.getItem('selectedSchema') || '')) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function zrepSet(name: 'fav' | 'recent', keys: string[]): void {
  try { localStorage.setItem('zrep:' + name + ':' + (localStorage.getItem('selectedSchema') || ''), JSON.stringify(keys.slice(0, 40))); } catch { /* storage blocked */ }
}
const GOOD = /^(approved|active|paid|paid on time|on time|completed|confirmed|valid|present|accepted|processed|closed|deducted|assigned|hired|passed|done|signed|published|ok|found|disposed|gain|with employee|returned|current|reviewed|acknowledged|on track|ahead|healthy|available|in use|joined|filled)$/i;
const WARN = /^(pending|in[ _]progress|draft|submitted|waiting.*|open.*|on[ _]hold|requested|partially.*|to[ _]do|scheduled|planned|in review|expiring.*|due.*|not paid yet|not started|interview.*|screening|offer.*|in maintenance|on probation|half day|late|early out|trial|collecting|new|applied|nominated|due soon)$/i;
const BAD = /^(rejected|cancel+ed|inactive|expired|failed|absent|declined|terminated|overdue.*|lost|loss|late payment|paid late|exception|missing.*|not found|found – damaged|damaged|never verified|left|absconding|at risk|off track|error|check.*|no iban.*|no person id.*)$/i;

/**
 * v1.8.0 – one screen for every report (report centre).
 * The rows come from /dashboard/api/reports/<key>/ already limited to the user's branches;
 * search, filters, favourites, group by, columns, graph / pivot and export come from the list tools (z-list).
 */
@Component({
  selector: 'app-z-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZListDirective, ZDateFieldComponent, ZReportChartComponent, ...I18N_UI],
  templateUrl: './z-report.component.html',
  styleUrls: ['./z-report.component.css'],
})
export class ZReportComponent implements OnInit, OnDestroy {
  key = '';
  title = 'Report';
  description = '';
  notes: string[] = [];   // v1.12: how the figures are worked out (from the report)
  hasPeriod = false;
  asOf: string | null = null;   // v1.20.2: snapshot reports (gratuity) as of a date
  from = '';
  to = '';
  preset = '';
  columns: Col[] = [];
  rows: any[] = [];          // rows shown (after a drill-down filter)
  all: any[] = [];           // rows the report returned
  totals: Record<string, number> = {};
  private serverTotals: Record<string, number> = {};
  drillF: { key: string; label: string; value: string }[] = [];   // v1.8.1: filters set by a drill-down
  /** v1.16.0: filter row of the report (department, category, employee, status …): the values found in the rows */
  filterKeys: string[] = [];
  filterOpts: { key: string; label: string; values: string[] }[] = [];
  nz = '';
  loading = false;
  error = '';
  runs = [0];
  sending = false;
  note = '';
  noteErr = false;
  // v1.62.0 reports: presentation hints of the report (ui), summary strip, chart, variants, empty state
  ui: any = {};
  moreTotals = false;
  showChart = true;
  menuOpen = false;
  zeroHidden = 0;
  showZero = false;
  noDefaults = false;
  fav = false;
  section = '';
  presets = [
    { k: 'month', l: 'This month' }, { k: 'lmonth', l: 'Last month' }, { k: 'quarter', l: 'This quarter' },
    { k: 'year', l: 'This year' }, { k: 'lyear', l: 'Last year' },
  ];
  private subs: Subscription[] = [];
  @ViewChildren(ZListDirective) private lists?: QueryList<ZListDirective>;   // v1.16.0: e-mail what the list shows

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private rec: ZRecordService,
              private emp: EmployeeService, private cd: ChangeDetectorRef, private cp: CountryPackService, public zloc: ZLocationService) {}

  // v1.31.1 location level: a pick on the report page (empty = the header switcher's selection)
  locPick: number[] = [];
  locToggle(id: number): void { const i = this.locPick.indexOf(id); if (i > -1) { this.locPick.splice(i, 1); } else { this.locPick.push(id); } this.run(); }
  private locQ(): string { return this.locPick.length ? `&location=${this.locPick.join(',')}` : ''; }

  ngOnInit(): void {
    this.subs.push(combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([p, q]) => {
      const nk = p.get('key') || '';
      if (nk !== this.key) { this.dashOpen = false; this.dashPick = null; this.menuOpen = false; this.moreTotals = false; this.showZero = false; }   // v1.62.0 reports (P3-2)
      this.key = nk; this.note = ''; this.fav = zrepGet('fav').includes(nk);
      this.noDefaults = q.get('all') === '1';
      this.from = q.get('from') || ''; this.to = q.get('to') || ''; this.preset = '';
      this.asOf = q.get('as_of') || null;
      this.drillF = q.keys.filter(k => k.startsWith('f_')).map(k => ({ key: k.slice(2), label: k.slice(2), value: q.get(k) || '' }));
      this.nz = q.get('nz') || '';
      this.run();
    }));
    this.subs.push(this.emp.selectedBranches$.pipe(skip(1)).subscribe(() => this.run()));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  get totalCols(): Col[] { return this.columns.filter(c => this.totals[c.key] !== undefined); }
  /** v1.62.0 reports: the few main totals of the summary strip (the report says which), the rest under "More totals". */
  get mainTotals(): Col[] {
    const main: string[] = this.ui?.totals_main || [];
    const cols = this.totalCols;
    const picked = main.map(k => cols.find(c => c.key === k)).filter(Boolean) as Col[];
    return picked.length ? picked : cols.slice(0, 4);
  }
  get otherTotals(): Col[] { const m = new Set(this.mainTotals.map(c => c.key)); return this.totalCols.filter(c => !m.has(c.key)); }
  get visibleCols(): Col[] { return this.columns; }

  private range(k: string): [string, string] {
    const d = new Date();
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const y = d.getFullYear(), m = d.getMonth();
    const r: Record<string, [Date, Date]> = {
      month: [new Date(y, m, 1), new Date(y, m + 1, 0)],
      lmonth: [new Date(y, m - 1, 1), new Date(y, m, 0)],
      quarter: [new Date(y, m - (m % 3), 1), new Date(y, m - (m % 3) + 3, 0)],
      year: [new Date(y, 0, 1), new Date(y, 11, 31)],
      lyear: [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)],
    };
    return [iso(r[k][0]), iso(r[k][1])];
  }

  pick(k: string): void {
    [this.from, this.to] = this.range(k);
    this.run();
  }

  custom(): void { if (this.from && this.to) { this.run(); } }

  private seq = 0;

  async run(): Promise<void> {
    if (!this.key) { return; }
    const seq = ++this.seq;   // only the latest run may fill the screen (fast drill-downs, back button)
    this.loading = true; this.error = '';
    const s = localStorage.getItem('selectedSchema') || '';
    let branches: number[] = [];
    try { branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]'); } catch { branches = []; }
    let q = `?schema=${encodeURIComponent(s)}`;
    if (this.from && this.to) { q += `&from=${this.from}&to=${this.to}`; }
    if (branches.length) { q += `&branch=${branches.join(',')}`; }
    if (this.asOf) { q += `&as_of=${this.asOf}`; }
    q += this.locQ();
    try {
      const d = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/reports/${this.key}/${q}`));
      if (seq !== this.seq) { return; }
      // v1.14.0: captions in the company's country terms; columns of features the country does not use are left out
      // v1.15.0: then in the user's language (country first, then language)
      // v1.62.0 reports: a merged report opens the report it was merged into (old addresses keep working)
      if (d.ui?.redirect && d.ui.redirect !== this.key) { this.router.navigate(['/main-sidebar/report-options/r', d.ui.redirect], { queryParams: this.route.snapshot.queryParams, replaceUrl: true }); return; }
      this.ui = d.ui || {}; this.section = d.section || '';
      this.title = i18nT(this.cp.text(d.title)); this.description = i18nT(this.cp.text(d.description)); this.hasPeriod = d.has_period; this.asOf = d.as_of || null; this.notes = (d.notes || []).map((n: any) => typeof n === 'string' ? i18nT(this.cp.text(n)) : n);
      if (d.period) { this.from = d.period.from; this.to = d.period.to; }
      this.preset = this.presets.find(p => { const [a, b] = this.range(p.k); return a === this.from && b === this.to; })?.k || '';
      this.columns = i18nLocalize(cpServerFields(d.columns || [], this.cp)); this.all = d.rows; this.serverTotals = d.totals || {};
      this.filterKeys = d.filters || [];
      // v1.62.0 reports: short text (names, cycles, departments) stays on one line; long text is cut with a tooltip
      this.columns.forEach(c => { if (c.type === 'text' && !c.long) { c.nowrap = (this.all || []).slice(0, 400).every(r => String(r[c.key] ?? '').length <= 42); } });
      this.sortDefault();
      // v1.62.0 reports: default filters (e.g. Changed = Yes) when the address names none – "Show all rows" switches them off
      if (!this.drillF.length && !this.nz && !this.noDefaults && this.ui.default_filters) {
        Object.entries(this.ui.default_filters).forEach(([k, v]) => { if (this.all.some(r => String(r[k]) === String(v))) { this.drillF.push({ key: k, label: k, value: String(v) }); } });
      }
      this.applyDrill();
      this.remember();
      this.buildFilters();
      this.runs = [this.runs[0] + 1];   // a fresh table, so the list tools read the new columns
    } catch (e: any) {
      if (seq !== this.seq) { return; }
      this.error = e?.error?.detail || i18nT(e?.status === 403 ? 'You may not run this report.' : 'The report could not be run. Try again.');
      this.rows = []; this.all = []; this.columns = [];
      // v1.11.0: keep the period picker so a too-wide range can be corrected (e.g. "Choose at most 3 months")
      if (this.from && this.to && e?.status === 400) { this.hasPeriod = true; }
      // v1.38.0: the previous report's title and description must not stay above the error (an unknown report showed "Contacts")
      if (e?.status === 404 || !this.title || this.title === 'Report') { this.title = this.key.replace(/-/g, ' ').replace(/^./, (c: string) => c.toUpperCase()); this.description = ''; }
    }
    this.loading = false;
    this.cd.detectChanges();
  }

  /** v1.53.0 – put this report on one of my dashboards as a card. */
  dashOpen = false; dashList: any[] = []; dashPick: any = null; dashView = 'number'; dashGroup = ''; dashBusy = false;
  async openDash(): Promise<void> {
    this.dashOpen = !this.dashOpen; this.note = '';
    if (!this.dashOpen) { return; }
    const s = localStorage.getItem('selectedSchema') || '';
    try { this.dashList = ((await firstValueFrom(this.http.get<any[]>(`${this.rec.api}/insights/api/dashboards/?schema=${encodeURIComponent(s)}`))) || []).filter(d => d.can_edit); }
    catch { this.dashList = []; }
    this.dashPick = this.dashList[0]?.id || null;
    this.cd.detectChanges();
  }
  dashGroupCols(): any[] { return this.dashView === 'line' ? this.columns.filter((c: any) => c.type === 'date') : this.columns.filter((c: any) => c.type !== 'number'); }
  async addToDash(): Promise<void> {
    const s = localStorage.getItem('selectedSchema') || '';
    this.dashBusy = true;
    try {
      let id = this.dashPick;
      if (!id) {
        const r = await firstValueFrom(this.http.post<any>(`${this.rec.api}/insights/api/dashboards/?schema=${encodeURIComponent(s)}`, { name: 'My dashboard', cards: [] }));
        id = r.id;
      }
      const card = { report: this.key, view: this.dashView, group: this.dashGroup, period: 'report', size: this.dashView === 'number' ? 's' : 'w' };
      await firstValueFrom(this.http.post<any>(`${this.rec.api}/insights/api/dashboards/${id}/add-card/?schema=${encodeURIComponent(s)}`, { card }));
      this.note = 'Added to the dashboard (Reports › Dashboards).'; this.noteErr = false; this.dashOpen = false;
    } catch (e: any) { this.note = e?.error?.detail || 'The card could not be added.'; this.noteErr = true; }
    this.dashBusy = false; this.cd.detectChanges();
  }

  /** Sends the report, as now filtered by period and branch, to the user's e-mail (CSV). */
  async email(): Promise<void> {
    this.sending = true; this.note = ''; this.cd.detectChanges();
    const s = localStorage.getItem('selectedSchema') || '';
    let branches: number[] = [];
    try { branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]'); } catch { branches = []; }
    let q = `?schema=${encodeURIComponent(s)}`;
    if (this.from && this.to) { q += `&from=${this.from}&to=${this.to}`; }
    if (branches.length) { q += `&branch=${branches.join(',')}`; }
    if (this.asOf) { q += `&as_of=${this.asOf}`; }
    q += this.locQ();
    try {
      // v1.16.0: the file follows the screen – filters, sort, visible columns and group by (a column per group level)
      const shown = this.lists?.first?.csvNow() || null;
      const r = await firstValueFrom(this.http.post<any>(`${this.rec.api}/dashboard/api/reports/${this.key}/email/${q}`, shown ? { csv: shown.text, rows: shown.rows } : {}));
      this.note = `Sent to ${r.sent_to} – ${r.rows} rows attached as a CSV file.`; this.noteErr = false;
    } catch (e: any) {
      this.note = e?.error?.detail || 'The e-mail could not be sent.'; this.noteErr = true;
    }
    this.sending = false; this.cd.detectChanges();
  }

  // ------------------------------------------------------------------ v1.8.1 drill-down
  /** Keep the rows a drill-down asked for (column = value, or a total's non-zero rows). */
  private applyDrill(): void {
    const lab = (k: string) => this.columns.find(c => c.key === k)?.label || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
    this.drillF.forEach(f => f.label = lab(f.key));
    const norm = (v: any) => String(v ?? '').trim().toLowerCase();
    // a value "A|B" means any of them (e.g. working days = Present, Absent or On leave)
    this.rows = this.all.filter(r => this.drillF.every(f => f.value.split('|').some(v => norm(r[f.key]) === norm(v)))
      && (!this.nz || (typeof r[this.nz] === 'number' ? r[this.nz] !== 0 : !!r[this.nz])));
    // v1.62.0 reports: rows with nothing in them (leave types without entitlement …) are hidden until asked for
    const hz: string[] = this.ui?.hide_zero || [];
    this.zeroHidden = 0;
    if (hz.length && !this.showZero) {
      const before = this.rows.length;
      this.rows = this.rows.filter(r => hz.some(k => typeof r[k] === 'number' && r[k] !== 0));
      this.zeroHidden = before - this.rows.length;
    }
    if (!this.drillF.length && !this.nz && !this.zeroHidden) { this.totals = this.serverTotals; return; }
    this.totals = {};
    const tm = this.ui?.totals_meta || {};
    Object.keys(this.serverTotals).forEach(k => {
      const nums = this.rows.map(r => r[k]).filter(v => typeof v === 'number');
      const sum = nums.reduce((a, v) => a + v, 0);
      this.totals[k] = Math.round((tm[k]?.agg === 'avg' ? (nums.length ? sum / nums.length : 0) : sum) * 100) / 100;
    });
    Object.keys(tm).filter(k => tm[k].agg === 'ratio' && this.totals[k] !== undefined).forEach(k => {
      const [a, b] = tm[k].of; this.totals[k] = this.totals[b] ? Math.round(this.totals[a] / this.totals[b] * 100) / 100 : 0;
    });
  }

  private buildFilters(): void {
    const lab = (k: string) => this.columns.find(c => c.key === k)?.label || (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
    this.filterOpts = this.filterKeys.map(k => ({
      key: k, label: lab(k),
      values: Array.from(new Set(this.all.map(r => String(r[k] ?? '').trim()).filter(v => v))).sort((a, b) => a.localeCompare(b)),
    })).filter(f => f.values.length > 1 || this.drillValue(f.key));
  }

  drillValue(key: string): string { return this.drillF.find(f => f.key === key)?.value || ''; }

  /** v1.16.0: pick a value in the filter row (same as a drill-down: f_<column>=value in the address, so it can be shared). */
  setFilter(key: string, value: string): void {
    const q: Record<string, string> = { ...this.route.snapshot.queryParams };
    if (value) { q['f_' + key] = value; } else { delete q['f_' + key]; }
    if (this.from && this.to) { q['from'] = this.from; q['to'] = this.to; }
    this.router.navigate([], { relativeTo: this.route, queryParams: q });
  }

  get nzLabel(): string { return this.columns.find(c => c.key === this.nz)?.label || this.nz; }

  /** Show all rows of the report again (keep the period). */
  // (v1.16.0: also clears the filter row)
  clearDrill(): void {
    const q: Record<string, string> = { all: '1' };   // v1.62.0 reports: also without the report's default filters
    if (this.from && this.to) { q['from'] = this.from; q['to'] = this.to; }
    this.router.navigate([], { relativeTo: this.route, queryParams: q });
  }

  /** A total: the rows that make it up. */
  drillTotal(c: Col): void {
    const q: Record<string, string> = { ...this.route.snapshot.queryParams, nz: c.key };
    if (this.from && this.to) { q['from'] = this.from; q['to'] = this.to; }
    this.router.navigate([], { relativeTo: this.route, queryParams: q });
  }

  cellLink(row: any, c: Col): boolean { return !!(row._cell && row._cell[c.key]) || (c.key === 'employee' && !!row._emp) || (c.key === 'held_by' && !!row._emp); }

  rowLink(row: any): boolean { return !!(row._url || row._m || row._drill); }

  /** Click anywhere on a row: the record it came from (or the rows behind it); on a linked cell: that cell's record / rows. */
  rowClick(row: any, ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (t.closest('.zl-selcell, input, select, label, [data-zl]')) { return; }
    if (window.getSelection()?.toString()) { return; }   // the user is selecting text to copy
    const td = t.closest('td') as HTMLElement | null;
    const key = td?.dataset['k'];
    if (key && row._cell && row._cell[key]) { this.go(row._cell[key]); return; }
    if ((key === 'employee' || key === 'held_by') && row._emp) { this.router.navigateByUrl(employeeUrl(row._emp)); return; }
    this.open(row);
  }

  open(row: any, ev?: Event): void {
    ev?.stopPropagation();
    // v1.22.0: rows of the add-on apps open their own page (CRM, Property, Maintenance, HSE, Projects)
    if (row._url) { this.router.navigateByUrl(row._url); return; }
    if (row._m) { this.router.navigateByUrl(recordUrl(row._m, row._id)); } else if (row._drill) { this.go(row._drill); }
  }

  private go(d: any): void {
    if (d._m) { this.router.navigateByUrl(recordUrl(d._m, d._id)); return; }
    const [path, q] = reportLink(d);
    this.router.navigate([path], { queryParams: q });
  }

  show(row: any, c: Col): string {
    const v = row[c.key];
    if (v === null || v === undefined || v === '') { return c.type === 'number' ? '' : '-'; }
    if (c.type === 'number' && typeof v === 'number') { return this.num(v, c.fmt); }
    if (typeof v === 'boolean') { return i18nT(v ? 'Yes' : 'No'); }   // v1.62.0 reports
    if (c.type === 'date' || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v))) { return zDmy(v); }   // v1.62.0 reports: dd/mm/yyyy
    return String(v);
  }

  /** v1.62.0 reports: money with 2 decimals, % with 1 decimal and the sign, counts without decimals – thousands separators. */
  num(v: number, f?: string): string {
    if (typeof v !== 'number') { return String(v ?? ''); }
    if (f === 'money') { return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    if (f === 'pct') { return v.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%'; }
    if (f === 'int') { return v.toLocaleString('en-US', { maximumFractionDigits: 0 }); }
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  fmt(n: number, c?: Col): string { return this.num(n ?? 0, c?.fmt); }

  /** Total label without the "(AED)" – the strip shows the currency next to the figure. */
  tLabel(c: Col): string { return (c.label || '').replace(/\s*\((AED|USD|SAR|QAR|OMR|BHD|KWD|INR|[A-Z]{3}|درهم|ريال|دينار)\)\s*$/, ''); }
  tUnit(c: Col): string {
    if (c.fmt !== 'money') { return ''; }
    const m = (c.label || '').match(/\(([A-Z]{3})\)/);
    return m ? m[1] : (this.cp.currency()?.code || 'AED');
  }
  tAvg(c: Col): boolean { return this.ui?.totals_meta?.[c.key]?.agg === 'avg'; }

  /** "Anil Kumar (GD-0008)" → name on the first line, the code muted under it. */
  empSplit(v: any): [string, string] | null {
    if (typeof v !== 'string') { return null; }
    const m = v.match(/^(.*\S)\s+\(([A-Za-z]{1,6}-?\d{2,}[A-Za-z0-9-]*)\)$/);
    return m ? [m[1], m[2]] : null;
  }

  /** good | warn | bad | '' for a status word. */
  tone(v: any): string {
    const t = String(v ?? '').trim();
    if (!t || t === '-') { return ''; }
    return GOOD.test(t) ? 'good' : BAD.test(t) ? 'bad' : WARN.test(t) ? 'warn' : 'neutral';
  }

  codeOf(v: any): string { return String(v ?? '').trim().split(/\s+/)[0].toUpperCase(); }

  isEmpCol(c: Col): boolean { return c.key === 'employee' || c.key === 'held_by' || c.key === 'candidate'; }

  toggleZero(): void { this.showZero = !this.showZero; this.applyDrill(); this.runs = [this.runs[0] + 1]; this.cd.detectChanges(); }

  /** Variants: a merged report is one tab of the report it was merged into. */
  get variants(): { key: string; label: string }[] { return this.ui?.variants || []; }

  toggleFav(): void {
    const f = zrepGet('fav');
    const i = f.indexOf(this.key);
    if (i > -1) { f.splice(i, 1); } else { f.unshift(this.key); }
    zrepSet('fav', f); this.fav = f.includes(this.key);
  }

  private remember(): void {
    const r = zrepGet('recent').filter(k => k !== this.key);
    r.unshift(this.key); zrepSet('recent', r.slice(0, 12));
  }

  private sortDefault(): void {
    const s = this.ui?.sort;
    if (!s) { return; }
    const [k, dir] = s;
    this.all = [...this.all].sort((a, b) => {
      const x = a[k], y = b[k];
      const xe = x === '' || x === null || x === undefined, ye = y === '' || y === null || y === undefined;
      if (xe || ye) { return xe === ye ? 0 : xe ? 1 : -1; }
      return (x < y ? -1 : x > y ? 1 : 0) * (dir || 1);
    });
  }

  /** Empty state: try a wider period. */
  tryPeriod(k: string): void { this.pick(k); }
  get emptyNext(): { k: string; l: string } | null {
    if (!this.hasPeriod) { return null; }
    if (this.preset === 'month') { return { k: 'lmonth', l: 'Try last month' }; }
    if (this.preset !== 'year') { return { k: 'year', l: 'Try this year' }; }
    return { k: 'lyear', l: 'Try last year' };
  }
  get periodText(): string { return this.from && this.to ? `${zDmy(this.from)} – ${zDmy(this.to)}` : ''; }

  trackCol = (_: number, c: Col) => c.key;
  trackKey = (_: number, v: { key: string }) => v.key;   // v1.62.0 reports
}

/** v1.62.0 reports: 2026-10-01 → 01/10/2026, 2026-10-26T08:54:06+00:00 → 26/10/2026 08:54 (the company's local time). */
export function zDmy(v: any): string {
  const t = String(v ?? '');
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) { return t; }
  if (m[4] !== undefined && /[zZ]|[+-]\d{2}:?\d{2}$/.test(t)) {
    const d = new Date(t);
    if (!isNaN(+d)) {
      const p = (n: number) => String(n).padStart(2, '0');
      return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
  }
  return `${m[3]}/${m[2]}/${m[1]}` + (m[4] !== undefined ? ` ${m[4]}:${m[5]}` : '');
}
