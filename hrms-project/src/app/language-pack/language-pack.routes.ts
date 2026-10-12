import { Routes } from '@angular/router';
import { LanguageSettingsComponent } from './language-settings.component';

/**
 * v1.15.0 – Settings → Languages. Add `...LANGUAGE_PACK_ROUTES` to HR_MODULE_ROUTES (main-sidebar children):
 *   /main-sidebar/languages                    languages of the company (activate, default)
 *   /main-sidebar/languages?tab=translations   translations (search, filter, edit, review, Excel export / import)
 */
export const LANGUAGE_PACK_ROUTES: Routes = [
  { path: 'languages', component: LanguageSettingsComponent, data: { title: 'Languages' } },
];
