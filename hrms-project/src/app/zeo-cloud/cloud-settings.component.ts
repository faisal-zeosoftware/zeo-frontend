import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZeoCloudService } from '../shared-ui/zeo-cloud.service';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);

const API = () => `${environment.apiBaseUrl}/cloud/api`;
const APP_TITLES: Record<string, string> = { hrms: 'HR', payroll: 'Payroll', projects: 'Projects', crm: 'CRM', property: 'Property', maintenance: 'Maintenance', hse: 'HSE' };
function err(e: any, fb: string): string { const b = e?.error; return b?.detail || (typeof b === 'string' && b.length < 300 ? b : fb); }

/** v1.23.0 – Settings → Subscription (account owner): plan, status, usage against the limits, apps, companies, invoices, requests. */
@Component({
  selector: 'app-cloud-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './cloud.css'],
  template: `
<div class="container zk-wrap" data-no-help>
  <div class="lp-head"><div>
    <h1 class="page-title">{{ 'Subscription' | t }}</h1>
    <p class="lp-desc" *ngIf="a">{{ a.name }} · {{ 'visible to the account owner only' | t }}</p>
  </div>
  <div class="lp-actions" *ngIf="a"><button type="button" class="lp-btn primary" (click)="asking = !asking">{{ 'Request upgrade' | t }}</button></div></div>
  <div class="zk-body">
    <div class="lp-msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</div>
    <p class="lp-muted" *ngIf="!a && !msg">{{ 'Loading…' | t }}</p>
    <ng-container *ngIf="a">
      <div class="zk-card" *ngIf="asking">
        <h2>{{ 'Request an upgrade or a change' | t }}</h2>
        <div class="lp-form">
          <label>{{ 'What do you need?' | t }}
            <select [(ngModel)]="req.what"><option *ngFor="let w of whats" [value]="w">{{ w | t }}</option></select></label>
          <label class="wide">{{ 'Details' | t }}<textarea [(ngModel)]="req.text" maxlength="400" [placeholder]="'For example: Premium for our 6 companies, or CRM for Sahra Trading' | t"></textarea></label>
        </div>
        <div class="zk-row"><span class="zk-note">{{ 'Adept answers by e-mail and changes the subscription for you.' | t }}</span><span class="zk-sp"></span>
          <button type="button" class="lp-btn" (click)="asking = false">{{ 'Cancel' | t }}</button>
          <button type="button" class="lp-btn primary" (click)="send()" [disabled]="busy || !req.text.trim()">{{ 'Send request' | t }}</button></div>
      </div>
      <div class="zk-card zk-plan">
        <div><div class="k">{{ 'Plan' | t }}</div><div class="v"><span data-no-translate>{{ a.plan.name }}</span> <span class="zk-st" [ngClass]="a.status">{{ statusLabel(a.status) | t }}</span></div>
          <div class="zk-note">{{ dates() }}</div></div>
        <div class="zk-note" style="max-width:440px" *ngIf="!a.plan.group_features">{{ 'Premium gives unlimited companies in your own database, the group dashboard, one approval inbox, group reports and transfers between companies.' | t }}</div>
      </div>
      <div class="zk-grid4">
        <div class="zk-card zk-num"><div class="k">{{ 'Companies' | t }}</div><div class="v">{{ a.usage.companies }}<ng-container *ngIf="a.limits.companies_cap"> / {{ a.limits.companies_cap }}</ng-container></div>
          <small *ngIf="a.limits.extra_allowed">{{ '{0} included + {1} extra' | t:a.limits.companies_included:a.usage.extra_companies }}</small></div>
        <div class="zk-card zk-num"><div class="k">{{ 'Employees' | t }}</div><div class="v">{{ a.usage.employees }}<ng-container *ngIf="a.limits.employees"> / {{ a.limits.employees }}</ng-container></div>
          <div class="zk-bar" *ngIf="a.limits.employees" [ngClass]="cls(a.usage.employees, a.limits.employees)"><i [style.width.%]="pct(a.usage.employees, a.limits.employees)"></i></div></div>
        <div class="zk-card zk-num"><div class="k">{{ 'Users' | t }}</div><div class="v">{{ a.usage.users }}<ng-container *ngIf="a.limits.users"> / {{ a.limits.users }}</ng-container></div>
          <div class="zk-bar" *ngIf="a.limits.users" [ngClass]="cls(a.usage.users, a.limits.users)"><i [style.width.%]="pct(a.usage.users, a.limits.users)"></i></div>
          <small>{{ 'Employees using self service only do not count' | t }}</small></div>
        <div class="zk-card zk-num"><div class="k">{{ 'Storage' | t }}</div><div class="v">{{ a.usage.storage_gb }}<ng-container *ngIf="a.limits.storage_gb"> / {{ a.limits.storage_gb }}</ng-container> GB</div>
          <div class="zk-bar" *ngIf="a.limits.storage_gb" [ngClass]="cls(a.usage.storage_gb, a.limits.storage_gb)"><i [style.width.%]="pct(a.usage.storage_gb, a.limits.storage_gb)"></i></div></div>
      </div>
      <div class="zk-card"><h2>{{ 'Apps' | t }}</h2>
        <div class="zk-apps">
          <div class="zk-app" *ngFor="let k of appKeys">
            <div class="zk-row"><b>{{ title(k) | t }}</b><span class="zk-sp"></span><span class="zk-st" [ngClass]="a.apps[k].state">{{ licLabel(k) }}</span></div>
            <span>{{ licNote(k) }}</span>
          </div>
        </div>
      </div>
      <div class="zk-card"><h2>{{ 'Companies' | t }}</h2>
        <div class="zk-scroll"><table class="zk-table">
          <tr><th>{{ 'Company' | t }}</th><th>{{ 'Apps' | t }}</th><th>{{ 'Where' | t }}</th><th></th></tr>
          <tr *ngFor="let c of a.companies"><td>{{ c.name }}</td><td>{{ appsOf(c.apps) }}</td><td>{{ c.where | t }}</td>
            <td><span class="zk-st trial" *ngIf="c.extra">{{ 'extra company' | t }}</span><span class="zk-st none" *ngIf="c.archived">{{ 'archived' | t }}</span></td></tr>
        </table></div>
      </div>
      <div class="zk-card"><h2>{{ 'Invoices' | t }}</h2>
        <p class="zk-note" *ngIf="!a.invoices.length">{{ 'No invoices yet. Invoices are sent by Adept.' | t }}</p>
        <div class="zk-scroll" *ngIf="a.invoices.length"><table class="zk-table">
          <tr><th>{{ 'Invoice' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'Period' | t }}</th><th>{{ 'Amount' | t }}</th><th>{{ 'Status' | t }}</th></tr>
          <tr *ngFor="let i of a.invoices"><td>{{ i.number }}</td><td>{{ i.issued_on | date:'d MMM y' }}</td>
            <td>{{ i.period_from ? (i.period_from | date:'d MMM y') + ' – ' + (i.period_to | date:'d MMM y') : '–' }}</td>
            <td>{{ i.amount | number:'1.2-2' }} {{ i.currency }}</td><td><span class="zk-st" [ngClass]="i.state">{{ (i.state === 'paid' ? 'Paid' : i.state === 'void' ? 'Void' : 'Unpaid') | t }}</span></td></tr>
        </table></div>
      </div>
    </ng-container>
  </div>
</div>`,
})
export class CloudSubscriptionComponent implements OnInit, OnDestroy {
  a: any = null; msg = ''; bad = false; busy = false; asking = false;
  appKeys = ['hrms', 'payroll', 'projects', 'crm', 'property', 'maintenance', 'hse'];
  whats = ['Bigger plan', 'More employees', 'More users', 'Another app', 'Extra company', 'More storage', 'Other'];
  req = { what: 'Bigger plan', text: '' };
  private sub?: Subscription;
  constructor(private http: HttpClient, private cloud: ZeoCloudService) {}
  ngOnInit(): void {
    this.sub = this.cloud.status$.subscribe(s => { if (s?.linked && s.account && (!this.a || this.a.id !== s.account.id)) { this.load(s.account.id); } else if (s && !s.linked) { this.say(T('This company is not in a ZEO Cloud account.'), true); } });
    this.cloud.load();
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  async load(id: number): Promise<void> {
    try { this.a = await firstValueFrom(this.http.get(`${API()}/accounts/${id}/subscription/`)); }
    catch (e) { this.say(err(e, T('The subscription could not be loaded.')), true); }
  }
  async send(): Promise<void> {
    this.busy = true;
    try { await firstValueFrom(this.http.post(`${API()}/accounts/${this.a.id}/request/`, this.req)); this.asking = false; this.req.text = ''; this.say(T('Your request was sent to Adept.'), false); }
    catch (e) { this.say(err(e, T('The request could not be sent.')), true); }
    this.busy = false;
  }
  statusLabel(s: string): string { return ({ trial: 'Trial', active: 'Active', grace: 'Grace period', suspended: 'Suspended – read-only', cancelled: 'Cancelled' } as any)[s] || s; }
  dates(): string {
    const a = this.a; if (!a) { return ''; }
    if (a.status === 'trial') { return T('Trial until {0} – {1} days left', a.trial_ends, a.days_left); }
    if (a.status === 'grace') { return T('Renewal date {0} passed – grace period until {1}', a.renews_on, a.until); }
    return a.renews_on ? T('Renews on {0}', a.renews_on) : '';
  }
  pct(u: number, l: number): number { return l ? Math.min(100, Math.round(u * 100 / l)) : 0; }
  cls(u: number, l: number): string { const p = this.pct(u, l); return p >= 100 ? 'full' : p >= 80 ? 'warn' : ''; }
  title(k: string): string { return APP_TITLES[k] || k; }
  licLabel(k: string): string {
    const l = this.a.apps[k];
    return T(({ included: 'Included', licensed: 'Licensed', trial: 'Trial', expired: 'Ended', none: 'Not in plan' } as any)[l.state] || l.state);
  }
  licNote(k: string): string {
    const l = this.a.apps[k];
    if (l.state === 'included') { return T('Free with any app'); }
    if (l.state === 'none') { return T('Use Request upgrade to add it'); }
    const parts: string[] = [];
    parts.push(l.companies ? T('{0} of {1} companies used', l.used ?? 0, l.companies) : T('All companies'));
    if (l.users) { parts.push(T('{0} users', l.users)); }
    if (l.valid_until) { parts.push(l.state === 'expired' ? T('ended {0}', l.valid_until) : T('until {0}', l.valid_until)); }
    return parts.join(' · ');
  }
  appsOf(keys: string[]): string { return (keys || []).map(k => T(APP_TITLES[k] || k)).join(', '); }
  private say(m: string, b: boolean): void { this.msg = m; this.bad = b; }
}

/** v1.23.0 – Settings → Security (account owner): who can be a user – any e-mail or only company e-mails. */
@Component({
  selector: 'app-cloud-security',
  standalone: true,
  imports: [CommonModule, FormsModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './cloud.css'],
  template: `
<div class="container zk-wrap" data-no-help>
  <div class="lp-head"><div>
    <h1 class="page-title">{{ 'Security' | t }}</h1>
    <p class="lp-desc">{{ 'Sign-in rules for all companies of the account.' | t }}</p></div></div>
  <div class="zk-body">
    <div class="lp-msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</div>
    <div class="zk-card" *ngIf="loaded">
      <h2>{{ 'Who can be a user' | t }}</h2>
      <label class="zk-radio"><input type="radio" name="dom" [value]="false" [(ngModel)]="only">
        <span><b>{{ 'Any e-mail' | t }}</b><small>{{ 'Staff may use an e-mail that is also used in other ZEO accounts.' | t }}</small></span></label>
      <label class="zk-radio"><input type="radio" name="dom" [value]="true" [(ngModel)]="only">
        <span><b>{{ 'Only company e-mails' | t }}</b><small>{{ 'New users must have an e-mail ending in your company domain. Employees using self service only are not affected.' | t }}</small></span></label>
      <div class="zk-row" *ngIf="only" style="padding-left:24px"><span>&#64;</span>
        <input class="zk-in" [(ngModel)]="domain" placeholder="sahragroup.ae" [attr.aria-label]="'Company e-mail domain' | t"></div>
      <div class="zk-row" style="margin-top:14px"><span class="zk-sp"></span>
        <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || (only && !domain.trim())">{{ 'Save' | t }}</button></div>
    </div>
  </div>
</div>`,
})
export class CloudSecurityComponent implements OnInit, OnDestroy {
  only = false; domain = ''; loaded = false; msg = ''; bad = false; busy = false; id = 0;
  private sub?: Subscription;
  constructor(private http: HttpClient, private cloud: ZeoCloudService) {}
  ngOnInit(): void {
    this.sub = this.cloud.status$.subscribe(async s => {
      if (!s?.linked || !s.account || this.id === s.account.id) { return; }
      this.id = s.account.id;
      try { const r: any = await firstValueFrom(this.http.get(`${API()}/accounts/${this.id}/security/`)); this.domain = r.allowed_email_domain || ''; this.only = !!this.domain; this.loaded = true; }
      catch (e) { this.msg = err(e, T('The settings could not be loaded.')); this.bad = true; }
    });
    this.cloud.load();
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }
  async save(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.put(`${API()}/accounts/${this.id}/security/`, { allowed_email_domain: this.only ? this.domain.trim() : '' }));
      this.domain = r.allowed_email_domain || ''; this.only = !!this.domain;
      this.msg = this.only ? T('Saved. New users must have an e-mail ending in @{0}.', this.domain) : T('Saved. Any e-mail can be used.'); this.bad = false;
    } catch (e) { this.msg = err(e, T('The settings could not be saved.')); this.bad = true; }
    this.busy = false;
  }
}

export const CLOUD_SETTINGS_ROUTES: Routes = [
  { path: 'subscription', component: CloudSubscriptionComponent, data: { title: 'Subscription' } },
  { path: 'security', component: CloudSecurityComponent, data: { title: 'Security' } },
];
