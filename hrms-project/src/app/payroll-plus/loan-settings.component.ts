// v1.67.11 (loans): new screen – Payroll › Setup › Loan and advance settings (items 51, 60, 115, 116, 117)
/**
 * The monthly deduction limit (UAE: 50 % of the wage, Decree-Law 33/2021 Art. 25(2)), the loans' and advances' own shares, "deduct only
 * loans paid out", the advance limits, the order and limit of the recovery in the final settlement and the accounts of the loan /
 * advance journals. API: payroll-plus/api/lending/settings/ (GET; PUT – company administrator or "change payroll plus settings").
 * Loan type rules (service, probation, × basic, instalment ÷ wage, profit, guarantor) are on each loan type.
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, i18nT } from '../shared-ui/i18n.service';
import { LV_STYLES } from '../leavers/leavers.styles';

const ORDER_LABEL: Record<string, string> = { loan: 'Loans', advance: 'Salary advances', recovery: 'Recovery schedules' };

@Component({
  selector: 'app-loan-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [LV_STYLES + `
.lv .es-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:16px;margin-top:16px;align-items:start}
.lv .es-card .ch{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid var(--line)}
.lv .es-card .ch .material-icons{color:var(--acc);font-size:20px}
.lv .es-card .cb{padding:6px 18px 16px}
.lv .es-q{padding:12px 0;border-bottom:1px solid #f0f1f5}
.lv .es-q:last-child{border-bottom:0}
.lv .es-q > b{display:block;color:var(--ink);font-size:13px;margin-bottom:6px}
.lv .es-q > p{margin:-2px 0 8px;color:var(--mut);font-size:12px;line-height:1.45}
.lv .es-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.lv .es-row label.fl{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mut);min-width:150px}
.lv .ck{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--ink);cursor:pointer}
.lv .ck input{margin-top:3px;accent-color:var(--acc)}
.lv .ck small{display:block;color:var(--mut);font-size:11.5px}
.lv .ord{display:flex;flex-direction:column;gap:6px;max-width:360px}
.lv .ord div{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:7px 10px;background:#fff;font-size:13px}
.lv .ord div b{flex:1}.lv .ord button{border:1px solid var(--line);background:#fff;border-radius:6px;width:28px;height:26px;cursor:pointer}
.lv .law{margin:0;padding-inline-start:18px;font-size:12.5px;line-height:1.5;color:var(--ink)}
.lv .es-bar{position:sticky;bottom:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:16px;padding:12px 18px;background:#fff;
  border:1px solid var(--line);border-radius:14px;box-shadow:0 -4px 16px rgba(27,22,64,.06);flex-wrap:wrap}
.lv .es-note{margin-top:16px;padding:12px 16px;border-radius:12px;background:var(--infobg);color:var(--info);font-size:12.5px;line-height:1.5;display:flex;gap:10px}
@media (max-width:640px){.lv{padding:14px 16px 30px}.lv .lv-head{flex-direction:column}}
`],
  template: `
<div class="lv" *ngIf="d" data-loan-settings>
  <div class="card lv-head">
    <div>
      <h1>{{ 'Loan and advance settings' | t }}</h1>
      <p>{{ 'The monthly deduction limit, the limits of salary advances, what the final settlement recovers and the accounts of the loan journals. The rules of each loan type are on the loan type.' | t }}</p>
    </div>
    <a class="lv-btn" routerLink="/main-sidebar/loan-sidebar/loan-type"><span class="material-icons">category</span>{{ 'Loan types' | t }}</a>
  </div>
  <p class="msg" *ngIf="msg" [class.err]="bad" role="status">{{ msg }}</p>
  <div class="es-note" *ngIf="d.uae"><span class="material-icons" style="font-size:18px">gavel</span>
    <ul class="law"><li *ngFor="let l of d.law">{{ l.text }}</li></ul></div>

  <div class="es-grid">
    <div class="card es-card">
      <div class="ch"><span class="material-icons">percent</span><h2>{{ 'Monthly deduction limit' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><label class="ck"><input type="checkbox" [(ngModel)]="s.deduction.legal_cap" [disabled]="!d.can_edit" data-legal-cap>
          <span>{{ 'Limit the deductions of a month to a share of the wage' | t }}<small>{{ 'Statutory deductions first, then loans, advances and the other deductions. A loan or advance instalment that does not fit is added to the next month; other deductions are carried on the line “Deductions carried over”. The payslip says why.' | t }}</small></span></label></div>
        <div class="es-q"><div class="es-row">
          <label class="fl">{{ 'Limit (% of the wage)' | t }}<input class="f num" type="number" min="1" [max]="d.uae ? 50 : 100" [(ngModel)]="s.deduction.legal_cap_pct" [disabled]="!d.can_edit || !s.deduction.legal_cap" style="width:140px" data-cap-pct></label>
          <label class="fl">{{ 'Loans at most (% of the wage)' | t }}<input class="f num" type="number" min="1" max="100" [(ngModel)]="s.deduction.loan_share_pct" [disabled]="!d.can_edit" style="width:140px" [placeholder]="'no own limit' | t"></label>
          <label class="fl">{{ 'Advances at most (% of the wage)' | t }}<input class="f num" type="number" min="1" max="100" [(ngModel)]="s.deduction.advance_share_pct" [disabled]="!d.can_edit" style="width:140px" [placeholder]="'no own limit' | t"></label></div>
          <p style="margin-top:8px">{{ 'The wage of the month is the gross pay of the payslip. The law sets no separate share for loans – a share is the company’s own choice.' | t }}</p></div>
        <div class="es-q"><label class="ck"><input type="checkbox" [(ngModel)]="s.loans.deduct_after_payout" [disabled]="!d.can_edit">
          <span>{{ 'Deduct only loans that are paid out' | t }}<small>{{ 'A loan is deducted from the month after it is marked paid out (Loans › Pay out). Off: an approved loan is deducted from the next payroll; a payout date after the payroll period always waits.' | t }}</small></span></label></div>
      </div>
    </div>

    <div class="card es-card">
      <div class="ch"><span class="material-icons">payments</span><h2>{{ 'Salary advances' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><div class="es-row">
          <label class="fl">{{ 'At most (% of the monthly wage)' | t }}<input class="f num" type="number" min="1" max="100" [(ngModel)]="s.advances.max_pct" [disabled]="!d.can_edit" style="width:140px" [placeholder]="'no limit' | t" data-adv-pct></label>
          <label class="fl">{{ 'Monthly instalments at most' | t }}<input class="f num" type="number" min="1" max="24" [(ngModel)]="s.advances.max_instalments" [disabled]="!d.can_edit" style="width:140px"></label></div></div>
        <div class="es-q"><label class="ck"><input type="checkbox" [(ngModel)]="s.advances.once_a_month" [disabled]="!d.can_edit">
          <span>{{ 'One advance a month' | t }}<small>{{ 'A second request in the same calendar month is refused (a rejected or cancelled one does not count).' | t }}</small></span></label></div>
        <div class="es-q"><label class="ck"><input type="checkbox" [(ngModel)]="s.advances.no_leavers" [disabled]="!d.can_edit">
          <span>{{ 'Not for leavers' | t }}<small>{{ 'No advance for an employee who resigned, is on notice or is leaving.' | t }}</small></span></label></div>
      </div>
    </div>

    <div class="card es-card">
      <div class="ch"><span class="material-icons">how_to_reg</span><h2>{{ 'Recovery in the final settlement' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><b>{{ 'Order' | t }}</b>
          <div class="ord"><div *ngFor="let k of s.settlement.order; let i = index" [attr.data-order]="k"><span>{{ i + 1 }}.</span><b>{{ orderLabel(k) | t }}</b>
            <button type="button" (click)="move(i, -1)" [disabled]="!d.can_edit || i === 0" [attr.aria-label]="'Up' | t">↑</button>
            <button type="button" (click)="move(i, 1)" [disabled]="!d.can_edit || i === s.settlement.order.length - 1" [attr.aria-label]="'Down' | t">↓</button></div></div></div>
        <div class="es-q"><div class="es-row">
          <label class="fl">{{ 'Recover at most (% of the settlement earnings)' | t }}<input class="f num" type="number" min="1" max="100" [(ngModel)]="s.settlement.cap_pct" [disabled]="!d.can_edit" style="width:140px" placeholder="100" data-settle-cap></label></div>
          <p style="margin-top:8px">{{ 'The other deductions of the settlement come first. What does not fit stays owed by the employee: an information line on the settlement, the loan stays open with its balance.' | t }}</p></div>
      </div>
    </div>

    <div class="card es-card">
      <div class="ch"><span class="material-icons">account_balance</span><h2>{{ 'Accounts of the loan and advance journals' | t }}</h2></div>
      <div class="cb">
        <div class="es-q"><div class="es-row">
          <label class="fl" *ngFor="let a of accounts">{{ a[1] | t }}<input class="f" [(ngModel)]="s.accounts[a[0]]" [disabled]="!d.can_edit" style="width:150px" [attr.data-acc]="a[0]"></label></div>
          <p style="margin-top:8px">{{ 'Payout: Dr loans / advances receivable, Cr bank (profit to profit income). Payroll and the final settlement credit the receivable unless the salary component or settlement line has its own account. Write-off: Dr write-off expense, Cr loans receivable.' | t }}</p></div>
      </div>
    </div>
  </div>

  <div class="es-bar" *ngIf="d.can_edit">
    <button type="button" class="lv-btn primary" (click)="save()" [disabled]="busy" data-loan-settings-save><span class="material-icons">save</span>{{ 'Save' | t }}</button>
  </div>
</div>`,
})
export class LoanSettingsComponent implements OnInit {
  d: any = null; s: any = null; msg = ''; bad = false; busy = false;
  accounts = [['loan_receivable', 'Loans to employees (receivable)'], ['advance_receivable', 'Salary advances (receivable)'], ['bank', 'Bank (payouts)'],
    ['write_off', 'Loan write-off expense'], ['profit_income', 'Profit on loans (income)']];
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(): string { return `${this.rec.api}/payroll-plus/api/lending/settings/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  private err(e: any): string {
    const x = e?.error;
    if (x && typeof x === 'object' && typeof x.detail === 'string') { return x.detail; }
    return httpErrorText(e) || i18nT('It could not be done.');
  }
  orderLabel(k: string): string { return ORDER_LABEL[k] || k; }
  async ngOnInit(): Promise<void> {
    try { this.set(await firstValueFrom(this.http.get<any>(this.url()))); }
    catch (e: any) { this.msg = this.err(e); this.bad = true; }
    this.cd.detectChanges();
  }
  private set(d: any): void {
    this.d = d;
    this.s = JSON.parse(JSON.stringify({ deduction: d.deduction, loans: d.loans, advances: d.advances, settlement: d.settlement, accounts: d.accounts }));
  }
  move(i: number, by: number): void {
    const o = [...this.s.settlement.order]; const j = i + by;
    [o[i], o[j]] = [o[j], o[i]]; this.s.settlement.order = o;
  }
  async save(): Promise<void> {
    this.busy = true; this.msg = '';
    const e = (v: any) => (v === null || v === undefined ? '' : v);
    const body = { ...this.s, deduction: { ...this.s.deduction, loan_share_pct: e(this.s.deduction.loan_share_pct), advance_share_pct: e(this.s.deduction.advance_share_pct) },
      advances: { ...this.s.advances, max_pct: e(this.s.advances.max_pct) }, settlement: { ...this.s.settlement, cap_pct: e(this.s.settlement.cap_pct) } };
    try { this.set(await firstValueFrom(this.http.put<any>(this.url(), body))); this.msg = i18nT('Saved.'); this.bad = false; }
    catch (e: any) { this.msg = this.err(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
