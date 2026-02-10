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

@Component({
  selector: 'app-assign-weekcalendar',
  templateUrl: './assign-weekcalendar.component.html',
  styleUrl: './assign-weekcalendar.component.css'
})
export class AssignWeekcalendarComponent {

  private dataSubscription?: Subscription;

  related_to: any = '';
  // branch: any = '';

  // department: any = '';

  // category: any = '';

  weekend_model: any = '';




  branches: any[] = [];
  Departments: any[] = [];
  Categories: any[] = [];
  Designations: any[] = [];

  Employee: any[] = [];


  WeekCalendar: any[] = [];

  branch: number[] = [];
  department: number[] = [];
  category: number[] = [];
  designation: number[] = [];

  employee: number[] = [];

  AssignWeekCalendar: any[] = [];







  registerButtonClicked = false;

  allSelected = false;
  allSelecteddept = false;
  allSelectedcat = false;
  allSelecteddes = false;

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


  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectdes') selectdes: MatSelect | undefined;


  constructor(private DepartmentServiceService: DepartmentServiceService,
    private companyRegistrationService: CompanyRegistrationService,
    private http: HttpClient,
    private authService: AuthenticationService,
    private categoryService: CatogaryService,
    private userService: UserMasterService,
    private employeeService: EmployeeService,

    private DesignationService: DesignationService,
    private sessionService: SessionService,




  ) { }





  ngOnInit(): void {
 
    this.loadCAtegory();
    // this.loadEmployee();
    this.loadDesignations();

     // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadBranch();
    this.loadEmp();
    this.loadDEpartments();
    this.loadWeekendCalendar();



  });

    // this.loadAssignedWeekendCalendar();


    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);  
        

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


  // checkViewPermission(permissions: any[]): boolean {
  //   const requiredPermission = 'add_assign_weekend' ||'change_assign_weekend' ||'delete_assign_weekend' ||'view_assign_weekend';


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

 
  loadBranch(callback?: Function): void {
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




  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {

        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectiondept(): void {
    if (this.select) {
      if (this.allSelecteddept) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectioncat(): void {
    if (this.select) {
      if (this.allSelectedcat) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  toggleAllSelectiondes(): void {
    if (this.selectdes) {
      if (this.allSelecteddes) {
        this.selectdes.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectdes.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  toggleAllSelectionEmp(): void {
    if (this.select) {
      if (this.allSelectedEmp) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
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
          console.error('Error fetching Designations:', error);
        }
      );
    }
  }


  // loadEmployee(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore', selectedSchema)
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getemployeesMaster(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.Employee = result;
  //         this.FilteredEmployees = result;
  //         console.log(' fetching Employees:');

  //       },
  //       (error) => {
  //         console.error('Error fetching Employees:', error);
  //       }
  //     );
  //   }
  // }


  loadEmp(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
  
    if (selectedSchema) {
      this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Employee = result;
          this.FilteredEmployees = result;          
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
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
    this.FilteredEmployees = this.Employee.filter(emp =>
      emp.emp_first_name.toLowerCase().includes(this.SearchEmployee.toLowerCase())

    );

  }

  // loadWeekendCalendar(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore', selectedSchema)
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.categoryService.getWeekendcalendar(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.WeekCalendar = result;
  //         console.log(' fetching Companies:');

  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  // }


  loadWeekendCalendar(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
  
    if (selectedSchema) {
      this.categoryService.getWeekendcalendarNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.WeekCalendar = result;
          
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }
  




  // loadAssignedWeekendCalendar(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore', selectedSchema)
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getAssignWeekendcalendar(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.AssignWeekCalendar = result;
  //         this.filteredDocuments = result;  // Initialize filtered data

  //         console.log(' fetching Companies:');

  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  // }


  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.employeeService.getAssignWeekendcalendarNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.AssignWeekCalendar = data;
        this.filteredDocuments = data;  // Initialize filtered data

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }




  registerAssignCalendar(): void {
    this.registerButtonClicked = true;
    const companyData = {
      related_to: this.related_to,

      branch: this.branch,
      department: this.department,

      category: this.category,
      designation: this.designation,

      employee: this.employee,
      weekend_model: this.weekend_model,






      // Add other form field values to the companyData object
    };


    this.employeeService.registerAssignweekCalendar(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);

        alert('Weekend Calendar has been Assigned ');
        window.location.reload();
        // window.location.reload();


      },
      (error) => {
        console.error('Add failed', error);
        console.log('Full error response:', error);

        // Check if the error message matches the specific error
        const errorMessage = error.error?.error || 'An error occurred while Assign the Week Calendar. Please try again.';
        alert(errorMessage);
      }
    );
  }



  isExpanded = false;
  searchQuery = '';

  toggleSearch() {
    this.isExpanded = !this.isExpanded;
  }


  // Filter documents based on searchQuery
  filterDocuments() {
    this.filteredDocuments = this.AssignWeekCalendar.filter(doc =>
      doc.weekend_model.toLowerCase().includes(this.searchQuery.toLowerCase())
      // doc.employee.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }




}
