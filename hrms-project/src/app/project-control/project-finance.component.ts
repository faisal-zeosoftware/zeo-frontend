import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectControlApiService, hrs, money } from './project-control-api.service';

/** Project finance: billing settings, member rates, task plans and the cost / profit KPIs of one project. */
@Component({
  selector: 'app-project-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./project-control.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="pc-head">
        <div>
          <h1 class="page-title">Project costing</h1>
          <p class="pc-desc">Contract, budget and billing of a project, the bill and cost rate of each member and the planned hours of each task.
            Cost = hours × hourly cost (monthly fixed pay ÷ working days ÷ hours a day, or the member's own cost rate); approved time keeps the rate of its approval day.</p>
        </div>
        <div class="pc-actions">
          <label class="pc-field" style="min-width: 220px; max-width: 100%">Project
            <select [(ngModel)]="pid" (ngModelChange)="open()">
              <option [ngValue]="null">Pick a project</option>
              <option *ngFor="let p of projects" [ngValue]="p.id" [disabled]="!p.can_finance">{{ p.title }}{{ p.can_finance ? '' : ' (no access)' }}</option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="pc-msg err" *ngIf="err">{{ err }}</p>
      <p class="pc-msg" *ngIf="msg">{{ msg }}</p>
      <p class="pc-muted" *ngIf="loading">Loading…</p>
      <p class="pc-muted" *ngIf="!pid && !loading">Pick a project to see its costs and profit.</p>

      <ng-container *ngIf="s && d">
        <div class="pc-weekbar">
          <span class="lbl">{{ d.project.title }}</span>
          <label class="pc-field" style="flex-direction: row; align-items: center">From <input type="date" [(ngModel)]="from" (change)="loadSummary()"></label>
          <label class="pc-field" style="flex-direction: row; align-items: center">To <input type="date" [(ngModel)]="to" (change)="loadSummary()"></label>
        </div>
        <div class="pc-kpis">
          <div><small>Planned hours</small><b>{{ h(s.planned_hours) }}</b></div>
          <div><small>Actual hours</small><b>{{ h(s.actual_hours) }}</b></div>
          <div><small>Billable / non-billable</small><b>{{ h(s.billable_hours) }} / {{ h(s.non_billable_hours) }}</b></div>
          <div><small>Approved hours</small><b>{{ h(s.approved_hours) }}</b></div>
          <div><small>Cost</small><b>{{ m(s.cost) }}</b></div>
          <div><small>Billed value</small><b>{{ m(s.billed) }}</b></div>
          <div class="hl" [class.neg]="n(s.profit) < 0"><small>Profit</small><b>{{ m(s.profit) }}</b></div>
          <div [class.neg]="(s.margin_pct ?? 0) < 0"><small>Margin</small><b>{{ s.margin_pct === null ? '–' : s.margin_pct + ' %' }}</b></div>
        </div>
        <div class="pc-split">
          <div class="pc-panel">
            <div class="pc-h">Budget</div>
            <div class="pc-bar">
              <div class="top"><span>Cost budget used</span><span>{{ m(s.cost) }} of {{ m(s.budget_amount) }} · {{ s.budget_used_pct ?? '–' }} %</span></div>
              <div class="track"><div class="fill" [ngClass]="cls(s.budget_used_pct)" [style.width.%]="w(s.budget_used_pct)"></div></div>
            </div>
            <div class="pc-bar">
              <div class="top"><span>Hours used</span><span>{{ h(s.actual_hours) }} of {{ h(n(s.budget_hours) || n(s.planned_hours)) }} · {{ s.hours_used_pct ?? '–' }} %</span></div>
              <div class="track"><div class="fill" [ngClass]="cls(s.hours_used_pct)" [style.width.%]="w(s.hours_used_pct)"></div></div>
            </div>
            <div class="pc-bar">
              <div class="top"><span>Billable share</span><span>{{ s.billable_pct ?? '–' }} %</span></div>
              <div class="track"><div class="fill ok" [style.width.%]="w(s.billable_pct)"></div></div>
            </div>
          </div>
          <div class="pc-panel">
            <div class="pc-h">Hours by task (planned vs actual)</div>
            <div class="pc-bar" *ngFor="let t of s.by_task">
              <div class="top"><span>{{ t.task }}</span><span>{{ h(t.hours) }} / {{ h(t.planned_hours) }} h</span></div>
              <div class="track"><div class="fill" [ngClass]="cls(n(t.planned_hours) ? (n(t.hours) * 100 / n(t.planned_hours)) : null)"
                   [style.width.%]="n(t.planned_hours) ? w(n(t.hours) * 100 / n(t.planned_hours)) : (n(t.hours) ? 100 : 0)"></div></div>
            </div>
            <p class="pc-muted" *ngIf="!s.by_task.length">No tasks.</p>
          </div>
        </div>

        <div class="pc-panel">
          <div class="pc-h">Cost by employee</div>
          <table class="pc-table">
            <thead><tr><th>Employee</th><th class="num">Hours</th><th class="num">Billable</th><th class="num">Cost</th><th class="num">Billed</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of s.by_employee">
                <td data-label="Employee">{{ e.employee }}</td><td class="num" data-label="Hours">{{ h(e.hours) }}</td>
                <td class="num" data-label="Billable">{{ h(e.billable_hours) }}</td><td class="num" data-label="Cost">{{ m(e.cost) }}</td>
                <td class="num" data-label="Billed">{{ m(e.billed) }}</td>
              </tr>
              <tr *ngIf="!s.by_employee.length"><td colspan="5" class="pc-muted">No time booked in this period.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pc-panel">
          <div class="pc-h">Billing and budget
            <button type="button" class="pc-btn primary sm" *ngIf="d.can_edit" (click)="saveAll()" [disabled]="busy">Save</button></div>
          <div class="pc-form">
            <label class="pc-field">Customer<input [(ngModel)]="d.finance.customer_name" [readonly]="!d.can_edit"></label>
            <label class="pc-field">Billing type
              <select [(ngModel)]="d.finance.billing_type" [disabled]="!d.can_edit">
                <option *ngFor="let b of d.billing_types" [value]="b.value">{{ b.label }}</option>
              </select></label>
            <label class="pc-field">Currency<input [(ngModel)]="d.finance.currency" maxlength="3" [readonly]="!d.can_edit"></label>
            <label class="pc-field">Contract value<input type="number" min="0" step="0.01" [(ngModel)]="d.finance.contract_value" [readonly]="!d.can_edit"></label>
            <label class="pc-field">Cost budget<input type="number" min="0" step="0.01" [(ngModel)]="d.finance.budget_amount" [readonly]="!d.can_edit"></label>
            <label class="pc-field">Budget hours<input type="number" min="0" step="0.5" [(ngModel)]="d.finance.budget_hours" [readonly]="!d.can_edit"></label>
            <label class="pc-field">Default bill rate / hour<input type="number" min="0" step="0.01" [(ngModel)]="d.finance.default_bill_rate" [readonly]="!d.can_edit"></label>
          </div>
        </div>

        <div class="pc-panel">
          <div class="pc-h">Member rates</div>
          <table class="pc-table">
            <thead><tr><th style="width: 30%">Employee</th><th>Role</th><th class="num">Bill rate / h</th><th class="num">Cost rate / h (override)</th><th class="num">Salary cost / h</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of d.members">
                <td data-label="Employee">{{ r.employee }} <span class="pc-tag">{{ r.project_role }}</span></td>
                <td data-label="Role"><input [(ngModel)]="r.role" [readonly]="!d.can_edit" placeholder="e.g. Consultant"></td>
                <td class="num" data-label="Bill rate / h"><input type="number" min="0" step="0.01" [(ngModel)]="r.bill_rate" [readonly]="!d.can_edit" [placeholder]="'default ' + d.finance.default_bill_rate"></td>
                <td class="num" data-label="Cost rate override"><input type="number" min="0" step="0.01" [(ngModel)]="r.cost_rate_override" [readonly]="!d.can_edit" placeholder="from salary"></td>
                <td class="num" data-label="Salary cost / h">{{ m(r.salary_cost_rate) }}</td>
              </tr>
              <tr *ngIf="!d.members.length"><td colspan="5" class="pc-muted">No members on this project.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pc-panel">
          <div class="pc-h">Task plan</div>
          <table class="pc-table">
            <thead><tr><th style="width: 55%">Task</th><th class="num">Planned hours</th><th>Billable</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of d.tasks">
                <td data-label="Task">{{ t.task }}</td>
                <td class="num" data-label="Planned hours"><input type="number" min="0" step="0.5" [(ngModel)]="t.planned_hours" [readonly]="!d.can_edit"></td>
                <td data-label="Billable"><label class="pc-switch"><input type="checkbox" [(ngModel)]="t.billable" [disabled]="!d.can_edit"> billable</label></td>
              </tr>
              <tr *ngIf="!d.tasks.length"><td colspan="3" class="pc-muted">No tasks.</td></tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </div>
  </div>
</div>
`,
})
export class ProjectFinanceComponent implements OnInit {
  projects: any[] = [];
  pid: number | null = null;
  d: any = null;
  s: any = null;
  from = '';
  to = '';
  loading = false;
  busy = false;
  msg = '';
  err = '';
  h = hrs;

  constructor(private api: ProjectControlApiService, private cd: ChangeDetectorRef) {}

  n(v: any): number { return Number(v || 0); }
  m(v: any): string { return money(v, this.d?.finance?.currency || 'AED'); }
  w(p: any): number { return p === null || p === undefined ? 0 : Math.max(0, Math.min(100, Number(p))); }
  cls(p: any): string { const n = Number(p); return p === null || p === undefined ? '' : n > 100 ? 'over' : n > 85 ? 'warn' : ''; }

  async ngOnInit(): Promise<void> {
    try {
      const r = await this.api.get('projects/');
      this.projects = r.projects || [];
      const first = this.projects.find(p => p.can_finance);
      if (first && this.projects.filter(p => p.can_finance).length === 1) {
        this.pid = first.id;
        this.open();
      }
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The projects could not be loaded.');
    }
    this.cd.markForCheck();
  }

  async open(): Promise<void> {
    this.d = this.s = null;
    this.msg = this.err = '';
    if (!this.pid) return;
    this.loading = true;
    try {
      this.d = await this.api.get(`finance/${this.pid}/`);
      await this.loadSummary();
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The project finances could not be loaded.');
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  async loadSummary(): Promise<void> {
    if (!this.pid) return;
    try {
      this.s = await this.api.get(`project-summary/${this.pid}/`, { from: this.from, to: this.to });
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The project summary could not be loaded.');
    }
    this.cd.markForCheck();
  }

  async saveAll(): Promise<void> {
    if (!this.d || !this.pid) return;
    this.busy = true;
    this.err = this.msg = '';
    const blank = (v: any) => (v === '' || v === null || v === undefined ? null : v);
    try {
      this.d = await this.api.put(`finance/${this.pid}/`, {
        finance: this.d.finance,
        member_rates: this.d.members.map((r: any) => ({ employee_id: r.employee_id, role: r.role, bill_rate: blank(r.bill_rate),
                                                        cost_rate_override: blank(r.cost_rate_override) })),
        task_plans: this.d.tasks.map((t: any) => ({ task_id: t.task_id, planned_hours: blank(t.planned_hours) ?? 0, billable: t.billable })),
      });
      await this.loadSummary();
      this.msg = 'Saved.';
    } catch (e) {
      this.err = ProjectControlApiService.error(e, 'The project finances could not be saved.');
    }
    this.busy = false;
    this.cd.markForCheck();
  }
}
