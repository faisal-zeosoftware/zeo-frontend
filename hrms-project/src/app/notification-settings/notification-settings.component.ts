import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';


@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.css'
})
export class NotificationSettingsComponent {


  @ViewChild('select') select: MatSelect | undefined;

  allSelected=false;


  registerButtonClicked: boolean = false;


  days_before_expiry:any='';
  days_after_expiry:any='' ;
  branch:any='' ;
  notify_users:any='' ;


  created_by:any='' ;



  LeaveTypes: any[] = [];
  Employees: any[] = [];
  LeaveBalances: any[] = [];

  NotSettings :any[] = [];

  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  Branches: any[] = []; // Array to store schema names



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private employeeService:EmployeeService,

    private DesignationService: DesignationService,
  
    ) {}

    ngOnInit(): void {

      this.loadLoanTypes();
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


      this.LoadUsers(selectedSchema);
      this.LoadBeanch(selectedSchema);


      
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
      
  



 
      loadLoanTypes(): void {
    
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.leaveService.getNotificationSettings(selectedSchema).subscribe(
            (result: any) => {
              this.NotSettings = result;
              console.log(' fetching Loantypes:');
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }
    
    
    
   
    
      LoadUsers(selectedSchema: string) {
        this.leaveService.getApproverUsers(selectedSchema).subscribe(
          (data: any) => {
            this.Users = data;
          
            console.log('employee:', this.LeaveTypes);
          },
          (error: any) => {
            console.error('Error fetching categories:', error);
          }
        );
      }


      LoadBeanch(selectedSchema: string) {
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



      
      registerUserAssignedPermission(): void {
        this.registerButtonClicked = true;
      
        const companyData = {
          days_before_expiry: this.days_before_expiry,
          days_after_expiry: this.days_after_expiry,
          branch: this.branch,
          notify_users: this.notify_users,
          created_by: this.created_by,
        };
      
        this.leaveService.registerEmailNotification(companyData).subscribe(
          (response) => {
            console.log('Registration successful', response);
            alert('Notification settings has been Assigned');
            window.location.reload();
          },
          (error) => {
            console.error('Registration failed', error);
      
            // Check if the error response contains a profile message
            if (error.error && error.error.profile) {
              alert(error.error.profile[0]); // Show the backend error message
            } else {
              alert('Something went wrong. Please try again!');
            }
          }
        );
      }
      




      // Variable to hold the selected document for editing
  selectedDoc: any = {};
  isDocumentnumbereditModalOpen: boolean = false;
  
    
openEditDocModal(state: any): void {
  // Clone the document (to avoid modifying the original before saving)
  this.selectedDoc = { ...state };
  this.isDocumentnumbereditModalOpen = true;
}



closeEditDocModal(): void {
  this.isDocumentnumbereditModalOpen = false;
}

// Method to update the document number via API
updateDocumentNumber(): void {
  // Optionally convert the date input to a year integer if needed:
  // Example: this.selectedDoc.year = new Date(this.selectedDoc.year).getFullYear();
  
  this.leaveService.updateNot(this.selectedDoc.id, this.selectedDoc).subscribe(
    (response) => {
      console.log('Document type updated successfully', response);
      alert(' Notification updated successfully.');
      // Optionally, refresh your list or reload the page
      this.closeEditDocModal();
       // re-fetch the list if needed
      window.location.reload();
    },
    (error) => {
      console.error('Error updating document type', error);
      const errorMessage = error.error?.error || 'Error updating document type.';
      alert(errorMessage);
    }
  );
}




deleteDoc(permissionId: number): void {
  if (confirm('Are you sure you want to delete this Notification Setting?')) {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
    this.leaveService.deleteNotification(permissionId,selectedSchema).subscribe(
      (response) => {
        console.log('Document type deleted successfully', response);
        alert('Notification deleted successfully');
          
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema) {
      console.error('No schema selected.');
      return;
    }
    this.loadLoanTypes();
        // this.fetchDesignations(selectedSchema); // Refresh the list after deletion
      },
      (error) => {
        console.error('Error deleting Document type:', error);
        alert('Failed to delete permission');
      }
    );
  }
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
      this.NotSettings.forEach(employee => employee.selected = this.allSelecteds);
      
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
      
      
      deleteSelectedAssetType() { 
      const selectedEmployeeIds = this.NotSettings
      .filter(employee => employee.selected)
      .map(employee => employee.id);
      
      if (selectedEmployeeIds.length === 0) {
      alert('No Announcement selected for deletion.');
      return;
      }
      
      if (confirm('Are you sure you want to delete the selected Document Notification Setting ?')) {
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteNotSetting(categoryId).subscribe(
          () => {
            console.log(' Document Numbering deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.NotSettings = this.NotSettings.filter(employee => employee.id !== categoryId);
            alert(' Document Notification Setting  deleted successfully');
            window.location.reload();
      
          },
          (error) => {
            console.error('Error deleting Loan Types:', error);
            alert(error)
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
      
      this.employeeService.updateNotSetting(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert(' Document Notification Setting  updated successfully!');
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
