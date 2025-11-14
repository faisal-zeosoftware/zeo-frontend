import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { CountryService } from '../country.service';
declare var $: any;


@Component({
  selector: 'app-shift-override',
  templateUrl: './shift-override.component.html',
  styleUrl: './shift-override.component.css'
})
export class ShiftOverrideComponent {

  

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  Patern_name:any='';
  description: any = '';

 
  
  // monday_shift:any='';

  // tuesday_shift:any='';

  // wednesday_shift:any='';

  // thursday_shift:any='';

  // friday_shift:any='';

  // saturday_shift:any='';

  // sunday_shift:any='';





  Users:any []=[];
  // LoanTypes:any []=[];

  Shifts:any []=[];

ShiftsOverride: any[] = [];




  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  constructor(
    private countryService: CountryService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,


    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  // this.loadLAssetType();
  this.loadShifts();
  this.loadShiftsOverride();

    this.loadEmployee();


  this.userId = this.sessionService.getUserId();
  
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        // this.created_by = this.userId; // Automatically set the owner to logged-in user ID
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_shiftoverride', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_shiftoverride', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_shiftoverride', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_shiftoverride', groupPermissions);
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




            date:any='';
  override_shift:any='';
  employee_override:any=''

  registerShiftOverride(): void {
    this.registerButtonClicked = true;

 

    const companyData = {
      date: this.date,
      employee: this.employee_override ,
      override_shift: this.override_shift,
      // single_shift_pattern: this.single_shift_pattern,


    };

    this.employeeService.registerShiftOverride(companyData).subscribe(
      (response) => { 
        console.log('Registration successful', response);
        alert('Shift Over Ride has been added.');
        window.location.reload();
      },
      (error) => {
        console.error('Registration failed', error);
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



    loadShifts(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.countryService.getShifts(selectedSchema).subscribe(
        (result: any) => {
          this.Shifts = result;
          console.log(' fetching Companies:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }


    loadShiftsOverride(): void {
    
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.countryService.getShiftOverride(selectedSchema).subscribe(
            (result: any) => {
              this.ShiftsOverride = result;
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




      // openEditPopuss(categoryId: number):void{
        
      // }
  
  
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
    this.ShiftsOverride.forEach(employee => employee.selected = this.allSelected);

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }



isEditModalOpen: boolean = false;
editoverride: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editoverride = { ...asset }; // copy asset data
  this.isEditModalOpen = true;
}

closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editoverride = {};
}


updateOverrideType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editoverride.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateShiftOverride(this.editoverride.id, this.editoverride).subscribe(
    (response) => {
      alert('Shift override  updated successfully!');
      this.closeEditModal();
      this.loadShiftsOverride(); // reload updated list
      window.location.reload();
    },
    (error) => {
      console.error('Error updating asset:', error);
      alert('Update failed');
    }
  );
}


deleteSelectedShiftOverride() { 
  const selectedEmployeeIds = this.ShiftsOverride
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No shift override selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected shift Override?')) {
    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteShiftOverride(categoryId).subscribe(
        () => {
          console.log('shift pattern deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.ShiftsOverride = this.ShiftsOverride.filter(employee => employee.id !== categoryId);
          alert(' shift pattern deleted successfully');
          window.location.reload();

        },
        (error) => {
          console.error('Error deleting Category:', error);
        }
      );
    });
  }
}





  Employee: any[] = [];


       loadEmployee(): void {
      
                const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
              
                console.log('schemastore',selectedSchema )
                // Check if selectedSchema is available
                if (selectedSchema) {
                  this.employeeService.getemployeesMaster(selectedSchema).subscribe(
                    (result: any) => {
                      this.Employee = result;
                      console.log(' fetching Employees:');
              
                    },
                    (error) => {
                      console.error('Error fetching Employees:', error);
                    }
                  );
                }
                }





}
