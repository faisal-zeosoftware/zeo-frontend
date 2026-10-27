// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { recordUrl } from './z-nav';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom, Subscription } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';   // v1.14.0
import { I18N_UI, i18nT, ZDatePipe } from './i18n.service';   // v1.15.0
import { DASH_PRESETS, DashPeriod, DashPeriods, DashPeriodSetting, DashPreset, periodQuery, resolvePeriod } from './z-dash-period';   // v1.16.0

interface DashLayout {
  order: string[];
  hidden: string[];
  sizes: Record<string, 's' | 'w' | 'f'>;
  period: DashPeriodSetting | null;
  cards: Record<string, DashPeriodSetting>;
}
const EMPTY = (): DashLayout => ({ order: [], hidden: [], sizes: {}, period: null, cards: {} });
const SIZES: ('s' | 'w' | 'f')[] = ['s', 'w', 'f'];
const SIZE_LABEL: Record<string, string> = { s: 'Small', w: 'Wide', f: 'Full width' };

/**
 * Dashboard designer (v1.7.0, v1.16.0).
 * Every block marked [data-widget] (with data-widget-title) on the dashboard is a card the user can
 *   – move: drag the handle (mouse or touch), or the ← → ↑ ↓ buttons / arrow keys on the handle (keyboard);
 *   – resize: small / wide / full width (data-widget-size gives the default);
 *   – hide and show again; reset everything to the default layout.
 * The cards must sit in one `.zdd-board` grid (wrappers in between get `.zdd-contents`), so moving = CSS order.
 * Period: one picker for the whole dashboard and a chip on every card with a time dimension
 * (data-widget-timed="1"; "0" = the card shows the current state and the chip says so; data-widget-period = the card's
 * default period, e.g. "today"). The layout and the periods are saved per user and per dashboard on the server
 * (DashboardManagement /dashboard/api/layout/<name>/), with a local copy for a fast start.
 * The dashboard listens to (periods) and loads its figures for the dashboard period and for every card that has its own.
 */
@Component({
  selector: 'z-dash-designer',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, CommonModule, FormsModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zdd" [class.on]="editing">
    <div class="zdd-period" *ngIf="periodPicker" role="group" [attr.aria-label]="'Period of the dashboard' | t">
      <mat-icon aria-hidden="true">date_range</mat-icon>
      <label class="zdd-sr" [attr.for]="'zddp-' + name">{{ 'Period' | t }}</label>
      <select [id]="'zddp-' + name" class="zdd-sel" [ngModel]="dash.preset" (ngModelChange)="setDashPreset($event)" [title]="'Every card follows this period unless it has its own' | t">
        <option *ngFor="let p of presets" [value]="p.k">{{ p.l | t }}</option>
      </select>
      <ng-container *ngIf="dash.preset === 'custom' || customOpen">
        <input type="date" class="zdd-date" [(ngModel)]="cFrom" [attr.aria-label]="'From date' | t">
        <span>–</span>
        <input type="date" class="zdd-date" [(ngModel)]="cTo" [attr.aria-label]="'To date' | t">
        <button type="button" class="zr-btn sm" (click)="applyCustom()" [disabled]="!cFrom || !cTo">{{ 'Apply' | t }}</button>
      </ng-container>
      <span class="zdd-range" *ngIf="dash.preset !== 'custom' && !customOpen">{{ rangeText(dash) }}</span>
    </div>
    <span class="zr-grow"></span>
    <ng-container *ngIf="!editing">
      <span class="zdd-hint" *ngIf="L.hidden.length">{{ (L.hidden.length > 1 ? '{0} cards hidden' : '{0} card hidden') | t:L.hidden.length }}</span>
      <button type="button" class="zr-btn sm" (click)="start()"><mat-icon>dashboard_customize</mat-icon>{{ 'Customize' | t }}</button>
    </ng-container>
    <ng-container *ngIf="editing">
      <span class="zdd-txt"><b>{{ 'Customize your dashboard.' | t }}</b> {{ 'Drag a card by its handle or use the arrows to move it, change its size, or hide it.' | t }}</span>
      <span class="zdd-tray" *ngIf="L.hidden.length">
        <button type="button" class="zr-chip" *ngFor="let h of tray; trackBy: byKey" (click)="show(h.key)" [title]="'Show {0}' | t:(h.title | t)"><mat-icon>visibility</mat-icon>{{ h.title | t }}</button>
      </span>
      <button type="button" class="zr-link" (click)="reset()" [title]="(hasCompany ? 'Back to the company layout set by your admin' : 'Back to the standard layout') | t">{{ (hasCompany ? 'Reset to the company layout' : 'Reset to default') | t }}</button>
      <!-- v1.17.0: a company admin saves the layout everyone starts from -->
      <button type="button" class="zr-btn sm" *ngIf="canDefault" (click)="saveDefault()" [title]="'Everyone who has not changed this dashboard sees this layout. Their Reset returns to it.' | t">{{ 'Save as company layout' | t }}</button>
      <button type="button" class="zr-btn primary sm" (click)="done()">{{ 'Done' | t }}</button>
    </ng-container>
  </div>
  <div class="zdd-sr" aria-live="polite">{{ live }}</div>
  <div class="zdd-pop" *ngIf="pop" role="dialog" [attr.aria-label]="'Period for {0}' | t:pop.title" [style.top.px]="pop.y" [style.left.px]="pop.x" (keydown.escape)="closePop()">
    <div class="zdd-pop-h">{{ 'Period for {0}' | t:pop.title }}</div>
    <div class="zdd-pop-list">
      <button type="button" class="zdd-pop-b" [class.on]="!pop.own" (click)="setCard(pop.key, {preset: 'dashboard'})">{{ 'Same as the dashboard' | t }} <small>({{ dash.label | t }})</small></button>
      <button type="button" class="zdd-pop-b" *ngFor="let p of presetsNoCustom" [class.on]="pop.own && pop.preset === p.k" (click)="setCard(pop.key, {preset: p.k})">{{ p.l | t }}</button>
    </div>
    <div class="zdd-pop-c">
      <input type="date" [(ngModel)]="pop.from" [attr.aria-label]="'From date' | t">
      <input type="date" [(ngModel)]="pop.to" [attr.aria-label]="'To date' | t">
      <button type="button" class="zr-btn sm" [disabled]="!pop.from || !pop.to" (click)="setCard(pop.key, {preset: 'custom', from: pop.from, to: pop.to})">{{ 'Apply' | t }}</button>
    </div>
  </div>`,
  styles: [`
    .zdd-period { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; color: var(--zl-text, #262A3D); }
    .zdd-period .mat-icon { color: var(--zl-primary, #5B4FE0); font-size: 20px; width: 20px; height: 20px; }
    .zdd-sel, .zdd-date { height: 32px; border: 1px solid var(--zl-line, #E3E5EE); border-radius: 7px; background: #fff; padding: 0 8px; font: inherit; color: inherit; }
    .zdd-range { color: var(--zl-muted, #6B7185); font-size: 12px; }
    .zdd-sr { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .zdd.on .zdd-period { opacity: .6; }
    /* one grid with every card: CSS order moves them, sizes span columns */
    .zdd-board { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr)); gap: 16px; align-items: stretch; container-type: inline-size; margin-bottom: 16px; }
    .zdd-board .zdd-contents, .zdd-board .zdd-contents > section.zdo, .zdd-board .zdd-contents .zdo-grid { display: contents !important; }
    .zdd-board .zdd-contents .zdo-h { display: none; }
    .zdd-board [data-widget] { min-width: 0; position: relative; margin: 0 !important; width: auto !important; max-width: none !important; }
    .zdd-board [data-widget].zdd-w { grid-column: span 2; }
    .zdd-board [data-widget].zdd-f { grid-column: 1 / -1; }
    @container (max-width: 620px) { .zdd-board [data-widget].zdd-w { grid-column: 1 / -1; } }
    /* period chip on the card's top edge */
    .zdd-chip { position: absolute; top: -11px; right: 14px; z-index: 4; display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 9px;
                border-radius: 11px; border: 1px solid var(--zl-line, #E3E5EE); background: #fff; color: var(--zl-muted, #6B7185); font: inherit; font-size: 11px;
                line-height: 1; cursor: pointer; white-space: nowrap; box-shadow: 0 1px 2px rgba(27, 22, 64, .06); }
    .zdd-chip .material-icons { font-size: 13px; }
    .zdd-chip:hover { border-color: #c9c4f3; color: var(--zl-primary-ink, #3E33B8); }
    .zdd-chip.own { background: var(--zl-weak, #ECEAFD); color: var(--zl-primary-ink, #3E33B8); border-color: #c9c4f3; font-weight: 600; }
    .zdd-chip.now { cursor: help; background: var(--zl-soft, #F4F5FA); }
    .zdd-edit .zdd-chip { right: auto; left: 150px; }
    /* edit mode tools */
    .zdd-edit { outline: 2px dashed #c9c4f3; outline-offset: 4px; border-radius: 10px; }
    .zdd-tools { position: absolute; top: -14px; left: 10px; z-index: 6; display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 15px;
                 border: 1px solid var(--zl-line, #E3E5EE); background: #fff; box-shadow: 0 2px 6px rgba(27, 22, 64, .16); }
    .zdd-tools button { height: 24px; min-width: 24px; padding: 0 6px; border: 0; border-radius: 12px; background: transparent; color: var(--zl-text, #262A3D);
                        font: inherit; font-size: 11.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .zdd-tools button:hover { background: var(--zl-soft, #F4F5FA); }
    .zdd-tools button:focus-visible { outline: 2px solid var(--zl-primary, #5B4FE0); outline-offset: 1px; }
    .zdd-tools .material-icons { font-size: 16px; }
    .zdd-tools .zdd-h { cursor: grab; touch-action: none; color: var(--zl-primary, #5B4FE0); }
    .zdd-tools .zdd-hide { color: var(--zl-bad, #A32626); }
    .zdd-tools .zdd-hide.show { color: var(--zl-good, #0E6B23); }
    .zdd-dragging { opacity: .85; z-index: 40 !important; box-shadow: 0 12px 30px rgba(27, 22, 64, .25); cursor: grabbing; pointer-events: none; transition: none !important; }
    .zdd-drop-before { box-shadow: inset 4px 0 0 var(--zl-primary, #5B4FE0) !important; }
    .zdd-drop-after { box-shadow: inset -4px 0 0 var(--zl-primary, #5B4FE0) !important; }
    [dir="rtl"] .zdd-drop-before { box-shadow: inset -4px 0 0 var(--zl-primary, #5B4FE0) !important; }
    [dir="rtl"] .zdd-drop-after { box-shadow: inset 4px 0 0 var(--zl-primary, #5B4FE0) !important; }
    .zdd-moved { animation: zddflash .9s ease-out; }
    @keyframes zddflash { from { box-shadow: 0 0 0 3px var(--zl-primary, #5B4FE0); } to { box-shadow: 0 0 0 0 transparent; } }
    @media (prefers-reduced-motion: reduce) { .zdd-moved { animation: none; } }
    /* card period pop-up */
    .zdd-pop { position: fixed; z-index: 1200; width: 248px; background: #fff; border: 1px solid var(--zl-line, #E3E5EE); border-radius: 12px; padding: 10px;
               box-shadow: 0 12px 32px rgba(27, 22, 64, .2); font-size: 13px; text-align: start; }
    .zdd-pop-h { font-weight: 600; margin: 0 0 6px; color: var(--zl-ink, #1B1640); }
    .zdd-pop-list { display: flex; flex-direction: column; gap: 1px; max-height: 300px; overflow: auto; }
    .zdd-pop-b { text-align: start; border: 0; background: transparent; padding: 6px 8px; border-radius: 7px; font: inherit; cursor: pointer; color: inherit; }
    .zdd-pop-b:hover, .zdd-pop-b:focus-visible { background: var(--zl-soft, #F4F5FA); }
    .zdd-pop-b.on { background: var(--zl-weak, #ECEAFD); color: var(--zl-primary-ink, #3E33B8); font-weight: 600; }
    .zdd-pop-b small { color: var(--zl-muted, #6B7185); font-weight: 400; }
    .zdd-pop-c { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; border-top: 1px solid var(--zl-line, #E3E5EE); padding-top: 8px; }
    .zdd-pop-c input { min-width: 0; height: 30px; border: 1px solid var(--zl-line, #E3E5EE); border-radius: 6px; padding: 0 4px; font: inherit; font-size: 12px; }
    .zdd-pop-c button { grid-column: 1 / -1; justify-content: center; }
    /* everything a user can open on a dashboard looks clickable */
    .zdd-board .zdo-go, .zdd-board [data-go] { cursor: pointer; }
    @media (max-width: 600px) { .zdd-tools { left: 4px; } .zdd-edit .zdd-chip { left: auto; right: 8px; top: auto; bottom: -11px; } }
  `],
})
export class ZDashDesignerComponent implements OnInit, OnDestroy {
  @Input() name = 'main';
  /** CSS selector of the dashboard element (defaults to the parent of this bar). */
  @Input() scope = '';
  /** v1.16.0: show the period picker (every dashboard has one). */
  @Input() periodPicker = true;
  /** v1.16.0: the dashboard period and every card that has its own; sent on start and whenever one changes. */
  @Output() periods = new EventEmitter<DashPeriods>();

  editing = false;
  L: DashLayout = EMPTY();
  readonly presets = DASH_PRESETS;
  readonly presetsNoCustom = DASH_PRESETS.filter(p => p.k !== 'custom');
  dash: DashPeriod = resolvePeriod(null);
  cFrom = '';
  cTo = '';
  customOpen = false;
  pop: { key: string; title: string; x: number; y: number; own: boolean; preset: string; from: string; to: string } | null = null;
  live = '';
  tray: { key: string; title: string }[] = [];
  /** v1.17.0: company default layout – the user may save it (company admin) / one exists */
  canDefault = false;
  hasCompany = false;
  private titles = new Map<string, string>();
  private obs?: MutationObserver;
  private timer: any;
  private saveTimer: any;
  private lastEmit = '';
  private drag: { key: string; el: HTMLElement; x: number; y: number; target: HTMLElement | null; after: boolean; pid: number } | null = null;

  constructor(private rec: ZRecordService, private http: HttpClient, private el: ElementRef<HTMLElement>, private zone: NgZone, private cd: ChangeDetectorRef) {}

  private get root(): HTMLElement {
    return (this.scope && document.querySelector(this.scope) as HTMLElement) || this.el.nativeElement.parentElement || document.body;
  }

  private get url(): string {
    return `${this.rec.api}/dashboard/api/layout/${encodeURIComponent(this.name)}/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
  }

  async ngOnInit(): Promise<void> {
    try { const x = JSON.parse(localStorage.getItem('zdd2:' + this.name) || 'null'); if (x) { this.L = { ...EMPTY(), ...x }; } } catch { /* storage off */ }
    if (!localStorage.getItem('zdd2:' + this.name)) {   // the v1.7.0 designer kept hidden cards only
      try { this.L.hidden = JSON.parse(localStorage.getItem('zdd:' + this.name) || '[]'); } catch { /* none */ }
    }
    this.syncDash();
    this.apply();
    this.emit();
    this.watch();
    try {
      const r: any = await firstValueFrom(this.http.get(this.url));
      if (r) {
        this.canDefault = !!r.can_default; this.hasCompany = !!r.company;   // v1.17.0
        const next: DashLayout = { order: r.order || [], hidden: r.hidden || [], sizes: r.sizes || {}, period: r.period || null, cards: r.cards || {} };
        if (JSON.stringify(next) !== JSON.stringify(this.L)) { this.L = next; this.syncDash(); this.keepLocal(); this.apply(); this.emit(); }
      }
    } catch { /* offline: the local copy is used */ }
  }

  ngOnDestroy(): void { this.obs?.disconnect(); clearTimeout(this.timer); clearTimeout(this.saveTimer); this.endDrag(false); }

  // ------------------------------------------------------------------ periods
  private syncDash(): void {
    this.dash = resolvePeriod(this.L.period);
    if (this.dash.preset === 'custom') { this.cFrom = this.dash.from; this.cTo = this.dash.to; }
  }

  /** v1.17.0: in the language pack's date format (dd/MM/yyyy …), like every other date on the dashboards */
  rangeText(p: DashPeriod): string { const f = (d: string) => this.zd.transform(d); return p.from === p.to ? f(p.from) : `${f(p.from)} – ${f(p.to)}`; }
  private zd = new ZDatePipe();

  setDashPreset(p: DashPreset): void {
    if (p === 'custom') { this.customOpen = true; this.cFrom = this.dash.from; this.cTo = this.dash.to; return; }
    this.customOpen = false;
    this.L.period = { preset: p };
    this.syncDash(); this.save(); this.apply(); this.emit();
  }

  applyCustom(): void {
    if (!this.cFrom || !this.cTo) { return; }
    this.customOpen = false;
    this.L.period = { preset: 'custom', from: this.cFrom, to: this.cTo };
    this.syncDash(); this.save(); this.apply(); this.emit();
  }

  /** The card's own period (saved choice, else its default), or null when it follows the dashboard. */
  cardPeriod(key: string, el?: HTMLElement | null): DashPeriod | null {
    const s = this.L.cards[key] || (el?.dataset['widgetPeriod'] ? { preset: el.dataset['widgetPeriod'] as DashPreset } : null);
    if (!s || s.preset === 'dashboard') { return null; }
    return resolvePeriod(s);
  }

  private emit(): void {
    const cards: Record<string, DashPeriod> = {};
    const seen = new Set<string>();
    for (const w of this.widgets()) {
      const k = w.dataset['widget']!;
      seen.add(k);
      if (w.dataset['widgetTimed'] === '0') { continue; }
      const p = this.cardPeriod(k, w);
      if (p) { cards[k] = p; }
    }
    for (const k of Object.keys(this.L.cards)) {   // cards not on screen yet (data still loading)
      if (!seen.has(k)) { const p = this.cardPeriod(k); if (p) { cards[k] = p; } }
    }
    const out: DashPeriods = { dash: this.dash, cards };
    const sig = JSON.stringify(out);
    if (sig === this.lastEmit) { return; }
    this.lastEmit = sig;
    this.zone.run(() => this.periods.emit(out));
  }

  openPop(key: string, chip: HTMLElement): void {
    const r = chip.getBoundingClientRect();
    const w = this.widgets().find(x => x.dataset['widget'] === key) || null;
    const own = this.cardPeriod(key, w);
    const p = own || this.dash;
    const x = Math.max(8, Math.min(window.innerWidth - 258, r.left));
    const y = Math.min(window.innerHeight - 380, r.bottom + 6);
    this.pop = { key, title: i18nT(this.titles.get(key) || key), x, y: Math.max(8, y), own: !!own, preset: own ? own.preset : '', from: p.from, to: p.to };
    this.cd.detectChanges();
    setTimeout(() => (document.querySelector('.zdd-pop .zdd-pop-b') as HTMLElement | null)?.focus());
  }

  closePop(): void {
    const key = this.pop?.key;
    this.pop = null;
    this.cd.detectChanges();
    if (key) { (this.widgets().find(x => x.dataset['widget'] === key)?.querySelector(':scope > .zdd-chip') as HTMLElement | null)?.focus(); }
  }

  setCard(key: string, s: DashPeriodSetting): void {
    this.L.cards = { ...this.L.cards, [key]: s };
    this.pop = null;
    this.save(); this.apply(); this.emit();
    this.say(i18nT('Period changed for {0}', [i18nT(this.titles.get(key) || key)]));
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocDown(ev: PointerEvent): void {
    if (this.pop && !(ev.target as HTMLElement).closest('.zdd-pop, .zdd-chip')) { this.pop = null; this.cd.detectChanges(); }
  }

  // ------------------------------------------------------------------ cards on the page
  /** Re-apply when the dashboard adds or removes cards (data loaded later); only [data-widget] changes count. */
  private watch(): void {
    if (this.obs) { return; }
    this.zone.runOutsideAngular(() => {
      const isWidget = (n: Node) => n.nodeType === 1 && ((n as HTMLElement).matches?.('[data-widget]') || !!(n as HTMLElement).querySelector?.('[data-widget]'));
      this.obs = new MutationObserver(recs => {
        if (!recs.some(r => Array.from(r.addedNodes).some(isWidget) || Array.from(r.removedNodes).some(isWidget)
            || (r.type === 'attributes' && (r.target as HTMLElement).matches?.('[data-widget]')))) { return; }
        clearTimeout(this.timer); this.timer = setTimeout(() => { this.apply(false); this.emit(); }, 120);
      });
      this.obs.observe(this.root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-widget', 'data-widget-timed', 'data-widget-period'] });
    });
  }

  private widgets(): HTMLElement[] { return Array.from(this.root.querySelectorAll('[data-widget]')) as HTMLElement[]; }

  /** Keys in screen order: the saved order first, a card the user never moved stays after the one before it on the page. */
  private ordered(): string[] {
    const dom = this.widgets().map(w => w.dataset['widget']!);
    const out = this.L.order.filter(k => dom.includes(k));
    dom.forEach((k, i) => {
      if (out.includes(k)) { return; }
      const prev = dom.slice(0, i).reverse().find(x => out.includes(x));
      out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k);
    });
    return out;
  }

  private sizeOf(w: HTMLElement): 's' | 'w' | 'f' {
    const k = w.dataset['widget']!;
    const d = w.dataset['widgetSize'];
    return this.L.sizes[k] || (d === 'w' || d === 'f' ? d : 's');
  }

  apply(check = true): void {
    const order = this.ordered();
    for (const w of this.widgets()) {
      const key = w.dataset['widget']!;
      const title = w.dataset['widgetTitle'] || key;
      this.titles.set(key, title);
      const off = this.L.hidden.includes(key);
      w.classList.toggle('zdd-off', off && !this.editing);
      w.classList.toggle('zdd-dim', off && this.editing);
      w.classList.toggle('zdd-edit', this.editing);
      const sz = this.sizeOf(w);
      w.classList.toggle('zdd-w', sz === 'w');
      w.classList.toggle('zdd-f', sz === 'f');
      const o = String(order.indexOf(key));
      if (w.style.order !== o) { w.style.order = o; }
      this.chip(w, key, title);
      this.tools(w, key, title, off, sz);
    }
    const next = this.L.hidden.map(k => ({ key: k, title: this.titles.get(k) || k }));
    if (next.map(h => h.key + h.title).join('|') !== this.tray.map(h => h.key + h.title).join('|')) { this.tray = next; }
    if (check) { this.cd.markForCheck(); }
    this.scheduleFill();
  }

  // ------------------------------------------------------------------ v1.17.0 (audit L3): no empty space after the last card
  private fillRaf = 0;
  private scheduleFill(): void {
    cancelAnimationFrame(this.fillRaf);
    this.zone.runOutsideAngular(() => { this.fillRaf = requestAnimationFrame(() => this.fillLastRow()); });
  }

  @HostListener('window:resize')
  onResize(): void { this.scheduleFill(); }

  /** v1.17.0 (audit L3): no holes – in every grid row the last card grows over the columns left free at the end of its row
   *  (a wide card that did not fit wraps to the next row; the card before it fills the gap). The order never changes,
   *  so drag & drop and the arrows keep moving cards exactly where the user puts them. */
  private fillLastRow(): void {
    const ws = this.widgets().filter(w => !w.classList.contains('zdd-off') && w.getClientRects().length);
    ws.forEach(w => { if (w.dataset['zddFill']) { w.style.gridColumn = ''; delete w.dataset['zddFill']; } });
    if (this.editing || ws.length < 2) { return; }
    const grid = ws[0].parentElement?.closest('.zdd-board') as HTMLElement | null || this.root;
    const cs = getComputedStyle(grid);
    const cols = (cs.gridTemplateColumns || '').split(' ').filter(x => x && x !== 'none').length;
    if (cols < 2) { return; }
    const gap = parseFloat(cs.columnGap) || 0;
    const gr = grid.getBoundingClientRect();
    const colW = (gr.width + gap) / cols;
    const rs = ws.map(w => ({ w, r: w.getBoundingClientRect() }));
    const rows = new Map<number, typeof rs>();
    for (const x of rs) {
      const k = [...rows.keys()].find(t => Math.abs(t - x.r.top) <= 2) ?? Math.round(x.r.top);
      (rows.get(k) || rows.set(k, []).get(k)!).push(x);
    }
    const rtl = this.isRtl();
    for (const row of rows.values()) {
      const used = row.reduce((n, x) => n + Math.max(1, Math.round((x.r.width + gap) / colW)), 0);
      const free = cols - used;
      if (free <= 0) { continue; }
      const end = row.reduce((a, b) => (rtl ? b.r.left < a.r.left : b.r.right > a.r.right) ? b : a);
      const span = Math.max(1, Math.round((end.r.width + gap) / colW)) + free;
      end.w.style.gridColumn = `span ${span}`;
      end.w.dataset['zddFill'] = '1';
    }
  }

  /** The period chip: the card's period (click to change it), or "Now" for a card without a time dimension. */
  private chip(w: HTMLElement, key: string, title: string): void {
    const timed = w.dataset['widgetTimed'];
    let c = w.querySelector(':scope > .zdd-chip') as HTMLElement | null;
    if (timed !== '1' && timed !== '0') { c?.remove(); return; }
    const own = timed === '1' ? this.cardPeriod(key, w) : null;
    const text = timed === '0' ? i18nT('Now') : i18nT((own || this.dash).label);
    const tip = timed === '0'
      ? i18nT(w.dataset['widgetNow'] || 'This card shows the current figures. The period does not change it.')
      : (own ? i18nT('This card has its own period: {0}. Select to change it.', [`${own.from} – ${own.to}`])
             : i18nT('This card follows the dashboard period. Select to give it its own.'));
    const kind = timed === '0' ? 'now' : own ? 'own' : 'dash';
    if (!c) {
      c = document.createElement(timed === '0' ? 'span' : 'button');
      if (c instanceof HTMLButtonElement) {
        c.type = 'button';
        c.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); this.zone.run(() => this.openPop(key, c!)); });
      } else { c.tabIndex = 0; }
      c.addEventListener('pointerdown', e => e.stopPropagation());
      w.prepend(c);
    }
    const sig = `${kind}|${text}|${tip}`;
    if (c.dataset['sig'] !== sig) {
      c.dataset['sig'] = sig;
      c.className = 'zdd-chip ' + kind;
      c.innerHTML = `<span class="material-icons" aria-hidden="true">${timed === '0' ? 'schedule' : 'event'}</span><span class="zdd-chip-t"></span>`;
      (c.querySelector('.zdd-chip-t') as HTMLElement).textContent = text;
      c.title = tip;
      c.setAttribute('aria-label', `${i18nT(title)}: ${text}. ${tip}`);
    }
  }

  /** Edit-mode tool bar on the card: drag handle, move buttons, size, hide / show. */
  private tools(w: HTMLElement, key: string, title: string, off: boolean, sz: string): void {
    let t = w.querySelector(':scope > .zdd-tools') as HTMLElement | null;
    if (!this.editing) { t?.remove(); w.querySelector(':scope > .zdd-x')?.remove(); return; }
    w.querySelector(':scope > .zdd-x')?.remove();
    const T = (s: string, p?: any[]) => i18nT(s, p);
    const name = T(title);
    if (!t) {
      t = document.createElement('div');
      t.className = 'zdd-tools';
      t.setAttribute('data-no-mirror', '');
      t.setAttribute('role', 'toolbar');
      t.innerHTML = `
        <button type="button" class="zdd-h" data-a="drag"><span class="material-icons" aria-hidden="true">drag_indicator</span></button>
        <button type="button" data-a="left"><span class="material-icons" aria-hidden="true">west</span></button>
        <button type="button" data-a="right"><span class="material-icons" aria-hidden="true">east</span></button>
        <button type="button" data-a="up"><span class="material-icons" aria-hidden="true">north</span></button>
        <button type="button" data-a="down"><span class="material-icons" aria-hidden="true">south</span></button>
        <button type="button" data-a="size" class="zdd-size"></button>
        <button type="button" data-a="hide" class="zdd-hide"></button>`;
      t.addEventListener('click', (e) => {
        const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
        if (!b) { return; }
        e.stopPropagation(); e.preventDefault();
        const a = b.dataset['a'];
        this.zone.run(() => {
          if (a === 'left' || a === 'right' || a === 'up' || a === 'down') { this.moveDir(key, a); }
          else if (a === 'size') { this.cycleSize(key); }
          else if (a === 'hide') { this.flip(key); }
        });
      });
      const h = t.querySelector('.zdd-h') as HTMLElement;
      h.addEventListener('pointerdown', (e) => this.startDrag(e as PointerEvent, key, w));
      h.addEventListener('keydown', (e) => {
        const k = (e as KeyboardEvent).key;
        const map: Record<string, 'left' | 'right' | 'up' | 'down'> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
        if (map[k]) { e.preventDefault(); this.zone.run(() => this.moveDir(key, map[k], true)); }
      });
      w.prepend(t);
    }
    const lab: Record<string, string> = {
      drag: T('Drag to move {0}. With the keyboard: arrow keys.', [name]), left: T('Move {0} left', [name]), right: T('Move {0} right', [name]),
      up: T('Move {0} up', [name]), down: T('Move {0} down', [name]),
      size: T('Size of {0}: {1}. Select to change.', [name, T(SIZE_LABEL[sz])]), hide: T(off ? 'Show {0}' : 'Hide {0}', [name]),
    };
    t.querySelectorAll('button').forEach(b => {
      const a = (b as HTMLElement).dataset['a']!;
      if (b.getAttribute('aria-label') !== lab[a]) { b.setAttribute('aria-label', lab[a]); b.title = lab[a]; }
    });
    const sb = t.querySelector('.zdd-size') as HTMLElement;
    const st = T(SIZE_LABEL[sz]);
    if (sb.textContent !== st) { sb.textContent = st; }
    const hb = t.querySelector('.zdd-hide') as HTMLElement;
    const ht = T(off ? 'Show' : 'Hide');
    if (hb.textContent !== ht) { hb.textContent = ht; }
    hb.classList.toggle('show', off);
  }

  // ------------------------------------------------------------------ moving
  private isRtl(): boolean { return getComputedStyle(this.root).direction === 'rtl'; }

  private place(key: string, target: string, after: boolean): void {
    if (key === target) { return; }
    const o = this.ordered().filter(k => k !== key);
    const i = o.indexOf(target);
    o.splice(after ? i + 1 : i, 0, key);
    this.L.order = o;
    this.apply(); this.save();
    const pos = o.indexOf(key) + 1;
    this.say(i18nT('{0} moved to position {1} of {2}', [i18nT(this.titles.get(key) || key), pos, o.length]));
    const w = this.widgets().find(x => x.dataset['widget'] === key);
    if (w) { w.classList.remove('zdd-moved'); void w.offsetWidth; w.classList.add('zdd-moved'); }
  }

  /** ← → = the card before / after it (mirrored in right-to-left); ↑ ↓ = the card above / below it on the screen. */
  moveDir(key: string, dir: 'left' | 'right' | 'up' | 'down', keepFocus = false): void {
    const ord = this.ordered().filter(k => !this.L.hidden.includes(k) || this.editing);
    const i = ord.indexOf(key);
    if (i < 0) { return; }
    if (dir === 'left' || dir === 'right') {
      const fwd = (dir === 'right') !== this.isRtl();
      const j = fwd ? i + 1 : i - 1;
      if (j < 0 || j >= ord.length) { this.say(i18nT('{0} is already at the end', [i18nT(this.titles.get(key) || key)])); return; }
      this.place(key, ord[j], fwd);
    } else {
      const els = new Map(this.widgets().map(w => [w.dataset['widget']!, w]));
      const me = els.get(key)!.getBoundingClientRect();
      let best: string | null = null, bestScore = Infinity;
      for (const k of ord) {
        if (k === key) { continue; }
        const r = els.get(k)?.getBoundingClientRect();
        if (!r || (!r.width && !r.height)) { continue; }
        const ok = dir === 'up' ? r.bottom <= me.top + 4 : r.top >= me.bottom - 4;
        if (!ok) { continue; }
        const dy = dir === 'up' ? me.top - r.bottom : r.top - me.bottom;
        const dx = Math.abs((r.left + r.right) / 2 - (me.left + me.right) / 2);
        const score = dy * 4 + dx;
        if (score < bestScore) { bestScore = score; best = k; }
      }
      if (!best) { this.say(i18nT('{0} is already at the end', [i18nT(this.titles.get(key) || key)])); return; }
      this.place(key, best, dir === 'down');
    }
    if (keepFocus) {
      setTimeout(() => (this.widgets().find(x => x.dataset['widget'] === key)?.querySelector('.zdd-h') as HTMLElement | null)?.focus());
    }
  }

  private startDrag(e: PointerEvent, key: string, w: HTMLElement): void {
    if (!this.editing || (e.pointerType === 'mouse' && e.button !== 0)) { return; }
    e.preventDefault(); e.stopPropagation();
    const h = e.currentTarget as HTMLElement;
    try { h.setPointerCapture(e.pointerId); } catch { /* old browser */ }
    this.drag = { key, el: w, x: e.clientX, y: e.clientY, target: null, after: false, pid: e.pointerId };
    w.classList.add('zdd-dragging');
    const move = (ev: PointerEvent) => this.onDrag(ev);
    const up = (ev: PointerEvent) => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', cancel);
      this.zone.run(() => this.endDrag(true)); };
    const cancel = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', cancel);
      this.zone.run(() => this.endDrag(false)); };
    this.zone.runOutsideAngular(() => { h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', cancel); });
  }

  private onDrag(e: PointerEvent): void {
    const d = this.drag;
    if (!d) { return; }
    d.el.style.transform = `translate(${e.clientX - d.x}px, ${e.clientY - d.y}px)`;
    const hit = (document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[])
      .map(x => x.closest('[data-widget]') as HTMLElement | null).find(x => !!x && x !== d.el && this.root.contains(x)) || null;
    d.target?.classList.remove('zdd-drop-before', 'zdd-drop-after');
    d.target = hit;
    if (hit) {
      const r = hit.getBoundingClientRect();
      const rtl = this.isRtl();
      const sameRow = e.clientY > r.top && e.clientY < r.bottom;
      d.after = sameRow ? ((e.clientX > r.left + r.width / 2) !== rtl) : e.clientY > r.top + r.height / 2;
      hit.classList.add(d.after ? 'zdd-drop-after' : 'zdd-drop-before');
    }
    const edge = 60;   // scroll the page while dragging near the top / bottom (v1.17.0: the dashboard's own scroll area)
    const sp = this.scroller();
    if (e.clientY < edge) { sp.scrollBy(0, -12); } else if (e.clientY > window.innerHeight - edge) { sp.scrollBy(0, 12); }
  }

  /** v1.17.0: the element that scrolls the dashboard (the Home page has its own scroll area; the window otherwise). */
  private scroller(): { scrollBy: (x: number, y: number) => void } {
    let n: HTMLElement | null = this.root;
    while (n && n !== document.body) {
      const o = getComputedStyle(n).overflowY;
      if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) { return n; }
      n = n.parentElement;
    }
    return window;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.drag) { this.endDrag(false); } else if (this.pop) { this.closePop(); } }

  private endDrag(drop: boolean): void {
    const d = this.drag;
    if (!d) { return; }
    this.drag = null;
    d.el.classList.remove('zdd-dragging');
    d.el.style.transform = '';
    d.target?.classList.remove('zdd-drop-before', 'zdd-drop-after');
    if (drop && d.target) { this.place(d.key, d.target.dataset['widget']!, d.after); }
  }

  cycleSize(key: string): void {
    const w = this.widgets().find(x => x.dataset['widget'] === key);
    if (!w) { return; }
    const next = SIZES[(SIZES.indexOf(this.sizeOf(w)) + 1) % SIZES.length];
    this.L.sizes = { ...this.L.sizes, [key]: next };
    this.apply(); this.save();
    this.say(i18nT('{0}: {1}', [i18nT(this.titles.get(key) || key), i18nT(SIZE_LABEL[next])]));
  }

  // ------------------------------------------------------------------ edit mode, hide / show, reset
  byKey = (_: number, h: { key: string }) => h.key;
  start(): void { this.editing = true; this.apply(); setTimeout(() => (this.root.querySelector('.zdd-h') as HTMLElement | null)?.focus()); }
  done(): void { this.editing = false; this.apply(); this.save(true); }
  flip(key: string): void { this.L.hidden.includes(key) ? this.show(key) : (this.L.hidden = [...this.L.hidden, key], this.apply(), this.save()); }
  show(key: string): void { this.L.hidden = this.L.hidden.filter(k => k !== key); this.apply(); this.save(); }

  /** v1.17.0: Reset = the company layout (when an admin saved one), else the built-in default. */
  async reset(): Promise<void> {
    let next = EMPTY();
    try {
      const r: any = await firstValueFrom(this.http.delete(this.url));
      if (r) { next = { order: r.order || [], hidden: r.hidden || [], sizes: r.sizes || {}, period: r.period || null, cards: r.cards || {} }; this.hasCompany = !!r.company; }
    } catch { /* offline: the built-in default */ }
    this.L = next;
    this.syncDash(); this.keepLocal(); this.apply(); this.emit();
    this.say(i18nT(this.hasCompany ? 'The dashboard is back to the company layout.' : 'The dashboard is back to the default layout.'));
  }

  /** v1.17.0 (company admin): this layout becomes the one every user starts from. */
  async saveDefault(): Promise<void> {
    try {
      await firstValueFrom(this.http.put(this.url + '&company=1', this.L));
      this.hasCompany = true;
      this.say(i18nT('Saved as the company layout. Users who have not changed this dashboard now see it.'));
    } catch { this.say(i18nT('The company layout could not be saved. Only a company admin can save it.')); }
  }

  private say(text: string): void { this.live = text; this.cd.markForCheck(); }

  private keepLocal(): void {
    try { localStorage.setItem('zdd2:' + this.name, JSON.stringify(this.L)); localStorage.setItem('zdd:' + this.name, JSON.stringify(this.L.hidden)); } catch { /* storage off */ }
  }

  private save(now = false): void {
    this.keepLocal();
    clearTimeout(this.saveTimer);
    const go = () => this.http.put(this.url, this.L).subscribe({ error: () => { /* offline: kept locally */ } });
    if (now) { go(); } else { this.saveTimer = setTimeout(go, 350); }
  }
}

/** Main dashboard (v1.7.0): "My space" for the logged-in employee and one card per module the user may see.
 *  v1.16.0: every card follows the dashboard period or its own (chip), every figure opens the rows behind it. */
@Component({
  selector: 'z-dash-overview',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, ...I18N_UI, CommonModule, RouterModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <section class="zdo" *ngIf="data">
    <!-- my space -->
    <ng-container *ngIf="me?.employee">
      <h2 class="zdo-h">{{ 'My space' | t }}</h2>
      <div class="zdo-grid">
        <article class="zdo-card" data-widget="me-leave" data-widget-title="My leave" data-widget-timed="0" data-widget-now="Leave balances as of today.">
          <header><mat-icon>event_available</mat-icon><h3>{{ 'My leave' | t }}</h3><a class="zr-link" routerLink="/main-sidebar/leave-options/leave-request">{{ 'Requests' | t }}</a></header>
          <p class="zr-muted" *ngIf="!me.leave_balances?.length">{{ 'No leave balance yet.' | t }}</p>
          <div class="zdo-row zdo-go" *ngFor="let b of me.leave_balances?.slice(0, 4)" role="link" tabindex="0" (click)="go('/main-sidebar/leave-options/leave-balance')" (keydown.enter)="go('/main-sidebar/leave-options/leave-balance')"><span>{{ b.name }}</span><b>{{ b.balance | number:'1.0-1' }} <small>{{ 'days' | t }}</small></b></div>
          <p class="zdo-note zdo-go" *ngIf="me.next_leave" role="link" tabindex="0" (click)="open(me.next_leave)" (keydown.enter)="open(me.next_leave)">{{ 'Next' | t }}: {{ me.next_leave.type }} {{ me.next_leave.from | date:'d MMM' }} ({{ me.next_leave.status | t }})</p>
        </article>
        <article class="zdo-card" data-widget="me-assets" data-widget-title="My assets" data-widget-timed="0" data-widget-now="Assets you hold today.">
          <header><mat-icon>inventory_2</mat-icon><h3>{{ 'My assets' | t }}</h3><span class="zdo-n">{{ me.assets?.length || 0 }}</span></header>
          <p class="zr-muted" *ngIf="!me.assets?.length">{{ 'No company assets with you.' | t }}</p>
          <div class="zdo-row zdo-go" *ngFor="let a of me.assets?.slice(0, 5)" (click)="open(a)" role="link" tabindex="0" (keydown.enter)="open(a)"><span>{{ a.name }}<small *ngIf="a.serial"> · {{ a.serial }}</small></span><b><small>{{ a.since | date:'dd/MM/yyyy' }}</small></b></div>
        </article>
        <article class="zdo-card" data-widget="me-pay" data-widget-title="My pay" data-widget-timed="0" data-widget-now="Your last approved payslip up to the end of the dashboard period.">
          <header><mat-icon>payments</mat-icon><h3>{{ 'My pay' | t }}</h3></header>
          <ng-container *ngIf="me.payslip; else noPay">
            <p class="zr-muted">{{ me.payslip.period }}</p>
            <p class="zdo-big zdo-go" (click)="open(me.payslip)" role="link" tabindex="0" (keydown.enter)="open(me.payslip)">{{ me.payslip.net | zmoney:'1.0-0' }} <small>{{ 'net' | t }}</small></p>
          </ng-container>
          <ng-template #noPay><p class="zr-muted">{{ 'No payslip yet.' | t }}</p></ng-template>
          <div class="zdo-row zdo-go" *ngIf="me.loans?.count" role="link" tabindex="0" (click)="go('/main-sidebar/loan-sidebar/loan-application')" (keydown.enter)="go('/main-sidebar/loan-sidebar/loan-application')"><span>{{ 'Loan balance' | t }}</span><b>{{ me.loans.outstanding | zmoney:'1.0-0' }}</b></div>
          <div class="zdo-row zdo-go" *ngIf="me.air_ticket" role="link" tabindex="0" (click)="go('/main-sidebar/air-ticket-options/airticket-request')" (keydown.enter)="go('/main-sidebar/air-ticket-options/airticket-request')"><span>{{ 'Air ticket left' | t }}</span><b>{{ me.air_ticket.remaining | zmoney:'1.0-0' }}</b></div>
        </article>
        <article class="zdo-card" data-widget="me-docs" data-widget-title="My documents" data-widget-timed="0" data-widget-now="Expiry as of today.">
          <header><mat-icon>description</mat-icon><h3>{{ 'My documents' | t }}</h3></header>
          <p class="zr-muted" *ngIf="!me.documents?.length">{{ 'No documents with an expiry date.' | t }}</p>
          <div class="zdo-row zdo-go" *ngFor="let d of me.documents?.slice(0, 4)" (click)="open(d)" role="link" tabindex="0" (keydown.enter)="open(d)"><span>{{ d.type }}</span>
            <b [class]="'zdo-pill ' + d.state">{{ d.state === 'expired' ? ('Expired' | t) : d.state === 'expiring' ? ('{0} days' | t:d.days) : (d.expiry | date:'MMM y') }}</b></div>
        </article>
        <article class="zdo-card" data-widget="me-requests" data-widget-title="My requests" data-widget-timed="0" data-widget-now="Your latest requests, whatever their date.">
          <header><mat-icon>assignment</mat-icon><h3>{{ 'My requests' | t }}</h3></header>
          <p class="zr-muted" *ngIf="!me.requests?.recent?.length">{{ 'No requests yet.' | t }}</p>
          <div class="zdo-row zdo-go" *ngFor="let r of me.requests?.recent?.slice(0, 4)" (click)="open(r)" role="link" tabindex="0" (keydown.enter)="open(r)"><span>{{ r.module_label | t }}<small> · {{ r.summary || r.document_number }}</small></span><b [class]="'zdo-pill ' + r.status_key">{{ r.status | t }}</b></div>
        </article>
      </div>
    </ng-container>

    <!-- company -->
    <ng-container *ngIf="data.cards?.length">
      <h2 class="zdo-h">{{ (hrOps ? 'HR operations' : 'Company at a glance') | t }}</h2>
      <div class="zdo-grid">
        <article class="zdo-card" *ngFor="let c of data.cards; trackBy: byCard" [attr.data-widget]="'ov-' + c.key" [attr.data-widget-title]="c.title"
                 [attr.data-widget-timed]="c.timed ? '1' : '0'" [attr.data-widget-period]="c.default_period || null" [class.zdo-busy]="busy[c.key]">
          <header><mat-icon aria-hidden="true">{{ c.icon }}</mat-icon><h3>{{ c.title | t }}<small class="zdo-subt" *ngIf="c.subtitle">{{ c.subtitle }}</small></h3>
            <a class="zr-ic" *ngIf="c.app" [routerLink]="c.app" [title]="'Open the {0} screen' | t:(c.title | t)" [attr.aria-label]="'Open the {0} screen' | t:(c.title | t)"><mat-icon>open_in_new</mat-icon></a>
            <!-- v1.17.0: "See all" (the Arabic of "Open" reads as the status "open") -->
            <a class="zr-link" [routerLink]="path(c.route)" [queryParams]="query(c.route)" [title]="'Open the report behind this card' | t">{{ 'See all' | t }}</a></header>
          <p class="zr-muted zdo-empty" *ngIf="c.empty">{{ c.empty | t }}</p>
          <div class="zdo-kpis" *ngIf="c.kpis?.length">
            <button type="button" *ngFor="let k of c.kpis" [class]="'zdo-kpi ' + (k.tone && k.value ? k.tone : '') + (k.money ? ' wide' : '') + (k.link ? ' zdo-go' : '')"
                    [disabled]="!k.link" (click)="go(k.link)" [title]="tip(c, k)" [attr.data-link]="k.link" [attr.data-sum]="sumOf(k)">
              <b>{{ k.money ? (k.value | zmoney:'1.0-0') : (k.value | number:'1.0-2') }}</b><span>{{ k.label | zc | t }}{{ k.suffix ? ' ' + (k.suffix | zc | t) : '' }}<i class="zdo-now" *ngIf="c.timed && k.timed === false" aria-hidden="true"> ·&nbsp;{{ 'now' | t }}</i></span></button>
          </div>
          <div class="zdo-items" *ngIf="c.items?.length">
            <div class="zdo-sub" *ngIf="c.note">{{ c.note | t }}</div>
            <ng-container *ngFor="let i of c.items; let n = index">
              <div class="zdo-sub" *ngIf="i.group && (n === 0 || c.items[n - 1].group !== i.group)">{{ i.group | t }}</div>
              <div class="zdo-row" [class.zdo-go]="i.link" (click)="go(i.link)" [attr.role]="i.link ? 'link' : null" [attr.tabindex]="i.link ? 0 : null" (keydown.enter)="go(i.link)" [attr.data-link]="i.link" [attr.data-sum]="sumOf(i)">
                <span data-no-translate>{{ i.label | zc | t }}<small *ngIf="i.sub"> · {{ i.sub | t:((i.sub_n ?? '') + '' | t) }}</small></span>
                <b [class]="'zdo-v ' + (i.tone || '')">{{ i.date ? (i.date | zdate) : isNum(i.value) ? (i.value | number:'1.0-2') : i.value }}{{ i.unit ? ' ' + (i.unit | t) : '' }}</b></div>
            </ng-container>
          </div>
          <!-- v1.17.0: figures that live on another view are linked, not repeated -->
          <button type="button" class="zdo-see" *ngIf="c.see && seeTab.observed && (!tabs || tabs.includes(c.see.tab))" (click)="seeTab.emit(c.see.tab)"><span>{{ c.see.label | t }}</span><mat-icon aria-hidden="true">arrow_forward</mat-icon></button>
        </article>
      </div>
    </ng-container>
  </section>
  <p class="zr-muted" *ngIf="error">{{ error }}</p>`,
  styles: [`.zdo-busy { opacity: .55; transition: opacity .15s; } .zdo-now { font-style: normal; opacity: .8; } .zdo-empty { margin: 0; }
            /* v1.17.0: card layout – figures on top, list in the middle, the cross-view link pinned to the bottom of equal-height cards */
            .zdo-card h3 { display: flex; flex-direction: column; min-width: 0; } .zdo-subt { font-weight: 400; font-size: 12px; color: var(--zl-muted, #6B7185); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .zdo-items { display: flex; flex-direction: column; min-width: 0; }
            .zdo-v.warn { color: var(--zl-warn, #7A5200); } .zdo-v.bad { color: var(--zl-bad, #A32626); } .zdo-v.good { color: var(--zl-good, #0E6B23); }
            .zdo-row b { font-variant-numeric: tabular-nums; }
            /* names and document labels in Latin script keep their own direction in Arabic (cut at their end, not their start) */
            .zdo-items .zdo-row > span { unicode-bidi: plaintext; text-align: start; white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: anywhere; }   /* v1.17.0 (audit M10): wrap, never cut */
            .zdo-items .zdo-row { align-items: baseline; }
            .zdo-see { margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; border: 0; background: transparent; padding: 8px 0 0;
                       color: var(--zl-primary, #5B4FE0); font: inherit; font-size: 12.5px; cursor: pointer; text-align: start; }
            .zdo-see:hover span { text-decoration: underline; } .zdo-see .mat-icon { font-size: 16px; width: 16px; height: 16px; }
            .zdo-card header .zr-ic .mat-icon { font-size: 17px; width: 17px; height: 17px; color: var(--zl-muted, #6B7185); }`],
})
export class ZDashOverviewComponent implements OnInit, OnDestroy {
  data: any = null; me: any = null; error = '';
  busy: Record<string, boolean> = {};
  private dash: DashPeriod | null = null;
  private applied: Record<string, string> = {};   // card key → period it shows
  private seq = 0;
  private sub?: Subscription;
  /** v1.16.0: wait for the designer's periods when it is on the page (set by the dashboard). */
  @Input() waitForPeriods = false;
  /** v1.17.0: the HR operations view of Home – company cards only (the user's own items are on My dashboard). */
  @Input() hrOps = false;
  /** v1.17.0: a card links to the view where a related figure lives (e.g. cost trends on Management). */
  @Output() seeTab = new EventEmitter<string>();
  /** v1.17.0 (audit M8): the views the user may open – a "see" link to another view only when the user has it */
  @Input() tabs: string[] | null = null;
  isNum(v: any): boolean { return typeof v === 'number'; }
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef, private router: Router) {}

  /** v1.8.1: every figure opens the rows behind it, every line its record. */
  go(link?: string | null): void { if (link) { this.router.navigateByUrl(link); } }
  open(x: any): void { if (x?._m) { this.router.navigateByUrl(recordUrl(x._m, x._id)); } }
  path(u: string): string { return (u || '').split('?')[0]; }
  query(u: string): Record<string, string> {
    const q: Record<string, string> = {};
    new URLSearchParams((u || '').split('?')[1] || '').forEach((v, k) => (q[k] = v));
    return q;
  }
  byCard = (_: number, c: any) => c.key;
  /** the column a figure adds up in its report (for checks and screen readers), none = it counts rows */
  sumOf(k: any): string | null { const s = k?.measure?.sum; return s ? (Array.isArray(s) ? s.join(',') : s) : null; }
  tip(c: any, k: any): string {
    if (!k.link) { return ''; }
    if (c.timed && k.timed === false) { return i18nT('Current figure – the period does not change it. Select to see the rows.'); }
    return i18nT('Show what makes up this figure');
  }

  private branches(): string {
    try { const b = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]'); return Array.isArray(b) && b.length ? `&branch=${b.join(',')}` : ''; } catch { return ''; }
  }

  private base(): string {
    return `${this.rec.api}/dashboard/api/overview/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${this.branches()}${this.hrOps ? '&me=0' : ''}`;
  }

  async ngOnInit(): Promise<void> {
    if (!this.waitForPeriods) { await this.load(); }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  /** v1.16.0: called by the dashboard with the designer's periods. */
  setPeriods(p: DashPeriods): void {
    const dashChanged = !this.dash || this.dash.from !== p.dash.from || this.dash.to !== p.dash.to;
    this.dash = p.dash;
    if (dashChanged || !this.data) { this.applied = {}; this.load(p); return; }
    this.cardsFor(p);
  }

  private async load(p?: DashPeriods): Promise<void> {
    const seq = ++this.seq;
    try {
      const d = await firstValueFrom(this.http.get<any>(this.base() + periodQuery(this.dash)));
      if (seq !== this.seq) { return; }
      this.data = d; this.me = d.me; this.error = '';
      (d.cards || []).forEach((c: any) => (this.applied[c.key] = `${this.dash?.from}|${this.dash?.to}`));
    } catch { this.error = i18nT('The module overview could not be loaded.'); }
    this.cd.detectChanges();
    if (p) { this.cardsFor(p); }
  }

  /** Reload the cards whose own period differs from what they show. */
  private cardsFor(p: DashPeriods): void {
    if (!this.data?.cards) { return; }
    for (const c of this.data.cards) {
      const own = p.cards['ov-' + c.key];
      const want = own || p.dash;
      const sig = `${want.from}|${want.to}`;
      if (this.applied[c.key] === sig) { continue; }
      this.applied[c.key] = sig;
      this.reloadCard(c.key, want);
    }
  }

  private async reloadCard(key: string, per: DashPeriod): Promise<void> {
    this.busy[key] = true; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.get<any>(`${this.base()}&card=${encodeURIComponent(key)}${periodQuery(per)}`));
      const fresh = (d.cards || []).find((x: any) => x.key === key);
      const i = (this.data.cards || []).findIndex((x: any) => x.key === key);
      if (fresh && i >= 0 && this.applied[key] === `${per.from}|${per.to}`) { this.data.cards[i] = fresh; }
    } catch { /* keep the figures shown */ }
    this.busy[key] = false; this.cd.detectChanges();
  }
}
