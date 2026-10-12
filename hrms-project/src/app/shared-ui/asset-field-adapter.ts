import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DesignerAdapter } from './field-types';

/**
 * v1.16.0 – the asset form's ONE designer: asset custom fields (OrganisationManager.AssetCustomField, the store the
 * "Custom fields" screen of Assets and AssetPlus asset create / edit already use). Fields added here apply to every
 * asset type (asset type empty); per-type fields stay editable here too. Mandatory, section, order, help text,
 * example and rules are kept per company on the server (FormSetting 'layout:asset').
 */
export function assetFieldAdapter(http: HttpClient, api: string): DesignerAdapter {
  const s = () => localStorage.getItem('selectedSchema') || '';
  const url = (id?: number) => `${api}/organisation/api/asset-customfield/${id ? id + '/' : ''}?schema=${s()}`;
  const toField = (r: any) => ({
    id: r.id, name: r.custom_field, label: r.custom_field, field_type: r.data_type || 'text',
    options: r.options?.length ? r.options : (r.dropdown_values || r.radio_values || []), required: !!r.mandatory, section: r.section || '',
    order: r.order ?? r.id * 10, help_text: r.help_text || '', placeholder: r.placeholder || '', active: true,
    rules: { ...(r.rules || {}) }, default: (r.rules || {}).default ?? '', asset_type: r.asset_type ?? null, alias_label: r.alias_of ? 'built-in asset field' : '',
  });
  const toBody = (f: any) => {
    const t = f.field_type || 'text';
    const opts = (f.options || []).filter((o: string) => o);
    const rules: any = { ...(f.rules || {}) };
    if (f.default !== undefined) { rules.default = f.default; }
    for (const k of Object.keys(rules)) { if (rules[k] === '' || rules[k] === null || (Array.isArray(rules[k]) && !rules[k].length)) { delete rules[k]; } }
    if (rules.show_if && !rules.show_if.field) { delete rules.show_if; }
    return {
      custom_field: String(f.label || '').trim(), data_type: t, asset_type: f.asset_type ?? null,
      dropdown_values: t === 'dropdown' || t === 'multiselect' ? opts : null,
      radio_values: t === 'radio' ? opts : null,
      ...(t === 'checkbox' ? { checkbox_values: ['Yes', 'No'] } : {}),
      mandatory: !!f.required, section: f.section || '', order: f.order ?? 0, help_text: f.help_text || '', placeholder: f.placeholder || '', rules,
    };
  };
  const msg = (e: any) => {
    const d = e?.error;
    throw { error: { detail: d?.detail || d?.error || (d && typeof d === 'object' ? Object.values(d).flat().join(' ') : '') || 'Not saved.' } };
  };
  return {
    title: 'Asset form',
    subtitle: 'Custom fields of the asset screens: asset create, edit and details, list columns and the import template (one place for asset fields)',
    rich: false,
    load: async () => ((await firstValueFrom(http.get<any[]>(url()))) || []).map(toField).sort((a: any, b: any) => a.order - b.order),
    add: (f) => firstValueFrom(http.post(url(), toBody(f))).catch(msg),
    save: (f) => firstValueFrom(http.patch(url(f.id), toBody(f))).catch(msg),
    remove: (f) => firstValueFrom(http.delete(url(f.id))).catch(msg),
    reorder: (fields) => Promise.all(fields.map((f, i) => firstValueFrom(http.patch(url(f.id), { order: (i + 1) * 10 })))),
  };
}
