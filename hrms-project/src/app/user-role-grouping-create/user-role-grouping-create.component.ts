import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserMasterService } from '../user-master/user-master.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '../login/authentication.service';
import { environment } from '../../environments/environment';
// import { window } from 'rxjs';

@Component({
  selector: 'app-user-role-grouping-create',
  templateUrl: './user-role-grouping-create.component.html',
  styleUrls: ['./user-role-grouping-create.component.css'],
})
export class UserRoleGroupingCreateComponent implements OnInit {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  // permissions stored arrays for employeemaster
  
  GrouppermissionsEmp: any[] = [];
  GrouppermissionsDept: any[] = [];
  GrouppermissionsDis: any[] = [];
  GrouppermissionsCat: any[] = [];
  GrouppermissionsGen: any[] = [];
  GrouppermissionsReqtype: any[] = [];
  GrouppermissionsApr: any[] = [];
  GrouppermissionsAprlvl: any[] = [];
  GrouppermissionsGenReqEsc: any[] = [];
  GrouppermissionsAtd: any[] = [];
  GrouppermissionsExpDocument: any[] = [];
  GrouppermissionsEmpAprList: any[] = [];
  GrouppermissionsEmpRegAprList: any[] = [];
  GrouppermissionsEndofSer: any[] = [];
  GrouppermissionsRegReq: any[] = [];
  GrouppermissionsRegAprlvl: any[] = [];
  GrouppermissionsGratuity: any[] = [];





  // permissions stored arrays for settings

  GrouppermissionsCmp: any[] = [];
  GrouppermissionsBrch: any[] = [];
  GrouppermissionsUser: any[] = [];
  GrouppermissionsUsergroup: any[] = [];
  GrouppermissionsassigneddUser: any[] = [];
  GrouppermissionsstateMaster: any[] = [];
  Grouppermissionsdocumentype: any[] = [];
  // Grouppermissionsexpirydocuments: any[] = [];
  GrouppermissionslocationMaster: any[] = [];
  GrouppermissionsDnMaster: any[] = [];
  GrouppermissionsCpMaster: any[] = [];
  // GrouppermissionsEmtMaster: any[] = [];
  // GrouppermissionsFormdesMaster: any[] = [];
  GrouppermissionsConfigMaster: any[] = [];
  GrouppermissionsAnnounceMaster: any[] = [];
  GrouppermissionsNotify: any[] = [];



    // permissions stored arrays for reports

  GrouppermissionsemployeeReport: any[] = [];
  GrouppermissionsdocumnetReport: any[] =[];
  GrouppermissiionsgeneralReport: any[]=[];
  GrouppermissiionsLeaveReport: any[]=[];
  GrouppermissiionsDeptReport: any[]=[];
  GrouppermissiionsDesReport: any[]=[];
  GrouppermissiionsLeaveAprRep: any[]=[];
  GrouppermissionsLeaveBalReport: any[] =[];
  GrouppermissionsAttendReport: any[] =[];
  GrouppermissionsAssetReport: any[] =[];
  GrouppermissionsAssetTransReport: any[] =[];


  // permissions stored arrays for Customization

  GrouppermissionsEmpform: any[] = [];
  GrouppermissionsAssetform: any[] = [];





  // permissions stored arrays for calendar

  Grouppermissionsaddweek:any[] =[];
  Grouppermisionsassignweek:any[]=[];
  Grouppermissionsaddholiday: any[]=[];
  Grouppermissionsassisgnholiday:any[]=[];





  //permission stored arrays for leaves
  GrouppermissionsLeaveaprv:any[] =[];
  GrouppermissionsLeavetype:any[] =[];
  GrouppermissionsLeavemaster:any[] =[];
  GrouppermissionsLeavereq:any[] =[];
  GrouppermissionsLeavecom:any[] =[];
  GrouppermissionsLeaveaprvlvl:any[] =[];
  // GrouppermissionsLeaveaprvlvltemp:any[] =[];
  GrouppermissionsLeaveBalance:any[] =[];
  GrouppermissionsLeaveCancel:any[] =[];
  GrouppermissionsLeaveAccrual:any[] =[];
  GrouppermissionsLeaveRejoin:any[] =[];
  GrouppermissionsLeaveEscalation:any[] =[];


  //permission stored arrays for Payroll
  GrouppermissionsPayrollrun:any[] =[];
  GrouppermissionsSalarycomponent:any[] =[];
  GrouppermissionsPayslipAprv: any[] = [];
  GrouppermissionsPayrollaprlvl:any[] =[];
  GrouppermissionsAdvanceSalaryAprvlst:any[] =[];
  GrouppermissionsAdvanceSalaryReq:any[] =[];
  GrouppermissionsAdvanceSalaryAprlvl:any[] =[];
  GrouppermissionsWps:any[] =[];
  GrouppermissionsAdvanceSalaryEscalation:any[] =[];

  //permission stored arrays for Loan
  GrouppermissionsLoanApproval:any[] =[];
  GrouppermissionsLoanType:any[] =[];
  GrouppermissionsLoanAprvlvl:any[] =[];
  GrouppermissionsLoanApp:any[] =[];
  GrouppermissionsLoanRepay:any[] =[];
  GrouppermissionsLoanEscalation:any[] =[];

  //permission stored arrays for Asset

  GrouppermissionsAssetType:any[] =[];
  GrouppermissionsAssetmaster:any[] =[];
  GrouppermissionsAssetAlon:any[] =[];
  GrouppermissionsAssetReq:any[] =[];
  GrouppermissionsAssetApprovals:any[] =[];
  GrouppermissionsAssetApprovallvl:any[] =[];
  GrouppermissionsAssetEscalation:any[] =[];

  //permission stored arrays for Document Management

  GrouppermissionsDocumentAddFol:any[] =[];

  

  
  
 //permission stored arrays for Project

  GrouppermissionsProjects:any[] =[];
  GrouppermissionsProjectStages:any[] =[];
  GrouppermissionsProjectTask:any[] =[];
  GrouppermissionsProjectTime:any[] =[];


  //permission stored arrays for AirTicket


  GrouppermissionsAirTicketPol:any[] =[];
  GrouppermissionsAirTicketAlon:any[] =[];
  GrouppermissionsAirTicketReq:any[] =[];
  GrouppermissionsAirTicketRule:any[] =[];
  GrouppermissionsAirTicketApr:any[] =[];
  GrouppermissionsAirTicketAprlvl:any[] =[];
  GrouppermissionsAirTicketEsc:any[] =[];

 //permission stored arrays for Document
  GrouppermissionsDocumentAprlvl:any[] =[];
  GrouppermissionsDocumentApr:any[] =[];
  GrouppermissionsDocumentReq:any[] =[];
  GrouppermissionsDocumentType:any[] =[];

  //permission stored arrays for Email Template

  GrouppermissionsGeneralReqTemp:any[] =[];
  GrouppermissionsLeaveEmTemp:any[] =[];
  GrouppermissionsDocExpTemp:any[] =[];
  GrouppermissionsDocReqTemp:any[] =[];
  GrouppermissionsAdvSalReqTemp:any[] =[];
  GrouppermissionsLoanReqTemp:any[] =[];

  //permission stored arrays for Shifts

   GrouppermissionsShifts:any[] =[];
   GrouppermissionsShiftPattern:any[] =[];
   GrouppermissionsShiftEmployee:any[] =[];
   GrouppermissionsShiftOverRide:any[] =[];
   GrouppermissionsOverTimePolicy:any[] =[];
   GrouppermissionsEmpOver: any[] = [];




  



  //creating group name declared variables.

  groupName: string = '';
  codename:string ='';
  profile:string ='';
  selectedPermissions: any[] = [];



//selected employee master checkboxes.
  employeeMasterIndeterminate = false;
  departmentMasterInderminate= false;
  designationMasterInderminate = false;
  categoryMasterInderminate = false;
  GenMasterInderminate = false;
  ReqtypeMasterInderminate = false;
  AprMasterInderminate = false;
  AprlvlMasterInderminate = false;
  GenReqEscMasterInderminate = false;
  AtdMasterInderminate = false;
  ExpDocumentInderminate = false;
  EmpAprListInderminate = false;
  EmpRegAprListInderminate = false;
  EndofSerInderminate = false;
  RegReqInderminate = false;
  RegAprlvlInderminate = false;
  GratuityInderminate = false;








  //selected settings checkboxes.

  branchMasterInderminate = false;
  userMasterInderminate = false;
  userGroupMasterInderminate= false;
  assignMasterInderminate= false;
  stateMasterInderminate= false;
  documentMasterInderminate= false;
  expiredMasterInderminate= false;
  locationMasterInderminate= false;
  DnMasterInderminate= false;
  CpMasterInderminate= false;
  // EmtMasterInderminate= false;
  FormdesMasterInderminate= false;
  ConfigMasterInderminate= false;
  AnnounceInderminate= false;
  NotifyInderminate= false;



  //selected reports checkboxes/

  emportReportInderminate= false;
  documentReportInderminate = false;
  generalReportInderminate= false;
  LeaveReportInderminate= false;
  DeptReportInderminate= false;
  DesReportInderminate= false;
  LeaveAprRepInderminate= false;
  LeaveBalReportInderminate = false;
  AttendReportInderminate = false;
  AssetReportInderminate = false;
  AssetTransReportInderminate = false;


  
  //selected Customization checkboxes

  EmpformInderminate= false;
  AssetformInderminate = false;




  //selected calendars checkboxes.

  calenderdetailInderminate= false;
  addweekInderminate=false;
  assignweekInderminate= false;
  addholidayInderminate= false;
  assignholidayInderminate= false;
  // ShiftInderminate= false;





  //selected leave checkboxes.

  LeavedetailInderminate= false;
  LeaveaprvInderminate=false;
  LeavetypeInderminate=false;
  LeavemasterInderminate=false;
  LeavereqInderminate=false;
  LeavecomInderminate=false;
  LeaveaprvlvlInderminate=false;
  // LeaveaprvlvltempInderminate=false;
  LeaveBalanceInderminate=false;
  LaaveCancelInderminate=false;
  LeaveAccrualInderminate=false;
  LeaveRejoinInderminate=false;
  LeaveEscalationInderminate=false;



    //selected payroll checkboxes.

    PayrollrunInderminate= false;
    SalarycomponentInderminate= false;
    PayslipAprvInderminate= false;
    PayrollaprlvlInderminate= false;
    AdvanceSalaryAprvlstInderminate= false;
    AdvanceSalaryReqInderminate= false;
    AdvanceSalaryAprlvlInderminate= false;
    WpsInderminate= false;
    AdvanceSalaryEscalationInderminate= false;


    //selected Loan checkboxes.

    LoanApprovalInderminate= false;
    LoanTypeInderminate= false;
    LoanAprvInderminate= false;
    LoanAppInderminate= false;
    LoanRepayIndeterminate= false;
    LoanEscalationInderminate= false;

    //selected Asset checkboxes.

    AssetTypeInderminate= false;
    AssetmasterInderminate= false;
    AssetAlonInderminate= false;
    AssetReqInderminate= false;
    AssetApprovalsInderminate= false;
    AssetApprovallvlInderminate= false;
    AssetEscalationInderminate= false;


    //selected Document Management checkboxes.

    DocumentAddFolInderminate= false;


    //selected Project checkboxes.

    ProjectsInderminate= false;
    ProjectStagesInderminate= false;
    ProjectTaskInderminate= false;
    ProjectTimeInderminate= false;

    //selected AirTicket checkboxes.

    AirTicketPolInderminate= false;
    AirTicketAlonIndeterminate=false;
    AirTicketReqIndeterminate=false;
    AirTicketRuleIndeterminate=false;
    AirTicketAprInderminate=false;
    AirTicketAprlvlInderminate=false;
    AirTicketEscInderminate=false;

  //selected Document checkboxes.

  DocumentAprlvlInderminate=false;
  DocumentAprInderminate=false;
  DocumentReqInderminate=false;
  DocumentTypeInderminate=false;

  //selected Email Template checkboxes.

    GeneralReqTempInderminate=false;
    LeaveEmTempInderminate=false;
    DocExpTempInderminate=false;
    DocReqTempInderminate=false;
    AdvSalReqTempInderminate=false;
    LoanReqTempInderminate=false;


    
  //selected Shift Template checkboxes.

    ShiftsInderminate=false;
    ShiftPatternInderminate=false;
    ShiftEmployeeInderminate=false;
    ShiftOverRideInderminate=false;
    OvertimePolicyInderminate=false;
    EmpOverInderminate = false;









  // Add these lines


  //employeemaster checkbox checked values
  employeeMasterChecked: boolean = false;
  departmentMasterChecked: boolean = false;
  designationMasterChecked: boolean = false;
  categoryMasterChecked: boolean = false;
  GenMasterChecked: boolean = false;
  ReqtypeMasterChecked: boolean = false;
  AprMasterChecked: boolean = false;
  AprlvlMasterChecked: boolean = false;
  GenReqEscMasterChecked: boolean = false;
  AtdMasterChecked: boolean = false;
  ExpDocumentChecked: boolean = false;
  EmpAprListChecked: boolean = false;
  EmpRegAprListChecked: boolean = false;
  EndofSerChecked: boolean = false;
  RegReqChecked: boolean = false;
  RegAprlvlChecked: boolean = false;
  GratuityChecked: boolean = false;
  







  //settings checkbox checked values

  companyMasterChecked: boolean = false;
  branchMasterChecked: boolean = false;
  userMasterChecked: boolean = false;
  usergroupingMasterChecked: boolean = false;
  assignpermissionMasterChecked: boolean =false;
  stationMasterChecked:boolean =false;
  documenttypeMasterChecked:boolean = false;
  locationMasterChecked:boolean = false;
  DnMasterChecked:boolean = false;
  CpMasterChecked:boolean = false;
  ConfigMasterChecked:boolean = false;
  AnnounceMasterChecked:boolean = false;
  NotefyChecked:boolean = false;




  
  //Reports checkbox checked values

  emportReportChecked:boolean = false;
  documentReportChecked:boolean = false;
  generelReportChecked:boolean = false;
  LeaveReportChecked:boolean = false;
  DeptReportChecked:boolean = false;
  DesReportChecked:boolean = false;
  LeaveAprRepChecked:boolean = false;
  LeaveBalReportChecked:boolean = false;
  AttendReportChecked:boolean = false;
  AssetReportChecked:boolean = false;
  AssetTransReportChecked:boolean = false;

  //Customization checkbox checked values

  EmpformChecked:boolean = false;
  AssetformChecked:boolean = false;

  
  
  //Calendars checkbox checked values

  addweekChecked:boolean= false;
  assignweekChecked:boolean = false;
  addholidayChecked:boolean= false;
  assignholidayChecked:boolean = false;




    //Leave checkbox checked values
    LeaveaprvChecked:boolean= false;
    LeavetypeChecked:boolean= false;
    LeavemasterChecked:boolean= false;
    LeavereqChecked:boolean= false;
    LeavecomChecked:boolean= false;
    LeaveaprvlvlChecked:boolean= false;
    LeaveBalanceChecked:boolean= false;
    LeaveCancelChecked:boolean= false;
    LeaveAccrualChecked:boolean= false;
    LeaveRejoinChecked:boolean= false;
    LeaveEscalationChecked:boolean= false;

   

     //Payroll checkbox checked values

    PayrollrunChecked:boolean= false;
    SalarycomponentChecked:boolean= false;
    PayslipAprvChecked: boolean = false;
    PayrollaprlvlChecked:boolean= false;
    AdvanceSalaryAprvlstChecked:boolean= false;
    AdvanceSalaryReqChecked:boolean= false;
    AdvanceSalaryAprlvlChecked:boolean= false;
    WpsChecked:boolean= false;
    AdvanceSalaryEscalationChecked:boolean= false;

    //Loan checkbox checked values
    LoanApprovalChecked:boolean= false;
    LoanTypeChecked:boolean= false;
    LoanAprvlvlChecked:boolean= false;
    LoanAppChecked:boolean= false;
    LoanRepayChecked:boolean= false;
    LoanEscalationChecked:boolean= false;

    //Asset checkbox checked values

    AssetTypeChecked:boolean= false;
    AssetmasterChecked:boolean= false;
    AssetAlonChecked:boolean= false;
    AssetReqChecked:boolean= false;
    AssetApprovalsChecked:boolean= false;
    AssetApprovallvlChecked:boolean= false;
    AssetEscalationChecked:boolean= false;

    //Document Managemet checkbox checked values

     DocumentAddFolChecked:boolean= false;





    //Project checkbox checked values

    ProjectsChecked:boolean= false;
    ProjectStagesChecked:boolean= false;
    ProjectTaskChecked:boolean= false;
    ProjectTimeChecked:boolean= false;

    
    //AirTicket checkbox checked values

     AirTicketPolChecked:boolean= false;
     AirTicketAlonChecked:boolean= false;
     AirTicketReqChecked:boolean= false;
     AirTicketRuleChecked:boolean= false;
     AirTicketAprChecked:boolean= false;
     AirTicketAprlvlChecked:boolean= false;
     AirTicketEscChecked:boolean= false;


    //Document Req checkbox checked values
     DocumentAprlvlChecked:boolean= false;
     DocumentAprChecked:boolean= false;
     DocumentReqChecked:boolean= false;
     DocumentTypeChecked:boolean= false;

   // Email Template checkbox checked values

    GeneralReqTempChecked:boolean= false;
    LeaveEmTempChecked:boolean= false;
    DocExpTempChecked:boolean= false;
    DocReqTempChecked:boolean= false;
    AdvSalReqTempChecked:boolean= false;
    LoanReqTempChecked:boolean= false;

     // Shift checkbox checked values

     ShiftsChecked:boolean= false;
     ShiftPatternChecked:boolean= false;
     ShiftEmployeeChecked:boolean= false;
     ShiftOverRideChecked:boolean= false;
     OvertimePolicyChecked:boolean= false;
     EmpOverChecked: boolean = false;











    


// main headings values

  selectAllChecked: boolean = false;
  settingsChecked: boolean = false;
  reportchecked:boolean = false;
 customizationchecked:boolean = false;

  calenderchecked:boolean = false;
  Leavechecked:boolean = false;
  Payrollchecked:boolean = false;
  Loanchecked:boolean = false;
  Assetchecked:boolean = false;
  DocumentAddchecked:boolean = false;
  Projectchecked:boolean = false;
  AirTicketchecked:boolean = false;
  Documentchecked:boolean = false;
  EmailTemplatechecked:boolean = false;
  Shiftchecked:boolean = false;



// main masters values

  expandedMasters: boolean = true;
  expandedMastersvalue: boolean = true;
  reportMastersvalue:boolean =true;
  CustomizationMastersvalue:boolean =true;

  calenderMastersvalue:boolean =true;
  LeaveMastersvalue:boolean =true;
  PayrollMastersvalue:boolean =true;
  LoanMastersvalue:boolean =true;
  AssetMastersvalue:boolean =true;
  DocumentAddMastersvalue:boolean =true;
  ProjectMastersvalue:boolean =true;
  AirTicketMastersvalue:boolean =true;
  DocumentMastersvalue:boolean =true;
  EmailTemplateMastersvalue:boolean =true;
  ShiftMastersvalue:boolean =true;


  // Add this property
  registerButtonClicked: boolean = false;

  childCheckboxes = [
    'branchMasterChecked',
    'userMasterChecked',
    'userGroupingMasterChecked',
    'assignPermissionMasterChecked',
    'stateMasterChecked',
    'documentTypeMasterChecked',
    'expiredDocumentsMasterChecked',
    'locationMasterChecked'
  ];
  checkboxes = [
    { label: 'Branch Master', checked: false },
    { label: 'User Master', checked: false },
    { label: 'User Grouping', checked: false },
    { label: 'Assign Permission For User', checked: false },
    { label: 'State Master', checked: false },
    { label: 'Document Type', checked: false },
    { label: 'Expired Documents', checked: false },
    { label: 'Location Master', checked: false },
  ];
  // permissionNameMap: { [key: string]: string } = {
  //   "Add_emp_master": "Add ",
  //   "Change_emp_master": "Edit",
  //   "Delete_emp_master": "Delete",
  //   "View_emp_master": "View"
  // };
  

 //Master Checked Sections


isEmployeeManagementMasterChecked(): boolean {
    return this.employeeMasterChecked &&
      this.departmentMasterChecked &&
      this.designationMasterChecked &&
      this.categoryMasterChecked &&
      this.GenMasterChecked &&
      this.ReqtypeMasterChecked &&
      this.AprMasterChecked &&
      this.AprlvlMasterChecked &&
      this.GenReqEscMasterChecked &&
      this.AtdMasterChecked &&
      this.ExpDocumentChecked &&
      this.EmpAprListChecked &&
      this.EmpRegAprListChecked &&
      this.EndofSerChecked &&
      this.RegReqChecked &&
      this.RegAprlvlChecked &&
      this.GratuityChecked
}


  
// interminate sections

  isEmployeeMasterIndeterminate(): boolean {
    const selectedEmpPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmp.map(p => p.id).includes(permission)
    );
    return selectedEmpPermissions.length > 0 && selectedEmpPermissions.length < this.GrouppermissionsEmp.length;
  }

  isDepartmentMasterIndeterminate(): boolean {
    const selectedDeptPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDept.map(p => p.id).includes(permission)
    );
    return selectedDeptPermissions.length > 0 && selectedDeptPermissions.length < this.GrouppermissionsDept.length;
  }

  isDesignationMasterIndeterminate(): boolean {
    const selectedDisPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDis.map(p => p.id).includes(permission)
    );
    return selectedDisPermissions.length > 0 && selectedDisPermissions.length < this.GrouppermissionsDis.length;
  }

  isCategoryMasterIndeterminate(): boolean {
    const selectedCatPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsCat.map(p => p.id).includes(permission)
    );
    return selectedCatPermissions.length > 0 && selectedCatPermissions.length < this.GrouppermissionsCat.length;
  }

  isGenMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsGen.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsGen.length;
  }

  isReqtypeMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsReqtype.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsReqtype.length;
  }

  isAprMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsApr.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsApr.length;
  }
  isAprlvlMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAprlvl.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsAprlvl.length;
  }

  isGenReqEscMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsGenReqEsc.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsGenReqEsc.length;
  }

  isAtdMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAtd.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsAtd.length;
  }

  isExpDocumentIndeterminate(): boolean {
    const selectedExpDocPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsExpDocument.map(p => p.id).includes(permission)
    );
    return selectedExpDocPermissions.length > 0 && selectedExpDocPermissions.length < this.GrouppermissionsExpDocument.length;
  }


    isEmpAprListIndeterminate(): boolean {
    const selectedEmpAprListPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmpAprList.map(p => p.id).includes(permission)
    );
    return selectedEmpAprListPermissions.length > 0 && selectedEmpAprListPermissions.length < this.GrouppermissionsEmpAprList.length;
  }


    isEmpRegAprListIndeterminate(): boolean {
    const selectedEmpRegAprListPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmpRegAprList.map(p => p.id).includes(permission)
    );
    return selectedEmpRegAprListPermissions.length > 0 && selectedEmpRegAprListPermissions.length < this.GrouppermissionsEmpRegAprList.length;
  }

  isEndofSerIndeterminate(): boolean {
    const selectedEndofSerPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEndofSer.map(p => p.id).includes(permission)
    );
    return selectedEndofSerPermissions.length > 0 && selectedEndofSerPermissions.length < this.GrouppermissionsEndofSer.length;
  }

  isRegReqIndeterminate(): boolean {
    const selectedRegReqPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsRegReq.map(p => p.id).includes(permission)
    );
    return selectedRegReqPermissions.length > 0 && selectedRegReqPermissions.length < this.GrouppermissionsRegReq.length;
  }

  isRegAprlvlIndeterminate(): boolean {
    const selectedRegAprlvlPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsRegAprlvl.map(p => p.id).includes(permission)
    );
    return selectedRegAprlvlPermissions.length > 0 && selectedRegAprlvlPermissions.length < this.GrouppermissionsRegAprlvl.length;
  }

  isGratuityIndeterminate(): boolean {
    const selectedGratuityPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsGratuity.map(p => p.id).includes(permission)
    );
    return selectedGratuityPermissions.length > 0 && selectedGratuityPermissions.length < this.GrouppermissionsGratuity.length;
  }


  isSettingsMasterChecked(): boolean {
    return this.branchMasterChecked &&
      this.userMasterChecked &&
      this.usergroupingMasterChecked &&
      this.assignpermissionMasterChecked &&
      this.stationMasterChecked &&
      this.documenttypeMasterChecked &&
      // this.expireddocumnetsMasterChecked &&
      this.locationMasterChecked &&
      this.DnMasterChecked &&
      this.CpMasterChecked &&
      // this.EmtMasterChecked &&
      // this.FormdesMasterChecked &&
      this.ConfigMasterChecked &&
      this.AnnounceMasterChecked &&
      this.NotefyChecked;
}
  
   isBranchMasterIndeterminate(): boolean {
    const selectedBranchPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsBrch.map(p => p.id).includes(permission)
    );
    return selectedBranchPermissions.length > 0 && selectedBranchPermissions.length < this.GrouppermissionsBrch.length;
  }
 
  isUserMasterIndeterminate(): boolean {
    const selectedUserMasterPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsUser.map(p => p.id).includes(permission)
    );
    return selectedUserMasterPermissions.length > 0 && selectedUserMasterPermissions.length < this.GrouppermissionsUser.length;
  }

  isUserGroupingIndeterminate(): boolean {
    const selectedUserGroupPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsUsergroup.map(p => p.id).includes(permission)
    );
    return selectedUserGroupPermissions.length > 0 && selectedUserGroupPermissions.length < this.GrouppermissionsUsergroup.length;
  }

  isAssignPermissionsIndeterminate(): boolean {
    const selectedAssignPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsassigneddUser.map(p => p.id).includes(permission)
    );
    return selectedAssignPermissions.length > 0 && selectedAssignPermissions.length < this.GrouppermissionsassigneddUser.length;
  }

  isStateMasterIndeterminate(): boolean {
    const selectedstatePermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsstateMaster.map(p => p.id).includes(permission)
    );
    return selectedstatePermissions.length > 0 && selectedstatePermissions.length < this.GrouppermissionsstateMaster.length;
  }

   isdocumenttypeIndeterminate(): boolean {
    const selecteddocumentPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermissionsdocumentype.map(p => p.id).includes(permission)
    );
    return selecteddocumentPermissions.length > 0 && selecteddocumentPermissions.length < this.Grouppermissionsdocumentype.length;
  }

   isloactionmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionslocationMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionslocationMaster.length;
  }
  
  isDnmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDnMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsDnMaster.length;
  }

  isCpmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsCpMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsCpMaster.length;
  }

isConfigmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsConfigMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsConfigMaster.length;
  }

isAnnounceIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAnnounceMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsAnnounceMaster.length;
  }

isNotifyIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsNotify.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsNotify.length;
  }

  isReportManagementMasterChecked(): boolean {
    return this.emportReportChecked &&
      this.documentReportChecked &&
      this.generelReportChecked  &&
      this.LeaveReportChecked &&
      this.DeptReportChecked &&
      this.DesReportChecked &&
      this.LeaveAprRepChecked &&
      this.LeaveBalReportChecked &&
      this.AttendReportChecked &&
      this.AssetReportChecked &&
      this.AssetTransReportChecked
      
}


  
isEmployeeReportIndeterminate(): boolean {
    const selectedempreportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsemployeeReport.map(p => p.id).includes(permission)
    );
    return selectedempreportPermissions.length > 0 && selectedempreportPermissions.length < this.GrouppermissionsemployeeReport.length;
}

isDocumentReportIndeterminate(): boolean {
    const selecteddocreportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsdocumnetReport.map(p => p.id).includes(permission)
    );
    return selecteddocreportPermissions.length > 0 && selecteddocreportPermissions.length < this.GrouppermissionsdocumnetReport.length;
}

isLeaveBalReportIndeterminate(): boolean {
    const selectedLeaveBalreportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveBalReport.map(p => p.id).includes(permission)
    );
    return selectedLeaveBalreportPermissions.length > 0 && selectedLeaveBalreportPermissions.length < this.GrouppermissionsLeaveBalReport.length;
}

isGeneralReportIndeterminate(): boolean {
    const selectedGenReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissiionsgeneralReport.map(p => p.id).includes(permission)
    );
    return selectedGenReportPermissions.length > 0 && selectedGenReportPermissions.length < this.GrouppermissiionsgeneralReport.length;
}
  
isLeaveReportIndeterminate(): boolean {
    const selectedLeaveReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissiionsLeaveReport.map(p => p.id).includes(permission)
    );
    return selectedLeaveReportPermissions.length > 0 && selectedLeaveReportPermissions.length < this.GrouppermissiionsLeaveReport.length;
}

isAttendReportIndeterminate(): boolean {
    const selectedAttendReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAttendReport.map(p => p.id).includes(permission)
    );
    return selectedAttendReportPermissions.length > 0 && selectedAttendReportPermissions.length < this.GrouppermissionsAttendReport.length;
}

isAssetReportIndeterminate(): boolean {
    const selectedAssetReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAssetReport.map(p => p.id).includes(permission)
    );
    return selectedAssetReportPermissions.length > 0 && selectedAssetReportPermissions.length < this.GrouppermissionsAssetReport.length;
}

isAssetTransReportIndeterminate(): boolean {
    const selectedAssetTransReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAssetTransReport.map(p => p.id).includes(permission)
    );
    return selectedAssetTransReportPermissions.length > 0 && selectedAssetTransReportPermissions.length < this.GrouppermissionsAssetTransReport.length;
}

isLeaveAprRepIndeterminate(): boolean {
    const selectedLeaveAprReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissiionsLeaveAprRep.map(p => p.id).includes(permission)
    );
    return selectedLeaveAprReportPermissions.length > 0 && selectedLeaveAprReportPermissions.length < this.GrouppermissiionsLeaveAprRep.length;
}

isDeptReportIndeterminate(): boolean {
    const selectedDeptReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissiionsDeptReport.map(p => p.id).includes(permission)
    );
    return selectedDeptReportPermissions.length > 0 && selectedDeptReportPermissions.length < this.GrouppermissiionsDeptReport.length;
}

isDesReportIndeterminate(): boolean {
    const selectedDesReportPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissiionsDesReport.map(p => p.id).includes(permission)
    );
    return selectedDesReportPermissions.length > 0 && selectedDesReportPermissions.length < this.GrouppermissiionsDesReport.length;
}

isCustomizationManagementMasterChecked(): boolean {
    return this.EmpformChecked &&
    this.AssetformChecked
      
}


isEmpformIndeterminate(): boolean {
    const selectedEmpformPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmpform.map(p => p.id).includes(permission)
    );
    return selectedEmpformPermissions.length > 0 && selectedEmpformPermissions.length < this.GrouppermissionsEmpform.length;
}

isAssetformIndeterminate(): boolean {
    const selectedAssetformPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAssetform.map(p => p.id).includes(permission)
    );
    return selectedAssetformPermissions.length > 0 && selectedAssetformPermissions.length < this.GrouppermissionsAssetform.length;
}


isCalenderMangementMasterChecked():boolean{
    return this.addweekChecked &&
          this.assignweekChecked &&
          this.addholidayChecked &&
          this.assignholidayChecked


}


isAddWeekIndeterminate(): boolean {
    const selectedaddweekPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermissionsaddweek.map(p => p.id).includes(permission)
    );
    return selectedaddweekPermissions.length > 0 && selectedaddweekPermissions.length < this.Grouppermissionsaddweek.length;
}

isAssignWeekIndeterminate(): boolean {
    const selectedassignweekPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermisionsassignweek.map(p => p.id).includes(permission)
    );
    return selectedassignweekPermissions.length > 0 && selectedassignweekPermissions.length < this.Grouppermisionsassignweek.length;
}

isAddHolidayIndeterminate(): boolean {
    const selectedaddholidayPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermissionsaddholiday.map(p => p.id).includes(permission)
    );
    return selectedaddholidayPermissions.length > 0 && selectedaddholidayPermissions.length < this.Grouppermissionsaddholiday.length;
}

isAssignHolidayIndeterminate(): boolean {
    const selectedassignholidayPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermissionsassisgnholiday.map(p => p.id).includes(permission)
    );
    return selectedassignholidayPermissions.length > 0 && selectedassignholidayPermissions.length < this.Grouppermissionsassisgnholiday.length;
}


isLeaveMangementMasterChecked():boolean{
    return this.LeaveaprvChecked &&
    this.LeavetypeChecked &&
    this.LeavemasterChecked &&
    this.LeavereqChecked &&
    this.LeavecomChecked &&
    this.LeaveaprvlvlChecked &&
    this.LeaveBalanceChecked &&
    this.LeaveCancelChecked &&
    this.LeaveAccrualChecked &&
    this.LeaveRejoinChecked &&
    this.LeaveEscalationChecked;
       
}

 
isLeaveaprvIndeterminate(): boolean {
    const selectedLeaveaprvPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveaprv.map(p => p.id).includes(permission)
    );
    return selectedLeaveaprvPermissions.length > 0 && selectedLeaveaprvPermissions.length < this.GrouppermissionsLeaveaprv.length;
}

isLeavetypeIndeterminate(): boolean {
    const selectedLeavetypePermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeavetype.map(p => p.id).includes(permission)
    );
    return selectedLeavetypePermissions.length > 0 && selectedLeavetypePermissions.length < this.GrouppermissionsLeavetype.length;
}

isLeaveEscalationIndeterminate(): boolean {
    const selectedLeaveEscalationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveEscalation.map(p => p.id).includes(permission)
    );
    return selectedLeaveEscalationPermissions.length > 0 && selectedLeaveEscalationPermissions.length < this.GrouppermissionsLeaveEscalation.length;
}

isLeavemasterIndeterminate(): boolean {
    const selectedLeavemasterPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeavemaster.map(p => p.id).includes(permission)
    );
    return selectedLeavemasterPermissions.length > 0 && selectedLeavemasterPermissions.length < this.GrouppermissionsLeavemaster.length;
}

isLeavereqIndeterminate(): boolean {
    const selectedLeavereqPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeavereq.map(p => p.id).includes(permission)
    );
    return selectedLeavereqPermissions.length > 0 && selectedLeavereqPermissions.length < this.GrouppermissionsLeavereq.length;
}

isLeavecomIndeterminate(): boolean {
    const selectedLeavecomPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeavecom.map(p => p.id).includes(permission)
    );
    return selectedLeavecomPermissions.length > 0 && selectedLeavecomPermissions.length < this.GrouppermissionsLeavecom.length;
}

isLeaveaprvlvlIndeterminate(): boolean {
    const selectedLeaveaprvlvlPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveaprvlvl.map(p => p.id).includes(permission)
    );
    return selectedLeaveaprvlvlPermissions.length > 0 && selectedLeaveaprvlvlPermissions.length < this.GrouppermissionsLeaveaprvlvl.length;
}


isLeaveBalanceIndeterminate(): boolean {
    const selectedLeaveBalancePermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveBalance.map(p => p.id).includes(permission)
    );
    return selectedLeaveBalancePermissions.length > 0 && selectedLeaveBalancePermissions.length < this.GrouppermissionsLeaveBalance.length;
}

isLeaveCancelIndeterminate(): boolean {
    const selectedLeaveCancelPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveCancel.map(p => p.id).includes(permission)
    );
    return selectedLeaveCancelPermissions.length > 0 && selectedLeaveCancelPermissions.length < this.GrouppermissionsLeaveCancel.length;
}

isLeaveAccrualIndeterminate(): boolean {
    const selectedLeaveAccrualPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveAccrual.map(p => p.id).includes(permission)
    );
    return selectedLeaveAccrualPermissions.length > 0 && selectedLeaveAccrualPermissions.length < this.GrouppermissionsLeaveAccrual.length;
}

isLeaveRejoinIndeterminate(): boolean {
    const selectedLeaveRejoinPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveRejoin.map(p => p.id).includes(permission)
    );
    return selectedLeaveRejoinPermissions.length > 0 && selectedLeaveRejoinPermissions.length < this.GrouppermissionsLeaveRejoin.length;
}

// Payroll ManagementMaster Checked 


isPayrollManagementMasterChecked():boolean{
  return this.PayrollrunChecked &&
  this.SalarycomponentChecked &&
  this.PayslipAprvChecked &&
  this.PayrollaprlvlChecked &&
  this.AdvanceSalaryAprvlstChecked &&
  this.AdvanceSalaryReqChecked &&
  this.AdvanceSalaryAprlvlChecked &&
  this.WpsChecked &&
  this.AdvanceSalaryEscalationChecked;
}



isPayrollrunIndeterminate(): boolean {
  const selectedPayrollPermissions = this.selectedPermissions.filter(permission =>
    this.GrouppermissionsPayrollrun.map(p => p.id).includes(permission)
  );
  return selectedPayrollPermissions.length > 0 &&
         selectedPayrollPermissions.length < this.GrouppermissionsPayrollrun.length;
}

isSalarycomponentIndeterminate(): boolean {
  const selectedSalaryPermissions = this.selectedPermissions.filter(permission =>
    this.GrouppermissionsSalarycomponent.map(p => p.id).includes(permission)
  );
  return selectedSalaryPermissions.length > 0 &&
         selectedSalaryPermissions.length < this.GrouppermissionsSalarycomponent.length;
}

isPayslipAprvIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsPayslipAprv.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsPayslipAprv.length;
}

isPayrollaprlvlIndeterminate(): boolean {
  const selectedPayrollApprovallevelPermissions = this.selectedPermissions.filter(permission =>
    this.GrouppermissionsPayrollaprlvl.map(p => p.id).includes(permission)
  );
  return selectedPayrollApprovallevelPermissions.length > 0 &&
         selectedPayrollApprovallevelPermissions.length < this.GrouppermissionsPayrollaprlvl.length;
}

isAdvanceSalaryAprvlstIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAdvanceSalaryAprvlst.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAdvanceSalaryAprvlst.length;
}

isAdvanceSalaryReqIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAdvanceSalaryReq.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAdvanceSalaryReq.length;
}

isAdvanceSalaryEscalationIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAdvanceSalaryEscalation.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAdvanceSalaryEscalation.length;
}

isAdvanceSalaryAprlvlIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAdvanceSalaryAprlvl.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAdvanceSalaryAprlvl.length;
}

isWpsIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsWps.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsWps.length;
}


// Loan ManagementMaster Checked 

isLoanManagementMasterChecked():boolean{
  return this.LoanApprovalChecked &&
  this.LoanTypeChecked &&
  this.LoanAprvlvlChecked &&
  this.LoanAppChecked &&
  this.LoanRepayChecked &&
  this.LoanEscalationChecked

}


isLoanApprovalIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanApproval.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanApproval.length;
}

isLoanTypeIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanType.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanType.length;
}

isLoanRepayIndeterminate(): boolean { 
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanRepay.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanRepay.length;
}

isLoanAprvlvlIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanAprvlvl.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanAprvlvl.length;
}

isLoanEscalationIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanEscalation.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanEscalation.length;
}

isLoanAppIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanApp.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanApp.length;
}

// Asset ManagementMaster Checked 


isAssetManagementMasterChecked():boolean{
  return this.AssetTypeChecked &&
  this.AssetmasterChecked &&
  this.AssetAlonChecked &&
  this.AssetReqChecked &&
  this.AssetApprovalsChecked &&
  this.AssetApprovallvlChecked &&
  this.AssetEscalationChecked;

}


isAssetTypeIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetType.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetType.length;
}

isAssetApprovalsIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetApprovals.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetApprovals.length;
}

isAssetApprovalLvlIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetApprovallvl.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetApprovallvl.length;
}

isAssetEscalationIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetEscalation.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetEscalation.length;
}


isAssetmasterIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetmaster.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetmaster.length;
}

isAssetAlonIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetAlon.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetAlon.length;
}

isAssetReqIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetReq.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetReq.length;
}


// Document ManagementMaster Checked 

isDocumentAddManagementMasterChecked():boolean{
   return this.DocumentAddFolChecked 

}

isDocumentAddFolIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsDocumentAddFol.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsDocumentAddFol.length;
}


// Project ManagementMaster Checked 

isProjectManagementMasterChecked():boolean{
   return this.ProjectsChecked &&
   this.ProjectStagesChecked &&
   this.ProjectTaskChecked &&
   this.ProjectTimeChecked;
}


isProjectsIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsProjects.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsProjects.length;
}

isProjectStagesIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsProjectStages.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsProjectStages.length;
}

isProjectTaskIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsProjectTask.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsProjectTask.length;
}

isProjectTimeIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsProjectTime.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsProjectTime.length;
}

// AirTicket ManagementMaster Checked 

isAirTicketManagementMasterChecked():boolean{
   return this.AirTicketPolChecked &&
   this.AirTicketAlonChecked &&
   this.AirTicketReqChecked &&
   this.AirTicketRuleChecked &&
   this.AirTicketAprChecked &&
   this.AirTicketAprlvlChecked &&
   this.AirTicketEscChecked;
   
}



isAirTicketPolIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketPol.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketPol.length;
}


isAirTicketAprIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketApr.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketApr.length;
}

isAirTicketAprlvlIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketAprlvl.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketAprlvl.length;
}

isAirTicketEscIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketEsc.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketEsc.length;
}


isAirTicketAlonIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketAlon.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketAlon.length;
}

isAirTicketReqIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketReq.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketReq.length;
}

isAirTicketRuleIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketRule.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketRule.length;
}


//  Document ManageMaster Checked

    isDocumentMangementMasterChecked():boolean{
    return this.DocumentAprlvlChecked &&
    this.DocumentAprChecked &&
    this.DocumentReqChecked &&
    this.DocumentTypeChecked;

       
  }


  isDocumentAprlvlIndeterminate(): boolean {
    const selectedDocumentAprlvlPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocumentAprlvl.map(p => p.id).includes(permission)
    );
    return selectedDocumentAprlvlPermissions.length > 0 && selectedDocumentAprlvlPermissions.length < this.GrouppermissionsDocumentAprlvl.length;
  }

  isDocumentAprIndeterminate(): boolean {
    const selectedDocumentAprPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocumentApr.map(p => p.id).includes(permission)
    );
    return selectedDocumentAprPermissions.length > 0 && selectedDocumentAprPermissions.length < this.GrouppermissionsDocumentApr.length;
  }

  isDocumentReqIndeterminate(): boolean {
    const selectedDocumentReqPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocumentReq.map(p => p.id).includes(permission)
    );
    return selectedDocumentReqPermissions.length > 0 && selectedDocumentReqPermissions.length < this.GrouppermissionsDocumentReq.length;
  }

  isDocumentTypeIndeterminate(): boolean {
    const selectedDocumentTypePermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocumentType.map(p => p.id).includes(permission)
    );
    return selectedDocumentTypePermissions.length > 0 && selectedDocumentTypePermissions.length < this.GrouppermissionsDocumentType.length;
  }

  //  Email Template ManageMaster Checked

  isEmailTemplateMangementMasterChecked():boolean{
    return this.GeneralReqTempChecked &&
    this.LeaveEmTempChecked &&
    this.DocExpTempChecked &&
    this.DocReqTempChecked &&
    this.AdvSalReqTempChecked &&
    this.LoanReqTempChecked;   
  }


  isGeneralReqTempIndeterminate(): boolean {
    const selectedGeneralReqTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsGeneralReqTemp.map(p => p.id).includes(permission)
    );
    return selectedGeneralReqTempPermissions.length > 0 && selectedGeneralReqTempPermissions.length < this.GrouppermissionsGeneralReqTemp.length;
  }

  isLeaveEmTempIndeterminate(): boolean {
    const selectedLeaveEmTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveEmTemp.map(p => p.id).includes(permission)
    );
    return selectedLeaveEmTempPermissions.length > 0 && selectedLeaveEmTempPermissions.length < this.GrouppermissionsLeaveEmTemp.length;
  }

  isDocExpTempIndeterminate(): boolean {
    const selectedDocExpTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocExpTemp.map(p => p.id).includes(permission)
    );
    return selectedDocExpTempPermissions.length > 0 && selectedDocExpTempPermissions.length < this.GrouppermissionsDocExpTemp.length;
  }

  isDocReqTempIndeterminate(): boolean {
    const selectedDocReqTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsDocReqTemp.map(p => p.id).includes(permission)
    );
    return selectedDocReqTempPermissions.length > 0 && selectedDocReqTempPermissions.length < this.GrouppermissionsDocReqTemp.length;
  }

  isAdvSalReqTempIndeterminate(): boolean {
    const selectedAdvSalReqTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAdvSalReqTemp.map(p => p.id).includes(permission)
    );
    return selectedAdvSalReqTempPermissions.length > 0 && selectedAdvSalReqTempPermissions.length < this.GrouppermissionsAdvSalReqTemp.length;
  }

  isLoanReqTempIndeterminate(): boolean {
    const selectedLoanReqTempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLoanReqTemp.map(p => p.id).includes(permission)
    );
    return selectedLoanReqTempPermissions.length > 0 && selectedLoanReqTempPermissions.length < this.GrouppermissionsLoanReqTemp.length;
  }


    //  Shift ManageMaster Checked


    isShiftManagementMasterChecked():boolean{
    return this.ShiftsChecked &&
     this.ShiftPatternChecked &&
     this.ShiftEmployeeChecked &&
     this.ShiftOverRideChecked &&
     this.OvertimePolicyChecked &&
     this.EmpOverChecked;
 
  }



  isShiftsIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsShifts.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsShifts.length;
}


  isShiftPatternIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsShiftPattern.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsShiftPattern.length;
}

  isShiftEmployeeIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsShiftEmployee.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsShiftEmployee.length;
}


  isShiftOverRideIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsShiftOverRide.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsShiftOverRide.length;
}

  isOvertimePolicyIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsOverTimePolicy.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsOverTimePolicy.length;
}

  isEmpOverIndeterminate(): boolean {
    const selectedEmpOverPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmpOver.map(p => p.id).includes(permission)
    );
    return selectedEmpOverPermissions.length > 0 && selectedEmpOverPermissions.length < this.GrouppermissionsEmpOver.length;
  }









  constructor(
    private UserMasterService: UserMasterService,
    private authService: AuthenticationService,
    private http: HttpClient,
    private ref: MatDialogRef<UserRoleGroupingCreateComponent>
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
    this.loadSettingPermissions();
    this.loadReportPermissions();
    this.loadCustomizationPermissions();

    this.loadCalenderPermissions();
    this.loadLeavePermissions();
    this.loadPayrollPermissions();
    this.loadLoanPermissions();
    this.loadAssetPermissions();
    this.loadDocumentAddPermissions();
    this.loadProjectPermissions();
    this.loadAirTicketPermissions();
    this.loadDocumentPermissions();
    this.loadEmailTemplatePermissions();
    this.loadShiftPermissions();


    this.updateIndeterminateStates();
    this.updateIndeterminateStatesvalue();
    this.updateIndeterminateReports();
    this.updateIndeterminateCustomization();

    this.updateInderminateCalenders();
    this.updateInderminateLeave();
    this.updateInderminatePayroll();
    this.updateInderminateLoan();
    this.updateInderminateAsset();
    this.updateInderminateDocumentAdd();
    this.updateInderminateProject();
    this.updateInderminateAirTicket();
    this.updateInderminateDocument();
    this.updateInderminateEmailTemplate();
    this.updateInderminateShift();



  }

  //update interminate Sections

  updateIndeterminateStates(): void {
    this.isEmployeeMasterIndeterminate();
    this.isDepartmentMasterIndeterminate();
    this.isDesignationMasterIndeterminate();
    this.isCategoryMasterIndeterminate();
    this.isGenMasterIndeterminate();
    this.isReqtypeMasterIndeterminate();
    this.isAprMasterIndeterminate();
    this.isAprlvlMasterIndeterminate();
    this.isGenReqEscMasterIndeterminate();
    this.isAtdMasterIndeterminate();
    this.isExpDocumentIndeterminate();

    this.isEmpAprListIndeterminate();
    this.isEmpRegAprListIndeterminate();
    this.isEndofSerIndeterminate();
    this.isRegReqIndeterminate();
    this.isRegAprlvlIndeterminate();
    this.isGratuityIndeterminate();




  }

  updateIndeterminateStatesvalue(): void{
   
    this.isBranchMasterIndeterminate();
    this.isUserMasterIndeterminate();
    this.isUserGroupingIndeterminate();
    this.isAssignPermissionsIndeterminate();
    this.isStateMasterIndeterminate();
    this.isdocumenttypeIndeterminate();
    this.isloactionmasterIndeterminate();
    this.isDnmasterIndeterminate();
    this.isCpmasterIndeterminate();
    this.isConfigmasterIndeterminate();
    this.isAnnounceIndeterminate();
    this.isNotifyIndeterminate();


  
  }


updateIndeterminateReports(): void{
  this.isEmployeeReportIndeterminate();
  this.isDocumentReportIndeterminate();
  this.isGeneralReportIndeterminate();
  this.isLeaveReportIndeterminate();
  this.isDeptReportIndeterminate();
  this.isDesReportIndeterminate();
  this.isLeaveAprRepIndeterminate();
  this.isLeaveBalReportIndeterminate();
  this.isAttendReportIndeterminate();
  this.isAssetReportIndeterminate();
  this.isAssetTransReportIndeterminate();


}

updateIndeterminateCustomization(): void{
  this.isEmpformIndeterminate();
  this.isAssetformIndeterminate();


}

updateInderminateCalenders():void{
  this.isAddHolidayIndeterminate();
  this.isAddWeekIndeterminate();
  this.isAssignWeekIndeterminate();
  this.isAssignHolidayIndeterminate();
  // this.isShiftIndeterminate();

}


updateInderminateLeave():void{
  this.isLeaveaprvIndeterminate();
  this.isLeavetypeIndeterminate();
  this.isLeavemasterIndeterminate();
  this.isLeavereqIndeterminate();
  this.isLeavecomIndeterminate();
  this.isLeaveaprvlvlIndeterminate();
  // this.isLeaveaprvlvltempIndeterminate();
  this.isLeaveBalanceIndeterminate();
  this.isLeaveCancelIndeterminate();
  this.isLeaveAccrualIndeterminate();
  this.isLeaveRejoinIndeterminate();
  this.isLeaveEscalationIndeterminate();




}

// Update Interminate Payroll

updateInderminatePayroll():void{
  this.isPayrollrunIndeterminate();
  this.isSalarycomponentIndeterminate();
  this.isPayslipAprvIndeterminate();
  this.isPayrollaprlvlIndeterminate();
  this.isAdvanceSalaryAprvlstIndeterminate();
  this.isAdvanceSalaryReqIndeterminate();
  this.isAdvanceSalaryAprlvlIndeterminate();
  this.isWpsIndeterminate();
  this.isAdvanceSalaryEscalationIndeterminate();
}

// Update Interminate Loan

updateInderminateLoan():void{
  this.isLoanApprovalIndeterminate();
  this.isLoanTypeIndeterminate();
  this.isLoanAprvlvlIndeterminate();
  this.isLoanAppIndeterminate();
  this.isLoanRepayIndeterminate();
  this.isLoanEscalationIndeterminate();

}

// Update Interminate Asset

updateInderminateAsset():void{
  this.isAssetTypeIndeterminate();
  this.isAssetmasterIndeterminate();
  this.isAssetAlonIndeterminate();
  this.isAssetReqIndeterminate();
  this.isAssetApprovalsIndeterminate();
  this.isAssetApprovalLvlIndeterminate();
  this.isAssetEscalationIndeterminate();
 
}

// Update Interminate Document Management

updateInderminateDocumentAdd():void{
  this.isDocumentAddFolIndeterminate();

 
}

// Update Interminate Project

updateInderminateProject():void{
  this.isProjectsIndeterminate();
  this.isProjectStagesIndeterminate();
  this.isProjectTaskIndeterminate();
  this.isProjectTimeIndeterminate();

}

// Update Interminate AirTicket

updateInderminateAirTicket():void{

  this.isAirTicketPolIndeterminate();
  this.isAirTicketAlonIndeterminate();
  this.isAirTicketReqIndeterminate();
  this.isAirTicketRuleIndeterminate();
  this.isAirTicketAprIndeterminate();
  this.isAirTicketAprlvlIndeterminate();
  this.isAirTicketEscIndeterminate();


}


// Update Interminate Document


updateInderminateDocument():void{

  this.isDocumentAprlvlIndeterminate();
  this.isDocumentAprIndeterminate();
  this.isDocumentReqIndeterminate();
  this.isDocumentTypeIndeterminate();


}


// Update Interminate EmailTemplate


updateInderminateEmailTemplate():void{

  this.isGeneralReqTempIndeterminate();
  this.isLeaveEmTempIndeterminate();
  this.isDocExpTempIndeterminate();
  this.isDocReqTempIndeterminate();
  this.isAdvSalReqTempIndeterminate();
  this.isLoanReqTempIndeterminate();



}


// Update Interminate 


updateInderminateShift():void{

  this.isShiftsIndeterminate();
  this.isShiftPatternIndeterminate();
  this.isShiftEmployeeIndeterminate();
  this.isShiftOverRideIndeterminate();
  this.isOvertimePolicyIndeterminate();
  this.isEmpOverIndeterminate();




}




















// load masters sections

  loadPermissions(): void {
    this.loadpermissionsEmpMaster();
    this.loadpermissionsDepartMaster();
    this.loadpermissionsDisgMaster();
    this.loadpermissionsCatgMaster();
    this.loadpermissionsGenMaster();
    this.loadpermissionsReqtypeMaster();
    this.loadpermissionsAprMaster();
    this.loadpermissionsAprlvlMaster();
    this.loadpermissionsGenReqEscMaster();
    this.loadpermissionsAtdMaster();
    this.loadpermissionsExpDocument();
    this.loadpermissionsEmpAprList();
    this.loadpermissionsEmpRegAprList();
    this.loadpermissionsEndofSer();
    this.loadpermissionsregReq();
    this.loadpermissionsRegAprlvl();
    this.loadpermissionsGratuity();
  }


// this.loadpermissionsCmpMaster();
   

  loadSettingPermissions():void{
    this.loadpermissionsBranchMaster();
    this.loadpermissionsUserMaster();
    this.loadpermissionsUserGroupMaster();
    this.loadpermissionsassigneduser();
    this.loadpermissionsstatemaster();
    this.loadpermissionsdocumnettype();
    // this.loadpermissionexpirydocuments();
    this.loadpermissionlocationmaster();
    this.loadpermissionDnmaster();
    this.loadpermissionCpmaster();
    // this.loadpermissionEmtmaster();
    // this.loadpermissionFormdesmaster();
    this.loadpermissionConfig();
    this.loadpermissionAnnouncement();
    this.loadpermissionNotification();


  }



  // load Report permissions Sections

  loadReportPermissions():void{
    this.loadpermissionsEmpReport();
    this.loadpermissionsDocReport();
    this.loadpermissionsGenReport();
    this.loadpermissionsLeaveReport();
    this.loadpermissionsDeptReport();
    this.loadpermissionsDesReport();
    this.loadpermissionsLeaveAprReport();
    this.loadpermissionsLeaveBalReport();
    this.loadpermissionsAttendReport();
    this.loadpermissionsAssetReport();
    this.loadpermissionsAssetTransReport();



  }

  // load Customization permissions Sections

  loadCustomizationPermissions():void{

    this.loadpermissionsEmpform();
    this.loadpermissionsAssetform();



  }


  loadCalenderPermissions():void{
    this.loadpermissionsAddweekDetail();
    this.loadpermissionsAssignweekDetail();
    this.loadpermissionsAddholidayDetail();
    this.loadpermissionsAssignholidayDetail();
    // this.loadpermissionsShiftDetail();

  }


  loadLeavePermissions():void{
    this.loadpermissionsLeaveaprv();
    this.loadpermissionsLeavetype();
    this.loadpermissionsLeavemaster();
    this.loadpermissionsLeavereq();
    this.loadpermissionsLeavecom();
    this.loadpermissionsLeaveaprvlvl();
    this.loadpermissionsLeaveBalance();
    this.loadpermissionsLeaveCancel();
    this.loadpermissionsLeaveAccrual();
    this.loadpermissionsLeaveRejoin();
    this.loadpermissionsLeaveEscalation();


  }

  // Payroll Permission

  loadPayrollPermissions():void{

  this.loadpermissionsPayrollrun();
  this.loadpermissionsSalarycomponent();
  this.loadpermissionsPayslipAprv();
  this.loadpermissionsPayrollaprlvl();
  this.loadpermissionsAdvanceSalaryAprvlst();
  this.loadpermissionsAdvanceSalaryReq();
  this.loadpermissionsAdvanceSalaryAprlvl();
  this.loadpermissionsWps();
  this.loadpermissionsAdvanceSalaryEscalation();

  }

  // Loan Permissions

  loadLoanPermissions():void{

  this.loadpermissionsLoanApproval();
  this.loadpermissionsLoanType();
  this.loadpermissionsLoanAprvlvl();
  this.loadpermissionsLoanApp();
  this.loadpermissionsLoanRepay();
  this.loadpermissionsLoanEscalation();
 
  }

  // Asset Permissions

  loadAssetPermissions():void{

  this.loadpermissionsAssetType();
  this.loadpermissionsAssetmaster();
  this.loadpermissionsAssetAlon();
  this.loadpermissionsAssetReq();
  this.loadpermissionsAssetApprovals();
  this.loadpermissionsAssetApprovalLvl();
  this.loadpermissionsAssetEscalation();

  }

    // Document Management Permissions

  loadDocumentAddPermissions():void{

  this.loadpermissionsDocumnetAddFol();


  }

  // Project Permissions

  loadProjectPermissions():void{

  this.loadpermissionsProjects();
  this.loadpermissionsProjectStages();
  this.loadpermissionsProjectTask();
  this.loadpermissionsProjectTime();

  }

  // AirTicket Permissions

  loadAirTicketPermissions():void{

  this.loadpermissionsAirTicketPol();
  this.loadpermissionsAirTicketAlon();
  this.loadpermissionsAirTicketReq();
  this.loadpermissionsAirTicketRule();
  this.loadpermissionsAirTicketApr();
  this.loadpermissionsAirTicketAprlvl();
  this.loadpermissionsAirTicketEsc();


  }

    // Document Permissions

  loadDocumentPermissions():void{

  this.loadpermissionsDocumentAprlvl();
  this.loadpermissionsDocumentApr();
  this.loadpermissionsDocumentReq();
  this.loadpermissionsDocumentType();
  

  }


  // Email Template Permissions

  loadEmailTemplatePermissions():void{

  this.loadpermissionsGeneralReqTemp();
  this.loadpermissionsLeaveEmTemp();
  this.loadpermissionsDocExpTemp();
  this.loadpermissionsDocReqTemp();
  this.loadpermissionsAdvSalReqTemp();
  this.loadpermissionsLoanReqTemp();

  

  }


    // Shift Permissions

  loadShiftPermissions():void{

  this.loadpermissionsShifts();
  this.loadpermissionsShiftPattern();
  this.loadpermissionsShiftEmployee();
  this.loadpermissionsShiftOverRide();
  this.loadpermissionsOverTimepolicy();
  this.loadpermissionsEmpOver();


  

  }


  




//load employee master permissions 



  loadpermissionsEmpMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_emp_master', 'change_emp_master', 'delete_emp_master', 'view_emp_master'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsEmp = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsEmp);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


    //Display Name add view delte code for emplotee master-------

    getDisplayNameEmp(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_emp_master':
          return 'Add';
        case 'change_emp_master':
          return 'Edit';
        case 'delete_emp_master':
          return 'Delete';
        case 'view_emp_master':
          return 'View';
        default:
          return permissionCodename;
      }
    }


    //load permission for department

  loadpermissionsDepartMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_dept_master', 'change_dept_master', 'delete_dept_master', 'view_dept_master'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsDept = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsDept);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }
  
  //Display Name  add view delte code for department master-------
  getDisplayNameDept(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_dept_master':
        return 'Add';
      case 'change_dept_master':
        return 'Edit';
      case 'delete_dept_master':
        return 'Delete';
      case 'view_dept_master':
        return 'View';
      default:
        return permissionCodename;
    }
  }


  // load permission for designation matser

  loadpermissionsDisgMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_desgntn_master', 'change_desgntn_master', 'delete_desgntn_master', 'view_desgntn_master'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsDis = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsDis);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


    //Display Name  add view delte code for department master-------
    getDisplayNameDesg(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_desgntn_master':
          return 'Add';
        case 'change_desgntn_master':
          return 'Edit';
        case 'delete_desgntn_master':
          return 'Delete';
        case 'view_desgntn_master':
          return 'View';
        default:
          return permissionCodename;
      }
    }

    //load permission for category master

  loadpermissionsCatgMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_ctgry_master', 'change_ctgry_master', 'delete_ctgry_master', 'view_ctgry_master'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsCat = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsCat);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for category master-------

   getDisplayNameCat(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_ctgry_master':
        return 'Add';
      case 'change_ctgry_master':
        return 'Edit';
      case 'delete_ctgry_master':
        return 'Delete';
      case 'view_ctgry_master':
        return 'View';
      default:
        return permissionCodename;
    }
  }


   //load permission for General request master

   loadpermissionsGenMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_generalrequest', 'change_generalrequest', 'delete_generalrequest', 'view_generalrequest'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsGen = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsGen);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


  //Display Name  add view delte code for General request master-------

   getDisplayNameGen(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_generalrequest':
        return 'Add';
      case 'change_generalrequest':
        return 'Edit';
      case 'delete_generalrequest':
        return 'Delete';
      case 'view_generalrequest':
        return 'View';
      default:
        return permissionCodename;
    }
  }

    //load permission for  request type master

    loadpermissionsReqtypeMaster(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

      console.log('schemastore', selectedSchema);
    
      if (selectedSchema) {
        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
          (result: any[]) => {
            // Specify the codenames you want to filter
            const requiredCodenames = ['add_requesttype', 'change_requesttype', 'delete_requesttype', 'view_requesttype'];
    
            // Filter and remove duplicates based on codename
            const uniquePermissionsMap = new Map();
            result.forEach(permission => {
              const codename = permission.codename.trim().toLowerCase();
              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                uniquePermissionsMap.set(codename, permission);
              }
            });
    
            // Convert map values to an array
            this.GrouppermissionsReqtype = Array.from(uniquePermissionsMap.values());
    
            console.log('Filtered Unique Permissions:', this.GrouppermissionsReqtype);
          },
          (error: any) => {
            console.error('Error fetching permissions:', error);
          }
        );
      }
    }
  
  
     //Display Name  add view delte code for category master-------
  
     getDisplayNameReqtype(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_requesttype':
          return 'Add';
        case 'change_requesttype':
          return 'Edit';
        case 'delete_requesttype':
          return 'Delete';
        case 'view_requesttype':
          return 'View';
        default:
          return permissionCodename;
      }
    }



      //load permission for General request master

   loadpermissionsAprMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_approval', 'change_approval', 'delete_approval', 'view_approval'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsApr = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsApr);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for General request master-------

   getDisplayNameApr(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_approval':
        return 'Add';
      case 'change_approval':
        return 'Edit';
      case 'delete_approval':
        return 'Delete';
      case 'view_approval':
        return 'View';
      default:
        return permissionCodename;
    }
  }


      //load permission for General request master

      loadpermissionsAprlvlMaster(): void {
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

        console.log('schemastore', selectedSchema);
      
        if (selectedSchema) {
          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
            (result: any[]) => {
              // Specify the codenames you want to filter
              const requiredCodenames = ['add_approvallevel', 'change_approvallevel', 'delete_approvallevel', 'view_approvallevel'];
      
              // Filter and remove duplicates based on codename
              const uniquePermissionsMap = new Map();
              result.forEach(permission => {
                const codename = permission.codename.trim().toLowerCase();
                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                  uniquePermissionsMap.set(codename, permission);
                }
              });
      
              // Convert map values to an array
              this.GrouppermissionsAprlvl = Array.from(uniquePermissionsMap.values());
      
              console.log('Filtered Unique Permissions:', this.GrouppermissionsAprlvl);
            },
            (error: any) => {
              console.error('Error fetching permissions:', error);
            }
          );
        }
      }
    
    
       //Display Name  add view delte code for General request master-------
    
       getDisplayNameAprlvl(permissionCodename: string): string {
        switch (permissionCodename.trim().toLowerCase()) {
          case 'add_approvallevel':
            return 'Add';
          case 'change_approvallevel':
            return 'Edit';
          case 'delete_approvallevel':
            return 'Delete';
          case 'view_approvallevel':
            return 'View';
          default:
            return permissionCodename;
        }
      }


      
      loadpermissionsGenReqEscMaster(): void {
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

        console.log('schemastore', selectedSchema);
      
        if (selectedSchema) {
          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
            (result: any[]) => {
              // Specify the codenames you want to filter
              const requiredCodenames = ['add_genrl_escalation', 
                                        'change_genrl_escalation', 
                                        'delete_genrl_escalation', 
                                        'view_genrl_escalation'];
      
              // Filter and remove duplicates based on codename
              const uniquePermissionsMap = new Map();
              result.forEach(permission => {
                const codename = permission.codename.trim().toLowerCase();
                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                  uniquePermissionsMap.set(codename, permission);
                }
              });
      
              // Convert map values to an array
              this.GrouppermissionsGenReqEsc = Array.from(uniquePermissionsMap.values());
      
              console.log('Filtered Unique Permissions:', this.GrouppermissionsGenReqEsc);
            },
            (error: any) => {
              console.error('Error fetching permissions:', error);
            }
          );
        }
      }
    
    
       //Display Name  add view delte code for General request master-------
    
       getDisplayNameGenReqEsc(permissionCodename: string): string {
        switch (permissionCodename.trim().toLowerCase()) {
          case 'add_genrl_escalation':
            return 'Add';
          case 'change_genrl_escalation':
            return 'Edit';
          case 'delete_genrl_escalation':
            return 'Delete';
          case 'view_genrl_escalation':
            return 'View';
          default:
            return permissionCodename;
        }
      }
    

         //load permission for General request master

   loadpermissionsAtdMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_attendance', 'change_attendance', 'delete_attendance', 'view_attendance'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsAtd = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsAtd);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for General request master-------

   getDisplayNameAtd(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_attendance':
        return 'Add';
      case 'change_attendance':
        return 'Edit';
      case 'delete_attendance':
        return 'Delete';
      case 'view_attendance':
        return 'View';
      default:
        return permissionCodename;
    }
  }



   //load permission for Salary Master master

 loadpermissionsExpDocument(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_notification', 'change_notification', 'delete_notification', 'view_notification'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsExpDocument = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsExpDocument);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
  }
        
        
           //Display Name  add view delte code for General request master-------
        
           getDisplayNameExpDocument(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_notification':
                return 'Add';
              case 'change_notification':
                return 'Edit';
              case 'delete_notification':
                return 'Delete';
              case 'view_notification':
                return 'View';
              default:
                return permissionCodename;
            }
          }
        



        loadpermissionsEmpAprList(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_resignationapproval', 'change_resignationapproval', 'delete_resignationapproval', 'view_resignationapproval'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsEmpAprList = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsEmpAprList);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
           //Display Name  add view delte code for Employee Approval List -------
        
           getDisplayNameEmpAprList(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_resignationapproval':
                return 'Add';
              case 'change_resignationapproval':
                return 'Edit';
              case 'delete_resignationapproval':
                return 'Delete';
              case 'view_resignationapproval':
                return 'View';
              default:
                return permissionCodename;
            }
          }




          
loadpermissionsEmpRegAprList(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        
        // Required permission codenames
        const requiredCodenames = [
          'add_create_eos_for_resignation',
          'view_approved_resignations',
        ];

        // Filter and remove duplicates using Map
        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Desired display order
        const displayOrder = [
          'add_create_eos_for_resignation',
          'view_approved_resignations',
        ];

        // Convert & SORT, store directly in the array used by HTML
        this.GrouppermissionsEmpRegAprList = Array.from(uniquePermissionsMap.values())
          .sort((a, b) => {
            return (
              displayOrder.indexOf(a.codename.trim().toLowerCase()) -
              displayOrder.indexOf(b.codename.trim().toLowerCase())
            );
          });

        console.log('Filtered & Sorted Permissions:', this.GrouppermissionsEmpRegAprList);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
}

        
        
           //Display Name  add view delte code for Employee Resignation Approval List -------
        
           getDisplayNameEmpregAprList(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'view_approved_resignations':
                return 'View';
              case 'add_create_eos_for_resignation':
                return 'Add';
              // case 'change_resignationapproval':
              //   return 'Edit';
              // case 'delete_resignationapproval':
              //   return 'Delete';
              default:
                return permissionCodename;
            }
          }


loadpermissionsEndofSer(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
   console.log('schemastore', selectedSchema);
          
   if (selectedSchema) {
  this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
  (result: any[]) => {
                  // Specify the codenames you want to filter
   const requiredCodenames = ['add_endofservice', 'change_endofservice', 'delete_endofservice', 'view_endofservice'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsEndofSer = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsEndofSer);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
//Display Name  add view delte code for Employee End Of Service -------
        
getDisplayNameEndofSer(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_endofservice':
                return 'Add';
              case 'change_endofservice':
                return 'Edit';
              case 'delete_endofservice':
                return 'Delete';
              case 'view_endofservice':
                return 'View';
              default:
                return permissionCodename;
            }
          }


          
loadpermissionsregReq(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
   console.log('schemastore', selectedSchema);
          
   if (selectedSchema) {
  this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
  (result: any[]) => {
                  // Specify the codenames you want to filter
 const requiredCodenames = ['add_employeeresignation', 'change_employeeresignation', 'delete_employeeresignation', 'view_employeeresignation'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsRegReq = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsRegReq);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
//Display Name  add view delte code for Employee Resignation request -------
        
getDisplayNameRegReq(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_employeeresignation':
                return 'Add';
              case 'change_employeeresignation':
                return 'Edit';
              case 'delete_employeeresignation':
                return 'Delete';
              case 'view_employeeresignation':
                return 'View';
              default:
                return permissionCodename;
            }
          }

          
loadpermissionsRegAprlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
   console.log('schemastore', selectedSchema);
          
   if (selectedSchema) {
  this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
  (result: any[]) => {
                  // Specify the codenames you want to filter
 const requiredCodenames = ['add_resignationapprovallevel',
                            'change_resignationapprovallevel',
                            'delete_resignationapprovallevel',
                            'view_resignationapprovallevel'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsRegAprlvl = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsRegAprlvl);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
//Display Name  add view delte code for Employee Resignation Approval Level -------
        
getDisplayNameRegAprlvl(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_resignationapprovallevel':
                return 'Add';
              case 'change_resignationapprovallevel':
                return 'Edit';
              case 'delete_resignationapprovallevel':
                return 'Delete';
              case 'view_resignationapprovallevel':
                return 'View';
              default:
                return permissionCodename;
            }
          }
        
        

          
loadpermissionsGratuity(): void {
  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
   console.log('schemastore', selectedSchema);
          
   if (selectedSchema) {
  this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
  (result: any[]) => {
                  // Specify the codenames you want to filter
 const requiredCodenames = ['add_gratuitytable', 'change_gratuitytable', 'delete_gratuitytable', 'view_gratuitytable'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsGratuity = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsGratuity);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
//Display Name  add view delte code for Employee Resignation Approval Level -------
        
getDisplayNameGratuity(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_gratuitytable':
                return 'Add';
              case 'change_gratuitytable':
                return 'Edit';
              case 'delete_gratuitytable':
                return 'Delete';
              case 'view_gratuitytable':
                return 'View';
              default:
                return permissionCodename;
            }
          }
        
      

// load permission for company master---------



  loadpermissionsCmpMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_company', 'change_company', 'delete_company', 'view_company'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsCmp = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsCmp);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }
  

     //Display Name  add view delte code for category master-------

     getDisplayNameCmp(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_company':
          return 'Add';
        case 'change_company':
          return 'Edit';
        case 'delete_company':
          return 'Delete';
        case 'view_company':
          return 'View';
        default:
          return permissionCodename;
      }
    }
  

    
//load permission for branch master------------

  loadpermissionsBranchMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_brnch_mstr', 'change_brnch_mstr', 'delete_brnch_mstr', 'view_brnch_mstr'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsBrch = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsBrch);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


     //Display Name  add view delte code for Branch master-------

     getDisplayNameBranch(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_brnch_mstr':
          return 'Add';
        case 'change_brnch_mstr':
          return 'Edit';
        case 'delete_brnch_mstr':
          return 'Delete';
        case 'view_brnch_mstr':
          return 'View';
        default:
          return permissionCodename;
      }
    }

 
 //load permission for user master----------
    loadpermissionsUserMaster(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

      console.log('schemastore', selectedSchema);
    
      if (selectedSchema) {
        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
          (result: any[]) => {
            // Specify the codenames you want to filter
            const requiredCodenames = ['add_customuser', 'change_customuser', 'delete_customuser', 'view_customuser'];
    
            // Filter and remove duplicates based on codename
            const uniquePermissionsMap = new Map();
            result.forEach(permission => {
              const codename = permission.codename.trim().toLowerCase();
              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                uniquePermissionsMap.set(codename, permission);
              }
            });
    
            // Convert map values to an array
            this.GrouppermissionsUser = Array.from(uniquePermissionsMap.values());
    
            console.log('Filtered Unique Permissions:', this.GrouppermissionsUser);
          },
          (error: any) => {
            console.error('Error fetching permissions:', error);
          }
        );
      }
  }


    //Display Name  add view delte code for user master-------

    getDisplayNameUser(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_customuser':
          return 'Add';
        case 'change_customuser':
          return 'Edit';
        case 'delete_customuser':
          return 'Delete';
        case 'view_customuser':
          return 'View';
        default:
          return permissionCodename;
      }
    }


  //load permisssion for group master-------
  loadpermissionsUserGroupMaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_group', 'change_group', 'delete_group', 'view_group'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsUsergroup = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsUsergroup);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for group master-------

   getDisplayNameUserGroup(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_group':
        return 'Add';
      case 'change_group':
        return 'Edit';
      case 'delete_group':
        return 'Delete';
      case 'view_group':
        return 'View';
      default:
        return permissionCodename;
    }
  }


//load permission for assigned permission for user---------
  loadpermissionsassigneduser(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_permission', 'change_permission', 'delete_permission', 'view_permission'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsassigneddUser = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsassigneddUser);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for User assigned permission master-------

   getDisplayNameUserPermission(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_permission':
        return 'Add';
      case 'change_permission':
        return 'Edit';
      case 'delete_permission':
        return 'Delete';
      case 'view_permission':
        return 'View';
      default:
        return permissionCodename;
    }
  }


  //load permission for state master----------------
  loadpermissionsstatemaster(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_state_mstr', 'change_state_mstr', 'delete_state_mstr', 'view_state_mstr'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissionsstateMaster = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissionsstateMaster);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }


   //Display Name  add view delte code for state master-------

   getDisplayNameState(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_state_mstr':
        return 'Add';
      case 'change_state_mstr':
        return 'Edit';
      case 'delete_state_mstr':
        return 'Delete';
      case 'view_state_mstr':
        return 'View';
      default:
        return permissionCodename;
    }
  }



  //load permission for document type master-----------
  loadpermissionsdocumnettype(): void {
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        // Specify the codenames you want to filter
        const requiredCodenames = ['add_document_type', 'change_document_type', 'delete_document_type', 'view_document_type'];

        // Filter and remove duplicates based on codename
        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Convert map values to an array
        this.Grouppermissionsdocumentype = Array.from(uniquePermissionsMap.values());

        console.log('Filtered Unique Permissions:', this.Grouppermissionsdocumentype);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
  }

   //Display Name  add view delte code for Document type master-------

   getDisplayNameDocType(permissionCodename: string): string {
    switch (permissionCodename.trim().toLowerCase()) {
      case 'add_document_type':
        return 'Add';
      case 'change_document_type':
        return 'Edit';
      case 'delete_document_type':
        return 'Delete';
      case 'view_document_type':
        return 'View';
      default:
        return permissionCodename;
    }
  }
  

//l

  // load permission for company master-----------

 
  
    loadpermissionlocationmaster(): void {
      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

      console.log('schemastore', selectedSchema);
    
      if (selectedSchema) {
        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
          (result: any[]) => {
            // Specify the codenames you want to filter
            const requiredCodenames = ['add_company', 'change_company', 'delete_company', 'view_company'];
    
            // Filter and remove duplicates based on codename
            const uniquePermissionsMap = new Map();
            result.forEach(permission => {
              const codename = permission.codename.trim().toLowerCase();
              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                uniquePermissionsMap.set(codename, permission);
              }
            });
    
            // Convert map values to an array
            this.GrouppermissionslocationMaster = Array.from(uniquePermissionsMap.values());
    
            console.log('Filtered Unique Permissions:', this.GrouppermissionslocationMaster);
          },
          (error: any) => {
            console.error('Error fetching permissions:', error);
          }
        );
      }
    }
  
      //Display Name  add view delte code for Company master-------
  
      getDisplayNameCompany(permissionCodename: string): string {
        switch (permissionCodename.trim().toLowerCase()) {
          case 'add_company':
            return 'Add';
          case 'change_company':
            return 'Edit';
          case 'delete_company':
            return 'Delete';
          case 'view_company':
            return 'View';
          default:
            return permissionCodename;
        }
      }

      loadpermissionDnmaster(): void {
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

        console.log('schemastore', selectedSchema);
      
        if (selectedSchema) {
          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
            (result: any[]) => {
              // Specify the codenames you want to filter
              const requiredCodenames = ['add_documentnumbering', 'change_documentnumbering', 'delete_documentnumbering', 'view_documentnumbering'];
      
              // Filter and remove duplicates based on codename
              const uniquePermissionsMap = new Map();
              result.forEach(permission => {
                const codename = permission.codename.trim().toLowerCase();
                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                  uniquePermissionsMap.set(codename, permission);
                }
              });
      
              // Convert map values to an array
              this.GrouppermissionsDnMaster = Array.from(uniquePermissionsMap.values());
      
              console.log('Filtered Unique Permissions:', this.GrouppermissionsDnMaster);
            },
            (error: any) => {
              console.error('Error fetching permissions:', error);
            }
          );
        }
      }
    
        //Display Name  add view delte code for Company master-------
    
        getDisplayNameDn(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_documentnumbering':
              return 'Add';
            case 'change_documentnumbering':
              return 'Edit';
            case 'delete_documentnumbering':
              return 'Delete';
            case 'view_documentnumbering':
              return 'View';
            default:
              return permissionCodename;
          }
        }

        loadpermissionCpmaster(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_companypolicy', 'change_companypolicy', 'delete_companypolicy', 'view_companypolicy'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsCpMaster = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsCpMaster);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
        }
      
          //Display Name  add view delte code for Company master-------
      
          getDisplayNameCp(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_companypolicy':
                return 'Add';
              case 'change_companypolicy':
                return 'Edit';
              case 'delete_companypolicy':
                return 'Delete';
              case 'view_companypolicy':
                return 'View';
              default:
                return permissionCodename;
            }
          }



      loadpermissionConfig(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_emailconfiguration',
                                        'change_emailconfiguration',
                                        'delete_emailconfiguration', 
                                         'view_emailconfiguration'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsConfigMaster = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsConfigMaster);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
        }
      
          //Display Name  add view delte code for Email Configuration-------
      
       getDisplayNameConfig(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_emailconfiguration':
                return 'Add';
              case 'change_emailconfiguration':
                return 'Edit';
              case 'delete_emailconfiguration':
                return 'Delete';
              case 'view_emailconfiguration':
                return 'View';
              default:
                return permissionCodename;
            }
          }


      loadpermissionAnnouncement(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_announcement',
                                        'change_announcement',
                                        'delete_announcement', 
                                         'view_announcement'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsAnnounceMaster = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsAnnounceMaster);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
        }
      
          //Display Name  add view delte code for Announcement-------
      
       getDisplayNameAnnounce(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_announcement':
                return 'Add';
              case 'change_announcement':
                return 'Edit';
              case 'delete_announcement':
                return 'Delete';
              case 'view_announcement':
                return 'View';
              default:
                return permissionCodename;
            }
          }


  loadpermissionNotification(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_notificationsettings',
                                        'change_notificationsettings',
                                        'delete_notificationsettings', 
                                         'view_notificationsettings'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsNotify = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsNotify);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
        }
      
          //Display Name  add view delte code for Announcement-------
      
       getDisplayNameNotify(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_notificationsettings':
                return 'Add';
              case 'change_notificationsettings':
                return 'Edit';
              case 'delete_notificationsettings':
                return 'Delete';
              case 'view_notificationsettings':
                return 'View';
              default:
                return permissionCodename;
            }
          }


loadpermissionsEmpReport(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {

        const requiredCodenames = [
          'add_report',
          'change_report',
          'delete_report',
          'view_report',
          'export_report'
        ];

        const uniquePermissionsMap = new Map();

        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Define your sort order
        const displayOrder = [
          'add_report',
          'change_report',
          'delete_report',
          'view_report',
          'export_report'
        ];

        // Convert & sort
        this.GrouppermissionsemployeeReport = Array.from(uniquePermissionsMap.values())
          .sort((a, b) => {
            return (
              displayOrder.indexOf(a.codename.trim().toLowerCase()) -
              displayOrder.indexOf(b.codename.trim().toLowerCase())
            );
          });

        console.log('Sorted Permissions:', this.GrouppermissionsemployeeReport);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
}

    
        //Display Name  add view delte code for Company master-------
    
        getDisplayNameEmpReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
          case 'add_report':
              return 'Add';
            case 'change_report':
              return 'Edit';
            case 'delete_report':
              return 'Delete';
              case 'view_report':
                return 'View';
              case 'export_report':
              return 'Export';
            default:
              return permissionCodename;
          }
        }
      
        loadpermissionsDocReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_doc_report',
                                         'change_doc_report', 
                                          'delete_doc_report',
                                          'export_document_report',
                                           'view_doc_report'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsdocumnetReport = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsdocumnetReport);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
        //Display Name  add view delte code for Company master-------
    
        getDisplayNameDocReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_doc_report':
              return 'Add';
            case 'change_doc_report':
              return 'Edit';
            case 'delete_doc_report':
              return 'Delete';
            case 'export_document_report':
              return 'Export';
              case 'view_doc_report':
                return 'View';
            default:
              return permissionCodename;
          }
        }



        loadpermissionsGenReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        // Specify the codenames you want to filter
        const requiredCodenames = ['add_generalrequestreport',
                                 'change_generalrequestreport',
                                  'delete_generalrequestreport',
                                  'export_general_request_report',
                                  'view_generalrequestreport'];

        // Filter and remove duplicates based on codename
        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Convert map values to an array
        this.GrouppermissiionsgeneralReport = Array.from(uniquePermissionsMap.values());

        console.log('Filtered Unique Permissions:', this.GrouppermissiionsgeneralReport);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
        }


      
          //Display Name  add view delte code for Company master-------
      
          getDisplayNameGenReport(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_generalrequestreport':
                return 'Add';
              case 'change_generalrequestreport':
                return 'Edit';
              case 'delete_generalrequestreport':
                return 'Delete';
              case 'export_general_request_report':
                return 'Export';
                case 'view_generalrequestreport':
                  return 'View';
              default:
                return permissionCodename;
            }
          }


          loadpermissionsLeaveReport(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_leavereport', 'change_leavereport', 'delete_leavereport', 'lv_export_report','view_leavereport'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissiionsLeaveReport = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissiionsLeaveReport);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
          }

        
            //Display Name  add view delte code for Company master-------
        
            getDisplayNameLeaveReport(permissionCodename: string): string {
              switch (permissionCodename.trim().toLowerCase()) {
                case 'add_leavereport':
                  return 'Add';
                case 'change_leavereport':
                  return 'Edit';
                case 'delete_leavereport':
                  return 'Delete';
                case 'lv_export_report':
                  return 'Export';
                  case 'view_leavereport':
                    return 'View';
                default:
                  return permissionCodename;
              }
            }


  loadpermissionsLeaveAprReport(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_leaveapprovalreport',
                                  'change_leaveapprovalreport',
                                  'delete_leaveapprovalreport',
                                      'lv_approval_export_report',
                                    'view_leaveapprovalreport'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.GrouppermissiionsLeaveAprRep = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.GrouppermissiionsLeaveAprRep);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
          }

        
            //Display Name  add view delte code for Leave Approval request-------
        
   getDisplayNameLeaveAprRep(permissionCodename: string): string {
              switch (permissionCodename.trim().toLowerCase()) {
                case 'add_leaveapprovalreport':
                  return 'Add';
                case 'change_leaveapprovalreport':
                  return 'Edit';
                case 'delete_leaveapprovalreport':
                  return 'Delete';
                case 'lv_approval_export_report':
                  return 'Export';
                case 'view_leaveapprovalreport':
                    return 'View';

                default:
                  return permissionCodename;
              }
            }


    loadpermissionsLeaveBalReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_lvbalancereport',
                                         'change_lvbalancereport', 
                                          'delete_lvbalancereport',
                                          'lv_balance_export_report',
                                           'view_lvbalancereport'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsLeaveBalReport = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveBalReport);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
        //Display Name  add view delte code for Leave balance Report-------
    
    getDisplayNameLeaveBalReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_lvbalancereport':
              return 'Add';
            case 'change_lvbalancereport':
              return 'Edit';
            case 'delete_lvbalancereport':
              return 'Delete';
            case 'lv_balance_export_report':
              return 'Export';
              case 'view_lvbalancereport':
                return 'View';
            default:
              return permissionCodename;
          }
        }




    loadpermissionsAttendReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_attendancereport',
                                         'change_attendancereport', 
                                          'delete_attendancereport',
                                          'attendance_export_report',
                                           'view_attendancereport'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsAttendReport = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsAttendReport);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
    //Display Name  add view delte code for Attendance Report-------
    
    getDisplayNameAttendReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_attendancereport':
              return 'Add';
            case 'change_attendancereport':
              return 'Edit';
            case 'delete_attendancereport':
              return 'Delete';
            case 'attendance_export_report':
              return 'Export';
              case 'view_attendancereport':
                return 'View';
            default:
              return permissionCodename;
          }
        }




  loadpermissionsAssetReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_assetreport',
                                         'change_assetreport', 
                                          'delete_assetreport',
                                          'asset_export_report',
                                           'view_assetreport'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsAssetReport = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsAssetReport);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
    //Display Name  add view delte code for Asset Report-------
    
    getDisplayNameAssetReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_assetreport':
              return 'Add';
            case 'change_assetreport':
              return 'Edit';
            case 'delete_assetreport':
              return 'Delete';
            case 'asset_export_report':
              return 'Export';
              case 'view_assetreport':
                return 'View';
            default:
              return permissionCodename;
          }
        }


   loadpermissionsAssetTransReport(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_assettransactionreport',
                                         'change_assettransactionreport', 
                                          'delete_assettransactionreport',
                                          'asset_transaction_export_report',
                                           'view_assettransactionreport'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsAssetTransReport = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsAssetTransReport);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
    //Display Name  add view delte code for Asset Transation Report-------
    
    getDisplayNameAssetTransReport(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_assettransactionreport':
              return 'Add';
            case 'change_assettransactionreport':
              return 'Edit';
            case 'delete_assettransactionreport':
              return 'Delete';
            case 'asset_transaction_export_report':
              return 'Export';
              case 'view_assettransactionreport':
                return 'View';
            default:
              return permissionCodename;
          }
        }
  

       loadpermissionsDeptReport(): void {
              const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
      console.log('schemastore', selectedSchema);
    
      if (selectedSchema) {
        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
          (result: any[]) => {
            // Specify the codenames you want to filter
            const requiredCodenames = [ // 'add_leavereport',
                                      // 'change_leavereport',
                                      //  'delete_dept_report', 
                                       'export_dept_report',
                                       'view_dept_report'];
    
            // Filter and remove duplicates based on codename
            const uniquePermissionsMap = new Map();
            result.forEach(permission => {
              const codename = permission.codename.trim().toLowerCase();
              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                uniquePermissionsMap.set(codename, permission);
              }
            });
    
            // Convert map values to an array
            this.GrouppermissiionsDeptReport = Array.from(uniquePermissionsMap.values());
    
            console.log('Filtered Unique Permissions:', this.GrouppermissiionsDeptReport);
          },
          (error: any) => {
            console.error('Error fetching permissions:', error);
          }
        );
      }
            }
  
          
              //Display Name  add view delte code for Company master-------
          
              getDisplayNameDeptReport(permissionCodename: string): string {
                switch (permissionCodename.trim().toLowerCase()) {
                  // case 'add_deptreport':
                  //   return 'Add';
                  // case 'change_deptreport':
                  //   return 'Edit';
                  // case 'delete_dept_report':
                  //   return 'Delete';
                  case 'export_dept_report':
                    return 'Export';
                    case 'view_dept_report':
                      return 'View';
                  default:
                    return permissionCodename;
                }
              }
    
     loadpermissionsDesReport(): void {
           const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
      
        console.log('schemastore', selectedSchema);
      
        if (selectedSchema) {
          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
            (result: any[]) => {
              // Specify the codenames you want to filter
              const requiredCodenames = [
                // 'add_leavereport',
                //  'change_leavereport',
                  // 'delete_designtn_report', 
                  'export_designtn_report',
                  'view_designtn_report'];
      
              // Filter and remove duplicates based on codename
              const uniquePermissionsMap = new Map();
              result.forEach(permission => {
                const codename = permission.codename.trim().toLowerCase();
                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                  uniquePermissionsMap.set(codename, permission);
                }
              });
      
              // Convert map values to an array
              this.GrouppermissiionsDesReport = Array.from(uniquePermissionsMap.values());
      
              console.log('Filtered Unique Permissions:', this.GrouppermissiionsDesReport);
            },
            (error: any) => {
              console.error('Error fetching permissions:', error);
            }
          );
        }
              }
    
            
                //Display Name  add view delte code for Company master-------
            
                getDisplayNameDesReport(permissionCodename: string): string {
                  switch (permissionCodename.trim().toLowerCase()) {
                    // case 'add_designationreport':
                    //   return 'Add';
                    // case 'change_designationreport':
                    //   return 'Edit';
                    // case 'delete_designtn_report':
                    //   return 'Delete';
                    case 'export_designtn_report':
                      return 'Export';
                      case 'view_designtn_report':
                        return 'View';
                    default:
                      return permissionCodename;
                  }
                }   


 loadpermissionsEmpform(): void {

  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {

        const requiredCodenames = [
          'add_emp_customfield',
          'change_emp_customfield',
          'delete_emp_customfield',
          'view_emp_customfield',
        ];

        const uniquePermissionsMap = new Map();

        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Define your sort order
        const displayOrder = [
          'add_emp_customfield',
          'change_emp_customfield',
          'delete_emp_customfield',
          'view_emp_customfield',
        ];

        // Convert & sort
        this.GrouppermissionsEmpform = Array.from(uniquePermissionsMap.values())
          .sort((a, b) => {
            return (
              displayOrder.indexOf(a.codename.trim().toLowerCase()) -
              displayOrder.indexOf(b.codename.trim().toLowerCase())
            );
          });

        console.log('Sorted Permissions:', this.GrouppermissionsEmpform);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
}

    
        //Display Name  add view delte code for Company master-------
    
        getDisplayNameEmpform(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
          case 'add_emp_customfield':
              return 'Add';
            case 'change_emp_customfield':
              return 'Edit';
            case 'delete_emp_customfield':
              return 'Delete';
              case 'view_emp_customfield':
                return 'View';
            default:
              return permissionCodename;
          }
        }


 loadpermissionsAssetform(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_assetcustomfield',
                                         'change_assetcustomfield', 
                                          'delete_assetcustomfield',
                                          'view_assetcustomfield'];
                          
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsAssetform = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsAssetform);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
      }
    
        //Display Name  add view delte code for Company master-------
    
        getDisplayNameAssetform(permissionCodename: string): string {
          switch (permissionCodename.trim().toLowerCase()) {
            case 'add_assetcustomfield':
              return 'Add';
            case 'change_assetcustomfield':
              return 'Edit';
            case 'delete_assetcustomfield':
              return 'Delete';
              case 'view_assetcustomfield':
                return 'View';
            default:
              return permissionCodename;
          }
        }

        
          // loadpermissionsAddweekDetail
            loadpermissionsAddweekDetail(): void {
              const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

              console.log('schemastore', selectedSchema);
            
              if (selectedSchema) {
                this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                  (result: any[]) => {
                    // Specify the codenames you want to filter
                    const requiredCodenames = ['add_weekend_calendar', 'change_weekend_calendar', 'delete_weekend_calendar', 'view_weekend_calendar'];
            
                    // Filter and remove duplicates based on codename
                    const uniquePermissionsMap = new Map();
                    result.forEach(permission => {
                      const codename = permission.codename.trim().toLowerCase();
                      if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                        uniquePermissionsMap.set(codename, permission);
                      }
                    });
            
                    // Convert map values to an array
                    this.Grouppermissionsaddweek = Array.from(uniquePermissionsMap.values());
            
                    console.log('Filtered Unique Permissions:', this.Grouppermissionsaddweek);
                  },
                  (error: any) => {
                    console.error('Error fetching permissions:', error);
                  }
                );
              }
            }
          
              //Display Name  add view delte code for Company master-------
          
              getDisplayNameAddWeek(permissionCodename: string): string {
                switch (permissionCodename.trim().toLowerCase()) {
                  case 'add_weekend_calendar':
                    return 'Add';
                  case 'change_weekend_calendar':
                    return 'Edit';
                  case 'delete_weekend_calendar':
                    return 'Delete';
                    case 'view_weekend_calendar':
                      return 'View';
                  default:
                    return permissionCodename;
                }
              }

              // loadpermissionsAssignweekDetail
              loadpermissionsAssignweekDetail(): void {
                const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

  console.log('schemastore', selectedSchema);

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        // Specify the codenames you want to filter
        const requiredCodenames = ['add_assign_weekend', 'change_assign_weekend', 'delete_assign_weekend', 'view_assign_weekend'];

        // Filter and remove duplicates based on codename
        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        // Convert map values to an array
        this.Grouppermisionsassignweek = Array.from(uniquePermissionsMap.values());

        console.log('Filtered Unique Permissions:', this.Grouppermisionsassignweek);
      },
      (error: any) => {
        console.error('Error fetching permissions:', error);
      }
    );
  }
              }
            
                //Display Name  add view delte code for Company master-------
            
                getDisplayNameAssignWeek(permissionCodename: string): string {
                  switch (permissionCodename.trim().toLowerCase()) {
                    case 'add_assign_weekend':
                      return 'Add';
                    case 'change_assign_weekend':
                      return 'Edit';
                    case 'delete_assign_weekend':
                      return 'Delete';
                      case 'view_assign_weekend':
                        return 'View';
                    default:
                      return permissionCodename;
                  }
                }
  
                // loadpermissionsAddholidayDetail

                loadpermissionsAddholidayDetail(): void {
                  const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                  console.log('schemastore', selectedSchema);
                
                  if (selectedSchema) {
                    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                      (result: any[]) => {
                        // Specify the codenames you want to filter
                        const requiredCodenames = ['add_holiday_calendar', 'change_holiday_calendar', 'delete_holiday_calendar', 'view_holiday_calendar'];
                
                        // Filter and remove duplicates based on codename
                        const uniquePermissionsMap = new Map();
                        result.forEach(permission => {
                          const codename = permission.codename.trim().toLowerCase();
                          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                            uniquePermissionsMap.set(codename, permission);
                          }
                        });
                
                        // Convert map values to an array
                        this.Grouppermissionsaddholiday = Array.from(uniquePermissionsMap.values());
                
                        console.log('Filtered Unique Permissions:', this.Grouppermissionsaddholiday);
                      },
                      (error: any) => {
                        console.error('Error fetching permissions:', error);
                      }
                    );
                  }
                }
              
                  //Display Name  add view delte code for Company master-------
              
                  getDisplayNameAddholiday(permissionCodename: string): string {
                    switch (permissionCodename.trim().toLowerCase()) {
                      case 'add_holiday_calendar':
                        return 'Add';
                      case 'change_holiday_calendar':
                        return 'Edit';
                      case 'delete_holiday_calendar':
                        return 'Delete';
                        case 'view_holiday_calendar':
                          return 'View';
                      default:
                        return permissionCodename;
                    }
                  }
                  // loadpermissionsAssignholidayDetail

                  loadpermissionsAssignholidayDetail(): void {
                    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                    console.log('schemastore', selectedSchema);
                  
                    if (selectedSchema) {
                      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                        (result: any[]) => {
                          // Specify the codenames you want to filter
                          const requiredCodenames = ['add_assign_holiday', 'change_assign_holiday', 'delete_assign_holiday', 'view_assign_holiday'];
                  
                          // Filter and remove duplicates based on codename
                          const uniquePermissionsMap = new Map();
                          result.forEach(permission => {
                            const codename = permission.codename.trim().toLowerCase();
                            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                              uniquePermissionsMap.set(codename, permission);
                            }
                          });
                  
                          // Convert map values to an array
                          this.Grouppermissionsassisgnholiday = Array.from(uniquePermissionsMap.values());
                  
                          console.log('Filtered Unique Permissions:', this.Grouppermissionsassisgnholiday);
                        },
                        (error: any) => {
                          console.error('Error fetching permissions:', error);
                        }
                      );
                    }
                  }
                
                    //Display Name  add view delte code for Company master-------
                
                    getDisplayNameAssignholidayDetail(permissionCodename: string): string {
                      switch (permissionCodename.trim().toLowerCase()) {
                        case 'add_assign_holiday':
                          return 'Add';
                        case 'change_assign_holiday':
                          return 'Edit';
                        case 'delete_assign_holiday':
                          return 'Delete';
                          case 'view_assign_holiday':
                            return 'View';
                        default:
                          return permissionCodename;
                      }
                    }


                      // Leave permisson fetching code here

    loadpermissionsLeaveaprv(): void {
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                      console.log('schemastore', selectedSchema);
                    
                      if (selectedSchema) {
                        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                          (result: any[]) => {
                            // Specify the codenames you want to filter
                            const requiredCodenames = ['add_leaveapproval', 'change_leaveapproval', 'delete_leaveapproval', 'view_leaveapproval'];
                    
                            // Filter and remove duplicates based on codename
                            const uniquePermissionsMap = new Map();
                            result.forEach(permission => {
                              const codename = permission.codename.trim().toLowerCase();
                              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                uniquePermissionsMap.set(codename, permission);
                              }
                            });
                    
                            // Convert map values to an array
                            this.GrouppermissionsLeaveaprv = Array.from(uniquePermissionsMap.values());
                    
                            console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveaprv);
                          },
                          (error: any) => {
                            console.error('Error fetching permissions:', error);
                          }
                        );
                      }
                    }
                  
                  
                      //Display Name add view delte code for emplotee master-------
                  
  getDisplayNameLeaveaprv(permissionCodename: string): string {
                        switch (permissionCodename.trim().toLowerCase()) {
                          case 'add_leaveapproval':
                            return 'Add';
                          case 'change_leaveapproval':
                            return 'Edit';
                          case 'delete_leaveapproval':
                            return 'Delete';
                          case 'view_leaveapproval':
                            return 'View';
                          default:
                            return permissionCodename;
                        }
                      }


                      
                    loadpermissionsLeavetype(): void {
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                      console.log('schemastore', selectedSchema);
                    
                      if (selectedSchema) {
                        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                          (result: any[]) => {
                            // Specify the codenames you want to filter
                            const requiredCodenames = ['add_leave_type', 'change_leave_type', 'delete_leave_type', 'view_leave_type'];
                    
                            // Filter and remove duplicates based on codename
                            const uniquePermissionsMap = new Map();
                            result.forEach(permission => {
                              const codename = permission.codename.trim().toLowerCase();
                              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                uniquePermissionsMap.set(codename, permission);
                              }
                            });
                    
                            // Convert map values to an array
                            this.GrouppermissionsLeavetype = Array.from(uniquePermissionsMap.values());
                    
                            console.log('Filtered Unique Permissions:', this.GrouppermissionsLeavetype);
                          },
                          (error: any) => {
                            console.error('Error fetching permissions:', error);
                          }
                        );
                      }
                    }
                  
                  
                      //Display Name add view delte code for emplotee master-------
                  
                      getDisplayNameLeavetype(permissionCodename: string): string {
                        switch (permissionCodename.trim().toLowerCase()) {
                          case 'add_leave_type':
                            return 'Add';
                          case 'change_leave_type':
                            return 'Edit';
                          case 'delete_leave_type':
                            return 'Delete';
                          case 'view_leave_type':
                            return 'View';
                          default:
                            return permissionCodename;
                        }
                      }

                loadpermissionsLeaveEscalation(): void {
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                      console.log('schemastore', selectedSchema);
                    
                      if (selectedSchema) {
                        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                          (result: any[]) => {
                            // Specify the codenames you want to filter
                            const requiredCodenames = ['add_leave_escalation', 'change_leave_escalation', 'delete_leave_escalation', 'view_leave_escalation'];
                    
                            // Filter and remove duplicates based on codename
                            const uniquePermissionsMap = new Map();
                            result.forEach(permission => {
                              const codename = permission.codename.trim().toLowerCase();
                              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                uniquePermissionsMap.set(codename, permission);
                              }
                            });
                    
                            // Convert map values to an array
                            this.GrouppermissionsLeaveEscalation = Array.from(uniquePermissionsMap.values());
                    
                            console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveEscalation);
                          },
                          (error: any) => {
                            console.error('Error fetching permissions:', error);
                          }
                        );
                      }
                    }
                  
                  
                      //Display Name add view delte code for emplotee master-------
                  
                      getDisplayNameLeaveEscalation(permissionCodename: string): string {
                        switch (permissionCodename.trim().toLowerCase()) {
                          case 'add_leave_escalation':
                            return 'Add';
                          case 'change_leave_escalation':
                            return 'Edit';
                          case 'delete_leave_escalation':
                            return 'Delete';
                          case 'view_leave_escalation':
                            return 'View';
                          default:
                            return permissionCodename;
                        }
                      }

                      loadpermissionsLeavemaster(): void {
                        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                        console.log('schemastore', selectedSchema);
                      
                        if (selectedSchema) {
                          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                            (result: any[]) => {
                              // Specify the codenames you want to filter
                              const requiredCodenames = ['add_leave_entitlement', 'change_leave_entitlement', 'delete_leave_entitlement', 'view_leave_entitlement'];
                      
                              // Filter and remove duplicates based on codename
                              const uniquePermissionsMap = new Map();
                              result.forEach(permission => {
                                const codename = permission.codename.trim().toLowerCase();
                                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                  uniquePermissionsMap.set(codename, permission);
                                }
                              });
                      
                              // Convert map values to an array
                              this.GrouppermissionsLeavemaster = Array.from(uniquePermissionsMap.values());
                      
                              console.log('Filtered Unique Permissions:', this.GrouppermissionsLeavemaster);
                            },
                            (error: any) => {
                              console.error('Error fetching permissions:', error);
                            }
                          );
                        }
                      }
                    
                    
                        //Display Name add view delte code for emplotee master-------
                    
                        getDisplayNameLeavemaster(permissionCodename: string): string {
                          switch (permissionCodename.trim().toLowerCase()) {
                            case 'add_leave_entitlement':
                              return 'Add';
                            case 'change_leave_entitlement':
                              return 'Edit';
                            case 'delete_leave_entitlement':
                              return 'Delete';
                            case 'view_leave_entitlement':
                              return 'View';
                            default:
                              return permissionCodename;
                          }
                        }

                        loadpermissionsLeavereq(): void {
                          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                          console.log('schemastore', selectedSchema);
                        
                          if (selectedSchema) {
                            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                              (result: any[]) => {
                                // Specify the codenames you want to filter
                                const requiredCodenames = ['add_employee_leave_request', 'change_employee_leave_request', 'delete_employee_leave_request', 'view_employee_leave_request'];
                        
                                // Filter and remove duplicates based on codename
                                const uniquePermissionsMap = new Map();
                                result.forEach(permission => {
                                  const codename = permission.codename.trim().toLowerCase();
                                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                    uniquePermissionsMap.set(codename, permission);
                                  }
                                });
                        
                                // Convert map values to an array
                                this.GrouppermissionsLeavereq = Array.from(uniquePermissionsMap.values());
                        
                                console.log('Filtered Unique Permissions:', this.GrouppermissionsLeavereq);
                              },
                              (error: any) => {
                                console.error('Error fetching permissions:', error);
                              }
                            );
                          }
                        }
                      
                          //Display Name add view delte code for emplotee master-------
                      
                          getDisplayNameLeavereq(permissionCodename: string): string {
                            switch (permissionCodename.trim().toLowerCase()) {
                              case 'add_employee_leave_request':
                                return 'Add';
                              case 'change_employee_leave_request':
                                return 'Edit';
                              case 'delete_employee_leave_request':
                                return 'Delete';
                              case 'view_employee_leave_request':
                                return 'View';
                              default:
                                return permissionCodename;
                            }
                          }

                          
                        loadpermissionsLeavecom(): void {
                          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                          console.log('schemastore', selectedSchema);
                        
                          if (selectedSchema) {
                            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                              (result: any[]) => {
                                // Specify the codenames you want to filter
                                const requiredCodenames = ['add_compensatoryleavetransaction', 'change_compensatoryleavetransaction', 'delete_compensatoryleavetransaction', 'view_compensatoryleavetransaction'];
                        
                                // Filter and remove duplicates based on codename
                                const uniquePermissionsMap = new Map();
                                result.forEach(permission => {
                                  const codename = permission.codename.trim().toLowerCase();
                                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                    uniquePermissionsMap.set(codename, permission);
                                  }
                                });
                        
                                // Convert map values to an array
                                this.GrouppermissionsLeavecom = Array.from(uniquePermissionsMap.values());
                        
                                console.log('Filtered Unique Permissions:', this.GrouppermissionsLeavecom);
                              },
                              (error: any) => {
                                console.error('Error fetching permissions:', error);
                              }
                            );
                          }
                        }
                      
                          //Display Name add view delte code for emplotee master-------
                      
                          getDisplayNameLeavecom(permissionCodename: string): string {
                            switch (permissionCodename.trim().toLowerCase()) {
                              case 'add_compensatoryleavetransaction':
                                return 'Add';
                              case 'change_compensatoryleavetransaction':
                                return 'Edit';
                              case 'delete_compensatoryleavetransaction':
                                return 'Delete';
                              case 'view_compensatoryleavetransaction':
                                return 'View';
                              default:
                                return permissionCodename;
                            }
                          }



                          loadpermissionsLeaveaprvlvl(): void {
                            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                            console.log('schemastore', selectedSchema);
                          
                            if (selectedSchema) {
                              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                (result: any[]) => {
                                  // Specify the codenames you want to filter
                                  const requiredCodenames = ['add_leaveapprovallevels', 'change_leaveapprovallevels', 'delete_leaveapprovallevels', 'view_leaveapprovallevels'];
                          
                                  // Filter and remove duplicates based on codename
                                  const uniquePermissionsMap = new Map();
                                  result.forEach(permission => {
                                    const codename = permission.codename.trim().toLowerCase();
                                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                      uniquePermissionsMap.set(codename, permission);
                                    }
                                  });
                          
                                  // Convert map values to an array
                                  this.GrouppermissionsLeaveaprvlvl = Array.from(uniquePermissionsMap.values());
                          
                                  console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveaprvlvl);
                                },
                                (error: any) => {
                                  console.error('Error fetching permissions:', error);
                                }
                              );
                            }
                          }
                        
                        
                            //Display Name add view delte code for emplotee master-------
                        
                            getDisplayNameLeaveaprvlvl(permissionCodename: string): string {
                              switch (permissionCodename.trim().toLowerCase()) {
                                case 'add_leaveapprovallevels':
                                  return 'Add';
                                case 'change_leaveapprovallevels':
                                  return 'Edit';
                                case 'delete_leaveapprovallevels':
                                  return 'Delete';
                                case 'view_leaveapprovallevels':
                                  return 'View';
                                default:
                                  return permissionCodename;
                              }
                            }

              loadpermissionsLeaveBalance(): void {
                            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                            console.log('schemastore', selectedSchema);
                          
                            if (selectedSchema) {
                              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                (result: any[]) => {
                                  // Specify the codenames you want to filter
                                  const requiredCodenames = ['add_emp_leave_balance',
                                                           'change_emp_leave_balance',
                                                            'delete_emp_leave_balance',
                                                            'view_emp_leave_balance'];
                          
                                  // Filter and remove duplicates based on codename
                                  const uniquePermissionsMap = new Map();
                                  result.forEach(permission => {
                                    const codename = permission.codename.trim().toLowerCase();
                                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                      uniquePermissionsMap.set(codename, permission);
                                    }
                                  });
                          
                                  // Convert map values to an array
                                  this.GrouppermissionsLeaveBalance = Array.from(uniquePermissionsMap.values());
                          
                                  console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveBalance);
                                },
                                (error: any) => {
                                  console.error('Error fetching permissions:', error);
                                }
                              );
                            }
                          }
                        
                        
                            //Display Name add view delte code for Leave balance-------
                        
                getDisplayNameLeaveBalance(permissionCodename: string): string {
                              switch (permissionCodename.trim().toLowerCase()) {
                                case 'add_emp_leave_balance':
                                  return 'Add';
                                case 'change_emp_leave_balance':
                                  return 'Edit';
                                case 'delete_emp_leave_balance':
                                  return 'Delete';
                                case 'view_emp_leave_balance':
                                  return 'View';
                                default:
                                  return permissionCodename;
                              }
                            }



                  loadpermissionsLeaveCancel(): void {
                            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                            console.log('schemastore', selectedSchema);
                          
                            if (selectedSchema) {
                              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                (result: any[]) => {
                                  // Specify the codenames you want to filter
                                  const requiredCodenames = ['add_lv_cancellation',
                                                          //  'change_compensatoryleavebalance',
                                                          //   'delete_lv_cancellation',
                                                            'view_lv_cancellation'];
                          
                                  // Filter and remove duplicates based on codename
                                  const uniquePermissionsMap = new Map();
                                  result.forEach(permission => {
                                    const codename = permission.codename.trim().toLowerCase();
                                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                      uniquePermissionsMap.set(codename, permission);
                                    }
                                  });
                          
                                  // Convert map values to an array
                                  this.GrouppermissionsLeaveCancel = Array.from(uniquePermissionsMap.values());
                          
                                  console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveCancel);
                                },
                                (error: any) => {
                                  console.error('Error fetching permissions:', error);
                                }
                              );
                            }
                          }
                        
                        
                            //Display Name add view delte code for Leave balance-------
                        
                getDisplayNameLeaveCancel(permissionCodename: string): string {
                              switch (permissionCodename.trim().toLowerCase()) {
                                case 'add_lv_cancellation':
                                  return 'Add';
                                // case 'view_lv_cancellation':
                                //   return 'Edit';
                                // case 'delete_lv_cancellation':
                                //   return 'Delete';
                                case 'view_lv_cancellation':
                                  return 'View';
                                default:
                                  return permissionCodename;
                              }
                            }



                   loadpermissionsLeaveAccrual(): void {
                            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                            console.log('schemastore', selectedSchema);
                          
                            if (selectedSchema) {
                              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                (result: any[]) => {
                                  // Specify the codenames you want to filter
                                  const requiredCodenames = ['add_leave_accrual_transaction',
                                                            'change_leave_accrual_transaction',
                                                             'delete_leave_accrual_transaction',
                                                             'view_leave_accrual_transaction'];
                          
                                  // Filter and remove duplicates based on codename
                                  const uniquePermissionsMap = new Map();
                                  result.forEach(permission => {
                                    const codename = permission.codename.trim().toLowerCase();
                                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                      uniquePermissionsMap.set(codename, permission);
                                    }
                                  });
                          
                                  // Convert map values to an array
                                  this.GrouppermissionsLeaveAccrual = Array.from(uniquePermissionsMap.values());
                          
                                  console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveAccrual);
                                },
                                (error: any) => {
                                  console.error('Error fetching permissions:', error);
                                }
                              );
                            }
                          }
                        
                        
                            //Display Name add view delte code for Leave balance-------
                        
                getDisplayNameLeaveAccrual(permissionCodename: string): string {
                              switch (permissionCodename.trim().toLowerCase()) {
                                case 'add_leave_accrual_transaction':
                                  return 'Add';
                                case 'change_leave_accrual_transaction':
                                  return 'Edit';
                                case 'delete_leave_accrual_transaction':
                                  return 'Delete';
                                case 'view_leave_accrual_transaction':
                                  return 'View';
                                default:
                                  return permissionCodename;
                              }
                            }


             loadpermissionsLeaveRejoin(): void {
                            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                            console.log('schemastore', selectedSchema);
                          
                            if (selectedSchema) {
                              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                (result: any[]) => {
                                  // Specify the codenames you want to filter
                                  const requiredCodenames = ['add_employeerejoining', 
                                                              'change_employeerejoining', 
                                                                'delete_employeerejoining',
                                                                 'view_employeerejoining'];
                          
                                  // Filter and remove duplicates based on codename
                                  const uniquePermissionsMap = new Map();
                                  result.forEach(permission => {
                                    const codename = permission.codename.trim().toLowerCase();
                                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                      uniquePermissionsMap.set(codename, permission);
                                    }
                                  });
                          
                                  // Convert map values to an array
                                  this.GrouppermissionsLeaveRejoin = Array.from(uniquePermissionsMap.values());
                          
                                  console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveRejoin);
                                },
                                (error: any) => {
                                  console.error('Error fetching permissions:', error);
                                }
                              );
                            }
                          }
                        
                        
                            //Display Name add view delte code for Leave balance-------
                        
                getDisplayNameLeaveRejoin(permissionCodename: string): string {
                              switch (permissionCodename.trim().toLowerCase()) {
                                case 'add_employeerejoining':
                                  return 'Add';
                                case 'change_employeerejoining':
                                  return 'Edit';
                                case 'delete_employeerejoining':
                                  return 'Delete';
                                case 'view_employeerejoining':
                                  return 'View';
                                default:
                                  return permissionCodename;
                              }
                            }
      




// === Fetch Payroll permissions from backend ===
loadpermissionsPayrollrun(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_payrollrun',
          'change_payrollrun',
          'delete_payrollrun',
          'view_payrollrun'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsPayrollrun = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Payroll permissions:', error);
      }
    );
  }
}


// === Display readable names for Payroll permissions ===
getDisplayNamePayrollrun(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_payrollrun':
      return 'Add';
    case 'change_payrollrun':
      return 'Edit';
    case 'delete_payrollrun':
      return 'Delete';
    case 'view_payrollrun':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsSalarycomponent(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_salarycomponent',
          'change_salarycomponent',
          'delete_salarycomponent',
          'view_salarycomponent'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsSalarycomponent = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Salary Component permissions:', error);
      }
    );
  }
}


// === Display readable names for Payroll salarycomponent permissions ===
getDisplayNameSalarycomponent(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_salarycomponent':
      return 'Add';
    case 'change_salarycomponent':
      return 'Edit';
    case 'delete_salarycomponent':
      return 'Delete';
    case 'view_salarycomponent':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsPayslipAprv(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_payslipapproval',
          'change_payslipapproval',
          'delete_payslipapproval',
          'view_payslipapproval'
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsPayslipAprv = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Payslip Approval permissions:', error);
      }
    );
  }
}




// === Display readable names for Payroll Payslip Approval permissions ===
getDisplayNamePayslipAprv(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_payslipapproval':
      return 'Add';
    case 'change_payslipapproval':
      return 'Edit';
    case 'delete_payslipapproval':
      return 'Delete';
    case 'view_payslipapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}




loadpermissionsPayrollaprlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_payslipcommonworkflow',
          'change_payslipcommonworkflow',
          'delete_payslipcommonworkflow',
          'view_payslipcommonworkflow'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsPayrollaprlvl = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Payroll Approval Level permissions:', error);
      }
    );
  }
}



// === Display readable names for Payroll Approval level permissions ===
getDisplayNamePayrollaprlvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_payslipcommonworkflow':
      return 'Add';
    case 'change_payslipcommonworkflow':
      return 'Edit';
    case 'delete_payslipcommonworkflow':
      return 'Delete';
    case 'view_payslipcommonworkflow':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAdvanceSalaryAprvlst(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_advancesalaryapproval',
          'change_advancesalaryapproval',
          'delete_advancesalaryapproval',
          'view_advancesalaryapproval',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAdvanceSalaryAprvlst = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Advance Salary Approval list permissions:', error);
      }
    );
  }
}



// === Display readable names for Payroll Advance salary Approval permissions ===
getDisplayNameAdvanceSalaryAprvlst(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_advancesalaryapproval':
      return 'Add';
    case 'change_advancesalaryapproval':
      return 'Edit';
    case 'delete_advancesalaryapproval':
      return 'Delete';
    case 'view_advancesalaryapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAdvanceSalaryReq(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_advancesalaryrequest',
          'change_advancesalaryrequest',
          'delete_advancesalaryrequest',
          'view_advancesalaryrequest'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAdvanceSalaryReq = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Payroll Advance Salary Request permissions:', error);
      }
    );
  }
}


// === Display readable names for Payroll Advance salary Request permissions ===
getDisplayNameAdvanceSalaryReq(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_advancesalaryrequest':
      return 'Add';
    case 'change_advancesalaryrequest':
      return 'Edit';
    case 'delete_advancesalaryrequest':
      return 'Delete';
    case 'view_advancesalaryrequest':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAdvanceSalaryEscalation(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_advsalary_escalation',
          'change_advsalary_escalation',
          'delete_advsalary_escalation',
          'view_advsalary_escalation'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAdvanceSalaryEscalation = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Payroll Advance Salary Escalation permissions:', error);
      }
    );
  }
}


// === Display readable names for Payroll Advance salary Request permissions ===
getDisplayNameAdvanceSalaryEscalation(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_advsalary_escalation':
      return 'Add';
    case 'change_advsalary_escalation':
      return 'Edit';
    case 'delete_advsalary_escalation':
      return 'Delete';
    case 'view_advsalary_escalation':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAdvanceSalaryAprlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_advancecommonworkflow',
          'change_advancecommonworkflow',
          'delete_advancecommonworkflow',
          'view_advancecommonworkflow',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAdvanceSalaryAprlvl = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Advance Salary Approval level permissions:', error);
      }
    );
  }
}



// === Display readable names for Payroll Advance salary Approval level permissions ===
getDisplayNameAdvanceSalaryAprlvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_advancecommonworkflow':
      return 'Add';
    case 'change_advancecommonworkflow':
      return 'Edit';
    case 'delete_advancecommonworkflow':
      return 'Delete';
    case 'view_advancecommonworkflow':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsWps(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_wps',
           'export_wps',
            'view_wps',
          // 'change_wps',
          // 'delete_wps',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsWps = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Wps permissions:', error);
      }
    );
  }
}


// === Display readable names for Payroll Wps permissions ===
getDisplayNameWps(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_wps':
      return 'Add';
    case 'export_wps':
      return 'Export';
    case 'view_wps':
      return 'View';
    // case 'change_wps':
    //   return 'Edit';
    // case 'delete_wps':
    //   return 'Delete';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanApproval(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loanapproval',
          'change_loanapproval',
          'delete_loanapproval',
          'view_loanapproval',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanApproval = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Approval permissions:', error);
      }
    );
  }
}




// === Display readable names for Loan Approval permissions ===
getDisplayNameLoanApproval(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loanapproval':
      return 'Add';
    case 'change_loanapproval':
      return 'Edit';
    case 'delete_loanapproval':
      return 'Delete';
    case 'view_loanapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}




loadpermissionsLoanType(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loantype',
          'change_loantype',
          'delete_loantype',
          'view_loantype',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanType = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Type permissions:', error);
      }
    );
  }
}


// === Display readable names for Loan Type permissions ===
getDisplayNameLoanType(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loantype':
      return 'Add';
    case 'change_loantype':
      return 'Edit';
    case 'delete_loantype':
      return 'Delete';
    case 'view_loantype':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanRepay(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loanrepayment',
          'change_loanrepayment',
          'delete_loanrepayment',
          'view_loanrepayment',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanRepay = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Type permissions:', error);
      }
    );
  }
}


// === Display readable names for Loan Type permissions ===
getDisplayNameLoanRepay(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loanrepayment':
      return 'Add';
    case 'change_loanrepayment':
      return 'Edit';
    case 'delete_loanrepayment':
      return 'Delete';
    case 'view_loanrepayment':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanAprvlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loancommonworkflow',
          'change_loancommonworkflow',
          'delete_loancommonworkflow',
          'view_loancommonworkflow',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanAprvlvl = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Approval level permissions:', error);
      }
    );
  }
}

// === Display readable names for Loan Approval level permissions ===
getDisplayNameLoanAprvlvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loancommonworkflow':
      return 'Add';
    case 'change_loancommonworkflow':
      return 'Edit';
    case 'delete_loancommonworkflow':
      return 'Delete';
    case 'view_loancommonworkflow':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanEscalation(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loan_escalation',
          'change_loan_escalation',
          'delete_loan_escalation',
          'view_loan_escalation',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanEscalation = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Approval level permissions:', error);
      }
    );
  }
}

// === Display readable names for Loan Approval level permissions ===
getDisplayNameLoanEscalation(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loan_escalation':
      return 'Add';
    case 'change_loan_escalation':
      return 'Edit';
    case 'delete_loan_escalation':
      return 'Delete';
    case 'view_loan_escalation':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanApp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_loanapplication',
          'change_loanapplication',
          'delete_loanapplication',
          'view_loanapplication',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanApp = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan Application permissions:', error);
      }
    );
  }
}

// === Display readable names for Loan Application permissions ===
getDisplayNameLoanApp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loanapplication':
      return 'Add';
    case 'change_loanapplication':
      return 'Edit';
    case 'delete_loanapplication':
      return 'Delete';
    case 'view_loanapplication':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsLoanReqTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_loanemailtemplate',
          'change_loanemailtemplate',
          'delete_loanemailtemplate',
          'view_loanemailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLoanReqTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Loan request Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for Loan Request Email Template permissions ===

getDisplayNameLoanReqTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_loanemailtemplate':
      return 'Add';
    case 'change_loanemailtemplate':
      return 'Edit';
    case 'delete_loanemailtemplate':
      return 'Delete';
    case 'view_loanemailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAssetType(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_assettype',
          'change_assettype',
          'delete_assettype',
          'view_assettype',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetType = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Types permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Type permissions ===
getDisplayNameAssetType(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_assettype':
      return 'Add';
    case 'change_assettype':
      return 'Edit';
    case 'delete_assettype':
      return 'Delete';
    case 'view_assettype':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsAssetApprovals(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_assetapproval',
          'change_assetapproval',
          'delete_assetapproval',
          'view_assetapproval',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetApprovals = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Approvals permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Type permissions ===
getDisplayNameAssetApprovals(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_assetapproval':
      return 'Add';
    case 'change_assetapproval':
      return 'Edit';
    case 'delete_assetapproval':
      return 'Delete';
    case 'view_assetapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAssetApprovalLvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_assetapprovallevel',
          'change_assetapprovallevel',
          'delete_assetapprovallevel',
          'view_assetapprovallevel',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetApprovallvl = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Approval Level permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Type permissions ===
getDisplayNameAssetApprovalLvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_assetapprovallevel':
      return 'Add';
    case 'change_assetapprovallevel':
      return 'Edit';
    case 'delete_assetapprovallevel':
      return 'Delete';
    case 'view_assetapprovallevel':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAssetEscalation(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_asset_escalation',
          'change_asset_escalation',
          'delete_asset_escalation',
          'view_asset_escalation',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetEscalation = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Escalation permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Type permissions ===
getDisplayNameAssetEscalation(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_asset_escalation':
      return 'Add';
    case 'change_asset_escalation':
      return 'Edit';
    case 'delete_asset_escalation':
      return 'Delete';
    case 'view_asset_escalation':
      return 'View';
    default:
      return permissionCodename;
  }
}




loadpermissionsAssetmaster(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_asset',
          'change_asset',
          'delete_asset',
          'view_asset',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetmaster = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Master permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Master permissions ===
getDisplayNameAssetmaster(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_asset':
      return 'Add';
    case 'change_asset':
      return 'Edit';
    case 'delete_asset':
      return 'Delete';
    case 'view_asset':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsAssetAlon(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_assetallocation',
          'change_assetallocation',
          'delete_assetallocation',
          'view_assetallocation',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetAlon = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Allocation permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Allocation permissions ===
getDisplayNameAssetAlon(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_assetallocation':
      return 'Add';
    case 'change_assetallocation':
      return 'Edit';
    case 'delete_assetallocation':
      return 'Delete';
    case 'view_assetallocation':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAssetReq(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_assetrequest',
          'change_assetrequest',
          'delete_assetrequest',
          'view_assetrequest',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAssetReq = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Asset Request permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Allocation permissions ===
getDisplayNameAssetReq(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_assetrequest':
      return 'Add';
    case 'change_assetrequest':
      return 'Edit';
    case 'delete_assetrequest':
      return 'Delete';
    case 'view_assetrequest':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsDocumnetAddFol(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_folder',
          'change_folder',
          'delete_folder',
          'view_folder',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocumentAddFol = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Folder permissions:', error);
      }
    );
  }
}

// === Display readable names for Asset Allocation permissions ===
getDisplayNameDocumentAddFol(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_folder':
      return 'Add';
    case 'change_folder':
      return 'Edit';
    case 'delete_folder':
      return 'Delete';
    case 'view_folder':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsProjects(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_project',
          'change_project',
          'delete_project',
          'view_project',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsProjects = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document permissions:', error);
      }
    );
  }
}

// === Display readable names for Projects permissions ===
getDisplayNameProjects(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_project':
      return 'Add';
    case 'change_project':
      return 'Edit';
    case 'delete_project':
      return 'Delete';
    case 'view_project':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsProjectStages(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_projectstage',
          'change_projectstage',
          'delete_projectstage',
          'view_projectstage',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsProjectStages = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Projects Stages permissions:', error);
      }
    );
  }
}

// === Display readable names for Projects Stages permissions ===
getDisplayNameProjectStages(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_projectstage':
      return 'Add';
    case 'change_projectstage':
      return 'Edit';
    case 'delete_projectstage':
      return 'Delete';
    case 'view_projectstage':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsProjectTask(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_task',
          'change_task',
          'delete_task',
          'view_task',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsProjectTask = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Projects Tasks permissions:', error);
      }
    );
  }
}

// === Display readable names for Projects Tasks permissions ===
getDisplayNameProjectTask(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_task':
      return 'Add';
    case 'change_task':
      return 'Edit';
    case 'delete_task':
      return 'Delete';
    case 'view_task':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsProjectTime(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_timesheet',
          'change_timesheet',
          'delete_timesheet',
          'view_timesheet',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsProjectTime = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Projects Timesheet permissions:', error);
      }
    );
  }
}

// === Display readable names for Projects Timesheet permissions ===
getDisplayNameProjectTime(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_timesheet':
      return 'Add';
    case 'change_timesheet':
      return 'Edit';
    case 'delete_timesheet':
      return 'Delete';
    case 'view_timesheet':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAirTicketPol(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketpolicy',
          'change_airticketpolicy',
          'delete_airticketpolicy',
          'view_airticketpolicy',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketPol = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Aieticket Policy permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket policy permissions ===
getDisplayNameAirTicketPol(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketpolicy':
      return 'Add';
    case 'change_airticketpolicy':
      return 'Edit';
    case 'delete_airticketpolicy':
      return 'Delete';
    case 'view_airticketpolicy':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAirTicketApr(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketapproval',
          'change_airticketapproval',
          'delete_airticketapproval',
          'view_airticketapproval',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketApr = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Aieticket Policy permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket policy permissions ===
getDisplayNameAirTicketApr(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketapproval':
      return 'Add';
    case 'change_airticketapproval':
      return 'Edit';
    case 'delete_airticketapproval':
      return 'Delete';
    case 'view_airticketapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAirTicketAprlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketworkflow',
          'change_airticketworkflow',
          'delete_airticketworkflow',
          'view_airticketworkflow',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketAprlvl = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Aieticket Approval level permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket policy permissions ===
getDisplayNameAirTicketAprlvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketworkflow':
      return 'Add';
    case 'change_airticketworkflow':
      return 'Edit';
    case 'delete_airticketworkflow':
      return 'Delete';
    case 'view_airticketworkflow':
      return 'View';
    default:
      return permissionCodename;
  }
}

loadpermissionsAirTicketEsc(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticket_escalation',
          'change_airticket_escalation',
          'delete_airticket_escalation',
          'view_airticket_escalation',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketEsc = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Aieticket Escalation permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket policy permissions ===
getDisplayNameAirTicketEsc(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticket_escalation':
      return 'Add';
    case 'change_airticket_escalation':
      return 'Edit';
    case 'delete_airticket_escalation':
      return 'Delete';
    case 'view_airticket_escalation':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAirTicketAlon(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketallocation',
          'change_airticketallocation',
          'delete_airticketallocation',
          'view_airticketallocation',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketAlon = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Airticket Allocation permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket Allocation permissions ===
getDisplayNameAirTicketAlon(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketallocation':
      return 'Add';
    case 'change_airticketallocation':
      return 'Edit';
    case 'delete_airticketallocation':
      return 'Delete';
    case 'view_airticketallocation':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsAirTicketReq(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketrequest',
          'change_airticketrequest',
          'delete_airticketrequest',
          'view_airticketrequest',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketReq = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Airticket Request permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket Request permissions ===
getDisplayNameAirTicketReq(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketrequest':
      return 'Add';
    case 'change_airticketrequest':
      return 'Edit';
    case 'delete_airticketrequest':
      return 'Delete';
    case 'view_airticketrequest':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsAirTicketRule(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_airticketrule',
          'change_airticketrule',
          'delete_airticketrule',
          'view_airticketrule',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAirTicketRule = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Airticket Rule permissions:', error);
      }
    );
  }
}

// === Display readable names for AirTicket Rule permissions ===
getDisplayNameAirTicketRule(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_airticketrule':
      return 'Add';
    case 'change_airticketrule':
      return 'Edit';
    case 'delete_airticketrule':
      return 'Delete';
    case 'view_airticketrule':
      return 'View';
    default:
      return permissionCodename;
  }
}


// Documents Loads And Dispaly


loadpermissionsDocumentAprlvl(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_documentapprovallevel',
          'change_documentapprovallevel',
          'delete_documentapprovallevel',
          'view_documentapprovallevel'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocumentAprlvl = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Approval level permissions:', error);
      }
    );
  }
}


// === Display readable names for Document Approval level permissions ===
getDisplayNameDocumentAprlvl(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_documentapprovallevel':
      return 'Add';
    case 'change_documentapprovallevel':
      return 'Edit';
    case 'delete_documentapprovallevel':
      return 'Delete';
    case 'view_documentapprovallevel':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsDocumentApr(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_documentapproval',
          'change_documentapproval',
          'delete_documentapproval',
          'view_documentapproval'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocumentApr = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Approval permissions:', error);
      }
    );
  }
}


// === Display readable names for Document Approval permissions ===
getDisplayNameDocumentApr(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_documentapproval':
      return 'Add';
    case 'change_documentapproval':
      return 'Edit';
    case 'delete_documentapproval':
      return 'Delete';
    case 'view_documentapproval':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsDocumentReq(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_documentrequest',
          'change_documentrequest',
          'delete_documentrequest',
          'view_documentrequest'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocumentReq = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Request permissions:', error);
      }
    );
  }
}


// === Display readable names for Document Request permissions ===
getDisplayNameDocumentReq(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_documentrequest':
      return 'Add';
    case 'change_documentrequest':
      return 'Edit';
    case 'delete_documentrequest':
      return 'Delete';
    case 'view_documentrequest':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsDocumentType(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_docrequesttype',
          'change_docrequesttype',
          'delete_docrequesttype',
          'view_docrequesttype'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocumentType = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Type permissions:', error);
      }
    );
  }
}


// === Display readable names for Document Request Type permissions ===
getDisplayNameDocumentType(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_docrequesttype':
      return 'Add';
    case 'change_docrequesttype':
      return 'Edit';
    case 'delete_docrequesttype':
      return 'Delete';
    case 'view_docrequesttype':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsGeneralReqTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_emailtemplate',
          'change_emailtemplate',
          'delete_emailtemplate',
          'view_emailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsGeneralReqTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching General Request Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for General Request Email Template permissions ===

getDisplayNameGeneralReqTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_emailtemplate':
      return 'Add';
    case 'change_emailtemplate':
      return 'Edit';
    case 'delete_emailtemplate':
      return 'Delete';
    case 'view_emailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsLeaveEmTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_lvemailtemplate',
          'change_lvemailtemplate',
          'delete_lvemailtemplate',
          'view_lvemailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsLeaveEmTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Leave Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for Leave Email Template permissions ===

getDisplayNameLeaveEmTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_lvemailtemplate':
      return 'Add';
    case 'change_lvemailtemplate':
      return 'Edit';
    case 'delete_lvemailtemplate':
      return 'Delete';
    case 'view_lvemailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsDocExpTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_docexpemailtemplate',
          'change_docexpemailtemplate',
          'delete_docexpemailtemplate',
          'view_docexpemailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocExpTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Expried Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for Leave Email Template permissions ===

getDisplayNameDocExpTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_docexpemailtemplate':
      return 'Add';
    case 'change_docexpemailtemplate':
      return 'Edit';
    case 'delete_docexpemailtemplate':
      return 'Delete';
    case 'view_docexpemailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsDocReqTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_docrequestemailtemplate',
          'change_docrequestemailtemplate',
          'delete_docrequestemailtemplate',
          'view_docrequestemailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsDocReqTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Document Request Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for Document Request Email Template permissions ===

getDisplayNameDocReqTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_docrequestemailtemplate':
      return 'Add';
    case 'change_docrequestemailtemplate':
      return 'Edit';
    case 'delete_docrequestemailtemplate':
      return 'Delete';
    case 'view_docrequestemailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}




loadpermissionsAdvSalReqTemp(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        const requiredCodenames = [
          'add_advancesalaryemailtemplate',
          'change_advancesalaryemailtemplate',
          'delete_advancesalaryemailtemplate',
          'view_advancesalaryemailtemplate'
        ];

        const uniquePermissionsMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
            uniquePermissionsMap.set(codename, permission);
          }
        });

        this.GrouppermissionsAdvSalReqTemp = Array.from(uniquePermissionsMap.values());
      },
      (error: any) => {
        console.error('Error fetching Advance Salary request Email Template permissions:', error);
      }
    );
  }
}


// === Display readable names for Advance Salary Request Email Template permissions ===

getDisplayNameAdvanceSalReqTemp(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_advancesalaryemailtemplate':
      return 'Add';
    case 'change_advancesalaryemailtemplate':
      return 'Edit';
    case 'delete_advancesalaryemailtemplate':
      return 'Delete';
    case 'view_advancesalaryemailtemplate':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsShifts(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_shift',
          'change_shift',
          'delete_shift',
          'view_shift',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsShifts = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Shifts permissions:', error);
      }
    );
  }
}

// === Display readable names for Shifts permissions ===
getDisplayNameShifts(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_shift':
      return 'Add';
    case 'change_shift':
      return 'Edit';
    case 'delete_shift':
      return 'Delete';
    case 'view_shift':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsShiftPattern(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_shiftpattern',
          'change_shiftpattern',
          'delete_shiftpattern',
          'view_shiftpattern',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsShiftPattern = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching ShiftPattern permissions:', error);
      }
    );
  }
}

// === Display readable names for Shift pattern permissions ===
getDisplayNameShiftPattern(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_shiftpattern':
      return 'Add';
    case 'change_shiftpattern':
      return 'Edit';
    case 'delete_shiftpattern':
      return 'Delete';
    case 'view_shiftpattern':
      return 'View';
    default:
      return permissionCodename;
  }
}


loadpermissionsShiftEmployee(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_employeeshiftschedule',
          'change_employeeshiftschedule',
          'delete_employeeshiftschedule',
          'view_employeeshiftschedule',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsShiftEmployee = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Shift Employee permissions:', error);
      }
    );
  }
}

// === Display readable names for Shifts permissions ===
getDisplayNameShiftEmployee(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_employeeshiftschedule':
      return 'Add';
    case 'change_employeeshiftschedule':
      return 'Edit';
    case 'delete_employeeshiftschedule':
      return 'Delete';
    case 'view_employeeshiftschedule':
      return 'View';
    default:
      return permissionCodename;
  }
}



loadpermissionsShiftOverRide(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_shiftoverride',
          'change_shiftoverride',
          'delete_shiftoverride',
          'view_shiftoverride',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsShiftOverRide = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Shift OverRide permissions:', error);
      }
    );
  }
}

// === Display readable names for Shifts permissions ===
getDisplayNameShiftOverRide(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_shiftoverride':
      return 'Add';
    case 'change_shiftoverride':
      return 'Edit';
    case 'delete_shiftoverride':
      return 'Delete';
    case 'view_shiftoverride':
      return 'View';
    default:
      return permissionCodename;
  }
}




loadpermissionsOverTimepolicy(): void {
  const selectedSchema = this.authService.getSelectedSchema();

  if (selectedSchema) {
    this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
      (result: any[]) => {
        console.log("All permissions from API:", result); // Debug
        const requiredCodenames = [
          'add_overtimepolicy',
          'change_overtimepolicy',
          'delete_overtimepolicy',
          'view_overtimepolicy',
        ];

        const uniqueMap = new Map();
        result.forEach(permission => {
          const codename = permission.codename.trim().toLowerCase();
          if (requiredCodenames.includes(codename) && !uniqueMap.has(codename)) {
            uniqueMap.set(codename, permission);
          }
        });

        this.GrouppermissionsOverTimePolicy = Array.from(uniqueMap.values());
      },
      (error: any) => {
        console.error('Error fetching Shift OverRide permissions:', error);
      }
    );
  }
}

// === Display readable names for Shifts permissions ===
getDisplayNameOverTimepolicy(permissionCodename: string): string {
  switch (permissionCodename.trim().toLowerCase()) {
    case 'add_overtimepolicy':
      return 'Add';
    case 'change_overtimepolicy':
      return 'Edit';
    case 'delete_overtimepolicy':
      return 'Delete';
    case 'view_overtimepolicy':
      return 'View';
    default:
      return permissionCodename;
  }
}


 loadpermissionsEmpOver(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_employeeovertime', 'change_employeeovertime', 'delete_employeeovertime', 'view_employeeovertime'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsEmpOver = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsEmpOver);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
           //Display Name  add view delte code for General request master-------
        
  getDisplayNameEmpOver(permissionCodename: string): string {
            switch (permissionCodename.trim().toLowerCase()) {
              case 'add_employeeovertime':
                return 'Add';
              case 'change_employeeovertime':
                return 'Edit';
              case 'delete_employeeovertime':
                return 'Delete';
              case 'view_employeeovertime':
                return 'View';
              default:
                return permissionCodename;
            }
          }











// On Checkboxchnage and updatecheckbox funtions Sections


  onCheckboxChangeEmp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateEmployeeMasterCheckbox();
    this.updateSelectAll();
  

  }

  updateEmployeeMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.employeeMasterChecked = allPermissionsSelected;
    this.employeeMasterIndeterminate = this.isEmployeeMasterIndeterminate();

  }

  onCheckboxChangeDept(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateDepartmentMasterCheckbox();
    this.updateSelectAll();
  }

  updateDepartmentMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDept.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.departmentMasterChecked = allPermissionsSelected;
    this.departmentMasterInderminate = this.isDepartmentMasterIndeterminate();

  }



  onCheckboxChangeDesg(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateDesgnationMasterCheckbox();
    this.updateSelectAll();
  }

  updateDesgnationMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDis.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    
    this.designationMasterChecked = allPermissionsSelected;
    this.designationMasterInderminate = this.isDesignationMasterIndeterminate();
  }



  onCheckboxChangeCat(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateCategoryMasterCheckbox();
    this.updateSelectAll();
  }

  updateCategoryMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsCat.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.categoryMasterChecked = allPermissionsSelected;
    this.categoryMasterInderminate = this.isCategoryMasterIndeterminate();

  }



  onCheckboxChangeGen(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateGenMasterCheckbox();
    this.updateSelectAll();
  }

  updateGenMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsGen.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.GenMasterChecked = allPermissionsSelected;
    this.GenMasterInderminate = this.isGenMasterIndeterminate();

  }



  
  onCheckboxChangeReqtype(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateReqtypeMasterCheckbox();
    this.updateSelectAll();
  }

  updateReqtypeMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsReqtype.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.ReqtypeMasterChecked = allPermissionsSelected;
    this.ReqtypeMasterInderminate = this.isReqtypeMasterIndeterminate();

  }


  onCheckboxChangeApr(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateAprMasterCheckbox();
    this.updateSelectAll();
  }

  updateAprMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsApr.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AprMasterChecked = allPermissionsSelected;
    this.AprMasterInderminate = this.isAprMasterIndeterminate();

  }

  onCheckboxChangeAprlvl(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateAprlvlMasterCheckbox();
    this.updateSelectAll();
  }

  updateAprlvlMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAprlvl.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AprlvlMasterChecked = allPermissionsSelected;
    this.AprlvlMasterInderminate = this.isAprlvlMasterIndeterminate();

  }

  onCheckboxChangeGenReqEsc(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateGenReqEscMasterCheckbox();
    this.updateSelectAll();
  }

  updateGenReqEscMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsGenReqEsc.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.GenReqEscMasterChecked = allPermissionsSelected;
    this.GenReqEscMasterInderminate = this.isGenReqEscMasterIndeterminate();

  }
  
  onCheckboxChangeAtd(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateAtdMasterCheckbox();
    this.updateSelectAll();
  }

  updateAtdMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAtd.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AtdMasterChecked = allPermissionsSelected;
    this.AtdMasterInderminate = this.isAtdMasterIndeterminate();

  }


  onCheckboxChangeExpDocument(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateExpDocumentCheckbox();
    this.updateSelectAll();
  }

  updateExpDocumentCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsExpDocument.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.ExpDocumentChecked = allPermissionsSelected;
    this.ExpDocumentInderminate = this.isExpDocumentIndeterminate();

  }

  
  onCheckboxChangeEmpAprList(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateEmpAprListCheckbox();
    this.updateSelectAll();
  }

  updateEmpAprListCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmpAprList.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EmpAprListChecked = allPermissionsSelected;
    this.EmpAprListInderminate = this.isEmpAprListIndeterminate();

  }

    onCheckboxChangeEmpRegAprList(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateEmpRegAprListCheckbox();
    this.updateSelectAll();
  }

  updateEmpRegAprListCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmpRegAprList.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EmpRegAprListChecked = allPermissionsSelected;
    this.EmpRegAprListInderminate = this.isEmpRegAprListIndeterminate();

  }


  onCheckboxChangeEndofSer(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateEndofSerCheckbox();
    this.updateSelectAll();
  }

  updateEndofSerCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEndofSer.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EndofSerChecked = allPermissionsSelected;
    this.EndofSerInderminate = this.isEndofSerIndeterminate();

  }



  onCheckboxChangeRegReq(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateRegReqCheckbox();
    this.updateSelectAll();
  }

  updateRegReqCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsRegReq.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.RegReqChecked = allPermissionsSelected;
    this.RegReqInderminate = this.isRegReqIndeterminate();

  }

    onCheckboxChangeRegAprlvl(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateRegAprlvlCheckbox();
    this.updateSelectAll();
  }

  updateRegAprlvlCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsRegAprlvl.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.RegAprlvlChecked = allPermissionsSelected;
    this.RegAprlvlInderminate = this.isRegAprlvlIndeterminate();

  }


  onCheckboxChangeGratuity(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateGratuityCheckbox();
    this.updateSelectAll();
  }

  updateGratuityCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsGratuity.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.GratuityChecked = allPermissionsSelected;
    this.GratuityInderminate = this.isGratuityIndeterminate();

  }



  onCheckboxChangesBrch(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateBranchCheckbox();
    this.updateSelectAlls();


  }

  updateBranchCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsBrch.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.branchMasterChecked = allPermissionsSelected;
    this.branchMasterInderminate = this.isBranchMasterIndeterminate();
  }

  onCheckboxChangesuser(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateuserMasterCheckbox();
    this.updateSelectAlls();

  }

  updateuserMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsUser.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.userMasterChecked = allPermissionsSelected;
    this.userMasterInderminate =this.isUserMasterIndeterminate();
  }

  onCheckboxChangesUsergroup(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateUsergroupMasterCheckbox();
    this.updateSelectAlls();

  }

  updateUsergroupMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsUsergroup.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.usergroupingMasterChecked = allPermissionsSelected;
    this.userGroupMasterInderminate= this.isUserGroupingIndeterminate();
  }

  onCheckboxChangesassign(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateassignMasterCheckbox();
    this.updateSelectAlls();

  }

  updateassignMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsassigneddUser.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.assignpermissionMasterChecked = allPermissionsSelected;
    this.assignMasterInderminate = this.isAssignPermissionsIndeterminate();
  }

  onCheckboxChangesstate(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateStateMasterCheckbox();
    this.updateSelectAlls();

  }

  updateStateMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsstateMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.stationMasterChecked = allPermissionsSelected;
    this.stateMasterInderminate = this.isStateMasterIndeterminate();
  }

  onCheckboxChangesdoctype(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updatedoctypeMasterCheckbox();
    this.updateSelectAlls();

  }

  updatedoctypeMasterCheckbox(): void {
    const allPermissionsSelected = this.Grouppermissionsdocumentype.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.documenttypeMasterChecked = allPermissionsSelected;
    this.documentMasterInderminate = this.isdocumenttypeIndeterminate();
  }



  onCheckboxChangesloc(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updatelocMasterCheckbox();
    this.updateSelectAlls();

  }

  updatelocMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionslocationMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.locationMasterChecked = allPermissionsSelected;
    this.locationMasterInderminate = this.isloactionmasterIndeterminate();
  }


  onCheckboxChangesDn(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDnMasterCheckbox();
    this.updateSelectAlls();

  }

  updateDnMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDnMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DnMasterChecked = allPermissionsSelected;
    this.DnMasterInderminate = this.isDnmasterIndeterminate();
  }

  onCheckboxChangesCp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateCpMasterCheckbox();
    this.updateSelectAlls();

  }

  updateCpMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsCpMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.CpMasterChecked = allPermissionsSelected;
    this.CpMasterInderminate = this.isCpmasterIndeterminate();
  }






  onCheckboxChangesConfig(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateConfigMasterCheckbox();
    this.updateSelectAlls();

  }

  updateConfigMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsConfigMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.ConfigMasterChecked = allPermissionsSelected;
    this.ConfigMasterInderminate = this.isConfigmasterIndeterminate();
  }

  
onCheckboxChangesAnnounce(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAnnounceMasterCheckbox();
    this.updateSelectAlls();

  }

updateAnnounceMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAnnounceMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AnnounceMasterChecked = allPermissionsSelected;
    this.AnnounceInderminate = this.isAnnounceIndeterminate();
  }


onCheckboxChangesNotify(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateNotifyCheckbox();
    this.updateSelectAlls();

  }

updateNotifyCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsNotify.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.NotefyChecked = allPermissionsSelected;
    this.NotifyInderminate = this.isNotifyIndeterminate();
  }

  onCheckboxChangesEmpReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateEmpReportCheckbox();
    this.updateReport();

  }

  updateEmpReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsemployeeReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.emportReportChecked = allPermissionsSelected;
    this.emportReportInderminate = this.isEmployeeReportIndeterminate();
  }

  onCheckboxChangesdocReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updatedocReportCheckbox();
    this.updateReport();

  }

  updatedocReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsdocumnetReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.documentReportChecked = allPermissionsSelected;
    this.documentReportInderminate = this.isDocumentReportIndeterminate();
  }


    onCheckboxChangesLeaveBalReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveBalReportCheckbox();
    this.updateReport();

  }

    updateLeaveBalReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveBalReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveBalReportChecked = allPermissionsSelected;
    this.LeaveBalReportInderminate = this.isLeaveBalReportIndeterminate();
  }


  onCheckboxChangesGenReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateGenReportCheckbox();
    this.updateReport();

  }

  updateGenReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissiionsgeneralReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.generelReportChecked= allPermissionsSelected;
    this.generalReportInderminate = this.isGeneralReportIndeterminate();
  }


    onCheckboxChangesDeptReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDeptReportCheckbox();
    this.updateReport();

  }

  updateDeptReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissiionsDeptReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DeptReportChecked= allPermissionsSelected;
    this.DeptReportInderminate = this.isDeptReportIndeterminate();
  }

  onCheckboxChangesDesReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDesReportCheckbox();
    this.updateReport();

  }

  updateDesReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissiionsDesReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DesReportChecked= allPermissionsSelected;
    this.DesReportInderminate = this.isDesReportIndeterminate();
  }


  onCheckboxChangesLeaveReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveReportCheckbox();
    this.updateReport();

  }

  updateLeaveReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissiionsLeaveReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveReportChecked= allPermissionsSelected;
    this.LeaveReportInderminate = this.isLeaveReportIndeterminate();
  }


  onCheckboxChangesAttendReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAttendReportCheckbox();
    this.updateReport();

  }

  updateAttendReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAttendReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AttendReportChecked= allPermissionsSelected;
    this.AttendReportInderminate = this.isAttendReportIndeterminate();
  }

 onCheckboxChangesAssetReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAssetReportCheckbox();
    this.updateReport();

  }

  updateAssetReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAssetReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AssetReportChecked= allPermissionsSelected;
    this.AssetReportInderminate = this.isAssetReportIndeterminate();
  }


 onCheckboxChangesAssetTransReport(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAssetTransReportCheckbox();
    this.updateReport();

  }

 updateAssetTransReportCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAssetTransReport.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AssetTransReportChecked= allPermissionsSelected;
    this.AssetTransReportInderminate = this.isAssetTransReportIndeterminate();
  }


onCheckboxChangesLeaveAprRep(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveAprRepCheckbox();
    this.updateReport();

  }

updateLeaveAprRepCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissiionsLeaveAprRep.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveAprRepChecked= allPermissionsSelected;
    this.LeaveAprRepInderminate = this.isLeaveAprRepIndeterminate();
  }


    onCheckboxChangesEmpform(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateEmpformCheckbox();
    this.updateCustomization();

  }

  updateEmpformCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmpform.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EmpformChecked = allPermissionsSelected;
    this.EmpformInderminate = this.isEmpformIndeterminate();
  }


    onCheckboxChangesAssetform(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAssetformCheckbox();
    this.updateCustomization();

  }

  updateAssetformCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAssetform.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AssetformChecked = allPermissionsSelected;
    this.AssetformInderminate = this.isAssetformIndeterminate();
  }

  onCheckboxChangesAddweek(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAddWeekCheckbox();
    this.updateCalender();

  }

  updateAddWeekCheckbox(): void {
    const allPermissionsSelected = this.Grouppermissionsaddweek.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.addweekChecked = allPermissionsSelected;
    this.addweekInderminate = this.isAddWeekIndeterminate();
  }

  
  onCheckboxChangesAssignweek(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAssignweekCheckbox();
    this.updateCalender();

  }

  updateAssignweekCheckbox(): void {
    const allPermissionsSelected = this.Grouppermisionsassignweek.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.assignweekChecked = allPermissionsSelected;
    this.assignweekInderminate = this.isAssignWeekIndeterminate();
  }

  onCheckboxChangesAddHoliday(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAddHolidayCheckbox();
    this.updateCalender();

  }

  updateAddHolidayCheckbox(): void {
    const allPermissionsSelected = this.Grouppermissionsaddholiday.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.addholidayChecked = allPermissionsSelected;
    this.addholidayInderminate= this.isAddHolidayIndeterminate();
  }

  onCheckboxChangesAssignHoliday(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAssignHolidayCheckbox();
    this.updateCalender();

  }

  updateAssignHolidayCheckbox(): void {
    const allPermissionsSelected = this.Grouppermissionsassisgnholiday.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.assignholidayChecked= allPermissionsSelected;
    this.assignholidayInderminate= this.isAssignHolidayIndeterminate();
  }


  onCheckboxChangesLeaveaprv(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveaprvCheckbox();
    this.updateLeave();

  }

  updateLeaveaprvCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveaprv.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveaprvChecked = allPermissionsSelected;
    this.LeaveaprvInderminate = this.isLeaveaprvIndeterminate();
  }


  onCheckboxChangesLeavetype(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeavetypeCheckbox();
    this.updateLeave();

  }

  updateLeavetypeCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeavetype.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeavetypeChecked = allPermissionsSelected;
    this.LeavetypeInderminate = this.isLeavetypeIndeterminate();
  }

    onCheckboxChangesLeaveEscalation(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveEscalationCheckbox();
    this.updateLeave();

  }

  updateLeaveEscalationCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveEscalation.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveEscalationChecked = allPermissionsSelected;
    this.LeaveEscalationInderminate = this.isLeaveEscalationIndeterminate();
  }

  onCheckboxChangesLeavemaster(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeavemasterCheckbox();
    this.updateLeave();

  }

  updateLeavemasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeavemaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeavemasterChecked = allPermissionsSelected;
    this.LeavemasterInderminate = this.isLeavemasterIndeterminate();
  }

  onCheckboxChangesLeavereq(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeavereqCheckbox();
    this.updateLeave();

  }

  updateLeavereqCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeavereq.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeavereqChecked = allPermissionsSelected;
    this.LeavereqInderminate = this.isLeavereqIndeterminate();
  }


  onCheckboxChangesLeavecom(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeavecomCheckbox();
    this.updateLeave();

  }

  updateLeavecomCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeavecom.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeavecomChecked = allPermissionsSelected;
    this.LeavecomInderminate = this.isLeavecomIndeterminate();
  }

  onCheckboxChangesLeaveaprvlvl(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveaprvlvlCheckbox();
    this.updateLeave();

  }

  updateLeaveaprvlvlCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveaprvlvl.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveaprvlvlChecked = allPermissionsSelected;
    this.LeaveaprvlvlInderminate = this.isLeaveaprvlvlIndeterminate();
  }


    onCheckboxChangesLeaveBalance(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveBalanceCheckbox();
    this.updateLeave();

  }

  updateLeaveBalanceCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveBalance.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveBalanceChecked = allPermissionsSelected;
    this.LeaveBalanceInderminate = this.isLeaveBalanceIndeterminate();
  }

  onCheckboxChangesLeaveCancel(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveCancelCheckbox();
    this.updateLeave();

  }

  updateLeaveCancelCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveCancel.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveCancelChecked = allPermissionsSelected;
    this.LaaveCancelInderminate = this.isLeaveCancelIndeterminate();
  }

    onCheckboxChangesLeaveAccrual(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveAccrualCheckbox();
    this.updateLeave();

  }

  updateLeaveAccrualCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveAccrual.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveAccrualChecked = allPermissionsSelected;
    this.LeaveAccrualInderminate = this.isLeaveAccrualIndeterminate();
  }

  onCheckboxChangesLeaveRejoin(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveRejoinCheckbox();
    this.updateLeave();

  }

  updateLeaveRejoinCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveRejoin.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveRejoinChecked = allPermissionsSelected;
    this.LeaveRejoinInderminate = this.isLeaveRejoinIndeterminate();
  }

  
onCheckboxChangesPayrollrun(permission: string): void {
  if (this.selectedPermissions.includes(permission)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
  } else {
    this.selectedPermissions.push(permission);
  }
  this.updatePayrollrunCheckbox();
  this.updatePayroll();
}

updatePayrollrunCheckbox(): void {
  const allPermissionsSelected = this.GrouppermissionsPayrollrun.every(permission =>
    this.selectedPermissions.includes(permission.id)
  );
  this.PayrollrunChecked = allPermissionsSelected;
}


 onCheckboxChangesSalarycomponent(permission: string): void {
  if (this.selectedPermissions.includes(permission)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
  } else {
    this.selectedPermissions.push(permission);
  }

  this.updateSalarycomponentCheckbox();
  this.updatePayroll();
}


updateSalarycomponentCheckbox(): void {
  const allPermissionsSelected = this.GrouppermissionsSalarycomponent.every(permission =>
    this.selectedPermissions.includes(permission.id)
  );
  this.SalarycomponentChecked = allPermissionsSelected;
}


onCheckboxChangesPayslipAprv(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updatePayslipAprvCheckbox();
  this.updatePayroll();
}

updatePayslipAprvCheckbox(): void {
  const allSelected = this.GrouppermissionsPayslipAprv.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.PayslipAprvChecked = allSelected;
}


 onCheckboxChangesPayrollaprlvl(permission: string): void {
  if (this.selectedPermissions.includes(permission)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
  } else {
    this.selectedPermissions.push(permission);
  }

  this.updatePayrollaprlvlCheckbox();
  this.updatePayroll();
}


updatePayrollaprlvlCheckbox(): void {
  const allPermissionsSelected = this.GrouppermissionsPayrollaprlvl.every(permission =>
    this.selectedPermissions.includes(permission.id)
  );
  this.PayrollaprlvlChecked = allPermissionsSelected;
}

onCheckboxChangesAdvanceSalaryAprvlst(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAdvanceSalaryAprvlstCheckbox();
  this.updatePayroll();
}

updateAdvanceSalaryAprvlstCheckbox(): void {
  const allSelected = this.GrouppermissionsAdvanceSalaryAprvlst.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AdvanceSalaryAprvlstChecked = allSelected;
}


onCheckboxChangesAdvanceSalaryReq(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAdvanceSalaryReqCheckbox();
  this.updatePayroll();
}

updateAdvanceSalaryReqCheckbox(): void {
  const allSelected = this.GrouppermissionsAdvanceSalaryReq.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AdvanceSalaryReqChecked = allSelected;
}


onCheckboxChangesAdvanceSalaryEscalation(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAdvanceSalaryEscalationCheckbox();
  this.updatePayroll();
}

updateAdvanceSalaryEscalationCheckbox(): void {
  const allSelected = this.GrouppermissionsAdvanceSalaryEscalation.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AdvanceSalaryEscalationChecked = allSelected;
}


onCheckboxChangesAdvanceSalaryAprlvl(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAdvanceSalaryAprlvlCheckbox();
  this.updatePayroll();
}

updateAdvanceSalaryAprlvlCheckbox(): void {
  const allSelected = this.GrouppermissionsAdvanceSalaryAprlvl.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AdvanceSalaryAprlvlChecked = allSelected;
}



onCheckboxChangesWps(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateWpsCheckbox();
  this.updatePayroll();
}

updateWpsCheckbox(): void {
  const allSelected = this.GrouppermissionsWps.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.WpsChecked = allSelected;
}

onCheckboxChangesLoanApproval(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanApprovalCheckbox();
  this.updateLoan();
}

updateLoanApprovalCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanApproval.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanApprovalChecked = allSelected;
}


onCheckboxChangesLoanType(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanTypeCheckbox();
  this.updateLoan();
}

updateLoanTypeCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanType.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanTypeChecked = allSelected;
}



onCheckboxChangesLoanRepay(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanRepayCheckbox();
  this.updateLoan();
}

updateLoanRepayCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanRepay.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanRepayChecked = allSelected;
}


onCheckboxChangesLoanAprvlvl(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanAprvlvlCheckbox();
  this.updateLoan();
}

updateLoanAprvlvlCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanAprvlvl.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanAprvlvlChecked = allSelected;
}


onCheckboxChangesLoanEscalation(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanEscalationCheckbox();
  this.updateLoan();
}

updateLoanEscalationCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanEscalation.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanEscalationChecked = allSelected;
}


onCheckboxChangesLoanApp(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateLoanAppCheckbox();
  this.updateLoan();
}

updateLoanAppCheckbox(): void {
  const allSelected = this.GrouppermissionsLoanApp.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.LoanAppChecked = allSelected;
}


onCheckboxChangesAssetType(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetTypeCheckbox();
  this.updateAsset();
}


updateAssetTypeCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetType.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetTypeChecked = allSelected;
}

onCheckboxChangesAssetApprovals(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetApprovalsCheckbox();
  this.updateAsset();
}


updateAssetApprovalsCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetApprovals.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetApprovalsChecked = allSelected;
}

onCheckboxChangesAssetApprovalLvl(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetApprovalLvlCheckbox();
  this.updateAsset();
}


updateAssetApprovalLvlCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetApprovallvl.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetApprovallvlChecked = allSelected;
}

onCheckboxChangesAssetEscalation(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetEscalationCheckbox();
  this.updateAsset();
}


updateAssetEscalationCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetEscalation.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetEscalationChecked = allSelected;
}


onCheckboxChangesAssetmaster(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetmasterCheckbox();
  this.updateAsset();
}

updateAssetmasterCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetmaster.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetmasterChecked = allSelected;
}

onCheckboxChangesAssetAlon(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetAlonCheckbox();
  this.updateAsset();
}

updateAssetAlonCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetAlon.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetAlonChecked = allSelected;
}

onCheckboxChangesAssetReq(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAssetReqCheckbox();
  this.updateAsset();
}

updateAssetReqCheckbox(): void {
  const allSelected = this.GrouppermissionsAssetReq.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AssetReqChecked = allSelected;
}

onCheckboxChangesDocumentAddFol(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateDocumentAddFolCheckbox();
  this.updateDocumentAdd();
}

updateDocumentAddFolCheckbox(): void {
  const allSelected = this.GrouppermissionsDocumentAddFol.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.DocumentAddFolChecked = allSelected;
}

onCheckboxChangesProjects(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateProjectsCheckbox();
  this.updateProject();
}

updateProjectsCheckbox(): void {
  const allSelected = this.GrouppermissionsProjects.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ProjectsChecked = allSelected;
}

onCheckboxChangesProjectStages(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateProjectStagesCheckbox();
  this.updateProject();
}

updateProjectStagesCheckbox(): void {
  const allSelected = this.GrouppermissionsProjectStages.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ProjectStagesChecked = allSelected;
}

onCheckboxChangesProjectTask(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateProjectTaskCheckbox();
  this.updateProject();
}

updateProjectTaskCheckbox(): void {
  const allSelected = this.GrouppermissionsProjectTask.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ProjectTaskChecked = allSelected;
}

onCheckboxChangesProjectTime(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateProjectTimeCheckbox();
  this.updateProject();
}

updateProjectTimeCheckbox(): void {
  const allSelected = this.GrouppermissionsProjectTime.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ProjectTimeChecked = allSelected;
}

onCheckboxChangesAirTicketPol(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketPolCheckbox();
  this.updateAirTicket();
}

updateAirTicketPolCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketPol.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketPolChecked = allSelected;
}

onCheckboxChangesAirTicketApr(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketAprCheckbox();
  this.updateAirTicket();
}

updateAirTicketAprCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketApr.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketAprChecked = allSelected;
}

onCheckboxChangesAirTicketAprlvl(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketAprlvlCheckbox();
  this.updateAirTicket();
}

updateAirTicketAprlvlCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketAprlvl.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketAprlvlChecked = allSelected;
}

onCheckboxChangesAirTicketEsc(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketEscCheckbox();
  this.updateAirTicket();
}

updateAirTicketEscCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketEsc.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketEscChecked = allSelected;
}

onCheckboxChangesAirTicketAlon(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketAlonCheckbox();
  this.updateAirTicket();
}

updateAirTicketAlonCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketAlon.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketAlonChecked = allSelected;
}

onCheckboxChangesAirTicketReq(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketReqCheckbox();
  this.updateAirTicket();
}

updateAirTicketReqCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketReq.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketReqChecked = allSelected;
}

onCheckboxChangesAirTicketRule(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateAirTicketRuleCheckbox();
  this.updateAirTicket();
}

updateAirTicketRuleCheckbox(): void {
  const allSelected = this.GrouppermissionsAirTicketRule.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.AirTicketRuleChecked = allSelected;
}




    onCheckboxChangesDocumentAprlvl(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocumentAprlvlCheckbox();
    this.updateDocument();

  }


  updateDocumentAprlvlCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocumentAprlvl.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocumentAprlvlChecked = allPermissionsSelected;
    this.DocumentAprlvlInderminate = this.isDocumentAprlvlIndeterminate();
  }


  
    onCheckboxChangesDocumentApr(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocumentAprCheckbox();
    this.updateDocument();

  }


  updateDocumentAprCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocumentApr.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocumentAprChecked = allPermissionsSelected;
    this.DocumentAprInderminate = this.isDocumentAprIndeterminate();
  }


    
    onCheckboxChangesDocumentReq(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocumentReqCheckbox();
    this.updateDocument();

  }


  updateDocumentReqCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocumentReq.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocumentReqChecked = allPermissionsSelected;
    this.DocumentReqInderminate = this.isDocumentReqIndeterminate();
  }


  onCheckboxChangesDocumentType(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocumentTypeCheckbox();
    this.updateDocument();

  }


  updateDocumentTypeCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocumentType.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocumentTypeChecked = allPermissionsSelected;
    this.DocumentTypeInderminate = this.isDocumentTypeIndeterminate();
  }


  onCheckboxChangesGeneralReqTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateGeneralReqTempCheckbox();
    this.updateEmailTemplate();

  }


  updateGeneralReqTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsGeneralReqTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.GeneralReqTempChecked = allPermissionsSelected;
    this.GeneralReqTempInderminate = this.isGeneralReqTempIndeterminate();
  }


  onCheckboxChangesLeaveEmTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveEmTempCheckbox();
    this.updateEmailTemplate();

  }


  updateLeaveEmTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveEmTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveEmTempChecked = allPermissionsSelected;
    this.LeaveEmTempInderminate = this.isLeaveEmTempIndeterminate();
  }



    onCheckboxChangesDocExpTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocExpTempCheckbox();
    this.updateEmailTemplate();

  }


  updateDocExpTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocExpTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocExpTempChecked = allPermissionsSelected;
    this.DocExpTempInderminate = this.isDocExpTempIndeterminate();
  }


 onCheckboxChangesDocReqTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateDocReqTempCheckbox();
    this.updateEmailTemplate();

  }


  updateDocReqTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsDocReqTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.DocReqTempChecked = allPermissionsSelected;
    this.DocReqTempInderminate = this.isDocReqTempIndeterminate();
  }



 onCheckboxChangesAdvSalReqTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateAdvSalReqTempCheckbox();
    this.updateEmailTemplate();

  }


  updateAdvSalReqTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsAdvSalReqTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.AdvSalReqTempChecked = allPermissionsSelected;
    this.AdvSalReqTempInderminate = this.isAdvSalReqTempIndeterminate();
  }



  
 onCheckboxChangesLoanReqTemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLoanReqTempCheckbox();
    this.updateEmailTemplate();

  }


  updateLoanReqTempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLoanReqTemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LoanReqTempChecked = allPermissionsSelected;
    this.LoanReqTempInderminate = this.isLoanReqTempIndeterminate();
  }

// Shift

  onCheckboxChangesShifts(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateShiftsCheckbox();
  this.updateShift();
}

updateShiftsCheckbox(): void {
  const allSelected = this.GrouppermissionsShifts.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ShiftsChecked = allSelected;
}


onCheckboxChangesShiftPattern(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateShiftPatternCheckbox();
  this.updateShift();
}

updateShiftPatternCheckbox(): void {
  const allSelected = this.GrouppermissionsShiftPattern.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ShiftPatternChecked = allSelected;
}


onCheckboxChangesShiftEmployee(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateShiftEmployeeCheckbox();
  this.updateShift();
}

updateShiftEmployeeCheckbox(): void {
  const allSelected = this.GrouppermissionsShiftEmployee.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ShiftEmployeeChecked = allSelected;
}


onCheckboxChangesShiftOverRide(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateShiftOverRideCheckbox();
  this.updateShift();
}

updateShiftOverRideCheckbox(): void {
  const allSelected = this.GrouppermissionsShiftOverRide.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.ShiftOverRideChecked = allSelected;
}


onCheckboxChangesOverTimePolicy(permissionId: number): void {
  if (this.selectedPermissions.includes(permissionId)) {
    this.selectedPermissions = this.selectedPermissions.filter(p => p !== permissionId);
  } else {
    this.selectedPermissions.push(permissionId);
  }

  this.updateOverTimePolicyCheckbox();
  this.updateShift();
}

updateOverTimePolicyCheckbox(): void {
  const allSelected = this.GrouppermissionsOverTimePolicy.every(p =>
    this.selectedPermissions.includes(p.id)
  );
  this.OvertimePolicyChecked = allSelected;
}

  onCheckboxChangeEmpOver(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateEmpOverCheckbox();
    this.updateShift();
  }

  updateEmpOverCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmpOver.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EmpOverChecked = allPermissionsSelected;
    this.EmpOverInderminate = this.isEmpOverIndeterminate();

  }
























  
  updateMasterCheckboxes(): void {
    this.updateEmployeeMasterCheckbox();
    this.updateDepartmentMasterCheckbox();
    this.updateDesgnationMasterCheckbox();
    this.updateCategoryMasterCheckbox();
    this.updateGenMasterCheckbox();
    this.updateReqtypeMasterCheckbox();
    this.updateAprMasterCheckbox();
    this.updateAprlvlMasterCheckbox();
    this.updateGenReqEscMasterCheckbox();
    this.updateAtdMasterCheckbox();
    this.updateExpDocumentCheckbox();
    // this.updateEmpOverCheckbox();
    this.updateEmpAprListCheckbox();
    this.updateEmpRegAprListCheckbox();
    this.updateEndofSerCheckbox();
    this.updateRegReqCheckbox();
    this.updateRegAprlvlCheckbox();
    this.updateGratuityCheckbox();





    this.updateBranchCheckbox();
    this.updateuserMasterCheckbox();
    this.updateUsergroupMasterCheckbox();
    this.updateassignMasterCheckbox();
    this.updateStateMasterCheckbox();
    this.updatedoctypeMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateConfigMasterCheckbox();
    this.updateAnnounceMasterCheckbox();
    this.updateNotifyCheckbox();



    this.updateEmpReportCheckbox();
    this.updateGenReportCheckbox();
    this.updatedocReportCheckbox();


    this.updateAddHolidayCheckbox();
    this.updateAddWeekCheckbox();
    this.updateAssignHolidayCheckbox();
    this.updateAssignweekCheckbox();
    this.updateLeaveaprvCheckbox();

    this.updateSelectAll();
    this.updateSelectAlls();
    this.updateReport();
    this.updateCustomization();
    this.updateCalender();
    this.updateLeave();
    this.updatePayroll();
    this.updateLoan();
    this.updateAsset();
    this.updateDocumentAdd();
    this.updateProject();
    this.updateAirTicket();
    this.updateDocument();
    this.updateEmailTemplate();
    this.updateShift();

  }


  updateEmployeeManagementCheckbox() {
    this.selectAllChecked = this.employeeMasterChecked && 
                            this.departmentMasterChecked && 
                            this.designationMasterChecked && 
                            this.categoryMasterChecked &&
                            this.GenMasterChecked &&
                            this.ReqtypeMasterChecked&&
                            this.AprMasterChecked &&
                            this.AprlvlMasterChecked &&
                            this.GenReqEscMasterChecked &&
                            this.AtdMasterChecked &&
                            this.ExpDocumentChecked &&
                            // this.EmpOverChecked &&
                            this.EmpAprListChecked &&
                            this.EmpRegAprListChecked &&
                            this.EndofSerChecked &&
                            this.RegReqChecked &&
                            this.RegAprlvlChecked &&
                            this.GratuityChecked;

}


isEmpDeptDisCatPermission(permission: string): boolean {
  return [...this.GrouppermissionsEmp, ...this.GrouppermissionsDept, ...this.GrouppermissionsDis, 
    ...this.GrouppermissionsCat, ...this.GrouppermissionsGen,...this.GrouppermissionsReqtype,
    ...this.GrouppermissionsApr, ...this.GrouppermissionsAprlvl,...this.GrouppermissionsGenReqEsc,...this.GrouppermissionsAtd,...this.GrouppermissionsExpDocument,
  ...this.GrouppermissionsEmpAprList,...this.GrouppermissionsEmpRegAprList,this.GrouppermissionsEndofSer,this.GrouppermissionsRegReq,
...this.GrouppermissionsRegAprlvl,...this.GrouppermissionsGratuity]
    .some(p => p.id === permission);
}



isIndeterminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsEmp,
    ...this.GrouppermissionsDept,
    ...this.GrouppermissionsDis,
    ...this.GrouppermissionsCat,
    ...this.GrouppermissionsGen,
    ...this.GrouppermissionsReqtype,
    ...this.GrouppermissionsApr,
    ...this.GrouppermissionsAprlvl,
    ...this.GrouppermissionsGenReqEsc,
    ...this.GrouppermissionsAtd,
    ...this.GrouppermissionsExpDocument,
    // ...this.GrouppermissionsEmpOver,
    ...this.GrouppermissionsEmpAprList,
    ...this.GrouppermissionsEmpRegAprList,
    ...this.GrouppermissionsEndofSer,
    ...this.GrouppermissionsRegReq,
    ...this.GrouppermissionsRegAprlvl,
    ...this.GrouppermissionsGratuity,

  ].some(permission => this.selectedPermissions.includes(permission.id));
    return hasSelectedPermissions && !this.isEmployeeManagementMasterChecked();

}


isemployee(): boolean {
  
  const employeeMasterIndeterminate = this.isEmployeeMasterIndeterminate();
  const departmentMasterInderminate = this.isDepartmentMasterIndeterminate();
  const designationMasterInderminate = this.isDesignationMasterIndeterminate();
  const categoryMasterInderminate = this.isCategoryMasterIndeterminate();
  const GenMasterInderminate = this.isGenMasterIndeterminate();
  const ReqtypeMasterInderminate = this.isReqtypeMasterIndeterminate();
  const AprMasterInderminate = this.isAprMasterIndeterminate();
  const AprlvlMasterInderminate = this.isAprlvlMasterIndeterminate();
  const GenReqEscMasterInderminate = this.isGenReqEscMasterIndeterminate();
  const AtdMasterInderminate = this.isAtdMasterIndeterminate();
  const ExpDocumentInderminate = this.isExpDocumentIndeterminate();
  const EmpAprListInderminate = this.isEmpAprListIndeterminate();
  const EmpRegAprListInderminate = this.isEmpRegAprListIndeterminate();
  const EndofSerInderminate = this.isEndofSerIndeterminate();
  const RegReqInderminate = this.isRegReqIndeterminate();
  const RegAprlvlInderminate = this.isRegAprlvlIndeterminate();
  const GratuityInderminate = this.isGratuityIndeterminate();




    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return employeeMasterIndeterminate || departmentMasterInderminate || designationMasterInderminate || categoryMasterInderminate|| 
    GenMasterInderminate|| ReqtypeMasterInderminate|| AprMasterInderminate|| AprlvlMasterInderminate || GenReqEscMasterInderminate || AtdMasterInderminate|| ExpDocumentInderminate ||
     EmpAprListInderminate || EmpRegAprListInderminate || EndofSerInderminate || RegReqInderminate || RegAprlvlInderminate ||
      GratuityInderminate || otherGroupIndeterminate;
}


issettings(): boolean {
  const branchMasterInderminate = this.isBranchMasterIndeterminate();
  const userMasterInderminate = this.isUserMasterIndeterminate();
  const userGroupMasterInderminate = this.isUserGroupingIndeterminate();
  const assignMasterInderminate = this.isAssignPermissionsIndeterminate();
  const stateMasterInderminate = this.isStateMasterIndeterminate();
  const documentMasterInderminate = this.isdocumenttypeIndeterminate();
  // const expiredMasterInderminate = this.isExpireddocumentsIndeterminate();
  const locationMasterInderminate = this.isloactionmasterIndeterminate();
  const DnMasterInderminate = this.isDnmasterIndeterminate();
  const CpMasterInderminate = this.isCpmasterIndeterminate();
  // const EmtMasterInderminate = this.isEmtmasterIndeterminate();

  // const FormdesMasterInderminate = this.isFormdesmasterIndeterminate();
  const ConfigMasterInderminate = this.isConfigmasterIndeterminate();
  const AnnounceInderminate = this.isAnnounceIndeterminate();
  const NotifyInderminate = this.isNotifyIndeterminate();


    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return branchMasterInderminate || userMasterInderminate || userGroupMasterInderminate || assignMasterInderminate||stateMasterInderminate || documentMasterInderminate || userGroupMasterInderminate ||locationMasterInderminate||
    DnMasterInderminate || CpMasterInderminate || ConfigMasterInderminate || AnnounceInderminate || NotifyInderminate || otherGroupIndeterminate;
}

isreports(): boolean {
  const emportReportInderminate = this.isEmployeeReportIndeterminate();
  const documentReportInderminate = this.isDocumentReportIndeterminate();
  const generalReportInderminate = this.isGeneralReportIndeterminate();
  const DeptReportInderminate = this.isDeptReportIndeterminate();
  const DesReportInderminate = this.isDesReportIndeterminate();
  const LeaveReportInderminate = this.isLeaveReportIndeterminate();
  const LeaveAprRepInderminate = this.isLeaveAprRepIndeterminate();
  const LeaveBalReportInderminate = this.isLeaveBalReportIndeterminate();
  const AttendReportInderminate = this.isAttendReportIndeterminate();
  const AssetReportInderminate = this.isAttendReportIndeterminate();
  const AssetTransReportInderminate = this.isAssetTransReportIndeterminate();

    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return emportReportInderminate || documentReportInderminate || 
    generalReportInderminate || DeptReportInderminate || DesReportInderminate || LeaveReportInderminate || LeaveAprRepInderminate || LeaveBalReportInderminate ||
    AttendReportInderminate || AssetReportInderminate || AssetTransReportInderminate || otherGroupIndeterminate;
}


isCustomization(): boolean {
  const EmpformInderminate = this.isEmpformIndeterminate();
  const AssetformInderminate = this.isAssetformIndeterminate();


    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return EmpformInderminate || AssetformInderminate || otherGroupIndeterminate;
}

iscalenders(): boolean {
  const addweekInderminate = this.isAddWeekIndeterminate();
  const assignweekInderminate = this.isAssignWeekIndeterminate();
  const addholidayInderminate = this.isAddHolidayIndeterminate();
  const assignholidayInderminate = this.isAssignHolidayIndeterminate();
  // const ShiftInderminate = this.isShiftIndeterminate();


  const otherGroupIndeterminate = false;
  return addweekInderminate || assignweekInderminate || addholidayInderminate || assignholidayInderminate || otherGroupIndeterminate;
}  

isLeaves(): boolean {
  const LeaveaprvInderminate = this.isLeaveaprvIndeterminate();
  const LeavetypeInderminate = this.isLeavetypeIndeterminate();
  const LeavemasterInderminate = this.isLeavemasterIndeterminate();
  const LeavereqInderminate = this.isLeavereqIndeterminate();
  const LeavecomInderminate = this.isLeavecomIndeterminate();
  const LeaveaprvlvlInderminate = this.isLeaveaprvlvlIndeterminate();
  // const LeaveaprvlvltempInderminate = this.isLeaveaprvlvltempIndeterminate();
  const LeaveBalanceInderminate = this.isLeaveBalanceIndeterminate();
  const LeaveCancelInderminate = this.isLeaveCancelIndeterminate();
  const LeaveAccrualInderminate = this.isLeaveAccrualIndeterminate();
  const LeaveRejoinInderminate = this.isLeaveRejoinIndeterminate();
  const LeaveEscalationInderminate = this.isLeaveEscalationIndeterminate();



  const otherGroupIndeterminate = false;
  return LeaveaprvInderminate || LeavetypeInderminate || LeaveEscalationInderminate || LeavemasterInderminate || LeavereqInderminate ||  LeavecomInderminate ||
   LeaveaprvlvlInderminate || LeaveRejoinInderminate || LeaveAccrualInderminate || LeaveBalanceInderminate || LeaveCancelInderminate || otherGroupIndeterminate;
} 

isPayrolls(): boolean {
  const PayrollrunIndeterminate = this.isPayrollrunIndeterminate();
  const SalarycomponentIndeterminate = this.isSalarycomponentIndeterminate();
  const PayslipAprvIndeterminate = this.isPayslipAprvIndeterminate();
  const isPayrollaprlvlIndeterminate = this.isPayrollaprlvlIndeterminate();
  const AdvanceSalaryAprvlstIndeterminate = this.isAdvanceSalaryAprvlstIndeterminate();
  const AdvanceSalaryReqInderminate = this.isAdvanceSalaryReqIndeterminate();
  const AdvanceSalaryAprlvlInderminate = this.isAdvanceSalaryAprlvlIndeterminate();
  const WpsInderminate = this.isWpsIndeterminate();
  const AdvanceSalaryEscalationInderminate = this.isAdvanceSalaryEscalationIndeterminate();

  const otherGroupIndeterminate = false;

  return PayrollrunIndeterminate || AdvanceSalaryEscalationInderminate || SalarycomponentIndeterminate || PayslipAprvIndeterminate || isPayrollaprlvlIndeterminate || AdvanceSalaryAprvlstIndeterminate || AdvanceSalaryReqInderminate || AdvanceSalaryAprlvlInderminate || WpsInderminate || otherGroupIndeterminate;
}


isLoans(): boolean {
  const LoanApprovalIndeterminate = this.isLoanApprovalIndeterminate();
  const LoanTypeIndeterminate = this.isLoanTypeIndeterminate();
  const LoanAprvlvlIndeterminate = this.isLoanAprvlvlIndeterminate();
  const LoanAppIndeterminate = this.isLoanAppIndeterminate();
  const LoanRepayIndeterminate = this.isLoanRepayIndeterminate();
  const LoanEscalationIndeterminate = this.isLoanEscalationIndeterminate();


  const otherGroupIndeterminate = false;

  return LoanApprovalIndeterminate || LoanEscalationIndeterminate || LoanTypeIndeterminate || LoanAprvlvlIndeterminate || LoanAppIndeterminate || LoanRepayIndeterminate  || otherGroupIndeterminate;
}


isAsset(): boolean {
  const AssetTypeIndeterminate = this.isAssetTypeIndeterminate();
  const AssetmasterIndeterminate = this.isAssetmasterIndeterminate();
  const AssetAlonIndeterminate = this.isAssetAlonIndeterminate();
  const AssetReqIndeterminate = this.isAssetReqIndeterminate();
  const AssetApprovalsIndeterminate = this.isAssetApprovalsIndeterminate();
  const AssetApprovallvlInderminate = this.isAssetApprovalLvlIndeterminate();
  const AssetEscalationInderminate = this.isAssetEscalationIndeterminate();

  const otherGroupIndeterminate = false;

  return AssetTypeIndeterminate || AssetEscalationInderminate || AssetmasterIndeterminate || AssetApprovalsIndeterminate || AssetAlonIndeterminate || AssetApprovallvlInderminate || AssetReqIndeterminate || otherGroupIndeterminate;
}


isDocumentAdd(): boolean {
  const DocumentAddFolInderminate = this.isDocumentAddFolIndeterminate();



    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return DocumentAddFolInderminate || otherGroupIndeterminate;
}


isProject(): boolean {
  const ProjectsIndeterminate = this.isProjectsIndeterminate();
  const ProjectStagesIndeterminate = this.isProjectStagesIndeterminate();
  const ProjectTaskIndeterminate = this.isProjectTaskIndeterminate();
  const ProjectTimeIndeterminate = this.isProjectTimeIndeterminate();
 

  const otherGroupIndeterminate = false;

  return ProjectsIndeterminate || ProjectStagesIndeterminate || ProjectTaskIndeterminate || ProjectTimeIndeterminate || otherGroupIndeterminate;
}

isAirTicket(): boolean {
  const AirTicketPolIndeterminate = this.isAirTicketPolIndeterminate();
  const AirTicketAlonIndeterminate = this.isAirTicketAlonIndeterminate();
  const AirTicketReqIndeterminate = this.isAirTicketReqIndeterminate();
  const AirTicketRuleIndeterminate = this.isAirTicketRuleIndeterminate();
  const AirTicketAprIndeterminate = this.isAirTicketAprIndeterminate();
  const AirTicketAprlvlIndeterminate = this.isAirTicketAprlvlIndeterminate();
  const AirTicketEscIndeterminate = this.isAirTicketEscIndeterminate();


  const otherGroupIndeterminate = false;

  return AirTicketPolIndeterminate || AirTicketEscIndeterminate || AirTicketAprlvlIndeterminate || AirTicketAlonIndeterminate || AirTicketAprIndeterminate || AirTicketReqIndeterminate || AirTicketRuleIndeterminate || otherGroupIndeterminate;
}

isDocument(): boolean {
  const DocumentAprlvlInderminate = this.isDocumentAprlvlIndeterminate();
  const DocumentAprInderminate = this.isDocumentAprIndeterminate();
  const DocumentReqInderminate = this.isDocumentReqIndeterminate();
  const DocumentTypeInderminate = this.isDocumentTypeIndeterminate();


  const otherGroupIndeterminate = false;

  return DocumentAprlvlInderminate || DocumentAprInderminate || DocumentReqInderminate || DocumentTypeInderminate || otherGroupIndeterminate;
} 

isEmailTemplate(): boolean {

  const GeneralReqTempInderminate = this.isGeneralReqTempIndeterminate();
  const LeaveEmTempInderminate = this.isLeaveEmTempIndeterminate();
  const DocExpTempInderminate = this.isDocExpTempIndeterminate();
  const DocReqTempInderminate = this.isDocReqTempIndeterminate();
  const AdvSalReqTempInderminate = this.isAdvSalReqTempIndeterminate();
  const LoanReqTempInderminate = this.isLoanReqTempIndeterminate();



  const otherGroupIndeterminate = false;

  return GeneralReqTempInderminate ||  LeaveEmTempInderminate || DocExpTempInderminate || DocReqTempInderminate ||
   AdvSalReqTempInderminate || LoanReqTempInderminate ||  otherGroupIndeterminate;
} 



isShift(): boolean {

  const ShiftsInderminate = this.isShiftsIndeterminate();
  const ShiftPatternInderminate = this.isShiftPatternIndeterminate();
  const ShiftEmployeeInderminate = this.isShiftEmployeeIndeterminate();
  const ShiftOverRideInderminate = this.isShiftOverRideIndeterminate();
  const OvertimePolicyInderminate = this.isOvertimePolicyIndeterminate();
  const EmpOverInderminate = this.isEmpOverIndeterminate();




  const otherGroupIndeterminate = false;

  return ShiftsInderminate || ShiftOverRideInderminate || ShiftEmployeeInderminate || ShiftPatternInderminate
   ||  EmpOverInderminate || OvertimePolicyInderminate || otherGroupIndeterminate;
} 





  onCheckboxChange(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateMasterCheckboxes();
  }

  
  onEmployeeMasterChange(): void {
    if (this.employeeMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmp.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmp.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.employeeMasterChecked;
      this.updateSelectAll();


  }


  onDepartmentMasterChange(): void {
    if (this.departmentMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDept.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDept.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.departmentMasterChecked;
 
  }

  onDesignationMasterChange(): void {
    if (this.designationMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDis.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDis.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.designationMasterChecked;

  }
  onCategoryMasterChange(): void {
    if (this.categoryMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsCat.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsCat.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onGenMasterChange(): void {
    if (this.GenMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsGen.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsGen.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onReqtypeMasterChange(): void {
    if (this.ReqtypeMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsReqtype.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsReqtype.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onAprMasterChange(): void {
    if (this.AprMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsApr.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsApr.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onAprlvlMasterChange(): void {
    if (this.AprlvlMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAprlvl.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAprlvl.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

    onGenReqEscMasterChange(): void {

    if (this.GenReqEscMasterChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsGenReqEsc.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsGenReqEsc.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onAtdMasterChange(): void {
    if (this.AtdMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAtd.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAtd.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }


  onExpDocumentChange(): void {
    if (this.ExpDocumentChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsExpDocument.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsExpDocument.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }


  onEmpOverChange(): void {
    if (this.EmpOverChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmpOver.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmpOver.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onEmpAprListChange(): void {
    if (this.EmpAprListChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmpAprList.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmpAprList.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onEmpRegAprListChange(): void {
    if (this.EmpRegAprListChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmpRegAprList.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmpRegAprList.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }


  onEndofSerChange(): void {
    if (this.EndofSerChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEndofSer.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEndofSer.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }


  onRegReqChange(): void {
    if (this.RegReqChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsRegReq.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsRegReq.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onRegAprlvlChange(): void {
    if (this.RegAprlvlChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsRegAprlvl.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsRegAprlvl.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }

  onGratuityChange(): void {
    if (this.GratuityChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsGratuity.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsGratuity.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }






  onBranchMasterChange(): void {
    if (this.branchMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsBrch.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsBrch.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.branchMasterChecked, this.GrouppermissionsBrch);
    // this.settingsChecked = this.branchMasterChecked;


  }

  onUserMasterChange(): void {
    if (this.userMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsUser.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsUser.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.userMasterChecked, this.GrouppermissionsUser);
    // this.settingsChecked = this.userMasterChecked;


  }

  onUsergroupingMasterChange(): void {
    if (this.usergroupingMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsUsergroup.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsUsergroup.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.usergroupingMasterChecked, this.GrouppermissionsUsergroup);
    // this.settingsChecked = this.usergroupingMasterChecked;


  }

  onUserAssignChange(): void {
    if (this.assignpermissionMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsassigneddUser.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsassigneddUser.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.assignpermissionMasterChecked, this.GrouppermissionsassigneddUser);
    // this.settingsChecked = this.assignpermissionMasterChecked;

  }
  onUserStateChange(): void {
    if (this.stationMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsstateMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsstateMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.stationMasterChecked, this.GrouppermissionsstateMaster);
    // this.settingsChecked = this.stationMasterChecked;


  }
  onUserDocumentChange(): void {
    if (this.documenttypeMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermissionsdocumentype.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermissionsdocumentype.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.documenttypeMasterChecked, this.Grouppermissionsdocumentype);
    // this.settingsChecked = this.documenttypeMasterChecked;


  }

  onUserLocationChange(): void {
    if (this.locationMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionslocationMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionslocationMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onUserDnChange(): void {
    if (this.DnMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDnMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDnMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onUserCpChange(): void {
    if (this.CpMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsCpMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsCpMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }


  onConfigChange(): void {
    if (this.ConfigMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsConfigMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsConfigMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }

 onAnnounceChange(): void {
    if (this.AnnounceMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAnnounceMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAnnounceMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onNotifyChange(): void {
    if (this.NotefyChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsNotify.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsNotify.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }
  
  onEmpReportChange(): void {
    if (this.emportReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsemployeeReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsemployeeReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.documenttypeMasterChecked, this.Grouppermissionsdocumentype);
    // this.settingsChecked = this.documenttypeMasterChecked;


  }
  onDocReportChange(): void {
    if (this.documentReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsdocumnetReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsdocumnetReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.expireddocumnetsMasterChecked, this.Grouppermissionsexpirydocuments);
    // this.settingsChecked = this.expireddocumnetsMasterChecked;


  }

    onLeaveBalReportChange(): void {
    if (this.LeaveBalReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveBalReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveBalReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.expireddocumnetsMasterChecked, this.Grouppermissionsexpirydocuments);
    // this.settingsChecked = this.expireddocumnetsMasterChecked;


  }
  onGenReportChange(): void {
    if (this.generelReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissiionsgeneralReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissiionsgeneralReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

    onDeptReportChange(): void {
    if (this.DeptReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissiionsDeptReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissiionsDeptReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }

    onDesReportChange(): void {
    if (this.DesReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissiionsDesReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissiionsDesReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }


  onLeaveReportChange(): void {
    if (this.LeaveReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissiionsLeaveReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissiionsLeaveReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }

  onAttendReportChange(): void {
    if (this.AttendReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAttendReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAttendReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }

  onAssetReportChange(): void {
    if (this.AssetReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAssetReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAssetReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }

    onAssetTransReportChange(): void {
    if (this.AssetTransReportChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAssetTransReport.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAssetTransReport.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }


  onLeaveAprRepChange(): void {
    if (this.LeaveAprRepChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissiionsLeaveAprRep.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissiionsLeaveAprRep.map(p => p.id).includes(permission));
    }
    this.updateReportCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;

  }


    onEmpformChange(): void {
    if (this.EmpformChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmpform.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmpform.map(p => p.id).includes(permission));
    }
    this.updateCustomizationCheckbox();
    // this.updateSelectedPermissions(this.documenttypeMasterChecked, this.Grouppermissionsdocumentype);
    // this.settingsChecked = this.documenttypeMasterChecked;


  }


    onAssetformChange(): void {
    if (this.AssetformChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAssetform.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAssetform.map(p => p.id).includes(permission));
    }
    this.updateCustomizationCheckbox();
    // this.updateSelectedPermissions(this.expireddocumnetsMasterChecked, this.Grouppermissionsexpirydocuments);
    // this.settingsChecked = this.expireddocumnetsMasterChecked;


  }



  onAddweekChange(): void {
    if (this.addweekChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermissionsaddweek.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermissionsaddweek.map(p => p.id).includes(permission));
    }
    this.updateCalenderCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onAssignweekChange(): void {
    if (this.assignweekChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermisionsassignweek.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermisionsassignweek.map(p => p.id).includes(permission));
    }
    this.updateCalenderCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onAddholidayChange(): void {
    if (this.addholidayChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermissionsaddholiday.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermissionsaddholiday.map(p => p.id).includes(permission));
    }
    this.updateCalenderCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onAssignholidayChange(): void {
    if (this.assignholidayChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermissionsassisgnholiday.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermissionsassisgnholiday.map(p => p.id).includes(permission));
    }
    this.updateCalenderCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }



  onLeaveaprvChange(): void {
    if (this.LeaveaprvChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveaprv.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveaprv.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onLeavetypeChange(): void {
    if (this.LeavetypeChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeavetype.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeavetype.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;
  }

    onLeaveEscalationChange(): void {
    if (this.LeaveEscalationChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveEscalation.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveEscalation.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onLeavemasterChange(): void {
    if (this.LeavemasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeavemaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeavemaster.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }


  onLeavereqChange(): void {
    if (this.LeavereqChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeavereq.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeavereq.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }


  onLeavecomChange(): void {
    if (this.LeavecomChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeavecom.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeavecom.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }


  onLeaveaprvlvlChange(): void {
    if (this.LeaveaprvlvlChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveaprvlvl.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveaprvlvl.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

    onLeaveBalanceChange(): void {
    if (this.LeaveBalanceChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveBalance.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveBalance.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onLeaveCancelChange(): void {
    if (this.LeaveCancelChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveCancel.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveCancel.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

    onLeaveAccrualChange(): void {
    if (this.LeaveAccrualChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveAccrual.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveAccrual.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

    onLeaveRejoinChange(): void {
    if (this.LeaveRejoinChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveRejoin.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveRejoin.map(p => p.id).includes(permission));
    }
    this.updateLeaveCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onPayrollrunChange(): void {
  if (this.PayrollrunChecked) {
    this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsPayrollrun.map(p => p.id));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      permission => !this.GrouppermissionsPayrollrun.map(p => p.id).includes(permission)
    );
  }
  this.updatePayrollCheckbox();
}

onSalarycomponentChange(): void {
  if (this.SalarycomponentChecked) {
    this.selectedPermissions = this.selectedPermissions.concat(
      this.GrouppermissionsSalarycomponent.map(permission => permission.id)
    );
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      permission => !this.GrouppermissionsSalarycomponent.map(p => p.id).includes(permission)
    );
  }
  this.updatePayrollCheckbox();
}

onPayslipAprvChange(): void {
  if (this.PayslipAprvChecked) {
    const idsToAdd = this.GrouppermissionsPayslipAprv.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsPayslipAprv.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}


onPayrollaprlvlChange(): void {
  if (this.PayrollaprlvlChecked) {
    this.selectedPermissions = this.selectedPermissions.concat(
      this.GrouppermissionsPayrollaprlvl.map(permission => permission.id)
    );
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      permission => !this.GrouppermissionsPayrollaprlvl.map(p => p.id).includes(permission)
    );
  }
  this.updatePayrollCheckbox();
}

onAdvanceSalaryAprvlstChange(): void {
  if (this.AdvanceSalaryAprvlstChecked) {
    const idsToAdd = this.GrouppermissionsAdvanceSalaryAprvlst.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAdvanceSalaryAprvlst.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}

onAdvanceSalaryReqChange(): void {
  if (this.AdvanceSalaryReqChecked) {
    const idsToAdd = this.GrouppermissionsAdvanceSalaryReq.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAdvanceSalaryReq.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}

onAdvanceSalaryEscalationChange(): void {
  if (this.AdvanceSalaryEscalationChecked) {
    const idsToAdd = this.GrouppermissionsAdvanceSalaryEscalation.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAdvanceSalaryEscalation.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}


onAdvanceSalaryAprlvlChange(): void {
  if (this.AdvanceSalaryAprlvlChecked) {
    const idsToAdd = this.GrouppermissionsAdvanceSalaryAprlvl.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAdvanceSalaryAprlvl.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}


onWpsChange(): void {
  if (this.WpsChecked) {
    const idsToAdd = this.GrouppermissionsWps.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsWps.some(p => p.id === id)
    );
  }
  this.updatePayrollCheckbox();
}

onLoanApprovalChange(): void {
  if (this.LoanApprovalChecked) {
    const idsToAdd = this.GrouppermissionsLoanApproval.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanApproval.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}


onLoanTypeChange(): void {
  if (this.LoanTypeChecked) {
    const idsToAdd = this.GrouppermissionsLoanType.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanType.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}

onLoanRepayChange(): void {
  if (this.LoanRepayChecked) {
    const idsToAdd = this.GrouppermissionsLoanRepay.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanRepay.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}

onLoanAprvlvlChange(): void {
  if (this.LoanAprvlvlChecked) {
    const idsToAdd = this.GrouppermissionsLoanAprvlvl.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanAprvlvl.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}

onLoanEscalationChange(): void {
  if (this.LoanEscalationChecked) {
    const idsToAdd = this.GrouppermissionsLoanEscalation.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanEscalation.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}

onLoanAppChange(): void {
  if (this.LoanAppChecked) {
    const idsToAdd = this.GrouppermissionsLoanApp.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsLoanApp.some(p => p.id === id)
    );
  }
  this.updateLoanCheckbox();
}


onAssetTypeChange(): void {
  if (this.AssetTypeChecked) {
    const idsToAdd = this.GrouppermissionsAssetType.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetType.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetApprovalsChange(): void {
  if (this.AssetApprovalsChecked) {
    const idsToAdd = this.GrouppermissionsAssetApprovals.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetApprovals.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetApprovalLvlChange(): void {
  if (this.AssetApprovallvlChecked) {
    const idsToAdd = this.GrouppermissionsAssetApprovallvl.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetApprovallvl.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetEscalationChange(): void {
  if (this.AssetEscalationChecked) {
    const idsToAdd = this.GrouppermissionsAssetEscalation.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetEscalation.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetmasterChange(): void {
  if (this.AssetmasterChecked) {
    const idsToAdd = this.GrouppermissionsAssetmaster.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetmaster.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetAlonChange(): void {
  if (this.AssetAlonChecked) {
    const idsToAdd = this.GrouppermissionsAssetAlon.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetAlon.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}

onAssetReqChange(): void {
  if (this.AssetReqChecked) {
    const idsToAdd = this.GrouppermissionsAssetReq.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAssetReq.some(p => p.id === id)
    );
  }
  this.updateAssetCheckbox();
}


onDocumentAddFolChange(): void {
  if (this.DocumentAddFolChecked) {
    const idsToAdd = this.GrouppermissionsDocumentAddFol.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsDocumentAddFol.some(p => p.id === id)
    );
  }
  this.updateDocumentAddCheckbox();
}

onProjectsChange(): void {
  if (this.ProjectsChecked) {
    const idsToAdd = this.GrouppermissionsProjects.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsProjects.some(p => p.id === id)
    );
  }
  this.updateProjectCheckbox();
}

onProjectStagesChange(): void {
  if (this.ProjectStagesChecked) {
    const idsToAdd = this.GrouppermissionsProjectStages.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsProjectStages.some(p => p.id === id)
    );
  }
  this.updateProjectCheckbox();
}

onProjectTaskChange(): void {
  if (this.ProjectTaskChecked) {
    const idsToAdd = this.GrouppermissionsProjectTask.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsProjectTask.some(p => p.id === id)
    );
  }
  this.updateProjectCheckbox();
}

onProjectTimeChange(): void {
  if (this.ProjectTimeChecked) {
    const idsToAdd = this.GrouppermissionsProjectTime.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsProjectTime.some(p => p.id === id)
    );
  }
  this.updateProjectCheckbox();
}

onAirTicketPolChange(): void {
  if (this.AirTicketPolChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketPol.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketPol.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}

onAirTicketAprChange(): void {
  if (this.AirTicketAprChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketApr.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketApr.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}

onAirTicketAprlvlChange(): void {
  if (this.AirTicketAprlvlChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketAprlvl.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketAprlvl.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}

onAirTicketEscChange(): void {
  if (this.AirTicketEscChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketEsc.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketEsc.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}

onAirTicketAlonChange(): void {
  if (this.AirTicketAlonChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketAlon.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketAlon.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}

onAirTicketReqChange(): void {
  if (this.AirTicketReqChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketReq.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketReq.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}


onAirTicketRuleChange(): void {
  if (this.AirTicketRuleChecked) {
    const idsToAdd = this.GrouppermissionsAirTicketRule.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsAirTicketRule.some(p => p.id === id)
    );
  }
  this.updateAirTicketCheckbox();
}


  onDocumentAprlvlChange(): void {
    if (this.DocumentAprlvlChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocumentAprlvl.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocumentAprlvl.map(p => p.id).includes(permission));
    }
    this.updateDocumentAprlvlCheckbox();

  }


    onDocumentAprChange(): void {

    if (this.DocumentAprChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocumentApr.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocumentApr.map(p => p.id).includes(permission));
    }
    this.updateDocumentAprCheckbox();

  }


  onDocumentReqChange(): void {

    if (this.DocumentReqChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocumentReq.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocumentReq.map(p => p.id).includes(permission));
    }
    this.updateDocumentReqCheckbox();

  }

  onDocumentTypeChange(): void {

  if (this.DocumentTypeChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocumentType.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocumentType.map(p => p.id).includes(permission));
    }
    this.updateDocumentTypeCheckbox();

  }


  
 onGeneralReqTempChange(): void {

  if (this.GeneralReqTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsGeneralReqTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsGeneralReqTemp.map(p => p.id).includes(permission));
    }
    this.updateGeneralReqTempCheckbox();

  }
  
onLeaveEmTempChange(): void {

  if (this.LeaveEmTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveEmTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveEmTemp.map(p => p.id).includes(permission));
    }
    this.updateLeaveEmTempCheckbox();

  }

onDocExpTempChange(): void {

  if (this.DocExpTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocExpTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocExpTemp.map(p => p.id).includes(permission));
    }
    this.updateDocExpTempCheckbox();

  }

onDocReqTempChange(): void {

  if (this.DocReqTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsDocReqTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsDocReqTemp.map(p => p.id).includes(permission));
    }
    this.updateDocReqTempCheckbox();

  }

onAdvSalReqTempChange(): void {

  if (this.AdvSalReqTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsAdvSalReqTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsAdvSalReqTemp.map(p => p.id).includes(permission));
    }
    this.updateAdvSalReqTempCheckbox();

  }

onLoanReqTempChange(): void {

  if (this.LoanReqTempChecked) {

      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLoanReqTemp.map(permission => permission.id));
   } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLoanReqTemp.map(p => p.id).includes(permission));
    }
    this.updateLoanReqTempCheckbox();

  }


  // Shifts 


 onShiftsChange(): void {
  if (this.ShiftsChecked) {
    const idsToAdd = this.GrouppermissionsShifts.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsShifts.some(p => p.id === id)
    );
  }
  this.updateShiftCheckbox();
}


 onShiftPatternChange(): void {
  if (this.ShiftPatternChecked) {
    const idsToAdd = this.GrouppermissionsShiftPattern.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsShiftPattern.some(p => p.id === id)
    );
  }
  this.updateShiftCheckbox();
}

 onShiftEmployeeChange(): void {
  if (this.ShiftEmployeeChecked) {
    const idsToAdd = this.GrouppermissionsShiftEmployee.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsShiftEmployee.some(p => p.id === id)
    );
  }
  this.updateShiftCheckbox();
}


 onShiftOverRideChange(): void {
  if (this.ShiftOverRideChecked) {
    const idsToAdd = this.GrouppermissionsShiftOverRide.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsShiftOverRide.some(p => p.id === id)
    );
  }
  this.updateShiftCheckbox();
}

 onOverTimePolicyChange(): void {
  if (this.OvertimePolicyChecked) {
    const idsToAdd = this.GrouppermissionsOverTimePolicy.map(p => p.id);
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...idsToAdd]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(
      id => !this.GrouppermissionsOverTimePolicy.some(p => p.id === id)
    );
  }
  this.updateShiftCheckbox();
}












// Update Checkbox Sections


updateSettingsCheckbox(): void {
    this.settingsChecked = this.isSettingsMasterChecked();
}


updateReportCheckbox(): void {
    this.reportchecked = this.isReportManagementMasterChecked();
}

updateCustomizationCheckbox(): void {
    this.customizationchecked = this.isCustomizationManagementMasterChecked();
}
   
   

updateCalenderCheckbox(): void {
    this.calenderchecked = this.isCalenderMangementMasterChecked();
}


updateLeaveCheckbox(): void {
    this.Leavechecked = this.isLeaveMangementMasterChecked();
}

  updatePayrollCheckbox(): void {
  this.Payrollchecked = this.isPayrollManagementMasterChecked();
}

  updateLoanCheckbox(): void {
  this.Loanchecked = this.isLoanManagementMasterChecked();
}

  updateAssetCheckbox(): void {
  this.Assetchecked = this.isAssetManagementMasterChecked();
}

  updateDocumentAddCheckbox(): void {
  this.DocumentAddchecked = this.isDocumentAddManagementMasterChecked();
}

  updateProjectCheckbox(): void {
  this.Projectchecked = this.isProjectManagementMasterChecked();
}

  updateAirTicketCheckbox(): void {
  this.AirTicketchecked = this.isAirTicketManagementMasterChecked();
}

updateDocumentCheckbox(): void {
this.Documentchecked = this.isDocumentMangementMasterChecked();
}

updateEmailTemplateCheckbox(): void {
this.EmailTemplatechecked = this.isEmailTemplateMangementMasterChecked();
}

updateShiftCheckbox(): void {
  this.Shiftchecked = this.isShiftManagementMasterChecked();
}








 

 





  // Select Sections

  selectAll(): void {
  const allPermissions = [
    ...this.GrouppermissionsEmp,
    ...this.GrouppermissionsDept,
    ...this.GrouppermissionsCat,
    ...this.GrouppermissionsDis,
    ...this.GrouppermissionsGen,
    ...this.GrouppermissionsReqtype,
    ...this.GrouppermissionsApr,
    ...this.GrouppermissionsAprlvl,
    ...this.GrouppermissionsGenReqEsc,
    ...this.GrouppermissionsAtd,
    ...this.GrouppermissionsExpDocument,
    ...this.GrouppermissionsEmpAprList,
    ...this.GrouppermissionsEmpRegAprList,
    ...this.GrouppermissionsEndofSer,
    ...this.GrouppermissionsRegReq,
    ...this.GrouppermissionsRegAprlvl,
    ...this.GrouppermissionsGratuity,




    
  ].map(permission => permission.id);

  if (this.selectAllChecked) {
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
  }
  this.updateEmployeeMasterCheckbox();
  this.updateDepartmentMasterCheckbox();
  this.updateDesgnationMasterCheckbox();
  this.updateCategoryMasterCheckbox();
  this.updateGenMasterCheckbox();
  this.updateReqtypeMasterCheckbox();
  this.updateAprMasterCheckbox();
  this.updateAprlvlMasterCheckbox();
  this.updateGenReqEscMasterCheckbox();
  this.updateAtdMasterCheckbox();
  this.updateExpDocumentCheckbox();
  this.updateEmpAprListCheckbox();
  this.updateEmpRegAprListCheckbox();
  this.updateEndofSerCheckbox();
  this.updateRegReqCheckbox();
  this.updateRegAprlvlCheckbox();
  this.updateGratuityCheckbox();





  this.updateEmployeeManagementCheckbox();
}


    selectAlls(): void {
    const allPermissions = [
      ...this.GrouppermissionsBrch,
      ...this.GrouppermissionsUser,
      ...this.GrouppermissionsUsergroup,
      ...this.GrouppermissionsassigneddUser,
      ...this.GrouppermissionsstateMaster,
      ...this.Grouppermissionsdocumentype,
      ...this.GrouppermissionslocationMaster,
      ...this.GrouppermissionsDnMaster,
      ...this.GrouppermissionsCpMaster,
      ...this.GrouppermissionsConfigMaster,
      ...this.GrouppermissionsAnnounceMaster,
      ...this.GrouppermissionsNotify,


      
    ].map(permission => permission.id);
  
    if (this.settingsChecked) {
      this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
    }
    this.updateBranchCheckbox();
    this.updateuserMasterCheckbox();
    this.updateUsergroupMasterCheckbox();
    this.updateStateMasterCheckbox();
    this.updateassignMasterCheckbox();
    this.updatedoctypeMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateCpMasterCheckbox();
    this.updateConfigMasterCheckbox();
    this.updateAnnounceMasterCheckbox();
    this.updateNotifyCheckbox();

    this.updateSettingsCheckbox();
  }


  selectReport(): void {
    const allPermissions = [
      ...this.GrouppermissionsemployeeReport,
      ...this.GrouppermissionsdocumnetReport,
      ...this.GrouppermissiionsgeneralReport,
      ...this.GrouppermissiionsDeptReport,
      ...this.GrouppermissiionsDesReport,
      ...this.GrouppermissiionsLeaveReport,
      ...this.GrouppermissiionsLeaveAprRep,
      ...this.GrouppermissionsLeaveBalReport,
      ...this.GrouppermissionsAttendReport,
      ...this.GrouppermissionsAssetReport,
      ...this.GrouppermissionsAssetTransReport,

    ].map(permission => permission.id);
  
    if (this.reportchecked) {
      this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
    }
  
    this.updateEmpReportCheckbox();
    this.updatedocReportCheckbox();
    this.updateGenReportCheckbox();
    this.updateDeptReportCheckbox();
    this.updateDesReportCheckbox();
    this.updateLeaveReportCheckbox();
    this.updateLeaveAprRepCheckbox();
    this.updateLeaveBalReportCheckbox();
    this.updateAttendReportCheckbox();
    this.updateAssetReportCheckbox();
    this.updateAssetTransReportCheckbox();



    this.updateReportCheckbox();
  }



selectCustomization(): void {
    const allPermissions = [
      ...this.GrouppermissionsEmpform,
      ...this.GrouppermissionsAssetform
    


    ].map(permission => permission.id);
  
    if (this.customizationchecked) {
      this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
    }
  
    this.updateEmpformCheckbox();
    this.updateAssetformCheckbox();

}


selectCalender(): void {
  const allPermissions = [
    ...this.Grouppermissionsaddweek,
    ...this.Grouppermisionsassignweek,
    ...this.Grouppermissionsaddholiday,
    ...this.Grouppermissionsassisgnholiday,
    // ...this.GrouppermissionsShift,

  ].map(permission => permission.id);

  if (this.calenderchecked) {
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
  }

  this.updateAddWeekCheckbox();
  this.updateAddHolidayCheckbox();
  this.updateAssignHolidayCheckbox();
  this.updateAssignweekCheckbox();
  this.updateCalenderCheckbox();
  this.updateShiftCheckbox();

}


selectLeave(): void {
  const allPermissions = [
    ...this.GrouppermissionsLeaveaprv,
    ...this.GrouppermissionsLeavetype,
    ...this.GrouppermissionsLeavemaster,
    ...this.GrouppermissionsLeavereq,
    ...this.GrouppermissionsLeavecom,
    ...this.GrouppermissionsLeaveaprvlvl,
    // ...this.GrouppermissionsLeaveaprvlvltemp,
    ...this.GrouppermissionsLeaveBalance,
    ...this.GrouppermissionsLeaveCancel,
    ...this.GrouppermissionsLeaveAccrual,
    ...this.GrouppermissionsLeaveRejoin,
    ...this.GrouppermissionsLeaveEscalation,

    // ...this.Grouppermisionsassignweek,
    // ...this.Grouppermissionsaddholiday,
    // ...this.Grouppermissionsassisgnholiday
  ].map(permission => permission.id);

  if (this.Leavechecked) {
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
  }

  this.updateLeaveaprvCheckbox();

  this.updateLeavetypeCheckbox();
  this.updateLeavemasterCheckbox();
  this.updateLeavereqCheckbox();
  this.updateLeavecomCheckbox();
  this.updateLeaveaprvlvlCheckbox();
  // this.updateLeaveaprvlvltempCheckbox();
  this.updateLeaveBalanceCheckbox();
  this.updateLeaveCancelCheckbox();
  this.updateLeaveAccrualCheckbox();
  this.updateLeaveRejoinCheckbox();
  this.updateLeaveEscalationCheckbox();


}


selectPayroll(): void {
  const allPermissions = [
    ...this.GrouppermissionsPayrollrun,
    ...this.GrouppermissionsSalarycomponent,
    ...this.GrouppermissionsPayslipAprv,
    ...this.GrouppermissionsPayrollaprlvl,
    ...this.GrouppermissionsAdvanceSalaryAprvlst,
    ...this.GrouppermissionsAdvanceSalaryReq,
    ...this.GrouppermissionsAdvanceSalaryAprlvl,
    ...this.GrouppermissionsWps,
    ...this.GrouppermissionsAdvanceSalaryEscalation,
  ].map(permission => permission.id);

  if (this.Payrollchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updatePayrollrunCheckbox();
  this.updateSalarycomponentCheckbox();
  this.updatePayslipAprvCheckbox();
  this.updatePayrollaprlvlCheckbox();
  this.updateAdvanceSalaryAprvlstCheckbox();
  this.updateAdvanceSalaryReqCheckbox();
  this.updateAdvanceSalaryAprlvlCheckbox();
  this.updateWpsCheckbox();
  this.updateAdvanceSalaryEscalationCheckbox();
}


selectLoan(): void {
  const allPermissions = [
    ...this.GrouppermissionsLoanApproval,
    ...this.GrouppermissionsLoanType,
    ...this.GrouppermissionsLoanAprvlvl,
    ...this.GrouppermissionsLoanApp,
    ...this.GrouppermissionsLoanRepay,
    ...this.GrouppermissionsLoanEscalation,

  ].map(permission => permission.id);

  if (this.Loanchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateLoanApprovalCheckbox();
  this.updateLoanTypeCheckbox();
  this.updateLoanAprvlvlCheckbox();
  this.updateLoanAppCheckbox();
  this.updateLoanRepayCheckbox();
  this.updateLoanEscalationCheckbox();
 
}


selectAsset(): void {
  const allPermissions = [
    ...this.GrouppermissionsAssetType,
    ...this.GrouppermissionsAssetmaster,
    ...this.GrouppermissionsAssetAlon,
    ...this.GrouppermissionsAssetReq,
    ...this.GrouppermissionsAssetApprovals,
    ...this.GrouppermissionsAssetApprovallvl,
    ...this.GrouppermissionsAssetEscalation,


  ].map(permission => permission.id);

  if (this.Assetchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateAssetTypeCheckbox();
  this.updateAssetmasterCheckbox();
  this.updateAssetAlonCheckbox();
  this.updateAssetReqCheckbox();
  this.updateAssetApprovalsCheckbox();
  this.updateAssetApprovalLvlCheckbox();
  this.updateAssetEscalationCheckbox();

 
}

selectDocumentAdd(): void {
  const allPermissions = [
    ...this.GrouppermissionsDocumentAddFol,



  ].map(permission => permission.id);

  if (this.DocumentAddchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateDocumentAddFolCheckbox();


 
}

selectProject(): void {
  const allPermissions = [
    ...this.GrouppermissionsProjects,
    ...this.GrouppermissionsProjectStages,
    ...this.GrouppermissionsProjectTask,
    ...this.GrouppermissionsProjectTime,
   


  ].map(permission => permission.id);

  if (this.Projectchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateProjectsCheckbox();
  this.updateProjectStagesCheckbox();
  this.updateProjectTaskCheckbox();
  this.updateProjectTimeCheckbox();


 
}

selectAirTicket(): void {
  const allPermissions = [
    ...this.GrouppermissionsAirTicketPol,
    ...this.GrouppermissionsAirTicketAlon,
    ...this.GrouppermissionsAirTicketReq,
    ...this.GrouppermissionsAirTicketRule,
    ...this.GrouppermissionsAirTicketApr,
    ...this.GrouppermissionsAirTicketAprlvl,
    ...this.GrouppermissionsAirTicketEsc,

   


  ].map(permission => permission.id);

  if (this.AirTicketchecked) {
    // Select all payroll permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all payroll permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateAirTicketPolCheckbox();
  this.updateAirTicketAlonCheckbox();
  this.updateAirTicketReqCheckbox();
  this.updateAirTicketRuleCheckbox();
  this.updateAirTicketAprCheckbox();
  this.updateAirTicketAprlvlCheckbox();
  this.updateAirTicketEscCheckbox();
 
}

selectDocumnet(): void {
  const allPermissions = [
    ...this.GrouppermissionsDocumentAprlvl,
    ...this.GrouppermissionsDocumentApr,
    ...this.GrouppermissionsDocumentReq,
    ...this.GrouppermissionsDocumentType,



  ].map(permission => permission.id);

  if (this.Documentchecked) {
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
  }

  this.updateDocumentAprlvlCheckbox();
  this.updateDocumentAprCheckbox();
  this.updateDocumentReqCheckbox();
  this.updateDocumentTypeCheckbox();
  
}


selectEmailTemplate(): void {
  const allPermissions = [
    ...this.GrouppermissionsGeneralReqTemp,
    ...this.GrouppermissionsLeaveEmTemp,
    ...this.GrouppermissionsDocExpTemp,
    ...this.GrouppermissionsDocReqTemp,
    ...this.GrouppermissionsAdvSalReqTemp,
    ...this.GrouppermissionsLoanReqTemp,




  ].map(permission => permission.id);

  if (this.EmailTemplatechecked) {
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
  }

  this.updateGeneralReqTempCheckbox();
  this.updateLeaveEmTempCheckbox();
  this.updateDocExpTempCheckbox();
  this.updateDocReqTempCheckbox();
  this.updateAdvSalReqTempCheckbox();
  this.updateLoanReqTempCheckbox();

  
}

selectShift(): void {
  const allPermissions = [
    ...this.GrouppermissionsShifts,
    ...this.GrouppermissionsShiftPattern,
    ...this.GrouppermissionsShiftEmployee,
    ...this.GrouppermissionsShiftOverRide,
    ...this.GrouppermissionsOverTimePolicy,
    ...this.GrouppermissionsEmpOver,
    

   


  ].map(permission => permission.id);

  if (this.Shiftchecked) {
    // Select all Shift permissions
    this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
  } else {
    // Deselect all Shift permissions
    this.selectedPermissions = this.selectedPermissions.filter(p => !allPermissions.includes(p));
  }

  this.updateShiftsCheckbox();
  this.updateShiftPatternCheckbox();
  this.updateShiftEmployeeCheckbox();
  this.updateShiftOverRideCheckbox();
  this.updateOverTimePolicyCheckbox();
  this.updateEmpOverCheckbox();



 
}







// update sections

updateSelectAll(): void {
  this.updateIndeterminateStates();
  this.updateEmployeeMasterCheckbox();
  this.updateDepartmentMasterCheckbox();
  this.updateDesgnationMasterCheckbox();
  this.updateCategoryMasterCheckbox();
  this.updateGenMasterCheckbox();
  this.updateReqtypeMasterCheckbox();
  this.updateAprMasterCheckbox();
  this.updateAprlvlMasterCheckbox();
  this.updateGenReqEscMasterCheckbox();
  this.updateAtdMasterCheckbox();
  this.updateExpDocumentCheckbox();
  this.updateEmpAprListCheckbox();
  this.updateEmpRegAprListCheckbox();
  this.updateEndofSerCheckbox();
  this.updateRegReqCheckbox();
  this.updateRegAprlvlCheckbox();
  this.updateGratuityCheckbox();






  this.updateEmployeeManagementCheckbox();

 




 
}


updateSelectAlls():void{
    this.updateBranchCheckbox();
    this.updateuserMasterCheckbox();
    this.updateUsergroupMasterCheckbox();
    this.updateStateMasterCheckbox();
    this.updateassignMasterCheckbox();
    this.updatedoctypeMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateCpMasterCheckbox();
    this.updateConfigMasterCheckbox();
    this.updateAnnounceMasterCheckbox();
    this.updateNotifyCheckbox();
    this.updateSettingsCheckbox();
    this.updateIndeterminateStatesvalue();
}

updateReport(): void {
  this.updateReportCheckbox();
  this.updateEmpReportCheckbox();
  this.updatedocReportCheckbox();
  this.updateGenReportCheckbox();
  this.updateDeptReportCheckbox();
  this.updateDesReportCheckbox();
  this.updateLeaveReportCheckbox();
  this.updateLeaveAprRepCheckbox();
  this.updateLeaveBalReportCheckbox();
  this.updateAttendReportCheckbox();
  this.updateAssetReportCheckbox();
  this.updateAssetTransReportCheckbox();
  this.updateIndeterminateReports();
}

updateCustomization(): void {
  this.updateEmpformCheckbox();
  this.updateAssetformCheckbox();
}


updateCalender():void{
  this.updateAddHolidayCheckbox();
  this.updateAssignHolidayCheckbox();
  this.updateAddWeekCheckbox();
  this.updateAssignweekCheckbox();
  this.updateShiftCheckbox();
  this.updateInderminateCalenders();
  this.updateCalenderCheckbox();

}

updateLeave():void{
  this.updateLeaveaprvCheckbox();
  this.updateLeavetypeCheckbox();
  this.updateLeavemasterCheckbox();
  this.updateLeavereqCheckbox();
  this.updateLeavecomCheckbox();
  this.updateLeaveaprvlvlCheckbox();
  // this.updateLeaveaprvlvltempCheckbox();
  this.updateInderminateLeave();
  this.updateLeaveCheckbox();
  this.updateLeaveBalanceCheckbox();
  this.updateLeaveCancelCheckbox();
  this.updateLeaveAccrualCheckbox();
  this.updateLeaveRejoinCheckbox();
  this.updateLeaveEscalationCheckbox();

}


updatePayroll():void{
  this.updatePayrollrunCheckbox();
  this.updateSalarycomponentCheckbox();
  this.updatePayslipAprvCheckbox();
  this.updatePayrollaprlvlCheckbox();
  this.updateAdvanceSalaryAprvlstCheckbox();
  this.updateAdvanceSalaryReqCheckbox();
  this.updateAdvanceSalaryAprlvlCheckbox();
  this.updateWpsCheckbox();
  this.updateAdvanceSalaryEscalationCheckbox();

}


updateLoan():void{
  this.updateLoanApprovalCheckbox();
  this.updateLoanTypeCheckbox();
  this.updateLoanAprvlvlCheckbox();
  this.updateLoanAppCheckbox();
  this.updateLoanRepayCheckbox();
  this.updateLoanEscalationCheckbox();
  

}

updateAsset():void{
  this.updateAssetTypeCheckbox();
  this.updateAssetmasterCheckbox();
  this.updateAssetAlonCheckbox();
  this.updateAssetReqCheckbox();
  this.updateAssetApprovalsCheckbox();
  this.updateAssetApprovalLvlCheckbox();
  this.updateAssetEscalationCheckbox();
}

updateDocumentAdd():void{
  this.updateDocumentAddFolCheckbox();

}

updateProject():void{
  this.updateProjectsCheckbox();
  this.updateProjectStagesCheckbox();
  this.updateProjectTaskCheckbox();
  this.updateProjectTimeCheckbox();

}

updateAirTicket():void{
  this.updateAirTicketPolCheckbox();
  this.updateAirTicketAlonCheckbox();
  this.updateAirTicketReqCheckbox();
  this.updateAirTicketRuleCheckbox();
  this.updateAirTicketAprCheckbox();
  this.updateAirTicketAprlvlCheckbox();
  this.updateAirTicketEscCheckbox();
}

updateDocument():void{

  this.updateDocumentAprlvlCheckbox();
  this.updateDocumentAprCheckbox();
  this.updateDocumentReqCheckbox();
  this.updateDocumentTypeCheckbox();


}

updateEmailTemplate():void{

  this.updateGeneralReqTempCheckbox();
  this.updateLeaveEmTempCheckbox();
  this.updateDocExpTempCheckbox();
  this.updateDocReqTempCheckbox();
  this.updateAdvSalReqTempCheckbox();
  this.updateLoanReqTempCheckbox();
  
  
  



}


updateShift():void{

  this.updateShiftsCheckbox();
  this.updateShiftPatternCheckbox();
  this.updateShiftEmployeeCheckbox();
  this.updateShiftOverRideCheckbox();
  this.updateOverTimePolicyCheckbox();
  this.updateEmpOverCheckbox();

  
  
  



}







// is Interminate Sections


  isIndeterminates(): boolean {
    const hasSelectedPermissions = [
      ...this.GrouppermissionsBrch,
      ...this.GrouppermissionsUser,
      ...this.GrouppermissionsUsergroup,
      ...this.GrouppermissionsassigneddUser,
      ...this.GrouppermissionsstateMaster,
      ...this.Grouppermissionsdocumentype,
      ...this.GrouppermissionslocationMaster,
      ...this.GrouppermissionsDnMaster,
      ...this.GrouppermissionsCpMaster,
      ...this.GrouppermissionsConfigMaster,
      ...this.GrouppermissionsAnnounceMaster,
      ...this.GrouppermissionsNotify,


    ].some(permission => this.selectedPermissions.includes(permission.id));
      return hasSelectedPermissions && !this.isSettingsMasterChecked();

   
  }


isReportInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsemployeeReport,
    ...this.GrouppermissionsdocumnetReport,
    ...this.GrouppermissiionsgeneralReport,
    ...this.GrouppermissiionsDeptReport,
    ...this.GrouppermissiionsDesReport,
    ...this.GrouppermissiionsLeaveReport,
    ...this.GrouppermissiionsLeaveAprRep,
    ...this.GrouppermissionsLeaveBalReport,
    ...this.GrouppermissionsAttendReport,
    ...this.GrouppermissionsAssetReport,
    ...this.GrouppermissionsAssetTransReport,

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isReportManagementMasterChecked();
}

isCustomizationInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsEmpform,
    ...this.GrouppermissionsAssetform

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isCustomizationManagementMasterChecked();
}


isCalenderInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.Grouppermissionsaddweek,
    ...this.Grouppermisionsassignweek,
    ...this.Grouppermissionsaddholiday,
    ...this.Grouppermissionsassisgnholiday,
    // ...this.GrouppermissionsShift

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isCalenderMangementMasterChecked();
}



isLeaveInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsLeaveaprv,
    ...this.GrouppermissionsLeavetype,
    ...this.GrouppermissionsLeavemaster,
    ...this.GrouppermissionsLeavereq,
    ...this.GrouppermissionsLeavecom,
    ...this.GrouppermissionsLeaveaprvlvl,
    // ...this.GrouppermissionsLeaveaprvlvltemp,
    ...this.GrouppermissionsLeaveBalance,
    ...this.GrouppermissionsLeaveCancel,
    ...this.GrouppermissionsLeaveAccrual,
    ...this.GrouppermissionsLeaveRejoin,
    ...this.GrouppermissionsLeaveEscalation,

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isLeaveMangementMasterChecked();
}



isPayrollInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsPayrollrun,
    ...this.GrouppermissionsSalarycomponent,
    ...this.GrouppermissionsPayslipAprv,
    ...this.GrouppermissionsPayrollaprlvl,
    ...this.GrouppermissionsAdvanceSalaryAprvlst,
    ...this.GrouppermissionsAdvanceSalaryReq,
    ...this.GrouppermissionsAdvanceSalaryAprlvl,
    ...this.GrouppermissionsWps,
    ...this.GrouppermissionsAdvanceSalaryEscalation,

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isPayrollManagementMasterChecked();
}

isLoanInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsLoanApproval,
    ...this.GrouppermissionsLoanType,
    ...this.GrouppermissionsLoanAprvlvl,
    ...this.GrouppermissionsLoanApp,
    ...this.GrouppermissionsLoanRepay,
    ...this.GrouppermissionsLoanEscalation,
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isLoanManagementMasterChecked();
}


isAssetInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsAssetType,
    ...this.GrouppermissionsAssetmaster,
    ...this.GrouppermissionsAssetAlon,
    ...this.GrouppermissionsAssetReq,
    ...this.GrouppermissionsAssetApprovals,
    ...this.GrouppermissionsAssetApprovallvl,
    ...this.GrouppermissionsAssetEscalation,
    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isAssetManagementMasterChecked();
}

isDocumentAddInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsDocumentAddFol,

    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isDocumentAddManagementMasterChecked();
}


isProjectInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsProjects,
    ...this.GrouppermissionsProjectStages,
    ...this.GrouppermissionsProjectTask,
    ...this.GrouppermissionsProjectTime,
  
    
    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isProjectManagementMasterChecked();
}

isAirTicketInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsAirTicketPol,
    ...this.GrouppermissionsAirTicketAlon,
    ...this.GrouppermissionsAirTicketReq,
    ...this.GrouppermissionsAirTicketRule,
    ...this.GrouppermissionsAirTicketApr,
    ...this.GrouppermissionsAirTicketAprlvl,
    ...this.GrouppermissionsAirTicketEsc,

  
    
    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isAirTicketManagementMasterChecked();
}

isDocumentInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsDocumentAprlvl,
    ...this.GrouppermissionsDocumentApr,
    ...this.GrouppermissionsDocumentReq,
    ...this.GrouppermissionsDocumentType,



  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isDocumentMangementMasterChecked();
}

isEmailTemplateInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsGeneralReqTemp,
    ...this.GrouppermissionsLeaveEmTemp,
    ...this.GrouppermissionsDocExpTemp,
    ...this.GrouppermissionsDocReqTemp,
    ...this.GrouppermissionsAdvSalReqTemp,
    ...this.GrouppermissionsLoanReqTemp,




  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isEmailTemplateMangementMasterChecked();
}


isShiftInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsShifts,
    ...this.GrouppermissionsShiftPattern,
    ...this.GrouppermissionsShiftEmployee,
    ...this.GrouppermissionsShiftOverRide,
    ...this.GrouppermissionsOverTimePolicy,
    ...this.GrouppermissionsEmpOver

  
    
    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isShiftManagementMasterChecked();
}









// Show Sections

showexpandable(): void {
  this.expandedMasters = !this.expandedMasters;
}

showexpandables(): void {
    this.expandedMastersvalue = !this.expandedMastersvalue;
  }
showreports(): void {
  this.reportMastersvalue =!this.reportMastersvalue;
}

showCustomization(): void {
  this.CustomizationMastersvalue =!this.CustomizationMastersvalue;
}

showcalenders(): void{
  this.calenderMastersvalue =!this.calenderMastersvalue;
}

showLeaves(): void{
  this.LeaveMastersvalue =!this.LeaveMastersvalue;
}

showPayroll(): void{
  this.PayrollMastersvalue =!this.PayrollMastersvalue;
}

showLoan(): void{
  this.LoanMastersvalue =!this.LoanMastersvalue;
}

showAsset(): void{
  this.AssetMastersvalue =!this.AssetMastersvalue;
}

showDocumentAdd(): void{
  this.DocumentAddMastersvalue =!this.DocumentAddMastersvalue;
}

showProject(): void{
  this.ProjectMastersvalue =!this.ProjectMastersvalue;
}

showAirTicket(): void{
  this.AirTicketMastersvalue =!this.AirTicketMastersvalue;
}

showDocument(): void{
  this.DocumentMastersvalue =!this.DocumentMastersvalue;
}

showEmailTemplate(): void{
  this.EmailTemplateMastersvalue =!this.EmailTemplateMastersvalue;
}

showShift(): void{
  this.ShiftMastersvalue =!this.ShiftMastersvalue;
}







createGroup(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');

  if (!selectedSchema) {
    console.error('No schema selected.');
    return;
  }

  const formData = {
    name: this.groupName,
    permissions: this.selectedPermissions
  };

  this.http.post(`${this.apiUrl}/organisation/api/Group/?schema=${selectedSchema}`, formData)
    .subscribe({
      next: (response) => {
        console.log('Data saved successfully:', response);
        alert('Permission Group Added');

        // Reload the page after successful save
        window.location.reload();
      },
      error: (error) => {
        console.error('Failed to save data:', error);
        alert(`Failed to save data! ${error.message || error}`);
      }
    });
}

  ClosePopup() {
    this.ref.close('Closed using function');
    (window as any).location.reload();
  
    
  }

}
