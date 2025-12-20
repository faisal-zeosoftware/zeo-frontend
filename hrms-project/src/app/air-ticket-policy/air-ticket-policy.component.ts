import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import {  HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatOption } from '@angular/material/core';

@Component({
  selector: 'app-air-ticket-policy',
  templateUrl: './air-ticket-policy.component.html',
  styleUrl: './air-ticket-policy.component.css'
})
export class AirTicketPolicyComponent {


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

   

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  frequency_years: any = '';
  amount: any = '';
  allowance_type: any = '';
  country: any = '';
  travel_class: any = '';


  eligible_departments: number[] = [];
    eligible_designations: number[] = [];
  eligible_categories: number[] = [];  



  allowed_in_probation:  boolean = false;

  is_active:  boolean = false;


  Users:any []=[];
  LoanTypes:any []=[];


  Assets:any []=[];


  customFieldHeaders: { custom_field_id: number, custom_field_name: string }[] = [];



  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  custom_fieldsFam :any[] = [];
  Departments :any[] = [];

  Categories :any[] = [];

    Designations :any[] = [];


  @ViewChild('selectDept') selectDept: MatSelect | undefined;
    @ViewChild('selectdes') selectDes: MatSelect | undefined;

      @ViewChild('selectCat') selectCat: MatSelect | undefined;



  allSelecteddept=false;
  allSelectedcat=false;
  allSelectedDes=false;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private countryService:CountryService,
    private categoryService: CatogaryService,

    private DepartmentServiceService: DepartmentServiceService,



    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  this.loadLAssetType();

  this.loadCountries();
  this.loadCAtegory();
  this.loadDEpartments();
  this.loadDesignation();

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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_airticketpolicy', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_airticketpolicy', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_airticketpolicy', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_airticketpolicy', groupPermissions);
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


  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
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
  
  

toggleAllSelectiondept(): void {
  if (this.selectDept) {
    if (this.allSelecteddept) {
      this.selectDept.options.forEach((item: MatOption) => item.select());
    } else {
      this.selectDept.options.forEach((item: MatOption) => item.deselect());
    }
  }
}

toggleAllSelectioncat(): void {
  if (this.selectCat) {
    if (this.allSelectedcat) {
      this.selectCat.options.forEach((item: MatOption) => item.select());
    } else {
      this.selectCat.options.forEach((item: MatOption) => item.deselect());
    }
  }
}
toggleAllSelectionDes(): void {
  if (this.selectDes) {
    if (this.allSelectedDes) {
      this.selectDes.options.forEach((item: MatOption) => item.select());
    } else {
      this.selectDes.options.forEach((item: MatOption) => item.deselect());
    }
  }
}


 

    loadDEpartments(callback?: Function): void {

      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.DepartmentServiceService.getDepartments(selectedSchema).subscribe(
          (result: any) => {
            this.Departments = result;
            console.log(' fetching Companies:');
              if (callback) callback();
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }

     mapDeptNameToId() {

  if (!this.Departments || !this.editAsset?.eligible_departments) return;

  let values = this.editAsset.eligible_departments;

  // Case A — Already array of IDs
  if (Array.isArray(values) && typeof values[0] === "number") {
    return; // nothing to map
  }

  // Case B — If string → make array split by comma
  if (typeof values === 'string') {
    values = values.split(",").map(x => x.trim());
  }

  // Case C — Ensure always an array
  if (!Array.isArray(values)) {
    values = [values];
  }

  // Map each designation name → ID
  const mappedIds = values
    .map((name: string) => {
      const d = this.Departments.find(
        (e: any) => e.dept_name?.trim() === name?.trim()
      );
      return d ? d.id : null;
    })
    .filter((id: number | null) => id !== null);


  this.editAsset.eligible_departments = mappedIds;

  console.log("Mapped eligible_designations:", this.editAsset.eligible_departments);
}

      loadCAtegory(callback?: Function): void {

        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.categoryService.getcatogarys(selectedSchema).subscribe(
            (result: any) => {
              this.Categories = result;
              console.log(' fetching Companies:');
                   if (callback) callback();
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }

   mapCategoryNameToId() {
  if (!this.Categories || !this.editAsset?.eligible_categories) return;

  let values = this.editAsset.eligible_categories;

  // Case A — Already array of IDs
  if (Array.isArray(values) && typeof values[0] === "number") {
    return; // nothing to map
  }

  // Case B — If string → make array split by comma
  if (typeof values === 'string') {
    values = values.split(",").map(x => x.trim());
  }

  // Case C — Ensure always an array
  if (!Array.isArray(values)) {
    values = [values];
  }

  // Map each designation name → ID
  const mappedIds = values
    .map((name: string) => {
      const d = this.Categories.find(
        (e: any) => e.ctgry_title?.trim() === name?.trim()
      );
      return d ? d.id : null;
    })
    .filter((id: number | null) => id !== null);


  this.editAsset.eligible_categories = mappedIds;

  console.log("Mapped eligible_designations:", this.editAsset.eligible_categories);
}
  
        loadDesignation(callback?: Function): void {

          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.employeeService.getDesignations(selectedSchema).subscribe(
              (result: any) => {
                this.Designations = result;
                console.log(' fetching Companies:');
                    if (callback) callback();
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }

mapDesigNameToId() {
  if (!this.Designations || !this.editAsset?.eligible_designations) return;

  let values = this.editAsset.eligible_designations;

  // Case A — Already array of IDs
  if (Array.isArray(values) && typeof values[0] === "number") {
    return; // nothing to map
  }

  // Case B — If string → make array split by comma
  if (typeof values === 'string') {
    values = values.split(",").map(x => x.trim());
  }

  // Case C — Ensure always an array
  if (!Array.isArray(values)) {
    values = [values];
  }

  // Map each designation name → ID
  const mappedIds = values
    .map((name: string) => {
      const d = this.Designations.find(
        (e: any) => e.desgntn_job_title?.trim() === name?.trim()
      );
      return d ? d.id : null;
    })
    .filter((id: number | null) => id !== null);


  this.editAsset.eligible_designations = mappedIds;

  console.log("Mapped eligible_designations:", this.editAsset.eligible_designations);
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



          CreateAssetType(): void {
            this.registerButtonClicked = true;
            const companyData = {
              name: this.name,
            
              allowed_in_probation:this.allowed_in_probation,
              frequency_years:this.frequency_years,
              amount:this.amount,
              allowance_type:this.allowance_type,
              country:this.country,

              eligible_departments:this.eligible_departments,
              eligible_designations:this.eligible_designations,
              eligible_categories:this.eligible_categories,
              travel_class:this.travel_class,
              is_active:this.is_active,



              // Add other form field values to the companyData object
            };
          

        
            this.employeeService.registerAirTicketPolicy(companyData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                    alert('policy  has been Added ');
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




      
          loadLAssetType(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.employeeService.getairticketpolicy(selectedSchema).subscribe(
                (result: any) => {
                  this.LoanTypes = result;
                  console.log(' fetching Loantypes:');
          
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




      openEditPopuss(categoryId: number):void{
        
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
    this.LoanTypes.forEach(employee => employee.selected = this.allSelected);

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }



    isEditModalOpen: boolean = false;
    editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset };
  this.isEditModalOpen = true;

  this.loadDesignation(() => {
    this.mapDesigNameToId();
  });
  this.mapCategoryNameToId();
  this.mapDeptNameToId();
  this.mapCountryNameToId();
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

  this.employeeService.updateAirpolicy(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Airticket updated successfully!');
      this.closeEditModal();
      this.loadLAssetType(); // reload updated list
      window.location.reload();
    },
(error) => {
  console.error('Error updating Airticket Policy:', error);

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


deleteSelectedAirTicketPolicy() { 
  const selectedEmployeeIds = this.LoanTypes
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Asset type selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected AirTicket Policy ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteAirPolicy(categoryId).subscribe(
        () => {
          console.log('Policy  deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);

          completed++;

      if (completed === total) {
          alert(' Policy  deleted successfully');
          window.location.reload();
        }

        },
        (error) => {
          console.error('Error deleting Policy:', error);
          alert('Error deleting Policy: ' + error.statusText);
        }
      );
    });
  }
}

// loadLAsset(): void {
    
//   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

//   console.log('schemastore',selectedSchema )
//   // Check if selectedSchema is available
//   if (selectedSchema) {
//     this.employeeService.getAsset(selectedSchema).subscribe(
//       (result: any) => {
//         this.Assets = result;
//         console.log(' fetching Loantypes:');

//       },
//       (error) => {
//         console.error('Error fetching Companies:', error);
//       }
//     );
//   }
//   }



countries:any[]=[];

loadCountries(callback?: Function): void {
  this.countryService.getCountries().subscribe(
    (result: any) => {
      this.countries = result;
       if (callback) callback();
    },
    (error) => {
      console.error('Error fetching countries:', error);
    }
  );
}

  mapCountryNameToId() {

  if (!this.countries || !this.editAsset?.country) return;

  const emp = this.countries.find(
    (e: any) => e.country_name === this.editAsset.country
  );

  if (emp) {
    this.editAsset.country = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.country);
}



  

}
