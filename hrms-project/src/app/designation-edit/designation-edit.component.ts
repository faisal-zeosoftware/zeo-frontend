import { Component,Renderer2, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route,ActivatedRoute } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DesignationCreationComponent } from '../designation-creation/designation-creation.component';
import { DesignationService } from '../designation-master/designation.service';
import { MatOption, MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-designation-edit',
  templateUrl: './designation-edit.component.html',
  styleUrl: './designation-edit.component.css'
})
export class DesignationEditComponent {

      @ViewChild('select') select: MatSelect | undefined; 

  selectedDeparmentsecId:any | undefined;

  selectedCategoryId: number | undefined;

  registerButtonClicked = false;
  Catogaries: any[] = [];

  desgntn_job_title: string = '';
  desgntn_description:string ='';
  desgntn_code:string ='';

  branch:any='';

  Branches: any[] = [];

  designation: any;

    Departments: any[] = [];


  constructor(
    private ref:MatDialogRef<DesignationCreationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { desigId: number },
    private DesignationService: DesignationService,
    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthenticationService,
    private DepartmentServiceService: DepartmentServiceService,
    private dialogRef: MatDialogRef<DesignationEditComponent>

  ) {
    this.DesignationService.getDesgById(data.desigId).subscribe(designation => {
      this.designation = designation;
    });
  }



  
ngOnInit(): void {

  this.DesignationService.getDesgById(this.data.desigId).subscribe(
    (designation) => {
      this.designation = designation;

      // ✅ ensure branch is array for multi-select
      if (!this.designation.branch) {
        this.designation.branch = [];
      }
    },
    (error) => {
      console.error('Error fetching designation:', error);
    }
  );

  // ✅ This will now work properly
  this.loadDeparmentBranch();
}

  
loadDeparmentBranch(callback?: () => void): void {
  const selectedSchema = this.authService.getSelectedSchema();

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
      (result: any) => {

        // ✅ FIX: assign to Branches (not Departments)
        this.Branches = result;

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
    



  updateDesignation(): void {
    // Update category
    this.DesignationService.updateDesignation(this.data.desigId, this.designation).subscribe(
      (response) => {
        console.log('designation updated successfully:', response);
        // Close the dialog when category is updated
        this.dialogRef.close();

        alert('Designation has been Updated ');
        window.location.reload();
        
      },
(error) => {
  console.error('Error updating Designation:', error);

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
}
