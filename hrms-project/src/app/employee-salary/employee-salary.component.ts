import { Component, ViewChild } from '@angular/core';
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
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styleUrl: './employee-salary.component.css'
})
export class EmployeeSalaryComponent {

  
  
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

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;


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
   private categoryService: CatogaryService,

  ) {}

  ngOnInit(): void {

    
 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.employeeService.selectedSchema$,
  this.employeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchsalaryComp(schema, branchIds);  
    this.fetchEmployeesSalaryCom(schema, branchIds);  


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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_paystructure', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_paystructure', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_paystructure', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_paystructure', groupPermissions);
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
        window.location.reload();
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

  this.mapComponentToId();   // ✅ FIX
  this.mapEmployeeToId();    // ✅ FIX

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


  loadEmp(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
  
    if (selectedSchema) {
      this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
        (data: any) => {
         // Filtering employees where is_active is null or true
         this.employees = data.filter((employee: any) => employee.is_active === null || employee.is_active === true);
         this.filteredEmployees = this.employees;
          
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
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

      
  
  fetchEmployeesSalaryCom(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveservice.getEmployeeSalaryComNew(schema, branchIds).subscribe({
      next: (data: any) => {
        this.EmployeeSalarycomponent = data;
  
        // APPLY FILTER AFTER FETCH
        this.applyFilter();
  
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }
  


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
  this.selectedComponent = this.Salarycomponent.find(
    comp => comp.id === Number(this.component)
  );

  if (!this.selectedComponent) {
    this.showAmountField = false;
    return;
  }

  // ✅ Show amount if:
  // 1. Fixed component
  // 2. Petty Cash component
  const componentName = (this.selectedComponent.name || '').toLowerCase();
  const componentCode = (this.selectedComponent.code || '').toLowerCase();

  this.showAmountField =
    this.selectedComponent.is_fixed === true ||
    componentName.includes('petty') ||
    componentCode.includes('petty');

  // Clear amount only if field should not show
  if (!this.showAmountField) {
    this.amount = '';
  }
}

    



}
