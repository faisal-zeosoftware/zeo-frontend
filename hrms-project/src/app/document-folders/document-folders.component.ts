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

  iscreateLoanApp = false;
  iscreatesubfolder = false;


  /* =========================================================
     FORM
     ========================================================= */

  name: string = '';
  parent: number | null = null;


  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor(
    private employeeService: EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService
  ) {}


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

  openPopus(): void {

    this.name = '';

    this.iscreateLoanApp = true;

  }


  closeapplicationModal(): void {

    this.iscreateLoanApp = false;

    this.name = '';

  }


  CreateFolder(): void {

    if (!this.name?.trim()) {

      alert('Enter folder name.');

      return;

    }


    const formData = new FormData();

    formData.append(
      'name',
      this.name.trim()
    );


    this.employeeService
      .registerFolder(formData)
      .subscribe({

        next: (response) => {

          console.log(
            'Registration successful',
            response
          );


          alert('Folder has been added.');


          this.iscreateLoanApp = false;

          this.name = '';


          /*
           * Reload folder data without re-creating
           * the combineLatest subscription.
           */
          this.reloadFolders();

        },


        error: (error) => {

          console.error(
            'Add folder failed',
            error
          );

          alert(
            'Enter all fields correctly!'
          );

        }

      });

  }


  /* =========================================================
     CREATE SUBFOLDER
     ========================================================= */

  openSubFolderPopup(
    folderId: number,
    event: Event
  ): void {

    /*
     * Prevent folder expand/collapse.
     */
    event.stopPropagation();


    this.parent = folderId;

    this.name = '';

    this.iscreatesubfolder = true;


    console.log(
      'Open popup - Parent Folder ID:',
      this.parent
    );

  }


  closeSubfolderModal(): void {

    this.iscreatesubfolder = false;

    this.name = '';

    this.parent = null;

  }


  CreateFolderSubFolder(): void {

    if (
      !this.name?.trim() ||
      !this.parent
    ) {

      alert(
        'Enter subfolder name.'
      );

      return;

    }


    const formData = new FormData();


    formData.append(
      'name',
      this.name.trim()
    );


    formData.append(
      'parent',
      this.parent.toString()
    );


    this.employeeService
      .registerFolder(formData)
      .subscribe({

        next: (response) => {

          console.log(
            'Subfolder added:',
            response
          );


          alert(
            'Subfolder has been added.'
          );


          this.iscreatesubfolder = false;

          this.name = '';

          this.parent = null;


          /*
           * Reload only the data.
           * DO NOT create another combineLatest subscription.
           */
          this.reloadFolders();

        },


        error: (error) => {

          console.error(
            'Error adding subfolder:',
            error
          );


          alert(
            'Failed to create subfolder'
          );

        }

      });

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