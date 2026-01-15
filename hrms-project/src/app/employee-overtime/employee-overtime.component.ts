import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-employee-overtime',
  templateUrl: './employee-overtime.component.html',
  styleUrl: './employee-overtime.component.css'
})
export class EmployeeOvertimeComponent {





  registerButtonClicked: boolean = false;


  date: any = '';
  hours: any = '';
  rate_multiplier: any = '';
  employee: any = '';

  approved_by: any = '';

  created_by: any = '';
  approved: boolean = false;



  LeaveTypes: any[] = [];
  Employees: any[] = [];
  LeaveBalances: any[] = [];



  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names


  selectedFile: File | null = null;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DesignationService: DesignationService,
    private employeeService: EmployeeService,

  ) { }

  ngOnInit(): void {
    this.LoadEmployee();
    this.LoadUsers();
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {


      this.LoadLeavetype(selectedSchema);
      this.LoadUsers();

      this.LoadLeavebalance(selectedSchema);



    }

    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property

          this.created_by = this.userId;
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


                    this.hasAddPermission = this.checkGroupPermission('add_employeeovertime', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_employeeovertime', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_employeeovertime', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_employeeovertime', groupPermissions);
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
          console.log('scehmas-de', userData)
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




  LoadLeavetype(selectedSchema: string) {
    this.leaveService.getLeaveType(selectedSchema).subscribe(
      (data: any) => {
        this.LeaveTypes = data;

        console.log('employee:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }




  LoadEmployee(callback?: Function) {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getemployeesMaster(selectedSchema).subscribe(
        (result: any) => {
          this.Employees = result;
          console.log(' fetching Employees:');
             if (callback) callback();

        },
        (error) => {
          console.error('Error fetching Employees:', error);
        }
      );
    }

  }

  mapEmployeeNameToId() {
  if (!this.Employees || !this.editAsset?.employee) return;

  const emp = this.Employees.find(
    (e: any) => e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}





  LoadUsers(callback?: Function) {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.leaveService.getApproverUsers(selectedSchema).subscribe(
      (data: any) => {
        this.Users = data;

        console.log('employee:', this.LeaveTypes);
             if (callback) callback();
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }
}

  mapUsersNameToId() {
    
  if (!this.Users || !this.editAsset?.approved_by) return;

  const use = this.Users.find(
    (u: any) => u.username === this.editAsset.approved_by
  );

  if (use) {
    this.editAsset.approved_by = use.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.approved_by);
}





  EmployeeOvertime(): void {
    this.registerButtonClicked = true;
    // if (!this.name || !this.code || !this.valid_to) {
    //   return;
    // }

    const formData = new FormData();
    formData.append('date', this.date);
    formData.append('hours', this.hours);




    // formData.append('rate_multiplier', this.rate_multiplier);
    formData.append('employee', this.employee);
    formData.append('approved_by', this.approved_by);


    formData.append('created_by', this.created_by);

    formData.append('approved', this.approved.toString());





    this.leaveService.CreateEmployeeOvertime(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);


        alert('Employee Overtime has been Created');

        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
        alert('Enter all required fields!');
      }
    );
  }


  LoadLeavebalance(selectedSchema: string) {
    this.leaveService.getEmployeeOvertime(selectedSchema).subscribe(
      (data: any) => {
        this.LeaveBalances = data;

        console.log('employee:', this.LeaveTypes);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }



  // File selection
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    console.log('Selected file:', this.selectedFile);
  }









  iscreateLoanApp: boolean = false;




  openPopus(): void {
    this.iscreateLoanApp = true;

  }

  closeapplicationModal(): void {
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

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited

  openEditModal(asset: any): void {
    this.editAsset = { ...asset }; // copy asset data
    this.isEditModalOpen = true;

    this.mapEmployeeNameToId();
    this.mapUsersNameToId();
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


  deleteSelectedAssetType() {
    const selectedEmployeeIds = this.LeaveBalances
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No States selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Employee Overtime ?')) {
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteOvertime(categoryId).subscribe(
          () => {
            console.log(' Document Type deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.LeaveBalances = this.LeaveBalances.filter(employee => employee.id !== categoryId);
            alert(' Employee Overtime  deleted successfully');
            window.location.reload();

          },
          (error) => {
            console.error('Error deleting Loan Types:', error);
            alert(error)
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

    this.employeeService.updateOvertime(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert(' Employee Overtime  updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
(error) => {
  console.error('Error updating Employee Overtime:', error);

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
