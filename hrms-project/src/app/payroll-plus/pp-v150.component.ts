/**
 * v1.50.0 – Payroll what-if (a trial payroll with proposed salary changes compared with the payroll as it is; apply writes
 * the new amounts with the revision history) and cost allocation (an employee's payroll cost split over projects / cost
 * centres / departments by percentages or timesheet hours; CSV; post to accounting).
 * API (PayrollPlus): what-if/, what-if/<id>/, what-if/<id>/calculate|apply/, cost-allocation/, cost-allocation/rules/[<id>/]
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

class Api {
  constructor(private http: HttpClient, private rec: ZRecordService) {}
  url(p: string, q: Record<string, any> = {}): string {
    const qs = Object.entries(q).filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => `&${k}=${encodeURIComponent(String(v))}`).join('');
    return `${this.rec.api}/payroll-plus/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}${qs}`;
  }
  get<T = any>(p: string, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(p, q))); }
  post<T = any>(p: string, b: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(p), b)); }
  put<T = any>(p: string, b: any = {}): Promise<T> { return firstValueFrom(this.http.put<T>(this.url(p), b)); }
  del(p: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(p))); }
  async file(p: string, name: string, q: Record<string, any> = {}): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(p, q), { responseType: 'blob' }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}

const n2 = (v: any): string => v === undefined || v === null || v === '' ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (v: any): string => v === undefined || v === null || v === '' ? '–' : (Number(v) > 0 ? '+' : '') + n2(v);
const thisMonth = (): string => new Date().toISOString().slice(0, 7);
const lastMonth = (): string => { const t = new Date(); t.setDate(0); return t.toISOString().slice(0, 7); };

const STYLES = `.wf-grid { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 960px) { .wf-grid { grid-template-columns: 1fr; } }
  .wf-list { border: 1px solid #e3e6ea; border-radius: 10px; overflow: hidden; background: #fff; }
  .wf-list button { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid #eef0f2; background: #fff; padding: 9px 12px; cursor: pointer; }
  .wf-list button.on { background: #eef4fb; box-shadow: inset 3px 0 0 #2b6cb0; } .wf-list small { display: flex; justify-content: space-between; color: #5d6670; }
  .wf-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
  .wf-card h2 { font-size: 15px; margin: 0 0 10px; }
  .wf-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; } .wf-form label { display: flex; flex-direction: column; font-size: 12px; color: #5d6670; gap: 3px; }
  .wf-form input, .wf-form select, table.wf select { max-width: 210px; } table.wf select, table.wf input { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; }
  table.wf { width: 100%; border-collapse: collapse; font-size: 12.5px; } .wf th, .wf td { padding: 6px; border-bottom: 1px solid #eef0f2; text-align: left; vertical-align: top; }
  .wf th { background: #f7f8fa; } .r { text-align: right !important; font-variant-numeric: tabular-nums; } .up { color: #1d6b37; } .down { color: #9b2c24; }
  .wf-tot { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 12px; }
  .wf-tot div { background: #f7f8fa; border-radius: 10px; padding: 10px 12px; } .wf-tot small { display: block; color: #5d6670; font-size: 11.5px; }
  .wf-tot b { font-size: 18px; font-variant-numeric: tabular-nums; } .wf-bar { height: 6px; background: #e3e6ea; border-radius: 3px; margin-top: 4px; }
  .wf-bar i { display: block; height: 6px; border-radius: 3px; background: #5b4fe0; }
  .wf-ids { min-width: 200px; min-height: 64px; } .wf-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px; }
  .wf-tag { font-size: 11px; padding: 1px 7px; border-radius: 9px; background: #eef0f7; color: #3b4057; } .wf-tag.applied { background: #e3f4ea; color: #1d6b37; }`;

@Component({
  selector: 'app-payroll-what-if',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [STYLES],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head"><div><h1>Payroll what-if</h1>
    <p class="lp-desc">Try a salary change before you make it: an increment, a new allowance or a new amount for some employees. ZEO calculates the month's payroll as it is and with the change – with the real payroll rules – and shows the difference. Nothing is saved to payroll until you apply the scenario.</p></div>
    <div class="lp-actions"><button type="button" class="lp-btn primary" (click)="newOne()" data-new>New scenario</button></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="wf-grid">
    <div class="wf-list">
      <button type="button" *ngFor="let s of rows" [class.on]="sc?.id === s.id" (click)="open(s.id)" [attr.data-sc]="s.id">
        <b>{{ s.name }}</b><small><span>{{ s.month | date:'MMM yyyy' }}</span><span [class.up]="+s.summary?.diff?.gross > 0" [class.down]="+s.summary?.diff?.gross < 0">{{ signed(s.summary?.diff?.gross) }}</span></small>
        <small><span>{{ s.summary?.changed || 0 }} of {{ s.summary?.employees || 0 }} employees</span><span class="wf-tag" [class.applied]="s.status === 'applied'">{{ s.status === 'applied' ? 'Applied' : 'Draft' }}</span></small></button>
      <p class="lp-desc" *ngIf="!rows.length" style="padding:10px">No scenario yet.</p>
    </div>
    <div *ngIf="f">
      <div class="wf-card">
        <h2>{{ f.id ? f.name : 'New scenario' }}</h2>
        <div class="wf-form">
          <label style="flex:1;min-width:220px">Name<input [(ngModel)]="f.name" placeholder="e.g. 2027 increment 5%" [disabled]="applied" data-name></label>
          <label>Payroll month to compare<input type="month" [(ngModel)]="f.month" [disabled]="applied"></label>
        </div>
        <h3 style="font-size:13px;margin:14px 0 6px">Changes</h3>
        <div style="overflow-x:auto"><table class="wf">
          <tr><th>Salary component</th><th>Change</th><th>Value</th><th>For</th><th>Who</th><th></th></tr>
          <tr *ngFor="let r of f.rules; let i = index" [attr.data-rule]="i">
            <td><select [(ngModel)]="r.component" [disabled]="applied" aria-label="Component"><option [ngValue]="null">Choose…</option>
              <option *ngFor="let c of opts.components" [ngValue]="c.id">{{ c.name }}{{ c.formula ? ' (formula)' : '' }}</option></select></td>
            <td><select [(ngModel)]="r.change" [disabled]="applied" aria-label="Change"><option value="percent">Up / down by %</option><option value="amount">Up / down by an amount</option>
              <option value="set">New amount</option><option value="add">Give it (new allowance)</option></select></td>
            <td><input type="number" [(ngModel)]="r.value" style="width:100px" [disabled]="applied" aria-label="Value"></td>
            <td><select [(ngModel)]="r.scope" (ngModelChange)="r.ids = []" [disabled]="applied" aria-label="For"><option value="all">Everybody</option><option value="department">Departments</option>
              <option value="branch">Branches</option><option value="designation">Designations</option><option value="employees">Employees</option></select></td>
            <td><select *ngIf="r.scope !== 'all'" multiple class="wf-ids" [(ngModel)]="r.ids" [disabled]="applied" aria-label="Who">
              <option *ngFor="let o of list(r.scope)" [ngValue]="o.id">{{ o.name }}</option></select><span *ngIf="r.scope === 'all'" class="lp-desc">All active employees</span></td>
            <td><button type="button" class="lp-btn" *ngIf="!applied" (click)="f.rules.splice(i, 1)" aria-label="Remove">×</button></td></tr>
        </table></div>
        <div class="lp-actions" style="margin-top:10px;flex-wrap:wrap">
          <button type="button" class="lp-btn" *ngIf="!applied" (click)="addRule()">+ Add a change</button>
          <span style="flex:1"></span>
          <button type="button" class="lp-btn" *ngIf="f.id && !applied" (click)="remove()">Delete</button>
          <button type="button" class="lp-btn primary" *ngIf="!applied" (click)="calc()" [disabled]="busy" data-calc>{{ busy ? 'Calculating…' : 'Calculate' }}</button></div>
      </div>

      <ng-container *ngIf="res">
        <div class="wf-card">
          <h2>Result for {{ res.month | date:'MMMM yyyy' }} – {{ res.changed }} of {{ res.employees }} employees change</h2>
          <div class="wf-tot">
            <div><small>Gross pay now</small><b>{{ n(res.base.gross) }}</b></div>
            <div><small>Gross pay with the change</small><b>{{ n(res.new.gross) }}</b></div>
            <div><small>Difference a month</small><b [class.up]="+res.diff.gross > 0" [class.down]="+res.diff.gross < 0">{{ signed(res.diff.gross) }}</b><small>{{ res.pct ? signed(res.pct) + ' %' : '' }}</small></div>
            <div><small>Difference a year (× 12)</small><b>{{ signed(res.yearly_diff) }}</b></div>
            <div><small>Net pay difference</small><b>{{ signed(res.diff.net) }}</b></div>
          </div>
          <p class="lp-desc" *ngIf="res.missing?.length">Not calculated (no payslip in the trial): {{ res.missing.join(', ') }}</p>
          <div class="lp-actions" style="flex-wrap:wrap">
            <button type="button" class="lp-btn" (click)="csv()">CSV</button><span style="flex:1"></span>
            <ng-container *ngIf="!applied && canApply"><label class="lp-desc">From<input type="month" [(ngModel)]="f.effective_from" style="margin-left:6px" aria-label="Effective from"></label>
              <button type="button" class="lp-btn primary" (click)="apply()" [disabled]="busy" data-apply>Apply to salaries</button></ng-container>
            <span class="lp-desc" *ngIf="applied">Applied {{ sc.applied_at | date:'d MMM yyyy, HH:mm' }} – the amounts are in the employees' salary and the revision history.</span></div>
        </div>
        <div class="wf-two">
          <div class="wf-card"><h2>By department</h2><table class="wf"><tr><th>Department</th><th class="r">Now</th><th class="r">New</th><th class="r">Difference</th></tr>
            <tr *ngFor="let x of res.by_department"><td>{{ x.name }} <small class="lp-desc">{{ x.employees }}</small><div class="wf-bar"><i [style.width.%]="share(x.diff)"></i></div></td>
              <td class="r">{{ n(x.base) }}</td><td class="r">{{ n(x.new) }}</td><td class="r" [class.up]="+x.diff > 0">{{ signed(x.diff) }}</td></tr></table></div>
          <div class="wf-card"><h2>By salary component</h2><table class="wf"><tr><th>Component</th><th class="r">Now</th><th class="r">New</th><th class="r">Difference</th></tr>
            <tr *ngFor="let x of comps()"><td>{{ x.name }} <small class="lp-desc">{{ x.kind === 'deduction' ? 'deduction' : '' }}</small></td>
              <td class="r">{{ n(x.base) }}</td><td class="r">{{ n(x.new) }}</td><td class="r" [class.up]="+x.diff > 0" [class.down]="+x.diff < 0">{{ signed(x.diff) }}</td></tr></table></div>
        </div>
        <div class="wf-card"><h2>Employees</h2><div style="overflow-x:auto;max-height:440px"><table class="wf">
          <tr><th>Employee</th><th>Department</th><th class="r">Gross now</th><th class="r">Gross new</th><th class="r">Difference</th><th class="r">%</th><th class="r">Net new</th></tr>
          <tr *ngFor="let r of res.rows" [attr.data-row]="r.employee_id"><td>{{ r.name }} <small class="lp-desc">{{ r.code }}</small></td><td>{{ r.department }}</td>
            <td class="r">{{ n(r.base_gross) }}</td><td class="r">{{ n(r.new_gross) }}</td><td class="r" [class.up]="+r.diff > 0" [class.down]="+r.diff < 0">{{ signed(r.diff) }}</td>
            <td class="r">{{ r.pct }}</td><td class="r">{{ n(r.new_net) }}</td></tr></table></div></div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class WhatIfComponent implements OnInit {
  api: Api; rows: any[] = []; opts: any = { components: [], department: [], branch: [], designation: [], employees: [] }; canApply = false;
  sc: any = null; f: any = null; res: any = null; msg = ''; err = false; busy = false;
  n = n2; signed = signed;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  get applied(): boolean { return this.sc?.status === 'applied'; }
  async ngOnInit(): Promise<void> { await this.load(); if (this.rows.length) { await this.open(this.rows[0].id); } else { this.newOne(); } }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('what-if/'); this.rows = r.rows; this.opts = r.options; this.canApply = r.can_apply; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  list(scope: string): any[] { return this.opts[scope === 'employees' ? 'employees' : scope] || []; }
  newOne(): void {
    this.sc = null; this.res = null;
    this.f = { name: '', month: lastMonth(), effective_from: thisMonth(), rules: [{ component: null, change: 'percent', value: 5, scope: 'all', ids: [] }] };
  }
  addRule(): void { this.f.rules.push({ component: null, change: 'percent', value: 5, scope: 'all', ids: [] }); }
  private fill(s: any): void {
    this.sc = s; this.res = s.result && s.result.base ? s.result : null;
    this.f = { id: s.id, name: s.name, month: String(s.month).slice(0, 7), effective_from: s.effective_from ? String(s.effective_from).slice(0, 7) : thisMonth(),
      rules: (s.rules || []).map((r: any) => ({ ...r, value: Number(r.value), ids: [...(r.ids || [])] })) };
  }
  async open(id: number): Promise<void> { try { this.fill(await this.api.get(`what-if/${id}/`)); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async calc(): Promise<void> {
    const body = { name: this.f.name, month: this.f.month + '-01', rules: this.f.rules, effective_from: this.f.effective_from ? this.f.effective_from + '-01' : null };
    this.busy = true; this.say('Calculating the payroll twice – this takes a few seconds…'); this.cd.markForCheck();
    try {
      const s: any = this.f.id ? await this.api.put(`what-if/${this.f.id}/`, body) : await this.api.post('what-if/', body);
      this.fill(s); this.say(`Calculated: ${signed(s.result.diff.gross)} a month (${signed(s.result.yearly_diff)} a year).`); await this.load();
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async apply(): Promise<void> {
    if (!confirm(`Write the new amounts to ${this.res.changed} employees' salaries? The next payroll uses them.`)) { return; }
    this.busy = true;
    try {
      await this.api.put(`what-if/${this.f.id}/`, { effective_from: this.f.effective_from + '-01' });
      const s: any = await this.api.post(`what-if/${this.f.id}/apply/`); this.fill(s); this.say(`Applied – ${s.applied_rows} salary amounts changed.`); await this.load();
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async remove(): Promise<void> {
    if (!confirm('Delete this scenario?')) { return; }
    try { await this.api.del(`what-if/${this.f.id}/`); this.say('Deleted.'); await this.load(); this.newOne(); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  csv(): void { this.api.file(`what-if/${this.f.id}/`, `what-if-${this.f.id}.csv`, { export: 'csv' }); }
  comps(): any[] { return (this.res?.by_component || []).filter((x: any) => +x.base || +x.new); }
  share(v: any): number { const m = Math.max(...(this.res?.by_department || []).map((x: any) => Math.abs(+x.diff)), 1); return Math.abs(+v) * 100 / m; }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}

@Component({
  selector: 'app-cost-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [STYLES + ` .ca-tabs { display: flex; gap: 6px; margin-bottom: 12px; } .ca-tabs button { border: 1px solid #cfd5dc; background: #fff; border-radius: 16px; padding: 5px 14px; cursor: pointer; }
    .ca-tabs button.on { background: #1f2433; color: #fff; border-color: #1f2433; } .ca-sp { font-size: 12px; color: #3b4057; } .ca-sp span { display: inline-block; margin: 0 8px 2px 0; }
    .ca-home { color: #5d6670; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head"><div><h1>Cost allocation</h1>
    <p class="lp-desc">Split each employee's payroll cost over projects, cost centres and departments – by fixed percentages or by the hours in the timesheets of the month. What is not allocated stays on the employee's own cost centre (or department). Export the result or post it to accounting.</p></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ca-tabs"><button type="button" [class.on]="tab === 'month'" (click)="tab = 'month'; loadMonth()">Month</button>
    <button type="button" [class.on]="tab === 'rules'" (click)="tab = 'rules'" data-tab-rules>Allocation rules ({{ rules.length }})</button></div>

  <ng-container *ngIf="tab === 'month'">
    <div class="wf-form" style="margin-bottom:12px"><label>Month<input type="month" [(ngModel)]="month" (ngModelChange)="loadMonth()"></label>
      <span style="flex:1"></span><button type="button" class="lp-btn" (click)="csv()" *ngIf="m?.rows?.length">CSV</button>
      <button type="button" class="lp-btn primary" *ngIf="m?.accounting && m?.rows?.length && canEdit" (click)="post()" [disabled]="busy">Post to accounting</button></div>
    <div *ngIf="m">
      <div class="wf-tot"><div><small>Payroll cost (gross)</small><b>{{ n(m.total) }}</b></div><div><small>Allocated to projects / cost centres</small><b>{{ n(m.allocated) }}</b></div>
        <div><small>Employees</small><b>{{ m.employees }}</b></div></div>
      <p class="lp-desc" *ngIf="!m.rows.length">No processed payroll in this month.</p>
      <div class="wf-two" *ngIf="m.rows.length">
        <div class="wf-card"><h2>Where the cost goes</h2><table class="wf"><tr><th>Project / cost centre / department</th><th class="r">Employees</th><th class="r">Cost</th></tr>
          <tr *ngFor="let t of m.targets" [attr.data-target]="t.kind + '-' + t.id"><td>{{ t.name }} <small class="lp-desc">{{ label(t.kind) }}</small><div class="wf-bar"><i [style.width.%]="+t.amount * 100 / (+m.total || 1)"></i></div></td>
            <td class="r">{{ t.employees }}</td><td class="r">{{ n(t.amount) }}</td></tr></table></div>
        <div class="wf-card"><h2>Employees</h2><div style="max-height:420px;overflow:auto"><table class="wf"><tr><th>Employee</th><th class="r">Cost</th><th>Split</th></tr>
          <tr *ngFor="let r of m.rows"><td>{{ r.name }} <small class="lp-desc">{{ r.code }}</small><br><small class="lp-desc">{{ r.basis === 'timesheet' ? 'Timesheet hours' : r.basis === 'percent' ? 'Percentages' : 'No rule' }}</small></td>
            <td class="r">{{ n(r.cost) }}</td><td class="ca-sp"><span *ngFor="let s of r.splits" [class.ca-home]="s.home">{{ s.name }} {{ s.percent }}%{{ s.hours ? ' (' + s.hours + ' h)' : '' }} = {{ n(s.amount) }}</span></td></tr></table></div></div>
      </div>
    </div>
  </ng-container>

  <ng-container *ngIf="tab === 'rules'">
    <div class="wf-card" *ngIf="canEdit">
      <h2>{{ r.id ? 'Change the rule' : 'New rule' }}</h2>
      <div class="wf-form">
        <label style="min-width:240px">Employee<select [(ngModel)]="r.employee_id" data-emp><option [ngValue]="null">Choose…</option><option *ngFor="let e of emps" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label>Split by<select [(ngModel)]="r.basis" data-basis><option value="percent">Fixed percentages</option><option value="timesheet">Timesheet hours of the month</option></select></label>
        <label>From<input type="date" [(ngModel)]="r.valid_from"></label><label>Until<input type="date" [(ngModel)]="r.valid_until"></label>
        <label style="flex:1;min-width:180px">Note<input [(ngModel)]="r.note"></label></div>
      <table class="wf" *ngIf="r.basis === 'percent'" style="margin-top:10px"><tr><th>To</th><th></th><th class="r">%</th><th></th></tr>
        <tr *ngFor="let l of r.lines; let i = index" [attr.data-line]="i"><td><select [(ngModel)]="l.kind" (ngModelChange)="l.id = null" aria-label="Kind"><option value="project">Project</option><option value="cost_center">Cost centre</option><option value="department">Department</option></select></td>
          <td><select [(ngModel)]="l.id" aria-label="Target"><option [ngValue]="null">Choose…</option><option *ngFor="let o of opts[l.kind]" [ngValue]="o.id">{{ o.name }}</option></select></td>
          <td class="r"><input type="number" min="0" max="100" [(ngModel)]="l.percent" style="width:80px" aria-label="Percent"></td>
          <td><button type="button" class="lp-btn" (click)="r.lines.splice(i, 1)" aria-label="Remove">×</button></td></tr>
        <tr><td colspan="2"><button type="button" class="lp-btn" (click)="r.lines.push({ kind: 'project', id: null, percent: 0 })">+ Add a line</button></td>
          <td class="r"><b>{{ pctTotal() }} %</b></td><td class="lp-desc">{{ pctTotal() < 100 ? 'the rest stays on the own cost centre' : '' }}</td></tr></table>
      <p class="lp-desc" *ngIf="r.basis === 'timesheet'">Each month the cost is split by the employee's timesheet hours per project; with no hours it stays on the own cost centre.</p>
      <div class="lp-actions" style="margin-top:10px"><button type="button" class="lp-btn" *ngIf="r.id" (click)="newRule()">Cancel</button>
        <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy" data-save>Save the rule</button></div>
    </div>
    <div class="wf-card"><table class="wf"><tr><th>Employee</th><th>Split</th><th>From</th><th>Until</th><th></th></tr>
      <tr *ngFor="let x of rules" [attr.data-rule]="x.id"><td>{{ x.employee }} <small class="lp-desc">{{ x.code }}</small></td>
        <td class="ca-sp"><ng-container *ngIf="x.basis === 'timesheet'">Timesheet hours</ng-container><span *ngFor="let l of x.lines">{{ l.name }} {{ l.percent }}%</span></td>
        <td>{{ x.valid_from | date:'d MMM yyyy' }}</td><td>{{ x.valid_until | date:'d MMM yyyy' }}</td>
        <td><ng-container *ngIf="canEdit"><button type="button" class="lp-btn" (click)="edit(x)">Change</button> <button type="button" class="lp-btn" (click)="del(x)">Delete</button></ng-container></td></tr>
      <tr *ngIf="!rules.length"><td colspan="5" class="lp-desc">No rule yet – every employee's cost stays on the own cost centre or department.</td></tr></table></div>
  </ng-container>
</div>`,
})
export class CostAllocationComponent implements OnInit {
  api: Api; tab = 'month'; month = lastMonth(); m: any = null; rules: any[] = []; opts: any = { project: [], cost_center: [], department: [] };
  emps: any[] = []; canEdit = false; r: any = {}; msg = ''; err = false; busy = false; n = n2;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> { this.newRule(); await Promise.all([this.loadRules(), this.loadMonth()]); }
  label(k: string): string { return ({ project: 'project', cost_center: 'cost centre', department: 'department' } as any)[k] || k; }
  async loadMonth(): Promise<void> {
    try { this.m = await this.api.get('cost-allocation/', { month: this.month + '-01' }); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  async loadRules(): Promise<void> {
    try {
      const x: any = await this.api.get('cost-allocation/rules/'); this.rules = x.rows; this.opts = x.options; this.canEdit = x.can_edit;
      if (!this.emps.length) { const w: any = await this.api.get('what-if/').catch(() => null); this.emps = w?.options?.employees || []; }
    } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  newRule(): void { this.r = { employee_id: null, basis: 'percent', lines: [{ kind: 'project', id: null, percent: 100 }], valid_from: '', valid_until: '', note: '' }; }
  edit(x: any): void { this.r = { ...x, lines: (x.lines || []).map((l: any) => ({ kind: l.kind, id: l.id, percent: Number(l.percent) || 0 })) }; window.scrollTo({ top: 0 }); }
  pctTotal(): number { return Math.round((this.r.lines || []).reduce((a: number, l: any) => a + (+l.percent || 0), 0) * 100) / 100; }
  async save(): Promise<void> {
    this.busy = true;
    try { await this.api.post('cost-allocation/rules/', this.r); this.say('Rule saved.'); this.newRule(); await this.loadRules(); await this.loadMonth(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async del(x: any): Promise<void> {
    if (!confirm(`Delete the rule of ${x.employee}?`)) { return; }
    try { await this.api.del(`cost-allocation/rules/${x.id}/`); await this.loadRules(); await this.loadMonth(); } catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  async post(): Promise<void> {
    this.busy = true;
    try { const b: any = await this.api.post('cost-allocation/', { month: this.month + '-01' }); this.say(`Journal ${b.journal}: ${b.lines} lines (${b.status === 'ready' ? 'ready to post' : 'check it in Accounting'}).`); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  csv(): void { this.api.file('cost-allocation/', `cost-allocation-${this.month}.csv`, { month: this.month + '-01', export: 'csv' }); }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
