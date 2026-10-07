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
  { path: 'needs', label: 'Training Needs', icon: 'psychology', model: 'trainingneed' },
  { path: 'courses', label: 'Course Catalog', icon: 'menu_book', model: 'course' },
  { path: 'calendar', label: 'Training Calendar', icon: 'calendar_month', model: 'trainingsession' },
  { path: 'nominations', label: 'Nominations', icon: 'group_add', model: 'nomination' },
  { path: 'results', label: 'Attendance & Assessment', icon: 'checklist', model: 'participantresult' },
  { path: 'certificates', label: 'Certificates', icon: 'workspace_premium', selfService: true },
  { path: 'bonds', label: 'Training Bond', icon: 'handshake', selfService: true },
  { path: 'reports', label: 'Learning Reports', icon: 'insights', model: 'trainingsession' },
];

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/** Added to the 'main-sidebar' children in app-routing.module.ts */
export const HR_MODULE_ROUTES: Routes = [
  { path: 'manager-dashboard', component: ManagerDashboardComponent },
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
      { path: '', redirectTo: 'needs', pathMatch: 'full' },
      page('needs', NEEDS_PAGE),
      page('courses', COURSE_PAGE),
      page('calendar', SESSION_PAGE),
      page('nominations', NOMINATION_PAGE),
      page('results', RESULT_PAGE),
      page('certificates', CERTIFICATE_PAGE),
      page('bonds', BOND_PAGE),
      page('reports', LEARNING_REPORT_PAGE),
    ],
  },
];
