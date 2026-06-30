import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';

import { combineLatest, Subscription } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatOption } from '@angular/material/core';
import { CatogaryService } from '../catogary-master/catogary.service';
import { CountryService } from '../country.service';

@Component({
  selector: 'app-attendance-validation-policy',
  templateUrl: './attendance-validation-policy.component.html',
  styleUrl: './attendance-validation-policy.component.css'
})

export class AttendanceValidationPolicyComponent {


  @ViewChild('selectBrach') selectBrach: MatSelect | undefined;
  private dataSubscription?: Subscription;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;


  name: any = '';
  enable_geofencing: boolean = false;
  enable_face_recognition: boolean = false;
  enable_barcode_verification: boolean = false;
  enable_photo_capture: boolean = false;
  is_active: boolean = false;


  branch: number[] = [];

  branches: any[] = [];


  Branches: any[] = [];
  Departments: any[] = [];
  Categories: any[] = [];
  Employee: any[] = [];
  Designations: any[] = [];

  FilteredEmployees: any[] = [];

  allSelectedbR = false;
  allSelectedBrach = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelectedEmp = false;
  allSelecteddes = false;



  Users: any[] = [];
  LoanTypes: any[] = [];




  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow: boolean = false;



  registerButtonClicked = false;

  @ViewChild('select') select: MatSelect | undefined;

  @ViewChild('selectDept') selectDept: MatSelect | undefined;

  @ViewChild('selectBrach') selectBranch: MatSelect | undefined;

  @ViewChild('selectCat') selectCat: MatSelect | undefined;
  @ViewChild('selectEmp') selectEmp: MatSelect | undefined;
  @ViewChild('selectDes') selectDes: MatSelect | undefined;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private DepartmentServiceService: DepartmentServiceService,
    private categoryService: CatogaryService,
    private CountryService: CountryService





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
    this.loadUsers();
    this.loadDeparmentBranch();
    this.loadBranches();
    this.loadEmp();
    this.loadDEpartments();
    this.loadCAtegory();
    this.loadDesignations();
    this.loadValidationPolicies();
    // this.loadLAssetType();



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


                    this.hasAddPermission = this.checkGroupPermission('add_assettype', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_assettype', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_assettype', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_assettype', groupPermissions);
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


  loadUsers(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.userService.getSChemaUsers(selectedSchema).subscribe(
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

  loadEmp(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


    if (selectedSchema) {
      this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Employee = result;
          this.FilteredEmployees = result;
          this.currentPage = 1;

          this.updatePagination();
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }



  loadBranches(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();

    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any[]) => {

          const sidebarSelectedIds: number[] =
            JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

          if (sidebarSelectedIds.length > 0) {
            this.branches = result.filter(branch =>
              sidebarSelectedIds.includes(branch.id)
            );
          } else {
            this.branches = result;
          }

          // ✅ FIX: DO NOT overwrite array
          if (this.branches.length === 1) {
            this.branch = [this.branches[0].id]; // auto select
          }

          console.log('Filtered branches:', this.branches);

          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }

  loadValidationPolicies() {
  this.CountryService.getAttendanceValidationPolicy().subscribe({
    next: (res: any) => {
      console.log("Validation Policies", res);

      this.LoanTypes = res;
    },
    error: err => {
      console.log(err);
    }
  });
}




  CreateValidationPolicy(): void {
    const selectedEmployeeIds =
      this.FilteredEmployees
        .filter(x => x.selected)
        .map(x => x.id);


  const companyData = {
  name: this.name,
  branch: this.selectedBranches,
  department: this.selectedDepartments,
  category: this.selectedCategories,
  designation: this.selectedDesignations,
  employee: selectedEmployeeIds,
  enable_geofencing: this.enable_geofencing,
  enable_face_recognition: this.enable_face_recognition,
  enable_barcode_verification: this.enable_barcode_verification,
  enable_photo_capture: this.enable_photo_capture,
  is_active: this.is_active
};


    this.CountryService.registervalidationpolicy(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);

        alert('validation policy Added ');
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





  // loadLAssetType(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getAssetType(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.LoanTypes = result;
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
    this.CountryService.getvalidationpolicyNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.LoanTypes = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }




  iscreateLoanApp: boolean = false;




  openPopus(): void {
    this.iscreateLoanApp = true;

    // reset branch
    this.branch = [];

    // ✅ Auto select first branch
    if (this.branches && this.branches.length > 0) {

      this.branch = [this.branches[0].id];

      this.allSelectedBrach = false;

    }

  }

  closeapplicationModal(): void {
    this.iscreateLoanApp = false;

  }

  selectedBranches: number[] = [];
  selectedDepartments: number[] = [];
  selectedCategories: number[] = [];
  selectedDesignations: number[] = [];

  allEmployeesSelected = false;


  applyEmployeeFilter(): void {

    this.FilteredEmployees = this.Employee.filter(emp => {

      const branchMatch =
        this.selectedBranches.length === 0 ||
        this.selectedBranches.some(id =>
          emp.emp_branch_id === this.getBranchName(id)
        );

      const deptMatch =
        this.selectedDepartments.length === 0 ||
        this.selectedDepartments.some(id =>
          emp.emp_dept_id === this.getDepartmentName(id)
        );

      const categoryMatch =
        this.selectedCategories.length === 0 ||
        this.selectedCategories.some(id =>
          emp.emp_ctgry_id === this.getCategoryName(id)
        );

      const designationMatch =
        this.selectedDesignations.length === 0 ||
        this.selectedDesignations.some(id =>
          emp.emp_desgntn_id === this.getDesignationName(id)
        );

      return (
        branchMatch &&
        deptMatch &&
        categoryMatch &&
        designationMatch
      );

    });
    this.currentPage = 1;

    this.updatePagination();


  }

  getBranchName(id: number): string {

    const item = this.branches.find((x: { id: number; }) => x.id == id);

    return item ? item.branch_name : '';

  }

  getDepartmentName(id: number): string {

    const item = this.Departments.find(x => x.id == id);

    return item ? item.dept_name : '';

  }

  getCategoryName(id: number): string {

    const item = this.Categories.find(x => x.id == id);

    return item ? item.ctgry_title : '';

  }

  getDesignationName(id: number): string {

    const item = this.Designations.find(x => x.id == id);

    return item ? item.desgntn_job_title : '';

  }


  toggleSelectAllEmployees(): void {

    this.FilteredEmployees.forEach(emp => {
      emp.selected = this.allEmployeesSelected;
    });

  }

  toggleAllBranches(): void {

    if (
      this.selectedBranches.length ===
      this.branches.length
    ) {

      this.selectedBranches = [];

    } else {

      this.selectedBranches =
        this.branches.map((x: { id: any; }) => x.id);

    }

    this.applyEmployeeFilter();
  }



  isAllBranchesSelected(): boolean {

    return (
      this.branches.length > 0 &&
      this.selectedBranches.length ===
      this.branches.length
    );

  }


  isSomeBranchesSelected(): boolean {

    return (
      this.selectedBranches.length > 0 &&
      this.selectedBranches.length <
      this.branches.length
    );

  }


  toggleAllDepartments(): void {

    if (
      this.selectedDepartments.length ===
      this.Departments.length
    ) {

      this.selectedDepartments = [];

    } else {

      this.selectedDepartments =
        this.Departments.map(x => x.id);

    }

    this.applyEmployeeFilter();

  }

  isAllDepartmentsSelected(): boolean {

    return (
      this.Departments.length > 0 &&
      this.selectedDepartments.length ===
      this.Departments.length
    );

  }

  isSomeDepartmentsSelected(): boolean {

    return (
      this.selectedDepartments.length > 0 &&
      this.selectedDepartments.length <
      this.Departments.length
    );



  }



  // select all function

  toggleAllCategories(): void {

    if (
      this.selectedCategories.length ===
      this.Categories.length
    ) {

      this.selectedCategories = [];

    } else {

      this.selectedCategories =
        this.Categories.map(x => x.id);

    }

    this.applyEmployeeFilter();

  }

  isAllCategoriesSelected(): boolean {

    return (
      this.Categories.length > 0 &&
      this.selectedCategories.length ===
      this.Categories.length
    );

  }

  isSomeCategoriesSelected(): boolean {

    return (
      this.selectedCategories.length > 0 &&
      this.selectedCategories.length <
      this.Categories.length
    );

  }

  toggleAllDesignations(): void {

    if (
      this.selectedDesignations.length ===
      this.Designations.length
    ) {

      this.selectedDesignations = [];

    } else {

      this.selectedDesignations =
        this.Designations.map(x => x.id);

    }

    this.applyEmployeeFilter();

  }

  isAllDesignationsSelected(): boolean {

    return (
      this.Designations.length > 0 &&
      this.selectedDesignations.length ===
      this.Designations.length
    );

  }

  isSomeDesignationsSelected(): boolean {

    return (
      this.selectedDesignations.length > 0 &&
      this.selectedDesignations.length <
      this.Designations.length
    );

  }



  currentPage: number = 1;
  itemsPerPage: number = 3;
  pagedEmployees: any[] = [];


  updatePagination(): void {

    const startIndex =
      (this.currentPage - 1) * this.itemsPerPage;

    const endIndex =
      startIndex + this.itemsPerPage;

    this.pagedEmployees =
      this.FilteredEmployees.slice(
        startIndex,
        endIndex
      );

  }


  get totalPages(): number {

    return Math.ceil(
      this.FilteredEmployees.length /
      this.itemsPerPage
    );

  }



  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

      this.updatePagination();

    }

  }



  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

      this.updatePagination();

    }

  }



  goToPage(page: number): void {

    this.currentPage = page;

    this.updatePagination();

  }



  get pageNumbers(): number[] {

    return Array(
      this.totalPages
    ).fill(0).map((x, i) => i + 1);

  }


  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelectedbR) {

        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
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

  toggleAllSelectionBrach(): void {
    if (this.selectBrach) {
      if (this.allSelectedBrach) {
        this.selectBrach.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectBrach.options.forEach((item: MatOption) => item.deselect());
      }
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


  toggleAllSelectionEmp(): void {
    if (this.selectEmp) {
      if (this.allSelectedEmp) {
        this.selectEmp.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectEmp.options.forEach((item: MatOption) => item.deselect());
      }
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





  openEditPopuss(categoryId: number): void {

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


  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited

openEditModal(policy: any): void {

  this.editAsset = { ...policy };

  this.selectedBranches = [...(policy.branch || [])];
  this.selectedDepartments = [...(policy.department || [])];
  this.selectedCategories = [...(policy.category || [])];
  this.selectedDesignations = [...(policy.designation || [])];

  // Reset employee selection
  this.Employee.forEach(emp => emp.selected = false);

  if (policy.employee) {
    this.Employee.forEach(emp => {
      emp.selected = policy.employee.includes(emp.id);
    });
  }

  this.applyEmployeeFilter();

  this.isEditModalOpen = true;
}

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


updateValidationPolicy() {

  const selectedEmployeeIds =
    this.Employee
      .filter(x => x.selected)
      .map(x => x.id);

  const payload = {

    name: this.editAsset.name,

    branch: this.selectedBranches,

    department: this.selectedDepartments,

    category: this.selectedCategories,

    designation: this.selectedDesignations,

    employee: selectedEmployeeIds,

    enable_geofencing: this.editAsset.enable_geofencing,

    enable_face_recognition: this.editAsset.enable_face_recognition,

    enable_barcode_verification:
      this.editAsset.enable_barcode_verification,

    enable_photo_capture:
      this.editAsset.enable_photo_capture,

    is_active:
      this.editAsset.is_active
  };

  this.CountryService
      .updateAttendanceValidationPolicy(
          this.editAsset.id,
          payload
      )
      .subscribe({

        next: () => {

          alert("Validation Policy Updated");

          this.closeEditModal();

          this.loadValidationPolicies();

          window.location.reload();

        },

        error: err => {

          console.log(err);

          alert("Update Failed");

        }

      });

}


  deleteSelectedValidationPolicy() {
    const selectedEmployeeIds = this.LoanTypes
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No Validation Policy selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Validation Policy?')) {

      let total = selectedEmployeeIds.length;
      let completed = 0;


      selectedEmployeeIds.forEach(categoryId => {
        this.CountryService.deleteAttendanceValidationPolicy(categoryId).subscribe(
          () => {
            console.log('Validation Policy deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);
            completed++;
            if (completed === total) {
              alert(' Validation Policy deleted successfully');
              window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Validation Policy:', error);
            alert('Error deleting Validation Polciy: ' + error.statusText);
          }
        );
      });
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
          // If sidebar is empty, you might want to show all, or show none. 
          // Usually, we show only the selected ones:
          if (sidebarSelectedIds.length > 0) {
            this.branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.branches = result; // Fallback: show all if nothing is selected in sidebar
          }
          // Inside the subscribe block of loadDeparmentBranch
          if (this.branches.length === 1) {
            this.branch = this.branches[0].id;
          }

          console.log('Filtered branches for selection:', this.branches);
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }


  mapBranchesNameToId() {
    if (!this.branches || !Array.isArray(this.editAsset?.branch)) return;

    this.editAsset.branch = this.branches
      .filter((b: any) => this.editAsset.branch.includes(b.branch_name))
      .map((b: any) => b.id);

    console.log('Mapped branch IDs:', this.editAsset.branch);
  }







}
