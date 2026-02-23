import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from './leave.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { DesignationService } from '../designation-master/designation.service';
import { FormGroup } from '@angular/forms';
import { EmployeeService } from '../employee-master/employee.service';
import { formatDate } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CreateLeavetypeComponent } from '../create-leavetype/create-leavetype.component';
import {combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';




@Component({
  selector: 'app-leave-master',
  templateUrl: './leave-master.component.html',
  styleUrl: './leave-master.component.css'
})
export class LeaveMasterComponent {

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

  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  ThridFormGroup!: FormGroup

  isLinear = true;

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
  prorate_type:any = '';
  leave_type: any = '';

  accrual: boolean = false;

  prorate_accrual: boolean = false;

  


  registerButtonClicked: boolean = false;




  showMonth: boolean = false; // Controls the visibility of the "Month" dropdown
  showDay: boolean = false;   // Controls the visibility of the "Day" dropdown

  showResetMonth: boolean = false; // Controls the visibility of the reset "Month" dropdown
  showResetDay: boolean = false;   // Controls the visibility of the reset "Day" dropdown



  gender: any = '';
  branch: any = '';
  designation: any = '';
  department: any = '';
  role: any = '';

  branches: any[] = [];
  departments: any[] = [];
  designations: any[] = [];
  categories: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

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


  reset: boolean = true;

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

  allow_cf:boolean =false;
  allow_encashment: boolean = false;

  // reset_date: any = '';
  // initial_balance: any = '';
  // carry_forward_amount: any = '';
  // encashment_amount: any = '';
  // final_balance: any = '';
  // year: any = '';
  // employee: any = '';
  // leave_type: any = '';


  

  


  selectedFile!: File | null;

  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectDept') selectDept: MatSelect | undefined;
  @ViewChild('selectDes') selectDes: MatSelect | undefined;
  @ViewChild('selectCat') selectCat: MatSelect | undefined;


  
  @ViewChild('selectcon') selectcon: MatSelect | undefined;
  @ViewChild('selectDeptcon') selectDeptcon: MatSelect | undefined;
  @ViewChild('selectDescon') selectDescon: MatSelect | undefined;
  @ViewChild('selectCatcon') selectCatcon: MatSelect | undefined;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DesignationService: DesignationService,
    private employeeService: EmployeeService,
    private dialog:MatDialog,
    private DepartmentServiceService: DepartmentServiceService




  ) { }

  ngOnInit(): void {
    this.LoadBranch();

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
  });


    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {

      this.loadLeaveEntitlements();
      this.loadLeaveRestValues();


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



// Toggle edit icon
showEditBtn: boolean = false;
EditShowButtons() {
  this.showEditBtn = !this.showEditBtn;
}

// Delete logic
Delete: boolean = false;
allSelecteds: boolean = false;

toggleCheckboxes() {
  this.Delete = !this.Delete;
}

toggleSelectAllLeaveTypes() {
  this.allSelecteds = !this.allSelecteds;
  this.LeaveTypes.forEach(leave => leave.selected = this.allSelecteds);
}

// ===== EDIT LEAVE TYPE =====
isLeaveTypeEditModalOpen: boolean = false;
editLeaveType: any = {};

openEditLeaveTypeModal(type: any): void {
  this.editLeaveType = { ...type }; // clone
  this.isLeaveTypeEditModalOpen = true;
}

closeEditLeaveTypeModal(): void {
  this.isLeaveTypeEditModalOpen = false;
  this.editLeaveType = {};
}





deleteSelectedLeavetype() {
  const selectedLeaveIds = this.LeaveTypes
    .filter(leave => leave.selected)
    .map(leave => leave.id);

  if (selectedLeaveIds.length === 0) {
    alert('No Leave Type selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Leave Type(s)?')) {
    let total = selectedLeaveIds.length;
    let completed = 0;

    selectedLeaveIds.forEach(id => {
      this.leaveService.deleteLeavetype(id).subscribe(
        () => {
          console.log('Leave Type deleted successfully:', id);
          // Remove deleted leave type from local list
          this.LeaveTypes = this.LeaveTypes.filter(leave => leave.id !== id);

          completed++;
          if (completed === total) {
            alert('Selected Leave Types deleted successfully!');
            window.location.reload();
          }
        },
        (error) => {
          console.error('Error deleting Leave Type:', error);
          alert('Error deleting Leave Type: ' + error.statusText);
        }
      );
    });
  }
}




updateLeavetype(): void {
  if (!this.editLeaveType.id) {
    alert('Leave Type ID missing');
    return;
  }

  const payload = { ...this.editLeaveType };
  delete payload.image; // backend-safe

  this.leaveService.updateLeavetype(this.editLeaveType.id, payload)
    .subscribe(
      () => {
        alert('Leave Type updated successfully!');
        this.closeEditLeaveTypeModal();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating Leave Type:', error);

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
















  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
  }



  registerleaveType(): void {
    this.registerButtonClicked = true;
  
    if (!this.name || !this.code) {
      alert('Please fill in all required fields.');
      return;
    }
  
    // Convert valid_from and valid_to to 'YYYY-MM-DD'
    const formattedValidFrom = this.valid_from ? formatDate(this.valid_from, 'yyyy-MM-dd', 'en-US') : '';
    const formattedValidTo = this.valid_to ? formatDate(this.valid_to, 'yyyy-MM-dd', 'en-US') : '';
  
    console.log("Formatted valid_from:", formattedValidFrom);  // Debugging
    console.log("Formatted valid_to:", formattedValidTo);  // Debugging
  
    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('code', this.code);
    formData.append('type', this.type);
    formData.append('unit', this.unit);
    formData.append('valid_from', formattedValidFrom);  // ✅ Fixing Date Format
    formData.append('valid_to', formattedValidTo);      // ✅ Fixing Date Format
    formData.append('description', this.description);
    formData.append('created_by', this.created_by);
    formData.append('negative', this.negative.toString());
    formData.append('allow_half_day', this.allow_half_day.toString());
    formData.append('include_weekend_and_holiday', this.include_weekend_and_holiday.toString());
    formData.append('use_common_workflow', this.use_common_workflow.toString());
    formData.append('include_dashboard', this.include_dashboard.toString());
  
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
  
    this.leaveService.registerLeaveType(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Leave type has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
  
        let errorMessage = 'An unexpected error occurred. Please try again.';
  
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.error.non_field_errors) {
            errorMessage = error.error.non_field_errors.join(', ');
          } else {
            errorMessage = Object.keys(error.error)
              .map((field) => `${field}: ${error.error[field].join(', ')}`)
              .join('\n');
          }
        }
  
        alert(errorMessage);
      }
    );
  }
  

  // checkViewPermission(permissions: any[]): boolean {
  //   const requiredPermission = ' add_leave_entitlement' ||'change_leave_entitlement' ||'delete_leave_entitlement' ||'view_leave_entitlement';


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
  
  registerleaveEntitlement(): void {
    this.registerButtonClicked = true;
  
    const companyData = {
      min_experience: this.min_experience,
      effective_after_from: this.effective_after_from,
      effective_after_unit: this.effective_after_unit,
   
       
      accrual_rate: this.accrual_rate,
      accrual_frequency: this.accrual_frequency,
      accrual_month: this.accrual_month,
      accrual_day: this.accrual_day,
  
      prorate_type: this.prorate_type,
  
      leave_type: this.selectedLeaveTypeForModal.id,
      created_by: this.created_by,
  
      // ⭐ MULTI SELECT FIELDS — now sent as JSON arrays
      branches: this.branch?.length ? this.branch : [],
      categories: this.categories?.length ? this.categories : [],
      departments: this.departments?.length ? this.departments : [],
      designations: this.designations?.length ? this.designations : [],
      prorate_accrual: this.prorate_accrual,
      accrual: this.accrual,
    };
  
    this.leaveService.registerLeaveEntitlement(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Leave Entitlement has been added');
        this.loadLeaveEntitlements();
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
        alert('Enter all required fields!');
      }
    );
  }
  

  registerleaveReset(): void {
    this.registerButtonClicked = true;
  
    const formData = new FormData();
      
      formData.append('frequency', this.frequency);
      formData.append('month', this.month);
      formData.append('day', this.day);
      formData.append('carry_forward_choice', this.carry_forward_choice);
      formData.append('cf_value', this.cf_value);
      formData.append('cf_unit_or_percentage', this.cf_unit_or_percentage);
      formData.append('cf_max_limit', this.cf_max_limit);
      formData.append('cf_expires_in_value', this.cf_expires_in_value);
      formData.append('cf_time_choice', this.cf_time_choice);
      formData.append('encashment_value', this.encashment_value);
      formData.append('encashment_unit_or_percentage', this.encashment_unit_or_percentage);
      formData.append('encashment_max_limit', this.encashment_max_limit);
      formData.append('leave_type', this.selectedLeaveTypeForModal.id);

      formData.append('reset', this.reset.toString());
      formData.append('allow_cf', this.allow_cf.toString());
      formData.append('allow_encashment', this.allow_encashment.toString());

  
    this.leaveService.requestLeaveResetPolicy(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Leave Reset has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
  
        // Extract backend error message
        let errorMessage = 'An unexpected error occurred. Please try again.';
  
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error; // If backend returns a plain string message
          } else if (error.error.detail) {
            errorMessage = error.error.detail; // If backend returns { detail: "message" }
          } else if (error.error.non_field_errors) {
            errorMessage = error.error.non_field_errors.join(', '); // Handle non-field errors array
          } else {
            // Handle field-specific errors
            const fieldErrors = Object.keys(error.error)
              .map((field) => `${field}: ${error.error[field]}`)
              .join('\n');
            errorMessage = fieldErrors || errorMessage;
          }
        }
  
        alert(errorMessage); // Show extracted error
      }
    );
  }

  toggleFlip(leavetype: any): void {
    // Toggle the 'flipped' property on the current card
    leavetype.flipped = !leavetype.flipped;
  }
  
  
  // Add this variable to your component
filteredEntitlements: any[] = [];


  // Call this method to load all leave entitlement records (e.g., after registration or on init)
loadLeaveEntitlements(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return;
  }
  
  this.leaveService.getAllLeaveEntitlements(selectedSchema).subscribe(
    (result: any) => {
      console.log('Fetched leave entitlements:', result);
      this.leaveEntitlements = result; // Assuming your API returns an array of records
    },
    (error) => {
      console.error('Error fetching leave entitlements:', error);
    }
  );
}





  // Call this method to load all leave entitlement records (e.g., after registration or on init)
  loadLeaveRestValues(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return;
    }
    
    this.leaveService.getAllLeaveResetValues(selectedSchema).subscribe(
      (result: any) => {
        console.log('Fetched leave entitlements:', result);
        this.leaveRests = result; // Assuming your API returns an array of records
      },
      (error) => {
        console.error('Error fetching leave entitlements:', error);
      }
    );
  }

  // LoadLeavetype(selectedSchema: string) {
  //   this.leaveService.getLeaveType(selectedSchema).subscribe(
  //     (data: any) => {
  //       this.LeaveTypes = data;

  //       console.log('employee:', this.LeaveTypes);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching categories:', error);
  //     }
  //   );
  // }


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



  registerleaveApplicable(): void {
      this.registerButtonClicked = true;

  // ✅ STEP 1: Frontend validation (REQUIRED)
  const hasSelection =
    (this.branch && this.branch.length > 0) ||
    (this.department && this.department.length > 0) ||
    (this.designation && this.designation.length > 0) ||
    (this.role && this.role.length > 0);

  if (!hasSelection) {
    alert('Please select at least one: Branch, Department, Designation, or Role');
    return; // ⛔ STOP API CALL
  }
  
    const formData: any = {
      gender: this.gender === 'B' ? null : this.gender,
      leave_type: this.selectedLeaveTypeForModal.id,
      branch: this.branch && this.branch.length > 0 ? this.branch.map((b: any) => Number(b)) : [], // Send [] if empty
      department: this.department && this.department.length > 0 ? this.department.map((d: any) => Number(d)) : [],
      designation: this.designation && this.designation.length > 0 ? this.designation.map((des: any) => Number(des)) : [],
      role: this.role && this.role.length > 0 ? this.role.map((r: any) => Number(r)) : [],
    };
  
    this.leaveService.registerLeaveapplicable(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Leave Applicable has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
  
        // Extract backend validation error messages
        if (error.error) {
          let errorMessage = '';
          for (const key in error.error) {
            if (error.error.hasOwnProperty(key)) {
              errorMessage += `${key}: ${error.error[key].join(', ')}\n`;
            }
          }
          alert(errorMessage);
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    );
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




  onAccrualFrequencyChange(): void {
    if (this.accrual_frequency === 'years') {
      this.showMonth = true;  // Show month dropdown
      this.showDay = true;    // Show day dropdown
    } else if (this.accrual_frequency === 'months') {
      this.showMonth = false; // Hide month dropdown
      this.showDay = true;    // Show day dropdown
    } else {
      this.showMonth = false; // Hide both dropdowns
      this.showDay = false;
    }
  }


  onResetFrequencyChange(): void {
    if (this.frequency === 'years') {
      this.showResetMonth = true;  // Show month dropdown
      this.showResetDay = true;    // Show day dropdown
    } else if (this.frequency === 'months') {
      this.showResetMonth = false; // Hide month dropdown
      this.showResetDay = true;   
      
    
      // Show day dropdown
    } else {
      this.showResetMonth = false; // Hide both dropdowns
      this.showResetDay = false;
    }
  }



  selectedLeaveTypeForModal: any = null;

  isLeavetypeCreationModalOpen:boolean=false;

  filteredLeaveRests: any[] = [];

// This method is called when the "Configure leave type" button is clicked
openLeaveConfigurationModal(leavetype: any): void {
  // 1. Set the selected leave type
  this.selectedLeaveTypeForModal = { ...leavetype }; 
  this.isLeavetypeCreationModalOpen = true;

  // 2. Filter Entitlements (previous step)
  this.filteredEntitlements = this.leaveEntitlements.filter(ent => 
    ent.leave_type === leavetype.name
  );

  // 3. Filter Reset Values (new step)
  // We match ent.leave_type from the Reset JSON to the clicked card's name
  this.filteredLeaveRests = this.leaveRests.filter(res => 
    res.leave_type === leavetype.name
  );

  console.log('Filtered Reset Values for:', leavetype.name, this.filteredLeaveRests);
}


  ClosePopup(){
    this.isLeavetypeCreationModalOpen=false;
  }

  CreateLeaveModal(){
    this.dialog.open(CreateLeavetypeComponent,{
      width:'80%',
      height:'700px',
    })
  }





}
