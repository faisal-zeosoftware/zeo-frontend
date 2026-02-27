import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';

import {combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-project-master',
  templateUrl: './project-master.component.html',
  styleUrl: './project-master.component.css'
})
export class ProjectMasterComponent {

  @ViewChild('projectFileInput') projectFileInput!: ElementRef;


  triggerProjectFileInput() {
    this.projectFileInput.nativeElement.click();
  }

  getFileName(fileUrl: string): string {
    return fileUrl?.split('/').pop() || 'Existing File';
  }


  onFileSelected(event: any): void {
    this.selectedFile = event.target.files?.length ? event.target.files[0] : null;

    if (this.selectedFile) {
      this.editProject.document = this.selectedFile; // optional
    }
  }



  private dataSubscription?: Subscription;

  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectMng') selectMng: MatSelect | undefined;
  @ViewChild('selectBr') selectBr: MatSelect | undefined;


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local



  allSelectedEmp = false;
  allSelectedMng = false;
  allSelectedBr = false;



  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;


  title: any = '';
  start_date: any = '';
  end_date: any = '';
  description: any = '';
  managers: any = '';

  members: any = '';

  status: any = '';
  branches: any = '';

  is_active: boolean = false;

  selectedFile: File | null = null;



  Users: any[] = [];
  LoanTypes: any[] = [];

  Employees: any[] = [];

  Assets: any[] = [];
  Branches: any[] = [];


  customFieldHeaders: { custom_field_id: number, custom_field_name: string }[] = [];



  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow: boolean = false;



  registerButtonClicked = false;


  custom_fieldsFam: any[] = [];



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private countryService: CountryService,

    private DepartmentServiceService: DepartmentServiceService ,



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
  this.loadBranches(); 
});


    this.loadUsers();
    this.loadLAssetType();
    // this.loadProjects();

    this.loadCountries();
    // this.loadBranches();


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


                    this.hasAddPermission = this.checkGroupPermission('add_project', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_project', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_project', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_project', groupPermissions);
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




  toggleAllSelectionEmp(): void {
    if (this.select) {
      if (this.allSelectedEmp) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }



  toggleAllSelectionMng(): void {
    if (this.selectMng) {
      if (this.allSelectedMng) {
        this.selectMng.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectMng.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectionBr(): void {
    if (this.selectBr) {
      if (this.allSelectedBr) {
        this.selectBr.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectBr.options.forEach((item: MatOption) => item.deselect());
      }
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


  CreateProject(): void {
    this.registerButtonClicked = true;

    if (!this.selectedFile) {
      alert("Please upload a document");
      return;
    }

    const formData = new FormData();

    formData.append('title', this.title);
    formData.append('status', this.status);
    formData.append('start_date', this.start_date);
    formData.append('end_date', this.end_date);
    formData.append('description', this.description);
    formData.append('is_active', this.is_active ? 'true' : 'false');

    // Convert arrays (managers and members) to JSON strings or loop and append each
    this.managers.forEach((id: number) => formData.append('managers', id.toString()));
    this.members.forEach((id: number) => formData.append('members', id.toString()));
    this.branches.forEach((id: number) => formData.append('branches', id.toString()));


    // Add file
    formData.append('document', this.selectedFile);

    this.employeeService.registerProject(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Project has been added.');
        window.location.reload();
      },
      (error) => {
        console.error('Add failed', error);
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




  loadLAssetType(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getemployees(selectedSchema).subscribe(
        (result: any) => {
          // ✅ Filter employees: show only those who are active or not marked inactive
          this.Employees = result.filter(
            (employee: any) => employee.is_active === true || employee.is_active === null
          );
          console.log(' fetching Loantypes:');

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }




  // loadProjects(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore', selectedSchema)
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getProjects(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.LoanTypes = result;
  //         console.log(' fetching Loantypes:');

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
    this.employeeService.getProjectNew(schema, branchIds).subscribe({
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






  loadBranches(callback?: Function): void {

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
            this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.Branches = result; // Fallback: show all if nothing is selected in sidebar
          }
          // Inside the subscribe block of loadDeparmentBranch
          if (this.Branches.length === 1) {
            this.branches = this.branches[0].id;
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



  iscreateLoanApp: boolean = false;




  openPopus(): void {
    this.iscreateLoanApp = true;

  }

  closeapplicationModal(): void {
    this.iscreateLoanApp = false;

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

  toggleSelectAllEmployees() {
    this.allSelected = !this.allSelected;
    this.LoanTypes.forEach(employee => employee.selected = this.allSelected);

  }

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editProject: any = {}; // holds the asset being edited

  openEditModal(asset: any): void {
    this.editProject = { ...asset }; // copy asset data
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editProject = {};
  }


  updateProject(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.editProject.id) {
      alert('Missing schema or project ID');
      return;
    }

    const formData = new FormData();

    Object.keys(this.editProject).forEach(key => {
      if (key === 'document') return;

      const value = this.editProject[key];

      // Handle array fields
      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          formData.append(key, String(item));  // Convert to string ✔
        });

      } else {
        formData.append(key, value !== null && value !== undefined ? String(value) : '');
      }
    });

    // Add file if selected
    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }

    this.employeeService.updateProjects(this.editProject.id, formData).subscribe(
      (response) => {
        alert('Project updated successfully!');
        window.location.reload();
        this.closeEditModal();
        this.loadLAssetType();
      },
      (error) => {
        console.error('Error updating Project:', error);

        let errorMsg = 'Update failed';

        const backendError = error?.error;
        if (backendError && typeof backendError === 'object') {
          errorMsg = Object.keys(backendError)
            .map(key => `${key}: ${backendError[key].join(', ')}`)
            .join('\n');
        }

        alert(errorMsg);
      }
    );
  }




  deleteSelectedProject() {
    const selectedEmployeeIds = this.LoanTypes
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No Projects selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Project ?')) {

      let total = selectedEmployeeIds.length;
      let completed = 0;

      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteProjects(categoryId).subscribe(
          () => {
            console.log('Project  deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);

            completed++;

            if (completed === total) {
              alert(' Project  deleted successfully');
              window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Project:', error);
            alert('Error deleting Project: ' + error.statusText);
          }
        );
      });
    }
  }

  // loadLAsset(): void {

  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getAsset(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.Assets = result;
  //         console.log(' fetching Loantypes:');

  //       },
  //       (error) => {
  //         console.error('Error fetching Companies:', error);
  //       }
  //     );
  //   }
  //   }



  countries: any[] = [];
  loadCountries(): void {
    this.countryService.getCountries().subscribe(
      (result: any) => {
        this.countries = result;
      },
      (error) => {
        console.error('Error fetching countries:', error);
      }
    );
  }





}
