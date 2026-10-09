/**
 * v1.12.0 Shift planner – Rosters. HR plans a branch / department for a period (up to 62 days): generate from shift
 * schedules, edit cells, copy the previous week, upload a file, check conflicts (two shifts a day, rest hours, weekly
 * hours, leave, availability), submit → approve / send back → publish. Only published rosters count for attendance,
 * payroll and My schedule; changes after publishing notify the employee. Reporting managers see their team read-only.
 * API: periods/, periods/<id>/, periods/<id>/grid/?from&to, periods/<id>/cells/, periods/<id>/<action>/, upload/roster/,
 *      template/roster/, shift-master/?active=1, meta/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, SpMeta, addDays, mondayOf, niceDate } from './sp-api.service';

@Component({
  selector: 'app-sp-roster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">{{ p ? p.name : 'Shift rosters' }}</h1>
          <p class="lp-desc" *ngIf="!p">Plan who works which shift. Generate a roster from the shift schedules, adjust it, send it for approval and publish it – only published rosters count for attendance, payroll and My schedule.</p>
          <p class="lp-desc" *ngIf="p">{{ p.branch }} · {{ p.department }} · {{ nice(p.date_from) }} – {{ nice(p.date_to) }} · <span class="sp-tag" [ngClass]="p.status">{{ p.status_label }}</span>
            <span *ngIf="p.approver"> · approver {{ p.approver }}</span><span *ngIf="p.decision_note"> · “{{ p.decision_note }}”</span></p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" *ngIf="p" (click)="close()">‹ All rosters</button>
          <button type="button" class="lp-btn primary" *ngIf="!p && meta?.rights?.manage && !form" (click)="openNew()">+ New roster</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>

      <!-- new roster -->
      <div class="sp-panel" *ngIf="form && !p">
        <h2>New roster</h2>
        <div class="lp-form">
          <label>Name<input [(ngModel)]="form.name" maxlength="120" placeholder="e.g. Sharjah warehouse – November"><span class="sp-err" *ngIf="err['name']">{{ err['name'] }}</span></label>
          <label>Branch<select [(ngModel)]="form.branch"><option [ngValue]="null">Choose…</option><option *ngFor="let b of meta?.branches" [ngValue]="b.id">{{ b.branch_name }}</option></select><span class="sp-err" *ngIf="err['branch']">{{ err['branch'] }}</span></label>
          <label>Department<select [(ngModel)]="form.department"><option [ngValue]="null">All departments</option><option *ngFor="let d of meta?.departments" [ngValue]="d.id">{{ d.dept_name }}</option></select></label>
          <label>From<input type="date" [(ngModel)]="form.date_from"><span class="sp-err" *ngIf="err['date_from']">{{ err['date_from'] }}</span></label>
          <label>To<input type="date" [(ngModel)]="form.date_to"><span class="sp-err" *ngIf="err['date_to']">{{ err['date_to'] }}</span></label>
          <label>Approver (optional)<select [(ngModel)]="form.approver"><option [ngValue]="null">Anyone with approval rights</option><option *ngFor="let u of meta?.approvers" [ngValue]="u.id">{{ u.username }}</option></select></label>
          <label>Default shift (optional)<select [(ngModel)]="form.default_shift"><option [ngValue]="null">None</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select>
            <small class="lp-muted" style="font-weight:400">Used on working days of employees without a shift schedule.</small></label>
          <label>Minimum rest between shifts (h)<input type="number" min="0" max="24" [(ngModel)]="form.min_rest_hours"><span class="sp-err" *ngIf="err['min_rest_hours']">{{ err['min_rest_hours'] }}</span></label>
          <label>Most hours in a week<input type="number" min="1" max="168" [(ngModel)]="form.max_week_hours"><span class="sp-err" *ngIf="err['max_week_hours']">{{ err['max_week_hours'] }}</span></label>
          <label class="wide">Notes<textarea [(ngModel)]="form.notes"></textarea></label>
          <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" [(ngModel)]="form.generate" style="height:auto"> Fill it from the shift schedules now</label>
        </div>
        <div class="lp-foot"><button type="button" class="lp-btn" (click)="form = null">Cancel</button><button type="button" class="lp-btn primary" [disabled]="busy" (click)="create()">Create roster</button></div>
      </div>

      <!-- list -->
      <ng-container *ngIf="!p">
        <div class="sp-bar">
          <select [(ngModel)]="statusFilter" (change)="loadList()" aria-label="Status"><option value="">All statuses</option><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="published">Published</option><option value="rejected">Sent back</option></select>
        </div>
        <p class="lp-muted" *ngIf="!list.length">No rosters yet.</p>
        <div class="lp-scroll" *ngIf="list.length">
          <table class="lp-mini">
            <thead><tr><th>Roster</th><th>Branch / department</th><th>Dates</th><th>Status</th><th>Planned days</th><th>Approver</th></tr></thead>
            <tbody>
              <tr *ngFor="let x of list" class="sp-click" (click)="open(x)">
                <td><b>{{ x.name }}</b></td><td>{{ x.branch }}<div class="lp-muted">{{ x.department }}</div></td>
                <td>{{ nice(x.date_from) }} – {{ nice(x.date_to) }}</td><td><span class="sp-tag" [ngClass]="x.status">{{ x.status_label }}</span></td>
                <td>{{ x.entries }}<span class="lp-muted" *ngIf="x.changed_after_publish"> · {{ x.changed_after_publish }} changed</span></td><td>{{ x.approver || '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>

      <!-- roster grid -->
      <ng-container *ngIf="p && grid">
        <div class="sp-bar">
          <select [(ngModel)]="view" (change)="loadGrid()" aria-label="View"><option value="week">Week view</option><option value="all">Whole roster</option></select>
          <ng-container *ngIf="view === 'week'">
            <button type="button" class="lp-btn" (click)="shiftWeek(-7)" aria-label="Previous week">‹</button>
            <b>{{ nice(weekFrom) }}</b>
            <button type="button" class="lp-btn" (click)="shiftWeek(7)" aria-label="Next week">›</button>
          </ng-container>
          <span style="flex:1"></span>
          <ng-container *ngIf="p.can?.edit">
            <button type="button" class="lp-btn" (click)="action('generate')">Fill from schedules</button>
            <button type="button" class="lp-btn" (click)="copyWeek()" title="Copy the week before onto the week shown">Copy previous week</button>
            <label class="lp-btn" style="cursor:pointer">Upload file<input type="file" accept=".csv,.xlsx" (change)="upload($event)" hidden></label>
            <button type="button" class="lp-btn" (click)="template()">Template</button>
          </ng-container>
          <button type="button" class="lp-btn" (click)="action('check')">Check</button>
          <button type="button" class="lp-btn primary" *ngIf="p.can?.submit" (click)="action('submit')">Send for approval</button>
          <button type="button" class="lp-btn primary" *ngIf="p.can?.approve" (click)="action('approve')">Approve</button>
          <button type="button" class="lp-btn danger" *ngIf="p.can?.approve" (click)="reject()">Send back</button>
          <button type="button" class="lp-btn primary" *ngIf="p.can?.publish" (click)="action('publish')">Publish to employees</button>
          <button type="button" class="lp-btn" *ngIf="p.can?.reopen" (click)="action('reopen')">Reopen for changes</button>
          <button type="button" class="lp-btn danger" *ngIf="p.can?.delete" (click)="remove()">Delete</button>
        </div>
        <div class="sp-legend">
          <span *ngFor="let s of grid.shifts"><i [style.background]="s.colour"></i>{{ s.code || s.name }} {{ s.start_time }}–{{ s.end_time }}</span>
          <span><i style="background:#fff4e5"></i>Public holiday</span><span><i style="background:repeating-linear-gradient(135deg,#eef6ff 0 3px,#fff 3px 6px)"></i>Leave</span>
          <span><b style="color:#b42318">!</b> problem</span><span><i style="background:#5b4fe0;border-radius:50%;width:8px;height:8px"></i>changed after publishing</span>
        </div>
        <div class="sp-grid-wrap">
          <table class="sp-grid" zPlain>
            <thead><tr><th class="who">Employee</th><th *ngFor="let d of grid.days" [class.we]="d.weekday === 'Sat' || d.weekday === 'Sun'">{{ d.weekday }}<br>{{ d.day }}</th><th>Hours</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of grid.rows">
                <td class="who" [title]="r.name">{{ r.name }}<small>{{ r.department }}{{ r.designation ? ' · ' + r.designation : '' }}</small></td>
                <td *ngFor="let d of grid.days">
                  <button type="button" class="sp-cell" *ngIf="cell(r, d.date) as c" [class.hol]="c.holiday" [class.leave]="c.leave"
                          [disabled]="!p.can?.edit" (click)="edit(r, d.date, c)" [title]="tip(c)" [attr.aria-label]="r.name + ' ' + d.date + ': ' + (c.label || 'not planned')">
                    <span class="code" *ngIf="c.shift_id" [style.background]="c.colour || '#5b4ff5'">{{ c.code }}</span>
                    <span class="off" *ngIf="c.off">OFF</span>
                    <span class="time" *ngIf="c.start">{{ c.start }}</span>
                    <span class="flag" *ngIf="c.problems.length" [ngClass]="worst(c)">!</span>
                    <span class="chg" *ngIf="c.changed"></span>
                  </button>
                </td>
                <td>{{ r.hours }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul class="sp-problems" *ngIf="problems.length">
          <li *ngFor="let x of problems" [ngClass]="x.level"><b>{{ x.employee }}</b> · {{ nice(x.date) }} – {{ x.message }}</li>
        </ul>
        <div class="lp-scroll" *ngIf="uploadRows.length" style="margin-top:12px">
          <table class="lp-mini"><thead><tr><th>Row</th><th>Employee</th><th>Date</th><th>Shift</th><th>Result</th></tr></thead>
            <tbody><tr *ngFor="let u of uploadRows"><td>{{ u.row }}</td><td>{{ u.employee || u.employee_code }}</td><td>{{ u.date }}</td><td>{{ u.shift }}</td>
              <td [class.lp-bad]="!u.ok" [class.lp-ok]="u.ok">{{ u.ok ? 'OK' : u.errors.join(' ') }}</td></tr></tbody></table>
          <div class="lp-foot"><button type="button" class="lp-btn" (click)="uploadRows = []; uploadFile = null">Cancel</button>
            <button type="button" class="lp-btn primary" [disabled]="!uploadFile || uploadErrors > 0" (click)="commitUpload()">Save {{ uploadRows.length - uploadErrors }} row(s)</button></div>
        </div>
      </ng-container>
    </div>
  </div>

  <!-- cell editor -->
  <div class="lp-modal-back" *ngIf="cellEdit" (click)="cellEdit = null">
    <div class="lp-modal" style="width:min(460px,100%)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Plan a day">
      <header><h2>{{ cellEdit.row.name }} – {{ nice(cellEdit.date) }}</h2><button type="button" class="lp-x" (click)="cellEdit = null" aria-label="Close">×</button></header>
      <div class="body">
        <div class="lp-msg err" *ngIf="cellEdit.cell.leave">{{ cellEdit.cell.leave.type }} leave {{ cellEdit.cell.leave.status }} on this day.</div>
        <ul class="sp-problems" *ngIf="cellEdit.cell.problems.length" style="margin-top:0"><li *ngFor="let x of cellEdit.cell.problems" [ngClass]="x.level">{{ x.message }}</li></ul>
        <div class="lp-form" style="margin-top:6px">
          <label>Shift<select [(ngModel)]="cellEdit.choice"><option value="">Not planned</option><option value="off">Day off</option>
            <option *ngFor="let s of grid.shifts" [value]="s.id">{{ s.name }}{{ s.start_time ? ' (' + s.start_time + '–' + s.end_time + ')' : '' }}</option></select></label>
          <label>Note<input [(ngModel)]="cellEdit.note" maxlength="255"></label>
        </div>
        <p class="lp-muted" *ngIf="p?.status === 'published'">This roster is published – the employee is told about the change.</p>
      </div>
      <footer><button type="button" class="lp-btn" (click)="cellEdit = null">Close</button><button type="button" class="lp-btn primary" (click)="saveCell()">Save</button></footer>
    </div>
  </div>
</div>`,
})
export class SpRosterComponent implements OnInit {
  meta: SpMeta | null = null;
  list: any[] = [];
  statusFilter = '';
  shifts: any[] = [];
  form: any = null; err: Record<string, string> = {};
  p: any = null; grid: any = null; problems: any[] = [];
  view: 'week' | 'all' = 'week'; weekFrom = '';
  cellEdit: any = null;
  uploadRows: any[] = []; uploadErrors = 0; uploadFile: File | null = null;
  msg = ''; msgErr = false; busy = false;
  nice = niceDate;

  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.meta = await this.api.meta(); } catch (e) { this.say(SpApiService.error(e), true); }
    this.shifts = await this.api.get('shift-master/', { active: 1 }).catch(() => []);
    await this.loadList();
  }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }
  async loadList(): Promise<void> { try { this.list = await this.api.get('periods/', { status: this.statusFilter }); } catch (e) { this.say(SpApiService.error(e), true); } this.cd.markForCheck(); }

  openNew(): void {
    const m = mondayOf(addDays(niceIso(), 7));
    this.form = { name: '', branch: this.meta?.branches?.length === 1 ? this.meta.branches[0].id : null, department: null, date_from: m, date_to: addDays(m, 6),
                  approver: null, default_shift: null, min_rest_hours: 8, max_week_hours: 48, notes: '', generate: true };
    this.err = {};
  }
  async create(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.post('periods/', this.form);
      this.form = null;
      this.say(r.generated ? `Roster created: ${r.generated.created} day(s) planned from the shift schedules${r.generated.no_shift ? `, ${r.generated.no_shift} day(s) without a schedule left empty` : ''}.` : 'Roster created.');
      await this.open(r);
    } catch (e) { this.err = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
    this.busy = false;
  }
  async open(x: any): Promise<void> {
    this.p = x; this.view = 'week'; this.weekFrom = mondayOf(String(x.date_from));
    if (this.weekFrom < x.date_from) this.weekFrom = String(x.date_from);
    await this.loadGrid();
  }
  close(): void { this.p = null; this.grid = null; this.problems = []; this.uploadRows = []; this.loadList(); }
  async loadGrid(): Promise<void> {
    if (!this.p) return;
    const q = this.view === 'week' ? { from: this.weekFrom, to: addDays(this.weekFrom, 6) } : {};
    try {
      this.grid = await this.api.get(`periods/${this.p.id}/grid/`, q);
      this.p = this.grid.period;
    } catch (e) { this.say(SpApiService.error(e), true); }
    this.cd.markForCheck();
  }
  shiftWeek(n: number): void { this.weekFrom = addDays(this.weekFrom, n); this.loadGrid(); }
  cell(r: any, d: string): any { return r.cells[d]; }
  worst(c: any): string { return c.problems.some((x: any) => x.level === 'error') ? 'error' : c.problems.some((x: any) => x.level === 'warning') ? 'warning' : 'info'; }
  tip(c: any): string { return [c.label, c.note, c.leave ? `${c.leave.type} leave (${c.leave.status})` : '', c.holiday ? 'Public holiday' : '', ...c.problems.map((x: any) => x.message)].filter(Boolean).join('\n'); }

  edit(r: any, d: string, c: any): void {
    this.cellEdit = { row: r, date: d, cell: c, choice: c.off ? 'off' : (c.shift_id ? String(c.shift_id) : ''), note: c.note || '' };
  }
  async saveCell(): Promise<void> {
    const e = this.cellEdit;
    const body = { cells: [{ employee: e.row.employee_id, date: e.date, shift: e.choice && e.choice !== 'off' ? Number(e.choice) : null, off: e.choice === 'off', note: e.note }] };
    try {
      const r: any = await this.api.post(`periods/${this.p.id}/cells/`, body);
      this.cellEdit = null; this.problems = r.problems || [];
      this.say('Saved.');
      await this.loadGrid();
    } catch (err) { this.say(SpApiService.error(err), true); }
  }
  async action(a: string, body: any = {}): Promise<void> {
    if (a === 'publish' && !confirm('Publish this roster? Every employee on it gets their schedule.')) return;
    if (a === 'reopen' && !confirm('Reopen this roster? It stops counting for attendance and payroll until it is published again.')) return;
    try {
      const r: any = await this.api.post(`periods/${this.p.id}/${a}/`, body);
      this.problems = r.problems || [];
      const words: Record<string, string> = { generate: 'Filled from the shift schedules.', check: this.problems.length ? `${this.problems.length} point(s) to look at – see the list below the roster.` : 'No problems found.',
        submit: 'Sent for approval.', approve: 'Approved. It can be published now.', publish: `Published. ${r.notified || 0} employee(s) were told.`, reopen: 'Reopened as draft.' };
      this.say(words[a] || 'Done.');
      await this.loadGrid();
    } catch (e) { this.problems = (e as any)?.error?.problems || []; this.say(SpApiService.error(e), true); }
  }
  reject(): void { const note = prompt('Why is the roster sent back? The planner sees this note.'); if (note) this.action('reject', { note }); }
  copyWeek(): void { this.action('copy-week', { target_start: this.weekFrom }); }
  async remove(): Promise<void> {
    if (!confirm('Delete this draft roster?')) return;
    try { await this.api.delete(`periods/${this.p.id}/`); this.say('Roster deleted.'); this.close(); } catch (e) { this.say(SpApiService.error(e), true); }
  }
  template(): void { this.api.download('template/roster/', {}, 'roster_upload_template.csv'); }
  async upload(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!f) return;
    try {
      const r: any = await this.api.upload('upload/roster/', f, { period: this.p.id });
      this.uploadRows = r.rows; this.uploadErrors = r.errors; this.uploadFile = f;
      this.say(r.errors ? `${r.errors} row(s) have errors – fix the file and upload it again.` : `${r.valid} row(s) are ready. Check them and press Save.`, !!r.errors);
    } catch (e) { this.say(SpApiService.error(e), true); }
  }
  async commitUpload(): Promise<void> {
    if (!this.uploadFile) return;
    try {
      const r: any = await this.api.upload('upload/roster/', this.uploadFile, { period: this.p.id, commit: 1 });
      this.uploadRows = []; this.uploadFile = null; this.problems = r.problems || [];
      this.say(`${r.saved} day(s) saved from the file.`);
      await this.loadGrid();
    } catch (e) { this.say(SpApiService.error(e), true); }
  }
}

function niceIso(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
