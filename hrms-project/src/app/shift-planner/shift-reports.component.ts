/**
 * v1.12.0 Shift planner – Reports: shift roster (published days per employee) and shift requests (swaps, changes,
 * cancellations, open-shift claims). HR sees their branches, managers their team. Both are in the report centre too
 * ('shift-roster', 'shift-requests').
 * API: reports/roster/?from&to&branch&department&status[&export=csv], reports/requests/?from&to&status[&export=csv]
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, SpMeta, addDays, isoDate, niceDate } from './sp-api.service';

@Component({
  selector: 'app-sp-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section"><div class="lp-head"><div>
      <h1 class="page-title">Shift reports</h1>
      <p class="lp-desc">The published roster and all shift requests for a period. Download them as CSV for Excel.</p>
    </div></div>
      <div class="lp-tabs"><button type="button" [class.on]="kind === 'roster'" (click)="kind = 'roster'; load()">Roster</button><button type="button" [class.on]="kind === 'requests'" (click)="kind = 'requests'; load()">Requests</button></div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg err" *ngIf="msg" role="status">{{ msg }}</div>
      <div class="sp-bar">
        <label>From <input type="date" [(ngModel)]="from"></label><label>To <input type="date" [(ngModel)]="to"></label>
        <select *ngIf="kind === 'roster'" [(ngModel)]="branch" aria-label="Branch"><option [ngValue]="null">All my branches</option><option *ngFor="let b of meta?.branches" [ngValue]="b.id">{{ b.branch_name }}</option></select>
        <select *ngIf="kind === 'roster'" [(ngModel)]="status" aria-label="Roster status"><option value="published">Published rosters</option><option value="">All rosters (drafts too)</option></select>
        <button type="button" class="lp-btn primary" (click)="load()">Show</button>
        <button type="button" class="lp-btn" (click)="csv()">Download CSV</button>
      </div>
      <p class="lp-muted">{{ rows.length }} row(s)</p>
      <div class="lp-scroll" *ngIf="rows.length">
        <table class="lp-mini" *ngIf="kind === 'roster'">
          <thead><tr><th>Employee</th><th>Branch</th><th>Department</th><th>Date</th><th>Shift</th><th>Time</th><th>Hours</th><th>Night</th><th>Roster</th><th>Planned by</th><th>Changed after publishing</th></tr></thead>
          <tbody><tr *ngFor="let r of rows"><td>{{ r.employee }}</td><td>{{ r.branch }}</td><td>{{ r.department }}</td><td>{{ nice(r.date) }}</td><td>{{ r.shift }}</td>
            <td>{{ r.start ? r.start + '–' + r.end : '' }}</td><td>{{ r.hours }}</td><td>{{ r.night ? 'Yes' : '' }}</td><td>{{ r.roster }} ({{ r.roster_status }})</td><td>{{ r.source }}</td><td>{{ r.changed_after_publish ? 'Yes' : '' }}</td></tr></tbody>
        </table>
        <table class="lp-mini" *ngIf="kind === 'requests'">
          <thead><tr><th>Request</th><th>Employee</th><th>Day</th><th>From</th><th>To</th><th>Swap with</th><th>Reason</th><th>Status</th><th>Decided by</th></tr></thead>
          <tbody><tr *ngFor="let r of rows"><td>{{ r.kind_label }}</td><td>{{ r.employee }}</td><td>{{ nice(r.date) }}</td><td>{{ r.from_shift }}</td><td>{{ r.to_shift }}</td>
            <td>{{ r.swap_employee }}</td><td>{{ r.reason }}</td><td><span class="sp-tag" [ngClass]="r.status">{{ r.status_label }}</span></td><td>{{ r.decided_by }} {{ r.decision_note }}</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
</div>`,
})
export class SpReportsComponent implements OnInit {
  meta: SpMeta | null = null;
  kind: 'roster' | 'requests' = 'roster';
  from = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  to = addDays(isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)), -1);
  branch: number | null = null; status = 'published';
  rows: any[] = []; msg = '';
  nice = niceDate;
  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> { this.meta = await this.api.meta().catch(() => null); await this.load(); }
  q(): Record<string, any> { return this.kind === 'roster' ? { from: this.from, to: this.to, branch: this.branch, status: this.status } : { from: this.from, to: this.to }; }
  async load(): Promise<void> {
    try { this.rows = await this.api.get(`reports/${this.kind}/`, this.q()); this.msg = ''; } catch (e) { this.rows = []; this.msg = SpApiService.error(e); }
    this.cd.markForCheck();
  }
  csv(): void { this.api.download(`reports/${this.kind}/`, { ...this.q(), export: 'csv' }, `shift_${this.kind}_${this.from}_${this.to}.csv`); }
}
