import { style } from '@angular/animations';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { LeaveService } from '../leave-master/leave.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css'
})
export class EmployeeDashboardComponent {


  
  

  expiredDocumentsCount: number = 0;
  expiredDocuments: any[] = []; // Assuming this array holds the list of expired documents

  hideButton = false;
  // constructor(public authService: AuthService) {}

  schemas: string[] = []; // Array to store schema names

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;

  employee: any;


  
  // employeesec: any[] = [];
  Employees: any[] = [];
  // selectedDepartment: any;
  emp_first_name: string = '';
  emp_last_name:string = '';
  id:string = '';
  emp_desgntn_id:string = '';
  isEssUser: boolean | undefined;

  hasAddPermission: boolean = true;
  hasDeletePermission: boolean = true;
  hasViewPermission: boolean =true;
  hasEditPermission: boolean = true;

 

  employees: any[] = [];

  filteredEmployees: any[] = [];
  searchQuery: string = '';
  searchType: string = 'name';  // Default search type
  showSearchOptions: boolean = false;  // Flag to toggle search options visibility
  serSubSec: boolean = true;  // Flag to toggle search options visibility

  searchPlaceholder: string = 'Search Employees'; // Default placeholder
  employeesec: any = {}; // Initialize an empty object for employee details

  emp_family_details: any[] | undefined;


  selectedEmployeeId: number | null = null;


  constructor(private authService: AuthenticationService,
     private router: Router,
    private EmployeeService: EmployeeService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DepartmentServiceService: DepartmentServiceService 

    ) { }
  
  // marginLeftValue = '200px';
  onToolbarMenuToggle(){
   
    console.log('On toolbar toggled', this.isMenuOpen );
    this.isMenuOpen = !this.isMenuOpen;
    // this.updateMarginLeft();
  }

  isMenuOpen: boolean = true;

   toggleSidebarMenu(): void {
  this.isMenuOpen = !this.isMenuOpen;
}

Documents: any[] = []; // store expired document notifications
notificationCount: number = 0; // number to show in the red badge


  // private updateMarginLeft() {
  //   this.marginLeftValue = this.isMenuOpen ? '200px' : '0px';
  // 
  ngOnInit(): void {

    this.loadExpiredDoc(); // load notifications on page load

    this.loadRequestType();

    this.loadLAsset();
    this.loadLAssetType();
    this.loadLoanTypes();


    this.daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

    // Get the selected schema
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
   
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    // if (selectedSchema) {
     
    //   this.EmployeeService.getEmployees(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.employees = data;
    //       console.log('employee:' ,this.employees)
    //     },
    //     (error: any) => {
    //       console.error('Error fetching employees:', error);
    //     }
    //   );
    // } else {
    //   console.error('No schema selected.');
    // }
         
         
      // Extract schema name from the URL
      const urlParts = window.location.href.split('.');
      if (urlParts.length >= 2) {
        this.selectedSchema = urlParts[0].replace('http://', '');
        console.log(urlParts)
      } else {
        console.error("No schema selected.");
      }
   
         
         
         // this.loadEmployee();
   
      
     // Retrieve user ID
   this.userId = this.sessionService.getUserId();
   
   // Fetch user details using the obtained user ID
   if (this.userId !== null) {
     this.authService.getUserData(this.userId).subscribe(
       async (userData: any) => {
         this.userDetails = userData; // Store user details in userDetails property
         console.log('User ID:', this.userId); // Log user ID
         console.log('User Details:', this.userDetails); // Log user details
   
         this.username = this.userDetails.username;
         // Check if user is_superuser is true or false
         let isSuperuser = this.userDetails.is_superuser || false;
         const isEssUser = this.userDetails.is_ess || false; // Default to false if is_superuser is undefined
         const selectedSchema = this.authService.getSelectedSchema();
     if (!selectedSchema) {
       console.error('No schema selected.');
       return;
     }
   
         if (isSuperuser || isEssUser) {
           console.log('User is superuser or ESS user');
           // Grant all permissions
           this.hasViewPermission = true;
           this.hasAddPermission = true;
           this.hasDeletePermission = true;
           this.hasEditPermission = true;
       
           // Fetch designations without checking permissions
           this.fetchDesignations(selectedSchema);
   
         } else {
           console.log('User is not superuser');
   
           const selectedSchema = this.authService.getSelectedSchema();
           if (selectedSchema) {
             
             
   
             try {
               const permissionsData: any = await this.EmployeeService.getDesignationsPermission(selectedSchema).toPromise();
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
   
                     this.hasViewPermission = this.checkGroupPermission('view_emp_master', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);
           
                  this.hasAddPermission = this.checkGroupPermission('add_emp_master', groupPermissions);
                 console.log('Has add permission:', this.hasAddPermission);
           
                this.hasDeletePermission = this.checkGroupPermission('delete_emp_master', groupPermissions);
             console.log('Has delete permission:', this.hasDeletePermission);
           
                 this.hasEditPermission = this.checkGroupPermission('change_emp_master', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
                 } else {
                   console.error('No groups found in data or groups array is empty.', firstItem);
                 }
               } else {
                 console.error('Permissions data is not an array or is empty.', permissionsData);
               }
   
               // Fetching designations after checking permissions
               this.fetchDesignations(selectedSchema);
             }
             
             catch (error) {
               console.error('Error fetching permissions:', error);
             }
           } else {
             console.error('No schema selected.');
           }
   
           
   
           // // Extract group permissions from user details
           // const groupPermissions = this.userDetails.groups.map((group: { permissions: any; }) => group.permissions).flat();
           // console.log('Group Permissions:', groupPermissions);
   
           // // Check permissions for various actions
           // this.hasViewPermission = this.checkGroupPermission('view_dept_master', groupPermissions);
           // console.log('Has View Permission:', this.hasViewPermission);
   
           // this.hasAddPermission = this.checkGroupPermission('add_dept_master', groupPermissions);
           // console.log('Has Add Permission:', this.hasAddPermission);
   
           // this.hasDeletePermission = this.checkGroupPermission('delete_dept_master', groupPermissions);
           // console.log('Has Delete Permission:', this.hasDeletePermission);
   
           // this.hasEditPermission = this.checkGroupPermission('change_dept_master', groupPermissions);
           // console.log('Has Edit Permission:', this.hasEditPermission);
         }
       },
       (error) => {
         console.error('Failed to fetch user details:', error);
       }
     );
   
     this.authService.getUserSchema(this.userId).subscribe(
       (userData:any)=>{
         this.userDetailss=userData;
         console.log('Schema :',this.userDetailss);
            // Extract schema names from userData and add them to the schemas array
       this.schemas = userData.map((schema: any) => schema.schema_name);
   
       }
       
   
     );
   } else {
     console.error('User ID is null.');
   }
   
   

 
   
   
      
     
      
   
     
     
     
       
        
       }
   
     
       
loadExpiredDoc(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    console.error('Schema missing for notifications.');
    return;
  }

  this.EmployeeService.getExpiredDocuments(selectedSchema).subscribe(
    (result: any) => {
      // Assuming backend returns a list of expired documents
      this.Documents = result.filter((item: any) =>
        item.message && item.message.toLowerCase().includes('document')
      );

      // Set notification count
      this.notificationCount = this.Documents.length;

      console.log('Fetched Expired Documents:', this.Documents);
    },
    (error) => {
      console.error('Error fetching expired documents:', error);
    }
  );
}
       
   
       handleImageError(event: any): void {
        // console.error('Error loading image:', event);
      }
  
  
  
      // isImage(src: string): boolean {
      //   return src.toLowerCase().endsWith('.jpg') || src.toLowerCase().endsWith('.jpeg') || src.toLowerCase().endsWith('.png') || src.toLowerCase().endsWith('.gif');
      // }
       
   
      isPDF(url: string): boolean {
        return url.toLowerCase().endsWith('.pdf');
      }

      
      checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
       return groupPermissions.some(permission => permission.codename === codeName);
     }
   
    //  fetchDesignations(selectedSchema: string) {
    //    this.EmployeeService.getemployees(selectedSchema).subscribe(
    //      (data: any) => {
    //        this.employees = data;
    //       console.log('employee:', this.employees);
    //      },
    //      (error: any) => {
    //        console.error('Error fetching categories:', error);
    //      }
    //    );
    //  }
   
    fetchDesignations(selectedSchema: string) {
      this.EmployeeService.getemployees(selectedSchema).subscribe(
        (data: any) => {
          this.employees = data;
          console.log('employee:', this.employees);
    
          if (this.employees.length === 1) {
            this.selectedEmployeeId = this.employees[0].id;
            console.log('Fetched Employee ID:', this.selectedEmployeeId);
    
            if (selectedSchema && this.selectedEmployeeId !== null) {
              this.loadEmpAssetsDetails(selectedSchema, this.selectedEmployeeId);
              this.loadEmpLoanDetails(selectedSchema, this.selectedEmployeeId);
              this.loadEmpAdvSalaryDetails(selectedSchema, this.selectedEmployeeId);
              this.loadEmpLeaveBalance(selectedSchema, this.selectedEmployeeId);
              this.loadEmpAnnouncement(selectedSchema, this.selectedEmployeeId);


            }
          }
        },
        (error: any) => {
          console.error('Error fetching employee:', error);
        }
      );
    }
  
 
   
  
  
           
   // checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
   //   return groupPermissions.some(permission => permission.codename === codeName);
   // }
    
   
     


      

       calculateDaysLeft(startDate: string): string {
        const today = new Date();
        const start = new Date(startDate);
        const diffTime = start.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
        if (diffDays > 0) {
          return `${diffDays} days left`;
        } else if (diffDays === 0) {
          return 'Today';
        } else {
          return 'Expired';
        }
      }



       
  loadExpiredDocuments(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.EmployeeService.getExpiredDocuments(selectedSchema).subscribe(
      (result: any) => {
        this.expiredDocuments = result;
        this.expiredDocumentsCount = this.expiredDocuments.length;
        console.log('Fetching expired documents:', this.expiredDocuments);
        console.log('Fetching expired documents count:', this.expiredDocumentsCount);
      },
      (error) => {
        console.error('Error fetching expired documents:', error);
      }
    );
  }
  }


  redirectToExpiredDocuments(): void {
    this.router.navigate(['/main-sidebar/settings/document-expired']);
    this.expiredDocumentsCount = 0;
  }


  logout(): void {
    this.authService.logout().subscribe(() => {
      // Clear any user-related data
      localStorage.removeItem('token'); // Remove authentication token
  
      // If you need to reset the hostname (for subdomain logout scenarios)
      const currentUrl = window.location.href;
      const baseUrl = new URL(currentUrl);
      baseUrl.hostname = environment.apiBaseUrl; 
  
      // Redirect to login after logout and ensure a full reload
      window.location.href = baseUrl.origin + '/login';
      
    }, (error: HttpErrorResponse) => { 
      console.error('Logout failed:', error);
    });
    
  }


  activeTab: string = 'signup';  // default tab

selectTab(tabName: string): void {
  this.activeTab = tabName;
}



 activeTabNav: string = 'dashboard';  // default tab

selectTabNav(tabNameNav: string): void {
  this.activeTabNav = tabNameNav;
}



EmpAssets: any[] = [];

loadEmpAssetsDetails(selectedSchema: string, empId: number): void {
  this.EmployeeService.getEmpAssetDetails(selectedSchema, empId).subscribe(
    (result: any) => {
      this.EmpAssets = result;
      console.log('Employee Assets:', this.EmpAssets);
    },
    (error) => {
      console.error('Error fetching Employee Assets:', error);
    }
  );
}

EmpLoan: any[] = [];


loadEmpLoanDetails(selectedSchema: string, empId: number): void {
  this.EmployeeService.getEmpLoanDetails(selectedSchema, empId).subscribe(
    (result: any) => {
      this.EmpLoan = result;
      console.log('Employee Assets:', this.EmpLoan);
    },
    (error) => {
      console.error('Error fetching Employee EmpLoan:', error);
    }
  );
}

AdvSalary: any[] = [];

loadEmpAdvSalaryDetails(selectedSchema: string, empId: number): void {
  this.EmployeeService.getEmpAdvSalaryDetails(selectedSchema, empId).subscribe(
    (result: any) => {
      this.AdvSalary = result;
      console.log('Employee AdvSalary:', this.AdvSalary);
    },
    (error) => {
      console.error('Error fetching Employee AdvSalary:', error);
    }
  );
}

LeaveTypes: any[] = [];


loadEmpLeaveBalance(selectedSchema: string, empId: number): void {
  this.EmployeeService.getEmpLeaveBalance(selectedSchema, empId).subscribe(
    (result: any) => {
      console.log('Raw leave balance result:', result);

      // ✅ Combine data — only take leave types with balance > 0
      if (result && result.leave_balance && Array.isArray(result.leave_balance)) {
        this.LeaveTypes = result.leave_balance.filter(
          (item: any) => item.balance > 0 // show only leaves with balance
        );

        console.log('Filtered LeaveTypes (with balance):', this.LeaveTypes);
      } else {
        this.LeaveTypes = [];
      }
    },
    (error) => {
      console.error('Error fetching Employee Leave Balance:', error);
    }
  );
}


daysArray: number[] = [];



year: any = '';
month: any = '';

// employee_id: any = '';



attendanceData: any = null; // Define this at the class level

// ✅ Generate Attendance Report
generateAttendanceReport(): void {
  // Check if employee ID is set
  if (!this.year || !this.month || !this.selectedEmployeeId) {
    alert('Please select Year, Month, and ensure Employee is loaded.');
    return;
  }

  const formData = new FormData();
  formData.append('year', this.year.toString());
  formData.append('month', this.month.toString());
  formData.append('employee_id', this.selectedEmployeeId.toString()); // ✅ automatically set employee ID

  this.leaveService.CreateEmployeeattendance(formData).subscribe(
    (response) => {
      console.log('Report data received', response);
      this.attendanceData = response[0]; // Assuming backend sends array
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

  selectedRequestId: number | null = null; // Property to track the selected leave request ID

  selectRequest(requestId: number) {
    this.selectedRequestId = requestId === this.selectedRequestId ? null : requestId; // Toggle the selected request
  }


  isRequestsDropdownOpen = false;

toggleRequestsDropdown() {
  this.isRequestsDropdownOpen = !this.isRequestsDropdownOpen;
}




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
  dis_half_day: boolean = false;



  requestLeave(): void {
    if (!this.selectedEmployeeId) {
      alert('Please ensure Employee is loaded.');
      return;
    }
  
    // ✅ Convert to proper YYYY-MM-DD format manually
    const formattedStartDate = this.convertToDateString(this.start_date);
    const formattedEndDate = this.convertToDateString(this.end_date);
  
    console.log('Formatted Start Date:', formattedStartDate);
    console.log('Formatted End Date:', formattedEndDate);
  
    const formData = new FormData();
    formData.append('start_date', formattedStartDate);
    formData.append('end_date', formattedEndDate);
    formData.append('reason', this.reason || '');
    formData.append('status', this.status || '');
    formData.append('approved_by', this.approved_by || '');
    formData.append('dis_half_day', this.dis_half_day.toString());
    formData.append('half_day_period', this.half_day_period || '');
    formData.append('leave_type', this.leave_type.toString());
    formData.append('employee', this.selectedEmployeeId.toString());
  
    console.log('FormData:');
    formData.forEach((v, k) => console.log(k, v));
  
    this.leaveService.requestLeaveAdmin(formData).subscribe(
      (response) => {
        console.log('Leave request successful:', response);
        alert('✅ Leave request has been sent successfully!');
        window.location.reload();
      },
      (error) => {
        console.error('❌ Leave request failed:', error);
  
        // ✅ If backend sent validation errors, show them clearly
        if (error.error) {
          let errorMsg = '';
  
          // Handle field-specific errors
          for (const key in error.error) {
            if (Array.isArray(error.error[key])) {
              errorMsg += `${key}: ${error.error[key].join(', ')}\n`;
            } else if (typeof error.error[key] === 'string') {
              errorMsg += `${key}: ${error.error[key]}\n`;
            }
          }
  
          if (errorMsg) {
            alert(`⚠️ Please fix the following errors:\n\n${errorMsg}`);
          } else {
            alert('⚠️ Error submitting leave request. Please check all fields.');
          }
        } else {
          alert('⚠️ Server error. Please try again later.');
        }
      }
    );
  }
  
  // ✅ Utility to force YYYY-MM-DD format
  convertToDateString(dateInput: any): string {
    if (!dateInput) return '';
  
    if (typeof dateInput === 'string' && dateInput.includes('-')) {
      // Already in YYYY-MM-DD format
      return dateInput;
    }
  
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  

// doc_number: any = '';
document_number: number | null = null;
total: any = '';
branch: any = '';
request_type: any = '';
created_by: any = '';
approved:  boolean = false;


automaticNumbering: boolean = false;

remarks: string = '';
request_document: File | null = null;



registerGeneralreq(): void {
  if (!this.selectedEmployeeId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

  const formData = new FormData();

  formData.append('document_number', this.document_number?.toString() || '');
  formData.append('reason', this.reason || '');
  formData.append('total', this.total?.toString() || '');
  formData.append('request_type', this.request_type || '');
  formData.append('employee', this.selectedEmployeeId.toString());
  // formData.append('created_by', this.created_by || '');
  formData.append('approved', this.approved ? 'true' : 'false');
  formData.append('remarks', this.remarks || '');

  if (this.request_document) {
    formData.append('request_document', this.request_document);
  }

  this.EmployeeService.registerGeneralReq(formData).subscribe(
    (response) => {
      alert('✅ General request has been added successfully!');
      window.location.reload();
    },
    (error) => {
      console.error('General request failed:', error);

      // ✅ Backend error handler
      if (error.error) {
        let errorMsg = '';

        if (typeof error.error === 'string') {
          // If backend sends plain text
          errorMsg = error.error;
        } 
        else if (typeof error.error === 'object') {
          // If backend sends JSON (like {"field": ["msg"]})
          for (const key in error.error) {
            if (error.error.hasOwnProperty(key)) {
              const msg = Array.isArray(error.error[key])
                ? error.error[key].join(', ')
                : error.error[key];
              errorMsg += `${key}: ${msg}\n`;
            }
          }
        }

        alert(`❌ Error submitting request:\n${errorMsg || 'Unknown error occurred.'}`);
      } else {
        alert('❌ Failed to submit request. Please check all required fields.');
      }
    }
  );
}

    
          onFileChange(event: any) {
            const file = event.target.files[0];
            if (file) {
              this.request_document = file;
            }
          }

          
selectedSalaryComponent: string | null = null;

onRequestTypeChange(event: any): void {
  const selectedId = +event.target.value;
  const selectedReq = this.RequestType.find((r: any) => r.id === selectedId);

  if (selectedReq) {
    this.selectedSalaryComponent = selectedReq.salary_component;
    console.log('Selected salary_component:', this.selectedSalaryComponent);
  } else {
    this.selectedSalaryComponent = null;
  }
}


RequestType:any []=[];



loadRequestType(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.DepartmentServiceService.getReqType(selectedSchema).subscribe(
      (result: any) => {
        this.RequestType = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }



 
  asset_type: any = '';
  requested_asset: any = '';

  CreateAssetType(): void {
    const companyData = {
      reason: this.reason,
    
      // status:this.status,
      employee:this.selectedEmployeeId,
      asset_type:this.asset_type,
      requested_asset:this.requested_asset,

      // Add other form field values to the companyData object
    };
  

    this.EmployeeService.registerAssetRequest(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
      
            alert('Asset request has been added ');
            window.location.reload();
            // window.location.reload();
       

      },
      (error) => {
        console.error('Added failed', error);
        alert('enter all field!')
        // Handle the error appropriately, e.g., show a user-friendly error message.
      }
    );
  }

  Assets:any []=[];


  loadLAsset(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.EmployeeService.getAsset(selectedSchema).subscribe(
        (result: any) => {
          this.Assets = result;
          console.log(' fetching Loantypes:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }
  
    AssetTypes:any []=[];

     
    loadLAssetType(): void {
    
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.EmployeeService.getAssetType(selectedSchema).subscribe(
          (result: any) => {
            this.AssetTypes = result;
            console.log(' fetching Loantypes:');
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }


    
      requested_amount: any = '';
   
    
      rejection_reason: any = '';
    
      pause_start_date: any = '';
    
      resume_date: any = '';
    
      pause_reason: any = '';
    
    
      is_compensatory: boolean = false;

      SetLeaveApprovaLevel(): void {
        // if (!this.name || !this.code || !this.valid_to) {
        //   return;
        // }
        if (!this.selectedEmployeeId) {
          alert('Please ensure Employee is loaded.');
          return;
        }
    
        const formData = new FormData();
        formData.append('reason', this.reason);
    
        formData.append('document_number', this.document_number?.toString() || '');

    
    
        formData.append('remarks', this.remarks);
    
        formData.append('requested_amount', this.requested_amount);
        formData.append('employee', this.selectedEmployeeId.toString());
        formData.append('created_by', this.created_by);
    
    
    
    
    
    
        this.leaveService.CreateAdvSalaryRequest(formData).subscribe(
          (response) => {
            console.log('Registration successful', response);
    
    
            alert('Advanced salary Request  has been Sent');
    
            window.location.reload();
          },
          (error) => {
            console.error('Added failed', error);
            alert('Enter all required fields!');
          }
        );
      }






      
  amount_requested:any='';
  repayment_period:any='';
  emi_amount:any='';
  disbursement_date:any='';
  remaining_balance:any='';
  // approved_on:any='';

 
  loan_type:any='';

  CreateLoanApplication(): void {
  
    if (!this.selectedEmployeeId) {
      alert('Please ensure Employee is loaded.');
      return;
    }
  
    const formData = new FormData();
    formData.append('amount_requested', this.amount_requested);
    formData.append('repayment_period', this.repayment_period);
    formData.append('emi_amount', this.emi_amount);
    // formData.append('disbursement_date', this.disbursement_date );
    formData.append('remaining_balance', this.remaining_balance);
    // formData.append('approved_on', this.approved_on);
    // formData.append('rejection_reason', this.rejection_reason);


    
    formData.append('pause_start_date', this.pause_start_date);
    formData.append('resume_date', this.resume_date );
    formData.append('pause_reason', this.pause_reason);
    formData.append('employee', this.selectedEmployeeId.toString());
    formData.append('loan_type', this.loan_type);


  
    this.EmployeeService.registerLoanApplication(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Loan application has been added');
        window.location.reload();
      },
      (error) => {
        console.error('Added failed', error);
        alert('Enter all required fields!');
      }
    );
  }

  LoanTypes:any[]=[];

  loadLoanTypes(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.EmployeeService.getLoanTypes(selectedSchema).subscribe(
        (result: any) => {
          this.LoanTypes = result;
          console.log(' fetching Loantypes:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }




    

  document_date:any='';
  resigned_on:any='' ;
  notice_period:any='' ;

  last_working_date:any='' ;
  location: any = '';
  termination_type: any = '';
  reason_for_leaving: any = '';

  
  SetEmployeeResignation(): void {
    // if (!this.name || !this.code || !this.valid_to) {
    //   return;
    // }
  
    if (!this.selectedEmployeeId) {
      alert('Please ensure Employee is loaded.');
      return;
    }
  
    const formData = new FormData();
    formData.append('document_date', this.document_date);
    formData.append('resigned_on', this.resigned_on);




    formData.append('notice_period', this.notice_period);
  
    formData.append('last_working_date', this.last_working_date);
    formData.append('location', this.location);
    formData.append('termination_type', this.termination_type);

    formData.append('reason_for_leaving', this.reason_for_leaving);
  
    formData.append('employee', this.selectedEmployeeId.toString());



    
  
  
    this.leaveService.CreateEmpResignationRequest(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);


        alert('Resignation Request  has been Sent');

        window.location.reload();
      },  
      (error) => {
        console.error('Added failed', error);
        alert('Enter all required fields!');
      }
    );
  }






  EmpAnnouncement: any[] = [];

  loadEmpAnnouncement(selectedSchema: string, empId: number): void {
    this.EmployeeService.getEmpAnnouncement(selectedSchema, empId).subscribe(
      (result: any) => {
        this.EmpAnnouncement = result.map((a: any) => ({
          ...a,
          expanded: false // add toggle flag for UI
        }));
        console.log('Employee Announcements:', this.EmpAnnouncement);
      },
      (error) => {
        console.error('Error fetching Employee Announcements:', error);
      }
    );
  }
  
  toggleExpand(announcement: any): void {
    announcement.expanded = !announcement.expanded;
  }
  

}
