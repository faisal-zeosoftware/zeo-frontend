// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';   // v1.62.0 people: dates dd/mm/yyyy
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EssApiService } from './ess-api.service';
import { ZNoEmployeeComponent } from '../people62/z-no-employee.component';   // v1.62.0 people

import { LeaveExplainedComponent } from '../leave-policy/leave-explained.component';   // v1.49.0
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

/** v1.13.0 – my leave in the main app: balance, apply, change or withdraw a pending request, history. */
@Component({
  selector: 'app-ess-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, LeaveExplainedComponent, ZNoEmployeeComponent, ZDateFieldComponent],
  styleUrls: ['./ess.css'],
  styles: [`.es-check { display: grid; gap: 6px; } .es-days { font-weight: 600; } .es-warn { background: #fff4e0; color: #7a4b00; border-radius: 8px; padding: 7px 10px; font-size: 13px; }
    .es-warn.info { background: #eef4fb; color: #1f4e79; } .es-ok { color: #1d6b37; font-size: 13px; }`],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">My leave</h1>
          <p class="es-desc">Apply for leave, see your balance and follow your requests. A pending request can still be changed or withdrawn.</p>
        </div>
        <div class="es-actions" *ngIf="!noEmp"><button type="button" class="es-btn primary" (click)="openNew()">Apply for leave</button></div>
      </div>
    </div>
    <z-no-employee *ngIf="noEmp" what="This page shows your own leave balances and requests."></z-no-employee>
    <div class="com_list mt-4" *ngIf="!noEmp">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-tiles">
        <div class="es-tile" *ngFor="let b of balances"><div class="lbl">{{ b.leave_type_name || b.leave_type }}</div><div class="num">{{ b.balance }}</div><div class="sub">{{ isHourlyName(b.leave_type_name || b.leave_type) ? 'hours available' : 'days available' }}</div></div>
      </div>
      <app-leave-explained [employee]="null"></app-leave-explained>   <!-- v1.49.0 -->
      <div class="es-h">My requests</div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let r of rows">
          <div class="main">
            <div class="t">{{ r.leave_type }} · {{ r.start_date | date:'dd MMM' }} – {{ r.end_date | date:'dd/MM/yyyy' }} ({{ r.number_of_days }} {{ isHourlyName(r.leave_type) ? 'h' : 'd' }})</div>
            <div class="s">{{ r.document_number }} · {{ r.reason }}</div>
          </div>
          <div class="r">
            <span class="es-tag" [ngClass]="(r.status || '').toLowerCase()">{{ statusText(r) }}</span>
            <span class="es-muted" *ngIf="r.cancelled_days" data-given-back>{{ r.cancelled_days }} day(s) given back</span>   <!-- v1.65.0 (item 83) -->
            <button type="button" class="es-btn sm" *ngIf="canExtend(r)" (click)="openExtend(r)" data-extend>Extend</button>   <!-- v1.65.0 (item 84) -->
            <button type="button" class="es-btn sm" *ngIf="isPending(r)" (click)="openEdit(r)">Change</button>
            <button type="button" class="es-btn sm danger" *ngIf="isPending(r)" (click)="withdraw(r)">Withdraw</button>
          </div>
        </div>
        <p class="es-muted" *ngIf="!loading && !rows.length">No leave requests yet.</p>
      </div>
    </div>
  </div>
</div>

<div class="es-backdrop" *ngIf="f" (click)="f = null">
  <div class="es-modal" (click)="$event.stopPropagation()">
    <h3>{{ f.id ? 'Change leave request' : 'Apply for leave' }}</h3>
    <p class="es-msg err" *ngIf="ferr">{{ ferr }}</p>
    <!-- v1.62.5 (item 19): the salary of these days is already paid – the message only (HR / payroll record such leave) -->
    <div class="es-warn" *ngIf="paid" data-period-paid style="margin-bottom:10px"><b>{{ paid.title }}</b><div>{{ paid.detail }}</div></div>
    <div class="es-form">
      <div class="wide" *ngIf="!f.id">
        <label>Leave type</label>
        <select [(ngModel)]="f.leave_type" (ngModelChange)="recheck()"><option [ngValue]="null">Choose…</option><option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option></select>
      </div>
      <div><label>{{ hourly() ? 'Day' : 'From' }}</label><z-date-field [(value)]="f.start_date" (valueChange)="recheck()"></z-date-field></div>
      <div *ngIf="!hourly()"><label>To</label><z-date-field [(value)]="f.end_date" (valueChange)="recheck()"></z-date-field></div>
      <!-- v1.62.4 (item 81): short leave in hours – the hours and when in the day, one working day -->
      <div *ngIf="hourly()" data-short-leave><label>Hours</label><input type="number" min="0.5" max="8" step="0.5" [(ngModel)]="f.hours" (ngModelChange)="recheck()"></div>
      <div class="wide" *ngIf="hourly()"><label>When</label><select [(ngModel)]="f.when"><option value="">Any time of the day</option><option value="first_half">Start of the day (arriving late)</option><option value="second_half">End of the day (leaving early)</option></select></div>
      <div class="wide" *ngIf="!hourly()"><label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" [(ngModel)]="f.dis_half_day" (ngModelChange)="recheck()"> Half day</label></div>
      <!-- v1.65.0 (item 82): the date of birth of the child (maternity / parental leave) -->
      <div class="wide" *ngIf="birthAsk()" data-birth-date><label>Date of birth of the child{{ birthRule()?.birth_required ? '' : ' (optional)' }}</label><z-date-field [(value)]="f.birth_date" (valueChange)="recheck()"></z-date-field>
        <div class="es-muted" *ngIf="birthRule()?.birth_required">Taken within {{ birthRule().birth_window_months }} months of the birth.</div></div>
      <!-- v1.51.0 leave conflicts: the rules and the team before sending -->
      <div class="wide es-check" *ngIf="chk" data-leave-check>
        <div class="es-days" *ngIf="chk.days !== undefined">{{ chk.unit === 'hours' ? (chk.days + ' hour(s) of short leave') : (chk.days + ' day(s) of leave') }}</div>
        <div class="es-msg err" *ngFor="let e of chk.errors">{{ e }}</div>
        <div class="es-warn" *ngFor="let w of chk.warnings" [class.info]="w.level === 'info'">{{ w.text }}</div>
        <div class="es-ok" *ngIf="!chk.errors?.length && !chk.warnings?.length">No conflict with your team.</div>
      </div>
      <div *ngIf="f.dis_half_day && !hourly()"><label>Which half</label><select [(ngModel)]="f.half_day_period"><option value="first_half">First half</option><option value="second_half">Second half</option></select></div>
      <!-- v1.62.11 (item 95): an approver chooses who approves for them while away (out of office is set when the leave is approved) -->
      <div class="wide" *ngIf="oooAsk()" data-ooo-leave>
        <label>Approvals go to</label>
        <select [(ngModel)]="f.ooo_delegate" data-ooo-leave-delegate><option [ngValue]="null">Not chosen – the company's rule decides</option>
          <option *ngFor="let u of choice.users" [ngValue]="u.id">{{ u.name }}</option></select>
        <div class="es-muted">You approve requests. When this leave is approved, out of office is set for its days and the requests waiting for you go to this colleague; they come back to you the day after the leave.</div>
      </div>
      <div class="wide"><label>Reason</label><textarea [(ngModel)]="f.reason"></textarea></div>
      <div class="wide">
        <label>Supporting document</label>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="pickFile($event)">
        <div class="es-muted">Attach the medical report or certificate when the leave type needs one (sick, maternity, parental, bereavement, study leave).</div>
      </div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="save()">{{ f.id ? 'Save changes' : 'Send for approval' }}</button>
    </div>
  </div>
</div>
<!-- v1.65.0 (item 84): ask to extend an approved leave – a linked request through the same approval -->
<div class="es-backdrop" *ngIf="ext" (click)="ext = null">
  <div class="es-modal" (click)="$event.stopPropagation()" data-extend-modal>
    <h3>Extend {{ ext.r.document_number }}</h3>
    <p class="es-muted">{{ ext.r.leave_type }} · {{ ext.r.start_date | date:'dd/MM/yyyy' }} – {{ ext.r.end_date | date:'dd/MM/yyyy' }}. The extra days are a new request linked to this leave, approved like any leave.</p>
    <p class="es-msg err" *ngIf="ext.err">{{ ext.err }}</p>
    <div class="es-form">
      <div><label>New last day</label><z-date-field [(value)]="ext.end_date"></z-date-field></div>
      <div class="wide"><label>Reason</label><textarea [(ngModel)]="ext.reason"></textarea></div>
    </div>
    <div class="foot"><button type="button" class="es-btn" (click)="ext = null">Cancel</button><button type="button" class="es-btn primary" [disabled]="busy" (click)="sendExtend()" data-extend-send>Send for approval</button></div>
  </div>
</div>`,
})
export class EssLeaveComponent implements OnInit {
  noEmp = false;   // v1.62.0 people
  empId: number | null = null; empCode = ''; rows: any[] = []; balances: any[] = []; types: any[] = [];
  loading = false; busy = false; msg = ''; ok = ''; ferr = ''; f: any = null;
  paid: { title: string; detail: string } | null = null;   // v1.62.5 (item 19): 409 period_paid
  choice: any = null;   // v1.62.11 (item 95) /zeo-admin/api/out-of-office/leave-choice/
  file: File | null = null;   // v1.15.1: supporting document (leave types that need one could not be applied from any screen)

  constructor(private api: EssApiService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const p: any = await this.api.get('profile/');
      this.empId = p.employee_id;
      this.empCode = (p.groups.find((g: any) => g.key === 'personal')?.fields || []).find((f: any) => f.key === 'emp_code')?.value || '';
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 404) { this.noEmp = true; this.cd.detectChanges(); return; }   // v1.62.0 people
      this.msg = EssApiService.error(e, 'No employee record is linked to your login.');
    }
    await this.load();
    try { this.choice = await this.api.get('/zeo-admin/api/out-of-office/leave-choice/'); } catch { this.choice = null; }   // v1.62.11 (item 95)
    try { this.rules = await this.api.get('/leave-policy/api/leave-rules/types/'); } catch { this.rules = {}; }   // v1.65.0 (item 82)
    if (this.route.snapshot.queryParamMap.get('new')) this.openNew();
  }

  // v1.62.4 (item 81): leave types counted in hours (Short Leave (hours))
  hourly(): boolean {
    const id = this.f?.leave_type || this.f?.leave_type_id;
    const t = this.types.find((x: any) => x.id === id);
    return t ? t.unit === 'hours' : !!this.f?.hourly;
  }
  isHourlyName(name: any): boolean { return this.types.some((t: any) => t.unit === 'hours' && t.name === name); }

  // v1.62.11 (item 95): the company sets out of office from approved leave, the applicant approves, this leave counts
  oooAsk(): boolean {
    const c = this.choice; const f = this.f;
    if (!c || !c.auto || !c.approver || !f) return false;
    if (c.types === 'all') return true;
    if (c.types === 'some') return (c.type_ids || []).includes(f.leave_type || f.leave_type_id);
    return !this.hourly() && !f.dis_half_day;
  }
  private async saveChoice(id: any): Promise<void> {
    if (!id || !this.f?.ooo_delegate || !this.oooAsk()) return;
    try { await this.api.post('/zeo-admin/api/out-of-office/leave-choice/', { leave_request: id, delegate_id: this.f.ooo_delegate }); } catch { /* the leave is saved; the rule decides */ }
  }

  isPending(r: any): boolean { return String(r.status || '').toLowerCase().startsWith('pend'); }

  async load(): Promise<void> {
    if (!this.empId) return;
    this.loading = true;
    try {
      // v1.62.11 (item 95): a user without the right to list leave requests (403) still gets the balance and the leave types to apply
      const [list, bal]: any[] = await Promise.all([this.api.get('/calendars/api/emp-leave-request/').catch((e: any) => { if (e?.status === 403) { return []; } throw e; }),
        this.api.get(`/employee/api/Employee/${this.empId}/leave_balance/`)]);
      const rows = Array.isArray(list) ? list : list.results || [];
      this.rows = rows.filter((r: any) => !this.empCode || r.employee === this.empCode).sort((a: any, b: any) => (b.start_date || '').localeCompare(a.start_date || ''));
      this.balances = (bal.leave_balance || []).filter((b: any) => b.include_dashboard !== false);
      const ok: number[] | undefined = bal.applicable_type_ids;   // v1.26.0: the employee's policy types only (gender rule applied)
      this.types = (bal.available_leave_types || []).filter((t: any) => !ok || ok.includes(t.id));
      this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your leave.'); }
    this.loading = false; this.cd.detectChanges();
  }

  pickFile(ev: any): void { this.file = ev?.target?.files?.[0] || null; this.recheck(); }

  // v1.51.0 leave conflicts: rules, colleagues of the same role, department staffing, blackout periods, roster
  chk: any = null; private chkTimer: any;
  recheck(): void {
    clearTimeout(this.chkTimer);
    const f = this.f;
    if (f && this.hourly()) { f.end_date = f.start_date; }   // v1.62.4 (item 81): one day
    if (!f || !(f.leave_type || f.leave_type_id) || !f.start_date || !f.end_date) { this.chk = null; return; }
    this.chkTimer = setTimeout(async () => {
      try {
        this.chk = await this.api.post('/leave-policy/api/check/', { leave_type: f.leave_type || f.leave_type_id, start_date: f.start_date, end_date: f.end_date,
          half_day: !this.hourly() && !!f.dis_half_day, request: f.id || null, has_document: !!this.file, hours: this.hourly() ? (f.hours || 0) : null,
          birth_date: f.birth_date || null });   // v1.65.0 (item 82)
      } catch { this.chk = null; }
      this.cd.detectChanges();
    }, 350);
  }

  /** JSON, or form data when a document is attached (the API stores it as lv_document). */
  private body(data: any): any {
    if (!this.file) return data;
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    fd.append('lv_document', this.file, this.file.name);
    return fd;
  }

  openNew(): void { this.chk = null; this.file = null; this.ferr = ''; this.paid = null; this.f = { leave_type: null, start_date: '', end_date: '', reason: '', dis_half_day: false, half_day_period: 'first_half', hours: null, when: '', ooo_delegate: this.choice?.default_id || null }; }   // v1.62.5 (item 19): paid cleared
  openEdit(r: any): void { this.chk = null; this.file = null; this.ferr = ''; this.paid = null; this.f = { id: r.id, leave_type_id: r.leave_type_id || (typeof r.leave_type === 'number' ? r.leave_type : null), start_date: r.start_date, end_date: r.end_date, reason: r.reason, dis_half_day: r.dis_half_day, half_day_period: r.half_day_period || 'first_half',   // v1.62.5 (item 19): paid cleared
    hourly: this.isHourlyName(r.leave_type), hours: r.applied_days || r.number_of_days, when: r.half_day_period || '' }; }

  async save(): Promise<void> {
    const f = this.f;
    if (!f.id && !f.leave_type) { this.ferr = 'Choose the leave type.'; return; }
    const hourly = this.hourly();   // v1.62.4 (item 81)
    if (hourly) { f.end_date = f.start_date; if (!(Number(f.hours) > 0)) { this.ferr = 'Give the hours of the short leave.'; return; } }
    if (!f.start_date || !f.end_date) { this.ferr = 'Choose the first and last day of the leave.'; return; }
    if (f.end_date < f.start_date) { this.ferr = 'The last day cannot be before the first day.'; return; }
    const body: any = { start_date: f.start_date, end_date: f.end_date, reason: f.reason || '', dis_half_day: !!f.dis_half_day };
    if (f.dis_half_day && !hourly) body.half_day_period = f.half_day_period;
    if (hourly) { body.dis_half_day = false; body.leave_duration = Number(f.hours); if (f.when) body.half_day_period = f.when; }   // v1.62.4 (item 81)
    if (this.birthAsk() && f.birth_date) { body.birth_date = f.birth_date; }   // v1.65.0 (item 82)
    if (this.birthRule()?.birth_required && !f.birth_date) { this.ferr = 'Give the date of birth of the child.'; return; }
    this.busy = true; this.ferr = ''; this.paid = null;
    try {
      if (f.id) { await this.api.patch(`/calendars/api/emp-leave-request/${f.id}/`, this.body(body)); await this.saveChoice(f.id); this.ok = 'Your leave request was changed.'; }
      else { const r: any = await this.api.post('/calendars/api/emp-leave-request/', this.body({ ...body, employee: this.empId, leave_type: f.leave_type })); await this.saveChoice(r?.id); this.ok = 'Your leave request was sent for approval.'; }   // v1.62.11 (item 95)
      this.f = null; this.file = null; await this.load();
    } catch (e: any) {
      if (e?.status === 409 && e?.error?.code === 'period_paid') { this.paid = { title: e.error.title || '', detail: e.error.detail || '' }; }   // v1.62.5 (item 19)
      else { this.ferr = EssApiService.error(e, 'The leave request could not be saved.'); }
    }
    this.busy = false; this.cd.detectChanges();
  }

  // v1.65.0 (items 82–84): rules per leave type (birth date), Cancelled status, extend an approved leave
  rules: any = {};
  private typeId(): number | null { return this.f?.leave_type || this.f?.leave_type_id || null; }
  birthRule(): any { const id = this.typeId(); return id ? this.rules[id] : null; }
  birthAsk(): boolean { const r = this.birthRule(); return !!r && (r.birth_required || r.birth_optional) && !this.hourly(); }
  statusText(r: any): string { const s = String(r.status || '').toLowerCase(); return s === 'cancelled' ? 'Cancelled' : r.status; }
  canExtend(r: any): boolean { return String(r.status || '').toLowerCase() === 'approved' && !this.isHourlyName(r.leave_type) && (r.end_date || '') >= new Date().toISOString().slice(0, 10); }
  ext: any = null;
  openExtend(r: any): void { this.ext = { r, end_date: '', reason: '', err: '' }; }
  async sendExtend(): Promise<void> {
    const x = this.ext;
    if (!x.end_date || x.end_date <= x.r.end_date) { x.err = 'Choose a new last day after the end of the leave.'; return; }
    this.busy = true;
    try { const d: any = await this.api.post(`/leave-policy/api/requests/${x.r.id}/extend/`, { end_date: x.end_date, reason: x.reason || '' }); this.ok = d?.detail || 'Extension sent for approval.'; this.ext = null; await this.load(); }
    catch (e: any) { x.err = EssApiService.error(e, 'The extension could not be sent.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async withdraw(r: any): Promise<void> {
    if (!(await zConfirm('Withdraw this leave request?'))) return;
    try { await this.api.delete(`/calendars/api/emp-leave-request/${r.id}/`); this.ok = 'Leave request withdrawn.'; await this.load(); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The request could not be withdrawn.'); }
    this.cd.detectChanges();
  }
}
