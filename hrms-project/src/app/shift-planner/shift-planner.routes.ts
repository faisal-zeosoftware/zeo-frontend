/** v1.12.0 Shift planner routes – add `...SHIFT_PLANNER_ROUTES` to HR_MODULE_ROUTES (main-sidebar children), see INTEGRATION.md. */
import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { SpMyScheduleComponent } from './my-schedule.component';
import { SpRosterComponent } from './roster.component';
import { SpShiftMasterComponent } from './shift-master.component';
import { SpRequestsComponent } from './requests.component';
import { SpAvailabilityComponent } from './availability.component';
import { SpReportsComponent } from './shift-reports.component';

export const SHIFT_PLANNER_MENU: ModuleMenuItem[] = [
  { path: 'my-schedule', label: 'My schedule', icon: 'event_available', selfService: true },
  { path: 'requests', label: 'Requests & open shifts', icon: 'swap_horiz', selfService: true },
  { path: 'rosters', label: 'Rosters', icon: 'calendar_view_week', model: 'rosterperiod' },
  { path: 'shifts', label: 'Shift master', icon: 'schedule', model: 'shift' },
  { path: 'availability', label: 'Availability', icon: 'event_busy', model: 'availability' },
  { path: 'reports', label: 'Shift reports', icon: 'summarize', model: 'rosterperiod' },
];

export const SHIFT_PLANNER_ROUTES: Routes = [
  {
    path: 'shift-planner',
    component: ModuleOptionsComponent,
    data: { title: 'Shift Planner', base: '/main-sidebar/shift-planner', menu: SHIFT_PLANNER_MENU },
    children: [
      { path: '', redirectTo: 'my-schedule', pathMatch: 'full' },
      { path: 'my-schedule', component: SpMyScheduleComponent },
      { path: 'requests', component: SpRequestsComponent },
      { path: 'rosters', component: SpRosterComponent },
      { path: 'shifts', component: SpShiftMasterComponent },
      { path: 'availability', component: SpAvailabilityComponent },
      { path: 'reports', component: SpReportsComponent },
    ],
  },
];
