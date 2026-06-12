import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { LeaveService } from '../leave-master/leave.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import { AuthenticationService } from '../login/authentication.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatDialogRef } from '@angular/material/dialog';
import { combineLatest, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { MatOption, MatSelect } from '@angular/material/select';
import { DesignationService } from '../designation-master/designation.service';

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



  constructor(
    private http: HttpClient,
    private leaveService: LeaveService,
    private sessionService: SessionService,

    private employeeService: EmployeeService,

    private authService: AuthenticationService,
    private DepartmentServiceService: DepartmentServiceService,
    private DesignationService: DesignationService,
    public dialogRef: MatDialogRef<CreateleavepolicymodalComponent>,

    private ref: MatDialogRef<CreateleavepolicymodalComponent>) { }

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

  nextStep() {

    if (!this.selectedPolicy) {
      return;
    }

    this.showPolicySelection = false;

    this.dialogRef.updateSize('1400px', '90vh');
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






  registerleaveEntitlement(): void {
    
    if (!this.leave_type) {
      alert('Select Leave Type');
      return;
    }

    this.registerButtonClicked = true;

    const payload = {

      leave_type: this.leave_type,
    
      min_experience: this.min_experience,
    
      effective_after_from: this.effective_after_from,
    
      effective_after_unit: this.effective_after_unit,
    
      accrual_rate: this.accrual_rate,
    
      accrual_frequency: this.accrual_frequency,
    
      accrual_month: this.accrual_month,
    
      accrual_day: this.accrual_day,
    
      prorate_type: this.prorate_type,
    
      prorate_accrual: this.prorate_accrual,
    
      accrual: this.accrual,
    
      created_by: this.created_by,
    
      branches: this.branch || [],
    
      categories: this.categories || [],
    
      departments: this.departments || [],
    
      designations: this.designations || [],
    
      reset_policy: {
    
          reset: this.reset,
    
          frequency: this.frequency,
    
          month: this.month,
    
          day: this.day,
    
          allow_cf: this.allow_cf,
    
          carry_forward_choice: this.carry_forward_choice,
    
          cf_value: this.cf_value,
    
          cf_unit_or_percentage: this.cf_unit_or_percentage,
    
          cf_max_limit: this.cf_max_limit,
    
          allow_encashment: this.allow_encashment,
    
          encashment_value: this.encashment_value,
    
          encashment_unit_or_percentage:
              this.encashment_unit_or_percentage,
    
          encashment_max_limit:
              this.encashment_max_limit,
    
          opening_balance:
              this.opening_balance
      }
    
    };




    this.leaveService
      .registerLeaveEntitlement(payload)
      .subscribe({

        next: (res: any) => {

          alert('✅ Entitlement Added');



        },

        error: (err) => {

          console.error(err);

          alert('Create failed');

        }

      });


  }












}
