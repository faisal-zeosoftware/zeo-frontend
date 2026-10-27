import { Routes } from '@angular/router';
import { PrintTemplatesComponent } from './print-templates.component';
import { PrintTemplateEditorComponent } from './print-template-editor.component';

/**
 * v1.62.0 print – Settings › Print templates. `...PRINT_TEMPLATES_ROUTES` in the children of the `settings` route:
 *   /main-sidebar/settings/print-templates        gallery, branding, defaults
 *   /main-sidebar/settings/print-templates/:id    editor
 * The document viewer /main-sidebar/print-view/:docType/:id is a child of main-sidebar (PRINT_VIEW_ROUTE).
 */
export const PRINT_TEMPLATES_ROUTES: Routes = [
  { path: 'print-templates', component: PrintTemplatesComponent, data: { title: 'Print templates' } },
  { path: 'print-templates/:id', component: PrintTemplateEditorComponent, data: { title: 'Print template' } },
];
export const PRINT_VIEW_ROUTE: Routes = [
  { path: 'print-view/:docType/:id', loadComponent: () => import('./print-view.component').then(m => m.PrintViewComponent), data: { title: 'Document' } },
];
