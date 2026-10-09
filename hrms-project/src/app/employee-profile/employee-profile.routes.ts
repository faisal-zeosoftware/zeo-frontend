import { Routes } from '@angular/router';
import { ModuleMenuItem, ModuleOptionsComponent } from '../hr-modules/module-options/module-options.component';
import { EmpCodeSettingsComponent, IdentityImportComponent, ProbationDueComponent } from './employee-profile-pages.component';

/** v1.13.0 – Employee master tools (the employee tabs themselves live on the employee details page). */
export const EMPLOYEE_PROFILE_MENU: ModuleMenuItem[] = [
  { path: 'probation', label: 'Probation ending', icon: 'event_available', model: 'emp_master' },
  { path: 'identity-import', label: 'Import identity details', icon: 'upload_file', model: 'emp_master' },
  { path: 'code-numbering', label: 'Employee code numbering', icon: 'pin', model: 'emp_master' },
];

/** Add `...EMPLOYEE_PROFILE_ROUTES` to HR_MODULE_ROUTES (main-sidebar children): /main-sidebar/employee-master-tools/<page> */
export const EMPLOYEE_PROFILE_ROUTES: Routes = [
  {
    path: 'employee-master-tools',
    component: ModuleOptionsComponent,
    data: { title: 'Employee master', base: '/main-sidebar/employee-master-tools', menu: EMPLOYEE_PROFILE_MENU },
    children: [
      { path: '', redirectTo: 'probation', pathMatch: 'full' },
      { path: 'probation', component: ProbationDueComponent },
      { path: 'identity-import', component: IdentityImportComponent },
      { path: 'code-numbering', component: EmpCodeSettingsComponent },
    ],
  },
];
