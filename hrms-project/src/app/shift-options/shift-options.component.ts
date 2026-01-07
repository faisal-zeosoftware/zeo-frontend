import { Component } from '@angular/core';
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
  hasViewPermissionOvertimepolicy:boolean = false;
  hasViewPermissionEmpOvertime:boolean = false;


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
          this.hasViewPermissionShifts = true;
          this.hasViewPermissionShiftPattern = true;
          this.hasViewPermissionEmployeeShift = true;
          this.hasViewPermissionShiftOverride = true;
          this.hasViewPermissionOvertimepolicy = true;
          this.hasViewPermissionEmpOvertime = true;
       
  
  
  
      
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
                   this.hasViewPermissionShifts = true;
                   this.hasViewPermissionShiftPattern = true;
                   this.hasViewPermissionEmployeeShift = true;
                   this.hasViewPermissionShiftOverride = true;
                   this.hasViewPermissionOvertimepolicy = true;
                   this.hasViewPermissionEmpOvertime = true;
                 
  
  
          
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
              
                       
                       this.hasViewPermissionShifts = this.checkGroupPermission('view_shift', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionShifts);
                      
                       this.hasViewPermissionShiftPattern = this.checkGroupPermission('view_shiftpattern', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionShiftPattern);

                       this.hasViewPermissionEmployeeShift = this.checkGroupPermission('view_employeeshiftschedule', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionEmployeeShift);
                      
                       this.hasViewPermissionShiftOverride = this.checkGroupPermission('view_shiftoverride', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionShiftOverride);

                       this.hasViewPermissionEmpOvertime = this.checkGroupPermission('view_employeeovertime', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionEmpOvertime);

                       this.hasViewPermissionOvertimepolicy = this.checkGroupPermission('view_overtimepolicy', groupPermissions);
                       console.log('Has view permission:', this.hasViewPermissionOvertimepolicy);
                       
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
    

       showAdvanceSalary = false;

    toggleAdvanceSalary() {
      this.showAdvanceSalary = !this.showAdvanceSalary;
    }


}
