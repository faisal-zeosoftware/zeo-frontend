import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { ZChartComponent } from '../hr-modules/dashboards/z-chart.component';

/** v1.53.0 – Group › Payroll in one currency: the payroll cost of every company converted to the group's reporting currency,
 *  month by month, with the exchange rates of the group (pegged Gulf currencies need no rate). */
@Component({
  selector: 'z-group-cost',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe, ZChartComponent],
  template: `
<div class="zg-head"><h1>{{ 'Payroll in one currency' | t }}</h1></div>
<p class="zg-muted">{{ 'The payroll of each company in its own currency and converted to the reporting currency of the group with the rate of the month. Rates you enter come first; the dirham, riyals, Omani rial, Bahraini dinar and Jordanian dinar follow their US dollar pegs; the Kuwaiti dinar and the rupee need a rate.' | t }}</p>
<p class="zg-err" *ngIf="err">{{ err }}</p>
<div class="zg-form">
  <label>{{ 'From' | t }}<input type="month" [(ngModel)]="from" data-cost-from></label>
  <label>{{ 'To' | t }}<input type="month" [(ngModel)]="to"></label>
  <label>{{ 'Currency' | t }}<select [(ngModel)]="cur" data-cost-cur><option *ngFor="let c of currencies" [value]="c">{{ c }}</option></select></label>
  <button type="button" class="zg-btn pri" (click)="load()" [disabled]="busy" data-cost-show>{{ 'Show' | t }}</button>
  <button type="button" class="zg-btn" *ngIf="canEdit && cur !== reporting" (click)="setReporting()" [disabled]="busy">{{ 'Make {0} the reporting currency' | t:[cur] }}</button>
</div>
<ng-container *ngIf="data">
  <p class="zg-err" *ngIf="data.missing.length" data-cost-missing>{{ 'No rate for {0} – those months are not in the total. Add the rate below.' | t:[data.missing.join(', ')] }}</p>
  <div class="zg-kpis">
    <div class="zg-kpi"><b>{{ money(data.total.gross) }}</b><span>{{ 'Gross pay' | t }}, {{ data.currency }}</span></div>
    <div class="zg-kpi"><b>{{ money(data.total.deductions) }}</b><span>{{ 'Deductions' | t }}, {{ data.currency }}</span></div>
    <div class="zg-kpi"><b>{{ money(data.total.net) }}</b><span>{{ 'Net pay' | t }}, {{ data.currency }}</span></div>
    <div class="zg-kpi"><b>{{ data.total.payslips }}</b><span>{{ 'Payslips' | t }}</span></div>
  </div>
  <div class="zg-table" style="padding:12px 14px 6px;margin-bottom:16px" *ngIf="data.months.length > 1">
    <b style="font-size:13px">{{ 'Gross pay by month, {0}' | t:[data.currency] }}</b>
    <z-chart type="bar" [labels]="data.months" [values]="data.by_month" [height]="200" ariaLabel="Gross pay by month"></z-chart>
  </div>
  <div class="zg-table"><table data-cost-table>
    <thead><tr><th>{{ 'Company' | t }}</th><th>{{ 'Currency' | t }}</th><th class="n">{{ 'Gross pay' | t }}</th><th class="n">{{ 'Rate' | t }}</th>
      <th class="n">{{ 'Gross pay' | t }} ({{ data.currency }})</th><th class="n">{{ 'Deductions' | t }} ({{ data.currency }})</th><th class="n">{{ 'Net pay' | t }} ({{ data.currency }})</th><th class="n">{{ 'Payslips' | t }}</th></tr></thead>
    <tbody><tr *ngFor="let c of data.companies"><td><b>{{ c.company }}</b><div class="zg-err-s" *ngIf="c.error">{{ c.error }}</div>
        <div class="zg-err-s" *ngIf="c.missing.length">{{ 'No rate: {0}' | t:[c.missing.join(', ')] }}</div></td>
      <td>{{ c.currency }}</td><td class="n">{{ money(c.gross) }}</td><td class="n">{{ rateText(c) }}</td>
      <td class="n">{{ money(c.gross_rc) }}</td><td class="n">{{ money(c.deductions_rc) }}</td><td class="n">{{ money(c.net_rc) }}</td><td class="n">{{ c.payslips }}</td></tr></tbody>
    <tfoot><tr><td>{{ 'Group total' | t }}</td><td>{{ data.currency }}</td><td></td><td></td><td class="n">{{ money(data.total.gross) }}</td>
      <td class="n">{{ money(data.total.deductions) }}</td><td class="n">{{ money(data.total.net) }}</td><td class="n">{{ data.total.payslips }}</td></tr></tfoot>
  </table></div>
</ng-container>
<h2>{{ 'Exchange rates' | t }}</h2>
<p class="zg-muted">{{ 'A rate applies from its month until a later rate. The reporting currency of the group is {0}.' | t:[reporting] }}</p>
<div class="zg-form" *ngIf="canEdit">
  <label>1 …<select [(ngModel)]="rf.from_currency" data-rate-from><option *ngFor="let c of currencies" [value]="c">{{ c }}</option></select></label>
  <label>= … {{ rf.to_currency }}<input type="number" step="0.0001" min="0" [(ngModel)]="rf.rate" style="min-width:120px" data-rate-rate></label>
  <label>{{ 'From month' | t }}<input type="month" [(ngModel)]="rf.month" data-rate-month></label>
  <label>{{ 'Note' | t }}<input type="search" [(ngModel)]="rf.note" placeholder="Central bank, month end"></label>
  <button type="button" class="zg-btn pri" (click)="saveRate()" [disabled]="busy || !rf.rate || !rf.month" data-rate-save>{{ 'Save the rate' | t }}</button>
</div>
<div class="zg-table" *ngIf="rates.length"><table>
  <thead><tr><th>{{ 'Currency' | t }}</th><th class="n">{{ 'Rate' | t }}</th><th>{{ 'From month' | t }}</th><th>{{ 'Note' | t }}</th><th>{{ 'By' | t }}</th><th></th></tr></thead>
  <tbody><tr *ngFor="let r of rates"><td>1 {{ r.currency }} =</td><td class="n">{{ r.rate }} {{ r.to_currency }}</td><td>{{ r.month }}</td><td>{{ r.note }}</td><td>{{ r.by }}</td>
    <td class="r"><button type="button" class="zg-link warn" *ngIf="canEdit" (click)="delRate(r)">{{ 'Delete' | t }}</button></td></tr></tbody>
</table></div>
<p class="zg-muted s" style="margin-top:8px">{{ 'Companies: ' | t }}<span *ngFor="let c of companyCurrencies; let l = last">{{ c.company }} ({{ c.currency }}){{ l ? '' : ' · ' }}</span></p>`,
})
export class ZGroupCostComponent implements OnInit {
  @Input() key = '';
  data: any = null; rates: any[] = []; currencies: string[] = ['AED']; reporting = 'AED'; cur = 'AED'; canEdit = false; companyCurrencies: any[] = [];
  from = ''; to = ''; busy = false; err = '';
  rf: any = { from_currency: 'KWD', to_currency: 'AED', rate: null, month: '', note: '' };
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  private api(p: string): string { return `${environment.apiBaseUrl}/group/api/${this.key}/${p}`; }
  async ngOnInit(): Promise<void> {
    const d = new Date();
    const ym = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
    this.to = ym(d); this.from = ym(new Date(d.getFullYear(), d.getMonth() - 11, 1)); this.rf.month = ym(d);
    await this.loadRates(); this.cur = this.reporting; await this.load();
  }
  async loadRates(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get(this.api('rates/')));
      this.rates = r.rates; this.currencies = r.currencies; this.reporting = r.currency; this.canEdit = r.can_edit; this.companyCurrencies = r.company_currencies;
      this.rf.to_currency = r.currency;
    } catch (e: any) { this.err = e?.error?.detail || 'The rates could not be loaded.'; }
    this.cd.markForCheck();
  }
  async load(): Promise<void> {
    this.busy = true; this.err = '';
    try { this.data = await firstValueFrom(this.http.get(this.api(`consolidation/?from=${this.from}&to=${this.to}&currency=${this.cur}`))); }
    catch (e: any) { this.err = e?.error?.detail || 'The figures could not be loaded.'; }
    this.busy = false; this.cd.markForCheck();
  }
  async setReporting(): Promise<void> {
    try { await firstValueFrom(this.http.post(this.api('rates/'), { currency: this.cur })); await this.loadRates(); }
    catch (e: any) { this.err = e?.error?.detail || 'Not saved.'; }
    this.cd.markForCheck();
  }
  async saveRate(): Promise<void> {
    this.busy = true;
    try { await firstValueFrom(this.http.post(this.api('rates/'), this.rf)); this.rf.rate = null; await this.loadRates(); await this.load(); }
    catch (e: any) { this.err = e?.error?.detail || 'Not saved.'; }
    this.busy = false; this.cd.markForCheck();
  }
  async delRate(r: any): Promise<void> {
    try { await firstValueFrom(this.http.delete(this.api(`rates/?id=${r.id}`))); await this.loadRates(); await this.load(); }
    catch (e: any) { this.err = e?.error?.detail || 'Not deleted.'; }
    this.cd.markForCheck();
  }
  money(v: any): string { return Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  rateText(c: any): string {
    const vals = Object.values(c.rates || {}) as any[];
    if (!vals.length) { return '–'; }
    const last = vals[vals.length - 1];
    if (last.rate === null) { return 'missing'; }
    const how: any = { same: '', entered: '', inverse: ' (inverse)', peg: ' (peg)' };
    return `${Number(last.rate).toFixed(4)}${how[last.how] || ''}`;
  }
}
