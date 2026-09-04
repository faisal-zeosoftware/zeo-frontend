import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {

  userId: number | null | undefined;
  userDetails: any;

  hasPermissioncom: boolean = false;

  isAuthenticated: boolean = false;
  showComponent: boolean = false;

  userPermissions: string[] = [];
  user_permissions: string[] = [];

  hasViewPermissionBranch: boolean = false;
  hasViewPermissionUsers: boolean = false;
  hasViewPermissionGroups: boolean = false;
  hasViewPermissionDocType: boolean = false;
  hasViewPermissionAssignPermission: boolean = false;
  hasViewStateMaster: boolean = false;
  hasViewCompanyMaster: boolean = false;
  hasViewDocNotifySettings: boolean = false;
  hasViewPermissionBranchPermission: boolean = false;

  hasViewNotification: boolean = false;
  hasViewDN: boolean = false;
  hasViewPermissionFormdes: boolean = false;

  hasViewPermissionCmpnyPol: boolean = false;

  hasViewPermissionConfig: boolean = false;

  hasViewPermissionEmtemp: boolean = false;
  hasViewPermissionLeaveEmtemp: boolean = false;
  hasViewPermissionDocExpEmtemp: boolean = false;
  hasViewPermissionDocReqEmtemp: boolean = false;
  hasViewPermissionAdvSalEmtemp: boolean = false;
  hasViewPermissionLoanReqEmtemp: boolean = false;
  hasViewPermissionAssetEmptemp: boolean = false;
  hasViewPermissionAirticketEmptemp: boolean = false;
  hasViewPermissionResignationEmptemp: boolean = false;
  hasViewPermissionLateInEarlyOutEmptemp: boolean = false;

  hasViewPermissionDocReqType: boolean = false;
  hasViewPermissionDocReqApr: boolean = false;
  hasViewPermissionDocAprlvl: boolean = false;
  hasViewPermissionDocReq: boolean = false;

  hasViewWeek: boolean = false;
  hasViewWeekAssgn: boolean = false;
  hasViewHoly: boolean = false;
  hasViewHolyAssgn: boolean = false;

  hasViewShift: boolean = false;

  hasViewPermissionempreport: boolean = false;
  hasViewPermissiondocreport: boolean = false;
  hasViewPermissiongenreport: boolean = false;
  hasViewPermissiondeptreport: boolean = false;
  hasViewPermissiondesreport: boolean = false;
  hasViewPermissionLeavereport: boolean = false;
  hasViewPermissionLeaveAprreport: boolean = false;
  hasViewPermissionLeaveBalancereport: boolean = false;
  hasViewPermissionEmpAttendancereport: boolean = false;
  hasViewPermissionAssetreport: boolean = false;
  hasViewPermissionAssettransreport: boolean = false;

  hasViewPermissionEmpForm: boolean = false;
  hasviewPermissionAssetForm: boolean = false;

  stateLabel: string = '';

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
          console.log('schemaname', selectedSchema);

          const selectedStateLabel = localStorage.getItem('selectedSchemaStateLabel');
          console.log("Retrieved state label:", selectedStateLabel);

          this.stateLabel = selectedStateLabel ? selectedStateLabel : '';

          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }

          if (isSuperuser) {
            console.log('User is superuser or ESS user');
            this.hasViewPermissionBranch = true;
            this.hasViewPermissionUsers = true;
            this.hasViewPermissionGroups = true;
            this.hasViewPermissionDocType = true;
            this.hasViewPermissionAssignPermission = true;
            this.hasViewStateMaster = true;
            this.hasViewCompanyMaster = true;
            this.hasViewNotification = true;
            this.hasViewDN = true;
            this.hasViewDocNotifySettings = true;
            this.hasViewPermissionFormdes = true;

            this.hasViewPermissionBranchPermission = true;

            this.hasViewPermissionCmpnyPol = true;

            this.hasViewPermissionEmtemp = true;
            this.hasViewPermissionLeaveEmtemp = true;
            this.hasViewPermissionDocExpEmtemp = true;
            this.hasViewPermissionDocReqEmtemp = true;
            this.hasViewPermissionAdvSalEmtemp = true;
            this.hasViewPermissionLoanReqEmtemp = true;
            this.hasViewPermissionAssetEmptemp = true;
            this.hasViewPermissionAirticketEmptemp = true;
            this.hasViewPermissionResignationEmptemp = true;
            this.hasViewPermissionLateInEarlyOutEmptemp = true;

            this.hasViewWeek = true;
            this.hasViewWeekAssgn = true;
            this.hasViewHoly = true;
            this.hasViewHolyAssgn = true;
            this.hasViewShift = true;

            this.hasViewPermissionempreport = true;
            this.hasViewPermissiondocreport = true;
            this.hasViewPermissiongenreport = true;
            this.hasViewPermissiondeptreport = true;
            this.hasViewPermissiondesreport = true;
            this.hasViewPermissionLeavereport = true;
            this.hasViewPermissionLeaveAprreport = true;
            this.hasViewPermissionLeaveBalancereport = true;
            this.hasViewPermissionEmpAttendancereport = true;
            this.hasViewPermissionAssetreport = true;
            this.hasViewPermissionAssettransreport = true;

            this.hasViewPermissionEmpForm = true;
            this.hasviewPermissionAssetForm = true;

            this.hasViewPermissionConfig = true;

            this.hasViewPermissionDocReqType = true;
            this.hasViewPermissionDocReqApr = true;
            this.hasViewPermissionDocAprlvl = true;
            this.hasViewPermissionDocReq = true;
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
                    this.hasViewPermissionBranch = true;
                    this.hasViewPermissionUsers = true;
                    this.hasViewPermissionGroups = true;
                    this.hasViewPermissionDocType = true;
                    this.hasViewPermissionAssignPermission = true;
                    this.hasViewStateMaster = true;
                    this.hasViewCompanyMaster = true;
                    this.hasViewNotification = true;
                    this.hasViewDN = true;
                    this.hasViewDocNotifySettings = true;
                    this.hasViewPermissionFormdes = true;

                    this.hasViewPermissionBranchPermission = true;

                    this.hasViewPermissionCmpnyPol = true;

                    this.hasViewPermissionEmtemp = true;
                    this.hasViewPermissionLeaveEmtemp = true;
                    this.hasViewPermissionDocExpEmtemp = true;
                    this.hasViewPermissionDocReqEmtemp = true;
                    this.hasViewPermissionAdvSalEmtemp = true;
                    this.hasViewPermissionLoanReqEmtemp = true;
                    this.hasViewPermissionAssetEmptemp = true;
                    this.hasViewPermissionAirticketEmptemp = true;
                    this.hasViewPermissionResignationEmptemp = true;
                    this.hasViewPermissionLateInEarlyOutEmptemp = true;

                    this.hasViewWeek = true;
                    this.hasViewWeekAssgn = true;
                    this.hasViewHoly = true;
                    this.hasViewHolyAssgn = true;
                    this.hasViewShift = true;

                    this.hasViewPermissionempreport = true;
                    this.hasViewPermissiondocreport = true;
                    this.hasViewPermissiongenreport = true;
                    this.hasViewPermissiondeptreport = true;
                    this.hasViewPermissiondesreport = true;
                    this.hasViewPermissionLeavereport = true;
                    this.hasViewPermissionLeaveAprreport = true;
                    this.hasViewPermissionLeaveBalancereport = true;
                    this.hasViewPermissionEmpAttendancereport = true;
                    this.hasViewPermissionAssetreport = true;
                    this.hasViewPermissionAssettransreport = true;

                    this.hasViewPermissionEmpForm = true;
                    this.hasviewPermissionAssetForm = true;

                    this.hasViewPermissionConfig = true;

                    this.hasViewPermissionDocReqType = true;
                    this.hasViewPermissionDocReqApr = true;
                    this.hasViewPermissionDocAprlvl = true;
                    this.hasViewPermissionDocReq = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionBranch = this.checkGroupPermission('view_brnch_mstr', groupPermissions);
                    this.hasViewPermissionUsers = this.checkGroupPermission('view_customuser', groupPermissions);
                    this.hasViewPermissionGroups = this.checkGroupPermission('view_group', groupPermissions);
                    this.hasViewPermissionDocType = this.checkGroupPermission('view_document_type', groupPermissions);
                    this.hasViewPermissionAssignPermission = this.checkGroupPermission('view_permission', groupPermissions);
                    this.hasViewStateMaster = this.checkGroupPermission('view_state_mstr', groupPermissions);
                    this.hasViewCompanyMaster = this.checkGroupPermission('view_company', groupPermissions);
                    this.hasViewNotification = this.checkGroupPermission('view_notification', groupPermissions);
                    this.hasViewDN = this.checkGroupPermission('view_documentnumbering', groupPermissions);
                    this.hasViewDocNotifySettings = this.checkGroupPermission('view_notificationsettings', groupPermissions);
                    this.hasViewPermissionBranchPermission = this.checkGroupPermission('view_userbranchaccess', groupPermissions);

                    this.hasViewPermissionEmtemp = this.checkGroupPermission('view_emailtemplate', groupPermissions);
                    this.hasViewPermissionLeaveEmtemp = this.checkGroupPermission('view_lvemailtemplate', groupPermissions);
                    this.hasViewPermissionDocExpEmtemp = this.checkGroupPermission('view_docexpemailtemplate', groupPermissions);
                    this.hasViewPermissionDocReqEmtemp = this.checkGroupPermission('view_docrequestemailtemplate', groupPermissions);
                    this.hasViewPermissionAdvSalEmtemp = this.checkGroupPermission('view_advancesalaryemailtemplate', groupPermissions);
                    this.hasViewPermissionLoanReqEmtemp = this.checkGroupPermission('view_loanemailtemplate', groupPermissions);
                    this.hasViewPermissionAssetEmptemp = this.checkGroupPermission('view_assetemailtemplate', groupPermissions);
                    this.hasViewPermissionAirticketEmptemp = this.checkGroupPermission('view_airticketemailtemplate', groupPermissions);
                    this.hasViewPermissionResignationEmptemp = this.checkGroupPermission('view_resignationemailtemplate', groupPermissions);
                    this.hasViewPermissionLateInEarlyOutEmptemp = this.checkGroupPermission('view_latinearlyoutemailtemplate', groupPermissions);

                    this.hasViewPermissionCmpnyPol = this.checkGroupPermission('view_companypolicy', groupPermissions);

                    this.hasViewWeek = this.checkGroupPermission('view_weekend_calendar', groupPermissions);
                    this.hasViewWeekAssgn = this.checkGroupPermission('view_assign_weekend', groupPermissions);
                    this.hasViewHoly = this.checkGroupPermission('view_holiday_calendar', groupPermissions);
                    this.hasViewHolyAssgn = this.checkGroupPermission('view_assign_holiday', groupPermissions);
                    this.hasViewShift = this.checkGroupPermission('view_shift', groupPermissions);

                    this.hasViewPermissionempreport = this.checkGroupPermission('view_report', groupPermissions);
                    this.hasViewPermissiondocreport = this.checkGroupPermission('view_doc_report', groupPermissions);
                    this.hasViewPermissiongenreport = this.checkGroupPermission('view_generalrequestreport', groupPermissions);
                    this.hasViewPermissiondeptreport = this.checkGroupPermission('view_dept_report', groupPermissions);
                    this.hasViewPermissiondesreport = this.checkGroupPermission('view_designtn_report', groupPermissions);
                    this.hasViewPermissionLeavereport = this.checkGroupPermission('view_leavereport', groupPermissions);
                    this.hasViewPermissionLeaveAprreport = this.checkGroupPermission('view_leaveapprovalreport', groupPermissions);
                    this.hasViewPermissionLeaveBalancereport = this.checkGroupPermission('view_lvbalancereport', groupPermissions);
                    this.hasViewPermissionEmpAttendancereport = this.checkGroupPermission('view_attendancereport', groupPermissions);
                    this.hasViewPermissionAssetreport = this.checkGroupPermission('view_assetreport', groupPermissions);
                    this.hasViewPermissionAssettransreport = this.checkGroupPermission('view_assettransactionreport', groupPermissions);

                    this.hasViewPermissionEmpForm = this.checkGroupPermission('view_emp_customfield', groupPermissions);
                    this.hasviewPermissionAssetForm = this.checkGroupPermission('view_assetcustomfield', groupPermissions);

                    this.hasViewPermissionConfig = this.checkGroupPermission('view_emailconfiguration', groupPermissions);

                    this.hasViewPermissionDocReqType = this.checkGroupPermission('view_docrequesttype', groupPermissions);
                    this.hasViewPermissionDocReqApr = this.checkGroupPermission('view_documentapproval', groupPermissions);
                    this.hasViewPermissionDocAprlvl = this.checkGroupPermission('view_documentapprovallevel', groupPermissions);
                    this.hasViewPermissionDocReq = this.checkGroupPermission('view_documentrequest', groupPermissions);
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
}