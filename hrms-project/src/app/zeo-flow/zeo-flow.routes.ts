/** v1.29.0 – Workflow automation pages: /main-sidebar/automation/… */
import { Routes } from '@angular/router';
import { FlowAuditComponent, FlowDashboardComponent, FlowRulesComponent, FlowRunsComponent, FlowScheduledComponent, FlowTemplatesComponent } from './flow-pages.component';
import { FlowEditorComponent } from './flow-editor.component';
import { FlowApprovalFlowsComponent, FlowApprovalsComponent } from './flow-approvals.component';

export const FLOW_ROUTES: Routes = [
  { path: '', component: FlowDashboardComponent, data: { title: 'Automation' } },
  { path: 'rules', component: FlowRulesComponent, data: { title: 'Workflow rules' } },
  { path: 'rules/:id', component: FlowEditorComponent, data: { title: 'Workflow rule' } },
  { path: 'runs', component: FlowRunsComponent, data: { title: 'Execution log' } },
  { path: 'scheduled', component: FlowScheduledComponent, data: { title: 'Scheduled actions' } },
  { path: 'templates', component: FlowTemplatesComponent, data: { title: 'Notification templates' } },
  { path: 'approvals', component: FlowApprovalsComponent, data: { title: 'Approvals' } },
  { path: 'approval-flows', component: FlowApprovalFlowsComponent, data: { title: 'Approval flows' } },
  { path: 'audit', component: FlowAuditComponent, data: { title: 'Configuration changes' } },
];
