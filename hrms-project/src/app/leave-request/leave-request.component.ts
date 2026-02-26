import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';
import {combineLatest, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-leave-request',
  templateUrl: './leave-request.component.html',
  styleUrl: './leave-request.component.css'
})
export class LeaveRequestComponent {


  private dataSubscription?: Subscription;
  private apiUrl = `${environment.apiBaseUrl}`;



  totalDays: number = 0;


  start_date: any = '';
  end_date: any = '';
  reason: any = '';

  status: any = '';

  applied_on: any = '';
  approved_by: any = '';
  approved_on: any = '';
  half_day_period: any = '';
  leave_type: string = ''; // or number = 0, based on your API



  employee: any = '';


  dis_half_day: boolean = false;

  registerButtonClicked: boolean = false;


    branch: any = '';
    branches:any []=[];
    automaticNumbering: boolean = false;
    document_number: number | string | null = null;


  LeaveTypes: any[] = [];
  Employees: any[] = [];
  allLeaveTypes: any[] = [];
  leaveBalances: any[] = [];

  Users: any[] = [];

  LeaveRequests: any[] = [];


  filteredEmployees: any[] = [];


  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DesignationService: DesignationService,
    private employeeService: EmployeeService,
    private DepartmentServiceService: DepartmentServiceService,


  ) { }

  ngOnInit(): void {
this.loadDeparmentBranch();
     // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadEmp();
  });

    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);
  
      }
    });
  


  
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {


      // this.LoadLeavetype(selectedSchema);




    }
      // this.LoadEmployee();
      this.LoadUsers();
      this.LoadLeaveRequest();

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


                    this.hasAddPermission = this.checkGroupPermission('add_employee_leave_request', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_employee_leave_request', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_employee_leave_request', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_employee_leave_request', groupPermissions);
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
          console.log('scehmas-de', userData)
        },
        (error) => {
          console.error('Failed to fetch user schemas:', error);
        }
      );
    } else {
      console.error('User ID is null.');
    }


  }



  calculateTotalDays() {
    if (this.start_date && this.end_date) {
      const start = new Date(this.start_date);
      const end = new Date(this.end_date);
      const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
      this.totalDays = diff > 0 ? diff : 0;
    } else {
      this.totalDays = 0;
    }
  }




  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }


requestLeave(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();
  formData.append('start_date', this.start_date);
  formData.append('end_date', this.end_date);
  formData.append('reason', this.reason);
  formData.append('status', this.status);
  formData.append('dis_half_day', this.dis_half_day.toString());
  formData.append('half_day_period', this.half_day_period);
  formData.append('document_number', this.document_number?.toString() || '');
  formData.append('branch', this.branch || '');
  formData.append('leave_type', this.leave_type.toString());
  formData.append('employee', this.selectedEmployee?.toString() || '');

  this.leaveService.requestLeaveAdmin(formData).subscribe(
    (response) => {
      console.log('Leave request successful:', response);
      alert('Leave Request has been sent successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('Leave request failed:', error);

      let errorMessage = 'Something went wrong.';

      // ✅ Handle backend validation or field-level errors
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];

        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`);
          } else {
            messages.push(`${key}: ${JSON.stringify(value)}`);
          }
        }

        if (messages.length > 0) {
          errorMessage = messages.join('\n');
        }
      } else if (error.error?.detail) {
        // Handles backend messages like { "detail": "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Leave request failed!\n\n${errorMessage}`);
    }
  );
}







  selectedEmployee: number | null = null;

  onEmployeeChange() {
    if (!this.selectedEmployee) return;

    this.leaveService.getLeaveBalance(this.selectedEmployee).subscribe(
      (data: any) => {
        this.leaveBalances = data.leave_balance;
        this.allLeaveTypes = data.available_leave_types;

        // Filter available leave types based on the employee's leave balance
        const leaveTypeNames = this.leaveBalances.map(lb => lb.leave_type);
        this.LeaveTypes = this.allLeaveTypes.filter(lt => leaveTypeNames.includes(lt.name));

        console.log('Filtered Leave Types:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching leave balance:', error);
      }
    );
  }

  onEmployeeChangeEdit() {


    if (!this.editAsset.selectedEmployee) return;

    this.leaveService.getLeaveBalance(this.editAsset.selectedEmployee).subscribe(
      (data: any) => {

        this.leaveBalances = data.leave_balance;
        this.allLeaveTypes = data.available_leave_types;

        // Filter available leave types based on the employee's leave balance
        const leaveTypeNames = this.leaveBalances.map(lb => lb.leave_type);
        this.LeaveTypes = this.allLeaveTypes.filter(lt => leaveTypeNames.includes(lt.name));

        console.log('Filtered Leave Types:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching leave balance:', error);
        alert('something went wrong')
      }
    );
  }


//   LoadEmployee(callback?: Function) {
//     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
//     console.log('schemastore',selectedSchema )
//     // Check if selectedSchema is available
//     if (selectedSchema) {
//     this.leaveService.getemployeesMaster(selectedSchema).subscribe(
//       (data: any) => {
//         this.Employees = data;

//         console.log('employee:', this.Employees);
//          if (callback) callback();
//       },
//       (error: any) => {
//         console.error('Error fetching categories:', error);
//       }
//     );
//   }
// }

loadEmp(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

  if (selectedSchema) {
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (result: any) => {
        this.Employees = result;
        this.filteredEmployees = result; // 👈 initialize

        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Employees:', error);
      }
    );
  }
}

  mapEmpNameToId() {

  if (!this.Employees || !this.editAsset?.selectedEmployee) return;

  const emp = this.Employees.find(
    (e: any) => e.emp_code === this.editAsset.selectedEmployee
  );

  if (emp) {
    this.editAsset.selectedEmployee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.selectedEmployee);
}
  


  LoadUsers(callback?: Function) {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.leaveService.getUsers(selectedSchema).subscribe(
      (data: any) => {
        this.Users = data;

        console.log('employee:', this.Users);
        if (callback) callback();
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }
}

    mapLeaveTypeNameToId() {

  if (!this.LeaveTypes || !this.editAsset?.leave_type) return;

  const lv = this.LeaveTypes.find(
    (l: any) => l.name === this.editAsset.leave_type
  );

  if (lv) {
    this.editAsset.leave_type = lv.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.leave_type);
}


  LoadLeaveRequest() {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {

    this.leaveService.getLeaveRequest(selectedSchema).subscribe(
      (data: any) => {
        this.LeaveRequests = data;

        console.log('employee:', this.LeaveRequests);
     
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }
}

isLoading: boolean = false;


fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
  this.isLoading = true;
  this.leaveService.getLeaveRequestNew(schema, branchIds).subscribe({
    next: (data: any) => {
      // Filter active employees
           this.LeaveRequests = data;

      this.isLoading = false;
    },
    error: (err) => {
      console.error('Fetch error:', err);
      this.isLoading = false;
    }
  });
}





  
  iscreateLoanApp: boolean = false;




  openPopus():void{
    this.iscreateLoanApp = true;

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
this.LeaveRequests.forEach(employee => employee.selected = this.allSelecteds);

}

onCheckboxChange(employee:number) {
// No need to implement any logic here if you just want to change the style.
// You can add any additional logic if needed.
}



isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
this.editAsset = { ...asset }; // copy asset data
this.isEditModalOpen = true;

this.mapEmpNameToId();
}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}



deleteSelectedLeaveReq() { 
const selectedEmployeeIds = this.LeaveRequests
.filter(employee => employee.selected)
.map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
alert('No Request selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected Request ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;


selectedEmployeeIds.forEach(categoryId => {
  this.employeeService.deleteLeaveRequest(categoryId).subscribe(
    () => {
      console.log(' Request deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.LeaveRequests = this.LeaveRequests.filter(emp  => emp .id !== categoryId);

         completed++;

 if (completed === total) {
      alert(' Request  deleted successfully');
      window.location.reload();
 }

    },
    (error) => {
      console.error('Error deleting Request:', error);
      alert('Error deleting Request: ' + error.statusText);
    }
  );
});
}
}


updateAssetType(): void {
const selectedSchema = localStorage.getItem('selectedSchema');
if (!selectedSchema || !this.editAsset.id) {
alert('Missing schema or asset ID');
return;
}

this.employeeService.updateLeaveRequest(this.editAsset.id, this.editAsset).subscribe(
(response) => {
  alert(' Request  updated successfully!');
  this.closeEditModal();
  window.location.reload();
},
(error) => {
  console.error('Error updating Leave Request:', error);

  let errorMsg = 'Update failed';

  const backendError = error?.error;

  if (backendError && typeof backendError === 'object') {
    // Convert the object into a readable string
    errorMsg = Object.keys(backendError)
      .map(key => `${key}: ${backendError[key].join(', ')}`)
      .join('\n');
  }

  alert(errorMsg);
}
);
}

editTotalDays = 0;



calculateEditTotalDays() {
  if (this.editAsset.start_date && this.editAsset.end_date) {
    const start = new Date(this.editAsset.start_date);
    const end = new Date(this.editAsset.end_date);

    const diff =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    this.editTotalDays = diff > 0 ? diff : 0;
  } else {
    this.editTotalDays = 0;
  }
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
  if (!this.branches || !this.editAsset?.branch) return;

  const Bran = this.branches.find(
    (b: any) => b.branch_name === this.editAsset.branch
  );

  if (Bran) {
    this.editAsset.branch = Bran.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.branch);
}


onBranchChange(event: any): void {
  const selectedBranchId = event.target.value;
  const selectedSchema = localStorage.getItem('selectedSchema');

  this.branch = selectedBranchId;

  /* ---------------------------------------
     1️⃣ FILTER EMPLOYEES BY BRANCH
  ---------------------------------------*/
  if (!selectedBranchId) {
    this.filteredEmployees = this.Employees;
    this.selectedEmployee = null;
  } else {
    const selectedBranch = this.branches.find(
      b => Number(b.id) === Number(selectedBranchId)
    );

    if (selectedBranch) {
      this.filteredEmployees = this.Employees.filter(emp =>
        emp.emp_branch_id === selectedBranch.branch_name
      );
    } else {
      this.filteredEmployees = [];
    }

    this.selectedEmployee = null;
  }

  /* ---------------------------------------
     2️⃣ DOCUMENT NUMBERING LOGIC
  ---------------------------------------*/

  if (!selectedBranchId || !selectedSchema) {
    this.automaticNumbering = false;
    this.document_number = null;
    return;
  }

  const type = 'leave_request'; // 🔥 IMPORTANT: change from general_request

  const apiUrl = `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;

  this.http.get<any>(apiUrl).subscribe({
    next: (response) => {
      const data = Array.isArray(response) && response.length > 0 ? response[0] : response;

      this.automaticNumbering = !!data?.automatic_numbering;

      this.document_number = this.automaticNumbering ? null : '';
    },
    error: () => {
      this.automaticNumbering = false;
      this.document_number = '';
    }
  });
}


}
