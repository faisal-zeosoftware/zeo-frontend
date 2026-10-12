import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../hr-modules/dashboards/dashboard.service';

interface CalEvent {
  id: string; layer: string; title: string; start: string; end: string; allDay: boolean; color: string;
  employee: { id: number | null; name: string } | null; link: string | null; status?: string | null; tentative?: boolean;
}
interface Layer { key: string; label: string; color: string; count: number; on: boolean; }

const DAY = 86400000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const LS = 'zeo.ucal';

/**
 * Unified calendar (v1.12): leave, holidays, attendance, shifts, training, interviews, meetings / to-dos,
 * employee events, birthdays and company events in one place.  Month grid, week list and agenda;
 * phones open on the agenda.  GET /dashboard/api/calendar/?from&to&layers&scope
 */
@Component({
  selector: 'app-unified-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="uc">
    <header class="uc-h">
      <div>
        <h1>Calendar</h1>
        <p class="muted">{{ title }}<span *ngIf="data"> · {{ shown.length }} {{ shown.length === 1 ? 'item' : 'items' }}</span></p>
      </div>
      <div class="uc-tools">
        <div class="seg" role="group" aria-label="Whose calendar" *ngIf="scopes.length > 1">
          <button type="button" *ngFor="let s of scopes" [class.on]="scope === s" (click)="setScope(s)">{{ scopeLabel[s] }}</button>
        </div>
        <div class="seg" role="group" aria-label="View">
          <button type="button" [class.on]="view === 'month'" (click)="setView('month')">Month</button>
          <button type="button" [class.on]="view === 'week'" (click)="setView('week')">Week</button>
          <button type="button" [class.on]="view === 'agenda'" (click)="setView('agenda')">Agenda</button>
        </div>
        <div class="nav">
          <button type="button" class="ib" (click)="move(-1)" aria-label="Previous">‹</button>
          <button type="button" class="today-b" (click)="goToday()">Today</button>
          <button type="button" class="ib" (click)="move(1)" aria-label="Next">›</button>
        </div>
      </div>
    </header>

    <div class="chips" role="group" aria-label="What to show">
      <button type="button" *ngFor="let l of layers" class="chip" [class.off]="!l.on" (click)="toggle(l)" [attr.aria-pressed]="l.on">
        <i [style.background]="l.color"></i>{{ l.label }}<small *ngIf="l.on && data">{{ l.count }}</small>
      </button>
      <button type="button" class="chip link" (click)="allLayers()" *ngIf="offCount">Show all</button>
    </div>

    <p class="err" *ngIf="error">{{ error }}</p>

    <div [class.busy]="loading">
      <!-- month -->
      <section class="month" *ngIf="view === 'month'" aria-label="Month">
        <div class="wd" *ngFor="let w of weekdays">{{ w }}</div>
        <div *ngFor="let day of grid" class="cell" [class.out]="day.getMonth() !== cursor.getMonth()" [class.today]="isToday(day)" [class.wkend]="isWeekend(day)">
          <button type="button" class="dn" (click)="openDay(day)" [attr.aria-label]="'Show ' + (day | date:'EEEE d MMMM')">{{ day.getDate() }}</button>
          <button type="button" *ngFor="let e of dayEvents(day).slice(0, 3)" class="ev" [class.tent]="e.tentative" [style.--c]="e.color" (click)="open(e)" [title]="e.title">
            <span class="t" *ngIf="!e.allDay">{{ e.start | date:'HH:mm' }}</span>{{ e.title }}
          </button>
          <button type="button" class="more" *ngIf="dayEvents(day).length > 3" (click)="openDay(day)">+{{ dayEvents(day).length - 3 }} more</button>
        </div>
      </section>

      <!-- week -->
      <section class="week" *ngIf="view === 'week'" aria-label="Week">
        <div class="wcol" *ngFor="let day of weekDays" [class.today]="isToday(day)">
          <h3>{{ day | date:'EEE d' }}<small *ngIf="isToday(day)"> · today</small></h3>
          <p class="muted small" *ngIf="!dayEvents(day).length">Nothing planned.</p>
          <button type="button" *ngFor="let e of dayEvents(day)" class="row" [style.--c]="e.color" [class.tent]="e.tentative" (click)="open(e)">
            <span class="when">{{ e.allDay ? 'All day' : (e.start | date:'HH:mm') }}</span>
            <span class="what">{{ e.title }}<small>{{ layerLabel(e.layer) }}</small></span>
          </button>
        </div>
      </section>

      <!-- agenda -->
      <section class="agenda" *ngIf="view === 'agenda'" aria-label="Agenda">
        <p class="muted" *ngIf="data && !agenda.length">Nothing in this period for the layers you picked.</p>
        <div class="aday" *ngFor="let g of agenda" [class.today]="isToday(g.day)">
          <div class="adate"><b>{{ g.day | date:'d' }}</b><span>{{ g.day | date:'EEE' }}</span><small>{{ g.day | date:'MMM' }}</small></div>
          <div class="alist">
            <button type="button" *ngFor="let e of g.events" class="row" [style.--c]="e.color" [class.tent]="e.tentative" (click)="open(e)">
              <span class="when">{{ e.allDay ? (multi(e) ? 'until ' + (e.end | date:'d MMM') : 'All day') : (e.start | date:'HH:mm') + '–' + (e.end | date:'HH:mm') }}</span>
              <span class="what">{{ e.title }}<small>{{ layerLabel(e.layer) }}<span *ngIf="e.employee && scope !== 'me'"> · {{ e.employee.name }}</span></small></span>
              <span class="go" *ngIf="e.link" aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- detail for items without a page of their own -->
    <div class="pop" *ngIf="picked" role="dialog" aria-modal="true" [attr.aria-label]="picked.title" (click)="picked = null">
      <div class="pop-b" (click)="$event.stopPropagation()">
        <span class="pl" [style.background]="picked.color"></span>
        <p class="muted small">{{ layerLabel(picked.layer) }}</p>
        <h3>{{ picked.title }}</h3>
        <p>{{ picked.start | date:(picked.allDay ? 'EEEE d MMMM' : 'EEEE d MMMM, HH:mm') }}<span *ngIf="multi(picked)"> – {{ picked.end | date:'d MMMM' }}</span></p>
        <p class="muted" *ngIf="picked.employee">{{ picked.employee.name }}</p>
        <div class="pop-a">
          <button type="button" class="btn" *ngIf="picked.link" (click)="nav(picked.link)">Open</button>
          <button type="button" class="btn ghost" (click)="picked = null">Close</button>
        </div>
      </div>
    </div>
  </div>`,
  styles: [`
    :host { display: block; --ink: #1B1640; --muted: #6B7185; --line: #E3E5EE; --page: #F4F5FA; --p: #5B4FE0; --pw: #ECEAFD; }
    .uc { padding: 18px 22px 40px; background: var(--page); min-height: 100%; color: #262A3D; font-size: 14px; }
    .uc-h { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; color: var(--ink); }
    .muted { color: var(--muted); margin: 0; } .small { font-size: 12.5px; }
    .err { color: #A32626; background: #FBE7E7; padding: 10px 12px; border-radius: 8px; }
    .uc-tools { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .seg { display: inline-flex; background: #fff; border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
    .seg button { border: 0; background: transparent; padding: 6px 14px; border-radius: 999px; color: var(--muted); cursor: pointer; font: inherit; font-size: 13px; }
    .seg button.on { background: var(--p); color: #fff; }
    .nav { display: inline-flex; gap: 4px; }
    .ib, .today-b { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 5px 11px; cursor: pointer; font: inherit; color: var(--ink); }
    .ib { font-size: 18px; line-height: 1; padding: 4px 12px 6px; }
    button:focus-visible { outline: 2px solid var(--p); outline-offset: 2px; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 5px 11px; cursor: pointer; font: inherit; font-size: 12.5px; color: #262A3D; }
    .chip i { width: 9px; height: 9px; border-radius: 50%; }
    .chip small { color: var(--muted); }
    .chip.off { color: var(--muted); background: transparent; } .chip.off i { background: transparent !important; border: 1.5px solid #B9BCCB; }
    .chip.link { border: 0; color: var(--p); background: transparent; }
    .busy { opacity: .55; transition: opacity .15s; }
    /* month */
    .month { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); background: var(--line); gap: 1px; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
    .wd { background: #FAFAFE; padding: 6px 8px; font-size: 12px; color: var(--muted); }
    .cell { background: #fff; min-height: 112px; padding: 4px 4px 6px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .cell.out { background: #FBFBFD; } .cell.out .dn { color: #B0B3C2; }
    .cell.wkend { background: #FCFCFE; }
    .cell.today .dn { background: var(--p); color: #fff; }
    .dn { align-self: flex-start; border: 0; background: transparent; width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font: inherit; font-size: 12.5px; color: var(--ink); }
    .ev { display: block; width: 100%; text-align: left; border: 0; border-left: 3px solid var(--c); background: color-mix(in srgb, var(--c) 10%, #fff); color: #262A3D;
          border-radius: 4px; padding: 2px 5px; font: inherit; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
    .ev:hover { background: color-mix(in srgb, var(--c) 18%, #fff); }
    .ev .t { color: var(--muted); margin-right: 4px; }
    .tent { border-left-style: dashed !important; }
    .more { border: 0; background: transparent; color: var(--p); font: inherit; font-size: 11.5px; text-align: left; cursor: pointer; padding: 0 5px; }
    /* week */
    .week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .wcol { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .wcol.today { border-color: var(--p); }
    .wcol h3 { margin: 0 0 4px; font-size: 13px; font-weight: 500; color: var(--ink); }
    .row { display: flex; gap: 8px; width: 100%; text-align: left; border: 0; border-left: 3px solid var(--c); background: #FAFAFE; border-radius: 6px; padding: 6px 8px;
           cursor: pointer; font: inherit; color: #262A3D; align-items: baseline; }
    .row:hover { background: color-mix(in srgb, var(--c) 10%, #fff); }
    .when { font-size: 11.5px; color: var(--muted); white-space: nowrap; min-width: 56px; }
    .what { display: flex; flex-direction: column; min-width: 0; font-size: 13px; flex: 1; }
    .what small { color: var(--muted); font-size: 11.5px; }
    .week .row { flex-direction: column; gap: 0; } .week .when { min-width: 0; }
    .go { color: var(--muted); font-size: 18px; line-height: 1; }
    /* agenda */
    .agenda { display: flex; flex-direction: column; gap: 8px; max-width: 860px; }
    .aday { display: grid; grid-template-columns: 64px 1fr; gap: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; }
    .aday.today { border-color: var(--p); }
    .adate { display: flex; flex-direction: column; align-items: center; color: var(--muted); font-size: 12px; }
    .adate b { font-size: 22px; font-weight: 500; color: var(--ink); line-height: 1.1; }
    .aday.today .adate b { color: var(--p); }
    .alist { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    /* popup */
    .pop { position: fixed; inset: 0; background: rgba(27, 22, 64, .28); display: grid; place-items: center; z-index: 1000; padding: 16px; }
    .pop-b { position: relative; background: #fff; border-radius: 14px; padding: 18px 20px 16px; width: min(420px, 100%); box-shadow: 0 12px 40px rgba(27,22,64,.25); overflow: hidden; }
    .pop-b h3 { margin: 2px 0 6px; font-size: 17px; font-weight: 500; color: var(--ink); }
    .pop-b p { margin: 0 0 4px; }
    .pl { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .pop-a { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
    .btn { border: 1px solid var(--p); background: var(--p); color: #fff; border-radius: 8px; padding: 6px 14px; cursor: pointer; font: inherit; }
    .btn.ghost { background: #fff; color: var(--p); }
    @media (max-width: 900px) { .week { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 760px) {
      .uc { padding: 12px 16px 32px; }
      .cell { min-height: 64px; } .ev { font-size: 0; height: 6px; padding: 0; border-left-width: 0; background: var(--c); border-radius: 3px; }
      .ev .t { display: none; } .more { font-size: 10.5px; padding: 0; }
      .wd { padding: 4px; text-align: center; }
      .aday { grid-template-columns: 48px 1fr; gap: 8px; padding: 8px 10px; }
    }
  `],
})
export class UnifiedCalendarComponent implements OnInit {
  view: 'month' | 'week' | 'agenda' = 'month';
  cursor = new Date();
  scope = '';
  scopes: string[] = ['me'];
  layers: Layer[] = [];
  data: any = null;
  events: CalEvent[] = [];
  error = '';
  loading = false;
  picked: CalEvent | null = null;
  readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly scopeLabel: Record<string, string> = { me: 'Me', team: 'My team', company: 'Company' };
  private off = new Set<string>();
  private byDay = new Map<string, CalEvent[]>();
  private seq = 0;

  constructor(private svc: DashboardService, private router: Router) {}

  ngOnInit(): void {
    try {
      const s = JSON.parse(localStorage.getItem(LS) || '{}');
      if (Array.isArray(s.off)) { this.off = new Set(s.off); }
      if (s.view) { this.view = s.view; }
      if (s.scope) { this.scope = s.scope; }
    } catch { /* storage off */ }
    if (window.innerWidth < 760) { this.view = 'agenda'; }
    this.load();
  }

  @HostListener('document:keydown.escape') esc(): void { this.picked = null; }

  private save(): void {
    try { localStorage.setItem(LS, JSON.stringify({ off: [...this.off], view: this.view, scope: this.scope })); } catch { /* storage off */ }
  }

  // ------------------------------------------------------------------ range
  get range(): [Date, Date] {
    if (this.view === 'week') { const a = mondayOf(this.cursor); return [a, addDays(a, 6)]; }
    if (this.view === 'agenda') { const a = new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1); return [a, new Date(a.getFullYear(), a.getMonth() + 1, 0)]; }
    const first = new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1);
    const a = mondayOf(first);
    return [a, addDays(a, 41)];
  }

  get title(): string {
    const [a, b] = this.range;
    if (this.view === 'week') { return `${a.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`; }
    return this.cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  get grid(): Date[] { const [a] = this.range; return Array.from({ length: 42 }, (_, i) => addDays(a, i)); }
  get weekDays(): Date[] { const [a] = this.range; return Array.from({ length: 7 }, (_, i) => addDays(a, i)); }

  load(): void {
    const [a, b] = this.range;
    const on = this.layers.length ? this.layers.filter(l => l.on).map(l => l.key) : null;
    const params: any = { from: iso(a), to: iso(b), scope: this.scope || undefined };
    if (on) { params.layers = on.join(',') || 'none'; }
    else if (this.off.size) { params.layers = ['leave', 'holiday', 'attendance', 'shift', 'training', 'interview', 'meeting', 'events', 'birthday', 'company'].filter(k => !this.off.has(k)).join(',') || 'none'; }
    const seq = ++this.seq;
    this.loading = true;
    this.svc.calendar(params).subscribe({
      next: d => {
        if (seq !== this.seq) { return; }
        this.data = d; this.loading = false; this.error = '';
        this.scope = d.scope; this.scopes = d.scopes || ['me'];
        this.layers = (d.layers || []).map((l: Layer) => ({ ...l, on: !this.off.has(l.key) }));
        this.events = d.events || [];
        this.index();
      },
      error: e => { if (seq === this.seq) { this.loading = false; this.error = e?.error?.detail || 'The calendar could not be loaded.'; } },
    });
  }

  /** events per day (multi-day items on every day they cover) */
  private index(): void {
    this.byDay.clear();
    for (const e of this.events) {
      let d = parse(e.start);
      const end = parse(e.end || e.start);
      for (let i = 0; d <= end && i < 120; i++, d = addDays(d, 1)) {
        const k = iso(d);
        if (!this.byDay.has(k)) { this.byDay.set(k, []); }
        this.byDay.get(k)!.push(e);
      }
    }
  }

  get shown(): CalEvent[] { return this.events; }
  get offCount(): number { return this.layers.filter(l => !l.on).length; }

  dayEvents(d: Date): CalEvent[] { return this.byDay.get(iso(d)) || []; }

  get agenda(): { day: Date; events: CalEvent[] }[] {
    const [a, b] = this.range;
    const out: { day: Date; events: CalEvent[] }[] = [];
    for (let d = a; d <= b; d = addDays(d, 1)) {
      const ev = this.dayEvents(d).filter(e => !this.multi(e) || iso(parse(e.start)) === iso(d) || d.getTime() === a.getTime());
      if (ev.length) { out.push({ day: d, events: ev }); }
    }
    return out;
  }

  multi(e: CalEvent): boolean { return !!e.end && e.end.slice(0, 10) !== e.start.slice(0, 10) && e.allDay; }
  isToday(d: Date): boolean { return iso(d) === iso(new Date()); }
  isWeekend(d: Date): boolean { return d.getDay() === 0 || d.getDay() === 6; }
  layerLabel(k: string): string { return this.layers.find(l => l.key === k)?.label || k; }

  // ------------------------------------------------------------------ actions
  setView(v: 'month' | 'week' | 'agenda'): void { this.view = v; this.save(); this.load(); }
  setScope(s: string): void { this.scope = s; this.save(); this.load(); }

  move(n: number): void {
    const c = this.cursor;
    this.cursor = this.view === 'week' ? addDays(c, 7 * n) : new Date(c.getFullYear(), c.getMonth() + n, 1);
    this.load();
  }

  goToday(): void { this.cursor = new Date(); this.load(); }

  openDay(d: Date): void { this.cursor = d; this.view = 'week'; this.load(); }

  toggle(l: Layer): void {
    l.on = !l.on;
    l.on ? this.off.delete(l.key) : this.off.add(l.key);
    this.save();
    this.load();
  }

  allLayers(): void { this.off.clear(); this.layers.forEach(l => (l.on = true)); this.save(); this.load(); }

  open(e: CalEvent): void {
    if (e.link) { this.nav(e.link); return; }
    this.picked = e;
  }

  nav(link: string): void { this.picked = null; this.router.navigateByUrl(link); }
}
