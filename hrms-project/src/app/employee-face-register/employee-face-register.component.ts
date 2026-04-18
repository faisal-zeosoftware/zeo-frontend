import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { environment } from '../../environments/environment';
import {combineLatest, Subscription } from 'rxjs';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-employee-face-register',
  templateUrl: './employee-face-register.component.html',
  styleUrl: './employee-face-register.component.css'
})
export class EmployeeFaceRegisterComponent {

  

  @ViewChild('videoElement') videoElement!: ElementRef;
  activeMode: string | null = null;
  stream: MediaStream | null = null;  
  isProcessing = false;
  lastPunchType: 'in' | 'out' = 'out'; // Toggle state
  autoScanActive = false;

employeeId: any = null;
capturedImage: string | null = null;
isCameraOpen = false;

barcodeValue: string = '';



  // setMode(mode: string | null) {
  //   this.activeMode = mode;
  //   if (mode === 'face') {
  //     this.autoScanActive = true;
  //     this.startCamera();
  //   } else {
  //     this.autoScanActive = false;
  //     this.stopCamera();
  //   }
  // }

  // Update setMode to clear barcode values
setMode(mode: string | null) {
  this.activeMode = mode;
  this.barcodeValue = ''; // Reset barcode on mode change
  if (mode === 'face') {
    this.autoScanActive = true;
    this.startCamera();
  } else {
    this.autoScanActive = false;
    this.stopCamera();
    // Optional: Focus the input field after a short delay if barcode mode
    if(mode === 'barcode') {
       setTimeout(() => {
         const input = document.querySelector('input[placeholder="Waiting for scan..."]') as HTMLElement;
         input?.focus();
       }, 500);
    }
  }
}

// 🎯 Generate Barcode
generateBarcode() {
  if (!this.employeeId) {
    alert("Please select an employee first");
    return;
  }

  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  this.barcodeValue = `EMP-${random}`;

  setTimeout(() => {
    this.renderBarcode();
  }, 100);
}

// 🎯 Render Barcode Image
renderBarcode() {
  const element = document.getElementById('barcode');

  if (element && this.barcodeValue) {
    JsBarcode(element, this.barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true
    });
  }
}

// 🎯 Download Barcode
downloadBarcode() {
  const svg = document.getElementById("barcode") as any;

  if (!svg) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);

  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${this.barcodeValue}.svg`;
  a.click();

  URL.revokeObjectURL(url);
}

// 🎯 Register Barcode API
registerBarcode() {
  if (!this.employeeId || !this.barcodeValue) {
    alert("Please select employee and generate barcode.");
    return;
  }

  this.isProcessing = true;

  const schema = this.authService.getSelectedSchema();
  const url = `${this.apiUrl}/calendars/api/attendance/register_barcode/?schema=${schema}`;

  const payload = {
    employee: this.employeeId,
    barcode: this.barcodeValue
  };

  this.http.post(url, payload).subscribe({
    next: () => {
      alert("Barcode assigned successfully!");
      this.barcodeValue = '';
      this.isProcessing = false;
      this.activeMode = null;
    },
    error: (err) => {
      console.error(err);
      alert(err.error?.detail || "Failed to register barcode");
      this.isProcessing = false;
    }
  });
}

  // Start the webcam feed
  // async startCamera() {
  //   this.isCameraOpen = true;
  //   try {
  //     this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
  //     setTimeout(() => {
  //       this.videoElement.nativeElement.srcObject = this.stream;
  //     }, 100);
  //   } catch (err) {
  //     console.error("Camera access denied", err);
  //   }
  // }


  async startCamera() {
    this.isCameraOpen = true;
  
    // 1. Check if the browser even supports/allows mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Browser does not support camera access in this context (Needs HTTPS)");
      alert("Security Error: Camera access is blocked. This site MUST use HTTPS to use the camera.");
      this.isCameraOpen = false;
      return;
    }
  
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 300 } 
      });
  
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
        }
      }, 200);
  
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access denied. Please check site permissions.");
    }
  }
  
  // Capture the frame from the video
  capturePhoto() {
    const video = this.videoElement.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    // Convert to Base64 (Data URL)
    this.capturedImage = canvas.toDataURL('image/jpeg');
  }
  
  // Submit to Backend
  registerFace() {
    if (!this.employeeId || !this.capturedImage) {
      alert("Please select an employee and capture a photo first.");
      return;
    }
  
    const payload = {
      employee: this.employeeId,
      face_photo: this.capturedImage // This is the base64_string
    };
  
    const schema = this.authService.getSelectedSchema();
    const url = `${this.apiUrl}/calendars/api/attendance/enroll_face/?schema=${schema}`;
  
    this.http.post(url, payload).subscribe({
      next: (response) => {
        alert("Face registered successfully!");
        this.stopCamera();
      },
      error: (err) => {
        console.error("Enrollment error", err);
        alert("Failed to register face.");
      }
    });
  }
  
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.isCameraOpen = false;
    this.capturedImage = null;
  }
      


  


  private dataSubscription?: Subscription;

    private apiUrl = `${environment.apiBaseUrl}`;


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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_attendance_faceregister', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_attendance_faceregister', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_attendance_faceregister', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_attendance_faceregister', groupPermissions);
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



    





  
checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
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


  




    

}
