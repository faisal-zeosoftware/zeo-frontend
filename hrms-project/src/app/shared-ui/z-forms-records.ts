/**
 * v1.62.10 (items 168, 170, 172) – the forms of the records group (leave balances, compensatory leave, documents, company
 * policies, announcements) on the shared form shell (z-form.component.ts). Kept apart from z-forms.ts so the agents of
 * other groups do not edit the same lines.
 */
import { ZFormConfig } from './z-form.component';
import { i18nT } from './i18n-core';

const EMPLOYEES_BY_CODE = { endpoint: '/employee/api/emplist/', value: 'emp_code', label: (r: any) => `${r.emp_code} – ${r.emp_name || [r.emp_first_name, r.emp_last_name].filter(Boolean).join(' ')}` };
const EMPLOYEES_BY_ID = { endpoint: '/employee/api/emplist/', value: 'id', label: (r: any) => `${r.emp_code} – ${r.emp_name || [r.emp_first_name, r.emp_last_name].filter(Boolean).join(' ')}` };

export function todayIso(): string { return new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }

/**
 * v1.62.10 (item 170): New / adjust one leave balance. Saved through the leave ledger (POST /leave-policy/api/openings/,
 * kind "adjustment"): the server writes the ledger line first and then moves the balance (engine.post(..., move_balance=True)),
 * never a direct change of the balance row. `row` = a row of the balance list (employee code, leave type name, balance).
 */
export function leaveBalanceForm(row?: any): ZFormConfig {
  const seen = new Set<string>();
  const adj = !!(row && (row.leave_type_name || row.leave_type));   // a balance row → adjust it; only an employee → a new balance of this employee
  const now = adj ? Number(row.balance || 0) : null;
  return {
    thing: 'leave balance', endpoint: '/leave-policy/api/openings/',
    heading: adj ? 'Adjust leave balance' : 'New leave balance', action: adj ? 'Save the adjustment' : 'Save',
    subtitle: 'The change is written to the leave ledger with its reason, then the balance moves. Employees see it under How my balances work.',
    initial: { employee_code: row?.employee || null, leave_type: row?.leave_type_name || row?.leave_type || null, mode: 'set', days: now, date: todayIso(), note: '' },
    sections: [
      { title: 'Balance', fields: [
        { key: 'employee_code', label: 'Employee', type: 'select', required: true, source: EMPLOYEES_BY_CODE },
        { key: 'leave_type', label: 'Leave type', type: 'select', required: true,
          source: { endpoint: '/calendars/api/leave-type/', value: 'name', label: 'name', filter: (r: any) => { const k = String(r.name || '').toLowerCase(); if (seen.has(k)) { return false; } seen.add(k); return true; } },
          hint: 'The leave type of the employee\'s branch is used.' },
        { key: 'mode', label: 'Change', type: 'select', required: true,
          options: [{ value: 'set', label: 'Set the balance to' }, { value: 'add', label: 'Add or take off (− to take off)' }] },
        { key: 'days', label: 'Days', type: 'number', required: true, hint: adj ? i18nT('Balance now: {0} days', [now]) : undefined },
        { key: 'date', label: 'Date of the change', type: 'date', required: true }] },
      { title: 'Reason', fields: [
        { key: 'note', label: 'Reason', type: 'textarea', required: true, max: 250, hint: 'Shown on the leave ledger line (e.g. opening from the old system, correction).' }] }],
    toBody: v => ({ date: v.date || todayIso(), mode: v.mode || 'set', kind: 'adjustment', note: String(v.note || '').trim(),
      rows: [{ employee_code: v.employee_code, leave_type: v.leave_type, days: Number(v.days) }] }),
    failIf: (d, t) => d && d.error_count ? (d.errors || []).map((e: string) => e.replace(/^(Row|الصف)\s*\d+\s*:\s*/, '')).join(' ') || t('Not saved – try again.') : null,
    okText: (_d, t) => t('Leave balance saved – a ledger line was written.'),
  };
}

/** v1.62.10 (item 170): a compensatory leave entry (pending until it is allocated) */
export const COMP_LEAVE_FORM: ZFormConfig = {
  thing: 'compensatory leave', endpoint: '/calendars/api/compensatory-leave-allocation/',
  subtitle: 'Days earned by working on a rest day or a holiday. Allocate the entry to credit the days to the employee\'s compensatory leave balance.',
  sections: [{ title: 'Compensatory leave', fields: [
    { key: 'employee', label: 'Employee', type: 'select', required: true, source: EMPLOYEES_BY_ID, createOnly: true },
    { key: 'credited_days', label: 'Days to credit', type: 'number', required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true, hint: 'e.g. Worked on 02/12/2026 (public holiday).' }] }],
  fromRecord: r => ({ credited_days: r.credited_days, reason: r.reason }),
};

/** v1.62.10 (item 170): credit a pending entry (the server writes the ledger line and moves the balance) */
export function compAllocateForm(row: any): ZFormConfig {
  return {
    thing: 'compensatory leave', endpoint: `/calendars/api/compensatory-leave-allocation/${row.id}/allocate/`,
    heading: 'Allocate compensatory leave', action: 'Allocate',
    subtitle: 'The days are credited to the compensatory leave balance with a leave ledger line. The entry can no longer be changed afterwards.',
    initial: { credited_days: row.credited_days },
    sections: [{ title: row.employee_name || '', fields: [
      { key: 'credited_days', label: 'Days to credit', type: 'number', required: true, hint: row.reason || undefined }] }],
    okText: (_d, t) => t('Compensatory leave allocated.'),
  };
}

/** v1.62.10 (item 168): renew / correct an employee document from Expiring documents (the old DocumentEditComponent pop-up) */
export const EMP_DOCUMENT_FORM: ZFormConfig = {
  thing: 'document', endpoint: '/employee/api/emp-Documents/',
  heading: 'Update document', action: 'Save',
  subtitle: 'Enter the renewed document: its new number and dates, and attach the new copy. Expiry alerts follow the new expiry date.',
  sections: [
    { title: 'Document', fields: [
      { key: 'emp_id', label: 'Employee', type: 'select', required: true, source: EMPLOYEES_BY_ID },
      { key: 'document_type', label: 'Document type', type: 'select', required: true, source: { endpoint: '/employee/api/Documents/', label: 'type_name' } },
      { key: 'emp_doc_number', label: 'Document number', required: true, max: 100 },
      { key: 'emp_doc_issued_date', label: 'Issue date', type: 'date', required: true },
      { key: 'emp_doc_expiry_date', label: 'Expiry date', type: 'date', required: true }] },
    { title: 'Copy', fields: [
      { key: 'emp_doc_document', label: 'New copy (PDF or picture)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx', full: true,
        hint: 'Leave empty to keep the current file.' }] }],
  fromRecord: r => ({ ...r, emp_id: r.emp_id_id ?? r.emp_id }),
  validate: (v, t) => v.emp_doc_issued_date && v.emp_doc_expiry_date && v.emp_doc_expiry_date <= v.emp_doc_issued_date
    ? { emp_doc_expiry_date: t('The expiry date must be after the issue date.') } : null,
  okText: (_d, t) => t('Document saved.'),
};

/** v1.62.10 (item 168): a folder of the document library (parent set → a subfolder) */
export function folderForm(parent?: { id: number; name: string } | null): ZFormConfig {
  return {
    thing: parent ? 'subfolder' : 'folder', endpoint: '/organisation/api/folders/',
    subtitle: parent ? i18nT('A subfolder of {0}. Files are kept in subfolders.', [parent.name]) : 'Folders keep company documents in one place – policies, licences, contracts. Add subfolders to keep the files in.',
    initial: parent ? { parent: parent.id } : {},
    sections: [{ title: '', fields: [{ key: 'name', label: 'Folder name', required: true, max: 100, full: true }] }],
    toBody: v => (parent ? { name: String(v.name || '').trim(), parent: parent.id } : { name: String(v.name || '').trim() }),
  };
}

/** v1.62.10 (item 168): rename a folder or subfolder */
export const FOLDER_EDIT_FORM: ZFormConfig = {
  thing: 'folder', endpoint: '/organisation/api/folders/',
  sections: [{ title: '', fields: [{ key: 'name', label: 'Folder name', required: true, max: 100, full: true }] }],
  toBody: v => ({ name: String(v.name || '').trim() }),
};

/** v1.62.10 (item 168): a file of a document-library folder (the old "Uplaod file" pop-up) */
export function folderFileForm(folderId: number): ZFormConfig {
  return {
    thing: 'file', endpoint: '/organisation/api/documents/', heading: 'Upload a file', action: 'Upload',
    subtitle: 'The file is kept in this folder; everyone who may see the document library can open it.',
    sections: [{ title: '', fields: [
      { key: 'name', label: 'Name', required: true, max: 200, full: true },
      { key: 'file', label: 'File', type: 'file', required: true, full: true }] }],
    toBody: v => ({ name: String(v.name || '').trim(), folder: folderId, file: v.file }),
    okText: (_d, t) => t('File uploaded.'),
  };
}

const BRANCHES = { endpoint: '/organisation/api/Branch/', label: 'branch_name' };
const DEPTS = { endpoint: '/organisation/api/Department/', label: 'dept_name' };
const DESIGS = { endpoint: '/organisation/api/Designation/', label: 'desgntn_job_title' };
const CATS = { endpoint: '/organisation/api/Catogory/', label: 'ctgry_title' };
const localDt = (x: any): string => {   // "2026-11-02T10:00:00+04:00" → "2026-11-02T10:00" in the browser's time
  if (!x) { return ''; }
  const d = new Date(x); if (isNaN(d.getTime())) { return String(x).slice(0, 16); }
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};
const isoDt = (x: any): any => {   // the form's local "YYYY-MM-DDTHH:MM" → an ISO time with the browser's offset (the server stores it in UTC)
  if (!x) { return null; }
  const d = new Date(String(x)); return isNaN(d.getTime()) ? x : d.toISOString();
};

/** v1.62.10 (item 172): edit a company policy / start a new version (a new file) – the old CompanyPolicyComponent edit pop-up */
export const POLICY_FORM: ZFormConfig = {
  thing: 'company policy', endpoint: '/organisation/api/policies/',
  subtitle: 'Attach a new file to start a new version: everyone it applies to confirms it again under My policies. Only the text changed → same version.',
  sections: [
    { title: 'Policy', fields: [
      { key: 'title', label: 'Title', required: true, max: 200, full: true },
      { key: 'description', label: 'Summary', type: 'textarea' }] },
    { title: 'Applies to', fields: [
      { key: 'branch', label: 'Branches', type: 'multi', source: BRANCHES, hint: 'None ticked = every branch.' },
      { key: 'department', label: 'Department', type: 'select', source: DEPTS },
      { key: 'designation', label: 'Designation', type: 'select', source: DESIGS },
      { key: 'category', label: 'Category', type: 'select', source: CATS }] },
    { title: 'Policy document', fields: [
      { key: 'policy_file', label: 'Policy document (PDF)', type: 'file', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png', full: true, required: false,
        hint: 'Leave empty to keep the current file and version.' }] }],
  okText: (_d, t) => t('Company policy saved.'),
};

/** v1.62.10 (item 172): edit an announcement – the old AnnouncementMasterComponent edit pop-up */
export const ANNOUNCEMENT_FORM: ZFormConfig = {
  thing: 'announcement', endpoint: '/organisation/api/announcements/',
  subtitle: 'News for the employees on the company wall and in self service. Nothing ticked under "For" = everyone.',
  sections: [
    { title: 'Announcement', fields: [
      { key: 'title', label: 'Title', required: true, max: 255, full: true },
      { key: 'message', label: 'Message', type: 'textarea', required: true }] },
    { title: 'For', fields: [
      { key: 'branches', label: 'Branches', type: 'multi', source: BRANCHES },
      { key: 'department', label: 'Departments', type: 'multi', source: DEPTS },
      { key: 'designation', label: 'Designations', type: 'multi', source: DESIGS },
      { key: 'category', label: 'Categories', type: 'multi', source: CATS }] },
    { title: 'When', fields: [
      { key: 'schedule_at', label: 'Show from', type: 'datetime', hint: 'Empty = now.' },
      { key: 'expires_at', label: 'Show until', type: 'datetime', hint: 'Empty = until it is deleted.' },
      { key: 'is_sticky', label: 'Pin to the top', type: 'check' },
      { key: 'allow_comments', label: 'Allow comments', type: 'check' },
      { key: 'send_email', label: 'Also send by e-mail', type: 'check' }] },
    { title: 'Attachment', fields: [
      { key: 'attachment', label: 'Attachment', type: 'file', full: true, hint: 'Leave empty to keep the current attachment.' }] }],
  fromRecord: r => ({ ...r, schedule_at: localDt(r.schedule_at), expires_at: localDt(r.expires_at) }),
  toBody: v => {
    const b: any = {};
    for (const k of ['title', 'message', 'branches', 'department', 'designation', 'category', 'is_sticky', 'allow_comments', 'send_email']) { if (v[k] !== undefined) { b[k] = v[k]; } }
    b.schedule_at = isoDt(v.schedule_at); b.expires_at = isoDt(v.expires_at);
    if (v.attachment instanceof File) { b.attachment = v.attachment; }
    return b;
  },
  validate: (v, t) => v.schedule_at && v.expires_at && v.expires_at <= v.schedule_at ? { expires_at: t('"Show until" must be after "Show from".') } : null,
  okText: (_d, t) => t('Announcement saved.'),
};
