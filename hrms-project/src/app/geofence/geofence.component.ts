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

@Component({
  selector: 'app-geofence',
  templateUrl: './geofence.component.html',
  styleUrl: './geofence.component.css'
})
export class GeofenceComponent {


  
    level:any='';
    role:any='';
    approver:any='';
  
  
  geofencepol:any []=[];
  
    Approvers:any []=[];
    Branches:any []=[];

  

  branch: number[] = [];
  
         location_name:any='';
         latitude:any='';
         longitude:any='';
         radius:any='';
         is_active:  boolean = false;
  
  
  
      Users:any []=[];
  
  
  selectedFile!: File | null;
  
  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  
    Branchs:any []=[];
  
  
    Employee: any[] = [];
  
  

    allSelectedBrach=false;


  
      // @ViewChild('select') select: MatSelect | undefined;
      @ViewChild('selectBrach') selectBrach: MatSelect | undefined;

  
  
  
    
  
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
  
      // this.loadLoanTypes();
      // this.loadLoanApprovalLevels();
      // this.loadLoanapprover();
  
       this.loadUsers();
       this.loadBranch();

  
       this.loadgeofence();
  
  
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
    
  
  
    
  
   registerButtonClicked = false;
  
  
  CreateGeofence(): void {
    this.registerButtonClicked = true;
  
    const formData = new FormData();
    // ✅ EXACT backend field names
    formData.append('location_name', this.location_name);
    formData.append('latitude', this.latitude);
    formData.append('longitude', this.longitude);
    formData.append('radius', this.radius);
    formData.append('is_active', String(this.is_active));
  
    this.branch.forEach((id: number) =>
    formData.append('branch', id.toString())
  );
  

  
    this.employeeService.registerGeofence(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Geo Fence has been added');
        window.location.reload();
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
  
  
  
  
    loadgeofence(): void {
      
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getGeofence(selectedSchema).subscribe(
          (result: any) => {
            this.geofencepol = result;
            console.log(' fetching Geo Fences:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }
  
  
  
      // loadLoanapprover(): void {
    
      //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
      //   console.log('schemastore',selectedSchema )
      //   // Check if selectedSchema is available
      //   if (selectedSchema) {
      //     this.employeeService.getLoanapprover(selectedSchema).subscribe(
      //       (result: any) => {
      //         this.Approvers = result;
      //         console.log(' fetching Loantypes:');
      
      //       },
      //       (error) => {
      //         console.error('Error fetching Companies:', error);
      //       }
      //     );
      //   }
      //   }
  
  
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
  
       mapUsersNameToId() {
  
    if (!this.Users || !this.editAsset?.approver) return;
  
    const emp = this.Users.find(
      (e: any) => e.username === this.editAsset.approver
    );
  
    if (emp) {
      this.editAsset.approver = emp.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.approver);
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
      this.geofencepol.forEach(employee => employee.selected = this.allSelecteds);
  
    }
  
    onCheckboxChange(employee: number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }
  
  
  
    isEditModalOpen: boolean = false;
    editAsset: any = {}; // holds the asset being edited
  
openEditModal(asset: any): void {
  this.editAsset = { ...asset };

  // ✅ IMPORTANT: Convert branch to array for mat-select multiple
  if (this.editAsset.branch && !Array.isArray(this.editAsset.branch)) {
    this.editAsset.branch = [this.editAsset.branch];
  }

  this.isEditModalOpen = true;
}

  
    closeEditModal(): void {
      this.isEditModalOpen = false;
      this.editAsset = {};
    }
  
  
    deleteSelectedGeoFence() {
      const selectedEmployeeIds = this.geofencepol
        .filter(employee => employee.selected)
        .map(employee => employee.id);
  
      if (selectedEmployeeIds.length === 0) {
        alert('No States selected for deletion.');
        return;
      }
  
      if (confirm('Are you sure you want to delete the selected Geo Fence ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
        selectedEmployeeIds.forEach(categoryId => {
          this.employeeService.deleteGeofence(categoryId).subscribe(
            () => {
              console.log(' Geo Fence deleted successfully:', categoryId);
              // Remove the deleted employee from the local list
              this.geofencepol = this.geofencepol.filter(employee => employee.id !== categoryId);
  
                        completed++;
  
              if (completed === total) {          
              alert(' Geo Fence deleted successfully');
              window.location.reload();
              }
  
            },
            (error) => {
              console.error('Error deleting Geo Fence:', error);
              alert('Error deleting Geo Fence: ' + error.statusText);
            }
          );
        });
      }
    }
  
  
updateGeoFenceing(): void {
  if (!this.editAsset.id) {
    alert('Missing Geo Fence ID');
    return;
  }

  // ✅ Convert branch array → single pk
  const payload = {
    ...this.editAsset,
    branch: Array.isArray(this.editAsset.branch)
      ? this.editAsset.branch[0]
      : this.editAsset.branch
  };

  this.employeeService.updateGeofence(this.editAsset.id, payload).subscribe(
    () => {
      alert('Geo Fence updated successfully!');
      this.closeEditModal();
      this.loadgeofence(); // better than reload
    },
    (error) => {
      console.error('Error updating Geo Fence:', error);

      let errorMsg = 'Update failed';
      if (error?.error && typeof error.error === 'object') {
        errorMsg = Object.keys(error.error)
          .map(key => `${key}: ${error.error[key].join(', ')}`)
          .join('\n');
      }

      alert(errorMsg);
    }
  );
}

  
  
               loadBranch(): void {
              
                const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
              
                console.log('schemastore',selectedSchema )
                // Check if selectedSchema is available
                if (selectedSchema) {
                  this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
                    (result: any) => {
                      this.Branches = result;
                      console.log(' fetching Companies:');
              
                    },
                    (error) => {
                      console.error('Error fetching Companies:', error);
                    }
                  );
                }
                }

            
                  toggleAllSelectionBrach(): void {
                    if (this.selectBrach) {
                      if (this.allSelectedBrach) {
                        this.selectBrach.options.forEach((item: MatOption) => item.select());
                      } else {
                        this.selectBrach.options.forEach((item: MatOption) => item.deselect());
                      }
                    }
                  }
              
                }
              
                  

            
                    
                  

  
  
  
 


