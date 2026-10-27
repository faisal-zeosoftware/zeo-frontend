/**
 * v1.62.0 payroll – Payslip approvals grouped by payroll run, with the totals of each run. Approve or reject a whole run or the
 * payslips ticked. Approve / reject use the existing API (payroll/api/approval-payroll/bulk_approve/ | bulk_reject/) and its rules
 * (only the approver of the step, not one's own payslip, segregation of duties).
 * API (read): payroll-plus/api/workspace/approvals/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiUrl, errText, wsUrl } from './pay162';

@Component({
  selector: 'app-payslip-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['../leave-policy/leave-policy.css', './pay162.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="py-wrap py-head">
        <div>
          <h1 class="page-title">Payslip approvals</h1>
          <p class="lp-desc">Payslips sent to you for approval, by payroll run. Check the totals, open a payslip if needed, then approve or reject the whole run or the payslips you tick.</p>
        </div>
        <div class="py-tools"><a class="py-btn" routerLink="/main-sidebar/salary-options/payslip-approval-list">Show as one list</a></div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="py-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>

      <div class="py-empty" *ngIf="!loading && !groups.length" data-py-noappr>
        <b>No payslips are waiting for your approval.</b>
        <p>Approvers are set in Payroll › Setup › Approval levels.
          <a class="py-link" *ngIf="canSetup" routerLink="/main-sidebar/salary-options/payroll-approval-level">Open Approval levels</a></p>
      </div>

      <div class="py-group" *ngFor="let g of groups" [attr.data-py-agroup]="g.run.id">
        <header>
          <div>
            <h3>{{ g.run.name || g.run.period }}</h3>
            <span class="py-muted">{{ g.run.period }} · {{ g.run.branches.join(' · ') }}<span *ngIf="g.run.payment_date"> · <span>Pay date</span> {{ g.run.payment_date | date:'dd/MM/yyyy' }}</span></span>
          </div>
          <div class="figs">
            <div>Payslips<b>{{ g.count }}</b></div>
            <div>Gross (AED)<b>{{ g.gross | number:'1.2-2' }}</b></div>
            <div>Deductions (AED)<b>{{ g.deductions | number:'1.2-2' }}</b></div>
            <div>Net (AED)<b>{{ g.net | number:'1.2-2' }}</b></div>
          </div>
          <div class="py-tools">
            <a class="py-btn sm" *ngIf="canRun" [routerLink]="['/main-sidebar/salary-options/payroll-run', g.run.id]">Open the run</a>
            <button type="button" class="py-btn sm danger" [disabled]="busy" (click)="reject(g)" data-py-reject>Reject {{ selCount(g) ? selCount(g) + ' ticked' : 'all' }}</button>
            <button type="button" class="py-btn sm primary" [disabled]="busy" (click)="approve(g)" data-py-approve>Approve {{ selCount(g) ? selCount(g) + ' ticked' : 'all ' + g.count }}</button>
          </div>
        </header>
        <div class="py-scroll">
          <table class="py-t" zPlain>
            <thead><tr><th style="width:34px"><input type="checkbox" [checked]="allSel(g)" (change)="selAll(g, $any($event.target).checked)" aria-label="Tick all"></th>
              <th>Employee</th><th>Department</th><th>Level</th><th class="num">Gross</th><th class="num">Deductions</th><th class="num">Net (AED)</th></tr></thead>
            <tbody>
              <tr *ngFor="let it of g.items" [attr.data-py-aitem]="it.approval_id">
                <td><input type="checkbox" [(ngModel)]="sel[it.approval_id]" [attr.aria-label]="'Tick ' + it.name"></td>
                <td><button type="button" class="py-link nm" (click)="drill(it.payslip_id)">{{ it.name }}</button><span class="sub">{{ it.code }} · {{ it.designation }}</span></td>
                <td>{{ it.department || '–' }}</td>
                <td><span class="py-muted">{{ it.level }} · {{ it.role }}</span></td>
                <td class="num">{{ it.gross | number:'1.2-2' }}</td><td class="num">{{ it.deductions | number:'1.2-2' }}</td>
                <td class="num"><b>{{ it.net | number:'1.2-2' }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="py-panel" *ngIf="others.length" style="margin-top:6px">
        <h3>Waiting with other approvers <small>for your information</small></h3>
        <div class="py-prog" *ngFor="let o of others">
          <div class="who"><a class="py-link" [routerLink]="['/main-sidebar/salary-options/payroll-run', o.run.id]">{{ o.run.name || o.run.period }}</a></div>
          <span class="py-muted"><span *ngFor="let w of o.with; let l = last">{{ short(w.approver) }}: {{ w.count }}{{ l ? '' : ' · ' }}</span></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="py-dlg-back" *ngIf="rej" (click)="rej = null">
  <div class="py-dlg" style="width:min(520px,100%)" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
    <header><div><h2>Reject {{ rej.ids.length }} payslip(s)</h2><p>The payroll team sees the reason and corrects the payslips.</p></div>
      <button type="button" class="py-x" (click)="rej = null" aria-label="Close">×</button></header>
    <div class="body"><div class="py-form"><label class="wide">Reason *<input type="text" [(ngModel)]="rej.reason" maxlength="250" data-py-rejreason></label></div></div>
    <footer><button type="button" class="py-btn" (click)="rej = null">Cancel</button>
      <button type="button" class="py-btn primary" [disabled]="busy || !rej.reason.trim()" (click)="doReject()">Reject</button></footer>
  </div>
</div>`,
})
export class PayslipApprovalsComponent implements OnInit {
  groups: any[] = []; others: any[] = [];
  canSetup = false; canRun = false; loading = true; busy = false;
  msg = ''; msgErr = false;
  sel: Record<number, boolean> = {};
  rej: { ids: number[]; reason: string } | null = null;

  constructor(private http: HttpClient, private router: Router, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const d: any = await firstValueFrom(this.http.get(wsUrl('approvals/')));
      this.groups = d.groups || []; this.others = d.others || []; this.canSetup = !!d.can_setup; this.canRun = !!d.can_open_run; this.sel = {};
    } catch (e) { this.msg = errText(e, 'The approvals could not be loaded.'); this.msgErr = true; }
    this.loading = false; this.cd.markForCheck();
  }
  short(n: string): string { return (n || '').split(' (')[0]; }
  selCount(g: any): number { return g.items.filter((i: any) => this.sel[i.approval_id]).length; }
  allSel(g: any): boolean { return g.items.length > 0 && this.selCount(g) === g.items.length; }
  selAll(g: any, on: boolean): void { g.items.forEach((i: any) => this.sel[i.approval_id] = on); }
  ids(g: any): number[] { const s = g.items.filter((i: any) => this.sel[i.approval_id]); return (s.length ? s : g.items).map((i: any) => i.approval_id); }
  drill(id: number): void { this.router.navigate(['/main-sidebar/salary-options/payroll-details', id]); }

  async approve(g: any): Promise<void> {
    const ids = this.ids(g);
    if (!confirm(`Approve ${ids.length} payslip(s) of ${g.run.name || g.run.period}?`)) { return; }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/approval-payroll/bulk_approve/'), { approval_ids: ids, note: '' }));
      this.msg = r?.status || 'Approved.'; this.msgErr = false; await this.load();
    } catch (e) { this.msg = errText(e); this.msgErr = true; }
    this.busy = false; this.cd.markForCheck();
  }
  reject(g: any): void { this.rej = { ids: this.ids(g), reason: '' }; }
  async doReject(): Promise<void> {
    if (!this.rej) { return; }
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/approval-payroll/bulk_reject/'), { approval_ids: this.rej.ids, rejection_reason: this.rej.reason, note: '' }));
      this.msg = r?.status || 'Rejected.'; this.msgErr = false; this.rej = null; await this.load();
    } catch (e) { this.msg = errText(e); this.msgErr = true; }
    this.busy = false; this.cd.markForCheck();
  }
}
