import { LOOKUPS } from '../module-api.service';
import { PageConfig } from '../page-config';

const RATINGS = [5, 4, 3, 2, 1].map(n => ({ value: n, label: String(n) }));
const API = '/performance/api/';

export const KPI_PAGE: PageConfig = {
  title: 'KPI & Competency Library',
  itemName: 'KPI / Competency',
  endpoint: API + 'kpis/',
  model: 'kpi',
  intro: 'KPIs and behavioural competencies that employees pick when they set goals.',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'kpi_type', label: 'Type', type: 'tag', tagColors: { kpi: 'blue', competency: 'cyan' } },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Level' },
    { key: 'default_weight', label: 'Default weight', type: 'percent' },
    { key: 'measure', label: 'Measure' },
    { key: 'is_active', label: 'Active', type: 'bool' },
  ],
  filters: [
    { key: 'kpi_type', label: 'Type', options: [{ value: 'kpi', label: 'KPI' }, { value: 'competency', label: 'Competency' }] },
    { key: 'department', label: 'Department', lookup: LOOKUPS.departments },
  ],
  fields: [
    { key: 'code', label: 'Code', type: 'text', required: true, width: 4, placeholder: 'KPI-001' },
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 },
    { key: 'kpi_type', label: 'Type', type: 'select', required: true, default: 'kpi', options: [{ value: 'kpi', label: 'KPI' }, { value: 'competency', label: 'Competency' }], width: 4 },
    { key: 'measure', label: 'Measure', type: 'select', default: 'quantitative', options: [{ value: 'quantitative', label: 'Quantitative' }, { value: 'behavioural', label: 'Behavioural' }], width: 4 },
    { key: 'default_weight', label: 'Default weight %', type: 'number', default: 10, width: 4 },
    { key: 'department', label: 'Department (empty = all)', type: 'select', lookup: LOOKUPS.departments },
    { key: 'designation', label: 'Designation / level (empty = all)', type: 'select', lookup: LOOKUPS.designations },
    { key: 'description', label: 'How it is measured', type: 'textarea', width: 12 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const TEMPLATE_PAGE: PageConfig = {
  title: 'Appraisal Templates',
  itemName: 'Appraisal Template',
  endpoint: API + 'templates/',
  model: 'appraisaltemplate',
  intro: 'KPI / competency split and the goal count rules used by a cycle.',
  columns: [
    { key: 'name', label: 'Template' },
    { key: 'kpi_weight', label: 'KPI weight', type: 'percent' },
    { key: 'competency_weight', label: 'Competency weight', type: 'percent' },
    { key: 'min_goals', label: 'Min goals' },
    { key: 'max_goals', label: 'Max goals' },
    { key: 'is_active', label: 'Active', type: 'bool' },
  ],
  fields: [
    { key: 'name', label: 'Template name', type: 'text', required: true, width: 12 },
    { key: 'kpi_weight', label: 'KPI weight %', type: 'number', required: true, default: 70, width: 3 },
    { key: 'competency_weight', label: 'Competency weight %', type: 'number', required: true, default: 30, width: 3 },
    { key: 'min_goals', label: 'Min goals', type: 'number', default: 3, width: 3 },
    { key: 'max_goals', label: 'Max goals', type: 'number', default: 8, width: 3 },
    { key: 'description', label: 'Description', type: 'textarea', width: 12 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

const CYCLE_STATUS = { draft: 'grey', active: 'blue', calibration: 'orange', closed: 'green' };

export const CYCLE_PAGE: PageConfig = {
  title: 'Appraisal Cycles',
  itemName: 'Appraisal Cycle',
  endpoint: API + 'cycles/',
  model: 'appraisalcycle',
  intro: 'Create a cycle, check who is eligible, then Launch to create a goal sheet for every eligible employee.',
  columns: [
    { key: 'name', label: 'Cycle' },
    { key: 'cycle_type', label: 'Type' },
    { key: 'template', label: 'Template' },
    { key: 'period_from', label: 'From', type: 'date' },
    { key: 'period_to', label: 'To', type: 'date' },
    { key: 'eligible_count', label: 'Eligible' },
    { key: 'sheet_count', label: 'Goal sheets' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: CYCLE_STATUS },
  ],
  detailFields: [
    { key: 'name', label: 'Cycle' }, { key: 'template', label: 'Template' }, { key: 'status', label: 'Status', type: 'tag', tagColors: CYCLE_STATUS },
    { key: 'eligible_joined_before', label: 'Joined before', type: 'date' }, { key: 'branches', label: 'Branches' }, { key: 'departments', label: 'Departments' },
    { key: 'goal_setting_due', label: 'Goal setting due', type: 'date' }, { key: 'checkin_due', label: 'Check-in due', type: 'date' },
    { key: 'self_appraisal_due', label: 'Self appraisal due', type: 'date' }, { key: 'manager_review_due', label: 'Manager review due', type: 'date' },
    { key: 'calibration_due', label: 'Calibration due', type: 'date' }, { key: 'increment_effective_date', label: 'Increment effective', type: 'date' },
  ],
  fields: [
    { key: 'name', label: 'Cycle name', type: 'text', required: true, width: 6, placeholder: 'Annual Appraisal 2026' },
    { key: 'cycle_type', label: 'Type', type: 'select', default: 'annual', width: 3, options: [{ value: 'annual', label: 'Annual' }, { value: 'half_yearly', label: 'Half-yearly' }, { value: 'probation', label: 'Probation review' }] },
    { key: 'template', label: 'Template', type: 'select', required: true, width: 3, lookup: { endpoint: API + 'templates/', label: 'name' } },
    { key: 'period_from', label: 'Review period from', type: 'date', required: true, width: 3 },
    { key: 'period_to', label: 'Review period to', type: 'date', required: true, width: 3 },
    { key: 'eligible_joined_before', label: 'Eligible if joined before', type: 'date', width: 3 },
    { key: 'increment_effective_date', label: 'Increment effective from', type: 'date', width: 3 },
    { key: 'branches', label: 'Branches (empty = all)', type: 'multiselect', lookup: LOOKUPS.branches, width: 6 },
    { key: 'departments', label: 'Departments (empty = all)', type: 'multiselect', lookup: LOOKUPS.departments, width: 6 },
    { key: 'goal_setting_due', label: 'Goal setting due', type: 'date', width: 4 },
    { key: 'checkin_due', label: 'Mid-year check-in due', type: 'date', width: 4 },
    { key: 'self_appraisal_start', label: 'Self appraisal opens', type: 'date', width: 4 },
    { key: 'self_appraisal_due', label: 'Self appraisal due', type: 'date', width: 4 },
    { key: 'manager_review_due', label: 'Manager review due', type: 'date', width: 4 },
    { key: 'calibration_due', label: 'Calibration due', type: 'date', width: 4 },
  ],
  canEdit: r => r.status === 'draft' || r.status === 'active',
  canDelete: r => r.status === 'draft',
  rowActions: [
    { label: 'Launch', action: 'launch', color: 'green', showIf: r => r.status === 'draft', confirm: 'Launch this cycle and create goal sheets for all eligible employees?' },
    { label: 'Close', action: 'close', color: 'grey', showIf: r => r.status === 'calibration', confirm: 'Close the cycle? Ratings and outcomes become read-only.' },
  ],
  children: [
    {
      title: 'Increment bands (by final rating)',
      endpoint: API + 'increment-bands/',
      parentKey: 'cycle',
      columns: [
        { key: 'rating', label: 'Rating' },
        { key: 'increment_percent', label: 'Increment', type: 'percent' },
        { key: 'bonus_months', label: 'Bonus (months of basic)' },
        { key: 'guideline_percent', label: 'Guideline share', type: 'percent' },
      ],
      fields: [
        { key: 'rating', label: 'Rating', type: 'select', options: RATINGS, required: true, width: 3 },
        { key: 'increment_percent', label: 'Increment %', type: 'number', required: true, width: 3 },
        { key: 'bonus_months', label: 'Bonus months', type: 'number', default: 0, width: 3 },
        { key: 'guideline_percent', label: 'Guideline %', type: 'number', default: 0, width: 3 },
      ],
      canAdd: p => p.status !== 'closed',
      canEdit: p => p.status !== 'closed',
      canDelete: p => p.status === 'draft',
    },
  ],
};

const OUTCOME_STATUS = { pending: 'orange', approved: 'blue', pushed: 'green', rejected: 'red' };

export const OUTCOME_PAGE: PageConfig = {
  title: 'Appraisal Outcomes',
  itemName: 'Appraisal Outcome',
  endpoint: API + 'outcomes/',
  model: 'appraisaloutcome',
  intro: 'Generated from calibrated ratings. Approve, then push to payroll: the Basic salary is updated and the change is kept in salary revision history.',
  columns: [
    { key: 'employee_name', label: 'Employee' },
    { key: 'employee_code', label: 'Code' },
    { key: 'department', label: 'Dept' },
    { key: 'final_rating', label: 'Rating' },
    { key: 'current_basic', label: 'Current basic', type: 'money' },
    { key: 'increment_percent', label: 'Increment', type: 'percent' },
    { key: 'new_basic', label: 'New basic', type: 'money' },
    { key: 'bonus_amount', label: 'Bonus', type: 'money' },
    { key: 'effective_date', label: 'Effective', type: 'date' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: OUTCOME_STATUS },
  ],
  filters: [
    { key: 'cycle', label: 'Cycle', lookup: { endpoint: API + 'cycles/', label: 'name' } },
    { key: 'status', label: 'Status', options: Object.keys(OUTCOME_STATUS).map(k => ({ value: k, label: k })) },
  ],
  canCreate: false,
  fields: [
    { key: 'increment_percent', label: 'Increment %', type: 'number', width: 4 },
    { key: 'bonus_amount', label: 'Bonus (AED)', type: 'number', width: 4 },
    { key: 'effective_date', label: 'Effective date', type: 'date', width: 4 },
    { key: 'remarks', label: 'Remarks', type: 'text', width: 12 },
  ],
  canEdit: r => r.status !== 'pushed',
  rowActions: [
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.status === 'pending' || r.status === 'rejected' },
    { label: 'Reject', action: 'reject', color: 'red', showIf: r => r.status === 'pending', prompt: [{ key: 'remarks', label: 'Reason', type: 'textarea', required: true }] },
    { label: 'Push to payroll', action: 'push_to_payroll', color: 'blue', showIf: r => r.status === 'approved', confirm: 'Update the Basic salary in payroll?' },
  ],
  toolbarActions: [
    { label: 'Approve all', icon: 'done_all', action: 'approve_all', color: 'green', body: (_r, f) => ({ cycle: f['cycle'] }), confirm: 'Approve all pending outcomes for the selected cycle?' },
    { label: 'Push all to payroll', icon: 'sync', action: 'push_all', color: 'blue', body: (_r, f) => ({ cycle: f['cycle'] }), confirm: 'Push all approved outcomes of the selected cycle to payroll?' },
  ],
};

const PIP_STATUS = { active: 'orange', extended: 'orange', completed: 'green', failed: 'red', cancelled: 'grey' };

export const PIP_PAGE: PageConfig = {
  title: 'Performance Improvement Plans',
  itemName: 'Improvement Plan (PIP)',
  endpoint: API + 'pips/',
  model: 'performanceimprovementplan',
  intro: 'Created automatically for final ratings of 2 or below; HR can also add one manually.',
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'start_date', label: 'Start', type: 'date' },
    { key: 'end_date', label: 'End', type: 'date' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: PIP_STATUS },
  ],
  detailFields: [
    { key: 'employee', label: 'Employee' }, { key: 'sheet', label: 'From appraisal' }, { key: 'objectives', label: 'Objectives' },
    { key: 'support_plan', label: 'Support plan' }, { key: 'status', label: 'Status', type: 'tag', tagColors: PIP_STATUS }, { key: 'outcome_notes', label: 'Outcome' },
  ],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, required: true },
    { key: 'owner', label: 'Owner (manager login)', type: 'select', lookup: LOOKUPS.users },
    { key: 'start_date', label: 'Start', type: 'date', required: true, width: 3 },
    { key: 'end_date', label: 'End', type: 'date', required: true, width: 3 },
    { key: 'status', label: 'Status', type: 'select', default: 'active', width: 6, options: Object.keys(PIP_STATUS).map(k => ({ value: k, label: k })) },
    { key: 'objectives', label: 'Objectives', type: 'textarea', required: true, width: 12 },
    { key: 'support_plan', label: 'Support plan (training, coaching)', type: 'textarea', width: 12 },
    { key: 'outcome_notes', label: 'Outcome notes', type: 'textarea', width: 12, editOnly: true },
  ],
  children: [
    {
      title: 'Monthly reviews', endpoint: API + 'pip-reviews/', parentKey: 'pip',
      columns: [{ key: 'review_date', label: 'Date', type: 'date' }, { key: 'rating', label: 'Rating' }, { key: 'progress_notes', label: 'Notes' }, { key: 'reviewed_by', label: 'By' }],
      fields: [
        { key: 'review_date', label: 'Date', type: 'date', required: true, width: 4 },
        { key: 'rating', label: 'Rating', type: 'select', options: RATINGS, width: 4 },
        { key: 'progress_notes', label: 'Progress notes', type: 'textarea', required: true, width: 12 },
      ],
      canAdd: p => p.status === 'active' || p.status === 'extended',
    },
  ],
};
