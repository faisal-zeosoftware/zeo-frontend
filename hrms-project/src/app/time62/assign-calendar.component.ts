// v1.62.10 (item 176)
/**
 * v1.62.10 (item 176) – Calendar › Assign weekends and Assign holidays in the new design (one screen, route data
 * `kind`). Before: old pop-ups with four filters and a paged employee table (9 browser messages each). Now: the assignments
 * (calendar, given to, who) with the shared list tools, "+ New assignment" and Edit open the shared form (calendar; given to
 * branches / departments / categories / designations / employees – employees with a search box), Delete on each row.
 * The same records as before: /calendars/api/assign-weekend/ {related_to, weekend_model, branch, department, category,
 * designation, employee} (the weekend rule of 1.62.6 applies them, most specific first) and /calendars/api/assign-holiday/.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { openZForm } from '../shared-ui/z-form.component';
import { T, T62Base } from './t62';
import { AssignKind, LEVEL_LABEL, assignForm } from './t62-forms';

@Component({
  selector: 'app-t62-assign-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, RouterModule, MatIconModule, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', './t62.css'],
  template: `
<div class="container hr-page" [attr.data-t62]="'assign-' + kind">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ weekend ? 'Assign weekends' : 'Assign holidays' }}</h1>
          <p class="hr-head-d" *ngIf="weekend">Which weekend calendar applies to whom. The most specific assignment wins: employee, then designation, category, department, branch. A roster, a shift override or a shift pattern still decides before any weekend calendar.</p>
          <p class="hr-head-d" *ngIf="!weekend">Which holiday calendar applies to whom. An employee assignment wins over a branch, department or category.</p></div>
        <div class="hr-head-a hr-head-b">
          <a class="hr-tbtn" *ngIf="weekend" routerLink="/main-sidebar/settings/weekend-change" data-t62-wchange>Weekend change from a date</a>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="can.add" (click)="edit(null)" data-z-new data-t62-new>+ New assignment</button>
        </div>
      </div>
    </div>
    <p class="t62-msg" *ngIf="failed">{{ failed }}</p>
    <div class="t62-body" *ngIf="ready">
      <div class="table-responsive">
        <table class="table hr-table" data-t62-list>
          <thead><tr><th>{{ weekend ? 'Weekend calendar' : 'Holiday calendar' }}</th><th>Applies to</th><th>Who</th><th class="hr-col-actions" *ngIf="can.change || can.delete">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="loading"><td colspan="4" class="hr-empty">Loading…</td></tr>
            <tr *ngIf="!loading && !rows.length"><td colspan="4" class="hr-empty">No assignment yet. Use + New assignment.</td></tr>
            <tr *ngFor="let r of rows" [attr.data-t62-row]="r.id" [attr.data-z-id]="r.id">
              <td>{{ r[calKey] }}</td>
              <td>{{ level(r.related_to) }}</td>
              <td><span class="t62-chips"><span class="t62-chip" *ngFor="let w of who(r)">{{ w }}</span></span></td>
              <td class="t62-actions" *ngIf="can.change || can.delete">
                <button type="button" class="z-row-btn" *ngIf="can.change" (click)="edit(r)" title="Edit" aria-label="Edit" data-z-row-edit><mat-icon>edit</mat-icon></button>
                <button type="button" class="z-row-btn danger" *ngIf="can.delete" (click)="del(r, r[calKey] + ' – ' + level(r.related_to))" title="Delete" aria-label="Delete" data-z-row-delete><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`,
})
export class T62AssignCalendarComponent extends T62Base {
  kind: AssignKind = (inject(ActivatedRoute).snapshot.data['kind'] || 'weekend') as AssignKind;
  weekend = this.kind === 'weekend';
  model = this.weekend ? 'assign_weekend' : 'assign_holiday';
  endpoint = this.weekend ? '/calendars/api/assign-weekend/' : '/calendars/api/assign-holiday/';
  calKey = this.weekend ? 'weekend_model' : 'holiday_model';

  level(l: string): string { return T(LEVEL_LABEL[l] || l || '–'); }
  who(r: any): string[] {
    const l = r.related_to || 'employee'; const v = Array.isArray(r[l]) ? r[l] : [];
    if (l === 'employee' && v.length > 6) { return [T('{0} employees', [v.length])]; }
    return v.length ? v.map((x: any) => String(x)) : [T('Nobody')];
  }
  async edit(r: any): Promise<void> { if (await openZForm(assignForm(this.kind), r ? { ...r } : undefined)) { await this.load(); } }
}
