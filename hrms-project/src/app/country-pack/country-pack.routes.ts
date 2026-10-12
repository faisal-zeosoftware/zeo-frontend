import { Routes } from '@angular/router';
import { CountrySettingsComponent } from './country-settings.component';

/**
 * v1.14.0 – Settings → Country settings. Add `...COUNTRY_PACK_ROUTES` to HR_MODULE_ROUTES (main-sidebar children):
 *   /main-sidebar/country-settings
 */
export const COUNTRY_PACK_ROUTES: Routes = [
  { path: 'country-settings', component: CountrySettingsComponent, data: { title: 'Country settings' } },
];
