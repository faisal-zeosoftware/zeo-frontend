import { Component, ViewChild } from '@angular/core';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';

import {combineLatest, Subscription } from 'rxjs';
import { LeaveService } from '../leave-master/leave.service';

@Component({
  selector: 'app-salary-structure',
  templateUrl: './salary-structure.component.html',
  styleUrl: './salary-structure.component.css'
})
export class SalaryStructureComponent {


  private dataSubscription?: Subscription;
  

  related_to: any = 'branch';


  name: any = '';
  description: any = '';
  components: any = '';




  branches: any[] = [];

  Employee: any[] = [];


  WeekCalendar: any[] = [];

  branch: number[] = [];
  

  employee: number[] = [];

  AssignWeekCalendar: any[] = [];







  registerButtonClicked = false;

  allSelectedBrach = false;


  allSelectedEmp = false;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  FilteredEmployees: any[] = [];

  filteredDocuments: any[] = [];  // Filtered list


  @ViewChild('branchSelect') branchSelect!: MatSelect;

  @ViewChild('empSelect') empSelect!: MatSelect;
 


  constructor(private DepartmentServiceService: DepartmentServiceService,
    private companyRegistrationService: CompanyRegistrationService,
    private http: HttpClient,
    private authService: AuthenticationService,
    private categoryService: CatogaryService,
    private userService: UserMasterService,
    private employeeService: EmployeeService,

    private DesignationService: DesignationService,
    private sessionService: SessionService,

    private leaveservice: LeaveService,



  ) { }





  ngOnInit(): void {
 


     // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadBranches();
    this.loadEmp();



  });

    // this.loadAssignedWeekendCalendar();


    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);  
        this.fetchsalaryComp(schema, branchIds);  


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


                    this.hasAddPermission = this.checkGroupPermission('add_assign_weekend', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_assign_weekend', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_assign_weekend', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_assign_weekend', groupPermissions);
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

  Salarycomponent: any[] = [];

  fetchsalaryComp(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveservice.getSalaryComNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.Salarycomponent = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }






  deleteAssignedWeekend(id: number): void {
    if (confirm('Are you sure you want to delete this record?')) {
      const selectedSchema = this.authService.getSelectedSchema();

      if (selectedSchema) {

        this.employeeService.deleteAssignWeekendcalendar(id, selectedSchema).subscribe(
          () => {
            alert('Deleted successfully!');
 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.employeeService.selectedSchema$,
  this.employeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchEmployees(schema, branchIds);  
    

  }
});
    },
          (error: any) => {   // ✅ Add explicit type here
            console.error('Error deleting record:', error);
            alert('Failed to delete record');
          }
        );
      }
    }
  }


  SearchEmployee = '';

  FilterEmployee() {
    const search = this.SearchEmployee.toLowerCase().trim();
  
    // Start from branch-filtered employees, not the full Employee list
    const branchFiltered = this.selectedBranches.length === 0
      ? this.Employee
      : this.Employee.filter(emp =>
          this.selectedBranches.some(id => emp.emp_branch_id === this.getBranchName(id))
        );
  
    if (!search) {
      this.FilteredEmployees = [...branchFiltered];
    } else {
      this.FilteredEmployees = branchFiltered.filter(emp =>
        (emp.emp_first_name && emp.emp_first_name.toLowerCase().includes(search)) ||
        (emp.emp_last_name && emp.emp_last_name.toLowerCase().includes(search)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(search))
      );
    }
  
    this.currentPage = 1;
    this.updatePagination();
  }

  editSearchEmployee = '';

  FilterEditEmployee() {
    const search = this.editSearchEmployee.toLowerCase().trim();
    
    // Get currently selected employee IDs before filtering
    const selectedEmpIds = this.editFilteredEmployees
      .filter(x => x.selected)
      .map(x => x.id);

    if (!search) {
      // No search - show all employees with their selection state preserved
      this.editFilteredEmployees = this.Employee.map(emp => ({
        ...emp,
        selected: selectedEmpIds.includes(emp.id)
      }));
    } else {
      // Search by first name, last name, or employee code
      this.editFilteredEmployees = this.Employee.filter(emp =>
        (emp.emp_first_name && emp.emp_first_name.toLowerCase().includes(search)) ||
        (emp.emp_last_name && emp.emp_last_name.toLowerCase().includes(search)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(search))
      ).map(emp => ({
        ...emp,
        selected: selectedEmpIds.includes(emp.id)
      }));
    }

    this.editCurrentPage = 1;
    this.updateEditPagination();
  }



  







  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.employeeService.getSalaryStr(schema, branchIds).subscribe({
      next: (data: any) => {
        this.AssignWeekCalendar = data;
        this.filteredDocuments = data;
        this.currentDocPage = 1;
        this.updateDocPagination();   // ✅ populate pagedDocuments
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

 
  isExpanded = false;
  searchQuery = '';

  toggleSearch() {
    this.isExpanded = !this.isExpanded;
  }


  // // Filter documents based on searchQuery
  // filterDocuments() {
  //   this.filteredDocuments = this.AssignWeekCalendar.filter(doc =>
  //     doc.weekend_model.toLowerCase().includes(this.searchQuery.toLowerCase())
  //     // doc.employee.toLowerCase().includes(this.searchQuery.toLowerCase())
  //   );
  // }





  iscreateLoanApp: boolean = false;




  openPopus(): void {
    this.editingId = null;   // ensure Add mode, not stuck in Edit mode
    this.iscreateLoanApp = true;
  
    this.name = '';
    this.description = '';
    this.components = [];
  
    this.branch = [];
  
    if (this.branches && this.branches.length > 0) {
      this.selectedBranches = [this.branches[0].id];
      this.allSelectedBrach = false;
    } else {
      this.selectedBranches = [];
    }
  
    this.Employee.forEach(emp => emp.selected = false);
    this.applyEmployeeFilter();
  }
  closeapplicationModal(): void {
    this.iscreateLoanApp = false;
    this.editingId = null;
  
    this.name = '';
    this.description = '';
    this.selectedBranches = [];
    this.components = [];
  
    this.Employee.forEach(emp => emp.selected = false);
    this.FilteredEmployees.forEach(emp => emp.selected = false);
  
    this.SearchEmployee = '';
    this.componentSearch = '';
  }





  Delete: boolean = false;
  allSelecteddelete: boolean = false;

toggleCheckboxes() {
  this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
    this.allSelecteddelete = !this.allSelecteddelete;
this.AssignWeekCalendar.forEach(employee => employee.selected = this.allSelecteddelete);

this.FilteredEmployees.forEach(emp => {

  emp.selected = this.allEmployeesSelected;

});

}

onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
}







deleteSelectedAssetType() { 
const selectedEmployeeIds = this.AssignWeekCalendar
.filter(employee => employee.selected)
.map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
alert('No assign week off selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected assign week off?')) {

 let total = selectedEmployeeIds.length;
let completed = 0;


selectedEmployeeIds.forEach(categoryId => {
  this.employeeService.deleteAssignweekoffs(categoryId).subscribe(
    () => {
      console.log('Asset type deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.AssignWeekCalendar = this.AssignWeekCalendar.filter(employee => employee.id !== categoryId);
      completed++;
 if (completed === total) {        
      alert(' assign week off deleted successfully');
      window.location.reload();
 }

    },
    (error) => {
      console.error('Error deleting Asset type:', error);
      alert('Error deleting Asset type: ' + error.statusText);
    }
  );
});
}
}



selectedBranches: number[] = [];

selectedDesignations: number[] = [];

allEmployeesSelected = false;


applyEmployeeFilter(): void {

  this.FilteredEmployees = this.Employee.filter(emp => {

    const branchMatch =
      this.selectedBranches.length === 0 ||
      this.selectedBranches.some(id =>
        emp.emp_branch_id === this.getBranchName(id)
      );

    return branchMatch;

  });

  this.currentPage = 1;
  this.updatePagination();
}

getBranchName(id: number): string {
  const item = this.branches.find(x => x.id == id);
  return item ? item.branch_name : '';
}





// select all option in branch

toggleAllBranches(): void {

  if (
    this.selectedBranches.length ===
    this.branches.length
  ) {

    this.selectedBranches = [];

  } else {

    this.selectedBranches =
      this.branches.map(x => x.id);

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








currentPage: number = 1;
itemsPerPage: number = 7;
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



registerSalarystructure(): void {

  const selectedEmployees =
    this.Employee
      .filter(x => x.selected)
      .map(x => x.id);

  const companyData = {
    name: this.name,
    description: this.description,
    branch: this.selectedBranches,
    components: this.components,
    employees: selectedEmployees   // ✅ matches backend field name
  };

  const handleSuccess = (isUpdate: boolean) => {
    alert(isUpdate ? 'Salary Structure Updated' : 'Salary Structure Assigned');
    this.closeapplicationModal();
    // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.employeeService.selectedSchema$,
  this.employeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchEmployees(schema, branchIds);  
    

  }
});
  };

  const handleError = (error: any) => {
    console.error('Save failed', error);
    console.log('Full error response:', error.error);

    let errorMessage = 'An error occurred while saving the Salary Structure. Please try again.';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (typeof error.error === 'object') {
        if (error.error.non_field_errors) {
          errorMessage = error.error.non_field_errors.join('\n');
        } else {
          errorMessage = Object.keys(error.error)
            .map(field => {
              const messages = error.error[field];
              return Array.isArray(messages)
                ? `${field}: ${messages.join(', ')}`
                : `${field}: ${messages}`;
            })
            .join('\n');
        }
      }
    }
    alert(errorMessage);
  };

  if (this.editingId) {
    // UPDATE existing record
    this.employeeService
      .updateSalarySrt(this.editingId, companyData)
      .subscribe(
        () => handleSuccess(true),
        (error) => handleError(error)
      );
  } else {
    // CREATE new record
    this.employeeService
      .registerSalarySrt(companyData)
      .subscribe(
        () => handleSuccess(false),
        (error) => handleError(error)
      );
  }
}





componentSearch: string = '';

filterComponents(): any[] {
  if (!this.componentSearch) {
    return this.Salarycomponent;
  }

  const search = this.componentSearch.toLowerCase().trim();

  return this.Salarycomponent.filter(c =>
    c.name && c.name.toLowerCase().includes(search)
  );
}

isAllComponentsSelected(): boolean {
  return (
    this.Salarycomponent.length > 0 &&
    this.components.length === this.Salarycomponent.length
  );
}

isSomeComponentsSelected(): boolean {
  return (
    this.components.length > 0 &&
    this.components.length < this.Salarycomponent.length
  );
}

toggleAllComponents(): void {
  if (this.components.length === this.Salarycomponent.length) {
    this.components = [];
  } else {
    this.components = this.Salarycomponent.map(x => x.id);
  }
}



// new paginationsection

// Table state for salary structure list
currentDocPage: number = 1;
itemsPerDocPage: number = 10;
pagedDocuments: any[] = [];




// Rename filterDocuments to actually match salary structure fields (name, not weekend_model)
filterDocuments() {
  const search = this.searchQuery.toLowerCase().trim();

  if (!search) {
    this.filteredDocuments = [...this.AssignWeekCalendar];
  } else {
    this.filteredDocuments = this.AssignWeekCalendar.filter(doc =>
      (doc.name && doc.name.toLowerCase().includes(search))
    );
  }

  this.currentDocPage = 1;
  this.updateDocPagination();
}

updateDocPagination(): void {
  const startIndex = (this.currentDocPage - 1) * this.itemsPerDocPage;
  const endIndex = startIndex + this.itemsPerDocPage;
  this.pagedDocuments = this.filteredDocuments.slice(startIndex, endIndex);
}

get totalDocPages(): number {
  return Math.ceil(this.filteredDocuments.length / this.itemsPerDocPage);
}

get docPageNumbers(): number[] {
  return Array(this.totalDocPages).fill(0).map((x, i) => i + 1);
}

nextDocPage(): void {
  if (this.currentDocPage < this.totalDocPages) {
    this.currentDocPage++;
    this.updateDocPagination();
  }
}

previousDocPage(): void {
  if (this.currentDocPage > 1) {
    this.currentDocPage--;
    this.updateDocPagination();
  }
}

goToDocPage(page: number): void {
  this.currentDocPage = page;
  this.updateDocPagination();
}

// Lookup helpers — resolve ids to display names
getBranchNameById(id: number): string {
  const item = this.branches.find(x => x.id === id);
  return item ? item.branch_name : '-';
}

getComponentNameById(id: number): string {
  const item = this.Salarycomponent.find(x => x.id === id);
  return item ? item.name : '-';
}











// edit modal 

  openEditPopuss(categoryId: number):void{
    
  }


  showEditBtn: boolean = false;

  EditShowButtons() {
    this.showEditBtn = !this.showEditBtn;
  }

  isEditModalOpen: boolean = false;
editAsset: any = {};

  closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}



editSelectedBranches: number[] = [];
editSelectedDepartments: number[] = [];
editSelectedCategories: number[] = [];
editSelectedDesignations: number[] = [];

editFilteredEmployees: any[] = [];
editPagedEmployees: any[] = [];
editAllEmployeesSelected = false;

editCurrentPage = 1;
editItemsPerPage = 3;




openEditModal(asset: any): void {

  this.editAsset = { ...asset };

  // Weekend Calendar Auto Select

  const selectedCalendar = this.WeekCalendar.find(
    (x: any) => x.calendar_code === asset.weekend_model
  );

  this.editAsset.weekend_model =
    selectedCalendar?.id ?? null;

  // Branch
  this.editSelectedBranches = this.branches
    .filter(x =>
      asset.branch?.includes(x.branch_name)
    )
    .map(x => x.id);

 

  // Employees

  this.editFilteredEmployees = this.Employee.map(emp => ({
    ...emp,

    selected:
      asset.employee?.includes(emp.id) ||
      asset.employee?.includes(emp.emp_code)
  }));

  this.editCurrentPage = 1;

  this.applyEditEmployeeFilter();

  this.isEditModalOpen = true;
}


applyEditEmployeeFilter(): void {

  const selectedEmpIds = this.editFilteredEmployees
    .filter(x => x.selected)
    .map(x => x.id);

  this.editFilteredEmployees =
    this.Employee.filter(emp => {

      const branchMatch =
        this.editSelectedBranches.length === 0 ||
        this.editSelectedBranches.some(id =>
          emp.emp_branch_id ===
          this.getBranchName(id)
        );

  
    

   
      return (
        branchMatch 
      
      );

    }).map(emp => ({
      ...emp,
      selected: selectedEmpIds.includes(emp.id)
    }));

  this.editCurrentPage = 1;

  this.updateEditPagination();
}

updateEditPagination(): void {

  const start =
    (this.editCurrentPage - 1)
    * this.editItemsPerPage;

  const end =
    start + this.editItemsPerPage;

  this.editPagedEmployees =
    this.editFilteredEmployees.slice(
      start,
      end
    );

}


updateAssetType(): void {

  const selectedEmployees =
    this.editFilteredEmployees
      .filter(emp => emp.selected)
      .map(emp => emp.id);

  const payload = {

    weekend_model: this.editAsset.weekend_model,

    branch: this.editSelectedBranches,

    department: this.editSelectedDepartments,

    category: this.editSelectedCategories,

    designation: this.editSelectedDesignations,

    employee: selectedEmployees

  };

  console.log('Update Payload:', payload);

  this.employeeService
    .updateAssignweekCalendar(this.editAsset.id, payload)
    .subscribe({

      next: (response) => {

        alert('Weekend Calendar Updated Successfully');

        window.location.reload();

        this.closeEditModal();
        this.dataSubscription = combineLatest([
          this.employeeService.selectedSchema$,
          this.employeeService.selectedBranches$
        ]).subscribe(([schema, branchIds]) => {
          if (schema) {
            this.fetchEmployees(schema, branchIds);  
            
    
          }
        });

      },

      error: (error) => {

        alert(
          error.error?.error ||
          error.error?.message ||
          'Update failed'
        );

      }

    });

}

get editTotalPages(): number {

  return Math.ceil(
    this.editFilteredEmployees.length /
    this.editItemsPerPage
  );

}


editNextPage(): void {

  if (
    this.editCurrentPage <
    this.editTotalPages
  ) {

    this.editCurrentPage++;

    this.updateEditPagination();

  }

}


editPreviousPage(): void {

  if (
    this.editCurrentPage > 1
  ) {

    this.editCurrentPage--;

    this.updateEditPagination();

  }

}

editGoToPage(page: number): void {

  this.editCurrentPage = page;

  this.updateEditPagination();

}


get editPageNumbers(): number[] {

  return Array(
    this.editTotalPages
  ).fill(0).map((x, i) => i + 1);

}





toggleSelectAllEditEmployees(): void {

  this.editFilteredEmployees.forEach(emp => {

    emp.selected = this.editAllEmployeesSelected;

  });

  this.updateEditPagination();

}


toggleAllEditBranches(): void {

  if (this.editSelectedBranches.length === this.branches.length) {

    this.editSelectedBranches = [];

  } else {

    this.editSelectedBranches =
      this.branches.map(x => x.id);

  }

  this.applyEditEmployeeFilter();

}

isAllEditBranchesSelected(): boolean {

  return this.branches.length > 0 &&
         this.editSelectedBranches.length === this.branches.length;

}

isSomeEditBranchesSelected(): boolean {

  return this.editSelectedBranches.length > 0 &&
         this.editSelectedBranches.length < this.branches.length;

}



     branchsearch: string = '';

filterBranches(): any[] {

  if (!this.branchsearch || this.branchsearch.trim() === '') {
    return this.branches;
  }

  const search = this.branchsearch.toLowerCase().trim();

  return this.branches.filter((branch: any) =>
    branch.branch_name.toLowerCase().includes(search)
  );
}









// Track whether we're editing an existing record, or creating a new one
editingId: number | null = null;

// ---------- EDIT ----------
editSalaryStructure(doc: any): void {
  this.editingId = doc.id;
  this.iscreateLoanApp = true;

  this.name = doc.name;
  this.description = doc.description || '';

  this.selectedBranches = Array.isArray(doc.branch) ? [...doc.branch] : (doc.branch ? [doc.branch] : []);
  this.components = Array.isArray(doc.components) ? [...doc.components] : [];

  this.applyEmployeeFilter();

  // ✅ use "employees", matching the actual API field name
  const selectedEmpIds: number[] = doc.employees || [];

  this.Employee.forEach(emp => {
    emp.selected = selectedEmpIds.includes(emp.id);
  });

  this.FilteredEmployees.forEach(emp => {
    emp.selected = selectedEmpIds.includes(emp.id);
  });

  this.updatePagination();
}


// ---------- DELETE ----------
deleteSalaryStructure(doc: any): void {
  const confirmDelete = confirm(`Are you sure you want to delete "${doc.name}"?`);
  if (!confirmDelete) {
    return;
  }

  this.employeeService.deleteSalarySrt(doc.id).subscribe(
    (response) => {
      alert('Salary Structure deleted successfully');
      // Remove from local lists without a full page reload
      this.AssignWeekCalendar = this.AssignWeekCalendar.filter(x => x.id !== doc.id);
      this.filteredDocuments = this.filteredDocuments.filter(x => x.id !== doc.id);
      this.updateDocPagination();
    },
    (error) => {
      console.error('Delete failed', error);
      alert('Failed to delete salary structure. Please try again.');
    }
  );
}








}
