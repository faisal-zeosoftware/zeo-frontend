import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EXPENSE_BASE, ExpenseApiService, STATUS_LABEL, isImage, money } from './expense-api.service';

/** Expense home (Zoho Expense style): tiles, quick actions, recent expenses, spend by category, approvals waiting for me. */
@Component({
  selector: 'app-expense-home',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./expense.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Expenses</h1>
          <p class="ex-desc">Record expenses as they happen, put them in a report and submit it for approval. Approved reports are reimbursed directly or with the payroll.</p>
        </div>
        <div class="ex-actions">
          <button type="button" class="ex-btn primary" (click)="go('expenses', { new: 1 })">+ New expense</button>
          <button type="button" class="ex-btn" (click)="go('reports', { new: 1 })">+ New report</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg err" *ngIf="msg">{{ msg }}</p>
      <p class="ex-muted" *ngIf="loading">Loading…</p>
      <ng-container *ngIf="d">
        <div class="ex-tiles">
          <button type="button" class="ex-tile" (click)="go('expenses', { tab: 'unreported' })">
            <div class="lbl">Unreported expenses</div><div class="num">{{ d.unreported.count }}</div><div class="amt">{{ m(d.unreported.amount) }}</div></button>
          <button type="button" class="ex-tile t2" (click)="go('reports', { tab: 'submitted' })">
            <div class="lbl">Awaiting approval</div><div class="num">{{ d.awaiting_approval.count }}</div><div class="amt">{{ m(d.awaiting_approval.amount) }}</div></button>
          <button type="button" class="ex-tile t3" (click)="go('reports', { tab: 'approved' })">
            <div class="lbl">Awaiting reimbursement</div><div class="num">{{ d.awaiting_reimbursement.count }}</div><div class="amt">{{ m(d.awaiting_reimbursement.amount) }}</div></button>
          <button type="button" class="ex-tile t4" (click)="go('advances')">
            <div class="lbl">Advances</div><div class="num">{{ d.advances.count }}</div><div class="amt">{{ m(d.advances.outstanding) }} open</div></button>
        </div>

        <div class="ex-grid2">
          <div>
            <div class="ex-panel">
              <div class="ex-h">Recent expenses <button type="button" class="ex-link" (click)="go('expenses')">All expenses</button></div>
              <div class="ex-rows">
                <div class="ex-row click" *ngFor="let e of d.recent" (click)="go('expenses', { open: e.id })">
                  <div class="ex-thumb" [class.none]="!e.receipt">
                    <img *ngIf="img(e.receipt)" [src]="e.receipt" alt="Receipt">
                    <span *ngIf="e.receipt && !img(e.receipt)">PDF</span>
                    <span *ngIf="!e.receipt">—</span>
                  </div>
                  <div class="main">
                    <div class="t">{{ e.merchant || e.category_name }}</div>
                    <div class="s">{{ e.date | date:'dd MMM yyyy' }} · {{ e.category_name }}<span *ngIf="e.report_number"> · {{ e.report_number }}</span></div>
                  </div>
                  <div class="r">
                    <div class="money">{{ m(e.amount_aed) }}</div>
                    <span class="ex-tag" [ngClass]="e.status">{{ lbl(e.status) }}</span>
                    <span class="ex-flag block" *ngIf="e.has_block">policy</span>
                  </div>
                </div>
                <p class="ex-muted" *ngIf="!d.recent.length">No expenses yet. Use “+ New expense” to add your first one.</p>
              </div>
            </div>
          </div>
          <div>
            <div class="ex-panel">
              <div class="ex-h">Approvals waiting for you <span class="ex-tag pending" *ngIf="d.approvals.length">{{ d.approvals.length }}</span></div>
              <div class="ex-rows">
                <div class="ex-row click" *ngFor="let a of d.approvals" (click)="a.type === 'report' ? go('reports', { open: a.id }) : go('trips')">
                  <div class="main">
                    <div class="t">{{ a.number }} · {{ a.title }}</div>
                    <div class="s">{{ a.employee }} · {{ a.type === 'trip' ? 'Trip' : 'Report' }} · {{ a.submitted_at | date:'dd MMM' }}</div>
                  </div>
                  <div class="r"><div class="money">{{ m(a.total) }}</div></div>
                </div>
                <p class="ex-muted" *ngIf="!d.approvals.length">Nothing waits for you.</p>
              </div>
            </div>
            <div class="ex-panel">
              <div class="ex-h">Spend by category – this month <span class="ex-muted">{{ m(d.month_total) }}</span></div>
              <div class="ex-bar" *ngFor="let c of d.spend_by_category">
                <div class="top"><span>{{ c.label }}</span><b>{{ m(c.amount) }}</b></div>
                <div class="track"><div class="fill" [style.width.%]="pct(c.amount)"></div></div>
              </div>
              <p class="ex-muted" *ngIf="!d.spend_by_category.length">No spend this month.</p>
            </div>
            <div class="ex-panel" *ngIf="d.company">
              <div class="ex-h">Company (your branches)</div>
              <div class="ex-row click" (click)="go('reports', { tab: 'approved', scope: 'all' })">
                <div class="main"><div class="t">Ready to reimburse</div><div class="s">{{ d.company.to_reimburse.count }} report(s)</div></div>
                <div class="r money">{{ m(d.company.to_reimburse.amount) }}</div></div>
              <div class="ex-row click" (click)="go('reports', { tab: 'submitted', scope: 'all' })">
                <div class="main"><div class="t">In approval</div><div class="s">{{ d.company.in_approval.count }} report(s)</div></div>
                <div class="r money">{{ m(d.company.in_approval.amount) }}</div></div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class ExpenseHomeComponent implements OnInit {
  d: any = null; loading = false; msg = '';
  m = money;
  lbl = (s: string) => STATUS_LABEL[s] || s;
  img = isImage;

  constructor(private api: ExpenseApiService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try { this.d = await this.api.get('home/'); this.msg = ''; }
    catch (e: any) { this.msg = ExpenseApiService.error(e, 'Could not load the expense home.'); }
    this.loading = false; this.cd.detectChanges();
  }

  pct(v: any): number {
    const max = Math.max(...(this.d?.spend_by_category || []).map((c: any) => Number(c.amount)), 1);
    return Math.round((Number(v) / max) * 100);
  }

  go(page: string, query: Record<string, any> = {}): void {
    this.router.navigate([`${EXPENSE_BASE}/${page}`], { queryParams: query });
  }
}
