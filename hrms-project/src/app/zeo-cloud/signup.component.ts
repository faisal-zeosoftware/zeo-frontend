import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { APP_VERSION } from '../shared-ui/version';

const T = (t: string, ...a: any[]) => i18nT(t, a.length ? a : null);

/** v1.23.0 – ZEO Cloud sign-up: company → plan and apps → owner and password → the company is made (14-day trial). */
@Component({
  selector: 'app-cloud-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...I18N_UI],
  styleUrls: ['./signup.css'],
  template: `
<div class="su-page" data-no-help>
  <header class="su-top"><span class="su-logo">zeo</span><span class="zk-sp"></span><a routerLink="/login">{{ 'Sign in' | t }}</a></header>
  <main class="su-main">
    <ol class="su-steps" [attr.aria-label]="'Steps' | t">
      <li *ngFor="let s of steps; let i = index" [class.on]="step === i + 1" [class.dn]="step > i + 1">{{ i + 1 }} · {{ s | t }}</li>
    </ol>
    <div class="su-msg" *ngIf="error" role="alert">{{ error }}</div>
    <p class="su-muted" *ngIf="!ready && !error">{{ 'Loading…' | t }}</p>
    <p class="su-muted" *ngIf="ready && !cloud">{{ 'Sign-up is not available on this server. Ask Adept for a ZEO account.' | t }}</p>

    <section *ngIf="ready && cloud && step === 1">
      <h1>{{ 'Your company' | t }}</h1>
      <p class="su-sub">{{ '14-day free trial – no card needed.' | t }}</p>
      <label class="su-f"><span>{{ 'Company name' | t }}</span><input [(ngModel)]="f.company" maxlength="100" autofocus></label>
      <label class="su-f"><span>{{ 'Industry' | t }}</span><select [(ngModel)]="f.industry"><option *ngFor="let i of industries" [value]="i.code">{{ i.label | t }}</option></select></label>
      <div class="su-act"><button type="button" class="su-btn" (click)="step = 2" [disabled]="f.company.trim().length < 2">{{ 'Continue' | t }}</button></div>
    </section>

    <section *ngIf="ready && cloud && step === 2">
      <h1>{{ 'Choose your plan and apps' | t }}</h1>
      <p class="su-sub">{{ 'You can change the plan and apps at any time.' | t }}</p>
      <div class="su-plans" role="radiogroup" [attr.aria-label]="'Plan' | t">
        <button type="button" class="su-plan" *ngFor="let p of plans" [class.on]="f.plan === p.code" (click)="f.plan = p.code" role="radio" [attr.aria-checked]="f.plan === p.code">
          <b data-no-translate>{{ p.name }}</b><span>{{ planNote(p) }}</span><small>{{ p.price_year ? (p.price_year | number:'1.0-0') + ' / ' + ('year' | t) : ('Price on request' | t) }}</small></button>
        <!-- v1.28.0 Enterprise is never self-service: the client asks Adept -->
        <button type="button" class="su-plan su-ent" [class.on]="!!ent" (click)="openEnt()"><b data-no-translate>Enterprise</b><span>{{ 'Own servers – ask Adept' | t }}</span><small>{{ 'Request' | t }}</small></button>
      </div>
      <div class="su-entform" *ngIf="ent" role="region" [attr.aria-label]="'Enterprise request' | t">
        <h2>{{ 'ZEO Enterprise – your own servers' | t }}</h2>
        <p class="su-sub">{{ 'Enterprise runs on servers of your own, with a licence from Adept. Tell us about your company – Adept will contact you.' | t }}</p>
        <ng-container *ngIf="!ent.done">
          <div class="su-grid">
            <label>{{ 'Company' | t }}<input [(ngModel)]="ent.company" maxlength="200"></label>
            <label>{{ 'Your name' | t }}<input [(ngModel)]="ent.name" maxlength="150"></label>
            <label>{{ 'E-mail' | t }}<input type="email" [(ngModel)]="ent.email" maxlength="254"></label>
            <label>{{ 'Phone' | t }}<input [(ngModel)]="ent.phone" maxlength="40"></label>
            <label>{{ 'Employees' | t }}<input type="number" min="1" [(ngModel)]="ent.employees"></label>
            <label>{{ 'Companies' | t }}<input type="number" min="1" [(ngModel)]="ent.companies"></label>
          </div>
          <label class="su-wide">{{ 'Anything else (servers, timeline, apps)' | t }}<textarea [(ngModel)]="ent.message" maxlength="2000" rows="3"></textarea></label>
          <p class="su-err" *ngIf="ent.error" role="alert">{{ ent.error }}</p>
          <div class="su-act"><button type="button" class="su-btn ghost" (click)="ent = null">{{ 'Cancel' | t }}</button>
            <button type="button" class="su-btn" (click)="sendEnt()" [disabled]="ent.busy">{{ ent.busy ? ('Sending…' | t) : ('Send to Adept' | t) }}</button></div>
        </ng-container>
        <p class="su-ok" *ngIf="ent.done" role="status">{{ ent.done }}</p>
      </div>
      <h2>{{ 'Apps – select at least one' | t }}</h2>
      <div class="su-apps">
        <label class="su-app" *ngFor="let a of apps" [class.on]="f.apps.includes(a.key)">
          <input type="checkbox" [checked]="f.apps.includes(a.key)" (change)="toggle(a.key)"><b>{{ a.title | t }}</b><span>{{ a.description | t }}</span></label>
      </div>
      <p class="su-incl"><b>{{ 'Always included:' | t }}</b> {{ 'Settings with the employee master, and the HR app (leave, attendance, documents, self service, expenses).' | t }}</p>
      <div class="su-act"><button type="button" class="su-btn ghost" (click)="step = 1">{{ 'Back' | t }}</button>
        <button type="button" class="su-btn" (click)="step = 3" [disabled]="!f.plan || !f.apps.length">{{ 'Continue' | t }}</button></div>
    </section>

    <section *ngIf="ready && cloud && step === 3">
      <h1>{{ 'Owner and password' | t }}</h1>
      <p class="su-sub">{{ 'The owner manages the subscription, apps and users of the account.' | t }}</p>
      <label class="su-f"><span>{{ 'Your name' | t }}</span><input [(ngModel)]="f.name" autocomplete="name"></label>
      <label class="su-f"><span>{{ 'E-mail' | t }}</span><input type="email" [(ngModel)]="f.email" autocomplete="email"></label>
      <label class="su-f"><span>{{ 'Password' | t }}</span><input type="password" [(ngModel)]="f.password" autocomplete="new-password"></label>
      <p class="su-muted">{{ 'At least 8 characters, not only numbers.' | t }}</p>
      <div class="su-act"><button type="button" class="su-btn ghost" (click)="step = 2">{{ 'Back' | t }}</button>
        <button type="button" class="su-btn" (click)="submit()" [disabled]="busy || !f.name.trim() || !f.email.trim() || f.password.length < 8">{{ 'Start the free trial' | t }}</button></div>
    </section>

    <section *ngIf="step === 4">
      <h1>{{ state === 'done' ? ('Your company is ready' | t) : state === 'failed' ? ('The company could not be created' | t) : ('Creating your company…' | t) }}</h1>
      <p class="su-sub">{{ f.company }}</p>
      <ol class="su-prog" *ngIf="state === 'running'"><li *ngFor="let s of jobSteps; let i = index" [class.dn]="i + 1 < stepNo" [class.now]="i + 1 === stepNo">{{ s | t }}</li></ol>
      <p class="su-muted" *ngIf="state === 'running'">{{ 'This takes about a minute.' | t }}</p>
      <div class="su-act" *ngIf="state === 'done'"><a class="su-btn" routerLink="/login" [queryParams]="{ u: f.email }">{{ 'Sign in' | t }}</a></div>
    </section>
  </main>
  <footer class="su-foot">ZEO · {{ 'Version' | t }} {{ version }}</footer>
</div>`,
})
export class CloudSignupComponent implements OnInit, OnDestroy {
  steps = ['Your company', 'Plan and apps', 'Owner and password', 'Ready'];
  jobSteps = ['Creating the company', 'Setting up the apps', 'Giving access', 'Finishing'];
  step = 1; ready = false; cloud = false; error = ''; busy = false; version = APP_VERSION;
  plans: any[] = []; apps: any[] = []; industries: any[] = [];
  f = { company: '', industry: 'OTH', plan: 'advance', apps: [] as string[], name: '', email: '', password: '' };
  state = 'running'; stepNo = 1; private poll: any = null;
  ent: any = null;   // v1.28.0 Enterprise request
  constructor(private http: HttpClient, private router: Router) {}
  openEnt(): void {
    this.ent = this.ent || { company: this.f.company, name: this.f.name, email: this.f.email, phone: '', employees: null, companies: null, message: '', busy: false, error: '', done: '' };
  }
  async sendEnt(): Promise<void> {
    const e = this.ent; e.busy = true; e.error = '';
    try {
      const r: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/licence/api/enterprise-request/`, e));
      e.done = r.detail;
    } catch (x: any) { e.error = x?.error?.detail || i18nT('The request could not be sent.'); }
    e.busy = false;
  }
  async ngOnInit(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/cloud/api/signup/plans/`));
      this.plans = r.plans || []; this.apps = r.apps || []; this.industries = r.industries || []; this.cloud = !!r.cloud;
      if (!this.plans.some(p => p.code === this.f.plan)) { this.f.plan = this.plans[0]?.code || ''; }
    } catch { this.error = T('ZEO could not be reached. Try again in a moment.'); }
    this.ready = true;
  }
  ngOnDestroy(): void { if (this.poll) { clearInterval(this.poll); } }
  planNote(p: any): string {
    if (p.code === 'standard') { return T('1 company · shared cloud'); }
    if (p.extra_companies) { return T('Up to {0} companies + extra companies (cap {1})', p.included_companies, p.max_companies); }
    return T('Unlimited companies · own database · group features');
  }
  toggle(k: string): void { const i = this.f.apps.indexOf(k); if (i >= 0) { this.f.apps.splice(i, 1); } else { this.f.apps.push(k); } }
  async submit(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      const r: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/cloud/api/signup/`, this.f));
      this.step = 4; this.state = 'running';
      this.poll = setInterval(async () => {
        try {
          const s: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/cloud/api/jobs/${r.job}/`));
          this.stepNo = s.step_no || this.stepNo;
          if (s.state !== 'running') { clearInterval(this.poll); this.poll = null; this.state = s.state; if (s.state === 'failed') { this.error = s.error || T('Unknown error.'); } }
        } catch { /* keep trying */ }
      }, 2000);
    } catch (e: any) {
      const b = e?.error;
      this.error = b?.detail || T('The account could not be created.');
      if (b?.errors?.company) { this.step = 1; } else if (b?.errors?.apps || b?.errors?.plan) { this.step = 2; }
    }
    this.busy = false;
  }
}
