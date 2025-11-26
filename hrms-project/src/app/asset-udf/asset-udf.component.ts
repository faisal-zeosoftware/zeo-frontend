import { Component, OnInit } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';

@Component({
  selector: 'app-asset-udf',
  templateUrl: './asset-udf.component.html',
  styleUrl: './asset-udf.component.css'
})
export class AssetUdfComponent {




    custom_fields_fam :any[] = [];

    LoanTypes:any []=[];

      asset_type: any = '';


        hasAddPermission: boolean = false;
        hasDeletePermission: boolean = false;
        hasViewPermission: boolean =false;
        hasEditPermission: boolean = false;

        userId: number | null | undefined;
        userDetails: any;
        userDetailss: any;
        schemas: string[] = []; // Array to store schema names



    constructor(
      private EmployeeService: EmployeeService ,
      private http: HttpClient,
      private authService: AuthenticationService,
      private dialog: MatDialog,
      private _formBuilder: FormBuilder,
      
  private DesignationService: DesignationService,
  private sessionService: SessionService,
  
    
     ) {}
  

     ngOnInit(): void {
  
      this.loadFormFieldsFam();
      this.loadLAssetType();

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

               
                this.hasAddPermission = this.checkGroupPermission('add_assetcustomfield', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_assetcustomfield', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_assetcustomfield', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_assetcustomfield', groupPermissions);
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


         loadFormFieldsFam(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
      this.EmployeeService.getFormFieldAsset(selectedSchema).subscribe(
        (result: any) => {
          this.custom_fields_fam = result;
        },
        (error: any) => {
          console.error('Error fetching EMployee Family Fields:', error);
        }
      );
      }
    }

        deleteCustomFieldFam(fieldId: number): void {
      if (confirm('Are you sure you want to delete this custom field?')) {
        this.EmployeeService.deleteAssetCustomfiled(fieldId).subscribe(
          (response) => {
            console.log('Field deleted successfully', response);
            // Remove the deleted field from the custom_fields array
            this.custom_fields_fam = this.custom_fields_fam.filter(field => field.id !== fieldId);
            alert('Field deleted successfully');
            window.location.reload();
          },
          (error) => {
            console.error('Field delete failed', error);
            alert('Error deleting field!');
          }
        );
      }
    }
    


      isFamfieldModalOpen:boolean=false;


    openFamFieldModal(): void {
      this.isFamfieldModalOpen = true;
    }
    ClosePopupFam(){
      this.isFamfieldModalOpen=false;
    }
  
  registerButtonClicked1 = false;

  registerButtonClicked2 = false;

  registerButtonClicked3 = false;

    registerButtonClicked = false;

    field_name_fam: any
  field_value_fam: any;
  data_type_fam:any='';
  dropdown_values_fam:any='';
  radio_values_fam:any="";


    
CreateEmployeeFeildFam(): void {
  this.registerButtonClicked = true;

  // Convert the dropdown_values string into an array
  const dropdownValuesArray = this.dropdown_values_fam
      ? this.dropdown_values_fam.split(',').map((value: any) => value.trim())
      : [];
      
 // Convert the radio_values string into an array
 const radio_valuesArray = this.radio_values_fam
 ? this.radio_values_fam.split(',').map((value: any) => value.trim())
 : [];

  const fieldData = {
    custom_field: this.field_name_fam,
      field_value: this.field_value_fam,
      data_type: this.data_type_fam,
      dropdown_values: dropdownValuesArray,
      radio_values: radio_valuesArray,
      asset_type: this.asset_type,

      // mandatory: this.mandatory  // Capture the mandatory field status
  };

  this.EmployeeService.registerEmpAddMoreFeildAsset(fieldData).subscribe(
      (response) => {
          console.log('Field added successfully', response);
          alert('Field added successfully');
          window.location.reload();
      },
      (error) => {
          console.error('Field addition failed', error);
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




updateCustomField(field: any): void {
  // Convert the dropdown_values and radio_values only if they are strings
  const updatedField = {
    ...field,
    dropdown_values: Array.isArray(field.dropdown_values)
      ? field.dropdown_values
      : field.dropdown_values
      ? field.dropdown_values.split(',').map((value: any) => value.trim())
      : null,
    radio_values: Array.isArray(field.radio_values)
      ? field.radio_values
      : field.radio_values
      ? field.radio_values.split(',').map((value: any) => value.trim())
      : null,
  };

  this.EmployeeService.updateEmpCustomFieldAsset(updatedField).subscribe(
    (response) => {
      console.log('Field updated successfully', response);
      alert('Field updated successfully');
      window.location.reload();
    },
    (error) => {
      console.error('Field update failed', error);
      alert('Error updating field!');
    }
  );
}


  loadLAssetType(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.EmployeeService.getAssetType(selectedSchema).subscribe(
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
        

}
