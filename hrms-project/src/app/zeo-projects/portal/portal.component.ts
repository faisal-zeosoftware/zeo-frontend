import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { day, money, when } from '../zp-api.service';

const SCHEMA_KEY = 'zpPortalSchema';
const TOKEN_KEY = 'auth_token';   // same key as AuthenticationService, so the auth interceptor sends it

/** Customer portal API (/zeo-projects/api/portal/...) for the company the contact logged in to. v1.14.0 */
@Injectable({ providedIn: 'root' })
export class PortalApiService {
  readonly api = environment.apiBaseUrl;
  me: any = null;
  constructor(private http: HttpClient, private router: Router) {}

  get schema(): string { return localStorage.getItem(SCHEMA_KEY) || ''; }
  url(path: string, q: Record<string, any> = {}): string {
    let s = `schema=${encodeURIComponent(this.schema)}`;
    Object.entries(q).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') s += `&${k}=${encodeURIComponent(String(v))}`; });
    return `${this.api}/zeo-projects/api/portal/${path}?${s}`;
  }
  async call<T = any>(p: Promise<T>): Promise<T> {
    try { return await p; } catch (e: any) {
      if (e?.status === 401) { this.logout(); }
      throw e;
    }
  }
  get<T = any>(path: string, q: Record<string, any> = {}): Promise<T> { return this.call(firstValueFrom(this.http.get<T>(this.url(path, q)))); }
  post<T = any>(path: string, body: any = {}): Promise<T> { return this.call(firstValueFrom(this.http.post<T>(this.url(path), body))); }

  async login(company: string, username: string, password: string): Promise<void> {
    const tok: any = await firstValueFrom(this.http.post(`${this.api}/users/token/`, { username, password }));
    localStorage.setItem(TOKEN_KEY, tok.access);
    let sch = (company || '').trim();
    if (!sch) {
      const u: any = await firstValueFrom(this.http.get(`${this.api}/users/api/user/${tok.user_id}/`));
      sch = (u.allocated_tenants || [])[0]?.schema_name || '';
    }
    localStorage.setItem(SCHEMA_KEY, sch);
    try { this.me = await this.get('me/'); }
    catch (e) { localStorage.removeItem(TOKEN_KEY); throw e; }
  }
  async loadMe(): Promise<any> { this.me = await this.get('me/'); return this.me; }
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.me = null;
    this.router.navigate(['/portal/login'], { queryParams: { c: this.schema || null } });
  }
  async download(f: any): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(`files/${f.id}/`), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  static error(e: any, fallback = 'It could not be done.'): string {
    const b = e?.error;
    if (e?.status === 401) return 'The user name or password is not correct.';
    if (!b) return e?.message || fallback;
    if (typeof b === 'string') return b.length > 300 ? fallback : b;
    if (b.detail) return b.detail;
    return Object.entries(b).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('\n') || fallback;
  }
}

const STAGE_TAG: Record<string, string> = { waiting_customer: 'wait', resolved: 'done', closed: 'done', reopened: 'bad' };

/** Portal login. Link: <app>/#/portal/login?c=<company code>. */
@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-login">
  <form class="box" (ngSubmit)="go()">
    <h1>Customer portal</h1>
    <p>Follow your support tickets, maintenance contracts and projects.</p>
    <div class="pt-note err" *ngIf="err">{{ err }}</div>
    <div class="pt-form">
      <label>Company code<input [(ngModel)]="company" name="c" placeholder="Given in your invitation e-mail" autocomplete="organization"></label>
      <label>User name (e-mail)<input [(ngModel)]="username" name="u" autocomplete="username" required></label>
      <label>Password<input type="password" [(ngModel)]="password" name="p" autocomplete="current-password" required></label>
      <button type="submit" class="pt-btn primary" [disabled]="busy || !username || !password">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </div>
  </form>
</div>`,
})
export class PortalLoginComponent implements OnInit {
  company = '';
  username = '';
  password = '';
  err = '';
  busy = false;
  constructor(private api: PortalApiService, private router: Router, private route: ActivatedRoute) {}
  ngOnInit(): void { this.company = this.route.snapshot.queryParamMap.get('c') || localStorage.getItem(SCHEMA_KEY) || ''; }
  async go(): Promise<void> {
    this.busy = true; this.err = '';
    try { await this.api.login(this.company, this.username.trim(), this.password); this.router.navigate(['/portal/tickets']); }
    catch (e: any) { this.err = e?.status === 403 ? 'This login is not a customer portal login, or the company code is wrong.' : PortalApiService.error(e, 'Sign-in failed.'); }
    this.busy = false;
  }
}

/** Portal frame: customer header and navigation. */
@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-top" *ngIf="api.me">
  <div class="in">
    <div class="pt-brand">
      <div class="co">{{ api.me.company }} <span style="font-weight:400;color:#c7c3f3;font-size:14px">· customer portal</span></div>
      <div class="who">{{ api.me.contact.name }} · {{ api.me.customer.name }}<button type="button" (click)="api.logout()">Sign out</button></div>
    </div>
    <nav class="pt-nav">
      <a [class.on]="on('tickets')" (click)="nav('tickets')">Tickets <span class="cnt" *ngIf="api.me.counts.waiting_you">{{ api.me.counts.waiting_you }}</span></a>
      <a [class.on]="on('contracts')" (click)="nav('contracts')">Contracts</a>
      <a [class.on]="on('projects')" (click)="nav('projects')">Projects</a>
      <a [class.on]="on('approvals')" (click)="nav('approvals')">Approvals <span class="cnt" *ngIf="api.me.counts.approvals">{{ api.me.counts.approvals }}</span></a>
      <a *ngIf="api.me.show_invoices" [class.on]="on('invoices')" (click)="nav('invoices')">Invoices</a>
      <a [class.on]="on('account')" (click)="nav('account')">Account</a>
    </nav>
  </div>
</div>
<div class="pt-main" *ngIf="api.me"><router-outlet></router-outlet></div>
<div class="pt-main" *ngIf="!api.me && err"><div class="pt-note err">{{ err }}</div></div>`,
})
export class PortalShellComponent implements OnInit {
  err = '';
  private url = '';
  constructor(public api: PortalApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.url = this.router.url;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => { this.url = e.urlAfterRedirects; this.api.loadMe().catch(() => null); });
    if (!localStorage.getItem(TOKEN_KEY) || !this.api.schema) { this.api.logout(); return; }
    try { await this.api.loadMe(); } catch (e: any) { if (e?.status === 403 || e?.status === 401) this.api.logout(); else this.err = PortalApiService.error(e); }
  }
  on(p: string): boolean { return this.url.startsWith('/portal/' + p); }
  nav(p: string): void { this.router.navigate(['/portal', p]); }
}

/** Portal: my tickets + new ticket. */
@Component({
  selector: 'app-portal-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Support tickets</h1><p>{{ api.me?.contact.role === 'manager' ? 'All tickets of ' + api.me?.customer.name : 'Tickets you raised' }}</p></div>
  <button type="button" class="pt-btn primary" (click)="creating = !creating">{{ creating ? 'Close' : '+ New ticket' }}</button></div>
<div class="pt-card" *ngIf="creating">
  <h2>New ticket</h2>
  <div class="pt-note err" *ngIf="err">{{ err }}</div>
  <div class="pt-form">
    <label class="wide">Subject *<input [(ngModel)]="f.subject" maxlength="255" placeholder="Short summary of the problem"></label>
    <label>Product / service<select [(ngModel)]="f.product"><option [ngValue]="null">Not sure</option><option *ngFor="let p of api.me?.products" [ngValue]="p.id">{{ p.name }}</option></select></label>
    <label>Priority<select [(ngModel)]="f.priority"><option *ngFor="let p of api.me?.priorities" [value]="p.value">{{ p.label }}</option></select></label>
    <label class="wide">Details<textarea [(ngModel)]="f.description" placeholder="What happened? Since when? Error message, screenshots…"></textarea></label>
    <label class="wide">Attachments<input type="file" multiple (change)="files = list($any($event.target).files)"></label>
    <div class="wide"><button type="button" class="pt-btn primary" (click)="create()" [disabled]="busy">Send</button></div>
  </div>
</div>
<div class="pt-tabs"><button type="button" [class.on]="open === '1'" (click)="open = '1'; load()">Open</button><button type="button" [class.on]="open === '0'" (click)="open = '0'; load()">Closed</button>
  <button type="button" [class.on]="open === ''" (click)="open = ''; load()">All</button></div>
<div class="pt-card">
  <div class="pt-row" *ngFor="let t of rows" (click)="openT(t.id)">
    <div class="m"><div class="t">{{ t.subject }}</div><div class="s">{{ t.number }} · {{ t.product_name || 'General' }} · {{ w(t.created_at) }}{{ t.contact_name ? ' · ' + t.contact_name : '' }}</div></div>
    <span class="pt-tag" [ngClass]="tag(t.stage)">{{ t.stage === 'waiting_customer' ? 'Waiting for you' : t.stage_label }}</span>
  </div>
  <p class="pt-muted" *ngIf="!rows.length">No tickets here.</p>
</div>`,
})
export class PortalTicketsComponent implements OnInit {
  rows: any[] = [];
  open = '1';
  creating = false;
  f: any = { subject: '', description: '', product: null, priority: 'medium' };
  files: File[] = [];
  err = '';
  busy = false;
  constructor(public api: PortalApiService, private router: Router) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> { this.rows = await this.api.get('tickets/', { open: this.open }).catch(() => []); }
  list(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }
  async create(): Promise<void> {
    if (!this.f.subject.trim()) { this.err = 'Write a subject.'; return; }
    this.busy = true; this.err = '';
    const fd = new FormData();
    Object.entries(this.f).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    this.files.forEach(x => fd.append('files', x, x.name));
    try { const t = await this.api.post('tickets/', fd); this.openT(t.id); } catch (e) { this.err = PortalApiService.error(e); }
    this.busy = false;
  }
  openT(id: number): void { this.router.navigate(['/portal/tickets', id]); }
  tag(s: string): string { return STAGE_TAG[s] || 'open'; }
  w(v: any): string { return when(v); }
}

/** Portal: one ticket – conversation, reply, confirm / reopen, rating. */
@Component({
  selector: 'app-portal-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h" *ngIf="t"><div><h1>{{ t.subject }}</h1><p>{{ t.number }} · {{ t.priority_label }} priority · opened {{ w(t.created_at) }}</p></div>
  <button type="button" class="pt-btn" (click)="back()">← All tickets</button></div>
<div class="pt-note err" *ngIf="err">{{ err }}</div>
<ng-container *ngIf="t">
  <div class="pt-note" *ngIf="t.stage === 'waiting_customer'">We are waiting for your reply to continue.</div>
  <div class="pt-note ok" *ngIf="t.stage === 'resolved'"><b>Resolved:</b> {{ t.resolution_note }}<br>Please confirm the solution works, or reopen the ticket.
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="pt-btn green" (click)="act('confirm')">Yes, it works – close it</button>
      <button type="button" class="pt-btn" (click)="reopening = true">No, reopen</button></div></div>
  <div class="pt-grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr)">
    <div>
      <div class="pt-card">
        <h2>Your request</h2>
        <div style="white-space:pre-wrap;font-size:14px">{{ t.description || '(no details)' }}</div>
        <button type="button" class="pt-file" *ngFor="let f of t.files" (click)="api.download(f)">📎 {{ f.name }}</button>
      </div>
      <div class="pt-card">
        <h2>Conversation</h2>
        <div class="pt-msg" *ngFor="let m of t.messages" [class.us]="m.from_customer" [class.them]="!m.from_customer">
          <div class="w">{{ m.author }}<small>{{ w(m.at) }}</small></div><div class="b">{{ m.body }}</div>
          <button type="button" class="pt-file" *ngFor="let f of m.files" (click)="api.download(f)">📎 {{ f.name }}</button>
        </div>
        <p class="pt-muted" *ngIf="!t.messages.length">No messages yet. Our team will reply here.</p>
        <div class="pt-form" style="margin-top:12px" *ngIf="t.stage !== 'closed' || reopening">
          <label class="wide">{{ reopening ? 'Why are you reopening it?' : 'Reply' }}<textarea [(ngModel)]="body"></textarea></label>
          <label class="wide"><input type="file" multiple (change)="files = list($any($event.target).files)" style="height:auto;border:0;padding:0"></label>
          <div class="wide" style="display:flex;gap:8px"><button type="button" class="pt-btn primary" (click)="reopening ? act('reopen') : act('reply')" [disabled]="busy || (!body.trim() && !files.length)">{{ reopening ? 'Reopen ticket' : 'Send' }}</button>
            <button type="button" class="pt-btn" *ngIf="reopening" (click)="reopening = false">Cancel</button></div>
        </div>
        <button type="button" class="pt-btn" style="margin-top:10px" *ngIf="t.stage === 'closed' && !reopening" (click)="reopening = true">Reopen this ticket</button>
      </div>
    </div>
    <div>
      <div class="pt-card"><h2>Status</h2>
        <dl class="pt-kv"><dt>Stage</dt><dd><span class="pt-tag" [ngClass]="tag(t.stage)">{{ t.stage_label }}</span></dd>
          <dt>Handled by</dt><dd>{{ t.assigned_name || 'Being assigned' }}</dd>
          <dt>Product</dt><dd>{{ t.product_name || '–' }}</dd><dt>Contract</dt><dd>{{ t.contract_number || '–' }}</dd>
          <dt>Billing</dt><dd>{{ t.billable_label }}</dd>
          <dt>Target reply</dt><dd>{{ w(t.response_due) || '–' }}</dd><dt>Target fix</dt><dd>{{ w(t.resolution_due) || '–' }}</dd></dl></div>
      <div class="pt-card" *ngIf="t.can_rate || t.satisfaction"><h2>How did we do?</h2>
        <div class="pt-stars"><button type="button" *ngFor="let s of [1,2,3,4,5]" [class.on]="(rating || t.satisfaction) >= s" (click)="t.can_rate && (rating = s)" [disabled]="!t.can_rate">★</button></div>
        <ng-container *ngIf="t.can_rate"><div class="pt-form" style="grid-template-columns:1fr;margin-top:8px"><label>Comment<textarea [(ngModel)]="note" style="min-height:60px"></textarea></label>
          <button type="button" class="pt-btn primary" [disabled]="!rating" (click)="rate()">Send rating</button></div></ng-container></div>
      <div class="pt-card"><h2>History</h2>
        <div class="pt-muted" *ngFor="let e of t.events" style="padding:4px 0;border-bottom:1px solid #f0f1f6">{{ e.text }}<br><small>{{ w(e.at) }}</small></div></div>
    </div>
  </div>
</ng-container>`,
})
export class PortalTicketComponent implements OnInit {
  t: any = null;
  body = '';
  files: File[] = [];
  reopening = false;
  rating = 0;
  note = '';
  err = '';
  busy = false;
  constructor(public api: PortalApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void { this.route.paramMap.subscribe(() => this.load()); }
  async load(): Promise<void> {
    try { this.t = await this.api.get(`tickets/${this.route.snapshot.paramMap.get('id')}/`); this.err = ''; } catch (e) { this.err = PortalApiService.error(e); }
  }
  async act(action: string): Promise<void> {
    this.busy = true;
    const fd = new FormData();
    fd.append('action', action); fd.append('body', this.body);
    this.files.forEach(x => fd.append('files', x, x.name));
    try { this.t = await this.api.post(`tickets/${this.t.id}/`, fd); this.body = ''; this.files = []; this.reopening = false; this.err = ''; }
    catch (e) { this.err = PortalApiService.error(e); }
    this.busy = false;
  }
  async rate(): Promise<void> {
    try { this.t = await this.api.post(`tickets/${this.t.id}/`, { action: 'rate', satisfaction: this.rating, note: this.note }); } catch (e) { this.err = PortalApiService.error(e); }
  }
  list(fl: FileList | null): File[] { return fl ? Array.from(fl) : []; }
  back(): void { this.router.navigate(['/portal/tickets']); }
  tag(s: string): string { return STAGE_TAG[s] || 'open'; }
  w(v: any): string { return when(v); }
}

/** Portal: maintenance contracts with hours used / left. */
@Component({
  selector: 'app-portal-contracts',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Maintenance contracts</h1><p>Your AMC contracts, what they cover and the support hours used.</p></div></div>
<div class="pt-grid">
  <div class="pt-card" *ngFor="let c of rows">
    <h2>{{ c.title }}</h2>
    <div class="pt-muted">{{ c.number }} · <span class="pt-tag" [class.done]="c.status === 'active'" [class.wait]="c.status === 'expiring'" [class.bad]="c.status === 'expired'">{{ c.status_label }}</span></div>
    <dl class="pt-kv" style="margin-top:10px"><dt>Period</dt><dd>{{ d(c.start_date) }} – {{ d(c.end_date) }}</dd>
      <dt>Type</dt><dd>{{ c.contract_type_label }} · {{ c.support_timing === '24x7' ? '24/7' : 'business hours' }}</dd>
      <dt>Covers</dt><dd>{{ names(c.products) || 'All our services' }}</dd><dt>Not covered</dt><dd>{{ c.exclusions || '–' }}</dd>
      <dt>Account mgr</dt><dd>{{ c.account_manager_name || '–' }}</dd></dl>
    <ng-container *ngIf="c.usage">
      <ng-container *ngIf="!c.usage.unlimited; else unl">
        <div class="pt-meter" [class.warn]="(c.usage.used_pct || 0) > 80" [class.bad]="(c.usage.used_pct || 0) >= 100"><div [style.width.%]="min(c.usage.used_pct)"></div></div>
        <div class="pt-muted">{{ c.usage.used_hours }} of {{ c.usage.included_hours }} support hours used · {{ c.usage.remaining_hours }} left</div>
      </ng-container>
      <ng-template #unl><div class="pt-muted" style="margin-top:8px">Unlimited support · {{ c.usage.used_hours }} hours used</div></ng-template>
      <div class="pt-muted">{{ c.usage.open_tickets }} open of {{ c.usage.tickets }} tickets</div>
    </ng-container>
  </div>
</div>
<p class="pt-muted" *ngIf="!rows.length">No contracts.</p>`,
})
export class PortalContractsComponent implements OnInit {
  rows: any[] = [];
  constructor(private api: PortalApiService) {}
  async ngOnInit(): Promise<void> { this.rows = await this.api.get('contracts/').catch(() => []); }
  names(p: any[]): string { return (p || []).map(x => x.name).join(', '); }
  d(v: any): string { return day(v); }
  min(v: any): number { return Math.min(100, Number(v || 0)); }
}

/** Portal: projects with progress and milestones. */
@Component({
  selector: 'app-portal-projects',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Projects</h1><p>Progress, milestones and change requests of your projects.</p></div></div>
<div class="pt-card" *ngFor="let p of rows">
  <h2>{{ p.title }} <span class="pt-tag" [class.done]="p.health === 'on_track' || p.health === 'done'" [class.wait]="p.health === 'at_risk'" [class.bad]="p.health === 'delayed'">{{ hl(p.health) }}</span></h2>
  <div class="pt-muted">{{ p.number }} · {{ p.type }} · {{ d(p.start_date) }} – {{ d(p.end_date) || 'open' }} · {{ p.status }}</div>
  <div class="pt-meter"><div [style.width.%]="p.progress_pct"></div></div>
  <div class="pt-muted">{{ p.progress_pct }}% of tasks done ({{ p.tasks_done }} / {{ p.tasks_total }})</div>
  <table class="pt-table" style="margin-top:12px" *ngIf="p.milestones.length">
    <tr><th>Milestone</th><th>Planned</th><th>Status</th><th>Accepted</th></tr>
    <tr *ngFor="let m of p.milestones"><td>{{ m.name }}<div class="pt-muted">{{ m.description }}</div></td><td>{{ d(m.planned_date) }}</td>
      <td><span class="pt-tag" [class.done]="m.status === 'accepted'" [class.wait]="m.status === 'ready'" [class.bad]="m.status === 'rejected'">{{ m.status === 'ready' ? 'Waiting for your acceptance' : m.status_label }}</span></td>
      <td class="pt-muted">{{ m.accepted_by }} {{ d(m.accepted_at) }}</td></tr>
  </table>
  <div *ngIf="p.change_requests.length" style="margin-top:10px"><b style="font-size:13px">Change requests</b>
    <div class="pt-muted" *ngFor="let c of p.change_requests">{{ c.number }} {{ c.title }} – {{ c.status_label }}</div></div>
</div>
<p class="pt-muted" *ngIf="!rows.length">No projects.</p>`,
})
export class PortalProjectsComponent implements OnInit {
  rows: any[] = [];
  constructor(private api: PortalApiService) {}
  async ngOnInit(): Promise<void> { this.rows = await this.api.get('projects/').catch(() => []); }
  hl(h: string): string { return ({ on_track: 'On track', at_risk: 'At risk', delayed: 'Delayed', done: 'Done' } as any)[h] || h; }
  d(v: any): string { return day(v); }
}

/** Portal: approvals – milestones (UAT sign-off), change requests, development quotations, task approvals. */
@Component({
  selector: 'app-portal-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Approvals</h1><p>Sign off delivered milestones, extra work and development quotations.</p></div></div>
<div class="pt-note" *ngIf="d && !d.can_approve">Your login can see these items, but only your company's approving contact can approve them.</div>
<div class="pt-note err" *ngIf="err">{{ err }}</div>
<div class="pt-note ok" *ngIf="ok">{{ ok }}</div>
<ng-container *ngIf="d">
  <div class="pt-card" *ngFor="let m of d.milestones">
    <h2>Milestone: {{ m.name }}</h2><div class="pt-muted">{{ m.project_title }} · planned {{ dd(m.planned_date) }}</div>
    <p style="white-space:pre-wrap;font-size:14px">{{ m.description }}</p>
    <ng-container *ngTemplateOutlet="act; context: { kind: 'milestone', id: m.id }"></ng-container>
  </div>
  <div class="pt-card" *ngFor="let c of d.change_requests">
    <h2>Change request {{ c.number }}: {{ c.title }}</h2><div class="pt-muted">{{ c.project_title }}</div>
    <p style="white-space:pre-wrap;font-size:14px">{{ c.description }}</p>
    <dl class="pt-kv"><dt>Extra effort</dt><dd>{{ c.extra_hours }} hours, {{ c.extra_days }} day(s) on the plan</dd><dt>Extra cost</dt><dd>{{ m(c.extra_amount) }}</dd></dl>
    <ng-container *ngTemplateOutlet="act; context: { kind: 'change', id: c.id }"></ng-container>
  </div>
  <div class="pt-card" *ngFor="let x of d.dev_requests">
    <h2>Development {{ x.number }}: {{ x.title }}</h2><div class="pt-muted">For ticket {{ x.ticket_number }}</div>
    <p style="white-space:pre-wrap;font-size:14px"><b>Problem:</b> {{ x.issue }}\n<b>Proposed solution:</b> {{ x.proposed_solution }}</p>
    <dl class="pt-kv"><dt>Effort</dt><dd>{{ x.estimated_hours }} hours</dd><dt>Price</dt><dd>{{ x.chargeable ? m(x.quoted_amount ?? x.estimated_cost) : 'No charge' }}</dd></dl>
    <ng-container *ngTemplateOutlet="act; context: { kind: 'dev', id: x.id }"></ng-container>
  </div>
  <p class="pt-muted" *ngIf="!d.milestones.length && !d.change_requests.length && !d.dev_requests.length">Nothing waits for your approval.</p>
</ng-container>
<ng-template #act let-kind="kind" let-id="id">
  <div class="pt-form" style="margin-top:10px" *ngIf="d.can_approve">
    <label class="wide">Comment (required when you reject)<textarea [(ngModel)]="notes[kind + id]" style="min-height:60px"></textarea></label>
    <div class="wide" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="pt-btn green" (click)="decide(kind, id, true)">Approve</button>
      <button type="button" class="pt-btn danger" (click)="decide(kind, id, false)">Reject</button></div>
  </div>
</ng-template>`,
})
export class PortalApprovalsComponent implements OnInit {
  d: any = null;
  notes: Record<string, string> = {};
  err = '';
  ok = '';
  constructor(private api: PortalApiService) {}
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> { try { this.d = await this.api.get('approvals/'); } catch (e) { this.err = PortalApiService.error(e); } }
  async decide(kind: string, id: number, approve: boolean): Promise<void> {
    const note = this.notes[kind + id] || '';
    if (!approve && !note.trim()) { this.err = 'Please write why you reject it.'; return; }
    this.err = ''; this.ok = '';
    try { this.d = await this.api.post('approvals/', { kind, id, approve, note }); this.ok = approve ? 'Approved – thank you.' : 'Rejected – we will contact you.'; await this.api.loadMe(); }
    catch (e) { this.err = PortalApiService.error(e); }
  }
  m(v: any): string { return money(v); }
  dd(v: any): string { return day(v); }
}

/** Portal: invoices (AMC and project milestones). */
@Component({
  selector: 'app-portal-invoices',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Invoices</h1><p>Invoices for your maintenance contracts and projects.</p></div>
  <div class="pt-card" style="margin:0;padding:10px 16px" *ngIf="d"><div class="pt-muted">Outstanding</div><b style="font-size:18px">{{ m(d.outstanding) }}</b></div></div>
<div class="pt-note err" *ngIf="err">{{ err }}</div>
<div class="pt-card" *ngIf="d" style="overflow-x:auto">
  <table class="pt-table">
    <tr><th>Invoice</th><th>Date</th><th>For</th><th class="r">Amount</th><th>Status</th></tr>
    <tr *ngFor="let r of d.invoices"><td>{{ r.invoice_no }}</td><td>{{ dd(r.invoice_date) }}</td><td>{{ r.kind }} · {{ r.reference }}<div class="pt-muted">{{ r.description }}</div></td>
      <td class="r">{{ m(r.amount, r.currency) }}</td><td><span class="pt-tag" [class.done]="r.status === 'paid'" [class.wait]="r.status !== 'paid'">{{ r.status === 'paid' ? 'Paid ' + dd(r.paid_date) : 'Due' }}</span></td></tr>
  </table>
  <p class="pt-muted" *ngIf="!d.invoices.length">No invoices yet.</p>
</div>`,
})
export class PortalInvoicesComponent implements OnInit {
  d: any = null;
  err = '';
  constructor(private api: PortalApiService) {}
  async ngOnInit(): Promise<void> { try { this.d = await this.api.get('invoices/'); } catch (e) { this.err = PortalApiService.error(e); } }
  m(v: any, c?: string): string { return money(v, c); }
  dd(v: any): string { return day(v); }
}

/** Portal: change password. */
@Component({
  selector: 'app-portal-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-h"><div><h1>Account</h1><p>{{ api.me?.contact.name }} · {{ api.me?.contact.email }}</p></div></div>
<div class="pt-card" style="max-width:520px">
  <h2>Change password</h2>
  <div class="pt-note err" *ngIf="err">{{ err }}</div><div class="pt-note ok" *ngIf="ok">{{ ok }}</div>
  <div class="pt-form" style="grid-template-columns:1fr">
    <label>Current password<input type="password" [(ngModel)]="cur" autocomplete="current-password"></label>
    <label>New password (8+ characters, letters and digits)<input type="password" [(ngModel)]="nw" autocomplete="new-password"></label>
    <label>New password again<input type="password" [(ngModel)]="nw2" autocomplete="new-password"></label>
    <button type="button" class="pt-btn primary" (click)="save()">Change password</button>
  </div>
</div>`,
})
export class PortalAccountComponent {
  cur = ''; nw = ''; nw2 = ''; err = ''; ok = '';
  constructor(public api: PortalApiService) {}
  async save(): Promise<void> {
    this.err = ''; this.ok = '';
    if (this.nw !== this.nw2) { this.err = 'The new passwords are not the same.'; return; }
    try { await this.api.post('password/', { current: this.cur, new: this.nw }); this.ok = 'Password changed.'; this.cur = this.nw = this.nw2 = ''; }
    catch (e) { this.err = PortalApiService.error(e); }
  }
}
