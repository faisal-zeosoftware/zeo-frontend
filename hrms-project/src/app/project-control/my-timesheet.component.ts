import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectControlApiService, STATUS_LABEL, addDays, hrs, isoDate } from './project-control-api.service';

interface Cell { date: string; hours: any; entries: any[]; status: string; locked: boolean; editable: boolean; rejection_reason: string; value: string; orig: string; }
interface Row { project: number; project_title: string; task: number | null; task_title: string; billable: boolean; billableOrig: boolean; cells: Cell[]; total: any; isNew?: boolean; }

/** My timesheet: weekly grid (project / task × Mon–Sun), billable flag, start / stop timer, submit the week. */
@Component({
  selector: 'app-my-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./project-control.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="pc-head">
        <div>
          <h1 class="page-title">My timesheet</h1>
          <p class="pc-desc">Fill in your hours per project and task, or use the timer. Submit the week for approval by the project manager;
            rejected entries come back to you with the reason, approved time is locked.</p>
        </div>
        <div class="pc-actions">
          <button type="button" class="pc-btn" (click)="save()" [disabled]="busy || !dirty()">Save</button>
          <button type="button" class="pc-btn primary" (click)="submitWeek()" [disabled]="busy || !canSubmit()">Submit week</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="pc-msg err" *ngIf="err">{{ err }}</p>
      <p class="pc-msg" *ngIf="msg">{{ msg }}</p>
      <p class="pc-msg warn" *ngIf="timer?.warning">{{ timer.warning }}</p>

      <!-- timer -->
      <div class="pc-timer" [class.on]="timer?.running">
        <button type="button" class="pc-bigbtn" [class.stop]="timer?.running" (click)="timer?.running ? stop() : start()"
                [disabled]="busy || (!timer?.running && !tProject)" [attr.aria-label]="timer?.running ? 'Stop timer' : 'Start timer'">
          {{ timer?.running ? 'Stop' : 'Start' }}
        </button>
        <div class="clock">{{ clock }}</div>
        <div class="what" *ngIf="!timer?.running">
          <label class="pc-field">Project
            <select [(ngModel)]="tProject" (ngModelChange)="tTask = null; tBillable = projectBillable(tProject)">
              <option [ngValue]="null">Pick a project</option>
              <option *ngFor="let p of projects" [ngValue]="p.id">{{ p.title }}</option>
            </select>
          </label>
          <label class="pc-field">Task
            <select [(ngModel)]="tTask" (ngModelChange)="tBillable = taskBillable(tProject, tTask)">
              <option [ngValue]="null">No task</option>
              <option *ngFor="let t of tasksOf(tProject)" [ngValue]="t.id">{{ t.title }}</option>
            </select>
          </label>
          <label class="pc-field">What are you doing?
            <input [(ngModel)]="tDesc" placeholder="Description">
          </label>
          <label class="pc-switch"><input type="checkbox" [(ngModel)]="tBillable"> Billable</label>
        </div>
        <div class="what" *ngIf="timer?.running" style="grid-template-columns: minmax(0,1fr)">
          <div><b>{{ timer.entry.project_title }}</b><span *ngIf="timer.entry.task_title"> · {{ timer.entry.task_title }}</span></div>
          <div class="pc-muted">{{ timer.entry.description }} · started {{ timer.start_at | date:'dd MMM, HH:mm' }}
            · {{ timer.entry.billable ? 'billable' : 'non-billable' }}</div>
        </div>
      </div>

      <!-- week bar -->
      <div class="pc-weekbar">
        <button type="button" class="pc-btn sm" (click)="go(-7)" aria-label="Previous week">‹ Prev</button>
        <span class="lbl">{{ week | date:'dd MMM' }} – {{ weekEnd() | date:'dd MMM yyyy' }}</span>
        <button type="button" class="pc-btn sm" (click)="go(7)" aria-label="Next week">Next ›</button>
        <button type="button" class="pc-btn sm" (click)="thisWeek()">This week</button>
        <span class="pc-muted" *ngIf="grid">
          <span *ngFor="let s of statusKeys()"> · {{ grid.status_counts[s] }} {{ lbl(s) | lowercase }}</span>
        </span>
      </div>

      <p class="pc-muted" *ngIf="loading">Loading…</p>
      <div class="pc-gridwrap" *ngIf="grid">
        <table class="pc-grid">
          <thead>
            <tr>
              <th class="first">Project / task</th>
              <th *ngFor="let d of grid.days; let i = index" [class.today]="d === grid.today">{{ dayName[i] }}<br>{{ d | date:'dd' }}</th>
              <th class="tot">Total</th>
              <th class="bill">Billable</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td class="first">
                <div class="p">{{ r.project_title }}</div>
                <div class="t">{{ r.task_title || 'No task' }}</div>
              </td>
              <td class="day" *ngFor="let c of r.cells; let i = index" [attr.data-label]="dayName[i] + ' ' + (c.date | date:'dd')">
                <input class="pc-cell" inputmode="decimal" [(ngModel)]="c.value" [readonly]="!c.editable"
                       [ngClass]="[c.status || '', c.value !== c.orig ? 'dirty' : '']"
                       [title]="cellTitle(c)" [attr.aria-label]="r.project_title + ' ' + c.date">
              </td>
              <td class="tot">{{ rowTotal(r) }}</td>
              <td class="bill"><label class="pc-switch"><input type="checkbox" [(ngModel)]="r.billable"> <span class="d-sm-none">Billable</span></label></td>
            </tr>
            <tr *ngIf="!rows.length"><td class="first" colspan="10"><span class="pc-muted">No time this week yet – add a project below or start the timer.</span></td></tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="first">Day total</td>
              <td class="day" *ngFor="let d of grid.days; let i = index">{{ dayTotal(i) }}</td>
              <td class="tot">{{ weekTotal() }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div class="pc-legend">
          <span><i class="submitted"></i>Waiting approval (locked)</span>
          <span><i class="approved"></i>Approved (locked)</span>
          <span><i class="rejected"></i>Rejected – correct and submit again</span>
          <span>Hours as 7.5 (= 7:30)</span>
        </div>

        <div class="pc-addrow">
          <label class="pc-field">Add project
            <select [(ngModel)]="aProject" (ngModelChange)="aTask = null">
              <option [ngValue]="null">Pick a project</option>
              <option *ngFor="let p of projects" [ngValue]="p.id">{{ p.title }}</option>
            </select>
          </label>
          <label class="pc-field">Task
            <select [(ngModel)]="aTask">
              <option [ngValue]="null">No task</option>
              <option *ngFor="let t of tasksOf(aProject)" [ngValue]="t.id">{{ t.title }}</option>
            </select>
          </label>
          <button type="button" class="pc-btn" (click)="addRow()" [disabled]="!aProject">+ Add row</button>
        </div>

        <div class="pc-rejected" *ngIf="grid.rejected?.length">
          <b>Rejected – please correct and submit again:</b>
          <ul class="mb-0">
            <li *ngFor="let x of grid.rejected">{{ entryLabel(x.id) }}: {{ x.rejection_reason || 'no reason given' }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
`,
})
export class MyTimesheetComponent implements OnInit, OnDestroy {
  dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  week = '';
  grid: any = null;
  rows: Row[] = [];
  projects: any[] = [];
  timer: any = null;
  clock = '00:00:00';
  loading = false;
  busy = false;
  msg = '';
  err = '';
  tProject: number | null = null;
  tTask: number | null = null;
  tDesc = '';
  tBillable = true;
  aProject: number | null = null;
  aTask: number | null = null;
  private base = 0;
  private tick: any;
  lbl = (s: string) => STATUS_LABEL[s] ?? s;

  constructor(private api: ProjectControlApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.thisWeek();
    this.loadTimer();
    this.tick = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.tick);
  }

  thisWeek(): void {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    this.week = isoDate(d);
    this.load();
  }

  go(n: number): void {
    if (this.dirty() && !confirm('You have unsaved hours. Leave this week without saving?')) return;
    this.week = addDays(this.week, n);
    this.load();
  }

  weekEnd(): string { return addDays(this.week, 6); }

  async load(): Promise<void> {
    this.loading = true;
    this.err = '';
    try {
      const g = await this.api.get('week/', { week: this.week });
      this.setGrid(g);
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The timesheet could not be loaded.');
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  private setGrid(g: any): void {
    this.grid = g;
    this.week = g.week_start;
    if (g.projects) this.projects = g.projects;
    this.rows = (g.rows || []).map((r: any) => ({
      ...r, billableOrig: r.billable,
      cells: r.cells.map((c: any) => {
        const v = Number(c.hours) ? hrs(c.hours) : '';
        return { ...c, value: v, orig: v };
      }),
    }));
  }

  statusKeys(): string[] { return Object.keys(this.grid?.status_counts || {}); }

  projectBillable(pid: number | null): boolean {
    return this.projects.find(p => p.id === pid)?.billable ?? true;
  }

  taskBillable(pid: number | null, tid: number | null): boolean {
    const p = this.projects.find(x => x.id === pid);
    if (!p) return true;
    return tid ? (p.tasks.find((t: any) => t.id === tid)?.billable ?? p.billable) : p.billable;
  }

  tasksOf(pid: number | null): any[] {
    return this.projects.find(p => p.id === pid)?.tasks || [];
  }

  addRow(): void {
    const p = this.projects.find(x => x.id === this.aProject);
    if (!p || !this.grid) return;
    if (this.rows.some(r => r.project === p.id && (r.task || null) === (this.aTask || null))) {
      this.err = 'This project / task is already in the grid.';
      return;
    }
    const t = this.tasksOf(p.id).find((x: any) => x.id === this.aTask);
    const today = this.grid.today;
    const b = this.taskBillable(p.id, this.aTask);
    this.rows.push({
      project: p.id, project_title: p.title, task: this.aTask, task_title: t?.title || '', billable: b, billableOrig: b, total: 0, isNew: true,
      cells: this.grid.days.map((d: string) => ({ date: d, hours: 0, entries: [], status: '', locked: false, editable: d <= today,
                                                  rejection_reason: '', value: '', orig: '' })),
    });
    this.aProject = null;
    this.aTask = null;
    this.err = '';
  }

  cellTitle(c: Cell): string {
    if (c.status === 'rejected') return 'Rejected: ' + (c.rejection_reason || '');
    if (c.locked) return this.lbl(c.status) + ' – locked';
    if (!c.editable && c.entries.length > 1) return 'Several entries – change them in the timesheet list';
    if (!c.editable) return 'Future date';
    return '';
  }

  private n(v: any): number {
    const s = String(v ?? '').trim();
    if (!s) return 0;
    const m = s.match(/^(\d+):(\d{1,2})$/);
    if (m) return Number(m[1]) + Number(m[2]) / 60;
    const x = Number(s.replace(',', '.'));
    return isNaN(x) ? NaN : x;
  }

  rowTotal(r: Row): string { return hrs(r.cells.reduce((a, c) => a + (this.n(c.value) || 0), 0)); }
  dayTotal(i: number): string { return hrs(this.rows.reduce((a, r) => a + (this.n(r.cells[i].value) || 0), 0)); }
  weekTotal(): string { return hrs(this.rows.reduce((a, r) => a + r.cells.reduce((b, c) => b + (this.n(c.value) || 0), 0), 0)); }

  dirty(): boolean {
    return this.rows.some(r => r.billable !== r.billableOrig || r.cells.some(c => c.value !== c.orig));
  }

  canSubmit(): boolean {
    return !!this.grid && !this.dirty() && this.rows.some(r => r.cells.some(c => c.entries.some((e: any) => ['draft', 'rejected'].includes(e.status) && !e.running)));
  }

  entryLabel(id: number): string {
    for (const r of this.rows) for (const c of r.cells) if (c.entries.some((e: any) => e.id === id)) return `${r.project_title}${r.task_title ? ' · ' + r.task_title : ''}, ${c.date}`;
    return '#' + id;
  }

  async save(): Promise<boolean> {
    const rows: any[] = [];
    for (const r of this.rows) {
      const cells = r.cells.filter(c => c.value !== c.orig || (r.billable !== r.billableOrig && c.entries.length))
        .map(c => ({ date: c.date, hours: this.n(c.value) }));
      if (cells.some(c => isNaN(c.hours) || c.hours < 0 || c.hours > 24)) {
        this.err = `${r.project_title}: hours must be a number between 0 and 24.`;
        return false;
      }
      if (cells.length) rows.push({ project: r.project, task: r.task, billable: r.billable, cells });
    }
    if (!rows.length) return true;
    this.busy = true;
    this.err = this.msg = '';
    try {
      const g = await this.api.post('week/save/', { week: this.week, rows });
      this.setGrid({ ...g, projects: this.projects, today: this.grid?.today });
      this.msg = 'Saved.';
      return true;
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The hours could not be saved.');
      return false;
    } finally {
      this.busy = false;
      this.cd.markForCheck();
    }
  }

  async submitWeek(): Promise<void> {
    if (!(await this.save())) return;
    if (!confirm('Submit this week for approval? Submitted time is locked until it is approved or rejected.')) return;
    this.busy = true;
    try {
      const r = await this.api.post('submit/', { week: this.week });
      await this.load();
      this.msg = r.detail + (r.skipped?.length ? ` ${r.skipped.length} skipped (already submitted, running or empty).` : '');
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The week could not be submitted.');
    }
    this.busy = false;
  }

  // ---------------------------------------------------------------- timer
  async loadTimer(): Promise<void> {
    try {
      this.setTimer(await this.api.get('timer/'));
    } catch { /* no employee linked */ }
  }

  private setTimer(t: any): void {
    this.timer = t;
    this.base = t?.running ? Date.now() - (t.elapsed_seconds || 0) * 1000 : 0;
    this.updateClock();
  }

  private updateClock(): void {
    const s = this.timer?.running ? Math.max(0, Math.floor((Date.now() - this.base) / 1000)) : 0;
    const p = (x: number) => String(x).padStart(2, '0');
    this.clock = `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
    this.cd.markForCheck();
  }

  async start(): Promise<void> {
    this.busy = true;
    this.err = this.msg = '';
    try {
      this.setTimer(await this.api.post('timer/start/', { project: this.tProject, task: this.tTask, description: this.tDesc, billable: this.tBillable }));
      this.msg = 'Timer started.';
      if (this.week <= this.timer.entry.date && this.timer.entry.date <= this.weekEnd()) await this.load();
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The timer could not be started.');
    }
    this.busy = false;
  }

  async stop(): Promise<void> {
    this.busy = true;
    this.err = this.msg = '';
    try {
      const r = await this.api.post('timer/stop/', {});
      this.setTimer({ running: false });
      this.msg = `Timer stopped: ${hrs(r.hours)} h booked.` + (r.warnings?.length ? '\n' + r.warnings.join('\n') : '');
      this.tDesc = '';
      await this.load();
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The timer could not be stopped.');
    }
    this.busy = false;
  }
}
