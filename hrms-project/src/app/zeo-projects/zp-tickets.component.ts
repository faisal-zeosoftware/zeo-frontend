import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { PRIORITY_CLASS, STAGE_CLASS, ZP_BASE, ZpApiService, csv, slaText, when } from './zp-api.service';

/** New ticket (v1.14.0): support staff for a customer, or any employee for the internal helpdesk (helpdesk = true). */
@Component({
  selector: 'app-zp-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(760px,100%)">
    <header><h2>{{ helpdesk ? 'New helpdesk request' : 'New ticket' }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <ng-container *ngIf="!helpdesk">
          <label>Customer *
            <select [(ngModel)]="f.customer" (ngModelChange)="customerChanged()" name="c">
              <option [ngValue]="null">Choose…</option><option *ngFor="let c of lk.customers" [ngValue]="c.id">{{ c.name }}</option></select></label>
          <label>Contact
            <select [(ngModel)]="f.contact" name="ct"><option [ngValue]="null">–</option>
              <option *ngFor="let c of contacts" [ngValue]="c.id">{{ c.name }}{{ c.email ? ' – ' + c.email : '' }}</option></select></label>
          <label>Channel
            <select [(ngModel)]="f.channel" name="ch"><option *ngFor="let c of lk.channels" [value]="c.value">{{ c.label }}</option></select></label>
          <label>Product / service
            <select [(ngModel)]="f.product" name="p"><option [ngValue]="null">–</option><option *ngFor="let p of lk.products" [ngValue]="p.id">{{ p.name }}</option></select></label>
        </ng-container>
        <label class="wide">Subject *<input [(ngModel)]="f.subject" name="s" maxlength="255" placeholder="Short summary of the problem"></label>
        <label class="wide">Details<textarea [(ngModel)]="f.description" name="d" rows="5" placeholder="What happened, since when, error message, steps to repeat…"></textarea></label>
        <label *ngIf="!helpdesk">Issue category
          <select [(ngModel)]="f.category" name="cat"><option [ngValue]="null">–</option><option *ngFor="let c of lk.categories" [ngValue]="c.id">{{ c.name }}</option></select></label>
        <label>Priority
          <select [(ngModel)]="f.priority" name="pr"><option *ngFor="let p of lk.priorities" [value]="p.value">{{ p.label }}</option></select></label>
        <ng-container *ngIf="!helpdesk">
          <label>Team
            <select [(ngModel)]="f.team" name="t"><option [ngValue]="null">Automatic</option><option *ngFor="let t of lk.teams" [ngValue]="t.id">{{ t.name }}</option></select></label>
          <label *ngIf="lk.rights?.ticket_manage">Assign to
            <select [(ngModel)]="f.assigned_to" name="a"><option [ngValue]="null">Automatic (least busy in the team)</option>
              <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
        </ng-container>
        <label class="wide">Attachments<input type="file" multiple (change)="files = $any($event.target).files ? toList($any($event.target).files) : []"></label>
      </div>
      <p class="zp-muted" *ngIf="!helpdesk">The AMC contract, SLA targets and billing status are set automatically from the customer, product and category.</p>
    </div>
    <footer>
      <button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">{{ busy ? 'Saving…' : 'Create ticket' }}</button>
    </footer>
  </div>
</div>`,
})
export class ZpTicketFormComponent implements OnInit {
  @Input() helpdesk = false;
  @Input() customerId: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { customers: [], products: [], categories: [], teams: [], priorities: [], channels: [], employees: [] };
  contacts: any[] = [];
  f: any = { customer: null, contact: null, channel: 'manual', product: null, subject: '', description: '', category: null, priority: 'medium', team: null, assigned_to: null };
  files: File[] = [];
  err = '';
  busy = false;

  constructor(private api: ZpApiService) {}

  async ngOnInit(): Promise<void> {
    try { this.lk = await this.api.lookups(); } catch (e) { this.err = ZpApiService.error(e); }
    if (this.customerId) { this.f.customer = this.customerId; this.customerChanged(); }
  }

  toList(fl: FileList): File[] { return Array.from(fl); }

  async customerChanged(): Promise<void> {
    this.f.contact = null;
    this.contacts = this.f.customer ? await this.api.get('contacts/', { customer: this.f.customer }).catch(() => []) : [];
    const primary = this.contacts.find(c => c.is_primary);
    if (primary) this.f.contact = primary.id;
  }

  async save(): Promise<void> {
    this.err = '';
    if (!this.helpdesk && !this.f.customer) { this.err = 'Choose the customer.'; return; }
    if (!this.f.subject.trim()) { this.err = 'Write a subject.'; return; }
    this.busy = true;
    try {
      const data = this.helpdesk ? { subject: this.f.subject, description: this.f.description, priority: this.f.priority } : this.f;
      const t = await this.api.post('tickets/', ZpApiService.form(data, this.files));
      this.saved.emit(t);
    } catch (e) { this.err = ZpApiService.error(e, 'The ticket could not be created.'); }
    this.busy = false;
  }
}

/** Support tickets (v1.14.0): filters, SLA state, quick views (mine, unassigned, breached), new ticket. */
@Component({
  selector: 'app-zp-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpTicketFormComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Support tickets</h1>
          <p class="ex-desc">Every customer and helpdesk ticket you may see, with its SLA clock. Open a ticket to reply, change its stage, log time or raise a development request.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
          <button type="button" class="ex-btn primary" *ngIf="lk.rights?.ticket_add" (click)="creating = true">+ New ticket</button>
        </div>
      </div>
      <div class="zp-filters">
        <div class="zp-pill-row">
          <button type="button" class="zp-chip" *ngFor="let v of views" [class.on]="view === v.key" (click)="setView(v.key)">{{ v.label }}</button>
          <button type="button" class="zp-chip on" *ngIf="assigned" (click)="assigned = ''; load()" title="Remove this filter">Engineer: {{ assignedName() }} ×</button>
        </div>
      </div>
      <div class="zp-filters">
        <input type="search" [(ngModel)]="f.q" (ngModelChange)="soon()" placeholder="Search number, subject, customer, contact…" aria-label="Search">
        <select [(ngModel)]="f.stage" (ngModelChange)="load()" aria-label="Stage"><option value="">Any stage</option>
          <option *ngFor="let s of lk.stages" [value]="s.value">{{ s.label }}</option></select>
        <select [(ngModel)]="f.priority" (ngModelChange)="load()" aria-label="Priority"><option value="">Any priority</option>
          <option *ngFor="let p of lk.priorities" [value]="p.value">{{ p.label }}</option></select>
        <select [(ngModel)]="f.customer" (ngModelChange)="load()" aria-label="Customer"><option value="">All customers</option>
          <option *ngFor="let c of lk.customers" [value]="c.id">{{ c.name }}</option></select>
        <select [(ngModel)]="f.team" (ngModelChange)="load()" aria-label="Team"><option value="">All teams</option>
          <option *ngFor="let t of lk.teams" [value]="t.id">{{ t.name }}</option></select>
        <select [(ngModel)]="f.billable_status" (ngModelChange)="load()" aria-label="Billing"><option value="">Any billing</option>
          <option *ngFor="let b of lk.billable" [value]="b.value">{{ b.label }}</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <div class="zp-scroll" *ngIf="!loading">
        <table class="zp-table zl-zp">
          <tr><th>Ticket</th><th>Customer</th><th>Branch</th><th>Priority</th><th>Stage</th><th>SLA</th><th>Assigned</th><th>Billing</th><th>Created</th></tr>
          <tr class="click" *ngFor="let t of rows" (click)="open(t.id)">
            <td><span class="zp-code">{{ t.number }}</span><div style="font-weight:600;color:#1b1640;margin-top:2px">{{ t.subject }}</div>
              <div class="zp-muted">{{ t.product_name }}{{ t.category_name ? ' · ' + t.category_name : '' }}</div></td>
            <td>{{ t.customer_name }}<div class="zp-muted">{{ t.contact_name }}</div></td><td>{{ t.branch_name }}</td>
            <td><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span></td>
            <td><span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span>
              <div *ngIf="t.approval_status === 'pending'" style="margin-top:4px"><span class="zp-b pr-high">Approval</span></div>
              <div class="zp-muted">{{ t.channel_label }}</div></td>
            <td><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></td>
            <td>{{ t.assigned_to?.name || '–' }}<div class="zp-muted">{{ t.team_name }}</div></td>
            <td><span class="zp-b" [ngClass]="t.billable_status">{{ t.billable_label }}</span><div class="zp-muted">{{ t.contract_number }}</div></td>
            <td class="zp-muted">{{ w(t.created_at) }}</td>
          </tr>
        </table>
        <p class="zp-empty" *ngIf="!rows.length">No tickets match.</p>
        <div class="zp-acts" style="margin-top:10px" *ngIf="count > rows.length">
          <button type="button" class="ex-btn" (click)="more()">Show more ({{ rows.length }} of {{ count }})</button>
        </div>
      </div>
    </div>
  </div>
</div>
<app-zp-ticket-form *ngIf="creating" (closed)="creating = false" (saved)="created($event)"></app-zp-ticket-form>`,
})
export class ZpTicketsComponent implements OnInit {
  lk: any = { stages: [], priorities: [], customers: [], teams: [], billable: [], rights: {} };
  rows: any[] = [];
  count = 0;
  f: any = { q: '', stage: '', priority: '', customer: '', team: '', billable_status: '' };
  view = 'open';
  assigned = '';
  views = [{ key: 'open', label: 'Open' }, { key: 'mine', label: 'Assigned to me' }, { key: 'unassigned', label: 'Unassigned' },
           { key: 'breached', label: 'SLA breached' }, { key: 'approval', label: 'Waiting for approval' }, { key: 'waiting', label: 'Waiting for customer' }, { key: 'done', label: 'Resolved / closed' }, { key: 'all', label: 'All' }];
  loading = true;
  creating = false;
  msg = '';
  sc = STAGE_CLASS;
  pc = PRIORITY_CLASS;
  private timer: any;

  constructor(private api: ZpApiService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('view')) this.view = qp.get('view')!;
    if (qp.get('customer')) this.f.customer = qp.get('customer');
    if (qp.get('team')) this.f.team = qp.get('team');
    if (qp.get('priority')) this.f.priority = qp.get('priority');
    if (qp.get('assigned')) this.assigned = qp.get('assigned')!;   // from a report row (engineer id or "none")
    if (qp.get('new')) this.creating = true;
    try { this.lk = await this.api.lookups(); } catch { /* list still loads */ }
    await this.load();
  }

  setView(v: string): void { this.view = v; this.load(); }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }

  query(offset = 0): any {
    const q: any = { ...this.f, offset, limit: 1000, order: this.view === 'done' ? '-updated_at' : '-created_at' };
    if (this.view === 'open') q.open = 1;
    if (this.assigned && ['open', 'done', 'all'].includes(this.view)) q.assigned = this.assigned;
    if (this.view === 'mine') { q.open = 1; q.assigned = 'me'; }
    if (this.view === 'unassigned') { q.open = 1; q.assigned = 'none'; }
    if (this.view === 'breached') { q.open = 1; q.breached = 1; q.order = 'resolution_due'; }
    if (this.view === 'waiting') q.stage = 'waiting_customer';
    if (this.view === 'approval') { q.open = 1; q.approval = 'pending'; }
    if (this.view === 'done') q.open = 0;
    return q;
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const r = await this.api.get('tickets/', this.query());
      this.rows = r.results; this.count = r.count; this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e, 'The tickets could not be loaded.'); }
    this.loading = false;
  }

  async more(): Promise<void> {
    const r = await this.api.get('tickets/', this.query(this.rows.length));
    this.rows = this.rows.concat(r.results);
  }

  open(id: number): void { this.router.navigate([ZP_BASE, 'tickets', id]); }
  created(t: any): void { this.creating = false; this.open(t.id); }
  sla(t: any): string { return slaText(t); }
  assignedName(): string { return this.assigned === 'none' ? 'not assigned' : (this.lk.employees || []).find((e: any) => String(e.id) === this.assigned)?.name || '#' + this.assigned; }
  w(v: any): string { return when(v); }

  export(): void {
    csv('tickets.csv', ['number', 'subject', 'customer_name', 'contact_name', 'product_name', 'category_name', 'priority_label', 'stage_label',
      'sla_state', 'team_name', 'billable_label', 'contract_number', 'created_at', 'resolved_at'], this.rows.map(r => ({ ...r })));
  }
}
