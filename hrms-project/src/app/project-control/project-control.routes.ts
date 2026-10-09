import { Routes } from '@angular/router';
import { MyTimesheetComponent } from './my-timesheet.component';
import { TimesheetApprovalsComponent } from './timesheet-approvals.component';
import { ProjectFinanceComponent } from './project-finance.component';

/** Children of the existing 'project-options' route: `children: [ ...existing, ...PROJECT_CONTROL_CHILDREN ]`. */
export const PROJECT_CONTROL_CHILDREN: Routes = [
  { path: 'my-timesheet', component: MyTimesheetComponent },
  { path: 'timesheet-approvals', component: TimesheetApprovalsComponent },
  { path: 'project-costing', component: ProjectFinanceComponent },
];
