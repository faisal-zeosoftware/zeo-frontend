import { Component, ViewChild, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { environment } from '../../environments/environment';
import { DesignationService } from '../designation-master/designation.service';
import {combineLatest, forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-payslip-approval',
  templateUrl: './payslip-approval.component.html',
  styleUrl: './payslip-approval.component.css'
})
export class PayslipApprovalComponent {


  
  private dataSubscription?: Subscription;
  @ViewChild('bottomOfPage') bottomOfPage!: ElementRef;


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  
  schemas: string[] = []; // Array to store schema names

  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  username: any;
  selectedSchema: string | null = null;
  isLoading: boolean = false;


  Approvals: any[] = []; // Assuming this array holds the list of expired documents

  RejectionResons: any[] = []; // Assuming this array holds the list of expired documents
  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  Employees: any[] = [];

  
  constructor(private authService: AuthenticationService,
    private router: Router,
   private EmployeeService: EmployeeService,
   private route: ActivatedRoute,
   private sessionService: SessionService,
   private leaveService: LeaveService,
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

    // this.fetchingApprovals();
        this.selectedSchema = this.sessionService.getSelectedSchema();

    // this.hideButton = this.EmployeeService.getHideButton();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Perform any actions on navigation end if needed
      }
    });

    const selectedSchema = this.authService.getSelectedSchema();
    const selectedSchemaId = this.authService.getSelectedSchemaId();

    if (selectedSchema) {


      // this.LoadLeaveRejectionReasons(selectedSchema);


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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_payslipapproval', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_payslipapproval', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_payslipapproval', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_payslipapproval', groupPermissions);
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
        // combineLatest waits for both Schema and Branches to have a value
        this.dataSubscription = combineLatest([
          this.EmployeeService.selectedSchema$,
          this.EmployeeService.selectedBranches$
        ]).subscribe(([schema, branchIds]) => {
          if (schema) {
            this.fetchEmployees(schema, branchIds);  
            
  
          }
        });
  


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

// checkViewPermission(permissions: any[]): boolean {
//   const requiredPermission = 'add_leaveapproval' ||'change_leaveapproval' ||'delete_leaveapproval' ||'view_leaveapproval';
  
  
//   // Check user permissions
//   if (permissions.some(permission => permission.codename === requiredPermission)) {
//     return true;
//   }
  
//   // Check group permissions (if applicable)
//   // Replace `// TODO: Implement group permission check`
//   // with your logic to retrieve and check group permissions
//   // (consider using a separate service or approach)
//   return false; // Replace with actual group permission check
//   }
  
  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  


  getMonthName(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[month - 1] || 'N/A';
}





searchQuery: string = '';
filteredApprovals: any[] = [];


// isLoading: boolean = false;

fetchEmployees(schema: string, branchIds: number[]): void {
  this.isLoading = true;
  this.EmployeeService.getApprovalslistPayslipNew(schema, branchIds).subscribe({
    next: (data: any) => {
     // Filter items where status is "pending" AND confirm_status is true
     this.Approvals = data
     .filter((item: any) =>
       item.request?.status === 'pending' &&
       item.request?.confirm_status === true
     )
     .map((item: any) => ({ ...item, selected: false }));

      // Initialize filtered list to full set on load
      this.filteredApprovals = [...this.Approvals];
      this.isLoading = false;

    },
    error: (err) => {
      console.error('Fetch error:', err);
      this.isLoading = false;
    }
  });
}





masterSelected = false;

filterApprovals(): void {
  const query = this.searchQuery.toLowerCase().trim();

  if (!query) {
    this.filteredApprovals = [...this.Approvals];
    return;
  }

  this.filteredApprovals = this.Approvals.filter(p => {
    const req = p.request;
    return (
      req?.employee?.toLowerCase().includes(query) ||
      req?.payroll_run?.name?.toLowerCase().includes(query) ||
      req?.status?.toLowerCase().includes(query) ||
      String(req?.payroll_run?.year).includes(query) ||
      this.getMonthName(req?.payroll_run?.month)?.toLowerCase().includes(query)
    );
  });
}

toggleAll(): void {
  // Only toggle rows currently visible in the filtered/search view
  this.filteredApprovals.forEach(p => p.selected = this.masterSelected);
}







// Approve selected payslips
approveSelectedPayslips(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    alert('Schema not found.');
    return;
  }

  // ✅ Only collect top-level `id` of each approval object
  const selectedIds = this.Approvals
    .filter(p => p.selected)
    .map(p => p.id);

  if (selectedIds.length === 0) {
    alert('Please select at least one payslip to approve.');
    return;
  }

  const note = 'Approved successfully';

  this.EmployeeService.bulkApprovePayslips(selectedSchema, selectedIds, note).subscribe(
    (res) => {
      alert('Selected payslips approved.');
      window.location.reload();
 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.EmployeeService.selectedSchema$,
  this.EmployeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchEmployees(schema, branchIds);  
    

  }
});
},
    (err) => {
      console.error('Error approving:', err);
      alert('Approval failed.');
    }
  );
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



selectedApproval: any = null;
isAddFieldsModalOpen: boolean = false;
note: string = '';  // To hold the note entered by the user


 // Fetching approval details when an item is clicked
 selectedaprovaldetalis(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-payroll/${approvalId}/?schema=${selectedSchema}`;

    this.EmployeeService.getApprovalDetailsPayslip(apiUrl).subscribe(
      (response: any) => {
        this.selectedApproval = response;
        this.isAddFieldsModalOpen = true; // Open the modal
        console.log('detalis',this.selectedApproval)
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
  



 
 // Function for handling approval status change to "Approved"
 approveApproval(approvalId: number): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-payroll/${approvalId}/approve/?schema=${selectedSchema}`;


       // Data to be sent in the request body (including the note)
       const approvalData = {
        note: this.note,          // The note entered by the user
        status: 'Approved',       // Setting status to "Approved"
      };

      this.EmployeeService.approveApprovalRequest(apiUrl, approvalData).subscribe(
        (response: any) => {
        console.log('Approval status changed to Approved:', response);
        alert('Approval status Approved')
        // Update the selected approval status in the local UI
        if (this.selectedApproval) {
          this.selectedApproval.status = 'Approved';
        
        }

        // Optionally, update the main approvals list if needed
        const approvalIndex = this.Approvals.findIndex(approval => approval.id === approvalId);
        if (approvalIndex !== -1) {
          this.Approvals[approvalIndex].status = 'Approved';
        }

         // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);  
        

      }
    });
        // Close the modal after successful approval
        this.isAddFieldsModalOpen = false;
      },
      (error) => {
        console.error('Error approving the approval request:', error);
      }
    );
  }
}

 








isRejectModalOpen: boolean = false;
rejectionReason: string = '';

// Reuse the same "selected" checkbox state you already use for Approve
getSelectedPayslips(): any[] {
  return this.Approvals.filter(p => p.selected);
}

openRejectModal(): void {
  const selected = this.getSelectedPayslips();
  if (selected.length === 0) {
    alert('Please select at least one payslip to reject.');
    return;
  }
  this.rejectionReason = '';
  this.isRejectModalOpen = true;
}

closeRejectModal(): void {
  this.isRejectModalOpen = false;
  this.rejectionReason = '';
}

confirmRejectSelectedPayslips(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema) {
    alert('No schema selected.');
    return;
  }

  const selected = this.getSelectedPayslips();
  if (selected.length === 0) {
    alert('No payslips selected.');
    return;
  }

  const rejectData = {
    rejection_reason: this.rejectionReason || '', // optional — sent even if empty
  };

  // Fire one reject call per selected payslip
  const requests = selected.map(payslip => {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-payroll/${payslip.id}/reject/?schema=${selectedSchema}`;
    return this.EmployeeService.rejectApprovalRequestPayslip(apiUrl, rejectData);
  });

  forkJoin(requests).subscribe(
    (responses: any[]) => {
      console.log('Reject responses:', responses);
      alert('Selected payslip(s) rejected successfully.');

      // Update local status for immediate UI feedback
      selected.forEach(payslip => {
        const index = this.Approvals.findIndex(a => a.id === payslip.id);
        if (index !== -1 && this.Approvals[index].request) {
          this.Approvals[index].request.status = 'rejected';
        }
      });

      this.closeRejectModal();
       // combineLatest waits for both Schema and Branches to have a value
    this.dataSubscription = combineLatest([
      this.EmployeeService.selectedSchema$,
      this.EmployeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);  
        

      }
    });
      // Optionally remove rejected rows from the pending list entirely:
      // this.Approvals = this.Approvals.filter(a => !selected.includes(a));
    },
    (error) => {
      console.error('Error rejecting payslip(s):', error);
      alert('Error while rejecting payslip(s).');
    }
  );
}

}
