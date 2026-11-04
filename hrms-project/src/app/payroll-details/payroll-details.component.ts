import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeaveService } from '../leave-master/leave.service';
import { environment } from '../../environments/environment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { Location } from '@angular/common';
import { inject as psdInject } from '@angular/core';
import { LnUiService } from '../loan-ui/ln-ui.service';   // v1.62.10 (item 165)
import { zToast } from '../shared-ui/z-toast';
import { packLang } from '../shared-ui/i18n-core';

@Component({
  selector: 'app-payroll-details',
  templateUrl: './payroll-details.component.html',
  styleUrls: ['./payroll-details.component.css', '../air-ticket-ui/at.css', '../loan-ui/ln.css']   // v1.62.10 (item 165) new design
})
export class PayrollDetailsComponent {
  // v1.62.10 (item 165): the new-design page (header, tiles, options beside the document, one save window); same data and calls
  ln = psdInject(LnUiService);
  private loc = psdInject(Location);
  psdError = '';
  psdSaveError = '';
  psdBusy = false;
  statusWord(s: string): string { return ({ pending: 'Waiting for approval', approved: 'Approved', processed: 'Processed', rejected: 'Rejected' } as any)[s] || s || '–'; }
  statusClass(s: string): string { return ({ pending: 'warn', approved: 'ok', processed: 'info', rejected: 'bad' } as any)[s] || 'muted'; }
  back(): void { this.loc.back(); }
  /** the run's Arabic name when the user works in Arabic */
  get runName(): string { const r = this.payslipDetails?.payroll_run || {}; return (packLang().startsWith('ar') && r.arabic_name) || r.name || ''; }
  /** v1.15.1: branch / department / category of the run are lists of {id, name} – show the names, not [object Object] */
  names(v: any): string {
    const a = Array.isArray(v) ? v : (v === null || v === undefined || v === '' ? [] : [v]);
    return a.map((x: any) => (x && typeof x === 'object') ? (x.name || x.branch_name || x.dept_name || x.ctgry_name || x.id || '') : x).filter((x: any) => x !== '' && x !== null && x !== undefined).join(', ') || '–';
  }


  @ViewChild('payslipContent') payslipContent!: ElementRef;

  private apiUrl = `${environment.apiBaseUrl}`;

  payslipId: string | null = null;
  payslipDetails: any;

  earnings: any[] = [];
  deductions: any[] = [];
  others: any[] = [];

  selectedPayslipDesign = 'classic';
  send_email: boolean = false;

  // Company data from /users/api/company/
  companyData: any = null;
  companyName: string = '';
  companyLogoUrl: string | null = null;
  companyAddress: string = '';
  companyEmail: string = '';
  companyTrn: string = '';
  employerId: string = '';      // v1.20.2: MoHRE employer ID (WPS), not a tax number
  employeeCode: string = '';
  personId: string = '';
  ibanIsCard = false;
  /** v1.20.2: only the lines with an amount (a payslip lists what was paid / deducted, not every component at 0.00) */
  get shownEarnings(): any[] { return this.earnings.filter(c => Math.abs(parseFloat(c.amount || '0')) > 0.004); }
  get shownDeductions(): any[] { return this.deductions.filter(c => Math.abs(parseFloat(c.amount || '0')) > 0.004); }

  // Employee computed fields
  employeeFullName: string = '';
  emiratesId: string = '';
  designationName: string = '';
  ibanNumber: string = '';
  monthName: string = '';
  
  // Leave calculations
  totalLeaveDays: number = 0;
  totalSickLeaveDays: number = 0;
  leaveBalanceTotal: number = 0;
  loanBalanceTotal: number = 0;

  constructor(
    private route: ActivatedRoute,
    private leaveService: LeaveService,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const savedSchema = localStorage.getItem('selectedSchema');
    this.companyName = savedSchema ? savedSchema : 'Your Company';
    
    // Fetch company data first (includes address, email, trn, logo)
    this.fetchCompanyData(savedSchema);

    this.payslipId = this.route.snapshot.paramMap.get('id');
    if (this.payslipId) {
      this.leaveService.getSinglePayslip(this.payslipId).subscribe(
        data => {
          this.payslipDetails = data;
          this.earnings = data.components.filter((comp: any) => comp.component_type === 'Addition');
          this.deductions = data.components.filter((comp: any) => comp.component_type === 'Deduction');
          this.others = data.components.filter((comp: any) => comp.component_type === 'Others');
          this.computeDisplayFields(data);
        },
        error => {
          console.error('Failed to fetch payslip details', error);
          this.psdError = this.ln.err(error, this.ln.t('The payslip could not be loaded.'));   // v1.62.10 (item 165)
        }
      );
    }
  }

  // FIXED: Fetch full company data (logo, address, email, trn)
  fetchCompanyData(savedSchema: string | null): void {
    this.http.get<any[]>(`${this.apiUrl}/users/api/company/`).subscribe(
      (companies) => {
        const currentCompany = savedSchema
          ? companies.find(c => c.schema_name === savedSchema)
          : companies[0];

        if (currentCompany) {
          this.companyData = currentCompany;
          this.companyLogoUrl = currentCompany.logo || null;
          
          // Build full address from address fields
          const addrParts = [
            currentCompany.address_line1,
            currentCompany.address_line2,
            currentCompany.city,
            currentCompany.state_label,
            currentCompany.country,
            currentCompany.pincode
          ].filter(part => part && part.trim() !== '');
          
          this.companyAddress = addrParts.join(', ');
          this.companyEmail = currentCompany.email || ''; // if API has email field
          this.companyName = currentCompany.name || this.companyName;   // v1.20.2: the company name, not the schema
          this.companyTrn = currentCompany.tax_details?.trn || '';
          this.employerId = currentCompany.employer_unique_id || '';
          
          // If company API doesn't have email, you might need another endpoint
          // For now, fallback to employee's company email if company API has no email
          if (!this.companyEmail) {
            // Will be set after payslip loads
          }
        }
      },
      error => {
        console.error('Failed to fetch company data', error);
      }
    );
  }

  computeDisplayFields(data: any): void {
    const emp = data.employee_details;
    
    // Employee Full Name
    const firstName = emp?.emp_first_name || '';
    const middleName = emp?.emp_middle_name || '';
    const lastName = emp?.emp_last_name || '';
    this.employeeFullName = [firstName, middleName, lastName]
      .filter(n => n && n !== 'null')
      .join(' ')
      .trim() || data.employee;

    // v1.20.2: Emirates ID from the identity record; the MoHRE person ID separately; designation of the employee
    this.employeeCode = emp?.emp_code || '';
    this.emiratesId = emp?.emirates_id || '';
    this.personId = emp?.person_id || '';
    this.designationName = emp?.designation || data.payroll_run?.designation || '';

    // IBAN from first active bank (a salary card has its card number instead)
    const activeBank = emp?.emp_bank?.find((b: any) => b.is_active) || emp?.emp_bank?.[0];
    this.ibanIsCard = !!activeBank && !activeBank.iban_number && !!activeBank.account_number;
    this.ibanNumber = activeBank?.iban_number || activeBank?.account_number || '-';

    // Month Name
    this.monthName = this.getMonthName(data.payroll_run?.month);

    // Company email fallback from employee if company API has none
    if (!this.companyEmail && emp?.emp_company_email) {
      this.companyEmail = emp.emp_company_email;
    }

    // Leave calculations
    const leaveRequests = emp?.leave_requests || [];
    this.totalLeaveDays = leaveRequests.reduce((sum: number, lr: any) => sum + (lr.number_of_days || 0), 0);
    this.totalSickLeaveDays = leaveRequests
      .filter((lr: any) => lr.leave_type === 'Sick Leave')
      .reduce((sum: number, lr: any) => sum + (lr.number_of_days || 0), 0);
    this.leaveBalanceTotal = emp?.leave_balance?.reduce((sum: number, lb: any) => sum + (lb.balance || 0), 0) || 0;
    this.loanBalanceTotal = emp?.loan_requests
      ?.filter((lr: any) => lr.status === 'Pending' || lr.status === 'Approved')
      .reduce((sum: number, lr: any) => sum + parseFloat(lr.remaining_balance || 0), 0) || 0;
  }

  getMonthName(monthNum: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[(monthNum || 1) - 1] || 'Unknown';
  }

  // ... rest of methods (downloadPayslip, approvePayslip, etc.) stay the same
  downloadPayslip() {
    const element = this.payslipContent.nativeElement;
    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip-${this.payslipDetails.employee}.pdf`);
    });
  }

  approvePayslip(): void {
    if (this.psdBusy) { return; }
    this.psdBusy = true; this.psdSaveError = '';   // v1.62.10 (item 165)
    const element = this.payslipContent.nativeElement;
    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `Payslip-${this.payslipDetails.employee}.pdf`, {
        type: 'application/pdf',
      });
      const payslipId = this.payslipDetails.id;
      this.employeeService.uploadPayslipPdf(payslipId, file, this.send_email).subscribe({
        next: () => {
          this.psdBusy = false;   // v1.62.10 (item 165): a short message instead of the pop-up
          zToast(this.ln.t(this.send_email ? 'The PDF is saved on the payslip and will be e-mailed to the employee.' : 'The PDF is saved on the payslip.'), 'ok');
          this.closeapplicationModal();
        },
        error: (error) => {
          this.psdBusy = false;
          this.psdSaveError = this.ln.err(error, this.ln.t('The PDF could not be saved.'));
          console.error(error);
        }
      });
    }).catch(() => { this.psdBusy = false; this.psdSaveError = this.ln.t('The PDF could not be made.'); });   // v1.62.10 (item 165)
  }

// Remove department and category from preferences, add designation
payslipPreferences = {
  showBranch: true,
  showDesignation: true,   // NEW: Show designation from payroll_run
  showCompanyName: true
};

  iscreateLoanApp: boolean = false;

  openPopus(): void {
    this.psdSaveError = '';
    this.iscreateLoanApp = true;
  }

  closeapplicationModal(): void {
    this.iscreateLoanApp = false;
  }
}