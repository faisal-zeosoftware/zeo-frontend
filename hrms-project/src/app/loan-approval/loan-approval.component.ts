import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { environment } from '../../environments/environment';
import { DesignationService } from '../designation-master/designation.service';
import { combineLatest, Subscription } from 'rxjs';
import { UserMasterService } from '../user-master/user-master.service';

@Component({
  selector: 'app-loan-approval',
  templateUrl: './loan-approval.component.html',
  styleUrl: './loan-approval.component.css'
})
export class LoanApprovalComponent {

  private dataSubscription?: Subscription;

  @ViewChild('bottomOfPage') bottomOfPage!: ElementRef;

  private apiUrl = `${environment.apiBaseUrl}`;

  schemas: string[] = [];

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;

  allApprovals: any[] = [];      // Master data from API (never modified directly)
  filteredApprovals: any[] = []; // Display data after search/filter

  RejectionResons: any[] = [];

  hasAddPermission: boolean = false;
  hasViewPermission: boolean = false;

  Employees: any[] = [];

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private EmployeeService: EmployeeService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private leaveService: LeaveService,
    private userService: UserMasterService,
    private DesignationService: DesignationService,
  ) { }

  ngOnInit(): void {

    // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);
      }
    });

    // Listen for sidebar changes so the dropdown updates instantly
    this.EmployeeService.selectedBranches$.subscribe(ids => {
      this.loadApprovalLevelLoan();
    });

    this.selectedSchema = this.sessionService.getSelectedSchema();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Perform any actions on navigation end if needed
      }
    });

    this.loadUsers();

    const selectedSchema = this.authService.getSelectedSchema();
    const selectedSchemaId = this.authService.getSelectedSchemaId();

    if (selectedSchema) {
      this.LoadLeaveRejectionReasons(selectedSchema);
      this.LoadEmployee(selectedSchema);
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
        async (userData: any) => {
          this.userDetails = userData;
          this.username = this.userDetails.username;

          console.log('User ID:', this.userId);
          console.log('User Details:', this.userDetails);

          let isSuperuser = this.userDetails.is_superuser || false;
          const selectedSchema = this.authService.getSelectedSchema();
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }

          if (isSuperuser) {
            console.log('User is superuser or ESS user');
            this.hasViewPermission = true;
            this.hasAddPermission = true;
          } else {
            console.log('User is not superuser');

            const selectedSchema = this.authService.getSelectedSchema();
            if (selectedSchema) {
              try {
                const permissionsData: any = await this.DesignationService.getDesignationsPermission(selectedSchema).toPromise();
                console.log('Permissions data:', permissionsData);

                if (Array.isArray(permissionsData) && permissionsData.length > 0) {
                  const firstItem = permissionsData[0];

                  if (firstItem.is_superuser) {
                    console.log('User is superuser according to permissions API');
                    this.hasViewPermission = true;
                    this.hasAddPermission = true;
                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);

                    this.hasAddPermission = this.checkGroupPermission('add_loanapproval', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasViewPermission = this.checkGroupPermission('view_loanapproval', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);
                  } else {
                    console.error('No groups found in data or groups array is empty.', firstItem);
                  }
                } else {
                  console.error('Permissions data is not an array or is empty.', permissionsData);
                }
              } catch (error) {
                console.error('Error fetching permissions:', error);
              }
            } else {
              console.error('No schema selected.');
            }
          }
        },
        (error) => {
          console.error('Failed to fetch user details:', error);
        }
      );

      this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
          this.userDetailss = userData;
          this.schemas = userData.map((schema: any) => schema.schema_name);
          console.log('scehmas-de', userData)
        },
        (error) => {
          console.error('Failed to fetch user schemas:', error);
        }
      );
    } else {
      console.error('User ID is null.');
    }
  }

  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

  LoadEmployee(selectedSchema: string) {
    this.leaveService.getEmployee(selectedSchema).subscribe(
      (data: any) => {
        this.Employees = data;
        console.log('employee:', this.Employees);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  loadUsers(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      this.userService.getApprover(selectedSchema).subscribe(
        (result: any) => {
          this.Users = result;
        }
      );
    }
  }

  loadApprovalLevelLoan(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema)
    if (selectedSchema) {
      this.leaveService.getAllLoanRequest(selectedSchema).subscribe(
        (result: any) => {
          this.Loanreq = result;
          console.log("Leave Requests:", this.Loanreq);
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  selectedApproval: any = null;
  isAddFieldsModalOpen: boolean = false;
  note: string = '';

  selectedaprovaldetalis(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/?schema=${selectedSchema}`;
      this.EmployeeService.getApprovalDetailsLeave(apiUrl).subscribe(
        (response: any) => {
          this.selectedApproval = response;
          this.isAddFieldsModalOpen = true;
          console.log('detalis', this.selectedApproval)
        },
        (error) => {
          console.error('Error fetching approval details:', error);
        }
      );
    }
  }

  scrollToBottom(): void {
    this.bottomOfPage.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  approveApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/approve/?schema=${selectedSchema}`;
      const approvalData = {
        note: this.note,
        status: 'Approved',
      };
      this.EmployeeService.approveApprovalRequestLeave(apiUrl, approvalData).subscribe(
        (response: any) => {
          console.log('Approval status changed to Approved:', response);

          // Update master data
          const approvalIndex = this.allApprovals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.allApprovals[approvalIndex].status = 'Approved';
          }
          this.applyFilters();

          if (this.selectedApproval) {
            this.selectedApproval.status = 'Approved';
          }
          this.isAddFieldsModalOpen = false;
        },
        (error) => {
          console.error('Error approving the approval request:', error);
        }
      );
    }
  }

  closemarketModal() {
    this.isAddFieldsModalOpen = false;
  }

  rejection_reason: string = '';
  showRejectionReason: boolean = false;

  rejectApproval(approvalId: number): void {
    this.showRejectionReason = true;
  }

  confirmRejection(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const approvalData = {
      note: this.note,
      status: 'Rejected',
      rejection_reason: this.rejection_reason,
    };
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${approvalId}/reject/?schema=${selectedSchema}`;
      this.EmployeeService.rejectApprovalRequestLeave(apiUrl, approvalData).subscribe(
        (response: any) => {
          console.log('Approval status changed to Rejected:', response);

          // Update master data
          const approvalIndex = this.allApprovals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.allApprovals[approvalIndex].status = 'Rejected';
          }
          this.applyFilters();

          if (this.selectedApproval) {
            this.selectedApproval.status = 'Rejected';
          }
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

  selectedEmployeeId: string = '';
  leaveHistory: any[] = [];

  getLeaveHistory(): void {
    if (!this.selectedEmployeeId || !this.selectedSchema) {
      console.warn('Employee or schema not selected.');
      return;
    }
    this.leaveService.getLeaveRequestHistory(this.selectedEmployeeId, this.selectedSchema).subscribe(
      (data: any) => {
        this.leaveHistory = data;
        console.log('Leave History:', this.leaveHistory);
      },
      (error: any) => {
        console.error('Error fetching leave history:', error);
      }
    );
  }

  /////////////////////////////////// Delegation Model //////////////////////////////////

  delegationData: any = null;
  isDelegationModalOpen: boolean = false;

  deligators: any[] = [];
  delegateTos: any[] = [];
  requests: any[] = [];
  Loanreq: any[] = [];
  Users: any[] = [];

  delegationForm: any = {
    reason: '',
    deligator: null,
    deligate_to: null,
    request: null,
    created_by: null
  };

  isResponseModalOpen = false;
  delegationResponse = '';
  selectedDelegationId: number | null = null;

  openResponseModal(delegation: any): void {
    console.log('Delegation', delegation);
    this.selectedDelegationId = delegation.id;
    this.delegationResponse = '';
    this.isResponseModalOpen = true;
  }

  closeResponseModal(): void {
    this.isResponseModalOpen = false;
  }

  sendDelegationResponseInline(apr: any): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema) {
      return;
    }
    if (!apr.responseText || !apr.responseText.trim()) {
      alert("Please enter a response");
      return;
    }
    const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${apr.id}/send_response/?schema=${selectedSchema}`;
    const payload = {
      deligate_response: apr.responseText.trim()
    };
    console.log("Sending:", payload);
    this.isLoading = true;
    this.EmployeeService.sendDelegationResponse(apiUrl, payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          apr.delegation_details.response = apr.responseText;
          apr.responseText = "";
          alert("Response sent successfully");
          this.fetchEmployees(
            selectedSchema,
            JSON.parse(localStorage.getItem('selectedBranchIds') || '[]')
          );
        },
        error: err => {
          this.isLoading = false;
          console.log(err);
        }
      });
  }

  canShowResponse(apr: any): boolean {
    return !!(
      apr.delegation_details &&
      apr.delegation_details.is_deligate &&
      Number(apr.delegation_details.delegate_to_id) === Number(this.userId)
    );
  }

  openDelegationModal() {
    this.isDelegationModalOpen = true;
  }

  closeDelegationModal() {
    this.isDelegationModalOpen = false;
  }

  createDelegation(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema || !this.selectedApproval) {
      return;
    }
    const apiUrl = `${this.apiUrl}/payroll/api/loan-approval/${this.selectedApproval.id}/delegate/?schema=${selectedSchema}`;
    const payload = {
      approver: this.userId,
      deligate_to: this.delegationForm.deligate_to
    };
    this.isLoading = true;
    this.EmployeeService.createDelegation(apiUrl, payload)
      .subscribe({
        next: () => {
          this.isLoading = false;
          alert("Delegated Successfully");
          window.location.reload();
          this.closeDelegationModal();
          this.fetchEmployees(
            selectedSchema,
            JSON.parse(localStorage.getItem('selectedBranchIds') || '[]')
          );
        },
        error: err => {
          this.isLoading = false;
          console.error(err);
        }
      });
  }

  openDelegationModalFromApproval(approval: any) {
    this.selectedApproval = approval;
    const loanRequest = this.Loanreq.find(
      (req: any) => req.document_number === approval.loan_request
    );
    this.selectedApproval = approval;
    const approver = this.Users.find(
      (user: any) => user.id === approval.approver
    );
    this.delegationForm = {
      request: loanRequest ? loanRequest.id : null,
      approver: approval.approver,
      deligator: approver ? approver.username : '',
      deligate_to: null
    };
    this.isDelegationModalOpen = true;
  }

  showDelegationDetails = false;

  toggleDelegationDetails() {
    this.showDelegationDetails = !this.showDelegationDetails;
  }

  // ─── Search & Filter ───
  searchText: string = '';
  selectedStatus: string = '';
  showFilterMenu = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.EmployeeService.getApprovalslistLoanNew(schema, branchIds).subscribe({
      next: (data: any) => {
        this.allApprovals = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredApprovals = this.allApprovals.filter(apr => {
      const matchesSearch =
        !search ||
        (apr.loan_request ?? '').toLowerCase().includes(search) ||
        (apr.status ?? '').toLowerCase().includes(search) ||
        (apr.note ?? '').toLowerCase().includes(search) ||
        (apr.level ?? '').toString().toLowerCase().includes(search) ||
        (apr.employee_id ?? '').toString().toLowerCase().includes(search) ||
        (apr.approver ?? '').toString().toLowerCase().includes(search);

      const matchesStatus =
        !this.selectedStatus ||
        apr.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  getEmptyMessage(): string {
    if (this.allApprovals.length === 0) {
      return 'No loan requests found.';
    }
    if (this.searchText && this.selectedStatus) {
      return `No ${this.selectedStatus.toLowerCase()} loan requests matching "${this.searchText}".`;
    }
    if (this.searchText) {
      return `No loan requests matching "${this.searchText}".`;
    }
    if (this.selectedStatus) {
      return `No ${this.selectedStatus.toLowerCase()} loan requests found.`;
    }
    return 'No loan requests found.';
  }

  toggleFilterMenu(): void {
    this.showFilterMenu = !this.showFilterMenu;
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
    this.showFilterMenu = false;
  }
}