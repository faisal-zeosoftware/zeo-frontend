/**
 * v1.62.0 payroll – Payroll runs: the monthly payroll workspace. One card per run (month, branches) with its stage
 * (Draft → Calculated → Checked → Sent for approval → Approved → WPS file made → Paid → Posted to accounting), headcount,
 * gross, deductions, net, change against the previous month and who prepared it. "New payroll run" opens a dialog; the run
 * is created and calculated by the existing API (payroll/api/PayrollRun/) exactly as before.
 * API: payroll-plus/api/workspace/runs/?year=   (read-only summary)
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MONTHS, PayStepsComponent, apiUrl, errText, wsUrl } from './pay162';

@Component({
  selector: 'app-payroll-runs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PayStepsComponent],
  styleUrls: ['../leave-policy/leave-policy.css', './pay162.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="py-wrap py-head">
        <div>
          <h1 class="page-title">Payroll runs</h1>
          <p class="lp-desc">Each month's salary from calculation to payment: check the exceptions, send the payslips for approval, make the WPS file, release the payslips and post the journal.</p>
        </div>
        <div class="py-tools">
          <select class="py-sel" [(ngModel)]="year" (ngModelChange)="load()" aria-label="Year" data-py-year>
            <option *ngFor="let y of years" [ngValue]="y">{{ y }}</option>
          </select>
          <select class="py-sel" [(ngModel)]="branch" aria-label="Branch">
            <option value="">All branches</option>
            <option *ngFor="let b of branchNames()" [value]="b">{{ b }}</option>
          </select>
          <button type="button" class="py-btn primary" *ngIf="canAdd" (click)="openNew()" data-py-new>+ New payroll run</button>
        </div>
      </div>
    </div>

    <div class="com_list mt-4">
      <p class="py-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>
      <div class="py-runs" *ngIf="shown().length" data-py-runs>
        <ng-container *ngFor="let r of shown(); let i = index">
          <div class="py-month" *ngIf="i === 0 || shown()[i - 1].period !== r.period">{{ r.period }}</div>
          <button type="button" class="py-run" (click)="open(r)" [attr.data-py-run]="r.id">
            <div>
              <div class="ttl">{{ r.name || r.period }}</div>
              <div class="meta">{{ r.branches.join(' · ') || '–' }}</div>
              <div class="meta"><span class="py-pill" [class.info]="r.kind !== 'regular'">{{ r.kind_label }}</span>
                <span *ngIf="r.payment_date"> · <span>Pay date</span> {{ r.payment_date | date:'dd/MM/yyyy' }}</span></div>
            </div>
            <div class="stg">
              <py-steps [steps]="r.steps" [mini]="true"></py-steps>
              <div class="txt" [class.done]="r.stage === 'done'" data-py-stage>{{ r.stage_text }}</div>
              <div class="py-muted" *ngIf="r.prepared_by"><span>Prepared by</span> {{ short(r.prepared_by) }}</div>
            </div>
            <div class="fig"><span>Employees</span><b>{{ r.headcount }}</b></div>
            <div class="fig opt"><span>Gross (AED)</span><b>{{ r.gross | number:'1.2-2' }}</b></div>
            <div class="fig opt"><span>Deductions (AED)</span><b>{{ r.deductions | number:'1.2-2' }}</b></div>
            <div class="fig"><span>Net pay (AED)</span><b>{{ r.net | number:'1.2-2' }}</b></div>
            <div class="fig"><span>vs last month</span>
              <b *ngIf="r.change_pct !== null && r.change_pct !== undefined" class="py-chg" [class.up]="r.change_pct > 0" [class.down]="r.change_pct < 0">
                {{ r.change_pct > 0 ? '▲' : r.change_pct < 0 ? '▼' : '' }} {{ (r.change_pct | number:'1.1-1') }} %</b>
              <b *ngIf="r.change_pct === null || r.change_pct === undefined" class="py-muted">{{ r.kind === 'regular' ? 'First month' : 'Off-cycle' }}</b>
              <small class="py-muted" *ngIf="r.previous" style="display:block">{{ r.previous.period }}</small>
            </div>
          </button>
        </ng-container>
      </div>
      <div class="py-empty" *ngIf="!loading && !shown().length">
        <b>No payroll runs for {{ year }}{{ branch ? ' – ' + branch : '' }}</b>
        <p>Start the month with “New payroll run”: ZEO calculates every payslip from the salaries, attendance, leave, loans and overtime.</p>
      </div>
      <p class="py-muted" style="margin-top:14px">The previous screen with the trial and final pay sheets is still available:
        <a class="py-link" routerLink="/main-sidebar/salary-options/pay-roll-classic">Classic pay sheets</a>.</p>
    </div>
  </div>
</div>

<div class="py-dlg-back" *ngIf="dlg" (click)="dlg = false" data-py-dialog>
  <div class="py-dlg" role="dialog" aria-modal="true" aria-labelledby="pyNewT" (click)="$event.stopPropagation()">
    <header>
      <div><h2 id="pyNewT">New payroll run</h2>
        <p>ZEO calculates the payslips of every active employee who matches – the run opens as soon as it is calculated.</p></div>
      <button type="button" class="py-x" (click)="dlg = false" aria-label="Close">×</button>
    </header>
    <div class="body">
      <p class="py-msg err" *ngIf="dlgErr" role="alert">{{ dlgErr }}</p>
      <div class="py-form">
        <label>Month *
          <select [(ngModel)]="f.month" (ngModelChange)="autoName()" data-py-month>
            <option *ngFor="let m of months; let i = index" [ngValue]="i + 1">{{ m }}</option></select></label>
        <label>Year *
          <input type="number" [(ngModel)]="f.year" (ngModelChange)="autoName()" min="2000" max="2100" data-py-fyear></label>
        <label>Payment date
          <input type="text" inputmode="numeric" placeholder="dd/mm/yyyy" maxlength="10" [(ngModel)]="f.pay_txt" (ngModelChange)="payTouched = true; parsePay()" data-py-paydate>
          <span class="hint" [class.py-neg]="payBad">{{ payBad ? 'Enter the date as dd/mm/yyyy' : wpsHint() }}</span></label>
        <label>Name of the run
          <input type="text" [(ngModel)]="f.name" (input)="nameTouched = true" data-py-name>
          <span class="hint">Shown on the payslips and the WPS list.</span></label>
      </div>
      <div class="py-sec">Who is paid</div>
      <div class="py-form four">
        <label>Branch *
          <select multiple [(ngModel)]="f.branches" (ngModelChange)="autoName()" data-py-branches>
            <option *ngFor="let b of opts.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
        <label>Department
          <select multiple [(ngModel)]="f.departments"><option *ngFor="let x of opts.departments" [ngValue]="x.id">{{ x.name }}</option></select>
          <span class="hint">None chosen = all</span></label>
        <label>Category
          <select multiple [(ngModel)]="f.categories"><option *ngFor="let x of opts.categories" [ngValue]="x.id">{{ x.name }}</option></select>
          <span class="hint">None chosen = all</span></label>
        <label>Designation
          <select multiple [(ngModel)]="f.designations"><option *ngFor="let x of opts.designations" [ngValue]="x.id">{{ x.name }}</option></select>
          <span class="hint">None chosen = all</span></label>
      </div>
    </div>
    <footer>
      <button type="button" class="py-btn" (click)="dlg = false">Cancel</button>
      <button type="button" class="py-btn primary" [disabled]="busy || payBad || !f.branches.length || !f.month || !f.year" (click)="create()" data-py-create>
        {{ busy ? 'Calculating…' : 'Calculate payroll' }}</button>
    </footer>
  </div>
</div>`,
})
export class PayrollRunsComponent implements OnInit {
  runs: any[] = [];
  years: number[] = [new Date().getFullYear()];
  year = new Date().getFullYear();
  branch = '';
  canAdd = false;
  loading = true;
  msg = ''; msgErr = false;
  opts: any = { branches: [], departments: [], categories: [], designations: [] };
  months = MONTHS;
  dlg = false; dlgErr = ''; busy = false; nameTouched = false;
  f: any = this.blank();

  constructor(private http: HttpClient, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      const d: any = await firstValueFrom(this.http.get(wsUrl('runs/', `&year=${this.year}`)));
      this.runs = d.runs || []; this.years = d.years || this.years; this.canAdd = !!d.can_add; this.opts = { ...this.opts, ...(d.options || {}) };
    } catch (e) { this.msg = errText(e, 'The payroll runs could not be loaded.'); this.msgErr = true; }
    this.loading = false; this.cd.markForCheck();
  }

  branchNames(): string[] { return Array.from(new Set(this.runs.flatMap(r => r.branches || []))).sort(); }
  shown(): any[] { return this.branch ? this.runs.filter(r => (r.branches || []).includes(this.branch)) : this.runs; }
  short(n: string): string { return (n || '').split(' (')[0]; }
  open(r: any): void { this.router.navigate(['/main-sidebar/salary-options/payroll-run', r.id]); }

  blank(): any {
    const d = new Date(); const m = d.getMonth() + 1; const y = d.getFullYear();
    const pay = new Date(y, m - 1, 28);
    return { month: m, year: y, payment_date: `${y}-${String(m).padStart(2, '0')}-${String(pay.getDate()).padStart(2, '0')}`,
      pay_txt: `${String(pay.getDate()).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`, name: '',
      branches: [], departments: [], categories: [], designations: [] };
  }
  openNew(): void {
    this.f = this.blank(); this.nameTouched = false; this.payTouched = false; this.dlgErr = '';
    if (this.opts.branches.length === 1) { this.f.branches = [this.opts.branches[0].id]; }
    this.autoName(); this.dlg = true;
  }
  payTouched = false;
  autoName(): void {
    if (!this.payTouched && this.f.month && this.f.year) {   // the 28th of the salary month until the user types a date
      this.f.pay_txt = `28/${String(this.f.month).padStart(2, '0')}/${this.f.year}`; this.parsePay();
    }
    if (this.nameTouched) { return; }
    const names = this.opts.branches.filter((b: any) => this.f.branches.includes(b.id)).map((b: any) => b.name);
    const where = names.length === 1 ? names[0] : names.length > 1 && names.length === this.opts.branches.length ? 'All branches' : names.join(', ');
    this.f.name = `${MONTHS[(this.f.month || 1) - 1]} ${this.f.year}` + (where ? ` – ${where}` : '');
  }
  payBad = false;
  /** dd/mm/yyyy typed → ISO date for the API */
  parsePay(): void {
    const t = (this.f.pay_txt || '').trim();
    const mm = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
    if (!t) { this.f.payment_date = ''; this.payBad = false; return; }
    if (!mm) { this.payBad = t.length >= 8; this.f.payment_date = ''; return; }
    const d = new Date(+mm[3], +mm[2] - 1, +mm[1]);
    this.payBad = d.getDate() !== +mm[1] || d.getMonth() !== +mm[2] - 1;
    this.f.payment_date = this.payBad ? '' : `${mm[3]}-${mm[2].padStart(2, '0')}-${mm[1].padStart(2, '0')}`;
  }
  wpsHint(): string {
    if (!this.f.payment_date || !this.f.month || !this.f.year) { return ''; }
    const end = new Date(this.f.year, this.f.month, 0); const pay = new Date(this.f.payment_date);
    const days = Math.round((pay.getTime() - end.getTime()) / 86400000);
    return days > 15 ? 'later than 15 days after the month – late under WPS' : 'within the WPS deadline';
  }

  async create(): Promise<void> {
    this.busy = true; this.dlgErr = '';
    const body = { name: (this.f.name || '').slice(0, 100), year: Number(this.f.year), month: Number(this.f.month), payment_date: this.f.payment_date || null,
      branch_ids: this.f.branches, department: this.f.departments, category: this.f.categories, designation: this.f.designations, employees: [] };
    try {
      const r: any = await firstValueFrom(this.http.post(apiUrl('payroll/api/PayrollRun/'), body));
      this.dlg = false;
      this.router.navigate(['/main-sidebar/salary-options/payroll-run', r.id]);
    } catch (e) { this.dlgErr = errText(e, 'The payroll run could not be created.'); }
    this.busy = false; this.cd.markForCheck();
  }
}
