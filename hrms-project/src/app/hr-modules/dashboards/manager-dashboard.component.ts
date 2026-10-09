import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, DrillRequest, MODULE_LINKS } from './dashboard.service';
import { DrillPanelComponent } from './drill-panel.component';
import { ZChartComponent } from './z-chart.component';

/**
 * Manager / HR dashboard across all modules.
 * Every number and every bar opens the rows behind it; every person opens their 360 view.
 */
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DrillPanelComponent, ZChartComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./dashboards.css'],
})
export class ManagerDashboardComponent implements OnInit {
  @Input() embedded = false;   // inside the ESS page (no page title)
  @Input() inPortal = false;
  @Output() openTab = new EventEmitter<string>();

  d: any = null;
  error = '';
  scope = '';
  department: any = '';
  departments: any[] = [];
  drillReq: DrillRequest | null = null;
  loading = false;

  constructor(private svc: DashboardService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.team(this.scope || undefined, this.department || undefined).subscribe({
      next: d => {
        this.d = d;
        this.scope = d.scope;
        this.loading = false;
        if (d.is_admin && !this.departments.length) { this.svc.departments().subscribe(x => (this.departments = x)); }
      },
      error: e => { this.error = e?.error?.detail || 'Could not load the team dashboard.'; this.loading = false; },
    });
  }

  setScope(s: string): void { this.scope = s; this.department = ''; this.load(); }

  p(extra: Record<string, any> = {}): Record<string, any> {
    return { scope: this.scope, department: this.department || '', ...extra };
  }

  drill(metric: string, title?: string, extra: Record<string, any> = {}): void {
    this.drillReq = { metric, title, params: this.p(extra) };
  }

  // charts
  get trendLabels(): string[] { return (this.d?.attendance_trend || []).map((x: any) => new Date(x.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })); }
  get trendValues(): number[] { return (this.d?.attendance_trend || []).map((x: any) => x.rate); }
  get trendExtra(): string[] { return (this.d?.attendance_trend || []).map((x: any) => `${x.present} present · ${x.late} late · ${x.on_leave} on leave`); }
  pickDay(i: number): void {
    const x = this.d.attendance_trend[i];
    this.drill('attendance_day', `Present on ${new Date(x.date).toLocaleDateString('en-GB')}`, { date: x.date });
  }

  get compLabels(): string[] { return (this.d?.composition?.rows || []).map((x: any) => x.label); }
  get compValues(): number[] { return (this.d?.composition?.rows || []).map((x: any) => x.count); }
  pickComp(i: number): void {
    const r = this.d.composition.rows[i];
    this.drill('headcount', r.label, this.d.composition.by === 'department' ? { group_department: r.key } : { group_designation: r.key });
  }

  get perfRows(): any[] { return this.d?.performance?.rows || []; }
  get perfMax(): number { return Math.max(1, ...this.perfRows.map((r: any) => r.count)); }

  get payLabels(): string[] { return (this.d?.payroll || []).map((x: any) => x.label); }
  get payValues(): number[] { return (this.d?.payroll || []).map((x: any) => Math.round(x.net)); }
  get payExtra(): string[] { return (this.d?.payroll || []).map((x: any) => `gross ${Math.round(x.gross).toLocaleString()} · deductions ${Math.round(x.deductions).toLocaleString()}`); }
  pickPay(i: number): void { const r = this.d.payroll[i]; this.drill('payroll_run', `Payslips – ${r.label}`, { run: r.run_id }); }

  get otMax(): number { return Math.max(1, ...((this.d?.overtime?.top || []).map((t: any) => t.hours))); }
  get ratingMax(): number { return Math.max(1, ...((this.d?.ratings?.rows || []).map((r: any) => r.count))); }

  get sumOpen(): number { return (this.d?.team_open_requests || []).reduce((a: number, r: any) => a + r.count, 0); }

  get apprMax(): number { return Math.max(1, ...((this.d?.approvals?.by_module || []).map((r: any) => r.count))); }

  pctOf(n: number): number { return this.d?.headcount ? Math.round((n * 100) / this.d.headcount) : 0; }

  go(ev: { module: string; kind: 'request' | 'approval' }): void {
    const link = MODULE_LINKS[ev.module] || {};
    const tab = ev.kind === 'approval' ? link.essApproval : link.ess;
    if (this.inPortal && tab) { this.drillReq = null; this.openTab.emit(tab); return; }
    const route = ev.kind === 'approval' ? (link.adminApproval || link.admin) : link.admin;
    if (route) { this.drillReq = null; this.router.navigateByUrl(route); }
  }
}
