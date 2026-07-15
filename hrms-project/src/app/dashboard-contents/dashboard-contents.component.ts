import { style } from '@angular/animations';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router, NavigationEnd  } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs';
import { LeaveService } from '../leave-master/leave.service';
import { forkJoin } from 'rxjs';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);



@Component({
  selector: 'app-dashboard-contents',
  templateUrl: './dashboard-contents.component.html',
  styleUrl: './dashboard-contents.component.css'
})
export class DashboardContentsComponent {


  @ViewChild('attendanceChart') attendanceChartCanvas!: ElementRef;
  attendanceChart: any = null;
 


  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;
  schemas: string[] = []; // Array to store schema names

  Schemadatas: string[] = []; // Array to store schema names
  branches:any []=[];

  selectedBranchHolidays: any[] = []; // To store the holidays for the selected branch

  selectedBranchPolicies: any[] = []; // To store policies for the selected branch
  selectedBranchAnnouncement: any[] = [];
  selectedBranchProjects: any[] = [];

  selectedBranchId: string = ''; // To track the currently selected branch
  selectedBranchIdhol: string = ''; // To track the currently selected branch


  branchCount: number = 0;
  departmentCount: number = 0;
  designationsCount: number = 0;
  categoriesCount: number = 0;

  currentGreeting: string = '';


pendingApprovals: any[] = [];
filteredApprovals: any[] = [];
approvalFilter: string = '';
  


  constructor(
   private authService: AuthenticationService,
   private router: Router,
   private EmployeeService: EmployeeService,
   private route: ActivatedRoute,
   private sessionService: SessionService,
      private leaveService: LeaveService,
   private DepartmentServiceService: DepartmentServiceService ,
   ) { this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.isLoadingEss = false;
    }
  }); }

  dataSubscription?: Subscription;

   ngOnInit(): void {

      this.dataSubscription = combineLatest([
    this.EmployeeService.selectedSchema$,
    this.EmployeeService.selectedBranches$
  ]).subscribe(([schema, branchIds]) => {
    if (schema) {
      this.fetchEmployees(schema, branchIds);

      
    }
    if (schema && branchIds && branchIds.length > 0) {
      this.filterAttendanceChartToday(schema, branchIds);
    }
  });

  // Update the greeting every minute
  setInterval(() => {
    this.setDynamicGreeting();
  }, 100); // 60000ms = 1 minute

    this.fetchingSchemaDatas();
    this.loadBranch();
    
        this.selectedSchema = this.sessionService.getSelectedSchema();

    // this.hideButton = this.EmployeeService.getHideButton();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Perform any actions on navigation end if needed
      }
    });

    const selectedSchema = this.authService.getSelectedSchema();
    const selectedSchemaId = this.authService.getSelectedSchemaId();


    

    if (selectedSchema && selectedSchemaId) {
        this.selectedSchema = selectedSchema;
        console.log('Selected schema from localStorage:', selectedSchema);
        console.log('Selected schema ID from localStorage:', selectedSchemaId);
    } else {
        console.error("No schema selected.");
    }

    this.userId = this.sessionService.getUserId();
    if (this.userId !== null) {
        this.authService.getUserData(this.userId).subscribe(
            (userData: any) => {
                this.userDetails = userData;
                this.username = this.userDetails.username;
                const isSuperuser = this.userDetails.is_superuser || false;
                const isEssUser = this.userDetails.is_ess || false;
            },
            (error) => {
                console.error('Failed to fetch user details:', error);
            }
        );


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


expandedTaskId: number | null = null;

toggleTask(taskId: number): void {
  this.expandedTaskId = this.expandedTaskId === taskId ? null : taskId;
}


maxAvatars = 4;

toggleManagers(project: any) {
  project.showAllManagers = !project.showAllManagers;
}

toggleMembers(project: any) {
  project.showAllMembers = !project.showAllMembers;
}

getVisibleManagers(project: any) {
  return project.showAllManagers
    ? project.managers
    : project.managers.slice(0, this.maxAvatars);
}

getVisibleMembers(project: any) {
  return project.showAllMembers
    ? project.members
    : project.members.slice(0, this.maxAvatars);
}




isLoadingEss: boolean = false;


EssUser(): void {
  if (this.selectedSchema) {
    this.isLoadingEss = true;

    // ⏳ Simulate loading time before navigation
    setTimeout(() => {
      const url = '/employee-dashboard';
      this.router.navigate([url]);
    }, 2000); // Show loader for 2 seconds
  } else {
    alert('Please select a schema.');
  }
}



fetchingSchemaDatas(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.EmployeeService.getSChemadatas(selectedSchema).subscribe(
      (result: any) => {
        // Calculate branch and department counts
        this.branchCount = result.branches?.length || 0; // Safe navigation operator in case branches is undefined
       
        this.departmentCount = result.departments?.length || 0; // Safe navigation operator in case departments is undefined
        this.designationsCount = result.designations?.length || 0; // Safe navigation operator in case departments is undefined
        this.categoriesCount = result.categories?.length || 0; // Safe navigation operator in case departments is undefined
      },
      (error) => {
        console.error('Error fetching schema data:', error);
      }
    );
  }
}


setDynamicGreeting(): void {
  const currentHour = new Date().getHours(); // Get the current hour (0-23)

  if (currentHour >= 0 && currentHour < 12) {
    this.currentGreeting = 'Good Morning...';
  } else if (currentHour >= 12 && currentHour < 18) {
    this.currentGreeting = 'Good Afternoon...';
  } else {
    this.currentGreeting = 'Good Evening...';
  }
}

 loadBranch(): void {
    const selectedSchema = this.authService.getSelectedSchema();

    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any) => {
          this.branches = result;
          if (this.branches.length > 0) {
            this.selectedBranchId = this.branches[0].id;
            this.selectedBranchIdhol = this.branches[0].id;
            this.fetchBranchHolidays(this.selectedBranchIdhol);
          }
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }

  onBranchChange(event: Event): void {
    const branchId = (event.target as HTMLSelectElement).value;
    const selectedBranch = this.branches.find(branch => branch.id == branchId);
  
    if (selectedBranch) {
      this.selectedBranchHolidays = selectedBranch.holidays || [];
      this.selectedBranchPolicies = selectedBranch.policies || [];
      this.selectedBranchAnnouncement = selectedBranch.branch_announcements || [];
      this.selectedBranchProjects = selectedBranch.branch_projects || [];
    } else {
      this.selectedBranchHolidays = [];
      this.selectedBranchPolicies = [];
      this.selectedBranchAnnouncement = [];
      this.selectedBranchProjects = [];
    }
  }

  
  fetchBranchHolidays(branchId: string): void {
    const selectedBranch = this.branches.find(branch => branch.id === branchId);
  
    this.selectedBranchHolidays = selectedBranch ? selectedBranch.holidays || [] : [];
    this.selectedBranchPolicies = selectedBranch ? selectedBranch.policies || [] : [];
    this.selectedBranchAnnouncement = selectedBranch ? selectedBranch.branch_announcements || [] : [];
    this.selectedBranchProjects = selectedBranch ? selectedBranch.branch_projects || [] : [];
  }
  // Utility methods to format date
  getDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }
  
  getMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'short' }).toUpperCase();
  }
  
  getDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { weekday: 'long' });
  }

filterApprovals() {
  if (!this.approvalFilter) {
    // Show all
    this.filteredApprovals = [...this.pendingApprovals];
  } else {
    // Filter by type
    this.filteredApprovals = this.pendingApprovals.filter((a: any) =>
      a.type === this.approvalFilter
    );
  }
}

goToApproval(item: any) {
  let route = '';

  switch (item.type) {
    case 'general':
      route = '/main-sidebar/sub-sidebar/approvals';
      break;

    case 'resignation':
      route = '/main-sidebar/sub-sidebar/resignation-approvals';
      break;

    case 'leave':
      route = '/main-sidebar/leave-options/leave-approvals';
      break;

    case 'advance':
      route = '/main-sidebar/salary-options/advance-salary-approvals';
      break;

    case 'loan':
      route = '/main-sidebar/loan-sidebar/loan-approval';
      break;

    case 'asset':
      route = '/main-sidebar/asset-options/asset-approval';
      break;

    case 'airticket':
      route = '/main-sidebar/air-ticket-options/airticket-approvals';
      break;

    case 'document':
      route = '/main-sidebar/settings/document-request-approval';
      break;

    default:
      route = '/main-sidebar/sub-sidebar/approvals';
  }

  this.router.navigate([route]);
}



fetchEmployees(schema: string, branchIds: number[]): void {
  this.isLoading = true;

  forkJoin({
    general: this.EmployeeService.getGeneralRequestApprovalsMasterNew(schema, branchIds),
    leave: this.leaveService.getApprovalslistLeaveNew(schema, branchIds),
    loan: this.EmployeeService.getApprovalslistLoanNew(schema, branchIds),
    airticket: this.EmployeeService.getApprovalslistAirticketNew(schema, branchIds),
    asset: this.EmployeeService.getApprovalslistAssetNew(schema, branchIds),
    advance: this.EmployeeService.getApprovalslistadvSalaryNew(schema, branchIds),

    // ⚠️ FIX HERE
    document: this.leaveService.getApprovalslistDocrequest(schema, branchIds[0]),

    resignation: this.EmployeeService.getGeneralResignApprovalsMasterNew(schema, branchIds)
  }).subscribe({
    next: (res: any) => {

      const allData = [
        ...this.mapType(res.general, 'general'),
        ...this.mapType(res.leave, 'leave'),
        ...this.mapType(res.loan, 'loan'),
        ...this.mapType(res.airticket, 'airticket'),
        ...this.mapType(res.asset, 'asset'),
        ...this.mapType(res.advance, 'advance'),
        ...this.mapType(res.document, 'document'),
        ...this.mapType(res.resignation, 'resignation')
      ];

      const pending = allData.filter(item =>
        item.status?.toLowerCase() === 'pending'
      );

      this.pendingApprovals = pending;
      this.filteredApprovals = [...pending];

      this.isLoading = false;
    },
    error: (err: any) => {
      console.error(err);
      this.isLoading = false;
    }
  });
}


mapType(data: any[], type: string): any[] {
  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    id: item.id,
    type: type,
    status: item.status,
    employee_id: item.employee_id || item.employee || 'Employee',
    raw: item
  }));
}

showApprovals: boolean = false;



toggleApprovals() {
  this.showApprovals = !this.showApprovals;
}




scrollToApprovals(): void {
  const element = document.getElementById('approvalSection');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}



  

  // LoadSelectedBranchAnnouncement(event: Event): void {
  //   const branchId = (event.target as HTMLSelectElement).value;

  //   const selectedSchema = this.authService.getSelectedSchema();
  
  //   if (branchId && selectedSchema ) {
  //     this.DepartmentServiceService.getBranchAnnouncement(branchId,selectedSchema).subscribe(
  //       (result: any) => {
  //         this.selectedBranchPolicies = result;
  //         console.log('Policies fetched for branch:', branchId, this.selectedBranchPolicies);
  //       },
  //       (error) => {
  //         console.error('Error fetching policies for branch:', branchId, error);
  //         this.selectedBranchPolicies = [];
  //       }
  //     );
  //   } else {
  //     this.selectedBranchPolicies = [];
  //   }
  // }

  // fetchBranchPolicies(branchId: string, selectedSchema: string): void {
  //   this.DepartmentServiceService.getBranchPolicies(branchId, selectedSchema).subscribe(
  //     (result: any) => {
  //       this.selectedBranchPolicies = result; // Store policies for the selected branch
  //       console.log('Policies fetched for branch:', branchId, this.selectedBranchPolicies);
  //     },
  //     (error) => {
  //       console.error('Error fetching policies for branch:', branchId, error);
  //       this.selectedBranchPolicies = []; // Clear policies on error
  //     }
  //   );
  // }


  isAddFieldsModalOpen: boolean = false;

  openAddFieldsModal():void{
    this.isAddFieldsModalOpen=true;
  }
  closemarketModal(){
    this.isAddFieldsModalOpen=false;
  }





  /**
   * Automatically calculates today's date and fetches metrics for selected branches
   */
  filterAttendanceChartToday(schema: string, branchIds: number[]): void {
    if (!schema || !branchIds || branchIds.length === 0) {
      console.log('Awaiting schema/branch context selection...');
      return;
    }

    this.isLoading = true;

    // 🕒 Fetch current live system day values
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);

    // Pin both start and end parameters exactly to today's date (YYYY-MM-DD)
    const todayStr = `${year}-${month}-${day}`;

    // Map each selected branch ID to the single concurrent request bundle
    const requests = branchIds.map(id => 
      this.EmployeeService.getAttendanceCalendarAllemployee(schema, id, todayStr, todayStr)
    );

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        let aggregatedCalendarDays: any[] = [];

        responses.forEach(res => {
          if (res && res.calendar) {
            aggregatedCalendarDays = aggregatedCalendarDays.concat(res.calendar);
          }
        });

        console.log(`Aggregated Today (${todayStr}) Branch Dataset:`, aggregatedCalendarDays);
        this.processChartData(aggregatedCalendarDays);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching today\'s live attendance metrics:', err);
        this.isLoading = false;
      }
    });
  }

  /** Groups the current day's employee statuses
   */
  processChartData(calendarData: any[]): void {
    const counts: { [key: string]: number } = {
      'Present': 0,
      'Absent': 0,
      'Leave': 0
    };

    calendarData.forEach(day => {
      const status = day.display_status || day.status;
      if (status && status.includes('Present')) {
        counts['Present']++;
      } else if (status && status.includes('Leave')) {
        counts['Leave']++;
      } else {
        counts['Absent']++;
      }
    });

    this.renderAttendancePieChart(counts['Present'], counts['Absent'], counts['Leave']);
  }

  /**
   * Visualizes today's distribution with sleek slate tones
   */
  renderAttendancePieChart(present: number, absent: number, leave: number): void {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }

    if (!this.attendanceChartCanvas) {
      return;
    }

    const ctx = this.attendanceChartCanvas.nativeElement.getContext('2d');
    this.attendanceChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Present', 'Absent', 'On Leave'],
        datasets: [{
          data: [present, absent, leave],
          backgroundColor: [
            '#508D76', // Muted Slate Green (Present)
            '#B85C5C', // Soft Slate Terracotta/Red (Absent)
            '#D4A359'  // Muted Ochre / Slate Gold (Leave)
          ],
          borderColor: [
            '#3B6E5A',
            '#964343',
            '#B0823E'
          ],
          borderWidth: 1,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 15,
              padding: 20,
              font: {
                family: "'Segoe UI', 'Roboto', sans-serif",
                size: 13
              }
            }
          }
        }
      }
    });
  }



  






}
