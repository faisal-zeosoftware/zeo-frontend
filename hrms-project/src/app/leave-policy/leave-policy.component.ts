import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';

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
import { environment } from '../../environments/environment';
import { LeaveService } from '../leave-master/leave.service';
import { CreateleavepolicymodalComponent } from '../createleavepolicymodal/createleavepolicymodal.component';


@Component({
  selector: 'app-leave-policy',
  templateUrl: './leave-policy.component.html',
  styleUrl: './leave-policy.component.css'
})
export class LeavePolicyComponent {




  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;


  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names




  private apiUrl = environment.apiBaseUrl;

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


  EntitlementResets: any[] = [];


leavePolicies: any[] = [];


  Applicable: any[] = [];


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
  branch: any = '';
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
  opening_balance: any = '';

  allow_cf:boolean =false;
  allow_encashment: boolean = false;


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



    this.employeeService.selectedBranches$.subscribe(ids => {
      
      this.loadEntitlementReset();
      this.loadLeaveApplicable();

    });

    const selectedSchema = this.authService.getSelectedSchema();
   
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

deleteSelectedLeavetype() {
}

toggleSelectAllLeaveTypes() {
}


CreateLeaveModal() {
  this.dialog.open(CreateleavepolicymodalComponent,{
      width: '500px',
      height:'700px',
  });
}





registerleaveEntitlement(): void {

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


    created_by: this.created_by,

    branches: this.branch || [],

    categories: this.categories || [],

    departments: this.departments || [],

    designations: this.designations || [],

    prorate_accrual: this.prorate_accrual,

    accrual: this.accrual,



    // reset section

    frequency:this.frequency,

    month:this.month,

    day:this.day,

    carry_forward_choice:this.carry_forward_choice,


    cf_value:this.cf_value,

    cf_unit_or_percentage:this.cf_unit_or_percentage,

    cf_max_limit:this.cf_max_limit,

    encashment_value:this.encashment_value,

    encashment_unit_or_percentage:this.encashment_unit_or_percentage,

    encashment_max_limit:this.encashment_max_limit,

    opening_balance:this.opening_balance,

    reset:this.reset,

    allow_cf:this.allow_cf,

    allow_encashment:this.allow_encashment,









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

  

// registerleaveReset(): void {

//   const formData = new FormData();

//   formData.append('leave_entitlement', this.leave_entitlement);
//   formData.append('leave_type', this.selectedLeaveTypeForModal.id);

//   formData.append('frequency', this.frequency || '');
//   formData.append('month', this.month || '');
//   formData.append('day', this.day || '');

//   formData.append('carry_forward_choice', this.carry_forward_choice || '');
//   formData.append('cf_value', this.cf_value || '');
//   formData.append('cf_unit_or_percentage', this.cf_unit_or_percentage || '');
//   formData.append('cf_max_limit', this.cf_max_limit || '');

//   formData.append('encashment_value', this.encashment_value || '');
//   formData.append('encashment_unit_or_percentage', this.encashment_unit_or_percentage || '');
//   formData.append('encashment_max_limit', this.encashment_max_limit || '');

//   formData.append('opening_balance', this.opening_balance || '');

//   formData.append('reset', this.reset.toString());
//   formData.append('allow_cf', this.allow_cf.toString());
//   formData.append('allow_encashment', this.allow_encashment.toString());

//   // ===== UPDATE =====
//   if (this.isResetEditMode && this.selectedResetId) {

//     this.leaveService
//       .updateLeaveResetPolicy(this.selectedResetId, formData)
//       .subscribe({

//         next: () => {

//           alert('✅ Reset Updated Successfully');

       

//           window.location.reload();

//         },

//         error: (err) => {

//           console.error(err);

//           alert('Reset update failed');

//         }

//       });

//   }

//   // ===== CREATE =====
//   else {

//     this.leaveService
//       .requestLeaveResetPolicy(formData)
//       .subscribe({

//         next: () => {

//           alert('✅ Reset Added Successfully');

      

//           window.location.reload();

//         },

//         error: (err) => {

//           console.error(err);

//           alert('Reset create failed');

//         }

//       });

//   }

// }





loadEntitlementReset(callback?: Function): void {

  const selectedSchema =
    this.authService.getSelectedSchema();

  const savedIds =
    JSON.parse(
      localStorage.getItem('selectedBranchIds') || '[]'
    );

  if (selectedSchema) {

    this.leaveService
      .getLeaveEntitlementReset(
        selectedSchema,
        savedIds
      )
      .subscribe(

        (result: any) => {

          this.EntitlementResets = result;

          this.leavePolicies =
            result.filter(
              (item: any, index: number, self: any[]) =>
                index ===
                self.findIndex(
                  x =>
                    x.leave_type ===
                    item.leave_type
                )
            );

          if (callback) {
            callback();
          }

        },

        error => {

          console.error(error);

        }

      );

  }

}



  loadLeaveApplicable(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
  
    if (selectedSchema) {
      this.leaveService.getLeaveApplicables(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Applicable = result;
          
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }





    editLeavePolicy(entitlement: any): void {

      const allRows =
        this.EntitlementResets.filter(
          x =>
            x.leave_type ===
            entitlement.leave_type
        );
    
      this.dialog.open(
        CreateleavepolicymodalComponent,
        {
          width: '90%',
          height: '90%',
          data: {
    
            editMode: true,
    
            leaveType:
              entitlement.leave_type,
    
            entitlements:
              allRows
    
          }
        }
      );
    
    }



}
