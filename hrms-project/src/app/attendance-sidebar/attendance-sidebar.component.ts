import { Component } from '@angular/core';
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


   


  hasViewPermissionAirticketPolicy:boolean = false;
  hasViewPermissionAirticketAllocation:boolean = false;
  hasViewPermissionAirticketRequest:boolean = false;
  hasViewPermissionAirticketRule:boolean = false;
  hasViewPermissionAirticketAprlvl:boolean = false;
  hasViewPermissionAirticketApprovals:boolean = false;
  hasViewPermissionAirticketEsc:boolean = false;


  


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


          this.hasViewPermissionAirticketPolicy = true;
          this.hasViewPermissionAirticketAllocation = true;
          this.hasViewPermissionAirticketRequest = true;
          this.hasViewPermissionAirticketRule = true;
          this.hasViewPermissionAirticketAprlvl = true;
          this.hasViewPermissionAirticketApprovals = true;
          this.hasViewPermissionAirticketEsc = true;
       
  
  
  
      
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

          this.hasViewPermissionAirticketPolicy = true;
          this.hasViewPermissionAirticketAllocation = true;
          this.hasViewPermissionAirticketRequest = true;
          this.hasViewPermissionAirticketRule = true;
          this.hasViewPermissionAirticketAprlvl = true;
          this.hasViewPermissionAirticketApprovals = true;
          this.hasViewPermissionAirticketEsc = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionAirticketPolicy = this.checkGroupPermission('view_airticketpolicy', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketPolicy);
                      
                       this.hasViewPermissionAirticketAllocation = this.checkGroupPermission('view_airticketallocation', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketAllocation);

                       this.hasViewPermissionAirticketApprovals = this.checkGroupPermission('view_airticketapproval', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketApprovals);

                       this.hasViewPermissionAirticketAprlvl = this.checkGroupPermission('view_airticketworkflow', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketAprlvl);

                      this.hasViewPermissionAirticketEsc = this.checkGroupPermission('view_airticket_escalation', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketEsc);

                        this.hasViewPermissionAirticketRequest = this.checkGroupPermission('view_airticketrequest', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketRequest);
                      
                       this.hasViewPermissionAirticketRule = this.checkGroupPermission('view_airticketrule', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionAirticketRule);
                       
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
