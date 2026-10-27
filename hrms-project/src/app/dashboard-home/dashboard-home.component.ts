import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';
import { I18N_UI } from '../shared-ui/i18n.service';
import { ZDashDesignerComponent, ZDashOverviewComponent } from '../shared-ui/z-dash.component';
import { ModuleApiService } from '../hr-modules/module-api.service';
import { DrillRequest, MODULE_LINKS } from '../hr-modules/dashboards/dashboard.service';
import { DrillPanelComponent } from '../hr-modules/dashboards/drill-panel.component';
import { ManagerDashboardComponent } from '../hr-modules/dashboards/manager-dashboard.component';
import { EssDashboardComponent } from '../hr-modules/dashboards/ess-dashboard.component';
import { CeoDashboardComponent } from '../ceo-dashboard/ceo-dashboard.component';
import { ZRecordService } from '../shared-ui/z-record.service';   // v1.45.0 starred / recent records
import { ZWallComponent } from '../shared-ui/z-wall.component';   // v1.47.0 company wall strip
import { ZSetupCardComponent } from '../shared-ui/z-setup-card.component';   // v1.56.0 setup guide progress / checklist

type Tab = 'hr' | 'management' | 'team' | 'my';

/**
 * v1.17.0 (dash17) – Home: one menu entry for every dashboard.
 *  - lands on the right view for the user's role (admin / HR → HR operations, CEO right → Management, manager → Team,
 *    employee → My dashboard); tabs when the user may open several views; ?tab= keeps the view in the address
 *    (the old dashboard addresses redirect here with their tab);
 *  - "Needs your action" strip on top of every view: only what this user must act on, every item opens its rows;
 *  - its own scroll area placed exactly below the top bar and beside the main menu (measured, so it follows the
 *    folded / unfolded menu, the phone top bar and right-to-left): the page scrolls to the last card, no double scroll bars,
 *    nothing under the top bar or the menu, the same gutters on every view and width.
 * API: GET /dashboard/api/home/ (tabs, default, actions, name).
 */
@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, CommonModule, MatIconModule, ZSetupCardComponent, ZDashDesignerComponent, ZDashOverviewComponent, DrillPanelComponent,
            ManagerDashboardComponent, EssDashboardComponent, CeoDashboardComponent, ZWallComponent],
  template: `
  <div class="zh-page" #page>
    <div class="zh-in">
      <header class="zh-head">
        <div class="zh-who">
          <!-- v1.17.0 (audit L9): one translated sentence (Arabic comma), the name stays as entered -->
          <h1 data-no-translate>{{ home?.name ? ((greeting + ', {0}') | t:home.name) : (greeting | t) }}</h1>
          <p class="zh-date" *ngIf="home">{{ dayName | t }} · {{ home.today | zdate }}</p>
        </div>
        <nav class="zh-tabs" role="tablist" [attr.aria-label]="'Dashboards' | t" *ngIf="(home?.tabs?.length || 0) > 1">
          <button type="button" role="tab" *ngFor="let t of home.tabs" [attr.aria-selected]="t.key === tab" [class.on]="t.key === tab"
                  [attr.data-tab]="t.key" (click)="setTab(t.key)"><mat-icon aria-hidden="true">{{ icons[t.key] }}</mat-icon>{{ t.label | t }}</button>
        </nav>
      </header>
      <p class="zh-err" *ngIf="error">{{ error | t }}</p>

      <z-setup-card></z-setup-card>
      <!-- needs your action: only what this user must act on; each item opens its rows -->
      <section class="zh-act" *ngIf="home" [attr.aria-label]="'Needs your action' | t" data-strip="1">
        <h2><mat-icon aria-hidden="true">notification_important</mat-icon>{{ 'Needs your action' | t }}</h2>
        <div class="zh-act-list" *ngIf="actions.length; else allClear">
          <button type="button" *ngFor="let a of actions" [class]="'zh-a ' + (a.tone || '')" (click)="act(a)" [attr.data-action]="a.key"
                  [attr.data-link]="a.link || null" [attr.data-metric]="a.drill?.metric || null" [attr.data-count]="a.count"
                  [title]="'Select to see them' | t">
            <b>{{ a.count | number }}</b>
            <span class="zh-a-t">{{ a.label | t }}<small *ngIf="a.sub">{{ a.sub | t:((a.sub_n ?? '') + '') }}</small></span>
            <mat-icon class="zh-a-go" aria-hidden="true">chevron_right</mat-icon>
          </button>
        </div>
        <ng-template #allClear><p class="zh-clear"><mat-icon aria-hidden="true">task_alt</mat-icon>{{ 'Nothing needs your action right now.' | t }}</p></ng-template>
      </section>

      <!-- v1.45.0 starred and recently viewed records -->
      <section class="zh-recs" *ngIf="stars.starred.length || stars.recent.length" [attr.aria-label]="'Starred and recently viewed' | t">
        <div class="zh-rc" *ngIf="stars.starred.length"><h2><mat-icon aria-hidden="true" class="st">star</mat-icon>{{ 'Starred' | t }}</h2>
          <button type="button" *ngFor="let r of stars.starred.slice(0, 10)" (click)="openRec(r)"><b>{{ r.label || r.object_id }}</b><small>{{ r.app }}</small></button></div>
        <div class="zh-rc" *ngIf="stars.recent.length"><h2><mat-icon aria-hidden="true">history</mat-icon>{{ 'Recently viewed' | t }}</h2>
          <button type="button" *ngFor="let r of stars.recent.slice(0, 10)" (click)="openRec(r)"><b>{{ r.label || r.object_id }}</b><small>{{ r.app }}</small></button></div>
      </section>

      <!-- v1.47.0 company wall: today's birthdays, anniversaries, new joiners, the newest announcements -->
      <z-wall *ngIf="home" [compact]="true"></z-wall>

      <ng-container *ngIf="home" [ngSwitch]="tab">
        <section *ngSwitchCase="'hr'" class="zh-view" data-view="hr">
          <z-dash-designer name="main" [scope]="'#' + hrBoard" (periods)="ov.setPeriods($event)"></z-dash-designer>
          <div class="zdd-board" [id]="hrBoard">
            <z-dash-overview #ov class="zdd-contents" [waitForPeriods]="true" [hrOps]="true" [tabs]="tabKeys" (seeTab)="setTab($any($event))"></z-dash-overview>
          </div>
        </section>
        <section *ngSwitchCase="'management'" class="zh-view" data-view="management"><app-ceo-dashboard [embedded]="true"></app-ceo-dashboard></section>
        <section *ngSwitchCase="'team'" class="zh-view" data-view="team"><app-manager-dashboard [embedded]="true" [teamOnly]="true"></app-manager-dashboard></section>
        <section *ngSwitchCase="'my'" class="zh-view" data-view="my"><app-ess-dashboard [embedded]="true"></app-ess-dashboard></section>
      </ng-container>
    </div>
  </div>
  <z-drill-panel [request]="drillReq" (closed)="drillReq = null" (navigate)="goModule($event)"></z-drill-panel>`,
  styles: [`
  .zh-recs { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; margin: 0 0 16px; }
  .zh-rc { background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .zh-rc h2 { flex: 0 0 100%; display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; margin: 0 0 4px; color: #1B1640; }
  .zh-rc h2 mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6B7185; } .zh-rc h2 mat-icon.st { color: #E0A100; }
  .zh-rc button { border: 1px solid #E3E5EE; background: #F7F8FB; border-radius: 8px; padding: 4px 10px; cursor: pointer; text-align: left; max-width: 260px; }
  .zh-rc button b { display: block; font-weight: 500; font-size: 12.5px; color: #1B1640; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .zh-rc button small { color: #6B7185; font-size: 11px; }
  .zh-rc button:hover { background: #EEEDFD; }
    :host { display: block; --zh-top: 64px; --zh-side: 56px; }
    /* the page's own scroll area: below the fixed top bar, beside the fixed main menu (left, or right in Arabic) */
    .zh-page { position: fixed; top: var(--zh-top); bottom: 0; inset-inline-start: var(--zh-side); inset-inline-end: 0; overflow-x: hidden; overflow-y: auto;
               background: #F4F5FA; overscroll-behavior: contain; scroll-padding-top: 12px; -webkit-overflow-scrolling: touch; }
    .zh-in { box-sizing: border-box; width: 100%; max-width: 1680px; margin: 0 auto; padding: 20px 24px 56px; color: #262A3D; font-size: 14px; }
    .zh-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; margin-bottom: 14px; }
    .zh-head h1 { margin: 0; font-size: 22px; font-weight: 500; color: #1B1640; letter-spacing: -0.01em; overflow-wrap: anywhere; }
    .zh-date { margin: 2px 0 0; color: #6B7185; font-size: 13px; }
    .zh-tabs { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; background: #fff; border: 1px solid #E3E5EE; border-radius: 12px; max-width: 100%; }
    .zh-tabs button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border: 0; border-radius: 9px; background: transparent;
                      color: #6B7185; font: inherit; font-size: 13.5px; cursor: pointer; white-space: nowrap; }
    .zh-tabs button .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .zh-tabs button:hover { color: #1B1640; background: #F4F5FA; }
    .zh-tabs button.on { background: #1B1640; color: #fff; }
    .zh-tabs button:focus-visible, .zh-a:focus-visible { outline: 2px solid #5B4FE0; outline-offset: 2px; }
    .zh-err { color: #A32626; background: #FBE7E7; padding: 10px 12px; border-radius: 8px; }
    .zh-act { background: #fff; border: 1px solid #E3E5EE; border-radius: 14px; padding: 12px 14px; margin: 0 0 18px; }
    .zh-act h2 { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #1B1640; letter-spacing: .01em; }
    .zh-act h2 .mat-icon { font-size: 18px; width: 18px; height: 18px; color: #5B4FE0; }
    .zh-act-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr)); gap: 8px; }
    .zh-a { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 56px; padding: 8px 10px 8px 12px;
            border: 1px solid #E3E5EE; border-radius: 10px; background: #FAFAFE; font: inherit; color: inherit; text-align: start; cursor: pointer; }
    .zh-a:hover { border-color: #5B4FE0; background: #fff; }
    .zh-a b { font-size: 22px; font-weight: 600; color: #1B1640; font-variant-numeric: tabular-nums; min-width: 1.6em; text-align: center; }
    .zh-a.warn b { color: #7A5200; } .zh-a.bad b { color: #A32626; }
    .zh-a-t { display: flex; flex-direction: column; min-width: 0; font-size: 13px; line-height: 1.3; }
    .zh-a-t small { color: #6B7185; font-size: 11.5px; }
    .zh-a-go { color: #9AA0B4; font-size: 20px; width: 20px; height: 20px; }
    .zh-clear { display: flex; align-items: center; gap: 6px; margin: 0; color: #0E6B23; font-size: 13px; }
    .zh-clear .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .zh-view { display: block; min-width: 0; }
    /* v1.17.0 (audit H2): a side panel opened inside a view lives in the page's stacking context (position: fixed) –
       keep it and its backdrop below the top bar so its title and first column are never hidden */
    :host ::ng-deep .zh-page .zd-panel, :host ::ng-deep .zh-page .zd-backdrop { top: var(--zh-top); }
    @media (max-width: 760px) {
      .zh-in { padding: 14px 16px 48px; }
      .zh-head h1 { font-size: 19px; }
      .zh-tabs { display: flex; width: 100%; overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none; }
      .zh-tabs::-webkit-scrollbar { display: none; }
      .zh-tabs button { flex: 1 0 auto; justify-content: center; padding: 0 10px; }
    }
  `],
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  home: any = null;
  error = '';
  tab: Tab = 'my';
  drillReq: DrillRequest | null = null;
  readonly hrBoard = 'zhh-' + Math.random().toString(36).slice(2, 8);
  readonly icons: Record<string, string> = { hr: 'badge', management: 'insights', team: 'groups', my: 'person' };
  private sub?: Subscription;
  private ro?: ResizeObserver;
  private mo?: MutationObserver;
  private raf = 0;

  stars: { starred: any[]; recent: any[] } = { starred: [], recent: [] };
  constructor(private api: ModuleApiService, private route: ActivatedRoute, private router: Router, private el: ElementRef<HTMLElement>,
              private zone: NgZone, private cd: ChangeDetectorRef, private zrec: ZRecordService) {}
  openRec(r: any): void { if (r.page) { this.router.navigateByUrl(r.page); } }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  /** v1.17.0 (audit L4): the strip of a view shows the items the user acts on in that view */
  get actions(): any[] { return (this.home?.actions || []).filter((a: any) => !a.views || a.views.includes(this.tab)); }
  /** v1.17.0 (audit M8): the views this user may open (cross-view links only to these) */
  get tabKeys(): string[] { return (this.home?.tabs || []).map((t: any) => t.key); }

  get dayName(): string {
    const d = this.home?.today ? new Date(this.home.today + 'T12:00:00') : new Date();
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  }

  ngOnInit(): void {
    this.starSub = this.zrec.stars$.subscribe(x => { this.stars = { starred: x.starred || [], recent: x.recent || [] }; this.cd.markForCheck(); });   // v1.45.0
    this.zrec.refreshStars();
    this.fit();
    this.watchFrame();
    this.sub = this.route.queryParamMap.subscribe(q => {
      const want = q.get('tab') as Tab | null;
      if (this.home) { this.pick(want); }
    });
    this.api.get('/dashboard/api/home/').subscribe({
      next: (h: any) => { this.home = h; this.pick(this.route.snapshot.queryParamMap.get('tab') as Tab | null); },
      error: () => { this.error = 'The dashboard could not be loaded. Check your connection and reload the page.'; },
    });
  }

  private starSub?: Subscription;
  ngOnDestroy(): void {
    this.starSub?.unsubscribe(); this.sub?.unsubscribe(); this.ro?.disconnect(); this.mo?.disconnect(); cancelAnimationFrame(this.raf); }

  /** The view asked for (address), if the user may open it; else the default view of their role. */
  private pick(want: Tab | null): void {
    const keys: string[] = (this.home?.tabs || []).map((t: any) => t.key);
    const next = (want && keys.includes(want) ? want : this.home?.default || keys[0] || 'my') as Tab;
    if (next !== this.tab) { this.tab = next; this.toTop(); }
    if (want && want !== next) {   // v1.17.0 (audit M8): an address with a view the user cannot open shows the view it lands on
      this.router.navigate([], { relativeTo: this.route, queryParams: { tab: next }, queryParamsHandling: 'merge', replaceUrl: true });
    }
    this.cd.markForCheck();
  }

  setTab(t: Tab): void {
    if (!t) { return; }
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t }, queryParamsHandling: 'merge', replaceUrl: true });
    this.pick(t);
  }

  private toTop(): void {
    const p = this.el.nativeElement.querySelector('.zh-page') as HTMLElement | null;
    if (p) { p.scrollTop = 0; }
  }

  /** A strip item: its drill-down list (dashboard API) or its report. */
  act(a: any): void {
    if (a.drill?.metric) { this.drillReq = { metric: a.drill.metric, title: a.drill.title || a.label, params: a.drill.params || {} }; return; }
    if (a.link) { this.router.navigateByUrl(a.link); }
  }

  goModule(ev: { module: string; kind: 'request' | 'approval' }): void {
    const link = MODULE_LINKS[ev.module] || {};
    const route = ev.kind === 'approval' ? (link.adminApproval || link.admin) : link.admin;
    if (route) { this.drillReq = null; this.router.navigateByUrl(route); }
  }

  // ------------------------------------------------------------------ page frame (scroll area below the top bar, beside the menu)
  @HostListener('window:resize')
  fit(): void {
    const host = this.el.nativeElement;
    const nav = document.getElementById('main-navbar');
    const top = nav ? Math.max(0, Math.round(nav.getBoundingClientRect().bottom)) : 64;
    let side = 0;
    const menu = document.getElementById('sidebarMenu');
    if (menu && window.innerWidth >= 992) {   // below 992 px the menu slides over the page (drawer): no offset
      const r = menu.getBoundingClientRect();
      const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
      side = Math.round(rtl ? window.innerWidth - r.left : r.right);
      if (side < 0 || side > 420) { side = 0; }
    }
    host.style.setProperty('--zh-top', top + 'px');
    host.style.setProperty('--zh-side', side + 'px');
  }

  /** Re-measure when the menu folds / unfolds, the language direction changes or the top bar changes height. */
  private watchFrame(): void {
    this.zone.runOutsideAngular(() => {
      const again = () => { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.fit()); };
      const menu = document.getElementById('sidebarMenu');
      const nav = document.getElementById('main-navbar');
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(again);
        if (menu) { this.ro.observe(menu); }
        if (nav) { this.ro.observe(nav); }
      }
      this.mo = new MutationObserver(again);
      this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
      if (menu) { this.mo.observe(menu, { attributes: true, attributeFilter: ['class', 'style'] }); menu.addEventListener('transitionend', again); }
      setTimeout(again, 300);
    });
  }
}
