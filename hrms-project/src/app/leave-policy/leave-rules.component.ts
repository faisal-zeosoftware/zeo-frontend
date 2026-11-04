// v1.65.0 (items 82–97) – Leave › Setup › Leave rules: company leave rules, the rules of each leave type, HR-confirmed eligibility.
// API /leave-policy/api/leave-rules/ (settings/, <leave type id>/, types/, eligibility/). Every rule is off by default (= before 1.65.0).
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { httpErrorText } from '../shared-ui/z-http-error.interceptor';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { openZForm, ZFormConfig } from '../shared-ui/z-form.component';
import { LOOKUPS } from '../hr-modules/module-api.service';

const API = '/leave-policy/api/leave-rules/';

@Component({
  selector: 'app-leave-rules',
  standalone: true,
  imports: [CommonModule, ZListDirective],
  styleUrls: ['./leave-policy.css'],
  styles: [`.lr-card { background: #fff; border: 1px solid #e3e6ea; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    .lr-card h2 { font-size: 15px; margin: 0 0 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .lr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px 18px; font-size: 13px; }
    .lr-grid div b { display: block; font-size: 12px; color: #5d6670; font-weight: 600; }
    .lr-tbc { display: inline-block; font-size: 11px; padding: 1px 7px; border-radius: 9px; background: #fff4e0; color: #7a4b00; margin-inline-start: 6px; }
    .lr-chip { display: inline-block; font-size: 11.5px; padding: 1px 8px; border-radius: 10px; background: #efedff; color: #4338ca; margin: 1px 3px 1px 0; }
    .lr-hint { font-size: 12px; color: #5d6670; }`],
  template: `
<div class="lp-page" style="padding:16px 20px" data-leave-rules>
  <div class="lp-head zp-cardhead"><div><h1>Leave rules</h1>
    <p class="lp-desc">Rules besides the leave policy lines: birth date of maternity / parental leave, sandwich rule, projected balance, leave salary in advance, documents above N days, eligibility confirmed by HR (e.g. Hajj), nursing breaks, leave in the notice period, accrual catch-up. Everything is off until you switch it on.</p></div></div>
  <p class="lp-msg" *ngIf="msg" [class.err]="err">{{ msg }}</p>
  <ng-container *ngIf="d">
    <div class="lr-card" data-lr-settings>
      <h2><span>Company rules</span><button type="button" class="lp-btn primary" *ngIf="d.can_edit" (click)="editSettings()" data-lr-settings-edit>Change</button></h2>
      <div class="lr-grid">
        <div><b>Leave during the notice period</b>{{ label('notice_leave', d.settings.notice_leave) }}</div>
        <div><b>Annual leave earned and unpaid days</b>{{ label('accrual_reduction', d.settings.accrual_reduction) }}<span class="lr-tbc">To be confirmed</span></div>
        <div><b>Leave pay at exit, less than 6 months</b>{{ label('exit_under_6m', d.settings.exit_under_6m) }}<span class="lr-tbc">To be confirmed</span></div>
        <div><b>Leave salary in advance is paid</b>{{ label('advance_when', d.settings.advance_when) }} · {{ label('advance_basis', d.settings.advance_basis) }}</div>
        <div><b>Missed monthly accrual</b>{{ d.settings.catch_up ? 'Credited on the next run (at most ' + d.settings.catch_up_max_months + ' months)' : 'Not credited' }}</div>
        <div><b>Nursing breaks after maternity leave</b>{{ d.settings.nursing_enabled ? (d.settings.nursing_minutes + ' minutes a day for ' + d.settings.nursing_months + ' months') : 'Off' }}</div>
        <div><b>Extension of an approved leave</b>{{ d.settings.extension_skips_notice ? 'No notice days asked' : 'Notice days as for any request' }}</div>
      </div>
      <p class="lr-hint" style="margin-top:10px">{{ d.to_confirm.accrual_reduction }} {{ d.to_confirm.exit_under_6m }}</p>
    </div>
    <div class="lr-card" data-lr-types>
      <h2><span>Rules of each leave type</span></h2>
      <table class="lp-table" style="width:100%">
        <thead><tr><th>Leave type</th><th>Branch</th><th>Category</th><th>Rules on</th><th>Actions</th></tr></thead>
        <tbody>
          <tr *ngFor="let t of d.types" [attr.data-lr-type]="t.leave_type_id">
            <td><b>{{ t.name }}</b> <small class="lr-hint">{{ t.code }}</small></td><td>{{ t.branch || 'Every branch' }}</td><td>{{ t.category_label || t.category }}</td>
            <td><span class="lr-chip" *ngFor="let k of t.rules_text">{{ k }}</span><span class="lr-chip" *ngIf="t.nursing_default && d.settings.nursing_enabled">{{ t.nursing_text }}</span>
              <span class="lr-hint" *ngIf="!t.rules_on.length && !(t.nursing_default && d.settings.nursing_enabled)">–</span><span class="lr-hint" *ngIf="t.inherited"> (from the type of the same code)</span></td>
            <td><button type="button" class="lp-btn" *ngIf="d.can_edit" (click)="editType(t)" data-lr-type-edit>Change</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="lr-card" data-lr-elig>
      <h2><span>Eligibility confirmed by HR</span><button type="button" class="lp-btn" *ngIf="d.can_edit" (click)="addElig()" data-lr-elig-add>Confirm an employee</button></h2>
      <p class="lr-hint">For leave types with "HR confirms eligibility" (e.g. Hajj leave, once in service). Only "eligible" and "taken before" are kept – no religion or other personal attribute.</p>
      <table class="lp-table" style="width:100%">
        <thead><tr><th>Employee</th><th>Leave type</th><th>Eligible</th><th>Taken before</th><th>Note</th><th>Confirmed by</th></tr></thead>
        <tbody><tr *ngFor="let e of elig"><td>{{ e.employee }}</td><td>{{ e.leave_type }}</td><td>{{ e.confirmed ? 'Yes' : 'No' }}</td><td>{{ e.taken_before ? 'Yes' : 'No' }}</td><td>{{ e.note }}</td><td>{{ e.confirmed_by }} {{ e.confirmed_at | date:'dd/MM/yyyy' }}</td></tr></tbody>
      </table>
    </div>
  </ng-container>
</div>`,
})
export class LeaveRulesComponent implements OnInit {
  d: any = null; elig: any[] = []; msg = ''; err = false;
  constructor(private http: HttpClient, private rec: ZRecordService, private cd: ChangeDetectorRef) {}
  private url(p = ''): string { return `${this.rec.api}${API}${p}?schema=${localStorage.getItem('selectedSchema') || ''}`; }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    try {
      this.d = await firstValueFrom(this.http.get(this.url()));
      this.elig = (await firstValueFrom(this.http.get(this.url('eligibility/')))) as any[];
    } catch (e) { this.msg = httpErrorText(e); this.err = true; }
    this.cd.markForCheck();
  }
  label(f: string, v: any): string { return ((this.d?.choices?.[f] || []).find((c: any) => c.value === v) || {}).label || v; }
  private opts(f: string): any[] { return (this.d?.choices?.[f] || []).map((c: any) => ({ value: c.value, label: c.label })); }

  async editSettings(): Promise<void> {
    const tc = this.d.to_confirm || {};
    const cfg: ZFormConfig = {
      thing: 'leave rules', endpoint: API, heading: 'Company leave rules', action: 'Save', idOf: () => 'settings',
      subtitle: 'Off / as before unless you change it.',
      sections: [
        { title: 'Requests', fields: [
          { key: 'notice_leave', label: 'Leave during the notice period', type: 'select', options: this.opts('notice_leave'), hint: 'From the resignation date to the last working day. Block: only HR enters such leave.' },
          { key: 'extension_skips_notice', label: 'An extension of an approved leave needs no notice days', type: 'check' },
        ] },
        { title: 'Accrual', fields: [
          { key: 'accrual_reduction', label: 'Unpaid days and annual leave earned (to be confirmed)', type: 'select', options: this.opts('accrual_reduction'), hint: tc.accrual_reduction, full: true },
          { key: 'catch_up', label: 'Credit a missed monthly accrual on the next run', type: 'check' },
          { key: 'catch_up_max_months', label: 'At most (months)', type: 'number' },
        ] },
        { title: 'Pay', fields: [
          { key: 'advance_when', label: 'Leave salary in advance is paid', type: 'select', options: this.opts('advance_when') },
          { key: 'advance_basis', label: 'Leave salary of a day', type: 'select', options: this.opts('advance_basis'), hint: 'Monthly amount ÷ 30 × the paid leave days.' },
          { key: 'exit_under_6m', label: 'Leave pay at exit with less than 6 months (to be confirmed)', type: 'select', options: this.opts('exit_under_6m'), hint: tc.exit_under_6m, full: true },
        ] },
        { title: 'Nursing breaks (UAE law: at most 1 hour a day for 6 months after the delivery)', fields: [
          { key: 'nursing_enabled', label: 'Nursing breaks after maternity leave', type: 'check' },
          { key: 'nursing_minutes', label: 'Minutes a day', type: 'number' },
          { key: 'nursing_months', label: 'Months after the birth', type: 'number' },
        ] },
      ],
      okText: () => 'Leave rules saved.',
    };
    if (await openZForm(cfg, { ...this.d.settings, id: 'settings' })) { await this.load(); }
  }

  async editType(t: any): Promise<void> {
    const tc = this.d.to_confirm || {};
    const cfg: ZFormConfig = {
      thing: 'leave type rules', endpoint: API, heading: t.name, action: 'Save', idOf: (r: any) => r.leave_type_id,
      subtitle: 'Rules of this leave type (its copies in other branches follow it).',
      sections: [
        { title: 'Birth (maternity / parental leave)', fields: [
          { key: 'birth_required', label: 'The date of birth of the child is asked', type: 'check' },
          { key: 'birth_window_months', label: 'Taken within (months of the birth)', type: 'number', showIf: v => !!v.birth_required },
          { key: 'birth_window_from', label: 'Earliest start', type: 'select', options: this.opts('birth_window_from'), showIf: v => !!v.birth_required },
          { key: 'one_per_birth', label: 'The days are per birth (instead of a year)', type: 'check', showIf: v => !!v.birth_required },
        ] },
        { title: 'Counting and balance', fields: [
          { key: 'sandwich', label: 'Sandwich rule: weekends / public holidays between two leave days count as leave', type: 'check', full: true },
          { key: 'allow_projected', label: 'Use the balance projected to the leave start (accrual up to then)', type: 'check', full: true },
          { key: 'document_above_days', label: 'Supporting document only above (days)', type: 'number', hint: 'Empty = as the policy line says.' },
        ] },
        { title: 'Pay', fields: [
          { key: 'advance_salary', label: 'Pay the leave salary before the leave', type: 'check', full: true, hint: 'The payroll of the leave days then takes it back, so the days are not paid twice.' },
          { key: 'nursing_breaks', label: 'Nursing breaks after this leave', type: 'check', hint: t.nursing_default ? 'Maternity leave has them by law when the company setting is on.' : '' },
        ] },
        { title: 'Who may take it', fields: [
          { key: 'hr_eligibility', label: 'HR confirms the eligibility of the employee first (e.g. Hajj)', type: 'check', full: true },
          { key: 'min_service_years', label: 'Years of service needed (to be confirmed)', type: 'number', hint: tc.min_service_years },
          { key: 'notice_exempt', label: 'Allowed during the notice period (e.g. sick leave)', type: 'check' },
        ] },
      ],
      okText: () => 'Rules saved.',
    };
    if (await openZForm(cfg, { ...t, id: t.leave_type_id })) { await this.load(); }
  }

  async addElig(): Promise<void> {
    const types = (this.d.types || []).filter((t: any) => t.hr_eligibility).map((t: any) => ({ value: t.leave_type_id, label: t.name + (t.branch ? ` (${t.branch})` : '') }));
    const cfg: ZFormConfig = {
      thing: 'eligibility', endpoint: API + 'eligibility/', heading: 'Confirm an employee', action: 'Save',
      subtitle: 'Only "eligible" and "taken before" are kept.',
      sections: [{ title: '', fields: [
        { key: 'employee_id', label: 'Employee', type: 'select', required: true, search: true, source: { endpoint: LOOKUPS.employees.endpoint, label: LOOKUPS.employees.label as any } },
        { key: 'leave_type_id', label: 'Leave type', type: 'select', required: true, options: types },
        { key: 'confirmed', label: 'Eligible – confirmed by HR', type: 'check' },
        { key: 'taken_before', label: 'Taken before in this employment', type: 'check' },
        { key: 'note', label: 'Note', type: 'text', full: true },
      ] }],
      initial: { confirmed: true, taken_before: false },
      okText: () => 'Saved.',
    };
    if (await openZForm(cfg)) { await this.load(); }
  }
}
