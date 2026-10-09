import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, firstValueFrom } from 'rxjs';
import { OrgField, OrgSettings, OrgSettingsService } from './org-settings.service';

/**
 * v1.12.0 – <z-emp-org-fields>: the organisation fields that are switched on in Organisation settings
 * (Location, Division, Section, Cost centre, Grade, Job position, Employment type + contract end date),
 * placed right after Department on the employee screens. Nothing is shown when every field is off.
 *
 *   mode="edit"  (create / edit forms)  – drop-downs; the screen calls `save(employeeId)` after its own save
 *                                        and may call `problems()` first (required fields).
 *   mode="view"  (details / ESS)         – read only; [mine]="true" reads the user's own record (ESS).
 *   layout="form" (col-md-6 + label/select, like the employee form) | "details" (h2/h3 like employee details)
 *         | "ess" (strong/small like the ESS profile)
 *
 * Inputs departmentId / designationId / branchId narrow the lists (sections of the department, grades allowed
 * for the designation, positions of the department, masters of the branch) – the server checks the same rules.
 */
@Component({
  selector: 'z-emp-org-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: contents; }
    .zo-err { color: #b42318; font-size: 12px; margin-top: 2px; }
    .zo-hint { color: #6b7185; font-size: 11.5px; margin-top: 2px; }
    .zo-ess strong { font-weight: 600; }
    /* v1.12.0: the host is display:contents, so Bootstrap's ".row > *" gutter and the form's scoped label / input
       styles do not reach these columns – give them the same look as the fields around them */
    .zo-col { padding-left: calc(var(--bs-gutter-x, 1.5rem) * .5); padding-right: calc(var(--bs-gutter-x, 1.5rem) * .5); }
    .zo-col label { font-weight: 600; color: #334155; margin-bottom: 5px; display: block; font-size: 13px; }
    /* details page: same small grey label / dark value as the other employee details (their styles are scoped) */
    .zo-dv h2 { font-size: 14px; color: grey; font-weight: 500; margin: 8px 0 4px; }
    .zo-dv h3 { font-size: 14px; color: black; font-weight: 500; letter-spacing: 1px; margin: 0 0 8px; }
    .zo-col .form-control { margin-bottom: 14px; border-radius: 8px; height: 40px; border: 1px solid #cbd5e1; box-shadow: none; font-size: 13px; }
  `],
  template: `
<ng-container *ngIf="fields.length">
  <!-- edit: same markup as the employee form -->
  <ng-container *ngIf="mode === 'edit'">
    <div [class]="colClass + ' zo-col'" *ngFor="let f of fields">
      <div class="custom-sel">
        <label [attr.for]="'zo-' + f.field">{{ f.label }}<span class="required-star" *ngIf="f.mandatory">*</span></label>
        <select class="form-control" [id]="'zo-' + f.field" [(ngModel)]="values[f.field]" [ngModelOptions]="{standalone: true}"
                (ngModelChange)="changed(f.field)" [ngClass]="{'error-field': showErrors && f.mandatory && !values[f.field]}">
          <option [ngValue]="null">{{ f.mandatory ? 'Select' : 'None' }}</option>
          <option *ngFor="let o of optionsFor(f.field)" [ngValue]="o.value">{{ o.label }}</option>
        </select>
        <div class="zo-err" *ngIf="errors[f.field]">{{ errors[f.field] }}</div>
        <div class="zo-err" *ngIf="!errors[f.field] && showErrors && f.mandatory && !values[f.field]">{{ f.label }} is required.</div>
        <div class="zo-hint" *ngIf="f.field === 'section' && !departmentId">Choose the department first.</div>
      </div>
    </div>
    <div [class]="colClass + ' zo-col'" *ngIf="showEndDate">
      <label for="zo-contract-end">Contract end date</label>
      <input type="date" class="form-control" id="zo-contract-end" [(ngModel)]="values['contract_end_date']" [ngModelOptions]="{standalone: true}">
      <div class="zo-err" *ngIf="errors['contract_end_date']">{{ errors['contract_end_date'] }}</div>
    </div>
    <div class="col-md-12 zo-err" *ngIf="errors['detail']">{{ errors['detail'] }}</div>
  </ng-container>

  <!-- view -->
  <ng-container *ngIf="mode === 'view'">
    <ng-container *ngIf="layout === 'ess'">
      <div class="col-md-3 zo-ess" *ngFor="let f of fields">
        <div class="d-flex align-items-center mt-2"><strong>{{ f.label }}</strong></div>
        <small class="text-center">{{ names[f.field] || '–' }}</small>
      </div>
      <div class="col-md-3 zo-ess" *ngIf="showEndDate && names['contract_end_date']">
        <div class="d-flex align-items-center mt-2"><strong>Contract end date</strong></div>
        <small class="text-center">{{ names['contract_end_date'] | date:'dd/MM/yyyy' }}</small>
      </div>
    </ng-container>
    <ng-container *ngIf="layout !== 'ess'">
      <div [class]="colClass + ' zo-col zo-dv'" *ngFor="let f of fields">
        <h2>{{ f.label }}</h2>
        <h3>{{ names[f.field] || '–' }}</h3>
      </div>
      <div [class]="colClass + ' zo-col zo-dv'" *ngIf="showEndDate && names['contract_end_date']">
        <h2>Contract end date</h2>
        <h3>{{ names['contract_end_date'] | date:'dd/MM/yyyy' }}</h3>
      </div>
    </ng-container>
  </ng-container>
</ng-container>`,
})
export class ZEmpOrgFieldsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() employeeId: number | string | null | undefined = null;
  @Input() departmentId: number | string | null | undefined = null;
  @Input() designationId: number | string | null | undefined = null;
  @Input() branchId: number | string | null | undefined = null;
  @Input() mode: 'edit' | 'view' = 'edit';
  @Input() layout: 'form' | 'details' | 'ess' = 'form';
  @Input() mine = false;
  @Input() colClass = 'col-md-6';

  fields: { field: OrgField; label: string; mandatory: boolean; endpoint: string }[] = [];
  options: Record<string, any[]> = {};
  values: Record<string, any> = {};
  names: Record<string, any> = {};
  errors: Record<string, string> = {};
  showErrors = false;
  private divisionTouched = false;
  private sub?: Subscription;
  private loadedFor: string | null = null;

  constructor(private org: OrgSettingsService, private http: HttpClient, private cd: ChangeDetectorRef) {}

  private q(extra = ''): string { return `?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}${extra}`; }

  get showEndDate(): boolean { return this.org.isOn('employment_types'); }

  ngOnInit(): void {
    this.sub = this.org.settings$.subscribe(s => this.setup(s));
    this.org.load().subscribe();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['employeeId'] && !ch['employeeId'].firstChange) { this.loadValues(); }
    if (ch['departmentId'] && !ch['departmentId'].firstChange && this.mode === 'edit') { this.departmentChanged(); }
  }

  private setup(s: OrgSettings): void {
    this.fields = this.org.activeFields(s).map(f => ({ field: f.field, label: f.label, mandatory: f.mandatory, endpoint: f.endpoint }));
    if (!this.fields.length) { this.cd.markForCheck(); return; }
    if (this.mode === 'edit') { this.fields.forEach(f => this.loadOptions(f.field, f.endpoint)); }
    this.loadValues();
  }

  private async loadOptions(field: string, endpoint: string): Promise<void> {
    try {
      const rows: any = await firstValueFrom(this.http.get<any>(`${this.org.api}${endpoint}/${this.q('&active=1')}`));
      this.options[field] = (Array.isArray(rows) ? rows : rows?.results || []).map((r: any) => ({
        value: r.id, label: r.code ? `${r.name} (${r.code})` : r.name, department_id: r.department_id ?? null, designation_ids: r.designation_ids || [],
        branch_ids: r.branch_ids || [], grade: r.grade ?? null, designation_id: r.designation_id ?? null, departments: r.departments || [],
      }));
    } catch { this.options[field] = []; }
    this.cd.markForCheck();
  }

  private async loadValues(): Promise<void> {
    const key = this.mine ? 'me' : String(this.employeeId || '');
    if (!this.fields.length) { return; }
    if (!this.mine && !this.employeeId) {
      if (this.mode === 'edit') { this.fields.forEach(f => { if (!(f.field in this.values)) { this.values[f.field] = null; } }); this.departmentChanged(); }
      return;
    }
    if (this.loadedFor === key) { return; }
    this.loadedFor = key;
    try {
      const d: any = await firstValueFrom(this.http.get<any>(this.mine ? `${this.org.api}my-org/${this.q()}` : `${this.org.api}employee-org/${this.employeeId}/${this.q()}`));
      for (const f of this.fields) { this.values[f.field] = d?.[f.field + '_id'] ?? null; this.names[f.field] = d?.[f.field] || ''; }
      this.values['contract_end_date'] = d?.contract_end_date || null;
      this.names['contract_end_date'] = d?.contract_end_date || null;
      this.divisionTouched = !!d?.division_id;
    } catch { /* no rights or not found: show the fields empty */ }
    this.cd.markForCheck();
  }

  /** narrowed options: by department, designation and branch */
  optionsFor(field: string): any[] {
    const all = this.options[field] || [];
    const dept = this.departmentId ? Number(this.departmentId) : null;
    const desg = this.designationId ? Number(this.designationId) : null;
    const br = this.branchId ? Number(this.branchId) : null;
    return all.filter(o => {
      if (o.value === this.values[field]) { return true; }   // keep the current value visible
      if (br && o.branch_ids.length && !o.branch_ids.includes(br)) { return false; }
      if (field === 'section') { return !!dept && o.department_id === dept; }
      if ((field === 'job_position' || field === 'cost_center') && dept && o.department_id && o.department_id !== dept) { return false; }
      if (field === 'job_position' && desg && o.designation_id && o.designation_id !== desg) { return false; }
      if (field === 'grade' && desg && o.designation_ids.length && !o.designation_ids.includes(desg)) { return false; }
      if (field === 'division' && dept && o.departments.length && !o.departments.includes(dept)) { return false; }
      return true;
    });
  }

  changed(field: string): void {
    delete this.errors[field];
    if (field === 'division') { this.divisionTouched = true; }
    if (field === 'job_position') {   // a position brings its grade
      const p = (this.options['job_position'] || []).find(o => o.value === this.values['job_position']);
      if (p?.grade && this.fields.some(f => f.field === 'grade') && !this.values['grade']) { this.values['grade'] = p.grade; }
    }
  }

  /** department changed on the form: clear a section of another department, default the division */
  private departmentChanged(): void {
    const dept = this.departmentId ? Number(this.departmentId) : null;
    const sec = (this.options['section'] || []).find(o => o.value === this.values['section']);
    if (sec && sec.department_id !== dept) { this.values['section'] = null; }
    if (this.fields.some(f => f.field === 'division') && dept && !this.divisionTouched) {
      const d = (this.options['division'] || []).find(o => o.departments.includes(dept));
      if (d) { this.values['division'] = d.value; }
      else if (!this.options['division']) {
        this.http.get<any>(`${this.org.api}divisions/for-department/${this.q('&department=' + dept)}`).subscribe({
          next: r => { if (r?.division_id && !this.divisionTouched) { this.values['division'] = r.division_id; this.cd.markForCheck(); } }, error: () => {},
        });
      }
    }
    this.cd.markForCheck();
  }

  /** client-side check before the screen saves: required fields (empty list = fine) */
  problems(): string[] {
    this.showErrors = true;
    if (this.mode !== 'edit') { return []; }
    return this.fields.filter(f => f.mandatory && !this.values[f.field]).map(f => `${f.label} is required.`);
  }

  /** saves the fields for the employee (call after the employee itself is saved). Resolves to an error text or ''. */
  async save(employeeId?: number | string | null): Promise<string> {
    const id = employeeId || this.employeeId;
    if (!this.fields.length || this.mode !== 'edit' || !id) { return ''; }
    const body: any = {};
    for (const f of this.fields) { body[f.field] = this.values[f.field] ?? null; }
    if (this.showEndDate) { body.contract_end_date = this.values['contract_end_date'] || null; }
    this.errors = {};
    try {
      const d: any = await firstValueFrom(this.http.put<any>(`${this.org.api}employee-org/${id}/${this.q()}`, body));
      for (const f of this.fields) { this.names[f.field] = d?.[f.field] || ''; this.values[f.field] = d?.[f.field + '_id'] ?? null; }
      this.loadedFor = String(id);
      this.cd.markForCheck();
      return '';
    } catch (e: any) {
      const err = e?.error;
      if (err && typeof err === 'object' && !Array.isArray(err)) {
        for (const [k, v] of Object.entries(err)) { this.errors[k] = Array.isArray(v) ? v.join(' ') : String(v); }
      } else { this.errors['detail'] = 'The organisation details could not be saved.'; }
      this.cd.markForCheck();
      const labels: Record<string, string> = Object.fromEntries(this.fields.map(f => [f.field, f.label]));
      return Object.entries(this.errors).map(([k, v]) => (labels[k] ? `${labels[k]}: ${v}` : v)).join(' ');
    }
  }
}
