import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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

interface Col { key: string; label: string; type: 'text' | 'number' | 'date'; }

/**
 * v1.8.0 – one screen for every report (report centre).
 * The rows come from /dashboard/api/reports/<key>/ already limited to the user's branches;
 * search, filters, favourites, group by, columns, graph / pivot and export come from the list tools (z-list).
 */
@Component({
  selector: 'app-z-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZListDirective],
  templateUrl: './z-report.component.html',
  styleUrls: ['./z-report.component.css'],
})
export class ZReportComponent implements OnInit, OnDestroy {
  key = '';
  title = 'Report';
  description = '';
  notes: string[] = [];   // v1.12: how the figures are worked out (from the report)
  hasPeriod = false;
  from = '';
  to = '';
  preset = '';
  columns: Col[] = [];
  rows: any[] = [];          // rows shown (after a drill-down filter)
  all: any[] = [];           // rows the report returned
  totals: Record<string, number> = {};
  private serverTotals: Record<string, number> = {};
  drillF: { key: string; label: string; value: string }[] = [];   // v1.8.1: filters set by a drill-down
  nz = '';
  loading = false;
  error = '';
  runs = [0];
  sending = false;
  note = '';
  noteErr = false;
  presets = [
    { k: 'month', l: 'This month' }, { k: 'lmonth', l: 'Last month' }, { k: 'quarter', l: 'This quarter' },
    { k: 'year', l: 'This year' }, { k: 'lyear', l: 'Last year' },
  ];
  private subs: Subscription[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private rec: ZRecordService,
              private emp: EmployeeService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subs.push(combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([p, q]) => {
      this.key = p.get('key') || ''; this.note = '';
      this.from = q.get('from') || ''; this.to = q.get('to') || ''; this.preset = '';
      this.drillF = q.keys.filter(k => k.startsWith('f_')).map(k => ({ key: k.slice(2), label: k.slice(2), value: q.get(k) || '' }));
      this.nz = q.get('nz') || '';
      this.run();
    }));
    this.subs.push(this.emp.selectedBranches$.pipe(skip(1)).subscribe(() => this.run()));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  get totalCols(): Col[] { return this.columns.filter(c => this.totals[c.key] !== undefined); }

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
    try {
      const d = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/reports/${this.key}/${q}`));
      if (seq !== this.seq) { return; }
      this.title = d.title; this.description = d.description; this.hasPeriod = d.has_period; this.notes = d.notes || [];
      if (d.period) { this.from = d.period.from; this.to = d.period.to; }
      this.preset = this.presets.find(p => { const [a, b] = this.range(p.k); return a === this.from && b === this.to; })?.k || '';
      this.columns = d.columns; this.all = d.rows; this.serverTotals = d.totals || {};
      this.applyDrill();
      this.runs = [this.runs[0] + 1];   // a fresh table, so the list tools read the new columns
    } catch (e: any) {
      if (seq !== this.seq) { return; }
      this.error = e?.error?.detail || (e?.status === 403 ? 'You may not run this report.' : 'The report could not be run. Try again.');
      this.rows = []; this.all = []; this.columns = [];
      // v1.11.0: keep the period picker so a too-wide range can be corrected (e.g. "Choose at most 3 months")
      if (this.from && this.to && e?.status === 400) { this.hasPeriod = true; }
      if (!this.title || this.title === 'Report') { this.title = this.key.replace(/-/g, ' ').replace(/^./, (c: string) => c.toUpperCase()); }
    }
    this.loading = false;
    this.cd.detectChanges();
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
    try {
      const r = await firstValueFrom(this.http.post<any>(`${this.rec.api}/dashboard/api/reports/${this.key}/email/${q}`, {}));
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
    if (!this.drillF.length && !this.nz) { this.totals = this.serverTotals; return; }
    this.totals = {};
    Object.keys(this.serverTotals).forEach(k => {
      this.totals[k] = Math.round(this.rows.reduce((a, r) => a + (typeof r[k] === 'number' ? r[k] : 0), 0) * 100) / 100;
    });
  }

  get nzLabel(): string { return this.columns.find(c => c.key === this.nz)?.label || this.nz; }

  /** Show all rows of the report again (keep the period). */
  clearDrill(): void {
    const q: Record<string, string> = {};
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

  rowLink(row: any): boolean { return !!(row._m || row._drill); }

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
    if (c.type === 'number' && typeof v === 'number') { return v.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
    return String(v);
  }

  fmt(n: number): string { return (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

  trackCol = (_: number, c: Col) => c.key;
}
