import { Component, ViewChild } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { formatDate } from '@angular/common';
import { MatOption, MatSelect } from '@angular/material/select';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-leave-type',
  templateUrl: './leave-type.component.html',
  styleUrl: './leave-type.component.css'
})
export class LeaveTypeComponent {

    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;


  name:any='';
  code:any='';
  type:any='';
  unit:any='';
  valid_to:any='';
  valid_from:any='';

  description:any='';


    created_by: any = '';



  image: string | undefined;

  negative: boolean = false;
  
  allow_opening_balance: boolean = false;
  include_dashboard: boolean = false;

    include_holiday: boolean = false;
    include_weekend: boolean = false;

  allow_half_day: boolean = false;
  include_weekend_and_holiday: boolean = false;
  use_common_workflow: boolean = false;

    branch: number[] = [];

    branches:any []=[];
    allSelectedBrach=false;

  selectedFile!: File | null;

  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names
  
  constructor(
    private leaveservice: LeaveService, 
    private authService: AuthenticationService, 

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
  private DepartmentServiceService: DepartmentServiceService
    
  ) {}

  ngOnInit(): void {
     this.loadDeparmentBranch();
    this.userId = this.sessionService.getUserId();

    

    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property
         this.created_by= this.userId;
    
          console.log('User ID:', this.userId); // Log user ID
          console.log('User Details:', this.userDetails); // Log user details
    
          // Check if user is_superuser is true or false
          let isSuperuser = this.userDetails.is_superuser || false; // Default to false if is_superuser is undefined
          const selectedSchema = this.authService.getSelectedSchema();
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }
        
        
          if (isSuperuser) {
            console.log('User is superuser or ESS user');
            
            // Grant all permissions
            this.hasViewPermission = true;
            this.hasAddPermission = true;
            this.hasDeletePermission = true;
            this.hasEditPermission = true;
        
            // Fetch designations without checking permissions
            // this.fetchDesignations(selectedSchema);
          } else {
            console.log('User is not superuser');
    
            const selectedSchema = this.authService.getSelectedSchema();
            if (selectedSchema) {
             
              
              
              try {
                const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
                console.log('Permissions data:', permissionsData);
    
                if (Array.isArray(permissionsData) && permissionsData.length > 0) {
                  const firstItem = permissionsData[0];
    
                  if (firstItem.is_superuser) {
                    console.log('User is superuser according to permissions API');
                    // Grant all permissions
                    this.hasViewPermission = true;
                    this.hasAddPermission = true;
                    this.hasDeletePermission = true;
                    this.hasEditPermission = true;
                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_leave_type', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_leave_type', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_leave_type', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_leave_type', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);
    
    
                  } else {
                    console.error('No groups found in data or groups array is empty.', firstItem);
                  }
                } else {
                  console.error('Permissions data is not an array or is empty.', permissionsData);
                }
    
                // Fetching designations after checking permissions
                // this.fetchDesignations(selectedSchema);
              }
              
              catch (error) {
                console.error('Error fetching permissions:', error);
              }
            } else {
              console.error('No schema selected.');
            }
              
          }
        },
        (error) => {
          console.error('Failed to fetch user details:', error);
        }
      );
  }
}
// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_leave_type' ||'change_leave_type' ||'delete_leave_type' ||'view_leave_type';
  
  
//   // Check user permissions
//   if (permissions.some(permission => permission.codename === requiredPermission)) {
//     return true;
//   }
  
//   // Check group permissions (if applicable)
//   // Replace `// TODO: Implement group permission check`
//   // with your logic to retrieve and check group permissions
//   // (consider using a separate service or approach)
//   return false; // Replace with actual group permission check
//   }
  
  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }

                toggleAllSelectionBrach(): void {
                if (this.selectBrach) {
                  if (this.allSelectedBrach) {
                    this.selectBrach.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectBrach.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }

  

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
  }
  

  registerButtonClicked = false;


//   registerleaveType(): void {
//     this.registerButtonClicked = true;
//     if (!this.name || !this.code || !this.valid_to) {
//       return;
//     }
  
//     const formData = new FormData();
//     formData.append('name', this.name);
//     formData.append('code', this.code);
//     formData.append('type', this.type);
//     formData.append('unit', this.unit);
//     formData.append('valid_to', this.valid_to);
//     formData.append('valid_from', this.valid_from);
//     formData.append('description', this.description);
//     formData.append('negative', this.negative.toString());
//     formData.append('allow_opening_balance', this.allow_opening_balance.toString());
//     // formData.append('image', this.selectedFile);
//       // Append the profile picture only if it's selected
//  // Append the image only if it's selected
//  if (this.selectedFile) {
//   formData.append('image', this.selectedFile);
// }

  
//     this.leaveservice.registerLeaveType(formData).subscribe(
//       (response) => {
//         console.log('Registration successful', response);
//         alert('Leave type has been added');
//         window.location.reload();
//       },
//       (error) => {
//         console.error('Added failed', error);
//         alert('Enter all required fields!');
//       }
//     );
//   }

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
      formData.append('created_by', this.created_by);
      formData.append('negative', this.negative.toString());
      formData.append('allow_half_day', this.allow_half_day.toString());
      formData.append('include_holiday', this.include_holiday.toString());
      formData.append('include_weekend', this.include_weekend.toString());
      formData.append('use_common_workflow', this.use_common_workflow.toString());
      formData.append('include_dashboard', this.include_dashboard.toString());
    
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }
    
      this.leaveservice.registerLeaveType(formData).subscribe(
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
            this.branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.branches = result; // Fallback: show all if nothing is selected in sidebar
          }
          // Inside the subscribe block of loadDeparmentBranch
          if (this.branches.length === 1) {
            this.branch = this.branches[0].id;
          }
  
          console.log('Filtered branches for selection:', this.branches);
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }

}
