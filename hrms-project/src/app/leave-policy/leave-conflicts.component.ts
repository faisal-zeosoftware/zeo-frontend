// v1.62.0 ui: dates dd/MM/yyyy
/**
 * v1.51.0 – Leave conflicts: when a leave request shows a warning (colleagues of the same role away, too few of the
 * department at work) and the blackout periods (warn or block). API: /leave-policy/api/conflicts/[<id>/]
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

@Component({
  selector: 'app-leave-conflicts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./leave-policy.css'],
  styles: [`.lc-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .lc-card h2 { font-size: 15px; margin: 0 0 10px; } .lc-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
    .lc-form label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: #5d6670; }
    .lc-form input, .lc-form select { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; }
    .lc-form select[multiple] { min-height: 90px; min-width: 190px; } table.lc { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lc th, .lc td { padding: 7px 6px; border-bottom: 1px solid #eef0f2; text-align: left; vertical-align: top; } .lc th { background: #f7f8fa; }
    .lc-tag { font-size: 11px; padding: 1px 8px; border-radius: 9px; background: #fff4e0; color: #7a4b00; } .lc-tag.block { background: #fde8e6; color: #9b2c24; }
    .lc-hint { font-size: 12px; color: #5d6670; max-width: 720px; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head"><div><h1>Leave conflicts</h1>
    <p class="lp-desc">What employees and approvers see before a leave is sent or approved: colleagues of the same role away on the same days, too few of the department at work, blackout periods, rostered shifts without cover and a public holiday next to the leave.</p></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <ng-container *ngIf="s">
    <div class="lc-card">
      <h2>Team warnings</h2>
      <div class="lc-form">
        <label>Warn when this many of the same role are away<input type="number" min="0" max="50" [(ngModel)]="s.same_role_max" [disabled]="!s.can_edit" data-same-role></label>
        <label>Warn below this % of the department at work<input type="number" min="0" max="100" [(ngModel)]="s.dept_min_present_pct" [disabled]="!s.can_edit" data-min-pct></label>
        <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" [(ngModel)]="s.count_pending" [disabled]="!s.can_edit"> Requests waiting for approval count as away</label>
        <button type="button" class="lp-btn primary" *ngIf="s.can_edit" (click)="save()" [disabled]="busy">Save</button>
      </div>
      <p class="lc-hint">The same role is the same designation in the same department. Weekends and public holidays are not counted.</p>
    </div>
    <div class="lc-card">
      <h2>Blackout periods</h2>
      <table class="lc"><tr><th>Period</th><th>Dates</th><th>Who</th><th>Not for</th><th></th><th></th></tr>
        <tr *ngFor="let b of s.blackouts" [attr.data-blackout]="b.id"><td><b>{{ b.name }}</b><br><small class="lc-hint">{{ b.note }}</small></td>
          <td>{{ b.start_date | date:'dd/MM/yyyy' }} – {{ b.end_date | date:'dd/MM/yyyy' }}</td>
          <td>{{ names('departments', b.department_ids) || 'Every department' }}<br><small class="lc-hint">{{ names('branches', b.branch_ids) || 'every branch' }}</small></td>
          <td>{{ names('leave_types', b.exempt_leave_type_ids) || '–' }}</td>
          <td><span class="lc-tag" [class.block]="b.action === 'block'">{{ b.action === 'block' ? 'Blocks leave' : 'Warns' }}</span></td>
          <td><ng-container *ngIf="s.can_edit"><button type="button" class="lp-btn" (click)="edit(b)">Change</button> <button type="button" class="lp-btn" (click)="del(b)">Delete</button></ng-container></td></tr>
        <tr *ngIf="!s.blackouts.length"><td colspan="6" class="lc-hint">No blackout period.</td></tr></table>
      <div class="lc-form" style="margin-top:14px" *ngIf="s.can_edit">
        <label style="min-width:220px">Name<input [(ngModel)]="b.name" placeholder="e.g. Year-end closing" data-bo-name></label>
        <label>From<input type="date" [(ngModel)]="b.start_date" data-bo-from></label><label>To<input type="date" [(ngModel)]="b.end_date" data-bo-to></label>
        <label>When it applies<select [(ngModel)]="b.action" data-bo-action><option value="warn">Warn the employee</option><option value="block">Block (only HR enters leave)</option></select></label>
        <label>Departments (none = all)<select multiple [(ngModel)]="b.department_ids"><option *ngFor="let o of s.options.departments" [ngValue]="o.id">{{ o.name }}</option></select></label>
        <label>Branches (none = all)<select multiple [(ngModel)]="b.branch_ids"><option *ngFor="let o of s.options.branches" [ngValue]="o.id">{{ o.name }}</option></select></label>
        <label>Leave types it does not apply to<select multiple [(ngModel)]="b.exempt_leave_type_ids"><option *ngFor="let o of s.options.leave_types" [ngValue]="o.id">{{ o.name }}</option></select></label>
        <label style="flex:1;min-width:220px">Note to the employee<input [(ngModel)]="b.note"></label>
        <button type="button" class="lp-btn" *ngIf="b.id" (click)="reset()">Cancel</button>
        <button type="button" class="lp-btn primary" (click)="addBlackout()" [disabled]="busy" data-bo-save>{{ b.id ? 'Save the period' : 'Add the period' }}</button>
      </div>
    </div>
  </ng-container>
</div>`,
})
export class LeaveConflictsComponent implements OnInit {
  s: any = null; b: any = {}; msg = ''; err = false; busy = false;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p = ''): string { return `${this.rec.api}/leave-policy/api/conflicts/${p}?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  async ngOnInit(): Promise<void> { this.reset(); await this.load(); }
  async load(): Promise<void> { try { this.s = await firstValueFrom(this.http.get(this.url())); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  reset(): void { this.b = { name: '', start_date: '', end_date: '', action: 'warn', department_ids: [], branch_ids: [], exempt_leave_type_ids: [], note: '' }; }
  edit(x: any): void { this.b = { ...x, department_ids: [...x.department_ids], branch_ids: [...x.branch_ids], exempt_leave_type_ids: [...x.exempt_leave_type_ids] }; }
  names(kind: string, ids: number[]): string { const o = this.s?.options?.[kind] || []; return (ids || []).map(i => (o.find((x: any) => x.id === i) || {}).name).filter(Boolean).join(', '); }
  async save(): Promise<void> {
    this.busy = true;
    try { this.s = await firstValueFrom(this.http.put(this.url(), { same_role_max: this.s.same_role_max, dept_min_present_pct: this.s.dept_min_present_pct, count_pending: this.s.count_pending })); this.say('Saved.'); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async addBlackout(): Promise<void> {
    this.busy = true;
    try { await firstValueFrom(this.http.post(this.url(), this.b)); this.say(this.b.id ? 'Period saved.' : 'Period added.'); this.reset(); await this.load(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async del(x: any): Promise<void> {
    if (!confirm(`Delete "${x.name}"?`)) { return; }
    try { await firstValueFrom(this.http.delete(this.url(`${x.id}/`))); await this.load(); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
