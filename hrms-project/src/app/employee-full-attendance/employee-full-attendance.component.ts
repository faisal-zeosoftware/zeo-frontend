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

import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-employee-full-attendance',
  templateUrl: './employee-full-attendance.component.html',
  styleUrl: './employee-full-attendance.component.css'
})
export class EmployeeFullAttendanceComponent {

  private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`;

  isLoading: boolean = false;

  Employees: any[] = [];

  selectedEmployeeId: any = '';

  fromDate: string = '';

  toDate: string = '';

  // Holds the single employee's attendance payload
  // Shape: { employee_id, employee_code, employee_name, branch, department, calendar: [...] }
  attendanceData: any = null;

  // Summary counts derived from calendar data, shown above the calendar
  attendanceSummary: { label: string; count: number; color: string }[] = [];

  calendarOptions: any = {

    initialView: 'dayGridMonth',

    plugins: [
      dayGridPlugin,
      interactionPlugin
    ],

    height: 700,

    events: [],

    selectable: false,

    editable: false,

    fixedWeekCount: false,

    showNonCurrentDates: false,

    dayMaxEvents: true,

    eventClick: this.handleEventClick.bind(this),

    validRange: {

      start: '',

      end: ''

    }

  };


  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;


  schemas: string[] = []; // Array to store schema names

  todayDate: string = '';

  // Central place to map a status string to a color used across
  // the calendar dots AND the summary legend, so they always match.
  private statusColorMap: { [key: string]: string } = {
    'Present': '#28a745',
    'Leave': '#dc3545',
    'Absent': '#ff9800',
    'Half Day': '#17a2b8',
    'Holiday': '#6f42c1'
  };
  private defaultStatusColor = '#6c757d';

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

    this.todayDate = new Date()
      .toISOString()
      .split('T')[0];

    this.fromDate = this.todayDate;

    this.toDate = this.todayDate;

     // combineLatest waits for both Schema and Branches to have a value
     this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {


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


  // =====================================
  // Load Attendance Calendar
  // =====================================

  loadAttendanceCalendar() {

    if (!this.selectedEmployeeId) {

      alert('Please select employee');

      return;

    }

    if (!this.fromDate || !this.toDate) {

      alert('Please select dates');

      return;

    }

    const selectedSchema =
      this.authService.getSelectedSchema();

    if (!selectedSchema) {

      alert('Schema not found');

      return;

    }

    this.isLoading = true;

    this.employeeService
      .getAttendanceCalendar(
        this.selectedEmployeeId,
        this.fromDate,
        this.toDate,
        selectedSchema
      )
      .subscribe(

        (response: any) => {

          console.log(response);

          this.isLoading = false;

          // Real API shape:
          // { start_date, end_date, total_employees, employees: [ { employee_id, employee_name, employee_code, branch, department, calendar: [...] } ] }
          if (!response?.employees?.length) {
            console.error('No employee attendance data returned for this selection.');
            this.attendanceData = null;
            this.attendanceSummary = [];
            this.calendarOptions = { ...this.calendarOptions, events: [] };
            return;
          }

          // Since a single employee is selected in the dropdown, take the first match.
          const employeeData = response.employees[0];

          this.attendanceData = employeeData;

          // Generate Events
          this.generateCalendarEvents(
            employeeData.calendar || []
          );

          // IMPORTANT
          // ONLY selected dates visible

          this.calendarOptions = {

            ...this.calendarOptions,

            validRange: {

              start: this.fromDate,

              end: this.getNextDate(this.toDate)

            }

          };

        },

        (error) => {

          this.isLoading = false;

          console.error(error);

          alert('Failed to load attendance calendar. Please try again.');

        }

      );

  }


  // =====================================
  // Generate Calendar Events + Summary
  // =====================================

  generateCalendarEvents(calendarData: any[]) {

    const events: any[] = [];

    // Tally counts per status for the summary strip above the calendar
    const counts: { [key: string]: number } = {};

    calendarData.forEach((item: any) => {

      const color = this.statusColorMap[item.status] || this.defaultStatusColor;

      counts[item.status] = (counts[item.status] || 0) + 1;

      events.push({

        title:
          item.leave_type
            ? `${item.display_status}`
            : item.display_status,

        date: item.date,

        color: color,

        extendedProps: {

          remarks: item.remarks,

          status: item.status,

          leave_type: item.leave_type,

          is_half_day: item.is_half_day,

          day: item.day

        }

      });

    });

    this.attendanceSummary = Object.keys(counts).map(status => ({
      label: status,
      count: counts[status],
      color: this.statusColorMap[status] || this.defaultStatusColor
    }));

    this.calendarOptions = {

      ...this.calendarOptions,

      events: events

    };

  }


  getNextDate(dateString: string): string {

    const date = new Date(dateString);

    // Add one day
    date.setDate(date.getDate() + 1);

    // Convert to yyyy-mm-dd
    return date.toISOString().split('T')[0];

  }

  // =====================================
  // Event Click
  // =====================================

showEventCard = false;

selectedEvent: any = {
  status: '',
  leave_type: '',
  remarks: '',
  is_half_day: ''
};

handleEventClick(clickInfo: any) {
  const props = clickInfo.event.extendedProps;

  this.selectedEvent = {
    status: props.status,
    leave_type: props.leave_type || 'N/A',
    remarks: props.remarks || 'N/A',
    is_half_day: props.is_half_day ? 'Yes' : 'No'
  };

  this.showEventCard = true;
}

closeEventCard() {
  this.showEventCard = false;
}

employeeSearch: string = '';

filterEmployees(): any[] {
  if (!this.employeeSearch || this.employeeSearch.trim() === '') {
    return this.Employees;
  }

  const search = this.employeeSearch.toLowerCase().trim();

  return this.Employees.filter((emp: any) =>
    emp.emp_code?.toLowerCase().includes(search) ||
    emp.emp_name?.toLowerCase().includes(search) ||
    emp.first_name?.toLowerCase().includes(search) ||
    emp.last_name?.toLowerCase().includes(search)
  );
}

}