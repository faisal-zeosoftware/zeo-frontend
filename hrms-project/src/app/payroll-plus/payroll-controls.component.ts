/**
 * v1.18.0 – Payroll controls (spec sections 8 and 10): segregation of duties on payroll runs and payslips, the leave encashment
 * approval chain, the Wage Protection System deadline and the final settlement deadline. Company administrator only.
 * API: /payroll-plus/api/settings/ (GET, PUT)
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZSuiteService } from '../shared-ui/z-suite.service';

@Component({
  selector: 'app-payroll-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [`
.pc-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #eef0f2;max-width:900px}
.pc-row input[type=checkbox]{margin-top:4px;width:18px;height:18px}.pc-row b{display:block}.pc-row p{margin:2px 0 0;font-size:13px;color:#5d6670}
.pc-freq{margin-top:16px;max-width:900px}.pc-freq>p{font-size:13px;color:#5d6670;margin:2px 0 4px}.pc-wps{margin-top:16px}.pc-wps p{font-size:13px;color:#5d6670;margin:2px 0 8px}.pc-tbl{width:100%;max-width:720px;border-collapse:collapse}.pc-tbl th,.pc-tbl td{padding:6px 8px;border-bottom:1px solid #eef0f5;text-align:start;font-size:13px}.pc-tbl input{height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;width:100%}
.pc-sel{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 6px;flex:0 0 300px;width:300px}
.pc-row input[type=number]{width:80px;height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px}
`],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section"><div class="lp-head"><div>
      <h1 class="page-title">Payroll controls</h1>
      <p class="lp-desc">The person who prepares payroll is not the only one who approves and releases it. Only the company administrator can change these controls.</p>
    </div></div></div>
    <div class="com_list mt-4">
      <p class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>
      <ng-container *ngIf="s">
        <label class="pc-row"><input type="checkbox" [(ngModel)]="s.segregation" [disabled]="!s.can_edit">
          <span><b>Segregation of duties</b><p>Whoever prepared a payroll run cannot approve its payslips or the run; whoever approved the run cannot mark it paid.</p></span></label>
        <label class="pc-row"><input type="checkbox" [(ngModel)]="s.encashment_chain" [disabled]="!s.can_edit">
          <span><b>Leave encashment: HR → Finance → management</b><p>HR confirms the balance, Finance verifies the amount, management gives the final approval – three different people.</p></span></label>
        <div class="pc-row"><input type="number" min="0" max="60" [(ngModel)]="s.wps_late_days" [disabled]="!s.can_edit" aria-label="WPS days">
          <span><b>Days after the salary month to pay (WPS)</b><p>A payroll run with a payment date later than this is flagged as late under the Wage Protection System.</p></span></div>
        <div class="pc-row"><input type="number" min="0" max="60" [(ngModel)]="s.settlement_due_days" [disabled]="!s.can_edit" aria-label="Settlement days">
          <span><b>Days to pay a final settlement</b><p>Counted from the last working day; open settlements after this are shown as overdue.</p></span></div>
        <div class="pc-row"><select [(ngModel)]="s.part_month" [disabled]="!s.can_edit" aria-label="Part months" class="pc-sel">
            <option value="share">Share of the calendar month</option>
            <option value="days">Days employed (full month = fixed days)</option></select>
          <span><b>Part months (joiners and leavers)</b><p><i>Share of the calendar month:</i> the days not employed are taken off as a share of the month (16 of 31 days employed pays 15.48 of 30 days). <i>Days employed:</i> the days employed are paid, at most the fixed days (16 days employed pays 16 of 30; a full month always pays 30).</p></span></div>
        <div class="pc-row"><select [(ngModel)]="s.wps_period" [disabled]="!s.can_edit" aria-label="WPS pay period" class="pc-sel">
            <option value="month">The salary month (1st – last day)</option>
            <option value="attendance">The attendance cycle of the run</option></select>
          <span><b>Pay period in the WPS file</b><p>The pay start and end dates of each employee in the salary file: the calendar month, or the run's attendance cycle for a branch with a cut-off (e.g. 26 Aug – 25 Sep). Joiners start on their joining day, leavers end on their last working day.</p></span></div>
        <div class="pc-row"><select [(ngModel)]="s.payslip_language" [disabled]="!s.can_edit" aria-label="Payslip language" class="pc-sel" data-payslip-lang>
            <option value="reader">The reader's language</option>
            <option value="en">English</option>
            <option value="en_ar">English and Arabic on the same payslip</option></select>
          <span><b>Payslip language</b><p><i>The reader's language:</i> English, or the language the user chose in ZEO (Arabic right to left). <i>English and Arabic:</i> every payslip PDF has each label in both languages on the same page – the usual request of the labour office. Employees can also download the English + Arabic payslip from My payslips.</p></span></div>   <!-- v1.50.0 -->
        <div class="pc-freq" data-pay-freq>   <!-- v1.55.0 -->
          <b>Pay frequencies</b>
          <p>Every employee is paid monthly. Switch on another frequency to pay some employees on a pay calendar – Pay calendars appears in the Payroll menu only once one is on.</p>
          <label class="pc-row"><input type="checkbox" [(ngModel)]="s.pay_weekly" [disabled]="!s.can_edit" data-pay-weekly>
            <span><b>Weekly</b><p>Paid every week; the monthly salary is paid as 12 ÷ 52 of it each week.</p></span></label>
          <label class="pc-row"><input type="checkbox" [(ngModel)]="s.pay_biweekly" [disabled]="!s.can_edit" data-pay-biweekly>
            <span><b>Bi-weekly</b><p>Paid every two weeks; 12 ÷ 26 of the monthly salary each time.</p></span></label>
          <label class="pc-row"><input type="checkbox" [(ngModel)]="s.pay_semimonthly" [disabled]="!s.can_edit" data-pay-semimonthly>
            <span><b>Semi-monthly</b><p>Paid twice a month (1st – 15th and 16th – end of the month); half the monthly salary each time.</p></span></label>
          <p>A frequency used by an active pay calendar cannot be switched off – deactivate the calendar first.</p>
        </div>
        <div class="pc-wps" *ngIf="s.branch_wps?.length">
          <b>WPS establishment per branch</b>
          <p>A branch with its own MoHRE establishment card has its own WPS file: enter its employer ID and the routing code of its salary bank. Leave empty to use the company's (Settings → Company).</p>
          <table zPlain class="pc-tbl"><thead><tr><th>Branch</th><th>Employer ID (13 digits)</th><th>Bank routing code (9 digits)</th></tr></thead>
            <tbody><tr *ngFor="let b of s.branch_wps"><td>{{ b.branch_name }}</td>
              <td><input type="text" maxlength="13" inputmode="numeric" [(ngModel)]="b.employer_unique_id" [disabled]="!s.can_edit" [attr.aria-label]="'Employer ID ' + b.branch_name"></td>
              <td><input type="text" maxlength="9" inputmode="numeric" [(ngModel)]="b.bank_routing_code" [disabled]="!s.can_edit" [attr.aria-label]="'Routing code ' + b.branch_name"></td></tr></tbody></table>
        </div>
        <button type="button" class="lp-btn primary" *ngIf="s.can_edit" [disabled]="busy" (click)="save()" style="margin-top:14px">Save controls</button>
        <p class="lp-muted" *ngIf="!s.can_edit">You can see these controls; the company administrator changes them.</p>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class PayrollControlsComponent implements OnInit {
  s: any = null; busy = false; msg = ''; msgErr = false;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef, private suite: ZSuiteService) {}
  private url(): string { return `${this.rec.api}/payroll-plus/api/settings/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }
  async ngOnInit(): Promise<void> {
    try { this.s = await firstValueFrom(this.http.get<any>(this.url())); } catch (e: any) { this.msg = e?.error?.detail || 'Could not load the controls.'; this.msgErr = true; }
    this.cd.detectChanges();
  }
  async save(): Promise<void> {
    this.busy = true;
    try { this.s = await firstValueFrom(this.http.put<any>(this.url(), this.s)); this.msg = 'Controls saved.'; this.msgErr = false; this.suite.loadActive(true); }   // v1.55.0: menu follows the pay frequencies
    catch (e: any) { this.msg = e?.error?.detail || 'Could not save.'; this.msgErr = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
