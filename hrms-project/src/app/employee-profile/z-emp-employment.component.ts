import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeProfileService, STATUS_LABEL } from './employee-profile.service';

/**
 * v1.13.0 – "Employment" tab: one employment status (active, on probation, on notice, left, terminated, absconded,
 * retired) with the date of leaving, the probation (end date from the employment type or the branch, extensions,
 * decisions) and the actions Confirm / Extend / Not passed. Resignations and end of service update it by themselves.
 */
@Component({
  selector: 'z-emp-employment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep" *ngIf="d">
  <div class="ep-note err" *ngIf="error">{{ error }}</div>
  <div class="ep-note" *ngIf="warning">{{ warning }}</div>
  <div class="ep-kpis">
    <div class="ep-kpi"><small>Employment status</small><span class="ep-tag" [ngClass]="statusClass(d.status)">{{ d.status_label }}</span></div>
    <div class="ep-kpi"><small>Joining date</small><b>{{ fmt(d.joined_date) }}</b></div>
    <div class="ep-kpi"><small>Probation</small><b>{{ d.probation_status_label }}</b>
      <div class="lp-muted" *ngIf="d.days_left !== null">{{ d.days_left < 0 ? 'ended ' + (-d.days_left) + ' days ago – decide now' : d.days_left + ' days left' }}</div></div>
    <div class="ep-kpi"><small>{{ d.probation_status === 'confirmed' ? 'Confirmed on' : 'Probation ends' }}</small>
      <b>{{ fmt(d.probation_status === 'confirmed' ? d.confirmed_on : d.probation_end_date) || '–' }}</b>
      <div class="lp-muted" *ngIf="d.probation_days && d.probation_source !== 'manual'">{{ d.probation_days }} days ({{ d.probation_source === 'employment_type' ? 'employment type' : 'branch' }})</div></div>
    <div class="ep-kpi" *ngIf="d.date_of_leaving"><small>Date of leaving</small><b>{{ fmt(d.date_of_leaving) }}</b><div class="lp-muted">{{ d.leaving_reason }}</div></div>
  </div>

  <div class="ep-actions" *ngIf="canEdit && !readonly && !mode">
    <ng-container *ngIf="d.can_decide">
      <button type="button" class="lp-btn primary" (click)="start('confirm')">Confirm employee</button>
      <button type="button" class="lp-btn" (click)="start('extend')">Extend probation</button>
      <button type="button" class="lp-btn danger" (click)="start('fail')">Probation not passed</button>
    </ng-container>
    <button type="button" class="lp-btn" (click)="start('status')">Change status / date of leaving</button>
  </div>

  <div class="ep-row-form" *ngIf="mode">
    <ng-container [ngSwitch]="mode">
      <div *ngSwitchCase="'confirm'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['date']"><span>Confirmation date</span><input type="date" [(ngModel)]="f.date"><small class="err" *ngIf="ferr['date']">{{ ferr['date'] }}</small></label>
        <label class="ep-f"><span>Note (optional)</span><input type="text" [(ngModel)]="f.note"></label>
      </div>
      <div *ngSwitchCase="'extend'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['to_date']"><span>New end date *</span><input type="date" [(ngModel)]="f.to_date" [max]="d.limits?.max_end_date">
          <small class="hint">UAE law allows at most 6 months in total – latest {{ fmt(d.limits?.max_end_date) }}.</small><small class="err" *ngIf="ferr['to_date']">{{ ferr['to_date'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['reason']"><span>Reason *</span><input type="text" [(ngModel)]="f.reason"><small class="err" *ngIf="ferr['reason']">{{ ferr['reason'] }}</small></label>
      </div>
      <div *ngSwitchCase="'fail'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['last_day']"><span>Last working day</span><input type="date" [(ngModel)]="f.last_day">
          <small class="hint">Leave empty for 14 days from today (the written notice UAE law asks for).</small><small class="err" *ngIf="ferr['last_day']">{{ ferr['last_day'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['reason']"><span>Reason *</span><input type="text" [(ngModel)]="f.reason"><small class="err" *ngIf="ferr['reason']">{{ ferr['reason'] }}</small></label>
      </div>
      <div *ngSwitchCase="'status'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['status']"><span>Status</span>
          <select [(ngModel)]="f.status"><option *ngFor="let s of statuses" [ngValue]="s.v">{{ s.l }}</option></select><small class="err" *ngIf="ferr['status']">{{ ferr['status'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['date_of_leaving']" *ngIf="leaving(f.status)"><span>Date of leaving (last working day) *</span><input type="date" [(ngModel)]="f.date_of_leaving">
          <small class="err" *ngIf="ferr['date_of_leaving']">{{ ferr['date_of_leaving'] }}</small></label>
        <label class="ep-f" *ngIf="leaving(f.status)"><span>Reason</span><input type="text" [(ngModel)]="f.leaving_reason"></label>
      </div>
    </ng-container>
    <div class="ep-actions">
      <button type="button" class="lp-btn primary" [disabled]="saving" (click)="submit()">{{ saving ? 'Saving…' : label() }}</button>
      <button type="button" class="lp-btn" (click)="mode = null">Cancel</button>
    </div>
  </div>

  <div class="ep-sec" style="margin-top:14px" *ngIf="d.extensions?.length || d.decision_note">
    <h3>Probation decisions</h3>
    <table class="ep-table" zPlain>
      <thead><tr><th>Date</th><th>Decision</th><th>Details</th><th>By</th></tr></thead>
      <tbody>
        <tr *ngFor="let x of d.extensions"><td>{{ fmt(x.created_at?.slice(0, 10)) }}</td><td>Extended</td><td>{{ fmt(x.from_date) }} → {{ fmt(x.to_date) }}. {{ x.reason }}</td><td>{{ x.decided_by_name || '–' }}</td></tr>
        <tr *ngIf="d.confirmed_on && d.probation_status === 'confirmed'"><td>{{ fmt(d.confirmed_on) }}</td><td>Confirmed</td><td>{{ d.decision_note || '–' }}</td><td>{{ d.decided_by_name || '–' }}</td></tr>
        <tr *ngIf="d.failed_on"><td>{{ fmt(d.failed_on) }}</td><td>Not passed</td><td>{{ d.decision_note }}</td><td>{{ d.decided_by_name || '–' }}</td></tr>
      </tbody>
    </table>
  </div>
</div>
<div class="ep-empty" *ngIf="denied">{{ denied }}</div>`,
})
export class ZEmpEmploymentComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() readonly = false;

  d: any = null;
  canEdit = false;
  mode: 'confirm' | 'extend' | 'fail' | 'status' | null = null;
  f: any = {};
  ferr: Record<string, string> = {};
  error = '';
  warning = '';
  denied = '';
  saving = false;
  statuses = Object.entries(STATUS_LABEL).map(([v, l]) => ({ v, l }));

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  async load(fresh = false): Promise<void> {
    try {
      const p = await this.svc.profile(this.employeeId!, fresh);
      this.d = p.employment;
      this.canEdit = !!p.can_edit;
    } catch (e: any) { this.denied = e?.status === 403 ? 'You do not have access to these details.' : 'The employment details could not be loaded.'; }
    this.cd.markForCheck();
  }

  leaving(s: string): boolean { return ['on_notice', 'left', 'terminated', 'absconded', 'retired'].includes(s); }
  statusClass(s: string): string { return s === 'active' ? 'ok' : s === 'probation' ? 'blue' : s === 'on_notice' ? 'warn' : 'bad'; }
  fmt(v: string | null | undefined): string { if (!v) { return ''; } const [y, m, dd] = String(v).split('-'); return dd ? `${dd}/${m}/${y}` : String(v); }
  label(): string { return { confirm: 'Confirm', extend: 'Extend probation', fail: 'Record: not passed', status: 'Save status' }[this.mode!] || 'Save'; }

  start(m: 'confirm' | 'extend' | 'fail' | 'status'): void {
    this.mode = m;
    this.ferr = {};
    this.error = '';
    this.warning = '';
    const today = new Date().toISOString().slice(0, 10);
    this.f = m === 'confirm' ? { date: today, note: '' } : m === 'extend' ? { to_date: '', reason: '' } : m === 'fail' ? { last_day: '', reason: '' }
      : { status: this.d.status, date_of_leaving: this.d.date_of_leaving || '', leaving_reason: this.d.leaving_reason || '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    this.ferr = {};
    this.error = '';
    try {
      let r: any;
      if (this.mode === 'status') {
        const body: any = { status: this.f.status };
        if (this.leaving(this.f.status)) { body.date_of_leaving = this.f.date_of_leaving || null; body.leaving_reason = this.f.leaving_reason || ''; }
        r = await this.svc.put(`employment/${this.employeeId}/`, body);
      } else {
        const body: any = { ...this.f };
        for (const k of ['date', 'to_date', 'last_day']) { if (body[k] === '') { delete body[k]; } }
        r = await this.svc.post(`employment/${this.employeeId}/${this.mode}/`, body);
      }
      this.warning = r?.warning || '';
      this.mode = null;
      this.svc.forget(this.employeeId!);
      await this.load(true);
    } catch (e: any) {
      const x = this.svc.errors(e);
      this.ferr = x.fields;
      this.error = x.fields['detail'] || 'Please correct the fields marked below.';
    }
    this.saving = false;
    this.cd.markForCheck();
  }
}
