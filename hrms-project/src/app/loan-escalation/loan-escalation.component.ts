
import { Component } from '@angular/core';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { environment } from '../../environments/environment';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';

import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-loan-escalation',
  templateUrl: './loan-escalation.component.html',
  styleUrl: './loan-escalation.component.css'
})

export class LoanEscalationComponent {

  private dataSubscription?: Subscription;

    // doc_number: any = '';
    document_number: number | null = null;
    reason: any = '';
    total: any = '';
    branch: any = '';
    request_type: any = '';
    employee: any = '';
    created_by: any = '';
    approved:  boolean = false;
  
  
    automaticNumbering: boolean = false;
  
    remarks: string = '';
    request_document: File | null = null;
  
  
  
  
  
    escalate_to: any = '';
  
    escalate_after_days: any = '';
  
    escalate_after_hours: any = '';
    escalate_after_minutes: any = '';
  
  
  
    branches:any []=[];
    RequestType:any []=[];
    employees:any []=[];
    Users:any []=[];
    GeneralReq:any []=[];
  
  EscalationLevels: any[] = [];   // Hold Approval Levels
  selectedLevel: any = null;   // now contains full object
  
    schemas: string[] = []; // Array to store schema names
  
    
    userId: number | null | undefined;
    userDetails: any;
    userDetailss: any[] = [];
    username: any;
  
  
  
    hasAddPermission: boolean = false;
    hasDeletePermission: boolean = false;
    hasViewPermission: boolean =false;
    hasEditPermission: boolean = false;
    hasExportPermission: boolean = false;
  
  
    registerButtonClicked = false;
  
    // private apiUrl = 'http://one.localhost:8000/organisation/api/fiscal-years/';
    private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local
  
  
    constructor(private DepartmentServiceService: DepartmentServiceService ,
      private companyRegistrationService: CompanyRegistrationService, 
      private http: HttpClient,
      private authService: AuthenticationService,
      private employeeService: EmployeeService,
      private userService: UserMasterService,
      private sessionService: SessionService,
      private DesignationService: DesignationService,
  
  
      
  
  
  ) {}
  
  ngOnInit(): void {

    
   // combineLatest waits for both Schema and Branches to have a value
   this.dataSubscription = combineLatest([
    this.employeeService.selectedSchema$,
    this.employeeService.selectedBranches$
  ]).subscribe(([schema, branchIds]) => {
    if (schema) {
      this.fetchEmployees(schema, branchIds);

    }
  });

    this.loadDeparmentBranch();
    this.loadRequestType();
    this.loadEmp();
    this.loadUsers();
    // this.loadgeneralReq();
  
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
            this.hasExportPermission = true;
        
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
                    this.hasExportPermission = true;
                    
                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);
    
                    this.hasAddPermission = this.checkGroupPermission('add_loan_escalation', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_loan_escalation', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
                    this.hasEditPermission = this.checkGroupPermission('change_loan_escalation', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
    
                    this.hasViewPermission = this.checkGroupPermission('view_loan_escalation', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);

                    
                    this.hasExportPermission = this.checkGroupPermission('export_loan_escalation', groupPermissions);
                    console.log('Has view permission:', this.hasExportPermission);
  
  
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
  allSelected: boolean = false;
  
  toggleCheckboxes() {
  this.Delete = !this.Delete;
  }
  
  toggleSelectAllEmployees() {
    this.allSelected = !this.allSelected;
  this.GeneralReq.forEach(employee => employee.selected = this.allSelected);
  
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
  
  
  this.mapReqTypeNameToId();
  this.mapUsersNameToId();
  }
  
  closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editAsset = {};
  }
  
  
  deleteSelectedGeneralReq() { 
    const selectedEmployeeIds = this.GeneralReq
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No General Request selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected General Request?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteGeneralReq(categoryId).subscribe(
          () => {
            console.log('Asset type deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.GeneralReq = this.GeneralReq.filter(emp => emp.id !== categoryId);
  
              completed++;
  
  
              if (completed === total) {
            alert(' General Request deleted successfully');
            window.location.reload();
              }
  
          },
          (error) => {
            console.error('Error deleting General Request:', error);
           alert('Error deleting General Request: ' + error.statusText);
          }
        );
      });
    }
  }
  
  resetSelectedGeneralReq() {
    const selectedIds = this.GeneralReq
      .filter(item => item.selected)
      .map(item => item.id);
  
    if (selectedIds.length === 0) {
      alert('No General Request selected for reset.');
      return;
    }
  
    if (confirm('Are you sure you want to reset the selected General Request(s)?')) {
  
      let total = selectedIds.length;
      let completed = 0;
  
      selectedIds.forEach(id => {
        this.employeeService.resetLoanEsc(id).subscribe(
          () => {
            console.log(' reset successfully:', id);
            completed++;
  
            if (completed === total) {
              alert('General Request reset successfully');
              window.location.reload();
            }
          },
          (error) => {
            console.error('Error resetting General Request:', error);
            alert('Error resetting General Request: ' + error.statusText);
          }
        );
      });
    }
  }
  
  resetSingleReq(id: number) {
    if (confirm("Are you sure you want to reset this rule?")) {
      this.employeeService.resetLoanEsc(id).subscribe(
        () => {
          alert("Reset successful!");
          window.location.reload();
        },
        (error) => {
          alert("Reset failed: " + error.statusText);
        }
      );
    }
  }
  
  
  
  
  
  
  updateAssetType(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editAsset.id) {
      alert('Missing schema or asset ID');
      return;
    }
  
    this.employeeService.updateLoanEsc(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert('Loan Escalation updated successfully!');
        this.closeEditModal();
        // this.loadgeneralReq(); // reload updated list
        window.location.reload();
      },
  (error) => {
    console.error('Error updating General Request Escalation:', error);
  
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
  
  
  
    loadDeparmentBranch(): void {
      
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
          (result: any) => {
            this.branches = result;
            console.log(' fetching Companies:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }
  
      onBranchChange(event: any): void {
        const selectedBranchId = event.target.value;
        const selectedSchema = localStorage.getItem('selectedSchema'); // Retrieve the selected schema from local storage or any other storage method
    
        if (selectedBranchId && selectedSchema) {
          const apiUrl = `${this.apiUrl}/employee/api/general-request/document_numbering_by_branch/?branch_id=${selectedBranchId}&schema=${selectedSchema}`;
          this.http.get(apiUrl).subscribe(
            (response: any) => {
              this.automaticNumbering = response.automatic_numbering;
              if (this.automaticNumbering) {
                this.document_number = null; // Clear the document number field if automatic numbering is enabled
              }
            },
            (error) => {
              console.error('Error fetching branch details:', error);
            }
          );
        }
      }
    
  
  
      loadRequestType(callback?: Function): void {
      
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.DepartmentServiceService.getReqType(selectedSchema).subscribe(
            (result: any) => {
              this.RequestType = result;
              console.log(' fetching Companies:');
               if (callback) callback();
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }
  
    mapReqTypeNameToId() {
    if (!this.RequestType || !this.editAsset?.request_type) return;
  
    const req = this.RequestType.find(
      (r: any) => r.name === this.editAsset.request_type
    );
  
    if (req) {
      this.editAsset.request_type = req.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.request_type);
  }
  
        loadEmp(): void {
      
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.employeeService.getemployeesMaster(selectedSchema).subscribe(
              (result: any) => {
                this.employees = result;
                console.log(' fetching Companies:');
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }
  
          onEmployeeChange(event: any): void {
            const selectedEmployeeId = event.target.value;
            if (selectedEmployeeId) {
                // Fetch employee details including branch_id
                this.employeeService.getEmployeeDetails(selectedEmployeeId).subscribe(
                    (employee: any) => {
                      
                        this.branch = employee.emp_branch_id; // Update branch dropdown with employee's branch
                        console.log('Selected employee branch:', this.branch); // Log selected employee's branch
  
                    
                      },
                      (error:HttpErrorResponse) => {
  
                        if (error.status === 401) {
                          // Unauthorized error, typically used for wrong credentials
                          alert('Enter all fileds correctly.');
                        } else {
                          // General error message
                          const errorMessage = error.error?.detail || 'Enter all fields';
                          alert(`Creating error: ${errorMessage}`);
                        }
                           
  
                        // console.error('Error fetching employee details:', error);
                    }
                );
            }
        }
  
          loadUsers(callback?: Function): void {
      
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.userService.getSChemaUsers(selectedSchema).subscribe(
                (result: any) => {
                  this.Users = result;
                  console.log(' fetching Companies:');
                   if (callback) callback();
          
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }
  
  
    mapUsersNameToId() {
  
    if (!this.Users || !this.editAsset?.escalate_to) return;
  
    const use = this.Users.find(
      (u: any) => u.username === this.editAsset.escalate_to
    );
  
    if (use) {
      this.editAsset.escalate_to = use.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.escalate_to);
  }
  
            registerGeneralreq() {
              if (!this.selectedLevel) {
                alert("Please select a level");
                return;
              }
            
              const selectedSchema = this.authService.getSelectedSchema();
              if (!selectedSchema) {
                alert("Schema not found");
                return;
              }
            
              const levelId = this.selectedLevel.id; // 🔥 IMPORTANT
            
              const payload = {
                escalate_to: this.escalate_to,
                escalate_after_days: this.escalate_after_days,
                escalate_after_hours: this.escalate_after_hours,
                escalate_after_minutes: this.escalate_after_minutes
              };
            
              this.DepartmentServiceService
                  .updateEscalationLevelLoan(selectedSchema, levelId, payload)
                  .subscribe(
                    (res) => {
                      alert("Escalation level updated successfully");
                      console.log("Update Success:", res);
                      window.location.reload()
                    }, 
                    (error) => {
                      console.error("Update failed:", error);
                      alert("Failed to update escalation rule");
                    }
                  );
            }
                
  
  selectedSalaryComponent: string | null = null;
  
  onRequestTypeChange(event: any) {
    const selectedTypeId = this.request_type; // selected request type ID
    const selectedSchema = this.authService.getSelectedSchema();
  
    if (!selectedSchema) {
      alert("Schema not found.");
      return;
    }
  
    if (!selectedTypeId) {
      this.EscalationLevels = [];
      return;
    }
  
    this.DepartmentServiceService.getEscalationLevelsLoan(selectedSchema, selectedTypeId)
      .subscribe(
        (result: any) => {
          this.EscalationLevels = result;
          console.log("Escalation Levels:", result);
        },
        (error) => {
          console.error('Error fetching escalation levels:', error);
        }
      );
  }
  
  
  
            // loadgeneralReq(): void {
      
            //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
            
            //   console.log('schemastore',selectedSchema )
            //   // Check if selectedSchema is available
            //   if (selectedSchema) {
            //     this.employeeService.getAllgeneralRequestEscalationsLoan(selectedSchema).subscribe(
            //       (result: any) => {
            //         this.GeneralReq = result;
            //         console.log(' fetching  general Request: ', result);
            
            //       },
            //       (error) => {
            //         console.error('Error fetching general Request:', error);
            //       }
            //     );
            //   }
            //   }
      

              isLoading: boolean = false;

              fetchEmployees(schema: string, branchIds: number[]): void {
  this.isLoading = true;
  this.employeeService.getEscalationsLoanNew(schema, branchIds).subscribe({
    next: (data: any) => {
      // Filter active employees
           this.GeneralReq = data;

      this.isLoading = false;
    },
    error: (err) => {
      console.error('Fetch error:', err);
      this.isLoading = false;
    }
  });
} 

     
              
              onFileChange(event: any) {
                const file = event.target.files[0];
                if (file) {
                  this.request_document = file;
                }
              }
            

}
