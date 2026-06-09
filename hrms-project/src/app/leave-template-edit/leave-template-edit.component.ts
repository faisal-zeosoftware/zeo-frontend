import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, AfterViewInit ,Inject, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CatogaryService } from '../catogary-master/catogary.service';


declare var $: any;
import 'summernote';
import {  MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core'; // Ensure you have summernote imported

@Component({
  selector: 'app-leave-template-edit',
  templateUrl: './leave-template-edit.component.html',
  styleUrl: './leave-template-edit.component.css'
})
export class LeaveTemplateEditComponent {

    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;
    body: any;
    templateData: any;
      related_to: any = 'branch';
  
    RequestType:any []=[];

  department: number[] = [];
  category: number[] = [];
  designation: number[] = [];
  branch: number[] = [];
  branches:any []=[];
  Departments: any[] = [];
  Categories: any[] = [];
  Designations: any[] = [];

    allSelectedBrach=false;
    allSelecteddept = false;
    allSelectedcat = false;
    allSelecteddes = false;
    allSelectedEmp = false;
  
    @ViewChild('branchSelect') branchSelect!: MatSelect;
    @ViewChild('deptSelect') deptSelect!: MatSelect;
    @ViewChild('catSelect') catSelect!: MatSelect;
    @ViewChild('selectdes') selectdes!: MatSelect;
  
  
  
    constructor(
      private el:ElementRef,
      private http: HttpClient,
      private authService: AuthenticationService,
      private employeeService: EmployeeService,
      private userService: UserMasterService,
      private categoryService: CatogaryService,
      private DepartmentServiceService: DepartmentServiceService,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private dialogRef: MatDialogRef<LeaveTemplateEditComponent>,
  
      private ref:MatDialogRef<LeaveTemplateEditComponent>,
  
  ) {
    this.templateData = data.template; // Get the selected template data
  
  }
  
  
  EmailPlaceHolders: string[] = []; // Initialize as an empty array
  
  selectedPlaceholder: string | null = null; // To keep track of the selected placeholder
  
  
  ngOnInit(): void {
   
    this.loadRequestType();
    this.loadEmailPlaceholders(); 
    this.loadDeparmentBranch();
    this.loadDEpartments();
    this.loadCAtegory();
    this.loadDesignations();

  // Detect related_to automatically
  if (this.templateData.branch?.length) {
    this.related_to = 'branch';
  } else if (this.templateData.Department?.length) {
    this.related_to = 'department';
  } else if (this.templateData.Category?.length) {
    this.related_to = 'category';
  } else if (this.templateData.Designation?.length) {
    this.related_to = 'designation';
  }// Call the method on component init
  
  
  
   
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

  
  
    
    loadEmailPlaceholders(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      console.log('schemastore', selectedSchema);
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getEmailPlaceholderLeave(selectedSchema).subscribe(
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
        branch: this.templateData.branch || [],
  Department: this.templateData.Department || [],
  Category: this.templateData.Category || [],
  Designation: this.templateData.Designation || [],
      body: bodyContent
    };
  
    this.DepartmentServiceService.updateLeaveEmailTemplate(
      selectedSchema,               // now guaranteed string
      this.templateData.id,
      payload
    )
    .subscribe(
      (response: any) => {
        alert("Leave Template updated successfully!");
        this.dialogRef.close(true);
        window.location.reload();
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

  isAllBranchesSelected(): boolean {
  return this.branch?.length === this.branches?.length;
}

isSomeBranchesSelected(): boolean {
  return this.branch?.length > 0 &&
         this.branch?.length < this.branches?.length;
}

toggleAllBranches(): void {
  if (this.isAllBranchesSelected()) {
    this.branch = [];
  } else {
    this.branch = this.branches.map((x: { id: any; }) => x.id);
  }
}

isAllDepartmentsSelected(): boolean {
  return this.department?.length === this.Departments?.length;
}

isSomeDepartmentsSelected(): boolean {
  return this.department?.length > 0 &&
         this.department?.length < this.Departments?.length;
}

toggleAllDepartments(): void {
  if (this.isAllDepartmentsSelected()) {
    this.department = [];
  } else {
    this.department = this.Departments.map(x => x.id);
  }
}

isAllCategoriesSelected(): boolean {
  return this.category?.length === this.Categories?.length;
}

isSomeCategoriesSelected(): boolean {
  return this.category?.length > 0 &&
         this.category?.length < this.Categories?.length;
}

toggleAllCategories(): void {
  if (this.isAllCategoriesSelected()) {
    this.category = [];
  } else {
    this.category = this.Categories.map(x => x.id);
  }
}

isAllDesignationsSelected(): boolean {
  return this.designation?.length === this.Designations?.length;
}

isSomeDesignationsSelected(): boolean {
  return this.designation?.length > 0 &&
         this.designation?.length < this.Designations?.length;
}

toggleAllDesignations(): void {
  if (this.isAllDesignationsSelected()) {
    this.designation = [];
  } else {
    this.designation = this.Designations.map(x => x.id);
  }
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
  
      toggleAllSelectionBrach(): void {
                if (this.selectBrach) {
                  if (this.allSelectedBrach) {
                    this.selectBrach.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectBrach.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }

                toggleAllSelectiondept(): void {
    if (this.deptSelect) {
      this.deptSelect.options.forEach((item: MatOption) =>
        this.allSelecteddept ? item.select() : item.deselect()
      );
    }
  }


    toggleAllSelectiondes(): void {

     if (this.selectdes) {
      this.selectdes.options.forEach((item: MatOption) =>
        this.allSelecteddes ? item.select() : item.deselect()
      );
    }


  }

    toggleAllSelectioncat(): void {
    if (this.catSelect) {
      this.catSelect.options.forEach((item: MatOption) =>
        this.allSelectedcat ? item.select() : item.deselect()
      );
    }
  }

}
