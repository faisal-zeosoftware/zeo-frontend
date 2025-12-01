import { Component, Renderer2 } from '@angular/core';
import { UserCreationComponent } from '../user-creation/user-creation.component';
import { UserMasterService } from '../user-master/user-master.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UserEditComponent } from '../user-edit/user-edit.component';
import { DesignationService } from '../designation-master/designation.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent {
  Users: any[] = [];
  employee: any;

  selectedEmployee: any;
  Companies: any;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  constructor(private UserMasterService:UserMasterService,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private dialog:MatDialog,
    private renderer: Renderer2,
    private DesignationService: DesignationService,
    private router:Router,
    private route: ActivatedRoute
    ) {}





        ngOnInit(): void {


      this.route.params.subscribe(params => {
        this.Companies = params['id'];
        // this.loadEmployeeDetails();
    
  
      });
      const employeeIdParam = this.route.snapshot.paramMap.get('id');
  
  
      if (employeeIdParam) {
        const employeeId = +employeeIdParam;
  
        // Fetch employee details
        this.UserMasterService.getEmployeeDetails(employeeId).subscribe(
          (details) => {
            this.Companies = details;
            // this.cdr.detectChanges(); // Manually trigger change detection
            
  
          },
          (error) => {
            console.error('Failed to fetch Company details', error);
          }
        );
      } else {
        console.error('Company ID parameter is null.');
      }



    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property

          // this.created_by= this.userId;
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


                    this.hasAddPermission = this.checkGroupPermission('add_customuser', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_customuser', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_customuser', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_customuser', groupPermissions);
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

      // this.fetchingApprovals();


      this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
          this.userDetailss = userData;
          this.schemas = userData.map((schema: any) => schema.schema_name);
          console.log('scehmas-de', userData)
        },
        (error) => {
          console.error('Failed to fetch user schemas:', error);
        }
      );
    } else {
      console.error('User ID is null.');
    }


  }

    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }


  

  openPopus(){
    this.dialog.open(UserCreationComponent,{
      width:'80%',
      height:'500px',
    })
  }


  Delete: boolean = false;
  allSelected: boolean = false;

toggleCheckboxes() {
  this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
  this.allSelected = !this.allSelected;
  this.Users.forEach(employee => employee.selected = this.allSelected);
}

onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
}

// deleteSelectedEmployees() { 
//   const selectedEmployeeIds = this.Users
//     .filter(employee => employee.selected)
//     .map(employee => employee.id);

//   if (selectedEmployeeIds.length === 0) {
//     alert('No employees selected for deletion.');
//     return;
//   }

//   if (confirm('Are you sure you want to delete the selected employees?')) {
//     selectedEmployeeIds.forEach(DeptId => {
//       this.UserMasterService.deleteUser(DeptId).subscribe(
//         () => {
//           console.log('User deleted successfully:', DeptId);
//           // Remove the deleted employee from the local list
//           this.Users = this.Users.filter(employee => employee.id !== DeptId);
//         },
//         (error) => {
//           console.error('Error deleting employee:', error);
//         }
//       );
//     });
//   }
// }


openEditEmpPopuss(employeeId: number, ):void{
  const dialogRef = this.dialog.open(UserEditComponent, {
    width:'80%',
    height:'500px',
    data: { employeeId: employeeId }
    
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('The dialog was closed');
  });
}


 deleteSelectedEmployees() {
    const selectedEmployeeIds = this.Users.filter(employee => employee.selected).map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No user selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected user?')) {
      selectedEmployeeIds.forEach(userId => {
        this.UserMasterService.markUserAsDeleted(userId).subscribe(
          () => {
            console.log('User marked as deleted:', userId);
            window.location.reload();

            // Update the local list to hide the user
            this.Users = this.Users.map(employee => {
              if (employee.id === userId) {
                return { ...employee, is_deleted: true }; // Mark as deleted locally
              }
              return employee;
            });
            // window.location.reload();

          },
          (error) => {
            console.error('Error marking user as deleted:', error);
          }
        );
      });
    }
  }


showEditBtn: boolean = false;

EditShowButtons() {
  this.showEditBtn = !this.showEditBtn;
}

// show div with selected user details


showEmployeeDetails(employeeId: number, companysec: any): void {
  this.UserMasterService.getEmployeeDetails(employeeId).subscribe(
      (details: any) => {
          // Update selectedEmployee with the fetched details
          // this.selectedEmployee = details;
          this.selectedEmployee = companysec;
      },
      (error) => {
          console.error('Failed to fetch User details', error);
      }
  );
}


onDeleteEmployee(DeptId: number): void {
if (confirm('Are you sure you want to delete this employee?')) {
    this.UserMasterService.deleteUser(DeptId).subscribe(
        () => {
            console.log('User deleted successfully');

            // this.router.navigate(['/main-sidebar/sub-sidebar/employee-master']);
            // Refresh the employee list after deletion
            // this.loadEmployee();
        },
        (error) => {
            console.error('Error deleting employee:', error);
        }
    );
}
}





}
