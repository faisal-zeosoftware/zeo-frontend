import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { dmy } from '../shared-ui/z-present';   // v1.62.0 ui
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSET_BASE, AssetApiService, STATUS_CLASS, STATUS_LABEL, firstOfMonth, money } from './asset-api.service';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.16.0

interface QueueDef {
  title: string;
  intro: string;
  endpoint: string;
  tabs: { key: string; label: string }[];
  statusParam?: string;
}

const DEFS: Record<string, QueueDef> = {
  transfers: { title: 'Transfers', endpoint: 'transfers/', intro: 'Hand-overs between employees, locations and departments. Approving closes the current allocation and opens the new one.',
    tabs: [{ key: 'pending', label: 'Waiting for approval' }, { key: 'completed', label: 'Completed' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }] },
  returns: { title: 'Returns', endpoint: 'returns/', intro: 'Employees who asked to give an asset back. Open the asset and use “Receive back” to record the check list.',
    tabs: [{ key: 'requested', label: 'Requested' }, { key: 'completed', label: 'Returned' }, { key: '', label: 'All' }] },
  damages: { title: 'Damage', endpoint: 'damages/', intro: 'Decide who is responsible and how much is recovered. Payroll recovery creates monthly instalments for the deduction component (formula asset_recovery_amount).',
    tabs: [{ key: 'reported', label: 'Waiting for approval' }, { key: 'recovering', label: 'Being recovered' }, { key: 'closed', label: 'Closed' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }] },
  losses: { title: 'Lost and stolen', endpoint: 'losses/', intro: 'Lost or stolen assets with the police report and investigation. Mark an asset as found to put it back in the store and cancel open deductions.',
    tabs: [{ key: 'reported', label: 'Waiting for approval' }, { key: 'recovering', label: 'Being recovered' }, { key: 'closed', label: 'Closed' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }] },
  disposals: { title: 'Disposals', endpoint: 'disposals/', intro: 'Sale, scrap, donation or write-off. The gain or loss is the value received minus the book value on the disposal date.',
    tabs: [{ key: 'pending', label: 'Waiting for approval' }, { key: 'approved', label: 'Disposed' }, { key: 'rejected', label: 'Rejected' }, { key: '', label: 'All' }] },
  maintenance: { title: 'Maintenance', endpoint: 'maintenance/', intro: 'Repairs, preventive services and inspections. Plans that are due are listed first; open an asset to start or complete work.',
    tabs: [{ key: 'due', label: 'Plans due' }, { key: 'open', label: 'In maintenance' }, { key: 'closed', label: 'Completed' }, { key: '', label: 'All records' }] },
  allocations: { title: 'Allocations', endpoint: 'allocations/', intro: 'Who holds what. Filter the receipts employees have not confirmed yet and the assets that are overdue.',
    tabs: [{ key: 'open', label: 'Current' }, { key: 'pending', label: 'Receipt not confirmed' }, { key: 'overdue', label: 'Overdue' }, { key: '', label: 'All, incl. returned' }] },
  recoveries: { title: 'Recovery instalments', endpoint: 'recoveries/', intro: 'Monthly salary deductions for damage and loss. The payroll takes the instalments due with a deduction component whose formula is asset_recovery_amount.',
    tabs: [{ key: 'pending', label: 'To be deducted' }, { key: 'deducted', label: 'Deducted' }, { key: '', label: 'All' }] },
};

/** Work lists of the asset module (v1.12.0): transfers, returns, damage, loss, disposals, maintenance, allocations and recoveries. */
@Component({
  selector: 'app-asset-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../expense/expense.css', './asset-plus.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head"><div><h1 class="page-title">{{ d.title }}</h1><p class="ex-desc">{{ d.intro }}</p></div></div>
      <div class="ex-tabs"><button type="button" *ngFor="let t of d.tabs" [class.on]="tab === t.key" (click)="setTab(t.key)">{{ t.label }}</button></div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <!-- v1.16.0: a table, so the list tools (search, filters, group by, columns, saved views, exports) work here too -->
      <table class="table ap-queue" *ngIf="!loading && rows.length">
        <thead><tr><th *ngFor="let c of cols">{{ c.l }}</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let x of rows">
            <td *ngFor="let c of cols" [class.money]="c.money">{{ c.v(x) }}</td>
            <td><span class="ex-tag" [ngClass]="cls(x)">{{ statusText(x) }}</span></td>
            <td>
            <div class="ap-acts">
              <button type="button" class="ex-link" *ngIf="x.asset_id || x.asset" (click)="open(x.asset_id || x.asset)">Asset</button>
              <ng-container *ngIf="kind === 'transfers' && x.status === 'pending'">
                <button type="button" class="ex-link" *ngIf="r.transfer_approve" (click)="decide(x, 'approve')">Approve</button>
                <button type="button" class="ex-link" *ngIf="r.transfer_approve" (click)="decide(x, 'reject')">Reject</button>
                <button type="button" class="ex-link" (click)="decide(x, 'cancel')">Cancel</button></ng-container>
              <ng-container *ngIf="(kind === 'damages' || kind === 'losses') && x.status === 'reported' && (kind === 'damages' ? r.damage_approve : r.loss_approve)">
                <button type="button" class="ex-link" (click)="openDecision(x)">Decide</button>
                <button type="button" class="ex-link" (click)="decide(x, 'reject')">Reject</button></ng-container>
              <button type="button" class="ex-link" *ngIf="(kind === 'damages' || kind === 'losses') && x.status === 'recovering' && (kind === 'damages' ? r.damage_approve : r.loss_approve)"
                (click)="decide(x, 'cash-received')">Paid in cash</button>
              <ng-container *ngIf="kind === 'losses' && r.loss_add && !x.found_on && x.status !== 'rejected'">
                <button type="button" class="ex-link" (click)="investigate(x)">Investigation</button>
                <button type="button" class="ex-link" (click)="decide(x, 'found')">Mark as found</button></ng-container>
              <ng-container *ngIf="kind === 'disposals' && x.status === 'pending'">
                <button type="button" class="ex-link" *ngIf="r.disposal_approve" (click)="decide(x, 'approve')">Approve</button>
                <button type="button" class="ex-link" *ngIf="r.disposal_approve" (click)="decide(x, 'reject')">Reject</button>
                <button type="button" class="ex-link" (click)="decide(x, 'cancel')">Cancel</button></ng-container>
              <button type="button" class="ex-link" *ngIf="kind === 'returns' && x.status === 'requested'" (click)="decide(x, 'cancel')">Cancel</button>
            </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="ex-muted" *ngIf="!loading && !rows.length">Nothing here.</p>
    </div>
  </div>
</div>

<div class="ex-back" *ngIf="dec" (click)="dec = null">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <header><h2>Decide {{ dec.number }}</h2><button type="button" (click)="dec = null" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="err">{{ err }}</p>
      <p class="ex-muted">{{ dec.asset }} · {{ dec.description }}<span *ngIf="dec.book_value"> · book value {{ m(dec.book_value) }}</span></p>
      <div class="ex-form">
        <label>Responsibility<select [(ngModel)]="f.responsibility" name="r"><option value="company">Company</option><option value="employee">Employee</option>
          <option value="shared">Shared (employee pays part)</option><option value="third_party">Third party / insurance</option></select></label>
        <label>Employee<select [(ngModel)]="f.employee" name="e"><option [ngValue]="null">{{ dec.employee || '–' }}</option>
          <option *ngFor="let e of lk.employees" [ngValue]="e.id">{{ e.name }}</option></select></label>
        <label *ngIf="kind === 'damages'">Repair cost<input type="number" min="0" step="0.01" [(ngModel)]="f.repair_cost" name="rc"></label>
        <label>Recover from the employee<input type="number" min="0" step="0.01" [(ngModel)]="f.recovery_amount" name="ra" [disabled]="f.responsibility === 'company' || f.responsibility === 'third_party'"></label>
        <label>How<select [(ngModel)]="f.recovery_method" name="rm"><option value="none">No recovery</option><option value="payroll">Salary deduction</option>
          <option value="cash">Paid in cash</option><option value="waived">Waived</option></select></label>
        <ng-container *ngIf="f.recovery_method === 'payroll'">
          <label>Instalments<input type="number" min="1" max="60" [(ngModel)]="f.instalments" name="in"></label>
          <label>First payroll month<input type="month" [(ngModel)]="f.month" name="fm"></label>
          <div class="ex-calc" *ngIf="+f.recovery_amount > 0 && +f.instalments > 0">{{ f.instalments }} × {{ m(+f.recovery_amount / +f.instalments) }} from {{ f.month }}</div>
        </ng-container>
        <label *ngIf="kind === 'losses'">Investigation<select [(ngModel)]="f.investigation_status" name="is"><option value="investigating">Under investigation</option>
          <option value="closed_not_found">Closed – not found</option></select></label>
        <label class="wide">Note<textarea [(ngModel)]="f.note" name="n"></textarea></label>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="dec = null">Cancel</button>
      <button type="button" class="ex-btn primary" [disabled]="busy" (click)="approve()">Approve</button></footer>
  </div>
</div>`,
})
export class AssetQueueComponent implements OnInit {
  kind = 'transfers';
  d: QueueDef = DEFS['transfers'];
  tab = '';
  rows: any[] = [];
  r: any = {};
  lk: any = { employees: [] };
  loading = true;
  msg = ''; msgErr = false; err = ''; busy = false;
  dec: any = null;
  f: any = {};
  asset: string | null = null;
  cols: { l: string; v: (x: any) => string; money?: boolean }[] = [];   // v1.16.0: table columns of this list

  constructor(private api: AssetApiService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.kind = this.route.snapshot.data['kind'] || 'transfers';
    this.d = DEFS[this.kind];
    const qp = this.route.snapshot.queryParamMap;
    this.asset = qp.get('asset');
    this.tab = qp.get('status') ?? qp.get('ack') ?? this.d.tabs[0].key;
    if (this.asset && !qp.get('status')) this.tab = '';
    try { this.lk = await this.api.lookups(); this.r = this.lk.rights || {}; } catch { /* lists still load */ }
    await this.load();
  }

  setTab(k: string): void { this.tab = k; this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const q: any = { asset: this.asset };
      if (this.kind === 'maintenance' && this.tab === 'due') {
        this.rows = await this.api.get('schedules/', { due: 1, asset: this.asset });
      } else if (this.kind === 'allocations') {
        if (this.tab === 'open') q.open = 1;
        if (this.tab === 'pending') { q.open = 1; q.ack = 'pending'; q.shared = 0; }
        if (this.tab === 'overdue') { q.open = 1; q.overdue = 1; q.shared = 0; }
        this.rows = await this.api.get(this.d.endpoint, q);
      } else {
        if (this.tab) q.status = this.tab;
        this.rows = await this.api.get(this.d.endpoint, q);
      }
    } catch (e: any) {
      this.rows = [];
      this.msg = AssetApiService.error(e, 'The list could not be loaded.');
      this.msgErr = true;
    }
    this.cols = this.colsFor();
    this.loading = false;
    this.cd.markForCheck();
  }

  /** v1.16.0: the columns of each work list (the cards became table rows). */
  private colsFor(): { l: string; v: (x: any) => string; money?: boolean }[] {
    const dt = (v: any) => { if (!v) { return ''; } const d = new Date(String(v).length <= 10 ? v + 'T00:00:00' : v); return isNaN(d.getTime()) ? String(v) : dmy(d); };   // v1.62.0 ui
    const mon = (v: any) => { if (!v) { return ''; } const d = new Date(String(v).slice(0, 10) + 'T00:00:00'); return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); };
    const t = (v: any) => (v === null || v === undefined ? '' : String(v));
    const m = (v: any) => (v === null || v === undefined || v === '' ? '' : this.m(v));
    switch (this.kind) {
      case 'transfers': return [{ l: 'Number', v: x => t(x.number) }, { l: 'Asset', v: x => t(x.asset) }, { l: 'From', v: x => t(x.from) }, { l: 'To', v: x => t(x.to) },
        { l: 'Transfer date', v: x => dt(x.transfer_date) }, { l: 'Reason', v: x => t(x.reason) }, { l: 'Requested by', v: x => t(x.requested_by) }, { l: 'Decision note', v: x => t(x.decision_note) }];
      case 'returns': return [{ l: 'Number', v: x => t(x.number) }, { l: 'Asset', v: x => t(x.asset) }, { l: 'Employee', v: x => t(x.employee) }, { l: 'Wanted on', v: x => dt(x.preferred_date) },
        { l: 'Request note', v: x => t(x.request_note) }, { l: 'Returned on', v: x => dt(x.return_date) }, { l: 'Condition', v: x => t(x.condition) }, { l: 'Missing items', v: x => t(x.missing_items) }];
      case 'maintenance': return this.tab === 'due'
        ? [{ l: 'Asset', v: x => t(x.asset_name) }, { l: 'Code', v: x => t(x.code) }, { l: 'Plan', v: x => t(x.title) }, { l: 'Every', v: x => `${t(x.interval_value)} ${t(x.interval_type)}`.trim() },
          { l: 'Next due', v: x => x.next_due_date ? dt(x.next_due_date) : (x.next_due_reading ? `at ${x.next_due_reading} (now ${x.meter_reading || '–'})` : '') }]
        : [{ l: 'Number', v: x => t(x.number) }, { l: 'Asset', v: x => t(x.asset) }, { l: 'Kind', v: x => t(x.kind_label) }, { l: 'Start', v: x => dt(x.start_date) },
          { l: 'End', v: x => x.end_date ? dt(x.end_date) : 'Open' }, { l: 'Vendor', v: x => t(x.vendor) }, { l: 'Description', v: x => t(x.description) }, { l: 'Cost', v: x => m(x.cost), money: true }];
      case 'allocations': return [{ l: 'Asset', v: x => t(x.asset) }, { l: 'Code', v: x => t(x.code) }, { l: 'Held by', v: x => t(x.employee || x.holder) }, { l: 'Since', v: x => dt(x.assigned_date) },
        { l: 'Back by', v: x => dt(x.expected_return_date) }, { l: 'Returned on', v: x => dt(x.returned_date) }, { l: 'Remarks', v: x => t(x.ack_condition_notes) }];
      case 'recoveries': return [{ l: 'Employee', v: x => t(x.employee) }, { l: 'Month', v: x => mon(x.month) }, { l: 'Record', v: x => t(x.number) }, { l: 'Source', v: x => t(x.source_type) },
        { l: 'Amount', v: x => m(x.amount), money: true }];
      case 'disposals': return [{ l: 'Number', v: x => t(x.number) }, { l: 'Asset', v: x => t(x.asset) }, { l: 'Code', v: x => t(x.code) }, { l: 'Method', v: x => t(x.method_label) },
        { l: 'Disposal date', v: x => dt(x.disposal_date) }, { l: 'Buyer', v: x => t(x.buyer) }, { l: 'Book value', v: x => m(x.book_value), money: true }, { l: 'Value received', v: x => m(x.value), money: true },
        { l: 'Gain or loss', v: x => x.result === 'none' ? 'No gain or loss' : `${x.result === 'loss' ? '-' : ''}${m(this.abs(x.gain_loss))}`, money: true }, { l: 'Reason', v: x => t(x.reason) }];
      default: return [{ l: 'Number', v: x => t(x.number) }, { l: 'Asset', v: x => t(x.asset) },
        { l: 'Kind', v: x => x.kind_of_record === 'damage' ? `${t(x.severity_label)} damage` : t(x.kind_label) }, { l: 'Date', v: x => dt(x.damage_date || x.loss_date) },
        { l: 'Employee', v: x => t(x.employee) }, { l: 'Description', v: x => t(x.description) },
        ...(this.kind === 'losses' ? [{ l: 'Police report', v: (x: any) => t(x.police_report_no) }, { l: 'Investigation', v: (x: any) => t(x.investigation_label) }]
          : [{ l: 'Repair cost', v: (x: any) => m(x.repair_cost), money: true }]),
        { l: 'To recover', v: x => +x.recovery_amount ? m(x.recovery_amount) : '', money: true }, { l: 'Recovered', v: x => +x.recovery_amount ? m(x.recovered_amount) : '', money: true },
        { l: 'Recovery method', v: x => t(x.recovery_method_label) }];
    }
  }

  openDecision(x: any): void {
    this.err = '';
    this.dec = x;
    this.f = { responsibility: x.responsibility || 'company', employee: null, repair_cost: x.repair_cost, recovery_amount: 0, recovery_method: 'none',
      instalments: 1, month: firstOfMonth().slice(0, 7), investigation_status: 'investigating', note: '' };
  }

  async approve(): Promise<void> {
    this.err = '';
    this.busy = true;
    const body: any = { ...this.f, first_deduction_month: this.f.recovery_method === 'payroll' ? `${this.f.month}-01` : null };
    if (this.kind !== 'losses') delete body.investigation_status;
    try {
      await this.api.post(`${this.d.endpoint}${this.dec.id}/approve/`, body);
      this.dec = null;
      this.ok('Approved.');
    } catch (e: any) {
      this.err = AssetApiService.error(e, 'It could not be approved.');
    }
    this.busy = false;
    this.cd.markForCheck();
  }

  async decide(x: any, action: string): Promise<void> {
    let body: any = {};
    if (action === 'reject') {
      const note = prompt('Why is it rejected? (the requester sees this)');
      if (!note) return;
      body = { note };
    } else if (action === 'found') {
      const note = prompt('Where was it found? (optional)') ?? null;
      if (note === null) return;
      body = { note };
    } else if (!confirm(`${action === 'cash-received' ? 'Record that the rest was paid in cash' : action[0].toUpperCase() + action.slice(1)} ${x.number}?`)) {
      return;
    }
    try {
      await this.api.post(`${this.d.endpoint}${x.id}/${action}/`, body);
      this.ok('Done.');
    } catch (e: any) {
      this.msg = AssetApiService.error(e);
      this.msgErr = true;
      this.cd.markForCheck();
    }
  }

  async investigate(x: any): Promise<void> {
    const notes = prompt('Investigation update (what happened so far):');
    if (notes === null) return;
    const closed = confirm('Close the investigation as “not found”? (Cancel = keep it open)');
    try {
      await this.api.post(`losses/${x.id}/investigation/`, { investigation_status: closed ? 'closed_not_found' : 'investigating', notes });
      this.ok('Investigation updated.');
    } catch (e: any) { this.msg = AssetApiService.error(e); this.msgErr = true; this.cd.markForCheck(); }
  }

  ok(m: string): void { this.msg = m; this.msgErr = false; this.load(); }
  open(id: number): void { this.router.navigate([ASSET_BASE, 'register', id]); }
  m(v: any): string { return money(v); }
  abs(v: any): number { return Math.abs(+v || 0); }
  statusText(x: any): string {
    if (this.kind === 'maintenance' && x.title) return x.due === 'overdue' ? 'Overdue' : 'Due soon';
    if (this.kind === 'allocations') return x.open ? (x.overdue ? 'Overdue' : (STATUS_LABEL[x.ack_status] || 'Shared')) : 'Returned';
    return x.status_label || STATUS_LABEL[x.status] || x.status;
  }
  cls(x: any): string {
    if (this.kind === 'maintenance' && x.title) return x.due === 'overdue' ? 'rejected' : 'pending';
    if (this.kind === 'allocations') return x.open ? (x.overdue ? 'rejected' : (STATUS_CLASS[x.ack_status] || 'approved')) : 'closed';
    return STATUS_CLASS[x.status] || '';
  }
}
