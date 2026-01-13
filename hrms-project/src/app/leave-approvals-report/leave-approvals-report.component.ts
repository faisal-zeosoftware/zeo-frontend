
import { HttpClient } from '@angular/common/http';
import { Component, OnInit  } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

interface FieldSetting {
  key: string;
  label: string;
  visible: boolean;
}


@Component({
  selector: 'app-leave-approvals-report',
  templateUrl: './leave-approvals-report.component.html',
  styleUrl: './leave-approvals-report.component.css'
})
export class LeaveApprovalsReportComponent {

  
  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  
  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
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

// Define fields for Leave Approval Report
filterFields: string[] = ['emp_branch_id', 'status', 'approver', 'emp_dept_id', 'emp_desgntn_id'];

// Use 'updated_at' for the date range filter
dateField: string = 'updated_at';

// 2. The helper function that was missing
getKeys(obj: any): string[] {
  return obj ? Object.keys(obj) : [];
}

constructor(private leaveService: LeaveService,
  private http: HttpClient,
) {}
// FIX FOR NG5002: Use a getter for the count
get visibleFieldsCount(): number {
  return this.fieldSettings.filter(f => f.visible).length;
}

ngOnInit(): void {
  this.initialLoad();
}

async initialLoad() {
  this.isLoading = true;
  try {
    const fieldRes = await this.leaveService.getAvailableFieldsLeaveApprovalReport().toPromise();
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
  this.leaveService.getLeaveApprovalReport().subscribe(res => {
    this.savedReports = res;
  });
}

fetchStandardReport() {
  this.leaveService.getLeaveApprovalReport().subscribe(res => {
    if (res && res.length > 0) {
      // 1. Find the report where file_name is 'std_report'
      const defaultReport = res.find(report => report.file_name === 'lv_approv_std_report');
      
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
    // FLATTEN logic: extract status and approver from the first approval entry
    this.originalData = (data || []).map((item: any) => {
      const firstApproval = item.approvals && item.approvals.length > 0 ? item.approvals[0] : {};
      return {
        ...item,
        status: firstApproval.status || 'No Status',
        approver: firstApproval.approver || 'Unassigned',
        // Ensure date is searchable by stripping time if needed
        updated_at_flat: item.updated_at ? item.updated_at.split(' ')[0] : null 
      };
    });

    if (this.originalData.length > 0) {
       const keys = Object.keys(this.originalData[0]);
       this.fieldSettings.forEach(f => {
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

  // 1. Global Search
  if (this.searchText) {
    const search = this.searchText.toLowerCase();
    temp = temp.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(search))
    );
  }

  // 2. Dynamic Checkbox Filtering
  this.filterFields.forEach(field => {
    const selectedValues = Object.keys(this.activeFilters[field] || {})
      .filter(key => this.activeFilters[field][key]);

    if (selectedValues.length > 0) {
      temp = temp.filter(item => {
        const val = item[field];
        const itemValue = (val === null || val === undefined || val === '') ? 'Unassigned' : String(val);
        return selectedValues.includes(itemValue);
      });
    }
  });

  // 3. Date Range Filtering
  if (this.startDate || this.endDate) {
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    temp = temp.filter(item => {
      const dateStr = item[this.dateField];
      if (!dateStr) return false;
      
      const itemDate = new Date(dateStr);
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
  const url = `${this.apiUrl}/calendars/api/Lv_Approval_Report/generate_leave_report/?schema=${selectedSchema}`;
  
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
  
  const fileName = this.customFileName || 'Leave_Approval_Report';
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
  if (!this.currentGroupBy || this.currentGroupBy.length === 0) {
    return [{ groupName: 'All Approvals', children: this.displayData, level: 0 }];
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
  if (report.id === 1 || report.file_name === 'lv_approv_std_report') {
    // You can use a snackbar or toast here instead of alert
    alert("Permission Denied: The Standard Report is a system requirement and cannot be deleted.");
    return;
  }

  // Proceed with deletion for all other IDs
  if (confirm(`Are you sure you want to delete "${report.file_name}"?`)) {
    this.isLoading = true;
    this.leaveService.deleteLeaveApprovalReport(report.id).subscribe({
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

    
}
