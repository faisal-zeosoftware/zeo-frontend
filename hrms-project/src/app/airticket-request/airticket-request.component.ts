import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import {  HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { DepartmentServiceService } from '../department-master/department-service.service';

@Component({
  selector: 'app-airticket-request',
  templateUrl: './airticket-request.component.html',
  styleUrl: './airticket-request.component.css'
})
export class AirticketRequestComponent {

  
  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

   

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  allocation: any = '';
  request_type: any = '';
  request_date: any = '';
  departure_date: any = '';
  return_date: any = '';
  origin: any = '';
  destination: any = '';
  notes: any = '';
  approved_by: any = '';
  employee:any='';

  allowed_in_probation:  boolean = false;



  Users:any []=[];
  LoanTypes:any []=[];


  Assets:any []=[];


  customFieldHeaders: { custom_field_id: number, custom_field_name: string }[] = [];



  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  custom_fieldsFam :any[] = [];


    document_number: number | string | null = null;

    automaticNumbering: boolean = false;

    branch: any = '';

     branches:any []=[];



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private countryService:CountryService,
    private DepartmentServiceService: DepartmentServiceService 


    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  this.loadLAssetType();
  this.loadAllocations();
  this.loadAirticketRequest();
  this.loademployee();
  this.loadDeparmentBranch();

  this.userId = this.sessionService.getUserId();
  
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        // this.created_by = this.userId; // Automatically set the owner to logged-in user ID
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_airticketrequest', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_airticketrequest', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_airticketrequest', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_airticketrequest', groupPermissions);
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
  

    this.authService.getUserSchema(this.userId).subscribe(
      (userData: any) => {
        this.userDetailss = userData; // Store user schemas in userDetailss

        this.schemas = userData.map((schema: any) => schema.schema_name);
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
//   const requiredPermission = 'add_requesttype' ||'change_requesttype' ||'delete_requesttype' ||'view_requesttype';
  
  
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
  

        loadUsers(): void {
    
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.userService.getSChemaUsers(selectedSchema).subscribe(
              (result: any) => {
                this.Users = result;
                console.log(' fetching Companies:');
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }



          SentRequest(): void {
            this.registerButtonClicked = true;
            const companyData = {
              allocation: this.allocation,
            
              request_type:this.request_type,
              request_date:this.request_date,
              departure_date:this.departure_date,
              return_date:this.return_date,
              origin:this.origin,
              destination:this.destination,
              notes:this.notes,
              approved_by:this.approved_by,
              employee:this.employee,
              document_number:this.document_number,
              branch:this.branch



              // Add other form field values to the companyData object
            };
          

        
            this.employeeService.registerAirTicketRequest(companyData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                    alert('Request sent successfuly completed');
                    window.location.reload();
               
        
              },
              (error) => {
                console.error('Added failed', error);
  let errorMessage = 'Enter all required fields!';

      // ✅ Handle backend validation or field-specific errors
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
            );
          }


  onBranchChange(event: any): void {
  const selectedBranchId = event.target.value;
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedBranchId || !selectedSchema) {
    console.warn('Missing branch or schema');
    this.automaticNumbering = false;
    this.document_number = null;
    return;
  }

  const type = 'air_ticket_request';  // fixed for this form

  const apiUrl = `${this.apiUrl}/organisation/api/document-numbering/?branch_id=${selectedBranchId}&type=${type}&schema=${selectedSchema}`;

  this.http.get<any>(apiUrl).subscribe({
    next: (response) => {
      // Handle both object and array responses (your example shows array[0])
      const data = Array.isArray(response) && response.length > 0 ? response[0] : response;

      this.automaticNumbering = !!data?.automatic_numbering;

      if (this.automaticNumbering) {
        this.document_number = null;     // or '' — null is cleaner
        console.log('Auto-numbering enabled → document number cleared');
      } else {
        this.document_number = '';       // ready for manual input
        console.log('Manual numbering → enter document number');
      }
    },
    error: (error) => {
      console.error('Failed to load numbering settings:', error);
      this.automaticNumbering = false;   // safe fallback
      this.document_number = '';
      // Optional: alert('Could not load document numbering settings');
    }
  });
}

      
          loadLAssetType(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.employeeService.getairticketpolicy(selectedSchema).subscribe(
                (result: any) => {
                  this.LoanTypes = result;
                  console.log(' fetching Loantypes:');
          
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }
        



               iscreateLoanApp: boolean = false;




      openPopus():void{
        this.iscreateLoanApp = true;

      this.document_number = null;
      this.automaticNumbering = false;
      this.branch = ''; 


      }
    
      closeapplicationModal():void{
        this.iscreateLoanApp = false;

      }




      openEditPopuss(categoryId: number):void{
        
      }
  
  
      showEditBtn: boolean = false;
  
      EditShowButtons() {
        this.showEditBtn = !this.showEditBtn;
      }
  
  
      Delete: boolean = false;
      allSelected: boolean = false;
  
    toggleCheckboxes() {
      this.Delete = !this.Delete;
    }
  
    toggleSelectAllEmployees() {
        this.allSelected = !this.allSelected;
    this.Requests.forEach(employee => employee.selected = this.allSelected);

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }



    isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset };
  this.isEditModalOpen = true;


  this.mapAllocationNameToId();

  this.mapEmployeeNameToId()
}

closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editAsset = {};
}


updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateAirRequest(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Airticket updated successfully!');
      this.closeEditModal();
      this.loadLAssetType(); // reload updated list
      window.location.reload(); 
    },
(error) => {
  console.error('Error updating Airticket Request:', error);

  let errorMsg = 'Update failed';

  const backendError = error?.error;

  if (backendError && typeof backendError === 'object') {
    // Convert the object into a readable string
    errorMsg = Object.keys(backendError)
      .map(key => `${key}: ${backendError[key].join(', ')}`)
      .join('\n');
  }

  alert(errorMsg);
}
  );
}


deleteSelectedAirTicketReq() { 
  const selectedEmployeeIds = this.Requests
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No AirTicket Request selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected AirTicket Request ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

    selectedEmployeeIds.forEach(categoryId => {
      this.countryService.deleteAirReq(categoryId).subscribe(
        () => {
          console.log('AirTicket Request deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.Requests = this.Requests.filter(employee => employee.id !== categoryId);
            completed++;
         if (completed === total) {   
          alert(' AirTicket Request deleted successfully');
          window.location.reload();
         }

        },
        (error) => {
          console.error('Error deleting AirTicket Request:', error);
        alert('Error deleting AirTicket Request: ' + error.statusText);
        }
      );
    });
  }
}


Allocations:any[]=[];
Requests:any[]=[];
Employees:any[]=[];


loadAllocations(callback?: Function): void {

  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.employeeService.getairticketAllocations(selectedSchema).subscribe(
      (result: any) => {
        this.Allocations = result;
        console.log(' fetching Loantypes:');
          if (callback) callback();

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }

mapAllocationNameToId() {
  if (!this.Allocations || !this.editAsset?.allocation) return;

  let value = this.editAsset.allocation;

  // Case A — Already an ID
  if (typeof value === "number") {
    return; // nothing to map
  }

  // Case B — Value returned as "Employee - Amount"
  const match = this.Allocations.find(
    (a: any) =>
      `${a.employee} - ${a.amount}`.trim() === String(value).trim()
  );

  if (match) {
    this.editAsset.allocation = match.id;
    console.log("Mapped allocation:", this.editAsset.allocation);
    return;
  }

  // Case C — Value is only employee name
  const byEmployee = this.Allocations.find(
    (a: any) => a.employee.trim() === String(value).trim()
  );

  if (byEmployee) {
    this.editAsset.allocation = byEmployee.id;
    console.log("Mapped allocation:", this.editAsset.allocation);
    return;
  }

  console.warn("No matching allocation found for:", value);
}



  loadAirticketRequest(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.employeeService.getairticketrequest(selectedSchema).subscribe(
        (result: any) => {
          this.Requests = result;
          console.log(' fetching Loantypes:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }
    loademployee(callback?: Function): void {

      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getemployees(selectedSchema).subscribe(
          (result: any) => {
           
           // ✅ Filter employees: show only those who are active or not marked inactive
           this.Employees = result.filter(
           (employee: any) => employee.is_active === true || employee.is_active === null
                );    
            console.log(' fetching Loantypes:');
            if (callback) callback();
    
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }

 mapEmployeeNameToId() {

  if (!this.Employees || !this.editAsset?.employee) return;

  const emp = this.Employees.find(
    (e: any) => e.emp_code === this.editAsset.employee
  );

  if (emp) {
    this.editAsset.employee = emp.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.employee);
}

  loadDeparmentBranch(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any) => {
          this.branches = result;
          console.log(' fetching Companies:');
            if (callback) callback();

        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }

    
  mapBranchesNameToId() {
  if (!this.branches || !this.editAsset?.branch) return;

  const Bran = this.branches.find(
    (b: any) => b.branch_name === this.editAsset.branch
  );

  if (Bran) {
    this.editAsset.branch = Bran.id;  // convert to ID for dropdown
  }

  console.log("Mapped employee_id:", this.editAsset.branch);
}



}
