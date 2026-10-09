import { LOOKUPS } from '../hr-modules/module-api.service';
import { ChildConfig, PageConfig } from '../hr-modules/page-config';

/** LearningPlus pages (backend app LearningPlus, mounted at /learning/plus/api/). */
export const LP_API = '/learning/plus/api/';
const LM_API = '/learning/api/';
const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const COURSES = { endpoint: LM_API + 'courses/', label: (r: any) => `${r.code} - ${r.title}` };
const SESSIONS = { endpoint: LM_API + 'sessions/', label: (r: any) => `${r.code} - ${r.course_title} (${r.start_date})` };
const CATEGORIES = { endpoint: LP_API + 'categories/', label: (r: any) => `${r.code} - ${r.name}`, params: { active: 'true' } };
const PROVIDERS = { endpoint: LP_API + 'providers/', label: 'name', params: { active: 'true' } };
const TRAINERS = { endpoint: LP_API + 'trainers/', label: (r: any) => `${r.name} (${r.trainer_type})`, params: { active: 'true' } };
const VENUES = { endpoint: LP_API + 'venues/', label: 'name', params: { active: 'true' } };
const SKILLS = { endpoint: LP_API + 'skills/', label: (r: any) => (r.category ? `${r.category} · ${r.name}` : r.name), params: { active: 'true' } };
const LEVELS = ['Awareness', 'Basic', 'Intermediate', 'Advanced', 'Expert'].map((l, i) => ({ value: i + 1, label: `${i + 1} - ${l}` }));
const levelDots = (n: any) => (n ? '●'.repeat(+n) + '○'.repeat(5 - +n) : '–');
const ACTIVE = { key: 'is_active', label: 'Active', type: 'bool' as const };

export const CATEGORY_PAGE: PageConfig = {
  title: 'Training Categories', itemName: 'Category', endpoint: LP_API + 'categories/', model: 'course',
  intro: 'Training types used to group the course catalog (e.g. HSE, Compliance, Technical, Soft skills).',
  columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Category' }, { key: 'description', label: 'Description' }, ACTIVE],
  fields: [
    { key: 'name', label: 'Name', type: 'text', required: true, width: 8 },
    { key: 'code', label: 'Code', type: 'text', required: true, width: 4 },
    { key: 'description', label: 'Description', type: 'textarea', width: 12 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const PROVIDER_PAGE: PageConfig = {
  title: 'Training Providers', itemName: 'Provider', endpoint: LP_API + 'providers/', model: 'course',
  intro: 'External institutes and consultants. TRN is the 15-digit UAE VAT number on their tax invoices.',
  columns: [
    { key: 'name', label: 'Provider' }, { key: 'contact_person', label: 'Contact' }, { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' }, { key: 'trn', label: 'TRN' }, { key: 'accreditation', label: 'Accreditation' },
    { key: 'contract_expiry', label: 'Contract expiry', type: 'date' }, ACTIVE,
  ],
  fields: [
    { key: 'name', label: 'Provider name', type: 'text', required: true, width: 8 },
    { key: 'contact_person', label: 'Contact person', type: 'text', width: 4 },
    { key: 'email', label: 'Email', type: 'email', width: 4 },
    { key: 'phone', label: 'Phone', type: 'text', width: 4 },
    { key: 'trn', label: 'TRN (15 digits)', type: 'text', width: 4 },
    { key: 'website', label: 'Website', type: 'url', width: 6 },
    { key: 'accreditation', label: 'Accreditation', type: 'text', width: 6, placeholder: 'KHDA, DCD, CIPD …' },
    { key: 'contract_expiry', label: 'Contract expiry', type: 'date', width: 4 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const TRAINER_PAGE: PageConfig = {
  title: 'Trainers', itemName: 'Trainer', endpoint: LP_API + 'trainers/', model: 'course',
  intro: 'Internal trainers (employees) and external trainers. The rating is the average trainer rating given by participants of their sessions.',
  columns: [
    { key: 'name', label: 'Trainer' }, { key: 'trainer_type', label: 'Type', type: 'tag', tagColors: { internal: 'blue', external: 'cyan' } },
    { key: 'provider_display', label: 'Provider' }, { key: 'expertise', label: 'Expertise' },
    { key: 'rate_per_day', label: 'Rate / day', type: 'money' }, { key: 'rate_per_hour', label: 'Rate / hour', type: 'money' },
    { key: 'sessions_count', label: 'Sessions' }, { key: 'avg_rating', label: 'Rating', type: 'stars' }, ACTIVE,
  ],
  filters: [{ key: 'type', label: 'Type', options: opt([['internal', 'Internal'], ['external', 'External']]) }, { key: 'provider', label: 'Provider', lookup: PROVIDERS }],
  fields: [
    { key: 'trainer_type', label: 'Type', type: 'select', default: 'external', width: 4, options: opt([['internal', 'Internal (employee)'], ['external', 'External']]) },
    { key: 'employee_id', label: 'Employee', type: 'select', lookup: LOOKUPS.employees, width: 8, showIf: m => m.trainer_type === 'internal' },
    { key: 'name', label: 'Trainer name', type: 'text', width: 8, showIf: m => m.trainer_type !== 'internal' },
    { key: 'provider', label: 'Provider', type: 'select', lookup: PROVIDERS, width: 6 },
    { key: 'expertise', label: 'Expertise', type: 'text', width: 6 },
    { key: 'email', label: 'Email', type: 'email', width: 6 },
    { key: 'phone', label: 'Phone', type: 'text', width: 6 },
    { key: 'rate_per_hour', label: 'Rate per hour (AED)', type: 'number', width: 4 },
    { key: 'rate_per_day', label: 'Rate per day (AED)', type: 'number', width: 4 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 4 },
  ],
  canDelete: true,
};

export const VENUE_PAGE: PageConfig = {
  title: 'Training Venues', itemName: 'Venue', endpoint: LP_API + 'venues/', model: 'course',
  columns: [{ key: 'name', label: 'Venue' }, { key: 'location', label: 'Location' }, { key: 'capacity', label: 'Capacity' }, { key: 'cost_per_day', label: 'Cost / day', type: 'money' }, ACTIVE],
  fields: [
    { key: 'name', label: 'Venue', type: 'text', required: true, width: 6 }, { key: 'location', label: 'Location', type: 'text', width: 6 },
    { key: 'capacity', label: 'Capacity', type: 'number', width: 4 }, { key: 'cost_per_day', label: 'Cost per day (AED)', type: 'number', default: 0, width: 4 },
    { key: 'is_active', label: 'Active', type: 'checkbox', default: true, width: 4 },
  ],
  canDelete: true,
};

export const SKILL_PAGE: PageConfig = {
  title: 'Skills', itemName: 'Skill', endpoint: LP_API + 'skills/', model: 'course',
  intro: 'Skill library. Levels use a 1-5 scale (Awareness → Expert). Link skills to courses (Course Catalog → Skills gained) and to designations (Role Skills).',
  columns: [{ key: 'name', label: 'Skill' }, { key: 'category', label: 'Category' }, { key: 'description', label: 'Description' }, ACTIVE],
  fields: [
    { key: 'name', label: 'Skill', type: 'text', required: true, width: 8 }, { key: 'category', label: 'Category', type: 'text', width: 4, placeholder: 'Technical, Safety …' },
    { key: 'description', label: 'Description', type: 'textarea', width: 12 }, { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
  ],
  canDelete: true,
};

export const ROLE_SKILL_PAGE: PageConfig = {
  title: 'Role Skills', itemName: 'Role Skill', endpoint: LP_API + 'role-skills/', model: 'course',
  intro: 'Required level of each skill per designation. The skill matrix shows the gap between an employee\'s level and this requirement.',
  columns: [{ key: 'designation_display', label: 'Designation' }, { key: 'skill_display', label: 'Skill' }, { key: 'required_level', label: 'Required level', value: r => levelDots(r.required_level) }],
  filters: [{ key: 'designation', label: 'Designation', lookup: LOOKUPS.designations }, { key: 'skill', label: 'Skill', lookup: SKILLS }],
  fields: [
    { key: 'designation_id', label: 'Designation', type: 'select', required: true, lookup: LOOKUPS.designations, width: 6 },
    { key: 'skill', label: 'Skill', type: 'select', required: true, lookup: SKILLS, width: 6 },
    { key: 'required_level', label: 'Required level', type: 'select', options: LEVELS, default: 3, width: 6 },
  ],
  canDelete: true,
};

export const EMPLOYEE_SKILL_PAGE: PageConfig = {
  title: 'Employee Skills', itemName: 'Employee Skill', endpoint: LP_API + 'employee-skills/',
  intro: 'Updated automatically when someone passes a course that gives a skill. HR and managers can record levels (verified); employees can add a self-assessment.',
  columns: [
    { key: 'employee_display', label: 'Employee' }, { key: 'skill_display', label: 'Skill' }, { key: 'level', label: 'Level', value: r => levelDots(r.level) },
    { key: 'source', label: 'Source', type: 'tag', tagColors: { course: 'green', online: 'cyan', manual: 'grey', appraisal: 'blue' } },
    { key: 'source_ref', label: 'Reference' }, { key: 'verified_by', label: 'Verified', value: r => (r.verified_by ? 'Yes' : 'Self') }, { key: 'date', label: 'Date', type: 'date' },
  ],
  filters: [{ key: 'skill', label: 'Skill', lookup: SKILLS }, { key: 'source', label: 'Source', options: opt([['course', 'Course'], ['online', 'Online'], ['manual', 'Manual'], ['appraisal', 'Appraisal']]) }],
  fields: [
    { key: 'employee_id', label: 'Employee', type: 'select', required: true, lookup: LOOKUPS.employees, width: 6 },
    { key: 'skill', label: 'Skill', type: 'select', required: true, lookup: SKILLS, width: 6 },
    { key: 'level', label: 'Level', type: 'select', options: LEVELS, default: 2, width: 4 },
    { key: 'source', label: 'Source', type: 'select', default: 'manual', width: 4, options: opt([['manual', 'Manual'], ['appraisal', 'Appraisal'], ['course', 'Course passed']]) },
    { key: 'date', label: 'Assessed on', type: 'date', width: 4 },
    { key: 'source_ref', label: 'Reference', type: 'text', width: 12 },
  ],
  canDelete: true,
};

export const BUDGET_PAGE: PageConfig = {
  title: 'Training Budgets', itemName: 'Budget', endpoint: LP_API + 'budgets/', model: 'trainingsession',
  intro: 'Yearly training budget per department; leave department empty for the company-wide budget. See Budget vs Actual for spend.',
  columns: [{ key: 'year', label: 'Year' }, { key: 'department_display', label: 'Department', value: r => r.department_display || 'Company (all)' }, { key: 'amount', label: 'Budget (AED)', type: 'money' }, { key: 'notes', label: 'Notes' }],
  filters: [{ key: 'year', label: 'Year', options: [0, 1, 2].map(i => { const y = new Date().getFullYear() + 1 - i; return { value: String(y), label: String(y) }; }) }],
  fields: [
    { key: 'year', label: 'Year', type: 'number', required: true, default: new Date().getFullYear(), width: 3 },
    { key: 'department_id', label: 'Department (empty = company)', type: 'select', lookup: LOOKUPS.departments, width: 5 },
    { key: 'amount', label: 'Amount (AED)', type: 'number', required: true, width: 4 },
    { key: 'notes', label: 'Notes', type: 'text', width: 12 },
  ],
  canDelete: true,
};

export const SESSION_COST_PAGE: PageConfig = {
  title: 'Session Costs', itemName: 'Cost line', endpoint: LP_API + 'session-costs/', model: 'trainingsession',
  intro: 'Trainer fees, venue, material and travel per session. Shared across confirmed participants in the per-employee cost.',
  columns: [{ key: 'session_display', label: 'Session' }, { key: 'kind', label: 'Type' }, { key: 'description', label: 'Description' }, { key: 'invoice_ref', label: 'Invoice' }, { key: 'amount', label: 'Amount (AED)', type: 'money' }],
  filters: [{ key: 'session_id', label: 'Session', lookup: SESSIONS }],
  fields: [
    { key: 'session_id', label: 'Session', type: 'select', required: true, lookup: SESSIONS, width: 12 },
    { key: 'kind', label: 'Type', type: 'select', default: 'trainer_fee', width: 4, options: opt([['trainer_fee', 'Trainer fee'], ['venue', 'Venue'], ['material', 'Material'], ['travel', 'Travel'], ['other', 'Other']]) },
    { key: 'amount', label: 'Amount (AED)', type: 'number', required: true, width: 4 },
    { key: 'invoice_ref', label: 'Invoice ref', type: 'text', width: 4 },
    { key: 'description', label: 'Description', type: 'text', width: 12 },
  ],
  canDelete: true,
};

// ------------------------------------------------------------------ children for the existing Course / Session pages
const MODULE_FIELDS = [
  { key: 'title', label: 'Module title', type: 'text' as const, required: true, width: 8 },
  { key: 'order', label: 'Order', type: 'number' as const, default: 1, width: 4 },
  { key: 'content_type', label: 'Content', type: 'select' as const, default: 'video', width: 4, options: opt([['video', 'Video'], ['document', 'Document'], ['link', 'Link'], ['quiz', 'Quiz']]) },
  { key: 'duration_minutes', label: 'Minutes', type: 'number' as const, default: 10, width: 4 },
  { key: 'pass_mark', label: 'Quiz pass mark %', type: 'number' as const, width: 4, showIf: (m: any) => m.content_type === 'quiz' },
  { key: 'url', label: 'URL (video / document / link / quiz form)', type: 'url' as const, width: 12 },
  { key: 'file', label: 'File', type: 'file' as const, width: 12 },
  { key: 'is_active', label: 'Active', type: 'checkbox' as const, default: true },
];

export const COURSE_MODULES_CHILD: ChildConfig = {
  title: 'Online modules', endpoint: LP_API + 'modules/', parentKey: 'course_id',
  columns: [{ key: 'order', label: '#' }, { key: 'title', label: 'Module' }, { key: 'content_type', label: 'Type', type: 'tag', tagColors: { video: 'blue', document: 'grey', link: 'cyan', quiz: 'orange' } }, { key: 'duration_minutes', label: 'Min' }],
  fields: MODULE_FIELDS,
  canAdd: () => true, canEdit: () => true, canDelete: () => true,
};

export const COURSE_SKILLS_CHILD: ChildConfig = {
  title: 'Skills gained', endpoint: LP_API + 'course-skills/', parentKey: 'course_id',
  columns: [{ key: 'skill_display', label: 'Skill' }, { key: 'level_gained', label: 'Level', value: r => levelDots(r.level_gained) }],
  fields: [{ key: 'skill', label: 'Skill', type: 'select', required: true, lookup: SKILLS, width: 8 }, { key: 'level_gained', label: 'Level gained', type: 'select', options: LEVELS, default: 2, width: 4 }],
  canAdd: () => true, canDelete: () => true,
};

export const COURSE_EXTRA_CHILD: ChildConfig = {
  title: 'Category & delivery', endpoint: LP_API + 'course-extras/', parentKey: 'course_id',
  columns: [{ key: 'category_display', label: 'Category' }, { key: 'provider_display', label: 'Provider' }, { key: 'delivery_label', label: 'Delivery' }, { key: 'language', label: 'Language' }, { key: 'level_label', label: 'Level' }],
  fields: [
    { key: 'category', label: 'Category', type: 'select', lookup: CATEGORIES, width: 6 },
    { key: 'provider', label: 'Provider', type: 'select', lookup: PROVIDERS, width: 6 },
    { key: 'delivery', label: 'Delivery', type: 'select', default: 'classroom', width: 4, options: opt([['classroom', 'Classroom'], ['online', 'Online'], ['blended', 'Blended']]) },
    { key: 'language', label: 'Language', type: 'text', default: 'English', width: 4 },
    { key: 'level', label: 'Level', type: 'select', default: 'beginner', width: 4, options: opt([['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['expert', 'Expert']]) },
  ],
  canAdd: (_p: any) => true, canEdit: () => true, canDelete: () => true,
};

export const SESSION_COSTS_CHILD: ChildConfig = {
  title: 'Cost lines', endpoint: LP_API + 'session-costs/', parentKey: 'session_id',
  columns: SESSION_COST_PAGE.columns.filter(c => c.key !== 'session_display'),
  fields: (SESSION_COST_PAGE.fields || []).filter(f => f.key !== 'session_id'),
  canAdd: p => p.status !== 'cancelled', canEdit: () => true, canDelete: () => true,
};

export const SESSION_EXTRA_CHILD: ChildConfig = {
  title: 'Trainer, provider & venue', endpoint: LP_API + 'session-extras/', parentKey: 'session_id',
  columns: [{ key: 'trainer_display', label: 'Trainer' }, { key: 'provider_display', label: 'Provider' }, { key: 'venue_display', label: 'Venue' }, { key: 'other_costs', label: 'Other costs', type: 'money' }],
  fields: [
    { key: 'trainer', label: 'Trainer', type: 'select', lookup: TRAINERS, width: 6 },
    { key: 'provider', label: 'Provider', type: 'select', lookup: PROVIDERS, width: 6 },
    { key: 'venue', label: 'Venue', type: 'select', lookup: VENUES, width: 6 },
    { key: 'other_costs', label: 'Other costs (AED, lump sum)', type: 'number', default: 0, width: 6 },
    { key: 'notes', label: 'Notes', type: 'text', width: 12 },
  ],
  canAdd: () => true, canEdit: () => true, canDelete: () => true,
};

export const SESSION_ATTENDANCE_CHILD: ChildConfig = {
  title: 'Date-wise attendance', endpoint: LP_API + 'attendance/', parentKey: 'session_id',
  columns: [{ key: 'date', label: 'Date', type: 'date' }, { key: 'nomination_display', label: 'Participant' }, { key: 'present', label: 'Present', type: 'bool' }, { key: 'hours', label: 'Hours' }],
  canAdd: () => false,
};
