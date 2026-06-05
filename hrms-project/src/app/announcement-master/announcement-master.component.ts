import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatSelect } from '@angular/material/select';
import { LeaveService } from '../leave-master/leave.service';
import { MatOption } from '@angular/material/core';
declare var $: any;

import { combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-announcement-master',
  templateUrl: './announcement-master.component.html',
  styleUrl: './announcement-master.component.css'
})
export class AnnouncementMasterComponent {


  private dataSubscription?: Subscription;

  @ViewChild('select') select: MatSelect | undefined;

  allSelected = false;


  @ViewChild('selectEmp') selectEmp: MatSelect | undefined;

  allSelectedEmp = false;

  Branches: any[] = []; // Array to store schema names

  @ViewChild('branchSelect') branchSelect!: MatSelect;
  @ViewChild('deptSelect') deptSelect!: MatSelect;
  @ViewChild('catSelect') catSelect!: MatSelect;
  @ViewChild('empSelect') empSelect!: MatSelect;
  @ViewChild('selectdes') selectdes!: MatSelect;


  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;


  title: any = '';
  message: any = '';
  schedule_at: any = '';
  expires_at: any = '';
  specific_employees: any = '';
  branches: any = '';
  categories: any = '';
  designations: any = '';
  departments: any = '';

  created_by: any = '';



  is_sticky: boolean = false;
  allow_comments: boolean = false;
  send_email: boolean = false;


  attachment: File | null = null;




  Users: any[] = [];
  LoanTypes: any[] = [];


  Employees: any[] = [];


  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = [];// Array to store schema names

  Departments: any[] = [];
  Categories: any[] = [];
  Designations: any[] = [];

  branch: number[] = [];
  department: number[] = [];
  category: number[] = [];
  designation: number[] = [];

  employee: number[] = [];

  Employee: any[] = [];


  FilteredEmployees: any[] = [];


  allSelectedBrach = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelecteddes = false;




  registerButtonClicked = false;


  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private leaveService: LeaveService,
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

      this.loadEmp();
       this.loadBranches();

    });

    this.loadCAtegory();


    this.loadDesignations();

    this.loadDEpartments();



    this.loadUsers();


    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      // this.LoadBranch(selectedSchema);

    }

    this.userId = this.sessionService.getUserId();

    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property
          this.created_by = this.userId; // Automatically set the owner to logged-in user ID

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


                    this.hasAddPermission = this.checkGroupPermission('add_announcement', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_announcement', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_announcement', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_announcement', groupPermissions);
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

   toggleAllSelectionBrach(): void {
      if (this.branchSelect) {
        this.branchSelect.options.forEach((item: MatOption) =>
          this.allSelectedBrach ? item.select() : item.deselect()
        );
      }
    }
  
  
    toggleAllSelectiondept(): void {
      if (this.deptSelect) {
        this.deptSelect.options.forEach((item: MatOption) =>
          this.allSelecteddept ? item.select() : item.deselect()
        );
      }
    }
  
    toggleAllSelectioncat(): void {
      if (this.catSelect) {
        this.catSelect.options.forEach((item: MatOption) =>
          this.allSelectedcat ? item.select() : item.deselect()
        );
      }
    }
  
  
    toggleAllSelectiondes(): void {
  
      if (this.selectdes) {
        this.selectdes.options.forEach((item: MatOption) =>
          this.allSelecteddes ? item.select() : item.deselect()
        );
      }
  
  
    }
  
  
    toggleAllSelectionEmp(): void {
      if (this.empSelect) {
        this.empSelect.options.forEach((item: MatOption) =>
          this.allSelectedEmp ? item.select() : item.deselect()
        );
      }
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



  isLoading: boolean = false;

  registerAnnouncement(): void {
    this.registerButtonClicked = true;
    this.isLoading = true;
    const selectedEmployees =
      this.FilteredEmployees
        .filter(x => x.selected)
        .map(x => x.id); // start loader ✅

    const companyData = {
      title: this.title,
      message: this.message,
      send_email: this.send_email,
      is_sticky: this.is_sticky,
      schedule_at: this.schedule_at,
      expires_at: this.expires_at,
      allow_comments: this.allow_comments,
      created_by: this.created_by,

      branch: this.selectedBranches,

      department: this.selectedDepartments,

      category: this.selectedCategories,

      designation: this.selectedDesignations,

      employee: selectedEmployees


    };

    this.employeeService.registerAnnouncement(companyData).subscribe(
      (response) => {
        this.isLoading = false; // stop loader ✅
        alert('Announcement Assigned');
        console.log('Registration successful', response);
        window.location.reload();
      },
      (error) => {
        this.isLoading = false; // stop loader even on error ✅
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



  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.attachment = file;
    }
  }

  //////////////////////////////////////////////////// Create Section ///////////////////////////////////////////////////////

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


  toggleSelectAllEmployees() {
    this.allSelecteds = !this.allSelecteds;
    this.LoanTypes.forEach(employee => employee.selected = this.allSelecteds);

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
    ).fill(0).map((_x, i) => i + 1);

  }



  // loadLoanTypes(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getAnnouncement(selectedSchema).subscribe(
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



  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.employeeService.getAnnouncementNew(schema, branchIds).subscribe({
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





  showEditBtn: boolean = false;

  EditShowButtons() {
    this.showEditBtn = !this.showEditBtn;
  }


  Delete: boolean = false;
  allSelecteds: boolean = false;

  toggleCheckboxes() {
    this.Delete = !this.Delete;
  }

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited

  openEditModal(asset: any): void {
    this.editAsset = {
      ...asset,

      emp_dept_id: asset.emp_dept_id || [],
      emp_desgntn_id: asset.emp_desgntn_id || [],
      emp_ctgry_id: asset.emp_ctgry_id || [],

      branches: asset.branches || [],
      specific_employees: asset.specific_employees || []


    }; // copy asset data
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }


  deleteSelectedAssetType() {
    const selectedEmployeeIds = this.LoanTypes
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No Announcement selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Announcement ?')) {

      let total = selectedEmployeeIds.length;
      let completed = 0;
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteAnnouncement(categoryId).subscribe(
          () => {
            console.log('Announcement deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);
            completed++;
            if (completed === total) {
              alert(' Announcement  deleted successfully');
              window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Announcement:', error);
            alert('Error deleting Announcement: ' + error.statusText);
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

    this.employeeService.updateAnnouncement(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert(' Announcement  updated successfully!');
        this.closeEditModal();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating Announcement:', error);

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
      return this.Employees;
    }

    return this.Employees.filter((emp: any) =>
      emp.emp_code.toLowerCase().includes(this.employeeSearch.toLowerCase())
    );

  }


  getEmployeeNames(employeeIds: number[]): string {
    if (!employeeIds?.length) return '-';

    return this.Employees
      .filter(emp => employeeIds.includes(emp.id))
      .map(emp => emp.emp_code)
      .join(', ');
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
