// v1.62.11 (item 18b): new screen – Payroll › Monthly inputs (days / hours per employee for the payroll month)
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';
import { TPipe, I18nService } from '../shared-ui/i18n.service';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';

/**
 * v1.62.11 (item 18b) – Payroll › Monthly inputs.
 * Rows = the employees of the branch, columns = the monthly-input components (variable, no formula – used by formulas or marked
 * "Monthly input"). HR types the days or hours of the payroll month; Save writes the figures the payroll reads (set back to 0 after
 * the payslip). The amount of each row is worked out with the component formulas (preview). Excel template + import with dry run.
 * A locked or paid month, and an employee already in that month's run, cannot be changed.
 * API: payroll-plus/api/monthly-inputs/ (preview/, template/, import/, components/)
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/monthly-inputs/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
function errText(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 300); }
  return d.detail || Object.values(d).map((v: any) => Array.isArray(v) ? v.join(' ') : (typeof v === 'object' ? JSON.stringify(v) : v)).join(' ');
}

@Component({
  selector: 'app-monthly-inputs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [`
.mi-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 12px; }
.mi-bar label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #6b7185; min-width: 0; }
.mi-bar select, .mi-bar input { height: 34px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; min-width: 0; }
.mi-grow { flex: 1 1 auto; }
.mi-state { border-radius: 8px; padding: 8px 12px; font-size: 13px; margin: 0 0 12px; background: #eef0ff; color: #3b3f8f; }
.mi-state.bad { background: #fff0d9; color: #8a5208; }
.mi-wrap { overflow: auto; max-width: 100%; border: 1px solid #eceef3; border-radius: 10px; background: #fff; }
.mi-tbl { border-collapse: separate; border-spacing: 0; width: 100%; font-size: 13px; }
.mi-tbl th, .mi-tbl td { padding: 6px 10px; border-bottom: 1px solid #eef0f4; text-align: start; vertical-align: middle; }
.mi-tbl thead th { position: sticky; top: 0; background: #f7f8fb; font-weight: 600; color: #3b3f55; z-index: 1; white-space: nowrap; }
.mi-tbl th small { display: block; font-weight: 400; color: #8a90a2; }
.mi-tbl td.mi-emp, .mi-tbl th.mi-emp { position: sticky; inset-inline-start: 0; background: #fff; z-index: 2; min-width: 190px; }
.mi-tbl thead th.mi-emp { background: #f7f8fb; z-index: 3; }
.mi-tbl input { width: 84px; height: 30px; border: 1px solid #dfe1ea; border-radius: 6px; padding: 0 6px; text-align: end; font: inherit; font-variant-numeric: tabular-nums; }
.mi-tbl input.chg { border-color: #7b6ff7; background: #f6f5ff; }
.mi-tbl input.bad { border-color: #d92d20; background: #fff5f5; }
.mi-tbl tr.ro td { color: #8a90a2; background: #fbfbfd; }
.mi-ro { font-variant-numeric: tabular-nums; }
.mi-num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.mi-amt { min-width: 200px; font-size: 12px; color: #3b3f55; }
.mi-amt b { font-size: 13px; }
.mi-acc { display: inline-block; padding: 0 6px; margin-inline-start: 4px; border-radius: 6px; background: #eef0ff; color: #4b3fbf; font-size: 11px; }
.mi-note { font-size: 11.5px; color: #a0610a; }
.mi-err { font-size: 11.5px; color: #b3263a; }
.mi-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 14px 16px; margin: 14px 0; }
.mi-card h2 { font-size: 16px; margin: 0 0 6px; font-weight: 600; }
.mi-card p { color: #6b7185; font-size: 13px; margin: 0 0 10px; }
.mi-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
.mi-row label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 600; color: #3b3f55; }
.mi-st { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11.5px; background: #e3f6ec; color: #1f7a4d; }
.mi-imp tr.bad td { background: #fff7f7; }
.mi-flags label { display: flex; align-items: center; gap: 8px; font-size: 13px; margin: 4px 0; }
.mi-flags small { color: #8a90a2; }
.mi-foot { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
@media (max-width: 640px) { .mi-tbl td.mi-emp, .mi-tbl th.mi-emp { min-width: 140px; } }
`],
  template: `
<div class="container hr-page" data-monthly-inputs>
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ 'Monthly inputs' | t }}</h1>
          <p class="hr-head-d">{{ 'Days or hours of the payroll month per employee – on-call days, shift days, overtime hours … The payroll reads them with the component formulas and sets them back to 0 after the payslip.' | t }}</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="t62-btn" *ngIf="d?.can_edit" (click)="template()" data-mi-template><mat-icon>download</mat-icon> {{ 'Excel template' | t }}</button>
          <button type="button" class="t62-btn" *ngIf="d?.can_edit" (click)="showImport = !showImport" data-mi-import-open><mat-icon>upload_file</mat-icon> {{ 'Import' | t }}</button>
          <button type="button" class="t62-btn" *ngIf="d?.can_flag" (click)="toggleFlags()" data-mi-flags-open><mat-icon>view_column</mat-icon> {{ 'Columns' | t }}</button>
        </div>
      </div>
    </div>
    <div class="t62-body">
      <div class="mi-bar">
        <label>{{ 'Branch' | t }}<select [(ngModel)]="branch" (change)="load(true)" data-mi-branch><option *ngFor="let b of d?.branches || []" [ngValue]="b.id">{{ b.name }}</option></select></label>
        <label>{{ 'Payroll month' | t }}<select [(ngModel)]="month" (change)="load()" data-mi-month><option *ngFor="let m of d?.months || []" [value]="m.value" [selected]="m.value === month">{{ m.label }}</option></select></label>
        <label>{{ 'Other month' | t }}<input type="month" [(ngModel)]="other" (change)="useOther()" data-mi-other></label>
        <label class="mi-grow">{{ 'Search' | t }}<input [(ngModel)]="q" [placeholder]="'Employee name or code' | t" data-mi-search></label>
      </div>
      <p class="mi-state" *ngIf="d" [class.bad]="!d.month.editable" data-mi-state>
        <b>{{ d.month.label }}</b> ·
        <ng-container *ngIf="d.month.editable">{{ 'Open for entry' | t }}<ng-container *ngIf="d.month.runs.length"> · {{ 'Runs' | t }}: <span *ngFor="let r of d.month.runs; let l = last">{{ r.name }} ({{ r.status | t }}){{ l ? '' : ', ' }}</span></ng-container></ng-container>
        <ng-container *ngIf="!d.month.editable">{{ d.month.reason }}</ng-container>
      </p>

      <!-- column setup -->
      <div class="mi-card mi-flags" *ngIf="flags" data-mi-flags>
        <h2>{{ 'Which components are monthly inputs' | t }}</h2>
        <p>{{ 'A variable component without a formula is found automatically when a formula uses its code. Tick it to show it here anyway, untick it to hide it.' | t }}</p>
        <label *ngFor="let c of flags" [attr.data-mi-flag]="c.code">
          <input type="checkbox" [checked]="c.monthly_input" (change)="setFlag(c, $any($event.target).checked)">
          <b>{{ c.name }}</b> <small>{{ c.code }} · {{ c.branches.join(', ') }} · {{ (c.auto ? 'used by a formula' : 'not used by a formula') | t }}{{ c.marked !== null ? ' · ' + ('set by HR' | t) : '' }}</small>
        </label>
        <p *ngIf="!flags.length">{{ 'No variable components without a formula yet.' | t }}</p>
      </div>

      <!-- import -->
      <div class="mi-card" *ngIf="showImport" data-mi-import>
        <h2>{{ 'Import monthly inputs' | t }}</h2>
        <p>{{ 'One row per employee and input: employee_code, input_code, value (days or hours). Check the file first (dry run) – nothing is saved; then apply the rows without errors.' | t }}</p>
        <div class="mi-row">
          <label>{{ 'File (Excel or CSV)' | t }}<input type="file" accept=".xlsx,.csv" (change)="pick($event)" data-mi-file></label>
          <button type="button" class="t62-btn" [disabled]="!file || busy" (click)="runImport(false)" data-mi-dry>{{ 'Check the file (dry run)' | t }}</button>
          <button type="button" class="t62-btn primary" [disabled]="!file || busy || !imp || !imp.ok" (click)="runImport(true)" data-mi-apply>{{ 'Apply the rows without errors' | t }}</button>
        </div>
        <p class="pc-sum" *ngIf="imp" data-mi-imp-sum style="margin:10px 0 6px">{{ impSummary() }}</p>
        <div class="mi-wrap" *ngIf="imp">
          <table class="mi-tbl mi-imp" data-mi-imp>
            <thead><tr><th>{{ 'Row' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Input' | t }}</th><th class="mi-num">{{ 'Days / hours' | t }}</th><th>{{ 'Check' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of imp.rows" [class.bad]="!r.ok" [attr.data-mi-imp-row]="r.row">
                <td>{{ r.row }}</td><td>{{ r.employee || r.employee_code }}</td><td>{{ r.input_code }}</td><td class="mi-num">{{ r.value }}</td>
                <td><div *ngFor="let e of r.errors" class="mi-err">{{ e }}</div><span *ngIf="r.ok" class="mi-st">{{ 'OK' | t }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- grid -->
      <div class="mi-wrap" *ngIf="d" data-mi-grid>
        <table class="mi-tbl">
          <thead><tr>
            <th class="mi-emp">{{ 'Employee' | t }}</th>
            <th *ngFor="let c of d.columns" class="mi-num" [attr.data-mi-col]="c.code">{{ c.name }}<small>{{ c.code }}</small></th>
            <th>{{ 'Amount (by the formulas)' | t }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of shown()" [class.ro]="!r.editable" [attr.data-mi-row]="r.emp_code">
              <td class="mi-emp"><b>{{ r.employee }}</b><small class="pc-small" style="margin-inline-start:6px">{{ r.emp_code }}</small>
                <div class="mi-note" *ngIf="r.note">{{ r.note }}</div>
                <div class="mi-err" *ngIf="rowErr[r.employee_id]">{{ rowErr[r.employee_id] }}</div></td>
              <td *ngFor="let c of d.columns" class="mi-num">
                <ng-container *ngIf="r.editable && r.has[c.code]; else ro">
                  <input type="number" min="0" step="0.5" [(ngModel)]="val[r.employee_id][c.code]" (ngModelChange)="changed(r)"
                         [class.chg]="isChanged(r, c.code)" [class.bad]="cellErr(r, c.code)" [title]="cellErr(r, c.code) || ''" [attr.data-mi-cell]="r.emp_code + ':' + c.code">
                </ng-container>
                <ng-template #ro><span class="mi-ro">{{ r.has[c.code] ? (+r.values[c.code] | number:'1.0-2') : '–' }}</span></ng-template>
              </td>
              <td class="mi-amt" [attr.data-mi-amt]="r.emp_code">
                <ng-container *ngIf="pv[r.employee_id] as p">
                  <span *ngFor="let l of p.lines; let last = last">{{ l.name }} {{ +l.amount | number:'1.2-2' }}<span class="mi-acc" *ngIf="l.accrued">{{ 'accrued' | t }}</span>{{ last ? '' : ' · ' }}</span>
                  <span *ngIf="p.lines.length"> = <b>{{ +p.total | number:'1.2-2' }}</b></span>
                  <span *ngIf="!p.lines.length" class="pc-small">–</span>
                </ng-container>
              </td>
            </tr>
            <tr *ngIf="!shown().length"><td [attr.colspan]="d.columns.length + 2" class="pc-small">{{ (d.rows.length ? 'No employee matches the search.' : 'No active employees in this branch.') | t }}</td></tr>
            <tr *ngIf="!d.columns.length"><td [attr.colspan]="2" class="pc-small">{{ 'No monthly-input components yet – make a variable component without a formula and use its code in a formula (or tick it under Columns).' | t }}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="mi-foot" *ngIf="d?.can_edit && d?.month.editable">
        <button type="button" class="t62-btn primary" [disabled]="busy || !changes().length" (click)="save()" data-mi-save>{{ 'Save' | t }} ({{ changes().length }})</button>
        <button type="button" class="t62-btn" [disabled]="busy || !changes().length" (click)="reset()">{{ 'Undo changes' | t }}</button>
        <span class="pc-small">{{ 'The figures are used by the employee’s next payslip – the payroll of this month.' | t }}</span>
      </div>
    </div>
  </div>
</div>`,
})
export class MonthlyInputsComponent implements OnInit {
  d: any = null; branch: any = null; month = ''; other = ''; q = '';
  val: Record<number, Record<string, any>> = {};
  orig: Record<number, Record<string, string>> = {};
  pv: Record<number, any> = {};
  errs: Record<string, Record<string, string>> = {};
  rowErr: Record<number, string> = {};
  busy = false; showImport = false; file: File | null = null; imp: any = null; flags: any[] | null = null;
  private timers: Record<number, any> = {};
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private i18n: I18nService) {}
  t(s: string): string { return this.i18n.t(s); }
  ngOnInit(): void { this.load(); }
  params(extra: any = {}): any {
    const p: any = { schema: schema(), ...extra };
    if (this.branch) { p.branch = this.branch; }
    if (this.month) { p.month = this.month; }
    return p;
  }
  async load(branchChanged = false): Promise<void> {
    if (branchChanged) { this.month = ''; }
    if (this.changes().length && this.d && !(await zConfirm(this.t('Leave the changes that are not saved?')))) { return; }
    try {
      const d = await firstValueFrom(this.http.get<any>(API, { params: this.params() }));
      if (!d.months.some((m: any) => m.value === d.month.month)) { d.months = [...d.months, { value: d.month.month, label: d.month.label }]; }
      this.val = {}; this.orig = {}; this.pv = {}; this.errs = {}; this.rowErr = {};
      for (const r of d.rows) {
        this.val[r.employee_id] = {}; this.orig[r.employee_id] = {};
        for (const c of d.columns) { this.val[r.employee_id][c.code] = +r.values[c.code]; this.orig[r.employee_id][c.code] = String(+r.values[c.code]); }
      }
      this.d = d; this.branch = d.branch; this.month = '';
      this.cd.detectChanges();   // the month options of the new answer exist before the choice is set
      this.month = d.month.month;
      const withValues = d.rows.filter((r: any) => d.columns.some((c: any) => +r.values[c.code]));
      if (withValues.length) { await this.preview(withValues); }
    } catch (e) { zToast(errText(e), 'err'); }
    this.cd.detectChanges();
  }
  useOther(): void { if (this.other) { this.month = this.other; this.load(); } }
  shown(): any[] {
    const q = (this.q || '').trim().toLowerCase();
    return (this.d?.rows || []).filter((r: any) => !q || (r.employee + ' ' + r.emp_code).toLowerCase().includes(q));
  }
  isChanged(r: any, code: string): boolean { return String(+(this.val[r.employee_id]?.[code] ?? 0)) !== this.orig[r.employee_id]?.[code]; }
  cellErr(r: any, code: string): string { return this.errs[String(r.employee_id)]?.[code] || ''; }
  changes(): any[] {
    if (!this.d) { return []; }
    const out: any[] = [];
    for (const r of this.d.rows) {
      if (!r.editable) { continue; }
      const values: any = {};
      for (const c of this.d.columns) {
        if (r.has[c.code] && this.isChanged(r, c.code)) { const v = this.val[r.employee_id][c.code]; values[c.code] = v === null || v === '' ? 0 : v; }
      }
      if (Object.keys(values).length) { out.push({ employee: r.employee_id, values }); }
    }
    return out;
  }
  changed(r: any): void {
    clearTimeout(this.timers[r.employee_id]);
    this.timers[r.employee_id] = setTimeout(() => this.preview([r]), 400);
  }
  async preview(rows: any[]): Promise<void> {
    const body = { month: this.month, rows: rows.map(r => ({ employee: r.employee_id, values: this.val[r.employee_id] })) };
    try {
      const res = await firstValueFrom(this.http.post<any>(API + 'preview/', body, { params: { schema: schema() } }));
      for (const k of Object.keys(res || {})) { this.pv[+k] = res[k]; }
    } catch { /* the preview is only a help */ }
    this.cd.detectChanges();
  }
  reset(): void {
    for (const r of this.d?.rows || []) { for (const c of this.d.columns) { this.val[r.employee_id][c.code] = +this.orig[r.employee_id][c.code]; } }
    this.errs = {}; this.rowErr = {}; this.preview((this.d?.rows || []).filter((r: any) => this.d.columns.some((c: any) => +r.values[c.code])));
  }
  async save(): Promise<void> {
    const rows = this.changes();
    if (!rows.length) { return; }
    this.busy = true; this.errs = {}; this.rowErr = {};
    try {
      const r = await firstValueFrom(this.http.post<any>(API, { month: this.month, branch: this.branch, rows }, { params: { schema: schema() } }));
      zToast(this.t('Saved – {0} figures for {1}.').replace('{0}', String(r.saved)).replace('{1}', this.d.month.label), 'ok');
      this.busy = false;
      for (const x of rows) { for (const k of Object.keys(x.values)) { this.orig[x.employee][k] = String(+x.values[k]); } }
      await this.load();
      return;
    } catch (e: any) {
      const p = e?.error?.errors;
      if (p && typeof p === 'object') {
        this.errs = p;
        for (const k of Object.keys(p)) { if (typeof p[k] === 'string') { this.rowErr[+k] = p[k]; } else { this.rowErr[+k] = Object.values(p[k]).join(' '); } }
      }
      zToast(errText(e), 'err');
    }
    this.busy = false; this.cd.detectChanges();
  }
  // ---------------------------------------------------------------- Excel template + import
  async template(): Promise<void> {
    try {
      const blob = await firstValueFrom(this.http.get(API + 'template/', { params: this.params(), responseType: 'blob' }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `monthly_inputs_${this.month}.xlsx`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { zToast(errText(e), 'err'); }
  }
  pick(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.imp = null; this.cd.detectChanges(); }
  impSummary(): string {
    const i = this.imp;
    return (i.dry_run ? this.t('Dry run: {0} rows without errors, {1} rows with errors.') : this.t('Applied: {0} rows saved, {1} rows with errors not saved.'))
      .replace('{0}', String(i.dry_run ? i.ok : i.applied)).replace('{1}', String(i.errors));
  }
  async runImport(apply: boolean): Promise<void> {
    if (!this.file) { return; }
    if (apply && !(await zConfirm(this.t('Save {0} figures for {1}?').replace('{0}', String(this.imp?.ok || 0)).replace('{1}', this.d?.month?.label || this.month)))) { return; }
    const fd = new FormData(); fd.append('file', this.file); fd.append('apply', apply ? '1' : '0'); fd.append('month', this.month); fd.append('branch', String(this.branch));
    this.busy = true;
    try {
      this.imp = await firstValueFrom(this.http.post<any>(API + 'import/', fd, { params: { schema: schema() } }));
      if (apply) { zToast(this.t('{0} figures saved.').replace('{0}', String(this.imp.applied)), 'ok'); this.busy = false; await this.load(); }
    } catch (e) { zToast(errText(e), 'err'); }
    this.busy = false; this.cd.detectChanges();
  }
  // ---------------------------------------------------------------- column setup
  async toggleFlags(): Promise<void> {
    if (this.flags) { this.flags = null; this.cd.detectChanges(); return; }
    try { this.flags = (await firstValueFrom(this.http.get<any>(API + 'components/', { params: { schema: schema() } }))).rows || []; }
    catch (e) { zToast(errText(e), 'err'); }
    this.cd.detectChanges();
  }
  async setFlag(c: any, on: boolean): Promise<void> {
    try {
      const r = await firstValueFrom(this.http.put<any>(`${API}components/${c.component_id}/`, { monthly_input: on === c.auto ? null : on }, { params: { schema: schema() } }));
      Object.assign(c, r); zToast(this.t('Saved.'), 'ok'); await this.load();
    } catch (e) { zToast(errText(e), 'err'); }
    this.cd.detectChanges();
  }
}
