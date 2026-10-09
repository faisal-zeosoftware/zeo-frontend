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
import { EssSettingsComponent } from './ess-settings.component';

/** v1.13.0 – sub-menu of the Self service app. Employee pages need no rights; HR pages need view_emp_master (server checks the real rights). */
export const SELF_SERVICE_MENU: ModuleMenuItem[] = [
  { path: 'home', label: 'Home', icon: 'home', selfService: true },
  { path: 'profile', label: 'My profile', icon: 'badge', selfService: true },
  { path: 'my-requests', label: 'My change requests', icon: 'pending_actions', selfService: true },
  { path: 'leave', label: 'My leave', icon: 'event_busy', selfService: true },
  { path: 'payslips', label: 'My payslips', icon: 'receipt', selfService: true },
  { path: 'documents', label: 'My documents', icon: 'folder_shared', selfService: true },
  { path: 'claims', label: 'Claims and requests', icon: 'request_quote', selfService: true },
  { path: 'letters', label: 'My letters', icon: 'description', selfService: true },
  { path: 'complaints', label: 'Complaints', icon: 'report', selfService: true },
  { path: 'announcements', label: 'Announcements', icon: 'campaign', selfService: true },
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
      { path: 'letters', component: EssLettersComponent, data: { hr: false } },
      { path: 'complaints', component: EssComplaintsComponent, data: { handler: false } },
      { path: 'announcements', component: EssAnnouncementsComponent },
      { path: 'hr-requests', component: EssRequestsComponent, data: { hr: true } },
      { path: 'hr-letters', component: EssLettersComponent, data: { hr: true } },
      { path: 'hr-complaints', component: EssComplaintsComponent, data: { handler: true } },
      { path: 'settings', component: EssSettingsComponent },
    ],
  },
];
