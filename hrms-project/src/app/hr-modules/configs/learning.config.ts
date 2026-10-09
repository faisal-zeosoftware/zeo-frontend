import { LOOKUPS } from '../module-api.service';
import { PageConfig } from '../page-config';
import { COURSE_EXTRA_CHILD, COURSE_MODULES_CHILD, COURSE_SKILLS_CHILD, SESSION_ATTENDANCE_CHILD, SESSION_COSTS_CHILD, SESSION_EXTRA_CHILD } from '../../learning-plus/learning-plus.config';

const API = '/learning/api/';
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const NEED_STATUS = { identified: 'grey', pending_approval: 'orange', planned: 'blue', nominated: 'cyan', completed: 'green', cancelled: 'grey' };
const PRIORITY = opt([['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical'], ['mandatory', 'Mandatory']]);
const SOURCE = opt([['appraisal', 'Appraisal'], ['pip', 'PIP'], ['manager', 'Manager request'], ['self', 'Self request'], ['new_joiner', 'New joiner'], ['compliance', 'Compliance / expiry'], ['hr', 'HR']]);
const COURSES = { endpoint: API + 'courses/', label: (r: any) => `${r.code} - ${r.title}`, params: { active: 'true' } };

export const NEEDS_PAGE: PageConfig = {
  title: 'Training Needs',
  itemName: 'Training Need',
  endpoint: API + 'needs/',
  model: 'trainingneed',
  intro: 'Needs come from appraisals (development needs), PIPs, new joiners, expiring certificates and manager / self requests.',
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'department', label: 'Dept' },
    { key: 'need', label: 'Need / skill gap' },
    { key: 'source', label: 'Source', type: 'tag', tagColors: { appraisal: 'blue', pip: 'red', manager: 'cyan', self: 'grey', new_joiner: 'orange', compliance: 'red', hr: 'grey' } },
    { key: 'priority', label: 'Priority' },
    { key: 'course', label: 'Suggested course' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: NEED_STATUS },
  ],
  filters: [
    { key: 'status', label: 'Status', options: Object.keys(NEED_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) },
    { key: 'source', label: 'Source', options: SOURCE },
  ],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', required: true, lookup: LOOKUPS.employees, width: 6 },
    { key: 'course', label: 'Suggested course', type: 'select', lookup: COURSES, width: 6 },
    { key: 'need', label: 'Need / skill gap', type: 'text', required: true, width: 12 },
    { key: 'source', label: 'Source', type: 'select', options: SOURCE, default: 'manager', width: 4 },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITY, default: 'medium', width: 4 },
    { key: 'status', label: 'Status', type: 'select', editOnly: true, width: 4, options: Object.keys(NEED_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) },
    { key: 'target_date', label: 'Target date', type: 'date', width: 4 },
    { key: 'notes', label: 'Notes', type: 'textarea', width: 12 },
  ],
  canDelete: r => r.status === 'identified' || r.status === 'pending_approval',
};

export const COURSE_PAGE: PageConfig = {
  title: 'Course Catalog',
  itemName: 'Course',
  endpoint: API + 'courses/',
  model: 'course',
  multipart: true,
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'title', label: 'Course' },
    { key: 'provider', label: 'Provider' },
    { key: 'mode', label: 'Mode' },
    { key: 'duration_hours', label: 'Hours' },
    { key: 'course_type', label: 'Type', type: 'tag', tagColors: { mandatory: 'red', mandatory_role: 'orange', optional: 'grey' } },
    { key: 'cost_per_head', label: 'Cost / head (AED)', type: 'money' },
    { key: 'certificate_validity_months', label: 'Validity (months)' },
  ],
  filters: [{ key: 'course_type', label: 'Type', options: opt([['mandatory', 'Mandatory'], ['mandatory_role', 'Mandatory (role)'], ['optional', 'Optional']]) }],
  fields: [
    { key: 'title', label: 'Course title', type: 'text', required: true, width: 8 },
    { key: 'course_type', label: 'Type', type: 'select', default: 'optional', width: 4, options: opt([['mandatory', 'Mandatory (all staff)'], ['mandatory_role', 'Mandatory (role)'], ['optional', 'Optional']]) },
    { key: 'provider', label: 'Provider (empty = internal)', type: 'text', width: 6 },
    { key: 'mode', label: 'Mode', type: 'select', default: 'internal_classroom', width: 6,
      options: opt([['internal_classroom', 'Internal - classroom'], ['internal_elearning', 'Internal - e-learning'], ['external_classroom', 'External - classroom'], ['external_online', 'External - online']]) },
    { key: 'duration_hours', label: 'Duration (hours)', type: 'number', default: 8, width: 3 },
    { key: 'cost_per_head', label: 'Cost per head (AED)', type: 'number', default: 0, width: 3 },
    { key: 'pass_mark', label: 'Pass mark %', type: 'number', default: 70, width: 3 },
    { key: 'certificate_validity_months', label: 'Certificate validity (months)', type: 'number', width: 3, help: 'Empty = never expires' },
    { key: 'target_audience', label: 'Target audience', type: 'text', width: 6 },
    { key: 'departments', label: 'Departments', type: 'multiselect', lookup: LOOKUPS.departments, width: 6 },
    { key: 'objectives', label: 'Objectives / content outline', type: 'textarea', width: 12 },
    { key: 'content_link', label: 'Content link (video, SCORM, LMS)', type: 'url', width: 6 },
    { key: 'content_file', label: 'Content file', type: 'file', width: 6 },
    { key: 'auto_assign_new_joiners', label: 'New joiners', type: 'checkbox', help: 'Assign automatically to every new joiner' },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
  // LearningPlus: category / provider / delivery, online modules, skills gained
  children: [COURSE_EXTRA_CHILD, COURSE_MODULES_CHILD, COURSE_SKILLS_CHILD],
};

const SESSION_STATUS = { draft: 'grey', published: 'blue', in_progress: 'cyan', completed: 'green', cancelled: 'red' };
const RESULT_COLUMNS = [
  { key: 'employee', label: 'Participant' }, { key: 'attended', label: 'Attended', type: 'bool' as const },
  { key: 'pre_test_score', label: 'Pre-test' }, { key: 'post_test_score', label: 'Post-test' },
  { key: 'passed', label: 'Result', value: (r: any) => (r.passed === null ? '–' : r.passed ? 'Passed' : 'Not passed') },
  { key: 'feedback_rating', label: 'Feedback', type: 'stars' as const },
];

export const SESSION_PAGE: PageConfig = {
  title: 'Training Calendar',
  itemName: 'Training Session',
  endpoint: API + 'sessions/',
  model: 'trainingsession',
  intro: 'Schedule sessions of catalog courses. Publish opens nominations; Close issues certificates to participants who passed.',
  columns: [
    { key: 'code', label: 'Session' },
    { key: 'course_title', label: 'Course' },
    { key: 'start_date', label: 'Start', type: 'date' },
    { key: 'end_date', label: 'End', type: 'date' },
    { key: 'trainer', label: 'Trainer', value: r => r.trainer_employee_display || r.trainer_external || '–' },
    { key: 'venue', label: 'Venue / link', value: r => r.venue || (r.online_link ? 'Online' : '–') },
    { key: 'seats', label: 'Seats', value: r => `${r.confirmed}/${r.seats}${r.waitlist ? ' (+' + r.waitlist + ' waitlist)' : ''}` },
    { key: 'effective_cost', label: 'Cost / head', type: 'money' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: SESSION_STATUS },
  ],
  filters: [
    { key: 'status', label: 'Status', options: Object.keys(SESSION_STATUS).map(k => ({ value: k, label: k.replace('_', ' ') })) },
    { key: 'course', label: 'Course', lookup: COURSES },
  ],
  fields: [
    { key: 'course', label: 'Course', type: 'select', required: true, lookup: COURSES, width: 12 },
    { key: 'start_date', label: 'Start date', type: 'date', required: true, width: 3 },
    { key: 'end_date', label: 'End date', type: 'date', required: true, width: 3 },
    { key: 'start_time', label: 'Start time', type: 'time', width: 3 },
    { key: 'end_time', label: 'End time', type: 'time', width: 3 },
    { key: 'trainer_employee', label: 'Internal trainer', type: 'select', lookup: LOOKUPS.employees, width: 6 },
    { key: 'trainer_external', label: 'External trainer / provider', type: 'text', width: 6 },
    { key: 'venue', label: 'Venue', type: 'text', width: 6 },
    { key: 'online_link', label: 'Online link', type: 'url', width: 6 },
    { key: 'seats', label: 'Seats', type: 'number', default: 20, width: 3 },
    { key: 'cost_per_head', label: 'Cost / head (empty = course cost)', type: 'number', width: 3 },
    { key: 'bond_threshold', label: 'Bond needed above (AED)', type: 'number', default: 1000, width: 3 },
    { key: 'nomination_deadline', label: 'Nomination deadline', type: 'date', width: 3 },
  ],
  canEdit: r => r.status === 'draft' || r.status === 'published',
  canDelete: r => r.status === 'draft',
  rowActions: [
    { label: 'Publish', action: 'publish', color: 'green', showIf: r => r.status === 'draft' },
    { label: 'Close', action: 'close', color: 'blue', showIf: r => r.status === 'published' || r.status === 'in_progress', confirm: 'Close the session and issue certificates to participants who passed?' },
    { label: 'Cancel', action: 'cancel', color: 'red', showIf: r => r.status === 'draft' || r.status === 'published', confirm: 'Cancel this session? All nominations are cancelled.' },
  ],
  children: [
    {
      title: 'Participants', endpoint: API + 'nominations/', parentKey: 'session',
      columns: [{ key: 'employee', label: 'Employee' }, { key: 'nominated_by', label: 'By' }, { key: 'seat_status', label: 'Seat', type: 'tag', tagColors: { confirmed: 'green', waitlist: 'orange', pending: 'grey', cancelled: 'red' } }, { key: 'bond_required', label: 'Bond', type: 'bool' }],
    },
    {
      title: 'Attendance & results', endpoint: API + 'results/', parentKey: 'session',
      columns: RESULT_COLUMNS,
    },
    // LearningPlus: trainer / provider / venue, cost lines, date-wise attendance (edit it in Attendance Sheet)
    SESSION_EXTRA_CHILD,
    SESSION_COSTS_CHILD,
    SESSION_ATTENDANCE_CHILD,
  ],
};

const SEAT = { pending: 'grey', confirmed: 'green', waitlist: 'orange', cancelled: 'red' };

export const NOMINATION_PAGE: PageConfig = {
  title: 'Nominations',
  itemName: 'Nomination',
  endpoint: API + 'nominations/',
  model: 'nomination',
  intro: 'Manager nominates (or the employee requests), manager → L&D approve. Seats confirm in order; extra people wait-list. Costly courses need the training bond accepted first.',
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'department', label: 'Dept' },
    { key: 'course_title', label: 'Course' },
    { key: 'session_date', label: 'Date', type: 'date' },
    { key: 'nominated_by', label: 'Nominated by' },
    { key: 'manager_status', label: 'Manager', type: 'tag', tagColors: { pending: 'orange', approved: 'green', rejected: 'red' } },
    { key: 'ld_status', label: 'L&D', type: 'tag', tagColors: { pending: 'orange', approved: 'green', rejected: 'red' } },
    { key: 'bond_state', label: 'Training bond', type: 'tag', tagColors: { not_required: 'grey', awaiting: 'orange', accepted: 'green' } },
    { key: 'seat_status', label: 'Seat', type: 'tag', tagColors: SEAT },
  ],
  filters: [
    { key: 'session', label: 'Session', lookup: { endpoint: API + 'sessions/', label: (r: any) => `${r.code} - ${r.course_title}` } },
    { key: 'seat_status', label: 'Seat', options: Object.keys(SEAT).map(k => ({ value: k, label: k })) },
  ],
  fields: [
    { key: 'session', label: 'Session', type: 'select', required: true, lookup: { endpoint: API + 'sessions/', label: (r: any) => `${r.code} - ${r.course_title} (${r.start_date})`, params: { status: 'published,draft' } }, width: 12 },
    { key: 'employee', label: 'Employee', type: 'select', required: true, lookup: LOOKUPS.employees, width: 6 },
    { key: 'need', label: 'For training need', type: 'select', lookup: { endpoint: API + 'needs/', label: (r: any) => `${r.employee_code || ''} ${r.need}`, params: { status: 'identified,planned' } }, width: 6 },
    { key: 'nominated_by', label: 'Nominated by', type: 'select', default: 'hr', width: 6, options: opt([['manager', 'Manager'], ['self', 'Self'], ['hr', 'HR / L&D']]) },
    { key: 'reason', label: 'Reason', type: 'text', width: 6 },
    { key: 'allow_leave_clash', label: 'Leave clash', type: 'checkbox', help: 'Nominate even if the employee has approved leave on those dates', width: 12 },
  ],
  canEdit: false,
  canDelete: r => r.seat_status !== 'confirmed',
  rowActions: [
    { label: 'Approve', action: 'approve', color: 'green', showIf: r => r.seat_status !== 'cancelled' && (r.manager_status === 'pending' || r.ld_status === 'pending') },
    { label: 'Reject', action: 'reject', color: 'red', showIf: r => r.seat_status !== 'cancelled' && r.seat_status !== 'confirmed', prompt: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] },
  ],
};

export const RESULT_PAGE: PageConfig = {
  title: 'Attendance & Assessment',
  itemName: 'Result',
  endpoint: API + 'results/',
  model: 'participantresult',
  intro: 'Record attendance, pre / post test and feedback per confirmed participant. Pass = attendance ≥ 80% and post-test ≥ course pass mark.',
  columns: RESULT_COLUMNS.concat([{ key: 'attendance_percent', label: 'Attendance %' } as any, { key: 'trainer_rating', label: 'Trainer rating', type: 'stars' } as any]),
  filters: [{ key: 'session', label: 'Session', lookup: { endpoint: API + 'sessions/', label: (r: any) => `${r.code} - ${r.course_title}` } }],
  fields: [
    { key: 'nomination', label: 'Participant', type: 'select', required: true, createOnly: true, width: 12,
      lookup: { endpoint: API + 'nominations/', label: (r: any) => `${r.employee_display} – ${r.course_title} (${r.session_date})`, params: { seat_status: 'confirmed' } } },
    { key: 'attended', label: 'Attended', type: 'checkbox', default: true, width: 4 },
    { key: 'attendance_percent', label: 'Attendance %', type: 'number', default: 100, width: 4 },
    { key: 'pre_test_score', label: 'Pre-test %', type: 'number', width: 4 },
    { key: 'post_test_score', label: 'Post-test %', type: 'number', width: 4 },
    { key: 'feedback_rating', label: 'Participant feedback (1-5)', type: 'number', width: 4 },
    { key: 'trainer_rating', label: 'Trainer rating (1-5)', type: 'number', width: 4 },
    { key: 'feedback_comment', label: 'Feedback comment', type: 'textarea', width: 12 },
  ],
  canDelete: true,
};

export const CERTIFICATE_PAGE: PageConfig = {
  title: 'Certificates',
  itemName: 'Certificate',
  endpoint: API + 'certificates/',
  model: 'certificate',
  multipart: true,
  intro: 'Issued automatically when a session is closed, or uploaded manually. Expiry scan creates renewal needs 60 days before expiry.',
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'title', label: 'Certificate' },
    { key: 'issued_by', label: 'Issued by' },
    { key: 'issued_on', label: 'Issued', type: 'date' },
    { key: 'expiry_date', label: 'Expiry', type: 'date' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: { valid: 'green', expiring: 'orange', expired: 'red', renewed: 'grey' } },
  ],
  filters: [{ key: 'status', label: 'Status', options: opt([['valid', 'Valid'], ['expiring', 'Expiring (60 days)'], ['expired', 'Expired'], ['renewed', 'Renewed (replaced)']]) }],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', required: true, lookup: LOOKUPS.employees, width: 6 },
    { key: 'course', label: 'Course', type: 'select', lookup: COURSES, width: 6 },
    { key: 'title', label: 'Certificate title', type: 'text', required: true, width: 8 },
    { key: 'certificate_number', label: 'Certificate no.', type: 'text', width: 4 },
    { key: 'issued_by', label: 'Issued by', type: 'text', width: 4 },
    { key: 'issued_on', label: 'Issued on', type: 'date', required: true, width: 4 },
    { key: 'expiry_date', label: 'Expiry date', type: 'date', width: 4 },
    { key: 'file', label: 'Certificate file', type: 'file', width: 12 },
  ],
  canDelete: true,
  toolbarActions: [{ label: 'Expiry scan', icon: 'notifications', action: 'expiry_scan', color: 'orange', body: () => ({ days: 60 }) }],
};

const BOND_STATUS = { pending: 'orange', active: 'blue', completed: 'green', recovered: 'cyan', waived: 'grey' };

export const BOND_PAGE: PageConfig = {
  title: 'Training Bonds',
  itemName: 'Training Bond',
  endpoint: API + 'bonds/',
  model: 'trainingbond',
  intro: 'Created when L&D approves a nomination above the bond threshold. If the employee leaves early, the recoverable amount is deducted in the final settlement.',
  columns: [
    { key: 'employee', label: 'Employee' },
    { key: 'course', label: 'Course' },
    { key: 'amount', label: 'Amount (AED)', type: 'money' },
    { key: 'start_date', label: 'From', type: 'date' },
    { key: 'schedule', label: 'Recovery', value: r => (r.schedule || []).map((s: any) => `<${s.months}m: ${s.percent}%`).join(' · ') },
    { key: 'recoverable_today', label: 'Recoverable today', type: 'money' },
    { key: 'accepted_on', label: 'Accepted', type: 'date' },
    { key: 'status', label: 'Status', type: 'tag', tagColors: BOND_STATUS },
  ],
  filters: [{ key: 'status', label: 'Status', options: Object.keys(BOND_STATUS).map(k => ({ value: k, label: k })) }],
  fields: [
    { key: 'employee', label: 'Employee', type: 'select', required: true, lookup: LOOKUPS.employees, width: 6 },
    { key: 'course', label: 'Course', type: 'select', lookup: COURSES, width: 6 },
    { key: 'amount', label: 'Amount (AED)', type: 'number', required: true, width: 4 },
    { key: 'start_date', label: 'Bond start', type: 'date', required: true, width: 4 },
    { key: 'status', label: 'Status', type: 'select', default: 'pending', width: 4, options: Object.keys(BOND_STATUS).map(k => ({ value: k, label: k })) },
    { key: 'schedule', label: 'Recovery schedule (JSON)', type: 'json', width: 12, default: '[{"months": 12, "percent": 100}, {"months": 18, "percent": 50}]', help: 'Leaving within N months repays percent of the amount' },
    { key: 'notes', label: 'Notes', type: 'text', width: 12 },
  ],
  rowActions: [
    { label: 'Accept bond', action: 'accept', color: 'green', showIf: r => r.status === 'pending', confirm: 'Accept the training bond terms?' },
  ],
};

export const LEARNING_REPORT_PAGE: PageConfig = {
  title: 'Learning Reports',
  itemName: 'Session',
  endpoint: API + 'sessions/',
  model: 'trainingsession',
  defaultParams: { status: 'completed' },
  intro: 'Completed sessions with pass rate and feedback. Use Export from the browser print dialog or the tables in each page.',
  stats: {
    endpoint: API + 'sessions/summary/',
    tiles: [
      { key: 'needs_open', label: 'Open training needs' }, { key: 'sessions_upcoming', label: 'Upcoming sessions' },
      { key: 'sessions_completed', label: 'Completed sessions' }, { key: 'pass_rate', label: 'Pass rate', format: 'percent', color: '#2e7d4f' },
      { key: 'certificates_valid', label: 'Valid certificates', color: '#2e7d4f' }, { key: 'certificates_expiring', label: 'Expiring (60 days)', color: '#a0610a' },
      { key: 'certificates_expired', label: 'Expired', color: '#b3263a' }, { key: 'bonds_active', label: 'Active bonds' },
      { key: 'training_cost', label: 'Training cost (completed)', format: 'money' },
    ],
  },
  columns: SESSION_PAGE.columns,
  canCreate: false,
  canEdit: false,
  children: SESSION_PAGE.children,
};
