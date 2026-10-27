import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { EssHomeComponent } from './ess-home.component';
import { EssProfileComponent } from './ess-profile.component';
import { EssRequestsComponent } from './ess-requests.component';
import { EssLettersComponent } from './ess-letters.component';
import { EssComplaintsComponent } from './ess-complaints.component';
import { EssAnnouncementsComponent } from './ess-announcements.component';
import { EssPayslipsComponent } from './ess-payslips.component';
import { EssDocumentsComponent } from './ess-documents.component';
import { EssLeaveComponent } from './ess-leave.component';
import { EssClaimsComponent } from './ess-claims.component';
import { MyAirTicketComponent } from '../air-ticket-ui/my-air-ticket.component';   // v1.62.0 air ticket
import { EssSettingsComponent } from './ess-settings.component';
import { EssHrHelpComponent } from './ess-hr-help.component';   // v1.51.0

/** v1.13.0 – sub-menu of the Self service app. Employee pages need no rights; HR pages need view_emp_master (server checks the real rights). */
export const SELF_SERVICE_MENU: ModuleMenuItem[] = [
  { path: 'home', label: 'Home', icon: 'home', selfService: true },
  { path: 'profile', label: 'My profile', icon: 'badge', selfService: true },
  { path: 'my-requests', label: 'My change requests', icon: 'pending_actions', selfService: true },
  { path: 'leave', label: 'My leave', icon: 'event_busy', selfService: true },
  { path: 'payslips', label: 'My payslips', icon: 'receipt', selfService: true },
  { path: '/main-sidebar/my-loans', label: 'My loans', icon: 'credit_score', selfService: true },   // v1.49.0
  { path: 'air-ticket', label: 'My air ticket', icon: 'flight', selfService: true },   // v1.62.0 air ticket
  { path: 'documents', label: 'My documents', icon: 'folder_shared', selfService: true },
  { path: 'claims', label: 'Claims and requests', icon: 'request_quote', selfService: true },
  { path: 'letters', label: 'My letters', icon: 'description', selfService: true },
  { path: 'hr-help', label: 'Ask HR', icon: 'contact_support', selfService: true },   // v1.51.0 HR helpdesk
  { path: 'complaints', label: 'Complaints', icon: 'report', selfService: true },
  { path: 'announcements', label: 'Announcements', icon: 'campaign', selfService: true },
  { path: '/main-sidebar/my-one-on-ones', label: 'My 1:1s', icon: 'forum', selfService: true },
  { path: '/main-sidebar/zeo-hr/my-cases', label: 'Notices and decisions', icon: 'gavel', selfService: true },   // v1.48.0 show-cause notices, decisions, appeals   // v1.47.0 the 1:1s my manager shared
  // v1.38.1: the People pages an employee uses (the People app is part of HRMS; shown while the app is on)
  { path: '/main-sidebar/zeo-people/home', label: 'My benefits and surveys', icon: 'diversity_3', selfService: true, app: 'people' },
  { path: '/main-sidebar/zeo-people/wall', label: 'Recognition wall', icon: 'emoji_events', selfService: true, app: 'people' },
  { path: '/main-sidebar/zeo-people/forms', label: 'Forms', icon: 'dynamic_form', selfService: true, app: 'people' },
  { path: '/main-sidebar/zeo-people/chat', label: 'Chat', icon: 'chat', selfService: true, app: 'people' },
  { path: 'hr-requests', label: 'Profile changes (HR)', icon: 'fact_check', model: 'emp_master' },
  { path: 'hr-letters', label: 'Letters to issue (HR)', icon: 'history_edu', model: 'emp_master' },
  { path: 'hr-complaints', label: 'Complaints to handle', icon: 'gavel', model: 'grievance' },
  { path: 'settings', label: 'Self-service settings', icon: 'tune', model: 'emp_master' },
];

/** Add `...SELF_SERVICE_ROUTES` to the main-sidebar children (HR_MODULE_ROUTES). */
export const SELF_SERVICE_ROUTES: Routes = [
  {
    path: 'self-service',
    component: ModuleOptionsComponent,
    data: { title: 'Self service', base: '/main-sidebar/self-service', menu: SELF_SERVICE_MENU },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: EssHomeComponent },
      { path: 'profile', component: EssProfileComponent },
      { path: 'my-requests', component: EssRequestsComponent, data: { hr: false } },
      { path: 'leave', component: EssLeaveComponent },
      { path: 'payslips', component: EssPayslipsComponent },
      { path: 'documents', component: EssDocumentsComponent },
      { path: 'claims', component: EssClaimsComponent },
      { path: 'air-ticket', component: MyAirTicketComponent },   // v1.62.0 air ticket
      { path: 'letters', component: EssLettersComponent, data: { hr: false } },
      { path: 'complaints', component: EssComplaintsComponent, data: { handler: false } },
      { path: 'hr-help', component: EssHrHelpComponent },   // v1.51.0
      { path: 'announcements', component: EssAnnouncementsComponent },
      { path: 'hr-requests', component: EssRequestsComponent, data: { hr: true } },
      { path: 'hr-letters', component: EssLettersComponent, data: { hr: true } },
      { path: 'hr-complaints', component: EssComplaintsComponent, data: { handler: true } },
      { path: 'settings', component: EssSettingsComponent },
    ],
  },
];
