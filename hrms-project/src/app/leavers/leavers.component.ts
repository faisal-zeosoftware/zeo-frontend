/**
 * v1.62.0 EOS – Leavers: one workspace for everyone leaving the company (approved resignation, termination, end of contract,
 * retirement, death) from the approved exit to the paid final settlement. Replaces the menu entries Approved resignations,
 * End of service and Final settlement (their addresses open this page).
 * API (PayrollPlus): GET leavers/?stage=&branch=&q=   POST leavers/ (new leaver: termination / end of contract …)
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { TPipe, ZDatePipe, i18nT } from '../shared-ui/i18n.service';
import { ZEmpPickComponent } from '../shared-ui/z-emp-pick.component';
import { exportCsv, exportExcel } from '../shared-ui/z-export';
import { LV_STYLES } from './leavers.styles';

@Component({
  selector: 'app-leavers',
  standalone: true,
  imports: [CommonModule, FormsModule, TPipe, ZDatePipe, ZEmpPickComponent],
  styles: [LV_STYLES + `
.lv .kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin:16px 0}
@media (max-width:1100px){.lv .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
.lv .kpi{padding:14px 16px;cursor:pointer;text-align:start;border:1px solid var(--line);background:#fff;border-radius:14px;transition:box-shadow .15s}
.lv .kpi:hover{box-shadow:0 4px 14px rgba(27,22,64,.08)}
.lv .kpi.on{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset}
.lv .kpi span{display:block;font-size:12px;color:var(--mut);font-weight:600}
.lv .kpi b{display:block;font-size:24px;color:var(--ink);margin-top:4px;font-weight:700}
.lv .kpi.bad b{color:var(--bad)}
.lv .bar{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.lv .bar .search{flex:1 1 260px;position:relative}
.lv .bar .search input{width:100%;padding-inline-start:36px}
.lv .bar .search .material-icons{position:absolute;inset-inline-start:10px;top:8px;font-size:20px;color:#9aa0b5}
.lv .who{display:flex;gap:11px;align-items:center}
.lv .who .nm{font-weight:600;color:var(--ink);font-size:13.5px}
.lv .who .sub{font-size:12px;color:var(--mut)}
.lv .dl{display:flex;flex-direction:column;gap:3px;align-items:flex-start}
.lv .dl small{font-size:11.5px;color:var(--mut)}
.lv .stg{display:flex;flex-direction:column;gap:6px}
.lv .stg span{font-size:12px;font-weight:600;color:var(--ink2)}
.lv .net{font-weight:700;color:var(--ink);font-size:14px}
.lv .exp{position:relative}
.lv .exp .menu{position:absolute;inset-inline-end:0;top:40px;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:20;min-width:150px;padding:4px}
.lv .exp .menu button{display:block;width:100%;text-align:start;border:0;background:none;padding:8px 12px;border-radius:7px;cursor:pointer;font-size:13px}
.lv .exp .menu button:hover{background:#f4f5fa}
.lv .foot{padding:10px 16px;color:var(--mut);font-size:12px}
`],
  template: `
<div class="lv">
  <div class="card lv-head">
    <div>
      <h1>Leavers</h1>
      <p>Everyone leaving the company, from the approved exit to the paid final settlement. Pay within {{ dueDays }} days of the last working day (UAE Labour Law).</p>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
    <span class="chip bad" *ngIf="overdue">{{ overdue === 1 ? ('1 payment overdue' | t) : ('{0} payments overdue' | t:overdue) }}</span>
    <button type="button" class="lv-btn primary" *ngIf="canNew" (click)="openNew()"><span class="material-icons">person_remove</span>New leaver</button></div>
  </div>

  <p class="msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}</p>

  <div class="kpis">
    <button type="button" class="kpi" *ngFor="let k of kpis" [class.on]="stage === k.stage" [class.bad]="k.key === 'overdue' && k.n > 0" (click)="pickStage(k.stage)">
      <span>{{ k.label | t }}</span><b class="num">{{ k.n }}</b>
    </button>
  </div>

  <div class="card">
    <div class="bar">
      <div class="search"><span class="material-icons">search</span>
        <input class="f" type="search" [(ngModel)]="q" (ngModelChange)="filter()" placeholder="Search name, code or number" aria-label="Search"></div>
      <select class="f" [(ngModel)]="stage" (ngModelChange)="load()" aria-label="Stage">
        <option value="">All stages</option><option value="open">Open</option>
        <option *ngFor="let s of stages" [value]="s.key">{{ s.label }}</option>
      </select>
      <select class="f" [(ngModel)]="branch" (ngModelChange)="load()" aria-label="Branch" *ngIf="branches.length > 1">
        <option value="">All branches</option><option *ngFor="let b of branches" [value]="b.id">{{ b.name }}</option>
      </select>
      <div class="exp">
        <button type="button" class="lv-btn" (click)="expOpen = !expOpen" [disabled]="!shown.length"><span class="material-icons">download</span>Export</button>
        <div class="menu" *ngIf="expOpen"><button type="button" (click)="doExport('xlsx')">Excel</button><button type="button" (click)="doExport('csv')">CSV</button></div>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="lt" *ngIf="shown.length">
        <thead><tr><th>Employee</th><th>Branch</th><th>Exit type</th><th>Last working day</th><th>Payment deadline</th><th class="end">Net payable (AED)</th><th>Stage</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of shown" (click)="open(r)" tabindex="0" (keydown.enter)="open(r)">
            <td><div class="who"><div class="av"><img *ngIf="r.photo" [src]="media(r.photo)" alt=""><ng-container *ngIf="!r.photo">{{ r.initials }}</ng-container></div>
              <div><div class="nm">{{ r.employee }}</div><div class="sub">{{ r.employee_code }}<ng-container *ngIf="r.designation"> · {{ r.designation }}</ng-container></div></div></div></td>
            <td>{{ r.branch }}</td>
            <td><span class="chip" [class.bad]="r.exit_type === 'termination'" [class.info]="r.exit_type === 'end_of_contract'" [class.acc]="r.exit_type === 'resignation'">{{ r.exit_type_label }}</span></td>
            <td class="num">{{ r.last_working_date | zdate }}</td>
            <td><div class="dl">
              <ng-container *ngIf="r.stage === 'paid'"><span class="chip ok">{{ 'Paid {0}' | t:(r.paid_on | zdate) }}</span>
                <small *ngIf="r.paid_late_days > 0" class="num">{{ '{0} days late' | t:r.paid_late_days }}</small></ng-container>
              <ng-container *ngIf="r.stage !== 'paid' && r.stage !== 'cancelled'">
                <span class="chip" [class.bad]="r.days_left < 0" [class.warn]="r.days_left >= 0 && r.days_left <= 3" [class.info]="r.days_left > 3">
                  {{ r.days_left < 0 ? ('{0} days overdue' | t:(-r.days_left)) : (r.days_left === 0 ? ('Due today' | t) : ('{0} days left' | t:r.days_left)) }}</span>
                <small class="num">{{ 'Due {0}' | t:(r.due_date | zdate) }}</small></ng-container>
            </div></td>
            <td class="end"><span class="net num" *ngIf="r.net !== null">{{ r.net | number:'1.2-2' }}</span><span class="mut" *ngIf="r.net === null">Not calculated</span></td>
            <td><div class="stg">
              <div class="steps" [attr.title]="steps.join(' → ')"><ng-container *ngFor="let s of steps; let i = index">
                <b *ngIf="i > 0" [class.done]="i < r.steps_done"></b><i [class.done]="i < r.steps_done" [class.cur]="i === r.steps_done && r.stage !== 'paid'"></i></ng-container></div>
              <span>{{ r.stage_label }}</span></div></td>
          </tr>
        </tbody>
      </table>
      <div class="empty" *ngIf="!shown.length && !loading"><span class="material-icons">how_to_reg</span>
        {{ rows.length ? ('No leavers match the filter.' | t) : ('No leavers yet. Approved resignations and terminations show here.' | t) }}</div>
      <div class="empty" *ngIf="loading">Loading…</div>
    </div>
    <div class="foot" *ngIf="shown.length">{{ 'Showing {0} of {1}' | t:shown.length:rows.length }}</div>
  </div>

  <div class="lv-dlg-back" *ngIf="nw" (click)="nw = null">
    <div class="lv-dlg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="New leaver">
      <header><h2>New leaver</h2><button type="button" class="lv-link" (click)="nw = null" aria-label="Close"><span class="material-icons">close</span></button></header>
      <div class="body">
        <p class="msg err wide" *ngIf="dlgErr" style="margin:0">{{ dlgErr }}</p>
        <p class="mut wide" style="margin:0">For terminations, end of contract, retirement or death. A resignation is entered by the employee or HR in Resignation requests.</p>
        <label class="fl wide">Employee<z-emp-pick [(ngModel)]="nw.employee" name="emp" inputId="lv-emp"></z-emp-pick><span class="err-t" *ngIf="errs.employee">{{ errs.employee }}</span></label>
        <label class="fl">Exit type<select class="f" [(ngModel)]="nw.exit_type" name="type">
          <option *ngFor="let x of exitTypes" [value]="x.key">{{ x.label }}</option></select><span class="err-t" *ngIf="errs.exit_type">{{ errs.exit_type }}</span></label>
        <label class="fl">Notice given on<input class="f" type="date" [(ngModel)]="nw.notice_date" name="nd"><span class="err-t" *ngIf="errs.notice_date">{{ errs.notice_date }}</span></label>
        <label class="fl">Notice period (days)<input class="f" type="number" min="0" [(ngModel)]="nw.notice_days" name="nn"></label>
        <label class="fl">Last working day<input class="f" type="date" [(ngModel)]="nw.last_working_date" name="lwd"><span class="err-t" *ngIf="errs.last_working_date">{{ errs.last_working_date }}</span></label>
        <label class="fl wide">Reason<textarea class="f" rows="3" [(ngModel)]="nw.reason" name="rs" placeholder="For example: position made redundant"></textarea></label>
      </div>
      <footer><button type="button" class="lv-btn" (click)="nw = null">Cancel</button>
        <button type="button" class="lv-btn primary" [disabled]="busy || !nw.employee || !nw.last_working_date" (click)="saveNew()">Save and calculate</button></footer>
    </div>
  </div>
</div>`,
})
export class LeaversComponent implements OnInit {
  rows: any[] = []; shown: any[] = []; counts: Record<string, number> = {}; stages: any[] = []; branches: any[] = []; exitTypes: any[] = [];
  steps: string[] = []; kpis: any[] = [];
  stage = ''; branch = ''; q = ''; dueDays = 14; canNew = false; loading = false; busy = false; expOpen = false;
  msg = ''; msgErr = false; nw: any = null; errs: any = {}; dlgErr = ''; overdue = 0;
  constructor(private http: HttpClient, private rec: ZRecordService, private router: Router, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/payroll-plus/api/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  media(p: string): string { return /^https?:/.test(p) ? p : this.rec.api + p; }
  private err(e: any): string {
    const d = e?.error;
    if (d && typeof d === 'object' && typeof d.detail === 'string') { return d.detail; }
    const t = httpErrorText(e);
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : i18nT('It could not be done.');
  }
  ngOnInit(): void { this.load(); }
  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try {
      const all = await firstValueFrom(this.http.get<any>(this.url('leavers/', this.branch ? `&branch=${this.branch}` : '')));
      const counts = all.counts || {};
      this.stages = all.stages || []; this.branches = all.branches || []; this.exitTypes = all.exit_types || []; this.steps = all.steps || [];
      this.canNew = !!all.can_new; this.dueDays = all.due_days || 14;
      const allRows: any[] = all.rows || [];
      const overdue = allRows.filter(r => r.overdue).length;
      this.kpis = [
        { key: 'to_calculate', label: 'To calculate', stage: 'to_calculate', n: counts.to_calculate || 0 },
        { key: 'draft', label: 'With HR', stage: 'draft', n: counts.draft || 0 },
        { key: 'submitted', label: 'With Finance', stage: 'submitted', n: counts.submitted || 0 },
        { key: 'validated', label: 'To approve', stage: 'validated', n: counts.validated || 0 },
        { key: 'approved', label: 'To pay', stage: 'approved', n: counts.approved || 0 },
        { key: 'paid', label: 'Paid', stage: 'paid', n: counts.paid || 0 },
      ];
      this.overdue = overdue;
      this.rows = this.stage === 'open' ? allRows.filter(r => r.stage !== 'paid' && r.stage !== 'cancelled') : (this.stage ? allRows.filter(r => r.stage === this.stage) : allRows);
      this.filter();
    } catch (e: any) { this.rows = []; this.shown = []; this.msg = this.err(e); this.msgErr = true; }
    this.loading = false; this.cd.detectChanges();
  }
  pickStage(s: string): void { this.stage = this.stage === s ? '' : s; this.load(); }
  filter(): void {
    const q = (this.q || '').trim().toLowerCase();
    this.shown = !q ? this.rows : this.rows.filter(r => `${r.employee} ${r.employee_code} ${r.number} ${r.document_number} ${r.designation} ${r.branch}`.toLowerCase().includes(q));
    this.cd.detectChanges();
  }
  open(r: any): void { this.router.navigate(['/main-sidebar/sub-sidebar/leavers', r.id]); }
  doExport(kind: 'xlsx' | 'csv'): void {
    this.expOpen = false;
    const h = ['Employee', 'Code', 'Branch', 'Department', 'Designation', 'Exit type', 'Last working day', 'Payment due', 'Days left', 'Net payable (AED)', 'Stage', 'Settlement', 'Paid on'].map(x => i18nT(x));
    const rows = this.shown.map(r => [r.employee, r.employee_code, r.branch, r.department, r.designation, r.exit_type_label, r.last_working_date || '', r.due_date || '',
      r.days_left === null || r.days_left === undefined ? '' : String(r.days_left), r.net === null ? '' : Number(r.net).toFixed(2), r.stage_label, r.number || '', r.paid_on || '']);
    if (kind === 'xlsx') { exportExcel(i18nT('Leavers'), h, rows); } else { exportCsv(i18nT('Leavers'), h, rows); }
  }
  openNew(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.errs = {}; this.dlgErr = '';
    this.nw = { employee: null, exit_type: 'termination', notice_date: today, notice_days: 30, last_working_date: '', reason: '' };
  }
  async saveNew(): Promise<void> {
    this.busy = true; this.errs = {};
    try {
      const r = await firstValueFrom(this.http.post<any>(this.url('leavers/'), this.nw));
      this.nw = null;
      this.router.navigate(['/main-sidebar/sub-sidebar/leavers', r.id]);
    } catch (e: any) {
      const d = e?.error || {};
      this.errs = d.errors || {};
      this.dlgErr = this.err(e);
    }
    this.busy = false; this.cd.detectChanges();
  }
}
