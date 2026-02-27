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
import { CountryService } from '../country.service';
import { Subscription } from 'rxjs';
import {combineLatest} from 'rxjs';


@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrl: './employee-dashboard.component.css'
})
export class EmployeeDashboardComponent {

    private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  selectedBranchId: number | null = null;
  

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


  AllNotifications: any[] = [];  
  Documents: any[] = []; // store expired document notifications
  notificationCount: number = 0;

  ResignationApr: any[] = [];
  AssetAprNot: any[] = [];
  AirticketAprNot: any[] = [];
  LeaveAprNot: any[] = [];
  GeneralAprNot: any[] = [];
  DocAprNot: any[] = [];
  LoanAprNot: any[] = [];
  AdvancesalaryAprNot: any[] = [];


branchIds: number[] = [];


  constructor(private authService: AuthenticationService,
     private router: Router,
    private EmployeeService: EmployeeService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private DepartmentServiceService: DepartmentServiceService,
    private CountryService: CountryService,

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

 // number to show in the red badge


  // private updateMarginLeft() {
  //   this.marginLeftValue = this.isMenuOpen ? '200px' : '0px';
  // 
  ngOnInit(): void {

      // ✅ Get schema first
  this.selectedSchema = this.authService.getSelectedSchema() || '';

  // ✅ Get branch IDs from localStorage
  this.branchIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

  // ✅ Now call API safely
  if (this.selectedSchema && this.branchIds.length > 0) {
    this.fetchTimeEmployees(this.selectedSchema, this.branchIds);
  }

  this.fetchTimeEmployees(this.selectedSchema, this.branchIds);

    this.loadExpiredDoc(); // load notifications on page load
    this.LoadDocType();
    this.loadRequestType();
    this.loadAllocations();
    this.loadLAsset();
    this.loadLAssetType();
    this.loadLoanTypes();
    // this.LoadLeaveRequest();
    this.loadDeparmentBranch();
    // this.fetchingApprovals();
    this.loadGeeralReqAprovals();
    this.loadResReqAprovals();
    this.loadLeaveReqApprovals();
    this.loadAdvSalReqAprovals();
    this.loadLoanReqAprovals();
    this.loadAssetReqApprovals();
    this.loadAirticketReqApprovals();
    this.loadDocReqApprovals();
    this.loadLTasks();
    this.loadProject();
    this.loadStages();
  
    


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

    if (selectedSchema) {
      this.loadAllNotifications(selectedSchema);
    }
   
      
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


loadAllNotifications(selectedSchema: string): void {
// Listen for sidebar changes so the dropdown updates instantly
this.EmployeeService.selectedBranches$.subscribe(ids => {
  this.loadResignationApprovals();
  this.loadLeaveNotifications();
  this.loadAssetNotifications();
  this.loadAirTicketNotifications();
  this.loadGeneralReqNotifications();
  this.loadDocumentReqNotifications();
  this.loadLoanReqNotifications();
  this.loadAdvancesalaryReqNotifications();
});
}


loadResignationApprovals(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.CountryService.getResignationAprNoti(selectedSchema, savedIds).subscribe({
      next: (docs: any[]) => {
        this.ResignationApr = (docs || []).map(item => ({
          ...item,
          type: 'Resignationapproval',
          highlighted: false
        }));
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading resignation approval notifications:', err);
        this.ResignationApr = [];
        this.combineNotifications();
      }
    });
  }
  }





loadLeaveNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getLeaveNotifyNew(selectedSchema, savedIds).subscribe({
      next: (leaves: any[]) => {
        this.LeaveAprNot = (leaves || []).map(item => ({
          ...item,
          type: 'Leaveapproval',
          highlighted: false
        }));
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading leave approval notifications:', err);
        this.LeaveAprNot = [];
        this.combineNotifications();
      }
    });
  }
  }






loadAssetNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getAssetNotifyNew(selectedSchema, savedIds).subscribe({
      next: (assets: any) => {
        this.AssetAprNot = Array.isArray(assets)
          ? assets
              .filter((item: any) => item.message?.toLowerCase().includes('Assetapproval'))
              .map((item) => ({ ...item, type: 'Assetapproval', highlighted: false }))
          : [];
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading Asset approval notifications:', err);
        this.AssetAprNot = [];
        this.combineNotifications();
      },
    });
  }
  }




loadAirTicketNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getAirTicketNotifyNew(selectedSchema, savedIds).subscribe({
      next: (airtickets: any) => {
        this.AirticketAprNot = Array.isArray(airtickets)
          ? airtickets
              .filter((item: any) => item.message?.toLowerCase().includes('Airticketapproval'))
              .map((item) => ({ ...item, type: 'Airticketapproval', highlighted: false }))
          : [];
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading Airticket approval notifications:', err);
        this.AirticketAprNot = [];
        this.combineNotifications();
      },
    });
  }
  }



loadGeneralReqNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getGeneralReqNotNew(selectedSchema, savedIds).subscribe({
      next: (leaves: any) => {
        this.GeneralAprNot = Array.isArray(leaves)
          ? leaves
              .filter((item: any) => item.message?.toLowerCase().includes('Genapproval'))
              .map((item) => ({ ...item, type: 'Genapproval', highlighted: false }))
          : [];
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading general approval notifications:', err);
        this.GeneralAprNot = [];
        this.combineNotifications();
      },
    });
  }
  }




loadDocumentReqNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getDocumentReqNotNew(selectedSchema, savedIds).subscribe({
      next: (docs: any) => {
        this.DocAprNot = Array.isArray(docs)
          ? docs
              .filter((item: any) => item.message?.toLowerCase().includes('Docapproval'))
              .map((item) => ({ ...item, type: 'Docapproval', highlighted: false }))
          : [];
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading document Approval notifications:', err);
        this.DocAprNot = [];
        this.combineNotifications();
      },
    });
  }
  }







loadLoanReqNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getLoanReqNotNew(selectedSchema, savedIds).subscribe({
      next: (loan: any[]) => {
        this.LoanAprNot = (loan || []).map(item => ({
          ...item,
          type: 'Loanapproval',
          highlighted: false
        }));
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading loan Approval notifications:', err);
        this.LoanAprNot = [];
        this.combineNotifications();
      }
    });
  }
  }



loadAdvancesalaryReqNotifications(callback?: Function): void {
  const selectedSchema = this.authService.getSelectedSchema();
  const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');


  if (selectedSchema) {
    this.EmployeeService.getAdvancesalaryReqNotNew(selectedSchema, savedIds).subscribe({
      next: (loan: any) => {
        this.AdvancesalaryAprNot = Array.isArray(loan)
          ? loan
              .filter((item: any) => item.message?.toLowerCase().includes('Advsalapproval'))
              .map((item) => ({ ...item, type: 'Advsalapproval', highlighted: false }))
          : [];
        this.combineNotifications();
      },
      error: (err) => {
        console.error('❌ Error loading advance salary Approval notifications:', err);
        this.AdvancesalaryAprNot = [];
        this.combineNotifications();
      },
    });
  }
  }

combineNotifications(): void {
  // Load previously read notifications from localStorage
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');

  const allItems = [
    ...this.ResignationApr.map(item => ({ ...item, type: 'Resignationapproval' as const, highlighted: false })),
    ...this.LeaveAprNot.map(item => ({ ...item, type: 'Leaveapproval' as const, highlighted: false })),
    ...this.AssetAprNot.map(item => ({ ...item, type: 'Assetapproval' as const, highlighted: false })),
    ...this.AirticketAprNot.map(item => ({ ...item, type: 'Airticketapproval' as const, highlighted: false })),
    ...this.GeneralAprNot.map(item => ({ ...item, type: 'Genapproval' as const, highlighted: false })),
    ...this.DocAprNot.map(item => ({ ...item, type: 'Docapproval' as const, highlighted: false })),
    ...this.LoanAprNot.map(item => ({ ...item, type: 'Loanapproval' as const, highlighted: false })),
    ...this.AdvancesalaryAprNot.map(item => ({ ...item, type: 'Advsalapproval' as const, highlighted: false }))
  ];

  this.AllNotifications = allItems
    .filter(noti => {
      // Hide if already marked as read in localStorage
      const notiKey = `${noti.type}-${noti.id}`;
      if (readNotifications[notiKey]) {
        return false;
      }
      // Also hide if backend says is_read: true
      return noti.is_read === false || noti.is_read == null;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  this.notificationCount = this.AllNotifications.length;
}







// 🔔 Control Dropdown
isNotificationOpen = false;

toggleNotification() {
  this.isNotificationOpen = !this.isNotificationOpen;
}

// 📌 Click Single Notification
onNotificationClick(noti: any): void {

  // Highlight effect
  noti.highlighted = true;
  setTimeout(() => noti.highlighted = false, 1000);

  // Open correct section
  this.activeTabNav = noti.type;

  // 🔐 Save as read in localStorage
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
  const notiKey = `${noti.type}-${noti.id}`;
  readNotifications[notiKey] = true;
  localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

  // Remove from dropdown (UI)
  this.AllNotifications =
    this.AllNotifications.filter(n => n.id !== noti.id || n.type !== noti.type);

  // Update count
  this.notificationCount = this.AllNotifications.length;

  // Close dropdown
  this.isNotificationOpen = false;
}

// 📂 View All Notifications
openAllNotifications() {
  this.activeTabNav = 'AllNotifications';
  this.isNotificationOpen = false;
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
  

   
      isPDF(url: string): boolean {
        return url.toLowerCase().endsWith('.pdf');
      }

      
      checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
       return groupPermissions.some(permission => permission.codename === codeName);
     }

   


fetchDesignations(selectedSchema: string) {
  this.EmployeeService.getemployees(selectedSchema).subscribe(
    (data: any) => {
      this.employees = data;
      console.log('employee:', this.employees);

      if (this.employees.length === 1) {
        this.selectedEmployeeId = this.employees[0].id;

        // ✅ Store Branch ID here
        this.selectedBranchId = this.employees[0]?.branch?.id || null;

        console.log('Fetched Employee ID:', this.selectedEmployeeId);
        console.log('Fetched Branch ID:', this.selectedBranchId);

        if (selectedSchema && this.selectedEmployeeId !== null) {
          this.loadEmpAssetsDetails(selectedSchema, this.selectedEmployeeId);
          this.loadEmpLoanDetails(selectedSchema, this.selectedEmployeeId);
          this.loadEmpAirticketDetails(selectedSchema, this.selectedEmployeeId);
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

activetTab: string = 'home'; 

setActiveTab(tab: string) {
  this.activetTab = tab;
  // Optional: close dropdown after selection
  this.isAssetDropdownOpen = false;
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

downloadExcel() {

  if (!this.EmpAssets || this.EmpAssets.length === 0) {
    alert('No asset data available to export.');
    return;
  }

  const exportData = this.EmpAssets.map(member => ({
    'Asset Name': member.asset || '',
    'Assigned Date': member.assigned_date || '',
    'Return Condition': member.return_condition || '',
    'Return Date': member.returned_date || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Assets');

  XLSX.writeFile(wb, 'Employee_Assets_Report.xlsx');
}

EmpAirticket: any[] = [];

loadEmpAirticketDetails(selectedSchema: string, empId: number): void {
  this.CountryService.getEmpAirticketDetails(selectedSchema, empId).subscribe(
    (result: any) => {
      this.EmpAirticket = result;
      console.log('Employee Airticket:', this.EmpAirticket);
    },
    (error) => {
      console.error('Error fetching Employee Airticket:', error);
    }
  );
}

downloadAirExcel() {

  if (!this.EmpAirticket || this.EmpAirticket.length === 0) {
    alert('No airticket data available to export.');
    return;
  }

  const exportData = this.EmpAirticket.map(Air => ({
    'Airticket Name': Air.policy || '',
    'Allocated Date': Air.allocated_date || '',
    'Amount': Air.amount || '',
    'Expiry Date': Air.expiry_date || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Airticket');

  XLSX.writeFile(wb, 'Employee_Airticket_Report.xlsx');
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

downloadLoanExcel() {

  if (!this.EmpLoan || this.EmpLoan.length === 0) {
    alert('No loan data available to export.');
    return;
  }

  const exportData = this.EmpLoan.map(loan => ({
    'Amount requested': loan.amount_requested || '',
    'EMI Amount': loan.emi_amount || '',
    'Remaining Balance': loan.remaining_balance || '',
    'Loan Type': loan.loan_type || '',
    'Repayment Period': loan.repayment_period || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Loan');

  XLSX.writeFile(wb, 'Employee_Loan_Report.xlsx');
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

downloadAdvSalExcel() {

  if (!this.AdvSalary || this.AdvSalary.length === 0) {
    alert('No advance salary data available to export.');
    return;
  }

  const exportData = this.AdvSalary.map(advanceSalary => ({
    'Amount requested': advanceSalary.document_number || '',
    'EMI Amount': advanceSalary.branch || '',
    'Remaining Balance': advanceSalary.requested_amount || '',
    'Loan Type': advanceSalary.reason || '',
    'Repayment Period': advanceSalary.remarks || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employee Advance Salary');

  XLSX.writeFile(wb, 'Employee_Advance_Salary_Report.xlsx');
}

downloadFamilyExcel(employee: any) {

  console.log('Employee Section:', employee);
  console.log('Family Data:', employee?.emp_family);

  const familyList = employee?.emp_family;

  if (!familyList || familyList.length === 0) {
    alert('No family data available to export.');
    return;
  }

  const exportData = familyList.map((familyMember: any, index: number) => ({
    'No': index + 1,
    'Member Name': familyMember.ef_member_name || '',
    'Date Of Birth': familyMember.ef_date_of_birth || '',
    'Employee Relation': familyMember.emp_relation || '',
    'Family Company Expense': familyMember.ef_company_expence || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Family Details');

  XLSX.writeFile(wb, 'Employee_Family_Details.xlsx');
}
downloadQualificationExcel(employee: any) {

  const QualificationList = employee?.emp_qualification;

  if (!QualificationList || QualificationList.length === 0) {
    alert('No qualification data available to export.');
    return;
  }

  const exportData = QualificationList.map((Qualification: any) => ({
    'Employee Qualification': Qualification.emp_qualification || '',
    'Year': Qualification.emp_qf_year || '',
    'Subject': Qualification.emp_qf_subject || '',
    'Institution': Qualification.emp_qf_instituition || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Qualification Details');

  XLSX.writeFile(wb, 'Employee_Qualification_Details.xlsx');
}

downloadBankExcel(employee: any) {

  const bankList = employee?.emp_bank;

  if (!bankList || bankList.length === 0) {
    alert('No Bank data available to export.');
    return;
  }

  const exportData = bankList.map((Bnk: any) => ({
    'Bank Name': Bnk.bank_name || '',
    'Branch name': Bnk.branch_name || '',
    'Account Number': Bnk.account_number || '',
    'Bank Address': Bnk.bank_address || '',
    'Route Code': Bnk.route_code || '',
    'Iban Number': Bnk.iban_number || '',
    'Active Status': Bnk.is_active || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bank Details');

  XLSX.writeFile(wb, 'Employee_Bank_Details.xlsx');
}

downloadJobHistoryExcel(employee: any) {

  const jobHistoryList = employee?.emp_job_history;

  if (!jobHistoryList || jobHistoryList.length === 0) {
    alert('No Job History data available to export.');
    return;
  }

  const exportData = jobHistoryList.map((Jobhistory: any) => ({
    'Company Name': Jobhistory.emp_jh_company_name || '',
    'Designation': Jobhistory.emp_jh_designation || '',
    'From Date': Jobhistory.emp_jh_from_date || '',
    'End Date': Jobhistory.emp_jh_end_date || '',
    'Last Leaving Salary Per Month': Jobhistory.emp_jh_leaving_salary_permonth || '',
    'Leaving Reason': Jobhistory.emp_jh_reason || '',
    'Total Experiance': Jobhistory.emp_jh_years_experiance || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Job History Details');

  XLSX.writeFile(wb, 'Employee_Job_History_Details.xlsx');
}

downloadDocumnetExcel(employee: any) {

  const DocList = employee?.emp_documents;

  if (!DocList || DocList.length === 0) {
    alert('No Document data available to export.');
    return;
  }

  const exportData = DocList.map((document: any) => ({
    'Document number': document.emp_doc_number || '',
    'issue Date': document.emp_doc_issued_date || '',
    'expired date': document.emp_doc_expiry_date || '',
    'Type': document.document_type || '',
    'Status': document.is_active || '',
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Document Details');

  XLSX.writeFile(wb, 'Employee_Document_Details.xlsx');
}

downloadSalaryExcel(employee: any) {

  const payslips = employee?.payslip;

  if (!payslips || payslips.length === 0) {
    alert('No salary data available to export.');
    return;
  }

  const exportData = payslips.map((pay: any, index: number) => ({

    'No': index + 1,
    'Name': pay.payroll_run?.name || '',
    'Year': pay.payroll_run?.year || '',
    'Month': pay.payroll_run?.month || '',
    'Total Working Days': pay.total_working_days || '',
    'Days Worked': pay.days_worked || '',
    'Payment Date': pay.payroll_run?.payment_date 
        ? new Date(pay.payroll_run.payment_date).toLocaleDateString()
        : '',
    'Components': this.formatComponents(pay.components),
    'Gross Salary': pay.gross_salary || '',
    'Net Salary': pay.net_salary || '',
    'Status': pay.status || ''

  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Salary Details');

  XLSX.writeFile(wb, 'Employee_Salary_Report.xlsx');
}

formatComponents(components: any[]): string {

  if (!components || components.length === 0) {
    return '';
  }

  return components
    .map(comp => 
      `${comp.component_name} (${comp.component_type}): ${comp.payslip_amount}`
    )
    .join(' | ');
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



  isPunchingDropdownOpen = false;

togglePunchingDropdown() {
  this.isPunchingDropdownOpen = !this.isPunchingDropdownOpen;
}

isAssetDropdownOpen = false;

toggleAssetDropdown() {
  this.isAssetDropdownOpen = !this.isAssetDropdownOpen;
}

isAirtickDropdownOpen = false;

toggleAirtickDropdown() {
  this.isAirtickDropdownOpen = !this.isAirtickDropdownOpen;
}

isLoanDropdownOpen = false;

toggleLoanDropdown() {
  this.isLoanDropdownOpen = !this.isLoanDropdownOpen;
}

isAdvSalDropdownOpen = false;

toggleAdvSalDropdown() {
  this.isAdvSalDropdownOpen = !this.isAdvSalDropdownOpen;
}

isApprovalsDropdownOpen = false;

toggleApprovalsDropdown() {
  this.isApprovalsDropdownOpen = !this.isApprovalsDropdownOpen;
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
  LeaveRequests: any[] = [];
  totalDays: number = 0;

requestLeave(): void {
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

  const formData = new FormData();
  formData.append('start_date', this.start_date);
  formData.append('end_date', this.end_date);
  formData.append('reason', this.reason);
  formData.append('status', this.status);
  formData.append('dis_half_day', this.dis_half_day.toString());
  formData.append('half_day_period', this.half_day_period);
  formData.append('document_number', this.document_number?.toString() || '');
  formData.append('leave_type', this.leave_type.toString());
  formData.append('employee', this.selectedEmployeeId.toString());

  this.leaveService.requestLeaveAdmin(formData).subscribe(
    (response) => {
      console.log('Leave request successful:', response);
      alert('Leave Request has been sent successfully!');
      // window.location.reload();
    },
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
}
  );
}


  getLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported by this browser.");
        return;
      }
  
      const options: PositionOptions = {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000,           // Increased to 15s to allow GPS to wake up
        maximumAge: 0             // Strictly force a fresh location fetch
      };
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy // Useful for debugging
          });
        },
        (error) => {
          let errorMsg = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMsg = "The request to get user location timed out.";
              break;
            default:
              errorMsg = "An unknown error occurred.";
              break;
          }
          reject(errorMsg);
        },
        options
      );
    });
  }


getAddress(lat: number, lng: number): Promise<string> {
  // Adding zoom=18 helps get more precise building-level addresses
  // accept-language=en ensures the address is in English for consistency
  return fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`)
    .then(res => res.json())
    .then(data => {
      if (data && data.display_name) {
        return data.display_name;
      }
      return "Address not found";
    })
    .catch(() => "Unable to retrieve address");
}



 isLoading: boolean = false;

 async EmployeePunching(): Promise<void> {
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }
  this.isLoading = true;

  try {
    const position = await this.getLocation();
    console.log(`Accuracy: ${position.accuracy} meters`); // Log this to see how precise it is
    
    const address = await this.getAddress(position.lat, position.lng);

    const data = {
      employee: this.selectedEmployeeId,
      check_in_lat: position.lat,
      check_in_lng: position.lng,
      check_in_location: address
    };

    this.EmployeeService.registerEmployeeAttendenceCheckIn(data).subscribe({
      next: (res) => {
        alert('✅ Check-In successful!');
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError(err);
        this.isLoading = false;
      }
    });
  } catch (error) {
    this.isLoading = false;
    alert('⚠️ Location Error: ' + error);
  }
}

isLoadingout: boolean = false;

async EmployeePunchingOut(): Promise<void> {
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

  this.isLoadingout = true; // Start loading

  try {
    const position = await this.getLocation();
    const address = await this.getAddress(position.lat, position.lng);

    const data = {
      employee: this.selectedEmployeeId,
      check_in_lat: position.lat,
      check_in_lng: position.lng,
      check_in_location: address
    };

    this.EmployeeService.registerEmployeeAttendenceCheckOut(data).subscribe({
      next: (response) => {
        alert('✅ Employee Check-Out successful!');
        this.isLoadingout = false;
      },
      error: (error) => {
        this.handleError(error);
        this.isLoadingout = false;
      }
    });

  } catch (error) {
    this.isLoadingout = false;
    alert('⚠️ Error: ' + error);
  }
}
  





  async recheckEmployee(): Promise<void> {
    // 1. Validation: Ensure employee is loaded
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }
  
  
    try {
      // 2. Fetch Geolocation
      const position = await this.getLocation();
      
      // 3. Fetch Readable Address
      const address = await this.getAddress(position.lat, position.lng);
  
      // 4. Construct Payload (matching your registerCheckIn model)
      const data = {
        employee: this.selectedEmployeeId,
        check_in_lat: position.lat,
        check_in_lng: position.lng,
        check_in_location: address
      };
  
      // 5. Send to Service
      this.leaveService.EmployeeRechecIn(data).subscribe({
        next: (response) => {
          console.log('Re Check-In successful:', response);
          alert('✅ Re Check-In successful!');
        
        },
        error: (error) => {
      
          this.handleError(error); // Using a helper for cleaner code
        }
      });
  
    } catch (error) {
      
      console.error('Location Error:', error);
      alert('⚠️ Error: ' + error + '. Please allow location access to proceed.');
    }
  }
  
  // Helper to handle backend errors
  private handleError(error: any) {
    if (error.error && typeof error.error === 'object') {
      let errorMsg = '';
      for (const key in error.error) {
        errorMsg += `${key}: ${error.error[key]}\n`;
      }
      alert(`⚠️ Validation Errors:\n\n${errorMsg}`);
    } else {
      alert('⚠️ Server error. Please try again later.');
    }
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

    calculateTotalDays() {
    if (this.start_date && this.end_date) {
      const start = new Date(this.start_date);
      const end = new Date(this.end_date);
      const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
      this.totalDays = diff > 0 ? diff : 0;
    } else {
      this.totalDays = 0;
    }
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
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
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
  formData.append('branch', this.branch?.toString() || '');
    // ✅ Automatically add branch
  formData.append('branch', this.selectedBranchId.toString());

  if (this.request_document) {
    formData.append('request_document', this.request_document);
  }

  this.EmployeeService.registerGeneralReq(formData).subscribe(
    (response) => {
      alert('✅ General request has been added successfully!');
      window.location.reload();
    },
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
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
  this.registerButtonClicked = true;
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }


  const companyData = {
    reason: this.reason || '',

    asset_type: this.asset_type?.toString() || '',
    requested_asset: this.requested_asset || '',
     employee: this.selectedEmployeeId,
    // Convert document_number safely to string
    document_number: this.document_number?.toString() || '',
 
  };

  this.employeeService.registerAssetRequest(companyData).subscribe({
    next: (response) => {
      console.log('Registration successful', response);
      alert('Asset request has been added!');
      window.location.reload();
    },
    error: (error) => {
      // same error handling as above...
      console.error('Added failed', error);
      let errorMessage = 'Enter all required fields!';

      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
  });
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
    
      const selectedSchema = this.authService.getSelectedSchema(); 
    
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
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
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
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
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
    this.registerButtonClicked = true;
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

  
    const formData = new FormData();
    formData.append('amount_requested', this.amount_requested);
    formData.append('repayment_period', this.repayment_period);
    formData.append('emi_amount', this.emi_amount);

    formData.append('remaining_balance', this.remaining_balance);
    // formData.append('branch', this.branch);
 
    formData.append('employee', this.selectedEmployeeId.toString());

  
    formData.append('document_number', this.document_number?.toString() || '');

    formData.append('pause_start_date', this.pause_start_date);
    formData.append('resume_date', this.resume_date );
    formData.append('pause_reason', this.pause_reason);
    // formData.append('employee', this.employee);
    formData.append('loan_type', this.loan_type);


  
    this.employeeService.registerLoanApplication(formData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Loan application has been added');
        window.location.reload();
      },
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
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
  location:any = '';
  termination_type: any = '';
  reason_for_leaving: any = '';

  
  SetEmployeeResignation(): void {
    // if (!this.name || !this.code || !this.valid_to) {
    //   return;
    // }
  
  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
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


        alert('Resignation Request has been Send');

        window.location.reload();
      },  
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
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


  // Airticket Requset


  allocation: any = '';
  request_date: any = '';
  departure_date: any = '';
  return_date: any = '';
  origin: any = '';
  destination: any = '';
  notes: any = '';


  allowed_in_probation:  boolean = false;



  Users:any []=[];

  Allocations:any[]=[];






  customFieldHeaders: { custom_field_id: number, custom_field_name: string }[] = [];


  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  custom_fieldsFam :any[] = [];


     branches:any []=[];

  loadDeparmentBranch(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); 
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any) => {
          this.branches = result;
          console.log(' fetching Companies:');
            if (callback) callback();

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }
 

              SentRequest(): void {
            this.registerButtonClicked = true;
            const companyData = {
              allocation: this.allocation,
            
              request_type:this.request_type,
              request_date:this.request_date,
              departure_date:this.departure_date,
              return_date:this.return_date,
              origin:this.origin,
              destination:this.destination,
              notes:this.notes,
              approved_by:this.approved_by,
              employee:this.selectedEmployeeId,
              // employee:this.employee,
              document_number:this.document_number,
              // branch:this.branch



              // Add other form field values to the companyData object
            };
          

        
            this.employeeService.registerAirTicketRequest(companyData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                    alert('Request sent successfuly completed');
                    window.location.reload();
               
        
              },
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
}
            );
          }

 loadAllocations(callback?: Function): void {

  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.employeeService.getairticketAllocations(selectedSchema).subscribe(
      (result: any) => {
        this.Allocations = result;
        console.log(' fetching Loantypes:');
          if (callback) callback();

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }

  // Document Request 

    DocType: any[] = [];
  
   LoadDocType(callback?: Function) {
     const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.leaveService.getDocRequestType(selectedSchema).subscribe(
        (data: any) => {
          this.DocType = data;
             if (callback) callback();
          console.log('DocType:', this.DocType);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  }


      SetDocApprovaLevel(): void {
      this.registerButtonClicked = true;
      // if (!this.name || !this.code || !this.valid_to) {
      //   return;
      // }

  if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

    
      const formData = new FormData();
       formData.append('document_number', this.document_number?.toString() || '');
      formData.append('reason', this.reason);
      // formData.append('branch', this.branch);


  
  
      formData.append('total', this.total);
      formData.append('remarks', this.remarks);
      formData.append('employee', this.selectedEmployeeId.toString());
      formData.append('request_type', this.request_type);
      formData.append('created_by', this.created_by);

     
  
      
    
    
      this.leaveService.CreateDocRequest(formData).subscribe(
        (response) => {
          console.log('Registration successful', response);
  
  
          alert('Document Request  has been Sent');
  
          window.location.reload();
        },  
(error) => {
  console.error('Leave request failed:', error);

  let errorMessage = 'Something went wrong.';

  if (error.error) {

    // 🔹 Case 1: Plain string error
    if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    // 🔹 Case 2: DRF validation errors (object)
    else if (typeof error.error === 'object') {

      const messages: string[] = [];

      Object.keys(error.error).forEach((field) => {
        const value = error.error[field];

        if (Array.isArray(value)) {
          messages.push(`${field}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${field}: ${value}`);
        }
      });

      if (messages.length > 0) {
        errorMessage = messages.join('\n');
      }
    }

    // 🔹 Case 3: DRF "detail" message
    else if (error.error.detail) {
      errorMessage = error.error.detail;
    }
  }

  alert(`Leave request failed!\n\n${errorMessage}`);
}
      );
    }

get dashboardLeaveBalances() {
  return this.employeesec?.leave_balance
    ?.filter((item: any) => item.include_dashboard === true);
}





// general request approvals ts code 

Approvals: any[] = []; // Assuming this array holds the list of expired documents

loadGeeralReqAprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.employeeService.getGenReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.Approvals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.Approvals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

selectedApproval: any = null;
isAddFieldsModalOpen: boolean = false;

selectedaprovaldetalis(approvalId: number): void {
const selectedSchema = this.authService.getSelectedSchema();

if (selectedSchema) {
const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/?schema=${selectedSchema}`;

this.EmployeeService.getApprovalDetails(apiUrl).subscribe(
  (response: any) => {
    this.selectedApproval = response;
    this.isAddFieldsModalOpen = true; // Open the modal
    console.log('detalis',this.selectedApproval)
  },
  (error) => {
    console.error('Error fetching approval details:', error);
  }
);
}
}

// Function for handling approval rejection
rejectApproval(approvalId: number): void {
const selectedSchema = this.authService.getSelectedSchema();


   // Data to be sent in the request body (including the note)
   const approvalData = {
    note: this.note,          // The note entered by the user
    status: 'Rejected',       // Setting status to "Approved"
  };
if (selectedSchema) {
  const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/reject/?schema=${selectedSchema}`;

  this.EmployeeService.rejectApprovalRequest(apiUrl, approvalData).subscribe(
    (response: any) => {
      console.log('Approval status changed to Rejected:', response);

      // Update the selected approval status in the local UI
      if (this.selectedApproval) {
        this.selectedApproval.status = 'Rejected';
      }

      // Optionally, update the main approvals list if needed
      const approvalIndex = this.Approvals.findIndex(approval => approval.id === approvalId);
      if (approvalIndex !== -1) {
        this.Approvals[approvalIndex].status = 'Rejected';
      }

      // Close the modal after successful approval
      this.isAddFieldsModalOpen = false;
    },
    (error) => {
      console.error('Error approving the approval request:', error);
    }
  );
}

}



// Function for handling approval status change to "Approved"
approveApproval(approvalId: number): void {
const selectedSchema = this.authService.getSelectedSchema();

if (selectedSchema) {
const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/approve/?schema=${selectedSchema}`;


   // Data to be sent in the request body (including the note)
   const approvalData = {
    note: this.note,          // The note entered by the user
    status: 'Approved',       // Setting status to "Approved"
  };

  this.EmployeeService.approveApprovalRequest(apiUrl, approvalData).subscribe(
    (response: any) => {
    console.log('Approval status changed to Approved:', response);

    // Update the selected approval status in the local UI
    if (this.selectedApproval) {
      this.selectedApproval.status = 'Approved';
    }

    // Optionally, update the main approvals list if needed
    const approvalIndex = this.Approvals.findIndex(approval => approval.id === approvalId);
    if (approvalIndex !== -1) {
      this.Approvals[approvalIndex].status = 'Approved';
    }

    // Close the modal after successful approval
    this.isAddFieldsModalOpen = false;
  },
  (error) => {
    console.error('Error approving the approval request:', error);
  }
);
}
}


closemarketModal(){
this.isAddFieldsModalOpen=false;
}



// Resignation request approvals ts code 


ResApprovals: any[] = [];

loadResReqAprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getResiReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.ResApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.ResApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

 approveResApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/resign-approval/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.EmployeeService.approveApprovalRequestResignation(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);
        //  this.fetchingApprovals();
        // 1. Get current selection state
    const currentSchema = localStorage.getItem('selectedSchema');
    const currentBranchIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

    // 2. Refresh the list using the new function
    if (currentSchema) {
      this.fetchEmployees(currentSchema, currentBranchIds);
    }
        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.ResApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.ResApprovals[approvalIndex].status = 'Approved';
        }

        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}

fetchEmployees(schema: string, branchIds: number[]): void {
  this.isLoading = true;
  this.EmployeeService.getGeneralResignApprovalsMasterNew(schema, branchIds).subscribe({
    next: (data: any) => {
      // Filter active employees
      this.ResApprovals = data;
      console.log('approvals :', this.ResApprovals)


      this.isLoading = false;
    },
    error: (err) => {
      console.error('Fetch error:', err);
      this.isLoading = false;
    }
  });
}


confirmResRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/resign-approval/${approvalId}/reject/?schema=${selectedSchema}`;

    this.EmployeeService.rejectApprovalRequestResignation(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.ResApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.ResApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}


 selectedResiaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/resign-approval/${approvalId}/?schema=${selectedSchema}`;

    this.EmployeeService.getApprovalDetailsLeave(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
      },
      (error) => {
        console.error('Error fetching approval details:', error);
      }
    );
  }
}

  RejectionResons: any[] = [];

LoadLeaveRejectionReasons(selectedSchema: string) {
  this.leaveService.getLeaverejectionReasons(selectedSchema).subscribe(
    (data: any) => {
      this.RejectionResons = data;
    
      console.log('employee:', this.RejectionResons);
    },
    (error: any) => {
      console.error('Error fetching categories:', error);
    }
  );
}


// Function for handling approval rejection

showRejectionReason: boolean = false; 

confirmRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/resign-approval/${approvalId}/reject/?schema=${selectedSchema}`;

    this.EmployeeService.rejectApprovalRequestResignation(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.ResApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.ResApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}

// Leave Request Approvals Code

LeaveApprovals: any[] = [];

loadLeaveReqApprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getLeaveReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.LeaveApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.LeaveApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

 approveLeaveApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-approvals/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.leaveService.approveApprovalRequestLeave(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.LeaveApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.LeaveApprovals[approvalIndex].status = 'Approved';
        }

        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}

confirmLeaveRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-approvals/${approvalId}/reject/?schema=${selectedSchema}`;

    this.leaveService.rejectApprovalRequestLeave(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.LeaveApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.LeaveApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}


 selectedLeaveaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-approvals/${approvalId}/?schema=${selectedSchema}`;

    this.leaveService.getApprovalDetailsLeave(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
      },
      (error) => {
        console.error('Error fetching approval details:', error);
      }
    );
  }
}

// Advance salary request Approval Code

AdvSalApprovals: any[] = [];

loadAdvSalReqAprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getAdvSalReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.AdvSalApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.AdvSalApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

 approveAdvsalApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-salaryrequest/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.EmployeeService.approveApprovalRequestadvSalary(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);
 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.EmployeeService.selectedSchema$,
  this.EmployeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchEmployees(schema, branchIds);  
    

  }
});        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.AdvSalApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.AdvSalApprovals[approvalIndex].status = 'Approved';
        }

        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}

confirmAdvSalRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-salaryrequest/${approvalId}/reject/?schema=${selectedSchema}`;

    this.EmployeeService.rejectApprovalRequestadvSalary(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.AdvSalApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.AdvSalApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}

LoadAdvsalRejectionReasons(selectedSchema: string) {
  this.leaveService.getLeaverejectionReasons(selectedSchema).subscribe(
    (data: any) => {
      this.RejectionResons = data;
    
      console.log('employee:', this.RejectionResons);
    },
    (error: any) => {
      console.error('Error fetching categories:', error);
    }
  );
}

 selectedAdvSalaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-salaryrequest/${approvalId}/?schema=${selectedSchema}`;

    this.EmployeeService.getApprovalDetailsadvSalary(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
      },
      (error) => {
        console.error('Error fetching approval details:', error);
      }
    );
  }
}

// Loan request Approval Code

LoanApprovals: any[] = [];

loadLoanReqAprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getLoanReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.LoanApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.LoanApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

 approveLoanApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.EmployeeService.approveApprovalRequestLeave(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);
        //  this.fetchingApprovals();
        window.location.reload();
        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.LoanApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.LoanApprovals[approvalIndex].status = 'Approved';
        }

        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}


 selectedloanaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/?schema=${selectedSchema}`;

    this.EmployeeService.getApprovalDetailsLeave(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
      },
      (error) => {
        console.error('Error fetching approval details:', error);
      }
    );
  }
}

confirmLoanRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/reject/?schema=${selectedSchema}`;

    this.EmployeeService.rejectApprovalRequestLeave(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);

        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.LoanApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.LoanApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}

// Asset request Approval Code

AssetApprovals: any[] = [];

loadAssetReqApprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getAssetReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.AssetApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.AssetApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}


 approveAssetApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
  
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/organisation/api/asset-request-approvals/${approvalId}/approve/?schema=${selectedSchema}`;
  
  
         // Data to be sent in the request body (including the note)
         const approvalData = {
          note: this.note,          // The note entered by the user
          status: 'Approved',       // Setting status to "Approved"
        };
  
        this.EmployeeService.approveApprovalRequestLeave(apiUrl, approvalData).subscribe(
          (response: any) => {
          console.log('Approval status changed to Approved:', response);
             // combineLatest waits for both Schema and Branches to have a value
        this.dataSubscription = combineLatest([
          this.EmployeeService.selectedSchema$,
          this.EmployeeService.selectedBranches$
        ]).subscribe(([schema, branchIds]) => {
          if (schema) {
            this.fetchEmployees(schema, branchIds);

          }
        });
          // Update the selected approval status in the local UI
          if (this.selectedApproval) {
            this.selectedApproval.status = 'Approved';
          }
  
          // Optionally, update the main approvals list if needed
          const approvalIndex = this.AssetApprovals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.AssetApprovals[approvalIndex].status = 'Approved';
          }
  
          // Close the modal after successful approval
          this.isAddFieldsModalOpen = false;
        },
        (error) => {
          console.error('Error approving the approval request:', error);
        }
      );
    }
  }

 confirmAssetRejection(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
  
    // Data to be sent in the request body (including the note and rejection reason)
    const approvalData = {
      note: this.note, // The note entered by the user
      status: 'Rejected', // Setting status to "Rejected"
      rejection_reason: this.rejection_reason, // Adding the rejection reason
    };
  
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/organisation/api/asset-request-approvals/${approvalId}/reject/?schema=${selectedSchema}`;
  
      this.EmployeeService.rejectApprovalRequestLeave(apiUrl, approvalData).subscribe(
        (response: any) => {
          console.log('Approval status changed to Rejected:', response);
  
          // Update the selected approval status in the local UI
          if (this.selectedApproval) {
            this.selectedApproval.status = 'Rejected';
          }
  
          // Optionally, update the main approvals list if needed
          const approvalIndex = this.AssetApprovals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.AssetApprovals[approvalIndex].status = 'Rejected';
          }
  
          // Reset the rejection reason and close the modal
          this.rejection_reason = '';
          this.showRejectionReason = false;
          this.isAddFieldsModalOpen = false;
        },
        (error) => {
          console.error('Error rejecting the approval request:', error);
        }
      );
    }
  }

 selectedassetaprovaldetalis(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
  
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/organisation/api/asset-request-approvals/${approvalId}/?schema=${selectedSchema}`;
  
      this.EmployeeService.getApprovalDetailsLeave(apiUrl).subscribe(
        (response: any) => {
          this.selectedApproval = response;
          this.isAddFieldsModalOpen = true; // Open the modal
          console.log('detalis',this.selectedApproval)
        },
        (error) => {
          console.error('Error fetching approval details:', error);
        }
      );
    }
  }

// Airticket request Approval Code


AirticketApprovals: any[] = [];

loadAirticketReqApprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getAirtickReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.AirticketApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.AirticketApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

     approveAirticketApproval(approvalId: number): void {
      const selectedSchema = this.authService.getSelectedSchema();
    
      if (selectedSchema) {
        const apiUrl = `${this.apiUrl}/payroll/api/airticket-approval/${approvalId}/approve/?schema=${selectedSchema}`;
    
    
           // Data to be sent in the request body (including the note)
           const approvalData = {
            note: this.note,          // The note entered by the user
            status: 'Approved',       // Setting status to "Approved"
          };
    
          this.EmployeeService.approveApprovalRequestLeave(apiUrl, approvalData).subscribe(
            (response: any) => {
            console.log('Approval status changed to Approved:', response);
          
 // combineLatest waits for both Schema and Branches to have a value
       this.dataSubscription = combineLatest([
        this.EmployeeService.selectedSchema$,
        this.EmployeeService.selectedBranches$
      ]).subscribe(([schema, branchIds]) => {
        if (schema) {
          this.fetchEmployees(schema, branchIds);  
          

        }
      });
            // Update the selected approval status in the local UI
            if (this.selectedApproval) {
              this.selectedApproval.status = 'Approved';
            }
    
            // Optionally, update the main approvals list if needed
            const approvalIndex = this.AirticketApprovals.findIndex(approval => approval.id === approvalId);
            if (approvalIndex !== -1) {
              this.AirticketApprovals[approvalIndex].status = 'Approved';
            }
    
            // Close the modal after successful approval
            this.isAddFieldsModalOpen = false;
          },
          (error) => {
            console.error('Error approving the approval request:', error);
          }
        );
      }
    }

        confirmAirtickRejection(approvalId: number): void {
      const selectedSchema = this.authService.getSelectedSchema();
    
      // Data to be sent in the request body (including the note and rejection reason)
      const approvalData = {
        note: this.note, // The note entered by the user
        status: 'Rejected', // Setting status to "Rejected"
        rejection_reason: this.rejection_reason, // Adding the rejection reason
      };
    
      if (selectedSchema) {
        const apiUrl = `${this.apiUrl}/payroll/api/airticket-approval/${approvalId}/reject/?schema=${selectedSchema}`;
    
        this.EmployeeService.rejectApprovalRequestLeave(apiUrl, approvalData).subscribe(
          (response: any) => {
            console.log('Approval status changed to Rejected:', response);
    
            // Update the selected approval status in the local UI
            if (this.selectedApproval) {
              this.selectedApproval.status = 'Rejected';
            }
    
            // Optionally, update the main approvals list if needed
            const approvalIndex = this.AirticketApprovals.findIndex(approval => approval.id === approvalId);
            if (approvalIndex !== -1) {
              this.AirticketApprovals[approvalIndex].status = 'Rejected';
            }
    
            // Reset the rejection reason and close the modal
            this.rejection_reason = '';
            this.showRejectionReason = false;
            this.isAddFieldsModalOpen = false;
          },
          (error) => {
            console.error('Error rejecting the approval request:', error);
          }
        );
      }
    }

      selectedAiraprovaldetalis(approvalId: number): void {
      const selectedSchema = this.authService.getSelectedSchema();
    
      if (selectedSchema) {
        const apiUrl = `${this.apiUrl}/payroll/api/airticket-approval/${approvalId}/?schema=${selectedSchema}`;
    
        this.EmployeeService.getApprovalDetailsLeave(apiUrl).subscribe(
          (response: any) => {
            this.selectedApproval = response;
            this.isAddFieldsModalOpen = true; // Open the modal
            console.log('detalis',this.selectedApproval)
          },
          (error) => {
            console.error('Error fetching approval details:', error);
          }
        );
      }
    }


// Document request Type code 


DocApprovals: any[] = [];

loadDocReqApprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  
  if (!selectedSchema) {
    console.error('No schema found in authService');
    return;
  }

  this.CountryService.getDocReqApprovals(selectedSchema).subscribe({
    next: (result: any) => {
      // Logic check: many APIs return data inside a 'results' or 'data' property
      this.DocApprovals = Array.isArray(result) ? result : (result.data || []);
      console.log('Successfully loaded approvals:', this.DocApprovals);
    },
    error: (error) => {
      console.error('API Error:', error);
    }
  });
}

approveDocApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.leaveService.approveApprovalDocRequest(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);
        window.location.reload();
        
 


        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.DocApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.DocApprovals[approvalIndex].status = 'Approved';
        }

  

        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}

confirmDocRejection(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  // Data to be sent in the request body (including the note and rejection reason)
  const approvalData = {
    note: this.note, // The note entered by the user
    status: 'Rejected', // Setting status to "Rejected"
    rejection_reason: this.rejection_reason, // Adding the rejection reason
  };

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval/${approvalId}/reject/?schema=${selectedSchema}`;

    this.leaveService.rejectApprovalDocRequest(apiUrl, approvalData).subscribe(
      (response: any) => {
        console.log('Approval status changed to Rejected:', response);
        window.location.reload();


        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Rejected';
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.DocApprovals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.DocApprovals[approvalIndex].status = 'Rejected';
        }

        // Reset the rejection reason and close the modal
        this.rejection_reason = '';
        this.showRejectionReason = false;
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error rejecting the approval request:', error);
      }
    );
  }
}

 selectedDocaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval/${approvalId}/?schema=${selectedSchema}`;

    this.leaveService.getApprovalDetailsDocRequest(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
      },
      (error) => {
        console.error('Error fetching approval details:', error);
      }
    );
  }
}


// Timesheet Type code 

 date: any = '';
 time_spent: any = '';
 description: any = '';
 project: any = '';
 task: any = '';
 Projects:any []=[];
 Timesheets:any []=[];
 Tasks:any []=[];
 Stages:any []=[];


   CreateProject(): void {
       this.registerButtonClicked = true;

 if (!this.selectedEmployeeId  || !this.selectedBranchId) {
    alert('Please ensure Employee is loaded.');
    return;
  }

          
          
            const formData = new FormData();
          
            formData.append('date', this.date);
            formData.append('status', this.status);
            formData.append('time_spent', this.time_spent);
            formData.append('description', this.description);
            formData.append('project', this.project);
            formData.append('task', this.task);
            formData.append('employee', this.selectedEmployeeId.toString());

        
            // Add file
          
            this.employeeService.registerProjectTimesheet(formData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                alert('Project Timesheet has been Created.');
                window.location.reload();
              },
              (error) => {
                console.error('Add failed', error);
               let errorMessage = 'Enter all required fields!';

      // ✅ Handle backend validation or field-specific errors
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
            );
          }

 loadProject(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
              
  if (selectedSchema) {
  this.employeeService.getProjectNew(selectedSchema, savedIds).subscribe(
  (result: any) => {
  this.Projects = result;               
   if (callback) callback();
 },
  (error) => {
 console.error('Error fetching Companies:', error);
  }
 );
   }
   }

  loadStages(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.employeeService.getProjectsStages(selectedSchema).subscribe(
      (result: any) => {
        this.Stages = result;
        console.log(' fetching Stages:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }

  loadLTasks(callback?: Function): void {
     const selectedSchema = this.authService.getSelectedSchema();
     const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
            
            
      if (selectedSchema) {
        this.employeeService.getProjectTaskNew(selectedSchema, savedIds).subscribe(
         (result: any) => {
          this.Tasks = result;
                    
          if (callback) callback();
           },
            (error) => {
             console.error('Error fetching Companies:', error);
         }
          );
          }
        }





            fetchTimeEmployees(schema: string, branchIds: number[]): void {
              this.isLoading = true;
              this.employeeService.getProjectTimesheetNew(schema, branchIds).subscribe({
                next: (data: any) => {
                  // Filter active employees
                  this.Timesheets = data;
          
                  this.isLoading = false;
                },
                error: (err) => {
                  console.error('Fetch error:', err);
                  this.isLoading = false;
                }
              });
            }
  

}
