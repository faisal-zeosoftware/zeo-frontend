
import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-report-options',
  templateUrl: './report-options.component.html',
  styleUrl: './report-options.component.css'
})
export class ReportOptionsComponent {

  hasViewPermissionEmployeeReports: boolean = false;
  hasViewPermissionDocumentReports: boolean = false;
  hasViewPermissionGeneralReport: boolean = false;
  hasViewPermissionDepartmentReport: boolean = false;
  hasViewPermissionDesignationReport: boolean = false;
  hasViewPermissionLeaveReport: boolean = false;
  hasViewPermissionLeaveApprovalReport: boolean = false;
  hasViewPermissionLeaveBalanceReport: boolean = false;
  hasViewPermissionEmployeeAttendance: boolean = false;
  hasViewPermissionAssetReport: boolean = false;
  hasViewPermissionAssetTransactionReport: boolean = false;



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
          this.hasViewPermissionEmployeeReports = true;
          this.hasViewPermissionDocumentReports = true;
          this.hasViewPermissionGeneralReport = true;
          this.hasViewPermissionDepartmentReport = true;
          this.hasViewPermissionDesignationReport = true;
          this.hasViewPermissionLeaveReport = true;
          this.hasViewPermissionLeaveApprovalReport = true;
          this.hasViewPermissionLeaveBalanceReport = true;
          this.hasViewPermissionEmployeeAttendance = true;
          this.hasViewPermissionAssetReport = true;
          this.hasViewPermissionAssetTransactionReport = true;





       
  
  
  
      
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
          this.hasViewPermissionEmployeeReports = true;
          this.hasViewPermissionDocumentReports = true;
          this.hasViewPermissionGeneralReport = true;
          this.hasViewPermissionDepartmentReport = true;
          this.hasViewPermissionDesignationReport = true;
          this.hasViewPermissionLeaveReport = true;
          this.hasViewPermissionLeaveApprovalReport = true;
          this.hasViewPermissionLeaveBalanceReport = true;
          this.hasViewPermissionEmployeeAttendance = true;
          this.hasViewPermissionAssetReport = true;
          this.hasViewPermissionAssetTransactionReport = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionEmployeeReports = this.checkGroupPermission('view_report', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionEmployeeReports);
                      
                       this.hasViewPermissionDocumentReports = this.checkGroupPermission('view_doc_report', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionDocumentReports);

                       this.hasViewPermissionGeneralReport = this.checkGroupPermission('view_generalrequestreport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionGeneralReport);
                      
                       this.hasViewPermissionDepartmentReport = this.checkGroupPermission('view_dept_report', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionDepartmentReport);

                       this.hasViewPermissionDesignationReport = this.checkGroupPermission('view_designtn_report', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionDesignationReport);
                      
                       this.hasViewPermissionLeaveReport = this.checkGroupPermission('view_leavereport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLeaveReport);

                       this.hasViewPermissionLeaveApprovalReport = this.checkGroupPermission('view_leaveapprovalreport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLeaveApprovalReport);
                      
                       this.hasViewPermissionLeaveBalanceReport = this.checkGroupPermission('view_lvbalancereport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLeaveBalanceReport);

                       this.hasViewPermissionEmployeeAttendance = this.checkGroupPermission('view_attendancereport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionEmployeeAttendance);

                       this.hasViewPermissionAssetReport = this.checkGroupPermission('view_assetreport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAssetReport);

                       this.hasViewPermissionAssetTransactionReport = this.checkGroupPermission('view_assettransactionreport', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAssetTransactionReport);
                       
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
