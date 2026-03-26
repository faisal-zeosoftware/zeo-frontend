import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-attendance-request',
  templateUrl: './attendance-request.component.html',
  styleUrl: './attendance-request.component.css'
})
export class AttendanceRequestComponent {

       
    private dataSubscription?: Subscription;
  
    allSelected=false;
  
  
  
    // document_date:any='';

    date:any='';
    request_type:any='';
    reason:any='';
    status:any='';
   employee: number[] = [];
  
    
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
  
          // combineLatest waits for both Schema and Branches to have a value
          this.dataSubscription = combineLatest([
            this.employeeService.selectedSchema$,
            this.employeeService.selectedBranches$
          ]).subscribe(([schema, branchIds]) => {
            if (schema) {
              this.fetchEmployees(schema, branchIds);
              this.fetchResignation(schema, branchIds);
  
            }
          });
  
        const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
  
       
        this.LoadUsers(selectedSchema);
        this.LoadLeaveApprovalLevel(selectedSchema);
  
        this.LoadDocType(selectedSchema);
        // this.LoadEmployee(selectedSchema);
        // this.LoadDocRequest(selectedSchema);
  
        
        }
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_employeeresignation', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_employeeresignation', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_employeeresignation', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_employeeresignation', groupPermissions);
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
  
      
      // LoadEmployee(selectedSchema: string) {
      //   this.leaveService.getemployeesMaster(selectedSchema).subscribe(
      //     (data: any) => {
      //       this.Employee = data;
          
      //       console.log('employee:', this.Employee);
      //     },
      //     (error: any) => {
      //       console.error('Error fetching Employee:', error);
      //     }
      //   );
      // }
  
      isLoading: boolean = false;
  
      fetchEmployees(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.employeeService.getemployeesMasterNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
                 this.Employee = data;
  
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
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
    
  
  
      
      // LoadDocRequest(selectedSchema: string) {
      //   this.leaveService.getEmpResignationRequest(selectedSchema).subscribe(
      //     (data: any) => {
      //       this.DocRequest = data;
          
      //       console.log('DocRequest:', this.DocRequest);
      //     },
      //     (error: any) => {
      //       console.error('Error fetching DocType:', error);
      //     }
      //   );
      // }
    
  
      fetchResignation(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.employeeService.getLateInEarlyOutNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
                 this.DocRequest = data;
  
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }
    
  
  
      SetLateInEarlyOut(): void {
        this.registerButtonClicked = true;
        // if (!this.name || !this.code || !this.valid_to) {
        //   return;
        // }
      
        const formData = new FormData();
        formData.append('date', this.date);
        // formData.append('status', this.status);
  
        formData.append('request_type', this.request_type);
  
        formData.append('reason', this.reason);
      
        // formData.append('employee', this.employee);

      this.employee.forEach((id: number) =>
      formData.append('employee', id.toString())
    );
    

        this.leaveService.CreateLateinEarlyOutRequest(formData).subscribe(
          (response) => {
            console.log('Latein Early Out successful', response);
             
    
    
            alert('Latein Early Out Request has been Sent');
    
            window.location.reload();
          },  
          (error) => {
            console.error('Added failed', error);
            alert('Enter all required fields!');
          }
        );
      }
  
  
  
  getEmployeeName(empId: number): string {
  const emp = this.Employee.find(e => e.id === empId);
  return emp ? emp.emp_code : 'Unknown';
}
  
  
  
  
      isPauseModalOpen: boolean = false;
      isResumeModalOpen: boolean = false;
  
      iscreateLoanApp: boolean = false;
  
  
  
  
  selectedLoanId: number | null = null;
  
  
  
  
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
      alert('No LateIn EarlyOut Request selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected LateIn EarlyOut Request ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteLateInEarlyOutReq(categoryId).subscribe(
          () => {
            console.log(' Request deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.DocRequest = this.DocRequest.filter(employee => employee.id !== categoryId);
               completed++;
                 if (completed === total) {
            alert(' Request deleted successfully');
            window.location.reload();
                 }
  
          },
          (error) => {
            console.error('Error deleting LateIn EarlyOut Request:', error);
              alert('Error deleting LateIn EarlyOut Request:' + error.statusText);
  
          }
        );
      });
    }
  }
  
  
  updateLateInEarlyOut(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editAsset.id) {
      alert('Missing schema or asset ID');
      return;
    }
  
    this.employeeService.updateLateInEarlyOutReq(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert(' Request updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
  (error) => {
    console.error('Error updating Request:', error);
  
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
  
  
      employeeSearch: string = '';
  allEmployeesSelected: boolean = false;
  
  toggleAllEmployees() {
  
    if (this.allEmployeesSelected) {
  
      this.employee = this.Employee.map((emp: any) => emp.id);
  
    } else {
  
      this.employee = [];
  
    }
  
  }
  
filterEmployees() {

  if (!this.employeeSearch) {
    return this.Employee; // 👈 full list
  }

  return this.Employee.filter((emp: any) =>
    emp.emp_code.toLowerCase().includes(this.employeeSearch.toLowerCase())
  );
}
    
  
  
  
  
  
  }


