import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';

import { combineLatest, Subscription } from 'rxjs';
import { DepartmentService } from '../department-report/department.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { CountryService } from '../country.service';

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.css'
})
export class NotificationSettingsComponent {


  private dataSubscription?: Subscription;
  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectCat') selectCat: MatSelect | undefined;
  @ViewChild('selectDes') selectDes: MatSelect | undefined;
  @ViewChild('selectDept') selectDept: MatSelect | undefined;
  @ViewChild('selectBrach') selectBrach: MatSelect | undefined;

  allSelected = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelecteddes = false;

  Departments: any[] = [];
  Categories: any[] = [];
  Designations: any[] = [];



  registerButtonClicked: boolean = false;


  days_before_expiry: any = '';
  days_after_expiry: any = '';
  branches: any = '';
  categories: any = '';
  designations: any = '';
  departments: any = '';
  notify_users: any = '';
    document_type:any='';

  department: number[] = [];
designation: number[] = [];
category: number[] = [];
branch: number[] = [];


  created_by: any = '';

  DocumentTypes: any[] = [];

  LeaveTypes: any[] = [];
  Employees: any[] = [];
  LeaveBalances: any[] = [];

  NotSettings: any[] = [];

  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  Branches: any[] = []; // Array to store schema names

  send_email: boolean = false;



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    private DesignationService: DesignationService,
    private countryService: CountryService,
    private DepartmentServiceService: DepartmentServiceService,
    private categoryService: CatogaryService,


  ) { }

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


    // Listen for sidebar changes so the dropdown updates instantly
    this.employeeService.selectedBranches$.subscribe(ids => {
      this.loadDeparmentBranch();
      // this.loadEmp();
    });




    // this.loadLoanTypes();
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {


      this.LoadUsers();
      this.loadDocumentType();
      this.loadCAtegory();


      this.loadDesignations();

      this.loadDEpartments();
      // this.LoadBeanch();



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


                    this.hasAddPermission = this.checkGroupPermission('add_notificationsettings', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_notificationsettings', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_notificationsettings', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_notificationsettings', groupPermissions);
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


  // loadLoanTypes(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.leaveService.getNotificationSettings(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.NotSettings = result;
  //         console.log(' fetching Loantypes:');

  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  //   }


  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveService.getNotificationSettingsNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.NotSettings = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }






  LoadUsers(callback?: Function) {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.leaveService.getApproverUsers(selectedSchema).subscribe(
        (data: any) => {
          this.Users = data;
          if (callback) callback();
          console.log('employee:', this.LeaveTypes);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }
  }

  mapUsersNameToId() {

    if (!this.Users || !this.editAsset?.notify_users) return;

    let values = this.editAsset.notify_users;

    // --- Case A: Already an array of IDs ---
    if (Array.isArray(values) && typeof values[0] === 'number') {
      return;
    }

    // --- Case B: Convert comma string → array ---
    if (typeof values === "string") {
      values = values.split(",").map((x: string) => x.trim());
    }

    // --- Case C: Ensure it's array ---
    if (!Array.isArray(values)) {
      values = [values];
    }

    // Map each name → ID
    const mappedIds = values
      .map((name: string) => {
        const user = this.Users.find(
          (u: any) => u.username?.trim() === name?.trim()
        );
        return user ? user.id : null;
      })
      .filter((id: any) => id !== null);

    this.editAsset.notify_users = mappedIds;

    console.log("Mapped notify_users:", this.editAsset.notify_users);
  }


    loadDocumentType(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

 console.log('schemastore',selectedSchema )
 // Check if selectedSchema is available
 if (selectedSchema) {
    this.countryService.getDocument(selectedSchema).subscribe(
      (result: any) => {
        this.DocumentTypes = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
 }
  }



  //   LoadBeanch(callback?: Function) {
  //       const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //     console.log('schemastore',selectedSchema )
  //     // Check if selectedSchema is available
  //     if (selectedSchema) {
  //     this.leaveService.getBranches(selectedSchema).subscribe(
  //       (data: any) => {
  //         this.Branches = data;

  //         console.log('employee:', this.Branches);
  //           if (callback) callback();

  //       },
  //       (error: any) => {
  //         console.error('Error fetching categories:', error);
  //       }
  //     );
  //   }
  // }





  mapBranchesNameToId() {
    if (!this.Branches || !this.editAsset?.branch) return;

    // Case A: backend returns single ID
    if (typeof this.editAsset.branch === 'number') {
      this.editAsset.branch = [this.editAsset.branch];
      return;
    }

    // Case B: backend returns single NAME
    if (typeof this.editAsset.branch === 'string') {
      const found = this.Branches.find(b => b.branch_name === this.editAsset.branch);
      this.editAsset.branch = found ? [found.id] : [];
      return;
    }

    // Case C: backend returns an array of names
    if (Array.isArray(this.editAsset.branch)) {
      this.editAsset.branch = this.Branches
        .filter(b => this.editAsset.branch.includes(b.branch_name))
        .map(b => b.id);
    }

    console.log("Mapped branch IDs:", this.editAsset.branch);
  }





  registerUserAssignedPermission(): void {
    this.registerButtonClicked = true;

const companyData = {
  days_before_expiry: this.days_before_expiry,
  days_after_expiry: this.days_after_expiry,
  send_email: this.send_email,

  branch: this.branch || [],
  Department: this.department || [],
  Category: this.category || [],
  Designation: this.designation || [],
  document_type:this.document_type || [],
  notify_users: this.notify_users || [],
  created_by: this.created_by,
};

    this.leaveService.registerEmailNotification(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Notification settings has been Assigned');
        window.location.reload();
      },
      (error) => {
        console.error('Registration failed', error);

        // Check if the error response contains a profile message
        if (error.error && error.error.profile) {
          alert(error.error.profile[0]); // Show the backend error message
        } else {
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
      }
    );
  }

  
isAllBranchesSelected(): boolean {
  return this.branch?.length === this.Branches?.length;
}

isSomeBranchesSelected(): boolean {
  return this.branch?.length > 0 &&
         this.branch?.length < this.Branches?.length;
}

toggleAllBranches(): void {
  if (this.isAllBranchesSelected()) {
    this.branch = [];
  } else {
    this.branch = this.Branches.map(x => x.id);
  }
}

isAllDepartmentsSelected(): boolean {
  return this.department?.length === this.Departments?.length;
}

isSomeDepartmentsSelected(): boolean {
  return this.department?.length > 0 &&
         this.department?.length < this.Departments?.length;
}

toggleAllDepartments(): void {
  if (this.isAllDepartmentsSelected()) {
    this.department = [];
  } else {
    this.department = this.Departments.map(x => x.id);
  }
}

isAllCategoriesSelected(): boolean {
  return this.category?.length === this.Categories?.length;
}

isSomeCategoriesSelected(): boolean {
  return this.category?.length > 0 &&
         this.category?.length < this.Categories?.length;
}

toggleAllCategories(): void {
  if (this.isAllCategoriesSelected()) {
    this.category = [];
  } else {
    this.category = this.Categories.map(x => x.id);
  }
}

isAllDesignationsSelected(): boolean {
  return this.designation?.length === this.Designations?.length;
}

isSomeDesignationsSelected(): boolean {
  return this.designation?.length > 0 &&
         this.designation?.length < this.Designations?.length;
}

toggleAllDesignations(): void {
  if (this.isAllDesignationsSelected()) {
    this.designation = [];
  } else {
    this.designation = this.Designations.map(x => x.id);
  }
}






  // Variable to hold the selected document for editing
  selectedDoc: any = {};
  isDocumentnumbereditModalOpen: boolean = false;


  openEditDocModal(state: any): void {
    // Clone the document (to avoid modifying the original before saving)
    this.selectedDoc = { ...state };
    this.isDocumentnumbereditModalOpen = true;
  }



  closeEditDocModal(): void {
    this.isDocumentnumbereditModalOpen = false;
  }

  // Method to update the document number via API
  updateDocumentNumber(): void {
    // Optionally convert the date input to a year integer if needed:
    // Example: this.selectedDoc.year = new Date(this.selectedDoc.year).getFullYear();

    this.leaveService.updateNot(this.selectedDoc.id, this.selectedDoc).subscribe(
      (response) => {
        console.log('Document type updated successfully', response);
        alert(' Notification updated successfully.');
        // Optionally, refresh your list or reload the page
        this.closeEditDocModal();
        // re-fetch the list if needed
        window.location.reload();
      },
      (error) => {
        console.error('Error updating document type', error);
        const errorMessage = error.error?.error || 'Error updating document type.';
        alert(errorMessage);
      }
    );
  }



  deleteSelectedDocNotify() {
    const selectedIds = this.NotSettings
      .filter(item => item.selected)
      .map(item => item.id);

    if (selectedIds.length === 0) {
      alert('No Document Notification selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Document Notification ?')) {

      let total = selectedIds.length;
      let completed = 0;

      selectedIds.forEach(id => {
        this.employeeService.deleteDocumentNotify(id).subscribe(
          () => {
            this.NotSettings = this.NotSettings.filter(item => item.id !== id);
            completed++;
            if (completed === total) {
              alert('Document Notification deleted successfully');
            }
          },
          (error) => {
            alert('Error deleting Document Notification');
          }
        );
      });
    }
  }






  // deleteDoc(permissionId: number): void {
  //   if (confirm('Are you sure you want to delete this Notification Setting?')) {
  //     const selectedSchema = this.authService.getSelectedSchema();
  //     if (selectedSchema) {
  //     this.leaveService.deleteNotification(permissionId,selectedSchema).subscribe(
  //       (response) => {
  //         console.log('Document type deleted successfully', response);
  //         alert('Notification deleted successfully');

  //     const selectedSchema = this.authService.getSelectedSchema();
  //     if (!selectedSchema) {
  //       console.error('No schema selected.');
  //       return;
  //     }
  //     this.loadLoanTypes();
  //         // this.fetchDesignations(selectedSchema); // Refresh the list after deletion
  //       },
  //       (error) => {
  //         console.error('Error deleting Document type:', error);
  //         alert('Failed to delete permission');
  //       }
  //     );
  //   }
  //   }
  // }




  iscreateLoanApp: boolean = false;




  openPopus(): void {
    this.iscreateLoanApp = true;

    this.branches = [];

    // ✅ Auto select first branch
    if (this.Branches && this.Branches.length > 0) {

      this.branches = [this.Branches[0].id];

    }

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
    this.NotSettings.forEach(employee => employee.selected = this.allSelecteds);

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


    this.LoadUsers(() => {

      this.mapUsersNameToId();
    });





    this.mapBranchesNameToId();
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


  deleteSelectedAssetType() {
    const selectedEmployeeIds = this.NotSettings
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No Announcement selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Document Notification Setting ?')) {
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteNotSetting(categoryId).subscribe(
          () => {
            console.log(' Document Numbering deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.NotSettings = this.NotSettings.filter(employee => employee.id !== categoryId);
            alert(' Document Notification Setting  deleted successfully');
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

    this.employeeService.updateNotSetting(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert(' Document Notification Setting  updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating Doc Notification:', error);

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



  filterEmployees() {

    if (!this.employeeSearch) {
      return this.Users;
    }

    return this.Users.filter((deparmentsec: any) =>
      deparmentsec.username.toLowerCase().includes(this.employeeSearch.toLowerCase())
    );

  }

  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {

        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  loadDeparmentBranch(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();

    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any[]) => {
          // 1. Get the sidebar selected IDs from localStorage
          const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

          // 2. Filter the API result to only include branches selected in the sidebar

          // Usually, we show only the selected ones:
          if (sidebarSelectedIds.length > 0) {
            this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.Branches = result; // Fallback: show all if nothing is selected in sidebar
          }
          // Inside the subscribe block of loadDeparmentBranch
          if (this.Branches.length === 1) {
            this.branches = this.Branches[0].id;
          }

          console.log('Filtered branches for selection:', this.Branches);
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }

  toggleAllSelectiondept(): void {
    if (this.selectDept) {
      if (this.allSelecteddept) {
        this.selectDept.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDept.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }
  loadDEpartments(callback?: Function): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.DepartmentServiceService.getDepartmentsMasterNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Departments = result;
          console.log(' fetching Companies:');
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  toggleAllSelectionDes(): void {
    if (this.selectDes) {
      if (this.allSelecteddes) {
        this.selectDes.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectDes.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  loadDesignations(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getDesignations(selectedSchema).subscribe(
        (result: any) => {
          this.Designations = result;
          console.log(' fetching Companies:');

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  toggleAllSelectioncat(): void {
    if (this.selectCat) {
      if (this.allSelectedcat) {
        this.selectCat.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectCat.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  loadCAtegory(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.categoryService.getcatogarys(selectedSchema).subscribe(
        (result: any) => {
          this.Categories = result;
          console.log(' fetching Companies:');

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  getBranchNames(branchIds: number[]): string {
    if (!branchIds?.length) return '-';

    return this.Branches
      .filter(branch => branchIds.includes(branch.id))
      .map(branch => branch.branch_name)
      .join(', ');
  }

  getDepartmentNames(deptIds: number[]): string {
    if (!deptIds?.length) return '-';

    return this.Departments
      .filter(dept => deptIds.includes(dept.id))
      .map(dept => dept.dept_name)
      .join(', ');
  }

  getDesignationNames(desIds: number[]): string {
    if (!desIds?.length) return '-';

    return this.Designations
      .filter(des => desIds.includes(des.id))
      .map(des => des.desgntn_job_title)
      .join(', ');
  }

  getCategoryNames(catIds: number[]): string {
    if (!catIds?.length) return '-';

    return this.Categories
      .filter(cat => catIds.includes(cat.id))
      .map(cat => cat.ctgry_title)
      .join(', ');
  }





}
