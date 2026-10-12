import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list
import { ActivatedRoute, Router } from '@angular/router';
import { PRIORITY_CLASS, STAGE_CLASS, ZP_BASE, ZpApiService, csv, day, money, num, slaText, today, when } from './zp-api.service';

const STATUS_CLASS: Record<string, string> = { draft: 'draft', active: 'approved', expiring: 'pending', renewed: 'closed', expired: 'rejected', cancelled: 'rejected' };

/** New / edit AMC contract (v1.14.0). */
@Component({
  selector: 'app-zp-contract-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="ex-back" (click)="closed.emit()">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(860px,100%)">
    <header><h2>{{ c?.id ? 'Edit ' + c.number : 'New AMC contract' }}</h2><button type="button" (click)="closed.emit()" aria-label="Close">×</button></header>
    <div class="body">
      <p class="zp-note err" *ngIf="err">{{ err }}</p>
      <div class="ex-form">
        <label>Customer *<select [(ngModel)]="f.customer" [disabled]="c?.id"><option [ngValue]="null">Choose…</option>
          <option *ngFor="let x of lk.customers" [ngValue]="x.id">{{ x.name }}</option></select></label>
        <label>Title<input [(ngModel)]="f.title" placeholder="Annual maintenance – Odoo"></label>
        <label>Contract type<select [(ngModel)]="f.contract_type"><option *ngFor="let x of lk.contract_types" [value]="x.value">{{ x.label }}</option></select></label>
        <label>Support timing<select [(ngModel)]="f.support_timing"><option *ngFor="let x of lk.support_timing" [value]="x.value">{{ x.label }}</option></select></label>
        <label>Start date *<input type="date" [(ngModel)]="f.start_date"></label>
        <label>End date *<input type="date" [(ngModel)]="f.end_date"></label>
        <label>Contract value *<input type="number" min="0" [(ngModel)]="f.value"></label>
        <label>Billing<select [(ngModel)]="f.billing_frequency"><option *ngFor="let x of lk.billing_frequencies" [value]="x.value">{{ x.label }}</option></select></label>
        <label class="ck"><input type="checkbox" [(ngModel)]="f.unlimited_hours"> Unlimited support hours</label>
        <label *ngIf="!f.unlimited_hours">Included hours<input type="number" min="0" [(ngModel)]="f.included_hours"></label>
        <label *ngIf="!f.unlimited_hours">Of which onsite (0 = any)<input type="number" min="0" [(ngModel)]="f.onsite_hours"></label>
        <label>Rate for work outside the AMC (per hour)<input type="number" min="0" [(ngModel)]="f.hourly_rate_outside"></label>
        <label>SLA policy<select [(ngModel)]="f.sla_policy"><option [ngValue]="null">Customer / company default</option>
          <option *ngFor="let x of lk.sla_policies" [ngValue]="x.id">{{ x.name }}</option></select></label>
        <label>Account manager<select [(ngModel)]="f.account_manager"><option [ngValue]="null">–</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
        <div class="wide"><div style="font-size:12px;font-weight:600;color:#6b7185;margin-bottom:4px">Products / services covered (none ticked = everything)</div>
          <div class="zp-multi"><label *ngFor="let p of lk.products"><input type="checkbox" [checked]="f.products.includes(p.id)" (change)="toggle(p.id)"> {{ p.name }}</label></div></div>
        <label class="wide">Exclusions<textarea [(ngModel)]="f.exclusions" rows="2"></textarea></label>
        <label class="wide">Notes<textarea [(ngModel)]="f.notes" rows="2"></textarea></label>
        <label class="ck" *ngIf="!c?.id"><input type="checkbox" [(ngModel)]="f.activate"> Activate now (builds the billing schedule)</label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="closed.emit()">Cancel</button>
      <button type="button" class="ex-btn primary" (click)="save()" [disabled]="busy">Save</button></footer>
  </div>
</div>`,
})
export class ZpContractFormComponent implements OnInit {
  @Input() c: any = null;
  @Input() customerId: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  lk: any = { customers: [], contract_types: [], support_timing: [], billing_frequencies: [], sla_policies: [], employees: [], products: [] };
  f: any = { products: [] };
  err = '';
  busy = false;
  constructor(private api: ZpApiService) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    const c = this.c;
    const start = today();
    const end = new Date(new Date(start).setFullYear(new Date(start).getFullYear() + 1) - 86400000).toISOString().slice(0, 10);
    this.f = c ? { customer: c.customer, title: c.title, contract_type: c.contract_type, support_timing: c.support_timing, start_date: c.start_date,
                   end_date: c.end_date, value: c.value, billing_frequency: c.billing_frequency, unlimited_hours: c.unlimited_hours,
                   included_hours: c.included_hours, onsite_hours: c.onsite_hours, hourly_rate_outside: c.hourly_rate_outside, sla_policy: c.sla_policy,
                   account_manager: c.account_manager?.id || null, products: c.products.map((p: any) => p.id), exclusions: c.exclusions, notes: c.notes }
      : { customer: this.customerId ? Number(this.customerId) : null, title: '', contract_type: 'comprehensive', support_timing: 'business', start_date: start,
          end_date: end, value: 0, billing_frequency: 'annual', unlimited_hours: false, included_hours: 0, onsite_hours: 0, hourly_rate_outside: 0,
          sla_policy: null, account_manager: null, products: [], exclusions: 'New development, new implementations, hardware replacement, third-party services',
          notes: '', activate: true };
  }
  toggle(id: number): void { this.f.products = this.f.products.includes(id) ? this.f.products.filter((x: number) => x !== id) : this.f.products.concat([id]); }
  async save(): Promise<void> {
    this.busy = true; this.err = '';
    try { this.saved.emit(this.c?.id ? await this.api.patch(`contracts/${this.c.id}/`, this.f) : await this.api.post('contracts/', this.f)); }
    catch (e) { this.err = ZpApiService.error(e); }
    this.busy = false;
  }
}

/** AMC contracts and renewals (v1.14.0). Route data view = 'renewals' shows contracts to renew. */
@Component({
  selector: 'app-zp-contracts',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpContractFormComponent, ZListDirective],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div><h1 class="page-title">{{ renewals ? 'AMC renewals' : 'AMC contracts' }}</h1>
          <p class="ex-desc">{{ renewals ? 'Contracts ending in the next 90 days or already expired, with the renewal follow-up.' : 'Maintenance contracts with coverage, hours used and left, billing and renewal.' }}</p></div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" (click)="export()" [disabled]="!rows.length">Export CSV</button>
          <button type="button" class="ex-btn primary" *ngIf="rights.amc_edit" (click)="creating = true">+ New contract</button></div>
      </div>
      <div class="zp-filters">
        <input type="search" [(ngModel)]="f.q" (ngModelChange)="soon()" placeholder="Search number, title, customer…" aria-label="Search">
        <select [(ngModel)]="f.status" (ngModelChange)="load()" *ngIf="!renewals" aria-label="Status"><option value="">Any status</option>
          <option *ngFor="let s of lk.contract_status" [value]="s.value">{{ s.label }}</option></select>
        <select [(ngModel)]="f.customer" (ngModelChange)="load()" aria-label="Customer"><option value="">All customers</option>
          <option *ngFor="let c of lk.customers" [value]="c.id">{{ c.name }}</option></select>
        <select [(ngModel)]="f.expiring" (ngModelChange)="load()" *ngIf="!renewals" aria-label="Ends"><option value="">Any end date</option>
          <option value="30">Ends in 30 days</option><option value="60">Ends in 60 days</option><option value="90">Ends in 90 days</option></select>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <div class="zp-scroll"><table class="zp-table zl-zp">
        <tr><th>Contract</th><th>Customer</th><th>Branch</th><th>Period</th><th class="r">Value</th><th>Hours used</th><th>Status</th><th>Renewal</th></tr>
        <tr class="click" *ngFor="let c of rows" (click)="open(c.id)">
          <td><span class="zp-code">{{ c.number }}</span><div>{{ c.title }}</div><div class="zp-muted">{{ c.contract_type_label }} · v{{ c.version }}</div></td>
          <td>{{ c.customer_name }}</td><td>{{ c.branch_name }}</td>
          <td>{{ d(c.start_date) }} – {{ d(c.end_date) }}<div class="zp-muted" [style.color]="c.days_left < 0 ? '#b42318' : c.days_left <= 30 ? '#9a5b00' : null">{{ c.days_left >= 0 ? c.days_left + ' day(s) left' : -c.days_left + ' day(s) ago' }}</div></td>
          <td class="r">{{ m(c.value, c.currency) }}</td>
          <td style="min-width:140px"><ng-container *ngIf="c.usage">
            <ng-container *ngIf="!c.unlimited_hours; else unl"><div class="zp-meter" [ngClass]="(c.usage.used_pct || 0) > 100 ? 'bad' : (c.usage.used_pct || 0) > 80 ? 'warn' : 'ok'"><div [style.width.%]="min(c.usage.used_pct)"></div></div>
              <div class="zp-muted">{{ n(c.usage.used_hours) }} / {{ n(c.usage.included_hours) }} h</div></ng-container>
            <ng-template #unl><span class="zp-muted">Unlimited · {{ n(c.usage.used_hours) }} h</span></ng-template></ng-container></td>
          <td><span class="ex-tag" [ngClass]="cls[c.status]">{{ c.status_label }}</span></td>
          <td>{{ c.renewal_status_label }}<div class="zp-muted">{{ c.renewal_owner?.name }}</div></td>
        </tr>
      </table></div>
      <p class="zp-empty" *ngIf="!rows.length">No contracts match.</p>
    </div>
  </div>
</div>
<app-zp-contract-form *ngIf="creating" [customerId]="newFor" (closed)="creating = false" (saved)="creating = false; open($event.id)"></app-zp-contract-form>`,
})
export class ZpContractsComponent implements OnInit {
  rows: any[] = [];
  lk: any = { contract_status: [], customers: [] };
  rights: any = {};
  f: any = { q: '', status: '', customer: '', expiring: '' };
  renewals = false;
  creating = false;
  newFor: any = null;
  msg = '';
  cls = STATUS_CLASS;
  private timer: any;
  constructor(private api: ZpApiService, private router: Router, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    this.renewals = this.route.snapshot.data['view'] === 'renewals';
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('customer')) this.f.customer = qp.get('customer');
    if (qp.get('new')) { this.creating = true; this.newFor = qp.get('customer'); }
    this.lk = await this.api.lookups().catch(() => this.lk);
    this.rights = this.lk.rights || {};
    await this.load();
  }
  soon(): void { clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300); }
  async load(): Promise<void> {
    const q: any = { ...this.f, usage: 1, limit: 1000 };
    if (this.renewals) { q.status = 'active,expiring,expired'; q.renewal_status = 'none,in_progress,quoted'; }
    try {
      let rows = (await this.api.get('contracts/', q)).results;
      if (this.renewals) rows = rows.filter((c: any) => c.days_left <= 90 && c.days_left >= -90).sort((a: any, b: any) => a.days_left - b.days_left);
      this.rows = rows; this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  open(id: number): void { this.router.navigate([ZP_BASE, 'contracts', id]); }
  d(v: any): string { return day(v); }
  m(v: any, c?: string): string { return money(v, c); }
  n(v: any): string { return num(v); }
  min(v: any): number { return Math.min(100, Number(v || 0)); }
  export(): void {
    csv('amc-contracts.csv', ['number', 'customer_name', 'title', 'contract_type_label', 'start_date', 'end_date', 'value', 'currency', 'status_label', 'renewal_status_label', 'used', 'included'],
      this.rows.map(r => ({ ...r, used: r.usage?.used_hours, included: r.unlimited_hours ? 'unlimited' : r.usage?.included_hours })));
  }
}

/** One AMC contract (v1.14.0): coverage, hours, money, billing, tickets, renewal. */
@Component({
  selector: 'app-zp-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, ZpContractFormComponent],
  styleUrls: ['../expense/expense.css', './zp.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head" *ngIf="c">
        <div><button type="button" class="ex-btn sm" (click)="go(['contracts'])">← Contracts</button>
          <h1 class="page-title" style="margin-top:8px"><span class="zp-code">{{ c.number }}</span> {{ c.title }}</h1>
          <p class="ex-desc">{{ c.customer_name }} · {{ d(c.start_date) }} – {{ d(c.end_date) }} · <span class="ex-tag" [ngClass]="cls[c.status]">{{ c.status_label }}</span>
            <span *ngIf="c.previous_number"> · renews {{ c.previous_number }}</span></p></div>
        <div class="ex-actions">
          <button type="button" class="ex-btn green" *ngIf="c.status === 'draft' && rights.amc_edit" (click)="act('activate')">Activate</button>
          <button type="button" class="ex-btn" *ngIf="rights.amc_edit && c.status !== 'cancelled'" (click)="editing = true">Edit</button>
          <button type="button" class="ex-btn primary" *ngIf="rights.amc_renew && !c.renewals?.length && c.status !== 'draft' && c.status !== 'cancelled'" (click)="renewing = true">Renew</button>
          <button type="button" class="ex-btn danger" *ngIf="rights.amc_edit && (c.status === 'draft' || c.status === 'active')" (click)="cancel()">Cancel contract</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="zp-note err" *ngIf="msg">{{ msg }}</p>
      <ng-container *ngIf="c">
        <div class="ex-tiles">
          <div class="ex-tile"><div class="lbl">Hours used</div><div class="num">{{ n(c.usage.used_hours) }}</div>
            <div class="amt">{{ c.unlimited_hours ? 'unlimited' : 'of ' + n(c.usage.included_hours) + ' h · ' + n(c.usage.remaining_hours) + ' left' }}</div></div>
          <div class="ex-tile t3"><div class="lbl">Remote / onsite</div><div class="num">{{ n(c.usage.remote_hours) }} / {{ n(c.usage.onsite_hours) }}</div>
            <div class="amt">{{ c.usage.open_tickets }} open of {{ c.usage.tickets }} tickets</div></div>
          <div class="ex-tile t2"><div class="lbl">Revenue</div><div class="num" style="font-size:20px">{{ m(c.usage.revenue, c.currency) }}</div>
            <div class="amt">incl. {{ m(c.usage.outside_value, c.currency) }} outside the AMC</div></div>
          <div class="ex-tile t4"><div class="lbl">Margin</div><div class="num" style="font-size:20px">{{ m(c.usage.margin, c.currency) }}</div>
            <div class="amt">cost {{ m(c.usage.cost, c.currency) }}{{ c.usage.margin_pct !== null ? ' · ' + c.usage.margin_pct + '%' : '' }}</div></div>
        </div>
        <div class="zp-split" style="margin-top:14px">
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
            <div class="zp-card" *ngIf="!c.unlimited_hours">
              <h3>Entitlement</h3>
              <div class="zp-meter" [ngClass]="(c.usage.used_pct || 0) > 100 ? 'bad' : (c.usage.used_pct || 0) > 80 ? 'warn' : 'ok'"><div [style.width.%]="min(c.usage.used_pct)"></div></div>
              <p class="zp-muted" style="margin:6px 0 0">{{ c.usage.used_pct ?? 0 }}% of the included hours used. Work outside the coverage is chargeable at {{ m(c.hourly_rate_outside, c.currency) }} / h.</p>
            </div>
            <div class="zp-card" *ngIf="c.billing.length">
              <h3>Billing · {{ c.billing_frequency_label }}</h3>
              <div class="zp-scroll"><table class="zp-table" zPlain>
                <tr><th>Due</th><th>Period</th><th class="r">Amount</th><th>Status</th><th>Invoice</th><th></th></tr>
                <tr *ngFor="let b of c.billing">
                  <td>{{ d(b.due_date) }}</td><td class="zp-muted">{{ b.period_label }}</td><td class="r">{{ m(b.amount, b.currency) }}</td>
                  <td><span class="ex-tag" [ngClass]="b.status === 'paid' ? 'paid' : b.status === 'invoiced' ? 'closed' : 'draft'">{{ b.status_label }}</span></td>
                  <td>{{ b.invoice_no }}<div class="zp-muted">{{ d(b.invoice_date) }}</div></td>
                  <td class="r"><ng-container *ngIf="rights.billing_edit">
                    <button type="button" class="ex-btn sm" *ngIf="b.status === 'planned' || b.status === 'to_invoice'" (click)="invoice(b)">Invoiced</button>
                    <button type="button" class="ex-btn sm green" *ngIf="b.status === 'invoiced'" (click)="paid(b)">Paid</button></ng-container></td>
                </tr>
              </table></div>
            </div>
            <div class="zp-card">
              <h3>Tickets under this contract</h3>
              <div class="zp-scroll"><table class="zp-table" zPlain>
                <tr><th>Ticket</th><th>Priority</th><th>Stage</th><th>SLA</th><th>Billing</th></tr>
                <tr class="click" *ngFor="let t of c.tickets" (click)="go(['tickets', t.id])">
                  <td><span class="zp-code">{{ t.number }}</span> {{ t.subject }}<div class="zp-muted">{{ t.product_name }}</div></td>
                  <td><span class="zp-b" [ngClass]="pc[t.priority]">{{ t.priority_label }}</span></td>
                  <td><span class="zp-b" [ngClass]="sc[t.stage]">{{ t.stage_label }}</span></td>
                  <td><span class="zp-b" [ngClass]="'sla-' + t.sla_state">{{ sla(t) }}</span></td>
                  <td><span class="zp-b" [ngClass]="t.billable_status">{{ t.billable_label }}</span></td></tr>
              </table></div>
              <p class="zp-empty" *ngIf="!c.tickets.length">No tickets yet.</p>
            </div>
          </div>
          <div class="zp-side">
            <div class="zp-card" *ngIf="renewing">
              <h3>Renew</h3>
              <div class="ex-form" style="grid-template-columns:1fr">
                <label>New start<input type="date" [(ngModel)]="rn.start_date"></label>
                <label>New end (empty = same length)<input type="date" [(ngModel)]="rn.end_date"></label>
                <label>New value<input type="number" min="0" [(ngModel)]="rn.value"></label>
                <label *ngIf="!c.unlimited_hours">Included hours<input type="number" min="0" [(ngModel)]="rn.included_hours"></label>
                <label class="ck"><input type="checkbox" [(ngModel)]="rn.activate"> Activate the new contract now</label>
                <div class="zp-acts"><button type="button" class="ex-btn primary" (click)="renew()">Create renewal</button><button type="button" class="ex-btn" (click)="renewing = false">Cancel</button></div>
              </div>
            </div>
            <div class="zp-card" *ngIf="rights.amc_renew && c.status !== 'draft'">
              <h3>Renewal follow-up</h3>
              <div class="ex-form" style="grid-template-columns:1fr">
                <label>Status<select [(ngModel)]="fu.renewal_status"><option *ngFor="let x of lk.renewal_status" [value]="x.value">{{ x.label }}</option></select></label>
                <label>Owner<select [(ngModel)]="fu.renewal_owner"><option [ngValue]="null">Account manager</option>
                  <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }} ({{ e.code }})</option></select></label>
                <label>Quotation ref.<input [(ngModel)]="fu.renewal_quote_ref"></label>
                <label>Quoted value<input type="number" min="0" [(ngModel)]="fu.renewal_value"></label>
                <label *ngIf="fu.renewal_status === 'lost'">Why lost *<input [(ngModel)]="fu.lost_reason"></label>
                <label>Notes<textarea [(ngModel)]="fu.renewal_note" rows="2"></textarea></label>
                <button type="button" class="ex-btn" (click)="followUp()">Save follow-up</button>
              </div>
            </div>
            <div class="zp-card">
              <h3>Coverage</h3>
              <dl class="zp-kv">
                <dt>Type</dt><dd>{{ c.contract_type_label }}</dd>
                <dt>Products</dt><dd>{{ productNames() || 'Everything' }}</dd>
                <dt>SLA</dt><dd>{{ c.sla_policy_name || 'Default' }} · {{ c.support_timing === '24x7' ? '24/7' : 'business hours' }}</dd>
                <dt>Exclusions</dt><dd>{{ c.exclusions || '–' }}</dd>
                <dt>Value</dt><dd>{{ m(c.value, c.currency) }} · {{ c.billing_frequency_label }}</dd>
                <dt>Account mgr</dt><dd>{{ c.account_manager?.name || '–' }}</dd>
                <dt>Billed / paid</dt><dd>{{ m(c.usage.billed, c.currency) }} / {{ m(c.usage.paid, c.currency) }}</dd>
              </dl>
            </div>
            <div class="zp-card" *ngIf="c.history.length || c.renewals.length">
              <h3>Versions</h3>
              <div class="zp-ev" *ngFor="let r of c.renewals"><div class="t"><a href="javascript:void(0)" (click)="go(['contracts', r.id])">{{ r.number }}</a> (renewal)</div><div class="m">{{ d(r.start_date) }} – {{ d(r.end_date) }}</div></div>
              <div class="zp-ev" *ngFor="let r of c.history"><div class="t"><a href="javascript:void(0)" (click)="go(['contracts', r.id])">{{ r.number }}</a></div><div class="m">{{ d(r.start_date) }} – {{ d(r.end_date) }}</div></div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>
<app-zp-contract-form *ngIf="editing" [c]="c" (closed)="editing = false" (saved)="editing = false; load()"></app-zp-contract-form>`,
})
export class ZpContractComponent implements OnInit {
  c: any = null;
  lk: any = { renewal_status: [], employees: [] };
  rights: any = {};
  msg = '';
  editing = false;
  renewing = false;
  rn: any = {};
  fu: any = {};
  cls = STATUS_CLASS;
  sc = STAGE_CLASS;
  pc = PRIORITY_CLASS;
  constructor(private api: ZpApiService, private route: ActivatedRoute, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.lk = await this.api.lookups().catch(() => this.lk);
    this.rights = this.lk.rights || {};
    this.route.paramMap.subscribe(() => this.load());
  }
  async load(): Promise<void> {
    try {
      this.c = await this.api.get(`contracts/${this.route.snapshot.paramMap.get('id')}/`);
      this.fu = { renewal_status: this.c.renewal_status, renewal_owner: this.c.renewal_owner?.id || null, renewal_quote_ref: this.c.renewal_quote_ref,
                  renewal_value: this.c.renewal_value, renewal_note: this.c.renewal_note, lost_reason: this.c.lost_reason };
      this.rn = { start_date: '', end_date: '', value: this.c.renewal_value || this.c.value, included_hours: this.c.included_hours, activate: false };
      this.msg = '';
    } catch (e) { this.msg = ZpApiService.error(e); }
  }
  private async do(fn: () => Promise<any>): Promise<any> {
    try { const r = await fn(); await this.load(); return r; } catch (e) { this.msg = ZpApiService.error(e); return null; }
  }
  act(a: string): Promise<any> { return this.do(() => this.api.post(`contracts/${this.c.id}/${a}/`, {})); }
  cancel(): void { const reason = prompt('Why is the contract cancelled?'); if (reason !== null) this.do(() => this.api.post(`contracts/${this.c.id}/cancel/`, { reason })); }
  followUp(): Promise<any> { return this.do(() => this.api.post(`contracts/${this.c.id}/renewal/`, this.fu)); }
  async renew(): Promise<void> {
    const r = await this.do(() => this.api.post(`contracts/${this.c.id}/renew/`, this.rn));
    if (r?.id) { this.renewing = false; this.go(['contracts', r.id]); }
  }
  invoice(b: any): void {
    const no = prompt('Invoice number'); if (!no) return;
    this.do(() => this.api.patch(`billing/${b.id}/`, { status: 'invoiced', invoice_no: no, invoice_date: today() }));
  }
  paid(b: any): Promise<any> { return this.do(() => this.api.patch(`billing/${b.id}/`, { status: 'paid', paid_date: today() })); }
  productNames(): string { return (this.c.products || []).map((p: any) => p.name).join(', '); }
  go(path: any[]): void { this.router.navigate([ZP_BASE, ...path]); }
  sla(t: any): string { return slaText(t); }
  d(v: any): string { return day(v); }
  w(v: any): string { return when(v); }
  m(v: any, c?: string): string { return money(v, c); }
  n(v: any): string { return num(v); }
  min(v: any): number { return Math.min(100, Number(v || 0)); }
}
