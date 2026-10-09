import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DesignerAdapter } from './field-types';

/** The five custom-field lists of the employee form designer. */
export const EMP_FIELD_KINDS: Record<string, { title: string; path: string }> = {
  employee: { title: 'Employee', path: 'emp-custom-field' },
  family: { title: 'Family', path: 'empfamily-UDF' },
  qualification: { title: 'Qualification', path: 'empQualification-UDF' },
  job: { title: 'Job history', path: 'empjob-history-UDF' },
  documents: { title: 'Documents', path: 'emp-Documents-UDF' },
};

/** Form designer adapter for employee custom fields (types, order, sections, help text, mandatory). */
export function empFieldAdapter(http: HttpClient, api: string, kind: string): DesignerAdapter {
  const k = EMP_FIELD_KINDS[kind];
  const s = () => localStorage.getItem('selectedSchema') || '';
  const url = (id?: number) => `${api}/employee/api/${k.path}/${id ? id + '/' : ''}?schema=${s()}`;
  const toField = (r: any) => ({
    id: r.id, name: r.emp_custom_field, label: r.emp_custom_field, field_type: r.data_type || 'text',
    options: r.dropdown_values || r.radio_values || [], required: !!r.mandatory, section: r.section || '',
    order: r.order ?? r.id * 10, help_text: r.help_text || '', placeholder: r.placeholder || '', active: true,
    rules: { ...(r.rules || {}) }, default: (r.rules || {}).default ?? '',
  });
  const toBody = (f: any) => {
    const t = f.field_type || 'text';
    const opts = (f.options || []).filter((o: string) => o);
    // v1.12.0: rules (default, lowest / highest, length, pattern, show on, show only if, read-only for employees)
    const rules: any = { ...(f.rules || {}) };
    if (f.default !== undefined) { rules.default = f.default; }
    for (const k of Object.keys(rules)) { if (rules[k] === '' || rules[k] === null || (Array.isArray(rules[k]) && !rules[k].length)) { delete rules[k]; } }
    if (rules.show_if && !rules.show_if.field) { delete rules.show_if; }
    return {
      emp_custom_field: String(f.label || '').trim(), data_type: t,
      dropdown_values: t === 'dropdown' || t === 'multiselect' ? opts : null,
      radio_values: t === 'radio' ? opts : null,
      ...(t === 'checkbox' ? { checkbox_values: ['Yes', 'No'] } : {}),
      mandatory: !!f.required, section: f.section || '', order: f.order ?? 0, help_text: f.help_text || '', placeholder: f.placeholder || '',
      rules, ...(f.confirm ? { confirm: true } : {}),
    };
  };
  const msg = (e: any) => {
    const d = e?.error;
    if (d && d.confirm) {   // the change does not fit values already entered: the designer asks first
      throw { error: { detail: [].concat(d.confirm).join(' '), needs_confirm: true, affected: d.affected || [] } };
    }
    throw { error: { detail: d?.detail || d?.error || (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : '') || 'Not saved.' } };
  };
  return {
    title: `${k.title} form`,
    rich: false,
    load: async () => ((await firstValueFrom(http.get<any[]>(url()))) || []).map(toField).sort((a: any, b: any) => a.order - b.order),
    add: (f) => firstValueFrom(http.post(url(), toBody(f))).catch(msg),
    save: (f) => firstValueFrom(http.patch(url(f.id), toBody(f))).catch(msg),
    remove: (f) => firstValueFrom(http.delete(url(f.id))).catch(msg),
    reorder: (fields) => Promise.all(fields.map((f, i) => firstValueFrom(http.patch(url(f.id), { order: (i + 1) * 10 })))),
  };
}
