import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { CountryService } from '../country.service';
declare var $: any;

import {combineLatest, Subscription } from 'rxjs';


@Component({
  selector: 'app-shift-pattern',
  templateUrl: './shift-pattern.component.html',
  styleUrl: './shift-pattern.component.css'
})
export class ShiftPatternComponent {

  
  private dataSubscription?: Subscription;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  Patern_name:any='';
  description: any = '';

 
  
  monday_shift:any='';

  tuesday_shift:any='';

  wednesday_shift:any='';

  thursday_shift:any='';

  friday_shift:any='';

  saturday_shift:any='';

  sunday_shift:any='';





  Users:any []=[];
  // LoanTypes:any []=[];

  Shifts:any []=[];

ShiftsPattern: any[] = [];




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


   // combineLatest waits for both Schema and Branches to have a value
   this.dataSubscription = combineLatest([
    this.employeeService.selectedSchema$,
    this.employeeService.selectedBranches$
  ]).subscribe(([schema, branchIds]) => {
    if (schema) {
      this.fetchEmployees(schema, branchIds);  
      

    }
  });


   // Listen for sidebar changes so the dropdown updates instantly
   this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadShifts();

  });
  
 
  this.loadUsers();
  // this.loadLAssetType();
  // this.loadShifts();
  // this.loadShiftsPattern();



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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_shiftpattern', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_shiftpattern', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_shiftpattern', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_shiftpattern', groupPermissions);
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




  registerWeeklyEmployeeShifts(): void {
    this.registerButtonClicked = true;

    if (!this.monday_shift || !this.tuesday_shift || !this.wednesday_shift|| !this.thursday_shift
      || !this.friday_shift || !this.saturday_shift|| !this.sunday_shift 
    ) {
      alert('Please fill out all required fields.');
      return;
    }

    const companyData = {
      monday_shift: this.monday_shift,
      tuesday_shift: this.tuesday_shift,
      wednesday_shift: this.wednesday_shift,
      thursday_shift: this.thursday_shift,
      friday_shift: this.friday_shift,
      saturday_shift: this.saturday_shift,
      sunday_shift: this.sunday_shift,
      name: this.Patern_name,


      // employee: this.employee,
      // branch: this.branch,
      // department: this.department,
      // designation: this.designation,
      // role: this.role,

    };

    this.employeeService.registerWeeklyShifts(companyData).subscribe(
      (response) => { 
        console.log('Registration successful', response);
        alert('Shift has been added.');
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


    loadShifts(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.countryService.getShiftsNew(selectedSchema,savedIds).subscribe(
        (result: any) => {
          this.Shifts = result;
          console.log(' fetching Companies:');
  
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }


    // loadShiftsPattern(callback?: Function): void {
    
    //     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
    //     console.log('schemastore',selectedSchema )
    //     // Check if selectedSchema is available
    //     if (selectedSchema) {
    //       this.countryService.getShiftsPattern(selectedSchema).subscribe(
    //         (result: any) => {
    //           this.ShiftsPattern = result;
    //           console.log(' fetching Companies:');
    //             if (callback) callback();
      
    //         },
    //         (error) => {
    //           console.error('Error fetching Companies:', error);
    //         }
    //       );
    //     }
    //     }

        isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.countryService.getShiftsPatternNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.ShiftsPattern = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }




  mapShiftPatternNameToId() {
  if (!this.Shifts || !this.editAsset?.monday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.monday_shift
  );

  if (shif) {
    this.editAsset.monday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.monday_shift);
}

  mapTuesdayNameToId() {
  if (!this.Shifts || !this.editAsset?.tuesday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.tuesday_shift
  );

  if (shif) {
    this.editAsset.tuesday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.tuesday_shift);
}

  mapWednesdayNameToId() {
  if (!this.Shifts || !this.editAsset?.wednesday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.wednesday_shift
  );

  if (shif) {
    this.editAsset.wednesday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.wednesday_shift);
}

  mapThursdayNameToId() {
  if (!this.Shifts || !this.editAsset?.thursday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.thursday_shift
  );

  if (shif) {
    this.editAsset.thursday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.thursday_shift);
}

  mapFridayNameToId() {
  if (!this.Shifts || !this.editAsset?.friday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.friday_shift
  );

  if (shif) {
    this.editAsset.friday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.friday_shift);
}

  mapSaturdayNameToId() {
  if (!this.Shifts || !this.editAsset?.saturday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.saturday_shift
  );

  if (shif) {
    this.editAsset.saturday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.saturday_shift);
}

  mapSundayNameToId() {
  if (!this.Shifts || !this.editAsset?.sunday_shift) return;

  const shif = this.Shifts.find(
    (s: any) => s.name === this.editAsset.sunday_shift
  );

  if (shif) {
    this.editAsset.sunday_shift = shif.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.sunday_shift);
}











      
          // loadLAssetType(): void {
    
          //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
          //   console.log('schemastore',selectedSchema )
          //   // Check if selectedSchema is available
          //   if (selectedSchema) {
          //     this.employeeService.getAssetType(selectedSchema).subscribe(
          //       (result: any) => {
          //         this.LoanTypes = result;
          //         console.log(' fetching Loantypes:');
          
          //       },
          //       (error) => {
          //         console.error('Error fetching Companies:', error);
          //       }
          //     );
          //   }
          //   }
        



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
    this.ShiftsPattern.forEach(employee => employee.selected = this.allSelected);

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


  this.mapShiftPatternNameToId();
  this.mapTuesdayNameToId();
  this.mapWednesdayNameToId();
  this.mapThursdayNameToId();
  this.mapFridayNameToId();
  this.mapSaturdayNameToId();
  this.mapSundayNameToId();
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

  this.employeeService.updateShiftPattern(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Shift Pattern  updated successfully!');
      this.closeEditModal();
      // combineLatest waits for both Schema and Branches to have a value
      this.dataSubscription = combineLatest([
        this.employeeService.selectedSchema$,
        this.employeeService.selectedBranches$
      ]).subscribe(([schema, branchIds]) => {
        if (schema) {
          this.fetchEmployees(schema, branchIds);  
          

        }
      });

    },
(error) => {
  console.error('Error updating asset:', error);

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


deleteSelectedShiftPattern() { 
  const selectedEmployeeIds = this.ShiftsPattern
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No shift pattern selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected shift pattern?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteShiftPattern(categoryId).subscribe(
        () => {
          console.log('shift pattern deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.ShiftsPattern = this.ShiftsPattern.filter(employee => employee.id !== categoryId);

          completed++;

          if (completed === total) {
          alert(' shift pattern deleted successfully');
          window.location.reload();
          }

        },
        (error) => {
          console.error('Error deleting shift pattern:', error);
          alert('Error deleting shift pattern: ' + error.statusText);
        }
      );
    });
  }
}


}
