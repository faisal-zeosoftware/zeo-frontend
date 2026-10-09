import { Component, Input, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZFieldInputComponent } from './z-field-input.component';
import { DesignField, bySection, checkValue, showIfOk, visibleOn } from './field-types';
import { ZListService } from './z-list.service';

/**
 * Custom fields of the employee screens (create, edit dialog, details page), from the employee form designer:
 * every field type, in the designer's order and sections. Works on the screens' own field objects
 * (emp_custom_field, data_type, dropdown_values, radio_values, mandatory, section, order, help_text)
 * and writes the value back into `valueKey`, as text (lists joined with commas) so the screens' saves keep working.
 */
@Component({
  selector: 'z-emp-fields',
  standalone: true,
  imports: [CommonModule, ZFieldInputComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="zef" *ngIf="fields?.length">
    <ng-container *ngFor="let g of groups(); trackBy: bySec">
      <div class="zr-sec" *ngIf="g.section">{{ g.section }}</div>
      <div class="zef-grid" [style.grid-template-columns]="'repeat(auto-fill, minmax(' + minWidth + 'px, 1fr))'">
        <ng-container *ngFor="let f of g.fields; trackBy: byName">
          <z-field-input *ngIf="editable" [field]="design(f)" [value]="value(f)" [error]="err[f.emp_custom_field] || ''" [disabled]="locked(f)"
                         [wide]="f.data_type === 'textarea' || f.data_type === 'multiselect'" (valueChange)="set(f, $event)"></z-field-input>
          <div *ngIf="!editable" class="zf zef-ro" [class.zf-wide]="f.data_type === 'textarea'">
            <span class="zf-label">{{ f.emp_custom_field }}</span>
            <span class="zef-v" *ngIf="f.data_type !== 'color' && f.data_type !== 'url'">{{ shown(f) }}</span>
            <span class="zef-v" *ngIf="f.data_type === 'color'"><span *ngIf="f[valueKey]" class="zef-swatch" style="display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:middle;border:1px solid #ccc" [style.background]="f[valueKey]"></span> {{ shown(f) }}</span>
            <a class="zef-v" *ngIf="f.data_type === 'url' && f[valueKey]" [href]="link(f[valueKey])" target="_blank" rel="noopener">{{ f[valueKey] }}</a>
            <span class="zef-v" *ngIf="f.data_type === 'url' && !f[valueKey]">-</span>
          </div>
        </ng-container>
      </div>
    </ng-container>
  </div>`,
})
export class ZEmpFieldsComponent implements OnInit {
  @Input() fields: any[] = [];
  @Input() valueKey = 'value';
  @Input() editable = true;
  @Input() minWidth = 220;
  /** v1.12.0: where the fields are shown (create / edit / view) – for the "show on" setting and defaults. */
  @Input() context: 'create' | 'edit' | 'view' | '' = '';
  /** v1.12.0: true for a self-service employee (worked out from the user's rights when not given). */
  @Input() ess: boolean | null = null;
  err: Record<string, string> = {};
  private essAuto = false;
  bySec = (_: number, g: { section: string }) => g.section;
  byName = (_: number, f: any) => f.emp_custom_field;
  private cache = new WeakMap<any, DesignField>();

  constructor(@Optional() private z: ZListService | null) {}

  ngOnInit(): void {
    if (this.ess === null && this.z) {
      this.z.permissions().subscribe(p => this.essAuto = !p.admin && !p.codes.size);
    }
  }

  get isEss(): boolean { return this.ess ?? this.essAuto; }
  get where(): string { return this.context || (this.editable ? 'edit' : 'view'); }

  /** Values by field name (for "show only if"). */
  private values(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.fields || []) { out[f.emp_custom_field] = f[this.valueKey]; }
    return out;
  }

  /** Is the field shown here (show on, self service, show only if)? */
  shownHere(f: any, vals = this.values()): boolean {
    return ZEmpFieldsComponent.isShown(f, vals, this.where, this.isEss);
  }

  static isShown(f: any, vals: Record<string, any>, where: string, ess: boolean): boolean {
    const r = f.rules || {};
    return visibleOn(r, where) && (!ess || visibleOn(r, 'ess')) && showIfOk(r, vals);
  }

  /** Names of required fields that are shown and still empty (the screens call this before saving). */
  static missing(fields: any[], valueKey: string, where: string, ess = false): string[] {
    const vals: Record<string, any> = {};
    for (const f of fields || []) { vals[f.emp_custom_field] = f[valueKey]; }
    return (fields || []).filter(f => {
      if (!f.mandatory || !ZEmpFieldsComponent.isShown(f, vals, where, ess) || (ess && f.rules?.ess_read_only)) { return false; }
      const v = f[valueKey];
      return v === undefined || v === null || String(v).trim() === '' || v === false || (f.data_type === 'checkbox' && /^(no|false|0)$/i.test(String(v)));
    }).map(f => f.emp_custom_field);
  }

  /** Field errors (type, rules) of the shown fields: {name: message}. */
  static problems(fields: any[], valueKey: string, where: string, ess = false): string[] {
    const vals: Record<string, any> = {};
    for (const f of fields || []) { vals[f.emp_custom_field] = f[valueKey]; }
    const out: string[] = [];
    for (const f of fields || []) {
      if (!ZEmpFieldsComponent.isShown(f, vals, where, ess)) { continue; }
      const d: DesignField = { name: f.emp_custom_field, label: f.emp_custom_field, field_type: f.data_type || 'text', options: f.dropdown_values || f.radio_values || [],
                               required: !!f.mandatory, rules: f.rules || {} };
      const m = checkValue(d, f[valueKey]);
      if (m) { out.push(m); }
    }
    return out;
  }

  groups() {
    const vals = this.values();
    if (this.where === 'create') {   // defaults of a new record
      for (const f of this.fields || []) {
        const dv = f.rules?.default ?? f.default;
        if (!f._zdef && dv !== undefined && dv !== null && dv !== '' && (f[this.valueKey] === undefined || f[this.valueKey] === null || f[this.valueKey] === '')) {
          f[this.valueKey] = f.data_type === 'checkbox' ? /^(yes|true|1)$/i.test(String(dv)) : dv;
          vals[f.emp_custom_field] = f[this.valueKey];
        }
        f._zdef = true;
      }
    }
    const shown = (this.fields || []).filter(f => this.shownHere(f, vals));
    return bySection(shown.map(f => ({ ...f, section: f.section || '', order: f.order ?? f.id * 10, _src: f }))).map(g => ({ section: g.section, fields: g.fields.map((x: any) => x._src) }));
  }

  locked(f: any): boolean { return this.isEss && !!f.rules?.ess_read_only; }

  design(f: any): DesignField {
    let d = this.cache.get(f);
    if (!d) {
      d = { name: f.emp_custom_field, label: f.emp_custom_field, field_type: f.data_type || 'text', options: f.dropdown_values || f.radio_values || [],
            required: !!f.mandatory, help_text: f.help_text || (this.locked(f) ? 'HR keeps this field up to date.' : ''), placeholder: f.placeholder || '',
            section: f.section || '', order: f.order, rules: f.rules || {} };
      this.cache.set(f, d);
    }
    return d;
  }

  value(f: any): any {
    const v = f[this.valueKey];
    if ((f.data_type === 'multiselect') && typeof v === 'string') { return v ? v.split(/,\s*/) : []; }
    if (f.data_type === 'checkbox' && typeof v === 'string') { return /^(yes|true|1)$/i.test(v); }
    return v;
  }

  set(f: any, v: any): void {
    f[this.valueKey] = Array.isArray(v) ? v.join(', ') : v;
    this.err[f.emp_custom_field] = checkValue(this.design(f), v);
  }

  link(v: string): string { return /^https?:\/\//i.test(v) ? v : 'https://' + v; }

  shown(f: any): string {
    const v = f[this.valueKey];
    if (v === null || v === undefined || v === '') { return '-'; }
    if (f.data_type === 'checkbox') { return v === true || /^(yes|true|1)$/i.test(String(v)) ? 'Yes' : 'No'; }
    if (f.data_type === 'rating') { return '★'.repeat(Number(v) || 0) || '-'; }
    if (f.data_type === 'currency') { const n = Number(String(v).replace(/,/g, '')); return 'AED ' + (isNaN(n) ? v : n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }
    if (f.data_type === 'percent') { return v + ' %'; }
    if (f.data_type === 'datetime') { return String(v).replace('T', ' ').slice(0, 16); }
    return String(v);
  }
}
