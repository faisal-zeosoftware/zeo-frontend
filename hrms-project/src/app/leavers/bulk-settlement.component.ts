/**
 * v1.62.11 (item 230) – Bulk final settlement: the leavers with a last working day in a period, "Calculate all", each statement
 * reviewed with its lines, then Submit / Validate / Approve / Pay selected. Each leaver goes through the same calculation and the
 * same steps as on its own case page (segregation of duties kept: a step one person may not do is refused on that row only).
 * API (PayrollPlus): GET leavers/bulk/?from=&to=&branch=&stage=   POST leavers/bulk/calculate|submit|validate|approve|pay/ {ids, …}
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';
import { zConfirm } from '../shared-ui/z-confirm';
import { exportExcel } from '../shared-ui/z-export';
import { LV_STYLES } from './leavers.styles';

const STEP_OF: Record<string, string> = { draft: 'submit', submitted: 'validate', validated: 'approve', approved: 'pay' };

@Component({
  selector: 'app-bulk-settlement',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TPipe, ZDatePipe],
  styles: [LV_STYLES + `
.lv .kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin:16px 0}
@media (max-width:1100px){.lv .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:640px){.lv{padding:14px 16px 30px}.lv .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.lv .kpi{padding:12px 14px;border:1px solid var(--line);background:#fff;border-radius:14px;text-align:start}
.lv .kpi span{display:block;font-size:12px;color:var(--mut);font-weight:600}
.lv .kpi b{display:block;font-size:20px;color:var(--ink);margin-top:4px;font-weight:700}
.lv .bar{display:flex;gap:10px;align-items:flex-end;padding:14px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.lv .bar label.fl{min-width:150px}
.lv .acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line);background:#fafbfd}
.lv .acts .sel{font-weight:600;color:var(--ink);margin-inline-end:6px}
.lv table.lt tbody tr.ln td{background:#fbfbfe;cursor:default;padding:0 12px 12px}
.lv table.lt tbody tr.ln:hover td{background:#fbfbfe}
.lv .lines{width:100%;border-collapse:collapse;font-size:12.5px}
.lv .lines td{padding:5px 8px;border-bottom:1px dashed #eceef5}
.lv .lines td.k{width:110px}
.lv .lines tr.tot td{font-weight:700;border-bottom:0;border-top:1px solid var(--line)}
.lv .res{margin:12px 0 0;padding:10px 14px;border-radius:10px;background:#fff;border:1px solid var(--line)}
.lv .res ul{margin:6px 0 0;padding-inline-start:18px}
.lv .res li.bad{color:var(--bad)}
.lv td.chk,.lv th.chk{width:34px}
.lv .x{color:var(--mut);font-size:18px;vertical-align:middle}
`],
  template: `
<div class="lv" data-bulk-settlement>
  <div class="card lv-head">
    <div>
      <h1>{{ 'Bulk final settlement' | t }}</h1>
      <p>{{ 'Calculate, review and pay the final settlements of many leavers at once. Every leaver is calculated exactly as on its own page; each step is checked for each leaver (a different person for each step), so a refusal stays on that row.' | t }}</p>
    </div>
    <a class="lv-btn" routerLink="/main-sidebar/sub-sidebar/leavers"><span class="material-icons">arrow_back</span>{{ 'Leavers' | t }}</a>
  </div>

  <p class="msg" *ngIf="msg" [class.err]="msgErr" role="status" data-bs-msg>{{ msg }}</p>
  <div class="res" *ngIf="results.length" data-bs-results>
    <b>{{ '{0} done, {1} not done' | t:done:failed }}</b>
    <ul><li *ngFor="let r of results" [class.bad]="!r.ok">{{ r.employee_code }} {{ r.employee }} – {{ r.ok ? r.stage_label : r.error }}</li></ul>
  </div>

  <div class="kpis">
    <div class="kpi"><span>{{ 'Leavers in the period' | t }}</span><b class="num">{{ summary.count || 0 }}</b></div>
    <div class="kpi"><span>{{ 'To calculate' | t }}</span><b class="num">{{ n('to_calculate') }}</b></div>
    <div class="kpi"><span>{{ 'With HR' | t }}</span><b class="num">{{ n('draft') }}</b></div>
    <div class="kpi"><span>{{ 'With Finance' | t }}</span><b class="num">{{ n('submitted') }}</b></div>
    <div class="kpi"><span>{{ 'To approve' | t }}</span><b class="num">{{ n('validated') }}</b></div>
    <div class="kpi"><span>{{ 'To pay' | t }}</span><b class="num">{{ n('approved') }}</b></div>
    <div class="kpi"><span>{{ 'Net payable (AED)' | t }}</span><b class="num">{{ (summary.net || 0) | number:'1.2-2' }}</b></div>
  </div>

  <div class="card">
    <div class="bar">
      <label class="fl">{{ 'Last working day from' | t }}<input class="f" type="date" [(ngModel)]="from" data-bs-from></label>
      <label class="fl">{{ 'to' | t }}<input class="f" type="date" [(ngModel)]="to" data-bs-to></label>
      <label class="fl" *ngIf="branches.length > 1">{{ 'Branch' | t }}<select class="f" [(ngModel)]="branch">
        <option value="">{{ 'All branches' | t }}</option><option *ngFor="let b of branches" [value]="b.id">{{ b.name }}</option></select></label>
      <label class="fl">{{ 'Stage' | t }}<select class="f" [(ngModel)]="stage">
        <option value="">{{ 'All stages' | t }}</option><option *ngFor="let s of stages" [value]="s.key">{{ s.label }}</option></select></label>
      <button type="button" class="lv-btn" (click)="load()" data-bs-show><span class="material-icons">filter_alt</span>{{ 'Show' | t }}</button>
      <span style="flex:1"></span>
      <button type="button" class="lv-btn" (click)="doExport()" [disabled]="!rows.length"><span class="material-icons">download</span>{{ 'Excel' | t }}</button>
      <button type="button" class="lv-btn primary" *ngIf="can.calculate" [disabled]="busy || !calcIds().length" (click)="calculateAll()" data-bs-calc>
        <span class="material-icons">calculate</span>{{ 'Calculate all ({0})' | t:calcIds().length }}</button>
    </div>
    <div class="acts" *ngIf="selected().length" data-bs-acts>
      <span class="sel">{{ '{0} selected' | t:selected().length }}</span>
      <button type="button" class="lv-btn sm" *ngIf="can.submit" [disabled]="busy || !forStep('submit').length" (click)="step('submit')" data-bs-submit>{{ 'Submit to Finance ({0})' | t:forStep('submit').length }}</button>
      <button type="button" class="lv-btn sm" *ngIf="can.validate" [disabled]="busy || !forStep('validate').length" (click)="step('validate')" data-bs-validate>{{ 'Validate ({0})' | t:forStep('validate').length }}</button>
      <button type="button" class="lv-btn sm" *ngIf="can.approve" [disabled]="busy || !forStep('approve').length" (click)="step('approve')" data-bs-approve>{{ 'Approve ({0})' | t:forStep('approve').length }}</button>
      <button type="button" class="lv-btn sm ok" *ngIf="can.pay" [disabled]="busy || !forStep('pay').length" (click)="openPay()" data-bs-pay>{{ 'Pay selected ({0})' | t:forStep('pay').length }}</button>
      <button type="button" class="lv-link" (click)="clearSel()">{{ 'Clear selection' | t }}</button>
    </div>
    <div style="overflow-x:auto">
      <table class="lt" zPlain *ngIf="rows.length" data-bs-table>
        <thead><tr>
          <th class="chk"><input type="checkbox" [checked]="allSel()" (change)="toggleAll($any($event.target).checked)" [attr.aria-label]="'Select all' | t"></th>
          <th>{{ 'Employee' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Last working day' | t }}</th><th>{{ 'Stage' | t }}</th>
          <th class="end">{{ 'Earnings' | t }}</th><th class="end">{{ 'Deductions' | t }}</th><th class="end">{{ 'Net payable (AED)' | t }}</th><th></th></tr></thead>
        <tbody>
          <ng-container *ngFor="let r of rows">
            <tr [attr.data-bs-row]="r.employee_code" (click)="toggleOpen(r)">
              <td class="chk" (click)="$event.stopPropagation()"><input type="checkbox" [(ngModel)]="sel[r.id]" [attr.aria-label]="r.employee"></td>
              <td><b>{{ r.employee }}</b><br><small class="mut">{{ r.employee_code }}<ng-container *ngIf="r.number"> · {{ r.number }}</ng-container></small></td>
              <td>{{ r.branch }}</td>
              <td class="num">{{ r.last_working_date | zdate }}<br><small class="mut" *ngIf="r.stage !== 'paid' && r.days_left !== null">{{ r.days_left < 0 ? ('{0} days overdue' | t:(-r.days_left)) : ('{0} days left' | t:r.days_left) }}</small></td>
              <td><span class="chip" [class.ok]="r.stage === 'paid'" [class.warn]="r.stage === 'approved'" [class.info]="r.stage === 'submitted' || r.stage === 'validated'" [class.bad]="r.block">{{ r.stage_label }}</span></td>
              <td class="end num">{{ r.total_earnings === null ? '–' : (r.total_earnings | number:'1.2-2') }}</td>
              <td class="end num">{{ r.total_deductions === null ? '–' : (r.total_deductions | number:'1.2-2') }}</td>
              <td class="end"><b class="num" *ngIf="r.net !== null">{{ r.net | number:'1.2-2' }}</b><span class="mut" *ngIf="r.net === null">{{ 'Not calculated' | t }}</span></td>
              <td class="end"><span class="material-icons x" *ngIf="r.lines.length">{{ open[r.id] ? 'expand_less' : 'expand_more' }}</span></td>
            </tr>
            <tr class="ln" *ngIf="open[r.id]" [attr.data-bs-lines]="r.employee_code">
              <td></td>
              <td colspan="8">
                <p class="msg err" *ngIf="r.block" style="margin:8px 0">{{ r.block }}</p>
                <table class="lines" zPlain>
                  <tr *ngFor="let l of r.lines">
                    <td class="k"><span class="chip" [class.ok]="l.kind === 'earning'" [class.bad]="l.kind === 'deduction'" [class.info]="l.kind === 'info'">{{ kindLabel(l.kind) | t }}</span></td>
                    <td><b>{{ l.label }}</b><br><small class="mut" *ngIf="l.basis">{{ l.basis }}</small></td>
                    <td class="end num">{{ l.kind === 'info' || l.kind === 'block' ? '' : ((l.kind === 'deduction' ? -l.amount : l.amount) | number:'1.2-2') }}</td>
                  </tr>
                  <tr class="tot"><td></td><td>{{ 'Net payable (AED)' | t }}</td><td class="end num">{{ r.net | number:'1.2-2' }}</td></tr>
                </table>
                <a class="lv-link" [routerLink]="['/main-sidebar/sub-sidebar/leavers', r.id]">{{ 'Open the leaver' | t }}</a>
              </td>
            </tr>
          </ng-container>
        </tbody>
      </table>
      <div class="empty" *ngIf="!rows.length && !loading"><span class="material-icons">groups</span>{{ 'No leavers with a last working day in this period.' | t }}</div>
      <div class="empty" *ngIf="loading">{{ 'Loading…' | t }}</div>
    </div>
  </div>

  <div class="lv-dlg-back" *ngIf="pay" (click)="pay = null">
    <div class="lv-dlg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="'Pay selected' | t" data-bs-pay-dlg>
      <header><h2>{{ 'Pay {0} final settlements' | t:forStep('pay').length }}</h2><button type="button" class="lv-link" (click)="pay = null" [attr.aria-label]="'Close' | t"><span class="material-icons">close</span></button></header>
      <div class="body">
        <p class="msg err wide" *ngIf="payErr" style="margin:0">{{ payErr }}</p>
        <p class="mut wide" style="margin:0">{{ 'Total {0} AED. Each settlement is paid with this reference unless you enter its own below.' | t:(payTotal() | number:'1.2-2') }}</p>
        <label class="fl">{{ 'Payment reference (bank transfer / WPS)' | t }}<input class="f" [(ngModel)]="pay.ref" maxlength="60" data-bs-ref><span class="err-t" *ngIf="payErrs.payment_ref">{{ 'Required.' | t }}</span></label>
        <label class="fl">{{ 'Paid on' | t }}<input class="f" type="date" [(ngModel)]="pay.on" data-bs-on></label>
        <div class="wide" style="max-height:240px;overflow:auto">
          <table class="lines" zPlain>
            <tr *ngFor="let r of forStepRows('pay')"><td>{{ r.employee_code }} {{ r.employee }}</td><td class="end num">{{ r.net | number:'1.2-2' }}</td>
              <td><input class="f" style="height:30px;width:150px" [(ngModel)]="pay.refs[r.id]" maxlength="60" [placeholder]="'Own reference' | t"></td></tr>
          </table>
        </div>
      </div>
      <footer><button type="button" class="lv-btn" (click)="pay = null">{{ 'Cancel' | t }}</button>
        <button type="button" class="lv-btn ok" [disabled]="busy" (click)="doPay()" data-bs-pay-go>{{ 'Pay' | t }}</button></footer>
    </div>
  </div>
</div>`,
})
export class BulkSettlementComponent implements OnInit {
  rows: any[] = []; summary: any = {}; stages: any[] = []; branches: any[] = []; can: any = {};
  from = ''; to = ''; branch = ''; stage = ''; loading = false; busy = false; msg = ''; msgErr = false;
  sel: Record<number, boolean> = {}; open: Record<number, boolean> = {}; results: any[] = []; done = 0; failed = 0;
  pay: any = null; payErr = ''; payErrs: any = {};
  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {
    const d = new Date(); const y = d.getFullYear(); const m = d.getMonth();
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    this.from = iso(new Date(y, m, 1)); this.to = iso(new Date(y, m + 1, 0));
  }
  private url(p: string, q = ''): string { return `${this.rec.api}/payroll-plus/api/leavers/bulk/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  private err(e: any): string {
    const d = e?.error;
    if (d && typeof d === 'object' && typeof d.detail === 'string') { return d.detail; }
    const t = httpErrorText(e);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : i18nT('It could not be done.');
  }
  ngOnInit(): void { this.load(); }
  n(k: string): number { return (this.summary.counts || {})[k] || 0; }
  kindLabel(k: string): string { return ({ earning: 'Earning', deduction: 'Deduction', info: 'Note', block: 'Blocked' } as any)[k] || k; }
  async load(keepResults = false): Promise<void> {
    this.loading = true; if (!keepResults) { this.results = []; this.msg = ''; } this.cd.detectChanges();
    const q = `&from=${this.from || ''}&to=${this.to || ''}` + (this.branch ? `&branch=${this.branch}` : '') + (this.stage ? `&stage=${this.stage}` : '');
    try {
      const d = await firstValueFrom(this.http.get<any>(this.url('', q)));
      this.rows = d.rows || []; this.summary = d.summary || {}; this.stages = d.stages || []; this.branches = d.branches || []; this.can = d.can || {};
      const ids = new Set(this.rows.map(r => r.id));
      Object.keys(this.sel).forEach(k => { if (!ids.has(+k)) { delete this.sel[+k]; } });
    } catch (e: any) { this.rows = []; this.summary = {}; this.msg = this.err(e); this.msgErr = true; }
    this.loading = false; this.cd.detectChanges();
  }
  selected(): any[] { return this.rows.filter(r => this.sel[r.id]); }
  allSel(): boolean { return !!this.rows.length && this.rows.every(r => this.sel[r.id]); }
  toggleAll(on: boolean): void { this.rows.forEach(r => this.sel[r.id] = on); }
  clearSel(): void { this.sel = {}; }
  toggleOpen(r: any): void { if (r.lines.length) { this.open[r.id] = !this.open[r.id]; } }
  /** Calculate all: the selected leavers, or every leaver of the list when nothing is selected – only those not calculated or still with HR */
  calcIds(): number[] {
    const base = this.selected().length ? this.selected() : this.rows;
    return base.filter(r => r.stage === 'to_calculate' || r.stage === 'draft').map(r => r.id);
  }
  forStepRows(step: string): any[] { return this.selected().filter(r => STEP_OF[r.stage] === step && r.rights && r.rights[step]); }
  forStep(step: string): number[] { return this.forStepRows(step).map(r => r.id); }
  payTotal(): number { return this.forStepRows('pay').reduce((a, r) => a + (r.net || 0), 0); }
  private show(d: any, okText: string): void {
    this.results = d.results || []; this.done = d.done || 0; this.failed = d.failed || 0;
    this.msg = this.failed ? i18nT('{0} done, {1} not done – see the list below.', [this.done, this.failed]) : i18nT(okText, [this.done]);
    this.msgErr = !!this.failed && !this.done;
  }
  async calculateAll(): Promise<void> {
    const ids = this.calcIds();
    if (!ids.length || !(await zConfirm(i18nT('Calculate the final settlement of {0} leavers from the current records?', [ids.length]), { ok: i18nT('Calculate') }))) { return; }
    this.busy = true; this.cd.detectChanges();
    try { this.show(await firstValueFrom(this.http.post<any>(this.url('calculate/'), { ids })), '{0} settlements calculated.'); }
    catch (e: any) { this.msg = this.err(e); this.msgErr = true; this.results = []; }
    this.busy = false; await this.load(true);
  }
  async step(step: string): Promise<void> {
    const ids = this.forStep(step);
    const what: any = { submit: 'Submit {0} settlements to Finance?', validate: 'Validate {0} settlements?', approve: 'Approve {0} settlements?' };
    if (!ids.length || !(await zConfirm(i18nT(what[step], [ids.length])))) { return; }
    this.busy = true; this.cd.detectChanges();
    try { this.show(await firstValueFrom(this.http.post<any>(this.url(step + '/'), { ids })), '{0} settlements done.'); }
    catch (e: any) { this.msg = this.err(e); this.msgErr = true; this.results = []; }
    this.busy = false; await this.load(true);
  }
  openPay(): void {
    const d = new Date();
    this.payErr = ''; this.payErrs = {};
    this.pay = { ref: '', on: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, refs: {} };
  }
  async doPay(): Promise<void> {
    const ids = this.forStep('pay');
    this.busy = true; this.payErr = ''; this.payErrs = {}; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url('pay/'), { ids, payment_ref: this.pay.ref, paid_on: this.pay.on, refs: this.pay.refs }));
      this.pay = null; this.show(d, '{0} settlements paid.'); this.busy = false; await this.load(true);
    } catch (e: any) { this.payErrs = e?.error?.errors || {}; this.payErr = this.err(e); this.busy = false; this.cd.detectChanges(); }
  }
  doExport(): void {
    const h = ['Employee', 'Code', 'Branch', 'Last working day', 'Stage', 'Settlement', 'Line', 'Kind', 'Amount (AED)', 'Basis'].map(x => i18nT(x));
    const out: any[] = [];
    for (const r of this.rows) {
      if (!r.lines.length) { out.push([r.employee, r.employee_code, r.branch, r.last_working_date || '', r.stage_label, r.number || '', '', '', '', '']); continue; }
      for (const l of r.lines) { out.push([r.employee, r.employee_code, r.branch, r.last_working_date || '', r.stage_label, r.number || '', l.label, i18nT(this.kindLabel(l.kind)), l.kind === 'deduction' ? -l.amount : l.amount, l.basis]); }
      out.push([r.employee, r.employee_code, r.branch, r.last_working_date || '', r.stage_label, r.number || '', i18nT('Net payable (AED)'), '', r.net, '']);
    }
    exportExcel(i18nT('Bulk final settlement'), h, out as any);
  }
}
