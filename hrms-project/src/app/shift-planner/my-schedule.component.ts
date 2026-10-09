/**
 * v1.12.0 Shift planner – My schedule (ESS / mobile). Every employee sees their published shifts day by day with leave and
 * public holidays, and can ask for a shift change, cancellation or swap, claim open shifts, answer swap requests from
 * colleagues, set their availability and read shift notices.
 * API: my-schedule/?from&to, team-schedule/?from&to (colleagues), requests/, requests/<id>/<action>/, open-shifts/<id>/claim/,
 *      claims/<id>/withdraw/, availability/, notices/
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, addDays, isoDate, niceDate, WEEKDAYS } from './sp-api.service';

@Component({
  selector: 'app-sp-my-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">My schedule</h1>
          <p class="lp-desc">Your published shifts, leave and public holidays. Ask for a change, a cancellation or a swap, claim an open shift and tell your manager when you are not available.</p>
        </div>
        <div class="lp-actions">
          <button type="button" class="lp-btn" (click)="move(-14)" aria-label="Previous two weeks">‹ Earlier</button>
          <input type="date" [(ngModel)]="from" (change)="load()" aria-label="Show from" style="height:34px;border:1px solid #dcdfea;border-radius:8px;padding:0 8px">
          <button type="button" class="lp-btn" (click)="move(14)" aria-label="Next two weeks">Later ›</button>
        </div>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>
      <p class="lp-muted" *ngIf="loading">Loading your schedule…</p>

      <ng-container *ngIf="data">
        <div class="sp-days">
          <div class="sp-day" *ngFor="let d of data.days" [class.off]="d.off || !d.planned" [class.leave]="d.leave" [class.hol]="d.holiday"
               [style.borderLeftColor]="!d.off && d.colour && !d.leave ? d.colour : null">
            <div class="when"><b>{{ d.date | date:'dd' }}</b><small>{{ d.date | date:'EEE, MMM' }}</small></div>
            <div class="what">
              <b>{{ d.shift }}</b>
              <div *ngIf="d.start">{{ d.start }} – {{ d.end }}<span *ngIf="d.next_day"> (next day)</span> · {{ d.hours }} h<span *ngIf="d.break_minutes"> · break {{ d.break_minutes }} min</span><span *ngIf="d.night"> · night shift</span></div>
              <div class="note" *ngIf="d.leave">{{ d.leave.type }} – leave {{ d.leave.status }}</div>
              <div class="note" *ngIf="d.holiday">Public holiday</div>
              <div class="pend" *ngFor="let r of d.requests">{{ r.kind }}: {{ r.status }}</div>
            </div>
            <div class="acts" *ngIf="d.date >= today && !d.leave && !d.requests.length">
              <button type="button" class="lp-btn" (click)="ask('change', d)">Change</button>
              <button type="button" class="lp-btn" *ngIf="d.planned && !d.off" (click)="ask('cancel', d)">Cancel shift</button>
              <button type="button" class="lp-btn" (click)="ask('swap', d)">Swap</button>
            </div>
          </div>
        </div>

        <div class="sp-h">Open shifts you can claim</div>
        <p class="lp-muted" *ngIf="!data.open_shifts.length">No open shifts for your branch right now.</p>
        <div class="sp-cards">
          <div class="sp-card" *ngFor="let o of data.open_shifts">
            <h3>{{ nice(o.date) }}</h3>
            <div>{{ o.shift }} · {{ o.department }}</div>
            <div class="lp-muted">{{ o.left }} of {{ o.slots }} place(s) left<span *ngIf="o.note"> · {{ o.note }}</span></div>
            <div style="margin-top:8px" class="sp-row-actions">
              <button type="button" class="lp-btn primary" *ngIf="o.can_claim" (click)="claim(o)">Claim this shift</button>
              <span class="sp-tag" [ngClass]="o.my_claim.status" *ngIf="o.my_claim">Your claim: {{ o.my_claim.status_label }}</span>
            </div>
          </div>
        </div>

        <div class="sp-h">My requests</div>
        <p class="lp-muted" *ngIf="!data.requests.length">You have no shift requests.</p>
        <div class="lp-scroll" *ngIf="data.requests.length">
          <table class="lp-mini">
            <thead><tr><th>Request</th><th>Day</th><th>Details</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of data.requests">
                <td>{{ r.kind_label }}<div class="lp-muted" *ngIf="r.swap_employee_id === data.employee.id">from {{ r.employee }}</div></td>
                <td>{{ nice(r.date) }}</td>
                <td>{{ r.from_shift }}<span *ngIf="r.to_shift"> → {{ r.to_shift }}</span><span *ngIf="r.kind === 'swap'"> ⇄ {{ r.swap_employee }} ({{ r.swap_shift }}, {{ nice(r.swap_date) }})</span>
                  <div class="lp-muted" *ngIf="r.decision_note">{{ r.decision_note }}</div></td>
                <td><span class="sp-tag" [ngClass]="r.status">{{ r.status_label }}</span></td>
                <td class="sp-row-actions">
                  <button type="button" class="lp-btn primary" *ngIf="r.can.accept" (click)="act(r, 'accept')">Accept swap</button>
                  <button type="button" class="lp-btn danger" *ngIf="r.can.accept" (click)="act(r, 'decline')">Decline</button>
                  <button type="button" class="lp-btn" *ngIf="r.can.withdraw" (click)="act(r, 'withdraw')">Withdraw</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sp-h">My availability</div>
        <p class="lp-muted">Tell your planner when you cannot work or which shift you prefer. Rosters show a warning when they plan you against it.</p>
        <div class="lp-scroll" *ngIf="data.availability.length">
          <table class="lp-mini">
            <thead><tr><th>When</th><th>Availability</th><th>Shift</th><th>Note</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let a of data.availability">
                <td>{{ a.weekday_label ? 'Every ' + a.weekday_label : nice(a.date_from) + (a.date_to && a.date_to !== a.date_from ? ' – ' + nice(a.date_to) : '') }}</td>
                <td>{{ a.kind_label }}</td><td>{{ shiftName(a.shift_id) }}</td><td>{{ a.note }}</td>
                <td><button type="button" class="lp-x" (click)="removeAvail(a)" aria-label="Remove availability">×</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="lp-form">
          <label>Availability<select [(ngModel)]="av.kind"><option value="unavailable">Not available</option><option value="preferred">Preferred</option><option value="available">Available</option></select></label>
          <label>Repeats on<select [(ngModel)]="av.weekday"><option [ngValue]="null">Dates below</option><option *ngFor="let w of weekdays; let i = index" [ngValue]="i">Every {{ w }}</option></select>
            <span class="sp-err" *ngIf="avErr['weekday']">{{ avErr['weekday'] }}</span></label>
          <label *ngIf="av.weekday === null">From<input type="date" [(ngModel)]="av.date_from"></label>
          <label *ngIf="av.weekday === null">To<input type="date" [(ngModel)]="av.date_to"><span class="sp-err" *ngIf="avErr['date_to']">{{ avErr['date_to'] }}</span></label>
          <label>Shift (optional)<select [(ngModel)]="av.shift"><option [ngValue]="null">Any shift</option><option *ngFor="let s of data.shifts" [ngValue]="s.id">{{ s.name }}</option></select></label>
          <label>Note<input [(ngModel)]="av.note" maxlength="255" placeholder="e.g. Evening classes"></label>
        </div>
        <button type="button" class="lp-btn primary" (click)="addAvail()">Save availability</button>

        <div class="sp-h">Shift notices <button type="button" class="lp-btn" style="height:28px;margin-left:8px" *ngIf="unread()" (click)="readAll()">Mark all read</button></div>
        <p class="lp-muted" *ngIf="!data.notices.length">No notices yet.</p>
        <div class="sp-notice" *ngFor="let n of data.notices" [class.unread]="!n.read"><b>{{ n.title }}</b> · <span class="lp-muted">{{ n.created_at | date:'d MMM, HH:mm' }}</span><div>{{ n.message }}</div></div>
      </ng-container>
    </div>
  </div>

  <!-- request dialog -->
  <div class="lp-modal-back" *ngIf="req" (click)="req = null">
    <div class="lp-modal" style="width:min(520px,100%)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="reqTitle()">
      <header><h2>{{ reqTitle() }} – {{ nice(req.date) }}</h2><button type="button" class="lp-x" (click)="req = null" aria-label="Close">×</button></header>
      <div class="body">
        <p class="lp-muted" style="margin-top:0">Today you are planned on: <b>{{ req.day.shift }}</b><span *ngIf="req.day.start"> ({{ req.day.start }} – {{ req.day.end }})</span>.</p>
        <div class="lp-form" style="margin-top:6px">
          <label *ngIf="req.kind === 'change'">New shift
            <select [(ngModel)]="req.to_shift"><option [ngValue]="null">Choose…</option><option *ngFor="let s of data.shifts" [ngValue]="s.id">{{ s.name }}</option></select>
            <span class="sp-err" *ngIf="reqErr['to_shift']">{{ reqErr['to_shift'] }}</span></label>
          <ng-container *ngIf="req.kind === 'swap'">
            <label>Colleague's day<input type="date" [(ngModel)]="req.swap_date" (change)="loadColleagues()"></label>
            <label>Swap with
              <select [(ngModel)]="req.swap_employee"><option [ngValue]="null">Choose a colleague…</option>
                <option *ngFor="let c of colleagues" [ngValue]="c.employee_id">{{ c.name }} – {{ c.shift }}</option></select>
              <span class="sp-err" *ngIf="reqErr['swap_employee']">{{ reqErr['swap_employee'] }}</span></label>
          </ng-container>
          <label class="wide">Reason{{ req.kind === 'cancel' ? '' : ' (optional)' }}<input [(ngModel)]="req.reason" maxlength="255" placeholder="Tell your manager why">
            <span class="sp-err" *ngIf="reqErr['reason']">{{ reqErr['reason'] }}</span></label>
        </div>
        <p class="lp-muted" *ngIf="req.kind === 'swap'">Your colleague must accept first, then your manager approves.</p>
        <div class="lp-msg err" *ngIf="reqMsg" style="white-space:pre-line">{{ reqMsg }}</div>
      </div>
      <footer><button type="button" class="lp-btn" (click)="req = null">Close</button><button type="button" class="lp-btn primary" [disabled]="busy" (click)="sendReq()">Send request</button></footer>
    </div>
  </div>
</div>`,
})
export class SpMyScheduleComponent implements OnInit {
  data: any = null;
  loading = false;
  msg = ''; msgErr = false;
  today = isoDate(new Date());
  from = isoDate(new Date());
  weekdays = WEEKDAYS;
  av: any = { kind: 'unavailable', weekday: null, date_from: '', date_to: '', shift: null, note: '' };
  avErr: Record<string, string> = {};
  req: any = null; reqErr: Record<string, string> = {}; reqMsg = ''; busy = false;
  colleagues: any[] = [];
  nice = niceDate;

  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.api.get('my-schedule/', { from: this.from, to: addDays(this.from, 13) });
    } catch (e) { this.say(SpApiService.error(e, 'Your schedule could not be loaded.'), true); }
    this.loading = false;
    this.cd.markForCheck();
  }
  move(n: number): void { this.from = addDays(this.from, n); this.load(); }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; }
  shiftName(id: number | null): string { if (!id) return 'Any'; return this.data?.shifts?.find((s: any) => s.id === id)?.name || '–'; }
  unread(): boolean { return (this.data?.notices || []).some((n: any) => !n.read); }

  ask(kind: string, d: any): void {
    this.req = { kind, date: d.date, day: d, to_shift: null, swap_employee: null, swap_date: d.date, reason: '' };
    this.reqErr = {}; this.reqMsg = '';
    if (kind === 'swap') this.loadColleagues();
  }
  reqTitle(): string { return this.req?.kind === 'change' ? 'Ask for another shift' : this.req?.kind === 'cancel' ? 'Ask to cancel the shift' : 'Ask a colleague to swap'; }
  async loadColleagues(): Promise<void> {
    try {
      const r: any = await this.api.get('team-schedule/', { from: this.req.swap_date, to: this.req.swap_date });
      this.colleagues = (r.rows || []).map((x: any) => ({ employee_id: x.employee_id, name: x.name, shift: x.days?.[0]?.shift || '' }));
    } catch { this.colleagues = []; }
    this.cd.markForCheck();
  }
  async sendReq(): Promise<void> {
    const r = this.req;
    const body: any = { kind: r.kind, date: r.date, reason: r.reason };
    if (r.kind === 'change') body.to_shift = r.to_shift;
    if (r.kind === 'swap') { body.swap_employee = r.swap_employee; body.swap_date = r.swap_date; }
    this.busy = true;
    try {
      await this.api.post('requests/', body);
      this.req = null;
      this.say(r.kind === 'swap' ? 'Swap request sent to your colleague.' : 'Request sent to your manager.');
      await this.load();
    } catch (e) { this.reqErr = SpApiService.fieldErrors(e); this.reqMsg = SpApiService.error(e); }
    this.busy = false;
    this.cd.markForCheck();
  }
  async act(r: any, action: string): Promise<void> {
    const note = action === 'decline' ? (prompt('Why do you decline? (optional)') || '') : '';
    try { await this.api.post(`requests/${r.id}/${action}/`, { note }); this.say('Done.'); await this.load(); }
    catch (e) { this.say(SpApiService.error(e), true); }
  }
  async claim(o: any): Promise<void> {
    try { await this.api.post(`open-shifts/${o.id}/claim/`, {}); this.say('Claim sent – your manager will approve or reject it.'); await this.load(); }
    catch (e) { this.say(SpApiService.error(e), true); }
  }
  async addAvail(): Promise<void> {
    const b: any = { ...this.av };
    if (b.weekday !== null) { b.date_from = ''; b.date_to = ''; }
    try {
      await this.api.post('availability/', b);
      this.avErr = {};
      this.av = { kind: 'unavailable', weekday: null, date_from: '', date_to: '', shift: null, note: '' };
      this.say('Availability saved.');
      await this.load();
    } catch (e) { this.avErr = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
  }
  async removeAvail(a: any): Promise<void> {
    try { await this.api.delete(`availability/${a.id}/`); await this.load(); } catch (e) { this.say(SpApiService.error(e), true); }
  }
  async readAll(): Promise<void> { try { await this.api.post('notices/', {}); await this.load(); } catch { /* ignore */ } }
}
