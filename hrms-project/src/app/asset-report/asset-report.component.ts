import { HttpClient } from '@angular/common/http';
import { Component, OnInit  } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';

interface FieldSetting {
  key: string;
  label: string;
  visible: boolean;
}


@Component({
  selector: 'app-asset-report',
  templateUrl: './asset-report.component.html',
  styleUrl: './asset-report.component.css'
})
export class AssetReportComponent {

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
  currentGroupBy: string | null = null;
  activeFilters: any = { status: {} };
  customFileName: string = '';
  isLoading: boolean = false;

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
    const fieldRes = await this.leaveService.getAvailableFields().toPromise();
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
  this.leaveService.getAssetReport().subscribe(res => {
    this.savedReports = res;
  });
}

fetchStandardReport() {
  this.leaveService.getAssetReport().subscribe(res => {
    if (res.length > 0 && res[0].report_data) {
      this.loadJsonData(res[0].report_data);
    }
  });
}

loadJsonData(url: string) {
  this.leaveService.fetchAssetJsonData(url).subscribe(data => {
    this.originalData = data;
    this.extractUniqueStatuses();
    this.applyFilters();
  });
}

extractUniqueStatuses() {
  this.uniqueStatuses = [...new Set(this.originalData.map(item => item.status))].filter(s => !!s);
  this.uniqueStatuses.forEach(s => {
    if (this.activeFilters.status[s] === undefined) this.activeFilters.status[s] = false;
  });
}

applyFilters() {
  let temp = [...this.originalData];
  if (this.searchText) {
    const search = this.searchText.toLowerCase();
    temp = temp.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(search))
    );
  }
  const selectedStatuses = Object.keys(this.activeFilters.status).filter(k => this.activeFilters.status[k]);
  if (selectedStatuses.length > 0) {
    temp = temp.filter(item => selectedStatuses.includes(item.status));
  }
  this.displayData = temp;
}

saveCustomFile(): void {
  // 1. Get Schema from LocalStorage
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.customFileName.trim()) return;

  // 2. Prepare the URL
  const url = `${this.apiUrl}/organisation/api/asset-Report/emp_select_report/?schema=${selectedSchema}`;
  
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
  const exportData = this.displayData.map(item => {
    let row: any = {};
    visibleFields.forEach(f => row[f.label] = item[f.key]);
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${this.customFileName || 'Asset_Report'}.xlsx`);
}

}
