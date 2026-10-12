import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZDashDesignerComponent } from '../../shared-ui/z-dash.component';
import { Router } from '@angular/router';
import { DashboardService, DrillRequest, MODULE_LINKS } from './dashboard.service';
import { DrillPanelComponent } from './drill-panel.component';
import { ManagerDashboardComponent } from './manager-dashboard.component';
import { COUNTRY_PACK_UI } from '../../shared-ui/country-pack.service';   // v1.14.0
import { ZStatusPipe } from '../../shared-ui/status-label';   // v1.15.1
import { DashPeriod, DashPeriods, savedPeriod } from '../../shared-ui/z-dash-period';   // v1.16.0
import { recordUrl } from '../../shared-ui/z-nav';
import { I18N_UI, i18nT } from '../../shared-ui/i18n.service';   // v1.17.0: t / zdate

/**
 * Employee self-service home: today, 30-day attendance ribbon, leave, requests in every module,
 * pay, documents, appraisal, training. Managers get a "My team" view on the same page.
 * Inside the ESS portal (openTab) switches the portal tab; in the HR app it routes.
 */
@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, CommonModule, DrillPanelComponent, ManagerDashboardComponent, ZDashDesignerComponent, ZStatusPipe],   // v1.15.1: zstatus
  templateUrl: './ess-dashboard.component.html',
  styleUrls: ['./dashboards.css'],
})
export class EssDashboardComponent implements OnInit {
  @Input() inPortal = false;
  /** v1.17.0: the My view of Home (Home has the greeting and the Team tab) */
  @Input() embedded = false;
  @Output() openTab = new EventEmitter<string>();

  d: any = null;
  error = '';
  view: 'me' | 'team' = 'me';
  drillReq: DrillRequest | null = null;
  moduleFilter = '';
  readonly ribbonLegend = [
    { key: 'present', label: 'Present' }, { key: 'late', label: 'Late' }, { key: 'leave', label: 'Leave' },
    { key: 'open', label: 'In, not out yet' }, { key: 'absent', label: 'Absent' }, { key: 'off', label: 'Weekend' },
  ];

  constructor(private svc: DashboardService, private router: Router) {}

  /** v1.16.0: dashboard period, cards with their own period, one board for drag & drop */
  readonly boardId = 'zde-' + Math.random().toString(36).slice(2, 8);
  private dash: DashPeriod | null = null;
  private own: Record<string, DashPeriod> = {};
  private seq = 0;
  private readonly FIELDS: Record<string, string[]> = { 'ess-attendance': ['attendance', 'attendance_trend', 'overtime'], 'ess-pay': ['payslip'] };

  ngOnInit(): void { this.dash = savedPeriod('ess'); this.load(); }

  private per(p?: DashPeriod | null): Record<string, any> { return p ? { from: p.from, to: p.to } : {}; }

  load(): void {
    const seq = ++this.seq;
    this.svc.ess(this.per(this.dash)).subscribe({
      next: d => { if (seq !== this.seq) { return; } this.d = d; Object.keys(this.own).forEach(k => this.loadCard(k)); },
      error: e => (this.error = e?.error?.detail || 'Could not load your dashboard. Check that you are logged in to a company.'),
    });
  }

  onPeriods(p: DashPeriods): void {
    const changed = !this.dash || this.dash.from !== p.dash.from || this.dash.to !== p.dash.to;
    this.dash = p.dash;
    const prev = this.own;
    this.own = {};
    Object.keys(this.FIELDS).forEach(k => { if (p.cards[k]) { this.own[k] = p.cards[k]; } });
    if (changed) { this.load(); return; }
    Object.keys(this.FIELDS).forEach(k => {
      const a = prev[k], b = this.own[k];
      if ((a?.from || '') + (a?.to || '') !== (b?.from || '') + (b?.to || '')) { this.loadCard(k); }
    });
  }

  private loadCard(k: string): void {
    this.svc.ess(this.per(this.own[k] || this.dash)).subscribe({ next: x => { if (this.d) { this.FIELDS[k].forEach(f => (this.d[f] = x[f])); } }, error: () => {} });
  }

  /** drill parameters: the card's period (and a status filter) / one day */
  perParams(card: string, status?: string): Record<string, any> {
    const p = this.own[card] || this.dash;
    return { ...(p ? { from: p.from, to: p.to } : {}), ...(status ? { status } : {}) };
  }
  dayParams(d: any): Record<string, any> { const x = String(d).slice(0, 10); return { from: x, to: x }; }

  /** a line opens its record (the drill-down list inside the ESS portal) */
  openRec(x: any): void {
    if (!x?._m) { return; }
    if (this.inPortal) { this.drill('my_documents', 'My documents'); return; }
    this.router.navigateByUrl(this.ownPage(x._m) || recordUrl(x._m, x._id));
  }
  openReq(r: any): void {
    if (this.inPortal || !r?._m) { this.drill('my_requests', r.module_label + ' requests', { module: r.module }); return; }
    this.router.navigateByUrl(this.ownPage(r._m) || recordUrl(r._m, r._id));
  }
  /** v1.17.0 (audit L10): an employee's own payslip / document / leave opens in Self service (not the report centre record view,
   *  whose side menu has no pages for an employee). Records of other people (approvals) keep the record view. */
  private ownPage(m: string): string | null {
    const SELF: Record<string, string> = {
      'PayrollManagement.Payslip': '/main-sidebar/self-service/payslips', 'EmpManagement.Emp_Documents': '/main-sidebar/self-service/documents',
      'calendars.employee_leave_request': '/main-sidebar/self-service/leave', 'EmpManagement.emp_master': '/main-sidebar/self-service/documents',
    };
    return this.embedded || !this.inPortal ? SELF[m] || null : null;
  }
  /** approvals of other people: their record */
  openOther(x: any): void { if (x?._m) { this.router.navigateByUrl(recordUrl(x._m, x._id)); } }
  goUrl(u: string): void { if (!this.inPortal) { this.router.navigateByUrl(u); } }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  initials(n: string): string {
    return (n || '?').split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  }

  get firstName(): string { return (this.d?.employee?.name || '').split(' ')[0]; }

  cellClass(t: any): string {
    if (t.status === 'present') { return 'cell ' + (t.late ? 'late' : 'present') + (t.hours ? '' : ' open'); }
    return 'cell ' + t.status;
  }

  cellTitle(t: any): string {   // v1.17.0: digits for the day, words through the language pack
    const x = String(t.date);
    const day = `${x.slice(8, 10)}/${x.slice(5, 7)}`;
    const s = t.status === 'present' ? (t.hours ? i18nT(t.late ? '{0} h, late' : '{0} h', [t.hours]) : i18nT(t.late ? 'Checked in, late, not out yet' : 'Checked in, not out yet'))
      : i18nT(({ off: 'Weekend', absent: 'Absent', leave: 'Leave', today: 'Not marked yet' } as any)[t.status] || t.status);
    return `${day}: ${s}`;
  }

  get filteredRequests(): any[] {
    const all = this.d?.requests?.recent || [];
    return this.moduleFilter ? all.filter((r: any) => r.module === this.moduleFilter) : all;
  }

  /** v1.17.0: share left of the entitlement (opening balance), or of balance + taken when no opening balance is recorded ("23.5 of 0 days" before) */
  pct(b: any): number { const tot = Number(b.openings) || (Number(b.balance) + Number(b.used || 0)); return tot ? Math.max(0, Math.min(100, (b.balance * 100) / tot)) : 0; }

  drill(metric: string, title?: string, params: Record<string, any> = {}): void {
    this.drillReq = { metric, title, params };
  }

  go(ev: { module: string; kind: 'request' | 'approval' }): void {
    const link = MODULE_LINKS[ev.module] || {};
    const tab = ev.kind === 'approval' ? link.essApproval : link.ess;
    if (this.inPortal && tab) { this.drillReq = null; this.openTab.emit(tab); return; }
    const route = ev.kind === 'approval' ? (link.adminApproval || link.admin) : link.admin;
    if (route) { this.drillReq = null; this.router.navigateByUrl(route); }
  }

  newRequest(module: string): void { this.go({ module, kind: 'request' }); }

  /** A task opens its page (project tasks / the record a to-do was planned on); in the ESS portal the list of all tasks. */
  openTask(t: any): void {
    if (this.inPortal || !t?.link) { this.drill('my_tasks', 'My tasks and to-dos'); return; }
    this.router.navigateByUrl(t.link);
  }

  docClass(x: any): string { return x.state === 'expired' ? 'pill bad' : x.state === 'expiring' ? 'pill warn' : 'pill good'; }

  // ---------------------------------------------------------------- v1.17.1: company policies, entitlements, my shift
  busy = false;
  msg = '';
  msgErr = false;
  polClass(p: any): string { return p.state === 'acknowledged' ? 'pill good' : p.state === 'overdue' ? 'pill bad' : p.state === 'to_acknowledge' ? 'pill warn' : 'pill'; }

  /** the policy file through the employee API (OrgStructure my-policies/<id>/file/) */
  openPolicy(p: any, ev?: Event): void {
    ev?.stopPropagation();
    this.svc.policyFile(p.id).subscribe({
      next: blob => { const u = URL.createObjectURL(blob); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 60000); },
      error: () => { this.msg = 'The document could not be opened. Ask HR for a copy.'; this.msgErr = true; },
    });
  }

  /** acknowledge the current version (OrgStructure my-policies/<id>/acknowledge/), then reload the dashboard */
  ackPolicy(p: any, ev?: Event): void {
    ev?.stopPropagation();
    if (!confirm(i18nT('Confirm that you have read and accept “{0}”?', [p.title]))) { return; }
    this.busy = true;
    this.svc.ackPolicy(p.id).subscribe({
      next: () => { this.busy = false; this.msg = 'Thank you – the policy is acknowledged.'; this.msgErr = false; this.load(); },
      error: e => { this.busy = false; this.msg = e?.error?.detail || 'It could not be confirmed. Try again.'; this.msgErr = true; },
    });
  }

  limitText(x: any): string {
    const n = (v: number) => Number(v).toLocaleString('en', { maximumFractionDigits: 2 });
    const parts: string[] = [];
    if (x.per_expense !== null && x.per_expense !== undefined) { parts.push(i18nT('{0} per expense', [n(x.per_expense)])); }
    if (x.per_day !== null && x.per_day !== undefined) { parts.push(i18nT('{0} a day', [n(x.per_day)])); }
    if (x.per_report !== null && x.per_report !== undefined) { parts.push(i18nT('{0} per report', [n(x.per_report)])); }
    return parts.length ? parts.join(' · ') : i18nT('No limit');
  }

  shiftText(s: any): string {
    if (!s?.known) { return i18nT('No shift set'); }
    return s.off ? i18nT('Day off') : `${s.start} – ${s.end}`;
  }

  /** the leave types with days in the policy: the first 4, all on request */
  allLeave = false;
  leaveLines(lines: any[]): any[] { const l = (lines || []).filter(x => x.days); return this.allLeave ? l : l.slice(0, 4); }
  leaveMore(lines: any[]): number { const n = (lines || []).filter(x => x.days).length; return n > 4 ? n : 0; }

  dayName(d: any): string { return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(String(d).slice(0, 10) + 'T12:00:00').getDay()]; }
  reqClass(s: string): string { return s === 'pending' ? 'pill warn' : s === 'rejected' ? 'pill bad' : 'pill good'; }
}
