import { Routes } from '@angular/router';
import { moved } from '../not-found/moved';   // v1.15.1
import { ModuleOptionsComponent, ModuleMenuItem } from './module-options/module-options.component';
import { CrudPageComponent } from './crud-page/crud-page.component';
import { GoalWorkspaceComponent } from './goal-workspace/goal-workspace.component';
import { CalibrationComponent } from './calibration/calibration.component';
import { PipelineBoardComponent } from './pipeline-board/pipeline-board.component';
import { CYCLE_PAGE, KPI_PAGE, OUTCOME_PAGE, PIP_PAGE, TEMPLATE_PAGE } from './configs/performance.config';
import { APPROVAL_LEVEL_PAGE, CANDIDATE_PAGE, INTERVIEW_PAGE, JOB_PAGE, OFFER_PAGE, ONBOARDING_PAGE, REQUISITION_PAGE, TALENT_POOL_PAGE } from './configs/recruitment.config';
import { ZCareersSettingsComponent } from '../careers/careers-settings.component';   // v1.57.0
import { EssDashboardComponent } from './dashboards/ess-dashboard.component';
import { ManagerDashboardComponent } from './dashboards/manager-dashboard.component';
import { EXPENSE_ROUTES } from '../expense/expense.routes';   // v1.11.0
import { ORG_STRUCTURE_ROUTES } from '../org-structure/org-structure.routes';   // v1.12.0
import { SHIFT_PLANNER_ROUTES } from '../shift-planner/shift-planner.routes';   // v1.12.0
import { ZeoAiComponent } from '../zeo-ai/zeo-ai.component';   // v1.37.0 AI assistants
import { ZModuleShellComponent } from '../shared-ui/z-module-shell.component';   // v1.37.1 generic module frame (menu-config sidebar)
import { ATTENDANCE_PLUS_ROUTES } from '../attendance-plus/attendance-plus.routes';   // v1.12.0
import { ASSET_PLUS_ROUTES } from '../asset-plus/asset-plus.routes';   // v1.12.0
import { EMPLOYEE_PROFILE_ROUTES } from '../employee-profile/employee-profile.routes';   // v1.13.0
import { SELF_SERVICE_ROUTES } from '../self-service/self-service.routes';   // v1.13.0
import { CeoDashboardComponent } from '../ceo-dashboard/ceo-dashboard.component';
import { UnifiedCalendarComponent } from '../unified-calendar/unified-calendar.component';
import { BUDGET_PAGE, CATEGORY_PAGE, EMPLOYEE_SKILL_PAGE, PROVIDER_PAGE, ROLE_SKILL_PAGE, SESSION_COST_PAGE, SKILL_PAGE, TRAINER_PAGE, VENUE_PAGE } from '../learning-plus/learning-plus.config';
import { MyLearningComponent } from '../learning-plus/my-learning.component';
import { TrainingHistoryComponent } from '../learning-plus/training-history.component';
import { SkillMatrixComponent } from '../learning-plus/skill-matrix.component';
import { LearningBudgetComponent } from '../learning-plus/budget.component';
import { TrainingMonthComponent } from '../learning-plus/training-calendar.component';
import { AttendanceSheetComponent } from '../learning-plus/attendance-sheet.component';
import { BOND_PAGE, CERTIFICATE_PAGE, COURSE_PAGE, LEARNING_REPORT_PAGE, NEEDS_PAGE, NOMINATION_PAGE, RESULT_PAGE, SESSION_PAGE } from './configs/learning.config';

const PERFORMANCE_MENU: ModuleMenuItem[] = [
  { path: 'kpi-library', label: 'KPI & Competency', icon: 'tune', model: 'kpi' },
  { path: 'templates', label: 'Appraisal templates', icon: 'dashboard_customize', model: 'appraisaltemplate' },
  { path: 'cycles', label: 'Appraisal cycle', icon: 'event_repeat', model: 'appraisalcycle' },
  { path: 'goal-setting', label: 'Goal setting', icon: 'flag', selfService: true },
  { path: 'check-in', label: 'Mid-year check-in', icon: 'update', selfService: true },
  { path: 'self-appraisal', label: 'Self appraisal', icon: 'rate_review', selfService: true },
  { path: 'manager-review', label: 'Manager review', icon: 'supervisor_account', selfService: true },
  { path: 'calibration', label: 'Calibration', icon: 'balance', model: 'calibrationlog' },
  { path: 'outcomes', label: 'Appraisal outcome', icon: 'trending_up', model: 'appraisaloutcome' },
  { path: 'pip', label: 'PIP', icon: 'warning', model: 'performanceimprovementplan' },
];

const RECRUITMENT_MENU: ModuleMenuItem[] = [
  { path: 'requisitions', label: 'Manpower requisition', icon: 'post_add', model: 'manpowerrequisition' },
  { path: 'job-openings', label: 'Job openings', icon: 'work', model: 'jobopening' },
  { path: 'pipeline', label: 'Candidate pipeline', icon: 'view_kanban', model: 'application' },
  { path: 'candidates', label: 'Candidates', icon: 'badge', model: 'candidate' },
  { path: 'talent-pools', label: 'Talent pools', icon: 'groups', model: 'talentpool' },          // v1.57.0
  { path: 'careers-page', label: 'Careers page', icon: 'public', model: 'jobopening' },            // v1.57.0
  { path: 'interviews', label: 'Interviews', icon: 'event', model: 'interview' },
  { path: 'offers', label: 'Offer letters', icon: 'description', model: 'offer' },
  { path: 'onboarding', label: 'Pre-Onboarding & Visa', icon: 'flight_land', model: 'visastep' },
  { path: 'approval-levels', label: 'Approval levels', icon: 'account_tree', model: 'requisitionapprovallevel' },
];

const LEARNING_MENU: ModuleMenuItem[] = [
  { path: 'my-learning', label: 'My learning', icon: 'school', selfService: true },   // v1.11.0
  { path: 'needs', label: 'Training needs', icon: 'psychology', model: 'trainingneed' },
  { path: 'courses', label: 'Course catalog', icon: 'menu_book', model: 'course' },
  { path: 'calendar', label: 'Training calendar', icon: 'calendar_month', model: 'trainingsession' },
  { path: 'nominations', label: 'Nominations', icon: 'group_add', model: 'nomination' },
  { path: 'results', label: 'Attendance & Assessment', icon: 'checklist', model: 'participantresult' },
  { path: 'certificates', label: 'Certificates', icon: 'workspace_premium', selfService: true },
  { path: 'bonds', label: 'Training bond', icon: 'handshake', selfService: true },
  { path: 'reports', label: 'Learning reports', icon: 'insights', model: 'trainingsession' },
  // v1.11.0
  { path: 'month', label: 'Calendar (month)', icon: 'event', selfService: true },
  { path: 'attendance-sheet', label: 'Attendance sheet', icon: 'fact_check', model: 'participantresult' },
  { path: 'history', label: 'Training history', icon: 'history', selfService: true },
  { path: 'skill-matrix', label: 'Skill matrix', icon: 'grid_on', selfService: true },
  { path: 'employee-skills', label: 'Employee skills', icon: 'stars', selfService: true },
  { path: 'budget-vs-actual', label: 'Budget vs Actual', icon: 'bar_chart', model: 'trainingsession' },
  { path: 'budgets', label: 'Training budgets', icon: 'account_balance', model: 'trainingsession' },
  { path: 'session-costs', label: 'Session costs', icon: 'receipt_long', model: 'trainingsession' },
  { path: 'skills', label: 'Skills', icon: 'psychology_alt', model: 'course' },
  { path: 'role-skills', label: 'Role skills', icon: 'assignment_ind', model: 'course' },
  { path: 'categories', label: 'Training categories', icon: 'category', model: 'course' },
  { path: 'providers', label: 'Training providers', icon: 'apartment', model: 'course' },
  { path: 'trainers', label: 'Trainers', icon: 'co_present', model: 'course' },
  { path: 'venues', label: 'Venues', icon: 'meeting_room', model: 'course' },
];

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/** Added to the 'main-sidebar' children in app-routing.module.ts */
export const HR_MODULE_ROUTES: Routes = [
  { path: 'manager-dashboard', component: ManagerDashboardComponent },
  { path: 'ceo-dashboard', component: CeoDashboardComponent },          // v1.11.0
  { path: 'unified-calendar', component: ZModuleShellComponent, data: { title: 'Calendar' }, children: [{ path: '', component: UnifiedCalendarComponent }] },    // v1.11.0; v1.37.1: with the Calendars menu (weekend / holiday calendars)
  ...EXPENSE_ROUTES,                                                    // v1.11.0
  // v1.15.1: one "My policies" page – /main-sidebar/my-policies (the copy inside Organisation redirects there)
  moved('org-structure/my-policies', '/main-sidebar/my-policies'),
  ...ORG_STRUCTURE_ROUTES,                                              // v1.12.0
  ...SHIFT_PLANNER_ROUTES,                                              // v1.12.0
  ...ATTENDANCE_PLUS_ROUTES,                                            // v1.12.0
  ...ASSET_PLUS_ROUTES,                                                 // v1.12.0
  { path: 'zeo-projects', loadChildren: () => import('../zeo-projects/zeo-projects.routes').then(m => m.ZEO_PROJECTS_LAZY) },   // v1.20.0 Projects app (loaded on first use)
  // v1.21.0 CRM, Property, Maintenance (ZEO app kit) and HSE apps, each loaded on first use
  { path: 'zeo-crm', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_APP_LAZY) },
  { path: 'zeo-property', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_APP_LAZY) },
  { path: 'zeo-maintenance', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_APP_LAZY) },
  { path: 'zeo-assets', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_ASSETS_LAZY) },   // v1.33.0
  { path: 'zeo-people', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_PEOPLE_LAZY) },   // v1.36.0
  { path: 'zeo-hr', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_HR_LAZY) },   // v1.48.0 HR operations
  { path: 'zeo-masters', loadChildren: () => import('../zeo-apps/zeo-apps.routes').then(m => m.ZEO_MASTERS_LAZY) },   // v1.41.0 business partners (v1.44.0 statement, valuation)
  { path: 'zeo-ai', component: ZModuleShellComponent, data: { title: 'AI assistants' }, children: [{ path: '', redirectTo: 'payroll', pathMatch: 'full' }, { path: ':tab', component: ZeoAiComponent }] },   // v1.37.0 AI assistants
  { path: 'zeo-hse', loadChildren: () => import('../zeo-hse/zeo-hse.routes').then(m => m.ZEO_HSE_LAZY) },
  ...EMPLOYEE_PROFILE_ROUTES,                                           // v1.13.0
  ...SELF_SERVICE_ROUTES,                                               // v1.13.0
  // v1.20.1: Country settings and Languages open inside Settings (with the Settings menu); the old addresses still work
  { path: 'country-settings', redirectTo: 'settings/country-settings', pathMatch: 'full' },
  { path: 'languages', redirectTo: 'settings/languages', pathMatch: 'full' },
  { path: 'my-dashboard', component: EssDashboardComponent },
  {
    path: 'performance-options',
    component: ModuleOptionsComponent,
    data: { title: 'Performance options', base: '/main-sidebar/performance-options', menu: PERFORMANCE_MENU },
    children: [
      { path: '', redirectTo: 'goal-setting', pathMatch: 'full' },
      page('kpi-library', KPI_PAGE),
      page('templates', TEMPLATE_PAGE),
      page('cycles', CYCLE_PAGE),
      { path: 'goal-setting', component: GoalWorkspaceComponent, data: { mode: 'goals' } },
      { path: 'check-in', component: GoalWorkspaceComponent, data: { mode: 'checkin' } },
      { path: 'self-appraisal', component: GoalWorkspaceComponent, data: { mode: 'self' } },
      { path: 'manager-review', component: GoalWorkspaceComponent, data: { mode: 'review' } },
      { path: 'calibration', component: CalibrationComponent },
      page('outcomes', OUTCOME_PAGE),
      page('pip', PIP_PAGE),
    ],
  },
  {
    path: 'recruitment-options',
    component: ModuleOptionsComponent,
    data: { title: 'Recruitment options', base: '/main-sidebar/recruitment-options', menu: RECRUITMENT_MENU },
    children: [
      { path: '', redirectTo: 'job-openings', pathMatch: 'full' },
      page('requisitions', REQUISITION_PAGE),
      page('job-openings', JOB_PAGE),
      { path: 'pipeline', component: PipelineBoardComponent },
      page('candidates', CANDIDATE_PAGE),
      page('talent-pools', TALENT_POOL_PAGE),
      { path: 'careers-page', component: ZCareersSettingsComponent },
      page('interviews', INTERVIEW_PAGE),
      page('offers', OFFER_PAGE),
      page('onboarding', ONBOARDING_PAGE),
      page('approval-levels', APPROVAL_LEVEL_PAGE),
    ],
  },
  {
    path: 'learning-options',
    component: ModuleOptionsComponent,
    data: { title: 'Learning options', base: '/main-sidebar/learning-options', menu: LEARNING_MENU },
    children: [
      { path: '', redirectTo: 'my-learning', pathMatch: 'full' },
      page('needs', NEEDS_PAGE),
      page('courses', COURSE_PAGE),
      page('calendar', SESSION_PAGE),
      page('nominations', NOMINATION_PAGE),
      page('results', RESULT_PAGE),
      page('certificates', CERTIFICATE_PAGE),
      page('bonds', BOND_PAGE),
      page('reports', LEARNING_REPORT_PAGE),
      // v1.11.0
      { path: 'my-learning', component: MyLearningComponent },
      { path: 'month', component: TrainingMonthComponent },
      { path: 'attendance-sheet', component: AttendanceSheetComponent },
      { path: 'history', component: TrainingHistoryComponent },
      { path: 'skill-matrix', component: SkillMatrixComponent },
      { path: 'budget-vs-actual', component: LearningBudgetComponent },
      page('employee-skills', EMPLOYEE_SKILL_PAGE),
      page('skills', SKILL_PAGE),
      page('role-skills', ROLE_SKILL_PAGE),
      page('categories', CATEGORY_PAGE),
      page('providers', PROVIDER_PAGE),
      page('trainers', TRAINER_PAGE),
      page('venues', VENUE_PAGE),
      page('budgets', BUDGET_PAGE),
      page('session-costs', SESSION_COST_PAGE),
    ],
  },
];
