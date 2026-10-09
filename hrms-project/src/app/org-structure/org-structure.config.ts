import { LOOKUPS } from '../hr-modules/module-api.service';
import { Lookup, PageConfig } from '../hr-modules/page-config';

/**
 * v1.12.0 – setup pages of the organisation structure, rendered by the shared CrudPageComponent.
 * Buttons follow the department rights (add_/change_/delete_dept_master or company admin); the server also accepts
 * the masters' own permissions.
 */
const API = '/org-structure/api/';
const MODEL = 'dept_master';
const BRANCHES = { key: 'branch_ids', label: 'Branches (empty = all branches)', type: 'multiselect' as const, lookup: LOOKUPS.branches, width: 12,
  help: 'Like departments: the branches that use it. Branch HR must pick at least one of their own branches.' };
const EMPLOYEES: Lookup = { endpoint: '/tools/api/directory/', label: (r: any) => `${r.name} (${r.code})` };
const COUNTRIES: Lookup = { endpoint: '/core/api/Country/', label: 'country_name' };
const ACTIVE = { key: 'active', label: 'Active', type: 'checkbox' as const, default: true, help: 'Inactive ones cannot be given to employees any more' };
const CODE_NAME = (name = 'Name') => [
  { key: 'name', label: name, type: 'text' as const, required: true, width: 8 },
  { key: 'code', label: 'Code', type: 'text' as const, required: true, width: 4, placeholder: 'Unique, used by imports' },
];
const DESC = { key: 'description', label: 'Description', type: 'textarea' as const, width: 12 };
const COMMON_COLS = [
  { key: 'branch_names', label: 'Branches' },
  { key: 'employees', label: 'Employees', type: 'number' as const },
  { key: 'active', label: 'Active', type: 'bool' as const },
];

export const LOCATION_PAGE: PageConfig = {
  title: 'Locations', itemName: 'Location', endpoint: API + 'locations/', model: MODEL,
  intro: 'Work sites, offices, yards or camps where employees work – separate from the legal branch. Shown on the employee form, list, filters and reports once Locations are switched on in Organisation settings.',
  columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Location' }, { key: 'city', label: 'City' }, { key: 'country_name', label: 'Country' }, ...COMMON_COLS],
  searchKeys: ['code', 'name', 'city', 'address'],
  fields: [
    ...CODE_NAME('Location name'),
    { key: 'address', label: 'Address', type: 'textarea', width: 12 },
    { key: 'city', label: 'City / emirate', type: 'text', width: 6 },
    { key: 'country_id', label: 'Country', type: 'select', lookup: COUNTRIES, width: 6 },
    { key: 'latitude', label: 'Latitude (optional)', type: 'number', width: 6, placeholder: 'e.g. 25.3463' },
    { key: 'longitude', label: 'Longitude (optional)', type: 'number', width: 6, placeholder: 'e.g. 55.4209' },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
  emptyText: 'No locations yet – add the sites your employees work at.',
};

export const DIVISION_PAGE: PageConfig = {
  title: 'Divisions', itemName: 'Division', endpoint: API + 'divisions/', model: MODEL,
  intro: 'A division groups departments (for example Technology = IT + Finance). An employee’s division comes from their department; a department belongs to one division only.',
  columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Division' }, { key: 'department_list', label: 'Departments' }, { key: 'head_name', label: 'Head' }, ...COMMON_COLS],
  searchKeys: ['code', 'name', 'department_list'],
  fields: [
    ...CODE_NAME('Division name'),
    { key: 'department_ids', label: 'Departments in this division', type: 'multiselect', lookup: LOOKUPS.departments, width: 12,
      help: 'Employees of these departments get this division automatically' },
    { key: 'head_employee_id', label: 'Head of division', type: 'select', lookup: EMPLOYEES, width: 12 },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
};

export const SECTION_PAGE: PageConfig = {
  title: 'Sections', itemName: 'Section', endpoint: API + 'sections/', model: MODEL,
  intro: 'Sections (units) inside a department. An employee can only be in a section of their own department.',
  columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Section' }, { key: 'department_name', label: 'Department' }, ...COMMON_COLS],
  filters: [{ key: 'department', label: 'Department', lookup: LOOKUPS.departments }],
  searchKeys: ['code', 'name', 'department_name'],
  fields: [
    ...CODE_NAME('Section name'),
    { key: 'department_id', label: 'Department', type: 'select', lookup: LOOKUPS.departments, required: true, width: 6 },
    { key: 'head_employee_id', label: 'Section head', type: 'select', lookup: EMPLOYEES, width: 6 },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
};

export const COST_CENTER_ORG_PAGE: PageConfig = {
  title: 'Cost centres', itemName: 'Cost centre', endpoint: API + 'cost-centers/', model: MODEL,
  intro: 'Cost centres for employees, payroll cost and expenses. They are kept in step with Expense management, so expense claims can pick the same cost centres.',
  columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Cost centre' }, { key: 'department_name', label: 'Department' }, { key: 'manager_name', label: 'Manager' }, ...COMMON_COLS],
  searchKeys: ['code', 'name', 'department_name', 'manager_name'],
  fields: [
    ...CODE_NAME('Cost centre name'),
    { key: 'department_id', label: 'Department (optional)', type: 'select', lookup: LOOKUPS.departments, width: 6, help: 'Set it to allow only employees of this department' },
    { key: 'manager_id', label: 'Manager', type: 'select', lookup: EMPLOYEES, width: 6 },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
};

export const GRADE_PAGE: PageConfig = {
  title: 'Grades', itemName: 'Grade', endpoint: API + 'grades/', model: MODEL,
  intro: 'Pay grades with a salary band. Link designations to allow a grade only for them (empty = any designation).',
  columns: [
    { key: 'level', label: 'Level', type: 'number' }, { key: 'code', label: 'Code' }, { key: 'name', label: 'Grade' },
    { key: 'salary_min', label: 'Salary from', type: 'money' }, { key: 'salary_max', label: 'Salary to', type: 'money' }, { key: 'currency', label: 'Currency' },
    { key: 'designation_names', label: 'Designations' }, ...COMMON_COLS,
  ],
  searchKeys: ['code', 'name', 'designation_names'],
  fields: [
    ...CODE_NAME('Grade name'),
    { key: 'level', label: 'Level (1 = lowest)', type: 'number', default: 1, required: true, width: 4 },
    { key: 'salary_min', label: 'Monthly salary from', type: 'number', width: 4 },
    { key: 'salary_max', label: 'Monthly salary to', type: 'number', width: 4 },
    { key: 'currency', label: 'Currency', type: 'text', default: 'AED', width: 4 },
    { key: 'designation_ids', label: 'Allowed designations (empty = any)', type: 'multiselect', lookup: LOOKUPS.designations, width: 8 },
    { key: 'benefits', label: 'Benefits', type: 'textarea', width: 12, placeholder: 'e.g. Air ticket every year, medical category A, car allowance' },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
};

export const POSITION_PAGE: PageConfig = {
  title: 'Job positions', itemName: 'Job position', endpoint: API + 'positions/', model: MODEL,
  intro: 'Budgeted positions with the number of people planned. Filled is counted from the employees in the position; recruitment can use the vacant ones.',
  columns: [
    { key: 'code', label: 'Code' }, { key: 'name', label: 'Position' }, { key: 'department_name', label: 'Department' }, { key: 'designation_name', label: 'Designation' },
    { key: 'grade_name', label: 'Grade' }, { key: 'reports_to_name', label: 'Reports to' }, { key: 'headcount_budget', label: 'Budget', type: 'number' },
    { key: 'filled', label: 'Filled', type: 'number' }, { key: 'vacancies', label: 'Vacant', type: 'number' },
    { key: 'open_requisitions', label: 'Open requisitions', type: 'number' }, { key: 'active', label: 'Active', type: 'bool' },
  ],
  rowActions: [{ label: 'Raise requisition', icon: 'person_add', action: 'requisition', color: 'blue',
    showIf: (r: any) => r.vacancies > 0 && !r.open_requisitions && r.active,
    confirm: 'Raise a draft manpower requisition in Recruitment for the vacancies of this position? You can complete and submit it there.' }],
  filters: [{ key: 'department', label: 'Department', lookup: LOOKUPS.departments }, { key: 'vacant', label: 'Vacancies', options: [{ value: '1', label: 'Only with vacancies' }] }],
  searchKeys: ['code', 'name', 'department_name', 'designation_name'],
  fields: [
    ...CODE_NAME('Position title'),
    { key: 'department_id', label: 'Department', type: 'select', lookup: LOOKUPS.departments, width: 6 },
    { key: 'designation_id', label: 'Designation', type: 'select', lookup: LOOKUPS.designations, width: 6 },
    { key: 'grade', label: 'Grade', type: 'select', lookup: { endpoint: API + 'grades/', label: (r: any) => `${r.name} (${r.code})`, params: { active: '1' } }, width: 6 },
    { key: 'reports_to', label: 'Reports to (position)', type: 'select', lookup: { endpoint: API + 'positions/', label: (r: any) => `${r.name} (${r.code})`, params: { active: '1' } }, width: 6,
      help: 'Builds the position hierarchy; loops are refused' },
    { key: 'headcount_budget', label: 'Headcount budget', type: 'number', default: 1, width: 6 },
    BRANCHES, DESC, ACTIVE,
  ],
  canDelete: true,
};

export const EMPLOYMENT_TYPE_PAGE: PageConfig = {
  title: 'Employment types', itemName: 'Employment type', endpoint: API + 'employment-types/', model: MODEL,
  intro: 'Full time, part time, contract, temporary, intern … with the default probation and whether the service counts for gratuity.',
  columns: [
    { key: 'code', label: 'Code' }, { key: 'name', label: 'Employment type' }, { key: 'probation_days', label: 'Probation (days)', type: 'number' },
    { key: 'counts_for_gratuity', label: 'Gratuity', type: 'bool' }, { key: 'has_end_date', label: 'Has end date', type: 'bool' }, ...COMMON_COLS,
  ],
  fields: [
    ...CODE_NAME('Employment type'),
    { key: 'probation_days', label: 'Default probation (days)', type: 'number', default: 0, width: 6 },
    { key: 'counts_for_gratuity', label: 'Gratuity', type: 'checkbox', default: true, width: 6, help: 'Service counts for end-of-service gratuity' },
    { key: 'has_end_date', label: 'Contract end date', type: 'checkbox', default: false, width: 6, help: 'Ask for the contract end date (fixed term / temporary)' },
    BRANCHES, DESC, ACTIVE,
  ],
  toolbarActions: [{ label: 'Load standard types', icon: 'playlist_add', action: 'load-standard', color: 'blue',
    confirm: 'Add the standard types (Full time, Part time, Contract, Temporary, Intern) that are missing? Existing ones are not changed.' }],
  canDelete: true,
};
