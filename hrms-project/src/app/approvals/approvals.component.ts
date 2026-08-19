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

  // =========================================================
  // APPROVAL DATA
  // =========================================================

  allApprovals: any[] = [];
  filteredApprovals: any[] = [];

  selectedApproval: any = null;

  isAddFieldsModalOpen: boolean = false;

  note: string = '';

  // =========================================================
  // REJECTION
  // =========================================================

  showRejectionReason: boolean = false;

  rejection_reason: string = '';

  // =========================================================
  // DELEGATION
  // =========================================================

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

  // =========================================================
  // DELEGATION RESPONSE
  // =========================================================

  isResponseModalOpen = false;

  delegationResponse = '';

  selectedDelegationId: number | null = null;

  // =========================================================
  // PERMISSIONS
  // =========================================================

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean = false;
  hasEditPermission: boolean = false;

  // =========================================================
  // SEARCH / FILTER
  // =========================================================

  searchText: string = '';

  selectedStatus: string = '';

  showFilterMenu = false;

  // =========================================================
  // DELEGATION DETAILS
  // =========================================================

  showDelegationDetails = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private EmployeeService: EmployeeService,
    private userService: UserMasterService,
    private route: ActivatedRoute,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
  ) { }


  // =========================================================
  // NG ON INIT
  // =========================================================

  ngOnInit(): void {

    // Load approvals whenever schema or branches change
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {

      if (schema) {
        this.fetchEmployees(schema, branchIds);
      }

    });


    // Listen for branch changes
    this.EmployeeService.selectedBranches$.subscribe(ids => {
      this.loadApprovalLevelGen();
    });


    this.selectedSchema =
      this.sessionService.getSelectedSchema();


    // Router events
    this.router.events.subscribe(event => {

      if (event instanceof NavigationEnd) {
        // Navigation handling if required
      }

    });


    // Load users
    this.loadUsers();


    // Selected schema
    const selectedSchema =
      this.authService.getSelectedSchema();

    const selectedSchemaId =
      this.authService.getSelectedSchemaId();


    if (selectedSchema && selectedSchemaId) {

      this.selectedSchema = selectedSchema;

      console.log(
        'Selected schema from localStorage:',
        selectedSchema
      );

      console.log(
        'Selected schema ID from localStorage:',
        selectedSchemaId
      );

    } else {

      console.error('No schema selected.');

    }


    // User ID
    this.userId =
      this.sessionService.getUserId();


    if (this.userId !== null) {

      // =====================================================
      // USER DETAILS / PERMISSIONS
      // =====================================================

      this.authService.getUserData(this.userId).subscribe(

        async (userData: any) => {

          this.userDetails = userData;

          this.username =
            this.userDetails.username;


          console.log(
            'User ID:',
            this.userId
          );

          console.log(
            'User Details:',
            this.userDetails
          );


          const isSuperuser =
            this.userDetails.is_superuser || false;


          const selectedSchema =
            this.authService.getSelectedSchema();


          if (!selectedSchema) {

            console.error(
              'No schema selected.'
            );

            return;

          }


          // =================================================
          // SUPERUSER
          // =================================================

          if (isSuperuser) {

            console.log(
              'User is superuser'
            );

            this.hasViewPermission = true;

            this.hasAddPermission = true;

            this.hasDeletePermission = true;

            this.hasEditPermission = true;

          }

          // =================================================
          // NORMAL USER
          // =================================================

          else {

            console.log(
              'User is not superuser'
            );

            try {

              const permissionsData: any =
                await this.DesignationService
                  .getDesignationsPermission(selectedSchema)
                  .toPromise();


              console.log(
                'Permissions data:',
                permissionsData
              );


              if (
                Array.isArray(permissionsData) &&
                permissionsData.length > 0
              ) {

                const firstItem =
                  permissionsData[0];


                // =========================================
                // PERMISSION API SAYS SUPERUSER
                // =========================================

                if (firstItem.is_superuser) {

                  this.hasViewPermission = true;

                  this.hasAddPermission = true;

                  this.hasDeletePermission = true;

                  this.hasEditPermission = true;

                }

                // =========================================
                // GROUP PERMISSIONS
                // =========================================

                else if (
                  firstItem.groups &&
                  Array.isArray(firstItem.groups) &&
                  firstItem.groups.length > 0
                ) {

                  const groupPermissions =
                    firstItem.groups.flatMap(
                      (group: any) =>
                        group.permissions || []
                    );


                  console.log(
                    'Group Permissions:',
                    groupPermissions
                  );


                  this.hasAddPermission =
                    this.checkGroupPermission(
                      'add_approval',
                      groupPermissions
                    );


                  this.hasEditPermission =
                    this.checkGroupPermission(
                      'change_approval',
                      groupPermissions
                    );


                  this.hasDeletePermission =
                    this.checkGroupPermission(
                      'delete_approval',
                      groupPermissions
                    );


                  this.hasViewPermission =
                    this.checkGroupPermission(
                      'view_approval',
                      groupPermissions
                    );


                  console.log(
                    'Has view permission:',
                    this.hasViewPermission
                  );

                }

                else {

                  console.error(
                    'No groups found in permissions data.',
                    firstItem
                  );

                }

              }

              else {

                console.error(
                  'Permissions data is not an array or is empty.',
                  permissionsData
                );

              }

            }

            catch (error) {

              console.error(
                'Error fetching permissions:',
                error
              );

            }

          }

        },

        (error) => {

          console.error(
            'Failed to fetch user details:',
            error
          );

        }

      );


      // =====================================================
      // USER SCHEMAS
      // =====================================================

      this.authService
        .getUserSchema(this.userId)
        .subscribe(

          (userData: any) => {

            this.userDetailss = userData;

            this.schemas =
              userData.map(
                (schema: any) =>
                  schema.schema_name
              );

            console.log(
              'schemas:',
              userData
            );

          },

          (error) => {

            console.error(
              'Failed to fetch user schemas:',
              error
            );

          }

        );

    }

    else {

      console.error(
        'User ID is null.'
      );

    }

  }


  // =========================================================
  // LOAD GENERAL REQUESTS
  // =========================================================

  loadApprovalLevelGen(): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    console.log(
      'schema store:',
      selectedSchema
    );


    if (selectedSchema) {

      this.EmployeeService
        .getAllgeneralRequest(selectedSchema)
        .subscribe(

          (result: any) => {

            this.Genreq = result;

            console.log(
              'General requests fetched:',
              result
            );

          },

          (error) => {

            console.error(
              'Error fetching general requests:',
              error
            );

          }

        );

    }

  }


  // =========================================================
  // PERMISSION CHECK
  // =========================================================

  checkGroupPermission(
    codeName: string,
    groupPermissions: any[]
  ): boolean {

    return groupPermissions.some(
      permission =>
        permission.codename === codeName
    );

  }


  // =========================================================
  // FETCH APPROVALS
  // =========================================================

  fetchEmployees(
    schema: string,
    branchIds: number[]
  ): void {

    this.isLoading = true;


    this.EmployeeService
      .getGeneralRequestApprovalsMasterNew(
        schema,
        branchIds
      )
      .subscribe({

        next: (data: any) => {

          this.allApprovals = data || [];

          this.applyFilters();

          this.isLoading = false;

        },

        error: (err) => {

          console.error(
            'Fetch approval error:',
            err
          );

          this.allApprovals = [];

          this.filteredApprovals = [];

          this.isLoading = false;

        }

      });

  }


  // =========================================================
  // LOAD USERS
  // =========================================================

  loadUsers(): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (selectedSchema) {

      this.userService
        .getApprover(selectedSchema)
        .subscribe(

          (result: any) => {

            this.Users = result || [];

          },

          (error) => {

            console.error(
              'Error loading users:',
              error
            );

          }

        );

    }

  }


  // =========================================================
  // VIEW APPROVAL DETAILS
  // =========================================================

  selectedaprovaldetalis(
    approvalId: number
  ): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (selectedSchema) {

      const apiUrl =
        `${this.apiUrl}/employee/api/request-approvals/${approvalId}/?schema=${selectedSchema}`;


      this.EmployeeService
        .getApprovalDetails(apiUrl)
        .subscribe(

          (response: any) => {

            this.selectedApproval = response;

            this.isAddFieldsModalOpen = true;

            // Reset rejection state
            this.showRejectionReason = false;

            this.rejection_reason = '';

            this.note = '';

            console.log(
              'Approval details:',
              this.selectedApproval
            );

          },

          (error) => {

            console.error(
              'Error fetching approval details:',
              error
            );

          }

        );

    }

  }


  // =========================================================
  // REJECT BUTTON
  // =========================================================
  //
  // IMPORTANT:
  // This no longer immediately rejects.
  // It first displays the rejection reason field.
  //

  rejectApproval(approvalId: number): void {

    // Make sure the selected approval is available
    if (
      !this.selectedApproval ||
      this.selectedApproval.id !== approvalId
    ) {

      this.selectedApproval =
        this.allApprovals.find(
          approval =>
            approval.id === approvalId
        );

    }


    this.showRejectionReason = true;

    this.rejection_reason = '';

  }


  // =========================================================
  // CONFIRM REJECTION
  // =========================================================

  confirmRejection(
    approvalId: number
  ): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (!selectedSchema) {

      console.error(
        'No schema selected.'
      );

      return;

    }


    // Validate rejection reason
    if (
      !this.rejection_reason ||
      !this.rejection_reason.trim()
    ) {

      alert(
        'Please enter a rejection reason.'
      );

      return;

    }


    const approvalData = {

      // Rejection reason
      note: this.rejection_reason.trim(),

      // Status
      status: 'Rejected',

      // Optional separate rejection field
      rejection_reason:
        this.rejection_reason.trim()

    };


    const apiUrl =
      `${this.apiUrl}/employee/api/request-approvals/${approvalId}/reject/?schema=${selectedSchema}`;


    this.isLoading = true;


    this.EmployeeService
      .rejectApprovalRequest(
        apiUrl,
        approvalData
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'Approval rejected:',
            response
          );


          // =============================================
          // UPDATE MASTER DATA
          // =============================================

          const approvalIndex =
            this.allApprovals.findIndex(
              approval =>
                approval.id === approvalId
            );


          if (approvalIndex !== -1) {

            this.allApprovals[
              approvalIndex
            ].status = 'Rejected';

            this.allApprovals[
              approvalIndex
            ].note =
              this.rejection_reason.trim();

          }


          // =============================================
          // UPDATE SELECTED APPROVAL
          // =============================================

          if (this.selectedApproval) {

            this.selectedApproval.status =
              'Rejected';

            this.selectedApproval.note =
              this.rejection_reason.trim();

          }


          // =============================================
          // REFRESH FILTERED DATA
          // =============================================

          this.applyFilters();


          // =============================================
          // RESET REJECTION
          // =============================================

          this.showRejectionReason = false;

          this.rejection_reason = '';

          this.note = '';


          this.isAddFieldsModalOpen = false;

          this.isLoading = false;


          alert(
            'Approval rejected successfully.'
          );

        },

        error: (error) => {

          this.isLoading = false;

          console.error(
            'Error rejecting approval:',
            error
          );

          alert(
            'Failed to reject approval.'
          );

        }

      });

  }


  // =========================================================
  // APPROVE APPROVAL
  // =========================================================

  approveApproval(
    approvalId: number
  ): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (!selectedSchema) {

      console.error(
        'No schema selected.'
      );

      return;

    }


    const approvalData = {

      note: this.note,

      status: 'Approved'

    };


    const apiUrl =
      `${this.apiUrl}/employee/api/request-approvals/${approvalId}/approve/?schema=${selectedSchema}`;


    this.isLoading = true;


    this.EmployeeService
      .approveApprovalRequest(
        apiUrl,
        approvalData
      )
      .subscribe({

        next: (response: any) => {

          console.log(
            'Approval status changed to Approved:',
            response
          );


          // Update master data
          const approvalIndex =
            this.allApprovals.findIndex(
              approval =>
                approval.id === approvalId
            );


          if (approvalIndex !== -1) {

            this.allApprovals[
              approvalIndex
            ].status = 'Approved';

            this.allApprovals[
              approvalIndex
            ].note = this.note;

          }


          // Update selected approval
          if (this.selectedApproval) {

            this.selectedApproval.status =
              'Approved';

            this.selectedApproval.note =
              this.note;

          }


          this.applyFilters();


          // Reset rejection state
          this.showRejectionReason = false;

          this.rejection_reason = '';


          this.isAddFieldsModalOpen = false;

          this.isLoading = false;


          alert(
            'Approval approved successfully.'
          );

        },

        error: (error) => {

          this.isLoading = false;

          console.error(
            'Error approving approval request:',
            error
          );

          alert(
            'Failed to approve approval.'
          );

        }

      });

  }


  // =========================================================
  // CLOSE APPROVAL MODAL
  // =========================================================

  closemarketModal(): void {

    this.isAddFieldsModalOpen = false;

    this.showRejectionReason = false;

    this.rejection_reason = '';

    this.note = '';

  }


  // =========================================================
  // DELEGATION RESPONSE MODAL
  // =========================================================

  openResponseModal(
    delegation: any
  ): void {

    console.log(
      'Delegation:',
      delegation
    );


    this.selectedDelegationId =
      delegation.id;


    this.delegationResponse = '';

    this.isResponseModalOpen = true;

  }


  closeResponseModal(): void {

    this.isResponseModalOpen = false;

    this.delegationResponse = '';

    this.selectedDelegationId = null;

  }


  // =========================================================
  // SEND DELEGATION RESPONSE
  // =========================================================

  sendDelegationResponse(): void {

    if (!this.selectedDelegationId) {

      return;

    }


    const selectedSchema =
      this.authService.getSelectedSchema();


    if (!selectedSchema) {

      return;

    }


    if (
      !this.delegationResponse ||
      !this.delegationResponse.trim()
    ) {

      alert(
        'Please enter a response.'
      );

      return;

    }


    const apiUrl =
      `${this.apiUrl}/employee/api/delegations/${this.selectedDelegationId}/send_response/?schema=${selectedSchema}`;


    const payload = {

      response:
        this.delegationResponse.trim()

    };


    this.isLoading = true;


    this.EmployeeService
      .sendDelegationResponse(
        apiUrl,
        payload
      )
      .subscribe({

        next: (res: any) => {

          this.isLoading = false;

          console.log(
            'Response sent:',
            res
          );


          alert(
            'Response sent successfully.'
          );


          this.closeResponseModal();

          window.location.reload();

        },

        error: (err) => {

          this.isLoading = false;

          console.error(
            'Error sending response:',
            err
          );

          alert(
            'Failed to send response.'
          );

        }

      });

  }


  // =========================================================
  // INLINE DELEGATION RESPONSE
  // =========================================================

  sendDelegationResponseInline(
    apr: any
  ): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (!selectedSchema) {

      return;

    }


    if (
      !apr.responseText ||
      !apr.responseText.trim()
    ) {

      alert(
        'Please enter a response.'
      );

      return;

    }


    const apiUrl =
      `${this.apiUrl}/employee/api/request-approvals/${apr.id}/send_response/?schema=${selectedSchema}`;


    const payload = {

      deligate_response:
        apr.responseText.trim()

    };


    console.log(
      'Sending:',
      payload
    );


    this.isLoading = true;


    this.EmployeeService
      .sendDelegationResponse(
        apiUrl,
        payload
      )
      .subscribe({

        next: (res: any) => {

          this.isLoading = false;


          if (apr.delegation_details) {

            apr.delegation_details.response =
              apr.responseText;

          }


          apr.responseText = '';


          alert(
            'Response sent successfully.'
          );


          const branchIds =
            JSON.parse(
              localStorage.getItem(
                'selectedBranchIds'
              ) || '[]'
            );


          this.fetchEmployees(
            selectedSchema,
            branchIds
          );

        },

        error: (err) => {

          this.isLoading = false;

          console.error(
            'Error sending delegation response:',
            err
          );

          alert(
            'Failed to send response.'
          );

        }

      });

  }


  // =========================================================
  // SHOW DELEGATION RESPONSE
  // =========================================================

  canShowResponse(
    apr: any
  ): boolean {

    return !!(
      apr.delegation_details &&
      apr.delegation_details.is_deligate &&
      Number(
        apr.delegation_details.delegate_to_id
      ) === Number(this.userId)
    );

  }


  // =========================================================
  // OPEN DELEGATION MODAL
  // =========================================================

  openDelegationModal(): void {

    this.isDelegationModalOpen = true;

  }


  closeDelegationModal(): void {

    this.isDelegationModalOpen = false;

  }


  // =========================================================
  // CREATE DELEGATION
  // =========================================================

  createDelegation(): void {

    const selectedSchema =
      this.authService.getSelectedSchema();


    if (
      !selectedSchema ||
      !this.selectedApproval
    ) {

      return;

    }


    if (!this.delegationForm.deligate_to) {

      alert(
        'Please select a user to delegate.'
      );

      return;

    }


    const apiUrl =
      `${this.apiUrl}/employee/api/request-approvals/${this.selectedApproval.id}/delegate/?schema=${selectedSchema}`;


    const payload = {

      approver: this.userId,

      deligate_to:
        this.delegationForm.deligate_to

    };


    this.isLoading = true;


    this.EmployeeService
      .createDelegation(
        apiUrl,
        payload
      )
      .subscribe({

        next: () => {

          this.isLoading = false;


          alert(
            'Delegated Successfully.'
          );


          this.closeDelegationModal();


          const branchIds =
            JSON.parse(
              localStorage.getItem(
                'selectedBranchIds'
              ) || '[]'
            );


          this.fetchEmployees(
            selectedSchema,
            branchIds
          );

        },

        error: (err) => {

          this.isLoading = false;

          console.error(
            'Delegation error:',
            err
          );

          alert(
            'Failed to create delegation.'
          );

        }

      });

  }


  // =========================================================
  // OPEN DELEGATION FROM APPROVAL
  // =========================================================

  openDelegationModalFromApproval(
    approval: any
  ): void {

    this.selectedApproval = approval;


    const generalRequest =
      this.Genreq.find(
        (req: any) =>
          req.document_number ===
          approval.general_request
      );


    const approver =
      this.Users.find(
        (user: any) =>
          user.id === approval.approver
      );


    this.delegationForm = {

      request:
        generalRequest
          ? generalRequest.id
          : null,

      approver:
        approval.approver,

      deligator:
        approver
          ? approver.username
          : '',

      deligate_to:
        null

    };


    this.isDelegationModalOpen = true;

  }


  // =========================================================
  // DELEGATION DETAILS
  // =========================================================

  toggleDelegationDetails(): void {

    this.showDelegationDetails =
      !this.showDelegationDetails;

  }


  // =========================================================
  // SEARCH & FILTER
  // =========================================================

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredApprovals =
      this.allApprovals.filter(
        apr => {

          const matchesSearch =

            !search ||

            (apr.general_request ?? '')
              .toString()
              .toLowerCase()
              .includes(search) ||

            (apr.status ?? '')
              .toString()
              .toLowerCase()
              .includes(search) ||

            (apr.note ?? '')
              .toString()
              .toLowerCase()
              .includes(search) ||

            (apr.level ?? '')
              .toString()
              .toLowerCase()
              .includes(search) ||

            (apr.approver ?? '')
              .toString()
              .toLowerCase()
              .includes(search);


          const matchesStatus =

            !this.selectedStatus ||

            apr.status ===
              this.selectedStatus;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

  }


  // =========================================================
  // EMPTY MESSAGE
  // =========================================================

  getEmptyMessage(): string {

    if (
      this.allApprovals.length === 0
    ) {

      return 'No general requests found.';

    }


    if (
      this.searchText &&
      this.selectedStatus
    ) {

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


  // =========================================================
  // FILTER MENU
  // =========================================================

  toggleFilterMenu(): void {

    this.showFilterMenu =
      !this.showFilterMenu;

  }


  filterByStatus(
    status: string
  ): void {

    this.selectedStatus =
      status;


    this.applyFilters();


    this.showFilterMenu = false;

  }


  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {

    if (this.dataSubscription) {

      this.dataSubscription.unsubscribe();

    }

  }

}