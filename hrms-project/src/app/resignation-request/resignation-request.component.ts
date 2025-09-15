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
  selector: 'app-resignation-request',
  templateUrl: './resignation-request.component.html',
  styleUrl: './resignation-request.component.css'
})
export class ResignationRequestComponent {


  
      

  allSelected=false;



  document_date:any='';
  resigned_on:any='' ;
  notice_period:any='' ;

  last_working_date:any='' ;
  location: any = '';
  termination_type: any = '';
  reason_for_leaving: any = '';

  employee:any='';

  
  created_by:any='';

  registerButtonClicked: boolean = false;



  LeaveapprovalLevels: any[] = [];

  Employee: any[] = [];

  DocRequest: any[] = [];

  Users: any[] = [];
  DocType: any[] = [];


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

     
      this.LoadUsers(selectedSchema);
      this.LoadLeaveApprovalLevel(selectedSchema);

      this.LoadDocType(selectedSchema);
      this.LoadEmployee(selectedSchema);
      this.LoadDocRequest(selectedSchema);

      
      }

      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property

this.userDetails = this.created_by;
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

               
                this.hasAddPermission = this.checkGroupPermission('add_leaveapprovallevels', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_leaveapprovallevels', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_leaveapprovallevels', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_leaveapprovallevels', groupPermissions);
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


    
// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_leaveapprovallevels' ||'change_leaveapprovallevels' 
//   ||'delete_leaveapprovallevels' ||'view_leaveapprovallevels';
  
  
//   // Check user permissions
//   if (permissions.some(permission => permission.codename === requiredPermission)) {
//     return true;
//   }
  
//   // Check group permissions (if applicable)
//   // Replace `// TODO: Implement group permission check`
//   // with your logic to retrieve and check group permissions
//   // (consider using a separate service or approach)
//   return false; // Replace with actual group permission check
//   }
  
  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }





  
 
  
  

    LoadLeaveApprovalLevel(selectedSchema: string) {
      this.leaveService.getDocReqApprovalLevel(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveapprovalLevels = data;
        
          console.log('employee:', this.LeaveapprovalLevels);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
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

    
    LoadEmployee(selectedSchema: string) {
      this.leaveService.getemployeesMaster(selectedSchema).subscribe(
        (data: any) => {
          this.Employee = data;
        
          console.log('employee:', this.Employee);
        },
        (error: any) => {
          console.error('Error fetching Employee:', error);
        }
      );
    }
  
  

    LoadDocType(selectedSchema: string) {
      this.leaveService.getDocType(selectedSchema).subscribe(
        (data: any) => {
          this.DocType = data;
        
          console.log('DocType:', this.DocType);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  


    
    LoadDocRequest(selectedSchema: string) {
      this.leaveService.getEmpResignationRequest(selectedSchema).subscribe(
        (data: any) => {
          this.DocRequest = data;
        
          console.log('DocRequest:', this.DocRequest);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  



    SetLeaveApprovaLevel(): void {
      this.registerButtonClicked = true;
      // if (!this.name || !this.code || !this.valid_to) {
      //   return;
      // }
    
      const formData = new FormData();
      formData.append('document_date', this.document_date);
      formData.append('resigned_on', this.resigned_on);


  
  
      formData.append('notice_period', this.notice_period);
    
      formData.append('last_working_date', this.last_working_date);
      formData.append('location', this.location);
      formData.append('termination_type', this.termination_type);

      formData.append('reason_for_leaving', this.reason_for_leaving);
    
      formData.append('employee', this.employee);


  
      
    
    
      this.leaveService.CreateEmpResignationRequest(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Resignation Request  has been Sent');
  
          window.location.reload();
        },  
        (error) => {
          console.error('Added failed', error);
          alert('Enter all required fields!');
        }
      );
    }








    isPauseModalOpen: boolean = false;
    isResumeModalOpen: boolean = false;

    iscreateLoanApp: boolean = false;




    openPopus():void{
      this.iscreateLoanApp = true;

    }
  
    closeapplicationModal():void{
      this.iscreateLoanApp = false;

    }

selectedLoanId: number | null = null;











}
