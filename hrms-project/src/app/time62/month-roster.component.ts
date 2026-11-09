// v1.67.0 (item 21)
/**
 * v1.67.0 (item 21, roster part) – Shift planner › Roster grid: employees × days of a month for a branch (and department).
 * Uses the existing roster (ShiftPlanner RosterPeriod / RosterEntry – one roster per branch / department / month, made as a draft
 * on the first change). A cell is a shift, a day off or empty; approved leave is shown read-only (from the approved leave requests).
 * Fill: choose a shift in the palette and drag over the cells (or click one), apply a shift pattern to the ticked employees, or copy
 * last month. Save the painted cells, then Send for approval → Approve → Publish (as the roster screen), or Publish now when the
 * roster rules allow it; employees see the published days in My schedule. Conflicts are flagged on the cells and listed below:
 * two shifts on a day, rest hours, weekly hours, leave, the rest-day rule. Excel export / import of the same grid.
 * Only a published roster counts (roster > shift override > pattern > weekend calendar, 1.62.6).
 * API /shift-planner/api/month-roster/… (ShiftPlanner/month_views.py) and periods/<id>/<action>/ for the approval steps.
 */
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZPortalDirective } from '../shared-ui/z-portal.directive';   // v1.67.8 (fixes) item 13
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SpApiService, SpMeta } from '../shift-planner/sp-api.service';
import { zToast } from '../shared-ui/z-toast';
import { zConfirm } from '../shared-ui/z-confirm';
import { T, dmy } from './t62';

type Brush = { kind: 'shift'; id: number; code: string; colour: string } | { kind: 'off' } | { kind: 'clear' };

@Component({
  selector: 'app-t62-month-roster',
  standalone: true,
  imports: [CommonModule, ZPortalDirective, FormsModule, MatIconModule],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  styles: [`
    .mr-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 10px; }
    .mr-bar label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 600; color: #3b3f55; }
    .mr-bar input, .mr-bar select { height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; min-width: 150px; }
    .mr-status { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 6px 0 10px; }
    .mr-tag { padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; background: #eceef3; color: #555d70; }
    .mr-tag.published { background: #dcfae6; color: #067647; } .mr-tag.submitted, .mr-tag.approved { background: #eef0ff; color: #4b3fbf; }
    .mr-tag.rejected { background: #fde2e4; color: #b3263a; }
    .mr-pal { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
    .mr-pal button { border: 2px solid transparent; border-radius: 8px; padding: 4px 10px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; background: #f3f4f8; color: #1d2033; }
    .mr-pal button.on { border-color: #1b1640; box-shadow: 0 0 0 2px #fff inset; }
    .mr-pal small { font-weight: 500; opacity: .85; margin-inline-start: 4px; }
    .mr-wrap { overflow: auto; max-height: 64vh; border: 1px solid #eceef5; border-radius: 10px; user-select: none; }
    .mr-grid { border-collapse: separate; border-spacing: 0; font-size: 12px; }
    .mr-grid th, .mr-grid td { border-bottom: 1px solid #eef0f2; border-inline-end: 1px solid #f1f2f6; padding: 0; text-align: center; }
    .mr-grid thead th { position: sticky; top: 0; background: #f7f8fa; z-index: 2; padding: 4px 2px; min-width: 38px; font-weight: 600; color: #3b3f55; }
    .mr-grid thead th.rest { color: #b3263a; }
    .mr-grid .who { position: sticky; inset-inline-start: 0; background: #fff; z-index: 1; text-align: start; padding: 4px 8px; min-width: 210px; max-width: 240px; }
    .mr-grid thead .who { z-index: 3; background: #f7f8fa; }
    .mr-grid .who b { display: block; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mr-grid .who small { color: #6b7185; }
    .mr-c { position: relative; width: 38px; height: 34px; cursor: pointer; }
    .mr-c.rest { background: #f6f6f9; } .mr-c.hol { background: #fff4e5; }
    .mr-c.locked { cursor: not-allowed; background: repeating-linear-gradient(135deg, #e5efff 0 4px, #f5f9ff 4px 8px); color: #1f4fa0; font-weight: 700; }
    .mr-c .code { display: inline-block; min-width: 30px; padding: 2px 3px; border-radius: 5px; color: #fff; font-weight: 700; font-size: 11px; }
    .mr-c .off { color: #6b7185; font-weight: 700; font-size: 11px; }
    .mr-c .flag { position: absolute; top: 1px; inset-inline-end: 2px; font-weight: 800; font-size: 11px; }
    .mr-c .flag.error { color: #b42318; } .mr-c .flag.warning { color: #b54708; } .mr-c .flag.info { color: #4b3fbf; }
    .mr-c .pend { position: absolute; bottom: 1px; inset-inline-start: 2px; width: 6px; height: 6px; border-radius: 50%; background: #f79009; }
    .mr-c.dirty { outline: 2px dashed #5b4fe0; outline-offset: -3px; }
    .mr-tot { padding: 4px 8px; white-space: nowrap; color: #3b3f55; }
    .mr-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #555d70; margin: 8px 0; }
    .mr-legend i { display: inline-block; width: 14px; height: 12px; border-radius: 3px; vertical-align: middle; margin-inline-end: 4px; border: 1px solid #e4e6ee; }
    .mr-probs { margin: 12px 0 0; padding: 0; list-style: none; font-size: 12.5px; max-height: 220px; overflow: auto; }
    .mr-probs li { padding: 4px 8px; border-inline-start: 3px solid #d0d5dd; margin-bottom: 3px; background: #fafbfc; }
    .mr-probs li.error { border-color: #b42318; } .mr-probs li.warning { border-color: #f79009; } .mr-probs li.info { border-color: #7a5af8; }
    .mr-save { position: sticky; bottom: 0; display: flex; gap: 8px; align-items: center; background: #fff; padding: 8px 0; }
  `],
  template: `
<div class="container hr-page" data-t62="month-roster" (mouseup)="endPaint()">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Roster grid</h1>
          <p class="hr-head-d">Plan a month for a branch or department: pick a shift and drag over the days, apply a shift pattern or copy last month, then publish. Employees see the published roster in My schedule. Approved leave is shown and cannot be planned over.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn" (click)="openRules()" data-mr-rules>Roster rules</button>
          <button type="button" class="hr-tbtn" [disabled]="!g" (click)="exportXlsx()" data-mr-export>Export to Excel</button>
          <label class="hr-tbtn" [class.disabled]="!g?.can?.edit" style="cursor:pointer;margin:0" data-mr-import>Import from Excel
            <input type="file" accept=".xlsx" hidden (change)="importXlsx($event)" [disabled]="!g?.can?.edit"></label>
        </div>
      </div>
    </div>
    <div class="t62-body">
      <div class="mr-bar">
        <label>Month<input type="month" [(ngModel)]="month" (change)="load()" data-mr-month></label>
        <label>Branch<select [(ngModel)]="branch" (change)="load()" data-mr-branch><option [ngValue]="null">Choose…</option>
          <option *ngFor="let b of meta?.branches" [ngValue]="b.id">{{ b.branch_name }}</option></select></label>
        <label>Department<select [(ngModel)]="department" (change)="load()" data-mr-dept><option [ngValue]="null">All departments</option>
          <option *ngFor="let d of meta?.departments" [ngValue]="d.id">{{ d.dept_name }}</option></select></label>
      </div>
      <p class="t62-msg" *ngIf="failed" style="margin:0 0 10px">{{ failed }}</p>
      <p class="hr-empty" *ngIf="!g && !failed">Choose the month and the branch.</p>

      <ng-container *ngIf="g">
        <div class="mr-status" data-mr-status>
          <span class="mr-tag" [ngClass]="g.period?.status || 'none'">{{ g.period ? t(g.period.status_label) : t('Not planned yet') }}</span>
          <span class="t62-hint" *ngIf="g.period">{{ g.period.name }}</span>
          <span class="t62-hint">{{ g.rows.length }} {{ t('employee(s)') }} · {{ g.counts.planned }} {{ t('planned day(s)') }}</span>
          <span class="t62-grow"></span>
          <button type="button" class="t62-btn small" *ngIf="g.can.submit" (click)="step('submit')" data-mr-submit>Send for approval</button>
          <button type="button" class="t62-btn small primary" *ngIf="g.can.approve" (click)="step('approve')" data-mr-approve>Approve</button>
          <button type="button" class="t62-btn small" *ngIf="g.can.approve" (click)="sendBack()" data-mr-reject>Send back</button>
          <button type="button" class="t62-btn small primary" *ngIf="g.can.publish" (click)="step('publish')" data-mr-publish>Publish to employees</button>
          <button type="button" class="t62-btn small primary" *ngIf="g.can.publish_now && g.period && g.period.status !== 'published'" (click)="publishNow()" data-mr-publish-now>Publish now</button>
          <button type="button" class="t62-btn small" *ngIf="g.can.reopen" (click)="step('reopen')" data-mr-reopen>Reopen for changes</button>
        </div>

        <div class="mr-pal" *ngIf="g.can.edit" data-mr-palette>
          <span class="t62-l">Paint with</span>
          <button type="button" *ngFor="let s of g.shifts" [class.on]="isBrush('shift', s.id)" [style.background]="s.colour" style="color:#fff" (click)="setBrush({ kind: 'shift', id: s.id, code: s.code, colour: s.colour })" [attr.data-mr-brush]="s.id" [title]="s.name">{{ s.code }}<small>{{ s.start }}–{{ s.end }}</small></button>
          <button type="button" [class.on]="isBrush('off')" (click)="setBrush({ kind: 'off' })" data-mr-brush="off">OFF</button>
          <button type="button" [class.on]="isBrush('clear')" (click)="setBrush({ kind: 'clear' })" data-mr-brush="clear">Clear</button>
          <span class="t62-grow"></span>
          <button type="button" class="t62-btn small" (click)="openPattern()" data-mr-pattern>Apply a shift pattern</button>
          <button type="button" class="t62-btn small" (click)="openCopy()" data-mr-copy>Copy last month</button>
        </div>

        <div class="mr-legend">
          <span><i style="background:#f6f6f9"></i>Rest day (weekend calendar)</span><span><i style="background:#fff4e5"></i>Public holiday</span>
          <span><i style="background:repeating-linear-gradient(135deg,#e5efff 0 3px,#f5f9ff 3px 6px)"></i>Approved leave (read-only)</span>
          <span><i style="background:#f79009;border-radius:50%;width:8px;height:8px"></i>Leave waiting for approval</span>
          <span><b style="color:#b42318">!</b> conflict</span>
        </div>

        <div class="mr-wrap">
          <table class="mr-grid" data-mr-grid>
            <thead><tr>
              <th class="who"><input type="checkbox" *ngIf="g.can.edit" [checked]="allTicked()" (change)="tickAll($any($event.target).checked)" aria-label="All employees"> {{ t('Employee') }}</th>
              <th *ngFor="let d of g.days" [class.rest]="d.weekday === 'Sat' || d.weekday === 'Sun'">{{ t(d.weekday) }}<br>{{ d.day }}</th>
              <th>{{ t('Hours') }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of g.rows" [attr.data-mr-row]="r.employee_id">
                <td class="who"><input type="checkbox" *ngIf="g.can.edit" [checked]="ticked.has(r.employee_id)" (change)="tick(r.employee_id)" [attr.aria-label]="r.name">
                  <b [title]="r.name">{{ r.name }}</b><small>{{ r.department }}{{ r.designation ? ' · ' + r.designation : '' }}</small></td>
                <td *ngFor="let d of g.days" class="mr-c" [class.rest]="cell(r, d.date).rest_day" [class.hol]="cell(r, d.date).holiday" [class.locked]="cell(r, d.date).locked"
                    [class.dirty]="isDirty(r, d.date)" (mousedown)="startPaint(r, d.date, $event)" (mouseenter)="paintOver(r, d.date)"
                    [title]="tip(r, d.date)" [attr.data-mr-cell]="r.employee_id + '|' + d.date">
                  <ng-container *ngIf="view(r, d.date) as v">
                    <span class="code" *ngIf="v.code" [style.background]="v.colour">{{ v.code }}</span>
                    <span class="off" *ngIf="v.off">OFF</span>
                    <span *ngIf="v.locked && !v.code && !v.off">{{ t('LV') }}</span>
                  </ng-container>
                  <span class="pend" *ngIf="cell(r, d.date).leave && cell(r, d.date).leave.status === 'pending'"></span>
                  <span class="flag" *ngIf="cell(r, d.date).problems.length" [ngClass]="worst(cell(r, d.date))">!</span>
                </td>
                <td class="mr-tot">{{ r.hours }} h<br><small class="t62-hint">{{ r.shift_days }} {{ t('d') }}</small></td>
              </tr>
              <tr *ngIf="!g.rows.length"><td [attr.colspan]="g.days.length + 2" class="hr-empty">No active employees in this branch / department.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="mr-save" *ngIf="dirtyCount()" data-mr-savebar>
          <b>{{ dirtyCount() }} {{ t('change(s) not saved') }}</b>
          <button type="button" class="t62-btn primary" [disabled]="busy" (click)="saveCells()" data-mr-save>Save changes</button>
          <button type="button" class="t62-btn" (click)="dirty.clear()" data-mr-discard>Discard</button>
        </div>
        <ul class="mr-probs" *ngIf="g.problems.length" data-mr-problems>
          <li *ngFor="let x of g.problems" [ngClass]="x.level"><b>{{ x.employee }}</b> · {{ dmy(x.date) }} – {{ x.message }}</li>
        </ul>
      </ng-container>
    </div>
  </div>

  <!-- apply a pattern -->
  <div class="t62-dlg" zPortal *ngIf="pat" data-mr-pattern-dlg>
    <div class="t62-veil" (click)="pat = null"></div>
    <div class="t62-box narrow" role="dialog" aria-modal="true">
      <div class="t62-head"><div><h2 class="t62-title">Apply a shift pattern</h2><p class="t62-sub">{{ ticked.size }} {{ t('employee(s) ticked') }}</p></div><button type="button" class="t62-x" (click)="pat = null" aria-label="Close">×</button></div>
      <div class="t62-dbody"><div class="t62-fgrid">
        <label class="t62-f full"><span class="t62-l">Shift pattern <span class="t62-req">*</span></span>
          <select [(ngModel)]="pat.pattern" [class.bad]="pat.err.pattern" data-mr-pat-select><option [ngValue]="null">Choose…</option><option *ngFor="let p of g?.patterns" [ngValue]="p.id">{{ p.name }}</option></select>
          <span class="t62-err" *ngIf="pat.err.pattern">{{ pat.err.pattern }}</span></label>
        <label class="t62-f"><span class="t62-l">From</span><input type="date" [(ngModel)]="pat.from" [min]="g?.from" [max]="g?.to"></label>
        <label class="t62-f"><span class="t62-l">To</span><input type="date" [(ngModel)]="pat.to" [min]="g?.from" [max]="g?.to"></label>
        <label class="t62-f full"><span class="t62-l">The pattern starts on</span><input type="date" [(ngModel)]="pat.anchor"><span class="t62-hint">Day 1 of the rotation (rotating patterns) – empty = the From date.</span></label>
      </div>
      <p class="t62-top" *ngIf="pat.top">{{ pat.top }}</p></div>
      <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="pat = null">Cancel</button>
        <button type="button" class="t62-btn primary" [disabled]="busy" (click)="applyPattern()" data-mr-pat-apply>Apply</button></div>
    </div>
  </div>

  <!-- copy last month -->
  <div class="t62-dlg" zPortal *ngIf="cp" data-mr-copy-dlg>
    <div class="t62-veil" (click)="cp = null"></div>
    <div class="t62-box narrow" role="dialog" aria-modal="true">
      <div class="t62-head"><div><h2 class="t62-title">Copy last month</h2><p class="t62-sub">The planned days of the month before are copied onto this month.</p></div><button type="button" class="t62-x" (click)="cp = null" aria-label="Close">×</button></div>
      <div class="t62-dbody">
        <div class="t62-seg" style="margin:8px 0">
          <button type="button" [class.on]="cp.align === 'date'" (click)="cp.align = 'date'" data-mr-align="date">Same date</button>
          <button type="button" [class.on]="cp.align === 'weekday'" (click)="cp.align = 'weekday'" data-mr-align="weekday">Same weekday</button></div>
        <p class="t62-hint">{{ cp.align === 'date' ? t('1st → 1st, 2nd → 2nd … (days the last month does not have stay empty).') : t('Each day takes the same weekday four weeks earlier (five weeks for the 29th–31st).') }}</p>
        <label class="hr-check" style="display:flex;gap:6px;align-items:center"><input type="checkbox" [(ngModel)]="cp.overwrite"> Replace the days already planned</label>
        <p class="t62-top" *ngIf="cp.top">{{ cp.top }}</p>
      </div>
      <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="cp = null">Cancel</button>
        <button type="button" class="t62-btn primary" [disabled]="busy" (click)="copyLast()" data-mr-copy-go>Copy</button></div>
    </div>
  </div>

  <!-- import preview -->
  <div class="t62-dlg" zPortal *ngIf="imp" data-mr-import-dlg>
    <div class="t62-veil" (click)="imp = null"></div>
    <div class="t62-box" role="dialog" aria-modal="true">
      <div class="t62-head"><div><h2 class="t62-title">Import from Excel</h2><p class="t62-sub">{{ imp.file.name }}</p></div><button type="button" class="t62-x" (click)="imp = null" aria-label="Close">×</button></div>
      <div class="t62-dbody">
        <p><b>{{ imp.res.changes.set }}</b> {{ t('day(s) set') }} · <b>{{ imp.res.changes.cleared }}</b> {{ t('day(s) cleared') }} · {{ imp.res.changes.same }} {{ t('unchanged') }} · {{ imp.res.changes.ignored }} {{ t('leave day(s) ignored') }}</p>
        <table class="t62-tbl" *ngIf="imp.res.errors"><thead><tr><th>Row</th><th>Employee</th><th>Problem</th></tr></thead>
          <tbody><tr *ngFor="let x of bad(imp.res.rows)"><td>{{ x.row }}</td><td>{{ x.employee || x.employee_code }}</td><td class="t62-err">{{ x.errors.join(' ') }}</td></tr></tbody></table>
        <p class="t62-hint">Empty cells clear the day; OFF is a day off; LEAVE cells are ignored.</p>
      </div>
      <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="imp = null">Cancel</button>
        <button type="button" class="t62-btn primary" [disabled]="busy || imp.res.errors > 0" (click)="commitImport()" data-mr-import-go>Save</button></div>
    </div>
  </div>

  <!-- roster rules -->
  <div class="t62-dlg" zPortal *ngIf="rules" data-mr-rules-dlg>
    <div class="t62-veil" (click)="rules = null"></div>
    <div class="t62-box narrow" role="dialog" aria-modal="true">
      <div class="t62-head"><div><h2 class="t62-title">Roster rules</h2><p class="t62-sub">What the roster grid checks and how it is published.</p></div><button type="button" class="t62-x" (click)="rules = null" aria-label="Close">×</button></div>
      <div class="t62-dbody">
        <label class="hr-check" style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" [(ngModel)]="rules.direct_publish" data-mr-direct> Publish without the approval step (users who may publish)</label>
        <label class="hr-check" style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" [(ngModel)]="rules.flag_weekend_rest_day"> Flag shifts on the weekend-calendar rest day</label>
        <label class="t62-f" style="max-width:260px"><span class="t62-l">Rest days needed in each week (Mon–Sun)</span><input type="number" min="0" max="3" [(ngModel)]="rules.min_rest_days_week" data-mr-minrest></label>
        <p class="t62-hint" *ngIf="rules.law" style="margin-top:10px">{{ t(rules.law) }}<br><span *ngFor="let s of rules.sources">· {{ t(s) }}<br></span></p>
        <p class="t62-hint">The checks are warnings – only two shifts on one day stop publishing.</p>
      </div>
      <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="rules = null">Cancel</button>
        <button type="button" class="t62-btn primary" (click)="saveRules()" data-mr-rules-save>Save</button></div>
    </div>
  </div>
</div>`,
})
export class T62MonthRosterComponent implements OnInit {
  meta: SpMeta | null = null;
  month = ''; branch: number | null = null; department: number | null = null;
  g: any = null; failed = ''; busy = false;
  brush: Brush | null = null; painting = false;
  dirty = new Map<string, { employee: number; date: string; shift: number | null; off: boolean }>();
  ticked = new Set<number>();
  pat: any = null; cp: any = null; imp: any = null; rules: any = null;
  t = T; dmy = dmy;

  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    const d = new Date(); d.setMonth(d.getMonth() + 1);
    this.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const q = new URLSearchParams(location.search);
    if (q.get('month')) { this.month = q.get('month')!; }
    try { this.meta = await this.api.meta(); } catch (e) { this.failed = SpApiService.error(e); }
    this.branch = q.get('branch') ? Number(q.get('branch')) : (this.meta?.branches?.length === 1 ? this.meta.branches[0].id : (this.meta?.me?.branch_id ?? this.meta?.branches?.[0]?.id ?? null));
    if (q.get('department')) { this.department = Number(q.get('department')); }
    await this.load();
  }
  scope(): any { return { month: this.month, branch: this.branch, department: this.department }; }
  async load(): Promise<void> {
    this.dirty.clear();
    if (!this.month || !this.branch) { this.g = null; this.cd.markForCheck(); return; }
    this.failed = '';
    try { this.g = await this.api.get('month-roster/', this.scope()); this.ticked = new Set([...this.ticked].filter(i => this.g.rows.some((r: any) => r.employee_id === i))); }
    catch (e) { this.g = null; this.failed = SpApiService.error(e); }
    if (this.g?.can?.edit && !this.brush && this.g.shifts.length) { const s = this.g.shifts[0]; this.brush = { kind: 'shift', id: s.id, code: s.code, colour: s.colour }; }
    this.cd.markForCheck();
  }

  // ---- cells
  cell(r: any, d: string): any { return r.cells[d]; }
  key(r: any, d: string): string { return `${r.employee_id}|${d}`; }
  isDirty(r: any, d: string): boolean { return this.dirty.has(this.key(r, d)); }
  dirtyCount(): number { return this.dirty.size; }
  view(r: any, d: string): any {
    const c = this.cell(r, d); const x = this.dirty.get(this.key(r, d));
    if (!x) { return { code: c.shift_id ? c.code : '', colour: c.colour, off: c.off, locked: c.locked }; }
    const s = x.shift ? this.g.shifts.find((y: any) => y.id === x.shift) : null;
    return { code: s ? s.code : '', colour: s ? s.colour : '', off: x.off, locked: c.locked };
  }
  worst(c: any): string { return c.problems.some((x: any) => x.level === 'error') ? 'error' : c.problems.some((x: any) => x.level === 'warning') ? 'warning' : 'info'; }
  tip(r: any, d: string): string {
    const c = this.cell(r, d);
    return [c.shift_id ? `${c.code} ${c.start || ''}–${c.end || ''}` : (c.off ? T('Day off') : ''),
      c.leave ? T('{0} leave ({1})', [c.leave.type, T(c.leave.status)]) : '', c.holiday ? T('Public holiday') : '', c.rest_day ? T('Rest day (weekend calendar)') : '',
      ...(c.other || []).map((o: any) => T('Also in roster “{0}”: {1}', [o.period, o.code])), c.note, ...c.problems.map((x: any) => x.message)].filter(Boolean).join('\n');
  }
  setBrush(b: Brush): void { this.brush = b; }
  isBrush(kind: string, id?: number): boolean { return !!this.brush && this.brush.kind === kind && (kind !== 'shift' || (this.brush as any).id === id); }
  startPaint(r: any, d: string, ev: MouseEvent): void {
    if (!this.g?.can?.edit || !this.brush || ev.button !== 0) { return; }
    ev.preventDefault(); this.painting = true; this.paint(r, d);
  }
  paintOver(r: any, d: string): void { if (this.painting) { this.paint(r, d); } }
  @HostListener('document:mouseup') endPaint(): void { this.painting = false; }
  paint(r: any, d: string): void {
    const c = this.cell(r, d); const b = this.brush!;
    if (c.locked) { return; }
    const v = b.kind === 'shift' ? { shift: b.id, off: false } : b.kind === 'off' ? { shift: null, off: true } : { shift: null, off: false };
    const same = (v.shift || null) === (c.shift_id || null) && v.off === !!c.off;
    if (same) { this.dirty.delete(this.key(r, d)); } else { this.dirty.set(this.key(r, d), { employee: r.employee_id, date: d, ...v }); }
    this.cd.markForCheck();
  }
  async saveCells(): Promise<void> {
    this.busy = true;
    try {
      const res: any = await this.api.post('month-roster/cells/', { ...this.scope(), cells: [...this.dirty.values()] });
      zToast(res.skipped?.length ? T('{0} day(s) saved, {1} on approved leave not changed.', [res.saved, res.skipped.length]) : T('{0} day(s) saved.', [res.saved]), res.skipped?.length ? 'err' : 'ok');
      await this.load();
    } catch (e) { zToast(SpApiService.error(e), 'err'); }
    this.busy = false;
  }

  // ---- tick employees (pattern)
  tick(id: number): void { if (this.ticked.has(id)) { this.ticked.delete(id); } else { this.ticked.add(id); } }
  allTicked(): boolean { return !!this.g?.rows?.length && this.g.rows.every((r: any) => this.ticked.has(r.employee_id)); }
  tickAll(on: boolean): void { this.ticked = new Set(on ? this.g.rows.map((r: any) => r.employee_id) : []); }

  async guardDirty(): Promise<boolean> { return !this.dirty.size || zConfirm(T('{0} painted change(s) are not saved and will be lost. Go on?', [this.dirty.size])); }

  openPattern(): void {
    if (!this.ticked.size) { zToast(T('Tick the employees the pattern is for (the box before the name).'), 'err'); return; }
    this.pat = { pattern: null, from: this.g.from, to: this.g.to, anchor: '', err: {}, top: '' };
  }
  async applyPattern(): Promise<void> {
    if (!this.pat.pattern) { this.pat.err = { pattern: T('Choose a shift pattern.') }; return; }
    if (!(await this.guardDirty())) { return; }
    this.busy = true;
    try {
      const res: any = await this.api.post('month-roster/pattern/', { ...this.scope(), pattern: this.pat.pattern, employees: [...this.ticked], from: this.pat.from, to: this.pat.to, anchor: this.pat.anchor || null });
      this.pat = null;
      zToast(T('Pattern “{0}”: {1} day(s) planned.', [res.pattern, res.saved]) + (res.skipped?.length ? ' ' + T('{0} day(s) on approved leave not changed.', [res.skipped.length]) : ''), 'ok');
      await this.load();
    } catch (e) { this.pat.top = SpApiService.error(e); }
    this.busy = false;
  }
  openCopy(): void { this.cp = { align: 'date', overwrite: false, top: '' }; }
  async copyLast(): Promise<void> {
    if (!(await this.guardDirty())) { return; }
    this.busy = true;
    try {
      const res: any = await this.api.post('month-roster/copy-last-month/', { ...this.scope(), align: this.cp.align, overwrite: this.cp.overwrite });
      this.cp = null;
      zToast(T('{0} day(s) copied from last month.', [res.copied]), 'ok');
      await this.load();
    } catch (e) { this.cp.top = SpApiService.error(e); }
    this.busy = false;
  }

  // ---- approval steps / publish
  async step(a: string): Promise<void> {
    if (!(await this.guardDirty())) { return; }
    if (a === 'publish' && !(await zConfirm(T('Publish this roster? Every employee on it gets their schedule.')))) { return; }
    if (a === 'reopen' && !(await zConfirm(T('Reopen this roster? It stops counting for attendance and payroll until it is published again.')))) { return; }
    try {
      const r: any = await this.api.post(`periods/${this.g.period.id}/${a}/`, {});
      const words: Record<string, string> = { submit: 'Sent for approval.', approve: 'Approved. It can be published now.', reopen: 'Reopened as draft.' };
      zToast(a === 'publish' ? T('Published. {0} employee(s) were told.', [r.notified || 0]) : T(words[a] || 'Done.'), 'ok');
      await this.load();
    } catch (e) { zToast(SpApiService.error(e), 'err'); }
  }
  async sendBack(): Promise<void> {
    const note = prompt(T('Why is the roster sent back? The planner sees this note.'));
    if (!note) { return; }
    try { await this.api.post(`periods/${this.g.period.id}/reject/`, { note }); zToast(T('Sent back.'), 'ok'); await this.load(); }
    catch (e) { zToast(SpApiService.error(e), 'err'); }
  }
  async publishNow(): Promise<void> {
    if (!(await this.guardDirty())) { return; }
    if (!(await zConfirm(T('Publish this roster? Every employee on it gets their schedule.')))) { return; }
    try { const r: any = await this.api.post('month-roster/publish-now/', this.scope()); zToast(T('Published. {0} employee(s) were told.', [r.notified || 0]), 'ok'); await this.load(); }
    catch (e) { zToast(SpApiService.error(e), 'err'); }
  }

  // ---- Excel
  exportXlsx(): void { this.api.download('month-roster/export/', this.scope(), `roster_${this.month}.xlsx`); }
  async importXlsx(ev: Event): Promise<void> {
    const f = (ev.target as HTMLInputElement).files?.[0]; (ev.target as HTMLInputElement).value = '';
    if (!f) { return; }
    try { const res: any = await this.api.upload('month-roster/import/', f, { ...this.scope(), department: this.department ?? '' }); this.imp = { file: f, res }; }
    catch (e) { zToast(SpApiService.error(e), 'err'); }
    this.cd.markForCheck();
  }
  bad(rows: any[]): any[] { return (rows || []).filter(x => !x.ok); }
  async commitImport(): Promise<void> {
    this.busy = true;
    try {
      const res: any = await this.api.upload('month-roster/import/', this.imp.file, { ...this.scope(), department: this.department ?? '', commit: 1 });
      this.imp = null; zToast(T('{0} day(s) saved from the file.', [res.saved]), 'ok'); await this.load();
    } catch (e) { zToast(SpApiService.error(e), 'err'); }
    this.busy = false;
  }

  // ---- rules
  async openRules(): Promise<void> { try { this.rules = await this.api.get('month-roster/settings/'); } catch (e) { zToast(SpApiService.error(e), 'err'); } this.cd.markForCheck(); }
  async saveRules(): Promise<void> {
    try { await this.api.post('month-roster/settings/', { direct_publish: this.rules.direct_publish, flag_weekend_rest_day: this.rules.flag_weekend_rest_day, min_rest_days_week: this.rules.min_rest_days_week });
      this.rules = null; zToast(T('Roster rules saved.'), 'ok'); await this.load(); }
    catch (e) { zToast(SpApiService.error(e), 'err'); }
  }
}
