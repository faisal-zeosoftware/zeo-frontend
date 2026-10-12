import { Routes } from '@angular/router';
import { HseShellComponent } from './hse-shell.component';
import { HseHomeComponent } from './hse-home.component';
import { HseIncidentsComponent } from './hse-incidents.component';
import { HsePermitsComponent } from './hse-permits.component';
import { HseRisksComponent } from './hse-risks.component';
import { HseInspectionsComponent, HseObservationsComponent, HseToolboxComponent } from './hse-ops.component';
import { HseActionsComponent } from './hse-actions.component';
import { HseRegisterComponent } from './hse-register.component';
import { HseSetupComponent } from './hse-setup.component';
import { HseLinksComponent } from './hse-links.component';
import { HseActivateComponent } from './hse-activate.component';

/** v1.16.0 HSE – add `...ZEO_HSE_ROUTES` to HR_MODULE_ROUTES (main-sidebar children): /main-sidebar/zeo-hse/<page>.
 *  The module menu comes from shared-ui/menu-config.ts (app "hse"). Blueprint modules without their own page use the
 *  generic register page: /main-sidebar/zeo-hse/r/<kind>[/<id>]. */
export const ZEO_HSE_ROUTES: Routes = [
  {
    path: 'zeo-hse',
    component: HseShellComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HseHomeComponent },
      { path: 'activate', component: HseActivateComponent },   // v1.17.0 activation with the app's own industry
      { path: 'report/:report', component: HseHomeComponent },
      { path: 'incidents', component: HseIncidentsComponent },
      { path: 'incidents/:id', component: HseIncidentsComponent },
      { path: 'board', component: HsePermitsComponent, data: { view: 'live' } },
      { path: 'permits', component: HsePermitsComponent },
      { path: 'permits/:id', component: HsePermitsComponent },
      { path: 'risks', component: HseRisksComponent },
      { path: 'risks/:id', component: HseRisksComponent },
      { path: 'inspections', component: HseInspectionsComponent },
      { path: 'inspections/:id', component: HseInspectionsComponent },
      { path: 'observations', component: HseObservationsComponent },
      { path: 'toolbox', component: HseToolboxComponent },
      { path: 'actions', component: HseActionsComponent },
      { path: 'r/:kind', component: HseRegisterComponent },
      { path: 'r/:kind/:id', component: HseRegisterComponent },
      { path: 'setup', component: HseSetupComponent },
      { path: 'setup/:tab', component: HseSetupComponent },
      { path: 'links/:page', component: HseLinksComponent },   // v1.17.0 muster, handovers, HSE costs
    ],
  },
];

/** v1.21.0: loaded on first use – /main-sidebar/zeo-hse/… */
export const ZEO_HSE_LAZY: Routes = [{ ...ZEO_HSE_ROUTES[0], path: '' }];
