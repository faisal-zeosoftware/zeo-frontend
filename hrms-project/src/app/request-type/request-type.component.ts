import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { LeaveService } from '../leave-master/leave.service';

declare var $: any;

@Component({
  selector: 'app-request-type',
  templateUrl: './request-type.component.html',
  styleUrl: './request-type.component.css'
})
export class RequestTypeComponent    {



  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  description: any = '';
  salary_component: any = '';

  created_by: any = '';
 
  
  level: any = '';
  role: any = '';
  approver: any = '';



  Users:any []=[];
  ReqTypes:any []=[];
  Salarycomponent:any []=[];




  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,

    private leaveService: LeaveService,

    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  this.loadReqTypes();

  const selectedSchema = this.authService.getSelectedSchema();
  if (selectedSchema) {
    this.LoadSalaryCom();

  }
  this.userId = this.sessionService.getUserId();
  
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        this.created_by = this.userId; // Automatically set the owner to logged-in user ID
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_requesttype', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_requesttype', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_requesttype', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_requesttype', groupPermissions);
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
  

    this.authService.getUserSchema(this.userId).subscribe(
      (userData: any) => {
        this.userDetailss = userData; // Store user schemas in userDetailss

        this.schemas = userData.map((schema: any) => schema.schema_name);
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
//   const requiredPermission = 'add_requesttype' ||'change_requesttype' ||'delete_requesttype' ||'view_requesttype';
  
  
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
  

        loadUsers(): void {
    
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.userService.getSChemaUsers(selectedSchema).subscribe(
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



registerGeneralreq(): void {
  this.registerButtonClicked = true;

  const companyData = {
    name: this.name,
    description: this.description,
    salary_component: this.salary_component,
    created_by: this.created_by,
    // use_common_workflow: this.use_common_workflow,
  };

  this.employeeService.registerReqType(companyData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Request Type has been added successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('Request Type addition failed:', error);

      let errorMessage = 'Something went wrong.';

      // ✅ Handle backend validation or field-level errors
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
        // Handles backend messages like { "detail": "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Registration failed!\n\n${errorMessage}`);
    }
  );
}



          loadReqTypes(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.employeeService.getGenReqType(selectedSchema).subscribe(
                (result: any) => {
                  this.ReqTypes = result;
                  console.log(' fetching Loantypes:');
          
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }
        

          registerRequestTyopecmnwrkflow(): void {
            this.registerButtonClicked = true;
            const companyData = {
              level: this.level,
            
              role:this.role,
            
              approver:this.approver,

           
        
              // Add other form field values to the companyData object
            };
          
        
            this.employeeService.registerReqType(companyData).subscribe(
              (response) => {
                console.log('Registration successful', response);
              
                    alert('Request Type has been Added ');
                    window.location.reload();
                    // window.location.reload();
               
        
              },
              (error) => {
                console.error('Added failed', error);
                alert('enter all field!')
                // Handle the error appropriately, e.g., show a user-friendly error message.
              }
            );
          }



          LoadSalaryCom(callback?: Function) {
             const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
            this.leaveService.getSalaryCom(selectedSchema).subscribe(
              (data: any) => {
                this.Salarycomponent = data;
              
                console.log('employee:', this.Salarycomponent);
                    if (callback) callback();
              },
              (error: any) => {
                console.error('Error fetching categories:', error);
              }
            );
          }
          }

  mapSalaryComNameToId() {
  if (!this.Salarycomponent || !this.editAsset?.salary_component) return;

  const sal = this.Salarycomponent.find(
    (s: any) => s.name === this.editAsset.salary_component
  );

  if (sal) {
    this.editAsset.salary_component = sal.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.salary_component);
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
this.ReqTypes.forEach(employee => employee.selected = this.allSelected);

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

// Map employee name → ID
this.mapSalaryComNameToId();

}





closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedRequestType() { 
  const selectedEmployeeIds = this.ReqTypes
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No General Request selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected  Request Type?')) {

     let total = selectedEmployeeIds.length;
    let completed = 0;


    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleterequestType(categoryId).subscribe(
        () => {
          console.log(' type deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.ReqTypes = this.ReqTypes.filter(emp  => emp .id !== categoryId);

          completed++;

          if (completed === total) {          
          alert(' Request Type deleted successfully');
          window.location.reload();
          }

        },
        (error) => {
          console.error('Error deleting General Request:', error);
         alert('Error deleting General Request: ' + error.statusText);
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

  this.employeeService.updateRequestType(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert(' Request Type updated successfully!');
      this.closeEditModal();
      this.loadReqTypes(); // reload updated list
    },
(error) => {
  console.error('Error updating Request Type:', error);

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


      
}
