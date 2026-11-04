// v1.62.10 (item 176)
/**
 * v1.62.10 (item 176) – Calendar › Holiday calendar in the new design. Before: a calendar picker, a holiday table and four
 * old pop-ups (12 browser messages). Now: the calendars (name, year, holidays, next holiday) with the shared list tools,
 * "+ New holiday calendar", Edit / Delete on each row; Holidays opens the calendar's holidays at the side with
 * "+ Add holiday", Edit and Delete – all forms are the shared form. Saved as before: /calendars/api/holiday-calendar/
 * {calendar_title, year} and /calendars/api/holiday/ {description, start_date, end_date, note, restricted, calendar}.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { openZForm } from '../shared-ui/z-form.component';
import { HrPermissionService, ModelPerms } from '../hr-modules/hr-permission.service';
import { firstValueFrom } from 'rxjs';
import { T, T62Base } from './t62';
import { HOLIDAY_CALENDAR_FORM, holidayForm } from './t62-forms';

@Component({
  selector: 'app-t62-holiday-calendars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" data-t62="holiday">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Holiday calendar</h1>
          <p class="hr-head-d">The public holidays of each year. Open a calendar's holidays to add or change them; give a calendar to branches, departments, categories or employees under Assign holidays.</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="edit(null)" data-z-new data-t62-new>+ New holiday calendar</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div [class.t62-grid2]="sel">
        <div style="min-width:0"><div class="table-responsive">
          <table class="table hr-table" data-t62-list>
            <thead><tr><th>Name</th><th>Year</th><th>Holidays</th><th>Next holiday</th><th class="hr-col-actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="5" class="hr-empty">Loading…</td></tr>
              <tr *ngIf="!loading && !rows.length"><td colspan="5" class="hr-empty">No holiday calendar yet. Use + New holiday calendar.</td></tr>
              <tr *ngFor="let r of rows" [class.selected]="sel?.id === r.id" (click)="open(r)" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
                <td>{{ r.calendar_title }}</td><td>{{ r.year }}</td><td>{{ (r.holiday_list || []).length }}</td>
                <td>{{ next(r) }}</td>
                <td class="t62-actions" (click)="$event.stopPropagation()">
                  <button type="button" class="t62-link" (click)="open(r)" data-t62-holidays>Holidays</button>
                  <button type="button" class="z-row-btn" *ngIf="can.change" (click)="edit(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                  <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r.calendar_title)" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div></div>
        <aside class="t62-panel" *ngIf="sel" data-t62-panel>
          <div class="t62-panel-head"><h3>{{ sel.calendar_title }} – {{ sel.year }}</h3>
            <span><button type="button" class="t62-btn small primary" *ngIf="hol.add" (click)="holiday(null)" data-t62-add-holiday>+ Add holiday</button>
              <button type="button" class="t62-x" (click)="sel = null" aria-label="Close">×</button></span></div>
          <table class="t62-tbl" zPlain>
            <thead><tr><th>Holiday</th><th>Dates</th><th>Days</th><th></th></tr></thead>
            <tbody>
              <tr *ngIf="!(sel.holiday_list || []).length"><td colspan="4" class="t62-hint">No holidays yet.</td></tr>
              <tr *ngFor="let h of sel.holiday_list" [attr.data-t62-holiday]="h.id">
                <td>{{ h.description }} <span class="t62-chip half" *ngIf="h.restricted">Optional</span><span class="t62-cell-sub" *ngIf="h.note">{{ h.note }}</span></td>
                <td>{{ dmy(h.start_date) }}<ng-container *ngIf="h.end_date && h.end_date !== h.start_date"> – {{ dmy(h.end_date) }}</ng-container></td>
                <td>{{ days(h) }}</td>
                <td class="t62-actions">
                  <button type="button" class="z-row-btn" *ngIf="hol.change" (click)="holiday(h)" title="Edit" aria-label="Edit"><mat-icon>edit</mat-icon></button>
                  <button type="button" class="z-row-btn danger" *ngIf="hol.delete" (click)="delHoliday(h)" title="Delete" aria-label="Delete"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </aside>
      </div>
    </div>
  </div>
</div>`,
})
export class T62HolidayCalendarsComponent extends T62Base {
  model = 'holiday_calendar';
  endpoint = '/calendars/api/holiday-calendar/';
  sel: any = null;
  hol: ModelPerms = { view: false, add: false, change: false, delete: false };

  override async afterInit(): Promise<void> {
    try { this.hol = await firstValueFrom((this.hp as HrPermissionService).can('holiday')); } catch { /* */ }
    this.cd.detectChanges();
  }
  override shape(rows: any[]): any[] {
    const out = [...rows].sort((a, b) => (b.year - a.year) || String(a.calendar_title).localeCompare(String(b.calendar_title)));
    if (this.sel) { this.sel = out.find(r => r.id === this.sel.id) || null; }
    return out;
  }
  next(r: any): string {
    const today = new Date().toISOString().slice(0, 10);
    const h = (r.holiday_list || []).find((x: any) => (x.end_date || x.start_date) >= today);
    return h ? `${h.description} (${this.dmy(h.start_date)})` : '–';
  }
  days(h: any): number { return Math.round((Date.parse(h.end_date || h.start_date) - Date.parse(h.start_date)) / 86400000) + 1; }
  open(r: any): void { this.sel = r; }
  async edit(r: any): Promise<void> {
    const rec = r ? { id: r.id, calendar_title: r.calendar_title, year: r.year } : undefined;
    if (await openZForm(HOLIDAY_CALENDAR_FORM, rec)) { await this.load(); }
  }
  async holiday(h: any): Promise<void> {
    if (!this.sel) { return; }
    if (await openZForm(holidayForm(this.sel.id, this.sel.year), h ? { ...h } : undefined)) { await this.load(); }
  }
  async delHoliday(h: any): Promise<void> { await this.del(h, h.description, '/calendars/api/holiday/'); }
}
