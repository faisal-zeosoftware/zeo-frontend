import { style } from '@angular/animations';
import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router, NavigationEnd  } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';

// import { DivControlService } from '../div-control.service';
// import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-main-sidebar',
  templateUrl: './main-sidebar.component.html',
  styleUrl: './main-sidebar.component.css'
})
export class MainSidebarComponent {
 
  expiredDocumentsCount: number = 0;
  expiredDocuments: any[] = []; // Assuming this array holds the list of expired documents
  AllNotifications: any[] = []; // Combined notifications

  notificationCount: number = 0; // number to show in the red badge


  Documents: any[] = []; // store expired document notifications
  // 🔔 Notification Arrays
  AssetNot: any[] = [];
  AirticketNot: any[] = [];
  LeaveNot: any[] = [];
  GeneralReqNot: any[] = [];
  DocReqNot: any[] = [];
  LoanReqNot: any[] = [];
  AdvancesalaryReqNot: any[] = [];

  hideButton = false;
  // constructor(public authService: AuthService) {}

  schemas: string[] = []; // Array to store schema names

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;

  selectedCompany: any; // Define this in your component to hold selected company details

  constructor(private authService: AuthenticationService,
     private router: Router,
    private EmployeeService: EmployeeService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
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

  // private updateMarginLeft() {
  //   this.marginLeftValue = this.isMenuOpen ? '200px' : '0px';
  // }

  ngOnInit(): void {

    // this.loadAllNotifications();
    this.selectedBranchIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

        this.selectedSchema = this.sessionService.getSelectedSchema();

    this.hideButton = this.EmployeeService.getHideButton();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Perform any actions on navigation end if needed
      }
    });
    // this.loadExpiredDocuments();

    const selectedSchema = this.authService.getSelectedSchema();
    const selectedSchemaId = this.authService.getSelectedSchemaId();

    const selectedStateLabel = localStorage.getItem('selectedSchemaStateLabel');
    console.log("Retrieved state label:", selectedStateLabel);
    
    if (selectedSchema) {
      this.loadAllNotifications(selectedSchema);
    }

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


 // ✅ Load all notification types
 loadAllNotifications(selectedSchema: string): void {
  this.loadExpiredDocuments(selectedSchema);    
  this.loadLeaveNotifications(selectedSchema); 
  this.loadGeneralReqNotifications(selectedSchema);
  this.loadDocumentReqNotifications(selectedSchema);
  this.loadLoanReqNotifications(selectedSchema);
  this.loadAdvancesalaryReqNotifications(selectedSchema);
  this.loadAssetNotifications(selectedSchema);
  this.loadAirTicketNotifications(selectedSchema);
} 


 // ✅ Expired Document Notifications
  loadExpiredDocuments(selectedSchema: string): void {
  this.EmployeeService.getExpiredDocuments(selectedSchema).subscribe({
    next: (docs: any[]) => {
      this.Documents = (docs || []).map(item => ({
        ...item,
        type: 'document',
        highlighted: false
      }));
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading document notifications:', err);
      this.Documents = [];
      this.combineNotifications();
    }
  });
}

// ✅ Leave Notifications
loadLeaveNotifications(selectedSchema: string): void {
  this.EmployeeService.getLeaveNotify(selectedSchema).subscribe({
    next: (leaves: any[]) => {
      this.LeaveNot = (leaves || []).map(item => ({
        ...item,
        type: 'leave',
        highlighted: false
      }));
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading leave notifications:', err);
      this.LeaveNot = [];
      this.combineNotifications();
    }
  });
}



// ✅ Asset Notifications
loadAssetNotifications(selectedSchema: string): void {
  this.EmployeeService.getAssetNotify(selectedSchema).subscribe({
    next: (assets: any) => {
      this.AssetNot = Array.isArray(assets)
        ? assets
            .filter((item: any) => item.message?.toLowerCase().includes('asset'))
            .map((item) => ({ ...item, type: 'asset', highlighted: false }))
        : [];
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading Asset request notifications:', err);
      this.AssetNot = [];
      this.combineNotifications();
    },
  });
}


// ✅ AirTicket Notifications
loadAirTicketNotifications(selectedSchema: string): void {
  this.EmployeeService.getAirTicketNotify(selectedSchema).subscribe({
    next: (airtickets: any) => {
      this.AirticketNot = Array.isArray(airtickets)
        ? airtickets
            .filter((item: any) => item.message?.toLowerCase().includes('airticket'))
            .map((item) => ({ ...item, type: 'airticket', highlighted: false }))
        : [];
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading Airticket request notifications:', err);
      this.AirticketNot = [];
      this.combineNotifications();
    },
  });
}


// ✅ General Request Notifications
loadGeneralReqNotifications(selectedSchema: string): void {
  this.EmployeeService.getLeaveGeneralReqNot(selectedSchema).subscribe({
    next: (leaves: any) => {
      this.GeneralReqNot = Array.isArray(leaves)
        ? leaves
            .filter((item: any) => item.message?.toLowerCase().includes('generalrequest'))
            .map((item) => ({ ...item, type: 'general', highlighted: false }))
        : [];
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading general request notifications:', err);
      this.GeneralReqNot = [];
      this.combineNotifications();
    },
  });
}

// ✅ Document Request Notifications
loadDocumentReqNotifications(selectedSchema: string): void {
  this.EmployeeService.getDocumentReqNot(selectedSchema).subscribe({
    next: (docs: any) => {
      this.DocReqNot = Array.isArray(docs)
        ? docs
            .filter((item: any) => item.message?.toLowerCase().includes('docrequest'))
            .map((item) => ({ ...item, type: 'docrequest', highlighted: false }))
        : [];
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading document request notifications:', err);
      this.DocReqNot = [];
      this.combineNotifications();
    },
  });
}

// ✅ Loan Request Notifications
loadLoanReqNotifications(selectedSchema: string): void {
  this.EmployeeService.getLoanReqNot(selectedSchema).subscribe({
    next: (loan: any[]) => {
      this.LoanReqNot = (loan || []).map(item => ({
        ...item,
        type: 'loanrequest',
        highlighted: false
      }));
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading loan request notifications:', err);
      this.LoanReqNot = [];
      this.combineNotifications();
    }
  });
}

// ✅ Advance Salary Request Notifications
loadAdvancesalaryReqNotifications(selectedSchema: string): void {
  this.EmployeeService.getAdvancesalaryReqNot(selectedSchema).subscribe({
    next: (loan: any) => {
      this.AdvancesalaryReqNot = Array.isArray(loan)
        ? loan
            .filter((item: any) => item.message?.toLowerCase().includes('advancesalaryrequest'))
            .map((item) => ({ ...item, type: 'advancesalaryrequest', highlighted: false }))
        : [];
      this.combineNotifications();
    },
    error: (err) => {
      console.error('❌ Error loading advance salary request notifications:', err);
      this.AdvancesalaryReqNot = [];
      this.combineNotifications();
    },
  });
}

combineNotifications(): void {
  // Load previously read notifications from localStorage
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');

  const allItems = [
    ...this.Documents.map(item => ({ ...item, type: 'document' as const, highlighted: false })),
    ...this.LeaveNot.map(item => ({ ...item, type: 'leave' as const, highlighted: false })),
    ...this.AssetNot.map(item => ({ ...item, type: 'asset' as const, highlighted: false })),
    ...this.AirticketNot.map(item => ({ ...item, type: 'airticket' as const, highlighted: false })),
    ...this.GeneralReqNot.map(item => ({ ...item, type: 'general' as const, highlighted: false })),
    ...this.DocReqNot.map(item => ({ ...item, type: 'docrequest' as const, highlighted: false })),
    ...this.LoanReqNot.map(item => ({ ...item, type: 'loanrequest' as const, highlighted: false })),
    ...this.AdvancesalaryReqNot.map(item => ({ ...item, type: 'advancesalaryrequest' as const, highlighted: false }))
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
// ✅ Handle click with flash + redirect

onNotificationClick(noti: any): void {
  // Flash effect
  noti.highlighted = true;
  setTimeout(() => (noti.highlighted = false), 1000);

  // Navigate
  switch (noti.type) {
    case 'document':
      this.router.navigate(['/main-sidebar/sub-sidebar/document-expired']);
      break;
    case 'leave':
      this.router.navigate(['/main-sidebar/leave-options/leave-approvals']);
      break;
    case 'asset':
      this.router.navigate(['/main-sidebar/asset-options/asset-approval']);
      break;
    case 'airticket':
      this.router.navigate(['/main-sidebar/asset-options/airticket-approvals']);
      break;
    case 'general':
      this.router.navigate(['/main-sidebar/sub-sidebar/approvals']);
      break;
    case 'docrequest':
      this.router.navigate(['/main-sidebar/settings/document-request-approval']);
      break;
    case 'loanrequest':
      this.router.navigate(['/main-sidebar/loan-sidebar/loan-approval']);
      break;
    case 'advancesalaryrequest':
      this.router.navigate(['/main-sidebar/salary-options/advance-salary-approvals']);
      break;
    default:
      return;
  }

  // Unique key for this notification (type + id) because IDs may overlap across types
  const notiKey = `${noti.type}-${noti.id}`;

  // Save to localStorage as "read"
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
  readNotifications[notiKey] = true;
  localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

  // Remove from UI
  this.AllNotifications = this.AllNotifications.filter(n => n !== noti);
  this.notificationCount = this.AllNotifications.length;
}


// Optional: Clean up old entries (run once on app start)
private cleanupOldReadNotifications(): void {
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // You'd need to store timestamp too — or skip if not needed
}

isCompanyDropdownOpen = false;
expandedSchemaIndex: number = -1;

toggleSchema(index: number, event: Event): void {
  event.stopPropagation();
  // Toggle logic: click same to close, click new to open
  this.expandedSchemaIndex = this.expandedSchemaIndex === index ? -1 : index;
}

selectedBranchIds: number[] = [];

// Updated function to accept both schema name and branch object
selectBranch(schemaName: string, branch: any, event: Event): void {
  event.stopPropagation();
  
  const selectedSchema = this.userDetailss.find((s: any) => s.schema_name === schemaName);
  
  if (selectedSchema && branch) {
    this.isLoading = true;

    // Store Schema Details
    localStorage.setItem('selectedSchema', selectedSchema.schema_name);
    localStorage.setItem('selectedSchemaId', selectedSchema.id.toString());

    // Store Branch Details (Based on your JSON structure)
    localStorage.setItem('selectedBranchId', branch.id.toString());
    localStorage.setItem('selectedBranchName', branch.branch_name);

    // Provide feedback and refresh to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}


// Add selectedSchema variable if not already present
toggleBranchSelection(data: any, branch: any, event: Event): void {
  event.stopPropagation();
  
  const clickedSchema = data.schema_name;
  
  // 1. If clicking a branch from a different schema, 
  // clear ALL old selections first
  const newSchema = data.schema_name;
  
  if (this.selectedSchema !== newSchema) {
    this.selectedBranchIds = []; 
    this.selectedSchema = newSchema; 
    
    // --- FIX APPLIED HERE ---
    localStorage.setItem('selectedSchema', this.selectedSchema ?? '');
  }

  // 2. Toggle the branch ID for the now-active schema
  const index = this.selectedBranchIds.indexOf(branch.id);
  if (index > -1) {
    this.selectedBranchIds.splice(index, 1);
  } else {
    this.selectedBranchIds.push(branch.id);
  }

  // 3. Persist and apply
  localStorage.setItem('selectedBranchIds', JSON.stringify(this.selectedBranchIds));
  this.applySelection();
}
applySelection(): void {
  if (!this.selectedSchema) return;

  // Broadcast both Schema and Branches to the service
  // We add a new method in the service to handle the schema change too
  this.EmployeeService.updateSchemaAndBranches(this.selectedSchema, this.selectedBranchIds);

  this.isCompanyDropdownOpen = false;
}




showsidebar: boolean = true;

showsidebarclick() {
  this.showsidebar = !this.showsidebar;
  
}




  showboard :boolean=false;

  
  showbaordlist():void{

  this.showboard = !this.showboard; 

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



  
}
