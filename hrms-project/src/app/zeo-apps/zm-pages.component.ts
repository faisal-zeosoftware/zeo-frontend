import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ZaApiService, ZaClient, base } from './za-api.service';

/** v1.44.0 – Masters pages for accounting: statement of account of a business partner, stock valuation of the item master. */
const APP = 'zeo-masters';

function iso(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

@Component({
  selector: 'app-zm-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section zm-print">
  <div class="header_section"><div class="ex-head">
    <div><h1 class="page-title"><button type="button" class="ex-btn sm no-print" (click)="back()" aria-label="Back">‹</button>
      Statement of account <span class="hs-code" *ngIf="st">{{ st.partner.number }}</span> {{ st?.partner?.name }}</h1>
      <p class="ex-desc" *ngIf="st">{{ st.partner.tax_id ? 'Tax no. ' + st.partner.tax_id + ' · ' : '' }}{{ st.partner.address }} {{ st.partner.city }} {{ st.partner.country }}
        <span *ngIf="st.partner.people"> · includes {{ st.partner.people }} people / addresses of the company</span></p></div>
    <div class="ex-actions no-print">
      <button type="button" class="ex-btn" (click)="csv()">Download CSV</button>
      <button type="button" class="ex-btn" (click)="print()">Print / PDF</button>
      <button type="button" class="ex-btn" (click)="partner()">Business partner</button>
    </div>
  </div></div>
  <div class="com_list mt-3 no-print">
    <div class="zm-filters">
      <label>From <input type="date" [(ngModel)]="from" (change)="load()"></label>
      <label>To <input type="date" [(ngModel)]="to" (change)="load()"></label>
      <label>Show <select [(ngModel)]="side" (change)="load()"><option value="all">Receivable and payable</option><option value="receivable">Receivable (what they owe)</option><option value="payable">Payable (what we owe)</option></select></label>
    </div>
  </div>
  <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
  <ng-container *ngIf="st">
    <div class="zm-cards mt-3">
      <div class="zm-card"><span>Receivable</span><b>{{ money(st.balances.receivable) }}</b></div>
      <div class="zm-card"><span>Payable</span><b>{{ money(st.balances.payable) }}</b></div>
      <div class="zm-card" [class.bad]="st.balances.overdue > 0"><span>Overdue</span><b>{{ money(st.balances.overdue) }}</b></div>
      <div class="zm-card" *ngIf="st.balances.open_orders"><span>Open sales orders</span><b>{{ money(st.balances.open_orders) }}</b></div>
      <div class="zm-card" *ngIf="st.balances.credit_limit !== null && st.balances.credit_limit !== undefined" [class.bad]="st.balances.available < 0">
        <span>Credit limit / available</span><b>{{ money(st.balances.credit_limit) }} / {{ money(st.balances.available) }}</b></div>
      <div class="zm-card bad" *ngIf="st.balances.credit_hold"><span>Credit</span><b>On hold</b></div>
    </div>
    <div class="com_list mt-3">
      <h3 class="zmst-h">Ageing of open invoices</h3>
      <table class="hs-table zm-age"><tr><th>Not due</th><th>1–30 days</th><th>31–60</th><th>61–90</th><th>Over 90</th><th>Overdue</th></tr>
        <tr><td>{{ money(st.balances.ageing.current) }}</td><td>{{ money(st.balances.ageing['1_30']) }}</td><td>{{ money(st.balances.ageing['31_60']) }}</td>
          <td>{{ money(st.balances.ageing['61_90']) }}</td><td>{{ money(st.balances.ageing.over_90) }}</td><td><b>{{ money(st.balances.ageing.overdue) }}</b></td></tr></table>
    </div>
    <div class="com_list mt-3">
      <div class="hs-scroll"><table class="hs-table">
        <tr><th>Date</th><th>App</th><th>Document</th><th>Description</th><th>Due</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr>
        <tr class="zm-sub"><td>{{ st.from || '' }}</td><td></td><td></td><td>Opening balance</td><td></td><td></td><td></td><td class="r">{{ money(st.opening) }}</td></tr>
        <tr *ngFor="let l of st.lines" [class.zm-over]="l.open > 0 && l.due && l.due < today">
          <td>{{ l.date }}</td><td>{{ l.app }}</td>
          <td><a *ngIf="l.url; else plain" href="javascript:void(0)" (click)="open(l)">{{ l.doc }}</a><ng-template #plain>{{ l.doc }}</ng-template></td>
          <td>{{ l.text }}<small *ngIf="l.side === 'payable'"> (payable)</small></td><td>{{ l.due || '' }}</td>
          <td class="r">{{ l.debit > 0 ? money(l.debit) : '' }}</td><td class="r">{{ l.credit > 0 ? money(l.credit) : '' }}</td><td class="r">{{ money(l.balance) }}</td></tr>
        <tr *ngIf="!st.lines.length"><td colspan="8" class="hs-note">No invoices, receipts or bills in this period.</td></tr>
        <tr class="zm-sub"><td>{{ st.to || '' }}</td><td></td><td></td><td>Closing balance</td><td></td><td class="r">{{ money(st.debit) }}</td><td class="r">{{ money(st.credit) }}</td><td class="r"><b>{{ money(st.closing) }}</b></td></tr>
      </table></div>
      <p class="hs-note">Balance: + the partner owes us, − we owe the partner. From the invoices, receipts and bills of the apps (Property, Projects).</p>
    </div>
  </ng-container>
</div></div>`,
})
export class ZmStatementComponent implements OnInit {
  api!: ZaClient;
  id = 0;
  st: any = null;
  msg = '';
  from = '';
  to = '';
  side = 'all';
  today = iso(new Date());
  constructor(private za: ZaApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void {
    this.api = this.za.for(APP);
    const t = new Date();
    this.from = iso(new Date(t.getFullYear() - 1, t.getMonth(), 1));
    this.to = iso(t);
    this.route.paramMap.subscribe(p => { this.id = +(p.get('id') || 0); this.load(); });
  }
  async load(): Promise<void> {
    this.msg = '';
    try { this.st = await this.api.get(`partners/${this.id}/statement/`, { from: this.from, to: this.to, side: this.side }); }
    catch (e) { this.msg = ZaApiService.error(e); this.st = null; }
  }
  money(v: any): string { const n = Number(v || 0); return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  csv(): void { this.api.file(`partners/${this.id}/statement/`, `statement-${this.st?.partner?.number || this.id}.csv`, { from: this.from, to: this.to, side: this.side, export: 'csv' }); }
  print(): void { window.print(); }
  open(l: any): void { this.router.navigateByUrl(l.url); }
  partner(): void { this.router.navigate([base(APP), 'r', 'partner', this.id]); }
  back(): void { history.length > 1 ? history.back() : this.partner(); }
}

@Component({
  selector: 'app-zm-valuation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<div class="container"><div class="comapny_section zm-print">
  <div class="header_section"><div class="ex-head">
    <div><h1 class="page-title">Stock valuation</h1>
      <p class="ex-desc">Stock in the stores of the apps (Asset Management spare parts and consumables) valued by each item's method: weighted average, FIFO (the latest receipts) or standard cost.</p></div>
    <div class="ex-actions no-print">
      <button type="button" class="ex-btn" (click)="load()">Refresh</button>
      <button type="button" class="ex-btn" (click)="csv()">Download CSV</button>
      <button type="button" class="ex-btn" (click)="print()">Print / PDF</button>
    </div>
  </div></div>
  <p class="hs-note err" *ngIf="msg">{{ msg }}</p>
  <ng-container *ngIf="v">
    <div class="zm-cards mt-3">
      <div class="zm-card"><span>Stock value</span><b>{{ money(v.total) }}</b></div>
      <div class="zm-card"><span>Items in stock</span><b>{{ v.rows.length }}</b></div>
      <div class="zm-card" *ngFor="let a of v.by_account"><span>Account {{ a.account }}</span><b>{{ money(a.value) }}</b></div>
    </div>
    <div class="com_list mt-3"><div class="hs-scroll"><table class="hs-table">
      <tr><th>Item</th><th>Name</th><th>Kind</th><th>Category</th><th>Method</th><th class="r">Quantity</th><th class="r">Unit cost</th><th class="r">Value</th><th>Stock account</th></tr>
      <tr *ngFor="let r of v.rows"><td><a href="javascript:void(0)" (click)="item(r)">{{ r.number }}</a> <small>{{ r.code }}</small></td><td>{{ r.name }}</td><td>{{ r.kind }}</td>
        <td>{{ r.category }}</td><td>{{ r.method }}</td><td class="r">{{ r.qty }} {{ r.uom }}</td><td class="r">{{ money(r.unit_cost) }}</td><td class="r">{{ money(r.value) }}</td>
        <td>{{ r.stock_account || '–' }}</td></tr>
      <tr *ngIf="!v.rows.length"><td colspan="9" class="hs-note">No stock in any store.</td></tr>
      <tr class="zm-sub"><td></td><td>Total</td><td></td><td></td><td></td><td></td><td></td><td class="r"><b>{{ money(v.total) }}</b></td><td></td></tr>
    </table></div></div>
  </ng-container>
</div></div>`,
})
export class ZmValuationComponent implements OnInit {
  api!: ZaClient;
  v: any = null;
  msg = '';
  constructor(private za: ZaApiService, private router: Router) {}
  ngOnInit(): void { this.api = this.za.for(APP); this.load(); }
  async load(): Promise<void> {
    this.msg = '';
    try { this.v = await this.api.get('valuation/'); } catch (e) { this.msg = ZaApiService.error(e); }
  }
  money(v: any): string { const n = Number(v || 0); return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  csv(): void { this.api.file('valuation/', 'stock-valuation.csv', { export: 'csv' }); }
  print(): void { window.print(); }
  item(r: any): void { this.router.navigate([base(APP), 'r', 'item', r.id]); }
}
