import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZPeriodBarComponent, ZPeriodPick } from '../shared-ui/z-period-bar.component';   // v1.22.0
import { Router } from '@angular/router';
import { HEALTH_LABEL, PRIORITY_CLASS, ZP_BASE, ZpApiService, day, minutes, money, num, slaText } from './zp-api.service';

/** Management dashboard (v1.14.0): support, AMC, projects and employee productivity for a period. */
@Component({
  selector: 'app-zp-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ZPeriodBarComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Projects dashboard</h1><p class="ex-desc">Support, AMC contracts, project delivery and team workload. Click a figure to open the list behind it.</p></div>
        <div class="ex-actions">
          <!-- v1.22.0: HRMS period presets and branch -->
          <z-period-bar name="projects" defaultPreset="last_30" (changed)="period($event)"></z-period-bar></div>
      </div>
      <div class="ex-tabs">
        <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.k" (click)="tab = t.k">{{ t.l }}</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <p class="ex-muted" *ngIf="!d && !msg">Loading…</p>
      <ng-container *ngIf="d">
        <!-- headline -->
        <div class="ex-tiles" *ngIf="tab === 'all'">
          <button type="button" class="ex-tile" (click)="go(['tickets'], { view: 'open' })"><div class="lbl">Open tickets</div><div class="num">{{ s.open }}</div><div class="amt">{{ s.unassigned }} unassigned · {{ s.critical_open }} critical</div></button>
          <button type="button" class="ex-tile t2" (click)="go(['tickets'], { view: 'breached' })"><div class="lbl">SLA breached</div><div class="num" [style.color]="s.breached_open ? '#b42318' : null">{{ s.breached_open }}</div>
            <div class="amt">compliance {{ s.sla_compliance_pct ?? '–' }}% in the period</div></button>
          <button type="button" class="ex-tile t3" *ngIf="a" (click)="go(['renewals'])"><div class="lbl">AMCs expiring in 30 days</div><div class="num">{{ a.expiring_30 }}</div><div class="amt">{{ a.renewals_pending }} renewals pending</div></button>
          <button type="button" class="ex-tile t4" (click)="go(['projects'])"><div class="lbl">Active projects</div><div class="num">{{ p.active }}</div><div class="amt">{{ p.delayed }} delayed · {{ p.at_risk }} at risk</div></button>
        </div>

        <!-- support -->
        <ng-container *ngIf="tab === 'all' || tab === 'support'">
          <div class="zp-section">Support · {{ dd(d.from) }} – {{ dd(d.to) }}</div>
          <div class="ex-tiles" *ngIf="tab === 'support'">
            <div class="ex-tile"><div class="lbl">Received / resolved</div><div class="num">{{ s.received }} / {{ s.resolved }}</div><div class="amt">{{ s.waiting_customer }} waiting for customers</div></div>
            <div class="ex-tile t3"><div class="lbl">Avg. first response</div><div class="num" style="font-size:20px">{{ mi(s.avg_first_response_min) }}</div><div class="amt">clock time</div></div>
            <div class="ex-tile t2"><div class="lbl">Avg. resolution</div><div class="num" style="font-size:20px">{{ mi(s.avg_resolution_min) }}</div><div class="amt">{{ s.reopened }} reopened</div></div>
            <div class="ex-tile t4"><div class="lbl">Customer satisfaction</div><div class="num">{{ s.csat_avg ?? '–' }}<small style="font-size:14px"> / 5</small></div><div class="amt">{{ s.csat_count }} rating(s)</div></div>
          </div>
          <div class="ex-grid2">
            <div class="ex-panel">
              <div class="ex-h">Received vs resolved per week<button type="button" class="zp-rlink" (click)="rep('received-resolved')">Full report ›</button></div>
              <div class="zp-cols"><div class="c" *ngFor="let w of s.weekly" [title]="'Week of ' + dd(w.week) + ': ' + w.received + ' received, ' + w.resolved + ' resolved'">
                <div class="rec" [style.height.%]="pct(w.received, maxWeek())"></div><div class="res" [style.height.%]="pct(w.resolved, maxWeek())"></div></div></div>
              <div class="zp-legend"><span><i style="background:#a5b4fc"></i>Received</span><span><i style="background:#10b981"></i>Resolved</span></div>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Open tickets by engineer<button type="button" class="zp-rlink" (click)="rep('open-tickets', { group: 'employee' })">Full report ›</button></div>
              <div class="zp-hbar" *ngFor="let r of s.by_employee"><span class="l">{{ r.label }}</span><div class="zp-meter"><div [style.width.%]="pct(r.n, mx(s.by_employee))"></div></div><span class="n">{{ r.n }}</span></div>
              <p class="zp-empty" *ngIf="!s.by_employee.length">No open tickets.</p>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Open by priority · team<button type="button" class="zp-rlink" (click)="rep('open-tickets', { group: 'priority' })">Full report ›</button></div>
              <div class="zp-hbar" *ngFor="let r of s.by_priority"><span class="l">{{ cap(r.label) }}</span><div class="zp-meter" [class.bad]="r.label === 'critical'" [class.warn]="r.label === 'high'"><div [style.width.%]="pct(r.n, mx(s.by_priority))"></div></div><span class="n">{{ r.n }}</span></div>
              <hr style="border-color:#f0f1f6">
              <div class="zp-hbar" *ngFor="let r of s.by_team"><span class="l">{{ r.label }}</span><div class="zp-meter"><div [style.width.%]="pct(r.n, mx(s.by_team))"></div></div><span class="n">{{ r.n }}</span></div>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Open by customer<button type="button" class="zp-rlink" (click)="rep('open-tickets', { group: 'customer' })">Full report ›</button></div>
              <div class="zp-hbar" *ngFor="let r of s.by_customer"><span class="l">{{ r.label }}</span><div class="zp-meter"><div [style.width.%]="pct(r.n, mx(s.by_customer))"></div></div><span class="n">{{ r.n }}</span></div>
            </div>
          </div>
          <div class="ex-panel" *ngIf="s.breached_list.length" style="margin-top:14px">
            <div class="ex-h">Breached tickets<button type="button" class="zp-rlink" (click)="rep('sla-breaches')">Full report ›</button></div>
            <div class="ex-rows"><div class="ex-row click" *ngFor="let t of s.breached_list" (click)="go(['tickets', t.id])">
              <div class="main"><div class="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</div><div class="s">{{ t.customer_name }} · {{ t.assigned_to?.name || 'unassigned' }}</div></div>
              <div class="r"><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span><span class="zp-b sla-breached">{{ sla(t) }}</span></div></div></div>
          </div>
        </ng-container>

        <!-- AMC -->
        <ng-container *ngIf="a && (tab === 'all' || tab === 'amc')">
          <div class="zp-section">AMC contracts</div>
          <div class="ex-tiles">
            <button type="button" class="ex-tile" (click)="go(['contracts'])"><div class="lbl">Active contracts</div><div class="num">{{ a.active }}</div><div class="amt">{{ m(a.contract_value) }}</div></button>
            <button type="button" class="ex-tile t2" (click)="go(['renewals'])"><div class="lbl">Expiring 30 / 60 / 90 d</div><div class="num">{{ a.expiring_30 }} / {{ a.expiring_60 }} / {{ a.expiring_90 }}</div><div class="amt">{{ a.expired }} expired, not renewed</div></button>
            <div class="ex-tile t3"><div class="lbl">Renewal rate</div><div class="num">{{ a.renewal_rate_pct ?? '–' }}%</div><div class="amt">{{ a.renewed_in_period }} renewed · {{ a.lost_in_period }} lost</div></div>
            <div class="ex-tile t4"><div class="lbl">Hours used / included</div><div class="num" style="font-size:20px">{{ n(a.hours_used) }} / {{ n(a.hours_included) }}</div><div class="amt">{{ n(a.hours_remaining) }} h left · {{ a.unlimited_contracts }} unlimited</div></div>
          </div>
          <div class="ex-grid2">
            <div class="ex-panel">
              <div class="ex-h">Lowest margin contracts<button type="button" class="zp-rlink" (click)="rep('amc-profit')">Full report ›</button></div>
              <div class="zp-scroll"><table class="zp-table"><tr><th>Contract</th><th class="r">Revenue</th><th class="r">Cost</th><th class="r">Margin</th></tr>
                <tr class="click" *ngFor="let c of a.by_profit" (click)="go(['contracts', c.id])"><td>{{ c.number }}<div class="zp-muted">{{ c.customer_name }}</div></td>
                  <td class="r">{{ m(c.revenue) }}</td><td class="r">{{ m(c.cost) }}</td><td class="r" [style.color]="c.margin < 0 ? '#b42318' : null">{{ m(c.margin) }}</td></tr></table></div>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Ending soon<button type="button" class="zp-rlink" (click)="rep('amc-expiring')">Full report ›</button></div>
              <div class="ex-rows"><div class="ex-row click" *ngFor="let c of a.expiring_list" (click)="go(['contracts', c.id])">
                <div class="main"><div class="t">{{ c.number }} · {{ c.customer_name }}</div><div class="s">ends {{ dd(c.end_date) }} · {{ c.renewal_status_label }}</div></div>
                <div class="r"><span class="ex-tag" [class.rejected]="c.days_left < 0" [class.pending]="c.days_left >= 0">{{ c.days_left >= 0 ? c.days_left + ' d' : 'expired' }}</span></div></div></div>
              <p class="zp-empty" *ngIf="!a.expiring_list.length">Nothing ends in the next 90 days.</p>
            </div>
          </div>
        </ng-container>

        <!-- projects -->
        <ng-container *ngIf="tab === 'all' || tab === 'projects'">
          <div class="zp-section">Projects</div>
          <div class="ex-tiles">
            <div class="ex-tile t3"><div class="lbl">On track</div><div class="num">{{ p.on_track }}</div><div class="amt">{{ p.done }} completed</div></div>
            <div class="ex-tile t2"><div class="lbl">At risk / delayed</div><div class="num">{{ p.at_risk }} / {{ p.delayed }}</div><div class="amt">{{ p.milestones_overdue }} milestone(s) overdue</div></div>
            <div class="ex-tile"><div class="lbl">Planned vs actual hours</div><div class="num" style="font-size:20px">{{ n(p.planned_hours) }} / {{ n(p.actual_hours) }}</div><div class="amt">open projects</div></div>
            <div class="ex-tile t4"><div class="lbl">Open tasks</div><div class="num">{{ p.tasks_open }}</div><div class="amt">{{ p.tasks_overdue }} overdue</div></div>
          </div>
          <div class="ex-grid2">
            <div class="ex-panel">
              <div class="ex-h">Projects needing attention<button type="button" class="zp-rlink" (click)="rep('project-status')">Full report ›</button></div>
              <div class="zp-scroll"><table class="zp-table"><tr><th>Project</th><th>Health</th><th class="r">Hours</th><th class="r">Margin</th></tr>
                <tr class="click" *ngFor="let r of p.projects" (click)="go(['projects', r.id])"><td>{{ r.title }}<div class="zp-muted">ends {{ dd(r.end_date) || '–' }}</div></td>
                  <td><span class="zp-b" [ngClass]="'h-' + r.health">{{ hl[r.health] }}</span></td>
                  <td class="r">{{ r.actual_hours !== undefined ? n(r.actual_hours) + ' / ' + n(r.budget_hours) : '–' }}</td>
                  <td class="r">{{ r.margin !== undefined ? m(r.margin) : '–' }}</td></tr></table></div>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Pending tasks by employee<button type="button" class="zp-rlink" (click)="rep('tasks-by-employee')">Full report ›</button></div>
              <div class="zp-hbar" *ngFor="let r of p.pending_by_employee"><span class="l">{{ r.label }}</span><div class="zp-meter" [class.warn]="r.late"><div [style.width.%]="pct(r.n, mx(p.pending_by_employee))"></div></div><span class="n">{{ r.n }}</span></div>
              <div class="ex-h" style="margin-top:12px">Overdue milestones<button type="button" class="zp-rlink" (click)="rep('milestones-overdue')">Full report ›</button></div>
              <div class="ex-rows"><div class="ex-row click" *ngFor="let ms of p.overdue_milestones" (click)="go(['projects', ms.project_id])">
                <div class="main"><div class="t">{{ ms.name }}</div><div class="s">{{ ms.project_title }} · planned {{ dd(ms.planned_date) }}</div></div></div></div>
              <p class="zp-empty" *ngIf="!p.overdue_milestones.length">None.</p>
            </div>
          </div>
        </ng-container>

        <!-- productivity -->
        <ng-container *ngIf="tab === 'all' || tab === 'people'">
          <div class="zp-section">Employee productivity · {{ d.productivity.work_days }} working days, {{ n(d.productivity.available_hours_per_person) }} h available each
            <button type="button" class="zp-rlink" (click)="rep('utilisation')">Full report ›</button></div>
          <div class="ex-panel">
            <div class="zp-scroll"><table class="zp-table">
              <tr><th>Employee</th><th class="r">Support h</th><th class="r">Project h</th><th class="r">Billable h</th><th>Billable utilisation</th><th class="r">Logs waiting</th></tr>
              <tr *ngFor="let e of d.productivity.employees"><td>{{ e.label }}</td><td class="r">{{ n(e.support_hours) }}</td><td class="r">{{ n(e.project_hours) }}</td>
                <td class="r">{{ n(e.billable_hours) }}</td>
                <td style="min-width:160px"><div class="zp-hbar" style="grid-template-columns:minmax(0,1fr) 46px;margin:0"><div class="zp-meter" [class.ok]="(e.utilisation_pct || 0) >= 70" [class.warn]="(e.utilisation_pct || 0) < 50"><div [style.width.%]="cap100(e.utilisation_pct)"></div></div><span class="n">{{ e.utilisation_pct ?? '–' }}%</span></div></td>
                <td class="r">{{ e.worklogs_waiting || '' }}</td></tr>
            </table></div>
            <p class="zp-empty" *ngIf="!d.productivity.employees.length">No time recorded in the period.</p>
          </div>
        </ng-container>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class ZpDashboardComponent implements OnInit {
  d: any = null;
  s: any = {};
  a: any = null;
  p: any = {};
  msg = '';
  from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);
  tab = 'all';
  tabs = [{ k: 'all', l: 'Overview' }, { k: 'support', l: 'Support' }, { k: 'amc', l: 'AMC' }, { k: 'projects', l: 'Projects' }, { k: 'people', l: 'People' }];
  pc = PRIORITY_CLASS;
  hl = HEALTH_LABEL;
  constructor(private api: ZpApiService, private router: Router) {}
  ngOnInit(): void { /* the period bar loads the dashboard */ }
  branch: number | null = null;
  period(p: ZPeriodPick): void { this.from = p.from; this.to = p.to; this.branch = p.branch; this.load(); }
  async load(): Promise<void> {
    try {
      this.d = await this.api.get('dashboard/', { from: this.from, to: this.to, branch: this.branch || '' });
      this.s = this.d.support || {}; this.a = this.d.amc || null; this.p = this.d.projects || {}; this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  rep(key: string, q: any = {}): void {
    const period = ['received-resolved', 'response-times', 'sla-breaches', 'reopened-csat', 'amc-renewals', 'utilisation'].includes(key) ? { from: this.from, to: this.to } : {};
    const b = this.branch ? { branch: this.branch } : {};
    this.router.navigate([ZP_BASE, 'reports', key], { queryParams: { ...period, ...b, ...q } });
  }
  go(path: any[], q?: any): void {
    const b = this.branch ? { branch: this.branch } : {};   // v1.22.0: the dashboard branch goes with the figure
    this.router.navigate([ZP_BASE, ...path], { queryParams: { ...(q || {}), ...b } });
  }
  mx(rows: any[]): number { return Math.max(1, ...rows.map(r => r.n)); }
  maxWeek(): number { return Math.max(1, ...(this.s.weekly || []).map((w: any) => Math.max(w.received, w.resolved))); }
  pct(a: number, b: number): number { return b ? Math.round(a * 100 / b) : 0; }
  cap100(v: any): number { return Math.min(100, Number(v || 0)); }
  cap(s: string): string { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  sla(t: any): string { return slaText(t); }
  m(v: any): string { return money(v, this.d?.currency || 'AED'); }
  n(v: any): string { return num(v); }
  mi(v: any): string { return minutes(v); }
  dd(v: any): string { return day(v); }
}
