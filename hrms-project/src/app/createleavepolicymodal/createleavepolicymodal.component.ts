import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { LeaveService } from '../leave-master/leave.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import { AuthenticationService } from '../login/authentication.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatDialogRef } from '@angular/material/dialog';
import { combineLatest, forkJoin, Observable, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatOption, MatSelect } from '@angular/material/select';
import { DesignationService } from '../designation-master/designation.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-createleavepolicymodal',
  templateUrl: './createleavepolicymodal.component.html',
  styleUrl: './createleavepolicymodal.component.css'
})
export class CreateleavepolicymodalComponent {






  private apiUrl = environment.apiBaseUrl;


  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;


  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectDept') selectDept: MatSelect | undefined;
  @ViewChild('selectDes') selectDes: MatSelect | undefined;
  @ViewChild('selectCat') selectCat: MatSelect | undefined;

  @ViewChild('selectcon') selectcon: MatSelect | undefined;
  @ViewChild('selectDeptcon') selectDeptcon: MatSelect | undefined;
  @ViewChild('selectDescon') selectDescon: MatSelect | undefined;
  @ViewChild('selectCatcon') selectCatcon: MatSelect | undefined;

  // Define months with both full and short forms
  months: { short: string, full: string }[] = [
    { short: 'Jan', full: 'January' },
    { short: 'Feb', full: 'February' },
    { short: 'Mar', full: 'March' },
    { short: 'Apr', full: 'April' },
    { short: 'May', full: 'May' },
    { short: 'Jun', full: 'June' },
    { short: 'Jul', full: 'July' },
    { short: 'Aug', full: 'August' },
    { short: 'Sep', full: 'September' },
    { short: 'Oct', full: 'October' },
    { short: 'Nov', full: 'November' },
    { short: 'Dec', full: 'December' }
  ];


  private dataSubscription?: Subscription;




  LeaveTypes: any[] = [];
  // Branches: any[] = [];
  Departments: any[] = [];
  Designation: any[] = [];
  Category: any[] = [];


  leaveEntitlements: any[] = [];






  // entitlement field variables declaration

  min_experience: any = '';
  effective_after_unit: any = '';
  effective_after_from: any = '';
  accrual_rate: any = '';
  accrual_frequency: any = '';
  accrual_month: any = '';
  accrual_day: any = '';
  round_of: any = '';
  prorate_type: any = '';
  leave_type: any = '';
  leave_entitlement: any = '';


  accrual: boolean = false;

  prorate_accrual: boolean = false;

  enable_leave_pay_rule: boolean = false;

  leavePayRules: any[] = [];




  registerButtonClicked: boolean = false;




  showMonth: boolean = false; // Controls the visibility of the "Month" dropdown
  showDay: boolean = false;   // Controls the visibility of the "Day" dropdown

  showResetMonth: boolean = false; // Controls the visibility of the reset "Month" dropdown
  showResetDay: boolean = false;   // Controls the visibility of the reset "Day" dropdown



  gender: any = '';
  // branch: any = '';
  branch:any[] = [];
  
  designation: any = '';
  department: any = '';
  role: any = '';

  branches: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  categories: any[] = [];



  Employees: any[] = []; // Array to store schema names
  leaveRests: any[] = []; // Array to store schema names
  LeaveMaster: any[] = [];


  name: any = '';
  code: any = '';
  type: any = '';
  unit: any = '';
  valid_to: any = '';
  valid_from: any = '';

  description: any = '';
  created_by: any = '';


  image: string | undefined;

  negative: boolean = false;

  allow_half_day: boolean = false;
  include_weekend_and_holiday: boolean = false;
  use_common_workflow: boolean = false;
  include_dashboard: boolean = false;



  // leave reset field variables declaration


  reset: boolean = false;

  frequency: any = '';
  month: any = '';
  day: any = '';
  carry_forward_choice: any = '';
  cf_value: any = '';
  cf_unit_or_percentage: any = '';
  cf_max_limit: any = '';
  cf_expires_in_value: any = '';
  cf_time_choice: any = '';
  encashment_value: any = '';
  encashment_unit_or_percentage: any = '';
  encashment_max_limit: any = '';
  opening_balance: any = '';

  allow_cf: boolean = false;
  allow_encashment: boolean = false;


  selectedLeaveTypeId: number | null = null;



  constructor(
    private http: HttpClient,
    private leaveService: LeaveService,
    private sessionService: SessionService,

    private employeeService: EmployeeService,

    private authService: AuthenticationService,
    private DepartmentServiceService: DepartmentServiceService,
    private DesignationService: DesignationService,
    public dialogRef: MatDialogRef<CreateleavepolicymodalComponent>,

    private ref: MatDialogRef<CreateleavepolicymodalComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any
  
  
  ) { }

  ngOnInit(): void {
    // this.LoadBranch();
   
    if (
      this.data?.editMode &&
      this.data?.entitlements
    ) {
    
      this.isEditMode = true;
    
      this.patchMultipleEntitlements(
        this.data.entitlements
      );
    
    }


    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchLeaveType(schema, branchIds);

      }
    });

    // Listen for sidebar changes so the dropdown updates instantly
    this.employeeService.selectedBranches$.subscribe(ids => {
      this.LoadBranch();
      this.loadEmp();
      
    });


    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {

      // this.loadLeaveEntitlements();
      // this.loadLeaveRestValues();
      // this.loadLeavePayRules();
      // this.loadLeaveApplicable();


      this.LoadEmployee(selectedSchema);

      this.LoadBranch();
      this.LoadDepartment(selectedSchema);
      this.LoadDesignation(selectedSchema);
      this.LoadCategory(selectedSchema);





    }

    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property

          this.created_by = this.userId;
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


                    this.hasAddPermission = this.checkGroupPermission('add_leave_type', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_leave_type', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_leave_type', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_leave_type', groupPermissions);
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



  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

  ClosePopup() {
    this.ref.close('Closed using function')
  }


  isLoading: boolean = false;
  fetchLeaveType(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveService.getLeaveTypeNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.LeaveTypes = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }


  LoadBranch(callback?: Function) {
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

  LoadDepartment(selectedSchema: string) {
    this.leaveService.getDepartments(selectedSchema).subscribe(
      (data: any) => {
        this.Departments = data;

        console.log('employee:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  LoadDesignation(selectedSchema: string) {
    this.leaveService.getDesignation(selectedSchema).subscribe(
      (data: any) => {
        this.Designation = data;

        console.log('employee:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }
  LoadCategory(selectedSchema: string) {
    this.leaveService.getCategory(selectedSchema).subscribe(
      (data: any) => {
        this.Category = data;

        console.log('employee:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  LoadEmployee(selectedSchema: string) {
    this.leaveService.getEmployee(selectedSchema).subscribe(
      (data: any) => {
        // Check if `data` contains strings instead of objects
        this.Employees = data;

        console.log('Fetched Employees:', this.Employees);
      },
      (error: any) => {
        console.error('Error fetching employees:', error);
      }
    );
  }



  selectedPolicy: string = '';
  showPolicySelection: boolean = true;

  nextSteps() {

    if (!this.selectedPolicy) {
      return;
    }

    this.showPolicySelection = false;

    this.dialogRef.updateSize('1400px', '90vh');
  }


  onResetFrequencyChange(row: any): void {

    if (row.frequency === 'years') {
  
      row.showResetMonth = true;
      row.showResetDay = true;
  
    } else if (row.frequency === 'months') {
  
      row.showResetMonth = false;
      row.showResetDay = true;
  
    } else {
  
      row.showResetMonth = false;
      row.showResetDay = false;
  
    }
  
  }

  onAccrualFrequencyChange(row: any): void {

    if (row.accrual_frequency === 'years') {
  
      row.showMonth = true;
      row.showDay = true;
  
    } else if (row.accrual_frequency === 'months') {
  
      row.showMonth = false;
      row.showDay = true;
  
    } else {
  
      row.showMonth = false;
      row.showDay = false;
  
    }
  
  }

  allSelected = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelectedEmp = false;
  allSelectedDes = false;


  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {

        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectiondept(): void {
    if (this.selectDept) {
      if (this.allSelecteddept) {
        this.selectDept.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDept.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectioncat(): void {
    if (this.selectCat) {
      if (this.allSelectedcat) {
        this.selectCat.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectCat.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectionDes(): void {
    if (this.selectDes) {
      if (this.allSelectedDes) {
        this.selectDes.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDes.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }





  allSelectedcon = false;
  allSelecteddeptcon = false;
  allSelectedcatcon = false;
  allSelectedEmpcon = false;
  allSelectedDescon = false;


  toggleAllSelectioncon(): void {
    if (this.selectcon) {
      if (this.allSelectedcon) {

        this.selectcon.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectcon.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectiondeptcon(): void {
    if (this.selectDeptcon) {
      if (this.allSelecteddeptcon) {
        this.selectDeptcon.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDeptcon.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectioncatcon(): void {
    if (this.selectCatcon) {
      if (this.allSelectedcatcon) {
        this.selectCatcon.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectCatcon.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectionDescon(): void {
    if (this.selectDescon) {
      if (this.allSelectedDescon) {
        this.selectDescon.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDescon.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }












  FilteredEmployees: any[] = [];


  Categories: any[] = [];
  Designations: any[] = [];

  Employee: any[] = [];


selectedBranches: number[] = [];
selectedDepartments: number[] = [];
selectedCategories: number[] = [];
selectedDesignations: number[] = [];

allEmployeesSelected = false;

loadEmp(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (result: any) => {
        this.Employee = result;
        this.FilteredEmployees = result;
        
        this.currentPage = 1;

        this.updatePagination();    

        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
}


applyEmployeeFilter(): void {

  this.FilteredEmployees = this.Employee.filter(emp => {

    const branchMatch =
      this.selectedBranches.length === 0 ||
      this.selectedBranches.some(id =>
        emp.emp_branch_id === this.getBranchName(id)
      );

    const deptMatch =
      this.selectedDepartments.length === 0 ||
      this.selectedDepartments.some(id =>
        emp.emp_dept_id === this.getDepartmentName(id)
      );

    const categoryMatch =
      this.selectedCategories.length === 0 ||
      this.selectedCategories.some(id =>
        emp.emp_ctgry_id === this.getCategoryName(id)
      );

    const designationMatch =
      this.selectedDesignations.length === 0 ||
      this.selectedDesignations.some(id =>
        emp.emp_desgntn_id === this.getDesignationName(id)
      );

    return (
      branchMatch &&
      deptMatch &&
      categoryMatch &&
      designationMatch
    );

  });
  this.currentPage = 1;

  this.updatePagination();


}

getBranchName(id: number): string {

  const item = this.branches.find(x => x.id == id);

  return item ? item.branch_name : '';

}

getDepartmentName(id: number): string {

  const item = this.Departments.find(x => x.id == id);

  return item ? item.dept_name : '';

}

getCategoryName(id: number): string {

  const item = this.Category.find(x => x.id == id);

  return item ? item.ctgry_title : '';

}

getDesignationName(id: number): string {

  const item = this.Designation.find(x => x.id == id);

  return item ? item.desgntn_job_title : '';

}




// select all option in branch

toggleAllBranches(): void {

  if (
    this.selectedBranches.length ===
    this.branches.length
  ) {

    this.selectedBranches = [];

  } else {

    this.selectedBranches =
      this.branches.map(x => x.id);

  }

  this.applyEmployeeFilter();
}



isAllBranchesSelected(): boolean {

  return (
    this.branches.length > 0 &&
    this.selectedBranches.length ===
    this.branches.length
  );

}

isSomeBranchesSelected(): boolean {

  return (
    this.selectedBranches.length > 0 &&
    this.selectedBranches.length <
    this.branches.length
  );

}


toggleAllDepartments(): void {

  if (
    this.selectedDepartments.length ===
    this.Departments.length
  ) {

    this.selectedDepartments = [];

  } else {

    this.selectedDepartments =
      this.Departments.map(x => x.id);

  }

  this.applyEmployeeFilter();

}

isAllDepartmentsSelected(): boolean {

  return (
    this.Departments.length > 0 &&
    this.selectedDepartments.length ===
    this.Departments.length
  );

}

isSomeDepartmentsSelected(): boolean {

  return (
    this.selectedDepartments.length > 0 &&
    this.selectedDepartments.length <
    this.Departments.length
  );


  
}



// select all function

toggleAllCategories(): void {

  if (
    this.selectedCategories.length ===
    this.Category.length
  ) {

    this.selectedCategories = [];

  } else {

    this.selectedCategories =
      this.Category.map(x => x.id);

  }

  this.applyEmployeeFilter();
}

isAllCategoriesSelected(): boolean {

  return (
    this.Category.length > 0 &&
    this.selectedCategories.length ===
    this.Category.length
  );

}

isSomeCategoriesSelected(): boolean {

  return (
    this.selectedCategories.length > 0 &&
    this.selectedCategories.length <
    this.Category.length
  );

}

toggleAllDesignations(): void {

  if (
    this.selectedDesignations.length ===
    this.Designation.length
  ) {

    this.selectedDesignations = [];

  } else {

    this.selectedDesignations =
      this.Designation.map(x => x.id);

  }

  this.applyEmployeeFilter();

}



isAllDesignationsSelected(): boolean {

  return (
    this.Designation.length > 0 &&
    this.selectedDesignations.length ===
    this.Designation.length
  );

}

isSomeDesignationsSelected(): boolean {

  return (
    this.selectedDesignations.length > 0 &&
    this.selectedDesignations.length <
    this.Designation.length
  );

}


currentPage: number = 1;
itemsPerPage: number = 3;
pagedEmployees: any[] = [];


updatePagination(): void {

  const startIndex =
    (this.currentPage - 1) * this.itemsPerPage;

  const endIndex =
    startIndex + this.itemsPerPage;

  this.pagedEmployees =
    this.FilteredEmployees.slice(
      startIndex,
      endIndex
    );

}


get totalPages(): number {

  return Math.ceil(
    this.FilteredEmployees.length /
    this.itemsPerPage
  );

}



nextPage(): void {

  if (this.currentPage < this.totalPages) {

    this.currentPage++;

    this.updatePagination();

  }

}



previousPage(): void {

  if (this.currentPage > 1) {

    this.currentPage--;

    this.updatePagination();

  }

}



goToPage(page: number): void {

  this.currentPage = page;

  this.updatePagination();

}



get pageNumbers(): number[] {

  return Array(
    this.totalPages
  ).fill(0).map((x, i) => i + 1);

}



AssignWeekCalendar: any[] = [];


Delete: boolean = false;
allSelecteddelete: boolean = false;

toggleCheckboxes() {
this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
  this.allSelecteddelete = !this.allSelecteddelete;
this.AssignWeekCalendar.forEach(employee => employee.selected = this.allSelecteddelete);

this.FilteredEmployees.forEach(emp => {

emp.selected = this.allEmployeesSelected;

});

}





// registerleaveEntitlement(): void {

//   if (!this.leave_type) {
//     alert('Select Leave Type');
//     return;
//   }

//   this.registerButtonClicked = true;

//   const payload = {

//     leave_type: this.leave_type,
  
//     min_experience:
//       this.min_experience || null,
  
//     effective_after_from:
//       this.effective_after_from || null,
  
//     effective_after_unit:
//       this.effective_after_unit || null,
  
//     accrual_rate:
//       this.accrual
//         ? this.accrual_rate || null
//         : null,
  
//     accrual_frequency:
//       this.accrual
//         ? this.accrual_frequency || null
//         : null,
  
//     accrual_month:
//       this.accrual
//         ? this.accrual_month || null
//         : null,
  
//     accrual_day:
//       this.accrual
//         ? this.accrual_day || null
//         : null,
  
//     prorate_type:
//       this.prorate_type || null,
  
//     prorate_accrual:
//       this.prorate_accrual,
  
//     accrual:
//       this.accrual,
  
//     created_by:
//       this.created_by,
  
//     branches:
//       this.branch || [],
  
//     categories:
//       this.categories || [],
  
//     departments:
//       this.departments || [],
  
//     designations:
//       this.designations || [],
  
//     reset_policy: this.reset
//       ? {
//           reset: true,
  
//           frequency:
//             this.frequency || null,
  
//           month:
//             this.month || null,
  
//           day:
//             this.day || null,
  
//           allow_cf:
//             this.allow_cf,
  
//           carry_forward_choice:
//             this.carry_forward_choice || null,
  
//           cf_value:
//             this.cf_value || null,
  
//           cf_unit_or_percentage:
//             this.cf_unit_or_percentage || null,
  
//           cf_max_limit:
//             this.cf_max_limit || null,
  
//           allow_encashment:
//             this.allow_encashment,
  
//           encashment_value:
//             this.encashment_value || null,
  
//           encashment_unit_or_percentage:
//             this.encashment_unit_or_percentage || null,
  
//           encashment_max_limit:
//             this.encashment_max_limit || null,
  
//           opening_balance:
//             this.opening_balance || null
//         }
//       : {
//           reset: false
//         }
  
//   };
//   this.leaveService.registerLeaveEntitlement(payload).subscribe({

//     next: (res: any) => {

//       alert(
//         res?.message ||
//         res?.success ||
//         '✅ Leave Entitlement Added Successfully'
//       );

//       this.createdEntitlementId = res.id;

//       if (this.showPayRuleStep) {

//         this.currentStep = 2; // Pay Rule
      
//       } else {
      
//         this.currentStep = 2; // Applicable
      
//       }

//       console.log('Success Response:', res);

//     },

//     error: (err) => {

//       console.error('Error Response:', err);

//       const errorMessage =
//         err?.error?.message ||
//         err?.error?.error ||
//         err?.error?.detail ||
//         JSON.stringify(err?.error) ||
//         'Failed to create Leave Entitlement';

//       alert(errorMessage);

//     }

//   });

// }


registerleaveEntitlement(): void {

  // if (!this.leave_type) {

  //   alert('Select Leave Type');

  //   return;

  // }

  const requests = this.entitlementRows.map(row => {

    const payload = {

      leave_type: row.leave_type,

      min_experience: row.min_experience,

      effective_after_from:
        row.effective_after_from,

      effective_after_unit:
        row.effective_after_unit,

      accrual:
        row.accrual,

      accrual_rate:
        row.accrual_rate,

      accrual_frequency:
        row.accrual_frequency,

      accrual_month:
        row.accrual_month,

      accrual_day:
        row.accrual_day,

      prorate_accrual:
        row.prorate_accrual,

        branches: row.branch || [],
        departments: row.departments || [],
        designations: row.designations || [],
        categories: row.categories || [],

      created_by:
        this.created_by,

      reset_policy: row.reset
        ? {

            reset: true,

            frequency:
              row.frequency,

            month:
              row.month,

            day:
              row.day,

            allow_cf:
              row.allow_cf,

            carry_forward_choice:
              row.carry_forward_choice,

            cf_value:
              row.cf_value,

            cf_unit_or_percentage:
              row.cf_unit_or_percentage,

            cf_max_limit:
              row.cf_max_limit,

            allow_encashment:
              row.allow_encashment,

            encashment_value:
              row.encashment_value,

            encashment_unit_or_percentage:
              row.encashment_unit_or_percentage,

            encashment_max_limit:
              row.encashment_max_limit,

            opening_balance:
              row.opening_balance

          }
        : {
            reset: false
          }

    };

    return this.leaveService
      .registerLeaveEntitlement(payload);

  });

  forkJoin(requests).subscribe({

    next: (responses) => {

      console.log(responses);

      alert(
        'All Entitlements Saved Successfully'
      );

      this.currentStep = 2;

    },

    error: (err) => {

      console.error(err);

      alert(
        'Error while saving entitlements'
      );

    }

  });

}

registerleaveApplicable(): void {

  const selectedEmployees =
    this.FilteredEmployees
      .filter(x => x.selected)
      .map(x => x.id);

  const companyData = {

    leave_type: this.selectedLeaveTypeId,

    gender:
      this.gender === 'B'
        ? null
        : this.gender,

    branch:
      this.selectedBranches,

    department:
      this.selectedDepartments,

    category:
      this.selectedCategories,

    designation:
      this.selectedDesignations,

    employee:
      selectedEmployees

  };

  this.leaveService
      .registerApplicablepolicy(companyData)
      .subscribe({

        next: (response: any) => {

          alert(
            response?.message ||
            response?.success ||
            'Applicable Policy Saved Successfully'
          );

          this.currentStep =
            this.hasPayRuleEnabled ? 4 : 3;

        },

        error: (err) => {

          alert(
            err?.error?.message ||
            err?.error?.error ||
            'Applicable Policy Save Failed'
          );

        }

      });

}



registerleaveEntitlementFixed(): void {

  if (!this.leave_type) {
    alert('Select Leave Type');
    return;
  }

  this.registerButtonClicked = true;

  const payload = {

    leave_type: this.leave_type,
  
    min_experience:
      this.min_experience || null,
  
    effective_after_from:
      this.effective_after_from || null,
  
    effective_after_unit:
      this.effective_after_unit || null,
  
    accrual_rate:
      this.accrual
        ? this.accrual_rate || null
        : null,
  
    accrual_frequency:
      this.accrual
        ? this.accrual_frequency || null
        : null,
  
    accrual_month:
      this.accrual
        ? this.accrual_month || null
        : null,
  
    accrual_day:
      this.accrual
        ? this.accrual_day || null
        : null,
  
    prorate_type:
      this.prorate_type || null,
  
    prorate_accrual:
      this.prorate_accrual,
  
    accrual:
      this.accrual,
  
    created_by:
      this.created_by,
  
    branches:
      this.branch || [],
  
    categories:
      this.categories || [],
  
    departments:
      this.departments || [],
  
    designations:
      this.designations || [],
  
    reset_policy: this.reset
      ? {
          reset: true,
  
          frequency:
            this.frequency || null,
  
          month:
            this.month || null,
  
          day:
            this.day || null,
  
          allow_cf:
            this.allow_cf,
  
          carry_forward_choice:
            this.carry_forward_choice || null,
  
          cf_value:
            this.cf_value || null,
  
          cf_unit_or_percentage:
            this.cf_unit_or_percentage || null,
  
          cf_max_limit:
            this.cf_max_limit || null,
  
          allow_encashment:
            this.allow_encashment,
  
          encashment_value:
            this.encashment_value || null,
  
          encashment_unit_or_percentage:
            this.encashment_unit_or_percentage || null,
  
          encashment_max_limit:
            this.encashment_max_limit || null,
  
          opening_balance:
            this.opening_balance || null
        }
      : {
          reset: false
        }
  
  };
  this.leaveService.registerLeaveEntitlement(payload).subscribe({

    next: (res: any) => {

      alert(
        res?.message ||
        res?.success ||
        '✅ Leave Entitlement Added Successfully'
      );

      if (this.showPayRuleStep) {

        this.currentStep = 2; // Pay Rule
      
      } else {
      
        this.currentStep = 2; // Applicable
      
      }

      console.log('Success Response:', res);

    },

    error: (err) => {

      console.error('Error Response:', err);

      const errorMessage =
        err?.error?.message ||
        err?.error?.error ||
        err?.error?.detail ||
        JSON.stringify(err?.error) ||
        'Failed to create Leave Entitlement';

      alert(errorMessage);

    }

  });

}


registerleaveApplicableFixed(): void {

  const selectedEmployees =
  this.FilteredEmployees
    .filter(x => x.selected)
    .map(x => x.id);

const companyData = {

  leave_type: this.selectedLeaveTypeId,

  gender:
    this.gender === 'B'
      ? null
      : this.gender,

  branch:
    this.selectedBranches,

  department:
    this.selectedDepartments,

  category:
    this.selectedCategories,

  designation:
    this.selectedDesignations,

  employee:
    selectedEmployees

};

this.leaveService
    .registerApplicablepolicy(companyData)
    .subscribe({

      next: (response: any) => {

        alert(
          response?.message ||
          response?.success ||
          'Applicable Policy Saved Successfully'
        );

        this.currentStep =
          this.hasPayRuleEnabled ? 4 : 3;

      },

      error: (err) => {

        alert(
          err?.error?.message ||
          err?.error?.error ||
          'Applicable Policy Save Failed'
        );

      }

    });

}



submitPayRule(): void {

  const selectedSchema =
    this.authService.getSelectedSchema();

  const payload = {

    sequence:
      this.payRuleData.sequence,

    days:
      this.payRuleData.days,

    pay_percentage:
      this.payRuleData.pay_percentage,

    leave_type:
      this.selectedLeaveTypeId,

    created_by:
      this.userId

  };

  this.http.post(
    `${this.apiUrl}/calendars/api/leave-pay-rule/?schema=${selectedSchema}`,
    payload
  ).subscribe({

    next: () => {

      alert('Pay Rule Saved Successfully');

      this.currentStep = 3;

    },

    error: (err) => {

      alert(
        err?.error?.message ||
        err?.error?.error ||
        'Pay Rule Save Failed'
      );

    }

  });

}

submitPayRuleFixed(): void {
  const selectedSchema =
    this.authService.getSelectedSchema();

  const payload = {

    sequence:
      this.payRuleData.sequence,

    days:
      this.payRuleData.days,

    pay_percentage:
      this.payRuleData.pay_percentage,

    leave_type:
      this.selectedLeaveTypeId,

    created_by:
      this.userId

  };

  this.http.post(
    `${this.apiUrl}/calendars/api/leave-pay-rule/?schema=${selectedSchema}`,
    payload
  ).subscribe({

    next: () => {

      alert('Pay Rule Saved Successfully');

      this.currentStep = 3;

    },

    error: (err) => {

      alert(
        err?.error?.message ||
        err?.error?.error ||
        'Pay Rule Save Failed'
      );

    }

  });

}



// stepper functions


currentStep: number = 1;

nextStep(): void {

  const maxStep = this.showPayRuleStep ? 4 : 3;

  if (this.currentStep < maxStep) {

    this.currentStep++;

  }

}

previousStep(): void {
  if (this.currentStep > 1) {
    this.currentStep--;
  }
}





showPayRuleStep = false;

selectedLeaveTypeForModal: any = null;

payRuleData = {
  sequence: null,
  days: null,
  pay_percentage: null
};

createdEntitlementId: number | null = null;


onLeaveTypeChange(row: any): void {

  const selectedLeaveType = this.LeaveTypes.find(
    x => x.id == row.leave_type
  );

  row.enable_leave_pay_rule =
    selectedLeaveType?.enable_leave_pay_rule || false;

  this.selectedLeaveTypeId = row.leave_type;

}


get hasPayRuleEnabled(): boolean {

  return this.entitlementRows.some(
    row => row.enable_leave_pay_rule === true
  );

}


// edit section


isEditMode = false;

editEntitlementData: any;

editApplicableData: any;



loadPolicyForEdit(entitlement: any): void {

  this.patchMultipleEntitlements(entitlement);

  const selectedSchema =
      this.authService.getSelectedSchema();

  const savedIds =
      JSON.parse(
        localStorage.getItem('selectedBranchIds') || '[]'
      );

  this.leaveService
      .getLeaveApplicables(
        selectedSchema!,
        savedIds
      )
      .subscribe((result: any[]) => {

        const applicable =
          result.find(
            x =>
              x.leave_type ===
              entitlement.leave_type_name
          );

        if(applicable){

          this.patchApplicable(
            applicable
          );

        }

      });

}



// patchEntitlement(data: any): void {

//   this.createdEntitlementId =
//     data.id;

//   this.leave_type =
//     data.leave_type;

//   this.min_experience =
//     data.min_experience;

//   this.effective_after_unit =
//     data.effective_after_unit;

//   this.effective_after_from =
//     data.effective_after_from;

//   this.branch =
//     data.branches || [];

//   this.departments =
//     data.departments || [];

//   this.designations =
//     data.designations || [];

//   this.categories =
//     data.categories || [];

//   this.accrual =
//     data.accrual;

//   this.accrual_rate =
//     data.accrual_rate;

//   this.accrual_frequency =
//     data.accrual_frequency;

//   this.accrual_month =
//     data.accrual_month;

//   this.accrual_day =
//     data.accrual_day;

//   this.prorate_accrual =
//     data.prorate_accrual;

//   if(data.reset_policy){

//       const r =
//         data.reset_policy;

//       this.reset =
//         r.reset;

//       this.frequency =
//         r.frequency;

//       this.month =
//         r.month;

//       this.day =
//         r.day;

//       this.allow_cf =
//         r.allow_cf;

//       this.allow_encashment =
//         r.allow_encashment;

//       this.cf_value =
//         r.cf_value;

//       this.cf_max_limit =
//         r.cf_max_limit;

//       this.cf_unit_or_percentage =
//         r.cf_unit_or_percentage;

//       this.encashment_value =
//         r.encashment_value;

//       this.encashment_max_limit =
//         r.encashment_max_limit;

//       this.encashment_unit_or_percentage =
//         r.encashment_unit_or_percentage;

//       this.opening_balance =
//         r.opening_balance;

//   }

// }

patchMultipleEntitlements(
  entitlements: any[]
): void {

  this.entitlementRows = [];

  entitlements.forEach(item => {

    const row =
      this.createEntitlementRow();

    row.id =
      item.id;

    row.leave_type =
      item.leave_type;

    row.min_experience =
      item.min_experience;

    row.effective_after_unit =
      item.effective_after_unit;

    row.effective_after_from =
      item.effective_after_from;

    row.branch =
      item.branches || [];

    row.departments =
      item.departments || [];

    row.designations =
      item.designations || [];

    row.categories =
      item.categories || [];

    row.accrual =
      item.accrual;

    row.accrual_rate =
      item.accrual_rate;

    row.accrual_frequency =
      item.accrual_frequency;

    row.accrual_month =
      item.accrual_month;

    row.accrual_day =
      item.accrual_day;

    row.prorate_accrual =
      item.prorate_accrual;

    if (item.reset_policy) {

      const r =
        item.reset_policy;

      row.reset =
        true;

      row.frequency =
        r.frequency;

      row.month =
        r.month;

      row.day =
        r.day;

      row.allow_cf =
        r.allow_cf;

      row.carry_forward_choice =
        r.carry_forward_choice;

      row.cf_value =
        r.cf_value;

      row.cf_unit_or_percentage =
        r.cf_unit_or_percentage;

      row.cf_max_limit =
        r.cf_max_limit;

      row.cf_expires_in_value =
        r.cf_expires_in_value;

      row.cf_time_choice =
        r.cf_time_choice;

      row.allow_encashment =
        r.allow_encashment;

      row.encashment_value =
        r.encashment_value;

      row.encashment_unit_or_percentage =
        r.encashment_unit_or_percentage;

      row.encashment_max_limit =
        r.encashment_max_limit;

      row.opening_balance =
        r.opening_balance;

    }

    this.onAccrualFrequencyChange(row);

    this.onResetFrequencyChange(row);

    this.entitlementRows.push(row);

  });

}

patchApplicable(data: any): void {

  this.editApplicableData =
    data;

  this.gender =
    data.gender;

}


updateLeaveEntitlement(
  id:number,
  payload:any
): Observable<any>{

  const selectedSchema =
    localStorage.getItem(
      'selectedSchema'
    );

  return this.http.put(

    `${this.apiUrl}/calendars/api/leave-entitlement/${id}/?schema=${selectedSchema}`,

    payload

  );

}




updateEntitlement(): void {

  const requests = this.entitlementRows.map(row => {

    const payload = {

      leave_type: row.leave_type,

      min_experience: row.min_experience,

      effective_after_unit:
        row.effective_after_unit,

      effective_after_from:
        row.effective_after_from,

      branches: row.branch,

      departments: row.departments,

      designations: row.designations,

      categories: row.categories,

      accrual: row.accrual,

      accrual_rate: row.accrual_rate,

      accrual_frequency: row.accrual_frequency,

      accrual_month: row.accrual_month,

      accrual_day: row.accrual_day,

      prorate_accrual: row.prorate_accrual,

      reset_policy: row.reset ? {

        reset: true,

        frequency: row.frequency,

        month: row.month,

        day: row.day,

        allow_cf: row.allow_cf,

        carry_forward_choice:
          row.carry_forward_choice,

        cf_value: row.cf_value,

        cf_unit_or_percentage:
          row.cf_unit_or_percentage,

        cf_max_limit: row.cf_max_limit,

        cf_expires_in_value:
          row.cf_expires_in_value,

        cf_time_choice:
          row.cf_time_choice,

        allow_encashment:
          row.allow_encashment,

        encashment_value:
          row.encashment_value,

        encashment_unit_or_percentage:
          row.encashment_unit_or_percentage,

        encashment_max_limit:
          row.encashment_max_limit,

        opening_balance:
          row.opening_balance

      } : null

    };

    return this.leaveService.updateLeaveEntitlement(
      row.id,
      payload
    );

  });

  forkJoin(requests).subscribe({

    next: () => {

      alert('Leave Policy Updated Successfully');

      this.dialogRef.close(true);

    },

    error: (err) => {

      console.error(err);

      alert('Update Failed');

    }

  });

}

// multiple entitlement save
entitlementRows: any[] = [
  this.createEntitlementRow()
];

createEntitlementRow() {
  return {

    id: null,   // <-- ADD THIS

    leave_type: null,  // <-- ADD THIS ALSO

    min_experience: null,
    effective_after_from: 'date_of_joining',
    effective_after_unit: 'months',

    branch: [],
    departments: [],
    designations: [],
    categories: [],

    accrual: false,
    accrual_rate: null,
    accrual_frequency: 'months',
    accrual_month: null,
    accrual_day: null,
    prorate_type: null,
    prorate_accrual: false,

    showMonth: false,
    showDay: true,

    reset: false,
    frequency: 'years',
    month: null,
    day: null,

    showResetMonth: true,
    showResetDay: true,

    allow_cf: false,
    carry_forward_choice: null,
    cf_value: null,
    cf_unit_or_percentage: null,
    cf_max_limit: null,
    cf_expires_in_value: null,
    cf_time_choice: null,

    allow_encashment: false,
    encashment_value: null,
    encashment_unit_or_percentage: null,
    encashment_max_limit: null,

    opening_balance: null
  };
}

addEntitlementRow(): void {

  this.entitlementRows.push(
    this.createEntitlementRow()
  );

}

removeEntitlementRow(index: number): void {

  if (this.entitlementRows.length > 1) {

    this.entitlementRows.splice(index, 1);

  }

}

}
