// v1.62.10 (item 176)
/** v1.62.10 (item 176) – the shared-form (z-form) configs of the calendar screens: weekend calendar, holiday calendar,
 *  holiday and the two assignment screens. They write the same records and fields as the old pop-ups. */
import { ZFormConfig, ZFormField } from '../shared-ui/z-form.component';
import { DAYS, empName } from './t62';

export const DAY_TYPES = [{ value: 'fullday', label: 'Working day' }, { value: 'halfday', label: 'Half day' }, { value: 'leave', label: 'Day off' }];
const WEEKS = [1, 2, 3, 4, 5].map(n => ({ value: n, label: `Week ${n}` }));
const low = (d: string) => d.toLowerCase();
// the years the server accepts (2000–2039); fixed here – the API's OPTIONS answer is refused to users without the add right
const Y0 = new Date().getFullYear();
export const YEARS = Array.from({ length: 40 }, (_, i) => 2000 + i).sort((a, b) => Math.abs(a - Y0) - Math.abs(b - Y0) || a - b).slice(0, 40).sort((a, b) => a - b).map(y => ({ value: y, label: String(y) }));

export const WEEKEND_FORM: ZFormConfig = {
  thing: 'weekend calendar', endpoint: '/calendars/api/weekend/',
  subtitle: 'The weekly days off of a year. Give it to branches, departments, categories, designations or employees under Assign weekends.',
  initial: { year: new Date().getFullYear(), monday: 'fullday', tuesday: 'fullday', wednesday: 'fullday', thursday: 'fullday', friday: 'fullday', saturday: 'leave', sunday: 'leave', alt_on: false },
  sections: [
    { title: 'Weekend calendar', fields: [
      { key: 'calendar_code', label: 'Code', max: 100, required: true },
      { key: 'year', label: 'Year', type: 'select', required: true, options: YEARS },
      { key: 'description', label: 'Description', type: 'textarea', required: true }] },
    { title: 'Days', fields: DAYS.map(d => ({ key: low(d), label: d, type: 'select' as const, options: DAY_TYPES, required: true })) },
    { title: 'Off only in some weeks', fields: [
      { key: 'alt_on', label: 'Some days are off only in some weeks of the month', type: 'check', full: true,
        hint: 'For example Saturday off in weeks 2 and 4. Week 1 is days 1–7 of the month, week 2 days 8–14 …' },
      ...DAYS.map(d => ({ key: 'alt_' + low(d), label: d, type: 'multi' as const, options: WEEKS, showIf: (v: any) => !!v.alt_on }))] }],
  fromRecord: (r: any) => {
    const v: any = { ...r };
    const alt = r.alternate_weekends && typeof r.alternate_weekends === 'object' ? r.alternate_weekends : {};
    for (const d of DAYS) { v['alt_' + low(d)] = String(alt[d] ?? alt[low(d)] ?? '').split(',').filter(x => /^\d+$/.test(x.trim())).map(x => Number(x)); }
    v.alt_on = !!r.is_alternate || Object.keys(alt).length > 0;
    return v;
  },
  toBody: (v: any) => {
    const b: any = { calendar_code: v.calendar_code, description: v.description, year: v.year };
    for (const d of DAYS) { b[low(d)] = v[low(d)] || 'fullday'; }
    const alt: any = {};
    if (v.alt_on) { for (const d of DAYS) { const w = (v['alt_' + low(d)] || []).map(Number).sort(); if (w.length) { alt[d] = w.join(','); } } }
    b.alternate_weekends = alt; b.is_alternate = Object.keys(alt).length > 0;
    return b;
  },
};

export const HOLIDAY_CALENDAR_FORM: ZFormConfig = {
  thing: 'holiday calendar', endpoint: '/calendars/api/holiday-calendar/',
  subtitle: 'The public holidays of one year. Add the holidays after saving; give the calendar to branches or employees under Assign holidays.',
  initial: { year: new Date().getFullYear() },
  sections: [{ title: 'Holiday calendar', fields: [
    { key: 'calendar_title', label: 'Name', max: 50, required: true }, { key: 'year', label: 'Year', type: 'select', required: true, options: YEARS }] }],
  toBody: (v: any) => ({ calendar_title: v.calendar_title, year: v.year }),
};

export function holidayForm(calendarId: number, year?: number): ZFormConfig {
  return {
    thing: 'holiday', endpoint: '/calendars/api/holiday/',
    subtitle: 'A public holiday (one day or several). An optional holiday counts as leave, not as a holiday.',
    initial: year ? { start_date: `${year}-01-01`, end_date: `${year}-01-01` } : {},
    sections: [{ title: 'Holiday', fields: [
      { key: 'description', label: 'Name', max: 50, required: true, full: true },
      { key: 'start_date', label: 'From', type: 'date', required: true }, { key: 'end_date', label: 'To', type: 'date', required: true },
      { key: 'note', label: 'Note', max: 50, full: true },
      { key: 'restricted', label: 'Optional (restricted) holiday', type: 'check', full: true }] }],
    toBody: (v: any) => ({ description: v.description, start_date: v.start_date, end_date: v.end_date || v.start_date, note: v.note || null, restricted: !!v.restricted, calendar: calendarId }),
  };
}

export type AssignKind = 'weekend' | 'holiday';
export const LEVEL_LABEL: Record<string, string> = { branch: 'Branches', department: 'Departments', category: 'Categories', designation: 'Designations', employee: 'Employees' };

/** Assign weekends / Assign holidays: the calendar, "Given to" (one level) and the branches / … / employees of that level */
export function assignForm(kind: AssignKind): ZFormConfig {
  const weekend = kind === 'weekend';
  const calKey = weekend ? 'weekend_model' : 'holiday_model';
  const levels = weekend ? ['branch', 'department', 'category', 'designation', 'employee'] : ['branch', 'department', 'category', 'employee'];
  const SRC: Record<string, any> = {
    branch: { endpoint: '/organisation/api/Branch/', label: 'branch_name' }, department: { endpoint: '/organisation/api/Department/', label: 'dept_name' },
    category: { endpoint: '/organisation/api/Catogory/', label: 'ctgry_title' }, designation: { endpoint: '/organisation/api/Designation/', label: 'desgntn_job_title' },
    employee: { endpoint: '/employee/api/emplist/', label: (x: any) => empName(x) },
  };
  const lv: ZFormField[] = levels.map(l => ({
    key: l, label: LEVEL_LABEL[l], type: 'multi' as const, required: true, full: true, source: SRC[l], showIf: (v: any) => v.related_to === l,
    ...(l === 'employee' ? { search: true, matchKey: 'emp_code' } : {}),
  }));
  return {
    thing: weekend ? 'weekend assignment' : 'holiday calendar assignment', endpoint: weekend ? '/calendars/api/assign-weekend/' : '/calendars/api/assign-holiday/',
    subtitle: weekend
      ? 'The most specific assignment wins: employee, then designation, category, department, branch. To change a weekend from a later date (and recount approved leave) use Weekend change from a date.'
      : 'Which holiday calendar applies to whom. An employee assignment wins over a branch, department or category.',
    initial: { related_to: 'branch' },
    sections: [
      { title: 'Assignment', fields: [
        { key: calKey, label: weekend ? 'Weekend calendar' : 'Holiday calendar', type: 'select', required: true,
          source: weekend ? { endpoint: '/calendars/api/weekend/', label: (r: any) => `${r.calendar_code} (${r.year})` } : { endpoint: '/calendars/api/holiday-calendar/', label: (r: any) => `${r.calendar_title} (${r.year})`, filter: (r: any) => r.is_active !== false /* v1.67.8 (fixes) item 1: no inactive calendars */ },
          matchKey: weekend ? 'calendar_code' : 'calendar_title' },
        { key: 'related_to', label: 'Applies to', type: 'select', required: true, options: levels.map(l => ({ value: l, label: LEVEL_LABEL[l] })) }] },
      { title: 'Applies to', fields: lv }],
    fromRecord: (r: any) => {
      const v: any = { ...r };
      for (const l of levels) { if (!Array.isArray(v[l])) { v[l] = []; } }
      if (!v.related_to) { v.related_to = levels.find(l => (v[l] || []).length) || 'employee'; }
      return v;
    },
    toBody: (v: any) => {
      const b: any = { related_to: v.related_to, [calKey]: v[calKey] };
      for (const l of [...levels, ...(weekend ? [] : ['designation'])]) { b[l] = l === v.related_to ? (v[l] || []) : []; }
      return b;
    },
  };
}
