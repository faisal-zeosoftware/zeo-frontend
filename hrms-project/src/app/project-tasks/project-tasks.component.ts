import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { environment } from '../../environments/environment';
import {  HttpErrorResponse } from '@angular/common/http';
import { CountryService } from '../country.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
@Component({
  selector: 'app-project-tasks',
  templateUrl: './project-tasks.component.html',
  styleUrl: './project-tasks.component.css'
})
export class ProjectTasksComponent {

  
  @ViewChild('select') select: MatSelect | undefined;
  @ViewChild('selectMng') selectMng: MatSelect | undefined;

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

   

  allSelectedEmp=false;
  allSelectedMng=false;


  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  title: any = '';
  start_date: any = '';
  end_date: any = '';
  description: any = '';
  task_managers: any = '';


  project: any = '';
  stage: any = '';
  managers: any = '';

  task_members: any = '';

  status: any = '';
  sequence: any = '';

  is_active:  boolean = false;

  selectedFile: File | null = null;


  Users:any []=[];
  LoanTypes:any []=[];

  Employees:any []=[];

  Stages:any []=[];
  Tasks:any []=[];
  Projects:any []=[];


  customFieldHeaders: { custom_field_id: number, custom_field_name: string }[] = [];



  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;


  custom_fieldsFam :any[] = [];



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
    private countryService:CountryService,


    


) {}

ngOnInit(): void {
 
  this.loadUsers();
  this.loadLAssetType();
  this.loadProjects();
  this.loadStages();
  this.loadProjectsTask();

  this.loadCountries();

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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_requesttype', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_requesttype', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_requesttype', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_requesttype', groupPermissions);
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
  

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  toggleAllSelectionEmp(): void {
    if (this.select) {
      if (this.allSelectedEmp) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }


  
  toggleAllSelectionMng(): void {
    if (this.selectMng) {
      if (this.allSelectedMng) {
        this.selectMng.options.forEach((item: MatOption) => item.select());
      } else {
        this.selectMng.options.forEach((item: MatOption) => item.deselect());
      }
    }
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


          CreateProject(): void {
            this.registerButtonClicked = true;
          
            if (!this.selectedFile) {
              alert("Please upload a document");
              return;
            }
          
            const formData = new FormData();
          
            formData.append('title', this.title);
            formData.append('status', this.status);
            formData.append('start_date', this.start_date);
            formData.append('end_date', this.end_date);
            formData.append('description', this.description);
            formData.append('sequence', this.sequence);
            formData.append('project', this.project);
            formData.append('stage', this.stage);

            formData.append('is_active', this.is_active ? 'true' : 'false');
          
            // Convert arrays (managers and members) to JSON strings or loop and append each
            this.task_managers.forEach((id: number) => formData.append('task_managers', id.toString()));
            this.task_members.forEach((id: number) => formData.append('task_members', id.toString()));
          
            // Add file
            formData.append('document', this.selectedFile);
          
            this.employeeService.registerProjectTask(formData).subscribe(
              (response) => {
                console.log('Registration successful', response);
                alert('Project Task has been Created.');
                window.location.reload();
              },
              (error) => {
                console.error('Add failed', error);
                alert('Enter all fields correctly!');
              }
            );
          }
          

          loadLTasks(): void {
    
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
            console.log('schemastore',selectedSchema )
            // Check if selectedSchema is available
            if (selectedSchema) {
              this.employeeService.getProjectsTask(selectedSchema).subscribe(
                (result: any) => {
                  this.Tasks = result;
                  console.log(' fetching Loantypes:');
          
                },
                (error) => {
                  console.error('Error fetching Companies:', error);
                }
              );
            }
            }
        
      
  

loadLAssetType(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.employeeService.getemployees(selectedSchema).subscribe(
      (result: any) => {
        // ✅ Filter employees: show only those who are active or not marked inactive
        this.Employees = result.filter(
          (employee: any) => employee.is_active === true || employee.is_active === null
        );

        console.log('Filtered Employees:', this.Employees);
      },
      (error) => {
        console.error('Error fetching employees:', error);
      }
    );
  }
}

        


            loadProjects(): void {
    
              const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
            
              console.log('schemastore',selectedSchema )
              // Check if selectedSchema is available
              if (selectedSchema) {
                this.employeeService.getProjects(selectedSchema).subscribe(
                  (result: any) => {
                    this.Projects = result;
                    console.log(' fetching Loantypes:');
            
                  },
                  (error) => {
                    console.error('Error fetching Companies:', error);
                  }
                );
              }
              }
          

              loadProjectsTask(): void {
    
                const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
              
                console.log('schemastore',selectedSchema )
                // Check if selectedSchema is available
                if (selectedSchema) {
                  this.employeeService.getProjectsTask(selectedSchema).subscribe(
                    (result: any) => {
                      this.Tasks = result;
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
    this.LoanTypes.forEach(employee => employee.selected = this.allSelected);

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }



    isEditModalOpen: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset }; // copy asset data
  this.isEditModalOpen = true;
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

  this.employeeService.updateAirpolicy(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Asset  updated successfully!');
      this.closeEditModal();
      this.loadLAssetType(); // reload updated list
    },
    (error) => {
      console.error('Error updating asset:', error);
      alert('Update failed');
    }
  );
}


deleteSelectedAssetType() { 
  const selectedEmployeeIds = this.LoanTypes
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Asset type selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Asset ?')) {
    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteAirPolicy(categoryId).subscribe(
        () => {
          console.log('policy  deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.LoanTypes = this.LoanTypes.filter(employee => employee.id !== categoryId);
          alert(' policy  deleted successfully');
          window.location.reload();

        },
        (error) => {
          console.error('Error deleting Category:', error);
        }
      );
    });
  }
}

loadStages(): void {
    
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore',selectedSchema )
  // Check if selectedSchema is available
  if (selectedSchema) {
    this.employeeService.getProjectsStages(selectedSchema).subscribe(
      (result: any) => {
        this.Stages = result;
        console.log(' fetching Stages:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }
  }



countries:any[]=[];
loadCountries(): void {
  this.countryService.getCountries().subscribe(
    (result: any) => {
      this.countries = result;
    },
    (error) => {
      console.error('Error fetching countries:', error);
    }
  );
}




}
