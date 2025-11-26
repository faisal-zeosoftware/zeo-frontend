import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-loan-sidebar',
  templateUrl: './loan-sidebar.component.html',
  styleUrl: './loan-sidebar.component.css'
})
export class LoanSidebarComponent {

  
  hasViewPermissionLoanType: boolean = false;
  hasViewPermissionLoanRepayment: boolean = false; 
  hasViewPermissionLoanApprovals: boolean = false;
  hasViewPermissionLoanApprovalLevel: boolean = false;
  hasViewPermissionLoanApplication: boolean = false;



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
     
          this.hasViewPermissionLoanType = true;
          this.hasViewPermissionLoanRepayment = true;
          this.hasViewPermissionLoanApprovals = true;
          this.hasViewPermissionLoanApplication = true;
          this.hasViewPermissionLoanApprovalLevel = true;
       
  
  
  
      
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
              
                  this.hasViewPermissionLoanType = true;
                  this.hasViewPermissionLoanRepayment = true;
                  this.hasViewPermissionLoanApprovals = true;
                  this.hasViewPermissionLoanApplication = true;
                  this.hasViewPermissionLoanApprovalLevel = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionLoanType = this.checkGroupPermission('view_loantype', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLoanType);

                       this.hasViewPermissionLoanApprovals = this.checkGroupPermission('view_loanapproval', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLoanApprovals);
                       
                       this.hasViewPermissionLoanRepayment = this.checkGroupPermission('view_loanrepayment', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLoanRepayment);

                       this.hasViewPermissionLoanApprovalLevel = this.checkGroupPermission('view_loancommonworkflow', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLoanApprovalLevel);

                       this.hasViewPermissionLoanApplication = this.checkGroupPermission('view_loanapplication', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionLoanApplication);

                      
                      

                       
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
