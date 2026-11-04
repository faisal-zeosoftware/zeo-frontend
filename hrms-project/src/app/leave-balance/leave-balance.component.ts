import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';
import {combineLatest, Subscription } from 'rxjs';
import { openZForm } from '../shared-ui/z-form.component';   // v1.62.10 (item 170)
import { leaveBalanceForm } from '../shared-ui/z-forms-records';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window


@Component({
  selector: 'app-leave-balance',
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.css'
})
export class LeaveBalanceComponent {

     private apiUrl = `${environment.apiBaseUrl}`;
     private dataSubscription?: Subscription;


  registerButtonClicked: boolean = false;




  created_by:any='' ;



  LeaveTypes: any[] = [];
  Employees: any[] = [];
  LeaveBalances: any[] = [];



  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  hasImportPermission: boolean = false;
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names





  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private DesignationService: DesignationService,
    private employeeService: EmployeeService,
    private companyRegistrationService: CompanyRegistrationService, 

  
    ) {}

    ngOnInit(): void {

    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);
  
      }
    });


      // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.LoadEmployees();
    this.LoadLeavetype();
  });



      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


        // this.LoadLeavetype();
      this.LoadUsers(selectedSchema);
      this.LoadEmployees();
      // this.LoadLeavebalance(selectedSchema);


      
      }

      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property

      this.created_by= this.userId;
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
        this.hasImportPermission = true;

    
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
                this.hasImportPermission = true;

              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

               
                this.hasAddPermission = this.checkGroupPermission('add_emp_leave_balance', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_emp_leave_balance', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_emp_leave_balance', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  
                this.hasViewPermission = this.checkGroupPermission('view_emp_leave_balance', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);

                this.hasImportPermission = this.checkGroupPermission('import_emp_leave_balance', groupPermissions);
                console.log('Has import permission:', this.hasImportPermission);


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

    LoadLeavetype(callback?: Function) {
      const selectedSchema = this.authService.getSelectedSchema();
      const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
      if (selectedSchema) {
        this.leaveService.getLeaveTypeNew(selectedSchema, savedIds).subscribe(
          (result: any) => { this.LeaveTypes = result; if (callback) callback(); },
          (error) => { console.error('Error fetching leave types:', error); }
        );
      }
    }

    LoadEmployees(callback?: Function) {
      const selectedSchema = this.authService.getSelectedSchema();
      const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
      if (selectedSchema) {
        this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
          (result: any) => { this.Employees = result; if (callback) callback(); },
          (error) => { console.error('Error fetching employees:', error); }
        );
      }
    }

    LoadUsers(selectedSchema: string) {
      this.leaveService.getApproverUsers(selectedSchema).subscribe(
        (data: any) => { this.Users = data; },
        (error: any) => { console.error('Error fetching users:', error); }
      );
    }

    isLoading: boolean = false;

    fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.leaveService.getAllLeaveBalanceAllNew(schema, branchIds).subscribe({
        next: (data: any) => {
          this.LeaveBalances = data;
          this.isLoading = false;
          this.currentPage = 1;
          this.updatePagination();
        },
        error: (err) => { console.error('Fetch error:', err); this.isLoading = false; }
      });
    }

    private reload(): void {
      const schema = this.authService.getSelectedSchema();
      if (schema) { this.fetchEmployeesLeaveApprovalLevel(schema, JSON.parse(localStorage.getItem('selectedBranchIds') || '[]')); }
    }

  /** v1.62.10 (item 170): "+ New leave balance" – the shared form; saved through the leave ledger */
  async openPopus(): Promise<void> {
    if (await openZForm(leaveBalanceForm())) { this.reload(); }
  }

  /** v1.62.10 (item 170): Edit on the row – the same form for this employee and leave type (set to / add, with a reason) */
  async openEditModal(row: any): Promise<void> {
    if (await openZForm(leaveBalanceForm(row))) { this.reload(); }
  }

  /** v1.62.10 (item 170): Delete on the row – one confirmation; the server books the remaining days off in the ledger first */
  async zDeleteRow(row: any): Promise<void> {
    const who = `${row.employee_name || row.employee} – ${row.leave_type_name || row.leave_type}`;
    if (!(await zConfirm(i18nT('Delete the leave balance of {0}? The remaining days are taken off with a leave ledger line.', [who])))) { return; }
    this.leaveService.deleteLeaveBalance(row.id).subscribe({
      next: () => { zToast(i18nT('Leave balance deleted.'), 'ok'); this.reload(); },
      error: (e: any) => { zToast(String(e?.error?.detail || e?.error?.error || i18nT('It could not be deleted.')), 'err'); },
    });
  }

  // ---- v1.62.10 (item 170): import (new-design window; rows go through the leave ledger)
  importOpen = false; importBusy = false; importTried = false;
  importResult = ''; importErr = ''; importErrors: string[] = [];
  selectedFile: File | null = null;

  openImport(): void { this.importOpen = true; this.importTried = false; this.importResult = ''; this.importErr = ''; this.importErrors = []; this.selectedFile = null; }
  closeImport(): void { if (this.importBusy) { return; } const done = !!this.importResult; this.importOpen = false; if (done) { this.reload(); } }
  onFileSelected(event: any): void { this.selectedFile = event.target.files?.[0] || null; this.importErr = ''; }

  bulkUploadLeaveBalance(): void {
    this.importTried = true; this.importResult = ''; this.importErr = ''; this.importErrors = [];
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema || !this.selectedFile) { return; }
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('mode', 'add');            // the template's "Openings" are added to the balance (as before)
    formData.append('date', new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10));
    this.importBusy = true;
    this.http.post(`${this.apiUrl}/leave-policy/api/openings/?schema=${selectedSchema}`, formData).subscribe({
      next: (r: any) => {
        this.importBusy = false;
        const n = Number(r?.loaded || 0), bad = Number(r?.error_count || 0);
        if (bad) { this.importErr = i18nT('{0} rows imported, {1} not imported:', [n, bad]); this.importErrors = (r.errors || []).slice(0, 50); }
        if (n || !bad) { this.importResult = i18nT('{0} rows imported – each with a leave ledger line.', [n]); }
      },
      error: (e: any) => {
        this.importBusy = false;
        const d = e?.error;
        this.importErr = String((d && (d.detail || d.error)) || i18nT('The file could not be imported.'));
      }
    });
  }

  downloadLeaveBalanceCsv(): void {
    const schema = this.authService.getSelectedSchema();
    if (!schema) return;
    this.companyRegistrationService.downloadLeaveCsv(schema).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Leave_Balance_Template.csv'; a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadLeaveBalanceExcel(): void {
    const schema = this.authService.getSelectedSchema();
    if (!schema) return;
    this.companyRegistrationService.downloadLeaveExcel(schema).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Leave_Balance_Template.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  searchQuery: string = '';

  // ==================== list (paging is done by the shared list footer) ====================
  currentPage: number = 1;
  itemsPerPage: number = 100000;
  pagedLeaveBalances: any[] = [];

  get filteredLeaveBalances(): any[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') { return this.LeaveBalances; }
    const search = this.searchQuery.toLowerCase().trim();
    return this.LeaveBalances.filter((docs: any) =>
      String(docs.leave_type ?? '').toLowerCase().includes(search) ||
      String(docs.balance ?? '').toLowerCase().includes(search) ||
      String(docs.employee ?? '').toLowerCase().includes(search) ||
      String(docs.employee_name ?? '').toLowerCase().includes(search));
  }

  get totalPages(): number { return Math.ceil(this.filteredLeaveBalances.length / this.itemsPerPage); }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.pagedLeaveBalances = this.filteredLeaveBalances.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onSearchChange(): void { this.currentPage = 1; this.updatePagination(); }
}
