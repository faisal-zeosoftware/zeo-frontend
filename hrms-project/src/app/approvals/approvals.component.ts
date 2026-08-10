import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { DesignationService } from '../designation-master/designation.service';
import { combineLatest, Subscription } from 'rxjs';
import { UserMasterService } from '../user-master/user-master.service';

@Component({
  selector: 'app-approvals',
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent {

  private dataSubscription?: Subscription;

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

  delegationData: any = null;
  isDelegationModalOpen: boolean = false;

  delegationForm: any = {
    start_date: '',
    end_date: '',
    is_active: false,
    reason: '',
    deligator: null,
    deligate_to: null,
    request: null,
    created_by: null
  };

  deligators: any[] = [];
  delegateTos: any[] = [];
  requests: any[] = [];
  Genreq: any[] = [];
  Users: any[] = [];

  isResponseModalOpen = false;
  delegationResponse = '';
  selectedDelegationId: number | null = null;

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private EmployeeService: EmployeeService,
    private userService: UserMasterService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
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
      this.loadApprovalLevelGen();
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
            this.hasDeletePermission = true;
            this.hasEditPermission = true;
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
                    this.hasDeletePermission = true;
                    this.hasEditPermission = true;
                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);

                    this.hasAddPermission = this.checkGroupPermission('add_approval', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);

                    this.hasEditPermission = this.checkGroupPermission('change_approval', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);

                    this.hasDeletePermission = this.checkGroupPermission('delete_approval', groupPermissions);
                    console.log('Has delete permission:', this.hasDeletePermission);

                    this.hasViewPermission = this.checkGroupPermission('view_approval', groupPermissions);
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

  loadApprovalLevelGen(): void {
    const selectedSchema = this.authService.getSelectedSchema();
    console.log('schemastore', selectedSchema)
    if (selectedSchema) {
      this.EmployeeService.getAllgeneralRequest(selectedSchema).subscribe(
        (result: any) => {
          this.Genreq = result;
          console.log(' fetching Companies:');
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
  }

  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.EmployeeService.getGeneralRequestApprovalsMasterNew(schema, branchIds).subscribe({
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

  selectedApproval: any = null;
  isAddFieldsModalOpen: boolean = false;
  note: string = '';

  selectedaprovaldetalis(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/?schema=${selectedSchema}`;
      this.EmployeeService.getApprovalDetails(apiUrl).subscribe(
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

  rejectApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    const approvalData = {
      note: this.note,
      status: 'Rejected',
    };
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/reject/?schema=${selectedSchema}`;
      this.EmployeeService.rejectApprovalRequest(apiUrl, approvalData).subscribe(
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
          this.isAddFieldsModalOpen = false;
        },
        (error) => {
          console.error('Error approving the approval request:', error);
        }
      );
    }
  }

  approveApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/approve/?schema=${selectedSchema}`;
      const approvalData = {
        note: this.note,
        status: 'Approved',
      };
      this.EmployeeService.approveApprovalRequest(apiUrl, approvalData).subscribe(
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

  /////////////////////////////////// Delegation Model //////////////////////////////////

  openResponseModal(delegation: any): void {
    console.log('Delegation', delegation);
    this.selectedDelegationId = delegation.id;
    this.delegationResponse = '';
    this.isResponseModalOpen = true;
  }

  closeResponseModal(): void {
    this.isResponseModalOpen = false;
  }

  sendDelegationResponse(): void {
    if (!this.selectedDelegationId) {
      return;
    }
    const selectedSchema = this.authService.getSelectedSchema();
    if (!selectedSchema) {
      return;
    }
    const apiUrl = `${this.apiUrl}/employee/api/delegations/${this.selectedDelegationId}/send_response/?schema=${selectedSchema}`;
    const payload = {
      response: this.delegationResponse
    };
    this.isLoading = true;
    this.EmployeeService.sendDelegationResponse(apiUrl, payload)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('Response Sent', res);
          alert('Response sent successfully');
          this.closeResponseModal();
          window.location.reload();
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
        }
      });
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
    const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${apr.id}/send_response/?schema=${selectedSchema}`;
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
    const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${this.selectedApproval.id}/delegate/?schema=${selectedSchema}`;
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
    const generalRequest = this.Genreq.find(
      (req: any) => req.document_number === approval.general_request
    );
    this.selectedApproval = approval;
    const approver = this.Users.find(
      (user: any) => user.id === approval.approver
    );
    this.delegationForm = {
      request: generalRequest ? generalRequest.id : null,
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

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredApprovals = this.allApprovals.filter(apr => {
      const matchesSearch =
        !search ||
        (apr.general_request ?? '').toLowerCase().includes(search) ||
        (apr.status ?? '').toLowerCase().includes(search) ||
        (apr.note ?? '').toLowerCase().includes(search) ||
        (apr.level ?? '').toString().toLowerCase().includes(search) ||
        (apr.approver ?? '').toString().toLowerCase().includes(search);

      const matchesStatus =
        !this.selectedStatus ||
        apr.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  getEmptyMessage(): string {
    if (this.allApprovals.length === 0) {
      return 'No general requests found.';
    }
    if (this.searchText && this.selectedStatus) {
      return `No ${this.selectedStatus.toLowerCase()} general requests matching "${this.searchText}".`;
    }
    if (this.searchText) {
      return `No general requests matching "${this.searchText}".`;
    }
    if (this.selectedStatus) {
      return `No ${this.selectedStatus.toLowerCase()} general requests found.`;
    }
    return 'No general requests found.';
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