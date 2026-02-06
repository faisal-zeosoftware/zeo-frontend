import { Component,OnInit, ElementRef, Renderer2, ViewChild,  EventEmitter, Output } from '@angular/core';
import { CountryService } from '../country.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialogModule } from '@angular/material/dialog';
import { CompanySelectionComponent } from '../company-selection/company-selection.component';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeService } from './employee.service'; 
import { DesignationCreationComponent } from '../designation-creation/designation-creation.component';
import { Router } from '@angular/router';
import { CreateEmployeeComponent } from '../create-employee/create-employee.component';
import { ChangeDetectorRef } from '@angular/core';
import { EmployeeEditComponent } from '../employee-edit/employee-edit.component';
import { SessionService } from '../login/session.service';
import { IdleService } from '../idle.service';
import { environment } from '../../environments/environment';
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-master',
  templateUrl: './employee-master.component.html',
  styleUrl: './employee-master.component.css'
})
export class EmployeeMasterComponent {


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local



  // employeesec: any[] = [];
  Employees: any[] = [];
  // selectedDepartment: any;
  emp_first_name: string = '';
  emp_last_name:string = '';
  id:string = '';
  emp_desgntn_id:string = '';
  isEssUser: boolean | undefined;

  hasAddPermission: boolean = true;
  hasDeletePermission: boolean = true;
  hasViewPermission: boolean =true;
  hasEditPermission: boolean = true;

  userId: number | null | undefined;
  userDetails: any;
  selectedSchema: string | null = null;
  username: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  employees: any[] = [];
  branches: any[] = [];
  departments: any[] = [];

  Designations: any[] = [];

  selectedBranches: string[] = []; // store selected branch names

  filteredEmployees: any[] = [];
  searchQuery: string = '';
  searchType: string = 'name';  // Default search type
  showSearchOptions: boolean = false;  // Flag to toggle search options visibility
  serSubSec: boolean = true;  // Flag to toggle search options visibility

  searchPlaceholder: string = 'Search Employees'; // Default placeholder
  file: any;

  private branchSub: Subscription | undefined;

  constructor(private EmployeeService:EmployeeService,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private dialog:MatDialog,
    private renderer: Renderer2,
    private router: Router,
       ) {
     
    }


    Delete: boolean = false;
    allSelected: boolean = false;



    hideButton = false;

    isAllSelected(): boolean {
      return this.selectedBranches.length === this.branches.length;
    }
    
    toggleAllBranches(): void {
      if (this.isAllSelected()) {
        // Unselect all
        this.selectedBranches = [];
      } else {
        // Select all
        this.selectedBranches = this.branches.map(b => b.branch_name);
      }
      this.filterByBranches();
    }
    
    onBranchSelectionChange(): void {
      // Remove "all" value if Angular accidentally adds it
      this.selectedBranches = this.selectedBranches.filter(v => v !== 'all');
      this.filterByBranches();
    }


    filterByBranches(): void {
      if (this.selectedBranches.length === 0) {
        this.filteredEmployees = this.employees; // Show all
      } else {
        this.filteredEmployees = this.employees.filter(emp =>
          this.selectedBranches.includes(emp.emp_branch_id)
        );
      }
    }
  toggleCheckboxes() {
    this.Delete = !this.Delete;
  }

  toggleSelectAllEmployees() {
    this.allSelected = !this.allSelected;
    this.filteredEmployees.forEach(employee => employee.selected = this.allSelected);
  }

  onCheckboxChange(employee:number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }

  deleteSelectedEmployees() { 
    const selectedEmployeeIds = this.filteredEmployees
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No employees selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected employees?')) {
      selectedEmployeeIds.forEach(employeeId => {
        this.EmployeeService.deleteEmployee(employeeId).subscribe(
          () => {
            console.log('Employee deleted successfully:', employeeId);
            // Remove the deleted employee from the local list
            this.filteredEmployees = this.filteredEmployees.filter(employee => employee.id !== employeeId);
            window.location.reload();
          },
          (error) => {
            console.error('Error deleting employee:', error);
          }
        );
      });
    }
  }
  private dataSubscription?: Subscription;

  selectedBranchIds: number[] = [];

    ngOnInit(): void {


      // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);
      }
    });
   
      this.loadbranches();
      this.loadDepartments();
      this.loadDesignations();

 // Get the selected schema
 const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

 console.log('schemastore',selectedSchema )



  
  if (selectedSchema) {
    // LISTEN for changes from the Sidebar
    this.branchSub = this.EmployeeService.selectedBranches$.subscribe((ids) => {
      console.log('Sidebar selection changed! Fetching new data for branches:', ids);
      // this.fetchDesignations(selectedSchema);
    });
  }

 
 // Check if selectedSchema is available
 if (selectedSchema) {
   // Construct the API URL with the selected schema
  //  const apiUrl = `http://${selectedSchema}.localhost:8000/employee/api/Employee/`;
  const selectedBranchId = localStorage.getItem('selectedBranchId');
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  this.selectedBranchIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
   // Fetch employees from the API
   this.EmployeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
     (data: any) => {
       this.employees = data;
       console.log('All Employees:' ,this.employees)
     },
     (error: any) => {
       console.error('Error fetching employees:', error);
     }
   );
 } else {
   console.error('No schema selected.');
 }
      
      
   // Extract schema name from the URL
  //  const urlParts = window.location.href.split('.');
  //  if (urlParts.length >= 2) {
  //    this.selectedSchema = urlParts[0].replace('http://', '');
  //    console.log(urlParts)
  //  } else {
  //    console.error("No schema selected.");
  //  }

      
      this.hideButton = this.EmployeeService.getHideButton();
      
      // this.loadEmployee();

   
  // Retrieve user ID
this.userId = this.sessionService.getUserId();

// Fetch user details using the obtained user ID
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property
      console.log('User ID:', this.userId); // Log user ID
      console.log('User Details:', this.userDetails); // Log user details

      this.username = this.userDetails.username;
      // Check if user is_superuser is true or false
      let isSuperuser = this.userDetails.is_superuser || false;
      const isEssUser = this.userDetails.is_ess || false; // Default to false if is_superuser is undefined
      const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema) {
    console.error('No schema selected.');
    return;
  }

      if (isSuperuser || isEssUser) {
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
            const permissionsData: any = await this.EmployeeService.getDesignationsPermission(selectedSchema).toPromise();
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

                  this.hasViewPermission = this.checkGroupPermission('view_emp_master', groupPermissions);
             console.log('Has view permission:', this.hasViewPermission);
        
               this.hasAddPermission = this.checkGroupPermission('add_emp_master', groupPermissions);
              console.log('Has add permission:', this.hasAddPermission);
        
             this.hasDeletePermission = this.checkGroupPermission('delete_emp_master', groupPermissions);
          console.log('Has delete permission:', this.hasDeletePermission);
        
              this.hasEditPermission = this.checkGroupPermission('change_emp_master', groupPermissions);
             console.log('Has edit permission:', this.hasEditPermission);
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

        

        // // Extract group permissions from user details
        // const groupPermissions = this.userDetails.groups.map((group: { permissions: any; }) => group.permissions).flat();
        // console.log('Group Permissions:', groupPermissions);

        // // Check permissions for various actions
        // this.hasViewPermission = this.checkGroupPermission('view_dept_master', groupPermissions);
        // console.log('Has View Permission:', this.hasViewPermission);

        // this.hasAddPermission = this.checkGroupPermission('add_dept_master', groupPermissions);
        // console.log('Has Add Permission:', this.hasAddPermission);

        // this.hasDeletePermission = this.checkGroupPermission('delete_dept_master', groupPermissions);
        // console.log('Has Delete Permission:', this.hasDeletePermission);

        // this.hasEditPermission = this.checkGroupPermission('change_dept_master', groupPermissions);
        // console.log('Has Edit Permission:', this.hasEditPermission);
      }
    },
    (error) => {
      console.error('Failed to fetch user details:', error);
    }
  );

  this.authService.getUserSchema(this.userId).subscribe(
    (userData:any)=>{
      this.userDetailss=userData;
      console.log('Schema :',this.userDetailss);
         // Extract schema names from userData and add them to the schemas array
    this.schemas = userData.map((schema: any) => schema.schema_name);

    }
    

  );
} else {
  console.error('User ID is null.');
}

    
     
    }


    // ALWAYS unsubscribe to prevent memory leaks
ngOnDestroy(): void {
  if (this.branchSub) {
    this.branchSub.unsubscribe();
  }
}


    

   checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

   
  // fetchDesignations(selectedSchema: string) {
  //   this.EmployeeService.getemployees(selectedSchema).subscribe(
  //     (data: any) => {
  //       this.employees = data;
  //       this.filteredEmployees = this.employees;
  //       console.log('employee:', this.employees);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching categories:', error);
  //     }
  //   );
  // }

  isLoading: boolean = false;

  // fetchDesignations(selectedSchema: string) {
  //   this.isLoading = true;
  //   // It pulls the freshest IDs you just saved
  //   const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    
  //   this.EmployeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
  //     (data: any) => {
  //       this.employees = data.filter((e: any) => e.is_active !== false);
  //       this.filteredEmployees = this.employees;
  //       this.isLoading = false;
  //     },
  //     (error: any) => { this.isLoading = false; }
  //   );
  // }

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.EmployeeService.getemployeesMasterNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.employees = data.filter((emp: any) => emp.is_active !== false);
        this.filteredEmployees = [...this.employees];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }


isTableView = false; // default grid view

toggleView() {
  this.isTableView = !this.isTableView;
}


  toggleSearchOptions(): void {
    this.showSearchOptions = !this.showSearchOptions;
  }

  filterEmployees(): void {
    // this.showSearchOptions = false;
    this.showSearchOptions = !this.showSearchOptions;

    const query = this.searchQuery.toLowerCase();

    if (this.searchType === 'name') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.emp_first_name.toLowerCase().includes(query) ||
        employee.emp_last_name.toLowerCase().includes(query)
      );
    } else if (this.searchType === 'code') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.emp_code.toLowerCase().includes(query)
      );
    } else if (this.searchType === 'Designation') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.emp_desgntn_id.toLowerCase().includes(query)
      );
    } else if (this.searchType === 'Branch') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.emp_branch_id.toLowerCase().includes(query)
      );
    } else if (this.searchType === 'Department') {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.emp_dept_id.toLowerCase().includes(query)
      );
    }
  }

  filterEmployee(): void {
    this.showSearchOptions = !this.showSearchOptions;

  }

    onSearchTypeChange(): void {
      // this.serSubSec = !this.serSubSec;

      switch (this.searchType) {
        case 'name':
          this.searchPlaceholder = 'Search by Name';
          break;
        case 'code':
          this.searchPlaceholder = 'Search by Code';
          break;
        case 'Branch':
          this.searchPlaceholder = 'Search by Branch';
          break;
        case 'Department':
          this.searchPlaceholder = 'Search by Department';
          break;
        case 'Designation':
          this.searchPlaceholder = 'Search by Designation';
          break;
        default:
          this.searchPlaceholder = 'Search Employees';
          break;
      }
    // this.serSubSec = false;
    this.filterEmployees();  // Optionally, you can filter employees immediately after selecting the search type
  }
  
        
// checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
//   return groupPermissions.some(permission => permission.codename === codeName);
// }
 

    loadEmployee(): void {
      this.EmployeeService.getEmployee().subscribe(
        (result: any) => {
          this.Employees = result;
          console.log(' fetching employees:');
  
        },
        (error) => {
          console.error('Error fetching employees:', error);
        }
      );
    }

    onDeleteEmployee(employeeId: number): void {
      if (confirm('Are you sure you want to delete this employee?')) {
          this.EmployeeService.deleteEmployee(employeeId).subscribe(
              () => {
                  console.log('Employee deleted successfully');
                  // Refresh the employee list after deletion
                  const selectedSchema = this.authService.getSelectedSchema();
                  if (!selectedSchema) {
                    console.error('No schema selected.');
                    return;
                  }
                  // this.fetchDesignations(selectedSchema);
                  window.location.reload();
              },
              (error) => {
                  console.error('Error deleting employee:', error);
              }
          );
      }
  }


    
    showEmployeeDetails(employeeId: number): void {
      
      this.EmployeeService.getEmployeeDetails(employeeId).subscribe(
        (details) => {
          // Navigate to the employee details page with the retrieved details
          this.router.navigate(['/main-sidebar/sub-sidebar/employee-details', employeeId, 'details'], { state: { details } });
        },
        (error) => {
          console.error('Failed to fetch employee details', error);
        }
      );
    }


    

    
    openPopus(){
      this.dialog.open(CreateEmployeeComponent,{
        width:'80%',
        height:'500px',
      })
    }

    openEditEmpPopuss(employeeId: number):void{
      const dialogRef = this.dialog.open(EmployeeEditComponent, {
        width:'80%',
        height:'500px',
        data: { employeeId: employeeId }
        
      });
  
      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }


    showEditBtn: boolean = false;

    EditShowButtons() {
      this.showEditBtn = !this.showEditBtn;
      
    }

 isBulkuploadEmployeeModalOpen :boolean=false;


OpenBulkuploadModal():void{
  this.isBulkuploadEmployeeModalOpen = true;
}


closeBulkuploadModal():void{
  this.isBulkuploadEmployeeModalOpen = false;

}
    // handleImageError(event: any): void {
    //   console.error('Error loading image:', event);
    // }


    emp_code:any='';
    temp_emp_code: string | null = null;
  
  
    emp_gender:any ='';
  
    emp_date_of_birth:any ='';
    emp_personal_email:any ='';
    emp_company_email:any ='';
  
    emp_mobile_number_1:any ='';
    emp_mobile_number_2:any ='';
    emp_city:any ='';
  
    emp_permenent_address:any ='';
    emp_present_address:any ='';
    emp_relegion:any ='';
    emp_blood_group:any ='';
    emp_nationality:any ='';
    emp_marital_status:any ='';
    emp_father_name:any ='';
    emp_mother_name:any ='';
    emp_posting_location:any ='';
  
    emp_country_id:any='';
    countryService: any='';
    emp_state_id:any='';
    emp_company_id:any='';
    emp_branch_id:any='';
    emp_dept_id:any='';
    emp_ctgry_id:any='';
    emp_languages: any='';
    emp_date_of_confirmation:any='';
    emp_joined_date:any=''; 
    emp_profile_pic: string | undefined;
  
    is_ess: boolean = false;
  
    emp_status: boolean = false;

    selectedFile!: File | null;
    
bulkuploaddocument(): void {

  const formData = new FormData();

  if (this.file) {
    formData.append('file', this.file);
  } else {
    formData.append('file', '');
  }

  formData.append('emp_code', this.emp_code);
  formData.append('emp_first_name', this.emp_first_name);
  formData.append('emp_last_name', this.emp_last_name);
  formData.append('emp_gender', this.emp_gender);
  formData.append('emp_date_of_birth', this.emp_date_of_birth);
  formData.append('emp_personal_email', this.emp_personal_email);
  formData.append('emp_mobile_number_1', this.emp_mobile_number_1);
  formData.append('emp_mobile_number_2', this.emp_mobile_number_2);
  formData.append('emp_city', this.emp_city);
  formData.append('emp_permenent_address', this.emp_permenent_address);
  formData.append('emp_present_address', this.emp_present_address);
  formData.append('emp_relegion', this.emp_relegion);
  formData.append('emp_blood_group', this.emp_blood_group);
  formData.append('emp_nationality', this.emp_nationality);
  formData.append('emp_marital_status', this.emp_marital_status);
  formData.append('emp_father_name', this.emp_father_name);
  formData.append('emp_mother_name', this.emp_mother_name);
  formData.append('emp_posting_location', this.emp_posting_location);
  formData.append('emp_country_id', this.emp_country_id);
  formData.append('emp_state_id', this.emp_state_id);
  formData.append('emp_company_id', this.emp_company_id);
  formData.append('emp_branch_id', this.emp_branch_id);
  formData.append('emp_dept_id', this.emp_dept_id);
  formData.append('emp_desgntn_id', this.emp_desgntn_id);
  formData.append('emp_ctgry_id', this.emp_ctgry_id);
  formData.append('emp_languages', this.emp_languages);
  formData.append('emp_date_of_confirmation', this.emp_date_of_confirmation);
  formData.append('emp_joined_date', this.emp_joined_date);
  formData.append('is_ess', this.is_ess ? '1' : '0');
  formData.append('emp_status', this.emp_status ? '1' : '0');

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return;
  }

  /** 🔥 START LOADER */
  this.isLoading = true;

  this.http
    .post(`${this.apiUrl}/employee/api/emp-bulkupload/bulk_upload/?schema=${selectedSchema}`, formData)
    .subscribe(
      (response) => {
        /** ✅ STOP LOADER */
        this.isLoading = false;

        console.log('Bulk upload successful', response);
        alert('Bulk upload successful');
        window.location.reload();
      },
      (error: HttpErrorResponse) => {
        /** ❌ STOP LOADER EVEN ON ERROR */
        this.isLoading = false;

        console.error('Upload error:', error);

        if (error.error) {
          const errors = error.error.errors || error.error;

          if (typeof errors === 'string') {
            alert(errors);
            return;
          }

          const allMessages: string[] = [];

          Object.keys(errors).forEach((sheetKey) => {
            const sheetErrors = errors[sheetKey];
            if (Array.isArray(sheetErrors) && sheetErrors.length > 0) {
              allMessages.push(`\n🔹 ${sheetKey.replace('_', ' ').toUpperCase()}:\n`);
              sheetErrors.forEach((errObj: any) => {
                if (errObj.error) {
                  try {
                    const parsedErrors = JSON.parse(errObj.error);
                    if (Array.isArray(parsedErrors)) {
                      allMessages.push(`Row ${errObj.row}:`);
                      parsedErrors.forEach((msg) => {
                        allMessages.push(`   - ${msg}`);
                      });
                    } else {
                      allMessages.push(`Row ${errObj.row}: ${parsedErrors}`);
                    }
                  } catch {
                    allMessages.push(`Row ${errObj.row}: ${errObj.error}`);
                  }
                }
              });
            }
          });

          if (allMessages.length > 0) {
            alert(allMessages.join('\n'));
          } else {
            alert('An unexpected error occurred.');
          }
        } else {
          alert('Something went wrong.');
        }
      }
    );
}

    
  
  
    onChangeFile(event: any) {
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          const formData = new FormData();
          formData.append('file', file);
    
          const selectedSchema = localStorage.getItem('selectedSchema');
          if (!selectedSchema) {
            console.error('No schema selected.');
            alert('No schema selected. Please select a schema.');
            return;
          }
    
          const url = `${this.apiUrl}/employee/api/emp-bulkupload/bulk_upload/?schema=${selectedSchema}`;
          console.log('Uploading to URL:', url);
          
          this.http.post(url, formData).subscribe(
            (res: any) => {
              console.log('Upload successful:', res);
            },
            (error: any) => {
              console.error('Upload error:', error);
              alert('Upload failed. Please check the console for details.');
            }
          );
        } else {
          alert("Please select a valid Excel file");
        }
      }
    }
    
    onFileSelected(event: any): void {
      this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
    }
    onFileSelect(event: any) {
      if (event.target.files.length > 0) {
        this.file = event.target.files[0];
      }
    }
    

    downloadEmployeeCsv(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;
    
      this.companyRegistrationService.downloadEmployeeCsv(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }
    

    
    downloadEmployeeExcel(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;
    
      this.companyRegistrationService.downloadEmployeeExcel(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }
    
    showUploadForm: boolean = false;

toggleUploadForm(): void {
  this.showUploadForm = !this.showUploadForm;
}


closeUploadForm(): void {
  this.showUploadForm = false;
}
    


    loadbranches(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
      console.log('schemastore', selectedSchema)
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.companyRegistrationService.getBranchesList(selectedSchema).subscribe(
          (result: any) => {
            this.branches = result;
          },
          (error: any) => {
            console.error('Error fetching countries:', error);
          }
        );
      }
    }


    
  loadDepartments(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {

      this.companyRegistrationService.getDepartmentsList(selectedSchema).subscribe(
        (result: any) => {
          this.departments = result;
        },
        (error: any) => {
          console.error('Error fetching countries:', error);
        }
      );
    }
  }


      
  loadDesignations(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {

      this.companyRegistrationService.getDesignationList(selectedSchema).subscribe(
        (result: any) => {
          this.Designations = result;
        },
        (error: any) => {
          console.error('Error fetching countries:', error);
        }
      );
    }
  }


  selectedDepartment: string[] = []; // store selected branch names


  
  isAllSelectedDepartment(): boolean {
    return this.selectedDepartment.length === this.departments.length;
  }
  
  toggleAllDepartment(): void {
    if (this.isAllSelectedDepartment()) {
      // Unselect all
      this.selectedDepartment = [];
    } else {
      // Select all
      this.selectedDepartment = this.departments.map(b => b.dept_name);
    }
    this.filterByDepartment();
  }
  
  onDepartmentSelectionChange(): void {
    // Remove "all" value if Angular accidentally adds it
    this.selectedDepartment = this.selectedDepartment.filter(v => v !== 'all');
    this.filterByDepartment();
  }


  filterByDepartment(): void {
    if (this.selectedDepartment.length === 0) {
      this.filteredEmployees = this.employees; // Show all
    } else {
      this.filteredEmployees = this.employees.filter(emp =>
        this.selectedDepartment.includes(emp.emp_dept_id)
      );
    }
  }

  



  
  selectedDesignations: string[] = []; // store selected branch names


  
  isAllSelectedDesignations(): boolean {
    return this.selectedDesignations.length === this.Designations.length;
  }
  
  toggleAllDesignations(): void {
    if (this.isAllSelectedDesignations()) {
      // Unselect all
      this.selectedDesignations = [];
    } else {
      // Select all
      this.selectedDesignations = this.Designations.map(b => b.desgntn_job_title);
    }
    this.filterByDesignations();
  }
  
  onDesignationsSelectionChange(): void {
    // Remove "all" value if Angular accidentally adds it
    this.selectedDesignations = this.selectedDesignations.filter(v => v !== 'all');
    this.filterByDesignations();
  }


  filterByDesignations(): void {
    if (this.selectedDesignations.length === 0) {
      this.filteredEmployees = this.employees; // Show all
    } else {
      this.filteredEmployees = this.employees.filter(emp =>
        this.selectedDesignations.includes(emp.emp_desgntn_id)
      );
    }
  }

  

}
