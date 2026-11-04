// v1.62.10 (item 174)
/**
 * v1.62.10 (item 174) – the 10 approval-workflow kinds of the shared "Approval levels" and "Escalation" screens
 * (ap62-levels.component.ts, ap62-escalation.component.ts). One entry per request type: its workflow API (nested `levels`),
 * the type it is set per (request / document / leave / loan / asset type, or none), the users who can approve, whether
 * its levels have a role and escalation fields, and the permission models of the old screens. The bodies the screens send
 * are the ones the old pop-ups sent (see body() in ap62-levels.component.ts); every server rule stays as it is.
 */

export interface Ap62Type {
  field: 'request_type' | 'asset_type' | 'loan_type';   // the workflow's type field (an id is sent, the list answers the name)
  label: string;                                        // "Request type"
  endpoint: string;                                     // the type list
  name: (r: any) => string;                             // the name the workflow list answers
  option?: (r: any) => string;                          // the option text (default: name)
  idField?: string;                                     // the list answers the id itself (leave: request_type_id)
}

export interface Ap62Kind {
  key: string;
  title: string;            // screen title
  desc: string;             // line under the title
  where: string;            // "general requests" – used in texts
  model: string;            // permission model of the levels screen (view_<model> …)
  endpoint: string;         // workflows with nested levels
  type?: Ap62Type;
  users: string;            // who can be chosen as approver
  role: boolean;            // the level has a role field
  roleRequired: boolean;    // the old pop-up refused a level without a role
  esc: boolean;             // the levels have escalation fields (escalate_to, after days / hours / minutes)
  comp?: boolean;           // leave: "for compensatory leave" (no leave type – the server picks the compensatory one)
  levelsRoute: string;      // address of the levels screen (under /main-sidebar/)
  escalation?: { endpoint: string; model: string; route: string; title: string; desc: string };
}

const U = '/users/tenant-users/';

export const AP62_KINDS: Record<string, Ap62Kind> = {
  general: {
    key: 'general', title: 'Request approval levels', where: 'general requests',
    desc: 'Who approves each type of general request, level by level, for the branches you choose. "Reporting manager" sends a request to the employee\'s reporting manager; "No approval" approves it at once.',
    model: 'approvallevel', endpoint: '/employee/api/request-approvals-levels/',
    type: { field: 'request_type', label: 'Request type', endpoint: '/employee/api/request-type/', name: r => r.name },
    users: U, role: true, roleRequired: false, esc: true, levelsRoute: 'general-sidebar/approval-level',
    escalation: { endpoint: '/employee/api/escalation-rules/', model: 'genrl_escalation', route: 'general-sidebar/general-request-escalation',
      title: 'Request escalation', desc: 'When a level does not answer a general request in time, the request moves to the person you choose.' },
  },
  document: {
    key: 'document', title: 'Document approval levels', where: 'document requests',
    desc: 'Who approves each type of document request (salary certificate, NOC …), level by level, for the branches you choose.',
    model: 'documentapprovallevel', endpoint: '/employee/api/Doc-request-approval-levels/',
    type: { field: 'request_type', label: 'Document type', endpoint: '/employee/api/Doc-request-Type/', name: r => r.type_name },
    users: U, role: true, roleRequired: true, esc: false, levelsRoute: 'general-sidebar/document-request-level',
  },
  latein: {
    key: 'latein', title: 'Late in / early out approval levels', where: 'late in / early out requests',
    desc: 'Who approves late in and early out requests of the branches you choose. A branch has one workflow.',
    model: 'lateinearlyoutapprovallevel', endpoint: '/calendars/api/lateineralyout-approval-level/',
    users: U, role: true, roleRequired: true, esc: false, levelsRoute: 'attendance-sidebar/latein-earlyout-approval-level',
  },
  resignation: {
    key: 'resignation', title: 'Resignation approval levels', where: 'resignations',
    desc: 'Who approves resignations of the branches you choose, level by level.',
    model: 'resignationapprovallevel', endpoint: '/employee/api/resign-approval-level/',
    users: U, role: true, roleRequired: false, esc: false, levelsRoute: 'sub-sidebar/resignation-approval-level',
  },
  leave: {
    key: 'leave', title: 'Leave approval levels', where: 'leave requests',
    desc: 'Who approves each leave type, level by level, for the branches you choose. Compensatory leave (work on a day off) has its own workflow.',
    model: 'leaveapprovallevels', endpoint: '/calendars/api/leave-approval-levels/',
    type: { field: 'request_type', label: 'Leave type', endpoint: '/calendars/api/leave-type/', name: r => r.name, idField: 'request_type_id',
      option: r => r.branch ? `${r.name} – ${r.branch}` : r.name },
    users: U, role: false, roleRequired: false, esc: true, comp: true, levelsRoute: 'leave-options/leave-approval-level',
    escalation: { endpoint: '/calendars/api/escalation-rules/', model: 'leave_escalation', route: 'leave-options/leave-escalation',
      title: 'Leave escalation', desc: 'When a level does not answer a leave request in time, the request moves to the person you choose.' },
  },
  payslip: {
    key: 'payslip', title: 'Payroll approval levels', where: 'payslips',
    desc: 'Who approves the payslips of the branches you choose before they are paid, level by level.',
    model: 'payslipcommonworkflow', endpoint: '/payroll/api/payslip-approval-levels/',
    users: '/users/tenant-non-ess-users/', role: true, roleRequired: true, esc: false, levelsRoute: 'salary-options/payroll-approval-level',
  },
  loan: {
    key: 'loan', title: 'Loan approval levels', where: 'loan requests',
    desc: 'Who approves each loan type, level by level, for the branches you choose.',
    model: 'loancommonworkflow', endpoint: '/payroll/api/loan-approval-levels/',
    type: { field: 'loan_type', label: 'Loan type', endpoint: '/payroll/api/loan-type/', name: r => r.loan_type },
    users: U, role: true, roleRequired: true, esc: true, levelsRoute: 'loan-sidebar/loan-approval-level',
    escalation: { endpoint: '/payroll/api/loan-approval-escalation/', model: 'loan_escalation', route: 'loan-sidebar/loan-escalation',
      title: 'Loan escalation', desc: 'When a level does not answer a loan request in time, the request moves to the person you choose.' },
  },
  advance: {
    key: 'advance', title: 'Advance salary approval levels', where: 'advance salary requests',
    desc: 'Who approves advance salary requests of the branches you choose, level by level.',
    model: 'advancecommonworkflow', endpoint: '/payroll/api/advance-salary-approval-levels/',
    users: U, role: true, roleRequired: true, esc: true, levelsRoute: 'salary-options/advance-salary-approval-level',
    escalation: { endpoint: '/payroll/api/adv-salary-escalation/', model: 'advsalary_escalation', route: 'salary-options/advance-salary-escalation',
      title: 'Advance salary escalation', desc: 'When a level does not answer an advance salary request in time, the request moves to the person you choose.' },
  },
  airticket: {
    key: 'airticket', title: 'Air ticket approval levels', where: 'air ticket requests',
    desc: 'Who approves air ticket requests of the branches you choose, level by level.',
    model: 'airticketworkflow', endpoint: '/payroll/api/airticket-approval-levels/',
    users: U, role: true, roleRequired: false, esc: true, levelsRoute: 'air-ticket-options/airticket-approval-level',
    escalation: { endpoint: '/payroll/api/airticket-approval-escalation/', model: 'airticket_escalation', route: 'air-ticket-options/airticket-escalation',
      title: 'Air ticket escalation', desc: 'When a level does not answer an air ticket request in time, the request moves to the person you choose.' },
  },
  asset: {
    key: 'asset', title: 'Asset approval levels', where: 'asset requests',
    desc: 'Who approves requests for each asset type, level by level, for the branches you choose.',
    model: 'assetapprovallevel', endpoint: '/organisation/api/asset-request-approvals-levels/',
    type: { field: 'asset_type', label: 'Asset type', endpoint: '/organisation/api/asset-type/', name: r => r.name },
    users: U, role: true, roleRequired: true, esc: true, levelsRoute: 'asset-options/asset-approval-level',
    escalation: { endpoint: '/organisation/api/asset-escalation-rules/', model: 'asset_escalation', route: 'asset-options/asset-escalation',
      title: 'Asset escalation', desc: 'When a level does not answer an asset request in time, the request moves to the person you choose.' },
  },
};

export const AP62_TYPES = [
  { value: 'no_approval', label: 'No approval', hint: 'The request is approved at once.' },
  { value: 'reporting_manager', label: 'Reporting manager', hint: 'The employee\'s reporting manager approves.' },
  { value: 'multi_approval', label: 'Approval levels', hint: 'The people you choose approve, one level after the other.' },
];
