import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZFieldInputComponent } from './z-field-input.component';
import { DesignField, bySection, checkValue } from './field-types';

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
          <z-field-input *ngIf="editable" [field]="design(f)" [value]="value(f)" [error]="err[f.emp_custom_field] || ''"
                         [wide]="f.data_type === 'textarea' || f.data_type === 'multiselect'" (valueChange)="set(f, $event)"></z-field-input>
          <div *ngIf="!editable" class="zf zef-ro" [class.zf-wide]="f.data_type === 'textarea'">
            <span class="zf-label">{{ f.emp_custom_field }}</span>
            <span class="zef-v">{{ shown(f) }}</span>
          </div>
        </ng-container>
      </div>
    </ng-container>
  </div>`,
})
export class ZEmpFieldsComponent {
  @Input() fields: any[] = [];
  @Input() valueKey = 'value';
  @Input() editable = true;
  @Input() minWidth = 220;
  err: Record<string, string> = {};
  bySec = (_: number, g: { section: string }) => g.section;
  byName = (_: number, f: any) => f.emp_custom_field;
  private cache = new WeakMap<any, DesignField>();

  groups() { return bySection((this.fields || []).map(f => ({ ...f, section: f.section || '', order: f.order ?? f.id * 10, _src: f }))).map(g => ({ section: g.section, fields: g.fields.map((x: any) => x._src) })); }

  design(f: any): DesignField {
    let d = this.cache.get(f);
    if (!d) {
      d = { name: f.emp_custom_field, label: f.emp_custom_field, field_type: f.data_type || 'text', options: f.dropdown_values || f.radio_values || [],
            required: !!f.mandatory, help_text: f.help_text || '', placeholder: f.placeholder || '', section: f.section || '', order: f.order };
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

  shown(f: any): string {
    const v = f[this.valueKey];
    if (v === null || v === undefined || v === '') { return '-'; }
    if (f.data_type === 'checkbox') { return v === true || /^(yes|true|1)$/i.test(String(v)) ? 'Yes' : 'No'; }
    if (f.data_type === 'rating') { return '★'.repeat(Number(v) || 0) || '-'; }
    if (f.data_type === 'currency') { return 'AED ' + v; }
    if (f.data_type === 'percent') { return v + ' %'; }
    return String(v);
  }
}
