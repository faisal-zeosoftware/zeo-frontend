/** v1.12.0 Shift planner routes – add `...SHIFT_PLANNER_ROUTES` to HR_MODULE_ROUTES (main-sidebar children), see INTEGRATION.md. */
import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { SpMyScheduleComponent } from './my-schedule.component';
import { SpRosterComponent } from './roster.component';
import { SpShiftMasterComponent } from './shift-master.component';
import { SpRequestsComponent } from './requests.component';
import { SpAvailabilityComponent } from './availability.component';
import { SpReportsComponent } from './shift-reports.component';
import { SpOnCallComponent } from './on-call.component';
// v1.62.1 (tester 30-10 item 199): the shift screens that sat in the Attendance menu are pages of the Shift planner now
import { T62ShiftPatternsComponent } from '../time62/shift-patterns.component';   // v1.62.10 (item 171)
import { T62EmployeeShiftsComponent } from '../time62/employee-shifts.component';   // v1.62.10 (item 171)
import { T62MonthRosterComponent } from '../time62/month-roster.component';   // v1.67.0 (item 21)
import { ShiftEmployeeComponent } from '../shift-employee/shift-employee.component';
import { CrudPageComponent } from '../hr-modules/crud-page/crud-page.component';
import { SHIFT_OVERRIDE_PAGE } from '../people62/people62.config';

export const SHIFT_PLANNER_MENU: ModuleMenuItem[] = [
  { path: 'my-schedule', label: 'My schedule', icon: 'event_available', selfService: true },
  { path: 'requests', label: 'Requests & open shifts', icon: 'swap_horiz', selfService: true },
  { path: 'rosters', label: 'Rosters', icon: 'calendar_view_week', model: 'rosterperiod' },
  { path: 'roster-grid', label: 'Roster grid', icon: 'grid_on', model: 'rosterperiod' },   // v1.67.0 (item 21)
  { path: 'shifts', label: 'Shift master', icon: 'schedule', model: 'shift' },
  { path: 'patterns', label: 'Shift patterns', icon: 'date_range', model: 'shiftpattern' },              // v1.62.1 (item 199)
  { path: 'employee-shifts', label: 'Employee shifts', icon: 'badge', model: 'employeeshiftschedule' },   // v1.62.1
  { path: 'override', label: 'Shift override', icon: 'edit_calendar', model: 'shiftoverride' },           // v1.62.1
  { path: 'availability', label: 'Availability', icon: 'event_busy', model: 'availability' },
  { path: 'on-call', label: 'On-call duty', icon: 'phone_in_talk', model: 'oncallduty', selfService: true },
  { path: 'reports', label: 'Shift reports', icon: 'summarize', model: 'rosterperiod' },
];

export const SHIFT_PLANNER_ROUTES: Routes = [
  {
    path: 'shift-planner',
    component: ModuleOptionsComponent,
    data: { title: 'Shift planner', base: '/main-sidebar/shift-planner', menu: SHIFT_PLANNER_MENU },
    children: [
      { path: '', redirectTo: 'my-schedule', pathMatch: 'full' },
      { path: 'my-schedule', component: SpMyScheduleComponent },
      { path: 'requests', component: SpRequestsComponent },
      { path: 'rosters', component: SpRosterComponent },
      { path: 'roster-grid', component: T62MonthRosterComponent },   // v1.67.0 (item 21) month roster grid
      { path: 'shifts', component: SpShiftMasterComponent },
      { path: 'patterns', component: T62ShiftPatternsComponent },      // v1.62.10 (item 171) new design (v1.62.1 item 199: ShiftPatternComponent, was shift-options/shift-pattern)
      { path: 'employee-shifts', component: T62EmployeeShiftsComponent },  // v1.62.10 (item 171) new design (v1.62.1: ShiftEmployeeComponent, was shift-options/shift-employee)
      { path: 'override', component: CrudPageComponent, data: { config: SHIFT_OVERRIDE_PAGE } },   // v1.62.1 – was shift-options/shift-override
      { path: 'availability', component: SpAvailabilityComponent },
      { path: 'on-call', component: SpOnCallComponent },
      { path: 'reports', component: SpReportsComponent },
    ],
  },
];
