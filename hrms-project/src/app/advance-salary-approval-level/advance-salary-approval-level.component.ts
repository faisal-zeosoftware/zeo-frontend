import { Component, ViewChild } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';

import {combineLatest, Subscription } from 'rxjs';
import { MatOption, MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-advance-salary-approval-level',
  templateUrl: './advance-salary-approval-level.component.html',
  styleUrl: './advance-salary-approval-level.component.css'
})
export class AdvanceSalaryApprovalLevelComponent {

  private dataSubscription?: Subscription;
   @ViewChild('select') select: MatSelect | undefined;

  
  level:any='';
  role:any='';
  approver:any='';
  approval_type: any = '';
  branch: any = '';


  
  allSelected=false;

  Branches: any[] = []

  approvalLevels:any []=[];
  Approvers:any []=[];

    Users:any []=[];


  selectedFile!: File | null;

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

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
     private DepartmentServiceService: DepartmentServiceService,
private sessionService: SessionService,
private employeeService: EmployeeService,

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

    // this.loadLoanTypes();
    // this.loadLoanApprovalLevels();
    this.loadLoanapprover();

         this.loadUsers();


    this.employeeService.selectedBranches$.subscribe(ids => {
      this.loadDeparmentBranch(); 
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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_advancecommonworkflow', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_advancecommonworkflow', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_advancecommonworkflow', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_advancecommonworkflow', groupPermissions);
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


CreateLoanApproverLevel(): void {
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
     ✅ MULTI APPROVAL LEVELS
  ------------------------- */

  let formattedLevels: any[] = [];

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

    formattedLevels = this.levels.map((lvl, index) => ({
      level: index + 1,
      role: lvl.role,
      approver: Number(lvl.approver),
      escalate_to: lvl.escalate_to ? Number(lvl.escalate_to) : null,
      escalate_after_days: lvl.escalate_after_days || 0,
      escalate_after_hours: lvl.escalate_after_hours || 0,
      escalate_after_minutes: lvl.escalate_after_minutes || 0
    }));
  }

  /* -------------------------
     ✅ FINAL JSON PAYLOAD
  ------------------------- */

  const payload: any = {
    approval_type: this.approval_type,
    branch: Array.isArray(this.branch) ? this.branch : [this.branch],
  };

  if (this.approval_type === 'multi_approval') {
    payload.levels = formattedLevels;
    payload.level = formattedLevels.length; // 🔥 IMPORTANT (same as working module)
  }

  if (this.approval_type === 'reporting_manager') {
    payload.use_reporting_manager = true;
  }

  console.log("🚀 Sending Payload:", payload);

  /* -------------------------
     🚀 API CALL
  ------------------------- */

  this.employeeService.registeradvSalaryApproverLevel(payload).subscribe(
    () => {
      alert('Approval Level has been added');
      this.closeapplicationModal();

      const schema = this.authService.getSelectedSchema();
      const branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      this.fetchEmployees(schema!, branches);
    },
    (error) => {
      console.error(error);
    }
  );
}



  // loadLoanApprovalLevels(): void {
    
  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getadvSalaryApprovalLevels(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.approvalLevels = result;
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
      this.employeeService.getadvSalaryApprovalLevelsNew(schema, branchIds).subscribe({
        next: (data: any) => {
          // Filter active employees
          this.approvalLevels = data;
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
      });
    }
  



    loadLoanapprover(): void {
  
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.userService.getApprover(selectedSchema).subscribe(
          (result: any) => {
            this.Approvers = result;
            console.log(' fetching Loantypes:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }


      // non-ess-users usermaster services

      loadUsers(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.userService.getApprover(selectedSchema).subscribe(
      (result: any) => {
        this.Users = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }


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
    this.approvalLevels.forEach(employee => employee.selected = this.allSelecteds);

  }

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = JSON.parse(JSON.stringify(asset)); // deep copy

  // ✅ IMPORTANT FIX
  if (!this.editAsset.levels || this.editAsset.levels.length === 0) {
    this.editAsset.levels = [
      {
        level: 1,
        role: '',
        approver: null
      }
    ];
  }

  this.isEditModalOpen = true;
}

addEditLevel() {
  this.editAsset.levels.push({
    level: this.editAsset.levels.length + 1,
    role: '',
    approver: null
  });
}

removeEditLevel(index: number) {
  this.editAsset.levels.splice(index, 1);
}

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


  deleteSelectedAdvanceSalaryAprlvl() {
    const selectedEmployeeIds = this.approvalLevels
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No States selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected  Approval Level ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deletepayrollAdvApprovallevel(categoryId).subscribe(
          () => {
            console.log(' Approval Level deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.approvalLevels = this.approvalLevels.filter(employee => employee.id !== categoryId);

          completed++;

          if (completed === total) {
            alert(' Approval Level Setting  deleted successfully');
            window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Approval Level:', error);
            alert('Error deleting Approval Level: ' + error.statusText);
          }
        );
      });
    }
  }


updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  const payload = {
    approval_type: this.editAsset.approval_type,
    branch: this.editAsset.branch,

    levels: this.editAsset.levels.map((lvl: any, index: number) => ({
      level: index + 1,
      role: lvl.role,
      approver: Number(lvl.approver),
      escalate_to: lvl.escalate_to ? Number(lvl.escalate_to) : null,
      escalate_after_days: lvl.escalate_after_days || 0,
      escalate_after_hours: lvl.escalate_after_hours || 0,
      escalate_after_minutes: lvl.escalate_after_minutes || 0
    }))
  };

  this.employeeService.updatepayrollAdvApprovallevel(this.editAsset.id, payload)
    .subscribe(
      () => {
        alert('Updated successfully');
        this.closeEditModal();
        this.fetchEmployees(
          this.authService.getSelectedSchema()!,
          JSON.parse(localStorage.getItem('selectedBranchIds') || '[]')
        );
      },
      (error) => {
        console.error(error);
        alert('Update failed');
      }
    );
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
