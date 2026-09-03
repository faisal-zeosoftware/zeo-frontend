import { Component, HostListener } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-salary-options',
  templateUrl: './salary-options.component.html',
  styleUrl: './salary-options.component.css'
})
export class SalaryOptionsComponent {

  hasViewPermissionSalary: boolean = false;
  hasViewPermissionEmployeeSalary: boolean = false;
  hasViewPermissionPayStructure: boolean = false;
  hasViewPermissionPayroll: boolean = false;
  hasViewPermissionPayslipApprovals: boolean = false;
  hasViewPermissionPayrollApprovalLevel: boolean = false;

  hasViewPermissionApprovalList: boolean = false;
  hasViewPermissionAdvanceSalaryRequest: boolean = false;
  hasViewPermissionAdvanceSalaryEscalation: boolean = false;
  hasViewPermissionAdvanceSalaryApprovalLevel: boolean = false;
  hasViewPermissionWPS: boolean = false;

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
            this.hasViewPermissionPayroll = true;
            this.hasViewPermissionSalary = true;
            this.hasViewPermissionEmployeeSalary = true;
            this.hasViewPermissionPayStructure = true;
            this.hasViewPermissionPayslipApprovals = true;
            this.hasViewPermissionPayrollApprovalLevel = true;

            this.hasViewPermissionApprovalList = true;
            this.hasViewPermissionAdvanceSalaryRequest = true;
            this.hasViewPermissionAdvanceSalaryEscalation = true;
            this.hasViewPermissionAdvanceSalaryApprovalLevel = true;
            this.hasViewPermissionWPS = true;

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
                    this.hasViewPermissionPayroll = true;
                    this.hasViewPermissionSalary = true;
                    this.hasViewPermissionEmployeeSalary = true;
                    this.hasViewPermissionPayStructure = true;
                    this.hasViewPermissionPayslipApprovals = true;
                    this.hasViewPermissionPayrollApprovalLevel = true;

                    this.hasViewPermissionApprovalList = true;
                    this.hasViewPermissionAdvanceSalaryRequest = true;
                    this.hasViewPermissionAdvanceSalaryEscalation = true;
                    this.hasViewPermissionAdvanceSalaryApprovalLevel = true;
                    this.hasViewPermissionWPS = true;
                  } else if (
                    firstItem.groups &&
                    Array.isArray(firstItem.groups) &&
                    firstItem.groups.length > 0
                  ) {
                    const groupPermissions = firstItem.groups.flatMap(
                      (group: any) => group.permissions
                    );
                    console.log('Group Permissions:', groupPermissions);

                    this.hasViewPermissionSalary = this.checkGroupPermission('view_salarycomponent', groupPermissions);
                    this.hasViewPermissionPayroll = this.checkGroupPermission('view_payrollrun', groupPermissions);
                    this.hasViewPermissionEmployeeSalary = this.checkGroupPermission('view_employeesalarystructure', groupPermissions);
                    this.hasViewPermissionPayStructure = this.checkGroupPermission('view_paystructure', groupPermissions);
                    this.hasViewPermissionPayslipApprovals = this.checkGroupPermission('view_payslipapproval', groupPermissions);
                    this.hasViewPermissionPayrollApprovalLevel = this.checkGroupPermission('view_payslipcommonworkflow', groupPermissions);
                    this.hasViewPermissionApprovalList = this.checkGroupPermission('view_advancesalaryapproval', groupPermissions);
                    this.hasViewPermissionAdvanceSalaryRequest = this.checkGroupPermission('view_advancesalaryrequest', groupPermissions);
                    this.hasViewPermissionAdvanceSalaryApprovalLevel = this.checkGroupPermission('view_advancecommonworkflow', groupPermissions);
                    this.hasViewPermissionAdvanceSalaryEscalation = this.checkGroupPermission('view_advsalary_escalation', groupPermissions);
                    this.hasViewPermissionWPS = this.checkGroupPermission('view_wps', groupPermissions);
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

  showAdvanceSalary = false;
  toggleAdvanceSalary() {
    this.showAdvanceSalary = !this.showAdvanceSalary;
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
}