import { ZJobProgressComponent } from '../shared-ui/z-job-progress.component';   // v1.62.1
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

/** v1.23.0 – ZEO Cloud sign-up: company → plan and apps → owner and password → the company is made (14-day trial).
 *  v1.67.2 (signup): contact person, contact number and country on step 1; an honest progress card with Try again. */
@Component({
  selector: 'app-cloud-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZJobProgressComponent, ...I18N_UI],
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
      <!-- v1.67.2 (signup) contact person, contact number and country (country master, UAE by default) -->
      <label class="su-f"><span>{{ 'Contact person name' | t }} <i class="su-req" aria-hidden="true">*</i></span>
        <input [(ngModel)]="f.contact_name" maxlength="150" autocomplete="name" required [attr.aria-invalid]="!!fieldErr.contact_name">
        <small class="su-ferr" *ngIf="fieldErr.contact_name" role="alert">{{ fieldErr.contact_name }}</small></label>
      <label class="su-f"><span>{{ 'Contact number' | t }} <i class="su-req" aria-hidden="true">*</i></span>
        <input type="tel" dir="ltr" [(ngModel)]="f.contact_phone" maxlength="30" autocomplete="tel" required [placeholder]="phoneHint()" (blur)="checkPhone()" [attr.aria-invalid]="!!fieldErr.contact_phone">
        <small class="su-muted" *ngIf="!fieldErr.contact_phone">{{ isUae() ? ('UAE mobile or landline, e.g. +971 50 123 4567 – or any number with its country code.' | t) : ('With the country code, e.g. +44 20 7946 0958.' | t) }}</small>
        <small class="su-ferr" *ngIf="fieldErr.contact_phone" role="alert">{{ fieldErr.contact_phone }}</small></label>
      <label class="su-f"><span>{{ 'Country' | t }}</span>
        <select [(ngModel)]="f.country" (change)="checkPhone()" [attr.aria-invalid]="!!fieldErr.country"><option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name | t }}</option></select>
        <small class="su-muted">{{ 'The company country sets the currency and the country rules (leave, gratuity, holidays).' | t }}</small>
        <small class="su-ferr" *ngIf="fieldErr.country" role="alert">{{ fieldErr.country }}</small></label>
      <div class="su-act"><button type="button" class="su-btn" (click)="next1()" [disabled]="f.company.trim().length < 2 || f.contact_name.trim().length < 2 || !f.contact_phone.trim()">{{ 'Continue' | t }}</button></div>
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
          <input type="checkbox" [checked]="f.apps.includes(a.key)" (change)="toggle(a.key, $event)"><b>{{ a.title | t }}</b><span>{{ a.description | t }}</span>
          <em class="su-needs" *ngIf="a.needs?.length" data-app-needs>{{ 'Needs {0} – comes with it' | t:[needTitles(a)] }}</em></label>
      </div>
      <!-- v1.67.3 (apps): what the chosen apps bring with them; HR is an app of its own -->
      <p class="su-note" *ngIf="appNote" role="status" data-app-note>{{ appNote }}</p>
      <p class="su-incl"><b>{{ 'Always included:' | t }}</b> {{ coreText || ('Always on, not an app: company, branches, departments, designations, users and rights, business partners, items, locations and the employee directory.' | t) }}</p>
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
      <h1>{{ state === 'done' ? ('Your company is ready' | t) : (state === 'failed' || jobSt?.stalled) ? ('The company could not be created' | t) : ('Creating your company…' | t) }}</h1>
      <p class="su-sub">{{ f.company }}</p>
      <!-- v1.62.1: %, what is being done now, steps with times -->
      <!-- v1.62.1 %, steps; v1.67.2 (signup): real % of the template copy, the usual time of this server (no fixed
           "about a minute"), a stopped or failed job with Try again and Contact Adept -->
      <z-job-progress *ngIf="state === 'running' || state === 'failed'" [job]="jobSt || { state: 'running', percent: 0, step: 'Creating the company', expected: expected }" [title]="f.company">
        <div class="su-help" *ngIf="jobSt?.state === 'failed' || jobSt?.stalled">
          <p class="su-muted">{{ 'Your account and login are kept. Try again – or contact Adept and give this reference:' | t }} <b dir="ltr" data-no-translate>{{ jobId }}</b></p>
          <p class="su-ferr" *ngIf="retryErr" role="alert">{{ retryErr }}</p>
          <div class="su-act">
            <a class="su-btn ghost" *ngIf="support.email" [href]="mailto()">{{ 'Contact Adept' | t }}</a>
            <a class="su-btn ghost" *ngIf="support.phone" [href]="'tel:' + support.phone" dir="ltr" data-no-translate>{{ support.phone }}</a>
            <button type="button" class="su-btn" (click)="retry()" [disabled]="busy">{{ busy ? ('Starting again…' | t) : ('Try again' | t) }}</button>
          </div>
        </div>
      </z-job-progress>
      <p class="su-muted" *ngIf="state === 'running' && offlineSince" role="status">{{ 'ZEO cannot be reached at the moment – still trying…' | t }}</p>
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
  countries: any[] = []; support = { email: '', phone: '' }; expected: number | null = null;   // v1.67.2 (signup)
  fieldErr: any = {}; jobId = ''; retryErr = ''; offlineSince = 0;
  f = { company: '', industry: 'OTH', plan: 'advance', apps: ['hrms'] as string[], name: '', email: '', password: '',   // v1.67.3 (apps) HR ticked to start with, can be left out
        contact_name: '', contact_phone: '', country: null as number | null };
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
      this.coreText = r.core || '';   // v1.67.3 (apps)
      this.f.apps = this.f.apps.filter(k => this.apps.some(a => a.key === k));   // an older server without HR in the list
      this.countries = r.countries || []; this.f.country = r.default_country ?? (this.countries[0]?.id ?? null);   // v1.67.2 (signup)
      this.support = { email: r.support_email || '', phone: r.support_phone || '' }; this.expected = r.expected || null;
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
  jobSt: any = null;   // v1.62.1 job status for <z-job-progress>
  // v1.67.3 (apps): an app brings what it needs (Payroll → HR); what an active choice needs cannot be unticked
  coreText = ''; appNote = '';
  private titleOf(k: string): string { return T(this.apps.find(a => a.key === k)?.title || k); }
  needTitles(a: any): string { return (a.needs || []).map((n: any) => T(n.title)).join(', '); }
  toggle(k: string, ev?: any): void {
    this.appNote = '';
    const i = this.f.apps.indexOf(k);
    if (i >= 0) {
      const users = this.apps.filter(a => this.f.apps.includes(a.key) && (a.needs || []).some((n: any) => n.key === k)).map(a => T(a.title));
      if (users.length) { this.appNote = T('{0} needs {1} – untick {0} first.', users.join(', '), this.titleOf(k)); if (ev?.target) { ev.target.checked = true; } return; }
      this.f.apps.splice(i, 1); return;
    }
    const a = this.apps.find(x => x.key === k);
    const added = (a?.needs || []).map((n: any) => n.key).filter((d: string) => !this.f.apps.includes(d));
    this.f.apps.push(...added, k);
    if (added.length) { this.appNote = T('{0} needs {1}: {1} is ticked too.', this.titleOf(k), added.map((d: string) => this.titleOf(d)).join(', ')); }
  }
  // ---- v1.67.2 (signup) contact number: the same rule as the server (UAE +971 mobile / landline, or international)
  isUae(): boolean { const c = this.countries.find(x => x.id === this.f.country); return !c || c.code === 'AE'; }
  phoneHint(): string { return this.isUae() ? '+971 50 123 4567' : '+44 20 7946 0958'; }
  phoneError(): string {
    const v = (this.f.contact_phone || '').trim();
    if (!v) { return T('Enter the contact number.'); }
    if (!/^\+?[0-9 ()-]{6,24}$/.test(v) || v.replace(/\D/g, '').length < 7) { return T('Enter a valid {0} (digits, spaces, + and -).', T('contact number')); }
    let d = v.replace(/\D/g, ''); let plus = v.startsWith('+');
    if (!plus && d.startsWith('00')) { d = d.slice(2); plus = true; }
    if ((plus && d.startsWith('971')) || (!plus && this.isUae())) {
      let n = d.startsWith('971') ? d.slice(3) : d; if (n.startsWith('0')) { n = n.slice(1); }
      if ((n.length === 9 && n[0] === '5') || (n.length === 8 && '234679'.includes(n[0]))) { return ''; }
      return T('Enter a UAE number as +971 5X XXX XXXX (mobile) or +971 X XXX XXXX (landline).');
    }
    if (!plus) { return T('Enter the number with its country code, e.g. +44 20 7946 0958.'); }
    if (d.length < 8 || d.length > 15 || d.startsWith('0')) { return T('Enter a valid international number: + country code and 8 to 15 digits.'); }
    return '';
  }
  checkPhone(): void { if ((this.f.contact_phone || '').trim()) { this.fieldErr = { ...this.fieldErr, contact_phone: this.phoneError() }; } }
  next1(): void {
    const e: Record<string, string> = {};
    if (this.f.contact_name.trim().length < 2) { e['contact_name'] = T('Enter the contact person name.'); }
    const pe = this.phoneError(); if (pe) { e['contact_phone'] = pe; }
    this.fieldErr = e;
    if (Object.keys(e).length) { return; }
    if (!this.f.name.trim()) { this.f.name = this.f.contact_name.trim(); }   // the owner is often the contact person
    this.step = 2;
  }
  mailto(): string {
    const sub = T('ZEO sign-up – the company could not be created');
    const body = `${this.f.company}\n${this.f.email}\n${T('Reference')}: ${this.jobId}\n${this.jobSt?.error || ''}`;
    return `mailto:${this.support.email}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
  }
  private follow(job: string): void {
    this.jobId = job; this.jobSt = null; this.state = 'running'; this.offlineSince = 0;
    if (this.poll) { clearInterval(this.poll); }
    this.poll = setInterval(async () => {
      try {
        const s: any = await firstValueFrom(this.http.get(`${environment.apiBaseUrl}/cloud/api/jobs/${job}/`));
        this.offlineSince = 0;
        this.stepNo = s.step_no || this.stepNo;
        this.jobSt = s;   // v1.62.1
        if (s.state === 'done') { clearInterval(this.poll); this.poll = null; this.state = 'done'; }
        else if (s.state === 'failed') { clearInterval(this.poll); this.poll = null; this.state = 'failed'; }
        // stalled: keep the card (with Try again) and keep asking – it says so if it moves again
      } catch { if (!this.offlineSince) { this.offlineSince = Date.now(); } }   // shown after the first failed poll
    }, 2000);
  }
  async retry(): Promise<void> {
    this.busy = true; this.retryErr = '';
    try {
      const r: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/cloud/api/jobs/${this.jobId}/retry/`, {}));
      this.follow(r.job);
    } catch (e: any) { this.retryErr = e?.error?.detail || T('It could not be started again.'); }
    this.busy = false;
  }
  async submit(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      const r: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/cloud/api/signup/`, this.f));
      this.step = 4; this.expected = r.expected || this.expected;
      this.follow(r.job);
    } catch (e: any) {
      const b = e?.error;
      this.error = b?.detail || T('The account could not be created.');
      this.fieldErr = { ...(b?.errors || {}) };
      if (b?.errors?.company || b?.errors?.contact_name || b?.errors?.contact_phone || b?.errors?.country) { this.step = 1; }
      else if (b?.errors?.apps || b?.errors?.plan) { this.step = 2; }
    }
    this.busy = false;
  }
}
