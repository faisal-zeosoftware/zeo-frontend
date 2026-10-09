import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseApiService, money } from './expense-api.service';

/** Spend analytics (category / department / employee / month) and the accounting export (journal, CSV). */
@Component({
  selector: 'app-expense-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./expense.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="ex-head">
        <div>
          <h1 class="page-title">Expense analytics & export</h1>
          <p class="ex-desc">Spend of submitted, approved and reimbursed expenses. The accounting export gives the journal of approved reports: expense accounts per category and cost centre against advances and employee payables.</p>
        </div>
        <div class="ex-actions ex-form" style="grid-template-columns:repeat(2,minmax(0,1fr));display:grid;gap:8px">
          <label>From<input type="date" [(ngModel)]="from" (ngModelChange)="load()" name="from"></label>
          <label>To<input type="date" [(ngModel)]="to" (ngModelChange)="load()" name="to"></label>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="ex-msg err" *ngIf="msg">{{ msg }}</p>
      <ng-container *ngIf="a">
        <div class="ex-tiles">
          <div class="ex-tile"><div class="lbl">Total spend</div><div class="num" style="font-size:20px">{{ m(a.total) }}</div><div class="amt">{{ a.count }} expense(s)</div></div>
          <div class="ex-tile t3" *ngIf="j"><div class="lbl">Journal</div><div class="num" style="font-size:20px">{{ j.reports }}</div><div class="amt">approved report(s)</div></div>
          <div class="ex-tile t4" *ngIf="j"><div class="lbl">Debit = credit</div><div class="num" style="font-size:20px">{{ m(j.debit) }}</div>
            <div class="amt">{{ j.balanced ? 'Balanced' : 'NOT balanced' }}</div></div>
          <div class="ex-tile t2" *ngIf="j"><div class="lbl">Export</div>
            <button type="button" class="ex-btn primary sm" style="margin-top:8px" (click)="csv()">Download CSV</button></div>
        </div>
        <div class="ex-grid2">
          <div class="ex-panel">
            <div class="ex-h">By category</div>
            <div class="ex-bar" *ngFor="let c of a.by_category"><div class="top"><span>{{ c.label }}</span><b>{{ m(c.amount) }}</b></div>
              <div class="track"><div class="fill" [style.width.%]="pct(a.by_category, c.amount)"></div></div></div>
            <p class="ex-muted" *ngIf="!a.by_category.length">No spend in this period.</p>
          </div>
          <div class="ex-panel">
            <div class="ex-h">By month</div>
            <div class="ex-bar" *ngFor="let c of a.by_month"><div class="top"><span>{{ c.label }}</span><b>{{ m(c.amount) }}</b></div>
              <div class="track"><div class="fill" [style.width.%]="pct(a.by_month, c.amount)"></div></div></div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">By department</div>
            <div class="ex-bar" *ngFor="let c of a.by_department"><div class="top"><span>{{ c.label }}</span><b>{{ m(c.amount) }}</b></div>
              <div class="track"><div class="fill" [style.width.%]="pct(a.by_department, c.amount)"></div></div></div>
          </div>
          <div class="ex-panel">
            <div class="ex-h">By employee (top 50)</div>
            <div class="ex-bar" *ngFor="let c of a.by_employee"><div class="top"><span>{{ c.label }}</span><b>{{ m(c.amount) }}</b></div>
              <div class="track"><div class="fill" [style.width.%]="pct(a.by_employee, c.amount)"></div></div></div>
          </div>
        </div>
        <div class="ex-panel" *ngIf="j?.lines?.length" style="margin-top:16px">
          <div class="ex-h">Journal lines</div>
          <div class="ex-rows">
            <div class="ex-row" *ngFor="let l of j.lines">
              <div class="main"><div class="t">{{ l.account }} · {{ l.description }}</div>
                <div class="s">{{ l.date | date:'dd/MM/yyyy' }} · {{ l.report }}<span *ngIf="l.cost_center"> · CC {{ l.cost_center }}</span></div></div>
              <div class="r"><div class="money" *ngIf="num(l.debit)">Dr {{ m(l.debit) }}</div><div class="money" *ngIf="num(l.credit)" style="color:#0b6a93">Cr {{ m(l.credit) }}</div></div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class ExpenseAnalyticsComponent implements OnInit {
  a: any = null; j: any = null; msg = '';
  from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);
  m = money; num = (v: any) => Number(v || 0);

  constructor(private api: ExpenseApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    try {
      this.a = await this.api.get('analytics/', { from: this.from, to: this.to }); this.msg = '';
    } catch (e: any) { this.msg = ExpenseApiService.error(e, 'Could not load the analytics.'); }
    try { this.j = await this.api.get('export/', { from: this.from, to: this.to }); } catch { this.j = null; }   // finance / HR only
    this.cd.detectChanges();
  }

  pct(list: any[], v: any): number {
    const max = Math.max(...list.map(x => Number(x.amount)), 1);
    return Math.round((Number(v) / max) * 100);
  }

  csv(): void {
    this.api.download('export/', { from: this.from, to: this.to, as: 'csv' }, `expense-journal-${this.from}-${this.to}.csv`)
      .catch(e => { this.msg = ExpenseApiService.error(e, 'Could not download.'); this.cd.detectChanges(); });
  }
}
