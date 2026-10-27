import { Routes } from '@angular/router';
import { ZaActivateComponent, ZaHomeComponent, ZaSetupComponent, ZaShellComponent } from './za-pages.component';
import { ZaRegisterComponent } from './za-register.component';
import { ZaAssetLabelsComponent, ZaAssetScanComponent, ZaAuditCountComponent, ZaFloorPlanComponent } from './za-assets.component';
import { ZaAssetImportComponent, ZaFieldComponent, ZaMaintCalendarComponent } from './za-assets2.component';   // v1.34.0
import { ZmStatementComponent, ZmValuationComponent } from './zm-pages.component';   // v1.44.0
import { ZhExitComponent, ZhHubComponent, ZhMyCasesComponent, ZhAssignmentsComponent } from './zh-pages.component';   // v1.48.0
import { ZpChatComponent, ZpFormsComponent, ZpInsurerFileComponent, ZpReviewComponent, ZpSignComponent, ZpSurveyComponent, ZpSurveyResultsComponent, ZpWallComponent } from './zp-pages.component';   // v1.36.0

const pages: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: ZaHomeComponent },
  { path: 'activate', component: ZaActivateComponent },
  { path: 'setup', component: ZaSetupComponent },
  { path: 'setup/:tab', component: ZaSetupComponent },
  { path: 'r/:kind', component: ZaRegisterComponent },
  { path: 'r/:kind/:id', component: ZaRegisterComponent },
];

/** v1.44.0 Masters: the kit pages plus the statement of account of a partner and the stock valuation of the items. */
const masterPages: Routes = [
  { path: 'r/partner/:id/statement', component: ZmStatementComponent },   // under the partner: the page keeps the menu it was opened from
  ...pages,
  { path: 'valuation', component: ZmValuationComponent },
];
export const ZEO_MASTERS_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: masterPages }];

/** v1.33.0 Asset Management: the kit pages plus scan, labels, the count screen and floor plans. */
const assetPages: Routes = [
  ...pages,
  { path: 'scan', component: ZaAssetScanComponent },
  { path: 'labels', component: ZaAssetLabelsComponent },
  { path: 'audit/:id/count', component: ZaAuditCountComponent },
  { path: 'floor-plan/:id', component: ZaFloorPlanComponent },
  { path: 'calendar', component: ZaMaintCalendarComponent },   // v1.34.0 release 2
  { path: 'field', component: ZaFieldComponent },
  { path: 'import', component: ZaAssetImportComponent },
];

/** v1.36.0 People: the kit pages plus signing, surveys, forms, the recognition wall, chat and the 360° reviewer sheet. */
const peoplePages: Routes = [
  ...pages,
  { path: 'sign/:id', component: ZpSignComponent },
  { path: 'survey/:id', component: ZpSurveyComponent },
  { path: 'survey/:id/results', component: ZpSurveyResultsComponent },
  { path: 'forms', component: ZpFormsComponent },
  { path: 'wall', component: ZpWallComponent },
  { path: 'chat', component: ZpChatComponent },
  { path: 'review/:id', component: ZpReviewComponent },
  { path: 'insurer-file', component: ZpInsurerFileComponent },   // v1.61.0
];
export const ZEO_PEOPLE_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: peoplePages }];

/** v1.48.0 HR operations: the kit pages plus the document expiry hub, signing a handover, the exit interview and my notices. */
const hrPages: Routes = [
  ...pages,
  { path: 'hub', component: ZhHubComponent },
  { path: 'sign/:id', component: ZpSignComponent, data: { app: 'zeo-hr' } },
  { path: 'exit/:id', component: ZhExitComponent },
  { path: 'my-cases', component: ZhMyCasesComponent },
  { path: 'assignments', component: ZhAssignmentsComponent },   // v1.58.0
];
export const ZEO_HR_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: hrPages }];

/** v1.18.0 CRM, Property and Maintenance (each a separate app on the ZEO app kit) – add `...ZEO_APPS_ROUTES` to HR_MODULE_ROUTES
 *  (main-sidebar children). Remove the entry of an app that is not installed. Menus: shared-ui/menu-config.ts (crm, property, maintenance). */
export const ZEO_APPS_ROUTES: Routes = [
  { path: 'zeo-crm', component: ZaShellComponent, children: pages },
  { path: 'zeo-property', component: ZaShellComponent, children: pages },
  { path: 'zeo-maintenance', component: ZaShellComponent, children: pages },
  { path: 'zeo-assets', component: ZaShellComponent, children: assetPages },
  { path: 'zeo-people', component: ZaShellComponent, children: peoplePages },
  { path: 'zeo-masters', component: ZaShellComponent, children: masterPages },   // v1.41.0 (v1.44.0 statement, valuation)
];

/** v1.21.0: each app loaded on first use (main-sidebar children: zeo-crm / zeo-property / zeo-maintenance). */
export const ZEO_APP_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: pages }];

/** v1.33.0: Asset Management loaded on first use (main-sidebar child zeo-assets). */
export const ZEO_ASSETS_LAZY: Routes = [{ path: '', component: ZaShellComponent, children: assetPages }];
