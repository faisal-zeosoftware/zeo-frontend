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
import { EmployeeService } from '../employee-master/employee.service';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-employee-punching-list',
  templateUrl: './employee-punching-list.component.html',
  styleUrl: './employee-punching-list.component.css'
})
export class EmployeePunchingListComponent {


  
  attendanceSummary: any[] = [];

  allAttendanceData: any[] = []; // All employees attendance

  Employees: any[] = [];
  branches: any[] = [];
  departments: any[] = [];
  Designations: any[] = [];
  Categoried: any[] = [];



  


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
    private employeeService: EmployeeService, 
    private DepartmentServiceService: DepartmentServiceService


  ) { }

  ngOnInit(): void {


       // Listen for sidebar changes so the dropdown updates instantly
   this.employeeService.selectedBranches$.subscribe(ids => {
 
    this.LoadEmployee(); 
  

  });
 

    this.daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {

      this.loadbranches();
      this.loadDepartments();
      this.loadDesignations();
      this.loadCategoried();


      // this.LoadEmployee(selectedSchema);

      this.loadAllAttendance(selectedSchema); // Load all on init


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



  exportToExcel(): void {
    const data: any[][] = [];
  
    const reportTitle = `Attendance Report - ${this.attendanceData.month} /${this.attendanceData.year}`;
    const headerRow = ['Employee Name', ...this.daysArray, 'Present Days', 'Absent Days'];
    const titleRow = [reportTitle];
  
    data.push(titleRow);
    data.push([]); // spacing row
    data.push(headerRow);
  
    const employeeRow: any[] = [this.attendanceData.employee_name];
    for (let day of this.daysArray) {
      const status = this.getStatusForDay(day, this.attendanceData.summary_data);
      employeeRow.push(status);
    }
    employeeRow.push(this.attendanceData.total_present);
    employeeRow.push(this.attendanceData.total_absent);
    data.push(employeeRow);
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  
    // Merge title row
    const mergeRef = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: 0, c: headerRow.length - 1 }
    });
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push(XLSX.utils.decode_range(mergeRef));
  
    // Apply center style to merged title
    worksheet['A1'].s = {
      alignment: { horizontal: 'center', vertical: 'center' },
      font: { bold: true, sz: 14 }
    };
  
    // Apply styles to "Absent" or "A" cells
    const dataRowIndex = 3; // since it's the 4th row (0-indexed)
    for (let col = 1; col <= this.daysArray.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataRowIndex, c: col });
      const cell = worksheet[cellRef];
      if (cell && (cell.v === 'Absent' || cell.v === 'A')) {
        cell.s = {
          font: { color: { rgb: "FF0000" }, bold: true },
          alignment: { horizontal: "center" }
        };
      }
    }
  
    // Create workbook and save
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Attendance Report': worksheet },
      SheetNames: ['Attendance Report']
    };
  
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true // Important for styles to apply
    });
  
    const fileData: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
  
    FileSaver.saveAs(
      fileData,
      `Attendance_Report_${this.attendanceData.employee_name}_${this.attendanceData.month}_${this.attendanceData.year}.xlsx`
    );
  }
  

  getStatusForDay(day: number, summary_data: any[]): string {
    const entry = summary_data.find((d: { date: string }) => {
      const dateObj = new Date(d.date);
      return dateObj.getDate() === day;
    });
    return entry ? this.getShortStatus(entry.status) : '-';
  }
  

  getShortStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'leave': return 'L';
      case 'holiday': return 'H';

      default: return status;
    }
  }
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }



  // LoadEmployee(selectedSchema: string): void {
  //   this.leaveService.getEmployee(selectedSchema).subscribe(
  //     (data: any) => {
  //       // Filter only approved leave requests
  //       this.Employees = data;

  //       console.log('Approved leave requests:', this.Employees);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching leave requests:', error);
  //     }
  //   );
  // }

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



  loadAllAttendance(schema: string): void {
    this.leaveService.getAllAttendance(schema).subscribe(
      (data) => {
        this.allAttendanceData = data;
      },
      (error) => {
        console.error('Error loading all attendance', error);
      }
    );
  }







 

  
  loadbranches(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.companyRegistrationService.getBranchesList(selectedSchema).subscribe(
        (result: any) => {
          this.branches = result;
        },
        (error: any) => {
          console.error('Error fetching countries:', error);
        }
      );
    }
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
            this.branches = this.branches[0].id;
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


  
loadDepartments(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema)
  // Check if selectedSchema is available
  if (selectedSchema) {

    this.companyRegistrationService.getDepartmentsList(selectedSchema).subscribe(
      (result: any) => {
        this.departments = result;
      },
      (error: any) => {
        console.error('Error fetching countries:', error);
      }
    );
  }
}


    
loadDesignations(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema)
  // Check if selectedSchema is available
  if (selectedSchema) {

    this.companyRegistrationService.getDesignationList(selectedSchema).subscribe(
      (result: any) => {
        this.Designations = result;
      },
      (error: any) => {
        console.error('Error fetching countries:', error);
      }
    );
  }
}

loadCategoried(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema)
  // Check if selectedSchema is available
  if (selectedSchema) {

    this.companyRegistrationService.getcatgoriesList(selectedSchema).subscribe(
      (result: any) => {
        this.Categoried = result;
      },
      (error: any) => {
        console.error('Error fetching countries:', error);
      }
    );
  }
}





allSelected = false;
allSelecteddept = false;
allSelectedcat = false;
allSelecteddes = false;

allSelectedEmp = false;

  @ViewChild('select') select: MatSelect | undefined;
    @ViewChild('selectdept') selectdept: MatSelect | undefined;

  @ViewChild('selectdes') selectdes: MatSelect | undefined;

  @ViewChild('selectcat') selectcat: MatSelect | undefined;
  @ViewChild('selectemp') selectemp: MatSelect | undefined;




  

  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {

        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectiondept(): void {
    if (this.select) {
      if (this.allSelecteddept) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  toggleAllSelectioncat(): void {
    if (this.select) {
      if (this.allSelectedcat) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  toggleAllSelectiondes(): void {
    if (this.selectdes) {
      if (this.allSelecteddes) {
        this.selectdes.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectdes.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  toggleAllSelectionEmp(): void {
    if (this.select) {
      if (this.allSelectedEmp) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }




  // attendance.component.ts
attendanceData: any = null; // To store the 'attendance' object from JSON
isLoading: boolean = false;

// Variables bound to your HTML [(ngModel)]
year: number = 2025;
month: string = '';
branch_ids: any[] = [];
department_ids: any[] = [];
category_ids: any[] = [];
designation_ids: any[] = [];
employee_ids: any[] = [];



// Helper to convert Month Name to Number (January -> 1)
getMonthNumber(monthName: string): number {
  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
  return months.indexOf(monthName) + 1;
}

generateReport() {
  const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema) {
    alert("No schema selected");
    return;
  }

  this.isLoading = true;

  const filters = {
    year: this.year,
    month: this.getMonthNumber(this.month), // Converts "January" to 1
    employee_ids: this.employee_ids,        // Array from mat-select
    branch_ids: this.branch_ids
  };

  this.companyRegistrationService.getFilteredAttendance(filters, selectedSchema).subscribe({
    next: (res) => {
      this.attendanceData = res.attendance;
      this.isLoading = false;
    },
    error: (err) => {
      this.isLoading = false;
      console.error("API Error", err);
    }
  });
}

// Needed for HTML iteration
objectKeys(obj: any) {
  return obj ? Object.keys(obj) : [];
}







}
