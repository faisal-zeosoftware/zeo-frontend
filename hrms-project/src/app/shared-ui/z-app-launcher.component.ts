/**
 * v1.20.0 – app launcher in the top bar: the three ZEO apps (HRMS, Projects, Settings), a search over every module and page
 * the user may open, the modules used last ("Recent") and a tile per module of the chosen app. Picking a tile opens the module
 * and switches the main menu to that app.
 */
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';
import { ALL_APPS, MAIN_GROUPS, MenuApp, SUITES, appForUrl, menuPicked } from './menu-config';
import { appLanding, suiteOfApp, visibleGroups, visibleSections } from './z-module-menu.component';
import { ZListService } from './z-list.service';
import { CountryPackService } from './country-pack.service';
import { I18N_UI, i18nT } from './i18n.service';
import { AppSuite, ZSuiteService } from './z-suite.service';
import { ZRecordService } from './z-record.service';   // v1.45.0 starred / recently viewed records

interface Tile { key: string; label: string; icon: string; link: string; suite: AppSuite; }
interface Hit { label: string; where: string; link: string; icon: string; suite: AppSuite | null; appKey: string; }

/** Icons that read better as tiles (line style, one per module). */
const TILE_ICON: Record<string, string> = {
  home: 'dashboard', mywork: 'work_history', employees: 'people_alt', attendance: 'schedule', leave: 'event_busy', payroll: 'payments',
  expense: 'receipt_long', assets: 'inventory_2', performance: 'speed', learning: 'school', recruitment: 'person_add', reports: 'query_stats',
  settings: 'domain', hrsettings: 'tune', cal: 'calendar_month', todo: 'task_alt', org: 'lan', orgstructure: 'corporate_fare',
};

@Component({
  selector: 'z-app-launcher',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ...I18N_UI],
  template: `
  <div class="zal" data-no-help (click)="$event.stopPropagation()">
    <button type="button" class="zal-btn" (click)="toggle()" [attr.aria-expanded]="open" aria-haspopup="dialog"
            [title]="'Apps and modules' | t">
      <mat-icon aria-hidden="true">apps</mat-icon><span class="zal-btn-t">{{ suiteLabel(suite) | t }}</span>
    </button>
    <div class="zal-panel" *ngIf="open" role="dialog" [attr.aria-label]="'Apps and modules' | t">
      <div class="zal-suites" role="tablist">
        <button type="button" role="tab" *ngFor="let s of shownSuites()" [class.on]="view === s.key" [attr.aria-selected]="view === s.key" (click)="openSuite(s.key)">
          <mat-icon aria-hidden="true">{{ s.icon }}</mat-icon><span><b>{{ s.label | t }}</b><small>{{ s.hint | t }}</small></span>
        </button>
      </div>
      <div class="zal-top">
        <label class="zal-search"><mat-icon aria-hidden="true">search</mat-icon>
          <input #box [(ngModel)]="q" (ngModelChange)="search()" (keydown.enter)="first()" [placeholder]="'Search modules and pages…' | t"
                 [attr.aria-label]="'Search modules and pages' | t"></label>
        <div class="zal-recent" *ngIf="recent.length">
          <span>{{ 'Recent:' | t }}</span>
          <button type="button" *ngFor="let r of recent" [class.cur]="r.key === current" (click)="go(r.link, r.suite, r.key)">{{ r.label }}</button>
        </div>
      </div>
      <!-- v1.45.0 starred and recently viewed records -->
      <div class="zal-recs" *ngIf="!q.trim() && (stars.starred.length || stars.recent.length)">
        <div class="zal-rc" *ngIf="stars.starred.length"><span class="zal-rh"><mat-icon aria-hidden="true">star</mat-icon>{{ 'Starred' | t }}</span>
          <button type="button" *ngFor="let r of stars.starred.slice(0, 8)" (click)="openRec(r)" [title]="r.app">{{ r.label || r.object_id }}<small>{{ r.app }}</small></button></div>
        <div class="zal-rc" *ngIf="stars.recent.length"><span class="zal-rh"><mat-icon aria-hidden="true">history</mat-icon>{{ 'Recently viewed' | t }}</span>
          <button type="button" *ngFor="let r of stars.recent.slice(0, 8)" (click)="openRec(r)" [title]="r.app">{{ r.label || r.object_id }}<small>{{ r.app }}</small></button></div>
      </div>
      <div class="zal-hits" *ngIf="q.trim()">
        <button type="button" *ngFor="let h of hits" (click)="go(h.link, h.suite, h.appKey)">
          <mat-icon aria-hidden="true">{{ h.icon }}</mat-icon><span><b>{{ h.label }}</b><small>{{ h.where }}</small></span></button>
        <p class="zal-none" *ngIf="!hits.length">{{ 'Nothing found' | t }}</p>
      </div>
      <div class="zal-grid" *ngIf="!q.trim()">
        <button type="button" *ngFor="let t of tiles(view)" class="zal-tile" [class.cur]="t.key === current" (click)="go(t.link, t.suite, t.key)">
          <mat-icon aria-hidden="true">{{ t.icon }}</mat-icon><span>{{ t.label }}</span></button>
      </div>
    </div>
  </div>`,
  styles: [`
  :host { display: inline-block; }
  .zal { position: relative; }
  .zal-btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 12px 0 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.06); color: #fff; font: 500 14px Roboto, sans-serif; cursor: pointer; }
  .zal-btn:hover { background: rgba(255,255,255,.12); }
  .zal-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
  .zal-panel { position: absolute; top: calc(100% + 10px); left: 0; z-index: 3000; width: min(820px, calc(100vw - 24px)); background: #fff; border-radius: 14px;
    box-shadow: 0 16px 48px rgba(27,22,64,.22); padding: 16px; color: #1F2433;
    max-height: calc(100vh - 84px); overflow-y: auto; overscroll-behavior: contain; }   /* v1.28.1 short windows: the module grid scrolls instead of being cut */
  .zal-suites { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 14px; }
  .zal-suites button { display: flex; align-items: center; gap: 10px; text-align: left; padding: 10px 12px; border-radius: 10px; border: 1px solid #E3E5EE; background: #fff; cursor: pointer; }
  .zal-suites button mat-icon { color: #6B7185; }
  .zal-suites button b { display: block; font-size: 14px; font-weight: 600; color: #1B1640; }
  .zal-suites button small { display: block; font-size: 11.5px; color: #6B7185; line-height: 1.3; }
  .zal-suites button.on { border-color: #5B4FE0; background: #EEEDFD; box-shadow: inset 0 0 0 1px #5B4FE0; }
  .zal-suites button.on mat-icon { color: #5B4FE0; }
  .zal-top { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
  .zal-search { flex: 1 1 300px; display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; border-radius: 8px; background: #F1F3F9; margin: 0; }
  .zal-search mat-icon { color: #6B7185; font-size: 20px; width: 20px; height: 20px; }
  .zal-search input { flex: 1; border: 0; background: transparent; outline: none; font-size: 14px; color: #1F2433; min-width: 0; }
  .zal-recent { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13.5px; color: #1F2433; }
  .zal-recent button { border: 0; border-radius: 14px; padding: 4px 12px; background: #EEEDFD; color: #3F35B5; font-size: 13.5px; cursor: pointer; }
  .zal-recent button.cur { background: #FDF3E1; color: #7A4D07; }
  .zal-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  .zal-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 68px; padding: 10px 6px; border-radius: 8px;
    border: 1px solid transparent; background: #F5F6FA; color: #1F2433; font-size: 14px; cursor: pointer; text-align: center; }
  .zal-tile mat-icon { color: #5B4FE0; }
  .zal-tile:hover, .zal-tile:focus-visible { background: #EEEDFD; outline: none; }
  .zal-tile.cur { background: #FDF3E1; border-color: #E8B04B; color: #7A4D07; font-weight: 600; }
  .zal-tile.cur mat-icon { color: #9A6110; }
  .zal-hits { display: flex; flex-direction: column; max-height: 360px; overflow: auto; }
  .zal-hits button { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border: 0; border-radius: 8px; background: none; text-align: left; cursor: pointer; }
  .zal-hits button:hover, .zal-hits button:focus-visible { background: #F1F3F9; outline: none; }
  .zal-hits mat-icon { color: #5B4FE0; }
  .zal-hits b { display: block; font-weight: 500; color: #1B1640; font-size: 14px; }
  .zal-hits small { display: block; color: #6B7185; font-size: 12px; }
  .zal-none { margin: 8px 10px; color: #6B7185; }
  .zal-recs { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; margin-bottom: 12px; }
  .zal-rc { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
  .zal-rh { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #6B7185; margin-right: 4px; }
  .zal-rh mat-icon { font-size: 16px; width: 16px; height: 16px; color: #E0A100; }
  .zal-rc button { border: 1px solid #E3E5EE; background: #fff; border-radius: 8px; padding: 3px 9px; font-size: 12.5px; cursor: pointer; color: #1B1640;
    max-width: 230px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .zal-rc button small { color: #6B7185; margin-left: 5px; font-size: 11px; }
  .zal-rc button:hover { background: #F1F3F9; }
  :host-context([dir=rtl]) .zal-panel { left: auto; right: 0; }
  :host-context([dir=rtl]) .zal-suites button, :host-context([dir=rtl]) .zal-hits button { text-align: right; }
  @media (max-width: 900px) { .zal-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (max-width: 600px) {
    .zal-btn-t { display: none; }
    .zal-panel { position: fixed; top: 64px; left: 12px; right: 12px; width: auto; max-height: calc(100vh - 80px); overflow: auto; }
    .zal-suites { grid-template-columns: 1fr; }
    .zal-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }`],
})
export class ZAppLauncherComponent implements OnInit, OnDestroy {
  open = false; q = ''; view: AppSuite = 'hrms'; suite: AppSuite = 'hrms';
  current = ''; hits: Hit[] = []; recent: { key: string; label: string; link: string; suite: AppSuite | null }[] = [];
  suites = SUITES;
  private access: { admin: boolean; codes: Set<string> } | null = null;
  private subs: Subscription[] = [];
  @ViewChild('box') box?: ElementRef<HTMLInputElement>;

  stars: { starred: any[]; recent: any[] } = { starred: [], recent: [] };
  constructor(private router: Router, private zlist: ZListService, private cp: CountryPackService, private ss: ZSuiteService,
              private cd: ChangeDetectorRef, private zrec: ZRecordService) {}
  openRec(r: any): void { this.open = false; if (r.page) { this.router.navigateByUrl(r.page); } }

  ngOnInit(): void {
    this.subs.push(this.zlist.permissions().subscribe({ next: a => { this.access = a; this.buildRecent(); }, error: () => {} }));
    this.subs.push(this.ss.suite$.subscribe(s => { this.suite = s; if (!this.open) { this.view = s; } this.cd.markForCheck(); }));
    this.subs.push(this.ss.recent$.subscribe(() => this.buildRecent()));
    this.subs.push(this.zrec.stars$.subscribe(x => { this.stars = { starred: x.starred || [], recent: (x.recent || []).filter((r: any) => r.page !== this.router.url) }; this.cd.markForCheck(); }));
    this.subs.push(this.ss.active$.subscribe(() => { this.buildRecent(); this.cd.markForCheck(); }));
    this.subs.push(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { this.mark(); this.open = false; }));
    this.mark();
  }
  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  @HostListener('document:click') outside(): void { if (this.open) { this.open = false; this.cd.markForCheck(); } }
  @HostListener('document:keydown.escape') esc(): void { this.open = false; }

  toggle(): void {
    this.open = !this.open; this.q = ''; this.view = this.suite;
    if (this.open) { this.zrec.refreshStars(); setTimeout(() => this.box?.nativeElement.focus(), 30); }
  }
  /** Apps the user has at least one module in (an employee without rights sees no Settings). */
  shownSuites() {
    // v1.21.0: only the apps active in the company (Settings → Apps) and with at least one module the user may open
    return this.suites.filter(s => this.ss.isActive(s.key) && (s.key === this.suite || this.tiles(s.key).some(t => t.key !== 'cal' && t.key !== 'todo')));
  }
  /** v1.37.1: clicking an app opens it (its home page) – it used to only show the app's modules in the panel. */
  openSuite(key: AppSuite): void {
    this.view = key; this.q = '';
    const home = this.tiles(key).find(t => t.key !== 'cal' && t.key !== 'todo') || this.tiles(key)[0];
    if (home) { this.go(home.link, key, home.key); }
  }
  suiteLabel(s: AppSuite): string { return SUITES.find(x => x.key === s)?.label || 'HRMS'; }
  private mark(): void { this.current = appForUrl(this.router.url)?.key || ''; }

  /** The module tiles of an app: every module the user may open. */
  tiles(s: AppSuite): Tile[] {
    return visibleGroups(this.access, false, s).flatMap(g => g.apps).map(a => ({
      key: a.app.key, label: i18nT(this.cp.text(a.app.label)), icon: TILE_ICON[a.app.key] || a.app.icon, link: this.landing(a.app, a.link), suite: s,
    }));
  }
  private landing(app: MenuApp, link: string): string { return app.key === 'settings' ? '/main-sidebar/settings/home' : link; }

  search(): void {
    const q = this.q.trim().toLowerCase();
    if (!q) { this.hits = []; return; }
    const out: Hit[] = []; const seen = new Set<string>();
    for (const g of MAIN_GROUPS) {
      for (const app of g.apps) {
        const suite = suiteOfApp(app.key);
        const appLabel = i18nT(this.cp.text(app.label));
        const where = suite ? `${appLabel} · ${i18nT(this.suiteLabel(suite))}` : appLabel;
        const items = app.sections ? visibleSections(app, this.access, this.cp).flatMap(s => s.items) : [];
        const land = appLanding(app, this.access);
        if (land && appLabel.toLowerCase().includes(q) && !seen.has(land)) {
          seen.add(land); out.push({ label: appLabel, where: i18nT(suite ? this.suiteLabel(suite) : 'All apps'), link: this.landing(app, land), icon: TILE_ICON[app.key] || app.icon, suite, appKey: app.key });
        }
        for (const it of items) {
          if (seen.has(it.link)) { continue; }
          if (it.label.toLowerCase().includes(q) || (it.hint || '').toLowerCase().includes(q)) {
            seen.add(it.link); out.push({ label: it.label, where, link: it.link, icon: it.icon || app.icon, suite, appKey: app.key });
          }
        }
      }
    }
    this.hits = out.filter(h => !h.suite || this.ss.isActive(h.suite)).slice(0, 14);
  }
  first(): void { const h = this.hits[0]; if (h) { this.go(h.link, h.suite, h.appKey); } }

  go(link: string, suite: AppSuite | null, key: string): void {
    menuPicked();   // v1.40.1: an app picked here opens its own menu
    if (suite) { this.ss.set(suite); }
    this.ss.touch(key);
    this.open = false; this.q = '';
    this.router.navigateByUrl(link);
  }

  private buildRecent(): void {
    this.recent = this.ss.recent$.value
      .map(k => ALL_APPS.find(a => a.key === k))
      .filter((a): a is MenuApp => !!a)
      .map(a => ({ app: a, link: appLanding(a, this.access) }))
      .filter(x => !!x.link)
      .slice(0, 3)
      .map(x => ({ key: x.app.key, label: i18nT(this.cp.text(x.app.label)), link: this.landing(x.app, x.link as string), suite: suiteOfApp(x.app.key) }))
      .filter(x => !x.suite || this.ss.isActive(x.suite));
    this.cd.markForCheck();
  }
}
