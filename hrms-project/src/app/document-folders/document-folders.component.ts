import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

import { combineLatest, Subscription } from 'rxjs';
import { Router } from '@angular/router';


import { openZForm } from '../shared-ui/z-form.component';   // v1.62.10 (item 168)
import { folderForm, FOLDER_EDIT_FORM } from '../shared-ui/z-forms-records';

@Component({
  selector: 'app-document-folders',
  templateUrl: './document-folders.component.html',
  styleUrl: './document-folders.component.css'
})
export class DocumentFoldersComponent implements OnInit, OnDestroy {

  /* =========================================================
     SUBSCRIPTION
     ========================================================= */

  private dataSubscription?: Subscription;


  /* =========================================================
     RESPONSIVE SIDEBAR
     ========================================================= */

  isMobile = false;

  /*
   * Desktop:
   *   true  = 210px expanded
   *   false = 56px collapsed
   *
   * Mobile:
   *   true  = sidenav opened
   *   false = sidenav closed
   */

  isMenuOpen = true;


  /* =========================================================
     PERMISSIONS
     ========================================================= */

  hasViewPermissionDocumentFolder = false;
  hasAddPermissionDocumentFolder = false;
  hasEditPermissionDocumentFolder = false;   // v1.62.10 (item 168): rename folders


  /* =========================================================
     USER
     ========================================================= */

  userId: number | null | undefined;
  userDetails: any;


  /* =========================================================
     DATA
     ========================================================= */

  Catogaries: any[] = [];

  Documentfolders: any[] = [];

  isLoading = false;

  expandedFolderIndex: number | null = null;


  /* =========================================================
     MODALS
     ========================================================= */



  /* =========================================================
     FORM
     ========================================================= */



  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor(
    private employeeService: EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService,
    private router: Router
  ) {}

  /** v1.20.1: no folder open – show what to do instead of an empty page */
  get noFolderOpen(): boolean { return !this.router.url.includes('/document-folder-files/'); }


  /* =========================================================
     INIT
     ========================================================= */

  ngOnInit(): void {

    /*
     * Set initial responsive state.
     */
    this.checkMobile();


    /*
     * Load folders whenever schema/branches change.
     */
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {

      if (schema) {
        this.loadDocumentfolders(schema, branchIds);
      }

    });


    /*
     * Get logged-in user.
     */
    this.userId = this.sessionService.getUserId();


    if (this.userId !== null) {

      this.authService.getUserData(this.userId).subscribe({

        next: async (userData: any) => {

          this.userDetails = userData;

          console.log('User ID:', this.userId);
          console.log('User Details:', this.userDetails);


          const isSuperuser =
            this.userDetails?.is_superuser || false;


          const selectedSchema =
            this.authService.getSelectedSchema();


          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }


          /* =================================================
             SUPERUSER
             ================================================= */

          if (isSuperuser) {

            console.log('User is superuser.');

            this.hasViewPermissionDocumentFolder = true;
            this.hasAddPermissionDocumentFolder = true;
            this.hasEditPermissionDocumentFolder = true;   // v1.62.10 (item 168)

            this.fetchDesignations(selectedSchema);

            return;
          }


          /* =================================================
             NORMAL USER
             ================================================= */

          console.log('User is not superuser.');


          try {

            const permissionsData: any =
              await this.DesignationService
                .getDesignationsPermission(selectedSchema)
                .toPromise();


            console.log(
              'Permissions data:',
              permissionsData
            );


            if (
              Array.isArray(permissionsData) &&
              permissionsData.length > 0
            ) {

              const firstItem = permissionsData[0];


              /* =============================================
                 SUPERUSER FROM PERMISSION API
                 ============================================= */

              if (firstItem.is_superuser) {

                console.log(
                  'User is superuser according to permissions API'
                );

                this.hasViewPermissionDocumentFolder = true;
                this.hasAddPermissionDocumentFolder = true;
                this.hasEditPermissionDocumentFolder = true;   // v1.62.10 (item 168)

              }


              /* =============================================
                 GROUP PERMISSIONS
                 ============================================= */

              else if (
                firstItem.groups &&
                Array.isArray(firstItem.groups) &&
                firstItem.groups.length > 0
              ) {

                const groupPermissions =
                  firstItem.groups.flatMap(
                    (group: any) =>
                      group.permissions || []
                  );


                console.log(
                  'Group Permissions:',
                  groupPermissions
                );


                this.hasViewPermissionDocumentFolder =
                  this.checkGroupPermission(
                    'view_folder',
                    groupPermissions
                  );


                this.hasAddPermissionDocumentFolder =
                  this.checkGroupPermission(
                    'add_folder',
                    groupPermissions
                  );
                this.hasEditPermissionDocumentFolder = this.checkGroupPermission('change_folder', groupPermissions);   // v1.62.10 (item 168)


                console.log(
                  'Has view permission:',
                  this.hasViewPermissionDocumentFolder
                );


                console.log(
                  'Has add permission:',
                  this.hasAddPermissionDocumentFolder
                );

              }


              /* =============================================
                 NO GROUPS
                 ============================================= */

              else {

                console.error(
                  'No groups found in permissions data.',
                  firstItem
                );

              }

            }

            else {

              console.error(
                'Permissions data is empty or invalid.',
                permissionsData
              );

            }

          }

          catch (error) {

            console.error(
              'Error fetching permissions:',
              error
            );

          }

        },

        error: (error) => {

          console.error(
            'Failed to fetch user details:',
            error
          );

        }

      });

    }

    else {

      console.error('User ID is null.');

    }

  }


  /* =========================================================
     DESTROY
     ========================================================= */

  ngOnDestroy(): void {

    this.dataSubscription?.unsubscribe();

  }


  /* =========================================================
     RESPONSIVE SIDEBAR
     ========================================================= */

  @HostListener('window:resize')
  onWindowResize(): void {

    this.checkMobile();

  }


  private checkMobile(): void {

    const mobile =
      window.innerWidth <= 991.98;


    /*
     * Only change state when breakpoint changes.
     * This prevents unnecessary sidebar toggling.
     */

    if (mobile !== this.isMobile) {

      this.isMobile = mobile;


      if (this.isMobile) {

        /*
         * Mobile:
         * Start with sidebar closed.
         */
        this.isMenuOpen = false;

      }

      else {

        /*
         * Desktop:
         * Start with sidebar expanded.
         */
        this.isMenuOpen = true;

      }

    }

  }


  toggleSidebarMenu(): void {

    this.isMenuOpen = !this.isMenuOpen;

  }


  closeOnMobile(): void {

    if (this.isMobile) {

      this.isMenuOpen = false;

    }

  }


  /* =========================================================
     PERMISSION CHECK
     ========================================================= */

  checkGroupPermission(
    codeName: string,
    groupPermissions: any[]
  ): boolean {

    return groupPermissions.some(
      permission =>
        permission?.codename === codeName
    );

  }


  /* =========================================================
     LOAD DOCUMENT FOLDERS
     ========================================================= */

  loadDocumentfolders(
    schema: string,
    branchIds: number[]
  ): void {

    this.isLoading = true;


    this.employeeService
      .getDocumentFoldersNew(schema, branchIds)
      .subscribe({

        next: (result: any) => {

          const folders =
            Array.isArray(result)
              ? result
              : [];


          /*
           * Only show top-level folders.
           * Subfolders remain inside folder.subfolders.
           */
          this.Documentfolders =
            folders.filter(
              (folder: any) =>
                folder.parent === null
            );


          console.log(
            'Fetched Document Folders:',
            this.Documentfolders
          );


          this.isLoading = false;

        },


        error: (err) => {

          console.error(
            'Fetch document folders error:',
            err
          );

          this.Documentfolders = [];

          this.isLoading = false;

        }

      });

  }


  /* =========================================================
     FOLDER EXPAND / COLLAPSE
     ========================================================= */

  toggleSubfolder(index: number): void {

    if (this.expandedFolderIndex === index) {

      this.expandedFolderIndex = null;

    }

    else {

      this.expandedFolderIndex = index;

    }

  }


  /* =========================================================
     CREATE MAIN FOLDER
     ========================================================= */

  /** v1.62.10 (item 168): "+ New folder" – the shared form instead of the old pop-up and alerts */
  async openPopus(): Promise<void> {
    if (await openZForm(folderForm())) { this.reloadFolders(); }
  }

  /** v1.62.10 (item 168): "+" on a folder – a subfolder in the shared form */
  async openSubFolderPopup(folderId: number, event: Event): Promise<void> {
    event.stopPropagation();
    const f = this.Documentfolders.find(x => x.id === folderId);
    if (await openZForm(folderForm({ id: folderId, name: f?.name || '' }))) { this.reloadFolders(); }
  }

  /** v1.62.10 (item 168): rename a folder or subfolder */
  async renameFolder(folder: any, event: Event): Promise<void> {
    event.stopPropagation(); event.preventDefault();
    if (await openZForm(FOLDER_EDIT_FORM, { id: folder.id, name: folder.name })) { this.reloadFolders(); }
  }


  /* =========================================================
     RELOAD FOLDERS
     ========================================================= */

  private reloadFolders(): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (!selectedSchema) {

      console.error(
        'No schema selected.'
      );

      return;

    }


    /*
     * Get current branch selection.
     *
     * selectedBranches$ is already available
     * from EmployeeService.
     */

    this.employeeService.selectedBranches$
      .subscribe({

        next: (branchIds) => {

          this.loadDocumentfolders(
            selectedSchema,
            branchIds || []
          );

        },

        error: (error) => {

          console.error(
            'Error getting branches:',
            error
          );

        }

      })
      .unsubscribe();

  }


  /* =========================================================
     CATEGORIES
     ========================================================= */

  fetchDesignations(
    selectedSchema: string
  ): void {

    this.CatogaryService
      .getcatogarys(selectedSchema)
      .subscribe({

        next: (data: any) => {

          this.Catogaries =
            Array.isArray(data)
              ? data
              : [];


          console.log(
            'Categories:',
            this.Catogaries
          );

        },


        error: (error: any) => {

          console.error(
            'Error fetching categories:',
            error
          );

        }

      });

  }

}