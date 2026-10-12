import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ZEmpFieldsComponent } from '../shared-ui/z-emp-fields.component';
import { I18N_UI } from '../shared-ui/i18n.service';

/**
 * v1.16.0 – "More details" on My profile: the employee custom fields of the ONE employee form designer
 * (same definitions as the HR employee screens, list columns, import and export). Only fields shown in self service
 * appear; fields marked "read-only for employees" are shown locked. Saved per field through the custom field value API
 * (the server checks type, rules and that the record is the employee's own).
 */
@Component({
  selector: 'app-ess-custom-fields',
  standalone: true,
  imports: [CommonModule, ZEmpFieldsComponent, ...I18N_UI],
  styleUrls: ['./ess.css'],
  template: `
  <div class="es-panel" id="g-custom" *ngIf="fields.length">
    <div class="es-h"><span>{{ 'More details' | t }}</span>
      <span class="es-actions"><button type="button" class="es-btn sm" *ngIf="!editing && canEdit()" (click)="editing = true">{{ 'Edit' | t }}</button></span></div>
    <div style="padding:12px 16px">
      <z-emp-fields [fields]="fields" valueKey="value" [editable]="editing" [context]="editing ? 'edit' : 'view'" [ess]="true"></z-emp-fields>
      <p class="es-msg err" *ngIf="err">{{ err }}</p>
      <p class="es-msg" *ngIf="ok">{{ ok }}</p>
      <div class="es-actions" style="margin-top:12px" *ngIf="editing">
        <button type="button" class="es-btn primary" [disabled]="busy" (click)="save()">{{ 'Save' | t }}</button>
        <button type="button" class="es-btn" (click)="cancel()">{{ 'Cancel' | t }}</button>
      </div>
    </div>
  </div>`,
})
export class EssCustomFieldsComponent implements OnChanges {
  @Input() employeeId: number | null = null;
  fields: any[] = [];
  private stored: Record<string, any> = {};
  editing = false; busy = false; err = ''; ok = '';

  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  private url(p: string, q = ''): string { return `${environment.apiBaseUrl}/employee/api/${p}?schema=${localStorage.getItem('selectedSchema') || ''}${q}`; }

  ngOnChanges(): void { this.load(); }

  async load(): Promise<void> {
    if (!this.employeeId) { return; }
    try {
      const [defs, vals] = await Promise.all([
        firstValueFrom(this.http.get<any[]>(this.url('emp-custom-field/'))),
        firstValueFrom(this.http.get<any>(this.url('custom-field-value/', `&emp_master=${this.employeeId}`))),
      ]);
      const rows: any[] = Array.isArray(vals) ? vals : (vals?.results || []);
      this.stored = {};
      for (const v of rows) { if (String(v.emp_master) === String(this.employeeId) || v.emp_master === undefined) { this.stored[v.emp_custom_field] = v.field_value; } }
      // shown in self service, not merged into a built-in field
      this.fields = (defs || []).filter(d => !d.alias_of && (!(d.rules?.visible_on || []).length || d.rules.visible_on.includes('ess')))
        .map(d => ({ ...d, value: this.stored[d.emp_custom_field] ?? null }));
    } catch { this.fields = []; }
    this.cd.detectChanges();
  }

  canEdit(): boolean { return this.fields.some(f => !f.rules?.ess_read_only); }
  cancel(): void { this.editing = false; this.err = ''; this.load(); }

  async save(): Promise<void> {
    this.err = ''; this.ok = '';
    const missing = ZEmpFieldsComponent.missing(this.fields, 'value', 'edit', true);
    const problems = ZEmpFieldsComponent.problems(this.fields, 'value', 'edit', true);
    if (missing.length || problems.length) { this.err = [...missing.map(m => `${m} is required.`), ...problems].join(' '); return; }
    this.busy = true;
    const errors: string[] = [];
    for (const f of this.fields) {
      if (f.rules?.ess_read_only) { continue; }
      const v = Array.isArray(f.value) ? f.value.join(', ') : (typeof f.value === 'boolean' ? (f.value ? 'Yes' : 'No') : f.value);
      if ((v ?? '') === (this.stored[f.emp_custom_field] ?? '')) { continue; }
      try {
        await firstValueFrom(this.http.post(this.url('custom-field-value/'), { emp_master: this.employeeId, emp_custom_field: f.emp_custom_field, field_value: v ?? '' }));
      } catch (e: any) {
        const d = e?.error; errors.push(`${f.emp_custom_field}: ${d?.detail || (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : 'not saved')}`);
      }
    }
    this.busy = false;
    if (errors.length) { this.err = errors.join(' '); } else { this.ok = 'Saved.'; this.editing = false; await this.load(); }
    this.cd.detectChanges();
  }
}
