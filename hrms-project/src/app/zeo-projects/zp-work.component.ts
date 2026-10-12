import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { PRIORITY_CLASS, STAGE_CLASS, ZP_BASE, ZpApiService, day, money, num, slaText, today, when } from './zp-api.service';
import { ZpTicketFormComponent } from './zp-tickets.component';
import { ZpNotifyComponent } from './zp-notify.component';

const DEV_STEPS = [
  { key: 'submitted', label: 'Technical review' }, { key: 'tech_approved', label: 'Commercial approval' },
  { key: 'commercial_approved', label: 'Customer approval' }, { key: 'approved', label: 'Task created' },
  { key: 'in_progress', label: 'Development' }, { key: 'testing', label: 'Testing' }, { key: 'deployed', label: 'Deployed' }, { key: 'done', label: 'Done' },
];

/** My work (v1.14.0): my open tickets (by SLA), unassigned tickets of my teams, my time this week, my development work,
 *  what waits for my approval. */
@Component({
  selector: 'app-zp-my-work',
  standalone: true,
  imports: [CommonModule, ZpNotifyComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">My work</h1><p class="ex-desc">Your tickets in SLA order, what your teams have not picked up yet, your time this week and what waits for your approval.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn" (click)="notif = true">My notifications</button>
          <button type="button" class="ex-btn" (click)="go(['helpdesk'])">IT helpdesk</button>
          <button type="button" class="ex-btn primary" *ngIf="d?.rights?.ticket_add" (click)="go(['tickets'], { new: 1 })">+ New ticket</button></div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <ng-container *ngIf="d">
        <div class="ex-tiles">
          <button type="button" class="ex-tile" (click)="go(['tickets'], { view: 'mine' })"><div class="lbl">My open tickets</div><div class="num">{{ d.tickets.length }}</div>
            <div class="amt">{{ breached() }} past the SLA</div></button>
          <button type="button" class="ex-tile t2" (click)="go(['tickets'], { view: 'unassigned' })"><div class="lbl">Unassigned (my teams)</div><div class="num">{{ d.unassigned.length }}</div><div class="amt">pick one up</div></button>
          <div class="ex-tile t3"><div class="lbl">My hours this week</div><div class="num">{{ n(d.hours_week) }}</div><div class="amt">logged on tickets</div></div>
          <button type="button" class="ex-tile t4" (click)="approvals()"><div class="lbl">Waiting for my approval</div>
            <div class="num">{{ d.approvals.dev_tech + d.approvals.dev_commercial + d.approvals.worklogs + (d.approvals.tickets || 0) }}</div>
            <div class="amt">{{ d.approvals.tickets || 0 }} tickets · {{ d.approvals.dev_tech + d.approvals.dev_commercial }} development · {{ d.approvals.worklogs }} work logs</div></button>
        </div>
        <div class="zp-note err" *ngIf="lateTasks() || breached()" style="margin-bottom:14px">
          <b>Needs attention:</b> {{ breached() }} ticket(s) past the SLA · {{ lateTasks() }} project task(s) overdue. You also get these by e-mail and in My To-do.
        </div>
        <div class="ex-grid2">
          <div class="ex-panel">
            <div class="ex-h">My tickets</div>
            <div class="ex-rows">
              <div class="ex-row click" *ngFor="let t of d.tickets" (click)="go(['tickets', t.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</div><div class="s">{{ t.customer_name }} · {{ t.stage_label }}</div></div>
                <div class="r"><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></div>
              </div>
              <p class="zp-empty" *ngIf="!d.tickets.length">Nothing assigned to you.</p>
            </div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">Not picked up yet</div>
            <div class="ex-rows">
              <div class="ex-row click" *ngFor="let t of d.unassigned" (click)="go(['tickets', t.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</div><div class="s">{{ t.customer_name }} · {{ t.team_name }}</div></div>
                <div class="r"><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></div>
              </div>
              <p class="zp-empty" *ngIf="!d.unassigned.length">All tickets are assigned.</p>
            </div>
          </div>
          <div class="ex-panel" *ngIf="d.tasks?.length">
            <div class="ex-h">My project tasks</div>
            <div class="ex-rows">
              <div class="ex-row click" *ngFor="let x of d.tasks" (click)="go(['projects', x.project_id])">
                <div class="main"><div class="t">{{ x.title }}</div><div class="s">{{ x.project }} · due {{ dd(x.end_date) || '–' }} · {{ n(x.planned_hours) }} h planned</div></div>
                <div class="r"><span class="zp-b pr-critical" *ngIf="x.overdue">{{ x.days_late }} d overdue</span><span class="ex-tag">{{ x.status_label }}</span></div></div>
            </div>
          </div>
          <div class="ex-panel" *ngIf="d.dev_requests.length">
            <div class="ex-h">My development work</div>
            <div class="ex-rows">
              <div class="ex-row click" *ngFor="let x of d.dev_requests" (click)="go(['dev-requests', x.id])">
                <div class="main"><div class="t"><span class="zp-code">{{ x.number }}</span> {{ x.title }}</div><div class="s">{{ x.customer_name }} · {{ n(x.estimated_hours) }} h</div></div>
                <div class="r"><span class="ex-tag">{{ x.status_label }}</span></div></div>
            </div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">My time this week</div>
            <div class="ex-rows">
              <div class="ex-row" *ngFor="let l of d.worklogs_week">
                <div class="main"><div class="t">{{ l.ticket_number }} · {{ n(l.hours) }} h{{ l.onsite ? ' onsite' : '' }}</div><div class="s">{{ dd(l.date) }} · {{ l.description }}</div></div>
                <div class="r"><span class="ex-tag" [ngClass]="l.status">{{ l.status }}</span></div></div>
              <p class="zp-empty" *ngIf="!d.worklogs_week.length">No time logged this week.</p>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>
<div class="ex-back" *ngIf="notif" (click)="notif = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(860px,100%)">
    <header><h2>My notifications</h2><button type="button" (click)="notif = false" aria-label="Close">×</button></header>
    <div class="body"><app-zp-notify scope="me"></app-zp-notify></div>
  </div>
</div>`,
})
export class ZpMyWorkComponent implements OnInit {
  d: any = null;
  notif = false;
  msg = '';
  pc = PRIORITY_CLASS;
  constructor(private api: ZpApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    try { this.d = await this.api.get('my/'); } catch (e) { this.msg = ZpApiService.error(e); }
  }
  breached(): number { return this.d.tickets.filter((t: any) => t.sla_state === 'breached').length; }
  lateTasks(): number { return (this.d.tasks || []).filter((t: any) => t.overdue).length; }
  approvals(): void { if (this.d.approvals.tickets) { this.go(['tickets'], { view: 'approval' }); return; } if (this.d.approvals.dev_tech + this.d.approvals.dev_commercial) this.go(['dev-requests'], { waiting: 'me' }); else if (this.d.approvals.worklogs) this.go(['worklogs']); }
  go(path: any[], q?: any): void { this.router.navigate([ZP_BASE, ...path], q ? { queryParams: q } : {}); }
  sla(t: any): string { return slaText(t); }
  n(v: any): string { return num(v); }
  dd(v: any): string { return day(v); }
}

/** IT / internal helpdesk for every employee (v1.14.0): raise a request and follow it. */
@Component({
  selector: 'app-zp-helpdesk',
  standalone: true,
  imports: [CommonModule, ZpTicketFormComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">IT helpdesk</h1><p class="ex-desc">Ask the support team for help (laptop, e-mail, system access, software). Follow your requests here.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn primary" (click)="creating = true">+ New request</button></div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="ex-rows">
        <div class="ex-row click" *ngFor="let t of rows" (click)="open(t.id)">
          <div class="main"><div class="t"><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</div><div class="s">{{ w(t.created_at) }}</div></div>
          <div class="r"><span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span></div>
        </div>
        <p class="zp-empty" *ngIf="!rows.length">You have not raised any request.</p>
      </div>
    </div>
  </div>
</div>
<app-zp-ticket-form *ngIf="creating" [helpdesk]="true" (closed)="creating = false" (saved)="creating = false; open($event.id)"></app-zp-ticket-form>`,
})
export class ZpHelpdeskComponent implements OnInit {
  rows: any[] = [];
  creating = false;
  msg = '';
  sc = STAGE_CLASS;
  constructor(private api: ZpApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    try { this.rows = (await this.api.get('tickets/', { requested: 'me', limit: 100 })).results; } catch (e) { this.msg = ZpApiService.error(e); }
  }
  open(id: number): void { this.router.navigate([ZP_BASE, 'tickets', id]); }
  w(v: any): string { return when(v); }
}

/** Development requests (v1.14.0): list and one request with its approval steps. */
@Component({
  selector: 'app-zp-dev-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Development requests</h1>
          <p class="ex-desc">Customisations raised from support: technical review → commercial approval → customer approval → a task in the project → testing → deployed.</p></div>
      </div>
      <div class="zp-filters">
        <div class="zp-pill-row">
          <button type="button" class="zp-chip" [class.on]="f.waiting === 'me'" (click)="f.waiting = f.waiting ? '' : 'me'; load()">Waiting for me</button>
          <button type="button" class="zp-chip" *ngFor="let s of statuses" [class.on]="f.status === s.value" (click)="f.status = f.status === s.value ? '' : s.value; load()">{{ s.label }}</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="zp-split">
        <div class="ex-rows" style="min-width:0">
          <div class="ex-row click" *ngFor="let x of rows" (click)="pick(x.id)" [style.background]="cur?.id === x.id ? '#f7f6ff' : null">
            <div class="main"><div class="t"><span class="zp-code">{{ x.number }}</span> {{ x.title }}</div>
              <div class="s">{{ x.customer_name || 'Internal' }} · {{ x.ticket_number }} · {{ n(x.estimated_hours) }} h · {{ x.chargeable ? m(x.quoted_amount ?? x.estimated_cost) : 'not charged' }}</div></div>
            <div class="r"><span class="ex-tag" [class.pending]="['submitted','tech_approved','commercial_approved'].includes(x.status)" [class.rejected]="x.status === 'rejected'" [class.approved]="x.status === 'done'">{{ x.status_label }}</span></div>
          </div>
          <p class="zp-empty" *ngIf="!rows.length">No development requests.</p>
        </div>
        <div class="zp-side" *ngIf="cur">
          <div class="zp-card">
            <h3>{{ cur.number }}</h3>
            <div style="font-weight:700;font-size:15px;color:#1b1640">{{ cur.title }}</div>
            <div class="zp-steps" style="margin-top:10px">
              <div class="s" *ngFor="let s of steps(); trackBy: byLabel" [class.done]="s.state === 'done'" [class.now]="s.state === 'now'" [class.bad]="s.state === 'bad'">{{ s.label }}</div>
            </div>
            <dl class="zp-kv">
              <dt>Customer</dt><dd>{{ cur.customer_name || 'Internal' }}</dd>
              <dt>Ticket</dt><dd><a href="javascript:void(0)" (click)="go(['tickets', cur.ticket])" *ngIf="cur.ticket">{{ cur.ticket_number }}</a></dd>
              <dt>Estimate</dt><dd>{{ n(cur.estimated_hours) }} h · {{ m(cur.estimated_cost) }}</dd>
              <dt>Quoted</dt><dd>{{ cur.quoted_amount !== null ? m(cur.quoted_amount) : '–' }}</dd>
              <dt>Chargeable</dt><dd>{{ cur.chargeable ? 'Yes' : 'No' }}{{ cur.needs_customer_approval ? ' · customer approves' : '' }}</dd>
              <dt>Raised by</dt><dd>{{ cur.requested_by }} · {{ w(cur.requested_at) }}</dd>
              <dt>Technical</dt><dd>{{ cur.tech_by ? cur.tech_by + ' · ' + w(cur.tech_at) : '–' }}<div class="zp-muted">{{ cur.tech_note }}</div></dd>
              <dt>Commercial</dt><dd>{{ cur.commercial_by ? cur.commercial_by + ' · ' + w(cur.commercial_at) : '–' }}<div class="zp-muted">{{ cur.commercial_note }}</div></dd>
              <dt>Customer</dt><dd>{{ cur.customer_decision_by ? cur.customer_decision_by + ' · ' + w(cur.customer_decision_at) : '–' }}<div class="zp-muted">{{ cur.customer_note }}</div></dd>
              <dt>Developer</dt><dd>{{ cur.assigned_to?.name || '–' }}</dd>
              <dt>Task</dt><dd><a href="javascript:void(0)" *ngIf="cur.project_id" (click)="go(['projects', cur.project_id])">open the project</a><span *ngIf="!cur.project_id">–</span></dd>
            </dl>
            <p class="zp-note err" *ngIf="cur.rejected_reason" style="margin-top:10px">{{ cur.rejected_reason }}</p>
            <div class="zp-section" style="margin-top:12px">Issue</div><div style="white-space:pre-wrap;font-size:13px">{{ cur.issue }}</div>
            <div class="zp-section">Proposed solution</div><div style="white-space:pre-wrap;font-size:13px">{{ cur.proposed_solution || '–' }}</div>
          </div>
          <div class="zp-card" *ngIf="cur.can_tech || cur.can_commercial || cur.can_record_customer">
            <h3>{{ cur.can_tech ? 'Technical review' : cur.can_commercial ? 'Commercial approval' : 'Customer decision (recorded by you)' }}</h3>
            <div class="ex-form" style="grid-template-columns:1fr">
              <label *ngIf="cur.can_commercial">Quoted amount<input type="number" min="0" [(ngModel)]="dec.quoted_amount"></label>
              <label *ngIf="cur.can_record_customer">Customer person<input [(ngModel)]="dec.customer_name" placeholder="Who approved, e.g. by e-mail"></label>
              <label>Note<textarea [(ngModel)]="dec.note" rows="2"></textarea></label>
              <div class="zp-acts"><button type="button" class="ex-btn green" (click)="decide(true)">Approve</button><button type="button" class="ex-btn danger" (click)="decide(false)">Reject</button></div>
            </div>
          </div>
          <div class="zp-card" *ngIf="cur.can_progress && (cur.next_status.length || ['submitted','tech_approved','commercial_approved','approved','in_progress'].includes(cur.status))">
            <h3>Development</h3>
            <div class="ex-form" style="grid-template-columns:1fr">
              <label>Developer<select [(ngModel)]="dev.assigned_to" (ngModelChange)="setDev()"><option [ngValue]="null">–</option>
                <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
            </div>
            <div class="zp-acts" style="margin-top:8px">
              <button type="button" class="ex-btn" [class.primary]="s !== 'in_progress' || cur.status === 'approved'" *ngFor="let s of cur.next_status" (click)="progress(s)">{{ nextLabel(s) }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class ZpDevRequestsComponent implements OnInit {
  byLabel = (_: number, x: any) => x.label;
  rows: any[] = [];
  cur: any = null;
  lk: any = { employees: [], dev_status: [] };
  f: any = { status: '', waiting: '' };
  statuses: any[] = [];
  dec: any = { note: '', quoted_amount: null, customer_name: '' };
  dev: any = { assigned_to: null };
  msg = '';
  constructor(private api: ZpApiService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    this.statuses = (this.lk.dev_status || []).filter((s: any) => ['submitted', 'tech_approved', 'commercial_approved', 'in_progress', 'done', 'rejected'].includes(s.value));
    if (this.route.snapshot.queryParamMap.get('waiting')) this.f.waiting = 'me';
    await this.load();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) await this.pick(Number(id));
  }
  async load(): Promise<void> {
    try { this.rows = (await this.api.get('dev-requests/', this.f)).results; this.msg = ''; } catch (e) { this.msg = ZpApiService.error(e); }
  }
  async pick(id: number): Promise<void> {
    try {
      this.cur = await this.api.get(`dev-requests/${id}/`);
      this.dec = { note: '', quoted_amount: this.cur.estimated_cost, customer_name: '' };
      this.dev = { assigned_to: this.cur.assigned_to?.id || null };
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  private async after(fn: () => Promise<any>): Promise<void> {
    try { await fn(); await this.load(); await this.pick(this.cur.id); } catch (e) { this.msg = ZpApiService.error(e); }
  }
  decide(approve: boolean): void {
    if (!approve && !this.dec.note) { this.msg = 'Write why it is rejected.'; return; }
    const step = this.cur.can_tech ? 'tech' : this.cur.can_commercial ? 'commercial' : 'customer';
    this.after(() => this.api.post(`dev-requests/${this.cur.id}/decide/`, { ...this.dec, step, approve }));
  }
  setDev(): void { this.after(() => this.api.patch(`dev-requests/${this.cur.id}/`, this.dev)); }
  progress(s: string): void { this.after(() => this.api.post(`dev-requests/${this.cur.id}/progress/`, { status: s })); }
  nextLabel(s: string): string { return ({ in_progress: this.cur.status === 'approved' ? 'Start development' : 'Back to development', testing: 'Ready for testing', deployed: 'Deployed', done: 'Customer confirmed – done' } as any)[s] || s; }
  steps(): any[] {
    const st = this.cur.status;
    let list = DEV_STEPS.filter(s => (s.key !== 'tech_approved' || this.cur.chargeable) && (s.key !== 'commercial_approved' || this.cur.needs_customer_approval));
    const i = list.findIndex(s => s.key === st);
    if (st === 'rejected' || st === 'cancelled') return list.slice(0, 3).map((s, k) => ({ ...s, state: k === 0 ? 'bad' : '' })).concat([{ key: st, label: 'Rejected', state: 'bad' }]);
    return list.map((s, k) => ({ ...s, state: k < i ? 'done' : k === i ? (st === 'done' ? 'done' : 'now') : '' }));
  }
  go(path: any[]): void { this.router.navigate([ZP_BASE, ...path]); }
  w(v: any): string { return when(v); }
  n(v: any): string { return num(v); }
  m(v: any): string { return money(v, this.lk.currency || 'AED'); }
}

/** Work log approvals (v1.14.0): support managers approve time logged on tickets. */
@Component({
  selector: 'app-zp-worklogs',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Work logs</h1><p class="ex-desc">Time logged on tickets. Approved hours count against the AMC and in the cost of the contract.</p></div>
        <div class="ex-actions" *ngIf="status === 'submitted' && sel.size">
          <button type="button" class="ex-btn danger" (click)="decide(false)">Reject ({{ sel.size }})</button>
          <button type="button" class="ex-btn green" (click)="decide(true)">Approve ({{ sel.size }})</button></div>
      </div>
      <div class="zp-filters">
        <select [(ngModel)]="status" (ngModelChange)="load()"><option value="submitted">Waiting for approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All</option></select>
        <input type="date" [(ngModel)]="from" (ngModelChange)="load()" aria-label="From"><input type="date" [(ngModel)]="to" (ngModelChange)="load()" aria-label="To">
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="zp-scroll"><table class="zp-table zl-zp">
        <tr><th><input type="checkbox" *ngIf="status === 'submitted'" [checked]="rows.length && sel.size === rows.length" (change)="all($any($event.target).checked)"></th>
          <th>Date</th><th>Employee</th><th>Branch</th><th>Ticket</th><th class="r">Hours</th><th>Type</th><th class="r">Charges</th><th>Status</th></tr>
        <tr *ngFor="let l of rows">
          <td><input type="checkbox" *ngIf="l.status === 'submitted'" [checked]="sel.has(l.id)" (change)="toggle(l.id)"></td>
          <td>{{ d(l.date) }}</td><td>{{ l.employee?.name }}</td><td>{{ l.branch_name }}</td>
          <td><a href="javascript:void(0)" (click)="open(l.ticket)">{{ l.ticket_number }}</a> {{ l.ticket_subject }}<div class="zp-muted">{{ l.customer_name }} · {{ l.description }}</div></td>
          <td class="r">{{ n(l.hours) }}</td>
          <td>{{ l.onsite ? 'Onsite' : 'Remote' }} · {{ l.billable ? 'chargeable' : l.counts_against_amc ? 'AMC' : 'not counted' }}</td>
          <td class="r">{{ l.travel_cost + l.other_charges ? m(l.travel_cost + l.other_charges) : '' }}</td>
          <td><span class="ex-tag" [ngClass]="l.status">{{ l.status }}</span><div class="zp-muted">{{ l.rejection_reason }}</div></td>
        </tr>
      </table></div>
      <p class="zp-empty" *ngIf="!rows.length">Nothing here.</p>
    </div>
  </div>
</div>`,
})
export class ZpWorklogsComponent implements OnInit {
  rows: any[] = [];
  sel = new Set<number>();
  status = 'submitted';
  from = '';
  to = '';
  msg = '';
  constructor(private api: ZpApiService, private router: Router) {}
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    this.sel.clear();
    try { this.rows = (await this.api.get('worklogs/', { status: this.status, from: this.from, to: this.to, limit: 1000 })).results; this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
  }
  toggle(id: number): void { this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id); }
  all(on: boolean): void { this.sel = new Set(on ? this.rows.filter(r => r.status === 'submitted').map(r => r.id) : []); }
  async decide(approve: boolean): Promise<void> {
    const reason = approve ? '' : prompt('Why are these rejected?');
    if (!approve && !reason) return;
    try { await this.api.post('worklogs/decide/', { ids: Array.from(this.sel), approve, reason }); await this.load(); } catch (e) { this.msg = ZpApiService.error(e); }
  }
  open(id: number): void { this.router.navigate([ZP_BASE, 'tickets', id]); }
  d(v: any): string { return day(v); }
  n(v: any): string { return num(v, 2); }
  m(v: any): string { return money(v); }
}

/** Billing for finance (v1.14.0): AMC instalments and accepted milestones to invoice, invoiced and paid. */
@Component({
  selector: 'app-zp-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Billing</h1><p class="ex-desc">AMC instalments and project milestones. Record the invoice number from your accounting system and the payment date.</p></div>
      </div>
      <div class="zp-filters">
        <div class="zp-pill-row">
          <button type="button" class="zp-chip" *ngFor="let s of states" [class.on]="status === s.v" (click)="status = s.v; load()">{{ s.l }}</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="ex-tiles" *ngIf="d">
        <div class="ex-tile"><div class="lbl">AMC lines</div><div class="num">{{ d.amc.length }}</div><div class="amt">{{ m(sum(d.amc)) }}</div></div>
        <div class="ex-tile t2"><div class="lbl">Milestones</div><div class="num">{{ d.milestones.length }}</div><div class="amt">{{ m(sum(d.milestones)) }}</div></div>
      </div>
      <div class="ex-grid2" *ngIf="d">
        <div class="ex-panel">
          <div class="ex-h">AMC instalments</div>
          <div class="zp-scroll"><table class="zp-table" zPlain>
            <tr><th>Due</th><th>Contract</th><th class="r">Amount</th><th>Status</th><th></th></tr>
            <tr *ngFor="let b of d.amc">
              <td>{{ dd(b.due_date) }}</td><td><a href="javascript:void(0)" (click)="go(['contracts', b.contract])">{{ b.contract_number }}</a><div class="zp-muted">{{ b.customer_name }} · {{ b.period_label }}</div></td>
              <td class="r">{{ m(b.amount, b.currency) }}</td>
              <td>{{ b.status_label }}<div class="zp-muted">{{ b.invoice_no }}</div></td>
              <td class="r"><ng-container *ngIf="rights.billing_edit">
                <button type="button" class="ex-btn sm" *ngIf="b.status === 'planned' || b.status === 'to_invoice'" (click)="inv('billing', b)">Invoiced</button>
                <button type="button" class="ex-btn sm green" *ngIf="b.status === 'invoiced'" (click)="paid('billing', b)">Paid</button></ng-container></td>
            </tr>
          </table></div>
          <p class="zp-empty" *ngIf="!d.amc.length">Nothing.</p>
        </div>
        <div class="ex-panel">
          <div class="ex-h">Milestones</div>
          <div class="zp-scroll"><table class="zp-table" zPlain>
            <tr><th>Milestone</th><th class="r">Amount</th><th>Status</th><th></th></tr>
            <tr *ngFor="let x of d.milestones">
              <td><a href="javascript:void(0)" (click)="go(['projects', x.project_id])">{{ x.project_title }}</a><div>{{ x.name }}</div><div class="zp-muted">{{ x.customer_name }} · {{ x.status_label }}</div></td>
              <td class="r">{{ m(x.amount, x.currency) }}</td>
              <td>{{ x.invoice_status_label }}<div class="zp-muted">{{ x.invoice_no }}</div></td>
              <td class="r"><ng-container *ngIf="rights.billing_edit">
                <button type="button" class="ex-btn sm" *ngIf="x.invoice_status === 'to_invoice' || x.invoice_status === 'planned'" (click)="inv('milestones', x)">Invoiced</button>
                <button type="button" class="ex-btn sm green" *ngIf="x.invoice_status === 'invoiced'" (click)="paid('milestones', x)">Paid</button></ng-container></td>
            </tr>
          </table></div>
          <p class="zp-empty" *ngIf="!d.milestones.length">Nothing.</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class ZpBillingComponent implements OnInit {
  d: any = null;
  rights: any = {};
  status = 'to_invoice,planned';
  states = [{ v: 'to_invoice,planned', l: 'To invoice' }, { v: 'invoiced', l: 'Invoiced – not paid' }, { v: 'paid', l: 'Paid' }, { v: '', l: 'All' }];
  msg = '';
  constructor(private api: ZpApiService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.rights = (await this.api.lookups().catch(() => ({ rights: {} }))).rights || {};
    await this.load();
  }
  async load(): Promise<void> {
    try {
      const q: any = { status: this.status };
      if (this.status === 'to_invoice,planned') q.due_by = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      this.d = await this.api.get('billing/', q); this.msg = '';
      if (this.status === 'to_invoice,planned') this.d.milestones = this.d.milestones.filter((m: any) => m.invoice_status === 'to_invoice' || m.status === 'accepted');
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  sum(rows: any[]): number { return rows.reduce((s, r) => s + Number(r.amount || 0), 0); }
  async inv(kind: string, r: any): Promise<void> {
    const no = prompt('Invoice number'); if (!no) return;
    try { await this.api.patch(`${kind}/${r.id}/`, kind === 'billing' ? { status: 'invoiced', invoice_no: no, invoice_date: today() } : { invoice_status: 'invoiced', invoice_no: no, invoice_date: today() }); await this.load(); }
    catch (e) { this.msg = ZpApiService.error(e); }
  }
  async paid(kind: string, r: any): Promise<void> {
    try { await this.api.patch(`${kind}/${r.id}/`, kind === 'billing' ? { status: 'paid', paid_date: today() } : { invoice_status: 'paid', paid_date: today() }); await this.load(); }
    catch (e) { this.msg = ZpApiService.error(e); }
  }
  go(path: any[]): void { this.router.navigate([ZP_BASE, ...path]); }
  m(v: any, c?: string): string { return money(v, c); }
  dd(v: any): string { return day(v); }
}
