import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from '../hr-modules/dashboards/dashboard.service';
import { reportLink } from '../shared-ui/z-nav';
import { CeoChartComponent } from './ceo-chart.component';
import { COUNTRY_PACK_UI, CountryPackService } from '../shared-ui/country-pack.service';   // v1.14.0
import { ZDashDesignerComponent } from '../shared-ui/z-dash.component';   // v1.16.0
import { DashPeriod, DashPeriods, savedPeriod } from '../shared-ui/z-dash-period';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';   // v1.17.0

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
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, CommonModule, FormsModule, CeoChartComponent, ZDashDesignerComponent],
  template: `
  <div class="ceo" [class.embedded]="embedded">
    <header class="ceo-h">
      <div>
        <ng-container *ngIf="!embedded">
          <p class="eyebrow">{{ 'Executive overview' | t }}</p>
          <h1>{{ 'Company performance' | t }}</h1>
          <!-- v1.17.0: the headcount lives on HR operations (one home per figure); dates in the language's format -->
          <p class="muted" *ngIf="d">{{ d.period.from | zdate }} – {{ d.period.to | zdate }}</p>
        </ng-container>
      </div>
      <div class="filters">
        <label *ngIf="(d?.branches?.length || 0) > 1">Branch
          <select [(ngModel)]="branch" (change)="load()">
            <option value="">All branches</option>
            <option *ngFor="let b of d.branches" [value]="b.id">{{ b.name }}</option>
          </select>
        </label>
      </div>
    </header>
    <!-- v1.16.0: period of the dashboard (and a chip per card), drag & drop, sizes -->
    <z-dash-designer name="ceo" [scope]="'#' + boardId" (periods)="onPeriods($event)"></z-dash-designer>

    <p class="err" *ngIf="error">{{ error }}</p>
    <div class="skeleton" *ngIf="!d && !error"><div *ngFor="let x of [1,2,3,4,5,6,7,8]"></div></div>

    <div class="zdd-board" [id]="boardId" [class.busy]="loading">
    <ng-container *ngIf="d">
      <!-- KPI tiles -->
      <section class="tiles" aria-label="Key figures" data-widget="ceo-tiles" data-widget-title="Key figures" data-widget-size="f" data-widget-timed="1">
        <ng-container *ngFor="let t of tiles()">
        <button type="button" class="tile" *ngIf="!t.country || cp.allows(t.country)" (click)="go(t.drill)" [attr.data-tile]="t.key" [attr.aria-label]="(t.label | zc | t) + ': ' + show(t)"
                [title]="t.timed === false ? ('Current figure – the period does not change it' | t) : ''">
          <span class="t-l">{{ t.label | zc | t }}<i *ngIf="t.timed === false" class="t-now"> · {{ 'now' | t }}</i></span>
          <span class="t-v" [class.bad]="t.tone === 'bad'">
            <ng-container *ngIf="!t.parts">{{ show(t) }}</ng-container>
            <ng-container *ngIf="t.parts"><a class="t-part" *ngFor="let pt of t.parts; let last = last" (click)="go(pt.drill, $event)" role="link" tabindex="0" (keydown.enter)="go(pt.drill, $event)">{{ pt.value }}</a><ng-container *ngIf="false"></ng-container></ng-container>
          </span>
          <span class="t-n">
            <span *ngIf="t.delta !== null && t.delta !== undefined" class="delta" [class.up]="t.delta > 0" [class.down]="t.delta < 0">
              {{ t.delta > 0 ? '▲' : t.delta < 0 ? '▼' : '■' }} {{ abs(t.delta) }}%</span>
            {{ t.delta !== null && t.delta !== undefined ? t.delta_label : '' }}<ng-container *ngIf="!t.parts_money">{{ t.note ? (t.delta !== null && t.delta !== undefined ? ' · ' : '') + (t.note_zc ? (t.note | zc) : t.note) : '' }}</ng-container>
            <!-- v1.17.0: gratuity and leave liability open their own reports -->
            <ng-container *ngIf="t.parts_money"><a class="t-part" *ngFor="let pt of t.parts_money" [attr.data-part]="pt.key" (click)="go(pt.drill, $event)" role="link" tabindex="0"
               (keydown.enter)="go(pt.drill, $event)">{{ (pt.key === 'gratuity' ? 'Gratuity' : 'Leave') | zc | t }} {{ pt.value | zmoney:'1.0-0' }}</a></ng-container>
          </span>
          <svg *ngIf="(t.spark?.length || 0) > 1" class="spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <path [attr.d]="spark(t.spark)" fill="none" [attr.stroke]="purple" stroke-width="2" vector-effect="non-scaling-stroke"></path>
          </svg>
        </button>
        </ng-container>
      </section>

      <section class="card" *ngIf="sec('ceo-head', 'people') as p" data-widget="ceo-head" data-widget-title="Headcount, last 12 months" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>{{ 'Headcount, 12 months to {0}' | t:endLabel(p) }}</h2><button type="button" class="link" (click)="go(p.drill_trend)">{{ 'Report' | t }}</button></div>
        <ceo-chart type="line" [labels]="lab(p.trend)" [series]="[{name: 'Employees', color: purple, values: col(p.trend, 'headcount')}]" [height]="170"
                   [extra]="ex('head', p.trend)" [ariaLabel]="'Headcount at month end' | t" (pick)="go(p.trend[$event].drill_head)"></ceo-chart>
      </section>
      <section class="card" *ngIf="sec('ceo-moves', 'people') as p" data-widget="ceo-moves" data-widget-title="Joiners and leavers" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>Joiners and leavers</h2><button type="button" class="link" (click)="go(attrDrill())">{{ 'attrition {0}% over 12 months' | t:p.attrition_12m }}</button></div>
        <ceo-chart type="bar" [labels]="lab(p.trend)" [series]="[{name: 'Joined', color: purple, values: col(p.trend, 'joined')}, {name: 'Left', color: amber, values: col(p.trend, 'left')}]"
                   [height]="170" [extra]="ex('turn', p.trend)" [ariaLabel]="'Joiners and leavers per month' | t" (pick)="go(p.trend[$event].drill)"></ceo-chart>
      </section>

      <section class="card" *ngIf="sec('ceo-pay', 'payroll')?.months as m" data-widget="ceo-pay" data-widget-title="Payroll" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>Payroll by month</h2><span class="muted small">{{ '{0} gross · net in the tooltip · select a month' | t:cp.currency().code }}</span></div>
        <ceo-chart type="bar" [labels]="lab(m)" [series]="[{name: 'Gross', color: purple, values: col(m, 'gross')}]" [money]="true" [height]="170"
                   [extra]="ex('pay', m)" [ariaLabel]="'Gross payroll per month' | t" (pick)="go(m[$event].drill)"></ceo-chart>
      </section>
      <section class="card" *ngIf="sec('ceo-cost', 'payroll')?.months as m" data-widget="ceo-cost" data-widget-title="Labour cost" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>Labour cost</h2><button type="button" class="link" *ngIf="sec('ceo-cost', 'labour_cost')?.latest" (click)="go(sec('ceo-cost', 'labour_cost')?.latest?.drill)">{{ sec('ceo-cost', 'labour_cost').per_employee | zmoney:'1.0-0' }} per employee</button></div>
        <ceo-chart type="stack" [labels]="lab(m)" [money]="true" [height]="170" [ariaLabel]="'Employer labour cost per month' | t" (pick)="go(m[$event].drill)"
                   [series]="[{name: 'Gross pay', color: steps[0], values: col(m, 'gross')}, {name: cp.text('Gratuity accrual'), color: steps[1], values: col(m, 'gratuity')},
                              {name: 'Leave accrual', color: steps[2], values: col(m, 'leave')}, {name: cp.text('Pension (GPSSA)'), color: steps[3], values: col(m, 'pension')}]"
                   [extra]="ex('cost', m)"></ceo-chart>
        <!-- v1.17.0: gratuity and leave liability are on their tile (one home per figure) -->
      </section>

      <section class="card" *ngIf="sec('ceo-ot', 'overtime')?.months as m" data-widget="ceo-ot" data-widget-title="Overtime cost" data-widget-timed="1" data-widget-size="w">
        <!-- v1.17.0: Management shows the overtime cost (pay); the hours are in the tooltip -->
        <div class="card-h"><h2>{{ 'Overtime cost' | t }}</h2><span class="muted small">{{ 'hours in the tooltip · select a month' | t }}</span></div>
        <ceo-chart type="bar" [labels]="lab(m)" [series]="[{name: 'Cost', color: purple, values: col(m, 'cost')}]" [money]="true" [height]="160"
                   [extra]="ex('ot', m)" [ariaLabel]="'Overtime cost per month' | t" (pick)="go(m[$event].drill)"></ceo-chart>
      </section>
      <section class="card" *ngIf="sec('ceo-abs', 'absence')?.months as m" data-widget="ceo-abs" data-widget-title="Absence rate" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>Absence rate</h2><span class="muted small">{{ 'absent days ÷ working days · select a month' | t }}</span></div>
        <ceo-chart type="line" [labels]="lab(m)" [series]="[{name: 'Absence', color: purple, values: col(m, 'rate')}]" suffix="%" [height]="160"
                   [extra]="ex('abs', m)" [ariaLabel]="'Absence rate per month' | t" (pick)="go(m[$event].drill)"></ceo-chart>
      </section>

      <!-- v1.17.0: labour cost per branch and per department of the period (headcount now is on HR operations) -->
      <section class="card" *ngIf="sec('ceo-costsplit', 'cost') as cs" data-widget="ceo-costsplit" data-widget-title="Cost by branch and department" data-widget-timed="1" data-widget-size="w">
        <div class="card-h"><h2>{{ 'Labour cost by branch and department' | t }}</h2><span class="muted small">{{ 'processed payroll of the period · select a line' | t }}</span></div>
        <p class="muted small" *ngIf="!cs.by_branch?.length">{{ 'No payroll has been processed for this period.' | t }}</p>
        <div class="split" *ngIf="cs.by_branch?.length">
          <div>
            <h3 class="sub">{{ 'By branch' | t }}</h3>
            <ul class="hbars">
              <li *ngFor="let r of cs.by_branch"><button type="button" (click)="go(r.drill)" [attr.data-cost]="r.value">
                <span class="hb-l">{{ r.label || ('No branch' | t) }}</span><span class="hb-t"><i [style.width.%]="r.value * 100 / maxOf(cs.by_branch)"></i></span><b>{{ r.value | zmoney:'1.0-0':false }}</b></button></li>
            </ul>
          </div>
          <div>
            <h3 class="sub">{{ 'By department' | t }}</h3>
            <ul class="hbars">
              <li *ngFor="let r of cs.by_department.slice(0, 8)"><button type="button" (click)="go(r.drill)" [attr.data-cost]="r.value">
                <span class="hb-l">{{ r.label || ('No department' | t) }}</span><span class="hb-t"><i [style.width.%]="r.value * 100 / maxOf(cs.by_department)"></i></span><b>{{ r.value | zmoney:'1.0-0':false }}</b></button></li>
            </ul>
          </div>
        </div>
        <p class="muted small" *ngIf="cs.by_branch?.length">{{ 'Total {0}' | t:(cs.total | zmoney:'1.0-0') }}</p>
      </section>
      <section class="card" *ngIf="sec('ceo-hiring', 'hiring') as h" data-widget="ceo-hiring" data-widget-title="Hiring" data-widget-timed="1">
        <!-- v1.17.0: open positions and offers are on HR operations (recruitment card); Management keeps the outcome -->
        <div class="card-h"><h2>{{ 'Hiring' | t }}</h2><button type="button" class="link" (click)="go(h.drill_hires)">{{ 'Time to hire' | t }}</button></div>
        <div class="funnel">
          <button type="button" (click)="goR('time-to-hire', 'ceo-hiring')"><b>{{ h.hires }}</b><span>{{ 'hired in the period' | t }}</span></button>
          <button type="button" (click)="goR('time-to-hire', 'ceo-hiring')"><b>{{ h.time_to_hire ?? '–' }}</b><span>{{ 'days to hire (average)' | t }}</span></button>
        </div>
        <button type="button" class="link" (click)="goR('source-effectiveness', 'ceo-hiring')">{{ 'Which sources hire best' | t }}</button>
      </section>
    </ng-container>
    </div>
  </div>`,
  styles: [`
    :host { display: block; --ink: #1B1640; --muted: #6B7185; --line: #E3E5EE; --page: #F4F5FA; --p: #5B4FE0; --pw: #ECEAFD; --bad: #A32626; }
    .ceo { padding: 20px 24px 40px; background: var(--page); min-height: 100%; color: #262A3D; font-size: 14px; }
    /* v1.16.0: below the top bar and next to the menu, like the other dashboards (.zdash.page) – the page title was hidden */
    .ceo { margin: 64px 0 0 235px; min-height: calc(100vh - 64px); }
    @media (max-width: 991.98px) { .ceo { margin: 54px 0 0 0; } }
    /* v1.17.0: inside Home – Home owns the page frame (scroll area, gutters) */
    .ceo.embedded { margin: 0; padding: 0; background: transparent; min-height: 0; }
    .ceo.embedded .ceo-h { align-items: center; margin-bottom: 10px; }
    .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 8px 20px; }
    h3.sub { font-size: 12.5px; font-weight: 600; color: var(--muted); margin: 0 0 4px; }
    .hbars b { white-space: nowrap; }
    .card .hbars button { grid-template-columns: minmax(0, 1.2fr) minmax(32px, 1fr) max-content; gap: 8px; }   /* the amount never runs into the next column */
    .split .hbars button { padding-inline: 2px; }
    /* v1.17.0 (audit M10): branch / department names wrap instead of being cut */
    .card .hbars .hb-l { white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; line-height: 1.25; }
    .tile, .kv, .funnel button, .hbars button { text-align: start; }
    .hbars b { text-align: end; }
    .ceo-h { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
    .eyebrow { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--p); font-weight: 600; }
    h1 { margin: 2px 0; font-size: 26px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; }
    h2 { margin: 0; font-size: 15px; font-weight: 500; color: var(--ink); }
    .muted { color: var(--muted); margin: 0; } .small { font-size: 12.5px; }
    .err { color: var(--bad); background: #FBE7E7; padding: 10px 12px; border-radius: 8px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filters label { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
    .filters input, .filters select { border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; background: #fff; font: inherit; color: #262A3D; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(176px, 1fr)); gap: 12px; }
    .zdd-board.busy { opacity: .55; }
    .t-now { font-style: normal; } .t-part { color: inherit; text-decoration: none; border-bottom: 1px dotted var(--muted); cursor: pointer; }
    .t-part + .t-part::before { content: ' / '; color: var(--muted); border: 0; }
    .t-n .t-part { display: block; width: fit-content; }   /* v1.17.0: gratuity and leave on their own lines */
    .t-n .t-part + .t-part::before { content: none; }
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
  branch: any = '';
  readonly purple = PURPLE;
  readonly amber = AMBER;
  readonly steps = P_STEPS;
  /** v1.16.0: dashboard period + cards with a period of their own (their section is loaded for that period) */
  readonly boardId = 'zdc-' + Math.random().toString(36).slice(2, 8);
  private dash: DashPeriod | null = null;
  private own: Record<string, DashPeriod> = {};
  private ownData: Record<string, any> = {};
  private seq = 0;
  private readonly SECTION: Record<string, string> = {
    'ceo-head': 'people', 'ceo-moves': 'people', 'ceo-pay': 'payroll', 'ceo-cost': 'payroll', 'ceo-ot': 'overtime', 'ceo-abs': 'absence', 'ceo-hiring': 'hiring',
    'ceo-costsplit': 'payroll',   // v1.17.0: sections.cost is computed with the payroll section
    'ceo-tiles': '',              // v1.17.0 (audit H1): the Key figures card with its own period reloads every tile
  };

  /** v1.17.0: inside Home (no page margins, Home has the title) */
  @Input() embedded = false;

  constructor(private svc: DashboardService, private router: Router, public cp: CountryPackService) {}

  ngOnInit(): void { this.dash = savedPeriod('ceo'); this.load(); }

  private params(p?: DashPeriod | null, card?: string): any {
    const q: any = {};
    if (p) { q.from = p.from; q.to = p.to; }
    if (this.branch) { q.branch = this.branch; }
    if (card) { q.card = card; }
    return q;
  }

  load(): void {
    this.loading = true;
    const seq = ++this.seq;
    this.svc.ceo(this.params(this.dash)).subscribe({
      next: d => { if (seq !== this.seq) { return; } this.d = d; this.loading = false; this.error = ''; this.ownData = {}; Object.keys(this.own).forEach(k => this.loadCard(k)); },
      error: e => { this.loading = false; this.error = e?.status === 403 ? (e?.error?.detail || 'The CEO dashboard is for company admins.') : 'The executive dashboard could not be loaded.'; },
    });
  }

  onPeriods(p: DashPeriods): void {
    const changed = !this.dash || this.dash.from !== p.dash.from || this.dash.to !== p.dash.to;
    this.dash = p.dash;
    const prev = this.own;
    this.own = {};
    Object.keys(this.SECTION).forEach(k => { if (p.cards[k]) { this.own[k] = p.cards[k]; } });
    if (changed) { this.load(); return; }
    Object.keys(this.SECTION).forEach(k => {
      const a = prev[k], b = this.own[k];
      if ((a?.from || '') + (a?.to || '') !== (b?.from || '') + (b?.to || '')) {
        if (b) { this.loadCard(k); } else { delete this.ownData[k]; }
      }
    });
  }

  private loadCard(k: string): void {
    const p = this.own[k];
    if (!p) { return; }
    this.svc.ceo(this.params(p, this.SECTION[k] || undefined)).subscribe({ next: x => (this.ownData[k] = x), error: () => {} });
  }

  /** A section as the card shows it: from the card's own period when it has one. */
  sec(card: string, name: string): any {
    const src = this.ownData[card] || this.d;
    const v = src?.sections?.[name];
    if (name === 'people') { return v?.trend ? v : null; }
    return v && !v.error ? v : null;
  }

  /** v1.17.0 (audit H1): the tiles of the Key figures card – from its own period when it has one. */
  tiles(): any[] { return (this.ownData['ceo-tiles'] || this.d)?.tiles || []; }

  /** The card's period (own or the dashboard's). */
  cardPer(card: string): any { const own = this.ownData[card]; return own?.period || this.d?.period; }
  /** v1.17.0: the last month of the trend, as the server named it (in the request language). */
  endLabel(p: any): string { const t = p?.trend || []; return t.length ? t[t.length - 1].label : ''; }
  /** v1.17.0: the attrition line opens the turnover report of the same 12 months as the attrition tile. */
  attrDrill(): any { return (this.d?.tiles || []).find((t: any) => t.key === 'attrition')?.drill; }

  lab(rows: any[]): string[] { return (rows || []).map(r => r.label); }
  col(rows: any[], k: string): number[] { return (rows || []).map(r => Number(r[k]) || 0); }
  maxOf(rows: any[]): number { return Math.max(1, ...(rows || []).map(r => r.value)); }
  /** Tooltip lines per chart. */
  ex(kind: string, rows: any[]): string[] {
    const n = (v: number) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const c = this.cp.currency().code;   // v1.14.0: company currency
    const T = (s: string, p: any[]) => i18nT(s, p);   // v1.17.0: tooltips in the user's language
    return (rows || []).map(x => kind === 'head' ? T('{0} joined · {1} left', [x.joined, x.left])
      : kind === 'turn' ? T('turnover {0}%', [x.attrition])
      : kind === 'pay' ? T('net {0} {1} · {2} payslips', [c, n(x.net), x.people])
      : kind === 'cost' ? T('total {0} {1} · {0} {2} per employee', [c, n(x.cost), n(x.per_employee)])
      : kind === 'ot' ? T(x.estimated ? '{0} hours · {1} {2} estimated at 125% / 150%' : '{0} hours · {1} {2} paid', [n(x.hours), c, n(x.cost)])
      : T('{0} absent days of {1} · leave {2}%', [x.absent, x.working, x.leave_rate]));
  }

  pct(a: number, b: number): number { return b ? Math.round((a * 100) / b) : 0; }
  abs(v: number): number { return Math.abs(v); }

  show(t: any): string {
    if (typeof t.value === 'string') { return t.value; }
    const n = Number(t.value) || 0;
    const c = this.cp.currency().code;   // v1.14.0
    if (t.money) { return c + ' ' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.abs(n) >= 1e4 ? Math.round(n / 1e3) + 'k' : n.toLocaleString('en-US', { maximumFractionDigits: 0 })); }
    return n.toLocaleString('en-US', { maximumFractionDigits: 1 }) + (t.unit && t.unit !== 'AED' && t.unit !== c ? (t.unit === '%' ? '%' : ' ' + t.unit) : '');
  }

  spark(vals: number[]): string {
    const max = Math.max(...vals), min = Math.min(...vals);
    const r = max - min || 1;
    return vals.map((v, i) => `${i ? 'L' : 'M'}${(i * 100 / (vals.length - 1)).toFixed(1)} ${(26 - ((v - min) / r) * 24).toFixed(1)}`).join(' ');
  }

  go(drill: any, ev?: Event): void {
    ev?.stopPropagation(); ev?.preventDefault();
    if (!drill?.report) { return; }
    const [path, q] = reportLink(drill);
    this.router.navigate([path], { queryParams: q });
  }

  goR(report: string, card?: string): void { const p = card ? this.cardPer(card) : this.d?.period; this.go({ report, from: p?.from, to: p?.to }); }
}
