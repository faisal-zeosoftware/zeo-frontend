import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { PRIORITY_CLASS, STAGE_CLASS, ZP_BASE, ZpApiService, day, money, slaText, when } from './zp-api.service';
import { ZpNotifyComponent } from './zp-notify.component';

/** New / edit customer (v1.14.0). */
@Component({
  selector: 'app-zp-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(780px,100%)">
    <header><h2>{{ c?.id ? 'Edit ' + c.name : 'New customer' }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <label>Name *<input [(ngModel)]="f.name" maxlength="200"></label>
        <label>Code<input [(ngModel)]="f.code" [placeholder]="c?.id ? '' : 'Empty = next number'"></label>
        <label>TRN (VAT number)<input [(ngModel)]="f.trn"></label>
        <label>Branch<select [(ngModel)]="f.branch"><option [ngValue]="null">All branches</option>
          <option *ngFor="let b of lk.branches || []" [ngValue]="b.id">{{ b.name }}</option></select></label>
        <label>Account manager<select [(ngModel)]="f.account_manager"><option [ngValue]="null">–</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
        <label>E-mail<input type="email" [(ngModel)]="f.email"></label>
        <label>Phone<input [(ngModel)]="f.phone"></label>
        <label>Website<input [(ngModel)]="f.website"></label>
        <label>City<input [(ngModel)]="f.city"></label>
        <label class="wide">Address<textarea [(ngModel)]="f.address" rows="2"></textarea></label>
        <label class="wide">E-mail domains (for e-mail to ticket)<input [(ngModel)]="f.email_domains" placeholder="customer.ae, customer.com"></label>
        <label>Default SLA<select [(ngModel)]="f.default_sla"><option [ngValue]="null">Company default</option>
          <option *ngFor="let p of lk.sla_policies" [ngValue]="p.id">{{ p.name }}</option></select></label>
        <label class="ck" *ngIf="c?.id"><input type="checkbox" [(ngModel)]="f.is_active"> Active</label>
        <ng-container *ngIf="!c?.id">
          <div class="zp-section">Main contact</div>
          <label>Name<input [(ngModel)]="f.contact_name"></label>
          <label>E-mail<input type="email" [(ngModel)]="f.contact_email"></label>
          <label>Phone<input [(ngModel)]="f.contact_phone"></label>
        </ng-container>
        <label class="wide">Notes<textarea [(ngModel)]="f.notes" rows="2"></textarea></label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">Save</button></footer>
  </div>
</div>`,
})
export class ZpCustomerFormComponent implements OnInit {
  @Input() c: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { employees: [], sla_policies: [] };
  f: any = {};
  err = '';
  busy = false;
  constructor(private api: ZpApiService) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    const c = this.c || {};
    this.f = { name: c.name || '', code: c.code || '', trn: c.trn || '', email: c.email || '', phone: c.phone || '', website: c.website || '',
               address: c.address || '', city: c.city || '', email_domains: c.email_domains || '', notes: c.notes || '',
               account_manager: c.account_manager?.id || null, default_sla: c.default_sla || null, is_active: c.is_active !== false,
               branch: c.id ? (c.branch || null) : ((this.lk.branches || []).length === 1 ? this.lk.branches[0].id : null),   // v1.22.0
               contact_name: '', contact_email: '', contact_phone: '' };
  }

  async save(): Promise<void> {
    this.busy = true; this.err = '';
    try {
      const r = this.c?.id ? await this.api.patch(`customers/${this.c.id}/`, this.f) : await this.api.post('customers/', this.f);
      await this.api.lookups(true);
      this.saved.emit(r);
    } catch (e) { this.err = ZpApiService.error(e); }
    this.busy = false;
  }
}

/** Customers (v1.14.0). */
@Component({
  selector: 'app-zp-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpCustomerFormComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">Customers</h1>
          <p class="ex-desc">Customer companies with their contacts, AMC contracts, tickets and projects. Contacts can get a customer portal login.</p></div>
        <div class="ex-actions"><button type="button" class="ex-btn primary" *ngIf="rights.customer_edit" (click)="creating = true">+ New customer</button></div>
      </div>
      <div class="zp-filters">
        <input type="search" [(ngModel)]="q" (ngModelChange)="soon()" placeholder="Search name, code, e-mail, contact…" aria-label="Search">
        <label class="ck"><input type="checkbox" [(ngModel)]="inactive" (ngModelChange)="load()"> Show inactive</label>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <!-- v1.22.0: the HRMS list (search, Branch and other filters, group by, export, views) -->
      <div class="zp-scroll"><table class="zp-table zl-zp">
        <thead><tr><th>Customer</th><th>Code</th><th>Branch</th><th>E-mail</th><th>Phone</th><th>Account manager</th><th class="r">Open tickets</th><th>AMC</th><th>Status</th></tr></thead>
        <tbody><tr class="click" *ngFor="let c of rows" (click)="open(c.id)">
          <td><b>{{ c.name }}</b></td><td><span class="zp-code">{{ c.code }}</span></td><td>{{ c.branch_name }}</td>
          <td>{{ c.email }}</td><td>{{ c.phone }}</td><td>{{ c.account_manager?.name }}</td>
          <td class="r">{{ c.open_tickets }}</td><td>{{ c.contracts_active ? 'AMC' : '' }}</td><td>{{ c.is_active ? 'Active' : 'Inactive' }}</td>
        </tr></tbody>
      </table></div>
      <p class="zp-empty" *ngIf="!rows.length && !loading">No customers yet.</p>
    </div>
  </div>
</div>
<app-zp-customer-form *ngIf="creating" (closed)="creating = false" (saved)="creating = false; open($event.id)"></app-zp-customer-form>`,
})
export class ZpCustomersComponent implements OnInit {
  rows: any[] = [];
  rights: any = {};
  q = '';
  inactive = false;
  loading = true;
  creating = false;
  msg = '';
  private timer: any;
  constructor(private api: ZpApiService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.rights = (await this.api.lookups().catch(() => ({ rights: {} }))).rights || {};
    await this.load();
  }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }
  async load(): Promise<void> {
    this.loading = true;
    try { const r = await this.api.get('customers/', { q: this.q, active: this.inactive ? '0' : '1', limit: 1000 }); this.rows = r.results; this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
    this.loading = false;
  }
  open(id: number): void { this.router.navigate([ZP_BASE, 'customers', id]); }
}

/** One customer (v1.14.0): contacts and portal logins, contracts, tickets, projects. */
@Component({
  selector: 'app-zp-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpCustomerFormComponent, ZpNotifyComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head" *ngIf="c">
        <div><button type="button" class="ex-btn sm" (click)="go(['customers'])">← Customers</button>
          <h1 class="page-title" style="margin-top:8px">{{ c.name }} <span class="zp-code">{{ c.code }}</span></h1>
          <p class="ex-desc">{{ c.email }} {{ c.phone }} {{ c.trn ? '· TRN ' + c.trn : '' }}</p></div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" *ngIf="c?.partner" (click)="router.navigate(['/main-sidebar/zeo-masters/r/partner', c.partner])">Business partner {{ c.partner_number }}</button>   <!-- v1.42.0 -->
          <button type="button" class="ex-btn" *ngIf="c" (click)="go(['reports', 'work-history'], { customer: c.id, from: yearStart() })">Work history</button>
          <button type="button" class="ex-btn" *ngIf="rights.ticket_add" (click)="go(['tickets'], { customer: c.id, new: 1 })">+ Ticket</button>
          <button type="button" class="ex-btn" *ngIf="rights.amc_edit" (click)="go(['contracts'], { customer: c.id, new: 1 })">+ AMC contract</button>
          <button type="button" class="ex-btn primary" *ngIf="rights.customer_edit" (click)="editing = true">Edit</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="zp-note ok" *ngIf="cred">
        Portal login for <b>{{ cred.name }}</b> – give these to the contact (also sent by e-mail):<br>
        Company code <b>{{ cred.company }}</b> · user name <b>{{ cred.username }}</b> · password <b>{{ cred.password }}</b>
        <div><button type="button" class="ex-btn sm" style="margin-top:6px" (click)="cred = null">Done</button></div>
      </div>
      <div class="zp-split" *ngIf="c">
        <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
          <div class="zp-card">
            <h3>Contacts</h3>
            <div class="zp-scroll"><table class="zp-table" zPlain>
              <tr><th>Name</th><th>E-mail / phone</th><th>Portal</th><th></th></tr>
              <tr *ngFor="let p of c.contact_list" [style.opacity]="p.is_active ? 1 : .5">
                <td><b>{{ p.name }}</b> <span class="zp-b" *ngIf="p.is_primary">Main</span><div class="zp-muted">{{ p.designation }}</div></td>
                <td>{{ p.email }}<div class="zp-muted">{{ p.phone }}</div></td>
                <td><span class="zp-b" [class.sla-ok]="p.portal_active">{{ p.portal ? (p.portal_active ? 'Active' : 'Off') : 'No login' }}</span>
                  <div class="zp-muted" *ngIf="p.portal">{{ p.portal_role === 'manager' ? 'All company tickets' : 'Own tickets' }}{{ p.portal_can_approve ? ' · approves' : '' }}</div></td>
                <td class="r"><div class="zp-acts" style="justify-content:flex-end">
                  <button type="button" class="ex-btn sm" *ngIf="rights.customer_edit" (click)="editContact(p)">Edit</button>
                  <ng-container *ngIf="rights.admin || rights.contact_portal || rights.ticket_manage">
                    <button type="button" class="ex-btn sm" *ngIf="!p.portal_active && p.is_active" (click)="portal(p, p.portal ? 'reset' : 'invite')">{{ p.portal ? 'Re-activate' : 'Invite to portal' }}</button>
                    <button type="button" class="ex-btn sm" *ngIf="p.portal_active" (click)="portal(p, 'reset')">Reset password</button>
                    <button type="button" class="ex-btn sm danger" *ngIf="p.portal_active" (click)="portal(p, 'disable')">Block</button>
                  </ng-container>
                </div></td>
              </tr>
            </table></div>
            <button type="button" class="ex-btn sm" style="margin-top:8px" *ngIf="rights.customer_edit && !ct" (click)="editContact(null)">+ Contact</button>
            <div class="ex-form" *ngIf="ct" style="margin-top:10px">
              <label>Name *<input [(ngModel)]="ct.name"></label>
              <label>Designation<input [(ngModel)]="ct.designation"></label>
              <label>E-mail<input type="email" [(ngModel)]="ct.email"></label>
              <label>Phone<input [(ngModel)]="ct.phone"></label>
              <label>Portal access<select [(ngModel)]="ct.portal_role"><option value="user">Own tickets</option><option value="manager">All company tickets</option></select></label>
              <label class="ck"><input type="checkbox" [(ngModel)]="ct.portal_can_approve"> May approve milestones, changes and development</label>
              <label class="ck"><input type="checkbox" [(ngModel)]="ct.is_primary"> Main contact</label>
              <label class="ck" *ngIf="ct.id"><input type="checkbox" [(ngModel)]="ct.is_active"> Active</label>
              <div class="wide zp-acts"><button type="button" class="ex-btn primary" (click)="saveContact()">Save contact</button><button type="button" class="ex-btn" (click)="ct = null">Cancel</button></div>
            </div>
          </div>
          <div class="zp-card">
            <h3>Tickets</h3>
            <div class="zp-scroll"><table class="zp-table" zPlain>
              <tr><th>Ticket</th><th>Priority</th><th>Stage</th><th>SLA</th><th>Created</th></tr>
              <tr class="click" *ngFor="let t of c.ticket_list" (click)="go(['tickets', t.id])">
                <td><span class="zp-code">{{ t.number }}</span> {{ t.subject }}</td>
                <td><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span></td>
                <td><span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span></td>
                <td><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></td>
                <td class="zp-muted">{{ w(t.created_at) }}</td></tr>
            </table></div>
            <p class="zp-empty" *ngIf="!c.ticket_list.length">No tickets.</p>
          </div>
          <div class="zp-card">
            <h3>Notifications for this customer</h3>
            <app-zp-notify scope="customer" [customerId]="c.id" [canEdit]="!!(rights.customer_edit || rights.admin)"></app-zp-notify>
          </div>
        </div>
        <div class="zp-side">
          <div class="zp-card">
            <h3>Customer</h3>
            <dl class="zp-kv">
              <dt>Account mgr</dt><dd>{{ c.account_manager?.name || '–' }}</dd>
              <dt>Address</dt><dd>{{ c.address }} {{ c.city }} {{ c.country }}</dd>
              <dt>Website</dt><dd>{{ c.website || '–' }}</dd>
              <dt>Mail domains</dt><dd>{{ c.email_domains || '–' }}</dd>
              <dt>Notes</dt><dd>{{ c.notes || '–' }}</dd>
            </dl>
          </div>
          <div class="zp-card">
            <h3>AMC contracts</h3>
            <div class="ex-row click" *ngFor="let k of c.contract_list" (click)="go(['contracts', k.id])">
              <div class="main"><div class="t"><span class="zp-code">{{ k.number }}</span> {{ k.title }}</div>
                <div class="s">{{ d(k.start_date) }} – {{ d(k.end_date) }} · {{ m(k.value, k.currency) }}</div></div>
              <div class="r"><span class="ex-tag">{{ k.status_label }}</span></div>
            </div>
            <p class="zp-empty" *ngIf="!c.contract_list.length">No contracts.</p>
          </div>
          <div class="zp-card">
            <h3>Projects</h3>
            <div class="ex-row click" *ngFor="let p of c.project_list" (click)="go(['projects', p.id])">
              <div class="main"><div class="t">{{ p.title }}</div><div class="s">{{ p.number }}</div></div></div>
            <p class="zp-empty" *ngIf="!c.project_list.length">No projects.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<app-zp-customer-form *ngIf="editing" [c]="c" (closed)="editing = false" (saved)="editing = false; load()"></app-zp-customer-form>`,
})
export class ZpCustomerComponent implements OnInit {
  c: any = null;
  rights: any = {};
  msg = '';
  editing = false;
  ct: any = null;
  cred: any = null;
  sc = STAGE_CLASS;
  pc = PRIORITY_CLASS;
  constructor(private api: ZpApiService, private route: ActivatedRoute, public router: Router) {}

  async ngOnInit(): Promise<void> {
    this.rights = (await this.api.lookups().catch(() => ({ rights: {} }))).rights || {};
    this.route.paramMap.subscribe(() => this.load());
  }
  async load(): Promise<void> {
    try { this.c = await this.api.get(`customers/${this.route.snapshot.paramMap.get('id')}/`); this.msg = ''; }
    catch (e) { this.msg = ZpApiService.error(e); }
  }
  editContact(p: any): void {
    this.ct = p ? { ...p } : { name: '', email: '', phone: '', designation: '', portal_role: 'user', portal_can_approve: false, is_primary: !this.c.contact_list.length, is_active: true };
  }
  async saveContact(): Promise<void> {
    try {
      if (this.ct.id) await this.api.patch(`contacts/${this.ct.id}/`, this.ct);
      else await this.api.post('contacts/', { ...this.ct, customer: this.c.id });
      this.ct = null; await this.load();
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  async portal(p: any, action: string): Promise<void> {
    if (action === 'disable' && !confirm(`Block the portal login of ${p.name}?`)) return;
    try {
      const r = await this.api.post(`contacts/${p.id}/portal/`, { action });
      this.cred = r.password ? r : null;
      await this.load();
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  go(path: any[], q?: any): void { this.router.navigate([ZP_BASE, ...path], q ? { queryParams: q } : {}); }
  yearStart(): string { return `${new Date().getFullYear()}-01-01`; }
  sla(t: any): string { return slaText(t); }
  w(v: any): string { return when(v); }
  d(v: any): string { return day(v); }
  m(v: any, c?: string): string { return money(v, c); }
}
