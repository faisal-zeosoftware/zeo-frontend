import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';


@Component({
  selector: 'app-leave-options',
  templateUrl: './leave-options.component.html',
  styleUrl: './leave-options.component.css'
})
export class LeaveOptionsComponent {

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

  hasViewPermissionEmpLeaveReq: boolean = false;
  hasViewPermissiondesg: boolean = false;
  hasViewPermissionLeaveApr: boolean = false;
  hasViewPermissionLeaveMas: boolean = false;
  hasViewPermissioncmpL: boolean = false;
  hasViewPermissioncmpTrans: boolean = false;
  hasViewPermissionLeaveAprvlvl: boolean = false;
  hasViewPermissionLeavetemp: boolean = false;

  hasViewPermissionLeaveBalance: boolean = false;
  hasViewPermissionLeaveCancel: boolean = false;
  hasViewPermissionLeaveAccrual: boolean = false;
  hasViewPermissionLeaveRejoin: boolean = false;
  hasViewPermissionLvEsc: boolean = false;

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
            this.hasViewPermissionLeaveApr = true;
            this.hasViewPermissionEmpLeaveReq = true;
            this.hasViewPermissiondesg = true;
            this.hasViewPermissionLeaveMas = true;
            this.hasViewPermissioncmpL = true;
            this.hasViewPermissioncmpTrans = true;
            this.hasViewPermissionLeaveAprvlvl = true;
            this.hasViewPermissionLeavetemp = true;

            this.hasViewPermissionLeaveBalance = true;
            this.hasViewPermissionLeaveCancel = true;
            this.hasViewPermissionLeaveAccrual = true;
            this.hasViewPermissionLeaveRejoin = true;
            this.hasViewPermissionLvEsc = true;

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
                    this.hasViewPermissionLeaveApr = true;
                    this.hasViewPermissionEmpLeaveReq = true;
                    this.hasViewPermissiondesg = true;
                    this.hasViewPermissionLeaveMas = true;
                    this.hasViewPermissioncmpL = true;
                    this.hasViewPermissioncmpTrans = true;
                    this.hasViewPermissionLeaveAprvlvl = true;
                    this.hasViewPermissionLeavetemp = true;

                    this.hasViewPermissionLeaveBalance = true;
                    this.hasViewPermissionLeaveCancel = true;
                    this.hasViewPermissionLeaveAccrual = true;
                    this.hasViewPermissionLeaveRejoin = true;
                    this.hasViewPermissionLvEsc = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionLeaveApr = this.checkGroupPermission('view_leaveapproval', groupPermissions);
                    this.hasViewPermissionLeaveMas = this.checkGroupPermission('view_leave_type', groupPermissions);
                    this.hasViewPermissionEmpLeaveReq = this.checkGroupPermission('view_employee_leave_request', groupPermissions);
                    this.hasViewPermissioncmpL = this.checkGroupPermission('view_compensatoryleaverequest', groupPermissions);
                    this.hasViewPermissioncmpTrans = this.checkGroupPermission('view_compensatoryleavetransaction', groupPermissions);
                    this.hasViewPermissionLeaveAprvlvl = this.checkGroupPermission('view_leaveapprovallevels', groupPermissions);
                    this.hasViewPermissionLvEsc = this.checkGroupPermission('view_leave_escalation', groupPermissions);
                    this.hasViewPermissionLeaveBalance = this.checkGroupPermission('view_emp_leave_balance', groupPermissions);
                    this.hasViewPermissionLeaveCancel = this.checkGroupPermission('view_lv_cancellation', groupPermissions);
                    this.hasViewPermissionLeaveAccrual = this.checkGroupPermission('view_leave_accrual_transaction', groupPermissions);
                    this.hasViewPermissionLeaveRejoin = this.checkGroupPermission('view_employeerejoining', groupPermissions);
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

  clickedOutside(): void {
    this.isMenuOpened = false;
  }

  showAdvanceSalary = false;
  toggleAdvanceSalary() {
    this.showAdvanceSalary = !this.showAdvanceSalary;
  }
}