import { Component , Inject, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EmployeeService } from '../employee-master/employee.service'; 
import { EmployeeFamilyComponent } from '../employee-family/employee-family.component';
import { SuccesModalComponent } from '../succes-modal/succes-modal.component';
import { catchError, map, of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
// import { EmployeeAddMoreFieldComponent } from '../employee-add-more-field/employee-add-more-field.component';
export interface Employee {
  emp_code: string;
  id?: number; // Optional, only if you have an id
}


@Component({
  selector: 'app-uesr-employee',
  templateUrl: './uesr-employee.component.html',
  styleUrl: './uesr-employee.component.css'
})

export class UesrEmployeeComponent implements OnInit {

  private apiUrl = `${environment.apiBaseUrl}`;

  id: string = '';
  employeeId: number | null = null;
  selectedEmp: Employee | null = null;
  empCodeToIdMap: { [key: string]: number } = {};

  selectedFile!: File | null;
  imagePreview: any;
  selectedDeparmentsecId: any | undefined;

  public companies: any[] = [];
  public userss: any[] = [];
  public branches: any[] = [];
  public countries: any[] = [];
  public states: any[] = [];
  public departments: any[] = [];
  public designations: any[] = [];
  public catogories: any[] = [];
  public languages: any[] = [];

  registerButtonClicked = false;
  employees: Employee[] = [];
  nationalities: any[] = [];
  religions: any[] = [];

  // Employee fields
  emp_code: string = '';
  emp_first_name: string = '';
  emp_last_name: string = '';
  emp_gender: any = '';
  emp_date_of_birth: any = '';
  emp_personal_email: any = '';
  emp_company_email: any = '';
  emp_mobile_number_1: any = '';
  emp_mobile_number_2: any = '';
  emp_city: any = '';
  emp_permenent_address: any = '';
  emp_present_address: any = '';
  emp_relegion: any = '';
  emp_blood_group: any = '';
  emp_nationality: any = '';
  emp_marital_status: any = '';
  emp_father_name: any = '';
  emp_mother_name: any = '';
  emp_posting_location: any = '';
  emp_country_id: any = '';
  emp_state_id: any = '';
  emp_company_id: any = '';
  emp_branch_id: any = '';
  emp_dept_id: any = '';
  emp_desgntn_id: any = '';
  emp_ctgry_id: any = '';
  emp_languages: any = '';
  emp_joined_date: any = '';
  emp_date_of_confirmation: any = '';
  person_id: any = '';
  work_location: any = '';
  visa_location: any = '';
  users: any = '';
  selectedUser: any;
  Emp: any;

  emp_profile_pic: string | undefined;
  is_ess: boolean = false;
  emp_status: boolean = false;
  employee: any;
  isUserSelectDisabled: boolean = true;

  // Field labels
  nationFieldName: string = 'Nationality';
  religionFieldName: string = 'Religion';
  Nationations: any[] = [];
  Religions: any[] = [];
  state_label: string = '';

  // Accordion states
  basicSectionOpen: boolean = true;
  personalSectionOpen: boolean = false;

  selectedCompany: any;

  constructor(
    private EmployeeService: EmployeeService,
    private CountryService: CountryService,
    private companyRegistrationService: CompanyRegistrationService,
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private ref: MatDialogRef<UesrEmployeeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MAT_DIALOG_DATA) public datas: { employeeId: number }
  ) {
    this.users = data.userId;
  }

  // =========================
  // FILE UPLOAD
  // =========================
  onFileSelected(event: any): void {
    const file = event.target.files.length > 0 ? event.target.files[0] : null;
    this.selectedFile = file;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // =========================
  // ACCORDION TOGGLE
  // =========================
  toggleSection(section: string): void {
    if (section === 'basic') {
      this.basicSectionOpen = !this.basicSectionOpen;
    }
    if (section === 'personal') {
      this.personalSectionOpen = !this.personalSectionOpen;
    }
  }

  // =========================
  // NG ON INIT
  // =========================
  ngOnInit(): void {
    console.log('ngOnInit - selectedEmployee:', this.emp_code);
    this.loadCountries();
    this.loadCompanies();
    this.loadbranches();
    this.loadDepartments();
    this.loadDesignation();
    this.loadcatg();
    this.loadLanguages();
    this.loadUsers();
    this.loadNationality();
    this.loadReligoin();
    this.fetchEmployees();
    this.id = '2';

    this.route.params.subscribe(params => {
      this.employee = params['id'];
    });

    const employeeIdParam = this.route.snapshot.paramMap.get('id');
  }

  // =========================
  // FETCH EMPLOYEES
  // =========================
  fetchEmployees(): void {
    const selectedSchema = this.selectedCompany?.schema_name;
    if (!selectedSchema) {
      console.error('No schema selected.');
      return;
    }
    const apiUrl = `${this.apiUrl}/employee/api/Employee/filter_empty_user_non_ess/?schema=${selectedSchema}`;
    this.http.get<Employee[]>(apiUrl).subscribe(
      (data) => {
        this.employees = data;
        this.empCodeToIdMap = this.employees.reduce((map, employee) => {
          if (employee.id != null) {
            map[employee.emp_code] = employee.id;
          } else {
            console.warn(`Employee with code ${employee.emp_code} does not have a valid ID.`);
          }
          return map;
        }, {} as { [key: string]: number });
        console.log('Employees fetched:', this.employees);
        console.log('Employee Code to ID Map:', this.empCodeToIdMap);
      },
      (error) => {
        console.error('Error fetching employee data', error);
      }
    );
  }

  createEmpCodeToIdMap(employees: Employee[]): { [key: string]: number } {
    const map: { [key: string]: number } = {};
    employees.forEach(employee => {
      if (employee.id) {
        map[employee.emp_code] = employee.id;
      }
    });
    return map;
  }

  // =========================
  // UPLOAD EMPLOYEE DOCUMENT
  // =========================
  uploadEmployeeDocument(): void {
    this.registerButtonClicked = true;

    const requiredFields = [
      { field: this.emp_code, fieldName: 'Employee Code', section: 'basic', elementId: 'emp_code' },
      { field: this.emp_first_name, fieldName: 'First Name', section: 'basic', elementId: 'emp_first_name' },
      { field: this.emp_branch_id, fieldName: 'Branch', section: 'basic', elementId: 'emp_branch_id' },
      { field: this.emp_dept_id, fieldName: 'Department', section: 'basic', elementId: 'emp_dept_id' },
      { field: this.emp_desgntn_id, fieldName: 'Designation', section: 'basic', elementId: 'emp_desgntn_id' },
      { field: this.emp_ctgry_id, fieldName: 'Category', section: 'basic', elementId: 'emp_ctgry_id' },
      { field: this.emp_joined_date, fieldName: 'Join Date', section: 'basic', elementId: 'emp_joined_date' },
      { field: this.emp_nationality, fieldName: 'Nationality', section: 'personal', elementId: 'emp_nationality' }
    ];

    for (const item of requiredFields) {
      if (!item.field || item.field === '' || item.field === null) {
        if (item.section === 'basic') {
          this.basicSectionOpen = true;
        }
        if (item.section === 'personal') {
          this.personalSectionOpen = true;
        }
        setTimeout(() => {
          const element = document.getElementById(item.elementId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            element.classList.add('shake-error');
          }
        }, 200);
        alert(`${item.fieldName} is required`);
        return;
      }
    }

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('emp_profile_pic', this.selectedFile);
    } else {
      formData.append('emp_profile_pic', '');
    }

    let formattedDate = '';
    if (this.emp_date_of_confirmation && this.emp_date_of_confirmation !== '') {
      const selectedDate = new Date(this.emp_date_of_confirmation);
      if (!isNaN(selectedDate.getTime())) {
        formattedDate = selectedDate.toISOString().split('T')[0];
      }
    }

    let formattedJoinedDate = '';
    if (this.emp_joined_date && this.emp_joined_date !== '') {
      const joinedDate = new Date(this.emp_joined_date);
      if (!isNaN(joinedDate.getTime())) {
        formattedJoinedDate = joinedDate.toISOString().split('T')[0];
      }
    }

    formData.append('emp_code', this.emp_code || '');
    formData.append('users', this.users || '');
    formData.append('emp_first_name', this.emp_first_name || '');
    formData.append('emp_last_name', this.emp_last_name || '');
    formData.append('emp_gender', this.emp_gender || '');
    formData.append('emp_date_of_birth', this.emp_date_of_birth || '');
    formData.append('emp_personal_email', this.emp_personal_email || '');
    formData.append('emp_company_email', this.emp_company_email || '');
    formData.append('emp_mobile_number_1', this.emp_mobile_number_1 || '');
    formData.append('emp_mobile_number_2', this.emp_mobile_number_2 || '');
    formData.append('emp_city', this.emp_city || '');
    formData.append('emp_permenent_address', this.emp_permenent_address || '');
    formData.append('emp_present_address', this.emp_present_address || '');
    formData.append('emp_relegion', this.emp_relegion || '');
    formData.append('emp_blood_group', this.emp_blood_group || '');
    formData.append('emp_nationality', this.emp_nationality || '');
    formData.append('emp_marital_status', this.emp_marital_status || '');
    formData.append('emp_father_name', this.emp_father_name || '');
    formData.append('emp_mother_name', this.emp_mother_name || '');
    formData.append('emp_posting_location', this.emp_posting_location || '');
    formData.append('emp_country_id', this.emp_country_id || '');
    formData.append('emp_state_id', this.emp_state_id || '');
    formData.append('emp_company_id', this.emp_company_id || '');
    formData.append('emp_branch_id', this.emp_branch_id || '');
    formData.append('emp_dept_id', this.emp_dept_id || '');
    formData.append('emp_desgntn_id', this.emp_desgntn_id || '');
    formData.append('emp_ctgry_id', this.emp_ctgry_id || '');
    formData.append('emp_languages', this.emp_languages || '');
    formData.append('emp_date_of_confirmation', formattedDate || '');
    formData.append('emp_joined_date', formattedJoinedDate || '');
    formData.append('person_id', this.person_id || '');
    formData.append('work_location', this.work_location || '');
    formData.append('visa_location', this.visa_location || '');
    formData.append('is_ess', this.is_ess ? '1' : '0');
    formData.append('emp_status', this.emp_status ? '1' : '0');

    console.log('Selected Company:', this.selectedCompany);

    if (this.selectedCompany) {
      const companyName = this.selectedCompany.schema_name;
      console.log(`Submitting to: ${this.apiUrl}/employee/api/Employee/?schema=${companyName}`);

      this.http.post(`${this.apiUrl}/employee/api/Employee/?schema=${companyName}`, formData)
        .subscribe({
          next: (response) => {
            console.log('Response:', response);
            window.alert('Connect User to employee Updated successfully!');
          },
          error: (error) => {
            console.error('Error:', error);
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
                errorMessage = messages.join('\\n');
              }
            } else if (error.error?.detail) {
              errorMessage = error.error.detail;
            }
            window.alert(`Registration failed!\\n\\n${errorMessage}`);
          }
        });
    } else {
      window.alert('No company selected. Please select a company first.');
    }
  }

  // =========================
  // UPLOAD USER DOCUMENT
  // =========================
  uploaduserDocument(): void {
    if (!this.selectedEmp || !this.selectedCompany) {
      console.error('Employee or company details are missing.');
      window.alert('Please ensure all required fields are filled before submitting.');
      return;
    }

    const empCode = this.selectedEmp.emp_code;
    const empId = this.empCodeToIdMap[empCode];

    if (!empId) {
      console.error('Employee ID not found for selected emp_code.');
      window.alert('Invalid employee selected.');
      return;
    }

    const formData = new FormData();
    formData.append('users', this.users);
    formData.append('emp_code', empCode);
    formData.append('selectedEmployee', empCode);
    formData.append('company', JSON.stringify(this.selectedCompany));

    const companyName = this.selectedCompany.schema_name;
    const apiUrl = `${this.apiUrl}/employee/api/Employee/${empId}/?schema=${companyName}`;

    console.log(`Submitting to: ${apiUrl}`);

    this.http.patch(apiUrl, formData).subscribe({
      next: (response) => {
        console.log('Connect employee to user updated successfully:', response);
        window.alert('Employee Details Updated');
        window.location.reload();
      },
      error: (error) => {
        console.error('Error updating the form:', error);
        let errorMessage = '';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.detail) {
            errorMessage = error.error.detail;
          } else {
            errorMessage = Object.values(error.error).flat().join('\\n');
          }
        } else {
          errorMessage = error.message || 'An unknown error occurred';
        }
        window.alert(errorMessage);
      }
    });
  }

  // =========================
  // EVENT HANDLERS
  // =========================
  onEmployeeChange(): void {
    if (this.selectedEmp) {
      const empCode = this.selectedEmp.emp_code;
      const empId = this.empCodeToIdMap[empCode];
      if (empId) {
        console.log('Selected Employee ID:', empId);
        console.log('Selected Employee Code:', empCode);
      } else {
        console.error('Employee ID not found for selected emp_code.');
      }
    } else {
      console.log('No employee selected.');
    }
  }

  setEmpCode(code: string): void {
    console.log('Setting emp_code:', code);
    this.emp_code = code;
  }

  onCompanyChange(): void {
    console.log('Selected Company Name:', this.selectedCompany?.schema_name);
    this.fetchEmployees();
    this.loadNationality();
    this.loadReligoin();
    this.emp_code = '';
  }

  enableUserSelect(): void {
    this.isUserSelectDisabled = false;
  }

  // =========================
  // LOAD DATA
  // =========================
  loadCountries(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.CountryService.getCountriesList(selectedSchema).subscribe(
        (result: any) => { this.countries = result; },
        (error: any) => { console.error('Error fetching countries:', error); }
      );
    }
  }

  loadNationality(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.CountryService.getNationality(selectedSchema).subscribe(
        (result: any) => { this.Nationations = result; },
        (error: any) => { console.error('Error fetching nationalities:', error); }
      );
    }
  }

  loadReligoin(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.CountryService.getReligionList(selectedSchema).subscribe(
        (result: any) => { this.Religions = result; },
        (error: any) => { console.error('Error fetching religions:', error); }
      );
    }
  }

  loadStates(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.CountryService.getAllStatesList(selectedSchema).subscribe(
        (result: any) => { this.states = result; },
        (error) => { console.error('Error fetching states:', error); }
      );
    }
  }

  onCountryChange(): void {
    if (this.emp_country_id !== undefined) {
      this.loadStatesByCountry();
    }
  }

  loadStatesByCountry(): void {
    if (!this.emp_country_id) {
      console.error('Country ID is null or undefined.');
      return;
    }
    this.CountryService.getStatesByCountryId(this.emp_country_id).subscribe(
      (result: any) => {
        console.log('State Response:', result);
        this.states = result.states;
        this.state_label = result.state_label;
      },
      (error: any) => { console.error('Error fetching states:', error); }
    );
  }

  loadCompanies(): void {
    this.companyRegistrationService.getCompany().subscribe(
      (result: any) => { this.companies = result; },
      (error: any) => { console.error('Error fetching companies:', error); }
    );
  }

  loadUsers(): void {
    this.companyRegistrationService.getUsers().subscribe(
      (result: any) => { this.userss = result; },
      (error: any) => { console.error('Error fetching users:', error); }
    );
  }

  loadbranches(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.companyRegistrationService.getBranchesList(selectedSchema).subscribe(
        (result: any) => { this.branches = result; },
        (error: any) => { console.error('Error fetching branches:', error); }
      );
    }
  }

  loadDepartments(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.companyRegistrationService.getDepartmentsList(selectedSchema).subscribe(
        (result: any) => { this.departments = result; },
        (error: any) => { console.error('Error fetching departments:', error); }
      );
    }
  }

  loadDesignation(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.companyRegistrationService.getDesignationList(selectedSchema).subscribe(
        (result: any) => { this.designations = result; },
        (error: any) => { console.error('Error fetching designations:', error); }
      );
    }
  }

  loadcatg(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.companyRegistrationService.getcatgoriesList(selectedSchema).subscribe(
        (result: any) => { this.catogories = result; },
        (error: any) => { console.error('Error fetching categories:', error); }
      );
    }
  }

  loadLanguages(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema);
    if (selectedSchema) {
      this.CountryService.getLanguagesList(selectedSchema).subscribe(
        (result: any) => { this.languages = result; },
        (error: any) => { console.error('Error fetching languages:', error); }
      );
    }
  }

  ClosePopup() {
    this.ref.close('Closed using function');
  }
}

