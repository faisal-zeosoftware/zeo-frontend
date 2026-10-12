/**
 * v1.18.0 Shift planner – On-call duty (hospital standby / on-site cover). HR, roster planners and managers plan on-call
 * duty for an employee; the manager or HR of the branch approves it (never the person who planned it). Approved duties are
 * paid by payroll through the formula figures on_call_days, on_call_hours and on_call_callout_hours.
 * API: on-call/?from&to&employee&status (GET, POST), on-call/<id>/ (PATCH, DELETE), on-call/<id>/approve|reject/ (POST)
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZListDirective } from '../shared-ui/z-list.directive';   // v1.22.0 HRMS list (Branch filter …)
import { SpApiService, niceDate } from './sp-api.service';

@Component({
  selector: 'app-sp-on-call',
  standalone: true,
  imports: [CommonModule, FormsModule, ZListDirective],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section"><div class="lp-head"><div>
      <h1 class="page-title">On-call duty</h1>
      <p class="lp-desc">Standby and on-site cover outside the roster. Approved duty is paid with the payroll of the month (on-call days, hours and hours called in).</p>
    </div></div></div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>
      <div class="sp-bar">
        <label>From<input type="date" [(ngModel)]="from" (change)="load()"></label>
        <label>To<input type="date" [(ngModel)]="to" (change)="load()"></label>
        <select [(ngModel)]="status" (change)="load()" aria-label="Status">
          <option value="">Any status</option><option value="pending">Waiting for approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
        </select>
        <select [(ngModel)]="filter" (change)="load()" aria-label="Employee"><option [ngValue]="null">All employees</option><option *ngFor="let e of emps" [ngValue]="e.employee_id">{{ e.name }}</option></select>
      </div>
      <div class="oc-sum" *ngIf="rows.length">
        <div><b>{{ count('approved') }}</b><span>approved</span></div>
        <div><b>{{ count('pending') }}</b><span>waiting</span></div>
        <div><b>{{ hours() }}</b><span>hours on call</span></div>
        <div><b>{{ called() }}</b><span>hours called in</span></div>
      </div>
      <div class="lp-scroll" *ngIf="rows.length">
        <table class="lp-mini">
          <thead><tr><th>Employee</th><th>Date</th><th>Type</th><th>Time</th><th class="num">Hours</th><th class="num">Called in</th><th>Status</th><th>Note</th><th></th></tr></thead>
          <tbody><tr *ngFor="let o of rows">
            <td>{{ o.employee }}<div class="lp-muted">{{ o.department }}</div></td>
            <td>{{ nice(o.date) }}</td>
            <td>{{ o.kind_label }}</td>
            <td>{{ o.start_time || '–' }}<ng-container *ngIf="o.end_time"> – {{ o.end_time }}</ng-container></td>
            <td class="num">{{ o.hours }}</td><td class="num">{{ o.callout_hours || '–' }}</td>
            <td><span class="oc-st" [attr.data-s]="o.status">{{ o.status_label }}</span><div class="lp-muted" *ngIf="o.decision_note">{{ o.decision_note }}</div></td>
            <td>{{ o.note }}</td>
            <td class="oc-act">
              <ng-container *ngIf="o.can_decide">
                <button type="button" class="lp-btn primary sm" (click)="decide(o, 'approve')">Approve</button>
                <button type="button" class="lp-btn sm" (click)="rejecting = o.id">Reject</button>
              </ng-container>
              <button type="button" class="lp-x" *ngIf="o.can_edit" (click)="remove(o)" aria-label="Delete">×</button>
              <div *ngIf="rejecting === o.id" class="oc-rej">
                <input [(ngModel)]="reason" placeholder="Reason" aria-label="Reason for rejecting">
                <button type="button" class="lp-btn sm" (click)="decide(o, 'reject')">Reject</button>
              </div>
            </td></tr></tbody>
        </table>
      </div>
      <p class="lp-muted" *ngIf="!rows.length">No on-call duty in this period.</p>
      <ng-container *ngIf="canPlan">
        <div class="sp-h">Plan on-call duty</div>
        <div class="lp-form">
          <label>Employee<select [(ngModel)]="f.employee"><option [ngValue]="null">Choose…</option><option *ngFor="let e of emps" [ngValue]="e.employee_id">{{ e.name }}</option></select></label>
          <label>Date<input type="date" [(ngModel)]="f.date"><span class="sp-err" *ngIf="err['date']">{{ err['date'] }}</span></label>
          <label>Type<select [(ngModel)]="f.kind"><option value="standby">Standby (at home, reachable)</option><option value="on_site">On site</option></select></label>
          <label>From<input type="time" [(ngModel)]="f.start_time"><span class="sp-err" *ngIf="err['start_time']">{{ err['start_time'] }}</span></label>
          <label>To<input type="time" [(ngModel)]="f.end_time"><span class="sp-err" *ngIf="err['end_time']">{{ err['end_time'] }}</span></label>
          <label>Hours<input type="number" min="0" max="24" step="0.5" [(ngModel)]="f.hours" placeholder="From the times"><span class="sp-err" *ngIf="err['hours']">{{ err['hours'] }}</span></label>
          <label>Hours called in<input type="number" min="0" max="24" step="0.5" [(ngModel)]="f.callout_hours"><span class="sp-err" *ngIf="err['callout_hours']">{{ err['callout_hours'] }}</span></label>
          <label>Note<input [(ngModel)]="f.note" maxlength="255"></label>
        </div>
        <button type="button" class="lp-btn primary" [disabled]="!f.employee || !f.date" (click)="add()">Plan on-call duty</button>
      </ng-container>
    </div>
  </div>
</div>`,
  styles: [`
.oc-sum{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 12px}
.oc-sum div{border:1px solid #e3e6ea;border-radius:8px;padding:8px 14px;min-width:110px;background:#fff}
.oc-sum b{display:block;font-size:20px}.oc-sum span{font-size:12px;color:#5d6670}
.oc-st{font-size:12px;padding:2px 8px;border-radius:10px;background:#eef1f4;white-space:nowrap}
.oc-st[data-s=approved]{background:#e5f4ea;color:#1d6b37}.oc-st[data-s=rejected]{background:#fdeceb;color:#9b2c24}.oc-st[data-s=pending]{background:#fff4dc;color:#7a5600}
.oc-act{white-space:nowrap}.oc-act .lp-btn.sm{padding:3px 10px;font-size:12px;margin-right:4px}
.oc-rej{display:flex;gap:4px;margin-top:4px}.oc-rej input{min-width:140px}
td.num,th.num{text-align:right}
`],
})
export class SpOnCallComponent implements OnInit {
  rows: any[] = []; emps: any[] = [];
  filter: number | null = null; status = ''; from = ''; to = '';
  canPlan = false; rejecting: number | null = null; reason = '';
  f: any = { employee: null, date: '', kind: 'standby', start_time: '20:00', end_time: '08:00', hours: null, callout_hours: 0, note: '' };
  err: Record<string, string> = {};
  msg = ''; msgErr = false;
  nice = niceDate;
  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}
  async ngOnInit(): Promise<void> {
    const d = new Date(); const y = d.getFullYear(); const m = d.getMonth();
    const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    this.from = iso(new Date(y, m - 1, 1)); this.to = iso(new Date(y, m + 1, 0));
    const t: any = await this.api.get('team-schedule/').catch(() => ({ rows: [] }));
    this.emps = t.rows || [];
    await this.load();
  }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }
  count(s: string): number { return this.rows.filter(r => r.status === s).length; }
  hours(): number { return Math.round(this.rows.filter(r => r.status === 'approved').reduce((a, r) => a + (+r.hours || 0), 0) * 100) / 100; }
  called(): number { return Math.round(this.rows.filter(r => r.status === 'approved').reduce((a, r) => a + (+r.callout_hours || 0), 0) * 100) / 100; }
  async load(): Promise<void> {
    try {
      const r: any = await this.api.get('on-call/', { from: this.from, to: this.to, employee: this.filter, status: this.status });
      this.rows = r.rows || []; this.canPlan = !!r.can_plan;
    } catch (e) { this.say(SpApiService.error(e), true); }
    this.cd.markForCheck();
  }
  async add(): Promise<void> {
    const b: any = { ...this.f }; if (b.hours === null || b.hours === '') delete b.hours;
    try { await this.api.post('on-call/', b); this.err = {}; this.say('On-call duty planned – it now waits for approval.'); this.f = { ...this.f, date: '', note: '', callout_hours: 0 }; await this.load(); }
    catch (e) { this.err = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
  }
  async decide(o: any, action: 'approve' | 'reject'): Promise<void> {
    try {
      await this.api.post(`on-call/${o.id}/${action}/`, { note: action === 'reject' ? this.reason : '' });
      this.rejecting = null; this.reason = '';
      this.say(action === 'approve' ? 'On-call duty approved.' : 'On-call duty rejected.'); await this.load();
    } catch (e) { this.say(SpApiService.error(e), true); }
  }
  async remove(o: any): Promise<void> { try { await this.api.delete(`on-call/${o.id}/`); this.say('On-call duty deleted.'); await this.load(); } catch (e) { this.say(SpApiService.error(e), true); } }
}
