import { style } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router, NavigationEnd  } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';
import { ElementRef, ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-main-sidebar',
  templateUrl: './main-sidebar.component.html',
  styleUrl: './main-sidebar.component.css'
})
export class MainSidebarComponent implements OnDestroy {

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;

  expiredDocumentsCount: number = 0;
  expiredDocuments: any[] = [];
  AllNotifications: any[] = [];
  notificationCount: number = 0;

  Documents: any[] = [];
  AssetNot: any[] = [];
  ResignationNot: any[] = [];
  AirticketNot: any[] = [];
  LeaveNot: any[] = [];
  GeneralReqNot: any[] = [];
  DocReqNot: any[] = [];
  LoanReqNot: any[] = [];
  AdvancesalaryReqNot: any[] = [];
  LateInEarlyOutReqNot: any[] = [];
  DelegationNot: any[] = [];
  DelegationResponseNot: any[] = [];

  hideButton = false;
  schemas: string[] = [];

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;

  selectedSchemaNameDisplay: string = '';
  selectedCompany: any;

  // ============================================================
  // MOBILE RESPONSIVE STATE FLAGS
  // ============================================================
  isMobileNotificationOpen: boolean = false;
  isMobileCompanyDropdownOpen: boolean = false;
  private bodyScrollLocked: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private EmployeeService: EmployeeService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private companyservice: CompanyRegistrationService,
  ) { }

  // ============================================================
  // SIDEBAR TOGGLE (FIXED FOR MOBILE)
  // ============================================================
  isMenuOpen: boolean = true;

  toggleSidebarMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    // Lock/unlock body scroll when sidebar is open on mobile
    if (window.innerWidth <= 991.98) {
      if (this.isMenuOpen) {
        this.lockBodyScroll();
      } else {
        this.unlockBodyScroll();
      }
    }

    // Close any open mobile dropdowns when toggling sidebar
    this.isMobileNotificationOpen = false;
    this.isMobileCompanyDropdownOpen = false;
  }

  onToolbarMenuToggle() {
    console.log('On toolbar toggled', this.isMenuOpen);
    this.isMenuOpen = !this.isMenuOpen;

    // ADDED: Close sidebar on mobile when navigating
    if (window.innerWidth <= 991.98 && this.isMenuOpen) {
      this.isMenuOpen = false;
      this.unlockBodyScroll();
    }
  }

  // ============================================================
  // BODY SCROLL LOCK HELPERS
  // ============================================================
  private lockBodyScroll(): void {
    if (!this.bodyScrollLocked) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sidebar-open');
      this.bodyScrollLocked = true;
    }
  }

  private unlockBodyScroll(): void {
    if (this.bodyScrollLocked) {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
      this.bodyScrollLocked = false;
    }
  }

  // ============================================================
  // CLICK OUTSIDE HANDLER (FIXED FOR MOBILE DROPDOWNS)
  // ============================================================
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    // Close desktop company dropdown when clicking outside
    if (
      this.dropdownContainer &&
      !this.dropdownContainer.nativeElement.contains(event.target)
    ) {
      this.isCompanyDropdownOpen = false;
      this.expandedSchemaIndex = -1;
    }

    // Close mobile notification dropdown when clicking outside
    const mobileNotiDropdown = document.getElementById('mobileNotificationDropdown');
    if (mobileNotiDropdown && !mobileNotiDropdown.contains(event.target as Node)) {
      this.isMobileNotificationOpen = false;
    }

    // Close mobile company dropdown when clicking outside
    const mobileCompanyDropdown = document.querySelector('.mobview .Company_pro');
    if (mobileCompanyDropdown && !mobileCompanyDropdown.contains(event.target as Node)) {
      this.isMobileCompanyDropdownOpen = false;
    }
  }

  // ============================================================
  // WINDOW RESIZE HANDLER
  // ============================================================
  @HostListener('window:resize')
  onWindowResize(): void {
    // If switching to desktop, close mobile-specific states
    if (window.innerWidth > 991.98) {
      this.isMobileNotificationOpen = false;
      this.isMobileCompanyDropdownOpen = false;
      this.unlockBodyScroll();
    }
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================
  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  // ============================================================
  // EXISTING CODE BELOW (UNCHANGED)
  // ============================================================

  ngOnInit(): void {
    this.selectedBranchIds = JSON.parse(
      localStorage.getItem('selectedBranchIds') || '[]'
    );

    this.selectedSchema = this.sessionService.getSelectedSchema();

    this.EmployeeService.selectedSchema$.subscribe(schema => {
      this.selectedSchema = schema;
      if (this.userDetailss?.length) {
        const selectedObj = this.userDetailss.find(
          (s: any) => s.schema_name === schema
        );
        this.selectedSchemaNameDisplay = selectedObj ? selectedObj.name : '';
      }
      if (schema) {
        this.loadAllNotifications(schema);
      }
    });

    this.EmployeeService.selectedBranches$.subscribe(branches => {
      this.selectedBranchIds = branches;
    });

    this.hideButton = this.EmployeeService.getHideButton();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
      }
    });

    const selectedSchema = this.authService.getSelectedSchema();
    const selectedSchemaId = this.authService.getSelectedSchemaId();

    if (selectedSchema && selectedSchemaId) {
      this.selectedSchema = selectedSchema;
    }

    this.userId = this.sessionService.getUserId();

    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        (userData: any) => {
          this.userDetails = userData;
          this.username = this.userDetails.username;
        },
        (error) => {
          console.error('Failed to fetch user details:', error);
        }
      );

      this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
          this.userDetailss = userData;
          this.schemas = userData.map(
            (schema: any) => schema.schema_name
          );
          if (this.selectedSchema) {
            const selectedObj = userData.find(
              (s: any) => s.schema_name === this.selectedSchema
            );
            this.selectedSchemaNameDisplay = selectedObj ? selectedObj.name : '';
          }
        },
        (error) => {
          console.error('Failed to fetch user schemas:', error);
        }
      );
    } else {
      console.error('User ID is null.');
    }
  }

  loadAllNotifications(selectedSchema: string): void {
    this.EmployeeService.selectedBranches$.subscribe(ids => {
      this.loadExpiredDocuments();
      this.loadLeaveNotifications();
      this.loadAssetNotifications();
      this.loadResignationNotifications();
      this.loadAirTicketNotifications();
      this.loadGeneralReqNotifications();
      this.loadDocumentReqNotifications();
      this.loadLoanReqNotifications();
      this.loadAdvancesalaryReqNotifications();
      this.loadLateinEarlyOutNotifications();
    });
  }

  loadAdvancesalaryReqNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getAdvancesalaryReqNotNew(selectedSchema, savedIds).subscribe({
        next: (Advsalreq: any[]) => {
          this.AdvancesalaryReqNot = (Advsalreq || []).map(item => ({
            ...item,
            type: 'advancesalaryrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading advance salary request notifications:', err);
          this.AdvancesalaryReqNot = [];
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
  }

  loadExpiredDocuments(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getExpiredDocumentsNew(selectedSchema, savedIds).subscribe({
        next: (expdocs: any[]) => {
          this.Documents = (expdocs || []).map(item => ({
            ...item,
            type: 'expdocument',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading exp document notifications:', err);
          this.Documents = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadResignationNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getResignationNotifyNew(selectedSchema, savedIds).subscribe({
        next: (resignations: any[]) => {
          this.ResignationNot = (resignations || []).map(item => ({
            ...item,
            type: 'resignationrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading resignation req notifications:', err);
          this.ResignationNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadGeneralReqNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getGeneralReqNotNew(selectedSchema, savedIds).subscribe({
        next: (generals: any[]) => {
          this.GeneralReqNot = (generals || []).map(item => ({
            ...item,
            type: 'generalrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading General req notifications:', err);
          this.GeneralReqNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadLoanReqNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getLoanReqNotNew(selectedSchema, savedIds).subscribe({
        next: (loan: any[]) => {
          this.LoanReqNot = (loan || []).map(item => ({
            ...item,
            type: 'loanrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading Loan notifications:', err);
          this.LoanReqNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadDocumentReqNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.companyservice.getDocumentNotNew(selectedSchema, savedIds).subscribe({
        next: (docs: any[]) => {
          this.DocReqNot = (docs || []).map(item => ({
            ...item,
            type: 'docrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading Document notifications:', err);
          this.DocReqNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadAssetNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.companyservice.getAssetNotNew(selectedSchema, savedIds).subscribe({
        next: (assets: any[]) => {
          this.AssetNot = (assets || []).map(item => ({
            ...item,
            type: 'assetrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading asset notifications:', err);
          this.AssetNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadAirTicketNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.companyservice.getAirticketNotNew(selectedSchema, savedIds).subscribe({
        next: (airtickets: any[]) => {
          this.AirticketNot = (airtickets || []).map(item => ({
            ...item,
            type: 'airticketrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading airticket notifications:', err);
          this.AirticketNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadLateinEarlyOutNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.companyservice.getLateInEarlyOutNotNew(selectedSchema, savedIds).subscribe({
        next: (loan: any[]) => {
          this.LateInEarlyOutReqNot = (loan || []).map(item => ({
            ...item,
            type: 'lateinearlyrequest',
            highlighted: false
          }));
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading loan request notifications:', err);
          this.LateInEarlyOutReqNot = [];
          this.combineNotifications();
        }
      });
    }
  }

  loadDelegationNotifications(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (selectedSchema) {
      this.EmployeeService.getDelegationNotifications(selectedSchema, savedIds).subscribe({
        next: (delegations: any) => {
          this.DelegationNot = Array.isArray(delegations)
            ? delegations
                .filter((item: any) => item.message?.toLowerCase().includes('delegated'))
                .map((item) => ({ ...item, type: 'delegated', highlighted: false }))
            : [];
          this.combineNotifications();
        },
        error: (err) => {
          console.error('❌ Error loading delegations request notifications:', err);
          this.DelegationNot = [];
          this.combineNotifications();
        },
      });
    }
  }

  loadDelegationResponseNotifications(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
    if (!selectedSchema) return;
    this.EmployeeService.getDelegationNotifications(selectedSchema, savedIds).subscribe({
      next: (res: any) => {
        this.DelegationResponseNot = Array.isArray(res)
          ? res
              .filter((item: any) => item.notification_type === 'delegation_response')
              .map(item => ({
                ...item,
                type: 'delegationres',
                highlighted: false
              }))
          : [];
        this.combineNotifications();
      },
      error: () => {
        this.DelegationResponseNot = [];
        this.combineNotifications();
      }
    });
  }

  combineNotifications(): void {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    const allItems = [
      ...this.Documents.map(item => ({ ...item, type: 'expdocument' as const, highlighted: false })),
      ...this.LeaveNot.map(item => ({ ...item, type: 'leave' as const, highlighted: false })),
      ...this.AssetNot.map(item => ({ ...item, type: 'assetrequest' as const, highlighted: false })),
      ...this.ResignationNot.map(item => ({ ...item, type: 'resignationrequest' as const, highlighted: false })),
      ...this.AirticketNot.map(item => ({ ...item, type: 'airticketrequest' as const, highlighted: false })),
      ...this.GeneralReqNot.map(item => ({ ...item, type: 'generalrequest' as const, highlighted: false })),
      ...this.DocReqNot.map(item => ({ ...item, type: 'docrequest' as const, highlighted: false })),
      ...this.LoanReqNot.map(item => ({ ...item, type: 'loanrequest' as const, highlighted: false })),
      ...this.AdvancesalaryReqNot.map(item => ({ ...item, type: 'advancesalaryrequest' as const, highlighted: false })),
      ...this.LateInEarlyOutReqNot.map(item => ({ ...item, type: 'lateinearlyrequest' as const, highlighted: false })),
    ];

    this.AllNotifications = allItems
      .filter(noti => {
        const notiKey = `${noti.type}-${noti.id}`;
        if (readNotifications[notiKey]) {
          return false;
        }
        return noti.is_read === false || noti.is_read == null;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    this.notificationCount = this.AllNotifications.length;
  }

  onNotificationClick(noti: any): void {
    noti.highlighted = true;
    setTimeout(() => (noti.highlighted = false), 1000);

    switch (noti.type) {
      case 'expdocument':
        this.router.navigate(['/main-sidebar/sub-sidebar/document-expired']);
        break;
      case 'leave':
        this.router.navigate(['/main-sidebar/leave-options/leave-approvals']);
        break;
      case 'assetrequest':
        this.router.navigate(['/main-sidebar/asset-options/asset-approval']);
        break;
      case 'resignationrequest':
        this.router.navigate(['/main-sidebar/sub-sidebar/resignation-request']);
        break;
      case 'airticketrequest':
        this.router.navigate(['/main-sidebar/asset-options/airticket-approvals']);
        break;
      case 'generalrequest':
        this.router.navigate(['/main-sidebar/general-sidebar/approvals']);
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
      case 'lateinearlyrequest':
        this.router.navigate(['/main-sidebar/attendance-sidebar/latein-earlyout-approvals']);
        break;
      default:
        return;
    }

    const notiKey = `${noti.type}-${noti.id}`;
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifications[notiKey] = true;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

    this.AllNotifications = this.AllNotifications.filter(n => n !== noti);
    this.notificationCount = this.AllNotifications.length;

    // Close mobile dropdown after clicking
    this.isMobileNotificationOpen = false;
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    const readNotifications = JSON.parse(
      localStorage.getItem('readNotifications') || '{}'
    );
    this.AllNotifications.forEach((noti: any) => {
      const key = `${noti.type}-${noti.id}`;
      readNotifications[key] = true;
    });
    localStorage.setItem(
      'readNotifications',
      JSON.stringify(readNotifications)
    );
    this.AllNotifications = [];
    this.notificationCount = 0;
  }

  isCompanyDropdownOpen = false;
  expandedSchemaIndex: number = -1;

  toggleSchema(index: number, event: Event): void {
    event.stopPropagation();
    this.expandedSchemaIndex = this.expandedSchemaIndex === index ? -1 : index;
  }

  selectedBranchIds: number[] = [];

  selectBranch(schemaName: string, branch: any, event: Event): void {
    event.stopPropagation();
    const selectedSchema = this.userDetailss.find((s: any) => s.schema_name === schemaName);
    this.selectedSchemaNameDisplay = selectedSchema.name;
    if (selectedSchema && branch) {
      this.isLoading = true;
      localStorage.setItem('selectedSchema', selectedSchema.schema_name);
      localStorage.setItem('selectedSchemaId', selectedSchema.id.toString());
      localStorage.setItem('selectedBranchId', branch.id.toString());
      localStorage.setItem('selectedBranchName', branch.branch_name);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  isLoadingEss: boolean = false;

  toggleBranchSelection(data: any, branch: any, event: Event): void {
    event.stopPropagation();
    this.isLoadingEss = true;
    const newSchema = data.schema_name;
    if (this.selectedSchema !== newSchema) {
      this.selectedBranchIds = [];
      this.selectedSchema = newSchema;
      localStorage.setItem('selectedSchema', this.selectedSchema ?? '');
    }
    const index = this.selectedBranchIds.indexOf(branch.id);
    if (index > -1) {
      this.selectedBranchIds.splice(index, 1);
    } else {
      this.selectedBranchIds.push(branch.id);
    }
    localStorage.setItem('selectedBranchIds', JSON.stringify(this.selectedBranchIds));
    setTimeout(() => {
      this.applySelection();
      this.isLoadingEss = false;
    }, 1000);
  }

  applySelection(): void {
    if (!this.selectedSchema) return;
    this.EmployeeService.updateSchemaAndBranches(
      this.selectedSchema,
      this.selectedBranchIds
    );
    this.isCompanyDropdownOpen = false;
    this.isMobileCompanyDropdownOpen = false;
  }

  showsidebar: boolean = true;

  showsidebarclick() {
    this.showsidebar = !this.showsidebar;
  }

  showboard: boolean = false;

  showbaordlist(): void {
    this.showboard = !this.showboard;
  }

  isNotificationModalOpen = false;
  selectedCompanyNotification: any = null;
  selectedBranchNotification: any = null;
  notificationList: any[] = [];

  openNotificationModal(company: any, event: Event): void {
    event.stopPropagation();
    this.selectedCompanyNotification = company;
    this.notificationList =
      company.notifications?.latest_notifications ||
      company.latest_notifications ||
      [];
    this.isNotificationModalOpen = true;
  }

  closeNotificationModal(): void {
    this.isNotificationModalOpen = false;
  }

  openBranchNotificationModal(branch: any, event: Event): void {
    event.stopPropagation();
    this.selectedBranchNotification = branch;
    this.notificationList = branch.notifications || [];
    this.isNotificationModalOpen = true;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      localStorage.removeItem('token');
      const currentUrl = window.location.href;
      const baseUrl = new URL(currentUrl);
      baseUrl.hostname = environment.apiBaseUrl;
      window.location.href = baseUrl.origin + '/login';
    }, (error: HttpErrorResponse) => {
      console.error('Logout failed:', error);
    });
  }

  onBranchNotificationClick(item: any): void {
    const key = `${item.type}-${item.id}`;
    const readNotifications = JSON.parse(
      localStorage.getItem('readNotifications') || '{}'
    );
    readNotifications[key] = true;
    localStorage.setItem(
      'readNotifications',
      JSON.stringify(readNotifications)
    );
    this.notificationList = this.notificationList.filter(
      x => x.id !== item.id
    );
    this.closeNotificationModal();
    switch (item.type) {
      case 'general':
        this.router.navigate(['/main-sidebar/general-sidebar/approvals']);
        break;
      case 'leave':
        this.router.navigate(['/main-sidebar/leave-options/leave-approvals']);
        break;
      case 'asset':
        this.router.navigate(['/main-sidebar/asset-options/asset-approval']);
        break;
      case 'loanrequest':
        this.router.navigate(['/main-sidebar/loan-sidebar/loan-approval']);
        break;
    }
  }

  getNotificationLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'expdocument': 'Document Expired',
      'resignationrequest': 'Resignation Request',
      'leave': 'Leave Request',
      'generalrequest': 'General Request',
      'docrequest': 'Document Request',
      'loanrequest': 'Loan Request',
      'assetrequest': 'Asset Request',
      'airticketrequest': 'AirTicket Request',
      'advancesalaryrequest': 'Advance Salary Request',
      'lateinearlyrequest': 'Late In / Early Out Request'
    };
    return labels[type] || 'Notification';
  }
}