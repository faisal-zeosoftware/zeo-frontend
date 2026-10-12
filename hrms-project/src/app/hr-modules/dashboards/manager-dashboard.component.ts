import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, DrillRequest, MODULE_LINKS } from './dashboard.service';
import { DrillPanelComponent } from './drill-panel.component';
import { ZChartComponent } from './z-chart.component';
import { COUNTRY_PACK_UI } from '../../shared-ui/country-pack.service';   // v1.14.0
import { ZDashDesignerComponent } from '../../shared-ui/z-dash.component';   // v1.16.0
import { DashPeriod, DashPeriods, savedPeriod } from '../../shared-ui/z-dash-period';
import { recordUrl, employeeUrl } from '../../shared-ui/z-nav';
import { I18N_UI, i18nT } from '../../shared-ui/i18n.service';   // v1.17.0: zdate
import { ZStatusPipe } from '../../shared-ui/status-label';

/**
 * Manager / HR dashboard across all modules.
 * Every number and every bar opens the rows behind it; every person opens their 360 view.
 */
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, ZStatusPipe, CommonModule, FormsModule, DrillPanelComponent, ZChartComponent, ZDashDesignerComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./dashboards.css'],
})
export class ManagerDashboardComponent implements OnInit {
  @Input() embedded = false;   // inside the ESS page (no page title)
  @Input() inPortal = false;
  /** v1.17.0: the Team view of Home – the user's own team only (company figures are on HR operations / Management) */
  @Input() teamOnly = false;
  @Output() openTab = new EventEmitter<string>();
  /** layout name of the designer: Team view of Home, team inside My dashboard, the old manager page */
  get layoutName(): string { return this.teamOnly ? 'team' : this.embedded ? 'ess-team' : 'manager'; }

  d: any = null;
  error = '';
  scope = '';
  department: any = '';
  departments: any[] = [];
  drillReq: DrillRequest | null = null;
  loading = false;

  constructor(private svc: DashboardService, private router: Router) {}

  /** v1.16.0: the dashboard period and the cards with a period of their own (from the designer). */
  readonly boardId = 'zdm-' + Math.random().toString(36).slice(2, 8);
  private dash: DashPeriod | null = null;
  private own: Record<string, DashPeriod> = {};
  private seq = 0;
  /** card → the fields of the summary it shows (a card with its own period gets them from its own call) */
  private readonly FIELDS: Record<string, string[]> = {
    'm-trend': ['attendance_trend'], 'm-out': ['out_next_14', 'out_count'], 'm-celeb': ['celebrations'], 'm-ot': ['overtime'], 'm-pay': ['payroll'],
  };

  ngOnInit(): void {
    // the designer sits inside the loaded dashboard: start with the period saved on this device, the designer confirms it
    if (this.teamOnly) { this.scope = 'team'; }
    this.dash = savedPeriod(this.layoutName);
    this.load();
  }

  onPeriods(p: DashPeriods): void {
    const changed = !this.dash || this.dash.from !== p.dash.from || this.dash.to !== p.dash.to;
    this.dash = p.dash;
    const prev = this.own;
    this.own = {};
    Object.keys(this.FIELDS).forEach(k => { if (p.cards[k]) { this.own[k] = p.cards[k]; } });
    if (changed || !this.d) { this.load(); return; }
    Object.keys(this.FIELDS).forEach(k => {
      const a = prev[k], b = this.own[k];
      if ((a?.from || '') + (a?.to || '') !== (b?.from || '') + (b?.to || '')) { this.loadCard(k); }
    });
  }

  private per(p?: DashPeriod | null): Record<string, any> { return p ? { from: p.from, to: p.to } : {}; }

  load(): void {
    this.loading = true;
    const seq = ++this.seq;
    this.svc.team(this.scope || undefined, this.department || undefined, this.per(this.dash)).subscribe({
      next: d => {
        if (seq !== this.seq) { return; }
        this.d = d;
        this.scope = d.scope;
        this.loading = false;
        if (d.is_admin && !this.departments.length) { this.svc.departments().subscribe(x => (this.departments = x)); }
        Object.keys(this.own).forEach(k => this.loadCard(k));
      },
      error: e => { this.error = e?.error?.detail || 'Could not load the team dashboard.'; this.loading = false; },
    });
  }

  /** A card with its own period: the same summary for that period, only its fields are taken. */
  private loadCard(k: string): void {
    const p = this.own[k] || this.dash;
    this.svc.team(this.scope || undefined, this.department || undefined, this.per(p)).subscribe({
      next: x => { if (this.d) { this.FIELDS[k].forEach(f => (this.d[f] = x[f])); } },
      error: () => { /* keep what is shown */ },
    });
  }

  /** The period a card shows (its own or the dashboard's). */
  cardPeriod(k?: string): DashPeriod | null { return (k && this.own[k]) || this.dash; }

  setScope(s: string): void { this.scope = s; this.department = ''; this.load(); }

  p(extra: Record<string, any> = {}): Record<string, any> {
    return { scope: this.scope, department: this.department || '', ...extra };
  }

  drill(metric: string, title?: string, extra: Record<string, any> = {}, card?: string): void {
    this.drillReq = { metric, title, params: this.p({ ...this.per(this.cardPeriod(card)), ...extra }) };
  }

  /** v1.16.0: a line opens its record, a person their page. */
  openRec(x: any): void { if (x?._m) { this.router.navigateByUrl(recordUrl(x._m, x._id)); } }
  /** v1.17.0 (audit M12): in the Team view a manager opens the person's 360 view here (the employee master's family / job
   *  history tabs are for HR and fail for a line manager); HR / admins still open the employee record. */
  personId: number | null = null;
  openEmp(id: any): void {
    if (!id) { return; }
    if (this.inPortal || (this.teamOnly && !this.d?.is_admin)) { this.drillReq = null; this.personId = Number(id); return; }
    this.router.navigateByUrl(employeeUrl(id));
  }
  goUrl(u: string): void { if (!this.inPortal) { this.router.navigateByUrl(u); } }

  // charts
  // v1.17.0: day/month in digits (the same in every language; no English month names in Arabic)
  get trendLabels(): string[] { return (this.d?.attendance_trend || []).map((x: any) => `${String(x.date).slice(8, 10)}/${String(x.date).slice(5, 7)}`); }
  get trendValues(): number[] { return (this.d?.attendance_trend || []).map((x: any) => x.rate); }
  get trendExtra(): string[] { return (this.d?.attendance_trend || []).map((x: any) => i18nT('{0} present · {1} late · {2} on leave', [x.present, x.late, x.on_leave])); }
  pickDay(i: number): void {
    const x = this.d.attendance_trend[i];
    this.drill('attendance_day', i18nT('Present on {0}', [`${String(x.date).slice(8, 10)}/${String(x.date).slice(5, 7)}/${String(x.date).slice(0, 4)}`]), { date: x.date });
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

  /** v1.17.0: day/month in digits; a planner day opens the leave of that day (drill out_next, from = to = the day) */
  dm(d: any): string { return `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`; }
  planDay(p: any): void { this.drillReq = { metric: 'out_next', title: i18nT('Out on {0}', [`${this.dm(p.date)}/${String(p.date).slice(0, 4)}`]), params: this.p({ from: p.date, to: p.date }) }; }
  get planMax(): number { return Math.max(1, ...((this.d?.planner || []).map((p: any) => p.out))); }
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
