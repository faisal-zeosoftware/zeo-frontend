// v1.62.10 (item 171)
/**
 * v1.62.10 (item 171) – Shift planner › Employee shifts in the new design. Before: an old pop-up with filters, a paged
 * employee table and 15 browser messages. Now: the list (name, pattern, from – to, who) with the shared list tools,
 * "+ New employee shift" and Edit open the shared form (pattern, dates; branches / departments / designations / categories /
 * employees, employees with a search box), Delete on each row, and for a rotating pattern "Start days": on which day of the
 * cycle each employee starts (employee_offsets, as the old screen). Saved as before: /calendars/api/employee-shift/.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionService } from '../login/session.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zToast } from '../shared-ui/z-toast';
import { T, T62Base, empName } from './t62';

@Component({
  selector: 'app-t62-employee-shifts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" data-t62="employee-shifts">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Employee shifts</h1>
          <p class="hr-head-d">Which shift pattern applies to whom and from when. A pattern given to an employee wins over one given to their branch, department, designation or category; a published roster or a shift override still decides first.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="edit(null)" data-z-new data-t62-new>+ New employee shift</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>Name</th><th>Shift pattern</th><th>From</th><th>To</th><th>Applies to</th><th class="hr-col-actions" *ngIf="can.change || can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="6" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="6" class="hr-empty">No employee shift yet. Use + New employee shift.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td>{{ r.schedule_name || '–' }}</td>
              <td>{{ patternName(r.shift_pattern) || '–' }}</td>
              <td>{{ dmy(r.start_date) }}</td><td>{{ r.end_date ? dmy(r.end_date) : t('Open-ended') }}</td>
              <td><span class="t62-chips"><span class="t62-chip" *ngFor="let w of who(r)">{{ w }}</span></span></td>
              <td class="t62-actions" *ngIf="can.change || can.delete">
                <button type="button" class="t62-link" *ngIf="can.change && isRotating(r)" (click)="offsets(r)" data-t62-offsets>Start days</button>
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="edit(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r.schedule_name || patternName(r.shift_pattern))" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" *ngIf="off" data-t62-dialog>
  <div class="t62-veil" (click)="off = null"></div>
  <div class="t62-box narrow" role="dialog" aria-modal="true">
    <div class="t62-head"><div><h2 class="t62-title">Start days</h2>
      <p class="t62-sub">On which day of the rotation each employee is on the start date – to spread the days off across a team.</p></div>
      <button type="button" class="t62-x" (click)="off = null" aria-label="Close">×</button></div>
    <div class="t62-dbody">
      <p class="t62-top" *ngIf="offErr">{{ offErr }}</p>
      <p class="t62-hint" *ngIf="!off.list.length">Only employees given this shift one by one have a start day. Add employees on Edit first.</p>
      <table class="t62-tbl" zPlain *ngIf="off.list.length"><thead><tr><th>Employee</th><th>Starts on</th></tr></thead>
        <tbody><tr *ngFor="let e of off.list"><td>{{ e.name }}</td>
          <td><select [(ngModel)]="off.v[e.id]"><option *ngFor="let n of off.days" [ngValue]="n">{{ t('Day {0} of the cycle', [n + 1]) }}</option></select></td></tr></tbody></table>
    </div>
    <div class="t62-foot"><button type="button" class="t62-btn" (click)="off = null">Cancel</button><span class="t62-grow"></span>
      <button type="button" class="t62-btn primary" (click)="saveOffsets()" [disabled]="busy || !off.list.length" data-zf-save>Save</button></div>
  </div>
</div>`,
})
export class T62EmployeeShiftsComponent extends T62Base {
  model = 'employeeshiftschedule';
  endpoint = '/calendars/api/employee-shift/';
  patterns: any[] = [];
  off: { row: any; list: { id: number; name: string }[]; days: number[]; v: Record<number, number> } | null = null;
  offErr = ''; busy = false;
  private session = inject(SessionService);

  override async load(): Promise<void> {
    try { this.patterns = await this.list('/calendars/api/shiftpattern/'); } catch { this.patterns = []; }
    await super.load();
  }
  override shape(rows: any[]): any[] { return [...rows].sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || ''))); }
  pattern(id: any): any { return this.patterns.find(p => String(p.id) === String(id)) || null; }
  patternName(id: any): string { return this.pattern(id)?.name || ''; }
  isRotating(r: any): boolean { return this.pattern(r.shift_pattern)?.pattern_type === 'rotating'; }
  who(r: any): string[] {
    const out: string[] = [];
    (r.branch_names || []).forEach((x: any) => out.push(x.branch_name));
    (r.department_names || []).forEach((x: any) => out.push(x.dept_name));
    (r.designation_names || []).forEach((x: any) => out.push(x.desgntn_job_title));
    (r.category_names || []).forEach((x: any) => out.push(x.ctgry_title));
    const e = r.employee_names || [];
    if (e.length > 4) { out.push(T('{0} employees', [e.length])); } else { e.forEach((x: any) => out.push(empName(x))); }
    return out.length ? out : [T('Nobody')];
  }

  form(): ZFormConfig {
    const multi = (key: string, label: string, endpoint: string, lab: any, extra: any = {}) =>
      ({ key, label, type: 'multi' as const, full: true, source: { endpoint, label: lab }, ...extra });
    return {
      thing: 'employee shift', endpoint: this.endpoint,
      subtitle: 'The shift pattern and the people it applies to. Leave the end date empty for open-ended.',
      sections: [
        { title: 'Shift', fields: [
          { key: 'schedule_name', label: 'Name', max: 100 },
          { key: 'shift_pattern', label: 'Shift pattern', type: 'select', required: true, source: { endpoint: '/calendars/api/shiftpattern/', label: 'name' } },
          { key: 'start_date', label: 'From', type: 'date', required: true },
          { key: 'end_date', label: 'To', type: 'date', hint: 'Empty = open-ended.' }] },
        { title: 'Applies to', fields: [
          multi('branches', 'Branches', '/organisation/api/Branch/', 'branch_name'),
          multi('departments', 'Departments', '/organisation/api/Department/', 'dept_name', { search: true }),
          multi('designations', 'Designations', '/organisation/api/Designation/', 'desgntn_job_title', { search: true }),
          multi('categories', 'Categories', '/organisation/api/Catogory/', 'ctgry_title'),
          multi('employee', 'Employees', '/employee/api/emplist/', (x: any) => empName(x), { search: true, hint: 'Employees given the shift one by one win over a branch, department, designation or category.' })] }],
      toBody: (v: any, editing: boolean) => {
        const b: any = {};
        for (const k of ['schedule_name', 'shift_pattern', 'start_date', 'end_date', 'branches', 'departments', 'designations', 'categories', 'employee']) { if (v[k] !== undefined) { b[k] = v[k]; } }
        if (!b.end_date) { b.end_date = null; }
        if (!editing) { const me = this.session.getUserId(); if (me) { b.created_by = me; } }   // the API requires who made it
        const emps: number[] = (b.employee || []).map((x: any) => Number(x));
        const old = (editing && v.employee_offsets) || {};
        // as the old screen: a rotating pattern keeps a start day for each employee (0 = day 1 of the cycle); other patterns none
        b.employee_offsets = this.pattern(b.shift_pattern)?.pattern_type === 'rotating' ? Object.fromEntries(emps.map(id => [id, Number(old[id] ?? 0)])) : {};
        return b;
      },
    };
  }
  async edit(r: any): Promise<void> { if (await openZForm(this.form(), r || undefined)) { await this.load(); } }

  offsets(r: any): void {
    const p = this.pattern(r.shift_pattern); const x = p?.pattern_config?.rotating || {};
    const len = Math.max(1, Number(x.work_days ?? p?.work_days ?? 1) + Number(x.off_days ?? p?.off_days ?? 0));
    const list = (r.employee_names || []).map((e: any) => ({ id: e.id, name: empName(e) }));
    const v: Record<number, number> = {};
    list.forEach((e: any) => { v[e.id] = Math.min(len - 1, Number((r.employee_offsets || {})[e.id] ?? 0)); });
    this.off = { row: r, list, days: Array.from({ length: len }, (_, i) => i), v }; this.offErr = '';
  }
  async saveOffsets(): Promise<void> {
    if (!this.off) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.patch(this.url(`${this.endpoint}${this.off.row.id}/`), { employee_offsets: this.off.v }));
      zToast(T('Start days saved.'), 'ok'); this.off = null; await this.load();
    } catch (e) { this.offErr = httpErrorText(e); }
    this.busy = false;
  }
}
