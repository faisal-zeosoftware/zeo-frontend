// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { recordUrl } from '../shared-ui/z-nav';
import { COUNTRY_PACK_UI, cpPack } from '../shared-ui/country-pack.service';   // v1.14.0

/** v1.10.0 – approve or reject leave encashment: the balance goes down on approval and the next payroll pays it. */
@Component({
  selector: 'app-encashment-approvals',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule, ZListDirective],
  styleUrls: ['./leave-policy.css'],
  styles: [`
.enc-steps{min-width:200px}.enc-step{display:flex;gap:6px;align-items:flex-start;font-size:12px;line-height:1.4;color:#5d6670}
.enc-step .dot{width:9px;height:9px;border-radius:50%;border:2px solid #b8c0c8;margin-top:3px;flex:none}
.enc-new{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;background:#f7f9fc;border:1px solid #e3e7ef;border-radius:10px;padding:12px;margin-bottom:12px}.enc-new label{display:flex;flex-direction:column;font-size:12px;color:#5d6670;gap:4px}.enc-new select,.enc-new input{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;min-width:160px}.enc-new .wide input{min-width:260px}
.enc-step.done{color:#1f2a33}.enc-step.done .dot{background:#2e8b57;border-color:#2e8b57}.enc-step.next .dot{border-color:#c98a00}
`],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <!-- v1.62.0 people: Leave encashment and Encashment approvals are one register (title and first filter from the route) -->
          <h1 class="page-title">{{ title }}</h1>
          <p class="lp-desc">Leave encashment requests with the policy checks. When the approval chain is on, HR confirms the balance, Finance verifies the amount and management gives the final approval – each step by a different person. Approving takes the days off the balance; the amount is paid with the next payroll.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn primary" (click)="newOpen = !newOpen" style="margin-right:8px">New encashment</button>
          <select [(ngModel)]="status" (ngModelChange)="load()" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" aria-label="Status">
            <option value="pending,draft">Waiting for approval</option><option value="approved">Approved, not paid yet</option><option value="processed">Paid</option><option value="rejected">Rejected</option><option value="">All</option></select>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <form class="enc-new" *ngIf="newOpen" (ngSubmit)="create()">
        <label>Employee<select [(ngModel)]="nf.employee" name="employee" required><option [ngValue]="null">–</option><option *ngFor="let e of emps" [ngValue]="e.id">{{ e.label }}</option></select></label>
        <label>Leave type<select [(ngModel)]="nf.leave_type" name="leave_type" required><option [ngValue]="null">–</option><option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option></select></label>
        <label>Days<input type="number" min="0.5" step="0.5" [(ngModel)]="nf.encashment_days" name="days" required></label>
        <label class="wide">Remarks<input type="text" [(ngModel)]="nf.remarks" name="remarks"></label>
        <button type="submit" class="lp-btn primary" [disabled]="busy || !nf.employee || !nf.leave_type || !nf.encashment_days">Send for approval</button>
        <button type="button" class="lp-btn" (click)="newOpen = false">Cancel</button>
      </form>
      <p class="lp-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <table class="table" *ngIf="!loading">
        <thead><tr><th>Employee</th><th>Leave type</th><th>Days</th><th>{{ 'Amount (AED)' | zc }}</th><th>Balance now</th><th>Requested</th><th>Status</th><th>Checks</th><th>Approval steps</th><th>Remarks</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td><a href="" (click)="$event.preventDefault(); open(r)">{{ r.employee }}</a></td><td>{{ r.leave_type }}</td><td>{{ r.days }}</td>
            <td>{{ r.amount | number:'1.2-2' }}</td><td>{{ r.balance_now }}</td><td>{{ r.requested | date:'dd/MM/yyyy' }}</td><td>{{ r.status }}</td>
            <td><span class="lp-ok" *ngIf="!r.problems.length && (r.status === 'Pending Approval' || r.status === 'Draft')">OK</span><span class="lp-bad" *ngFor="let p of r.problems">{{ p }} </span><span *ngIf="r.payroll_run">{{ r.payroll_run }}</span></td>
            <td class="enc-steps">
              <ng-container *ngIf="r.steps?.chain; else noChain">
                <div *ngFor="let s of r.steps.steps" class="enc-step" [class.done]="s.done" [class.next]="r.steps.next === s.step">
                  <span class="dot" aria-hidden="true"></span>
                  <span><b>{{ s.label }}</b><ng-container *ngIf="s.done"> – {{ s.by }}<span class="lp-muted"> {{ s.at | date:'dd/MM HH:mm' }}</span></ng-container>
                    <ng-container *ngIf="!s.done && r.steps.next === s.step"> – next</ng-container></span>
                </div>
              </ng-container>
              <ng-template #noChain><span class="lp-muted">One approval</span></ng-template>
            </td>
            <td>{{ r.remarks || '-' }}</td>
            <td><ng-container *ngIf="r.status === 'Pending Approval' || r.status === 'Draft'">
              <ng-container *ngIf="r.steps?.chain && r.steps.next && r.steps.next !== 'management'">
                <button type="button" class="lp-btn primary" [disabled]="busy || r.problems.length" (click)="step(r)">{{ r.steps.next === 'hr' ? 'Confirm balance (HR)' : 'Verify amount (Finance)' }}</button>
              </ng-container>
              <button type="button" class="lp-btn primary" *ngIf="!r.steps?.chain || r.steps.next === 'management'" [disabled]="busy || r.problems.length" (click)="act(r, 'approve')">{{ r.steps?.chain ? 'Final approval' : 'Approve' }}</button>
              <button type="button" class="lp-btn danger" [disabled]="busy" (click)="act(r, 'reject')" style="margin-left:6px">Reject</button></ng-container></td>
          </tr>
        </tbody>
      </table>
      <p class="lp-muted" *ngIf="!loading && !rows.length">{{ status ? 'No encashment in this status. Choose "All" to see every encashment.' : 'No leave encashment yet – use New encashment.' }}</p>
    </div>
  </div>
</div>`,
})
export class EncashmentApprovalsComponent implements OnInit {
  rows: any[] = []; status = 'pending,draft'; loading = false; busy = false; msg = ''; msgErr = false;
  title = 'Encashment approvals';   // v1.62.0 people
  newOpen = false; nf: any = { employee: null, leave_type: null, encashment_days: null, remarks: '' }; emps: any[] = []; types: any[] = [];

  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef, private route: ActivatedRoute) {
    const d = this.route.snapshot.data || {};
    if (d['title']) { this.title = d['title']; }
    if (d['status'] !== undefined) { this.status = d['status']; }
  }
  private url(p: string, q = ''): string { return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }

  ngOnInit(): void { this.load(); this.lookups(); }

  /** v1.62.0 people: HR records an encashment here (was the old Leave encashment screen). */
  private async lookups(): Promise<void> {
    try {
      const e: any = await firstValueFrom(this.http.get<any>(this.url('employee/api/emplist/')));
      this.emps = (Array.isArray(e) ? e : e?.results || []).map((x: any) => ({ id: x.id, label: `${[x.emp_first_name, x.emp_last_name].filter(Boolean).join(' ')} (${x.emp_code})` }));
      const t: any = await firstValueFrom(this.http.get<any>(this.url('calendars/api/leave-type/')));
      this.types = (Array.isArray(t) ? t : t?.results || []).filter((x: any) => (x.leave_category || 'annual') === 'annual');
    } catch { /* the form stays empty */ }
    this.cd.detectChanges();
  }

  async create(): Promise<void> {
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url('payroll/api/emp-leave-encashment/'), { ...this.nf, status: 'pending' }));
      this.msg = 'Encashment sent for approval.'; this.msgErr = false; this.newOpen = false;
      this.nf = { employee: null, leave_type: null, encashment_days: null, remarks: '' }; await this.load();
    } catch (e: any) {
      const d = e?.error; this.msg = (d && (d.detail || Object.values(d).flat().join(' '))) || 'It could not be saved.'; this.msgErr = true;
    }
    this.busy = false; this.cd.detectChanges();
  }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try { this.rows = (await firstValueFrom(this.http.get<any>(this.url('leave-policy/api/encashments/', this.status ? `&status=${this.status}` : '')))).rows; }
    catch (e: any) { this.rows = []; this.msg = e?.error?.detail || 'Could not load encashments.'; this.msgErr = true; }
    this.loading = false; this.cd.detectChanges();
  }

  async act(r: any, action: 'approve' | 'reject'): Promise<void> {
    let remarks = '';
    if (action === 'reject') { remarks = prompt('Reason for rejecting') || ''; if (!remarks) { return; } }
    this.busy = true;
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url('leave-policy/api/encashments/'), { id: r.id, action, remarks }));
      this.msg = action === 'approve' ? `Approved: ${r.days} days of ${r.employee} – ${cpPack().currency.code} ${Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} with the next payroll.` : `Rejected: ${r.employee}.`;
      this.msgErr = false; await this.load();
    } catch (e: any) { this.msg = e?.error?.detail || 'It could not be done.'; this.msgErr = true; }
    this.busy = false; this.cd.detectChanges();
  }

  /** v1.18.0: HR confirms the balance / Finance verifies the amount (approval chain switched on in the payroll controls). */
  async step(r: any): Promise<void> {
    const note = prompt(r.steps.next === 'hr' ? 'Note (balance and eligibility checked)' : 'Note (amount verified)') ?? null;
    if (note === null) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url(`payroll-plus/api/encashments/${r.id}/steps/`), { step: r.steps.next, note }));
      this.msg = r.steps.next === 'hr' ? `Balance confirmed for ${r.employee} – Finance verifies next.` : `Amount verified for ${r.employee} – waiting for the final approval.`;
      this.msgErr = false; await this.load();
    } catch (e: any) { this.msg = e?.error?.detail || 'It could not be done.'; this.msgErr = true; }
    this.busy = false; this.cd.detectChanges();
  }

  open(r: any): void { this.router.navigateByUrl(recordUrl('PayrollManagement.LeaveEncashment', r.id)); }
}
