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
import { EmployeeService } from '../employee-master/employee.service'; 
import { SuccesModalComponent } from '../succes-modal/succes-modal.component';
import { UserMasterService } from '../user-master/user-master.service';
import { UesrEmployeeComponent } from '../uesr-employee/uesr-employee.component';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.css'
})
export class UserEditComponent {

    @ViewChild('select') select: MatSelect | undefined;

  companies: any[] = [];
  branches:any[] = [];

  group:any[]=[];
  user_permission:any[]=[];


  registerButtonClicked = false;

  Emp: any;


  Changepwd:any ='';

  username:any ='';

  first_name:any ='';
  last_name:any ='';
  date_joined:any ='';
  last_login: any = '';
  email:any ='';
  CompanyRole:any ='';

  ContactNumber:any ='';
  password:any='';
  groups:any='';
  user_permissions:any='';
  tenants:any='';

  createdUserId: any ='';

  constructor(
    private ref:MatDialogRef<UserEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employeeId: number },
    private UserMasterService: UserMasterService,
    private CompanyRegistrationService: CompanyRegistrationService,
    private renderer: Renderer2,
    private http: HttpClient,
    private dialog: MatDialog,
    private authService: AuthenticationService,
    private dialogRef: MatDialogRef<UserEditComponent>

  ) {
    this.UserMasterService.getEmpById(data.employeeId).subscribe(Emp => {
      this.Emp = Emp;
    });
  }


  ngOnInit(): void {
    this.UserMasterService.getEmpById(this.data.employeeId).subscribe(
      (Emp) => {
        this.Emp = Emp;
        this.Emp.password = ''; 
      },
      (error) => {
        console.error('Error fetching category:', error);
      }
    );




    this.loadCompanies();
    // this.loadbranches();

    // this.loadGrouping();
    // this.loadPermission();
  

  }

  updateEmp(): void {
 
    // Basic validation before sending request
    if (!this.Emp.username || !this.Emp.email || !this.Emp.tenants) {
      if (!this.Emp.username) {
        alert('Username: This field may not be blank.');
      }
      if (!this.Emp.email) {
        alert('Email: This field may not be blank.');
      }
      if (!this.Emp.tenants) {
        alert('Tenants: This field is required.');
      }
      return; // Stop execution if basic validation fails
    }
  
    // Create a copy of Emp object to avoid modifying the original
    let updateData = { ...this.Emp };
  
    // If password is empty, remove it from the update payload
    if (!this.Emp.password || this.Emp.password.trim() === '') {
      delete updateData.password;
    }
  
    this.UserMasterService.updateEmp(this.data.employeeId, updateData).subscribe(
      (response) => {
        console.log('USER updated successfully:', response);
        alert('User has been updated successfully!');
       const createdUserId = response.id; // Assume backend returns new user ID
  
        // Store the created user ID and open the modal
        this.createdUserId = createdUserId;
        this.isAddFieldsModalOpen = true;
      },
      (error) => {
        console.error('Error updating USER:', error);
  
        if (error.status === 400 && error.error) {
          let errorMessages = [];
  
          // Extract field-specific validation messages
          for (let field in error.error) {
            if (error.error[field] && error.error[field].length > 0) {
              errorMessages.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${error.error[field][0]}`);
            }
          }
  
          // Display alert with field name and error message
          if (errorMessages.length > 0) {
            alert(errorMessages.join('\n'));
          } else {
            alert('An unknown error occurred. Please try again.');
          }
        } else {
          alert('Failed to update user. Please check your input.');
        }
      }
    );
  }
  

  
  
  showPasswordField: boolean = false;

  togglePasswordField() {
    this.showPasswordField = !this.showPasswordField;
  }

  loadCompanies(): void { 
    this.CompanyRegistrationService.getCompany().subscribe(
      (result: any) => {
        this.companies = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }


    isAddFieldsModalOpen:boolean=false;

      closeAddFieldsModal(){
    this.isAddFieldsModalOpen=false;
    window.location.reload();
  }

    openPopus(userId: string): void {
      this.isAddFieldsModalOpen = false; // Close the modal
  
      this.dialog.open(UesrEmployeeComponent, {
        width: '80%',
        height: '500px',
        data: { userId: userId } // Pass the created user ID to the component
      });
    }

      allSelected=false;
    
      
      
      toggleAllSelection(): void {
        if (this.select) {
          if (this.allSelected) {
            
            this.select.options.forEach((item: MatOption) => item.select());
          } else {
            this.select.options.forEach((item: MatOption) => item.deselect());
          }
        }
      }


ClosePopup(){
  this.ref.close('Closed using function');
  window.location.reload();
}
 


}
