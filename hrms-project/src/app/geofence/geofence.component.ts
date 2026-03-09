import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import {UserMasterService} from '../user-master/user-master.service';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { DepartmentService } from '../department-report/department.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import {combineLatest, Subscription } from 'rxjs';
import * as L from 'leaflet';


declare var mapillary: any;

@Component({
  selector: 'app-geofence',
  templateUrl: './geofence.component.html',
  styleUrl: './geofence.component.css'
})
export class GeofenceComponent implements AfterViewInit, OnDestroy{

  // @ViewChild('searchBox', { static: false }) searchBox!: ElementRef;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private dataSubscription?: Subscription;


  
  
    level:any='';
    role:any='';
    approver:any='';
  
  
  geofencepol:any []=[];
  
    Approvers:any []=[];
    Branches:any []=[];
    Employees:any []=[];

  

  branch: number[] = [];
  employee: number[] = [];

      
         is_active:  boolean = false;
  
  
  
      Users:any []=[];
  
  
  selectedFile!: File | null;
  
  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  
    Branchs:any []=[];
  
  
    Employee: any[] = [];
  
  

    allSelectedBrach=false;


  
      // @ViewChild('select') select: MatSelect | undefined;
      @ViewChild('selectBrach') selectBrach: MatSelect | undefined;

      @ViewChild('selectEmp') selectEmp: MatSelect | undefined;

      allSelectedEmp=false;
  
private map!: L.Map;
  private marker!: L.Marker;
  private circle!: L.Circle;
  private mlyViewer: any;

  location_name: string = '';
  latitude: number = 25.2048;
  longitude: number = 55.2708;
  radius: number = 50;
  showStreetView: boolean = false;
  
  // To store the list of results
  searchResults: any[] = [];

  ngAfterViewInit() {
    this.initMapGuard();
  }

  private initMapGuard() {
    const checkExist = setInterval(() => {
      if (document.getElementById('map')) {
        this.initMap();
        clearInterval(checkExist);
      }
    }, 100);
  }

  private initMap(): void {
    if (this.map) return;
    this.map = L.map('map').setView([this.latitude, this.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
    this.circle = L.circle([this.latitude, this.longitude], {
      radius: this.radius,
      color: '#1976d2',
      fillOpacity: 0.3
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
      this.searchResults = []; // Close search list on map click
    });
  }

  // Fetch multiple results as user types
  async searchLocation(query: string) {
    if (query.length < 3) {
      this.searchResults = [];
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8`);
      this.searchResults = await res.json();
    } catch (err) {
      console.error("Search Error:", err);
    }
  }

  // When user selects a result from the list
  selectResult(result: any) {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    this.map.setView([lat, lon], 17);
    this.updateLocation(lat, lon, result.display_name);
    this.searchResults = []; // Clear the list after selection
  }

  updateLocation(lat: number, lng: number, name?: string): void {
    this.latitude = lat;
    this.longitude = lng;
    if (name) this.location_name = name;

    this.marker.setLatLng([lat, lng]);
    this.circle.setLatLng([lat, lng]);

    if (this.showStreetView && this.mlyViewer) {
      this.mlyViewer.moveCloseTo(lat, lng).catch(() => {});
    }
  }

  toggleStreetView() {
    this.showStreetView = !this.showStreetView;
    if (this.showStreetView) {
      setTimeout(() => {
        if (!this.mlyViewer) {
          this.mlyViewer = new mapillary.Viewer({
            accessToken: 'MLY|9112261628892418|451651817088927878788',
            container: 'mly',
          });
        }
        this.mlyViewer.moveCloseTo(this.latitude, this.longitude);
      }, 200);
    }
  }

  updateCircle() {
    if (this.circle) this.circle.setRadius(this.radius);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  isLoading = false;

  CreateGeofence() {
    this.isLoading = true;
    // 1. Validation
    if (!this.location_name || !this.latitude || !this.longitude) {
      alert('Please select a location and enter a name.');
      return;
    }
  
    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('location_name', this.location_name);
    formData.append('latitude', this.latitude.toString());
    formData.append('longitude', this.longitude.toString());
    formData.append('radius', this.radius.toString());
    formData.append('is_active', 'true'); // Optional: usually required by backends
  

    this.branch.forEach((id: number) =>
      formData.append('branch', id.toString())
    );
    
    this.employee.forEach((id: number) =>
      formData.append('employee', id.toString())
    );
    

    // 3. Call Service
    this.employeeService.registerGeofence(formData).subscribe({
      next: (response) => {
        console.log('Geofence saved successfully:', response);
        alert('Geofence created successfully!');
        this.resetForm();
        this.isLoading = false;

      },
      error: (err) => {
            this.isLoading = false;

        console.error('Submission failed:', err);
        alert('Failed to save geofence. Please check console for details.');
      }
    });
  }
  
  // Optional helper to clear form after success
  resetForm() {
    this.location_name = '';
    this.radius = 50;
    this.searchResults = [];
    // Keep the map centered but you could reset coordinates if needed
  }
  




  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names
    
    constructor(
      private leaveservice: LeaveService, 
      private authService: AuthenticationService,
      
      private userService: UserMasterService,
  
      private http: HttpClient,
      private DesignationService: DesignationService,
      private sessionService: SessionService,
      private employeeService: EmployeeService,
      private DepartmentServiceService:DepartmentServiceService,
      private categoryService: CatogaryService,
  
    ) {}
  // ngAfterViewInit(): void {
  //   throw new Error('Method not implemented.');
  // }
  
    ngOnInit(): void {
  

       // combineLatest waits for both Schema and Branches to have a value
       this.dataSubscription = combineLatest([
        this.employeeService.selectedSchema$,
        this.employeeService.selectedBranches$
      ]).subscribe(([schema, branchIds]) => {
        if (schema) {
          this.fetchEmployees(schema, branchIds);  
          

        }
      });

       // Listen for sidebar changes so the dropdown updates instantly
  this.employeeService.selectedBranches$.subscribe(ids => {
    this.loadBranch(); 
    this.LoadEmployees();
  });


      // this.loadLoanTypes();
      // this.loadLoanApprovalLevels();
      // this.loadLoanapprover();
  
       this.loadUsers();
      //  this.loadBranch();

  
      //  this.loadgeofence();
  
  
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
      
                     
                      this.hasAddPermission = this.checkGroupPermission('add_overtimepolicy', groupPermissions);
                      console.log('Has add permission:', this.hasAddPermission);
                      
                      this.hasEditPermission = this.checkGroupPermission('change_overtimepolicy', groupPermissions);
                      console.log('Has edit permission:', this.hasEditPermission);
        
                     this.hasDeletePermission = this.checkGroupPermission('delete_overtimepolicy', groupPermissions);
                     console.log('Has delete permission:', this.hasDeletePermission);
        
      
                      this.hasViewPermission = this.checkGroupPermission('view_overtimepolicy', groupPermissions);
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
    }
  }
    
    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
    }
    
    toggleAllSelectionEmp(): void {
      if (this.selectEmp) {
        if (this.allSelectedEmp) {
          
          this.selectEmp.options.forEach((item: MatOption) => item.select());
        } else {
          this.selectEmp.options.forEach((item: MatOption) => item.deselect());
        }
      }
    }

    LoadEmployees(callback?: Function) {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

      console.log('schemastore',selectedSchema )
      // Check if selectedSchema is available
      if (selectedSchema) {
        this.employeeService.getemployeesMasterNew(selectedSchema,savedIds).subscribe(
          (result: any) => {
            this.Employees = result;
            console.log(' fetching Employees:');
            if (callback) callback();
          },
          (error) => {
            console.error('Error fetching Companies:', error);
          }
        );
      }
      }
    
  
  
    
  
   registerButtonClicked = false;
  
  
  // CreateGeofence(): void {
  //   this.registerButtonClicked = true;
  
  //   const formData = new FormData();
  //   // ✅ EXACT backend field names
  //   formData.append('location_name', this.location_name);
  //   formData.append('latitude', this.latitude);
  //   formData.append('longitude', this.longitude);
  //   formData.append('radius', this.radius);
  //   formData.append('is_active', String(this.is_active));
  
  //   this.branch.forEach((id: number) =>
  //   formData.append('branch', id.toString())
  // );
  

  
  //   this.employeeService.registerGeofence(formData).subscribe(
  //     (response) => {
  //       console.log('Registration successful', response);
  //       alert('Geo Fence has been added');
  //       window.location.reload();
  //     },
  //     (error) => {
  //       console.error('Added failed', error);
  
  //       let errorMessage = 'Enter all required fields!';
  
  //       // ✅ Handle backend validation or field-specific errors
  //       if (error.error && typeof error.error === 'object') {
  //         const messages: string[] = [];
  //         for (const [key, value] of Object.entries(error.error)) {
  //           if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
  //           else if (typeof value === 'string') messages.push(`${key}: ${value}`);
  //           else messages.push(`${key}: ${JSON.stringify(value)}`);
  //         }
  //         if (messages.length > 0) errorMessage = messages.join('\n');
  //       } else if (error.error?.detail) {
  //         errorMessage = error.error.detail;
  //       }
  
  //       alert(errorMessage);
  //     }
  //   );
  // }
  
  
  
  
    // loadgeofence(): void {
      
    //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
    //   console.log('schemastore',selectedSchema )
    //   // Check if selectedSchema is available
    //   if (selectedSchema) {
    //     this.employeeService.getGeofence(selectedSchema).subscribe(
    //       (result: any) => {
    //         this.geofencepol = result;
    //         console.log(' fetching Geo Fences:');
    
    //       },
    //       (error) => {
    //         console.error('Error fetching Companies:', error);
    //       }
    //     );
    //   }
    //   }


      // isLoading: boolean = false;

      fetchEmployees(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.employeeService.getGeofenceNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
            this.geofencepol = data;
    
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }
  
  
  
      // loadLoanapprover(): void {
    
      //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
      //   console.log('schemastore',selectedSchema )
      //   // Check if selectedSchema is available
      //   if (selectedSchema) {
      //     this.employeeService.getLoanapprover(selectedSchema).subscribe(
      //       (result: any) => {
      //         this.Approvers = result;
      //         console.log(' fetching Loantypes:');
      
      //       },
      //       (error) => {
      //         console.error('Error fetching Companies:', error);
      //       }
      //     );
      //   }
      //   }
  
  
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
  
       mapUsersNameToId() {
  
    if (!this.Users || !this.editAsset?.approver) return;
  
    const emp = this.Users.find(
      (e: any) => e.username === this.editAsset.approver
    );
  
    if (emp) {
      this.editAsset.approver = emp.id;  // convert to ID for dropdown
    }
  
    console.log("Mapped employee_id:", this.editAsset.approver);
  }
      
  
  
  
        
        iscreateovertimepolicy: boolean = false;
  
  
  
  
        openPopus():void{
          this.iscreateovertimepolicy = true;
  
        }
      
        closeapplicationModal():void{
          this.iscreateovertimepolicy = false;
  
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
      this.geofencepol.forEach(employee => employee.selected = this.allSelecteds);
  
    }
  
    onCheckboxChange(employee: number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }
  
  
  
    isEditModalOpen: boolean = false;
    editAsset: any = {}; // holds the asset being edited
  
openEditModal(asset: any): void {
  this.editAsset = { ...asset };

  // ✅ IMPORTANT: Convert branch to array for mat-select multiple
  if (this.editAsset.branch && !Array.isArray(this.editAsset.branch)) {
    this.editAsset.branch = [this.editAsset.branch];
  }

  this.isEditModalOpen = true;
}

  
    closeEditModal(): void {
      this.isEditModalOpen = false;
      this.editAsset = {};
    }
  
  
    deleteSelectedGeoFence() {
      const selectedEmployeeIds = this.geofencepol
        .filter(employee => employee.selected)
        .map(employee => employee.id);
  
      if (selectedEmployeeIds.length === 0) {
        alert('No States selected for deletion.');
        return;
      }
  
      if (confirm('Are you sure you want to delete the selected Geo Fence ?')) {
  
      let total = selectedEmployeeIds.length;
      let completed = 0;
  
        selectedEmployeeIds.forEach(categoryId => {
          this.employeeService.deleteGeofence(categoryId).subscribe(
            () => {
              console.log(' Geo Fence deleted successfully:', categoryId);
              // Remove the deleted employee from the local list
              this.geofencepol = this.geofencepol.filter(employee => employee.id !== categoryId);
  
                        completed++;
  
              if (completed === total) {          
              alert(' Geo Fence deleted successfully');
              window.location.reload();
              }
  
            },
            (error) => {
              console.error('Error deleting Geo Fence:', error);
              alert('Error deleting Geo Fence: ' + error.statusText);
            }
          );
        });
      }
    }
  
  
updateGeoFenceing(): void {
  if (!this.editAsset.id) {
    alert('Missing Geo Fence ID');
    return;
  }

  // ✅ Convert branch array → single pk
  const payload = {
    ...this.editAsset,
    branch: Array.isArray(this.editAsset.branch)
      ? this.editAsset.branch[0]
      : this.editAsset.branch
  };

  this.employeeService.updateGeofence(this.editAsset.id, payload).subscribe(
    () => {
      alert('Geo Fence updated successfully!');
      this.closeEditModal();
       // combineLatest waits for both Schema and Branches to have a value
       this.dataSubscription = combineLatest([
        this.employeeService.selectedSchema$,
        this.employeeService.selectedBranches$
      ]).subscribe(([schema, branchIds]) => {
        if (schema) {
          this.fetchEmployees(schema, branchIds);  
          

        }
      });
    },
    (error) => {
      console.error('Error updating Geo Fence:', error);

      let errorMsg = 'Update failed';
      if (error?.error && typeof error.error === 'object') {
        errorMsg = Object.keys(error.error)
          .map(key => `${key}: ${error.error[key].join(', ')}`)
          .join('\n');
      }

      alert(errorMsg);
    }
  );
}

  
  
              //  loadBranch(): void {
              
              //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
              
              //   console.log('schemastore',selectedSchema )
              //   // Check if selectedSchema is available
              //   if (selectedSchema) {
              //     this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
              //       (result: any) => {
              //         this.Branches = result;
              //         console.log(' fetching Companies:');
              
              //       },
              //       (error) => {
              //         console.error('Error fetching Companies:', error);
              //       }
              //     );
              //   }
              //   }


                loadBranch(callback?: Function): void {
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
            this.Branches = this.Branches[0].id;
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

            
                  toggleAllSelectionBrach(): void {
                    if (this.selectBrach) {
                      if (this.allSelectedBrach) {
                        this.selectBrach.options.forEach((item: MatOption) => item.select());
                      } else {
                        this.selectBrach.options.forEach((item: MatOption) => item.deselect());
                      }
                    }
                  }
              
                }
              
                  

            
                    
                  

  
  
  
 


