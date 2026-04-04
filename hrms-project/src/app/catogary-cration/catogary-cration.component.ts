import { Component , OnInit, ViewChild} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CatogaryService } from '../catogary-master/catogary.service'; 
import { DepartmentServiceService } from '../department-master/department-service.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-catogary-cration',
  templateUrl: './catogary-cration.component.html',
  styleUrl: './catogary-cration.component.css'
})
export class CatogaryCrationComponent {

    @ViewChild('select') select: MatSelect | undefined;

  selectedDeparmentsecId:any | undefined;

  registerButtonClicked = false;
  catogaries: any[] = [];


  ctgry_title: string = '';
  ctgry_description:string ='';
  ctgry_code:string ='';
  branch_id:any ='';

  branch:any='';

  Branches: any[] = [];



  constructor(private DepartmentServiceService: DepartmentServiceService,
    private CatogaryService: CatogaryService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
   private ref:MatDialogRef<CatogaryCrationComponent>) {}



   copiedCategoryData: { title: string; code: string; description: string } | null = null;



   ngOnInit() {
      this.loadDeparmentBranch();
  // Retrieve the copied data from the service
  this.copiedCategoryData = this.CatogaryService.getCopiedCategoryData();

  }
   // Method to copy the current field values
   copyFields() {
    this.copiedCategoryData = {
      title: this.ctgry_title,
      code: this.ctgry_code,
      description: this.ctgry_description
    };
  
    // Use the service to store the copied data
    this.CatogaryService.setCopiedCategoryData(this.copiedCategoryData);
    console.log('Copied Values:', this.copiedCategoryData);
  }
  // Method to paste the copied field values
  pasteFields() {
    alert('Paste button clicked!');
    if (this.copiedCategoryData) {
      this.ctgry_title = this.copiedCategoryData.title;
      this.ctgry_code = this.copiedCategoryData.code;
      this.ctgry_description = this.copiedCategoryData.description;
  
      console.log('Pasted Values:', this.copiedCategoryData);
    } else {
      console.warn('No data available to paste. Please copy fields first.');
      alert('No data to paste. Please copy fields first.');
    }
  }

registerCatogary(): void {
  this.registerButtonClicked = true;

  // Basic front-end validation
  if (!this.ctgry_title || !this.ctgry_description || !this.ctgry_code) {
    if (!this.ctgry_title) {
      alert('Category Name field is blank.');
    }
    if (!this.ctgry_code) {
      alert('Category Code field is blank.');
    }
    if (!this.ctgry_description) {
      alert('Category Description field is blank.');
    }
    return; // Stop further execution if validation fails
  }

  const companyData = {
    ctgry_title: this.ctgry_title,
    ctgry_description: this.ctgry_description,
    ctgry_code: this.ctgry_code,
    //  branch_id: this.branch_id,
     branch: this.branch,
  };

  this.CatogaryService.registerCatogary(companyData).subscribe(
    (response) => {
      console.log('Registration successful', response);
      alert('Category has been registered successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('Registration failed', error);

      let errorMessage = 'Something went wrong.';

      // ✅ Handle backend validation errors (e.g., from Django REST Framework)
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
        // Handles backend messages like { "detail": "Invalid data" }
        errorMessage = error.error.detail;
      }

      alert(`Registration failed!\n\n${errorMessage}`);
    }
  );
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
