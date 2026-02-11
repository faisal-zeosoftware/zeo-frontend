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
  selector: 'app-attendace-marking',
  templateUrl: './attendace-marking.component.html',
  styleUrl: './attendace-marking.component.css'
})
export class AttendaceMarkingComponent {

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
EmployeeAllAttendance: any[] = [];


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



    // Submit file to backend
    // submitBulkUpload() {
    //   if (!this.selectedFile) {
    //     alert('Please select a file first.');
    //     return;
    //   }
    
    //   const selectedSchema = localStorage.getItem('selectedSchema');
    //   if (!selectedSchema) {
    //     alert('No schema selected.');
    //     return;
    //   }
    
    //   const formData = new FormData();
    //   formData.append('file', this.selectedFile);
    
    //   const uploadUrl = `http://localhost:8000/calendars/api/import-attendance/bulk_upload/?schema=${selectedSchema}`;
    
    //   this.http.post(uploadUrl, formData).subscribe(
    //     (response: any) => {
    //       console.log('Bulk upload successful', response);
    //       alert('Bulk upload successful!');
    //       this.selectedFile = null;
    //       this.showBulkUpload = false;
    //     },
    //     (error: any) => {
    //       console.error('Bulk upload failed', error);
    //       alert('Bulk upload failed. Please check the file and try again.');
    //     }
    //   );
    // }
        


// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_attendance' ||'change_attendance' ||'delete_attendance' ||'view_attendance';
  
  
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

 

  fetchLoadEmployeePunching(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.employeeService.getPunchingsNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.Punching = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }


  // LoadEmployeeAttendance() {
  //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  //   console.log('schemastore',selectedSchema )
  //   // Check if selectedSchema is available
  //   if (selectedSchema) {
  //     this.employeeService.getAllEmployeeAtttendance(selectedSchema).subscribe(
  //       (result: any) => {
  //         this.EmployeeAllAttendance = result;
  //         console.log(' fetching EmployeeAllAttendance:');
  
  //       },
  //       (error) => {
  //         console.error('Error fetching EmployeeAllAttendance:', error);
  //       }
  //     );
  //   }

  // }


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
    



}
