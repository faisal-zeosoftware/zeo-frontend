import { Component, ViewChild , OnDestroy, OnInit } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { DepartmentService } from '../department-report/department.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import {combineLatest, Subscription, Observable, forkJoin } from 'rxjs';
import { CompanyRegistrationService } from '../company-registration.service';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.css'
})
export class EmployeeSalaryComponent implements OnInit, OnDestroy {

  private apiUrl = `${environment.apiBaseUrl}`;
  
  
  private dataSubscription?: Subscription;




overtimepol:any []=[];
Policyget:any []=[];


working_days:any='';
salary_calculation_type:any='';
fixed_working_days:any='';
attendance_cycle_type:any='';
cycle_start_day:any='';
cycle_end_day:any='';
payday_type:any='';
payday:any='';
payroll_start_month:any='';
branch:any='';


      
       policy:any='';
       order:any='';
       is_active:  boolean = false;

       rule_type:any='';
       base_type:any='';
       threshold_hours:any='';
       is_extended:  boolean = false;

    Users:any []=[];


selectedFile!: File | null;

   selectedFiles! : File;
  file:any ='';

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;
hasImportPermission:boolean = false;


  Branchs:any []=[];


  Employee: any[] = [];


  allSelectedbR=false;
  allSelectedBrach=false;
  allSelecteddept=false;
  allSelectedcat=false;
  allSelectedEmp=false;
  allSelecteddes=false;


    @ViewChild('select') select: MatSelect | undefined;
    @ViewChild('selectDept') selectDept: MatSelect | undefined;
    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;
    @ViewChild('selectCat') selectCat: MatSelect | undefined;
    @ViewChild('selectEmp') selectEmp: MatSelect | undefined;
    @ViewChild('selectDes') selectDes: MatSelect | undefined;


// Add these properties inside your class declaration:
currentSchema: string = '';
currentBranchIds: number[] = [];
  

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names
  
  constructor(
    private leaveservice: LeaveService, 
    private authService: AuthenticationService,
    
    private userService: UserMasterService,

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
private employeeService: EmployeeService,
private DepartmentServiceService:DepartmentServiceService,
 private companyRegistrationService: CompanyRegistrationService, 
   private categoryService: CatogaryService,

  ) {}

  ngOnInit(): void {

    
 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.employeeService.selectedSchema$,
  this.employeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {

    // Save to component properties so saveTableChanges can re-use them
    this.currentSchema = schema;
    this.currentBranchIds = branchIds || [];


    this.fetchsalaryComp(schema, branchIds);  
    this.fetchEmployeesSalary(schema, branchIds);  
    this.loadComponentMetadata(schema);


  }
});

 // Listen for sidebar changes so the dropdown updates instantly
 this.employeeService.selectedBranches$.subscribe(ids => {
this.loadEmp();

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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_employeesalarystructure', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_employeesalarystructure', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_employeesalarystructure', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_employeesalarystructure', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);

                    this.hasImportPermission = this.checkGroupPermission('import_salarycomponent', groupPermissions);
                    console.log('Has view permission:', this.hasImportPermission);
    
    
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
  }
}



ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }


  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  
  registerButtonClicked = false;


  amount:any='';
  employee:any='';
  component:any='';

  showAmountField: boolean = false;


CreatePayStructure(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();
  // ✅ EXACT backend field names

  formData.append('amount', this.amount);
  formData.append('employee', this.employee);
  formData.append('component', this.component);
  formData.append('is_active', (this.is_active ?? false).toString());




  


  this.leaveservice.registerEmpSalary(formData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Employee salary has been added');
        // window.location.reload();
    },
    (error) => {
      console.error('Added failed', error);

      let errorMessage = 'Enter all required fields!';

      // ✅ Handle backend validation or field-specific errors
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


    isLoading: boolean = false;

    // fetchSalaryCompo(schema: string, branchIds: number[]): void {
    //   this.isLoading = true;
    //   this.leaveservice.getSalaryComNew(schema, branchIds).subscribe({
    //     next: (data: any) => {
    //       // Filter active employees
    //       this.overtimepol = data;
  
    //       this.isLoading = false;
    //     },
    //     error: (err) => {
    //       console.error('Fetch error:', err);
    //       this.isLoading = false;
    //     }
    //   });
    // }


    onFileChange(event: any){
    this.file = event.target.files[0];
    console.log(this.file);
    
  }
   onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  
     bulkuploaddocument(): void {
      
     const formData = new FormData();
    formData.append('file',this.selectedFiles);
  
    formData.append('file',this.file)
    
    formData.append('amount', this.amount);
  
    formData.append('employee', this.employee);
    
    formData.append('component', this.component);
    
  
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }

      /** 🔥 START LOADER */
  this.isLoading = true;
   
   
    // return this.http.put(apiUrl, formData);

  
    this.http.post(`${this.apiUrl}/payroll/api/bulk-upload-salary/bulk_upload/?schema=${selectedSchema}`, formData)
      .subscribe((response) => {
        // Handle successful upload
        console.log('bulkupload upload successful', response);
        alert('bulkupload upload successful');
        window.location.reload();

      }, (error) => {
        this.isLoading = false;
        console.error('Salary upload failed', error);
        alert('Salary upload failed!');
      });
      }

 

  
 isBulkuploadDepartmentModalOpen :boolean=false;


OpenBulkuploadModal():void{
  this.isBulkuploadDepartmentModalOpen = true;
}




closeBulkuploadModal():void{
  this.isBulkuploadDepartmentModalOpen = false;

}

   showUploadForm: boolean = false;

toggleUploadForm(): void {
  this.showUploadForm = !this.showUploadForm;
}




closeUploadForm(): void {
  this.showUploadForm = false;
}


      downloadSalaryCsv(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;
    
      this.companyRegistrationService.downloadSalaryCsv(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Salary_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }


     
    downloadSalaryExcel(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;
    
      this.companyRegistrationService.downloadSalaryExcel(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Salary_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }

      
      iscreateovertimepolicy: boolean = false;




      openPopus():void{
        this.iscreateovertimepolicy = true;

      }
    
      closeapplicationModal():void{
        this.iscreateovertimepolicy = false;

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
    this.overtimepol.forEach(employee => employee.selected = this.allSelecteds);

  }

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset };
  this.isEditModalOpen = true;

  this.mapComponentToId();
  this.mapEmployeeToId();

  this.onComponentChange(); // ✅ ADD THIS LINE
}
  



updateEmployeeSalary(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateEmpSalary(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Employee salary  updated successfully!');
      this.closeEditModal();
      // this.loadLAsset(); 
      window.location.reload();
    },
(error) => {
  console.error('Error updating asset:', error);

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

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }



    
  deleteSelectedEmpsalary() { 
    const selectedEmployeeIds = this.EmployeeSalarycomponent
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No employee salary selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected employee salary ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteEmpsalary(categoryId).subscribe(
          () => {
            console.log('Asset deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.EmployeeSalarycomponent = this.EmployeeSalarycomponent.filter(employee => employee.id !== categoryId);
  
             completed++;
  
           if (completed === total) {
            alert(' Employee Salary deleted successfully');
            window.location.reload();
            }
  
          },
          (error) => {
            console.error('Error deleting Employee Salary:', error);
            alert('Error deleting Employee Salary: ' + error.statusText);
          }
        );
      });
    }
  }



  employees: any[] = [];
  filteredEmployees: any[] = [];


  // loadEmp(callback?: Function): void {
  //   const selectedSchema = this.authService.getSelectedSchema();
  //   const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
  
  //   if (selectedSchema) {
  //     this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
  //       (data: any) => {
  //        // Filtering employees where is_active is null or true
  //        this.employees = data.filter((employee: any) => employee.is_active === null || employee.is_active === true);
  //        this.filteredEmployees = this.employees;
          
  //         if (callback) callback();
  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  // }




  loadEmp(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
    if (selectedSchema) {
      this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe({
        next: (data: any) => {
          this.employees = data.filter((employee: any) => employee.is_active === null || employee.is_active === true);
          
          // ❌ REMOVED: this.filteredEmployees = this.employees;
          // Do not assign master employees here, let buildEmployeeMatrix handle table state!
  
          if (callback) callback();
        },
        error: (error) => {
          console.error('Error fetching Companies:', error);
        }
      });
    }
  }



  
  mapEmployeeToId() {
  if (!this.employees || !this.editAsset?.employee) return;

  const emp = this.employees.find(
    (e: any) =>
      e.emp_code === this.editAsset.employee || // from backend
      e.id === this.editAsset.employee          // already ID
  );

  if (emp) {
    this.editAsset.employee = emp.id;
  }

  console.log('Mapped Employee ID:', this.editAsset.employee);
}
  
    
          
  filteredSalaryComponents: any[] = [];

  selectedFixedFilter: string = 'all';

  EmployeeSalarycomponent: any[] = [];

      
  
  // fetchEmployeesSalary(schema: string, branchIds: number[]): void {
  //   this.isLoading = true;
  //   this.leaveservice.getEmployeeSalaryComNew(schema, branchIds).subscribe({
  //     next: (data: any) => {
  //       this.EmployeeSalarycomponent = data;
  
  //       // APPLY FILTER AFTER FETCH
  //       this.applyFilter();
  
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('Fetch error:', err);
  //       this.isLoading = false;
  //     }
  //   });
  // }
  


   applyFilter(): void {
      if (this.selectedFixedFilter === 'all') {
        this.filteredSalaryComponents = this.EmployeeSalarycomponent;
      } else if (this.selectedFixedFilter === 'true') {
        this.filteredSalaryComponents = this.EmployeeSalarycomponent.filter(
          item => item.is_fixed === true
        );
      } else if (this.selectedFixedFilter === 'false') {
        this.filteredSalaryComponents = this.EmployeeSalarycomponent.filter(
          item => item.is_fixed === false
        );
      }
    }


    Salarycomponent: any[] = [];

    fetchsalaryComp(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.leaveservice.getSalaryComNew(schema, branchIds).subscribe({
        next: (data: any) => {
          // Filter active employees
          this.Salarycomponent = data;
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
      });
    }

    mapComponentToId() {
  if (!this.Salarycomponent || !this.editAsset?.component) return;

  const comp = this.Salarycomponent.find(
    (c: any) =>
      c.name === this.editAsset.component ||   // from backend
      c.id === this.editAsset.component        // already ID
  );

  if (comp) {
    this.editAsset.component = comp.id;
  }

  console.log('Mapped Component ID:', this.editAsset.component);
}
  

    selectedComponent: any = null;

    // selectedComponentId: number | null = null;


onComponentChange() {
  const selectedId = this.isEditModalOpen
    ? Number(this.editAsset.component)
    : Number(this.component);

  this.selectedComponent = this.Salarycomponent.find(
    comp => comp.id === selectedId
  );

  if (!this.selectedComponent) {
    this.showAmountField = false;
    return;
  }

  const componentName = (this.selectedComponent.name || '').toLowerCase();
  const componentCode = (this.selectedComponent.code || '').toLowerCase();

  this.showAmountField =
    this.selectedComponent.is_fixed === true ||
    componentName.includes('petty') ||
    componentCode.includes('petty');

  if (!this.showAmountField) {
    this.amount = '';
  }
}

    


/* Step 1: Fetches the backend employee raw assignment list*/
  fetchEmployeesSalary(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveservice.getEmployeeSalaryComNew(schema, branchIds).subscribe({
      next: (data: any[]) => {
        this.EmployeeSalarycomponent = data || [];
        this.buildEmployeeMatrix();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }


// Filter & Component Selectors
selectedComponentValueType: 'fixed' | 'variable' = 'fixed';
availableCategories: string[] = [];
selectedPayrollCategory: string = '';

// Matrix Transformed Display Arrays
distinctEmployees: any[] = [];  

// 1. Update your state property variable declaration at the top of the class:
selectedPayrollCategories: string[] = []; // Changed from single string to array



/**
 * Dispatches configuration metadata fetches depending on radio status changes
 */
onComponentTypeChange(): void {
  // Reset selections on toggle
  this.editedCells = {}; // Reset unsaved changes on toggle
  this.selectedPayrollCategory = '';
  this.availableCategories = [];
  this.selectedPayrollCategories = []; // Reset array
  
  // ✅ Extract the active, dynamic schema context on-demand from authService
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (selectedSchema) {
    this.loadComponentMetadata(selectedSchema);
  } else {
    console.warn('Cannot fetch component metadata: No dynamic schema context active.');
  }
}

/**
 * Fetches corresponding operational lists to feed the category dropdown
 */
// Add this property to your class:
allComponentsList: any[] = [];

loadComponentMetadata(schema: string): void {
  const endpoint$ = this.selectedComponentValueType === 'fixed'
    ? this.leaveservice.getFixedComponents(schema)
    : this.leaveservice.getVariableComponents(schema);

  endpoint$.subscribe({
    next: (components: any[]) => {
      if (components && Array.isArray(components)) {
        this.allComponentsList = components; // Stores objects like [{ id: 12, payroll_category: 'basic' }]
        const categories = components.map(c => c.payroll_category).filter(Boolean);
        this.availableCategories = Array.from(new Set(categories));
      }
    },
    error: (err) => console.error('Error fetching metadata list:', err)
  });
}
/**
 * Step 2: Transforms a flat payload into structural rows mapped uniquely by Employee Code
 */
// buildEmployeeMatrix(): void {
//   const employeeMap = new Map<string, any>();

//   this.EmployeeSalarycomponent.forEach(item => {
//     const empCode = item.employee;
//     if (!employeeMap.has(empCode)) {
//       employeeMap.set(empCode, {
//         employee_code: empCode,
//         emp_name: item.emp_name,
//         department: item.department || 'N/A',
//         designation: item.designation || 'N/A',
//         selected: false,
//         // Track internal component sub-records for matching amounts instantly
//         rawAssignments: []
//       });
//       console.log(this.distinctEmployees);
//     }
//     employeeMap.get(empCode).rawAssignments.push(item);
//   });

//   this.distinctEmployees = Array.from(employeeMap.values());
// }



// buildEmployeeMatrix(): void {
//   const employeeMap = new Map<string, any>();

//   this.EmployeeSalarycomponent.forEach(item => {
//     const empCode = item.employee;

//     if (!employeeMap.has(empCode)) {
//       employeeMap.set(empCode, {
//         emp_pk_id: item.employee_id || item.emp_id || item.emp_pk || item.user_id || null, 
//         employee_code: empCode,
//         emp_name: item.emp_name,
//         department: item.department || 'N/A',
//         designation: item.designation || 'N/A',
//         selected: false,
//         rawAssignments: []
//       });
//     }
//     employeeMap.get(empCode).rawAssignments.push(item);
//   });

//   this.distinctEmployees = Array.from(employeeMap.values());

//   // Re-apply filter in case dropdown items were pre-selected
//   this.applyEmployeeFilter();
// }

buildEmployeeMatrix(): void {
  const employeeMap = new Map<string, any>();

  this.EmployeeSalarycomponent.forEach(item => {
    const empCode = item.employee;

    if (!employeeMap.has(empCode)) {
      employeeMap.set(empCode, {
        // Extract numeric PK ID if available in item
        emp_pk_id: item.employee_id || item.emp_id || item.emp_pk || item.user_id || null, 
        employee_code: empCode,
        emp_name: item.emp_name,
        department: item.department || 'N/A',
        designation: item.designation || 'N/A',
        selected: false,
        rawAssignments: []
      });
    }
    employeeMap.get(empCode).rawAssignments.push(item);
  });

  this.distinctEmployees = Array.from(employeeMap.values());

  this.applyEmployeeFilter();
}




/**
 * Step 3: Resolves dynamic matrix field calculations for matching elements
 */
getComponentAmount(employee: any, category: string): string {

  if (!employee || !category) {
    return '-';
  }

  const match = employee.rawAssignments.find((item: any) => {

    return (
      item.payroll_category?.trim().toLowerCase() ===
      category.trim().toLowerCase() &&
      item.component_value_type?.trim().toLowerCase() ===
      this.selectedComponentValueType.toLowerCase()
    );

  });

  if (match) {
    return match.amount;
  }

  return '-';

}
/**
 * Returns a target instance match object for structural editing procedures
 */
getComponentInstance(employeeRow: any, category: string): any {
  return employeeRow.rawAssignments.find((assign: any) => 
    assign.payroll_category?.toLowerCase() === category.toLowerCase() &&
    assign.component_value_type?.toLowerCase() === this.selectedComponentValueType.toLowerCase()
  );
}

// openEditModal(employeeRow: any): void {
//   const targetInstance = this.getComponentInstance(employeeRow, this.selectedPayrollCategory);
//   if (targetInstance) {
//     console.log('Opening target component modal edit view:', targetInstance);
//     // Trigger your modal action code here, passing targetInstance
//   } else {
//     console.warn('No active assignment record setup on this row for category: ' + this.selectedPayrollCategory);
//   }
// }





// Track modified values in a dictionary: { "EMP001_basic": 5000, "EMP002_hra": 2000 }
editedCells: { [key: string]: number | string } = {};
isSaving = false;


/**
   * Helper key generator for cell mapping
   */
getCellKey(empCode: string, category: string): string {
  return `${empCode}_${category.trim().toLowerCase()}`;
}

/**
   * Gets the cell value (checks edited local cache first, then falls back to backend raw assignment data)
   */
  getCellValue(employee: any, category: string): any {
    const cellKey = this.getCellKey(employee.employee_code, category);
    
    // 1. If edited locally, return edited value
    if (this.editedCells.hasOwnProperty(cellKey)) {
      return this.editedCells[cellKey];
    }

    // 2. Otherwise return value from server match
    const match = employee.rawAssignments.find((item: any) => 
      item.payroll_category?.trim().toLowerCase() === category.trim().toLowerCase() &&
      item.component_value_type?.trim().toLowerCase() === this.selectedComponentValueType.toLowerCase()
    );

    return match ? match.amount : '';
  }

  /**
   * Triggers when user edits a value directly inside a cell input box
   */
  onCellValueChange(employee: any, category: string, newValue: any): void {
    const cellKey = this.getCellKey(employee.employee_code, category);
    this.editedCells[cellKey] = newValue;
  }

  /**
   * Returns true if there are pendingunsaved cell changes
   */
  hasUnsavedChanges(): boolean {
    return Object.keys(this.editedCells).length > 0;
  }


/**
 * Saves all inline table edits concurrently using individual requests mapped via forkJoin
 */

saveTableChanges(): void {
  if (!this.hasUnsavedChanges()) {
    alert('No changes to save.');
    return;
  }

  const schema = this.currentSchema || this.authService.getSelectedSchema();
  if (!schema) {
    alert('No active schema selected.');
    return;
  }

  this.isSaving = true;
  const updateRequests: Observable<any>[] = [];

  Object.keys(this.editedCells).forEach(cellKey => {
    const [empCode, categoryKey] = cellKey.split('_');
    const newValue = this.editedCells[cellKey];

    const emp = this.distinctEmployees.find(e => e.employee_code === empCode);

    // Find assignment match
    const matchAssignment = emp?.rawAssignments?.find((item: any) => 
      item.payroll_category?.trim().toLowerCase() === categoryKey.toLowerCase() &&
      item.component_value_type?.trim().toLowerCase() === this.selectedComponentValueType.toLowerCase()
    );

    // Find component metadata object to extract its numeric PK ID
    const componentMeta = this.allComponentsList.find((c: any) => 
      c.payroll_category?.trim().toLowerCase() === categoryKey.toLowerCase()
    );

    // 1. Get Numeric PK for Component
    const componentPk = matchAssignment?.component_id || 
                        matchAssignment?.component_pk || 
                        componentMeta?.id;

    // 2. Get Numeric PK for Employee
    const employeePk = emp?.emp_pk_id || 
                       matchAssignment?.employee_id || 
                       matchAssignment?.emp_id;

    const payload = {
      id: matchAssignment?.id ? Number(matchAssignment.id) : null,
      
      // Ensure numeric integer PKs are sent (Fallback to raw string if backend uses UUID/String PKs)
      employee: employeePk ? (isNaN(Number(employeePk)) ? employeePk : Number(employeePk)) : empCode,
      component: componentPk ? (isNaN(Number(componentPk)) ? componentPk : Number(componentPk)) : categoryKey,

      component_value_type: this.selectedComponentValueType,
      payroll_category: matchAssignment?.payroll_category || categoryKey,
      amount: newValue === '' || newValue === null ? 0 : Number(newValue)
    };

    console.log('Sending Payload with PK IDs:', payload);

    updateRequests.push(
      this.leaveservice.updateEmployeeSalaryComponent(schema, payload)
    );
  });

  forkJoin(updateRequests).subscribe({
    next: () => {
      alert('Salary components updated successfully!');
      this.editedCells = {};
      this.isSaving = false;
      this.fetchEmployeesSalary(this.currentSchema, this.currentBranchIds);
    },
    error: (err) => {
      console.error('API Error Response:', err);
      alert(err?.error?.message || 'Failed to save changes. Check console.');
      this.isSaving = false;
    }
  });
}

/**
   * Cancels/Discards all local inline unsaved edits
   */
discardChanges(): void {
  this.editedCells = {};
}




// Selected employee codes array
selectedEmployees: string[] = [];

applyEmployeeFilter(): void {
  if (!this.selectedEmployees || this.selectedEmployees.length === 0) {
    // Show all rows
    this.filteredEmployees = [...this.distinctEmployees];
  } else {
    // Show only selected employee rows
    this.filteredEmployees = this.distinctEmployees.filter(emp =>
      this.selectedEmployees.includes(emp.employee_code)
    );
  }
}

selectAllEmployees(): void {
  this.selectedEmployees = this.distinctEmployees.map(emp => emp.employee_code);
  this.applyEmployeeFilter();
}

clearEmployeeFilter(): void {
  this.selectedEmployees = [];
  this.applyEmployeeFilter();
}


exportEmployeeSalaryExcel(): void {

  const exportData: any[] = [];

  this.filteredEmployees.forEach(emp => {

    const row: any = {};

    row['Employee Code'] = emp.employee_code;
    row['Employee Name'] = emp.emp_name;
    row['Department'] = emp.department;
    row['Designation'] = emp.designation;
    row['Basic'] = emp.basic;


    this.selectedPayrollCategories.forEach(category => {

      row[category] = this.getCellValue(emp, category);

    });

    exportData.push(row);

  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Employee Salary'
  );

  XLSX.writeFile(
      workbook,
      'Employee_Salary.xlsx'
  );

}







}
