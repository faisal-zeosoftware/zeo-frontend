// v1.62.11 (item 227, scope addition 03/11/2026): new screen – Payroll run › Payments
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TPipe, I18nService } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { zConfirm } from '../shared-ui/z-confirm';
import { errText } from './pay162';
import { BF_CSS } from './bank-files.component';

/**
 * v1.62.11 (item 227) – Payroll run › Payments: the run's net pay (net − held) by payment method – WPS, bank transfer, cheque, cash and
 * the company's own methods – with totals per method and per paying account, the file of each method (WPS: CBUAE SIF or the bank's
 * layout; bulk transfer CSV; cheque list and cash sheet PDF / Excel; Excel list of the own methods) and the paid marks.
 * API: payroll-plus/api/run-payments/<run>/ (file/, mark/), payment-methods/
 */
const API = `${environment.apiBaseUrl}/payroll-plus/api/`;
const schema = () => localStorage.getItem('selectedSchema') || '';

@Component({
  selector: 'app-run-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, TPipe, ZListDirective],
  styleUrls: ['../hr-modules/hr-shared.css', '../time62/t62.css'],
  styles: [BF_CSS + `.rp-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}.rp-tab{border:1px solid #dfe1ea;background:#fff;border-radius:16px;padding:4px 12px;font-size:13px;cursor:pointer}
.rp-tab.on{background:#5b4ff5;border-color:#5b4ff5;color:#fff}.bf-num{text-align:end;white-space:nowrap}`],
  template: `
<div class="container hr-page bf-wrap" data-run-payments>
  <div class="comapny_section">
    <div class="header_section"><div class="hr-head">
      <div class="hr-head-t"><h1>{{ 'Payments' | t }}<span *ngIf="d"> – {{ d.run.name }}</span></h1>
        <p class="hr-head-d">{{ 'The net pay of the payroll run by payment method (held salaries left out), the file or list of each method and what is paid.' | t }}</p></div>
      <div class="hr-head-a hr-head-b">
        <select [(ngModel)]="runId" (change)="go()" data-rp-run style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px;max-width:100%">
          <option *ngFor="let r of d?.runs || []" [ngValue]="r.id">{{ r.name }} · {{ r.month < 10 ? '0' + r.month : r.month }}/{{ r.year }} · {{ r.status | t }}</option>
        </select>
        <a class="hr-tbtn" routerLink="/main-sidebar/salary-options/payment-layouts" data-rp-layouts>{{ 'File layouts' | t }}</a>
      </div></div></div>
    <div class="bf-msg" *ngIf="msg" [class.err]="bad">{{ msg }}</div>
    <div class="bf-body" *ngIf="d">
      <div class="bf-card" data-rp-methods>
        <h2>{{ 'By payment method' | t }}</h2>
        <div class="bf-wide"><table class="bf-table" zPlain>
          <thead><tr><th>{{ 'Payment method' | t }}</th><th class="bf-num">{{ 'Employees' | t }}</th><th class="bf-num">{{ 'Amount (AED)' | t }}</th><th class="bf-num">{{ 'Held' | t }}</th>
            <th class="bf-num">{{ 'Paid' | t }}</th><th class="bf-num">{{ 'Not yet paid' | t }}</th><th>{{ 'Status' | t }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let g of d.methods" [attr.data-rp-method]="g.method" (click)="pick(g.method)" style="cursor:pointer">
              <td><b>{{ g.name }}</b> <small class="bf-muted" *ngIf="g.not_ready">· {{ g.not_ready }} {{ 'waiting for approval' | t }}</small></td>
              <td class="bf-num">{{ g.employees }}</td><td class="bf-num">{{ +g.amount | number:'1.2-2' }}</td><td class="bf-num">{{ +g.held | number:'1.2-2' }}</td>
              <td class="bf-num">{{ g.paid }}</td><td class="bf-num">{{ g.not_paid }}</td>
              <td><span class="bf-chip" [class.ok]="g.state === 'paid'" [class.tbc]="g.state === 'part'">{{ stateText(g.state) | t }}</span></td></tr>
            <tr style="font-weight:700"><td>{{ 'Total' | t }}</td><td class="bf-num">{{ d.employees }}</td><td class="bf-num">{{ +d.total | number:'1.2-2' }}</td><td></td><td class="bf-num">{{ d.paid }}</td><td class="bf-num">{{ d.employees - d.paid }}</td><td></td></tr>
          </tbody></table></div>
        <h3 style="font-size:14px;margin:14px 0 4px">{{ 'By paying account' | t }}</h3>
        <table class="bf-table" zPlain data-rp-accounts>
          <tbody><tr *ngFor="let a of d.accounts"><td>{{ methodName(a.method) }}</td><td><b>{{ a.name }}</b> <small class="bf-muted">{{ a.agent }}</small></td>
            <td class="bf-num">{{ a.employees }}</td><td class="bf-num">{{ +a.amount | number:'1.2-2' }}</td></tr>
            <tr *ngIf="!d.accounts.length"><td class="bf-muted">–</td></tr></tbody></table>
        <p class="bf-muted" style="margin:8px 0 0">{{ d.split_note }} <a routerLink="/main-sidebar/salary-options/bank-files">{{ 'Paying accounts: Bank file layouts' | t }}</a></p>
      </div>

      <div class="bf-card" data-rp-method-card>
        <div class="rp-tabs"><button type="button" class="rp-tab" *ngFor="let g of d.methods" [class.on]="g.method === method" (click)="pick(g.method)" [attr.data-rp-tab]="g.method">{{ g.name }}</button></div>
        <ng-container *ngIf="method">
          <div class="bf-bar">
            <ng-container *ngIf="method === 'wps' || method === 'bank_transfer'">
              <label>{{ 'Paying account' | t }}<select [(ngModel)]="account" data-rp-account>
                <option *ngFor="let a of accountsOf(method)" [ngValue]="a.profile">{{ a.name }} ({{ a.employees }})</option></select></label>
            </ng-container>
            <ng-container *ngIf="method === 'cheque'">
              <label>{{ 'First cheque no.' | t }}<input [(ngModel)]="chqStart" maxlength="12" data-rp-chq-start></label>
              <label>{{ 'Last cheque no.' | t }}<input [(ngModel)]="chqEnd" maxlength="12" data-rp-chq-end></label>
            </ng-container>
            <ng-container *ngIf="method === 'cash'">
              <label>{{ 'Branch' | t }}<select [(ngModel)]="branch" data-rp-branch><option [ngValue]="null">{{ 'All branches' | t }}</option>
                <option *ngFor="let b of d.branches" [ngValue]="b.id">{{ b.name }}</option></select></label>
              <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" [(ngModel)]="notes" data-rp-notes> {{ 'Note and coin count' | t }}</label>
            </ng-container>
            <button type="button" class="bf-btn" (click)="file(true)" [disabled]="busy" data-rp-preview>{{ 'Preview' | t }}</button>
            <button type="button" class="bf-btn primary" (click)="file(false)" [disabled]="busy || !d.can_file" data-rp-download>{{ (isList() ? 'PDF list' : 'Download file') | t }}</button>
            <button type="button" class="bf-btn" *ngIf="isList()" (click)="file(false, 'xlsx')" [disabled]="busy || !d.can_file" data-rp-xlsx>{{ 'Excel list' | t }}</button>
          </div>
          <div *ngIf="pv" data-rp-result>
            <div class="bf-sum"><span>{{ 'Layout' | t }}: <b>{{ pv.layout_name }}</b></span><span>{{ 'File name' | t }}: <b data-rp-filename>{{ pv.file_name }}</b></span>
              <span>{{ 'Employees' | t }}: <b>{{ pv.summary?.employees }}</b></span><span>{{ 'Total' | t }}: <b>{{ pv.summary?.total }} {{ pv.summary?.currency }}</b></span></div>
            <div class="bf-note" *ngIf="pv.note" data-rp-note>{{ pv.note }}</div>
            <ul class="bf-warn" *ngIf="pv.warnings?.length"><li *ngFor="let w of pv.warnings">{{ w }}</li></ul>
            <ul class="bf-checks" data-rp-checks><li *ngFor="let c of pv.checks" [class.y]="c.ok" [class.n]="!c.ok">{{ c.ok ? '✓' : '✗' }} {{ c.check }}</li></ul>
            <div class="bf-pre" data-rp-lines>{{ (pv.preview_lines || []).join('\\n') }}</div>
          </div>
          <div class="bf-bar" style="margin-top:14px" *ngIf="d.can_mark">
            <label>{{ 'Paid on' | t }}<input type="date" [(ngModel)]="paidOn" data-rp-paid-on></label>
            <label>{{ 'Reference' | t }}<input [(ngModel)]="ref" maxlength="60" data-rp-ref></label>
            <button type="button" class="bf-btn primary" (click)="mark(false)" [disabled]="busy || !sel.size" data-rp-mark>{{ 'Mark selected paid' | t }}</button>
            <button type="button" class="bf-btn" (click)="mark(false, true)" [disabled]="busy" data-rp-mark-all>{{ 'Mark all paid' | t }}</button>
            <button type="button" class="bf-btn" (click)="mark(true)" [disabled]="busy || !sel.size" data-rp-unmark>{{ 'Not paid' | t }}</button>
          </div>
          <div class="bf-wide"><table class="bf-table" zPlain data-rp-lines-table>
            <thead><tr><th><input type="checkbox" (change)="all($any($event.target).checked)"></th><th>{{ 'Employee' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Account' | t }}</th>
              <th class="bf-num">{{ 'Net pay' | t }}</th><th class="bf-num">{{ 'Held' | t }}</th><th class="bf-num">{{ 'Amount (AED)' | t }}</th><th *ngIf="method === 'cheque'">{{ 'Cheque no.' | t }}</th><th>{{ 'Paid' | t }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let l of linesOf()" [attr.data-rp-line]="l.payslip">
                <td><input type="checkbox" [checked]="sel.has(l.payslip)" (change)="toggle(l.payslip)" [disabled]="l.state !== 'ready'"></td>
                <td>{{ l.name }} <small class="bf-muted">{{ l.emp_code }}</small>
                  <!-- v1.63.0 (item 27): one part of a split salary -->
                  <span class="bf-chip" *ngIf="l.split" [attr.data-rp-split]="l.split">{{ (l.split === 'second' ? 'Second part of a split salary' : 'Main part of a split salary') | t }}</span></td><td>{{ l.branch }}</td><td><small>{{ l.iban || '–' }}</small></td>
                <td class="bf-num">{{ +l.net | number:'1.2-2' }}</td><td class="bf-num">{{ +l.held ? (+l.held | number:'1.2-2') : '' }}</td><td class="bf-num"><b>{{ +l.amount | number:'1.2-2' }}</b></td>
                <td *ngIf="method === 'cheque'">{{ l.cheque_no || '–' }}</td>
                <td><span class="bf-chip" [class.ok]="l.paid" [class.tbc]="l.state !== 'ready'">{{ l.paid ? (('Paid' | t) + ' ' + dmy(l.paid_on)) : (l.state === 'held' ? ('Held' | t) : l.state === 'not_ready' ? ('Waiting for approval' | t) : ('Not yet paid' | t)) }}</span>
                  <small class="bf-muted" *ngIf="l.paid_ref"> {{ l.paid_ref }}</small></td></tr>
            </tbody></table></div>
        </ng-container>
      </div>

      <div class="bf-card" data-rp-own-methods>
        <div class="bf-head"><div><h2>{{ 'Own payment methods' | t }}</h2>
          <p class="bf-muted" style="margin:0 0 8px">{{ 'Methods of the company besides WPS, bank transfer, cheque and cash (e.g. an exchange house card). The employees given here are paid by that method; their list is an Excel file.' | t }}</p></div>
          <button type="button" class="hr-tbtn primary" *ngIf="d.can_file" (click)="editMethod(null)" data-rp-new-method>{{ '+ New payment method' | t }}</button></div>
        <table class="table hr-table" data-rp-method-list>
          <thead><tr><th>{{ 'Name' | t }}</th><th>{{ 'Employees' | t }}</th><th class="hr-col-actions">{{ 'Actions' | t }}</th></tr></thead>
          <tbody><tr *ngFor="let m of ownMethods()" [attr.data-z-id]="m.code"><td><b>{{ m.name }}</b></td><td>{{ (m.employees || []).length }}</td>
            <td class="t62-actions"><button type="button" class="z-row-btn" (click)="editMethod(m)" data-z-row-edit><mat-icon>edit</mat-icon></button>
              <button type="button" class="z-row-btn danger" (click)="delMethod(m)" data-z-row-delete><mat-icon>delete</mat-icon></button></td></tr>
            <tr *ngIf="!ownMethods().length"><td colspan="3" class="hr-empty">{{ 'No own method yet.' | t }}</td></tr></tbody></table>
      </div>
    </div>
  </div>
</div>`,
})
export class RunPaymentsComponent implements OnInit {
  d: any = null; pv: any = null; runId: number | null = null; method = ''; account: any = null; branch: any = null; notes = false;
  chqStart = ''; chqEnd = ''; paidOn = ''; ref = ''; sel = new Set<number>(); busy = false; msg = ''; bad = false;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private i18n: I18nService, private route: ActivatedRoute, private router: Router) {}
  t(s: string, a?: any[]): string { return this.i18n.t(s, a || null); }
  ngOnInit(): void { this.paidOn = new Date().toISOString().slice(0, 10); this.init(); }
  async init(): Promise<void> {
    let id = Number(this.route.snapshot.queryParamMap.get('run') || 0);
    if (!id) {
      try { const b: any = await firstValueFrom(this.http.get<any>(API + 'bank-files/', { params: { schema: schema() } }));
        const r = (b.runs || []).find((x: any) => x.status === 'paid' || x.status === 'approved') || (b.runs || [])[0]; id = r ? r.id : 0; } catch { /* below */ }
    }
    if (!id) { this.msg = this.t('No payroll run yet.'); this.bad = true; this.cd.detectChanges(); return; }
    this.runId = id; await this.load();
  }
  go(): void { this.router.navigate([], { relativeTo: this.route, queryParams: { run: this.runId } }); this.pv = null; this.method = ''; this.load(); }
  async load(): Promise<void> {
    try {
      this.d = await firstValueFrom(this.http.get<any>(`${API}run-payments/${this.runId}/`, { params: { schema: schema() } }));
      if (!this.method || !this.d.methods.some((g: any) => g.method === this.method)) { this.pick((this.d.methods[0] || {}).method || ''); }
      this.bad = false;
    } catch (e) { this.msg = errText(e, 'The payments could not be loaded.'); this.bad = true; }
    this.cd.detectChanges();
  }
  pick(m: string): void { this.method = m; this.pv = null; this.sel.clear(); const a = this.accountsOf(m)[0]; this.account = a ? a.profile : null; }
  accountsOf(m: string): any[] { return (this.d?.accounts || []).filter((a: any) => a.method === m); }
  methodName(m: string): string { return ((this.d?.all_methods || []).find((x: any) => x.code === m) || {}).name || m; }
  ownMethods(): any[] { return (this.d?.all_methods || []).filter((m: any) => !m.builtin); }
  isList(): boolean { return this.method === 'cheque' || this.method === 'cash'; }
  stateText(s: string): string { return ({ paid: 'Paid', part: 'Partly paid', not_paid: 'Not yet paid' } as any)[s] || s; }
  dmy(v: any): string { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || ''); }
  linesOf(): any[] {
    return (this.d?.lines || []).filter((l: any) => l.method === this.method && ((this.method !== 'wps' && this.method !== 'bank_transfer') || (l.account ?? null) === (this.account ?? null))
      && (this.method !== 'cash' || !this.branch || l.branch_id === this.branch));
  }
  toggle(id: number): void { this.sel.has(id) ? this.sel.delete(id) : this.sel.add(id); }
  all(on: boolean): void { this.sel.clear(); if (on) { this.linesOf().filter(l => l.state === 'ready').forEach(l => this.sel.add(l.payslip)); } }
  private body(extra: any = {}): any {
    return { method: this.method, account: this.account, branch: this.method === 'cash' ? this.branch : null, cheque_start: this.chqStart, cheque_end: this.chqEnd,
             layout: this.method === 'cash' && this.notes ? 'cash_sheet_notes' : undefined, ...extra };
  }
  async file(preview: boolean, kind?: string): Promise<void> {
    this.busy = true; this.msg = '';
    try {
      const r: any = await firstValueFrom(this.http.post<any>(`${API}run-payments/${this.runId}/file/`, this.body({ preview, kind }), { params: { schema: schema() } }));
      this.pv = r; this.bad = false;
      if (!preview && r.content_b64) {
        const bin = atob(r.content_b64); const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) { buf[i] = bin.charCodeAt(i); }
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: r.mime })); a.download = r.file_name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        this.msg = this.t('{0} downloaded.', [r.file_name]);
        if (this.method === 'cheque') { await this.load(); }
      }
    } catch (e) { this.msg = errText(e, 'The file could not be made.'); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  async mark(unmark: boolean, allLines = false): Promise<void> {
    if (allLines && !(await zConfirm(this.t('Mark every employee of this method as paid on {0}?', [this.dmy(this.paidOn)])))) { return; }
    this.busy = true; this.msg = '';
    try {
      const b: any = { method: this.method, paid_on: this.paidOn, reference: this.ref, unmark, all: allLines, payslips: [...this.sel] };
      if (this.method === 'wps' || this.method === 'bank_transfer') { b.account = this.account; }
      if (this.method === 'cash' && this.branch) { b.branch = this.branch; }
      const r: any = await firstValueFrom(this.http.post<any>(`${API}run-payments/${this.runId}/mark/`, b, { params: { schema: schema() } }));
      this.msg = this.t(unmark ? '{0} marked not paid.' : '{0} marked paid.', [r.marked]); this.bad = false; this.sel.clear(); await this.load();
    } catch (e) { this.msg = errText(e); this.bad = true; }
    this.busy = false; this.cd.detectChanges();
  }
  methodForm(): ZFormConfig {
    return { thing: 'payment method', endpoint: '/payroll-plus/api/payment-methods/', idOf: (r: any) => r.code,
      sections: [{ title: 'Payment method', fields: [
        { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Exchange house card' },
        { key: 'employees', label: 'Employees paid by this method', type: 'multi', search: true, full: true,
          source: { endpoint: '/employee/api/emplist/', label: (e: any) => `${e.emp_name || [e.emp_first_name, e.emp_last_name].filter(Boolean).join(' ')} (${e.emp_code})` } }] }] };
  }
  async editMethod(m: any): Promise<void> { if (await openZForm(this.methodForm(), m ? { ...m } : undefined)) { await this.load(); } }
  async delMethod(m: any): Promise<void> {
    if (!(await zConfirm(this.t('Delete the payment method "{0}"? Its employees are paid by their bank account’s method again.', [m.name]), { danger: true, ok: this.t('Delete') }))) { return; }
    try { await firstValueFrom(this.http.delete(`${API}payment-methods/${m.code}/`, { params: { schema: schema() } })); await this.load(); }
    catch (e) { this.msg = errText(e); this.bad = true; this.cd.detectChanges(); }
  }
}
