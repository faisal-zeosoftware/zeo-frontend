import { Routes } from '@angular/router';
import { ZaActivateComponent, ZaHomeComponent, ZaSetupComponent, ZaShellComponent } from './za-pages.component';
import { ZaRegisterComponent } from './za-register.component';

const pages: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: ZaHomeComponent },
  { path: 'activate', component: ZaActivateComponent },
  { path: 'setup', component: ZaSetupComponent },
  { path: 'setup/:tab', component: ZaSetupComponent },
  { path: 'r/:kind', component: ZaRegisterComponent },
  { path: 'r/:kind/:id', component: ZaRegisterComponent },
];

/** v1.18.0 CRM, Property and Maintenance (each a separate app on the ZEO app kit) – add `...ZEO_APPS_ROUTES` to HR_MODULE_ROUTES
 *  (main-sidebar children). Remove the entry of an app that is not installed. Menus: shared-ui/menu-config.ts (crm, property, maintenance). */
export const ZEO_APPS_ROUTES: Routes = [
  { path: 'zeo-crm', component: ZaShellComponent, children: pages },
  { path: 'zeo-property', component: ZaShellComponent, children: pages },
  { path: 'zeo-maintenance', component: ZaShellComponent, children: pages },
];

/** v1.21.0: each app loaded on first use (main-sidebar children: zeo-crm / zeo-property / zeo-maintenance). */
export const ZEO_APP_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: pages }];
