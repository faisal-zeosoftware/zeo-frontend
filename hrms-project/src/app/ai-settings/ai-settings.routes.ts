import { Routes } from '@angular/router';
import { AiSettingsComponent } from './ai-settings.component';

/**
 * v1.16.0 – Settings → AI settings (company administrator). Add `...AI_SETTINGS_ROUTES` to the children of the `settings`
 * route in app-routing.module.ts (next to ...SETTINGS_HOME_ROUTES):  /main-sidebar/settings/ai-settings
 */
export const AI_SETTINGS_ROUTES: Routes = [
  { path: 'ai-settings', component: AiSettingsComponent, data: { title: 'AI settings' } },
];
