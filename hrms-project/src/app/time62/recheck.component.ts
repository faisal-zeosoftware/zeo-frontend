// v1.62.10 (item 171)
/**
 * v1.62.10 (item 171) – Attendance › Daily work › Recheck in the new design. Before: one employee box and a Send button, no
 * list. Now: the list of the locations employees confirmed (employee, day, time, place, map link) with the shared list tools,
 * "+ New recheck" opens the shared form (employee – Send): the employee is asked in the app and by e-mail, as before
 * (POST /calendars/api/attendance-Recheck/email/ {emp_code}). Rights: add / view / delete attendance recheck.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { T62Base, empName } from './t62';

export const RECHECK_FORM: ZFormConfig = {
  thing: 'recheck', endpoint: '/calendars/api/attendance-Recheck/email/', heading: 'Ask an employee to confirm the location', action: 'Send',
  subtitle: 'The employee is asked in the app (and by e-mail when the company e-mail settings are set up) to press Recheck location. Only for an employee who has clocked in and not out.',
  sections: [{ title: 'Recheck', fields: [
    { key: 'emp_code', label: 'Employee', type: 'select', required: true, full: true, search: true,
      source: { endpoint: '/employee/api/emplist/', value: 'id', label: (r: any) => empName(r) } }] }],
  okText: d => d?.detail || d?.message || null,
};

@Component({
  selector: 'app-t62-recheck',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" data-t62="recheck">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Recheck</h1>
          <p class="hr-head-d">Ask an employee who is clocked in to confirm where they are. The locations they confirmed are listed here, newest first.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="add()" data-z-new data-t62-new>+ New recheck</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready && can.view">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>Employee</th><th>Day</th><th>Confirmed at</th><th>Location</th><th>Map</th><th class="hr-col-actions" *ngIf="can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="6" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="6" class="hr-empty">No location confirmed yet. Use + New recheck to ask an employee.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-z-id]="r.id">
              <td>{{ r.employee_name || '–' }} <span class="t62-cell-sub">{{ r.emp_code }}</span></td>
              <td>{{ dmy(r.date) }}</td>
              <td>{{ r.checked_at | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ r.location || '–' }}</td>
              <td><a *ngIf="r.lat && r.lng" [href]="'https://www.google.com/maps?q=' + r.lat + ',' + r.lng" target="_blank" rel="noopener">{{ (+r.lat).toFixed(5) }}, {{ (+r.lng).toFixed(5) }}</a></td>
              <td class="t62-actions" *ngIf="can.delete">
                <button type="button" class="z-row-btn danger" (click)="del(r, (r.employee_name || r.emp_code) + ' ' + dmy(r.date))" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <p class="t62-note" *ngIf="ready && !can.view && can.add">You may ask employees to confirm their location; the list of answers needs the view right.</p>
  </div>
</div>`,
})
export class T62RecheckComponent extends T62Base {
  model = 'attendancerecheck';
  endpoint = '/calendars/api/attendance-Recheck/';
  override async load(): Promise<void> { if (this.can.view) { await super.load(); } else { this.loading = false; } }
  async add(): Promise<void> { if (await openZForm(RECHECK_FORM)) { await this.load(); } }
}
