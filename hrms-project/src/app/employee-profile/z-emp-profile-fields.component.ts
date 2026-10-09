import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeProfileService } from './employee-profile.service';

/**
 * v1.13.0 – <z-emp-profile-fields>: name in Arabic (right-to-left), title and preferred name on the employee
 * create / edit forms. The screen calls `save(employeeId)` after its own save (resolves to an error text or '').
 * Same column markup as the employee form (host is display:contents).
 */
@Component({
  selector: 'z-emp-profile-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: contents; }
    .zp-col { padding-left: calc(var(--bs-gutter-x, 1.5rem) * .5); padding-right: calc(var(--bs-gutter-x, 1.5rem) * .5); }
    .zp-col label { font-weight: 600; color: #334155; margin-bottom: 5px; display: block; font-size: 13px; }
    .zp-col .form-control { margin-bottom: 14px; border-radius: 8px; height: 40px; border: 1px solid #cbd5e1; box-shadow: none; font-size: 13px; }
    .zp-rtl { direction: rtl; text-align: right; font-family: 'Noto Naskh Arabic', 'Segoe UI', Tahoma, sans-serif; }
    .zp-err { color: #b42318; font-size: 12px; margin: -10px 0 8px; }
  `],
  template: `
<div [class]="colClass + ' zp-col'">
  <label for="zp-title">Title</label>
  <select id="zp-title" class="form-control" [(ngModel)]="v.title" [ngModelOptions]="{standalone: true}">
    <option value="">Not set</option>
    <option *ngFor="let t of titles" [value]="t">{{ t }}</option>
  </select>
</div>
<div [class]="colClass + ' zp-col'">
  <label for="zp-arabic">Name in Arabic</label>
  <input id="zp-arabic" type="text" dir="rtl" lang="ar" class="form-control zp-rtl" placeholder="الاسم بالعربية" [(ngModel)]="v.arabic_name" [ngModelOptions]="{standalone: true}">
  <div class="zp-err" *ngIf="errors['arabic_name']">{{ errors['arabic_name'] }}</div>
</div>
<div [class]="colClass + ' zp-col'">
  <label for="zp-pref">Preferred name</label>
  <input id="zp-pref" type="text" class="form-control" placeholder="Name used day to day" [(ngModel)]="v.preferred_name" [ngModelOptions]="{standalone: true}">
</div>`,
})
export class ZEmpProfileFieldsComponent implements OnChanges {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() colClass = 'col-md-6';
  titles = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Eng', 'Prof'];
  v: any = { arabic_name: '', title: '', preferred_name: '' };
  private orig: any = { arabic_name: '', title: '', preferred_name: '' };
  errors: Record<string, string> = {};

  constructor(private svc: EmployeeProfileService, private cd: ChangeDetectorRef) {}

  ngOnChanges(ch: SimpleChanges): void { if (ch['employeeId'] && this.employeeId) { this.load(); } }

  private async load(): Promise<void> {
    try {
      const d: any = await this.svc.get(`identity/${this.employeeId}/`);
      this.orig = { arabic_name: d?.arabic_name || '', title: d?.title || '', preferred_name: d?.preferred_name || '' };
      this.v = { ...this.orig };
    } catch { /* no rights: leave empty */ }
    this.cd.markForCheck();
  }

  /** saves what changed for the employee (call after the employee itself is saved) */
  async save(employeeId?: number | string | null): Promise<string> {
    const id = employeeId || this.employeeId;
    if (!id) { return ''; }
    const body: any = {};
    for (const k of ['arabic_name', 'title', 'preferred_name']) { if ((this.v[k] || '') !== (this.orig[k] || '')) { body[k] = (this.v[k] || '').trim(); } }
    if (!Object.keys(body).length) { return ''; }
    this.errors = {};
    try {
      await this.svc.put(`identity/${id}/`, body);
      this.orig = { ...this.orig, ...body };
      this.svc.forget(id);
      return '';
    } catch (e: any) {
      const r = this.svc.errors(e, 'The name in Arabic could not be saved.');
      this.errors = r.fields;
      this.cd.markForCheck();
      return r.text;
    }
  }
}
