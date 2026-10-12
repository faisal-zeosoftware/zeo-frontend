import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';   // v1.17.1
import { environment } from '../../../environments/environment';   // v1.17.1
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
  // v1.17.1: the newer modules (own screen / approver's screen)
  expense: { admin: '/main-sidebar/expense-options/reports', adminApproval: '/main-sidebar/expense-options/reports' },
  trip: { admin: '/main-sidebar/expense-options/trips', adminApproval: '/main-sidebar/expense-options/trips' },
  expense_advance: { admin: '/main-sidebar/expense-options/advances', adminApproval: '/main-sidebar/expense-options/advances' },
  correction: { admin: '/main-sidebar/attendance-plus/corrections', adminApproval: '/main-sidebar/attendance-plus/corrections' },
  shift_request: { admin: '/main-sidebar/shift-planner/requests', adminApproval: '/main-sidebar/shift-planner/requests' },
  open_shift: { admin: '/main-sidebar/shift-planner/requests', adminApproval: '/main-sidebar/shift-planner/requests' },
  roster: { admin: '/main-sidebar/shift-planner/rosters', adminApproval: '/main-sidebar/shift-planner/rosters' },
  profile_change: { admin: '/main-sidebar/self-service/my-requests', adminApproval: '/main-sidebar/self-service/hr-requests' },
  letter: { admin: '/main-sidebar/self-service/letters', adminApproval: '/main-sidebar/self-service/hr-letters' },
  grievance: { admin: '/main-sidebar/self-service/complaints', adminApproval: '/main-sidebar/self-service/hr-complaints' },
  transfer: { admin: '/main-sidebar/sub-sidebar/employee-transfer', adminApproval: '/main-sidebar/sub-sidebar/employee-transfer' },
  asset_return: { admin: '/main-sidebar/asset-plus/my-assets', adminApproval: '/main-sidebar/asset-plus/returns' },
  timesheet: { admin: '/main-sidebar/project-options/my-timesheet', adminApproval: '/main-sidebar/project-options/timesheet-approvals' },
  policy: { admin: '/main-sidebar/my-policies' },
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ModuleApiService, private http: HttpClient) {}

  /** v1.17.1: the employee's company policies (OrgStructure employee API) – file and acknowledgement */
  policyFile(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/org-structure/api/my-policies/${id}/file/`, { params: new HttpParams().set('schema', this.api.schema), responseType: 'blob' });
  }

  ackPolicy(id: number): Observable<any> { return this.api.action('/org-structure/api/my-policies/', id, 'acknowledge'); }

  /** v1.16.0: period = {from, to} of the dashboard (or of one card). */
  ess(period: Record<string, any> = {}): Observable<any> {
    return this.api.get('/dashboard/api/ess/', period);
  }

  team(scope?: string, department?: any, period: Record<string, any> = {}): Observable<any> {
    return this.api.get('/dashboard/api/team/', { scope, department, ...period });
  }

  drill(req: DrillRequest): Observable<DrillResult> {
    return this.api.get('/dashboard/api/drill/', { metric: req.metric, ...(req.params || {}) });
  }

  employee(id: number): Observable<any> {
    return this.api.get(`/dashboard/api/employee/${id}/`);
  }

  /** v1.12 – executive dashboard (company admins / view_ceo_dashboard). */
  ceo(params: { from?: string; to?: string; branch?: string; card?: string } = {}): Observable<any> {
    return this.api.get('/dashboard/api/ceo/', params);
  }

  /** v1.12 – unified calendar over every module. */
  calendar(params: { from: string; to: string; layers?: string; scope?: string; branch?: string }): Observable<any> {
    return this.api.get('/dashboard/api/calendar/', params);
  }

  departments(): Observable<any[]> {
    return this.api.list('/organisation/api/Department/');
  }
}
