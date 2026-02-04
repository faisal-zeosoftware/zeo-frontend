import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild  } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CountryService } from '../country.service';
import { EmployeeService } from '../employee-master/employee.service';
import { MatMenuTrigger } from '@angular/material/menu';

interface FieldSetting {
  key: string;
  label: string;
  visible: boolean;
}


@Component({
  selector: 'app-leave-balance-report',
  templateUrl: './leave-balance-report.component.html',
  styleUrl: './leave-balance-report.component.css'
})
export class LeaveBalanceReportComponent {


  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

     @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;


  
  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  hasExportPermission: boolean = false;
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names


  selectedFile: File | null = null;

  originalData: any[] = [];
  displayData: any[] = [];
  savedReports: any[] = [];
  fieldSettings: any[] = [];
  uniqueStatuses: string[] = [];
  
  searchText: string = '';
  currentGroupBy: string[] = [];
    // activeFilters: any = { status: {} };
  customFileName: string = '';
  isLoading: boolean = false;

  // Add these to your component properties
activeFilters: { [key: string]: { [val: string]: boolean } } = {};
// 1. Define which fields you want to show filters for
// Update these in your TS class
// Define fields specifically for Leave Reports
filterFields: string[] = ['emp_branch_id', 'emp_dept_id', 'leave_type', 'employee'];
// Use 'start_date' or 'applied_on' from your JSON for the date range filter
dateField: string = 'start_date';

// 2. The helper function that was missing
getKeys(obj: any): string[] {
  return obj ? Object.keys(obj) : [];
}

constructor(private leaveService: LeaveService,
  private http: HttpClient,
  private countryService: CountryService, 
  private authService: AuthenticationService,
  private employeeService: EmployeeService,
  private sessionService: SessionService,
   private DesignationService: DesignationService,
) {}
// FIX FOR NG5002: Use a getter for the count
get visibleFieldsCount(): number {
  return this.fieldSettings.filter(f => f.visible).length;
}

ngOnInit(): void {
  this.initialLoad();


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
          this.hasExportPermission = true;
      
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
                  this.hasExportPermission = true;

                } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                  const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                  console.log('Group Permissions:', groupPermissions);
  
                 
                 this.hasAddPermission = this.checkGroupPermission('add_lvbalancereport', groupPermissions);
                 console.log('Has add permission:', this.hasAddPermission);
                  
                 this.hasEditPermission = this.checkGroupPermission('change_lvbalancereport', groupPermissions);
                 console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_lvbalancereport', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                 this.hasViewPermission = this.checkGroupPermission('view_lvbalancereport', groupPermissions);
                 console.log('Has view permission:', this.hasViewPermission);

                 this.hasExportPermission = this.checkGroupPermission('lv_balance_export_report', groupPermissions);
                 console.log('Has export permission:', this.hasExportPermission);

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

 checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }



async initialLoad() {
  this.isLoading = true;
  try {
    const fieldRes = await this.leaveService.getAvailableFieldsLeaveBalaceReport().toPromise();
    this.fieldSettings = Object.keys(fieldRes.available_fields).map(key => ({
      key: key,
      label: fieldRes.available_fields[key],
      visible: true
    }));

    this.fetchSavedReportsList();
    this.fetchStandardReport();
  } catch (error) {
    console.error("Init Error", error);
  } finally {
    this.isLoading = false;
  }
}

fetchSavedReportsList() {
  this.leaveService.getLeaveBalanceReport().subscribe(res => {
    this.savedReports = res;
  });
}

fetchStandardReport() {
  this.leaveService.getLeaveBalanceReport().subscribe(res => {
    if (res && res.length > 0) {
      // 1. Find the report where file_name is 'std_report'
      const defaultReport = res.find(report => report.file_name === 'lvbalance_std_report');
      
      // 2. If found, load its data. Otherwise, fallback to the first one available.
      if (defaultReport) {
        this.loadJsonData(defaultReport.report_data);
      } else {
        // Fallback logic if std_report doesn't exist
        this.loadJsonData(res[0].report_data);
      }
    }
  });
}

loadJsonData(url: string) {
  this.leaveService.fetchAssetJsonData(url).subscribe(data => {
    this.originalData = data || [];
    
    // Auto-detect columns from the loaded JSON data
    if (this.originalData.length > 0) {
       const keys = Object.keys(this.originalData[0]);
       this.fieldSettings.forEach(f => {
         // Show the column only if it exists in the standard report data
         f.visible = keys.includes(f.key);
       });
    }

    this.extractUniqueStatuses();
    this.applyFilters();
  });
}


extractUniqueStatuses() {
  this.filterFields.forEach(field => {
    // Get unique values and convert to readable strings
    const uniqueValues = [...new Set(this.originalData.map(item => {
        if (item[field] === null || item[field] === undefined) return 'Unassigned';
        return item[field];
    }))];
    
    if (!this.activeFilters[field]) {
      this.activeFilters[field] = {};
    }

    uniqueValues.forEach(val => {
      const stringVal = String(val);
      if (this.activeFilters[field][stringVal] === undefined) {
        this.activeFilters[field][stringVal] = false;
      }
    });
  });
}

drop(event: CdkDragDrop<string[]>) {
  // moveItemInArray is a built-in CDK utility that handles the index swap
  moveItemInArray(this.fieldSettings, event.previousIndex, event.currentIndex);
  
  // Optional: If you want to persist the new order immediately
  this.applyFilters();
}



// Add this property to your component
expandedCategories: { [key: string]: boolean } = {};

// Add this method to toggle the state
toggleCategory(field: string) {
  this.expandedCategories[field] = !this.expandedCategories[field];
}

applyFilters() {
  let temp = [...this.originalData];

  // 1. Global Search (Searches across all fields)
  if (this.searchText) {
    const search = this.searchText.toLowerCase();
    temp = temp.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(search))
    );
  }

  // 2. Dynamic Checkbox Filtering (Branch, Dept, Leave Type, etc.)
  this.filterFields.forEach(field => {
    const selectedValues = Object.keys(this.activeFilters[field] || {})
      .filter(key => this.activeFilters[field][key]);

    if (selectedValues.length > 0) {
      temp = temp.filter(item => {
        // Handle null/undefined values as 'Unassigned' to match the UI
        const rawValue = item[field];
        const itemValue = (rawValue === null || rawValue === undefined || rawValue === '') 
                          ? 'Unassigned' 
                          : String(rawValue);
        return selectedValues.includes(itemValue);
      });
    }
  });

  // 3. Date Range Filtering (Using updated_at)
  if (this.startDate || this.endDate) {
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;

    // Set time boundaries for accurate comparison
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    temp = temp.filter(item => {
      const dateValue = item[this.dateField];
      if (!dateValue) return false;
      
      const itemDate = new Date(dateValue);
      if (start && end) return itemDate >= start && itemDate <= end;
      if (start) return itemDate >= start;
      if (end) return itemDate <= end;
      return true;
    });
  }

  this.displayData = temp;
}


saveCustomFile(): void {
  // 1. Get Schema from LocalStorage
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.customFileName.trim()) return;

  // 2. Prepare the URL
  const url = `${this.apiUrl}/calendars/api/lvBalanceReport/generate_leave_report/?schema=${selectedSchema}`;
  
  // 3. Construct FormData (Following your model's logic)
  const formData = new FormData();
  formData.append('file_name', this.customFileName.trim());

  // 4. Map and append selected field keys
  // Only fields that are toggled 'visible' in your UI are added
  const allFieldsToSubmit = this.fieldSettings
    .filter(field => field.visible && field.key.trim() !== '')
    .map(field => field.key.trim());

  if (allFieldsToSubmit.length === 0) return;

  // Append each field key to the 'fields' parameter
  allFieldsToSubmit.forEach(fieldKey => {
    formData.append('fields', fieldKey);
  });

  // 5. POST Method
  this.isLoading = true;
  this.http.post<any>(url, formData).subscribe({
    next: (response) => {
      console.log('Report generated successfully:', response);
      
      if (response.status === 'success') {
        this.customFileName = ''; // Reset input
        this.fetchSavedReportsList(); // Refresh the list of saved files
        
        // Optional: reload if your backend requires a fresh state
        // window.location.reload(); 
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error generating report:', error);
      this.isLoading = false;
    }
  });
}



loadSavedReport(report: any) {
  this.isLoading = true;
  this.leaveService.fetchAssetJsonData(report.report_data).subscribe(jsonData => {
    if (jsonData && jsonData.length > 0) {
      const savedKeys = Object.keys(jsonData[0]);
      this.fieldSettings.forEach(f => f.visible = savedKeys.includes(f.key));
      this.displayData = jsonData;
      this.originalData = jsonData;
    }
    this.isLoading = false;
  }, error => {
    this.isLoading = false;
    alert("Report not found or file empty.");
  });
}

downloadExcel() {
  const visibleFields = this.fieldSettings.filter(f => f.visible);
  let exportRows: any[] = [];

  // Iterate through the grouped structure to maintain the visual order
  this.groupedData.forEach(group => {
    
    // Optional: Add a "Header Row" in Excel for the group name if grouping is active
    if (this.currentGroupBy.length > 0) {
      const headerRow: any = {};
      headerRow[visibleFields[0].label] = `--- GROUP: ${group.groupName.toUpperCase()} ---`;
      exportRows.push(headerRow);
    }

    // CASE: Nested Grouping (length > 1)
    if (this.currentGroupBy.length > 1) {
      group.children.forEach((sub: any) => {
        // Optional: Sub-group header
        const subHeader: any = {};
        subHeader[visibleFields[0].label] = `   > ${sub.groupName}`;
        exportRows.push(subHeader);

        sub.children.forEach((item: any) => {
          exportRows.push(this.mapItemToRow(item, visibleFields));
        });
      });
    } 
    // CASE: Single Group or Standard View
    else {
      group.children.forEach((item: any) => {
        exportRows.push(this.mapItemToRow(item, visibleFields));
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Filtered Assets');
  
  const fileName = this.customFileName || 'Leave_Balance_Report';
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// Helper to map data keys to readable Labels
private mapItemToRow(item: any, visibleFields: any[]) {
  let row: any = {};
  visibleFields.forEach(f => {
    row[f.label] = item[f.key] || '-';
  });
  return row;
}

resetToStandard() {
  this.searchText = '';
  this.currentGroupBy = [];
  // Reset all status checkboxes to false
  // Object.keys(this.activeFilters.status).forEach(key => this.activeFilters.status[key] = false);
  this.fetchStandardReport(); 
}


// 2. Updated Method to toggle multiple selections
setGroupBy(key: string) {
  const index = this.currentGroupBy.indexOf(key);
  if (index > -1) {
    this.currentGroupBy.splice(index, 1); // Remove if already selected
  } else {
    this.currentGroupBy.push(key); // Add new grouping level
  }
  this.applyFilters();
}


get groupedData(): any[] {
  // If no grouping is selected, wrap all data in a single "All Records" group
  if (!this.currentGroupBy || this.currentGroupBy.length === 0) {
    return [{ 
      groupName: 'All Records', 
      children: this.displayData, 
      level: 0 
    }];
  }

  const groupRecursive = (data: any[], groupByKeys: string[], level: number): any[] => {
    if (groupByKeys.length === 0) return data;

    const currentKey = groupByKeys[0];
    const remainingKeys = groupByKeys.slice(1);

    const groups = data.reduce((acc, item) => {
      let val = item[currentKey];
      if (val === null || val === undefined || val === '') val = 'Unassigned';
      
      if (!acc[val]) acc[val] = [];
      acc[val].push(item);
      return acc;
    }, {} as any);

    return Object.keys(groups).map(name => ({
      groupName: name,
      level: level,
      // If there are more keys to group by, recurse deeper
      children: remainingKeys.length > 0 
                ? groupRecursive(groups[name], remainingKeys, level + 1) 
                : groups[name]
    }));
  };

  return groupRecursive(this.displayData, this.currentGroupBy, 0);
}


// Component Properties
startDate: string = '';
endDate: string = '';

// Method to clear dates
clearDates() {
  this.startDate = '';
  this.endDate = '';
  this.applyFilters();
}


deleteReport(report: any, event: Event) {
  event.stopPropagation(); // Stop from loading the report when clicking delete

  // STRICT CONDITION: Block if ID is 1 or Name is std_report
  if (report.id === 1 || report.file_name === 'lvbalance_std_report') {
    // You can use a snackbar or toast here instead of alert
    alert("Permission Denied: The Standard Report is a system requirement and cannot be deleted.");
    return;
  }

  // Proceed with deletion for all other IDs
  if (confirm(`Are you sure you want to delete "${report.file_name}"?`)) {
    this.isLoading = true;
    this.leaveService.deleteLeaveBalanceReport(report.id).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.fetchSavedReportsList(); // Refresh list
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Delete failed", err);
      }
    });
  }
}

ClosePopup(): void {
  this.menuTrigger.closeMenu();
}
    
}
