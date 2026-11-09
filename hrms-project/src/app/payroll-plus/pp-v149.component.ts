/**
 * v1.49.0 – Payroll: monthly provisions (gratuity, leave salary, air tickets per employee, the change on the month before,
 * CSV, post to accounting) and loans (balance, instalment, schedule of paid and planned months; top-up, new instalment,
 * early settlement, pause / resume). The loans page also serves the employee (My loans: read only).
 * API (PayrollPlus): provisions/, provisions/<id>/, provisions/<id>/final|post/, loans/, loans/<id>/, loans/<id>/<action>/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

class Api {
  constructor(private http: HttpClient, private rec: ZRecordService) {}
  url(p: string, q: Record<string, any> = {}): string {
    const qs = Object.entries(q).filter(([, v]) => v !== '' && v !== null && v !== undefined).map(([k, v]) => `&${k}=${encodeURIComponent(String(v))}`).join('');
    return `${this.rec.api}/payroll-plus/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}${qs}`;
  }
  get<T = any>(p: string, q: Record<string, any> = {}): Promise<T> { return firstValueFrom(this.http.get<T>(this.url(p, q))); }
  post<T = any>(p: string, b: any = {}): Promise<T> { return firstValueFrom(this.http.post<T>(this.url(p), b)); }
  async file(p: string, name: string, q: Record<string, any> = {}): Promise<void> {
    const blob = await firstValueFrom(this.http.get(this.url(p, q), { responseType: 'blob' }));
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
}

const KINDS = [['gratuity', 'Gratuity'], ['leave', 'Leave salary'], ['air_ticket', 'Air tickets']];

@Component({
  selector: 'app-provisions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './pp-card.css'],   // v1.62.0 talent-ops: card header
  styles: [`.pv-grid { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 900px) { .pv-grid { grid-template-columns: 1fr; } }
    .pv-list button { display: flex; justify-content: space-between; width: 100%; padding: 9px 12px; border: 0; border-bottom: 1px solid #eef0f2; background: #fff; cursor: pointer; text-align: left; }
    .pv-list button.on { background: #eef4fb; box-shadow: inset 3px 0 0 #2b6cb0; } .pv-list { border: 1px solid #e3e6ea; border-radius: 10px; overflow: hidden; }
    .pv-tot { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; }
    .pv-tot div { background: #f7f8fa; border-radius: 10px; padding: 10px 12px; } .pv-tot small { color: #5d6670; display: block; }
    .pv-tot b { font-size: 18px; font-variant-numeric: tabular-nums; } .r { text-align: right; font-variant-numeric: tabular-nums; }
    table.pv { width: 100%; border-collapse: collapse; font-size: 12.5px; } .pv th, .pv td { padding: 6px; border-bottom: 1px solid #eef0f2; }
    .pv th { background: #f7f8fa; text-align: left; } .neg { color: #9b2c24; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head"><div><h1>Provisions</h1>
    <p class="lp-desc">Gratuity (end of service), leave salary and air-ticket liability of every employee at each month end, and the change on the month before – the provision to book. Made on the 1st of every month; post it to accounting or export it.</p></div>
    <div class="lp-actions"><select [(ngModel)]="month" aria-label="Month" data-pv-month><option *ngFor="let m of monthOpts" [value]="m[0]">{{ m[1] }}</option></select><button type="button" class="lp-btn primary" (click)="make()" [disabled]="busy" data-make>Make / remake the month</button></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="pv-grid">
    <div class="pv-list"><button type="button" *ngFor="let r of runs" [class.on]="d?.id === r.id" (click)="open(r.id)"><span>{{ r.label }}</span><small>{{ r.status_label }}</small></button>
      <p class="lp-desc" *ngIf="!runs.length" style="padding:10px">No month yet.</p></div>
    <div *ngIf="d">
      <div class="lp-head" style="margin:0"><h2 style="margin:0;font-size:16px">{{ d.label }} <span class="lp-muted" style="font-size:13px;font-weight:400">· {{ d.employees }} employees · {{ d.status_label }}</span></h2>
        <div class="lp-actions"><button type="button" class="lp-btn" (click)="csv()">CSV</button>
          <button type="button" class="lp-btn" *ngIf="d.status === 'draft'" (click)="act('final')">Mark final</button>
          <button type="button" class="lp-btn primary" *ngIf="d.status !== 'posted' && d.accounting" (click)="act('post')">Post to accounting</button></div></div>
      <div class="pv-tot"><div *ngFor="let k of kinds"><small>{{ k[1] }} – liability</small><b>AED {{ n(d.totals[k[0]]?.closing) }}</b>
        <small>Change on the month before: <span [class.neg]="+d.totals[k[0]]?.movement < 0">{{ n(d.totals[k[0]]?.movement) }}</span></small></div></div>
      <div style="overflow-x:auto"><table class="pv">
        <tr><th>Employee</th><th>Department</th><th *ngFor="let k of kinds" class="r" colspan="2">{{ k[1] }}</th></tr>
        <tr><th></th><th></th><ng-container *ngFor="let k of kinds"><th class="r">Liability</th><th class="r">Change</th></ng-container></tr>
        <tr *ngFor="let r of d.rows" [attr.data-emp]="r.employee_id"><td>{{ r.name }} <small>{{ r.code }}</small></td><td>{{ r.department }}</td>
          <ng-container *ngFor="let k of kinds"><td class="r" [title]="r[k[0]]?.basis || ''">{{ n(r[k[0]]?.closing) }}</td><td class="r" [class.neg]="+(r[k[0]]?.movement || 0) < 0">{{ n(r[k[0]]?.movement) }}</td></ng-container></tr>
      </table></div>
    </div>
  </div>
</div>`,
})
export class ProvisionsComponent implements OnInit {
  api: Api; runs: any[] = []; d: any = null; msg = ''; err = false; busy = false; kinds = KINDS;
  month = (() => { const t = new Date(); t.setDate(0); return t.toISOString().slice(0, 7); })();
  // v1.62.0 talent-ops: the month as "September 2026" (a native month field showed 2026-09)
  monthOpts: string[][] = (() => { const o: string[][] = []; const t = new Date(); t.setDate(1);
    for (let i = 0; i < 18; i++) { const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
      o.push([`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })]); }
    return o; })();
  constructor(http: HttpClient, rec: ZRecordService, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> { await this.load(); if (this.runs.length) { await this.open(this.runs[0].id); } }
  async load(): Promise<void> { try { this.runs = await this.api.get('provisions/'); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async open(id: number): Promise<void> { try { this.d = await this.api.get(`provisions/${id}/`); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async make(): Promise<void> {
    const [y, m] = this.month.split('-').map(Number); const last = new Date(y, m, 0);
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    this.busy = true;
    try { const r: any = await this.api.post('provisions/', { month: iso }); this.say(`${r.label}: ${r.employees} employees.`); await this.load(); await this.open(r.id); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async act(a: string): Promise<void> {
    try { this.d = { ...(await this.api.post(`provisions/${this.d.id}/${a}/`)), accounting: this.d.accounting }; this.say(a === 'post' ? 'Posted to accounting.' : 'Marked final.'); await this.load(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  csv(): void { this.api.file(`provisions/${this.d.id}/`, `provisions-${this.d.month.slice(0, 7)}.csv`, { export: 'csv' }); }
  n(v: any): string { return v === undefined || v === null || v === '' ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],   // v1.62.0 talent-ops
  styleUrls: ['../leave-policy/leave-policy.css', './pp-card.css'],   // v1.62.0 talent-ops: card header
  styles: [`.ln-grid { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 900px) { .ln-grid { grid-template-columns: 1fr; } }
    .ln-list button { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid #eef0f2; background: #fff; padding: 9px 12px; cursor: pointer; }
    .ln-list button.on { background: #eef4fb; box-shadow: inset 3px 0 0 #2b6cb0; } .ln-list { border: 1px solid #e3e6ea; border-radius: 10px; overflow: hidden; }
    .ln-list small { color: #5d6670; display: flex; justify-content: space-between; } .r { text-align: right; font-variant-numeric: tabular-nums; }
    .ln-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin: 10px 0; }
    .ln-facts div { background: #f7f8fa; border-radius: 8px; padding: 8px 10px; } .ln-facts small { display: block; color: #5d6670; font-size: 11px; }
    table.ln { width: 100%; border-collapse: collapse; font-size: 12.5px; } .ln td, .ln th { padding: 5px 6px; border-bottom: 1px solid #eef0f2; text-align: left; }
    .ln tr.planned td { color: #3b4057; } .ln tr.paid td { color: #1d6b37; } .ln-act { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; margin: 10px 0; }
    .ln-act label { display: flex; flex-direction: column; font-size: 12px; color: #5d6670; }
    .ln-wo { background: #fff8e6; border: 1px solid #f0d58a; border-radius: 8px; padding: 8px 10px; margin: 8px 0; font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; }
    .ln-wo-act { display: inline-flex; gap: 6px; flex-wrap: wrap; } .ln-wo input { padding: 4px 6px; border: 1px solid #cfd5dc; border-radius: 6px; }
    .ln-undo { margin-inline-start: 6px; border: 0; background: none; color: #2b6cb0; cursor: pointer; font-size: 12px; text-decoration: underline; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <!-- v1.62.0 talent-ops: stage words, buttons instead of a select used as a menu, chips on the schedule, AED, links to the requests -->
  <div class="lp-head"><div><h1>{{ mine ? 'My loans' : 'Loan balances and schedules' }}</h1>
    <p class="lp-desc">{{ mine ? 'Your loans: what is paid, what is left and the months still to be deducted.' : 'Each loan with what is paid, what is left and the months payroll still deducts. Top up a loan, change the instalment, pause it, or settle it early (also at exit).' }}</p></div>
    <div class="lp-actions" *ngIf="!mine">
      <div class="pp-seg" role="tablist" data-ln-status><button type="button" *ngFor="let s of statuses" [class.on]="status === s[0]" (click)="status = s[0]; load()">{{ s[1] }}</button></div>
      <a class="lp-btn" routerLink="/main-sidebar/loan-sidebar/loan-application">Loan requests</a></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ln-grid">
    <div class="ln-list"><button type="button" *ngFor="let l of rows" [class.on]="d?.id === l.id" (click)="open(l.id)" [attr.data-loan]="l.id">
      <b>{{ l.employee }}</b> <span class="lp-muted">{{ l.code }}</span><div class="lp-muted" style="font-size:12px">{{ l.type }} · {{ l.number }}</div>
      <small><span>{{ aed(l.balance) }} left of {{ aed(l.amount) }}</span><span class="pp-chip" [ngClass]="stageClass(l)">{{ stage(l) }}</span></small></button>
      <p class="lp-desc" *ngIf="loaded && !rows.length" style="padding:10px">{{ status === 'running' ? 'No running loan.' : 'No loan.' }}</p></div>
    <div *ngIf="d">
      <h2 style="margin:0">{{ d.employee }} <span class="lp-muted" style="font-size:13px">{{ d.code }}</span></h2>
      <p class="lp-muted" style="margin:2px 0 0">{{ d.type }} · {{ d.number }}</p>
      <div class="ln-facts"><div><small>Loan</small><b>{{ aed(d.amount) }}</b></div><div><small>Paid</small><b>{{ aed(d.paid) }}</b></div>
        <div><small>Left to pay</small><b>{{ aed(d.balance) }}</b></div><div><small>Instalment</small><b>{{ aed(d.emi) }}</b></div>
        <div><small>Months left</small><b>{{ months(d.months_left) }}</b></div><div><small>Last deduction</small><b>{{ d.last_month ? (d.last_month | date:'MMM yyyy') : '–' }}</b></div>
        <div><small>Stage</small><b><span class="pp-chip" [ngClass]="stageClass(d)">{{ stage(d) }}</span></b></div>
        <!-- v1.67.11 (loans): asked / approved, principal and profit, guarantor, written off, paid out -->
        <div *ngIf="d.terms?.approved_amount" data-ln-asked><small>Asked → approved</small><b>{{ aed(d.terms.requested_amount) }} → {{ aed(d.terms.approved_amount) }}</b></div>
        <div *ngIf="+d.terms?.profit > 0"><small>Principal + profit</small><b>{{ aed(d.terms.principal) }} + {{ aed(d.terms.profit) }}</b></div>
        <div *ngIf="d.terms?.guarantor"><small>Guarantor</small><b>{{ d.terms.guarantor.name }} <span class="lp-muted">{{ d.terms.guarantor.code }}</span></b></div>
        <div *ngIf="+d.terms?.written_off > 0"><small>Written off</small><b>{{ aed(d.terms.written_off) }}</b></div>
        <div *ngIf="d.terms?.payout?.date"><small>Paid out</small><b>{{ d.terms.payout.date | date:'dd/MM/yyyy' }}</b></div></div>
      <div class="ln-wo" *ngIf="d.terms?.writeoff?.status === 'pending'" data-ln-writeoff role="status">
        <b>Write-off waiting for approval:</b> {{ aed(d.terms.writeoff.amount) }} – {{ d.terms.writeoff.reason }} <span class="lp-muted">({{ d.terms.writeoff.by }})</span>
        <span *ngIf="d.can_edit && !mine" class="ln-wo-act">
          <input [(ngModel)]="woNote" placeholder="Note" aria-label="Note">
          <button type="button" class="lp-btn primary" (click)="woDecide(true)" [disabled]="busy" data-wo-approve>Approve write-off</button>
          <button type="button" class="lp-btn danger" (click)="woDecide(false)" [disabled]="busy" data-wo-reject>Reject</button></span></div>
      <div *ngIf="d.can_edit && !mine && ['Approved','Disbursed','In Progress','Paused'].includes(d.status)">
        <div class="ln-act" data-ln-actions>
          <button type="button" class="lp-btn" [class.primary]="act === 'topup'" (click)="pick('topup')">Top-up</button>
          <button type="button" class="lp-btn" [class.primary]="act === 'reschedule'" (click)="pick('reschedule')">New instalment</button>
          <button type="button" class="lp-btn" [class.primary]="act === 'pause'" *ngIf="d.status !== 'Paused'" (click)="pick('pause')">Pause</button>
          <button type="button" class="lp-btn" [class.primary]="act === 'resume'" *ngIf="d.status === 'Paused'" (click)="pick('resume')">Resume</button>
          <button type="button" class="lp-btn danger" [class.primary]="act === 'settle'" (click)="pick('settle')">Settle early</button>
          <!-- v1.67.11 (loans, items 112, 113, 117) -->
          <button type="button" class="lp-btn" [class.primary]="act === 'payout'" *ngIf="!d.terms?.payout?.date && d.status !== 'Paused'" (click)="pick('payout')" data-ln-payout>Pay out</button>
          <button type="button" class="lp-btn" [class.primary]="act === 'prepay'" (click)="pick('prepay')" data-ln-prepay>Part prepayment</button>
          <button type="button" class="lp-btn" [class.primary]="act === 'skip'" (click)="pick('skip')" data-ln-skip>Skip a month</button>
          <button type="button" class="lp-btn danger" [class.primary]="act === 'writeoff'" *ngIf="d.terms?.writeoff?.status !== 'pending'" (click)="pick('writeoff')" data-ln-wo>Write off</button></div>
        <div class="ln-act" *ngIf="act">
          <label *ngIf="act === 'topup'">Amount (AED)<input type="number" min="0" [(ngModel)]="f.amount"></label>
          <label *ngIf="act === 'topup' || act === 'reschedule'">Months left (optional)<input type="number" min="1" [(ngModel)]="f.months"></label>
          <label *ngIf="act === 'reschedule'">or new instalment (AED)<input type="number" min="0" [(ngModel)]="f.emi"></label>
          <label *ngIf="act === 'pause'">From<input type="date" [(ngModel)]="f.start"></label><label *ngIf="act === 'pause'">Resume on<input type="date" [(ngModel)]="f.resume"></label>
          <label *ngIf="act === 'settle'"><span><input type="checkbox" [(ngModel)]="f.at_exit"> at exit (final settlement)</span></label>
          <label *ngIf="act === 'payout'">Paid on<input type="date" [(ngModel)]="f.date"></label><label *ngIf="act === 'payout'">Bank reference<input [(ngModel)]="f.ref"></label>
          <label *ngIf="act === 'prepay' || act === 'writeoff'">Amount (AED)<input type="number" min="0" [(ngModel)]="f.amount" [placeholder]="act === 'writeoff' ? d.balance : ''"></label>
          <label *ngIf="act === 'prepay'">Then<select [(ngModel)]="f.keep"><option value="months">keep the months – lower instalment</option><option value="instalment">keep the instalment – fewer months</option></select></label>
          <label *ngIf="act === 'skip'">Month<input type="month" [(ngModel)]="f.month"></label>
          <label *ngIf="act === 'writeoff'">Reason<input [(ngModel)]="f.reason" required></label>
          <label *ngIf="act !== 'writeoff' && act !== 'payout'">Note<input [(ngModel)]="f.note"></label>
          <button type="button" class="lp-btn primary" (click)="run()" [disabled]="busy" data-run>{{ act === 'settle' ? 'Settle ' + aed(d.balance) : act === 'writeoff' ? 'Ask for approval' : 'Apply' }}</button>
          <button type="button" class="lp-btn" (click)="act = ''; f = {}">Cancel</button></div>
      </div>
      <h3>Schedule</h3>
      <div style="overflow-x:auto;max-height:420px"><table class="ln"><tr><th>#</th><th>Payroll month</th><th class="r">Instalment</th><th class="r">Left after</th><th>Status</th></tr>
        <tr *ngFor="let s of d.schedule" [class]="s.state === 'planned' ? 'planned' : 'paid'" [attr.data-state]="s.state"><td>{{ s.n }}</td><td>{{ s.month | date:'MMM yyyy' }}</td><td class="r">{{ aed(s.amount) }}</td><td class="r">{{ aed(s.balance) }}</td>
          <td><span class="pp-chip" [ngClass]="s.state === 'planned' ? 'muted' : (s.state === 'paused' || s.state === 'skipped') ? 'warn' : s.state === 'written off' ? 'bad' : 'ok'">{{ schedState(s.state) }}</span>
            <button type="button" class="ln-undo" *ngIf="s.state === 'skipped' && d.can_edit && !mine && String(s.month).slice(0, 7) >= thisMonth" (click)="unskip(s.month)">Deduct again</button></td></tr></table></div>
      <ng-container *ngIf="d.events.length"><h3>Changes</h3>
        <table class="ln"><tr><th>Date</th><th>Change</th><th class="r">Amount</th><th class="r">New instalment</th><th class="r">Balance</th><th>Note</th><th>By</th></tr>
          <tr *ngFor="let e of d.events"><td>{{ e.date | date:'dd/MM/yyyy' }}</td><td>{{ e.kind }}</td><td class="r">{{ aed(e.amount) }}</td><td class="r">{{ e.new_emi ? aed(e.new_emi) : '' }}</td>
            <td class="r">{{ e.balance_after ? aed(e.balance_after) : '' }}</td><td>{{ e.note }}</td><td>{{ e.by }}</td></tr></table></ng-container>
    </div>
  </div>
</div>`,
})
export class LoansComponent implements OnInit {
  api: Api; rows: any[] = []; d: any = null; msg = ''; err = false; busy = false; loaded = false; mine = false; status = 'running';
  act = ''; f: any = {};
  constructor(http: HttpClient, rec: ZRecordService, private route: ActivatedRoute, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  statuses = [['running', 'Running'], ['Closed', 'Closed'], ['all', 'All']];   // v1.62.0 talent-ops
  async ngOnInit(): Promise<void> {
    this.mine = !!(this.route.snapshot.data['mine'] || this.route.snapshot.queryParamMap.get('mine'));
    const want = +(this.route.snapshot.queryParamMap.get('loan') || 0);   // v1.62.0 talent-ops: opened from a loan request / repayment
    if (want) { this.status = 'all'; }
    await this.load();
    if (want && this.rows.some(r => r.id === want)) { await this.open(want); } else if (this.rows.length) { await this.open(this.rows[0].id); }
  }
  pick(a: string): void { this.act = this.act === a ? '' : a; this.f = a === 'prepay' ? { keep: 'months' } : {}; }
  aed(v: any): string { return v === undefined || v === null || v === '' ? '–' : 'AED ' + this.n(v); }
  months(n: any): string { const k = +n || 0; return k === 1 ? '1 month' : `${k} months`; }
  /** v1.62.0 talent-ops: the loan's stage in words (a running loan said "Approved") */
  stage(l: any): string {
    if (l.status === 'Paused') { return 'Paused'; }
    if (l.status === 'Closed' || (+l.balance <= 0 && +l.paid > 0)) { return 'Closed'; }
    if (l.status === 'Rejected') { return 'Rejected'; }
    if (l.status === 'Pending') { return 'In approval'; }
    return +l.paid > 0 ? 'Repaying' : 'Approved – not deducted yet';
  }
  stageClass(l: any): string { const s = this.stage(l); return s === 'Closed' ? 'ok' : s === 'Paused' ? 'warn' : s === 'Rejected' ? 'bad' : s === 'Repaying' ? '' : 'info'; }
  schedState(s: string): string { return ({ paid: 'Paid in payroll', 'paid outside payroll': 'Paid outside payroll', planned: 'Planned', paused: 'Paused',
    skipped: 'Skipped', 'written off': 'Written off' } as any)[s] || s; }   // v1.67.11 (loans)
  woNote = '';
  thisMonth = new Date().toISOString().slice(0, 7);   // v1.67.11 (loans): a skip of a past month cannot be undone
  String = String;
  /** v1.67.11 (loans, item 112): another person approves or rejects the write-off */
  async woDecide(yes: boolean): Promise<void> {
    this.busy = true;
    try { this.d = await this.api.post(`loans/${this.d.id}/${yes ? 'writeoff-approve' : 'writeoff-reject'}/`, { note: this.woNote }); this.woNote = '';
      this.say(yes ? 'Write-off approved.' : 'Write-off rejected.'); await this.load(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  async unskip(month: string): Promise<void> {
    try { this.d = await this.api.post(`loans/${this.d.id}/unskip/`, { month: String(month).slice(0, 7) }); this.say('Done.'); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.cd.markForCheck();
  }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('loans/', { mine: this.mine ? 1 : '', status: this.mine ? 'all' : this.status }); this.rows = r.rows; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }
  async open(id: number): Promise<void> { this.act = ''; this.f = {}; try { this.d = await this.api.get(`loans/${id}/`); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async run(): Promise<void> {
    if (this.act === 'settle' && !(await zConfirm(`Settle the balance ${this.n(this.d.balance)} now? The loan is closed.`))) { return; }
    this.busy = true;
    try { this.d = await this.api.post(`loans/${this.d.id}/${this.act}/`, this.f); this.say('Done.'); this.act = ''; this.f = {}; await this.load(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  n(v: any): string { return v === undefined || v === null || v === '' ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
