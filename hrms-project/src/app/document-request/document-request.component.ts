import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-document-request',
  templateUrl: './document-request.component.html',
   styleUrl: './document-request.component.css'
})

export class DocumentRequestComponent {

  private apiUrl = `${environment.apiBaseUrl}`;
      

  allSelected=false;

  
    document_number: number | string | null = null;

    automaticNumbering: boolean = false;

    branch: any = '';

    branches:any []=[];



  reason:any='' ;
  total:any='' ;

  remarks:any='' ;
  request_type: any = '';
  employee: any = '';
  created_by: any = '';



  is_compensatory: boolean = false;

  registerButtonClicked: boolean = false;



  LeaveapprovalLevels: any[] = [];

  Employee: any[] = [];

  DocRequest: any[] = [];

  Users: any[] = [];
  DocType: any[] = [];

    filteredEmployees: any[] = [];


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
    private employeeService:EmployeeService,

    private DesignationService: DesignationService,
    private DepartmentServiceService: DepartmentServiceService 
  
    ) {}

    ngOnInit(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {

     
      this.LoadUsers(selectedSchema);
      this.LoadLeaveApprovalLevel(selectedSchema);

      this.LoadDocType();
      this.LoadEmployee();
      this.LoadDocRequest(selectedSchema);
      this.loadDeparmentBranch();

      
      }

      this.userId = this.sessionService.getUserId();
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        // this.created_by = this.userId; // Automatically set the owner to logged-in user ID
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_documentrequest', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_documentrequest', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_documentrequest', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_documentrequest', groupPermissions);
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
  

    this.authService.getUserSchema(this.userId).subscribe(
      (userData: any) => {
        this.userDetailss = userData; // Store user schemas in userDetailss

        this.schemas = userData.map((schema: any) => schema.schema_name);
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

    
    LoadEmployee(callback?: Function) {
      
     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.leaveService.getemployeesMaster(selectedSchema).subscribe(
        (data: any) => {
          this.Employee = data;
             this.filteredEmployees = data; // ✅ IMPORTANT
         if (callback) callback();
          console.log('employee:', this.Employee);
        },
        (error: any) => {
          console.error('Error fetching Employee:', error);
        }
      );
    }
  }
  
    mapLoadEmpNameToId() {
    
  if (!this.Employee || !this.editAsset?.employee) return;

  const emp = this.Employee.find(
    (e: any) => e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}
  
  

    LoadDocType(callback?: Function) {
     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.leaveService.getDocRequestType(selectedSchema).subscribe(
        (data: any) => {
          this.DocType = data;
             if (callback) callback();
          console.log('DocType:', this.DocType);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  }

  mapBranchNameToId() {
    
  if (!this.DocType || !this.editAsset?.request_type) return;

  const doc = this.DocType.find(
    (d: any) => d.type_name === this.editAsset.request_type
  );

  if (doc) {
    this.editAsset.request_type = doc.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.request_type);
}

  


    
    LoadDocRequest(selectedSchema: string) {
      this.leaveService.getDocRequest(selectedSchema).subscribe(
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
       formData.append('document_number', this.document_number?.toString() || '');
      formData.append('reason', this.reason);
      formData.append('branch', this.branch);


  
  
      formData.append('total', this.total);
      formData.append('remarks', this.remarks);
    
      formData.append('request_type', this.request_type);
      formData.append('employee', this.employee);
      formData.append('created_by', this.created_by);

     
  
      
    
    
      this.leaveService.CreateDocRequest(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Document Request  has been Sent');
  
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



    


    
  iscreateLoanApp: boolean = false;




  openPopus():void{
    this.iscreateLoanApp = true;

    this.document_number = null;
    this.automaticNumbering = false;
    this.branch = ''; 

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
this.DocRequest.forEach(employee => employee.selected = this.allSelecteds);

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

this.mapBranchNameToId();
this.mapLoadEmpNameToId();

}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedAssetType() { 
const selectedEmployeeIds = this.DocRequest
.filter(employee => employee.selected)
.map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
alert('No Document Request selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected Document Request  ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;                  

selectedEmployeeIds.forEach(categoryId => {
  this.employeeService.deleteDocReq(categoryId).subscribe(
    () => {
      console.log(' Document Type deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.DocRequest = this.DocRequest.filter(employee => employee.id !== categoryId);
      completed++;

      if (completed === total) {
      alert(' Document Request  deleted successfully');
      window.location.reload();
      }

    },
    (error) => {
      console.error('Error deleting Document Request:', error);
      alert('Error deleting Document Request: ' + error.statusText);
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

this.employeeService.updateDocReq(this.editAsset.id, this.editAsset).subscribe(
(response) => {
  alert(' Document Request  updated successfully!');
  this.closeEditModal();
  window.location.reload();
},
(error) => {
  console.error('Error updating Document Request:', error);

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

onBranchChange(event: any): void {
  const selectedBranchId = event.target.value;
  const selectedSchema = localStorage.getItem('selectedSchema');

  this.branch = selectedBranchId;

  /* ------------------ FILTER EMPLOYEES ------------------ */
  if (!selectedBranchId) {
    this.filteredEmployees = this.Employee;
    this.employee = '';
  } else {
    const selectedBranch = this.branches.find(
      b => Number(b.id) === Number(selectedBranchId)
    );

    if (selectedBranch) {
      this.filteredEmployees = this.Employee.filter(emp =>
        emp.emp_branch_id == selectedBranch.id ||
        emp.emp_branch_id == selectedBranch.branch_name
      );
    } else {
      this.filteredEmployees = [];
    }

    this.employee = '';
  }

  /* ------------------ DOCUMENT NUMBERING ------------------ */
  if (!selectedBranchId || !selectedSchema) {
    this.automaticNumbering = false;
    this.document_number = null;
    return;
  }

  const type = 'advance_salary';

  const apiUrl =
    `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;

  this.http.get<any>(apiUrl).subscribe({
    next: (response) => {
      const data = Array.isArray(response) && response.length > 0 ? response[0] : response;

      this.automaticNumbering = !!data?.automatic_numbering;
      this.document_number = this.automaticNumbering ? null : '';
    },
    error: () => {
      this.automaticNumbering = false;
      this.document_number = '';
    }
  });
}

  loadDeparmentBranch(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any) => {
          this.branches = result;
          console.log(' fetching Companies:');
            if (callback) callback();

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }

    
  mapBranchesNameToId() {
  if (!this.branches || !this.editAsset?.branch) return;

  const Bran = this.branches.find(
    (b: any) => b.branch_name === this.editAsset.branch
  );

  if (Bran) {
    this.editAsset.branch = Bran.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.branch);
}



}
