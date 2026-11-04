// v1.62.11 (items 228, 231): new screens – payroll controls (hold / release, period locks, revise salary, re-hire, salary history import, settings)
/**
 * v1.62.11 (items 228, 231) – Payroll › Payroll controls, one page with tabs (route data `tab`):
 *   holds    Hold / release salary – a month's salary held in full, by an amount or a % of net pay; released into a later run
 *   locks    Period locks – lock a closed payroll period; unlock with a reason (right "Can unlock a locked payroll period")
 *   revise   Revise salary – new amounts from an effective date, approved through the "Salary revision" request workflow
 *   rehire   Re-hire – a leaver comes back: new service period (gratuity from the re-hire date unless continuity is chosen)
 *   import   Salary history import – CSV / Excel → salary revision history with effective dates (dry run, then apply)
 *   settings Automatic pay-date shift, loan limit by gratuity
 * API: /payroll-plus/api/payctl/… (PayrollPlus/payctl_views.py). Forms: shared form (z-form) or a dialog in the same look.
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
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';

const API = '/payroll-plus/api/payctl/';
const T = (s: string, p?: any[]) => i18nT(s, p);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dmy(d: any): string { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : (d ? String(d) : '–'); }
function empLabel(e: any): string {
  const n = [e.emp_first_name, e.emp_last_name].filter(Boolean).join(' ') || e.emp_name || '';
  return e.emp_code ? (n ? `${n} (${e.emp_code})` : e.emp_code) : n;
}
/** the months from 6 back to 12 ahead, value YYYY-MM */
function monthOptions(back = 6, ahead = 12): { value: string; label: string }[] {
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
  if (Array.isArray(d)) { return d.join(' '); }
  return d.detail || Object.values(d).map((v: any) => Array.isArray(v) ? v.join(' ') : v).join(' ');
}

const TABS = [
  { key: 'holds', label: 'Hold / release salary', icon: 'pause_circle' },
  { key: 'locks', label: 'Period locks', icon: 'lock' },
  { key: 'revise', label: 'Revise salary', icon: 'trending_up' },
  { key: 'rehire', label: 'Re-hire', icon: 'person_add' },
  { key: 'import', label: 'Salary history import', icon: 'upload_file' },
  { key: 'settings', label: 'Settings', icon: 'tune' },
];

@Component({
  selector: 'app-payctl62',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, ZDateFieldComponent],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [`
.pc-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 24px 12px; }
.pc-tab { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: 1px solid #dfe1ea; border-radius: 8px; background: #fff;
  color: #3b3f55; font-weight: 600; font-size: 13px; text-decoration: none; cursor: pointer; }
.pc-tab mat-icon { font-size: 18px; width: 18px; height: 18px; }
.pc-tab.on { background: #eef0ff; border-color: #c9c5ff; color: #4b3fbf; }
.pc-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 10px; }
.pc-bar label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #6b7185; }
.pc-bar select, .pc-bar input { height: 34px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; }
.pc-num { text-align: end; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pc-st { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 11.5px; background: #eceef3; color: #555d70; white-space: nowrap; }
.pc-st.held, .pc-st.locked, .pc-st.pending { background: #fff0d9; color: #a0610a; }
.pc-st.to_release { background: #eef0ff; color: #4b3fbf; }
.pc-st.released, .pc-st.applied, .pc-st.unlocked { background: #e3f6ec; color: #1f7a4d; }
.pc-st.rejected, .pc-st.failed { background: #fde2e4; color: #b3263a; }
.pc-sum { margin: 0 0 10px; color: #3b3f55; font-size: 13px; }
.pc-steps { margin: 2px 0 0; padding: 0; list-style: none; font-size: 12px; color: #6b7185; }
.pc-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); padding: 14px 16px; margin-bottom: 14px; max-width: 900px; }
.pc-card h2 { font-size: 16px; margin: 0 0 6px; font-weight: 600; }
.pc-card p { color: #6b7185; font-size: 13px; margin: 0 0 10px; }
.pc-check { display: flex; align-items: center; gap: 8px; font-size: 13.5px; margin: 8px 0; }
.pc-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin: 8px 0; }
.pc-row label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 600; color: #3b3f55; }
.pc-row input, .pc-row select { height: 36px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; min-width: 140px; }
.pc-err-row td { background: #fff7f7; }
.pc-small { font-size: 12px; color: #6b7185; }
.pc-bad { color: #b3263a; font-size: 12px; }
.pc-warn { color: #a0610a; font-size: 12px; }
.pc-dlg { padding-top: 64px; }
.pc-dlg .t62-box { max-height: calc(100vh - 96px); }
.pc-tbc { display: inline-block; margin-inline-start: 6px; padding: 0 6px; border-radius: 6px; background: #fff0d9; color: #a0610a; font-size: 11px; }
@media (max-width: 640px) { .pc-tabs { padding: 0 16px 10px; } }
`],
  template: `
<div class="container hr-page" [attr.data-payctl]="tab">
  <div class="comapny_section">
    <div class="header_section">
      <div class="hr-head">
        <div class="hr-head-t"><h1>{{ title() }}</h1><p class="hr-head-d">{{ intro() }}</p></div>
        <div class="hr-head-a hr-head-b">
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="tab === 'holds' && can" (click)="newHold()" data-z-new data-pc-new>+ New salary hold</button>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="tab === 'locks' && d?.can_lock" (click)="newLock()" data-z-new data-pc-new>+ New period lock</button>
          <button type="button" class="hr-tbtn primary z-new-btn" *ngIf="tab === 'revise' && can" (click)="newRevision()" data-z-new data-pc-new>+ New salary revision</button>
        </div>
      </div>
    </div>
    <nav class="pc-tabs">
      <a *ngFor="let x of tabs" class="pc-tab" [class.on]="x.key === tab" [routerLink]="['../', 'payctl-' + x.key]" [attr.data-pc-tab]="x.key">{{ x.label }}</a>
    </nav>
    <p class="t62-msg" *ngIf="failed" data-pc-failed>{{ failed }}</p>

    <!-- holds -->
    <div class="t62-body" *ngIf="tab === 'holds' && d">
      <div class="pc-bar">
        <label>Salary month<select [(ngModel)]="fMonth" (change)="load()" data-pc-f-month><option value="">All months</option><option *ngFor="let m of months" [value]="m.value">{{ m.label }}</option></select></label>
        <label>Status<select [(ngModel)]="fStatus" (change)="load()"><option value="">All</option><option value="pending">Waiting for the payroll run</option><option value="held">Held</option><option value="to_release">Release in the next payroll run</option><option value="released">Released</option><option value="cancelled">Cancelled</option></select></label>
      </div>
      <p class="pc-sum">Held and not paid yet: <b>{{ +d.total_held | number:'1.2-2' }}</b></p>
      <div class="table-responsive">
        <table class="table hr-table" data-pc-list>
          <thead><tr><th>Employee</th><th>Salary month</th><th>Held</th><th>Reason</th><th class="pc-num">Amount held</th><th>Status</th><th>Paid in</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!d.rows.length"><td colspan="8" class="hr-empty">No salary is held. Use + New salary hold.</td></tr>
            <tr *ngFor="let r of d.rows" [attr.data-z-id]="r.id" [attr.data-pc-hold]="r.emp_code + ':' + r.month">
              <td>{{ r.employee }}</td><td>{{ r.month_label }}</td>
              <td>{{ r.kind_label }}<span class="t62-cell-sub" *ngIf="r.kind !== 'full'">{{ r.kind === 'percent' ? (r.value + ' %') : (+r.value | number:'1.2-2') }}</span></td>
              <td>{{ r.reason }}</td>
              <td class="pc-num">{{ r.status === 'pending' ? '–' : (+r.held_amount | number:'1.2-2') }}</td>
              <td><span class="pc-st" [ngClass]="r.status">{{ r.status_label }}</span></td>
              <td>{{ r.release_label || '–' }}</td>
              <td class="t62-actions">
                <button type="button" class="t62-link" *ngIf="can && (r.status === 'held' || r.status === 'to_release')" (click)="release(r)" data-pc-release>Release</button>
                <button type="button" class="t62-link" *ngIf="can && r.status !== 'released' && r.status !== 'cancelled'" (click)="cancelHold(r)" data-pc-cancel>Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">The payslip keeps the salary earned; the held part is left out of the WPS file and the bank list of that month and is paid as the line "Held salary released" in the run after it is released.</p>
    </div>

    <!-- locks -->
    <div class="t62-body" *ngIf="tab === 'locks' && d">
      <div class="table-responsive">
        <table class="table hr-table" data-pc-list>
          <thead><tr><th>Salary month</th><th>Branch</th><th>Days covered</th><th>Status</th><th>Locked by</th><th>Log</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!d.rows.length"><td colspan="7" class="hr-empty">No payroll period is locked. Use + New period lock after the month's payroll is closed.</td></tr>
            <tr *ngFor="let r of d.rows" [attr.data-z-id]="r.id" [attr.data-pc-lock]="r.month + ':' + (r.branch_id || 'all')">
              <td>{{ r.month_label }}</td><td>{{ r.branch }}</td><td>{{ dmy(r.start) }} – {{ dmy(r.end) }}</td>
              <td><span class="pc-st" [ngClass]="r.status">{{ r.status_label }}</span></td>
              <td>{{ r.locked_by || '–' }}<span class="t62-cell-sub">{{ r.locked_at | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td><ul class="pc-steps"><li *ngFor="let e of r.events">{{ e.action_label }} – {{ e.by }}, {{ e.at | date:'dd/MM/yyyy HH:mm' }}<span *ngIf="e.reason">: {{ e.reason }}</span></li></ul></td>
              <td class="t62-actions">
                <button type="button" class="t62-link" *ngIf="r.status === 'locked' && d.can_unlock" (click)="unlock(r)" data-pc-unlock>Unlock</button>
                <button type="button" class="t62-link" *ngIf="r.status === 'unlocked' && d.can_lock" (click)="relock(r)" data-pc-relock>Lock again</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">While a period is locked nothing can change it: no payslip or payroll run of the month, no attendance or overtime, no leave on its days and no salary change effective inside it. Only HR with the right "Can unlock a locked payroll period" can unlock it, with a reason; every step is logged.</p>
    </div>

    <!-- revise salary -->
    <div class="t62-body" *ngIf="tab === 'revise' && d">
      <div class="pc-bar">
        <label>Status<select [(ngModel)]="fStatus" (change)="load()"><option value="">All</option><option value="pending">Waiting for approval</option><option value="applied">Approved and applied</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select></label>
        <a class="t62-link" style="display:inline-flex;align-items:center" routerLink="/main-sidebar/general-sidebar/approval-level">Approval levels of "Salary revision"</a>
      </div>
      <div class="table-responsive">
        <table class="table hr-table" data-pc-list>
          <thead><tr><th>Employee</th><th>Effective from</th><th>Changes</th><th>Reason</th><th>Status</th><th>Approval</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!d.rows.length"><td colspan="7" class="hr-empty">No salary revision yet. Use + New salary revision.</td></tr>
            <tr *ngFor="let r of d.rows" [attr.data-z-id]="r.id" [attr.data-pc-rev]="r.emp_code">
              <td>{{ r.employee }}<span class="t62-cell-sub">{{ r.request_number }}</span></td><td>{{ dmy(r.effective_from) }}</td>
              <td><div *ngFor="let l of r.lines" class="pc-small">{{ l.name }}: {{ +l.old | number:'1.2-2' }} → <b>{{ +l.new | number:'1.2-2' }}</b></div></td>
              <td>{{ r.reason }}</td>
              <td><span class="pc-st" [ngClass]="r.status">{{ r.status_label }}</span><span class="t62-cell-sub" *ngIf="r.result">{{ r.result }}</span></td>
              <td><ul class="pc-steps"><li *ngFor="let s of r.steps">{{ s.level }}. {{ s.approver || s.role }} – {{ s.status_label }}<span *ngIf="s.note">: {{ s.note }}</span></li></ul></td>
              <td class="t62-actions">
                <button type="button" class="t62-link" *ngIf="r.my_approval && r.status === 'pending'" (click)="decide(r, true)" data-pc-approve>Approve</button>
                <button type="button" class="t62-link" *ngIf="r.my_approval && r.status === 'pending'" (click)="decide(r, false)" data-pc-reject>Reject</button>
                <button type="button" class="t62-link" *ngIf="can && r.status === 'pending'" (click)="cancelRevision(r)" data-pc-cancel>Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">A revision goes through the approval levels of the request type "Salary revision" (Requests › Approval levels). When it is approved the new amounts apply from the effective date; for a date in the past the arrears of the payslips already made are added to the next payroll.</p>
    </div>

    <!-- re-hire -->
    <div class="t62-body" *ngIf="tab === 'rehire' && d">
      <div class="table-responsive">
        <table class="table hr-table" data-pc-list>
          <thead><tr><th>Employee</th><th>Joined</th><th>Last working day</th><th>Final settlement</th><th>Service periods</th><th class="hr-col-actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="!d.rows.length"><td colspan="6" class="hr-empty">No leaver to re-hire.</td></tr>
            <tr *ngFor="let r of d.rows" [attr.data-z-id]="r.id" [attr.data-pc-leaver]="r.emp_code">
              <td>{{ r.employee }}</td><td>{{ dmy(r.joined) }}</td><td>{{ dmy(r.last_working_day) }}</td>
              <td>{{ r.settlement || '–' }}<span class="t62-cell-sub">{{ r.settlement_status }}</span></td>
              <td><ul class="pc-steps"><li *ngFor="let p of r.periods">{{ dmy(p.start) }} – {{ p.end ? dmy(p.end) : '…' }}</li></ul></td>
              <td class="t62-actions"><button type="button" class="t62-link" *ngIf="d.can_edit" (click)="rehire(r)" data-pc-rehire>Re-hire</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="t62-note">Re-hire closes the old service period (its final settlement stays) and starts a new one on the re-hire date: gratuity and leave count from that date, unless the company chooses to keep the gratuity service from the first joining date.</p>
    </div>

    <!-- import -->
    <div class="t62-body" *ngIf="tab === 'import'">
      <div class="pc-card">
        <h2>Salary revision history</h2>
        <p>One row per change: employee code, component code, effective date, old amount, new amount, remarks. Check the file first (dry run) – nothing is saved; then apply the rows without errors.</p>
        <div class="pc-row">
          <label>File (CSV or Excel)<input type="file" accept=".csv,.xlsx" (change)="pick($event)" data-pc-file></label>
          <button type="button" class="t62-btn" (click)="template()" data-pc-template>Download the template</button>
          <button type="button" class="t62-btn" [disabled]="!file || busy" (click)="runImport(false)" data-pc-dry>Check the file (dry run)</button>
          <button type="button" class="t62-btn primary" [disabled]="!file || busy || !imp || !imp.ok" (click)="runImport(true)" data-pc-apply>Apply the rows without errors</button>
        </div>
        <p class="pc-sum" *ngIf="imp" data-pc-imp-sum>{{ impSummary() }}</p>
      </div>
      <div class="table-responsive" *ngIf="imp">
        <table class="table hr-table" data-pc-imp>
          <thead><tr><th>Row</th><th>Employee</th><th>Component</th><th>Effective date</th><th class="pc-num">Old</th><th class="pc-num">New</th><th>Remarks</th><th>Check</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of imp.rows" [class.pc-err-row]="!r.ok" [attr.data-pc-imp-row]="r.row">
              <td>{{ r.row }}</td><td>{{ r.employee || r.employee_code }}</td><td>{{ r.component || r.component_code }}</td><td>{{ dmy(r.effective_date) }}</td>
              <td class="pc-num">{{ r.old }}</td><td class="pc-num">{{ r.new }}</td><td>{{ r.remarks }}</td>
              <td><div *ngFor="let e of r.errors" class="pc-bad">{{ e }}</div><div *ngFor="let w of r.warnings" class="pc-warn">{{ w }}</div><span *ngIf="r.ok && !r.warnings.length" class="pc-st released">OK</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- settings -->
    <div class="t62-body" *ngIf="tab === 'settings' && d">
      <div class="pc-card" data-pc-set-pay>
        <h2>Automatic pay-date shift</h2>
        <p>When the payment date of a payroll run falls on a weekend or a public holiday of the run's branch (its weekend calendar and holiday calendar), it is moved to the working day before.</p>
        <label class="pc-check"><input type="checkbox" [(ngModel)]="d.pay_date_shift" [disabled]="!d.can_edit" data-pc-shift> Move the payment date to the working day before</label>
      </div>
      <div class="pc-card" data-pc-set-loan>
        <h2>Loan limit by gratuity</h2>
        <p>A loan cannot be more than the gratuity the employee has earned to date (the same figure as Reports › Gratuity), or the percentage of it set here.</p>
        <label class="pc-check"><input type="checkbox" [(ngModel)]="d.loan_gratuity_limit" [disabled]="!d.can_edit" data-pc-loan> Limit loans to the gratuity earned</label>
        <div class="pc-row">
          <label>Percentage of the gratuity (empty = 100 %)<input type="number" min="1" max="100" step="1" [(ngModel)]="d.loan_gratuity_pct" [disabled]="!d.can_edit || !d.loan_gratuity_limit" data-pc-pct></label>
        </div>
        <label class="pc-check"><input type="checkbox" [(ngModel)]="d.loan_include_open" [disabled]="!d.can_edit || !d.loan_gratuity_limit"> Count what is still owed on other open loans</label>
        <p class="pc-bad" *ngIf="setErr" data-pc-set-err>{{ setErr }}</p>
      </div>
      <button type="button" class="t62-btn primary" *ngIf="d.can_edit" [disabled]="busy" (click)="saveSettings()" data-pc-save>Save</button>
    </div>
  </div>
</div>

<!-- revise salary dialog -->
<div class="t62-dlg pc-dlg" *ngIf="rv" data-pc-rv>
  <div class="t62-veil" (click)="rv = null"></div>
  <div class="t62-box" role="dialog">
    <div class="t62-head"><div><h2 class="t62-title">New salary revision</h2><p class="t62-sub">The new amounts apply from the effective date once the revision is approved.</p></div>
      <button type="button" class="t62-x" (click)="rv = null" aria-label="Close">×</button></div>
    <div class="t62-dbody">
      <div class="t62-sec"><h3>Employee</h3>
        <div class="t62-fgrid">
          <label class="t62-f full"><span class="t62-l">Employee <span class="t62-req">*</span></span>
            <input class="t62-in" [(ngModel)]="rv.q" placeholder="Search" data-pc-rv-q>
            <select [(ngModel)]="rv.employee" (change)="loadSalary()" [class.bad]="rv.err.employee" data-pc-rv-emp>
              <option [ngValue]="null">–</option><option *ngFor="let e of shownEmps()" [ngValue]="e.id">{{ e.label }}</option></select>
            <span class="t62-err" *ngIf="rv.err.employee">{{ rv.err.employee }}</span></label>
          <label class="t62-f"><span class="t62-l">Effective from <span class="t62-req">*</span></span>
            <z-date-field [value]="rv.effective_from" (valueChange)="rv.effective_from = $event; rv.err.effective_from = ''" label="Effective from" data-pc-rv-date></z-date-field>
            <span class="t62-err" *ngIf="rv.err.effective_from">{{ rv.err.effective_from }}</span></label>
          <label class="t62-f"><span class="t62-l">Reason <span class="t62-req">*</span></span>
            <input [(ngModel)]="rv.reason" (input)="rv.err.reason = ''" maxlength="255" [class.bad]="rv.err.reason" data-pc-rv-reason>
            <span class="t62-err" *ngIf="rv.err.reason">{{ rv.err.reason }}</span></label>
        </div>
      </div>
      <div class="t62-sec" *ngIf="rv.rows"><h3>Salary</h3>
        <table class="t62-tbl" data-pc-rv-lines>
          <thead><tr><th>Component</th><th class="pc-num">Now</th><th>New amount</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of rv.rows; let i = index">
              <td>{{ l.name }} <span class="t62-cell-sub">{{ l.code }}</span></td><td class="pc-num">{{ +l.amount | number:'1.2-2' }}</td>
              <td><input type="number" step="0.01" min="0" [(ngModel)]="l.new" [disabled]="l.value_type !== 'fixed'" [class.bad]="rv.err['lines.' + i]" [attr.data-pc-rv-new]="l.code">
                <span class="t62-err" *ngIf="rv.err['lines.' + i]">{{ rv.err['lines.' + i] }}</span>
                </td>
            </tr>
          </tbody>
        </table>
        <span class="t62-err" *ngIf="rv.err.lines">{{ rv.err.lines }}</span>
        <p class="t62-hint">Only fixed amounts are revised here; components worked out by a formula follow the fixed amounts they use.</p>
      </div>
      <p class="t62-top" *ngIf="rv.err._" data-pc-rv-top>{{ rv.err._ }}</p>
    </div>
    <div class="t62-foot"><span class="t62-grow"></span>
      <button type="button" class="t62-btn" (click)="rv = null">Cancel</button>
      <button type="button" class="t62-btn primary" [disabled]="busy" (click)="saveRevision()" data-pc-rv-save>Send for approval</button></div>
  </div>
</div>`,
})
export class PayctlComponent implements OnInit {
  tabs = TABS; tab = 'holds'; d: any = null; failed = ''; can = false; busy = false;
  months = monthOptions(); fMonth = ''; fStatus = '';
  emps: { id: number; label: string; code: string }[] = [];
  rv: any = null; file: File | null = null; imp: any = null; setErr = '';
  dmy = dmy;
  constructor(private http: HttpClient, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  url(p: string): string {
    const sch = encodeURIComponent(localStorage.getItem('selectedSchema') || '');
    return `${environment.apiBaseUrl}${p}${p.includes('?') ? '&' : '?'}schema=${sch}`;
  }
  ngOnInit(): void {
    this.route.data.subscribe(x => { this.tab = x['tab'] || 'holds'; this.d = null; this.fStatus = ''; this.imp = null; this.failed = ''; this.load(); });
  }
  title(): string { return T((TABS.find(x => x.key === this.tab) || TABS[0]).label); }
  intro(): string {
    return T({
      holds: 'Hold the whole salary of a month or part of it, and release it into a later payroll run.',
      locks: 'Lock a closed payroll period so that nothing can change it.',
      revise: 'Change an employee’s salary from an effective date, with approval.',
      rehire: 'Bring back an employee who left: a new service period, the old one closed with its final settlement.',
      import: 'Import earlier salary changes with their effective dates.',
      settings: 'Payment dates and loan limits of the payroll.',
    }[this.tab] || '');
  }
  async load(): Promise<void> {
    const ep: any = { holds: 'holds/', locks: 'locks/', revise: 'revisions/', rehire: 'rehire/', settings: 'settings/' };
    if (!ep[this.tab]) { this.d = {}; this.cd.detectChanges(); return; }
    let q = '';
    if (this.tab === 'holds') { q = `?month=${this.fMonth}&status=${this.fStatus}`; }
    if (this.tab === 'revise') { q = `?status=${this.fStatus}`; }
    try {
      this.d = await firstValueFrom(this.http.get<any>(this.url(API + ep[this.tab] + q)));
      this.can = !!(this.d.can_edit ?? this.d.can_lock);
      if (this.tab === 'settings' && this.d.loan_gratuity_pct === null) { this.d.loan_gratuity_pct = ''; }
      this.failed = '';
    } catch (e) { this.d = null; this.failed = errText(e); }
    this.cd.detectChanges();
  }
  async loadEmps(): Promise<void> {
    if (this.emps.length) { return; }
    try {
      const r: any = await firstValueFrom(this.http.get<any>(this.url('/employee/api/emplist/')));
      this.emps = (Array.isArray(r) ? r : r?.results || []).map((e: any) => ({ id: e.id, label: empLabel(e), code: e.emp_code }));
    } catch { this.emps = []; }
  }
  shownEmps(): any[] {
    const q = (this.rv?.q || '').toLowerCase();
    return this.emps.filter(e => !q || e.label.toLowerCase().includes(q) || e.id === this.rv?.employee).slice(0, 80);
  }

  // ---------------------------------------------------------------- holds
  async newHold(): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'salary hold', endpoint: API + 'holds/', heading: 'New salary hold', action: 'Hold the salary',
      subtitle: 'The payslip keeps the salary earned; the held part is not paid that month (left out of the WPS file and the bank list).',
      sections: [{ title: 'Salary hold', fields: [
        { key: 'employee', label: 'Employee', type: 'select', required: true, full: true, search: true,
          source: { endpoint: '/employee/api/emplist/', value: 'id', label: (r: any) => empLabel(r) } },
        { key: 'month', label: 'Salary month', type: 'select', required: true, options: this.months },
        { key: 'kind', label: 'Hold', type: 'select', required: true, options: [
          { value: 'full', label: 'Whole salary' }, { value: 'amount', label: 'An amount' }, { value: 'percent', label: 'A percentage of the net pay' }] },
        { key: 'value', label: 'Amount or percentage', type: 'number', showIf: (v: any) => v.kind === 'amount' || v.kind === 'percent', required: true },
        { key: 'reason', label: 'Reason', type: 'textarea', required: true, full: true },
      ] }],
      initial: { kind: 'full', month: this.months[6].value },
      okText: () => T('Salary hold saved.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
  async release(r: any): Promise<void> {
    const later = this.months.filter(m => m.value > r.month.slice(0, 7));
    const cfg: ZFormConfig = {
      thing: 'release', endpoint: `${API}holds/${r.id}/release/`, heading: 'Release the held salary', action: 'Release',
      subtitle: T('{0} of {1}, {2}: paid as the line "Held salary released" in the payroll run below.', [(+r.held_amount).toFixed(2), r.employee, r.month_label]),
      sections: [{ title: 'Release', fields: [
        { key: 'release_from', label: 'Pay it in', type: 'select', options: [{ value: '', label: 'The next payroll run' }, ...later] },
        { key: 'note', label: 'Note', type: 'text', full: true }] }],
      initial: { release_from: '' },
      toBody: (v: any) => ({ release_from: v.release_from || null, note: v.note || '' }),
      okText: () => T('Release saved.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
  async cancelHold(r: any): Promise<void> {
    if (!(await zConfirm(T('Cancel the hold of {0}, {1}? The salary is paid in full.', [r.employee, r.month_label]), { danger: true, ok: T('Cancel the hold') }))) { return; }
    await this.post(`${API}holds/${r.id}/cancel/`, {}, T('Hold cancelled.'));
  }

  // ---------------------------------------------------------------- locks
  async newLock(): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'period lock', endpoint: API + 'locks/', heading: 'Lock a payroll period', action: 'Lock',
      subtitle: 'Every payroll run of the month must be processed, approved or paid. While it is locked nothing can change the period.',
      sections: [{ title: 'Period', fields: [
        { key: 'month', label: 'Salary month', type: 'select', required: true, options: monthOptions(18, 1) },
        { key: 'branch', label: 'Branch', type: 'select', options: [{ value: '', label: 'All branches' }, ...(this.d?.branches || []).map((b: any) => ({ value: b.id, label: b.name }))] },
        { key: 'note', label: 'Note', type: 'text', full: true }] }],
      initial: { branch: '' },
      toBody: (v: any) => ({ month: v.month, branch: v.branch || null, note: v.note || '' }),
      okText: () => T('Period locked.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
  async unlock(r: any): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'unlock', endpoint: `${API}locks/${r.id}/unlock/`, heading: 'Unlock the payroll period', action: 'Unlock',
      subtitle: T('{0} – {1}. The reason is kept in the log.', [r.month_label, r.branch]),
      sections: [{ title: 'Unlock', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true, full: true }] }],
      okText: () => T('Period unlocked.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
  async relock(r: any): Promise<void> {
    if (!(await zConfirm(T('Lock {0} – {1} again?', [r.month_label, r.branch])))) { return; }
    await this.post(API + 'locks/', { month: r.month.slice(0, 7), branch: r.branch_id }, T('Period locked.'));
  }

  // ---------------------------------------------------------------- revise salary
  async newRevision(): Promise<void> {
    await this.loadEmps();
    this.rv = { employee: null, effective_from: '', reason: '', rows: null, err: {}, q: '' };
    this.cd.detectChanges();
  }
  async loadSalary(): Promise<void> {
    if (!this.rv?.employee) { this.rv.rows = null; return; }
    try {
      const r = await firstValueFrom(this.http.get<any>(this.url(`${API}revisions/salary/?employee=${this.rv.employee}`)));
      // only the fixed amounts are revised; formula components follow the fixed ones they use
      this.rv.rows = (r.rows || []).filter((x: any) => x.value_type === 'fixed').map((x: any) => ({ ...x, new: +x.amount }));
      delete this.rv.err.employee;
    } catch (e) { this.rv.err = { _: errText(e) }; }
    this.cd.detectChanges();
  }
  async saveRevision(): Promise<void> {
    const v = this.rv; v.err = {};
    if (!v.employee) { v.err.employee = T('Choose the employee.'); }
    if (!v.effective_from) { v.err.effective_from = T('Enter the effective date.'); }
    if (!String(v.reason || '').trim()) { v.err.reason = T('Enter the reason.'); }
    if (Object.keys(v.err).length) { this.cd.detectChanges(); return; }
    const lines = (v.rows || []).filter((l: any) => l.value_type === 'fixed' && l.new !== null && l.new !== '' && (+l.new).toFixed(2) !== (+l.amount).toFixed(2))
      .map((l: any) => ({ component_id: l.component_id, new: l.new }));
    this.busy = true;
    try {
      await firstValueFrom(this.http.post<any>(this.url(API + 'revisions/'), { employee: v.employee, effective_from: v.effective_from, reason: v.reason, lines }));
      zToast(T('Salary revision sent for approval.'), 'ok');
      this.rv = null; await this.load();
    } catch (e: any) {
      const d = e?.error || {};
      const err: any = {};
      for (const [k, x] of Object.entries(d)) { if (k !== 'detail') { err[k] = Array.isArray(x) ? (x as any[]).join(' ') : x; } }
      if (!Object.keys(err).length || d.detail && !Object.values(err).includes(d.detail)) { err._ = d.detail || errText(e); }
      v.err = err;
    }
    this.busy = false; this.cd.detectChanges();
  }
  async decide(r: any, ok: boolean): Promise<void> {
    if (ok) {
      if (!(await zConfirm(T('Approve the salary revision of {0} from {1}?', [r.employee, dmy(r.effective_from)])))) { return; }
      await this.post(`${API}revisions/${r.id}/approve/`, {}, T('Approved.'));
      return;
    }
    const cfg: ZFormConfig = {
      thing: 'rejection', endpoint: `${API}revisions/${r.id}/reject/`, heading: 'Reject the salary revision', action: 'Reject',
      subtitle: r.employee, sections: [{ title: 'Reject', fields: [{ key: 'note', label: 'Reason', type: 'textarea', required: true, full: true }] }],
      okText: () => T('Rejected.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
  async cancelRevision(r: any): Promise<void> {
    if (!(await zConfirm(T('Cancel the salary revision of {0}?', [r.employee]), { danger: true, ok: T('Cancel the revision') }))) { return; }
    await this.post(`${API}revisions/${r.id}/cancel/`, {}, T('Cancelled.'));
  }

  // ---------------------------------------------------------------- re-hire
  async rehire(r: any): Promise<void> {
    const cfg: ZFormConfig = {
      thing: 'rehire', endpoint: `${API}rehire/${r.id}/`, heading: 'Re-hire', action: 'Re-hire',
      subtitle: T('{0} – last working day {1}. The old service period is closed; its final settlement stays.', [r.employee, dmy(r.last_working_day)]),
      sections: [{ title: 'New service period', fields: [
        { key: 'rehire_date', label: 'Re-hire date', type: 'date', required: true },
        { key: 'gratuity_continuity', label: 'Keep the gratuity service from the first joining date', type: 'check', full: true,
          hint: 'Off: gratuity and leave count from the re-hire date.' },
        { key: 'note', label: 'Note', type: 'text', full: true }] }],
      initial: { gratuity_continuity: false },
      okText: () => T('Re-hired.'),
    };
    if (await openZForm(cfg)) { await this.load(); }
  }

  // ---------------------------------------------------------------- import
  impSummary(): string {
    const i = this.imp;
    return i.dry_run ? T('Dry run: {0} rows without errors, {1} rows with errors.', [i.ok, i.errors])
      : T('Applied: {0} rows without errors, {1} rows with errors – {2} revisions saved.', [i.ok, i.errors, i.applied]);
  }
  pick(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.imp = null; this.cd.detectChanges(); }
  template(): void { window.open(this.url(API + 'import/template/'), '_blank'); }
  async runImport(apply: boolean): Promise<void> {
    if (!this.file) { return; }
    if (apply && !(await zConfirm(T('Save {0} revisions to the salary history?', [this.imp?.ok || 0])))) { return; }
    const fd = new FormData(); fd.append('file', this.file); fd.append('apply', apply ? '1' : '0');
    this.busy = true;
    try {
      this.imp = await firstValueFrom(this.http.post<any>(this.url(API + 'import/'), fd));
      if (apply) { zToast(T('{0} revisions saved.', [this.imp.applied]), 'ok'); }
    } catch (e) { zToast(errText(e), 'err'); }
    this.busy = false; this.cd.detectChanges();
  }

  // ---------------------------------------------------------------- settings
  async saveSettings(): Promise<void> {
    this.busy = true; this.setErr = '';
    try {
      const b = { pay_date_shift: this.d.pay_date_shift, loan_gratuity_limit: this.d.loan_gratuity_limit, loan_include_open: this.d.loan_include_open,
                  loan_gratuity_pct: this.d.loan_gratuity_pct === '' ? null : this.d.loan_gratuity_pct };
      const r = await firstValueFrom(this.http.put<any>(this.url(API + 'settings/'), b));
      this.d = { ...r, loan_gratuity_pct: r.loan_gratuity_pct ?? '' };
      zToast(T('Saved.'), 'ok');
    } catch (e: any) { this.setErr = e?.error?.loan_gratuity_pct || errText(e); }
    this.busy = false; this.cd.detectChanges();
  }

  private async post(path: string, body: any, ok: string): Promise<void> {
    try { await firstValueFrom(this.http.post<any>(this.url(path), body)); zToast(ok, 'ok'); }
    catch (e) { zToast(errText(e), 'err'); }
    await this.load();
  }
}
