import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { exportExcel, exportPdf } from '../shared-ui/z-export';
import { HEALTH_LABEL, PRIORITY_CLASS, STAGE_CLASS, ZP_BASE, ZpApiService, day, money, num, slaText, today, when } from './zp-api.service';

/** New project (v1.14.0): a ZEO project with customer, type, billing, budget and team. */
@Component({
  selector: 'app-zp-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(860px,100%)">
    <header><h2>New project</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <label class="wide">Project name *<input [(ngModel)]="f.title" maxlength="200" placeholder="e.g. Gulf Trading – Odoo implementation"></label>
        <label>Customer<select [(ngModel)]="f.customer"><option [ngValue]="null">Internal project</option><option *ngFor="let c of lk.customers" [ngValue]="c.id">{{ c.name }}</option></select></label>
        <label>Project type<select [(ngModel)]="f.project_type" (ngModelChange)="tplCheck()"><option *ngFor="let x of lk.project_types" [value]="x.value">{{ x.label }}</option></select></label>
        <label>Product<select [(ngModel)]="f.product" (ngModelChange)="tplCheck()"><option [ngValue]="null">–</option><option *ngFor="let p of lk.products" [ngValue]="p.id">{{ p.name }}</option></select></label>
        <label>Plan template<select [(ngModel)]="f.plan_template" (ngModelChange)="pickTpl()"><option [ngValue]="null">No template</option>
          <option *ngFor="let t of templates()" [ngValue]="t.id">{{ t.name }}</option></select></label>
        <div class="wide zp-note" *ngIf="tpl" style="margin:0">
          <b>{{ tpl.name }}</b>: {{ tpl.line_count }} tasks, {{ n(tpl.total_hours) }} h over {{ tpl.total_days }} working days{{ tpl.milestone_pct ? ', milestones ' + n(tpl.milestone_pct) + ' % of the value' : '' }}.
          Tasks are dated from the start; you can change everything afterwards.
          <div class="ex-form" style="margin-top:8px" *ngIf="tpl.roles.length">
            <label *ngFor="let r of tpl.roles">{{ r }} →<select [(ngModel)]="f.roles[r]"><option [ngValue]="null">assign later</option>
              <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
          </div>
        </div>
        <label>Expected start *<input type="date" [(ngModel)]="f.start_date"></label>
        <label>Expected end {{ f.plan_template ? '(from the template if empty)' : '*' }}<input type="date" [(ngModel)]="f.end_date" [min]="f.start_date"></label>
        <label>Billing method<select [(ngModel)]="f.billing_method"><option *ngFor="let x of lk.billing_methods" [value]="x.value">{{ x.label }}</option></select></label>
        <label>Contract / LPO / sales order ref.<input [(ngModel)]="f.contract_ref"></label>
        <label>Project value<input type="number" min="0" [(ngModel)]="f.contract_value"></label>
        <label>Budgeted hours<input type="number" min="0" [(ngModel)]="f.budget_hours"></label>
        <label>Approved cost budget<input type="number" min="0" [(ngModel)]="f.budget_amount"></label>
        <label *ngIf="f.billing_method === 'time_and_material'">Bill rate per hour<input type="number" min="0" [(ngModel)]="f.default_bill_rate"></label>
        <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Project manager(s)</div>
          <div class="zp-multi"><label *ngFor="let e of lk.employees"><input type="checkbox" [checked]="f.managers.includes(e.id)" (change)="tog('managers', e.id)"> {{ e.name }}</label></div></div>
        <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Team members</div>
          <div class="zp-multi"><label *ngFor="let e of lk.employees"><input type="checkbox" [checked]="f.members.includes(e.id)" (change)="tog('members', e.id)"> {{ e.name }}</label></div></div>
        <label class="wide">Scope of work<textarea [(ngModel)]="f.scope" rows="3"></textarea></label>
        <label class="wide">Deliverables<textarea [(ngModel)]="f.deliverables" rows="2"></textarea></label>
        <label class="ck wide" *ngIf="!f.plan_template"><input type="checkbox" [(ngModel)]="f.template_phases"> Add the ERP phases as stages (Analysis, Configuration, Development, Migration, Testing, Deployment)</label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">Create project</button></footer>
  </div>
</div>`,
})
export class ZpProjectFormComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { customers: [], project_types: [], billing_methods: [], employees: [] };
  f: any = { title: '', customer: null, project_type: 'implementation', start_date: today(), end_date: '', billing_method: 'milestone', contract_ref: '',
             contract_value: 0, budget_hours: 0, budget_amount: 0, default_bill_rate: 0, managers: [], members: [], scope: '', deliverables: '', template_phases: true,
             product: null, plan_template: null, roles: {} };
  tpl: any = null;
  err = '';
  busy = false;
  constructor(private api: ZpApiService) {}
  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    if (this.lk.rights?.employee_id) this.f.managers = [this.lk.rights.employee_id];
  }
  templates(): any[] {
    return (this.lk.plan_templates || []).filter((t: any) => (!t.product || t.product === this.f.product) && (!t.project_type || t.project_type === this.f.project_type));
  }
  tplCheck(): void { if (this.f.plan_template && !this.templates().some(t => t.id === this.f.plan_template)) { this.f.plan_template = null; this.tpl = null; } }
  async pickTpl(): Promise<void> {
    this.tpl = null; this.f.roles = {};
    if (!this.f.plan_template) return;
    try {
      this.tpl = await this.api.get(`plan-templates/${this.f.plan_template}/`);
      this.tpl.roles.forEach((r: string) => this.f.roles[r] = null);
      if (!this.f.budget_hours) this.f.budget_hours = this.tpl.total_hours;
    } catch (e) { this.err = ZpApiService.error(e); }
  }
  n(v: any): string { return num(v); }
  tog(k: string, id: number): void { this.f[k] = this.f[k].includes(id) ? this.f[k].filter((x: number) => x !== id) : this.f[k].concat([id]); }
  async save(): Promise<void> {
    if (!this.f.title?.trim()) { this.err = 'Enter the project name.'; return; }
    if (!this.f.start_date || (!this.f.end_date && !this.f.plan_template)) { this.err = 'The expected start and end dates are required.'; return; }
    if (this.f.end_date && this.f.end_date < this.f.start_date) { this.err = 'The expected end date is before the start.'; return; }
    this.busy = true; this.err = '';
    try { this.saved.emit(await this.api.post('projects/', this.f)); } catch (e) { this.err = ZpApiService.error(e); }
    this.busy = false;
  }
}

/** Projects (v1.14.0): every project the user may see, with customer, health and milestone progress. */
@Component({
  selector: 'app-zp-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpProjectFormComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Projects</h1><p class="ex-desc">Implementation, customisation, migration, integration, infrastructure and consulting projects with milestones, changes, risks and profitability.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn primary" *ngIf="rights.project_edit" (click)="creating = true">+ New project</button></div>
      </div>
      <div class="zp-filters">
        <input type="search" [(ngModel)]="f.q" (ngModelChange)="soon()" placeholder="Search project…" aria-label="Search">
        <select [(ngModel)]="f.customer" (ngModelChange)="load()"><option value="">All customers</option><option *ngFor="let c of lk.customers" [value]="c.id">{{ c.name }}</option></select>
        <select [(ngModel)]="f.health" (ngModelChange)="load()"><option value="">Any health</option><option value="on_track">On track</option><option value="at_risk">At risk</option><option value="delayed">Delayed</option><option value="done">Done</option></select>
        <select [(ngModel)]="f.status" (ngModelChange)="load()"><option value="">Any status</option><option value="new,in_progress,on_hold">Open</option><option value="completed">Completed</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="zp-scroll"><table class="zp-table zl-zp">
        <tr><th>Project</th><th>Customer</th><th>Branch</th><th>Type</th><th>Dates</th><th>Milestones</th><th>Health</th><th class="r">Value</th></tr>
        <tr class="click" *ngFor="let p of rows" (click)="open(p.id)">
          <td><span class="zp-code" *ngIf="p.number">{{ p.number }}</span> <b>{{ p.title }}</b><div class="zp-muted">{{ mgr(p) }}</div></td>
          <td>{{ p.customer_name || 'Internal' }}</td><td>{{ p.branch_name }}</td><td>{{ p.project_type_label }}</td>
          <td>{{ d(p.start_date) }} – {{ d(p.end_date) || 'open' }}</td>
          <td style="min-width:120px"><div class="zp-meter ok"><div [style.width.%]="p.milestones_total ? p.milestones_accepted * 100 / p.milestones_total : 0"></div></div>
            <div class="zp-muted">{{ p.milestones_accepted }} / {{ p.milestones_total }} accepted{{ p.milestones_overdue ? ' · ' + p.milestones_overdue + ' late' : '' }}</div></td>
          <td><span class="zp-b" [ngClass]="'h-' + p.health">{{ hl[p.health] }}</span></td>
          <td class="r">{{ p.contract_value ? m(p.contract_value, p.currency) : '–' }}</td>
        </tr>
      </table></div>
      <p class="zp-empty" *ngIf="!rows.length">No projects.</p>
    </div>
  </div>
</div>
<app-zp-project-form *ngIf="creating" (closed)="creating = false" (saved)="creating = false; open($event.id)"></app-zp-project-form>`,
})
export class ZpProjectsComponent implements OnInit {
  rows: any[] = [];
  lk: any = { customers: [] };
  rights: any = {};
  f: any = { q: '', customer: '', health: '', status: 'new,in_progress,on_hold' };
  creating = false;
  msg = '';
  hl = HEALTH_LABEL;
  private timer: any;
  constructor(private api: ZpApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    this.rights = this.lk.rights || {};
    await this.load();
  }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }
  async load(): Promise<void> {
    try { this.rows = await this.api.get('projects/', this.f); this.msg = ''; } catch (e) { this.msg = ZpApiService.error(e); }
  }
  open(id: number): void { this.router.navigate([ZP_BASE, 'projects', id]); }
  mgr(p: any): string { return (p.managers || []).map((x: any) => x.name).join(', '); }
  d(v: any): string { return day(v); }
  m(v: any, c?: string): string { return money(v, c); }
}

/** One project (v1.14.0): overview, tasks, milestones (UAT sign-off and invoicing), change requests, risks and issues,
 *  costs and profitability, support tickets and development requests. */
@Component({
  selector: 'app-zp-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head" *ngIf="p">
        <div><button type="button" class="ex-btn sm" (click)="go(['projects'])">← Projects</button>
          <h1 class="page-title" style="margin-top:8px"><span class="zp-code" *ngIf="p.number">{{ p.number }}</span> {{ p.title }}</h1>
          <p class="ex-desc">{{ p.customer_name || 'Internal' }} · {{ p.project_type_label }} · {{ d(p.start_date) }} – {{ d(p.end_date) || 'open' }} ·
            <span class="zp-b" [ngClass]="'h-' + p.health">{{ hl[p.health] }}</span></p></div>
        <div class="ex-actions" *ngIf="p.can_manage">
          <select class="ex-btn" [(ngModel)]="p.status" (ngModelChange)="saveProject({ status: p.status })" aria-label="Project status">
            <option value="new">New</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>
      </div>
      <div class="ex-tabs" *ngIf="p">
        <button type="button" *ngFor="let t of tabs(); trackBy: byK" [class.on]="tab === t.k" (click)="tab = t.k">{{ t.l }}</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <ng-container *ngIf="p">

        <!-- overview -->
        <ng-container *ngIf="tab === 'overview'">
          <div class="ex-tiles">
            <div class="ex-tile"><div class="lbl">Tasks done</div><div class="num">{{ done() }} / {{ p.tasks.length }}</div><div class="amt">{{ late() }} overdue · {{ blocked() }} blocked</div></div>
            <div class="ex-tile t3"><div class="lbl">Milestones accepted</div><div class="num">{{ p.milestones_accepted }} / {{ p.milestones_total }}</div><div class="amt">{{ p.milestones_overdue }} late</div></div>
            <div class="ex-tile t2" *ngIf="p.profit"><div class="lbl">Hours used</div><div class="num" style="font-size:20px">{{ n(p.profit.actual_hours) }} / {{ n(p.profit.budget_hours) }}</div><div class="amt">{{ p.profit.hours_used_pct ?? '–' }}% of budget</div></div>
            <div class="ex-tile t4" *ngIf="p.profit"><div class="lbl">Expected margin</div><div class="num" style="font-size:20px" [style.color]="p.profit.expected_margin < 0 ? '#b42318' : null">{{ m(p.profit.expected_margin) }}</div><div class="amt">{{ p.profit.margin_pct ?? '–' }}%</div></div>
          </div>
          <div class="zp-split" style="margin-top:14px">
            <div class="zp-card">
              <h3>Scope and deliverables</h3>
              <ng-container *ngIf="!editOv">
                <div class="zp-section" style="margin-top:0">Scope</div><div style="white-space:pre-wrap;font-size:13.5px">{{ p.scope || '–' }}</div>
                <div class="zp-section">Deliverables</div><div style="white-space:pre-wrap;font-size:13.5px">{{ p.deliverables || '–' }}</div>
                <div class="zp-section">Description</div><div style="white-space:pre-wrap;font-size:13.5px">{{ p.description }}</div>
                <button type="button" class="ex-btn sm" style="margin-top:10px" *ngIf="p.can_manage" (click)="startOv()">Edit</button>
              </ng-container>
              <div class="ex-form" *ngIf="editOv">
                <label>Customer<select [(ngModel)]="ov.customer"><option [ngValue]="null">Internal</option><option *ngFor="let c of lk.customers" [ngValue]="c.id">{{ c.name }}</option></select></label>
                <label>Type<select [(ngModel)]="ov.project_type"><option *ngFor="let x of lk.project_types" [value]="x.value">{{ x.label }}</option></select></label>
                <label>Billing method<select [(ngModel)]="ov.billing_method"><option *ngFor="let x of lk.billing_methods" [value]="x.value">{{ x.label }}</option></select></label>
                <label>Contract ref.<input [(ngModel)]="ov.contract_ref"></label>
                <label>Expected start *<input type="date" [(ngModel)]="ov.start_date"></label>
                <label>Expected end *<input type="date" [(ngModel)]="ov.end_date" [min]="ov.start_date"></label>
                <label class="ck"><input type="checkbox" [(ngModel)]="ov.portal_visible"> Show in the customer portal</label>
                <label class="wide">Scope<textarea [(ngModel)]="ov.scope" rows="3"></textarea></label>
                <label class="wide">Deliverables<textarea [(ngModel)]="ov.deliverables" rows="2"></textarea></label>
                <ng-container *ngIf="p.can_edit_finance">
                  <label>Project value<input type="number" min="0" [(ngModel)]="ov.contract_value"></label>
                  <label>Budgeted hours<input type="number" min="0" [(ngModel)]="ov.budget_hours"></label>
                  <label>Cost budget<input type="number" min="0" [(ngModel)]="ov.budget_amount"></label>
                  <label>Bill rate / h (T&amp;M)<input type="number" min="0" [(ngModel)]="ov.default_bill_rate"></label>
                  <label>Invoiced outside milestones<input type="number" min="0" [(ngModel)]="ov.invoiced_amount"></label>
                </ng-container>
                <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Team members</div>
                  <div class="zp-multi"><label *ngFor="let e of lk.employees"><input type="checkbox" [checked]="ov.members.includes(e.id)" (change)="tog(ov.members, e.id)"> {{ e.name }}</label></div></div>
                <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveOv()">Save</button><button type="button" class="ex-btn" (click)="editOv = false">Cancel</button></div>
              </div>
            </div>
            <div class="zp-side">
              <div class="zp-card"><h3>Project</h3>
                <dl class="zp-kv"><dt>Customer</dt><dd>{{ p.customer_name || 'Internal' }}</dd><dt>Reference</dt><dd>{{ p.contract_ref || '–' }}</dd>
                  <dt>Billing</dt><dd>{{ bm(p.billing_method) }}</dd><dt>Value</dt><dd>{{ p.contract_value ? m(p.contract_value) : '–' }}</dd>
                  <dt>Managers</dt><dd>{{ names(p.managers) || '–' }}</dd><dt>Team</dt><dd>{{ names(p.members) || '–' }}</dd>
                  <dt>Portal</dt><dd>{{ p.portal_visible ? 'Shown to the customer' : 'Hidden' }}</dd></dl></div>
              <div class="zp-card" *ngIf="openRisks().length"><h3>Open risks and issues</h3>
                <div class="zp-ev" *ngFor="let r of openRisks(); trackBy: byId"><div class="t"><b>{{ r.kind === 'issue' ? 'Issue' : 'Risk' }}:</b> {{ r.title }}</div><div class="m">{{ r.impact }}</div></div></div>
            </div>
          </div>
        </ng-container>

        <!-- tasks -->
        <ng-container *ngIf="tab === 'tasks'">
          <div class="zp-acts" style="margin-bottom:10px">
            <button type="button" class="ex-btn primary" *ngIf="p.can_manage" (click)="newTask()">+ Task</button>
            <button type="button" class="ex-btn" *ngIf="p.can_manage" (click)="startApply()">Apply plan template</button>
            <button type="button" class="ex-btn" *ngIf="p.can_manage && p.tasks.length" (click)="saveT = { name: p.title + ' plan' }">Save as template</button>
            <span style="flex:1"></span>
            <span class="zp-muted" *ngIf="p.plan_template_name">From template: {{ p.plan_template_name }}</span>
            <button type="button" class="ex-btn" (click)="planXls()" [disabled]="!p.tasks.length">Excel</button>
            <button type="button" class="ex-btn" (click)="planPdf()" [disabled]="!p.tasks.length">PDF</button>
          </div>
          <div class="zp-card" *ngIf="applyT" style="margin-bottom:14px">
            <h3>Apply a plan template</h3>
            <div class="ex-form">
              <label>Template<select [(ngModel)]="applyT.template" (ngModelChange)="loadApplyTpl()"><option [ngValue]="null">–</option>
                <option *ngFor="let t of applyList" [ngValue]="t.id">{{ t.name }}{{ t.product_name ? ' · ' + t.product_name : '' }}</option></select></label>
              <label>Start the plan on<input type="date" [(ngModel)]="applyT.start_date"></label>
              <ng-container *ngIf="applyT.tpl">
                <p class="wide zp-muted" style="margin:0">{{ applyT.tpl.line_count }} tasks, {{ n(applyT.tpl.total_hours) }} h, {{ applyT.tpl.total_days }} working days. They are added to the tasks already in the project.</p>
                <label *ngFor="let r of applyT.tpl.roles">{{ r }} →<select [(ngModel)]="applyT.roles[r]"><option [ngValue]="null">assign later</option>
                  <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
              </ng-container>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="applyTpl()" [disabled]="!applyT.template">Add the tasks</button>
                <button type="button" class="ex-btn" (click)="applyT = null">Cancel</button></div>
            </div>
          </div>
          <div class="zp-card" *ngIf="saveT" style="margin-bottom:14px">
            <h3>Save this plan as a template</h3>
            <div class="ex-form">
              <label class="wide">Template name *<input [(ngModel)]="saveT.name"></label>
              <p class="wide zp-muted" style="margin:0">Tasks, phases, working-day timing, planned hours and milestones (as % of the value) are saved. Roles can be added in Plan templates.</p>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveTpl()">Save template</button><button type="button" class="ex-btn" (click)="saveT = null">Cancel</button></div>
            </div>
          </div>
          <div class="zp-card" *ngIf="tk" style="margin-bottom:14px">
            <h3>{{ tk.id ? 'Edit task' : tk.parent_task_id ? 'New sub-task' : 'New task' }}</h3>
            <div class="ex-form">
              <label class="wide">Task *<input [(ngModel)]="tk.title"></label>
              <label>Stage<select [(ngModel)]="tk.stage"><option *ngFor="let s of p.stages" [ngValue]="s.id">{{ s.title }}</option></select></label>
              <label>Phase<input [(ngModel)]="tk.phase" list="zp-phases"><datalist id="zp-phases"><option *ngFor="let x of phases" [value]="x"></option></datalist></label>
              <label>Priority<select [(ngModel)]="tk.priority"><option *ngFor="let x of lk.priorities" [value]="x.value">{{ x.label }}</option></select></label>
              <label>Estimated hours<input type="number" min="0" [(ngModel)]="tk.estimated_hours"></label>
              <label>Expected start *<input type="date" [(ngModel)]="tk.start_date" [min]="parentOf(tk)?.start_date || ''" [max]="parentOf(tk)?.end_date || ''"></label>
              <label>Expected end *<input type="date" [(ngModel)]="tk.end_date" [min]="tk.start_date || parentOf(tk)?.start_date || ''" [max]="parentOf(tk)?.end_date || ''"></label>
              <p class="wide zp-muted" style="margin:0" *ngIf="parentOf(tk) as pt">Sub-task of <b>{{ pt.title }}</b> – dates within {{ d(pt.start_date) }} – {{ d(pt.end_date) }}.</p>
              <label>Reviewer<select [(ngModel)]="tk.reviewer"><option [ngValue]="null">–</option><option *ngFor="let e of team(); trackBy: byId" [ngValue]="e.id">{{ e.name }}</option></select></label>
              <label>Milestone<select [(ngModel)]="tk.milestone"><option [ngValue]="null">–</option><option *ngFor="let ms of p.milestones" [ngValue]="ms.id">{{ ms.name }}</option></select></label>
              <label *ngIf="!tk.subtask_count">Sub-task of<select [(ngModel)]="tk.parent_task_id"><option [ngValue]="null">– (main task)</option><option *ngFor="let t of mainTasks(); trackBy: byId" [ngValue]="t.id">{{ t.title }}</option></select></label>
              <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Assigned to</div>
                <div class="zp-multi"><label *ngFor="let e of lk.employees"><input type="checkbox" [checked]="tk.members.includes(e.id)" (change)="tog(tk.members, e.id)"> {{ e.name }}</label></div></div>
              <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Depends on</div>
                <div class="zp-multi"><label *ngFor="let t of otherTasks(); trackBy: byId"><input type="checkbox" [checked]="tk.depends_on.includes(t.id)" (change)="tog(tk.depends_on, t.id)"> {{ t.title }}</label></div></div>
              <label class="wide">Description<textarea [(ngModel)]="tk.description" rows="2"></textarea></label>
              <label class="wide">Acceptance criteria<textarea [(ngModel)]="tk.acceptance_criteria" rows="2"></textarea></label>
              <label class="ck wide"><input type="checkbox" [(ngModel)]="tk.customer_approval"> The customer must approve this task (portal)</label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveTask()">Save task</button><button type="button" class="ex-btn" (click)="tk = null">Cancel</button></div>
            </div>
          </div>
          <div class="zp-scroll"><table class="zp-table" zPlain>
            <tr><th>Task</th><th>Stage / phase</th><th>People</th><th>Dates</th><th style="min-width:160px">Timeline</th><th class="r">Hours</th><th>Progress</th><th>Status</th><th></th></tr>
            <tr *ngFor="let t of orderedTasks(); trackBy: byId">
              <td [style.padding-left.px]="t.parent_task_id ? 26 : 8"><b>{{ t.title }}</b> <span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority }}</span>
                <span class="zp-b st-bad" *ngIf="t.blocked">blocked</span><span class="zp-b st-wait" *ngIf="t.customer_approval && !t.customer_approved_at">needs customer OK</span>
                <span class="zp-b st-done" *ngIf="t.customer_approved_at">customer OK</span>
                <div class="zp-muted" *ngIf="t.acceptance_criteria">✓ {{ t.acceptance_criteria }}</div><div class="zp-muted" *ngIf="t.blockers">⚠ {{ t.blockers }}</div>
                <div class="zp-muted" *ngIf="t.subtask_count">{{ t.subtask_count }} sub-task(s)</div></td>
              <td>{{ t.stage }}<div class="zp-muted">{{ t.phase }}</div></td>
              <td>{{ names(t.members) || '–' }}<div class="zp-muted" *ngIf="t.reviewer">review: {{ t.reviewer.name }}</div></td>
              <td [style.color]="t.overdue ? '#b42318' : null" style="white-space:nowrap">{{ d(t.start_date) }}<br>{{ d(t.end_date) }}<div *ngIf="t.overdue" style="font-weight:600">overdue</div>
                <div class="zp-muted" *ngIf="t.actual_start" style="color:#475569">actual {{ d(t.actual_start) }}{{ t.actual_end ? ' – ' + d(t.actual_end) : ' – …' }}</div></td>
              <td><div class="zp-gantt" [title]="d(t.start_date) + ' – ' + d(t.end_date)"><div [style.left.%]="bar(t).l" [style.width.%]="bar(t).w"
                [style.background]="t.status === 'completed' ? '#10b981' : t.overdue ? '#ef4444' : '#818cf8'"></div></div></td>
              <td class="r">{{ n(t.actual_hours) }} / {{ n(t.planned_hours) }}</td>
              <td style="min-width:90px"><div class="zp-meter ok"><div [style.width.%]="t.progress"></div></div><div class="zp-muted">{{ t.progress }}%</div></td>
              <td><select [ngModel]="t.status" (ngModelChange)="taskSet(t, { status: $event })" style="height:28px;border:1px solid #dcdfea;border-radius:6px;font:inherit;font-size:12px">
                <option value="to_do">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></td>
              <td class="r" style="white-space:nowrap"><div class="zp-acts" style="justify-content:flex-end;flex-wrap:nowrap">
                <button type="button" class="ex-btn sm" (click)="progress(t)">%</button>
                <button type="button" class="ex-btn sm" (click)="openFiles(t)" [title]="'Attachments of ' + t.title">📎 {{ t.file_count || '' }}</button>
                <button type="button" class="ex-btn sm" *ngIf="p.can_manage && !t.parent_task_id" (click)="newTask(t)" title="Add a sub-task">+ Sub</button>
                <button type="button" class="ex-btn sm" *ngIf="p.can_manage" (click)="editTask(t)">Edit</button>
                <button type="button" class="ex-btn sm danger" *ngIf="p.can_manage && !Number(t.actual_hours)" (click)="delTask(t)" aria-label="Delete task">×</button></div></td>
            </tr>
          </table></div>
          <p class="zp-empty" *ngIf="!p.tasks.length">No tasks yet.</p>
        </ng-container>

        <!-- milestones -->
        <ng-container *ngIf="tab === 'milestones'">
          <div class="zp-acts" style="margin-bottom:10px" *ngIf="p.can_manage && !ms"><button type="button" class="ex-btn primary" (click)="ms = { name: '', planned_date: '', amount: 0, description: '', depends_on: null }">+ Milestone</button></div>
          <div class="zp-card" *ngIf="ms" style="margin-bottom:14px"><h3>{{ ms.id ? 'Edit milestone' : 'New milestone' }}</h3>
            <div class="ex-form">
              <label>Name *<input [(ngModel)]="ms.name"></label><label>Planned date<input type="date" [(ngModel)]="ms.planned_date"></label>
              <label>Amount to invoice<input type="number" min="0" [(ngModel)]="ms.amount"></label>
              <label>After milestone<select [(ngModel)]="ms.depends_on"><option [ngValue]="null">–</option><option *ngFor="let x of p.milestones" [ngValue]="x.id" [disabled]="x.id === ms.id">{{ x.name }}</option></select></label>
              <label class="wide">Deliverable / acceptance<textarea [(ngModel)]="ms.description" rows="2"></textarea></label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveMs()">Save</button><button type="button" class="ex-btn" (click)="ms = null">Cancel</button></div>
            </div></div>
          <div class="zp-scroll"><table class="zp-table" zPlain>
            <tr><th>#</th><th>Milestone</th><th>Planned</th><th class="r">Amount</th><th>Status</th><th>Accepted</th><th>Invoice</th><th></th></tr>
            <tr *ngFor="let x of p.milestones">
              <td>{{ x.sequence }}</td><td><b>{{ x.name }}</b><div class="zp-muted">{{ x.description }}</div></td>
              <td [style.color]="x.overdue ? '#b42318' : null">{{ d(x.planned_date) }}</td><td class="r">{{ x.amount ? m(x.amount) : '–' }}</td>
              <td><span class="ex-tag" [class.approved]="x.status === 'accepted'" [class.pending]="x.status === 'ready'" [class.rejected]="x.status === 'rejected'">{{ x.status_label }}</span></td>
              <td>{{ x.accepted_by }}<div class="zp-muted">{{ w(x.accepted_at) }}{{ x.acceptance_note ? ' · ' + x.acceptance_note : '' }}</div></td>
              <td>{{ x.invoice_status_label }}<div class="zp-muted">{{ x.invoice_no }}</div></td>
              <td class="r"><div class="zp-acts" style="justify-content:flex-end" *ngIf="p.can_manage">
                <button type="button" class="ex-btn sm" *ngIf="x.status === 'planned' || x.status === 'rejected'" (click)="msStatus(x, 'in_progress')">Start</button>
                <button type="button" class="ex-btn sm primary" *ngIf="x.status === 'in_progress' || x.status === 'planned' || x.status === 'rejected'" (click)="msStatus(x, 'ready')">Ready for customer</button>
                <button type="button" class="ex-btn sm green" *ngIf="x.status === 'ready'" (click)="msAcceptManual(x)">Record acceptance</button>
                <button type="button" class="ex-btn sm" *ngIf="x.status !== 'accepted'" (click)="ms = { id: x.id, name: x.name, planned_date: x.planned_date, amount: x.amount, description: x.description, depends_on: x.depends_on }">Edit</button>
              </div></td>
            </tr>
          </table></div>
          <p class="zp-empty" *ngIf="!p.milestones.length">No milestones yet.</p>
          <p class="zp-muted" style="margin-top:8px">"Ready for customer" e-mails the approving contacts; they accept or reject it in the portal (UAT sign-off). Accepted milestones with an amount go to Billing.</p>
        </ng-container>

        <!-- change requests -->
        <ng-container *ngIf="tab === 'changes'">
          <div class="zp-acts" style="margin-bottom:10px" *ngIf="(p.can_manage || p.is_member) && !cr"><button type="button" class="ex-btn primary" (click)="cr = { title: '', description: '', extra_hours: 0, extra_amount: 0, extra_days: 0 }">+ Change request</button></div>
          <div class="zp-card" *ngIf="cr" style="margin-bottom:14px"><h3>New change request</h3>
            <div class="ex-form">
              <label class="wide">Title *<input [(ngModel)]="cr.title"></label>
              <label class="wide">What changes and why<textarea [(ngModel)]="cr.description" rows="3"></textarea></label>
              <label>Extra hours<input type="number" min="0" [(ngModel)]="cr.extra_hours"></label><label>Extra amount<input type="number" min="0" [(ngModel)]="cr.extra_amount"></label>
              <label>Extra days on the plan<input type="number" min="0" [(ngModel)]="cr.extra_days"></label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveCr()">Send for approval</button><button type="button" class="ex-btn" (click)="cr = null">Cancel</button></div>
            </div></div>
          <div class="ex-rows">
            <div class="ex-row" *ngFor="let c of p.change_requests">
              <div class="main"><div class="t"><span class="zp-code">{{ c.number }}</span> {{ c.title }}</div>
                <div class="s">+{{ n(c.extra_hours) }} h · +{{ m(c.extra_amount) }} · +{{ c.extra_days }} days · by {{ c.requested_by }} {{ w(c.requested_at) }}</div>
                <div class="s" *ngIf="c.decision_note">{{ c.decision_note }}</div><div class="s" *ngIf="c.customer_decision_by">Customer: {{ c.customer_decision_by }}</div></div>
              <div class="r"><span class="ex-tag" [class.pending]="c.status === 'submitted' || c.status === 'approved'" [class.approved]="c.status === 'customer_approved' || c.status === 'done'" [class.rejected]="c.status === 'rejected'">{{ c.status_label }}</span>
                <div class="zp-acts" style="margin-top:6px;justify-content:flex-end">
                  <ng-container *ngIf="c.status === 'submitted' && p.can_approve_cr"><button type="button" class="ex-btn sm green" (click)="crDecide(c, 'internal', true)">Approve</button><button type="button" class="ex-btn sm danger" (click)="crDecide(c, 'internal', false)">Reject</button></ng-container>
                  <button type="button" class="ex-btn sm" *ngIf="c.status === 'approved' && p.can_manage" (click)="crDecide(c, 'customer', true)">Record customer OK</button>
                  <button type="button" class="ex-btn sm" *ngIf="c.status === 'customer_approved' && p.can_manage" (click)="crDecide(c, 'done', true)">Done</button>
                </div></div>
            </div>
          </div>
          <p class="zp-empty" *ngIf="!p.change_requests.length">No change requests.</p>
        </ng-container>

        <!-- risks -->
        <ng-container *ngIf="tab === 'risks'">
          <div class="zp-acts" style="margin-bottom:10px" *ngIf="(p.can_manage || p.is_member) && !rk"><button type="button" class="ex-btn primary" (click)="rk = { kind: 'risk', title: '', description: '', impact: 'medium', probability: 'medium', owner: null, due_date: '', mitigation: '' }">+ Risk / issue</button></div>
          <div class="zp-card" *ngIf="rk" style="margin-bottom:14px"><h3>{{ rk.id ? 'Edit' : 'New' }} risk / issue</h3>
            <div class="ex-form">
              <label>Kind<select [(ngModel)]="rk.kind"><option value="risk">Risk</option><option value="issue">Issue</option></select></label>
              <label>Title *<input [(ngModel)]="rk.title"></label>
              <label>Impact<select [(ngModel)]="rk.impact"><option *ngFor="let x of lk.levels" [value]="x.value">{{ x.label }}</option></select></label>
              <label>Probability<select [(ngModel)]="rk.probability"><option *ngFor="let x of lk.levels" [value]="x.value">{{ x.label }}</option></select></label>
              <label>Owner<select [(ngModel)]="rk.owner"><option [ngValue]="null">–</option><option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
              <label>Due<input type="date" [(ngModel)]="rk.due_date"></label>
              <label *ngIf="rk.id">Status<select [(ngModel)]="rk.status"><option *ngFor="let x of lk.risk_status" [value]="x.value">{{ x.label }}</option></select></label>
              <label class="wide">Description<textarea [(ngModel)]="rk.description" rows="2"></textarea></label>
              <label class="wide">Mitigation / action<textarea [(ngModel)]="rk.mitigation" rows="2"></textarea></label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveRisk()">Save</button><button type="button" class="ex-btn" (click)="rk = null">Cancel</button></div>
            </div></div>
          <div class="zp-scroll"><table class="zp-table" zPlain>
            <tr><th>Kind</th><th>Title</th><th>Impact / probability</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr>
            <tr *ngFor="let r of p.risks"><td>{{ r.kind === 'issue' ? 'Issue' : 'Risk' }}</td><td><b>{{ r.title }}</b><div class="zp-muted">{{ r.mitigation }}</div></td>
              <td><span class="zp-b" [class.pr-critical]="r.impact === 'high'">{{ r.impact }}</span> / {{ r.probability }}</td><td>{{ r.owner?.name || '–' }}</td><td>{{ d(r.due_date) }}</td><td>{{ r.status }}</td>
              <td class="r"><button type="button" class="ex-btn sm" (click)="rk = { id: r.id, kind: r.kind, title: r.title, description: r.description, impact: r.impact, probability: r.probability, owner: r.owner?.id || null, due_date: r.due_date, mitigation: r.mitigation, status: r.status }">Edit</button></td></tr>
          </table></div>
          <p class="zp-empty" *ngIf="!p.risks.length">No risks or issues logged.</p>
        </ng-container>

        <!-- profitability -->
        <ng-container *ngIf="tab === 'profit' && p.profit">
          <div class="ex-tiles">
            <div class="ex-tile"><div class="lbl">Revenue</div><div class="num" style="font-size:20px">{{ m(p.profit.revenue) }}</div><div class="amt">value {{ m(p.profit.contract_value) }} + changes {{ m(p.profit.change_request_revenue) }}</div></div>
            <div class="ex-tile t3"><div class="lbl">Invoiced / paid</div><div class="num" style="font-size:20px">{{ m(p.profit.invoiced) }}</div><div class="amt">paid {{ m(p.profit.paid) }} · to invoice {{ m(p.profit.to_invoice) }}</div></div>
            <div class="ex-tile t2"><div class="lbl">Cost so far</div><div class="num" style="font-size:20px">{{ m(p.profit.employee_cost + p.profit.expenses) }}</div><div class="amt">people {{ m(p.profit.employee_cost) }} · other {{ m(p.profit.expenses) }}</div></div>
            <div class="ex-tile t4"><div class="lbl">Expected margin</div><div class="num" style="font-size:20px" [style.color]="p.profit.expected_margin < 0 ? '#b42318' : null">{{ m(p.profit.expected_margin) }}</div><div class="amt">after {{ m(p.profit.estimate_to_complete) }} to complete</div></div>
          </div>
          <div class="ex-grid2">
            <div class="ex-panel"><div class="ex-h">Hours</div>
              <div class="zp-meter" [ngClass]="(p.profit.hours_used_pct || 0) > 100 ? 'bad' : (p.profit.hours_used_pct || 0) > 85 ? 'warn' : 'ok'"><div [style.width.%]="cap(p.profit.hours_used_pct)"></div></div>
              <p class="zp-muted">{{ n(p.profit.actual_hours) }} of {{ n(p.profit.budget_hours) }} budgeted hours · {{ n(p.profit.remaining_hours) }} left · {{ n(p.profit.billable_hours) }} billable</p>
              <ng-container *ngIf="p.profit.budget_amount > 0">
                <div class="ex-h" style="margin-top:10px">Cost budget</div>
                <div class="zp-meter" [ngClass]="(p.profit.budget_used_pct || 0) > 100 ? 'bad' : (p.profit.budget_used_pct || 0) > 85 ? 'warn' : 'ok'"><div [style.width.%]="cap(p.profit.budget_used_pct)"></div></div>
                <p class="zp-muted">People cost {{ m(p.profit.employee_cost) }} of {{ m(p.profit.budget_amount) }} · {{ p.profit.budget_used_pct ?? '–' }}% used</p>
              </ng-container>
              <div class="ex-h" style="margin-top:10px">By person</div>
              <div class="zp-hbar" *ngFor="let e of p.profit.by_employee"><span class="l">{{ e.employee }}</span><div class="zp-meter"><div [style.width.%]="pctOf(e.hours, p.profit.actual_hours)"></div></div><span class="n">{{ n(e.hours) }}</span></div>
            </div>
            <div class="ex-panel"><div class="ex-h">Third-party and other costs</div>
              <div class="ex-rows"><div class="ex-row" *ngFor="let x of p.expenses"><div class="main"><div class="t">{{ x.description }}</div><div class="s">{{ d(x.date) }} · {{ x.category_label }} · {{ x.vendor }}</div></div>
                <div class="r"><b>{{ m(x.amount) }}</b><button type="button" class="ex-btn sm danger" *ngIf="p.can_manage || p.can_edit_finance" (click)="delExp(x)">×</button></div></div></div>
              <div class="ex-form" style="margin-top:10px" *ngIf="p.can_manage || p.can_edit_finance">
                <label>Description<input [(ngModel)]="ex.description"></label><label>Amount<input type="number" min="0" [(ngModel)]="ex.amount"></label>
                <label>Category<select [(ngModel)]="ex.category"><option *ngFor="let x of lk.expense_categories" [value]="x.value">{{ x.label }}</option></select></label>
                <label>Vendor<input [(ngModel)]="ex.vendor"></label>
                <div class="wide"><button type="button" class="ex-btn" (click)="addExp()">+ Add cost</button></div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- v1.17.0 HSE (from the HSE app, figures only) -->
        <ng-container *ngIf="tab === 'hse' && hse">
          <div class="ex-tiles">
            <div class="ex-tile"><div class="lbl">Days since lost-time injury</div><div class="num">{{ hse.days_since_lti ?? '–' }}</div><div class="amt">{{ hse.lti_year }} LTI this year</div></div>
            <div class="ex-tile t2"><div class="lbl">Incidents this year</div><div class="num">{{ hse.incidents_year }}</div><div class="amt">{{ hse.recordable_year }} recordable · {{ hse.near_misses_year }} near misses</div></div>
            <div class="ex-tile t3"><div class="lbl">Open incidents</div><div class="num" [style.color]="hse.high_potential_open ? '#b42318' : null">{{ hse.open_incidents }}</div><div class="amt">{{ hse.high_potential_open }} high potential</div></div>
            <div class="ex-tile t4"><div class="lbl">Corrective actions</div><div class="num" [style.color]="hse.overdue_actions ? '#b42318' : null">{{ hse.overdue_actions }}</div><div class="amt">overdue of {{ hse.open_actions }} open</div></div>
          </div>
          <div class="ex-grid2">
            <div class="ex-panel"><div class="ex-h">Recent incidents</div>
              <div class="ex-rows"><div class="ex-row" *ngFor="let x of hse.recent_incidents" [class.click]="hse.hse_staff" (click)="hse.hse_staff && openHse(['incidents', x.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ x.number }}</span> {{ x.title }}</div><div class="s">{{ d(x.date) }}{{ x.category ? ' · ' + x.category : '' }}</div></div>
                <div class="r"><span class="zp-b" [class.pr-critical]="x.high_potential">{{ x.high_potential ? 'High potential' : x.status }}</span></div></div></div>
              <p class="zp-empty" *ngIf="!hse.recent_incidents.length">No incidents on this project's sites.</p></div>
            <div class="ex-panel"><div class="ex-h">Work under permit ({{ hse.live_permits }} live{{ hse.suspended_permits ? ', ' + hse.suspended_permits + ' stopped' : '' }})</div>
              <div class="ex-rows"><div class="ex-row" *ngFor="let x of hse.live_permit_list" [class.click]="hse.hse_staff" (click)="hse.hse_staff && openHse(['permits', x.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ x.number }}</span> {{ x.type }}</div><div class="s">{{ x.site }} · until {{ w(x.valid_to) }}</div></div></div></div>
              <p class="zp-empty" *ngIf="!hse.live_permit_list.length">No live permits.</p>
              <div class="ex-h" style="margin-top:12px">Last inspection</div>
              <p class="zp-muted">{{ hse.last_inspection ? hse.last_inspection.number + ' · ' + d(hse.last_inspection.date) + ' · score ' + hse.last_inspection.score + '%' : 'None yet' }}</p>
              <p class="zp-muted">Sites: {{ siteNames() || 'none – link a site to this project in HSE set-up' }}</p></div>
          </div>
          <p class="zp-muted" style="margin-top:8px">From ZEO HSE. Names of injured people and health details are never shown here.</p>
        </ng-container>

        <!-- support -->
        <ng-container *ngIf="tab === 'support'">
          <div class="ex-grid2">
            <div class="ex-panel"><div class="ex-h">Tickets</div>
              <div class="ex-rows"><div class="ex-row click" *ngFor="let t of p.tickets" (click)="go(['tickets', t.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</div><div class="s">{{ t.customer_name }}</div></div>
                <div class="r"><span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span></div></div></div>
              <p class="zp-empty" *ngIf="!p.tickets.length">No tickets linked.</p></div>
            <div class="ex-panel"><div class="ex-h">Development requests</div>
              <div class="ex-rows"><div class="ex-row click" *ngFor="let x of p.dev_requests" (click)="go(['dev-requests', x.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ x.number }}</span> {{ x.title }}</div><div class="s">{{ x.ticket_number }}</div></div>
                <div class="r"><span class="ex-tag">{{ x.status_label }}</span></div></div></div>
              <p class="zp-empty" *ngIf="!p.dev_requests.length">None.</p></div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  </div>
<div class="ex-back" *ngIf="ft" (click)="ft = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(680px,100%)">
    <header><h2>Attachments – {{ ft.task.title }}</h2><button type="button" (click)="ft = null" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-note err" *ngIf="ft.err">{{ ft.err }}</p>
      <div class="ex-rows">
        <div class="ex-row" *ngFor="let x of ft.files">
          <div class="main"><div class="t">📎 {{ x.name }}</div><div class="s">{{ size(x.size) }} · {{ x.uploaded_by }} · {{ w(x.uploaded_at) }}{{ x.note ? ' · ' + x.note : '' }}</div></div>
          <div class="r"><button type="button" class="ex-btn sm" (click)="getFile(x)">Download</button>
            <button type="button" class="ex-btn sm danger" (click)="removeFile(x)" aria-label="Remove file">×</button></div>
        </div>
        <p class="zp-empty" *ngIf="!ft.files.length">No files on this task yet.</p>
      </div>
      <div class="ex-form" style="margin-top:12px">
        <label class="wide">Files (20 MB each)<input type="file" multiple (change)="pick($any($event.target).files)"></label>
        <label class="wide">Note<input [(ngModel)]="ft.note" placeholder="e.g. signed SRS, data template, test evidence"></label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="ft = null">Close</button>
      <button type="button" class="ex-btn primary" (click)="upload()" [disabled]="ft.busy">Upload</button></footer>
  </div>
</div>
</div>`,
})
export class ZpProjectComponent implements OnInit {
  p: any = null;
  lk: any = { customers: [], project_types: [], billing_methods: [], employees: [], priorities: [], levels: [], risk_status: [], expense_categories: [] };
  tab = 'overview';
  hse: any = null;   // v1.17.0 HSE tab (null when HSE is not installed / not linked)
  byK = (_: number, x: any) => x.k;   // stable rows: the lists are rebuilt on every check, so clicks need a trackBy
  byId = (_: number, x: any) => x.id;
  msg = '';
  editOv = false;
  ov: any = {};
  tk: any = null;
  applyT: any = null;
  ft: any = null;
  applyList: any[] = [];
  saveT: any = null;
  Number = Number;
  ms: any = null;
  cr: any = null;
  rk: any = null;
  ex: any = { description: '', amount: null, category: 'third_party', vendor: '' };
  phases = ['Analysis', 'Configuration', 'Development', 'Migration', 'Testing', 'Deployment'];
  hl = HEALTH_LABEL;
  pc = PRIORITY_CLASS;
  sc = STAGE_CLASS;
  constructor(private api: ZpApiService, private route: ActivatedRoute, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    this.route.paramMap.subscribe(() => this.load());
  }
  async load(): Promise<void> {
    try { this.p = await this.api.get(`projects/${this.route.snapshot.paramMap.get('id')}/`); this.msg = ''; } catch (e) { this.msg = ZpApiService.error(e); }
    this.hse = this.p ? await this.api.hse(this.p.id) : null;
  }
  private async run(fn: () => Promise<any>): Promise<boolean> {
    try { await fn(); await this.load(); return true; } catch (e) { this.msg = ZpApiService.error(e); return false; }
  }
  tabs(): any[] {
    const t = [{ k: 'overview', l: 'Overview' }, { k: 'tasks', l: `Tasks (${this.p.tasks.length})` }, { k: 'milestones', l: `Milestones (${this.p.milestones.length})` },
               { k: 'changes', l: `Change requests (${this.p.change_requests.length})` }, { k: 'risks', l: `Risks & issues (${this.p.risks.length})` }];
    if (this.p.profit) t.push({ k: 'profit', l: 'Profitability' });
    if (this.hse) t.push({ k: 'hse', l: this.hse.open_incidents ? `HSE (${this.hse.open_incidents})` : 'HSE' });
    t.push({ k: 'support', l: 'Support' });
    return t;
  }
  siteNames(): string { return (this.hse?.sites || []).map((s: any) => s.name).join(', '); }
  openHse(path: any[]): void { this.router.navigate(['/main-sidebar/zeo-hse', ...path]); }
  saveProject(data: any): Promise<boolean> { return this.run(() => this.api.patch(`projects/${this.p.id}/`, data)); }
  startOv(): void {
    const f = this.p.finance || {};
    this.ov = { customer: this.p.customer, project_type: this.p.project_type, billing_method: this.p.billing_method, contract_ref: this.p.contract_ref,
                start_date: this.p.start_date, end_date: this.p.end_date, portal_visible: this.p.portal_visible, scope: this.p.scope, deliverables: this.p.deliverables,
                members: (this.p.members || []).map((m: any) => m.id) };
    if (this.p.can_edit_finance) Object.assign(this.ov, { contract_value: f.contract_value, budget_hours: f.budget_hours, budget_amount: f.budget_amount,
                                                           default_bill_rate: f.default_bill_rate, invoiced_amount: this.p.invoiced_amount });
    this.editOv = true;
  }
  async saveOv(): Promise<void> { if (await this.saveProject(this.ov)) this.editOv = false; }

  // ---- v1.15.0 plan: templates, timeline, export, delete
  async startApply(): Promise<void> {
    this.applyT = { template: null, start_date: this.p.start_date || today(), roles: {}, tpl: null };
    try { this.applyList = await this.api.get('plan-templates/', { product: this.p.product }); } catch (e) { this.msg = ZpApiService.error(e); }
  }
  async loadApplyTpl(): Promise<void> {
    this.applyT.tpl = null; this.applyT.roles = {};
    if (!this.applyT.template) return;
    this.applyT.tpl = await this.api.get(`plan-templates/${this.applyT.template}/`);
    this.applyT.tpl.roles.forEach((r: string) => this.applyT.roles[r] = null);
  }
  async applyTpl(): Promise<void> {
    const a = this.applyT;
    if (await this.run(() => this.api.post(`projects/${this.p.id}/apply-template/`, { template: a.template, start_date: a.start_date, roles: a.roles }))) this.applyT = null;
  }
  async saveTpl(): Promise<void> {
    if (!this.saveT.name?.trim()) { this.msg = 'Give the template a name.'; return; }
    if (await this.run(() => this.api.post(`projects/${this.p.id}/save-template/`, { name: this.saveT.name }))) { this.saveT = null; this.msg = ''; await this.api.lookups(true); }
  }
  async delTask(t: any): Promise<void> {
    if (!confirm(`Delete the task "${t.title}"?`)) return;
    await this.run(() => this.api.delete(`tasks/${t.id}/delete/`));
  }
  private range(): [number, number] {
    const ds: number[] = [];
    this.p.tasks.forEach((t: any) => { if (t.start_date) ds.push(Date.parse(t.start_date)); if (t.end_date) ds.push(Date.parse(t.end_date)); });
    if (this.p.start_date) ds.push(Date.parse(this.p.start_date));
    if (this.p.end_date) ds.push(Date.parse(this.p.end_date));
    return ds.length ? [Math.min(...ds), Math.max(...ds) + 86400000] : [0, 1];
  }
  bar(t: any): { l: number; w: number } {
    if (!t.start_date && !t.end_date) return { l: 0, w: 0 };
    const [a, b] = this.range();
    const s = Date.parse(t.start_date || t.end_date), e = Date.parse(t.end_date || t.start_date) + 86400000;
    return { l: Math.max(0, (s - a) * 100 / (b - a)), w: Math.max(1.5, (e - s) * 100 / (b - a)) };
  }
  private planRows(): string[][] {
    return this.orderedTasks().map((t: any) => [t.phase || t.stage || '', (t.parent_task_id ? '   ' : '') + t.title, this.names(t.members),
      t.start_date || '', t.end_date || '', t.actual_start || '', t.actual_end || '', String(t.planned_hours ?? ''), String(t.actual_hours ?? ''), `${t.progress}%`,
      t.status === 'completed' ? 'Completed' : t.overdue ? 'Overdue' : t.status === 'in_progress' ? 'In progress' : 'To do']);
  }
  private planHeads = ['Phase', 'Task', 'Assigned to', 'Expected start', 'Expected end', 'Actual start', 'Actual end', 'Planned h', 'Actual h', 'Progress', 'Status'];
  planXls(): void {
    exportExcel(`Project plan ${this.p.title}`, this.planHeads, this.planRows(),
      [{ name: 'Milestones', rows: [['Milestone', 'Planned', 'Amount', 'Status'], ...this.p.milestones.map((m: any) => [m.name, m.planned_date || '', m.amount, m.status_label])] }]);
  }
  planPdf(): void {
    exportPdf(`Project plan – ${this.p.title}`, this.planHeads, this.planRows(),
      `${this.p.customer_name || 'Internal'} · ${this.d(this.p.start_date)} – ${this.d(this.p.end_date)} · ${this.p.tasks.length} tasks`);
  }

  newTask(parent: any = null): void {
    this.tk = { title: '', stage: parent?.stage_id || this.p.stages[0]?.id || null, phase: parent?.phase || '', priority: 'medium', estimated_hours: 0,
                start_date: parent?.start_date || this.p.start_date || '', end_date: parent?.end_date || '', reviewer: null,
                milestone: null, parent_task_id: parent?.id || null, members: parent ? parent.members.map((m: any) => m.id) : [], depends_on: [],
                description: '', acceptance_criteria: '', customer_approval: false };
    this.tab = 'tasks';
    setTimeout(() => document.querySelector('.zp-card input')?.scrollIntoView({ block: 'center' }), 50);
  }
  parentOf(tk: any): any { return tk?.parent_task_id ? this.p.tasks.find((x: any) => x.id === tk.parent_task_id) : null; }
  mainTasks(): any[] { return this.p.tasks.filter((x: any) => !x.parent_task_id && (!this.tk || x.id !== this.tk.id)); }

  // ---- attachments
  async openFiles(t: any): Promise<void> {
    this.ft = { task: t, files: [], note: '', picked: [] as File[], busy: false, err: '' };
    try { this.ft.files = await this.api.get(`tasks/${t.id}/files/`); } catch (e) { this.ft.err = ZpApiService.error(e); }
  }
  async upload(): Promise<void> {
    if (!this.ft.picked.length) { this.ft.err = 'Choose a file.'; return; }
    this.ft.busy = true; this.ft.err = '';
    try {
      await this.api.post(`tasks/${this.ft.task.id}/files/`, ZpApiService.form({ note: this.ft.note }, this.ft.picked));
      this.ft.files = await this.api.get(`tasks/${this.ft.task.id}/files/`);
      this.ft.picked = []; this.ft.note = '';
      await this.load();
    } catch (e) { this.ft.err = ZpApiService.error(e); }
    this.ft.busy = false;
  }
  async removeFile(x: any): Promise<void> {
    if (!confirm(`Remove ${x.name}?`)) return;
    try { await this.api.delete(`task-files/${x.id}/`); this.ft.files = this.ft.files.filter((y: any) => y.id !== x.id); await this.load(); }
    catch (e) { this.ft.err = ZpApiService.error(e); }
  }
  getFile(x: any): void { this.api.file(`task-files/${x.id}/`, {}, x.name).catch(e => this.ft.err = ZpApiService.error(e)); }
  size(b: number): string { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  pick(fl: FileList | null): void { this.ft.picked = fl ? Array.from(fl) : []; }
  editTask(t: any): void {
    this.tk = { id: t.id, subtask_count: t.subtask_count, title: t.title, stage: t.stage_id, phase: t.phase, priority: t.priority, estimated_hours: t.planned_hours, start_date: t.start_date,
                end_date: t.end_date, reviewer: t.reviewer?.id || null, milestone: t.milestone, parent_task_id: t.parent_task_id,
                members: t.members.map((m: any) => m.id), depends_on: [...(t.depends_on || [])], description: t.description,
                acceptance_criteria: t.acceptance_criteria, customer_approval: t.customer_approval };
  }
  async saveTask(): Promise<void> {
    if (!this.tk.title?.trim()) { this.msg = 'Enter the task name.'; return; }
    if (!this.tk.start_date || !this.tk.end_date) { this.msg = 'The expected start and end dates are required.'; return; }
    if (this.tk.end_date < this.tk.start_date) { this.msg = 'The expected end date is before the start date.'; return; }
    const { subtask_count, ...body } = this.tk;
    this.tk = { ...body, subtask_count };
    const ok = await this.run(() => this.tk.id ? this.api.patch(`tasks/${this.tk.id}/`, body) : this.api.post(`projects/${this.p.id}/tasks/`, body));
    if (ok) this.tk = null;
  }
  taskSet(t: any, data: any): Promise<boolean> { return this.run(() => this.api.patch(`tasks/${t.id}/`, data)); }
  progress(t: any): void {
    const v = prompt('Progress in % (0–100)', String(t.progress)); if (v === null) return;
    const blockers = prompt('Blockers (empty = none)', t.blockers || '');
    this.taskSet(t, { progress: Number(v), blockers: blockers ?? t.blockers });
  }
  otherTasks(): any[] { return this.p.tasks.filter((x: any) => !this.tk || x.id !== this.tk.id); }
  orderedTasks(): any[] {
    const top = this.p.tasks.filter((t: any) => !t.parent_task_id || !this.p.tasks.some((x: any) => x.id === t.parent_task_id));
    const out: any[] = [];
    top.forEach((t: any) => { out.push(t); this.p.tasks.filter((c: any) => c.parent_task_id === t.id).forEach((c: any) => out.push(c)); });
    return out;
  }
  team(): any[] { const ids = new Set([...(this.p.members || []), ...(this.p.managers || [])].map((m: any) => m.id)); return this.lk.employees.filter((e: any) => ids.has(e.id)); }

  async saveMs(): Promise<void> {
    const ok = await this.run(() => this.ms.id ? this.api.patch(`milestones/${this.ms.id}/`, this.ms) : this.api.post(`projects/${this.p.id}/milestones/`, this.ms));
    if (ok) this.ms = null;
  }
  msStatus(x: any, status: string, extra: any = {}): Promise<boolean> { return this.run(() => this.api.post(`milestones/${x.id}/status/`, { status, ...extra })); }
  msAcceptManual(x: any): void { const who = prompt('Accepted by (customer person)'); if (who) this.msStatus(x, 'accepted', { customer_name: who, note: 'Recorded by the project manager' }); }

  async saveCr(): Promise<void> { if (await this.run(() => this.api.post(`projects/${this.p.id}/change-requests/`, this.cr))) this.cr = null; }
  crDecide(c: any, step: string, approve: boolean): void {
    const extra: any = {};
    if (step === 'customer') { const who = prompt('Approved by (customer person)'); if (!who) return; extra.customer_name = who; }
    if (!approve) { const n = prompt('Why rejected?'); if (!n) return; extra.note = n; }
    this.run(() => this.api.post(`change-requests/${c.id}/decide/`, { step, approve, ...extra }));
  }
  async saveRisk(): Promise<void> { if (await this.run(() => this.rk.id ? this.api.patch(`risks/${this.rk.id}/`, this.rk) : this.api.post(`projects/${this.p.id}/risks/`, this.rk))) this.rk = null; }
  async addExp(): Promise<void> { if (await this.run(() => this.api.post(`projects/${this.p.id}/expenses/`, { ...this.ex, date: today() }))) this.ex = { description: '', amount: null, category: 'third_party', vendor: '' }; }
  delExp(x: any): void { if (confirm('Remove this cost?')) this.run(() => this.api.delete(`expenses/${x.id}/`)); }

  done(): number { return this.p.tasks.filter((t: any) => t.status === 'completed').length; }
  late(): number { return this.p.tasks.filter((t: any) => t.overdue).length; }
  blocked(): number { return this.p.tasks.filter((t: any) => t.blocked && t.status !== 'completed').length; }
  openRisks(): any[] { return this.p.risks.filter((r: any) => r.status !== 'closed'); }
  tog(list: number[], id: number): void { const i = list.indexOf(id); i >= 0 ? list.splice(i, 1) : list.push(id); }
  names(list: any[]): string { return (list || []).map(x => x.name).join(', '); }
  bm(v: string): string { return (this.lk.billing_methods || []).find((x: any) => x.value === v)?.label || v || '–'; }
  go(path: any[]): void { this.router.navigate([ZP_BASE, ...path]); }
  d(v: any): string { return day(v); }
  w(v: any): string { return when(v); }
  n(v: any): string { return num(v); }
  m(v: any): string { return money(v, this.p?.currency || 'AED'); }
  cap(v: any): number { return Math.min(100, Number(v || 0)); }
  pctOf(a: any, b: any): number { return Number(b) ? Math.round(Number(a) * 100 / Number(b)) : 0; }
}
