import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { environment } from '../../environments/environment';
import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-attendance-policy',
  templateUrl: './attendance-policy.component.html',
  styleUrl: './attendance-policy.component.css'
})
export class AttendancePolicyComponent {

  policy: any = {
  name: '',
  is_active: false,
  round_off: false,
  early_check_in: false,
  early_check_in_minutes: null,
  late_check_in: false,
  late_check_in_minutes: null,
  early_check_out: false,
  early_check_out_minutes: null,
  late_check_out: false,
  late_check_out_minutes: null,
  branch: null
};

  
    private dataSubscription?: Subscription;
  
      private apiUrl = `${environment.apiBaseUrl}`;
  
    registerButtonClicked = false;
  
    date: any = '';
    check_in_time: any = '';
    check_out_time: any = '';
    total_hours: any = '';
    employee: any = '';
  
    shift: any = '';
  
  
    selectedFile!: File;
    file:any ='';
  
    dept_name: string = '';
    dept_description:string = '';
    branch_id:any = '';
  
    isLoading: boolean = false;
  
  Employees: any[] = [];
  Punching: any[] = [];
  branches:any []=[];

  EmployeeAllAttendance: any[] = [];

  policies: any[] = [];   // ✅ FIX 1: Declare policies


    // allSelected=false;

    //  branch: any = '';

    //  branches:any []=[];
  
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  
  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  
  schemas: string[] = []; // Array to store schema names
  
  
    constructor(
      private http: HttpClient,
      private authService: AuthenticationService,
      private employeeService: EmployeeService,
      private userService: UserMasterService,
      private DepartmentServiceService: DepartmentServiceService,
      private companyRegistrationService: CompanyRegistrationService, 
      
  private DesignationService: DesignationService,
  private sessionService: SessionService,
  
      
  
  
  ) {}
  
  ngOnInit(): void {
  
     // combineLatest waits for both Schema and Branches to have a value
     this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchLoadEmployeePunching(schema, branchIds);  
        
  
      }
    });
  
     // Listen for sidebar changes so the dropdown updates instantly
     this.employeeService.selectedBranches$.subscribe(ids => {
   
      this.LoadEmployee(); 
      this.LoadEmployeeAttendance();
  
    });

this.employeeService.selectedBranches$.subscribe(ids => {
  this.loadDeparmentBranch(); 

});


this.loadPolicies();   // ✅ FIX 2
   
    // this.LoadEmployee();
    // this.LoadEmployeePunching();
    
    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property
          // this.username = this.userDetails.username;
       
    
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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_attendance', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_attendance', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_attendance', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_attendance', groupPermissions);
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
                console.log('scehmas-de',userData)
            },
            (error) => {
                console.error('Failed to fetch user schemas:', error);
            }
        );
    } else {
        console.error('User ID is null.');
    }
    
  
   
  }
  
  
  
       bulkuploaddocument(): void {
        
       const formData = new FormData();
       formData.append('file', this.selectedFile);
    
      const selectedSchema = localStorage.getItem('selectedSchema');
      if (!selectedSchema) {
        console.error('No schema selected.');
        // return throwError('No schema selected.'); // Return an error observable if no schema is selected
      }
  
        /** 🔥 START LOADER */
    this.isLoading = true;
     
     
      // return this.http.put(apiUrl, formData);
  
    
      this.http.post(`${this.apiUrl}/calendars/api/import-attendance/bulk_upload/?schema=${selectedSchema}`, formData)
        .subscribe((response) => {
          // Handle successful upload
          console.log('bulkupload upload successful', response);
          alert('bulkupload upload successful');
          window.location.reload();
  
        }, (error) => {
          // Handle upload error
               /** ❌ STOP LOADER EVEN ON ERROR */
          this.isLoading = false;
          console.error('Attendance upload failed', error);
          alert('Attendance upload failed!');
        });
        }
  
  
  
  
  
   isBulkuploadDepartmentModalOpen :boolean=false;
  
  
  OpenBulkuploadModal():void{
    this.isBulkuploadDepartmentModalOpen = true;
  }
  
  
  
  
  closeBulkuploadModal():void{
    this.isBulkuploadDepartmentModalOpen = false;
  
  }
  
  showBulkUpload: boolean = false;
  
  
  
  
  toggleBulkUpload() {
    this.showBulkUpload = !this.showBulkUpload;
  }
  
      showUploadForm: boolean = false;
  
  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
  }
  
  
  
  
  closeUploadForm(): void {
    this.showUploadForm = false;
  }
  
  
     onFileChange(event: any){
      this.file = event.target.files[0];
      console.log(this.file);
      
    }
     onFileSelected(event: any): void {
      this.selectedFile = event.target.files[0];
    }
  
  
  
    
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
    }
    
    
  
  
    getLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject("Location access denied");
        }
      );
    });
  }
  
  
  getAddress(lat: number, lng: number): Promise<string> {
    return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => data.display_name || "")
      .catch(() => "");
  }
  
  
  
  
  async registerCheckIn(): Promise<void> {
    try {
      this.registerButtonClicked = true;
  
      const position = await this.getLocation();
      const address = await this.getAddress(position.lat, position.lng);
  
      const data = {
        employee: this.employee,
        date: this.date,
        // check_in_time: this.check_in_time,
        // check_out_time: this.check_out_time,
        total_hours: this.total_hours,
        check_in_lat: position.lat,
        check_in_lng: position.lng,
        check_in_location: address
      };
  
      this.employeeService.registerEmployeeAttendenceCheckIn(data).subscribe(
        (response) => {
          alert("Check In successful");
        },
        (error) => {
          alert("Check-In Failed");
        }
      );
  
    } catch (error) {
      alert("Please allow location access!");
    }
  }
  
  
  async registerCheckOut(): Promise<void> {
    try {
      this.registerButtonClicked = true;
  
      const position = await this.getLocation();
      const address = await this.getAddress(position.lat, position.lng);
  
      const data = {
        employee: this.employee,
        date: this.date,
        // check_in_time: this.check_in_time,
        // check_out_time: this.check_out_time,
        total_hours: this.total_hours,
        check_out_lat: position.lat,
        check_out_lng: position.lng,
        check_out_location: address
      };
  
      this.employeeService.registerEmployeeAttendenceCheckOut(data).subscribe(
        (response) => {
          alert("Check Out successful");
        },
        (error) => {
          alert("Check-Out Failed");
        }
      );
  
    } catch (error) {
      alert("Please allow location access!");
    }
  }

  saveAttendancePolicy(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    alert('No schema selected');
    return;
  }

  // 🔥 Clean minutes if checkbox OFF
  if (!this.policy.early_check_in) this.policy.early_check_in_minutes = null;
  if (!this.policy.late_check_in) this.policy.late_check_in_minutes = null;
  if (!this.policy.early_check_out) this.policy.early_check_out_minutes = null;
  if (!this.policy.late_check_out) this.policy.late_check_out_minutes = null;

  console.log('Payload:', this.policy);

  this.http.post(
    `${this.apiUrl}/calendars/api/attendance-policy/?schema=${selectedSchema}`,
    this.policy
  ).subscribe({
    next: (res) => {
      alert('Attendance Policy Created Successfully');
      window.location.reload();
      this.resetPolicy();
    },
    error: (err) => {
      console.error(err);
      alert('Failed to create policy');
    }
  });
}


resetPolicy() {
  this.policy = {
    name: '',
    is_active: false,
    round_off: false,
    early_check_in: false,
    early_check_in_minutes: null,
    late_check_in: false,
    late_check_in_minutes: null,
    early_check_out: false,
    early_check_out_minutes: null,
    late_check_out: false,
    late_check_out_minutes: null,
    branch: null
  };
}

validatePolicy(): boolean {
  if (!this.policy.name) {
    alert('Policy name is required');
    return false;
  }

  if (!this.policy.branch) {
    alert('Branch is required');
    return false;
  }

  return true;
}


loadPolicies(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    console.error('No schema selected');
    return;
  }

  this.http.get<any[]>(
    `${this.apiUrl}/calendars/api/attendance-policy/?schema=${selectedSchema}`
  ).subscribe({
    next: (res) => {
      this.policies = res;   // ✅ Assign data
      console.log('Policies:', this.policies);
    },
    error: (err) => {
      console.error('Error loading policies', err);
    }
  });
}

getBranchName(branchId: number): string {
  if (!branchId || !this.branches || this.branches.length === 0) {
    return 'N/A';
  }

  const branch = this.branches.find((b: any) => b.id === branchId);

  return branch ? branch.branch_name : 'N/A';
}
  
  
    LoadEmployee(callback?: Function) {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getemployeesMasterNew(selectedSchema,savedIds).subscribe(
          (result: any) => {
            this.Employees = result;
            console.log(' fetching Employees:');
            if (callback) callback();
          },
          (error) => {
            console.error('Error fetching Employees:', error);
          }
        );
      }
  
    }
  
  
    // LoadEmployeePunching() {
    //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    //   console.log('schemastore',selectedSchema )
    //   // Check if selectedSchema is available
    //   if (selectedSchema) {
    //     this.employeeService.getPunchings(selectedSchema).subscribe(
    //       (result: any) => {
    //         this.Punching = result;
    //         console.log(' fetching Employees:');
    
    //       },
    //       (error) => {
    //         console.error('Error fetching Employees:', error);
    //       }
    //     );
    //   }
  
    // }
  
  
    // Add these to your component class
  selectedAttendance: any = null;
  
  // This method hides the table and shows the face dashboard
  openFaceDashboard(employeeData: any) {
    this.selectedAttendance = employeeData;
  }
  
  // This method returns to the main table
  closeFaceDashboard() {
    this.selectedAttendance = null;
  }
   
  
    fetchLoadEmployeePunching(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.employeeService.getPunchingsNew(schema, branchIds).subscribe({
        next: (data: any[]) => {
          // Filter active employees
          this.Punching = data.map(item => ({
            ...item,
            isExpanded: false
          }));
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
      });
    }
  
  
  
  
    LoadEmployeeAttendance(callback?: Function): void {
      const selectedSchema = this.authService.getSelectedSchema();
      const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    
    
      if (selectedSchema) {
        this.employeeService.getAllEmployeeAtttendanceNew(selectedSchema, savedIds).subscribe(
          (data: any) => {
            this.EmployeeAllAttendance = data;
            
            if (callback) callback();
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
    }
  
  
  
  
     downloadAttendanceCsv(): void {
        const selectedSchema = this.authService.getSelectedSchema();
        if (!selectedSchema) return;
      
        this.companyRegistrationService.downloadattendanceCsv(selectedSchema).subscribe((blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Attendance_template.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        });
      }
  
  
        downloadAttendanceExcel(): void {
        const selectedSchema = this.authService.getSelectedSchema();
        if (!selectedSchema) return;
      
        this.companyRegistrationService.downloadattendanceExcel(selectedSchema).subscribe((blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Attendance_template.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        });
      }
  
      employeeSearch: string = '';
  allEmployeesSelected: boolean = false;
  
  toggleAllEmployees() {
  
    if (this.allEmployeesSelected) {
  
      this.employee = this.Employees.map((emp: any) => emp.id);
  
    } else {
  
      this.employee = [];
  
    }
  
  }
  
  filterEmployees() {
  
    if (!this.employeeSearch) {
      return this.Employees;
    }
  
    return this.Employees.filter((emp: any) =>
      emp.emp_code.toLowerCase().includes(this.employeeSearch.toLowerCase())
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
  this.policy.branch = this.branches[0].id;  // ✅ CORRECT
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

//   mapBranchNameToId() {
    
//   if (!this.branches || !this.editAsset?.branch_id) return;

//   const bra = this.branches.find(
//     (b: any) => b.branch_name === this.editAsset.branch_id
//   );

//   if (bra) {
//     this.editAsset.branch_id = bra.id;  // convert to ID for dropdown
//   }

//   console.log("Mapped employee_id:", this.editAsset.branch_id);
// }

  
  
  

}
