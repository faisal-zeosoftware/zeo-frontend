import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ApApi, STATUS_COLOR } from './ap-api';

const STATES: [string, string][] = [['in', 'In now'], ['out', 'Clocked out'], ['late', 'Late'], ['absent', 'Absent'], ['missing_punch', 'Missing punch'],
  ['not_marked', 'Not in yet'], ['half_day', 'Half day'], ['leave', 'On leave'], ['weekly_off', 'Off'], ['holiday', 'Holiday']];

/** HR / manager daily board (v1.12.0): who is in, out, late, absent, on leave or has a missing punch on a day. */
@Component({
  selector: 'app-attendance-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./attendance-plus.css'],
  template: `
<div class="ap-wrap">
  <div class="ap-head">
    <div><h1>Daily Attendance Board</h1>
      <p class="ap-desc">Who is in, out, late, absent or missing a punch. Managers see their team; HR sees their branches. Click a tile to filter.</p></div>
    <div class="ap-tools">
      <input class="ap-input" type="date" [(ngModel)]="day" (change)="load()" aria-label="Day">
      <button type="button" class="ap-btn" (click)="load()" [disabled]="loading">Refresh</button>
    </div>
  </div>
  <p class="ap-msg err" *ngIf="msg">{{ msg }}</p>
  <div class="ap-tiles" *ngIf="data">
    <button type="button" class="ap-tile" [class.on]="!state" (click)="state = ''"><div class="k">Everyone</div><div class="v">{{ data.rows.length }}</div></button>
    <button type="button" class="ap-tile" *ngFor="let s of states" [class.on]="state === s[0]" (click)="state = s[0]">
      <div class="k">{{ s[1] }}</div><div class="v">{{ data.counts[s[0]] || 0 }}</div></button>
  </div>
  <p class="ap-muted" *ngIf="loading">Loading…</p>
  <div class="ap-card" *ngIf="data">
    <input class="ap-input" placeholder="Search name or code" [(ngModel)]="q" style="margin-bottom:8px;width:240px">
    <div class="ap-scroll">
      <table class="ap-table">
        <tr><th>Employee</th><th>Shift</th><th>Status</th><th>In</th><th>Out</th><th>Worked</th><th>Late</th><th>Early</th><th>OT</th><th>Method</th></tr>
        <tr *ngFor="let r of rows()">
          <td>{{ r.employee_display }}</td><td>{{ r.shift_name }} <span class="ap-muted" *ngIf="r.shift_start_local">{{ r.shift_start_local }}–{{ r.shift_end_local }}</span></td>
          <td><span class="ap-tag" [ngClass]="color(r.board_state)">{{ label(r.board_state, r.status_label) }}</span>
            <span class="ap-tag red" *ngIf="r.is_late" style="margin-left:4px">Late</span></td>
          <td>{{ r.first_in_local }}</td><td>{{ r.last_out_local }}</td><td>{{ r.worked }}</td><td>{{ r.late }}</td><td>{{ r.early }}</td>
          <td>{{ r.ot_total_minutes ? r.ot : '' }}</td><td>{{ (r.sources || []).join(', ') }}</td>
        </tr>
      </table>
      <p class="ap-muted" *ngIf="!rows().length">Nobody in this list.</p>
    </div>
  </div>
</div>`,
})
export class AttendanceBoardComponent implements OnInit {
  api: ApApi;
  day = new Date().toISOString().slice(0, 10);
  data: any = null;
  state = '';
  q = '';
  msg = '';
  loading = false;
  states = STATES;

  constructor(http: HttpClient, rec: ZRecordService, private cdr: ChangeDetectorRef) { this.api = new ApApi(http, rec); }

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true; this.msg = '';
    try { this.data = await this.api.get('days/board/', { date: this.day }); } catch (e) { this.msg = ApApi.err(e, 'The board could not be loaded.'); }
    this.loading = false; this.cdr.markForCheck();
  }

  color(s: string): string { return STATUS_COLOR[s] || 'grey'; }
  label(s: string, fallback: string): string { return (STATES.find(x => x[0] === s) || [s, fallback])[1]; }

  rows(): any[] {
    const q = this.q.trim().toLowerCase();
    return (this.data?.rows || []).filter((r: any) =>
      (!this.state || r.board_state === this.state || (this.state === 'late' && r.is_late)) &&
      (!q || String(r.employee_display).toLowerCase().includes(q)));
  }
}
