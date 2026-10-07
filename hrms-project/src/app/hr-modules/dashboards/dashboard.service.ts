import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModuleApiService } from '../module-api.service';

export interface DrillRequest {
  metric: string;
  params?: Record<string, any>;
  title?: string;
}

export interface DrillColumn { key: string; label: string; type?: string; }
export interface DrillResult { title: string; columns: DrillColumn[]; rows: any[]; }

/** Where a request type lives in the ESS portal (tab names of EmployeeDashboardComponent) and in the HR app. */
export const MODULE_LINKS: Record<string, { ess?: string; essApproval?: string; admin?: string; adminApproval?: string }> = {
  leave: { ess: 'leaverequest', essApproval: 'Leaveapproval', admin: '/main-sidebar/leave-options/leave-request', adminApproval: '/main-sidebar/leave-options/leave-approvals' },
  latein: { ess: 'lateinearlyoutRequest', essApproval: 'Lateinearlyoutapproval', admin: '/main-sidebar/attendance-sidebar/attendance-attendance-request', adminApproval: '/main-sidebar/attendance-sidebar/latein-earlyout-approvals' },
  general: { ess: 'generalRequest', essApproval: 'Genapproval', admin: '/main-sidebar/general-sidebar/general-request' },
  document: { ess: 'documentRequest', essApproval: 'Docapproval' },
  asset: { ess: 'assetRequest', essApproval: 'Assetapproval', admin: '/main-sidebar/asset-options/asset-request', adminApproval: '/main-sidebar/asset-options/asset-approval' },
  loan: { ess: 'loanRequest', essApproval: 'Loanapproval', admin: '/main-sidebar/loan-sidebar/loan-application', adminApproval: '/main-sidebar/loan-sidebar/loan-approval' },
  advance: { ess: 'advsalaryRequest', essApproval: 'Advsalapproval', admin: '/main-sidebar/salary-options/advance-salary-request', adminApproval: '/main-sidebar/salary-options/advance-salary-approvals' },
  airticket: { ess: 'airticketRequest', essApproval: 'Airticketapproval', admin: '/main-sidebar/air-ticket-options/airticket-request', adminApproval: '/main-sidebar/air-ticket-options/airticket-approvals' },
  resignation: { ess: 'resignationRequest', essApproval: 'Resignationapproval', admin: '/main-sidebar/sub-sidebar/resignation-request', adminApproval: '/main-sidebar/sub-sidebar/resignation-approvals' },
  goals: { admin: '/main-sidebar/performance-options/manager-review', adminApproval: '/main-sidebar/performance-options/manager-review' },
  nomination: { admin: '/main-sidebar/learning-options/nominations', adminApproval: '/main-sidebar/learning-options/nominations' },
  requisition: { admin: '/main-sidebar/recruitment-options/requisitions', adminApproval: '/main-sidebar/recruitment-options/requisitions' },
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ModuleApiService) {}

  ess(): Observable<any> {
    return this.api.get('/dashboard/api/ess/');
  }

  team(scope?: string, department?: any): Observable<any> {
    return this.api.get('/dashboard/api/team/', { scope, department });
  }

  drill(req: DrillRequest): Observable<DrillResult> {
    return this.api.get('/dashboard/api/drill/', { metric: req.metric, ...(req.params || {}) });
  }

  employee(id: number): Observable<any> {
    return this.api.get(`/dashboard/api/employee/${id}/`);
  }

  departments(): Observable<any[]> {
    return this.api.list('/organisation/api/Department/');
  }
}
