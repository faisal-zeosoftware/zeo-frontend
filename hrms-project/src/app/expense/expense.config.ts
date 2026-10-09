import { LOOKUPS } from '../hr-modules/module-api.service';
import { PageConfig } from '../hr-modules/page-config';

/** Setup and request pages of Expense management, rendered by the shared CrudPageComponent. */
const API = '/expense/api/';
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const KINDS = opt([['general', 'General'], ['mileage', 'Mileage (km × rate)'], ['per_diem', 'Per diem (days × rate)'], ['travel', 'Travel'], ['hotel', 'Hotel'], ['meals', 'Meals']]);
const ROLES = ['reporting_manager', 'manager_of_manager', 'department_head', 'branch_hr', 'company_hr', 'admin'];
const CATEGORY_LOOKUP = { endpoint: API + 'categories/', label: 'name', params: { active: 'true' } };
const STATUS_COLORS = { draft: 'grey', submitted: 'orange', approved: 'green', rejected: 'red', closed: 'blue', requested: 'grey', paid: 'cyan', settled: 'blue' };

export const EXPENSE_CATEGORY_PAGE: PageConfig = {
  title: 'Expense Categories',
  itemName: 'Category',
  endpoint: API + 'categories/',
  model: 'expensecategory',
  intro: 'What employees can claim. The GL account is used by the accounting export; a receipt can be required above an amount.',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Category' },
    { key: 'kind', label: 'Type', type: 'tag', tagColors: { mileage: 'cyan', per_diem: 'blue', travel: 'orange', hotel: 'orange', meals: 'green', general: 'grey' } },
    { key: 'gl_account', label: 'GL account' },
    { key: 'receipt_required_above', label: 'Receipt above (AED)', value: r => (r.receipt_required_above === null ? 'Never' : r.receipt_required_above) },
    { key: 'description_required', label: 'Description required', type: 'bool' },
    { key: 'active', label: 'Active', type: 'bool' },
  ],
  searchKeys: ['code', 'name', 'gl_account'],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 },
    { key: 'code', label: 'Code', type: 'text', required: true, width: 4 },
    { key: 'kind', label: 'Type', type: 'select', options: KINDS, default: 'general', width: 6 },
    { key: 'gl_account', label: 'GL account (expense)', type: 'text', width: 6, placeholder: 'e.g. 6140' },
    { key: 'receipt_required_above', label: 'Receipt required above (AED)', type: 'number', width: 6, help: 'Empty = never; 0 = always' },
    { key: 'description_required', label: 'Description', type: 'checkbox', width: 6, help: 'Employees must describe the expense' },
    { key: 'description', label: 'Notes for employees', type: 'textarea', width: 12 },
    { key: 'active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const EXPENSE_POLICY_PAGE: PageConfig = {
  title: 'Expense Policies',
  itemName: 'Policy',
  endpoint: API + 'policies/',
  model: 'expensepolicy',
  intro: 'Rates (mileage per km, per diem per day), limits per category (per expense, per day, per report – warn or block) and the approval levels. The most specific policy (branch / employee category / grade) applies; else the default one.',
  columns: [
    { key: 'name', label: 'Policy' },
    { key: 'is_default', label: 'Default', type: 'bool' },
    { key: 'mileage_rate', label: 'Mileage / km', type: 'money' },
    { key: 'per_diem_rate', label: 'Per diem / day', type: 'money' },
    { key: 'approval_roles', label: 'Approval levels', value: r => (r.approval_roles || []).map((x: string) => x.replace(/_/g, ' ')).join(' → ') || 'reporting manager → branch hr' },
    { key: 'limits', label: 'Limits', value: r => (r.limits || []).length },
    { key: 'active', label: 'Active', type: 'bool' },
  ],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 },
    { key: 'currency', label: 'Currency', type: 'text', default: 'AED', width: 4 },
    { key: 'mileage_rate', label: 'Mileage rate (AED per km)', type: 'number', default: 0.5, width: 6 },
    { key: 'per_diem_rate', label: 'Per diem (AED per day)', type: 'number', default: 0, width: 6, help: '0 = employees enter the amount' },
    { key: 'approval_roles', label: 'Approval levels (in order)', type: 'chips', chipOptions: ROLES, default: () => ['reporting_manager', 'branch_hr'], width: 12,
      help: 'A missing approver falls back to branch HR → company HR → admin; never the employee' },
    { key: 'branch_ids', label: 'Branches (empty = all)', type: 'multiselect', lookup: LOOKUPS.branches, width: 6 },
    { key: 'category_ids', label: 'Employee categories (empty = all)', type: 'multiselect', lookup: LOOKUPS.categories, width: 6 },
    { key: 'grade_ids', label: 'Grades / designations (empty = all)', type: 'multiselect', lookup: LOOKUPS.designations, width: 12 },
    { key: 'description', label: 'Description', type: 'textarea', width: 12 },
    { key: 'is_default', label: 'Default policy', type: 'checkbox', help: 'For employees no other policy matches' },
    { key: 'active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
  children: [
    {
      title: 'Category limits', endpoint: API + 'policy-limits/', parentKey: 'policy',
      columns: [
        { key: 'category_name', label: 'Category' },
        { key: 'per_expense_limit', label: 'Per expense', type: 'money' },
        { key: 'per_day_limit', label: 'Per day', type: 'money' },
        { key: 'per_report_limit', label: 'Per report', type: 'money' },
        { key: 'block_or_warn', label: 'When over', type: 'tag', tagColors: { warn: 'orange', block: 'red' } },
      ],
      fields: [
        { key: 'category', label: 'Category', type: 'select', required: true, lookup: CATEGORY_LOOKUP, width: 12 },
        { key: 'per_expense_limit', label: 'Per expense (AED)', type: 'number', width: 4 },
        { key: 'per_day_limit', label: 'Per day (AED)', type: 'number', width: 4 },
        { key: 'per_report_limit', label: 'Per report (AED)', type: 'number', width: 4 },
        { key: 'block_or_warn', label: 'When over the limit', type: 'select', default: 'warn', width: 12, options: opt([['warn', 'Warn (can still submit)'], ['block', 'Block (cannot submit)']]) },
      ],
      canAdd: () => true, canEdit: () => true, canDelete: () => true,
    },
  ],
};

export const COST_CENTER_PAGE: PageConfig = {
  title: 'Cost Centres',
  itemName: 'Cost Centre',
  endpoint: API + 'cost-centers/',
  model: 'costcenter',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'department_name', label: 'Department' },
    { key: 'active', label: 'Active', type: 'bool' },
  ],
  searchKeys: ['code', 'name'],
  fields: [
    { key: 'code', label: 'Code', type: 'text', required: true, width: 4 },
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 },
    { key: 'department_id', label: 'Department', type: 'select', lookup: LOOKUPS.departments, width: 12 },
    { key: 'active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

/** Self-service: no `model`, so every employee can raise trips / advances (the API keeps them to their own rows). */
export const TRIP_PAGE: PageConfig = {
  title: 'Trips',
  itemName: 'Trip',
  endpoint: API + 'trips/',
  intro: 'Plan a business trip and ask for an advance. Approval follows the expense policy levels; an approved trip with an advance creates the advance for finance to pay.',
  columns: [
    { key: 'number', label: 'Trip' },
    { key: 'employee_name', label: 'Employee' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'to_place', label: 'Destination', value: r => [r.from_place, r.to_place].filter(Boolean).join(' → ') },
    { key: 'start_date', label: 'From', type: 'date' },
    { key: 'end_date', label: 'To', type: 'date' },
    { key: 'estimated_cost', label: 'Estimate', type: 'money' },
    { key: 'advance_requested', label: 'Advance', type: 'money' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: STATUS_COLORS },
    { key: 'waiting_for', label: 'Waiting for' },
  ],
  filters: [
    { key: 'status', label: 'Status', options: opt([['draft', 'Draft'], ['submitted', 'Submitted'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['closed', 'Closed']]) },
    { key: 'mine', label: 'Show', options: opt([['1', 'Only my trips']]) },
  ],
  fields: [
    { key: 'purpose', label: 'Purpose', type: 'text', required: true, width: 12 },
    { key: 'from_place', label: 'From', type: 'text', width: 6 },
    { key: 'to_place', label: 'To', type: 'text', width: 6 },
    { key: 'start_date', label: 'Start date', type: 'date', required: true, width: 6 },
    { key: 'end_date', label: 'End date', type: 'date', required: true, width: 6 },
    { key: 'estimated_cost', label: 'Estimated cost (AED)', type: 'number', default: 0, width: 6 },
    { key: 'advance_requested', label: 'Advance needed (AED)', type: 'number', default: 0, width: 6 },
    { key: 'employee_id', label: 'Employee (HR – empty = me)', type: 'select', lookup: LOOKUPS.employees, width: 12, createOnly: true },
    { key: 'notes', label: 'Notes', type: 'textarea', width: 12 },
  ],
  canEdit: r => r.status === 'draft' || r.status === 'rejected',
  canDelete: r => r.status === 'draft',
  rowActions: [
    { label: 'Submit', action: 'submit', color: 'blue', showIf: r => r.status === 'draft' || r.status === 'rejected' },
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.status === 'submitted' },
    { label: 'Reject', action: 'reject', color: 'red', showIf: r => r.status === 'submitted', prompt: [{ key: 'note', label: 'Reason', type: 'textarea', required: true }] },
    { label: 'Close', action: 'close', color: 'grey', showIf: r => r.status === 'approved', confirm: 'Close this trip?' },
  ],
  detailFields: [{ key: 'notes', label: 'Notes' }],
  children: [
    { title: 'Approval', endpoint: '', rowsFrom: 'approvals', parentKey: 'trip',
      columns: [{ key: 'level', label: 'Level' }, { key: 'approver', label: 'Approver' }, { key: 'role_label', label: 'Role' },
        { key: 'status', label: 'Status', type: 'tag', tagColors: { pending: 'orange', waiting: 'grey', approved: 'green', rejected: 'red', skipped: 'grey' } },
        { key: 'acted_at', label: 'On', type: 'datetime' }, { key: 'note', label: 'Note' }] },
  ],
};

export const ADVANCE_PAGE: PageConfig = {
  title: 'Advances',
  itemName: 'Advance',
  endpoint: API + 'advances/',
  intro: 'Cash advances: the reporting manager (or finance) approves, finance pays with a reference. A paid advance is used against the employee\'s next expense reports.',
  columns: [
    { key: 'number', label: 'Advance' },
    { key: 'employee_name', label: 'Employee' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'trip_number', label: 'Trip' },
    { key: 'amount', label: 'Amount', type: 'money' },
    { key: 'balance', label: 'Open balance', type: 'money' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: STATUS_COLORS },
    { key: 'reference', label: 'Payment ref.' },
  ],
  filters: [
    { key: 'status', label: 'Status', options: opt([['requested', 'Requested'], ['approved', 'Approved'], ['paid', 'Paid'], ['settled', 'Settled'], ['rejected', 'Rejected']]) },
    { key: 'mine', label: 'Show', options: opt([['1', 'Only mine']]) },
  ],
  fields: [
    { key: 'amount', label: 'Amount (AED)', type: 'number', required: true, width: 6 },
    { key: 'date', label: 'Date', type: 'date', required: true, width: 6, default: () => new Date().toISOString().slice(0, 10) },
    { key: 'purpose', label: 'Purpose', type: 'text', width: 12 },
    { key: 'trip', label: 'Trip', type: 'select', lookup: { endpoint: API + 'trips/', label: (r: any) => `${r.number} – ${r.purpose}`, params: { mine: '1' } }, width: 12 },
    { key: 'employee_id', label: 'Employee (HR – empty = me)', type: 'select', lookup: LOOKUPS.employees, width: 12, createOnly: true },
  ],
  canEdit: r => r.status === 'requested',
  canDelete: r => r.status === 'requested',
  rowActions: [
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.status === 'requested' },
    { label: 'Pay', action: 'pay', color: 'blue', showIf: r => r.status === 'approved',
      prompt: [{ key: 'reference', label: 'Payment reference', type: 'text', required: true }, { key: 'date', label: 'Paid on', type: 'date' }] },
    { label: 'Reject', action: 'reject', color: 'red', showIf: r => r.status === 'requested' || r.status === 'approved', confirm: 'Reject this advance?' },
  ],
};
