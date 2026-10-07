/** Field types offered by every form designer (employee custom fields and extra fields on any screen). */
export interface FieldType { value: string; label: string; icon: string; options?: boolean; hint: string; }

export const FIELD_TYPES: FieldType[] = [
  { value: 'text', label: 'Text', icon: 'short_text', hint: 'One line of text' },
  { value: 'textarea', label: 'Long text', icon: 'notes', hint: 'Several lines' },
  { value: 'integer', label: 'Whole number', icon: 'pin', hint: 'e.g. 12' },
  { value: 'decimal', label: 'Decimal number', icon: 'calculate', hint: 'e.g. 12.75' },
  { value: 'currency', label: 'Amount (AED)', icon: 'payments', hint: 'Money, 2 decimals' },
  { value: 'percent', label: 'Percentage', icon: 'percent', hint: '0 to 100' },
  { value: 'date', label: 'Date', icon: 'event', hint: 'Calendar date' },
  { value: 'datetime', label: 'Date and time', icon: 'schedule', hint: 'Date with time' },
  { value: 'time', label: 'Time', icon: 'access_time', hint: 'Hours and minutes' },
  { value: 'checkbox', label: 'Yes / No', icon: 'check_box', hint: 'A tick box' },
  { value: 'dropdown', label: 'Dropdown', icon: 'arrow_drop_down_circle', options: true, hint: 'Pick one from a list' },
  { value: 'multiselect', label: 'Multi-select', icon: 'checklist', options: true, hint: 'Pick several from a list' },
  { value: 'radio', label: 'Radio buttons', icon: 'radio_button_checked', options: true, hint: 'Pick one, all shown' },
  { value: 'email', label: 'E-mail', icon: 'alternate_email', hint: 'Checked e-mail address' },
  { value: 'phone', label: 'Phone', icon: 'call', hint: '+971 …' },
  { value: 'url', label: 'Web link', icon: 'link', hint: 'https://…' },
  { value: 'file', label: 'File', icon: 'attach_file', hint: 'Upload a document' },
  { value: 'employee', label: 'Employee', icon: 'badge', hint: 'Pick an employee' },
  { value: 'rating', label: 'Rating (1–5)', icon: 'star', hint: 'Stars' },
  { value: 'color', label: 'Colour', icon: 'palette', hint: 'Colour picker' },
];

export const TYPE_BY_VALUE: Record<string, FieldType> = Object.fromEntries(FIELD_TYPES.map(t => [t.value, t]));
export const typeLabel = (v: string) => TYPE_BY_VALUE[v]?.label || v;
export const hasOptions = (v: string) => !!TYPE_BY_VALUE[v]?.options;

/** A field as the input component needs it (both designers map to this). */
export interface DesignField {
  name: string; label: string; field_type: string; options?: string[]; required?: boolean;
  section?: string; order?: number; help_text?: string; placeholder?: string; default?: string; id?: number;
}

/** Text shown in lists, exports and history for a stored value. */
export function showValue(v: any): string {
  if (v === null || v === undefined || v === '') { return ''; }
  if (Array.isArray(v)) { return v.join(', '); }
  if (typeof v === 'boolean') { return v ? 'Yes' : 'No'; }
  if (typeof v === 'object') { return v.name || v.code || ''; }
  return String(v);
}

/** Browser-side check before saving (the server checks again). Returns an error message or ''. */
export function checkValue(f: DesignField, v: any): string {
  const empty = v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
  if (empty) { return f.required ? `${f.label} is required.` : ''; }
  const s = String(v).trim();
  switch (f.field_type) {
    case 'integer': return /^-?\d+$/.test(s.replace(/,/g, '')) ? '' : `${f.label}: enter a whole number.`;
    case 'decimal': case 'currency': return isNaN(Number(s.replace(/,/g, ''))) ? `${f.label}: enter a number.` : '';
    case 'percent': { const n = Number(s.replace('%', '')); return isNaN(n) || n < 0 || n > 100 ? `${f.label}: enter 0 to 100.` : ''; }
    case 'email': return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? '' : `${f.label}: enter a valid e-mail address.`;
    case 'phone': return /^[+0-9 ()-]{6,20}$/.test(s) ? '' : `${f.label}: enter a valid phone number.`;
    case 'url': return /^(https?:\/\/)?[^\s/$.?#].[^\s]*$/i.test(s) ? '' : `${f.label}: enter a valid web link.`;
  }
  return '';
}

/** Sort by section then order; returns [{section, fields}] keeping the first-seen section order. */
export function bySection<T extends { section?: string; order?: number }>(fields: T[]): { section: string; fields: T[] }[] {
  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out: { section: string; fields: T[] }[] = [];
  for (const f of sorted) {
    const s = (f.section || '').trim();
    let g = out.find(x => x.section === s);
    if (!g) { g = { section: s, fields: [] }; out.push(g); }
    g.fields.push(f);
  }
  // fields without a section first
  return out.sort((a, b) => (a.section ? 1 : 0) - (b.section ? 1 : 0));
}

/** Where a form designer reads and saves its fields (extra fields of a screen, or the employee custom fields). */
export interface DesignerAdapter {
  title: string;
  /** Extra columns this designer can store (false: no list / default / active switches). */
  rich: boolean;
  load(): Promise<any[]>;
  add(f: any): Promise<any>;
  save(f: any): Promise<any>;
  remove(f: any): Promise<any>;
  reorder(fields: any[]): Promise<any>;
}
