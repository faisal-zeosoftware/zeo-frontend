import { Routes } from '@angular/router';
import { SettingsHomeComponent } from './settings-home.component';

/**
 * v1.15.1 – Settings home. Add `...SETTINGS_HOME_ROUTES` as the FIRST entries of the `settings` route's children
 * (app-routing.module.ts, main-sidebar → settings): /main-sidebar/settings and /main-sidebar/settings/home.
 */
export const SETTINGS_HOME_ROUTES: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: SettingsHomeComponent, data: { title: 'Settings' } },
];
