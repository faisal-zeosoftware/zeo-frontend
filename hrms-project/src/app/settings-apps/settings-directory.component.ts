// v1.67.3 (apps) – Settings › Company › Employee directory: the company core's list of employees, there with or without HR.
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18N_UI, i18nT } from '../shared-ui/i18n.service';
import { ZListDirective } from '../shared-ui/z-list.directive';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';

/** The form of one employee: the basic fields only. The same records are the HR employees when HR is active. */
export const DIRECTORY_FORM: ZFormConfig = {
  thing: 'employee', endpoint: '/zeo-apps/api/directory/',
  subtitle: 'The employee directory of the company: projects, maintenance, HSE and the other apps pick their people from it. When HR is activated the same employees are the HR employees.',
  sections: [
    { title: 'Employee', fields: [
      { key: 'emp_code', label: 'Employee code', max: 50, hint: 'Empty = the next number when employee numbering is on for the branch.' },
      { key: 'emp_first_name', label: 'First name', max: 50, required: true },
      { key: 'emp_last_name', label: 'Last name', max: 50 },
      { key: 'emp_branch_id', label: 'Branch', type: 'select', required: true, source: { endpoint: '/organisation/api/Branch/', label: 'branch_name' } },
      { key: 'emp_dept_id', label: 'Department', type: 'select', source: { endpoint: '/organisation/api/Department/', label: 'dept_name' } },
      { key: 'emp_desgntn_id', label: 'Designation', type: 'select', source: { endpoint: '/organisation/api/Designation/', label: 'desgntn_job_title' } },
    ] },
    { title: 'Contact and status', fields: [
      { key: 'emp_company_email', label: 'Company e-mail', type: 'email' },
      { key: 'emp_mobile_number_1', label: 'Mobile', placeholder: '+971 50 123 4567' },
      { key: 'emp_joined_date', label: 'Joining date', type: 'date', hint: 'Empty = today.' },
      { key: 'status', label: 'Status', type: 'select', editOnly: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    ] },
  ],
};

@Component({
  selector: 'app-settings-directory',
  standalone: true,
  imports: [CommonModule, MatIconModule, ZListDirective, ...I18N_UI],
  styleUrls: ['../leave-policy/leave-policy.css', './settings-apps.css'],
  template: `
<div class="container sa-wrap" data-directory>
  <div class="lp-head">
    <div>
      <h1 class="page-title">{{ 'Employee directory' | t }}</h1>
      <p class="lp-desc">{{ 'Name, code, branch, department, designation, contact and status of every employee. Part of the company core: it is there with or without the HR app, and the other apps pick their people from it.' | t }}</p>
    </div>
    <div class="sa-dir-actions">
      <button type="button" class="lp-btn" [class.primary]="status === 'active'" (click)="show('active')">{{ 'Active' | t }}</button>
      <button type="button" class="lp-btn" [class.primary]="status === 'inactive'" (click)="show('inactive')">{{ 'Inactive' | t }}</button>
      <button type="button" class="lp-btn primary" *ngIf="canAdd" (click)="add()" data-dir-new>{{ 'New employee' | t }}</button>
    </div>
  </div>
  <div class="sa-core" *ngIf="hrActive === false" data-dir-nohr>
    <mat-icon aria-hidden="true">info</mat-icon>
    <span>{{ 'HR is not active: leave, attendance, documents, letters and self service are not used. When HR is activated in Settings › Apps these employees are the HR employees – nothing is entered again.' | t }}</span>
  </div>
  <div class="lp-msg err" *ngIf="msg" role="alert">{{ msg }}</div>
  <p class="lp-muted" *ngIf="loading">{{ 'Loading…' | t }}</p>
  <div class="sa-dir-card" *ngIf="!loading">
    <table class="table">
      <thead><tr>
        <th>{{ 'Employee code' | t }}</th><th>{{ 'Name' | t }}</th><th>{{ 'Branch' | t }}</th><th>{{ 'Department' | t }}</th>
        <th>{{ 'Designation' | t }}</th><th>{{ 'Company e-mail' | t }}</th><th>{{ 'Mobile' | t }}</th><th>{{ 'Status' | t }}</th><th>{{ 'Actions' | t }}</th>
      </tr></thead>
      <tbody>
        <tr *ngFor="let e of rows" [attr.data-emp]="e.emp_code">
          <td>{{ e.emp_code }}</td><td>{{ e.name }}</td><td>{{ e.branch }}</td><td>{{ e.department }}</td><td>{{ e.designation }}</td>
          <td>{{ e.emp_company_email }}</td><td>{{ e.emp_mobile_number_1 }}</td><td>{{ (e.status === 'active' ? 'Active' : 'Inactive') | t }}</td>
          <td><button type="button" class="lp-btn" *ngIf="canChange" (click)="edit(e)">{{ 'Edit' | t }}</button></td>
        </tr>
      </tbody>
    </table>
    <p class="lp-muted" *ngIf="!rows.length">{{ 'No employees yet.' | t }}</p>
  </div>
</div>`,
})
export class SettingsDirectoryComponent implements OnInit {
  rows: any[] = []; loading = true; msg = ''; status: 'active' | 'inactive' = 'active';
  canAdd = false; canChange = false; hrActive: boolean | null = null;
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}
  ngOnInit(): void { this.load(); }
  private url(): string {
    let schema = '';
    try { schema = localStorage.getItem('selectedSchema') || ''; } catch { schema = ''; }
    return `${environment.apiBaseUrl}/zeo-apps/api/directory/?schema=${encodeURIComponent(schema)}&status=${this.status}&page_size=1000`;
  }
  async load(): Promise<void> {
    this.loading = true; this.msg = ''; this.cd.markForCheck();
    try {
      const r: any = await firstValueFrom(this.http.get(this.url()));
      this.rows = r.results || []; this.canAdd = !!r.can_add; this.canChange = !!r.can_change; this.hrActive = r.hr_active !== false;
    } catch (e: any) { this.msg = e?.error?.detail || i18nT('The employees could not be loaded.'); this.rows = []; }
    this.loading = false; this.cd.markForCheck();
  }
  show(s: 'active' | 'inactive'): void { if (s !== this.status) { this.status = s; this.load(); } }
  async add(): Promise<void> { if (await openZForm(DIRECTORY_FORM)) { this.load(); } }
  async edit(e: any): Promise<void> { if (await openZForm(DIRECTORY_FORM, { ...e })) { this.load(); } }
}

export const SETTINGS_DIRECTORY_ROUTES: Routes = [
  { path: 'employee-directory', component: SettingsDirectoryComponent, data: { title: 'Employee directory' } },
];
