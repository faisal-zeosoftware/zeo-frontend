import { Component, ViewChild } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import {combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-asset-approvel-level',
  templateUrl: './asset-approvel-level.component.html',
  styleUrl: './asset-approvel-level.component.css'
})
export class AssetApprovelLevelComponent {

    @ViewChild('select') select: MatSelect | undefined;
    private dataSubscription?: Subscription;

  
    level:any='';
    role:any='';
    approver:any='';
    approval_type: any = '';
  
  
    asset_type:any='';

    branch: any = '';

    allSelected=false;
  
  
  
  
    
    Branches: any[] = [];
  
    LoanTypes:any []=[];
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
  private sessionService: SessionService,
  private employeeService: EmployeeService,
      private leaveService:LeaveService,
      private DepartmentServiceService: DepartmentServiceService
  
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

         
  this.employeeService.selectedBranches$.subscribe(ids => {
 
    this.loadAssetTypes();    

    this.LoadBranch();    


  });
      // this.loadAssetTypes();
      // this.loadAssetApprovalLevels();
      this.loadAssetapprover();
      this.LoadBranch();

  
       this.loadUsers();
  
  
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
      
                     
                      this.hasAddPermission = this.checkGroupPermission('add_assetapprovallevel', groupPermissions);
                      console.log('Has add permission:', this.hasAddPermission);
                      
                      this.hasEditPermission = this.checkGroupPermission('change_assetapprovallevel', groupPermissions);
                      console.log('Has edit permission:', this.hasEditPermission);
        
                     this.hasDeletePermission = this.checkGroupPermission('delete_assetapprovallevel', groupPermissions);
                     console.log('Has delete permission:', this.hasDeletePermission);
        
      
                      this.hasViewPermission = this.checkGroupPermission('view_assetapprovallevel', groupPermissions);
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
  
  
CreateAssetApproverLevel(): void {

  this.registerButtonClicked = true;

  if (!this.asset_type) {
    alert('Please select asset type');
    return;
  }

  if (!this.approval_type) {
    alert('Please select approval type');
    return;
  }

  if (!this.branch || this.branch.length === 0) {
    alert('Please select at least one branch');
    return;
  }

  let formattedLevels: any[] = [];

  if (this.approval_type === 'multi_approval') {

    if (!this.levels || this.levels.length === 0) {
      alert('Please add at least one level');
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

  const payload = {
    asset_type: this.asset_type,
    approval_type: this.approval_type,
    branch: Array.isArray(this.branch) ? this.branch : [this.branch],
    total_levels: formattedLevels.length,
    levels: formattedLevels
  };

  console.log('FINAL PAYLOAD:', payload);

  this.employeeService.registerAssetApproverLevel(payload).subscribe(
    () => {
      alert('Asset Approval Level created successfully');
      this.closeapplicationModal();

      const schema = this.authService.getSelectedSchema();
      const branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      if (schema) {
        this.fetchEmployees(schema, branches); // ✅ FIXED
      }
    },
    (error) => {
      console.error(error);

      let msg = 'Creation failed';

      if (error.error && typeof error.error === 'object') {
        msg = Object.keys(error.error)
          .map(key => `${key}: ${error.error[key]}`)
          .join('\n');
      }

      alert(msg);
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
  
  
    
  
  
        
    loadAssetTypes(callback?: Function): void {
      
      const selectedSchema = this.authService.getSelectedSchema();
              const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
            
            
              if (selectedSchema) {
                this.employeeService.getAssetTypeNew(selectedSchema, savedIds).subscribe(
                  (result: any) => {
                    this.LoanTypes = result;
                    
                    if (callback) callback();
                  },
                  (error) => {
                    console.error('Error fetching Companies:', error);
                  }
                );
              }
      }
  
mapLoanTypeNameToId() {
  if (!this.LoanTypes || !this.editAsset?.asset_type) return;

  const loan = this.LoanTypes.find(
    (l: any) => l.name === this.editAsset.asset_type
  );

  if (loan) {
    this.editAsset.asset_type = loan.id; // 🔥 KEY LINE
  }
}

  
  
  
       
      // loadAssetApprovalLevels(): void {
      
      //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
      //   console.log('schemastore',selectedSchema )
      //   // Check if selectedSchema is available
      //   if (selectedSchema) {
      //     this.employeeService.getAssetApprovalLevels(selectedSchema).subscribe(
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
          this.employeeService.getAssetApprovalLevelsNew(schema, branchIds).subscribe({
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
        
        
  
  
        loadAssetapprover(callback?: Function): void {
      
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.userService.getApprover(selectedSchema).subscribe(
              (result: any) => {
                this.Approvers = result;
                console.log(' fetching Loantypes:');
                if (callback) callback();
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }
  
      mapLoanAprNameToId() {
  
    if (!this.Approvers || !this.editAsset?.approver) return;
  
    const apr = this.Approvers.find(
      (l: any) => l.username === this.editAsset.approver
    );
  
    if (apr) {
      this.editAsset.approver = apr.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.approver);
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
  
  onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
  }
  
  
  
  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited
  
openEditModal(asset: any): void {

  this.editAsset = JSON.parse(JSON.stringify(asset));

  // ✅ ensure branch is array
  if (!Array.isArray(this.editAsset.branch)) {
    this.editAsset.branch = this.editAsset.branch ? [this.editAsset.branch] : [];
  }

  // ✅ ensure levels exist
  if (!this.editAsset.levels || this.editAsset.levels.length === 0) {
    this.editAsset.levels = [
      { level: 1, role: '', approver: null }
    ];
  }

  this.LoadBranch(() => {
    this.mapBranchesNameToId();
  });

  this.mapLoanAprNameToId();
  this.mapLoanTypeNameToId();

  this.isEditModalOpen = true;
}

  addEditLevel() {
  if (!this.editAsset.levels) {
    this.editAsset.levels = [];
  }

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
  
  
  deleteSelectedAssetAprlvl() { 
    const selectedEmployeeIds = this.approvalLevels
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No Loan Approval Level selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected Loan Approval Level ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteAssetApprovalLevel(categoryId).subscribe(
          () => {
            console.log(' Loan Approval Level deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.approvalLevels = this.approvalLevels.filter(employee => employee.id !== categoryId);
  
             completed++;
  
           if (completed === total) { 
            alert(' Loan Approval Level  deleted successfully');
            window.location.reload();
           }
  
          },
          (error) => {
            console.error('Error deleting Loan Approval Level:', error);
              alert('Error deleting Loan Approval Level: ' + error.statusText);
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

  let formattedLevels: any[] = [];

  if (this.editAsset.approval_type === 'multi_approval') {

    formattedLevels = this.editAsset.levels.map((lvl: any, index: number) => ({
      level: index + 1,
      role: lvl.role,
      approver: Number(lvl.approver),
      escalate_to: lvl.escalate_to ? Number(lvl.escalate_to) : null,
      escalate_after_days: lvl.escalate_after_days || 0,
      escalate_after_hours: lvl.escalate_after_hours || 0,
      escalate_after_minutes: lvl.escalate_after_minutes || 0
    }));
  }

  const payload = {
    asset_type: this.editAsset.asset_type,
    approval_type: this.editAsset.approval_type,
    branch: this.editAsset.branch,
    total_levels: formattedLevels.length,
    levels: formattedLevels
  };

  this.employeeService.updateAssetApprovalLevel(this.editAsset.id, payload).subscribe(
    () => {
      alert('Updated successfully');
      this.closeEditModal();

      const schema = this.authService.getSelectedSchema();
      const branches = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      if (schema) {
        this.fetchEmployees(schema, branches);
      }
    },
    (error) => {
      console.error(error);
      alert('Update failed');
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
