import { Routes } from '@angular/router';
import { MCompaniesComponent, MConnectComponent, MLoginComponent, MStartComponent } from './m-auth.component';
import { MApprovalsComponent, MAttendanceComponent, MHomeComponent, MLeaveComponent, MMoreComponent, MPayslipsComponent, MRequestsComponent,
  MShellComponent } from './m-app.component';

/** v1.25.0 – the mobile app screens (/m/…). The Android / iPhone app opens /m; the same screens work in a phone browser. */
export const MOBILE_ROUTES: Routes = [
  { path: '', component: MStartComponent, data: { title: 'ZEO' } },
  { path: 'connect', component: MConnectComponent, data: { title: 'Server' } },
  { path: 'login', component: MLoginComponent, data: { title: 'Sign in' } },
  { path: 'companies', component: MCompaniesComponent, data: { title: 'Companies' } },
  {
    path: '', component: MShellComponent, children: [
      { path: 'home', component: MHomeComponent, data: { title: 'Home' } },
      { path: 'attendance', component: MAttendanceComponent, data: { title: 'Attendance' } },
      { path: 'leave', component: MLeaveComponent, data: { title: 'Leave' } },
      { path: 'payslips', component: MPayslipsComponent, data: { title: 'Payslips' } },
      { path: 'approvals', component: MApprovalsComponent, data: { title: 'Approvals' } },
      { path: 'requests', component: MRequestsComponent, data: { title: 'My requests' } },
      { path: 'more', component: MMoreComponent, data: { title: 'More' } },
    ],
  },
];
