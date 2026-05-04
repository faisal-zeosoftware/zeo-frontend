import { HttpClient } from '@angular/common/http';
import { Component, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';
declare var $: any;
import 'summernote'; // Ensure you have summernote imported
import { CompanyRegistrationService } from '../company-registration.service';
import { environment } from '../../environments/environment';
import { combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';
@Component({
  selector: 'app-salary',
  templateUrl: './salary.component.html',
  styleUrl: './salary.component.css'
})
export class SalaryComponent {


  private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`;


  name: any = '';
  component_type: any = '';
  code: any = '';
  description: any = '';
  reason: any = '';
  branch: any = '';

  is_fixed: boolean = true;
  deduct_leave: boolean = false;
  is_loan_component: boolean = false;

  show_in_payslip: boolean = false;

  affected_by_halfpaid_leave: boolean = false;
  prorata_calculation: boolean = false;
  is_emi_deduction: boolean = false;

  is_advance_salary: boolean = false;
  is_air_ticket: boolean = false;
  is_gratuity: boolean = false;



  amount: any = '';
  employee: any = '';
  component: any = '';
  is_active: boolean = false;

  showAmountField: boolean = false;


  registerButtonClicked: boolean = false;



  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;
  hasImportPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  employees: any[] = [];
  Salarycomponent: any[] = [];
  EmployeeSalarycomponent: any[] = [];


  filteredEmployees: any[] = [];



  // edit salary component

  editingComponent: any = null;
  isEditMode: boolean = false;
  updateId: number | null = null;


  editingComponentEmp: any = null;
  isEditModeEmp: boolean = false;
  updateIdEmp: number | null = null;





  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DesignationService: DesignationService,
    private EmployeeService: EmployeeService,
    private el: ElementRef,
    private companyRegistrationService: CompanyRegistrationService,
    private DepartmentServiceService: DepartmentServiceService,


  ) { }

  ngOnInit(): void {

this.loadDeparmentBranch();

    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);

        // this.fetchEmployeesSalaryCom(schema, branchIds);  

      }
    });

    // Listen for sidebar changes so the dropdown updates instantly
    this.EmployeeService.selectedBranches$.subscribe(ids => {
      this.loadDeparmentBranch();
      this.loadEmp();

    });




    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {


      // this.LoadEmployee(selectedSchema);
      // this.LoadSalaryCom(selectedSchema); 
      // this.LoadBranch(selectedSchema);

      // this.LoadEmployeeSalaryCom(selectedSchema);


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


                    this.hasAddPermission = this.checkGroupPermission('add_salarycomponent', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_salarycomponent', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_salarycomponent', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_salarycomponent', groupPermissions);
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



  // saveOrUpdateSalaryComponent(): void {
  //   this.registerButtonClicked = true;

  //   if (!this.name || !this.component_type || !this.code) {
  //     alert('Please fill in all required fields!');
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append('name', this.name);
  //   formData.append('component_type', this.component_type);
  //   formData.append('code', this.code);
  //   formData.append('branch', this.branch);

  //   formData.append('description', this.description || '');
  //   formData.append('formula', this.formula || '');

  //   formData.append('is_fixed', (this.is_fixed ?? false).toString());
  //   formData.append('deduct_leave', (this.deduct_leave ?? false).toString());
  //   formData.append('is_loan_component', (this.is_loan_component ?? false).toString());

  //   formData.append('show_in_payslip', (this.show_in_payslip ?? false).toString());

  //   formData.append('affected_by_halfpaid_leave', (this.affected_by_halfpaid_leave ?? false).toString());
  //   formData.append('prorata_calculation', (this.prorata_calculation ?? false).toString());
  //   formData.append('is_emi_deduction', (this.is_emi_deduction ?? false).toString());

  //   formData.append('is_advance_salary', (this.is_advance_salary ?? false).toString());
  //   formData.append('is_air_ticket', (this.is_air_ticket ?? false).toString());
  //   formData.append('is_gratuity', (this.is_gratuity ?? false).toString());

  //   if (this.isEditMode && this.updateId !== null) {
  //     this.leaveService.updateSalaryComponent(this.updateId, formData).subscribe(
  //       (response) => {
  //         alert('Salary Component updated successfully');
  //         // this.resetForm();
  //         this.dataSubscription = combineLatest([
  //           this.EmployeeService.selectedSchema$,
  //           this.EmployeeService.selectedBranches$
  //         ]).subscribe(([schema, branchIds]) => {
  //           if (schema) {
  //             this.fetchEmployees(schema, branchIds);  


  //           }
  //         });
  //         // this.LoadSalaryCom(localStorage.getItem('selectedSchema') || '');
  //       },
  //       (error) => {
  //         console.error('Update failed', error);
  //         this.displayBackendErrors(error);
  //       }
  //     );
  //   } else {
  //     this.leaveService.registerSalaryComponent(formData).subscribe(
  //       (response) => {
  //         alert('Salary Component has been added');
  //         // this.resetForm();
  //          // combineLatest waits for both Schema and Branches to have a value
  //    this.dataSubscription = combineLatest([
  //     this.EmployeeService.selectedSchema$,
  //     this.EmployeeService.selectedBranches$
  //   ]).subscribe(([schema, branchIds]) => {
  //     if (schema) {
  //       this.fetchEmployees(schema, branchIds);  


  //     }
  //   });

  //         // this.LoadSalaryCom(localStorage.getItem('selectedSchema') || '');
  //       },
  //       (error) => {
  //         console.error('Add failed', error);
  //         this.displayBackendErrors(error);
  //       }
  //     );
  //   }
  // }



  CreateSalaryComponent(): void {
    this.registerButtonClicked = true;

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('component_type', this.component_type);
    formData.append('code', this.code);
    formData.append('branch', this.branch);

    formData.append('description', this.description || '');
    formData.append('formula', this.formula || '');

    formData.append('is_fixed', (this.is_fixed ?? false).toString());
    formData.append('deduct_leave', (this.deduct_leave ?? false).toString());
    formData.append('is_loan_component', (this.is_loan_component ?? false).toString());

    formData.append('show_in_payslip', (this.show_in_payslip ?? false).toString());

    formData.append('affected_by_halfpaid_leave', (this.affected_by_halfpaid_leave ?? false).toString());
    formData.append('prorata_calculation', (this.prorata_calculation ?? false).toString());
    formData.append('is_emi_deduction', (this.is_emi_deduction ?? false).toString());

    formData.append('is_advance_salary', (this.is_advance_salary ?? false).toString());
    formData.append('is_air_ticket', (this.is_air_ticket ?? false).toString());
    formData.append('is_gratuity', (this.is_gratuity ?? false).toString());



    this.leaveService.registerSalaryComponent(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert(' salary component has been added');
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







  loadEmp(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


    if (selectedSchema) {
      this.EmployeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
        (data: any) => {
          // Filtering employees where is_active is null or true
          this.employees = data.filter((employee: any) => employee.is_active === null || employee.is_active === true);
          this.filteredEmployees = this.employees;

          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }



  // LoadSalaryCom(selectedSchema: string) {
  //   this.leaveService.getSalaryCom(selectedSchema).subscribe(
  //     (data: any) => {
  //       this.Salarycomponent = data;

  //       console.log('employee:', this.Salarycomponent);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching categories:', error);
  //     }
  //   );
  // }


  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveService.getSalaryComNew(schema, branchIds).subscribe({
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


branches:any []=[];

loadDeparmentBranch(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
      (result: any[]) => {

        const sidebarSelectedIds: number[] =
          JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

        this.branches = sidebarSelectedIds.length > 0
          ? result.filter(branch => sidebarSelectedIds.includes(branch.id))
          : result;

        // ✅ Always ensure valid selection
        if (this.branches.length > 0) {
          const exists = this.branches.find(b => b.id === this.branch);

          if (!exists) {
            this.branch = this.branches[0].id;
          }
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

mapBranchNameToId() {
  if (!this.branches || !this.editAsset?.branch) return;

  const branch = this.branches.find(
    (b: any) =>
      b.id === this.editAsset.branch ||
      b.branch_name === this.editAsset.branch
  );

  if (branch) {
    this.editAsset.branch = branch.id; // always ID
  }

  console.log('Mapped Branch ID:', this.editAsset.branch);
}




  filteredSalaryComponents: any[] = [];

  selectedFixedFilter: string = 'all';



  numbers: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  formula: string = ''; // Initialize empty

  insertIntoTextarea(componentName: string): void {
    if (this.formula) {
      this.formula += ' ' + componentName; // Append new name
    } else {
      this.formula = componentName; // First entry
    }
  }

  clearTextarea(): void {
    this.formula = ''; // Clear the textarea
  }

  deleteLastCharacter(): void {
    this.formula = this.formula.trim().slice(0, -1); // Remove last character
  }









  insertComponentToFormula(code: string, textarea: HTMLTextAreaElement): void {
    const placeholder = `${code}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.formula =
      this.formula.substring(0, start) +
      placeholder +
      this.formula.substring(end);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 0);

    // Close dropdowns after selection
    this.dropdownOpen = false;
    this.operatorDropdownOpen = false;
    this.arithmeticDropdownOpen = false; // close the salary component dropdown if open

  }

  isAddFieldsModalOpen: boolean = false;


  // Triggered when the checkbox is changed
  onFixedChange() {
    if (!this.is_fixed) {
      this.isAddFieldsModalOpen = true;
    }
  }


  
  // Triggered when the checkbox is changed
  onFixedChangeEdit() {
    if (!this.editAsset.is_fixed) {
      this.isAddFieldsModalOpen = true;
    }
  }


  closemarketModal() {
    this.isAddFieldsModalOpen = false;
  }




  dropdownOpen: boolean = false;

  operatorDropdownOpen: boolean = false;
  arithmeticDropdownOpen: boolean = false;
  FunctionsdropdownOpen: boolean = false;

  VariablesdropdownOpen: boolean = false;


  logicalOperators: string[] = ['<', '>', '>=', '<=', '==', '!=', 'AND', 'OR', 'NOT']; // Add more if needed

  arithmeticOperators: string[] = ['+', '-', '*', '/', '%'];

  FunctionsOperators: string[] = ['WORKHOURS()', 'MAX()', 'MIN()', 'ROUND()', 'SUM()', 'AVG()', 'ABS()', 'INT()',];

  VariablesOperators: string[] = ['calendar_days', 'working_days', 'fixed_days', 'standard_hours', 'ot_hours', 'years_of_service', 'normal_ot_hours', 'weekend_ot_hours',
    'holiday_ot_hours', 'ot_normal_rate', 'ot_weekend_rate', 'ot_holiday_rate', 'encashed_days'];


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.operatorDropdownOpen = false; // close the other dropdown if open
    this.arithmeticDropdownOpen = false; // close the salary component dropdown if open
    this.FunctionsdropdownOpen = false;
    this.VariablesdropdownOpen = false;

  }

  toggleOperatorDropdown() {
    this.operatorDropdownOpen = !this.operatorDropdownOpen;
    this.dropdownOpen = false; // close the salary component dropdown if open
    this.arithmeticDropdownOpen = false; // close the salary component dropdown if open
    this.FunctionsdropdownOpen = false;
    this.VariablesdropdownOpen = false;

  }


  toggleArithmeticDropdown() {
    this.arithmeticDropdownOpen = !this.arithmeticDropdownOpen;

    // Close the other dropdowns
    this.dropdownOpen = false;
    this.operatorDropdownOpen = false;
    this.FunctionsdropdownOpen = false;
    this.VariablesdropdownOpen = false;

  }

  toggleFunctionsDropdown() {
    this.FunctionsdropdownOpen = !this.FunctionsdropdownOpen;

    // Close the other dropdowns
    this.dropdownOpen = false;
    this.operatorDropdownOpen = false;
    this.arithmeticDropdownOpen = false;

    this.VariablesdropdownOpen = false;

  }


  toggleVariablesDropdown() {
    this.VariablesdropdownOpen = !this.VariablesdropdownOpen;

    // Close the other dropdowns
    this.dropdownOpen = false;
    this.operatorDropdownOpen = false;
    this.arithmeticDropdownOpen = false;
    this.FunctionsdropdownOpen = false;

  }


  deletePayroll(payrollId: number): void {
    if (confirm('Are you sure you want to delete this Component?')) {
      this.leaveService.deleteSalary(payrollId).subscribe(
        () => {
          // Filter out the deleted payroll from the list
          this.Salarycomponent = this.Salarycomponent.filter(p => p.id !== payrollId);
          console.log('Payroll deleted successfully');
          alert('salary Component deleted succesfull');
        },
        (error) => {
          console.error('Failed to delete payroll', error);
        }
      );
    }
  }


  isBulkuploadDepartmentModalOpen = false;
  showUploadForm = false;
  selectedFile!: File;

  /* Open / Close Modal */
  OpenBulkuploadModal(): void {
    this.isBulkuploadDepartmentModalOpen = true;
  }

  closeBulkuploadModal(): void {
    this.isBulkuploadDepartmentModalOpen = false;
    this.showUploadForm = false;
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
  }

  closeUploadForm(): void {
    this.showUploadForm = false;
  }

  /* File Select */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  bulkUploadEmployeeSalary(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema || !this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(
      `${this.apiUrl}/payroll/api/bulk-upload-salary/bulk_upload/?schema=${selectedSchema}`,
      formData
    ).subscribe({
      next: () => {
        alert('Employee Salary uploaded successfully');
        window.location.reload();
      },
      error: () => {
        alert('Upload failed');
      }
    });
  }

  downloadEmployeeSalaryCsv(): void {
    const schema = this.authService.getSelectedSchema();
    if (!schema) return;

    this.companyRegistrationService
      .downloadSalaryCsv(schema)
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Employee_Salary_Template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }


  downloadEmployeeSalaryExcel(): void {
    const schema = this.authService.getSelectedSchema();
    if (!schema) return;

    this.companyRegistrationService
      .downloadSalaryExcel(schema)
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Employee_Salary_Template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
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
    this.Salarycomponent.forEach(employee => employee.selected = this.allSelected);

  }

  onCheckboxChange(employee: number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }



  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset };
  this.isEditModalOpen = true;

  this.mapBranchNameToId(); // ✅ FIX
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

    this.EmployeeService.updatesalaryComponent(this.editAsset.id, this.editAsset).subscribe(
      (response) => {
        alert('Salary component  updated successfully!');
        this.closeEditModal();
        // this.loadLAsset(); 
        window.location.reload();
      },
      (error) => {
        console.error('Error updating asset:', error);

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


  deleteSelectedAssetMaster() {
    const selectedEmployeeIds = this.Salarycomponent
      .filter(employee => employee.selected)
      .map(employee => employee.id);

    if (selectedEmployeeIds.length === 0) {
      alert('No Salary component selected for deletion.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected Salary component ?')) {

      let total = selectedEmployeeIds.length;
      let completed = 0;

      selectedEmployeeIds.forEach(categoryId => {
        this.EmployeeService.deleteSalaryComponent(categoryId).subscribe(
          () => {
            console.log('Salary component deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.Salarycomponent = this.Salarycomponent.filter(employee => employee.id !== categoryId);

            completed++;

            if (completed === total) {
              alert(' Salary component deleted successfully');
              window.location.reload();
            }

          },
          (error) => {
            console.error('Error deleting Salary component:', error);
            alert('Error deleting Salary component: ' + error.statusText);
          }
        );
      });
    }
  }






}
