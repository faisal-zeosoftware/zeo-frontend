import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { EmployeeService } from '../employee-master/employee.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-emp-attendance',
  templateUrl: './emp-attendance.component.html',
  styleUrl: './emp-attendance.component.css'
})
export class EmpAttendanceComponent {

  daysArray: number[] = [];

  
  start_date:any='';
  end_date:any='';
  note:any='';
  reason:any='';

  status:any='';
  applied_on:any='';
  approved_by:any='';
  approved_on:any='';
  half_day_period:any='' ;
  leave_type:any='' ;

  employee:any='' ;


  dis_half_day: boolean = false;

  registerButtonClicked: boolean = false;



  LeaveTypes: any[] = [];
  Employees: any[] = [];

  Users: any[] = [];

  employees:any[]=[];

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private EmployeeService:EmployeeService,
    private route: ActivatedRoute,
    private router: Router,




  
    ) {}

    ngOnInit(): void {

      this.daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

      const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {


      this.LoadEmployee(selectedSchema);



      this.fetchDesignations(selectedSchema);


      
      
      }

      this.route.params.subscribe(params => {
        const employeeId = +params['id']; // Assuming the route has 'id' as a parameter
  
        if (employeeId) {
          this.EmployeeService.getEmployeeDetails(employeeId).subscribe(
            (details) => {
              this.employee = details;
              console.log('emp id ;',details)
            },
            (error) => {
              console.error('Failed to fetch employee details', error);
            }
          );
        } else {
          console.error('Employee ID parameter is null.');
        }
      });
     
    }






  




  LoadEmployee(selectedSchema: string) {
    this.leaveService.getEmployee(selectedSchema).subscribe(
      (data: any) => {
        this.Employees = data;
        
        // Automatically select the first employee if there are any employees
        if (this.Employees && this.Employees.length > 0) {
          this.employee_id = this.Employees[0].id;
        }
  
        console.log('employee:', this.Employees);
      },
      (error: any) => {
        console.error('Error fetching employees:', error);
      }
    );
  }
  

 

  fetchDesignations(selectedSchema: string) {
    this.EmployeeService.getemployees(selectedSchema).subscribe(
      (data: any) => {
        this.employees = data;
       console.log('employeeDet:', this.employees);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }












year: any = '';
month: any = '';

employee_id: any = '';



attendanceData: any = null; // Define this at the class level

  generateAttendanceReport(): void {
    if (!this.year || !this.month || !this.employee_id) {
      alert('Please enter Year, Month, and Employee');
      return;
    }

    const formData = new FormData();
    formData.append('year', this.year.toString());
    formData.append('month', this.month.toString());
    formData.append('employee_id', this.employee_id.toString());

    this.leaveService.CreateEmployeeattendance(formData).subscribe(
      (response) => {
        console.log('Report data received', response);
        this.attendanceData = response[0]; // Assuming response is an array as shown in your backend example
      },
      (error) => {
        console.error('Error generating report', error);
        alert('Failed to generate report. Please try again.');
      }
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

}
