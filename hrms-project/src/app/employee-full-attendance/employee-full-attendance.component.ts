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
import {combineLatest, Observable, Subscription } from 'rxjs';
import JsBarcode from 'jsbarcode';


@Component({
  selector: 'app-employee-full-attendance',
  templateUrl: './employee-full-attendance.component.html',
  styleUrl: './employee-full-attendance.component.css'
})
export class EmployeeFullAttendanceComponent {

  

//   private dataSubscription?: Subscription;

//     private apiUrl = `${environment.apiBaseUrl}`;


//   isLoading: boolean = false;

//   Employees: any[] = [];

//   selectedEmployeeId: any = '';

//   fromDate: string = '';

//   toDate: string = '';

//   attendanceData: any = null;

//   calendarOptions: any = {

//     initialView: 'dayGridMonth',
  
//     plugins: [
//       dayGridPlugin,
//       interactionPlugin
//     ],
  
//     height: 700,
  
//     events: [],
  
//     selectable: false,
  
//     editable: false,
  
//     fixedWeekCount: false,
  
//     showNonCurrentDates: false,
  
//     dayMaxEvents: true,
  
//     eventClick: this.handleEventClick.bind(this),
  
//     validRange: {
  
//       start: '',
  
//       end: ''
  
//     }
  
//   };


// userId: number | null | undefined;
// userDetails: any;
// userDetailss: any;

// hasAddPermission: boolean = false;
// hasDeletePermission: boolean = false;
// hasViewPermission: boolean =false;
// hasEditPermission: boolean = false;


// schemas: string[] = []; // Array to store schema names

// todayDate: string = '';

//   constructor(
//     private http: HttpClient,
//     private authService: AuthenticationService,
//     private employeeService: EmployeeService,
//     private userService: UserMasterService,
//     private DepartmentServiceService: DepartmentServiceService,
//     private companyRegistrationService: CompanyRegistrationService, 
    
// private DesignationService: DesignationService,
// private sessionService: SessionService,

    


// ) {}

// ngOnInit(): void {


//   this.todayDate = new Date()
//     .toISOString()
//     .split('T')[0];

//   this.fromDate = this.todayDate;

//   this.toDate = this.todayDate;

//    // combineLatest waits for both Schema and Branches to have a value
//    this.dataSubscription = combineLatest([
//     this.employeeService.selectedSchema$,
//     this.employeeService.selectedBranches$
//   ]).subscribe(([schema, branchIds]) => {
//     if (schema) {
      

//     }
//   });

//    // Listen for sidebar changes so the dropdown updates instantly
//    this.employeeService.selectedBranches$.subscribe(ids => {
 
//     this.LoadEmployee(); 
   

//   });
 
//   // this.LoadEmployee();
//   // this.LoadEmployeePunching();
  
//   this.userId = this.sessionService.getUserId();
//   if (this.userId !== null) {
//     this.authService.getUserData(this.userId).subscribe(
//       async (userData: any) => {
//         this.userDetails = userData; // Store user details in userDetails property
//         // this.username = this.userDetails.username;
     
  
//         console.log('User ID:', this.userId); // Log user ID
//         console.log('User Details:', this.userDetails); // Log user details
  
//         // Check if user is_superuser is true or false
//         let isSuperuser = this.userDetails.is_superuser || false; // Default to false if is_superuser is undefined
//         const selectedSchema = this.authService.getSelectedSchema();
//         if (!selectedSchema) {
//           console.error('No schema selected.');
//           return;
//         }
      
      
//         if (isSuperuser) {
//           console.log('User is superuser or ESS user');
          
//           // Grant all permissions
//           this.hasViewPermission = true;
//           this.hasAddPermission = true;
//           this.hasDeletePermission = true;
//           this.hasEditPermission = true;
      
//           // Fetch designations without checking permissions
//           // this.fetchDesignations(selectedSchema);
//         } else {
//           console.log('User is not superuser');
  
//           const selectedSchema = this.authService.getSelectedSchema();
//           if (selectedSchema) {
           
            
            
//             try {
//               const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
//               console.log('Permissions data:', permissionsData);
  
//               if (Array.isArray(permissionsData) && permissionsData.length > 0) {
//                 const firstItem = permissionsData[0];
  
//                 if (firstItem.is_superuser) {
//                   console.log('User is superuser according to permissions API');
//                   // Grant all permissions
//                   this.hasViewPermission = true;
//                   this.hasAddPermission = true;
//                   this.hasDeletePermission = true;
//                   this.hasEditPermission = true;
//                 } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
//                   const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
//                   console.log('Group Permissions:', groupPermissions);
  
                 
//                   this.hasAddPermission = this.checkGroupPermission('add_attendance_faceregister', groupPermissions);
//                   console.log('Has add permission:', this.hasAddPermission);
                  
//                   this.hasEditPermission = this.checkGroupPermission('change_attendance_faceregister', groupPermissions);
//                   console.log('Has edit permission:', this.hasEditPermission);
    
//                  this.hasDeletePermission = this.checkGroupPermission('delete_attendance_faceregister', groupPermissions);
//                  console.log('Has delete permission:', this.hasDeletePermission);
    
  
//                   this.hasViewPermission = this.checkGroupPermission('view_attendance_faceregister', groupPermissions);
//                   console.log('Has view permission:', this.hasViewPermission);
  
  
//                 } else {
//                   console.error('No groups found in data or groups array is empty.', firstItem);
//                 }
//               } else {
//                 console.error('Permissions data is not an array or is empty.', permissionsData);
//               }
  
//               // Fetching designations after checking permissions
//               // this.fetchDesignations(selectedSchema);
//             }
            
//             catch (error) {
//               console.error('Error fetching permissions:', error);
//             }
//           } else {
//             console.error('No schema selected.');
//           }
            
//         }
//       },
//       (error) => {
//         console.error('Failed to fetch user details:', error);
//       }
//     );
  
//       // this.fetchingApprovals();


//       this.authService.getUserSchema(this.userId).subscribe(
//           (userData: any) => {
//               this.userDetailss = userData;
//               this.schemas = userData.map((schema: any) => schema.schema_name);
//               console.log('scehmas-de',userData)
//           },
//           (error) => {
//               console.error('Failed to fetch user schemas:', error);
//           }
//       );
//   } else {
//       console.error('User ID is null.');
//   }
  

 
// }



    





  
// checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
//   return groupPermissions.some(permission => permission.codename === codeName);
//   }
  
  











//   LoadEmployee(callback?: Function) {
//     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
//     const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

//     console.log('schemastore',selectedSchema )
//     // Check if selectedSchema is available
//     if (selectedSchema) {
//       this.employeeService.getemployeesMasterNew(selectedSchema,savedIds).subscribe(
//         (result: any) => {
//           this.Employees = result;
//           console.log(' fetching Employees:');
//           if (callback) callback();
//         },
//         (error) => {
//           console.error('Error fetching Employees:', error);
//         }
//       );
//     }

//   }



//  // =====================================
//   // Load Attendance Calendar
//   // =====================================

//   loadAttendanceCalendar() {

//     if (!this.selectedEmployeeId) {
  
//       alert('Please select employee');
  
//       return;
  
//     }
  
//     if (!this.fromDate || !this.toDate) {
  
//       alert('Please select dates');
  
//       return;
  
//     }
  
//     const selectedSchema =
//       this.authService.getSelectedSchema();
  
//     if (!selectedSchema) {
  
//       alert('Schema not found');
  
//       return;
  
//     }
  
  
  
//     this.employeeService
//       .getAttendanceCalendar(
//         this.selectedEmployeeId,
//         this.fromDate,
//         this.toDate,
//         selectedSchema
//       )
//       .subscribe(
  
//         (response: any) => {
  
//           console.log(response);
  
//           this.attendanceData = response;
  
  
  
//           // Generate Events
//           this.generateCalendarEvents(
//             response.calendar
//           );
  
  
  
//           // IMPORTANT
//           // ONLY selected dates visible
  
//           this.calendarOptions = {
  
//             ...this.calendarOptions,
  
//             validRange: {
  
//               start: this.fromDate,
  
//               end: this.getNextDate(this.toDate)
  
//             }
  
//           };
  
//         },
  
//         (error) => {
  
//           console.error(error);
  
//         }
  
//       );
  
//   }



//   // =====================================
//   // Generate Calendar Events
//   // =====================================

//   generateCalendarEvents(calendarData: any[]) {

//     const events: any[] = [];



//     calendarData.forEach((item: any) => {

//       let color = '';



//       switch (item.status) {

//         case 'Present':
//           color = '#28a745';
//           break;

//         case 'Leave':
//           color = '#ff9800';
//           break;

//         case 'Absent':
//           color = '#dc3545';
//           break;

//         case 'Half Day':
//           color = '#17a2b8';
//           break;

//         case 'Holiday':
//           color = '#6f42c1';
//           break;

//         default:
//           color = '#6c757d';
//       }



//       events.push({

//         title:
//           item.leave_type
//             ? `${item.display_status} (${item.leave_type})`
//             : item.display_status,

//         date: item.date,

//         color: color,

//         extendedProps: {

//           remarks: item.remarks,

//           status: item.status,

//           leave_type: item.leave_type,

//           is_half_day: item.is_half_day

//         }

//       });

//     });



//     this.calendarOptions = {

//       ...this.calendarOptions,

//       events: events

//     };

//   }

  
//   getNextDate(dateString: string): string {

//     const date = new Date(dateString);
  
//     // Add one day
//     date.setDate(date.getDate() + 1);
  
//     // Convert to yyyy-mm-dd
//     return date.toISOString().split('T')[0];
  
//   }

//   // =====================================
//   // Event Click
//   // =====================================

//   handleEventClick(clickInfo: any) {

//     const props =
//       clickInfo.event.extendedProps;



//     alert(

//       'Status: ' + props.status + '\n' +

//       'Leave Type: ' +
//       (props.leave_type || 'N/A') + '\n' +

//       'Remarks: ' +
//       props.remarks

//     );

//   }

  

}
