import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { CountryService } from '../country.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import {combineLatest, Subscription } from 'rxjs';

import { environment } from '../../environments/environment';
declare var $: any;

@Component({
  selector: 'app-shift-employee',
  templateUrl: './shift-employee.component.html',
  styleUrl: './shift-employee.component.css'
})
export class ShiftEmployeeComponent {

  private apiUrl = `${environment.apiBaseUrl}`;
  private dataSubscription?: Subscription;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  allShiftsSelected: boolean = false; 

  name: any = '';
  Patern_name: any = '';
  description: any = '';
  created_by: any = '';

  monday_shift: any = '';
  tuesday_shift: any = '';
  wednesday_shift: any = '';
  thursday_shift: any = '';
  friday_shift: any = '';
  saturday_shift: any = '';
  sunday_shift: any = '';

  Users: any[] = [];
  Shifts: any[] = [];
  ShiftsPattern: any[] = [];

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = [];
  use_common_workflow: boolean = false;
  registerButtonClicked = false;

  Branches: any[] = [];
  Departments: any[] = [];
  Categories: any[] = [];
  Employee: any[] = [];
  Designations: any[] = [];

  branch: number[] = [];
  department: number[] = [];
  category: number[] = [];
  designation: number[] = [];
  employee: number[] = [];
  FilteredEmployees: any[] = [];

  allSelectedbR = false;
  allSelectedBrach = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelectedEmp = false;
  allSelecteddes = false;

  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectDept') selectDept: MatSelect | undefined;
  @ViewChild('selectBrach') selectBrach: MatSelect | undefined;
  @ViewChild('selectCat') selectCat: MatSelect | undefined;
  @ViewChild('selectEmp') selectEmp: MatSelect | undefined;
  @ViewChild('selectDes') selectDes: MatSelect | undefined;

  constructor(
    private countryService: CountryService,
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private DepartmentServiceService: DepartmentServiceService,
    private companyRegistrationService: CompanyRegistrationService,
    private categoryService: CatogaryService,
  ) { }

  // ==================== NEW PROPERTIES FOR EDIT/DELETE/TABLE ====================
  isEditMode: boolean = false;
  editingId: number | null = null;
  employeeShiftList: any[] = [];
  currentSchema: string = '';
  currentBranchIds: number[] = [];
  // ==================== END NEW PROPERTIES ====================

  ngOnInit(): void {

    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.currentSchema = schema;
        this.currentBranchIds = branchIds || [];
        this.fetchEmployees(schema, branchIds);
      }
    });

    this.employeeService.selectedBranches$.subscribe(ids => {
      this.loadShifts();
      this.loadShiftsEmployee();
      this.loadBranches();
      this.loadEmp();
      this.loadDEpartments();
      this.loadShiftsPattern();
    });

    this.loadUsers();
    this.loadCAtegory();
    this.loadDesignations();

    this.userId = this.sessionService.getUserId();

    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData;
          this.created_by = this.userId;

          let isSuperuser = this.userDetails.is_superuser || false;
          const selectedSchema = this.authService.getSelectedSchema();
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }

          if (isSuperuser) {
            this.hasViewPermission = true;
            this.hasAddPermission = true;
            this.hasDeletePermission = true;
            this.hasEditPermission = true;
          } else {
            try {
              const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
              if (Array.isArray(permissionsData) && permissionsData.length > 0) {
                const firstItem = permissionsData[0];
                if (firstItem.is_superuser) {
                  this.hasViewPermission = true;
                  this.hasAddPermission = true;
                  this.hasDeletePermission = true;
                  this.hasEditPermission = true;
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  this.hasAddPermission = this.checkGroupPermission('add_employeeshiftschedule', groupPermissions);
                  this.hasEditPermission = this.checkGroupPermission('change_employeeshiftschedule', groupPermissions);
                  this.hasDeletePermission = this.checkGroupPermission('delete_employeeshiftschedule', groupPermissions);
                  this.hasViewPermission = this.checkGroupPermission('view_employeeshiftschedule', groupPermissions);
                }
              }
            } catch (error) {
              console.error('Error fetching permissions:', error);
            }
          }
        },
        (error) => {
          console.error('Failed to fetch user details:', error);
        }
      );

      this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
          this.userDetailss = userData;
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

  private autoSelectFilteredEmployees(): void {
    this.FilteredEmployees.forEach(emp => {
      emp.selected = true;
    });
    this.allEmployeesSelected = true;
  }

  loadUsers(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      this.userService.getSChemaUsers(selectedSchema).subscribe(
        (result: any) => {
          this.Users = result;
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  start_date: any = '';
  end_date: any = '';
  schedule_name: any = '';
  shift_type: any = '';
  rotation_cycle_weeks: any = '';
  week1_pattern: any = '';
  week2_pattern: any = '';
  week3_pattern: any = '';
  week4_pattern: any = '';
  departments: any = '';
  shift_pattern: any = '';
  categories: any = '';
  designations: any = '';
  branches: any = '';
  automaticNumbering: boolean = false;

  // ==================== MODIFIED: SUPPORTS BOTH CREATE AND UPDATE ====================
  registerEmployeeallocateshifts(): void {
    this.registerButtonClicked = true;

    if (!this.start_date) {
      return;
    }

    const selectedEmployeeIds =
      this.FilteredEmployees
        .filter(x => x.selected)
        .map(x => x.id);

    const payload: any = {
      start_date: this.start_date || null,
      end_date: this.end_date || null,
      schedule_name: this.schedule_name || null,
      shift_type: this.shift_type || null,
      branches: this.selectedBranches,
      departments: this.selectedDepartments,
      categories: this.selectedCategories,
      designations: this.selectedDesignations,
      employee: selectedEmployeeIds,
      shift_pattern: this.shift_pattern || null
    };

    if (this.isEditMode && this.editingId) {
      const selectedSchema = this.authService.getSelectedSchema();
      const url = `${this.apiUrl}/calendars/api/employee-shift/${this.editingId}/?schema=${selectedSchema}`;

      this.http.put(url, payload).subscribe(
        (response) => {
          console.log('Update successful', response);
          alert('Shift schedule updated successfully.');
          this.closeapplicationModal();
          this.refreshEmployeeShifts();
        },
        (error) => {
          console.error('Update failed', error);
          let errorMsg = 'Update failed. Please try again.';
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (typeof error.error === 'object') {
              errorMsg = Object.keys(error.error)
                .map(field => `${field}: ${error.error[field].join(', ')}`)
                .join('\n');
            }
          }
          alert(errorMsg);
        }
      );
    } else {
      payload.created_by = this.created_by;

      this.employeeService.registerEmployeeShifts(payload).subscribe(
        (response) => {
          console.log('Registration successful', response);
          alert('Shift has been added.');
          this.closeapplicationModal();
          this.refreshEmployeeShifts();
          window.location.reload();
        },
        (error) => {
          console.error('Registration failed', error);
          let errorMsg = 'Registration failed. Please try again.';
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (typeof error.error === 'object') {
              errorMsg = Object.keys(error.error)
                .map(field => `${field}: ${error.error[field].join(', ')}`)
                .join('\n');
            }
          }
          alert(errorMsg);
        }
      );
    }
  }
  // ==================== END MODIFIED ====================

  iscreateEmployeeShift: boolean = false;

  // ==================== MODIFIED: RESETS FORM ON OPEN ====================
  openPopus(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.registerButtonClicked = false;
    this.resetForm();
    this.iscreateEmployeeShift = true;

    // Close header toggle modes when creating
    this.showEditBtn = false;
    this.Delete = false;
    this.allShiftsSelected = false;

    if (this.branches && this.branches.length > 0) {
      this.branch = [this.branches[0].id];
      this.allSelectedBrach = false;
    }
  }

  closeapplicationModal(): void {
    this.iscreateEmployeeShift = false;
    this.isEditMode = false;
    this.editingId = null;
    this.registerButtonClicked = false;
    this.resetForm();
  }

  resetForm(): void {
    this.start_date = '';
    this.end_date = '';
    this.schedule_name = '';
    this.shift_type = '';
    this.shift_pattern = '';
    this.selectedBranches = [];
    this.selectedDepartments = [];
    this.selectedCategories = [];
    this.selectedDesignations = [];
    if (this.FilteredEmployees && this.FilteredEmployees.length) {
      this.FilteredEmployees.forEach(emp => emp.selected = false);
    }
    this.allEmployeesSelected = false;
    this.currentPage = 1;
  }
  // ==================== END MODIFIED ====================

  // ==================== NEW: EDIT & DELETE METHODS ====================
  openEditModal(shift: any): void {
    this.isEditMode = true;
    this.editingId = shift.id;
    this.registerButtonClicked = false;

    // Populate basic fields
    this.start_date = shift.start_date || '';
    this.end_date = shift.end_date || '';
    this.schedule_name = shift.schedule_name || '';
    this.shift_pattern = shift.shift_pattern ? String(shift.shift_pattern) : '';

    // Populate multi-select filters
    this.selectedBranches = shift.branches || [];
    this.selectedDepartments = shift.departments || [];
    this.selectedCategories = shift.categories || [];
    this.selectedDesignations = shift.designations || [];

    const setupAndOpen = () => {
      this.applyEmployeeFilter();
      const selectedEmployeeIds = shift.employee || [];
      this.FilteredEmployees.forEach(emp => {
        emp.selected = selectedEmployeeIds.includes(emp.id);
      });
      this.allEmployeesSelected = this.FilteredEmployees.length > 0 && this.FilteredEmployees.every(emp => emp.selected);
      this.updatePagination();
      this.iscreateEmployeeShift = true;
    };

    if (this.Employee.length === 0) {
      this.loadEmp(() => setupAndOpen());
    } else {
      setupAndOpen();
    }
  }

  deleteEmployeeShift(id: number): void {
    if (!confirm('Are you sure you want to delete this employee shift schedule?')) {
      return;
    }

    const selectedSchema = this.authService.getSelectedSchema();
    const url = `${this.apiUrl}/calendars/api/employee-shift/${id}/?schema=${selectedSchema}`;

    this.http.delete(url).subscribe(
      () => {
        alert('Employee shift schedule deleted successfully.');
        this.refreshEmployeeShifts();
      },
      (error) => {
        console.error('Delete failed', error);
        alert('Delete failed. Please try again.');
      }
    );
  }

  refreshEmployeeShifts(): void {
    if (this.currentSchema) {
      this.fetchEmployees(this.currentSchema, this.currentBranchIds);
    }
  }

  getShiftPatternName(patternId: number | string | null): string {
    if (!patternId) return 'N/A';
    const pattern = this.ShiftsPattern.find(p => p.id == patternId);
    return pattern ? pattern.name : 'Unknown';
  }
  // ==================== END NEW METHODS ====================

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
          emp.emp_branch_id === id || emp.emp_branch_id === this.getBranchName(id)
        );

      const deptMatch =
        this.selectedDepartments.length === 0 ||
        this.selectedDepartments.some(id =>
          emp.emp_dept_id === id || emp.emp_dept_id === this.getDepartmentName(id)
        );

      const categoryMatch =
        this.selectedCategories.length === 0 ||
        this.selectedCategories.some(id =>
          emp.emp_ctgry_id === id || emp.emp_ctgry_id === this.getCategoryName(id)
        );

      const designationMatch =
        this.selectedDesignations.length === 0 ||
        this.selectedDesignations.some(id =>
          emp.emp_desgntn_id === id || emp.emp_desgntn_id === this.getDesignationName(id)
        );

      return branchMatch && deptMatch && categoryMatch && designationMatch;
    });

this.FilteredEmployees.forEach(emp => emp.selected = false);
this.allEmployeesSelected = false;

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


 allSelected: boolean = false;

toggleSelectAllEmployees(): void {
  this.FilteredEmployees.forEach(emp => {
    emp.selected = this.allEmployeesSelected;
  });

  this.updatePagination();
}

  toggleAllBranches(): void {
    if (this.selectedBranches.length === this.branches.length) {
      this.selectedBranches = [];
    } else {
      this.selectedBranches = this.branches.map((x: { id: any; }) => x.id);
    }
    this.applyEmployeeFilter();
  }

  isAllBranchesSelected(): boolean {
    return this.branches.length > 0 && this.selectedBranches.length === this.branches.length;
  }

  isSomeBranchesSelected(): boolean {
    return this.selectedBranches.length > 0 && this.selectedBranches.length < this.branches.length;
  }

  toggleAllDepartments(): void {
    if (this.selectedDepartments.length === this.Departments.length) {
      this.selectedDepartments = [];
    } else {
      this.selectedDepartments = this.Departments.map(x => x.id);
    }
    this.applyEmployeeFilter();
  }

  isAllDepartmentsSelected(): boolean {
    return this.Departments.length > 0 && this.selectedDepartments.length === this.Departments.length;
  }

  isSomeDepartmentsSelected(): boolean {
    return this.selectedDepartments.length > 0 && this.selectedDepartments.length < this.Departments.length;
  }

  toggleAllCategories(): void {
    if (this.selectedCategories.length === this.Categories.length) {
      this.selectedCategories = [];
    } else {
      this.selectedCategories = this.Categories.map(x => x.id);
    }
    this.applyEmployeeFilter();
  }

  isAllCategoriesSelected(): boolean {
    return this.Categories.length > 0 && this.selectedCategories.length === this.Categories.length;
  }

  isSomeCategoriesSelected(): boolean {
    return this.selectedCategories.length > 0 && this.selectedCategories.length < this.Categories.length;
  }

  toggleAllDesignations(): void {
    if (this.selectedDesignations.length === this.Designations.length) {
      this.selectedDesignations = [];
    } else {
      this.selectedDesignations = this.Designations.map(x => x.id);
    }
    this.applyEmployeeFilter();
  }

  isAllDesignationsSelected(): boolean {
    return this.Designations.length > 0 && this.selectedDesignations.length === this.Designations.length;
  }

  isSomeDesignationsSelected(): boolean {
    return this.selectedDesignations.length > 0 && this.selectedDesignations.length < this.Designations.length;
  }

  currentPage: number = 1;
  itemsPerPage: number = 3;
  pagedEmployees: any[] = [];

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedEmployees = this.FilteredEmployees.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.FilteredEmployees.length / this.itemsPerPage);
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
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  loadShifts(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.countryService.getShiftsNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Shifts = result;
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  loadShiftsPattern(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.countryService.getShiftsPatternNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.ShiftsPattern = result;
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  loadShiftsEmployee(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.countryService.getShiftsEmployeeNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.EmployeeShifts = result;
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
          const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
          if (sidebarSelectedIds.length > 0) {
            this.branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.branches = result;
          }
          if (this.branches.length === 1) {
            this.branch = [this.branches[0].id];
          }
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
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

  loadDEpartments(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.DepartmentServiceService.getDepartmentsMasterNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Departments = result;
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  loadDesignations(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      this.employeeService.getDesignations(selectedSchema).subscribe(
        (result: any) => {
          this.Designations = result;
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  loadCAtegory(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      this.categoryService.getcatogarys(selectedSchema).subscribe(
        (result: any) => {
          this.Categories = result;
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

  showEditBtn: boolean = false;
  EditShowButtons(): void {
    this.showEditBtn = !this.showEditBtn;
    // Mutually exclusive with delete mode
    if (this.showEditBtn) {
      this.Delete = false;
      this.allShiftsSelected = false;
    }
  }

  onCheckboxChange(employee: number) {
  }

  isEditModalOpen: boolean = false;
  editAsset: any = {};

  openEditModalOld(asset: any): void {
    this.editAsset = { ...asset };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editAsset = {};
  }

  updateAssetType(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editAsset.id) {
      alert('Missing schema or asset ID');
      return;
    }
    this.employeeService.updateShiftPattern(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert('Shift Pattern updated successfully!');
        this.closeEditModal();
        this.loadShiftsPattern();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating asset:', error);
        alert('Update failed');
      }
    );
  }

  Delete: boolean = false;
  allSelecteddelete: boolean = false;

  toggleCheckboxes(): void {
    this.Delete = !this.Delete;
    // Mutually exclusive with edit mode
    if (this.Delete) {
      this.showEditBtn = false;
    } else {
      // Reset selections when exiting delete mode
      this.allShiftsSelected = false;
      if (this.employeeShiftList && this.employeeShiftList.length) {
        this.employeeShiftList.forEach((s: any) => s.selected = false);
      }
    }
  }

toggleSelectAllShifts(): void {

  this.allShiftsSelected = !this.allShiftsSelected;

  this.employeeShiftList.forEach((shift: any) => {
    shift.selected = this.allShiftsSelected;
  });

  // keep table data in sync
  this.EmployeeShifts = this.employeeShiftList;
}

updateSelectAllState(): void {
  this.allShiftsSelected =
    this.employeeShiftList.length > 0 &&
    this.employeeShiftList.every((shift: any) => shift.selected);
}

    async deleteSelectedShifts(): Promise<void> {
    const selectedIds = this.employeeShiftList
      .filter((shift: any) => shift.selected)
      .map((shift: any) => shift.id);

    if (selectedIds.length === 0) {
      alert('No shift schedules selected for deletion.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected shift schedule(s)?`)) {
      return;
    }

    const selectedSchema = this.authService.getSelectedSchema();
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const url = `${this.apiUrl}/calendars/api/employee-shift/${id}/?schema=${selectedSchema}`;
        await this.http.delete(url).toPromise();
        successCount++;
      } catch (error) {
        console.error(`Failed to delete shift ${id}:`, error);
      }
    }

    alert(`${successCount} schedule(s) deleted successfully.`);
    window.location.reload();
    this.allShiftsSelected = false;
    this.Delete = false;
    this.refreshEmployeeShifts();
  }

  deleteSelectedAssetType() {
    const selectedEmployeeIds = this.ShiftsPattern
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No shift pattern selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected shift pattern?')) {
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteShiftPattern(categoryId).subscribe(
          () => {
            this.ShiftsPattern = this.ShiftsPattern.filter(employee => employee.id !== categoryId);
            alert('shift pattern deleted successfully');
            window.location.reload();
          },
          (error) => {
            console.error('Error deleting Category:', error);
          }
        );
      });
    }
  }

  shiftData: any = {};
  selectedSchedule: string = '';
  selectedEmployee: string = '';
  availableYears: number[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  employeeShifts: any[] = [];

  employeeCodes: string[] = [];
  allDates: string[] = [];
  selectedYear: string = '2025';
  currentMonthIndex: number = 0;
  currentMonth: string = '01';

  transformShiftDataForTable(): void {
    if (!this.shiftData || !this.shiftData.shifts) {
      this.employeeCodes = [];
      this.allDates = [];
      return;
    }
    this.employeeCodes = Object.keys(this.shiftData.shifts);
    const dateSet = new Set<string>();
    for (const empCode of this.employeeCodes) {
      const schedule = this.shiftData.shifts[empCode];
      if (schedule) {
        Object.keys(schedule).forEach(date => {
          if (date.split('-')[1] === this.currentMonth) {
            dateSet.add(date);
          }
        });
      }
    }
    this.allDates = Array.from(dateSet).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('-').map(Number);
      const [dayB, monthB, yearB] = b.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();
      return dateA - dateB;
    });
  }

  getShift(empCode: string, date: string): string {
    if (!this.shiftData.shifts || !this.shiftData.shifts[empCode]) return '';
    return this.shiftData.shifts[empCode][date] || '';
  }

  fetchShifts(): void {
    if (!this.selectedSchedule || !this.selectedYear) {
      alert('Please select schedule and year.');
      return;
    }
    const selectedSchema = localStorage.getItem('selectedSchema');
    const url = `${this.apiUrl}/calendars/api/employee-shift/get_shifts_for_year/?schedule_id=${this.selectedSchedule}&year=${this.selectedYear}&schema=${selectedSchema}`;
    this.http.get(url).subscribe(
      (response: any) => {
        this.shiftData = response;
        this.currentMonthIndex = 0;
        this.currentMonth = '01';
        this.transformShiftDataForTable();
      },
      (error) => {
        let errorMessage = 'Error fetching shift data.';
        if (error.error) {
          errorMessage = typeof error.error === 'string' ? error.error : error.error.error || errorMessage;
        }
        alert(errorMessage);
      }
    );
  }

  nextMonth(): void {
    if (this.currentMonthIndex < 11) {
      this.currentMonthIndex++;
      this.currentMonth = String(this.currentMonthIndex + 1).padStart(2, '0');
      this.transformShiftDataForTable();
    }
  }

  previousMonth(): void {
    if (this.currentMonthIndex > 0) {
      this.currentMonthIndex--;
      this.currentMonth = String(this.currentMonthIndex + 1).padStart(2, '0');
      this.transformShiftDataForTable();
    }
  }

  getMonthName(month: string): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month) - 1];
  }

  getDayNumber(dateStr: string): string {
    return dateStr.split('-')[0];
  }

  getDayName(dateStr: string): string {
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleString('en-US', { weekday: 'short' });
  }

  getMonthNameFromDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleString('en-US', { month: 'short' });
  }

  EmployeeShifts: any[] = [];

  isLoading: boolean = false;

  // ==================== MODIFIED: STORES DATA IN TABLE ARRAY ====================
  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.countryService.getEmployeeShiftsNew(schema, branchIds).subscribe({
      next: (data: any) => {
        this.EmployeeShifts = data;
        // Initialize selected: false for delete-mode checkboxes
        this.employeeShiftList = data.map((item: any) => ({ ...item, selected: false }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }
  // ==================== END MODIFIED ====================

  employeeSearch: string = '';

  toggleAllEmployees() {
    if (this.allEmployeesSelected) {
      this.employee = this.Employee.map((emp: any) => emp.id);
    } else {
      this.employee = [];
    }
  }

  filterEmployees() {
    if (!this.employeeSearch) {
      return this.Employee;
    }
    return this.Employee.filter((emp: any) =>
      emp.emp_first_name.toLowerCase().includes(this.employeeSearch.toLowerCase())
    );
  }
}
