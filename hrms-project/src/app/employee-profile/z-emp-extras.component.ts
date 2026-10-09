import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EmployeeProfileService, eidProblem, ibanProblem } from './employee-profile.service';

type Kind = 'dependents' | 'bank' | 'qualifications';
interface X { key: string; label: string; type: 'text' | 'date' | 'bool' | 'select' | 'nationality' | 'country' | 'file'; options?: { v: string; l: string }[]; }

const CFG: Record<Kind, { title: string; endpoint: string; name: (r: any) => string; sub: (r: any) => string; fields: X[] }> = {
  dependents: {
    title: 'Dependant identity details', endpoint: 'dependents',
    name: r => r.ef_member_name, sub: r => `${r.emp_relation || ''}${r.ef_date_of_birth ? ' · born ' + r.ef_date_of_birth : ''}`,
    fields: [
      { key: 'gender', label: 'Gender', type: 'select', options: [{ v: 'M', l: 'Male' }, { v: 'F', l: 'Female' }, { v: 'O', l: 'Other' }] },
      { key: 'nationality_id', label: 'Nationality', type: 'nationality' },
      { key: 'passport_no', label: 'Passport number', type: 'text' }, { key: 'passport_expiry_date', label: 'Passport expiry', type: 'date' },
      { key: 'emirates_id', label: 'Emirates ID', type: 'text' }, { key: 'emirates_id_expiry_date', label: 'Emirates ID expiry', type: 'date' },
      { key: 'visa_number', label: 'Visa number', type: 'text' }, { key: 'visa_expiry_date', label: 'Visa expiry', type: 'date' },
      { key: 'insured', label: 'Covered by medical insurance', type: 'bool' }, { key: 'visa_sponsored', label: 'Visa sponsored by the employee', type: 'bool' }],
  },
  bank: {
    title: 'WPS payment details', endpoint: 'bank-extra',
    name: r => `${r.bank_name || 'Bank'} – ${r.account_number || ''}`, sub: r => r.iban_number || 'No IBAN',
    fields: [
      { key: 'payment_mode', label: 'Payment mode', type: 'select', options: [{ v: 'wps', l: 'WPS (salary transfer)' }, { v: 'bank_transfer', l: 'Bank transfer (non-WPS)' }, { v: 'cash', l: 'Cash' }, { v: 'cheque', l: 'Cheque' }] },
      { key: 'wps_agent', label: 'WPS agent ID', type: 'text' }, { key: 'effective_from', label: 'Effective from', type: 'date' },
      { key: 'is_primary', label: 'Salary account', type: 'bool' }],
  },
  qualifications: {
    title: 'Attestation', endpoint: 'qualification-extra',
    name: r => r.emp_qualification, sub: r => `${r.emp_qf_instituition || ''}${r.emp_qf_subject ? ' · ' + r.emp_qf_subject : ''}`,
    fields: [
      { key: 'grade', label: 'Grade / result', type: 'text' }, { key: 'country_id', label: 'Country', type: 'country' },
      { key: 'attested', label: 'Attested (UAE MOFA)', type: 'bool' }, { key: 'attestation_date', label: 'Attestation date', type: 'date' },
      { key: 'equivalency', label: 'Equivalency certificate (MOE)', type: 'bool' }, { key: 'attachment', label: 'Attested copy (PDF, JPG, PNG)', type: 'file' }],
  },
};

/**
 * v1.13.0 – extra UAE details for the rows of the existing Family, Bank and Qualification tabs
 * (dependant passport / Emirates ID / visa / insurance, WPS agent and payment mode with the IBAN check,
 * qualification attestation). The rows themselves are still added and edited in those tabs.
 */
@Component({
  selector: 'z-emp-extras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep ep-sec" *ngIf="cfg && (rows.length || denied)">
  <h3>{{ cfg.title }}</h3>
  <div class="ep-empty" *ngIf="denied">{{ denied }}</div>
  <div class="ep-note err" *ngIf="error">{{ error }}</div>
  <div class="ep-scroll" *ngIf="rows.length">
    <table class="ep-table" zPlain>
      <thead><tr><th>{{ kind === 'bank' ? 'Account' : kind === 'dependents' ? 'Family member' : 'Qualification' }}</th>
        <th *ngFor="let f of cfg.fields">{{ f.label }}</th><th></th></tr></thead>
      <tbody>
        <ng-container *ngFor="let r of rows">
          <tr>
            <td><b>{{ cfg.name(r) }}</b><br><small class="lp-muted">{{ cfg.sub(r) }}</small>
              <ng-container *ngIf="kind === 'bank' && r.iban_number">
                <br><span class="ep-tag" [ngClass]="iban(r.iban_number) ? 'bad' : 'ok'" [title]="iban(r.iban_number) || 'IBAN check digits are correct'">{{ iban(r.iban_number) ? 'IBAN not valid' : 'IBAN valid' }}</span>
              </ng-container>
            </td>
            <td *ngFor="let f of cfg.fields">
              <ng-container [ngSwitch]="f.type">
                <span *ngSwitchCase="'bool'">{{ r.extra?.[f.key] ? 'Yes' : 'No' }}</span>
                <a *ngSwitchCase="'file'" [href]="r.extra?.[f.key]" target="_blank" rel="noopener" [hidden]="!r.extra?.[f.key]">Open</a>
                <span *ngSwitchCase="'select'">{{ opt(f, r.extra?.[f.key]) }}</span>
                <span *ngSwitchCase="'nationality'">{{ name(nationalities, r.extra?.[f.key]) }}</span>
                <span *ngSwitchCase="'country'">{{ r.extra?.country_name || name(countries, r.extra?.[f.key]) }}</span>
                <span *ngSwitchDefault>{{ r.extra?.[f.key] || '–' }}</span>
              </ng-container>
            </td>
            <td><button type="button" class="ep-link" *ngIf="canEdit && !readonly && editId !== r.id" (click)="edit(r)">Edit</button></td>
          </tr>
          <tr *ngIf="editId === r.id">
            <td [attr.colspan]="cfg.fields.length + 2">
              <div class="ep-row-form">
                <div class="ep-grid">
                  <div class="ep-f" *ngFor="let f of cfg.fields" [class.check]="f.type === 'bool'" [class.bad]="ferr[f.key]">
                    <ng-container [ngSwitch]="f.type">
                      <ng-container *ngSwitchCase="'bool'"><input type="checkbox" [(ngModel)]="v[f.key]" [id]="'epx-' + f.key"><label [for]="'epx-' + f.key">{{ f.label }}</label></ng-container>
                      <ng-container *ngSwitchCase="'date'"><span>{{ f.label }}</span><input type="date" [(ngModel)]="v[f.key]"></ng-container>
                      <ng-container *ngSwitchCase="'select'"><span>{{ f.label }}</span>
                        <select [(ngModel)]="v[f.key]"><option [ngValue]="''">Not set</option><option *ngFor="let o of f.options" [ngValue]="o.v">{{ o.l }}</option></select></ng-container>
                      <ng-container *ngSwitchCase="'nationality'"><span>{{ f.label }}</span>
                        <select [(ngModel)]="v[f.key]"><option [ngValue]="null">Not set</option><option *ngFor="let o of nationalities" [ngValue]="o.id">{{ o.name }}</option></select></ng-container>
                      <ng-container *ngSwitchCase="'country'"><span>{{ f.label }}</span>
                        <select [(ngModel)]="v[f.key]"><option [ngValue]="null">Not set</option><option *ngFor="let o of countries" [ngValue]="o.id">{{ o.name }}</option></select></ng-container>
                      <ng-container *ngSwitchCase="'file'"><span>{{ f.label }}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="file = $any($event.target).files?.[0] || null"></ng-container>
                      <ng-container *ngSwitchDefault><span>{{ f.label }}</span><input type="text" [(ngModel)]="v[f.key]"></ng-container>
                    </ng-container>
                    <small class="err" *ngIf="ferr[f.key]">{{ ferr[f.key] }}</small>
                    <small class="err" *ngIf="!ferr[f.key] && f.key === 'emirates_id' && eid(v[f.key])">{{ eid(v[f.key]) }}</small>
                  </div>
                </div>
                <div class="ep-actions">
                  <button type="button" class="lp-btn primary" [disabled]="saving" (click)="save(r)">{{ saving ? 'Saving…' : 'Save' }}</button>
                  <button type="button" class="lp-btn" (click)="editId = null">Cancel</button>
                </div>
              </div>
            </td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  </div>
</div>`,
})
export class ZEmpExtrasComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() kind: Kind = 'dependents';
  @Input() readonly = false;
  /** bump to reload (e.g. after the host tab added a row) */
  @Input() refresh = 0;

  rows: any[] = [];
  canEdit = false;
  editId: number | null = null;
  v: any = {};
  file: File | null = null;
  ferr: Record<string, string> = {};
  error = '';
  denied = '';
  saving = false;
  countries: { id: number; name: string }[] = [];
  nationalities: { id: number; name: string }[] = [];

  constructor(private svc: EmployeeProfileService, private http: HttpClient, private cd: ChangeDetectorRef) {}

  get cfg() { return CFG[this.kind]; }

  ngOnChanges(ch: SimpleChanges): void {
    if ((ch['employeeId'] || ch['refresh'] || ch['kind']) && this.employeeId) { this.load(!!ch['refresh'] && !ch['refresh'].firstChange); }
  }

  async load(fresh = false): Promise<void> {
    try {
      const p = await this.svc.profile(this.employeeId!, fresh);
      this.rows = p[this.kind] || [];
      this.canEdit = !!p.can_edit;
      if (this.kind === 'dependents') { this.nationalities = await this.svc.lookup('nationalities').catch(() => []); }
      if (this.kind === 'qualifications') { this.countries = await this.svc.lookup('countries').catch(() => []); }
    } catch (e: any) { this.denied = e?.status === 403 ? '' : 'These details could not be loaded.'; }
    this.cd.markForCheck();
  }

  iban(v: string): string { return ibanProblem(v); }
  eid(v: string): string { return eidProblem(v || ''); }
  opt(f: X, val: any): string { return f.options?.find(o => o.v === val)?.l || '–'; }
  name(list: { id: number; name: string }[], id: any): string { return list.find(x => x.id === id)?.name || (id ? String(id) : '–'); }

  edit(r: any): void {
    this.editId = r.id;
    this.file = null;
    this.ferr = {};
    this.error = '';
    this.v = {};
    for (const f of this.cfg.fields) {
      if (f.type === 'file') { continue; }
      const cur = r.extra?.[f.key];
      this.v[f.key] = cur ?? (f.type === 'bool' ? false : f.type === 'nationality' || f.type === 'country' ? null : f.type === 'select' && this.kind === 'bank' ? 'wps' : '');
    }
  }

  async save(r: any): Promise<void> {
    this.saving = true;
    this.ferr = {};
    this.error = '';
    try {
      const url = this.svc.url(`${this.cfg.endpoint}/${r.id}/`);
      if (this.file) {
        const fd = new FormData();
        for (const [k, val] of Object.entries(this.v)) { if (val !== null && val !== undefined) { fd.append(k, typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val)); } }
        fd.append('attachment', this.file);
        await firstValueFrom(this.http.put(url, fd));
      } else {
        const body: any = {};
        for (const [k, val] of Object.entries(this.v)) { body[k] = val === '' && this.cfg.fields.find(f => f.key === k)?.type === 'date' ? null : val; }
        await firstValueFrom(this.http.put(url, body));
      }
      this.editId = null;
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
