import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';

@Component({
  selector: 'app-email-configuration',
  templateUrl: './email-configuration.component.html',
  styleUrl: './email-configuration.component.css'
})
export class EmailConfigurationComponent {


  email_host: any = '';
  email_port: any = '';
  email_host_password: any = '';
  email_host_user: any = '';
  created_by: any = '';

  email_use_tls: boolean = false;
  is_active: boolean = false;


  Users:any []=[];
  EmailConfg:any []=[];



  registerButtonClicked = false;
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

schemas: string[] = []; // Array to store schema names


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private DepartmentServiceService: DepartmentServiceService,
    private DesignationService: DesignationService,
    private sessionService: SessionService,



    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  this.loadEmailConfg();

  this.userId = this.sessionService.getUserId();
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        // this.username = this.userDetails.username;
     
  this.created_by = this.userId;
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_emailconfiguration', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_emailconfiguration', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_emailconfiguration', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_emailconfiguration', groupPermissions);
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

  loadEmailConfg(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getemailCong(selectedSchema).subscribe(
        (result: any) => {
          this.EmailConfg = result;
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
    allSelected: boolean = false;

  toggleCheckboxes() {
    this.Delete = !this.Delete;
  }

  toggleSelectAllEmployees() {
      this.allSelected = !this.allSelected;
  this.EmailConfg.forEach(employee => employee.selected = this.allSelected);

  }

  onCheckboxChange(employee:number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }




    RequestEmailConfg(): void {
      this.registerButtonClicked = true;
    
      // Prepare JSON payload instead of FormData
      const payload = {
        email_host: this.email_host,
        email_port: this.email_port,
        email_host_user: this.email_host_user,
        email_host_password: this.email_host_password,
        created_by: this.created_by,
        email_use_tls: this.email_use_tls,
        is_active: this.is_active
      };
    
      this.employeeService.registerEmaiCong(payload).subscribe(
        (response) => {
          console.log('Registration successful', response);
          alert('Email Configuration has been Created');
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


    updateAssetType(): void {
      const selectedSchema = localStorage.getItem('selectedSchema');
      if (!selectedSchema || !this.editAsset.id) {
        alert('Missing schema or asset ID');
        return;
      }
    
      this.employeeService.updateEmaiConfiguration(this.editAsset.id, this.editAsset).subscribe(
        (response) => {
          alert('Email Configuration updated successfully!');
          this.closeEditModal();
          this.loadEmailConfg(); // reload updated list
        },
(error) => {
  console.error('Error updating Email Configuration:', error);

  let errorMsg = 'Update failed';

  const backendError = error?.error;

  if (backendError && typeof backendError === 'object') {
    // Convert the object into a readable string
    errorMsg = Object.keys(backendError)
      .map(key => `${key}: ${backendError[key].join(', ')}`)
      .join('\n');
  }

  alert(errorMsg);
}
      );
    }
    
    
    deleteSelectedEmailConfig() { 
      const selectedEmployeeIds = this.EmailConfg
        .filter(employee => employee.selected)
        .map(employee => employee.id);
    
      if (selectedEmployeeIds.length === 0) {
        alert('No EmailConfig selected for deletion.');
        return;
      }
    
      if (confirm('Are you sure you want to delete the selected Email Configuration?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

        selectedEmployeeIds.forEach(categoryId => {
          this.employeeService.deleteEmailConfig(categoryId).subscribe(
            () => {
              console.log('Email Configuration deleted successfully:', categoryId);
              // Remove the deleted employee from the local list
              this.EmailConfg = this.EmailConfg.filter(employee => employee.id !== categoryId);
              completed++;
              if (completed === total) {
              alert(' Email Configuration deleted successfully');
              window.location.reload();
              }
    
            },
            (error) => {
              console.error('Error deleting Email Configuration:', error);
              alert('Error deleting EmailConfig: ' + error.statusText);
            }
          );
        });
      }
    }
    
    
  


}
