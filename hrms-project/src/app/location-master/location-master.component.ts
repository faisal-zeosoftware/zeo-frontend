import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { UserMasterService } from '../user-master/user-master.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { CountryService } from '../country.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-location-master',
  templateUrl: './location-master.component.html',
  styleUrl: './location-master.component.css'
})
export class LocationMasterComponent {

   @ViewChild('logoInput') logoInput!: ElementRef;


  registerButtonClicked = false;
  schema_name : string = '';
  name : string = '';
  owner:any='';
  users:any[]=[];
  logo: File | null = null;
  country:any='';
  countries:any[]=[];

  Locations:any[]=[];
    LoanTypes:any []=[];

 hasAddPermission: boolean = false;
 hasDeletePermission: boolean = false;
 hasViewPermission: boolean =false;
 hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = [];

  Schemas:any[]=[];

  
  constructor(
   
    private http: HttpClient,
    private authService: AuthenticationService,
    private userService: UserMasterService,
    private countryService:CountryService,
    private companyRegistrationService: CompanyRegistrationService,
    private DesignationService: DesignationService,
    private sessionService: SessionService,
    private employeeService: EmployeeService,
   ) {}


   onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.logo = input.files[0];
    } else {
      this.logo = null;
    }
  }

  ngOnInit(): void {

    this.loadUsers();
    this.loadCompanies();
    this.loadCountries();

    this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property
      // this.username = this.userDetails.username;
   

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

               
                this.hasAddPermission = this.checkGroupPermission('add_company', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_company', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_company', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_company', groupPermissions);
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

     iscreateLoanApp: boolean = false;




      openPopus():void{
        this.iscreateLoanApp = true;

      }
    
      closeapplicationModal():void{
        this.iscreateLoanApp = false;

      }


             

showEditBtn: boolean = false;
isEditModalOpen: boolean = false;
editAsset: any = {}; 
  
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
this.Schemas.forEach(employee => employee.selected = this.allSelecteds);

}


openEditModal(asset: any): void {
this.editAsset = { ...asset }; // copy asset data
this.isEditModalOpen = true;
}

closeEditModal(): void {
   this.isEditModalOpen = false;
     this.editAsset = {};
      }

















    
    
    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
    }

       isLoading: boolean = false;
    

   registerCategory(): void {
    this.registerButtonClicked = true;
  
    if (!this.schema_name || !this.name || !this.logo || !this.country ) {
      let errorMessage = '';
      if (!this.schema_name) errorMessage += 'Location Name field is blank. ';
      if (!this.name) errorMessage += 'Name field is blank. ';
      if (!this.logo) errorMessage += 'Company Logo is blank. ';
      alert(errorMessage.trim());
      return; // Exit the function if validation fails
    }
  
    // Validation for spaces in the schema_name field
    const schemaNameHasSpaces = /\s/.test(this.schema_name);
    if (schemaNameHasSpaces) {
      alert('Schema name should not contain spaces.');
      return; // Exit the function if validation fails
    }
  
    // Prepare FormData
    const formData = new FormData();
    formData.append('schema_name', this.schema_name);
    formData.append('name', this.name);
    formData.append('owner', this.owner);
    formData.append('country', this.country);

    if (this.logo) {
      formData.append('logo', this.logo, this.logo.name);
    }

            this.isLoading = true;
  
    // Make API call
    this.userService.getSchema(formData).subscribe(
      (response) => {
         this.isLoading = false;
        console.log('Registration successful', response);
        alert('Location has been Registered!');
        window.location.reload();
      },
      (error) => {
                 this.isLoading = false;
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


  deleteSelectedLocationmaster() { 
  const selectedEmployeeIds = this.Schemas
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Location selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected  ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteLocations(categoryId).subscribe(
        () => {
          console.log(' Location deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.Locations = this.Locations.filter(employee => employee.id !== categoryId);

          completed++;

         if (completed === total) { 
          alert(' Company  deleted successfully');
          window.location.reload();
         }

        },
        (error) => {
          console.error('Error deleting Loan Repayment:', error);
          alert('Error deleting Loan Repayment: ' + error.statusText);
        }
      );
    });
  }
}


updateLocations(): void {

  this.registerButtonClicked = true;

  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  const formData = new FormData();

  // Append text fields
  formData.append('schema_name', this.editAsset.schema_name);
  formData.append('name', this.editAsset.name);
  formData.append('country', this.editAsset.country);

  // Append file ONLY if new file is selected
  if (this.selectedLogoFile) {
    formData.append('logo', this.selectedLogoFile);
  }

  this.employeeService.updateLC(this.editAsset.id, formData).subscribe(
    (response) => {
      alert('Location updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
    (error) => {
      console.error('Error updating Location:', error);

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















  
  loadCountries(): void {
    this.countryService.getCountries().subscribe(
      (result: any) => {
        this.countries = result;
      },
      (error) => {
        console.error('Error fetching countries:', error);
      }
    );
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (result: any) => {
        this.users = result;
      },
      (error) => {
        console.error('Error fetching countries:', error);
      }
    );
  }


  loadCompanies(): void { 
    this.companyRegistrationService.getCompany().subscribe(
      (result: any) => {
        this.Schemas = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }


  // logo view

  selectedLogoFile: File | null = null;






triggerLogoInput() {
  this.logoInput.nativeElement.click();
}
onLogoSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedLogoFile = file;
  }
}

getFileName(fileUrl: string): string {
  return fileUrl?.split('/').pop() || 'Existing File';
}



}
/////////////////////////////////////
