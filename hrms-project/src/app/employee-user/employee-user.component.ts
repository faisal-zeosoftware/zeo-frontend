import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';

@Component({
  selector: 'app-employee-user',
  templateUrl: './employee-user.component.html',
  styleUrls: ['./employee-user.component.css']
})
export class EmployeeUserComponent implements OnInit {
  
  private apiUrl = `${environment.apiBaseUrl}`;
  
  // Receives employeeId from CreateEmployeeComponent
  employeeId: any;
  
  // User selection
  users: any[] = [];
  selectedUser: any = null;
  
  // Company selection
  selectedCompany: any = null;
  companies: any[] = [];
  
  registerButtonClicked = false;

  constructor(
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private ref: MatDialogRef<EmployeeUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.employeeId = data.employeeId; // Get passed employee ID
  }

  ngOnInit(): void {
    this.loadCompanies();
    // Don't load users initially - load based on company selection
  }

  loadCompanies(): void {
    this.companyRegistrationService.getCompany().subscribe(
      (result: any) => {
        this.companies = result;
      },
      (error: any) => {
        console.error('Error fetching companies:', error);
      }
    );
  }

  // Called when company selection changes
  onCompanyChange(): void {
    if (!this.selectedCompany) {
      this.users = []; // Clear users if no company selected
      return;
    }
    this.loadTenantUsers();
  }

  loadTenantUsers(): void {
    if (!this.selectedCompany || !this.selectedCompany.schema_name) {
      return;
    }

    this.http.get(
      `${this.apiUrl}/users/tenant-users/?schema=${this.selectedCompany.schema_name}`
    )
    .subscribe({
      next: (res: any) => {
        this.users = res;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        alert('Failed to load users for selected company');
      }
    });
  }

  connectEmployeeToUser(): void {
    this.registerButtonClicked = true;

    if (!this.selectedUser) {
      alert('Please select a user');
      return;
    }

    const selectedSchema = localStorage.getItem('selectedSchema');
    const companyName = this.selectedCompany?.schema_name || selectedSchema;

    // Call API to link employee to user
    this.http.patch(
      `${this.apiUrl}/employee/api/Employee/${this.employeeId}/?schema=${companyName}`, 
      { users: this.selectedUser }
    ).subscribe({
      next: (response) => {
        alert('Employee connected to user successfully!');
        this.ref.close();
        window.location.reload();
      },
      error: (error) => {
        console.error('Error connecting employee to user:', error);
        
        // Better error handling
        let errorMsg = 'Failed to connect employee to user';
        if (error.error && typeof error.error === 'object') {
          const messages = Object.entries(error.error)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
          if (messages.length > 0) {
            errorMsg = messages.join('\n');
          }
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        }
        
        alert(errorMsg);
      }
    });
  }

  ClosePopup(): void {
    this.ref.close('Closed using function');
    window.location.reload();
  }
}