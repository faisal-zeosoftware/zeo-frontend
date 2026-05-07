import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';

import {combineLatest, Subscription } from 'rxjs';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-compensatory-leave',
  templateUrl: './compensatory-leave.component.html',
  styleUrl: './compensatory-leave.component.css'
})
export class CompensatoryLeaveComponent {

    private dataSubscription?: Subscription;

  
  request_type:any='';
  employee:any='';
  request_date:any='';
  work_date:any='';

  reason:any='';

  transaction_type:any='';
  days:any='';

  registerButtonClicked = false;
  Employees: any[] = [];

  compTransactions: any[] = [];


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
    private employeeService: EmployeeService,
    private DesignationService: DesignationService,
    
    ) {}

    ngOnInit(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


      this.LoadEmployee(selectedSchema);
   
      
      }

            // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);
  
      }
    });


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

               
                this.hasAddPermission = this.checkGroupPermission('add_compensatoryleaverequest', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_compensatoryleaverequest', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_compensatoryleaverequest', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_compensatoryleaverequest', groupPermissions);
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
    //   const requiredPermission = 'add_compensatoryleavetransaction' ||'change_compensatoryleavetransaction' 
    //   ||'delete_compensatoryleavetransaction' ||'view_compensatoryleavetransaction';
      
      
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
      

    LoadEmployee(selectedSchema: string) {
      this.leaveService.getemployeesMaster(selectedSchema).subscribe(
        (data: any) => {
          this.Employees = data;
        
          console.log('employee:', this.Employees);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }

              isLoading: boolean = false;


          fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
            this.isLoading = true;
            this.leaveService.getCompLeave(schema, branchIds).subscribe({
              next: (data: any) => {
                // Filter active employees
                     this.compTransactions = data;
          
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Fetch error:', err);
                this.isLoading = false;
              }
            });
          }

    

    requestCompansatoryLeave(): void {
      this.registerButtonClicked = true;
      // if (!this.name || !this.code || !this.valid_to) {
      //   return;
      // }
    
      const formData = new FormData();
      formData.append('request_type', this.request_type);
      formData.append('employee', this.employee);
      formData.append('work_date', this.work_date);
      formData.append('reason', this.reason);
     
  
     
  
      
    
    
      this.leaveService.requestCompLeaveAdmin(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Compensatory Leave has been Sent');
  
          window.location.reload();
        },  
        (error) => {
          console.error('Added failed', error);
          alert('Enter all required fields!');
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
  this.compTransactions.forEach(employee => employee.selected = this.allSelecteds);
  
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


    
  deleteSelectedCombLeave() { 
    const selectedEmployeeIds = this.compTransactions
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No Compensatory Leave selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected Compensatory Leave ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
      selectedEmployeeIds.forEach(categoryId => {
        this.leaveService.deleteCompLeave(categoryId).subscribe(
          () => {
            console.log('Compensatory Leave deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.compTransactions = this.compTransactions.filter(employee => employee.id !== categoryId);
  
             completed++;
            if (completed === total) { 
            alert(' Compensatory Leave deleted successfully');
            window.location.reload();
            }
  
          },
          (error) => {
            console.error('Error deleting Compensatory Leave :', error);
             alert('Error deleting Compensatory Leave : ' + error.statusText);
          }
        );
      });
    }
  }
  
  
  updateCombLeave(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editAsset.id) {
      alert('Missing schema or asset ID');
      return;
    }
  
    this.leaveService.updateCompLeave(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert('Compensatory Leave updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
  (error) => {
    console.error('Error updating Compensatory Leave:', error);
  
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
