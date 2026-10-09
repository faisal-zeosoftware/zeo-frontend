import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EssApiService } from './ess-api.service';

/** v1.13.0 – my leave in the main app: balance, apply, change or withdraw a pending request, history. */
@Component({
  selector: 'app-ess-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./ess.css'],
  template: `
<div class="container">
  <div class="comapny_section">
    <div class="header_section">
      <div class="es-head">
        <div>
          <h1 class="page-title">My leave</h1>
          <p class="es-desc">Apply for leave, see your balance and follow your requests. A pending request can still be changed or withdrawn.</p>
        </div>
        <div class="es-actions"><button type="button" class="es-btn primary" (click)="openNew()">Apply for leave</button></div>
      </div>
    </div>
    <div class="com_list mt-4">
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <p class="es-msg err" *ngIf="msg">{{ msg }}</p>
      <div class="es-tiles">
        <div class="es-tile" *ngFor="let b of balances"><div class="lbl">{{ b.leave_type_name || b.leave_type }}</div><div class="num">{{ b.balance }}</div><div class="sub">days available</div></div>
      </div>
      <div class="es-h">My requests</div>
      <div class="es-rows">
        <div class="es-row" *ngFor="let r of rows">
          <div class="main">
            <div class="t">{{ r.leave_type }} · {{ r.start_date | date:'dd MMM' }} – {{ r.end_date | date:'dd MMM yyyy' }} ({{ r.number_of_days }} d)</div>
            <div class="s">{{ r.document_number }} · {{ r.reason }}</div>
          </div>
          <div class="r">
            <span class="es-tag" [ngClass]="(r.status || '').toLowerCase()">{{ r.status }}</span>
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
    <div class="es-form">
      <div class="wide" *ngIf="!f.id">
        <label>Leave type</label>
        <select [(ngModel)]="f.leave_type"><option [ngValue]="null">Choose…</option><option *ngFor="let t of types" [ngValue]="t.id">{{ t.name }}</option></select>
      </div>
      <div><label>From</label><input type="date" [(ngModel)]="f.start_date"></div>
      <div><label>To</label><input type="date" [(ngModel)]="f.end_date"></div>
      <div class="wide"><label style="display:flex;gap:6px;align-items:center;font-weight:400"><input type="checkbox" [(ngModel)]="f.dis_half_day"> Half day</label></div>
      <div *ngIf="f.dis_half_day"><label>Which half</label><select [(ngModel)]="f.half_day_period"><option value="first_half">First half</option><option value="second_half">Second half</option></select></div>
      <div class="wide"><label>Reason</label><textarea [(ngModel)]="f.reason"></textarea></div>
    </div>
    <div class="foot">
      <button type="button" class="es-btn" (click)="f = null">Cancel</button>
      <button type="button" class="es-btn primary" [disabled]="busy" (click)="save()">{{ f.id ? 'Save changes' : 'Send for approval' }}</button>
    </div>
  </div>
</div>`,
})
export class EssLeaveComponent implements OnInit {
  empId: number | null = null; empCode = ''; rows: any[] = []; balances: any[] = []; types: any[] = [];
  loading = false; busy = false; msg = ''; ok = ''; ferr = ''; f: any = null;

  constructor(private api: EssApiService, private route: ActivatedRoute, private cd: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    try {
      const p: any = await this.api.get('profile/');
      this.empId = p.employee_id;
      this.empCode = (p.groups.find((g: any) => g.key === 'personal')?.fields || []).find((f: any) => f.key === 'emp_code')?.value || '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'No employee record is linked to your login.'); }
    await this.load();
    if (this.route.snapshot.queryParamMap.get('new')) this.openNew();
  }

  isPending(r: any): boolean { return String(r.status || '').toLowerCase().startsWith('pend'); }

  async load(): Promise<void> {
    if (!this.empId) return;
    this.loading = true;
    try {
      const [list, bal]: any[] = await Promise.all([this.api.get('/calendars/api/emp-leave-request/'), this.api.get(`/employee/api/Employee/${this.empId}/leave_balance/`)]);
      const rows = Array.isArray(list) ? list : list.results || [];
      this.rows = rows.filter((r: any) => !this.empCode || r.employee === this.empCode).sort((a: any, b: any) => (b.start_date || '').localeCompare(a.start_date || ''));
      this.balances = (bal.leave_balance || []).filter((b: any) => b.include_dashboard !== false);
      this.types = bal.available_leave_types || [];
      this.msg = '';
    } catch (e: any) { this.msg = EssApiService.error(e, 'Could not load your leave.'); }
    this.loading = false; this.cd.detectChanges();
  }

  openNew(): void { this.ferr = ''; this.f = { leave_type: null, start_date: '', end_date: '', reason: '', dis_half_day: false, half_day_period: 'first_half' }; }
  openEdit(r: any): void { this.ferr = ''; this.f = { id: r.id, start_date: r.start_date, end_date: r.end_date, reason: r.reason, dis_half_day: r.dis_half_day, half_day_period: r.half_day_period || 'first_half' }; }

  async save(): Promise<void> {
    const f = this.f;
    if (!f.id && !f.leave_type) { this.ferr = 'Choose the leave type.'; return; }
    if (!f.start_date || !f.end_date) { this.ferr = 'Choose the first and last day of the leave.'; return; }
    if (f.end_date < f.start_date) { this.ferr = 'The last day cannot be before the first day.'; return; }
    const body: any = { start_date: f.start_date, end_date: f.end_date, reason: f.reason || '', dis_half_day: !!f.dis_half_day };
    if (f.dis_half_day) body.half_day_period = f.half_day_period;
    this.busy = true; this.ferr = '';
    try {
      if (f.id) { await this.api.patch(`/calendars/api/emp-leave-request/${f.id}/`, body); this.ok = 'Your leave request was changed.'; }
      else { await this.api.post('/calendars/api/emp-leave-request/', { ...body, employee: this.empId, leave_type: f.leave_type }); this.ok = 'Your leave request was sent for approval.'; }
      this.f = null; await this.load();
    } catch (e: any) { this.ferr = EssApiService.error(e, 'The leave request could not be saved.'); }
    this.busy = false; this.cd.detectChanges();
  }

  async withdraw(r: any): Promise<void> {
    if (!window.confirm('Withdraw this leave request?')) return;
    try { await this.api.delete(`/calendars/api/emp-leave-request/${r.id}/`); this.ok = 'Leave request withdrawn.'; await this.load(); }
    catch (e: any) { this.msg = EssApiService.error(e, 'The request could not be withdrawn.'); }
    this.cd.detectChanges();
  }
}
