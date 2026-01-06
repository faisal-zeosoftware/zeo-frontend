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
  // this.loadAssetNotifications(selectedSchema);
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
// loadAssetNotifications(selectedSchema: string): void {
//   this.EmployeeService.getAssetNotify(selectedSchema).subscribe({
//     next: (assets: any) => {
//       this.AssetNot = Array.isArray(assets)
//         ? assets
//             .filter((item: any) => item.message?.toLowerCase().includes('asset'))
//             .map((item) => ({ ...item, type: 'asset', highlighted: false }))
//         : [];
//       this.combineNotifications();
//     },
//     error: (err) => {
//       console.error('❌ Error loading Asset request notifications:', err);
//       this.AssetNot = [];
//       this.combineNotifications();
//     },
//   });
// }


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
    // ...this.AssetNot.map(item => ({ ...item, type: 'asset' as const, highlighted: false })),
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
    // case 'asset':
    //   this.router.navigate(['/main-sidebar/asset-options/asset-approval']);
    //   break;
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
  // For now, just keep it simple
}

selectSchema(event: any) {
  const selectedSchemaName = event.target.value;
  console.log("Selected schema name:", selectedSchemaName);

  if (!selectedSchemaName) {
      console.error("No schema selected.");
      return;
  }

  const selectedSchema = this.userDetailss.find((schema: any) => schema.schema_name === selectedSchemaName);
  if (!selectedSchema) {
      console.error("Schema not found.");
      return;
  }

  const selectedSchemaId = selectedSchema.id;
  console.log("Selected schema ID:", selectedSchemaId);
  this.isLoading = true;

  // Store the selected schema name and ID in localStorage
  localStorage.setItem('selectedSchema', selectedSchemaName);
  localStorage.setItem('selectedSchemaId', selectedSchemaId.toString());

  // Update the component state
  this.selectedSchema = selectedSchemaName;

  // Delay the URL redirection to ensure state is updated
  setTimeout(() => {
    this.isLoading = false; // Hide the loader
    this.isMenuOpen = true;

     this.router.navigate(['/main-sidebar/dashboard-contents']);
      window.location.reload();
    // this.router.navigate(['/main-sidebar/sub-sidebar/dashboard-contents']);
    // const url =` /main-sidebar/dashboard-contents`;
    //   window.location.href = url;
  }, 500); // Delay of 100ms to ensure localStorage is updated
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
