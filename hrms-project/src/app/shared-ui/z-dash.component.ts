import { ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';

/**
 * Dashboard designer: every block marked [data-widget] (with data-widget-title) can be hidden or shown
 * by the user, from the dashboard itself. The choice is saved per user (and per dashboard).
 */
@Component({
  selector: 'z-dash-designer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zdd" [class.on]="editing">
    <ng-container *ngIf="!editing">
      <span class="zdd-hint" *ngIf="hidden.length">{{ hidden.length }} card{{ hidden.length > 1 ? 's' : '' }} hidden</span>
      <button type="button" class="zr-btn sm" (click)="start()"><mat-icon>dashboard_customize</mat-icon>Customize</button>
    </ng-container>
    <ng-container *ngIf="editing">
      <mat-icon class="zdd-ic">dashboard_customize</mat-icon>
      <span class="zdd-txt"><b>Customize your dashboard.</b> Hide the cards you do not need; show them again here.</span>
      <span class="zr-grow"></span>
      <span class="zdd-tray" *ngIf="hidden.length">
        <button type="button" class="zr-chip" *ngFor="let h of tray; trackBy: byKey" (click)="show(h.key)" [title]="'Show ' + h.title"><mat-icon>visibility</mat-icon>{{ h.title }}</button>
      </span>
      <button type="button" class="zr-link" *ngIf="hidden.length" (click)="reset()">Show all</button>
      <button type="button" class="zr-btn primary sm" (click)="done()">Done</button>
    </ng-container>
  </div>`,
})
export class ZDashDesignerComponent implements OnInit, OnDestroy {
  @Input() name = 'main';
  /** CSS selector of the dashboard element (defaults to the parent of this bar). */
  @Input() scope = '';
  editing = false;
  hidden: string[] = [];
  private titles = new Map<string, string>();
  private obs?: MutationObserver;
  private timer: any;

  constructor(private rec: ZRecordService, private el: ElementRef<HTMLElement>, private zone: NgZone, private cd: ChangeDetectorRef) {}

  private get root(): HTMLElement {
    return (this.scope && document.querySelector(this.scope) as HTMLElement) || this.el.nativeElement.parentElement || document.body;
  }

  async ngOnInit(): Promise<void> {
    try { this.hidden = JSON.parse(localStorage.getItem('zdd:' + this.name) || '[]'); } catch { this.hidden = []; }
    this.apply();
    this.watch();
    try { const r = await firstValueFrom(this.rec.layout('dashboard', this.name)); if (Array.isArray(r?.hidden)) { this.hidden = r.hidden; this.apply(); } } catch { /* offline */ }
  }

  /** Re-apply when the dashboard adds or removes cards (data loaded later); only [data-widget] changes count. */
  private watch(): void {
    if (this.obs) { return; }
    this.zone.runOutsideAngular(() => {
      const isWidget = (n: Node) => n.nodeType === 1 && ((n as HTMLElement).matches?.('[data-widget]') || !!(n as HTMLElement).querySelector?.('[data-widget]'));
      this.obs = new MutationObserver(recs => {
        if (!recs.some(r => Array.from(r.addedNodes).some(isWidget) || Array.from(r.removedNodes).some(isWidget))) { return; }
        clearTimeout(this.timer); this.timer = setTimeout(() => this.apply(false), 150);
      });
      this.obs.observe(this.root, { childList: true, subtree: true });
    });
  }

  private unwatch(): void { this.obs?.disconnect(); this.obs = undefined; clearTimeout(this.timer); }

  ngOnDestroy(): void { this.obs?.disconnect(); clearTimeout(this.timer); }

  private widgets(): HTMLElement[] { return Array.from(this.root.querySelectorAll('[data-widget]')) as HTMLElement[]; }

  apply(check = true): void {
    for (const w of this.widgets()) {
      const key = w.dataset['widget']!;
      this.titles.set(key, w.dataset['widgetTitle'] || key);
      const off = this.hidden.includes(key);
      w.classList.toggle('zdd-off', off && !this.editing);
      w.classList.toggle('zdd-dim', off && this.editing);
      w.classList.toggle('zdd-edit', this.editing);
      let btn = w.querySelector(':scope > .zdd-x') as HTMLButtonElement | null;
      if (this.editing && !btn) {
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'zdd-x';
        btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); this.zone.run(() => this.flip(key)); });
        w.prepend(btn);
      }
      if (btn) {
        if (!this.editing) { btn.remove(); continue; }
        const label = off ? 'Show' : 'Hide';
        if (btn.textContent !== label) { btn.textContent = label; }
        btn.setAttribute('aria-label', label + ' ' + (w.dataset['widgetTitle'] || key));
        btn.classList.toggle('show', off);
      }
    }
    const next = this.hidden.map(k => ({ key: k, title: this.titles.get(k) || k }));
    if (next.map(h => h.key + h.title).join('|') !== this.tray.map(h => h.key + h.title).join('|')) { this.tray = next; }
    if (check) { this.cd.markForCheck(); }
  }

  /** Chips of the hidden cards; rebuilt only in apply(), so change detection never re-creates them (that looped with page observers). */
  tray: { key: string; title: string }[] = [];
  byKey = (_: number, h: { key: string }) => h.key;
  start(): void { this.unwatch(); this.editing = true; this.apply(); }
  done(): void { this.editing = false; this.apply(); this.save(); this.watch(); }
  flip(key: string): void { this.hidden.includes(key) ? this.show(key) : (this.hidden = [...this.hidden, key], this.apply(), this.save()); }
  show(key: string): void { this.hidden = this.hidden.filter(k => k !== key); this.apply(); this.save(); }
  reset(): void { this.hidden = []; this.apply(); this.save(); }

  private save(): void {
    try { localStorage.setItem('zdd:' + this.name, JSON.stringify(this.hidden)); } catch { /* storage off */ }
    this.rec.saveLayout('dashboard', this.name, { hidden: this.hidden, order: [] }).subscribe({ error: () => { /* offline */ } });
  }
}

/** Main dashboard (v1.7.0): "My space" for the logged-in employee and one card per module the user may see. */
@Component({
  selector: 'z-dash-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  template: `
  <section class="zdo" *ngIf="data">
    <!-- my space -->
    <ng-container *ngIf="me?.employee">
      <h2 class="zdo-h">My space</h2>
      <div class="zdo-grid">
        <article class="zdo-card" data-widget="me-leave" data-widget-title="My leave">
          <header><mat-icon>event_available</mat-icon><h3>My leave</h3><a class="zr-link" routerLink="/main-sidebar/leave-options/leave-request">Requests</a></header>
          <p class="zr-muted" *ngIf="!me.leave_balances?.length">No leave balance yet.</p>
          <div class="zdo-row" *ngFor="let b of me.leave_balances?.slice(0, 4)"><span>{{ b.name }}</span><b>{{ b.balance | number:'1.0-1' }} <small>days</small></b></div>
          <p class="zdo-note" *ngIf="me.next_leave">Next: {{ me.next_leave.type }} from {{ me.next_leave.from | date:'d MMM' }} ({{ me.next_leave.status }})</p>
        </article>
        <article class="zdo-card" data-widget="me-assets" data-widget-title="My assets">
          <header><mat-icon>inventory_2</mat-icon><h3>My assets</h3><span class="zdo-n">{{ me.assets?.length || 0 }}</span></header>
          <p class="zr-muted" *ngIf="!me.assets?.length">No company assets with you.</p>
          <div class="zdo-row" *ngFor="let a of me.assets?.slice(0, 5)"><span>{{ a.name }}<small *ngIf="a.serial"> · {{ a.serial }}</small></span><b><small>since {{ a.since | date:'d MMM y' }}</small></b></div>
        </article>
        <article class="zdo-card" data-widget="me-pay" data-widget-title="My pay">
          <header><mat-icon>payments</mat-icon><h3>My pay</h3></header>
          <ng-container *ngIf="me.payslip; else noPay">
            <p class="zr-muted">{{ me.payslip.period }}</p>
            <p class="zdo-big">AED {{ me.payslip.net | number:'1.0-0' }} <small>net</small></p>
          </ng-container>
          <ng-template #noPay><p class="zr-muted">No payslip yet.</p></ng-template>
          <div class="zdo-row" *ngIf="me.loans?.count"><span>Loan balance</span><b>AED {{ me.loans.outstanding | number:'1.0-0' }}</b></div>
          <div class="zdo-row" *ngIf="me.air_ticket"><span>Air ticket left</span><b>AED {{ me.air_ticket.remaining | number:'1.0-0' }}</b></div>
        </article>
        <article class="zdo-card" data-widget="me-docs" data-widget-title="My documents">
          <header><mat-icon>description</mat-icon><h3>My documents</h3></header>
          <p class="zr-muted" *ngIf="!me.documents?.length">No documents with an expiry date.</p>
          <div class="zdo-row" *ngFor="let d of me.documents?.slice(0, 4)"><span>{{ d.type }}</span>
            <b [class]="'zdo-pill ' + d.state">{{ d.state === 'expired' ? 'Expired' : d.state === 'expiring' ? d.days + ' days' : (d.expiry | date:'MMM y') }}</b></div>
        </article>
        <article class="zdo-card" data-widget="me-requests" data-widget-title="My requests">
          <header><mat-icon>assignment</mat-icon><h3>My requests</h3></header>
          <p class="zr-muted" *ngIf="!me.requests?.recent?.length">No requests yet.</p>
          <div class="zdo-row" *ngFor="let r of me.requests?.recent?.slice(0, 4)"><span>{{ r.module_label }}<small> · {{ r.summary || r.document_number }}</small></span><b [class]="'zdo-pill ' + r.status_key">{{ r.status }}</b></div>
        </article>
      </div>
    </ng-container>

    <!-- company -->
    <ng-container *ngIf="data.cards?.length">
      <h2 class="zdo-h">Company at a glance</h2>
      <div class="zdo-grid">
        <article class="zdo-card" *ngFor="let c of data.cards" [attr.data-widget]="'ov-' + c.key" [attr.data-widget-title]="c.title">
          <header><mat-icon>{{ c.icon }}</mat-icon><h3>{{ c.title }}</h3><a class="zr-link" [routerLink]="c.route">Open</a></header>
          <div class="zdo-kpis">
            <div *ngFor="let k of c.kpis" [class]="'zdo-kpi ' + (k.tone && k.value ? k.tone : '') + (k.money ? ' wide' : '')">
              <b>{{ k.money ? ('AED ' + (k.value | number:'1.0-0')) : (k.value | number:'1.0-0') }}</b><span>{{ k.label }}{{ k.suffix ? ' ' + k.suffix : '' }}</span></div>
          </div>
          <ng-container *ngIf="c.items?.length">
            <div class="zdo-sub">{{ c.note }}</div>
            <div class="zdo-row" *ngFor="let i of c.items"><span>{{ i.label }}</span><b>{{ i.value }}</b></div>
          </ng-container>
        </article>
      </div>
    </ng-container>
  </section>
  <p class="zr-muted" *ngIf="error">{{ error }}</p>`,
})
export class ZDashOverviewComponent implements OnInit {
  data: any = null; me: any = null; error = '';
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    const s = localStorage.getItem('selectedSchema') || '';
    try {
      this.data = await firstValueFrom(this.http.get<any>(`${this.rec.api}/dashboard/api/overview/?schema=${s}`));
      this.me = this.data.me;
    } catch { this.error = 'The module overview could not be loaded.'; }
    this.cd.detectChanges();
  }
}
