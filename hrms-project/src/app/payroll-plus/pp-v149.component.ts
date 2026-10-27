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
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';

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
  styleUrls: ['../leave-policy/leave-policy.css'],
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
    <div class="lp-actions"><input type="month" [(ngModel)]="month" aria-label="Month"><button type="button" class="lp-btn primary" (click)="make()" [disabled]="busy" data-make>Make / remake the month</button></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="pv-grid">
    <div class="pv-list"><button type="button" *ngFor="let r of runs" [class.on]="d?.id === r.id" (click)="open(r.id)"><span>{{ r.label }}</span><small>{{ r.status_label }}</small></button>
      <p class="lp-desc" *ngIf="!runs.length" style="padding:10px">No month yet.</p></div>
    <div *ngIf="d">
      <div class="lp-head" style="margin:0"><h2 style="margin:0">{{ d.label }} · {{ d.employees }} employees · {{ d.status_label }}</h2>
        <div class="lp-actions"><button type="button" class="lp-btn" (click)="csv()">CSV</button>
          <button type="button" class="lp-btn" *ngIf="d.status === 'draft'" (click)="act('final')">Mark final</button>
          <button type="button" class="lp-btn primary" *ngIf="d.status !== 'posted' && d.accounting" (click)="act('post')">Post to accounting</button></div></div>
      <div class="pv-tot"><div *ngFor="let k of kinds"><small>{{ k[1] }} – liability</small><b>{{ n(d.totals[k[0]]?.closing) }}</b>
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
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css'],
  styles: [`.ln-grid { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 16px; align-items: start; }
    @media (max-width: 900px) { .ln-grid { grid-template-columns: 1fr; } }
    .ln-list button { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid #eef0f2; background: #fff; padding: 9px 12px; cursor: pointer; }
    .ln-list button.on { background: #eef4fb; box-shadow: inset 3px 0 0 #2b6cb0; } .ln-list { border: 1px solid #e3e6ea; border-radius: 10px; overflow: hidden; }
    .ln-list small { color: #5d6670; display: flex; justify-content: space-between; } .r { text-align: right; font-variant-numeric: tabular-nums; }
    .ln-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin: 10px 0; }
    .ln-facts div { background: #f7f8fa; border-radius: 8px; padding: 8px 10px; } .ln-facts small { display: block; color: #5d6670; font-size: 11px; }
    table.ln { width: 100%; border-collapse: collapse; font-size: 12.5px; } .ln td, .ln th { padding: 5px 6px; border-bottom: 1px solid #eef0f2; text-align: left; }
    .ln tr.planned td { color: #3b4057; } .ln tr.paid td { color: #1d6b37; } .ln-act { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; margin: 10px 0; }
    .ln-act label { display: flex; flex-direction: column; font-size: 12px; color: #5d6670; }`],
  template: `
<div class="lp-page" style="padding:16px 20px">
  <div class="lp-head"><div><h1>{{ mine ? 'My loans' : 'Loans' }}</h1>
    <p class="lp-desc">{{ mine ? 'Your loans: what is paid, what is left and the months still to be deducted.' : 'Running loans with their balance and schedule. Top up a loan, change the instalment, pause it, or settle it early (also at exit).' }}</p></div>
    <div class="lp-actions" *ngIf="!mine"><select [(ngModel)]="status" (ngModelChange)="load()" aria-label="Status"><option value="running">Running</option><option value="Closed">Closed</option><option value="all">All</option></select></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <div class="ln-grid">
    <div class="ln-list"><button type="button" *ngFor="let l of rows" [class.on]="d?.id === l.id" (click)="open(l.id)" [attr.data-loan]="l.id">
      <b>{{ l.employee }}</b> · {{ l.type }}<small><span>Balance {{ n(l.balance) }} of {{ n(l.amount) }}</span><span>{{ l.months_left }} months · {{ l.status }}</span></small></button>
      <p class="lp-desc" *ngIf="loaded && !rows.length" style="padding:10px">No loans.</p></div>
    <div *ngIf="d">
      <h2 style="margin:0">{{ d.employee }} – {{ d.type }} {{ d.number }}</h2>
      <div class="ln-facts"><div><small>Loan</small><b>{{ n(d.amount) }}</b></div><div><small>Paid</small><b>{{ n(d.paid) }}</b></div>
        <div><small>Balance</small><b>{{ n(d.balance) }}</b></div><div><small>Instalment</small><b>{{ n(d.emi) }}</b></div>
        <div><small>Months left</small><b>{{ d.months_left }}</b></div><div><small>Last month</small><b>{{ d.last_month ? (d.last_month | date:'MMM yyyy') : '–' }}</b></div>
        <div><small>Status</small><b>{{ d.status }}</b></div></div>
      <div *ngIf="d.can_edit && !mine && ['Approved','Disbursed','In Progress','Paused'].includes(d.status)">
        <div class="ln-act">
          <select [(ngModel)]="act" aria-label="Change"><option value="">Change the loan…</option><option value="topup">Top-up</option><option value="reschedule">New instalment</option>
            <option value="settle">Early settlement</option><option value="pause" *ngIf="d.status !== 'Paused'">Pause</option><option value="resume" *ngIf="d.status === 'Paused'">Resume</option></select>
          <label *ngIf="act === 'topup'">Amount<input type="number" min="0" [(ngModel)]="f.amount"></label>
          <label *ngIf="act === 'topup' || act === 'reschedule'">Months left (optional)<input type="number" min="1" [(ngModel)]="f.months"></label>
          <label *ngIf="act === 'reschedule'">or new instalment<input type="number" min="0" [(ngModel)]="f.emi"></label>
          <label *ngIf="act === 'pause'">From<input type="date" [(ngModel)]="f.start"></label><label *ngIf="act === 'pause'">Resume on<input type="date" [(ngModel)]="f.resume"></label>
          <label *ngIf="act === 'settle'"><span><input type="checkbox" [(ngModel)]="f.at_exit"> at exit (final settlement)</span></label>
          <label *ngIf="act">Note<input [(ngModel)]="f.note"></label>
          <button type="button" class="lp-btn primary" *ngIf="act" (click)="run()" [disabled]="busy" data-run>{{ act === 'settle' ? 'Settle ' + n(d.balance) : 'Apply' }}</button></div>
      </div>
      <h3>Schedule</h3>
      <div style="overflow-x:auto;max-height:420px"><table class="ln"><tr><th>#</th><th>Month</th><th class="r">Instalment</th><th class="r">Balance after</th><th></th></tr>
        <tr *ngFor="let s of d.schedule" [class]="s.state === 'planned' ? 'planned' : 'paid'"><td>{{ s.n }}</td><td>{{ s.month | date:'MMM yyyy' }}</td><td class="r">{{ n(s.amount) }}</td><td class="r">{{ n(s.balance) }}</td><td>{{ s.state }}</td></tr></table></div>
      <ng-container *ngIf="d.events.length"><h3>Changes</h3>
        <table class="ln"><tr><th>Date</th><th>Change</th><th class="r">Amount</th><th class="r">New instalment</th><th class="r">Balance</th><th>Note</th><th>By</th></tr>
          <tr *ngFor="let e of d.events"><td>{{ e.date | date:'d MMM yyyy' }}</td><td>{{ e.kind }}</td><td class="r">{{ n(e.amount) }}</td><td class="r">{{ e.new_emi ? n(e.new_emi) : '' }}</td>
            <td class="r">{{ e.balance_after ? n(e.balance_after) : '' }}</td><td>{{ e.note }}</td><td>{{ e.by }}</td></tr></table></ng-container>
    </div>
  </div>
</div>`,
})
export class LoansComponent implements OnInit {
  api: Api; rows: any[] = []; d: any = null; msg = ''; err = false; busy = false; loaded = false; mine = false; status = 'running';
  act = ''; f: any = {};
  constructor(http: HttpClient, rec: ZRecordService, private route: ActivatedRoute, private cd: ChangeDetectorRef) { this.api = new Api(http, rec); }
  async ngOnInit(): Promise<void> { this.mine = !!(this.route.snapshot.data['mine'] || this.route.snapshot.queryParamMap.get('mine')); await this.load(); if (this.rows.length) { await this.open(this.rows[0].id); } }
  async load(): Promise<void> {
    try { const r: any = await this.api.get('loans/', { mine: this.mine ? 1 : '', status: this.mine ? 'all' : this.status }); this.rows = r.rows; }
    catch (e) { this.say(httpErrorText(e), true); }
    this.loaded = true; this.cd.markForCheck();
  }
  async open(id: number): Promise<void> { this.act = ''; this.f = {}; try { this.d = await this.api.get(`loans/${id}/`); } catch (e) { this.say(httpErrorText(e), true); } this.cd.markForCheck(); }
  async run(): Promise<void> {
    if (this.act === 'settle' && !confirm(`Settle the balance ${this.n(this.d.balance)} now? The loan is closed.`)) { return; }
    this.busy = true;
    try { this.d = await this.api.post(`loans/${this.d.id}/${this.act}/`, this.f); this.say('Done.'); this.act = ''; this.f = {}; await this.load(); }
    catch (e) { this.say(httpErrorText(e), true); }
    this.busy = false; this.cd.markForCheck();
  }
  n(v: any): string { return v === undefined || v === null || v === '' ? '–' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  say(t: string, err = false): void { this.msg = t; this.err = err; }
}
