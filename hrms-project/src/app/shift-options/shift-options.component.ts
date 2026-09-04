import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-shift-options',
  templateUrl: './shift-options.component.html',
  styleUrl: './shift-options.component.css'
})
export class ShiftOptionsComponent {

  hasViewPermissionShifts: boolean = false;
  hasViewPermissionShiftPattern: boolean = false;
  hasViewPermissionEmployeeShift: boolean = false;
  hasViewPermissionShiftOverride: boolean = false;
  hasViewPermissionOvertimepolicy: boolean = false;
  hasViewPermissionEmpOvertime: boolean = false;

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
            this.hasViewPermissionShifts = true;
            this.hasViewPermissionShiftPattern = true;
            this.hasViewPermissionEmployeeShift = true;
            this.hasViewPermissionShiftOverride = true;
            this.hasViewPermissionOvertimepolicy = true;
            this.hasViewPermissionEmpOvertime = true;

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
                    this.hasViewPermissionShifts = true;
                    this.hasViewPermissionShiftPattern = true;
                    this.hasViewPermissionEmployeeShift = true;
                    this.hasViewPermissionShiftOverride = true;
                    this.hasViewPermissionOvertimepolicy = true;
                    this.hasViewPermissionEmpOvertime = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionShifts = this.checkGroupPermission('view_shift', groupPermissions);
                    this.hasViewPermissionShiftPattern = this.checkGroupPermission('view_shiftpattern', groupPermissions);
                    this.hasViewPermissionEmployeeShift = this.checkGroupPermission('view_employeeshiftschedule', groupPermissions);
                    this.hasViewPermissionShiftOverride = this.checkGroupPermission('view_shiftoverride', groupPermissions);
                    this.hasViewPermissionEmpOvertime = this.checkGroupPermission('view_employeeovertime', groupPermissions);
                    this.hasViewPermissionOvertimepolicy = this.checkGroupPermission('view_overtimepolicy', groupPermissions);
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

  showAdvanceSalary = false;
  toggleAdvanceSalary() {
    this.showAdvanceSalary = !this.showAdvanceSalary;
  }
}