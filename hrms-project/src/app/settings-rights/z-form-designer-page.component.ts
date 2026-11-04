/**
 * v1.62.10 (item 177) – Form designer (settings/form-designer) and Asset form designer (settings/asset-udf) in the new design.
 * Same stores and rights as the old pages:
 *  - extra fields: /employee/api/<emp-custom-field | empfamily-UDF | empQualification-UDF | empjob-history-UDF | emp-Documents-UDF>/
 *    and /organisation/api/asset-customfield/ (rights *_emp_customfield / *_assetcustomfield, administrators everything);
 *  - built-in field captions, mandatory / hidden flags and dropdown values: the same local-storage keys as before, which
 *    FormSettingsService.watch() copies to the company's server settings (so every user and browser gets them).
 * New: one "+ New field" (shared form), Edit / Delete on each row, the built-in fields as one table with one Save,
 * "Open form designer" (order, sections, help text, rules) as before, no page reloads, no browser pop-ups.
 */
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';
import { HrPermissionService, ModelPerms } from '../hr-modules/hr-permission.service';
import { DesignerAdapter, FIELD_TYPES } from '../shared-ui/field-types';
import { EMP_FIELD_KINDS, empFieldAdapter } from '../shared-ui/emp-field-adapter';
import { assetFieldAdapter } from '../shared-ui/asset-field-adapter';
import { ZFieldDesignerComponent } from '../shared-ui/z-field-designer.component';
import { FormSettingsService } from '../shared-ui/form-settings.service';
import { ZFormConfig, openZForm } from '../shared-ui/z-form.component';
import { i18nT } from '../shared-ui/i18n-core';
import { zToast } from '../shared-ui/z-toast';
import { zConfirm } from '../shared-ui/z-confirm';
import { ZListDirective } from '../shared-ui/z-list.directive';

const API = environment.apiBaseUrl;
const NONE: ModelPerms = { view: false, add: false, change: false, delete: false };

/** one built-in field of the old designer: the local-storage keys it is kept under (FormSettingsService syncs them) */
interface BuiltIn { label: string; def: string; mand?: string; hid?: string; type?: string; typeDef?: string; vals?: string; }
const DD = 'Dropdown', TB = 'Text Box';
const EMP_BUILTIN: BuiltIn[] = [
  { label: 'empCodeFieldName', def: 'Employee Code', type: 'selectedDataType', typeDef: TB, vals: 'dropdownValues' },
  { label: 'firstNameFieldName', def: 'First Name', mand: 'isFirstNameMandatory', hid: 'isFirstNameFieldHidden' },
  { label: 'lastNameFieldName', def: 'Last Name', mand: 'isLastNameMandatory', hid: 'isLasstNameFieldHidden' },
  { label: 'genderFieldName', def: 'Gender', mand: 'isGenderMandatory', hid: 'isGernderNameFieldHidden', type: 'genderDataType', typeDef: DD, vals: 'genderDropdownValues' },
  { label: 'dobFieldName', def: 'Date Of Birth' },
  { label: 'emailFieldName', def: 'Email', mand: 'isEmailMandatory', hid: 'isEmailNameFieldHidden' },
  { label: 'cmpnoFieldName', def: 'Company Number', mand: 'isCmpnoMandatory', hid: 'isCmpNoNameFieldHidden' },
  { label: 'pernoFieldName', def: 'Personal Number', mand: 'isPernoMandatory', hid: 'isPerNoNameFieldHidden' },
  { label: 'peraddressFieldName', def: 'Permanent Address', mand: 'isPeraddMandatory', hid: 'isPermaddNameFieldHidden' },
  { label: 'preaddressFieldName', def: 'Present Address', mand: 'isPresaddMandatory', hid: 'isPresentaddNameFieldHidden' },
  { label: 'cityFieldName', def: 'City', mand: 'isCityMandatory', hid: 'isCityFieldHidden' },
  { label: 'religionFieldName', def: 'Religion', mand: 'isRelMandatory', hid: 'isReliFieldHidden', type: 'selectedDataTypereligion', typeDef: TB, vals: 'dropdownValuesreligion' },
  { label: 'bloodFieldName', def: 'Blood Group', mand: 'isBloodMandatory', hid: 'isBloodFieldHidden', type: 'selectedDataTypeblood', typeDef: TB, vals: 'dropdownValuesblood' },
  { label: 'nationFieldName', def: 'Nationality', mand: 'isNatMandatory', hid: 'isNationFieldHidden' },
  { label: 'maritalFieldName', def: 'Marital Status', mand: 'isMariMandatory', hid: 'isMaritalFieldHidden', type: 'maritalDataType', typeDef: DD, vals: 'maritalDropdownValues' },
  { label: 'fatherFieldName', def: 'Father Name', mand: 'isFatherMandatory', hid: 'isFatherFieldHidden' },
  { label: 'motherFieldName', def: 'Mother Name', mand: 'isMotherMandatory', hid: 'isMotherFieldHidden' },
  { label: 'locationFieldName', def: 'Location', mand: 'isLocationMandatory', hid: 'isLocationFieldHidden', type: 'locationDataType', typeDef: DD, vals: 'locationDropdownValues' },
  { label: 'cntryFieldName', def: 'Country', mand: 'isLCountryMandatory', hid: 'isCountryFieldHidden', type: 'cntryDataType', typeDef: DD, vals: 'cntryDropdownValues' },
  { label: 'brchFieldName', def: 'Branch', mand: 'isLBranchMandatory', type: 'brchDataType', typeDef: DD, vals: 'brchDropdownValues' },
  { label: 'deptFieldName', def: 'Department', mand: 'isLDepartmentMandatory', hid: 'isDepartFieldHidden', type: 'deptDataType', typeDef: DD, vals: 'deptDropdownValues' },
  { label: 'desFieldName', def: 'Designation', mand: 'isLDesignationMandatory', hid: 'isDesignationFieldHidden', type: 'desDataType', typeDef: DD, vals: 'desDropdownValues' },
  { label: 'catFieldName', def: 'Category', mand: 'isLCatogoryMandatory', hid: 'isCatFieldHidden', type: 'catDataType', typeDef: DD, vals: 'catDropdownValues' },
  { label: 'repoFieldName', def: 'Reporting Manager', mand: 'isrepoMandatory', type: 'repoDataType', typeDef: DD, vals: 'repoDropdownValues' },
  { label: 'hiredFieldName', def: 'Joining  Date', mand: 'isHiringMandatory', hid: 'isHireFieldHidden' },
  { label: 'joinFieldName', def: 'Confirmation Date' },
];
const SUB_BUILTIN: Record<string, BuiltIn[]> = {
  family: [{ label: 'empFamilynameFieldName', def: 'Family Member Name' }, { label: 'empRelationnameFieldName', def: 'Relationship Name' },
    { label: 'empExpencenameFieldName', def: 'Family Company Expense' }, { label: 'empmemDobnameFieldName', def: 'Member Date Of Birth' }],
  qualification: [{ label: 'empQualificationnameFieldName', def: 'Qualification' }, { label: 'empInstitutionnameFieldName', def: 'Institution Name' },
    { label: 'empQuaYearnameFieldName', def: 'Qualification Year' }, { label: 'empQuaSubjectFieldName', def: 'Employee qualification subject' }],
  job: [{ label: 'empJobFromDatenameFieldName', def: 'Employee job History From date' }, { label: 'empJobendDatenameFieldName', def: 'Employee job History to date' },
    { label: 'empComapanyameFieldName', def: 'Comapany Name' }, { label: 'empJobDesignationFieldName', def: 'Employee Designation' },
    { label: 'empSalarypermonthFieldName', def: 'Employee salary per month' }, { label: 'empLeavingReasonFieldName', def: 'Leaving reason' },
    { label: 'empWorkExpFieldName', def: 'Employee work Experiance' }],
  documents: [{ label: 'empDocmentNoFieldName', def: 'Document Number' }, { label: 'empIssueDateFieldName', def: 'Issued date' },
    { label: 'empExpDateFieldName', def: 'Expired Date' }, { label: 'empEmpdocumentFieldName', def: 'Employee Document' },
    { label: 'empEmpdocumentDatatypeFieldName', def: 'Document Type' }],
};
interface BuiltInRow { spec: BuiltIn; label: string; mand: boolean; hid: boolean; type: string; vals: string; }

const TYPE_OPTS = FIELD_TYPES.map(t => ({ value: t.value, label: t.label }));
const OPT_TYPES = ['dropdown', 'multiselect', 'radio'];
/** the shared "New field / Edit field" form of one extra-field list (simple settings; order, sections and rules stay in "Open form designer") */
function fieldForm(endpoint: string, nameKey: string, asset: boolean): ZFormConfig {
  return {
    thing: 'field', endpoint,
    subtitle: 'An extra field on the form. Order, sections, help text and rules: Open form designer.',
    sections: [{ title: 'Field', fields: [
      { key: nameKey, label: 'Name', required: true, max: 255 },
      { key: 'data_type', label: 'Type', type: 'select', options: TYPE_OPTS, required: true },
      { key: 'choices', label: 'Choices', full: true, hint: 'Separated by commas, e.g. Small, Medium, Large', showIf: v => OPT_TYPES.includes(v.data_type) },
      ...(asset ? [{ key: 'asset_type', label: 'Asset type', type: 'select' as const, source: { endpoint: '/organisation/api/asset-type/', label: 'name' }, hint: 'Empty = every asset type.' }] : []),
      { key: 'mandatory', label: 'Mandatory', type: 'check' }] }],
    fromRecord: r => ({ ...r, data_type: r.data_type || 'text', choices: ((r.options?.length ? r.options : (r.dropdown_values || r.radio_values)) || []).join(', ') }),
    toBody: v => {
      const t = v.data_type || 'text';
      const opts = String(v.choices || '').split(',').map((x: string) => x.trim()).filter(Boolean);
      const b: any = { [nameKey]: String(v[nameKey] || '').trim(), data_type: t, mandatory: !!v.mandatory,
        dropdown_values: t === 'dropdown' || t === 'multiselect' ? opts : null, radio_values: t === 'radio' ? opts : null,
        ...(t === 'checkbox' ? { checkbox_values: ['Yes', 'No'] } : {}) };
      if (asset) { b.asset_type = v.asset_type ?? null; }
      return b;
    },
  };
}

interface Tab { key: string; title: string; path: string; nameKey: string; builtIn: BuiltIn[]; }

@Component({
  selector: 'z-form-designer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ZFieldDesignerComponent, ZListDirective],
  styles: [`
  .zfd { padding: 18px 22px 28px; color: #1d2033; font-size: 13.5px; }
  .zfd-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .zfd-head h1 { margin: 0; font-size: 22px; font-weight: 600; color: #1b1640; }
  .zfd-head p { margin: 4px 0 0; color: #6b7185; font-size: 13px; max-width: 760px; line-height: 1.45; }
  .zfd-grow { flex: 1; }
  .zfd-tabs { display: flex; gap: 4px; border-bottom: 1px solid #e6e8f0; margin-bottom: 14px; overflow-x: auto; }
  .zfd-tab { border: 0; background: none; padding: 9px 14px; font: inherit; font-weight: 600; color: #6b7185; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
  .zfd-tab.on { color: #4b3fbf; border-bottom-color: #5b4fe0; }
  .zfd-card { background: #fff; border: 1px solid #e6e8f0; border-radius: 12px; margin-bottom: 16px; overflow: auto; }
  .zfd-card-h { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #eceef5; flex-wrap: wrap; }
  .zfd-card-h h2 { margin: 0; font-size: 15px; font-weight: 600; color: #1b1640; }
  .zfd-card-h small { color: #6b7185; font-size: 12.5px; }
  .zfd table { width: 100%; border-collapse: collapse; }
  .zfd th { text-align: start; font-size: 12px; font-weight: 600; color: #6b7185; padding: 9px 14px; border-bottom: 1px solid #eceef5; white-space: nowrap; }
  .zfd td { padding: 8px 14px; border-bottom: 1px solid #f1f2f7; vertical-align: middle; }
  .zfd tr:last-child td { border-bottom: 0; }
  .zfd td.acts { white-space: nowrap; text-align: end; width: 1%; }
  .zfd input[type=text], .zfd select { height: 34px; border: 1px solid #dfe1ea; border-radius: 8px; padding: 0 10px; font: inherit; background: #fff; width: 100%; min-width: 120px; }
  .zfd input:focus, .zfd select:focus { outline: none; border-color: #5b4fe0; box-shadow: 0 0 0 3px rgba(91,79,224,.12); }
  .zfd-muted { color: #6b7185; font-size: 12.5px; }
  .zfd-empty { padding: 22px; text-align: center; color: #6b7185; }
  .zfd-btn { height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #dfe1ea; background: #fff; font: inherit; font-weight: 600; cursor: pointer; color: #1d2033; display: inline-flex; align-items: center; gap: 6px; }
  .zfd-btn.primary { background: #5b4fe0; border-color: #5b4fe0; color: #fff; }
  .zfd-btn[disabled] { opacity: .6; cursor: default; }
  .zfd-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
  .zfd-chip { display: inline-block; padding: 1px 8px; margin: 1px 4px 1px 0; border-radius: 10px; background: #f1f2f6; color: #4a4f63; font-size: 12px; }
  .zfd-def { color: #6b7185; font-size: 12px; }
  `],
  template: `
<div class="zfd" [attr.data-z-form-designer]="mode">
  <div class="zfd-head">
    <div><h1>{{ t(mode === 'asset' ? 'Asset form designer' : 'Form designer') }}</h1>
      <p>{{ t(mode === 'asset' ? 'Your own extra fields on the asset screens (create, edit, details, list columns and the import template).' : 'Choose which fields the employee forms show, their names, the mandatory ones and your own extra fields. Changes apply to the forms of the whole company.') }}</p></div>
    <span class="zfd-grow"></span>
    <button type="button" class="zfd-btn" *ngIf="perms.change || perms.add" (click)="designer = tab.key" data-zfd-designer><mat-icon>tune</mat-icon>{{ t('Open form designer') }}</button>
    <button type="button" class="z-new-btn" data-z-new *ngIf="perms.add" (click)="addField()">{{ t('+ New {0}', ['field']) }}</button>
  </div>
  <div class="zfd-tabs" role="tablist" *ngIf="tabs.length > 1">
    <button type="button" role="tab" class="zfd-tab" *ngFor="let x of tabs" [class.on]="x.key === tab.key" [attr.aria-selected]="x.key === tab.key" (click)="open(x)" [attr.data-zfd-tab]="x.key">{{ t(x.title) }}</button>
  </div>
  <p class="zfd-empty" *ngIf="!perms.view && !perms.add && !perms.change">{{ t('You do not have the right to see this page.') }}</p>
  <ng-container *ngIf="perms.view || perms.add || perms.change">
  <section class="zfd-card" data-zfd-extra>
    <div class="zfd-card-h"><h2>{{ t('Extra fields') }}</h2><small>{{ t('{0} field(s)', [fields.length]) }}</small></div>
    <table>
      <thead><tr><th>{{ t('Name') }}</th><th>{{ t('Type') }}</th><th>{{ t('Choices') }}</th><th *ngIf="mode === 'asset'">{{ t('Asset type') }}</th><th>{{ t('Section') }}</th><th>{{ t('Mandatory') }}</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let f of fields" [attr.data-zfd-field]="f.label">
          <td><b>{{ f.label }}</b><div class="zfd-muted" *ngIf="f.alias_label">{{ t('Merged into a built-in field') }}</div></td>
          <td>{{ t(typeName(f.field_type)) }}</td>
          <td><span class="zfd-chip" *ngFor="let o of (f.options || []).slice(0, 6)">{{ o }}</span><span class="zfd-muted" *ngIf="(f.options || []).length > 6">+{{ f.options.length - 6 }}</span></td>
          <td *ngIf="mode === 'asset'">{{ f.asset_type ? (assetTypes.get(f.asset_type) || f.asset_type) : t('Every asset type') }}</td>
          <td>{{ f.section || '–' }}</td>
          <td>{{ t(f.required ? 'Yes' : 'No') }}</td>
          <td class="acts">
            <button type="button" class="z-row-btn" *ngIf="perms.change" (click)="editField(f)" [title]="t('Edit')" [attr.aria-label]="t('Edit')"><mat-icon>edit</mat-icon></button>
            <button type="button" class="z-row-btn danger" *ngIf="perms.delete" (click)="removeField(f)" [title]="t('Delete')" [attr.aria-label]="t('Delete')" data-z-row-delete><mat-icon>delete</mat-icon></button>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="zfd-empty" *ngIf="!loading && !fields.length">{{ t('No extra fields yet.') }}</p>
    <p class="zfd-empty" *ngIf="loading">{{ t('Loading…') }}</p>
  </section>
  <section class="zfd-card" *ngIf="builtIn.length" data-zfd-builtin>
    <div class="zfd-card-h"><h2>{{ t('Built-in fields') }}</h2><small>{{ t('The names shown on the forms, mandatory and hidden fields, and the choices of dropdowns.') }}</small>
      <span class="zfd-grow"></span>
      <button type="button" class="zfd-btn primary" *ngIf="perms.change" (click)="saveBuiltIn()" [disabled]="!dirty" data-zfd-save>{{ t('Save') }}</button></div>
    <table zPlain>
      <thead><tr><th>{{ t('Field') }}</th><th>{{ t('Name on the form') }}</th><th *ngIf="tab.key === 'employee'">{{ t('Mandatory') }}</th><th *ngIf="tab.key === 'employee'">{{ t('Hidden') }}</th><th *ngIf="tab.key === 'employee'">{{ t('Type') }}</th><th *ngIf="tab.key === 'employee'">{{ t('Choices') }}</th></tr></thead>
      <tbody>
        <tr *ngFor="let b of builtIn" [attr.data-zfd-builtin-row]="b.spec.label">
          <td class="zfd-def">{{ t(b.spec.def) }}</td>
          <td><input type="text" [(ngModel)]="b.label" (ngModelChange)="dirty = true" [disabled]="!perms.change" [attr.aria-label]="t('Name on the form')"></td>
          <ng-container *ngIf="tab.key === 'employee'">
            <td><input type="checkbox" *ngIf="b.spec.mand" [(ngModel)]="b.mand" (ngModelChange)="dirty = true" [disabled]="!perms.change" [attr.aria-label]="t('Mandatory')"></td>
            <td><input type="checkbox" *ngIf="b.spec.hid" [(ngModel)]="b.hid" (ngModelChange)="dirty = true" [disabled]="!perms.change" [attr.aria-label]="t('Hidden')"></td>
            <td><select *ngIf="b.spec.type" [(ngModel)]="b.type" (ngModelChange)="dirty = true" [disabled]="!perms.change" [attr.aria-label]="t('Type')">
              <option value="Text Box">{{ t('Text') }}</option><option value="Dropdown">{{ t('Dropdown') }}</option></select></td>
            <td><input type="text" *ngIf="b.spec.vals && b.type === 'Dropdown'" [(ngModel)]="b.vals" (ngModelChange)="dirty = true" [disabled]="!perms.change" [placeholder]="t('Separated by commas')" [attr.aria-label]="t('Choices')"></td>
          </ng-container>
        </tr>
      </tbody>
    </table>
  </section>
  </ng-container>
</div>
<z-field-designer *ngIf="designer" [adapter]="adapterFor(designer)" (closed)="designerClosed($event)"></z-field-designer>`,
})
export class ZFormDesignerPageComponent implements OnInit, OnDestroy {
  mode: 'employee' | 'asset' = 'employee';
  tabs: Tab[] = [];
  tab!: Tab;
  fields: any[] = [];
  builtIn: BuiltInRow[] = [];
  assetTypes = new Map<any, string>();
  loading = true;
  dirty = false;
  designer: string | null = null;
  perms: ModelPerms = NONE;
  t = (s: string, p?: any[]) => i18nT(s, p);
  private adapters: Record<string, DesignerAdapter> = {};
  @ViewChild(ZFieldDesignerComponent) fd?: ZFieldDesignerComponent;

  constructor(private http: HttpClient, private rights: HrPermissionService, private route: ActivatedRoute, private formSettings: FormSettingsService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'asset' ? 'asset' : 'employee';
    if (this.mode === 'asset') {
      this.tabs = [{ key: 'asset', title: 'Asset form', path: '/organisation/api/asset-customfield/', nameKey: 'custom_field', builtIn: [] }];
      this.http.get<any>(`${API}/organisation/api/asset-type/?schema=${encodeURIComponent(localStorage.getItem('selectedSchema') || '')}`).subscribe({
        next: d => { for (const a of (Array.isArray(d) ? d : d?.results || [])) { this.assetTypes.set(a.id, a.name); } this.cd.markForCheck(); }, error: () => {} });
    } else {
      this.tabs = Object.entries(EMP_FIELD_KINDS).map(([key, k]) => ({ key, title: k.title === 'Employee' ? 'Employee form' : k.title, path: `/employee/api/${k.path}/`, nameKey: 'emp_custom_field',
        builtIn: key === 'employee' ? EMP_BUILTIN : (SUB_BUILTIN[key] || []) }));
      // settings are the company's (server), not only this browser's – as the old page did
      this.formSettings.watch();
      this.formSettings.pull(true).then(() => { this.readBuiltIn(); this.cd.markForCheck(); });
    }
    this.rights.can(this.mode === 'asset' ? 'assetcustomfield' : 'emp_customfield').subscribe(p => { this.perms = p; this.cd.markForCheck(); });
    let want = this.tabs[0];
    try { const k = sessionStorage.getItem('zfd-tab:' + this.mode); want = this.tabs.find(x => x.key === k) || want; } catch { /* storage off */ }
    this.open(want);
  }
  ngOnDestroy(): void { if (this.mode === 'employee') { this.formSettings.unwatch(); } }

  async open(x: Tab): Promise<void> {
    if (this.dirty && !(await zConfirm(this.t('The built-in field changes are not saved. Leave them?')))) { return; }
    this.tab = x; this.dirty = false;
    try { sessionStorage.setItem('zfd-tab:' + this.mode, x.key); } catch { /* storage off */ }
    this.readBuiltIn(); this.load();
  }
  adapterFor(kind: string): DesignerAdapter {
    return this.adapters[kind] ??= (kind === 'asset' ? assetFieldAdapter(this.http, API) : empFieldAdapter(this.http, API, kind));
  }
  async load(): Promise<void> {
    this.loading = true; this.cd.markForCheck();
    try { this.fields = await this.adapterFor(this.tab.key).load(); } catch { this.fields = []; }
    this.loading = false; this.cd.markForCheck();
  }
  typeName(v: string): string { return FIELD_TYPES.find(x => x.value === v)?.label || v || 'Text'; }

  private form(): ZFormConfig { return fieldForm(this.tab.path, this.tab.nameKey, this.mode === 'asset'); }
  async addField(): Promise<void> { if (await openZForm(this.form())) { this.load(); } }
  async editField(f: any): Promise<void> { if (await openZForm(this.form(), { id: f.id })) { this.load(); } }
  async removeField(f: any): Promise<void> {
    if (!(await zConfirm(this.t('Delete the field "{0}"? Values already entered in it are no longer shown.', [f.label]), { danger: true }))) { return; }
    try { await this.adapterFor(this.tab.key).remove(f); zToast(this.t('Field deleted.'), 'ok'); this.load(); }
    catch (e: any) { zToast(String(e?.error?.detail || this.t('Not deleted – try again.')), 'err'); }
  }
  designerClosed(changed: boolean): void { this.designer = null; if (changed) { this.load(); } }

  // ---- built-in fields (the old page's local-storage keys; FormSettingsService.watch() saves them for the company)
  private get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
  private flag(k?: string): boolean { if (!k) { return false; } try { return JSON.parse(this.get(k) || 'false') === true; } catch { return false; } }
  readBuiltIn(): void {
    this.builtIn = (this.tab?.builtIn || []).map(s => ({ spec: s, label: this.get(s.label) || s.def, mand: this.flag(s.mand), hid: this.flag(s.hid),
      type: (s.type && this.get(s.type)) || s.typeDef || TB, vals: (s.vals && this.get(s.vals)) || '' }));
  }
  saveBuiltIn(): void {
    for (const b of this.builtIn) {
      const s = b.spec;
      localStorage.setItem(s.label, (b.label || '').trim() || s.def);
      if (s.mand) { localStorage.setItem(s.mand, JSON.stringify(!!b.mand)); }
      if (s.hid) { localStorage.setItem(s.hid, JSON.stringify(!!b.hid)); }
      if (s.type) { localStorage.setItem(s.type, b.type); }
      if (s.vals) { if (b.type === DD) { localStorage.setItem(s.vals, b.vals || ''); } else { localStorage.removeItem(s.vals); } }
    }
    this.dirty = false;
    zToast(this.t('Field names saved.'), 'ok');
    this.cd.markForCheck();
  }
}
