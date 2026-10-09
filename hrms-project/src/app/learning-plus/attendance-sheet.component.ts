import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ZRecordService } from '../shared-ui/z-record.service';
import { LpApi } from './lp-api';

/** Date-wise attendance of a session: present tick + hours per participant per day; Save updates attendance % on results. */
@Component({
  selector: 'app-attendance-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./learning-plus.css'],
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Attendance Sheet</h1><p class="lp-desc">Tick who attended each day. Attendance % on the result = days present ÷ training days; below 80% is not passed.</p></div>
    <div class="lp-tools">
      <select [(ngModel)]="session" (ngModelChange)="load()" aria-label="Session" style="max-width:300px">
        <option [ngValue]="null">Pick a session</option>
        <option *ngFor="let s of sessions" [ngValue]="s.id">{{ s.code }} - {{ s.course_title }} ({{ s.start_date }})</option>
      </select>
      <button type="button" class="lp-btn primary" [disabled]="!sheet || busy" (click)="save()">Save</button>
    </div>
  </div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="lp-card lp-scroll" *ngIf="sheet">
    <p class="lp-muted" *ngIf="!sheet.rows.length">No confirmed participants.</p>
    <table class="lp-table lp-att" *ngIf="sheet.rows.length">
      <thead><tr><th>Participant</th><th *ngFor="let d of sheet.dates" class="c">{{ d | date:'EEE dd/MM' }}</th><th>%</th></tr></thead>
      <tbody>
        <tr *ngFor="let r of sheet.rows">
          <td style="min-width:140px">{{ r.employee }}</td>
          <td class="c" *ngFor="let d of sheet.dates">
            <input type="checkbox" [(ngModel)]="mark(r, d).present" [attr.aria-label]="r.employee + ' ' + d">
            <input type="number" min="0" max="24" step="0.5" [(ngModel)]="mark(r, d).hours" placeholder="h" [attr.aria-label]="'hours ' + d">
          </td>
          <td>{{ r.attendance_percent ?? '–' }}</td>
        </tr>
      </tbody>
    </table>
    <button type="button" class="lp-btn small" *ngIf="sheet.rows.length" (click)="all(true)" style="margin-top:8px">All present</button>
  </div>
</div>`,
})
export class AttendanceSheetComponent implements OnInit {
  sessions: any[] = []; session: number | null = null; sheet: any = null; busy = false; msg = ''; err = false;
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  async ngOnInit(): Promise<void> {
    try { const r: any = await this.api.get('learning/api/sessions/', { status: 'published,in_progress,completed' }); this.sessions = Array.isArray(r) ? r : r?.results || []; }
    catch { this.sessions = []; }
    this.cd.detectChanges();
  }

  mark(r: any, d: string): any {
    if (!r.marks[d]) { r.marks[d] = { present: false, hours: null, _new: true }; }
    return r.marks[d];
  }

  all(v: boolean): void { this.sheet.rows.forEach((r: any) => this.sheet.dates.forEach((d: string) => (this.mark(r, d).present = v))); }

  async load(): Promise<void> {
    this.sheet = null; this.msg = '';
    if (!this.session) { this.cd.detectChanges(); return; }
    try { this.sheet = await this.api.get('learning/plus/api/attendance/sheet/', { session: this.session }); }
    catch (e) { this.msg = LpApi.err(e, 'Could not load the sheet.'); this.err = true; }
    this.cd.detectChanges();
  }

  async save(): Promise<void> {
    const rows: any[] = [];
    this.sheet.rows.forEach((r: any) => this.sheet.dates.forEach((d: string) => {
      const m = r.marks[d];
      if (m && !(m._new && !m.present && !m.hours)) { rows.push({ nomination: r.nomination, date: d, present: !!m.present, hours: m.hours ?? null }); }
    }));
    this.busy = true;
    try {
      const res: any = await this.api.post('learning/plus/api/attendance/bulk/', { session: this.session, rows });
      this.msg = res.detail; this.err = false; await this.load(); this.msg = res.detail;
    } catch (e) { this.msg = LpApi.err(e); this.err = true; }
    this.busy = false; this.cd.detectChanges();
  }
}
