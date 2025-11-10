import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
@Component({
  selector: 'app-end-of-service',
  templateUrl: './end-of-service.component.html',
  styleUrl: './end-of-service.component.css'
})
export class EndOfServiceComponent {


  
  allSelected=false;



 

  registerButtonClicked: boolean = false;




  EmployeeResignation: any[] = [];


  // selectedEmployeeId: number | null = null;

  Users: any[] = [];



  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private DesignationService: DesignationService,
    private employeeService: EmployeeService,

    ) {}

    ngOnInit(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

        this.LoadEmployeeResignationApproved(selectedSchema);


      
      }

      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property

// this.userDetails = this.created_by;
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
        this.hasViewPermission = true;
        this.hasAddPermission = true;
        this.hasDeletePermission = true;
        this.hasEditPermission = true;
    
        // Fetch designations without checking permissions
        // this.fetchDesignations(selectedSchema);
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
                this.hasViewPermission = true;
                this.hasAddPermission = true;
                this.hasDeletePermission = true;
                this.hasEditPermission = true;
              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

               
                this.hasAddPermission = this.checkGroupPermission('add_endofservice', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_endofservice', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_endofservice', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_endofservice', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);


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

    // this.fetchingApprovals();


    this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
            this.userDetailss = userData;
            this.schemas = userData.map((schema: any) => schema.schema_name);
            console.log('scehmas-de',userData)
        },
        (error) => {
            console.error('Failed to fetch user schemas:', error);
        }
    );
} else {
    console.error('User ID is null.');
}

      
   
    }


    

  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }





  

  
 
  

 
  
    LoadUsers(selectedSchema: string) {
      this.leaveService.getUsers(selectedSchema).subscribe(
        (data: any) => {
          this.Users = data;
        
          console.log('employee:', this.Users);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }

    
  
    LoadEmployeeResignationApproved(selectedSchema: string) {
      this.leaveService.getEmployeeEos(selectedSchema).subscribe(
        (data: any) => {
          this.EmployeeResignation = data;
        
          console.log('employee:', this.EmployeeResignation);
        },
        (error: any) => {
          console.error('Error fetching Employee:', error);
        }
      );
    }

 
  
    // GetEndOfService(): void {
    //   if (!this.selectedEmployeeId) {
    //     alert('Please select an employee.');
    //     return;
    //   }
    
    //   const selectedSchema = localStorage.getItem('selectedSchema');
    //   if (!selectedSchema) {
    //     alert('No schema selected.');
    //     return;
    //   }
    
    //   this.leaveService.createEndOfService(this.selectedEmployeeId, selectedSchema).subscribe(
    //     (response) => {
    //       console.log('End of service created:', response);
    //       alert('End of service record has been created.');
    //     },
    //     (error) => {
    //       console.error('Error creating end of service:', error);
    
    //       // ✅ Show backend error message if available
    //       if (error.error && error.error.detail) {
    //         alert(error.error.detail);
    //       } else {
    //         alert('Failed to create end of service.');
    //       }
    //     }
    //   );
    // }
    



    selectedEmployeeId: number | null = null;
endOfService: any = null;
  



GetEndOfService(): void {
  if (!this.selectedEmployeeId) {
    alert('Please select an employee.');
    return;
  }

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    alert('No schema selected.');
    return;
  }

  this.leaveService.getEmployeeEndOfService(this.selectedEmployeeId, selectedSchema).subscribe(
    (data) => {
      this.endOfService = data;
      console.log('EOS Data:', data);
    },
    (error) => {
      console.error('Error fetching EOS:', error);
      alert('Failed to fetch End of Service details.');
    }
  );
}








   
    iscreateLoanApp: boolean = false;




    openPopus():void{
      this.iscreateLoanApp = true;

    }
  
    closeapplicationModal():void{
      this.iscreateLoanApp = false;

    }


    isFinalSettlementModal: boolean = false;
finalSettlement: any = null;

getFinalSettlement(): void {
  if (!this.selectedEmployeeId) {
    alert('Please select an employee.');
    return;
  }

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    alert('No schema selected.');
    return;
  }

  this.leaveService.getFinalSettlementData(this.selectedEmployeeId, selectedSchema).subscribe(
    (data) => {
      this.finalSettlement = data;
      this.isFinalSettlementModal = true; // open modal
      console.log('Final Settlement:', data);
    },
    (error) => {
      console.error('Error fetching final settlement:', error);
      alert('Failed to fetch final settlement data.');
    }
  );
}

closeFinalSettlementModal(): void {
  this.isFinalSettlementModal = false;
  this.finalSettlement = null;
}








}
