import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';

@Component({
  selector: 'app-leave-balance',
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.css'
})
export class LeaveBalanceComponent {

     private apiUrl = `${environment.apiBaseUrl}`;



  registerButtonClicked: boolean = false;


  balance:any='';
  openings:any='' ;
  employee:any='' ;
  leave_type:any='' ;


  created_by:any='' ;



  LeaveTypes: any[] = [];
  Employees: any[] = [];
  LeaveBalances: any[] = [];



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
    private companyRegistrationService: CompanyRegistrationService, 

  
    ) {}

    ngOnInit(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


        this.LoadLeavetype();
      this.LoadUsers(selectedSchema);
      this.LoadEmployees();
      this.LoadLeavebalance(selectedSchema);


      
      }

      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property

      this.created_by= this.userId;
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

               
                this.hasAddPermission = this.checkGroupPermission('add_emp_leave_balance', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_emp_leave_balance', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_emp_leave_balance', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_emp_leave_balance', groupPermissions);
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
      


      showBulkUpload: boolean = false;

      toggleBulkUpload() {
        this.showBulkUpload = !this.showBulkUpload;
      }
      



      LoadLeavetype(callback?: Function) {

      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
       console.log('schemastore',selectedSchema )
       // Check if selectedSchema is available
       if (selectedSchema) {

        this.leaveService.getLeaveType(selectedSchema).subscribe(
          (data: any) => {
            this.LeaveTypes = data;
          
            console.log('employee:', this.LeaveTypes);
              if (callback) callback();
          },
          (error: any) => {
            console.error('Error fetching categories:', error);
          }
        );
      }
    }

    mapLeaveTypeNameToId() {

  if (!this.LeaveTypes || !this.editAsset?.leave_type) return;

  const lv = this.LeaveTypes.find(
    (l: any) => l.name === this.editAsset.leave_type
  );

  if (lv) {
    this.editAsset.leave_type = lv.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.leave_type);
}

    

      
      LoadEmployees(callback?: Function) {

          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
       console.log('schemastore',selectedSchema )
       // Check if selectedSchema is available
       if (selectedSchema) {

        this.leaveService.getemployeesMaster(selectedSchema).subscribe(
          (data: any) => {
            this.Employees = data;
          
            console.log('employee:', this.Employees);
             if (callback) callback();
          },
          (error: any) => {
            console.error('Error fetching Employees:', error);
          }
        );
      }
    }

   mapLoadEmployeeNameToId() {

  if (!this.Employees || !this.editAsset?.employee) return;

  const emp = this.Employees.find(
    (e: any) => e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}
    
    
    
   
    
      LoadUsers(selectedSchema: string) {
        this.leaveService.getApproverUsers(selectedSchema).subscribe(
          (data: any) => {
            this.Users = data;
          
            console.log('employee:', this.LeaveTypes);
          },
          (error: any) => {
            console.error('Error fetching categories:', error);
          }
        );
      }



      
      LeaveBalance(): void {
      this.registerButtonClicked = true;
      // if (!this.name || !this.code || !this.valid_to) {
      //   return;
      // }
    
      const formData = new FormData();
      formData.append('leave_type', this.leave_type);
      formData.append('balance', this.balance);


  
  
      formData.append('openings', this.openings);
      formData.append('employee', this.employee);
    
      formData.append('created_by', this.created_by);

     
  
      
    
    
      this.leaveService.CreateLeaveBalance(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Leave Approval Level has been Created');
  
          window.location.reload();
        },  
        (error) => {
          console.error('Added failed', error);
          alert('Enter all required fields!');
        }
      );
    }


    LoadLeavebalance(selectedSchema: string) {
      this.leaveService.getLeaveBalanceAll(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveBalances = data;
        
          console.log('employee:', this.LeaveTypes);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
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
this.LeaveBalances.forEach(employee => employee.selected = this.allSelecteds);

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

this.mapLeaveTypeNameToId();
this.mapLoadEmployeeNameToId();
}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedLeavebalance() { 
const selectedEmployeeIds = this.LeaveBalances
.filter(employee => employee.selected)
.map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
alert('No Leave Balances selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected Leave Balance ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;


selectedEmployeeIds.forEach(categoryId => {
this.leaveService.deleteLeaveBalance(categoryId).subscribe(
  () => {
    console.log(' Leave Balances deleted successfully:', categoryId);
    // Remove the deleted employee from the local list
    this.LeaveBalances = this.LeaveBalances.filter(employee => employee.id !== categoryId);

    completed++;

    if (completed === total) {
    alert(' Leave Balances  deleted successfully');
    window.location.reload();
    }

  },
  (error) => {
    console.error('Error deleting Leave Balances:', error);
     alert('Error deleting category: ' + error.statusText);
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

this.leaveService.updateLeaveBalance(this.editAsset.id, this.editAsset).subscribe(
(response) => {
alert(' Leave Balances  updated successfully!');
this.closeEditModal();
window.location.reload();
},
(error) => {
  console.error('Error updating Leave Balance:', error);

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



isBulkuploadDepartmentModalOpen = false;
showUploadForm = false;
selectedFile!: File;

/* Open / Close Modal */
OpenBulkuploadModal(): void {
  this.isBulkuploadDepartmentModalOpen = true;
}

closeBulkuploadModal(): void {
  this.isBulkuploadDepartmentModalOpen = false;
  this.showUploadForm = false;
}

toggleUploadForm(): void {
  this.showUploadForm = !this.showUploadForm;
}

closeUploadForm(): void {
  this.showUploadForm = false;
}

/* File Select */
onFileSelected(event: any): void {
  this.selectedFile = event.target.files[0];
}

bulkUploadLeaveBalance(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema || !this.selectedFile) return;

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  this.http.post(
    `${this.apiUrl}/calendars/api/Emp-bulkupld-openings/bulk_upload/?schema=${selectedSchema}`,
    formData
  ).subscribe({
    next: () => {
      alert('Leave Balance uploaded successfully');
      window.location.reload();
    },
    error: () => {
      alert('Upload failed');
    }
  });
}

downloadLeaveBalanceCsv(): void {
  const schema = this.authService.getSelectedSchema();
  if (!schema) return;

  this.companyRegistrationService
    .downloadLeaveCsv(schema)
    .subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Leave_Balance_Template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    });
}


downloadLeaveBalanceExcel(): void {
  const schema = this.authService.getSelectedSchema();
  if (!schema) return;

  this.companyRegistrationService
    .downloadLeaveExcel(schema)
    .subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Leave_Balance_Template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
}






}
