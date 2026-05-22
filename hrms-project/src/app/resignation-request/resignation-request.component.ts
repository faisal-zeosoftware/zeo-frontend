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
import { environment } from '../../environments/environment';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-resignation-request',
  templateUrl: './resignation-request.component.html',
  styleUrl: './resignation-request.component.css'
})

export class ResignationRequestComponent {

   private apiUrl = `${environment.apiBaseUrl}`;


  
      
  private dataSubscription?: Subscription;

  allSelected=false;



  document_date:any='';
  resigned_on:any='' ;
  notice_period:any='' ;

  last_working_date:any='' ;
  location: any = '';
  termination_type: any = '';
  reason_for_leaving: any = '';


    employee:any='';

    Employees:any[]=[];

  
  created_by:any='';

  registerButtonClicked: boolean = false;



  LeaveapprovalLevels: any[] = [];


  DocRequest: any[] = [];

  Users: any[] = [];
  DocType: any[] = [];



      document_number: number | string | null = null;

    automaticNumbering: boolean = false;

    branch: any = '';

     branches:any []=[];

    filteredEmployees: any[] = [];

      attachment: File | null = null;


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

      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

     
      this.LoadUsers(selectedSchema);
      this.LoadLeaveApprovalLevel(selectedSchema);
      this.loadDeparmentBranch();
      this.loademployee();

      this.LoadDocType(selectedSchema);
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

               
                this.hasAddPermission = this.checkGroupPermission('add_employeeresignation', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_employeeresignation', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_employeeresignation', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_employeeresignation', groupPermissions);
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

    loademployee(callback?: Function): void {

  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

  if (selectedSchema) {
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (result: any) => {

        // ✅ keep only active
        this.Employees = result.filter(
          (employee: any) => employee.is_active === true || employee.is_active === null
        );

        // ✅ initialize dropdown correctly
        this.filteredEmployees = this.Employees;

        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Employees:', error);
      }
    );
  }
}

 mapEmployeeNameToId() {

  if (!this.Employees || !this.editAsset?.employee) return;

  const emp = this.Employees.find(
    (e: any) => e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}

 Requests:any[]=[];

 isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.employeeService.getairticketrequestNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.Requests = data;

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
      this.employeeService.getEmpResignationMasterNew(schema, branchIds).subscribe({
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

  // VALIDATION
  if (
    !this.branch ||
    !this.employee ||
    !this.document_date ||
    !this.resigned_on ||
    !this.notice_period ||
    !this.last_working_date ||
    !this.location ||
    !this.termination_type
  ) {
    alert('Please fill all required fields');
    return;
  }

  const formData = new FormData();

  // APPEND DATA
  formData.append('branch', this.branch);

  formData.append('employee', this.employee.toString());

  formData.append('document_number', String(this.document_number ?? ''));

  formData.append('document_date', this.document_date);

  formData.append('resigned_on', this.resigned_on);

  formData.append('notice_period', this.notice_period.toString());

  formData.append('last_working_date', this.last_working_date);

  formData.append('location', this.location);

  formData.append('termination_type', this.termination_type);

  formData.append('reason_for_leaving', this.reason_for_leaving || '');

    if (this.attachment) {
    formData.append('attachment', this.attachment);
  }

  this.leaveService.CreateEmpResignationRequest(formData).subscribe({

    next: (response) => {

      console.log('Registration successful', response);

      alert('Resignation Request has been Sent');

      this.closeapplicationModal();

      window.location.reload();
    },

    error: (error) => {

      console.error('API ERROR:', error);

      let errorMsg = 'Request failed';

      if (error?.error) {

        if (typeof error.error === 'string') {

          errorMsg = error.error;

        } else if (typeof error.error === 'object') {

          errorMsg = Object.keys(error.error)
            .map(key => `${key}: ${error.error[key]}`)
            .join('\n');
        }
      }

      alert(errorMsg);
    }

  });

}

            onFileChange(event: any) {
              const file = event.target.files[0];
              if (file) {
                this.attachment = file;
              }
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
    this.onBranchChange({
      target: { value: this.branch }
    });
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

openEditModal(asset: any): void {

  this.editAsset = JSON.parse(JSON.stringify(asset));

  // ===== PRESELECT BRANCH =====
  this.mapBranchesNameToId();

  // ===== PRESELECT EMPLOYEE =====
  if (this.editAsset.employee) {

    // employee object
    if (typeof this.editAsset.employee === 'object') {

      this.editAsset.employee = this.editAsset.employee.id;
    }

    // employee emp_code/name
    else if (typeof this.editAsset.employee === 'string') {

      const foundEmployee = this.Employees.find(
        (e: any) =>
          e.emp_code === this.editAsset.employee ||
          e.id == this.editAsset.employee
      );

      if (foundEmployee) {
        this.editAsset.employee = foundEmployee.id;
      }
    }
  }

  // ===== PREVIEW ATTACHMENT =====
  if (this.editAsset.attachment) {

    // full url if needed
    if (!this.editAsset.attachment.startsWith('http')) {

      this.editAsset.attachmentUrl =
        `${this.apiUrl}${this.editAsset.attachment}`;
    } else {

      this.editAsset.attachmentUrl =
        this.editAsset.attachment;
    }
  }

  console.log('EDIT ASSET:', this.editAsset);

  this.isEditModalOpen = true;
}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
this.attachment = null;
}


deleteSelectedAssetType() { 
  const selectedEmployeeIds = this.DocRequest
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Resignation Request selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Resignation Request ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteResignationReq(categoryId).subscribe(
        () => {
          console.log(' Request deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.DocRequest = this.DocRequest.filter(employee => employee.id !== categoryId);
             completed++;
               if (completed === total) {
          alert(' Request  deleted successfully');
          window.location.reload();
               }

        },
        (error) => {
          console.error('Error deleting Resignation Request:', error);
            alert('Error deleting Resignation Request:' + error.statusText);

        }
      );
    });
  }
}

updateAssetType(): void {

  if (!this.editAsset.id) {
    alert('Missing Request ID');
    return;
  }

  const formData = new FormData();

  formData.append(
    'document_number',
    this.editAsset.document_number || ''
  );

  formData.append(
    'document_date',
    this.editAsset.document_date || ''
  );

  formData.append(
    'resigned_on',
    this.editAsset.resigned_on || ''
  );

  formData.append(
    'notice_period',
    String(this.editAsset.notice_period || '')
  );

  formData.append(
    'last_working_date',
    this.editAsset.last_working_date || ''
  );

  formData.append(
    'location',
    this.editAsset.location || ''
  );

  formData.append(
    'termination_type',
    this.editAsset.termination_type || ''
  );

  formData.append(
    'reason_for_leaving',
    this.editAsset.reason_for_leaving || ''
  );

  formData.append(
    'employee',
    String(this.editAsset.employee || '')
  );

  formData.append(
    'branch',
    String(this.editAsset.branch || '')
  );

  // FILE
  if (this.attachment instanceof File) {
    formData.append('attachment', this.attachment);
  }

  console.log('FORMDATA VALUES');

  formData.forEach((value, key) => {
    console.log(key, value);
  });

  this.employeeService
    .updateResignationReq(this.editAsset.id, formData)
    .subscribe({

      next: (response) => {

        console.log('UPDATED:', response);

        alert('Request updated successfully');

        this.closeEditModal();

        window.location.reload();
      },

      error: (error) => {

        console.error('UPDATE ERROR:', error);

        console.log(error.error);

        alert('Update failed');
      }
    });
}


    employeeSearch: string = '';
allEmployeesSelected: boolean = false;

toggleAllEmployees() {

  if (this.allEmployeesSelected) {

    this.employee = this.Employees.map((emp: any) => emp.id);

  } else {

    this.employee = [];

  }

}

filterEmployees() {

  if (!this.employeeSearch) {
    return this.Employees;
  }

  return this.Employees.filter((emp: any) =>
    emp.emp_code.toLowerCase().includes(this.employeeSearch.toLowerCase())
  );

}


filterEmployeeList() {
  if (!this.employeeSearch) {
    this.filteredEmployees = this.Employees;
  } else {
    this.filteredEmployees = this.Employees.filter((emp: any) =>
      emp.emp_code.toLowerCase().includes(this.employeeSearch.toLowerCase())
    );
  }
}
  


  selectedEmployee: number | null = null;

onEmployeeChange() {
  if (this.selectedEmployee) {
    this.employee = [this.selectedEmployee]; // ✅ store selected employee ID
  } else {
    this.employee = [];
  }

  console.log('Selected Employee:', this.employee);
}

onBranchChange(event: any): void {

  const selectedBranchId = event.target.value;
  const selectedSchema = localStorage.getItem('selectedSchema');

  this.branch = selectedBranchId;

  /* ------------------ FILTER EMPLOYEES ------------------ */
  if (!selectedBranchId) {
    this.filteredEmployees = this.Employees;
    this.employee = '';
  } else {

    const selectedBranch = this.branches.find(
      b => Number(b.id) === Number(selectedBranchId)
    );

    if (selectedBranch) {
      this.filteredEmployees = this.Employees.filter(emp =>
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

  const type = 'employee_resignation'; // ✅ FIXED

  const apiUrl =
    `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;

  this.http.get<any>(apiUrl).subscribe({
    next: (response) => {

      const data = Array.isArray(response) && response.length > 0
        ? response[0]
        : response;

      this.automaticNumbering = !!data?.automatic_numbering;
      this.document_number = this.automaticNumbering ? null : '';
    },
    error: () => {
      this.automaticNumbering = false;
      this.document_number = '';
    }
  });
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

}