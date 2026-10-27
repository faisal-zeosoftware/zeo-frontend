import { Component,Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route,ActivatedRoute } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentCreationComponent } from '../department-creation/department-creation.component';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { EmployeeFamilyComponent } from '../employee-family/employee-family.component';
import { EmployeeService } from '../employee-master/employee.service';
import { CountryService } from '../country.service';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-document-edit',
  templateUrl: './document-edit.component.html',
  styleUrl: './document-edit.component.css'
})
export class DocumentEditComponent {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  Departments: any[] = [];
  Employees: any[] = [];
  DocsTypes: any[] = [];


  emp_doc_number:string='';
  emp_doc_issued_date:string='';
  emp_doc_expiry_date:string='';
  emp_id:string='';
  document_type:string='';


  selectedFile: File | undefined; // New file selected by the user


  registerButtonClicked=false;
  

  department: any;
  departmentId: number;
  documentData: any;
  ref: any;
  

  constructor(
    private dialogRef: MatDialogRef<DocumentEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentId: number },
    private departmentService: DepartmentServiceService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthenticationService,
    private countryService: CountryService


  ) {
    this.departmentId = data.departmentId;
  }



  ngOnInit(): void {

// Use the departmentId from dialog data directly
this.retrieveDocumentData();

// Alternatively, if you need to support retrieving id from route parameters as well:
this.route.params.subscribe(params => {
  const paramId = params['id'];
  if (paramId) {
    this.departmentId = +paramId;
    this.retrieveDocumentData();
  }
});

    this.loadDeparmentBranch();
    this.loadEmployee();
    this.loadDocType();
    


  }


  retrieveDocumentData(): void {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema || !this.departmentId) return;

    const apiUrl = `${this.apiUrl}/employee/api/emp-Documents/${this.departmentId}/?schema=${selectedSchema}`;
    
    this.http.get(apiUrl).subscribe(
        (data: any) => {
            this.documentData = data;
            console.log('Fetched Document Data:', this.documentData);

            // Ensure Employees and DocsTypes are loaded before setting values
            this.setDropdownValues();
        },
        (error) => console.error('Error fetching document data:', error)
    );
}

setDropdownValues(): void {
    if (!this.Employees || !this.DocsTypes) return;

    const empExists = this.Employees.some(emp => emp.id === this.documentData.emp_id);
    if (!empExists) console.warn('Employee ID not found in dropdown list.');

    const docTypeExists = this.DocsTypes.some(doc => doc.id === this.documentData.document_type);
    if (!docTypeExists) console.warn('Document Type ID not found in dropdown list.');
}



  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  updateDocument(): void {
    // v1.40.1: the renewed copy is sent only when one was chosen (an empty value is not a file), the employee goes as
    // its id (GET shows the name in emp_id, which the API rejected), and the API's own message is shown on failure.
    this.registerButtonClicked = true;
    const d = this.documentData || {};
    if (!d.emp_doc_number || !d.emp_doc_issued_date || !d.emp_doc_expiry_date || !d.document_type) { alert('Document number, issue date, expiry date and document type are required.'); return; }
    if (d.emp_doc_expiry_date <= d.emp_doc_issued_date) { alert('The expiry date must be after the issue date.'); return; }
    const formData = new FormData();
    if (this.selectedFile) { formData.append('emp_doc_document', this.selectedFile); }
    formData.append('emp_doc_number', d.emp_doc_number);
    formData.append('emp_doc_issued_date', d.emp_doc_issued_date);
    formData.append('emp_doc_expiry_date', d.emp_doc_expiry_date);
    formData.append('document_type', d.document_type);
    if (d.emp_id_id) { formData.append('emp_id', String(d.emp_id_id)); }
  
    this.employeeService.updateCategory(this.documentData.id, formData)
      .subscribe((response) => {
        console.log('Document updated successfully', response);
        alert('Document updated successfully ');
        this.closeDialog(true);
      }, (error) => {
        console.error('Failed to update document', error);
        const e = error?.error;
        const msg = e && typeof e === 'object' ? Object.keys(e).map(k => `${k}: ${Array.isArray(e[k]) ? e[k].join(', ') : e[k]}`).join('\n') : (typeof e === 'string' ? e.slice(0, 300) : '');
        alert('Failed to update the document.' + (msg ? '\n' + msg : ' Please try again.'));
      });
  }
  




  loadDeparmentBranch(): void {


    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.employeeService.getDocs(selectedSchema).subscribe(
      (result: any) => {
        this.Departments = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
    }
  }

  handleImageError(event: any): void {
    // console.error('Error loading image:', event);

    
  }



  isImage(src: string | null | undefined): boolean {
    // v1.40.1: a document without a file (null) broke the whole dialog – the form stayed empty
    const s = String(src || '').toLowerCase().split('?')[0];
    return /\.(jpe?g|png|gif|webp)$/.test(s);
  }

  // updateCategory(): void {
  //   // Update employee document
  //   this.employeeService.updateCategory(this.department.id, this.department).subscribe(
  //     (response) => {
  //       console.log('Document updated successfully:', response);
  //       // Close the dialog when document is updated
  //       alert('Document Updated');
  //       this.dialogRef.close();
  //     },
  //     (error) => {
  //       console.error('Error updating document:', error);
  //     }
  //   );
  // }


  loadEmployee(): void {

    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    // v1.40.1: the light employee list (code + name) instead of the full employee records
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
      (result: any) => {
        this.Employees = Array.isArray(result) ? result : (result?.results || []);
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
}


  
  loadDocType(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.countryService.getDocument(selectedSchema).subscribe(
      (result: any) => {
        this.DocsTypes = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
    }
  }

  employeeSearch: string = '';
allEmployeesSelected: boolean = false;

toggleAllEmployees() {

  if (this.allEmployeesSelected) {

    this.documentData.employee = this.Employees.map((emp: any) => emp.id);

  } else {

    this.documentData.employee = [];

  }

}

filterEmployees() {

  if (!this.employeeSearch) {
    return this.Employees;
  }

  return this.Employees.filter((emp: any) =>
    emp.emp_first_name.toLowerCase().includes(this.employeeSearch.toLowerCase())
  );

}


 
  ClosePopups(){
    this.closeDialog(false);   // v1.40.1: close the dialog (the list reloads itself) instead of reloading the page
  }

  /** v1.40.1: closes the dialog when opened as one; a page reload only when there is no dialog to close. */
  private closeDialog(changed: boolean): void {
    try { if (this.dialogRef) { this.dialogRef.close(changed); return; } } catch { /* not a dialog */ }
    window.location.reload();
  }


}
