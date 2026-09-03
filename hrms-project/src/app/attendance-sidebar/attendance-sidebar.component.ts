import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-attendance-sidebar',
  templateUrl: './attendance-sidebar.component.html',
  styleUrl: './attendance-sidebar.component.css'
})
export class AttendanceSidebarComponent {

  hasViewPermissionAttendanceMarking: boolean = false;
  hasViewPermissionmanualentry: boolean = false;
  hasViewPermissionEmpEarlygoing: boolean = false;
  hasViewPermissionEmpRecheck: boolean = false;
  hasViewPermissionPunchingList: boolean = false;
  hasViewPermissionGeoFence: boolean = false;

  hasViewPermissionAttendancepolicy: boolean = false;
  hasViewPermissionAttendancevalidationpolicy: boolean = false;
  hasViewPermissionLateComingPolicy: boolean = false;
  hasViewPermissionEarlyExitPolicy: boolean = false;

  hasViewPermissionFaceRegister: boolean = false;
  hasViewPermissionAttendanceReq: boolean = false;
  hasViewPermissionLateinEarlyOutApprovallevel: boolean = false;
  hasViewPermissionLateinEarlyOutApprovals: boolean = false;

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
            this.hasViewPermissionAttendanceMarking = true;
            this.hasViewPermissionmanualentry = true;
            this.hasViewPermissionEmpEarlygoing = true;
            this.hasViewPermissionEmpRecheck = true;
            this.hasViewPermissionPunchingList = true;
            this.hasViewPermissionGeoFence = true;
            this.hasViewPermissionAttendancepolicy = true;
            this.hasViewPermissionAttendancevalidationpolicy = true;
            this.hasViewPermissionLateComingPolicy = true;
            this.hasViewPermissionEarlyExitPolicy = true;
            this.hasViewPermissionFaceRegister = true;
            this.hasViewPermissionAttendanceReq = true;
            this.hasViewPermissionLateinEarlyOutApprovallevel = true;
            this.hasViewPermissionLateinEarlyOutApprovals = true;

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
                    this.hasViewPermissionAttendanceMarking = true;
                    this.hasViewPermissionmanualentry = true;
                    this.hasViewPermissionEmpEarlygoing = true;
                    this.hasViewPermissionEmpRecheck = true;
                    this.hasViewPermissionPunchingList = true;
                    this.hasViewPermissionGeoFence = true;
                    this.hasViewPermissionAttendancepolicy = true;
                    this.hasViewPermissionAttendancevalidationpolicy = true;
                    this.hasViewPermissionLateComingPolicy = true;
                    this.hasViewPermissionEarlyExitPolicy = true;
                    this.hasViewPermissionFaceRegister = true;
                    this.hasViewPermissionAttendanceReq = true;
                    this.hasViewPermissionLateinEarlyOutApprovallevel = true;
                    this.hasViewPermissionLateinEarlyOutApprovals = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionAttendanceMarking = this.checkGroupPermission('view_attendance', groupPermissions);
                    this.hasViewPermissionEmpEarlygoing = this.checkGroupPermission('view_early_going', groupPermissions);
                    this.hasViewPermissionEmpRecheck = this.checkGroupPermission('view_attendancerecheck', groupPermissions);
                    this.hasViewPermissionPunchingList = this.checkGroupPermission('view_attendance_list', groupPermissions);
                    this.hasViewPermissionGeoFence = this.checkGroupPermission('view_branchgeofence', groupPermissions);
                    this.hasViewPermissionmanualentry = this.checkGroupPermission('view_attendance_manual', groupPermissions);
                    this.hasViewPermissionAttendancepolicy = this.checkGroupPermission('view_attendancepolicy', groupPermissions);
                    this.hasViewPermissionAttendancevalidationpolicy = this.checkGroupPermission('view_attendancevalidationpolicy', groupPermissions);
                    this.hasViewPermissionLateComingPolicy = this.checkGroupPermission('view_latecomingpolicy', groupPermissions);
                    this.hasViewPermissionEarlyExitPolicy = this.checkGroupPermission('view_earlyexitpolicy', groupPermissions);
                    this.hasViewPermissionFaceRegister = this.checkGroupPermission('view_attendance_faceregister', groupPermissions);
                    this.hasViewPermissionLateinEarlyOutApprovallevel = this.checkGroupPermission('view_lateinearlyoutapprovallevel', groupPermissions);
                    this.hasViewPermissionLateinEarlyOutApprovals = this.checkGroupPermission('view_lateinearlyoutapproval', groupPermissions);
                    this.hasViewPermissionAttendanceReq = this.checkGroupPermission('view_lateinearlyoutrequest', groupPermissions);
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
  showpolicyRequest = false;

  toggleGeneralRequest() {
    this.showGeneralRequest = !this.showGeneralRequest;
    this.showpolicyRequest = !this.showpolicyRequest; // kept as in original — note below
  }

  togglePolicyRequest() {
    this.showpolicyRequest = !this.showpolicyRequest;
  }
}