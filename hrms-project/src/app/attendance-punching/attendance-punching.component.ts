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
    if (!this.autoScanActive) return;
  
    // Only attempt to punch if we aren't already waiting for a response
    if (!this.isProcessing) {
      this.performAutoPunch();
    }
  
    // Check again in 2 seconds (gives the user time to align and prevents server overload)
    setTimeout(() => {
      requestAnimationFrame(() => this.autoCaptureLoop());
    }, 2000); 
  }
  
 performAutoPunch() {
    const video = this.videoElement.nativeElement;
    if (video.paused || video.ended) return;

    this.isProcessing = true;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    
    const ctx = canvas.getContext('2d');

    /**
     * FIX FOR TS18047: Wrapped canvas operations in a null check
     */
    if (ctx) {
      ctx.translate(640, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, 640, 480);
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      this.sendPunchRequest(base64Image);
    } else {
      // Handle the rare case where canvas context isn't available
      this.isProcessing = false;
    }
  }

  private sendPunchRequest(base64Image: string) {
    const schema = this.authService.getSelectedSchema();
    const punchAction = this.lastPunchType === 'out' ? 'check_in' : 'check_out';
    const url = `${this.apiUrl}/calendars/api/attendance/${punchAction}/?schema=${schema}`;

    this.http.post(url, { face_photo: base64Image }).subscribe({
      next: (res: any) => {
        alert(`Auto ${punchAction.replace('_', ' ')} Success!`);
        this.lastPunchType = this.lastPunchType === 'out' ? 'in' : 'out';
        setTimeout(() => { this.isProcessing = false; }, 5000);
      },
      error: (err) => {
        this.isProcessing = false;
      }
    });
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
