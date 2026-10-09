import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectControlApiService, STATUS_LABEL, hrs } from './project-control-api.service';

/** Timesheet approvals: entries waiting for me (project manager / reporting manager), grouped by employee and week. */
@Component({
  selector: 'app-timesheet-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./project-control.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="pc-head">
        <div>
          <h1 class="page-title">Timesheet approvals</h1>
          <p class="pc-desc">Weeks submitted by the members of your projects and the employees who report to you.
            Approve to lock the time and freeze its cost; reject with a reason to send it back for correction.</p>
        </div>
        <div class="pc-actions">
          <button type="button" class="pc-btn" (click)="load()" [disabled]="loading">Refresh</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="pc-tabs">
        <button type="button" *ngFor="let t of tabs" [class.on]="status === t.k" (click)="status = t.k; load()">{{ t.l }}</button>
      </div>
      <p class="pc-msg err" *ngIf="err">{{ err }}</p>
      <p class="pc-msg" *ngIf="msg">{{ msg }}</p>
      <p class="pc-muted" *ngIf="loading">Loading…</p>
      <p class="pc-muted" *ngIf="!loading && !groups.length">Nothing here.</p>

      <div class="pc-group" *ngFor="let g of groups">
        <header>
          <div class="who">{{ g.employee }}</div>
          <div class="pc-muted">Week {{ g.week_start | date:'dd MMM' }} – {{ g.week_end | date:'dd MMM yyyy' }} ·
            <b>{{ h(g.hours) }} h</b> ({{ h(g.billable_hours) }} billable)</div>
        </header>
        <div class="pc-rows">
          <div class="pc-row" *ngFor="let e of g.entries">
            <input type="checkbox" *ngIf="status === 'submitted'" [(ngModel)]="sel[e.id]" [attr.aria-label]="'Select entry ' + e.id">
            <div class="main">
              <div class="t">{{ e.project_title }}<span *ngIf="e.task_title"> · {{ e.task_title }}</span></div>
              <div class="s">{{ e.date | date:'EEE dd MMM' }} · {{ e.description }}<span *ngIf="e.corrections"> · corrected {{ e.corrections }}×</span>
                <span *ngIf="e.rejection_reason"> · reason: {{ e.rejection_reason }}</span></div>
            </div>
            <div class="r">
              <div><b>{{ h(e.hours) }} h</b></div>
              <span class="pc-tag" [ngClass]="e.approval_status">{{ lbl(e.approval_status) }}</span>
              <span class="pc-tag" *ngIf="!e.billable">non-billable</span>
            </div>
          </div>
        </div>
        <ng-container *ngIf="status === 'submitted'">
          <div class="pc-reason">
            <button type="button" class="pc-btn sm" (click)="selectAll(g, true)">Select all</button>
            <button type="button" class="pc-btn sm green" (click)="approve(g)" [disabled]="busy || !picked(g).length">Approve {{ picked(g).length || '' }}</button>
            <input [(ngModel)]="reason[key(g)]" placeholder="Reason for rejection" aria-label="Reason for rejection">
            <button type="button" class="pc-btn sm danger" (click)="reject(g)" [disabled]="busy || !picked(g).length">Reject</button>
          </div>
        </ng-container>
      </div>
    </div>
  </div>
</div>
`,
})
export class TimesheetApprovalsComponent implements OnInit {
  tabs = [{ k: 'submitted', l: 'Waiting for me' }, { k: 'approved', l: 'Approved' }, { k: 'rejected', l: 'Rejected' }];
  status = 'submitted';
  groups: any[] = [];
  sel: Record<number, boolean> = {};
  reason: Record<string, string> = {};
  loading = false;
  busy = false;
  msg = '';
  err = '';
  h = hrs;
  lbl = (s: string) => STATUS_LABEL[s] ?? s;

  constructor(private api: ProjectControlApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  key(g: any): string { return `${g.employee_id}-${g.week_start}`; }

  async load(): Promise<void> {
    this.loading = true;
    this.err = '';
    try {
      const r = await this.api.get('approvals/', { status: this.status });
      this.groups = r.groups || [];
      this.sel = {};
      if (this.status === 'submitted') this.groups.forEach(g => this.selectAll(g, true));
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The approvals could not be loaded.');
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  selectAll(g: any, on: boolean): void { g.entries.forEach((e: any) => (this.sel[e.id] = on)); }

  picked(g: any): number[] { return g.entries.filter((e: any) => this.sel[e.id]).map((e: any) => e.id); }

  async approve(g: any): Promise<void> {
    this.busy = true;
    this.err = this.msg = '';
    try {
      const r = await this.api.post('approvals/approve/', { ids: this.picked(g) });
      this.msg = `${r.approved.length} entr${r.approved.length === 1 ? 'y' : 'ies'} of ${g.employee} approved.` + this.skipped(r);
      await this.load();
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'Approval failed.');
    }
    this.busy = false;
  }

  async reject(g: any): Promise<void> {
    const reason = (this.reason[this.key(g)] || '').trim();
    if (!reason) {
      this.err = 'Write the reason for the rejection first – the employee sees it.';
      return;
    }
    this.busy = true;
    this.err = this.msg = '';
    try {
      const r = await this.api.post('approvals/reject/', { ids: this.picked(g), reason });
      this.msg = `${r.rejected.length} entr${r.rejected.length === 1 ? 'y' : 'ies'} of ${g.employee} sent back for correction.` + this.skipped(r);
      this.reason[this.key(g)] = '';
      await this.load();
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'Rejection failed.');
    }
    this.busy = false;
  }

  private skipped(r: any): string {
    return r.skipped?.length ? ` ${r.skipped.length} skipped: ` + r.skipped.map((s: any) => s.reason).join(' ') : '';
  }
}
