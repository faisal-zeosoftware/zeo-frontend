import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { DepartmentServiceService } from '../department-master/department-service.service';

import {combineLatest, Subscription } from 'rxjs';
@Component({
  selector: 'app-advance-salary-request',
  templateUrl: './advance-salary-request.component.html',
  styleUrl: './advance-salary-request.component.css'
})
export class AdvanceSalaryRequestComponent {

  

  private dataSubscription?: Subscription;
  
        private apiUrl = `${environment.apiBaseUrl}`;

  allSelected=false;

     branch: any = '';

     branches:any []=[];

   automaticNumbering: boolean = false;




   document_number: number | string | null = null;
  reason:any='' ;
  total:any='' ;

  remarks:any='' ;
  requested_amount: any = '';
  employee: any = '';
  created_by: any = '';

  rejection_reason:any='';

  pause_start_date:any='';

  resume_date:any='';

  pause_reason:any='';


  is_compensatory: boolean = false;

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
    

  }
});

  // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadDeparmentBranch();
    this.loadEmp(); 
 
  });



      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

     
      this.LoadUsers(selectedSchema);
      this.LoadLeaveApprovalLevel(selectedSchema);

      this.LoadDocType(selectedSchema);
      // this.LoadEmployee(selectedSchema);
      // this.LoadDocRequest(selectedSchema);
      // this.loadDeparmentBranch();

      
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

               
                this.hasAddPermission = this.checkGroupPermission('add_advancesalaryrequest', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_advancesalaryrequest', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_advancesalaryrequest', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_advancesalaryrequest', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);


              } else {
                console.error('No groups found in data or groups array is empty.', firstItem);
              }
            } else {
              console.error('Permissions data is not an array or is empty.', permissionsData);
            }


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


    
// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_leaveapprovallevels' ||'change_leaveapprovallevels' 
//   ||'delete_leaveapprovallevels' ||'view_leaveapprovallevels';
  
  
//   // Check user permissions
//   if (permissions.some(permission => permission.codename === requiredPermission)) {
//     return true;
//   }
  
//   // Check group permissions (if applicable)
//   // Replace `// TODO: Implement group permission check`
//   // with your logic to retrieve and check group permissions
//   // (consider using a separate service or approach)
//   return false; // Replace with actual group permission check
//   }
  
  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }


    selectedEmployee: number | null = null;


onBranchChange(event: any): void {
  const selectedBranchId = event.target.value;
  const selectedSchema = localStorage.getItem('selectedSchema');

  this.branch = selectedBranchId;

  /* ------------------ FILTER EMPLOYEES ------------------ */
  if (!selectedBranchId) {
    this.filteredEmployees = this.Employee;
    this.employee = '';
  } else {
    const selectedBranch = this.branches.find(
      b => Number(b.id) === Number(selectedBranchId)
    );

    if (selectedBranch) {
      this.filteredEmployees = this.Employee.filter(emp =>
        emp.emp_branch_id == selectedBranch.id ||
        emp.emp_branch_id == selectedBranch.branch_name
      );
    } else {
      this.filteredEmployees = [];
    }

    this.employee = '';
  }

  /* ------------------ DOCUMENT NUMBERING ------------------ */
  if (!selectedBranchId || !selectedSchema) {
    this.automaticNumbering = false;
    this.document_number = null;
    return;
  }

  const type = 'advance_salary';

  const apiUrl =
    `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;

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





  
 
  
  

    LoadLeaveApprovalLevel(selectedSchema: string) {
      this.leaveService.getDocReqApprovalLevel(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveapprovalLevels = data;
        
          console.log('employee:', this.LeaveapprovalLevels);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }
  
 
  
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
    //   this.leaveService.getAdvSalaryRequest(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.DocRequest = data;
        
    //       console.log('DocRequest:', this.DocRequest);
    //     },
    //     (error: any) => {
    //       console.error('Error fetching DocType:', error);
    //     }
    //   );
    // }
  

    isLoading: boolean = false;

    fetchEmployees(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.leaveService.getAdvSalaryRequestNew(schema, branchIds).subscribe({
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
  



    SetLeaveApprovaLevel(): void {
      this.registerButtonClicked = true;
      // if (!this.name || !this.code || !this.valid_to) {
      //   return;
      // }
    
      const formData = new FormData();
     formData.append('document_number', this.document_number?.toString() || '');
      formData.append('reason', this.reason);
      formData.append('branch', this.branch);


  
  
      formData.append('remarks', this.remarks);
    
      formData.append('requested_amount', this.requested_amount);
      formData.append('employee', this.employee);
      formData.append('created_by', this.created_by);

     
  
      
    
    
      this.leaveService.CreateAdvSalaryRequest(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Advanced salary Request  has been Sent');
  
          window.location.reload();
        },  
        (error) => {
          console.error('Added failed', error);
          alert('Enter all required fields!');
        }
      );
    }








    isPauseModalOpen: boolean = false;
    isResumeModalOpen: boolean = false;

    iscreateLoanApp: boolean = false;




    openPopus():void{
      this.iscreateLoanApp = true;
      this.document_number = null;
      this.automaticNumbering = false;
      this.branch = ''; 

    }
  
    closeapplicationModal():void{
      this.iscreateLoanApp = false;

    }

selectedLoanId: number | null = null;



openPauseModal(loan: any): void {
this.selectedLoanId = loan.id;
this.pause_start_date = '';
this.pause_reason = '';
this.isPauseModalOpen = true;
}
closePauseModal(): void {
this.isPauseModalOpen = false;
}



openResumeModal(loan: any): void {
this.selectedLoanId = loan.id;
this.resume_date = '';
this.isResumeModalOpen = true;
}

closeResumeModal(): void {
this.isResumeModalOpen = false;
}



// -------------------- Submit Pause --------------------

submitPauseLoan(): void {
if (!this.selectedLoanId) {
  alert('Loan ID is missing!');
  return;
}

const pauseData = {
  pause_start_date: this.pause_start_date,
  pause_reason: this.pause_reason,
  resume_date: null // resume date is not set during pause
};

this.leaveService.pauseAdvsalaryApplication(this.selectedLoanId, pauseData).subscribe(
  (response) => {
    alert('Advance salary request application paused successfully!');
    this.closePauseModal();
    // this.loadLoanApplications();
    window.location.reload();
  },
  (error) => {
    console.error('Pause failed:', error);
    alert('Failed to pause the Advance salary request application.');
  }
);
}

// -------------------- Submit Resume --------------------

submitResumeLoan(): void {
if (!this.selectedLoanId) {
  alert('Loan ID is missing!');
  return;
}

const resumeData = {
  resume_date: this.resume_date,
  pause_start_date: null, // clear pause date when resuming
  pause_reason: null
};

this.leaveService.resumeAdvsalaryApplication(this.selectedLoanId, resumeData).subscribe(
  (response) => {
    alert('Loan application resumed successfully!');
    this.closeResumeModal();
    // this.loadLoanApplications();
    window.location.reload();

  },
  (error) => {
    console.error('Resume failed:', error);
    alert('Failed to resume the Advance salary request application.');
  }
);
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

onCheckboxChange(employee: number) {
// No need to implement any logic here if you just want to change the style.
// You can add any additional logic if needed.
}



isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
this.editAsset = { ...asset }; // copy asset data
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
alert('No States selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected  Advance Salary Request ?')) {
      let total = selectedEmployeeIds.length;
    let completed = 0;
selectedEmployeeIds.forEach(categoryId => {
  this.employeeService.deletepayrolladvSalary(categoryId).subscribe(
    () => {
      console.log(' Advance Salary Request  deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.DocRequest = this.DocRequest.filter(employee => employee.id !== categoryId);
      completed++;
       if (completed === total) {
      alert(' Advance Salary Request  deleted successfully');
      window.location.reload();
       }

    },
    (error) => {
      console.error('Error deleting  Advance Salary Request :', error);
        alert('Error deleting  Advance Salary Request : ' + error.statusText);

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

this.employeeService.updatepayrolladvSalary(this.editAsset.id, this.editAsset).subscribe(
(response) => {
  alert(' Advance Salary Request  updated successfully!');
  this.closeEditModal();
  window.location.reload();
},
(error) => {
  console.error('Error updating Adv Salary Requset:', error);

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


  // loadDeparmentBranch(callback?: Function): void {
    
  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.branches = result;
  //         console.log(' fetching Companies:');
  //           if (callback) callback();

  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  //   }

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
              this.branches = this.branches[0].id;
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



}
