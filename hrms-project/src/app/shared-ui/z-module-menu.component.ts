import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter } from 'rxjs';
import { ZListService } from './z-list.service';
import { MAIN_GROUPS, MenuApp, MenuGroup, MenuSection, Suite, appForUrl, itemVisible, countryVisible } from './menu-config';
import { CountryPackService } from './country-pack.service';
import { flagsVisible } from './zeo-flags';
import { I18N_UI, I18nService, i18nT } from './i18n.service';   // v1.15.0

type Access = { admin: boolean; codes: Set<string> } | null;

/** Shared helpers for the main menu and the module menus. */
export function visibleSections(app: MenuApp | null, access: Access, cp?: CountryPackService): MenuSection[] {
  if (!app || !app.sections) { return []; }
  const allows = cp ? (e: string) => cp.allows(e) : undefined;   // v1.14.0: country-gated items and captions
  return app.sections
    .map(s => ({ ...s, items: s.items
      .filter(i => itemVisible(i.perms, access) && countryVisible(i.country, allows) && flagsVisible(i.country))
      .map(i => cp ? { ...i, label: cp.text(i.label), hint: i.hint ? cp.text(i.hint) : i.hint } : i)
      .map(i => ({ ...i, label: i18nT(i.label), hint: i.hint ? i18nT(i.hint) : i.hint })) }))   // v1.15.0: country first, then language
    .filter(s => s.items.length);
}

export function appLanding(app: MenuApp, access: Access): string | null {
  if (!app.sections) { return itemVisible(app.perms, access) ? app.link || null : null; }
  const first = visibleSections(app, access)[0];
  return first ? first.items[0].link : null;
}

export function visibleGroups(access: Access, hideAdmin = false, suite?: Suite | null): { title: string; apps: { app: MenuApp; link: string }[] }[] {
  // v1.20.0: one app (HRMS / Projects / Settings) at a time; the common apps (Calendar, My To-do) follow the app's first entry
  const common = MAIN_GROUPS.filter(g => g.suite === 'common').flatMap(g => g.apps);
  const groups = suite ? MAIN_GROUPS.filter(g => (g.suite || 'hrms') === suite)
                       : MAIN_GROUPS.filter(g => g.suite !== 'common');
  const out = groups
    .map((g: MenuGroup, gi: number) => ({
      title: g.title,
      apps: (gi === 0 && suite !== 'settings' ? [g.apps[0], ...common, ...g.apps.slice(1)] : g.apps)
        .filter(a => !(hideAdmin && (a.key === 'reports' || a.key === 'settings' || a.key === 'hrsettings' || a.key.startsWith('st-'))))
        .filter(a => flagsVisible(a.country))   // v1.23.0 app: / cloud: (Payroll, Subscription)
        .map(a => ({ app: a, link: appLanding(a, access) as string }))
        .filter(x => !!x.link),
    }))
    .filter(g => g.apps.length);
  if (!suite) { out.unshift({ title: 'Overview', apps: common.map(a => ({ app: a, link: appLanding(a, access) as string })) }); }
  return out;
}

/** v1.20.0: the app (suite) a page belongs to – null for pages every app shares (Calendar, My To-do). */
export function suiteForUrl(url: string): Exclude<Suite, 'common'> | null {
  const app = appForUrl(url);
  if (!app) { return null; }
  const g = MAIN_GROUPS.find(x => x.apps.includes(app));
  const s = (g?.suite || 'hrms') as Suite;
  return s === 'common' ? null : s;
}
export function suiteOfApp(key: string): Exclude<Suite, 'common'> | null {
  const g = MAIN_GROUPS.find(x => x.apps.some(a => a.key === key));
  const s = (g?.suite || 'hrms') as Suite;
  return s === 'common' ? null : s;
}

/** The module menu shown in the second sidebar: the sections of the module the current page belongs to. */
@Component({
  selector: 'z-module-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ...I18N_UI],
  encapsulation: ViewEncapsulation.None,
  template: `
  <ul class="nav-menu-list zm-list">
    <ng-container *ngFor="let s of sections; let first = first">
      <li class="zm-section" *ngIf="open && sections.length > 1">
        <button type="button" class="zm-section-head" [class.zm-toggle]="s.collapsed" (click)="toggle(s)"
                [attr.aria-expanded]="!isClosed(s)">
          <span>{{ s.title | t }}</span>
          <span class="zm-count" *ngIf="isClosed(s)">{{ s.items.length }}</span>
          <mat-icon *ngIf="s.collapsed" class="zm-chev">{{ isClosed(s) ? 'expand_more' : 'expand_less' }}</mat-icon>
        </button>
      </li>
      <li class="zm-rule" *ngIf="!open && !first"></li>
      <ng-container *ngIf="!open || !isClosed(s)">
        <li *ngFor="let it of s.items">
          <a [routerLink]="it.link" routerLinkActive="active-link" class="nav-item-link"
             [attr.title]="it.hint || it.label" (click)="picked.emit()">
            <mat-icon class="nav-icon">{{ it.icon || 'chevron_right' }}</mat-icon>
            <span class="sidenav-opt">{{ it.label }}</span>
          </a>
        </li>
      </ng-container>
    </ng-container>
    <li *ngIf="!sections.length && loaded" class="zm-empty">{{ 'No pages available for your rights.' | t }}</li>
  </ul>`,
  styles: [`
    .zm-list { gap: 2px !important; }
    .zm-section { margin-top: 10px; }
    .zm-section:first-child { margin-top: 2px; }
    .zm-section-head {
      all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 6px; width: 100%;
      padding: 4px 12px 4px 12px; font-size: 11px; font-weight: 600; letter-spacing: .02em;
      color: #a5b4fc; cursor: default;
    }
    .zm-section-head.zm-toggle { cursor: pointer; border-radius: 5px; }
    .zm-section-head.zm-toggle:hover { background: rgba(255,255,255,.05); color: #e0e7ff; }
    .zm-section-head:focus-visible { outline: 2px solid #818cf8; outline-offset: 1px; }
    .zm-section-head > span:first-child { flex: 1; }
    .zm-count { font-size: 10px; color: #64748b; font-weight: 500; }
    .zm-chev { font-size: 16px !important; width: 16px !important; height: 16px !important; color: #64748b; }
    .zm-rule { height: 1px; background: rgba(255,255,255,.08); margin: 6px 8px; }
    .zm-empty { padding: 10px 12px; font-size: 11.5px; color: #94a3b8; white-space: normal; }
  `],
})
export class ZModuleMenuComponent implements OnInit, OnDestroy {
  @Input() open = true;
  @Output() picked = new EventEmitter<void>();

  sections: MenuSection[] = [];
  loaded = false;
  private app: MenuApp | null = null;
  private access: Access = null;
  private opened = new Set<string>();
  private subs: Subscription[] = [];

  constructor(private router: Router, private zlist: ZListService, private cd: ChangeDetectorRef, private cp: CountryPackService, private i18n: I18nService) {}

  ngOnInit(): void {
    this.refresh();
    this.subs.push(this.cp.pack$.subscribe(() => this.refresh()));   // v1.14.0
    this.subs.push(this.i18n.lang$.subscribe(() => this.refresh()));   // v1.15.0
    this.subs.push(this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.refresh()));
    this.subs.push(this.zlist.permissions().subscribe(a => { this.access = a; this.loaded = true; this.refresh(); }));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private refresh(): void {
    const app = appForUrl(this.router.url);
    if (app !== this.app) { this.opened.clear(); }
    this.app = app;
    this.sections = visibleSections(app, this.access, this.cp);
    // a folded section opens by itself when the current page is in it
    const url = this.router.url.split('?')[0];
    for (const s of this.sections) {
      if (s.collapsed && s.items.some(i => url === i.link || url.startsWith(i.link + '/'))) { this.opened.add(s.title); }
    }
    this.cd.markForCheck();
  }

  isClosed(s: MenuSection): boolean { return !!s.collapsed && !this.opened.has(s.title); }

  toggle(s: MenuSection): void {
    if (!s.collapsed) { return; }
    this.opened.has(s.title) ? this.opened.delete(s.title) : this.opened.add(s.title);
  }
}

/** The name of the module the current page belongs to (shown at the top of the module menu). */
@Component({
  selector: 'z-app-title',
  standalone: true,
  imports: [CommonModule],
  template: `{{ title }}`,
})
export class ZAppTitleComponent implements OnInit, OnDestroy {
  @Input() fallback = '';
  title = '';
  private sub?: Subscription;
  private sub2?: Subscription;
  constructor(private router: Router, private i18n: I18nService) {}
  ngOnInit(): void {
    this.set();
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.set());
    this.sub2 = this.i18n.lang$.subscribe(() => this.set());   // v1.15.0
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); this.sub2?.unsubscribe(); }
  private set(): void { this.title = i18nT(appForUrl(this.router.url)?.label || this.fallback); }
}
