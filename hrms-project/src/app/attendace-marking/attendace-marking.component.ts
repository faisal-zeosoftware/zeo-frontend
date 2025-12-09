import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';

@Component({
  selector: 'app-attendace-marking',
  templateUrl: './attendace-marking.component.html',
  styleUrl: './attendace-marking.component.css'
})
export class AttendaceMarkingComponent {

  registerButtonClicked = false;

  date: any = '';
  check_in_time: any = '';
  check_out_time: any = '';
  total_hours: any = '';
  employee: any = '';

  shift: any = '';

Employees: any[] = [];
Punching: any[] = [];

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
    
private DesignationService: DesignationService,
private sessionService: SessionService,

    


) {}

ngOnInit(): void {
 
  this.LoadEmployee();
  this.LoadEmployeePunching();
  
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



showBulkUpload: boolean = false;
  selectedFile: File | null = null;


toggleBulkUpload() {
  this.showBulkUpload = !this.showBulkUpload;
}


    // File selection
    onFileSelected(event: any) {
      this.selectedFile = event.target.files[0];
      console.log('Selected file:', this.selectedFile);
    }
    
    // Submit file to backend
    submitBulkUpload() {
      if (!this.selectedFile) {
        alert('Please select a file first.');
        return;
      }
    
      const selectedSchema = localStorage.getItem('selectedSchema');
      if (!selectedSchema) {
        alert('No schema selected.');
        return;
      }
    
      const formData = new FormData();
      formData.append('file', this.selectedFile);
    
      const uploadUrl = `http://localhost:8000/calendars/api/import-attendance/bulk_upload/?schema=${selectedSchema}`;
    
      this.http.post(uploadUrl, formData).subscribe(
        (response: any) => {
          console.log('Bulk upload successful', response);
          alert('Bulk upload successful!');
          this.selectedFile = null;
          this.showBulkUpload = false;
        },
        (error: any) => {
          console.error('Bulk upload failed', error);
          alert('Bulk upload failed. Please check the file and try again.');
        }
      );
    }
        


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


  LoadEmployee() {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getemployeesMaster(selectedSchema).subscribe(
        (result: any) => {
          this.Employees = result;
          console.log(' fetching Employees:');
  
        },
        (error) => {
          console.error('Error fetching Employees:', error);
        }
      );
    }

  }


  LoadEmployeePunching() {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getPunchings(selectedSchema).subscribe(
        (result: any) => {
          this.Punching = result;
          console.log(' fetching Employees:');
  
        },
        (error) => {
          console.error('Error fetching Employees:', error);
        }
      );
    }

  }



}
