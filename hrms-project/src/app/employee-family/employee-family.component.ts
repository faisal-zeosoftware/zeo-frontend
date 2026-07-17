import { Component, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EmployeeService } from '../employee-master/employee.service';
import { CountryService } from '../country.service';
import { environment } from '../../environments/environment';
import { SessionService } from '../login/session.service';

@Component({
  selector: 'app-employee-family',
  templateUrl: './employee-family.component.html',
  styleUrl: './employee-family.component.css'
})
export class EmployeeFamilyComponent {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  selectedDeparmentsecId:any | undefined;

  registerButtonClicked = false;
  registerButtonClicked1 = false;

  registerButtonClicked2 = false;

  registerButtonClicked3 = false;

  // Departments: any[] = [];
  companies: any[] = [];
  DocumentTypes: any[] = [];

  familyMembers: any[] = [
  {
    ef_member_name: '',
    emp_relation: '',
    ef_company_expence: '',
    ef_date_of_birth: '',
    custom_fields: []
  }
];

  ef_member_name: string = '';
  emp_relation:string ='';
  ef_company_expence:any ='';
  ef_date_of_birth:any='';
  // emp_id:any='';

  qualifications: any[] = [
  {
    emp_qualification: '',
    emp_qf_instituition: '',
    emp_qf_year: '',
    emp_qf_subject: '',
    custom_fields: []
  }
];

  emp_qualification:string='';
  emp_qf_instituition:string='';
  emp_qf_year:string='';
  emp_qf_subject  :string='';

  jobHistories: any[] = [
  {
    emp_jh_from_date: '',
    emp_jh_end_date: '',
    emp_jh_company_name: '',
    emp_jh_designation: '',
    emp_jh_leaving_salary_permonth: '',
    emp_jh_reason: '',
    emp_jh_years_experiance: '',
    custom_fields: []
  }
];
  emp_jh_from_date:string='';
  emp_jh_end_date:string='';
  emp_jh_company_name:string='';
  emp_jh_designation:string='';
  emp_jh_leaving_salary_permonth:string='';
  emp_jh_reason:string='';
  emp_jh_years_experiance:string='';


  start_date:string='';
  end_date:string='';
  status:string='';
  reason:string='';
  employee:string='';

documents: any[] = [
  {
    emp_doc_number: '',
    emp_doc_issued_date: '',
    emp_doc_expiry_date: '',
    document_type: '',
    selectedFile: null,
    custom_fields: []
  }
];
  emp_doc_name: any
  emp_doc_number: any;
  emp_doc_issued_date: string = '';
  emp_doc_expiry_date: string = '';
  // emp_id: string = '';
  document_type:any='';
  selectedFile!: File;
  emp_id: number;
  created_by:any='';


bankDetails: any[] = [
  {
    bank_name: '',
    account_number: '',
    iban_number: '',
    route_code: '',
    branch_name: '',
    bank_address: '',
    is_active: false
  }
];

  bank_name:string='';
  branch_name:string='';
  account_number:string='';
  bank_address:string='';
  route_code:string='';
  iban_number:string='';
  is_active: boolean = false;

  showOnlySection: string | null = null;

    private sectionMap: { [key: string]: number } = {
    'family': 0,
    'qualification': 1,
    'jobhistory': 2,
    'bank': 3,
    'documents': 4
  };

  step = 0; // default
      



  constructor(private EmployeeService: EmployeeService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private countryService: CountryService,
    private sessionService: SessionService,

   private ref:MatDialogRef<EmployeeFamilyComponent>,
   @Inject(MAT_DIALOG_DATA) public data: any,
   ) {
    this.emp_id = data.emp_id;

       this.showOnlySection = data.section || null;
  
  if (this.showOnlySection) {
    this.step = this.sectionMap[this.showOnlySection];
  }
  }
    
   


CreateEmployeeFamily() {

  this.familyMembers.forEach(member => {

    const familyData = {
      ef_member_name: member.ef_member_name,
      emp_relation: member.emp_relation,
      ef_company_expence: member.ef_company_expence,
      ef_date_of_birth: member.ef_date_of_birth
    };

    this.EmployeeService.registerEmpFamilyz(this.emp_id, familyData)
      .subscribe(res => {

        const familyId = res.id;

        member.custom_fields.forEach((field: any) => {

          const body = {
            emp_custom_field: field.emp_custom_field,
            field_value: field.field_value,
            emp_family: familyId,
            created_by: this.created_by
          };

          const schema = localStorage.getItem('selectedSchema');

          this.http.post(
            `${this.apiUrl}/employee/api/empfamily-customfieldvalue/?schema=${schema}`,
            body
          ).subscribe();

        });

      });

  });

  alert('All family members added successfully');
  window.location.reload();
}

createEmployeeQual() {

  this.qualifications.forEach(qualification => {

    const body = {
      emp_qualification: qualification.emp_qualification,
      emp_qf_instituition: qualification.emp_qf_instituition,
      emp_qf_year: qualification.emp_qf_year,
      emp_qf_subject: qualification.emp_qf_subject
    };

    this.EmployeeService
      .registerEmpQualificationz(this.emp_id, body)
      .subscribe(response => {

        const qualificationId = response.id;

        qualification.custom_fields.forEach((field: any) => {

          const customBody = {
            emp_custom_field: field.emp_custom_field,
            field_value: field.field_value,
            emp_qualification: qualificationId,
            created_by: this.created_by
          };

          const schema = localStorage.getItem('selectedSchema');

          this.http.post(
            `${this.apiUrl}/employee/api/empQualification-customfieldvalue/?schema=${schema}`,
            customBody
          ).subscribe();

        });

      });

      

  });

  alert('Qualifications added successfully.');
  window.location.reload();
}


createEmployeeJonHistory(): void {

  this.jobHistories.forEach(job => {

    const body = {
      emp_jh_from_date: job.emp_jh_from_date,
      emp_jh_end_date: job.emp_jh_end_date,
      emp_jh_company_name: job.emp_jh_company_name,
      emp_jh_designation: job.emp_jh_designation,
      emp_jh_leaving_salary_permonth: job.emp_jh_leaving_salary_permonth,
      emp_jh_reason: job.emp_jh_reason,
      emp_jh_years_experiance: job.emp_jh_years_experiance
    };

    this.EmployeeService.registerEmpJobHisz(this.emp_id, body)
      .subscribe({
        next: (response: any) => {

          const jobId = response.id;
          const schema = localStorage.getItem('selectedSchema');

          job.custom_fields.forEach((field: any) => {

            const customBody = {
              emp_custom_field: field.emp_custom_field,
              field_value: field.field_value,
              emp_job_history: jobId,
              created_by: this.created_by
            };

            this.http.post(
              `${this.apiUrl}/employee/api/empjob-history-customfieldvalue/?schema=${schema}`,
              customBody
            ).subscribe({
              error: (err) => {
                console.error('Custom field error:', err);
              }
            });

          });

          alert('Job history added successfully.');
          window.location.reload();

        },
        error: (error) => {
          console.error('Error adding job history:', error);

          const message =
            error.error?.message ||
            error.error?.detail ||
            JSON.stringify(error.error) ||
            'Something went wrong.';

          alert(message);
        }
      });

  });

}

createEmployeeLeaveReq():void{

  this.registerButtonClicked3 = true;
    const companyData = {
      start_date: this.start_date,
      end_date:this.end_date,
      status:this.status,
      reason:this.reason,
      employee:this.employee,


   

      // Add other form field values to the companyData object
    };


    this.EmployeeService.registerEmpLeaveReq(companyData).subscribe(
      (response) => {
        this.step++;
        console.log('Registration successful', response);
        // this.authService.login(this.cmpny_mail, this.cmpny_pincode).subscribe(
        //   (loginResponse) => {
        //     console.log('Login successful after registration', loginResponse);
        //     // Optionally, you can navigate to another page or perform other actions upon successful login.
            alert('Company has been Registered and logged in!');
            window.location.reload();

            // window.location.reload();
        //   },
        //   (loginError) => {
        //     console.error('Login failed after registration', loginError);
        //     // Handle login error after registration
        //   }
        // );
        // Optionally, you can navigate to another page or perform other actions upon successful registration.
        // alert('Company has been Register!')
        // window.location.reload();

      },
      (error) => {
        console.error('Registration failed', error);
        alert('enter all field!')
        // Handle the error appropriately, e.g., show a user-friendly error message.
      }
    );

}


createempbankdetails(): void {

  this.bankDetails.forEach(bank => {

    const body = {
      bank_name: bank.bank_name,
      branch_name: bank.branch_name,
      account_number: bank.account_number,
      bank_address: bank.bank_address,
      route_code: bank.route_code,
      iban_number: bank.iban_number,
      is_active: bank.is_active,
      emp_id: this.emp_id
    };

    this.EmployeeService.registerbankdetails(this.emp_id, body)
      .subscribe({
        next: (response: any) => {
          console.log('Bank detail added', response);

          alert('Bank added successfully.');
           
          const createdEmployeeId = response.id;
          this.EmployeeService.setEmployeeId(createdEmployeeId);

          this.step++;
           window.location.reload();
        },

        error: (error) => {
          console.error(error);

          let errorMessage = 'Something went wrong.';

          if (error.error && typeof error.error === 'object') {
            errorMessage = Object.values(error.error)
              .flat()
              .join('\n');
          }

          alert(errorMessage);
        }
      });

  });

}


calculateExperience(job: any): void {

  if (!job.emp_jh_from_date || !job.emp_jh_end_date) {
    job.emp_jh_years_experiance = '';
    return;
  }

  const from = new Date(job.emp_jh_from_date);
  const to = new Date(job.emp_jh_end_date);

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  job.emp_jh_years_experiance = `${years}.${months}`;
}







onFileSelected(event:any, doc:any){

  if(event.target.files.length){

      doc.selectedFile = event.target.files[0];

  }

}

uploadEmployeeDocument(){

  this.documents.forEach(doc=>{

      const formData=new FormData();

      formData.append('emp_doc_document',doc.selectedFile);

      formData.append('emp_doc_number',doc.emp_doc_number);

      formData.append('emp_doc_issued_date',doc.emp_doc_issued_date);

      formData.append('emp_doc_expiry_date',doc.emp_doc_expiry_date);

      formData.append('document_type',doc.document_type);

      this.EmployeeService
      .uploadEmployeeDocument(this.emp_id,formData)
      .subscribe(response=>{

          const documentId=response.id;

          doc.custom_fields.forEach((field:any)=>{

              const body={

                  emp_custom_field:field.emp_custom_field,

                  field_value:field.field_value,

                  emp_documents:documentId,

                  created_by:this.created_by

              };

              const schema=localStorage.getItem('selectedSchema');

              this.http.post(

              `${this.apiUrl}/employee/api/Documents-customfieldvalue/?schema=${schema}`,

              body

              ).subscribe();

          });

      });

  });

  alert("Documents uploaded successfully.");
  window.location.reload();

}
file:any ='';
visibilitys:boolean=false;
visibles:boolean=true;
ReadMore:boolean=false;
selectedFiles: File | null = null;

// onFileChange(event: any){
//   // this.file = event.target.files[0];
//   // console.log(this.file);

//   const input = event.target as HTMLInputElement;
//   if (input.files && input.files.length > 0) {
//     const file = input.files[0];
//     const validExtensions = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];

   
//   }
  
// }


onFileChange(event: any) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    // Allowed MIME types for Excel and CSV files.
    const validExtensions = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (validExtensions.includes(file.type)) {
      this.selectedFiles = file; // Set the file to your variable.
      console.log("Selected file:", file);
    } else {
      alert('Please select a valid Excel file.');
      this.selectedFiles = null;
    }
  }
}

 

bulkUploadDoc() {
  this.ReadMore = !this.ReadMore; //not equal to condition
  this.visibles = !this.visibles;
  this.visibilitys = !this.visibilitys;
}





    showUploadForm: boolean = false;

toggleUploadForm(): void {
  this.showUploadForm = !this.showUploadForm;
}



closeUploadForm(): void {
  this.showUploadForm = false;
}

  downloadDocumnetExcel(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;
    
      this.companyRegistrationService.downloadDocumnetExcel(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Document_template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }


    downloadDocumnetCsv(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) return;

      this.companyRegistrationService.downloadDocumnetCsv(selectedSchema).subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Document_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }




bulkuploaddocument(): void {
  if (!this.selectedFiles) {
    alert('Please select a valid Excel file before uploading.');
    return;
  }

  const formData = new FormData();
  formData.append('file', this.selectedFiles); // Ensure this matches the backend field name
  formData.append('emp_doc_number', this.emp_doc_number || '');
  formData.append('emp_doc_issued_date', this.emp_doc_issued_date || '');
  formData.append('emp_doc_expiry_date', this.emp_doc_expiry_date || '');
  formData.append('document_type', this.document_type || '');

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    alert('No schema selected.');
    return;
  }

  this.http.post(`${this.apiUrl}/employee/api/Bulkupload-Documents/bulk_upload/?schema=${selectedSchema}`, formData)
    .subscribe(
      (response) => {
        console.log('Bulk upload successful', response);
        alert('Bulk upload successful');
        window.location.reload();
      },
      (error) => {
        console.error('Bulk upload failed', error);
        alert(error.error || 'Error during bulk upload.');
      }
    );
}



  
 
schemas: string[] = []; // Array to store schema names

  
userId: number | null | undefined;
userDetails: any;
userDetailss: any[] = [];
username: any;

  ngOnInit(): void {
    this.loadDeparmentBranch();
    // this.loadStates();
    
    this.loadDocumentType();
    this.loadFormFields();
    this.loadFormFieldsFam();
    this.loadFormFieldsQual();

    this.loadFormFieldsJob();


    this.userId = this.sessionService.getUserId();
  
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        (userData: any) => {
          this.userDetails = userData;
          this.created_by = this.userId; // Automatically set the owner to logged-in user ID

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
 
  loadDeparmentBranch(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
    this.EmployeeService.getEmployees(selectedSchema).subscribe(
      (result: any) => {
        this.companies = result;
        console.log(' fetching employees:');

      },
      (error) => {
        console.error('Error fetching employees:', error);
      }
    );
    }
  }

  custom_fields :any[] = [];
  custom_fieldsFam :any[] = [];
  custom_fieldsQual :any[] = [];
  custom_fieldsJob :any[] = [];


loadFormFields(): void {

  const selectedSchema = this.authService.getSelectedSchema();

  if(selectedSchema){

    this.EmployeeService.getFormFieldDoc(selectedSchema)
    .subscribe(result=>{

      this.custom_fields = result;

      this.documents[0].custom_fields =
      JSON.parse(JSON.stringify(result));

    });

  }

}

addDocument(){

  this.documents.push({

    emp_doc_number:'',
    emp_doc_issued_date:'',
    emp_doc_expiry_date:'',
    document_type:'',
    selectedFile:null,
    custom_fields:JSON.parse(JSON.stringify(this.custom_fields))

  });

}

removeDocument(index:number){

  if(this.documents.length>1){

    this.documents.splice(index,1);

  }

}

  addBankDetail() {
  this.bankDetails.push({
    bank_name: '',
    account_number: '',
    iban_number: '',
    route_code: '',
    branch_name: '',
    bank_address: '',
    is_active: false
  });
}

removeBankDetail(index: number) {
  if (this.bankDetails.length > 1) {
    this.bankDetails.splice(index, 1);
  }
}



loadFormFieldsFam(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.EmployeeService.getFormFieldFam(selectedSchema).subscribe(
      (result: any) => {
        this.custom_fieldsFam = result;

        // Assign custom fields to first member
        this.familyMembers[0].custom_fields = JSON.parse(JSON.stringify(result));
      },
      (error) => {
        console.error(error);
      }
    );
  }
}

addFamilyMember() {
  this.familyMembers.push({
    ef_member_name: '',
    emp_relation: '',
    ef_company_expence: '',
    ef_date_of_birth: '',
    custom_fields: JSON.parse(JSON.stringify(this.custom_fieldsFam))
  });
}

removeFamilyMember(index: number) {
  if (this.familyMembers.length > 1) {
    this.familyMembers.splice(index, 1);
  }
}


loadFormFieldsQual(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.EmployeeService.getFormFieldQual(selectedSchema).subscribe(
      (result: any) => {
        this.custom_fieldsQual = result;

        this.qualifications[0].custom_fields =
          JSON.parse(JSON.stringify(result));
      },
      (error) => {
        console.error(error);
      }
    );
  }
}

addQualification() {
  this.qualifications.push({
    emp_qualification: '',
    emp_qf_instituition: '',
    emp_qf_year: '',
    emp_qf_subject: '',
    custom_fields: JSON.parse(JSON.stringify(this.custom_fieldsQual))
  });
}

removeQualification(index: number) {
  if (this.qualifications.length > 1) {
    this.qualifications.splice(index, 1);
  }
}


loadFormFieldsJob(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.EmployeeService.getFormFieldJob(selectedSchema).subscribe(
      (result: any) => {
        this.custom_fieldsJob = result;

        this.jobHistories[0].custom_fields =
          JSON.parse(JSON.stringify(result));
      },
      (error) => {
        console.error(error);
      }
    );
  }
}

addJobHistory() {
  this.jobHistories.push({
    emp_jh_from_date: '',
    emp_jh_end_date: '',
    emp_jh_company_name: '',
    emp_jh_designation: '',
    emp_jh_leaving_salary_permonth: '',
    emp_jh_reason: '',
    emp_jh_years_experiance: '',
    custom_fields: JSON.parse(JSON.stringify(this.custom_fieldsJob))
  });
}

removeJobHistory(index: number) {
  if (this.jobHistories.length > 1) {
    this.jobHistories.splice(index, 1);
  }
}


  ClosePopup(){
    this.ref.close('Closed using function');
    // window.location.reload();

  }

  Closefamup(){
      this.ref.close('Closed using function');
      // window.location.reload();

  }



  loadDocumentType(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

 console.log('schemastore',selectedSchema )
 // Check if selectedSchema is available
 if (selectedSchema) {
    this.countryService.getDocument(selectedSchema).subscribe(
      (result: any) => {
        this.DocumentTypes = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
 }
  }
  

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }


  postCustomFieldValues(empMasterId: number): void {
    const customFieldValues = this.custom_fields.map(field => ({
        emp_custom_field: field.emp_custom_field, // Assuming the field has an 'id' property
        field_value: field.field_value, // The value entered by the user
        emp_documents: empMasterId ,// The employee ID from the response
        created_by:this.created_by
    }));

    // Make API calls to post each custom field value
    customFieldValues.forEach(fieldValue => {
      const selectedSchema = localStorage.getItem('selectedSchema');
      if (!selectedSchema) {
        console.error('No schema selected.');
        // return throwError('No schema selected.'); // Return an error observable if no schema is selected
      }
        this.http.post(`${this.apiUrl}/employee/api/Documents-customfieldvalue/?schema=${selectedSchema}`, fieldValue)
            .subscribe(
                (response: any) => {
                    console.log('Custom field value posted successfully', response);
                },
                (error: HttpErrorResponse) => {
                    console.error('Failed to post custom field value', error);
                }
            );
    });
}



postCustomFieldValuesFam(empMasterId: number): void {
  const customFieldValues = this.custom_fieldsFam.map(field => ({
      emp_custom_field: field.emp_custom_field, // Assuming the field has an 'id' property
      field_value: field.field_value, // The value entered by the user
      emp_family: empMasterId ,// The employee ID from the response
      created_by:this.created_by
  }));

  // Make API calls to post each custom field value
  customFieldValues.forEach(fieldValue => {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
      this.http.post(`${this.apiUrl}/employee/api/empfamily-customfieldvalue/?schema=${selectedSchema}`, fieldValue)
          .subscribe(
              (response: any) => {
                  console.log('Custom field value posted successfully', response);
              },
              (error: HttpErrorResponse) => {
                  console.error('Failed to post custom field value', error);
              }
          );
  });
}




postCustomFieldValuesQual(empMasterId: number): void {
  const customFieldValues = this.custom_fieldsQual.map(field => ({
      emp_custom_field: field.emp_custom_field, // Assuming the field has an 'id' property
      field_value: field.field_value, // The value entered by the user
      emp_qualification: empMasterId ,// The employee ID from the response
      created_by:this.created_by
  }));

  // Make API calls to post each custom field value
  customFieldValues.forEach(fieldValue => {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
      this.http.post(`${this.apiUrl}/employee/api/empQualification-customfieldvalue/?schema=${selectedSchema}`, fieldValue)
          .subscribe(
              (response: any) => {
                  console.log('Custom field value posted successfully', response);
              },
              (error: HttpErrorResponse) => {
                  console.error('Failed to post custom field value', error);
              }
          );
  });
}


postCustomFieldValuesJob(empMasterId: number): void {
  const customFieldValues = this.custom_fieldsJob.map(field => ({
      emp_custom_field: field.emp_custom_field, // Assuming the field has an 'id' property
      field_value: field.field_value, // The value entered by the user
      emp_job_history: empMasterId ,// The employee ID from the response
      created_by:this.created_by
  }));

  // Make API calls to post each custom field value
  customFieldValues.forEach(fieldValue => {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
      this.http.post(`${this.apiUrl}/employee/api/empjob-history-customfieldvalue/?schema=${selectedSchema}`, fieldValue)
          .subscribe(
              (response: any) => {
                  console.log('Custom field value posted successfully', response);
              },
              (error: HttpErrorResponse) => {
                  console.error('Failed to post custom field value', error);
              }
          );
  });
}


}
