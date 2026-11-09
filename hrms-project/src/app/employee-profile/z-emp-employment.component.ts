import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';   // v1.62.0 people: dates dd/mm/yyyy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeProfileService, STATUS_LABEL } from './employee-profile.service';
import { COUNTRY_PACK_UI } from '../shared-ui/country-pack.service';   // v1.14.0
import { HttpClient } from '@angular/common/http';   // v1.67.12 (effective)
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * v1.13.0 – "Employment" tab: one employment status (active, on probation, on notice, left, terminated, absconded,
 * retired) with the date of leaving, the probation (end date from the employment type or the branch, extensions,
 * decisions) and the actions Confirm / Extend / Not passed. Resignations and end of service update it by themselves.
 */
@Component({
  selector: 'z-emp-employment',
  standalone: true,
  imports: [...COUNTRY_PACK_UI, CommonModule, FormsModule, ZDateFieldComponent],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep" *ngIf="d">
  <div class="ep-note err" *ngIf="error">{{ error }}</div>
  <div class="ep-note" *ngIf="warning">{{ warning }}</div>
  <!-- v1.67.12 (effective, item 62): the confirmation date is asked for -->
  <div class="ep-note warn" *ngIf="d.confirmation_missing" data-ep-confirm-missing>
    <ng-container *ngIf="!d.date_of_confirmation && !d.probation_status">No confirmation date: no probation period is set for this employee (employment type or branch). Confirm the employee with the confirmation date.</ng-container>
    <ng-container *ngIf="d.probation_status === 'on_probation' || d.probation_status === 'extended'">The probation ended on {{ fmt(d.probation_end_date) }} without a decision – confirm the employee, extend the probation or record that it was not passed.</ng-container>
  </div>
  <div class="ep-kpis">
    <div class="ep-kpi"><small>Employment status</small><span class="ep-tag" [ngClass]="statusClass(d.status)">{{ d.status_label }}</span></div>
    <div class="ep-kpi"><small>Joining date</small><b>{{ fmt(d.joined_date) }}</b></div>
    <div class="ep-kpi"><small>Probation</small><b>{{ d.probation_status_label }}</b>
      <div class="lp-muted" *ngIf="d.days_left !== null">{{ d.days_left < 0 ? 'ended ' + (-d.days_left) + ' days ago – decide now' : d.days_left + ' days left' }}</div></div>
    <div class="ep-kpi"><small>{{ d.probation_status === 'confirmed' ? 'Confirmed on' : 'Probation ends' }}</small>
      <b>{{ fmt(d.probation_status === 'confirmed' ? d.confirmed_on : d.probation_end_date) || '–' }}</b>
      <div class="lp-muted" *ngIf="d.probation_days && d.probation_source !== 'manual'">{{ d.probation_days }} days ({{ d.probation_source === 'employment_type' ? 'employment type' : 'branch' }})</div></div>
    <div class="ep-kpi" *ngIf="+d.unpaid_days_before_golive"><small>Unpaid days before go-live</small><b>{{ +d.unpaid_days_before_golive }}</b></div>
    <div class="ep-kpi" *ngIf="d.date_of_leaving"><small>Date of leaving</small><b>{{ fmt(d.date_of_leaving) }}</b><div class="lp-muted">{{ d.leaving_reason }}</div></div>
  </div>

  <div class="ep-actions" *ngIf="canEdit && !readonly && !mode">
    <ng-container *ngIf="d.can_decide">
      <button type="button" class="lp-btn primary" (click)="start('confirm')">Confirm employee</button>
      <button type="button" class="lp-btn" (click)="start('extend')">Extend probation</button>
      <button type="button" class="lp-btn danger" (click)="start('fail')">Probation not passed</button>
    </ng-container>
    <button type="button" class="lp-btn" (click)="start('status')">Change status / date of leaving / unpaid days</button>
  </div>

  <div class="ep-row-form" *ngIf="mode">
    <ng-container [ngSwitch]="mode">
      <div *ngSwitchCase="'confirm'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['date']"><span>Confirmation date</span><z-date-field [(value)]="f.date"></z-date-field><small class="err" *ngIf="ferr['date']">{{ ferr['date'] }}</small></label>
        <label class="ep-f"><span>Note (optional)</span><input type="text" [(ngModel)]="f.note"></label>
      </div>
      <div *ngSwitchCase="'extend'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['to_date']"><span>New end date *</span><z-date-field [(value)]="f.to_date" [max]="d.limits?.max_end_date"></z-date-field>
          <small class="hint" *zCountry="'pack:AE'">UAE law allows at most 6 months in total – latest {{ fmt(d.limits?.max_end_date) }}.</small><small class="hint" *zCountry="'!pack:AE'">Latest end date allowed: {{ fmt(d.limits?.max_end_date) }}.</small><small class="err" *ngIf="ferr['to_date']">{{ ferr['to_date'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['reason']"><span>Reason *</span><input type="text" [(ngModel)]="f.reason"><small class="err" *ngIf="ferr['reason']">{{ ferr['reason'] }}</small></label>
      </div>
      <div *ngSwitchCase="'fail'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['last_day']"><span>Last working day</span><z-date-field [(value)]="f.last_day"></z-date-field>
          <small class="hint">Leave empty for 14 days from today<ng-container *zCountry="'pack:AE'"> (the written notice UAE law asks for)</ng-container>.</small><small class="err" *ngIf="ferr['last_day']">{{ ferr['last_day'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['reason']"><span>Reason *</span><input type="text" [(ngModel)]="f.reason"><small class="err" *ngIf="ferr['reason']">{{ ferr['reason'] }}</small></label>
      </div>
      <div *ngSwitchCase="'status'" class="ep-grid">
        <label class="ep-f" [class.bad]="ferr['status']"><span>Status</span>
          <select [(ngModel)]="f.status"><option *ngFor="let s of statuses" [ngValue]="s.v">{{ s.l }}</option></select><small class="err" *ngIf="ferr['status']">{{ ferr['status'] }}</small></label>
        <label class="ep-f" [class.bad]="ferr['date_of_leaving']" *ngIf="leaving(f.status)"><span>Date of leaving (last working day) *</span><z-date-field [(value)]="f.date_of_leaving"></z-date-field>
          <small class="err" *ngIf="ferr['date_of_leaving']">{{ ferr['date_of_leaving'] }}</small></label>
        <label class="ep-f" *ngIf="leaving(f.status)"><span>Reason</span><input type="text" [(ngModel)]="f.leaving_reason"></label>
        <label class="ep-f" [class.bad]="ferr['unpaid_days_before_golive']"><span>Unpaid days before ZEO go-live</span><input type="number" min="0" step="0.5" [(ngModel)]="f.unpaid_days_before_golive">
          <small class="hint">Unpaid leave and absence from earlier systems – not counted as service for the gratuity.</small><small class="err" *ngIf="ferr['unpaid_days_before_golive']">{{ ferr['unpaid_days_before_golive'] }}</small></label>
      </div>
    </ng-container>
    <div class="ep-actions">
      <button type="button" class="lp-btn primary" [disabled]="saving" (click)="submit()">{{ saving ? 'Saving…' : label() }}</button>
      <button type="button" class="lp-btn" (click)="mode = null">Cancel</button>
    </div>
  </div>

  <!-- v1.67.12 (effective, item 249): GPSSA first-insured date – old / new pension law -->
  <div class="ep-sec" style="margin-top:14px" *ngIf="pen && (pen.is_national || pen.first_insured)" data-ep-pension>
    <h3>Pension (GPSSA)</h3>
    <div class="ep-kpis">
      <div class="ep-kpi"><small>Pension law</small><b data-ep-pension-law>{{ pen.law === 'old' ? 'Old law (Federal Law 7/1999)' : 'New law (Decree-Law 57/2023)' }}</b>
        <div class="lp-muted">{{ pen.law_basis === 'joined' ? 'Decided by the joining date ' + fmt(pen.law_from) : 'Decided by the date first insured ' + fmt(pen.law_from) }} (cut-off {{ fmt(pen.cut_off) }})</div></div>
    </div>
    <div class="ep-grid" *ngIf="canPen && !readonly">
      <label class="ep-f" [class.bad]="pferr['first_insured']"><span>Date first insured</span><z-date-field [(value)]="pf.first_insured"></z-date-field>
        <small class="hint">With GPSSA (or the Abu Dhabi Pension Fund / another GCC scheme) at any employer. Empty = the joining date decides.</small>
        <small class="err" *ngIf="pferr['first_insured']">{{ pferr['first_insured'] }}</small></label>
      <label class="ep-f"><span>Scheme</span><select [(ngModel)]="pf.scheme" data-ep-pension-scheme>
        <option value="gpssa">GPSSA</option><option value="adpf">Abu Dhabi Pension Fund</option><option value="gcc">Another GCC pension scheme</option></select>
        <small class="hint" *ngIf="pf.scheme === 'gcc'">{{ pen.settings?.gcc_counts ? 'The company counts insurance in another GCC scheme (legal rule to confirm).' : 'Not counted by the company setting (legal rule to confirm): the joining date decides.' }}</small></label>
      <label class="ep-f"><span>Note (optional)</span><input type="text" [(ngModel)]="pf.note" maxlength="255"></label>
    </div>
    <div class="ep-actions" *ngIf="canPen && !readonly"><button type="button" class="lp-btn primary" [disabled]="penSaving" (click)="savePension()" data-ep-pension-save>{{ penSaving ? 'Saving…' : 'Save pension details' }}</button>
      <span class="lp-muted" *ngIf="penMsg">{{ penMsg }}</span></div>
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

  // v1.67.12 (effective, item 249): GPSSA first-insured date
  pen: any = null;
  pf: any = { first_insured: '', scheme: 'gpssa', note: '' };
  pferr: Record<string, string> = {};
  canPen = false;
  penSaving = false;
  penMsg = '';

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef, private http: HttpClient) {}

  private penUrl(): string {
    return `${environment.apiBaseUrl}/payroll-plus/api/pension/${this.employeeId}/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`;
  }

  async loadPension(): Promise<void> {
    try {
      this.pen = await firstValueFrom(this.http.get<any>(this.penUrl()));
      this.canPen = !!this.pen?.can_edit;
      this.pf = { first_insured: this.pen.first_insured || '', scheme: this.pen.scheme || 'gpssa', note: this.pen.note || '' };
    } catch { this.pen = null; }
    this.cd.markForCheck();
  }

  async savePension(): Promise<void> {
    this.penSaving = true; this.pferr = {}; this.penMsg = '';
    try {
      this.pen = await firstValueFrom(this.http.put<any>(this.penUrl(), { first_insured: this.pf.first_insured || null, scheme: this.pf.scheme, note: this.pf.note || '' }));
      this.penMsg = 'Pension details saved.';
    } catch (e: any) {
      const x = e?.error || {};
      for (const k of Object.keys(x)) { this.pferr[k] = Array.isArray(x[k]) ? x[k].join(' ') : String(x[k]); }
      if (!Object.keys(this.pferr).length) { this.pferr['first_insured'] = 'Not saved – try again.'; }
    }
    this.penSaving = false;
    this.cd.markForCheck();
  }

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  async load(fresh = false): Promise<void> {
    try {
      const p = await this.svc.profile(this.employeeId!, fresh);
      this.d = p.employment;
      this.canEdit = !!p.can_edit;
      this.loadPension();   // v1.67.12 (effective, item 249)
    } catch (e: any) { this.denied = e?.status === 403 ? 'You do not have access to these details.' : 'The employment details could not be loaded.'; }
    this.cd.markForCheck();
  }

  leaving(s: string): boolean { return ['on_notice', 'left', 'terminated', 'absconded', 'retired'].includes(s); }
  statusClass(s: string): string { return s === 'active' ? 'ok' : s === 'probation' ? 'blue' : s === 'on_notice' ? 'warn' : 'bad'; }
  fmt(v: string | null | undefined): string { if (!v) { return ''; } const [y, m, dd] = String(v).split('-'); return dd ? `${dd}/${m}/${y}` : String(v); }
  label(): string { return { confirm: 'Confirm', extend: 'Extend probation', fail: 'Record: not passed', status: 'Save' }[this.mode!] || 'Save'; }

  start(m: 'confirm' | 'extend' | 'fail' | 'status'): void {
    this.mode = m;
    this.ferr = {};
    this.error = '';
    this.warning = '';
    const today = new Date().toISOString().slice(0, 10);
    this.f = m === 'confirm' ? { date: today, note: '' } : m === 'extend' ? { to_date: '', reason: '' } : m === 'fail' ? { last_day: '', reason: '' }
      : { status: this.d.status, date_of_leaving: this.d.date_of_leaving || '', leaving_reason: this.d.leaving_reason || '', unpaid_days_before_golive: +this.d.unpaid_days_before_golive || 0 };
  }

  async submit(): Promise<void> {
    this.saving = true;
    this.ferr = {};
    this.error = '';
    try {
      let r: any;
      if (this.mode === 'status') {
        const body: any = { status: this.f.status, unpaid_days_before_golive: +this.f.unpaid_days_before_golive || 0 };
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
