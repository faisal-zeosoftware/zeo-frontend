import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ALL_APPS, MAIN_GROUPS, MenuItem, itemVisible } from '../shared-ui/menu-config';
import { visibleSections } from '../shared-ui/z-module-menu.component';
import { ZListService } from '../shared-ui/z-list.service';
import { CountryPackService } from '../shared-ui/country-pack.service';
import { I18N_UI, I18nService, i18nT } from '../shared-ui/i18n.service';

const M = '/main-sidebar/';

/** One line per settings screen (English source text – translated by the language packs). Keyed by the menu link. */
export const SETTINGS_DESCRIPTIONS: Record<string, string> = {
  [M + 'settings/location-master']: 'Company name, address, country, currency and licence details.',
  [M + 'settings/apps']: 'Which apps the company uses – HRMS, Projects, CRM, Property, Maintenance, HSE – and the industry of each.',   // v1.21.0
  [M + 'settings/branch-master']: 'Branches of the company and their addresses.',
  [M + 'settings/country-settings']: 'Captions, features and labour-law rules of the company country.',
  [M + 'settings/languages']: 'Languages of the company and translations of the screens.',
  [M + 'settings/state-master']: 'States or emirates used in addresses.',
  [M + 'settings/document-numbering']: 'Number series for requests, letters and other documents.',
  [M + 'settings/notification-settings']: 'When to warn about passports, visas and other documents that expire.',
  [M + 'settings/user-master']: 'People who can sign in, their companies and branches.',
  [M + 'settings/user-grouping-master']: 'Groups of rights, for example HR, manager or payroll.',
  [M + 'settings/permission-assigned']: 'Give a group or a user the rights to see and change screens.',
  [M + 'settings/branch-permissions']: 'Which branches each user may see.',
  [M + 'settings/email-configuration']: 'The mail account the system uses to send e-mails.',
  [M + 'org-structure/settings']: 'Departments, divisions, grades, positions and the other organisation fields.',
};

/** Extra settings that live in another module's menu (shown here so all settings are in one place). */
const ELSEWHERE: { title: string; items: MenuItem[] }[] = [
  { title: 'Organisation', items: [
    { label: 'Organisation settings', link: M + 'org-structure/settings', icon: 'corporate_fare',
      perms: ['view_dept_master', 'view_emp_master', 'view_companypolicy', 'view_leavepolicy'] },
  ] },
];

/** Icons of the menu that are not in the Material Icons font. */
const ICON_FIX: Record<string, string> = { outgoing_mail: 'forward_to_inbox', monitoring: 'analytics' };

interface HomeCard { label: string; desc: string; link: string; icon: string; }
interface HomeSection { title: string; cards: HomeCard[]; }

/**
 * v1.15.1 – Settings home (customer finding 12: the Settings gear opened Location Master).
 * The sections and screens come from the Settings app of shared-ui/menu-config.ts, filtered exactly like the menu
 * (the user's rights, the company country, the language). Route: /main-sidebar/settings/home (SETTINGS_HOME_ROUTES,
 * inside the `settings` route so the Settings module menu stays beside it).
 */
@Component({
  selector: 'app-settings-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './settings-home.css'],
  template: `
<div class="container sh-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">{{ 'Settings' | t }}</h1>
          <p class="lp-desc">{{ 'Company-wide settings in one place. Open a section to change it; you only see the sections your rights allow.' | t }}</p>
        </div>
      </div>
    </div>

    <p class="sh-muted" *ngIf="!loaded" role="status">{{ 'Loading the settings…' | t }}</p>
    <p class="sh-muted" *ngIf="loaded && !sections.length" role="status">{{ 'You do not have rights to any settings. Ask your administrator if you need access.' | t }}</p>

    <section class="sh-sec" *ngFor="let s of sections" [attr.aria-label]="s.title">
      <h2>{{ s.title }}</h2>
      <div class="sh-grid">
        <a class="sh-card" *ngFor="let c of s.cards" [routerLink]="c.link">
          <mat-icon class="sh-ic" aria-hidden="true">{{ c.icon }}</mat-icon>
          <span class="sh-txt">
            <b>{{ c.label }}</b>
            <small *ngIf="c.desc">{{ c.desc }}</small>
          </span>
          <mat-icon class="sh-go z-mirror" aria-hidden="true">chevron_right</mat-icon>
        </a>
      </div>
    </section>
  </div>
</div>`,
})
export class SettingsHomeComponent implements OnInit, OnDestroy {
  sections: HomeSection[] = [];
  loaded = false;
  private access: { admin: boolean; codes: Set<string> } | null = null;
  private subs: Subscription[] = [];

  constructor(private zlist: ZListService, private cp: CountryPackService, private i18n: I18nService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subs.push(this.zlist.permissions().subscribe({
      next: a => { this.access = a; this.loaded = true; this.build(); },
      error: () => { this.loaded = true; this.build(); },
    }));
    this.subs.push(this.cp.pack$.subscribe(() => this.build()));
    this.subs.push(this.i18n.lang$.subscribe(() => this.build()));
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private card(i: MenuItem): HomeCard {
    const d = SETTINGS_DESCRIPTIONS[i.link] || '';
    return { label: i.label, link: i.link, icon: ICON_FIX[i.icon || ''] || i.icon || 'settings',
             desc: d ? i18nT(d) : i.hint ? i.hint : /template/.test(i.link) ? i18nT('Subject and text of the e-mail sent for this kind of request.') : '' };
  }

  build(): void {
    // v1.20.0: every module of the Settings app (Company, Users & rights, E-mail); HR-only settings are under HRMS → HR settings
    const apps = MAIN_GROUPS.filter(g => g.suite === 'settings').flatMap(g => g.apps);
    const out: HomeSection[] = apps.flatMap(app => visibleSections(app, this.access, this.cp))
      .map(s => ({ title: i18nT(s.title), cards: s.items.map(i => this.card(i)) }));
    for (const e of ELSEWHERE) {
      const items = e.items.filter(i => itemVisible(i.perms, this.access)).map(i => ({ ...i, label: i18nT(i.label) }));
      if (items.length) { out.push({ title: i18nT(e.title), cards: items.map(i => this.card(i)) }); }
    }
    this.sections = this.loaded ? out : [];
    this.cd.markForCheck();
  }
}
