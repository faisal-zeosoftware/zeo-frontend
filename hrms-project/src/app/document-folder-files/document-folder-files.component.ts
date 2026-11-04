import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { ActivatedRoute } from '@angular/router';
import { DesignationService } from '../designation-master/designation.service';
import { HttpClient } from '@angular/common/http';
import { openZForm } from '../shared-ui/z-form.component';   // v1.62.10 (item 168)
import { folderFileForm } from '../shared-ui/z-forms-records';
import { zToast } from '../shared-ui/z-toast';
import { i18nT } from '../shared-ui/i18n-core';
import { environment } from '../../environments/environment';
import { zConfirm } from '../shared-ui/z-confirm';   // v1.62.10 (item 180) new-design confirm window

@Component({
  selector: 'app-document-folder-files',
  templateUrl: './document-folder-files.component.html',
  styleUrl: './document-folder-files.component.css'
})
export class DocumentFolderFilesComponent {

  documents: any[] = [];  // store fetched docs

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;   // v1.62.10 (item 168): Delete on each file
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
        private http: HttpClient,




    
    ) {
     
    }

    folderId: number | null = null;



      ngOnInit(): void {



      // 🔥 This listens every time routerLink changes the folder ID
  this.route.paramMap.subscribe(params => {
    this.folderId = Number(params.get('id'));
    console.log("Folder changed → ", this.folderId);

    this.getDocuments(); // reload documents
    this.loadFolderName();
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
            this.hasDeletePermission = true;   // v1.62.10 (item 168)
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
                    this.hasDeletePermission = true;   // v1.62.10 (item 168)
                    // this.hasEditPermission = true;

                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);


                    this.hasAddPermission = this.checkGroupPermission('add_folder', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    // this.hasEditPermission = this.checkGroupPermission('change_folder', groupPermissions);
                    // console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_folder', groupPermissions) || this.checkGroupPermission('delete_document', groupPermissions);   // v1.62.10 (item 168)
                    // console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_folder', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);


                  } else {
                    console.debug('No permission groups for this user.');   // v1.17.0 (audit M12): normal for an employee, not an error
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

  
  /** v1.62.10 (item 168): "+ Upload file" – the shared form (name and file) instead of the old "Uplaod file" pop-up and alerts */
  async openPopus(): Promise<void> {
    if (!this.folderId) { return; }
    if (await openZForm(folderFileForm(this.folderId))) { this.getDocuments(); }
  }

  /** v1.62.10 (item 168): Delete on a file – one confirmation, a short message */
  async deleteFile(doc: any): Promise<void> {
    if (!(await zConfirm(i18nT('Delete the file "{0}"?', [doc.name])))) { return; }
    const sch = localStorage.getItem('selectedSchema') || '';
    this.http.delete(`${environment.apiBaseUrl}/organisation/api/documents/${doc.id}/?schema=${encodeURIComponent(sch)}`).subscribe({
      next: () => { zToast(i18nT('File deleted.'), 'ok'); this.getDocuments(); },
      error: (e: any) => zToast(String(e?.error?.detail || i18nT('It could not be deleted.')), 'err'),
    });
  }

  folderName = '';
  fileKind(doc: any): string { const m = String(doc?.file || '').split('?')[0].match(/\.([a-z0-9]{1,5})$/i); return m ? m[1].toUpperCase() : ''; }

getDocuments(): void {
  if (!this.folderId) {
    console.error("Folder ID missing!");
    return;
  }

  this.employeeService.getDocumentsByFolder(this.folderId).subscribe(
    (data) => {
      this.documents = Array.isArray(data) ? data : (data?.results || []);
      console.log("Fetched Documents:", this.documents);
    },
    (error) => {
      console.error("Error loading documents:", error);
    }
  );
}


  /** v1.62.10 (item 168): the open folder's name as the page title */
  private loadFolderName(): void {
    const sch = localStorage.getItem('selectedSchema') || '';
    if (!this.folderId) { this.folderName = ''; return; }
    this.http.get<any>(`${environment.apiBaseUrl}/organisation/api/folders/${this.folderId}/?schema=${encodeURIComponent(sch)}`).subscribe({
      next: f => { this.folderName = f?.name || ''; }, error: () => { this.folderName = ''; } });
  }
}
