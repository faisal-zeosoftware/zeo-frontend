import { Routes } from '@angular/router';
import { ZpShellComponent } from './zp-shell.component';
import { ZpDashboardComponent } from './zp-dashboard.component';
import { ZpTicketsComponent } from './zp-tickets.component';
import { ZpTicketComponent } from './zp-ticket.component';
import { ZpCustomerComponent, ZpCustomersComponent } from './zp-customers.component';
import { ZpContractComponent, ZpContractsComponent } from './zp-contracts.component';
import { ZpBillingComponent, ZpDevRequestsComponent, ZpHelpdeskComponent, ZpMyWorkComponent, ZpWorklogsComponent } from './zp-work.component';
import { ZpProjectComponent, ZpProjectsComponent } from './zp-projects.component';
import { ZpSetupComponent } from './zp-setup.component';
import { ZpReportsComponent } from './zp-reports.component';
import { ZpPlansPageComponent } from './zp-plans.component';
import {
  PortalAccountComponent, PortalApprovalsComponent, PortalContractsComponent, PortalInvoicesComponent, PortalLoginComponent,
  PortalProjectsComponent, PortalShellComponent, PortalTicketComponent, PortalTicketsComponent,
} from './portal/portal.component';

/** v1.14.0 Projects – add `...ZEO_PROJECTS_ROUTES` to HR_MODULE_ROUTES (main-sidebar children): /main-sidebar/zeo-projects/<page>.
 *  The module menu comes from shared-ui/menu-config.ts (app "projects"). */
export const ZEO_PROJECTS_ROUTES: Routes = [
  {
    path: 'zeo-projects',
    component: ZpShellComponent,
    children: [
      { path: '', redirectTo: 'my-work', pathMatch: 'full' },
      { path: 'my-work', component: ZpMyWorkComponent },
      { path: 'helpdesk', component: ZpHelpdeskComponent },
      { path: 'dashboard', component: ZpDashboardComponent },
      { path: 'tickets', component: ZpTicketsComponent },
      { path: 'tickets/:id', component: ZpTicketComponent },
      { path: 'dev-requests', component: ZpDevRequestsComponent },
      { path: 'dev-requests/:id', component: ZpDevRequestsComponent },
      { path: 'worklogs', component: ZpWorklogsComponent },
      { path: 'customers', component: ZpCustomersComponent },
      { path: 'customers/:id', component: ZpCustomerComponent },
      { path: 'contracts', component: ZpContractsComponent },
      { path: 'contracts/:id', component: ZpContractComponent },
      { path: 'renewals', component: ZpContractsComponent, data: { view: 'renewals' } },
      { path: 'billing', component: ZpBillingComponent },
      { path: 'projects', component: ZpProjectsComponent },
      { path: 'projects/:id', component: ZpProjectComponent },
      { path: 'reports', component: ZpReportsComponent },
      { path: 'reports/:key', component: ZpReportsComponent },
      { path: 'setup', component: ZpSetupComponent },
      { path: 'plan-templates', component: ZpPlansPageComponent },   // v1.15.0
      { path: 'notifications', component: ZpSetupComponent, data: { tab: 'notifications' } },
    ],
  },
];

/** v1.14.0 customer portal – add `...PORTAL_ROUTES` to the top-level routes in app-routing.module.ts (own login, no staff menu). */
export const PORTAL_ROUTES: Routes = [
  { path: 'portal/login', component: PortalLoginComponent },
  {
    path: 'portal',
    component: PortalShellComponent,
    children: [
      { path: '', redirectTo: 'tickets', pathMatch: 'full' },
      { path: 'tickets', component: PortalTicketsComponent },
      { path: 'tickets/:id', component: PortalTicketComponent },
      { path: 'contracts', component: PortalContractsComponent },
      { path: 'projects', component: PortalProjectsComponent },
      { path: 'approvals', component: PortalApprovalsComponent },
      { path: 'invoices', component: PortalInvoicesComponent },
      { path: 'account', component: PortalAccountComponent },
    ],
  },
];

/** v1.20.0: loaded on first use (keeps the start-up bundle small) – /main-sidebar/zeo-projects/… and /portal/… */
export const ZEO_PROJECTS_LAZY: Routes = [{ ...ZEO_PROJECTS_ROUTES[0], path: '' }];
export const PORTAL_LAZY: Routes = [
  { ...PORTAL_ROUTES[0], path: 'login' },
  { ...PORTAL_ROUTES[1], path: '' },
];
