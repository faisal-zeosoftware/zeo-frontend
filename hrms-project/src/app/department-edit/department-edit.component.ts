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
        this.mapBranchesNameToId();

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

  if (selectedSchema) {
    this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
      (result: any[]) => {

        const sidebarSelectedIds: number[] = JSON.parse(
          localStorage.getItem('selectedBranchIds') || '[]'
        );

        let filteredBranches = result;

        if (sidebarSelectedIds.length > 0) {
          filteredBranches = result.filter(branch =>
            sidebarSelectedIds.includes(branch.id)
          );
        }

        // Keep already assigned branch visible in edit mode
        const currentBranchId =
          this.department?.branch_id || this.department?.branch;

        const existingBranch = result.find(
          b => b.id === currentBranchId
        );

        if (
          existingBranch &&
          !filteredBranches.some(b => b.id === existingBranch.id)
        ) {
          filteredBranches.push(existingBranch);
        }

        this.Branches = filteredBranches;

        if (callback) {
          callback();
        }
      },
      (error) => {
        console.error('Error fetching Branches:', error);
      }
    );
  }
}


mapBranchesNameToId() {
  if (!this.Branches || this.Branches.length === 0 || !this.department) return;

  let value = this.department.branch || this.department.branch_id;

  if (!value) return;

  // Always normalize to array
  if (!Array.isArray(value)) {
    value = [value];
  }

  this.department.branch = value.map((item: any) => {
    // If already ID → keep it
    if (typeof item === 'number') return item;

    // If name → convert to ID
    const found = this.Branches.find(
      (b: any) => b.branch_name === item
    );

    return found ? found.id : null;
  }).filter((id: any) => id !== null);

  console.log("Mapped branch IDs:", this.department.branch);
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
