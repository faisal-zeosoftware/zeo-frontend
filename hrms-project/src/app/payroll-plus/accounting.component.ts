import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe } from '../shared-ui/i18n.service';
import { FLOW_CSS } from '../zeo-flow/flow.service';

/**
 * v1.35.0 – Payroll → Accounting: payroll runs, month-end provisions, final settlements and expense claims as journals
 * v1.40.0 – Property app sources (invoices / credit notes, receipts and refunds, owner payouts, commissions, vendor bills) and their accounts
 * for Odoo, Zoho Books, Excel / CSV (Tally, Sage, QuickBooks, Xero …) or any application that pulls them through the ZEO API.
 * Department, employee and branch posting: not posted / analytic account (reporting tag) / separate GL code / both.
 * API: accounting/api/…
 */
const API = `${environment.apiBaseUrl}/accounting/api/`;
const schema = () => localStorage.getItem('selectedSchema') || '';
const CSS = FLOW_CSS + `
.ac-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #e3e5ee;margin:0 0 14px}
.ac-tabs button{border:0;background:none;padding:9px 14px;font-size:13.5px;color:#6b7185;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.ac-tabs button.on{color:#5b4fe0;border-bottom-color:#5b4fe0;font-weight:600}
.ac-form{display:grid;gap:10px 14px;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));align-items:end}
.ac-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#6b7185;min-width:0}
.ac-form input,.ac-form select{height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;font-size:13px;min-width:0;background:#fff}
.ac-form label.chk{flex-direction:row;align-items:center;gap:8px}.ac-form label.chk input{height:auto}
.ac-form label.wide{grid-column:1/-1}
.ac-modes{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))}
.ac-mode{border:1px solid #e3e5ee;border-radius:12px;padding:12px 14px}
.ac-mode h3{margin:0 0 8px;font-size:13.5px;color:#1b1640}
.ac-mode label{display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:5px 0;cursor:pointer}
.ac-mode small{display:block;color:#6b7185;font-size:11.5px}
.ac-eg{font-family:ui-monospace,monospace;font-size:12px;background:#f6f7fb;border-radius:8px;padding:8px 10px;margin-top:10px;white-space:pre-wrap;color:#2b2f42}
.ac-wide{overflow:auto}
.ac-num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ac-tbl input{height:30px;border:1px solid #dcdfea;border-radius:6px;padding:0 8px;font-size:12.5px;width:100%;min-width:90px;box-sizing:border-box}
.ac-tbl select{height:30px;border:1px solid #dcdfea;border-radius:6px;font-size:12.5px;max-width:200px}
.ac-prob{background:#fff7e6;color:#9a5b00;border-radius:8px;padding:7px 10px;font-size:12.5px;margin:4px 0}
.ac-prob.block{background:#fff5f5;color:#b42318}
.ac-dim{display:inline-block;background:#eef0fb;color:#3c3f8f;border-radius:6px;padding:1px 6px;font-size:11px;margin:1px 2px 1px 0}
.ac-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ac-secret{font-size:12px;color:#1f7a4d}
.ac-kpi{cursor:pointer}
`;
function err(e: any): string {
  const d = e?.error;
  if (!d) { return e?.message || 'Request failed'; }
  if (typeof d === 'string') { return d.slice(0, 200); }
  if (d.detail) { return d.detail; }
  return Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' · ');
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe],
  styles: [CSS],
  template: `
<div class="fw">
  <div class="fw-head">
    <div>
      <h1>{{ 'Accounting integration' | t }}</h1>
      <p>{{ 'Payroll, month-end provisions, final settlements and expense claims as balanced journals – posted to Odoo or Zoho Books, downloaded for any other accounting software, or pulled by it through the ZEO API. Department, employee and branch can be posted as analytic accounts, separate GL codes or both.' | t }}</p>
    </div>
    <span class="sp"></span>
    <span class="fw-chip" *ngIf="s">{{ connName() }}</span>
  </div>
  <div class="fw-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>

  <div class="ac-tabs">
    <button type="button" *ngFor="let t of tabs" [class.on]="tab === t[0]" (click)="go(t[0])">{{ t[1] | t }}</button>
  </div>

  <!-- ============ journals ============ -->
  <ng-container *ngIf="tab === 'journals'">
    <div class="fw-kpis" *ngIf="j">
      <div class="fw-kpi ac-kpi" (click)="flt = 'draft'; loadJ()" [class.warn]="j.counts.draft"><span>{{ 'To fix' | t }}</span><b>{{ j.counts.draft || 0 }}</b></div>
      <div class="fw-kpi ac-kpi" (click)="flt = 'ready'; loadJ()"><span>{{ 'Ready to post' | t }}</span><b>{{ j.counts.ready || 0 }}</b></div>
      <div class="fw-kpi ac-kpi" (click)="flt = 'failed'; loadJ()" [class.bad]="j.counts.failed"><span>{{ 'Failed' | t }}</span><b>{{ j.counts.failed || 0 }}</b></div>
      <div class="fw-kpi ac-kpi" (click)="flt = 'posted,exported'; loadJ()"><span>{{ 'Posted / exported' | t }}</span><b>{{ (j.counts.posted || 0) + (j.counts.exported || 0) }}</b></div>
    </div>
    <div class="fw-card">
      <div class="ac-row" style="margin-bottom:10px">
        <select [(ngModel)]="flt" (change)="loadJ()" style="height:34px;border:1px solid #dcdfea;border-radius:8px">
          <option value="">{{ 'All journals' | t }}</option><option value="draft">{{ 'To fix' | t }}</option><option value="ready">{{ 'Ready to post' | t }}</option>
          <option value="failed">{{ 'Failed' | t }}</option><option value="posted,exported">{{ 'Posted / exported' | t }}</option><option value="reversed">{{ 'Reversed' | t }}</option>
        </select>
        <select [(ngModel)]="srcFlt" (change)="loadJ()" style="height:34px;border:1px solid #dcdfea;border-radius:8px">
          <option value="">{{ 'Every source' | t }}</option><option *ngFor="let o of sourceOpts" [value]="o[0]">{{ o[1] | t }}</option>
        </select>
        <span class="sp" style="flex:1"></span>
        <button type="button" class="fw-btn" (click)="download('', 'xlsx')" [disabled]="!j?.counts.ready">{{ 'Download ready journals (Excel)' | t }}</button>
        <button type="button" class="fw-btn primary" *ngIf="rights.can_post" (click)="go('build')">+ {{ 'Make a journal' | t }}</button>
      </div>
      <div class="ac-wide">
      <table class="fw-table">
        <tr><th>{{ 'Journal' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'From' | t }}</th><th>{{ 'Posting' | t }}</th><th class="ac-num">{{ 'Amount' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'In the accounting app' | t }}</th></tr>
        <tr *ngFor="let b of j?.results">
          <td><a class="fw-link" (click)="open(b.id)">{{ b.number }}</a></td>
          <td>{{ b.date | date:'dd/MM/yyyy' }}</td>
          <td>{{ b.label }}<div class="fw-muted" *ngIf="b.reversal_of">{{ 'reverses' | t }} {{ b.reversal_of }}</div></td>
          <td class="fw-small">{{ rulesText(b.rules) }}</td>
          <td class="ac-num">{{ b.debit | number:'1.2-2' }}</td>
          <td><span class="fw-chip" [ngClass]="chip(b.status)">{{ b.status_name }}</span>
              <div class="fw-muted" *ngIf="b.problems?.length">{{ b.problems.length }} {{ 'to fix' | t }}</div></td>
          <td class="fw-small">{{ b.external_ref || '–' }}</td>
        </tr>
        <tr *ngIf="j && !j.results.length"><td colspan="7" class="fw-muted">{{ 'No journals yet. Approve a payroll run or make one with "Make a journal".' | t }}</td></tr>
      </table>
      </div>
    </div>

    <div class="fw-card" *ngIf="cur">
      <div class="ac-row">
        <h2 style="margin:0">{{ cur.number }} · {{ cur.label }}</h2>
        <span class="fw-chip" [ngClass]="chip(cur.status)">{{ cur.status_name }}</span>
        <span class="sp" style="flex:1"></span>
        <ng-container *ngIf="rights.can_post">
          <button type="button" class="fw-btn sm" *ngIf="['draft','ready','failed'].includes(cur.status) && cur.source !== 'reversal'" (click)="act('recheck')">{{ 'Check again' | t }}</button>
          <button type="button" class="fw-btn sm primary" *ngIf="['ready','failed'].includes(cur.status) && isApp()" (click)="act('post')">{{ 'Post to' | t }} {{ connName() }}</button>
          <button type="button" class="fw-btn sm" *ngIf="['ready','failed'].includes(cur.status) || (cur.status === 'draft' && cur.source === 'reversal')" (click)="markExported()">{{ 'Mark as entered / exported' | t }}</button>
          <button type="button" class="fw-btn sm danger" *ngIf="['posted','exported'].includes(cur.status)" (click)="act('reverse')">{{ 'Reverse' | t }}</button>
          <button type="button" class="fw-btn sm" *ngIf="['draft','ready','failed'].includes(cur.status)" (click)="act('cancel')">{{ 'Cancel' | t }}</button>
        </ng-container>
        <button type="button" class="fw-btn sm" (click)="download(cur.id, 'xlsx')">Excel</button>
        <button type="button" class="fw-btn sm" (click)="download(cur.id, 'csv')">CSV</button>
      </div>
      <p class="fw-muted">{{ 'Date' | t }} {{ cur.date | date:'dd/MM/yyyy' }} · {{ 'Reference' | t }} {{ cur.reference }} · {{ rulesText(cur.rules) }}
        <span *ngIf="cur.external_ref"> · {{ connName(cur.connector) }} {{ cur.external_ref }}</span></p>
      <div *ngFor="let p of cur.problems" class="ac-prob" [class.block]="p.block">{{ p.text }}</div>
      <div class="ac-prob block" *ngIf="cur.last_error">{{ cur.last_error }}
        <a class="fw-link" *ngIf="rights.can_manage" (click)="missing()"> · {{ 'Find missing accounts' | t }}</a></div>
      <div class="ac-prob" *ngIf="miss?.length">{{ 'Not in the accounting app:' | t }} <b>{{ missCodes() }}</b>
        <button type="button" class="fw-btn sm" style="margin-left:8px" (click)="createAccounts()">{{ 'Create them there' | t }}</button></div>
      <div class="ac-wide">
      <table class="fw-table">
        <tr><th>#</th><th>{{ 'Account' | t }}</th><th>{{ 'Description' | t }}</th><th>{{ 'Department' | t }}</th><th>{{ 'Employee' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Analytic' | t }}</th><th class="ac-num">{{ 'Debit' | t }}</th><th class="ac-num">{{ 'Credit' | t }}</th></tr>
        <tr *ngFor="let l of cur.lines">
          <td>{{ l.seq }}</td><td><b>{{ l.account }}</b><div class="fw-muted" *ngIf="l.base_account && l.base_account !== l.account">{{ 'from' | t }} {{ l.base_account }}</div></td>
          <td>{{ l.label }}</td><td>{{ l.department }}</td><td>{{ l.employee }}</td><td>{{ l.branch }}</td>
          <td><span class="ac-dim" *ngFor="let a of (l.analytic_names || dims(l.analytics))">{{ a }}</span><span class="ac-dim" *ngIf="l.partner_ref">partner {{ l.partner_ref }}</span></td>
          <td class="ac-num">{{ +l.debit ? (l.debit | number:'1.2-2') : '' }}</td><td class="ac-num">{{ +l.credit ? (l.credit | number:'1.2-2') : '' }}</td>
        </tr>
        <tr><td colspan="7"><b>{{ 'Total' | t }}</b></td><td class="ac-num"><b>{{ cur.debit | number:'1.2-2' }}</b></td><td class="ac-num"><b>{{ cur.credit | number:'1.2-2' }}</b></td></tr>
      </table>
      </div>
      <h2 style="margin-top:14px">{{ 'History' | t }}</h2>
      <div class="fw-small" *ngFor="let x of cur.log"><span [style.color]="x.ok ? '#1f7a4d' : '#b42318'">●</span> {{ x.at | date:'dd/MM/yyyy HH:mm' }} – {{ x.action }} {{ x.detail }}</div>
    </div>
  </ng-container>

  <!-- ============ make a journal ============ -->
  <ng-container *ngIf="tab === 'build' && src">
    <div class="fw-card">
      <h2>{{ 'Payroll runs' | t }}</h2>
      <table class="fw-table">
        <tr><th>{{ 'Run' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Journal' | t }}</th><th></th></tr>
        <tr *ngFor="let r of src.payroll"><td>{{ r.label }}</td><td>{{ r.status }}</td>
          <td><a class="fw-link" *ngIf="r.journal" (click)="go('journals'); open(r.journal.id)">{{ r.journal.number }} ({{ r.journal.status }})</a></td>
          <td><button type="button" class="fw-btn sm" *ngIf="!r.journal || ['draft','ready','failed','reversed'].includes(r.journal.status)" (click)="build({source:'payroll', id:r.id})">{{ (r.journal ? 'Build again' : 'Make journal') | t }}</button></td></tr>
        <tr *ngIf="!src.payroll.length"><td colspan="4" class="fw-muted">{{ 'No approved payroll runs.' | t }}</td></tr>
      </table>
    </div>
    <div class="fw-card">
      <h2>{{ 'Month-end provisions (gratuity, leave salary)' | t }}</h2>
      <p class="fw-muted">{{ 'The change since the last posted provision, per employee. Made by itself on the 1st of each month when "build automatically" is on.' | t }}</p>
      <div class="ac-row"><label class="fw-small">{{ 'Month end' | t }} <input type="date" [(ngModel)]="provDate" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"></label>
        <button type="button" class="fw-btn sm primary" (click)="build({source:'provision', as_of: provDate})">{{ 'Make journal' | t }}</button></div>
    </div>
    <div class="fw-card">
      <h2>{{ 'Final settlements' | t }}</h2>
      <table class="fw-table">
        <tr><th>{{ 'Settlement' | t }}</th><th>{{ 'Status' | t }}</th><th class="ac-num">{{ 'Net' | t }}</th><th>{{ 'Journal' | t }}</th><th></th></tr>
        <tr *ngFor="let r of src.settlements"><td>{{ r.label }}</td><td>{{ r.status }}</td><td class="ac-num">{{ r.net | number:'1.2-2' }}</td>
          <td><a class="fw-link" *ngIf="r.journal" (click)="go('journals'); open(r.journal.id)">{{ r.journal.number }} ({{ r.journal.status }})</a></td>
          <td><button type="button" class="fw-btn sm" *ngIf="!r.journal || ['draft','ready','failed','reversed'].includes(r.journal.status)" (click)="build({source:'settlement', id:r.id})">{{ (r.journal ? 'Build again' : 'Make journal') | t }}</button></td></tr>
        <tr *ngIf="!src.settlements.length"><td colspan="5" class="fw-muted">{{ 'No approved final settlements.' | t }}</td></tr>
      </table>
    </div>
    <div class="fw-card">
      <h2>{{ 'Expense claims' | t }}</h2>
      <p class="fw-muted">{{ 'Approved expense reports of the period that are in no other journal.' | t }}</p>
      <div class="ac-row">
        <label class="fw-small">{{ 'From' | t }} <input type="date" [(ngModel)]="expFrom" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"></label>
        <label class="fw-small">{{ 'To' | t }} <input type="date" [(ngModel)]="expTo" style="height:32px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px"></label>
        <button type="button" class="fw-btn sm primary" (click)="build({source:'expense', from: expFrom, to: expTo})">{{ 'Make journal' | t }}</button></div>
    </div>
    <!-- v1.40.0 Property app -->
    <div class="fw-card" *ngIf="src.property">
      <div class="ac-row" style="margin-bottom:8px">
        <h2 style="margin:0">{{ 'Property' | t }}</h2>
        <select [(ngModel)]="propKind" style="height:32px;border:1px solid #dcdfea;border-radius:8px">
          <option *ngFor="let k of propKinds" [value]="k[0]">{{ k[1] | t }} ({{ src.property[k[0]].length }})</option></select>
        <span class="sp" style="flex:1"></span>
        <button type="button" class="fw-btn sm" *ngIf="s?.connector === 'odoo' && propKind === 'bills' && rights.can_post" (click)="checkPaid()" [disabled]="busy">{{ 'Check paid status in Odoo' | t }}</button>
        <button type="button" class="fw-btn sm primary" *ngIf="rights.can_post && propOpen().length" (click)="build({source: propSource(), ids: propOpen()})" [disabled]="busy">{{ 'Make journals for all' | t }} ({{ propOpen().length }})</button>
      </div>
      <p class="fw-muted">{{ 'Issued documents of the last 90 days. One journal per document; its number in the accounting app is written back on the Property record.' | t }}</p>
      <table class="fw-table">
        <tr><th>{{ 'Document' | t }}</th><th>{{ 'Date' | t }}</th><th>{{ 'Party' | t }}</th><th class="ac-num">{{ 'Amount' | t }}</th><th>{{ 'In accounting' | t }}</th><th>{{ 'Journal' | t }}</th><th></th></tr>
        <tr *ngFor="let r of src.property[propKind]"><td>{{ r.label }}</td><td>{{ r.date | date:'dd/MM/yyyy' }}</td><td>{{ r.party }}</td><td class="ac-num">{{ r.amount | number:'1.2-2' }}</td>
          <td class="fw-small">{{ r.status || '–' }}</td>
          <td><a class="fw-link" *ngIf="r.journal" (click)="go('journals'); open(r.journal.id)">{{ r.journal.number }} ({{ r.journal.status }})</a></td>
          <td><button type="button" class="fw-btn sm" *ngIf="rights.can_post && (!r.journal || ['draft','ready','failed','reversed'].includes(r.journal.status))" (click)="build({source: propSource(), id: r.id})">{{ (r.journal ? 'Build again' : 'Make journal') | t }}</button></td></tr>
        <tr *ngIf="!src.property[propKind].length"><td colspan="7" class="fw-muted">{{ 'Nothing to post.' | t }}</td></tr>
      </table>
    </div>
  </ng-container>

  <!-- ============ posting rules and connection ============ -->
  <ng-container *ngIf="tab === 'rules' && s">
    <div class="fw-card">
      <h2>{{ 'How department, employee and branch are posted' | t }}</h2>
      <div class="ac-modes">
        <div class="ac-mode">
          <h3>{{ 'Department' | t }}</h3>
          <label *ngFor="let c of s.choices.department_mode"><input type="radio" name="dm" [value]="c[0]" [(ngModel)]="s.department_mode" [disabled]="!rights.can_manage"> {{ c[1] | t }}</label>
        </div>
        <div class="ac-mode">
          <h3>{{ 'Employee' | t }}</h3>
          <label *ngFor="let c of s.choices.employee_mode"><input type="radio" name="em" [value]="c[0]" [(ngModel)]="s.employee_mode" [disabled]="!rights.can_manage"> {{ c[1] | t }}</label>
        </div>
        <div class="ac-mode">
          <h3>{{ 'Branch' | t }}</h3>
          <label *ngFor="let c of s.choices.branch_mode"><input type="radio" name="bm" [value]="c[0]" [(ngModel)]="s.branch_mode" [disabled]="!rights.can_manage"> {{ c[1] | t }}</label>
        </div>
        <div class="ac-mode">
          <h3>{{ 'Lines that carry them' | t }}</h3>
          <label *ngFor="let c of s.choices.dims_on"><input type="radio" name="do" [value]="c[0]" [(ngModel)]="s.dims_on" [disabled]="!rights.can_manage"> {{ c[1] | t }}</label>
          <small>{{ 'With "every line" the payable and the deductions are split per department / employee too.' | t }}</small>
        </div>
      </div>
      <div class="ac-form" style="margin-top:12px">
        <label>{{ 'Department GL code pattern' | t }}<input [(ngModel)]="s.dept_gl_pattern" [disabled]="!rights.can_manage"></label>
        <label>{{ 'Employee GL code pattern' | t }}<input [(ngModel)]="s.emp_gl_pattern" [disabled]="!rights.can_manage"></label>
        <label>{{ 'Branch GL code pattern' | t }}<input [(ngModel)]="s.branch_gl_pattern" [disabled]="!rights.can_manage"></label>
      </div>
      <div class="ac-eg">{{ example() }}</div>
      <p class="fw-muted">{{ 'A GL code set for one department or employee (Accounts tab, "for department / employee") is used as it is. Otherwise the pattern is applied with the code from the Departments / Employees tab, or the ZEO department / employee code.' | t }}</p>
    </div>
    <div class="fw-card">
      <h2>{{ 'Default accounts' | t }}</h2>
      <div class="ac-form">
        <label *ngFor="let f of accFields">{{ f[1] | t }}<input [(ngModel)]="s[f[0]]" [disabled]="!rights.can_manage"></label>
      </div>
    </div>
    <div class="fw-card">
      <h2>{{ 'Accounting application' | t }}</h2>
      <div class="ac-form">
        <label>{{ 'Post to' | t }}<select [(ngModel)]="s.connector" [disabled]="!rights.can_manage"><option *ngFor="let c of s.choices.connector" [value]="c[0]">{{ c[1] | t }}</option></select></label>
        <label>{{ 'Post as' | t }}<select [(ngModel)]="s.post_as" [disabled]="!rights.can_manage"><option *ngFor="let c of s.choices.post_as" [value]="c[0]">{{ c[1] | t }}</option></select></label>
        <label>{{ 'Journal code' | t }}<input [(ngModel)]="s.journal_code" [disabled]="!rights.can_manage"></label>
        <label>{{ 'Currency' | t }}<input [(ngModel)]="s.currency" maxlength="3" [disabled]="!rights.can_manage"></label>
        <label class="chk"><input type="checkbox" [(ngModel)]="s.auto_build" [disabled]="!rights.can_manage"> {{ 'Build the journal when a payroll run / settlement is approved' | t }}</label>
        <label class="chk"><input type="checkbox" [(ngModel)]="s.auto_post" [disabled]="!rights.can_manage"> {{ 'Post it at once when it has no problems' | t }}</label>
        <label class="chk"><input type="checkbox" [(ngModel)]="s.partner_lines" [disabled]="!rights.can_manage"> {{ 'Business partner on receivable / payable lines (tenants, owners, vendors, brokers)' | t }}</label>   <!-- v1.44.0 -->
      </div>
      <!-- v1.62.0: JV or real invoices / bills / payments -->
      <ng-container *ngIf="s.connector === 'odoo' || s.connector === 'zoho'">
        <h2 style="margin-top:14px">{{ 'Send documents as' | t }}</h2>
        <div class="ac-form">
          <label *ngFor="let c of s.choices.post_style" class="chk"><input type="radio" name="pstyle" [value]="c[0]" [(ngModel)]="s.post_style" [disabled]="!rights.can_manage"> {{ c[1] | t }}</label>
          <ng-container *ngIf="s.post_style === 'documents'">
            <ng-container *ngIf="s.connector === 'odoo'">
              <label>{{ 'Sales journal code' | t }}<input [(ngModel)]="s.sales_journal_code" placeholder="INV" [disabled]="!rights.can_manage"></label>
              <label>{{ 'Purchase journal code' | t }}<input [(ngModel)]="s.purchase_journal_code" placeholder="BILL" [disabled]="!rights.can_manage"></label>
              <label>{{ 'Bank journal code' | t }}<input [(ngModel)]="s.bank_journal_code" placeholder="BNK1" [disabled]="!rights.can_manage"></label>
            </ng-container>
            <label>{{ 'Sales tax id (optional)' | t }}<input [(ngModel)]="s.sale_tax_ref" [placeholder]="'found by rate' | t" [disabled]="!rights.can_manage"></label>
            <label>{{ 'Purchase tax id (optional)' | t }}<input [(ngModel)]="s.purchase_tax_ref" [placeholder]="'found by rate' | t" [disabled]="!rights.can_manage"></label>
          </ng-container>
        </div>
        <p *ngIf="s.post_style === 'documents'" style="font-size:12px;color:#64748b;margin:6px 0 0">
          {{ 'Property invoices go as customer invoices, credit notes as credit notes, receipts as payments matched to their invoices, and vendor bills as bills. Payroll, owner payouts, commissions and refunds stay journal vouchers. The tax is found by its rate unless you enter its id.' | t }}
        </p>
      </ng-container>
      <ng-container *ngIf="s.connector === 'odoo'">
        <h2 style="margin-top:14px">Odoo</h2>
        <div class="ac-form">
          <label>{{ 'Odoo address' | t }}<input [(ngModel)]="s.odoo_url" placeholder="https://mycompany.odoo.com"></label>
          <label>{{ 'Database' | t }}<input [(ngModel)]="s.odoo_db"></label>
          <label>{{ 'User (login)' | t }}<input [(ngModel)]="s.odoo_login"></label>
          <label>{{ 'API' | t }}<select [(ngModel)]="s.odoo_api"><option *ngFor="let c of s.choices.odoo_api" [value]="c[0]">{{ c[1] }}</option></select></label>
          <label>{{ 'API key' | t }} <span class="ac-secret" *ngIf="s.secrets.odoo_api_key">✓ {{ 'saved' | t }}</span><input type="password" [(ngModel)]="sec.odoo_api_key" autocomplete="new-password" [placeholder]="s.secrets.odoo_api_key ? '••••••• (unchanged)' : ''"></label>
          <label>{{ 'Company id (multi-company)' | t }}<input type="number" [(ngModel)]="s.odoo_company_id"></label>
        </div>
        <p class="fw-muted">{{ 'Odoo → Preferences → Account Security → New API key. Departments, employees and branches become analytic accounts in the plans "Department", "Employee", "Branch" (made when missing).' | t }}</p>
      </ng-container>
      <ng-container *ngIf="s.connector === 'zoho'">
        <h2 style="margin-top:14px">Zoho Books</h2>
        <div class="ac-form">
          <label>{{ 'Organisation id' | t }}<input [(ngModel)]="s.zoho_org_id"></label>
          <label>{{ 'API domain' | t }}<input [(ngModel)]="s.zoho_api_domain" placeholder="https://www.zohoapis.com"></label>
          <label>{{ 'Accounts domain' | t }}<input [(ngModel)]="s.zoho_accounts_domain" placeholder="https://accounts.zoho.com"></label>
          <label>{{ 'Client id' | t }}<input [(ngModel)]="s.zoho_client_id"></label>
          <label>{{ 'Client secret' | t }} <span class="ac-secret" *ngIf="s.secrets.zoho_client_secret">✓ {{ 'saved' | t }}</span><input type="password" [(ngModel)]="sec.zoho_client_secret" autocomplete="new-password"></label>
          <label>{{ 'Refresh token' | t }} <span class="ac-secret" *ngIf="s.secrets.zoho_refresh_token">✓ {{ 'saved' | t }}</span><input type="password" [(ngModel)]="sec.zoho_refresh_token" autocomplete="new-password"></label>
        </div>
        <p class="fw-muted">{{ 'Zoho API console (api-console.zoho.com) → Self client → scope ZohoBooks.fullaccess.all → generate a code and exchange it for a refresh token. Use the domains of your data centre (.com, .eu, .in, .com.au, .sa, .ae …). Departments, employees and branches become reporting tags.' | t }}</p>
      </ng-container>
      <p class="fw-muted" *ngIf="s.connector === 'export'">{{ 'Journals are downloaded as Excel / CSV with account, department, employee and analytic columns – for Tally, Sage, QuickBooks, Xero or any other software.' | t }}</p>
      <p class="fw-muted" *ngIf="s.connector === 'api'">{{ 'Another application reads the journals through the ZEO API (API tab) and confirms each one it posted.' | t }}</p>
      <div class="ac-row" *ngIf="rights.can_manage" style="margin-top:10px">
        <button type="button" class="fw-btn primary" (click)="save()" [disabled]="busy">{{ 'Save' | t }}</button>
        <button type="button" class="fw-btn" *ngIf="isApp()" (click)="test()" [disabled]="busy">{{ 'Test the connection' | t }}</button>
      </div>
    </div>
  </ng-container>

  <!-- ============ accounts ============ -->
  <ng-container *ngIf="tab === 'accounts' && acc">
    <div class="fw-card">
      <div class="ac-row" style="margin-bottom:8px">
        <h2 style="margin:0">{{ (hasProp() ? 'Accounts of each payroll and property item' : 'Accounts of each salary component and payroll item') | t }}</h2><span class="sp" style="flex:1"></span>
        <button type="button" class="fw-btn sm" *ngIf="isApp()" (click)="loadOptions()">{{ 'Read the chart of accounts' | t }}</button>
        <button type="button" class="fw-btn sm primary" *ngIf="rights.can_manage" (click)="saveAccounts()" [disabled]="busy">{{ 'Save' | t }}</button>
      </div>
      <p class="fw-muted">{{ 'Empty = the default account of Posting rules. Add a row "for a department" or "for an employee" when one of them uses another account (that account is then used without the GL pattern).' | t }}</p>
      <datalist id="ac-accts"><option *ngFor="let a of opts?.accounts" [value]="a.code">{{ a.name }}</option></datalist>
      <div class="ac-wide">
      <table class="fw-table ac-tbl">
        <tr><th>{{ 'Item' | t }}</th><th>{{ 'For' | t }}</th><th>{{ 'Debit account (expense)' | t }}</th><th>{{ 'Credit account (liability)' | t }}</th><th></th></tr>
        <ng-container *ngFor="let g of groups()">
          <tr><td colspan="5" style="background:#fafafd;font-weight:600;color:#1b1640">{{ g | t }}</td></tr>
          <ng-container *ngFor="let it of itemsOf(g)">
            <tr *ngFor="let r of rowsOf(it); let first = first">
              <td><span *ngIf="first">{{ it.label }} <span class="fw-muted" *ngIf="it.code">{{ it.code }}</span></span></td>
              <td>
                <span *ngIf="first" class="fw-muted">{{ 'everyone' | t }}</span>
                <span *ngIf="!first && r.employee_id" class="fw-muted">{{ 'employee' | t }} #{{ r.employee_id }}</span>
                <select *ngIf="!first && !r.employee_id" [(ngModel)]="r.department_id" [disabled]="!rights.can_manage">
                  <option [ngValue]="null">–</option><option *ngFor="let d of depts" [ngValue]="d.local_id">{{ d.name }}</option></select>
              </td>
              <td><input *ngIf="it.side !== 'credit'" [(ngModel)]="r.debit_account" list="ac-accts" [placeholder]="it.default_debit || ''" [disabled]="!rights.can_manage"></td>
              <td><input *ngIf="it.side !== 'debit'" [(ngModel)]="r.credit_account" list="ac-accts" [placeholder]="it.default_credit || ''" [disabled]="!rights.can_manage"></td>
              <td><a class="fw-link fw-small" *ngIf="first && rights.can_manage" (click)="addRow(it)">+ {{ 'for a department' | t }}</a></td>
            </tr>
          </ng-container>
        </ng-container>
      </table>
      </div>
    </div>
  </ng-container>

  <!-- ============ departments / employees / branches ============ -->
  <ng-container *ngIf="tab === 'dims' && dim">
    <div class="fw-card">
      <div class="ac-row" style="margin-bottom:8px">
        <select [(ngModel)]="dimKind" (change)="loadDims()" style="height:34px;border:1px solid #dcdfea;border-radius:8px">
          <option value="department">{{ 'Departments' | t }}</option><option value="employee">{{ 'Employees' | t }}</option><option value="branch">{{ 'Branches' | t }}</option></select>
        <input *ngIf="dimKind === 'employee'" [(ngModel)]="dimQ" (keyup.enter)="loadDims()" [placeholder]="'Search' | t" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px">
        <span class="sp" style="flex:1"></span>
        <ng-container *ngIf="rights.can_manage && isApp()">
          <button type="button" class="fw-btn sm" (click)="autoMap(false)" [disabled]="busy">{{ 'Match with the accounting app' | t }}</button>
          <button type="button" class="fw-btn sm" (click)="autoMap(true)" [disabled]="busy">{{ 'Match and create the missing' | t }}</button>
          <button type="button" class="fw-btn sm" *ngIf="dimKind === 'employee' && s?.employee_mode === 'partner'" (click)="partners()" [disabled]="busy">{{ 'Match / create partners' | t }}</button>
          <button type="button" class="fw-btn sm" (click)="businessPartners()" [disabled]="busy" [title]="'Tenants, owners, customers and suppliers of the business partners list' | t">{{ 'Match / create business partners' | t }}</button>   <!-- v1.44.0 -->
        </ng-container>
        <button type="button" class="fw-btn sm primary" *ngIf="rights.can_manage" (click)="saveDims()" [disabled]="busy">{{ 'Save' | t }}</button>
      </div>
      <p class="fw-muted">{{ 'GL code: used by the GL pattern (e.g. 6100-{dept}); empty = the ZEO code. Analytic: the analytic account (Odoo) or reporting-tag option (Zoho) – filled by "Match".' | t }}</p>
      <div class="ac-wide">
      <table class="fw-table ac-tbl">
        <tr><th>{{ 'Name' | t }}</th><th>{{ 'ZEO code' | t }}</th><th *ngIf="usesGl()">{{ 'GL code' | t }}</th><th *ngIf="usesAna()">{{ 'Analytic account / tag option' | t }}</th><th *ngIf="dimKind === 'employee'">{{ 'Partner / contact' | t }}</th></tr>
        <tr *ngFor="let r of dim.rows">
          <td>{{ r.name }}<div class="fw-muted" *ngIf="r.extra">{{ r.extra }}</div></td><td>{{ r.code }}</td>
          <td *ngIf="usesGl()"><input [(ngModel)]="r.gl_code" [placeholder]="r.code" [disabled]="!rights.can_manage"></td>
          <td *ngIf="usesAna()"><select *ngIf="anaOpts().length" [(ngModel)]="r.analytic_ref" [disabled]="!rights.can_manage"><option value="">–</option>
              <option *ngFor="let a of anaOpts()" [value]="'' + a.id">{{ a.name }}</option></select>
              <input *ngIf="!anaOpts().length" [(ngModel)]="r.analytic_ref" [disabled]="!rights.can_manage" [placeholder]="'id' | t"></td>
          <td *ngIf="dimKind === 'employee'"><input [(ngModel)]="r.partner_ref" [disabled]="!rights.can_manage"></td>
        </tr>
      </table>
      </div>
    </div>
  </ng-container>

  <!-- ============ API ============ -->
  <ng-container *ngIf="tab === 'api' && cl">
    <div class="fw-card">
      <h2>{{ 'Applications that read the journals (ZEO API v1)' | t }}</h2>
      <div class="ac-eg">POST {{ base }}/accounting/v1/token/?schema={{ cl.schema }}   {{ '{' }}"client_id": …, "client_secret": …{{ '}' }}
GET  {{ base }}/accounting/v1/journals/?schema={{ cl.schema }}&status=ready&lines=1     Authorization: Bearer &lt;token&gt;
POST {{ base }}/accounting/v1/journals/&lt;id&gt;/ack/?schema={{ cl.schema }}   {{ '{' }}"external_id": …, "external_ref": …{{ '}' }}</div>
      <div class="fw-msg" *ngIf="newSecret">{{ 'Client id' | t }}: <b>{{ newSecret.client_id }}</b> · {{ 'Secret (copy it now, it is not shown again)' | t }}: <b>{{ newSecret.client_secret }}</b></div>
      <table class="fw-table" style="margin-top:10px">
        <tr><th>{{ 'Application' | t }}</th><th>{{ 'Client id' | t }}</th><th>{{ 'Last used' | t }}</th><th></th></tr>
        <tr *ngFor="let c of cl.clients"><td>{{ c.name }}</td><td>{{ c.client_id }}</td><td>{{ c.last_used | date:'dd/MM/yyyy HH:mm' }}</td>
          <td><button type="button" class="fw-btn sm danger" (click)="delClient(c.id)">{{ 'Remove' | t }}</button></td></tr>
      </table>
      <div class="ac-row" style="margin-top:10px"><input [(ngModel)]="clientName" [placeholder]="'Application name' | t" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px">
        <button type="button" class="fw-btn primary" (click)="addClient()">+ {{ 'Application' | t }}</button></div>
    </div>
    <div class="fw-card">
      <h2>{{ 'Webhooks' | t }}</h2>
      <p class="fw-muted">{{ 'ZEO calls the address when a journal is ready / posted; the body is signed (X-ZEO-Signature, HMAC-SHA256 with the secret).' | t }}</p>
      <table class="fw-table">
        <tr><th>{{ 'Name' | t }}</th><th>URL</th><th>{{ 'Events' | t }}</th><th>{{ 'Last call' | t }}</th><th></th></tr>
        <tr *ngFor="let h of cl.hooks"><td>{{ h.name }}</td><td class="fw-small">{{ h.url }}</td><td class="fw-small">{{ h.events.join(', ') }}</td><td class="fw-small">{{ h.last_status }}</td>
          <td><button type="button" class="fw-btn sm danger" (click)="delHook(h.id)">{{ 'Remove' | t }}</button></td></tr>
      </table>
      <div class="ac-row" style="margin-top:10px"><input [(ngModel)]="hookUrl" placeholder="https://…" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 10px;min-width:280px">
        <button type="button" class="fw-btn" (click)="addHook()">+ {{ 'Webhook' | t }}</button></div>
    </div>
  </ng-container>
</div>
`,
})
export class AccountingComponent implements OnInit {
  tabs: [string, string][] = [['journals', 'Journals'], ['build', 'Make a journal'], ['rules', 'Posting rules and connection'], ['accounts', 'Accounts'],
                              ['dims', 'Departments and employees'], ['api', 'API and webhooks']];
  tab = 'journals';
  s: any; sec: any = {}; j: any; cur: any; src: any; acc: any; opts: any; dim: any; cl: any; miss: any[] = [];
  rights: any = {};
  depts: any[] = [];
  flt = ''; dimKind = 'department'; dimQ = ''; clientName = ''; hookUrl = ''; newSecret: any;
  provDate = ''; expFrom = ''; expTo = '';
  // v1.40.0 Property sources
  srcFlt = ''; propKind = 'bills';
  propKinds: [string, string, string][] = [['bills', 'Invoices / credit notes', 'prop_bill'], ['receipts', 'Receipts and refunds', 'prop_receipt'],
    ['payouts', 'Owner payouts', 'prop_payout'], ['commissions', 'Commissions', 'prop_commission'], ['vendor_bills', 'Vendor bills', 'prop_vendor']];
  sourceOpts: [string, string][] = [['payroll', 'Payroll run'], ['provision', 'Month-end provisions'], ['settlement', 'Final settlement'], ['expense', 'Expense claims'],
    ['reversal', 'Reversal'], ['prop_bill', 'Property invoices / credit notes'], ['prop_receipt', 'Property receipts'], ['prop_payout', 'Owner payouts'],
    ['prop_commission', 'Property commissions'], ['prop_vendor', 'Property vendor bills']];
  msg = ''; bad = false; busy = false;
  base = environment.apiBaseUrl;
  accFields: [string, string][] = [['payable_account', 'Salaries payable'], ['default_expense_account', 'Salary expense (no account set)'],
    ['default_deduction_account', 'Deductions (no account set)'], ['rounding_account', 'Rounding differences'], ['gratuity_expense_account', 'Gratuity expense'],
    ['gratuity_provision_account', 'Gratuity provision'], ['leave_expense_account', 'Leave salary expense'], ['leave_provision_account', 'Leave salary provision'],
    ['settlement_payable_account', 'Final settlement payable']];

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth(), 0);
    this.provDate = this.iso(last); this.expFrom = this.iso(new Date(last.getFullYear(), last.getMonth(), 1)); this.expTo = this.iso(last);
    this.route.queryParamMap.subscribe(q => { const t = q.get('tab'); if (t && t !== this.tab) { this.tab = t; } this.loadTab(); });
    this.loadSettings();
    const id = this.route.snapshot.queryParamMap.get('id'); if (id) { this.open(+id); }
  }
  iso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  p(extra: any = {}) { return { params: { schema: schema(), ...extra } }; }
  ok(m: string) { this.msg = m; this.bad = false; this.cd.markForCheck(); }
  fail(e: any) { this.msg = err(e); this.bad = true; this.busy = false; this.cd.markForCheck(); }

  go(t: string) { this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t }, queryParamsHandling: 'merge' }); this.tab = t; this.loadTab(); }
  loadTab() {
    if (this.tab === 'journals') { this.loadJ(); }
    if (this.tab === 'build') { this.loadSrc(); }
    if (this.tab === 'accounts') { this.loadAccounts(); }
    if (this.tab === 'dims') { this.loadDims(); }
    if (this.tab === 'api') { this.loadClients(); }
  }
  async loadSettings() {
    try { this.s = await firstValueFrom(this.http.get<any>(API + 'settings/', this.p())); this.rights = { can_post: this.s.can_post, can_manage: this.s.can_manage }; }
    catch (e) { this.fail(e); }
    this.cd.markForCheck();
  }
  connName(c?: string) { const k = c || this.s?.connector; return ({ odoo: 'Odoo', zoho: 'Zoho Books', export: 'Excel / CSV', api: 'ZEO API' } as any)[k] || k; }
  isApp() { return ['odoo', 'zoho'].includes(this.s?.connector); }
  chip(st: string) { return ({ posted: 'ok', exported: 'ok', ready: 'changes', draft: 'draft', failed: 'failed', reversed: 'cancelled', cancelled: 'cancelled', posting: 'waiting' } as any)[st] || ''; }
  rulesText(r: any) {
    if (!r) { return ''; }
    const n: any = { none: 'off', analytic: 'analytic', gl: 'GL code', both: 'GL + analytic', partner: 'partner' };
    const out = [];
    if (r.department && r.department !== 'none') { out.push('Dept: ' + n[r.department]); }
    if (r.employee && r.employee !== 'none') { out.push('Employee: ' + n[r.employee]); }
    if (r.branch && r.branch !== 'none') { out.push('Branch: ' + n[r.branch]); }
    return out.join(' · ') || 'No dimensions';
  }
  dims(a: any) { return Object.entries(a || {}).map(([k, v]) => `${k} ${v}`); }
  example() {
    const s = this.s; if (!s) { return ''; }
    const lines = ['Example – Basic salary of Sara (E001, IT) on 6100:'];
    let acct = '6100'; const ana: string[] = [];
    if (['gl', 'both'].includes(s.branch_mode)) { acct = s.branch_gl_pattern.replace('{account}', acct).replace('{branch}', 'HO').replace('{dept}', 'IT'); }
    if (['analytic', 'both'].includes(s.branch_mode)) { ana.push('Branch: Head office'); }
    if (['gl', 'both'].includes(s.department_mode)) { acct = s.dept_gl_pattern.replace('{account}', acct).replace('{dept}', 'IT').replace('{branch}', 'HO'); }
    if (['analytic', 'both'].includes(s.department_mode)) { ana.push('Department: IT'); }
    if (['gl', 'both'].includes(s.employee_mode)) { acct = s.emp_gl_pattern.replace('{account}', acct).replace('{emp}', 'E001').replace('{dept}', 'IT'); }
    if (['analytic', 'both'].includes(s.employee_mode)) { ana.push('Employee: Sara Khan'); }
    lines.push(`Dr ${acct}   ${ana.length ? 'analytic ' + ana.join(', ') : ''}${s.employee_mode === 'partner' ? ' partner Sara Khan' : ''}`);
    lines.push(`Cr ${s.payable_account} Salaries payable${s.dims_on === 'all' ? '   (with the same department / employee)' : '   (one line for everyone)'}`);
    return lines.join('\n');
  }
  async save() {
    this.busy = true;
    try {
      const body: any = { ...this.s, ...this.sec }; delete body.choices; delete body.secrets;
      this.s = { ...this.s, ...(await firstValueFrom(this.http.put<any>(API + 'settings/', body, this.p()))) };
      this.sec = {}; this.ok('Saved.');
    } catch (e) { this.fail(e); }
    this.busy = false;
  }
  async test() {
    await this.save(); this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'settings/test/', {}, this.p())); this.msg = r.detail; this.bad = !r.ok; }
    catch (e) { this.fail(e); }
    this.busy = false; this.cd.markForCheck();
  }

  // journals
  async loadJ() {
    try { this.j = await firstValueFrom(this.http.get<any>(API + 'journals/', this.p({ ...(this.flt ? { status: this.flt } : {}), ...(this.srcFlt ? { source: this.srcFlt } : {}) }))); this.rights = { can_post: this.j.can_post, can_manage: this.j.can_manage }; }
    catch (e) { this.fail(e); }
    this.cd.markForCheck();
  }
  async open(id: number) {
    this.miss = [];
    try { this.cur = await firstValueFrom(this.http.get<any>(API + `journals/${id}/`, this.p())); } catch (e) { this.fail(e); }
    this.cd.markForCheck();
  }
  async act(a: string) {
    if (a === 'reverse' && !confirm('Make a reversing journal (debits and credits swapped)?')) { return; }
    this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(API + `journals/${this.cur.id}/${a}/`, {}, this.p())); this.ok(`${r.number}: ${r.status_name}`); await this.open(r.id); }
    catch (e) { this.fail(e); await this.open(this.cur.id); }
    this.busy = false; this.loadJ();
  }
  async markExported() {
    const ref = prompt('Number in the accounting software (optional)') ?? null; if (ref === null) { return; }
    try { await firstValueFrom(this.http.post<any>(API + `journals/${this.cur.id}/exported/`, { external_ref: ref }, this.p())); await this.open(this.cur.id); this.loadJ(); }
    catch (e) { this.fail(e); }
  }
  async missing() {
    try { this.miss = (await firstValueFrom(this.http.get<any>(API + `journals/${this.cur.id}/missing/`, this.p()))).missing; if (!this.miss.length) { this.ok('Every account exists in the accounting app.'); } }
    catch (e) { this.fail(e); }
    this.cd.markForCheck();
  }
  missCodes() { return this.miss.map(m => m.account).join(', '); }
  async createAccounts() {
    try { const r = await firstValueFrom(this.http.post<any>(API + 'accounts/create/', { codes: this.miss.map(m => m.account) }, this.p())); this.ok(`${r.created.length} accounts created.`); this.miss = []; }
    catch (e) { this.fail(e); }
  }
  download(id: any, type: string) {
    this.http.get(API + 'journals/export/', { params: { schema: schema(), ids: String(id || ''), type }, responseType: 'blob' }).subscribe({
      next: b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `zeo-journal${id ? '-' + id : 's'}.${type}`; a.click(); URL.revokeObjectURL(a.href); },
      error: e => this.fail(e) });
  }

  // build
  async loadSrc() { try { this.src = await firstValueFrom(this.http.get<any>(API + 'sources/', this.p())); } catch (e) { this.fail(e); } this.cd.markForCheck(); }
  async build(body: any) {
    this.busy = true;
    try {
      const r = await firstValueFrom(this.http.post<any>(API + 'journals/build/', body, this.p()));
      this.ok(r.built ? `${r.built.length} journals made${r.errors?.length ? ', ' + r.errors.length + ' skipped: ' + r.errors.join('; ') : ''}`
                      : `${r.number} – ${r.status_name}${r.problems?.length ? ' (' + r.problems.length + ' to fix)' : ''}`);
      this.go('journals'); if (!r.built || r.built.length === 1) { this.open(r.id); }
    } catch (e) { this.fail(e); }
    this.busy = false;
  }

  // v1.40.0 Property
  propSource() { return this.propKinds.find(k => k[0] === this.propKind)?.[2] || 'prop_bill'; }
  propOpen() { return (this.src?.property?.[this.propKind] || []).filter((r: any) => !r.journal || ['reversed'].includes(r.journal.status)).map((r: any) => r.id); }
  hasProp() { return (this.acc?.items || []).some((i: any) => i.kind === 'property'); }
  async checkPaid() {
    this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'property/paid/', {}, this.p())); this.ok(`${r.checked} invoices checked, ${r.paid} paid in Odoo.`); await this.loadSrc(); }
    catch (e) { this.fail(e); }
    this.busy = false;
  }

  // accounts
  async loadAccounts() {
    try {
      this.acc = await firstValueFrom(this.http.get<any>(API + 'accounts/', this.p())); this.prep();
      if (!this.depts.length) { this.depts = (await firstValueFrom(this.http.get<any>(API + 'dimensions/', this.p({ kind: 'department' })))).rows; }
    } catch (e) { this.fail(e); }
    this.cd.markForCheck();
  }
  async loadOptions() { try { this.opts = await firstValueFrom(this.http.get<any>(API + 'options/', this.p())); this.ok(`${this.opts.accounts.length} accounts read.`); } catch (e) { this.fail(e); } }
  groups() { return [...new Set((this.acc?.items || []).map((i: any) => i.group))] as string[]; }
  itemsOf(g: string) { return this.acc.items.filter((i: any) => i.group === g); }
  prep() {
    for (const it of this.acc?.items || []) {
      if (!this.acc.rows.some((r: any) => r.kind === it.kind && r.key === it.key && !r.department_id && !r.employee_id && !r.branch_id)) {
        this.acc.rows.push({ kind: it.kind, key: it.key, label: it.label, debit_account: '', credit_account: '', department_id: null, employee_id: null, branch_id: null });
      }
    }
  }
  rowsOf(it: any) {
    const rows = this.acc.rows.filter((r: any) => r.kind === it.kind && r.key === it.key);
    return [...rows.filter((r: any) => !r.department_id && !r.employee_id && !r.branch_id && !r._x), ...rows.filter((r: any) => r.department_id || r.employee_id || r.branch_id || r._x)];
  }
  addRow(it: any) { this.acc.rows.push({ kind: it.kind, key: it.key, label: it.label, debit_account: '', credit_account: '', department_id: this.depts[0]?.local_id, employee_id: null, branch_id: null, _x: true }); }
  async saveAccounts() {
    this.busy = true;
    try { this.acc = await firstValueFrom(this.http.put<any>(API + 'accounts/', { rows: this.acc.rows }, this.p())); this.prep(); this.ok('Accounts saved.'); }
    catch (e) { this.fail(e); }
    this.busy = false;
  }

  // dimensions
  async loadDims() {
    try { this.dim = await firstValueFrom(this.http.get<any>(API + 'dimensions/', this.p({ kind: this.dimKind, q: this.dimQ }))); } catch (e) { this.fail(e); }
    if (this.isApp() && !this.opts) { try { this.opts = await firstValueFrom(this.http.get<any>(API + 'options/', this.p())); } catch (e) { /* not reachable – ids can be typed */ } }
    this.cd.markForCheck();
  }
  mode() { return this.s?.[this.dimKind === 'department' ? 'department_mode' : this.dimKind === 'branch' ? 'branch_mode' : 'employee_mode'] || 'none'; }
  usesGl() { return ['gl', 'both', 'none'].includes(this.mode()); }
  usesAna() { return ['analytic', 'both', 'none'].includes(this.mode()); }
  anaOpts() { return this.opts?.analytics?.[this.dimKind] || []; }
  async saveDims() {
    this.busy = true;
    try { await firstValueFrom(this.http.put<any>(API + 'dimensions/', { kind: this.dimKind, rows: this.dim.rows }, this.p())); this.ok('Saved.'); }
    catch (e) { this.fail(e); }
    this.busy = false;
  }
  async autoMap(create: boolean) {
    this.busy = true;
    try {
      const r = await firstValueFrom(this.http.post<any>(API + 'dimensions/auto/', { kind: this.dimKind, create }, this.p()));
      this.ok(`${r.matched} matched, ${r.created} created (of ${r.total}).`); this.opts = null; await this.loadDims();
    } catch (e) { this.fail(e); }
    this.busy = false;
  }
  /** v1.44.0: business partners (tenants, owners, customers, suppliers) → partners / contacts of the accounting app. */
  async businessPartners() {
    this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'partners/auto/', { business: true, create: true }, this.p())); this.ok(`${r.matched} business partners linked, ${r.created} created${r.left ? ', ' + r.left + ' left' : ''}.`); }
    catch (e) { this.fail(e); }
    this.busy = false;
  }
  async partners() {
    this.busy = true;
    try { const r = await firstValueFrom(this.http.post<any>(API + 'partners/auto/', { create: true }, this.p())); this.ok(`${r.matched} partners linked, ${r.created} created.`); await this.loadDims(); }
    catch (e) { this.fail(e); }
    this.busy = false;
  }

  // API
  async loadClients() { try { this.cl = await firstValueFrom(this.http.get<any>(API + 'clients/', this.p())); } catch (e) { this.fail(e); } this.cd.markForCheck(); }
  async addClient() {
    try { this.newSecret = await firstValueFrom(this.http.post<any>(API + 'clients/', { name: this.clientName }, this.p())); this.clientName = ''; this.loadClients(); }
    catch (e) { this.fail(e); }
  }
  async delClient(id: number) { if (!confirm('Remove this application? Its tokens stop working.')) { return; } await firstValueFrom(this.http.delete(API + `clients/${id}/`, this.p())); this.loadClients(); }
  async addHook() {
    try { const r = await firstValueFrom(this.http.post<any>(API + 'hooks/', { url: this.hookUrl }, this.p())); this.ok(`Webhook added – signing secret ${r.secret}`); this.hookUrl = ''; this.loadClients(); }
    catch (e) { this.fail(e); }
  }
  async delHook(id: number) { await firstValueFrom(this.http.delete(API + `hooks/${id}/`, this.p())); this.loadClients(); }
}
