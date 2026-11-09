// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppSuite, ZSuiteService } from '../shared-ui/z-suite.service';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { CloudLicence, CloudStatus, ZeoCloudService } from '../shared-ui/zeo-cloud.service';

interface AppLink { with: string; title: string; what: string; other_active: boolean; on: boolean; }
interface AppRow {
  key: string; title: string; icon: string; description: string; kind: string; page: string;
  installed: boolean; active: boolean; industry: string; industry_label: string; industry_source: string;
  activated_at: string | null; activated_by: string; industries?: { code: string; label: string }[];
  suggested?: string; suggested_label?: string; previous?: string; roles?: string[]; links?: AppLink[];
  // v1.67.3 (apps): what the app needs, what activating it brings now, the active apps that need it
  setup?: { enforced: boolean; open: number; blocked: boolean; allow: boolean; link: string };   // v1.67.6 (setup) item 5
  depends?: { key: string; title: string }[]; brings?: { key: string; title: string }[]; needed_by?: { key: string; title: string }[]; needed_message?: string;
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
      <p class="lp-desc">{{ 'Each app works on its own. Activate the apps this company uses; when two of them are active they link up by themselves. Switching an app off hides it from the menu – its records are kept and come back when you activate it again.' | t }} {{ 'An app that needs another app brings it with it (Payroll needs HR); an app cannot be switched off while an active app needs it.' | t }}</p>
    </div>
  </div>
  <!-- v1.67.3 (apps): the company core, always on -->
  <div class="sa-core" *ngIf="core" data-core>
    <mat-icon aria-hidden="true">verified_user</mat-icon>
    <span>{{ core }}</span>
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
      <!-- v1.67.3 (apps): what the app needs and which active apps need it -->
      <p class="sa-dep" *ngIf="a.depends?.length" data-needs>
        <mat-icon aria-hidden="true">account_tree</mat-icon>{{ 'Needs {0}' | t:[titles(a.depends)] }}
        <small *ngIf="!a.active && a.brings?.length">{{ '– activating {0} also activates {1}' | t:[(a.title | t), titles(a.brings)] }}</small>
        <small *ngIf="a.active || !a.brings?.length">{{ '– active' | t }}</small></p>
      <p class="sa-dep" *ngIf="!a.depends?.length" data-needs>
        <mat-icon aria-hidden="true">check_circle</mat-icon>{{ 'Needs only the company core' | t }}</p>
      <p class="sa-dep used" *ngIf="a.needed_by?.length" data-needed-by>
        <mat-icon aria-hidden="true">lock</mat-icon>{{ 'Needed by {0}' | t:[titles(a.needed_by)] }}</p>
      <!-- v1.23.0 ZEO Cloud: the account's licence for this app -->
      <p class="sa-lic" *ngIf="lic(a.key) as l" [ngClass]="l.state">{{ licText(a.key) }}</p>

      <dl class="sa-facts" *ngIf="a.installed">
        <div><dt>{{ 'Industry' | t }}</dt><dd>{{ a.active || a.industry ? (a.industry_label || a.industry || '–') : '–' }}
          <small *ngIf="a.industry && a.industry_source === 'company'">{{ 'company industry' | t }}</small>
          <small *ngIf="a.industry && a.industry_source === 'chosen'">{{ 'chosen for this app' | t }}</small></dd></div>
        <div *ngIf="a.activated_at"><dt>{{ 'Activated' | t }}</dt><dd>{{ a.activated_at | date:'dd/MM/yyyy' }}<small *ngIf="a.activated_by">{{ 'by {0}' | t:[a.activated_by] }}</small></dd></div>
        <div *ngIf="a.roles?.length"><dt>{{ 'Permission groups' | t }}</dt><dd>{{ a.roles!.length }}
          <small><a routerLink="/main-sidebar/settings/user-grouping-master">{{ 'Settings › Permission groups' | t }}</a></small></dd></div>
      </dl>

      <div class="sa-links" *ngIf="a.links?.length">
        <h3>{{ 'Works with' | t }}</h3>
        <ul>
          <li *ngFor="let l of a.links" [class.on]="l.on">
            <mat-icon aria-hidden="true">{{ l.on ? 'link' : 'link_off' }}</mat-icon>
            <span><b>{{ l.title }}</b> – {{ l.on ? ('linked' | t) : ('links when {0} is active' | t:[((l.other_active ? a.title : l.title) | t)]) }}<!-- v1.67.8 (fixes) item 14: one translatable sentence (was glued) -->
              <small>{{ l.what }}</small></span>
          </li>
        </ul>
      </div>

      <!-- activation: the industry question -->
      <div class="sa-ask" *ngIf="asking === a.key">
        <p class="sa-q">{{ 'Do you want to change the industry for {0}?' | t:[(a.title | t)] }}</p>
        <label class="sa-opt">
          <input type="radio" [name]="'ind-' + a.key" [value]="false" [(ngModel)]="change">
          <span *ngIf="a.previous">{{ 'No – keep' | t }} <b>{{ label(a, a.previous) }}</b><small>{{ 'The industry {0} had before it was switched off.' | t:[(a.title | t)] }}</small></span>
          <span *ngIf="!a.previous">{{ 'No – use' | t }} <b>{{ a.suggested_label }}</b><small>{{ a.kind === 'core' ? ('The company industry type.' | t) : ('Matches the company industry type ({0}).' | t:[companyIndustryLabel || ('not set' | t)]) }}</small></span>
        </label>
        <label class="sa-opt">
          <input type="radio" [name]="'ind-' + a.key" [value]="true" [(ngModel)]="change">
          <span>{{ 'Yes – choose the industry for this app' | t }}</span>
        </label>
        <label class="sa-pick" *ngIf="change">
          <span>{{ 'Industry for {0}' | t:[(a.title | t)] }}</span>
          <select [(ngModel)]="industry" [attr.aria-label]="'Industry for {0}' | t:[(a.title | t)]">
            <option *ngFor="let i of a.industries" [value]="i.code">{{ i.label }}</option>
          </select>
        </label>
        <p class="sa-hint" *ngIf="a.kind !== 'core'">{{ 'The industry pack adds ready-made setup for this industry (it only adds, it never removes your own setup).' | t }}</p>
        <p class="sa-brings" *ngIf="a.brings?.length" data-brings>
          <mat-icon aria-hidden="true">info</mat-icon>{{ '{0} needs {1}: activating {0} also activates {1}.' | t:[(a.title | t), titles(a.brings)] }}</p>
        <div class="sa-actions">
          <button type="button" class="lp-btn" (click)="asking = ''" [disabled]="busy">{{ 'Cancel' | t }}</button>
          <button type="button" class="lp-btn primary" (click)="activate(a)" [disabled]="busy || (change && !industry)">{{ busy ? ('Activating…' | t) : ('Activate {0}' | t:[(a.title | t)]) }}</button>
        </div>
      </div>

      <div class="sa-ask warn" *ngIf="leaving === a.key">
        <p class="sa-q">{{ 'Deactivate {0}?' | t:[(a.title | t)] }}</p>
        <p class="sa-hint">{{ '{0} leaves the menu and its links to the other apps switch off. Its records are kept and come back when you activate it again.' | t:[(a.title | t)] }}</p>
        <!-- v1.67.3 (apps): refused while an active app needs it -->
        <p class="sa-needed" *ngIf="a.needed_by?.length" role="alert" data-needed-msg>
          <mat-icon aria-hidden="true">block</mat-icon><span>{{ a.needed_message }} {{ 'Switch off {0} first.' | t:[titles(a.needed_by)] }}</span></p>
        <div class="sa-actions">
          <button type="button" class="lp-btn" (click)="leaving = ''" [disabled]="busy">{{ 'Keep it active' | t }}</button>
          <button type="button" class="lp-btn danger" (click)="deactivate(a)" [disabled]="busy || !!a.needed_by?.length">{{ busy ? ('Deactivating…' | t) : ('Deactivate {0}' | t:[(a.title | t)]) }}</button>
        </div>
      </div>

      <footer class="sa-foot" *ngIf="a.installed && canManage && asking !== a.key && leaving !== a.key">
        <button type="button" class="lp-btn primary" *ngIf="!a.active && canLicence(a.key)" (click)="ask(a)">{{ 'Activate' | t }}</button>
        <ng-container *ngIf="!a.active && !canLicence(a.key)">
          <button type="button" class="lp-btn" *ngIf="cloudOwner" (click)="requestApp(a)" [disabled]="busy">{{ 'Request' | t }}</button>
          <span class="sa-hint" *ngIf="!cloudOwner">{{ 'Ask the account owner.' | t }}</span>
        </ng-container>
        <ng-container *ngIf="a.active">
          <button type="button" class="lp-btn" (click)="open(a)">{{ 'Open {0}' | t:[(a.title | t)] }}</button>
          <a class="lp-btn" *ngIf="a.setup" [routerLink]="a.setup.link" [class.primary]="a.setup.open && a.setup.enforced" [attr.data-app-setup]="a.key">{{ 'Setup' | t }}<span *ngIf="a.setup.open"> · {{ '{0} open' | t:[a.setup.open] }}</span></a>   <!-- v1.67.6 (setup) item 5 -->
          <button type="button" class="lp-btn" (click)="leaving = a.key; asking = ''">{{ 'Deactivate' | t }}</button>
        </ng-container>
      </footer>
    </section>
  </div>
</div>`,
})
export class SettingsAppsComponent implements OnInit {
  apps: AppRow[] = [];
  companyIndustryLabel = ''; canManage = false; core = '';   // v1.67.3 (apps)
  msg = ''; err = false; busy = false;
  asking = ''; leaving = ''; change = false; industry = '';

  cloud: CloudStatus | null = null;   // v1.23.0 ZEO Cloud licences of the account
  get cloudOwner(): boolean { return !!this.cloud?.owner; }

  constructor(private http: HttpClient, private router: Router, private suites: ZSuiteService, private cd: ChangeDetectorRef,
              private zc: ZeoCloudService) {
    this.zc.status$.subscribe(s => { this.cloud = s && s.linked ? s : null; this.cd.markForCheck(); });
    this.zc.load(true);
  }

  lic(key: string): CloudLicence | null { return this.cloud?.apps?.[key] || null; }
  canLicence(key: string): boolean { const l = this.lic(key); return !l || l.state === 'included' || l.state === 'licensed' || l.state === 'trial'; }
  licText(key: string): string {
    const l = this.lic(key); if (!l) { return ''; }
    if (l.state === 'included') { return i18nT('Included in every plan.'); }   // v1.67.3 (apps): HR no longer comes with every app
    if (l.state === 'none') { return i18nT('Not in your plan.'); }
    if (l.state === 'expired') { return i18nT('Licence ended {0} – read-only.', [l.valid_until]); }
    const parts = [l.state === 'trial' ? i18nT('Trial – {0} days left', [l.days_left ?? 0]) : i18nT('Licensed')];
    if (l.companies) { parts.push(i18nT('{0} of {1} companies used', [l.used ?? 0, l.companies])); }
    return parts.join(' · ');
  }
  async requestApp(a: AppRow): Promise<void> {
    if (!this.cloud?.account) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/cloud/api/accounts/${this.cloud.account.id}/request/`, { what: 'Another app', text: `${a.title}` }));
      this.say(i18nT('Your request for {0} was sent to Adept.', [a.title]), false);
    } catch (e: any) { this.say(this.error(e, i18nT('The request could not be sent.')), true); }
    this.busy = false; this.cd.markForCheck();
  }

  private url(path: string): string {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    return `${environment.apiBaseUrl}/zeo-apps/api/${path}?schema=${encodeURIComponent(schema)}`;
  }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get(this.url('apps/')));
      this.apps = r.apps || []; this.companyIndustryLabel = r.company_industry_label || ''; this.canManage = !!r.can_manage; this.core = r.core || '';
    } catch (e: any) { this.say(this.error(e, 'The apps could not be loaded.'), true); }
    this.cd.markForCheck();
  }

  label(a: AppRow, code: string): string { return a.industries?.find(i => i.code === code)?.label || code; }
  titles(l: { title: string }[] | undefined): string { return (l || []).map(x => i18nT(x.title)).join(', '); }   // v1.67.3 (apps)

  ask(a: AppRow): void { this.asking = a.key; this.leaving = ''; this.change = false; this.industry = a.previous || a.suggested || ''; this.msg = ''; }

  async activate(a: AppRow): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      // no change: the server keeps the industry the app had before, or uses the company's
      const body = { industry: this.change ? this.industry : '' };
      const r: any = await firstValueFrom(this.http.post(this.url(`apps/${a.key}/activate/`), body));
      const added = Object.values(r.added || {}).reduce((n: number, v: any) => n + (typeof v === 'number' ? v : 0), 0);
      const withs: string[] = (r.added && Array.isArray(r.added.with)) ? r.added.with : [];   // v1.67.3 (apps) what came with it
      this.say(`${a.title} is active with the industry ${r.industry_label || r.industry}.` + (added ? ` ${added} setup records were added from the industry pack.` : '')
        + (withs.length ? ' ' + i18nT('{0} was activated with it.', [withs.map(w => i18nT(w)).join(', ')]) : ''), false);
      this.asking = '';
      this.suites.loadActive(true);
      this.zc.load(true);
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
    this.suites.set((a.key === 'payroll' ? 'hrms' : a.key) as AppSuite);   // v1.23.0 Payroll lives in the HR menu
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
