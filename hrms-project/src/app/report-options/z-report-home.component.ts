import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, firstValueFrom } from 'rxjs';
import { ZListService } from '../shared-ui/z-list.service';
import { ZRecordService } from '../shared-ui/z-record.service';
import { CountryPackService } from '../shared-ui/country-pack.service';
import { MAIN_GROUPS, MenuApp } from '../shared-ui/menu-config';
import { visibleSections } from '../shared-ui/z-module-menu.component';
import { I18N_UI, I18nService, i18nT } from '../shared-ui/i18n.service';
import { zrepGet, zrepSet } from '../z-report/z-report.component';

interface Item { key: string; label: string; link: string; icon: string; desc: string; section: string; hay: string; }

/**
 * v1.62.0 reports – the report home (Reports › Overview): search, favourites, recently run, "start here" packs per role
 * (HR, Payroll, Finance, Management) and every report by section with its one-line description.
 * The list follows the Reports menu (rights, country and the merged reports), the descriptions come from the report centre.
 */
@Component({
  selector: 'app-z-report-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ...I18N_UI],
  template: `
  <div class="container"><div class="zh-wrap" data-report-home>
    <div class="zh-card">
      <div class="zh-head">
        <div>
          <h1>{{ 'Reports' | t }}</h1>
          <p>{{ 'Every HR, payroll and attendance report, with your branches applied.' | t }}</p>
        </div>
        <label class="zh-search">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
          <input type="search" [(ngModel)]="q" (ngModelChange)="cd.detectChanges()" [placeholder]="'Search reports, e.g. leave, overtime, WPS' | t" [attr.aria-label]="'Search reports' | t" data-report-search>
        </label>
      </div>
      <div class="zh-chips" role="tablist">
        <button type="button" role="tab" *ngFor="let c of chips; trackBy: trackChip" [class.on]="chip === c.k" [attr.aria-selected]="chip === c.k" (click)="setChip(c.k)" [attr.data-chip]="c.k">
          {{ c.l | t }}<span *ngIf="count(c.k) as n" class="zh-n">{{ n }}</span></button>
      </div>
    </div>

    <p class="zh-msg" *ngIf="!loaded">{{ 'Loading the reports…' | t }}</p>

    <!-- search results / favourites / recent / a role pack: one list -->
    <div class="zh-card zh-list" *ngIf="loaded && (q.trim() || chip !== 'all')" data-report-results>
      <h2>{{ listTitle | t }} <small>{{ shown.length }}</small></h2>
      <p class="zh-hint" *ngIf="chip !== 'all' && packHint && !q.trim()">{{ packHint | t }}</p>
      <ng-container *ngTemplateOutlet="rowsT; context: { $implicit: shown }"></ng-container>
      <p class="zh-empty" *ngIf="!shown.length">{{ emptyText | t }}</p>
    </div>

    <!-- home: start here + favourites strip + every section -->
    <ng-container *ngIf="loaded && !q.trim() && chip === 'all'">
      <div class="zh-packs">
         <button type="button" class="zh-pack" *ngFor="let p of packs; trackBy: trackPack" (click)="setChip(p.key)" [attr.data-pack]="p.key">
          <span class="zh-pi"><mat-icon>{{ packIcon[p.key] || 'folder_special' }}</mat-icon></span>
          <span><b>{{ ('Start here – ' + p.label) | t }}</b><em>{{ packText(p) }}</em></span>
        </button>
      </div>
      <div class="zh-two" *ngIf="fav.length || recent.length">
        <div class="zh-card zh-list" *ngIf="fav.length" data-report-favs>
          <h2>{{ 'Favourites' | t }}</h2>
          <ng-container *ngTemplateOutlet="rowsT; context: { $implicit: fav.slice(0, 6) }"></ng-container>
        </div>
        <div class="zh-card zh-list" *ngIf="recent.length" data-report-recent>
          <h2>{{ 'Recently run' | t }}</h2>
          <ng-container *ngTemplateOutlet="rowsT; context: { $implicit: recent.slice(0, 6) }"></ng-container>
        </div>
      </div>
      <div class="zh-grid">
        <div class="zh-card zh-list" *ngFor="let s of sections" [attr.data-section]="s.title">
          <h2>{{ s.title | t }} <small>{{ s.items.length }}</small></h2>
          <ng-container *ngTemplateOutlet="rowsT; context: { $implicit: s.items }"></ng-container>
        </div>
      </div>
    </ng-container>

    <ng-template #rowsT let-items>
      <ul class="zh-rows">
        <li *ngFor="let it of items; trackBy: trackItem" class="zh-row">
          <a [routerLink]="it.link" class="zh-a" [attr.data-report-link]="it.key">
            <mat-icon class="zh-ic">{{ it.icon || 'description' }}</mat-icon>
            <span class="zh-tx"><b>{{ it.label }}</b><em *ngIf="it.desc" [title]="it.desc">{{ it.desc }}</em></span>
          </a>
          <button type="button" class="zh-star" [class.on]="isFav(it.key)" (click)="toggleFav(it.key)" [attr.aria-pressed]="isFav(it.key)"
                  [title]="(isFav(it.key) ? 'Remove from favourites' : 'Add to favourites') | t" [attr.aria-label]="(isFav(it.key) ? 'Remove from favourites' : 'Add to favourites') | t">
            <svg viewBox="0 0 24 24" width="16" height="16" [attr.fill]="isFav(it.key) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>
          </button>
        </li>
      </ul>
    </ng-template>
  </div></div>`,
  styles: [`
  .zh-wrap { margin: 10px 0 24px; margin-inline-start: 25px; display: flex; flex-direction: column; gap: 14px; }
  .zh-card { background: #fff; border: 1px solid #eceef4; border-radius: 12px; box-shadow: 0 1px 3px rgba(16,24,40,.06); padding: 18px 22px; min-width: 0; }
  .zh-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
  .zh-head h1 { font-size: 20px; font-weight: 600; color: #1d2033; margin: 0; text-transform: none; letter-spacing: 0; }
  .zh-head p { margin: 4px 0 0; font-size: 13px; color: #6b7185; }
  .zh-search { display: flex; align-items: center; gap: 8px; width: min(420px, 100%); height: 38px; border: 1px solid #dfe1ea; border-radius: 9px; padding: 0 12px; color: #8a8fa3; background: #fff; }
  .zh-search:focus-within { border-color: #5b4ff5; box-shadow: 0 0 0 3px rgba(91,79,245,.12); }
  .zh-search input { border: 0; outline: none; flex: 1; font-size: 13.5px; color: #1d2033; min-width: 0; background: transparent; }
  .zh-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .zh-chips button { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border: 1px solid #dfe1ea; border-radius: 16px; font-size: 12.5px; color: #2b2f42; white-space: nowrap; }
  .zh-chips button:hover { border-color: #5b4ff5; color: #4338ca; }
  .zh-chips button.on { background: #efedff; border-color: #5b4ff5; color: #4338ca; font-weight: 600; }
  .zh-chips button:focus-visible { outline: 2px solid #5b4ff5; }
  .zh-n { font-size: 11px; color: #8a8fa3; font-weight: 500; }
  .zh-packs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .zh-pack { all: unset; box-sizing: border-box; cursor: pointer; display: flex; gap: 12px; align-items: flex-start; background: #fff; border: 1px solid #eceef4; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(16,24,40,.06); min-width: 0; }
  .zh-pack:hover { border-color: #c9c2ff; background: #faf9ff; }
  .zh-pack:focus-visible { outline: 2px solid #5b4ff5; }
  .zh-pi { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 9px; background: #efedff; color: #4338ca; flex: none; }
  .zh-pack b { display: block; font-size: 13.5px; color: #1d2033; font-weight: 600; }
  .zh-pack em { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-style: normal; font-size: 12px; color: #6b7185; margin-top: 2px; line-height: 1.35; }
  .zh-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .zh-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
  .zh-list h2 { font-size: 14px; font-weight: 600; color: #1d2033; margin: 0 0 6px; }
  .zh-list h2 small { font-size: 12px; color: #8a8fa3; font-weight: 500; margin-inline-start: 4px; }
  .zh-hint { font-size: 12.5px; color: #6b7185; margin: -2px 0 8px; }
  .zh-rows { list-style: none; margin: 0; padding: 0; }
  .zh-row { display: flex; align-items: center; gap: 6px; border-top: 1px solid #f2f3f7; }
  .zh-row:first-child { border-top: 0; }
  .zh-a { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 8px 6px; border-radius: 8px; text-decoration: none; color: inherit; }
  .zh-a:hover { background: #f6f5ff; }
  .zh-a:hover b { color: #4338ca; }
  .zh-ic { color: #6b7185; font-size: 20px; width: 20px; height: 20px; flex: none; }
  .zh-tx { min-width: 0; display: flex; flex-direction: column; }
  .zh-tx b { font-size: 13.5px; font-weight: 500; color: #1d2033; }
  .zh-tx em { font-style: normal; font-size: 12px; color: #6b7185; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .zh-star { all: unset; cursor: pointer; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; color: #c3c6d3; flex: none; }
  .zh-star:hover { color: #eda100; background: #fff8e6; }
  .zh-star.on { color: #eda100; }
  .zh-star:focus-visible { outline: 2px solid #5b4ff5; }
  .zh-msg, .zh-empty { color: #6b7185; font-size: 13px; margin: 6px 0; }
  @media (max-width: 1200px) { .zh-packs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 991.98px) { .zh-wrap { margin-inline-start: 0; } .zh-grid, .zh-two { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .zh-packs { grid-template-columns: 1fr; } }`],
})
export class ZReportHomeComponent implements OnInit, OnDestroy {
  q = '';
  chip = 'all';
  loaded = false;
  sections: { title: string; items: Item[] }[] = [];
  all: Item[] = [];
  packs: { key: string; label: string; reports: string[] }[] = [];
  favKeys: string[] = [];
  packIcon: Record<string, string> = { hr: 'badge', payroll: 'payments', finance: 'account_balance', management: 'insights' };
  private info: Record<string, { title: string; description: string }> = {};
  private access: any = null;
  private subs: Subscription[] = [];

  constructor(public cd: ChangeDetectorRef, private http: HttpClient, private rec: ZRecordService, private zlist: ZListService,
              private cp: CountryPackService, private i18n: I18nService, private router: Router) {}

  /** one array (rebuilt only when the packs change) – a new array on every check re-made the buttons under the mouse and lost clicks */
  chips: { k: string; l: string }[] = [{ k: 'all', l: 'All' }, { k: 'fav', l: 'Favourites' }, { k: 'recent', l: 'Recently run' }];
  trackChip = (_: number, c: { k: string }) => c.k;
  trackItem = (_: number, i: Item) => i.key;
  trackPack = (_: number, p: { key: string }) => p.key;

  async ngOnInit(): Promise<void> {
    this.favKeys = zrepGet('fav');
    this.subs.push(this.zlist.permissions().subscribe(a => { this.access = a; this.build(); }));
    this.subs.push(this.i18n.lang$.subscribe(() => this.build()));
    try {
      const s = localStorage.getItem('selectedSchema') || '';
      const d = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/reports/?schema=${encodeURIComponent(s)}`));
      (d?.reports || []).forEach((r: any) => this.info[r.key] = { title: r.title, description: r.description });
      this.packs = d?.ui?.packs || [];
    } catch { /* the menu alone still lists the reports */ }
    this.build();
  }

  ngOnDestroy(): void { this.subs.forEach(s => s.unsubscribe()); }

  private build(): void {
    if (!this.access) { return; }
    const app: MenuApp | undefined = MAIN_GROUPS.flatMap(g => g.apps).find(a => a.key === 'reports');
    const secs = visibleSections(app || null, this.access, this.cp).filter(s => s.title !== 'Overview');
    this.sections = secs.map(s => ({
      title: s.title,
      items: s.items.map(i => {
        const key = (i.link.match(/\/r\/([^/?]+)/) || [])[1] || i.link.split('/').pop() || '';
        const desc = i18nT(this.cp.text(this.info[key]?.description || i.hint || ''));
        return { key, label: i.label, link: i.link, icon: i.icon || '', desc, section: i18nT(s.title), hay: (i.label + ' ' + desc + ' ' + s.title).toLowerCase() };
      }),
    }));
    const seen = new Set<string>();
    this.all = this.sections.flatMap(s => s.items).filter(i => !seen.has(i.key) && !!seen.add(i.key));
    this.packs = this.packs.map(p => ({ ...p, reports: p.reports.filter(k => this.all.some(i => i.key === k)) })).filter(p => p.reports.length);
    this.chips = [{ k: 'all', l: 'All' }, { k: 'fav', l: 'Favourites' }, { k: 'recent', l: 'Recently run' }, ...this.packs.map(p => ({ k: p.key, l: p.label }))];
    this.loaded = true;
    this.cd.markForCheck();
  }

  private byKeys(keys: string[]): Item[] { return keys.map(k => this.all.find(i => i.key === k)).filter(Boolean) as Item[]; }
  get fav(): Item[] { return this.byKeys(this.favKeys); }
  get recent(): Item[] { return this.byKeys(zrepGet('recent')); }

  get shown(): Item[] {
    const t = this.q.trim().toLowerCase();
    let base: Item[] = this.chip === 'fav' ? this.fav : this.chip === 'recent' ? this.recent
      : this.chip === 'all' ? this.all : this.byKeys(this.packs.find(p => p.key === this.chip)?.reports || []);
    if (t) { const words = t.split(/\s+/); base = base.filter(i => words.every(w => i.hay.includes(w))); }
    return base;
  }

  count(k: string): number {
    if (k === 'fav') { return this.fav.length; }
    if (k === 'recent') { return this.recent.length; }
    if (k === 'all') { return this.all.length; }
    return this.byKeys(this.packs.find(p => p.key === k)?.reports || []).length;
  }

  get listTitle(): string {
    if (this.q.trim()) { return 'Search results'; }
    return this.chip === 'fav' ? 'Favourites' : this.chip === 'recent' ? 'Recently run' : 'Start here – ' + (this.packs.find(p => p.key === this.chip)?.label || '');
  }
  get packHint(): string {
    return ({ hr: 'The reports an HR manager opens every week.', payroll: 'Check, pay and explain the monthly payroll.',
              finance: 'Labour cost, provisions and what the company owes.', management: 'Headcount, cost and performance at a glance.' } as any)[this.chip] || '';
  }
  get emptyText(): string {
    if (this.q.trim()) { return 'No report matches your search.'; }
    return this.chip === 'fav' ? 'No favourites yet – tick the star of a report to keep it here.' : this.chip === 'recent' ? 'The reports you run show here.' : 'No reports for your rights.';
  }
  packText(p: { reports: string[] }): string { return this.byKeys(p.reports).slice(0, 4).map(i => i.label).join(' · '); }

  setChip(k: string): void { this.chip = k; this.cd.detectChanges(); }
  isFav(k: string): boolean { return this.favKeys.includes(k); }
  toggleFav(k: string): void {
    const f = [...this.favKeys]; const i = f.indexOf(k);
    if (i > -1) { f.splice(i, 1); } else { f.unshift(k); }
    zrepSet('fav', f); this.favKeys = zrepGet('fav'); this.cd.markForCheck();
  }
}
