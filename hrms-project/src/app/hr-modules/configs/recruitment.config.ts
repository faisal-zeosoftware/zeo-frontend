import { LOOKUPS } from '../module-api.service';
import { PageConfig } from '../page-config';

const API = '/recruitment/api/';
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const REQ_STATUS = { draft: 'grey', pending: 'orange', approved: 'green', rejected: 'red', on_hold: 'grey', closed: 'cyan' };
const EMPLOYMENT = opt([['full_time', 'Full time'], ['part_time', 'Part time'], ['contract', 'Fixed-term contract'], ['intern', 'Internship']]);

export const APPROVAL_LEVEL_PAGE: PageConfig = {
  title: 'Requisition Approval Levels',
  itemName: 'Approval Level',
  endpoint: API + 'approval-levels/',
  model: 'requisitionapprovallevel',
  intro: 'Who approves a manpower requisition, in order. A level with a budget limit is only needed when the maximum salary is above it.',
  columns: [
    { key: 'level', label: 'Level' }, { key: 'role', label: 'Role' }, { key: 'approver', label: 'Approver' },
    { key: 'only_above_budget', label: 'Only above (AED / month)', type: 'money' },
  ],
  fields: [
    { key: 'level', label: 'Level', type: 'number', required: true, width: 3 },
    { key: 'role', label: 'Role', type: 'text', required: true, width: 9, placeholder: 'Department Head / HR Manager / Finance / CEO' },
    { key: 'approver', label: 'Approver (login)', type: 'select', lookup: LOOKUPS.users },
    { key: 'only_above_budget', label: 'Only when max salary above (AED)', type: 'number' },
  ],
  canDelete: true,
};

export const REQUISITION_PAGE: PageConfig = {
  title: 'Manpower Requisitions',
  itemName: 'Manpower Requisition',
  endpoint: API + 'requisitions/',
  model: 'manpowerrequisition',
  intro: 'Hiring managers raise a request; it goes through the approval levels; an approved request becomes a job opening.',
  columns: [
    { key: 'document_number', label: 'No.' },
    { key: 'position_title', label: 'Position' },
    { key: 'department', label: 'Department' },
    { key: 'headcount', label: 'HC' },
    { key: 'max_salary', label: 'Budget up to (AED)', type: 'money' },
    { key: 'is_emiratisation', label: 'Nafis', type: 'bool' },
    { key: 'pending_with', label: 'Pending with' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: REQ_STATUS },
  ],
  filters: [
    { key: 'status', label: 'Status', options: Object.keys(REQ_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) },
    { key: 'department', label: 'Department', lookup: LOOKUPS.departments },
  ],
  detailFields: [
    { key: 'document_number', label: 'No.' }, { key: 'position_title', label: 'Position' }, { key: 'designation', label: 'Designation' },
    { key: 'requisition_type', label: 'Type' }, { key: 'replacing_employee', label: 'Replacing' }, { key: 'employment_type', label: 'Employment' },
    { key: 'min_salary', label: 'Min (AED)', type: 'money' }, { key: 'max_salary', label: 'Max (AED)', type: 'money' },
    { key: 'work_location', label: 'Location' }, { key: 'target_joining_date', label: 'Target joining', type: 'date' },
    { key: 'reporting_to', label: 'Reports to' }, { key: 'justification', label: 'Justification' }, { key: 'requested_by', label: 'Requested by' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: REQ_STATUS },
  ],
  fields: [
    { key: 'position_title', label: 'Position title', type: 'text', required: true, width: 6 },
    { key: 'headcount', label: 'Headcount', type: 'number', required: true, default: 1, width: 2 },
    { key: 'requisition_type', label: 'Requisition type', type: 'select', default: 'new', width: 4, options: opt([['new', 'New position (budgeted)'], ['new_unbudgeted', 'New position (not budgeted)'], ['replacement', 'Replacement']]) },
    { key: 'replacing_employee', label: 'Replacing employee', type: 'select', lookup: LOOKUPS.employees, showIf: m => m.requisition_type === 'replacement' },
    { key: 'department', label: 'Department', type: 'select', required: true, lookup: LOOKUPS.departments, width: 4 },
    { key: 'designation', label: 'Designation', type: 'select', required: true, lookup: LOOKUPS.designations, width: 4 },
    { key: 'branch', label: 'Branch', type: 'select', lookup: LOOKUPS.branches, width: 4 },
    { key: 'employment_type', label: 'Employment type', type: 'select', default: 'full_time', options: EMPLOYMENT, width: 4 },
    { key: 'min_salary', label: 'Min salary (AED / month)', type: 'number', width: 4 },
    { key: 'max_salary', label: 'Max salary (AED / month)', type: 'number', width: 4 },
    { key: 'work_location', label: 'Work location', type: 'text', width: 4 },
    { key: 'target_joining_date', label: 'Target joining date', type: 'date', width: 4 },
    { key: 'reporting_to', label: 'Reports to', type: 'select', lookup: LOOKUPS.employees, width: 4 },
    { key: 'is_emiratisation', label: 'Emiratisation', type: 'checkbox', help: 'Nafis / Emiratisation position' },
    { key: 'justification', label: 'Justification', type: 'textarea', required: true, width: 12 },
  ],
  canEdit: r => r.status === 'draft' || r.status === 'rejected',
  canDelete: r => r.status === 'draft' || r.status === 'rejected',
  rowActions: [
    { label: 'Submit', action: 'submit', color: 'blue', showIf: r => r.status === 'draft' || r.status === 'rejected' },
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.status === 'pending', prompt: [{ key: 'comments', label: 'Comments', type: 'textarea' }] },
    { label: 'Reject', action: 'reject', color: 'red', showIf: r => r.status === 'pending', prompt: [{ key: 'comments', label: 'Reason', type: 'textarea', required: true }] },
    { label: 'Create opening', action: 'create_opening', color: 'cyan', showIf: r => r.status === 'approved' },
  ],
  children: [
    {
      title: 'Approval trail', endpoint: API + 'requisitions/', parentKey: 'requisition', rowsFrom: 'approvals',
      columns: [{ key: 'level', label: 'Level' }, { key: 'role', label: 'Role' }, { key: 'approver', label: 'Approver' }, { key: 'status', label: 'Status', type: 'tag', tagColors: { pending: 'orange', approved: 'green', rejected: 'red', skipped: 'grey' } }, { key: 'comments', label: 'Comments' }, { key: 'acted_on', label: 'On', type: 'datetime' }],
    },
  ],
};

const JOB_STATUS = { draft: 'grey', published: 'green', interviewing: 'blue', on_hold: 'orange', filled: 'cyan', closed: 'grey' };
const CHANNELS = ['Careers page', 'LinkedIn', 'Bayt', 'Naukrigulf', 'Indeed', 'Nafis portal', 'Dubizzle Jobs', 'Referral', 'Internal only'];

export const JOB_PAGE: PageConfig = {
  title: 'Job Openings',
  itemName: 'Job Opening',
  endpoint: API + 'job-openings/',
  model: 'jobopening',
  stats: {
    endpoint: API + 'job-openings/dashboard/',
    tiles: [
      { key: 'open_positions', label: 'Open positions' }, { key: 'applicants_30_days', label: 'Applicants (30 days)' },
      { key: 'interviews_this_week', label: 'Interviews this week' }, { key: 'avg_time_to_hire_days', label: 'Avg. time to hire', format: 'days' },
      { key: 'pending_requisitions', label: 'Requisitions pending', color: '#a0610a' },
    ],
  },
  columns: [
    { key: 'job_code', label: 'Job code' },
    { key: 'title', label: 'Position' },
    { key: 'department', label: 'Dept' },
    { key: 'openings', label: 'Openings' },
    { key: 'applicant_count', label: 'Applicants' },
    { key: 'channels', label: 'Published on', type: 'list' },
    { key: 'closing_date', label: 'Closing', type: 'date' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: JOB_STATUS },
  ],
  filters: [{ key: 'status', label: 'Status', options: Object.keys(JOB_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) }],
  fields: [
    { key: 'title', label: 'Position title', type: 'text', required: true, width: 6 },
    { key: 'openings', label: 'Openings', type: 'number', default: 1, width: 2 },
    { key: 'employment_type', label: 'Employment type', type: 'select', default: 'full_time', options: EMPLOYMENT, width: 4 },
    { key: 'department', label: 'Department', type: 'select', lookup: LOOKUPS.departments, width: 4 },
    { key: 'designation', label: 'Designation', type: 'select', lookup: LOOKUPS.designations, width: 4 },
    { key: 'branch', label: 'Branch', type: 'select', lookup: LOOKUPS.branches, width: 4 },
    { key: 'location', label: 'Location', type: 'text', width: 4 },
    { key: 'experience_min_years', label: 'Min experience (yrs)', type: 'number', default: 0, width: 4 },
    { key: 'closing_date', label: 'Closing date', type: 'date', width: 4 },
    { key: 'min_salary', label: 'Min salary (AED)', type: 'number', width: 4 },
    { key: 'max_salary', label: 'Max salary (AED)', type: 'number', width: 4 },
    { key: 'is_emiratisation', label: 'Emiratisation', type: 'checkbox', help: 'Nafis position', width: 4 },
    { key: 'channels', label: 'Publish on', type: 'chips', chipOptions: CHANNELS, width: 12, default: () => ['Careers page'] },
    { key: 'description', label: 'Job description', type: 'textarea', required: true, width: 12 },
    { key: 'requirements', label: 'Requirements', type: 'textarea', width: 12 },
  ],
  canDelete: r => r.status === 'draft',
  rowActions: [
    { label: 'Publish', action: 'publish', color: 'green', showIf: r => r.status === 'draft' || r.status === 'on_hold' },
    { label: 'Pipeline', color: 'blue', route: () => '/main-sidebar/recruitment-options/pipeline', showIf: r => r.applicant_count > 0 },
    { label: 'Close', action: 'close', color: 'grey', showIf: r => ['published', 'interviewing', 'on_hold'].includes(r.status), prompt: [{ key: 'status', label: 'Close as', type: 'select', required: true, options: opt([['filled', 'Filled'], ['closed', 'Closed'], ['on_hold', 'On hold']]) }] },
  ],
};

const VISA = opt([['uae_national', 'UAE National'], ['gcc_national', 'GCC National'], ['own_visa', 'Own / family visa'], ['employment_visa', 'Employment visa (needs transfer)'],
  ['visit_visa', 'Visit visa'], ['outside_uae', 'Outside UAE - needs sponsorship'], ['golden_visa', 'Golden visa']]);
const SOURCE = opt([['careers', 'Careers page'], ['linkedin', 'LinkedIn'], ['bayt', 'Bayt'], ['naukrigulf', 'Naukrigulf'], ['indeed', 'Indeed'], ['nafis', 'Nafis portal'],
  ['referral', 'Employee referral'], ['agency', 'Recruitment agency'], ['walk_in', 'Walk-in'], ['other', 'Other']]);

export const CANDIDATE_PAGE: PageConfig = {
  title: 'Candidates',
  itemName: 'Candidate',
  endpoint: API + 'candidates/',
  model: 'candidate',
  multipart: true,
  columns: [
    { key: 'full_name', label: 'Name' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'experience_years', label: 'Exp (yrs)' },
    { key: 'notice_period_days', label: 'Notice (days)' },
    { key: 'expected_salary', label: 'Expected (AED)', type: 'money' },
    { key: 'visa_status', label: 'Visa status' },
    { key: 'source', label: 'Source' },
  ],
  searchKeys: ['full_name', 'email', 'skills', 'current_employer'],
  detailFields: [
    { key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'nationality', label: 'Nationality' },
    { key: 'current_location', label: 'Location' }, { key: 'current_employer', label: 'Current employer' }, { key: 'current_designation', label: 'Current role' },
    { key: 'current_salary', label: 'Current salary', type: 'money' }, { key: 'expected_salary', label: 'Expected salary', type: 'money' },
    { key: 'visa_status', label: 'Visa status' }, { key: 'skills', label: 'Skills' }, { key: 'languages', label: 'Languages' },
    { key: 'applications', label: 'Applications', value: r => (r.applications_summary || []).map((a: any) => `${a.job_code} (${a.stage})`).join(', ') || '–' },
    { key: 'cv', label: 'CV', value: r => (r.cv ? 'Uploaded' : '–') },
  ],
  fields: [
    { key: 'first_name', label: 'First name', type: 'text', required: true, width: 4 },
    { key: 'last_name', label: 'Last name', type: 'text', width: 4 },
    { key: 'gender', label: 'Gender', type: 'select', width: 4, options: opt([['M', 'Male'], ['F', 'Female'], ['O', 'Other']]) },
    { key: 'email', label: 'Email', type: 'email', required: true, width: 4 },
    { key: 'phone', label: 'Phone', type: 'text', width: 4, placeholder: '+971 5x xxx xxxx' },
    { key: 'date_of_birth', label: 'Date of birth', type: 'date', width: 4 },
    { key: 'nationality', label: 'Nationality', type: 'select', lookup: LOOKUPS.nationalities, width: 4 },
    { key: 'current_location', label: 'Current location', type: 'text', width: 4 },
    { key: 'visa_status', label: 'Visa status', type: 'select', options: VISA, default: 'outside_uae', width: 4 },
    { key: 'current_employer', label: 'Current employer', type: 'text', width: 4 },
    { key: 'current_designation', label: 'Current designation', type: 'text', width: 4 },
    { key: 'experience_years', label: 'Experience (yrs)', type: 'number', default: 0, width: 4 },
    { key: 'notice_period_days', label: 'Notice (days)', type: 'number', default: 30, width: 4 },
    { key: 'current_salary', label: 'Current salary (AED)', type: 'number', width: 4 },
    { key: 'expected_salary', label: 'Expected salary (AED)', type: 'number', width: 4 },
    { key: 'source', label: 'Source', type: 'select', options: SOURCE, default: 'careers', width: 4 },
    { key: 'referred_by', label: 'Referred by', type: 'select', lookup: LOOKUPS.employees, showIf: m => m.source === 'referral', width: 8 },
    { key: 'skills', label: 'Skills', type: 'textarea', width: 6 },
    { key: 'languages', label: 'Languages', type: 'text', width: 6, placeholder: 'English, Arabic' },
    { key: 'cv', label: 'CV (PDF)', type: 'file', width: 6 },
    { key: 'consent_to_retain', label: 'Data retention', type: 'checkbox', help: 'Candidate agreed we keep the CV for future roles', width: 6 },
    { key: 'notes', label: 'Notes', type: 'textarea', width: 12 },
  ],
  canDelete: true,
  children: [
    {
      title: 'Applications', endpoint: API + 'applications/', parentKey: 'candidate',
      columns: [{ key: 'job_title', label: 'Job' }, { key: 'stage', label: 'Stage', type: 'tag', tagColors: { applied: 'grey', screening: 'cyan', interview: 'blue', offer: 'orange', hired: 'green', rejected: 'red' } }, { key: 'screening_score', label: 'Score' }, { key: 'rating', label: 'Rating', type: 'stars' }],
      fields: [
        { key: 'job', label: 'Job opening', type: 'select', required: true, lookup: { endpoint: API + 'job-openings/', label: (r: any) => `${r.job_code} - ${r.title}`, params: { status: 'published,interviewing' } }, width: 12 },
        { key: 'rating', label: 'Initial rating (1-5)', type: 'number', width: 6 },
      ],
      canEdit: () => false,
    },
  ],
};

const IV_STATUS = { scheduled: 'blue', completed: 'green', cancelled: 'grey', no_show: 'red' };

export const INTERVIEW_PAGE: PageConfig = {
  title: 'Interviews',
  itemName: 'Interview',
  detailTitle: r => `${r.candidate_name} – ${r.round_name || 'Interview'}`,
  endpoint: API + 'interviews/',
  model: 'interview',
  intro: 'Scheduling an interview moves the candidate to the Interview stage. Panel members add weighted scores, then Complete calculates the overall score.',
  columns: [
    { key: 'scheduled_at', label: 'Date & time', type: 'datetime' },
    { key: 'candidate_name', label: 'Candidate' },
    { key: 'job_title', label: 'Job' },
    { key: 'round_name', label: 'Round' },
    { key: 'panel_names', label: 'Panel' },
    { key: 'mode', label: 'Mode' },
    { key: 'overall_score', label: 'Score' },
    { key: 'recommendation', label: 'Recommendation' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: IV_STATUS },
  ],
  filters: [{ key: 'status', label: 'Status', options: Object.keys(IV_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) }],
  fields: [
    { key: 'application', label: 'Candidate / job', type: 'select', required: true, width: 12, createOnly: true,
      lookup: { endpoint: API + 'applications/', label: (r: any) => `${r.candidate_name} – ${r.job_title} (${r.stage})`, params: { stage: 'applied,screening,interview' } } },
    { key: 'round_name', label: 'Round', type: 'text', default: 'Round 1 - Technical', width: 6 },
    { key: 'scheduled_at', label: 'Date & time', type: 'datetime', required: true, width: 6 },
    { key: 'duration_minutes', label: 'Duration (min)', type: 'number', default: 60, width: 3 },
    { key: 'mode', label: 'Mode', type: 'select', default: 'office', width: 3, options: opt([['office', 'In office'], ['online', 'Online (Teams / Zoom)'], ['phone', 'Phone']]) },
    { key: 'location_or_link', label: 'Room / meeting link', type: 'text', width: 6 },
    { key: 'panel', label: 'Panel', type: 'multiselect', lookup: LOOKUPS.employees, width: 12 },
    { key: 'status', label: 'Status', type: 'select', editOnly: true, width: 4, options: Object.keys(IV_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) },
    { key: 'comments', label: 'Comments', type: 'textarea', width: 12 },
  ],
  canDelete: r => r.status === 'scheduled',
  rowActions: [
    { label: 'Complete', action: 'complete', color: 'green', showIf: r => r.status === 'scheduled',
      prompt: [{ key: 'recommendation', label: 'Recommendation', type: 'select', required: true, options: opt([['proceed', 'Proceed'], ['hold', 'Hold'], ['reject', 'Reject']]) }, { key: 'comments', label: 'Panel comments', type: 'textarea' }] },
  ],
  children: [
    {
      title: 'Scorecard', endpoint: API + 'interview-scores/', parentKey: 'interview',
      columns: [{ key: 'criterion', label: 'Criterion' }, { key: 'weight', label: 'Weight', type: 'percent' }, { key: 'score', label: 'Score', type: 'stars' }],
      fields: [
        { key: 'criterion', label: 'Criterion', type: 'text', required: true, width: 6, placeholder: 'Technical knowledge' },
        { key: 'weight', label: 'Weight %', type: 'number', default: 25, width: 3 },
        { key: 'score', label: 'Score (1-5)', type: 'select', required: true, width: 3, options: [5, 4, 3, 2, 1].map(n => ({ value: n, label: String(n) })) },
      ],
      canDelete: () => true,
    },
  ],
};

const OFFER_STATUS = { draft: 'grey', pending_approval: 'orange', approved: 'blue', sent: 'cyan', accepted: 'green', declined: 'red', expired: 'grey', withdrawn: 'grey', joined: 'green' };

/** 2026-12-01 -> 01/12/2026 (UAE format) */
const dmy = (v: any) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? `${m[3]}/${m[2]}/${m[1]}` : (v || '—'); };
const money = (v: any) => Number(v || 0).toLocaleString('en-AE', { minimumFractionDigits: 0 });
export const offerLetter = (d: any) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2433">
    <div style="display:flex;justify-content:space-between"><b style="font-size:18px;color:#4b3fbf">OFFER OF EMPLOYMENT</b><span>${d.document_number}<br>${dmy(d.date)}</span></div>
    <p>Dear ${d.candidate},</p>
    <p>We are pleased to offer you the position of <b>${d.position}</b>${d.department ? ' in the ' + d.department + ' department' : ''}, on a <b>${d.contract}</b> contract under the UAE Labour Law, starting on <b>${dmy(d.joining_date)}</b>.</p>
    <table style="border-collapse:collapse;width:60%;margin:10px 0">
      <tr><td style="border:1px solid #ddd;padding:6px">Basic salary</td><td style="border:1px solid #ddd;padding:6px;text-align:right">AED ${money(d.basic)}</td></tr>
      <tr><td style="border:1px solid #ddd;padding:6px">Housing allowance</td><td style="border:1px solid #ddd;padding:6px;text-align:right">AED ${money(d.housing)}</td></tr>
      <tr><td style="border:1px solid #ddd;padding:6px">Transport allowance</td><td style="border:1px solid #ddd;padding:6px;text-align:right">AED ${money(d.transport)}</td></tr>
      ${Number(d.other) ? `<tr><td style="border:1px solid #ddd;padding:6px">Other allowance</td><td style="border:1px solid #ddd;padding:6px;text-align:right">AED ${money(d.other)}</td></tr>` : ''}
      <tr><td style="border:1px solid #ddd;padding:6px"><b>Total monthly</b></td><td style="border:1px solid #ddd;padding:6px;text-align:right"><b>AED ${money(d.total)}</b></td></tr>
    </table>
    <p>Probation: ${d.probation_months} months · Annual leave: ${d.annual_leave_days} days${d.air_ticket ? ' · Air ticket: ' + d.air_ticket : ''}${d.medical_insurance ? ' · Medical insurance: ' + d.medical_insurance : ''}.</p>
    ${d.terms ? `<p>${d.terms}</p>` : ''}
    <p>This offer is valid until ${dmy(d.valid_until)} and is subject to satisfactory documents, medical fitness and the issue of the work permit / residence visa where applicable.</p>
    <div style="display:flex;justify-content:space-between;margin-top:40px"><span>For the company<br><br>______________________</span><span>Accepted by candidate<br><br>______________________</span></div>
  </div>`;

export const OFFER_PAGE: PageConfig = {
  title: 'Offer Letters',
  itemName: 'Offer',
  endpoint: API + 'offers/',
  model: 'offer',
  intro: 'Package split matches Payroll components (Basic / Housing / Transport). Flow: approve → send → accepted / declined.',
  columns: [
    { key: 'document_number', label: 'No.' },
    { key: 'candidate_name', label: 'Candidate' },
    { key: 'position_title', label: 'Position' },
    { key: 'total_monthly', label: 'Total (AED)', type: 'money' },
    { key: 'joining_date', label: 'Joining', type: 'date' },
    { key: 'valid_until', label: 'Valid until', type: 'date' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: OFFER_STATUS },
  ],
  filters: [{ key: 'status', label: 'Status', options: Object.keys(OFFER_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) }],
  fields: [
    { key: 'application', label: 'Candidate / job', type: 'select', required: true, width: 12, createOnly: true,
      lookup: { endpoint: API + 'applications/', label: (r: any) => `${r.candidate_name} – ${r.job_title} (${r.stage})`, params: { stage: 'interview,offer' } } },
    { key: 'position_title', label: 'Position title', type: 'text', required: true, width: 6 },
    { key: 'reporting_manager', label: 'Reporting manager (login)', type: 'select', lookup: LOOKUPS.users, width: 6 },
    { key: 'department', label: 'Department', type: 'select', lookup: LOOKUPS.departments, width: 3 },
    { key: 'designation', label: 'Designation', type: 'select', lookup: LOOKUPS.designations, width: 3 },
    { key: 'branch', label: 'Branch / visa sponsor', type: 'select', lookup: LOOKUPS.branches, width: 3 },
    { key: 'category', label: 'Category', type: 'select', lookup: LOOKUPS.categories, width: 3 },
    { key: 'contract_type', label: 'Contract', type: 'select', default: 'limited', width: 3, options: opt([['limited', 'Limited (fixed-term)'], ['unlimited', 'Unlimited']]) },
    { key: 'contract_years', label: 'Contract years', type: 'number', default: 2, width: 3, showIf: m => m.contract_type === 'limited' },
    { key: 'probation_months', label: 'Probation (months, max 6)', type: 'number', default: 6, width: 3 },
    { key: 'annual_leave_days', label: 'Annual leave (days)', type: 'number', default: 30, width: 3 },
    { key: 'basic_salary', label: 'Basic (AED)', type: 'number', required: true, width: 3 },
    { key: 'housing_allowance', label: 'Housing (AED)', type: 'number', default: 0, width: 3 },
    { key: 'transport_allowance', label: 'Transport (AED)', type: 'number', default: 0, width: 3 },
    { key: 'other_allowance', label: 'Other (AED)', type: 'number', default: 0, width: 3 },
    { key: 'joining_date', label: 'Joining date', type: 'date', required: true, width: 4 },
    { key: 'valid_until', label: 'Offer valid until', type: 'date', width: 4 },
    { key: 'air_ticket', label: 'Air ticket', type: 'text', width: 4, default: 'Annual economy ticket to home country' },
    { key: 'medical_insurance', label: 'Medical insurance', type: 'text', width: 6 },
    { key: 'terms', label: 'Other terms', type: 'textarea', width: 12 },
  ],
  canEdit: r => r.status === 'draft' || r.status === 'pending_approval',
  canDelete: r => r.status === 'draft' || r.status === 'pending_approval',
  rowActions: [
    { label: 'Letter', action: 'letter', method: 'get', color: 'grey', document: offerLetter },
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.status === 'draft' || r.status === 'pending_approval' },
    { label: 'Send', action: 'send', color: 'blue', showIf: r => r.status === 'approved', confirm: 'Mark the offer as sent to the candidate?' },
    { label: 'Accepted', action: 'accept', color: 'green', showIf: r => r.status === 'sent', confirm: 'Candidate accepted? This starts the visa / onboarding checklist.' },
    { label: 'Declined', action: 'decline', color: 'red', showIf: r => r.status === 'sent' || r.status === 'approved', prompt: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] },
    { label: 'Withdraw', action: 'withdraw', color: 'grey', showIf: r => ['draft', 'pending_approval', 'approved', 'sent'].includes(r.status), confirm: 'Withdraw this offer?' },
  ],
};

export const ONBOARDING_PAGE: PageConfig = {
  title: 'Pre-Onboarding & Visa',
  itemName: 'Onboarding Record',
  endpoint: API + 'offers/',
  model: 'visastep',
  defaultParams: { status: 'accepted,joined' },
  intro: 'Visa steps (MOHRE offer → work permit → entry / change of status → medical → Emirates ID → labour contract → visa stamping) and onboarding tasks. Create Employee copies the candidate and offer into Employee Master with salary components.',
  columns: [
    { key: 'candidate_name', label: 'Candidate' },
    { key: 'candidate_nationality', label: 'Nationality' },
    { key: 'position_title', label: 'Position' },
    { key: 'joining_date', label: 'Joining', type: 'date' },
    { key: 'visa', label: 'Visa steps', value: r => `${r.visa_progress?.done}/${r.visa_progress?.total}` },
    { key: 'onb', label: 'Onboarding', value: r => `${r.onboarding_progress?.done}/${r.onboarding_progress?.total}` },
    { key: 'employee', label: 'Employee' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: OFFER_STATUS },
  ],
  canCreate: false,
  canEdit: false,
  rowActions: [
    { label: 'Create employee', action: 'convert_to_employee', color: 'green', showIf: r => r.status === 'accepted' && !r.employee,
      prompt: [{ key: 'emp_code', label: 'Employee code (empty = next number)', type: 'text' },
               { key: 'ignore_open_steps', label: 'Open steps', type: 'checkbox', help: 'Create even if some visa steps are still open' }] },
  ],
  children: [
    {
      title: 'Visa steps', endpoint: API + 'visa-steps/', parentKey: 'offer',
      columns: [{ key: 'sequence', label: '#' }, { key: 'name', label: 'Step' }, { key: 'status', label: 'Status', type: 'tag', tagColors: { pending: 'grey', in_progress: 'blue', done: 'green', not_applicable: 'grey' } }, { key: 'step_date', label: 'Date', type: 'date' }, { key: 'cost', label: 'Cost (AED)', type: 'money' }],
      fields: [
        { key: 'sequence', label: '#', type: 'number', width: 2 },
        { key: 'name', label: 'Step', type: 'text', required: true, width: 10 },
        { key: 'status', label: 'Status', type: 'select', width: 4, options: opt([['pending', 'Pending'], ['in_progress', 'In progress'], ['done', 'Done'], ['not_applicable', 'Not applicable']]) },
        { key: 'step_date', label: 'Date', type: 'date', width: 4 },
        { key: 'cost', label: 'Cost (AED)', type: 'number', width: 4 },
        { key: 'remarks', label: 'Remarks', type: 'text', width: 12 },
      ],
      canDelete: () => true,
    },
    {
      title: 'Onboarding tasks', endpoint: API + 'onboarding-tasks/', parentKey: 'offer',
      columns: [{ key: 'team', label: 'Team' }, { key: 'title', label: 'Task' }, { key: 'owner', label: 'Owner' }, { key: 'due_date', label: 'Due', type: 'date' }, { key: 'is_done', label: 'Done', type: 'bool' }],
      fields: [
        { key: 'team', label: 'Team', type: 'select', width: 4, options: opt([['HR', 'HR'], ['IT', 'IT'], ['Admin', 'Admin'], ['Manager', 'Manager'], ['L&D', 'L&D'], ['Finance', 'Finance']]) },
        { key: 'title', label: 'Task', type: 'text', required: true, width: 8 },
        { key: 'owner', label: 'Owner', type: 'select', lookup: LOOKUPS.employees, width: 6 },
        { key: 'due_date', label: 'Due', type: 'date', width: 3 },
        { key: 'is_done', label: 'Done', type: 'checkbox', width: 3 },
      ],
      canDelete: () => true,
    },
  ],
};
