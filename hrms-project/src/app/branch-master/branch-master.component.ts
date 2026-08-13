import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialogModule } from '@angular/material/dialog';
import { CompanySelectionComponent } from '../company-selection/company-selection.component';
import { MatDialog } from '@angular/material/dialog';
import { BrachRegistrationService } from '../branch-creation/brach-registration.service';
import { BranchCreationComponent } from '../branch-creation/branch-creation.component';
import { BranchEditComponent } from '../branch-edit/branch-edit.component';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-branch-master',
  template: ` <div class="container" *ngIf="hasViewPermission">
  <div class="comapny_section">

      <!-- ============ YOUR ORIGINAL HEADER SECTION — UNCHANGED ============ -->
      <div class="header_section mt-4">
          <div class="row">
              <div class="col-md-3">
                  <h1 title="change Branch"> Branch details</h1>
              </div>
              <div class="col-md-4">
                     <div class="search-container">
                        <input type="text" class="search-input" placeholder="Search by branch or code" [(ngModel)]="searchQuery" (input)="filterEmployees()">
                        <button class="search-btn">
                          <i class="fa fa-search"></i>
                        </button>
                      </div>
                </div>
              <div class="col-md-5">
                  <div class="button-group pull-right">
                      <button type="button" (click)="openPopus()" class="btn-Create btn btn-success" *ngIf="hasAddPermission"><span class="header-btn-icon"><mat-icon>add_circle</mat-icon></span> Create</button>
                      <span *ngIf="!hasAddPermission"></span>
                      <button type="button" class="btn-Edit btn-info btn" (click)="EditShowButtons()" *ngIf="hasEditPermission">
                            <span class="header-btn-icon"><mat-icon>draw</mat-icon></span> Edit</button>
                        <span *ngIf="hasEditPermission"></span>
                      <button type="button" class="btn-Delete btn btn-danger" (click)="toggleCheckboxes()" *ngIf="hasDeletePermission">
                      <span class="header-btn-icon"><mat-icon>delete</mat-icon></span> {{ Delete ? 'Cancel' : 'Delete' }}</button>
                     <span *ngIf="!hasDeletePermission"></span>
                  </div>
              </div>
          </div>
      </div>
      <!-- ============ END HEADER — UNCHANGED ============ -->

      <div class="row">
          <div class="col-md-2">
              <button class="mt-3 btn-danger btn" style="width: 100%;" color="warn" *ngIf="Delete" (click)="toggleSelectAllEmployees()">Select All</button>
          </div>
          <div class="col-md-3">
              <button class="mt-3 btn-danger btn" color="warn" *ngIf="Delete" (click)="deleteSelectedEmployees()">Delete Selected</button>
          </div>
      </div>

      <!-- ============ NEW: CARD GRID INSTEAD OF TABLE/STACKED LIST ============ -->
      <div class="branch-grid mt-4">
       <div class="branch-card"
     *ngFor="let branchsec of filteredEmployees"
     [ngClass]="{ 'selected-card': branchsec.selected }">

  <mat-checkbox *ngIf="Delete" class="card-checkbox"
                [(ngModel)]="branchsec.selected"
                (change)="onCheckboxChange(branchsec.id)"></mat-checkbox>

  <button mat-fab class="card-edit-btn" *ngIf="showEditBtn" (click)="openEditPopuss(branchsec.id)">
    <mat-icon>draw</mat-icon>
  </button>

  <div class="card-top">
    <div class="branch-avatar">{{ branchsec.branch_name?.charAt(0) }}</div>
    <div class="card-code">{{ branchsec.branch_code }}</div>
  </div>

  <h2 class="card-branch-name">{{ branchsec.branch_name }}</h2>
  <p class="card-city"><mat-icon>location_on</mat-icon> {{ branchsec.br_city || '-' }}</p>

  <div class="card-divider"></div>

  <div class="card-detail-row">
    <mat-icon>mail</mat-icon>
    <span>{{ branchsec.br_branch_mail || '-' }}</span>
  </div>
  <div class="card-detail-row">
    <mat-icon>call</mat-icon>
    <span>{{ branchsec.br_branch_nmbr_1 || '-' }}</span>
  </div>
  <div class="card-detail-row address-row">
    <mat-icon>home_pin</mat-icon>
    <span class="address-text">{{ branchsec.branch_address || '-' }}</span>
  </div>

</div>
      </div>

  </div>

  <div *ngIf="!hasViewPermission">
    <p class="text-center" style="margin-top: 150px;">You don't have permission to view this component.</p>
  </div>
</div>
`,
  styleUrl: './branch-master.component.css'
})
export class BranchMasterComponent {

  branches: any[] = [];


  branch_name: string = '';
  br_city:string = '';
  br_branch_mail:string = '';
  br_branch_nmbr_1:string = '';

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;

  selectedSchema: string | null = null;

  filteredEmployees: any[] = [];
  searchQuery: string = '';

  constructor(private BrachRegistrationService: BrachRegistrationService ,
    private companyRegistrationService: CompanyRegistrationService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private employeeService: EmployeeService,
    private dialog:MatDialog,
    ) {}

    


    async ngOnInit(): Promise<void> {

      // this.loadcatogary();

        this.employeeService.selectedBranches$.subscribe(ids => {

    this.loadbranchType();


  })

// Retrieve user ID
this.userId = this.sessionService.getUserId();

// Fetch user details using the obtained user ID
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property
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

        if (selectedSchema) {
          try {
            const permissionsData: any = await this.BrachRegistrationService.getDesignationsPermission(selectedSchema).toPromise();
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

                this.hasViewPermission = this.checkGroupPermission('view_brnch_mstr', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);

                this.hasAddPermission = this.checkGroupPermission('add_brnch_mstr', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);

                this.hasDeletePermission = this.checkGroupPermission('delete_brnch_mstr', groupPermissions);
                console.log('Has delete permission:', this.hasDeletePermission);

                this.hasEditPermission = this.checkGroupPermission('change_brnch_mstr', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
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
} else {
  console.error('User ID is null.');
}
  
     
    }

  
    
    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
      return groupPermissions.some(permission => permission.codename === codeName);
    }
    // fetchDesignations(selectedSchema: string) {
    //   this.BrachRegistrationService.getBranchess(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.branches = data;
    //       this.filteredEmployees = this.branches;
    //       console.log('employee:', this.branches);
    //     },
    //     (error: any) => {
    //       console.error('Error fetching categories:', error);
    //     }
    //   );
    // }

          loadbranchType(callback?: Function): void {
            const selectedSchema = this.authService.getSelectedSchema();
            const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
          
          
            if (selectedSchema) {
              this.BrachRegistrationService.getbranchNew(selectedSchema, savedIds).subscribe(
                (result: any) => {
                  this.branches = result;
                  this.filteredEmployees = this.branches;
                  
                  if (callback) callback();
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }

    

  
    
// checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
//   return groupPermissions.some(permission => permission.codename === codeName);
// }
 
  
  // loadBranch(): void {
  //   this.BrachRegistrationService.getBranches().subscribe(
  //     (result: any) => {
  //       this.branches = result;
  //       console.log(' fetching branches:');

  //     },
  //     (error) => {
  //       console.error('Error fetching branches:', error);
  //     }
  //   );
  // }


  openPopus(){
    this.dialog.open(BranchCreationComponent,{
      width:'80%',
      height:'700px',
    })
  }


  
  Delete: boolean = false;
  allSelected: boolean = false;

toggleCheckboxes() {
  this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
  this.allSelected = !this.allSelected;
  this.branches.forEach(employee => employee.selected = this.allSelected);
}

onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
}

deleteSelectedEmployees() { 
  const selectedEmployeeIds = this.branches
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Branch selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Branch?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.BrachRegistrationService.deleteBranch(categoryId).subscribe(
        () => {
          console.log('Branch deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.branches = this.branches.filter(employee => employee.id !== categoryId);

           completed++;
 if (completed === total) {
          alert(' Branch deleted successfully')
          window.location.reload();
 }

        },
        (error) => {
          console.error('Error deleting Branch:', error);
        
          // Get backend error message properly
          let errorMessage = '';
        
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.detail) {
              errorMessage = error.error.detail;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = JSON.stringify(error.error);
            }
          } else {
            errorMessage = error.message || 'Unknown error occurred';
          }
        
          // Show ONLY backend message
          alert(errorMessage);
        
          // ❌ remove unnecessary extra alerts
          // alert('Error deleting Branch: ' + error.statusText);
        
          window.location.reload();
        }
      );
    });
  }
}


openEditPopuss(employeeId: number):void{
  const dialogRef = this.dialog.open(BranchEditComponent, {
    width:'80%',
    height:'500px',
    data: { employeeId: employeeId }
    
  });

  dialogRef.afterClosed().subscribe(result => {
    console.log('The dialog was closed');
  });
}

filterEmployees(): void {
  const query = this.searchQuery.toLowerCase();
  this.filteredEmployees = this.branches.filter(branches =>
    branches.branch_code.toLowerCase().includes(query) ||
    branches.branch_name.toLowerCase().includes(query)
  );
}



showEditBtn: boolean = false;

EditShowButtons() {
  this.showEditBtn = !this.showEditBtn;
}
}
