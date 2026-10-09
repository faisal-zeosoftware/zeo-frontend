import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EXPENSE_BASE, ExpenseApiService, STATUS_LABEL, money } from './expense-api.service';

/** Expense reports: list + detail (lines, policy flags, approval timeline, advance, amount to reimburse) with the actions of the user's role. */
@Component({
  selector: 'app-expense-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./expense.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Expense reports</h1>
          <p class="ex-desc">Submit a report for approval (reporting manager, then finance by default). Open advances are used first; the rest is reimbursed directly or with the payroll.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn" (click)="goExpenses()">My expenses</button>
          <button type="button" class="ex-btn primary" (click)="openNew()">+ New report</button>
        </div>
      </div>
      <div class="ex-tabs">
        <button type="button" *ngFor="let t of tabs" [class.on]="tab === t.key" (click)="setTab(t.key)">{{ t.label }}</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg" *ngIf="msg" [class.err]="msgErr">{{ msg }}</p>
      <div class="ex-split">
        <div class="ex-panel" *ngIf="!(narrow && cur)">
          <p class="ex-muted" *ngIf="loading">Loading…</p>
          <div class="ex-rows" *ngIf="!loading">
            <div class="ex-row click" *ngFor="let r of rows" [class.on]="cur?.id === r.id" (click)="open(r.id)">
              <div class="main">
                <div class="t">{{ r.title }}</div>
                <div class="s">{{ r.number }} · {{ r.employee_name }}</div>
                <div class="s" *ngIf="r.waiting_for">Waiting for {{ r.waiting_for }}</div>
              </div>
              <div class="r"><div class="money">{{ m(r.total) }}</div><span class="ex-tag" [ngClass]="r.status">{{ r.status_label }}</span></div>
            </div>
            <p class="ex-muted" *ngIf="!rows.length">No reports here.</p>
          </div>
        </div>

        <div class="ex-panel" *ngIf="cur">
          <button type="button" class="ex-link" *ngIf="narrow" (click)="cur = null" style="margin-bottom:8px">‹ Back to the list</button>
          <div class="ex-h" style="align-items:flex-start">
            <div style="min-width:0">
              <div style="font-size:16px">{{ cur.title }}</div>
              <div class="ex-muted">{{ cur.number }} · {{ cur.employee_name }}<span *ngIf="cur.trip_number"> · Trip {{ cur.trip_number }}</span>
                <span *ngIf="cur.from_date"> · {{ cur.from_date | date:'dd MMM' }} – {{ cur.to_date | date:'dd MMM yyyy' }}</span></div>
            </div>
            <span class="ex-tag" [ngClass]="cur.status">{{ cur.status_label }}</span>
          </div>
          <div class="ex-sum">
            <div><small>Total</small><b>{{ m(cur.total) }}</b></div>
            <div><small>Advance applied</small><b>{{ m(cur.advance_applied) }}</b></div>
            <div class="hl"><small>To reimburse</small><b>{{ m(cur.amount_to_reimburse) }}</b></div>
            <div><small>{{ cur.status === 'reimbursed' ? 'Reimbursed' : 'Payment' }}</small>
              <b style="font-size:13px">{{ cur.status === 'reimbursed' ? (cur.reimbursed_on | date:'dd MMM yyyy') : (cur.payroll_pending ? 'Next payroll' : '–') }}</b></div>
          </div>
          <p class="ex-muted" *ngIf="cur.reimbursement_reference">Reference: {{ cur.reimbursement_reference }}<span *ngIf="cur.reimburse_via"> ({{ cur.reimburse_via === 'payroll' ? 'payroll' : 'direct' }})</span></p>
          <p class="ex-muted" *ngIf="cur.can_edit && num(cur.outstanding_advances) > 0">You have {{ m(cur.outstanding_advances) }} of open advances – they are used when you submit.</p>

          <div class="ex-h" style="margin-top:14px">Expenses ({{ cur.lines.length }})
            <button type="button" class="ex-btn sm" *ngIf="cur.can_edit" (click)="openAddLines()">+ Add expenses</button></div>
          <div class="ex-rows">
            <div class="ex-row" *ngFor="let e of cur.lines">
              <div class="main">
                <div class="t">{{ e.merchant || e.category_name }}</div>
                <div class="s">{{ e.date | date:'dd MMM yyyy' }} · {{ e.category_name }}<span *ngIf="e.cost_center_name"> · {{ e.cost_center_name }}</span>
                  <span *ngIf="e.receipt"> · <a [href]="e.receipt" target="_blank" rel="noopener" class="ex-link">receipt</a></span>
                  <span *ngIf="!e.receipt"> · no receipt</span></div>
                <div class="s" *ngIf="e.description" style="white-space:normal">{{ e.description }}</div>
                <div><span class="ex-flag" [ngClass]="v.level" *ngFor="let v of e.policy_violations">{{ v.message }}</span></div>
              </div>
              <div class="r">
                <div class="money">{{ m(e.amount_aed) }}</div>
                <button type="button" class="ex-link" *ngIf="cur.can_edit && cur.is_own" (click)="editLine(e)">edit</button>
                <button type="button" class="ex-link" *ngIf="cur.can_edit" (click)="removeLine(e)" style="margin-left:6px;color:#b42318">remove</button>
              </div>
            </div>
            <p class="ex-muted" *ngIf="!cur.lines.length">No expenses yet – add some before submitting.</p>
          </div>
          <div *ngIf="cur.advances.length" style="margin-top:10px">
            <div class="ex-h">Advances used</div>
            <div class="ex-row" *ngFor="let a of cur.advances"><div class="main"><div class="t">{{ a.advance }}</div><div class="s">Advance of {{ m(a.advance_amount) }}</div></div>
              <div class="r money">− {{ m(a.amount) }}</div></div>
          </div>

          <div class="ex-h" style="margin-top:14px" *ngIf="cur.approvals.length">Approval</div>
          <ul class="ex-timeline" *ngIf="cur.approvals.length">
            <li *ngFor="let a of cur.approvals" [ngClass]="a.status">
              <span class="who">{{ a.approver || '–' }}</span> · {{ a.role_label }} · <span class="ex-tag" [ngClass]="a.status">{{ lbl(a.status) }}</span>
              <span *ngIf="cur.round > 1" class="ex-muted"> · round {{ a.round }}</span>
              <div class="ex-muted" *ngIf="a.acted_at">{{ a.acted_at | date:'dd MMM yyyy, HH:mm' }}<span *ngIf="a.acted_by && a.acted_by !== a.approver"> by {{ a.acted_by }}</span></div>
              <div *ngIf="a.note">“{{ a.note }}”</div>
            </li>
          </ul>

          <div class="ex-actbar">
            <button type="button" class="ex-btn primary" *ngIf="cur.can_submit" [disabled]="busy || !cur.lines.length" (click)="act('submit')">Submit for approval</button>
            <button type="button" class="ex-btn green" *ngIf="cur.can_approve" [disabled]="busy" (click)="act('approve')">Approve</button>
            <button type="button" class="ex-btn" *ngIf="cur.can_approve" [disabled]="busy" (click)="act('send_back')">Send back</button>
            <button type="button" class="ex-btn danger" *ngIf="cur.can_approve" [disabled]="busy" (click)="act('reject')">Reject</button>
            <button type="button" class="ex-btn primary" *ngIf="cur.can_reimburse" [disabled]="busy" (click)="openPay()">Reimburse</button>
            <button type="button" class="ex-btn danger" *ngIf="cur.can_edit && cur.status === 'draft'" [disabled]="busy" (click)="removeReport()">Delete report</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- new report -->
<div class="ex-back" *ngIf="creating" (click)="creating = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
    <header><h2>{{ creating === 'add' ? 'Add expenses' : 'New report' }}</h2><button type="button" (click)="creating = false" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="formErr">{{ formErr }}</p>
      <div class="ex-form" *ngIf="creating === 'new'">
        <label class="wide">Title *<input [(ngModel)]="nf.title" name="title" placeholder="e.g. Abu Dhabi site visits – October"></label>
        <label>Trip<select [(ngModel)]="nf.trip" name="trip"><option [ngValue]="null">–</option><option *ngFor="let t of trips" [ngValue]="t.id">{{ t.number }} – {{ t.purpose }}</option></select></label>
        <label>Notes<input [(ngModel)]="nf.notes" name="notes"></label>
      </div>
      <div class="ex-h" style="margin-top:12px">Unreported expenses</div>
      <div class="ex-rows">
        <label class="ex-row click" *ngFor="let e of unreported">
          <input type="checkbox" [checked]="pick.has(e.id)" (change)="pick.has(e.id) ? pick.delete(e.id) : pick.add(e.id)">
          <div class="main"><div class="t">{{ e.merchant || e.category_name }}</div><div class="s">{{ e.date | date:'dd MMM yyyy' }} · {{ e.category_name }}</div></div>
          <div class="r money">{{ m(e.amount_aed) }}</div>
        </label>
        <p class="ex-muted" *ngIf="!unreported.length">No unreported expenses.</p>
      </div>
    </div>
    <footer><span class="ex-muted" style="margin-right:auto">{{ pick.size }} selected · {{ m(pickTotal) }}</span>
      <button type="button" class="ex-btn" (click)="creating = false">Cancel</button>
      <button type="button" class="ex-btn primary" [disabled]="busy || (creating === 'new' ? !nf.title : !pick.size)" (click)="saveNew()">{{ creating === 'new' ? 'Create report' : 'Add' }}</button></footer>
  </div>
</div>

<!-- reimburse -->
<div class="ex-back" *ngIf="paying" (click)="paying = false">
  <div class="ex-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" style="width:min(480px,100%)">
    <header><h2>Reimburse {{ cur?.number }} – {{ m(cur?.amount_to_reimburse) }}</h2><button type="button" (click)="paying = false" aria-label="Close">×</button></header>
    <div class="body">
      <p class="ex-msg err" *ngIf="formErr">{{ formErr }}</p>
      <div class="ex-form">
        <label class="wide">Pay
          <select [(ngModel)]="pay.via" name="via"><option value="direct">Directly (bank transfer / cash / cheque)</option><option value="payroll">With the next payroll</option></select></label>
        <ng-container *ngIf="pay.via === 'direct'">
          <label>Reference *<input [(ngModel)]="pay.reference" name="ref" placeholder="Transfer / voucher no."></label>
          <label>Paid on<input type="date" [(ngModel)]="pay.date" name="date"></label>
        </ng-container>
        <p class="ex-muted wide" *ngIf="pay.via === 'payroll'">The amount is paid by a payroll component with the formula <code>expense_reimbursement_amount</code>; the report is marked reimbursed when the payslip is created.</p>
      </div>
    </div>
    <footer><button type="button" class="ex-btn" (click)="paying = false">Cancel</button>
      <button type="button" class="ex-btn primary" [disabled]="busy" (click)="reimburse()">Confirm</button></footer>
  </div>
</div>`,
})
export class ExpenseReportsComponent implements OnInit {
  tabs: { key: string; label: string }[] = [
    { key: 'mine', label: 'My reports' }, { key: 'draft', label: 'Drafts' }, { key: 'submitted', label: 'Awaiting approval' },
    { key: 'approved', label: 'Approved' }, { key: 'reimbursed', label: 'Reimbursed' }, { key: 'waiting', label: 'Waiting for me' },
  ];
  tab = 'mine'; scopeAll = false;
  rows: any[] = []; cur: any = null; unreported: any[] = []; trips: any[] = [];
  loading = false; busy = false; msg = ''; msgErr = false; formErr = '';
  creating: false | 'new' | 'add' = false; nf: any = {}; pick = new Set<number>();
  paying = false; pay: any = {};
  narrow = window.innerWidth <= 991;
  m = money; lbl = (s: string) => STATUS_LABEL[s] || s; num = (v: any) => Number(v || 0);

  constructor(private api: ExpenseApiService, private route: ActivatedRoute, private router: Router, private cd: ChangeDetectorRef) {}

  get pickTotal(): number { return this.unreported.filter(e => this.pick.has(e.id)).reduce((s, e) => s + Number(e.amount_aed), 0); }

  async ngOnInit(): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    this.tab = q.get('tab') || 'mine';
    this.scopeAll = q.get('scope') === 'all';
    try {
      const h: any = await this.api.get('home/');
      if (h.is_hr || h.is_finance) this.tabs.push({ key: 'all', label: 'All reports' });
    } catch { /* tabs stay personal */ }
    if (this.scopeAll && this.tab !== 'waiting') this.tab = this.tab === 'mine' ? 'all' : this.tab;
    await this.load();
    if (q.get('new')) this.openNew();
    if (Number(q.get('open'))) this.open(Number(q.get('open')));
  }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    const q: any = {};
    if (this.tab === 'waiting') q.waiting = 'me';
    else if (this.tab === 'all') { /* everything the user may see */ }
    else {
      if (!this.scopeAll) q.mine = 1;
      if (this.tab !== 'mine') q.status = this.tab === 'draft' ? 'draft,sent_back' : this.tab;
    }
    try { this.rows = await this.api.get('reports/', q); }
    catch (e: any) { this.rows = []; this.flash(ExpenseApiService.error(e, 'Could not load reports.'), true); }
    this.loading = false; this.cd.detectChanges();
  }

  setTab(t: string): void {
    this.tab = t; if (t === 'mine' || t === 'waiting') this.scopeAll = false;
    this.cur = null; this.load();
  }

  async open(id: number): Promise<void> {
    try { this.cur = await this.api.get(`reports/${id}/`); }
    catch (e: any) { this.flash(ExpenseApiService.error(e, 'Could not open the report.'), true); }
    this.cd.detectChanges();
  }

  goExpenses(): void { this.router.navigate([`${EXPENSE_BASE}/expenses`]); }

  editLine(e: any): void { this.router.navigate([`${EXPENSE_BASE}/expenses`], { queryParams: { open: e.id, tab: 'reported' } }); }

  async openNew(): Promise<void> {
    this.nf = { title: '', trip: null, notes: '' }; this.pick = new Set(); this.formErr = ''; this.creating = 'new';
    await this.loadPickers();
  }

  async openAddLines(): Promise<void> {
    this.pick = new Set(); this.formErr = ''; this.creating = 'add';
    await this.loadPickers(this.cur.employee_id);
  }

  private async loadPickers(employee?: number): Promise<void> {
    try {
      const q: any = { unreported: 1 };
      if (employee) q.employee = employee; else q.mine = 1;
      [this.unreported, this.trips] = await Promise.all([this.api.get('expenses/', q), this.api.get('trips/', { mine: 1, status: 'approved' })]);
    } catch { this.unreported = []; }
    this.cd.detectChanges();
  }

  async saveNew(): Promise<void> {
    this.busy = true; this.formErr = '';
    try {
      const r: any = this.creating === 'new'
        ? await this.api.post('reports/', { ...this.nf, expense_ids: [...this.pick] })
        : await this.api.post(`reports/${this.cur.id}/add_expenses/`, { expense_ids: [...this.pick] });
      this.creating = false; this.cur = r; await this.load();
    } catch (e: any) { this.formErr = ExpenseApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  async removeLine(e: any): Promise<void> {
    if (!confirm('Take this expense out of the report? It stays in your unreported expenses.')) return;
    await this.run(() => this.api.post(`reports/${this.cur.id}/remove_expense/`, { expense_id: e.id }), 'Expense taken out of the report.');
  }

  async act(action: 'submit' | 'approve' | 'reject' | 'send_back'): Promise<void> {
    let note = '';
    if (action === 'reject' || action === 'send_back') {
      note = prompt(action === 'reject' ? 'Reason for rejecting' : 'What should be corrected?') || '';
      if (!note.trim()) return;
    } else if (action === 'approve') {
      note = prompt('Note (optional)') ?? '';
    }
    const done = { submit: 'Report submitted for approval.', approve: 'Approved.', reject: 'Report rejected.', send_back: 'Report sent back to the employee.' }[action];
    await this.run(() => this.api.post(`reports/${this.cur.id}/${action}/`, { note }), done);
  }

  openPay(): void { this.pay = { via: 'direct', reference: '', date: new Date().toISOString().slice(0, 10) }; this.formErr = ''; this.paying = true; }

  async reimburse(): Promise<void> {
    this.busy = true; this.formErr = '';
    try {
      this.cur = await this.api.post(`reports/${this.cur.id}/reimburse/`, this.pay);
      this.paying = false;
      this.flash(this.pay.via === 'payroll' ? 'The report will be paid with the next payroll.' : 'Report reimbursed.', false);
      await this.load();
    } catch (e: any) { this.formErr = ExpenseApiService.error(e); }
    this.busy = false; this.cd.detectChanges();
  }

  async removeReport(): Promise<void> {
    if (!confirm('Delete this draft report? Its expenses go back to unreported.')) return;
    this.busy = true;
    try { await this.api.delete(`reports/${this.cur.id}/`); this.cur = null; this.flash('Report deleted.', false); await this.load(); }
    catch (e: any) { this.flash(ExpenseApiService.error(e), true); }
    this.busy = false; this.cd.detectChanges();
  }

  private async run(fn: () => Promise<any>, ok: string): Promise<void> {
    this.busy = true;
    try { this.cur = await fn(); this.flash(ok, false); await this.load(); }
    catch (e: any) { this.flash(ExpenseApiService.error(e), true); }
    this.busy = false; this.cd.detectChanges();
  }

  private flash(t: string, err: boolean): void { this.msg = t; this.msgErr = err; this.cd.detectChanges(); }
}
