// v1.62.7 (item 18): new screen – accrue now, pay later
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, I18nService } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';

/**
 * v1.62.7 (item 18) – Payroll › Accounting › Accrue now – pay later.
 * A salary component with this setting is accrued every month (type Others – not in the month's net pay) and paid later: in the
 * payroll run of the payout month (an automatic payout line) and / or with the final settlement. Opening balances for the go-live,
 * and the accrued / paid / balance figures per employee (also in Reports › Accrued components).
 * API: payroll-plus/api/accruals/ (components/<id>/, balances/, entries/, opening/)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/accruals/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.ap-wrap{padding:18px 22px 40px}
.ap-top h1{margin:0;font-size:22px;font-weight:700;color:#1b1640}.ap-top p{margin:4px 0 14px;color:#6b7185;font-size:13px;max-width:820px}
.ap-form{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));align-items:end;margin-top:10px}
.ap-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.ap-form label.chk{flex-direction:row;align-items:center;gap:8px;font-size:13px;color:#2b2f42}
.ap-form input:not([type=checkbox]),.ap-form select,.ap-bar input{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0;background:#fff}
.ap-msg{border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 12px;background:#ecfdf3;color:#1f7a4d}.ap-msg.err{background:#fff5f5;color:#b42318}
.ap-wide{overflow:auto}.ap-num{text-align:end;white-space:nowrap}.ap-tot td{font-weight:700;border-top:2px solid #e3e5ee}
.ap-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px}.ap-bar label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185}
.ap-edit td{background:#fafaff}
.ap-led{margin:8px 0 0;font-size:12.5px}.ap-led td{padding:4px 8px}
.ap-pay{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin-top:12px;font-size:13px}.ap-pay label.chk{display:inline-flex;align-items:center;gap:8px;color:#2b2f42}
.ap-pay select{height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;font-size:13px;background:#fff}
.ap-tabs{display:flex;gap:6px;margin:8px 0 10px;flex-wrap:wrap}.ap-tab{height:30px;border:1px solid #dfe1ea;border-radius:8px;background:#fff;padding:0 12px;font-size:12.5px;cursor:pointer}
.ap-tab.on{background:#eef0ff;border-color:#c9c5ff;color:#4b3fbf;font-weight:600}
.ap-grid input{width:110px;height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 6px;text-align:end}.ap-grid input.chg{border-color:#7b6ff7;background:#f6f5ff}
.ap-grid td.bad{background:#fff5f5}.ap-err{color:#b42318;font-size:12px}.ap-ok{display:inline-block;padding:0 8px;border-radius:10px;background:#e3f6ec;color:#1f7a4d;font-size:11.5px}
.lp-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:1px solid #dfe1ea;background:#fff;border-radius:8px;padding:0 12px;font-size:13px;color:#2b2f42;cursor:pointer;white-space:nowrap}
.lp-btn.primary{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.lp-btn.sm{height:28px;padding:0 10px;font-size:12px}.lp-btn:disabled{opacity:.5}
.lp-muted{color:#6b7185;font-size:12.5px}
@media (max-width:640px){.ap-wrap{padding:12px 16px 30px}}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail + (d.errors ? ' – ' + Object.values(d.errors).join(' ') : ''); }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

@Component({
  selector: 'app-accrue-pay-later',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="ap-wrap" data-accrue-pay-later>
  <div class="ap-top">
    <h1>{{ 'Accrue now – pay later' | t }}</h1>
    <p>{{ 'A salary component with this setting is worked out every month as usual, but the amount is accrued – it is not in the month’s net pay – and paid later: in the payroll run of the payout month and / or with the final settlement. The per-day rate or formula is set by the company on the component (fixed rate, formula from basic, monthly inputs).' | t }}</p>
  </div>
  <div class="ap-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>

  <!-- components -->
  <div class="fw-card ap-wide" data-ap-components>
    <h2>{{ 'Salary components' | t }}</h2>
    <table class="fw-table" zPlain *ngIf="d">
      <thead><tr><th>{{ 'Component' | t }}</th><th>{{ 'Branches' | t }}</th><th>{{ 'Calculation' | t }}</th><th>{{ 'Accrue now – pay later' | t }}</th><th>{{ 'Paid' | t }}</th><th>{{ 'Accrual account' | t }}</th><th></th></tr></thead>
      <tbody>
        <ng-container *ngFor="let r of shownRows()">
          <tr [attr.data-ap-comp]="r.code">
            <td><b>{{ r.name }}</b><br><small class="lp-muted">{{ r.code }} · {{ r.type_label | t }}</small></td>
            <td><small>{{ r.branches.join(', ') }}</small></td>
            <td><small class="lp-muted">{{ r.formula || (r.value_type === 'fixed' ? ('Fixed amount per employee' | t) : ('Entered or calculated each month' | t)) }}</small></td>
            <td><span class="fw-chip" [class.ok]="r.enabled">{{ (r.enabled ? 'On' : 'Off') | t }}</span></td>
            <td><small>{{ paidText(r) }}</small></td>
            <td>{{ r.enabled ? r.accrual_account : '–' }}</td>
            <td><button type="button" class="lp-btn sm" *ngIf="d.can_set" (click)="edit(r)" data-ap-edit>{{ 'Change' | t }}</button></td>
          </tr>
          <tr class="ap-edit" *ngIf="f && f.component_id === r.component_id" data-ap-form>
            <td colspan="7">
              <div class="ap-form">
                <label class="chk"><input type="checkbox" [(ngModel)]="f.enabled" data-ap-enabled> {{ 'Accrue now – pay later' | t }}</label>
                <label>{{ 'Accrual account' | t }}<input [(ngModel)]="f.accrual_account" [disabled]="!f.enabled" maxlength="40" [placeholder]="d.default_account" data-ap-account></label>
              </div>
              <!-- v1.62.11 (item 18b): the payout choice in words – every year in a month's payroll and / or at the final settlement -->
              <div class="ap-pay" data-ap-payout>
                <b>{{ 'Pay out:' | t }}</b>
                <label class="chk"><input type="checkbox" [(ngModel)]="f.yearly" [disabled]="!f.enabled" data-ap-yearly> {{ 'every year in the payroll of' | t }}
                  <select [(ngModel)]="f.month" [disabled]="!f.enabled || !f.yearly" data-ap-month>
                    <option *ngFor="let m of d.months" [ngValue]="m.value">{{ m.label | t }}</option>
                  </select></label>
                <label class="chk"><input type="checkbox" [(ngModel)]="f.pay_at_exit" [disabled]="!f.enabled" data-ap-exit> {{ 'at the final settlement' | t }}</label>
                <label class="chk" *ngIf="f.yearly"><input type="checkbox" [(ngModel)]="f.include_payout_month" [disabled]="!f.enabled"> {{ 'Pay the payout month’s own amount in the same run' | t }}</label>
              </div>
              <p class="lp-muted" style="margin:6px 0 0">{{ 'Tick one or both: the balance is paid each year in that month’s payroll (a payout line), and what is left when the employee leaves is paid with the final settlement.' | t }}</p>
              <p class="ap-msg err" *ngIf="f.enabled && !f.yearly && !f.pay_at_exit" style="margin:8px 0 0" data-ap-payout-err>{{ 'Choose at least one: every year in a month’s payroll, or at the final settlement.' | t }}</p>
              <p class="lp-muted" style="margin:10px 0 0">{{ 'When it is on, the component becomes type Others for every branch copy (same code): it stays on the payslip as information and is not in gross or net pay. Switched off, it is paid monthly again; the balance stays and is still paid in the payout month or at exit.' | t }}</p>
              <div style="display:flex;gap:8px;margin-top:10px">
                <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy || (f.enabled && !f.yearly && !f.pay_at_exit)" data-ap-save>{{ 'Save' | t }}</button>
                <button type="button" class="lp-btn" (click)="f = null">{{ 'Cancel' | t }}</button>
              </div>
            </td>
          </tr>
        </ng-container>
        <tr *ngIf="!shownRows().length"><td colspan="7" class="lp-muted">{{ 'No salary components yet' | t }}</td></tr>
      </tbody>
    </table>
    <label class="lp-muted" style="display:inline-flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" [(ngModel)]="onlyOn"> {{ 'Show only components that are accrued' | t }}</label>
  </div>

  <!-- opening balance -->
  <div class="fw-card" *ngIf="d?.can_opening" data-ap-opening>
    <h2>{{ 'Opening balance (go-live)' | t }}</h2>
    <p class="lp-muted" style="margin:0">{{ 'The balance each employee had accrued before ZEO payroll started. Entering it again replaces it; 0 removes it.' | t }}</p>
    <!-- v1.62.11 (item 18b): one employee / all employees of a component / Excel import -->
    <div class="ap-tabs">
      <button type="button" class="ap-tab" [class.on]="oTab === 'one'" (click)="oTab = 'one'" data-ap-o-tab="one">{{ 'One employee' | t }}</button>
      <button type="button" class="ap-tab" [class.on]="oTab === 'grid'" (click)="oTab = 'grid'" data-ap-o-tab="grid">{{ 'All employees of a component' | t }}</button>
      <button type="button" class="ap-tab" [class.on]="oTab === 'import'" (click)="oTab = 'import'" data-ap-o-tab="import">{{ 'Import from Excel' | t }}</button>
    </div>
    <div class="ap-form" *ngIf="oTab === 'one'">
      <label>{{ 'Employee' | t }}<select [(ngModel)]="o.employee" data-ap-o-emp><option [ngValue]="null">–</option><option *ngFor="let e of emps" [ngValue]="e.id">{{ e.label }}</option></select></label>
      <label>{{ 'Component' | t }}<select [(ngModel)]="o.component" data-ap-o-comp><option [ngValue]="null">–</option><option *ngFor="let r of onRows()" [ngValue]="r.component_id">{{ r.name }}</option></select></label>
      <label>{{ 'Amount (AED)' | t }}<input type="number" step="0.01" [(ngModel)]="o.amount" data-ap-o-amount></label>
      <label>{{ 'Balance on' | t }}<input type="date" [(ngModel)]="o.as_of" data-ap-o-date></label>
      <label>{{ 'Notes' | t }}<input [(ngModel)]="o.note" maxlength="200"></label>
      <div><button type="button" class="lp-btn primary" (click)="saveOpening()" [disabled]="busy || !o.employee || !o.component || o.amount === null || o.amount === '' || !o.as_of" data-ap-o-save>{{ 'Save opening balance' | t }}</button></div>
    </div>
    <!-- v1.62.11 (item 18b): grid of one component -->
    <div *ngIf="oTab === 'grid'" data-ap-o-grid>
      <div class="ap-bar" style="margin-top:10px">
        <label>{{ 'Component' | t }}<select [(ngModel)]="gComp" (change)="loadGrid()" data-ap-g-comp><option [ngValue]="null">–</option><option *ngFor="let r of onRows()" [ngValue]="r.component_id">{{ r.name }}</option></select></label>
        <label>{{ 'Balance on (new rows)' | t }}<input type="date" [(ngModel)]="gDate" data-ap-g-date></label>
      </div>
      <div class="ap-wide" *ngIf="g">
        <table class="fw-table ap-grid" zPlain>
          <thead><tr><th>{{ 'Employee' | t }}</th><th class="ap-num">{{ 'Opening balance (AED)' | t }}</th><th>{{ 'Balance on' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of g.rows" [attr.data-ap-g-row]="r.emp_code">
              <td>{{ r.employee }} <small class="lp-muted">{{ r.emp_code }}</small><div class="ap-err" *ngIf="gErr[r.employee_id]">{{ gErr[r.employee_id] }}</div></td>
              <td class="ap-num" [class.bad]="gErr[r.employee_id]"><input type="number" min="0" step="0.01" [(ngModel)]="r.edit" [class.chg]="gChanged(r)" [attr.data-ap-g-amount]="r.emp_code"></td>
              <td><small>{{ r.as_of ? dmy(r.as_of) : (gChanged(r) ? dmy(gDate) : '–') }}</small></td>
            </tr>
            <tr *ngIf="!g.rows.length"><td colspan="3" class="lp-muted">{{ 'No employee has this component.' | t }}</td></tr>
          </tbody>
        </table>
        <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
          <button type="button" class="lp-btn primary" (click)="saveGrid()" [disabled]="busy || !gChanges().length || !gDate" data-ap-g-save>{{ 'Save' | t }} ({{ gChanges().length }})</button>
          <span class="lp-muted">{{ 'Only changed rows are saved; 0 removes the opening balance.' | t }}</span>
        </div>
      </div>
    </div>
    <!-- v1.62.11 (item 18b): Excel import -->
    <div *ngIf="oTab === 'import'" data-ap-o-import>
      <p class="lp-muted" style="margin:10px 0 0">{{ 'One row per employee and component: employee_code, component_code, amount, as_of_date. Check the file first (dry run) – nothing is saved; then apply the rows without errors.' | t }}</p>
      <div class="ap-bar" style="margin-top:10px">
        <button type="button" class="lp-btn" (click)="oTemplate()" data-ap-i-template>{{ 'Excel template' | t }}</button>
        <label>{{ 'File (Excel or CSV)' | t }}<input type="file" accept=".xlsx,.csv" (change)="oPick($event)" data-ap-i-file></label>
        <button type="button" class="lp-btn" [disabled]="!oFile || busy" (click)="oImport(false)" data-ap-i-dry>{{ 'Check the file (dry run)' | t }}</button>
        <button type="button" class="lp-btn primary" [disabled]="!oFile || busy || !oImp || !oImp.ok" (click)="oImport(true)" data-ap-i-apply>{{ 'Apply the rows without errors' | t }}</button>
      </div>
      <p *ngIf="oImp" data-ap-i-sum style="font-size:13px;margin:4px 0 8px">{{ oImpSummary() }}</p>
      <div class="ap-wide" *ngIf="oImp">
        <table class="fw-table" zPlain data-ap-i-rows>
          <thead><tr><th>{{ 'Row' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Component' | t }}</th><th class="ap-num">{{ 'Amount (AED)' | t }}</th><th>{{ 'Balance on' | t }}</th><th>{{ 'Check' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of oImp.rows" [attr.data-ap-i-row]="r.row">
              <td>{{ r.row }}</td><td>{{ r.employee || r.employee_code }}</td><td>{{ r.component || r.component_code }}</td><td class="ap-num">{{ r.amount }}</td><td>{{ dmy(r.as_of) }}</td>
              <td><div class="ap-err" *ngFor="let e of r.errors">{{ e }}</div><span class="ap-ok" *ngIf="r.ok">{{ 'OK' | t }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- balances -->
  <div class="fw-card ap-wide" data-ap-balances>
    <h2>{{ 'Accrued, paid and balance' | t }}</h2>
    <div class="ap-bar">
      <label>{{ 'From' | t }}<input type="date" [(ngModel)]="from" (change)="loadBalances()"></label>
      <label>{{ 'To' | t }}<input type="date" [(ngModel)]="to" (change)="loadBalances()"></label>
      <a class="fw-link" routerLink="/main-sidebar/report-options/r/accruals">{{ 'Open in Reports' | t }}</a>
    </div>
    <table class="fw-table" zPlain *ngIf="b">
      <thead><tr><th>{{ 'Employee' | t }}</th><th>{{ 'Component' | t }}</th><th class="ap-num">{{ 'Opening balance' | t }}</th><th class="ap-num">{{ 'Accrued' | t }}</th>
        <th class="ap-num">{{ 'Paid by payroll' | t }}</th><th class="ap-num">{{ 'Paid at final settlement' | t }}</th><th class="ap-num">{{ 'Balance' | t }}</th><th></th></tr></thead>
      <tbody>
        <ng-container *ngFor="let r of b.rows">
          <tr [attr.data-ap-bal]="r.emp_code + ':' + r.code">
            <td>{{ r.employee }} <small class="lp-muted">{{ r.emp_code }}</small> <span class="fw-chip inactive" *ngIf="!r.active">{{ 'Inactive' | t }}</span></td>
            <td>{{ r.component }}</td>
            <td class="ap-num">{{ +r.opening | number:'1.2-2' }}</td><td class="ap-num">{{ +r.accrued | number:'1.2-2' }}</td>
            <td class="ap-num">{{ +r.paid | number:'1.2-2' }}</td><td class="ap-num">{{ +r.paid_exit | number:'1.2-2' }}</td>
            <td class="ap-num"><b>{{ +r.balance | number:'1.2-2' }}</b></td>
            <td><a class="fw-link" (click)="ledger(r)">{{ (led && led.key === key(r) ? 'Close' : 'Movements') | t }}</a></td>
          </tr>
          <tr *ngIf="led && led.key === key(r)"><td colspan="8">
            <table class="ap-led" zPlain><tr *ngFor="let x of led.rows"><td>{{ dmy(x.month) }}</td><td>{{ x.kind_label }}</td><td>{{ x.run || x.note }}</td>
              <td class="ap-num">{{ +x.amount | number:'1.2-2' }}</td><td class="ap-num lp-muted">{{ +x.balance | number:'1.2-2' }}</td><td><small class="lp-muted" *ngIf="!x.counts">{{ 'rejected payslip – not counted' | t }}</small></td></tr></table>
          </td></tr>
        </ng-container>
        <tr *ngIf="!b.rows.length"><td colspan="8" class="lp-muted">{{ 'Nothing accrued yet.' | t }}</td></tr>
        <tr class="ap-tot" *ngIf="b.rows.length"><td colspan="2">{{ 'Total' | t }}</td><td class="ap-num">{{ +b.totals.opening | number:'1.2-2' }}</td><td class="ap-num">{{ +b.totals.accrued | number:'1.2-2' }}</td>
          <td class="ap-num">{{ +b.totals.paid | number:'1.2-2' }}</td><td class="ap-num">{{ +b.totals.paid_exit | number:'1.2-2' }}</td><td class="ap-num">{{ +b.totals.balance | number:'1.2-2' }}</td><td></td></tr>
      </tbody>
    </table>
  </div>
</div>`,
})
export class AccruePayLaterComponent implements OnInit {
  d: any = null; f: any = null; b: any = null; led: any = null;
  o: any = { employee: null, component: null, amount: null, as_of: '', note: '' };
  emps: { id: number; label: string }[] = [];
  onlyOn = false; busy = false; msg = ''; bad = false;
  // v1.62.11 (item 18b): opening balances in bulk
  oTab: 'one' | 'grid' | 'import' = 'one';
  gComp: any = null; gDate = ''; g: any = null; gErr: Record<number, string> = {};
  oFile: File | null = null; oImp: any = null;
  from = ''; to = '';
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private i18n: I18nService) {}
  ngOnInit(): void {
    const y = new Date().getFullYear();
    this.from = `${y}-01-01`; this.to = `${y}-12-31`;
    this.gDate = `${y - 1}-12-31`;   // v1.62.11 (item 18b)
    this.load(); this.loadBalances(); this.loadEmps();
  }
  t(s: string): string { return this.i18n.t(s); }
  async load(): Promise<void> {
    try { this.d = await firstValueFrom(this.http.get<any>(API, { params: { schema: schema() } })); }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  async loadBalances(): Promise<void> {
    const params: any = { schema: schema() };
    if (this.from) { params.from = this.from; }
    if (this.to) { params.to = this.to; }
    try { this.b = await firstValueFrom(this.http.get<any>(API + 'balances/', { params })); this.led = null; }
    catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  async loadEmps(): Promise<void> {
    try {
      const r: any = await firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/employee/api/emplist/`, { params: { schema: schema() } }));
      this.emps = (Array.isArray(r) ? r : r?.results || []).map((e: any) => ({ id: e.id, label: `${e.emp_name || [e.emp_first_name, e.emp_last_name].filter(Boolean).join(' ')} (${e.emp_code})` }));
    } catch { this.emps = []; }
    this.cd.detectChanges();
  }
  shownRows(): any[] { return (this.d?.rows || []).filter((r: any) => !this.onlyOn || r.enabled); }
  onRows(): any[] { return (this.d?.rows || []).filter((r: any) => r.enabled); }
  paidText(r: any): string {
    if (!r.enabled) { return '–'; }
    const parts: string[] = [];
    if (r.payout_month) { parts.push(this.t('in the {0} payroll').replace('{0}', this.t((this.d.months.find((m: any) => m.value === r.payout_month) || {}).label || ''))); }
    if (r.pay_at_exit) { parts.push(this.t('at the final settlement')); }
    return parts.join(' · ');
  }
  edit(r: any): void {
    const pm = r.payout_month ?? (r.known ? null : 1);
    // v1.62.11 (item 18b): "every year in <month>" = a payout month; the month is kept when the box is unticked
    this.f = { component_id: r.component_id, enabled: r.enabled || !r.known, yearly: pm !== null, month: pm || 1, pay_at_exit: r.pay_at_exit,
               include_payout_month: r.include_payout_month, accrual_account: r.accrual_account || this.d.default_account };
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try {
      const { yearly, month, ...body } = this.f;   // v1.62.11 (item 18b)
      body.payout_month = yearly ? month : null;
      await firstValueFrom(this.http.put<any>(`${API}components/${this.f.component_id}/`, body, { params: { schema: schema() } }));
      this.f = null; this.msg = this.t('Saved.'); await this.load();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async saveOpening(): Promise<void> {
    this.busy = true; this.msg = ''; this.bad = false;
    try {
      const r = await firstValueFrom(this.http.post<any>(API + 'opening/', this.o, { params: { schema: schema() } }));
      this.msg = this.t('Opening balance saved – balance {0}').replace('{0}', (+r.balance).toFixed(2));
      this.o = { employee: null, component: null, amount: null, as_of: this.o.as_of, note: '' };
      await this.loadBalances();
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  key(r: any): string { return `${r.employee_id}:${r.group}`; }
  async ledger(r: any): Promise<void> {
    if (this.led && this.led.key === this.key(r)) { this.led = null; this.cd.detectChanges(); return; }
    try {
      const x = await firstValueFrom(this.http.get<any>(API + 'entries/', { params: { schema: schema(), employee: r.employee_id, component: r.component_id } }));
      this.led = { key: this.key(r), rows: x.rows || [] };
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  // v1.62.11 (item 18b): opening balances – all employees of one component
  async loadGrid(): Promise<void> {
    this.g = null; this.gErr = {};
    if (!this.gComp) { this.cd.detectChanges(); return; }
    try {
      this.g = await firstValueFrom(this.http.get<any>(`${API}opening/grid/${this.gComp}/`, { params: { schema: schema() } }));
      for (const r of this.g.rows) { r.edit = r.amount === '' ? null : +r.amount; }
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  gChanged(r: any): boolean { const now = r.edit === null || r.edit === '' || r.edit === undefined ? '' : String(+r.edit); return now !== (r.amount === '' ? '' : String(+r.amount)); }
  gChanges(): any[] { return (this.g?.rows || []).filter((r: any) => this.gChanged(r) && r.edit !== null && r.edit !== ''); }
  async saveGrid(): Promise<void> {
    const rows = this.gChanges().map((r: any) => ({ employee: r.employee_id, amount: r.edit, as_of: r.as_of || this.gDate }));
    this.busy = true; this.msg = ''; this.bad = false; this.gErr = {};
    try {
      const r = await firstValueFrom(this.http.put<any>(`${API}opening/grid/${this.gComp}/`, { rows }, { params: { schema: schema() } }));
      this.msg = this.t('{0} opening balances saved.').replace('{0}', String(r.saved));
      await this.loadGrid(); await this.loadBalances();
    } catch (e: any) {
      const p = e?.error?.errors; if (p && typeof p === 'object') { for (const k of Object.keys(p)) { this.gErr[+k] = String(p[k]); } }
      this.msg = err(e); this.bad = true;
    }
    this.busy = false; this.cd.detectChanges();
  }
  // v1.62.11 (item 18b): opening balances – Excel import with dry run
  async oTemplate(): Promise<void> {
    try {
      const blob = await firstValueFrom(this.http.get(API + 'opening/template/', { params: { schema: schema() }, responseType: 'blob' }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'accrued_opening_balances.xlsx'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { this.msg = err(e); this.bad = true; this.cd.detectChanges(); }
  }
  oPick(ev: any): void { this.oFile = ev?.target?.files?.[0] || null; this.oImp = null; this.cd.detectChanges(); }
  oImpSummary(): string {
    const i = this.oImp;
    return (i.dry_run ? this.t('Dry run: {0} rows without errors, {1} rows with errors.') : this.t('Applied: {0} rows saved, {1} rows with errors not saved.'))
      .replace('{0}', String(i.dry_run ? i.ok : i.applied)).replace('{1}', String(i.errors));
  }
  async oImport(apply: boolean): Promise<void> {
    if (!this.oFile) { return; }
    const fd = new FormData(); fd.append('file', this.oFile); fd.append('apply', apply ? '1' : '0');
    this.busy = true; this.msg = ''; this.bad = false;
    try {
      this.oImp = await firstValueFrom(this.http.post<any>(API + 'opening/import/', fd, { params: { schema: schema() } }));
      if (apply) { this.msg = this.t('{0} opening balances saved.').replace('{0}', String(this.oImp.applied)); await this.loadBalances(); }
    } catch (e) { this.msg = err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  dmy(v: any): string { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || ''); }
}
