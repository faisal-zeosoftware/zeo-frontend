// v1.62.6 (item 22)
/**
 * v1.62.6 (item 22) – Weekend change from a date: who, the new weekend calendar and the start date; the leaves it affects
 * (old → new days, balance difference) with Recalculate / Keep as approved per approved leave; leaves in a paid payroll period
 * never change. API: /leave-policy/api/weekend-change/ (GET history + options, POST action preview | apply).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

@Component({
  selector: 'app-weekend-change',
  standalone: true,
  imports: [CommonModule, FormsModule, ZDateFieldComponent],
  styleUrls: ['./leave-policy.css'],
  styles: [`.wc-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .wc-card h2 { font-size: 15px; margin: 0 0 10px; } .wc-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .wc-form label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #5d6670; }
    .wc-form select { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; min-width: 180px; }
    .wc-form select[multiple] { min-height: 110px; min-width: 240px; }
    table.wc { width: 100%; border-collapse: collapse; font-size: 13px; } .wc th, .wc td { padding: 7px 6px; border-bottom: 1px solid #eef0f2; text-align: start; vertical-align: top; }
    .wc th { background: #f7f8fa; } .wc td.num { text-align: end; white-space: nowrap; }
    .wc-tag { font-size: 11px; padding: 1px 8px; border-radius: 9px; background: #eef2ff; color: #3730a3; white-space: nowrap; }
    .wc-tag.paid { background: #fde8e6; color: #9b2c24; } .wc-tag.wait { background: #fff4e0; color: #7a4b00; }
    .wc-choice { display: flex; gap: 10px; flex-wrap: wrap; } .wc-choice label { display: flex; gap: 4px; align-items: center; font-size: 12.5px; }
    .wc-hint { font-size: 12px; color: #5d6670; max-width: 760px; } .wc-plus { color: #1f7a4d; } .wc-minus { color: #b42318; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head zp-cardhead"><div><h1>Weekend change from a date</h1>
    <p class="lp-desc">Give a branch, department, category, designation or some employees a new weekend from a start date. Days before the start date keep the old weekend. Approved leave after the start date is listed with its old and new day count: choose Recalculate (the difference goes to the leave history and the employee is told) or Keep as approved. Leave in a paid payroll period never changes.</p></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err" data-wc-msg>{{ msg }}</p>
  <ng-container *ngIf="o">
    <div class="wc-card" *ngIf="canChange">
      <h2>The change</h2>
      <div class="wc-form">
        <label>Who<select [(ngModel)]="f.level" (ngModelChange)="f.ids = []; pv = null" data-wc-level>
          <option value="branch">Branch</option><option value="department">Department</option><option value="category">Category</option>
          <option value="designation">Designation</option><option value="employee">Employees</option></select></label>
        <label>{{ levelLabel() }}<select multiple [(ngModel)]="f.ids" (ngModelChange)="pv = null" data-wc-ids>
          <option *ngFor="let x of o.options[f.level]" [ngValue]="x.id">{{ x.name }}</option></select></label>
        <label>New weekend calendar<select [(ngModel)]="f.weekend" (ngModelChange)="pv = null" data-wc-weekend><option [ngValue]="null">–</option>
          <option *ngFor="let w of o.options.weekend" [ngValue]="w.id">{{ w.name }}</option></select></label>
        <label>Starts on<z-date-field [(value)]="f.start_date" (valueChange)="pv = null" data-wc-start></z-date-field></label>
        <button type="button" class="lp-btn primary" (click)="preview()" [disabled]="busy || !ready()" data-wc-preview>Show the leaves it affects</button>
      </div>
      <p class="wc-hint">The most specific weekend wins: employee, then designation, category, department, branch. A roster, a shift override or a shift pattern still decides before any weekend calendar.</p>
    </div>
    <div class="wc-card" *ngIf="pv" data-wc-preview-card>
      <h2>Leaves it affects</h2>
      <p class="wc-hint" data-wc-summary><span data-no-translate>{{ pv.names.join(', ') }}</span> – <span>{{ pv.employees }} employee(s)</span>. <span>New weekend</span>&ngsp;<span data-no-translate>{{ pv.weekend_code }}</span> (<ng-container *ngFor="let n of pv.weekend_days; let l = last"><span>{{ n }}</span><ng-container *ngIf="!l">, </ng-container></ng-container>)&ngsp;<span>from</span> {{ pv.start_date | date:'dd/MM/yyyy' }}.</p>
      <table class="wc" *ngIf="pv.leaves.length"><tr><th>Employee</th><th>Leave</th><th>Dates</th><th class="num">Days now → new</th><th class="num">Balance difference</th><th>Choice</th></tr>
        <tr *ngFor="let l of pv.leaves" [attr.data-wc-leave]="l.id">
          <td>{{ l.employee }}</td><td>{{ l.document_number }}<br><small class="wc-hint">{{ l.leave_type }}</small></td>
          <td>{{ l.start_date | date:'dd/MM/yyyy' }} – {{ l.end_date | date:'dd/MM/yyyy' }}</td>
          <td class="num">{{ l.old_days }} → <b>{{ l.new_days }}</b></td>
          <td class="num"><span *ngIf="l.status === 'approved'" [class.wc-plus]="l.balance_difference > 0" [class.wc-minus]="l.balance_difference < 0">{{ l.balance_difference > 0 ? '+' : '' }}{{ l.balance_difference }}</span><span *ngIf="l.status !== 'approved'">–</span></td>
          <td><span class="wc-tag paid" *ngIf="l.payroll_paid">Payroll paid – kept</span>
            <span class="wc-tag wait" *ngIf="l.status === 'pending'">Waiting – counted again</span>
            <div class="wc-choice" *ngIf="l.can_choose">
              <label><input type="radio" [name]="'c' + l.id" value="recalculate" [(ngModel)]="choices[l.id]" data-wc-recalc> Recalculate</label>
              <label><input type="radio" [name]="'c' + l.id" value="keep" [(ngModel)]="choices[l.id]" data-wc-keep> Keep as approved</label></div></td></tr></table>
      <p class="wc-hint" *ngIf="!pv.leaves.length">No leave changes its day count.</p>
      <div class="wc-form" style="margin-top:12px">
        <button type="button" class="lp-btn" (click)="pv = null">Cancel</button>
        <button type="button" class="lp-btn primary" (click)="apply()" [disabled]="busy || !allChosen()" data-wc-apply>Apply the change</button>
        <span class="wc-hint" *ngIf="!allChosen()">Choose Recalculate or Keep as approved for each approved leave.</span>
      </div>
    </div>
    <div class="wc-card">
      <h2>Weekend changes made</h2>
      <table class="wc" *ngIf="o.changes.length"><tr><th>Starts on</th><th>Who</th><th>New weekend</th><th>Leaves</th><th>By</th></tr>
        <tr *ngFor="let c of o.changes" [attr.data-wc-change]="c.id"><td>{{ c.start_date | date:'dd/MM/yyyy' }}</td><td>{{ c.names?.join(', ') }}</td><td>{{ c.weekend_code }}</td>
          <td>{{ count(c, 'recalculated') }} recalculated, {{ count(c, 'kept') + count(c, 'kept_paid') }} kept, {{ count(c, 'recounted') }} waiting counted again</td>
          <td>{{ c.by_name || '–' }}<br><small class="wc-hint">{{ c.at | date:'dd/MM/yyyy HH:mm' }}</small></td></tr></table>
      <p class="wc-hint" *ngIf="!o.changes.length">No weekend change yet.</p>
    </div>
  </ng-container>
</div>`,
})
export class WeekendChangeComponent implements OnInit {
  o: any = null; pv: any = null; f: any = { level: 'category', ids: [], weekend: null, start_date: '' };
  choices: { [id: number]: string } = {}; msg = ''; err = false; busy = false; canChange = false;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(): string { return `${this.rec.api}/leave-policy/api/weekend-change/?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    try { this.o = await firstValueFrom(this.http.get(this.url())); this.canChange = !!this.o?.can_change; } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  levelLabel(): string { return ({ branch: 'Branches', department: 'Departments', category: 'Categories', designation: 'Designations', employee: 'Employees' } as any)[this.f.level]; }
  ready(): boolean { return !!(this.f.ids?.length && this.f.weekend && this.f.start_date); }
  allChosen(): boolean { return (this.pv?.leaves || []).every((l: any) => !l.can_choose || !!this.choices[l.id]); }
  count(c: any, r: string): number { return (c.leaves || []).filter((l: any) => l.result === r).length; }
  body(action: string): any { return { action, level: this.f.level, ids: this.f.ids, weekend: this.f.weekend, start_date: this.f.start_date, choices: this.choices }; }
  async preview(): Promise<void> {
    this.busy = true; this.msg = ''; this.choices = {};
    try { this.pv = await firstValueFrom(this.http.post(this.url(), this.body('preview'))); }
    catch (e) { this.pv = null; this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async apply(): Promise<void> {
    this.busy = true;
    try {
      const r: any = await firstValueFrom(this.http.post(this.url(), this.body('apply')));
      this.say(`Weekend changed from ${String(r.start_date).split('-').reverse().join('/')}: ${this.count(r, 'recalculated')} leave(s) recalculated, ${this.count(r, 'kept') + this.count(r, 'kept_paid')} kept.`);
      this.pv = null; this.choices = {}; await this.load();
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
