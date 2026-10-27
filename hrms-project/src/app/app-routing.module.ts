import { EmployeeTransferComponent } from './hr-actions/employee-transfer.component';   // v1.11.0
import { RejoiningComponent } from './hr-actions/rejoining.component';                 // v1.11.0
import { PROJECT_CONTROL_CHILDREN } from './project-control/project-control.routes';  // v1.11.0
import { ZTodoComponent } from './shared-ui/z-todo.component';
import { ZInboxComponent } from './shared-ui/z-inbox.component';   // v1.45.0
import { ZMyTeamComponent } from './shared-ui/z-my-team.component';   // v1.47.0
import { ZWallComponent, ZMyOneOnOnesComponent } from './shared-ui/z-wall.component';   // v1.47.0
import { ZCollabSettingsComponent } from './shared-ui/z-collab-settings.component';   // v1.45.0
import { ZMessagingSettingsComponent } from './shared-ui/z-messaging-settings.component';   // v1.51.0
import { ZMyAccountComponent, ZSignInSecurityComponent, ZIntegrationsComponent, ZScheduledReportsComponent, ZImportHistoryComponent, ZHealthComponent, ZPrivacyComponent, ZTestCompanyComponent } from './shared-ui/z-admin-pages.component';   // v1.52.0, v1.53.0
import { ZReportBuilderComponent, ZDashboardsComponent } from './shared-ui/z-insights.component';   // v1.53.0
import { ZAuditComponent } from './shared-ui/z-audit.component';   // v1.46.0
import { ZOrgChartComponent } from './shared-ui/z-org-chart.component';
import { NotFoundComponent } from './not-found/not-found.component';   // v1.15.1 page not found
import { NoAccessComponent } from './not-found/no-access.component';   // v1.62.0 page refused by the menu rights
import { menuRightsGuard } from './shared-ui/menu-rights.guard';      // v1.62.0 release checklist §37 menu by rights
import { moved } from './not-found/moved';   // v1.15.1 moved pages keep their query string
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainSidebarComponent } from './main-sidebar/main-sidebar.component';
import { SubSidebarComponent } from './sub-sidebar/sub-sidebar.component';
import { SubNavigationComponent } from './sub-navigation/sub-navigation.component';
import { CompanySelectionComponent } from './company-selection/company-selection.component';
import { BranchCreationComponent } from './branch-creation/branch-creation.component';
import { SettingsComponent } from './settings/settings.component';
import { AuthGuard } from './auth.guard';
import { CompanyMasterComponent } from './company-master/company-master.component';
import { BranchMasterComponent } from './branch-master/branch-master.component';
import { DepartmentMasterComponent } from './department-master/department-master.component';
import { DesignationMasterComponent } from './designation-master/designation-master.component';
import { CatogaryMasterComponent } from './catogary-master/catogary-master.component';
import { UserMasterComponent } from './user-master/user-master.component';
import { EmployeeMasterComponent } from './employee-master/employee-master.component';
import { EmployeeDetailsComponent } from './employee-details/employee-details.component';
import { EmployeeListComponent } from './employee-record/employee-list.component';      // v1.19.0
import { EmployeeRecordComponent } from './employee-record/employee-record.component';  // v1.19.0
import { CompanyDetailsComponent } from './company-details/company-details.component';
import { UserGroupingMasterComponent } from './user-grouping-master/user-grouping-master.component';
import { MainDashboardComponent } from './main-dashboard/main-dashboard.component';
import { roleGuard } from './shared/role.guard';
import { StateMasterComponent } from './state-master/state-master.component';
import { DocumentTypeMasterComponent } from './document-type-master/document-type-master.component';
import { DocumentExpiredComponent } from './document-expired/document-expired.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { SchemaSelectionComponent } from './schema-selection/schema-selection.component';
import { PermissionAssignedComponent } from './permission-assigned/permission-assigned.component';
import { LocationMasterComponent } from './location-master/location-master.component';
import { EmployeeSchemaSelectionComponent } from './employee-schema-selection/employee-schema-selection.component';
import { GeneralRequestComponent } from './general-request/general-request.component';
import { RequestTypeComponent } from './request-type/request-type.component';
import { DocumentNumberingComponent } from './document-numbering/document-numbering.component';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard.component';
import { FiscalYearComponent } from './fiscal-year/fiscal-year.component';
import { EmployeeSctionComponent } from './employee-sction/employee-sction.component';
import { WeelcalendarComponent } from './weelcalendar/weelcalendar.component';
import { AssignWeekcalendarComponent } from './assign-weekcalendar/assign-weekcalendar.component';
import { HolidayCalendarComponent } from './holiday-calendar/holiday-calendar.component';
import { AssignweekCalendarDaysComponent } from './assignweek-calendar-days/assignweek-calendar-days.component';
import { AssignHolidayCalendarComponent } from './assign-holiday-calendar/assign-holiday-calendar.component';
import { LeaveOptionsComponent } from './leave-options/leave-options.component';
import { LeaveTypeComponent } from './leave-type/leave-type.component';
import { LeaveMasterComponent } from './leave-master/leave-master.component';
import { FromDesignerComponent } from './from-designer/from-designer.component';
import { ApprovalLevelComponent } from './approval-level/approval-level.component';
import { ApprovalsComponent } from './approvals/approvals.component';
import { AttendaceMarkingComponent } from './attendace-marking/attendace-marking.component';
import { LeaveRequestComponent } from './leave-request/leave-request.component';
import { LeaveApprovalLevelComponent } from './leave-approval-level/leave-approval-level.component';
import { LeaveTemplateComponent } from './leave-template/leave-template.component';
import { LeaveApprovalsComponent } from './leave-approvals/leave-approvals.component';
import { CompensatoryLeaveComponent } from './compensatory-leave/compensatory-leave.component';
import { EmailTemplateComponent } from './email-template/email-template.component';
import { CompanyPolicyComponent } from './company-policy/company-policy.component';
import { EmployeeApprovalsComponent } from './employee-approvals/employee-approvals.component';
import { EmployeeLeaveComponent } from './employee-leave/employee-leave.component';
import { DashboardContentsComponent } from './dashboard-contents/dashboard-contents.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';   // v1.17.0 one Home for every dashboard
import { PayRollComponent } from './pay-roll/pay-roll.component';
import { SalaryComponent } from './salary/salary.component';
import { PayrollDetailsComponent } from './payroll-details/payroll-details.component';
import { SalaryOptionsComponent } from './salary-options/salary-options.component';
import { LeaveBalanceComponent } from './leave-balance/leave-balance.component';
import { EmailConfigurationComponent } from './email-configuration/email-configuration.component';
import { ImmediateRejectionComponent } from './immediate-rejection/immediate-rejection.component';
import { EmployeeLeaveRejoinComponent } from './employee-leave-rejoin/employee-leave-rejoin.component';
import { DocExpEmailtemplateComponent } from './doc-exp-emailtemplate/doc-exp-emailtemplate.component';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { LeaveAccruvalComponent } from './leave-accruval/leave-accruval.component';
import { EmployeeOvertimeComponent } from './employee-overtime/employee-overtime.component';
import { LoanSidebarComponent } from './loan-sidebar/loan-sidebar.component';
import { LoanTypeComponent } from './loan-type/loan-type.component';
import { LoanApplicationComponent } from './loan-application/loan-application.component';
import { LoanRepaymentComponent } from './loan-repayment/loan-repayment.component';
import { LoanApprovelLevelComponent } from './loan-approvel-level/loan-approvel-level.component';
import { LoanApprovalComponent } from './loan-approval/loan-approval.component';
import { AnnouncementMasterComponent } from './announcement-master/announcement-master.component';
import { AssetOptionsComponent } from './asset-options/asset-options.component';
import { AssetTypesComponent } from './asset-types/asset-types.component';
import { AssetApprovelLevelComponent } from './asset-approvel-level/asset-approvel-level.component';
import { AssetRequestComponent } from './asset-request/asset-request.component';
import { AssetUdfComponent } from './asset-udf/asset-udf.component';
import { PayrollAppovalLevelComponent } from './payroll-appoval-level/payroll-appoval-level.component';
import { PayslipApprovalComponent } from './payslip-approval/payslip-approval.component';
import { WpsComponent } from './wps/wps.component';
import { DocumentRequestLevelComponent } from './document-request-level/document-request-level.component';
import { DocumentRequestComponent } from './document-request/document-request.component';
import { DocumentRequestApprovalsComponent } from './document-request-approvals/document-request-approvals.component';
import { AirTicketOptionsComponent } from './air-ticket-options/air-ticket-options.component';
import { AirTicketPolicyComponent } from './air-ticket-policy/air-ticket-policy.component';
import { AdvanceSalaryApprovalLevelComponent } from './advance-salary-approval-level/advance-salary-approval-level.component';
import { AdvanceSalaryRequestComponent } from './advance-salary-request/advance-salary-request.component';
import { AdvanceSalaryApprovalsComponent } from './advance-salary-approvals/advance-salary-approvals.component';
import { AirticketAllocationComponent } from './airticket-allocation/airticket-allocation.component';
import { AirticketRequestComponent } from './airticket-request/airticket-request.component';
import { EmpAttendanceComponent } from './emp-attendance/emp-attendance.component';
import { EmpAssetRequestComponent } from './emp-asset-request/emp-asset-request.component';
import { EmpLoanComponent } from './emp-loan/emp-loan.component';
import { ResignationApprovalLevelComponent } from './resignation-approval-level/resignation-approval-level.component';
import { ResignationRequestComponent } from './resignation-request/resignation-request.component';
import { ResignationApprovalsComponent } from './resignation-approvals/resignation-approvals.component';
import { ProjectOptionsComponent } from './project-options/project-options.component';
import { HR_MODULE_ROUTES } from './hr-modules/hr-modules.routes';
import { SETTINGS_HOME_ROUTES } from './settings-home/settings-home.routes';   // v1.15.1
import { SETTINGS_APPS_ROUTES } from './settings-apps/settings-apps.component';
import { CLOUD_SETTINGS_ROUTES } from './zeo-cloud/cloud-settings.component';
import { CONTROL_ROUTES } from './zeo-cloud/console.component';
import { CloudSignupComponent } from './zeo-cloud/signup.component';   // v1.23.0   // v1.21.0 Settings → Apps
import { AI_SETTINGS_ROUTES } from './ai-settings/ai-settings.routes';   // v1.16.0
import { PRINT_TEMPLATES_ROUTES, PRINT_VIEW_ROUTE } from './print-templates/print-templates.routes';   // v1.62.0 print
import { COUNTRY_PACK_ROUTES } from './country-pack/country-pack.routes';   // v1.20.1
import { LANGUAGE_PACK_ROUTES } from './language-pack/language-pack.routes';   // v1.20.1
import { ProjectMasterComponent } from './project-master/project-master.component';
import { ProjectStagesComponent } from './project-stages/project-stages.component';
import { ProjectTasksComponent } from './project-tasks/project-tasks.component';
import { ProjectTimesheetComponent } from './project-timesheet/project-timesheet.component';
import { LeaversComponent } from './leavers/leavers.component';   // v1.62.0 EOS
import { LeaverCaseComponent } from './leavers/leaver-case.component';   // v1.62.0 EOS
import { SalaryRegisterComponent } from './employee-salary/salary-register.component';   // v1.62.0 payroll
import { PayrollControlsComponent } from './payroll-plus/payroll-controls.component';   // v1.18.0
import { LoansComponent, ProvisionsComponent } from './payroll-plus/pp-v149.component';   // v1.49.0
import { CostAllocationComponent, WhatIfComponent } from './payroll-plus/pp-v150.component';   // v1.50.0
import { StatutorySchemesComponent } from './payroll-plus/statutory-schemes.component';   // v1.31.0
import { AccountingComponent } from './payroll-plus/accounting.component';   // v1.35.0
import { GratuityComponent } from './gratuity/gratuity.component';
import { DocumentRequestEmailTemplateComponent } from './document-request-email-template/document-request-email-template.component';
import { AdvanceSalaryEmailtemplateComponent } from './advance-salary-emailtemplate/advance-salary-emailtemplate.component';
import { LoanEmailtemplateEditComponent } from './loan-emailtemplate-edit/loan-emailtemplate-edit.component';
import { LoanEmailTemplateComponent } from './loan-email-template/loan-email-template.component';
import { AirticketRuleComponent } from './airticket-rule/airticket-rule.component';

import { ShiftOptionsComponent } from './shift-options/shift-options.component';
import { ShiftPatternComponent } from './shift-pattern/shift-pattern.component';
import { ShiftEmployeeComponent } from './shift-employee/shift-employee.component';
import { ShiftOverrideComponent } from './shift-override/shift-override.component';

import { DocumentRequestTypeComponent } from './document-request-type/document-request-type.component';
import { DocumentFoldersComponent } from './document-folders/document-folders.component';
import { DocumentFolderFilesComponent } from './document-folder-files/document-folder-files.component';
import { GeneralRequestEscalationComponent } from './general-request-escalation/general-request-escalation.component';
import { AssetApprovalComponent } from './asset-approval/asset-approval.component';
import { AirticketApprovalLevelComponent } from './airticket-approval-level/airticket-approval-level.component';
import { AirticketApprovalsComponent } from './airticket-approvals/airticket-approvals.component';
import { AssetEmailTemplateComponent } from './asset-email-template/asset-email-template.component';
import { AirticketEmailTemplateComponent } from './airticket-email-template/airticket-email-template.component';
import { AdvanceSalaryEscalationComponent } from './advance-salary-escalation/advance-salary-escalation.component';
import { LoanEscalationComponent } from './loan-escalation/loan-escalation.component';
import { AirticketEscalationComponent } from './airticket-escalation/airticket-escalation.component';
import { AssetEscalationComponent } from './asset-escalation/asset-escalation.component';
import { LeaveEscalationComponent } from './leave-escalation/leave-escalation.component';

import { ReportOptionsComponent } from './report-options/report-options.component';
import { ZReportHomeComponent } from './report-options/z-report-home.component';   // v1.62.0 reports
import { ZReportComponent } from './z-report/z-report.component';
import { ZRecordViewComponent } from './z-report/z-record-view.component';
import { LeavePoliciesComponent } from './leave-policy/leave-policies.component';
import { LeavePlannerComponent } from './leave-policy/leave-planner.component';
import { LeaveConflictsComponent } from './leave-policy/leave-conflicts.component';   // v1.51.0
import { EncashmentApprovalsComponent } from './leave-policy/encashment-approvals.component';
import { ReportGenerateComponent } from './report-generate/report-generate.component';
import { DocumentReportComponent } from './document-report/document-report.component';
import { GeneralRequestReportComponent } from './general-request-report/general-request-report.component';
import { DepartmentReportComponent } from './department-report/department-report.component';
import { DesignationReportComponent } from './designation-report/designation-report.component';
import { LeaveReportComponent } from './leave-report/leave-report.component';
import { LeaveApprovalsReportComponent } from './leave-approvals-report/leave-approvals-report.component';
import { LeaveBalanceReportComponent } from './leave-balance-report/leave-balance-report.component';
import { AssetReportComponent } from './asset-report/asset-report.component';
import { AssetTransactionReportComponent } from './asset-transaction-report/asset-transaction-report.component';
import { EmployeeAttendanceComponent } from './employee-attendance/employee-attendance.component';
import { OvertimePolicyComponent } from './overtime-policy/overtime-policy.component';
import { AttendanceSidebarComponent } from './attendance-sidebar/attendance-sidebar.component';
import { EmployeeEarlyGoingComponent } from './employee-early-going/employee-early-going.component';
import { EmployeeRecheckComponent } from './employee-recheck/employee-recheck.component';
import { EmployeePunchingListComponent } from './employee-punching-list/employee-punching-list.component';
import { GeofenceComponent } from './geofence/geofence.component';
import { ResignationEmailTemplateComponent } from './resignation-email-template/resignation-email-template.component';
import { BranchPermissionsComponent } from './branch-permissions/branch-permissions.component';
import { OvertimeRuleComponent } from './overtime-rule/overtime-rule.component';
import { PayStructureComponent } from './pay-structure/pay-structure.component';
import { EmployeeFaceRegisterComponent } from './employee-face-register/employee-face-register.component';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';
import { AttendancePolicyComponent } from './attendance-policy/attendance-policy.component';
import { AttendanceRequestComponent } from './attendance-request/attendance-request.component';
import { LateinEarlyoutApprovalLevelComponent } from './latein-earlyout-approval-level/latein-earlyout-approval-level.component';
import { LateinEarlyoutApprovalsComponent } from './latein-earlyout-approvals/latein-earlyout-approvals.component';
import { LateinEarlyoutEmailTemplateComponent } from './latein-earlyout-email-template/latein-earlyout-email-template.component';
import { EmployeeSalaryComponent } from './employee-salary/employee-salary.component';
import { CompensatoryTransactionComponent } from './compensatory-transaction/compensatory-transaction.component';
import { EmployeeFullAttendanceComponent } from './employee-full-attendance/employee-full-attendance.component';
import { GeneralSidebarComponent } from './general-sidebar/general-sidebar.component';
import { LeavePolicyComponent } from './leave-policy/leave-policy.component';
import { AttendanceValidationPolicyComponent } from './attendance-validation-policy/attendance-validation-policy.component';
import { LateComePolicyComponent } from './late-come-policy/late-come-policy.component';
import { EarlyExitPolicyComponent } from './early-exit-policy/early-exit-policy.component';
import { SalaryStructureComponent } from './salary-structure/salary-structure.component';
import { LeaveEncashmentComponent } from './leave-encashment/leave-encashment.component';
import { ATTENDANCE_KIOSK_ROUTE } from './attendance-plus/attendance-plus.routes';   // v1.12.0


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full', },
  { path: 'login', component: LoginComponent, },
  ATTENDANCE_KIOSK_ROUTE,   // v1.12.0 attendance kiosk tablet (the kiosk token identifies it – no login)
  { path: 'portal', loadChildren: () => import('./zeo-projects/zeo-projects.routes').then(m => m.PORTAL_LAZY) },   // v1.20.0 customer portal (own login, own layout)
  { path: 'prop-portal', loadChildren: () => import('./zeo-apps/portal/prop-portal.component').then(m => m.PROP_PORTAL_LAZY) },   // v1.21.0 tenant / owner / buyer portal


  { path: 'company-selection', component: CompanySelectionComponent },
  { path: 'main-dashboard', component: MainDashboardComponent },
  { path: 'schema-selection', component: SchemaSelectionComponent, canActivate: [AuthGuard], },
  { path: 'control', canActivate: [AuthGuard], children: CONTROL_ROUTES },   // v1.23.0 ZEO Cloud – Adept control console
  { path: 'group', canActivate: [AuthGuard], loadComponent: () => import('./zeo-group/group.component').then(m => m.GroupComponent) },        // v1.27.0 group view
  { path: 'group/:key', canActivate: [AuthGuard], loadComponent: () => import('./zeo-group/group.component').then(m => m.GroupComponent) },
  { path: 'signup', component: CloudSignupComponent },                       // v1.23.0 ZEO Cloud – sign-up (14-day trial)
  { path: 'careers', loadChildren: () => import('./careers/careers-public.component').then(m => m.CAREERS_ROUTES) },   // v1.57.0 public careers page (no login)
  { path: 'set-password', loadComponent: () => import('./shared-ui/z-set-password.component').then(m => m.ZSetPasswordComponent) },   // v1.56.0 sign-in link
  { path: 'activate', loadComponent: () => import('./shared-ui/z-security62.component').then(m => m.ZActivateComponent) },   // v1.62.0 activation without e-mail
  { path: 'm', loadChildren: () => import('./zeo-mobile/m.routes').then(m => m.MOBILE_ROUTES) },   // v1.25.0 mobile app
  { path: 'employee-schema-selection', component: EmployeeSchemaSelectionComponent, canActivate: [AuthGuard], },




  {
    path: 'main-sidebar',
    component: MainSidebarComponent, canActivate: [AuthGuard],
    canActivateChild: [menuRightsGuard],   // v1.62.0: an address whose menu entry the user may not see shows "No access"
    children: [
      // v1.15.1: /main-sidebar alone opens the dashboard (with the '**' below it would show "Page not found")
      { path: '', redirectTo: 'home', pathMatch: 'full' },   // v1.17.0: Home (was dashboard-contents)
      ...PRINT_VIEW_ROUTE,   // v1.62.0 print: a document printed with the company's design
      // v1.17.0: one Home menu entry – the right view per role, tabs for several; the old dashboard addresses open their tab
      { path: 'home', component: DashboardHomeComponent },
      { path: 'ceo-dashboard', redirectTo: '/main-sidebar/home?tab=management', pathMatch: 'full' },
      { path: 'manager-dashboard', redirectTo: '/main-sidebar/home?tab=team', pathMatch: 'full' },
      { path: 'my-dashboard', redirectTo: '/main-sidebar/home?tab=my', pathMatch: 'full' },
      // v1.7.0: My To-do (activities on every screen) and the organisation chart
      { path: 'todo', component: ZTodoComponent },
      { path: 'inbox', component: ZInboxComponent },   // v1.45.0 Discuss inbox
      { path: 'my-team', component: ZMyTeamComponent },   // v1.47.0 the manager's hub
      { path: 'wall', component: ZWallComponent },   // v1.47.0 company wall
      { path: 'my-one-on-ones', component: ZMyOneOnOnesComponent },   // v1.47.0 the 1:1s shared with me
      { path: 'my-loans', component: LoansComponent, data: { mine: true } },   // v1.49.0
      { path: 'my-air-ticket', redirectTo: '/main-sidebar/self-service/air-ticket', pathMatch: 'full' },   // v1.62.0 air ticket
      { path: 'my-final-settlement', component: LeaverCaseComponent, data: { mine: true } },   // v1.62.0 EOS: the leaver's own statement
      { path: 'org-chart', component: ZOrgChartComponent },

      // Performance, Recruitment and Learning Management (hr-modules)
      ...HR_MODULE_ROUTES,

      {
        path: 'sub-sidebar',
        component: SubSidebarComponent,
        children: [
          {
            path: 'department-master',
            component: DepartmentMasterComponent,
          },
          {
            path: 'designation-master',
            component: DesignationMasterComponent
          },
          { path: 'category-master', component: CatogaryMasterComponent },   // v1.15.1 (was catogary-master)
          { path: 'catogary-master', redirectTo: 'category-master', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
          { path: 'employee-master', component: EmployeeListComponent },              // v1.19.0 new list
          { path: 'employee-master-classic', component: EmployeeMasterComponent },    // v1.19.0 old list (import, bulk upload)
          { path: 'employee-transfer', component: EmployeeTransferComponent },   // v1.11.0
          { path: 'employee-details/:id/details', component: EmployeeRecordComponent },   // v1.19.0 new employee page
          { path: 'employee-details/:id/classic', component: EmployeeDetailsComponent },  // v1.19.0 old tabs


          // v1.15.1: attendance marking lives in Time & Attendance (one registration, correct spelling)
          moved('attendace-marking', '/main-sidebar/attendance-sidebar/attendance-marking'),


          {
            path: 'document-expired',
            component: DocumentExpiredComponent
          },
          // {
          //   path:'employee-overtime',
          //   component:EmployeeOvertimeComponent
          // },

          {
            path: 'resignation-approval-level',
            component: ResignationApprovalLevelComponent
          },

          {
            path: 'resignation-request',
            component: ResignationRequestComponent
          },

          {
            path: 'resignation-approvals',
            component: ResignationApprovalsComponent
          },
          // v1.62.0 EOS: one Leavers workspace replaces Approved resignations, End of service and Final settlement (old addresses open it)
          { path: 'leavers', component: LeaversComponent },
          { path: 'leavers/:id', component: LeaverCaseComponent },
          { path: 'resignation-approved-list', redirectTo: 'leavers', pathMatch: 'full' },
          { path: 'end-of-service', redirectTo: 'leavers', pathMatch: 'full' },
          { path: 'final-settlement', redirectTo: 'leavers', pathMatch: 'full' },
          { path: 'gratuity', component: GratuityComponent },   // v1.15.1 (was gratyuity)
          { path: 'gratyuity', redirectTo: 'gratuity', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks



          // v1.15.1: one report generator – the one under Reports
          moved('report-generate', '/main-sidebar/report-options/report-generate'),

        ],
      },
      {
        path: 'settings',
        component: SettingsComponent,
        children: [
          ...SETTINGS_HOME_ROUTES,   // v1.15.1: Settings home (the Settings gear opens it)
          ...SETTINGS_APPS_ROUTES,   // v1.21.0: Settings → Apps (activate apps, industry per app)
          ...CLOUD_SETTINGS_ROUTES,   // v1.23.0 ZEO Cloud: Subscription and Security (account owner)
          { path: 'licence', loadComponent: () => import('./zeo-licence/licence.component').then(m => m.LicenceComponent), data: { title: 'Licence' } },   // v1.28.0 Enterprise licence
          ...AI_SETTINGS_ROUTES,   // v1.16.0: Settings → AI settings
          ...PRINT_TEMPLATES_ROUTES,   // v1.62.0 print: Settings → Print templates (gallery, editor)
          ...COUNTRY_PACK_ROUTES,   // v1.20.1: Settings → Country settings (was /main-sidebar/country-settings)
          ...LANGUAGE_PACK_ROUTES,   // v1.20.1: Settings → Languages (was /main-sidebar/languages)
          { path: 'field-help', loadChildren: () => import('./field-help/field-help-settings.component').then(m => m.FIELD_HELP_ROUTES) },   // v1.16.0
          {
            path: 'company-master',
            component: CompanyMasterComponent
          },
          {
            path: 'branch-master',
            component: BranchMasterComponent
          },
          {
            path: 'user-master',
            component: UserMasterComponent
          },
          {
            path: 'company-details/:id/details',
            component: CompanyDetailsComponent
          },
          {
            path: 'user-grouping-master',
            component: UserGroupingMasterComponent
          },
          {
            path: 'branch-permissions',
            component: BranchPermissionsComponent
          },
          {
            path: 'state-master',
            component: StateMasterComponent
          },
          {
            path: 'document-type-master',
            component: DocumentTypeMasterComponent
          },


          {
            path: 'user-details/:id/details',
            component: UserDetailsComponent
          },
          {
            path: 'permission-assigned',
            component: PermissionAssignedComponent
          },

          {
            path: 'location-master',
            component: LocationMasterComponent
          },
          {
            path: 'document-numbering',
            component: DocumentNumberingComponent
          },

          { path: 'weekcalendar', component: WeelcalendarComponent },   // v1.15.1 (was weelcalendar)
          { path: 'weelcalendar', redirectTo: 'weekcalendar', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
          {
            path: 'assign-weekcalendar',
            component: AssignWeekcalendarComponent
          },
          {
            path: 'assignweek-calendar-days',
            component: AssignweekCalendarDaysComponent
          },
          {
            path: 'holiday-calendar',
            component: HolidayCalendarComponent
          },
          {
            path: 'assign-holiday-calendar',
            component: AssignHolidayCalendarComponent
          },

          // v1.15.1: shifts are kept in Shift Planner → Shift master (same calendars.Shift table, plus the shift rules)
          moved('shifts', '/main-sidebar/shift-planner/shifts'),

          // {
          //   path:'report-generate',
          //   component:ReportGenerateComponent,
          // },
          // {
          //   path:'document-report',
          //   component:DocumentReportComponent,
          // },
          // {
          //   path:'general-request-report',
          //   component:GeneralRequestReportComponent
          // },
          // {
          //   path:'department-report',
          //   component:DepartmentReportComponent
          // },
          // {
          //   path:'designation-report',
          //   component:DesignationReportComponent
          // },
          // {
          //   path:'leave-approvals-report',
          //   component:LeaveApprovalsReportComponent
          // },
          // {
          //   path:'leave-balance-report',
          //   component:LeaveBalanceReportComponent
          // },
          // {
          //   path:'employee-attendance',
          //   component:EmployeeAttendanceComponent
          // },
          // {
          //   path:'asset-report',
          //   component:AssetReportComponent
          // },
          // {
          //   path:'asset-transaction-report',
          //   component:AssetTransactionReportComponent
          // },
          { path: 'form-designer', component: FromDesignerComponent },   // v1.15.1 (was from-designer)
          { path: 'from-designer', redirectTo: 'form-designer', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
          {
            path: 'asset-udf',
            component: AssetUdfComponent
          },
          {
            path: 'email-template',
            component: EmailTemplateComponent
          },
          {
            path: 'email-configuration',
            component: EmailConfigurationComponent
          },
          { path: 'messages-and-tags', component: ZCollabSettingsComponent },   // v1.45.0 reply mailbox, tags
          { path: 'whatsapp-sms-push', component: ZMessagingSettingsComponent },   // v1.51.0
          { path: 'my-account', component: ZMyAccountComponent },   // v1.52.0 authenticator app, sign-ins, out of office
          { path: 'sign-in-security', component: ZSignInSecurityComponent },   // v1.52.0
          { path: 'single-sign-on', loadComponent: () => import('./shared-ui/z-sso-settings.component').then(m => m.ZSsoSettingsComponent) },   // v1.54.0
          { path: 'api-keys-webhooks', component: ZIntegrationsComponent },
          { path: 'import-history', component: ZImportHistoryComponent },
          { path: 'data-workbook', loadComponent: () => import('./shared-ui/z-data-workbook.component').then(m => m.ZDataWorkbookComponent) },   // v1.62.0 workbook
          { path: 'system-health', component: ZHealthComponent },
          { path: 'data-retention', component: ZPrivacyComponent },   // v1.53.0
          { path: 'security-dashboard', loadComponent: () => import('./shared-ui/z-security62.component').then(m => m.ZSecurityDashboardComponent) },   // v1.62.0
          { path: 'give-access', loadComponent: () => import('./shared-ui/z-security62.component').then(m => m.ZGiveAccessComponent) },   // v1.62.0
          { path: 'bank-changes', loadComponent: () => import('./shared-ui/z-security62.component').then(m => m.ZBankChangesComponent) },   // v1.62.0
          { path: 'history-retention', data: { page: true }, loadComponent: () => import('./shared-ui/z-security62.component').then(m => m.ZHistoryCleaningComponent) },   // v1.62.0
          { path: 'test-company', component: ZTestCompanyComponent },
          { path: 'setup-guide', loadComponent: () => import('./shared-ui/z-setup-guide.component').then(m => m.ZSetupGuideComponent) },   // v1.56.0
          { path: 'audit-log', component: ZAuditComponent },   // v1.46.0 company-wide audit log
          {
            path: 'notification-settings',
            component: NotificationSettingsComponent
          },

          {
            path: 'document-request-email-template',
            component: DocumentRequestEmailTemplateComponent
          },
          {
            path: 'advance-salary-emailtemplate',
            component: AdvanceSalaryEmailtemplateComponent
          },
          {
            path: 'loan-email-template',
            component: LoanEmailTemplateComponent
          },

          {
            path: 'asset-email-template',
            component: AssetEmailTemplateComponent
          },

          {
            path: 'airticket-email-template',
            component: AirticketEmailTemplateComponent
          },

          {
            path: 'resignation-email-template',
            component: ResignationEmailTemplateComponent
          },

          {
            path: 'latein-earlyout-email-template',
            component: LateinEarlyoutEmailTemplateComponent
          },

          {
            path: 'leave-template',
            component: LeaveTemplateComponent,
          },
          {
            path: 'doc-exp-emailtemplate',
            component: DocExpEmailtemplateComponent
          },
          {
            path: 'company-policy',
            component: CompanyPolicyComponent
          },

        ],
      },
      {
        path: 'leave-options',
        component: LeaveOptionsComponent,
        children: [
          { path: 'leave-policies', component: LeavePoliciesComponent },          // v1.10.0
          { path: 'leave-planner', component: LeavePlannerComponent },            // v1.10.0
          { path: 'leave-conflicts', component: LeaveConflictsComponent },        // v1.51.0
          { path: 'encashment-approvals', component: EncashmentApprovalsComponent }, // v1.10.0
          { path: 'rejoining', component: RejoiningComponent },                  // v1.11.0
          {
            path: 'leave-type',
            component: LeaveTypeComponent,
          },

          {
            path: 'leave-master',
            component: LeaveMasterComponent,
          },
         {
            path: 'leave-encashment',
            component: LeaveEncashmentComponent,
          },
          {
            path: 'leave-request',
            component: LeaveRequestComponent,
          },
          {
            path: 'leave-approval-level',
            component: LeaveApprovalLevelComponent,
          },
          {
            path: 'leave-balance',
            component: LeaveBalanceComponent,
          },


          {
            path: 'leave-approvals',
            component: LeaveApprovalsComponent,
          },
          {
            path: 'compensatory-leave',
            component: CompensatoryLeaveComponent,
          },

          {
            path: 'compensatory-transaction',
            component: CompensatoryTransactionComponent,
          },

          {
            path: 'immediate-rejection',
            component: ImmediateRejectionComponent,
          },
          { path: 'leave-accrual', component: LeaveAccruvalComponent },   // v1.15.1 (was leave-accruval)
          { path: 'leave-accruval', redirectTo: 'leave-accrual', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
          {
            path: 'employee-leave-rejoin',
            component: EmployeeLeaveRejoinComponent
          },
          {
            path: 'leave-escalation',
            component: LeaveEscalationComponent
          },

          {
            path: 'leave-policy',
            component: LeavePolicyComponent
          },
        ]

      },

      {
        path: 'salary-options',
        component: SalaryOptionsComponent,
        children: [
          {
            path: 'salary',
            component: SalaryComponent,
          },

          {
            path: 'employee-salary',
            component: SalaryRegisterComponent,   // v1.62.0 payroll: monthly salaries + the assign screen as a tab
          },

          // v1.62.0 payroll: the run-centred workspace; the previous screen stays as "Classic pay sheets"
          { path: 'pay-roll', loadComponent: () => import('./payroll-plus/payroll-runs.component').then(m => m.PayrollRunsComponent) },
          { path: 'payroll-run/:id', loadComponent: () => import('./payroll-plus/payroll-run.component').then(m => m.PayrollRunComponent) },
          {
            path: 'pay-roll-classic',
            component: PayRollComponent,
          },

          {
            path: 'pay-structure',
            component: PayStructureComponent,
          },
          {
            path: 'salary-structure',
            component: SalaryStructureComponent,
          },
          {
            path: 'payroll-details/:id',
            component: PayrollDetailsComponent
          },

          { path: 'payroll-approval-level', component: PayrollAppovalLevelComponent },   // v1.15.1 (was payroll-appoval-level)
          { path: 'payroll-appoval-level', redirectTo: 'payroll-approval-level', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks

          // v1.62.0 payroll: approvals grouped by run; the previous list stays as "Show as one list"
          { path: 'payslip-approval', loadComponent: () => import('./payroll-plus/payslip-approvals.component').then(m => m.PayslipApprovalsComponent) },
          {
            path: 'payslip-approval-list',
            component: PayslipApprovalComponent,
          },
          {
            path: 'wps',
            component: WpsComponent,
          },
          { path: 'payroll-controls', component: PayrollControlsComponent },   // v1.18.0
          { path: 'provisions', component: ProvisionsComponent },   // v1.49.0
          { path: 'loans', component: LoansComponent },
          { path: 'what-if', component: WhatIfComponent },   // v1.50.0
          { path: 'cost-allocation', component: CostAllocationComponent },
          { path: 'pay-calendars', loadComponent: () => import('./payroll-plus/pp-v155.component').then(m => m.PayCalendarsComponent) },   // v1.55.0
          { path: 'off-cycle', loadComponent: () => import('./payroll-plus/pp-v155.component').then(m => m.OffCycleComponent) },
          { path: 'arrears', loadComponent: () => import('./payroll-plus/pp-v155.component').then(m => m.ArrearsComponent) },
          { path: 'statutory-schemes', component: StatutorySchemesComponent },   // v1.31.0
          { path: 'legal-rates', loadComponent: () => import('./payroll-plus/legal-rates.component').then(m => m.LegalRatesComponent) },   // v1.59.0
          { path: 'accounting', component: AccountingComponent },   // v1.35.0 accounting integration

          {
            path: 'advance-salary-approval-level',
            component: AdvanceSalaryApprovalLevelComponent,
          },
          {
            path: 'advance-salary-request',   // v1.15.1: was registered twice
            component: AdvanceSalaryRequestComponent,
          },
          {
            path: 'advance-salary-approvals',
            component: AdvanceSalaryApprovalsComponent,
          },
          {
            path: 'advance-salary-escalation',
            component: AdvanceSalaryEscalationComponent,
          },

        ]

      },


      {
        path: 'loan-sidebar',
        component: LoanSidebarComponent,
        children: [
          {
            path: 'loan-type',
            component: LoanTypeComponent,
          },
          {
            path: 'loan-application',
            component: LoanApplicationComponent,
          },
          {
            path: 'loan-repayment',
            component: LoanRepaymentComponent,
          },
          { path: 'loan-approval-level', component: LoanApprovelLevelComponent },   // v1.15.1 (was loan-approvel-level)
          { path: 'loan-approvel-level', redirectTo: 'loan-approval-level', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks

          {
            path: 'loan-approval',
            component: LoanApprovalComponent,
          },

          {
            path: 'loan-escalation',
            component: LoanEscalationComponent,
          },


        ]

      },


      {
        path: 'asset-options',
        component: AssetOptionsComponent,
        children: [
          // v1.15.1: the asset register and allocations are in Assets (asset-plus, same OrganisationManager tables);
          // asset types, asset requests, their approvals, levels and escalation stay here (no new screen for them).
          moved('', '/main-sidebar/asset-plus'),
          moved('asset-master', '/main-sidebar/asset-plus/register'),
          moved('asset-allocation', '/main-sidebar/asset-plus/allocations'),
          { path: 'asset-approvel-level', redirectTo: 'asset-approval-level', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks

          {
            path: 'asset-type',
            component: AssetTypesComponent,
          },

          {
            path: 'asset-request',
            component: AssetRequestComponent,
          },
          { path: 'asset-approval-level', component: AssetApprovelLevelComponent },   // v1.15.1 (was asset-approvel-level)
          {
            path: 'asset-approval',
            component: AssetApprovalComponent,
          },
          {
            path: 'asset-escalation',
            component: AssetEscalationComponent,
          },


        ]

      },

      {
        path: 'attendance-sidebar',
        component: AttendanceSidebarComponent,
        children: [
          // v1.15.1: the attendance app is Attendance (attendance-plus); the screens below have no new equivalent yet and stay
          moved('', '/main-sidebar/attendance-plus'),
          { path: 'attendance-marking', component: AttendaceMarkingComponent },   // v1.15.1 (was attendace-marking)
          { path: 'attendace-marking', redirectTo: 'attendance-marking', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
          // v1.15.1: two older copies of other screens of this module
          { path: 'attendance-punching', redirectTo: 'employee-face-register', pathMatch: 'full' },        // same face / barcode registration
          { path: 'employee-punching-details', redirectTo: 'employee-punching-list', pathMatch: 'full' },  // same attendance rows, without filters

          {
            path: 'employee-early-going',
            component: EmployeeEarlyGoingComponent,
          },
          {
            path: 'employee-recheck',
            component: EmployeeRecheckComponent,
          },

          {
            path: 'employee-punching-list',
            component: EmployeePunchingListComponent,
          },

          {
            path: 'geofence',
            component: GeofenceComponent,
          },

          {
            path: 'employee-face-register',
            component: EmployeeFaceRegisterComponent,
          },

          {
            path: 'manual-entry',
            component: ManualEntryComponent,
          },


          {
            path: 'attendance-policy',
            component: AttendancePolicyComponent,
          },

          {
            path: 'attendance-attendance-request',
            component: AttendanceRequestComponent,
          },

          {
            path: 'latein-earlyout-approval-level',
            component: LateinEarlyoutApprovalLevelComponent,
          },

          {
            path: 'latein-earlyout-approvals',
            component: LateinEarlyoutApprovalsComponent,
          },

          {
            path: 'employee-full-attendance',
            component: EmployeeFullAttendanceComponent,
          },

          {
            path: 'attendance-validation-policy',
            component: AttendanceValidationPolicyComponent
          },

          {
            path: 'late-come-policy',
            component: LateComePolicyComponent
          },

          {
            path: 'early-exit-policy',
            component: EarlyExitPolicyComponent
          },



        ]

      },

      {
        path: 'general-sidebar',
        component: GeneralSidebarComponent,
        children: [

          {
            path: 'announcement-master',
            component: AnnouncementMasterComponent
          },

          {
            path: 'document-request-level',
            component: DocumentRequestLevelComponent
          },

          {

            path: 'document-request-type',
            component: DocumentRequestTypeComponent

          },

          {
            path: 'document-request',
            component: DocumentRequestComponent
          },

          {
            path: 'document-request-approval',
            component: DocumentRequestApprovalsComponent
          },

          {
            path: 'general-request',
            component: GeneralRequestComponent,
          },
          {
            path: 'general-request-escalation',
            component: GeneralRequestEscalationComponent,
          },

          {
            path: 'request-type',
            component: RequestTypeComponent,
          },
          {
            path: 'approval-level',
            component: ApprovalLevelComponent,
          },
          {
            path: 'approvals',
            component: ApprovalsComponent,
          },





        ]

      },

      {
        path: 'air-ticket-options',
        component: AirTicketOptionsComponent,
        children: [

          {
            path: 'air-ticket-policy',
            component: AirTicketPolicyComponent,
          },


          {
            path: 'airticket-allocation',
            component: AirticketAllocationComponent,
          },


          {
            path: 'airticket-request',
            component: AirticketRequestComponent,
          },
          {
            path: 'airticket-rule',
            component: AirticketRuleComponent,
          },

          {
            path: 'airticket-approval-level',
            component: AirticketApprovalLevelComponent,
          },

          {
            path: 'airticket-approvals',
            component: AirticketApprovalsComponent,
          },

          {
            path: 'airticket-escalation',
            component: AirticketEscalationComponent,
          },


        ]

      },



      {
        path: 'project-options',
        component: ProjectOptionsComponent,
        children: [

          {
            path: 'project-master',
            component: ProjectMasterComponent,
          },
          {
            path: 'project-stages',
            component: ProjectStagesComponent,
          },


          {
            path: 'project-tasks',
            component: ProjectTasksComponent,
          },

          {
            path: 'project-timesheet',
            component: ProjectTimesheetComponent,
          },
          ...PROJECT_CONTROL_CHILDREN,   // v1.11.0


        ]

      },

      {
        path: 'shift-options',
        component: ShiftOptionsComponent,
        children: [
          // v1.15.1: shifts are kept in Shift Planner → Shift master (same calendars.Shift table, plus the shift rules)
          moved('', '/main-sidebar/shift-planner'),
          moved('shifts', '/main-sidebar/shift-planner/shifts'),

          {
            path: 'shift-pattern',
            component: ShiftPatternComponent,
          },

          {
            path: 'shift-employee',
            component: ShiftEmployeeComponent,
          },

          {
            path: 'shift-override',
            component: ShiftOverrideComponent,
          },

          {
            path: 'employee-overtime',
            component: EmployeeOvertimeComponent,
          },

          {
            path: 'overtime-policy',
            component: OvertimePolicyComponent,
          },

          {
            path: 'overtime-rule',
            component: OvertimeRuleComponent,
          },



        ]

      },

      {
        path: 'report-options',
        component: ReportOptionsComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'home' },   // v1.62.0 reports: the report home
          { path: 'home', component: ZReportHomeComponent },   // v1.62.0 reports
          { path: 'r/:key', component: ZReportComponent },   // v1.8.0 report centre
          { path: 'scheduled', component: ZScheduledReportsComponent },   // v1.52.0
          { path: 'builder', component: ZReportBuilderComponent },   // v1.53.0
          { path: 'dashboards', component: ZDashboardsComponent },
          { path: 'rec/:label/:id', component: ZRecordViewComponent },   // v1.8.1 drill-down to the record

          {
            path: 'report-generate',
            component: ReportGenerateComponent,
          },
          {
            path: 'document-report',
            component: DocumentReportComponent,
          },
          {
            path: 'general-request-report',
            component: GeneralRequestReportComponent,
          },
          {
            path: 'department-report',
            component: DepartmentReportComponent,
          },
          {
            path: 'designation-report',
            component: DesignationReportComponent,
          },
          {
            path: 'leave-report',
            component: LeaveReportComponent
          },
          {
            path: 'leave-approvals-report',
            component: LeaveApprovalsReportComponent,
          },
          {
            path: 'leave-balance-report',
            component: LeaveBalanceReportComponent,
          },
          {
            path: 'employee-attendance',
            component: EmployeeAttendanceComponent,
          },
          {
            path: 'asset-report',
            component: AssetReportComponent,
          },
          {
            path: 'asset-transaction-report',
            component: AssetTransactionReportComponent,
          },



        ]

      },

      {
        path: 'document-folders',
        component: DocumentFoldersComponent,
        children: [

          {
            path: 'document-folder-files/:id',
            component: DocumentFolderFilesComponent,
          },



        ]

      },


      // v1.17.0: the old Company dashboard address (also where the login lands) opens Home on the view of the user's role
      { path: 'dashboard-contents', redirectTo: '/main-sidebar/home', pathMatch: 'full' },
      { path: 'attendace-marking', redirectTo: 'attendance-sidebar/attendance-marking', pathMatch: 'full' },   // v1.15.1 one registration


      {
        path: 'fiscal-year',
        component: FiscalYearComponent,
      },

      { path: 'automation', component: SettingsComponent, loadChildren: () => import('./zeo-flow/zeo-flow.routes').then(m => m.FLOW_ROUTES) },   // v1.29.0 workflow automation (Settings shell = sub-sidebar with the Automation menu)
      { path: '_reload', children: [] },   // v1.28.1: blank stop used to re-open the current page after a company / branch change
      { path: 'no-access', component: NoAccessComponent },   // v1.62.0 (menu-rights.guard.ts)
      // v1.15.1: unknown addresses under /main-sidebar/ show "Page not found" inside the app (menu stays)
      { path: '**', component: NotFoundComponent },
    ]
  },
  {
    path: 'sub-navigation',
    component: SubNavigationComponent
  },

  {
    path: 'employee-dashboard',
    component: EmployeeDashboardComponent, canActivate: [AuthGuard],   // v1.13.0: the portal needs a login
    children: [
      { path: 'employee-section', component: EmployeeSctionComponent },   // v1.15.1 (was employee-sction)
      { path: 'employee-sction', redirectTo: 'employee-section', pathMatch: 'full' },   // v1.15.1 old spelling kept for bookmarks
      {
        path: 'employee-approvals',
        component: EmployeeApprovalsComponent,
      },
      {
        path: 'employee-leave',
        component: EmployeeLeaveComponent,
      },
      {
        path: 'emp-attendance',
        component: EmpAttendanceComponent,
      },
      {
        path: 'emp-asset-request',
        component: EmpAssetRequestComponent,
      },
      {
        path: 'emp-loan',
        component: EmpLoanComponent,
      },
    ]
  },

  {
    path: 'branch-creation',
    component: BranchCreationComponent
  },
  // v1.15.1: every other address → "Page not found" (was a redirect to /main-content, which does not exist → blank page)
  { path: '**', component: NotFoundComponent },
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  // { path: 'login', component: LoginComponent },
  // { path: 'dashboard', component: DashboardComponent },


  //   { path: '', redirectTo: '/login', pathMatch: 'full' },
  //   { path: 'login', component: LoginComponent },

  //  {
  //    path: 'main-sidebar', 
  //    component: MainSidebarComponent,
  //    children: [
  //      { path: 'sub-sidebar', component: SubSidebarComponent },

  //    ],
  //  },
  //  { path: 'sub-sidebar/:subNavId', component: SubNavigationComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
