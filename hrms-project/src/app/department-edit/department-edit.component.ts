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

@Component({
  selector: 'app-department-edit',
  templateUrl: './department-edit.component.html',
  styleUrl: './department-edit.component.css'
})
export class DepartmentEditComponent {

  
  department: any;

  Departments: any[] = [];

  registerButtonClicked = false;

  selectedDeparmentsecId:any | undefined;

  selecteddepartmentId: number | undefined;

  dept_name: string = '';
  dept_description:string ='';
  branch_id:any ='';
  dept_code:any ='';



  
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
  
        // 2. Load Branches, then map branch name → branch id
        this.loadDeparmentBranch(() => {
          const branch = this.Departments?.find(
            (b: any) => b.branch_name === department.branch_id
          );
          if (branch) {
            this.department.branch_id = branch.id; // map name to id for dropdown
          }
          console.log('Mapped branch_id:', this.department.branch_id);
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
        console.error('Error updating department:', error);
      }
    );
  }

  loadDeparmentBranch(callback?: () => void): void {
    const selectedSchema = this.authService.getSelectedSchema();
  
    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any) => {
          this.Departments = result;
          console.log('Fetched Branches:', this.Departments);
  
          if (callback) callback(); // run mapping after data loads
        },
        (error) => {
          console.error('Error fetching Branches:', error);
        }
      );
    }
  }
  
 
  ClosePopup(){
    this.ref.close('Closed using function')
  }

}
