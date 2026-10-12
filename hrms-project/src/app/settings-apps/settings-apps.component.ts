import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppSuite, ZSuiteService } from '../shared-ui/z-suite.service';
import { I18N_UI } from '../shared-ui/i18n.service';

interface AppLink { with: string; title: string; what: string; other_active: boolean; on: boolean; }
interface AppRow {
  key: string; title: string; icon: string; description: string; kind: string; page: string;
  installed: boolean; active: boolean; industry: string; industry_label: string; industry_source: string;
  activated_at: string | null; activated_by: string; industries?: { code: string; label: string }[];
  suggested?: string; suggested_label?: string; previous?: string; roles?: string[]; links?: AppLink[];
}

/**
 * v1.21.0 – Settings → Apps. Every ZEO app (HRMS, Projects, CRM, Property, Maintenance, HSE) works on its own; the company
 * administrator activates the ones the company uses. On activation the app asks for its industry: the company master's
 * industry type is the default and can be changed for this app. When two apps are active their links switch on by
 * themselves; deactivating an app hides it and switches its links off – its data is kept.
 * Route: /main-sidebar/settings/apps (SETTINGS_APPS_ROUTES in the settings children).
 */
@Component({
  selector: 'app-settings-apps',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './settings-apps.css'],
  template: `
<div class="container sa-wrap" data-no-help>
  <div class="lp-head">
    <div>
      <h1 class="page-title">{{ 'Apps' | t }}</h1>
      <p class="lp-desc">{{ 'Each app works on its own. Activate the apps this company uses; when two of them are active they link up by themselves. Switching an app off hides it from the menu – its records are kept and come back when you activate it again.' | t }}</p>
    </div>
  </div>

  <div class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</div>
  <p class="lp-muted" *ngIf="!apps.length && !msg">{{ 'Loading the apps…' | t }}</p>

  <div class="sa-company" *ngIf="apps.length">
    <mat-icon aria-hidden="true">domain</mat-icon>
    <span>{{ 'Company industry type' | t }}: <b>{{ companyIndustryLabel || 'not set' }}</b>
      <small>From Settings › Company. Every app starts with this industry; you can choose another one for an app when you activate it.</small></span>
    <a class="lp-btn" routerLink="/main-sidebar/settings/location-master">{{ 'Change in Company' | t }}</a>
  </div>
  <p class="sa-note" *ngIf="apps.length && !canManage">{{ 'Only a company administrator can activate or deactivate apps.' | t }}</p>

  <div class="sa-grid">
    <section class="sa-card" *ngFor="let a of apps" [class.on]="a.active" [class.off]="!a.installed" [attr.aria-labelledby]="'sa-t-' + a.key">
      <header class="sa-top">
        <span class="sa-icon"><mat-icon aria-hidden="true">{{ a.icon }}</mat-icon></span>
        <div class="sa-name">
          <h2 [id]="'sa-t-' + a.key">{{ a.title | t }}</h2>
          <p>{{ a.description }}</p>
        </div>
        <span class="sa-state" [class.on]="a.active">{{ (!a.installed ? 'Not installed' : a.active ? 'Active' : 'Not active') | t }}</span>
      </header>

      <dl class="sa-facts" *ngIf="a.installed">
        <div><dt>{{ 'Industry' | t }}</dt><dd>{{ a.active || a.industry ? (a.industry_label || a.industry || '–') : '–' }}
          <small *ngIf="a.industry && a.industry_source === 'company'">{{ 'company industry' | t }}</small>
          <small *ngIf="a.industry && a.industry_source === 'chosen'">{{ 'chosen for this app' | t }}</small></dd></div>
        <div *ngIf="a.activated_at"><dt>{{ 'Activated' | t }}</dt><dd>{{ a.activated_at | date:'d MMM y' }}<small *ngIf="a.activated_by">by {{ a.activated_by }}</small></dd></div>
        <div *ngIf="a.roles?.length"><dt>{{ 'Permission groups' | t }}</dt><dd>{{ a.roles!.length }}
          <small><a routerLink="/main-sidebar/settings/user-grouping-master">Settings › Permission groups</a></small></dd></div>
      </dl>

      <div class="sa-links" *ngIf="a.links?.length">
        <h3>{{ 'Works with' | t }}</h3>
        <ul>
          <li *ngFor="let l of a.links" [class.on]="l.on">
            <mat-icon aria-hidden="true">{{ l.on ? 'link' : 'link_off' }}</mat-icon>
            <span><b>{{ l.title }}</b> – {{ l.on ? 'linked' : (l.other_active ? 'links when ' + a.title + ' is active' : 'links when ' + l.title + ' is active') }}
              <small>{{ l.what }}</small></span>
          </li>
        </ul>
      </div>

      <!-- activation: the industry question -->
      <div class="sa-ask" *ngIf="asking === a.key">
        <p class="sa-q">Do you want to change the industry for {{ a.title }}?</p>
        <label class="sa-opt">
          <input type="radio" [name]="'ind-' + a.key" [value]="false" [(ngModel)]="change">
          <span *ngIf="a.previous">No – keep <b>{{ label(a, a.previous) }}</b><small>The industry {{ a.title }} had before it was switched off.</small></span>
          <span *ngIf="!a.previous">No – use <b>{{ a.suggested_label }}</b><small>{{ a.kind === 'core' ? 'The company industry type.' : 'Matches the company industry type (' + (companyIndustryLabel || 'not set') + ').' }}</small></span>
        </label>
        <label class="sa-opt">
          <input type="radio" [name]="'ind-' + a.key" [value]="true" [(ngModel)]="change">
          <span>{{ 'Yes – choose the industry for this app' | t }}</span>
        </label>
        <label class="sa-pick" *ngIf="change">
          <span>Industry for {{ a.title }}</span>
          <select [(ngModel)]="industry" [attr.aria-label]="'Industry for ' + a.title">
            <option *ngFor="let i of a.industries" [value]="i.code">{{ i.label }}</option>
          </select>
        </label>
        <p class="sa-hint" *ngIf="a.kind !== 'core'">The industry pack adds ready-made setup for this industry (it only adds, it never removes your own setup).</p>
        <div class="sa-actions">
          <button type="button" class="lp-btn" (click)="asking = ''" [disabled]="busy">{{ 'Cancel' | t }}</button>
          <button type="button" class="lp-btn primary" (click)="activate(a)" [disabled]="busy || (change && !industry)">{{ busy ? 'Activating…' : 'Activate ' + a.title }}</button>
        </div>
      </div>

      <div class="sa-ask warn" *ngIf="leaving === a.key">
        <p class="sa-q">Deactivate {{ a.title }}?</p>
        <p class="sa-hint">{{ a.title }} leaves the menu and its links to the other apps switch off. Its records are kept and come back when you activate it again.</p>
        <div class="sa-actions">
          <button type="button" class="lp-btn" (click)="leaving = ''" [disabled]="busy">{{ 'Keep it active' | t }}</button>
          <button type="button" class="lp-btn danger" (click)="deactivate(a)" [disabled]="busy">{{ busy ? 'Deactivating…' : 'Deactivate ' + a.title }}</button>
        </div>
      </div>

      <footer class="sa-foot" *ngIf="a.installed && canManage && asking !== a.key && leaving !== a.key">
        <button type="button" class="lp-btn primary" *ngIf="!a.active" (click)="ask(a)">{{ 'Activate' | t }}</button>
        <ng-container *ngIf="a.active">
          <button type="button" class="lp-btn" (click)="open(a)">Open {{ a.title }}</button>
          <button type="button" class="lp-btn" (click)="leaving = a.key; asking = ''">{{ 'Deactivate' | t }}</button>
        </ng-container>
      </footer>
    </section>
  </div>
</div>`,
})
export class SettingsAppsComponent implements OnInit {
  apps: AppRow[] = [];
  companyIndustryLabel = ''; canManage = false;
  msg = ''; err = false; busy = false;
  asking = ''; leaving = ''; change = false; industry = '';

  constructor(private http: HttpClient, private router: Router, private suites: ZSuiteService, private cd: ChangeDetectorRef) {}

  private url(path: string): string {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    return `${environment.apiBaseUrl}/zeo-apps/api/${path}?schema=${encodeURIComponent(schema)}`;
  }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get(this.url('apps/')));
      this.apps = r.apps || []; this.companyIndustryLabel = r.company_industry_label || ''; this.canManage = !!r.can_manage;
    } catch (e: any) { this.say(this.error(e, 'The apps could not be loaded.'), true); }
    this.cd.markForCheck();
  }

  label(a: AppRow, code: string): string { return a.industries?.find(i => i.code === code)?.label || code; }

  ask(a: AppRow): void { this.asking = a.key; this.leaving = ''; this.change = false; this.industry = a.previous || a.suggested || ''; this.msg = ''; }

  async activate(a: AppRow): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      // no change: the server keeps the industry the app had before, or uses the company's
      const body = { industry: this.change ? this.industry : '' };
      const r: any = await firstValueFrom(this.http.post(this.url(`apps/${a.key}/activate/`), body));
      const added = Object.values(r.added || {}).reduce((n: number, v: any) => n + (typeof v === 'number' ? v : 0), 0);
      this.say(`${a.title} is active with the industry ${r.industry_label || r.industry}.` + (added ? ` ${added} setup records were added from the industry pack.` : ''), false);
      this.asking = '';
      this.suites.loadActive(true);
      await this.load();
    } catch (e: any) { this.say(this.error(e, `${a.title} could not be activated.`), true); }
    this.busy = false; this.cd.markForCheck();
  }

  async deactivate(a: AppRow): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      await firstValueFrom(this.http.post(this.url(`apps/${a.key}/deactivate/`), {}));
      this.say(`${a.title} is deactivated. Its records are kept.`, false);
      this.leaving = '';
      this.suites.loadActive(true);
      await this.load();
    } catch (e: any) { this.say(this.error(e, `${a.title} could not be deactivated.`), true); }
    this.busy = false; this.cd.markForCheck();
  }

  open(a: AppRow): void {
    this.suites.set(a.key as AppSuite);
    this.router.navigateByUrl(a.page);
  }

  private say(m: string, err: boolean): void { this.msg = m; this.err = err; }
  private error(e: any, fallback: string): string {
    const b = e?.error;
    if (b?.detail) { return b.detail; }
    return typeof b === 'string' && b.length < 300 ? b : fallback;
  }
}

export const SETTINGS_APPS_ROUTES: Routes = [
  { path: 'apps', component: SettingsAppsComponent, data: { title: 'Apps' } },
];
