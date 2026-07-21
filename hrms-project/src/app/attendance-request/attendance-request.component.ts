import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import {combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-attendance-request',
  templateUrl: './attendance-request.component.html',
  styleUrl: './attendance-request.component.css'
})

export class AttendanceRequestComponent {

    private apiUrl = `${environment.apiBaseUrl}`;
    private dataSubscription?: Subscription;
  
    allSelected=false;
  

     branch: any = '';

     branches:any []=[];

      automaticNumbering: boolean = false;

         document_number: number | string | null = null;
  
  
    // document_date:any='';

    date:any='';
    request_type:any='';
    reason:any='';
    status:any='';
    employee: any = '';
  
    
    created_by:any='';
  
    registerButtonClicked: boolean = false;
  
  
  
    LeaveapprovalLevels: any[] = [];
  
      Employee: any[] = [];
  
    DocRequest: any[] = [];
  
    Users: any[] = [];
    DocType: any[] = [];

      filteredEmployees: any[] = [];
  
  
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
      private DesignationService: DesignationService,
      private employeeService: EmployeeService,
      private DepartmentServiceService: DepartmentServiceService 
  
      ) {}
  
      ngOnInit(): void {
  
          // combineLatest waits for both Schema and Branches to have a value
          this.dataSubscription = combineLatest([
            this.employeeService.selectedSchema$,
            this.employeeService.selectedBranches$
          ]).subscribe(([schema, branchIds]) => {
            if (schema) {
              this.fetchEmployees(schema, branchIds);
              this.fetchResignation(schema, branchIds);
  
            }
          });

   this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadDeparmentBranch();
    this.loadEmp(); 
 
  });
  
        const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
  
       
        // this.LoadUsers(selectedSchema);
        // this.LoadLeaveApprovalLevel(selectedSchema);
  
        // this.LoadDocType(selectedSchema);
        // this.LoadEmployee(selectedSchema);
        // this.LoadDocRequest(selectedSchema);
  
        
        }
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_lateinearlyoutrequest', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_lateinearlyoutrequest', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_lateinearlyoutrequest', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_lateinearlyoutrequest', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermission);
  
  
                } else {
                  console.error('No groups found in data or groups array is empty.', firstItem);
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
  
  
  
    
  
      // LoadLeaveApprovalLevel(selectedSchema: string) {
      //   this.leaveService.getDocReqApprovalLevel(selectedSchema).subscribe(
      //     (data: any) => {
      //       this.LeaveapprovalLevels = data;
          
      //       console.log('employee:', this.LeaveapprovalLevels);
      //     },
      //     (error: any) => {
      //       console.error('Error fetching categories:', error);
      //     }
      //   );
      // }
    
   
    
      LoadUsers(selectedSchema: string) {
        this.leaveService.getUsers(selectedSchema).subscribe(
          (data: any) => {
            this.Users = data;
          
            console.log('employee:', this.Users);
          },
          (error: any) => {
            console.error('Error fetching categories:', error);
          }
        );
      }


      loadEmp(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

  if (selectedSchema) {
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (data: any) => {
        this.Employee = data;
        this.filteredEmployees = data; // ✅ IMPORTANT

        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Employees:', error);
      }
    );
  }
}

mapEmployeeNameToId() {

  if (!this.Employee || !this.editAsset.employee) return;

  const emp = this.Employee.find(
    (e: any) =>
      e.emp_first_name === this.editAsset.employee ||
      e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;
  }

  console.log(this.editAsset.employee);
}
    
  
      
      // LoadEmployee(selectedSchema: string) {
      //   this.leaveService.getemployeesMaster(selectedSchema).subscribe(
      //     (data: any) => {
      //       this.Employee = data;
          
      //       console.log('employee:', this.Employee);
      //     },
      //     (error: any) => {
      //       console.error('Error fetching Employee:', error);
      //     }
      //   );
      // }
  
      isLoading: boolean = false;
  
      fetchEmployees(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.employeeService.getemployeesMasterNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
                 this.Employee = data;
  
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }


    
    
    
  
      LoadDocType(selectedSchema: string) {
        this.leaveService.getDocType(selectedSchema).subscribe(
          (data: any) => {
            this.DocType = data;
          
            console.log('DocType:', this.DocType);
          },
          (error: any) => {
            console.error('Error fetching DocType:', error);
          }
        );
      }
    
  
  
      
      // LoadDocRequest(selectedSchema: string) {
      //   this.leaveService.getEmpResignationRequest(selectedSchema).subscribe(
      //     (data: any) => {
      //       this.DocRequest = data;
          
      //       console.log('DocRequest:', this.DocRequest);
      //     },
      //     (error: any) => {
      //       console.error('Error fetching DocType:', error);
      //     }
      //   );
      // }
    
  
      fetchResignation(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.employeeService.getLateInEarlyOutNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
                 this.DocRequest = data;
  
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }
    
  
  
      SetLateInEarlyOut(): void {
        this.registerButtonClicked = true;
        // if (!this.name || !this.code || !this.valid_to) {
        //   return;
        // }
      
        const formData = new FormData();
        formData.append('date', this.date);
        // formData.append('status', this.status);
  
        formData.append('request_type', this.request_type);
        formData.append('document_number', this.document_number?.toString() || '');
         formData.append('branch', this.branch);
  
        formData.append('reason', this.reason);
      
        // formData.append('employee', this.employee);

          if (this.employee !== null) {
  formData.append('employee', this.employee.toString());
}

    this.isLoading = true;
    
    

        this.leaveService.CreateLateinEarlyOutRequest(formData).subscribe(
          (response) => {
            this.isLoading = false;
            console.log('Latein Early Out successful', response);
             
    
    
            alert('Latein Early Out Request has been Sent');
    
            window.location.reload();
          },  
    (error) => {
      this.isLoading = false;
      // same error handling as above...
      console.error('Added failed', error);
      let errorMessage = 'Enter all required fields!';

      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
        );
      }
  

  
  
  
  
      isPauseModalOpen: boolean = false;
      isResumeModalOpen: boolean = false;
  
      iscreateLoanApp: boolean = false;
  
  
  
  
  selectedLoanId: number | null = null;
  
  
  
  
    openPopus():void{
      this.iscreateLoanApp = true;
      this.document_number = null;
      this.automaticNumbering = false;
      this.branch = ''; 

              // Auto select first branch
  if (this.branches && this.branches.length > 0) {
    this.branch = this.branches[0].id;

    // Trigger employee filtering + document numbering
    this.onBranchChange();
  } else {
    this.branch = '';
  }

    }
  
  closeapplicationModal():void{
    this.iscreateLoanApp = false;
  
  }
  
  
  
  showEditBtn: boolean = false;
    
  EditShowButtons() {
    this.showEditBtn = !this.showEditBtn;
  }
  
  
  Delete: boolean = false;
  allSelecteds: boolean = false;
  
  toggleCheckboxes() {
  this.Delete = !this.Delete;
  }
  
  toggleSelectAllEmployees() {
    this.allSelecteds = !this.allSelecteds;
  this.DocRequest.forEach(employee => employee.selected = this.allSelecteds);
  
  }
  
  onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
  }
  
  
  
  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited
  
openEditModal(asset: any) {

    this.editAsset = { ...asset };

    this.mapEmployeeNameToId();
    this.mapBranchesNameToId();

    this.isEditModalOpen = true;
}
  
  closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editAsset = {};
  }
  
  
  deleteSelectedAssetType() { 
    const selectedEmployeeIds = this.DocRequest
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No LateIn EarlyOut Request selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected LateIn EarlyOut Request ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteLateInEarlyOutReq(categoryId).subscribe(
          () => {
            console.log(' Request deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.DocRequest = this.DocRequest.filter(employee => employee.id !== categoryId);
               completed++;
                 if (completed === total) {
            alert(' Request deleted successfully');
            window.location.reload();
                 }
  
          },
          (error) => {
            console.error('Error deleting LateIn EarlyOut Request:', error);
              alert('Error deleting LateIn EarlyOut Request:' + error.statusText);
  
          }
        );
      });
    }
  }
  
  
updateLateInEarlyOut(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  const payload = {
    date: this.editAsset.date,
    request_type: this.editAsset.request_type,
    branch: this.editAsset.branch,
    document_number: this.editAsset.document_number,
    reason: this.editAsset.reason,
    employee: this.editAsset.employee
  };

  this.employeeService.updateLateInEarlyOutReq(this.editAsset.id, payload).subscribe(
    () => {
      alert('Request updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
    (error) => {
      console.error(error);
      alert('Update failed');
    }
  );
}






onBranchChange(): void {

  const selectedBranchId = this.branch;
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedBranchId) {
    this.filteredEmployees = this.Employee;
    this.employee = '';
  } else {

    const selectedBranch = this.branches.find(
      b => Number(b.id) === Number(selectedBranchId)
    );

    if (selectedBranch) {

      this.filteredEmployees = this.Employee.filter(emp =>
        emp.emp_branch_id === selectedBranch.branch_name
      );

    } else {
      this.filteredEmployees = [];
    }

   // Only clear if the selected employee doesn't belong to this branch
const exists = this.filteredEmployees.some(emp => emp.id == this.employee);

if (!exists) {
  this.employee = '';
}
  }

  if (!selectedBranchId || !selectedSchema) {
    this.automaticNumbering = false;
    this.document_number = null;
    return;
  }

  const type = 'lateinearlyout_request';

  const apiUrl =
    `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;
console.log(apiUrl);
  this.http.get<any>(apiUrl).subscribe({

    next: (response) => {

      const data = Array.isArray(response) && response.length > 0
        ? response[0]
        : response;

      this.automaticNumbering = !!data?.automatic_numbering;

      if (this.automaticNumbering) {
        this.document_number = null;
      } else {
        this.document_number = '';
      }
    },

    error: () => {
      this.automaticNumbering = false;
      this.document_number = '';
    }

  });
}

onEmployeeChange(): void {

  if (!this.employee) return;

  const selectedEmployee = this.Employee.find(
    emp => emp.id == this.employee
  );

  if (!selectedEmployee) return;

  if (typeof selectedEmployee.emp_branch_id === 'number') {
    this.branch = selectedEmployee.emp_branch_id;
  } else {

    const matchedBranch = this.branches.find(
      b => b.branch_name === selectedEmployee.emp_branch_id
    );

    if (matchedBranch) {
      this.branch = matchedBranch.id;
    }
  }

  this.onBranchChange();
}

  loadDeparmentBranch(callback?: Function): void {
      const selectedSchema = this.authService.getSelectedSchema();
      
      if (selectedSchema) {
        this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
          (result: any[]) => {
            // 1. Get the sidebar selected IDs from localStorage
            const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    
            // 2. Filter the API result to only include branches selected in the sidebar
            // If sidebar is empty, you might want to show all, or show none. 
            // Usually, we show only the selected ones:
            if (sidebarSelectedIds.length > 0) {
              this.branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
            } else {
              this.branches = result; // Fallback: show all if nothing is selected in sidebar
            }
            // Inside the subscribe block of loadDeparmentBranch
            if (this.branches.length === 1) {
              this.branch = this.branches[0].id;
            }
    
            console.log('Filtered branches for selection:', this.branches);
            if (callback) callback();
          },
          (error) => {
            console.error('Error fetching branches:', error);
          }
        );
      }
    }

  mapBranchesNameToId() {

  if (!this.branches || !this.editAsset.branch) return;

  const branch = this.branches.find(
    (b: any) => b.branch_name === this.editAsset.branch
  );

  if (branch) {
    this.editAsset.branch = branch.id;
  }

}
  

  
  
  }


