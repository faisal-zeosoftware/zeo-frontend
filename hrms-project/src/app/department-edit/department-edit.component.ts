import { Component,Renderer2, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route,ActivatedRoute } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentCreationComponent } from '../department-creation/department-creation.component';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-department-edit',
  templateUrl: './department-edit.component.html',
  styleUrl: './department-edit.component.css'
})
export class DepartmentEditComponent {

    @ViewChild('select') select: MatSelect | undefined; 
  
  department: any;

  Departments: any[] = [];

  registerButtonClicked = false;

  selectedDeparmentsecId:any | undefined;

  selecteddepartmentId: number | undefined;

  dept_name: string = '';
  dept_description:string ='';
  branch_id:any ='';
  dept_code:any ='';

  branch:any='';

  Branches: any[] = [];



  
  constructor(
    private ref:MatDialogRef<DepartmentCreationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentId: number },
    private DepartmentServiceService: DepartmentServiceService,
    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthenticationService,
    private dialogRef: MatDialogRef<DepartmentEditComponent>

  ) {
    this.DepartmentServiceService.getCategoryById(data.departmentId).subscribe(department => {
      this.department = department;
      this.department.branch_id = department.branch_id;
    });
  }

ngOnInit(): void {
  // 1. Fetch Department by ID
  this.DepartmentServiceService.getCategoryById(this.data.departmentId).subscribe(
    (department) => {
      this.department = department;
      console.log('Department fetched:', this.department);

      // 2. Load branches and map correctly
      this.loadDeparmentBranch(() => {

        // ✅ Use Branches (not Departments)
        const branch = this.Branches?.find(
          (b: any) => b.branch_name === this.department.branch
        );

        // ✅ Map name → ID
        if (branch) {
          this.department.branch = branch.id;
        }

        // ✅ Fallback if backend already sends branch_id
        if (!this.department.branch && this.department.branch_id) {
          this.department.branch = this.department.branch_id;
        }

        console.log('Mapped branch:', this.department.branch);
      });
    },
    (error) => {
      console.error('Error fetching department:', error);
    }
  );
}
  

  updateCategory(): void {
    // Update category
    this.DepartmentServiceService.updateCategory(this.data.departmentId, this.department).subscribe(
      (response) => {
        console.log('department updated successfully:', response);
        // Close the dialog when category is updated
        alert('Deaprtment Updated ');

        this.dialogRef.close();
        window.location.reload();
      },
(error) => {
  console.error('Error updating Department:', error);

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

loadDeparmentBranch(callback?: () => void): void {
  const selectedSchema = this.authService.getSelectedSchema();

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
      (result: any) => {

        // ✅ FIX: assign to Branches (used in UI + filter)
        this.Branches = result;

        // (optional) keep Departments if you still need it
        this.Departments = result;

        console.log('Fetched Branches:', this.Branches);

        if (callback) callback();
      },
      (error) => {
        console.error('Error fetching Branches:', error);
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
  
  
 
  ClosePopup(){
    this.ref.close('Closed using function')
  }

}
