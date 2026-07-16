import { Component,Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CompanyRegistrationService } from '../company-registration.service';
import { AuthenticationService } from '../login/authentication.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Route,ActivatedRoute } from '@angular/router';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentCreationComponent } from '../department-creation/department-creation.component';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { UserMasterService } from '../user-master/user-master.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-grouping-edit',
  templateUrl: './user-grouping-edit.component.html',
  styleUrl: './user-grouping-edit.component.css'
})
export class UserGroupingEditComponent {
    private apiUrl = `${environment.apiBaseUrl}`;

  department: any;

  Departments: any[] = [];


    //creating group name declared variables.
 
   groupName: string = '';
   codename:string ='';
   profile:string ='';
   selectedPermissions: any[] = [];

  registerButtonClicked :boolean = false;

  selectedDeparmentsecId:any | undefined;

  selecteddepartmentId: number | undefined;

























  constructor(
    private ref:MatDialogRef<DepartmentCreationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { departmentId: number },
    private userMasterService: UserMasterService,
    private DepartmentServiceService: DepartmentServiceService,

    private renderer: Renderer2,
    private http: HttpClient,
    private authService: AuthenticationService,
    private UserMasterService: UserMasterService,
    private dialogRef: MatDialogRef<UserGroupingEditComponent>

  ) {
    this.userMasterService.getCategoryById(data.departmentId).subscribe(department => {
      this.department = department;
    });// this.userMasterService.getCategoryById(data.departmentId).subscribe(department => {
    //   this.department = department;
    // });
  }

ngOnInit(): void {

  this.loadAllPermissionsPool();

  this.loadDeparmentBranch();

  this.userMasterService.getCategoryById(this.data.departmentId).subscribe(
    (department) => {

      this.department = department;

      // Group name
      this.groupName = department.name;

      // Selected permissions
      this.selectedPermissions =
        department.permissions.map((p:any)=>p.id);

      // Refresh parent/master checkboxes
      this.updateAllMasterCheckboxes();
      this.syncAllUIStates();

    },
    error => console.error(error)
  );
}

  loadDeparmentBranch(): void {
    this.DepartmentServiceService.getDeptBranch().subscribe(
      (result: any) => {
        this.Departments = result;
        console.log(' fetching Companies:');

      },
      (error) => {
        console.error('Error fetching Companies:', error);
      }
    );
  }

  
    // UI State Properties
    activeTab: string = 'employee';
  
    // Permission Arrays
    GrouppermissionsEmp: any[] = [];
    GrouppermissionsDept: any[] = [];
    GrouppermissionsDis: any[] = [];
    GrouppermissionsCat: any[] = [];
    GrouppermissionsExpDocument: any[] = [];
    GrouppermissionsEmpAprList: any[] = [];
    GrouppermissionsEmpRegAprList: any[] = [];
    GrouppermissionsEndofSer: any[] = [];
    GrouppermissionsRegReq: any[] = [];
    GrouppermissionsRegAprlvl: any[] = [];
    GrouppermissionsGratuity: any[] = [];
  
    GrouppermissionsCmp: any[] = [];
    GrouppermissionsBrch: any[] = [];
    GrouppermissionsUser: any[] = [];
    GrouppermissionsUsergroup: any[] = [];
    GrouppermissionsassigneddUser: any[] = [];
    GrouppermissionsstateMaster: any[] = [];
    Grouppermissionsdocumentype: any[] = [];
    GrouppermissionslocationMaster: any[] = [];
    GrouppermissionsDnMaster: any[] = [];
    GrouppermissionsCpMaster: any[] = [];
    GrouppermissionsConfigMaster: any[] = [];
    GrouppermissionsNotify: any[] = [];
    GrouppermissionsBranchUser: any[] = [];
  
    GrouppermissionsemployeeReport: any[] = [];
    GrouppermissionsdocumnetReport: any[] = [];
    GrouppermissiionsgeneralReport: any[] = [];
    GrouppermissiionsLeaveReport: any[] = [];
    GrouppermissiionsDeptReport: any[] = [];
    GrouppermissiionsDesReport: any[] = [];
    GrouppermissiionsLeaveAprRep: any[] = [];
    GrouppermissionsLeaveBalReport: any[] = [];
    GrouppermissionsAttendReport: any[] = [];
    GrouppermissionsAssetReport: any[] = [];
    GrouppermissionsAssetTransReport: any[] = [];
  
    GrouppermissionsEmpform: any[] = [];
    GrouppermissionsAssetform: any[] = [];
  
    Grouppermissionsaddweek: any[] = [];
    Grouppermisionsassignweek: any[] = [];
    Grouppermissionsaddholiday: any[] = [];
    Grouppermissionsassisgnholiday: any[] = [];
  
    GrouppermissionsLeaveaprv: any[] = [];
    GrouppermissionsLeavetype: any[] = [];
    GrouppermissionsLeavemaster: any[] = [];
    GrouppermissionsLeavereq: any[] = [];
    GrouppermissionsLeavecom: any[] = [];
    GrouppermissionsLeavecomTrans: any[] = [];
    GrouppermissionsLeaveaprvlvl: any[] = [];
    GrouppermissionsLeaveBalance: any[] = [];
    GrouppermissionsLeaveCancel: any[] = [];
    GrouppermissionsLeaveAccrual: any[] = [];
    GrouppermissionsLeaveRejoin: any[] = [];
    GrouppermissionsLeaveEscalation: any[] = [];
  
    GrouppermissionsPayrollrun: any[] = [];
    GrouppermissionsPayStructure: any[] = [];
    GrouppermissionsSalarycomponent: any[] = [];
    GrouppermissionsEmployeesalary: any[] = [];
    GrouppermissionsPayslipAprv: any[] = [];
    GrouppermissionsPayrollaprlvl: any[] = [];
    GrouppermissionsAdvanceSalaryAprvlst: any[] = [];
    GrouppermissionsAdvanceSalaryReq: any[] = [];
    GrouppermissionsAdvanceSalaryAprlvl: any[] = [];
    GrouppermissionsWps: any[] = [];
    GrouppermissionsAdvanceSalaryEscalation: any[] = [];
  
    GrouppermissionsGen: any[] = [];
    GrouppermissionsReqtype: any[] = [];
    GrouppermissionsApr: any[] = [];
    GrouppermissionsAprlvl: any[] = [];
    GrouppermissionsGenReqEsc: any[] = [];
    GrouppermissionsDocumentAprlvl: any[] = [];
    GrouppermissionsDocumentApr: any[] = [];
    GrouppermissionsDocumentReq: any[] = [];
    GrouppermissionsDocumentType: any[] = [];
    GrouppermissionsAnnounceMaster: any[] = [];
  
    GrouppermissionsLoanApproval: any[] = [];
    GrouppermissionsLoanType: any[] = [];
    GrouppermissionsLoanAprvlvl: any[] = [];
    GrouppermissionsLoanApp: any[] = [];
    GrouppermissionsLoanRepay: any[] = [];
    GrouppermissionsLoanEscalation: any[] = [];
  
    GrouppermissionsAssetType: any[] = [];
    GrouppermissionsAssetmaster: any[] = [];
    GrouppermissionsAssetAlon: any[] = [];
    GrouppermissionsAssetReq: any[] = [];
    GrouppermissionsAssetApprovals: any[] = [];
    GrouppermissionsAssetApprovallvl: any[] = [];
    GrouppermissionsAssetEscalation: any[] = [];
  
    GrouppermissionsDocumentAddFol: any[] = [];
  
    GrouppermissionsProjects: any[] = [];
    GrouppermissionsProjectStages: any[] = [];
    GrouppermissionsProjectTask: any[] = [];
    GrouppermissionsProjectTime: any[] = [];
  
    GrouppermissionsAirTicketPol: any[] = [];
    GrouppermissionsAirTicketAlon: any[] = [];
    GrouppermissionsAirTicketReq: any[] = [];
    GrouppermissionsAirTicketRule: any[] = [];
    GrouppermissionsAirTicketApr: any[] = [];
    GrouppermissionsAirTicketAprlvl: any[] = [];
    GrouppermissionsAirTicketEsc: any[] = [];
  
    GrouppermissionsGeneralReqTemp: any[] = [];
    GrouppermissionsLeaveEmTemp: any[] = [];
    GrouppermissionsDocExpTemp: any[] = [];
    GrouppermissionsDocReqTemp: any[] = [];
    GrouppermissionsAdvSalReqTemp: any[] = [];
    GrouppermissionsLoanReqTemp: any[] = [];
    GrouppermissionsAssetReqTemp: any[] = [];
    GrouppermissionsAirticketReqTemp: any[] = [];
    GrouppermissionsResignationReqTemp: any[] = [];
    GrouppermissionsLinEoutReqTemp: any[] = [];
  
    GrouppermissionsShifts: any[] = [];
    GrouppermissionsShiftPattern: any[] = [];
    GrouppermissionsShiftEmployee: any[] = [];
    GrouppermissionsShiftOverRide: any[] = [];
    GrouppermissionsOverTimePolicy: any[] = [];
    GrouppermissionsOvertimeRule: any[] = [];
    GrouppermissionsEmpOver: any[] = [];
  
    GrouppermissionsAtd: any[] = [];
    GrouppermissionsEmpEarlygoing: any[] = [];
    GrouppermissionsEmpRecheck: any[] = [];
    GrouppermissionsPuncinglist: any[] = [];
    GrouppermissionsValidationPol: any[] = [];
    GrouppermissionsLateComePol: any[] = [];
    GrouppermissionsEarlyExitPol: any[] = [];
    GrouppermissionsGeoFence: any[] = [];
    GrouppermissionsFaceRegister: any[] = [];
    GrouppermissionsPunching: any[] = [];
    GrouppermissionsManualentry: any[] = [];
    GrouppermissionsLateinEarlyout: any[] = [];
    GrouppermissionsLinEoutAprlvl: any[] = [];
    GrouppermissionsLinEoutApr: any[] = [];
  
  
    // Header Selectors Checked States
    selectAllChecked: boolean = false;
    settingsChecked: boolean = false;
    reportchecked: boolean = false;
    customizationchecked: boolean = false;
    calenderchecked: boolean = false;
    userandperchecked: boolean = false;
    Leavechecked: boolean = false;
    Payrollchecked: boolean = false;
    Loanchecked: boolean = false;
    Assetchecked: boolean = false;
    DocumentAddchecked: boolean = false;
    Projectchecked: boolean = false;
    AirTicketchecked: boolean = false;
    Documentchecked: boolean = false;
    EmailTemplatechecked: boolean = false;
    Shiftchecked: boolean = false;
    Attendancechecked: boolean = false;
    Generalmanagechecked: boolean = false;
    selectAllPermissions: boolean = false;
  
    // Row Checked Values (Employee Management)
    employeeMasterChecked: boolean = false;
    departmentMasterChecked: boolean = false;
    designationMasterChecked: boolean = false;
    categoryMasterChecked: boolean = false;
    ExpDocumentChecked: boolean = false;
    EmpAprListChecked: boolean = false;
    EmpRegAprListChecked: boolean = false;
    EndofSerChecked: boolean = false;
    RegReqChecked: boolean = false;
    RegAprlvlChecked: boolean = false;
    GratuityChecked: boolean = false;
  
    // Row Checked Values (Settings)
    companyMasterChecked: boolean = false;
    branchMasterChecked: boolean = false;
    userMasterChecked: boolean = false;
    usergroupingMasterChecked: boolean = false;
    assignpermissionMasterChecked: boolean = false;
    stationMasterChecked: boolean = false;
    documenttypeMasterChecked: boolean = false;
    locationMasterChecked: boolean = false;
    DnMasterChecked: boolean = false;
    CpMasterChecked: boolean = false;
    ConfigMasterChecked: boolean = false;
    NotefyChecked: boolean = false;
    BranchpermissionMasterChecked: boolean = false;
  
    // Row Checked Values (Reports)
    emportReportChecked: boolean = false;
    documentReportChecked: boolean = false;
    generelReportChecked: boolean = false;
    LeaveReportChecked: boolean = false;
    DeptReportChecked: boolean = false;
    DesReportChecked: boolean = false;
    LeaveAprRepChecked: boolean = false;
    LeaveBalReportChecked: boolean = false;
    AttendReportChecked: boolean = false;
    AssetReportChecked: boolean = false;
    AssetTransReportChecked: boolean = false;
  
    // Row Checked Values (Customization)
    EmpformChecked: boolean = false;
    AssetformChecked: boolean = false;
  
      // Row Checked Values (Leave)
    LeaveaprvChecked: boolean = false;
    LeavetypeChecked: boolean = false;
    LeaveEscalationChecked: boolean = false;
    LeavepolicyChecked: boolean = false;
    LeavereqChecked: boolean = false;
    LeavecomChecked: boolean = false;
    LeaveaprvlvlChecked: boolean = false;
    LeaveBalanceChecked: boolean = false;
    LeaveCancelChecked: boolean = false;
    LeaveAccrualChecked: boolean = false;
    LeaveRejoinChecked: boolean = false;
  
    // Row Checked Values (PayRoll)
    PayrollrunChecked: boolean = false; 
    PayStructureChecked: boolean = false; 
    SalarycomponentChecked: boolean = false; 
    EmployeeSalaryChecked: boolean = false; 
    PayslipAprvChecked: boolean = false;
    PayrollaprlvlChecked: boolean = false;
    AdvanceSalaryAprvlstChecked: boolean = false;
    AdvanceSalaryReqChecked: boolean = false;
    AdvanceSalaryEscalationChecked: boolean = false;
    AdvanceSalaryAprlvlChecked: boolean = false;
    WpsChecked: boolean = false;
  
      // Row Checked Values (EmailTemplate)
     GeneralReqTempChecked: boolean = false;
     LeaveEmTempChecked: boolean = false;
     DocExpTempChecked: boolean = false;
     DocReqTempChecked: boolean = false;
     AdvSalReqTempChecked: boolean = false;
     LoanReqTempChecked: boolean = false;
     AssetReqTempChecked: boolean = false;
     AirticketReqTempChecked: boolean = false;
     ResignationReqTempChecked: boolean = false;
     LinEoutReqTempChecked: boolean = false;
  
       // Row Checked Values (General)
    GenMasterChecked: boolean = false;
    ReqtypeMasterChecked: boolean = false;
    AprMasterChecked: boolean = false;
    AprlvlMasterChecked: boolean = false;
    GenReqEscMasterChecked: boolean = false;
    DocumentAprlvlChecked: boolean = false;
    DocumentAprChecked: boolean = false;
    DocumentReqChecked: boolean = false;
    DocumentTypeChecked: boolean = false;
    AnnounceMasterChecked: boolean = false;
  
    // Row Checked Values (Loan)
    LoanApprovalChecked: boolean = false;
    LoanTypeChecked: boolean = false;
    LoanEscalationChecked: boolean = false;
    LoanRepayChecked: boolean = false;
    LoanAprvlvlChecked: boolean = false;
    LoanAppChecked: boolean = false;
  
    // Row Checked Values (Asset)
    AssetTypeChecked: boolean = false;
    AssetmasterChecked: boolean = false;
    AssetEscalationChecked: boolean = false;
    AssetApprovalsChecked: boolean = false;
    AssetAlonChecked: boolean = false;
    AssetApprovallvlChecked: boolean = false;
    AssetReqChecked: boolean = false;
  
      // Row Checked Values (Attendance)
    AtdMasterChecked: boolean = false;
    PunchingChecked: boolean = false;
    FaceRegisterChecked: boolean = false;
    EmpEarlygoingChecked: boolean = false;
    EmpRecheckChecked: boolean = false;
    PuncinglistChecked: boolean = false;
    validationPolChecked: boolean = false;
    LateComePolChecked: boolean = false;
    EarlyExitPolChecked: boolean = false;
    ManualentryChecked: boolean = false;
    GeoFenceChecked: boolean = false;
    LateinEarlyoutChecked: boolean = false;
    LinEoutAprlvlChecked: boolean = false;
    LinEoutAprChecked: boolean = false;
  
    // Row Checked Values (Document Add)
    DocumentAddFolChecked: boolean = false;
  
    // Row Checked Values (Projects)
    ProjectsChecked: boolean = false;
    ProjectStagesChecked: boolean = false;
    ProjectTaskChecked: boolean = false;
    ProjectTimeChecked: boolean = false;
  
    // Row Checked Values (Airticket)
    AirTicketPolChecked: boolean = false;
    AirTicketAprChecked: boolean = false;
    AirTicketAlonChecked: boolean = false;
    AirTicketEscChecked: boolean = false;
    AirTicketReqChecked: boolean = false;
    AirTicketAprlvlChecked: boolean = false;
    AirTicketRuleChecked: boolean = false;
  
    // Row Checked Values (Shifts)
    ShiftsChecked: boolean = false;
    ShiftPatternChecked: boolean = false;
    ShiftEmployeeChecked: boolean = false;
    ShiftOverRideChecked: boolean = false;
    EmpOverChecked: boolean = false;
    OvertimePolicyChecked: boolean = false;
    OvertimeRuleChecked: boolean = false;
  
  
    // Checked states placeholder
    addweekChecked: boolean = false;
    assignweekChecked: boolean = false;
    addholidayChecked: boolean = false;
    assignholidayChecked: boolean = false;
  
  
    setActiveTab(tab: string): void {
      this.activeTab = tab;
    }
  
    /**
     * Performance Fix: Executes 1 SINGLE unified HTTP call instead of 50+.
     * Distributes the retrieved permissions in-memory instantly.
     */
    loadAllPermissionsPool(): void {
      const selectedSchema = this.authService.getSelectedSchema();
      if (!selectedSchema) {
        console.error('No selected schema found.');
        return;
      }
  
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          this.processPermissionsLocal(result);
          this.updateAllMasterCheckboxes();
          this.syncAllUIStates();
  
          // Duplicate Preselection Logic handles race-conditions securely
          // if (this.data && this.data.isDuplicate && this.data.duplicateData) {
          //   this.groupName = this.data.duplicateData.name;
          //   if (this.data.duplicateData.permissions && this.data.duplicateData.permissions.length > 0) {
          //     this.preselectPermissions(this.data.duplicateData.permissions);
          //   }
          // }
        },
        (error: any) => {
          console.error('Error fetching system permissions pool:', error);
        }
      );
    }
  
    /**
     * Helper function to extract, unique-filter, and optional-sort permissions
     */
    private filterUnique(all: any[], codenames: string[], order?: string[]): any[] {
      const uniqueMap = new Map();
      all.forEach(p => {
        const codename = p.codename.trim().toLowerCase();
        if (codenames.includes(codename) && !uniqueMap.has(codename)) {
          uniqueMap.set(codename, p);
        }
      });
  
      const list = Array.from(uniqueMap.values());
      if (order) {
        list.sort((a, b) => {
          const getPriority = (code: string) => {
            const key = order.find(o => code.toLowerCase().includes(o));
            return key ? order.indexOf(key) : 999;
          };
          return getPriority(a.codename) - getPriority(b.codename);
        });
      }
      return list;
    }
  
    processPermissionsLocal(all: any[]): void {
      const orderPriority = ['add', 'change', 'delete', 'view', 'import', 'export'];
  
      // Employee Management
      this.GrouppermissionsEmp = this.filterUnique(all, ['add_emp_master', 'change_emp_master', 'delete_emp_master', 'view_emp_master', 'import_emp_master']);
      this.GrouppermissionsDept = this.filterUnique(all, ['add_dept_master', 'change_dept_master', 'delete_dept_master', 'view_dept_master', 'import_dept_master']);
      this.GrouppermissionsDis = this.filterUnique(all, ['add_desgntn_master', 'change_desgntn_master', 'delete_desgntn_master', 'view_desgntn_master', 'import_designtn_master']);
      this.GrouppermissionsCat = this.filterUnique(all, ['add_ctgry_master', 'change_ctgry_master', 'delete_ctgry_master', 'view_ctgry_master', 'import_ctgry_master']);
      this.GrouppermissionsExpDocument = this.filterUnique(all, ['add_notification', 'change_notification', 'delete_notification', 'view_notification']);
      this.GrouppermissionsEmpAprList = this.filterUnique(all, ['add_resignationapproval', 'change_resignationapproval', 'delete_resignationapproval', 'view_resignationapproval']);
      this.GrouppermissionsEmpRegAprList = this.filterUnique(all, ['add_create_eos_for_resignation', 'view_approved_resignations']);
      this.GrouppermissionsEndofSer = this.filterUnique(all, ['add_endofservice', 'change_endofservice', 'delete_endofservice', 'view_endofservice']);
      this.GrouppermissionsRegReq = this.filterUnique(all, ['add_employeeresignation', 'change_employeeresignation', 'delete_employeeresignation', 'view_employeeresignation']);
      this.GrouppermissionsRegAprlvl = this.filterUnique(all, ['add_resignationapprovallevel', 'change_resignationapprovallevel', 'delete_resignationapprovallevel', 'view_resignationapprovallevel']);
      this.GrouppermissionsGratuity = this.filterUnique(all, ['add_gratuitytable', 'change_gratuitytable', 'delete_gratuitytable', 'view_gratuitytable']);
  
      // Settings
      this.GrouppermissionsBrch = this.filterUnique(all, ['add_brnch_mstr', 'change_brnch_mstr', 'delete_brnch_mstr', 'view_brnch_mstr']);
      this.GrouppermissionsUser = this.filterUnique(all, ['add_customuser', 'change_customuser', 'delete_customuser', 'view_customuser']);
      this.GrouppermissionsstateMaster = this.filterUnique(all, ['add_state_mstr', 'change_state_mstr', 'delete_state_mstr', 'view_state_mstr']);
      this.Grouppermissionsdocumentype = this.filterUnique(all, ['add_document_type', 'change_document_type', 'delete_document_type', 'view_document_type']);
      this.GrouppermissionslocationMaster = this.filterUnique(all, ['add_company', 'change_company', 'delete_company', 'view_company']);
      this.GrouppermissionsDnMaster = this.filterUnique(all, ['add_documentnumbering', 'change_documentnumbering', 'delete_documentnumbering', 'view_documentnumbering']);
      this.GrouppermissionsCpMaster = this.filterUnique(all, ['add_companypolicy', 'change_companypolicy', 'delete_companypolicy', 'view_companypolicy']);
      this.GrouppermissionsConfigMaster = this.filterUnique(all, ['add_emailconfiguration', 'change_emailconfiguration', 'delete_emailconfiguration', 'view_emailconfiguration']);
      this.GrouppermissionsNotify = this.filterUnique(all, ['add_notificationsettings', 'change_notificationsettings', 'delete_notificationsettings', 'view_notificationsettings']);
      this.GrouppermissionsUsergroup = this.filterUnique(all, ['add_group', 'change_group', 'delete_group', 'view_group']);
      this.GrouppermissionsassigneddUser = this.filterUnique(all, ['add_permission', 'change_permission', 'delete_permission', 'view_permission']);
      this.GrouppermissionsBranchUser = this.filterUnique(all, ['add_userbranchaccess', 'change_userbranchaccess', 'delete_userbranchaccess', 'view_userbranchaccess']);
  
      // Reports
      this.GrouppermissionsemployeeReport = this.filterUnique(all, ['add_report', 'change_report', 'delete_report', 'view_report', 'emp_export_report']);
      this.GrouppermissionsdocumnetReport = this.filterUnique(all, ['add_doc_report', 'change_doc_report', 'delete_doc_report', 'export_document_report', 'view_doc_report']);
      this.GrouppermissiionsgeneralReport = this.filterUnique(all, ['add_generalrequestreport', 'change_generalrequestreport', 'delete_generalrequestreport', 'export_general_request_report', 'view_generalrequestreport']);
      this.GrouppermissiionsDeptReport = this.filterUnique(all, ['export_dept_report', 'view_dept_report']);
      this.GrouppermissiionsDesReport = this.filterUnique(all, ['export_designtn_report', 'view_designtn_report']);
      this.GrouppermissiionsLeaveReport = this.filterUnique(all, ['add_leavereport', 'change_leavereport', 'delete_leavereport', 'lv_export_report', 'view_leavereport']);
      this.GrouppermissiionsLeaveAprRep = this.filterUnique(all, ['add_leaveapprovalreport', 'change_leaveapprovalreport', 'delete_leaveapprovalreport', 'lv_approval_export_report', 'view_leaveapprovalreport']);
      this.GrouppermissionsLeaveBalReport = this.filterUnique(all, ['add_lvbalancereport', 'change_lvbalancereport', 'delete_lvbalancereport', 'lv_balance_export_report', 'view_lvbalancereport']);
      this.GrouppermissionsAttendReport = this.filterUnique(all, ['add_attendancereport', 'change_attendancereport', 'delete_attendancereport', 'attendance_export_report', 'view_attendancereport']);
      this.GrouppermissionsAssetReport = this.filterUnique(all, ['add_assetreport', 'change_assetreport', 'delete_assetreport', 'asset_export_report', 'view_assetreport']);
      this.GrouppermissionsAssetTransReport = this.filterUnique(all, ['add_assettransactionreport', 'change_assettransactionreport', 'delete_assettransactionreport', 'asset_transaction_export_report', 'view_assettransactionreport']);
  
      // Customization
      this.GrouppermissionsEmpform = this.filterUnique(all, ['add_emp_customfield', 'change_emp_customfield', 'delete_emp_customfield', 'view_emp_customfield']);
      this.GrouppermissionsAssetform = this.filterUnique(all, ['add_assetcustomfield', 'change_assetcustomfield', 'delete_assetcustomfield', 'view_assetcustomfield']);
  
      // Calendar
      this.Grouppermissionsaddweek = this.filterUnique(all, ['add_weekend_calendar', 'change_weekend_calendar', 'delete_weekend_calendar', 'view_weekend_calendar']);
      this.Grouppermisionsassignweek = this.filterUnique(all, ['add_assign_weekend', 'change_assign_weekend', 'delete_assign_weekend', 'view_assign_weekend']);
      this.Grouppermissionsaddholiday = this.filterUnique(all, ['add_holiday_calendar', 'change_holiday_calendar', 'delete_holiday_calendar', 'view_holiday_calendar']);
      this.Grouppermissionsassisgnholiday = this.filterUnique(all, ['add_assign_holiday', 'change_assign_holiday', 'delete_assign_holiday', 'view_assign_holiday']);
  
      // General Management
      this.GrouppermissionsGen = this.filterUnique(all, ['add_generalrequest', 'change_generalrequest', 'delete_generalrequest', 'view_generalrequest']);
      this.GrouppermissionsReqtype = this.filterUnique(all, ['add_requesttype', 'change_requesttype', 'delete_requesttype', 'view_requesttype']);
      this.GrouppermissionsApr = this.filterUnique(all, ['add_approval', 'change_approval', 'delete_approval', 'view_approval']);
      this.GrouppermissionsAprlvl = this.filterUnique(all, ['add_approvallevel', 'change_approvallevel', 'delete_approvallevel', 'view_approvallevel']);
      this.GrouppermissionsGenReqEsc = this.filterUnique(all, ['add_genrl_escalation', 'change_genrl_escalation', 'delete_genrl_escalation', 'view_genrl_escalation'], orderPriority);
      this.GrouppermissionsDocumentAprlvl = this.filterUnique(all, ['add_documentapprovallevel', 'change_documentapprovallevel', 'delete_documentapprovallevel', 'view_documentapprovallevel']);
      this.GrouppermissionsDocumentApr = this.filterUnique(all, ['add_documentapproval', 'change_documentapproval', 'delete_documentapproval', 'view_documentapproval']);
      this.GrouppermissionsDocumentReq = this.filterUnique(all, ['add_documentrequest', 'change_documentrequest', 'delete_documentrequest', 'view_documentrequest']);
      this.GrouppermissionsDocumentType = this.filterUnique(all, ['add_docrequesttype', 'change_docrequesttype', 'delete_docrequesttype', 'view_docrequesttype']);
      this.GrouppermissionsAnnounceMaster = this.filterUnique(all, ['add_announcement', 'change_announcement', 'delete_announcement', 'view_announcement']);
  
      // Attendance Management
      this.GrouppermissionsAtd = this.filterUnique(all, ['add_attendance', 'change_attendance', 'delete_attendance', 'view_attendance', 'import_attendance']);
      this.GrouppermissionsFaceRegister = this.filterUnique(all, ['add_attendance_faceregister', 'change_attendance_faceregister', 'delete_attendance_faceregister', 'view_attendance_faceregister'], orderPriority);
      this.GrouppermissionsPunching = this.filterUnique(all, ['add_attendance_list', 'change_attendance_list', 'delete_attendance_list', 'view_attendance_list'], orderPriority);
      this.GrouppermissionsEmpEarlygoing = this.filterUnique(all, ['add_early_going', 'change_early_going', 'delete_early_going', 'view_early_going'], orderPriority);
      this.GrouppermissionsEmpRecheck = this.filterUnique(all, ['add_attendancerecheck', 'change_attendancerecheck', 'delete_attendancerecheck', 'view_attendancerecheck']);
      this.GrouppermissionsPuncinglist = this.filterUnique(all, ['add_attendancepolicy', 'change_attendancepolicy', 'delete_attendancepolicy', 'view_attendancepolicy']);
      this.GrouppermissionsValidationPol = this.filterUnique(all, ['add_attendancevalidationpolicy', 'change_attendancevalidationpolicy', 'delete_attendancevalidationpolicy', 'view_attendancevalidationpolicy']);
      this.GrouppermissionsLateComePol = this.filterUnique(all, ['add_latecomingpolicy', 'change_latecomingpolicy', 'delete_latecomingpolicy', 'view_latecomingpolicy']);
      this.GrouppermissionsEarlyExitPol = this.filterUnique(all, ['add_earlyexitpolicy', 'change_earlyexitpolicy', 'delete_earlyexitpolicy', 'view_earlyexitpolicy']);
      this.GrouppermissionsManualentry = this.filterUnique(all, ['add_attendance_manual', 'change_attendance_manual', 'delete_attendance_manual', 'view_attendance_manual', 'export_attendance_manual'], orderPriority);
      this.GrouppermissionsGeoFence = this.filterUnique(all, ['add_branchgeofence', 'change_branchgeofence', 'delete_branchgeofence', 'view_branchgeofence']);
      this.GrouppermissionsLateinEarlyout = this.filterUnique(all, ['add_lateinearlyoutrequest', 'change_lateinearlyoutrequest', 'delete_lateinearlyoutrequest', 'view_lateinearlyoutrequest']);
      this.GrouppermissionsLinEoutAprlvl = this.filterUnique(all, ['add_lateinearlyoutapprovallevel', 'change_lateinearlyoutapprovallevel', 'delete_lateinearlyoutapprovallevel', 'view_lateinearlyoutapprovallevel']);
      this.GrouppermissionsLinEoutApr = this.filterUnique(all, ['add_lateinearlyoutapproval', 'change_lateinearlyoutapproval', 'delete_lateinearlyoutapproval', 'view_lateinearlyoutapproval']);
  
       // Email Templates
      this.GrouppermissionsGeneralReqTemp = this.filterUnique(all, ['add_emailtemplate', 'change_emailtemplate', 'delete_emailtemplate', 'view_emailtemplate']);
      this.GrouppermissionsLeaveEmTemp = this.filterUnique(all, ['add_lvemailtemplate', 'change_lvemailtemplate', 'delete_lvemailtemplate', 'view_lvemailtemplate']);
      this.GrouppermissionsDocExpTemp = this.filterUnique(all, ['add_docexpemailtemplate', 'change_docexpemailtemplate', 'delete_docexpemailtemplate', 'view_docexpemailtemplate']);
      this.GrouppermissionsDocReqTemp = this.filterUnique(all, ['add_docrequestemailtemplate', 'change_docrequestemailtemplate', 'delete_docrequestemailtemplate', 'view_docrequestemailtemplate']);
      this.GrouppermissionsAdvSalReqTemp = this.filterUnique(all, ['add_advancesalaryemailtemplate', 'change_advancesalaryemailtemplate', 'delete_advancesalaryemailtemplate', 'view_advancesalaryemailtemplate']);
      this.GrouppermissionsLoanReqTemp = this.filterUnique(all, ['add_loanemailtemplate', 'change_loanemailtemplate', 'delete_loanemailtemplate', 'view_loanemailtemplate']);
      this.GrouppermissionsAssetReqTemp = this.filterUnique(all, ['add_assetemailtemplate', 'change_assetemailtemplate', 'delete_assetemailtemplate', 'view_assetemailtemplate']);
      this.GrouppermissionsAirticketReqTemp = this.filterUnique(all, ['add_airticketemailtemplate', 'change_airticketemailtemplate', 'delete_airticketemailtemplate', 'view_airticketemailtemplate']);
      this.GrouppermissionsResignationReqTemp = this.filterUnique(all, ['add_resignationemailtemplate', 'change_resignationemailtemplate', 'delete_resignationemailtemplate', 'view_resignationemailtemplate']);
      this.GrouppermissionsLinEoutReqTemp = this.filterUnique(all, ['add_latinearlyoutemailtemplate', 'change_latinearlyoutemailtemplate', 'delete_latinearlyoutemailtemplate', 'view_latinearlyoutemailtemplate']);
  
        // Leave Management
      this.GrouppermissionsLeaveaprv = this.filterUnique(all, ['add_leaveapproval', 'change_leaveapproval', 'delete_leaveapproval', 'view_leaveapproval']);
      this.GrouppermissionsLeavetype = this.filterUnique(all, ['add_leave_type', 'change_leave_type', 'delete_leave_type', 'view_leave_type']);
      this.GrouppermissionsLeaveEscalation = this.filterUnique(all, ['add_leave_escalation', 'change_leave_escalation', 'delete_leave_escalation', 'view_leave_escalation']);
      this.GrouppermissionsLeavemaster = this.filterUnique(all, ['add_leave_entitlement', 'change_leave_entitlement', 'delete_leave_entitlement', 'view_leave_entitlement']);
      this.GrouppermissionsLeavereq = this.filterUnique(all, ['add_employee_leave_request', 'change_employee_leave_request', 'delete_employee_leave_request', 'view_employee_leave_request']);
      this.GrouppermissionsLeavecom = this.filterUnique(all, ['add_compensatoryleaverequest', 'change_compensatoryleaverequest', 'delete_compensatoryleaverequest', 'view_compensatoryleaverequest']);
      this.GrouppermissionsLeaveaprvlvl = this.filterUnique(all, ['add_leaveapprovallevels', 'change_leaveapprovallevels', 'delete_leaveapprovallevels', 'view_leaveapprovallevels']);
      this.GrouppermissionsLeaveBalance = this.filterUnique(all, ['add_emp_leave_balance', 'change_emp_leave_balance', 'delete_emp_leave_balance', 'view_emp_leave_balance']);
      this.GrouppermissionsLeaveCancel = this.filterUnique(all, ['add_lv_cancellation', 'change_lv_cancellation', 'delete_lv_cancellation', 'view_lv_cancellation']);
      this.GrouppermissionsLeaveAccrual = this.filterUnique(all, ['add_leave_accrual_transaction', 'change_leave_accrual_transaction', 'delete_leave_accrual_transaction', 'view_leave_accrual_transaction']);
      this.GrouppermissionsLeaveRejoin = this.filterUnique(all, ['add_employeerejoining', 'change_employeerejoining', 'delete_employeerejoining', 'view_employeerejoining']);
  
        // Payroll Management
      this.GrouppermissionsPayrollrun = this.filterUnique(all, ['add_payrollrun', 'change_payrollrun', 'delete_payrollrun', 'view_payrollrun']);
      this.GrouppermissionsPayStructure = this.filterUnique(all, ['add_paystructure', 'change_paystructure', 'delete_paystructure', 'view_paystructure']);
      this.GrouppermissionsSalarycomponent = this.filterUnique(all, ['add_salarycomponent', 'change_salarycomponent', 'delete_salarycomponent', 'view_salarycomponent']);
      this.GrouppermissionsEmployeesalary = this.filterUnique(all, ['add_employeesalarystructure', 'change_employeesalarystructure', 'delete_employeesalarystructure', 'view_employeesalarystructure']);
      this.GrouppermissionsPayslipAprv = this.filterUnique(all, ['add_payslipapproval', 'change_payslipapproval', 'delete_payslipapproval', 'view_payslipapproval']);
      this.GrouppermissionsPayrollaprlvl = this.filterUnique(all, ['add_payslipcommonworkflow', 'change_payslipcommonworkflow', 'delete_payslipcommonworkflow', 'view_payslipcommonworkflow']);
      this.GrouppermissionsAdvanceSalaryAprvlst = this.filterUnique(all, ['add_advancesalaryapproval', 'change_advancesalaryapproval', 'delete_advancesalaryapproval', 'view_advancesalaryapproval']);
      this.GrouppermissionsAdvanceSalaryReq = this.filterUnique(all, ['add_advancesalaryrequest', 'change_advancesalaryrequest', 'delete_advancesalaryrequest', 'view_advancesalaryrequest']);
      this.GrouppermissionsAdvanceSalaryEscalation = this.filterUnique(all, ['add_advsalary_escalation', 'change_advsalary_escalation', 'delete_advsalary_escalation', 'view_advsalary_escalation']);
      this.GrouppermissionsAdvanceSalaryAprlvl = this.filterUnique(all, ['add_advancecommonworkflow', 'change_advancecommonworkflow', 'delete_advancecommonworkflow', 'view_advancecommonworkflow']);
      this.GrouppermissionsWps = this.filterUnique(all, ['add_wps', 'change_wps', 'delete_wps', 'view_wps']);
  
      // Loan Management
      this.GrouppermissionsLoanApproval = this.filterUnique(all, ['add_loanapproval', 'change_loanapproval', 'delete_loanapproval', 'view_loanapproval']);
      this.GrouppermissionsLoanType = this.filterUnique(all, ['add_loantype', 'change_loantype', 'delete_loantype', 'view_loantype']);
      this.GrouppermissionsLoanEscalation = this.filterUnique(all, ['add_loan_escalation', 'change_loan_escalation', 'delete_loan_escalation', 'view_loan_escalation']);
      this.GrouppermissionsLoanRepay = this.filterUnique(all, ['add_loanrepayment', 'change_loanrepayment', 'delete_loanrepayment', 'view_loanrepayment']);
      this.GrouppermissionsLoanAprvlvl = this.filterUnique(all, ['add_loancommonworkflow', 'change_loancommonworkflow', 'delete_loancommonworkflow', 'view_loancommonworkflow']);
      this.GrouppermissionsLoanApp = this.filterUnique(all, ['add_loanapplication', 'change_loanapplication', 'delete_loanapplication', 'view_loanapplication']);
  
      // Asset Management
      this.GrouppermissionsAssetType = this.filterUnique(all, ['add_assettype', 'change_assettype', 'delete_assettype', 'view_assettype']);
      this.GrouppermissionsAssetmaster = this.filterUnique(all, ['add_asset', 'change_asset', 'delete_asset', 'view_asset']);
      this.GrouppermissionsAssetEscalation = this.filterUnique(all, ['add_asset_escalation', 'change_asset_escalation', 'delete_asset_escalation', 'view_asset_escalation']);
      this.GrouppermissionsAssetApprovals = this.filterUnique(all, ['add_assetapproval', 'change_assetapproval', 'delete_assetapproval', 'view_assetapproval']);
      this.GrouppermissionsAssetAlon = this.filterUnique(all, ['add_assetallocation', 'change_assetallocation', 'delete_assetallocation', 'view_assetallocation']);
      this.GrouppermissionsAssetApprovallvl = this.filterUnique(all, ['add_assetapprovallevel', 'change_assetapprovallevel', 'delete_assetapprovallevel', 'view_assetapprovallevel']);
      this.GrouppermissionsAssetReq = this.filterUnique(all, ['add_assetrequest', 'change_assetrequest', 'delete_assetrequest', 'view_assetrequest']);
  
      // Document Management
      this.GrouppermissionsDocumentAddFol = this.filterUnique(all, ['add_folder', 'change_folder', 'delete_folder', 'view_folder']);
  
      // Project Management
      this.GrouppermissionsProjects = this.filterUnique(all, ['add_project', 'change_project', 'delete_project', 'view_project']);
      this.GrouppermissionsProjectStages = this.filterUnique(all, ['add_projectstage', 'change_projectstage', 'delete_projectstage', 'view_projectstage']);
      this.GrouppermissionsProjectTask = this.filterUnique(all, ['add_task', 'change_task', 'delete_task', 'view_task']);
      this.GrouppermissionsProjectTime = this.filterUnique(all, ['add_timesheet', 'change_timesheet', 'delete_timesheet', 'view_timesheet']);
  
      // Airticket Management
      this.GrouppermissionsAirTicketPol = this.filterUnique(all, ['add_airticketpolicy', 'change_airticketpolicy', 'delete_airticketpolicy', 'view_airticketpolicy']);
      this.GrouppermissionsAirTicketApr = this.filterUnique(all, ['add_airticketapproval', 'change_airticketapproval', 'delete_airticketapproval', 'view_airticketapproval']);
      this.GrouppermissionsAirTicketAlon = this.filterUnique(all, ['add_airticketallocation', 'change_airticketallocation', 'delete_airticketallocation', 'view_airticketallocation']);
      this.GrouppermissionsAirTicketEsc = this.filterUnique(all, ['add_airticket_escalation', 'change_airticket_escalation', 'delete_airticket_escalation', 'view_airticket_escalation']);
      this.GrouppermissionsAirTicketReq = this.filterUnique(all, ['add_airticketrequest', 'change_airticketrequest', 'delete_airticketrequest', 'view_airticketrequest']);
      this.GrouppermissionsAirTicketAprlvl = this.filterUnique(all, ['add_airticketworkflow', 'change_airticketworkflow', 'delete_airticketworkflow', 'view_airticketworkflow']);
      this.GrouppermissionsAirTicketRule = this.filterUnique(all, ['add_airticketrule', 'change_airticketrule', 'delete_airticketrule', 'view_airticketrule']);
  
      // Shift Management
      this.GrouppermissionsShifts = this.filterUnique(all, ['add_shift', 'change_shift', 'delete_shift', 'view_shift']);
      this.GrouppermissionsShiftPattern = this.filterUnique(all, ['add_shiftpattern', 'change_shiftpattern', 'delete_shiftpattern', 'view_shiftpattern']);
      this.GrouppermissionsShiftEmployee = this.filterUnique(all, ['add_employeeshiftschedule', 'change_employeeshiftschedule', 'delete_employeeshiftschedule', 'view_employeeshiftschedule']);
      this.GrouppermissionsShiftOverRide = this.filterUnique(all, ['add_shiftoverride', 'change_shiftoverride', 'delete_shiftoverride', 'view_shiftoverride']);
      this.GrouppermissionsEmpOver = this.filterUnique(all, ['add_employeeovertime', 'change_employeeovertime', 'delete_employeeovertime', 'view_employeeovertime']);
      this.GrouppermissionsOverTimePolicy = this.filterUnique(all, ['add_overtimepolicy', 'change_overtimepolicy', 'delete_overtimepolicy', 'view_overtimepolicy']);
      this.GrouppermissionsOvertimeRule = this.filterUnique(all, ['add_overtimerule', 'change_overtimerule', 'delete_overtimerule', 'view_overtimerule']);
    }
  
  
    
  
    // Preselection duplicating logic triggered safely
    preselectPermissions(permissions: any[]): void {
      const permissionIds = permissions.map(p => p.id || p);
      this.selectedPermissions = [...permissionIds];
      this.updateAllMasterCheckboxes();
      this.syncAllUIStates();
    }
  
   get allPermissions(): number[] {
      return [
        ...this.GrouppermissionsEmp, ...this.GrouppermissionsDept, ...this.GrouppermissionsDis, ...this.GrouppermissionsCat,
        ...this.GrouppermissionsExpDocument, ...this.GrouppermissionsEmpAprList, ...this.GrouppermissionsEmpRegAprList,
        ...this.GrouppermissionsEndofSer, ...this.GrouppermissionsRegReq, ...this.GrouppermissionsRegAprlvl, ...this.GrouppermissionsGratuity,
        ...this.GrouppermissionsBrch, ...this.GrouppermissionsUser, ...this.GrouppermissionsUsergroup, ...this.GrouppermissionsassigneddUser,
        ...this.GrouppermissionsBranchUser, ...this.GrouppermissionsstateMaster, ...this.Grouppermissionsdocumentype,
        ...this.GrouppermissionslocationMaster, ...this.GrouppermissionsDnMaster, ...this.GrouppermissionsCpMaster,
        ...this.GrouppermissionsConfigMaster, ...this.GrouppermissionsNotify,
        ...this.GrouppermissionsemployeeReport, ...this.GrouppermissionsdocumnetReport, ...this.GrouppermissiionsgeneralReport,
        ...this.GrouppermissiionsDeptReport, ...this.GrouppermissiionsDesReport, ...this.GrouppermissiionsLeaveReport,
        ...this.GrouppermissiionsLeaveAprRep, ...this.GrouppermissionsLeaveBalReport, ...this.GrouppermissionsAttendReport,
        ...this.GrouppermissionsAssetReport, ...this.GrouppermissionsAssetTransReport,
        ...this.GrouppermissionsEmpform, ...this.GrouppermissionsAssetform,
        ...this.Grouppermissionsaddweek, ...this.Grouppermisionsassignweek, ...this.Grouppermissionsaddholiday, ...this.Grouppermissionsassisgnholiday,
        ...this.GrouppermissionsLeaveaprv, ...this.GrouppermissionsLeavetype, ...this.GrouppermissionsLeaveEscalation, ...this.GrouppermissionsLeavemaster,
        ...this.GrouppermissionsLeavereq, ...this.GrouppermissionsLeavecom, ...this.GrouppermissionsLeaveaprvlvl, ...this.GrouppermissionsLeaveBalance,
        ...this.GrouppermissionsLeaveCancel, ...this.GrouppermissionsLeaveAccrual, ...this.GrouppermissionsLeaveRejoin,
        ...this.GrouppermissionsPayrollrun, ...this.GrouppermissionsPayStructure, ...this.GrouppermissionsSalarycomponent, ...this.GrouppermissionsEmployeesalary,
        ...this.GrouppermissionsPayslipAprv, ...this.GrouppermissionsPayrollaprlvl, ...this.GrouppermissionsAdvanceSalaryAprvlst, ...this.GrouppermissionsAdvanceSalaryReq,
        ...this.GrouppermissionsAdvanceSalaryEscalation, ...this.GrouppermissionsAdvanceSalaryAprlvl, ...this.GrouppermissionsWps,
        ...this.GrouppermissionsGen, ...this.GrouppermissionsReqtype, ...this.GrouppermissionsApr, ...this.GrouppermissionsAprlvl,
        ...this.GrouppermissionsGenReqEsc, ...this.GrouppermissionsDocumentAprlvl, ...this.GrouppermissionsDocumentApr, ...this.GrouppermissionsDocumentReq,
        ...this.GrouppermissionsDocumentType, ...this.GrouppermissionsAnnounceMaster,
        ...this.GrouppermissionsLoanApproval, ...this.GrouppermissionsLoanType, ...this.GrouppermissionsLoanEscalation, ...this.GrouppermissionsLoanRepay,
        ...this.GrouppermissionsLoanAprvlvl, ...this.GrouppermissionsLoanApp,
        ...this.GrouppermissionsAssetType, ...this.GrouppermissionsAssetmaster, ...this.GrouppermissionsAssetEscalation, ...this.GrouppermissionsAssetApprovals,
        ...this.GrouppermissionsAssetAlon, ...this.GrouppermissionsAssetApprovallvl, ...this.GrouppermissionsAssetReq,
        ...this.GrouppermissionsAtd, ...this.GrouppermissionsPunching, ...this.GrouppermissionsFaceRegister, ...this.GrouppermissionsEmpEarlygoing,
        ...this.GrouppermissionsEmpRecheck, ...this.GrouppermissionsPuncinglist, ...this.GrouppermissionsValidationPol, ...this.GrouppermissionsLateComePol,
        ...this.GrouppermissionsEarlyExitPol, ...this.GrouppermissionsManualentry, ...this.GrouppermissionsGeoFence, ...this.GrouppermissionsLateinEarlyout,
        ...this.GrouppermissionsLinEoutAprlvl, ...this.GrouppermissionsLinEoutApr,
        ...this.GrouppermissionsDocumentAddFol,
        ...this.GrouppermissionsProjects, ...this.GrouppermissionsProjectStages, ...this.GrouppermissionsProjectTask, ...this.GrouppermissionsProjectTime,
        ...this.GrouppermissionsAirTicketPol, ...this.GrouppermissionsAirTicketApr, ...this.GrouppermissionsAirTicketAlon, ...this.GrouppermissionsAirTicketEsc,
        ...this.GrouppermissionsAirTicketReq, ...this.GrouppermissionsAirTicketAprlvl, ...this.GrouppermissionsAirTicketRule,
        ...this.GrouppermissionsGeneralReqTemp, ...this.GrouppermissionsLeaveEmTemp, ...this.GrouppermissionsDocExpTemp, ...this.GrouppermissionsDocReqTemp,
        ...this.GrouppermissionsAdvSalReqTemp, ...this.GrouppermissionsLoanReqTemp, ...this.GrouppermissionsAssetReqTemp, ...this.GrouppermissionsAirticketReqTemp,
        ...this.GrouppermissionsResignationReqTemp, ...this.GrouppermissionsLinEoutReqTemp,
        ...this.GrouppermissionsShifts, ...this.GrouppermissionsShiftPattern, ...this.GrouppermissionsShiftEmployee, ...this.GrouppermissionsShiftOverRide,
        ...this.GrouppermissionsEmpOver, ...this.GrouppermissionsOverTimePolicy, ...this.GrouppermissionsOvertimeRule
      ].map(p => p.id);
    }
  
    onSelectAllPermissions(event: any): void {
      const checked = event.checked;
      this.selectAllPermissions = checked;
      this.selectedPermissions = checked ? [...this.allPermissions] : [];
      this.syncAllUIStates();
      this.updateAllMasterCheckboxes();
    }
  
    syncAllUIStates() {
      const total = this.allPermissions.length;
      const selected = this.selectedPermissions.length;
      this.selectAllPermissions = selected === total;
    }
  
    updateAllMasterCheckboxes(): void {
      // Employee Management Rows
      this.employeeMasterChecked = this.GrouppermissionsEmp.every(p => this.selectedPermissions.includes(p.id));
      this.departmentMasterChecked = this.GrouppermissionsDept.every(p => this.selectedPermissions.includes(p.id));
      this.designationMasterChecked = this.GrouppermissionsDis.every(p => this.selectedPermissions.includes(p.id));
      this.categoryMasterChecked = this.GrouppermissionsCat.every(p => this.selectedPermissions.includes(p.id));
      this.ExpDocumentChecked = this.GrouppermissionsExpDocument.every(p => this.selectedPermissions.includes(p.id));
      this.EmpAprListChecked = this.GrouppermissionsEmpAprList.every(p => this.selectedPermissions.includes(p.id));
      this.EmpRegAprListChecked = this.GrouppermissionsEmpRegAprList.every(p => this.selectedPermissions.includes(p.id));
      this.EndofSerChecked = this.GrouppermissionsEndofSer.every(p => this.selectedPermissions.includes(p.id));
      this.RegReqChecked = this.GrouppermissionsRegReq.every(p => this.selectedPermissions.includes(p.id));
      this.RegAprlvlChecked = this.GrouppermissionsRegAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.GratuityChecked = this.GrouppermissionsGratuity.every(p => this.selectedPermissions.includes(p.id));
  
      // Settings Rows
      this.branchMasterChecked = this.GrouppermissionsBrch.every(p => this.selectedPermissions.includes(p.id));
      this.documenttypeMasterChecked = this.Grouppermissionsdocumentype.every(p => this.selectedPermissions.includes(p.id));
      this.locationMasterChecked = this.GrouppermissionslocationMaster.every(p => this.selectedPermissions.includes(p.id));
      this.DnMasterChecked = this.GrouppermissionsDnMaster.every(p => this.selectedPermissions.includes(p.id));
      this.CpMasterChecked = this.GrouppermissionsCpMaster.every(p => this.selectedPermissions.includes(p.id));
      this.ConfigMasterChecked = this.GrouppermissionsConfigMaster.every(p => this.selectedPermissions.includes(p.id));
      this.NotefyChecked = this.GrouppermissionsNotify.every(p => this.selectedPermissions.includes(p.id));
  
        // Reports Rows
      this.emportReportChecked = this.GrouppermissionsemployeeReport.every(p => this.selectedPermissions.includes(p.id));
      this.documentReportChecked = this.GrouppermissionsdocumnetReport.every(p => this.selectedPermissions.includes(p.id));
      this.generelReportChecked = this.GrouppermissiionsgeneralReport.every(p => this.selectedPermissions.includes(p.id));
      this.DeptReportChecked = this.GrouppermissiionsDeptReport.every(p => this.selectedPermissions.includes(p.id));
      this.DesReportChecked = this.GrouppermissiionsDesReport.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveReportChecked = this.GrouppermissiionsLeaveReport.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveAprRepChecked = this.GrouppermissiionsLeaveAprRep.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveBalReportChecked = this.GrouppermissionsLeaveBalReport.every(p => this.selectedPermissions.includes(p.id));
      this.AttendReportChecked = this.GrouppermissionsAttendReport.every(p => this.selectedPermissions.includes(p.id));
      this.AssetReportChecked = this.GrouppermissionsAssetReport.every(p => this.selectedPermissions.includes(p.id));
      this.AssetTransReportChecked = this.GrouppermissionsAssetTransReport.every(p => this.selectedPermissions.includes(p.id));
  
      // Email Template Rows
      this.GeneralReqTempChecked = this.GrouppermissionsGeneralReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveEmTempChecked = this.GrouppermissionsLeaveEmTemp.every(p => this.selectedPermissions.includes(p.id));
      this.DocExpTempChecked = this.GrouppermissionsDocExpTemp.every(p => this.selectedPermissions.includes(p.id));
      this.DocReqTempChecked = this.GrouppermissionsDocReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.AdvSalReqTempChecked = this.GrouppermissionsAdvSalReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.LoanReqTempChecked = this.GrouppermissionsLoanReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.AssetReqTempChecked = this.GrouppermissionsAssetReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.AirticketReqTempChecked = this.GrouppermissionsAirticketReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.ResignationReqTempChecked = this.GrouppermissionsResignationReqTemp.every(p => this.selectedPermissions.includes(p.id));
      this.LinEoutReqTempChecked = this.GrouppermissionsLinEoutReqTemp.every(p => this.selectedPermissions.includes(p.id));
  
  
      // Customization Rows
      this.EmpformChecked = this.GrouppermissionsEmpform.every(p => this.selectedPermissions.includes(p.id));
      this.AssetformChecked = this.GrouppermissionsAssetform.every(p => this.selectedPermissions.includes(p.id));
  
      // Calendar Rows
      this.addweekChecked = this.Grouppermissionsaddweek.every(p => this.selectedPermissions.includes(p.id));
      this.assignweekChecked = this.Grouppermisionsassignweek.every(p => this.selectedPermissions.includes(p.id));
      this.addholidayChecked = this.Grouppermissionsaddholiday.every(p => this.selectedPermissions.includes(p.id));
      this.assignholidayChecked = this.Grouppermissionsassisgnholiday.every(p => this.selectedPermissions.includes(p.id));
  
  
         // Leave Rows
      this.LeaveaprvChecked = this.GrouppermissionsLeaveaprv.every(p => this.selectedPermissions.includes(p.id));
      this.LeavetypeChecked = this.GrouppermissionsLeavetype.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveEscalationChecked = this.GrouppermissionsLeaveEscalation.every(p => this.selectedPermissions.includes(p.id));
      this.LeavepolicyChecked = this.GrouppermissionsLeavemaster.every(p => this.selectedPermissions.includes(p.id));
      this.LeavereqChecked = this.GrouppermissionsLeavereq.every(p => this.selectedPermissions.includes(p.id));
      this.LeavecomChecked = this.GrouppermissionsLeavecom.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveaprvlvlChecked = this.GrouppermissionsLeaveaprvlvl.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveBalanceChecked = this.GrouppermissionsLeaveBalance.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveCancelChecked = this.GrouppermissionsLeaveCancel.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveAccrualChecked = this.GrouppermissionsLeaveAccrual.every(p => this.selectedPermissions.includes(p.id));
      this.LeaveRejoinChecked = this.GrouppermissionsLeaveRejoin.every(p => this.selectedPermissions.includes(p.id));
  
  
          // Payroll Rows
      this.PayrollrunChecked = this.GrouppermissionsPayrollrun.every(p => this.selectedPermissions.includes(p.id));
      this.PayStructureChecked = this.GrouppermissionsPayStructure.every(p => this.selectedPermissions.includes(p.id));
      this.SalarycomponentChecked = this.GrouppermissionsSalarycomponent.every(p => this.selectedPermissions.includes(p.id));
      this.EmployeeSalaryChecked = this.GrouppermissionsEmployeesalary.every(p => this.selectedPermissions.includes(p.id));
      this.PayslipAprvChecked = this.GrouppermissionsPayslipAprv.every(p => this.selectedPermissions.includes(p.id));
      this.PayrollaprlvlChecked = this.GrouppermissionsPayrollaprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.AdvanceSalaryAprvlstChecked = this.GrouppermissionsAdvanceSalaryAprvlst.every(p => this.selectedPermissions.includes(p.id));
      this.AdvanceSalaryReqChecked = this.GrouppermissionsAdvanceSalaryReq.every(p => this.selectedPermissions.includes(p.id));
      this.AdvanceSalaryEscalationChecked = this.GrouppermissionsAdvanceSalaryEscalation.every(p => this.selectedPermissions.includes(p.id));
      this.AdvanceSalaryAprlvlChecked = this.GrouppermissionsAdvanceSalaryAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.WpsChecked = this.GrouppermissionsWps.every(p => this.selectedPermissions.includes(p.id));
  
         // General Rows
      this.GenMasterChecked = this.GrouppermissionsGen.every(p => this.selectedPermissions.includes(p.id));
      this.ReqtypeMasterChecked = this.GrouppermissionsReqtype.every(p => this.selectedPermissions.includes(p.id));
      this.AprMasterChecked = this.GrouppermissionsApr.every(p => this.selectedPermissions.includes(p.id));
      this.AprlvlMasterChecked = this.GrouppermissionsAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.GenReqEscMasterChecked = this.GrouppermissionsGenReqEsc.every(p => this.selectedPermissions.includes(p.id));
      this.DocumentAprlvlChecked = this.GrouppermissionsDocumentAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.DocumentAprChecked = this.GrouppermissionsDocumentApr.every(p => this.selectedPermissions.includes(p.id));
      this.DocumentReqChecked = this.GrouppermissionsDocumentReq.every(p => this.selectedPermissions.includes(p.id));
      this.DocumentTypeChecked = this.GrouppermissionsDocumentType.every(p => this.selectedPermissions.includes(p.id));
      this.AnnounceMasterChecked = this.GrouppermissionsAnnounceMaster.every(p => this.selectedPermissions.includes(p.id));
  
        // Loan Rows
      this.LoanApprovalChecked = this.GrouppermissionsLoanApproval.every(p => this.selectedPermissions.includes(p.id));
      this.LoanTypeChecked = this.GrouppermissionsLoanType.every(p => this.selectedPermissions.includes(p.id));
      this.LoanEscalationChecked = this.GrouppermissionsLoanEscalation.every(p => this.selectedPermissions.includes(p.id));
      this.LoanRepayChecked = this.GrouppermissionsLoanRepay.every(p => this.selectedPermissions.includes(p.id));
      this.LoanAprvlvlChecked = this.GrouppermissionsLoanAprvlvl.every(p => this.selectedPermissions.includes(p.id));
      this.LoanAppChecked = this.GrouppermissionsLoanApp.every(p => this.selectedPermissions.includes(p.id));
  
      // Asset Rows
      this.AssetTypeChecked = this.GrouppermissionsAssetType.every(p => this.selectedPermissions.includes(p.id));
      this.AssetmasterChecked = this.GrouppermissionsAssetmaster.every(p => this.selectedPermissions.includes(p.id));
      this.AssetEscalationChecked = this.GrouppermissionsAssetEscalation.every(p => this.selectedPermissions.includes(p.id));
      this.AssetApprovalsChecked = this.GrouppermissionsAssetApprovals.every(p => this.selectedPermissions.includes(p.id));
      this.AssetAlonChecked = this.GrouppermissionsAssetAlon.every(p => this.selectedPermissions.includes(p.id));
      this.AssetApprovallvlChecked = this.GrouppermissionsAssetApprovallvl.every(p => this.selectedPermissions.includes(p.id));
      this.AssetReqChecked = this.GrouppermissionsAssetReq.every(p => this.selectedPermissions.includes(p.id));
  
      // Attendance Rows
      this.AtdMasterChecked = this.GrouppermissionsAtd.every(p => this.selectedPermissions.includes(p.id));
      this.PunchingChecked = this.GrouppermissionsPunching.every(p => this.selectedPermissions.includes(p.id));
      this.FaceRegisterChecked = this.GrouppermissionsFaceRegister.every(p => this.selectedPermissions.includes(p.id));
      this.EmpEarlygoingChecked = this.GrouppermissionsEmpEarlygoing.every(p => this.selectedPermissions.includes(p.id));
      this.EmpRecheckChecked = this.GrouppermissionsEmpRecheck.every(p => this.selectedPermissions.includes(p.id));
      this.PuncinglistChecked = this.GrouppermissionsPuncinglist.every(p => this.selectedPermissions.includes(p.id));
      this.validationPolChecked = this.GrouppermissionsValidationPol.every(p => this.selectedPermissions.includes(p.id));
      this.LateComePolChecked = this.GrouppermissionsLateComePol.every(p => this.selectedPermissions.includes(p.id));
      this.EarlyExitPolChecked = this.GrouppermissionsEarlyExitPol.every(p => this.selectedPermissions.includes(p.id));
      this.ManualentryChecked = this.GrouppermissionsManualentry.every(p => this.selectedPermissions.includes(p.id));
      this.GeoFenceChecked = this.GrouppermissionsGeoFence.every(p => this.selectedPermissions.includes(p.id));
      this.LateinEarlyoutChecked = this.GrouppermissionsLateinEarlyout.every(p => this.selectedPermissions.includes(p.id));
      this.LinEoutAprlvlChecked = this.GrouppermissionsLinEoutAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.LinEoutAprChecked = this.GrouppermissionsLinEoutApr.every(p => this.selectedPermissions.includes(p.id));
  
      // Document Rows
      this.DocumentAddFolChecked = this.GrouppermissionsDocumentAddFol.every(p => this.selectedPermissions.includes(p.id));
  
      // Project Rows
      this.ProjectsChecked = this.GrouppermissionsProjects.every(p => this.selectedPermissions.includes(p.id));
      this.ProjectStagesChecked = this.GrouppermissionsProjectStages.every(p => this.selectedPermissions.includes(p.id));
      this.ProjectTaskChecked = this.GrouppermissionsProjectTask.every(p => this.selectedPermissions.includes(p.id));
      this.ProjectTimeChecked = this.GrouppermissionsProjectTime.every(p => this.selectedPermissions.includes(p.id));
    
      // AirTicket Rows
      this.AirTicketPolChecked = this.GrouppermissionsAirTicketPol.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketAprChecked = this.GrouppermissionsAirTicketApr.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketAlonChecked = this.GrouppermissionsAirTicketAlon.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketEscChecked = this.GrouppermissionsAirTicketEsc.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketReqChecked = this.GrouppermissionsAirTicketReq.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketAprlvlChecked = this.GrouppermissionsAirTicketAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.AirTicketRuleChecked = this.GrouppermissionsAirTicketRule.every(p => this.selectedPermissions.includes(p.id));
       // Shift Rows
      this.ShiftsChecked = this.GrouppermissionsShifts.every(p => this.selectedPermissions.includes(p.id));
      this.ShiftPatternChecked = this.GrouppermissionsShiftPattern.every(p => this.selectedPermissions.includes(p.id));
      this.ShiftEmployeeChecked = this.GrouppermissionsShiftEmployee.every(p => this.selectedPermissions.includes(p.id));
      this.ShiftOverRideChecked = this.GrouppermissionsShiftOverRide.every(p => this.selectedPermissions.includes(p.id));
      this.EmpOverChecked = this.GrouppermissionsEmpOver.every(p => this.selectedPermissions.includes(p.id));
      this.OvertimePolicyChecked = this.GrouppermissionsOverTimePolicy.every(p => this.selectedPermissions.includes(p.id));
      this.OvertimeRuleChecked = this.GrouppermissionsOvertimeRule.every(p => this.selectedPermissions.includes(p.id));
  
      // User and Permission Rows
      this.userMasterChecked = this.GrouppermissionsUser.every(p => this.selectedPermissions.includes(p.id));
      this.usergroupingMasterChecked = this.GrouppermissionsUsergroup.every(p => this.selectedPermissions.includes(p.id));
      this.assignpermissionMasterChecked = this.GrouppermissionsassigneddUser.every(p => this.selectedPermissions.includes(p.id));
      this.BranchpermissionMasterChecked = this.GrouppermissionsBranchUser.every(p => this.selectedPermissions.includes(p.id));
      this.stationMasterChecked = this.GrouppermissionsstateMaster.every(p => this.selectedPermissions.includes(p.id));
  
  
   
  
      // Header Selectors
      this.updateEmployeeManagementCheckbox();
      this.updateSettingsCheckbox();
      this.updateReportCheckbox();
      this.updateCustomizationCheckbox();
      this.updateCalenderCheckbox();
      this.updateShiftCheckbox();
      this.updateAirTicketCheckbox();
      this.updateProjectCheckbox();
      this.updateDocumentAddCheckbox();
      this.updateAttendanceCheckbox();
      this.updateAssetCheckbox();
      this.updateLoanCheckbox();
      this.updateGeneralManageCheckbox();
      this.updatePayrollCheckbox();
      this.updateLeaveCheckbox();
      this.updateEmailTemplateCheckbox();
      this.updateuserandperCheckbox();
    }
  
    isEmployeeManagementMasterChecked(): boolean {
      return this.employeeMasterChecked && this.departmentMasterChecked && this.designationMasterChecked &&
        this.categoryMasterChecked && this.ExpDocumentChecked && this.EmpAprListChecked && this.EmpRegAprListChecked &&
        this.EndofSerChecked && this.RegReqChecked && this.RegAprlvlChecked && this.GratuityChecked;
    }
  
    updateEmployeeManagementCheckbox() {
      this.selectAllChecked = this.isEmployeeManagementMasterChecked();
    }
  
    updateSettingsCheckbox(): void {
      this.settingsChecked = this.branchMasterChecked && this.userMasterChecked && this.usergroupingMasterChecked &&
        this.assignpermissionMasterChecked && this.BranchpermissionMasterChecked && this.stationMasterChecked &&
        this.documenttypeMasterChecked && this.locationMasterChecked && this.DnMasterChecked && this.CpMasterChecked &&
        this.ConfigMasterChecked && this.NotefyChecked;
    }
  
    // updateReportCheckbox(): void {
    //   this.reportchecked = this.emportReportChecked && this.documentReportChecked && this.generelReportChecked &&
    //     this.DeptReportChecked && this.DesReportChecked && this.LeaveReportChecked && this.LeaveAprRepChecked &&
    //     this.LeaveBalReportChecked && this.AttendReportChecked && this.AssetReportChecked && this.AssetTransReportChecked;
    // }
  
    updateCustomizationCheckbox(): void {
      this.customizationchecked = this.EmpformChecked && this.AssetformChecked;
    }
  
    // updateLeaveCheckbox(): void {
    //   this.Leavechecked = this.EmpformChecked && this.AssetformChecked;
    // }
  
    updateCalenderCheckbox(): void {
      this.calenderchecked = this.addweekChecked && this.assignweekChecked && this.addholidayChecked && this.assignholidayChecked;
    }
  
    isEmployeeMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmp.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsEmp.length;
    }
  
    isDepartmentMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDept.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsDept.length;
    }
  
    isDesignationMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDis.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsDis.length;
    }
  
    isCategoryMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsCat.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsCat.length;
    }
  
    isExpDocumentIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsExpDocument.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsExpDocument.length;
    }
  
    isEmpAprListIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpAprList.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsEmpAprList.length;
    }
  
    isEmpRegAprListIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpRegAprList.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsEmpRegAprList.length;
    }
  
    isEndofSerIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEndofSer.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsEndofSer.length;
    }
  
    isRegReqIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsRegReq.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsRegReq.length;
    }
  
    isRegAprlvlIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsRegAprlvl.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsRegAprlvl.length;
    }
  
    isGratuityIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsGratuity.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsGratuity.length;
    }
  
    isBranchMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsBrch.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsBrch.length;
    }
  
    isStateMasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsstateMaster.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsstateMaster.length;
    }
  
    isdocumenttypeIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.Grouppermissionsdocumentype.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.Grouppermissionsdocumentype.length;
    }
  
    isloactionmasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionslocationMaster.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionslocationMaster.length;
    }
  
    isDnmasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDnMaster.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsDnMaster.length;
    }
  
    isCpmasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsCpMaster.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsCpMaster.length;
    }
  
    isConfigmasterIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsConfigMaster.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsConfigMaster.length;
    }
  
    isNotifyIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsNotify.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsNotify.length;
    }
  
    isEmployeeReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsemployeeReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsemployeeReport.length;
    }
  
    // Report Management
  
    isDocumentReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsdocumnetReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsdocumnetReport.length;
    }
  
      isGeneralReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissiionsgeneralReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissiionsgeneralReport.length;
    }
  
     isDeptReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissiionsDeptReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissiionsDeptReport.map.length;
    }
  
     isDesReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissiionsDesReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissiionsDesReport.map.length;
    }
  
      isLeaveReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissiionsLeaveReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissiionsLeaveReport.map.length;
    }
  
    isLeaveAprRepIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissiionsLeaveAprRep.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissiionsLeaveAprRep.map.length;
    }
  
    isLeaveBalReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveBalReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsLeaveBalReport.map.length;
    }
  
    isAttendReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAttendReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsAttendReport.map.length;
    }
  
    isAssetReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsAssetReport.map.length;
    }
  
    isAssetTransReportIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetTransReport.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsAssetTransReport.map.length;
    }
  
  // customization management
    isEmpformIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpform.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsEmpform.length;
    }
  
    isAssetformIndeterminate(): boolean {
      const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetform.map(x => x.id).includes(p));
      return sel.length > 0 && sel.length < this.GrouppermissionsAssetform.length;
    }
  
    isAddWeekIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.Grouppermissionsaddweek.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.Grouppermissionsaddweek.length;
  }
  
  isAssignWeekIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.Grouppermisionsassignweek.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.Grouppermisionsassignweek.length;
  }
  
  isAddHolidayIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.Grouppermissionsaddholiday.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.Grouppermissionsaddholiday.length;
  }
  
  isAssignHolidayIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.Grouppermissionsassisgnholiday.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.Grouppermissionsassisgnholiday.length;
  }
  
  // Leave Management
  isLeaveaprvIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveaprv.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveaprv.length;
  }
  
  isLeavetypeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeavetype.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeavetype.length;
  }
  
  isLeaveEscalationIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveEscalation.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveEscalation.length;
  }
  
  isLeavepolicyIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeavemaster.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeavemaster.length;
  }
  
  isLeavereqIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeavereq.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeavereq.length;
  }
  
  isLeavecomIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeavecom.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeavecom.length;
  }
  
  isLeaveaprvlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveaprvlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveaprvlvl.length;
  }
  
  isLeaveBalanceIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveBalance.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveBalance.length;
  }
  
  isLeaveCancelIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveCancel.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveCancel.length;
  }
  
  isLeaveAccrualIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveAccrual.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveAccrual.length;
  }
  
  isLeaveRejoinIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLeaveRejoin.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLeaveRejoin.length;
  }
  
  // Payroll Management
  isPayrollrunIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPayrollrun.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPayrollrun.length;
  }
  
  isPayStructureIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPayStructure.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPayStructure.length;
  }
  
  isSalarycomponentIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsSalarycomponent.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsSalarycomponent.length;
  }
  
  isEmployeesalaryIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmployeesalary.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsEmployeesalary.length;
  }
  
  isPayslipAprvIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPayslipAprv.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPayslipAprv.length;
  }
  
  isPayrollaprlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPayrollaprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPayrollaprlvl.length;
  }
  
  isAdvanceSalaryAprvlstIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAdvanceSalaryAprvlst.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAdvanceSalaryAprvlst.length;
  }
  
  isAdvanceSalaryReqIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAdvanceSalaryReq.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAdvanceSalaryReq.length;
  }
  
  isAdvanceSalaryEscalationIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAdvanceSalaryEscalation.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAdvanceSalaryEscalation.length;
  }
  
  isAdvanceSalaryAprlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAdvanceSalaryAprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAdvanceSalaryAprlvl.length;
  }
  
  isWpsIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsWps.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsWps.length;
  }
  
  // General Management
  isGenMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsGen.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsGen.length;
  }
  
  isReqtypeMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsReqtype.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsReqtype.length;
  }
  
  isAprMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsApr.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsApr.length;
  }
  
  isAprlvlMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAprlvl.length;
  }
  
  isGenReqEscMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsGenReqEsc.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsGenReqEsc.length;
  }
  
  isDocumentAprlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDocumentAprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsDocumentAprlvl.length;
  }
  
  isDocumentAprIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDocumentApr.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsDocumentApr.length;
  }
  
  isDocumentReqIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDocumentReq.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsDocumentReq.length;
  }
  
  isDocumentTypeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDocumentType.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsDocumentType.length;
  }
  
  isAnnounceIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAnnounceMaster.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAnnounceMaster.length;
  }
  
  // Loan Management
  isLoanApprovalIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanApproval.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanApproval.length;
  }
  
  isLoanTypeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanType.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanType.length;
  }
  
  isLoanEscalationIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanEscalation.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanEscalation.length;
  }
  
  isLoanRepayIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanRepay.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanRepay.length;
  }
  
  isLoanAprvlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanAprvlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanAprvlvl.length;
  }
  
  isLoanAppIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLoanApp.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLoanApp.length;
  }
  
  // Asset Management
  isAssetTypeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetType.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetType.length;
  }
  
  isAssetmasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetmaster.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetmaster.length;
  }
  
  isAssetEscalationIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetEscalation.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetEscalation.length;
  }
  
  isAssetApprovalsIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetApprovals.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetApprovals.length;
  }
  
  isAssetAlonIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetAlon.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetAlon.length;
  }
  
  isAssetApprovalLvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetApprovallvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetApprovallvl.length;
  }
  
  isAssetReqIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAssetReq.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAssetReq.length;
  }
  
  // Attendance Management
  isAtdMasterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAtd.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAtd.length;
  }
  
  isPunchingIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPunching.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPunching.length;
  }
  
  isFaceRegisterIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsFaceRegister.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsFaceRegister.length;
  }
  
  isEmpEarlygoingIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpEarlygoing.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsEmpEarlygoing.length;
  }
  
  isEmpRecheckIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpRecheck.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsEmpRecheck.length;
  }
  
  isPuncinglistIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsPuncinglist.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsPuncinglist.length;
  }
  
  isValidationPolIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsValidationPol.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsValidationPol.length;
  }
  
  isLateComePolIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLateComePol.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLateComePol.length;
  }
  
  isEarlyExitPolIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEarlyExitPol.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsEarlyExitPol.length;
  }
  
  isManualentryIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsManualentry.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsManualentry.length;
  }
  
  isGeoFenceIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsGeoFence.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsGeoFence.length;
  }
  
  isLateinEarlyoutIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLateinEarlyout.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLateinEarlyout.length;
  }
  
  isLinEoutAprlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLinEoutAprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLinEoutAprlvl.length;
  }
  
  isLinEoutAprIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsLinEoutApr.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsLinEoutApr.length;
  }
  
  // Document Management
  isDocumentAddFolIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsDocumentAddFol.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsDocumentAddFol.length;
  }
  
  // Project Management
  isProjectsIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsProjects.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsProjects.length;
  }
  
  isProjectStagesIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsProjectStages.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsProjectStages.length;
  }
  
  isProjectTaskIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsProjectTask.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsProjectTask.length;
  }
  
  isProjectTimeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsProjectTime.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsProjectTime.length;
  }
  
  // Airticket Management
  isAirTicketPolIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketPol.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketPol.length;
  }
  
  isAirTicketAprIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketApr.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketApr.length;
  }
  
  isAirTicketAlonIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketAlon.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketAlon.length;
  }
  
  isAirTicketEscIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketEsc.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketEsc.length;
  }
  
  isAirTicketReqIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketReq.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketReq.length;
  }
  
  isAirTicketAprlvlIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketAprlvl.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketAprlvl.length;
  }
  
  isAirTicketRuleIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsAirTicketRule.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsAirTicketRule.length;
  }
  
  // Shift Management
  isShiftsIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsShifts.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsShifts.length;
  }
  
  isShiftPatternIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsShiftPattern.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsShiftPattern.length;
  }
  
  isShiftEmployeeIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsShiftEmployee.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsShiftEmployee.length;
  }
  
  isShiftOverRideIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsShiftOverRide.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsShiftOverRide.length;
  }
  
  isEmpOverIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsEmpOver.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsEmpOver.length;
  }
  
  isOvertimePolicyIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsOverTimePolicy.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsOverTimePolicy.length;
  }
  
  isOvertimeRuleIndeterminate(): boolean {
    const sel = this.selectedPermissions.filter(p => this.GrouppermissionsOvertimeRule.map(x => x.id).includes(p));
    return sel.length > 0 && sel.length < this.GrouppermissionsOvertimeRule.length;
  }
  
  
  
  
    isIndeterminate(): boolean {
      const checkList = [
        ...this.GrouppermissionsEmp, ...this.GrouppermissionsDept, ...this.GrouppermissionsDis, ...this.GrouppermissionsCat,
        ...this.GrouppermissionsExpDocument, ...this.GrouppermissionsEmpAprList, ...this.GrouppermissionsEmpRegAprList,
        ...this.GrouppermissionsEndofSer, ...this.GrouppermissionsRegReq, ...this.GrouppermissionsRegAprlvl, ...this.GrouppermissionsGratuity
      ];
      const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
      return hasSel && !this.isEmployeeManagementMasterChecked();
    }
  
    isIndeterminates(): boolean {
      const checkList = [
        ...this.GrouppermissionsBrch, ...this.GrouppermissionsstateMaster, ...this.Grouppermissionsdocumentype,
        ...this.GrouppermissionslocationMaster, ...this.GrouppermissionsDnMaster, ...this.GrouppermissionsCpMaster,
        ...this.GrouppermissionsConfigMaster, ...this.GrouppermissionsNotify
      ];
      const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
      return hasSel && !this.settingsChecked;
    }
  
    // isReportInderminate(): boolean {
    //   const checkList = [
    //     ...this.GrouppermissionsemployeeReport, ...this.GrouppermissionsdocumnetReport
    //   ];
    //   const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
    //   return hasSel && !this.reportchecked;
    // }
  
    isCustomizationInderminate(): boolean {
      const checkList = [...this.GrouppermissionsEmpform, ...this.GrouppermissionsAssetform];
      const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
      return hasSel && !this.customizationchecked;
    }
  
    isCalenderInderminate(): boolean {
    const checkList = [
      ...this.Grouppermissionsaddweek, ...this.Grouppermisionsassignweek, ...this.Grouppermissionsaddholiday,
      ...this.Grouppermissionsassisgnholiday
    ];
    const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
    return hasSel && !this.calenderchecked;
  }
    
  
    // Row selection actions
    onCheckboxChangeEmp(permissionId: number): void {
      this.togglePermission(permissionId);
      this.updateEmployeeMasterCheckbox();
      this.updateSelectAll();
    }
  
    updateEmployeeMasterCheckbox(): void {
      this.employeeMasterChecked = this.GrouppermissionsEmp.every(p => this.selectedPermissions.includes(p.id));
    }
  
    onCheckboxChangeDept(permissionId: number): void {
      this.togglePermission(permissionId);
      this.updateDepartmentMasterCheckbox();
      this.updateSelectAll();
    }
  
    updateDepartmentMasterCheckbox(): void {
      this.departmentMasterChecked = this.GrouppermissionsDept.every(p => this.selectedPermissions.includes(p.id));
    }
  
    onCheckboxChangeDesg(permissionId: number): void {
      this.togglePermission(permissionId);
      this.updateDesgnationMasterCheckbox();
      this.updateSelectAll();
    }
  
    updateDesgnationMasterCheckbox(): void {
      this.designationMasterChecked = this.GrouppermissionsDis.every(p => this.selectedPermissions.includes(p.id));
    }
  
    onCheckboxChangeCat(permissionId: number): void {
      this.togglePermission(permissionId);
      this.updateCategoryMasterCheckbox();
      this.updateSelectAll();
    }
  
    updateCategoryMasterCheckbox(): void {
      this.categoryMasterChecked = this.GrouppermissionsCat.every(p => this.selectedPermissions.includes(p.id));
    }
  
    onCheckboxChangeExpDocument(permissionId: number): void {
      this.togglePermission(permissionId);
      this.ExpDocumentChecked = this.GrouppermissionsExpDocument.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeEmpAprList(permissionId: number): void {
      this.togglePermission(permissionId);
      this.EmpAprListChecked = this.GrouppermissionsEmpAprList.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeEmpRegAprList(permissionId: number): void {
      this.togglePermission(permissionId);
      this.EmpRegAprListChecked = this.GrouppermissionsEmpRegAprList.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeEndofSer(permissionId: number): void {
      this.togglePermission(permissionId);
      this.EndofSerChecked = this.GrouppermissionsEndofSer.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeRegReq(permissionId: number): void {
      this.togglePermission(permissionId);
      this.RegReqChecked = this.GrouppermissionsRegReq.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeRegAprlvl(permissionId: number): void {
      this.togglePermission(permissionId);
      this.RegAprlvlChecked = this.GrouppermissionsRegAprlvl.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangeGratuity(permissionId: number): void {
      this.togglePermission(permissionId);
      this.GratuityChecked = this.GrouppermissionsGratuity.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAll();
    }
  
    onCheckboxChangesBrch(permissionId: number): void {
      this.togglePermission(permissionId);
      this.branchMasterChecked = this.GrouppermissionsBrch.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesstate(permissionId: number): void {
      this.togglePermission(permissionId);
      this.stationMasterChecked = this.GrouppermissionsstateMaster.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesdoctype(permissionId: number): void {
      this.togglePermission(permissionId);
      this.documenttypeMasterChecked = this.Grouppermissionsdocumentype.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesloc(permissionId: number): void {
      this.togglePermission(permissionId);
      this.locationMasterChecked = this.GrouppermissionslocationMaster.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesDn(permissionId: number): void {
      this.togglePermission(permissionId);
      this.DnMasterChecked = this.GrouppermissionsDnMaster.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesCp(permissionId: number): void {
      this.togglePermission(permissionId);
      this.CpMasterChecked = this.GrouppermissionsCpMaster.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesConfig(permissionId: number): void {
      this.togglePermission(permissionId);
      this.ConfigMasterChecked = this.GrouppermissionsConfigMaster.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesNotify(permissionId: number): void {
      this.togglePermission(permissionId);
      this.NotefyChecked = this.GrouppermissionsNotify.every(p => this.selectedPermissions.includes(p.id));
      this.updateSelectAlls();
    }
  
    onCheckboxChangesEmpReport(permissionId: number): void {
      this.togglePermission(permissionId);
      this.emportReportChecked = this.GrouppermissionsemployeeReport.every(p => this.selectedPermissions.includes(p.id));
      this.updateReport();
    }
  
    onCheckboxChangesdocReport(permissionId: number): void {
      this.togglePermission(permissionId);
      this.documentReportChecked = this.GrouppermissionsdocumnetReport.every(p => this.selectedPermissions.includes(p.id));
      this.updateReport();
    }
  
    onCheckboxChangesgenReport(permissionId: number): void {
      this.togglePermission(permissionId);
      this.generelReportChecked = this.GrouppermissiionsgeneralReport.every(p => this.selectedPermissions.includes(p.id));
      this.updateReport();
    }
  
      onCheckboxChangesDeptReport(permissionId: number): void {
      this.togglePermission(permissionId);
      this.DeptReportChecked = this.GrouppermissiionsDeptReport.every(p => this.selectedPermissions.includes(p.id));
      this.updateReport();
    }
  
    onCheckboxChangesEmpform(permissionId: number): void {
      this.togglePermission(permissionId);
      this.EmpformChecked = this.GrouppermissionsEmpform.every(p => this.selectedPermissions.includes(p.id));
      this.updateCustomization();
    }
  
    onCheckboxChangesAssetform(permissionId: number): void {
      this.togglePermission(permissionId);
      this.AssetformChecked = this.GrouppermissionsAssetform.every(p => this.selectedPermissions.includes(p.id));
      this.updateCustomization();
    }
  
  //   onCheckboxChangesLeaveaprv(permissionId: number): void {
  //   this.togglePermission(permissionId);
  //   this.LeaveaprvChecked = this.GrouppermissionsLeaveaprv.every(p => this.selectedPermissions.includes(p.id));
  //   this.updateLeave();
  // }
  
  // ================= GENERIC HELPERS (fix for missing handlers) =================
  private isGroupIndeterminate(group: any[]): boolean {
    const ids = group.map(x => x.id);
    const sel = this.selectedPermissions.filter(p => ids.includes(p));
    return sel.length > 0 && sel.length < group.length;
  }
  
  private toggleRowPermission(permissionId: number, group: any[], checkedField: string, sectionUpdateFn: () => void): void {
    this.togglePermission(permissionId);
    (this as any)[checkedField] = group.every(p => this.selectedPermissions.includes(p.id));
    sectionUpdateFn();
    this.syncAllUIStates();
  }
  
  private toggleMasterRowGroup(checkedField: string, group: any[], sectionUpdateFn: () => void): void {
    const checked = (this as any)[checkedField];
    this.toggleMasterGroup(checked, group);
    sectionUpdateFn();
    this.syncAllUIStates();
  }
  
  private toggleSectionGroups(sectionCheckedField: string, groups: any[][]): void {
    const allIds = ([] as any[]).concat(...groups).map(p => p.id);
    const checked = (this as any)[sectionCheckedField];
    if (checked) {
      this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
    }
    this.updateAllMasterCheckboxes();
  }
  
  private updateSectionMasterCheckbox(sectionCheckedField: string, groups: any[][]): void {
    (this as any)[sectionCheckedField] = groups.every(g => g.every((p: any) => this.selectedPermissions.includes(p.id)));
  }
  
  private isSectionIndeterminateGeneric(groups: any[][], sectionCheckedField: string): boolean {
    const checkList = ([] as any[]).concat(...groups);
    const hasSel = checkList.some(p => this.selectedPermissions.includes(p.id));
    return hasSel && !(this as any)[sectionCheckedField];
  }
  
    private togglePermission(permissionId: number): void {
      if (this.selectedPermissions.includes(permissionId)) {
        this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
      } else {
        this.selectedPermissions.push(permissionId);
      }
    }
  
    // Row Master Changes
    onEmployeeMasterChange(): void {
      this.toggleMasterGroup(this.employeeMasterChecked, this.GrouppermissionsEmp);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onDepartmentMasterChange(): void {
      this.toggleMasterGroup(this.departmentMasterChecked, this.GrouppermissionsDept);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onDesignationMasterChange(): void {
      this.toggleMasterGroup(this.designationMasterChecked, this.GrouppermissionsDis);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onCategoryMasterChange(): void {
      this.toggleMasterGroup(this.categoryMasterChecked, this.GrouppermissionsCat);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onExpDocumentChange(): void {
      this.toggleMasterGroup(this.ExpDocumentChecked, this.GrouppermissionsExpDocument);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onEmpAprListChange(): void {
      this.toggleMasterGroup(this.EmpAprListChecked, this.GrouppermissionsEmpAprList);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onEmpRegAprListChange(): void {
      this.toggleMasterGroup(this.EmpRegAprListChecked, this.GrouppermissionsEmpRegAprList);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onEndofSerChange(): void {
      this.toggleMasterGroup(this.EndofSerChecked, this.GrouppermissionsEndofSer);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onRegReqChange(): void {
      this.toggleMasterGroup(this.RegReqChecked, this.GrouppermissionsRegReq);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onRegAprlvlChange(): void {
      this.toggleMasterGroup(this.RegAprlvlChecked, this.GrouppermissionsRegAprlvl);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onGratuityChange(): void {
      this.toggleMasterGroup(this.GratuityChecked, this.GrouppermissionsGratuity);
      this.updateEmployeeManagementCheckbox();
      this.updateSelectAll();
    }
  
    onBranchMasterChange(): void {
      this.toggleMasterGroup(this.branchMasterChecked, this.GrouppermissionsBrch);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onUserStateChange(): void {
      this.toggleMasterGroup(this.stationMasterChecked, this.GrouppermissionsstateMaster);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onUserDocumentChange(): void {
      this.toggleMasterGroup(this.documenttypeMasterChecked, this.Grouppermissionsdocumentype);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onUserLocationChange(): void {
      this.toggleMasterGroup(this.locationMasterChecked, this.GrouppermissionslocationMaster);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onUserDnChange(): void {
      this.toggleMasterGroup(this.DnMasterChecked, this.GrouppermissionsDnMaster);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onUserCpChange(): void {
      this.toggleMasterGroup(this.CpMasterChecked, this.GrouppermissionsCpMaster);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onConfigChange(): void {
      this.toggleMasterGroup(this.ConfigMasterChecked, this.GrouppermissionsConfigMaster);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onNotifyChange(): void {
      this.toggleMasterGroup(this.NotefyChecked, this.GrouppermissionsNotify);
      this.updateSettingsCheckbox();
      this.updateSelectAlls();
    }
  
    onEmpReportChange(): void {
      this.toggleMasterGroup(this.emportReportChecked, this.GrouppermissionsemployeeReport);
      this.updateReportCheckbox();
      this.updateReport();
    }
  
    onDocReportChange(): void {
      this.toggleMasterGroup(this.documentReportChecked, this.GrouppermissionsdocumnetReport);
      this.updateReportCheckbox();
      this.updateReport();
    }
  
    onGenReportChange(): void {
      this.toggleMasterGroup(this.generelReportChecked, this.GrouppermissiionsgeneralReport);
      this.updateReportCheckbox();
      this.updateReport();
    }
  
    onDeptReportChange(): void {
      this.toggleMasterGroup(this.DeptReportChecked, this.GrouppermissiionsDeptReport);
      this.updateReportCheckbox();
      this.updateReport();
    }
  
    onEmpformChange(): void {
      this.toggleMasterGroup(this.EmpformChecked, this.GrouppermissionsEmpform);
      this.updateCustomizationCheckbox();
      this.updateCustomization();
    }
  
    onAssetformChange(): void {
      this.toggleMasterGroup(this.AssetformChecked, this.GrouppermissionsAssetform);
      this.updateCustomizationCheckbox();
      this.updateCustomization();
    }
  
    private toggleMasterGroup(masterChecked: boolean, group: any[]): void {
      const ids = group.map(p => p.id);
      if (masterChecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...ids]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !ids.includes(p));
      }
    }
  
    // Section Master checkbox handlers
    selectAll(): void {
      const allIds = [
        ...this.GrouppermissionsEmp, ...this.GrouppermissionsDept, ...this.GrouppermissionsCat, ...this.GrouppermissionsDis,
        ...this.GrouppermissionsExpDocument, ...this.GrouppermissionsEmpAprList, ...this.GrouppermissionsEmpRegAprList,
        ...this.GrouppermissionsEndofSer, ...this.GrouppermissionsRegReq, ...this.GrouppermissionsRegAprlvl, ...this.GrouppermissionsGratuity
      ].map(p => p.id);
  
      if (this.selectAllChecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
      }
      this.updateAllMasterCheckboxes();
    }
  
    selectAlls(): void {
      const allIds = [
        ...this.GrouppermissionsBrch, ...this.GrouppermissionsstateMaster, ...this.Grouppermissionsdocumentype,
        ...this.GrouppermissionslocationMaster, ...this.GrouppermissionsDnMaster, ...this.GrouppermissionsCpMaster,
        ...this.GrouppermissionsConfigMaster, ...this.GrouppermissionsNotify
      ].map(p => p.id);
  
      if (this.settingsChecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
      }
      this.updateAllMasterCheckboxes();
    }
  
    selectReport(): void {
      const allIds = [...this.GrouppermissionsemployeeReport, ...this.GrouppermissionsdocumnetReport, ...this.GrouppermissiionsgeneralReport, ...this.GrouppermissiionsDeptReport, ...this.GrouppermissiionsDesReport,
        ...this.GrouppermissiionsLeaveReport, ...this.GrouppermissiionsLeaveAprRep, ...this.GrouppermissionsLeaveBalReport, ...this.GrouppermissionsAttendReport, ...this.GrouppermissionsAssetReport, ...this.GrouppermissionsAssetTransReport
      ].map(p => p.id);
      if (this.reportchecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
      }
      this.updateAllMasterCheckboxes();
    }
  
    selectCustomization(): void {
      const allIds = [...this.GrouppermissionsEmpform, ...this.GrouppermissionsAssetform].map(p => p.id);
      if (this.customizationchecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
      }
      this.updateAllMasterCheckboxes();
    }
  
      selectCalender(): void {
      const allIds = [...this.Grouppermissionsaddweek, ...this.Grouppermisionsassignweek, ...this.Grouppermissionsaddholiday, ...this.Grouppermissionsassisgnholiday].map(p => p.id);
      if (this.calenderchecked) {
        this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allIds]));
      } else {
        this.selectedPermissions = this.selectedPermissions.filter(p => !allIds.includes(p));
      }
      this.updateAllMasterCheckboxes();
    }
  
    // Base state refreshers
    updateSelectAll(): void {
      this.updateEmployeeManagementCheckbox();
      this.syncAllUIStates();
    }
  
    updateSelectAlls(): void {
      this.updateSettingsCheckbox();
      this.syncAllUIStates();
    }
  
    updateReport(): void {
      this.updateReportCheckbox();
      this.syncAllUIStates();
    }
  
    updateCustomization(): void {
      this.updateCustomizationCheckbox();
      this.syncAllUIStates();
    }
  
    updateLeave(): void {
      this.updateLeaveCheckbox();
      this.syncAllUIStates();
    }
  
    
  
    // Display Name maps
    getDisplayNameEmp = (c: string) => this.getStandardName(c, 'emp_master');
    getDisplayNameDept = (c: string) => this.getStandardName(c, 'dept_master');
    getDisplayNameDesg = (c: string) => this.getStandardName(c, 'desgntn_master');
    getDisplayNameCat = (c: string) => this.getStandardName(c, 'ctgry_master');
    getDisplayNameFaceRegister = (c: string) => this.getStandardName(c, 'attendance_faceregister');
    getDisplayNameExpDocument = (c: string) => this.getStandardName(c, 'notification');
    getDisplayNameEmpAprList = (c: string) => this.getStandardName(c, 'resignationapproval');
    getDisplayNameEndofSer = (c: string) => this.getStandardName(c, 'endofservice');
    getDisplayNameRegReq = (c: string) => this.getStandardName(c, 'employeeresignation');
    getDisplayNameRegAprlvl = (c: string) => this.getStandardName(c, 'resignationapprovallevel');
    getDisplayNameGratuity = (c: string) => this.getStandardName(c, 'gratuitytable');
    getDisplayNameBranch = (c: string) => this.getStandardName(c, 'brnch_mstr');
    getDisplayNameUser = (c: string) => this.getStandardName(c, 'customuser');
    getDisplayNameState = (c: string) => this.getStandardName(c, 'state_mstr');
    getDisplayNameDocType = (c: string) => this.getStandardName(c, 'document_type');
    getDisplayNameCompany = (c: string) => this.getStandardName(c, 'company');
    getDisplayNameDn = (c: string) => this.getStandardName(c, 'documentnumbering');
    getDisplayNameCp = (c: string) => this.getStandardName(c, 'companypolicy');
    getDisplayNameConfig = (c: string) => this.getStandardName(c, 'emailconfiguration');
    getDisplayNameNotify = (c: string) => this.getStandardName(c, 'notificationsettings');
    getDisplayNameEmpform = (c: string) => this.getStandardName(c, 'emp_customfield');
    getDisplayNameAssetform = (c: string) => this.getStandardName(c, 'asset_customfield');
    // Calendar Management
    getDisplayNameAddWeek = (c: string) => this.getStandardName(c, 'weekend_calendar');
    getDisplayNameAssignWeek = (c: string) => this.getStandardName(c, 'assign_weekend');
    getDisplayNameAddholiday = (c: string) => this.getStandardName(c, 'holiday_calendar');
    getDisplayNameAssignholidayDetail = (c: string) => this.getStandardName(c, 'assign_holiday');
    // Email Templates
  getDisplayNameGeneralReqTemp = (c: string) => this.getStandardName(c, 'emailtemplate');
  getDisplayNameLeaveEmTemp = (c: string) => this.getStandardName(c, 'lvemailtemplate');
  getDisplayNameDocExpTemp = (c: string) => this.getStandardName(c, 'docexpemailtemplate');
  getDisplayNameDocReqTemp = (c: string) => this.getStandardName(c, 'docrequestemailtemplate');
  getDisplayNameAdvanceSalReqTemp = (c: string) => this.getStandardName(c, 'advancesalaryemailtemplate');
  getDisplayNameLoanReqTemp = (c: string) => this.getStandardName(c, 'loanemailtemplate');
  getDisplayNameAssetReqTemp = (c: string) => this.getStandardName(c, 'assetemailtemplate');
  getDisplayNameAirticketReqTemp = (c: string) => this.getStandardName(c, 'airticketemailtemplate');
  getDisplayNameResignationReqTemp = (c: string) => this.getStandardName(c, 'resignationemailtemplate');
  getDisplayNameLinEoutReqTemp = (c: string) => this.getStandardName(c, 'latinearlyoutemailtemplate');
  
  // Leave Management
  getDisplayNameLeaveaprv = (c: string) => this.getStandardName(c, 'leaveapproval');
  getDisplayNameLeavetype = (c: string) => this.getStandardName(c, 'leave_type');
  getDisplayNameLeaveEscalation = (c: string) => this.getStandardName(c, 'leave_escalation');
  getDisplayNameLeavepolicy = (c: string) => this.getStandardName(c, 'leave_entitlement');
  getDisplayNameLeavereq = (c: string) => this.getStandardName(c, 'employee_leave_request');
  getDisplayNameLeavecom = (c: string) => this.getStandardName(c, 'compensatoryleaverequest');
  getDisplayNameLeaveaprvlvl = (c: string) => this.getStandardName(c, 'leaveapprovallevels');
  getDisplayNameLeaveBalance = (c: string) => this.getStandardName(c, 'emp_leave_balance');
  getDisplayNameLeaveCancel = (c: string) => this.getStandardName(c, 'lv_cancellation');
  getDisplayNameLeaveAccrual = (c: string) => this.getStandardName(c, 'leave_accrual_transaction');
  getDisplayNameLeaveRejoin = (c: string) => this.getStandardName(c, 'employeerejoining');
  
  // Payroll Management
  getDisplayNamePayrollrun = (c: string) => this.getStandardName(c, 'payrollrun');
  getDisplayNamePayStructure = (c: string) => this.getStandardName(c, 'paystructure');
  getDisplayNameSalarycomponent = (c: string) => this.getStandardName(c, 'salarycomponent');
  getDisplayNameEmployeesalary = (c: string) => this.getStandardName(c, 'employeesalarystructure');
  getDisplayNamePayslipAprv = (c: string) => this.getStandardName(c, 'payslipapproval');
  getDisplayNamePayrollaprlvl = (c: string) => this.getStandardName(c, 'payslipcommonworkflow');
  getDisplayNameAdvanceSalaryAprvlst = (c: string) => this.getStandardName(c, 'advancesalaryapproval');
  getDisplayNameAdvanceSalaryReq = (c: string) => this.getStandardName(c, 'advancesalaryrequest');
  getDisplayNameAdvanceSalaryEscalation = (c: string) => this.getStandardName(c, 'advsalary_escalation');
  getDisplayNameAdvanceSalaryAprlvl = (c: string) => this.getStandardName(c, 'advancecommonworkflow');
  getDisplayNameWps = (c: string) => this.getStandardName(c, 'wps');
  
  // General Management
  getDisplayNameGen = (c: string) => this.getStandardName(c, 'generalrequest');
  getDisplayNameReqtype = (c: string) => this.getStandardName(c, 'requesttype');
  getDisplayNameApr = (c: string) => this.getStandardName(c, 'approval');
  getDisplayNameAprlvl = (c: string) => this.getStandardName(c, 'approvallevel');
  getDisplayNameGenReqEsc = (c: string) => this.getStandardName(c, 'genrl_escalation');
  getDisplayNameDocumentAprlvl = (c: string) => this.getStandardName(c, 'documentapprovallevel');
  getDisplayNameDocumentApr = (c: string) => this.getStandardName(c, 'documentapproval');
  getDisplayNameDocumentReq = (c: string) => this.getStandardName(c, 'documentrequest');
  getDisplayNameDocumentType = (c: string) => this.getStandardName(c, 'docrequesttype');
  getDisplayNameAnnounce = (c: string) => this.getStandardName(c, 'announcement');
  
  // Loan Management
  getDisplayNameLoanApproval = (c: string) => this.getStandardName(c, 'loanapproval');
  getDisplayNameLoanType = (c: string) => this.getStandardName(c, 'loantype');
  getDisplayNameLoanEscalation = (c: string) => this.getStandardName(c, 'loan_escalation');
  getDisplayNameLoanRepay = (c: string) => this.getStandardName(c, 'loanrepayment');
  getDisplayNameLoanAprvlvl = (c: string) => this.getStandardName(c, 'loancommonworkflow');
  getDisplayNameLoanApp = (c: string) => this.getStandardName(c, 'loanapplication');
  
  // Asset Management
  getDisplayNameAssetType = (c: string) => this.getStandardName(c, 'assettype');
  getDisplayNameAssetmaster = (c: string) => this.getStandardName(c, 'asset');
  getDisplayNameAssetEscalation = (c: string) => this.getStandardName(c, 'asset_escalation');
  getDisplayNameAssetApprovals = (c: string) => this.getStandardName(c, 'assetapproval');
  getDisplayNameAssetAlon = (c: string) => this.getStandardName(c, 'assetallocation');
  getDisplayNameAssetApprovalLvl = (c: string) => this.getStandardName(c, 'assetapprovallevel');
  getDisplayNameAssetReq = (c: string) => this.getStandardName(c, 'assetrequest');
  
  // Attendance Management
  getDisplayNameAtd = (c: string) => this.getStandardName(c, 'attendance');
  getDisplayNamePunching = (c: string) => this.getStandardName(c, 'attendance_list');
  getDisplayNameEmpEarlygoing = (c: string) => this.getStandardName(c, 'early_going');
  getDisplayNameEmpRecheck = (c: string) => this.getStandardName(c, 'attendancerecheck');
  getDisplayNamePuncinglist = (c: string) => this.getStandardName(c, 'attendancepolicy');
  getDisplayNameValidationPol = (c: string) => this.getStandardName(c, 'attendancevalidationpolicy');
  getDisplayNameLateComePol = (c: string) => this.getStandardName(c, 'latecomingpolicy');
  getDisplayNameEarlyExitPol = (c: string) => this.getStandardName(c, 'earlyexitpolicy');
  getDisplayNameManualentry = (c: string) => this.getStandardName(c, 'attendance_manual');
  getDisplayNameGeoFence = (c: string) => this.getStandardName(c, 'branchgeofence');
  getDisplayNameLateinEarlyout = (c: string) => this.getStandardName(c, 'lateinearlyoutrequest');
  getDisplayNameLinEoutAprlvl = (c: string) => this.getStandardName(c, 'lateinearlyoutapprovallevel');
  getDisplayNameLinEoutApr = (c: string) => this.getStandardName(c, 'lateinearlyoutapproval');
  
  // Document Management
  getDisplayNameDocumentAddFol = (c: string) => this.getStandardName(c, 'folder');
  
  // Project Management
  getDisplayNameProjects = (c: string) => this.getStandardName(c, 'project');
  getDisplayNameProjectStages = (c: string) => this.getStandardName(c, 'projectstage');
  getDisplayNameProjectTask = (c: string) => this.getStandardName(c, 'task');
  getDisplayNameProjectTime = (c: string) => this.getStandardName(c, 'timesheet');
  
  // Airticket Management
  getDisplayNameAirTicketPol = (c: string) => this.getStandardName(c, 'airticketpolicy');
  getDisplayNameAirTicketApr = (c: string) => this.getStandardName(c, 'airticketapproval');
  getDisplayNameAirTicketAlon = (c: string) => this.getStandardName(c, 'airticketallocation');
  getDisplayNameAirTicketEsc = (c: string) => this.getStandardName(c, 'airticket_escalation');
  getDisplayNameAirTicketReq = (c: string) => this.getStandardName(c, 'airticketrequest');
  getDisplayNameAirTicketAprlvl = (c: string) => this.getStandardName(c, 'airticketworkflow');
  getDisplayNameAirTicketRule = (c: string) => this.getStandardName(c, 'airticketrule');
  
  // Shift Management
  getDisplayNameShifts = (c: string) => this.getStandardName(c, 'shift');
  getDisplayNameShiftPattern = (c: string) => this.getStandardName(c, 'shiftpattern');
  getDisplayNameShiftEmployee = (c: string) => this.getStandardName(c, 'employeeshiftschedule');
  getDisplayNameShiftOverRide = (c: string) => this.getStandardName(c, 'shiftoverride');
  getDisplayNameEmpOver = (c: string) => this.getStandardName(c, 'employeeovertime');
  getDisplayNameOverTimepolicy = (c: string) => this.getStandardName(c, 'overtimepolicy');
  getDisplayNameOverTimeRule = (c: string) => this.getStandardName(c, 'overtimerule');
  
  // User & Permissions
  getDisplayNameUserGroup = (c: string) => this.getStandardName(c, 'group');
  getDisplayNameUserPermission = (c: string) => this.getStandardName(c, 'permission');
  getDisplayNameBranchUserPermission = (c: string) => this.getStandardName(c, 'userbranchaccess');
  
    getDisplayNameEmpregAprList(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'view_approved_resignations') return 'View';
      if (code === 'add_create_eos_for_resignation') return 'Add';
      return codename;
    }
  
    getDisplayNameEmpReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'emp_export_report') return 'Export';
      return this.getStandardName(codename, 'report');
    }
  
    getDisplayNameDocReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'export_document_report') return 'Export';
      return this.getStandardName(codename, 'doc_report');
    }
  
     getDisplayNameGenReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'export_general_request_report') return 'Export';
      return this.getStandardName(codename, 'generalrequestreport');
    }
  
     getDisplayNameDeptReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'export_dept_report') return 'Export';
      return this.getStandardName(codename, 'deptreport');
    }
  
      getDisplayNameDesReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'export_designtn_report') return 'Export';
      return this.getStandardName(codename, 'designationreport');
    }
  
    getDisplayNameLeaveReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'lv_export_report') return 'Export';
      return this.getStandardName(codename, 'leavereport');
    }
  
    getDisplayNameLeaveAprRep(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'lv_approval_export_report') return 'Export';
      return this.getStandardName(codename, 'leaveapprovalreport');
    }
  
    getDisplayNameLeaveBalReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'lv_balance_export_report') return 'Export';
      return this.getStandardName(codename, 'lvbalancereport');
    }
  
    getDisplayNameAttendReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'attendance_export_report') return 'Export';
      return this.getStandardName(codename, 'attendancereport');
    }
  
    getDisplayNameAssetReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'asset_export_report') return 'Export';
      return this.getStandardName(codename, 'assetreport');
    }
  
    getDisplayNameAssetTransReport(codename: string): string {
      const code = codename.trim().toLowerCase();
      if (code === 'asset_transaction_export_report') return 'Export';
      return this.getStandardName(codename, 'assettransactionreport');
    }
  
  
    selectUserandper(): void {
    this.toggleSectionGroups('userandperchecked', [
      this.GrouppermissionsUser, this.GrouppermissionsUsergroup,
      this.GrouppermissionsassigneddUser, this.GrouppermissionsBranchUser
    ]);
  }
  updateuserandperCheckbox(): void {
    this.updateSectionMasterCheckbox('userandperchecked', [
      this.GrouppermissionsUser, this.GrouppermissionsUsergroup,
      this.GrouppermissionsassigneddUser, this.GrouppermissionsBranchUser
    ]);
  }
  isUserandperInderminate(): boolean {
    return this.isSectionIndeterminateGeneric([
      this.GrouppermissionsUser, this.GrouppermissionsUsergroup,
      this.GrouppermissionsassigneddUser, this.GrouppermissionsBranchUser
    ], 'userandperchecked');
  }
  
  onUserMasterChange(): void { this.toggleMasterRowGroup('userMasterChecked', this.GrouppermissionsUser, () => this.updateuserandperCheckbox()); }
  onCheckboxChangesuser(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsUser, 'userMasterChecked', () => this.updateuserandperCheckbox()); }
  isUserMasterIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsUser); }
  
  onUsergroupingMasterChange(): void { this.toggleMasterRowGroup('usergroupingMasterChecked', this.GrouppermissionsUsergroup, () => this.updateuserandperCheckbox()); }
  onCheckboxChangesUsergroup(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsUsergroup, 'usergroupingMasterChecked', () => this.updateuserandperCheckbox()); }
  isUserGroupingIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsUsergroup); }
  
  onUserAssignChange(): void { this.toggleMasterRowGroup('assignpermissionMasterChecked', this.GrouppermissionsassigneddUser, () => this.updateuserandperCheckbox()); }
  onCheckboxChangesassign(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsassigneddUser, 'assignpermissionMasterChecked', () => this.updateuserandperCheckbox()); }
  isAssignPermissionsIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsassigneddUser); }
  
  onUserBranchChange(): void { this.toggleMasterRowGroup('BranchpermissionMasterChecked', this.GrouppermissionsBranchUser, () => this.updateuserandperCheckbox()); }
  onCheckboxChangesBranch(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsBranchUser, 'BranchpermissionMasterChecked', () => this.updateuserandperCheckbox()); }
  isBranchPermissionsIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsBranchUser); }
  
  private emailTemplateGroups(): any[][] {
    return [
      this.GrouppermissionsGeneralReqTemp, this.GrouppermissionsLeaveEmTemp, this.GrouppermissionsDocExpTemp,
      this.GrouppermissionsDocReqTemp, this.GrouppermissionsAdvSalReqTemp, this.GrouppermissionsLoanReqTemp,
      this.GrouppermissionsAssetReqTemp, this.GrouppermissionsAirticketReqTemp, this.GrouppermissionsResignationReqTemp,
      this.GrouppermissionsLinEoutReqTemp
    ];
  }
  selectEmailTemplate(): void { this.toggleSectionGroups('EmailTemplatechecked', this.emailTemplateGroups()); }
  updateEmailTemplateCheckbox(): void { this.updateSectionMasterCheckbox('EmailTemplatechecked', this.emailTemplateGroups()); }
  isEmailTemplateInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.emailTemplateGroups(), 'EmailTemplatechecked'); }
  
  onGeneralReqTempChange(): void { this.toggleMasterRowGroup('GeneralReqTempChecked', this.GrouppermissionsGeneralReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesGeneralReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsGeneralReqTemp, 'GeneralReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isGeneralReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsGeneralReqTemp); }
  
  onLeaveEmTempChange(): void { this.toggleMasterRowGroup('LeaveEmTempChecked', this.GrouppermissionsLeaveEmTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesLeaveEmTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveEmTemp, 'LeaveEmTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isLeaveEmTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsLeaveEmTemp); }
  
  onDocExpTempChange(): void { this.toggleMasterRowGroup('DocExpTempChecked', this.GrouppermissionsDocExpTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesDocExpTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocExpTemp, 'DocExpTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isDocExpTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsDocExpTemp); }
  
  onDocReqTempChange(): void { this.toggleMasterRowGroup('DocReqTempChecked', this.GrouppermissionsDocReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesDocReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocReqTemp, 'DocReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isDocReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsDocReqTemp); }
  
  onAdvSalReqTempChange(): void { this.toggleMasterRowGroup('AdvSalReqTempChecked', this.GrouppermissionsAdvSalReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesAdvSalReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAdvSalReqTemp, 'AdvSalReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isAdvSalReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsAdvSalReqTemp); }
  
  onLoanReqTempChange(): void { this.toggleMasterRowGroup('LoanReqTempChecked', this.GrouppermissionsLoanReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesLoanReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanReqTemp, 'LoanReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isLoanReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsLoanReqTemp); }
  
  onAssetReqTempChange(): void { this.toggleMasterRowGroup('AssetReqTempChecked', this.GrouppermissionsAssetReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesAssetReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetReqTemp, 'AssetReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isAssetReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsAssetReqTemp); }
  
  onAirticketReqTempChange(): void { this.toggleMasterRowGroup('AirticketReqTempChecked', this.GrouppermissionsAirticketReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesAirticketReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirticketReqTemp, 'AirticketReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isAirticketReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsAirticketReqTemp); }
  
  onResignationReqTempChange(): void { this.toggleMasterRowGroup('ResignationReqTempChecked', this.GrouppermissionsResignationReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesResignationReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsResignationReqTemp, 'ResignationReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isResignationReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsResignationReqTemp); }
  
  onLinEoutReqTempChange(): void { this.toggleMasterRowGroup('LinEoutReqTempChecked', this.GrouppermissionsLinEoutReqTemp, () => this.updateEmailTemplateCheckbox()); }
  onCheckboxChangesLinEoutReqTemp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLinEoutReqTemp, 'LinEoutReqTempChecked', () => this.updateEmailTemplateCheckbox()); }
  isLinEoutReqTempIndeterminate(): boolean { return this.isGroupIndeterminate(this.GrouppermissionsLinEoutReqTemp); }
  
  // REPLACE existing updateReportCheckbox() body:
  updateReportCheckbox(): void {
    const groups = [
      this.GrouppermissionsemployeeReport, this.GrouppermissionsdocumnetReport, this.GrouppermissiionsgeneralReport,
      this.GrouppermissiionsDeptReport, this.GrouppermissiionsDesReport, this.GrouppermissiionsLeaveReport,
      this.GrouppermissiionsLeaveAprRep, this.GrouppermissionsLeaveBalReport, this.GrouppermissionsAttendReport,
      this.GrouppermissionsAssetReport, this.GrouppermissionsAssetTransReport
    ];
    this.reportchecked = groups.every(g => g.every(p => this.selectedPermissions.includes(p.id)));
  }
  
  // REPLACE existing isReportInderminate() body:
  isReportInderminate(): boolean {
    return this.isSectionIndeterminateGeneric([
      this.GrouppermissionsemployeeReport, this.GrouppermissionsdocumnetReport, this.GrouppermissiionsgeneralReport,
      this.GrouppermissiionsDeptReport, this.GrouppermissiionsDesReport, this.GrouppermissiionsLeaveReport,
      this.GrouppermissiionsLeaveAprRep, this.GrouppermissionsLeaveBalReport, this.GrouppermissionsAttendReport,
      this.GrouppermissionsAssetReport, this.GrouppermissionsAssetTransReport
    ], 'reportchecked');
  }
  
  // ADD: fixes casing mismatch (HTML calls "onCheckboxChangesGenReport" with capital G)
  onCheckboxChangesGenReport(id: number): void {
    this.toggleRowPermission(id, this.GrouppermissiionsgeneralReport, 'generelReportChecked', () => this.updateReport());
  }
  
  onDesReportChange(): void { this.toggleMasterRowGroup('DesReportChecked', this.GrouppermissiionsDesReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesDesReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissiionsDesReport, 'DesReportChecked', () => this.updateReport()); }
  
  onLeaveReportChange(): void { this.toggleMasterRowGroup('LeaveReportChecked', this.GrouppermissiionsLeaveReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesLeaveReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissiionsLeaveReport, 'LeaveReportChecked', () => this.updateReport()); }
  
  onLeaveAprRepChange(): void { this.toggleMasterRowGroup('LeaveAprRepChecked', this.GrouppermissiionsLeaveAprRep, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesLeaveAprRep(id: number): void { this.toggleRowPermission(id, this.GrouppermissiionsLeaveAprRep, 'LeaveAprRepChecked', () => this.updateReport()); }
  
  onLeaveBalReportChange(): void { this.toggleMasterRowGroup('LeaveBalReportChecked', this.GrouppermissionsLeaveBalReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesLeaveBalReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveBalReport, 'LeaveBalReportChecked', () => this.updateReport()); }
  
  onAttendReportChange(): void { this.toggleMasterRowGroup('AttendReportChecked', this.GrouppermissionsAttendReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesAttendReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAttendReport, 'AttendReportChecked', () => this.updateReport()); }
  
  onAssetReportChange(): void { this.toggleMasterRowGroup('AssetReportChecked', this.GrouppermissionsAssetReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesAssetReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetReport, 'AssetReportChecked', () => this.updateReport()); }
  
  onAssetTransReportChange(): void { this.toggleMasterRowGroup('AssetTransReportChecked', this.GrouppermissionsAssetTransReport, () => this.updateReportCheckbox()); this.updateReport(); }
  onCheckboxChangesAssetTransReport(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetTransReport, 'AssetTransReportChecked', () => this.updateReport()); }
  
  onAddweekChange(): void { this.toggleMasterRowGroup('addweekChecked', this.Grouppermissionsaddweek, () => this.updateCalenderCheckbox()); }
  onCheckboxChangesAddweek(id: number): void { this.toggleRowPermission(id, this.Grouppermissionsaddweek, 'addweekChecked', () => this.updateCalenderCheckbox()); }
  
  onAssignweekChange(): void { this.toggleMasterRowGroup('assignweekChecked', this.Grouppermisionsassignweek, () => this.updateCalenderCheckbox()); }
  onCheckboxChangesAssignweek(id: number): void { this.toggleRowPermission(id, this.Grouppermisionsassignweek, 'assignweekChecked', () => this.updateCalenderCheckbox()); }
  
  onAddholidayChange(): void { this.toggleMasterRowGroup('addholidayChecked', this.Grouppermissionsaddholiday, () => this.updateCalenderCheckbox()); }
  onCheckboxChangesAddHoliday(id: number): void { this.toggleRowPermission(id, this.Grouppermissionsaddholiday, 'addholidayChecked', () => this.updateCalenderCheckbox()); }
  
  onAssignholidayChange(): void { this.toggleMasterRowGroup('assignholidayChecked', this.Grouppermissionsassisgnholiday, () => this.updateCalenderCheckbox()); }
  onCheckboxChangesAssignHoliday(id: number): void { this.toggleRowPermission(id, this.Grouppermissionsassisgnholiday, 'assignholidayChecked', () => this.updateCalenderCheckbox()); }
  
  private leaveGroups(): any[][] {
    return [
      this.GrouppermissionsLeaveaprv, this.GrouppermissionsLeavetype, this.GrouppermissionsLeaveEscalation,
      this.GrouppermissionsLeavemaster, this.GrouppermissionsLeavereq, this.GrouppermissionsLeavecom,
      this.GrouppermissionsLeaveaprvlvl, this.GrouppermissionsLeaveBalance, this.GrouppermissionsLeaveCancel,
      this.GrouppermissionsLeaveAccrual, this.GrouppermissionsLeaveRejoin
    ];
  }
  
  
  updateLeaveCheckbox(): void {
    const groups = this.leaveGroups();
    this.Leavechecked = groups.every(g => g.every(p => this.selectedPermissions.includes(p.id)));
  }
  
  selectLeave(): void { this.toggleSectionGroups('Leavechecked', this.leaveGroups()); }
  isLeaveInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.leaveGroups(), 'Leavechecked'); }
  
  onLeaveaprvChange(): void { this.toggleMasterRowGroup('LeaveaprvChecked', this.GrouppermissionsLeaveaprv, () => this.updateLeaveCheckbox()); }
  // REPLACE existing onCheckboxChangesLeaveaprv — it called the buggy updateLeave()
  onCheckboxChangesLeaveaprv(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveaprv, 'LeaveaprvChecked', () => this.updateLeaveCheckbox()); }
  
  onLeavetypeChange(): void { this.toggleMasterRowGroup('LeavetypeChecked', this.GrouppermissionsLeavetype, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeavetype(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeavetype, 'LeavetypeChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveEscalationChange(): void { this.toggleMasterRowGroup('LeaveEscalationChecked', this.GrouppermissionsLeaveEscalation, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveEscalation(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveEscalation, 'LeaveEscalationChecked', () => this.updateLeaveCheckbox()); }
  
  onLeavepolicyChange(): void { this.toggleMasterRowGroup('LeavepolicyChecked', this.GrouppermissionsLeavemaster, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeavepolicy(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeavemaster, 'LeavepolicyChecked', () => this.updateLeaveCheckbox()); }
  
  onLeavereqChange(): void { this.toggleMasterRowGroup('LeavereqChecked', this.GrouppermissionsLeavereq, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeavereq(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeavereq, 'LeavereqChecked', () => this.updateLeaveCheckbox()); }
  
  onLeavecomChange(): void { this.toggleMasterRowGroup('LeavecomChecked', this.GrouppermissionsLeavecom, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeavecom(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeavecom, 'LeavecomChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveaprvlvlChange(): void { this.toggleMasterRowGroup('LeaveaprvlvlChecked', this.GrouppermissionsLeaveaprvlvl, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveaprvlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveaprvlvl, 'LeaveaprvlvlChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveBalanceChange(): void { this.toggleMasterRowGroup('LeaveBalanceChecked', this.GrouppermissionsLeaveBalance, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveBalance(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveBalance, 'LeaveBalanceChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveCancelChange(): void { this.toggleMasterRowGroup('LeaveCancelChecked', this.GrouppermissionsLeaveCancel, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveCancel(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveCancel, 'LeaveCancelChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveAccrualChange(): void { this.toggleMasterRowGroup('LeaveAccrualChecked', this.GrouppermissionsLeaveAccrual, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveAccrual(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveAccrual, 'LeaveAccrualChecked', () => this.updateLeaveCheckbox()); }
  
  onLeaveRejoinChange(): void { this.toggleMasterRowGroup('LeaveRejoinChecked', this.GrouppermissionsLeaveRejoin, () => this.updateLeaveCheckbox()); }
  onCheckboxChangesLeaveRejoin(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLeaveRejoin, 'LeaveRejoinChecked', () => this.updateLeaveCheckbox()); }
  
  private payrollGroups(): any[][] {
    return [
      this.GrouppermissionsPayrollrun, this.GrouppermissionsPayStructure, this.GrouppermissionsSalarycomponent,
      this.GrouppermissionsEmployeesalary, this.GrouppermissionsPayslipAprv, this.GrouppermissionsPayrollaprlvl,
      this.GrouppermissionsAdvanceSalaryAprvlst, this.GrouppermissionsAdvanceSalaryReq, this.GrouppermissionsAdvanceSalaryEscalation,
      this.GrouppermissionsAdvanceSalaryAprlvl, this.GrouppermissionsWps
    ];
  }
  selectPayroll(): void { this.toggleSectionGroups('Payrollchecked', this.payrollGroups()); }
  updatePayrollCheckbox(): void { this.updateSectionMasterCheckbox('Payrollchecked', this.payrollGroups()); }
  isPayrollInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.payrollGroups(), 'Payrollchecked'); }
  
  onPayrollrunChange(): void { this.toggleMasterRowGroup('PayrollrunChecked', this.GrouppermissionsPayrollrun, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesPayrollrun(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPayrollrun, 'PayrollrunChecked', () => this.updatePayrollCheckbox()); }
  
  onPayStructureChange(): void { this.toggleMasterRowGroup('PayStructureChecked', this.GrouppermissionsPayStructure, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesPayStructure(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPayStructure, 'PayStructureChecked', () => this.updatePayrollCheckbox()); }
  
  onSalarycomponentChange(): void { this.toggleMasterRowGroup('SalarycomponentChecked', this.GrouppermissionsSalarycomponent, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesSalarycomponent(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsSalarycomponent, 'SalarycomponentChecked', () => this.updatePayrollCheckbox()); }
  
  onEmployeesalaryChange(): void { this.toggleMasterRowGroup('EmployeeSalaryChecked', this.GrouppermissionsEmployeesalary, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesEmployeesalary(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsEmployeesalary, 'EmployeeSalaryChecked', () => this.updatePayrollCheckbox()); }
  
  onPayslipAprvChange(): void { this.toggleMasterRowGroup('PayslipAprvChecked', this.GrouppermissionsPayslipAprv, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesPayslipAprv(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPayslipAprv, 'PayslipAprvChecked', () => this.updatePayrollCheckbox()); }
  
  onPayrollaprlvlChange(): void { this.toggleMasterRowGroup('PayrollaprlvlChecked', this.GrouppermissionsPayrollaprlvl, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesPayrollaprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPayrollaprlvl, 'PayrollaprlvlChecked', () => this.updatePayrollCheckbox()); }
  
  onAdvanceSalaryAprvlstChange(): void { this.toggleMasterRowGroup('AdvanceSalaryAprvlstChecked', this.GrouppermissionsAdvanceSalaryAprvlst, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesAdvanceSalaryAprvlst(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAdvanceSalaryAprvlst, 'AdvanceSalaryAprvlstChecked', () => this.updatePayrollCheckbox()); }
  
  onAdvanceSalaryReqChange(): void { this.toggleMasterRowGroup('AdvanceSalaryReqChecked', this.GrouppermissionsAdvanceSalaryReq, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesAdvanceSalaryReq(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAdvanceSalaryReq, 'AdvanceSalaryReqChecked', () => this.updatePayrollCheckbox()); }
  
  onAdvanceSalaryEscalationChange(): void { this.toggleMasterRowGroup('AdvanceSalaryEscalationChecked', this.GrouppermissionsAdvanceSalaryEscalation, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesAdvanceSalaryEscalation(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAdvanceSalaryEscalation, 'AdvanceSalaryEscalationChecked', () => this.updatePayrollCheckbox()); }
  
  onAdvanceSalaryAprlvlChange(): void { this.toggleMasterRowGroup('AdvanceSalaryAprlvlChecked', this.GrouppermissionsAdvanceSalaryAprlvl, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesAdvanceSalaryAprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAdvanceSalaryAprlvl, 'AdvanceSalaryAprlvlChecked', () => this.updatePayrollCheckbox()); }
  
  onWpsChange(): void { this.toggleMasterRowGroup('WpsChecked', this.GrouppermissionsWps, () => this.updatePayrollCheckbox()); }
  onCheckboxChangesWps(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsWps, 'WpsChecked', () => this.updatePayrollCheckbox()); }
  
  private generalGroups(): any[][] {
    return [
      this.GrouppermissionsGen, this.GrouppermissionsReqtype, this.GrouppermissionsApr, this.GrouppermissionsAprlvl,
      this.GrouppermissionsGenReqEsc, this.GrouppermissionsDocumentAprlvl, this.GrouppermissionsDocumentApr,
      this.GrouppermissionsDocumentReq, this.GrouppermissionsDocumentType, this.GrouppermissionsAnnounceMaster
    ];
  }
  selectGeneralManage(): void { this.toggleSectionGroups('Generalmanagechecked', this.generalGroups()); }
  updateGeneralManageCheckbox(): void { this.updateSectionMasterCheckbox('Generalmanagechecked', this.generalGroups()); }
  isGeneralManageInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.generalGroups(), 'Generalmanagechecked'); }
  
  onGenMasterChange(): void { this.toggleMasterRowGroup('GenMasterChecked', this.GrouppermissionsGen, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangeGen(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsGen, 'GenMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  onReqtypeMasterChange(): void { this.toggleMasterRowGroup('ReqtypeMasterChecked', this.GrouppermissionsReqtype, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangeReqtype(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsReqtype, 'ReqtypeMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  onAprMasterChange(): void { this.toggleMasterRowGroup('AprMasterChecked', this.GrouppermissionsApr, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangeApr(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsApr, 'AprMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  onAprlvlMasterChange(): void { this.toggleMasterRowGroup('AprlvlMasterChecked', this.GrouppermissionsAprlvl, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangeAprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAprlvl, 'AprlvlMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  onGenReqEscMasterChange(): void { this.toggleMasterRowGroup('GenReqEscMasterChecked', this.GrouppermissionsGenReqEsc, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangeGenReqEsc(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsGenReqEsc, 'GenReqEscMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  onDocumentAprlvlChange(): void { this.toggleMasterRowGroup('DocumentAprlvlChecked', this.GrouppermissionsDocumentAprlvl, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangesDocumentAprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocumentAprlvl, 'DocumentAprlvlChecked', () => this.updateGeneralManageCheckbox()); }
  
  onDocumentAprChange(): void { this.toggleMasterRowGroup('DocumentAprChecked', this.GrouppermissionsDocumentApr, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangesDocumentApr(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocumentApr, 'DocumentAprChecked', () => this.updateGeneralManageCheckbox()); }
  
  onDocumentReqChange(): void { this.toggleMasterRowGroup('DocumentReqChecked', this.GrouppermissionsDocumentReq, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangesDocumentReq(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocumentReq, 'DocumentReqChecked', () => this.updateGeneralManageCheckbox()); }
  
  onDocumentTypeChange(): void { this.toggleMasterRowGroup('DocumentTypeChecked', this.GrouppermissionsDocumentType, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangesDocumentType(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocumentType, 'DocumentTypeChecked', () => this.updateGeneralManageCheckbox()); }
  
  onAnnounceChange(): void { this.toggleMasterRowGroup('AnnounceMasterChecked', this.GrouppermissionsAnnounceMaster, () => this.updateGeneralManageCheckbox()); }
  onCheckboxChangesAnnounce(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAnnounceMaster, 'AnnounceMasterChecked', () => this.updateGeneralManageCheckbox()); }
  
  private loanGroups(): any[][] {
    return [
      this.GrouppermissionsLoanApproval, this.GrouppermissionsLoanType, this.GrouppermissionsLoanEscalation,
      this.GrouppermissionsLoanRepay, this.GrouppermissionsLoanAprvlvl, this.GrouppermissionsLoanApp
    ];
  }
  selectLoan(): void { this.toggleSectionGroups('Loanchecked', this.loanGroups()); }
  updateLoanCheckbox(): void { this.updateSectionMasterCheckbox('Loanchecked', this.loanGroups()); }
  isLoanInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.loanGroups(), 'Loanchecked'); }
  
  onLoanApprovalChange(): void { this.toggleMasterRowGroup('LoanApprovalChecked', this.GrouppermissionsLoanApproval, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanApproval(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanApproval, 'LoanApprovalChecked', () => this.updateLoanCheckbox()); }
  
  onLoanTypeChange(): void { this.toggleMasterRowGroup('LoanTypeChecked', this.GrouppermissionsLoanType, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanType(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanType, 'LoanTypeChecked', () => this.updateLoanCheckbox()); }
  
  onLoanEscalationChange(): void { this.toggleMasterRowGroup('LoanEscalationChecked', this.GrouppermissionsLoanEscalation, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanEscalation(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanEscalation, 'LoanEscalationChecked', () => this.updateLoanCheckbox()); }
  
  onLoanRepayChange(): void { this.toggleMasterRowGroup('LoanRepayChecked', this.GrouppermissionsLoanRepay, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanRepay(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanRepay, 'LoanRepayChecked', () => this.updateLoanCheckbox()); }
  
  onLoanAprvlvlChange(): void { this.toggleMasterRowGroup('LoanAprvlvlChecked', this.GrouppermissionsLoanAprvlvl, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanAprvlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanAprvlvl, 'LoanAprvlvlChecked', () => this.updateLoanCheckbox()); }
  
  onLoanAppChange(): void { this.toggleMasterRowGroup('LoanAppChecked', this.GrouppermissionsLoanApp, () => this.updateLoanCheckbox()); }
  onCheckboxChangesLoanApp(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLoanApp, 'LoanAppChecked', () => this.updateLoanCheckbox()); }
  
  private assetGroups(): any[][] {
    return [
      this.GrouppermissionsAssetType, this.GrouppermissionsAssetmaster, this.GrouppermissionsAssetEscalation,
      this.GrouppermissionsAssetApprovals, this.GrouppermissionsAssetAlon, this.GrouppermissionsAssetApprovallvl,
      this.GrouppermissionsAssetReq
    ];
  }
  selectAsset(): void { this.toggleSectionGroups('Assetchecked', this.assetGroups()); }
  updateAssetCheckbox(): void { this.updateSectionMasterCheckbox('Assetchecked', this.assetGroups()); }
  isAssetInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.assetGroups(), 'Assetchecked'); }
  
  onAssetTypeChange(): void { this.toggleMasterRowGroup('AssetTypeChecked', this.GrouppermissionsAssetType, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetType(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetType, 'AssetTypeChecked', () => this.updateAssetCheckbox()); }
  
  onAssetmasterChange(): void { this.toggleMasterRowGroup('AssetmasterChecked', this.GrouppermissionsAssetmaster, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetmaster(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetmaster, 'AssetmasterChecked', () => this.updateAssetCheckbox()); }
  
  onAssetEscalationChange(): void { this.toggleMasterRowGroup('AssetEscalationChecked', this.GrouppermissionsAssetEscalation, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetEscalation(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetEscalation, 'AssetEscalationChecked', () => this.updateAssetCheckbox()); }
  
  onAssetApprovalsChange(): void { this.toggleMasterRowGroup('AssetApprovalsChecked', this.GrouppermissionsAssetApprovals, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetApprovals(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetApprovals, 'AssetApprovalsChecked', () => this.updateAssetCheckbox()); }
  
  onAssetAlonChange(): void { this.toggleMasterRowGroup('AssetAlonChecked', this.GrouppermissionsAssetAlon, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetAlon(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetAlon, 'AssetAlonChecked', () => this.updateAssetCheckbox()); }
  
  onAssetApprovalLvlChange(): void { this.toggleMasterRowGroup('AssetApprovallvlChecked', this.GrouppermissionsAssetApprovallvl, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetApprovalLvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetApprovallvl, 'AssetApprovallvlChecked', () => this.updateAssetCheckbox()); }
  
  onAssetReqChange(): void { this.toggleMasterRowGroup('AssetReqChecked', this.GrouppermissionsAssetReq, () => this.updateAssetCheckbox()); }
  onCheckboxChangesAssetReq(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAssetReq, 'AssetReqChecked', () => this.updateAssetCheckbox()); }
  
  private attendanceGroups(): any[][] {
    return [
      this.GrouppermissionsAtd, this.GrouppermissionsPunching, this.GrouppermissionsFaceRegister,
      this.GrouppermissionsEmpEarlygoing, this.GrouppermissionsEmpRecheck, this.GrouppermissionsPuncinglist,
      this.GrouppermissionsValidationPol, this.GrouppermissionsLateComePol, this.GrouppermissionsEarlyExitPol,
      this.GrouppermissionsManualentry, this.GrouppermissionsGeoFence, this.GrouppermissionsLateinEarlyout,
      this.GrouppermissionsLinEoutAprlvl, this.GrouppermissionsLinEoutApr
    ];
  }
  selectAttendance(): void { this.toggleSectionGroups('Attendancechecked', this.attendanceGroups()); }
  updateAttendanceCheckbox(): void { this.updateSectionMasterCheckbox('Attendancechecked', this.attendanceGroups()); }
  isAttendanceInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.attendanceGroups(), 'Attendancechecked'); }
  
  onAtdMasterChange(): void { this.toggleMasterRowGroup('AtdMasterChecked', this.GrouppermissionsAtd, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangeAtd(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAtd, 'AtdMasterChecked', () => this.updateAttendanceCheckbox()); }
  
  onPunchingChange(): void { this.toggleMasterRowGroup('PunchingChecked', this.GrouppermissionsPunching, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangePunching(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPunching, 'PunchingChecked', () => this.updateAttendanceCheckbox()); }
  
  onFaceRegisterChange(): void { this.toggleMasterRowGroup('FaceRegisterChecked', this.GrouppermissionsFaceRegister, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangeFaceRegister(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsFaceRegister, 'FaceRegisterChecked', () => this.updateAttendanceCheckbox()); }
  
  onEmpEarlygoingChange(): void { this.toggleMasterRowGroup('EmpEarlygoingChecked', this.GrouppermissionsEmpEarlygoing, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesEmpEarlygoing(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsEmpEarlygoing, 'EmpEarlygoingChecked', () => this.updateAttendanceCheckbox()); }
  
  onEmpRecheckChange(): void { this.toggleMasterRowGroup('EmpRecheckChecked', this.GrouppermissionsEmpRecheck, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesEmpRecheck(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsEmpRecheck, 'EmpRecheckChecked', () => this.updateAttendanceCheckbox()); }
  
  onPuncinglistChange(): void { this.toggleMasterRowGroup('PuncinglistChecked', this.GrouppermissionsPuncinglist, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesPuncinglist(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsPuncinglist, 'PuncinglistChecked', () => this.updateAttendanceCheckbox()); }
  
  onValidationPolChange(): void { this.toggleMasterRowGroup('validationPolChecked', this.GrouppermissionsValidationPol, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesValidationPol(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsValidationPol, 'validationPolChecked', () => this.updateAttendanceCheckbox()); }
  
  onLateComePolChange(): void { this.toggleMasterRowGroup('LateComePolChecked', this.GrouppermissionsLateComePol, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesLateComePol(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLateComePol, 'LateComePolChecked', () => this.updateAttendanceCheckbox()); }
  
  onEarlyExitPolChange(): void { this.toggleMasterRowGroup('EarlyExitPolChecked', this.GrouppermissionsEarlyExitPol, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesEarlyExitPol(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsEarlyExitPol, 'EarlyExitPolChecked', () => this.updateAttendanceCheckbox()); }
  
  onManualentryChange(): void { this.toggleMasterRowGroup('ManualentryChecked', this.GrouppermissionsManualentry, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesManualentry(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsManualentry, 'ManualentryChecked', () => this.updateAttendanceCheckbox()); }
  
  onGeoFenceChange(): void { this.toggleMasterRowGroup('GeoFenceChecked', this.GrouppermissionsGeoFence, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesGeoFence(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsGeoFence, 'GeoFenceChecked', () => this.updateAttendanceCheckbox()); }
  
  onLateinEarlyoutChange(): void { this.toggleMasterRowGroup('LateinEarlyoutChecked', this.GrouppermissionsLateinEarlyout, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesLateinEarlyout(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLateinEarlyout, 'LateinEarlyoutChecked', () => this.updateAttendanceCheckbox()); }
  
  onLinEoutAprlvlChange(): void { this.toggleMasterRowGroup('LinEoutAprlvlChecked', this.GrouppermissionsLinEoutAprlvl, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesLinEoutAprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLinEoutAprlvl, 'LinEoutAprlvlChecked', () => this.updateAttendanceCheckbox()); }
  
  onLinEoutAprChange(): void { this.toggleMasterRowGroup('LinEoutAprChecked', this.GrouppermissionsLinEoutApr, () => this.updateAttendanceCheckbox()); }
  onCheckboxChangesLinEoutApr(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsLinEoutApr, 'LinEoutAprChecked', () => this.updateAttendanceCheckbox()); }
  
  selectDocumentAdd(): void { this.toggleSectionGroups('DocumentAddchecked', [this.GrouppermissionsDocumentAddFol]); }
  updateDocumentAddCheckbox(): void { this.updateSectionMasterCheckbox('DocumentAddchecked', [this.GrouppermissionsDocumentAddFol]); }
  isDocumentAddInderminate(): boolean { return this.isSectionIndeterminateGeneric([this.GrouppermissionsDocumentAddFol], 'DocumentAddchecked'); }
  
  onDocumentAddFolChange(): void { this.toggleMasterRowGroup('DocumentAddFolChecked', this.GrouppermissionsDocumentAddFol, () => this.updateDocumentAddCheckbox()); }
  onCheckboxChangesDocumentAddFol(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsDocumentAddFol, 'DocumentAddFolChecked', () => this.updateDocumentAddCheckbox()); }
  
  private projectGroups(): any[][] {
    return [this.GrouppermissionsProjects, this.GrouppermissionsProjectStages, this.GrouppermissionsProjectTask, this.GrouppermissionsProjectTime];
  }
  selectProject(): void { this.toggleSectionGroups('Projectchecked', this.projectGroups()); }
  updateProjectCheckbox(): void { this.updateSectionMasterCheckbox('Projectchecked', this.projectGroups()); }
  isProjectInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.projectGroups(), 'Projectchecked'); }
  
  onProjectsChange(): void { this.toggleMasterRowGroup('ProjectsChecked', this.GrouppermissionsProjects, () => this.updateProjectCheckbox()); }
  onCheckboxChangesProjects(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsProjects, 'ProjectsChecked', () => this.updateProjectCheckbox()); }
  
  onProjectStagesChange(): void { this.toggleMasterRowGroup('ProjectStagesChecked', this.GrouppermissionsProjectStages, () => this.updateProjectCheckbox()); }
  onCheckboxChangesProjectStages(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsProjectStages, 'ProjectStagesChecked', () => this.updateProjectCheckbox()); }
  
  onProjectTaskChange(): void { this.toggleMasterRowGroup('ProjectTaskChecked', this.GrouppermissionsProjectTask, () => this.updateProjectCheckbox()); }
  onCheckboxChangesProjectTask(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsProjectTask, 'ProjectTaskChecked', () => this.updateProjectCheckbox()); }
  
  onProjectTimeChange(): void { this.toggleMasterRowGroup('ProjectTimeChecked', this.GrouppermissionsProjectTime, () => this.updateProjectCheckbox()); }
  onCheckboxChangesProjectTime(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsProjectTime, 'ProjectTimeChecked', () => this.updateProjectCheckbox()); }
  
  private airTicketGroups(): any[][] {
    return [
      this.GrouppermissionsAirTicketPol, this.GrouppermissionsAirTicketApr, this.GrouppermissionsAirTicketAlon,
      this.GrouppermissionsAirTicketEsc, this.GrouppermissionsAirTicketReq, this.GrouppermissionsAirTicketAprlvl,
      this.GrouppermissionsAirTicketRule
    ];
  }
  selectAirTicket(): void { this.toggleSectionGroups('AirTicketchecked', this.airTicketGroups()); }
  updateAirTicketCheckbox(): void { this.updateSectionMasterCheckbox('AirTicketchecked', this.airTicketGroups()); }
  isAirTicketInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.airTicketGroups(), 'AirTicketchecked'); }
  
  onAirTicketPolChange(): void { this.toggleMasterRowGroup('AirTicketPolChecked', this.GrouppermissionsAirTicketPol, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketPol(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketPol, 'AirTicketPolChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketAprChange(): void { this.toggleMasterRowGroup('AirTicketAprChecked', this.GrouppermissionsAirTicketApr, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketApr(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketApr, 'AirTicketAprChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketAlonChange(): void { this.toggleMasterRowGroup('AirTicketAlonChecked', this.GrouppermissionsAirTicketAlon, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketAlon(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketAlon, 'AirTicketAlonChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketEscChange(): void { this.toggleMasterRowGroup('AirTicketEscChecked', this.GrouppermissionsAirTicketEsc, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketEsc(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketEsc, 'AirTicketEscChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketReqChange(): void { this.toggleMasterRowGroup('AirTicketReqChecked', this.GrouppermissionsAirTicketReq, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketReq(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketReq, 'AirTicketReqChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketAprlvlChange(): void { this.toggleMasterRowGroup('AirTicketAprlvlChecked', this.GrouppermissionsAirTicketAprlvl, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketAprlvl(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketAprlvl, 'AirTicketAprlvlChecked', () => this.updateAirTicketCheckbox()); }
  
  onAirTicketRuleChange(): void { this.toggleMasterRowGroup('AirTicketRuleChecked', this.GrouppermissionsAirTicketRule, () => this.updateAirTicketCheckbox()); }
  onCheckboxChangesAirTicketRule(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsAirTicketRule, 'AirTicketRuleChecked', () => this.updateAirTicketCheckbox()); }
  
  private shiftGroups(): any[][] {
    return [
      this.GrouppermissionsShifts, this.GrouppermissionsShiftPattern, this.GrouppermissionsShiftEmployee,
      this.GrouppermissionsShiftOverRide, this.GrouppermissionsEmpOver, this.GrouppermissionsOverTimePolicy,
      this.GrouppermissionsOvertimeRule
    ];
  }
  selectShift(): void { this.toggleSectionGroups('Shiftchecked', this.shiftGroups()); }
  updateShiftCheckbox(): void { this.updateSectionMasterCheckbox('Shiftchecked', this.shiftGroups()); }
  isShiftInderminate(): boolean { return this.isSectionIndeterminateGeneric(this.shiftGroups(), 'Shiftchecked'); }
  
  onShiftsChange(): void { this.toggleMasterRowGroup('ShiftsChecked', this.GrouppermissionsShifts, () => this.updateShiftCheckbox()); }
  onCheckboxChangesShifts(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsShifts, 'ShiftsChecked', () => this.updateShiftCheckbox()); }
  
  onShiftPatternChange(): void { this.toggleMasterRowGroup('ShiftPatternChecked', this.GrouppermissionsShiftPattern, () => this.updateShiftCheckbox()); }
  onCheckboxChangesShiftPattern(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsShiftPattern, 'ShiftPatternChecked', () => this.updateShiftCheckbox()); }
  
  onShiftEmployeeChange(): void { this.toggleMasterRowGroup('ShiftEmployeeChecked', this.GrouppermissionsShiftEmployee, () => this.updateShiftCheckbox()); }
  onCheckboxChangesShiftEmployee(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsShiftEmployee, 'ShiftEmployeeChecked', () => this.updateShiftCheckbox()); }
  
  onShiftOverRideChange(): void { this.toggleMasterRowGroup('ShiftOverRideChecked', this.GrouppermissionsShiftOverRide, () => this.updateShiftCheckbox()); }
  onCheckboxChangesShiftOverRide(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsShiftOverRide, 'ShiftOverRideChecked', () => this.updateShiftCheckbox()); }
  
  onEmpOverChange(): void { this.toggleMasterRowGroup('EmpOverChecked', this.GrouppermissionsEmpOver, () => this.updateShiftCheckbox()); }
  onCheckboxChangeEmpOver(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsEmpOver, 'EmpOverChecked', () => this.updateShiftCheckbox()); }
  
  onOverTimePolicyChange(): void { this.toggleMasterRowGroup('OvertimePolicyChecked', this.GrouppermissionsOverTimePolicy, () => this.updateShiftCheckbox()); }
  onCheckboxChangesOverTimePolicy(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsOverTimePolicy, 'OvertimePolicyChecked', () => this.updateShiftCheckbox()); }
  
  onOvertimeRuleChange(): void { this.toggleMasterRowGroup('OvertimeRuleChecked', this.GrouppermissionsOvertimeRule, () => this.updateShiftCheckbox()); }
  onCheckboxChangesOvertimeRule(id: number): void { this.toggleRowPermission(id, this.GrouppermissionsOvertimeRule, 'OvertimeRuleChecked', () => this.updateShiftCheckbox()); }
  
    private getStandardName(codename: string, actionKeyword: string): string {
      const code = codename.trim().toLowerCase();
      if (code.startsWith('add_') || code.includes(`add_${actionKeyword}`)) return 'Add';
      if (code.startsWith('change_') || code.includes(`change_${actionKeyword}`)) return 'Edit';
      if (code.startsWith('delete_') || code.includes(`delete_${actionKeyword}`)) return 'Delete';
      if (code.startsWith('view_') || code.includes(`view_${actionKeyword}`)) return 'View';
      if (code.startsWith('import_') || code.includes(`import_${actionKeyword}`)) return 'Import';
      if (code.startsWith('export_') || code.includes(`export_${actionKeyword}`)) return 'Export';
      return codename;
    }
  
updateCategory(): void {
  const updatedDepartment = {
    ...this.department,
    name: this.groupName,              // <-- send the updated name
    permissions: this.selectedPermissions,
  };

  console.log(updatedDepartment); // Check the payload

  this.userMasterService
    .updateCategory(this.data.departmentId, updatedDepartment)
    .subscribe(
      (response) => {
        console.log('Group updated successfully:', response);
        alert('Group Updated');
        this.dialogRef.close();
        window.location.reload();
      },
      (error) => {
        console.error('Error updating Group:', error);

        let errorMsg = 'Update failed';

        const backendError = error?.error;

        if (backendError && typeof backendError === 'object') {
          errorMsg = Object.keys(backendError)
            .map(key => `${key}: ${backendError[key].join(', ')}`)
            .join('\n');
        }

        alert(errorMsg);
      }
    );
}


  

  ClosePopup(){
    this.ref.close('Closed using function')
  }






}
