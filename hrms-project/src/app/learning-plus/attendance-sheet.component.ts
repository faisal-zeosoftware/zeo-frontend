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
  // v1.62.0 talent-ops: opens on the list of sessions that take attendance (was a bare "Pick a session" select and a blank page)
  template: `
<div class="lp-wrap">
  <div class="lp-head">
    <div><h1>Attendance sheet</h1><p class="lp-desc">Tick who attended each day. Attendance % on the result = days present ÷ training days; below 80% is not passed.</p></div>
    <div class="lp-tools" *ngIf="sheet">
      <button type="button" class="lp-btn" (click)="back()" data-back>← All sessions</button>
      <button type="button" class="lp-btn primary" [disabled]="!sheet || busy" (click)="save()" data-save>Save</button>
    </div>
  </div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <ng-container *ngIf="!sheet">
    <div class="lp-tiles" data-att-tiles>
      <div class="lp-tile"><div class="k">To mark</div><div class="v">{{ sum.to_mark || 0 }}</div></div>
      <div class="lp-tile"><div class="k">Partly marked</div><div class="v">{{ sum.partly || 0 }}</div></div>
      <div class="lp-tile"><div class="k">Marked</div><div class="v">{{ sum.marked || 0 }}</div></div>
      <div class="lp-tile"><div class="k">Coming up</div><div class="v">{{ sum.upcoming || 0 }}</div></div>
    </div>
    <div class="lp-card lp-scroll">
      <p class="lp-muted" *ngIf="loading">Loading…</p>
      <p class="lp-muted" *ngIf="!loading && !rows.length">No published session yet. Publish a session in the Training calendar; its confirmed participants appear here to mark.</p>
      <table class="lp-table" *ngIf="rows.length" data-att-sessions>
        <thead><tr><th>Dates</th><th>Session</th><th>Trainer · venue</th><th class="c">Participants</th><th class="c">Days marked</th><th>Attendance</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows" [attr.data-session]="r.id">
            <td class="nw">{{ r.start | date:'dd/MM/yyyy' }}<span *ngIf="r.end && r.end !== r.start" class="lp-muted"> – {{ r.end | date:'dd/MM/yyyy' }}</span></td>
            <td><b>{{ r.course }}</b><div class="lp-muted">{{ r.code }} · {{ r.status_label }}</div></td>
            <td class="lp-muted">{{ r.trainer || '–' }}<div>{{ r.venue }}</div></td>
            <td class="c">{{ r.confirmed }}</td>
            <td class="c">{{ r.days_marked }} / {{ r.days }}</td>
            <td><span class="lp-tag" [ngClass]="r.state === 'marked' ? 'green' : r.state === 'to_mark' ? 'amber' : r.state === 'partly' ? 'amber' : 'grey'">{{ stateWord(r.state) }}</span></td>
            <td style="text-align:end"><button type="button" class="lp-btn small" [class.primary]="r.state === 'to_mark' || r.state === 'partly'" (click)="openSession(r.id)" [disabled]="!r.confirmed">{{ r.state === 'marked' ? 'View sheet' : r.state === 'upcoming' ? 'Open sheet' : 'Mark attendance' }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </ng-container>
  <div class="lp-card lp-scroll" *ngIf="sheet">
    <h2 style="margin-top:0">{{ current?.course }} <span class="lp-muted">{{ current?.code }} · {{ current?.start | date:'dd/MM/yyyy' }}</span></h2>
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
  rows: any[] = []; sum: any = {}; loading = true;   // v1.62.0 talent-ops
  private api: LpApi;

  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new LpApi(http, rec); }

  async ngOnInit(): Promise<void> {
    await this.loadList();
  }

  // v1.62.0 talent-ops: the sessions with their attendance state; a row opens its sheet
  async loadList(): Promise<void> {
    this.loading = true;
    try { const r: any = await this.api.get('learning/plus/api/attendance/sessions/'); this.rows = r.rows || []; this.sum = r.summary || {}; }
    catch (e) { this.rows = []; this.msg = LpApi.err(e, 'Could not load the sessions.'); this.err = true; }
    this.loading = false; this.cd.detectChanges();
  }
  get current(): any { return this.rows.find(r => r.id === this.session); }
  stateWord(s: string): string { return ({ to_mark: 'To mark', partly: 'Partly marked', marked: 'Marked', upcoming: 'Coming up' } as any)[s] || s; }
  openSession(id: number): void { this.session = id; this.load(); }
  back(): void { this.session = null; this.sheet = null; this.msg = ''; this.loadList(); }

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
