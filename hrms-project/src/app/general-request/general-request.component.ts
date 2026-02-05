import { Component, ElementRef, ViewChild } from '@angular/core';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { environment } from '../../environments/environment';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';

@Component({
  selector: 'app-general-request',
  templateUrl: './general-request.component.html',
  styleUrl: './general-request.component.css'
})
export class GeneralRequestComponent {

  @ViewChild('requestDocInput') requestDocInput!: ElementRef;

  selectedRequestFile!: File | null;

  triggerRequestDocInput() {
  this.requestDocInput.nativeElement.click();
}

onRequestDocSelected(event: any): void {
  this.selectedRequestFile = event.target.files.length > 0 ? event.target.files[0] : null;

  if (this.selectedRequestFile) {
    this.editAsset.request_document = this.selectedRequestFile;  
  }
}

getFileName(fileUrl: string): string {
  return fileUrl.split('/').pop() || 'Existing File';
}



  
document_number: number | string | null = null;

  reason: any = '';
  total: any = '';
  branch: any = '';
  request_type: any = '';
  employee: any = '';
  created_by: any = '';
  approved:  boolean = false;


  automaticNumbering: boolean = false;

  remarks: string = '';
  request_document: File | null = null;




  
  branches:any []=[];
  RequestType:any []=[];
  employees:any []=[];
  Users:any []=[];
  GeneralReq:any []=[];


  schemas: string[] = []; // Array to store schema names

  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;



  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;


  registerButtonClicked = false;

  // private apiUrl = 'http://one.localhost:8000/organisation/api/fiscal-years/';
  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  constructor(private DepartmentServiceService: DepartmentServiceService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private sessionService: SessionService,
    private DesignationService: DesignationService,


    


) {}

ngOnInit(): void {
  this.loadDeparmentBranch();
  this.loadRequestType();
  this.loadEmp();
  this.loadUsers();
  this.loadgeneralReq();

  this.userId = this.sessionService.getUserId();

  // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadDeparmentBranch(); 
    this.loadEmp();
  });
  
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
  
                  this.hasAddPermission = this.checkGroupPermission('add_generalrequest', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_generalrequest', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
                  this.hasEditPermission = this.checkGroupPermission('change_generalrequest', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
  
                  this.hasViewPermission = this.checkGroupPermission('view_generalrequest', groupPermissions);
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

    this.authService.getUserSchema(this.userId).subscribe(
      (userData: any) => {
        this.userDetailss = userData; // Store user schemas in userDetailss

        this.schemas = userData.map((schema: any) => schema.schema_name);
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
//   const requiredPermission = 'add_generalrequest' ||'change_generalrequest' ||'delete_generalrequest' ||'view_generalrequest';
  

//   // Check user permissions
//   if (permissions.some(permission => permission.codename === requiredPermission)) {
//     return true;
//   }

//   // Check group permissions (if applicable)
//   // Replace `// TODO: Implement group permission check`
//   // with your logic to retrieve and check group permissions
//   // (consider using a separate service or approach)
//   return false; // Replace with actual group permission check
// }




checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
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
allSelected: boolean = false;

toggleCheckboxes() {
this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
  this.allSelected = !this.allSelected;
this.GeneralReq.forEach(employee => employee.selected = this.allSelected);

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

// Map employee name → ID
  this.mapEmployeeNameToId();
  this.mapBranchesNameToId();
  this.mapRequestTypeNameToId();

}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedGeneralReq() { 
  const selectedEmployeeIds = this.GeneralReq
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No General Request selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected General Request?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteGeneralReq(categoryId).subscribe(
        () => {
          console.log('Asset type deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.GeneralReq = this.GeneralReq.filter(emp => emp.id !== categoryId);

            completed++;


            if (completed === total) {
          alert(' General Request deleted successfully');
          window.location.reload();
            }

        },
        (error) => {
          console.error('Error deleting General Request:', error);
         alert('Error deleting General Request: ' + error.statusText);
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

  const formData = new FormData();

  // Required fields
  formData.append('employee', this.editAsset.employee || '');
  formData.append('reason', this.editAsset.reason || '');
  formData.append('request_type', this.editAsset.request_type || '');
  formData.append('branch', this.editAsset.branch || '');

  // Optional fields
  formData.append('document_number', this.editAsset.document_number || '');
  formData.append('total', this.editAsset.total?.toString() || '');
  formData.append('remarks', this.editAsset.remarks || '');

  // File field
  if (this.selectedRequestFile) {
    formData.append('request_document', this.selectedRequestFile);
  }

  this.employeeService.updateGeneralReq(this.editAsset.id, formData)
    .subscribe(
      (response) => {
        alert('General Request updated successfully!');
        this.closeEditModal();
        this.loadgeneralReq();
      },
      (error) => {
        console.error('Error updating General Request:', error);

        let errorMsg = 'Update failed';
        const backendError = error?.error;

        if (backendError && typeof backendError === 'object') {
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
      const selectedSchema = localStorage.getItem('selectedSchema'); // Retrieve the selected schema from local storage or any other storage method
  
      if (selectedBranchId && selectedSchema) {
        const apiUrl = `${this.apiUrl}/employee/api/general-request/document_numbering_by_branch/?branch_id=${selectedBranchId}&schema=${selectedSchema}`;
        this.http.get(apiUrl).subscribe(
          (response: any) => {
            this.automaticNumbering = response.automatic_numbering;
            if (this.automaticNumbering) {
              this.document_number = null; // Clear the document number field if automatic numbering is enabled
            }
          },
          (error) => {
            console.error('Error fetching branch details:', error);
          }
        );
      }
    }
  


    loadRequestType(callback?: Function): void {
    
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.DepartmentServiceService.getReqType(selectedSchema).subscribe(
          (result: any) => {
            this.RequestType = result;
            console.log(' fetching Companies:');

             if (callback) callback();
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }

  mapRequestTypeNameToId() {
  if (!this.RequestType || !this.editAsset?.request_type) return;

  const req = this.RequestType.find(
    (r: any) => r.name === this.editAsset.request_type
  );

  if (req) {
    this.editAsset.request_type = req.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.request_type);
}


loadEmp(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (result: any) => {
        this.employees = result;
        
        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
}

        mapEmployeeNameToId() {
  if (!this.employees || !this.editAsset?.employee) return;

  const emp = this.employees.find(
    (e: any) => e.emp_first_name === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}

        onEmployeeChange(event: any): void {
          const selectedEmployeeId = event.target.value;
          if (selectedEmployeeId) {
              // Fetch employee details including branch_id
              this.employeeService.getEmployeeDetails(selectedEmployeeId).subscribe(
                  (employee: any) => {
                    
                      this.branch = employee.emp_branch_id; // Update branch dropdown with employee's branch
                      console.log('Selected employee branch:', this.branch); // Log selected employee's branch

                  
                    },
                    (error:HttpErrorResponse) => {

                      if (error.status === 401) {
                        // Unauthorized error, typically used for wrong credentials
                        alert('Enter all fileds correctly.');
                      } else {
                        // General error message
                        const errorMessage = error.error?.detail || 'Enter all fields';
                        alert(`Creating error: ${errorMessage}`);
                      }
                         

                      // console.error('Error fetching employee details:', error);
                  }
              );
          }
      }

        loadUsers(): void {
    
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.userService.getSChemaUsers(selectedSchema).subscribe(
              (result: any) => {
                this.Users = result;
                console.log(' fetching Companies:');
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }


registerGeneralreq(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();

  formData.append('document_number', this.document_number?.toString() || '');
  formData.append('reason', this.reason || '');
  formData.append('total', this.total?.toString() || '');
  formData.append('request_type', this.request_type || '');
  formData.append('employee', this.employee || '');
  formData.append('branch', this.branch || '');
  formData.append('created_by', this.created_by || '');
  formData.append('approved', this.approved ? 'true' : 'false');
  formData.append('remarks', this.remarks || '');

  if (this.request_document) {
    formData.append('request_document', this.request_document);
  }

  this.employeeService.registerGeneralReq(formData).subscribe(
    (response) => {
      alert('General request has been added successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('General request registration failed:', error);

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
        // Handle general error message like { "detail": "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Registration failed!\n\n${errorMessage}`);
    }
  );
}

          

selectedSalaryComponent: string | null = null;

onRequestTypeChange(event: any): void {
  const selectedId = +event.target.value;
  const selectedReq = this.RequestType.find((r: any) => r.id === selectedId);

  if (selectedReq) {
    this.selectedSalaryComponent = selectedReq.salary_component;
    console.log('Selected salary_component:', this.selectedSalaryComponent);
  } else {
    this.selectedSalaryComponent = null;
  }
}


          loadgeneralReq(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.employeeService.getAllgeneralRequest(selectedSchema).subscribe(
                (result: any) => {
                  this.GeneralReq = result;
                  console.log(' fetching  general Request: ', result);
          
                },
                (error) => {
                  console.error('Error fetching general Request:', error);
                }
              );
            }
            }
    
   
            
            onFileChange(event: any) {
              const file = event.target.files[0];
              if (file) {
                this.request_document = file;
              }
            }
          
  

}


  