/**
 * README – Return from leave / rejoining settlement (v1.11.0)
 * ------------------------------------------------------------------------------------------------
 * HR records the day an employee is back from an approved leave. ZEO works out the gap:
 *   late    → HR chooses: unpaid leave · from a leave balance · balance first, rest unpaid · absent · excused (paid)
 *   early   → automatic: the days not used go back to the balance and the leave is shortened
 *   on time → nothing to settle (settling just closes the record)
 * Settling writes approved leave requests / attendance-calendar days, so payroll and reports pick it up.
 *
 * API (all with ?schema=<selectedSchema>):
 *   GET  hr-actions/api/rejoins/?state=open|settled|all     rows with kind late|early|on_time and days
 *   POST hr-actions/api/rejoins/                            {leave_request, rejoin_date} → {id, kind, days}
 *   POST hr-actions/api/rejoins/<id>/preview/               {treatment, leave_type} → {kind, days, from, to, lines, problems}
 *   POST hr-actions/api/rejoins/<id>/settle/                {treatment, leave_type, note} → {ok, lines, requests}
 * Lookups: tools/api/directory/, calendars/api/emp-leave-request/approved-leaves/ (employee = emp code),
 *          calendars/api/leave-type/.
 *
 * Flow: Open tab → "Record a return" (employee → approved leave → date back) or click an open row →
 *       settle panel (choose treatment for a late return, preview the lines, Settle). Settled tab shows
 *       the treatment and the day counts.
 * Permissions: change_employeerejoining / view_employeerejoining (backend checks them too).
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { ZListDirective } from '../shared-ui/z-list.directive';

type Treatment = 'unpaid' | 'leave' | 'split' | 'absent' | 'excused';
interface RjPlan { kind: 'late' | 'early' | 'on_time'; days: number; from: string | null; to: string | null; lines: string[]; problems: string[]; }

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function list<T = any>(x: any): T[] { return Array.isArray(x) ? x : (x?.results || x?.data || []); }
function dmy(s: any): string { return s ? String(s).slice(0, 10).split('-').reverse().join('/') : ''; }

@Component({
  selector: 'app-rejoining',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../leave-policy/leave-policy.css', './hr-actions.css'],
  template: `
<div class="container ha-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Return from leave</h1>
          <p class="lp-desc">Record the day an employee is back from leave. A late return is settled the way you choose (unpaid, from a leave balance, absent or excused); the days of an early return go back to the balance automatically.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn primary" (click)="openRecord()">+ Record a return</button>
        </div>
      </div>
      <div class="lp-tabs" role="tablist">
        <button type="button" role="tab" [class.on]="tab === 'open'" [attr.aria-selected]="tab === 'open'" (click)="setTab('open')">Open</button>
        <button type="button" role="tab" [class.on]="tab === 'settled'" [attr.aria-selected]="tab === 'settled'" (click)="setTab('settled')">Settled</button>
      </div>
    </div>

    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status">{{ msg }}
        <ul class="ha-done" *ngIf="msgLines.length"><li *ngFor="let l of msgLines">{{ l }}</li></ul>
      </div>
      <p class="lp-muted" *ngIf="loading">Loading…</p>

      <!-- open -->
      <ng-container *ngIf="!loading && tab === 'open'">
        <p class="lp-muted" *ngIf="rows.length" style="margin-top:0">Click a row to settle it.</p>
        <table class="table">
          <thead><tr><th>Employee</th><th>Leave</th><th>Leave dates</th><th>Back on</th><th>Gap</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of rows" class="ha-click" (click)="rowClick($event, r)">
              <td data-label="Employee">{{ r.employee }}</td>
              <td data-label="Leave">{{ r.leave }}<small style="display:block;color:#8a8fa3">{{ r.leave_type }}</small></td>
              <td data-label="Leave dates">{{ r.start | date:'dd/MM/yyyy' }} – {{ r.end | date:'dd/MM/yyyy' }}</td>
              <td data-label="Back on">{{ r.rejoin_date | date:'dd/MM/yyyy' }}</td>
              <td data-label="Gap"><span class="ha-tag" [ngClass]="gapClass(r.kind)">{{ gapText(r) }}</span></td>
              <td data-label="Actions"><button type="button" class="lp-btn primary" style="height:30px" (click)="$event.stopPropagation(); openSettle(r)">Settle</button></td>
            </tr>
          </tbody>
        </table>
        <p class="lp-muted" *ngIf="!rows.length">No open returns. Use <b>Record a return</b> when an employee is back.</p>
      </ng-container>

      <!-- settled -->
      <ng-container *ngIf="!loading && tab === 'settled'">
        <table class="table">
          <thead><tr><th>Employee</th><th>Leave</th><th>Leave dates</th><th>Back on</th><th>Gap</th><th>Treatment</th><th>Days</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of rows">
              <td data-label="Employee">{{ r.employee }}</td>
              <td data-label="Leave">{{ r.leave }}<small style="display:block;color:#8a8fa3">{{ r.leave_type }}</small></td>
              <td data-label="Leave dates">{{ r.start | date:'dd/MM/yyyy' }} – {{ r.end | date:'dd/MM/yyyy' }}</td>
              <td data-label="Back on">{{ r.rejoin_date | date:'dd/MM/yyyy' }}</td>
              <td data-label="Gap"><span class="ha-tag" [ngClass]="gapClass(r.kind)">{{ gapText(r) }}</span></td>
              <td data-label="Treatment">{{ r.treatment || '–' }}</td>
              <td data-label="Days" class="ha-move">{{ dayCounts(r) || '–' }}</td>
            </tr>
          </tbody>
        </table>
        <p class="lp-muted" *ngIf="!rows.length">Nothing settled yet.</p>
      </ng-container>
    </div>
  </div>
</div>

<!-- record a return -->
<div class="lp-modal-back" *ngIf="rec0" (click)="rec0 = null">
  <div class="lp-modal" style="width:min(620px, 100%)" (click)="$event.stopPropagation()" role="dialog" aria-label="Record a return">
    <header><h2>Record a return</h2><button type="button" class="lp-x" (click)="rec0 = null" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body">
      <div class="lp-msg err" *ngIf="recErr">{{ recErr }}</div>
      <div class="lp-form" style="margin-top:0;grid-template-columns:1fr">
        <label>Find employee<input [(ngModel)]="q" placeholder="Name or code" aria-label="Find employee"></label>
        <label>Employee
          <select [(ngModel)]="rec0.employee" (ngModelChange)="pickEmp()">
            <option [ngValue]="null">Choose…</option>
            <option *ngFor="let e of empOptions()" [ngValue]="e.id">{{ e.code }} – {{ e.name }}</option>
          </select></label>
        <label *ngIf="rec0.employee">Approved leave
          <select [(ngModel)]="rec0.leave_request" (ngModelChange)="recErr = ''">
            <option [ngValue]="null">{{ leavesLoading ? 'Loading…' : empLeaves.length ? 'Choose…' : 'No approved leave' }}</option>
            <option *ngFor="let l of empLeaves" [ngValue]="l.id" [disabled]="settledLeaves.has(l.id)">
              {{ l.document_number || ('#' + l.id) }} · {{ l.leave_type }} · {{ dmy(l.start_date) }} – {{ dmy(l.end_date) }}{{ settledLeaves.has(l.id) ? ' (settled)' : '' }}</option>
          </select></label>
        <label *ngIf="rec0.employee && empLeavesAll.length > empLeaves.length" style="flex-direction:row;align-items:center;gap:6px;font-weight:400;color:#2b2f42">
          <input type="checkbox" style="height:auto" [(ngModel)]="showOld" (ngModelChange)="filterLeaves()"> Show older leaves</label>
        <label *ngIf="rec0.leave_request">Back on (first day at work)<input type="date" [(ngModel)]="rec0.rejoin_date" [min]="minBack()"></label>
      </div>
      <p class="lp-muted" *ngIf="chosenLeave() as l">The leave ends {{ dmy(l.end_date) }}. Back on {{ dmy(nextDay(l.end_date)) }} is on time; later is a late return, earlier gives days back.</p>
    </div>
    <footer>
      <button type="button" class="lp-btn" (click)="rec0 = null">Close</button>
      <button type="button" class="lp-btn primary" [disabled]="busy || !rec0.leave_request || !rec0.rejoin_date" (click)="record()">{{ busy ? 'Saving…' : 'Record return' }}</button>
    </footer>
  </div>
</div>

<!-- settle -->
<div class="lp-modal-back" *ngIf="cur" (click)="cur = null">
  <div class="lp-modal" style="width:min(680px, 100%)" (click)="$event.stopPropagation()" role="dialog" aria-label="Settle the return">
    <header><h2>{{ cur.employee }}</h2><span class="ha-tag" [ngClass]="gapClass(kind())">{{ gapText(cur, plan) }}</span>
      <button type="button" class="lp-x" (click)="cur = null" aria-label="Close" style="color:#6b7185">×</button></header>
    <div class="body">
      <div class="ha-facts">
        <div><span>Leave</span>{{ cur.leave }} · {{ cur.leave_type }}</div>
        <div><span>Leave dates</span>{{ cur.start | date:'dd/MM/yyyy' }} – {{ cur.end | date:'dd/MM/yyyy' }}</div>
        <div><span>Back on</span>{{ cur.rejoin_date | date:'dd/MM/yyyy' }}</div>
        <div *ngIf="plan?.from"><span>{{ kind() === 'early' ? 'Days not used' : 'Days missed' }}</span>{{ dmy(plan?.from) }}{{ plan?.to !== plan?.from ? ' – ' + dmy(plan?.to) : '' }}</div>
      </div>

      <ng-container *ngIf="kind() === 'late'">
        <div class="ha-sub">How to count the {{ cur.days | number:'1.0-1' }} day(s)</div>
        <div class="ha-opts" role="radiogroup" aria-label="Treatment">
          <label class="ha-opt" *ngFor="let o of options" [class.on]="treatment === o.key">
            <input type="radio" name="rj-treat" [value]="o.key" [(ngModel)]="treatment" (ngModelChange)="preview()">
            <div style="flex:1;min-width:0"><b>{{ o.label }}</b><small>{{ o.hint }}</small>
              <select *ngIf="(o.key === 'leave' || o.key === 'split') && treatment === o.key" [(ngModel)]="leaveType" (ngModelChange)="preview()" aria-label="Leave type">
                <option [ngValue]="null">Leave type…</option>
                <option *ngFor="let t of balanceTypes()" [ngValue]="t.id">{{ t.name }}</option>
              </select></div>
          </label>
        </div>
        <label class="lp-muted" style="display:block;font-weight:600;font-size:12px">Note
          <input class="ha-note" [(ngModel)]="note" maxlength="255" placeholder="Optional – shown on the leave request"></label>
      </ng-container>

      <p class="lp-muted" *ngIf="planning">Working it out…</p>
      <ul class="ha-plan-lines" *ngIf="plan?.lines?.length && !planning"><li *ngFor="let l of plan?.lines">{{ l }}</li></ul>
      <ul class="ha-plan-lines bad" *ngIf="plan?.problems?.length && !planning"><li *ngFor="let p of plan?.problems">{{ p }}</li></ul>
      <p class="lp-muted" *ngIf="kind() === 'early'" style="margin-top:10px">Nothing to choose – settling shortens the leave and puts the days back on the balance.</p>
    </div>
    <footer>
      <button type="button" class="lp-btn" (click)="cur = null">Close</button>
      <button type="button" class="lp-btn" *ngIf="kind() === 'late'" [disabled]="planning || busy" (click)="preview()">Preview</button>
      <button type="button" class="lp-btn primary" [disabled]="busy || planning || !plan || plan.problems.length > 0" (click)="settle()">
        {{ busy ? 'Settling…' : kind() === 'on_time' ? 'Close as on time' : 'Settle' }}</button>
    </footer>
  </div>
</div>`,
})
export class RejoiningComponent implements OnInit {
  tab: 'open' | 'settled' = 'open'; rows: any[] = []; loading = false; busy = false;
  msg = ''; msgErr = false; msgLines: string[] = [];
  dir: any[] = []; types: any[] = []; approved: any[] | null = null; settledLeaves = new Set<number>();
  // record a return
  rec0: { employee: number | null; leave_request: number | null; rejoin_date: string } | null = null; recErr = '';
  q = ''; empLeavesAll: any[] = []; empLeaves: any[] = []; showOld = false; leavesLoading = false;
  // settle
  cur: any = null; treatment: Treatment = 'unpaid'; leaveType: number | null = null; note = ''; plan: RjPlan | null = null; planning = false;
  private seq = 0;
  readonly dmy = dmy;
  readonly options: { key: Treatment; label: string; hint: string }[] = [
    { key: 'unpaid', label: 'Unpaid leave', hint: 'An approved unpaid leave for the days – deducted from salary.' },
    { key: 'leave', label: 'From a leave balance', hint: 'Take all the days from a balance, e.g. annual leave.' },
    { key: 'split', label: 'Balance first, rest unpaid', hint: 'Use what is left of the balance; the remaining days are unpaid leave.' },
    { key: 'absent', label: 'Absent', hint: 'Shown as absence on the attendance calendar – deducted from salary.' },
    { key: 'excused', label: 'Excused (paid)', hint: 'Paid, no leave taken – e.g. flight delay accepted by the company.' },
  ];

  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p: string, q = ''): string { return `${this.rec.api}/${p}?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${q}`; }
  private err(e: any, d = 'It could not be done.'): string {
    const x = e?.error; if (!x) { return d; }
    if (typeof x === 'string') { return x.length < 300 ? x : d; }
    return x.detail || (Array.isArray(x) ? x.join(' ') : Object.values(x).flat().join(' ')) || d;
  }
  private say(m: string, bad = false, lines: string[] = []): void { this.msg = m; this.msgErr = bad; this.msgLines = lines; }

  ngOnInit(): void { this.load(); }

  setTab(t: 'open' | 'settled'): void { if (this.tab !== t) { this.tab = t; this.load(); } }

  async load(): Promise<void> {
    this.loading = true; this.cd.detectChanges();
    try { this.rows = list(await firstValueFrom(this.http.get<any>(this.url('hr-actions/api/rejoins/', `&state=${this.tab}`)))); }
    catch (e: any) { this.rows = []; this.say(this.err(e, 'Returns could not be loaded.'), true); }
    this.loading = false; this.cd.detectChanges();
  }

  gapClass(k: string): string { return k === 'late' ? 'late' : k === 'early' ? 'early' : 'ontime'; }
  gapText(r: any, p?: RjPlan | null): string {
    const k = p?.kind || r.kind; const n = Number(p?.days ?? r.days ?? 0);
    const d = `${Number.isInteger(n) ? n : n.toFixed(1)} day${n === 1 ? '' : 's'}`;
    return k === 'late' ? `Late ${d}` : k === 'early' ? `Early ${d}` : 'On time';
  }
  dayCounts(r: any): string {
    const p: string[] = []; const f = (v: any) => Number(v || 0);
    if (f(r.from_leave)) { p.push(`${f(r.from_leave)} from leave`); }
    if (f(r.unpaid)) { p.push(`${f(r.unpaid)} unpaid`); }
    if (f(r.absent)) { p.push(`${f(r.absent)} absent`); }
    if (f(r.returned)) { p.push(`${f(r.returned)} back to balance`); }
    if (!p.length && r.kind === 'late' && /excused/i.test(r.treatment || '')) { p.push(`${f(r.days)} excused`); }
    return p.join(' · ');
  }

  // ------------------------------------------------------------ record a return
  async openRecord(): Promise<void> {
    this.rec0 = { employee: null, leave_request: null, rejoin_date: iso(new Date()) }; this.recErr = ''; this.q = '';
    this.empLeaves = []; this.empLeavesAll = []; this.showOld = false; this.cd.detectChanges();
    if (!this.dir.length) {
      try { this.dir = list(await firstValueFrom(this.http.get<any>(this.url('tools/api/directory/')))); } catch { this.dir = []; }
    }
    try {   // leaves that already have a settled return cannot be recorded again
      const s = list(await firstValueFrom(this.http.get<any>(this.url('hr-actions/api/rejoins/', '&state=settled'))));
      this.settledLeaves = new Set(s.map((x: any) => x.leave_request_id));
    } catch { /* the backend refuses them anyway */ }
    this.cd.detectChanges();
  }

  empOptions(): any[] {
    const q = this.q.trim().toLowerCase();
    const out = q ? this.dir.filter(e => `${e.code} ${e.name}`.toLowerCase().includes(q)) : this.dir;
    const sel = this.rec0?.employee ? this.dir.find(e => e.id === this.rec0!.employee) : null;
    const top = out.slice(0, 300);
    return sel && !top.includes(sel) ? [sel, ...top] : top;
  }

  async pickEmp(): Promise<void> {
    if (!this.rec0) { return; }
    this.rec0.leave_request = null; this.recErr = ''; this.empLeaves = []; this.empLeavesAll = [];
    const emp = this.dir.find(e => e.id === this.rec0!.employee);
    if (!emp) { return; }
    if (this.approved === null) {
      this.leavesLoading = true; this.cd.detectChanges();
      try { this.approved = list(await firstValueFrom(this.http.get<any>(this.url('calendars/api/emp-leave-request/approved-leaves/')))); }
      catch (e: any) { this.approved = null; this.recErr = this.err(e, 'Approved leaves could not be loaded.'); }
      this.leavesLoading = false;
    }
    // the leave request API gives the employee code (and the id on older serializers)
    this.empLeavesAll = (this.approved || []).filter(l => l.employee === emp.code || l.employee === emp.id || l.employee_id === emp.id)
      .sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
    this.filterLeaves();
    if (this.empLeaves.length === 1 && !this.settledLeaves.has(this.empLeaves[0].id)) { this.rec0.leave_request = this.empLeaves[0].id; }
    this.cd.detectChanges();
  }

  /** Recent leaves: ended in the last 120 days or not ended yet (all with "Show older leaves"). */
  filterLeaves(): void {
    const d = new Date(); d.setDate(d.getDate() - 120); const cut = iso(d);
    const recent = this.empLeavesAll.filter(l => String(l.end_date) >= cut);
    this.empLeaves = this.showOld || !recent.length ? this.empLeavesAll : recent;
  }

  chosenLeave(): any { return this.rec0?.leave_request ? this.empLeavesAll.find(l => l.id === this.rec0!.leave_request) : null; }
  nextDay(s: string): string { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return iso(new Date(y, m - 1, d + 1)); }
  minBack(): string { const l = this.chosenLeave(); return l ? this.nextDay(l.start_date) : ''; }

  async record(): Promise<void> {
    if (!this.rec0?.leave_request || !this.rec0.rejoin_date) { return; }
    this.busy = true; this.recErr = ''; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url('hr-actions/api/rejoins/'), { leave_request: this.rec0.leave_request, rejoin_date: this.rec0.rejoin_date }));
      this.rec0 = null;
      this.say(`Return recorded – ${this.gapText(d).toLowerCase()}.${d.kind === 'on_time' ? '' : ' Settle it below.'}`);
      this.tab = 'open'; await this.load();
      const row = this.rows.find(r => r.id === d.id);
      if (row && d.kind !== 'on_time') { this.openSettle(row); }
    } catch (e: any) { this.recErr = this.err(e, 'The return could not be recorded.'); }
    this.busy = false; this.cd.detectChanges();
  }

  // ------------------------------------------------------------ settle
  kind(): string { return this.plan?.kind || this.cur?.kind || ''; }

  rowClick(ev: Event, r: any): void {
    if ((ev.target as HTMLElement)?.closest?.('input,button,select,a,label')) { return; }   // e.g. the list's select-row box
    this.openSettle(r);
  }

  balanceTypes(): any[] { return this.types.filter(t => t.type !== 'unpaid'); }

  async openSettle(r: any): Promise<void> {
    this.cur = r; this.treatment = 'unpaid'; this.leaveType = null; this.note = ''; this.plan = null; this.cd.detectChanges();
    if (!this.types.length) {
      try { this.types = list(await firstValueFrom(this.http.get<any>(this.url('calendars/api/leave-type/')))).sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))); }
      catch { this.types = []; }
    }
    await this.preview();
  }

  async preview(): Promise<void> {
    if (!this.cur) { return; }
    const id = ++this.seq; const r = this.cur;
    if ((this.treatment === 'leave' || this.treatment === 'split') && !this.leaveType && r.kind === 'late') {
      this.plan = { kind: 'late', days: r.days, from: this.plan?.from || null, to: this.plan?.to || null, lines: [], problems: ['Choose the leave type to take the days from.'] };
      this.cd.detectChanges(); return;
    }
    this.planning = true; this.cd.detectChanges();
    try {
      const p = await firstValueFrom(this.http.post<RjPlan>(this.url(`hr-actions/api/rejoins/${r.id}/preview/`), { treatment: this.treatment, leave_type: this.leaveType }));
      if (id === this.seq && this.cur === r) { this.plan = { ...p, lines: p.lines || [], problems: p.problems || [] }; }
    } catch (e: any) {
      if (id === this.seq) { this.plan = { kind: r.kind, days: r.days, from: null, to: null, lines: [], problems: [this.err(e, 'The preview could not be made.')] }; }
    }
    if (id === this.seq) { this.planning = false; }
    this.cd.detectChanges();
  }

  async settle(): Promise<void> {
    if (!this.cur || !this.plan || this.plan.problems.length) { return; }
    const r = this.cur;
    this.busy = true; this.cd.detectChanges();
    try {
      const d = await firstValueFrom(this.http.post<any>(this.url(`hr-actions/api/rejoins/${r.id}/settle/`),
        { treatment: this.treatment, leave_type: this.leaveType, note: this.note.trim() }));
      this.cur = null;
      this.say(`Settled: ${r.employee} (${r.leave}).`, false, d?.lines || []);
      await this.load();
    } catch (e: any) {
      this.plan = { ...this.plan, problems: [this.err(e, 'It could not be settled.')] };
    }
    this.busy = false; this.cd.detectChanges();
  }
}
