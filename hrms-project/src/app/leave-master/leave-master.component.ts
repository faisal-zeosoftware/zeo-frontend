import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, ElementRef } from '@angular/core';
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
import { environment } from '../../environments/environment';






@Component({
  selector: 'app-leave-master',
  templateUrl: './leave-master.component.html',
  styleUrl: './leave-master.component.css'
})
export class LeaveMasterComponent {

  @ViewChild('applicableFormSection')
applicableFormSection!: ElementRef;

@ViewChild('payRuleTopSection')
payRuleTopSection!: ElementRef;

@ViewChild('leaveApplicableTopSection')
leaveApplicableTopSection!: ElementRef;

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

  include_holiday: boolean = false;
  include_weekend: boolean = false;


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
  leave_category: any = '';
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
      this.loadLeavePayRules();
      this.loadLeaveApplicable();


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


  onTogglePayRule(event: any): void {
  this.showPayRuleForm = event.checked;

  if (!event.checked) {
    this.payRuleData = { sequence: null, days: null, pay_percentage: null};
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
    formData.append('leave_category', this.leave_category);
    formData.append('code', this.code);
    formData.append('type', this.type);
    formData.append('unit', this.unit);
    formData.append('valid_from', formattedValidFrom);  // ✅ Fixing Date Format
    formData.append('valid_to', formattedValidTo);      // ✅ Fixing Date Format
    formData.append('description', this.description);
    formData.append('created_by', this.created_by);
    formData.append('negative', this.negative.toString());
    formData.append('allow_half_day', this.allow_half_day.toString());
    formData.append('include_holiday', this.include_holiday.toString());
    formData.append('include_weekend', this.include_weekend.toString());
    formData.append('include_dashboard', this.include_dashboard.toString());
    formData.append('enable_leave_pay_rule', this.enable_leave_pay_rule.toString());
  
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
  
this.leaveService.registerLeaveType(formData).subscribe(
  (response: any) => {
    console.log('Registration successful', response);

    if (response.enable_leave_pay_rule) {
      this.showPayRuleForm = true;   // ✅ SHOW TAB
      this.currentEntitlementId = response.id; // ✅ STORE ID
    }

    alert('Leave type has been added');

    // ❌ REMOVE THIS
    // window.location.reload();
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
  

  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

showPayRuleForm: boolean = false;

payRuleData = {
  sequence: null,
  days: null,
  pay_percentage: null
};;




submitPayRule(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!this.selectedLeaveTypeForModal?.id) {
    alert('Leave Type missing!');
    return;
  }

  const payload = {
    sequence: this.payRuleData.sequence,
    days: this.payRuleData.days,
    pay_percentage: this.payRuleData.pay_percentage,
    leave_type: this.selectedLeaveTypeForModal.id,
    created_by: this.userId
  };

  this.http.post(
    `${this.apiUrl}/calendars/api/leave-pay-rule/?schema=${selectedSchema}`,
    payload
  ).subscribe({
    next: () => {
      alert('Pay Rule Saved ✅');

      // 🔥 RELOAD DATA (MAIN FIX)
      this.loadLeavePayRules();

      // reset form
      this.payRuleData = { sequence: null, days: null, pay_percentage: null };
    },
    error: (err) => {
      console.error(err);
      alert('Error saving pay rule');
    }
  });
}

loadLeavePayRules(): void {

  const selectedSchema = this.authService.getSelectedSchema();

  this.http.get<any[]>(
    `${this.apiUrl}/calendars/api/leave-pay-rule/?schema=${selectedSchema}`
  ).subscribe({

    next: (res: any[]) => {

      console.log('All Pay Rules:', res);

      const leaveTypeId = this.selectedLeaveTypeForModal?.id;

      if (!leaveTypeId) {
        this.leavePayRules = res; // show all if no filter
        return;
      }

      this.leavePayRules = res.filter(rule =>
        rule.leave_type === leaveTypeId
      );

      console.log('Filtered Pay Rules:', this.leavePayRules);
    },

    error: (err: any) => {
      console.error(err);
    }

  });

}



isEntitlementCreated: boolean = false;
createdEntitlementId: number | null = null;


currentEntitlementId: number | null = null;



registerleaveEntitlement(): void {

  this.registerButtonClicked = true;

  const payload = {

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

    branches: this.branch || [],

    categories: this.categories || [],

    departments: this.departments || [],

    designations: this.designations || [],

    prorate_accrual: this.prorate_accrual,

    accrual: this.accrual,
  };

  // =========================
  // UPDATE
  // =========================

  if (this.isEditMode && this.selectedEntitlementId) {

    this.leaveService
      .updateLeaveEntitlement(
        this.selectedEntitlementId,
        payload
      )
      .subscribe({

        next: (res: any) => {

          alert('✅ Entitlement Updated');

          this.leave_entitlement =
            this.selectedEntitlementId;

          this.isEntitlementCreated = true;

          this.loadLeaveEntitlements();

          window.location.reload();

        },

        error: (err) => {

          console.error(err);

          alert('Update failed');

        }

      });

  }

  // =========================
  // CREATE
  // =========================

  else {

    this.leaveService
      .registerLeaveEntitlement(payload)
      .subscribe({

        next: (res: any) => {

          alert('✅ Entitlement Added');

          this.isEntitlementCreated = true;

          this.createdEntitlementId = res.id;

          this.leave_entitlement = res.id;

          this.loadLeaveEntitlements();

        },

        error: (err) => {

          console.error(err);

          alert('Create failed');

        }

      });

  }
}

  

registerleaveReset(): void {

  const formData = new FormData();

  formData.append('leave_entitlement', this.leave_entitlement);
  formData.append('leave_type', this.selectedLeaveTypeForModal.id);

  formData.append('frequency', this.frequency || '');
  formData.append('month', this.month || '');
  formData.append('day', this.day || '');

  formData.append('carry_forward_choice', this.carry_forward_choice || '');
  formData.append('cf_value', this.cf_value || '');
  formData.append('cf_unit_or_percentage', this.cf_unit_or_percentage || '');
  formData.append('cf_max_limit', this.cf_max_limit || '');

  formData.append('encashment_value', this.encashment_value || '');
  formData.append('encashment_unit_or_percentage', this.encashment_unit_or_percentage || '');
  formData.append('encashment_max_limit', this.encashment_max_limit || '');

  formData.append('opening_balance', this.opening_balance || '');

  formData.append('reset', this.reset.toString());
  formData.append('allow_cf', this.allow_cf.toString());
  formData.append('allow_encashment', this.allow_encashment.toString());

  // ===== UPDATE =====
  if (this.isResetEditMode && this.selectedResetId) {

    this.leaveService
      .updateLeaveResetPolicy(this.selectedResetId, formData)
      .subscribe({

        next: () => {

          alert('✅ Reset Updated Successfully');

          this.loadLeaveEntitlements();

          this.resetForm();

          window.location.reload();

        },

        error: (err) => {

          console.error(err);

          alert('Reset update failed');

        }

      });

  }

  // ===== CREATE =====
  else {

    this.leaveService
      .requestLeaveResetPolicy(formData)
      .subscribe({

        next: () => {

          alert('✅ Reset Added Successfully');

          this.loadLeaveEntitlements();

          this.resetForm();

          window.location.reload();

        },

        error: (err) => {

          console.error(err);

          alert('Reset create failed');

        }

      });

  }

}

  isEditMode: boolean = false;
selectedEntitlementId: number | null = null;

isResetEditMode: boolean = false;
selectedResetId: number | null = null;










resetForm() {

  // ENTITLEMENT
  this.isEditMode = false;
  this.selectedEntitlementId = null;

  // RESET
  this.isResetEditMode = false;
  this.selectedResetId = null;

  this.min_experience = '';
  this.effective_after_unit = '';
  this.effective_after_from = '';

  this.accrual = false;
  this.accrual_rate = '';
  this.accrual_frequency = '';
  this.accrual_month = '';
  this.accrual_day = '';

  this.prorate_accrual = false;

  this.branch = [];
  this.departments = [];
  this.designations = [];
  this.categories = [];

  // RESET VALUES
  this.frequency = '';
  this.month = '';
  this.day = '';

  this.allow_cf = false;
  this.carry_forward_choice = '';
  this.cf_value = '';
  this.cf_unit_or_percentage = '';
  this.cf_max_limit = '';

  this.allow_encashment = false;
  this.encashment_value = '';
  this.encashment_unit_or_percentage = '';
  this.encashment_max_limit = '';

  this.opening_balance = '';

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
    return;
  }

  this.leaveService.getAllLeaveEntitlements(selectedSchema)
    .subscribe((entitlements: any[]) => {

      // ✅ STORE ALL ENTITLEMENTS
      this.leaveEntitlements = entitlements;

      // ✅ FILTER CURRENT LEAVE TYPE
      const filtered = entitlements.filter(
        ent => ent.leave_type == this.selectedLeaveTypeForModal?.id
      );

      this.leaveService.getAllLeaveResetValues(selectedSchema)
        .subscribe((resets: any[]) => {

          this.filteredEntitlements = filtered.map(ent => {

            const relatedReset = resets.find(
              r => r.leave_entitlement == ent.id
            );

            return {
              ...ent,
              reset_data: relatedReset || null
            };

          });

          console.log('Filtered Entitlements:', this.filteredEntitlements);

        });

    });
}

editFullConfiguration(ent: any): void {

  // =========================
  // ENTITLEMENT EDIT
  // =========================

  this.isEditMode = true;
  this.selectedEntitlementId = ent.id;

  this.min_experience = ent.min_experience || '';

  this.effective_after_unit =
    ent.effective_after_unit || '';

  this.effective_after_from =
    ent.effective_after_from || '';

  this.accrual = ent.accrual || false;

  this.accrual_rate =
    ent.accrual_rate || '';

  this.accrual_frequency =
    ent.accrual_frequency || '';

  this.accrual_month =
    ent.accrual_month || '';

  this.accrual_day =
    ent.accrual_day || '';

  this.prorate_accrual =
    ent.prorate_accrual || false;

  this.branch = (ent.branches || []).map((b: any) =>
    typeof b === 'object' ? b.id : b
  );

  this.departments = (ent.departments || []).map((d: any) =>
    typeof d === 'object' ? d.id : d
  );

  this.designations = (ent.designations || []).map((des: any) =>
    typeof des === 'object' ? des.id : des
  );

  this.categories = (ent.categories || []).map((cat: any) =>
    typeof cat === 'object' ? cat.id : cat
  );

  this.leave_entitlement = ent.id;

  // =========================
  // RESET EDIT
  // =========================

  if (ent.reset_policy) {

    this.isResetEditMode = true;

    this.selectedResetId =
      ent.reset_policy.id;

    this.reset =
      ent.reset_policy.reset || false;

    this.frequency =
      ent.reset_policy.frequency || '';

    this.month =
      ent.reset_policy.month || '';

    this.day =
      ent.reset_policy.day || '';

    this.allow_cf =
      ent.reset_policy.allow_cf || false;

    this.carry_forward_choice =
      ent.reset_policy.carry_forward_choice || '';

    this.cf_value =
      ent.reset_policy.cf_value || '';

    this.cf_unit_or_percentage =
      ent.reset_policy.cf_unit_or_percentage || '';

    this.cf_max_limit =
      ent.reset_policy.cf_max_limit || '';

    this.cf_expires_in_value =
      ent.reset_policy.cf_expires_in_value || '';

    this.cf_time_choice =
      ent.reset_policy.cf_time_choice || '';

    this.allow_encashment =
      ent.reset_policy.allow_encashment || false;

    this.encashment_value =
      ent.reset_policy.encashment_value || '';

    this.encashment_unit_or_percentage =
      ent.reset_policy.encashment_unit_or_percentage || '';

    this.encashment_max_limit =
      ent.reset_policy.encashment_max_limit || '';

    this.opening_balance =
      ent.reset_policy.opening_balance || '';
  }

  // =========================
  // UI STATE
  // =========================

  this.isEntitlementCreated = true;

  this.onAccrualFrequencyChange();

  this.onResetFrequencyChange();

  setTimeout(() => {

    this.leaveApplicableTopSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }, 100);
}




deleteFullConfiguration(ent: any): void {

  if (!confirm('Delete complete configuration permanently?')) {
    return;
  }

  // FIRST DELETE RESET
  if (ent.reset_data?.id) {

    this.leaveService
      .deleteLeaveReset(ent.reset_data.id)
      .subscribe({

        next: () => {

          // THEN DELETE ENTITLEMENT
          this.leaveService
            .deleteLeaveEntitlement(ent.id)
            .subscribe({

              next: () => {

                alert('✅ Configuration Deleted');

                this.loadLeaveEntitlements();

                this.resetForm();

                window.location.reload();

              },

              error: (err) => {

                console.error(err);

                alert('Entitlement delete failed');

              }

            });

        },

        error: (err) => {

          console.error(err);

          alert('Reset delete failed');

        }

      });

  }

  else {

    this.leaveService
      .deleteLeaveEntitlement(ent.id)
      .subscribe({

        next: () => {

          alert('✅ Entitlement Deleted');

          this.loadLeaveEntitlements();

          this.resetForm();

          window.location.reload();

        },

        error: (err) => {

          console.error(err);

          alert('Delete failed');

        }

      });

  }
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

  const hasSelection =
    (this.branch && this.branch.length > 0) ||
    (this.department && this.department.length > 0) ||
    (this.designation && this.designation.length > 0) ||
    (this.role && this.role.length > 0);

  if (!hasSelection) {
    alert('Please select at least one: Branch, Department, Designation, or Role');
    return;
  }

const formData: any = {

  gender: this.gender === 'B' ? null : this.gender,

  leave_type: this.selectedLeaveTypeForModal.id,

  branch: (this.branch || [])
    .filter((b: any) => b && b !== 'None')
    .map((b: any) => Number(b)),

  department: (this.department || [])
    .filter((d: any) => d && d !== 'None')
    .map((d: any) => Number(d)),

  designation: (this.designation || [])
    .filter((des: any) => des && des !== 'None')
    .map((des: any) => Number(des)),

  role: (this.role || [])
    .filter((r: any) => r && r !== 'None')
    .map((r: any) => Number(r)),
};

  // ================= EDIT =================
  if (this.isApplicableEditMode && this.selectedApplicableId) {

    this.leaveService.updateLeaveApplicable(
      this.selectedApplicableId,
      formData
    ).subscribe({

      next: () => {

        alert('Leave Applicable Updated ✅');

        this.loadLeaveApplicable();

        this.resetApplicableForm();
      },

      error: (error) => {
        console.error(error);
        alert('Update failed');
      }

    });

  }

  // ================= CREATE =================
  else {

    this.leaveService.registerLeaveapplicable(formData).subscribe({

      next: () => {

        alert('Leave Applicable Added ✅');

        this.loadLeaveApplicable();

        this.resetApplicableForm();
      },

      error: (error) => {

        console.error(error);

        let errorMessage = '';

        if (error.error) {
          for (const key in error.error) {
            errorMessage += `${key}: ${error.error[key].join(', ')}\n`;
          }
        }

        alert(errorMessage || 'Error occurred');
      }

    });

  }
}

  leaveApplicableList: any[] = [];
  
loadLeaveApplicable(): void {

  const selectedSchema = this.authService.getSelectedSchema();

  const leaveTypeId =
    this.selectedLeaveTypeForModal?.id ||
    Number(localStorage.getItem('leaveTypeId'));

  if (!selectedSchema || !leaveTypeId) {
    console.warn('Schema or Leave Type missing');
    return;
  }

  this.leaveService.getLeaveApplicable(
    leaveTypeId,
    selectedSchema
  ).subscribe({
    next: (res: any) => {
      this.leaveApplicableList = res;
    },
    error: (err: any) => {
      console.error(err);
    }
  });

}


isApplicableEditMode: boolean = false;
selectedApplicableId: number | null = null;

editLeaveApplicable(item: any): void {

  // ✅ SAME ITEM CLICKED AGAIN → RESET
  if (
    this.isApplicableEditMode &&
    this.selectedApplicableId === item.id
  ) {

    this.resetApplicableForm();

    return;
  }

  // ✅ HARD RESET FIRST
  this.resetApplicableForm();

  setTimeout(() => {

    // ✅ OPEN EDIT MODE
    this.isApplicableEditMode = true;

    this.selectedApplicableId = item.id;

    this.gender = item.gender || 'B';

    this.branch = this.branches
      .filter(branch =>
        (item.branch || []).includes(branch.branch_name)
      )
      .map(branch => branch.id);

    this.department = this.Departments
      .filter(dept =>
        (item.department || []).includes(dept.dept_name)
      )
      .map(dept => dept.id);

    this.designation = this.Designation
      .filter(des =>
        (item.designation || []).includes(des.desgntn_job_title)
      )
      .map(des => des.id);

    this.role = this.Category
      .filter(role =>
        (item.role || []).includes(role.ctgry_title)
      )
      .map(role => role.id);


    this.applicableFormSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }, 100);

}

resetApplicableForm(): void {

  this.isApplicableEditMode = false;

  this.selectedApplicableId = null;

  this.gender = '';

  this.branch = [];
  this.department = [];
  this.designation = [];
  this.role = [];
}

deleteLeaveApplicable(id: number): void {

  if (!confirm('Are you sure you want to delete this applicable rule?')) {
    return;
  }

  this.leaveService.deleteLeaveApplicable(id).subscribe({

    next: () => {

      alert('Leave Applicable Deleted ✅');

      this.loadLeaveApplicable();
    },

    error: (err) => {

      console.error(err);

      alert('Delete failed');
    }

  });
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
      this.showMonth = true; // Hide month dropdown
      this.showDay = true;    // Show day dropdown
    } else {
      this.showMonth = false; // Hide both dropdowns
      this.showDay = true;
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

  // 🔥 ADD THIS LINE (MAIN FIX)
  this.showPayRuleForm = leavetype.enable_leave_pay_rule === true;

  console.log('Pay Rule Enabled:', this.showPayRuleForm);

  // 2. Filter Entitlements
  this.filteredEntitlements = this.leaveEntitlements.filter(ent => 
    ent.leave_type === leavetype.name
  );

  // 3. Filter Reset Values
  this.filteredLeaveRests = this.leaveRests.filter(res => 
    res.leave_type === leavetype.name
  );

  console.log('Filtered Reset Values for:', leavetype.name, this.filteredLeaveRests);
}


deletePayRule(id: number): void {

  const selectedSchema = this.authService.getSelectedSchema();

  if (!confirm('Are you sure you want to delete this pay rule?')) {
    return;
  }

  this.http.delete(
    `${this.apiUrl}/calendars/api/leave-pay-rule/${id}/?schema=${selectedSchema}`
  ).subscribe({
    next: () => {

      alert('Pay Rule Deleted ✅');

      // Reload table
      this.loadLeavePayRules();

    },
    error: (err) => {
      console.error(err);
      alert('Error deleting pay rule');
    }
  });
}

editingPayRuleId: number | null = null;

editPayRule(rule: any): void {

  if (this.editingPayRuleId === rule.id) {

    this.editingPayRuleId = null;

    this.payRuleData = {
      sequence: null,
      days: null,
      pay_percentage: null
    };

    return;
  }

  this.editingPayRuleId = rule.id;

  this.payRuleData = {
    sequence: rule.sequence,
    days: rule.days,
    pay_percentage: rule.pay_percentage
  };

    setTimeout(() => {

    this.payRuleTopSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }, 100);

}


updatePayRule(): void {

  const selectedSchema = this.authService.getSelectedSchema();

  const payload = {
    sequence: this.payRuleData.sequence,
    days: this.payRuleData.days,
    pay_percentage: this.payRuleData.pay_percentage,
    leave_type: this.selectedLeaveTypeForModal.id,
    created_by: this.userId
  };

  this.http.put(
    `${this.apiUrl}/calendars/api/leave-pay-rule/${this.editingPayRuleId}/?schema=${selectedSchema}`,
    payload
  ).subscribe({

    next: () => {

      alert('Pay Rule Updated ✅');

      this.loadLeavePayRules();

      // reset form
      this.payRuleData = {
        sequence: null,
        days: null,
        pay_percentage: null
      };

      // hide update button
      this.editingPayRuleId = null;

    },

    error: (err) => {
      console.error(err);
      alert('Error updating pay rule');
    }

  });

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
