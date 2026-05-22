import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { combineLatest, Subscription } from 'rxjs';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-branch-permissions',
  templateUrl: './branch-permissions.component.html',
  styleUrl: './branch-permissions.component.css'
})
export class BranchPermissionsComponent {

    private dataSubscription?: Subscription;

  @ViewChild('select') select: MatSelect | undefined;

  @ViewChild('selectEdit') selectEdit: MatSelect | undefined;


  users :any[]=[];
  registerButtonClicked = false;

  registerButtonClickededit = false;


  groups:any='';
  Groups :any[]=[];
  UserPermissions :any[]=[];



    Branches:any []=[];

user: number | null = null;
branch: number[] = [];


   allSelectedBrach=false;

         // @ViewChild('select') select: MatSelect | undefined;
      @ViewChild('selectBrach') selectBrach: MatSelect | undefined;




  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names


isUserPereditModalOpen = false;
selectedUserPermission: any = { user: '', groups: [] };

  constructor(private DepartmentServiceService: DepartmentServiceService ,
    private http: HttpClient,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
private sessionService: SessionService,
private employeeService: EmployeeService,
 ) {}


 ngOnInit(): void {
    
  this.loadDeparmentBranch();
  this.loadUserPermissions();
  this.loadBranch();

setTimeout(() => {
  this.loadAssignedPermissionsForUser();
}, 300);


  this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property
      // this.username = this.userDetails.username;
   

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

               
                this.hasAddPermission = this.checkGroupPermission('add_userbranchaccess', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_userbranchaccess', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_userbranchaccess', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_userbranchaccess', groupPermissions);
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



 
// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_permission' ||'change_permission' ||'delete_permission' ||'view_permission';
  
  
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
  

  loadDeparmentBranch(): void {
    const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
          this.DepartmentServiceService.getApprover(selectedSchema).subscribe(
            (result: any) => {
              this.users = result;
              console.log(' fetching Companies:');
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
   
  }


  loadUserPermissions(): void {
    const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
          this.DepartmentServiceService.getUserforPermissionGroupSelection(selectedSchema).subscribe(
            (result: any) => {
              this.Groups = result;
              console.log(' fetching Companies:');
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
   
  }



 
registerUserAssignedPermission(): void {
  this.registerButtonClicked = true;

  if (!this.user || this.branch.length === 0) {
    alert('Please select User and at least one Branch');
    return;
  }

  const payload = {
    user: this.user,
    branch: this.branch
  };

  this.DepartmentServiceService
    .registerUserBranchPer(payload)   // 👈 JSON
    .subscribe(
      () => {
        alert('Branch Permission Assigned Successfully');
        this.user = null;
        this.branch = [];
        this.allSelectedBrach = false;
        this.loadAssignedPermissionsForUser(); 
        window.location.reload();
      },
      (error) => {
        console.error(error);
        alert('Failed to assign permission');
      }
    );
}


  


loadAssignedPermissionsForUser(): void {
  const schema = this.authService.getSelectedSchema();
  if (!schema) return;

  this.DepartmentServiceService
    .getBranchPermissionsForUser(schema)
    .subscribe((result: any[]) => {

      this.UserPermissions = result.map(per => ({
        ...per,
        branch: (per.branch || []).map((id: number) => {
          const branch = this.branchMap.get(Number(id));
          return {
            id,
            branch_name: branch?.branch_name ?? 'Unknown'
          };
        })
      }));

    });
}




  
  deleteAssignedPermission(permissionId: number): void {
    if (confirm('Are you sure you want to delete this permission?')) {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {
      this.DepartmentServiceService.deleteBranchPermission(permissionId,selectedSchema).subscribe(
        (response) => {
          console.log('Permission deleted successfully', response);
          alert('Permission deleted successfully');
          this.loadAssignedPermissionsForUser();
          window.location.reload();
        },
        (error) => {
          console.error('Error deleting permission:', error);
          alert('Failed to delete permission');
        }
      );
    }
    }
  }


  deleteSelectedPermissions(): void {

  const selectedPermissions = this.UserPermissions.filter(
    (permission: any) => permission.selected
  );

  if (selectedPermissions.length === 0) {
    alert('Please select at least one permission');
    return;
  }

  if (!confirm('Are you sure you want to delete selected permissions?')) {
    return;
  }

  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }

  selectedPermissions.forEach((permission: any) => {

    this.DepartmentServiceService
      .deleteBranchPermission(permission.id, selectedSchema)
      .subscribe({
        next: () => {
          console.log('Deleted:', permission.id);
           window.location.reload();
        },

        error: (error) => {
          console.error('Delete failed:', error);
        }
      });

  });

  alert('Selected permissions deleted');

  this.loadAssignedPermissionsForUser();
}





  // Open modal and set selected permission details
openEditPerModal(permission: any): void {

  this.selectedUserPermission = permission;

  this.isUserPereditModalOpen = true;

  setTimeout(() => {

    this.user = Number(permission.user);

    this.branch = permission.branch.map(
      (b: any) => Number(b.id)
    );

  });

}

// Close modal
closeEditPerModal(): void {
  this.isUserPereditModalOpen = false;
  this.selectedUserPermission = { user: '', groups: [] };
}


  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.DepartmentServiceService.getassignedPermissionsForUserNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.UserPermissions = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }


updateUserPermission(): void {

  this.registerButtonClickededit = true;

  if (!this.user || this.branch.length === 0) {
    alert('Please select User and Branch');
    return;
  }

  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    console.error('No schema selected');
    return;
  }

  const payload = {
    user: this.user,
    branch: this.branch
  };

  this.DepartmentServiceService
    .updateBranchPermission(
      selectedSchema,
      this.selectedUserPermission.id,
      payload
    )
    .subscribe(
      (response) => {

        console.log('Permission updated successfully', response);

        alert('Permission updated successfully');

        this.closeEditPerModal();

        this.loadAssignedPermissionsForUser();

        window.location.reload();
      },

      (error) => {

        console.error('Error updating Permissions:', error);

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

allSelected=false;
allSelectedEdit=false;


toggleAllSelection(): void {
  if (this.select) {
    if (this.allSelected) {
      
      this.select.options.forEach((item: MatOption) => item.select());
    } else {
      this.select.options.forEach((item: MatOption) => item.deselect());
    }
  }
}


toggleAllSelectionEdit(): void {
  if (this.selectEdit) {
    if (this.allSelectedEdit) {
      
      this.selectEdit.options.forEach((item: MatOption) => item.select());
    } else {
      this.selectEdit.options.forEach((item: MatOption) => item.deselect());
    }
  }
}


branchMap = new Map<number, any>();

loadBranch(): void {
  const schema = this.authService.getSelectedSchema();
  if (!schema) return;

  this.DepartmentServiceService.getDeptBranchList(schema).subscribe(
    (result: any[]) => {
      this.Branches = result;

      // 🔥 create fast lookup
      this.branchMap.clear();
      result.forEach(b => this.branchMap.set(Number(b.id), b));

      // 🔥 NOW load permissions (guaranteed order)
      this.loadAssignedPermissionsForUser();
    }
  );
}




toggleAllSelectionBrach(): void {
  if (!this.selectBrach) return;

  this.allSelectedBrach
    ? this.selectBrach.options.forEach(o => o.select())
    : this.selectBrach.options.forEach(o => o.deselect());
}


               iscreateLoanApp: boolean = false;




      openPopus():void{
        this.iscreateLoanApp = true;

              // reset branch
  this.branch = [];

  // ✅ Auto select first branch
  if (this.Branches && this.Branches.length > 0) {

    this.branch = [this.Branches[0].id];

        this.allSelectedBrach = false;

  }

      }
    
      closeapplicationModal():void{
        this.iscreateLoanApp = false;

      }




      openEditPopuss(categoryId: number):void{
        
      }
  
  
      showEditBtn: boolean = false;
  
      EditShowButtons() {
        this.showEditBtn = !this.showEditBtn;
      }
  
  
      Delete: boolean = false;
  
    toggleCheckboxes() {
      this.Delete = !this.Delete;
    }
  
    toggleSelectAllEmployees() {
        this.allSelected = !this.allSelected;
   this.UserPermissions.forEach((permission: any) => {
  permission.selected = this.allSelected;
});

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }





}
