/**
 * v1.62.1 – "New employee" in the new design (replaces the classic Create Employee form on the Employees list).
 * Asks only what is needed to start the employee; everything else is completed on the employee page, which opens on save.
 * Nothing is compulsory beyond what the server needs: first name, branch, joining date, and the employee code only when
 * automatic numbering is off for the branch. API: employee/api/Employee/ (create), employee-profile/api/code-settings/next/,
 * employee-profile/api/duplicates/, employee-profile/api/record-lookups/.
 */
import { ChangeDetectorRef, Component, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { ZDateFieldComponent } from '../shared-ui/z-date-field.component';
import { ErService, erPage } from './er.service';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';

type Opt = { value: any; label: string };

@Component({
  selector: 'app-employee-new',
  standalone: true,
  imports: [CommonModule, FormsModule, ZDateFieldComponent],
  styleUrls: ['./er.css'],
  template: `
<div class="en-wrap" (keydown.escape)="close()">
  <div class="en-head">
    <div>
      <h2 class="en-title">{{ t('New employee') }}</h2>
      <p class="en-sub">{{ t('Enter the basics now. Documents, salary, leave and the other details are added on the employee page that opens after saving.') }}</p>
    </div>
    <button type="button" class="er-btn icon" (click)="close()" [attr.aria-label]="t('Close')">×</button>
  </div>

  <div class="en-body" *ngIf="!loading; else wait">
    <section class="en-sec">
      <h3>{{ t('Personal information') }}</h3>
      <!-- v1.67.5 (bugs) E1: the photo on the New employee form (before: none – it could be added only on the employee page) -->
      <div class="en-photo" data-en-photo>
        <span class="en-av" [class.has]="!!photoUrl">
          <img *ngIf="photoUrl" [src]="photoUrl" alt="" data-en-photo-img>
          <span *ngIf="!photoUrl" aria-hidden="true">{{ initials() }}</span>
        </span>
        <div class="en-photo-t"><b>{{ t('Photo') }}</b><small>{{ photoErr || t('JPG, PNG or WebP, up to 5 MB.') }}</small>
          <span class="en-photo-a">
            <label class="er-btn sm">{{ t(photoUrl ? 'Change photo' : 'Upload photo') }}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" (change)="pickPhoto($event)" hidden data-en-photo-input></label>
            <button type="button" class="er-btn sm" *ngIf="photoUrl" (click)="clearPhoto()">{{ t('Remove photo') }}</button>
          </span></div>
      </div>
      <div class="en-grid">
        <label class="en-f"><span class="en-l">{{ t('First name') }} <span class="en-req" aria-hidden="true">*</span></span>
          <input [(ngModel)]="f.emp_first_name" maxlength="100" autocomplete="off" [class.bad]="err['emp_first_name']" id="en-first">
          <small class="en-err" *ngIf="err['emp_first_name']">{{ err['emp_first_name'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Middle name') }}</span><input [(ngModel)]="f.emp_middle_name" maxlength="100" autocomplete="off"></label>
        <label class="en-f"><span class="en-l">{{ t('Last name') }}</span><input [(ngModel)]="f.emp_last_name" maxlength="100" autocomplete="off"></label>
        <label class="en-f"><span class="en-l">{{ t('Gender') }}</span>
          <select [(ngModel)]="f.emp_gender"><option value="">–</option><option *ngFor="let o of genders" [value]="o.value">{{ t(o.label) }}</option></select></label>
        <label class="en-f"><span class="en-l">{{ t('Date of birth') }}</span><z-date-field [label]="t('Date of birth')" [(value)]="f.emp_date_of_birth" [max]="today"></z-date-field>
          <small class="en-err" *ngIf="err['emp_date_of_birth']">{{ err['emp_date_of_birth'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Nationality') }}</span>
          <select [(ngModel)]="f.emp_nationality"><option value="">–</option><option *ngFor="let o of look.nationalities" [ngValue]="o.value">{{ o.label }}</option></select></label>
      </div>
    </section>

    <section class="en-sec">
      <h3>{{ t('Job') }}</h3>
      <div class="en-grid">
        <label class="en-f"><span class="en-l">{{ t('Branch') }} <span class="en-req" aria-hidden="true">*</span></span>
          <select [(ngModel)]="f.emp_branch_id" (ngModelChange)="codeCheck()" [class.bad]="err['emp_branch_id']">
            <option [ngValue]="null">–</option><option *ngFor="let o of look.branches" [ngValue]="o.value">{{ o.label }}</option></select>
          <small class="en-err" *ngIf="err['emp_branch_id']">{{ err['emp_branch_id'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Employee code') }} <span class="en-req" aria-hidden="true" *ngIf="!auto">*</span></span>
          <input [(ngModel)]="f.emp_code" maxlength="50" autocomplete="off" [placeholder]="auto ? (next ? t('Automatic – next {0}', [next]) : t('Automatic')) : ''" [class.bad]="err['emp_code']">
          <small class="en-hint" *ngIf="auto">{{ t('Leave empty to number it automatically.') }}</small>
          <small class="en-err" *ngIf="err['emp_code']">{{ err['emp_code'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Joining date') }} <span class="en-req" aria-hidden="true">*</span></span>
          <z-date-field [label]="t('Joining date')" [(value)]="f.emp_joined_date"></z-date-field>
          <small class="en-err" *ngIf="err['emp_joined_date']">{{ err['emp_joined_date'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Department') }}</span>
          <select [(ngModel)]="f.emp_dept_id"><option [ngValue]="null">–</option><option *ngFor="let o of look.departments" [ngValue]="o.value">{{ o.label }}</option></select></label>
        <label class="en-f"><span class="en-l">{{ t('Designation') }}</span>
          <select [(ngModel)]="f.emp_desgntn_id"><option [ngValue]="null">–</option><option *ngFor="let o of look.designations" [ngValue]="o.value">{{ o.label }}</option></select></label>
        <label class="en-f"><span class="en-l">{{ t('Category') }}</span>
          <select [(ngModel)]="f.emp_ctgry_id"><option [ngValue]="null">–</option><option *ngFor="let o of look.categories" [ngValue]="o.value">{{ o.label }}</option></select></label>
      </div>
    </section>

    <section class="en-sec">
      <h3>{{ t('Contact details') }}</h3>
      <div class="en-grid">
        <label class="en-f"><span class="en-l">{{ t('Company e-mail') }}</span><input type="email" [(ngModel)]="f.emp_company_email" (blur)="dupCheck()" maxlength="254" autocomplete="off" [class.bad]="err['emp_company_email']">
          <small class="en-err" *ngIf="err['emp_company_email']">{{ err['emp_company_email'] }}</small></label>
        <label class="en-f"><span class="en-l">{{ t('Personal e-mail') }}</span><input type="email" [(ngModel)]="f.emp_personal_email" (blur)="dupCheck()" maxlength="254" autocomplete="off"></label>
        <label class="en-f"><span class="en-l">{{ t('Mobile number') }}</span><input type="tel" [(ngModel)]="f.emp_mobile_number_1" (blur)="dupCheck()" maxlength="20" autocomplete="off" dir="ltr"></label>
      </div>
      <label class="en-check"><input type="checkbox" [(ngModel)]="f.is_ess"> {{ t('Give self-service (ESS) access') }}</label>
      <div class="en-dup" *ngIf="dups.length" role="status">
        <strong>{{ t('Possible duplicate') }}</strong>
        <span *ngFor="let d of dups">{{ d.label }}: <a href="javascript:void(0)" (click)="openDup(d.employee_id)">{{ d.employee }} ({{ d.code }})</a></span>
      </div>
    </section>

    <p class="en-err en-top" *ngIf="err['_']" role="alert">{{ err['_'] }}</p>
  </div>
  <ng-template #wait><div class="en-body en-wait">{{ t('Loading…') }}</div></ng-template>

  <div class="en-foot">
    <button type="button" class="er-btn" (click)="close()" [disabled]="busy">{{ t('Cancel') }}</button>
    <span class="er-spacer"></span>
    <button type="button" class="er-btn" (click)="save(true)" [disabled]="busy || loading">{{ t('Save and add another') }}</button>
    <button type="button" class="er-btn primary" (click)="save(false)" [disabled]="busy || loading">{{ busy ? t('Saving…') : t('Save and open employee') }}</button>
  </div>
</div>`,
  styles: [`
    .en-wrap { display: flex; flex-direction: column; height: 100%; max-height: 90vh; background: var(--z-surface, #fff); }
    .en-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px 12px; border-bottom: 1px solid var(--z-line, #E3E5EE); }
    .en-title { margin: 0; font-size: 20px; font-weight: 650; }
    .en-sub { margin: 4px 0 0; color: var(--z-muted, #6B7085); font-size: 13px; max-width: 70ch; }
    .en-body { flex: 1; overflow: auto; padding: 8px 24px 16px; }
    .en-wait { display: grid; place-items: center; min-height: 240px; color: var(--z-muted, #6B7085); }
    .en-sec { padding: 14px 0 6px; border-bottom: 1px solid var(--z-line, #E3E5EE); }
    .en-sec:last-of-type { border-bottom: 0; }
    .en-sec h3 { margin: 0 0 10px; font-size: 14px; font-weight: 650; }
    .en-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 16px; }
    @media (max-width: 860px) { .en-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 560px) { .en-grid { grid-template-columns: 1fr; } }
    .en-f { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: var(--z-muted, #6B7085); min-width: 0; }
    .en-f input, .en-f select { height: 36px; padding: 0 10px; border: 1px solid var(--z-line, #E3E5EE); border-radius: 8px; font: inherit; font-size: 14px;
      color: var(--z-ink, #1D2033); background: var(--z-surface, #fff); min-width: 0; }
    .en-f input:focus-visible, .en-f select:focus-visible { outline: 2px solid var(--z-primary, #5B4FE0); outline-offset: 1px; }
    .en-f .bad { border-color: var(--z-bad, #D64550); }
    .en-f z-date-field { display: block; width: 100%; }
    .en-f ::ng-deep .zdf { display: flex; width: 100%; height: 36px; box-sizing: border-box; border-radius: 8px; }
    .en-f ::ng-deep .zdf input[type=text] { flex: 1; width: auto; min-width: 0; height: 34px; font-size: 14px; }
    .en-f ::ng-deep .zdf-cal { height: 34px; }
    .en-l { line-height: 1.3; }
    .en-req { color: var(--z-bad, #D64550); }
    .en-err { color: var(--z-bad, #D64550); font-size: 12px; }
    .en-top { margin: 12px 0 0; }
    .en-hint { color: var(--z-muted, #6B7085); font-size: 12px; }
    .en-check { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13.5px; }
    .en-dup { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: #FFF6E5; border: 1px solid #F3D9A4; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; }
    .en-foot { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-top: 1px solid var(--z-line, #E3E5EE); }
    /* v1.67.5 (bugs) E1 */
    .en-photo { display: flex; align-items: center; gap: 14px; margin: 0 0 12px; }
    .en-av { flex: none; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; display: inline-flex; align-items: center; justify-content: center;
      background: #E9E7FB; color: #3F35B5; font-weight: 600; font-size: 20px; }
    .en-av img { width: 100%; height: 100%; object-fit: cover; }
    .en-photo-t { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 13px; }
    .en-photo-t small { color: var(--z-muted, #6B7085); font-size: 12px; }
    .en-photo-a { display: flex; flex-wrap: wrap; gap: 8px; }
    .en-photo-a label { cursor: pointer; margin: 0; }
  `]
})
export class EmployeeNewComponent implements OnInit {
  t = i18nT;
  loading = true; busy = false;
  look: any = { branches: [], departments: [], designations: [], categories: [], nationalities: [] };
  genders: Opt[] = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }];
  today = EmployeeNewComponent.localDay();
  auto = false; next = '';
  dups: any[] = [];
  err: Record<string, string> = {};
  created = 0;
  f: any = this.blank();

  constructor(private api: ErService, private router: Router, private cd: ChangeDetectorRef, @Optional() private ref: MatDialogRef<EmployeeNewComponent>) {}

  /** Today in the browser's own time zone (toISOString would give the UTC day). */
  static localDay(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  private blank(): any {
    return { emp_first_name: '', emp_middle_name: '', emp_last_name: '', emp_gender: '', emp_date_of_birth: '', emp_nationality: '',
      emp_branch_id: this.f?.emp_branch_id ?? null, emp_code: '', emp_joined_date: this.f?.emp_joined_date || EmployeeNewComponent.localDay(),
      emp_dept_id: null, emp_desgntn_id: null, emp_ctgry_id: null,
      emp_company_email: '', emp_personal_email: '', emp_mobile_number_1: '', is_ess: false };
  }

  async ngOnInit(): Promise<void> {
    try {
      this.look = await this.api.lookups(true);
      // the branch ticked in the top bar (first one), else the only branch the user has
      let ticked: number[] = [];
      try { ticked = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]'); } catch { ticked = []; }
      const ids = (this.look.branches || []).map((b: Opt) => Number(b.value));
      // nothing ticked = all branches: the first of the user's branches (it can be changed)
      const pick = ticked.map(Number).find(i => ids.includes(i)) ?? (ids.length ? ids[0] : null);
      this.f.emp_branch_id = pick ?? null;
      await this.codeCheck();
    } catch (e) {
      this.err = { _: ErService.error(e) };
    }
    this.loading = false; this.cd.detectChanges();
    setTimeout(() => (document.getElementById('en-first') as HTMLInputElement | null)?.focus(), 50);
  }

  async codeCheck(): Promise<void> {
    try {
      const r: any = await this.api.get('employee-profile/api/code-settings/next/', this.f.emp_branch_id ? { branch: this.f.emp_branch_id } : {});
      this.auto = !!r?.enabled; this.next = r?.next_code || '';
    } catch { this.auto = false; this.next = ''; }
    this.cd.detectChanges();
  }

  async dupCheck(): Promise<void> {
    const q: any = { company_email: this.f.emp_company_email, personal_email: this.f.emp_personal_email, mobile: this.f.emp_mobile_number_1 };
    if (!Object.values(q).some(v => v)) { this.dups = []; return; }
    try { const r: any = await this.api.get('employee-profile/api/duplicates/', q); this.dups = r?.matches || []; } catch { this.dups = []; }
    this.cd.detectChanges();
  }

  openDup(id: number): void { this.close(); this.router.navigate([erPage(id)]); }

  private check(): boolean {
    const e: Record<string, string> = {};
    if (!(this.f.emp_first_name || '').trim()) { e['emp_first_name'] = i18nT('Enter the first name.'); }
    if (!this.f.emp_branch_id) { e['emp_branch_id'] = i18nT('Choose the branch.'); }
    if (!this.f.emp_joined_date) { e['emp_joined_date'] = i18nT('Enter the joining date.'); }
    if (!this.auto && !(this.f.emp_code || '').trim()) { e['emp_code'] = i18nT('Enter the employee code (automatic numbering is off for this branch).'); }
    const mail = (this.f.emp_company_email || '').trim();
    if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { e['emp_company_email'] = i18nT('Enter a valid e-mail address.'); }
    this.err = e;
    return !Object.keys(e).length;
  }

  async save(another: boolean): Promise<void> {
    if (this.busy || !this.check()) { this.cd.detectChanges(); return; }
    this.busy = true; this.cd.detectChanges();
    const body: any = {};
    Object.entries(this.f).forEach(([k, v]) => {
      if (k === 'is_ess') { body[k] = v ? 1 : 0; return; }
      if (v !== null && v !== undefined && String(v).trim() !== '') { body[k] = typeof v === 'string' ? v.trim() : v; }
    });
    body.emp_status = 1; body.is_active = true; body.emp_ot_applicable = false;
    try {
      const r: any = await this.api.post('employee/api/Employee/', body);
      await this.savePhoto(r?.id);   // v1.67.5 (bugs) E1
      this.created++;
      const name = [this.f.emp_first_name, this.f.emp_last_name].filter(Boolean).join(' ');
      zToast(i18nT('{0} added as {1}', [name, r?.emp_code || this.f.emp_code || '']), 'ok');
      if (another) {
        this.f = this.blank(); this.dups = []; this.err = {};
        await this.codeCheck();
        setTimeout(() => (document.getElementById('en-first') as HTMLInputElement | null)?.focus(), 50);
      } else {
        this.ref?.close({ created: this.created, id: r?.id });
        if (r?.id) { this.router.navigate([erPage(r.id)]); }
      }
    } catch (e: any) {
      const b = e?.error;
      const out: Record<string, string> = {};
      if (b && typeof b === 'object' && !Array.isArray(b)) {
        Object.entries(b).forEach(([k, v]) => { out[k in this.f ? k : '_'] = (Array.isArray(v) ? v.join(' ') : String(v)); });
      } else { out['_'] = ErService.error(e); }
      if (out['_'] === undefined && !Object.keys(out).some(k => k in this.f)) { out['_'] = ErService.error(e); }
      this.err = out;
    }
    this.busy = false; this.cd.detectChanges();
  }

  close(): void { this.clearPhoto(); this.ref?.close({ created: this.created }); }

  // v1.67.5 (bugs) E1: the chosen photo is previewed at once and saved on the new employee right after it is created
  photo: File | null = null; photoUrl = ''; photoErr = '';
  initials(): string { return ((this.f?.emp_first_name || '').trim()[0] || '') + ((this.f?.emp_last_name || '').trim()[0] || '') || '?'; }
  pickPhoto(ev: any): void {
    const f: File | undefined = ev?.target?.files?.[0]; if (ev?.target) { ev.target.value = ''; } if (!f) { return; }
    this.photoErr = '';
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(f.type || '')) { this.photoErr = i18nT('Choose a JPG, PNG or WebP picture.'); this.cd.detectChanges(); return; }
    if (f.size > 5 * 1024 * 1024) { this.photoErr = i18nT('The picture is larger than 5 MB.'); this.cd.detectChanges(); return; }
    this.clearPhoto(); this.photo = f; this.photoUrl = URL.createObjectURL(f); this.cd.detectChanges();
  }
  clearPhoto(): void { if (this.photoUrl) { URL.revokeObjectURL(this.photoUrl); } this.photo = null; this.photoUrl = ''; }
  private async savePhoto(id: number): Promise<void> {
    if (!this.photo || !id) { return; }
    const fd = new FormData(); fd.append('emp_profile_pic', this.photo, this.photo.name);
    try { await this.api.patch(`employee/api/Employee/${id}/`, fd); }
    catch (e) { zToast(ErService.error(e, 'The employee was added, but the photo could not be saved – add it on the employee page.'), 'err'); }
    this.clearPhoto();
  }
}
