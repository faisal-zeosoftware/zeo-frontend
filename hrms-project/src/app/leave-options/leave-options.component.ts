import { Component } from '@angular/core';
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
  ctgry_description:string = '';
  hasPermissioncom: boolean = false;

  isAuthenticated: boolean = false;
  showComponent: boolean = false;
  
  userPermissions: string[] = [];
  user_permissions: string[] = [];

  
  hasViewPermissionEmpLeaveReq: boolean = false;
  hasViewPermissiondesg: boolean = false;
  hasViewPermissionLeaveApr: boolean =false;
  hasViewPermissionLeaveMas: boolean = false;
  hasViewPermissioncmpL: boolean = false;
  hasViewPermissionLeaveAprvlvl: boolean = false;
  hasViewPermissionLeavetemp: boolean = false;

  hasViewPermissionLeaveBalance: boolean = false;
  hasViewPermissionLeaveCancel: boolean = false;
  hasViewPermissionLeaveAccrual: boolean = false;
  hasViewPermissionLeaveRejoin: boolean = false;
  hasViewPermissionLvEsc:boolean = false;




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
    this.hideButton = this.EmployeeService.getHideButton();

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
        this.hasViewPermissionLeaveApr = true;
        this.hasViewPermissionEmpLeaveReq = true;
        this.hasViewPermissiondesg = true;
        this.hasViewPermissionLeaveMas = true;
        this.hasViewPermissioncmpL = true;
        this.hasViewPermissionLeaveAprvlvl = true;
        this.hasViewPermissionLeavetemp = true;
 
        this.hasViewPermissionLeaveBalance = true;
        this.hasViewPermissionLeaveCancel = true;
        this.hasViewPermissionLeaveAccrual = true;
        this.hasViewPermissionLeaveRejoin = true;
        this.hasViewPermissionLvEsc = true;



    
        // Fetch designations without checking permissions
        this.fetchDesignations(selectedSchema);
      } else {
        console.log('User is not superuser');

        const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
          // try {
          //   const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
          //   console.log('permissions:', permissionsData);
        
          //   if (permissionsData && permissionsData.length > 0 && permissionsData[0].groups) {

          //     isSuperuser = permissionsData[0].is_superuser || false;
              
          //     if (isSuperuser) {
          //       console.log('User is superuser according to permissions API');
          //       // Grant all permissions
          //       this.hasViewPermission = true;
          //       this.hasViewPermissionEmp = true;
          //       this.hasViewPermissiondesg = true;
          //       this.hasViewPermissiondept = true;
          //     }
          //     const groupPermissions = userData[0].groups.flatMap((group: any) => group.permissions);
          //     console.log('Group Permissions:', groupPermissions);
        
          //     this.hasViewPermission = this.checkGroupPermission('view_ctgry_master', groupPermissions);
          //     console.log('Has view permission:', this.hasViewPermission);

          //     this.hasViewPermissiondesg = this.checkGroupPermission('view_desgntn_master', groupPermissions);
          //     console.log('Has view permission:', this.hasViewPermissiondesg);
                  
          //     this.hasViewPermissiondept = this.checkGroupPermission('view_dept_master', groupPermissions);
          //     console.log('Has view permission:', this.hasViewPermissiondept);

          //     this.hasViewPermissionEmp = this.checkGroupPermission('view_emp_master', groupPermissions);
          //     console.log('Has view permission:', this.hasViewPermissionEmp);
        
          
          //   } else {
          //     console.error('No groups found in data or data format is incorrect.', userData);
          //   }
        
          //   // Fetching designations after checking permissions
          //   // this.fetchDesignations(selectedSchema);
          // } 

          try {
            const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
            console.log('Permissions data:', permissionsData);

            if (Array.isArray(permissionsData) && permissionsData.length > 0) {
              const firstItem = permissionsData[0];

              if (firstItem.is_superuser) {
                console.log('User is superuser according to permissions API');
                // Grant all permissions
                this.hasViewPermissionLeaveApr = true;
                this.hasViewPermissionEmpLeaveReq = true;
                this.hasViewPermissiondesg = true;
                this.hasViewPermissionLeaveMas = true;
                this.hasViewPermissioncmpL = true;
                this.hasViewPermissionLeaveAprvlvl = true;
                this.hasViewPermissionLeavetemp = true;

                 
               this.hasViewPermissionLeaveBalance = true;
               this.hasViewPermissionLeaveCancel = true;
               this.hasViewPermissionLeaveAccrual = true;
               this.hasViewPermissionLeaveRejoin = true;
               this.hasViewPermissionLvEsc = true;


        
              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

                this.hasViewPermissionLeaveApr = this.checkGroupPermission('view_leaveapproval', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveApr);
    
                     this.hasViewPermissionLeaveMas = this.checkGroupPermission('view_leave_type', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveMas);
                        
                    //  this.hasViewPermissiondesg = this.checkGroupPermission('view_leave_entitlement', groupPermissions);
                    //  console.log('Has view permission:', this.hasViewPermissiondesg);
      
                     this.hasViewPermissionEmpLeaveReq = this.checkGroupPermission('view_employee_leave_request', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionEmpLeaveReq);
                    
                     this.hasViewPermissioncmpL = this.checkGroupPermission('view_compensatoryleavetransaction', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissioncmpL);
                     
                     this.hasViewPermissionLeaveAprvlvl = this.checkGroupPermission('view_leaveapprovallevels', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveAprvlvl);
                    
                    //  this.hasViewPermissionLeavetemp = this.checkGroupPermission('view_lvemailtemplate', groupPermissions);
                    //  console.log('Has view permission:', this.hasViewPermissionLeavetemp);


                     this.hasViewPermissionLeaveBalance = this.checkGroupPermission('view_emp_leave_balance', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveBalance);
                    
                     this.hasViewPermissionLeaveCancel = this.checkGroupPermission('view_lv_cancellation', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveCancel);
                     
                     this.hasViewPermissionLeaveAccrual = this.checkGroupPermission('view_leave_accrual_transaction', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveAccrual);
                    
                     this.hasViewPermissionLeaveRejoin = this.checkGroupPermission('view_employeerejoining', groupPermissions);
                     console.log('Has view permission:', this.hasViewPermissionLeaveRejoin);
                     
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


  // checkViewPermission(permissions: any[]): boolean {
  //   const requiredPermission = 'view_ctgry_master' ||'add_ctgry_master' ||'delete_ctgry_master' ||'change_ctgry_master';
    
  
  //   // Check user permissions
  //   if (permissions.some(permission => permission.codename === requiredPermission)) {
  //     return true;
  //   }
  
  //   // Check group permissions (if applicable)
  //   // Replace `// TODO: Implement group permission check`
  //   // with your logic to retrieve and check group permissions
  //   // (consider using a separate service or approach)
  //   return false; // Replace with actual group permission check
  // }

  

  
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
  

}
