import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import {  HttpErrorResponse } from '@angular/common/http';
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-asset-master',
  templateUrl: './asset-master.component.html',
  styleUrl: './asset-master.component.css'
})
export class AssetMasterComponent {

  private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

   

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  serial_number: any = '';

 
  model: any = '';
  purchase_date: any = '';
  status: any = '';
  condition: any = '';
  asset_type: any = '';





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



  constructor(
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
 

    this.employeeService.selectedBranches$.subscribe(ids => {
      
      this.loadLAssetType();

    });

  this.loadUsers();
  // this.loadLAssetType();
// this.loadLAsset();
this.loadFormFieldsFam();

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


                  // AssetMaster

                this.hasAddPermission = this.checkGroupPermission('add_asset', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                  
                this.hasEditPermission = this.checkGroupPermission('change_asset', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
    
                this.hasDeletePermission = this.checkGroupPermission('delete_asset', groupPermissions);
                console.log('Has delete permission:', this.hasDeletePermission);
  
                this.hasViewPermission = this.checkGroupPermission('view_asset', groupPermissions);
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
            
              serial_number:this.serial_number,
              model:this.model,
              purchase_date:this.purchase_date,
              status:this.status,
              condition:this.condition,
              asset_type:this.asset_type,

              // Add other form field values to the companyData object
            };
          
        
            this.employeeService.registerAsset(companyData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                const createdEmployeeId = response.id; // Adjust based on your API response
                this.employeeService.setEmployeeId(createdEmployeeId);
                this.postCustomFieldValuesFam(createdEmployeeId);
                    alert('Asset  has been Added ');
                    // window.location.reload();
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




      
          // loadLAssetType(callback?: Function): void {
    
          //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
          //   console.log('schemastore',selectedSchema )
          //   // Check if selectedSchema is available
          //   if (selectedSchema) {
          //     this.employeeService.getAssetType(selectedSchema).subscribe(
          //       (result: any) => {
          //         this.LoanTypes = result;
          //         console.log(' fetching Loantypes:');
          //         if (callback) callback();
          
          //       },
          //       (error) => {
          //         console.error('Error fetching Companies:', error);
          //       }
          //     );
          //   }
          //   }

            loadLAssetType(callback?: Function): void {
    
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
          

   mapLAssetNameToId() {

  if (!this.LoanTypes || !this.editAsset?.asset_type) return;

  const Loan = this.LoanTypes.find(
    (l: any) => l.name === this.editAsset.asset_type
  );

  if (Loan) {
    this.editAsset.asset_type = Loan.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.asset_type);
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
  this.editAsset = { ...asset }; // copy asset data
  this.isEditModalOpen = true;

  this.mapLAssetNameToId();
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

  this.employeeService.updateAsset(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Asset  updated successfully!');
      this.closeEditModal();
      // this.loadLAsset(); 
      window.location.reload();
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


deleteSelectedAssetMaster() { 
  const selectedEmployeeIds = this.Assets
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Asset type selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Asset ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteAsset(categoryId).subscribe(
        () => {
          console.log('Asset deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);

           completed++;

         if (completed === total) {
          alert(' Asset Master deleted successfully');
          window.location.reload();
          }

        },
        (error) => {
          console.error('Error deleting Asset Master:', error);
          alert('Error deleting Asset Master: ' + error.statusText);
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


// loadLAsset(): void {
//   const selectedSchema = this.authService.getSelectedSchema();
//   if (selectedSchema) {
//     this.employeeService.getAsset(selectedSchema).subscribe(
//       (result: any[]) => {
//         this.Assets = result;

//         // Step: Extract unique custom_field IDs and map to readable names
//         const allCustomFields = result.flatMap(asset => asset.asset_custom_fields || []);
//         const uniqueFieldIds = [...new Set(allCustomFields.map(field => field.custom_field))];

//         // Map IDs to names using your existing custom field definitions
//         this.customFieldHeaders = uniqueFieldIds.map(fieldId => {
//           const fieldDef = this.custom_fieldsFam.find(f => f.id === fieldId);
//           return {
//             custom_field_id: fieldId,
//             custom_field_name: fieldDef ? fieldDef.custom_field : `${fieldId}`
//           };
//         });

//       },
//       (error) => {
//         console.error('Error fetching assets:', error);
//       }
//     );
//   }
// }



  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
  
    // Use your new filtered API call
    this.employeeService.getAssetNew(schema, branchIds).subscribe({
      next: (data: any[]) => {
        // 1. Set the main data
        this.Assets = data;
  
        // 2. --- IMPLEMENTED LOGIC TO EXTRACT CUSTOM FIELDS ---
        // Step: Extract unique custom_field IDs from the filtered data
        const allCustomFields = data.flatMap(asset => asset.asset_custom_fields || []);
        const uniqueFieldIds = [...new Set(allCustomFields.map(field => field.custom_field))];
  
        // Map IDs to names using your existing custom field definitions (custom_fieldsFam)
        this.customFieldHeaders = uniqueFieldIds.map(fieldId => {
          const fieldDef = this.custom_fieldsFam.find(f => f.id === fieldId);
          return {
            custom_field_id: fieldId,
            custom_field_name: fieldDef ? fieldDef.custom_field : `${fieldId}`
          };
        });
        // ---------------------------------------------------
  
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

getCustomFieldValue(asset: any, fieldId: number): string {
  const field = asset.asset_custom_fields?.find((f: any) => f.custom_field === fieldId);
  return field ? field.field_value : '-';
}
  
  loadFormFieldsFam(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.employeeService.getFormFieldAsset(selectedSchema).subscribe(
      (result: any) => {
        this.custom_fieldsFam = result;
      },
      (error: any) => {
        console.error('Error fetching countries:', error);
      }
    );
    }
  }


  postCustomFieldValuesFam(empMasterId: number): void {
    const customFieldValues = this.custom_fieldsFam.map(field => ({
      custom_field: field.id,  // ✅ Use field ID instead of name
      field_value: field.field_value,
      asset: empMasterId
    }));
  
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return;
    }
  
    customFieldValues.forEach(fieldValue => {
      this.http.post(`${this.apiUrl}/organisation/api/asset-customfield-value/?schema=${selectedSchema}`, fieldValue)
        .subscribe(
          (response: any) => {
            console.log('Custom field value posted successfully', response);
          },
          (error: HttpErrorResponse) => {
            console.error('Failed to post custom field value', error);
          }
        );
    });
  }
  
  


}
