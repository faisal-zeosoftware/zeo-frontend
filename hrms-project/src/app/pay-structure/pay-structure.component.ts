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
  selector: 'app-pay-structure',
  templateUrl: './pay-structure.component.html',
  styleUrl: './pay-structure.component.css'
})
export class PayStructureComponent {

  
  
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
    this.fetchEmployees(schema, branchIds);  
    

  }
});

 // Listen for sidebar changes so the dropdown updates instantly
 this.employeeService.selectedBranches$.subscribe(ids => {
  this.loadDeparmentBranch();
  // this.loadDEpartments();
  this.loadOvertimepolicy();

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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_overtimepolicy', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_overtimepolicy', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_overtimepolicy', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_overtimepolicy', groupPermissions);
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
  

// Define this in your component
availableDays = [
  { key: 'SUN', label: 'SUN' },
  { key: 'MON', label: 'MON' },
  { key: 'TUE', label: 'TUE' },
  { key: 'WED', label: 'WED' },
  { key: 'THU', label: 'THU' },
  { key: 'FRI', label: 'FRI' },
  { key: 'SAT', label: 'SAT' }
];

// Ensure this is an array
selectedWorkingDays: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']; 

toggleDay(dayKey: string): void {
  const index = this.selectedWorkingDays.indexOf(dayKey);
  if (index > -1) {
      // If it's already there, remove it
      this.selectedWorkingDays.splice(index, 1);
  } else {
      // If not, add it
      this.selectedWorkingDays.push(dayKey);
  }
}

isDaySelected(dayKey: string): boolean {
  return this.selectedWorkingDays.includes(dayKey);
}

  registerButtonClicked = false;


CreatePayStructure(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();
  // ✅ EXACT backend field names

  formData.append('working_days', JSON.stringify(this.selectedWorkingDays));


  formData.append('salary_calculation_type', this.salary_calculation_type);
  formData.append('fixed_working_days', this.fixed_working_days);
  formData.append('attendance_cycle_type', this.attendance_cycle_type);
  formData.append('cycle_start_day', this.cycle_start_day);

  formData.append('cycle_end_day', this.cycle_end_day);
  formData.append('payday_type', this.payday_type);
  formData.append('payday', this.payday);
  formData.append('payroll_start_month', this.payroll_start_month);
  formData.append('branch', this.branch);

  


  this.employeeService.registerPayStructure(formData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Pay Structure has been added');
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

// Add to your class
get calculatedPayDate(): string {
  if (!this.payroll_start_month || !this.payday) return '';

  try {
    const date = new Date(this.payroll_start_month);
    // Setting the day from the 'payday' input
    date.setDate(this.payday);
    
    // Format: "26 Jan 2026"
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

get formattedPayPeriod(): string {
  if (!this.payroll_start_month) return '';
  const date = new Date(this.payroll_start_month);
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
}


loadOvertimepolicy(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.employeeService.getOvertimePolicy(selectedSchema, savedIds).subscribe(
      (result: any) => {
        this.Policyget = result;
        
        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }



  // loadovertimepolicy(): void {
    
  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getovertimepolicy(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.overtimepol = result;
  //         console.log(' fetching Loantypes:');
  
  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  //   }

    isLoading: boolean = false;

    fetchEmployees(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.employeeService.getPayStrNew(schema, branchIds).subscribe({
        next: (data: any) => {
          // Filter active employees
          this.overtimepol = data;
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
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

  // openEditModal(asset: any): void {
  //   this.editAsset = { ...asset }; // copy asset data
  //   this.isEditModalOpen = true;

  // }


  openEditModal(asset: any): void {
    // 1. Copy the asset data
    this.editAsset = { ...asset };
    
    // 2. Ensure working_days is an array (Backend might send it as a string or array)
    if (typeof this.editAsset.working_days === 'string') {
      try {
        this.editAsset.working_days = JSON.parse(this.editAsset.working_days);
      } catch {
        this.editAsset.working_days = [];
      }
    }
  
    this.isEditModalOpen = true;
  }


  // Toggle logic specifically for the editAsset object
toggleEditDay(dayKey: string): void {
  if (!this.editAsset.working_days) this.editAsset.working_days = [];
  const index = this.editAsset.working_days.indexOf(dayKey);
  if (index > -1) {
    this.editAsset.working_days.splice(index, 1);
  } else {
    this.editAsset.working_days.push(dayKey);
  }
}

updatePayStr(): void {
  // Use simple JSON object if your backend supports it, 
  // or FormData if you prefer consistency with your Create method
  const payload = {
    ...this.editAsset,
    // Ensure working_days is stringified if backend expects JSONField via FormData
    working_days: JSON.stringify(this.editAsset.working_days) 
  };

  this.employeeService.updatelPayStructure(this.editAsset.id, payload).subscribe(
    (response) => {
      alert('Pay Structure updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
    (error) => {
      console.error('Update failed', error);
      alert('Failed to update: ' + (error.error?.detail || 'Validation error'));
    }
  );
}

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


  deleteSelectedPayrollAprlvl() {
    const selectedEmployeeIds = this.overtimepol
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No States selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected OverTime Rule ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deletePayStr(categoryId).subscribe(
          () => {
            console.log(' Pay structure deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.overtimepol = this.overtimepol.filter(employee => employee.id !== categoryId);

                      completed++;

            if (completed === total) {          
            alert(' Overtime policy deleted successfully');
            window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Overtime policy:', error);
            alert('Error deleting overtime policy: ' + error.statusText);
          }
        );
      });
    }
  }

  updateOverTimePolicy(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editAsset.id) {
      alert('Missing schema or asset ID');
      return;
    }
  
    // FORCE the data types and keys here
    const finalData = {
      rule_type: this.editAsset.rule_type,
      base_type: this.editAsset.base_type,
      threshold_hours: this.editAsset.threshold_hours,
      is_extended: this.editAsset.is_extended,
      is_active: this.editAsset.is_active,
      // FIX 1: Ensure this is a number
      order: Number(this.editAsset.order), 
      // FIX 2: Ensure the key is lowercase 'policy' and has a value
      policy: this.editAsset.policy || this.editAsset.Policy 
    };
  
    // Double check: if policy is still missing, alert the user
    if (!finalData.policy) {
      alert("Please select a Policy");
      return;
    }
  
    this.employeeService.updatelovertimeRule(this.editAsset.id, finalData).subscribe(
      (response) => {
        alert('OverTime Policy updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating Policy:', error);
        // Enhanced error display
        const backendError = error?.error;
        if (backendError && typeof backendError === 'object') {
          const errorMsg = Object.keys(backendError)
            .map(key => `${key}: ${backendError[key]}`)
            .join('\n');
          alert(errorMsg);
        } else {
          alert('Update failed');
        }
      }
    );
  }
           


    branches:any []=[];

        
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
    
          





}
