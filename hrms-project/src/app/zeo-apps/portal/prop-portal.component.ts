import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule, Routes } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { day, money, when } from '../za-api.service';

const SCHEMA_KEY = 'zpropPortalSchema';
const TOKEN_KEY = 'auth_token';   // same key as AuthenticationService, so the auth interceptor sends it

/** Tenant / owner / buyer portal API (/zeo-property/api/portal/...). v1.18.0 */
@Injectable({ providedIn: 'root' })
export class PropPortalApi {
  me: any = null;
  constructor(private http: HttpClient, private router: Router) {}
  get schema(): string { return localStorage.getItem(SCHEMA_KEY) || ''; }
  url(path: string): string { return `${environment.apiBaseUrl}/zeo-property/api/portal/${path}?schema=${encodeURIComponent(this.schema)}`; }
  private async call<T>(p: Promise<T>): Promise<T> {
    try { return await p; } catch (e: any) { if (e?.status === 401) this.logout(); throw e; }
  }
  get<T = any>(path: string): Promise<T> { return this.call(firstValueFrom(this.http.get<T>(this.url(path)))); }
  post<T = any>(path: string, body: any = {}): Promise<T> { return this.call(firstValueFrom(this.http.post<T>(this.url(path), body))); }

  async login(company: string, username: string, password: string): Promise<void> {
    const tok: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/users/token/`, { username, password }));
    localStorage.setItem(TOKEN_KEY, tok.access);
    let sch = (company || '').trim();
    if (!sch) {
      const u: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/users/api/user/${tok.user_id}/`));
      sch = (u.allocated_tenants || [])[0]?.schema_name || '';
    }
    localStorage.setItem(SCHEMA_KEY, sch);
    try { this.me = await this.get('me/'); } catch (e) { localStorage.removeItem(TOKEN_KEY); throw e; }
  }
  async loadMe(): Promise<any> { this.me = await this.get('me/'); return this.me; }
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.me = null;
    this.router.navigate(['/prop-portal/login'], { queryParams: { c: this.schema || null } });
  }
  async download(f: any): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(`files/${f.id}/`), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async pdf(kind: string, id: number, name: string): Promise<void> {   // v1.40.0 lease / invoice / receipt / deposit statement / owner statement PDF
    const blob = await firstValueFrom(this.http.get(this.url(`pdf/${kind}/${id}/`), { responseType: 'blob' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.pdf'; a.click();
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

/** Login: <app>/#/prop-portal/login?c=<company code>. */
@Component({
  selector: 'app-prop-portal-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-login"><form class="box" (ngSubmit)="go()">
  <h1>Tenant, owner and buyer portal</h1>
  <p>Your leases, payments, statements and maintenance requests.</p>
  <div class="pt-note err" *ngIf="err">{{ err }}</div>
  <div class="pt-form">
    <label>Company code<input [(ngModel)]="company" name="c" placeholder="Given in your invitation e-mail" autocomplete="organization"></label>
    <label>User name (e-mail)<input [(ngModel)]="username" name="u" autocomplete="username" required></label>
    <label>Password<input type="password" [(ngModel)]="password" name="p" autocomplete="current-password" required></label>
    <button type="submit" class="pt-btn primary" [disabled]="busy || !username || !password">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
  </div>
</form></div>`,
})
export class PropPortalLoginComponent implements OnInit {
  company = ''; username = ''; password = ''; err = ''; busy = false;
  constructor(private api: PropPortalApi, private router: Router, private route: ActivatedRoute) {}
  ngOnInit(): void { this.company = this.route.snapshot.queryParamMap.get('c') || localStorage.getItem(SCHEMA_KEY) || ''; }
  async go(): Promise<void> {
    this.busy = true; this.err = '';
    try { await this.api.login(this.company, this.username.trim(), this.password); this.router.navigate(['/prop-portal', this.api.me.roles[0] || 'tenant']); }
    catch (e: any) { this.err = e?.status === 403 ? 'This login is not a portal login, or the company code is wrong.' : PropPortalApi.error(e, 'Sign-in failed.'); }
    this.busy = false;
  }
}

const TAG: Record<string, string> = { Paid: 'done', 'Part paid': 'wait', Issued: 'open', Cleared: 'done', Bounced: 'bad', Closed: 'done', 'Work done': 'done',
  'Waiting for approval': 'wait', Active: 'done', 'Under notice': 'wait', Signed: 'done', 'Handed over': 'done', Issued_: 'open' };

/** Portal page: tenant, owner or buyer view (tabs for the roles the person has). */
@Component({
  selector: 'app-prop-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./portal.css'],
  template: `
<div class="pt-top" *ngIf="api.me"><div class="in">
  <div class="pt-brand"><div class="co">{{ api.me.company }} <span style="font-weight:400;color:#c7c3f3;font-size:14px">· portal</span></div>
    <div class="who">{{ api.me.name }}<button type="button" (click)="api.logout()">Sign out</button></div></div>
  <nav class="pt-nav">
    <a *ngFor="let r of api.me.roles" [class.on]="role === r" (click)="nav(r)">{{ names[r] }}</a>
  </nav>
</div></div>
<div class="pt-main" *ngIf="!api.me && err"><div class="pt-note err">{{ err }}</div></div>
<div class="pt-main" *ngIf="api.me && d">
  <div class="pt-note ok" *ngIf="ok">{{ ok }}</div><div class="pt-note err" *ngIf="err">{{ err }}</div>
  <!-- v1.40.0 announcements -->
  <div class="pt-card" *ngIf="ann.length" style="border-left:4px solid #5b4fe0"><h2>Notices</h2>
    <div *ngFor="let a of ann" style="padding:6px 0;border-bottom:1px solid #eef0f6"><b>{{ a.title }}</b> <span class="pt-muted" style="font-size:12px">{{ dd(a.from) }}{{ a.building ? ' · ' + a.building : '' }}</span>
      <div style="font-size:13.5px;white-space:pre-wrap">{{ a.body }}</div></div></div>

  <!-- tenant -->
  <ng-container *ngIf="role === 'tenant'">
    <div class="pt-h"><div><h1>My leases</h1><p>Payments, cheques and requests for your home or office.</p></div>
      <button type="button" class="pt-btn primary" *ngIf="d.maintenance && myUnits().length" (click)="req = { unit: myUnits()[0].unit_id, title: '', description: '', access: '' }">Request maintenance</button></div>
    <div class="pt-card" *ngIf="req">
      <h2>{{ req.kind === 'snag' ? 'Report a snag' : 'Maintenance request' }}</h2>
      <div class="pt-form">
        <label>Unit<select [(ngModel)]="req.unit"><option *ngFor="let u of myUnits()" [ngValue]="u.unit_id">{{ u.unit }}</option></select></label>
        <label>What is the problem?<input [(ngModel)]="req.title" placeholder="e.g. AC not cooling"></label>
        <label class="wide">Details<textarea [(ngModel)]="req.description"></textarea></label>
        <label>Access / best time<input [(ngModel)]="req.access" placeholder="e.g. after 5 pm, key with security"></label>
        <label>Photos<input type="file" multiple (change)="files = $any($event.target).files"></label>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px"><button type="button" class="pt-btn primary" [disabled]="busy || !req.title" (click)="send()">Send</button>
        <button type="button" class="pt-btn" (click)="req = null">Cancel</button></div>
    </div>
    <div class="pt-card" *ngFor="let l of d.leases">
      <h2>{{ l.unit }} · lease {{ l.number }} <span class="pt-tag" [ngClass]="tag(l.status)">{{ l.status }}</span></h2>
      <dl class="pt-kv"><dt>Period</dt><dd>{{ dd(l.start) }} – {{ dd(l.end) }}</dd><dt>Annual rent</dt><dd>{{ cur }} {{ m(l.rent) }} in {{ l.payments }} payment(s)</dd>
        <dt>Deposit</dt><dd>{{ cur }} {{ m(l.deposit) }}</dd></dl>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="pt-btn" (click)="api.pdf('lease', l.id, l.number)">Lease PDF</button></div>
      <div class="pt-note" *ngIf="l.status_code === 'draft' && !l.accepted_on" style="margin-top:12px">Please read the lease PDF and accept the terms online.
        <label style="display:block;margin-top:6px"><input type="checkbox" [(ngModel)]="accept[l.id]"> I accept the lease terms</label>
        <button type="button" class="pt-btn green" style="margin-top:6px" [disabled]="!accept[l.id]" (click)="acceptLease(l)">Accept</button></div>
      <p class="pt-muted" *ngIf="l.accepted_on">Accepted online on {{ dd(l.accepted_on) }}.</p>
      <div class="pt-note" *ngIf="l.status_code === 'active' && l.days_left <= 90 && !['renewing','leaving'].includes(l.renewal_status)" style="margin-top:12px">
        Your lease ends in {{ l.days_left }} days. Would you like to renew?
        <div style="margin-top:8px;display:flex;gap:8px"><button type="button" class="pt-btn green" (click)="renew(l, 'renew')">Yes, I want to renew</button>
          <button type="button" class="pt-btn" (click)="renew(l, 'leave')">No, I will move out</button></div></div>
      <p class="pt-muted" *ngIf="l.renewal_status === 'renewing'">You told us you want to renew – our leasing team will contact you.</p>
      <h2 style="margin-top:14px">Payments</h2>
      <table class="pt-table"><tr><th>Due</th><th>For</th><th class="r">Amount</th><th class="r">Paid</th><th>Status</th><th></th></tr>
        <tr *ngFor="let b of l.bills"><td [style.color]="b.overdue ? '#b42318' : null">{{ dd(b.due_date) }}</td><td>{{ b.description }}{{ b.credit ? ' (credit note)' : '' }}{{ b.disputed ? ' · in dispute' : '' }}</td><td class="r">{{ m(b.total) }}</td><td class="r">{{ m(b.paid) }}</td>
          <td><span class="pt-tag" [ngClass]="b.overdue ? 'bad' : tag(b.status)">{{ b.overdue ? 'Overdue' : b.status }}</span></td>
          <td style="white-space:nowrap"><a *ngIf="b.pay" class="pt-btn green" style="padding:2px 8px;font-size:12px;text-decoration:none" [href]="b.pay" target="_blank" rel="noopener" (click)="paying = b">Pay online</a>
            <button type="button" class="pt-btn" style="padding:2px 8px;font-size:12px;margin-left:4px" (click)="api.pdf('bill', b.id, b.number)">PDF</button></td></tr></table>
      <div class="pt-note" *ngIf="paying" style="margin-top:8px">Paid online? Enter the payment reference so we can match it: <input [(ngModel)]="payRef" placeholder="Transaction ref." style="height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;margin:0 6px">
        <button type="button" class="pt-btn primary" style="padding:2px 10px" [disabled]="!payRef" (click)="paid()">Send</button> <button type="button" class="pt-btn" style="padding:2px 10px" (click)="paying = null">Close</button></div>
      <ng-container *ngIf="l.cheques.length"><h2 style="margin-top:14px">Cheques</h2>
        <table class="pt-table"><tr><th>Cheque</th><th>Bank</th><th>Date</th><th class="r">Amount</th><th>Status</th></tr>
          <tr *ngFor="let c of l.cheques"><td>{{ c.cheque_no }}</td><td>{{ c.bank }}</td><td>{{ dd(c.date) }}</td><td class="r">{{ m(c.amount) }}</td><td><span class="pt-tag" [ngClass]="tag(c.status)">{{ c.status }}</span></td></tr></table></ng-container>
    </div>
    <div class="pt-card" *ngIf="d.files?.length"><h2>Documents</h2><button type="button" class="pt-file" *ngFor="let f of d.files" (click)="api.download(f)">📎 {{ f.name }}</button></div>
    <!-- v1.40.0 deposits -->
    <div class="pt-card" *ngIf="dep.length"><h2>My deposits</h2>
      <table class="pt-table"><tr><th>Lease</th><th>Unit</th><th class="r">Held</th><th>Move-out</th><th class="r">Deductions</th><th class="r">Refund</th><th></th></tr>
        <tr *ngFor="let x of dep"><td>{{ x.lease }}</td><td>{{ x.unit }}</td><td class="r">{{ m(x.held) }}</td><td>{{ x.moveout ? x.moveout.status : '–' }}</td><td class="r">{{ x.moveout ? m(x.moveout.deductions) : '' }}</td>
          <td class="r">{{ x.moveout ? m(x.moveout.refund) : '' }}<div class="pt-muted" *ngFor="let r of x.refunds" style="font-size:12px">{{ r.number }} · {{ r.status }}{{ r.paid_on ? ' ' + dd(r.paid_on) : '' }}</div></td>
          <td><button type="button" class="pt-btn" style="padding:2px 8px;font-size:12px" *ngIf="x.moveout?.pdf" (click)="api.pdf('moveout', x.moveout.id, x.moveout.number)">Statement</button></td></tr></table></div>
    <!-- v1.40.0 portal requests -->
    <div class="pt-card"><h2>Requests to the office <button type="button" class="pt-btn" style="margin-left:8px;padding:2px 10px" (click)="preq = preq ? null : { kind: 'move_out', lease: myUnits()[0]?.id, wanted_on: '', text: '' }">+ New request</button></h2>
      <div class="pt-form" *ngIf="preq">
        <label>Request<select [(ngModel)]="preq.kind"><option value="move_in">Move-in date</option><option value="move_out">Move-out notice</option><option value="profile">Change my details</option><option value="noc">NOC letter</option><option value="parking">Parking / access card</option><option value="other">Other</option></select></label>
        <label *ngIf="preq.kind !== 'profile'">Lease<select [(ngModel)]="preq.lease"><option *ngFor="let l of d.leases" [ngValue]="l.id">{{ l.unit }} · {{ l.number }}</option></select></label>
        <label *ngIf="preq.kind === 'move_in' || preq.kind === 'move_out'">Date<input type="date" [(ngModel)]="preq.wanted_on"></label>
        <ng-container *ngIf="preq.kind === 'profile'"><label>New phone<input [(ngModel)]="preq.phone"></label><label>New e-mail<input [(ngModel)]="preq.email"></label><label class="wide">New address<input [(ngModel)]="preq.address"></label><label>Emergency contact<input [(ngModel)]="preq.emergency_contact"></label></ng-container>
        <label class="wide">Details<textarea [(ngModel)]="preq.text"></textarea></label>
        <div class="wide" style="display:flex;gap:8px"><button type="button" class="pt-btn primary" [disabled]="busy" (click)="sendReq()">Send</button><button type="button" class="pt-btn" (click)="preq = null">Cancel</button></div>
      </div>
      <div class="pt-row" *ngFor="let r of preqs" style="cursor:default"><div class="m"><div class="t">{{ r.number }} · {{ r.kind }}{{ r.wanted_on ? ' · ' + dd(r.wanted_on) : '' }}</div><div class="s">{{ r.text }}<span *ngIf="r.answer"> · Answer: {{ r.answer }}</span></div></div>
        <span class="pt-tag" [ngClass]="tag(r.status)">{{ r.status }}</span></div>
      <p class="pt-muted" *ngIf="!preqs.length && !preq">No requests yet.</p></div>
    <div class="pt-card"><h2>Maintenance requests</h2>
      <div class="pt-row" *ngFor="let r of d.requests"><div class="m"><div class="t">{{ r.number }} {{ r.title }}</div><div class="s">{{ r.place }} · {{ w(r.created) }}</div></div>
        <span class="pt-tag" [ngClass]="tag(r.status)">{{ r.status }}</span></div>
      <p class="pt-muted" *ngIf="!d.requests.length">No requests.</p>
      <p class="pt-muted" *ngIf="!d.maintenance">Maintenance requests are taken by phone or e-mail.</p></div>
  </ng-container>

  <!-- owner -->
  <ng-container *ngIf="role === 'owner'">
    <div class="pt-h"><div><h1>My properties</h1><p>Units, tenants, statements and maintenance waiting for your approval.</p></div></div>
    <div class="pt-card" *ngIf="d.approvals.length"><h2>Waiting for your approval</h2>
      <div class="pt-row" *ngFor="let a of d.approvals" style="cursor:default"><div class="m"><div class="t">{{ a.number }} {{ a.title }}</div>
        <div class="s">{{ a.place }} · estimate {{ cur }} {{ m(a.estimate) }}{{ a.vendor ? ' · ' + a.vendor : '' }}</div><div class="s" *ngIf="a.description">{{ a.description }}</div>
        <input [(ngModel)]="notes[a.id]" placeholder="Note (optional)" style="margin-top:6px;height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;width:100%;max-width:420px"></div>
        <button type="button" class="pt-btn green" (click)="decide(a, true)">Approve</button><button type="button" class="pt-btn danger" (click)="decide(a, false)">Decline</button></div>
    </div>
    <div class="pt-card"><h2>Units</h2>
      <table class="pt-table"><tr><th>Unit</th><th>Type</th><th>Status</th><th>Tenant</th><th class="r">Rent</th><th>Lease ends</th></tr>
        <tr *ngFor="let u of d.units"><td>{{ u.unit }}</td><td>{{ u.type }}</td><td><span class="pt-tag" [ngClass]="tag(u.status)">{{ u.status }}</span></td><td>{{ u.tenant }}</td>
          <td class="r">{{ u.rent ? m(u.rent) : '' }}</td><td>{{ dd(u.lease_end) }}</td></tr></table></div>
    <div class="pt-card"><h2>Statements</h2>
      <table class="pt-table"><tr><th>Statement</th><th>Period</th><th class="r">Collected</th><th class="r">Expenses</th><th class="r">Fees</th><th class="r">Net to you</th><th>Status</th></tr>
        <ng-container *ngFor="let s of d.statements"><tr (click)="open = open === s.id ? null : s.id" style="cursor:pointer"><td>{{ s.number }}</td><td>{{ dd(s.from) }} – {{ dd(s.to) }}</td>
          <td class="r">{{ m(s.collected) }}</td><td class="r">{{ m(s.expenses) }}</td><td class="r">{{ m(s.fees) }}</td><td class="r"><b>{{ m(s.net) }}</b></td><td>{{ s.status }} <button type="button" class="pt-btn" style="padding:2px 8px;font-size:12px" (click)="$event.stopPropagation(); api.pdf('statement', s.id, s.number)">PDF</button></td></tr>
          <tr *ngIf="open === s.id"><td colspan="7"><table class="pt-table"><tr *ngFor="let l of s.lines"><td>{{ dd(l.date) }}</td><td>{{ l.unit }}</td><td>{{ l.text }}</td><td class="r">{{ m(l.amount) }}</td></tr></table></td></tr>
        </ng-container></table>
      <p class="pt-muted" *ngIf="!d.statements.length">No statements yet.</p></div>
    <div class="pt-card"><h2>Maintenance on your units</h2>
      <div class="pt-row" *ngFor="let r of d.requests" style="cursor:default"><div class="m"><div class="t">{{ r.number }} {{ r.title }}</div><div class="s">{{ r.place }} · paid by {{ r.who_pays }}</div></div>
        <span class="pt-tag" [ngClass]="tag(r.status)">{{ r.status }}</span></div>
      <p class="pt-muted" *ngIf="!d.requests.length">Nothing.</p></div>
  </ng-container>

  <!-- buyer -->
  <ng-container *ngIf="role === 'buyer'">
    <div class="pt-h"><div><h1>My purchases</h1><p>Your contract, instalments, handover and snags.</p></div></div>
    <div class="pt-card" *ngIf="req">
      <h2>Report a snag</h2>
      <div class="pt-form">
        <label>Unit<select [(ngModel)]="req.unit"><option *ngFor="let s of d.sales" [ngValue]="s.unit_id">{{ s.unit }}</option></select></label>
        <label>What is wrong?<input [(ngModel)]="req.title"></label>
        <label class="wide">Details<textarea [(ngModel)]="req.description"></textarea></label>
        <label>Photos<input type="file" multiple (change)="files = $any($event.target).files"></label>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px"><button type="button" class="pt-btn primary" [disabled]="busy || !req.title" (click)="send()">Send</button><button type="button" class="pt-btn" (click)="req = null">Cancel</button></div>
    </div>
    <div class="pt-card" *ngFor="let s of d.sales">
      <h2>{{ s.unit }} · contract {{ s.number }} <span class="pt-tag" [ngClass]="tag(s.status)">{{ s.status }}</span></h2>
      <dl class="pt-kv"><dt>Price</dt><dd>{{ cur }} {{ m(s.price) }}</dd><dt>Signed</dt><dd>{{ dd(s.signed_on) }}</dd><dt>Handover</dt><dd>{{ s.handed_over_on ? dd(s.handed_over_on) : 'planned ' + dd(s.handover_due) }}</dd></dl>
      <button type="button" class="pt-btn" style="margin-top:8px" (click)="api.pdf('sale', s.id, s.number)">Agreement PDF</button>
      <h2 style="margin-top:14px">Instalments</h2>
      <table class="pt-table"><tr><th>Due</th><th>Instalment</th><th class="r">Amount</th><th class="r">Paid</th><th>Status</th></tr>
        <tr *ngFor="let b of s.bills"><td>{{ dd(b.due_date) }}</td><td>{{ b.description }}</td><td class="r">{{ m(b.total) }}</td><td class="r">{{ m(b.paid) }}</td>
          <td><span class="pt-tag" [ngClass]="b.overdue ? 'bad' : tag(b.status)">{{ b.overdue ? 'Overdue' : b.status }}</span> <a *ngIf="b.pay" class="pt-btn green" style="padding:2px 8px;font-size:12px;text-decoration:none" [href]="b.pay" target="_blank" rel="noopener">Pay online</a></td></tr></table>
      <ng-container *ngIf="s.checklist?.length"><h2 style="margin-top:14px">Handover</h2>
        <div *ngFor="let c of s.checklist" style="font-size:13.5px;padding:3px 0">{{ c.done ? '☑' : '☐' }} {{ c.item }}</div></ng-container>
      <button type="button" class="pt-btn" style="margin-top:12px" *ngIf="d.maintenance && s.status === 'Handed over'" (click)="req = { unit: s.unit_id, title: '', description: '', kind: 'snag' }">Report a snag</button>
    </div>
    <div class="pt-card" *ngIf="d.files?.length"><h2>Documents</h2><button type="button" class="pt-file" *ngFor="let f of d.files" (click)="api.download(f)">📎 {{ f.name }}</button></div>
    <div class="pt-card"><h2>Snags and requests</h2>
      <div class="pt-row" *ngFor="let r of d.requests" style="cursor:default"><div class="m"><div class="t">{{ r.number }} {{ r.title }}</div><div class="s">{{ w(r.created) }}</div></div>
        <span class="pt-tag" [ngClass]="tag(r.status)">{{ r.status }}</span></div>
      <p class="pt-muted" *ngIf="!d.requests.length">Nothing reported.</p></div>
  </ng-container>
</div>`,
})
export class PropPortalComponent implements OnInit {
  role = 'tenant';
  d: any = null;
  err = ''; ok = ''; busy = false;
  req: any = null;
  files: FileList | null = null;
  notes: Record<number, string> = {};
  open: number | null = null;
  names: Record<string, string> = { tenant: 'My leases', owner: 'My properties', buyer: 'My purchases' };
  ann: any[] = []; dep: any[] = []; preqs: any[] = []; preq: any = null; accept: Record<number, boolean> = {}; paying: any = null; payRef = '';   // v1.40.0
  dd = day; w = when; m = money;
  constructor(public api: PropPortalApi, private route: ActivatedRoute, private router: Router) {}

  get cur(): string { return this.api.me?.currency || ''; }

  async ngOnInit(): Promise<void> {
    try { if (!this.api.me) await this.api.loadMe(); } catch (e) { this.err = PropPortalApi.error(e); if ((e as any)?.status === 401 || (e as any)?.status === 403) this.api.logout(); return; }
    this.route.paramMap.subscribe(pm => {
      const r = pm.get('role') || '';
      if (!this.api.me.roles.includes(r)) { this.nav(this.api.me.roles[0]); return; }
      this.role = r; this.load();
    });
  }

  nav(r: string): void { this.router.navigate(['/prop-portal', r]); }
  tag(s: string): string { return TAG[s] || 'open'; }
  myUnits(): any[] { return (this.d?.leases || []).filter((l: any) => ['active', 'notice'].includes(l.status_code)); }

  async load(): Promise<void> {
    this.d = null; this.req = null; this.err = '';
    try { this.d = await this.api.get(this.role + '/'); } catch (e) { this.err = PropPortalApi.error(e); }
    this.ann = await this.api.get('announcements/').catch(() => []);   // v1.40.0
    this.preqs = await this.api.get('requests/').catch(() => []);
    this.dep = this.role === 'tenant' ? await this.api.get('deposit/').catch(() => []) : [];
  }

  async acceptLease(l: any): Promise<void> {   // v1.40.0 e-acceptance
    try { const r = await this.api.post('accept/', { lease: l.id, accept: true }); this.ok = r.message; await this.load(); } catch (e) { this.err = PropPortalApi.error(e); }
  }
  async paid(): Promise<void> {   // v1.40.0 online payment reference
    try { const r = await this.api.post('pay/', { bill: this.paying.id, reference: this.payRef }); this.ok = r.message; this.paying = null; this.payRef = ''; await this.load(); } catch (e) { this.err = PropPortalApi.error(e); }
  }
  async sendReq(): Promise<void> {   // v1.40.0 portal requests
    this.busy = true; this.err = '';
    try { const r = await this.api.post('requests/', this.preq); this.ok = r.message; this.preq = null; this.preqs = await this.api.get('requests/'); } catch (e) { this.err = PropPortalApi.error(e); }
    this.busy = false;
  }

  async send(): Promise<void> {
    this.busy = true; this.err = ''; this.ok = '';
    const fd = new FormData();
    Object.entries(this.req).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    Array.from(this.files || []).forEach(f => fd.append('files', f, f.name));
    try { const r = await this.api.post('request/', fd); this.ok = r.message; this.files = null; await this.load(); }
    catch (e) { this.err = PropPortalApi.error(e); }
    this.busy = false;
  }

  async renew(l: any, answer: string): Promise<void> {
    try { const r = await this.api.post('renewal/', { lease: l.id, answer }); this.ok = r.message; await this.load(); } catch (e) { this.err = PropPortalApi.error(e); }
  }

  async decide(a: any, approve: boolean): Promise<void> {
    if (!approve && !this.notes[a.id]) { this.err = 'Please say why you decline.'; return; }
    try { const r = await this.api.post('owner/decision/', { work_order: a.id, approve, note: this.notes[a.id] || '' }); this.ok = r.message; await this.load(); }
    catch (e) { this.err = PropPortalApi.error(e); }
  }
}

/** v1.18.0 – add `...PROP_PORTAL_ROUTES` to the top-level routes in app-routing.module.ts (own login, no staff menu). */
export const PROP_PORTAL_ROUTES: Routes = [
  { path: 'prop-portal/login', component: PropPortalLoginComponent },
  { path: 'prop-portal', redirectTo: 'prop-portal/tenant', pathMatch: 'full' },
  { path: 'prop-portal/:role', component: PropPortalComponent },
];

/** v1.21.0: loaded on first use – /prop-portal/login, /prop-portal/<role> */
export const PROP_PORTAL_LAZY: Routes = [
  { path: 'login', component: PropPortalLoginComponent },
  { path: '', redirectTo: 'tenant', pathMatch: 'full' },
  { path: ':role', component: PropPortalComponent },
];
