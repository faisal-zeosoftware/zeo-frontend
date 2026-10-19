/**
 * One menu for the whole application.
 * - MAIN_GROUPS: the main (left) menu, apps grouped under short headings.
 * - Each app's sub-menu is split into sections: daily work, approvals, planning, setup.
 * - `perms`: the item shows when the user is a company admin or holds any of these view permissions
 *   (the same codenames the old sub-menus checked). No perms = always shown.
 * Page URLs are unchanged; an item may live under another module's URL (for example the
 * weekend calendar stays at /settings/weekcalendar but is shown in Time & Attendance).
 * v1.15.1: misspelt page addresses were corrected (old spellings redirect); parallel old screens that a newer
 * screen fully replaces redirect to it and left this menu.
 */
export interface MenuItem {
  label: string; link: string; icon?: string; perms?: string[]; hint?: string;
  /** v1.14.0: country condition (CountryPackService.allows), e.g. 'wps_sif' – hidden when it does not hold */
  country?: string;
}
export interface MenuSection { title: string; items: MenuItem[]; collapsed?: boolean; }
export interface MenuApp {
  key: string; label: string; icon: string;
  link?: string;                 // fixed landing (apps without a sub-menu)
  parents?: string[];            // URL segments that belong to this app (fallback for detail pages)
  sections?: MenuSection[];
  perms?: string[];              // for apps without sections
  country?: string;              // v1.14.0: country condition, like MenuItem.country
}
/** v1.20.0: the three apps of ZEO – HRMS, Projects and Settings. 'common' apps (Calendar, My To-do) appear in each of them. */
export type Suite = 'hrms' | 'projects' | 'crm' | 'property' | 'maintenance' | 'assets' | 'people' | 'hse' | 'settings' | 'common';
export interface SuiteDef { key: Exclude<Suite, 'common'>; label: string; icon: string; hint: string; }
export const SUITES: SuiteDef[] = [
  { key: 'hrms', label: 'HRMS', icon: 'groups', hint: 'People, time, pay, assets and talent' },
  { key: 'projects', label: 'Projects', icon: 'account_tree', hint: 'Support tickets, customers and AMC, delivery' },
  // v1.21.0: CRM, Property, Maintenance and HSE – each works on its own; when two are active their links switch on
  { key: 'crm', label: 'CRM', icon: 'handshake', hint: 'Leads, accounts, opportunities, quotations, sales orders' },
  { key: 'property', label: 'Property', icon: 'apartment', hint: 'Buildings, units, leases, sales, billing, portals' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build', hint: 'Work orders, preventive plans, assets, inspections' },
  { key: 'assets', label: 'Asset Management', icon: 'inventory_2', hint: 'Asset register, labels, counts, depreciation, maintenance, helpdesk, spare parts' },   // v1.33.0
  { key: 'people', label: 'People', icon: 'diversity_3', hint: 'Benefits, e-signature, forms, surveys, recognition, chat, 360° reviews' },   // v1.36.0
  { key: 'hse', label: 'HSE', icon: 'health_and_safety', hint: 'Risk, permits, incidents, inspections, CAPA' },
  { key: 'settings', label: 'Settings', icon: 'settings', hint: 'Company, branches, users and rights, e-mail' },
];
export interface MenuGroup { title: string; apps: MenuApp[]; suite?: Suite; }

const M = '/main-sidebar/';
const Z = '/main-sidebar/zeo-projects/';   // v1.20.0 Projects app pages
const H = '/main-sidebar/zeo-hse/';        // v1.21.0 HSE app (add-on 1.17.0, merged)
const CRM = '/main-sidebar/zeo-crm/';      // v1.21.0 CRM app (add-on 1.18.0, merged)
const PR = '/main-sidebar/zeo-property/';  // v1.21.0 Property app
const MN = '/main-sidebar/zeo-maintenance/';   // v1.21.0 Maintenance app
const AM = '/main-sidebar/zeo-assets/';        // v1.33.0 Asset Management app
// role permissions (codenames on each app's settings model, given by the "<App> – <role>" permission groups)
const HSE_STAFF = ['hse_manager', 'hse_officer', 'hse_site_manager', 'hse_permit_issuer', 'hse_area_authority', 'hse_gas_tester', 'hse_supervisor',
                   'hse_occ_health', 'hse_quality_manager', 'hse_env_officer', 'hse_infection_control', 'hse_auditor', 'hse_moc_coordinator', 'hse_senior_mgmt'];
const HSE_ENV = ['hse_env_officer', 'hse_manager', 'hse_officer', 'hse_senior_mgmt'];
const CRM_ALL = ['crm_manager', 'crm_team_lead', 'crm_agent', 'crm_viewer'];
const PROP_ALL = ['prop_manager', 'prop_leasing', 'prop_sales', 'prop_contracts', 'prop_finance', 'prop_commission', 'prop_viewer'];
const MNT_ALL = ['mnt_manager', 'mnt_coordinator', 'mnt_technician', 'mnt_viewer'];
const AST_ALL = ['ast_manager', 'ast_coordinator', 'ast_finance', 'ast_auditor', 'ast_viewer'];
const PP = '/main-sidebar/zeo-people/';        // v1.36.0 People app
const PP_STAFF = ['ppl_manager', 'ppl_benefits', 'ppl_hr', 'ppl_viewer'];
const PP_HR = ['ppl_manager', 'ppl_hr'];
const AST_OPS = ['ast_manager', 'ast_coordinator'];
const AST_MNT = ['ast_manager', 'ast_maint_planner', 'ast_coordinator', 'ast_technician', 'ast_viewer'];   // v1.34.0 release 2
const AST_DESK = ['ast_manager', 'ast_helpdesk', 'ast_maint_planner', 'ast_coordinator', 'ast_technician', 'ast_viewer'];
const AST_STORE = ['ast_manager', 'ast_storekeeper', 'ast_maint_planner', 'ast_technician', 'ast_coordinator', 'ast_viewer', 'ast_finance'];
const AST_FIN = ['ast_manager', 'ast_finance', 'ast_viewer', 'ast_auditor'];
const RC = '/main-sidebar/report-options/r/';
const PJ_SUPPORT = ['view_ticket', 'work_ticket', 'assign_ticket'];
const PJ_ANY = ['view_ticket', 'work_ticket', 'assign_ticket', 'view_amccontract', 'view_project', 'view_projectprofile', 'view_projectfinance'];   // v1.22.0: reports of every app in the HRMS report centre

export const MAIN_GROUPS: MenuGroup[] = [
  {
    // v1.20.0: shown in every app, after its first entry
    title: 'Overview', suite: 'common', apps: [
      { key: 'cal', label: 'Calendar', icon: 'calendar_month', parents: ['unified-calendar'], sections: [   // v1.11.0; v1.37.1: the weekend and holiday calendars live here (were under Time & Attendance)
        { title: 'Calendar', items: [
          { label: 'Calendar', hint: 'Leave, holidays, shifts, birthdays, activities', link: M + 'unified-calendar', icon: 'calendar_month' },
        ] },
        { title: 'Calendars', items: [
          { label: 'Weekend calendar', link: M + 'settings/weekcalendar', icon: 'weekend', perms: ['view_weekend_calendar'] },
          { label: 'Assign weekends', link: M + 'settings/assign-weekcalendar', icon: 'event_repeat', perms: ['view_assign_weekend'] },
          { label: 'Holiday calendar', link: M + 'settings/holiday-calendar', icon: 'celebration', perms: ['view_holiday_calendar'] },
          { label: 'Assign holidays', link: M + 'settings/assign-holiday-calendar', icon: 'event_available', perms: ['view_assign_holiday'] },
        ] },
      ] },
      { key: 'todo', label: 'My To-do', icon: 'task_alt', link: M + 'todo', parents: ['todo'] },
    ],
  },
  {
    title: 'Overview', apps: [
      // v1.17.0: one Home entry for every dashboard (HR operations / Management / Team / My – tabs by role); the old CEO, manager and
      // my dashboard entries open their tab of Home
      { key: 'home', label: 'Home', icon: 'dashboard', link: M + 'home', parents: ['home', 'dashboard-contents', 'ceo-dashboard', 'manager-dashboard', 'my-dashboard'] },
      { key: 'ess', label: 'Self service', icon: 'person_pin_circle', link: M + 'self-service/home', parents: ['self-service'] },   // v1.13.0
      { key: 'mypolicies', label: 'My policies', icon: 'policy', link: M + 'my-policies', parents: ['my-policies'] },   // v1.12.0
    ],
  },
  {
    title: 'My work', apps: [   // v1.13.0: everything an employee needs in one place
      { key: 'mywork', label: 'My work', icon: 'work_history', parents: ['self-service'], sections: [
        { title: 'Me', items: [
          { label: 'My profile', link: M + 'self-service/profile', icon: 'badge' },
          { label: 'My change requests', link: M + 'self-service/my-requests', icon: 'pending_actions' },
          { label: 'My documents', link: M + 'self-service/documents', icon: 'folder_shared' },
          { label: 'My letters', link: M + 'self-service/letters', icon: 'description' },
        ] },
        { title: 'Time and pay', items: [
          { label: 'My leave', hint: 'Apply, balance, status', link: M + 'self-service/leave', icon: 'event_busy' },
          { label: 'My attendance', link: M + 'attendance-plus/my-attendance', icon: 'fingerprint' },
          { label: 'My payslips', link: M + 'self-service/payslips', icon: 'receipt' },
          { label: 'Claims and requests', link: M + 'self-service/claims', icon: 'request_quote' },
        ] },
        { title: 'Performance and learning', items: [
          { label: 'My goals', link: M + 'performance-options/goal-setting', icon: 'flag' },
          { label: 'Mid-year check-in', link: M + 'performance-options/check-in', icon: 'update' },
          { label: 'Self appraisal / acknowledge rating', link: M + 'performance-options/self-appraisal', icon: 'rate_review' },
          { label: 'My learning', link: M + 'learning-options/my-learning', icon: 'school' },
        ] },
        { title: 'Company', items: [
          { label: 'Announcements', link: M + 'self-service/announcements', icon: 'campaign' },
          { label: 'Complaints', link: M + 'self-service/complaints', icon: 'report' },
        ] },
      ] },
    ],
  },
  {
    title: 'People', apps: [
      { key: 'org', label: 'Organisation chart', icon: 'lan', link: M + 'org-chart', parents: ['org-chart'] },
      { key: 'orgstructure', label: 'Organisation', icon: 'corporate_fare', link: M + 'org-structure', parents: ['org-structure'],
        perms: ['view_dept_master', 'view_emp_master', 'view_companypolicy', 'view_leavepolicy'] },   // v1.12.0
      {
        key: 'employees', label: 'Employees', icon: 'people_alt', parents: ['sub-sidebar', 'document-folders', 'employee-master-tools'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Employees', link: M + 'sub-sidebar/employee-master', icon: 'person', perms: ['view_emp_master'] },
            { label: 'Employee transfer', hint: 'Move to another branch / department / manager', link: M + 'sub-sidebar/employee-transfer', icon: 'swap_horiz', perms: ['change_emp_master', 'run_employee_transfer'] },
            { label: 'Expiring documents', link: M + 'sub-sidebar/document-expired', icon: 'running_with_errors', perms: ['view_notification'] },
            { label: 'Document library', link: M + 'document-folders', icon: 'folder', perms: ['view_folder', 'view_document'] },
            { label: 'Probation ending', hint: 'Confirm, extend or end probations', link: M + 'employee-master-tools/probation', icon: 'event_available', perms: ['view_emp_master'] },   // v1.13.0
            { label: 'Import identity details', hint: 'Passport, visa, Emirates ID from Excel', link: M + 'employee-master-tools/identity-import', icon: 'upload_file', perms: ['change_emp_master'] },   // v1.13.0
          ] },
          { title: 'Exit', items: [
            { label: 'Resignation requests', link: M + 'sub-sidebar/resignation-request', icon: 'logout', perms: ['view_employeeresignation'] },
            { label: 'Resignation approvals', link: M + 'sub-sidebar/resignation-approvals', icon: 'fact_check', perms: ['view_resignationapproval', 'approver_resignationapproval'] },
            { label: 'Approved resignations', link: M + 'sub-sidebar/resignation-approved-list', icon: 'task_alt', perms: ['view_approved_resignations'] },
            { label: 'End of service', link: M + 'sub-sidebar/end-of-service', icon: 'calculate', perms: ['view_endofservice'] },
            { label: 'Final settlement', hint: 'HR → Finance → management → payment in 14 days', link: M + 'sub-sidebar/final-settlement', icon: 'request_quote', perms: ['view_exitsettlement', 'add_exitsettlement', 'validate_exitsettlement', 'approve_exitsettlement', 'pay_exitsettlement'] },   // v1.18.0
          ] },
          { title: 'Company', items: [
            { label: 'Announcements', link: M + 'general-sidebar/announcement-master', icon: 'campaign', perms: ['view_announcement'] },
            { label: 'Company policy', link: M + 'settings/company-policy', icon: 'policy', perms: ['view_companypolicy'] },
            { label: 'Profile change requests', link: M + 'self-service/hr-requests', icon: 'fact_check', perms: ['change_emp_master', 'change_profilechangerequest'] },   // v1.13.0
            { label: 'HR letters', link: M + 'self-service/hr-letters', icon: 'history_edu', perms: ['change_emp_master', 'change_letterrequest', 'change_documentrequest'] },   // v1.13.0
            { label: 'Complaints / grievances', link: M + 'self-service/hr-complaints', icon: 'gavel', perms: ['handle_grievance'] },   // v1.13.0
            { label: 'Announcement read receipts', link: M + 'self-service/announcements', icon: 'mark_email_read', perms: ['view_announcement', 'view_announcementview'] },   // v1.13.0
            { label: 'Self-service settings', hint: 'What employees may change, letter templates, complaint rules', link: M + 'self-service/settings', icon: 'tune', perms: ['change_emp_master', 'change_essfieldpolicy'] },   // v1.13.0
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Departments', link: M + 'sub-sidebar/department-master', icon: 'business', perms: ['view_dept_master'] },
            { label: 'Designations', link: M + 'sub-sidebar/designation-master', icon: 'badge', perms: ['view_desgntn_master'] },
            { label: 'Categories', link: M + 'sub-sidebar/category-master', icon: 'category', perms: ['view_ctgry_master'] },
            { label: 'Document types', link: M + 'settings/document-type-master', icon: 'description', perms: ['view_document_type'] },
            { label: 'Form designer', link: M + 'settings/form-designer', icon: 'dynamic_form', perms: ['view_emp_customfield'] },
            { label: 'Resignation levels', link: M + 'sub-sidebar/resignation-approval-level', icon: 'approval', perms: ['view_resignationapprovallevel'] },
            { label: 'Gratuity table', link: M + 'sub-sidebar/gratuity', icon: 'table_chart', perms: ['view_gratuitytable'], country: 'gratuity' },   // v1.14.0
            { label: 'Employee code numbering', link: M + 'employee-master-tools/code-numbering', icon: 'pin', perms: ['change_emp_master'] },   // v1.13.0
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
            { label: 'General approvals', link: M + 'general-sidebar/approvals', icon: 'fact_check', perms: ['view_approval', 'approver_approval'] },
            { label: 'Document approvals', link: M + 'general-sidebar/document-request-approval', icon: 'fact_check', perms: ['view_documentapproval', 'approver_documentapproval'] },
            { label: 'Workflow approvals', hint: 'Approval requests of the automation rules (any app)', link: M + 'automation/approvals', icon: 'how_to_reg' },   // v1.29.0
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
        key: 'attendance', label: 'Attendance', icon: 'schedule', parents: ['attendance-sidebar', 'shift-options', 'attendance-plus'],   // v1.37.1: was "Time & Attendance"
        sections: [
          { title: 'My attendance', items: [   // v1.12.0
            { label: 'My attendance', hint: 'Punch in / out, breaks, my month, corrections', link: M + 'attendance-plus/my-attendance', icon: 'fingerprint' },
            { label: 'Corrections', hint: 'Attendance correction requests and approvals', link: M + 'attendance-plus/corrections', icon: 'edit_calendar' },
          ] },
          { title: 'Daily work', items: [
            { label: 'Daily board', link: M + 'attendance-plus/board', icon: 'dashboard', perms: ['view_attendance'] },   // v1.12.0
            { label: 'Daily attendance', link: M + 'attendance-plus/days', icon: 'fact_check', perms: ['view_attendance'] },   // v1.12.0
            { label: 'Missing punches', link: M + 'attendance-plus/missing', icon: 'running_with_errors', perms: ['view_attendance'] },   // v1.12.0
            { label: 'Punches', link: M + 'attendance-plus/punches', icon: 'touch_app', perms: ['view_attendance'] },   // v1.12.0
            { label: 'Import punches', link: M + 'attendance-plus/import', icon: 'upload_file', perms: ['add_attendance'] },   // v1.12.0
            { label: 'Attendance marking', link: M + 'attendance-sidebar/attendance-marking', icon: 'edit_calendar', perms: ['view_attendance'] },
            { label: 'Attendance list', link: M + 'attendance-sidebar/employee-full-attendance', icon: 'fact_check', perms: ['view_attendance'] },
            { label: 'Punching details', link: M + 'attendance-sidebar/employee-punching-list', icon: 'fingerprint', perms: ['view_attendance_list'] },
            { label: 'Manual entry', link: M + 'attendance-sidebar/manual-entry', icon: 'edit_note', perms: ['view_attendance_manual'] },
            { label: 'Late in / early out', link: M + 'attendance-sidebar/attendance-attendance-request', icon: 'more_time', perms: ['view_lateinearlyoutrequest'] },
            { label: 'Early going', link: M + 'attendance-sidebar/employee-early-going', icon: 'directions_run', perms: ['view_early_going'] },
            { label: 'Recheck', link: M + 'attendance-sidebar/employee-recheck', icon: 'find_replace', perms: ['view_attendancerecheck'] },
            { label: 'Overtime', link: M + 'shift-options/employee-overtime', icon: 'more_time', perms: ['view_employeeovertime'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Late in / early out', link: M + 'attendance-sidebar/latein-earlyout-approvals', icon: 'fact_check', perms: ['view_lateinearlyoutapproval', 'approver_lateinearlyoutapproval'] },
          ] },
          { title: 'Planning', items: [
            { label: 'Shift rosters', link: M + 'shift-planner/rosters', icon: 'calendar_view_week', perms: ['view_rosterperiod'] },   // v1.12.0
            { label: 'Shift master (rules)', link: M + 'shift-planner/shifts', icon: 'schedule', perms: ['view_shift'] },   // v1.12.0
            { label: 'Shift requests', link: M + 'shift-planner/requests', icon: 'swap_horiz', perms: ['view_shiftrequest'] },   // v1.12.0
            { label: 'Shift patterns', link: M + 'shift-options/shift-pattern', icon: 'date_range', perms: ['view_shiftpattern'] },
            { label: 'Employee shifts', link: M + 'shift-options/shift-employee', icon: 'badge', perms: ['view_employeeshiftschedule'] },
            { label: 'Shift override', link: M + 'shift-options/shift-override', icon: 'edit_calendar', perms: ['view_shiftoverride'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Attendance rules', link: M + 'attendance-plus/rules', icon: 'rule', perms: ['change_attendance'] },   // v1.12.0
            { label: 'Devices', hint: 'ZKTeco / JSON attendance devices', link: M + 'attendance-plus/devices', icon: 'router', perms: ['change_attendance'] },   // v1.12.0
            { label: 'Kiosks', link: M + 'attendance-plus/kiosks', icon: 'tablet_mac', perms: ['change_attendance'] },   // v1.12.0
            { label: 'Office networks (IP)', link: M + 'attendance-plus/networks', icon: 'lan', perms: ['change_attendance'] },   // v1.12.0
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
      { key: 'shiftplan', label: 'Shift planner', icon: 'calendar_view_week', link: M + 'shift-planner', parents: ['shift-planner'] },   // v1.12.0
      {
        key: 'leave', label: 'Leave', icon: 'event_busy', parents: ['leave-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Leave requests', hint: 'Apply, see balance and status', link: M + 'leave-options/leave-request', icon: 'edit_calendar', perms: ['view_employee_leave_request']  },   // v1.13.0
            { label: 'My leave', link: M + 'self-service/leave', icon: 'event_note', perms: ['view_employee_leave_request'] },
            { label: 'Leave balance', link: M + 'leave-options/leave-balance', icon: 'account_balance_wallet', perms: ['view_emp_leave_balance'] },
            { label: 'Leave planner', hint: 'Who is away when', link: M + 'leave-options/leave-planner', icon: 'calendar_month', perms: ['view_employee_leave_request', 'view_leaveapproval', 'role_line_manager'] },
            { label: 'Compensatory leave', link: M + 'leave-options/compensatory-leave', icon: 'event_available', perms: ['view_compensatoryleaverequest'] },
            { label: 'Return from leave', hint: 'Record returns and settle late / early rejoining', link: M + 'leave-options/rejoining', icon: 'assignment_return', perms: ['change_employeerejoining', 'view_employeerejoining'] },
            { label: 'Leave cancellation', link: M + 'leave-options/immediate-rejection', icon: 'cancel', perms: ['view_lv_cancellation'] },
            { label: 'Leave encashment', link: M + 'leave-options/leave-encashment', icon: 'payments', perms: ['view_emp_leave_balance'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Leave approvals', link: M + 'leave-options/leave-approvals', icon: 'fact_check', perms: ['view_leaveapproval', 'approver_leaveapproval', 'role_line_manager'] },
            { label: 'Encashment approvals', link: M + 'leave-options/encashment-approvals', icon: 'price_check', perms: ['change_leaveencashment', 'view_leaveencashment', 'finance_check_leaveencashment', 'approve_leaveencashment_final'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Leave policies (UAE)', hint: 'Employee-wise leave policies, accrual and leave year end', link: M + 'leave-options/leave-policies', icon: 'policy', perms: ['view_leave_type', 'view_leavepolicy'] },
            { label: 'Leave types', link: M + 'leave-options/leave-master', icon: 'category', perms: ['view_leave_type'] },
            { label: 'Leave entitlements (old)', hint: 'Older per-leave-type rules, used only for leave types that no leave policy covers – use Leave policies (UAE)', link: M + 'leave-options/leave-policy', icon: 'rule', perms: ['view_leave_type'] },   // v1.15.1 (was "Leave policy")
            { label: 'Approval levels', link: M + 'leave-options/leave-approval-level', icon: 'approval', perms: ['view_leaveapprovallevels'] },
            { label: 'Escalation', link: M + 'leave-options/leave-escalation', icon: 'trending_up', perms: ['view_leave_escalation'] },
            // v1.26.0: "Accrual test" (developer tool) removed from the menu – the address still opens for support
          ] },
        ],
      },
    ],
  },
  {
    title: 'Pay', apps: [
      {
        key: 'payroll', label: 'Payroll', icon: 'payments', parents: ['salary-options'], country: 'app:payroll',   // v1.23.0 Payroll is its own app
        sections: [
          { title: 'Daily work', items: [
            { label: 'Payroll runs', link: M + 'salary-options/pay-roll', icon: 'payments', perms: ['view_payrollrun'] },
            { label: 'AI payroll auditor', hint: 'Audit a run before approval – every exception explained', link: M + 'zeo-ai/payroll-auditor', icon: 'fact_check', perms: ['view_payrollrun', 'change_payrollrun'] },   // v1.37.0
            { label: 'Payslip approvals', link: M + 'salary-options/payslip-approval', icon: 'receipt_long', perms: ['view_payslipapproval', 'approver_payslipapproval'] },
            { label: 'WPS file', link: M + 'salary-options/wps', icon: 'account_balance', perms: ['view_wps'], country: 'wps_sif' },   // v1.14.0
          ] },
          { title: 'Accounting', items: [   // v1.35.0
            { label: 'Accounting journals', hint: 'Odoo, Zoho Books, Excel / CSV, ZEO API – department and employee posting', link: M + 'salary-options/accounting', icon: 'account_balance_wallet', perms: ['view_accounting', 'post_accounting', 'manage_accounting'] },
          ] },
          { title: 'Salaries', items: [
            { label: 'Employee salary', link: M + 'salary-options/employee-salary', icon: 'badge', perms: ['view_employeesalarystructure'] },
            { label: 'Pay structure', link: M + 'salary-options/pay-structure', icon: 'schema', perms: ['view_paystructure'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Salary components', link: M + 'salary-options/salary', icon: 'extension', perms: ['view_salarycomponent'] },
            { label: 'Salary structures', link: M + 'salary-options/salary-structure', icon: 'account_tree', perms: ['view_salarycomponent'] },
            { label: 'Approval levels', link: M + 'salary-options/payroll-approval-level', icon: 'approval', perms: ['view_payslipcommonworkflow'] },
            { label: 'Payroll controls', hint: 'Segregation of duties, WPS and settlement deadlines', link: M + 'salary-options/payroll-controls', icon: 'admin_panel_settings', perms: ['change_payrollplussettings', 'view_payrollplussettings', 'change_payrollrun'] },   // v1.18.0
            { label: 'Statutory schemes', hint: 'Social security, PF, ESI, tax of the company country', link: M + 'salary-options/statutory-schemes', icon: 'account_balance', perms: ['view_salarycomponent', 'change_payrollplussettings'] },   // v1.31.0
          ] },
        ],
      },
      {
        key: 'expense', label: 'Expenses', icon: 'receipt_long', link: M + 'expense-options', parents: ['expense-options'],   // v1.11.0
      },
      {
        key: 'benefits', label: 'Loans & Benefits', icon: 'savings', parents: ['loan-sidebar', 'air-ticket-options'],
        sections: [
          { title: 'Loans', items: [
            { label: 'Loan requests', link: M + 'loan-sidebar/loan-application', icon: 'request_quote', perms: ['view_loanapplication'], country: 'app:payroll' },
            { label: 'Loan approvals', link: M + 'loan-sidebar/loan-approval', icon: 'fact_check', perms: ['view_loanapproval', 'approver_loanapproval'], country: 'app:payroll' },
            { label: 'Loan repayments', link: M + 'loan-sidebar/loan-repayment', icon: 'price_check', perms: ['view_loanrepayment'], country: 'app:payroll' },
          ] },
          { title: 'Advance salary', items: [
            { label: 'Advance requests', link: M + 'salary-options/advance-salary-request', icon: 'request_quote', perms: ['view_advancesalaryrequest'], country: 'app:payroll' },
            { label: 'Advance approvals', link: M + 'salary-options/advance-salary-approvals', icon: 'fact_check', perms: ['view_advancesalaryapproval', 'approver_advancesalaryapproval'], country: 'app:payroll' },
          ] },
          { title: 'Air tickets', items: [
            { label: 'Air ticket requests', link: M + 'air-ticket-options/airticket-request', icon: 'flight_takeoff', perms: ['view_airticketrequest'] },
            { label: 'Air ticket approvals', link: M + 'air-ticket-options/airticket-approvals', icon: 'fact_check', perms: ['view_airticketapproval', 'approver_airticketapproval'] },
            { label: 'Air ticket allocation', link: M + 'air-ticket-options/airticket-allocation', icon: 'confirmation_number', perms: ['view_airticketallocation'] },
          ] },
          { title: 'Loan setup', collapsed: true, items: [
            { label: 'Loan types', link: M + 'loan-sidebar/loan-type', icon: 'account_balance', perms: ['view_loantype'], country: 'app:payroll' },
            { label: 'Approval levels', link: M + 'loan-sidebar/loan-approval-level', icon: 'approval', perms: ['view_loancommonworkflow'], country: 'app:payroll' },
            { label: 'Escalation', link: M + 'loan-sidebar/loan-escalation', icon: 'trending_up', perms: ['view_loan_escalation'], country: 'app:payroll' },
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
        key: 'assets', label: 'Assets', icon: 'inventory_2', link: M + 'asset-plus', parents: ['asset-plus', 'asset-options'],   // v1.12.0
        sections: [
          { title: 'My assets', items: [
            { label: 'My assets', link: M + 'asset-plus/my-assets', icon: 'badge' },
          ] },
          { title: 'Daily work', items: [
            { label: 'Home', link: M + 'asset-plus/home', icon: 'home', perms: ['view_asset'] },
            { label: 'Asset register', link: M + 'asset-plus/register', icon: 'inventory_2', perms: ['view_asset'] },
            { label: 'Allocations', link: M + 'asset-plus/allocations', icon: 'assignment_ind', perms: ['view_assetallocation'] },
            { label: 'Transfers', link: M + 'asset-plus/transfers', icon: 'swap_horiz', perms: ['view_assetallocation', 'view_assettransfer'] },
            { label: 'Returns', link: M + 'asset-plus/returns', icon: 'keyboard_return', perms: ['view_assetallocation'] },
            { label: 'Maintenance', link: M + 'asset-plus/maintenance', icon: 'build', perms: ['view_asset', 'view_maintenancerecord'] },
            { label: 'Asset requests', link: M + 'asset-options/asset-request', icon: 'request_quote', perms: ['view_assetrequest'] },
          ] },
          { title: 'Incidents & exits', items: [
            { label: 'Damage', link: M + 'asset-plus/damages', icon: 'report_problem', perms: ['view_asset', 'view_assetdamage'] },
            { label: 'Lost / stolen', link: M + 'asset-plus/losses', icon: 'location_off', perms: ['view_asset', 'view_assetloss'] },
            { label: 'Disposals', link: M + 'asset-plus/disposals', icon: 'delete_sweep', perms: ['view_asset', 'view_assetdisposal'] },
            { label: 'Recoveries', link: M + 'asset-plus/recoveries', icon: 'payments', perms: ['view_asset', 'view_payrollrun'] },
            { label: 'Exit clearance', link: M + 'asset-plus/clearance', icon: 'how_to_reg', perms: ['view_assetallocation', 'view_endofservice'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Asset request approvals', link: M + 'asset-options/asset-approval', icon: 'fact_check', perms: ['view_assetapproval', 'approver_assetapproval'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Asset settings & codes', link: M + 'asset-plus/settings', icon: 'tune', perms: ['view_assettype'] },
            { label: 'Asset types', link: M + 'asset-options/asset-type', icon: 'category', perms: ['view_assettype'] },
            { label: 'Asset form designer', link: M + 'settings/asset-udf', icon: 'dynamic_form', perms: ['view_assetcustomfield'] },
            { label: 'Field help', link: M + 'settings/field-help', icon: 'help_center' },      // v1.16.0
            { label: 'Approval levels', link: M + 'asset-options/asset-approval-level', icon: 'approval', perms: ['view_assetapprovallevel'] },
            { label: 'Escalation', link: M + 'asset-options/asset-escalation', icon: 'trending_up', perms: ['view_asset_escalation'] },
          ] },
        ],
      },
    ],
  },
  {
    title: 'AI assistants', apps: [   // v1.37.0: built-in assistants on the company's own records – advise, never decide
      { key: 'ai', label: 'AI assistants', icon: 'auto_awesome', parents: ['zeo-ai'], sections: [
        { title: 'Assistants', items: [
          { label: 'Payroll auditor', hint: 'Unusual changes, duplicates, missing deductions – before approval', link: M + 'zeo-ai/payroll', icon: 'fact_check', perms: ['view_payrollrun', 'change_payrollrun'] },
          { label: 'Attendance & shifts', hint: 'Repeated lates, coverage gaps, overtime forecast, replacements, roster', link: M + 'zeo-ai/attendance', icon: 'schedule' },
          { label: 'Recruitment', hint: 'CV reading, skill match, job descriptions, interview questions, time-to-hire', link: M + 'zeo-ai/recruitment', icon: 'person_search', perms: ['view_candidate', 'view_application', 'view_jobopening'] },
          { label: 'Performance & development', hint: 'Review summaries, skill gaps, courses, objectives, development plans', link: M + 'zeo-ai/performance', icon: 'school' },
          { label: 'Workforce analytics', hint: 'Headcount and budget forecasts, turnover hot-spots, hiring needs, cost comparison, questions', link: M + 'zeo-ai/workforce', icon: 'insights' },
        ] },
        { title: 'Setup', collapsed: true, items: [
          { label: 'Assistant settings', hint: 'Thresholds and approval gate', link: M + 'zeo-ai/settings', icon: 'tune', perms: ['change_payrollrun', 'view_payrollrun'] },
          { label: 'External AI (optional)', link: M + 'settings/ai-settings', icon: 'smart_toy', perms: ['*admin'] },
        ] },
      ] },
    ],
  },
  {
    title: 'Talent', apps: [
      { key: 'performance', label: 'Performance', icon: 'speed', link: M + 'performance-options', parents: ['performance-options'], perms: ['view_kpi', 'view_appraisalcycle', 'view_goalsheet', 'view_appraisaltemplate'] },
      { key: 'recruitment', label: 'Recruitment', icon: 'person_add', link: M + 'recruitment-options', parents: ['recruitment-options'], perms: ['view_manpowerrequisition', 'view_jobopening', 'view_candidate'] },
      { key: 'learning', label: 'Learning', icon: 'school', link: M + 'learning-options', parents: ['learning-options'] },   // v1.11.0: everyone (My learning); pages check rights
    ],
  },
  {
    title: 'Reports & setup', apps: [
      {
        key: 'reports', label: 'Reports', icon: 'query_stats', parents: ['report-options'],
        sections: [
          { title: 'People', items: [
            { label: 'Employees', link: M + 'report-options/r/employees', icon: 'badge', perms: ['view_report', 'view_emp_master'] },
            { label: 'Headcount and turnover', link: M + 'report-options/r/headcount', icon: 'groups', perms: ['view_report', 'view_emp_master'] },
            { label: 'Joiners and leavers', link: M + 'report-options/r/joiners-leavers', icon: 'sync', perms: ['view_report', 'view_emp_master'] },
            { label: 'Probation due', link: M + 'report-options/r/probation', icon: 'hourglass_empty', perms: ['view_report', 'view_emp_master'] },
            { label: 'Birthdays and anniversaries', link: M + 'report-options/r/birthdays', icon: 'celebration', perms: ['view_report', 'view_emp_master'] },
            { label: 'Departments', link: M + 'report-options/r/departments', icon: 'corporate_fare', perms: ['view_dept_report', 'view_dept_master'] },
            { label: 'Designations', link: M + 'report-options/r/designations', icon: 'work', perms: ['view_designtn_report', 'view_desgntn_master'] },
            { label: 'Categories', link: M + 'report-options/r/categories', icon: 'category', perms: ['view_ctgry_master'] },
            { label: 'Documents and expiry', link: M + 'report-options/r/documents', icon: 'folder_shared', perms: ['view_doc_report', 'view_emp_documents'] },
            { label: 'Headcount by location', link: M + 'report-options/r/location', icon: 'location_on', perms: ['view_report', 'view_emp_master'] },
            { label: 'Employee demographics', link: M + 'report-options/r/demographics', icon: 'diversity_3', perms: ['view_report', 'view_emp_master'] },
            { label: 'Turnover trend (monthly)', link: M + 'report-options/r/turnover-trend', icon: 'show_chart', perms: ['view_report', 'view_emp_master'] },
          ] },
          { title: 'Leave & attendance', items: [
            { label: 'Leave requests', link: M + 'report-options/r/leave', icon: 'event_busy', perms: ['view_leavereport', 'view_employee_leave_request'] },
            { label: 'Leave approvals', link: M + 'report-options/r/leave-approvals', icon: 'event_available', perms: ['view_leaveapprovalreport', 'view_leaveapproval'] },
            { label: 'Leave statement', link: M + 'report-options/r/leave-statement', icon: 'receipt_long', perms: ['view_lvbalancereport', 'view_emp_leave_balance'] },
            { label: 'Leave encashment', link: M + 'report-options/r/leave-encashment', icon: 'payments', perms: ['view_leaveencashment', 'view_lvbalancereport'] },
            { label: 'Leave balance', link: M + 'report-options/r/leave-balance', icon: 'account_balance_wallet', perms: ['view_lvbalancereport', 'view_emp_leave_balance'] },
            { label: 'Attendance summary (monthly)', link: M + 'report-options/r/attendance-summary', icon: 'table_chart', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Attendance (daily)', link: M + 'report-options/r/attendance', icon: 'fact_check', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Attendance register', link: M + 'report-options/r/attendance-register', icon: 'grid_on', perms: ['view_attendancereport', 'view_attendance'] },   // v1.16.0
            { label: 'Late in and early out (days)', link: M + 'report-options/r/attendance-late-early', icon: 'timer_off', perms: ['view_attendancereport', 'view_attendance'] },   // v1.16.0
            { label: 'Overtime summary', link: M + 'report-options/r/overtime-summary', icon: 'more_time', perms: ['view_employeeovertime', 'view_attendancereport'] },   // v1.16.0
            { label: 'Late in / early out', link: M + 'report-options/r/late-early', icon: 'schedule', perms: ['view_lateinearlyoutrequest', 'view_attendancereport'] },
            { label: 'Overtime', link: M + 'report-options/r/overtime', icon: 'more_time', perms: ['view_employeeovertime', 'view_attendancereport'] },
            { label: 'Missing punches', link: M + 'report-options/r/missing-punch', icon: 'fingerprint', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Late arrivals', link: M + 'report-options/r/late-arrivals', icon: 'alarm', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Early departures', link: M + 'report-options/r/early-departures', icon: 'directions_run', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Absence', link: M + 'report-options/r/absence', icon: 'person_off', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Leave by department', link: M + 'report-options/r/department-leave', icon: 'corporate_fare', perms: ['view_leavereport', 'view_employee_leave_request'] },
            { label: 'Daily attendance status', link: M + 'report-options/r/att-daily-status', icon: 'fact_check', perms: ['view_attendance', 'view_attendancereport'] },   // v1.12.0
            { label: 'Late & early (rules)', link: M + 'report-options/r/att-late-early', icon: 'alarm', perms: ['view_attendance', 'view_attendancereport'] },   // v1.12.0
            { label: 'Missing punches (rules)', link: M + 'report-options/r/att-missing-punch', icon: 'running_with_errors', perms: ['view_attendance', 'view_attendancereport'] },   // v1.12.0
            { label: 'Attendance corrections', link: M + 'report-options/r/att-corrections', icon: 'edit_calendar', perms: ['view_attendance', 'view_attendancereport'] },   // v1.12.0
            { label: 'Shift roster', link: M + 'report-options/r/shift-roster', icon: 'calendar_view_week', perms: ['view_rosterperiod', 'view_shift'] },   // v1.12.0
            { label: 'Shift requests', link: M + 'report-options/r/shift-requests', icon: 'swap_horiz', perms: ['view_shiftrequest', 'view_shift'] },   // v1.12.0
          ] },
          { title: 'Payroll', items: [
            { label: 'Payroll register', link: M + 'report-options/r/payroll-register', icon: 'receipt_long', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'Payroll by department', link: M + 'report-options/r/payroll-department', icon: 'account_tree', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },   // v1.16.0
            { label: 'Payroll summary by component', link: M + 'report-options/r/payroll-components', icon: 'view_column', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },   // v1.16.0
            { label: 'Bank / WPS transfer list', link: M + 'report-options/r/bank-transfer', icon: 'account_balance', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },   // v1.16.0
            { label: 'Payroll month over month', link: M + 'report-options/r/payroll-mom', icon: 'compare_arrows', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },   // v1.16.0
            { label: 'Payslip status', link: M + 'report-options/r/payslip-status', icon: 'fact_check', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },   // v1.16.0
            { label: 'WPS salary file data', link: M + 'report-options/r/wps', icon: 'account_balance', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll,wps_sif' },   // v1.14.0
            { label: 'Salary by employee', link: M + 'report-options/r/salary', icon: 'payments', perms: ['view_employeesalarystructure', 'view_payslip'], country: 'app:payroll' },
            { label: 'Salary revisions', link: M + 'report-options/r/salary-revisions', icon: 'trending_up', perms: ['view_salaryrevisionhistory', 'view_employeesalarystructure'], country: 'app:payroll' },
            { label: 'Gratuity accrual', link: M + 'report-options/r/gratuity', icon: 'savings', perms: ['view_employeesalarystructure', 'view_payslip'], country: 'app:payroll,gratuity' },   // v1.14.0
            { label: 'Leave liability', link: M + 'report-options/r/leave-liability', icon: 'weekend', perms: ['view_employeesalarystructure', 'view_payslip'], country: 'app:payroll' },
            { label: 'Loans outstanding', link: M + 'report-options/r/loans', icon: 'request_quote', perms: ['view_loanapplication'], country: 'app:payroll' },
            { label: 'Advance salary', link: M + 'report-options/r/advances', icon: 'price_check', perms: ['view_advancesalaryrequest'], country: 'app:payroll' },
            { label: 'Air tickets', link: M + 'report-options/r/air-tickets', icon: 'flight_takeoff', perms: ['view_airticketallocation', 'view_airticketrequest'], country: 'app:payroll' },
            { label: 'Allowance register', link: M + 'report-options/r/allowance-register', icon: 'add_card', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'Deduction register', link: M + 'report-options/r/deduction-register', icon: 'remove_circle_outline', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'Overtime pay', link: M + 'report-options/r/overtime-pay', icon: 'more_time', perms: ['view_payslip', 'view_employeeovertime'], country: 'app:payroll' },
            { label: 'Payroll cost (employer)', link: M + 'report-options/r/payroll-cost', icon: 'account_balance_wallet', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'Department cost', link: M + 'report-options/r/department-cost', icon: 'pie_chart', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'Payroll variance', link: M + 'report-options/r/payroll-variance', icon: 'compare_arrows', perms: ['view_payslip', 'view_payrollrun'], country: 'app:payroll' },
            { label: 'WPS payment status', link: M + 'report-options/r/wps-status', icon: 'event_available', perms: ['view_payrollrun'], country: 'app:payroll' },   // v1.18.0
          ] },
          { title: 'Requests, exits & assets', items: [
            { label: 'General requests', link: M + 'report-options/r/general-requests', icon: 'assignment', perms: ['view_generalrequestreport', 'view_generalrequest'] },
            { label: 'Resignations and end of service', link: M + 'report-options/r/exits', icon: 'logout', perms: ['view_employeeresignation', 'view_endofservice'] },
            { label: 'Final settlements', link: M + 'report-options/r/final-settlements', icon: 'request_quote', perms: ['view_exitsettlement', 'view_endofservice'] },   // v1.18.0
            { label: 'Assets', link: M + 'report-options/r/assets', icon: 'inventory_2', perms: ['view_assetreport', 'view_asset'] },
            { label: 'Asset transactions', link: M + 'report-options/r/asset-transactions', icon: 'assignment_return', perms: ['view_assettransactionreport', 'view_assetallocation'] },
            { label: 'Asset register (book value)', link: M + 'report-options/r/asset-register', icon: 'inventory_2', perms: ['view_asset'] },   // v1.12.0
            { label: 'Maintenance due', link: M + 'report-options/r/asset-maintenance-due', icon: 'build', perms: ['view_asset'] },   // v1.12.0
            { label: 'Asset verification due', link: M + 'report-options/r/asset-verification', icon: 'fact_check', perms: ['view_asset'] },   // v1.18.0
            { label: 'Assets by employee', link: M + 'report-options/r/assets-by-employee', icon: 'badge', perms: ['view_asset'] },   // v1.12.0
            { label: 'Damage and loss recovery', link: M + 'report-options/r/asset-recovery', icon: 'payments', perms: ['view_asset'] },   // v1.12.0
            { label: 'Disposals – gain / loss', link: M + 'report-options/r/asset-disposals', icon: 'delete_sweep', perms: ['view_asset'] },   // v1.12.0
          ] },
          { title: 'Talent', items: [
            { label: 'Appraisal results', link: M + 'report-options/r/appraisals', icon: 'star_half', perms: ['view_goalsheet', 'view_appraisaloutcome'] },
            { label: 'Recruitment pipeline', link: M + 'report-options/r/recruitment', icon: 'person_add', perms: ['view_jobopening', 'view_application'] },
            { label: 'Training', link: M + 'report-options/r/training', icon: 'school', perms: ['view_nomination', 'view_trainingsession'] },
            { label: 'Certificates and expiry', link: M + 'report-options/r/certificates', icon: 'workspace_premium', perms: ['view_certificate'] },
            { label: 'Candidates', link: M + 'report-options/r/candidates', icon: 'badge', perms: ['view_candidate', 'view_application'] },
            { label: 'Time to hire', link: M + 'report-options/r/time-to-hire', icon: 'timer', perms: ['view_application', 'view_offer', 'view_jobopening'] },
            { label: 'Time to fill', link: M + 'report-options/r/time-to-fill', icon: 'hourglass_bottom', perms: ['view_jobopening', 'view_manpowerrequisition'] },
            { label: 'Cost per hire', link: M + 'report-options/r/cost-per-hire', icon: 'paid', perms: ['view_jobopening', 'view_offer'] },
            { label: 'Source effectiveness', link: M + 'report-options/r/source-effectiveness', icon: 'hub', perms: ['view_candidate', 'view_application'] },
            { label: 'KPI report', link: M + 'report-options/r/kpi', icon: 'track_changes', perms: ['view_goalsheet', 'view_kpi'] },
            { label: 'Goal achievement', link: M + 'report-options/r/goal-achievement', icon: 'flag', perms: ['view_goalsheet'] },
            { label: 'Department performance', link: M + 'report-options/r/department-performance', icon: 'leaderboard', perms: ['view_goalsheet', 'view_appraisaloutcome'] },
          ] },
        ],
      },
      {
        // v1.20.0: HR-only settings (the company-wide ones moved to the Settings app)
        key: 'hrsettings', label: 'HR settings', icon: 'tune',
        sections: [
          { title: 'Notifications', items: [
            { label: 'Doc. expiry alerts', hint: 'Document expiry notifications', link: M + 'settings/notification-settings', icon: 'notifications_active', perms: ['view_notificationsettings'] },
          ] },
          { title: 'E-mail templates', items: [
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
  // ================================================================ v1.20.0 Projects app (ZEO Projects add-on 1.15.0, merged)
  {
    title: 'Projects', suite: 'projects', apps: [
      { key: 'pj-dashboard', label: 'Dashboard', icon: 'analytics', parents: ['zeo-projects'], sections: [
        { title: 'Overview', items: [
          { label: 'Dashboard', hint: 'Support, AMC, projects and workload', link: Z + 'dashboard', icon: 'analytics',
            perms: ['view_ticket', 'assign_ticket', 'view_amccontract', 'view_projectprofile', 'view_projectfinance'] },
        ] },
      ] },
      { key: 'pj-mywork', label: 'My work', icon: 'work_history', sections: [
        { title: 'My work', items: [
          { label: 'My work', hint: 'My tickets, time and approvals', link: Z + 'my-work', icon: 'work_history' },
          { label: 'IT helpdesk', hint: 'Raise and follow your own requests', link: Z + 'helpdesk', icon: 'support_agent' },
          { label: 'My timesheet', link: M + 'project-options/my-timesheet', icon: 'timer' },
        ] },
      ] },
      { key: 'pj-support', label: 'Support', icon: 'confirmation_number', sections: [
        { title: 'Support', items: [
          { label: 'Tickets', link: Z + 'tickets', icon: 'confirmation_number', perms: ['view_ticket', 'work_ticket', 'assign_ticket', 'add_ticket'] },
          { label: 'Development requests', link: Z + 'dev-requests', icon: 'code',
            perms: ['view_devrequest', 'add_devrequest', 'approve_tech_devrequest', 'approve_commercial_devrequest', 'work_ticket'] },
          { label: 'Work log approvals', link: Z + 'worklogs', icon: 'fact_check', perms: ['approve_worklog', 'assign_ticket'] },
        ] },
      ] },
      { key: 'pj-customers', label: 'Customers & AMC', icon: 'apartment', sections: [
        { title: 'Customers & AMC', items: [
          { label: 'Customers', link: Z + 'customers', icon: 'apartment', perms: ['view_customer'] },
          { label: 'AMC contracts', link: Z + 'contracts', icon: 'verified', perms: ['view_amccontract'] },
          { label: 'Renewals', hint: 'Contracts ending in 90 days or expired', link: Z + 'renewals', icon: 'autorenew', perms: ['view_amccontract'] },
          { label: 'Billing', hint: 'AMC instalments and milestones to invoice', link: Z + 'billing', icon: 'receipt_long', perms: ['view_amcbilling', 'view_projectfinance'] },
        ] },
      ] },
      { key: 'pj-delivery', label: 'Delivery', icon: 'account_tree', parents: ['project-options'], sections: [
        { title: 'Delivery', items: [
          { label: 'Projects', hint: 'Milestones, changes, risks, profitability', link: Z + 'projects', icon: 'account_tree' },
          { label: 'Tasks', link: M + 'project-options/project-tasks', icon: 'assignment_turned_in', perms: ['view_task'] },
          { label: 'Timesheet approvals', link: M + 'project-options/timesheet-approvals', icon: 'fact_check' },
          { label: 'Timesheets', link: M + 'project-options/project-timesheet', icon: 'schedule', perms: ['view_timesheet'] },
          { label: 'Project costing', link: M + 'project-options/project-costing', icon: 'paid' },
          { label: 'Plan templates', hint: 'Standard project plans per product', link: Z + 'plan-templates', icon: 'library_books',
            perms: ['change_project', 'change_projectprofile', 'change_projectssettings'] },
        ] },
      ] },
      { key: 'pj-reports', label: 'Reports', icon: 'summarize', sections: [
        // v1.22.0: in the HRMS report centre (period, branches, Excel / PDF, group by, favourites, e-mail, drill-down)
        { title: 'Support', items: [
          { label: 'Open tickets', link: RC + 'pj-open-tickets', icon: 'confirmation_number', perms: PJ_SUPPORT },
          { label: 'Received vs resolved', link: RC + 'pj-received-resolved', icon: 'stacked_line_chart', perms: PJ_SUPPORT },
          { label: 'Response and resolution times', link: RC + 'pj-response-times', icon: 'timer', perms: PJ_SUPPORT },
          { label: 'SLA breached tickets', link: RC + 'pj-sla-breaches', icon: 'warning', perms: PJ_SUPPORT },
          { label: 'Reopened tickets and satisfaction', link: RC + 'pj-reopened-csat', icon: 'sentiment_satisfied', perms: PJ_SUPPORT },
        ] },
        { title: 'AMC', items: [
          { label: 'AMC hours, billing and profit', link: RC + 'pj-amc-profit', icon: 'verified', perms: ['view_amccontract'] },
          { label: 'Contracts expiring', link: RC + 'pj-amc-expiring', icon: 'event_busy', perms: ['view_amccontract'] },
          { label: 'Renewals won, lost and pending', link: RC + 'pj-amc-renewals', icon: 'autorenew', perms: ['view_amccontract'] },
        ] },
        { title: 'Delivery and people', items: [
          { label: 'Project status, budget and margin', link: RC + 'pj-project-status', icon: 'account_tree', perms: PJ_ANY },
          { label: 'Overdue milestones', link: RC + 'pj-milestones-overdue', icon: 'flag', perms: PJ_ANY },
          { label: 'Pending tasks by employee', link: RC + 'pj-tasks-by-employee', icon: 'assignment_late', perms: PJ_ANY },
          { label: 'Employee utilisation', link: RC + 'pj-utilisation', icon: 'speed', perms: PJ_ANY },
          { label: 'Work logs waiting for approval', link: RC + 'pj-worklogs-pending', icon: 'fact_check', perms: PJ_ANY },
          { label: 'Work history (send to the customer)', hint: 'PDF and Excel for a customer, AMC or project', link: Z + 'reports', icon: 'history', perms: PJ_ANY },
        ] },
        { title: 'Timesheets and cost', items: [
              { label: 'Timesheet hours', link: M + 'report-options/r/timesheets', icon: 'access_time', perms: ['view_timesheet'] },

              { label: 'Timesheet entries', link: M + 'report-options/r/project-entries', icon: 'list_alt', perms: ['view_timesheet'] },

              { label: 'Project hours', link: M + 'report-options/r/project-hours', icon: 'schedule', perms: ['view_timesheet', 'view_projectfinance'] },

              { label: 'Project cost', link: M + 'report-options/r/project-cost', icon: 'payments', perms: ['view_projectfinance'] },

              { label: 'Employee cost', link: M + 'report-options/r/employee-cost', icon: 'person', perms: ['view_projectfinance'] },

              { label: 'Project profitability', link: M + 'report-options/r/project-profitability', icon: 'trending_up', perms: ['view_projectfinance'] },

              { label: 'Timesheet approvals', link: M + 'report-options/r/timesheet-approvals', icon: 'fact_check', perms: ['view_timesheet'] },

              { label: 'Billable vs non-billable', link: M + 'report-options/r/billable-hours', icon: 'price_check', perms: ['view_timesheet', 'view_projectfinance'] },

        ] },
      ] },
      { key: 'pj-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'Projects settings', hint: 'SLA, teams, products, categories, portal, mailbox', link: Z + 'setup', icon: 'tune',
            perms: ['change_projectssettings', 'change_slapolicy', 'change_supportteam'] },
          { label: 'Notifications', hint: 'Company e-mail and to-do settings', link: Z + 'notifications', icon: 'notifications', perms: ['change_projectssettings'] },
          { label: 'Project stages', link: M + 'project-options/project-stages', icon: 'view_kanban', perms: ['view_projectstage'] },
          { label: 'Project master (basic list)', link: M + 'project-options/project-master', icon: 'list', perms: ['view_project'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.21.0 CRM app (ZEO app kit, add-on 1.18.0 merged)
  {
    title: 'CRM', suite: 'crm', apps: [
      { key: 'crm-home', label: 'CRM home', icon: 'home', parents: ['zeo-crm'], sections: [
        { title: 'Overview', items: [
          { label: 'CRM home', hint: 'Pipeline, follow-ups, viewings', link: CRM + 'home', icon: 'home', perms: CRM_ALL },
        ] },
      ] },
      { key: 'crm-sales', label: 'Sales', icon: 'trending_up', sections: [
        { title: 'Sales', items: [
          { label: 'Leads', hint: 'New enquiries – score, qualify, convert', link: CRM + 'r/lead', icon: 'person_add', perms: CRM_ALL },
          { label: 'Opportunities', hint: 'List or board by stage', link: CRM + 'r/opportunity', icon: 'trending_up', perms: CRM_ALL },
          { label: 'Quotations', hint: 'Priced offers with product lines', link: CRM + 'r/quotation', icon: 'request_quote', perms: CRM_ALL },
          { label: 'Sales orders', link: CRM + 'r/sales_order', icon: 'shopping_cart', perms: CRM_ALL },
          { label: 'Activities', hint: 'Calls, e-mails, meetings, tasks – list or calendar', link: CRM + 'r/activity', icon: 'call', perms: CRM_ALL },
          { label: 'Sales targets', link: CRM + 'r/target', icon: 'flag', perms: CRM_ALL },
        ] },
        { title: 'Customers', items: [
          { label: 'Accounts', hint: 'Companies you sell to', link: CRM + 'r/account', icon: 'business', perms: CRM_ALL },
          { label: 'Contacts', hint: 'People in the accounts', link: CRM + 'r/contact', icon: 'contacts', perms: CRM_ALL },
        ] },
        { title: 'Property', items: [
          { label: 'Viewings', link: CRM + 'r/viewing', icon: 'event_seat', perms: CRM_ALL },
          { label: 'Offers', link: CRM + 'r/offer', icon: 'local_offer', perms: CRM_ALL },
          { label: 'Listings', link: CRM + 'r/listing', icon: 'storefront', perms: CRM_ALL },
        ] },
      ] },
      { key: 'crm-masters', label: 'Masters', icon: 'inventory_2', sections: [
        { title: 'Products and prices', items: [
          { label: 'Products', hint: 'Goods and services (shared with Sales / Inventory)', link: CRM + 'r/product', icon: 'inventory_2', perms: CRM_ALL },
          { label: 'Product categories', link: CRM + 'r/product_category', icon: 'category', perms: CRM_ALL },
          { label: 'Price books', hint: 'Customer-group prices and quantity breaks', link: CRM + 'r/price_book', icon: 'menu_book', perms: CRM_ALL },
          { label: 'Units of measure', link: CRM + 'r/uom', icon: 'straighten', perms: CRM_ALL },
        ] },
        { title: 'Terms', items: [
          { label: 'Tax codes', hint: 'VAT / GST rates of the country', link: CRM + 'r/tax_code', icon: 'percent', perms: CRM_ALL },
          { label: 'Payment terms', link: CRM + 'r/payment_term', icon: 'schedule', perms: CRM_ALL },
        ] },
      ] },
      { key: 'crm-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Analysis', items: [
          { label: 'Sales pipeline by stage', link: RC + 'crm-pipeline', icon: 'view_kanban', perms: CRM_ALL },
          { label: 'Sales forecast', hint: 'Weighted by stage probability', link: RC + 'crm-forecast', icon: 'insights', perms: CRM_ALL },
          { label: 'Targets vs actual', link: RC + 'crm-targets', icon: 'flag', perms: CRM_ALL },
          { label: 'Won and lost by agent', link: RC + 'crm-agents', icon: 'leaderboard', perms: CRM_ALL },
          { label: 'Quotations by agent', link: RC + 'crm-quotations-agent', icon: 'request_quote', perms: CRM_ALL },
          { label: 'Sales by product', link: RC + 'crm-products', icon: 'inventory_2', perms: CRM_ALL },
          { label: 'Lead funnel by source and campaign', link: RC + 'crm-leads-funnel', icon: 'filter_alt', perms: CRM_ALL },
          { label: 'Lead source effectiveness', link: RC + 'crm-sources', icon: 'input', perms: CRM_ALL },
          { label: 'Lost to competitors', link: RC + 'crm-competitors', icon: 'sports_kabaddi', perms: CRM_ALL },
        ] },
        { title: 'Registers', items: [
          { label: 'Leads', link: RC + 'crm-lead', icon: 'person_add', perms: CRM_ALL },
          { label: 'Opportunities', link: RC + 'crm-opportunity', icon: 'trending_up', perms: CRM_ALL },
          { label: 'Quotations', link: RC + 'crm-quotation', icon: 'request_quote', perms: CRM_ALL },
          { label: 'Sales orders', link: RC + 'crm-sales-order', icon: 'shopping_cart', perms: CRM_ALL },
          { label: 'Accounts', link: RC + 'crm-account', icon: 'business', perms: CRM_ALL },
          { label: 'Contacts', link: RC + 'crm-contact', icon: 'contacts', perms: CRM_ALL },
          { label: 'Activities', link: RC + 'crm-activity', icon: 'call', perms: CRM_ALL },
          { label: 'Sales targets', link: RC + 'crm-target', icon: 'flag', perms: CRM_ALL },
          { label: 'Viewings', link: RC + 'crm-viewing', icon: 'event_seat', perms: CRM_ALL },
          { label: 'Offers', link: RC + 'crm-offer', icon: 'local_offer', perms: CRM_ALL },
          { label: 'Listings', link: RC + 'crm-listing', icon: 'storefront', perms: CRM_ALL },
        ] },
      ] },
      { key: 'crm-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Pipeline', items: [
          { label: 'Pipelines and stages', link: CRM + 'r/pipeline', icon: 'view_kanban', perms: ['crm_manager'] },
          { label: 'Lead sources', link: CRM + 'r/source', icon: 'input', perms: ['crm_manager'] },
          { label: 'Lost reasons', link: CRM + 'r/lost_reason', icon: 'thumb_down', perms: ['crm_manager'] },
          { label: 'Campaigns', link: CRM + 'r/campaign', icon: 'campaign', perms: ['crm_manager', 'crm_team_lead'] },
          { label: 'Competitors', link: CRM + 'r/competitor', icon: 'sports_kabaddi', perms: ['crm_manager', 'crm_team_lead'] },
        ] },
        { title: 'Leads and territories', items: [
          { label: 'Lead score rules', hint: 'Points that qualify a lead', link: CRM + 'r/score_rule', icon: 'star_rate', perms: ['crm_manager'] },
          { label: 'Assignment rules', hint: 'Who gets a new lead', link: CRM + 'r/assignment_rule', icon: 'assignment_ind', perms: ['crm_manager'] },
          { label: 'Territories', link: CRM + 'r/territory', icon: 'map', perms: ['crm_manager'] },
          { label: 'CRM setup', hint: 'Industry pack, discount limit, quote terms, web form key, roles', link: CRM + 'setup', icon: 'tune', perms: ['crm_manager'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.21.0 Property app
  {
    title: 'Property', suite: 'property', apps: [
      { key: 'pr-home', label: 'Property home', icon: 'home', parents: ['zeo-property'], sections: [
        { title: 'Overview', items: [
          { label: 'Property home', hint: 'Occupancy, renewals, overdue', link: PR + 'home', icon: 'home', perms: PROP_ALL },
        ] },
      ] },
      { key: 'pr-portfolio', label: 'Portfolio', icon: 'domain', sections: [
        { title: 'Portfolio', items: [
          { label: 'Units', hint: 'List or board by status', link: PR + 'r/unit', icon: 'meeting_room', perms: PROP_ALL },
          { label: 'Buildings', link: PR + 'r/building', icon: 'domain', perms: PROP_ALL },
          { label: 'Owners', link: PR + 'r/owner', icon: 'person_outline', perms: PROP_ALL },
          { label: 'Management agreements', link: PR + 'r/agreement', icon: 'handshake', perms: PROP_ALL },
        ] },
      ] },
      { key: 'pr-leasing', label: 'Leasing & sales', icon: 'description', sections: [
        { title: 'Leasing and sales', items: [
          { label: 'Tenants and buyers', link: PR + 'r/party', icon: 'people', perms: PROP_ALL },
          { label: 'Reservations', link: PR + 'r/reservation', icon: 'bookmark', perms: PROP_ALL },
          { label: 'Leases', link: PR + 'r/lease', icon: 'description', perms: PROP_ALL },
          { label: 'Sale contracts', link: PR + 'r/sale', icon: 'sell', perms: PROP_ALL },
          { label: 'Move-outs', hint: 'Inspection and deposit settlement', link: PR + 'r/moveout', icon: 'logout', perms: PROP_ALL },
        ] },
      ] },
      { key: 'pr-finance', label: 'Finance', icon: 'receipt_long', sections: [
        { title: 'Finance', items: [
          { label: 'Billing records', hint: 'Export to your accounting system', link: PR + 'r/bill', icon: 'receipt_long', perms: PROP_ALL },
          { label: 'Receipts', link: PR + 'r/receipt', icon: 'payments', perms: ['prop_manager', 'prop_finance', 'prop_viewer'] },
          { label: 'Cheques', hint: 'Post-dated cheques', link: PR + 'r/cheque', icon: 'money', perms: PROP_ALL },
          { label: 'Commissions', link: PR + 'r/commission', icon: 'percent', perms: ['prop_manager', 'prop_commission', 'prop_finance', 'prop_leasing', 'prop_sales'] },
          { label: 'Owner statements', link: PR + 'r/statement', icon: 'summarize', perms: ['prop_manager', 'prop_finance', 'prop_viewer'] },
        ] },
      ] },
      { key: 'pr-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Analysis', items: [
          { label: 'Occupancy by building', link: RC + 'prop-occupancy', icon: 'apartment', perms: PROP_ALL },
          { label: 'Rent roll', link: RC + 'prop-rent-roll', icon: 'description', perms: PROP_ALL },
          { label: 'Aged receivables', link: RC + 'prop-aged', icon: 'hourglass_bottom', perms: ['prop_manager', 'prop_finance', 'prop_viewer'] },
        ] },
        { title: 'Registers', items: [
          { label: 'Units', link: RC + 'prop-unit', icon: 'meeting_room', perms: PROP_ALL },
          { label: 'Leases', link: RC + 'prop-lease', icon: 'description', perms: PROP_ALL },
          { label: 'Sale contracts', link: RC + 'prop-sale', icon: 'sell', perms: PROP_ALL },
          { label: 'Reservations', link: RC + 'prop-reservation', icon: 'bookmark', perms: PROP_ALL },
          { label: 'Billing records', link: RC + 'prop-bill', icon: 'receipt_long', perms: PROP_ALL },
          { label: 'Cheques', link: RC + 'prop-cheque', icon: 'money', perms: PROP_ALL },
          { label: 'Receipts', link: RC + 'prop-receipt', icon: 'payments', perms: ['prop_manager', 'prop_finance', 'prop_viewer'] },
          { label: 'Commissions', link: RC + 'prop-commission', icon: 'percent', perms: ['prop_manager', 'prop_commission', 'prop_finance'] },
        ] },
      ] },
      { key: 'pr-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'Unit types', link: PR + 'r/unit_type', icon: 'category', perms: ['prop_manager'] },
          { label: 'Charge types', link: PR + 'r/charge', icon: 'price_change', perms: ['prop_manager'] },
          { label: 'Handover checklist', link: PR + 'r/checklist', icon: 'checklist', perms: ['prop_manager'] },
          { label: 'Property setup', hint: 'Industry pack, settings, portal, links, roles', link: PR + 'setup', icon: 'tune', perms: ['prop_manager'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.21.0 Maintenance app
  {
    title: 'Maintenance', suite: 'maintenance', apps: [
      { key: 'mn-home', label: 'Maintenance home', icon: 'home', parents: ['zeo-maintenance'], sections: [
        { title: 'Overview', items: [
          { label: 'Maintenance home', hint: 'Open jobs, SLA, approvals', link: MN + 'home', icon: 'home' },
        ] },
      ] },
      { key: 'mn-work', label: 'Work', icon: 'construction', sections: [
        { title: 'Work', items: [
          { label: 'Work orders', hint: 'List or board by status', link: MN + 'r/work_order', icon: 'construction' },
          { label: 'Inspections', hint: 'Move-in, move-out, unit ready, snags', link: MN + 'r/inspection', icon: 'fact_check', perms: MNT_ALL },
        ] },
      ] },
      { key: 'mn-planning', label: 'Planning', icon: 'event_repeat', sections: [
        { title: 'Planning', items: [
          { label: 'Preventive plans', link: MN + 'r/plan', icon: 'event_repeat', perms: MNT_ALL },
          { label: 'Assets', link: MN + 'r/asset', icon: 'precision_manufacturing', perms: MNT_ALL },
          { label: 'Locations', link: MN + 'r/location', icon: 'place', perms: MNT_ALL },
          { label: 'Vendors', link: MN + 'r/vendor', icon: 'local_shipping', perms: MNT_ALL },
        ] },
      ] },
      { key: 'mn-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Analysis', items: [
          { label: 'Work orders by category and SLA', link: RC + 'mnt-sla', icon: 'timer', perms: MNT_ALL },
          { label: 'Technician workload', link: RC + 'mnt-technicians', icon: 'engineering', perms: MNT_ALL },
        ] },
        { title: 'Registers', items: [
          { label: 'Work orders', link: RC + 'mnt-work-order', icon: 'construction', perms: MNT_ALL },
          { label: 'Inspections', link: RC + 'mnt-inspection', icon: 'fact_check', perms: MNT_ALL },
          { label: 'Preventive plans', link: RC + 'mnt-plan', icon: 'event_repeat', perms: MNT_ALL },
          { label: 'Assets', link: RC + 'mnt-asset', icon: 'precision_manufacturing', perms: MNT_ALL },
        ] },
      ] },
      { key: 'mn-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'Categories and SLA', link: MN + 'r/category', icon: 'category', perms: ['mnt_manager'] },
          { label: 'Checklists', link: MN + 'r/checklist', icon: 'checklist', perms: ['mnt_manager'] },
          { label: 'Maintenance setup', hint: 'Industry pack, settings, links, roles', link: MN + 'setup', icon: 'tune', perms: ['mnt_manager'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.33.0 Asset Management app (one register with HR → Assets)
  {
    title: 'Asset Management', suite: 'assets', apps: [
      { key: 'am-home', label: 'Asset home', icon: 'home', parents: ['zeo-assets'], sections: [
        { title: 'Overview', items: [
          { label: 'Asset home', hint: 'Figures, overdue returns, warranties, my assets', link: AM + 'home', icon: 'home' },
          { label: 'Scan an asset', hint: 'Camera, USB scanner or typed code', link: AM + 'scan', icon: 'qr_code_scanner' },
          { label: 'Field (phone)', hint: 'My jobs, tickets with photo and GPS, counts – works offline', link: AM + 'field', icon: 'smartphone' },
        ] },
      ] },
      { key: 'am-register', label: 'Register', icon: 'inventory_2', sections: [
        { title: 'Assets', items: [
          { label: 'Assets', hint: 'Check out, move, transfer, reserve, dispose', link: AM + 'r/asset', icon: 'inventory_2' },
          { label: 'Reservations', hint: 'Bookings of pool assets', link: AM + 'r/reservation', icon: 'event_available' },
          { label: 'Movements', hint: 'Check-outs, check-ins, moves, transfers', link: AM + 'r/movement', icon: 'swap_horiz', perms: AST_ALL },
          { label: 'Print labels', hint: 'QR and barcode labels (PDF)', link: AM + 'labels', icon: 'qr_code_2', perms: AST_ALL },
        ] },
      ] },
      { key: 'am-maint', label: 'Maintenance', icon: 'build', sections: [
        { title: 'Maintenance', items: [
          { label: 'Work orders', hint: 'Preventive, corrective and breakdown work', link: AM + 'r/work_order', icon: 'construction', perms: AST_MNT },
          { label: 'Maintenance calendar', hint: 'Planned work by day', link: AM + 'calendar', icon: 'calendar_month', perms: AST_MNT },
          { label: 'Maintenance plans', hint: 'Recurring by date or meter', link: AM + 'r/plan', icon: 'event_repeat', perms: AST_MNT },
        ] },
      ] },
      { key: 'am-desk', label: 'Helpdesk', icon: 'support_agent', sections: [
        { title: 'Helpdesk', items: [
          { label: 'Tickets', hint: 'Breakdowns, complaints, incidents with SLA', link: AM + 'r/ticket', icon: 'support_agent' },
        ] },
      ] },
      { key: 'am-parts', label: 'Spare parts', icon: 'inventory', sections: [
        { title: 'Spare parts', items: [
          { label: 'Spare parts', hint: 'Parts and consumables, minimum stock', link: AM + 'r/part', icon: 'inventory', perms: AST_STORE },
          { label: 'Stock movements', hint: 'Receipts, issues, transfers', link: AM + 'r/stock_move', icon: 'sync_alt', perms: AST_STORE },
          { label: 'Part requests', hint: 'Technicians ask the store', link: AM + 'r/part_request', icon: 'assignment', perms: AST_STORE },
          { label: 'Stock counts', hint: 'Physical count of a store', link: AM + 'r/stock_count', icon: 'fact_check', perms: AST_STORE },
        ] },
      ] },
      { key: 'am-verify', label: 'Counts', icon: 'fact_check', sections: [
        { title: 'Physical verification', items: [
          { label: 'Asset counts', hint: 'Plan, scan, approve', link: AM + 'r/audit', icon: 'fact_check' },
          { label: 'Count lines', hint: 'Found, missing, misplaced', link: AM + 'r/audit_line', icon: 'checklist', perms: AST_ALL },
        ] },
      ] },
      { key: 'am-finance', label: 'Finance', icon: 'account_balance', sections: [
        { title: 'Fixed assets', items: [
          { label: 'Depreciation runs', hint: 'Calculate, post, export the journal', link: AM + 'r/depreciation', icon: 'trending_down', perms: AST_FIN },
          { label: 'Capital costs (CWIP)', hint: 'Costs of assets under construction', link: AM + 'r/capital_cost', icon: 'construction', perms: AST_FIN },
        ] },
      ] },
      { key: 'am-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Registers', items: [
          { label: 'Assets', link: RC + 'ast-asset', icon: 'inventory_2', perms: AST_ALL },
          { label: 'Movements', link: RC + 'ast-movement', icon: 'swap_horiz', perms: AST_ALL },
          { label: 'Reservations', link: RC + 'ast-reservation', icon: 'event_available', perms: AST_ALL },
          { label: 'Asset counts', link: RC + 'ast-audit', icon: 'fact_check', perms: AST_ALL },
          { label: 'Depreciation runs', link: RC + 'ast-depreciation', icon: 'trending_down', perms: AST_FIN },
          { label: 'Work orders', link: RC + 'ast-work-order', icon: 'construction', perms: AST_MNT },
          { label: 'Tickets', link: RC + 'ast-ticket', icon: 'support_agent', perms: AST_DESK },
          { label: 'Spare parts', link: RC + 'ast-part', icon: 'inventory', perms: AST_STORE },
          { label: 'Stock movements', link: RC + 'ast-stock-move', icon: 'sync_alt', perms: AST_STORE },
        ] },
      ] },
      { key: 'am-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'Locations', hint: 'Sites, buildings, floors, rooms, stores', link: AM + 'r/location', icon: 'place', perms: AST_ALL },
          { label: 'Categories', hint: 'Depreciation rules and accounts', link: AM + 'r/category', icon: 'category', perms: ['ast_manager', 'ast_finance'] },
          { label: 'Teams', hint: 'Support and maintenance teams', link: AM + 'r/team', icon: 'groups', perms: ['ast_manager', 'ast_maint_planner', 'ast_helpdesk'] },
          { label: 'Activity types', hint: 'Maintenance activities and checklists', link: AM + 'r/activity', icon: 'checklist', perms: ['ast_manager', 'ast_maint_planner'] },
          { label: 'SLA rules', hint: 'Helpdesk response and fix times', link: AM + 'r/sla', icon: 'timer', perms: ['ast_manager', 'ast_helpdesk'] },
          { label: 'Import and mailbox', hint: 'Excel upload of assets and parts; e-mail to ticket', link: AM + 'import', icon: 'upload_file', perms: ['ast_manager', 'ast_coordinator', 'ast_storekeeper'] },
          { label: 'Asset Management setup', hint: 'Industry pack, settings, links, roles', link: AM + 'setup', icon: 'tune', perms: ['ast_manager'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.36.0 People app (benefits, e-signature, forms, surveys, recognition, chat, 360°)
  {
    title: 'People', suite: 'people', apps: [
      { key: 'pp-home', label: 'People home', icon: 'home', parents: ['zeo-people'], sections: [
        { title: 'Overview', items: [
          { label: 'People home', hint: 'Figures, my signatures, reviews, surveys, benefits', link: PP + 'home', icon: 'home' },
          { label: 'Recognition wall', hint: 'Thank colleagues, points, leaders', link: PP + 'wall', icon: 'emoji_events' },
          { label: 'Chat', hint: 'Messages with colleagues', link: PP + 'chat', icon: 'chat' },
          { label: 'Forms', hint: 'Fill a company form', link: PP + 'forms', icon: 'dynamic_form' },
        ] },
      ] },
      { key: 'pp-benefits', label: 'Benefits', icon: 'health_and_safety', sections: [
        { title: 'Benefits', items: [
          { label: 'Benefit plans', hint: 'Medical, life, allowances, wellness', link: PP + 'r/benefit_plan', icon: 'health_and_safety' },
          { label: 'Enrolments', hint: 'Who is in which plan', link: PP + 'r/enrolment', icon: 'how_to_reg' },
          { label: 'Claims', hint: 'Reimbursements – approve, pay in payroll', link: PP + 'r/claim', icon: 'receipt_long' },
        ] },
      ] },
      { key: 'pp-engage', label: 'Engagement', icon: 'favorite', sections: [
        { title: 'Surveys', items: [
          { label: 'Surveys', hint: 'Engagement, pulse, onboarding, exit', link: PP + 'r/survey', icon: 'poll' },
        ] },
        { title: 'Recognition', items: [
          { label: 'Recognition wall', link: PP + 'wall', icon: 'emoji_events' },
          { label: 'Recognitions', hint: 'All recognitions, approvals', link: PP + 'r/recognition', icon: 'star' },
          { label: 'Rewards', hint: 'Points redeemed', link: PP + 'r/reward', icon: 'card_giftcard' },
          { label: 'Awards', hint: 'Award types and points', link: PP + 'r/award', icon: 'military_tech', perms: PP_HR },
        ] },
        { title: 'Forms and signatures', items: [
          { label: 'Forms', hint: 'Fill a form', link: PP + 'forms', icon: 'dynamic_form' },
          { label: 'Form submissions', hint: 'Approve, see what was sent', link: PP + 'r/form_submission', icon: 'inbox' },
          { label: 'Form templates', hint: 'Build forms', link: PP + 'r/form_template', icon: 'design_services', perms: PP_HR },
          { label: 'Signatures', hint: 'Letters, offers, policies to sign', link: PP + 'r/sign_request', icon: 'draw' },
        ] },
      ] },
      { key: 'pp-develop', label: '360° & development', icon: 'psychology', sections: [
        { title: '360° reviews', items: [
          { label: '360° reviews', hint: 'Self, manager, peers, reports', link: PP + 'r/review_360', icon: '360' },
          { label: 'Development plans', hint: 'Actions, mentor, progress', link: PP + 'r/development_plan', icon: 'trending_up' },
          { label: 'Competencies', hint: 'What is rated, levels 1–5', link: PP + 'r/competency', icon: 'psychology', perms: PP_HR },
        ] },
      ] },
      { key: 'pp-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Analysis', items: [
          { label: 'Benefits cost by plan', link: RC + 'ppl-benefits-cost', icon: 'payments', perms: PP_STAFF },
          { label: 'Survey engagement', link: RC + 'ppl-engagement', icon: 'poll', perms: PP_STAFF },
          { label: 'Recognition leaders', link: RC + 'ppl-recognition-leaders', icon: 'leaderboard', perms: PP_STAFF },
          { label: '360° review summary', link: RC + 'ppl-360-summary', icon: '360', perms: PP_STAFF },
        ] },
        { title: 'Registers', items: [
          { label: 'Enrolments', link: RC + 'ppl-enrolment', icon: 'how_to_reg', perms: PP_STAFF },
          { label: 'Claims', link: RC + 'ppl-claim', icon: 'receipt_long', perms: PP_STAFF },
          { label: 'Signatures', link: RC + 'ppl-sign-request', icon: 'draw', perms: PP_STAFF },
          { label: 'Form submissions', link: RC + 'ppl-form-submission', icon: 'inbox', perms: PP_STAFF },
          { label: 'Surveys', link: RC + 'ppl-survey', icon: 'poll', perms: PP_STAFF },
          { label: 'Recognitions', link: RC + 'ppl-recognition', icon: 'star', perms: PP_STAFF },
          { label: '360° reviews', link: RC + 'ppl-review-360', icon: '360', perms: PP_STAFF },
          { label: 'Development plans', link: RC + 'ppl-development-plan', icon: 'trending_up', perms: PP_STAFF },
        ] },
      ] },
      { key: 'pp-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'People setup', hint: 'Industry pack, points, e-signature, chat retention, 360° weights, roles', link: PP + 'setup', icon: 'tune', perms: ['ppl_manager'] },
          { label: 'Benefit plans', link: PP + 'r/benefit_plan', icon: 'health_and_safety', perms: ['ppl_manager', 'ppl_benefits'] },
          { label: 'Awards', link: PP + 'r/award', icon: 'military_tech', perms: ['ppl_manager'] },
          { label: 'Competencies', link: PP + 'r/competency', icon: 'psychology', perms: PP_HR },
          { label: 'Form templates', link: PP + 'r/form_template', icon: 'design_services', perms: PP_HR },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.21.0 HSE app (add-on 1.17.0 merged)
  {
    title: 'HSE', suite: 'hse', apps: [
      { key: 'hse-home', label: 'My safety', icon: 'health_and_safety', parents: ['zeo-hse'], sections: [
        { title: 'My safety', items: [
          { label: 'HSE home', hint: 'My approvals, actions and permits', link: H + 'home', icon: 'home' },
          { label: 'Report incident / near miss', link: H + 'report/incident', icon: 'report' },
          { label: 'Safety observation', link: H + 'report/observation', icon: 'visibility' },
          { label: 'Live permit board', link: H + 'board', icon: 'engineering' },
          { label: 'Documents', hint: 'Policies and procedures', link: H + 'r/documents', icon: 'description' },
        ] },
      ] },
      { key: 'hse-ops', label: 'Safety operations', icon: 'engineering', sections: [
        { title: 'Safety operations', items: [
          { label: 'Incidents', link: H + 'incidents', icon: 'personal_injury' },
          { label: 'Risk assessments', link: H + 'risks', icon: 'grid_on' },
          { label: 'Permits to work', link: H + 'permits', icon: 'assignment' },
          { label: 'BBS observations', link: H + 'observations', icon: 'visibility' },
          { label: 'Inspections', link: H + 'inspections', icon: 'fact_check', perms: HSE_STAFF },
          { label: 'Toolbox talks', link: H + 'toolbox', icon: 'record_voice_over', perms: HSE_STAFF },
          { label: 'Muster list', hint: 'Who is on site now (attendance)', link: H + 'links/muster', icon: 'groups', perms: HSE_STAFF },
        ] },
      ] },
      { key: 'hse-health', label: 'Health & environment', icon: 'eco', sections: [
        { title: 'Health and hygiene', items: [
          { label: 'Occupational health', link: H + 'r/health', icon: 'medical_services', perms: ['hse_occ_health', 'hse_manager'] },
          { label: 'Ergonomics', link: H + 'r/ergonomics', icon: 'accessibility_new', perms: ['hse_manager', 'hse_officer', 'hse_occ_health', 'hse_site_manager', 'hse_supervisor', 'hse_senior_mgmt'] },
          { label: 'Industrial hygiene', link: H + 'r/hygiene', icon: 'air', perms: ['hse_manager', 'hse_officer', 'hse_occ_health', 'hse_site_manager', 'hse_senior_mgmt'] },
          { label: 'Exposure limits', link: H + 'r/exposure-limits', icon: 'speed', perms: ['hse_manager', 'hse_officer', 'hse_occ_health'] },
        ] },
        { title: 'Environment and chemicals', items: [
          { label: 'Environmental monitoring', link: H + 'r/env-parameters', icon: 'eco', perms: HSE_ENV },
          { label: 'Aspects and impacts', link: H + 'r/env-aspects', icon: 'nature', perms: HSE_ENV },
          { label: 'Waste', link: H + 'r/waste', icon: 'delete', perms: [...HSE_ENV, 'hse_supervisor'] },
          { label: 'Chemicals and SDS', link: H + 'r/chemicals', icon: 'science' },
        ] },
      ] },
      { key: 'hse-assurance', label: 'Assurance & quality', icon: 'policy', sections: [
        { title: 'Assurance and quality', items: [
          { label: 'Audits', link: H + 'r/audits', icon: 'policy', perms: ['hse_auditor', 'hse_manager', 'hse_officer', 'hse_quality_manager', 'hse_site_manager', 'hse_senior_mgmt'] },
          { label: 'Quality nonconformities', link: H + 'r/quality', icon: 'rule' },
          { label: 'Compliance register', link: H + 'r/obligations', icon: 'gavel', perms: [...HSE_ENV, 'hse_site_manager'] },
          { label: 'Management of change', link: H + 'r/moc', icon: 'change_circle' },
        ] },
        { title: 'Performance', items: [
          { label: 'KPIs and objectives', link: H + 'r/kpis', icon: 'monitoring', perms: ['hse_manager', 'hse_officer', 'hse_site_manager', 'hse_senior_mgmt'] },
          { label: 'Management reviews', link: H + 'r/reviews', icon: 'groups', perms: ['hse_manager', 'hse_officer', 'hse_site_manager', 'hse_senior_mgmt'] },
        ] },
      ] },
      { key: 'hse-actions', label: 'Actions & claims', icon: 'task_alt', sections: [
        { title: 'Actions and claims', items: [
          { label: 'Corrective actions (CAPA)', link: H + 'actions', icon: 'task_alt' },
          { label: 'Claims', link: H + 'r/claims', icon: 'request_quote', perms: ['hse_claims_officer', 'hse_manager', 'hse_senior_mgmt'] },
          { label: 'HSE costs', hint: 'By site, cost centre and project', link: H + 'links/costs', icon: 'payments', perms: ['hse_claims_officer', 'hse_manager', 'hse_senior_mgmt'] },
          { label: 'Handovers', hint: 'Open HSE work of people who moved or leave', link: H + 'links/handovers', icon: 'swap_horiz', perms: ['hse_manager'] },
        ] },
        { title: 'Shared registers', items: [
          { label: 'Training and competency', link: H + 'r/competencies', icon: 'workspace_premium' },
          { label: 'Competency types', link: H + 'r/competency-types', icon: 'school', perms: HSE_STAFF },
        ] },
      ] },
      { key: 'hse-reports', label: 'Reports', icon: 'summarize', sections: [
        { title: 'Performance', items: [
          { label: 'HSE performance by month', link: RC + 'hse-monthly', icon: 'monitoring', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Incident register', link: RC + 'hse-incidents', icon: 'personal_injury', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Permit register', link: RC + 'hse-permits', icon: 'assignment', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Corrective actions (CAPA)', link: RC + 'hse-actions', icon: 'task_alt', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
        ] },
        { title: 'Registers', items: [
          { label: 'Audits', link: RC + 'hse-r-audits', icon: 'policy', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Chemicals and SDS', link: RC + 'hse-r-chemicals', icon: 'science', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Waste', link: RC + 'hse-r-waste', icon: 'delete', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Training and competency', link: RC + 'hse-r-competencies', icon: 'workspace_premium', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
          { label: 'Claims', link: RC + 'hse-r-claims', icon: 'request_quote', perms: [...HSE_STAFF, 'hse_senior_mgmt'] },
        ] },
      ] },
      { key: 'hse-setup', label: 'Setup', icon: 'tune', sections: [
        { title: 'Setup', items: [
          { label: 'Industry pack and review', link: H + 'setup/pack', icon: 'inventory_2', perms: ['hse_manager'] },
          { label: 'HSE settings and risk matrix', link: H + 'setup/settings', icon: 'tune', perms: ['hse_manager'] },
          { label: 'Sites, contractors, permit types, forms', link: H + 'setup/sites', icon: 'settings', perms: ['hse_manager'] },
          { label: 'Links with other apps', hint: 'Learning, Projects, Attendance, Leave, Assets…', link: H + 'setup/links', icon: 'link', perms: ['hse_manager'] },
        ] },
      ] },
    ],
  },
  // ================================================================ v1.20.0 Settings app: what the whole company shares (not HR only)
  {
    title: 'Settings', suite: 'settings', apps: [
      { key: 'settings', label: 'Company', icon: 'domain', parents: ['settings', 'country-settings', 'languages'], sections: [
        { title: 'Company', items: [
            { label: 'Company', link: M + 'settings/location-master', icon: 'domain', perms: ['view_company'] },
            { label: 'Branches', link: M + 'settings/branch-master', icon: 'store', perms: ['view_brnch_mstr'] },
            { label: 'Country settings', hint: 'Captions, features and rules of the company country', link: M + 'settings/country-settings', icon: 'public', perms: ['change_countrypacksettings'] },   // v1.14.0
            { label: 'Languages', hint: 'Languages of the company and translations of the screens', link: M + 'settings/languages', icon: 'translate', perms: ['change_term'] },   // v1.15.0
            { label: 'States / emirates', link: M + 'settings/state-master', icon: 'map', perms: ['view_state_mstr'], country: 'states' },   // v1.14.0 (caption follows the country)
            { label: 'Document numbering', link: M + 'settings/document-numbering', icon: 'pin', perms: ['view_documentnumbering'] },
            { label: 'AI settings', hint: 'Built-in (free) or an external AI for Ask ZEO and documents', link: M + 'settings/ai-settings', icon: 'smart_toy', perms: ['*admin'] },   // v1.16.0
          ] },
      ] },
      // v1.29.0: workflow automation – rules, approvals, scheduled actions, logs (My approvals is open to every user)
      { key: 'st-flow', label: 'Automation', icon: 'bolt', parents: ['automation'], sections: [
        { title: 'Overview', items: [
            { label: 'Dashboard', hint: 'Rules, runs, failures, pending approvals', link: M + 'automation', icon: 'space_dashboard', perms: ['view_workflow'] },
            { label: 'My approvals', hint: 'Requests waiting for your decision', link: M + 'automation/approvals', icon: 'how_to_reg' },
          ] },
        { title: 'Build', items: [
            { label: 'Workflow rules', hint: 'Trigger → conditions → actions, for every app', link: M + 'automation/rules', icon: 'account_tree', perms: ['view_workflow'] },
            { label: 'Approval flows', hint: 'Levels, approvers, deadlines, escalation', link: M + 'automation/approval-flows', icon: 'fact_check', perms: ['view_approvalflow'] },
            { label: 'Notification templates', hint: 'E-mail and in-app texts with variables', link: M + 'automation/templates', icon: 'mail', perms: ['view_flowtemplate'] },
          ] },
        { title: 'Monitor', items: [
            { label: 'Execution log', hint: 'Every run, action results, errors, retries', link: M + 'automation/runs', icon: 'receipt_long', perms: ['view_workflowrun'] },
            { label: 'Scheduled actions', hint: 'Waits, delayed starts, overdue', link: M + 'automation/scheduled', icon: 'schedule_send', perms: ['view_scheduledaction'] },
            { label: 'Configuration changes', hint: 'Who changed which rule, when', link: M + 'automation/audit', icon: 'history', perms: ['view_flowaudit'] },
          ] },
      ] },
      // v1.21.0: which apps the company uses, with the industry of each
      { key: 'st-apps', label: 'Apps', icon: 'apps', sections: [
        { title: 'Apps', items: [
            { label: 'Apps', hint: 'Activate HR, Payroll, Projects, CRM, Property, Maintenance, Asset Management and HSE, with the industry of each', link: M + 'settings/apps', icon: 'apps', perms: ['*admin', 'manage_apps'] },
          ] },
      ] },
      // v1.23.0 ZEO Cloud: the account owner's subscription and sign-in rules
      { key: 'st-account', label: 'Subscription', icon: 'workspace_premium', country: 'cloud:owner', sections: [
        { title: 'Account', items: [
            { label: 'Subscription', hint: 'Plan, apps, limits and usage, renewal, invoices', link: M + 'settings/subscription', icon: 'workspace_premium', country: 'cloud:owner' },
            { label: 'Security', hint: 'Who can be a user: any e-mail or only company e-mails', link: M + 'settings/security', icon: 'shield', country: 'cloud:owner' },
          ] },
      ] },
      // v1.28.0 Enterprise: the licence file of this server (server administrators)
      { key: 'st-licence', label: 'Licence', icon: 'verified', country: 'licence:admin', sections: [
        { title: 'Licence', items: [
            { label: 'Licence', hint: 'Installation ID, licence file, limits and usage, renewal', link: M + 'settings/licence', icon: 'verified', country: 'licence:admin' },
          ] },
      ] },
      { key: 'st-users', label: 'Users & rights', icon: 'manage_accounts', sections: [
        { title: 'Users & rights', items: [
            { label: 'Users', link: M + 'settings/user-master', icon: 'manage_accounts', perms: ['view_customuser'] },
            { label: 'Permission groups', link: M + 'settings/user-grouping-master', icon: 'groups', perms: ['view_group'] },
            { label: 'Assign permissions', link: M + 'settings/permission-assigned', icon: 'admin_panel_settings', perms: ['view_permission'] },
            { label: 'Branch permissions', link: M + 'settings/branch-permissions', icon: 'account_tree', perms: ['view_userbranchaccess'] },
          ] },
      ] },
      { key: 'st-email', label: 'E-mail', icon: 'forward_to_inbox', sections: [
        { title: 'E-mail', items: [
            { label: 'E-mail configuration', link: M + 'settings/email-configuration', icon: 'forward_to_inbox', perms: ['view_emailconfiguration'] },
          ] },
      ] },
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

/**
 * v1.14.0: country condition of a menu item / app. `allows` is CountryPackService.allows (pass it in, this file has no injector).
 * Captions are localised with CountryPackService.text by the menus ("States / emirates" → "States / regions").
 */
export function countryVisible(country: string | undefined, allows?: (expr: string) => boolean): boolean {
  return !country || !allows || allows(country);
}

export function itemVisible(perms: string[] | undefined, access: { admin: boolean; codes: Set<string> } | null): boolean {
  if (!perms || !perms.length) { return true; }
  if (!access) { return false; }          // v1.13.0: rights not loaded yet → hide gated items
  if (access.admin) { return true; }
  if (perms.includes('*staff')) { return access.codes.size > 0; }
  return perms.some(p => access.codes.has(p));
}
