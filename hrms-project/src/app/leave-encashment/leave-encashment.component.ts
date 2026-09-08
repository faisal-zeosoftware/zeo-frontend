
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-encashment',
  templateUrl: './leave-encashment.component.html',
  styleUrl: './leave-encashment.component.css'
})
export class LeaveEncashmentComponent {


  @ViewChild('formulaInput') formulaInputRef!: ElementRef<HTMLTextAreaElement>;

  
       private apiUrl = `${environment.apiBaseUrl}`;
       private dataSubscription?: Subscription;
  
  
    registerButtonClicked: boolean = false;
  
  
    status:any='';
    remarks:any='';
    encashment_days:any='' ;
    employee:any='' ;
    leave_type:any='' ;
  
  
    created_by:any='' ;
  
  
  
    LeaveTypes: any[] = [];
    Employees: any[] = [];
    LeaveBalances: any[] = [];
  
  
  
    Users: any[] = [];
  
    hasAddPermission: boolean = false;
    hasDeletePermission: boolean = false;
    hasViewPermission: boolean =false;
    hasEditPermission: boolean = false;
    hasImportPermission: boolean = false;
    
    userId: number | null | undefined;
    userDetails: any;
    userDetailss: any;
    schemas: string[] = []; // Array to store schema names
  
  
  
  
  
    constructor(
      private http: HttpClient,
      private authService: AuthenticationService,
      private sessionService: SessionService,
      private leaveService:LeaveService,
      private DesignationService: DesignationService,
      private employeeService: EmployeeService,
      private companyRegistrationService: CompanyRegistrationService, 
  
    
      ) {}
  
      ngOnInit(): void {
  
      // combineLatest waits for both Schema and Branches to have a value
      this.dataSubscription = combineLatest([
        this.employeeService.selectedSchema$,
        this.employeeService.selectedBranches$
      ]).subscribe(([schema, branchIds]) => {
        if (schema) {
          this.fetchEmployeesLeaveApprovalLevel(schema, branchIds);
    
        }
      });
  
  
        // Listen for sidebar changes so the dropdown updates instantly
    this.employeeService.selectedBranches$.subscribe(ids => {
      this.LoadEmployees();
      this.LoadLeavetype();
    });
  
  
  
        const selectedSchema = this.authService.getSelectedSchema();
        if (selectedSchema) {
  
  
          // this.LoadLeavetype();
        this.LoadUsers(selectedSchema);
        this.LoadEmployees();
        // this.LoadLeavebalance(selectedSchema);
  
  
        
        }
  
        this.userId = this.sessionService.getUserId();
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
  
        this.created_by= this.userId;
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
          this.hasImportPermission = true;
  
      
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
                  this.hasImportPermission = true;
  
                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_emp_leave_balance', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_emp_leave_balance', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_emp_leave_balance', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
                  this.hasViewPermission = this.checkGroupPermission('view_emp_leave_balance', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermission);
  
                  this.hasImportPermission = this.checkGroupPermission('import_emp_leave_balance', groupPermissions);
                  console.log('Has import permission:', this.hasImportPermission);
  
  
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
  
      checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
        return groupPermissions.some(permission => permission.codename === codeName);
        }
        
  
  
        showBulkUpload: boolean = false;
  
        toggleBulkUpload() {
          this.showBulkUpload = !this.showBulkUpload;
        }
        
  
  
  
      
  
  
      LoadLeavetype(callback?: Function) {
        const selectedSchema = this.authService.getSelectedSchema();
        const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
      
      
        if (selectedSchema) {
          this.leaveService.getLeaveTypeNew(selectedSchema, savedIds).subscribe(
            (result: any) => {
              this.LeaveTypes = result;
              
              if (callback) callback();
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
    }
  
  
  
  
  
      mapLeaveTypeNameToId() {
  
    if (!this.LeaveTypes || !this.editAsset?.leave_type) return;
  
    const lv = this.LeaveTypes.find(
      (l: any) => l.name === this.editAsset.leave_type
    );
  
    if (lv) {
      this.editAsset.leave_type = lv.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.leave_type);
  }
  
      
  
        
        LoadEmployees(callback?: Function) {
          const selectedSchema = this.authService.getSelectedSchema();
          const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
        
        
          if (selectedSchema) {
            this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
              (result: any) => {
                this.Employees = result;
                
                if (callback) callback();
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
      }
  
     mapLoadEmployeeNameToId() {
  
    if (!this.Employees || !this.editAsset?.employee) return;
  
    const emp = this.Employees.find(
      (e: any) => e.emp_code === this.editAsset.employee
    );
  
    if (emp) {
      this.editAsset.employee = emp.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.employee);
  }
      
      
      
     
      
        LoadUsers(selectedSchema: string) {
          this.leaveService.getApproverUsers(selectedSchema).subscribe(
            (data: any) => {
              this.Users = data;
            
              console.log('employee:', this.LeaveTypes);
            },
            (error: any) => {
              console.error('Error fetching categories:', error);
            }
          );
        }
  
  
  
        
        LeaveEncashment(): void {
          this.registerButtonClicked = true;
        
          if (!this.leave_type || !this.employee) {
            return;
          }
        
          // If the field is empty/whitespace, fall back to the backend's default formula
          const formulaToSave = (this.formula && this.formula.trim())
            ? this.formula.trim()
            : this.defaultFormula;
        
          // Validate only if there's actually a formula (typed or default) to check
          if (formulaToSave && !this.isFormulaValid(formulaToSave)) {
            alert(
              `Formula contains unknown variable(s): ${this.getUnknownFormulaTokens(formulaToSave).join(', ')}`
            );
            return;
          }
        
          const formData = new FormData();
          formData.append('leave_type', this.leave_type);
          formData.append('encashment_days', this.encashment_days);
          formData.append('status', this.status);
          formData.append('remarks', this.remarks);
          formData.append('employee', this.employee);
          formData.append('formula', formulaToSave); // ✅ always sends a formula, never blank
        
          this.leaveService.CreateLeaveEncashment(formData).subscribe(
            (response) => {
              console.log('Registration successful', response);
              alert('Leave encashment has been Created');
              window.location.reload();
            },
            (error) => {
              console.error('Leave encashment failed:', error);
        
              let errorMessage = 'Something went wrong.';
        
              if (error.error && typeof error.error === 'object') {
                const messages: string[] = [];
                for (const [key, value] of Object.entries(error.error)) {
                  if (Array.isArray(value)) {
                    messages.push(`${key}: ${value.join(', ')}`);
                  } else if (typeof value === 'string') {
                    messages.push(`${key}: ${value}`);
                  } else {
                    messages.push(`${key}: ${JSON.stringify(value)}`);
                  }
                }
                if (messages.length > 0) {
                  errorMessage = messages.join('\n');
                }
              } else if (error.error?.detail) {
                errorMessage = error.error.detail;
              }
        
              alert(`Leave encashment failed!\n\n${errorMessage}`);
            }
          );
        }
  
    
  
      isLoading: boolean = false;
  
  
      fetchEmployeesLeaveApprovalLevel(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.leaveService.getAllLeaveEncashmentAllNew(schema, branchIds).subscribe({
  
        next: (data: any) => {
        this.LeaveBalances = data;
        this.isLoading = false;
        this.currentPage = 1;        // ← reset to page 1
        this.updatePagination();      // ← apply pagination
      },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
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
  this.LeaveBalances.forEach(employee => employee.selected = this.allSelecteds);
  
  }
  
  onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
  }
  
  
  
  isEditModalOpen: boolean = false;
  editAsset: any = {}; // holds the asset being edited
  
  openEditModal(asset: any): void {
  this.editAsset = { ...asset }; // copy asset data
  this.isEditModalOpen = true;
  
  this.mapLeaveTypeNameToId();
  this.mapLoadEmployeeNameToId();
  }
  
  closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editAsset = {};
  }
  
  
  deleteSelectedLeavebalance() { 
  const selectedEmployeeIds = this.LeaveBalances
  .filter(employee => employee.selected)
  .map(employee => employee.id);
  
  if (selectedEmployeeIds.length === 0) {
  alert('No Leave Encashment selected for deletion.');
  return;
  }
  
  if (confirm('Are you sure you want to delete the selected Leave Encashment ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
  
  selectedEmployeeIds.forEach(categoryId => {
  this.leaveService.deleteLeaveEncashment(categoryId).subscribe(
    () => {
      console.log(' Leave Encashment deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.LeaveBalances = this.LeaveBalances.filter(employee => employee.id !== categoryId);
  
      completed++;
  
      if (completed === total) {
      alert(' Leave Encashment  deleted successfully');
      window.location.reload();
      }
  
    },
    (error) => {
      console.error('Error deleting Leave Encashment:', error);
       alert('Error deleting category: ' + error.statusText);
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
  
  this.leaveService.updateLeaveEncashment(this.editAsset.id, this.editAsset).subscribe(
  (response) => {
  alert(' Leave Encashment updated successfully!');
  this.closeEditModal();
  window.location.reload();
  },
  (error) => {
    console.error('Error updating Leave Encashment:', error);
  
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
  
    searchFilteredEmployees(): any[] {
      if (!this.employeeSearch || this.employeeSearch.trim() === '') {
        return this.Employees;
      }
  
      const search = this.employeeSearch.toLowerCase().trim();
  
      return this.Employees.filter((emp: any) =>
        (emp.emp_code && emp.emp_code.toLowerCase().includes(search)) ||
        (emp.emp_first_name && emp.emp_first_name.toLowerCase().includes(search)) ||
        (emp.emp_last_name && emp.emp_last_name.toLowerCase().includes(search))
      );
    }
  
  
               
  
  
          searchQuery: string = '';
  
  
  // ==================== PAGINATION ====================
  currentPage: number = 1;
  itemsPerPage: number = 4;
  pagedLeaveBalances: any[] = [];
  
  /** Filtered list based on search (replaces old getter) */
  get filteredLeaveBalances(): any[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.LeaveBalances;
    }
  
    const search = this.searchQuery.toLowerCase().trim();
  
    return this.LeaveBalances.filter((docs: any) =>
      String(docs.leave_type ?? '').toLowerCase().includes(search) ||
      String(docs.employee ?? '').toLowerCase().includes(search)  ||
      String(docs.encashment_days ?? '').toLowerCase().includes(search) ||
      String(docs.status ?? '').toLowerCase().includes(search) ||
      String(docs.remarks ?? '').toLowerCase().includes(search)
    );
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredLeaveBalances.length / this.itemsPerPage);
  }
  
  
  
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedLeaveBalances = this.filteredLeaveBalances.slice(startIndex, endIndex);
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
  
  // Reset to page 1 when search changes
  onSearchChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }
  // =====





  // formula writer section


  // ---- New properties for formula writer ----

formulaVariables: string[] = [];
formula: string = '';
defaultFormula: string = '';   // store separately so we always have a fallback
formulaSearch: string = '';
showFormulaHelper: boolean = false;


// ---- Load available variables (call this when opening the modal) ----
loadFormulaVariables(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    console.error('No schema selected.');
    return;
  }

  this.leaveService.getEncashmentFormulaVariables(selectedSchema).subscribe({
    next: (result: any) => {
      // Dedupe variables
      this.formulaVariables = Array.from(new Set<string>(result.variables || []));

      this.defaultFormula = result.default_formula || '';

      // Pre-fill textarea with default only if user hasn't typed one yet
      if (!this.formula) {
        this.formula = this.defaultFormula;
      }
    },
    error: (error) => {
      console.error('Error fetching formula variables:', error);
    }
  });
}

// ---- Filtered list for the search box inside the helper panel ----
filteredFormulaVariables(): string[] {
  const search = this.formulaSearch.toLowerCase().trim();
  if (!search) return this.formulaVariables;
  return this.formulaVariables.filter(v => v.toLowerCase().includes(search));
}

// ---- Insert a variable at the current cursor position inside the textarea ----
insertVariable(variable: string): void {
  const textarea = this.formulaInputRef?.nativeElement;

  if (!textarea) {
    // Fallback: just append
    this.formula = (this.formula ? this.formula + ' ' : '') + variable;
    return;
  }

  const start = textarea.selectionStart ?? this.formula.length;
  const end = textarea.selectionEnd ?? this.formula.length;

  const before = this.formula.substring(0, start);
  const after = this.formula.substring(end);

  // Add spacing so tokens don't collide (e.g. "basic_salaryencashment_days")
  const needsLeadingSpace = before.length > 0 && !before.endsWith(' ');
  const insertText = (needsLeadingSpace ? ' ' : '') + variable + ' ';

  this.formula = before + insertText + after;

  // Restore focus + move cursor to right after the inserted variable
  setTimeout(() => {
    textarea.focus();
    const cursorPos = before.length + insertText.length;
    textarea.setSelectionRange(cursorPos, cursorPos);
  }, 0);
}

// ---- Insert an operator (+, -, *, /, (, )) ----
insertOperator(op: string): void {
  this.insertVariable(op);
}

// ---- Basic client-side sanity check before submit ----
isFormulaValid(formulaStr: string): boolean {
  if (!formulaStr || !formulaStr.trim()) return true;

  const tokens = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const unknown = tokens.filter(t => !this.formulaVariables.includes(t));

  return unknown.length === 0;
}

getUnknownFormulaTokens(formulaStr: string): string[] {
  const tokens = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  return tokens.filter(t => !this.formulaVariables.includes(t));
}
toggleFormulaHelper(): void {
  this.showFormulaHelper = !this.showFormulaHelper;
}

clearFormula(): void {
  this.formula = '';
}



// ---- New property ----
useCustomFormula: boolean = false;   // checkbox state — controls visibility of formula writer

// ---- Reset when checkbox is unchecked (optional but recommended) ----
onFormulaCheckboxChange(): void {
  if (!this.useCustomFormula) {
    // Clear whatever the user typed; submit will fall back to defaultFormula anyway
    this.formula = '';
    this.showFormulaHelper = false;
    this.formulaSearch = '';
  } else {
    // When checked, pre-fill with default so they have something to start editing
    if (!this.formula) {
      this.formula = this.defaultFormula;
    }
  }
}


// ---- New properties for formula view modal ----
isFormulaViewOpen: boolean = false;
selectedFormula: string = '';

// ---- Truncate long formulas for table preview ----
getFormulaPreview(formula: string): string {
  if (!formula) return '—';
  const maxLength = 30;
  return formula.length > maxLength
    ? formula.substring(0, maxLength) + '...'
    : formula;
}

// ---- Open modal showing full formula ----
viewFormula(docs: any): void {
  if (!docs.formula) return; // nothing to show
  this.selectedFormula = docs.formula;
  this.isFormulaViewOpen = true;
}

closeFormulaView(): void {
  this.isFormulaViewOpen = false;
  this.selectedFormula = '';
}
  

}
