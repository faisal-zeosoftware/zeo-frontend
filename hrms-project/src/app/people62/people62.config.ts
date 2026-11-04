/**
 * v1.62.0 people – the People & Time registers in the new list style (CrudPageComponent): resignations, leave requests,
 * overtime and late in / early out. Each shows the stage ("Level 1 of 2 – waiting for …"), a "Waiting for me" view,
 * people by name and Approve / Reject in the row. Backends: HRActions registers62, LeavePolicy register62, AttendancePlus register62.
 */
import { LOOKUPS } from '../hr-modules/module-api.service';
import { PageConfig } from '../hr-modules/page-config';
import { i18nT } from '../shared-ui/i18n.service';
import { openZForm } from '../shared-ui/z-form.component';   // v1.62.10 (item 172)
import { ANNOUNCEMENT_FORM, POLICY_FORM } from '../shared-ui/z-forms-records';

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const HISTORY = [{ key: 'level', label: 'Level' }, { key: 'approver', label: 'Approver' }, { key: 'status', label: 'Decision' },
  { key: 'note', label: 'Note' }, { key: 'date', label: 'Date', type: 'date' as const }];

// ------------------------------------------------------------------ resignations
const RES_API = '/hr-actions/api/resignations/';
export const RESIGNATION_PAGE: PageConfig = {
  title: 'Resignations', itemName: 'Resignation', endpoint: RES_API, model: 'employeeresignation',
  intro: 'Every resignation and exit from the request to the final settlement: the approvers sign it off level by level, then HR '
    + 'calculates the end of service and the final settlement in Leavers. "Waiting for me" lists what you have to approve.',
  stats: { endpoint: RES_API + 'stats/', tiles: [
    { key: 'waiting', label: 'Waiting for me', color: '#c2410c' }, { key: 'pending', label: 'Waiting for approval' },
    { key: 'in_notice', label: 'In notice period' }, { key: 'leaving_month', label: 'Leaving this month' },
    { key: 'settlement_open', label: 'Settlement not paid yet' }] },
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'type_label', label: 'Type' },
    { key: 'submitted', label: 'Submitted', type: 'date' }, { key: 'last_working_date', label: 'Last working day', type: 'date' },
    { key: 'notice_label', label: 'Notice' }, { key: 'waiting_for', label: 'Waiting for' },
    { key: 'stage_short', label: 'Stage', type: 'tag', colorKey: 'stage',
      tagColors: { approval: 'orange', rejected: 'red', to_calculate: 'blue', draft: 'blue', submitted: 'blue', validated: 'blue', approved: 'cyan', paid: 'green', cancelled: 'grey' } },
  ],
  filters: [
    { key: 'view', label: 'Show', options: opt([['waiting', 'Waiting for me'], ['open', 'Not finished']]) },
    { key: 'type', label: 'Type', options: opt([['resignation', 'Resignation'], ['termination', 'Termination'], ['retirement', 'Retirement'], ['death_or_disablement', 'Death or disability']]) },
    { key: 'status', label: 'Status', options: opt([['Pending', 'Waiting for approval'], ['Approved', 'Approved'], ['Rejected', 'Rejected']]) },
  ],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true, width: 6 },
    { key: 'termination_type', label: 'Type', type: 'select', default: 'resignation', width: 6,
      options: opt([['resignation', 'Resignation'], ['termination', 'Termination'], ['retirement', 'Retirement'], ['death_or_disablement', 'Death or disability']]) },
    { key: 'resigned_on', label: 'Resignation handed in on', type: 'date', required: true, width: 4 },
    { key: 'notice_period', label: 'Notice period (days)', type: 'number', default: 30, width: 4 },
    { key: 'last_working_date', label: 'Last working day', type: 'date', width: 4, help: 'Empty = handed in on + notice period.' },
    { key: 'reason_for_leaving', label: 'Reason', type: 'textarea', width: 12 },
  ],
  canEdit: false, canDelete: false,
  detailFields: [
    { key: 'number', label: 'Number' }, { key: 'employee_display', label: 'Employee' }, { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' }, { key: 'branch', label: 'Branch' },
    { key: 'type_label', label: 'Type' }, { key: 'resigned_on', label: 'Handed in', type: 'date' },
    { key: 'last_working_date', label: 'Last working day', type: 'date' }, { key: 'notice_label', label: 'Notice given / required' },
    { key: 'stage_label', label: 'Stage' }, { key: 'reason', label: 'Reason' },
  ],
  children: [{ title: 'Approval history', endpoint: RES_API, rowsFrom: 'history', parentKey: 'id', columns: HISTORY }],
  rowActions: [
    { label: 'Approve', icon: 'check', action: 'approve', color: 'green', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Note (optional)', type: 'textarea' }] },
    { label: 'Reject', icon: 'close', action: 'reject', color: 'red', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Why is it rejected?', type: 'textarea', required: true }] },
    { label: 'Open in Leavers', icon: 'open_in_new', color: 'blue', showIf: r => !!r.leaver_url, route: r => r.leaver_url },
  ],
  emptyText: 'No resignation yet – record one when an employee hands in a letter.',
};
export const RESIGNATION_APPROVALS_PAGE: PageConfig = {
  ...RESIGNATION_PAGE, title: 'Resignation approvals', defaultParams: { view: 'waiting' }, fields: [], canCreate: false,
  intro: 'Resignations waiting for your decision (the same register as Resignations, filtered "Waiting for me"). Approve or reject in the row; '
    + 'approved exits continue in Leavers.',
  emptyText: 'Nothing is waiting for you. Change "Show" to see every resignation.',
};

// ------------------------------------------------------------------ leave requests
const LV_API = '/leave-policy/api/requests/';
// v1.62.4 (item 81): leave types counted in hours (Short Leave (hours)), noted while the leave type list loads
const HOURLY_TYPES = new Set<number>();
const lvTypeLabel = (r: any) => { if (r.unit === 'hours') { HOURLY_TYPES.add(Number(r.id)); } return r.name; };
const isHourly = (m: any) => HOURLY_TYPES.has(Number(m?.leave_type));
// v1.65.0 (item 82): leave types whose request asks the date of birth (rule "birth date", or maternity / paternity leave)
const BIRTH_TYPES = new Set<number>();
const lvTypeLabel2 = (r: any) => { if (['maternity', 'paternity'].includes(r.leave_category)) { BIRTH_TYPES.add(Number(r.id)); } return lvTypeLabel(r); };
const isBirthType = (m: any) => BIRTH_TYPES.has(Number(m?.leave_type));
const LEAVE_TAGS = { pending: 'orange', rejected: 'red', approved: 'blue', on_leave: 'cyan', returned: 'green', not_back: 'red', cancelled: 'grey' };   // v1.65.0 (item 83) cancelled
export const LEAVE_REQUEST_PAGE: PageConfig = {
  title: 'Leave requests', itemName: 'Leave request', endpoint: LV_API, model: 'employee_leave_request', multipart: true,
  intro: 'Every leave request with its stage: the approvers decide level by level, the days come off the balance on approval and the return '
    + 'is recorded in Return from leave. "Balance after" is the balance once the request is approved.',
  stats: { endpoint: LV_API + 'stats/', tiles: [
    { key: 'waiting', label: 'Waiting for me', color: '#c2410c' }, { key: 'pending', label: 'Waiting for approval' },
    { key: 'on_leave', label: 'On leave today' }, { key: 'starting', label: 'Starting in 7 days' }, { key: 'not_back', label: 'Return not recorded' }] },
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'leave_type', label: 'Type' },
    { key: 'period', label: 'Dates', value: (r: any) => `${r.period} · ${r.unit === 'hours' ? i18nT('{0} h', [r.days]) : (r.days === 1 ? i18nT('1 day') : i18nT('{0} days', [r.days]))}` },
    { key: 'balance_after', label: 'Balance after', type: 'number' },
    { key: 'stage_short', label: 'Stage', type: 'tag', colorKey: 'stage', tagColors: LEAVE_TAGS },
  ],
  filters: [
    { key: 'view', label: 'Show', options: opt([['waiting', 'Waiting for me'], ['pending', 'Waiting for approval'], ['on_leave', 'On leave today']]) },
    { key: 'status', label: 'Status', options: opt([['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled']]) },   // v1.65.0 (item 83)
    { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees },
  ],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true, width: 6 },
    { key: 'leave_type', label: 'Leave type', type: 'select', lookup: { endpoint: '/calendars/api/leave-type/', label: lvTypeLabel2 }, required: true, width: 6 },   // v1.65.0 (item 82)
    { key: 'start_date', label: 'From', type: 'date', required: true, width: 3 },
    { key: 'end_date', label: 'To', type: 'date', required: true, width: 3 },
    { key: 'dis_half_day', label: 'Half day', type: 'checkbox', default: false, width: 3, showIf: m => !isHourly(m) },
    { key: 'half_day_period', label: 'Which half', type: 'select', width: 3, options: opt([['first_half', 'First half'], ['second_half', 'Second half']]), showIf: m => !!m.dis_half_day && !isHourly(m) },
    // v1.62.4 (item 81): short leave in hours – one working day (From = To), the hours and when in the day
    { key: 'leave_duration', label: 'Hours', type: 'number', width: 3, showIf: m => isHourly(m) },
    { key: 'half_day_period', label: 'When', type: 'select', width: 3, showIf: m => isHourly(m),
      options: opt([['first_half', 'Start of the day (arriving late)'], ['second_half', 'End of the day (leaving early)']]) },
    // v1.65.0 (item 82): the date of birth of the child – maternity / parental leave (asked when the leave type's rule says so)
    { key: 'birth_date', label: 'Date of birth of the child', type: 'date', width: 4, showIf: m => isBirthType(m) },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true, width: 12 },
    { key: 'lv_document', label: 'Supporting document (sick / maternity leave)', type: 'file', width: 12 },
  ],
  canEdit: false, canDelete: false,
  detailFields: [
    { key: 'number', label: 'Number' }, { key: 'employee_display', label: 'Employee' }, { key: 'department', label: 'Department' }, { key: 'leave_type', label: 'Leave type' },
    { key: 'period', label: 'Dates' }, { key: 'days', label: 'Days' }, { key: 'applied_on', label: 'Applied on', type: 'date' },
    { key: 'balance_now', label: 'Balance now' }, { key: 'balance_after', label: 'Balance after approval' },
    { key: 'stage_label', label: 'Stage' }, { key: 'reason', label: 'Reason' },
    // v1.65.0 (items 82–85)
    { key: 'birth_date', label: 'Date of birth of the child', type: 'date' }, { key: 'cancelled_days', label: 'Days given back' },
    { key: 'original_end_date', label: 'First last day', type: 'date' }, { key: 'extension_of', label: 'Extension of' },
    { key: 'extended_by', label: 'Extended by' }, { key: 'advance', label: 'Leave salary in advance' },
  ],
  children: [{ title: 'Approval history', endpoint: LV_API, rowsFrom: 'history', parentKey: 'id', columns: HISTORY }],
  rowActions: [
    { label: 'Approve', icon: 'check', action: 'approve', color: 'green', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Note (optional)', type: 'textarea' }] },
    { label: 'Reject', icon: 'close', action: 'reject', color: 'red', showIf: r => r.can_act, prompt: [{ key: 'reason', label: 'Why is it rejected?', type: 'textarea', required: true }] },
    { label: 'Cancel leave', icon: 'event_busy', action: 'cancel', color: 'grey', showIf: r => r.can_cancel,
      prompt: [{ key: 'reason', label: 'Why is the approved leave cancelled? The days go back to the balance.', type: 'textarea', required: true }] },
    // v1.65.0 (item 83): give back the days from a date (the employee returned early)
    { label: 'Give back days', icon: 'event_repeat', action: 'cancel_part', color: 'grey', showIf: r => r.can_cancel_part,
      prompt: [{ key: 'from_date', label: 'First day given back (the leave ends the day before)', type: 'date', required: true },
        { key: 'reason', label: 'Why are the days given back?', type: 'textarea', required: true }] },
    // v1.65.0 (item 84): a linked extension request through the same approval
    { label: 'Extend', icon: 'more_time', action: 'extend', color: 'blue', showIf: r => r.can_extend,
      prompt: [{ key: 'end_date', label: 'New last day', type: 'date', required: true }, { key: 'reason', label: 'Why is the leave extended?', type: 'textarea' }] },
  ],
  emptyText: 'No leave request matches. Employees apply in self service; HR can record one with Create.',
};
export const LEAVE_APPROVALS62_PAGE: PageConfig = {
  ...LEAVE_REQUEST_PAGE, title: 'Leave approvals', defaultParams: { view: 'waiting' }, fields: [], canCreate: false,
  intro: 'Leave waiting for your decision (the same register as Leave requests, filtered "Waiting for me"). Approve or reject in the row.',
  emptyText: 'Nothing is waiting for you. Change "Show" to see every request.',
};
export const LEAVE_CANCEL_PAGE: PageConfig = {
  ...LEAVE_REQUEST_PAGE, title: 'Leave cancellation', defaultParams: { status: 'approved' }, fields: [], canCreate: false,
  intro: 'Approved leave that can still be cancelled. "Cancel leave" in the row gives the days back to the balance and records the reason.',
  emptyText: 'No approved leave to cancel.',
};

// ------------------------------------------------------------------ overtime
const OT_API = '/attendance-plus/api/overtime/';
const months = () => {
  const out: [string, string][] = []; const d = new Date(); d.setDate(1);
  for (let i = 0; i < 12; i++) {
    out.push([d.toISOString().slice(0, 7), d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })]);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
};
export const OVERTIME_PAGE: PageConfig = {
  title: 'Overtime', itemName: 'Overtime', endpoint: OT_API, model: 'employeeovertime',
  intro: 'Overtime from attendance, one row per employee and day: hours (h:mm), the rate of the day type, and the decision. The reporting manager '
    + 'or HR approves; only approved overtime is paid in payroll. UAE Labour Law (Art. 19): at most 2 hours of overtime a day.',
  stats: { endpoint: OT_API + 'stats/', tiles: [
    { key: 'hours', label: 'Approved hours (last 31 days)' }, { key: 'waiting', label: 'Waiting for me', color: '#c2410c' },
    { key: 'unpaid', label: 'Approved, not paid yet' }, { key: 'over_limit', label: 'Days over 2 h', color: '#b91c1c' }] },
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' },
    { key: 'hours_label', label: 'Hours' }, { key: 'type_rate', label: 'Day type and rate' }, { key: 'weighted_hm', label: 'Paid as (hours)' },
    { key: 'status_label', label: 'Status', type: 'tag', colorKey: 'status', tagColors: { pending: 'orange', approved: 'blue', paid: 'green', rejected: 'red' } },
  ],
  filters: [
    { key: 'month', label: 'Month', options: opt(months()) },
    { key: 'view', label: 'Show', options: opt([['waiting', 'Waiting for me'], ['pending', 'Waiting for approval'], ['approved', 'Approved'], ['rejected', 'Rejected']]) },
    { key: 'type', label: 'Day type', options: opt([['NORMAL', 'Normal day'], ['WEEKEND', 'Rest day'], ['HOLIDAY', 'Public holiday']]) },
    { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees },
  ],
  canCreate: false, canEdit: false, canDelete: false,
  detailFields: [{ key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'hours_hm', label: 'Hours' },
    { key: 'type_rate', label: 'Day type and rate' }, { key: 'weighted_hm', label: 'Paid as (hours)' }, { key: 'source_label', label: 'From' },
    { key: 'status_label', label: 'Status' },
    { key: 'approved_by', label: 'Approved by' }, { key: 'decided_by', label: 'Rejected by' }, { key: 'note', label: 'Reason' }],
  rowActions: [
    { label: 'Approve', icon: 'check', action: 'approve', color: 'green', showIf: r => r.can_act },
    { label: 'Reject', icon: 'close', action: 'reject', color: 'red', showIf: r => r.can_reject, prompt: [{ key: 'note', label: 'Why is the overtime rejected?', type: 'textarea', required: true }] },
  ],
  emptyText: 'No overtime in this period.',
};

// ------------------------------------------------------------------ late in / early out
const LE_API = '/attendance-plus/api/late-early/';
export const LATE_EARLY_PAGE: PageConfig = {
  title: 'Late in / early out requests', itemName: 'Request', endpoint: LE_API, model: 'lateinearlyoutrequest',
  intro: 'Employees explain a late arrival or an early departure; the approvers decide level by level. An approved request waives the late / early mark of the day.',
  stats: { endpoint: LE_API + 'stats/', tiles: [
    { key: 'waiting', label: 'Waiting for me', color: '#c2410c' }, { key: 'pending', label: 'Waiting for approval' },
    { key: 'late_month', label: 'Late in this month' }, { key: 'early_month', label: 'Early out this month' }] },
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' },
    { key: 'type_label', label: 'Type' }, { key: 'minutes_label', label: 'Late / early by' }, { key: 'waiting_for', label: 'Waiting for' },
    { key: 'stage_short', label: 'Stage', type: 'tag', colorKey: 'status', tagColors: { pending: 'orange', approved: 'green', rejected: 'red' } },
  ],
  filters: [
    { key: 'view', label: 'Show', options: opt([['waiting', 'Waiting for me'], ['pending', 'Waiting for approval']]) },
    { key: 'status', label: 'Status', options: opt([['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']]) },
  ],
  canCreate: false, canEdit: false, canDelete: false,
  detailFields: [{ key: 'number', label: 'Number' }, { key: 'employee_display', label: 'Employee' }, { key: 'date', label: 'Date', type: 'date' },
    { key: 'type_label', label: 'Type' }, { key: 'minutes_label', label: 'Late / early by' }, { key: 'branch', label: 'Branch' },
    { key: 'stage_label', label: 'Stage' }, { key: 'reason', label: 'Reason' }],
  children: [{ title: 'Approval history', endpoint: LE_API, rowsFrom: 'history', parentKey: 'id', columns: HISTORY }],
  rowActions: [
    { label: 'Approve', icon: 'check', action: 'approve', color: 'green', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Note (optional)', type: 'textarea' }] },
    { label: 'Reject', icon: 'close', action: 'reject', color: 'red', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Why is it rejected?', type: 'textarea', required: true }] },
  ],
  emptyText: 'No late in / early out request.',
};
export const LATE_EARLY_APPROVALS_PAGE: PageConfig = {
  ...LATE_EARLY_PAGE, title: 'Late in / early out approvals', defaultParams: { view: 'waiting' },
  intro: 'Late in / early out requests waiting for your decision. Approve or reject in the row.',
  emptyText: 'Nothing is waiting for you. Change "Show" to see every request.',
};

// ------------------------------------------------------------------ general and document requests (one row per request)
const REQ_TAGS = { pending: 'orange', approved: 'green', rejected: 'red' };
const requestPage = (kind: 'general' | 'document'): PageConfig => {
  const api = `/hr-actions/api/requests/${kind}/`;
  const general = kind === 'general';
  return {
    title: general ? 'General requests' : 'Document requests', itemName: general ? 'Request' : 'Document request', endpoint: api,
    model: general ? 'generalrequest' : 'documentrequest', multipart: general,
    intro: general
      ? 'Requests of the employees (allowance advances, reimbursements, sponsorships …): the approvers sign them off level by level; approved money requests are paid with the payroll.'
      : 'Letters and certificates the employees ask for (salary certificate, NOC, employment letter …): the approvers sign them off, then HR issues the letter in HR letters.',
    stats: { endpoint: api + 'stats/', tiles: [
      { key: 'waiting', label: 'Waiting for me', color: '#c2410c' }, { key: 'pending', label: 'Waiting for approval' },
      { key: 'approved_30', label: 'Approved (last 30 days)' }, { key: 'rejected_30', label: 'Rejected (last 30 days)' }] },
    columns: [
      { key: 'employee_display', label: 'Employee' }, { key: 'type', label: 'Type' },
      ...(general ? [{ key: 'amount', label: 'Amount (AED)', type: 'money' as const }] : []),
      { key: 'submitted', label: 'Submitted', type: 'date' }, { key: 'waiting_for', label: 'Waiting for' },
      { key: 'stage_short', label: 'Stage', type: 'tag', colorKey: 'status', tagColors: REQ_TAGS },
    ],
    filters: [
      { key: 'view', label: 'Show', options: opt([['waiting', 'Waiting for me'], ['open', 'Waiting for approval']]) },
      { key: 'status', label: 'Status', options: opt([['Pending', 'Pending'], ['Approved', 'Approved'], ['Rejected', 'Rejected']]) },
    ],
    fields: [
      { key: 'employee', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true, width: 6 },
      { key: 'request_type', label: 'Request type', type: 'select', required: true, width: 6,
        lookup: general ? { endpoint: '/employee/api/request-type/', label: 'name' } : { endpoint: '/employee/api/Doc-request-Type/', label: 'type_name' } },
      ...(general ? [{ key: 'total', label: 'Amount (AED, if any)', type: 'number' as const, width: 6 }] : []),
      { key: 'reason', label: 'Reason', type: 'textarea', required: true, width: 12 },
      { key: 'remarks', label: 'Remarks', type: 'text', width: 12 },
      ...(general ? [{ key: 'request_document', label: 'Supporting document', type: 'file' as const, width: 12 }] : []),
    ],
    canEdit: false, canDelete: false,
    detailFields: [{ key: 'number', label: 'Number' }, { key: 'employee_display', label: 'Employee' }, { key: 'branch', label: 'Branch' },
      { key: 'type', label: 'Type' }, ...(general ? [{ key: 'amount', label: 'Amount (AED)', type: 'money' as const }] : []),
      { key: 'submitted', label: 'Submitted', type: 'date' }, { key: 'stage_label', label: 'Stage' }, { key: 'reason', label: 'Reason' },
      { key: 'remarks', label: 'Remarks' }, ...(general ? [{ key: 'paid_in_payroll', label: 'Paid in payroll', type: 'bool' as const }] : [])],
    children: [{ title: 'Approval history', endpoint: api, rowsFrom: 'history', parentKey: 'id', columns: HISTORY }],
    rowActions: [
      { label: 'Approve', icon: 'check', action: 'approve', color: 'green', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Note (optional)', type: 'textarea' }] },
      { label: 'Reject', icon: 'close', action: 'reject', color: 'red', showIf: r => r.can_act, prompt: [{ key: 'note', label: 'Why is it rejected?', type: 'textarea', required: true }] },
      ...(general ? [] : [{ label: 'HR letters', icon: 'description', color: 'blue' as const, showIf: (r: any) => r.status === 'approved', route: () => '/main-sidebar/self-service/hr-letters' }]),
    ],
    emptyText: general ? 'No general request yet.' : 'No document request yet.',
  };
};
export const GENERAL_REQUEST_PAGE = requestPage('general');
export const DOCUMENT_REQUEST_PAGE = requestPage('document');
export const GENERAL_APPROVALS62_PAGE: PageConfig = { ...GENERAL_REQUEST_PAGE, title: 'General approvals', defaultParams: { view: 'waiting' }, fields: [], canCreate: false,
  intro: 'General requests waiting for your decision – one row per request at its current level. Approve or reject in the row.',
  emptyText: 'Nothing is waiting for you. Change "Show" to see every request.' };
export const DOCUMENT_APPROVALS62_PAGE: PageConfig = { ...DOCUMENT_REQUEST_PAGE, title: 'Document approvals', defaultParams: { view: 'waiting' }, fields: [], canCreate: false,
  intro: 'Document requests waiting for your decision – one row per request at its current level. Approve or reject in the row.',
  emptyText: 'Nothing is waiting for you. Change "Show" to see every request.' };

// ------------------------------------------------------------------ shift override (date ranges)
export const SHIFT_OVERRIDE_PAGE: PageConfig = {
  title: 'Shift override', itemName: 'Shift override', endpoint: '/attendance-plus/api/shift-overrides/', model: 'shiftoverride',
  intro: 'Another shift for an employee for some days – the summer midday-break split shift, a project at night … One row per period; '
    + 'the attendance of those days is worked out with this shift. Shift changes asked in Shift planner are written here too.',
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'shift', label: 'Shift' }, { key: 'period', label: 'Period' },
    { key: 'days_label', label: 'Days' },
    { key: 'status_label', label: 'Status', type: 'tag', colorKey: 'status', tagColors: { current: 'green', coming: 'blue', past: 'grey' } },
  ],
  filters: [{ key: 'when', label: 'Show', options: opt([['current', 'Current and coming']]) }, { key: 'employee', label: 'Employee', lookup: LOOKUPS.employees }],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true, width: 6 },
    { key: 'override_shift', label: 'Shift', type: 'select', lookup: { endpoint: '/calendars/api/shifts/', label: 'name' }, required: true, width: 6 },
    { key: 'from', label: 'From', type: 'date', required: true, width: 4 },
    { key: 'to', label: 'To', type: 'date', required: true, width: 4 },
    { key: 'skip_weekends', label: 'Not on Saturday / Sunday', type: 'checkbox', default: true, width: 4 },
  ],
  canEdit: false, canDelete: false,
  rowActions: [{ label: 'Remove', icon: 'delete', action: 'remove', color: 'red', showIf: r => r.status !== 'past',
    confirm: 'Remove this shift override? The normal shift applies again on these days.' }],
  emptyText: 'No shift override. Use Create to give an employee another shift for some days.',
};

// ------------------------------------------------------------------ company policies and announcements (admin)
export const COMPANY_POLICY_PAGE: PageConfig = {
  title: 'Company policy', itemName: 'Policy', endpoint: '/hr-actions/api/company-policies/', model: 'companypolicy', multipart: true,
  intro: 'The policies employees read and confirm under My policies. The list shows how many of the employees each policy applies to have confirmed '
    + 'the current version; a new file starts a new version that everyone confirms again.',
  columns: [
    { key: 'title', label: 'Policy' }, { key: 'audience', label: 'Applies to' }, { key: 'version', label: 'Version', type: 'number' },
    { key: 'updated', label: 'Updated', type: 'date' },
    { key: 'ack_label', label: 'Confirmed', type: 'tag', colorKey: 'ack_level', tagColors: { ok: 'green', warn: 'orange', bad: 'red', none: 'grey' } },
  ],
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, width: 8 },
    { key: 'branch', label: 'Branches (empty = everyone)', type: 'multiselect', lookup: LOOKUPS.branches, width: 4 },
    { key: 'description', label: 'Summary', type: 'textarea', width: 12 },
    { key: 'policy_file', label: 'Policy document (PDF)', type: 'file', required: true, width: 12 },
  ],
  canEdit: false, canDelete: false,
  detailFields: [{ key: 'title', label: 'Policy' }, { key: 'description', label: 'Summary' }, { key: 'audience', label: 'Applies to' },
    { key: 'version', label: 'Version' }, { key: 'ack_label', label: 'Confirmed' }, { key: 'due_days', label: 'Days to confirm' }],
  rowActions: [
    { label: 'Who confirmed', icon: 'task', color: 'blue', route: () => '/main-sidebar/org-structure/policy-acknowledgements' },
    { label: 'Edit / new version', icon: 'edit', color: 'grey', open: r => openZForm(POLICY_FORM, { id: r.id }) },   // v1.62.10 (item 172): the shared form (was the old page)
    { label: 'Remind', icon: 'notifications', action: 'remind', color: 'orange', showIf: r => r.requires_ack && r.pending > 0,
      confirm: 'Send a reminder to everyone who has not confirmed this policy yet?' },
    { label: 'Delete', icon: 'delete', action: 'delete', color: 'red', confirm: 'Delete this policy? Employees no longer see it.' },
  ],
  emptyText: 'No company policy yet. Publish one with Create – employees confirm it under My policies.',
};

export const ANNOUNCEMENT_PAGE: PageConfig = {
  title: 'Announcements', itemName: 'Announcement', endpoint: '/hr-actions/api/announcements/', model: 'announcement', multipart: true,
  intro: 'News for the employees on the company wall and in self service: who it is for, when it shows and until when, and how many have read it.',
  columns: [
    { key: 'title', label: 'Announcement' }, { key: 'audience', label: 'For' },
    { key: 'published', label: 'Published', type: 'date' }, { key: 'expires', label: 'Until', type: 'date' },
    { key: 'read_by', label: 'Read by', type: 'number' },
    { key: 'status_label', label: 'Status', type: 'tag', colorKey: 'status', tagColors: { live: 'green', scheduled: 'blue', expired: 'grey' } },
  ],
  fields: [
    { key: 'title', label: 'Title', type: 'text', required: true, width: 12 },
    { key: 'message', label: 'Message', type: 'textarea', required: true, width: 12 },
    { key: 'branches', label: 'Branches (empty = everyone)', type: 'multiselect', lookup: LOOKUPS.branches, width: 6 },
    { key: 'department', label: 'Departments', type: 'multiselect', lookup: LOOKUPS.departments, width: 6 },
    { key: 'schedule_at', label: 'Show from', type: 'datetime', width: 4 }, { key: 'expires_at', label: 'Show until', type: 'datetime', width: 4 },
    { key: 'is_sticky', label: 'Pin to the top', type: 'checkbox', default: false, width: 4 },
    { key: 'send_email', label: 'Also send by e-mail', type: 'checkbox', default: true, width: 4 },
    { key: 'allow_comments', label: 'Allow comments', type: 'checkbox', default: true, width: 4 },
    { key: 'attachment', label: 'Attachment', type: 'file', width: 12 },
  ],
  canEdit: false, canDelete: false,
  detailFields: [{ key: 'title', label: 'Announcement' }, { key: 'message', label: 'Message' }, { key: 'audience', label: 'For' },
    { key: 'published', label: 'Published', type: 'date' }, { key: 'expires', label: 'Until', type: 'date' }, { key: 'pinned', label: 'Pinned', type: 'bool' },
    { key: 'email', label: 'Sent by e-mail', type: 'bool' }, { key: 'read_by', label: 'Read by' }, { key: 'comments', label: 'Comments' }],
  rowActions: [
    { label: 'Edit', icon: 'edit', color: 'grey', open: r => openZForm(ANNOUNCEMENT_FORM, { id: r.id }) },   // v1.62.10 (item 172): the shared form (was the old page)
    { label: 'Pin', icon: 'push_pin', action: 'pin', color: 'blue', showIf: r => !r.pinned },
    { label: 'Unpin', icon: 'push_pin', action: 'unpin', color: 'grey', showIf: r => r.pinned },
    { label: 'Delete', icon: 'delete', action: 'delete', color: 'red', confirm: 'Delete this announcement? It disappears from the wall.' },
  ],
  emptyText: 'No announcement yet. Publish one with Create.',
};

// ------------------------------------------------------------------ geofence sites
export const GEOFENCE_PAGE: PageConfig = {
  title: 'Geo fence', itemName: 'Site', endpoint: '/organisation/api/branch-geofence/', model: 'branchgeofence',
  intro: 'Places where employees may punch from the mobile app: a point and a radius. Punches outside the radius are refused or flagged, as the '
    + 'attendance rule says (Attendance rules › Require geofence).',
  columns: [
    { key: 'location_name', label: 'Site' }, { key: 'location_type_label', label: 'Type' }, { key: 'branch_names', label: 'Branches' },
    { key: 'radius', label: 'Radius', value: (r: any) => r.radius ? `${r.radius} m` : '–' },
    { key: 'latitude', label: 'Position', value: (r: any) => `${Number(r.latitude).toFixed(5)}, ${Number(r.longitude).toFixed(5)}` },
    { key: 'employee_count', label: 'Only for', value: (r: any) => r.employee_count ? `${r.employee_count} employees` : 'Everyone of the branch' },
    { key: 'is_active', label: 'Active', type: 'bool' },
  ],
  fields: [
    { key: 'location_name', label: 'Site name', type: 'text', required: true, width: 6, placeholder: 'e.g. Main gate, Warehouse entry' },
    { key: 'location_type', label: 'Type', type: 'select', default: 'office', width: 6,
      options: opt([['office', 'Office'], ['remote', 'Remote site'], ['client', 'Client site'], ['home', 'Home']]) },
    { key: 'branch', label: 'Branches', type: 'multiselect', lookup: LOOKUPS.branches, width: 6 },
    { key: 'employee', label: 'Only these employees (empty = everyone of the branches)', type: 'multiselect', lookup: LOOKUPS.employees, width: 6 },
    { key: 'latitude', label: 'Latitude', type: 'number', required: true, width: 4, help: 'From Google Maps: right-click the place › copy the numbers.' },
    { key: 'longitude', label: 'Longitude', type: 'number', required: true, width: 4 },
    { key: 'radius', label: 'Radius (metres)', type: 'number', default: 150, width: 4 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 4 },
  ],
  emptyText: 'No geofence yet. Add the office or site where employees punch from the mobile app.',
};
