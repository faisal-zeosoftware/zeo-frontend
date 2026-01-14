import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { CompanyRegistrationService } from '../company-registration.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-employee-early-going',
  templateUrl: './employee-early-going.component.html',
  styleUrl: './employee-early-going.component.css'
})
export class EmployeeEarlyGoingComponent {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  

// Properties
selectedYear: number = new Date().getFullYear();
selectedMonth: number = new Date().getMonth() + 1; // Default to current month
displayData: any[] = [];
isLoading: boolean = false;

// Properties for filtering
searchName: string = '';
searchDate: string = '';
originalData: any[] = []; // Store raw API response

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;
  hasExportPermission: boolean = false;

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

  daysArray: number[] = [];



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DesignationService: DesignationService,
    private companyRegistrationService: CompanyRegistrationService, 


  ) { }

  ngOnInit(): void {

    this.daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {




    }

    this.userId = this.sessionService.getUserId();
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
            this.hasExportPermission = true;

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
                    this.hasExportPermission = true;

                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);


                    this.hasAddPermission = this.checkGroupPermission('add_attendancereport', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_attendancereport', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_attendancereport', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);


                    this.hasViewPermission = this.checkGroupPermission('view_attendancereport', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);

                    this.hasExportPermission = this.checkGroupPermission('attendance_export_report', groupPermissions);
                    console.log('Has view permission:', this.hasExportPermission);


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



  generateEmployeeEarlyGoing() {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) return;
  
    this.isLoading = true;
    const url = `${this.apiUrl}/calendars/api/attendance/monthly_late_and_early_attendance/` + 
                 `?month=${this.selectedMonth}&year=${this.selectedYear}&schema=${selectedSchema}`;
  
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        // Filter: Show records that are EITHER late OR early
        this.originalData = data.filter(item => item.late_check_in || item.early_check_out);
        this.applyLocalFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  applyLocalFilters() {
    this.displayData = this.originalData.filter(item => {
      const matchesName = item.employee_name.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesDate = this.searchDate ? item.date === this.searchDate : true;
      return matchesName && matchesDate;
    });
  }

}
