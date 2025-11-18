import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { BranchServiceService } from '../branch-master/branch-service.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';


@Component({
  selector: 'app-company-policy',
  templateUrl: './company-policy.component.html',
  styleUrl: './company-policy.component.css'
})
export class CompanyPolicyComponent {

  @ViewChild('fileInput') fileInput!: ElementRef;

  title:any='';
  description:any='';
  branch:any='';

  department:any='';
  category:any='';

  policy_file: string | undefined;


  selectedFile!: File | null;


  Branches: any[] = [];
  Depts: any[] = [];

  Cats: any[] = [];

  registerButtonClicked =false;

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names


policies: any[] = [];





  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private branchService:BranchServiceService,
    private DesignationService: DesignationService,
    private employeeService:EmployeeService,

  
    ) {}

    ngOnInit(): void {
 
      this.LoadBranches();
      this.LoadCats();

      this.LoadDepts();
      this.getCompanyPolicies();


      
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


    // checkViewPermission(permissions: any[]): boolean {
    //   const requiredPermission = 'view_companypolicy' ||'add_companypolicy' ||'delete_companypolicy' ||'change_companypolicy';
      
      
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

    onFileSelected(event: any): void {
      this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
    }
    
  

    registerApproveLevel(): void {
      this.registerButtonClicked = true;
      if (!this.title || !this.description || !this.branch) {
        return;
      }
    
      const formData = new FormData();
      formData.append('title', this.title);
      formData.append('description', this.description);
      formData.append('branch', this.branch);
      formData.append('department', this.department);
      formData.append('category', this.category);

      // formData.append('image', this.selectedFile);
        // Append the profile picture only if it's selected
   // Append the image only if it's selected
   if (this.selectedFile) {
    formData.append('policy_file', this.selectedFile);
  }
  
    
      this.branchService.registerpolicy(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
          alert('Company Policy has been added');
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
  

   

    getCompanyPolicies() {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.branchService.getplo(selectedSchema).subscribe(
          (result: any) => {
            this.policies = result;
            console.log(' fetching Employees:');
    
          },
          (error) => {
            console.error('Error fetching Employees:', error);
          }
        );
      }
  
    }



    downloadPolicy(policyUrl: string, fileName: string): void {
      this.http.get(policyUrl, { responseType: 'blob' }).subscribe((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }


    LoadBranches() {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.branchService.getBranches(selectedSchema).subscribe(
          (result: any) => {
            this.Branches = result;
            console.log(' fetching Employees:');
    
          },
          (error) => {
            console.error('Error fetching Employees:', error);
          }
        );
      }
  
    }


    LoadDepts() {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.branchService.getDepartment(selectedSchema).subscribe(
          (result: any) => {
            this.Depts = result;
            console.log(' fetching Depts:');
    
          },
          (error) => {
            console.error('Error fetching Depts:', error);
          }
        );
      }
  
    }
    LoadCats() {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.branchService.getCategory(selectedSchema).subscribe(
          (result: any) => {
            this.Cats = result;
            console.log(' fetching Cats:');
    
          },
          (error) => {
            console.error('Error fetching Cats:', error);
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
allSelecteds: boolean = false;

toggleCheckboxes() {
this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
this.allSelecteds = !this.allSelecteds;
this.policies.forEach(employee => employee.selected = this.allSelecteds);

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
const selectedEmployeeIds = this.policies
  .filter(employee => employee.selected)
  .map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
  alert('No policies  selected for deletion.');
  return;
}

if (confirm('Are you sure you want to delete the selected policies ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

  selectedEmployeeIds.forEach(categoryId => {
    this.employeeService.deletePolicy(categoryId).subscribe(
      () => {
        console.log(' policies deleted successfully:', categoryId);
        // Remove the deleted employee from the local list
        this.policies = this.policies.filter(employee => employee.id !== categoryId);
        completed++;
         if (completed === total) {
        alert(' policies deleted successfully');
        window.location.reload();
         }

      },
      (error) => {
        console.error('Error deleting policies:', error);
        alert('Error deleting policies: ' + error.statusText);
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

this.employeeService.updatePolicy(this.editAsset.id, this.editAsset).subscribe(
  (response) => {
    alert(' policies  updated successfully!');
    this.closeEditModal();
    window.location.reload();
  },
  (error) => {
    console.error('Error updating asset:', error);
    alert('Update failed');
  }
);
}


isImage(fileUrl: string): boolean {
  return fileUrl.match(/\.(jpeg|jpg|png|gif|bmp)$/i) !== null;
}



triggerFileInput() {
  this.fileInput.nativeElement.click();
}

getFileName(fileUrl: string): string {
  return fileUrl.split('/').pop() || 'Existing File';
}


}
