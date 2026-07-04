import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';
import { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs';
import { DepartmentServiceService } from '../department-master/department-service.service';



@Component({
  selector: 'app-document-request-level',
  templateUrl: './document-request-level.component.html',
  styleUrl: './document-request-level.component.css'
})

export class DocumentRequestLevelComponent {

      
          private dataSubscription?: Subscription;
  @ViewChild('select') select: MatSelect | undefined;

  allSelected=false;

  Branches: any[] = []; // Array to store schema names


  role:any='';
  level:any='' ;
  request_type:any='' ;
  approval_type: any = '';

  approver:any='' ;
  branch: any = '';




  is_compensatory: boolean = false;

  registerButtonClicked: boolean = false;

 approvalLevels:any []=[];

  LeaveTypes: any[] = [];
  LeaveapprovalLevels: any[] = [];

  Users: any[] = [];

  DocType: any[] = [];

    DocRequest: any[] = [];

      isLoading: boolean = false;


  hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private employeeService:EmployeeService,

    private userService: UserMasterService,

    private DesignationService: DesignationService,
     private DepartmentServiceService: DepartmentServiceService
  
    ) {}

    ngOnInit(): void {
                this.dataSubscription = combineLatest([
                  this.employeeService.selectedSchema$,
                  this.employeeService.selectedBranches$
                ]).subscribe(([schema, branchIds]) => {
                  if (schema) {
                    this.fetchEmployees(schema, branchIds);

        
                  }
                });

                          this.LoadLeavetype();
      
      this.LoadLeaveApprovalLevel();

      this.LoadDocType();
      this.LoadDocRequest();




           
      this.loadUsers();



  

      this.employeeService.selectedBranches$.subscribe(ids => {
        this.loadDeparmentBranch(); 
      });

    

      
      

      this.userId = this.sessionService.getUserId();
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property


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

               
                this.hasAddPermission = this.checkGroupPermission('add_documentapprovallevel', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_documentapprovallevel', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_documentapprovallevel', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_documentapprovallevel', groupPermissions);
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


    

  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }



  toggleAllSelection(): void {
    if (this.select) {
      if (this.allSelected) {
        
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  


    loadDeparmentBranch(callback?: Function): void {
    const selectedSchema = this.authService.getSelectedSchema();
    
    if (selectedSchema) {
      this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
        (result: any[]) => {
          // 1. Get the sidebar selected IDs from localStorage
          const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
  
          // 2. Filter the API result to only include branches selected in the sidebar
          // If sidebar is empty, you might want to show all, or show none. 
          // Usually, we show only the selected ones:
          if (sidebarSelectedIds.length > 0) {
            this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
          } else {
            this.Branches = result; // Fallback: show all if nothing is selected in sidebar
          }
          // Inside the subscribe block of loadDeparmentBranch
          if (this.Branches.length === 1) {
            this.branch = this.Branches[0].id;
          }
  
          console.log('Filtered branches for selection:', this.Branches);
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching branches:', error);
        }
      );
    }
  }


  
mapBranchesNameToId() {
  if (!this.Branches || !this.editAsset) return;

  let value = this.editAsset.branch;

  if (!value) {
    this.editAsset.branch = [];
    return;
  }

  // already array of numbers
  if (Array.isArray(value) && typeof value[0] === 'number') {
    return;
  }

  // single number
  if (typeof value === 'number') {
    this.editAsset.branch = [value];
    return;
  }

  // single string (branch name)
  if (typeof value === 'string') {
    const found = this.Branches.find(b => b.branch_name === value);
    this.editAsset.branch = found ? [found.id] : [];
    return;
  }

  // array of names
  if (Array.isArray(value)) {
    this.editAsset.branch = this.Branches
      .filter(b => value.includes(b.branch_name))
      .map(b => b.id);
  }

  console.log('✅ Final mapped branch:', this.editAsset.branch);
}
  
  

LoadLeavetype() {

  const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }

  this.leaveService.getLeaveType(selectedSchema).subscribe(
    (data: any) => {
      this.LeaveTypes = data;
    },
    error => console.error(error)
  );
}
  
  

    LoadLeaveApprovalLevel() {
        const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }
      this.leaveService.getDocReqApprovalLevel(selectedSchema).subscribe(
        (data: any) => {
          this.LeaveapprovalLevels = data;
        
          console.log('employee:', this.LeaveTypes);
        },
        (error: any) => {
          console.error('Error fetching categories:', error);
        }
      );
    }
  
 
  
    // LoadUsers(selectedSchema: string) {
    //   this.leaveService.getUsers(selectedSchema).subscribe(
    //     (data: any) => {
    //       this.Users = data;
        
    //       console.log('employee:', this.LeaveTypes);
    //     },
    //     (error: any) => {
    //       console.error('Error fetching categories:', error);
    //     }
    //   );
    // }


    // non-ess-users usermaster services

      loadUsers(callback?: Function): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.userService.getApprover(selectedSchema).subscribe(
      (result: any) => {
        this.Users = result;
        console.log(' fetching Companies:');
         if (callback) callback();

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }


  

    LoadDocType() {
        const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }
      this.leaveService.getDocRequestType(selectedSchema).subscribe(
        (data: any) => {
          this.DocType = data;
        
          console.log('DocType:', this.DocType);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  

    LoadDocRequest() {
        const selectedSchema = this.authService.getSelectedSchema();

  if (!selectedSchema) {
    return;
  }
      this.leaveService.getDocRequest(selectedSchema).subscribe(
        (data: any) => {
          this.DocRequest = data;
        
          console.log('DocRequest:', this.DocRequest);
        },
        (error: any) => {
          console.error('Error fetching DocType:', error);
        }
      );
    }
  
          fetchEmployees(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.leaveService.getemployeesDocumentrequestApprovalLevel(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
                 this.LeaveapprovalLevels = data;
  
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }




SetLeaveApprovaLevel(): void {
  this.registerButtonClicked = true;

  // ✅ VALIDATION
  if (!this.branch || this.branch.length === 0) {
    alert('Please select branch');
    return;
  }

  if (this.approval_type === 'multi_approval') {
    for (let i = 0; i < this.levels.length; i++) {
      const lvl = this.levels[i];

      if (!lvl.level || !lvl.role || !lvl.approver) {
        alert(`Level ${i + 1}: Level Added`);
        return;
      }
    }
  }

  // ✅ CLEAN JSON PAYLOAD (recommended over FormData for arrays)
const payload: any = {
  request_type: this.request_type,
  approval_type: this.approval_type,
  branch: this.branch
};

if (this.approval_type === 'multi_approval') {
  payload.levels = this.levels.map(lvl => ({
    level: Number(lvl.level),
    role: lvl.role,
    approver: Number(lvl.approver)
  }));
}


  this.leaveService.CreateDocRequestapprovalLevel(payload).subscribe(
    (response) => {
      console.log('Registration successful', response);

      alert('Document Request Approval Level has been Created');

      window.location.reload();
    },
    (error) => {
      console.error(error);
    }
  );
}



    
  iscreateLoanApp: boolean = false;




openPopus(): void {

  this.iscreateLoanApp = true;

  this.branch = [];
 

  // ✅ Auto select first branch
  if (this.Branches && this.Branches.length > 0) {

    this.branch = [this.Branches[0].id];

    // optional: update select-all checkbox
    this.allSelected = false;
  }

}

  closeapplicationModal():void{
    this.iscreateLoanApp = false;

  }






   

showEditBtn: boolean = false;

EditShowButtons() {
this.showEditBtn = !this.showEditBtn;
}


Delete: boolean = false;
allSelecteds: boolean = false;

toggleCheckboxes() {
this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
this.allSelecteds = !this.allSelecteds;
this.LeaveapprovalLevels.forEach(employee => employee.selected = this.allSelecteds);

}

onCheckboxChange(employee:number) {
// No need to implement any logic here if you just want to change the style.
// You can add any additional logic if needed.
}



isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset:any){

   this.editAsset=JSON.parse(JSON.stringify(asset));

   this.loadUsers(()=>{

      this.mapBranchesNameToId();

      const req=this.DocType.find(
        x=>x.type_name===this.editAsset.request_type
      );

      if(req){
         this.editAsset.request_type=req.id;
      }

      this.editAsset.levels.forEach((lvl:any)=>{

         const user=this.Users.find(
            u=>u.username===lvl.approver
         );

         if(user){
            lvl.approver=user.id;
         }

      });

      this.isEditModalOpen=true;

   });

}

addEditLevel() {
  if (!this.editAsset.levels) {
    this.editAsset.levels = [];
  }

  this.editAsset.levels.push({
    level: this.editAsset.levels.length + 1,
    role: '',
    approver: null
  });
}

removeEditLevel(index: number) {
  this.editAsset.levels.splice(index, 1);

  // ✅ re-order levels after delete
  this.editAsset.levels.forEach((lvl: any, i: number) => {
    lvl.level = i + 1;
  });
}

closeEditModal(): void {
this.isEditModalOpen = false;
this.editAsset = {};
}


deleteSelectedAssetType() { 
const selectedEmployeeIds = this.LeaveapprovalLevels
.filter(employee => employee.selected)
.map(employee => employee.id);

if (selectedEmployeeIds.length === 0) {
alert('No States selected for deletion.');
return;
}

if (confirm('Are you sure you want to delete the selected Document Request Approvel Level ?')) {

    let total = selectedEmployeeIds.length;
    let completed = 0;

selectedEmployeeIds.forEach(categoryId => {
  this.employeeService.deleteDocReqApprovallevel(categoryId).subscribe(
    () => {
      console.log(' Document Type deleted successfully:', categoryId);
      // Remove the deleted employee from the local list
      this.LeaveapprovalLevels = this.LeaveapprovalLevels.filter(employee => employee.id !== categoryId);
       completed++;
        if (completed === total) {
      alert(' Document Request Approvel Level  deleted successfully');
      window.location.reload();
        }

    },
    (error) => {
      console.error('Error deletingDocument Request:', error);
     alert('Error deleting Document Request: ' + error.statusText);
    }
  );
});
}
}

onEditApprovalTypeChange() {
  if (this.editAsset.approval_type !== 'multi_approval') {
    this.editAsset.levels = []; // clear levels
  } else {
    if (!this.editAsset.levels || this.editAsset.levels.length === 0) {
      this.editAsset.levels = [
        { level: 1, role: '', approver: null }
      ];
    }
  }
}


updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  // ✅ ONLY process levels if multi approval
  let formattedLevels: any[] = [];

  if (this.editAsset.approval_type === 'multi_approval') {
    formattedLevels = this.editAsset.levels.map((lvl: any, index: number) => ({
      ...lvl,
      level: index + 1, // ✅ FIX: auto sequence
      approver: Number(lvl.approver)
    }));
  }

  const payload = {
    ...this.editAsset,
    level: formattedLevels.length, // total levels
    levels: formattedLevels
  };

  this.employeeService.updateDocReqApprovallevel(this.editAsset.id, payload).subscribe(
    (response) => {
      alert('Document Request Approval Level updated successfully!');
      this.closeEditModal();
      window.location.reload();
    },
    (error) => {
      console.error('Error updating:', error);

      let errorMsg = 'Update failed';
      const backendError = error?.error;

      if (backendError && typeof backendError === 'object') {
        errorMsg = Object.keys(backendError)
          .map(key => `${key}: ${backendError[key].join(', ')}`)
          .join('\n');
      }

      alert(errorMsg);
    }
  );
}

    branchSearch: string = '';
allBranchSelected: boolean = false;

// toggleAllEmployees() {

//   if (this.allBranchSelected) {

//     this.deparmentsec = this.Branches.map((emp: any) => emp.id);

//   } else {

//     this.deparmentsec = [];

//   }

// }

filterEmployees() {

  if (!this.branchSearch) {
    return this.Branches;
  }

  return this.Branches.filter((deparmentsec: any) =>
    deparmentsec.branch_name.toLowerCase().includes(this.branchSearch.toLowerCase())
  );

}


  levels: any[] = [
  {
    level: '',
    role: '',
    approver: '',
  }
];

addLevel() {
  this.levels.push({
    level: '',
    role: '',
    approver: '',
  });
}

removeLevel(index: number) {
  this.levels.splice(index, 1);
}

}
