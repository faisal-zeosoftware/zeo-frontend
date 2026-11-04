import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';

import {combineLatest, Subscription } from 'rxjs';
import { EmployeeService } from '../employee-master/employee.service';
import { MatSelect } from '@angular/material/select';
import { openZForm } from '../shared-ui/z-form.component';   // v1.62.10 (item 170)
import { COMP_LEAVE_FORM, compAllocateForm } from '../shared-ui/z-forms-records';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';
import { environment } from '../../environments/environment';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

@Component({
  selector: 'app-compensatory-leave',
  templateUrl: './compensatory-leave.component.html',
  styleUrl: './compensatory-leave.component.css'
})
export class CompensatoryLeaveComponent {

    private dataSubscription?: Subscription;

    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;


    @ViewChild('selectEdit') selectEdit: MatSelect | undefined;
  
   
selectedCompLeaveId: any = ''
  
  request_type:any='';
  employee:any='';
  request_date:any='';
  work_date:any='';

  reason:any='';

  transaction_type:any='';
  days:any='';
  credited_days:any='';

  attendances: any[] = [];


  registerButtonClicked = false;
  Employees: any[] = [];
  compAttendance: any[] = [];

  compTransactions: any[] = [];


  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private employeeService: EmployeeService,
    private DesignationService: DesignationService,
    
    ) {}

    ngOnInit(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {



      
      }

            // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);
  
      }
    });


      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property


      console.log('User ID:', this.userId); // Log user ID
      console.log('User Details:', this.userDetails); // Log user details

      // Check if user is_superuser is true or false
      let isSuperuser = this.userDetails.is_superuser || false; // Default to false if is_superuser is undefined
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) {
        console.error('No schema selected.');
        return;
      }
    
    
      if (isSuperuser) {
        console.log('User is superuser or ESS user');
        
        // Grant all permissions
        this.hasViewPermission = true;
        this.hasAddPermission = true;
        this.hasDeletePermission = true;
        this.hasEditPermission = true;
    
        // Fetch designations without checking permissions
        // this.fetchDesignations(selectedSchema);
      } else {
        console.log('User is not superuser');

        const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
         
          
          
          try {
            const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
            console.log('Permissions data:', permissionsData);

            if (Array.isArray(permissionsData) && permissionsData.length > 0) {
              const firstItem = permissionsData[0];

              if (firstItem.is_superuser) {
                console.log('User is superuser according to permissions API');
                // Grant all permissions
                this.hasViewPermission = true;
                this.hasAddPermission = true;
                this.hasDeletePermission = true;
                this.hasEditPermission = true;
              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

               
                this.hasAddPermission = this.checkGroupPermission('add_compensatoryleaverequest', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_compensatoryleaverequest', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_compensatoryleaverequest', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_compensatoryleaverequest', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);


              } else {
                console.debug('No permission groups for this user.');   // v1.17.0 (audit M12): normal for an employee, not an error
              }
            } else {
              console.error('Permissions data is not an array or is empty.', permissionsData);
            }

            // Fetching designations after checking permissions
            // this.fetchDesignations(selectedSchema);
          }
          
          catch (error) {
            console.error('Error fetching permissions:', error);
          }
        } else {
          console.error('No schema selected.');
        }
          
      }
    },
    (error) => {
      console.error('Failed to fetch user details:', error);
    }
  );

    // this.fetchingApprovals();


    this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
            this.userDetailss = userData;
            this.schemas = userData.map((schema: any) => schema.schema_name);
            console.log('scehmas-de',userData)
        },
        (error) => {
            console.error('Failed to fetch user schemas:', error);
        }
    );
} else {
    console.error('User ID is null.');
}


   
    }


  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

  isLoading: boolean = false;

  fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveService.getCompanLeave(schema, branchIds).subscribe({
      next: (data: any) => { this.compTransactions = (data || []).slice().sort((a: any, b: any) => Number(!!a.is_allocated) - Number(!!b.is_allocated) || (b.id - a.id)); this.isLoading = false; },
      error: (err) => { console.error('Fetch error:', err); this.isLoading = false; }
    });
  }

  private reload(): void {
    const schema = this.authService.getSelectedSchema();
    if (schema) { this.fetchEmployeesLeaveApprovalLevel(schema, JSON.parse(localStorage.getItem('selectedBranchIds') || '[]')); }
  }

  /** the first attendance day of the entry (the day worked) */
  workDay(r: any): string | null { return r?.attendances?.length ? r.attendances[0].date : null; }

  /** v1.62.10 (item 170): "+ New compensatory leave" – a pending entry in the shared form (it was a disabled button) */
  async openPopus(): Promise<void> { if (await openZForm(COMP_LEAVE_FORM)) { this.reload(); } }

  /** v1.62.10 (item 170): Edit on a pending row (days and reason); an allocated entry is booked and stays as it is */
  async openEditModal(row: any): Promise<void> { if (await openZForm(COMP_LEAVE_FORM, row)) { this.reload(); } }

  /** v1.62.10 (item 170): Allocate – the shared form with the days; the server writes the ledger line and moves the balance */
  async openAllocateModal(row: any): Promise<void> { if (await openZForm(compAllocateForm(row))) { this.reload(); } }

  /** v1.62.10 (item 170): Delete on a pending row – one confirmation, a short message */
  async zDeleteRow(row: any): Promise<void> {
    if (!(await zConfirm(i18nT('Delete the compensatory leave entry of {0}?', [row.employee_name || row.employee])))) { return; }
    const sch = this.authService.getSelectedSchema();   // the allocation itself (deleteCompLeave() points at the request API)
    this.http.delete(`${environment.apiBaseUrl}/calendars/api/compensatory-leave-allocation/${row.id}/?schema=${sch}`).subscribe({
      next: () => { zToast(i18nT('Compensatory leave deleted.'), 'ok'); this.reload(); },
      error: (e: any) => { zToast(String(e?.error?.detail || e?.error?.error || i18nT('It could not be deleted.')), 'err'); },
    });
  }
}
