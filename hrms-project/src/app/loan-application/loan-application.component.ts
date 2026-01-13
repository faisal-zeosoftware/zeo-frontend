import { Component } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-loan-application',
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.css'
})
export class LoanApplicationComponent {


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




  


  Employees: any[] = []; // Array to store schema names
  LoanTypes:any []=[];
LoanApplications: any[] = [];  // Already exists — use this!




  selectedFile!: File | null;

  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names
  
  constructor(
    private leaveservice: LeaveService, 
    private authService: AuthenticationService, 

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
private employeeService: EmployeeService,

  ) {}

  ngOnInit(): void {

    this.loadLoanTypes();
    this.LoadEmployees();
    this.loadLoanApplications();

    this.userId = this.sessionService.getUserId();
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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_loanapplication', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_loanapplication', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_loanapplication', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_loanapplication', groupPermissions);
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
  }
}

  

showEditBtn: boolean = false;
  
EditShowButtons() {
  this.showEditBtn = !this.showEditBtn;
}

Delete: boolean = false;
allSelecteds: boolean = false;


toggleCheckboxes() {
this.Delete = !this.Delete;
}


  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
  }
  

  registerButtonClicked = false;


  CreateLoanApplication(): void {
    this.registerButtonClicked = true;
  
  
    const formData = new FormData();
    formData.append('amount_requested', this.amount_requested);
    formData.append('repayment_period', this.repayment_period);
    formData.append('emi_amount', this.emi_amount);

    formData.append('remaining_balance', this.remaining_balance);
 


    
    formData.append('pause_start_date', this.pause_start_date);
    formData.append('resume_date', this.resume_date );
    formData.append('pause_reason', this.pause_reason);
    formData.append('employee', this.employee);
    formData.append('loan_type', this.loan_type);


  
    this.employeeService.registerLoanApplication(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Loan application has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);

          let errorMessage = 'Enter all required fields!';

      // ✅ Handle backend validation or field-specific errors
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
 
    );
  }



  LoadEmployees(callback?: Function) {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getemployeesMaster(selectedSchema).subscribe(
        (result: any) => {
          this.Employees = result;
          console.log(' fetching Employees:');
          if (callback) callback();
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }

mapEmployeeNameToId() {
  if (!this.Employees || !this.editAsset?.employee) return;

  const currentValue = this.editAsset.employee;

  // Case 1 — Already an ID (number)
  if (typeof currentValue === 'number') {
    return; // Nothing to map
  }

  // Case 2 — Find match by emp_code string
  const emp = this.Employees.find(
    (e: any) => e.emp_code?.trim() === String(currentValue).trim()
  );

  if (emp) {
    this.editAsset.employee = emp.id;
    console.log("Mapped employee_id:", this.editAsset.employee);
    return;
  }

  console.warn("No matching employee found for:", currentValue);
}

  


      
  loadLoanTypes(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getLoanTypes(selectedSchema).subscribe(
        (result: any) => {
          this.LoanTypes = result;
          console.log(' fetching Loantypes:');
                if (callback) callback();
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }

    
  mapLoanNameToId() {

  if (!this.LoanTypes || !this.editAsset?.loan_type) return;

  const lon = this.LoanTypes.find(
    (l: any) => l.loan_type === this.editAsset.loan_type
  );

  if (lon) {
    this.editAsset.loan_type = lon.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.loan_type);
}
  



     
    loadLoanApplications(): void {
    
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getLoanApplications(selectedSchema).subscribe(
          (result: any) => {
            this.LoanApplications = result;
            console.log(' fetching Loantypes:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }
  


      isPauseModalOpen: boolean = false;
      isResumeModalOpen: boolean = false;

      iscreateLoanApp: boolean = false;

isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited




      openPopus():void{
        this.iscreateLoanApp = true;

      }

openEditModal(asset: any): void {
  this.editAsset = { ...asset };
  this.isEditModalOpen = true;

  this.LoadEmployees(() => {
    this.mapEmployeeNameToId();
    this.mapLoanNameToId();
  });
}


     closeEditModal(): void {
      this.isEditModalOpen = false;
      this.editAsset = {};
      }
    
      closeapplicationModal():void{
        this.iscreateLoanApp = false;

      }



selectedLoanId: number | null = null;



openPauseModal(loan: any): void {
  this.selectedLoanId = loan.id;
  this.pause_start_date = '';
  this.pause_reason = '';
  this.isPauseModalOpen = true;
}
closePauseModal(): void {
  this.isPauseModalOpen = false;
}


openResumeModal(loan: any): void {
  this.selectedLoanId = loan.id;
  this.resume_date = '';
  this.isResumeModalOpen = true;
}

closeResumeModal(): void {
  this.isResumeModalOpen = false;
}



// -------------------- Submit Pause --------------------

submitPauseLoan(): void {
  if (!this.selectedLoanId) {
    alert('Loan ID is missing!');
    return;
  }

  const pauseData = {
    pause_start_date: this.pause_start_date,
    pause_reason: this.pause_reason,
    resume_date: null // resume date is not set during pause
  };

  this.employeeService.pauseLoanApplication(this.selectedLoanId, pauseData).subscribe(
    (response) => {
      alert('Loan application paused successfully!');
      this.closePauseModal();
      this.loadLoanApplications();
      window.location.reload();
    },
    (error) => {
      console.error('Pause failed:', error);
      alert('Failed to pause the loan application.');
    }
  );
}

// -------------------- Submit Resume --------------------

submitResumeLoan(): void {
  if (!this.selectedLoanId) {
    alert('Loan ID is missing!');
    return;
  }

  const resumeData = {
    resume_date: this.resume_date,
    pause_start_date: null, // clear pause date when resuming
    pause_reason: null
  };

  this.employeeService.resumeLoanApplication(this.selectedLoanId, resumeData).subscribe(
    (response) => {
      alert('Loan application resumed successfully!');
      this.closeResumeModal();
      this.loadLoanApplications();
      window.location.reload();

    },
    (error) => {
      console.error('Resume failed:', error);
      alert('Failed to resume the loan application.');
    }
  );
}

toggleSelectAllEmployees() {
  this.allSelecteds = !this.allSelecteds;
this.LoanApplications.forEach(employee => employee.selected = this.allSelecteds);

}



deleteSelectedLoanApplication() { 
  const selectedIds = this.LoanApplications
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedIds.length === 0) {
    alert('No Loan Application selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Loan Applications ?')) {

    let total = selectedIds.length;
    let completed = 0;

    selectedIds.forEach(id => {
      this.employeeService.deleteLoanApplication(id).subscribe(
        () => {
          // remove locally
          this.LoanApplications = this.LoanApplications.filter(employee => employee.id !== id);

          completed++;
          if (completed === total) {
            alert('Loan Applications deleted successfully');
          }
        },
        (error) => {
          alert('Error deleting Loan Application: ' + error.statusText);
        }
      );
    });
  }
}

updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateLoanApplication(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert(' Loan Application updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
(error) => {
  console.error('Error updating Loan Application:', error);

  let errorMsg = 'Update failed';

  const backendError = error?.error;

  if (backendError && typeof backendError === 'object') {
    // Convert the object into a readable string
    errorMsg = Object.keys(backendError)
      .map(key => `${key}: ${backendError[key].join(', ')}`)
      .join('\n');
  }

  alert(errorMsg);
}
  );
}


}






