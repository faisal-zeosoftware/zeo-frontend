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

@Component({
  selector: 'app-attendance-punching',
  templateUrl: './attendance-punching.component.html',
  styleUrl: './attendance-punching.component.css'
})
export class AttendancePunchingComponent {


  

  @ViewChild('videoElement') videoElement!: ElementRef;
  activeMode: string | null = null;
  stream: MediaStream | null = null;  
  isProcessing = false;
  lastPunchType: 'in' | 'out' = 'out'; // Toggle state
  autoScanActive = false;

  setMode(mode: string | null) {
    this.activeMode = mode;
    if (mode === 'face') {
      this.autoScanActive = true;
      this.startCamera();
    } else {
      this.autoScanActive = false;
      this.stopCamera();
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      this.videoElement.nativeElement.srcObject = this.stream;
      
      // Start the automatic scanning loop
      this.autoCaptureLoop();
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  }
  
  autoCaptureLoop() {
    if (!this.autoScanActive || !this.activeMode) return;
  
    if (!this.isProcessing) {
      // Give the user 3 seconds to align their face before the automatic capture
      setTimeout(() => {
        if (this.autoScanActive) {
          this.performAutoPunch();
        }
      }, 3000); 
    }
  }


  performAutoPunch() {
    const video = this.videoElement.nativeElement;
    if (video.paused || video.ended || video.readyState < 2) return;
  
    const canvas = document.createElement('canvas');
    canvas.width = 160; // Use small resolution for local verification to save memory
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
  
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Check if the image has enough detail/brightness to be a face
      // This prevents calling the API on a dark room or empty wall
      if (this.isHumanPresent(ctx, canvas.width, canvas.height)) {
        
        this.isProcessing = true; // Stop the loop
        
        // Capture high-quality image for the actual API call
        const highResCanvas = document.createElement('canvas');
        highResCanvas.width = 640;
        highResCanvas.height = 480;
        const highResCtx = highResCanvas.getContext('2d');
        
        if (highResCtx) {
          highResCtx.translate(640, 0);
          highResCtx.scale(-1, 1);
          highResCtx.drawImage(video, 0, 0, 640, 480);
          
          const base64Image = highResCanvas.toDataURL('image/jpeg', 0.9).split(',')[1];
          this.sendPunchRequest(base64Image);
        }
      }
    }
  }
  
  // Simple local check to see if there is enough visual data to bother the API
  private isHumanPresent(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
    const imageData = ctx.getImageData(0, 0, w, h).data;
    let brightness = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      brightness += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
    }
    const avgBrightness = brightness / (w * h);
    
    // Only trigger API if brightness is between 40 and 220 (avoids pitch black or pure white)
    return avgBrightness > 40 && avgBrightness < 220;
  }


 private sendPunchRequest(base64Image: string) {
  const schema = this.authService.getSelectedSchema();
  const punchAction = this.lastPunchType === 'out' ? 'check_in' : 'check_out';
  const url = `${this.apiUrl}/calendars/api/attendance/face_attendance/?schema=${schema}`;

  this.http.post(url, { face_photo: base64Image }).subscribe({
    next: (res: any) => {
      alert(`Auto ${punchAction.replace('_', ' ')} Success!`);
      this.lastPunchType = this.lastPunchType === 'out' ? 'in' : 'out';
      this.closeAndReset(); // Close on success
    },
    error: (err) => {
      console.error("Verification failed:", err);
      const errorMsg = err.error?.detail || "Recognition Failed";
      alert(errorMsg);
      this.closeAndReset(); // Also close on failure
    }
  });
}

// Helper method to clean up the UI and Hardware
private closeAndReset() {
  this.autoScanActive = false;
  this.stopCamera();
  this.activeMode = null;
  this.isProcessing = false;
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
