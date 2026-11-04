// v1.63.0 (items 27, 28): new screens – Payroll › Recoveries (list, form with the schedule preview, the recovery with its schedule,
// movements and history, Excel import) and Payroll › Salary splits (every employee's split, import, the WPS setting)
/**
 * v1.63.0 (items 27, 28) – one page with tabs (route data `tab`):
 *   recoveries   recovery schedules of any deduction: total, start month, N months or an amount per month, monthly cap, exit choice;
 *                pause / resume, settle early, write off, cancel; approval through the "Recovery schedule" approval levels
 *   rec-import   Excel import of recoveries (dry run, row errors)
 *   splits       salary split: the main account plus a second bank account / cash / cheque / own method, dated; the WPS setting
 *   split-import Excel import of splits (dry run, row errors)
 * API: /payroll-plus/api/recoveries/…, /payroll-plus/api/pay-splits/… (PayrollPlus/pay163_views.py).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';

const REC = '/payroll-plus/api/recoveries/';
const SPL = '/payroll-plus/api/pay-splits/';
const T = (s: string, p?: any[]) => i18nT(s, p);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dmy(d: any): string { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : (d ? String(d) : '–'); }
function empLabel(e: any): string {
  const n = [e.emp_first_name, e.emp_last_name].filter(Boolean).join(' ') || e.emp_name || '';
  return e.emp_code ? (n ? `${n} (${e.emp_code})` : e.emp_code) : n;
}
function monthOptions(back = 3, ahead = 18): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -back; i <= ahead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${T(MONTHS[d.getMonth()])} ${d.getFullYear()}` });
  }
  return out;
}
function errText(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || T('Request failed'); }
  if (typeof d === 'string') { return d.slice(0, 300); }
  return d.detail || Object.values(d).map((v: any) => Array.isArray(v) ? v.join(' ') : v).join(' ');
}
function fieldErrs(e: any): any {
  const d = e?.error || {};
  const out: any = {};
  for (const [k, x] of Object.entries(d)) { if (k !== 'detail' && k !== 'errors') { out[k] = Array.isArray(x) ? (x as any[]).join(' ') : x; } }
  if (d.errors && typeof d.errors === 'object') { for (const [k, x] of Object.entries(d.errors)) { out[k] = x; } }
  if (!Object.keys(out).length || d.detail && !Object.values(out).includes(d.detail)) { out._ = d.detail || errText(e); }
  return out;
}

const TABS = [
  { key: 'recoveries', label: 'Recoveries', icon: 'savings' },
  { key: 'rec-import', label: 'Recovery import', icon: 'upload_file' },
  { key: 'splits', label: 'Salary splits', icon: 'call_split' },
  { key: 'split-import', label: 'Salary split import', icon: 'upload_file' },
];

@Component({
  selector: 'app-pay163',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [`
.pc-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 24px 12px; }
.pc-tab { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: 1px solid #dfe1ea; border-radius: 8px; background: #fff;
  color: #3b3f55; font-weight: 600; font-size: 13px; text-decoration: none; cursor: pointer; }
.pc-tab.on { background: #eef0ff; border-color: #c9c5ff; color: #4b3fbf; }
.pc-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 10px; }
.pc-bar label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #6b7185; }
.pc-bar select, .pc-bar input { height: 34px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; }
.pc-num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pc-st { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11.5px; background: #eceef3; color: #555d70; white-space: nowrap; }
.pc-st.pending, .pc-st.paused { background: #fff0d9; color: #a0610a; }
.pc-st.active { background: #eef0ff; color: #4b3fbf; }
.pc-st.completed, .pc-st.settled { background: #e3f6ec; color: #1f7a4d; }
.pc-st.written_off, .pc-st.rejected, .pc-st.cancelled { background: #fde2e4; color: #b3263a; }
.pc-sum { margin: 0 0 10px; color: #3b3f55; font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px 22px; }
.pc-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 14px 16px; margin-bottom: 14px; max-width: 980px; }
.pc-card h2 { font-size: 16px; margin: 0 0 6px; font-weight: 600; }
.pc-card p { color: #6b7185; font-size: 13px; margin: 0 0 10px; }
.pc-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin: 8px 0; }
.pc-row label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 600; color: #3b3f55; }
.pc-row input, .pc-row select { height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; min-width: 140px; }
.pc-check { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin: 6px 0; }
.pc-err-row td { background: #fff7f7; }
.pc-small { font-size: 12px; color: #6b7185; }
.pc-bad { color: #b3263a; font-size: 12px; }
.pc-tbc { display: inline-block; margin-inline-start: 6px; padding: 0 6px; border-radius: 6px; background: #fff0d9; color: #a0610a; font-size: 11px; }
.pc-dlg { padding-top: 56px; }
.pc-dlg .t62-box { max-height: calc(100vh - 80px); width: min(860px, calc(100vw - 32px)); }
.pc-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 10px; margin: 0 0 12px; }
.pc-kpi { border: 1px solid #e6e8f0; border-radius: 10px; padding: 8px 12px; }
.pc-kpi small { display: block; color: #6b7185; font-size: 11.5px; }
.pc-kpi b { font-size: 16px; font-variant-numeric: tabular-nums; }
.pc-plan td { color: #6b7185; }
.pc-acts { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 12px; }
.pc-hist { margin: 0; padding: 0; list-style: none; font-size: 12.5px; color: #3b3f55; }
.pc-hist li { padding: 4px 0; border-bottom: 1px dashed #eceef3; }
.pc-mode { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; }
.pc-mode label { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }
@media (max-width: 640px) { .pc-tabs { padding: 0 16px 10px; } }
`],
  template: `
<div class="container hr-page" [attr.data-pay163]="tab">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ title() }}</h1><p class="hr-head-d">{{ intro() }}</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="tab === 'recoveries' && d?.can_edit" (click)="newRecovery()" data-z-new data-p163-new>+ New recovery</button>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="tab === 'splits' && d?.can_edit" (click)="newSplit()" data-z-new data-p163-new-split>+ New salary split</button>
        </div>
      </div>
    </div>
    <nav class="pc-tabs">
      <a *ngFor="let x of tabs" class="pc-tab" [class.on]="x.key === tab" [routerLink]="['../', link(x.key)]" [attr.data-p163-tab]="x.key">{{ x.label }}</a>
    </nav>
    <p class="t62-msg" *ngIf="failed" data-p163-failed>{{ failed }}</p>

    <!-- recoveries -->
    <div class="t62-body" *ngIf="tab === 'recoveries' && d">
      <div class="pc-bar">
        <label>Status<select [(ngModel)]="fStatus" (change)="load()" data-p163-f-status>
          <option value="open">Open (active, paused, waiting)</option><option value="">All</option><option value="pending">Waiting for approval</option>
          <option value="active">Active</option><option value="paused">Paused</option><option value="completed">Recovered in full</option>
          <option value="settled">Settled early</option><option value="written_off">Written off</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select></label>
        <a class="t62-link" style="display:inline-flex;align-items:center" routerLink="/main-sidebar/general-sidebar/approval-level">Approval levels of "Recovery schedule"</a>
      </div>
      <p class="pc-sum" data-p163-totals><span>Open recoveries – total <b>{{ +d.totals.total | number:'1.2-2' }}</b></span><span>recovered <b>{{ +d.totals.recovered | number:'1.2-2' }}</b></span><span>balance <b>{{ +d.totals.balance | number:'1.2-2' }}</b></span></p>
      <div class="table-responsive">
        <table class="table hr-table" data-p163-list>
          <thead><tr><th>Recovery</th><th>Employee</th><th>Type</th><th class="pc-num">Total</th><th class="pc-num">Recovered</th><th class="pc-num">Balance</th><th>Instalment</th><th>Status</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!d.rows.length"><td colspan="9" class="hr-empty">No recovery yet. Use + New recovery.</td></tr>
            <tr *ngFor="let r of d.rows" [attr.data-z-id]="r.id" [attr.data-p163-rec]="r.number">
              <td><a class="t62-link" (click)="open(r)" data-p163-open>{{ r.number }}</a><span class="t62-cell-sub">{{ r.request_number }}</span></td>
              <td>{{ r.employee }}</td><td>{{ r.component }}<span class="t62-cell-sub">{{ r.reason }}</span></td>
              <td class="pc-num">{{ +r.total | number:'1.2-2' }}</td><td class="pc-num">{{ +r.recovered | number:'1.2-2' }}</td><td class="pc-num"><b>{{ +r.balance | number:'1.2-2' }}</b></td>
              <td>{{ +r.per_month | number:'1.2-2' }} <span class="t62-cell-sub">{{ T('from {0}', [r.start_label]) }}<ng-container *ngIf="r.monthly_cap"> · {{ T('cap {0}', [(+r.monthly_cap).toFixed(2)]) }}</ng-container></span></td>
              <td><span class="pc-st" [ngClass]="r.status">{{ r.status_label }}</span></td>
              <td class="t62-actions">
                <button type="button" class="t62-link" (click)="open(r)">Open</button>
                <button type="button" class="t62-link" *ngIf="r.my_approval && r.status === 'pending'" (click)="decide(r, true)" data-p163-approve>Approve</button>
                <button type="button" class="t62-link" *ngIf="d.can_edit && r.status === 'active'" (click)="act(r, 'pause')" data-p163-pause>Pause</button>
                <button type="button" class="t62-link" *ngIf="d.can_edit && r.status === 'paused'" (click)="act(r, 'resume')" data-p163-resume>Resume</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">Each month's instalment is its own payslip line (the recovery's deduction component) with the balance left in the payslip notes. What the monthly cap or the net-pay controls (Payroll controls › net pay) do not let through carries to the next month. A rejected or deleted payslip gives its instalment back. At the final settlement the balance is deducted, or written off when that was chosen.</p>
    </div>

    <!-- splits -->
    <div class="t62-body" *ngIf="tab === 'splits' && d">
      <div class="pc-card" data-p163-wps-setting>
        <h2>WPS file of a split salary <span class="pc-tbc">To be confirmed</span></h2>
        <p>The published WPS file layout (CBUAE SIF) has no field for a salary paid partly outside WPS. Choose what the EDR line carries until your bank or WPS agent confirms it.</p>
        <label class="pc-check"><input type="radio" name="p163wps" value="portion" [(ngModel)]="d.settings.wps_split_edr" [disabled]="!canSet" data-p163-wps-portion> Only the WPS portion (the bank pays only that part; days and leave days of the full month)</label>
        <label class="pc-check"><input type="radio" name="p163wps" value="full" [(ngModel)]="d.settings.wps_split_edr" [disabled]="!canSet" data-p163-wps-full> The whole salary (only if the bank or agent asks for it – the bank then pays the whole salary)</label>
        <button type="button" class="t62-btn primary" *ngIf="canSet" [disabled]="busy" (click)="saveSetting()" data-p163-wps-save>Save</button>
      </div>
      <div class="pc-bar">
        <label class="pc-check"><input type="checkbox" [(ngModel)]="fCurrent" data-p163-f-current> Only the split in force today</label>
        <label>Search<input [(ngModel)]="q" placeholder="Employee" data-p163-q></label>
      </div>
      <div class="table-responsive">
        <table class="table hr-table" data-p163-splits>
          <thead><tr><th>Employee</th><th>From</th><th>Second part</th><th>Account</th><th>Status</th><th>Note</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!splitRows().length"><td colspan="7" class="hr-empty">No salary split. Use + New salary split, or the employee's Bank tab.</td></tr>
            <tr *ngFor="let s of splitRows()" [attr.data-z-id]="s.id" [attr.data-p163-split]="s.emp_code">
              <td>{{ s.employee }}</td><td>{{ dmy(s.effective_from) }}</td>
              <td>{{ s.text }}</td><td><small>{{ s.iban || s.account_number || '–' }}</small><span class="t62-cell-sub" *ngIf="s.bank_name">{{ s.bank_name }}</span></td>
              <td><span class="pc-st" [ngClass]="s.status === 'active' ? (s.current ? 'completed' : (s.future ? 'pending' : '')) : 'cancelled'">{{ s.status !== 'active' ? s.status_label : s.current ? T('In force') : s.future ? T('From a later date') : T('Earlier') }}</span></td>
              <td>{{ s.note }}</td>
              <td class="t62-actions"><button type="button" class="t62-link" *ngIf="d.can_edit && s.status === 'active'" (click)="cancelSplit(s)" data-p163-split-cancel>Cancel</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">Payroll run › Payments shows each part under its method; the WPS file carries only the WPS portion; cheque, cash and bank transfer files take their parts. Held salary is taken off the main part first.</p>
    </div>

    <!-- imports -->
    <div class="t62-body" *ngIf="tab === 'rec-import' || tab === 'split-import'">
      <div class="pc-card">
        <h2>{{ tab === 'rec-import' ? T('Recoveries from Excel') : T('Salary splits from Excel') }}</h2>
        <p *ngIf="tab === 'rec-import'">One row per recovery: employee code, component code (a deduction), total, start month (YYYY-MM), months or amount per month, monthly cap, exit action (deduct / write_off), reason. Check the file first (dry run) – nothing is saved; then apply the rows without errors.</p>
        <p *ngIf="tab === 'split-import'">One row per split: employee code, method (bank_transfer, cash, cheque, an own method code or none), IBAN or account, bank name, routing code, amount or percent, from date, note. The IBAN is checked (UAE: AE + 21 digits, check digits). Check the file first (dry run) – nothing is saved; then apply the rows without errors.</p>
        <div class="pc-row">
          <label>File (Excel or CSV)<input type="file" accept=".csv,.xlsx" (change)="pick($event)" data-p163-file></label>
          <button type="button" class="t62-btn" (click)="template()" data-p163-template>Download the template</button>
          <button type="button" class="t62-btn" [disabled]="!file || busy" (click)="runImport(false)" data-p163-dry>Check the file (dry run)</button>
          <button type="button" class="t62-btn primary" [disabled]="!file || busy || !imp || !imp.ok" (click)="runImport(true)" data-p163-apply>Apply the rows without errors</button>
        </div>
        <p class="pc-sum" *ngIf="imp" data-p163-imp-sum>{{ impSummary() }}</p>
      </div>
      <div class="table-responsive" *ngIf="imp">
        <table class="table hr-table" data-p163-imp>
          <thead *ngIf="tab === 'rec-import'"><tr><th>Row</th><th>Employee</th><th>Type</th><th class="pc-num">Total</th><th>First month</th><th>Months</th><th class="pc-num">Per month</th><th>Check</th></tr></thead>
          <thead *ngIf="tab === 'split-import'"><tr><th>Row</th><th>Employee</th><th>Method</th><th>IBAN / account</th><th class="pc-num">Amount or %</th><th>From</th><th>Check</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of imp.rows" [class.pc-err-row]="!r.ok" [attr.data-p163-imp-row]="r.row">
              <ng-container *ngIf="tab === 'rec-import'">
                <td>{{ r.row }}</td><td>{{ r.employee || r.employee_code }}</td><td>{{ r.component || r.component_code }}</td><td class="pc-num">{{ r.total }}</td><td>{{ r.start_month }}</td><td>{{ r.months }}</td><td class="pc-num">{{ r.per_month }}</td>
              </ng-container>
              <ng-container *ngIf="tab === 'split-import'">
                <td>{{ r.row }}</td><td>{{ r.employee || r.employee_code }}</td><td>{{ r.method_label || r.method }}</td><td><small>{{ r.iban_or_account }}</small></td><td class="pc-num">{{ r.value }}{{ r.basis === 'percent' && r.value ? ' %' : '' }}</td><td>{{ dmy(r.from_date) }}</td>
              </ng-container>
              <td><div *ngFor="let e of r.errors" class="pc-bad">{{ e }}</div><span *ngIf="r.ok" class="pc-st completed">OK</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- new recovery -->
<div class="t62-dlg pc-dlg" *ngIf="nf" data-p163-form>
  <div class="t62-veil" (click)="nf = null"></div>
  <div class="t62-box" role="dialog">
    <div class="t62-head"><div><h2 class="t62-title">New recovery</h2><p class="t62-sub">Recovered from the salary month by month on the line of a deduction component.</p></div>
      <button type="button" class="t62-x" (click)="nf = null" aria-label="Close">×</button></div>
    <div class="t62-dbody">
      <div class="t62-sec"><h3>Recovery</h3>
        <div class="t62-fgrid">
          <label class="t62-f full"><span class="t62-l">Employee <span class="t62-req">*</span></span>
            <input class="t62-in" [(ngModel)]="nf.q" placeholder="Search" data-p163-f-q>
            <select [(ngModel)]="nf.employee" (change)="nf.err.employee = ''; preview()" [class.bad]="nf.err.employee" data-p163-f-emp>
              <option [ngValue]="null">–</option><option *ngFor="let e of shownEmps()" [ngValue]="e.id">{{ e.label }}</option></select>
            <span class="t62-err" *ngIf="nf.err.employee">{{ nf.err.employee }}</span></label>
          <label class="t62-f"><span class="t62-l">Type (deduction component) <span class="t62-req">*</span></span>
            <select [(ngModel)]="nf.component" (change)="nf.err.component = ''; preview()" [class.bad]="nf.err.component" data-p163-f-comp>
              <option [ngValue]="null">–</option><option *ngFor="let c of comps" [ngValue]="c.id">{{ c.label }}</option></select>
            <span class="t62-err" *ngIf="nf.err.component">{{ nf.err.component }}</span></label>
          <label class="t62-f"><span class="t62-l">Total to recover (AED) <span class="t62-req">*</span></span>
            <input type="number" min="0" step="0.01" [(ngModel)]="nf.total" (change)="preview()" (input)="nf.err.total = ''" [class.bad]="nf.err.total" data-p163-f-total>
            <span class="t62-err" *ngIf="nf.err.total">{{ nf.err.total }}</span></label>
          <label class="t62-f"><span class="t62-l">First month <span class="t62-req">*</span></span>
            <select [(ngModel)]="nf.start_month" (change)="nf.err.start_month = ''; preview()" [class.bad]="nf.err.start_month" data-p163-f-start>
              <option *ngFor="let m of months" [value]="m.value">{{ m.label }}</option></select>
            <span class="t62-err" *ngIf="nf.err.start_month">{{ nf.err.start_month }}</span></label>
          <div class="t62-f full"><span class="t62-l">Recover over</span>
            <div class="pc-mode">
              <label><input type="radio" name="p163mode" value="months" [(ngModel)]="nf.mode" (change)="preview()" data-p163-f-mode-months> a number of months</label>
              <label><input type="radio" name="p163mode" value="amount" [(ngModel)]="nf.mode" (change)="preview()" data-p163-f-mode-amount> an amount per month</label>
            </div></div>
          <label class="t62-f" *ngIf="nf.mode === 'months'"><span class="t62-l">Months <span class="t62-req">*</span></span>
            <input type="number" min="1" max="240" step="1" [(ngModel)]="nf.months" (change)="preview()" (input)="nf.err.months = ''" [class.bad]="nf.err.months" data-p163-f-months>
            <span class="t62-err" *ngIf="nf.err.months">{{ nf.err.months }}</span></label>
          <label class="t62-f" *ngIf="nf.mode === 'amount'"><span class="t62-l">Amount per month (AED) <span class="t62-req">*</span></span>
            <input type="number" min="0" step="0.01" [(ngModel)]="nf.per_month" (change)="preview()" (input)="nf.err.per_month = ''" [class.bad]="nf.err.per_month" data-p163-f-per>
            <span class="t62-err" *ngIf="nf.err.per_month">{{ nf.err.per_month }}</span></label>
          <label class="t62-f"><span class="t62-l">Monthly cap (AED, optional)</span>
            <input type="number" min="0" step="0.01" [(ngModel)]="nf.monthly_cap" (change)="preview()" (input)="nf.err.monthly_cap = ''" [class.bad]="nf.err.monthly_cap" data-p163-f-cap>
            <span class="t62-err" *ngIf="nf.err.monthly_cap">{{ nf.err.monthly_cap }}</span></label>
          <label class="t62-f"><span class="t62-l">When the employee leaves</span>
            <select [(ngModel)]="nf.exit_action" data-p163-f-exit><option value="deduct">Deduct the balance in the final settlement</option><option value="write_off">Write off the balance at exit</option></select></label>
          <label class="t62-f full"><span class="t62-l">Reason <span class="t62-req">*</span></span>
            <input [(ngModel)]="nf.reason" (input)="nf.err.reason = ''" maxlength="255" [class.bad]="nf.err.reason" data-p163-f-reason>
            <span class="t62-err" *ngIf="nf.err.reason">{{ nf.err.reason }}</span></label>
        </div>
      </div>
      <div class="t62-sec" *ngIf="pv" data-p163-preview><h3>Schedule preview</h3>
        <p class="t62-hint">{{ T('{0} instalments of {1}, the last in {2}.', [pv.instalments, (+pv.per_month).toFixed(2), pv.last_month]) }}</p>
        <table class="t62-tbl"><thead><tr><th>Month</th><th class="pc-num">Instalment</th><th class="pc-num">Carried on</th><th class="pc-num">Balance</th></tr></thead>
          <tbody><tr *ngFor="let s of pv.schedule"><td>{{ s.month_label }}</td><td class="pc-num">{{ +s.amount | number:'1.2-2' }}</td><td class="pc-num">{{ +s.carried ? (+s.carried | number:'1.2-2') : '' }}</td><td class="pc-num">{{ +s.balance | number:'1.2-2' }}</td></tr></tbody></table>
        <p class="t62-hint">The net-pay controls of the company can make a month take less; the rest is carried to the next month.</p>
      </div>
      <p class="t62-top" *ngIf="nf.err._" data-p163-f-top>{{ nf.err._ }}</p>
    </div>
    <div class="t62-foot"><span class="t62-grow"></span>
      <button type="button" class="t62-btn" (click)="nf = null">Cancel</button>
      <button type="button" class="t62-btn primary" [disabled]="busy" (click)="saveRecovery()" data-p163-f-save>Create the recovery</button></div>
  </div>
</div>

<!-- one recovery -->
<div class="t62-dlg pc-dlg" *ngIf="cur" data-p163-detail>
  <div class="t62-veil" (click)="cur = null"></div>
  <div class="t62-box" role="dialog">
    <div class="t62-head"><div><h2 class="t62-title">{{ cur.number }} – {{ cur.component }}</h2><p class="t62-sub">{{ cur.employee }} · {{ cur.reason }}</p></div>
      <button type="button" class="t62-x" (click)="cur = null" aria-label="Close">×</button></div>
    <div class="t62-dbody">
      <div class="pc-kpis">
        <div class="pc-kpi"><small>Status</small><span class="pc-st" [ngClass]="cur.status">{{ cur.status_label }}</span></div>
        <div class="pc-kpi"><small>Total</small><b>{{ +cur.total | number:'1.2-2' }}</b></div>
        <div class="pc-kpi"><small>Recovered</small><b>{{ +cur.recovered | number:'1.2-2' }}</b></div>
        <div class="pc-kpi" *ngIf="+cur.written_off"><small>Written off</small><b>{{ +cur.written_off | number:'1.2-2' }}</b></div>
        <div class="pc-kpi"><small>Balance</small><b data-p163-d-balance>{{ +cur.balance | number:'1.2-2' }}</b></div>
        <div class="pc-kpi"><small>Instalment</small><b>{{ +cur.per_month | number:'1.2-2' }}</b><small *ngIf="cur.monthly_cap">{{ T('cap {0}', [(+cur.monthly_cap).toFixed(2)]) }}</small></div>
        <div class="pc-kpi"><small>When the employee leaves</small><span class="pc-small">{{ cur.exit_label }}</span></div>
      </div>
      <div class="pc-acts">
        <button type="button" class="t62-btn" *ngIf="cur.my_approval && cur.status === 'pending'" (click)="decide(cur, true)">Approve</button>
        <button type="button" class="t62-btn" *ngIf="cur.my_approval && cur.status === 'pending'" (click)="decide(cur, false)">Reject</button>
        <ng-container *ngIf="d?.can_edit">
          <button type="button" class="t62-btn" *ngIf="cur.status === 'active'" (click)="act(cur, 'pause')" data-p163-d-pause>Pause</button>
          <button type="button" class="t62-btn" *ngIf="cur.status === 'paused'" (click)="act(cur, 'resume')" data-p163-d-resume>Resume</button>
          <button type="button" class="t62-btn" *ngIf="cur.status === 'active' || cur.status === 'paused'" (click)="settle(cur)" data-p163-d-settle>Settle early</button>
          <button type="button" class="t62-btn" *ngIf="cur.status === 'active' || cur.status === 'paused'" (click)="writeOff(cur)" data-p163-d-writeoff>Write off</button>
          <button type="button" class="t62-btn" *ngIf="cur.status === 'pending' || cur.status === 'active' || cur.status === 'paused'" (click)="change(cur)" data-p163-d-change>Cap and exit choice</button>
          <button type="button" class="t62-btn" *ngIf="(cur.status === 'pending' || cur.status === 'active' || cur.status === 'paused') && +cur.taken === 0" (click)="act(cur, 'cancel')" data-p163-d-cancel>Cancel the recovery</button>
        </ng-container>
      </div>
      <p class="t62-hint" *ngIf="cur.settle_next">The next payroll takes the whole balance (settle early).</p>
      <div class="t62-sec" *ngIf="cur.steps?.length"><h3>Approval</h3>
        <ul class="pc-hist"><li *ngFor="let s of cur.steps">{{ s.level }}. {{ s.approver || s.role }} – {{ s.status_label }}<span *ngIf="s.note">: {{ s.note }}</span></li></ul></div>
      <div class="t62-sec" data-p163-schedule><h3>Schedule</h3>
        <table class="t62-tbl"><thead><tr><th>Month</th><th>Kind</th><th class="pc-num">Due</th><th class="pc-num">Taken</th><th class="pc-num">Carried on</th><th class="pc-num">Balance</th></tr></thead>
          <tbody><tr *ngFor="let s of cur.schedule" [class.pc-plan]="!s.actual"><td>{{ s.month_label }}</td><td>{{ s.kind_label }}</td><td class="pc-num">{{ +s.due | number:'1.2-2' }}</td>
            <td class="pc-num">{{ +s.amount | number:'1.2-2' }}</td><td class="pc-num">{{ +s.carried ? (+s.carried | number:'1.2-2') : '' }}</td><td class="pc-num">{{ +s.balance | number:'1.2-2' }}</td></tr>
            <tr *ngIf="!cur.schedule.length"><td colspan="6" class="hr-empty">Nothing planned.</td></tr></tbody></table></div>
      <div class="t62-sec" *ngIf="cur.entries?.length"><h3>Movements</h3>
        <table class="t62-tbl"><thead><tr><th>Month</th><th>Kind</th><th class="pc-num">Amount</th><th>Counted</th><th>Note</th></tr></thead>
          <tbody><tr *ngFor="let x of cur.entries"><td>{{ dmy(x.month) }}</td><td>{{ x.kind_label }}</td><td class="pc-num">{{ +x.amount | number:'1.2-2' }}</td><td>{{ x.status_label }}</td><td>{{ x.note }}</td></tr></tbody></table></div>
      <div class="t62-sec" data-p163-history><h3>History</h3>
        <ul class="pc-hist"><li *ngFor="let h of cur.history">{{ h.at | date:'dd/MM/yyyy HH:mm' }} – {{ T(actionLabel(h.action)) }}<span *ngIf="h.by"> – {{ h.by }}</span><span *ngIf="h.amount"> – {{ (+h.amount).toFixed(2) }}</span><span *ngIf="h.note">: {{ h.note }}</span></li></ul></div>
    </div>
    <div class="t62-foot"><span class="t62-grow"></span><button type="button" class="t62-btn" (click)="cur = null">Close</button></div>
  </div>
</div>`,
})
export class Pay163Component implements OnInit {
  tabs = TABS; tab = 'recoveries'; d: any = null; failed = ''; busy = false; canSet = false;
  fStatus = 'open'; fCurrent = true; q = '';
  months = monthOptions();
  emps: { id: number; label: string }[] = []; comps: any[] = [];
  nf: any = null; pv: any = null; cur: any = null;
  file: File | null = null; imp: any = null;
  dmy = dmy; T = T;
  private pvTimer: any = null;
  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  url(p: string): string {
    const sch = encodeURIComponent(localStorage.getItem('selectedSchema') || '');
    return `${environment.apiBaseUrl}${p}${p.includes('?') ? '&' : '?'}schema=${sch}`;
  }
  link(k: string): string { return ({ recoveries: 'recoveries', 'rec-import': 'recoveries-import', splits: 'pay-splits', 'split-import': 'pay-splits-import' } as any)[k]; }
  ngOnInit(): void {
    this.route.data.subscribe(x => { this.tab = x['tab'] || 'recoveries'; this.d = null; this.imp = null; this.file = null; this.failed = ''; this.load(); });
  }
  title(): string { return T((TABS.find(x => x.key === this.tab) || TABS[0]).label); }
  intro(): string {
    return T({
      recoveries: 'Recover an amount from the salary month by month – accommodation, transport, uniforms, damage or any other deduction.',
      'rec-import': 'Create many recoveries from an Excel file.',
      splits: 'Pay one salary through two accounts or part in cash: the main account plus a second bank account, cash, cheque or an own method.',
      'split-import': 'Set the salary split of many employees from an Excel file.',
    }[this.tab] || '');
  }
  actionLabel(a: string): string {
    return ({ created: 'Created', active: 'Active', approved: 'Approved', rejected: 'Rejected', paused: 'Paused', resumed: 'Resumed', settled: 'Settled early',
              settle_next: 'Settle early – next payroll takes the balance', written_off: 'Written off', cancelled: 'Cancelled', changed: 'Changed',
              exit: 'Final settlement', exit_write_off: 'Written off at exit' } as any)[a] || a;
  }
  async load(): Promise<void> {
    try {
      if (this.tab === 'recoveries') {
        this.d = await firstValueFrom(this.http.get<any>(this.url(REC + `?status=${this.fStatus}`)));
      } else if (this.tab === 'splits') {
        this.d = await firstValueFrom(this.http.get<any>(this.url(SPL)));
        try { this.canSet = !!(await firstValueFrom(this.http.get<any>(this.url(SPL + 'settings/')))).can_edit; } catch { this.canSet = false; }
      } else { this.d = {}; }
      this.failed = '';
    } catch (e) { this.d = null; this.failed = errText(e); }
    this.cd.detectChanges();
  }
  async loadEmps(): Promise<void> {
    if (!this.emps.length) {
      try {
        const r: any = await firstValueFrom(this.http.get<any>(this.url('/employee/api/emplist/')));
        this.emps = (Array.isArray(r) ? r : r?.results || []).map((e: any) => ({ id: e.id, label: empLabel(e) }));
      } catch { this.emps = []; }
    }
    if (!this.comps.length) {
      try { this.comps = await firstValueFrom(this.http.get<any[]>(this.url(REC + 'components/'))); } catch { this.comps = []; }
    }
  }
  shownEmps(): any[] {
    const q = (this.nf?.q || '').toLowerCase();
    return this.emps.filter(e => !q || e.label.toLowerCase().includes(q) || e.id === this.nf?.employee).slice(0, 80);
  }

  // ---------------------------------------------------------------- recoveries
  async newRecovery(): Promise<void> {
    await this.loadEmps();
    this.nf = { employee: null, component: null, total: null, start_month: this.months[4].value, mode: 'months', months: 6, per_month: null, monthly_cap: null,
                exit_action: 'deduct', reason: '', q: '', err: {} };
    this.pv = null;
    this.cd.detectChanges();
  }
  body(): any {
    const v = this.nf;
    return { employee: v.employee, component: v.component, total: v.total, start_month: v.start_month, mode: v.mode, months: v.mode === 'months' ? v.months : null,
             per_month: v.mode === 'amount' ? v.per_month : null, monthly_cap: v.monthly_cap === null || v.monthly_cap === '' ? '' : v.monthly_cap,
             exit_action: v.exit_action, reason: v.reason || '-' };
  }
  preview(): void {
    clearTimeout(this.pvTimer);
    this.pvTimer = setTimeout(async () => {
      if (!this.nf || !this.nf.component || !this.nf.total) { this.pv = null; this.cd.detectChanges(); return; }
      try { this.pv = await firstValueFrom(this.http.post<any>(this.url(REC + 'preview/'), this.body())); }
      catch { this.pv = null; }
      this.cd.detectChanges();
    }, 250);
  }
  async saveRecovery(): Promise<void> {
    const v = this.nf; v.err = {};
    if (!v.employee) { v.err.employee = T('Choose the employee.'); }
    if (!v.component) { v.err.component = T('Choose the type of recovery (a deduction component).'); }
    if (!(+v.total > 0)) { v.err.total = T('Enter the total to recover.'); }
    if (!String(v.reason || '').trim()) { v.err.reason = T('Enter the reason.'); }
    if (Object.keys(v.err).length) { this.cd.detectChanges(); return; }
    this.busy = true;
    try {
      const r = await firstValueFrom(this.http.post<any>(this.url(REC), { ...this.body(), reason: v.reason }));
      zToast(r.status === 'pending' ? T('Recovery sent for approval.') : T('Recovery created.'), 'ok');
      this.nf = null; this.pv = null; await this.load();
    } catch (e: any) { v.err = fieldErrs(e); }
    this.busy = false; this.cd.detectChanges();
  }
  async open(r: any): Promise<void> {
    try { this.cur = await firstValueFrom(this.http.get<any>(this.url(`${REC}${r.id}/`))); }
    catch (e) { zToast(errText(e), 'err'); }
    this.cd.detectChanges();
  }
  private async post(path: string, body: any, ok: string): Promise<any> {
    try {
      const x = await firstValueFrom(this.http.post<any>(this.url(path), body));
      zToast(ok, 'ok');
      if (this.cur && x?.id === this.cur.id) { this.cur = x; }
      await this.load();
      return x;
    } catch (e) { zToast(errText(e), 'err'); await this.load(); return null; }
  }
  async act(r: any, action: 'pause' | 'resume' | 'cancel'): Promise<void> {
    const q = { pause: T('Pause {0}? Nothing is deducted until it is resumed.', [r.number]), resume: T('Resume {0}?', [r.number]),
                cancel: T('Cancel {0}? Nothing was deducted yet.', [r.number]) }[action];
    if (!(await zConfirm(q, action === 'cancel' ? { danger: true, ok: T('Cancel the recovery') } : undefined))) { return; }
    await this.post(`${REC}${r.id}/${action}/`, {}, { pause: T('Paused.'), resume: T('Resumed.'), cancel: T('Cancelled.') }[action]);
    this.cd.detectChanges();
  }
  async afterForm(r: any): Promise<void> {
    await this.load();
    if (this.cur && this.cur.id === r.id) { await this.open(r); }
  }
  async settle(r: any): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'settlement', endpoint: `${REC}${r.id}/settle/`, heading: 'Settle early', action: 'Settle',
      subtitle: T('{0} – balance {1}.', [r.number, (+r.balance).toFixed(2)]),
      sections: [{ title: 'Settle early', fields: [
        { key: 'mode', label: 'How', type: 'select', required: true, full: true, options: [
          { value: 'paid', label: 'The employee paid the balance (outside payroll)' }, { value: 'next_payroll', label: 'The next payroll takes the whole balance' }] },
        { key: 'paid_on', label: 'Paid on', type: 'date', showIf: (v: any) => v.mode === 'paid', required: true },
        { key: 'reference', label: 'Receipt or payment reference', type: 'text', showIf: (v: any) => v.mode === 'paid', required: true },
        { key: 'note', label: 'Note', type: 'text', full: true }] }],
      initial: { mode: 'paid' },
      okText: () => T('Saved.'),
    };
    if (await openZForm(cfg)) { await this.afterForm(r); }
  }
  async writeOff(r: any): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'write-off', endpoint: `${REC}${r.id}/write-off/`, heading: 'Write off the balance', action: 'Write off',
      subtitle: T('{0} – balance {1} is not recovered.', [r.number, (+r.balance).toFixed(2)]),
      sections: [{ title: 'Write off', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true, full: true }] }],
      okText: () => T('Written off.'),
    };
    if (await openZForm(cfg)) { await this.afterForm(r); }
  }
  async change(r: any): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'recovery', endpoint: `${REC}${r.id}/change/`, heading: 'Cap and exit choice', action: 'Save',
      subtitle: r.number,
      sections: [{ title: 'Recovery', fields: [
        { key: 'monthly_cap', label: 'Monthly cap (AED, optional)', type: 'number' },
        { key: 'exit_action', label: 'When the employee leaves', type: 'select', required: true, options: [
          { value: 'deduct', label: 'Deduct the balance in the final settlement' }, { value: 'write_off', label: 'Write off the balance at exit' }] }] }],
      initial: { monthly_cap: r.monthly_cap || '', exit_action: r.exit_action },
      toBody: (v: any) => ({ monthly_cap: v.monthly_cap === null || v.monthly_cap === undefined ? '' : v.monthly_cap, exit_action: v.exit_action }),
      okText: () => T('Saved.'),
    };
    if (await openZForm(cfg)) { await this.afterForm(r); }
  }
  async decide(r: any, ok: boolean): Promise<void> {
    if (ok) {
      if (!(await zConfirm(T('Approve the recovery {0} of {1}?', [r.number, r.employee])))) { return; }
      await this.post(`${REC}${r.id}/approve/`, {}, T('Approved.'));
      this.cd.detectChanges();
      return;
    }
    const cfg: ZFormConfig = {
      thing: 'rejection', endpoint: `${REC}${r.id}/reject/`, heading: 'Reject the recovery', action: 'Reject',
      subtitle: r.employee, sections: [{ title: 'Reject', fields: [{ key: 'note', label: 'Reason', type: 'textarea', required: true, full: true }] }],
      okText: () => T('Rejected.'),
    };
    if (await openZForm(cfg)) { await this.afterForm(r); }
  }

  // ---------------------------------------------------------------- splits
  splitRows(): any[] {
    const q = this.q.toLowerCase();
    return (this.d?.rows || []).filter((s: any) => (!this.fCurrent || (s.status === 'active' && (s.current || s.future))) && (!q || s.employee.toLowerCase().includes(q)));
  }
  async newSplit(): Promise<void> {
    const cfg = splitForm(this.d?.methods || [], null);
    if (await openZForm(cfg)) { await this.load(); }
  }
  async cancelSplit(s: any): Promise<void> {
    if (!(await zConfirm(T('Cancel the salary split of {0} from {1}?', [s.employee, dmy(s.effective_from)]), { danger: true, ok: T('Cancel the split') }))) { return; }
    try { await firstValueFrom(this.http.post<any>(this.url(`${SPL}${s.id}/cancel/`), {})); zToast(T('Cancelled.'), 'ok'); }
    catch (e) { zToast(errText(e), 'err'); }
    await this.load();
  }
  async saveSetting(): Promise<void> {
    this.busy = true;
    try { await firstValueFrom(this.http.put<any>(this.url(SPL + 'settings/'), { wps_split_edr: this.d.settings.wps_split_edr })); zToast(T('Saved.'), 'ok'); }
    catch (e) { zToast(errText(e), 'err'); }
    this.busy = false; this.cd.detectChanges();
  }

  // ---------------------------------------------------------------- imports
  impSummary(): string {
    const i = this.imp;
    return i.dry_run ? T('Dry run: {0} rows without errors, {1} rows with errors.', [i.ok, i.errors])
      : T('Applied: {0} rows saved, {1} rows with errors not saved.', [i.applied, i.errors]);
  }
  pick(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.imp = null; this.cd.detectChanges(); }
  template(): void { window.open(this.url((this.tab === 'rec-import' ? REC : SPL) + 'import/template/'), '_blank'); }
  async runImport(apply: boolean): Promise<void> {
    if (!this.file) { return; }
    if (apply && !(await zConfirm(T('Save {0} rows?', [this.imp?.ok || 0])))) { return; }
    const fd = new FormData(); fd.append('file', this.file); fd.append('apply', apply ? '1' : '0');
    this.busy = true;
    try {
      this.imp = await firstValueFrom(this.http.post<any>(this.url((this.tab === 'rec-import' ? REC : SPL) + 'import/'), fd));
      if (apply) { zToast(T('{0} rows saved.', [this.imp.applied]), 'ok'); }
    } catch (e) { zToast(errText(e), 'err'); }
    this.busy = false; this.cd.detectChanges();
  }
}

/** v1.63.0 (item 27): the form of a new dated salary split (also used on the employee's Bank tab) */
export function splitForm(methods: { value: string; label: string }[], employeeId: number | null): ZFormConfig {
  const fields: any[] = [];
  if (employeeId === null) {
    fields.push({ key: 'employee', label: 'Employee', type: 'select', required: true, full: true, search: true,
                  source: { endpoint: '/employee/api/emplist/', value: 'id', label: (r: any) => empLabel(r) } });
  }
  fields.push(
    { key: 'effective_from', label: 'From', type: 'date', required: true },
    { key: 'method', label: 'Second part paid by', type: 'select', required: true,
      options: [...methods, { value: 'none', label: 'No split (end the split)' }] },
    { key: 'basis', label: 'Second part as', type: 'select', required: true, showIf: (v: any) => v.method !== 'none',
      options: [{ value: 'percent', label: 'Percentage of the net pay' }, { value: 'amount', label: 'Fixed amount' }] },
    { key: 'value', label: 'Amount (AED) or percentage', type: 'number', required: true, showIf: (v: any) => v.method !== 'none' },
    { key: 'iban', label: 'IBAN of the second account', type: 'text', showIf: (v: any) => v.method === 'bank_transfer',
      hint: 'UAE: AE + 21 digits; the check digits are verified.' },
    { key: 'account_number', label: 'Account number (when there is no IBAN)', type: 'text', showIf: (v: any) => v.method === 'bank_transfer' },
    { key: 'bank_name', label: 'Bank', type: 'text', showIf: (v: any) => v.method === 'bank_transfer' },
    { key: 'routing_code', label: 'Routing code (9 digits)', type: 'text', showIf: (v: any) => v.method === 'bank_transfer' },
    { key: 'note', label: 'Note', type: 'text', full: true });
  return {
    thing: 'salary split', endpoint: SPL, heading: 'New salary split', action: 'Save the split',
    subtitle: 'The main account (the employee’s payment mode) gets the rest of the net pay. A new entry with a later date replaces the split from that date; the earlier ones stay as history.',
    sections: [{ title: 'Salary split', fields }],
    initial: { method: 'cash', basis: 'percent', ...(employeeId !== null ? { employee: employeeId } : {}) },
    toBody: (v: any) => {
      const bank = v.method === 'bank_transfer';   // the bank fields only for a second bank account
      return { ...v, ...(employeeId !== null ? { employee: employeeId } : {}), iban: bank ? String(v.iban || '').replace(/\s+/g, '').toUpperCase() : '',
               account_number: bank ? v.account_number || '' : '', bank_name: bank ? v.bank_name || '' : '', routing_code: bank ? v.routing_code || '' : '' };
    },
    validate: (v: any, t: any): Record<string, string> | null => {
      if (v.method === 'bank_transfer' && v.iban) {
        const p = uaeIban(String(v.iban));
        if (p) { return { iban: t(p) }; }
      }
      if (v.method !== 'none' && v.basis === 'percent' && +v.value >= 100) { return { value: t('A percentage below 100 – the rest is paid to the main account.') }; }
      return null;
    },
    okText: () => T('Salary split saved.'),
  };
}

/** UAE IBAN check in the form (the server checks again): AE + 21 digits, mod-97 */
export function uaeIban(v: string): string {
  const s = v.replace(/\s+/g, '').toUpperCase();
  if (!s) { return ''; }
  if (s.startsWith('AE')) {
    if (s.length !== 23) { return 'A UAE IBAN has 23 characters (AE + 21 digits).'; }
    if (!/^AE\d{21}$/.test(s)) { return 'After AE a UAE IBAN has only digits.'; }
  } else if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) { return 'Enter the IBAN as 2 letters (country), 2 check digits and the account (15 to 34 characters, no spaces).'; }
  const moved = s.slice(4) + s.slice(0, 4);
  let rest = 0;
  for (const ch of moved) {
    const n = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const dgt of n) { rest = (rest * 10 + +dgt) % 97; }
  }
  return rest === 1 ? '' : 'This IBAN is not valid (the check digits do not match). Copy it again from the bank letter.';
}
