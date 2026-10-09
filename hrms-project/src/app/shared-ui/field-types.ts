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

/** v1.12.0: rules of a designer field (same keys on the server, DataTools/fieldrules.py). */
export interface FieldRules {
  default?: any; min?: number | string | null; max?: number | string | null; min_length?: number | null; max_length?: number | null;
  regex?: string; regex_message?: string;
  /** where the field shows: create, edit, view, list, export, ess (empty: everywhere) */
  visible_on?: string[];
  show_if?: { field: string; op: 'eq' | 'ne' | 'in' | 'filled' | 'empty'; value?: any } | null;
  ess_read_only?: boolean;
}
export const VISIBLE_PLACES: { value: string; label: string }[] = [
  { value: 'create', label: 'New record form' }, { value: 'edit', label: 'Edit form' }, { value: 'view', label: 'Details page' },
  { value: 'list', label: 'List column' }, { value: 'export', label: 'Export' }, { value: 'ess', label: 'Employee self service' },
];
export const SHOW_OPS: { value: string; label: string }[] = [
  { value: 'eq', label: 'is' }, { value: 'ne', label: 'is not' }, { value: 'in', label: 'is one of (comma separated)' },
  { value: 'filled', label: 'is filled in / ticked' }, { value: 'empty', label: 'is empty / not ticked' },
];
const NUMERIC = ['integer', 'decimal', 'currency', 'percent', 'rating'];
const TEXTUAL = ['text', 'textarea', 'email', 'phone', 'url'];
/** Which rule inputs make sense for a type. */
export const ruleKinds = (t: string) => ({
  range: NUMERIC.includes(t) || ['date', 'datetime', 'time', 'multiselect'].includes(t),
  length: TEXTUAL.includes(t),
  rangeInput: NUMERIC.includes(t) || t === 'multiselect' ? 'number' : t === 'date' ? 'date' : t === 'datetime' ? 'datetime-local' : t === 'time' ? 'time' : 'text',
});

/** A field as the input component needs it (both designers map to this). */
export interface DesignField {
  name: string; label: string; field_type: string; options?: string[]; required?: boolean;
  section?: string; order?: number; help_text?: string; placeholder?: string; default?: string; id?: number;
  rules?: FieldRules;
}

const empty = (v: any) => v === null || v === undefined || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
const FALSE_TEXT = ['0', 'false', 'no', 'n', 'off'];

/** Is the field shown for these values ({name or label: value})? (the "show only if" rule) */
export function showIfOk(rules: FieldRules | undefined | null, values: Record<string, any>): boolean {
  const si = rules?.show_if;
  if (!si || !si.field) { return true; }
  const key = Object.keys(values || {}).find(k => k.toLowerCase() === String(si.field).toLowerCase());
  const v = key !== undefined ? values[key] : undefined;
  if (si.op === 'filled') { return !empty(v) && v !== false && !FALSE_TEXT.includes(String(v).toLowerCase()); }
  if (si.op === 'empty') { return empty(v) || v === false || FALSE_TEXT.includes(String(v).toLowerCase()); }
  const norm = (x: any) => { const s = String(x ?? '').trim().toLowerCase(); return ({ true: 'yes', '1': 'yes', false: 'no', '0': 'no' } as any)[s] || s; };
  const have = typeof v === 'boolean' ? [v ? 'yes' : 'no'] : (Array.isArray(v) ? v : String(v ?? '').split(',')).map(norm);
  const want = (Array.isArray(si.value) ? si.value : si.op === 'in' ? String(si.value ?? '').split(',') : [si.value]).map(norm);
  const hit = want.some(w => have.includes(w));
  return si.op === 'ne' ? !hit : hit;
}

/** Is the field shown at this place (create, edit, view, list, export, ess)? */
export function visibleOn(rules: FieldRules | undefined | null, where: string): boolean {
  const v = rules?.visible_on;
  return !v || !v.length || v.includes(where);
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
  if (f.field_type === 'checkbox') {
    const on = v === true || ['yes', 'true', '1', 'on'].includes(String(v).toLowerCase());
    return f.required && !on ? `${f.label} must be ticked.` : '';
  }
  if (empty(v)) { return f.required ? `${f.label} is required.` : ''; }
  const s = String(v).trim();
  const r = f.rules || {};
  let n = NaN;
  switch (f.field_type) {
    case 'integer': if (!/^-?\d+$/.test(s.replace(/,/g, ''))) { return `${f.label}: enter a whole number.`; } n = Number(s.replace(/,/g, '')); break;
    case 'decimal': case 'currency': n = Number(s.replace(/,/g, '')); if (isNaN(n)) { return `${f.label}: enter a number.`; } break;
    case 'percent': n = Number(s.replace('%', '')); if (isNaN(n) || n < 0 || n > 100) { return `${f.label}: enter 0 to 100.`; } break;
    case 'rating': n = Number(s); if (!/^[1-5]$/.test(s)) { return `${f.label}: choose 1 to 5 stars.`; } break;
    case 'email': if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) { return `${f.label}: enter a valid e-mail address.`; } break;
    case 'phone': if (!/^[+0-9 ()-]{6,20}$/.test(s)) { return `${f.label}: enter a valid phone number.`; } break;
    case 'url': if (!/^(https?:\/\/)?[^\s/$.?#].[^\s]*$/i.test(s)) { return `${f.label}: enter a valid web link.`; } break;
    case 'color': if (!/^#[0-9a-f]{6}$/i.test(s)) { return `${f.label}: choose a colour.`; } break;
    case 'time': if (!/^\d{1,2}:\d{2}/.test(s)) { return `${f.label}: enter a time (HH:MM).`; } break;
    case 'datetime': if (isNaN(Date.parse(s))) { return `${f.label}: enter a date and time.`; } break;
    case 'dropdown': case 'radio': if ((f.options || []).length && !(f.options || []).some(o => o.toLowerCase() === s.toLowerCase())) { return `${f.label}: choose one of ${(f.options || []).join(', ')}.`; } break;
    case 'multiselect': {
      const items = Array.isArray(v) ? v : s.split(/[;,]/).map(x => x.trim()).filter(Boolean);
      const bad = items.find((x: string) => !(f.options || []).some(o => o.toLowerCase() === String(x).toLowerCase()));
      if (bad) { return `${f.label}: “${bad}” is not one of the options.`; }
      n = items.length;
      if (r.min != null && r.min !== '' && n < Number(r.min)) { return `${f.label}: choose at least ${r.min}.`; }
      if (r.max != null && r.max !== '' && n > Number(r.max)) { return `${f.label}: choose at most ${r.max}.`; }
      return '';
    }
  }
  if (!isNaN(n)) {
    if (r.min != null && r.min !== '' && n < Number(r.min)) { return `${f.label}: enter ${r.min} or more.`; }
    if (r.max != null && r.max !== '' && n > Number(r.max)) { return `${f.label}: enter ${r.max} or less.`; }
  }
  if (['date', 'datetime', 'time'].includes(f.field_type) && (r.min || r.max)) {
    const dm = /^(\d{2})[-/](\d{2})[-/](\d{4})/.exec(s);
    const iso = f.field_type === 'date' ? (dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : s.slice(0, 10)) : f.field_type === 'datetime' ? s.replace(' ', 'T').slice(0, 16) : s.slice(0, 5).padStart(5, '0');
    if (r.min && iso < String(r.min)) { return `${f.label}: enter ${r.min} or later.`; }
    if (r.max && iso > String(r.max)) { return `${f.label}: enter ${r.max} or earlier.`; }
  }
  if (TEXTUAL.includes(f.field_type)) {
    if (r.min_length != null && s.length < r.min_length) { return `${f.label}: enter at least ${r.min_length} characters.`; }
    if (r.max_length != null && s.length > r.max_length) { return `${f.label}: enter at most ${r.max_length} characters.`; }
    if (r.regex) { try { if (!new RegExp('^(?:' + r.regex + ')$').test(s)) { return `${f.label}: ${r.regex_message || 'the value is not in the expected format.'}`; } } catch { /* the server checks it */ } }
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
