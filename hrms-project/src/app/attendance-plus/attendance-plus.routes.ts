import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { CrudPageComponent } from '../hr-modules/crud-page/crud-page.component';
import { MyAttendanceComponent } from './my-attendance.component';
import { AttendanceBoardComponent } from './daily-board.component';
import { PunchImportComponent } from './punch-import.component';
import { AttendanceKioskComponent } from './kiosk.component';
import { CORRECTION_PAGE, DAY_PAGE, DEVICE_PAGE, IP_PAGE, KIOSK_PAGE, MISSING_PAGE, PUNCH_PAGE, RULE_PAGE } from './attendance-plus.config';

/** Attendance Plus (v1.12.0) sub-menu: ESS pages first, then HR screens. */
export const ATTENDANCE_PLUS_MENU: ModuleMenuItem[] = [
  { path: 'my-attendance', label: 'My attendance', icon: 'fingerprint', selfService: true },
  { path: 'corrections', label: 'Corrections', icon: 'edit_calendar', selfService: true },
  { path: 'board', label: 'Daily board', icon: 'dashboard', model: 'attendance' },
  { path: 'days', label: 'Daily attendance', icon: 'fact_check', model: 'attendance' },
  { path: 'missing', label: 'Missing punches', icon: 'running_with_errors', model: 'attendance' },
  { path: 'punches', label: 'Punches', icon: 'touch_app', model: 'attendance' },
  { path: 'import', label: 'Import punches', icon: 'upload_file', model: 'attendance' },
  { path: 'rules', label: 'Attendance rules', icon: 'rule', model: 'attendance' },
  { path: 'devices', label: 'Devices', icon: 'router', model: 'attendance' },
  { path: 'kiosks', label: 'Kiosks', icon: 'tablet_mac', model: 'attendance' },
  { path: 'networks', label: 'Office networks (IP)', icon: 'lan', model: 'attendance' },
];

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/** Add `...ATTENDANCE_PLUS_ROUTES` to HR_MODULE_ROUTES (main-sidebar children). */
export const ATTENDANCE_PLUS_ROUTES: Routes = [
  {
    path: 'attendance-plus',
    component: ModuleOptionsComponent,
    data: { title: 'Attendance', base: '/main-sidebar/attendance-plus', menu: ATTENDANCE_PLUS_MENU },
    children: [
      { path: '', redirectTo: 'my-attendance', pathMatch: 'full' },
      { path: 'my-attendance', component: MyAttendanceComponent },
      page('corrections', CORRECTION_PAGE),
      { path: 'board', component: AttendanceBoardComponent },
      page('days', DAY_PAGE),
      page('missing', MISSING_PAGE),
      page('punches', PUNCH_PAGE),
      { path: 'import', component: PunchImportComponent },
      page('rules', RULE_PAGE),
      page('devices', DEVICE_PAGE),
      page('kiosks', KIOSK_PAGE),
      page('networks', IP_PAGE),
    ],
  },
];

/** Top-level route (app-routing.module.ts, NO AuthGuard – the kiosk token in the link identifies the device). */
export const ATTENDANCE_KIOSK_ROUTE = { path: 'attendance-kiosk/:token', component: AttendanceKioskComponent };
