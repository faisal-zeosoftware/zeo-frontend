import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModuleApiService } from '../hr-modules/module-api.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, i18nT } from '../shared-ui/i18n.service';

/** v1.57.0 – Recruitment › Careers page: the public page, the apply form, e-mails and the job-board feed. */
@Component({
  selector: 'z-careers-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['../hr-modules/hr-shared.css'],
  styles: [`
  .hr-page { padding: 16px 20px; }
  .hr-head { display: flex; align-items: center; gap: 12px; } .hr-head h1 { font-size: 22px; margin: 0; }
  .zcs { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
  .zcs-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; }
  .zcs-card h3 { font-size: 15px; margin: 0 0 12px; color: #1b1640; }
  .zcs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
  .zcs-f { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #5d6670; }
  .zcs-f.wide { grid-column: 1 / -1; }
  .zcs-f input:not([type=checkbox]):not([type=color]), .zcs-f textarea, .zcs-f select { border: 1px solid #cfd5dc; border-radius: 8px; padding: 9px 10px; font: inherit; font-size: 14px; color: #1d2330; height: 38px; }
  .zcs-f textarea { height: auto; min-height: 76px; resize: vertical; }
  .zcs-f small { color: #8a929c; }
  .zcs-sw { display: flex; flex-direction: row !important; width: 100% !important; gap: 8px; align-items: flex-start; font-size: 13.5px; color: #1d2330; grid-column: 1 / -1; margin: 0; }   /* a global label rule makes labels 20 px wide columns */
  .zcs-sw input[type=checkbox] { width: 16px; height: 16px; flex: none; margin: 2px 0 0; }
  .zcs-sw > span { flex: 1; min-width: 0; }
  .zcs-sw small { display: block; color: #6b7280; font-size: 12px; }
  .zcs-color { display: flex; gap: 8px; align-items: center; }
  .zcs-color input[type=color] { width: 44px; height: 38px; border: 1px solid #cfd5dc; border-radius: 8px; padding: 2px; background: #fff; }
  .zcs-link { display: flex; gap: 6px; align-items: center; }
  .zcs-link code { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: #f4f5fa; border-radius: 6px; padding: 7px 8px; font-size: 12px; direction: ltr; }
  .zcs-status { display: inline-block; border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
  .zcs-status.on { background: #dcfce7; color: #166534; } .zcs-status.off { background: #f1f5f9; color: #475569; }
  .zcs-side p { font-size: 13px; color: #4b5563; line-height: 1.5; margin: 0 0 10px; }
  .zcs-side ul { padding-inline-start: 18px; margin: 4px 0 0; font-size: 13px; }
  .zcs-foot { display: flex; gap: 8px; justify-content: flex-end; position: sticky; bottom: 0; background: #f4f5fa; padding: 10px 0; }
  .zcs-msg { font-size: 13px; padding: 8px 10px; border-radius: 8px; margin-bottom: 10px; }
  .zcs-msg.ok { background: #ecfdf5; color: #166534; } .zcs-msg.err { background: #fef2f2; color: #9b2c24; }
  @media (max-width: 900px) { .zcs { grid-template-columns: minmax(0, 1fr); } .zcs-grid { grid-template-columns: 1fr; } }
  `],
  template: `
<div class="hr-page" data-careers-settings>
  <div class="hr-head"><h1>{{ 'Careers page' | t }}</h1>
    <span class="zcs-status" [class.on]="s?.enabled" [class.off]="!s?.enabled">{{ (s?.enabled ? 'Published' : 'Off') | t }}</span></div>
  <p class="hr-intro">{{ 'A public page with your open jobs and an apply form – applications arrive in the candidate pipeline. Jobs appear on it when they are published with the "Careers page" channel.' | t }}</p>
  <div class="zcs-msg err" *ngIf="err" role="alert">{{ err }}</div>
  <div class="zcs-msg ok" *ngIf="ok" role="status">{{ ok }}</div>
  <div class="zcs" *ngIf="s">
    <div>
      <section class="zcs-card"><h3>{{ 'Page' | t }}</h3>
        <div class="zcs-grid">
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.enabled" data-enabled><span>{{ 'Publish the careers page' | t }}<small>{{ 'Off: the link answers that the company has no careers page.' | t }}</small></span></label>
          <label class="zcs-f">{{ 'Page title' | t }}<input [(ngModel)]="s.page_title" maxlength="150"></label>
          <label class="zcs-f">{{ 'Brand colour' | t }}<span class="zcs-color"><input type="color" [(ngModel)]="s.brand_color"><input [(ngModel)]="s.brand_color" maxlength="7" style="flex:1"></span></label>
          <label class="zcs-f wide">{{ 'Headline' | t }}<input [(ngModel)]="s.headline" maxlength="200" data-headline></label>
          <label class="zcs-f wide">{{ 'Introduction' | t }}<textarea [(ngModel)]="s.intro"></textarea></label>
          <label class="zcs-f wide">{{ 'About the company' | t }}<textarea [(ngModel)]="s.about"></textarea><small>{{ 'Shown beside the jobs.' | t }}</small></label>
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.show_salary"><span>{{ 'Show the salary range of the jobs' | t }}</span></label>
        </div>
      </section>
      <section class="zcs-card"><h3>{{ 'Apply form' | t }}</h3>
        <div class="zcs-grid">
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.require_cv"><span>{{ 'A CV is required' | t }}</span></label>
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.general_applications"><span>{{ '"Send us your CV" without a job' | t }}<small>{{ 'The candidate goes to the "General applications" talent pool.' | t }}</small></span></label>
          <label class="zcs-f wide">{{ 'How we use the details (the candidate must confirm)' | t }}<textarea [(ngModel)]="s.privacy_text"></textarea></label>
          <label class="zcs-f">{{ 'Keep CVs for (months) when the candidate agrees' | t }}<input type="number" min="1" max="120" [(ngModel)]="s.retention_months"></label>
        </div>
      </section>
      <section class="zcs-card"><h3>{{ 'E-mails' | t }}</h3>
        <div class="zcs-grid">
          <label class="zcs-f wide">{{ 'Tell these addresses about each application' | t }}<input [(ngModel)]="s.notify_emails" placeholder="hr@company.ae, recruiter@company.ae"><small>{{ 'The hiring manager of the job is told in ZEO as well.' | t }}</small></label>
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.acknowledge"><span>{{ 'E-mail the candidate that the application arrived' | t }}</span></label>
          <label class="zcs-f wide" *ngIf="s.acknowledge">{{ 'Text of that e-mail' | t }}<textarea [(ngModel)]="s.acknowledge_text"></textarea></label>
        </div>
      </section>
      <section class="zcs-card"><h3>{{ 'Job-board feed' | t }}</h3>
        <div class="zcs-grid">
          <label class="zcs-sw"><input type="checkbox" [(ngModel)]="s.feed_enabled" data-feed><span>{{ 'Publish the job feed (XML and JSON)' | t }}<small>{{ 'LinkedIn, Indeed, Bayt, Naukrigulf and most job sites read the XML feed: give them its address.' | t }}</small></span></label>
          <label class="zcs-f">{{ 'Feed key (optional)' | t }}<input [(ngModel)]="s.feed_key" maxlength="40"><small>{{ 'When set, the feed needs ?key=… in its address.' | t }}</small></label>
        </div>
      </section>
      <div class="zcs-foot">
        <button type="button" class="btn btn-danger" (click)="load()">{{ 'Cancel' | t }}</button>
        <button type="button" class="btn btn-primary hr-save" [disabled]="busy" (click)="save()" data-save>{{ (busy ? 'Saving…' : 'Save') | t }}</button>
      </div>
    </div>
    <aside class="zcs-side">
      <section class="zcs-card"><h3>{{ 'Your careers page' | t }}</h3>
        <div class="zcs-link"><code [title]="pageUrl" data-page-url>{{ pageUrl }}</code>
          <button type="button" class="btn btn-sm btn-light" (click)="copy(pageUrl)">{{ 'Copy' | t }}</button></div>
        <p style="margin-top:10px"><a [href]="pageUrl" target="_blank" rel="noopener" data-open>{{ 'Open the page' | t }}</a></p>
        <p>{{ '{0} jobs on the page now.' | t:[s.open_jobs] }}</p>
        <ng-container *ngIf="s.jobs_not_listed?.length">
          <p>{{ 'Published but not on the page (no "Careers page" channel or closing date passed):' | t }}</p>
          <ul><li *ngFor="let j of s.jobs_not_listed">{{ j.code }} – {{ j.title }}</li></ul>
        </ng-container>
        <p style="margin-top:10px">{{ 'Add ?src=linkedin (or indeed, bayt) to the link you post on a job site: the candidates show where they came from.' | t }}</p>
      </section>
      <section class="zcs-card" *ngIf="s.feed_enabled"><h3>{{ 'Feed addresses' | t }}</h3>
        <p>XML</p><div class="zcs-link"><code [title]="feedXml">{{ feedXml }}</code><button type="button" class="btn btn-sm btn-light" (click)="copy(feedXml)">{{ 'Copy' | t }}</button></div>
        <p style="margin-top:10px">JSON</p><div class="zcs-link"><code [title]="feedJson">{{ feedJson }}</code><button type="button" class="btn btn-sm btn-light" (click)="copy(feedJson)">{{ 'Copy' | t }}</button></div>
      </section>
      <section class="zcs-card"><h3>{{ 'On your website' | t }}</h3>
        <p>{{ 'A button for your own website:' | t }}</p>
        <div class="zcs-link"><code [title]="snippet">{{ snippet }}</code><button type="button" class="btn btn-sm btn-light" (click)="copy(snippet)">{{ 'Copy' | t }}</button></div>
        <p style="margin-top:10px"><a routerLink="/main-sidebar/recruitment-options/talent-pools">{{ 'Talent pools' | t }}</a> · <a routerLink="/main-sidebar/recruitment-options/job-openings">{{ 'Job openings' | t }}</a></p>
      </section>
    </aside>
  </div>
</div>`,
})
export class ZCareersSettingsComponent implements OnInit {
  s: any = null; err = ''; ok = ''; busy = false;
  private ep = '/recruitment/api/careers-settings/';
  constructor(private api: ModuleApiService, private http: HttpClient, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { void this.load(); }

  private abs(path: string): string {
    const base = environment.apiBaseUrl || '';
    const full = base + path;
    return /^https?:/.test(full) ? full : location.origin + (full.startsWith('/') ? '' : '/') + full;
  }
  get pageUrl(): string {
    if (!this.s) { return ''; }
    return this.s.app_url_set && /^https?:/.test(this.s.page_url || '') ? this.s.page_url : `${location.origin}/careers/${this.s.schema}`;   // without ZEO_APP_URL: this web app's address
  }
  get feedXml(): string { return this.s ? this.abs(this.s.feed_xml) : ''; }
  get feedJson(): string { return this.s ? this.abs(this.s.feed_json) : ''; }
  get snippet(): string {
    return `<a href="${this.pageUrl}" style="display:inline-block;padding:10px 18px;border-radius:8px;background:${this.s?.brand_color || '#4f46e5'};color:#fff;text-decoration:none">${i18nT('Careers')}</a>`;
  }

  async load(): Promise<void> {
    this.err = ''; this.ok = '';
    try { this.s = await firstValueFrom(this.api.get<any>(this.ep)); }
    catch (e) { this.err = httpErrorText(e); }
    this.cd.markForCheck();
  }

  async save(): Promise<void> {
    this.err = ''; this.ok = ''; this.busy = true;
    const keys = ['enabled', 'page_title', 'headline', 'intro', 'about', 'brand_color', 'show_salary', 'require_cv', 'general_applications', 'privacy_text',
      'retention_months', 'notify_emails', 'acknowledge', 'acknowledge_text', 'feed_enabled', 'feed_key'];
    const body: any = {};
    keys.forEach(k => (body[k] = this.s[k]));
    body.retention_months = Number(body.retention_months) || 24;
    try {
      this.s = await firstValueFrom(this.http.patch<any>(`${environment.apiBaseUrl}${this.ep}`, body, { params: { schema: this.api.schema } }));
      this.ok = i18nT('Saved.');
    } catch (e) { this.err = httpErrorText(e); }
    this.busy = false; this.cd.markForCheck();
  }

  async copy(v: string): Promise<void> {
    try { await navigator.clipboard.writeText(v); this.ok = i18nT('Copied.'); } catch { this.ok = ''; }
    this.cd.markForCheck();
  }
}
