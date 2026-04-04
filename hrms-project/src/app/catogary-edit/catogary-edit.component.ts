import { Component , OnInit, Renderer2, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route,ActivatedRoute } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CatogaryService } from '../catogary-master/catogary.service'; 
import { CatogaryCrationComponent } from '../catogary-cration/catogary-cration.component';
import { MatOption, MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-catogary-edit',
  templateUrl: './catogary-edit.component.html',
  styleUrl: './catogary-edit.component.css'
})
export class CatogaryEditComponent {

        @ViewChild('select') select: MatSelect | undefined; 

  categoryName: string | undefined;

  selectedDeparmentsecId:any | undefined;

  selectedCategoryId: number | undefined;

  registerButtonClicked = false;
  Catogaries: any[] = [];

  ctgry_title: string = '';
  ctgry_description:string ='';
  ctgry_code:string ='';


    branch:any='';

  Branches: any[] = [];

    Departments: any[] = [];



  category: any;


  constructor(
    private ref:MatDialogRef<CatogaryCrationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoryId: number },
    private categoryService: CatogaryService,
    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthenticationService,
    private DepartmentServiceService: DepartmentServiceService,
    private dialogRef: MatDialogRef<CatogaryEditComponent>

  ) {
    this.categoryService.getCategoryById(data.categoryId).subscribe(category => {
      this.category = category;
    });
  }

  
   


  // loadcatogary(): void {
  //   this.categoryService.getcatogary().subscribe(
  //     (result: any) => {
  //       this.Catogaries = result;
  //       console.log(' fetching catogeries:');

  //     },
  //     (error) => {
  //       console.error('Error fetching catogeries:', error);
  //     }
  //   );
  // }
  


ngOnInit(): void {
  this.categoryService.getCategoryById(this.data.categoryId).subscribe(
    (category) => {
      this.category = category;
      console.log('Category fetched:', this.category);

      // ✅ Load branches first, then map
      this.loadDeparmentBranch(() => {

        const branch = this.Branches?.find(
          (b: any) => b.branch_name === this.category.branch
        );

        // ✅ Map name → id
        if (branch) {
          this.category.branch = branch.id;
        }

        // ✅ fallback if backend already gives branch_id
        if (!this.category.branch && this.category.branch_id) {
          this.category.branch = this.category.branch_id;
        }

        console.log('Mapped branch:', this.category.branch);
      });
    },
    (error) => {
      console.error('Error fetching category:', error);
    }
  );
}



  updateCategory(): void {
    // Update category
    this.categoryService.updateCategory(this.data.categoryId, this.category).subscribe(
      (response) => {
        console.log('Category updated successfully:', response);
        // Close the dialog when category is updated
        this.dialogRef.close();
        alert('category has been Updated ');
        window.location.reload();
      },
(error) => {
  console.error('Error updating Category:', error);

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
      (result: any) => {

        // ✅ FIX: assign to Branches
        this.Branches = result;

        // optional (if you still use it somewhere)
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
