import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { recordUrl } from '../shared-ui/z-nav';

/** v1.10.0 – approve or reject leave encashment: the balance goes down on approval and the next payroll pays it. */
@Component({
  selector: 'app-encashment-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['./leave-policy.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Encashment approvals</h1>
          <p class="lp-desc">Leave encashment requests with the policy checks. Approving takes the days off the balance; the amount is paid with the next payroll (component with formula <code>leave_encashment_amount</code>).</p>
        </div>
        <div class="lp-actions">
          <select [(ngModel)]="status" (ngModelChange)="load()" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px" aria-label="Status">
            <option value="pending,draft">Waiting for approval</option><option value="approved">Approved, not paid yet</option><option value="processed">Paid</option><option value="rejected">Rejected</option><option value="">All</option></select>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="lp-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <table class="table" *ngIf="!loading">
        <thead><tr><th>Employee</th><th>Leave type</th><th>Days</th><th>Amount (AED)</th><th>Balance now</th><th>Requested</th><th>Status</th><th>Checks</th><th>Remarks</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td><a href="" (click)="$event.preventDefault(); open(r)">{{ r.employee }}</a></td><td>{{ r.leave_type }}</td><td>{{ r.days }}</td>
            <td>{{ r.amount | number:'1.2-2' }}</td><td>{{ r.balance_now }}</td><td>{{ r.requested | date:'dd/MM/yyyy' }}</td><td>{{ r.status }}</td>
            <td><span class="lp-ok" *ngIf="!r.problems.length && (r.status === 'Pending Approval' || r.status === 'Draft')">OK</span><span class="lp-bad" *ngFor="let p of r.problems">{{ p }} </span><span *ngIf="r.payroll_run">{{ r.payroll_run }}</span></td>
            <td>{{ r.remarks || '-' }}</td>
            <td><ng-container *ngIf="r.status === 'Pending Approval' || r.status === 'Draft'">
              <button type="button" class="lp-btn primary" [disabled]="busy || r.problems.length" (click)="act(r, 'approve')">Approve</button>
              <button type="button" class="lp-btn danger" [disabled]="busy" (click)="act(r, 'reject')" style="margin-left:6px">Reject</button></ng-container></td>
          </tr>
        </tbody>
      </table>
      <p class="lp-muted" *ngIf="!loading && !rows.length">Nothing here.</p>
    </div>
  </div>
</div>`,
})
export class EncashmentApprovalsComponent implements OnInit {
  rows: any[] = []; status = 'pending,draft'; loading = false; busy = false; msg = ''; msgErr = false;

  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }

  ngOnInit(): void { this.load(); }

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
      this.msg = action === 'approve' ? `Approved: ${r.days} days of ${r.employee} – AED ${Number(d.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} with the next payroll.` : `Rejected: ${r.employee}.`;
      this.msgErr = false; await this.load();
    } catch (e: any) { this.msg = e?.error?.detail || 'It could not be done.'; this.msgErr = true; }
    this.busy = false; this.cd.detectChanges();
  }

  open(r: any): void { this.router.navigateByUrl(recordUrl('PayrollManagement.LeaveEncashment', r.id)); }
}
