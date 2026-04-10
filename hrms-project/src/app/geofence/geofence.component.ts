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
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


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
private searchTimer: any;
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

  onSearchInput(query: string) {
    // Clear the previous timer
    if (this.searchTimer) clearTimeout(this.searchTimer);
  
    // Wait 500ms after user stops typing to search
    this.searchTimer = setTimeout(() => {
      this.searchLocation(query);
    }, 500);
  }

  // getCurrentLocation() {
  //   if (!navigator.geolocation) {
  //     alert("Geolocation is not supported by your browser.");
  //     return;
  //   }
  
  //   // Show a small loading state if you like
  //   this.isLoading = true;
  
  //   navigator.geolocation.getCurrentPosition(
  //     (position) => {
  //       const lat = position.coords.latitude;
  //       const lng = position.coords.longitude;
  
  //       // Move the map and marker
  //       this.map.setView([lat, lng], 17);
  //       this.updateLocation(lat, lng, "My Current Location");
        
  //       this.isLoading = false;
  //     },
  //     (error) => {
  //       this.isLoading = false;
  //       console.error("Geolocation Error:", error);
  //       alert("Unable to retrieve your location. Please check your GPS settings.");
  //     },
  //     {
  //       enableHighAccuracy: true,
  //       timeout: 5000,
  //       maximumAge: 0
  //     }
  //   );
  // }

 // 1. Update the Guard to include a size refresh



 getCurrentLocation() {
  // Check if the protocol is secure
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    alert("Geolocation requires a secure connection (HTTPS). Please contact your administrator or use a secure URL.");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  this.isLoading = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      this.map.setView([lat, lng], 17);
      this.updateLocation(lat, lng, "My Current Location");
      this.isLoading = false;
    },
    (error) => {
      this.isLoading = false;
      console.error("Geolocation Error:", error);
      
      if (error.code === 1) {
        alert("Permission Denied: Please ensure your site is using HTTPS and you have allowed location access in your browser settings.");
      } else {
        alert("Unable to retrieve your location. Please check your GPS settings.");
      }
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}



 private initMapGuard() {
  const checkExist = setInterval(() => {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      this.initMap();
      
      // CRITICAL: Leaflet needs a moment for the modal animation to finish
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize(); 
        }
      }, 300); 
      
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
    if (!query || query.trim().length < 3) {
      this.searchResults = [];
      return;
    }
  
    // Coordinate check (Same as before)
    const coordRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const match = query.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        this.searchResults = [];
        this.map.setView([lat, lng], 17);
        this.updateLocation(lat, lng, `Coordinates: ${lat}, ${lng}`);
        return;
      }
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
         window.location.reload();
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
  


  getBranchNames(branchIds: number[]): string {
    if (!this.Branches || !branchIds) return 'None';
    return this.Branches
      .filter(b => branchIds.includes(b.id))
      .map(b => b.branch_name)
      .join(', ');
  }


  showPreviewModal = false;
selectedPreview: any = null;
private previewMap!: L.Map;

viewOnMap(policy: any) {
  this.selectedPreview = policy;
  
  // Smoothly glide the map to the location
  this.previewMap.flyTo([policy.latitude, policy.longitude], 17, {
    animate: true,
    duration: 1.5
  });

  // Clear old layers
  this.previewMap.eachLayer((layer) => {
    if (layer instanceof L.Circle || layer instanceof L.Marker) {
      this.previewMap.removeLayer(layer);
    }
  });

  // Create an attractive glow-boundary
  L.circle([policy.latitude, policy.longitude], {
    radius: policy.radius,
    color: '#3b82f6',       // Blue stroke
    weight: 2,
    fillColor: '#3b82f6',   // Blue fill
    fillOpacity: 0.15,
    className: 'pulsing-circle' // Add a CSS pulse animation
  }).addTo(this.previewMap);

  // Add a sleek marker
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
  
  L.marker([policy.latitude, policy.longitude], { icon }).addTo(this.previewMap);
}
closePreview() {
  this.showPreviewModal = false;
  this.selectedPreview = null;
  if (this.previewMap) {
    this.previewMap.remove();
  }
}


  selectedLocation: any = null;
  private displayMap!: L.Map;
  private layerGroup = L.layerGroup();

  onLocationChange(event: any) {
    const id = event.target.value;
    this.selectedLocation = this.geofencepol.find(loc => loc.id == id);
    
    if (this.selectedLocation) {
      this.updateMapDisplay();
    }
  }

  private updateMapDisplay() {
    const lat = this.selectedLocation.latitude;
    const lng = this.selectedLocation.longitude;
    const radius = this.selectedLocation.radius;
  
    // Small delay to ensure the div is rendered before Leaflet tries to find it
    setTimeout(() => {
      if (!this.displayMap) {
        this.displayMap = L.map('displayMap', {
          zoomControl: false, // Cleaner look for short map
          attributionControl: false // Hide leaflet logo for more space
        }).setView([lat, lng], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.displayMap);
        this.layerGroup.addTo(this.displayMap);
      }
  
      this.layerGroup.clearLayers();
  
      L.circle([lat, lng], {
        radius: radius,
        color: '#0d6efd',
        weight: 2,
        fillColor: '#0d6efd',
        fillOpacity: 0.2,
        interactive: false
      }).addTo(this.layerGroup);
  
      L.marker([lat, lng], { interactive: false }).addTo(this.layerGroup);
  
      this.displayMap.invalidateSize(); // CRITICAL for dynamic short maps
      this.displayMap.flyTo([lat, lng], 17);
    }, 100);
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
  

      fromEvent(window, 'resize')
  .pipe(debounceTime(200))
  .subscribe(() => {
    if (this.map) {
      this.map.invalidateSize();
    }
  });

  
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
      
  
  
  
        
  isgeofence: boolean = false;
  
  
  
  
        openPopus():void{
          this.isgeofence = true;

          this
  
        }
      
       // 2. Update your close method to destroy the map
closeapplicationModal() {
  this.isgeofence = false; // Hide modal

  if (this.map) {
    this.map.remove(); // This destroys the map instance correctly
    (this.map as any) = null; // Clear the variable
  }
  
  this.resetForm();
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
              
                  

            
                    
                  

  
  
  
 


