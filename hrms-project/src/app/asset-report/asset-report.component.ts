import { HttpClient } from '@angular/common/http';
import { Component, OnInit  } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { SessionService } from '../login/session.service';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import * as XLSX from 'xlsx';
import { EmployeeService } from '../employee-master/employee.service';

@Component({
  selector: 'app-asset-report',
  templateUrl: './asset-report.component.html',
  styleUrl: './asset-report.component.css'
})
export class AssetReportComponent {

  
  Users: any[] = [];

  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;
  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any;
  schemas: string[] = []; // Array to store schema names

    username: any;



  selectedFile: File | null = null;


  approvalReportData: any[] = [];



  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private sessionService: SessionService,
    private leaveService:LeaveService,
    private employeeService: EmployeeService,
    private DesignationService: DesignationService,

  
    ) {}


   ngOnInit(): void {

    this.fetchStandardReport();
 
    this.userId = this.sessionService.getUserId();

    // Fetch user details using the obtained user ID
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        async (userData: any) => {
          this.userDetails = userData; // Store user details in userDetails property
          console.log('User ID:', this.userId); // Log user ID
          console.log('User Details:', this.userDetails); // Log user details
    
          this.username = this.userDetails.username;
          // Check if user is_superuser is true or false
          let isSuperuser = this.userDetails.is_superuser || false;
          const isEssUser = this.userDetails.is_ess || false; // Default to false if is_superuser is undefined
          const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) {
        console.error('No schema selected.');
        return;
      }
    
          if (isSuperuser || isEssUser) {
            console.log('User is superuser or ESS user');
            // Grant all permissions
            this.hasViewPermission = true;
            this.hasAddPermission = true;
            this.hasDeletePermission = true;
            this.hasEditPermission = true;
        // this.hasExportPermission=true;
            // Fetch designations without checking permissions
            // this.fetchDesignations(selectedSchema);
    
          } else {
            console.log('User is not superuser');
    
            const selectedSchema = this.authService.getSelectedSchema();
            if (selectedSchema) {
              
    
              try {
                const permissionsData: any = await this.employeeService.getDesignationsPermission(selectedSchema).toPromise();
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
                    // this.hasExportPermission= true;

                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);
    
                      this.hasViewPermission = this.checkGroupPermission('view_assetreport', groupPermissions);
                 console.log('Has view permission:', this.hasViewPermission);
            
                   this.hasAddPermission = this.checkGroupPermission('add_assetreport', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
            
                 this.hasDeletePermission = this.checkGroupPermission('delete_assetreport', groupPermissions);
              console.log('Has delete permission:', this.hasDeletePermission);
            
                  this.hasEditPermission = this.checkGroupPermission('change_assetreport', groupPermissions);
                 console.log('Has edit permission:', this.hasEditPermission);
                 
                //  this.hasExportPermission = this.checkGroupPermission('export_doc_report', groupPermissions);
                //  console.log('Has export permission:', this.hasExportPermission);
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
        (userData:any)=>{
          this.userDetailss=userData;
          console.log('Schema :',this.userDetailss);
             // Extract schema names from userData and add them to the schemas array
        this.schemas = userData.map((schema: any) => schema.schema_name);
    
        }
        
    
      );
    } else {
      console.error('User ID is null.');
    }
  
  }

    checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }
  
// your.component.ts

fetchStandardReport() {
  this.leaveService.getAssetReport().subscribe(
    (response) => {
      if (response.length > 0 && response[0].report_data) {
        const jsonUrl = response[0].report_data;
        this.leaveService.fetchAssetJsonData(jsonUrl).subscribe((jsonData: any) => {
          // Directly assign the data since it's already flat
          this.approvalReportData = jsonData;
        });
      }
    },
    (error) => {
      console.error('Error fetching report:', error);
    }
  );
  
}



downloadExcel() {
  const headerMap: { [key: string]: string } = {
    name: 'Name',
    asset_type: 'Asset Type',
    condition: 'Condition',
    model: 'Model',
    purchase_date: 'Purchase date',
    serial_number: 'Serial number',
    status: 'Status',
   
  };

  const exportData = this.approvalReportData.map(item => {
    const transformed: any = {};
    for (const key in headerMap) {
      if (item.hasOwnProperty(key)) {
        transformed[headerMap[key]] = item[key];
      }
    }
    return transformed;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset Report');
  XLSX.writeFile(workbook, 'Asset_report.xlsx');
}




}
