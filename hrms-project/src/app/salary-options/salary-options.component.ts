import { Component } from '@angular/core';
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



  constructor(private EmployeeService:EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService



    
    ) {
     
    }


    
    isMenuOpen: boolean = true; 
    toggleSidebarMenu(): void
     { this.isMenuOpen = !this.isMenuOpen; }


    ngOnInit(): void {
  
      // Retrieve user ID
  this.userId = this.sessionService.getUserId();
  
  // Fetch user details using the obtained user ID
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
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
          this.hasViewPermissionPayroll = true;
          this.hasViewPermissionSalary = true;
          this.hasViewPermissionPayslipApprovals = true;
          this.hasViewPermissionPayrollApprovalLevel = true;

          this.hasViewPermissionApprovalList = true;
          this.hasViewPermissionAdvanceSalaryRequest = true;
          this.hasViewPermissionAdvanceSalaryEscalation = true;
          this.hasViewPermissionAdvanceSalaryApprovalLevel = true;
          this.hasViewPermissionWPS = true;
       
  
  
  
      
          // Fetch designations without checking permissions
          this.fetchDesignations(selectedSchema);
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
                  this.hasViewPermissionPayroll = true;
                   this.hasViewPermissionSalary = true;
                   this.hasViewPermissionPayslipApprovals = true;
                  this.hasViewPermissionPayrollApprovalLevel = true;

                   this.hasViewPermissionApprovalList = true;
                   this.hasViewPermissionAdvanceSalaryRequest = true;
                   this.hasViewPermissionAdvanceSalaryEscalation = true;
                   this.hasViewPermissionAdvanceSalaryApprovalLevel = true;
                   this.hasViewPermissionWPS = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionSalary = this.checkGroupPermission('view_salarycomponent', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionSalary);
                      
                       this.hasViewPermissionPayroll = this.checkGroupPermission('view_payrollrun', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionPayroll);

                        this.hasViewPermissionPayslipApprovals = this.checkGroupPermission('view_payslipapproval', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionPayslipApprovals);

                        this.hasViewPermissionPayrollApprovalLevel = this.checkGroupPermission('view_payslipcommonworkflow', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionPayrollApprovalLevel);

                        this.hasViewPermissionApprovalList = this.checkGroupPermission('view_advancesalaryapproval', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionApprovalList);

                        this.hasViewPermissionAdvanceSalaryRequest = this.checkGroupPermission('view_advancesalaryrequest', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAdvanceSalaryRequest);

                       this.hasViewPermissionAdvanceSalaryRequest = this.checkGroupPermission('view_advancesalaryrequest', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAdvanceSalaryRequest);

                        this.hasViewPermissionAdvanceSalaryEscalation = this.checkGroupPermission('view_advsalary_escalation', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAdvanceSalaryEscalation);

                        this.hasViewPermissionWPS = this.checkGroupPermission('view_wps', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionWPS);
                       
                } else {
                  console.error('No groups found in data or groups array is empty.', firstItem);
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
