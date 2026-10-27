import { FlowService } from '../zeo-flow/flow.service';   // v1.29.0
import { ZLocation, ZLocationService, ZLocationState } from '../shared-ui/z-location.service';   // v1.30.0
import { ZeoCloudService } from '../shared-ui/zeo-cloud.service';
import { style } from '@angular/animations';
import { Component, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { CompanyRegistrationService } from '../company-registration.service';
import { ZListService } from '../shared-ui/z-list.service';

import { visibleGroups, suiteForUrl } from '../shared-ui/z-module-menu.component';
import { AppSuite, ZSuiteService } from '../shared-ui/z-suite.service';   // v1.20.0
import { SUITES } from '../shared-ui/menu-config';
import { appForUrl, dashKeep, isReportUrl, menuPicked, preferApp, takeMenuPicked } from '../shared-ui/menu-config';
import { APP_VERSION } from '../shared-ui/version';
import { ZRecordService } from '../shared-ui/z-record.service';
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
  FlowNot: any[] = [];   // v1.29.0 automation (workflow rules, approvals)
  DelegationNot: any[] = [];
  DelegationResponseNot: any[] = [];

  hideButton = false;
  schemas: string[] = [];

  userId: number | null | undefined;
  userDetails: any;
  displayName = '';   // v1.62.0 ui
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
    private zlist: ZListService,
    private zrec: ZRecordService,
    private suites: ZSuiteService,
    private cloud: ZeoCloudService,
    private flow: FlowService,   // v1.29.0
    private zloc: ZLocationService,   // v1.30.0 location level
  ) {
    this.zloc.state$.subscribe(st => { this.locState = st; this.locGroups = this.zloc.groups(); });
    this.zloc.selected$.subscribe(ids => (this.locSelected = ids));
    this.zloc.current$.subscribe(id => (this.locCurrent = id));
    // v1.20.0: the main menu shows the modules of one app (HRMS, Projects or Settings)
    this.suites.suite$.subscribe(s => { this.suite = s; this.buildMenu(); });
    // v1.21.0: only the apps active in the company (Settings → Apps); an app switched off moves the user to an active one
    this.suites.active$.subscribe(a => { if (a) { this.buildMenu(); this.keepActiveSuite(); } });
    // v1.23.0 ZEO Cloud: Subscription / Security for the account owner
    this.cloud.status$.subscribe(() => this.buildMenu());
    this.cloud.load();
  }

  private keepActiveSuite(): void {
    if (this.suites.isActive(this.suite)) { return; }
    const next = SUITES.find(x => x.key !== 'settings' && this.suites.isActive(x.key))?.key || 'settings';
    this.suites.set(next);
    const g = visibleGroups(this.menuAccess, false, next)[0];
    const link = next === 'settings' ? '/main-sidebar/settings/home' : g?.apps[0]?.link;
    if (link && suiteForUrl(this.router.url) !== next) { this.router.navigateByUrl(link); }
  }
  suite: AppSuite = 'hrms';
  get suiteName(): string { return SUITES.find(x => x.key === this.suite)?.label || 'HRMS'; }

  // ---------- main menu (shared config, grouped, by user rights) ----------
  private menuAccess: { admin: boolean; codes: Set<string> } | null = null;
  get todo$() { return this.zrec.todoCounts$; }
  get inbox$() { return this.zrec.inboxUnread$; }   // v1.45.0
  menuGroups: ReturnType<typeof visibleGroups> = visibleGroups(null);
  currentAppKey = '';
  appVersion = APP_VERSION;

  buildMenu(): void {
    this.menuGroups = visibleGroups(this.menuAccess, this.hideButton, this.suite);
    this.markApp();
  }

  /** v1.40.1: decided before the new page builds its menu – (1) a report opened from the Home dashboard keeps the Home
   *  menu (no Reports sidebar), (2) a page listed in two apps (Leave → "My leave" is also in Self service) keeps the app
   *  the user is in. A pick in the main menu or the app launcher goes to that app as before. */
  private beforeNav(url: string): void {
    const picked = takeMenuPicked();
    if (!isReportUrl(url) || picked) { dashKeep(null); }
    else if (this.currentAppKey === 'home') { dashKeep('home'); }
    preferApp(picked ? '' : this.currentAppKey);
  }

  private markApp(): void {
    this.currentAppKey = appForUrl(this.router.url)?.key || (this.router.url.includes('dashboard-contents') ? 'home' : this.router.url.includes('manager-dashboard') ? 'mgr' : '');
    // v1.20.0: a page of another app switches the menu to that app; shared pages (Calendar, My To-do) keep it
    const s = suiteForUrl(this.router.url);
    if (s && this.suites && s !== this.suites.suite) { this.suites.set(s); }
    if (this.suites && this.currentAppKey) { this.suites.touch(this.currentAppKey); }
    preferApp(this.currentAppKey);   // v1.40.1
    if (this.suites) { this.suites.loadActive(); if (this.suites.active$.value) { this.keepActiveSuite(); } }
  }

  // ============================================================
  // SIDEBAR TOGGLE (FIXED FOR MOBILE)
  // ============================================================
  // v1.7.0: the main menu starts folded (icons only); the fold / unfold button keeps the user's choice
  // v1.15.1: the choice is remembered per user (key zeo-main-menu:<user id>); folded icons show their name in a tooltip.
  isMenuOpen: boolean = window.innerWidth > 991.98 && (() => { try { return localStorage.getItem('zeo-main-menu') === 'open'; } catch { return false; } })();

  private foldKey(): string {
    let uid: number | null = null;
    try { uid = this.sessionService.getUserId(); } catch { uid = null; }
    return uid ? `zeo-main-menu:${uid}` : 'zeo-main-menu';
  }

  private restoreFold(): void {
    if (window.innerWidth <= 991.98) { return; }
    try {
      const v = localStorage.getItem(this.foldKey()) ?? localStorage.getItem('zeo-main-menu');
      this.isMenuOpen = v === 'open';
    } catch { /* storage off: keep the default (folded) */ }
  }

  toggleFold(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.hideTip();
    try { localStorage.setItem(this.foldKey(), this.isMenuOpen ? 'open' : 'folded'); } catch { /* storage off */ }
  }

  /** A module was picked: its own menu opens, so the main menu folds (mobile: the drawer closes).
   *  v1.15.1: folding here is not saved – the user's fold / unfold choice stays for the next visit. */
  modulePicked(): void {
    menuPicked();   // v1.40.1
    this.hideTip();
    if (this.isMenuOpen) { this.isMenuOpen = false; this.unlockBodyScroll(); }
  }

  // ---------- v1.15.1: name tooltip for the folded (icons only) menu – mouse and keyboard ----------
  tip: { text: string; top: number; left: number | null; right: number | null } | null = null;

  showTip(ev: Event, text: string): void {
    if (this.isMenuOpen) { this.tip = null; return; }
    const el = ev.currentTarget as HTMLElement | null;
    if (!el) { return; }
    const r = el.getBoundingClientRect();
    const rtl = (document.documentElement.getAttribute('dir') || document.dir || '').toLowerCase() === 'rtl';
    // left-to-right: the menu is on the left, the tip opens to its right; right-to-left (Arabic): the opposite side
    this.tip = { text, top: Math.round(r.top + r.height / 2), left: rtl ? null : Math.round(r.right + 10), right: rtl ? Math.round(window.innerWidth - r.left + 10) : null };
  }

  hideTip(): void { this.tip = null; }

  @HostListener('document:keydown.escape', ['$event']) escTip(ev?: KeyboardEvent): void { this.hideTip(); this.escCloseDialog(ev); }

  /** v1.56.1 release checklist (§7 "Close the pop-up any way"): Escape closes the top pop-up of every screen. Material dialogs close
   *  themselves; for the screens' own pop-ups (ex-modal, zp-dialog, Bootstrap-style modals …) Escape presses their Cancel / Close / ×
   *  button – nothing is saved and the screen's own close logic (reload of the list) runs. */
  private escCloseDialog(ev?: KeyboardEvent): void {
    if (ev?.defaultPrevented) { return; }
    if (document.querySelector('.cdk-overlay-container mat-dialog-container, .cdk-overlay-container .mat-mdc-select-panel, .cdk-overlay-container .mat-mdc-autocomplete-panel')) { return; }
    // v1.57.0: + .hr-modal (Performance / Recruitment / Learning pages: form, prompt and preview pop-ups)
    const sel = '.ex-modal, .zp-dialog, .zk-dialog, .z-dialog, .modal.show, .modal.d-block, .modal[style*="display: block"], [role=dialog], .popup-overlay, .modal-overlay, .dialog-overlay, .hr-modal';
    const shown = Array.from(document.querySelectorAll<HTMLElement>(sel)).filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
      .filter(e => getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none')
      .filter(e => !e.closest('[data-tour-card]'));   // v1.62.0: the guided-tour card closes itself (z-tour); Escape goes to the pop-up under it
    const top = shown[shown.length - 1];
    if (!top) { return; }
    const btns = Array.from(top.querySelectorAll<HTMLElement>('button, a.btn, [role=button]')).filter(b => b.offsetParent !== null && !(b as HTMLButtonElement).disabled);
    const txt = (b: HTMLElement) => (b.innerText || '').trim();
    const pick = btns.find(b => /^(cancel|إلغاء)$/i.test(txt(b))) || btns.find(b => /^(close|إغلاق)$/i.test(txt(b)))
      || btns.find(b => /^[×✕✖xX]$|^close$/.test(txt(b)) || /close|cancel|إغلاق/i.test(b.getAttribute('aria-label') || '') || /(^|[\s-])close([\s-]|$)/.test(b.className || ''));
    if (pick) { pick.click(); ev?.preventDefault(); }
  }

  /** v1.15.1: distinct icons – Organisation and Projects both used account_tree; 'monitoring' is not in the Material Icons font. */
  private static readonly ICON_FIX: Record<string, Record<string, string>> = {
    orgstructure: { account_tree: 'corporate_fare' },
    projects: { account_tree: 'view_kanban' },
    ceo: { monitoring: 'analytics' },
  };

  iconOf(app: { key: string; icon: string }): string {
    return MainSidebarComponent.ICON_FIX[app.key]?.[app.icon] || app.icon;
  }

  /** v1.15.1: the Settings app opens the Settings home page (not the first settings screen, Location Master). */
  appLink(a: { app: { key: string }; link: string }): string {
    return a.app.key === 'settings' ? '/main-sidebar/settings/home' : a.link;
  }

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
    this.restoreFold();   // v1.15.1: per-user fold / unfold choice
    this.zlist.permissions().subscribe(a => { this.menuAccess = a; this.buildMenu(); });
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
      this.zloc.load(schema, true).subscribe();   // v1.30.0: the locations of this company
    });

    this.EmployeeService.selectedBranches$.subscribe(branches => {
      this.selectedBranchIds = branches;
    });
    this.zloc.load(this.selectedSchema).subscribe();

    this.hideButton = this.EmployeeService.getHideButton();
    this.buildMenu();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) { this.beforeNav(event.url); }   // v1.40.1
      if (event instanceof NavigationEnd) {
        this.markApp();
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
          // v1.62.0 ui: the top bar shows the person's name, not the sign-in name (gdis_admin)
          this.zlist.userNames().subscribe(l => { const me = (l || []).find(u => u.username === userData?.username); this.displayName = me?.name || ''; });
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
      this.loadFlowNotifications();
    });
  }

  /** v1.29.0: notifications written by the automation rules and the approval engine (any app). */
  loadFlowNotifications(): void {
    this.flow.get('notifications/', { unread: 1 }).then((r: any) => {
      this.FlowNot = (r?.rows || []).map((n: any) => ({ ...n, message: n.title ? `${n.title} – ${n.message}` : n.message, is_read: n.is_read }));
      this.combineNotifications();
    }).catch(() => { this.FlowNot = []; this.combineNotifications(); });
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
      ...this.FlowNot.map(item => ({ ...item, type: 'automation' as const, highlighted: false })),   // v1.29.0
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

  private markNotificationRead(noti: any): void {
    const notiKey = `${noti.type}-${noti.id}`;
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifications[notiKey] = true;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));

    this.AllNotifications = this.AllNotifications.filter(n => n !== noti);
    this.notificationCount = this.AllNotifications.length;

    // Close mobile dropdown after clicking
    this.isMobileNotificationOpen = false;
  }

  onNotificationClick(noti: any): void {
    noti.highlighted = true;
    setTimeout(() => (noti.highlighted = false), 1000);

    // v1.28.1: an employee (self-service login) has no approvals pages – their notifications ("your request was
    // approved") open their own request lists in Self service instead of an empty approvals screen
    if (this.userDetails?.is_ess && !this.userDetails?.is_superuser) {
      const ess: Record<string, string> = {
        leave: '/main-sidebar/self-service/leave', expdocument: '/main-sidebar/self-service/documents', docrequest: '/main-sidebar/self-service/documents',
        generalrequest: '/main-sidebar/self-service/claims', loanrequest: '/main-sidebar/self-service/claims', advancesalaryrequest: '/main-sidebar/self-service/claims',
        airticketrequest: '/main-sidebar/self-service/claims', assetrequest: '/main-sidebar/self-service/claims', resignationrequest: '/main-sidebar/self-service/home',
        lateinearlyrequest: '/main-sidebar/attendance-plus/my-attendance',
      };
      this.markNotificationRead(noti);
      this.router.navigateByUrl(ess[noti.type] || '/main-sidebar/self-service/home');
      return;
    }

    if (noti.type === 'automation') {   // v1.29.0: the rule says where to go (the record, or the approvals page)
      this.flow.post('notifications/', { ids: [noti.id] }).catch(() => { /* ignore */ });
      this.markNotificationRead(noti);
      this.router.navigateByUrl(noti.link || '/main-sidebar/automation/approvals');
      return;
    }
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
        this.router.navigate(['/main-sidebar/air-ticket-options/airticket-approvals']);   // v1.15.1: was under asset-options (no such page)
        break;
      case 'generalrequest':
        this.router.navigate(['/main-sidebar/general-sidebar/approvals']);
        break;
      case 'docrequest':
        this.router.navigate(['/main-sidebar/general-sidebar/document-request-approval']);   // v1.15.1: was under settings (no such page)
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

    this.markNotificationRead(noti);
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
    // v1.26.0: a click on another company's name opens that company with all its branches at once (before it only
    // unfolded the branch list and a branch had to be ticked – about 12 s for a switch); the arrow still only unfolds
    const data = this.userDetailss?.[index];
    const onArrow = !!(event.target as HTMLElement)?.closest?.('mat-icon');
    if (data && !onArrow && data.schema_name !== this.selectedSchema) {
      this.selectedSchema = data.schema_name;
      this.selectedBranchIds = (data.branches || []).map((b: any) => b.id);
      localStorage.setItem('selectedSchema', this.selectedSchema ?? '');
      localStorage.setItem('selectedBranchIds', JSON.stringify(this.selectedBranchIds));
      this.expandedSchemaIndex = index;
      this.applySelection();
      return;
    }
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
  private applyTimer: any = null;

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
    clearTimeout(this.applyTimer);   // v1.26.0: one apply after the last tick (was a fixed 1 s wait per tick)
    this.applyTimer = setTimeout(() => {
      this.applySelection();
      this.isLoadingEss = false;
    }, 400);
  }

  applySelection(): void {
    if (!this.selectedSchema) return;
    this.EmployeeService.updateSchemaAndBranches(
      this.selectedSchema,
      this.selectedBranchIds
    );
    this.isCompanyDropdownOpen = false;
    this.isMobileCompanyDropdownOpen = false;
    this.reopenPage();
  }

  /** v1.28.1: after a company / branch change the open page is re-created (same URL, no full reload) so lists, forms
   *  and dropdowns show the new selection at once – before, most pages read the selection only when they opened. */
  private reopenPage(): void {
    const url = this.router.url;
    if (!url || url.startsWith('/login')) { return; }
    this.router.navigateByUrl('/main-sidebar/_reload', { skipLocationChange: true }).then(() => this.router.navigateByUrl(url));
  }

  // ---------------------------------------------------------------- v1.30.0 location level switcher
  locState: ZLocationState = { enabled: false, required: false, numbering: false, restrict: false, label: 'Location', locations: [], allowed: null, current: null, own: null };
  locGroups: { branch_id: number | null; branch_name: string; items: ZLocation[] }[] = [];
  locSelected: number[] = [];
  locCurrent: number | null = null;

  locToggle(l: ZLocation, ev: Event): void {
    ev.stopPropagation();
    this.zloc.toggle(l.id);
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => this.reopenPage(), 400);
  }

  locSetCurrent(l: ZLocation, ev: Event): void {
    ev.stopPropagation();
    this.zloc.setCurrent(l.id);
    if (this.locSelected.length && !this.locSelected.includes(l.id)) { this.zloc.toggle(l.id); }
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => this.reopenPage(), 400);
  }

  locClear(ev: Event): void {
    ev.stopPropagation();
    this.zloc.clear();
    clearTimeout(this.applyTimer);
    this.applyTimer = setTimeout(() => this.reopenPage(), 400);
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
      'lateinearlyrequest': 'Late In / Early Out Request',
      'automation': 'Automation'
    };
    return labels[type] || 'Notification';
  }
}