import { style } from '@angular/animations';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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

import { statusLabel } from '../shared-ui/status-label';   // v1.15.1
import { HttpClient } from '@angular/common/http';   // v1.16.0
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from '../shared-ui/z-record.service';
import { recordUrl } from '../shared-ui/z-nav';
import { DashPeriod, DashPeriods, periodQuery, resolvePeriod } from '../shared-ui/z-dash-period';
import { i18nT } from '../shared-ui/i18n.service';
Chart.register(...registerables);



@Component({
  selector: 'app-dashboard-contents',
  templateUrl: './dashboard-contents.component.html',
  styleUrl: './dashboard-contents.component.css'
})
export class DashboardContentsComponent implements OnInit, OnDestroy {

  statusLabel = statusLabel;   // v1.15.1: readable status ("In progress", not "In_progress")
  /** v1.16.0: period of the attendance chart (its own, default today) and the figures behind its bars */
  chartPeriod: DashPeriod | null = null;
  private chartLinks: (string | null)[] = [];
  private chartSchema = '';
  private chartBranches: number[] = [];


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
      private cdr: ChangeDetectorRef,
   private http: HttpClient,   // v1.16.0
   private zrec: ZRecordService,
   private DepartmentServiceService: DepartmentServiceService ,
   ) { this.navSub = this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.isLoadingEss = false;
    }
  }); }

  dataSubscription?: Subscription;
  // v1.6.0: timers and subscriptions are stopped when the dashboard is left (they kept the whole app busy before)
  private navSub?: Subscription;
  private greetingTimer: any;
  private destroyed = false;
  private chartRetries = 0;

  ngOnDestroy(): void {
    this.destroyed = true;
    clearInterval(this.greetingTimer);
    this.dataSubscription?.unsubscribe();
    this.navSub?.unsubscribe();
    if (this.attendanceChart) { this.attendanceChart.destroy(); this.attendanceChart = null; }
  }

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
  this.setDynamicGreeting();
  this.greetingTimer = setInterval(() => {
    this.setDynamicGreeting();
  }, 60000); // 1 minute

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
      const url = '/main-sidebar/home';   // v1.28.1
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
      route = '/main-sidebar/general-sidebar/approvals';   // v1.15.1: was sub-sidebar/approvals (no such page)
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
      route = '/main-sidebar/general-sidebar/document-request-approval';   // v1.15.1: was under settings (no such page)
      break;

    default:
      route = '/main-sidebar/general-sidebar/approvals';   // v1.15.1: was sub-sidebar/approvals (no such page)
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
   * Automatically calculates today's date and fetches metrics for selected branches*/ 

  
  filterAttendanceChartToday(schema: string, branchIds: number[]): void {
    // v1.16.0: the same figures as the Attendance card (both attendance sources) for the chart's period; every bar opens its list
    this.chartSchema = schema; this.chartBranches = branchIds || [];
    if (!schema) { return; }
    const per = this.chartPeriod || resolvePeriod({ preset: 'today' });
    const br = this.chartBranches.length ? `&branch=${this.chartBranches.join(',')}` : '';
    this.isLoading = true;
    this.cdr.detectChanges();
    firstValueFrom(this.http.get<any>(`${this.zrec.api}/dashboard/api/overview/?schema=${encodeURIComponent(schema)}&card=attendance${br}${periodQuery(per)}`))
      .then(d => {
        const card = (d?.cards || []).find((c: any) => c.key === 'attendance');
        const k = (card?.kpis || []).slice(0, 3);
        this.chartLinks = k.map((x: any) => x.link || null);
        this.chartLabels = k.map((x: any) => i18nT(x.label));
        this.isLoading = false;
        this.cdr.detectChanges();
        this.renderAttendanceBarChart(k[0]?.value || 0, k[1]?.value || 0, k[2]?.value || 0);
      })
      .catch(() => { this.isLoading = false; this.cdr.detectChanges(); });
  }

  private chartLabels: string[] = ['Present', 'Absent', 'On Leave'];

  /** v1.16.0: periods from the dashboard designer – the chart follows its own (default today) or the dashboard one. */
  onPeriods(p: DashPeriods): void {
    const next = p.cards['attendance-chart'] || p.dash;
    if (this.chartPeriod && this.chartPeriod.from === next.from && this.chartPeriod.to === next.to) { return; }
    this.chartPeriod = next;
    if (this.chartSchema) { this.filterAttendanceChartToday(this.chartSchema, this.chartBranches); }
  }

  openRecord(model: string, id: any, ev?: Event): void {
    ev?.preventDefault(); ev?.stopPropagation();
    if (id) { this.router.navigateByUrl(recordUrl(model, id)); }
  }

  openHolidays(): void { this.router.navigateByUrl('/main-sidebar/settings/holiday-calendar'); }

  openPolicies(): void { this.router.navigateByUrl('/main-sidebar/my-policies'); }

  processChartData(calendarData: any[]): void {
    const counts: { [key: string]: number } = {
      'Present': 0,
      'Absent': 0,
      'Leave': 0
    };

    calendarData.forEach(branchResponse => {
      if (branchResponse && branchResponse.employees) {
        branchResponse.employees.forEach((emp: any) => {
          if (emp.calendar && emp.calendar.length > 0) {
            const day = emp.calendar[0];
            const status = day.display_status || day.status;

            if (status && status.includes('Present')) {
              counts['Present']++;
            } else if (status && status.includes('Leave')) {
              counts['Leave']++;
            } else {
              counts['Absent']++;
            }
          }
        });
      }
    });

    this.renderAttendanceBarChart(counts['Present'], counts['Absent'], counts['Leave']);
  }

  renderAttendanceBarChart(present: number, absent: number, leave: number): void {
    // Destroy previous chart cleanly to prevent ghost renders or overlaps
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
      this.attendanceChart = null;
    }

    if (!this.attendanceChartCanvas) {
      // the canvas appears after the next render; stop when the dashboard has been left
      if (this.destroyed || this.chartRetries++ > 120) { return; }
      requestAnimationFrame(() => this.renderAttendanceBarChart(present, absent, leave));
      return;
    }
    this.chartRetries = 0;

    const ctx = this.attendanceChartCanvas.nativeElement.getContext('2d');
    
    // Create new modern column bar chart instance
    this.attendanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: 'Employee Count',
          data: [present, absent, leave],
          backgroundColor: [
            'rgba(80, 141, 118, 0.85)',  // Warm Emerald / Slate Green
            'rgba(184, 92, 92, 0.85)',   // Soft Crimson / Terracotta Red
            'rgba(212, 163, 89, 0.85)'   // Warm Mustard Gold / Leave Ochre
          ],
          borderColor: [
            '#508D76',
            '#B85C5C',
            '#D4A359'
          ],
          borderWidth: 1.5,
          borderRadius: 8,              // Elegant rounded top columns
          borderSkipped: false,
          barThickness: 45              // Perfect clean column width visual balance
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // v1.16.0: a bar opens the attendance list behind it
        onClick: (_e: any, els: any[]) => { const l = els?.length ? this.chartLinks[els[0].index] : null; if (l) { this.router.navigateByUrl(l); } },
        onHover: (e: any, els: any[]) => { const t = e?.native?.target as HTMLElement | undefined; if (t) { t.style.cursor = els?.length ? 'pointer' : 'default'; } },
        plugins: {
          legend: {
            display: false              // Hide legend because labels are self-explanatory
          },
          tooltip: {
            backgroundColor: '#1e293b',  // Dark slate tooltip
            padding: 12,
            cornerRadius: 8,
            titleFont: { family: "'Segoe UI', sans-serif", size: 13, },
            bodyFont: { family: "'Segoe UI', sans-serif", size: 13 }
          }
        },
        scales: {
          x: {
            grid: {
              display: false            // No distracting vertical line patterns
            },
            ticks: {
              font: { family: "'Segoe UI', sans-serif", size: 13,},
              color: '#64748b'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,              // Integer increments only (no half-employees)
              font: { family: "'Segoe UI', sans-serif", size: 12 },
              color: '#94a3b8'
            },
            grid: {
              color: '#f1f5f9'          // Very soft horizontal rules
            }
          }
        }
      }
    });
  }




}
