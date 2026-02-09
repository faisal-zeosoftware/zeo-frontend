import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, AfterViewInit ,Inject, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


declare var $: any;
import 'summernote'; // Ensure you have summernote imported
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-email-template-edit',
  templateUrl: './email-template-edit.component.html',
  styleUrl: './email-template-edit.component.css'
})
export class EmailTemplateEditComponent {

    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;



  body: any;
  templateData: any;

  RequestType:any []=[];

  
  branch: number[] = [];

  branches:any []=[];
  allSelectedBrach=false;




  constructor(
    private el:ElementRef,
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private DepartmentServiceService: DepartmentServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EmailTemplateEditComponent>,

    private ref:MatDialogRef<EmailTemplateEditComponent>,

) {
  this.templateData = data.template; // Get the selected template data

}


EmailPlaceHolders: string[] = []; // Initialize as an empty array

selectedPlaceholder: string | null = null; // To keep track of the selected placeholder


ngOnInit(): void {
 
  this.loadRequestType();
  this.loadEmailPlaceholders(); 
   this.loadDeparmentBranch();



 
}


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

    
mapBranchesNameToId() {
  if (!this.branches || !Array.isArray(this.templateData?.branch)) return;

  this.templateData.branch = this.branches
    .filter((b: any) => this.templateData.branch.includes(b.branch_name))
    .map((b: any) => b.id);

  console.log('Mapped branch IDs:', this.templateData.branch);
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

  
loadEmailPlaceholders(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  console.log('schemastore', selectedSchema);
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.employeeService.getEmailPlaceholder(selectedSchema).subscribe(
      (result: any) => {
        this.EmailPlaceHolders = result.employee; // Assuming the response structure
        console.log('EmailPlaceHolders:', this.EmailPlaceHolders);
      },
      (error) => {
        console.error('Error fetching EmailPlaceHolders:', error);
      }
    );
  }
}

    selectedPlaceholders: string[] = []; // Store multiple placeholders


selectPlaceholder(placeholder: string): void {
  const currentContent = $(this.el.nativeElement).find('#summernote').summernote('code');
  
  const updatedContent = currentContent + ' ' + placeholder;
  $(this.el.nativeElement).find('#summernote').summernote('code', updatedContent);

  this.selectedPlaceholders.push(placeholder); // Allow duplicates
}



ngAfterViewInit(): void {
  const editor = $(this.el.nativeElement).find('#summernote');

  editor.summernote({
    height: 150,
    placeholder: 'Type your text here...',
    toolbar: [
      ['style', ['bold', 'italic', 'underline']],
      ['fontsize', ['fontsize']],
      ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['insert', ['link', 'picture', 'video']],
      ['view', ['fullscreen', 'codeview', 'help']]
    ],
    callbacks: {
      onChange: () => this.onContentChange()
    }
  });

  // ✅ Set initial body content into Summernote
  if (this.templateData && this.templateData.body) {
    editor.summernote('code', this.templateData.body);
  }
}

// Method to update the selected placeholder whenever the content changes
onContentChange(): void {
  const editor = $(this.el.nativeElement).find('#summernote');
  const currentContent = editor.summernote('code');
  
  this.templateData.body = currentContent; // keep in sync

  if (this.selectedPlaceholder && !currentContent.includes(this.selectedPlaceholder)) {
    this.selectedPlaceholder = null;
  }
}




getTextContent(): void {
  this.body = $(this.el.nativeElement).find('#summernote').summernote('code');
  console.log(this.body); // For debugging, to see what is captured
}

  

updateTemplate() {
  if (!this.templateData.template_type || !this.templateData.subject) {
    alert("Please fill all fields.");
    return;
  }

  // Get Schema
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    alert("Schema not found. Please select a schema again.");
    return;
  }

  // Get Summernote content
  const bodyContent = ($('#summernote') as any).summernote('code');

  const payload = {
    template_type: this.templateData.template_type,
    subject: this.templateData.subject,
    body: bodyContent
  };

  this.DepartmentServiceService.updateEmailTemplate(
    selectedSchema,               // now guaranteed string
    this.templateData.id,
    payload
  )
  .subscribe(
    (response: any) => {
      alert("Template updated successfully!");
      this.dialogRef.close(true);
    },
(error) => {
  console.error('Error updating Template:', error);

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


  ClosePopup(){
    this.ref.close('Closed using function')
  }


  loadRequestType(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.DepartmentServiceService.getReqType(selectedSchema).subscribe(
        (result: any) => {
          this.RequestType = result;
          console.log(' fetching Companies:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }

}
