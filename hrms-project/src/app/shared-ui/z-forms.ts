/** v1.62.1 – the forms of the old master screens, on the shared form shell (z-form.component.ts). */
import { ZFormConfig, openZForm } from './z-form.component';

const BRANCHES = { endpoint: '/organisation/api/Branch/', label: 'branch_name' };
const branchMulti = { key: 'branch', label: 'Branches', type: 'multi' as const, source: BRANCHES, hint: 'The branches that use it. None ticked = every branch.' };

export const DEPARTMENT_FORM: ZFormConfig = {
  thing: 'department', endpoint: '/organisation/api/Department/', subtitle: 'A department of the organisation chart; employees, approvals and reports use it.',
  sections: [{ title: 'Department', fields: [
    { key: 'dept_name', label: 'Name', max: 100 }, { key: 'dept_code', label: 'Code', max: 50 },
    { key: 'dept_description', label: 'Description', type: 'textarea', max: 500 }, branchMulti,
    { key: 'dept_is_active', label: 'Active', type: 'check', editOnly: true }] }],
};
export const DESIGNATION_FORM: ZFormConfig = {
  thing: 'designation', endpoint: '/organisation/api/Designation/', subtitle: 'A job title; employees, salary structures and reports use it.',
  sections: [{ title: 'Designation', fields: [
    { key: 'desgntn_job_title', label: 'Job title', max: 100 }, { key: 'desgntn_code', label: 'Code', max: 50 },
    { key: 'desgntn_description', label: 'Description', type: 'textarea', max: 500 }, branchMulti,
    { key: 'desgntn_is_active', label: 'Active', type: 'check', editOnly: true }] }],
};
export const CATEGORY_FORM: ZFormConfig = {
  thing: 'category', endpoint: '/organisation/api/Catogory/', subtitle: 'An employee category (e.g. staff, labour); policies and reports use it.',
  sections: [{ title: 'Category', fields: [
    { key: 'ctgry_title', label: 'Name', max: 100 }, { key: 'ctgry_code', label: 'Code', max: 50 },
    { key: 'ctgry_description', label: 'Description', type: 'textarea', max: 500 }, branchMulti,
    { key: 'ctgry_is_active', label: 'Active', type: 'check', editOnly: true }] },
    // v1.67.0 (item 23): rest days of the category – written as its weekend (the same records as Calendar › Assign weekends)
    { title: 'Rest days', fields: [
      { key: 'rest_days', label: 'Rest days (weekend)', type: 'multi', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ value: d, label: d.slice(0, 3) })),
        hint: 'Empty = the department / branch weekend applies. Half days, alternate weeks and a change from a date: Calendar › Weekend calendar.' }] }],
};
export const DOC_REQUEST_TYPE_FORM: ZFormConfig = {
  thing: 'document request type', endpoint: '/employee/api/Doc-request-Type/', subtitle: 'A document employees can ask HR for (salary certificate, NOC …).',
  sections: [{ title: 'Document request type', fields: [
    { key: 'type_name', label: 'Name', max: 100 }, { key: 'min_approvals_required', label: 'Approvals needed', type: 'number' },
    { key: 'description', label: 'Description', type: 'textarea' }, branchMulti,
    { key: 'is_active', label: 'Active', type: 'check', editOnly: true }] }],
};

export const BRANCH_FORM: ZFormConfig = {
  thing: 'branch', endpoint: '/organisation/api/Branch/', subtitle: 'A branch (legal or working unit) of the company: its address, contact and the probation period of its employees.',
  sections: [
    { title: 'Branch', fields: [
      { key: 'branch_name', label: 'Name', max: 100 }, { key: 'branch_code', label: 'Code', max: 50 },
      { key: 'br_start_date', label: 'Start date', type: 'date' }, { key: 'probation_period_days', label: 'Probation (days)', type: 'number' }] },
    { title: 'Address and contact', fields: [
      { key: 'br_country', label: 'Country', type: 'select', source: { endpoint: '/core/api/Country/', label: 'country_name' } },
      { key: 'br_state_id', label: 'Emirate / state', type: 'select', source: { endpoint: '/core/api/State/', label: 'state_name' },
        optFilter: (raw, v, o) => !v.br_country || raw?.country === (o['br_country'] || []).find(c => c.value === v.br_country)?.label },
      { key: 'br_city', label: 'City', max: 100 }, { key: 'br_pincode', label: 'P.O. box / postcode', max: 20 },
      { key: 'branch_address', label: 'Address', type: 'textarea' },
      { key: 'br_branch_nmbr_1', label: 'Phone' }, { key: 'br_branch_nmbr_2', label: 'Second phone' },
      { key: 'br_branch_mail', label: 'E-mail', type: 'email' },
      { key: 'br_is_active', label: 'Active', type: 'check', editOnly: true }] },
    // v1.62.1 (user request 2 Nov): where the new branch takes its setup from
    { title: 'Setup of the new branch', fields: [
      { key: 'copy_setup_from', label: 'Copy the setup from', type: 'select', createOnly: true, full: true,
        source: { endpoint: '/organisation/api/Branch/', label: 'branch_name' }, showIf: v => !v.copy_setup_none,
        hint: 'Weekend and holiday calendars, leave types with their entitlements and approvals, salary components and pay structures. Empty: the first branch.' },
      { key: 'copy_setup_none', label: 'Do not copy – I will set this branch up myself', type: 'check', createOnly: true, full: true }] }],
  okText: (d, t) => d?.setup_copy?.source ? t('Branch saved – its setup was copied from {0}.', [d.setup_copy.source]) : null,
};

/** v1.62.1: copy the setup of another branch into an existing one (only what it does not have yet is added) */
export function branchCopySetupForm(branchId: number, branchName: string): ZFormConfig {
  return {
    thing: 'branch setup', endpoint: `/organisation/api/Branch/${branchId}/copy-setup/`,
    heading: 'Copy the setup from another branch', action: 'Copy the setup',
    subtitle: 'Adds the calendars, leave types with their approvals, salary components and pay structures of the branch you choose. Nothing this branch already has is changed, so you can run it again after the other branch got something new.',
    sections: [{ title: 'Copy from', fields: [
      { key: 'source', label: 'Branch to copy from', type: 'select', required: true, full: true,
        source: { endpoint: '/organisation/api/Branch/', label: 'branch_name', filter: (r: any) => r.id !== branchId } }] }],
    okText: d => d?.detail || null,
  };
}

export const DOCUMENT_TYPE_FORM: ZFormConfig = {
  thing: 'document type', endpoint: '/employee/api/Documents/', subtitle: 'A kind of employee document (passport, visa, Emirates ID …); expiry alerts use it.',
  sections: [{ title: 'Document type', fields: [
    { key: 'type_name', label: 'Name', max: 100 }, { key: 'description', label: 'Description', type: 'textarea' }, branchMulti,
    { key: 'is_active', label: 'Active', type: 'check', editOnly: true }] }],
};
export const LEAVE_TYPE_FORM: ZFormConfig = {
  thing: 'leave type', endpoint: '/calendars/api/leave-type/', subtitle: 'A kind of leave. Entitlements, accrual and pay rules are set on Leave policies.',
  sections: [
    { title: 'Leave type', fields: [
      { key: 'name', label: 'Name', max: 100 }, { key: 'code', label: 'Code', max: 30 },
      { key: 'type', label: 'Paid or unpaid', type: 'select' }, { key: 'unit', label: 'Counted in', type: 'select' },
      // v1.67.5 (bugs) L4: a leave type has ONE branch (or none = every branch). The multi-branch field got the branch name
      // from the API ("Dubai Head Office"), failed on it ((…).some is not a function) and the Edit window stopped after
      // "Branches" – no other field, Save never finished.
      { key: 'leave_category', label: 'Category', type: 'select' },
      { key: 'branch', label: 'Branch', type: 'select', source: { endpoint: '/organisation/api/Branch/', label: 'branch_name' }, hint: 'Empty (–) = every branch.' },
      { key: 'valid_from', label: 'Valid from', type: 'date' }, { key: 'valid_to', label: 'Valid to', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' }] },
    { title: 'Rules', fields: [
      { key: 'allow_half_day', label: 'Half days allowed', type: 'check' }, { key: 'negative', label: 'Balance may go below zero', type: 'check' },
      { key: 'include_weekend', label: 'Weekends inside the leave count', type: 'check' }, { key: 'include_holiday', label: 'Holidays inside the leave count', type: 'check' },
      { key: 'is_compensatory', label: 'Compensatory leave', type: 'check' }, { key: 'use_common_workflow', label: 'Use the common approval workflow', type: 'check' },
      { key: 'include_dashboard', label: 'Show on the dashboard', type: 'check' }] }],
  fromRecord: (r: any) => ({ ...r, branch: r?.branch_id ?? (typeof r?.branch === 'number' ? r.branch : null) }),   // v1.67.5 (bugs) L4
};
export const USER_FORM: ZFormConfig = {
  thing: 'user', endpoint: '/users/api/user/', subtitle: 'A sign-in to ZEO for this company. Link it to the employee on the employee page; rights come from the permission groups.',
  sections: [
    { title: 'Sign-in', fields: [
      { key: 'username', label: 'User name', max: 150 }, { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'password', label: 'Password', type: 'password', createOnly: true, required: true, hint: '8 characters or more, letters and digits.' }] },
    { title: 'Access', fields: [
      { key: 'is_ess', label: 'Self-service only (employee)', type: 'check' }, { key: 'is_superuser', label: 'Company administrator (all rights)', type: 'check' },
      { key: 'must_change_password', label: 'Change the password at the next sign-in', type: 'check' },
      { key: 'is_active', label: 'Active', type: 'check', editOnly: true }] }],
  toBody: (v, editing) => {
    const b: any = { ...v };
    if (!editing) { const id = Number(localStorage.getItem('selectedSchemaId') || 0); b.tenants = id ? [id] : []; }
    else { delete b.password; }
    return b;
  },
};

/** one editor for the e-mail templates of every request type */
export function emailTemplateForm(endpoint: string, thing = 'e-mail template', typeKey = 'template_type'): ZFormConfig {
  return {
    thing, endpoint, subtitle: 'The e-mail sent at this step. Placeholders such as {{ employee_name }} are filled in when it is sent.',
    sections: [{ title: 'E-mail', fields: [
      { key: typeKey, label: 'When it is sent', type: 'select' },
      branchMulti,
      { key: 'subject', label: 'Subject', full: true, max: 255 },
      { key: 'body', label: 'Text', type: 'html', hint: 'Plain text or HTML.' }] }],
  };
}

/** after a save the screen's page is drawn again (its list reloads) */
export async function zFormThenReload(cfg: ZFormConfig, record?: any): Promise<boolean> {
  const saved = await openZForm(cfg, record);
  if (saved) { window.dispatchEvent(new CustomEvent('zeo-reopen-page')); }
  return saved;
}
