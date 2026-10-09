import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from './module-options/module-options.component';
import { CrudPageComponent } from './crud-page/crud-page.component';
import { GoalWorkspaceComponent } from './goal-workspace/goal-workspace.component';
import { CalibrationComponent } from './calibration/calibration.component';
import { PipelineBoardComponent } from './pipeline-board/pipeline-board.component';
import { CYCLE_PAGE, KPI_PAGE, OUTCOME_PAGE, PIP_PAGE, TEMPLATE_PAGE } from './configs/performance.config';
import { APPROVAL_LEVEL_PAGE, CANDIDATE_PAGE, INTERVIEW_PAGE, JOB_PAGE, OFFER_PAGE, ONBOARDING_PAGE, REQUISITION_PAGE } from './configs/recruitment.config';
import { EssDashboardComponent } from './dashboards/ess-dashboard.component';
import { ManagerDashboardComponent } from './dashboards/manager-dashboard.component';
import { EXPENSE_ROUTES } from '../expense/expense.routes';   // v1.11.0
import { ORG_STRUCTURE_ROUTES } from '../org-structure/org-structure.routes';   // v1.12.0
import { SHIFT_PLANNER_ROUTES } from '../shift-planner/shift-planner.routes';   // v1.12.0
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
  { path: 'templates', label: 'Appraisal Templates', icon: 'dashboard_customize', model: 'appraisaltemplate' },
  { path: 'cycles', label: 'Appraisal Cycle', icon: 'event_repeat', model: 'appraisalcycle' },
  { path: 'goal-setting', label: 'Goal Setting', icon: 'flag', selfService: true },
  { path: 'check-in', label: 'Mid-Year Check-in', icon: 'update', selfService: true },
  { path: 'self-appraisal', label: 'Self Appraisal', icon: 'rate_review', selfService: true },
  { path: 'manager-review', label: 'Manager Review', icon: 'supervisor_account', selfService: true },
  { path: 'calibration', label: 'Calibration', icon: 'balance', model: 'calibrationlog' },
  { path: 'outcomes', label: 'Appraisal Outcome', icon: 'trending_up', model: 'appraisaloutcome' },
  { path: 'pip', label: 'PIP', icon: 'warning', model: 'performanceimprovementplan' },
];

const RECRUITMENT_MENU: ModuleMenuItem[] = [
  { path: 'requisitions', label: 'Manpower Requisition', icon: 'post_add', model: 'manpowerrequisition' },
  { path: 'job-openings', label: 'Job Openings', icon: 'work', model: 'jobopening' },
  { path: 'pipeline', label: 'Candidate Pipeline', icon: 'view_kanban', model: 'application' },
  { path: 'candidates', label: 'Candidates', icon: 'badge', model: 'candidate' },
  { path: 'interviews', label: 'Interviews', icon: 'event', model: 'interview' },
  { path: 'offers', label: 'Offer Letters', icon: 'description', model: 'offer' },
  { path: 'onboarding', label: 'Pre-Onboarding & Visa', icon: 'flight_land', model: 'visastep' },
  { path: 'approval-levels', label: 'Approval Levels', icon: 'account_tree', model: 'requisitionapprovallevel' },
];

const LEARNING_MENU: ModuleMenuItem[] = [
  { path: 'my-learning', label: 'My Learning', icon: 'school', selfService: true },   // v1.11.0
  { path: 'needs', label: 'Training Needs', icon: 'psychology', model: 'trainingneed' },
  { path: 'courses', label: 'Course Catalog', icon: 'menu_book', model: 'course' },
  { path: 'calendar', label: 'Training Calendar', icon: 'calendar_month', model: 'trainingsession' },
  { path: 'nominations', label: 'Nominations', icon: 'group_add', model: 'nomination' },
  { path: 'results', label: 'Attendance & Assessment', icon: 'checklist', model: 'participantresult' },
  { path: 'certificates', label: 'Certificates', icon: 'workspace_premium', selfService: true },
  { path: 'bonds', label: 'Training Bond', icon: 'handshake', selfService: true },
  { path: 'reports', label: 'Learning Reports', icon: 'insights', model: 'trainingsession' },
  // v1.11.0
  { path: 'month', label: 'Calendar (month)', icon: 'event', selfService: true },
  { path: 'attendance-sheet', label: 'Attendance Sheet', icon: 'fact_check', model: 'participantresult' },
  { path: 'history', label: 'Training History', icon: 'history', selfService: true },
  { path: 'skill-matrix', label: 'Skill Matrix', icon: 'grid_on', selfService: true },
  { path: 'employee-skills', label: 'Employee Skills', icon: 'stars', selfService: true },
  { path: 'budget-vs-actual', label: 'Budget vs Actual', icon: 'bar_chart', model: 'trainingsession' },
  { path: 'budgets', label: 'Training Budgets', icon: 'account_balance', model: 'trainingsession' },
  { path: 'session-costs', label: 'Session Costs', icon: 'receipt_long', model: 'trainingsession' },
  { path: 'skills', label: 'Skills', icon: 'psychology_alt', model: 'course' },
  { path: 'role-skills', label: 'Role Skills', icon: 'assignment_ind', model: 'course' },
  { path: 'categories', label: 'Training Categories', icon: 'category', model: 'course' },
  { path: 'providers', label: 'Training Providers', icon: 'apartment', model: 'course' },
  { path: 'trainers', label: 'Trainers', icon: 'co_present', model: 'course' },
  { path: 'venues', label: 'Venues', icon: 'meeting_room', model: 'course' },
];

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/** Added to the 'main-sidebar' children in app-routing.module.ts */
export const HR_MODULE_ROUTES: Routes = [
  { path: 'manager-dashboard', component: ManagerDashboardComponent },
  { path: 'ceo-dashboard', component: CeoDashboardComponent },          // v1.11.0
  { path: 'unified-calendar', component: UnifiedCalendarComponent },    // v1.11.0
  ...EXPENSE_ROUTES,                                                    // v1.11.0
  ...ORG_STRUCTURE_ROUTES,                                              // v1.12.0
  ...SHIFT_PLANNER_ROUTES,                                              // v1.12.0
  ...ATTENDANCE_PLUS_ROUTES,                                            // v1.12.0
  ...ASSET_PLUS_ROUTES,                                                 // v1.12.0
  ...EMPLOYEE_PROFILE_ROUTES,                                           // v1.13.0
  ...SELF_SERVICE_ROUTES,                                               // v1.13.0
  { path: 'my-dashboard', component: EssDashboardComponent },
  {
    path: 'performance-options',
    component: ModuleOptionsComponent,
    data: { title: 'Performance Options', base: '/main-sidebar/performance-options', menu: PERFORMANCE_MENU },
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
    data: { title: 'Recruitment Options', base: '/main-sidebar/recruitment-options', menu: RECRUITMENT_MENU },
    children: [
      { path: '', redirectTo: 'job-openings', pathMatch: 'full' },
      page('requisitions', REQUISITION_PAGE),
      page('job-openings', JOB_PAGE),
      { path: 'pipeline', component: PipelineBoardComponent },
      page('candidates', CANDIDATE_PAGE),
      page('interviews', INTERVIEW_PAGE),
      page('offers', OFFER_PAGE),
      page('onboarding', ONBOARDING_PAGE),
      page('approval-levels', APPROVAL_LEVEL_PAGE),
    ],
  },
  {
    path: 'learning-options',
    component: ModuleOptionsComponent,
    data: { title: 'Learning Options', base: '/main-sidebar/learning-options', menu: LEARNING_MENU },
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
