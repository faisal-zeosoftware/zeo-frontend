import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSET_BASE, AssetApiService, STATUS_CLASS, STATUS_LABEL, money } from './asset-api.service';
import { AssetFormComponent } from './asset-form.component';

/** Asset register (v1.12.0): every asset with code, status (incl. lost), holder, branch and book value; filters; new asset. */
@Component({
  selector: 'app-asset-register',
  standalone: true,
  imports: [CommonModule, FormsModule, AssetFormComponent],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Asset register</h1>
          <p class="ex-desc">Open an asset to allocate, transfer, repair, report damage or loss, dispose of it and see its full history.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" (click)="exportCsv()" [disabled]="!rows.length">Export CSV</button>
          <button type="button" class="ex-btn primary" *ngIf="rights.master_add" (click)="creating = true">+ New asset</button>
        </div>
      </div>
      <div class="ap-filters">
        <input type="search" [(ngModel)]="f.q" (ngModelChange)="reloadSoon()" placeholder="Search name, serial, code, holder…" aria-label="Search">
        <select [(ngModel)]="f.status" (ngModelChange)="load()" aria-label="Status"><option value="">All statuses</option>
          <option *ngFor="let s of statuses" [value]="s">{{ lbl(s) }}</option></select>
        <select [(ngModel)]="f.asset_type" (ngModelChange)="load()" aria-label="Type"><option value="">All types</option>
          <option *ngFor="let t of lk.types" [value]="t.id">{{ t.name }}</option></select>
        <select *ngIf="(lk.branches || []).length > 1" [(ngModel)]="f.branch" (ngModelChange)="load()" aria-label="Branch"><option value="">All branches</option>
          <option *ngFor="let b of lk.branches" [value]="b.id">{{ b.name }}</option></select>
        <select [(ngModel)]="f.employee" (ngModelChange)="load()" aria-label="Assigned to"><option value="">Anyone</option>
          <option *ngFor="let e of lk.employees" [value]="e.id">{{ e.name }}</option></select>
        <select [(ngModel)]="f.warranty_expiring" (ngModelChange)="load()" aria-label="Warranty"><option value="">Any warranty</option>
          <option value="30">Warranty ends ≤ 30 days</option><option value="90">Warranty ends ≤ 90 days</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <div class="ex-rows" *ngIf="!loading">
        <div class="ex-row click" *ngFor="let a of rows" (click)="open(a.id)">
          <div class="ex-thumb">{{ (a.asset_type_name || '?').slice(0, 3).toUpperCase() }}</div>
          <div class="main">
            <div class="t">{{ a.name }} <span class="ap-code">{{ a.code }}</span></div>
            <div class="s">{{ a.asset_type_name }} · SN {{ a.serial_number }}<span *ngIf="a.branch_name"> · {{ a.branch_name }}</span>
              <span *ngIf="a.holder"> · {{ a.holder.type === 'employee' ? 'With' : 'At' }} {{ a.holder.name }}</span>
              <span *ngIf="a.warranty_days_left !== null && a.warranty_days_left >= 0 && a.warranty_days_left <= 30"> · warranty ends in {{ a.warranty_days_left }} day(s)</span></div>
          </div>
          <div class="r">
            <div class="money" *ngIf="a.book_value !== undefined">{{ m(a.book_value, a.currency) }}</div>
            <span class="ex-tag" [ngClass]="cls(a.status)">{{ a.status_label }}</span>
            <span class="ex-flag warn" *ngIf="a.condition !== 'healthy'">{{ a.condition === 'minor_damage' ? 'Minor damage' : 'Major damage' }}</span>
          </div>
        </div>
        <p class="ex-muted" *ngIf="!rows.length">No assets match. Change the filters or add an asset.</p>
      </div>
    </div>
  </div>
</div>
<app-asset-form *ngIf="creating" (closed)="creating = false" (saved)="created($event)"></app-asset-form>`,
})
export class AssetRegisterComponent implements OnInit {
  rows: any[] = [];
  lk: any = { types: [], branches: [], employees: [], rights: {} };
  rights: any = {};
  f: any = { q: '', status: '', asset_type: '', branch: '', employee: '', warranty_expiring: '' };
  statuses = ['available', 'assigned', 'maintenance', 'lost', 'disposed'];
  loading = true;
  creating = false;
  msg = '';
  msgErr = false;
  private timer: any;

  constructor(private api: AssetApiService, private router: Router, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('status')) this.f.status = qp.get('status');
    if (qp.get('warranty')) this.f.warranty_expiring = qp.get('warranty');
    if (qp.get('new')) this.creating = true;
    try {
      this.lk = await this.api.lookups();
      this.rights = this.lk.rights || {};
    } catch { /* the list still loads */ }
    await this.load();
  }

  reloadSoon(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(), 300);
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.rows = await this.api.get('assets/', this.f);
      this.msg = '';
    } catch (e: any) {
      this.msg = AssetApiService.error(e, 'The assets could not be loaded.');
      this.msgErr = true;
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  created(a: any): void {
    this.creating = false;
    this.open(a.id);
  }

  open(id: number): void { this.router.navigate([ASSET_BASE, 'register', id]); }
  m(v: any, c?: string): string { return money(v, c || 'AED'); }
  lbl(s: string): string { return STATUS_LABEL[s] || s; }
  cls(s: string): string { return STATUS_CLASS[s] || ''; }

  exportCsv(): void {
    const cols = ['code', 'name', 'asset_type_name', 'serial_number', 'model', 'status_label', 'condition', 'branch_name', 'location', 'purchase_date',
      'purchase_cost', 'book_value', 'warranty_end', 'vendor'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.concat(['holder']).join(',')].concat(this.rows.map(r => cols.map(c => esc(r[c])).concat([esc(r.holder?.name)]).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = 'asset-register.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}
