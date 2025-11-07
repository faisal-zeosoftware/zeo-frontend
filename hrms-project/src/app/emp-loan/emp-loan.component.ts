import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { EmployeeService } from '../employee-master/employee.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-emp-loan',
  templateUrl: './emp-loan.component.html',
  styleUrl: './emp-loan.component.css'
})
export class EmpLoanComponent {

  
  
 
  amount_requested:any='';
  repayment_period:any='';
  emi_amount:any='';
  disbursement_date:any='';
  remaining_balance:any='';
  // approved_on:any='';

  rejection_reason:any='';

  pause_start_date:any='';

  resume_date:any='';

  pause_reason:any='';

  employee:any='';
  loan_type:any='';


  dis_half_day: boolean = false;

  registerButtonClicked: boolean = false;



  LeaveTypes: any[] = [];
  Employees: any[] = [];

  Users: any[] = [];

  employees:any[]=[];
    LoanTypes:any[]=[];


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
          this.loadLoanTypes();

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
  



    CreateLoanApplication(): void {
      this.registerButtonClicked = true;
    
    
      const formData = new FormData();
      formData.append('amount_requested', this.amount_requested);
      formData.append('repayment_period', this.repayment_period);
      formData.append('emi_amount', this.emi_amount);
      // formData.append('disbursement_date', this.disbursement_date );
      formData.append('remaining_balance', this.remaining_balance);
      // formData.append('approved_on', this.approved_on);
      // formData.append('rejection_reason', this.rejection_reason);
  
  
      
      formData.append('pause_start_date', this.pause_start_date);
      formData.append('resume_date', this.resume_date );
      formData.append('pause_reason', this.pause_reason);
      formData.append('employee', this.employee);
      formData.append('loan_type', this.loan_type);
  
  
    
      this.EmployeeService.registerLoanApplication(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
          alert('Loan application has been added');
          window.location.reload();
        },
        (error) => {
          console.error('Added failed', error);
          alert('Enter all required fields!');
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

  loadLoanTypes(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.EmployeeService.getLoanTypes(selectedSchema).subscribe(
        (result: any) => {
          this.LoanTypes = result;
          console.log(' fetching Loantypes:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
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

}
