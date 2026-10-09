import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subscription, combineLatest } from 'rxjs';
import { ModuleMenuItem, ModuleOptionsComponent } from '../hr-modules/module-options/module-options.component';
import { CrudPageComponent } from '../hr-modules/crud-page/crud-page.component';
import { HrPermissionService } from '../hr-modules/hr-permission.service';
import { ActivatedRoute } from '@angular/router';
import { OrgKey, OrgSettingsService } from './org-settings.service';
import { OrgSettingsComponent } from './org-settings.component';
import { OrgAssignComponent } from './org-assign.component';
import { OrgHierarchyComponent } from './org-hierarchy.component';
import { PolicyAckComponent } from './policy-ack.component';
import { MyPoliciesComponent } from './my-policies.component';
import { CountryPoliciesComponent } from './country-policies.component';
import { COST_CENTER_ORG_PAGE, DIVISION_PAGE, EMPLOYMENT_TYPE_PAGE, GRADE_PAGE, LOCATION_PAGE, POSITION_PAGE, SECTION_PAGE } from './org-structure.config';

/** menu item that only shows while its organisation setting is on */
export interface OrgMenuItem extends ModuleMenuItem { org?: OrgKey; }

export const ORG_STRUCTURE_MENU: OrgMenuItem[] = [
  { path: 'settings', label: 'Settings', icon: 'tune', model: 'dept_master' },
  { path: 'employees', label: 'Employee organisation', icon: 'account_tree', model: 'emp_master' },
  { path: 'locations', label: 'Locations', icon: 'place', model: 'dept_master', org: 'locations' },
  { path: 'divisions', label: 'Divisions', icon: 'domain', model: 'dept_master', org: 'divisions' },
  { path: 'sections', label: 'Sections', icon: 'view_module', model: 'dept_master', org: 'sections' },
  { path: 'cost-centers', label: 'Cost centres', icon: 'savings', model: 'dept_master', org: 'cost_centers' },
  { path: 'grades', label: 'Grades', icon: 'military_tech', model: 'dept_master', org: 'grades' },
  { path: 'positions', label: 'Job positions', icon: 'work', model: 'dept_master', org: 'job_positions' },
  { path: 'employment-types', label: 'Employment types', icon: 'badge', model: 'dept_master', org: 'employment_types' },
  { path: 'hierarchy', label: 'Reporting hierarchy', icon: 'lan', model: 'emp_master' },
  { path: 'policy-acknowledgements', label: 'Policy acknowledgements', icon: 'task', model: 'companypolicy' },
  { path: 'country-policies', label: 'Country policies', icon: 'public', model: 'leavepolicy' },
  { path: 'my-policies', label: 'My policies', icon: 'policy', selfService: true },
];

/** Same sub-sidebar as the other modules; items of switched-off org fields are hidden and named by their label. */
@Component({
  selector: 'app-org-structure-options',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSidenavModule],
  templateUrl: '../hr-modules/module-options/module-options.component.html',
  styleUrl: '../hr-modules/module-options/module-options.component.css',
})
export class OrgStructureOptionsComponent extends ModuleOptionsComponent implements OnInit, OnDestroy {
  private sub?: Subscription;

  constructor(route: ActivatedRoute, private permsSvc: HrPermissionService, private org: OrgSettingsService) { super(route, permsSvc); }

  override ngOnInit(): void {
    super.ngOnInit();
    const all = this.items as OrgMenuItem[];
    this.sub = this.org.settings$.subscribe(s => {
      for (const i of all) {
        if (!i.org) { continue; }
        const on = this.org.isOn(i.org, s);
        this.permsSvc.canView(i.model, i.selfService).subscribe(v => (this.visible[i.path] = v && on));
        const base = ORG_STRUCTURE_MENU.find(m => m.path === i.path)!.label;
        const lab = this.org.label(i.org, s);
        i.label = lab && !base.toLowerCase().startsWith(lab.toLowerCase()) ? lab + (/(s|re)$/.test(lab) ? '' : 's') : base;
      }
    });
    this.org.load().subscribe();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}

const page = (path: string, config: any) => ({ path, component: CrudPageComponent, data: { config } });

/**
 * Add `...ORG_STRUCTURE_ROUTES` to HR_MODULE_ROUTES (main-sidebar children):
 *   /main-sidebar/org-structure/<page>   and   /main-sidebar/my-policies (ESS, no sub-menu)
 */
export const ORG_STRUCTURE_ROUTES: Routes = [
  {
    path: 'org-structure',
    component: OrgStructureOptionsComponent,
    data: { title: 'Organisation', base: '/main-sidebar/org-structure', menu: ORG_STRUCTURE_MENU.map(m => ({ ...m })) },
    children: [
      { path: '', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'settings', component: OrgSettingsComponent },
      { path: 'employees', component: OrgAssignComponent },
      page('locations', LOCATION_PAGE),
      page('divisions', DIVISION_PAGE),
      page('sections', SECTION_PAGE),
      page('cost-centers', COST_CENTER_ORG_PAGE),
      page('grades', GRADE_PAGE),
      page('positions', POSITION_PAGE),
      page('employment-types', EMPLOYMENT_TYPE_PAGE),
      { path: 'hierarchy', component: OrgHierarchyComponent },
      { path: 'policy-acknowledgements', component: PolicyAckComponent },
      { path: 'country-policies', component: CountryPoliciesComponent },
      { path: 'my-policies', component: MyPoliciesComponent },
    ],
  },
  { path: 'my-policies', component: MyPoliciesComponent, data: { ownPage: true } },   // no sub-menu around it: the page keeps clear of the top bar
];
