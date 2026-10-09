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
      { key: 'ceo', label: 'CEO Dashboard', icon: 'monitoring', link: M + 'ceo-dashboard', parents: ['ceo-dashboard'], perms: ['view_ceo_dashboard'] },   // v1.11.0
      { key: 'mgr', label: 'Manager Dashboard', icon: 'insights', link: M + 'manager-dashboard', perms: ['*staff'] },
      { key: 'mydash', label: 'My Dashboard', icon: 'person_pin', link: M + 'my-dashboard', parents: ['my-dashboard'] },   // v1.11.0
      { key: 'cal', label: 'Calendar', icon: 'calendar_month', link: M + 'unified-calendar', parents: ['unified-calendar'] },   // v1.11.0
      { key: 'todo', label: 'My To-do', icon: 'task_alt', link: M + 'todo', parents: ['todo'] },
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
      { key: 'orgstructure', label: 'Organisation', icon: 'account_tree', link: M + 'org-structure', parents: ['org-structure'],
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
            { label: 'Resignation approvals', link: M + 'sub-sidebar/resignation-approvals', icon: 'fact_check', perms: ['view_resignationapproval'] },
            { label: 'Approved resignations', link: M + 'sub-sidebar/resignation-approved-list', icon: 'task_alt', perms: ['view_approved_resignations'] },
            { label: 'End of service', link: M + 'sub-sidebar/end-of-service', icon: 'calculate', perms: ['view_endofservice'] },
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
            { label: 'Categories', link: M + 'sub-sidebar/catogary-master', icon: 'category', perms: ['view_ctgry_master'] },
            { label: 'Document types', link: M + 'settings/document-type-master', icon: 'description', perms: ['view_document_type'] },
            { label: 'Form designer', link: M + 'settings/from-designer', icon: 'dynamic_form', perms: ['view_emp_customfield'] },
            { label: 'Resignation levels', link: M + 'sub-sidebar/resignation-approval-level', icon: 'approval', perms: ['view_resignationapprovallevel'] },
            { label: 'Gratuity table', link: M + 'sub-sidebar/gratyuity', icon: 'table_chart', perms: ['view_gratuitytable'] },
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
        key: 'attendance', label: 'Time & Attendance', icon: 'schedule', parents: ['attendance-sidebar', 'shift-options', 'attendance-plus'],
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
            { label: 'Shift rosters', link: M + 'shift-planner/rosters', icon: 'calendar_view_week', perms: ['view_rosterperiod'] },   // v1.12.0
            { label: 'Shift master (rules)', link: M + 'shift-planner/shifts', icon: 'schedule', perms: ['view_shift'] },   // v1.12.0
            { label: 'Shift requests', link: M + 'shift-planner/requests', icon: 'swap_horiz', perms: ['view_shiftrequest'] },   // v1.12.0
            { label: 'Shifts (basic)', link: M + 'shift-options/shifts', icon: 'schedule', perms: ['view_shift'] },
            { label: 'Shift patterns', link: M + 'shift-options/shift-pattern', icon: 'date_range', perms: ['view_shiftpattern'] },
            { label: 'Employee shifts', link: M + 'shift-options/shift-employee', icon: 'badge', perms: ['view_employeeshiftschedule'] },
            { label: 'Shift override', link: M + 'shift-options/shift-override', icon: 'edit_calendar', perms: ['view_shiftoverride'] },
            { label: 'Weekend calendar', link: M + 'settings/weelcalendar', icon: 'weekend', perms: ['view_weekend_calendar'] },
            { label: 'Assign weekends', link: M + 'settings/assign-weekcalendar', icon: 'event_repeat', perms: ['view_assign_weekend'] },
            { label: 'Holiday calendar', link: M + 'settings/holiday-calendar', icon: 'celebration', perms: ['view_holiday_calendar'] },
            { label: 'Assign holidays', link: M + 'settings/assign-holiday-calendar', icon: 'event_available', perms: ['view_assign_holiday'] },
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
      { key: 'shiftplan', label: 'Shift Planner', icon: 'calendar_view_week', link: M + 'shift-planner', parents: ['shift-planner'] },   // v1.12.0
      {
        key: 'leave', label: 'Leave', icon: 'event_busy', parents: ['leave-options'],
        sections: [
          { title: 'Daily work', items: [
            { label: 'Leave requests', hint: 'Apply, see balance and status', link: M + 'leave-options/leave-request', icon: 'edit_calendar', perms: ['view_employee_leave_request']  },   // v1.13.0
            { label: 'My leave', link: M + 'self-service/leave', icon: 'event_note', perms: ['view_employee_leave_request'] },
            { label: 'Leave balance', link: M + 'leave-options/leave-balance', icon: 'account_balance_wallet', perms: ['view_emp_leave_balance'] },
            { label: 'Leave planner', hint: 'Who is away when', link: M + 'leave-options/leave-planner', icon: 'calendar_month', perms: ['view_employee_leave_request', 'view_leaveapproval'] },
            { label: 'Compensatory leave', link: M + 'leave-options/compensatory-leave', icon: 'event_available', perms: ['view_compensatoryleaverequest'] },
            { label: 'Return from leave', hint: 'Record returns and settle late / early rejoining', link: M + 'leave-options/rejoining', icon: 'assignment_return', perms: ['change_employeerejoining', 'view_employeerejoining'] },
            { label: 'Leave cancellation', link: M + 'leave-options/immediate-rejection', icon: 'cancel', perms: ['view_lv_cancellation'] },
            { label: 'Leave encashment', link: M + 'leave-options/leave-encashment', icon: 'payments', perms: ['view_emp_leave_balance'] },
          ] },
          { title: 'Approvals', items: [
            { label: 'Leave approvals', link: M + 'leave-options/leave-approvals', icon: 'fact_check', perms: ['view_leaveapproval'] },
            { label: 'Encashment approvals', link: M + 'leave-options/encashment-approvals', icon: 'price_check', perms: ['change_leaveencashment', 'view_leaveencashment'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Leave policies (UAE)', hint: 'Employee-wise leave policies, accrual and leave year end', link: M + 'leave-options/leave-policies', icon: 'policy', perms: ['view_leave_type', 'view_leavepolicy'] },
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
        key: 'expense', label: 'Expenses', icon: 'receipt_long', link: M + 'expense-options', parents: ['expense-options'],   // v1.11.0
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
            { label: 'Asset request approvals', link: M + 'asset-options/asset-approval', icon: 'fact_check', perms: ['view_assetapproval'] },
          ] },
          { title: 'Setup', collapsed: true, items: [
            { label: 'Asset settings & codes', link: M + 'asset-plus/settings', icon: 'tune', perms: ['view_assettype'] },
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
            { label: 'My timesheet', link: M + 'project-options/my-timesheet', icon: 'timer' },
            { label: 'Timesheet approvals', link: M + 'project-options/timesheet-approvals', icon: 'fact_check' },
            { label: 'Timesheets', link: M + 'project-options/project-timesheet', icon: 'schedule', perms: ['view_timesheet'] },
            { label: 'Project costing', link: M + 'project-options/project-costing', icon: 'paid' },
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
      { key: 'learning', label: 'Learning', icon: 'school', link: M + 'learning-options', parents: ['learning-options'] },   // v1.11.0: everyone (My learning); pages check rights
    ],
  },
  {
    title: 'Admin', apps: [
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
            { label: 'Attendance summary', link: M + 'report-options/r/attendance-summary', icon: 'table_chart', perms: ['view_attendancereport', 'view_attendance'] },
            { label: 'Attendance (daily)', link: M + 'report-options/r/attendance', icon: 'fact_check', perms: ['view_attendancereport', 'view_attendance'] },
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
            { label: 'Payroll register', link: M + 'report-options/r/payroll-register', icon: 'receipt_long', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'WPS salary file data', link: M + 'report-options/r/wps', icon: 'account_balance', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'Salary by employee', link: M + 'report-options/r/salary', icon: 'payments', perms: ['view_employeesalarystructure', 'view_payslip'] },
            { label: 'Salary revisions', link: M + 'report-options/r/salary-revisions', icon: 'trending_up', perms: ['view_salaryrevisionhistory', 'view_employeesalarystructure'] },
            { label: 'Gratuity accrual', link: M + 'report-options/r/gratuity', icon: 'savings', perms: ['view_employeesalarystructure', 'view_payslip'] },
            { label: 'Leave liability', link: M + 'report-options/r/leave-liability', icon: 'weekend', perms: ['view_employeesalarystructure', 'view_payslip'] },
            { label: 'Loans outstanding', link: M + 'report-options/r/loans', icon: 'request_quote', perms: ['view_loanapplication'] },
            { label: 'Advance salary', link: M + 'report-options/r/advances', icon: 'price_check', perms: ['view_advancesalaryrequest'] },
            { label: 'Air tickets', link: M + 'report-options/r/air-tickets', icon: 'flight_takeoff', perms: ['view_airticketallocation', 'view_airticketrequest'] },
            { label: 'Allowance register', link: M + 'report-options/r/allowance-register', icon: 'add_card', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'Deduction register', link: M + 'report-options/r/deduction-register', icon: 'remove_circle_outline', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'Overtime pay', link: M + 'report-options/r/overtime-pay', icon: 'more_time', perms: ['view_payslip', 'view_employeeovertime'] },
            { label: 'Payroll cost (employer)', link: M + 'report-options/r/payroll-cost', icon: 'account_balance_wallet', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'Department cost', link: M + 'report-options/r/department-cost', icon: 'pie_chart', perms: ['view_payslip', 'view_payrollrun'] },
            { label: 'Payroll variance', link: M + 'report-options/r/payroll-variance', icon: 'compare_arrows', perms: ['view_payslip', 'view_payrollrun'] },
          ] },
          { title: 'Requests, exits & assets', items: [
            { label: 'General requests', link: M + 'report-options/r/general-requests', icon: 'assignment', perms: ['view_generalrequestreport', 'view_generalrequest'] },
            { label: 'Resignations and end of service', link: M + 'report-options/r/exits', icon: 'logout', perms: ['view_employeeresignation', 'view_endofservice'] },
            { label: 'Assets', link: M + 'report-options/r/assets', icon: 'inventory_2', perms: ['view_assetreport', 'view_asset'] },
            { label: 'Asset transactions', link: M + 'report-options/r/asset-transactions', icon: 'assignment_return', perms: ['view_assettransactionreport', 'view_assetallocation'] },
            { label: 'Asset register (book value)', link: M + 'report-options/r/asset-register', icon: 'inventory_2', perms: ['view_asset'] },   // v1.12.0
            { label: 'Maintenance due', link: M + 'report-options/r/asset-maintenance-due', icon: 'build', perms: ['view_asset'] },   // v1.12.0
            { label: 'Assets by employee', link: M + 'report-options/r/assets-by-employee', icon: 'badge', perms: ['view_asset'] },   // v1.12.0
            { label: 'Damage and loss recovery', link: M + 'report-options/r/asset-recovery', icon: 'payments', perms: ['view_asset'] },   // v1.12.0
            { label: 'Disposals – gain / loss', link: M + 'report-options/r/asset-disposals', icon: 'delete_sweep', perms: ['view_asset'] },   // v1.12.0
          ] },
          { title: 'Talent & projects', items: [
            { label: 'Appraisal results', link: M + 'report-options/r/appraisals', icon: 'star_half', perms: ['view_goalsheet', 'view_appraisaloutcome'] },
            { label: 'Recruitment pipeline', link: M + 'report-options/r/recruitment', icon: 'person_add', perms: ['view_jobopening', 'view_application'] },
            { label: 'Training', link: M + 'report-options/r/training', icon: 'school', perms: ['view_nomination', 'view_trainingsession'] },
            { label: 'Certificates and expiry', link: M + 'report-options/r/certificates', icon: 'workspace_premium', perms: ['view_certificate'] },
            { label: 'Timesheet hours', link: M + 'report-options/r/timesheets', icon: 'access_time', perms: ['view_timesheet'] },
            { label: 'Candidates', link: M + 'report-options/r/candidates', icon: 'badge', perms: ['view_candidate', 'view_application'] },
            { label: 'Time to hire', link: M + 'report-options/r/time-to-hire', icon: 'timer', perms: ['view_application', 'view_offer', 'view_jobopening'] },
            { label: 'Time to fill', link: M + 'report-options/r/time-to-fill', icon: 'hourglass_bottom', perms: ['view_jobopening', 'view_manpowerrequisition'] },
            { label: 'Cost per hire', link: M + 'report-options/r/cost-per-hire', icon: 'paid', perms: ['view_jobopening', 'view_offer'] },
            { label: 'Source effectiveness', link: M + 'report-options/r/source-effectiveness', icon: 'hub', perms: ['view_candidate', 'view_application'] },
            { label: 'KPI report', link: M + 'report-options/r/kpi', icon: 'track_changes', perms: ['view_goalsheet', 'view_kpi'] },
            { label: 'Goal achievement', link: M + 'report-options/r/goal-achievement', icon: 'flag', perms: ['view_goalsheet'] },
            { label: 'Department performance', link: M + 'report-options/r/department-performance', icon: 'leaderboard', perms: ['view_goalsheet', 'view_appraisaloutcome'] },
            { label: 'Timesheet entries', link: M + 'report-options/r/project-entries', icon: 'list_alt', perms: ['view_timesheet'] },
            { label: 'Project hours', link: M + 'report-options/r/project-hours', icon: 'schedule', perms: ['view_timesheet', 'view_projectfinance'] },
            { label: 'Project cost', link: M + 'report-options/r/project-cost', icon: 'payments', perms: ['view_projectfinance'] },
            { label: 'Employee cost', link: M + 'report-options/r/employee-cost', icon: 'person', perms: ['view_projectfinance'] },
            { label: 'Project profitability', link: M + 'report-options/r/project-profitability', icon: 'trending_up', perms: ['view_projectfinance'] },
            { label: 'Timesheet approvals', link: M + 'report-options/r/timesheet-approvals', icon: 'fact_check', perms: ['view_timesheet'] },
            { label: 'Billable vs non-billable', link: M + 'report-options/r/billable-hours', icon: 'price_check', perms: ['view_timesheet', 'view_projectfinance'] },
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
  if (!perms || !perms.length) { return true; }
  if (!access) { return false; }          // v1.13.0: rights not loaded yet → hide gated items
  if (access.admin) { return true; }
  if (perms.includes('*staff')) { return access.codes.size > 0; }
  return perms.some(p => access.codes.has(p));
}
