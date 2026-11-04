// v1.62.10 (item 176)
/**
 * v1.62.10 (item 176) – Calendar › Weekend calendar in the new design. Before: a card list with three old pop-ups (create,
 * edit, a day) and 7 browser messages. Now: the list (code, description, year, days off, half days) with the shared list
 * tools, "+ New weekend calendar" and Edit open the shared form (a choice per weekday, weeks of the month for days off only
 * in some weeks), Delete on each row. The weekend rule of 1.62.6 (calendars/workdays.py: the weekday fields + alternate
 * weeks) reads exactly these fields; the old day-by-day screen stays reachable ("Day by day"). Saved as before:
 * /calendars/api/weekend/ {calendar_code, description, year, monday … sunday, is_alternate, alternate_weekends}.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { openZForm } from '../shared-ui/z-form.component';
import { DAYS, T, T62Base } from './t62';
import { WEEKEND_FORM } from './t62-forms';

@Component({
  selector: 'app-t62-weekend-calendars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, RouterModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  styles: [`.t62-year { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .t62-month { border: 1px solid #eceef5; border-radius: 10px; padding: 8px 10px; } .t62-month h4 { font-size: 13px; margin: 0 0 6px; font-weight: 600; }
    .t62-wk { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; font-size: 11.5px; }
    .t62-wk span { padding: 3px 0; border-radius: 5px; } .t62-wk span.work { background: #f3f4f8; } .t62-wk span.off { background: #fde2e4; color: #b3263a; font-weight: 600; }
    .t62-wk span.half { background: #fff0d9; color: #a0610a; }`],
  template: `
<div class="container hr-page" data-t62="weekend">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>Weekend calendar</h1>
          <p class="hr-head-d">The weekly days off of each year (e.g. Saturday – Sunday, or Friday for labour). Give a calendar to branches, departments, categories, designations or employees under Assign weekends.</p></div>
        <div class="hr-head-a hr-head-b">
          <a class="hr-tbtn" routerLink="/main-sidebar/settings/weekend-change" data-t62-wchange>Weekend change from a date</a>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="edit(null)" data-z-new data-t62-new>+ New weekend calendar</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>Code</th><th>Description</th><th>Year</th><th>Days off</th><th>Half days</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="6" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="6" class="hr-empty">No weekend calendar yet. Use + New weekend calendar.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td>{{ r.calendar_code }}</td><td>{{ r.description }}</td><td>{{ r.year }}</td>
              <td><span class="t62-chips"><span class="t62-chip off" *ngFor="let d of off(r)">{{ d }}</span><span *ngIf="!off(r).length">–</span></span></td>
              <td><span class="t62-chips"><span class="t62-chip half" *ngFor="let d of half(r)">{{ d }}</span><span *ngIf="!half(r).length">–</span></span></td>
              <td class="t62-actions">
                <button type="button" class="t62-link" (click)="view(r)" data-t62-view>View</button>
                <button type="button" class="t62-link" *ngIf="can.add" (click)="copy(r)" data-t62-copy>Make a copy</button>
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="edit(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r.calendar_code)" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="t62-dlg" *ngIf="yr" data-t62-dialog>
  <div class="t62-veil" (click)="yr = null"></div>
  <div class="t62-box" role="dialog" aria-modal="true" style="width:min(1040px, calc(100vw - 32px))">
    <div class="t62-head"><div><h2 class="t62-title">{{ yr.r.calendar_code }} – {{ yr.r.year }}</h2>
      <p class="t62-sub"><span class="t62-chip off">Day off</span> <span class="t62-chip half">Half day</span> <span class="t62-chip grey">Working day</span></p></div>
      <button type="button" class="t62-x" (click)="yr = null" aria-label="Close">×</button></div>
    <div class="t62-dbody">
      <div class="t62-year">
        <div class="t62-month" *ngFor="let m of yr.months">
          <h4>{{ m.name }}</h4>
          <div class="t62-wk"><span *ngFor="let d of short">{{ d }}</span></div>
          <div class="t62-wk"><span *ngFor="let c of m.cells" [ngClass]="c ? c.k : 'blank'">{{ c?.d }}</span></div>
        </div>
      </div>
    </div>
    <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="yr = null">Close</button></div>
  </div>
</div>`,
})
export class T62WeekendCalendarsComponent extends T62Base {
  model = 'weekend_calendar';
  endpoint = '/calendars/api/weekend/';
  override shape(rows: any[]): any[] { return [...rows].sort((a, b) => (b.year - a.year) || String(a.calendar_code).localeCompare(String(b.calendar_code))); }
  off(r: any): string[] {
    const alt = r.alternate_weekends && typeof r.alternate_weekends === 'object' ? r.alternate_weekends : {};
    const out: string[] = [];
    for (const d of DAYS) {
      const w = alt[d] ?? alt[d.toLowerCase()];
      if (w) { out.push(T('{0} (weeks {1})', [T(d), String(w).split(',').join(', ')])); } else if (r[d.toLowerCase()] === 'leave') { out.push(T(d)); }
    }
    return out;
  }
  half(r: any): string[] { return DAYS.filter(d => r[d.toLowerCase()] === 'halfday').map(d => T(d)); }
  yr: { r: any; months: { name: string; cells: ({ d: number; k: string } | null)[] }[] } | null = null;
  short = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => T(x));
  /** the year as the weekend rule reads it (calendars/workdays.py model_days: weekday fields, alternate weeks win for their day) */
  view(r: any): void {
    const alt = r.alternate_weekends && typeof r.alternate_weekends === 'object' ? r.alternate_weekends : {};
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const months = names.map((n, mi) => {
      const first = new Date(r.year, mi, 1); const cells: ({ d: number; k: string } | null)[] = [];
      for (let i = 0; i < (first.getDay() + 6) % 7; i++) { cells.push(null); }
      for (let d = 1; d <= new Date(r.year, mi + 1, 0).getDate(); d++) {
        const day = DAYS[(new Date(r.year, mi, d).getDay() + 6) % 7];
        const w = alt[day] ?? alt[day.toLowerCase()];
        const typ = w ? (String(w).split(',').map(x => +x).includes(Math.floor((d - 1) / 7) + 1) ? 'leave' : 'fullday') : r[day.toLowerCase()];
        cells.push({ d, k: typ === 'leave' ? 'off' : typ === 'halfday' ? 'half' : 'work' });
      }
      return { name: T(n), cells };
    });
    this.yr = { r, months };
  }
  async copy(r: any): Promise<void> {
    const v = WEEKEND_FORM.fromRecord!({ ...r });
    delete v.id; delete v.details; delete v.created_at; delete v.created_by;
    v.calendar_code = `${r.calendar_code}_COPY`; v.description = `${r.description} ${T('Copy')}`;
    if (await openZForm({ ...WEEKEND_FORM, initial: v })) { await this.load(); }
  }
  async edit(r: any): Promise<void> {
    const rec = r ? { ...r } : undefined;
    if (rec) { delete rec.details; }   // 365 day rows – not part of the form
    if (await openZForm(WEEKEND_FORM, rec)) { await this.load(); }
  }
}
