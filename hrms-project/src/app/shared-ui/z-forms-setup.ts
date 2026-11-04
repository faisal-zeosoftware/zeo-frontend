/**
 * v1.62.10 (item 175) – the create / edit forms of the old setup screens (policies, types, states, numbering, expiry alerts,
 * e-mail configuration) on the shared form shell (z-form.component.ts), instead of their old in-template pop-ups.
 * Same endpoints and the same fields the old pop-ups sent – no data or calculation change.
 */
import { ZFormConfig, ZFormField } from './z-form.component';

const BRANCHES = { endpoint: '/organisation/api/Branch/', label: 'branch_name' };
/** the company's sign-ins (as the old pop-ups listed them); records name them by user name */
export const TENANT_USERS = { endpoint: '/users/tenant-users/', label: (r: any) => r.email && r.email !== r.username ? `${r.username} – ${r.email}` : r.username };
const branchMulti = (key = 'branch'): ZFormField => ({ key, label: 'Branches', type: 'multi', source: BRANCHES, hint: 'The branches that use it. None ticked = every branch.' });
const deptMulti = (key = 'department'): ZFormField => ({ key, label: 'Departments', type: 'multi', search: true, source: { endpoint: '/organisation/api/Department/', label: 'dept_name' } });
const desgMulti = (key = 'designation'): ZFormField => ({ key, label: 'Designations', type: 'multi', search: true, source: { endpoint: '/organisation/api/Designation/', label: 'desgntn_job_title' } });
const catMulti = (key = 'category'): ZFormField => ({ key, label: 'Categories', type: 'multi', source: { endpoint: '/organisation/api/Catogory/', label: 'ctgry_title' } });
const empMulti = (key = 'employee'): ZFormField => ({ key, label: 'Employees', type: 'multi', search: true, matchKeys: ['code'],
  source: { endpoint: '/tools/api/directory/', label: (r: any) => `${r.code} – ${r.name}` } });

/** the signed-in user's id (from the token) – the old pop-ups sent it as created_by */
export function zMyUserId(): number | null {
  try {
    const p = JSON.parse(atob((localStorage.getItem('auth_token') || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number(p.user_id || p.id) || null;
  } catch { return null; }
}
const withCreator = (v: any, editing: boolean) => { const b = { ...v }; if (!editing) { b.created_by = zMyUserId(); } return b; };
/** an edit sends only what was changed (numbering counters and other live values are never written back from an old copy) */
const keepOrig = (r: any) => ({ ...r, _orig: { ...r } });
function onlyChanged(v: any, editing: boolean): any {
  const b = { ...v }; const o = b._orig; delete b._orig;
  if (!editing || !o) { return b; }
  for (const k of Object.keys(b)) { if (JSON.stringify(b[k]) === JSON.stringify(o[k])) { delete b[k]; } }
  return b;
}

// ---------- Attendance › Setup ----------
export const ROUND_OFF_FORM: ZFormConfig = {
  thing: 'round-off policy', endpoint: '/calendars/api/attendance-policy/',
  subtitle: 'How early or late punches of a branch are rounded to the shift times.',
  sections: [
    { title: 'Policy', fields: [
      { key: 'name', label: 'Name', max: 100 },
      { key: 'branch', label: 'Branch', type: 'select', source: BRANCHES },
      { key: 'is_active', label: 'Active', type: 'check' }] },
    { title: 'Rounding', fields: [
      { key: 'early_check_in', label: 'Early check-in', type: 'check' },
      { key: 'early_check_in_minutes', label: 'Early check-in (minutes)', type: 'number', showIf: v => !!v.early_check_in },
      { key: 'late_check_in', label: 'Late check-in', type: 'check' },
      { key: 'late_check_in_minutes', label: 'Late check-in (minutes)', type: 'number', showIf: v => !!v.late_check_in },
      { key: 'early_check_out', label: 'Early check-out', type: 'check' },
      { key: 'early_check_out_minutes', label: 'Early check-out (minutes)', type: 'number', showIf: v => !!v.early_check_out },
      { key: 'late_check_out', label: 'Late check-out', type: 'check' },
      { key: 'late_check_out_minutes', label: 'Late check-out (minutes)', type: 'number', showIf: v => !!v.late_check_out }] }],
  toBody: v => {   // as the old pop-up: the minutes of a rule that is off are cleared
    const b = { ...v };
    for (const k of ['early_check_in', 'late_check_in', 'early_check_out', 'late_check_out']) { if (!b[k]) { b[k + '_minutes'] = null; } }
    return b;
  },
};

function lateEarlyForm(early: boolean): ZFormConfig {
  return {
    thing: early ? 'early exit policy' : 'late coming policy', endpoint: early ? '/calendars/api/early-going-policy/' : '/calendars/api/late-come-policy/',
    subtitle: early ? 'What happens when an employee leaves early too often in a month.' : 'What happens when an employee comes late too often in a month.',
    sections: [
      { title: 'Policy', fields: [
        { key: 'attendance_policy', label: 'Round-off policy', type: 'select', source: { endpoint: '/calendars/api/attendance-policy/', label: 'name' } },
        { key: early ? 'occurrence_limit' : 'late_occurrence_limit', label: early ? 'Early exits allowed' : 'Late arrivals allowed', type: 'number', hint: 'Times in a month before the penalty applies.' },
        { key: 'penalty_type', label: 'Penalty', type: 'select' },
        { key: 'leave_days_to_deduct', label: 'Leave days to deduct', type: 'number' },
        { key: 'enabled', label: 'Active', type: 'check' },
        { key: 'reset_monthly', label: 'Count again every month', type: 'check' }] },
      { title: 'Applies to', fields: [branchMulti(), deptMulti(), catMulti(), desgMulti(), empMulti()] }],
  };
}
export const LATE_COMING_FORM = lateEarlyForm(false);
export const EARLY_EXIT_FORM = lateEarlyForm(true);

export const OVERTIME_POLICY_FORM: ZFormConfig = {
  thing: 'overtime policy', endpoint: '/calendars/api/overtime_policy/',
  subtitle: 'The overtime rate for a kind of overtime and the employees it applies to.',
  sections: [
    { title: 'Policy', fields: [
      { key: 'name', label: 'Name', max: 100 }, { key: 'ot_type', label: 'Overtime type', type: 'select' },
      { key: 'rate_multiplier', label: 'Rate (× hourly pay)', type: 'number', hint: 'e.g. 1.25 or 1.5' },
      { key: 'is_active', label: 'Active', type: 'check' }] },
    { title: 'Applies to', fields: [branchMulti(), deptMulti(), catMulti(), desgMulti()] }],
};

/** "02:00" → "02:00:00" (a duration "02:00" would be read as 2 minutes), "1.5" → "01:30:00" */
function toDuration(x: any): any {
  const s = String(x ?? '').trim();
  if (/^\d+(\.\d+)?$/.test(s)) { const m = Math.round(parseFloat(s) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`; }
  if (/^\d{1,3}:\d{2}$/.test(s)) { return s + ':00'; }
  return s;
}
export const OVERTIME_RULE_FORM: ZFormConfig = {
  thing: 'overtime rule', endpoint: '/calendars/api/overtime_rule/',
  subtitle: 'When overtime starts to count under an overtime policy.',
  sections: [{ title: 'Rule', fields: [
    { key: 'policy', label: 'Overtime policy', type: 'select', source: { endpoint: '/calendars/api/overtime_policy/', label: 'name' } },
    { key: 'order', label: 'Order', type: 'number' },
    { key: 'rule_type', label: 'Counted per', type: 'select' }, { key: 'base_type', label: 'Measured against', type: 'select' },
    { key: 'threshold_hours', label: 'Threshold (hours)', placeholder: 'hh:mm', hint: 'e.g. 02:00 or 1.5' },
    { key: 'is_extended', label: 'Extended overtime', type: 'check' }, { key: 'is_active', label: 'Active', type: 'check' }] }],
  fromRecord: r => ({ ...r, threshold_hours: /^\d+:\d{2}:00$/.test(String(r.threshold_hours || '')) ? String(r.threshold_hours).slice(0, -3) : r.threshold_hours }),
  toBody: v => ({ ...v, threshold_hours: toDuration(v.threshold_hours) }),
};

// ---------- Employees › Setup ----------
export const GRATUITY_FORM: ZFormConfig = {
  thing: 'gratuity band', endpoint: '/organisation/api/gratuity/',
  subtitle: 'Days of basic pay for each year of service, by years of service (resignation and termination).',
  sections: [{ title: 'Years of service', fields: [
    { key: 'minimum_value', label: 'From (years)', type: 'number' }, { key: 'maximum_value', label: 'To (years)', type: 'number' },
    { key: 'resignation_days', label: 'Days per year – resignation', type: 'number' }, { key: 'termination_days', label: 'Days per year – termination', type: 'number' },
    { key: 'is_active', label: 'Active', type: 'check' }] }],
};

// ---------- Requests / Loans / Assets › Setup ----------
export const REQUEST_TYPE_FORM: ZFormConfig = {
  thing: 'request type', endpoint: '/employee/api/request-type/',
  subtitle: 'A kind of general request employees can send (business cards, visa letters …).',
  sections: [{ title: 'Request type', fields: [
    { key: 'name', label: 'Name', max: 50 }, { key: 'salary_component', label: 'Salary component', type: 'select', source: { endpoint: '/payroll/api/salarycomponent/', label: 'name' }, hint: 'Only when the request is paid through payroll.' },
    { key: 'description', label: 'Description', type: 'textarea', max: 150 }, branchMulti(),
    { key: 'use_common_workflow', label: 'Use the common approval workflow', type: 'check' }] }],
  toBody: withCreator,
};
export const LOAN_TYPE_FORM: ZFormConfig = {
  thing: 'loan type', endpoint: '/payroll/api/loan-type/',
  subtitle: 'A kind of loan, its highest amount and repayment period.',
  sections: [{ title: 'Loan type', fields: [
    { key: 'loan_type', label: 'Name', max: 255 }, { key: 'max_amount', label: 'Highest amount (AED)', type: 'number' },
    { key: 'repayment_period', label: 'Repayment period (months)', type: 'number' }, branchMulti(),
    { key: 'use_common_workflow', label: 'Use the common approval workflow', type: 'check' }] }],
  toBody: withCreator,
};
export const ASSET_TYPE_FORM: ZFormConfig = {
  thing: 'asset type', endpoint: '/organisation/api/asset-type/',
  subtitle: 'A kind of company asset (laptops, phones, vehicles …); asset requests and the asset form designer use it.',
  sections: [{ title: 'Asset type', fields: [
    { key: 'name', label: 'Name', max: 255 }, branchMulti(),
    { key: 'description', label: 'Description', type: 'textarea' }] }],
};

// ---------- Settings › Company ----------
export const STATE_FORM: ZFormConfig = {
  thing: 'emirate or state', endpoint: '/core/api/State/',
  subtitle: 'An emirate or state of a country; branches and addresses use it.',
  sections: [{ title: 'Emirate or state', fields: [
    { key: 'state_name', label: 'Name', max: 50 },
    { key: 'country', label: 'Country', type: 'select', search: true, source: { endpoint: '/core/api/Country/', label: 'country_name' } },
    { key: 'is_active', label: 'Active', type: 'check', editOnly: true }] }],
};
export const DOC_NUMBERING_FORM: ZFormConfig = {
  thing: 'document numbering', endpoint: '/organisation/api/document-numbering/',
  subtitle: 'How the numbers of one kind of request are made in a branch. Editing changes only what you change here.',
  sections: [
    { title: 'Numbering', fields: [
      { key: 'type', label: 'Document', type: 'select' }, { key: 'branch_id', label: 'Branch', type: 'select', source: BRANCHES },
      { key: 'prefix', label: 'Prefix', max: 50 }, { key: 'suffix', label: 'Suffix', max: 50 },
      { key: 'current_number', label: 'Current number', type: 'number', hint: 'The last number used; the next one is one higher.' },
      { key: 'total_length', label: 'Total length', type: 'number' },
      { key: 'start_date', label: 'Start date', type: 'date' }, { key: 'end_date', label: 'End date', type: 'date' },
      { key: 'user', label: 'User', type: 'select', search: true, matchKeys: ['username'], source: TENANT_USERS },
      { key: 'automatic_numbering', label: 'Automatic numbering', type: 'check' }] }],
  fromRecord: keepOrig,
  toBody: onlyChanged,
};

// ---------- HR settings › Notifications ----------
export const DOC_EXPIRY_ALERT_FORM: ZFormConfig = {
  thing: 'document expiry alert', endpoint: '/employee/api/notification-settings/',
  subtitle: 'Who is told, and when, before and after an employee document expires.',
  sections: [
    { title: 'Alert', fields: [
      { key: 'document_type', label: 'Document type', type: 'select', source: { endpoint: '/employee/api/Documents/', label: 'type_name' } },
      { key: 'days_before_expiry', label: 'Days before expiry', type: 'number' }, { key: 'days_after_expiry', label: 'Days after expiry', type: 'number' },
      { key: 'send_email', label: 'Send an e-mail', type: 'check' },
      { key: 'notify_users', label: 'Tell these users', type: 'multi', search: true, matchKeys: ['username'],
        source: TENANT_USERS }] },
    { title: 'Employees it covers', fields: [branchMulti(), deptMulti('Department'), catMulti('Category'), desgMulti('Designation')] }],
  toBody: withCreator,
};

// ---------- Settings › E-mail ----------
export const EMAIL_CONFIG_FORM: ZFormConfig = {
  thing: 'e-mail configuration', endpoint: '/employee/api/email-config/',
  subtitle: 'The mail server ZEO sends this company’s e-mails with.',
  sections: [{ title: 'Mail server', fields: [
    { key: 'email_host', label: 'Mail server (host)', max: 255, required: true }, { key: 'email_port', label: 'Port', type: 'number', required: true },
    { key: 'email_host_user', label: 'User name', max: 255, required: true },
    { key: 'email_host_password', label: 'Password', type: 'password', hint: 'Leave empty to keep the saved password.' },
    { key: 'email_use_tls', label: 'Use TLS', type: 'check' }, { key: 'is_active', label: 'Active', type: 'check' }] }],
  fromRecord: r => ({ ...r, email_host_password: '' }),
  toBody: (v, editing) => { const b = withCreator(v, editing); if (editing && !b.email_host_password) { delete b.email_host_password; } return b; },
};
