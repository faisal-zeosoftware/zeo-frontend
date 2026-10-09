import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ASSET_BASE, AssetApiService, STATUS_CLASS, STATUS_LABEL, firstOfMonth, money } from './asset-api.service';

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
  imports: [CommonModule, FormsModule],
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
      <div class="ex-rows" *ngIf="!loading">
        <div class="ex-row" *ngFor="let x of rows">
          <div class="main">
            <ng-container [ngSwitch]="kind">
              <ng-container *ngSwitchCase="'transfers'"><div class="t">{{ x.number }} · {{ x.asset }}</div>
                <div class="s">{{ x.from }} → {{ x.to }} · {{ x.transfer_date | date:'dd MMM yyyy' }} · {{ x.reason }} · by {{ x.requested_by }}<span *ngIf="x.decision_note"> · {{ x.decision_note }}</span></div></ng-container>
              <ng-container *ngSwitchCase="'returns'"><div class="t">{{ x.number }} · {{ x.asset }}</div>
                <div class="s">{{ x.employee }}<span *ngIf="x.preferred_date"> · wants {{ x.preferred_date | date:'dd MMM yyyy' }}</span><span *ngIf="x.request_note"> · {{ x.request_note }}</span>
                  <span *ngIf="x.return_date"> · returned {{ x.return_date | date:'dd MMM yyyy' }}, {{ x.condition }}<span *ngIf="x.missing_items">, missing {{ x.missing_items }}</span></span></div></ng-container>
              <ng-container *ngSwitchCase="'maintenance'">
                <ng-container *ngIf="x.title"><div class="t">{{ x.asset_name }} <span class="ap-code">{{ x.code }}</span> · {{ x.title }}</div>
                  <div class="s">Every {{ x.interval_value }} {{ x.interval_type }} · next {{ x.next_due_date ? (x.next_due_date | date:'dd MMM yyyy') : ('at ' + x.next_due_reading + ' (now ' + (x.meter_reading || '–') + ')') }}</div></ng-container>
                <ng-container *ngIf="!x.title"><div class="t">{{ x.number }} · {{ x.asset }} · {{ x.kind_label }}</div>
                  <div class="s">{{ x.start_date | date:'dd MMM yyyy' }} → {{ x.end_date ? (x.end_date | date:'dd MMM yyyy') : 'open' }}<span *ngIf="x.vendor"> · {{ x.vendor }}</span> · {{ x.description }}</div></ng-container></ng-container>
              <ng-container *ngSwitchCase="'allocations'"><div class="t">{{ x.asset }} <span class="ap-code">{{ x.code }}</span></div>
                <div class="s">{{ x.employee || x.holder }} · since {{ x.assigned_date | date:'dd MMM yyyy' }}<span *ngIf="x.expected_return_date"> · back by {{ x.expected_return_date | date:'dd MMM yyyy' }}</span>
                  <span *ngIf="x.returned_date"> · returned {{ x.returned_date | date:'dd MMM yyyy' }}</span><span *ngIf="x.ack_condition_notes"> · remarks: {{ x.ack_condition_notes }}</span></div></ng-container>
              <ng-container *ngSwitchCase="'recoveries'"><div class="t">{{ x.employee }} · {{ x.month | date:'MMM yyyy' }}</div>
                <div class="s">{{ x.number }} ({{ x.source_type }})</div></ng-container>
              <ng-container *ngSwitchCase="'disposals'"><div class="t">{{ x.number }} · {{ x.asset }} <span class="ap-code">{{ x.code }}</span></div>
                <div class="s">{{ x.method_label }} on {{ x.disposal_date | date:'dd MMM yyyy' }}<span *ngIf="x.buyer"> to {{ x.buyer }}</span> · book value {{ m(x.book_value) }} ·
                  <span class="ap-gl" [class.gain]="x.result === 'gain'" [class.loss]="x.result === 'loss'">{{ x.result === 'none' ? 'no gain or loss' : x.result + ' ' + m(abs(x.gain_loss)) }}</span> · {{ x.reason }}</div></ng-container>
              <ng-container *ngSwitchDefault><div class="t">{{ x.number }} · {{ x.asset }} · {{ x.kind_of_record === 'damage' ? x.severity_label + ' damage' : x.kind_label }}</div>
                <div class="s">{{ (x.damage_date || x.loss_date) | date:'dd MMM yyyy' }} · {{ x.employee || 'no employee' }} · {{ x.description }}
                  <span *ngIf="x.police_report_no"> · police {{ x.police_report_no }}</span><span *ngIf="x.investigation_label"> · {{ x.investigation_label | lowercase }}</span>
                  <span *ngIf="+x.recovery_amount"> · recover {{ m(x.recovery_amount) }} ({{ x.recovery_method_label | lowercase }}), recovered {{ m(x.recovered_amount) }}</span></div></ng-container>
            </ng-container>
          </div>
          <div class="r">
            <div class="money" *ngIf="kind === 'disposals'">{{ m(x.value) }}</div>
            <div class="money" *ngIf="kind === 'recoveries'">{{ m(x.amount) }}</div>
            <div class="money" *ngIf="kind === 'damages'">{{ m(x.repair_cost) }}</div>
            <div class="money" *ngIf="kind === 'maintenance' && !x.title">{{ m(x.cost) }}</div>
            <span class="ex-tag" [ngClass]="cls(x)">{{ statusText(x) }}</span>
            <div style="margin-top:4px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
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
          </div>
        </div>
        <p class="ex-muted" *ngIf="!rows.length">Nothing here.</p>
      </div>
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
    this.loading = false;
    this.cd.markForCheck();
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
