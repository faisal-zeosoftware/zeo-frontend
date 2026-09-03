import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';


@Component({
  selector: 'app-sub-sidebar',
  templateUrl: './sub-sidebar.component.html',
  styleUrl: './sub-sidebar.component.css',
})
export class SubSidebarComponent {
  isMenuOpened: boolean = false;
  hideButton = false;

  userId: number | null | undefined;
  userDetails: any;

  Catogaries: any[] = [];
  selectedDepartment: any;

  catogary_title: string = '';
  ctgry_description: string = '';
  hasPermissioncom: boolean = false;

  isAuthenticated: boolean = false;
  showComponent: boolean = false;

  userPermissions: string[] = [];
  user_permissions: string[] = [];
  hasViewPermissionEmp: boolean = false;
  hasViewPermissiondesg: boolean = false;
  hasViewPermissionCat: boolean = false;
  hasViewPermissiondept: boolean = false;
  hasViewPermissionGenreq: boolean = false;
  hasViewPermissionReqType: boolean = false;
  hasViewPermissionAprv: boolean = false;
  hasViewPermissionAprvlvl: boolean = false;
  hasViewPermissionGenReqEsc: boolean = false;
  hasViewPermissionAttd: boolean = false;
  hasViewExpDocNotification: boolean = false;
  hasViewEmpOverTime: boolean = false;

  hasViewApprovalList: boolean = false;
  hasViewResignationApprovedList: boolean = false;
  hasViewEndOfService: boolean = false;
  hasViewResignationRequest: boolean = false;
  hasViewResignationApprovalLevel: boolean = false;
  hasViewGratuity: boolean = false;

  // ---- Mobile / responsive state ----
  isMobile: boolean = window.innerWidth <= 991.98;

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 991.98;

    // If we just crossed from mobile -> desktop, force the sidebar open
    // (desktop uses mode="side" and should always show, collapsed or not)
    if (wasMobile && !this.isMobile) {
      this.isMenuOpen = true;
    }
    // If we just crossed from desktop -> mobile, start closed
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

  // isMenuOpen now starts based on viewport: open on desktop, closed on mobile
  isMenuOpen: boolean = window.innerWidth > 991.98;

  toggleSidebarMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Call this from every nav link's (click) so tapping a link on mobile
  // closes the drawer instead of leaving the backdrop blocking taps
  closeOnMobile(): void {
    if (this.isMobile) {
      this.isMenuOpen = false;
    }
  }

  ngOnInit(): void {
    this.hideButton = this.EmployeeService.getHideButton();

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
            this.hasViewPermissionCat = true;
            this.hasViewPermissionEmp = true;
            this.hasViewPermissiondesg = true;
            this.hasViewPermissiondept = true;
            this.hasViewPermissionGenreq = true;
            this.hasViewPermissionReqType = true;
            this.hasViewPermissionAprv = true;
            this.hasViewPermissionAprvlvl = true;
            this.hasViewPermissionGenReqEsc = true;
            this.hasViewPermissionAttd = true;
            this.hasViewExpDocNotification = true;
            this.hasViewEmpOverTime = true;

            this.hasViewApprovalList = true;
            this.hasViewResignationApprovedList = true;
            this.hasViewEndOfService = true;
            this.hasViewResignationRequest = true;
            this.hasViewResignationApprovalLevel = true;
            this.hasViewGratuity = true;

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
                    this.hasViewPermissionCat = true;
                    this.hasViewPermissionEmp = true;
                    this.hasViewPermissiondesg = true;
                    this.hasViewPermissiondept = true;
                    this.hasViewPermissionGenreq = true;
                    this.hasViewPermissionReqType = true;
                    this.hasViewPermissionAprv = true;
                    this.hasViewPermissionAprvlvl = true;
                    this.hasViewPermissionGenReqEsc = true;
                    this.hasViewPermissionAttd = true;
                    this.hasViewExpDocNotification = true;
                    this.hasViewEmpOverTime = true;

                    this.hasViewApprovalList = true;
                    this.hasViewResignationApprovedList = true;
                    this.hasViewEndOfService = true;
                    this.hasViewResignationRequest = true;
                    this.hasViewResignationApprovalLevel = true;
                    this.hasViewGratuity = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionEmp = this.checkGroupPermission('view_emp_master', groupPermissions);
                    this.hasViewPermissiondept = this.checkGroupPermission('view_dept_master', groupPermissions);
                    this.hasViewPermissiondesg = this.checkGroupPermission('view_desgntn_master', groupPermissions);
                    this.hasViewPermissionCat = this.checkGroupPermission('view_ctgry_master', groupPermissions);
                    this.hasViewPermissionGenreq = this.checkGroupPermission('view_generalrequest', groupPermissions);
                    this.hasViewPermissionReqType = this.checkGroupPermission('view_requesttype', groupPermissions);
                    this.hasViewPermissionAprv = this.checkGroupPermission('view_approval', groupPermissions);
                    this.hasViewPermissionAprvlvl = this.checkGroupPermission('view_approvallevel', groupPermissions);
                    this.hasViewPermissionGenReqEsc = this.checkGroupPermission('view_genrl_escalation', groupPermissions);
                    this.hasViewPermissionAttd = this.checkGroupPermission('view_attendance', groupPermissions);
                    this.hasViewExpDocNotification = this.checkGroupPermission('view_notification', groupPermissions);
                    this.hasViewEmpOverTime = this.checkGroupPermission('view_employeeovertime', groupPermissions);

                    this.hasViewApprovalList = this.checkGroupPermission('view_resignationapproval', groupPermissions);
                    this.hasViewResignationApprovedList = this.checkGroupPermission('view_approved_resignations', groupPermissions);
                    this.hasViewEndOfService = this.checkGroupPermission('view_endofservice', groupPermissions);
                    this.hasViewResignationRequest = this.checkGroupPermission('view_employeeresignation', groupPermissions);
                    this.hasViewResignationApprovalLevel = this.checkGroupPermission('view_resignationapprovallevel', groupPermissions);
                    this.hasViewGratuity = this.checkGroupPermission('view_gratuitytable', groupPermissions);
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
    return groupPermissions.some((permission) => permission.codename === codeName);
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

  clickedOutside(): void {
    this.isMenuOpened = false;
  }

  showAdvanceSalary = false;
  toggleAdvanceSalary() {
    this.showAdvanceSalary = !this.showAdvanceSalary;
  }

  showGeneralRequest = false;
  toggleGeneralRequest() {
    this.showGeneralRequest = !this.showGeneralRequest;
  }
}