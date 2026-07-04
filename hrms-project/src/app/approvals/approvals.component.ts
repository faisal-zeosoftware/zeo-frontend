import { Component } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { DesignationService } from '../designation-master/designation.service';
import { combineLatest, Subscription } from 'rxjs';
import { UserMasterService } from '../user-master/user-master.service';
import { DepartmentService } from '../department-report/department.service';


@Component({
  selector: 'app-approvals',
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css'
})
export class ApprovalsComponent {


  private dataSubscription?: Subscription;


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  schemas: string[] = []; // Array to store schema names

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;


  Approvals: any[] = []; // Assuming this array holds the list of expired documents

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

  constructor(private authService: AuthenticationService,
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

    // this.fetchingApprovals();
    this.selectedSchema = this.sessionService.getSelectedSchema();

    // this.hideButton = this.EmployeeService.getHideButton();

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
          this.userDetails = userData; // Store user details in userDetails property
          this.username = this.userDetails.username;


          console.log('User ID:', this.userId); // Log user ID
          console.log('User Details:', this.userDetails); // Log user details

          // Check if user is_superuser is true or false
          let isSuperuser = this.userDetails.is_superuser || false; // Default to false if is_superuser is undefined
          const selectedSchema = this.authService.getSelectedSchema();
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }


          if (isSuperuser) {
            console.log('User is superuser or ESS user');

            // Grant all permissions
            this.hasViewPermission = true;
            this.hasAddPermission = true;
            this.hasDeletePermission = true;
            this.hasEditPermission = true;

            // Fetch designations without checking permissions
            // this.fetchDesignations(selectedSchema);
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
                    // Grant all permissions
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

                // Fetching designations after checking permissions
                // this.fetchDesignations(selectedSchema);
              }

              catch (error) {
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

      // this.fetchingApprovals();


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

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema)
    // Check if selectedSchema is available
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
        // Filter active employees
        this.Approvals = data;

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
  note: string = '';  // To hold the note entered by the user


  // Fetching approval details when an item is clicked
  selectedaprovaldetalis(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();

    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/?schema=${selectedSchema}`;

      this.EmployeeService.getApprovalDetails(apiUrl).subscribe(
        (response: any) => {
          this.selectedApproval = response;
          this.isAddFieldsModalOpen = true; // Open the modal
          console.log('detalis', this.selectedApproval)
        },
        (error) => {
          console.error('Error fetching approval details:', error);
        }
      );
    }
  }




  // Function for handling approval rejection
  rejectApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();


    // Data to be sent in the request body (including the note)
    const approvalData = {
      note: this.note,          // The note entered by the user
      status: 'Rejected',       // Setting status to "Approved"
    };
    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/reject/?schema=${selectedSchema}`;

      this.EmployeeService.rejectApprovalRequest(apiUrl, approvalData).subscribe(
        (response: any) => {
          console.log('Approval status changed to Rejected:', response);

          // Update the selected approval status in the local UI
          if (this.selectedApproval) {
            this.selectedApproval.status = 'Rejected';
          }

          // Optionally, update the main approvals list if needed
          const approvalIndex = this.Approvals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.Approvals[approvalIndex].status = 'Rejected';
          }

          // Close the modal after successful approval
          this.isAddFieldsModalOpen = false;
        },
        (error) => {
          console.error('Error approving the approval request:', error);
        }
      );
    }

  }



  // Function for handling approval status change to "Approved"
  approveApproval(approvalId: number): void {
    const selectedSchema = this.authService.getSelectedSchema();

    if (selectedSchema) {
      const apiUrl = `${this.apiUrl}/employee/api/request-approvals/${approvalId}/approve/?schema=${selectedSchema}`;


      // Data to be sent in the request body (including the note)
      const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.EmployeeService.approveApprovalRequest(apiUrl, approvalData).subscribe(
        (response: any) => {
          console.log('Approval status changed to Approved:', response);

          // Update the selected approval status in the local UI
          if (this.selectedApproval) {
            this.selectedApproval.status = 'Approved';
          }

          // Optionally, update the main approvals list if needed
          const approvalIndex = this.Approvals.findIndex(approval => approval.id === approvalId);
          if (approvalIndex !== -1) {
            this.Approvals[approvalIndex].status = 'Approved';
          }

          // Close the modal after successful approval
          this.isAddFieldsModalOpen = false;
          window.location.reload();
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










/////////////////////////////////// Deligation Model //////////////////////////////////


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

  const apiUrl =
    `${this.apiUrl}/employee/api/delegations/${this.selectedDelegationId}/send_response/?schema=${selectedSchema}`;

  const payload = {
    response: this.delegationResponse
  };

  this.EmployeeService.sendDelegationResponse(apiUrl, payload)
    .subscribe({
      next: (res: any) => {

        console.log('Response Sent', res);

        alert('Response sent successfully');

        this.closeResponseModal();

        window.location.reload();
      },
      error: (err) => {
        console.error(err);
      }
    });
}

sendDelegationResponseInline(apr: any): void {

  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }

  const apiUrl =
    `${this.apiUrl}/employee/api/delegations/${apr.delegation_details.id}/send_response/?schema=${selectedSchema}`;

  const payload = {
    response: apr.responseText
  };

  this.EmployeeService.sendDelegationResponse(apiUrl, payload)
    .subscribe({
      next: (res: any) => {

        alert('Response sent successfully');

        apr.delegation_details.response = apr.responseText;

        apr.responseText = '';

      },
      error: err => console.error(err)
    });

}

canShowResponse(apr: any): boolean {

    return apr.delegation_details &&
           apr.delegation_details.delegate_to === this.username;

}


  // Delegate Model

  openDelegationModal() {
    this.isDelegationModalOpen = true;
  }

  closeDelegationModal() {
    this.isDelegationModalOpen = false;
  }

  createDelegation(): void {

    const selectedSchema = this.authService.getSelectedSchema();

    if (!selectedSchema) {
      return;
    }

    const apiUrl =
      `${this.apiUrl}/employee/api/delegations/?schema=${selectedSchema}`;

    const payload = {
      start_date: this.delegationForm.start_date,
      end_date: this.delegationForm.end_date,
      is_active: this.delegationForm.is_active,
      reason: this.delegationForm.reason,
      deligator: this.userId,
      deligate_to: this.delegationForm.deligate_to,
      request: this.delegationForm.request,
      created_by: this.userId
    };

    this.EmployeeService.createDelegation(apiUrl, payload)
      .subscribe({
        next: (res: any) => {

          console.log('Delegation Created', res);

          alert('Delegation created successfully');

          this.closeDelegationModal();

          window.location.reload();
        },
        error: (err) => {
          console.error(err);
        }
      });
  }

  openDelegationModalFromApproval(approval: any) {

    console.log('approval clicked', approval);

    const generalRequest = this.Genreq.find(
      (req: any) =>
        req.document_number === approval.general_request
    );

    console.log('matched GeneralRequest', generalRequest);

    this.delegationForm = {
      ...this.delegationForm,
      request: generalRequest ? generalRequest.id : null,
      deligator: this.userId
    };

    console.log('request id sending', this.delegationForm.request);

    this.isDelegationModalOpen = true;
  }

  showDelegationDetails = false;

  toggleDelegationDetails() {
    this.showDelegationDetails = !this.showDelegationDetails;
  }



}
