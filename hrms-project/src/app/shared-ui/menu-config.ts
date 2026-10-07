/**
 * One menu for the whole application.
 * - MAIN_GROUPS: the main (left) menu, apps grouped under short headings.
 * - Each app's sub-menu is split into sections: daily work, approvals, planning, setup.
 * - `perms`: the item shows when the user is a company admin or holds any of these view permissions
 *   (the same codenames the old sub-menus checked). No perms = always shown.
 * Page URLs are unchanged; an item may live under another module's URL (for example the
 * weekend calendar stays at /settings/weelcalendar but is shown in Time & Attendance).
 */
export interface MenuItem { label: string; link: string; icon?: string; perms?: string[]; hint?: string; }
export interface MenuSection { title: string; items: MenuItem[]; collapsed?: boolean; }
export interface MenuApp {
  key: string; label: string; icon: string;
  link?: string;                 // fixed landing (apps without a sub-menu)
  parents?: string[];            // URL segments that belong to this app (fallback for detail pages)
  sections?: MenuSection[];
  perms?: string[];              // for apps without sections
}
export interface MenuGroup { title: string; apps: MenuApp[]; }

const M = '/main-sidebar/';

export const MAIN_GROUPS: MenuGroup[] = [
  {
    title: 'Overview', apps: [
      { key: 'home', label: 'Dashboard', icon: 'dashboard', link: M + 'dashboard-contents' },
      { key: 'mgr', label: 'Manager Dashboard', icon: 'insights', link: M + 'manager-dashboard', perms: ['*staff'] },
      { key: 'todo', label: 'My To-do', icon: 'task_alt', link: M + 'todo', parents: ['todo'] },
    ],
  },
  {
    title: 'People', apps: [
      { key: 'org', label: 'Organisation chart', icon: 'lan', link: M + 'org-chart', parents: ['org-chart'] },
      {
        key: 'employees', label: 'Employees', icon: 'people_alt', parents: ['sub-sidebar', 'document-folders'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Employees', link: M + 'sub-sidebar/employee-master', icon: 'person', perms: ['view_emp_master'] },
            { label: 'Expiring documents', link: M + 'sub-sidebar/document-expired', icon: 'running_with_errors', perms: ['view_notification'] },
            { label: 'Document library', link: M + 'document-folders', icon: 'folder', perms: ['view_folder', 'view_document'] },
          ] },
          { title: 'Exit', items: [
            { label: 'Resignation requests', link: M + 'sub-sidebar/resignation-request', icon: 'logout', perms: ['view_employeeresignation'] },
            { label: 'Resignation approvals', link: M + 'sub-sidebar/resignation-approvals', icon: 'fact_check', perms: ['view_resignationapproval'] },
            { label: 'Approved resignations', link: M + 'sub-sidebar/resignation-approved-list', icon: 'task_alt', perms: ['view_approved_resignations'] },
            { label: 'End of service', link: M + 'sub-sidebar/end-of-service', icon: 'calculate', perms: ['view_endofservice'] },
          ] },
          { title: 'Company', items: [
            { label: 'Announcements', link: M + 'general-sidebar/announcement-master', icon: 'campaign', perms: ['view_announcement'] },
            { label: 'Company policy', link: M + 'settings/company-policy', icon: 'policy', perms: ['view_companypolicy'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Departments', link: M + 'sub-sidebar/department-master', icon: 'business', perms: ['view_dept_master'] },
            { label: 'Designations', link: M + 'sub-sidebar/designation-master', icon: 'badge', perms: ['view_desgntn_master'] },
            { label: 'Categories', link: M + 'sub-sidebar/catogary-master', icon: 'category', perms: ['view_ctgry_master'] },
            { label: 'Document types', link: M + 'settings/document-type-master', icon: 'description', perms: ['view_document_type'] },
            { label: 'Form designer', link: M + 'settings/from-designer', icon: 'dynamic_form', perms: ['view_emp_customfield'] },
            { label: 'Resignation levels', link: M + 'sub-sidebar/resignation-approval-level', icon: 'approval', perms: ['view_resignationapprovallevel'] },
            { label: 'Gratuity table', link: M + 'sub-sidebar/gratyuity', icon: 'table_chart', perms: ['view_gratuitytable'] },
          ] },
        ],
      },
      {
        key: 'requests', label: 'Requests', icon: 'assignment', parents: ['general-sidebar'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'General requests', link: M + 'general-sidebar/general-request', icon: 'assignment', perms: ['view_generalrequest'] },
            { label: 'Document requests', link: M + 'general-sidebar/document-request', icon: 'description', perms: ['view_documentrequest'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'General approvals', link: M + 'general-sidebar/approvals', icon: 'fact_check', perms: ['view_approval'] },
            { label: 'Document approvals', link: M + 'general-sidebar/document-request-approval', icon: 'fact_check', perms: ['view_documentapproval'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Request types', link: M + 'general-sidebar/request-type', icon: 'list_alt', perms: ['view_requesttype'] },
            { label: 'Doc. request types', hint: 'Document request types', link: M + 'general-sidebar/document-request-type', icon: 'list_alt', perms: ['view_docrequesttype'] },
            { label: 'Approval levels', link: M + 'general-sidebar/approval-level', icon: 'approval', perms: ['view_approvallevel'] },
            { label: 'Doc. approval levels', hint: 'Document request approval levels', link: M + 'general-sidebar/document-request-level', icon: 'approval', perms: ['view_documentapprovallevel'] },
            { label: 'Escalation', link: M + 'general-sidebar/general-request-escalation', icon: 'trending_up', perms: ['view_genrl_escalation'] },
          ] },
        ],
      },
    ],
  },
  {
    title: 'Time', apps: [
      {
        key: 'attendance', label: 'Time & Attendance', icon: 'schedule', parents: ['attendance-sidebar', 'shift-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Attendance marking', link: M + 'attendance-sidebar/attendace-marking', icon: 'edit_calendar', perms: ['view_attendance'] },
            { label: 'Attendance list', link: M + 'attendance-sidebar/employee-full-attendance', icon: 'fact_check', perms: ['view_attendance'] },
            { label: 'Punching details', link: M + 'attendance-sidebar/employee-punching-list', icon: 'fingerprint', perms: ['view_attendance_list'] },
            { label: 'Manual entry', link: M + 'attendance-sidebar/manual-entry', icon: 'edit_note', perms: ['view_attendance_manual'] },
            { label: 'Late in / early out', link: M + 'attendance-sidebar/attendance-attendance-request', icon: 'more_time', perms: ['view_lateinearlyoutrequest'] },
            { label: 'Early going', link: M + 'attendance-sidebar/employee-early-going', icon: 'directions_run', perms: ['view_early_going'] },
            { label: 'Recheck', link: M + 'attendance-sidebar/employee-recheck', icon: 'find_replace', perms: ['view_attendancerecheck'] },
            { label: 'Overtime', link: M + 'shift-options/employee-overtime', icon: 'more_time', perms: ['view_employeeovertime'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Late in / early out', link: M + 'attendance-sidebar/latein-earlyout-approvals', icon: 'fact_check', perms: ['view_lateinearlyoutapproval'] },
          ] },
          { title: 'Planning', items: [
            { label: 'Shifts', link: M + 'shift-options/shifts', icon: 'schedule', perms: ['view_shift'] },
            { label: 'Shift patterns', link: M + 'shift-options/shift-pattern', icon: 'date_range', perms: ['view_shiftpattern'] },
            { label: 'Employee shifts', link: M + 'shift-options/shift-employee', icon: 'badge', perms: ['view_employeeshiftschedule'] },
            { label: 'Shift override', link: M + 'shift-options/shift-override', icon: 'edit_calendar', perms: ['view_shiftoverride'] },
            { label: 'Weekend calendar', link: M + 'settings/weelcalendar', icon: 'weekend', perms: ['view_weekend_calendar'] },
            { label: 'Assign weekends', link: M + 'settings/assign-weekcalendar', icon: 'event_repeat', perms: ['view_assign_weekend'] },
            { label: 'Holiday calendar', link: M + 'settings/holiday-calendar', icon: 'celebration', perms: ['view_holiday_calendar'] },
            { label: 'Assign holidays', link: M + 'settings/assign-holiday-calendar', icon: 'event_available', perms: ['view_assign_holiday'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Round-off policy', link: M + 'attendance-sidebar/attendance-policy', icon: 'rule', perms: ['view_attendancepolicy'] },
            { label: 'Validation policy', link: M + 'attendance-sidebar/attendance-validation-policy', icon: 'rule', perms: ['view_attendancevalidationpolicy'] },
            { label: 'Late coming policy', link: M + 'attendance-sidebar/late-come-policy', icon: 'rule', perms: ['view_latecomingpolicy'] },
            { label: 'Early exit policy', link: M + 'attendance-sidebar/early-exit-policy', icon: 'rule', perms: ['view_earlyexitpolicy'] },
            { label: 'Overtime policy', link: M + 'shift-options/overtime-policy', icon: 'policy', perms: ['view_overtimepolicy'] },
            { label: 'Overtime rule', link: M + 'shift-options/overtime-rule', icon: 'gavel', perms: ['view_overtimepolicy'] },
            { label: 'Late/early levels', hint: 'Late in / early out approval levels', link: M + 'attendance-sidebar/latein-earlyout-approval-level', icon: 'approval', perms: ['view_lateinearlyoutapprovallevel'] },
            { label: 'Geo fence', link: M + 'attendance-sidebar/geofence', icon: 'pin_drop', perms: ['view_branchgeofence'] },
            { label: 'Face register', link: M + 'attendance-sidebar/employee-face-register', icon: 'face_retouching_natural', perms: ['view_attendance_faceregister'] },
          ] },
        ],
      },
      {
        key: 'leave', label: 'Leave', icon: 'event_busy', parents: ['leave-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Leave requests', link: M + 'leave-options/leave-request', icon: 'edit_calendar', perms: ['view_employee_leave_request'] },
            { label: 'Leave balance', link: M + 'leave-options/leave-balance', icon: 'account_balance_wallet', perms: ['view_emp_leave_balance'] },
            { label: 'Compensatory leave', link: M + 'leave-options/compensatory-leave', icon: 'event_available', perms: ['view_compensatoryleaverequest'] },
            { label: 'Return from leave', link: M + 'leave-options/employee-leave-rejoin', icon: 'assignment_return', perms: ['view_employeerejoining'] },
            { label: 'Leave cancellation', link: M + 'leave-options/immediate-rejection', icon: 'cancel', perms: ['view_lv_cancellation'] },
            { label: 'Leave encashment', link: M + 'leave-options/leave-encashment', icon: 'payments', perms: ['view_emp_leave_balance'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Leave approvals', link: M + 'leave-options/leave-approvals', icon: 'fact_check', perms: ['view_leaveapproval'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Leave types', link: M + 'leave-options/leave-master', icon: 'category', perms: ['view_leave_type'] },
            { label: 'Leave policy', link: M + 'leave-options/leave-policy', icon: 'policy', perms: ['view_leave_type'] },
            { label: 'Approval levels', link: M + 'leave-options/leave-approval-level', icon: 'approval', perms: ['view_leaveapprovallevels'] },
            { label: 'Escalation', link: M + 'leave-options/leave-escalation', icon: 'trending_up', perms: ['view_leave_escalation'] },
            { label: 'Accrual test', link: M + 'leave-options/leave-accruval', icon: 'published_with_changes', perms: ['view_leave_accrual_transaction'] },
          ] },
        ],
      },
    ],
  },
  {
    title: 'Pay', apps: [
      {
        key: 'payroll', label: 'Payroll', icon: 'payments', parents: ['salary-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Payroll runs', link: M + 'salary-options/pay-roll', icon: 'payments', perms: ['view_payrollrun'] },
            { label: 'Payslip approvals', link: M + 'salary-options/payslip-approval', icon: 'receipt_long', perms: ['view_payslipapproval'] },
            { label: 'WPS file', link: M + 'salary-options/wps', icon: 'account_balance', perms: ['view_wps'] },
          ] },
          { title: 'Salaries', items: [
            { label: 'Employee salary', link: M + 'salary-options/employee-salary', icon: 'badge', perms: ['view_employeesalarystructure'] },
            { label: 'Pay structure', link: M + 'salary-options/pay-structure', icon: 'schema', perms: ['view_paystructure'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Salary components', link: M + 'salary-options/salary', icon: 'extension', perms: ['view_salarycomponent'] },
            { label: 'Salary structures', link: M + 'salary-options/salary-structure', icon: 'account_tree', perms: ['view_salarycomponent'] },
            { label: 'Approval levels', link: M + 'salary-options/payroll-appoval-level', icon: 'approval', perms: ['view_payslipcommonworkflow'] },
          ] },
        ],
      },
      {
        key: 'benefits', label: 'Loans & Benefits', icon: 'savings', parents: ['loan-sidebar', 'air-ticket-options'],
        sections: [
          { title: 'Loans', items: [
            { label: 'Loan requests', link: M + 'loan-sidebar/loan-application', icon: 'request_quote', perms: ['view_loanapplication'] },
            { label: 'Loan approvals', link: M + 'loan-sidebar/loan-approval', icon: 'fact_check', perms: ['view_loanapproval'] },
            { label: 'Loan repayments', link: M + 'loan-sidebar/loan-repayment', icon: 'price_check', perms: ['view_loanrepayment'] },
          ] },
          { title: 'Advance salary', items: [
            { label: 'Advance requests', link: M + 'salary-options/advance-salary-request', icon: 'request_quote', perms: ['view_advancesalaryrequest'] },
            { label: 'Advance approvals', link: M + 'salary-options/advance-salary-approvals', icon: 'fact_check', perms: ['view_advancesalaryapproval'] },
          ] },
          { title: 'Air tickets', items: [
            { label: 'Air ticket requests', link: M + 'air-ticket-options/airticket-request', icon: 'flight_takeoff', perms: ['view_airticketrequest'] },
            { label: 'Air ticket approvals', link: M + 'air-ticket-options/airticket-approvals', icon: 'fact_check', perms: ['view_airticketapproval'] },
            { label: 'Air ticket allocation', link: M + 'air-ticket-options/airticket-allocation', icon: 'confirmation_number', perms: ['view_airticketallocation'] },
          ] },
          { title: 'Loan setup', collapsed: true, items: [
            { label: 'Loan types', link: M + 'loan-sidebar/loan-type', icon: 'account_balance', perms: ['view_loantype'] },
            { label: 'Approval levels', link: M + 'loan-sidebar/loan-approvel-level', icon: 'approval', perms: ['view_loancommonworkflow'] },
            { label: 'Escalation', link: M + 'loan-sidebar/loan-escalation', icon: 'trending_up', perms: ['view_loan_escalation'] },
          ] },
          { title: 'Advance salary setup', collapsed: true, items: [
            { label: 'Approval levels', link: M + 'salary-options/advance-salary-approval-level', icon: 'approval', perms: ['view_advancecommonworkflow'] },
            { label: 'Escalation', link: M + 'salary-options/advance-salary-escalation', icon: 'trending_up', perms: ['view_advsalary_escalation'] },
          ] },
          { title: 'Air ticket setup', collapsed: true, items: [
            { label: 'Policy', link: M + 'air-ticket-options/air-ticket-policy', icon: 'policy', perms: ['view_airticketpolicy'] },
            { label: 'Rules', link: M + 'air-ticket-options/airticket-rule', icon: 'gavel', perms: ['view_airticketrule'] },
            { label: 'Approval levels', link: M + 'air-ticket-options/airticket-approval-level', icon: 'approval', perms: ['view_airticketworkflow'] },
            { label: 'Escalation', link: M + 'air-ticket-options/airticket-escalation', icon: 'trending_up', perms: ['view_airticket_escalation'] },
          ] },
        ],
      },
    ],
  },
  {
    title: 'Operations', apps: [
      {
        key: 'assets', label: 'Assets', icon: 'inventory_2', parents: ['asset-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Asset register', link: M + 'asset-options/asset-master', icon: 'inventory_2', perms: ['view_asset'] },
            { label: 'Asset allocation', link: M + 'asset-options/asset-allocation', icon: 'assignment_ind', perms: ['view_assetallocation'] },
            { label: 'Asset requests', link: M + 'asset-options/asset-request', icon: 'request_quote', perms: ['view_assetrequest'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Asset approvals', link: M + 'asset-options/asset-approval', icon: 'fact_check', perms: ['view_assetapproval'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Asset types', link: M + 'asset-options/asset-type', icon: 'category', perms: ['view_assettype'] },
            { label: 'Asset form designer', link: M + 'settings/asset-udf', icon: 'dynamic_form', perms: ['view_assetcustomfield'] },
            { label: 'Approval levels', link: M + 'asset-options/asset-approvel-level', icon: 'approval', perms: ['view_assetapprovallevel'] },
            { label: 'Escalation', link: M + 'asset-options/asset-escalation', icon: 'trending_up', perms: ['view_asset_escalation'] },
          ] },
        ],
      },
      {
        key: 'projects', label: 'Projects', icon: 'account_tree', parents: ['project-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Projects', link: M + 'project-options/project-master', icon: 'account_tree', perms: ['view_project'] },
            { label: 'Tasks', link: M + 'project-options/project-tasks', icon: 'assignment_turned_in', perms: ['view_task'] },
            { label: 'Timesheets', link: M + 'project-options/project-timesheet', icon: 'schedule', perms: ['view_timesheet'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Project stages', link: M + 'project-options/project-stages', icon: 'view_kanban', perms: ['view_projectstage'] },
          ] },
        ],
      },
    ],
  },
  {
    title: 'Talent', apps: [
      { key: 'performance', label: 'Performance', icon: 'speed', link: M + 'performance-options', parents: ['performance-options'], perms: ['view_kpi', 'view_appraisalcycle', 'view_goalsheet', 'view_appraisaltemplate'] },
      { key: 'recruitment', label: 'Recruitment', icon: 'person_add', link: M + 'recruitment-options', parents: ['recruitment-options'], perms: ['view_manpowerrequisition', 'view_jobopening', 'view_candidate'] },
      { key: 'learning', label: 'Learning', icon: 'school', link: M + 'learning-options', parents: ['learning-options'], perms: ['view_course', 'view_trainingsession', 'view_nomination', 'view_trainingneed'] },
    ],
  },
  {
    title: 'Admin', apps: [
      {
        key: 'reports', label: 'Reports', icon: 'query_stats', parents: ['report-options'],
        sections: [
          { title: 'People', items: [
            { label: 'Employees', link: M + 'report-options/report-generate', icon: 'badge', perms: ['view_report'] },
            { label: 'Departments', link: M + 'report-options/department-report', icon: 'corporate_fare', perms: ['view_dept_report'] },
            { label: 'Designations', link: M + 'report-options/designation-report', icon: 'work', perms: ['view_designtn_report'] },
            { label: 'Documents', link: M + 'report-options/document-report', icon: 'folder_shared', perms: ['view_doc_report'] },
          ] },
          { title: 'Leave & attendance', items: [
            { label: 'Leave', link: M + 'report-options/leave-report', icon: 'event_busy', perms: ['view_leavereport'] },
            { label: 'Leave approvals', link: M + 'report-options/leave-approvals-report', icon: 'event_available', perms: ['view_leaveapprovalreport'] },
            { label: 'Leave balance', link: M + 'report-options/leave-balance-report', icon: 'account_balance_wallet', perms: ['view_lvbalancereport'] },
            { label: 'Attendance', link: M + 'report-options/employee-attendance', icon: 'fact_check', perms: ['view_attendancereport'] },
          ] },
          { title: 'Requests & assets', items: [
            { label: 'General requests', link: M + 'report-options/general-request-report', icon: 'assignment', perms: ['view_generalrequestreport'] },
            { label: 'Assets', link: M + 'report-options/asset-report', icon: 'inventory_2', perms: ['view_assetreport'] },
            { label: 'Asset transactions', link: M + 'report-options/asset-transaction-report', icon: 'receipt_long', perms: ['view_assettransactionreport'] },
          ] },
        ],
      },
      {
        key: 'settings', label: 'Settings', icon: 'settings', parents: ['settings'],
        sections: [
          { title: 'Company', items: [
            { label: 'Company', link: M + 'settings/location-master', icon: 'domain', perms: ['view_company'] },
            { label: 'Branches', link: M + 'settings/branch-master', icon: 'store', perms: ['view_brnch_mstr'] },
            { label: 'States / emirates', link: M + 'settings/state-master', icon: 'map', perms: ['view_state_mstr'] },
            { label: 'Document numbering', link: M + 'settings/document-numbering', icon: 'pin', perms: ['view_documentnumbering'] },
            { label: 'Doc. expiry alerts', hint: 'Document expiry notifications', link: M + 'settings/notification-settings', icon: 'notifications_active', perms: ['view_notificationsettings'] },
          ] },
          { title: 'Users & rights', items: [
            { label: 'Users', link: M + 'settings/user-master', icon: 'manage_accounts', perms: ['view_customuser'] },
            { label: 'Permission groups', link: M + 'settings/user-grouping-master', icon: 'groups', perms: ['view_group'] },
            { label: 'Assign permissions', link: M + 'settings/permission-assigned', icon: 'admin_panel_settings', perms: ['view_permission'] },
            { label: 'Branch permissions', link: M + 'settings/branch-permissions', icon: 'account_tree', perms: ['view_userbranchaccess'] },
          ] },
          { title: 'E-mail', items: [
            { label: 'E-mail configuration', link: M + 'settings/email-configuration', icon: 'outgoing_mail', perms: ['view_emailconfiguration'] },
          ] },
          { title: 'E-mail templates', collapsed: true, items: [
            { label: 'General request', link: M + 'settings/email-template', icon: 'mail', perms: ['view_emailtemplate'] },
            { label: 'Leave request', link: M + 'settings/leave-template', icon: 'mail', perms: ['view_lvemailtemplate'] },
            { label: 'Late in / early out', link: M + 'settings/latein-earlyout-email-template', icon: 'mail', perms: ['view_latinearlyoutemailtemplate'] },
            { label: 'Document request', link: M + 'settings/document-request-email-template', icon: 'mail', perms: ['view_docrequestemailtemplate'] },
            { label: 'Document expiry', link: M + 'settings/doc-exp-emailtemplate', icon: 'mail', perms: ['view_docexpemailtemplate'] },
            { label: 'Loan request', link: M + 'settings/loan-email-template', icon: 'mail', perms: ['view_loanemailtemplate'] },
            { label: 'Advance salary', link: M + 'settings/advance-salary-emailtemplate', icon: 'mail', perms: ['view_advancesalaryemailtemplate'] },
            { label: 'Air ticket', link: M + 'settings/airticket-email-template', icon: 'mail', perms: ['view_airticketemailtemplate'] },
            { label: 'Asset request', link: M + 'settings/asset-email-template', icon: 'mail', perms: ['view_assetemailtemplate'] },
            { label: 'Resignation', link: M + 'settings/resignation-email-template', icon: 'mail', perms: ['view_resignationemailtemplate'] },
          ] },
        ],
      },
    ],
  },
];

export const ALL_APPS: MenuApp[] = MAIN_GROUPS.flatMap(g => g.apps);

function clean(url: string): string { return (url || '').split('?')[0].split('#')[0].replace(/\/+$/, ''); }

/** The app a URL belongs to: exact menu item first, then longest item prefix, then the module part of the URL. */
export function appForUrl(url: string): MenuApp | null {
  const u = clean(url);
  let best: { app: MenuApp; len: number } | null = null;
  for (const app of ALL_APPS) {
    for (const s of app.sections || []) {
      for (const it of s.items) {
        if (u === it.link) { return app; }
        if (u.startsWith(it.link + '/') && (!best || it.link.length > best.len)) { best = { app, len: it.link.length }; }
      }
    }
  }
  if (best) { return best.app; }
  const seg = u.replace(M, '').split('/')[0];
  return ALL_APPS.find(a => (a.parents || []).includes(seg)) || null;
}

export function itemVisible(perms: string[] | undefined, access: { admin: boolean; codes: Set<string> } | null): boolean {
  if (!perms || !perms.length || !access || access.admin) { return true; }
  if (perms.includes('*staff')) { return access.codes.size > 0; }
  return perms.some(p => access.codes.has(p));
}
