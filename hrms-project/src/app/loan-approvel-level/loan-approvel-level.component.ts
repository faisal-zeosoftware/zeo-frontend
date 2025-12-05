import { Component } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';

@Component({
  selector: 'app-loan-approvel-level',
  templateUrl: './loan-approvel-level.component.html',
  styleUrl: './loan-approvel-level.component.css'
})
export class LoanApprovelLevelComponent {



  

  level:any='';
  role:any='';
  approver:any='';


  loan_type:any='';




  


  LoanTypes:any []=[];
  approvalLevels:any []=[];
  Approvers:any []=[];

   Users:any []=[];



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

    
     private userService: UserMasterService,

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
private employeeService: EmployeeService,

  ) {}

  ngOnInit(): void {

    this.loadLoanTypes();
    this.loadLoanApprovalLevels();
    this.loadLoanapprover();

     this.loadUsers();


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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_loancommonworkflow', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_loancommonworkflow', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_loancommonworkflow', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_loancommonworkflow', groupPermissions);
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
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  


  

  registerButtonClicked = false;


CreateLoanApproverLevel(): void {
  this.registerButtonClicked = true;

  const formData = new FormData();
  formData.append('level', this.level);
  formData.append('role', this.role);
  formData.append('approver', this.approver);
  formData.append('loan_type', this.loan_type);

  this.employeeService.registerLoanApproverLevel(formData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Loan Approval Level has been added');
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

  mapLoanTypeNameToId() {

  if (!this.LoanTypes || !this.editAsset?.loan_type) return;

  const lon = this.LoanTypes.find(
    (l: any) => l.loan_type === this.editAsset.loan_type
  );

  if (lon) {
    this.editAsset.loan_type = lon.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.loan_type);
}



     
    loadLoanApprovalLevels(): void {
    
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getLoanApprovalLevels(selectedSchema).subscribe(
          (result: any) => {
            this.approvalLevels = result;
            console.log(' fetching Loantypes:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }
  


      loadLoanapprover(callback?: Function): void {
    
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.employeeService.getLoanapprover(selectedSchema).subscribe(
            (result: any) => {
              this.Approvers = result;
              console.log(' fetching Loantypes:');
              if (callback) callback();
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }

    mapLoanAprNameToId() {

  if (!this.Approvers || !this.editAsset?.approver) return;

  const apr = this.Approvers.find(
    (l: any) => l.username === this.editAsset.approver
  );

  if (apr) {
    this.editAsset.approver = apr.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.approver);
}



        // non-ess-users usermaster services

      loadUsers(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.userService.getApprover(selectedSchema).subscribe(
      (result: any) => {
        this.Users = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }




        
      iscreateLoanApp: boolean = false;




      openPopus():void{
        this.iscreateLoanApp = true;

      }
    
      closeapplicationModal():void{
        this.iscreateLoanApp = false;

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

toggleSelectAllEmployees() {
  this.allSelecteds = !this.allSelecteds;
this.approvalLevels.forEach(employee => employee.selected = this.allSelecteds);

}

onCheckboxChange(employee:number) {
// No need to implement any logic here if you just want to change the style.
// You can add any additional logic if needed.
}



isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
this.editAsset = { ...asset }; // copy asset data
this.isEditModalOpen = true;

this.mapLoanAprNameToId();
this.mapLoanTypeNameToId();

}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedLoanAprlvl() { 
  const selectedEmployeeIds = this.approvalLevels
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Loan Approval Level selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Loan Approval Level ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;


    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteLoanApprovalLevel(categoryId).subscribe(
        () => {
          console.log(' Loan Approval Level deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.approvalLevels = this.approvalLevels.filter(employee => employee.id !== categoryId);

           completed++;

         if (completed === total) { 
          alert(' Loan Approval Level  deleted successfully');
          window.location.reload();
         }

        },
        (error) => {
          console.error('Error deleting Loan Approval Level:', error);
            alert('Error deleting Loan Approval Level: ' + error.statusText);
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

  this.employeeService.updateLoanApprovalLevel(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert(' Loan Approval Level  updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
(error) => {
  console.error('Error updating Loan Approval level:', error);

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
