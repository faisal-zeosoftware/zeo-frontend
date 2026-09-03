import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-general-sidebar',
  templateUrl: './general-sidebar.component.html',
  styleUrl: './general-sidebar.component.css'
})
export class GeneralSidebarComponent {

  // Document Permissions
  hasViewPermissionDocReqType: boolean = false;
  hasViewPermissionDocReqApr: boolean = false;
  hasViewPermissionDocAprlvl: boolean = false;
  hasViewPermissionDocReq: boolean = false;

  // General Permissions
  hasViewPermissionGenreq: boolean = false;
  hasViewPermissionReqType: boolean = false;
  hasViewPermissionAprv: boolean = false;
  hasViewPermissionAprvlvl: boolean = false;
  hasViewPermissionGenReqEsc: boolean = false;

  // Announcement permission
  hasViewAnnounceMaster: boolean = false;

  userId: number | null | undefined;
  userDetails: any;

  Catogaries: any[] = [];

  // ---- Mobile / responsive state ----
  isMobile: boolean = window.innerWidth <= 991.98;

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 991.98;

    if (wasMobile && !this.isMobile) {
      this.isMenuOpen = true;
    }
    if (!wasMobile && this.isMobile) {
      this.isMenuOpen = false;
    }
  }

  constructor(
    private EmployeeService: EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService
  ) {}

  // starts open on desktop, closed on mobile
  isMenuOpen: boolean = window.innerWidth > 991.98;

  toggleSidebarMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeOnMobile(): void {
    if (this.isMobile) {
      this.isMenuOpen = false;
    }
  }

  ngOnInit(): void {
    this.userId = this.sessionService.getUserId();

    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData;
          console.log('User ID:', this.userId);
          console.log('User Details:', this.userDetails);

          let isSuperuser = this.userDetails.is_superuser || false;
          const selectedSchema = this.authService.getSelectedSchema();
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }

          if (isSuperuser) {
            console.log('User is superuser or ESS user');
            this.hasViewPermissionDocReqType = true;
            this.hasViewPermissionDocReqApr = true;
            this.hasViewPermissionDocAprlvl = true;
            this.hasViewPermissionDocReq = true;

            this.hasViewPermissionGenreq = true;
            this.hasViewPermissionReqType = true;
            this.hasViewPermissionAprv = true;
            this.hasViewPermissionAprvlvl = true;
            this.hasViewPermissionGenReqEsc = true;

            this.hasViewAnnounceMaster = true;

            this.fetchDesignations(selectedSchema);
          } else {
            console.log('User is not superuser');

            const selectedSchema = this.authService.getSelectedSchema();
            if (selectedSchema) {
              try {
                const permissionsData: any = await this.DesignationService
                  .getDesignationsPermission(selectedSchema)
                  .toPromise();
                console.log('Permissions data:', permissionsData);

                if (Array.isArray(permissionsData) && permissionsData.length > 0) {
                  const firstItem = permissionsData[0];

                  if (firstItem.is_superuser) {
                    console.log('User is superuser according to permissions API');
                    this.hasViewPermissionDocReqType = true;
                    this.hasViewPermissionDocReqApr = true;
                    this.hasViewPermissionDocAprlvl = true;
                    this.hasViewPermissionDocReq = true;

                    this.hasViewPermissionGenreq = true;
                    this.hasViewPermissionReqType = true;
                    this.hasViewPermissionAprv = true;
                    this.hasViewPermissionAprvlvl = true;
                    this.hasViewPermissionGenReqEsc = true;

                    this.hasViewAnnounceMaster = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewAnnounceMaster = this.checkGroupPermission('view_announcement', groupPermissions);
                    this.hasViewPermissionDocReqType = this.checkGroupPermission('view_docrequesttype', groupPermissions);
                    this.hasViewPermissionDocReqApr = this.checkGroupPermission('view_documentapproval', groupPermissions);
                    this.hasViewPermissionDocAprlvl = this.checkGroupPermission('view_documentapprovallevel', groupPermissions);
                    this.hasViewPermissionDocReq = this.checkGroupPermission('view_documentrequest', groupPermissions);
                    this.hasViewPermissionGenreq = this.checkGroupPermission('view_generalrequest', groupPermissions);
                    this.hasViewPermissionReqType = this.checkGroupPermission('view_requesttype', groupPermissions);
                    this.hasViewPermissionAprv = this.checkGroupPermission('view_approval', groupPermissions);
                    this.hasViewPermissionAprvlvl = this.checkGroupPermission('view_approvallevel', groupPermissions);
                    this.hasViewPermissionGenReqEsc = this.checkGroupPermission('view_genrl_escalation', groupPermissions);
                  } else {
                    console.error('No groups found in data or groups array is empty.', firstItem);
                  }
                } else {
                  console.error('Permissions data is not an array or is empty.', permissionsData);
                }
              } catch (error) {
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

  showGeneralRequest = false;
  toggleGeneralRequest() {
    this.showGeneralRequest = !this.showGeneralRequest;
  }

  showDocumentRequest = false;
  toggleDocumentRequest() {
    this.showDocumentRequest = !this.showDocumentRequest;
  }
}