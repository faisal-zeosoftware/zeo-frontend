import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';
import { MODULE_LINKS } from '../hr-modules/dashboards/dashboard.service';

/**
 * v1.27.0 – Group view (Premium and Enterprise): one view across the companies of a group.
 * Tabs by the person's group rights: Dashboard, Approvals, Notifications, Reports, Copy settings, Transfers, Group roles.
 * Every figure is read company by company on the server; opening an item opens it in its own company.
 */
const API = `${environment.apiBaseUrl}/group/api`;
const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);
type Tab = 'dashboard' | 'inbox' | 'feed' | 'reports' | 'copy' | 'transfer' | 'roles';
function errText(e: any, fb: string): string {
  const d = e?.error;
  if (d && typeof d === 'object' && d.detail) { return String(d.detail); }
  if (typeof d === 'string' && d.length < 300) { return d; }
  return T(fb);
}

@Component({
  selector: 'z-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe, ZDatePipe],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./group.component.css'],
  templateUrl: './group.component.html',
})
export class GroupComponent implements OnInit {
  key = '';
  group: any = null;
  tab: Tab = 'dashboard';
  error = '';
  busy = false;
  tabs: { key: Tab; label: string; right: string }[] = [
    { key: 'dashboard', label: 'Dashboard', right: 'dashboard' },
    { key: 'inbox', label: 'Approvals', right: 'inbox' },
    { key: 'feed', label: 'Notifications', right: 'inbox' },
    { key: 'reports', label: 'Reports', right: 'reports' },
    { key: 'copy', label: 'Copy settings', right: 'copy' },
    { key: 'transfer', label: 'Transfers', right: 'transfer' },
    { key: 'roles', label: 'Group roles', right: 'roles' },
  ];
  // dashboard
  dash: any = null;
  // inbox / feed
  inbox: any = null; feed: any = null;
  // reports
  reports: any[] = []; rkey = 'headcount'; rfrom = ''; rto = ''; rep: any = null; rbusy = false;
  // copy
  kinds: any[] = []; cpSource = ''; cpTargets: Record<string, boolean> = {}; cpKinds: Record<string, boolean> = {}; cpOverwrite = false;
  cpResult: any = null; cpHistory: any[] = [];
  // transfer
  trSource = ''; trTarget = ''; trQuery = ''; trEmps: any[] = []; trEmp: any = null; trForm: any = null; trOpts: any = {};
  trResult = ''; trHistory: any[] = [];
  // roles
  roles: any[] = []; members: any[] = []; roleUser: any = ''; roleKind = 'hr_head'; roleMsg = '';

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    const d = new Date();
    const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;   // local date (toISOString shifts a day east of UTC)
    this.rfrom = ymd(new Date(d.getFullYear(), d.getMonth(), 1));
    this.rto = ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    this.route.paramMap.subscribe(p => { this.key = p.get('key') || ''; this.start(); });
  }

  private start(): void {
    this.http.get<any>(`${API}/`).subscribe({
      next: r => {
        const gs: any[] = r.groups || [];
        this.group = gs.find(g => g.key === this.key) || (this.key ? null : gs.find(g => g.features));
        if (!this.group) { this.error = T('You have no access to this group.'); this.cd.markForCheck(); return; }
        if (!this.key) { this.router.navigate(['/group', this.group.key], { replaceUrl: true }); return; }
        if (!this.group.features) { this.error = this.group.locked || T('Group features are part of Premium and Enterprise.'); this.cd.markForCheck(); return; }
        const want = (this.route.snapshot.queryParamMap.get('tab') || 'dashboard') as Tab;
        this.open(this.can(want) ? want : 'dashboard');
      },
      error: e => { this.error = errText(e, 'The group could not be loaded.'); this.cd.markForCheck(); },
    });
  }

  can(t: Tab | string): boolean {
    const tab = this.tabs.find(x => x.key === t);
    return !!tab && (this.group?.rights || []).includes(tab.right);
  }
  shownTabs() { return this.tabs.filter(t => this.can(t.key)); }
  roleLabel(r: string): string {
    return T(({ owner: 'Owner', admin: 'Server administrator', hr_head: 'Group HR head', viewer: 'Group viewer' } as any)[r] || r);
  }

  open(t: Tab): void {
    this.tab = t; this.error = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t }, replaceUrl: true });
    if (t === 'dashboard' && !this.dash) { this.loadDash(false); }
    if (t === 'inbox') { this.loadInbox(); }
    if (t === 'feed') { this.loadFeed(); }
    if (t === 'reports' && !this.reports.length) { this.http.get<any>(`${API}/${this.key}/reports/`).subscribe({ next: r => { this.reports = r.reports || []; this.cd.markForCheck(); } }); }
    if (t === 'copy') { this.loadCopy(); }
    if (t === 'transfer') { this.loadTransfers(); }
    if (t === 'roles') { this.loadRoles(); }
    this.cd.markForCheck();
  }

  private get<T>(path: string, done: (r: T) => void, fb = 'That could not be loaded.'): void {
    this.busy = true;
    this.http.get<T>(`${API}/${this.key}/${path}`).subscribe({
      next: r => { this.busy = false; done(r); this.cd.markForCheck(); },
      error: e => { this.busy = false; this.error = errText(e, fb); this.cd.markForCheck(); },
    });
  }

  // ---------------- dashboard
  loadDash(fresh: boolean): void { this.get<any>(`dashboard/${fresh ? '?fresh=1' : ''}`, r => this.dash = r); }
  money(v: any): string { const n = Number(v || 0); return n.toLocaleString('en-US', { maximumFractionDigits: 0 }); }

  /** Open a company of the group (as the company list does), optionally on a page. */
  openCompany(schema: string, route = '/main-sidebar/home'): void {
    const c = (this.group?.companies || []).find((x: any) => x.schema_name === schema);
    if (!c) { return; }
    try {
      localStorage.setItem('selectedSchema', c.schema_name);
      localStorage.setItem('selectedSchemaId', String(c.id));
      localStorage.setItem('zeo:lastCompany', c.schema_name);
    } catch { /* storage blocked */ }
    window.location.href = route;
  }

  // ---------------- approvals and notifications
  loadInbox(): void { this.get<any>('inbox/', r => this.inbox = r); }
  age(d: string): string {
    if (!d) { return ''; }
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return days <= 0 ? T('today') : days === 1 ? T('1 day') : T('{0} days', days);
  }
  openApproval(i: any): void {
    const l = (MODULE_LINKS as any)[i.module] || {};
    this.openCompany(i.schema_name, l.adminApproval || l.admin || '/main-sidebar/home?tab=team');
  }
  loadFeed(): void { this.get<any>('feed/', r => this.feed = r); }
  readAll(): void {
    this.http.post<any>(`${API}/${this.key}/feed/`, {}).subscribe({ next: () => this.loadFeed() });
  }

  // ---------------- reports
  runReport(): void {
    this.rbusy = true; this.rep = null; this.error = '';
    const q = `?from=${this.rfrom}&to=${this.rto}`;
    this.http.get<any>(`${API}/${this.key}/reports/${this.rkey}/${q}`).subscribe({
      next: r => { this.rbusy = false; this.rep = r; this.cd.markForCheck(); },
      error: e => { this.rbusy = false; this.error = errText(e, 'The report could not be run.'); this.cd.markForCheck(); },
    });
  }
  cell(row: any, c: any): string {
    const v = row[c.key];
    if (v === null || v === undefined) { return ''; }
    if (typeof v === 'number') { return Number.isInteger(v) ? String(v) : v.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
    if (typeof v === 'object') { return JSON.stringify(v); }
    return String(v);
  }
  isNum(c: any): boolean { return ['number', 'money', 'int', 'float', 'amount', 'days'].includes(c.type); }
  excel(): void {
    const q = `?from=${this.rfrom}&to=${this.rto}&download=xlsx`;
    this.http.get(`${API}/${this.key}/reports/${this.rkey}/${q}`, { responseType: 'blob' }).subscribe({
      next: b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `group_${this.rkey}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); },
      error: e => { this.error = errText(e, 'The file could not be made.'); this.cd.markForCheck(); },
    });
  }

  // ---------------- copy settings
  loadCopy(): void {
    this.get<any>('copy/', r => {
      this.kinds = r.kinds || []; this.cpHistory = r.history || [];
      if (!Object.keys(this.cpKinds).length) { this.kinds.forEach(k => this.cpKinds[k.key] = ['leave_types', 'leave_policies'].includes(k.key)); }
      if (!this.cpSource && this.group.companies.length) { this.cpSource = this.group.companies[0].schema_name; }
    });
  }
  others(schema: string): any[] { return (this.group?.companies || []).filter((c: any) => c.schema_name !== schema); }
  copy(): void {
    const targets = Object.keys(this.cpTargets).filter(k => this.cpTargets[k] && k !== this.cpSource);
    const kinds = Object.keys(this.cpKinds).filter(k => this.cpKinds[k]);
    if (!targets.length || !kinds.length) { this.error = T('Choose what to copy and the companies to copy to.'); return; }
    this.busy = true; this.cpResult = null; this.error = '';
    this.http.post<any>(`${API}/${this.key}/copy/`, { source: this.cpSource, targets, kinds, overwrite: this.cpOverwrite }).subscribe({
      next: r => { this.busy = false; this.cpResult = r; this.loadCopy(); },
      error: e => { this.busy = false; this.error = errText(e, 'The settings could not be copied.'); this.cd.markForCheck(); },
    });
  }
  resultRows(res: any): { company: string; kind: string; r: any }[] {
    const out: any[] = [];
    Object.keys(res || {}).forEach(company => {
      const v = res[company];
      if (v?.error) { out.push({ company, kind: '', r: { error: v.error } }); return; }
      Object.keys(v || {}).forEach(kind => out.push({ company, kind, r: v[kind] }));
    });
    return out;
  }
  kindLabel(k: string): string { return (this.kinds.find(x => x.key === k) || {}).label || k; }
  kindsText(ks: string[]): string { return (ks || []).map(k => this.kindLabel(k)).join(', '); }

  // ---------------- transfers
  loadTransfers(): void {
    this.get<any>('transfer/', r => this.trHistory = r.history || []);
    if (!this.trSource && this.group.companies.length) { this.trSource = this.group.companies[0].schema_name; this.searchEmps(); }
  }
  searchEmps(): void {
    if (!this.trSource) { return; }
    this.http.get<any>(`${API}/${this.key}/transfer/employees/?schema=${encodeURIComponent(this.trSource)}&q=${encodeURIComponent(this.trQuery)}`)
      .subscribe({ next: r => { this.trEmps = r.employees || []; this.cd.markForCheck(); } });
  }
  pickEmp(e: any): void { this.trEmp = e; this.trForm = null; this.trResult = ''; this.loadForm(); }
  loadForm(): void {
    if (!this.trEmp || !this.trTarget) { return; }
    this.get<any>(`transfer/form/?source=${encodeURIComponent(this.trSource)}&employee=${this.trEmp.id}&target=${encodeURIComponent(this.trTarget)}`, r => {
      this.trForm = r; this.trOpts = { ...r.proposed, copy_salary: true };
    });
  }
  doTransfer(): void {
    if (!this.trOpts.branch) { this.error = T('Choose the branch in the target company.'); return; }
    this.busy = true; this.error = ''; this.trResult = '';
    const body = { ...this.trOpts, source: this.trSource, employee: this.trEmp.id, target: this.trTarget };
    this.http.post<any>(`${API}/${this.key}/transfer/`, body).subscribe({
      next: r => { this.busy = false; this.trResult = r.detail; this.trForm = null; this.trEmp = null; this.searchEmps(); this.loadTransfers(); this.dash = null; },
      error: e => { this.busy = false; this.error = errText(e, 'The transfer could not be made.'); this.cd.markForCheck(); },
    });
  }

  // ---------------- roles
  loadRoles(): void { this.get<any>('roles/', r => { this.roles = r.roles || []; this.members = r.members || []; }); }
  addRole(): void {
    if (!this.roleUser) { return; }
    this.busy = true; this.roleMsg = ''; this.error = '';
    this.http.post<any>(`${API}/${this.key}/roles/`, { user_id: this.roleUser, role: this.roleKind }).subscribe({
      next: r => { this.busy = false; this.roles = r.roles || []; this.roleUser = ''; this.roleMsg = T('Saved.'); this.cd.markForCheck(); },
      error: e => { this.busy = false; this.error = errText(e, 'The role could not be saved.'); this.cd.markForCheck(); },
    });
  }
  removeRole(r: any): void {
    this.busy = true; this.error = '';
    this.http.delete<any>(`${API}/${this.key}/roles/${r.id}/`).subscribe({
      next: x => { this.busy = false; this.roles = x.roles || []; this.cd.markForCheck(); },
      error: e => { this.busy = false; this.error = errText(e, 'The role could not be removed.'); this.cd.markForCheck(); },
    });
  }
}
