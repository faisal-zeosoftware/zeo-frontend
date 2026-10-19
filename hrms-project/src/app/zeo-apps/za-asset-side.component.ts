import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ZaApiService, ZaClient, base, day, money, when } from './za-api.service';

/** v1.33.0 – Asset Management panels on the generic record page (kept apart from za-assets.component.ts, which uses za-register). */
const APP = 'zeo-assets';

/** Open a PDF from the API in a new tab (falls back to download when pop-ups are blocked). */
export async function openPdf(za: ZaApiService, path: string, q: any): Promise<void> {
  const blob = await za.for(APP).blob(path, q);
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { const a = document.createElement('a'); a.href = url; a.download = 'asset-labels.pdf'; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function blobError(e: any): Promise<string> {
  try { if (e?.error instanceof Blob) { const t = JSON.parse(await e.error.text()); return t.detail || 'It could not be done.'; } } catch { /* not JSON */ }
  return ZaApiService.error(e);
}

/** Panels of Asset Management records on the generic record page (za-register): asset, count, depreciation run, location. */
@Component({
  selector: 'za-asset-side',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['../expense/expense.css', './za.css'],
  template: `
<ng-container *ngIf="kind === 'asset'">
  <div class="hs-card"><h3>Label</h3>
    <div class="hs-muted" style="word-break:break-all">{{ d.qr }}</div>
    <div class="hs-acts" style="margin-top:8px"><button type="button" class="ex-btn sm primary" (click)="label()">Print label</button>
      <button type="button" class="ex-btn sm" (click)="go(['scan'])">Scan</button></div>
    <p class="hs-note err" *ngIf="err">{{ err }}</p></div>
  <div class="hs-note info" *ngIf="d.pending_transfer">Transfer {{ d.pending_transfer.number }} to {{ d.pending_transfer.to }} is waiting for approval – {{ d.pending_transfer.reason }}</div>
  <div class="hs-note info" *ngIf="d.pending_disposal">Disposal {{ d.pending_disposal.number }} ({{ d.pending_disposal.method }}, value {{ m(d.pending_disposal.value) }}, book value {{ m(d.pending_disposal.book_value) }}) is waiting for approval.</div>
  <div class="hs-card"><h3>Where</h3>
    <dl class="hs-kv"><dt>Location</dt><dd>{{ d.place || '–' }}</dd><dt>With</dt><dd>{{ d.holder || 'Not assigned' }}</dd>
      <ng-container *ngIf="d.due_back"><dt>Due back</dt><dd>{{ dd(d.due_back) }}</dd></ng-container></dl>
    <div class="hs-acts" style="margin-top:8px">
      <button type="button" class="ex-btn sm" *ngIf="d.floor_plan" (click)="go(['floor-plan', d.floor_plan])">Floor plan</button>
      <a class="ex-btn sm" *ngIf="d.map" target="_blank" rel="noopener" [href]="'https://www.openstreetmap.org/?mlat=' + d.map.lat + '&mlon=' + d.map.lng + '#map=17/' + d.map.lat + '/' + d.map.lng">Map (last GPS position)</a>
      <a class="ex-btn sm" *ngIf="d.hr_page" [routerLink]="d.hr_page">Open in HR → Assets</a></div></div>
  <div class="hs-card" *ngIf="d.depreciation"><h3>Book · {{ d.currency }}</h3>
    <div class="hs-kv3"><div><small>Cost</small><b>{{ m(d.purchase_cost) }}</b></div><div><small>Depreciated</small><b>{{ m(d.accumulated) }}</b></div>
      <div><small>Net book value</small><b>{{ m(d.book_value) }}</b></div></div>
    <p class="hs-muted" style="margin-top:6px">{{ d.method_label }}{{ d.method !== 'none' ? ', ' + d.life_months + ' months' : '' }}{{ d.depreciated_to ? ' · up to ' + dd(d.depreciated_to) : '' }}</p>
    <table class="hs-table" zPlain *ngIf="d.depreciation.length"><tr><th>Run</th><th>Period</th><th class="r">Amount</th><th class="r">Book value</th></tr>
      <tr *ngFor="let x of d.depreciation"><td>{{ x.run }}</td><td>{{ dd(x.from) }} – {{ dd(x.to) }}</td><td class="r">{{ m(x.amount) }}</td><td class="r">{{ m(x.closing) }}</td></tr></table></div>
  <div class="hs-card" *ngIf="d.hr_history?.length"><h3>HR asset history</h3>
    <div class="hs-ev" *ngFor="let h of d.hr_history.slice(0, showAll ? 50 : 6)"><div class="t">{{ h.text }}</div><div class="m">{{ h.by }}<br>{{ w(h.at) }}</div></div>
    <button type="button" class="hs-rlink" *ngIf="d.hr_history.length > 6 && !showAll" (click)="showAll = true">Show all</button></div>
</ng-container>
<ng-container *ngIf="kind === 'audit'">
  <div class="hs-card"><h3>Counting</h3>
    <div class="hs-acts"><button type="button" class="ex-btn primary" *ngIf="d.can_count" (click)="go(['audit', d.id, 'count'])">Open the count screen</button>
      <button type="button" class="ex-btn" *ngIf="!d.can_count && d.status !== 'draft'" (click)="go(['audit', d.id, 'count'])">See the count</button></div>
    <div class="hs-hbar" *ngFor="let p of d.progress"><span class="l" [title]="p.location">{{ p.location }}</span>
      <div style="background:#eef0f7;border-radius:4px;height:10px"><div [style.width.%]="p.expected ? 100 * p.counted / p.expected : 0" style="background:#5b4fe0;height:10px;border-radius:4px"></div></div>
      <span class="n">{{ p.counted }}/{{ p.expected }}</span></div></div>
</ng-container>
<ng-container *ngIf="kind === 'depreciation'">
  <div class="hs-card"><h3>Journal</h3>
    <table class="hs-table" zPlain *ngIf="d.journal?.length"><tr><th>Debit</th><th>Credit</th><th>Category</th><th class="r">Amount</th></tr>
      <tr *ngFor="let j of d.journal"><td>{{ j.debit }}</td><td>{{ j.credit }}</td><td>{{ j.category }}</td><td class="r">{{ m(j.amount) }}</td></tr></table>
    <p class="hs-empty" *ngIf="!d.journal?.length">Calculate the run to see the journal.</p>
    <button type="button" class="ex-btn sm" *ngIf="d.journal?.length" (click)="journal()">Export journal (Excel)</button></div>
</ng-container>
<ng-container *ngIf="kind === 'part'">
  <div class="hs-card"><h3>Stock by store</h3>
    <p class="hs-note err" *ngIf="d.low">Below the minimum stock ({{ d.min_qty }} {{ d.unit }}).</p>
    <div class="za-row" *ngFor="let s of d.stock_by_store"><span>{{ s.store }}<div class="s" *ngIf="s.bin">bin {{ s.bin }}</div></span><span class="bd">{{ s.qty }} {{ d.unit }}</span></div>
    <p class="hs-empty" *ngIf="!d.stock_by_store?.length">No stock.</p></div>
</ng-container>
<ng-container *ngIf="kind === 'location'">
  <div class="hs-card"><h3>{{ d.path }}</h3><p class="hs-muted">{{ d.assets_here }} asset(s) here and in the places inside.</p>
    <div class="hs-acts"><button type="button" class="ex-btn sm" (click)="go(['floor-plan', d.id])">{{ d.has_plan ? 'Floor plan' : 'Add a floor plan' }}</button>
      <button type="button" class="ex-btn sm" (click)="go(['labels'], { location: d.id })">Print labels</button></div></div>
</ng-container>`,
})
export class ZaAssetSideComponent implements OnChanges {
  @Input() kind = '';
  @Input() d: any;
  @Input() api!: ZaClient;
  showAll = false;
  dd = day; w = when; m = money;
  constructor(private router: Router, private za: ZaApiService) {}
  ngOnChanges(): void { this.showAll = false; }
  go(p: any[], q: any = null): void { this.router.navigate([base(APP), ...p], q ? { queryParams: q } : {}); }
  err = '';
  async label(): Promise<void> { this.err = ''; try { await openPdf(this.za, 'labels/', { ids: this.d.id }); } catch (e) { this.err = await blobError(e); } }
  journal(): void { this.api.file(`depreciation/${this.d.id}/journal/`, `${this.d.number}-journal.xlsx`); }
}
