import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../hr-modules/dashboards/dashboard.service';
import { reportLink } from '../shared-ui/z-nav';
import { CeoChartComponent } from './ceo-chart.component';

const PURPLE = '#5B4FE0';
const AMBER = '#D97706';            // second series (validated against purple: ΔE 32.7 protan)
const P_STEPS = ['#5B4FE0', '#8B82EA', '#B5AFF2', '#DCD9FA'];   // one hue, dark → light (stacked labour cost)

/**
 * CEO / executive dashboard (v1.12): KPI tiles with a trend line, then the charts behind them.
 * Every tile, bar and point opens the report rows behind it.  GET /dashboard/api/ceo/?from&to&branch
 */
@Component({
  selector: 'app-ceo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CeoChartComponent],
  template: `
  <div class="ceo">
    <header class="ceo-h">
      <div>
        <p class="eyebrow">Executive overview</p>
        <h1>Company performance</h1>
        <p class="muted" *ngIf="d">{{ d.period.from | date:'d MMM y' }} – {{ d.period.to | date:'d MMM y' }} · {{ d.sections.people?.headcount ?? '–' }} employees</p>
      </div>
      <div class="filters">
        <label>Up to
          <input type="month" [(ngModel)]="month" (change)="load()" [max]="maxMonth" aria-label="Month the dashboard ends with">
        </label>
        <label *ngIf="(d?.branches?.length || 0) > 1">Branch
          <select [(ngModel)]="branch" (change)="load()">
            <option value="">All branches</option>
            <option *ngFor="let b of d.branches" [value]="b.id">{{ b.name }}</option>
          </select>
        </label>
      </div>
    </header>

    <p class="err" *ngIf="error">{{ error }}</p>
    <div class="skeleton" *ngIf="!d && !error"><div *ngFor="let x of [1,2,3,4,5,6,7,8]"></div></div>

    <ng-container *ngIf="d">
      <!-- KPI tiles -->
      <section class="tiles" [class.busy]="loading" aria-label="Key figures">
        <button type="button" class="tile" *ngFor="let t of d.tiles" (click)="go(t.drill)" [attr.aria-label]="t.label + ': ' + show(t)">
          <span class="t-l">{{ t.label }}</span>
          <span class="t-v" [class.bad]="t.tone === 'bad'">{{ show(t) }}</span>
          <span class="t-n">
            <span *ngIf="t.delta !== null && t.delta !== undefined" class="delta" [class.up]="t.delta > 0" [class.down]="t.delta < 0">
              {{ t.delta > 0 ? '▲' : t.delta < 0 ? '▼' : '■' }} {{ abs(t.delta) }}%</span>
            {{ t.delta !== null && t.delta !== undefined ? t.delta_label : '' }}{{ t.note ? (t.delta !== null && t.delta !== undefined ? ' · ' : '') + t.note : '' }}
          </span>
          <svg *ngIf="(t.spark?.length || 0) > 1" class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <path [attr.d]="spark(t.spark)" fill="none" [attr.stroke]="purple" stroke-width="2" vector-effect="non-scaling-stroke"></path>
          </svg>
        </button>
      </section>

      <div class="grid g2">
        <section class="card" *ngIf="people as p">
          <div class="card-h"><h2>Headcount, last 12 months</h2><button type="button" class="link" (click)="goR('headcount')">Report</button></div>
          <ceo-chart type="line" [labels]="lab(p.trend)" [series]="[{name: 'Employees', color: purple, values: col(p.trend, 'headcount')}]" [height]="170"
                     [extra]="ex('head', p.trend)" ariaLabel="Headcount at month end" (pick)="go(p.trend[$event].drill)"></ceo-chart>
        </section>
        <section class="card" *ngIf="people as p">
          <div class="card-h"><h2>Joiners and leavers</h2><span class="muted small">attrition {{ p.attrition_12m }}% over 12 months</span></div>
          <ceo-chart type="bar" [labels]="lab(p.trend)" [series]="[{name: 'Joined', color: purple, values: col(p.trend, 'joined')}, {name: 'Left', color: amber, values: col(p.trend, 'left')}]"
                     [height]="170" [extra]="ex('turn', p.trend)" ariaLabel="Joiners and leavers per month" (pick)="go(p.trend[$event].drill)"></ceo-chart>
        </section>
      </div>

      <div class="grid g2">
        <section class="card" *ngIf="pay as m">
          <div class="card-h"><h2>Payroll, last 6 months</h2><span class="muted small">AED gross · net in the tooltip</span></div>
          <ceo-chart type="bar" [labels]="lab(m)" [series]="[{name: 'Gross', color: purple, values: col(m, 'gross')}]" [money]="true" [height]="170"
                     [extra]="ex('pay', m)" ariaLabel="Gross payroll per month" (pick)="go(m[$event].drill)"></ceo-chart>
        </section>
        <section class="card" *ngIf="pay as m">
          <div class="card-h"><h2>Labour cost</h2><span class="muted small" *ngIf="d.sections.labour_cost?.latest">AED {{ d.sections.labour_cost.per_employee | number:'1.0-0' }} per employee</span></div>
          <ceo-chart type="stack" [labels]="lab(m)" [money]="true" [height]="170" ariaLabel="Employer labour cost per month" (pick)="go(m[$event].drill)"
                     [series]="[{name: 'Gross pay', color: steps[0], values: col(m, 'gross')}, {name: 'Gratuity accrual', color: steps[1], values: col(m, 'gratuity')},
                                {name: 'Leave accrual', color: steps[2], values: col(m, 'leave')}, {name: 'Pension (GPSSA)', color: steps[3], values: col(m, 'pension')}]"
                     [extra]="ex('cost', m)"></ceo-chart>
          <div class="kv-row">
            <button type="button" class="kv" (click)="go(d.sections.labour_cost.drill_gratuity)"><span>Gratuity accrued to date</span><b>AED {{ d.sections.labour_cost.gratuity_liability | number:'1.0-0' }}</b></button>
            <button type="button" class="kv" (click)="go(d.sections.labour_cost.drill_leave)"><span>Leave liability</span><b>AED {{ d.sections.labour_cost.leave_liability | number:'1.0-0' }}</b></button>
          </div>
        </section>
      </div>

      <div class="grid g2">
        <section class="card" *ngIf="d.sections.overtime?.months as m">
          <div class="card-h"><h2>Overtime hours</h2><span class="muted small">cost in the tooltip{{ m[m.length - 1]?.estimated ? ' (estimated at 125% / 150%)' : '' }}</span></div>
          <ceo-chart type="bar" [labels]="lab(m)" [series]="[{name: 'Hours', color: purple, values: col(m, 'hours')}]" suffix=" h" [height]="160"
                     [extra]="ex('ot', m)" ariaLabel="Overtime hours per month" (pick)="go(m[$event].drill)"></ceo-chart>
        </section>
        <section class="card" *ngIf="d.sections.absence?.months as m">
          <div class="card-h"><h2>Absence rate</h2><span class="muted small">absent days ÷ working days</span></div>
          <ceo-chart type="line" [labels]="lab(m)" [series]="[{name: 'Absence', color: purple, values: col(m, 'rate')}]" suffix="%" [height]="160"
                     [extra]="ex('abs', m)" ariaLabel="Absence rate per month" (pick)="go(m[$event].drill)"></ceo-chart>
        </section>
      </div>

      <div class="grid g3">
        <section class="card" *ngIf="people as p">
          <div class="card-h"><h2>By branch</h2></div>
          <ul class="hbars">
            <li *ngFor="let r of p.by_branch"><button type="button" (click)="go(r.drill)">
              <span class="hb-l">{{ r.label }}</span><span class="hb-t"><i [style.width.%]="r.value * 100 / maxOf(p.by_branch)"></i></span><b>{{ r.value }}</b></button></li>
          </ul>
          <p class="muted small">{{ p.nationals }} UAE nationals · {{ pct(p.nationals, p.headcount) }}% Emiratisation</p>
        </section>
        <section class="card" *ngIf="people as p">
          <div class="card-h"><h2>By department</h2></div>
          <ul class="hbars">
            <li *ngFor="let r of p.by_department.slice(0, 8)"><button type="button" (click)="go(r.drill)">
              <span class="hb-l">{{ r.label }}</span><span class="hb-t"><i [style.width.%]="r.value * 100 / maxOf(p.by_department)"></i></span><b>{{ r.value }}</b></button></li>
          </ul>
        </section>
        <section class="card" *ngIf="d.sections.hiring as h">
          <div class="card-h"><h2>Hiring</h2><button type="button" class="link" (click)="go(h.drill_hires)">Time to hire</button></div>
          <div class="funnel">
            <button type="button" (click)="go(h.drill_open)"><b>{{ h.open_positions }}</b><span>open positions · {{ h.open_jobs }} jobs</span></button>
            <button type="button" (click)="goR('candidates')"><b>{{ h.offers_out }}</b><span>offers out</span></button>
            <button type="button" (click)="goR('time-to-hire')"><b>{{ h.hires }}</b><span>hired in the period</span></button>
            <button type="button" (click)="goR('time-to-hire')"><b>{{ h.time_to_hire ?? '–' }}</b><span>days to hire (average)</span></button>
          </div>
          <button type="button" class="link" (click)="goR('source-effectiveness')">Which sources hire best →</button>
        </section>
      </div>
    </ng-container>
  </div>`,
  styles: [`
    :host { display: block; --ink: #1B1640; --muted: #6B7185; --line: #E3E5EE; --page: #F4F5FA; --p: #5B4FE0; --pw: #ECEAFD; --bad: #A32626; }
    .ceo { padding: 20px 24px 40px; background: var(--page); min-height: 100%; color: #262A3D; font-size: 14px; }
    .ceo-h { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
    .eyebrow { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--p); font-weight: 600; }
    h1 { margin: 2px 0; font-size: 26px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; }
    h2 { margin: 0; font-size: 15px; font-weight: 500; color: var(--ink); }
    .muted { color: var(--muted); margin: 0; } .small { font-size: 12.5px; }
    .err { color: var(--bad); background: #FBE7E7; padding: 10px 12px; border-radius: 8px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filters label { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
    .filters input, .filters select { border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; background: #fff; font: inherit; color: #262A3D; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .tiles.busy { opacity: .55; }
    .tile { position: relative; text-align: left; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px 34px; cursor: pointer;
            display: flex; flex-direction: column; gap: 3px; overflow: hidden; font: inherit; color: inherit; min-height: 118px; }
    .tile::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--p); opacity: 0; transition: opacity .15s; }
    .tile:hover::before, .tile:focus-visible::before { opacity: 1; }
    .tile:hover { border-color: #CFCBF7; }
    .tile:focus-visible, button:focus-visible { outline: 2px solid var(--p); outline-offset: 2px; }
    .t-l { font-size: 12.5px; color: var(--muted); }
    .t-v { font-size: 26px; font-weight: 500; color: var(--ink); line-height: 1.15; font-variant-numeric: tabular-nums; }
    .t-v.bad { color: var(--bad); }
    .t-n { font-size: 11.5px; color: var(--muted); }
    .delta { font-weight: 600; color: var(--muted); }
    .delta.up { color: #0E6B23; } .delta.down { color: var(--bad); }
    .spark { position: absolute; left: 16px; right: 16px; bottom: 8px; height: 22px; width: calc(100% - 32px); }
    .grid { display: grid; gap: 16px; margin-bottom: 16px; }
    .g2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .g3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (max-width: 1100px) { .g3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 760px) { .g2, .g3 { grid-template-columns: minmax(0, 1fr); } .ceo { padding: 12px 16px 32px; } .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .t-v { font-size: 21px; } .tile { min-height: 108px; padding: 12px 12px 30px; } h1 { font-size: 22px; } }
    .card { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; min-width: 0; }
    .card-h { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .link { border: 0; background: transparent; color: var(--p); cursor: pointer; padding: 2px 0; font: inherit; font-size: 13px; }
    .link:hover { text-decoration: underline; }
    .kv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .kv { border: 1px solid var(--line); background: #FAFAFE; border-radius: 10px; padding: 8px 10px; text-align: left; cursor: pointer; display: flex; flex-direction: column; font: inherit; }
    .kv span { font-size: 12px; color: var(--muted); } .kv b { font-weight: 500; color: var(--ink); }
    .kv:hover { border-color: #CFCBF7; }
    .hbars { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 2px; }
    .hbars button { display: grid; grid-template-columns: minmax(0, 130px) 1fr 30px; gap: 10px; align-items: center; width: 100%; border: 0; background: transparent;
                    padding: 6px 4px; border-radius: 6px; cursor: pointer; font: inherit; text-align: left; }
    .hbars button:hover { background: #F7F7FD; }
    .hb-l { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
    .hb-t { height: 8px; background: var(--pw); border-radius: 4px; overflow: hidden; }
    .hb-t i { display: block; height: 100%; background: var(--p); border-radius: 4px; }
    .hbars b { font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }
    .funnel { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .funnel button { border: 1px solid var(--line); background: #FAFAFE; border-radius: 10px; padding: 10px; text-align: left; cursor: pointer; font: inherit; display: flex; flex-direction: column; }
    .funnel button:hover { border-color: #CFCBF7; }
    .funnel b { font-size: 22px; font-weight: 500; color: var(--ink); } .funnel span { font-size: 12px; color: var(--muted); }
    .skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
    .skeleton div { height: 118px; border-radius: 14px; background: linear-gradient(90deg, #ECEDF4, #F6F6FA, #ECEDF4); background-size: 200% 100%; animation: sh 1.2s infinite; }
    @keyframes sh { to { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { .skeleton div { animation: none; } }
  `],
})
export class CeoDashboardComponent implements OnInit {
  d: any = null;
  error = '';
  loading = false;
  month = '';
  branch: any = '';
  readonly purple = PURPLE;
  readonly amber = AMBER;
  readonly steps = P_STEPS;
  readonly maxMonth = new Date().toISOString().slice(0, 7);

  constructor(private svc: DashboardService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const p: any = {};
    if (this.month) {
      const [y, m] = this.month.split('-').map(Number);
      const end = new Date(y, m, 0);
      p.to = `${y}-${String(m).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      const start = new Date(y, m - 12, 1);
      p.from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (this.branch) { p.branch = this.branch; }
    this.svc.ceo(p).subscribe({
      next: d => { this.d = d; this.loading = false; this.error = ''; },
      error: e => { this.loading = false; this.error = e?.status === 403 ? (e?.error?.detail || 'The CEO dashboard is for company admins.') : 'The executive dashboard could not be loaded.'; },
    });
  }

  get people(): any { return this.d?.sections?.people?.trend ? this.d.sections.people : null; }
  get pay(): any[] | null { return this.d?.sections?.payroll?.months || null; }

  lab(rows: any[]): string[] { return (rows || []).map(r => r.label); }
  col(rows: any[], k: string): number[] { return (rows || []).map(r => Number(r[k]) || 0); }
  maxOf(rows: any[]): number { return Math.max(1, ...(rows || []).map(r => r.value)); }
  /** Tooltip lines per chart. */
  ex(kind: string, rows: any[]): string[] {
    const n = (v: number) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
    return (rows || []).map(x => kind === 'head' ? `${x.joined} joined · ${x.left} left`
      : kind === 'turn' ? `turnover ${x.attrition}%`
      : kind === 'pay' ? `net AED ${n(x.net)} · ${x.people} payslips`
      : kind === 'cost' ? `total AED ${n(x.cost)} · AED ${n(x.per_employee)} per employee`
      : kind === 'ot' ? `AED ${n(x.cost)} ${x.estimated ? 'estimated' : 'paid'}`
      : `${x.absent} absent days of ${x.working} · leave ${x.leave_rate}%`);
  }

  pct(a: number, b: number): number { return b ? Math.round((a * 100) / b) : 0; }
  abs(v: number): number { return Math.abs(v); }

  show(t: any): string {
    if (typeof t.value === 'string') { return t.value; }
    const n = Number(t.value) || 0;
    if (t.money) { return 'AED ' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.abs(n) >= 1e4 ? Math.round(n / 1e3) + 'k' : n.toLocaleString('en-US', { maximumFractionDigits: 0 })); }
    return n.toLocaleString('en-US', { maximumFractionDigits: 1 }) + (t.unit && t.unit !== 'AED' ? (t.unit === '%' ? '%' : ' ' + t.unit) : '');
  }

  spark(vals: number[]): string {
    const max = Math.max(...vals), min = Math.min(...vals);
    const r = max - min || 1;
    return vals.map((v, i) => `${i ? 'L' : 'M'}${(i * 100 / (vals.length - 1)).toFixed(1)} ${(26 - ((v - min) / r) * 24).toFixed(1)}`).join(' ');
  }

  go(drill: any): void {
    if (!drill?.report) { return; }
    const [path, q] = reportLink(drill);
    this.router.navigate([path], { queryParams: q });
  }

  goR(report: string): void { this.go({ report, from: this.d?.period?.from, to: this.d?.period?.to }); }
}
