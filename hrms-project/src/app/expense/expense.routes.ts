import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { CrudPageComponent } from '../hr-modules/crud-page/crud-page.component';
import { ExpenseHomeComponent } from './expense-home.component';
import { ExpenseListComponent } from './expense-list.component';
import { ExpenseReportsComponent } from './expense-reports.component';
import { ExpenseAnalyticsComponent } from './expense-analytics.component';
import { ADVANCE_PAGE, COST_CENTER_PAGE, EXPENSE_CATEGORY_PAGE, EXPENSE_POLICY_PAGE, TRIP_PAGE } from './expense.config';

export const EXPENSE_MENU: ModuleMenuItem[] = [
  { path: 'home', label: 'Home', icon: 'home', selfService: true },
  { path: 'expenses', label: 'Expenses', icon: 'receipt_long', selfService: true },
  { path: 'reports', label: 'Reports', icon: 'request_quote', selfService: true },
  { path: 'trips', label: 'Trips', icon: 'flight_takeoff', selfService: true },
  { path: 'advances', label: 'Advances', icon: 'payments', selfService: true },
  { path: 'analytics', label: 'Analytics & Export', icon: 'insights', model: 'expensereport' },
  { path: 'categories', label: 'Categories', icon: 'category', model: 'expensecategory' },
  { path: 'policies', label: 'Policies', icon: 'policy', model: 'expensepolicy' },
  { path: 'cost-centers', label: 'Cost Centres', icon: 'account_tree', model: 'costcenter' },
];

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/** Add `...EXPENSE_ROUTES` to HR_MODULE_ROUTES (main-sidebar children). */
export const EXPENSE_ROUTES: Routes = [
  {
    path: 'expense-options',
    component: ModuleOptionsComponent,
    data: { title: 'Expense Options', base: '/main-sidebar/expense-options', menu: EXPENSE_MENU },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ExpenseHomeComponent },
      { path: 'expenses', component: ExpenseListComponent },
      { path: 'reports', component: ExpenseReportsComponent },
      page('trips', TRIP_PAGE),
      page('advances', ADVANCE_PAGE),
      { path: 'analytics', component: ExpenseAnalyticsComponent },
      page('categories', EXPENSE_CATEGORY_PAGE),
      page('policies', EXPENSE_POLICY_PAGE),
      page('cost-centers', COST_CENTER_PAGE),
    ],
  },
];
