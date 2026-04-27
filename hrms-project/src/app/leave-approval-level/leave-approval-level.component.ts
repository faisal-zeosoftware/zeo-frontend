import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';
import {combineLatest, Subscription } from 'rxjs';


@Component({
  selector: 'app-leave-approval-level',
  templateUrl: './leave-approval-level.component.html',
  styleUrl: './leave-approval-level.component.css'
})
export class LeaveApprovalLevelComponent {

  private dataSubscription?: Subscription;
  @ViewChild('select') select: MatSelect | undefined;

  allSelected=false;

  Branches: any[] = []; // Array to store schema names


  role:any='';
  level:any='' ;
  request_type:any='' ;

  approver:any='' ;
  branch: any = '';
  approval_type: any = '';



  is_compensatory: boolean = false;

  registerButtonClicked: boolean = false;



  LeaveTypes: any[] = [];
  LeaveapprovalLevels: any[] = [];

  Users: any[] = [];

  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private employeeService:EmployeeService,
    private userService: UserMasterService,

    private DesignationService: DesignationService,
  
    ) {}

    ngOnInit(): void {

        // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.LoadBranch(); 
  });


  // combineLatest waits for both Schema and Branches to have a value
  this.dataSubscription = combineLatest([
    this.employeeService.selectedSchema$,
    this.employeeService.selectedBranches$
  ]).subscribe(([schema, branchIds]) => {
    if (schema) {
      this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);

    }
  });




      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

        this.LoadBranch();

        
      // this.LoadUsers(selectedSchema);

         this.loadUsers();
      
      // this.LoadLeaveApprovalLevel(selectedSchema);


      
      }

      this.LoadLeavetype();

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

               
                this.hasAddPermission = this.checkGroupPermission('add_leaveapprovallevels', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_leaveapprovallevels', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_leaveapprovallevels', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_leaveapprovallevels', groupPermissions);
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
            console.log('scehmas-de',userData)
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



  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {
        
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  
//   LoadBranch(callback?: Function) {

//        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
//       console.log('schemastore',selectedSchema )
//       // Check if selectedSchema is available
//       if (selectedSchema) {
//     this.leaveService.getBranches(selectedSchema).subscribe(
//       (data: any) => {
//         this.Branches = data;
      
//         console.log('employee:', this.Branches);
//         if (callback) callback();
//       },
//       (error: any) => {
//         console.error('Error fetching categories:', error);
//       }
//     );
//   }
// }


LoadBranch(callback?: Function) {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (selectedSchema) {
    this.leaveService.getBranches(selectedSchema).subscribe(
      (result: any[]) => {
        // 1. Get the sidebar selected IDs from localStorage
        const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

        // 2. Filter the API result to only include branches selected in the sidebar
        // If sidebar is empty, you might want to show all, or show none. 
        // Usually, we show only the selected ones:
        if (sidebarSelectedIds.length > 0) {
          this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
        } else {
          this.Branches = result; // Fallback: show all if nothing is selected in sidebar
        }
        // Inside the subscribe block of loadDeparmentBranch
        if (this.Branches.length === 1) {
          this.branch = this.Branches[0].id;
        }

        console.log('Filtered branches for selection:', this.Branches);
        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching branches:', error);
      }
    );
  }
}
 
mapBranchesNameToId() {
  if (!this.Branches || !this.editAsset?.branch) return;

  // Case A: backend returns single ID
  if (typeof this.editAsset.branch === 'number') {
    this.editAsset.branch = [this.editAsset.branch];
    return;
  }

  // Case B: backend returns single NAME
  if (typeof this.editAsset.branch === 'string') {
    const found = this.Branches.find(b => b.branch_name === this.editAsset.branch);
    this.editAsset.branch = found ? [found.id] : [];
    return;
  }

  // Case C: backend returns an array of names
  if (Array.isArray(this.editAsset.branch)) {
    this.editAsset.branch = this.Branches
      .filter(b => this.editAsset.branch.includes(b.branch_name))
      .map(b => b.id);
  }

  console.log("Mapped branch IDs:", this.editAsset.branch);
}


  

    LoadLeavetype(callback?: Function) {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
      this.leaveService.getLeaveType(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveTypes = data;
          console.log('employee:', this.LeaveTypes);
            if (callback) callback();

        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }
  }

  mapLeaveTypeNameToId() {

  if (!this.LeaveTypes || !this.editAsset?.request_type) return;

  const lv = this.LeaveTypes.find(
    (l: any) => l.name === this.editAsset.request_type
  );

  if (lv) {
    this.editAsset.request_type = lv.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.request_type);
}

  
  

    // LoadLeaveApprovalLevel(selectedSchema: string) {
    //   this.leaveService.getLeaveApprovalLevel(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.LeaveapprovalLevels = data;
        
    //       console.log('employee:', this.LeaveTypes);
    //     },
    //     (error: any) => {
    //       console.error('Error fetching categories:', error);
    //     }
    //   );
    // }


    isLoading: boolean = false;


    fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.leaveService.getLeaveApprovalLevelNew(schema, branchIds).subscribe({
        next: (data: any) => {
          // Filter active employees
               this.LeaveapprovalLevels = data;
    
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
      });
    }
    
  
 
  
    // LoadUsers(selectedSchema: string) {
    //   this.leaveService.getUsers(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.Users = data;
        
    //       console.log('employee:', this.LeaveTypes);
    //     },
    //     (error: any) => {
    //       console.error('Error fetching categories:', error);
    //     }
    //   );
    // }

    // non-ess-users usermaster services

    loadUsers(callback?: Function): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.userService.getApprover(selectedSchema).subscribe(
      (result: any) => {
        this.Users = result;
        console.log(' fetching Companies:');
         if (callback) callback();

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }

  
  mapApproverNameToId() {

  if (!this.Users || !this.editAsset?.approver) return;

  const use = this.Users.find(
    (u: any) => u.username === this.editAsset.approver
  );

  if (use) {
    this.editAsset.approver = use.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.approver);
}

  




SetLeaveApprovaLevel(): void {
  this.registerButtonClicked = true;

  /* -------------------------
     ✅ VALIDATION
  ------------------------- */

  if (!this.approval_type) {
    alert('Please select approval type');
    return;
  }

  if (!this.branch || this.branch.length === 0) {
    alert('Please select at least one branch');
    return;
  }

  /* -------------------------
     ✅ BASE PAYLOAD
  ------------------------- */

  const payload: any = {
    branch: (Array.isArray(this.branch) ? this.branch : [this.branch])
      .map((b: any) => Number(b)),

    approval_type: this.approval_type,
    is_compensatory: this.is_compensatory
  };

  // ✅ Only send request_type when needed
  if (!this.is_compensatory) {
    payload.request_type = Number(this.request_type);
  }

  /* -------------------------
     ✅ MULTI APPROVAL ONLY
  ------------------------- */

  if (this.approval_type === 'multi_approval') {

    if (!this.levels || this.levels.length === 0) {
      alert('Please add at least one approval level');
      return;
    }

    const invalid = this.levels.find(l => !l.role || !l.approver);

    if (invalid) {
      alert('Please fill all level fields');
      return;
    }

    payload.levels = this.levels.map((lvl, index) => ({
      level: index + 1,
      role: lvl.role,
      approver: Number(lvl.approver),
      escalate_to: lvl.escalate_to ? Number(lvl.escalate_to) : null,
      escalate_after_days: lvl.escalate_after_days || 0,
      escalate_after_hours: lvl.escalate_after_hours || 0,
      escalate_after_minutes: lvl.escalate_after_minutes || 0
    }));

  } else {
    // 🔥 IMPORTANT: explicitly remove levels
    delete payload.levels;
  }

  console.log('FINAL PAYLOAD:', payload);

  /* -------------------------
     ✅ API CALL
  ------------------------- */

  this.leaveService.CreateLeaveapprovalLevel(payload).subscribe({
    next: () => {
      alert('Leave Approval Level created successfully!');
      this.closeapplicationModal();

      const schema = this.authService.getSelectedSchema();
      const branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      this.fetchEmployeesLeaveApprovalLevel(schema!, branches);
    },

    error: (error) => {
      console.error(error);
    }
  });
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
allSelecteds: boolean = false;

toggleCheckboxes() {
this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
this.allSelecteds = !this.allSelecteds;
this.LeaveapprovalLevels.forEach(employee => employee.selected = this.allSelecteds);

}

onCheckboxChange(employee:number) {
// No need to implement any logic here if you just want to change the style.
// You can add any additional logic if needed.
}



isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = JSON.parse(JSON.stringify(asset)); // deep copy
  this.isEditModalOpen = true;

  // 🔥 Ensure levels exist
  if (!this.editAsset.levels) {
    this.editAsset.levels = [];
  }

  this.LoadBranch(() => {
    this.mapBranchesNameToId();
  });

  this.mapLeaveTypeNameToId();
  this.mapApproverNameToId();
}

addEditLevel() {
  if (!this.editAsset.levels) {
    this.editAsset.levels = [];
  }

  this.editAsset.levels.push({
    level: this.editAsset.levels.length + 1,
    role: '',
    approver: '',
    escalate_to: null,
    escalate_after_days: 0,
    escalate_after_hours: 0,
    escalate_after_minutes: 0
  });
}

removeEditLevel(index: number) {
  this.editAsset.levels.splice(index, 1);
}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedLeaveAprlvl() { 
const selectedEmployeeIds = this.LeaveapprovalLevels
  .filter(employee => employee.selected)
  .map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
  alert('No Approval Level selected for deletion.');
  return;
}

if (confirm('Are you sure you want to delete the selected  Approval Level ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;


  selectedEmployeeIds.forEach(categoryId => {
    this.employeeService.deleteLeaveApprovalLevel(categoryId).subscribe(
      () => {
        console.log('  Approval Level deleted successfully:', categoryId);
        // Remove the deleted employee from the local list
        this.LeaveapprovalLevels = this.LeaveapprovalLevels.filter(emp => emp.id !== categoryId);

            completed++;
            
     if (completed === total) {         
        alert('  Approval Level  deleted successfully');
        window.location.reload();
     }

      },
      (error) => {
        console.error('Error deleting Gratuity:', error);
      alert('Error deleting category: ' + error.statusText);
      }
    );
  });
}
}


updateAssetType(): void {
  if (!this.editAsset.id) {
    alert('Missing ID');
    return;
  }

  const payload: any = {
    branch: (Array.isArray(this.editAsset.branch) ? this.editAsset.branch : [this.editAsset.branch])
      .map((b: any) => Number(b)),

    approval_type: this.editAsset.approval_type,
    is_compensatory: this.editAsset.is_compensatory
  };

  // ✅ request_type only if needed
  if (!this.editAsset.is_compensatory) {
    payload.request_type = Number(this.editAsset.request_type);
  }

  // ✅ ONLY for multi approval
  if (this.editAsset.approval_type === 'multi_approval') {

    if (!this.editAsset.levels || this.editAsset.levels.length === 0) {
      alert('Levels required');
      return;
    }

    payload.levels = this.editAsset.levels.map((lvl: any, index: number) => ({
      level: index + 1,
      role: lvl.role,
      approver: Number(lvl.approver),
      escalate_to: lvl.escalate_to ? Number(lvl.escalate_to) : null,
      escalate_after_days: lvl.escalate_after_days || 0,
      escalate_after_hours: lvl.escalate_after_hours || 0,
      escalate_after_minutes: lvl.escalate_after_minutes || 0
    }));
  }

  this.employeeService.updateLeaveApprovalLevel(this.editAsset.id, payload).subscribe(
    () => {
      alert('Updated successfully!');
      this.closeEditModal();

      const schema = this.authService.getSelectedSchema();
      const branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      this.fetchEmployeesLeaveApprovalLevel(schema!, branches);
    },
    (error) => {
      console.error(error);

      let msg = 'Update failed';

      if (error.error) {
        msg = Object.keys(error.error)
          .map(k => `${k}: ${error.error[k]}`)
          .join('\n');
      }

      alert(msg);
    }
  );
}

 branchSearch: string = '';

filterEmployees() {

  if (!this.branchSearch) {
    return this.Branches;
  }

  return this.Branches.filter((deparmentsec: any) =>
    deparmentsec.branch_name.toLowerCase().includes(this.branchSearch.toLowerCase())
  );

}

    levels: any[] = [
  {
    level: '',
    role: '',
    approver: '',
    escalate_to: '',
    escalate_after_days: 0,
    escalate_after_hours: 0,
    escalate_after_minutes: 0
  }
];

addLevel() {
  this.levels.push({
    level: '',
    role: '',
    approver: '',
    escalate_to: '',
    escalate_after_days: 0,
    escalate_after_hours: 0,
    escalate_after_minutes: 0
  });
}

removeLevel(index: number) {
  this.levels.splice(index, 1);
}




}
