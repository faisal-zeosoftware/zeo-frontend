import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';

/**
 * v1.57.0 – the public careers page of a company: /careers/<company> (open jobs) and /careers/<company>/job/<code> (one job and
 * its apply form). No sign-in. ?src=linkedin|indeed|bayt|pool … records where the candidate came from.
 */
@Component({
  selector: 'z-careers-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...I18N_UI],
  styles: [`
  :host { display: block; min-height: 100vh; background: #f6f7f9; color: #1d2330; font-size: 15px; }
  .zc-top { background: var(--zc-brand); color: #fff; }
  .zc-top-in { max-width: 1040px; margin: 0 auto; padding: 18px 20px 30px; }
  .zc-bar { display: flex; align-items: center; gap: 12px; min-height: 44px; }
  .zc-logo { height: 40px; max-width: 160px; object-fit: contain; background: #fff; border-radius: 8px; padding: 4px 8px; }
  .zc-co { font-weight: 600; font-size: 16px; }
  .zc-lang { margin-inline-start: auto; }
  .zc-lang ::ng-deep select { background: #fff; color: #1d2330; border: 0; border-radius: 6px; padding: 5px 8px; font: inherit; font-size: 13px; }
  .zc-hero { margin-top: 26px; display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
  .zc-hero h1 { font-size: 34px; line-height: 1.15; margin: 0; font-weight: 700; letter-spacing: -.01em; max-width: 640px; }
  .zc-hero p { margin: 10px 0 0; max-width: 620px; opacity: .92; line-height: 1.55; white-space: pre-line; }
  .zc-count { margin-inline-start: auto; text-align: end; }
  .zc-count b { display: block; font-size: 44px; line-height: 1; font-weight: 700; }
  .zc-count span { opacity: .9; font-size: 13px; }
  .zc-main { max-width: 1040px; margin: -16px auto 0; padding: 0 20px 48px; display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; }
  .zc-main.one { grid-template-columns: minmax(0, 1fr); }
  .zc-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 12px; }
  .zc-filters { display: flex; gap: 8px; padding: 12px; flex-wrap: wrap; }
  .zc-filters input, .zc-filters select { border: 1px solid #cfd5dc; border-radius: 8px; padding: 9px 10px; font: inherit; font-size: 14px; background: #fff; min-width: 0; }
  .zc-filters input { flex: 1 1 220px; }
  .zc-filters select { flex: 0 1 180px; }
  .zc-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
  .zc-job { display: block; padding: 16px 18px; text-decoration: none; color: inherit; border-inline-start: 4px solid transparent; transition: border-color .15s; }
  .zc-job:hover, .zc-job:focus-visible { border-inline-start-color: var(--zc-brand); outline: none; }
  .zc-job h3 { margin: 0 0 4px; font-size: 17px; color: #111827; }
  .zc-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; color: #5d6670; }
  .zc-sum { margin: 8px 0 0; color: #3b4350; font-size: 14px; line-height: 1.5; }
  .zc-side { padding: 16px; font-size: 14px; line-height: 1.55; color: #3b4350; align-self: start; }
  .zc-side h2 { font-size: 15px; margin: 0 0 6px; color: #111827; }
  .zc-side p { white-space: pre-line; margin: 0 0 12px; }
  .zc-btn { display: inline-block; border: 0; border-radius: 8px; background: var(--zc-brand); color: #fff; padding: 11px 18px; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; }
  .zc-btn:disabled { opacity: .6; cursor: default; }
  .zc-btn.ghost { background: #fff; color: var(--zc-brand); border: 1px solid var(--zc-brand); }
  .zc-empty { padding: 28px; text-align: center; color: #5d6670; }
  .zc-detail { padding: 22px 24px; }
  .zc-detail h2 { margin: 0 0 6px; font-size: 24px; color: #111827; }
  .zc-detail h4 { margin: 20px 0 6px; font-size: 15px; color: #111827; }
  .zc-text { white-space: pre-line; line-height: 1.6; color: #2f3642; }
  .zc-back { display: inline-block; margin-bottom: 12px; color: #fff; text-decoration: none; opacity: .9; font-size: 14px; }
  .zc-form { padding: 22px 24px; margin-top: 16px; }
  .zc-form h3 { margin: 0 0 14px; font-size: 18px; }
  .zc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
  .zc-f { display: flex; flex-direction: column; gap: 5px; font-size: 13px; color: #4b5563; }
  .zc-f.wide { grid-column: 1 / -1; }
  .zc-f input:not([type=checkbox]):not([type=radio]), .zc-f select, .zc-f textarea { border: 1px solid #cfd5dc; border-radius: 8px; padding: 10px; font: inherit; font-size: 14px; color: #1d2330; background: #fff; }
  .zc-f textarea { min-height: 90px; resize: vertical; }
  .zc-f.bad input, .zc-f.bad select, .zc-f.bad textarea { border-color: #c2410c; }
  .zc-req { color: #c2410c; }
  .zc-q { grid-column: 1 / -1; border-top: 1px solid #eef0f3; padding-top: 10px; }
  .zc-radios { display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: #1d2330; }
  .zc-radios label { display: flex; align-items: center; gap: 6px; }
  .zc-check { display: flex; gap: 8px; align-items: flex-start; font-size: 13.5px; color: #3b4350; grid-column: 1 / -1; line-height: 1.45; }
  .zc-check input { margin-top: 3px; width: 16px; height: 16px; flex: none; }
  .zc-check > span { flex: 1; min-width: 0; }
  .zc-err { background: #fef2f2; color: #9b2c24; border-radius: 8px; padding: 10px 12px; margin: 12px 0 0; font-size: 14px; }
  .zc-done { padding: 30px 24px; text-align: center; }
  .zc-done h3 { margin: 0 0 8px; font-size: 20px; }
  .zc-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
  .zc-foot { text-align: center; font-size: 12px; color: #8a929c; padding: 0 0 24px; }
  @media (max-width: 760px) {
    .zc-main { grid-template-columns: minmax(0, 1fr); padding: 0 16px 40px; }
    .zc-top-in { padding: 14px 16px 26px; }
    .zc-hero h1 { font-size: 26px; }
    .zc-count { margin-inline-start: 0; text-align: start; }
    .zc-grid { grid-template-columns: 1fr; }
    .zc-detail, .zc-form { padding: 18px 16px; }
  }
  `],
  template: `
<div [style.--zc-brand]="brand" data-careers>
  <header class="zc-top"><div class="zc-top-in">
    <div class="zc-bar">
      <img *ngIf="logo" class="zc-logo" [src]="logo" [alt]="page?.company?.name || ''" (error)="logo = ''">
      <span class="zc-co">{{ page?.company?.name }}</span>
      <span class="zc-lang"><z-lang-picker variant="select" [reload]="false"></z-lang-picker></span>
    </div>
    <ng-container *ngIf="page && !code">
      <div class="zc-hero">
        <div>
          <h1>{{ page.settings.headline || page.settings.page_title }}</h1>
          <p *ngIf="page.settings.intro">{{ page.settings.intro }}</p>
        </div>
        <div class="zc-count" aria-live="polite"><b>{{ page.jobs.length }}</b><span>{{ (page.jobs.length === 1 ? 'open job' : 'open jobs') | t }}</span></div>
      </div>
    </ng-container>
    <ng-container *ngIf="page && code">
      <a class="zc-back" [routerLink]="['/careers', company]" [queryParams]="src ? { src: src } : {}" data-back>← {{ 'All jobs' | t }}</a>
      <div class="zc-hero" style="margin-top: 4px">
        <div><h1>{{ job?.title || ('Send us your CV' | t) }}</h1>
          <div class="zc-meta" *ngIf="job" style="color:#fff;opacity:.92;margin-top:8px">
            <span *ngIf="job.department">{{ job.department }}</span><span *ngIf="job.location">{{ job.location }}</span>
            <span>{{ job.employment_type_label | t }}</span><span>{{ job.workplace_label | t }}</span>
          </div>
        </div>
      </div>
    </ng-container>
  </div></header>

  <p class="zc-err" *ngIf="err && !page" style="max-width:640px;margin:24px auto" role="alert" data-error>{{ err }}</p>

  <!-- the list of jobs -->
  <main class="zc-main" *ngIf="page && !code" [class.one]="!page.settings.about && !page.settings.general_applications">
    <section>
      <div class="zc-card zc-filters" role="search">
        <input type="search" [(ngModel)]="q" [placeholder]="'Search jobs' | t" [attr.aria-label]="'Search jobs' | t" data-search>
        <select *ngIf="page.filters.departments.length > 1" [(ngModel)]="dept" [attr.aria-label]="'Department' | t"><option value="">{{ 'All departments' | t }}</option><option *ngFor="let d of page.filters.departments" [value]="d">{{ d }}</option></select>
        <select *ngIf="page.filters.locations.length > 1" [(ngModel)]="loc" [attr.aria-label]="'Location' | t"><option value="">{{ 'All locations' | t }}</option><option *ngFor="let l of page.filters.locations" [value]="l">{{ l }}</option></select>
        <select *ngIf="page.filters.types.length > 1" [(ngModel)]="type" [attr.aria-label]="'Employment type' | t"><option value="">{{ 'All types' | t }}</option><option *ngFor="let t of page.filters.types" [value]="t.value">{{ t.label | t }}</option></select>
      </div>
      <div class="zc-list">
        <a class="zc-card zc-job" *ngFor="let j of shown" [routerLink]="['/careers', company, 'job', j.code]" [queryParams]="src ? { src: src } : {}" data-job>
          <h3>{{ j.title }}</h3>
          <div class="zc-meta">
            <span *ngIf="j.department">{{ j.department }}</span><span *ngIf="j.location">{{ j.location }}</span>
            <span>{{ j.employment_type_label | t }}</span><span *ngIf="j.workplace !== 'onsite'">{{ j.workplace_label | t }}</span>
            <span *ngIf="j.experience_min_years">{{ '{0}+ years' | t:[j.experience_min_years] }}</span>
            <span *ngIf="j.salary">{{ salaryText(j.salary) }}</span>
            <span *ngIf="j.closing_date">{{ 'Apply by {0}' | t:[dmy(j.closing_date)] }}</span>
          </div>
          <p class="zc-sum">{{ j.summary }}</p>
        </a>
        <div class="zc-card zc-empty" *ngIf="!shown.length" data-empty>
          {{ (page.jobs.length ? 'No job matches the search.' : 'There are no open jobs right now.') | t }}
          <div *ngIf="page.settings.general_applications" style="margin-top:12px"><a class="zc-btn ghost" [routerLink]="['/careers', company, 'job', 'cv']" [queryParams]="src ? { src: src } : {}">{{ 'Send us your CV' | t }}</a></div>
        </div>
      </div>
    </section>
    <aside class="zc-card zc-side" *ngIf="page.settings.about || page.settings.general_applications">
      <ng-container *ngIf="page.settings.about"><h2>{{ 'About us' | t }}</h2><p>{{ page.settings.about }}</p></ng-container>
      <ng-container *ngIf="page.settings.general_applications">
        <h2>{{ 'No job for you yet?' | t }}</h2>
        <p>{{ 'Send us your CV and we will contact you when a matching job opens.' | t }}</p>
        <a class="zc-btn ghost" [routerLink]="['/careers', company, 'job', 'cv']" [queryParams]="src ? { src: src } : {}" data-send-cv>{{ 'Send us your CV' | t }}</a>
      </ng-container>
    </aside>
  </main>

  <!-- one job + apply form -->
  <main class="zc-main one" *ngIf="page && code">
    <section>
      <p class="zc-err" *ngIf="err && !job && code !== 'cv'" role="alert" data-error>{{ err }}</p>
      <article class="zc-card zc-detail" *ngIf="job">
        <div class="zc-meta">
          <span *ngIf="job.experience_min_years">{{ '{0}+ years experience' | t:[job.experience_min_years] }}</span>
          <span *ngIf="job.salary">{{ salaryText(job.salary) }}</span>
          <span *ngIf="job.openings > 1">{{ '{0} openings' | t:[job.openings] }}</span>
          <span *ngIf="job.closing_date">{{ 'Apply by {0}' | t:[dmy(job.closing_date)] }}</span>
        </div>
        <h4>{{ 'About the job' | t }}</h4>
        <div class="zc-text">{{ job.description }}</div>
        <ng-container *ngIf="job.requirements"><h4>{{ 'What we look for' | t }}</h4><div class="zc-text">{{ job.requirements }}</div></ng-container>
        <div style="margin-top:18px" *ngIf="!done"><a class="zc-btn" href="#apply" (click)="goApply($event)" data-apply-top>{{ 'Apply now' | t }}</a></div>
      </article>

      <div class="zc-card zc-done" *ngIf="done" role="status" data-done>
        <h3>{{ 'Thank you' | t }}</h3>
        <p>{{ done }}</p>
        <a class="zc-btn ghost" [routerLink]="['/careers', company]" [queryParams]="src ? { src: src } : {}">{{ 'See all jobs' | t }}</a>
      </div>

      <form class="zc-card zc-form" id="apply" *ngIf="(job || code === 'cv') && !done" (ngSubmit)="send()" novalidate data-apply>
        <h3>{{ (job ? 'Apply for this job' : 'Send us your CV') | t }}</h3>
        <div class="zc-grid">
          <label class="zc-f" [class.bad]="bad === 'first_name'">{{ 'First name' | t }} <span class="zc-req">*</span><input name="first_name" [(ngModel)]="m.first_name" autocomplete="given-name" required></label>
          <label class="zc-f">{{ 'Last name' | t }}<input name="last_name" [(ngModel)]="m.last_name" autocomplete="family-name"></label>
          <label class="zc-f" [class.bad]="bad === 'email'">{{ 'E-mail' | t }} <span class="zc-req">*</span><input name="email" type="email" [(ngModel)]="m.email" autocomplete="email" required></label>
          <label class="zc-f" [class.bad]="bad === 'phone'">{{ 'Mobile' | t }}<input name="phone" type="tel" [(ngModel)]="m.phone" autocomplete="tel" placeholder="+971 5x xxx xxxx"></label>
          <label class="zc-f">{{ 'Nationality' | t }}
            <select name="nationality" [(ngModel)]="m.nationality"><option value="">–</option><option *ngFor="let n of page.nationalities" [value]="n.id">{{ n.name }}</option></select></label>
          <label class="zc-f">{{ 'Current location' | t }}<input name="current_location" [(ngModel)]="m.current_location" autocomplete="address-level2"></label>
          <label class="zc-f">{{ 'Visa status' | t }}
            <select name="visa_status" [(ngModel)]="m.visa_status"><option value="">–</option><option *ngFor="let v of page.visa_choices" [value]="v.value">{{ v.label | t }}</option></select></label>
          <label class="zc-f" [class.bad]="bad === 'experience_years'">{{ 'Experience (years)' | t }}<input name="experience_years" type="number" min="0" step="0.5" [(ngModel)]="m.experience_years"></label>
          <label class="zc-f" [class.bad]="bad === 'notice_period_days'">{{ 'Notice period (days)' | t }}<input name="notice_period_days" type="number" min="0" [(ngModel)]="m.notice_period_days"></label>
          <label class="zc-f" [class.bad]="bad === 'expected_salary'">{{ 'Expected monthly salary' | t }}<input name="expected_salary" type="number" min="0" [(ngModel)]="m.expected_salary"></label>
          <label class="zc-f wide">{{ 'LinkedIn profile' | t }}<input name="linkedin" type="url" [(ngModel)]="m.linkedin" placeholder="https://www.linkedin.com/in/…"></label>
          <label class="zc-f wide" *ngIf="!job">{{ 'Skills' | t }}<input name="skills" [(ngModel)]="m.skills" [placeholder]="'For example: AutoCAD, HVAC, QA/QC' | t"></label>

          <div class="zc-f zc-q" *ngFor="let q of job?.questions" [class.bad]="bad === 'q_' + q.id" [attr.data-q]="q.id">
            <span>{{ q.text }} <span class="zc-req" *ngIf="q.required">*</span></span>
            <div class="zc-radios" *ngIf="q.type === 'yes_no'">
              <label><input type="radio" [name]="'q' + q.id" value="yes" [(ngModel)]="ans[q.id]"> {{ 'Yes' | t }}</label>
              <label><input type="radio" [name]="'q' + q.id" value="no" [(ngModel)]="ans[q.id]"> {{ 'No' | t }}</label>
            </div>
            <select *ngIf="q.type === 'choice'" [name]="'q' + q.id" [(ngModel)]="ans[q.id]"><option value="">–</option><option *ngFor="let o of q.options" [value]="o">{{ o }}</option></select>
            <input *ngIf="q.type === 'number'" type="number" [name]="'q' + q.id" [(ngModel)]="ans[q.id]">
            <input *ngIf="q.type === 'text'" [name]="'q' + q.id" [(ngModel)]="ans[q.id]">
          </div>

          <label class="zc-f wide">{{ (job ? 'Cover letter' : 'Message') | t }}<textarea name="cover_letter" [(ngModel)]="m.cover_letter" maxlength="5000"></textarea></label>
          <label class="zc-f wide" [class.bad]="bad === 'cv'">{{ 'CV (PDF or Word, up to 5 MB)' | t }} <span class="zc-req" *ngIf="page.settings.require_cv">*</span>
            <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="file($event)" data-cv></label>
          <div class="zc-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off" [(ngModel)]="m.website"></label></div>
          <label class="zc-check" [class.bad]="bad === 'privacy'"><input type="checkbox" name="privacy" [(ngModel)]="m.privacy" data-privacy>
            <span>{{ page.settings.privacy_text }} <span class="zc-req">*</span></span></label>
          <label class="zc-check"><input type="checkbox" name="consent" [(ngModel)]="m.consent_to_retain" data-consent>
            <span>{{ 'Keep my CV for {0} months and tell me about other jobs that match my profile.' | t:[page.settings.retention_months] }}</span></label>
        </div>
        <p class="zc-err" *ngIf="err" role="alert" data-error>{{ err }}</p>
        <div style="margin-top:16px"><button class="zc-btn" type="submit" [disabled]="busy" data-send>{{ (busy ? 'Sending…' : (job ? 'Send my application' : 'Send my CV')) | t }}</button></div>
      </form>
    </section>
  </main>
  <p class="zc-foot" *ngIf="page">{{ page.company.name }}</p>
</div>`,
})
export class ZCareersPublicComponent implements OnInit, OnDestroy {
  company = ''; code = ''; src = '';
  page: any = null; job: any = null; err = ''; bad = ''; busy = false; done = '';
  logo = ''; brand = '#4f46e5';
  q = ''; dept = ''; loc = ''; type = '';
  m: any = { visa_status: '', nationality: '', privacy: false, consent_to_retain: false };
  ans: Record<string, any> = {};
  private cv: File | null = null;
  private sub?: Subscription;
  private api = `${environment.apiBaseUrl}/recruitment/api/careers`;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(p => {
      const company = p.get('company') || '';
      const code = p.get('code') || '';
      this.src = this.route.snapshot.queryParamMap.get('src') || '';
      const again = company !== this.company;
      this.company = company; this.code = code;
      this.job = null; this.done = ''; this.err = ''; this.bad = ''; this.ans = {};
      void (again || !this.page ? this.loadPage() : Promise.resolve()).then(() => this.loadJob());
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private params(): any { return { schema: this.company }; }

  private async loadPage(): Promise<void> {
    try {
      this.page = await firstValueFrom(this.http.get<any>(`${this.api}/`, { params: this.params() }));
      this.brand = /^#[0-9a-fA-F]{6}$/.test(this.page.settings.brand_color || '') ? this.page.settings.brand_color : '#4f46e5';
      this.logo = this.page.company.logo ? `${this.api}/logo/?schema=${encodeURIComponent(this.company)}` : '';
      document.title = `${this.page.settings.page_title || i18nT('Careers')} – ${this.page.company.name}`;
    } catch (e: any) {
      this.page = null;
      this.err = e?.status === 404 ? i18nT('This company has no careers page.') : (e?.status === 400 ? i18nT('This careers page does not exist.') : httpErrorText(e));
    }
    this.cd.markForCheck();
  }

  private async loadJob(): Promise<void> {
    if (!this.page || !this.code || this.code === 'cv') { this.cd.markForCheck(); return; }
    try {
      this.job = await firstValueFrom(this.http.get<any>(`${this.api}/job/${encodeURIComponent(this.code)}/`, { params: this.params() }));
      document.title = `${this.job.title} – ${this.page.company.name}`;
    } catch (e: any) { this.err = e?.status === 404 ? i18nT('This job is no longer open.') : httpErrorText(e); }
    this.cd.markForCheck();
  }

  get shown(): any[] {
    const q = this.q.trim().toLowerCase();
    return (this.page?.jobs || []).filter((j: any) =>
      (!q || `${j.title} ${j.department} ${j.location} ${j.summary}`.toLowerCase().includes(q)) &&
      (!this.dept || j.department === this.dept) && (!this.loc || j.location === this.loc) && (!this.type || j.employment_type === this.type));
  }

  dmy(v: any): string { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v || ''); }

  salaryText(s: any): string {
    const f = (n: any) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const r = s.min && s.max ? `${f(s.min)} – ${f(s.max)}` : f(s.min || s.max);
    return `${s.currency} ${r} ${i18nT('a month')}`;
  }

  goApply(ev: Event): void {
    ev.preventDefault();
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  file(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0] || null;
    this.cv = f;
    if (f && f.size > 5 * 1024 * 1024) { this.err = i18nT('The CV is larger than 5 MB.'); this.bad = 'cv'; }
    else if (this.bad === 'cv') { this.err = ''; this.bad = ''; }
  }

  async send(): Promise<void> {
    this.err = ''; this.bad = '';
    const need = (k: string, msg: string) => { if (!this.err && !String(this.m[k] ?? '').trim()) { this.err = i18nT(msg); this.bad = k; } };
    need('first_name', 'Enter your first name.');
    need('email', 'Enter a valid e-mail address.');
    if (!this.err && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.m.email)) { this.err = i18nT('Enter a valid e-mail address.'); this.bad = 'email'; }
    for (const q of this.job?.questions || []) {
      if (!this.err && q.required && (this.ans[q.id] === undefined || this.ans[q.id] === null || String(this.ans[q.id]).trim() === '')) {
        this.err = i18nT('Answer the question "{0}".', [q.text]); this.bad = 'q_' + q.id;
      }
    }
    if (!this.err && this.page.settings.require_cv && !this.cv) { this.err = i18nT('Attach your CV.'); this.bad = 'cv'; }
    if (!this.err && !this.m.privacy) { this.err = i18nT('Please confirm that you have read how we use your details.'); this.bad = 'privacy'; }
    if (this.err) { this.cd.markForCheck(); return; }
    const fd = new FormData();
    if (this.job) { fd.append('job', this.job.code); }
    for (const k of ['first_name', 'last_name', 'email', 'phone', 'nationality', 'current_location', 'visa_status', 'experience_years',
      'notice_period_days', 'expected_salary', 'linkedin', 'skills', 'cover_letter', 'website']) {
      const v = this.m[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') { fd.append(k, String(v).trim()); }
    }
    fd.append('privacy', this.m.privacy ? 'true' : 'false');
    fd.append('consent_to_retain', this.m.consent_to_retain ? 'true' : 'false');
    if (this.src) { fd.append('src', this.src); }
    if (this.job?.questions?.length) {
      fd.append('answers', JSON.stringify(this.job.questions.filter((q: any) => this.ans[q.id] !== undefined && this.ans[q.id] !== '').map((q: any) => ({ id: q.id, answer: this.ans[q.id] }))));
    }
    if (this.cv) { fd.append('cv', this.cv, this.cv.name); }
    this.busy = true; this.cd.markForCheck();
    try {
      const r: any = await firstValueFrom(this.http.post(`${this.api}/apply/`, fd, { params: this.params() }));
      this.done = r?.message || i18nT('Thank you – your application was sent.');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    } catch (e: any) {
      this.err = httpErrorText(e);
      this.bad = e?.error?.field || '';
    }
    this.busy = false; this.cd.markForCheck();
  }
}

export const CAREERS_ROUTES = [
  { path: ':company', component: ZCareersPublicComponent },
  { path: ':company/job/:code', component: ZCareersPublicComponent },
];
