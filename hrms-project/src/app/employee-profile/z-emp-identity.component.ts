import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeProfileService, eidProblem } from './employee-profile.service';

interface F { key: string; label: string; type?: 'text' | 'date' | 'select' | 'country'; options?: { v: string; l: string }[]; rtl?: boolean; hint?: string; ph?: string; }
interface Sec { title: string; fields: F[]; doc?: string; }

const SECTIONS: Sec[] = [
  { title: 'Names', fields: [
    { key: 'arabic_name', label: 'Name in Arabic', rtl: true, ph: 'الاسم' },
    { key: 'title', label: 'Title', type: 'select', options: ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Eng', 'Prof'].map(v => ({ v, l: v })) },
    { key: 'preferred_name', label: 'Preferred name' }, { key: 'place_of_birth', label: 'Place of birth' }] },
  { title: 'Passport', doc: 'passport', fields: [
    { key: 'passport_no', label: 'Passport number', hint: '6 to 12 letters and digits' },
    { key: 'passport_issue_date', label: 'Issue date', type: 'date' }, { key: 'passport_expiry_date', label: 'Expiry date', type: 'date' },
    { key: 'passport_place_of_issue', label: 'Place of issue' }, { key: 'passport_country_id', label: 'Issuing country', type: 'country' }] },
  { title: 'Residence visa', doc: 'visa', fields: [
    { key: 'visa_type', label: 'Visa type', type: 'select', options: [
      { v: 'employment', l: 'Employment visa' }, { v: 'residence', l: 'Residence (family sponsored)' }, { v: 'investor', l: 'Investor / partner' },
      { v: 'golden', l: 'Golden visa' }, { v: 'green', l: 'Green visa' }, { v: 'freelance', l: 'Freelance permit' }, { v: 'mission', l: 'Mission / work permit' },
      { v: 'visit', l: 'Visit visa' }, { v: 'national', l: 'UAE / GCC national (no visa)' }, { v: 'other', l: 'Other' }] },
    { key: 'visa_number', label: 'Visa / residence number' }, { key: 'visa_uid', label: 'UID number', hint: 'Digits only' },
    { key: 'visa_file_no', label: 'File number', ph: '201/2024/1234567' }, { key: 'visa_issue_date', label: 'Issue date', type: 'date' },
    { key: 'visa_expiry_date', label: 'Expiry date', type: 'date' }, { key: 'visa_sponsor', label: 'Sponsor' }] },
  { title: 'Emirates ID', doc: 'emirates_id', fields: [
    { key: 'emirates_id', label: 'Emirates ID number', ph: '784-YYYY-NNNNNNN-N' },
    { key: 'emirates_id_issue_date', label: 'Issue date', type: 'date' }, { key: 'emirates_id_expiry_date', label: 'Expiry date', type: 'date' }] },
  { title: 'Labour (MOHRE)', doc: 'labour_card', fields: [
    { key: 'labour_card_no', label: 'Labour card number' }, { key: 'labour_card_issue_date', label: 'Labour card issue date', type: 'date' },
    { key: 'labour_card_expiry_date', label: 'Labour card expiry date', type: 'date' },
    { key: 'work_permit_no', label: 'Work permit number' }, { key: 'work_permit_expiry_date', label: 'Work permit expiry date', type: 'date' },
    { key: 'mohre_contract_type', label: 'Contract type', type: 'select', options: [{ v: 'limited', l: 'Limited (fixed term)' }, { v: 'unlimited', l: 'Unlimited' }] },
    { key: 'mohre_contract_no', label: 'MOHRE contract number' }, { key: 'mohre_contract_start', label: 'Contract start', type: 'date' },
    { key: 'mohre_contract_end', label: 'Contract end', type: 'date' }] },
  { title: 'Driving licence', doc: 'driving_licence', fields: [
    { key: 'driving_licence_no', label: 'Licence number' },
    { key: 'driving_licence_issue_date', label: 'Issue date', type: 'date' }, { key: 'driving_licence_expiry_date', label: 'Expiry date', type: 'date' },
    { key: 'driving_licence_emirate', label: 'Issued in', type: 'select', options: [
      { v: 'abu_dhabi', l: 'Abu Dhabi' }, { v: 'dubai', l: 'Dubai' }, { v: 'sharjah', l: 'Sharjah' }, { v: 'ajman', l: 'Ajman' },
      { v: 'umm_al_quwain', l: 'Umm Al Quwain' }, { v: 'ras_al_khaimah', l: 'Ras Al Khaimah' }, { v: 'fujairah', l: 'Fujairah' }, { v: 'other', l: 'Other' }] },
    { key: 'driving_licence_categories', label: 'Categories', ph: 'Light vehicle, Motorcycle' }] },
  { title: 'Medical insurance', fields: [
    { key: 'insurance_provider', label: 'Insurance provider' }, { key: 'insurance_card_no', label: 'Card number' },
    { key: 'insurance_expiry_date', label: 'Expiry date', type: 'date' }] },
];

/**
 * v1.13.0 – "UAE identity" tab of the employee: names in Arabic, passport, visa, Emirates ID, labour card / work permit /
 * MOHRE contract, driving licence and medical insurance. HR edits (own branches); the employee sees it read only ([readonly]).
 * Saving keeps the matching Employee documents (Passport, Visa, Emirates ID, Labour Card, Driving Licence) up to date so the expiry
 * alerts keep working; a number already used on another employee's document is shown here.
 */
@Component({
  selector: 'z-emp-identity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../leave-policy/leave-policy.css', './employee-profile.css'],
  template: `
<div class="ep">
  <div class="ep-bar">
    <span class="grow"></span>
    <ng-container *ngIf="canEdit && !readonly">
      <button type="button" class="lp-btn" *ngIf="!editing" (click)="edit()">Edit identity details</button>
      <ng-container *ngIf="editing">
        <button type="button" class="lp-btn primary" [disabled]="saving" (click)="save()">{{ saving ? 'Saving…' : 'Save' }}</button>
        <button type="button" class="lp-btn" (click)="cancel()">Cancel</button>
      </ng-container>
    </ng-container>
  </div>
  <div class="ep-note err" *ngIf="error">{{ error }}</div>
  <div class="ep-note ok" *ngIf="saved">Saved.</div>
  <div class="ep-note" *ngFor="let p of problems">{{ p }}</div>
  <div class="ep-empty" *ngIf="loading">Loading…</div>
  <div class="ep-empty" *ngIf="denied">{{ denied }}</div>
  <ng-container *ngIf="!loading && !denied">
    <div class="ep-sec" *ngFor="let s of sections">
      <h3>{{ s.title }}
        <span class="ep-tag" *ngIf="s.doc && docLinked(s.doc)" title="Kept in step with the Documents tab (expiry alerts)">In documents</span>
        <span class="ep-tag" [ngClass]="expiryClass(s)" *ngIf="expiryText(s)">{{ expiryText(s) }}</span>
      </h3>
      <div class="ep-grid">
        <div class="ep-f" *ngFor="let f of s.fields" [class.bad]="fieldErr[f.key]">
          <span>{{ f.label }}</span>
          <ng-container *ngIf="!editing">
            <b [class.ep-rtl]="f.rtl">{{ show(f) || '–' }}</b>
          </ng-container>
          <ng-container *ngIf="editing">
            <ng-container [ngSwitch]="f.type || 'text'">
              <input *ngSwitchCase="'date'" type="date" [(ngModel)]="v[f.key]" [attr.aria-label]="s.title + ' ' + f.label">
              <select *ngSwitchCase="'select'" [(ngModel)]="v[f.key]" [attr.aria-label]="f.label">
                <option [ngValue]="''">Not set</option>
                <option *ngFor="let o of f.options" [ngValue]="o.v">{{ o.l }}</option>
              </select>
              <select *ngSwitchCase="'country'" [(ngModel)]="v[f.key]" [attr.aria-label]="f.label">
                <option [ngValue]="null">Not set</option>
                <option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name }}</option>
              </select>
              <input *ngSwitchDefault type="text" [(ngModel)]="v[f.key]" [class.ep-rtl]="f.rtl" [attr.dir]="f.rtl ? 'rtl' : null"
                     [attr.lang]="f.rtl ? 'ar' : null" [placeholder]="f.ph || ''" [attr.aria-label]="f.label">
            </ng-container>
            <small class="err" *ngIf="fieldErr[f.key]">{{ fieldErr[f.key] }}</small>
            <small class="err" *ngIf="!fieldErr[f.key] && f.key === 'emirates_id' && eidMsg()">{{ eidMsg() }}</small>
            <small class="hint" *ngIf="!fieldErr[f.key] && f.hint">{{ f.hint }}</small>
          </ng-container>
        </div>
      </div>
    </div>
  </ng-container>
</div>`,
})
export class ZEmpIdentityComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() readonly = false;

  sections = SECTIONS;
  data: any = {};
  v: any = {};
  countries: { id: number; name: string }[] = [];
  canEdit = false;
  editing = false;
  saving = false;
  loading = true;
  saved = false;
  denied = '';
  error = '';
  problems: string[] = [];
  fieldErr: Record<string, string> = {};

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  async load(fresh = false): Promise<void> {
    this.loading = true;
    this.denied = '';
    try {
      const p = await this.svc.profile(this.employeeId!, fresh);
      this.canEdit = !!p.can_edit;
      this.data = p.identity || {};
      this.problems = Object.values(this.data?.documents?.problems || {}) as string[];
    } catch (e: any) {
      this.denied = e?.status === 403 ? 'You do not have access to these details.' : 'The identity details could not be loaded.';
    }
    this.loading = false;
    this.cd.markForCheck();
  }

  async edit(): Promise<void> {
    this.v = {};
    for (const s of SECTIONS) { for (const f of s.fields) { this.v[f.key] = this.data?.[f.key] ?? (f.type === 'country' ? null : ''); } }
    this.fieldErr = {};
    this.error = '';
    this.saved = false;
    this.editing = true;
    if (!this.countries.length) { this.countries = await this.svc.lookup('countries').catch(() => []); this.cd.markForCheck(); }
  }

  cancel(): void { this.editing = false; this.fieldErr = {}; this.error = ''; }

  eidMsg(): string { return eidProblem(this.v['emirates_id'] || ''); }

  async save(): Promise<void> {
    const body: any = {};
    for (const s of SECTIONS) {
      for (const f of s.fields) {
        const now = this.v[f.key] === '' && f.type === 'date' ? null : this.v[f.key];
        const old = this.data?.[f.key] ?? (f.type === 'date' || f.type === 'country' ? null : '');
        if ((now ?? '') !== (old ?? '')) { body[f.key] = now; }
      }
    }
    if (!Object.keys(body).length) { this.editing = false; return; }
    this.saving = true;
    this.error = '';
    this.fieldErr = {};
    try {
      const d: any = await this.svc.put(`identity/${this.employeeId}/`, body);
      this.problems = Object.values(d?.document_sync || {}).filter((x: any) => x.status === 'problem').map((x: any) => x.message);
      this.svc.forget(this.employeeId!);
      await this.load(true);
      this.editing = false;
      this.saved = true;
    } catch (e: any) {
      const r = this.svc.errors(e);
      this.fieldErr = r.fields;
      this.error = 'Please correct the fields marked below.' + (r.fields['detail'] ? ' ' + r.fields['detail'] : '');
    }
    this.saving = false;
    this.cd.markForCheck();
  }

  show(f: F): string {
    const x = this.data?.[f.key];
    if (x === null || x === undefined || x === '') { return ''; }
    if (f.type === 'date') { const [y, m, d] = String(x).split('-'); return d ? `${d}/${m}/${y}` : String(x); }
    if (f.type === 'select') { return f.options?.find(o => o.v === x)?.l || String(x); }
    if (f.type === 'country') { return this.data?.passport_country_name || String(x); }
    return String(x);
  }

  docLinked(kind: string): boolean { return !!this.data?.documents?.links?.[kind]; }

  private expiryOf(s: Sec): string | null {
    const f = s.fields.find(x => x.key.endsWith('expiry_date'));
    return f ? this.data?.[f.key] || null : null;
  }

  private daysLeft(s: Sec): number | null {
    const e = this.expiryOf(s);
    if (!e) { return null; }
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(e + 'T00:00:00').getTime() - t.getTime()) / 86400000);
  }

  expiryText(s: Sec): string {
    const d = this.daysLeft(s);
    if (d === null) { return ''; }
    return d < 0 ? `Expired ${-d} days ago` : d === 0 ? 'Expires today' : d <= 90 ? `Expires in ${d} days` : 'Valid';
  }

  expiryClass(s: Sec): string {
    const d = this.daysLeft(s);
    return d === null ? '' : d < 0 ? 'bad' : d <= 30 ? 'bad' : d <= 90 ? 'warn' : 'ok';
  }
}
