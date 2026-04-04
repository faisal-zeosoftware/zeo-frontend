import { Component , OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
@Component({
  selector: 'app-designation-creation',
  templateUrl: './designation-creation.component.html',
  styleUrl: './designation-creation.component.css'
})
export class DesignationCreationComponent {


  private apiUrl = `${environment.apiBaseUrl}`;
  @ViewChild('select') select: MatSelect | undefined;  // Use the correct `apiBaseUrl` for live and local

  selectedFiles! : File;
  selectedFile!: File;
  file:any ='';
  selectedDeparmentsecId:any | undefined;

  registerButtonClicked = false;
  Departments: any[] = [];

  desgntn_job_title: string = '';
  desgntn_description:string ='';
  desgntn_code:string ='';

  visibilitys:boolean=false;
  visibles:boolean=true;
  ReadMore:boolean=false;
  // dialog: any;
  branch_id:any ='';
  error: any[]=[];
  errormessage:any;
  errors_Sheet1: any;

  errors_sheet1:any='';

  branch:any='';

  Branches: any[] = [];


  constructor(private DepartmentServiceService: DepartmentServiceService,
    private DesignationService: DesignationService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private dialog: MatDialog,
   private ref:MatDialogRef<DesignationCreationComponent>) {}

   onFileChange(event: any){
    this.file = event.target.files[0];
    console.log(this.file);
    
  }
   onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }
  bulkUploadDoc() {
    this.ReadMore = !this.ReadMore; //not equal to condition
    this.visibles = !this.visibles;
    this.visibilitys = !this.visibilitys;
  }
  // uploadFile(){
  //   let formData = new FormData();
  //   formData.append('file',this.file);
  //   formData.append('desgntn_job_title', this.desgntn_job_title);
  
  //     formData.append('desgntn_description', this.desgntn_description);
  //     this.Flag = false;
  //     const selectedSchema = localStorage.getItem('selectedSchema');
  //     if (!selectedSchema) {
  //       console.error('No schema selected.');
  //       // return throwError('No schema selected.'); // Return an error observable if no schema is selected
  //     }
     
     
  //     // return this.http.put(apiUrl, formData);
  
    
  //     this.http.post(`http://${selectedSchema}.localhost:8000/organisation/api/Desigtn-bulkupload/bulk_upload/`, formData).subscribe(
  //       (data) => {
  //         console.log(data);
  //         this.Flag = true;
  //         alert('Excel Uploaded Successfully');
  //       },
  //       (error: any) => {
  //         console.log('Error:', error); // Log the entire error object for debugging
      
  //         this.errormessage = error;
  //         alert('File upload failed. Check console for error details.');
      
  //         // Safely access the error details
  //         if (error && error.error && error.error.errors_sheet1) {
  //           const errorsSheet1 = error.error.errors_sheet1;
      
  //           // Check if errors_sheet1 is an array
  //           if (Array.isArray(errorsSheet1)) {
  //             // Extract and format error details
  //             const formattedErrors = errorsSheet1.map((err: any) => {
  //               return `Row ${err.row}: ${err.error}`;
  //             }).join('\n');
      
  //             alert(`Error details:\n${formattedErrors}`);
  //             this.errors_sheet1 = JSON.stringify(errorsSheet1); // Assigning the error to consoleError variable
  //           } else {
  //             alert('Unexpected error format.');
  //           }
  //         } else {
  //           alert('Error details are not available.');
  //         }
      
  //         console.log('Error fetching bulk list:', error);
      
  //         // Fetch bulk list
  //         this.EmployeeService.getBulkList().subscribe(
  //           (bulkListError) => {
  //             alert('Error fetching bulk list: ' + JSON.stringify(bulkListError));
  //           }
  //         );
  //       }
  //     );
      
  // }
  bulkuploaddocument(): void {
    this.registerButtonClicked = true;
  
  
    const formData = new FormData();
    formData.append('file',this.selectedFiles);
  
    formData.append('file',this.file)
    
    formData.append('desgntn_job_title', this.desgntn_job_title);
  
    formData.append('desgntn_description', this.desgntn_description);
    
    formData.append('branch', this.branch);
  
    
  
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
   
   
    // return this.http.put(apiUrl, formData);

  
    this.http.post(`${this.apiUrl}/organisation/api/Desigtn-bulkupload/bulk_upload/?schema=${selectedSchema}`, formData)
      .subscribe((response) => {
        // Handle successful upload
        console.log('bulkupload upload successful', response);
        alert("bulkupload upload successful");
        window.location.reload();
  
      }, (error) => {
        // Handle upload error
        console.error('Designations upload failed', error);
        alert('enter all fields correctly');
      });
  
  }


registerDesignation(): void {
  this.registerButtonClicked = true;

  // Basic validation for required fields
  if (!this.desgntn_job_title || !this.branch) {
    if (!this.desgntn_job_title) {
      alert('Job Title field is blank.');
    }
    if (!this.branch) {
      alert('Job Branch field is blank.');
    }
    return; // Stop if local validation fails
  }

  const companyData = {
    desgntn_job_title: this.desgntn_job_title,
    branch: this.branch,
    desgntn_description: this.desgntn_description,
    desgntn_code: this.desgntn_code,
  };

  this.DesignationService.registerDesignation(companyData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Designation has been registered successfully.');
      window.location.reload();
    },
    (error) => {
      console.error('Registration failed', error);

      let errorMessage = 'Something went wrong.';

      // If backend sends field-level errors like { field: ["msg"] }
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
        // If backend sends a general message like { detail: "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Registration failed!\n\n${errorMessage}`);
    }
  );
}

  ngOnInit(): void {
     this.loadDeparmentBranch();


   
  }


  // loadDeparmentBranch(): void {
    
  // const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  // console.log('schemastore',selectedSchema )
  // // Check if selectedSchema is available
  // if (selectedSchema) {
  //   this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
  //     (result: any) => {
  //       this.Departments = result;
  //       console.log(' fetching Companies:');

  //     },
  //     (error) => {
  //       console.error('Error fetching Companies:', error);
  //     }
  //   );
  // }
  // }


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
          this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
        } else {
          this.Branches = result; // Fallback: show all if nothing is selected in sidebar
        }
        // Inside the subscribe block of loadDeparmentBranch
        if (this.Branches.length === 1) {
          this.branch = this.Branches[0].id;
        }

        console.log('Filtered branches for selection:', this.Branches);
        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching branches:', error);
      }
    );
  }
}




  ClosePopup(){
    this.ref.close('Closed using function')
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


  allSelected=false;

  branchSearch: string = '';
  
  filterEmployees() {

  if (!this.branchSearch) {
    return this.Branches;
  }

  return this.Branches.filter((deparmentsec: any) =>
    deparmentsec.branch_name.toLowerCase().includes(this.branchSearch.toLowerCase())
  );

}



}
