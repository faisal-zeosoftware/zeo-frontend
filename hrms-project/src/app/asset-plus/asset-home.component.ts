import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ASSET_BASE, AssetApiService, EVENT_ICON, STATUS_LABEL, money } from './asset-api.service';

/** Assets home (v1.12.0): register totals, what waits for action and the latest asset activity. */
@Component({
  selector: 'app-asset-home',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Assets</h1>
          <p class="ex-desc">Register company assets, give them to employees or locations, and follow every transfer, repair, damage, loss and disposal until the employee leaves.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn primary" (click)="go('register', { new: 1 })">+ New asset</button>
          <button type="button" class="ex-btn" (click)="go('register')">Open the register</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <ng-container *ngIf="d">
        <div class="ex-tiles">
          <button type="button" class="ex-tile" (click)="go('register')">
            <div class="lbl">Assets</div><div class="num">{{ d.total }}</div><div class="amt">Book value {{ m(d.book_value) }}</div></button>
          <button type="button" class="ex-tile t3" (click)="go('register', { status: 'assigned' })">
            <div class="lbl">With employees / locations</div><div class="num">{{ d.by_status.assigned || 0 }}</div><div class="amt">{{ d.by_status.available || 0 }} available in the store</div></button>
          <button type="button" class="ex-tile t2" (click)="go('maintenance')">
            <div class="lbl">Maintenance</div><div class="num">{{ d.by_status.maintenance || 0 }}</div><div class="amt">{{ d.maintenance_due }} plan(s) due</div></button>
          <button type="button" class="ex-tile t4" (click)="go('register', { warranty: 30 })">
            <div class="lbl">Warranty ends in 30 days</div><div class="num">{{ d.warranty_30 }}</div><div class="amt">{{ d.by_status.lost || 0 }} lost · {{ d.by_status.disposed || 0 }} disposed</div></button>
        </div>
        <div class="ex-grid2">
          <div class="ex-panel">
            <div class="ex-h">Waiting for action</div>
            <div class="ex-rows">
              <div class="ex-row click" *ngFor="let p of pend" (click)="go(p.page, p.q)">
                <div class="ex-thumb"><mat-icon>{{ p.icon }}</mat-icon></div>
                <div class="main"><div class="t">{{ p.label }}</div><div class="s">{{ p.hint }}</div></div>
                <div class="r"><span class="ex-tag" [class.pending]="p.n > 0">{{ p.n }}</span></div>
              </div>
            </div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">Assets by type</div>
            <div class="ex-bar" *ngFor="let t of types">
              <div class="top"><span>{{ t.name }}</span><span>{{ t.n }}</span></div>
              <div class="track"><div class="fill" [style.width.%]="t.pct"></div></div>
            </div>
            <p class="ex-muted" *ngIf="!types.length">No assets yet.</p>
          </div>
        </div>
        <div class="ex-panel" style="margin-top:16px">
          <div class="ex-h">Latest activity</div>
          <div class="ap-ev" *ngFor="let e of events">
            <mat-icon>{{ icon(e.event) }}</mat-icon>
            <div class="txt"><a class="ex-link" (click)="open(e.asset_id)">{{ e.asset }}</a> – {{ e.summary }}
              <div class="meta">{{ e.at | date:'dd MMM yyyy, HH:mm' }} · {{ e.user }}</div></div>
          </div>
          <p class="ex-muted" *ngIf="!events.length">Nothing has happened yet.</p>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class AssetHomeComponent implements OnInit {
  d: any = null;
  events: any[] = [];
  pend: any[] = [];
  types: { name: string; n: number; pct: number }[] = [];
  loading = true;
  msg = '';

  constructor(private api: AssetApiService, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const [d, ev] = await Promise.all([this.api.get('assets/summary/'), this.api.get('events/', { limit: 15 })]);
      this.d = d;
      this.events = ev;
      const p = d.pending;
      this.pend = [
        { label: 'Transfers to approve', n: p.transfers, icon: 'swap_horiz', page: 'transfers', q: { status: 'pending' }, hint: 'Hand-overs between employees and locations' },
        { label: 'Returns to receive', n: p.returns, icon: 'keyboard_return', page: 'returns', q: { status: 'requested' }, hint: 'Employees asked to give an asset back' },
        { label: 'Damage reports', n: p.damages, icon: 'report_problem', page: 'damages', q: { status: 'reported' }, hint: 'Decide responsibility and recovery' },
        { label: 'Lost / stolen reports', n: p.losses, icon: 'location_off', page: 'losses', q: { status: 'reported' }, hint: 'Investigation and recovery' },
        { label: 'Disposals to approve', n: p.disposals, icon: 'delete_sweep', page: 'disposals', q: { status: 'pending' }, hint: 'Sale, scrap, donation or write-off' },
        { label: 'Assets in maintenance', n: p.maintenance_open, icon: 'build', page: 'maintenance', q: { status: 'open' }, hint: 'Complete the record when the asset is back' },
        { label: 'Receipts not confirmed', n: p.acknowledgements, icon: 'verified', page: 'allocations', q: { ack: 'pending' }, hint: 'Employees still have to confirm they received the asset' },
      ];
      const total = Object.values(d.by_type as Record<string, number>).reduce((a, b) => a + b, 0) || 1;
      this.types = Object.entries(d.by_type as Record<string, number>).map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }))
        .sort((a, b) => b.n - a.n);
    } catch (e: any) {
      this.msg = AssetApiService.error(e, 'The asset summary could not be loaded.');
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  go(page: string, q: any = {}): void { this.router.navigate([ASSET_BASE, page], { queryParams: q }); }
  open(id: number): void { this.router.navigate([ASSET_BASE, 'register', id]); }
  icon(e: string): string { return EVENT_ICON[e] || 'history'; }
  m(v: any): string { return money(v); }
  lbl(s: string): string { return STATUS_LABEL[s] || s; }
}
