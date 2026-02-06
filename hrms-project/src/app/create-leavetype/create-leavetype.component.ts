import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { SessionService } from '../login/session.service';
import { formatDate } from '@angular/common';
import {combineLatest, Subscription } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { EmployeeService } from '../employee-master/employee.service';


@Component({
  selector: 'app-create-leavetype',
  templateUrl: './create-leavetype.component.html',
  styleUrl: './create-leavetype.component.css'
})
export class CreateLeavetypeComponent {

  private dataSubscription?: Subscription;


  name: any = '';
  code: any = '';
  type: any = '';
  unit: any = '';
  valid_to: any = '';
  valid_from: any = '';
  branch: any = '';

  description: any = '';
  created_by: any = '';


  image: string | undefined;

  negative: boolean = false;

  allow_half_day: boolean = false;
  include_holiday: boolean = false;
  include_weekend: boolean = false;

  use_common_workflow: boolean = false;

  include_dashboard: boolean = false;


  registerButtonClicked: boolean = false;

  selectedFile!: File | null;


  constructor(
    private http: HttpClient,
    private leaveService: LeaveService,
    private sessionService: SessionService,

    private employeeService: EmployeeService,

    private authService: AuthenticationService,
    private DepartmentServiceService: DepartmentServiceService,

   private ref:MatDialogRef<CreateLeavetypeComponent>) {}




   ngOnInit(): void {

       // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.LoadBranch(); 
  });
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {

    
      // this.LoadBranch(selectedSchema);
  




    }

  




  }

  //  onFileSelected(event: any): void {
  //   this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
  // }


   registerleaveType(): void {
    this.registerButtonClicked = true;
  
    if (!this.name || !this.code) {
      alert('Please fill in all required fields.');
      return;
    }
  
    // Convert valid_from and valid_to to 'YYYY-MM-DD'
    const formattedValidFrom = this.valid_from ? formatDate(this.valid_from, 'yyyy-MM-dd', 'en-US') : '';
    const formattedValidTo = this.valid_to ? formatDate(this.valid_to, 'yyyy-MM-dd', 'en-US') : '';
  
    console.log("Formatted valid_from:", formattedValidFrom);  // Debugging
    console.log("Formatted valid_to:", formattedValidTo);  // Debugging
  
    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('code', this.code);
    formData.append('type', this.type);
    formData.append('unit', this.unit);
    formData.append('valid_from', formattedValidFrom);  // ✅ Fixing Date Format
    formData.append('valid_to', formattedValidTo);      // ✅ Fixing Date Format
    formData.append('description', this.description);
    formData.append('branch', this.branch);

    formData.append('created_by', this.created_by);
    formData.append('negative', this.negative.toString());
    formData.append('allow_half_day', this.allow_half_day.toString());
    formData.append('include_holiday', this.include_holiday.toString());
    formData.append('include_weekend', this.include_weekend.toString());
    formData.append('include_dashboard', this.include_dashboard.toString());

    formData.append('use_common_workflow', this.use_common_workflow.toString());
  
    // if (this.selectedFile) {
    //   formData.append('image', this.selectedFile);
    // }
    
  
    this.leaveService.registerLeaveType(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Leave type has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
  
        let errorMessage = 'An unexpected error occurred. Please try again.';
  
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.detail) {
            errorMessage = error.error.detail;
          } else if (error.error.non_field_errors) {
            errorMessage = error.error.non_field_errors.join(', ');
          } else {
            errorMessage = Object.keys(error.error)
              .map((field) => `${field}: ${error.error[field].join(', ')}`)
              .join('\n');
          }
        }
  
        alert(errorMessage);
      }
    );
  }
  

  Branches: any[] = [];



  // LoadBranch(selectedSchema: string) {
  //   this.leaveService.getBranches(selectedSchema).subscribe(
  //     (data: any) => {
  //       this.Branches = data;

  //       console.log('employee:', this.Branches);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching categories:', error);
  //     }
  //   );
  // }


  LoadBranch(callback?: Function) {
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


    ClosePopup(){
    this.ref.close('Closed using function')
  }



}
