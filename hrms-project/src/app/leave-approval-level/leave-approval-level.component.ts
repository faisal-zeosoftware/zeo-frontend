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

@Component({
  selector: 'app-leave-approval-level',
  templateUrl: './leave-approval-level.component.html',
  styleUrl: './leave-approval-level.component.css'
})
export class LeaveApprovalLevelComponent {

    
  @ViewChild('select') select: MatSelect | undefined;

  allSelected=false;

  Branches: any[] = []; // Array to store schema names


  role:any='';
  level:any='' ;
  request_type:any='' ;

  approver:any='' ;
  branch: any = '';



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
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

        this.LoadBranch(selectedSchema);

        this.LoadLeavetype(selectedSchema);
      // this.LoadUsers(selectedSchema);

         this.loadUsers();
      
      this.LoadLeaveApprovalLevel(selectedSchema);


      
      }

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


    
// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_leaveapprovallevels' ||'change_leaveapprovallevels' 
//   ||'delete_leaveapprovallevels' ||'view_leaveapprovallevels';
  
  
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



  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {
        
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  
  LoadBranch(selectedSchema: string) {
    this.leaveService.getBranches(selectedSchema).subscribe(
      (data: any) => {
        this.Branches = data;
      
        console.log('employee:', this.Branches);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }
  

    LoadLeavetype(selectedSchema: string) {
      this.leaveService.getLeaveType(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveTypes = data;
        
          console.log('employee:', this.LeaveTypes);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }
  
  

    LoadLeaveApprovalLevel(selectedSchema: string) {
      this.leaveService.getLeaveApprovalLevel(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveapprovalLevels = data;
        
          console.log('employee:', this.LeaveTypes);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
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
  




SetLeaveApprovaLevel(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();
  formData.append('level', this.level);
  formData.append('role', this.role);
  formData.append('is_compensatory', this.is_compensatory.toString());
  formData.append('approver', this.approver);
  formData.append('request_type', this.request_type);
  formData.append('branch', this.branch);

  this.leaveService.CreateLeaveapprovalLevel(formData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Leave Approval Level has been created successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('Leave approval level creation failed:', error);

      let errorMessage = 'Something went wrong.';

      // ✅ Handle backend validation or field-level errors (e.g., from Django REST Framework)
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];

        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`);
          } else {
            messages.push(`${key}: ${JSON.stringify(value)}`);
          }
        }

        if (messages.length > 0) {
          errorMessage = messages.join('\n');
        }
      } else if (error.error?.detail) {
        // Handles backend responses like { "detail": "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Creation failed!\n\n${errorMessage}`);
    }
  );
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
this.editAsset = { ...asset }; // copy asset data
this.isEditModalOpen = true;
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
const selectedSchema = localStorage.getItem('selectedSchema');
if (!selectedSchema || !this.editAsset.id) {
  alert('Missing schema or asset ID');
  return;
}

this.employeeService.updateLeaveApprovalLevel(this.editAsset.id, this.editAsset).subscribe(
  (response) => {
    alert('  Approval Level  updated successfully!');
    this.closeEditModal();
    window.location.reload();
  },
  (error) => {
    console.error('Error updating asset:', error);
    alert('Update failed');
  }
);
}




}
