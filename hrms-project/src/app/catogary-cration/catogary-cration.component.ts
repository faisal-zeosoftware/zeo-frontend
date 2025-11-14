import { Component , OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CatogaryService } from '../catogary-master/catogary.service'; 

@Component({
  selector: 'app-catogary-cration',
  templateUrl: './catogary-cration.component.html',
  styleUrl: './catogary-cration.component.css'
})
export class CatogaryCrationComponent {

  selectedDeparmentsecId:any | undefined;

  registerButtonClicked = false;
  catogaries: any[] = [];

  ctgry_title: string = '';
  ctgry_description:string ='';
  ctgry_code:string ='';



  constructor(private CatogaryService: CatogaryService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
   private ref:MatDialogRef<CatogaryCrationComponent>) {}



   copiedCategoryData: { title: string; code: string; description: string } | null = null;



   ngOnInit() {
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


  ClosePopup(){
    this.ref.close('Closed using function')
  }

}
