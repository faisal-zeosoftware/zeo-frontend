/**
 * v1.12.0 Shift planner – Requests and open shifts (managers and HR).
 *  - Requests: shift swaps (after the colleague accepted), shift changes and cancellations of the user's team (reporting
 *    manager) or branches (HR) – approve or reject; HR can raise a request for an employee.
 *  - Open shifts: HR posts an unfilled shift (date, shift, branch, department, places); employees claim it in My schedule;
 *    managers / HR approve a claim, which plans the shift for the employee. Leave on the day is refused.
 * API: requests/?scope&status, requests/<id>/<approve|reject>/, open-shifts/, open-shifts/<id>/cancel/, claims/<id>/<approve|reject>/,
 *      shift-master/?active=1, meta/, team-schedule/ (employee list for HR)
 */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpApiService, SpMeta, isoDate, niceDate } from './sp-api.service';

@Component({
  selector: 'app-sp-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './shift-planner.css'],
  template: `
<div class="container sp-wrap">
  <div class="comapny_section">
    <div class="header_section">
      <div class="lp-head">
        <div>
          <h1 class="page-title">Shift requests &amp; open shifts</h1>
          <p class="lp-desc">Approve shift swaps, changes and cancellations of your team, and fill open shifts. Approved requests update the published roster (or the day's shift override) so attendance and payroll follow.</p>
        </div>
        <div class="lp-actions"><button type="button" class="lp-btn primary" *ngIf="tab === 'open' && meta?.rights?.manage && !osForm" (click)="newOpen()">+ Post open shift</button></div>
      </div>
      <div class="lp-tabs">
        <button type="button" [class.on]="tab === 'wait'" (click)="setTab('wait')">Waiting for me</button>
        <button type="button" [class.on]="tab === 'all'" (click)="setTab('all')">All requests</button>
        <button type="button" [class.on]="tab === 'open'" (click)="setTab('open')">Open shifts</button>
      </div>
    </div>
    <div class="com_list mt-4">
      <div class="lp-msg" *ngIf="msg" [class.err]="msgErr" role="status" style="white-space:pre-line">{{ msg }}</div>

      <ng-container *ngIf="tab !== 'open'">
        <div class="sp-bar" *ngIf="tab === 'all'">
          <select [(ngModel)]="status" (change)="load()" aria-label="Status"><option value="">All statuses</option><option value="peer">Waiting for colleague</option><option value="pending">Waiting for approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="declined">Declined</option><option value="withdrawn">Withdrawn</option></select>
          <select [(ngModel)]="kind" (change)="load()" aria-label="Kind"><option value="">All kinds</option><option value="swap">Swaps</option><option value="change">Changes</option><option value="cancel">Cancellations</option></select>
        </div>
        <p class="lp-muted" *ngIf="!reqs.length && !claims.length">{{ tab === 'wait' ? 'Nothing is waiting for you.' : 'No requests.' }}</p>
        <div class="lp-scroll" *ngIf="reqs.length">
          <table class="lp-mini">
            <thead><tr><th>Employee</th><th>Request</th><th>Day</th><th>Details</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of reqs">
                <td>{{ r.employee }}</td><td>{{ r.kind_label }}</td><td>{{ nice(r.date) }}</td>
                <td>{{ r.from_shift }}<span *ngIf="r.to_shift"> → {{ r.to_shift }}</span><span *ngIf="r.kind === 'swap'"> ⇄ {{ r.swap_employee }} ({{ r.swap_shift }}, {{ nice(r.swap_date) }})</span></td>
                <td>{{ r.reason }}</td>
                <td><span class="sp-tag" [ngClass]="r.status">{{ r.status_label }}</span><div class="lp-muted" *ngIf="r.decided_by">{{ r.decided_by }} – {{ r.decision_note }}</div></td>
                <td class="sp-row-actions" *ngIf="r.can.approve">
                  <button type="button" class="lp-btn primary" (click)="decide('requests', r, 'approve')">Approve</button>
                  <button type="button" class="lp-btn danger" (click)="decide('requests', r, 'reject')">Reject</button></td>
                <td *ngIf="!r.can.approve"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-container *ngIf="claims.length">
          <div class="sp-h">Open-shift claims</div>
          <div class="lp-scroll"><table class="lp-mini">
            <thead><tr><th>Employee</th><th>Open shift</th><th>Places left</th><th>Note</th><th>Status</th><th></th></tr></thead>
            <tbody><tr *ngFor="let c of claims">
              <td>{{ c.employee }}</td><td>{{ nice(c.os.date) }} · {{ c.os.shift }}</td><td>{{ c.os.left }} of {{ c.os.slots }}</td><td>{{ c.note }}</td>
              <td><span class="sp-tag" [ngClass]="c.status">{{ c.status_label }}</span></td>
              <td class="sp-row-actions"><ng-container *ngIf="c.can_decide">
                <button type="button" class="lp-btn primary" (click)="decide('claims', c, 'approve')">Approve</button>
                <button type="button" class="lp-btn danger" (click)="decide('claims', c, 'reject')">Reject</button></ng-container></td>
            </tr></tbody></table></div>
        </ng-container>
      </ng-container>

      <ng-container *ngIf="tab === 'open'">
        <div class="sp-panel" *ngIf="osForm">
          <h2>Post an open shift</h2>
          <p class="lp-muted" style="margin:0">Employees of the branch (and department) are told and can claim it in My schedule.</p>
          <div class="lp-form">
            <label>Day<input type="date" [(ngModel)]="osForm.date" [min]="today"><span class="sp-err" *ngIf="err['date']">{{ err['date'] }}</span></label>
            <label>Shift<select [(ngModel)]="osForm.shift"><option [ngValue]="null">Choose…</option><option *ngFor="let s of shifts" [ngValue]="s.id">{{ s.name }}</option></select><span class="sp-err" *ngIf="err['shift']">{{ err['shift'] }}</span></label>
            <label>Branch<select [(ngModel)]="osForm.branch"><option [ngValue]="null">Choose…</option><option *ngFor="let b of meta?.branches" [ngValue]="b.id">{{ b.branch_name }}</option></select><span class="sp-err" *ngIf="err['branch']">{{ err['branch'] }}</span></label>
            <label>Department<select [(ngModel)]="osForm.department"><option [ngValue]="null">Any department</option><option *ngFor="let d of meta?.departments" [ngValue]="d.id">{{ d.dept_name }}</option></select></label>
            <label>People needed<input type="number" min="1" max="100" [(ngModel)]="osForm.slots"><span class="sp-err" *ngIf="err['slots']">{{ err['slots'] }}</span></label>
            <label class="wide">Note<input [(ngModel)]="osForm.note" maxlength="255" placeholder="e.g. Stock count"></label>
          </div>
          <div class="lp-foot"><button type="button" class="lp-btn" (click)="osForm = null">Cancel</button><button type="button" class="lp-btn primary" (click)="saveOpen()">Post and notify</button></div>
        </div>
        <p class="lp-muted" *ngIf="!opens.length">No open shifts.</p>
        <div class="sp-cards">
          <div class="sp-card" *ngFor="let o of opens">
            <h3>{{ nice(o.date) }} <span class="sp-tag" [ngClass]="o.status">{{ o.status_label }}</span></h3>
            <div>{{ o.shift }}</div><div class="lp-muted">{{ o.branch }} · {{ o.department }} · {{ o.filled }} of {{ o.slots }} filled</div>
            <div class="lp-muted" *ngIf="o.note">{{ o.note }}</div>
            <div *ngFor="let c of o.claims" style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              <span>{{ c.employee }}</span><span class="sp-tag" [ngClass]="c.status">{{ c.status_label }}</span>
              <ng-container *ngIf="c.can_decide"><button type="button" class="lp-btn primary" style="height:26px" (click)="decide('claims', c, 'approve')">Approve</button>
                <button type="button" class="lp-btn danger" style="height:26px" (click)="decide('claims', c, 'reject')">Reject</button></ng-container>
            </div>
            <div style="margin-top:8px" *ngIf="o.can_manage && o.status === 'open'"><button type="button" class="lp-btn danger" (click)="cancelOpen(o)">Cancel open shift</button></div>
          </div>
        </div>
      </ng-container>
    </div>
  </div>
</div>`,
})
export class SpRequestsComponent implements OnInit {
  meta: SpMeta | null = null;
  tab: 'wait' | 'all' | 'open' = 'wait';
  status = ''; kind = '';
  reqs: any[] = []; claims: any[] = []; opens: any[] = []; shifts: any[] = [];
  osForm: any = null; err: Record<string, string> = {};
  msg = ''; msgErr = false;
  today = isoDate(new Date());
  nice = niceDate;

  constructor(private api: SpApiService, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try { this.meta = await this.api.meta(); } catch (e) { this.say(SpApiService.error(e), true); }
    this.shifts = await this.api.get('shift-master/', { active: 1 }).catch(() => []);
    await this.load();
  }
  say(m: string, err = false): void { this.msg = m; this.msgErr = err; this.cd.markForCheck(); }
  setTab(t: 'wait' | 'all' | 'open'): void { this.tab = t; this.msg = ''; this.load(); }
  async load(): Promise<void> {
    try {
      if (this.tab === 'open') {
        this.opens = await this.api.get('open-shifts/');
      } else {
        const st = this.tab === 'wait' ? 'pending' : this.status;
        const rows: any[] = await this.api.get('requests/', { status: st, kind: this.tab === 'all' ? this.kind : '' });
        this.reqs = this.tab === 'wait' ? rows.filter(r => r.can.approve) : rows;
        const os: any[] = await this.api.get('open-shifts/', this.tab === 'wait' ? { status: 'open' } : {});
        this.claims = [];
        os.forEach(o => o.claims.forEach((c: any) => { if (this.tab === 'all' || c.can_decide) this.claims.push({ ...c, os: o }); }));
      }
    } catch (e) { this.say(SpApiService.error(e), true); }
    this.cd.markForCheck();
  }
  async decide(what: 'requests' | 'claims', x: any, action: 'approve' | 'reject'): Promise<void> {
    let note = '';
    if (action === 'reject') { note = prompt('Why is it rejected? The employee sees this note.') || ''; if (!note && what === 'requests') return; }
    try { await this.api.post(`${what}/${x.id}/${action}/`, { note }); this.say(action === 'approve' ? 'Approved – the schedule was updated and the employee told.' : 'Rejected – the employee was told.'); await this.load(); }
    catch (e) { this.say(SpApiService.error(e), true); }
  }
  newOpen(): void { this.osForm = { date: this.today, shift: null, branch: this.meta?.branches?.length === 1 ? this.meta.branches[0].id : null, department: null, slots: 1, note: '' }; this.err = {}; }
  async saveOpen(): Promise<void> {
    try { const r: any = await this.api.post('open-shifts/', this.osForm); this.osForm = null; this.say(`Open shift posted. ${r.notified} employee(s) were told.`); await this.load(); }
    catch (e) { this.err = SpApiService.fieldErrors(e); this.say(SpApiService.error(e), true); }
  }
  async cancelOpen(o: any): Promise<void> {
    if (!confirm('Cancel this open shift? Employees who claimed it are told.')) return;
    try { await this.api.post(`open-shifts/${o.id}/cancel/`, {}); this.say('Open shift cancelled.'); await this.load(); } catch (e) { this.say(SpApiService.error(e), true); }
  }
}
