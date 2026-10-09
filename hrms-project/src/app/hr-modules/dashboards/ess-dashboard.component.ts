import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZDashDesignerComponent } from '../../shared-ui/z-dash.component';
import { Router } from '@angular/router';
import { DashboardService, DrillRequest, MODULE_LINKS } from './dashboard.service';
import { DrillPanelComponent } from './drill-panel.component';
import { ManagerDashboardComponent } from './manager-dashboard.component';

/**
 * Employee self-service home: today, 30-day attendance ribbon, leave, requests in every module,
 * pay, documents, appraisal, training. Managers get a "My team" view on the same page.
 * Inside the ESS portal (openTab) switches the portal tab; in the HR app it routes.
 */
@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [CommonModule, DrillPanelComponent, ManagerDashboardComponent, ZDashDesignerComponent],
  templateUrl: './ess-dashboard.component.html',
  styleUrls: ['./dashboards.css'],
})
export class EssDashboardComponent implements OnInit {
  @Input() inPortal = false;
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

  ngOnInit(): void { this.load(); }

  load(): void {
    this.svc.ess().subscribe({ next: d => (this.d = d), error: e => (this.error = e?.error?.detail || 'Could not load your dashboard. Check that you are logged in to a company.') });
  }

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

  cellTitle(t: any): string {
    const day = new Date(t.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
    const s = t.status === 'present' ? (t.hours ? `${t.hours} h${t.late ? ', late' : ''}` : `checked in${t.late ? ', late' : ''}, not out yet`) : t.status === 'off' ? 'weekend' : t.status;
    return `${day}: ${s}`;
  }

  get filteredRequests(): any[] {
    const all = this.d?.requests?.recent || [];
    return this.moduleFilter ? all.filter((r: any) => r.module === this.moduleFilter) : all;
  }

  pct(b: any): number { return b.openings ? Math.max(0, Math.min(100, (b.balance * 100) / b.openings)) : 0; }

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
  reqClass(s: string): string { return s === 'pending' ? 'pill warn' : s === 'rejected' ? 'pill bad' : 'pill good'; }
}
