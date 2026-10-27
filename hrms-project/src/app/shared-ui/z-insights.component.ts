import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { httpErrorText } from './z-http-error.interceptor';
import { ZAD_STYLES } from './z-admin-pages.component';
import { ZChartComponent } from '../hr-modules/dashboards/z-chart.component';

/**
 * v1.53.0 – insights:
 *  ZReportBuilderComponent  Reports › Report builder – a record type, columns, filters, grouping with totals → a report of the
 *                           report centre (r/c-<id>), private or shared.
 *  ZDashboardsComponent     Reports › Dashboards – dashboards made of report cards (number, bar, line by month, table).
 */
const INS_STYLES = `.zin-cols { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; } .zin-col { display: inline-flex; align-items: center; gap: 4px; background: #eef0ff; border: 1px solid #d6d9f5; border-radius: 14px; padding: 2px 4px 2px 10px; font-size: 12.5px; }
  .zin-col button { border: 0; background: none; cursor: pointer; padding: 0 4px; color: #4a4e6a; font-size: 13px; }
  .zin-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 4px 0; }
  .zin-board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .zin-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 12px 14px; min-height: 110px; display: flex; flex-direction: column; }
  .zin-card.s { grid-column: span 1; } .zin-card.w { grid-column: span 2; } .zin-card.f { grid-column: 1 / -1; }
  .zin-card h4 { margin: 0 0 4px; font-size: 13.5px; display: flex; gap: 6px; align-items: center; } .zin-card h4 span { flex: 1; }
  .zin-card .big { font-size: 30px; font-weight: 600; color: #1b1640; margin: 6px 0 2px; font-variant-numeric: tabular-nums; }
  .zin-card .sub { font-size: 12px; color: #5d6670; } .zin-card .err { color: #9b2c24; font-size: 12.5px; }
  .zin-card table { width: 100%; border-collapse: collapse; font-size: 12px; } .zin-card td, .zin-card th { padding: 3px 4px; border-bottom: 1px solid #f0f1f4; text-align: start; }
  .zin-tools { display: flex; gap: 2px; } .zin-tools button { border: 0; background: none; cursor: pointer; color: #5d6670; font-size: 12px; padding: 2px 4px; }
  @media (max-width: 900px) { .zin-board { grid-template-columns: 1fr; } .zin-card.s, .zin-card.w { grid-column: 1 / -1; } }`;

function schemaQ(): string { return `schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`; }

abstract class Base {
  msg = ''; err = false; busy = false;
  constructor(protected http: HttpClient, protected rec: ZRecordService, protected cd: ChangeDetectorRef) {}
  protected u(p: string): string { return `${this.rec.api}${p}${p.includes('?') ? '&' : '?'}${schemaQ()}`; }
  protected get<T = any>(p: string): Promise<T> { return firstValueFrom(this.http.get<T>(this.u(p))); }
  protected post<T = any>(p: string, b: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.u(p), b)); }
  protected del(p: string): Promise<any> { return firstValueFrom(this.http.delete(this.u(p))); }
  say(t: string, err = false): void { this.msg = t; this.err = err; this.cd.markForCheck(); }
  protected async act(fn: () => Promise<any>, ok = ''): Promise<boolean> {
    this.busy = true; this.cd.markForCheck();
    try { await fn(); if (ok) { this.say(ok); } return true; } catch (e) { this.say(httpErrorText(e), true); return false; } finally { this.busy = false; this.cd.markForCheck(); }
  }
}

const OP_LABEL: Record<string, string> = {
  eq: 'is', ne: 'is not', contains: 'contains', not_contains: 'does not contain', starts: 'starts with', ends: 'ends with', gt: 'more than', lt: 'less than',
  gte: 'at least', lte: 'at most', empty: 'is empty', not_empty: 'is not empty', true: 'is yes', false: 'is no', between: 'between', in: 'one of (comma)',
  not_in: 'none of (comma)', date_before: 'before', date_after: 'after', date_today: 'is today', date_overdue: 'is before today', this_month: 'in this month',
  this_year: 'in this year', last_days: 'in the last … days', next_days: 'in the next … days',
};
const OPS_FOR: Record<string, string[]> = {
  text: ['eq', 'ne', 'contains', 'not_contains', 'starts', 'ends', 'empty', 'not_empty', 'in', 'not_in'],
  email: ['eq', 'ne', 'contains', 'not_contains', 'ends', 'empty', 'not_empty'],
  number: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'between', 'empty', 'not_empty'],
  date: ['eq', 'date_before', 'date_after', 'between', 'date_today', 'date_overdue', 'this_month', 'this_year', 'last_days', 'next_days', 'empty', 'not_empty'],
  datetime: ['date_before', 'date_after', 'between', 'date_today', 'this_month', 'this_year', 'last_days', 'next_days', 'empty', 'not_empty'],
  bool: ['true', 'false'], choice: ['eq', 'ne', 'in', 'not_in', 'empty', 'not_empty'], link: ['eq', 'ne', 'empty', 'not_empty'],
};
const NO_VALUE = ['empty', 'not_empty', 'true', 'false', 'date_today', 'date_overdue', 'this_month', 'this_year'];

/* ------------------------------------------------------------------------------------------------ report builder */
@Component({
  selector: 'z-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES + INS_STYLES],
  template: `
<div class="zad" data-report-builder>
  <h2>Report builder</h2>
  <p class="zad-muted">Pick a record type, the columns, filters and an optional grouping with totals. The report opens in the report centre, can be e-mailed, exported, scheduled and put on a dashboard. Rows follow your rights (branches, own records).</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card" *ngIf="!f">
    <div class="zad-act" style="margin:0 0 10px"><button type="button" class="zad-btn primary" (click)="startNew()" data-rb-new>New report</button></div>
    <table class="zad-t"><tr><th>Report</th><th>Record type</th><th>Shared</th><th>By</th><th></th></tr>
      <tr *ngFor="let r of rows" [attr.data-rb-row]="r.id"><td><b>{{ r.name }}</b><div class="zad-muted">{{ r.section }}{{ r.description ? ' · ' + r.description : '' }}</div></td>
        <td>{{ modelLabel(r.model) }}</td><td>{{ shareLabel(r.shared) }}</td><td>{{ r.owner }}</td>
        <td style="white-space:nowrap"><a class="zad-btn sm" [routerLink]="['/main-sidebar/report-options/r', r.key]" data-rb-open>Open</a>
          <button type="button" class="zad-btn sm" *ngIf="r.mine || meta?.admin" (click)="edit(r)">Change</button>
          <button type="button" class="zad-btn sm danger" *ngIf="r.mine || meta?.admin" (click)="remove(r)">Delete</button></td></tr>
      <tr *ngIf="!rows.length"><td colspan="5" class="zad-muted">No reports made yet.</td></tr></table>
  </section>

  <ng-container *ngIf="f">
    <section class="zad-card">
      <h3><mat-icon>table_view</mat-icon>{{ f.id ? 'Change the report' : 'New report' }}</h3>
      <div class="zad-grid">
        <label>Record type<select [(ngModel)]="f.model" (ngModelChange)="pickModel()" data-rb-model><option value="">Choose…</option>
          <optgroup *ngFor="let g of modelGroups" [label]="g.label"><option *ngFor="let m of g.items" [value]="m.key">{{ m.label }}</option></optgroup></select></label>
        <label>Name<input [(ngModel)]="f.name" maxlength="120" placeholder="Active employees by department" data-rb-name></label>
        <label>Heading in the report centre<input [(ngModel)]="f.section" maxlength="60"></label>
        <label>Description<input [(ngModel)]="f.description" maxlength="255"></label>
      </div>
    </section>
    <section class="zad-card" *ngIf="fields.length">
      <h3><mat-icon>view_column</mat-icon>Columns</h3>
      <div class="zin-cols"><span class="zin-col" *ngFor="let c of f.columns; let i = index">{{ c.label || label(c.field) }}
        <button type="button" (click)="move(i, -1)" [disabled]="!i" aria-label="Move left">‹</button><button type="button" (click)="move(i, 1)" aria-label="Move right">›</button>
        <button type="button" (click)="f.columns.splice(i, 1)" aria-label="Remove">×</button></span></div>
      <div class="zin-row"><select [(ngModel)]="addCol" aria-label="Add a column" data-rb-add-col><option value="">Add a column…</option><option *ngFor="let x of fields" [value]="x.key">{{ x.label }}</option></select>
        <button type="button" class="zad-btn sm" (click)="addColumn()" [disabled]="!addCol" data-rb-add>Add</button></div>
      <h3 style="margin-top:14px"><mat-icon>filter_alt</mat-icon>Filters</h3>
      <div class="zin-row" *ngFor="let x of f.filters; let i = index">
        <select [(ngModel)]="x.field" (ngModelChange)="x.op = ops(x.field)[0]; x.value = ''" aria-label="Field" data-rb-filter-field><option *ngFor="let y of fields" [value]="y.key">{{ y.label }}</option></select>
        <select [(ngModel)]="x.op" aria-label="Condition"><option *ngFor="let o of ops(x.field)" [value]="o">{{ opLabel(o) }}</option></select>
        <ng-container *ngIf="!noValue(x.op)">
          <select *ngIf="choices(x.field) as ch; else free" [(ngModel)]="x.value" aria-label="Value"><option *ngFor="let c of ch" [value]="c.value">{{ c.label }}</option></select>
          <ng-template #free><input [(ngModel)]="x.value" [type]="inputType(x.field, x.op)" aria-label="Value" style="width:160px"></ng-template>
          <input *ngIf="x.op === 'between'" [(ngModel)]="x.value2" [type]="inputType(x.field, x.op)" aria-label="And" style="width:160px">
        </ng-container>
        <button type="button" class="zad-btn sm" (click)="f.filters.splice(i, 1)">Remove</button></div>
      <button type="button" class="zad-btn sm" (click)="newFilter()" data-rb-add-filter>Add a filter</button>
      <h3 style="margin-top:14px"><mat-icon>functions</mat-icon>Grouping, sort and period</h3>
      <div class="zad-grid">
        <label>Group by (one row per value)<select [(ngModel)]="f.group_by" data-rb-group><option value="">No grouping – one row per record</option><option *ngFor="let x of fields" [value]="x.key">{{ x.label }}</option></select></label>
        <label *ngIf="f.group_by">Totals<select [(ngModel)]="aggPick"><option value="">Add a total…</option><option value="count">Number of records</option>
          <ng-container *ngFor="let x of numberFields()"><option [value]="'sum:' + x.key">Total {{ x.label }}</option><option [value]="'avg:' + x.key">Average {{ x.label }}</option></ng-container></select></label>
        <label>Sort by<select [(ngModel)]="sortField"><option value="">Newest first</option><option *ngFor="let x of fields" [value]="x.key">{{ x.label }}</option></select></label>
        <label>Order<select [(ngModel)]="sortDir"><option value="">A → Z, low → high</option><option value="-">Z → A, high → low</option></select></label>
        <label>The report's period filters<select [(ngModel)]="f.date_field"><option value="">No period</option><option *ngFor="let x of dateFields()" [value]="x.key">{{ x.label }}</option></select></label>
        <label>At most … rows (0 = all)<input type="number" min="0" [(ngModel)]="f.limit"></label>
      </div>
      <div class="zin-cols" *ngIf="f.group_by"><span class="zin-col" *ngFor="let a of f.aggregates; let i = index">{{ aggLabel(a) }}<button type="button" (click)="f.aggregates.splice(i, 1)" aria-label="Remove">×</button></span>
        <button type="button" class="zad-btn sm" (click)="addAgg()" [disabled]="!aggPick">Add the total</button></div>
      <h3 style="margin-top:14px"><mat-icon>group</mat-icon>Who can run it</h3>
      <div class="zin-row"><label class="zad-chk"><input type="radio" name="sh" value="me" [(ngModel)]="f.shared"> Only me</label>
        <label class="zad-chk"><input type="radio" name="sh" value="all" [(ngModel)]="f.shared" data-rb-share-all> Everybody who may view {{ modelLabel(f.model) | lowercase }}</label>
        <label class="zad-chk"><input type="radio" name="sh" value="groups" [(ngModel)]="f.shared"> Chosen permission groups</label></div>
      <div class="zin-row" *ngIf="f.shared === 'groups'"><label class="zad-chk" *ngFor="let g of meta?.groups || []"><input type="checkbox" [checked]="f.groups.includes(g.id)" (change)="tog(f.groups, g.id)"> {{ g.name }}</label></div>
      <div class="zad-act"><button type="button" class="zad-btn" (click)="preview()" [disabled]="busy || !f.columns.length" data-rb-preview>Preview</button>
        <button type="button" class="zad-btn primary" (click)="save()" [disabled]="busy || !f.columns.length || !f.name" data-rb-save>Save the report</button>
        <button type="button" class="zad-btn" (click)="f = null; pv = null">Close</button></div>
    </section>
    <section class="zad-card" *ngIf="pv" data-rb-preview-table>
      <h3><mat-icon>preview</mat-icon>Preview – {{ pv.count }} row(s){{ pv.count >= 50 && !f.group_by ? ', the first 50' : '' }}</h3>
      <div style="overflow:auto;max-height:420px"><table class="zad-t"><tr><th *ngFor="let c of pv.columns">{{ c.label }}</th></tr>
        <tr *ngFor="let r of pv.rows"><td *ngFor="let c of pv.columns">{{ r[c.key] }}</td></tr></table></div>
    </section>
  </ng-container>
</div>`,
})
export class ZReportBuilderComponent extends Base implements OnInit {
  meta: any = null; rows: any[] = []; f: any = null; fields: any[] = []; addCol = ''; aggPick = ''; sortField = ''; sortDir = ''; pv: any = null;
  modelGroups: any[] = [];
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef) { super(http, rec, cd); }
  async ngOnInit(): Promise<void> {
    try {
      this.meta = await this.get('/insights/api/meta/');
      const g: any = {};
      for (const m of this.meta.models) { (g[m.module] = g[m.module] || []).push(m); }
      this.modelGroups = Object.keys(g).map(k => ({ label: k === 'hrms' ? 'HR' : k[0].toUpperCase() + k.slice(1), items: g[k] }));
    } catch (e) { this.say(httpErrorText(e), true); }
    await this.load();
  }
  async load(): Promise<void> { try { this.rows = (await this.get<any[]>('/insights/api/reports/')) || []; } catch { this.rows = []; } this.cd.markForCheck(); }
  modelLabel(k: string): string { return this.meta?.models?.find((m: any) => m.key === k)?.label || k; }
  shareLabel(s: string): string { return ({ me: 'Only me', all: 'Everybody', groups: 'Groups' } as any)[s] || s; }
  startNew(): void { this.f = { name: '', section: 'My reports', description: '', model: '', columns: [], filters: [], group_by: '', aggregates: [], limit: 0, date_field: '', shared: 'me', groups: [] }; this.fields = []; this.pv = null; this.sortField = ''; this.sortDir = ''; }
  async edit(r: any): Promise<void> {
    this.f = JSON.parse(JSON.stringify(r)); this.pv = null;
    this.sortDir = (r.sort || '').startsWith('-') ? '-' : ''; this.sortField = (r.sort || '').replace(/^-/, '');
    await this.loadFields();
  }
  async pickModel(): Promise<void> { this.f.columns = []; this.f.filters = []; this.f.group_by = ''; this.f.aggregates = []; this.f.date_field = ''; this.pv = null; await this.loadFields(); }
  async loadFields(): Promise<void> {
    this.fields = [];
    if (!this.f.model) { return; }
    try { this.fields = await this.get<any[]>(`/insights/api/fields/?model=${encodeURIComponent(this.f.model)}`); } catch (e) { this.say(httpErrorText(e), true); }
    if (!this.f.columns.length) {   // a start: the code / name like columns
      const pick = this.fields.filter(x => !x.related && x.type !== 'link' && x.key !== 'id').slice(0, 4);
      this.f.columns = pick.map(x => ({ field: x.key, label: '' }));
    }
    this.cd.markForCheck();
  }
  field(k: string): any { return this.fields.find(x => x.key === k) || {}; }
  label(k: string): string { return this.field(k).label || k; }
  ops(k: string): string[] { return OPS_FOR[this.field(k).type] || OPS_FOR['text']; }
  opLabel(o: string): string { return OP_LABEL[o] || o; }
  noValue(o: string): boolean { return NO_VALUE.includes(o); }
  choices(k: string): any[] | null { return this.field(k).choices || null; }
  inputType(k: string, op: string): string { const t = this.field(k).type; return ['last_days', 'next_days'].includes(op) || t === 'number' || t === 'link' ? 'number' : (t === 'date' || t === 'datetime' ? 'date' : 'text'); }
  numberFields(): any[] { return this.fields.filter(x => x.type === 'number' && x.key !== 'id'); }
  dateFields(): any[] { return this.fields.filter(x => x.type === 'date' || x.type === 'datetime'); }
  newFilter(): void { const x = this.fields.find(y => !y.related && y.key !== 'id') || this.fields[0]; this.f.filters.push({ field: x.key, op: this.ops(x.key)[0], value: '', value2: '' }); }
  addColumn(): void { if (this.addCol && !this.f.columns.some((c: any) => c.field === this.addCol)) { this.f.columns.push({ field: this.addCol, label: '' }); } this.addCol = ''; }
  move(i: number, d: number): void { const j = i + d; if (j < 0 || j >= this.f.columns.length) { return; } const c = this.f.columns; [c[i], c[j]] = [c[j], c[i]]; }
  addAgg(): void {
    if (!this.aggPick) { return; }
    const [fn, field] = this.aggPick === 'count' ? ['count', ''] : this.aggPick.split(':');
    if (!this.f.aggregates.some((a: any) => a.fn === fn && a.field === field)) { this.f.aggregates.push({ fn, field }); }
    this.aggPick = '';
  }
  aggLabel(a: any): string { return a.fn === 'count' ? 'Number of records' : `${({ sum: 'Total', avg: 'Average', min: 'Lowest', max: 'Highest' } as any)[a.fn]} ${this.label(a.field)}`; }
  tog(list: number[], v: number): void { const i = list.indexOf(v); if (i >= 0) { list.splice(i, 1); } else { list.push(v); } }
  body(): any { return { ...this.f, sort: this.sortField ? this.sortDir + this.sortField : '', aggregates: this.f.group_by && !this.f.aggregates.length ? [{ fn: 'count', field: '' }] : this.f.aggregates }; }
  async preview(): Promise<void> { await this.act(async () => { this.pv = await this.post('/insights/api/reports/preview/', this.body()); }); }
  async save(): Promise<void> {
    if (await this.act(async () => { const r = await this.post('/insights/api/reports/', this.body()); this.f.id = r.id; this.say(`Saved – "${r.name}" is in the report centre under ${r.section}.`); })) { await this.load(); }
  }
  async remove(r: any): Promise<void> { if (!confirm(`Delete the report "${r.name}"? Dashboards and schedules that use it stop showing it.`)) { return; } if (await this.act(() => this.del(`/insights/api/reports/${r.id}/`), 'Deleted.')) { await this.load(); } }
}

/* ------------------------------------------------------------------------------------------------ dashboards */
@Component({
  selector: 'z-dashboards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZChartComponent],
  encapsulation: ViewEncapsulation.None,
  styles: [ZAD_STYLES + INS_STYLES],
  template: `
<div class="zad" style="max-width:1300px" data-dashboards>
  <div class="zin-row" style="justify-content:space-between"><h2>{{ cur ? cur.name : 'Dashboards' }}</h2>
    <div class="zad-act" style="margin:0">
      <select *ngIf="list.length" [ngModel]="cur?.id" (ngModelChange)="open($event)" aria-label="Dashboard" data-dash-pick><option *ngFor="let d of list" [ngValue]="d.id">{{ d.name }}{{ d.shared !== 'me' ? ' (shared)' : '' }}</option></select>
      <button type="button" class="zad-btn" *ngIf="cur?.can_edit" (click)="editing = !editing" data-dash-edit>{{ editing ? 'Done' : 'Change' }}</button>
      <button type="button" class="zad-btn primary" (click)="create()" data-dash-new>New dashboard</button></div></div>
  <p class="zad-muted" *ngIf="!cur">Dashboards made of report cards – a number, a chart by a column, a line by month or a short table. Every card follows the rights of the person looking at it.</p>
  <p class="zad-msg" *ngIf="msg" [class.err]="err" role="status">{{ msg }}</p>
  <section class="zad-card" *ngIf="editing && cur" data-dash-editor>
    <div class="zad-grid"><label>Name<input [(ngModel)]="cur.name" maxlength="120" data-dash-name></label>
      <label>Who sees it<select [(ngModel)]="cur.shared" data-dash-share><option value="me">Only me</option><option value="all">Everybody</option><option value="groups">Chosen permission groups</option></select></label></div>
    <div class="zin-row" *ngIf="cur.shared === 'groups'"><label class="zad-chk" *ngFor="let g of meta?.groups || []"><input type="checkbox" [checked]="cur.groups.includes(g.id)" (change)="tog(cur.groups, g.id)"> {{ g.name }}</label></div>
    <h3 style="margin-top:12px"><mat-icon>add_chart</mat-icon>Add a card</h3>
    <div class="zad-grid">
      <label>Report<select [(ngModel)]="nc.report" (ngModelChange)="pickReport()" data-card-report><option value="">Choose…</option>
        <optgroup *ngFor="let g of reportGroups" [label]="g.section"><option *ngFor="let r of g.items" [value]="r.key">{{ r.title }}</option></optgroup></select></label>
      <label>Show as<select [(ngModel)]="nc.view" data-card-view><option value="number">A number</option><option value="bar">Bars by a column</option><option value="line">A line by month</option><option value="table">A short table</option></select></label>
      <label *ngIf="nc.view === 'bar' || nc.view === 'line'">{{ nc.view === 'line' ? 'Date column' : 'Group by column' }}<select [(ngModel)]="nc.group" data-card-group><option value="">Choose…</option>
        <option *ngFor="let c of groupCols()" [value]="c.key">{{ c.label }}</option></select></label>
      <label *ngIf="nc.view !== 'table'">Value<select [(ngModel)]="nc.value" data-card-value><option value="count">Number of rows</option><option *ngFor="let c of numCols()" [value]="'sum:' + c.key">Total {{ c.label }}</option></select></label>
      <label>Period<select [(ngModel)]="nc.period"><option *ngFor="let p of meta?.periods || []" [value]="p.key">{{ p.label }}</option></select></label>
      <label>Size<select [(ngModel)]="nc.size"><option value="s">Small</option><option value="w">Wide</option><option value="f">Full width</option></select></label>
      <label>Title<input [(ngModel)]="nc.title" maxlength="80" [placeholder]="reportTitle(nc.report)" data-card-title></label>
    </div>
    <div class="zad-act"><button type="button" class="zad-btn primary" (click)="addCard()" [disabled]="busy || !nc.report || ((nc.view === 'bar' || nc.view === 'line') && !nc.group)" data-card-add>Add the card</button>
      <button type="button" class="zad-btn" (click)="saveDash()" [disabled]="busy" data-dash-save>Save</button>
      <button type="button" class="zad-btn danger" (click)="removeDash()">Delete the dashboard</button></div>
  </section>
  <div class="zin-board" *ngIf="cur">
    <div class="zin-card" *ngFor="let c of cur.cards; let i = index" [ngClass]="c.size || 's'" [attr.data-card]="c.view">
      <h4><span>{{ data[c.id]?.title || c.title || reportTitle(c.report) }}</span>
        <span class="zin-tools" *ngIf="editing" style="flex:none"><button type="button" (click)="moveCard(i, -1)" aria-label="Move earlier">‹</button><button type="button" (click)="moveCard(i, 1)" aria-label="Move later">›</button>
          <button type="button" (click)="cycleSize(c)" aria-label="Size">⤢</button><button type="button" (click)="cur.cards.splice(i, 1)" aria-label="Remove">×</button></span>
        <a *ngIf="!editing" class="zin-tools" [routerLink]="['/main-sidebar/report-options/r', c.report]" style="flex:none;font-size:12px">Open</a></h4>
      <ng-container *ngIf="data[c.id] as d; else loading">
        <div class="err" *ngIf="d.error">{{ d.error }}</div>
        <ng-container *ngIf="!d.error">
          <ng-container *ngIf="d.view === 'number'"><div class="big">{{ fmt(d.value) }}</div><div class="sub">{{ subLabel(d.value_label) }}{{ d.period ? ' · ' + dmy(d.period.from) + ' – ' + dmy(d.period.to) : '' }}</div></ng-container>
          <z-chart *ngIf="d.view === 'bar'" type="bar" [horizontal]="true" [labels]="d.labels" [values]="d.values" [height]="Math.max(140, d.labels.length * 26)" [ariaLabel]="d.title"></z-chart>
          <z-chart *ngIf="d.view === 'line'" type="line" [labels]="d.labels" [values]="d.values" [height]="190" [ariaLabel]="d.title"></z-chart>
          <div class="sub" *ngIf="d.view === 'bar' || d.view === 'line'">{{ subLabel(d.value_label) }} by {{ d.group_label | lowercase }} · {{ fmt(d.value) }} in all</div>
          <ng-container *ngIf="d.view === 'table'"><table><tr><th *ngFor="let col of d.columns">{{ col.label }}</th></tr>
            <tr *ngFor="let r of d.rows"><td *ngFor="let col of d.columns">{{ r[col.key] }}</td></tr></table>
            <div class="sub" *ngIf="d.more">and {{ d.more }} more</div></ng-container>
        </ng-container>
      </ng-container>
      <ng-template #loading><div class="sub">Loading…</div></ng-template>
    </div>
    <p class="zad-muted" *ngIf="!cur.cards.length">No cards yet – press Change and add one, or use "Add to a dashboard" on any report.</p>
  </div>
</div>`,
})
export class ZDashboardsComponent extends Base implements OnInit {
  Math = Math;
  meta: any = null; list: any[] = []; cur: any = null; data: Record<string, any> = {}; editing = false; reportGroups: any[] = []; cols: any[] = [];
  nc: any = this.blank();
  constructor(http: HttpClient, rec: ZRecordService, cd: ChangeDetectorRef, private route: ActivatedRoute, private router: Router) { super(http, rec, cd); }
  blank(): any { return { report: '', view: 'number', group: '', value: 'count', period: 'report', size: 's', title: '' }; }
  async ngOnInit(): Promise<void> {
    try {
      this.meta = await this.get('/insights/api/meta/');
      const g: any = {};
      for (const r of this.meta.reports) { (g[r.section] = g[r.section] || []).push(r); }
      this.reportGroups = Object.keys(g).map(k => ({ section: k, items: g[k] }));
    } catch (e) { this.say(httpErrorText(e), true); }
    await this.loadList();
    const want = Number(this.route.snapshot.queryParamMap.get('d') || 0);
    // v1.62.0 reports: the HRMS report centre opens the HR dashboard first (not the Assets / HSE one)
    const first = (/\/report-options\//.test(location.pathname) && this.list.find(d => d.suite === 'hrms')) || this.list[0];
    if (want || this.list.length) { await this.open(want || first.id); }
  }
  // v1.62.0 reports: "Total Total cost" → "Total cost"; dates dd/mm/yyyy
  subLabel(v: any): string { return String(v ?? '').replace(/^(Total|Average)\s+(Total|Average)\s+/i, '$1 ').replace(/^(\w+)\s+\1\b/i, '$1'); }
  dmy(v: any): string { const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v ?? ''); }
  async loadList(): Promise<void> { try { this.list = (await this.get<any[]>('/insights/api/dashboards/')) || []; } catch { this.list = []; } this.cd.markForCheck(); }
  async open(id: number): Promise<void> {
    this.data = {};
    try { this.cur = await this.get(`/insights/api/dashboards/${id}/`); } catch (e) { this.say(httpErrorText(e), true); return; }
    this.router.navigate([], { relativeTo: this.route, queryParams: { d: id }, replaceUrl: true });
    this.cd.markForCheck();
    await Promise.all((this.cur.cards || []).map((c: any) => this.loadCard(c)));
  }
  async loadCard(c: any): Promise<void> {
    let d: any;   // (the object is replaced after each card – read it only after the answer came)
    try { d = await this.get(`/insights/api/dashboards/${this.cur.id}/cards/${c.id}/`); }
    catch (e) { d = { error: httpErrorText(e) }; }
    this.data = { ...this.data, [c.id]: d }; this.cd.markForCheck();
  }
  reportTitle(k: string): string { return this.meta?.reports?.find((r: any) => r.key === k)?.title || k || ''; }
  async pickReport(): Promise<void> {
    this.cols = []; this.nc.group = ''; this.nc.value = 'count';
    if (!this.nc.report) { return; }
    try { const r: any = await firstValueFrom(this.http.get(`${this.rec.api}/dashboard/api/reports/${this.nc.report}/?${schemaQ()}`)); this.cols = r.columns || []; } catch { this.cols = []; }
    this.cd.markForCheck();
  }
  groupCols(): any[] { return this.nc.view === 'line' ? this.cols.filter(c => c.type === 'date') : this.cols.filter(c => c.type !== 'number'); }
  numCols(): any[] { return this.cols.filter(c => c.type === 'number'); }
  tog(list: number[], v: number): void { const i = list.indexOf(v); if (i >= 0) { list.splice(i, 1); } else { list.push(v); } }
  fmt(v: any): string { return typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : String(v ?? ''); }
  async create(): Promise<void> {
    const name = prompt('Name of the new dashboard', 'My dashboard');
    if (!name) { return; }
    await this.act(async () => { const r = await this.post('/insights/api/dashboards/', { name, cards: [] }); await this.loadList(); await this.open(r.id); this.editing = true; });
  }
  async addCard(): Promise<void> {
    await this.act(async () => {
      const r = await this.post(`/insights/api/dashboards/${this.cur.id}/add-card/`, { card: { ...this.nc, size: this.nc.view === 'number' ? this.nc.size : (this.nc.size === 's' ? 'w' : this.nc.size) } });
      this.cur.cards = r.cards; const c = r.cards[r.cards.length - 1]; this.nc = this.blank(); this.cols = []; await this.loadCard(c);
    });
  }
  moveCard(i: number, d: number): void { const j = i + d; const c = this.cur.cards; if (j < 0 || j >= c.length) { return; } [c[i], c[j]] = [c[j], c[i]]; }
  cycleSize(c: any): void { c.size = ({ s: 'w', w: 'f', f: 's' } as any)[c.size || 's']; }
  async saveDash(): Promise<void> {
    if (await this.act(async () => { this.cur = { ...this.cur, ...(await this.post('/insights/api/dashboards/', { id: this.cur.id, name: this.cur.name, shared: this.cur.shared, groups: this.cur.groups, cards: this.cur.cards })) }; }, 'Saved.')) {
      this.editing = false; await this.loadList();
    }
  }
  async removeDash(): Promise<void> {
    if (!confirm(`Delete the dashboard "${this.cur.name}"?`)) { return; }
    if (await this.act(() => this.del(`/insights/api/dashboards/${this.cur.id}/`), 'Deleted.')) { this.cur = null; this.editing = false; await this.loadList(); if (this.list.length) { await this.open(this.list[0].id); } }
  }
}
