/**
 * v1.12.0 Shift planner – Employee availability (HR and managers). Lists the availability employees gave (not available,
 * preferred or available – per weekday or for dates, optionally for one shift) and lets HR / the reporting manager add it
 * for an employee. Rosters flag shifts planned against it. Employees manage their own in My schedule.
 * API: availability/?employee, availability/<id>/, team-schedule/ (employees the user may plan), shift-master/?active=1
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, niceDate, WEEKDAYS } from './sp-api.service';

@Component({
  selector: 'app-sp-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section"><div class="lp-head"><div>
      <h1 class="page-title">Employee availability</h1>
      <p class="lp-desc">When employees cannot work or which shift they prefer. Rosters show a warning when a shift is planned against it.</p>
    </div></div></div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>
      <div class="sp-bar">
        <select [(ngModel)]="filter" (change)="load()" aria-label="Employee"><option [ngValue]="null">All employees</option><option *ngFor="let e of emps" [ngValue]="e.employee_id">{{ e.name }}</option></select>
      </div>
      <div class="lp-scroll" *ngIf="rows.length">
        <table class="lp-mini">
          <thead><tr><th>Employee</th><th>When</th><th>Availability</th><th>Shift</th><th>Note</th><th></th></tr></thead>
          <tbody><tr *ngFor="let a of rows">
            <td>{{ a.employee }}</td>
            <td>{{ a.weekday_label ? 'Every ' + a.weekday_label : nice(a.date_from) + (a.date_to && a.date_to !== a.date_from ? ' – ' + nice(a.date_to) : '') }}</td>
            <td>{{ a.kind_label }}</td><td>{{ shiftName(a.shift_id) }}</td><td>{{ a.note }}</td>
            <td><button type="button" class="lp-x" (click)="remove(a)" aria-label="Remove">×</button></td></tr></tbody>
        </table>
      </div>
      <p class="lp-muted" *ngIf="!rows.length">No availability recorded.</p>
      <div class="sp-h">Add availability</div>
      <div class="lp-form">
        <label>Employee<select [(ngModel)]="f.employee"><option [ngValue]="null">Choose…</option><option *ngFor="let e of emps" [ngValue]="e.employee_id">{{ e.name }}</option></select></label>
        <label>Availability<select [(ngModel)]="f.kind"><option value="unavailable">Not available</option><option value="preferred">Preferred</option><option value="available">Available</option></select></label>
        <label>Repeats on<select [(ngModel)]="f.weekday"><option [ngValue]="null">Dates below</option><option *ngFor="let w of weekdays; let i = index" [ngValue]="i">Every {{ w }}</option></select><span class="sp-err" *ngIf="err['weekday']">{{ err['weekday'] }}</span></label>
        <label *ngIf="f.weekday === null">From<input type="date" [(ngModel)]="f.date_from"></label>
        <label *ngIf="f.weekday === null">To<input type="date" [(ngModel)]="f.date_to"><span class="sp-err" *ngIf="err['date_to']">{{ err['date_to'] }}</span></label>
        <label>Shift (optional)<select [(ngModel)]="f.shift"><option [ngValue]="null">Any shift</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select></label>
        <label>Note<input [(ngModel)]="f.note" maxlength="255"></label>
      </div>
      <button type="button" class="lp-btn primary" [disabled]="!f.employee" (click)="add()">Save availability</button>
    </div>
  </div>
</div>`,
})
export class SpAvailabilityComponent implements OnInit {
  rows: any[] = []; emps: any[] = []; shifts: any[] = [];
  filter: number | null = null;
  f: any = { employee: null, kind: 'unavailable', weekday: null, date_from: '', date_to: '', shift: null, note: '' };
  err: Record<string, string> = {};
  msg = ''; msgErr = false;
  weekdays = WEEKDAYS; nice = niceDate;
  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    this.shifts = await this.api.get('shift-master/', { active: 1 }).catch(() => []);
    const t: any = await this.api.get('team-schedule/').catch(() => ({ rows: [] }));
    this.emps = t.rows || [];
    await this.load();
  }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }
  shiftName(id: number | null): string { return id ? (this.shifts.find(s => s.id === id)?.name || '–') : 'Any'; }
  async load(): Promise<void> { try { this.rows = await this.api.get('availability/', { employee: this.filter }); } catch (e) { this.say(SpApiService.error(e), true); } this.cd.markForCheck(); }
  async add(): Promise<void> {
    const b = { ...this.f }; if (b.weekday !== null) { b.date_from = ''; b.date_to = ''; }
    try { await this.api.post('availability/', b); this.err = {}; this.say('Availability saved.'); this.f = { ...this.f, note: '' }; await this.load(); }
    catch (e) { this.err = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
  }
  async remove(a: any): Promise<void> { try { await this.api.delete(`availability/${a.id}/`); await this.load(); } catch (e) { this.say(SpApiService.error(e), true); } }
}
