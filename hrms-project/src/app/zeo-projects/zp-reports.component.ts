import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { exportCsv, exportExcel, exportPdf } from '../shared-ui/z-export';
import { ZP_BASE, ZpApiService, day, minutes, money, num, when } from './zp-api.service';

const RED = ['Breached', 'Expired', 'Lost', 'Delayed', 'Critical', 'Response and resolution', 'Resolution', 'Response'];
const AMBER = ['At risk', '0–30 days', 'High', 'Pending', 'Waiting for customer', 'Expiring'];
const GREEN = ['On track', 'Renewed', 'Done', 'Active', 'Met', 'Accepted', 'Won'];

/** Projects reports (v1.14.1): one screen for every report, with filters, totals, drill-down and Excel / CSV / PDF export. */
@Component({
  selector: 'app-zp-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <!-- report list -->
    <ng-container *ngIf="!key">
      <div class="header_section">
        <div class="ex-head">
          <div><h1 class="page-title">Projects reports</h1>
            <p class="ex-desc">Support, AMC, project and people reports. Pick a period and filters, click a row to open what is behind it, and export to Excel, CSV or PDF.</p></div>
          <div class="ex-actions" *ngIf="rights.dashboard || rights.admin">
            <button type="button" class="ex-btn" (click)="preview()">Weekly summary e-mail</button>
          </div>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
        <ng-container *ngFor="let g of groups">
          <div class="zp-section">{{ g.name }}</div>
          <div class="zp-rep-grid">
            <button type="button" class="zp-rep" *ngFor="let r of g.items" (click)="openReport(r.key)">
              <span class="material-icons" aria-hidden="true">{{ icon[g.name] || 'table_chart' }}</span>
              <span><b>{{ r.title }}</b><small>{{ r.description }}</small></span>
            </button>
          </div>
        </ng-container>
        <p class="zp-empty" *ngIf="loaded && !groups.length">You have no Projects reports. Ask your administrator for the Projects rights.</p>
      </div>
    </ng-container>

    <!-- one report -->
    <ng-container *ngIf="key">
      <div class="header_section">
        <div class="ex-head">
          <div>
            <button type="button" class="zp-back" (click)="back()">‹ All reports</button>
            <h1 class="page-title">{{ r?.title || 'Report' }}</h1>
            <p class="ex-desc">{{ r?.description }}</p>
          </div>
          <div class="ex-actions">
            <button type="button" class="ex-btn" (click)="xls()" [disabled]="!r?.rows?.length">Excel</button>
            <button type="button" class="ex-btn" (click)="csvOut()" [disabled]="!r?.rows?.length">CSV</button>
            <button type="button" class="ex-btn" (click)="pdf()" [disabled]="!r?.rows?.length">PDF</button>
            <ng-container *ngIf="key === 'work-history' && r">
              <button type="button" class="ex-btn" (click)="full('pdf')" title="Report with summary, time, tickets and project tasks">Full PDF</button>
              <button type="button" class="ex-btn" (click)="full('xlsx')">Full Excel</button>
              <button type="button" class="ex-btn primary" *ngIf="r.can_send" (click)="startSend()">Send by e-mail</button>
            </ng-container>
          </div>
        </div>
        <div class="zp-filters" *ngIf="r">
          <ng-container *ngIf="has('period')">
            <input type="date" [(ngModel)]="f.from" aria-label="From"><input type="date" [(ngModel)]="f.to" aria-label="To">
            <select [(ngModel)]="quick" (ngModelChange)="setQuick()" aria-label="Period">
              <option value="">Custom period</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option><option value="month">This month</option><option value="year">This year</option></select>
          </ng-container>
          <select *ngIf="opts('group') as g" [(ngModel)]="f.group" (ngModelChange)="load()" aria-label="Group by">
            <option *ngFor="let o of g" [value]="o">By {{ groupLabel[o] || o }}</option></select>
          <select *ngIf="has('window')" [(ngModel)]="f.window" (ngModelChange)="load()" aria-label="Window">
            <option value="30">Next 30 days</option><option value="60">Next 60 days</option><option value="90">Next 90 days</option><option value="180">Next 180 days</option></select>
          <select *ngIf="has('customer')" [(ngModel)]="f.customer" (ngModelChange)="load()" aria-label="Customer"><option value="">All customers</option>
            <option *ngFor="let c of lk.customers" [value]="c.id">{{ c.name }}</option></select>
          <select *ngIf="has('contract')" [(ngModel)]="f.contract" (ngModelChange)="load()" aria-label="AMC contract"><option value="">All AMC contracts</option>
            <option *ngFor="let c of r.options?.contracts" [value]="c.id">{{ c.name }}</option></select>
          <select *ngIf="has('project')" [(ngModel)]="f.project" (ngModelChange)="load()" aria-label="Project"><option value="">All projects</option>
            <option *ngFor="let x of r.options?.projects" [value]="x.id">{{ x.name }}</option></select>
          <select *ngIf="has('team')" [(ngModel)]="f.team" (ngModelChange)="load()" aria-label="Team"><option value="">All teams</option>
            <option *ngFor="let t of lk.teams" [value]="t.id">{{ t.name }}</option></select>
          <select *ngIf="has('employee')" [(ngModel)]="f.employee" (ngModelChange)="load()" aria-label="Employee"><option value="">All employees</option>
            <option *ngFor="let e of lk.employees" [value]="e.id">{{ e.name }}</option></select>
          <select *ngIf="opts('status') as st" [(ngModel)]="f.status" (ngModelChange)="load()" aria-label="Status"><option value="">Any status</option>
            <option *ngFor="let o of st" [value]="o">{{ statusLabel[o] || o }}</option></select>
          <button type="button" class="ex-btn primary" *ngIf="has('period')" (click)="load()">Show</button>
        </div>
      </div>
      <div class="com_list mt-4">
        <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
        <p class="ex-muted" *ngIf="loading">Loading…</p>
        <ng-container *ngIf="r && !loading">
          <p class="zp-muted" style="margin:0 0 10px" *ngIf="has('period')">{{ dd(r.from) }} – {{ dd(r.to) }} · {{ r.rows.length }} row(s)
            <span *ngIf="key === 'amc-renewals' && r.summary"> · renewal rate {{ r.summary.renewal_rate_pct ?? '–' }}%</span></p>
          <div class="ex-panel" *ngIf="r.chart && r.rows.length" style="margin-bottom:14px">
            <div class="zp-cols"><div class="c" *ngFor="let row of r.rows" [title]="dd(row[r.chart.x]) + ': ' + r.chart.series[0] + ' ' + row[r.chart.series[0]] + ', ' + r.chart.series[1] + ' ' + row[r.chart.series[1]]">
              <div class="rec" [style.height.%]="bar(row[r.chart.series[0]])"></div><div class="res" [style.height.%]="bar(row[r.chart.series[1]])"></div></div></div>
            <div class="zp-legend"><span><i style="background:#a5b4fc"></i>{{ cap(r.chart.series[0]) }}</span><span><i style="background:#10b981"></i>{{ cap(r.chart.series[1]) }}</span></div>
          </div>
          <div class="zp-scroll">
            <table class="zp-table zp-report">
              <tr><th *ngFor="let c of r.columns" [class.r]="isNum(c)" (click)="sortBy(c.key)" style="cursor:pointer;white-space:nowrap">
                {{ c.label }}<span *ngIf="sort === c.key">{{ asc ? ' ▲' : ' ▼' }}</span></th></tr>
              <tr *ngFor="let row of r.rows" [class.click]="row.link_to" (click)="drill(row)">
                <td *ngFor="let c of r.columns" [class.r]="isNum(c)">
                  <span *ngIf="c.type === 'badge'; else plain" class="zp-b" [ngClass]="badge(row[c.key])">{{ row[c.key] }}</span>
                  <ng-template #plain><span [style.color]="neg(c, row[c.key]) ? '#b42318' : null">{{ fmt(c, row[c.key]) }}</span></ng-template>
                </td>
              </tr>
              <tr class="zp-total" *ngIf="r.rows.length && r.totals">
                <td *ngFor="let c of r.columns" [class.r]="isNum(c)">{{ r.totals[c.key] === undefined ? '' : fmt(c, r.totals[c.key]) }}</td>
              </tr>
            </table>
            <p class="zp-empty" *ngIf="!r.rows.length">Nothing to show for these filters.</p>
          </div>
        </ng-container>
      </div>
    </ng-container>
  </div>
</div>

<div class="ex-back" *ngIf="sendForm" (click)="sendForm = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(640px,100%)">
    <header><h2>Send the work history</h2><button type="button" (click)="sendForm = null" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-muted" style="margin-top:0">{{ r?.title }} · {{ subtitle() || 'all' }}. The full PDF and the Excel file are attached.</p>
      <div class="ex-form" style="grid-template-columns:1fr">
        <label>To (comma separated) *<input [(ngModel)]="sendForm.emails" placeholder="customer@company.com, manager@company.com"></label>
        <label>Message<textarea rows="4" [(ngModel)]="sendForm.message"></textarea></label>
      </div>
      <p class="zp-note" *ngIf="sent">{{ sent }}</p>
    </div>
    <footer><button type="button" class="ex-btn" (click)="sendForm = null">Close</button>
      <button type="button" class="ex-btn primary" (click)="sendHistory()" [disabled]="busy">Send</button></footer>
  </div>
</div>
<div class="ex-back" *ngIf="weekly !== null" (click)="weekly = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(720px,100%)">
    <header><h2>Weekly summary e-mail</h2><button type="button" (click)="weekly = null" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-muted" style="margin-top:0">Sent every Monday morning to the addresses in Setup (or to support managers and management). This is what it says today.</p>
      <pre class="zp-pre">{{ weekly }}</pre>
      <p class="zp-note" *ngIf="sent">{{ sent }}</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="weekly = null">Close</button>
      <button type="button" class="ex-btn primary" *ngIf="rights.ticket_manage || rights.admin" (click)="sendNow()">Send now</button>
    </footer>
  </div>
</div>`,
  styles: [`
.zp-rep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.zp-rep { display: flex; gap: 12px; align-items: flex-start; text-align: left; border: 1px solid #e3e5ef; border-radius: 12px; background: #fff; padding: 14px 16px; cursor: pointer; font-family: inherit; }
.zp-rep:hover { border-color: #a5b4fc; background: #faf9ff; }
.zp-rep .material-icons { color: #5b4fe0; font-size: 22px; }
.zp-rep b { display: block; font-size: 13.5px; color: #1b1640; margin-bottom: 3px; }
.zp-rep small { display: block; font-size: 12px; color: #6b7185; line-height: 1.35; }
.zp-back { border: 0; background: none; color: #5b4fe0; font-size: 13px; padding: 0; margin-bottom: 4px; cursor: pointer; font-family: inherit; }
.zp-total td { font-weight: 700; background: #f6f7fb; border-top: 2px solid #e3e5ef; }
.zp-report td { white-space: nowrap; }
.zp-report td:nth-child(2) { white-space: normal; min-width: 160px; }
.zp-pre { white-space: pre-wrap; font-size: 12.5px; background: #f6f7fb; border-radius: 10px; padding: 12px 14px; max-height: 55vh; overflow: auto; }
.b-red { background: #fee4e2; color: #b42318; } .b-amber { background: #fef0c7; color: #93370d; } .b-green { background: #d1fadf; color: #05603a; }
.b-grey { background: #eef0f6; color: #4a4f63; }
`],
})
export class ZpReportsComponent implements OnInit {
  key = '';
  list: any[] = [];
  groups: { name: string; items: any[] }[] = [];
  rights: any = {};
  lk: any = { customers: [], teams: [], employees: [] };
  r: any = null;
  f: any = {};
  quick = '30';
  sort = '';
  asc = true;
  loading = false;
  loaded = false;
  msg = '';
  weekly: string | null = null;
  sent = '';
  icon: Record<string, string> = { Support: 'support_agent', AMC: 'verified', Projects: 'assignment', People: 'groups', History: 'history' };
  sendForm: any = null;
  busy = false;
  groupLabel: Record<string, string> = { employee: 'engineer', team: 'team', customer: 'customer', priority: 'priority' };
  statusLabel: Record<string, string> = { active: 'Active', expiring: 'Expiring', expired: 'Expired', renewed: 'Renewed', new: 'New',
    in_progress: 'In progress', on_hold: 'On hold', completed: 'Completed' };

  constructor(private api: ZpApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.api.lookups().then(l => this.lk = l).catch(() => {});
    this.route.paramMap.subscribe(async p => {
      this.key = p.get('key') || '';
      this.msg = '';
      if (!this.list.length) await this.loadList();
      if (this.key) {
        const qp = this.route.snapshot.queryParamMap;
        this.f = { from: '', to: '', group: '', window: '90', customer: '', team: '', employee: '', status: '', contract: '', project: '' };
        qp.keys.forEach(k => this.f[k] = qp.get(k));
        const def = this.list.find(x => x.key === this.key);
        const g = def?.filters?.find((x: string) => x.startsWith('group:'));
        if (g && !this.f.group) this.f.group = g.split(':')[1].split(',')[0];
        if (this.f.from || this.f.to) {
          this.quick = '';
          if (!this.f.to) this.f.to = new Date().toISOString().slice(0, 10);
        } else { this.quick = '30'; this.setQuick(false); }
        this.r = def ? { title: def.title, description: def.description, filters: def.filters } : null;
        await this.load();
      }
    });
  }

  async loadList(): Promise<void> {
    try {
      const d = await this.api.get('reports/');
      this.list = d.reports; this.rights = d.rights || {};
      const names: string[] = [];
      d.reports.forEach((x: any) => { if (!names.includes(x.group)) names.push(x.group); });
      this.groups = names.map(n => ({ name: n, items: d.reports.filter((x: any) => x.group === n) }));
    } catch (e) { this.msg = ZpApiService.error(e); }
    this.loaded = true;
  }

  async load(): Promise<void> {
    if (!this.key) return;
    this.loading = true;
    try {
      const q: any = {};
      Object.entries(this.f).forEach(([k, v]) => { if (v) q[k] = v; });
      if (!this.has('period')) { delete q.from; delete q.to; }
      this.r = await this.api.get(`reports/${this.key}/`, q);
      this.sort = ''; this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e, 'The report could not be loaded.'); this.r = null; }
    this.loading = false;
  }

  setQuick(reload = true): void {
    const t = new Date(); const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (!this.quick) return;
    this.f.to = iso(t);
    if (this.quick === 'month') this.f.from = iso(new Date(t.getFullYear(), t.getMonth(), 1, 12));
    else if (this.quick === 'year') this.f.from = iso(new Date(t.getFullYear(), 0, 1, 12));
    else this.f.from = iso(new Date(t.getTime() - (Number(this.quick) - 1) * 86400000));
    if (reload) this.load();
  }

  has(name: string): boolean { return !!this.r?.filters?.some((x: string) => x === name || x.startsWith(name + ':')); }
  opts(name: string): string[] | null {
    const x = this.r?.filters?.find((v: string) => v.startsWith(name + ':'));
    return x ? x.split(':')[1].split(',') : null;
  }

  openReport(k: string): void { this.router.navigate([ZP_BASE, 'reports', k]); }
  back(): void { this.r = null; this.router.navigate([ZP_BASE, 'reports']); }

  drill(row: any): void {
    const l = row.link_to;
    if (!l) return;
    if (l.id) this.router.navigate([ZP_BASE, l.page, l.id]);
    else this.router.navigate([ZP_BASE, l.page], l.query ? { queryParams: l.query } : {});
  }

  sortBy(k: string): void {
    this.asc = this.sort === k ? !this.asc : true;
    this.sort = k;
    const dir = this.asc ? 1 : -1;
    this.r.rows.sort((a: any, b: any) => {
      const x = a[k], y = b[k];
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }

  isNum(c: any): boolean { return ['number', 'hours', 'money', 'pct', 'minutes'].includes(c.type); }
  neg(c: any, v: any): boolean { return (c.type === 'money' || c.key === 'days_left') && typeof v === 'number' && v < 0; }
  badge(v: any): string { return RED.includes(v) ? 'b-red' : AMBER.includes(v) ? 'b-amber' : GREEN.includes(v) ? 'b-green' : 'b-grey'; }

  fmt(c: any, v: any): string {
    if (v === null || v === undefined || v === '') return c.type === 'text' || c.type === 'badge' ? '' : '–';
    if (typeof v === 'string' && (!['date', 'datetime'].includes(c.type) || !/^\d{4}-\d{2}-\d{2}/.test(v))) return v;
    switch (c.type) {
      case 'money': return money(v, this.r?.currency || 'AED');
      case 'pct': return `${num(v)}%`;
      case 'hours': return `${num(v, 2)} h`;
      case 'minutes': return minutes(v);
      case 'number': return num(v, 2);
      case 'date': return day(v);
      case 'datetime': return when(v);
      default: return String(v);
    }
  }

  bar(v: number): number {
    const s = this.r.chart.series;
    const mx = Math.max(1, ...this.r.rows.map((x: any) => Math.max(x[s[0]] || 0, x[s[1]] || 0)));
    return Math.round((v || 0) * 100 / mx);
  }

  dd(v: any): string { return day(v); }
  cap(s: string): string { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  private table(): { headers: string[]; rows: string[][] } {
    const cols = this.r.columns;
    const plain = (c: any, v: any) => (v === null || v === undefined) ? '' :
      (['money', 'hours', 'number', 'pct'].includes(c.type) && typeof v === 'number') ? String(v) : this.fmt(c, v);
    const rows = this.r.rows.map((row: any) => cols.map((c: any) => plain(c, row[c.key])));
    if (this.r.totals) rows.push(cols.map((c: any) => this.r.totals[c.key] === undefined ? '' : plain(c, this.r.totals[c.key])));
    return { headers: cols.map((c: any) => c.label + (c.type === 'money' ? ` (${this.r.currency})` : c.type === 'pct' ? ' %' : '')), rows };
  }

  subtitle(): string {
    const parts: string[] = [];
    if (this.has('period')) parts.push(`${this.dd(this.r.from)} – ${this.dd(this.r.to)}`);
    const pick = (list: any[], id: any) => list?.find((x: any) => String(x.id) === String(id))?.name;
    if (this.f.customer) parts.push(pick(this.lk.customers, this.f.customer));
    if (this.f.team) parts.push(pick(this.lk.teams, this.f.team));
    if (this.f.employee) parts.push(pick(this.lk.employees, this.f.employee));
    if (this.f.contract) parts.push(pick(this.r.options?.contracts, this.f.contract));
    if (this.f.project) parts.push(pick(this.r.options?.projects, this.f.project));
    return parts.filter(Boolean).join(' · ');
  }

  xls(): void {
    const t = this.table();
    exportExcel(this.r.title, t.headers, t.rows, [{ name: 'Filters', rows: [['Report', this.r.title], ['Filters', this.subtitle() || 'none'], ['Printed', new Date().toLocaleString('en-GB')]] }]);
  }
  csvOut(): void { const t = this.table(); exportCsv(this.r.title, t.headers, t.rows); }
  pdf(): void { const t = this.table(); exportPdf(this.r.title, t.headers, t.rows, this.subtitle()); }

  private filters(): any {
    const q: any = {};
    Object.entries(this.f).forEach(([k, v]) => { if (v) q[k] = v; });
    return q;
  }
  full(kind: string): void {
    const name = `Work_history_${this.r.to}.${kind}`;
    this.api.file('reports/work-history/file/', { ...this.filters(), file: kind }, name).catch(e => this.msg = ZpApiService.error(e));
  }
  startSend(): void {
    this.sent = '';
    this.sendForm = { emails: (this.r.options?.recipients || []).join(', '),
      message: `Dear customer,\n\nPlease find attached the summary of the work we did for you from ${this.dd(this.r.from)} to ${this.dd(this.r.to)}.\n\nBest regards` };
  }
  async sendHistory(): Promise<void> {
    this.busy = true; this.sent = '';
    try { const r = await this.api.post('reports/work-history/send/', { ...this.filters(), ...this.sendForm }); this.sent = `Sent to ${r.sent_to.join(', ')}.`; }
    catch (e) { this.sent = ZpApiService.error(e); }
    this.busy = false;
  }

  async preview(): Promise<void> {
    this.sent = '';
    try { this.weekly = (await this.api.get('reports/weekly-summary/')).text; } catch (e) { this.msg = ZpApiService.error(e); }
  }
  async sendNow(): Promise<void> {
    try { const r = await this.api.post('reports/weekly-summary/'); this.sent = `Sent to ${r.sent_to} address(es).`; }
    catch (e) { this.sent = ZpApiService.error(e); }
  }
}
