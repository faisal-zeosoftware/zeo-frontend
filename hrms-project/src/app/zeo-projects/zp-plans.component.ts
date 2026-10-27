import { Component, OnInit } from '@angular/core';
import { dmy } from '../shared-ui/z-present';   // v1.62.0 ui
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportExcel, exportPdf } from '../shared-ui/z-export';
import { ZpApiService } from './zp-api.service';

/** Plan templates (v1.15.0): one project plan per product / project type – phases, tasks, working-day timing, hours,
 *  role and milestones. Picked when a project is created (or applied later); everything stays editable in the project.
 *  Shown in Setup → Plan templates. */
@Component({
  selector: 'app-zp-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<p class="zp-note err" *ngIf="msg">{{ msg }}</p>
<p class="zp-note ok" *ngIf="ok">{{ ok }}</p>
<div class="zp-plan-wrap">
  <div class="zp-plan-list">
    <div class="zp-acts" style="margin-bottom:8px">
      <select [(ngModel)]="fProduct" (ngModelChange)="load()" class="ex-btn" style="padding:0 8px" aria-label="Product"><option [ngValue]="null">All products</option>
        <option *ngFor="let p of lk.products" [ngValue]="p.id">{{ p.name }}</option></select>
      <button type="button" class="ex-btn primary" (click)="newTpl()">+ Template</button>
    </div>
    <button type="button" class="ex-btn" style="width:100%;margin-bottom:10px" (click)="defaults()"
            title="Adds the standard plan &quot;IT implementation – System study to Go-live&quot; if it is not there">+ Add the default template</button>
    <button type="button" class="zp-plan-item" *ngFor="let t of list" [class.on]="cur?.id === t.id" (click)="open(t.id)">
      <b>{{ t.name }}</b><small>{{ t.product_name || 'Any product' }} · {{ t.project_type_label || 'Any type' }} · {{ t.line_count }} tasks · {{ n(t.total_hours) }} h</small>
    </button>
    <p class="zp-empty" *ngIf="!list.length">No templates yet. Add the default one (system study to go-live), make one here, or open a finished project and use "Save as template".</p>
  </div>
  <div class="zp-plan-edit" *ngIf="cur">
    <div class="ex-form">
      <label>Template name *<input [(ngModel)]="cur.name"></label>
      <label>Product<select [(ngModel)]="cur.product"><option [ngValue]="null">Any product</option><option *ngFor="let p of lk.products" [ngValue]="p.id">{{ p.name }}</option></select></label>
      <label>Project type<select [(ngModel)]="cur.project_type"><option value="">Any type</option><option *ngFor="let p of lk.project_types" [value]="p.value">{{ p.label }}</option></select></label>
      <label class="ck"><input type="checkbox" [(ngModel)]="cur.is_active"> Active (offered on new projects)</label>
      <label class="wide">Description<input [(ngModel)]="cur.description"></label>
    </div>
    <p class="zp-muted" style="margin:12px 0 6px">Start day and duration are <b>working days</b> from the project start (company working days and holidays).
      A milestone line also creates a milestone for that % of the contract value. {{ totals() }}</p>
    <div class="zp-acts" style="margin:0 0 8px"><label style="font-size:12.5px;color:#4a4f63;display:flex;gap:8px;align-items:center">Expected dates if the project starts on
      <input type="date" [(ngModel)]="startOn" class="ex-btn" style="padding:0 8px"></label>
      <span class="zp-muted">→ ends {{ dd(projEnd()) }} (working days; holidays are added when the template is applied)</span></div>
    <div class="zp-scroll">
      <table class="zp-table zp-grid">
        <tr><th>#</th><th>Phase</th><th title="Sub-task of the main task above">Sub</th><th>Task *</th><th class="r">Start day</th><th class="r">Days</th><th>Expected start</th><th>Expected end</th><th class="r">Hours</th><th>Role</th><th>Milestone %</th><th>Customer OK</th><th></th></tr>
        <tr *ngFor="let l of cur.lines; let i = index">
          <td class="zp-muted">{{ i + 1 }}</td>
          <td><input [(ngModel)]="l.phase" list="zp-phases" style="width:120px" [attr.aria-label]="'Phase ' + (i + 1)"></td>
          <td style="text-align:center"><input type="checkbox" [(ngModel)]="l.is_subtask" [disabled]="i === 0" [attr.aria-label]="'Sub-task ' + (i + 1)"></td>
          <td><input [(ngModel)]="l.title" [style.min-width.px]="l.is_subtask ? 196 : 220" [style.margin-left.px]="l.is_subtask ? 24 : 0" [attr.aria-label]="'Task ' + (i + 1)"></td>
          <td class="r"><input type="number" min="0" [(ngModel)]="l.start_day" style="width:70px" [attr.aria-label]="'Start day ' + (i + 1)"></td>
          <td class="r"><input type="number" min="1" [(ngModel)]="l.duration_days" style="width:60px" [attr.aria-label]="'Days ' + (i + 1)"></td>
          <td style="white-space:nowrap">{{ dd(expStart(l)) }}</td><td style="white-space:nowrap">{{ dd(expEnd(l)) }}</td>
          <td class="r"><input type="number" min="0" step="0.5" [(ngModel)]="l.hours" style="width:70px" [attr.aria-label]="'Hours ' + (i + 1)"></td>
          <td><input [(ngModel)]="l.role" list="zp-roles" style="width:110px" [attr.aria-label]="'Role ' + (i + 1)"></td>
          <td><label class="ck" style="display:flex;gap:4px;align-items:center"><input type="checkbox" [(ngModel)]="l.is_milestone" [attr.aria-label]="'Milestone ' + (i + 1)">
            <input type="number" min="0" max="100" [(ngModel)]="l.milestone_pct" [disabled]="!l.is_milestone" style="width:60px" [attr.aria-label]="'Milestone % ' + (i + 1)"></label></td>
          <td style="text-align:center"><input type="checkbox" [(ngModel)]="l.customer_approval" [attr.aria-label]="'Customer approval ' + (i + 1)"></td>
          <td style="white-space:nowrap"><button type="button" class="ex-btn sm" (click)="move(i, -1)" [disabled]="i === 0" aria-label="Move up">↑</button>
            <button type="button" class="ex-btn sm" (click)="move(i, 1)" [disabled]="i === cur.lines.length - 1" aria-label="Move down">↓</button>
            <button type="button" class="ex-btn sm danger" (click)="cur.lines.splice(i, 1)" aria-label="Remove line">×</button></td>
        </tr>
      </table>
      <datalist id="zp-phases"><option *ngFor="let p of phases" [value]="p"></option></datalist>
      <datalist id="zp-roles"><option *ngFor="let r of roles" [value]="r"></option></datalist>
    </div>
    <div class="zp-acts" style="margin-top:10px">
      <button type="button" class="ex-btn" (click)="addLine()">+ Line</button>
      <button type="button" class="ex-btn" (click)="addLine(true)" [disabled]="!cur.lines.length">+ Sub-task</button>
      <span style="flex:1"></span>
      <button type="button" class="ex-btn" (click)="xls()" [disabled]="!cur.lines.length">Excel</button>
      <button type="button" class="ex-btn" (click)="pdf()" [disabled]="!cur.lines.length">PDF</button>
      <button type="button" class="ex-btn danger" *ngIf="cur.id" (click)="remove()">Delete</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">Save template</button>
    </div>
  </div>
</div>`,
  styles: [`
.zp-plan-wrap { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 18px; align-items: start; }
@media (max-width: 900px) { .zp-plan-wrap { grid-template-columns: 1fr; } }
.zp-plan-item { display: block; width: 100%; text-align: left; border: 1px solid #e3e5ef; border-radius: 10px; background: #fff; padding: 10px 12px; margin-bottom: 8px; cursor: pointer; font-family: inherit; }
.zp-plan-item.on { border-color: #5b4fe0; background: #f5f3ff; }
.zp-plan-item b { display: block; font-size: 13px; color: #1b1640; } .zp-plan-item small { color: #6b7185; font-size: 11.5px; }
.zp-grid input { height: 30px; border: 1px solid #dcdfea; border-radius: 6px; padding: 0 6px; font-size: 12.5px; font-family: inherit; }
`],
})
export class ZpPlansComponent implements OnInit {
  lk: any = { products: [], project_types: [] };
  list: any[] = [];
  cur: any = null;
  fProduct: number | null = null;
  msg = '';
  ok = '';
  busy = false;
  phases = ['System study', 'Solution design', 'Configuration', 'Development', 'Data migration', 'Testing', 'Training', 'Go-live', 'Hyper-care'];
  roles = ['Project manager', 'Functional consultant', 'Technical consultant', 'Developer', 'Data migration', 'Trainer', 'Infrastructure', 'Customer'];

  constructor(private api: ZpApiService) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    await this.load();
  }

  async load(): Promise<void> {
    try { this.list = await this.api.get('plan-templates/', { active: 0, product: this.fProduct }); this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
  }

  async open(id: number): Promise<void> {
    try { this.cur = await this.api.get(`plan-templates/${id}/`); } catch (e) { this.msg = ZpApiService.error(e); }
  }

  newTpl(): void {
    this.cur = { id: null, name: '', product: this.fProduct, project_type: '', description: '', is_active: true, lines: [] };
    this.addLine();
  }

  addLine(sub = false): void {
    const last = this.cur.lines[this.cur.lines.length - 1];
    const main = [...this.cur.lines].reverse().find((l: any) => !l.is_subtask);
    const start = sub && main ? Number(main.start_day || 0) : (last ? Number(last.start_day || 0) + Number(last.duration_days || 1) : 0);
    this.cur.lines.push({ phase: (sub ? main?.phase : last?.phase) || 'System study', title: '', start_day: start, duration_days: 1, hours: sub ? 4 : 8,
                          role: last?.role || 'Functional consultant', is_milestone: false, milestone_pct: 0, customer_approval: false, is_subtask: sub && !!main });
  }

  move(i: number, d: number): void { const l = this.cur.lines; [l[i], l[i + d]] = [l[i + d], l[i]]; }

  totals(): string {
    const ls = this.cur?.lines || [];
    const h = ls.reduce((a: number, l: any) => a + Number(l.hours || 0), 0);
    const days = Math.max(0, ...ls.map((l: any) => Number(l.start_day || 0) + Number(l.duration_days || 0)));
    const pct = ls.filter((l: any) => l.is_milestone).reduce((a: number, l: any) => a + Number(l.milestone_pct || 0), 0);
    return `Total ${this.n(h)} h over ${days} working days · milestones ${this.n(pct)} % of the contract.`;
  }

  async save(): Promise<void> {
    this.busy = true; this.ok = '';
    try {
      const body = { ...this.cur };
      const r = this.cur.id ? await this.api.put(`plan-templates/${this.cur.id}/`, body) : await this.api.post('plan-templates/', body);
      this.cur = r; this.ok = 'Template saved.'; this.msg = '';
      await this.load(); await this.api.lookups(true);
      setTimeout(() => this.ok = '', 2500);
    } catch (e) { this.msg = ZpApiService.error(e); }
    this.busy = false;
  }

  async defaults(): Promise<void> {
    try {
      const r = await this.api.post('plan-templates/defaults/');
      this.ok = r.created.length ? `Added: ${r.created.join(', ')}.` : 'The default template is already there.';
      this.fProduct = null;
      await this.load(); await this.api.lookups(true);
      const t = this.list.find(x => x.name.startsWith('IT implementation'));
      if (t) await this.open(t.id);
      setTimeout(() => this.ok = '', 3000);
    } catch (e) { this.msg = ZpApiService.error(e); }
  }

  async remove(): Promise<void> {
    if (!confirm(`Delete the template "${this.cur.name}"? Projects made from it keep their plan.`)) return;
    try { await this.api.delete(`plan-templates/${this.cur.id}/`); this.cur = null; await this.load(); } catch (e) { this.msg = ZpApiService.error(e); }
  }

  private rows(): string[][] {
    return this.cur.lines.map((l: any, i: number) => [String(i + 1), l.phase || '', (l.is_subtask ? '   – ' : '') + (l.title || ''), String(l.start_day ?? ''), String(l.duration_days ?? ''),
      this.iso(this.expStart(l)), this.iso(this.expEnd(l)), String(l.hours ?? ''), l.role || '', l.is_milestone ? `${l.milestone_pct} %` : '', l.customer_approval ? 'Yes' : '']);
  }
  private heads = ['#', 'Phase', 'Task', 'Start (working day)', 'Days', 'Expected start', 'Expected end', 'Hours', 'Role', 'Milestone', 'Customer approval'];
  xls(): void { exportExcel(`Plan template ${this.cur.name}`, this.heads, this.rows(), [{ name: 'Start', rows: [['Project start', this.startOn], ['Expected end', this.iso(this.projEnd())]] }]); }
  pdf(): void { exportPdf(`Plan template – ${this.cur.name}`, this.heads, this.rows(), `Project start ${this.dd(this.startOn)} · expected end ${this.dd(this.projEnd())} · ${this.totals()}`); }

  // ---- expected dates (same rule as the server: working days from the first working day of the project)
  startOn = this.nextMonday();
  private nextMonday(): string { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return this.iso(d); }
  private iso(d: Date | null): string { return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''; }
  private work(d: Date): boolean { const wd = (d.getDay() + 6) % 7; return (this.lk.work_days?.length ? this.lk.work_days : [0, 1, 2, 3, 4]).includes(wd); }
  private add(start: Date, n: number): Date {
    const d = new Date(start.getTime()); let guard = 0;
    while (!this.work(d) && guard++ < 30) d.setDate(d.getDate() + 1);
    let k = 0;
    while (k < n && guard++ < 5000) { d.setDate(d.getDate() + 1); if (this.work(d)) k++; }
    return d;
  }
  private base(): Date | null { return this.startOn ? new Date(this.startOn + 'T12:00:00') : null; }
  expStart(l: any): Date | null { const b = this.base(); return b ? this.add(b, Number(l.start_day || 0)) : null; }
  expEnd(l: any): Date | null { const s = this.expStart(l); return s ? this.add(s, Math.max(0, Number(l.duration_days || 1) - 1)) : null; }
  projEnd(): Date | null {
    const ends = (this.cur?.lines || []).map((l: any) => this.expEnd(l)).filter((x: any) => x) as Date[];
    return ends.length ? new Date(Math.max(...ends.map(x => x.getTime()))) : null;
  }
  dd(v: any): string { if (!v) return '–'; const d = typeof v === 'string' ? new Date(v + 'T12:00:00') : v; return dmy(d); }   // v1.62.0 ui
  n(v: any): string { return Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
}

/** Page wrapper: Projects → Delivery → Plan templates (for project managers without the set-up right). */
@Component({
  selector: 'app-zp-plans-page',
  standalone: true,
  imports: [ZpPlansComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">Plan templates</h1>
        <p class="ex-desc">A standard project plan for each product or project type. Pick one when you create a project – the tasks, hours, dates and milestones are filled in and stay editable.</p></div></div>
    </div>
    <div class="com_list mt-4"><app-zp-plans></app-zp-plans></div>
  </div>
</div>`,
})
export class ZpPlansPageComponent {}
