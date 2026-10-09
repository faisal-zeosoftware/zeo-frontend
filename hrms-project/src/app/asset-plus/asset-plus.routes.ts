import { Routes } from '@angular/router';
import { ModuleOptionsComponent, ModuleMenuItem } from '../hr-modules/module-options/module-options.component';
import { AssetHomeComponent } from './asset-home.component';
import { AssetRegisterComponent } from './asset-register.component';
import { AssetDetailComponent } from './asset-detail.component';
import { AssetQueueComponent } from './asset-queue.component';
import { AssetClearanceComponent } from './asset-clearance.component';
import { MyAssetsComponent } from './my-assets.component';
import { AssetSetupComponent } from './asset-setup.component';

/** Sub-menu of the Assets app (v1.12.0). `model` = view_<model> right; selfService = every employee. */
export const ASSET_PLUS_MENU: ModuleMenuItem[] = [
  { path: 'home', label: 'Home', icon: 'home', model: 'asset' },
  { path: 'my-assets', label: 'My assets', icon: 'badge', selfService: true },
  { path: 'register', label: 'Asset register', icon: 'inventory_2', model: 'asset' },
  { path: 'allocations', label: 'Allocations', icon: 'assignment_ind', model: 'assetallocation' },
  { path: 'transfers', label: 'Transfers', icon: 'swap_horiz', model: 'assetallocation' },
  { path: 'returns', label: 'Returns', icon: 'keyboard_return', model: 'assetallocation' },
  { path: 'maintenance', label: 'Maintenance', icon: 'build', model: 'asset' },
  { path: 'damages', label: 'Damage', icon: 'report_problem', model: 'asset' },
  { path: 'losses', label: 'Lost / stolen', icon: 'location_off', model: 'asset' },
  { path: 'disposals', label: 'Disposals', icon: 'delete_sweep', model: 'asset' },
  { path: 'recoveries', label: 'Recoveries', icon: 'payments', model: 'asset' },
  { path: 'clearance', label: 'Exit clearance', icon: 'how_to_reg', model: 'assetallocation' },
  { path: 'settings', label: 'Settings', icon: 'tune', model: 'assettype' },
];

const queue = (path: string) => ({ path, component: AssetQueueComponent, data: { kind: path } });

/** Add `...ASSET_PLUS_ROUTES` to HR_MODULE_ROUTES (main-sidebar children). */
export const ASSET_PLUS_ROUTES: Routes = [
  {
    path: 'asset-plus',
    component: ModuleOptionsComponent,
    data: { title: 'Assets', base: '/main-sidebar/asset-plus', menu: ASSET_PLUS_MENU },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AssetHomeComponent },
      { path: 'my-assets', component: MyAssetsComponent },
      { path: 'register', component: AssetRegisterComponent },
      { path: 'register/:id', component: AssetDetailComponent },
      queue('allocations'), queue('transfers'), queue('returns'), queue('maintenance'), queue('damages'), queue('losses'), queue('disposals'), queue('recoveries'),
      { path: 'clearance', component: AssetClearanceComponent },
      { path: 'settings', component: AssetSetupComponent },
    ],
  },
];
