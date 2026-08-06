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

@Component({
  selector: 'app-payroll-details',
  templateUrl: './payroll-details.component.html',
  styleUrls: ['./payroll-details.component.css']
})
export class PayrollDetailsComponent {

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
          this.companyTrn = currentCompany.tax_details?.trn || currentCompany.employer_unique_id || '';
          
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

    // Emirates ID
    this.emiratesId = emp?.person_id || '-';

    // IBAN from first active bank
    const activeBank = emp?.emp_bank?.find((b: any) => b.is_active) || emp?.emp_bank?.[0];
    this.ibanNumber = activeBank?.iban_number || '-';

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
          alert('Payslip uploaded successfully.');
          this.closeapplicationModal();
        },
        error: (error) => {
          alert('Failed to upload payslip.');
          console.error(error);
        }
      });
    });
  }

// Remove department and category from preferences, add designation
payslipPreferences = {
  showBranch: true,
  showDesignation: true,   // NEW: Show designation from payroll_run
  showCompanyName: true
};

  iscreateLoanApp: boolean = false;

  openPopus(): void {
    this.iscreateLoanApp = true;
  }

  closeapplicationModal(): void {
    this.iscreateLoanApp = false;
  }
}