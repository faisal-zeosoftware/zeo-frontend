import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { errText, wsUrl } from '../payroll-plus/pay162';   // v1.62.0 payroll
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { LeaveService } from '../leave-master/leave.service';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { EmployeeService } from '../employee-master/employee.service';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';

import {combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-wps',
  templateUrl: './wps.component.html',
  styleUrls: ['./wps.component.css', '../leave-policy/leave-policy.css', '../payroll-plus/pay162.css']
})
export class WpsComponent {

  private dataSubscription?: Subscription;
  
  repayment_date:any='';
  amount_paid:any='';
  remaining_balance:any='';


  loan:any='';




  


  LoanTypes:any []=[];
  LoanRepayements:any []=[];



  selectedFile!: File | null;

hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;
hasExportPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names
  
  constructor(
    private leaveervice: LeaveService, 
    private authService: AuthenticationService, 

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
private employeeService: EmployeeService,

  ) {}

  ngOnInit(): void {
    this.loadRuns();   // v1.62.0 payroll

     // combineLatest waits for both Schema and Branches to have a value
     this.dataSubscription = combineLatest([
      this.employeeService.selectedSchema$,
      this.employeeService.selectedBranches$
    ]).subscribe(([schema, branchIds]) => {
      if (schema) {
        this.fetchEmployees(schema, branchIds);  
        

      }
    });

    const selectedSchema = this.authService.getSelectedSchema();
      if (selectedSchema) {
        // this.LoadPayroll(selectedSchema);

      }

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
    
                   
                    this.hasAddPermission = this.checkGroupPermission('add_wps', groupPermissions);
                    console.log('Has add permission:', this.hasAddPermission);
                    
                    this.hasEditPermission = this.checkGroupPermission('change_wps', groupPermissions);
                    console.log('Has edit permission:', this.hasEditPermission);
      
                   this.hasDeletePermission = this.checkGroupPermission('delete_wps', groupPermissions);
                   console.log('Has delete permission:', this.hasDeletePermission);
      
    
                    this.hasViewPermission = this.checkGroupPermission('view_wps', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermission);

                    this.hasExportPermission = this.checkGroupPermission('export_wps', groupPermissions);
                    console.log('Has view permission:', this.hasExportPermission);
    
    
                  } else {
                    console.debug('No permission groups for this user.');   // v1.17.0 (audit M12): normal for an employee, not an error
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
  


  

  registerButtonClicked = false;
  Payrolls: any[] = [];


  // LoadPayroll(selectedSchema: string) {
  //   this.leaveervice.getPayroll(selectedSchema).subscribe(
  //     (data: any) => {
  //       this.Payrolls = data;

      
  //       console.log('Payrolls:', this.Payrolls);
  //     },
  //     (error: any) => {
  //       console.error('Error fetching Payrolls:', error);
  //     }
  //   );
  // }

  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.leaveervice.getPayrollNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.Payrolls = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

  selectedPayrollId: number | null = null;
  sifData: any = null;

  
fetchSIFData(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.selectedPayrollId) {
    alert('Please select a schema and payroll.');
    return;
  }

  const payload = { payroll_run_id: this.selectedPayrollId };

  this.leaveervice.postSIFData(payload, selectedSchema).subscribe(
    (response: any) => {
      if (response.status === 'success') {
        this.sifData = response.data;
        if (this.downloadAfterFetch) { this.downloadAfterFetch = false; this.downloadSIFFile(); }   // v1.62.0 payroll
      } else {
        alert('Failed to fetch SIF data.');
      }
    },
    (error) => {
      console.error('Error fetching SIF data:', error);
      this.downloadAfterFetch = false;
      alert(errText(error, 'The WPS file could not be made.'));   // v1.62.0 payroll: the reason from the server
    }
  );
}


getObjectKeys(obj: any): string[] {
  return Object.keys(obj);
}


/** v1.26.0 – columns of the employee rows (EDR), also when the file has none yet. */
edrKeys(): string[] {
  const e = this.sifData?.edr;
  return e && e.length ? Object.keys(e[0]) : ['Type', 'Person ID', 'Routing Code', 'IBAN Number', 'Pay Start Date', 'Pay End Date',
    'Number of Days', 'Fixed Income', 'Variable Income', 'Days on Leave'];
}

getUnifiedSIFKeys(): string[] {
  if (!this.sifData) return [];

  // Merge keys from hdr, scr, and edr[]
  const hdrKeys = Object.keys(this.sifData.hdr || {});
  const scrKeys = Object.keys(this.sifData.scr || {});
  const edrKeys = this.sifData.edr && this.sifData.edr.length > 0 ? Object.keys(this.sifData.edr[0]) : [];

  // Merge all and remove duplicates
  const allKeys = [...hdrKeys, ...scrKeys, ...edrKeys];
  return Array.from(new Set(allKeys));
}


downloadSIFStyledExcel(): void {
  const data = this.sifData;
  if (!data) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('SIF Report');

  // Set column headers with formatting
  const headerRow = [
    'Type', 'Employee ID', 'Routing Code', 'IBAN',
    'From Date (yyyy/mm/dd)', 'To Date (yyyy/mm/dd)',
    'No of Days', 'Fixed Salary', 'Variable Pay', 'Days on Leave'
  ];

  worksheet.addRow([]); // Empty row
  worksheet.addRow([
    'Column A - EDR (Employee Detail Record) for a single employee',
    'Column B - 14 digit EID issued by MOHRE',
    'Column C - 9-digit routing code',
    'Column D - IBAN (employee’s bank number)',
    'Column E - Start date of salary',
    'Column F - End date of salary',
    'Column G - Total number of working days',
    'Column H - Basic or fixed salary',
    'Column I - Variable salary',
    'Column J - Days on Leave'
  ]);

  worksheet.addRow([]); // Empty row

  const header = worksheet.addRow(headerRow);
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '002060' }, // dark blue
    };
    cell.border = {
      bottom: { style: 'thin' },
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Add EDR rows
  data.edr.forEach((edr: any) => {
    worksheet.addRow([
      'EDR',
      edr['Person ID'] || '',
      edr['Routing Code'] || '',
      edr['IBAN Number'] || '',
      edr['Pay Start Date'] || '',
      edr['Pay End Date'] || '',
      edr['Number of Days'] || '',
      edr['Fixed Income'] || '',
      edr['Variable Income'] || '',
      edr['Days on Leave'] || '',
    ]);
  });

  // Add SCR row
  const scr = data.scr;
  worksheet.addRow([
    'SCR',
    scr['Person ID'] || '',
    scr['Routing Code'] || '',
    scr['IBAN Number'] || '',
    scr['Pay Start Date'] || '',
    scr['Pay End Date'] || '',
    scr['Number of Days'] || '',
    scr['Fixed Income'] || '',
    scr['Variable Income'] || '',
    scr['Days on Leave'] || '',
  ]);

  // Adjust column widths
  worksheet.columns.forEach((column) => {
    column.width = 18;
  });

  // Export as Excel file
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, 'SIF_Styled_Report.xlsx');
    this.logMade('xlsx');   // v1.62.0 payroll
  });
}



// downloadSIFFile(): void {
//   const data = this.sifData;
//   if (!data) {
//     alert('No SIF data available to download.');
//     return;
//   }

//   const lines: string[] = [];

//   // --- HDR record ---
//   // ⚠️ Field order below is a placeholder based on your Excel mapping.
//   // Confirm exact field order/count against your bank's official WPS SIF spec.
//   const hdr = data.hdr;
//   lines.push([
//     'HDR',
//     hdr['Sender ID'] || '',
//     hdr['Employer ID'] || '',
//     hdr['Routing Code'] || '',
//     hdr['IBAN Number'] || '',
//     hdr['File Creation Date'] || '',
//     hdr['Salary Year'] || '',
//     hdr['Salary Month'] || '',
//     hdr['Total Employees'] || data.edr?.length || '',
//     hdr['Total Salary Amount'] || '',
//   ].join(','));

//   // --- EDR records (one per employee) ---
//   data.edr.forEach((edr: any) => {
//     lines.push([
//       'EDR',
//       edr['Person ID'] || '',
//       edr['Routing Code'] || '',
//       edr['IBAN Number'] || '',
//       edr['Pay Start Date'] || '',
//       edr['Pay End Date'] || '',
//       edr['Number of Days'] || '',
//       edr['Fixed Income'] || '',
//       edr['Variable Income'] || '',
//       edr['Days on Leave'] || '',
//     ].join(','));
//   });

//   // --- SCR record (summary/control) ---
//   const scr = data.scr;
//   lines.push([
//     'SCR',
//     scr['Person ID'] || '',
//     scr['Routing Code'] || '',
//     scr['IBAN Number'] || '',
//     scr['Pay Start Date'] || '',
//     scr['Pay End Date'] || '',
//     scr['Number of Days'] || '',
//     scr['Fixed Income'] || '',
//     scr['Variable Income'] || '',
//     scr['Days on Leave'] || '',
//   ].join(','));

//   // WPS SIF files conventionally use CRLF line endings
//   const sifContent = lines.join('\r\n');

//   const blob = new Blob([sifContent], { type: 'text/plain;charset=utf-8' });
//   const fileName = `SIF_${this.selectedPayrollId}_${new Date().toISOString().slice(0, 10)}.sif`;

//   FileSaver.saveAs(blob, fileName);
// }


downloadSIFFile(): void {
  const data = this.sifData;
  if (!data) {
    alert('No SIF data available to download.');
    return;
  }

  const lines: string[] = [];

  // v1.26.0: the UAE SIF file is EDR lines + one SCR line – no title line and no HDR line (banks reject both)

  // --- EDR records ---
  data.edr.forEach((edr: any) => {
    lines.push([
      'EDR',
      edr['Person ID'] || '',
      edr['Routing Code'] || '',
      edr['IBAN Number'] || '',
      edr['Pay Start Date'] || '',
      edr['Pay End Date'] || '',
      edr['Number of Days'] || '',
      edr['Fixed Income'] || '',
      edr['Variable Income'] || '',
      edr['Days on Leave'] || '',
    ].join(','));
  });

  // --- SCR record ---
  const scr = data.scr;
  lines.push([
    'SCR',
    scr['Person ID'] || '',
    scr['Routing Code'] || '',
    scr['IBAN Number'] || '',
    scr['Pay Start Date'] || '',
    scr['Pay End Date'] || '',
    scr['Number of Days'] || '',
    scr['Fixed Income'] || '',
    scr['Variable Income'] || '',
    scr['Days on Leave'] || '',
  ].join(','));

  const sifContent = lines.join('\r\n');
  const blob = new Blob([sifContent], { type: 'text/plain;charset=utf-8' });
  const fileName = `SIF_${this.selectedPayrollId}_${new Date().toISOString().slice(0, 10)}.sif`;
  FileSaver.saveAs(blob, fileName);
  this.logMade('sif');   // v1.62.0 payroll
}


  // ------------------------------------------------------------------ v1.62.0 payroll: the runs with their WPS state
  private http2 = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  wpsRuns: any[] = [];
  wpsLoading = true;
  wpsMsg = '';
  downloadAfterFetch = false;
  showAll = false;

  async loadRuns(): Promise<void> {
    this.wpsLoading = true;
    try {
      const d: any = await firstValueFrom(this.http2.get(wsUrl('runs/')));
      this.wpsRuns = d.runs || [];
      const q = Number(this.route.snapshot.queryParamMap.get('run') || 0);
      if (q && !this.sifData && this.wpsRuns.some(r => r.id === q)) { this.make(this.wpsRuns.find(r => r.id === q)); }
    } catch (e) { this.wpsMsg = errText(e, 'The payroll runs could not be loaded.'); }
    this.wpsLoading = false; this.cd.markForCheck();
  }
  shownRuns(): any[] { return this.showAll ? this.wpsRuns : this.wpsRuns.filter(r => r.status === 'approved' || r.status === 'paid').slice(0, 12); }
  selectedRun(): any { return this.wpsRuns.find(r => String(r.id) === String(this.selectedPayrollId)); }
  isSel(r: any): boolean { return String(r.id) === String(this.selectedPayrollId); }
  ready(r: any): boolean { return r.status === 'approved' || r.status === 'paid'; }
  make(r: any): void { this.selectedPayrollId = r.id; this.sifData = null; this.fetchSIFData(); }
  download(r: any): void { this.selectedPayrollId = r.id; this.sifData = null; this.downloadAfterFetch = true; this.fetchSIFData(); }
  closeFile(): void { this.sifData = null; this.selectedPayrollId = null; this.router.navigate([], { relativeTo: this.route, queryParams: { run: null } }); }
  private async logMade(kind: string): Promise<void> {
    const s = this.sifData?.summary; const id = this.selectedPayrollId;
    if (!s || !id) { return; }
    try {
      await firstValueFrom(this.http2.post(wsUrl(`runs/${id}/wps-made/`), { file: kind, employees: s.employees, total: s.total_salary, skipped: s.skipped }));
      this.loadRuns();
    } catch { /* the file is saved; only the note in the history failed */ }
  }
}
