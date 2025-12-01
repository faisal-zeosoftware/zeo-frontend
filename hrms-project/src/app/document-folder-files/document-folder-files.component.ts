import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { ActivatedRoute } from '@angular/router';
import { DesignationService } from '../designation-master/designation.service';

@Component({
  selector: 'app-document-folder-files',
  templateUrl: './document-folder-files.component.html',
  styleUrl: './document-folder-files.component.css'
})
export class DocumentFolderFilesComponent {

  documents: any[] = [];  // store fetched docs

  hasAddPermission: boolean = false;
  // hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  // hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names



  
  constructor(
    private sessionService: SessionService,
    private authService: AuthenticationService,
        private employeeService: EmployeeService,
        private route: ActivatedRoute,
        private DesignationService: DesignationService,




    
    ) {
     
    }

    folderId: number | null = null;



      ngOnInit(): void {



      // 🔥 This listens every time routerLink changes the folder ID
  this.route.paramMap.subscribe(params => {
    this.folderId = Number(params.get('id'));
    console.log("Folder changed → ", this.folderId);

    this.getDocuments(); // reload documents
  });



    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property

          // this.created_by= this.userId;
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
            // this.hasDeletePermission = true;
            // this.hasEditPermission = true;

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
                    // this.hasDeletePermission = true;
                    // this.hasEditPermission = true;

                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);


                    this.hasAddPermission = this.checkGroupPermission('add_folder', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    // this.hasEditPermission = this.checkGroupPermission('change_folder', groupPermissions);
                    // console.log('Has edit permission:', this.hasEditPermission);

                    // this.hasDeletePermission = this.checkGroupPermission('delete_folder', groupPermissions);
                    // console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_folder', groupPermissions);
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
          console.log('scehmas-de', userData)
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

  
  isopenDocement: boolean = false;


  name: any = '';
  folder: number | null = null;

  openPopus(): void {
    this.isopenDocement = true;
  
    // Automatically set folder ID when popup opens
    this.folder = this.folderId;  
    console.log("Popup opened with folder:", this.folder);
  }

  selectedFile: File | null = null;


  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
 

  FolderDocuments:any []=[];

// ✅ Fetch document folders from backend
loadDocumentfolders(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.employeeService.getDocuments(selectedSchema).subscribe(
      (result: any) => {
        // Filter only top-level folders (no parent)
        this.FolderDocuments = result.filter((folder: any) => folder.parent === null);
        console.log('Fetched Document :', this.FolderDocuments);
      },
      (error) => {
        console.error('Error fetching document folders:', error);
      }
    );
  }
}

 

uploadfolderDocument(): void {
  if (!this.name) {
    alert("Please enter document name.");
    return;
  }

  if (!this.folder) {
    alert("Folder not selected!");
    return;
  }

  if (!this.selectedFile) {
    alert("Please upload a document.");
    return;
  }

  const formData = new FormData();
  formData.append('name', this.name);
  formData.append('folder', this.folder.toString());
  formData.append('file', this.selectedFile);

  this.employeeService.registerDocument(formData).subscribe(
    (response) => {
      console.log('Document added:', response);
      alert('Document Uploaded Successfully');
      this.isopenDocement = false;
      this.selectedFile = null;
      this.name = '';
      this.getDocuments();
    },
    (error) => {
      console.error('Upload failed', error);
      alert('Upload failed. Try again!');
    }
  );
}
    

getDocuments(): void {
  if (!this.folderId) {
    console.error("Folder ID missing!");
    return;
  }

  this.employeeService.getDocumentsByFolder(this.folderId).subscribe(
    (data) => {
      this.documents = data;
      console.log("Fetched Documents:", this.documents);
    },
    (error) => {
      console.error("Error loading documents:", error);
    }
  );
}

}
