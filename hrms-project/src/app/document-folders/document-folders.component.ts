import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-document-folders',
  templateUrl: './document-folders.component.html',
  styleUrl: './document-folders.component.css'
})
export class DocumentFoldersComponent {

  

  hasViewPermissionProjects: boolean = false;
  hasViewPermissionProjectsStages: boolean = false;
  hasViewPermissionProjectsTaks: boolean = false;
  hasViewPermissionProjectsTimesheet: boolean = false;


  userId: number | null | undefined;
  userDetails: any;


  Catogaries: any[] = [];



  constructor(private EmployeeService:EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService,
        private employeeService: EmployeeService,




    
    ) {
     
    }

    

    isMenuOpen: boolean = true; 
    toggleSidebarMenu(): void
     { this.isMenuOpen = !this.isMenuOpen; }


    ngOnInit(): void {
  

      this.loadDocumentfolders();


      // Retrieve user ID
  this.userId = this.sessionService.getUserId();
  
  // Fetch user details using the obtained user ID
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
          this.hasViewPermissionProjects = true;
          this.hasViewPermissionProjectsStages = true;
          this.hasViewPermissionProjectsTaks = true;
          this.hasViewPermissionProjectsTimesheet = true;

       
  
  
  
      
          // Fetch designations without checking permissions
          this.fetchDesignations(selectedSchema);
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
                  this.hasViewPermissionProjects = true;
                  this.hasViewPermissionProjectsStages = true;
                  this.hasViewPermissionProjectsTaks = true;
                  this.hasViewPermissionProjectsTimesheet = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionProjects = this.checkGroupPermission('view_project', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionProjects);
                      
                       this.hasViewPermissionProjectsStages = this.checkGroupPermission('view_projectstage', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionProjectsStages);

                       this.hasViewPermissionProjectsTaks = this.checkGroupPermission('view_task', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionProjectsTaks);
                      
                       this.hasViewPermissionProjectsTimesheet = this.checkGroupPermission('view_timesheet', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionProjectsTimesheet);
                       
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
  } else {
    console.error('User ID is null.');
  }
  
  
  
  
  
  
    }
  
  
   
  
    
  
    
    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
      return groupPermissions.some(permission => permission.codename === codeName);
    }
  









    iscreateLoanApp: boolean = false;




    openPopus():void{
      this.iscreateLoanApp = true;

    }
  
    closeapplicationModal():void{
      this.iscreateLoanApp = false;

    }



    name: any = '';
    parent: number | null = null;

    CreateFolder(): void {
    
  
      const formData = new FormData();
    
      formData.append('name', this.name);
 
   
    
     
    
      // Add file
     
      this.employeeService.registerFolder(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
          alert('Folder has been added.');
          window.location.reload();
        },
        (error) => {
          console.error('Add failed', error);
          alert('Enter all fields correctly!');
        }
      );
    }
    
    Documentfolders:any []=[];

// ✅ Fetch document folders from backend
loadDocumentfolders(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.employeeService.getDocumentFolders(selectedSchema).subscribe(
      (result: any) => {
        // Filter only top-level folders (no parent)
        this.Documentfolders = result.filter((folder: any) => folder.parent === null);
        console.log('Fetched Document Folders:', this.Documentfolders);
      },
      (error) => {
        console.error('Error fetching document folders:', error);
      }
    );
  }
}


expandedFolderIndex: number | null = null;

toggleSubfolder(index: number): void {
  // If the clicked folder is already expanded, collapse it
  if (this.expandedFolderIndex === index) {
    this.expandedFolderIndex = null;
  } else {
    // Otherwise, expand the clicked folder
    this.expandedFolderIndex = index;
  }
}




iscreatesubfolder: boolean = false;


// Open SubFolder Popup
openSubFolderPopup(folderId: number, event: Event): void {
  event.stopPropagation(); // Prevent expand/collapse
  this.parent = folderId;  // store clicked parent folder ID
  this.name = '';          // reset input
  this.iscreatesubfolder = true; // open modal

  console.log("Open popup - Parent Folder ID:", this.parent);
}

closeSubfolderModal(): void {
  this.iscreatesubfolder = false;
}

CreateFolderSubFolder(): void {
  if (!this.name || !this.parent) {
    alert("Enter subfolder name.");
    return;
  }

  const formData = new FormData();
  formData.append('name', this.name);
  formData.append('parent', this.parent.toString());

  this.employeeService.registerFolder(formData).subscribe(
    (response) => {
      console.log('Subfolder added:', response);
      alert('Subfolder has been added.');

      this.iscreatesubfolder = false;
      this.loadDocumentfolders(); // reload list
    },
    (error) => {
      console.error('Error adding subfolder:', error);
      alert('Failed to create subfolder');
    }
  );
}


    fetchDesignations(selectedSchema: string) {
      this.CatogaryService.getcatogarys(selectedSchema).subscribe(
        (data: any) => {
          this.Catogaries = data;
          console.log('employee:', this.Catogaries);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }

}
