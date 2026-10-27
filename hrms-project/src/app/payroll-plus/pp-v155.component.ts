/**
 * v1.55.0 – pay calendars (weekly, every two weeks, twice a month), off-cycle runs (bonus, commission, correction, final
 * settlement, advance, arrears) and arrears after a salary change with an earlier effective date.
 * API (PayrollPlus): pay-calendars/, pay-calendars/<id>/ {action: run}, off-cycle/, arrears/ {action: preview | save | cancel}
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, i18nT } from '../shared-ui/i18n.service';

class Api {
  constructor(private http: HttpClient, private rec: ZRecordService) {}
  url(p: string): string { return `${this.rec.api}/payroll-plus/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  get<T = any>(p: string): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(p))); }
  post<T = any>(p: string, b: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(p), b)); }
  del(p: string): Promise<any> { return firstValueFrom(this.http.delete(this.url(p))); }
}
const n2 = (v: any): string => v === undefined || v === null || v === '' ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STYLES = `.pc-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
  .pc-card h2 { font-size: 15px; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pc-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; } .pc-form label { display: flex; flex-direction: column; font-size: 12px; color: #5d6670; gap: 3px; }
  .pc-form input, .pc-form select { padding: 6px 8px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 13px; max-width: 230px; }
  .pc-form select[multiple] { min-width: 260px; min-height: 120px; }
  table.pc { width: 100%; border-collapse: collapse; font-size: 12.5px; } .pc th, .pc td { padding: 6px; border-bottom: 1px solid #eef0f2; text-align: left; vertical-align: middle; }
  .pc th { background: #f7f8fa; } .r { text-align: right !important; font-variant-numeric: tabular-nums; }
  .pc-tag { font-size: 11px; padding: 1px 7px; border-radius: 9px; background: #eef0f7; color: #3b4057; white-space: nowrap; }
  .pc-tag.ok { background: #e3f4ea; color: #1d6b37; } .pc-tag.warn { background: #fff4dc; color: #7a5200; } .pc-tag.bad { background: #fde8e6; color: #9b2c24; }
  .pc-muted { color: #5d6670; font-size: 12.5px; } tr.pc-now td { background: #f6f5ff; }
  .pc-lines td input, .pc-lines td select { padding: 5px 7px; border: 1px solid #cfd5dc; border-radius: 6px; font: inherit; font-size: 12.5px; }`;

/* ------------------------------------------------------------------------------------------------ pay calendars */
@Component({
  selector: 'app-pay-calendars',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [STYLES],
  template: `
<div class="lp-page" style="padding:16px 20px" data-pay-calendars>
  <div class="lp-head"><div><h1>Pay calendars</h1>
    <p class="lp-desc">Pay some employees weekly, bi-weekly or semi-monthly. Each period is a normal payroll run: approval, payslips, WPS file and accounting as usual.
      The monthly salary is prorated to the period (× 12 ÷ periods a year); overtime and attendance are those of the period; loans and advances are deducted once a month, in the last period that ends in the month.
      The employees of a calendar are left out of the monthly payroll runs.</p></div>
    <div class="lp-actions" *ngIf="enabled"><button type="button" class="lp-btn primary" (click)="add()" data-cal-add>New calendar</button></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <div class="pc-card" *ngIf="loaded && !enabled" data-cal-off>
    <h2>No pay frequency is switched on</h2>
    <p class="pc-muted">Everybody is paid monthly. To pay some employees weekly, bi-weekly or semi-monthly, switch the frequency on in Payroll controls first.</p>
    <a class="lp-btn primary" *ngIf="canSettings" routerLink="/main-sidebar/salary-options/payroll-controls" data-cal-settings>Open Payroll controls</a>
    <p class="pc-muted" *ngIf="!canSettings">Ask the company administrator to switch it on.</p>
  </div>

  <div class="pc-card" *ngIf="form" data-cal-form>
    <h2>{{ form.id ? 'Change the calendar' : 'New calendar' }}</h2>
    <div class="pc-form">
      <label>Name<input [(ngModel)]="form.name" data-cal-name></label>
      <label>Paid<select [(ngModel)]="form.frequency" data-cal-freq><option *ngFor="let f of freqs" [value]="f.key">{{ f.label }}</option></select></label>
      <label *ngIf="form.frequency !== 'semimonthly'">First day of the first period<input type="date" [(ngModel)]="form.first_start" data-cal-start></label>
      <label>Pay date (days after the period)<input type="number" min="0" max="31" [(ngModel)]="form.pay_days_after" style="width:90px"></label>
      <label>Employees<select multiple [(ngModel)]="form.employee_ids" data-cal-emps><option *ngFor="let e of employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
      <label>Or every employee of the categories<select multiple [(ngModel)]="form.category_ids"><option *ngFor="let c of categories" [ngValue]="c.id">{{ c.name }}</option></select></label>
    </div>
    <div class="lp-actions" style="margin-top:10px"><button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy" data-cal-save>Save</button>
      <button type="button" class="lp-btn" (click)="form = null">Cancel</button></div>
  </div>

  <p class="pc-muted" *ngIf="loaded && enabled && !rows.length && !form">No pay calendar yet – everybody is paid monthly.</p>
  <div class="pc-card" *ngFor="let c of rows" [attr.data-cal]="c.id">
    <h2>{{ c.name }} <span class="pc-tag">{{ c.frequency_label }}</span> <span class="pc-tag" [class.ok]="c.active">{{ c.active ? 'Active' : 'Off' }}</span>
      <span class="pc-muted">{{ '{0} employees · {1} of the monthly salary per period' | t:[c.members, c.factor] }}</span>
      <span style="flex:1"></span><button type="button" class="lp-btn" (click)="edit(c)">Change</button></h2>
    <table class="pc">
      <tr><th>Period</th><th>Pay date</th><th></th><th>Payroll run</th><th class="r">Payslips</th><th class="r">Net pay</th><th></th></tr>
      <tr *ngFor="let p of c.periods" [class.pc-now]="isNow(p)" [attr.data-period]="p.start">
        <td>{{ p.start | date:'d MMM' }} – {{ p.end | date:'d MMM y' }}</td><td>{{ p.pay_date | date:'d MMM' }}</td>
        <td><span class="pc-tag warn" *ngIf="p.closes_month">Loans and advances</span></td>
        <td><a *ngIf="p.run" routerLink="/main-sidebar/salary-options/pay-roll">{{ p.run.name }}</a> <span class="pc-tag" *ngIf="p.run" [class.ok]="p.run.status === 'paid'">{{ p.run.status | titlecase }}</span></td>
        <td class="r">{{ p.run?.payslips ?? '' }}</td><td class="r">{{ p.run ? n2(p.run.net) : '' }}</td>
        <td><button type="button" class="lp-btn" *ngIf="!p.run && c.active" (click)="run(c, p)" [disabled]="busy" data-run>Run this period</button></td></tr>
    </table>
  </div>
</div>`,
})
export class PayCalendarsComponent implements OnInit {
  api: Api; rows: any[] = []; freqs: any[] = []; employees: any[] = []; categories: any[] = []; form: any = null;
  msg = ''; err = false; busy = false; loaded = false; n2 = n2; enabled = false; canSettings = false;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('pay-calendars/'); this.enabled = r.enabled !== false; this.canSettings = !!r.can_settings; this.rows = r.rows; this.freqs = r.frequencies; this.employees = r.employees; this.categories = r.categories; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }
  say(m: string, err = false): void { this.msg = m; this.err = err; this.cd.markForCheck(); }
  isNow(p: any): boolean { const t = new Date().toISOString().slice(0, 10); return p.start <= t && t <= p.end; }
  add(): void {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 1) % 7));   // last Saturday
    this.form = { name: '', frequency: this.freqs[0]?.key || 'weekly', first_start: d.toISOString().slice(0, 10), pay_days_after: 3, employee_ids: [], category_ids: [] }; this.msg = '';
  }
  edit(c: any): void { this.form = { ...c, employee_ids: [...c.employee_ids], category_ids: [...c.category_ids] }; }
  async save(): Promise<void> {
    this.busy = true;
    try { await this.api.post('pay-calendars/', this.form); this.form = null; await this.load(); this.say(i18nT('Saved.')); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async run(c: any, p: any): Promise<void> {
    if (!confirm(i18nT('Make and calculate the payroll run of {0} – {1}?', [p.start, p.end]))) { return; }
    this.busy = true;
    try { const r: any = await this.api.post(`pay-calendars/${c.id}/`, { action: 'run', start: p.start }); await this.load(); this.say(i18nT('Payroll run made: {0} payslips.', [r.run.payslips])); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
}

/* ------------------------------------------------------------------------------------------------ off-cycle runs */
@Component({
  selector: 'app-off-cycle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [STYLES],
  template: `
<div class="lp-page" style="padding:16px 20px" data-off-cycle>
  <div class="lp-head"><div><h1>Off-cycle payroll runs</h1>
    <p class="lp-desc">Pay a bonus, a commission, a correction or a final settlement outside the monthly payroll. The run has only the amounts you enter;
      it is approved, paid and put in the WPS file like any payroll run. Arrears waiting for the next payroll can also be paid at once.</p></div>
    <div class="lp-actions"><button type="button" class="lp-btn primary" (click)="add()" data-oc-add>New off-cycle run</button></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>

  <div class="pc-card" *ngIf="form" data-oc-form>
    <h2>New off-cycle run</h2>
    <div class="pc-form">
      <label>Kind<select [(ngModel)]="form.kind" data-oc-kind><option *ngFor="let k of kinds" [value]="k.key">{{ k.label }}</option></select></label>
      <label>Title<input [(ngModel)]="form.title" placeholder="Q3 bonus" data-oc-title></label>
      <label>Pay date<input type="date" [(ngModel)]="form.pay_date"></label>
    </div>
    <p class="pc-muted" *ngIf="form.kind === 'arrears'">{{ waiting ? ('{0} arrears lines are waiting – leave the lines empty to pay all of them.' | t:[waiting]) : ('No arrears are waiting.' | t) }}</p>
    <table class="pc pc-lines" style="margin-top:10px">
      <tr><th>Employee</th><th>Component</th><th class="r">Amount</th><th>Note</th><th></th></tr>
      <tr *ngFor="let l of form.lines; let i = index" [attr.data-oc-line]="i">
        <td><select [(ngModel)]="l.employee_id"><option [ngValue]="null">–</option><option *ngFor="let e of employees" [ngValue]="e.id">{{ e.name }}</option></select></td>
        <td><select [(ngModel)]="l.component_id"><option [ngValue]="null">–</option><option *ngFor="let c of components" [ngValue]="c.id">{{ c.name }} ({{ c.type }})</option></select></td>
        <td class="r"><input type="number" min="0" step="0.01" [(ngModel)]="l.amount" style="width:120px"></td>
        <td><input [(ngModel)]="l.note" style="width:180px"></td>
        <td><button type="button" class="lp-btn" (click)="form.lines.splice(i, 1)">Remove</button></td></tr>
    </table>
    <div class="lp-actions" style="margin-top:10px"><button type="button" class="lp-btn" (click)="line()" data-oc-line-add>Add a line</button>
      <span style="flex:1"></span><span class="pc-muted">{{ 'Total {0}' | t:[n2(total())] }}</span>
      <button type="button" class="lp-btn primary" (click)="save()" [disabled]="busy" data-oc-save>Make the run</button>
      <button type="button" class="lp-btn" (click)="form = null">Cancel</button></div>
  </div>

  <div class="pc-card">
    <table class="pc">
      <tr><th>Run</th><th>Kind</th><th>Pay date</th><th>Status</th><th class="r">Payslips</th><th class="r">Net pay</th></tr>
      <tr *ngFor="let o of rows" [attr.data-oc]="o.id"><td><a routerLink="/main-sidebar/salary-options/pay-roll">{{ o.title }}</a></td><td><span class="pc-tag">{{ o.kind_label }}</span></td>
        <td>{{ o.pay_date | date:'d MMM y' }}</td><td><span class="pc-tag" [class.ok]="o.run?.status === 'paid'">{{ (o.run?.status || '') | titlecase }}</span></td>
        <td class="r">{{ o.run?.payslips }}</td><td class="r">{{ n2(o.run?.net) }}</td></tr>
      <tr *ngIf="loaded && !rows.length"><td colspan="6" class="pc-muted">No off-cycle run yet.</td></tr>
    </table>
  </div>
</div>`,
})
export class OffCycleComponent implements OnInit {
  api: Api; rows: any[] = []; kinds: any[] = []; components: any[] = []; employees: any[] = []; waiting = 0; form: any = null;
  msg = ''; err = false; busy = false; loaded = false; n2 = n2;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('off-cycle/'); Object.assign(this, { rows: r.rows, kinds: r.kinds, components: r.components, employees: r.employees, waiting: r.arrears_waiting }); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }
  say(m: string, err = false): void { this.msg = m; this.err = err; this.cd.markForCheck(); }
  add(): void { this.form = { kind: 'bonus', title: '', pay_date: new Date().toISOString().slice(0, 10), lines: [] }; this.line(); this.msg = ''; }
  line(): void { this.form.lines.push({ employee_id: null, component_id: null, amount: null, note: '' }); }
  total(): number { return (this.form?.lines || []).reduce((s: number, l: any) => s + (+l.amount || 0), 0); }
  async save(): Promise<void> {
    const lines = this.form.lines.filter((l: any) => l.employee_id || l.component_id || l.amount);
    this.busy = true;
    try { const r: any = await this.api.post('off-cycle/', { ...this.form, lines }); this.form = null; await this.load(); this.say(i18nT('Off-cycle run made: {0} payslips, net {1}.', [r.run.payslips, n2(r.run.net)])); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
}

/* ------------------------------------------------------------------------------------------------ arrears */
@Component({
  selector: 'app-arrears',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [STYLES],
  template: `
<div class="lp-page" style="padding:16px 20px" data-arrears>
  <div class="lp-head"><div><h1>Arrears</h1>
    <p class="lp-desc">A salary change effective from an earlier date: ZEO compares every payslip made since that date with the new salary – per component,
      with the paid days of each payslip – and the difference waits for the employee's next payslip ("Salary arrears"). You can also pay it at once in an off-cycle run.</p></div>
    <div class="lp-actions"><a class="lp-btn" routerLink="/main-sidebar/salary-options/off-cycle">Off-cycle runs</a></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>

  <div class="pc-card">
    <h2>Calculate arrears</h2>
    <div class="pc-form">
      <label>Employees<select multiple [(ngModel)]="pick" data-ar-emps><option *ngFor="let e of employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
      <label>Effective from<input type="date" [(ngModel)]="eff" data-ar-eff></label>
      <label>Components (empty = those changed since that date)<select multiple [(ngModel)]="comps"><option *ngFor="let c of components" [ngValue]="c.id">{{ c.name }}</option></select></label>
      <button type="button" class="lp-btn" (click)="calc(false)" [disabled]="busy" data-ar-preview>Preview</button>
      <button type="button" class="lp-btn primary" (click)="calc(true)" [disabled]="busy || !preview?.rows?.length" data-ar-save>Save the arrears</button>
    </div>
    <div *ngIf="preview" style="margin-top:12px" data-ar-result>
      <p><b>{{ 'Total {0}' | t:[n2(preview.total)] }}</b></p>
      <table class="pc" *ngFor="let r of preview.rows">
        <tr><th colspan="6">{{ r.employee }} <span class="pc-muted">{{ r.note || '' }}</span></th></tr>
        <tr *ngIf="r.lines.length"><th>Period</th><th>Component</th><th class="r">Paid</th><th class="r">New salary</th><th class="r">Paid days</th><th class="r">Arrears</th></tr>
        <tr *ngFor="let l of r.lines"><td>{{ l.month | date:'MMM y' }}</td><td>{{ l.component }}</td><td class="r">{{ n2(l.old) }}</td><td class="r">{{ n2(l.new) }}</td>
          <td class="r">{{ (+l.ratio * 100).toFixed(1) }}%</td><td class="r"><b>{{ n2(l.amount) }}</b></td></tr>
      </table>
    </div>
  </div>

  <div class="pc-card">
    <h2>Arrears <span class="pc-muted">{{ '{0} waiting' | t:[waiting().length] }}</span></h2>
    <table class="pc">
      <tr><th></th><th>Employee</th><th>Period</th><th>Component</th><th class="r">Amount</th><th>Status</th></tr>
      <tr *ngFor="let l of lines" [attr.data-ar-line]="l.id"><td><input type="checkbox" *ngIf="l.status === 'pending'" [(ngModel)]="sel[l.id]"></td>
        <td>{{ l.employee }}</td><td>{{ l.month | date:'MMM y' }}</td><td>{{ l.component }}</td><td class="r">{{ n2(l.amount) }}</td>
        <td><span class="pc-tag" [class.ok]="l.status === 'included'" [class.warn]="l.status === 'pending'">{{ l.status_label }}</span></td></tr>
      <tr *ngIf="loaded && !lines.length"><td colspan="6" class="pc-muted">No arrears.</td></tr>
    </table>
    <div class="lp-actions" style="margin-top:8px" *ngIf="waiting().length"><button type="button" class="lp-btn" (click)="cancel()" [disabled]="!selected().length">Cancel the ticked lines</button></div>
  </div>

  <div class="pc-card" *ngIf="revisions.length">
    <h2>Recent salary changes</h2>
    <table class="pc"><tr><th>Employee</th><th>Component</th><th class="r">Old</th><th class="r">New</th><th>Changed on</th><th>Effective (as entered)</th></tr>
      <tr *ngFor="let v of revisions"><td>{{ v.employee }}</td><td>{{ v.component }}</td><td class="r">{{ n2(v.old) }}</td><td class="r">{{ n2(v.new) }}</td>
        <td>{{ v.revised_on | date:'d MMM y' }}</td><td>{{ v.effective_period || '–' }}</td></tr></table>
  </div>
</div>`,
})
export class ArrearsComponent implements OnInit {
  api: Api; employees: any[] = []; components: any[] = []; lines: any[] = []; revisions: any[] = []; pick: number[] = []; comps: number[] = [];
  eff = ''; preview: any = null; sel: Record<number, boolean> = {}; msg = ''; err = false; busy = false; loaded = false; n2 = n2;
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> {
    try { const o: any = await this.api.get('off-cycle/'); this.employees = o.employees; this.components = o.components.filter((c: any) => c.type !== 'others'); } catch { /* rights */ }
    await this.load();
  }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('arrears/'); this.lines = r.lines; this.revisions = r.revisions; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }
  say(m: string, err = false): void { this.msg = m; this.err = err; this.cd.markForCheck(); }
  waiting(): any[] { return this.lines.filter(l => l.status === 'pending'); }
  selected(): number[] { return Object.entries(this.sel).filter(([, v]) => v).map(([k]) => +k); }
  async calc(save: boolean): Promise<void> {
    this.busy = true;
    try {
      const r: any = await this.api.post('arrears/', { action: save ? 'save' : 'preview', employee_ids: this.pick, effective_from: this.eff, component_ids: this.comps });
      if (save) { this.preview = null; await this.load(); this.say(i18nT('{0} arrears lines saved – they are paid with the next payslip.', [r.lines])); } else { this.preview = r; }
    } catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async cancel(): Promise<void> {
    try { await this.api.post('arrears/', { action: 'cancel', ids: this.selected() }); this.sel = {}; await this.load(); } catch (e) { this.say(httpErrorText(e), true); }
  }
}
