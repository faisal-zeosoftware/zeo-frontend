import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { EmployeeService } from '../employee-master/employee.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-emp-asset-request',
  templateUrl: './emp-asset-request.component.html',
  styleUrl: './emp-asset-request.component.css'
})
export class EmpAssetRequestComponent {

  
  reason: any = '';
  status: any = '';
  employee: any = '';
  asset_type: any = '';
  requested_asset: any = '';
  


  dis_half_day: boolean = false;

  registerButtonClicked: boolean = false;



  LeaveTypes: any[] = [];
  Employees: any[] = [];

  Users: any[] = [];

  employees:any[]=[];
  AssetTypes:any []=[];


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private EmployeeService:EmployeeService,
    private route: ActivatedRoute,
    private router: Router,




  
    ) {}

    ngOnInit(): void {
      this.loadLAsset();
      this.loadLAssetType();

      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


        this.LoadLeavetype(selectedSchema);
      this.LoadEmployee(selectedSchema);
      this.LoadUsers(selectedSchema);


      this.fetchDesignations(selectedSchema);


      
      
      }

      this.route.params.subscribe(params => {
        const employeeId = +params['id']; // Assuming the route has 'id' as a parameter
  
        if (employeeId) {
          this.EmployeeService.getEmployeeDetails(employeeId).subscribe(
            (details) => {
              this.employee = details;
              console.log('emp id ;',details)
            },
            (error) => {
              console.error('Failed to fetch employee details', error);
            }
          );
        } else {
          console.error('Employee ID parameter is null.');
        }
      });
     
    }




    SentAssetRequest(): void {
      this.registerButtonClicked = true;
      const companyData = {
        reason: this.reason,
      
        // status:this.status,
        employee:this.employee,
        asset_type:this.asset_type,
        requested_asset:this.requested_asset,

        // Add other form field values to the companyData object
      };
    
  
      this.EmployeeService.registerAssetRequest(companyData).subscribe(
        (response) => {
          console.log('Registration successful', response);
        
              alert('Asset request has been added ');
              window.location.reload();
              // window.location.reload();
         
  
        },
        (error) => {
          console.error('Added failed', error);
          alert('enter all field!')
          // Handle the error appropriately, e.g., show a user-friendly error message.
        }
      );
    }


  
  LoadLeavetype(selectedSchema: string) {
    this.leaveService.getLeaveType(selectedSchema).subscribe(
      (data: any) => {
        this.LeaveTypes = data;
      
        console.log('LeaveTypes:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }



  LoadEmployee(selectedSchema: string) {
    this.leaveService.getEmployee(selectedSchema).subscribe(
      (data: any) => {
        this.Employees = data;
        
        // Automatically select the first employee if there are any employees
        if (this.Employees && this.Employees.length > 0) {
          this.employee = this.Employees[0].id;
        }
  
        console.log('employee:', this.Employees);
      },
      (error: any) => {
        console.error('Error fetching employees:', error);
      }
    );
  }
  

  LoadUsers(selectedSchema: string) {
    this.leaveService.getUsers(selectedSchema).subscribe(
      (data: any) => {
        this.Users = data;
      
        console.log('Users:', this.Users);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  fetchDesignations(selectedSchema: string) {
    this.EmployeeService.getemployees(selectedSchema).subscribe(
      (data: any) => {
        this.employees = data;
       console.log('employeeDet:', this.employees);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }



  selectedRequestId: number | null = null; // Property to track the selected leave request ID

selectRequest(requestId: number) {
  this.selectedRequestId = requestId === this.selectedRequestId ? null : requestId; // Toggle the selected request
}



Assets:any []=[];

loadLAsset(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.EmployeeService.getAsset(selectedSchema).subscribe(
      (result: any) => {
        this.Assets = result;
        console.log(' fetching Loantypes:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }


  
          loadLAssetType(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.EmployeeService.getAssetType(selectedSchema).subscribe(
                (result: any) => {
                  this.AssetTypes = result;
                  console.log(' fetching Loantypes:');
          
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }
}
