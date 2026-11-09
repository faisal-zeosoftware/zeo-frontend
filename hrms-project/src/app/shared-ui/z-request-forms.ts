/**
 * v1.62.10 (item 166) – the forms of the HR request screens on the shared form shell (z-form.component.ts):
 * Loan requests, Advance salary requests, Air ticket requests, Air ticket allocation and Asset requests – create, edit,
 * pause and resume. They post the same fields to the same endpoints as the old in-template pop-ups; every check stays
 * the server's (workflow configured, allocation the employee's own and open, asset available, document numbering, …).
 */
import { ZFormConfig, ZFormField, ZFormOption } from './z-form.component';
import { i18nT } from './i18n-core';

/** the branches picked in the side bar (none = all) */
function sidebarBranches(): number[] {
  try { return (JSON.parse(localStorage.getItem('selectedBranchIds') || '[]') || []).map((x: any) => Number(x)); } catch { return []; }
}
const BRANCH: ZFormField = {
  key: 'branch', label: 'Branch', type: 'select', matchKey: 'branch_name', required: true,
  source: { endpoint: '/organisation/api/Branch/', label: 'branch_name', filter: (r: any) => { const s = sidebarBranches(); return !s.length || s.includes(Number(r.id)); } },
  hint: 'The branch of the request; the employee list shows its employees.',
};
const empLabel = (r: any) => `${r.emp_code || ''} – ${r.emp_name || [r.emp_first_name, r.emp_last_name].filter(Boolean).join(' ')}`;
/** the employees of the chosen branch (or of every branch), with a search box */
const EMPLOYEE: ZFormField = {
  key: 'employee', label: 'Employee', type: 'select', search: true, matchKey: 'emp_code',
  source: { endpoint: '/employee/api/emplist/', label: empLabel, filter: (r: any) => r.is_active !== false },
  optFilter: (raw, v) => !v.branch || Number(raw?.branch_id) === Number(v.branch),
};
const DOC_NO: ZFormField = {
  key: 'document_number', label: 'Document number', max: 50,
  hint: 'Empty: the next number of the branch\'s document numbering.',
};
function today(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
/** the first branch picked in the side bar, as the old forms did */
function single(): any { const s = sidebarBranches(); return s.length ? { branch: s[0] } : {}; }
const empOf = (v: any, o: Record<string, ZFormOption[]>) => (o['employee'] || []).find(e => String(e.value) === String(v.employee))?.raw;

export function loanRequestForm(): ZFormConfig {
  return {
    thing: 'loan request', endpoint: '/payroll/api/loan-application/',
    subtitle: 'A loan for an employee. It goes through the loan approval levels; once approved, payroll deducts the monthly instalment. The loan type decides the highest amount and months, who may ask and the guarantor.',
    initial: single(),
    sections: [
      { title: 'Employee', fields: [BRANCH, EMPLOYEE, DOC_NO] },
      { title: 'Loan', fields: [
        { key: 'loan_type', label: 'Loan type', type: 'select', matchKey: 'loan_type', source: { endpoint: '/payroll/api/loan-type/', label: 'loan_type' } },
        { key: 'amount_requested', label: 'Amount requested (AED)', type: 'number' },
        { key: 'repayment_period', label: 'Repayment period (months)', type: 'number' },
        { key: 'emi_amount', label: 'Monthly instalment (AED)', type: 'number', hint: 'Empty: the amount divided by the months.' },
        { key: 'remaining_balance', label: 'Remaining balance (AED)', type: 'number', editOnly: true }] },
      // v1.67.11 (loans, item 112): the guarantor and the employee's written consent to the monthly deduction
      { title: 'Guarantor and consent', fields: [
        { key: 'guarantor', label: 'Guarantor', type: 'select', search: true, source: { endpoint: '/employee/api/emplist/', label: empLabel, filter: (r: any) => r.is_active !== false },
          hint: 'Another employee who guarantees the loan (when the loan type asks for one).' },
        { key: 'consent', label: 'The employee agreed in writing to the monthly deduction', type: 'check', full: true }] }],
    fromRecord: (r: any) => ({ ...r, guarantor: r?.terms?.guarantor?.id ?? null, consent: !!r?.terms?.consent }),
  };
}

export function advanceRequestForm(): ZFormConfig {
  return {
    thing: 'advance salary request', endpoint: '/payroll/api/advance-salary-request/',
    subtitle: 'Part of the salary paid in advance. It goes through the advance approval levels; payroll deducts it from the salary.',
    initial: { ...single(), instalments: 1 },
    fromRecord: (r: any) => ({ ...r, instalments: r?.terms?.instalments ?? 1 }),   // v1.67.11 (loans)
    sections: [
      { title: 'Employee', fields: [BRANCH, EMPLOYEE, DOC_NO] },
      { title: 'Advance', fields: [
        { key: 'requested_amount', label: 'Amount requested (AED)', type: 'number',
          hint: 'Payroll › Loan and advance settings decide the limits: % of the wage, one a month, not for leavers.' },
        { key: 'instalments', label: 'Monthly instalments', type: 'number', hint: '1 = deducted at once; more = the amount divided over the months.' },   // v1.67.11 (loans, item 115)
        { key: 'reason', label: 'Reason', type: 'textarea', full: true },
        { key: 'remarks', label: 'Remarks', type: 'textarea', full: true }] }],
  };
}

const REQUEST_TYPES: ZFormOption[] = [{ value: 'TICKET', label: 'Ticket' }, { value: 'ENCASHMENT', label: 'Cash instead of ticket' }];

export function airTicketRequestForm(): ZFormConfig {
  return {
    thing: 'air ticket request', endpoint: '/payroll/api/airticket-request/',
    subtitle: 'A ticket (or its cash value) against one of the employee\'s open allocations. It goes through the air ticket approval levels.',
    initial: { ...single(), request_type: 'TICKET', request_date: today() },
    sections: [
      { title: 'Employee', fields: [BRANCH, EMPLOYEE, DOC_NO] },
      { title: 'Ticket', fields: [
        { key: 'allocation', label: 'Allocation', type: 'select', full: true,
          source: { endpoint: '/payroll/api/airticket-allocation/', label: (r: any) => `${r.policy || ''} · AED ${Number(r.remaining_amount ?? r.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          optFilter: (raw, v, o) => { const e = empOf(v, o); return !!e && raw?.employee === e.emp_code; },
          hint: 'The open allocations of the employee chosen above.' },
        { key: 'request_type', label: 'Ticket or cash', type: 'select', options: REQUEST_TYPES },
        { key: 'request_date', label: 'Request date', type: 'date' },
        { key: 'departure_date', label: 'Departure date', type: 'date' }, { key: 'return_date', label: 'Return date', type: 'date' },
        { key: 'origin', label: 'From', max: 100 }, { key: 'destination', label: 'To', max: 100 },
        { key: 'notes', label: 'Notes', type: 'textarea', full: true }] }],
  };
}

export function airTicketAllocationForm(): ZFormConfig {
  return {
    thing: 'air ticket allocation', endpoint: '/payroll/api/airticket-allocation/',
    subtitle: 'What an employee is entitled to under an air ticket policy. Requests are made against it until the amount is used or it expires.',
    initial: { is_active: true },
    sections: [
      { title: 'Allocation', fields: [
        EMPLOYEE,
        { key: 'policy', label: 'Air ticket policy', type: 'select', matchKey: 'name', source: { endpoint: '/payroll/api/airticket-policy/', label: 'name' } },
        { key: 'amount', label: 'Amount (AED)', type: 'number' },
        { key: 'remaining_amount', label: 'Amount left (AED)', type: 'number', hint: 'Empty: the full amount.' },
        { key: 'expiry_date', label: 'Expiry date', type: 'date' },
        { key: 'is_active', label: 'Active', type: 'check' }] }],
  };
}

export function assetRequestForm(): ZFormConfig {
  return {
    thing: 'asset request', endpoint: '/organisation/api/asset-Request/',
    subtitle: 'An asset an employee needs. It goes through the asset approval levels; the asset is issued after approval.',
    initial: single(),
    sections: [
      { title: 'Employee', fields: [BRANCH, EMPLOYEE, DOC_NO] },
      { title: 'Asset', fields: [
        { key: 'asset_type', label: 'Asset type', type: 'select', matchKey: 'name', source: { endpoint: '/organisation/api/asset-type/', label: 'name' } },
        { key: 'requested_asset', label: 'Asset', type: 'select', matchKey: 'name',
          source: { endpoint: '/organisation/api/assets/', label: (r: any) => r.serial_number ? `${r.name} (${r.serial_number})` : r.name },
          optFilter: (raw, v, o) => { const t = (o['asset_type'] || []).find(x => String(x.value) === String(v.asset_type)); return !!t && raw?.asset_type === t.label && (raw?.status === 'available' || String(raw?.id) === String(v.requested_asset)); },
          hint: 'The available assets of the type chosen.' },
        { key: 'reason', label: 'Reason', type: 'textarea', full: true }] }],
  };
}

/** Pause / resume of a running loan or advance – the same calls as the old pop-ups (…/pause/, …/resume/) */
export function pauseForm(kind: 'loan' | 'advance', id: number, number: string): ZFormConfig {
  const base = kind === 'loan' ? '/payroll/api/loan-application/' : '/payroll/api/advance-salary-request/';
  return {
    thing: kind === 'loan' ? 'loan request' : 'advance salary request', endpoint: `${base}${id}/pause/`,
    heading: i18nT(kind === 'loan' ? 'Pause loan {0}' : 'Pause advance {0}', [number]), action: 'Pause',
    subtitle: kind === 'loan' ? 'Payroll does not deduct the instalment from this date until the loan is resumed.' : 'Payroll does not deduct the advance from this date until it is resumed.',
    initial: { pause_start_date: today() },
    sections: [{ title: '', fields: [
      { key: 'pause_start_date', label: 'Pause from', type: 'date', required: true },
      { key: 'pause_reason', label: 'Reason', type: 'textarea', required: true, full: true }] }],
    toBody: v => ({ pause_start_date: v.pause_start_date, pause_reason: v.pause_reason, resume_date: null }),
    okText: (_d, t) => t(kind === 'loan' ? 'Loan {0} paused.' : 'Advance {0} paused.', [number]),
  };
}
export function resumeForm(kind: 'loan' | 'advance', id: number, number: string): ZFormConfig {
  const base = kind === 'loan' ? '/payroll/api/loan-application/' : '/payroll/api/advance-salary-request/';
  return {
    thing: kind === 'loan' ? 'loan request' : 'advance salary request', endpoint: `${base}${id}/resume/`,
    heading: i18nT(kind === 'loan' ? 'Resume loan {0}' : 'Resume advance {0}', [number]), action: 'Resume',
    subtitle: 'Payroll deducts again from this date.',
    initial: { resume_date: today() },
    sections: [{ title: '', fields: [{ key: 'resume_date', label: 'Resume from', type: 'date', required: true }] }],
    toBody: v => ({ resume_date: v.resume_date, pause_start_date: null, pause_reason: null }),
    okText: (_d, t) => t(kind === 'loan' ? 'Loan {0} resumed.' : 'Advance {0} resumed.', [number]),
  };
}
