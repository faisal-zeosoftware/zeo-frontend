import { style } from '@angular/animations';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router, NavigationEnd  } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { DepartmentServiceService } from '../department-master/department-service.service';


@Component({
  selector: 'app-dashboard-contents',
  templateUrl: './dashboard-contents.component.html',
  styleUrl: './dashboard-contents.component.css'
})
export class DashboardContentsComponent {


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
  


  constructor(private authService: AuthenticationService,
    private router: Router,
   private EmployeeService: EmployeeService,
   private route: ActivatedRoute,
   private sessionService: SessionService,
   private DepartmentServiceService: DepartmentServiceService ,
   ) { this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.isLoadingEss = false;
    }
  }); }

   ngOnInit(): void {

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
      const url = '/main-dashboard';
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

}
