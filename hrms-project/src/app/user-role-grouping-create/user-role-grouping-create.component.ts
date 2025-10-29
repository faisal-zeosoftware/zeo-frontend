import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserMasterService } from '../user-master/user-master.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from '../login/authentication.service';
import { environment } from '../../environments/environment';
import { window } from 'rxjs';

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
  GrouppermissionsAtd: any[] = [];
  GrouppermissionsSal: any[] = [];
  GrouppermissionsPay: any[] = [];





  // permissions stored arrays for settings

  GrouppermissionsCmp: any[] = [];
  GrouppermissionsBrch: any[] = [];
  GrouppermissionsUser: any[] = [];
  GrouppermissionsUsergroup: any[] = [];
  GrouppermissionsassigneddUser: any[] = [];
  GrouppermissionsstateMaster: any[] = [];
  Grouppermissionsdocumentype: any[] = [];
  Grouppermissionsexpirydocuments: any[] = [];
  GrouppermissionslocationMaster: any[] = [];
  GrouppermissionsDnMaster: any[] = [];
  GrouppermissionsCpMaster: any[] = [];
  GrouppermissionsEmtMaster: any[] = [];
  GrouppermissionsFormdesMaster: any[] = [];



    // permissions stored arrays for reports

  GrouppermissionsemployeeReport: any[] = [];
  GrouppermissionsdocumnetReport: any[] =[];
  GrouppermissiionsgeneralReport: any[]=[];
  GrouppermissiionsLeaveReport: any[]=[];
  GrouppermissiionsDeptReport: any[]=[];
  GrouppermissiionsDesReport: any[]=[];





  // permissions stored arrays for calendar

  Grouppermissionsaddweek:any[] =[];
  Grouppermisionsassignweek:any[]=[];
  Grouppermissionsaddholiday: any[]=[];
  Grouppermissionsassisgnholiday:any[]=[];
  GrouppermissionsShift:any[]=[];




  //permission stored arrays for leaves
  GrouppermissionsLeaveaprv:any[] =[];
  GrouppermissionsLeavetype:any[] =[];
  GrouppermissionsLeavemaster:any[] =[];
  GrouppermissionsLeavereq:any[] =[];
  GrouppermissionsLeavecom:any[] =[];
  GrouppermissionsLeaveaprvlvl:any[] =[];
  GrouppermissionsLeaveaprvlvltemp:any[] =[];

  //permission stored arrays for Payroll
  GrouppermissionsPayrollrun:any[] =[];
  GrouppermissionsSalarycomponent:any[] =[];
  GrouppermissionsPayslipAprv: any[] = [];
  GrouppermissionsPayrollaprlvl:any[] =[];
  GrouppermissionsAdvanceSalaryAprvlst:any[] =[];
  GrouppermissionsAdvanceSalaryReq:any[] =[];
  GrouppermissionsAdvanceSalaryAprlvl:any[] =[];
  GrouppermissionsWps:any[] =[];

  //permission stored arrays for Loan
  GrouppermissionsLoanApproval:any[] =[];
  GrouppermissionsLoanType:any[] =[];
  GrouppermissionsLoanAprvlvl:any[] =[];
  GrouppermissionsLoanApp:any[] =[];

  //permission stored arrays for Asset

  GrouppermissionsAssetType:any[] =[];
  GrouppermissionsAssetmaster:any[] =[];
  GrouppermissionsAssetAlon:any[] =[];
  GrouppermissionsAssetReq:any[] =[];
  
  
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

 //permission stored arrays for Document
  GrouppermissionsDocumentAprlvl:any[] =[];
  GrouppermissionsDocumentApr:any[] =[];
  GrouppermissionsDocumentReq:any[] =[];
  GrouppermissionsDocumentType:any[] =[];


  



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
  AtdMasterInderminate = false;
  SalMasterInderminate = false;
  PayMasterInderminate = false;







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
  EmtMasterInderminate= false;
  FormdesMasterInderminate= false;



  //selected reports checkboxes/

  emportReportInderminate= false;
  documentReportInderminate = false;
  generalReportInderminate= false;
  LeaveReportInderminate= false;
  DeptReportInderminate= false;
  DesReportInderminate= false;


  //selected calendars checkboxes.

  calenderdetailInderminate= false;
  addweekInderminate=false;
  assignweekInderminate= false;
  addholidayInderminate= false;
  assignholidayInderminate= false;
  ShiftInderminate= false;





  //selected leave checkboxes.

  LeavedetailInderminate= false;
  LeaveaprvInderminate=false;
  LeavetypeInderminate=false;
  LeavemasterInderminate=false;
  LeavereqInderminate=false;
  LeavecomInderminate=false;
  LeaveaprvlvlInderminate=false;
  LeaveaprvlvltempInderminate=false;


    //selected payroll checkboxes.

    PayrollrunInderminate= false;
    SalarycomponentInderminate= false;
    PayslipAprvInderminate= false;
    PayrollaprlvlInderminate= false;
    AdvanceSalaryAprvlstInderminate= false;
    AdvanceSalaryReqInderminate= false;
    AdvanceSalaryAprlvlInderminate= false;
    WpsInderminate= false;


    //selected Loan checkboxes.

    LoanApprovalInderminate= false;
    LoanTypeInderminate= false;
    LoanAprvInderminate= false;
    LoanAppInderminate= false;

    //selected Asset checkboxes.

    AssetTypeInderminate= false;
    AssetmasterInderminate= false;
    AssetAlonInderminate= false;
    AssetReqInderminate= false;

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

  //selected Document checkboxes.

  DocumentAprlvlInderminate=false;
  DocumentAprInderminate=false;
  DocumentReqInderminate=false;
  DocumentTypeInderminate=false;






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
  AtdMasterChecked: boolean = false;
  SalMasterChecked: boolean = false;
  PayMasterChecked: boolean = false;







  //settings checkbox checked values

  companyMasterChecked: boolean = false;
  branchMasterChecked: boolean = false;
  userMasterChecked: boolean = false;
  usergroupingMasterChecked: boolean = false;
  assignpermissionMasterChecked: boolean =false;
  stationMasterChecked:boolean =false;
  documenttypeMasterChecked:boolean = false;
  expireddocumnetsMasterChecked:boolean = false;
  locationMasterChecked:boolean = false;
  DnMasterChecked:boolean = false;
  CpMasterChecked:boolean = false;
  EmtMasterChecked:boolean = false;

  FormdesMasterChecked:boolean = false;



  
  //Reports checkbox checked values

  emportReportChecked:boolean = false;
  documentReportChecked:boolean = false;
  generelReportChecked:boolean = false;
  LeaveReportChecked:boolean = false;
  DeptReportChecked:boolean = false;
  DesReportChecked:boolean = false;

  
  
  //Calendars checkbox checked values

  addweekChecked:boolean= false;
  assignweekChecked:boolean = false;
  addholidayChecked:boolean= false;
  assignholidayChecked:boolean = false;
  ShiftChecked:boolean = false;



    //Leave checkbox checked values
    LeaveaprvChecked:boolean= false;
    LeavetypeChecked:boolean= false;
    LeavemasterChecked:boolean= false;
    LeavereqChecked:boolean= false;
    LeavecomChecked:boolean= false;
    LeaveaprvlvlChecked:boolean= false;
    LeaveaprvlvltempChecked:boolean= false;

   

     //Payroll checkbox checked values

    PayrollrunChecked:boolean= false;
    SalarycomponentChecked:boolean= false;
    PayslipAprvChecked: boolean = false;
    PayrollaprlvlChecked:boolean= false;
    AdvanceSalaryAprvlstChecked:boolean= false;
    AdvanceSalaryReqChecked:boolean= false;
    AdvanceSalaryAprlvlChecked:boolean= false;
    WpsChecked:boolean= false;

    //Loan checkbox checked values
    LoanApprovalChecked:boolean= false;
    LoanTypeChecked:boolean= false;
    LoanAprvlvlChecked:boolean= false;
    LoanAppChecked:boolean= false;

    //Asset checkbox checked values

    AssetTypeChecked:boolean= false;
    AssetmasterChecked:boolean= false;
    AssetAlonChecked:boolean= false;
    AssetReqChecked:boolean= false;

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


    //Document checkbox checked values
     DocumentAprlvlChecked:boolean= false;
     DocumentAprChecked:boolean= false;
     DocumentReqChecked:boolean= false;
     DocumentTypeChecked:boolean= false;





    


// main headings values

  selectAllChecked: boolean = false;
  settingsChecked: boolean = false;
  reportchecked:boolean = false;
  calenderchecked:boolean = false;
  Leavechecked:boolean = false;
  Payrollchecked:boolean = false;
  Loanchecked:boolean = false;
  Assetchecked:boolean = false;
  Projectchecked:boolean = false;
  AirTicketchecked:boolean = false;
  Documentchecked:boolean = false;



// main masters values

  expandedMasters: boolean = true;
  expandedMastersvalue: boolean = true;
  reportMastersvalue:boolean =true;
  calenderMastersvalue:boolean =true;
  LeaveMastersvalue:boolean =true;
  PayrollMastersvalue:boolean =true;
  LoanMastersvalue:boolean =true;
  AssetMastersvalue:boolean =true;
  ProjectMastersvalue:boolean =true;
  AirTicketMastersvalue:boolean =true;
  DocumentMastersvalue:boolean =true;


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
      this.AtdMasterChecked &&
      this.SalMasterChecked &&
      this.PayMasterChecked 
}

isSettingsMasterChecked(): boolean {
    return this.branchMasterChecked &&
      this.userMasterChecked &&
      this.usergroupingMasterChecked &&
      this.assignpermissionMasterChecked &&
      this.stationMasterChecked &&
      this.documenttypeMasterChecked &&
      this.expireddocumnetsMasterChecked &&
      this.locationMasterChecked &&
      this.DnMasterChecked &&
      this.CpMasterChecked &&
      this.EmtMasterChecked &&
      this.FormdesMasterChecked;
}

isReportManagementMasterChecked(): boolean {
    return this.emportReportChecked &&
      this.documentReportChecked &&
      this.generelReportChecked  &&
      this.LeaveReportChecked &&
      this.DeptReportChecked &&
      this.DesReportChecked ;
      
}

isCalenderMangementMasterChecked():boolean{
    return this.addweekChecked &&
          this.assignweekChecked &&
          this.addholidayChecked &&
          this.assignholidayChecked  &&
          this.ShiftChecked 

}


isLeaveMangementMasterChecked():boolean{
    return this.LeaveaprvChecked &&
    this.LeavetypeChecked &&
    this.LeavemasterChecked &&
    this.LeavereqChecked &&
    this.LeavecomChecked &&
    this.LeaveaprvlvlChecked &&
    this.LeaveaprvlvltempChecked
       
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
  this.WpsChecked
}

// Loan ManagementMaster Checked 

isLoanManagementMasterChecked():boolean{
  return this.LoanApprovalChecked &&
  this.LoanTypeChecked &&
  this.LoanAprvlvlChecked &&
  this.LoanAppChecked

}

// Asset ManagementMaster Checked 


isAssetManagementMasterChecked():boolean{
  return this.AssetTypeChecked &&
  this.AssetmasterChecked &&
  this.AssetAlonChecked &&
  this.AssetReqChecked
 

}

// Project ManagementMaster Checked 

isProjectManagementMasterChecked():boolean{
   return this.ProjectsChecked &&
   this.ProjectStagesChecked &&
   this.ProjectTaskChecked &&
   this.ProjectTimeChecked
}

// AirTicket ManagementMaster Checked 

isAirTicketManagementMasterChecked():boolean{
   return this.AirTicketPolChecked &&
   this.AirTicketAlonChecked &&
   this.AirTicketReqChecked &&
   this.AirTicketRuleChecked
   
}

//  Document ManageMaster Checked

    isDocumentMangementMasterChecked():boolean{
    return this.DocumentAprlvlChecked &&
    this.DocumentAprChecked &&
    this.DocumentReqChecked &&
    this.DocumentTypeChecked;

       
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

  isAtdMasterIndeterminate(): boolean {
    const selectedGenPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsAtd.map(p => p.id).includes(permission)
    );
    return selectedGenPermissions.length > 0 && selectedGenPermissions.length < this.GrouppermissionsAtd.length;
  }

  isSalMasterIndeterminate(): boolean {
    const selectedSalPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsSal.map(p => p.id).includes(permission)
    );
    return selectedSalPermissions.length > 0 && selectedSalPermissions.length < this.GrouppermissionsSal.length;
  }

  isPayMasterIndeterminate(): boolean {
    const selectedPayPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsPay.map(p => p.id).includes(permission)
    );
    return selectedPayPermissions.length > 0 && selectedPayPermissions.length < this.GrouppermissionsPay.length;
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

   isExpireddocumentsIndeterminate(): boolean {
    const selectedexpiredPermissions = this.selectedPermissions.filter(permission =>
      this.Grouppermissionsexpirydocuments.map(p => p.id).includes(permission)
    );
    return selectedexpiredPermissions.length > 0 && selectedexpiredPermissions.length < this.Grouppermissionsexpirydocuments.length;
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

  isEmtmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsEmtMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsEmtMaster.length;
  }

  isFormdesmasterIndeterminate(): boolean {
    const selectedlocationPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsFormdesMaster.map(p => p.id).includes(permission)
    );
    return selectedlocationPermissions.length > 0 && selectedlocationPermissions.length < this.GrouppermissionsFormdesMaster.length;
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
 
isShiftIndeterminate(): boolean {
    const selectedShiftPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsShift.map(p => p.id).includes(permission)
    );
    return selectedShiftPermissions.length > 0 && selectedShiftPermissions.length < this.GrouppermissionsShift.length;
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

isLeaveaprvlvltempIndeterminate(): boolean {
    const selectedLeaveaprvlvltempPermissions = this.selectedPermissions.filter(permission =>
      this.GrouppermissionsLeaveaprvlvltemp.map(p => p.id).includes(permission)
    );
    return selectedLeaveaprvlvltempPermissions.length > 0 && selectedLeaveaprvlvltempPermissions.length < this.GrouppermissionsLeaveaprvlvltemp.length;
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

isLoanAprvlvlIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanAprvlvl.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanAprvlvl.length;
}

isLoanAppIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsLoanApp.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsLoanApp.length;
}

isAssetTypeIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAssetType.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAssetType.length;
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

isAirTicketPolIndeterminate(): boolean {
  const selected = this.selectedPermissions.filter(id =>
    this.GrouppermissionsAirTicketPol.map(p => p.id).includes(id)
  );
  return selected.length > 0 && selected.length < this.GrouppermissionsAirTicketPol.length;
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
    this.loadCalenderPermissions();
    this.loadLeavePermissions();
    this.loadPayrollPermissions();
    this.loadLoanPermissions();
    this.loadAssetPermissions();
    this.loadProjectPermissions();
    this.loadAirTicketPermissions();
    this.loadDocumentPermissions();


    this.updateIndeterminateStates();
    this.updateIndeterminateStatesvalue();
    this.updateIndeterminateReports();
    this.updateInderminateCalenders();
    this.updateInderminateLeave();
    this.updateInderminatePayroll();
    this.updateInderminateLoan();
    this.updateInderminateAsset();
    this.updateInderminateProject();
    this.updateInderminateAirTicket();
    this.updateInderminateDocument();



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
    this.isAtdMasterIndeterminate();
    this.isSalMasterIndeterminate();
    this.isPayMasterIndeterminate();




  }

  updateIndeterminateStatesvalue(): void{
   
    this.isBranchMasterIndeterminate();
    this.isUserMasterIndeterminate();
    this.isUserGroupingIndeterminate();
    this.isAssignPermissionsIndeterminate();
    this.isStateMasterIndeterminate();
    this.isdocumenttypeIndeterminate();
    this.isExpireddocumentsIndeterminate();
    this.isloactionmasterIndeterminate();
    this.isDnmasterIndeterminate();
    this.isCpmasterIndeterminate();
    this.isEmtmasterIndeterminate();
    this.isFormdesmasterIndeterminate();


  
  }


updateIndeterminateReports(): void{
  this.isEmployeeReportIndeterminate();
  this.isDocumentReportIndeterminate();
  this.isGeneralReportIndeterminate();
  this.isLeaveReportIndeterminate();
  this.isDeptReportIndeterminate();
  this.isDesReportIndeterminate();


}

updateInderminateCalenders():void{
  this.isAddHolidayIndeterminate();
  this.isAddWeekIndeterminate();
  this.isAssignWeekIndeterminate();
  this.isAssignHolidayIndeterminate();
  this.isShiftIndeterminate();

}


updateInderminateLeave():void{
  this.isLeaveaprvIndeterminate();
  this.isLeavetypeIndeterminate();
  this.isLeavemasterIndeterminate();
  this.isLeavereqIndeterminate();
  this.isLeavecomIndeterminate();
  this.isLeaveaprvlvlIndeterminate();
  this.isLeaveaprvlvltempIndeterminate();


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
}

// Update Interminate Loan

updateInderminateLoan():void{
  this.isLoanApprovalIndeterminate();
  this.isLoanTypeIndeterminate();
  this.isLoanAprvlvlIndeterminate();
  this.isLoanAppIndeterminate();

}

// Update Interminate Asset

updateInderminateAsset():void{
  this.isAssetTypeIndeterminate();
  this.isAssetmasterIndeterminate();
  this.isAssetAlonIndeterminate();
  this.isAssetReqIndeterminate();
 
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


}


// Update Interminate Document


updateInderminateDocument():void{

  this.isDocumentAprlvlIndeterminate();
  this.isDocumentAprIndeterminate();
  this.isDocumentReqIndeterminate();
  this.isDocumentTypeIndeterminate();


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
    this.loadpermissionsAtdMaster();
    this.loadpermissionsSalMaster();
    this.loadpermissionsPayMaster();
  }





    // this.loadpermissionsCmpMaster();
   

  loadSettingPermissions():void{
    this.loadpermissionsBranchMaster();
    this.loadpermissionsUserMaster();
    this.loadpermissionsUserGroupMaster();
    this.loadpermissionsassigneduser();
    this.loadpermissionsstatemaster();
    this.loadpermissionsdocumnettype();
    this.loadpermissionexpirydocuments();
    this.loadpermissionlocationmaster();
    this.loadpermissionDnmaster();
    this.loadpermissionCpmaster();
    this.loadpermissionEmtmaster();
    this.loadpermissionFormdesmaster();


  }


  // load permissions Sections

  loadReportPermissions():void{
    this.loadpermissionsEmpReport();
    this.loadpermissionsDocReport();
    this.loadpermissionsGenReport();
    this.loadpermissionsLeaveReport();
    this.loadpermissionsDeptReport();
    this.loadpermissionsDesReport();



  }


  loadCalenderPermissions():void{
    this.loadpermissionsAddweekDetail();
    this.loadpermissionsAssignweekDetail();
    this.loadpermissionsAddholidayDetail();
    this.loadpermissionsAssignholidayDetail();
    this.loadpermissionsShiftDetail();

  }


  loadLeavePermissions():void{
    this.loadpermissionsLeaveaprv();
    this.loadpermissionsLeavetype();
    this.loadpermissionsLeavemaster();
    this.loadpermissionsLeavereq();
    this.loadpermissionsLeavecom();
    this.loadpermissionsLeaveaprvlvl();
    this.loadpermissionsLeaveaprvlvltemp();


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

  }

  // Loan Permissions

  loadLoanPermissions():void{

  this.loadpermissionsLoanApproval();
  this.loadpermissionsLoanType();
  this.loadpermissionsLoanAprvlvl();
  this.loadpermissionsLoanApp();
 
  }

  // Asset Permissions

  loadAssetPermissions():void{

  this.loadpermissionsAssetType();
  this.loadpermissionsAssetmaster();
  this.loadpermissionsAssetAlon();
  this.loadpermissionsAssetReq();

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


  }

    // Document Permissions

  loadDocumentPermissions():void{

  this.loadpermissionsDocumentAprlvl();
  this.loadpermissionsDocumentApr();
  this.loadpermissionsDocumentReq();
  this.loadpermissionsDocumentType();
  

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

 loadpermissionsSalMaster(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_salarycomponent', 'change_salarycomponent', 'delete_salarycomponent', 'view_salarycomponent'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsSal = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsSal);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
  }
        
        
           //Display Name  add view delte code for General request master-------
        
           getDisplayNameSal(permissionCodename: string): string {
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
        
          
          loadpermissionsPayMaster(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_payrollrun', 'change_payrollrun', 'delete_payrollrun', 'view_payrollrun'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsPay = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsPay);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
        
           //Display Name  add view delte code for General request master-------
        
           getDisplayNamePay(permissionCodename: string): string {
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
  

//load permission for expiring document-----------
  loadpermissionexpirydocuments(): void {

    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

    console.log('schemastore', selectedSchema);
  
    if (selectedSchema) {
      this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
        (result: any[]) => {
          // Specify the codenames you want to filter
          const requiredCodenames = ['add_emp_documents', 'change_emp_documents', 'delete_emp_documents', 'view_emp_documents'];
  
          // Filter and remove duplicates based on codename
          const uniquePermissionsMap = new Map();
          result.forEach(permission => {
            const codename = permission.codename.trim().toLowerCase();
            if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
              uniquePermissionsMap.set(codename, permission);
            }
          });
  
          // Convert map values to an array
          this.Grouppermissionsexpirydocuments = Array.from(uniquePermissionsMap.values());
  
          console.log('Filtered Unique Permissions:', this.Grouppermissionsexpirydocuments);
        },
        (error: any) => {
          console.error('Error fetching permissions:', error);
        }
      );
    }
  }

    //Display Name  add view delte code for Document type master-------

    getDisplayNameDocExpired(permissionCodename: string): string {
      switch (permissionCodename.trim().toLowerCase()) {
        case 'add_emp_documents':
          return 'Add';
        case 'change_emp_documents':
          return 'Edit';
        case 'delete_emp_documents':
          return 'Delete';
        case 'view_emp_documents':
          return 'View';
        default:
          return permissionCodename;
      }
    }


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

          loadpermissionEmtmaster(): void {
            const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
            console.log('schemastore', selectedSchema);
          
            if (selectedSchema) {
              this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                (result: any[]) => {
                  // Specify the codenames you want to filter
                  const requiredCodenames = ['add_emailtemplate', 'change_emailtemplate', 'delete_emailtemplate', 'view_emailtemplate'];
          
                  // Filter and remove duplicates based on codename
                  const uniquePermissionsMap = new Map();
                  result.forEach(permission => {
                    const codename = permission.codename.trim().toLowerCase();
                    if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                      uniquePermissionsMap.set(codename, permission);
                    }
                  });
          
                  // Convert map values to an array
                  this.GrouppermissionsEmtMaster = Array.from(uniquePermissionsMap.values());
          
                  console.log('Filtered Unique Permissions:', this.GrouppermissionsEmtMaster);
                },
                (error: any) => {
                  console.error('Error fetching permissions:', error);
                }
              );
            }
          }
        
            //Display Name  add view delte code for Company master-------
        
            getDisplayNameEmt(permissionCodename: string): string {
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

        loadpermissionFormdesmaster(): void {
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

          console.log('schemastore', selectedSchema);
        
          if (selectedSchema) {
            this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
              (result: any[]) => {
                // Specify the codenames you want to filter
                const requiredCodenames = ['add_emp_customfield', 'change_emp_customfield', 'delete_emp_customfield', 'view_emp_customfield'];
        
                // Filter and remove duplicates based on codename
                const uniquePermissionsMap = new Map();
                result.forEach(permission => {
                  const codename = permission.codename.trim().toLowerCase();
                  if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                    uniquePermissionsMap.set(codename, permission);
                  }
                });
        
                // Convert map values to an array
                this.GrouppermissionsFormdesMaster = Array.from(uniquePermissionsMap.values());
        
                console.log('Filtered Unique Permissions:', this.GrouppermissionsFormdesMaster);
              },
              (error: any) => {
                console.error('Error fetching permissions:', error);
              }
            );
          }
        }
      
          //Display Name  add view delte code for Company master-------
      
          getDisplayNameFormdes(permissionCodename: string): string {
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


      loadpermissionsEmpReport(): void {
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

        console.log('schemastore', selectedSchema);
      
        if (selectedSchema) {
          this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
            (result: any[]) => {
              // Specify the codenames you want to filter
              const requiredCodenames = ['add_report', 'change_report', 'delete_report', 'export_report','view_report'];
      
              // Filter and remove duplicates based on codename
              const uniquePermissionsMap = new Map();
              result.forEach(permission => {
                const codename = permission.codename.trim().toLowerCase();
                if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                  uniquePermissionsMap.set(codename, permission);
                }
              });
      
              // Convert map values to an array
              this.GrouppermissionsemployeeReport = Array.from(uniquePermissionsMap.values());
      
              console.log('Filtered Unique Permissions:', this.GrouppermissionsemployeeReport);
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
            case 'export_report':
              return 'Export';
            case 'view_report':
                return 'View';
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
                const requiredCodenames = ['add_doc_report', 'change_doc_report', 'delete_doc_report', 'export_document_report','view_doc_report'];
        
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
        const requiredCodenames = ['add_generalrequestreport', 'change_generalrequestreport', 'delete_generalrequestreport', 'export_general_request_report','view_generalrequestreport'];

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
          const requiredCodenames = ['add_leavereport', 'change_leavereport', 'delete_leavereport', 'export_report','view_leavereport'];
  
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
                case 'export_report':
                  return 'Export';
                  case 'view_leavereport':
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
            const requiredCodenames = ['add_leavereport', 'change_leavereport', 'delete_leavereport', 'export_report','view_leavereport'];
    
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
                  case 'add_leavereport':
                    return 'Add';
                  case 'change_leavereport':
                    return 'Edit';
                  case 'delete_leavereport':
                    return 'Delete';
                  case 'export_report':
                    return 'Export';
                    case 'view_leavereport':
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
              const requiredCodenames = ['add_leavereport', 'change_leavereport', 'delete_leavereport', 'export_report','view_leavereport'];
      
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
            
                getDisplayNameDesReport(permissionCodename: string): string {
                  switch (permissionCodename.trim().toLowerCase()) {
                    case 'add_leavereport':
                      return 'Add';
                    case 'change_leavereport':
                      return 'Edit';
                    case 'delete_leavereport':
                      return 'Delete';
                    case 'export_report':
                      return 'Export';
                      case 'view_leavereport':
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
                        const requiredCodenames = ['add_holiday', 'change_holiday', 'delete_holiday', 'view_holiday'];
                
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
                      case 'add_holiday':
                        return 'Add';
                      case 'change_holiday':
                        return 'Edit';
                      case 'delete_holiday':
                        return 'Delete';
                        case 'view_holiday':
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

                    loadpermissionsShiftDetail(): void {
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
                      console.log('schemastore', selectedSchema);
                    
                      if (selectedSchema) {
                        this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                          (result: any[]) => {
                            // Specify the codenames you want to filter
                            const requiredCodenames = ['add_shift', 'change_shift', 'delete_shift', 'view_shift'];
                    
                            // Filter and remove duplicates based on codename
                            const uniquePermissionsMap = new Map();
                            result.forEach(permission => {
                              const codename = permission.codename.trim().toLowerCase();
                              if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                uniquePermissionsMap.set(codename, permission);
                              }
                            });
                    
                            // Convert map values to an array
                            this.GrouppermissionsShift = Array.from(uniquePermissionsMap.values());
                    
                            console.log('Filtered Unique Permissions:', this.GrouppermissionsShift);
                          },
                          (error: any) => {
                            console.error('Error fetching permissions:', error);
                          }
                        );
                      }
                    }
                  
                      //Display Name  add view delte code for Company master-------
                  
    getDisplayNameShiftDetail(permissionCodename: string): string {
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
      

                            loadpermissionsLeaveaprvlvltemp(): void {
                              const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema

                              console.log('schemastore', selectedSchema);
                            
                              if (selectedSchema) {
                                this.UserMasterService.getPermissionByRoleGrouping(selectedSchema).subscribe(
                                  (result: any[]) => {
                                    // Specify the codenames you want to filter
                                    const requiredCodenames = ['add_lvemailtemplate', 'change_lvemailtemplate', 'delete_lvemailtemplate', 'view_lvemailtemplate'];
                            
                                    // Filter and remove duplicates based on codename
                                    const uniquePermissionsMap = new Map();
                                    result.forEach(permission => {
                                      const codename = permission.codename.trim().toLowerCase();
                                      if (requiredCodenames.includes(codename) && !uniquePermissionsMap.has(codename)) {
                                        uniquePermissionsMap.set(codename, permission);
                                      }
                                    });
                            
                                    // Convert map values to an array
                                    this.GrouppermissionsLeaveaprvlvltemp = Array.from(uniquePermissionsMap.values());
                            
                                    console.log('Filtered Unique Permissions:', this.GrouppermissionsLeaveaprvlvltemp);
                                  },
                                  (error: any) => {
                                    console.error('Error fetching permissions:', error);
                                  }
                                );
                              }
                            }
                          
                          
    //Display Name add view delte code for emplotee master-------
                          
    getDisplayNameLeaveaprvlvltemp(permissionCodename: string): string {
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
          'add_Wps',
          'change_Wps',
          'delete_Wps',
          'view_Wps',
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
    case 'add_Wps':
      return 'Add';
    case 'change_Wps':
      return 'Edit';
    case 'delete_Wps':
      return 'Delete';
    case 'view_Wps':
      return 'View';
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
        console.error('Error fetching Projects permissions:', error);
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
          'add_document_type',
          'change_document_type',
          'delete_document_type',
          'view_document_type'
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


// === Display readable names for Document Type permissions ===
getDisplayNameDocumentType(permissionCodename: string): string {
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


  onCheckboxChangeSal(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updateSalMasterCheckbox();
    this.updateSelectAll();
  }

  updateSalMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsSal.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.SalMasterChecked = allPermissionsSelected;
    this.SalMasterInderminate = this.isSalMasterIndeterminate();

  }


  onCheckboxChangePay(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
    this.updatePayMasterCheckbox();
    this.updateSelectAll();
  }

  updatePayMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsPay.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.PayMasterChecked = allPermissionsSelected;
    this.PayMasterInderminate = this.isPayMasterIndeterminate();

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

  onCheckboxChangesexpiry(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateexpiryMasterCheckbox();
    this.updateSelectAlls();

  }

  updateexpiryMasterCheckbox(): void {
    const allPermissionsSelected = this.Grouppermissionsexpirydocuments.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.expireddocumnetsMasterChecked = allPermissionsSelected;
    this.expiredMasterInderminate = this.isExpireddocumentsIndeterminate();
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

  onCheckboxChangesEmt(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateEmtMasterCheckbox();
    this.updateSelectAlls();

  }

  updateEmtMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsEmtMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.EmtMasterChecked = allPermissionsSelected;
    this.EmtMasterInderminate = this.isEmtmasterIndeterminate();
  }


  onCheckboxChangesFormdes(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateFormdesMasterCheckbox();
    this.updateSelectAlls();

  }

  updateFormdesMasterCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsFormdesMaster.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.FormdesMasterChecked = allPermissionsSelected;
    this.FormdesMasterInderminate = this.isFormdesmasterIndeterminate();
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

  onCheckboxChangesShift(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateShiftCheckbox();
    this.updateCalender();

  }

  updateShiftCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsShift.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.ShiftChecked= allPermissionsSelected;
    this.ShiftInderminate= this.isShiftIndeterminate();
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

  onCheckboxChangesLeaveaprvlvltemp(permission: string): void {
    if (this.selectedPermissions.includes(permission)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== permission);
    } else {
      this.selectedPermissions.push(permission);
    }
  
   
    // Update selectAll checkbox status
    this.updateLeaveaprvlvltempCheckbox();
    this.updateLeave();

  }

  updateLeaveaprvlvltempCheckbox(): void {
    const allPermissionsSelected = this.GrouppermissionsLeaveaprvlvltemp.every(permission => 
      this.selectedPermissions.includes(permission.id)
    );
    this.LeaveaprvlvltempChecked = allPermissionsSelected;
    this.LeaveaprvlvltempInderminate = this.isLeaveaprvlvltempIndeterminate();
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


















  
  updateMasterCheckboxes(): void {
    this.updateEmployeeMasterCheckbox();
    this.updateDepartmentMasterCheckbox();
    this.updateDesgnationMasterCheckbox();
    this.updateCategoryMasterCheckbox();
    this.updateGenMasterCheckbox();
    this.updateReqtypeMasterCheckbox();
    this.updateAprMasterCheckbox();
    this.updateAprlvlMasterCheckbox();
    this.updateAtdMasterCheckbox();
    this.updateSalMasterCheckbox();
    this.updatePayMasterCheckbox();





    this.updateBranchCheckbox();
    this.updateuserMasterCheckbox();
    this.updateUsergroupMasterCheckbox();
    this.updateassignMasterCheckbox();
    this.updateStateMasterCheckbox();
    this.updatedoctypeMasterCheckbox();
    this.updateexpiryMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateFormdesMasterCheckbox();



    this.updateEmpReportCheckbox();
    this.updateGenReportCheckbox();
    this.updatedocReportCheckbox();


    this.updateAddHolidayCheckbox();
    this.updateAddWeekCheckbox();
    this.updateAssignHolidayCheckbox();
    this.updateAssignweekCheckbox();
    this.updateShiftCheckbox();
    this.updateLeaveaprvCheckbox();

    this.updateSelectAll();
    this.updateSelectAlls();
    this.updateReport();
    this.updateCalender();
    this.updateLeave();
    this.updatePayroll();
    this.updateLoan();
    this.updateAsset();
    this.updateProject();
    this.updateAirTicket();
    this.updateDocument();

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
                            this.AtdMasterChecked &&
                            this.SalMasterChecked &&

                            this.PayMasterChecked;

}


isEmpDeptDisCatPermission(permission: string): boolean {
  return [...this.GrouppermissionsEmp, ...this.GrouppermissionsDept, ...this.GrouppermissionsDis, 
    ...this.GrouppermissionsCat, ...this.GrouppermissionsGen,...this.GrouppermissionsReqtype,
    ...this.GrouppermissionsApr, ...this.GrouppermissionsAprlvl,...this.GrouppermissionsAtd,...this.GrouppermissionsSal,...this.GrouppermissionsPay,]
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
    ...this.GrouppermissionsAtd,
    ...this.GrouppermissionsSal,
    ...this.GrouppermissionsPay,


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
  const AtdMasterInderminate = this.isAtdMasterIndeterminate();
  const SalMasterInderminate = this.isSalMasterIndeterminate();

  const PayMasterInderminate = this.isPayMasterIndeterminate();




    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return employeeMasterIndeterminate || departmentMasterInderminate || designationMasterInderminate || categoryMasterInderminate|| 
    GenMasterInderminate|| ReqtypeMasterInderminate|| AprMasterInderminate|| AprlvlMasterInderminate|| AtdMasterInderminate|| SalMasterInderminate|| PayMasterInderminate||  otherGroupIndeterminate;
}


issettings(): boolean {
  const branchMasterInderminate = this.isBranchMasterIndeterminate();
  const userMasterInderminate = this.isUserMasterIndeterminate();
  const userGroupMasterInderminate = this.isUserGroupingIndeterminate();
  const assignMasterInderminate = this.isAssignPermissionsIndeterminate();
  const stateMasterInderminate = this.isStateMasterIndeterminate();
  const documentMasterInderminate = this.isdocumenttypeIndeterminate();
  const expiredMasterInderminate = this.isExpireddocumentsIndeterminate();
  const locationMasterInderminate = this.isloactionmasterIndeterminate();
  const DnMasterInderminate = this.isDnmasterIndeterminate();
  const CpMasterInderminate = this.isCpmasterIndeterminate();
  const EmtMasterInderminate = this.isEmtmasterIndeterminate();

  const FormdesMasterInderminate = this.isFormdesmasterIndeterminate();


    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return branchMasterInderminate || userMasterInderminate || userGroupMasterInderminate || assignMasterInderminate||stateMasterInderminate || documentMasterInderminate || userGroupMasterInderminate || expiredMasterInderminate||locationMasterInderminate||
    DnMasterInderminate || CpMasterInderminate || EmtMasterInderminate || FormdesMasterInderminate || otherGroupIndeterminate;
}
isreports(): boolean {
  const emportReportInderminate = this.isEmployeeReportIndeterminate();
  const documentReportInderminate = this.isDocumentReportIndeterminate();
  const generalReportInderminate = this.isGeneralReportIndeterminate();
  const LeaveReportInderminate = this.isLeaveReportIndeterminate();

    const otherGroupIndeterminate = false; // Add indeterminate checks for other groups like Dept, Dis, Cat

    // Return true only if some but not all checkboxes are selected
    return emportReportInderminate || documentReportInderminate || 
    generalReportInderminate ||  LeaveReportInderminate || otherGroupIndeterminate;
}

iscalenders(): boolean {
  const addweekInderminate = this.isAddWeekIndeterminate();
  const assignweekInderminate = this.isAssignWeekIndeterminate();
  const addholidayInderminate = this.isAddHolidayIndeterminate();
  const assignholidayInderminate = this.isAssignHolidayIndeterminate();
  const ShiftInderminate = this.isShiftIndeterminate();


  const otherGroupIndeterminate = false;
  return addweekInderminate || assignweekInderminate || addholidayInderminate || assignholidayInderminate || ShiftInderminate || otherGroupIndeterminate;
}  

isLeaves(): boolean {
  const LeaveaprvInderminate = this.isLeaveaprvIndeterminate();
  const LeavetypeInderminate = this.isLeavetypeIndeterminate();
  const LeavemasterInderminate = this.isLeavemasterIndeterminate();
  const LeavereqInderminate = this.isLeavereqIndeterminate();
  const LeavecomInderminate = this.isLeavecomIndeterminate();
  const LeaveaprvlvlInderminate = this.isLeaveaprvlvlIndeterminate();
  const LeaveaprvlvltempInderminate = this.isLeaveaprvlvltempIndeterminate();



  const otherGroupIndeterminate = false;
  return LeaveaprvInderminate || LeavetypeInderminate ||LeavemasterInderminate ||
  LeavereqInderminate ||  LeavecomInderminate || LeaveaprvlvlInderminate ||  LeaveaprvlvltempInderminate || otherGroupIndeterminate;
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

  const otherGroupIndeterminate = false;

  return PayrollrunIndeterminate || SalarycomponentIndeterminate || PayslipAprvIndeterminate || isPayrollaprlvlIndeterminate || AdvanceSalaryAprvlstIndeterminate || AdvanceSalaryReqInderminate || AdvanceSalaryAprlvlInderminate || WpsInderminate || otherGroupIndeterminate;
}


isLoans(): boolean {
  const LoanApprovalIndeterminate = this.isLoanApprovalIndeterminate();
  const LoanTypeIndeterminate = this.isLoanTypeIndeterminate();
  const LoanAprvlvlIndeterminate = this.isLoanAprvlvlIndeterminate();
  const LoanAppIndeterminate = this.isLoanAppIndeterminate();


  const otherGroupIndeterminate = false;

  return LoanApprovalIndeterminate || LoanTypeIndeterminate || LoanAprvlvlIndeterminate || LoanAppIndeterminate  || otherGroupIndeterminate;
}


isAsset(): boolean {
  const AssetTypeIndeterminate = this.isAssetTypeIndeterminate();
  const AssetmasterIndeterminate = this.isAssetmasterIndeterminate();
  const AssetAlonIndeterminate = this.isAssetAlonIndeterminate();
  const AssetReqIndeterminate = this.isAssetReqIndeterminate();

  const otherGroupIndeterminate = false;

  return AssetTypeIndeterminate || AssetmasterIndeterminate || AssetAlonIndeterminate || AssetReqIndeterminate || otherGroupIndeterminate;
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


  const otherGroupIndeterminate = false;

  return AirTicketPolIndeterminate || AirTicketAlonIndeterminate || AirTicketReqIndeterminate || AirTicketRuleIndeterminate || otherGroupIndeterminate;
}

isDocument(): boolean {
  const DocumentAprlvlInderminate = this.isDocumentAprlvlIndeterminate();
  const DocumentAprInderminate = this.isDocumentAprIndeterminate();
  const DocumentReqInderminate = this.isDocumentReqIndeterminate();
  const DocumentTypeInderminate = this.isDocumentTypeIndeterminate();


  const otherGroupIndeterminate = false;

  return DocumentAprlvlInderminate || DocumentAprInderminate || DocumentReqInderminate || DocumentTypeInderminate || otherGroupIndeterminate;
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


  onSalMasterChange(): void {
    if (this.SalMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsSal.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsSal.map(p => p.id).includes(permission));
    }
  
    // Update related checkboxes
    this.updateEmployeeManagementCheckbox();
    // this.selectAllChecked = this.categoryMasterChecked;

  }


  onPayMasterChange(): void {
    if (this.PayMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsPay.map(permission => permission.id));
    } else {  
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsPay.map(p => p.id).includes(permission));
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
  onUserExpireChange(): void {
    if (this.expireddocumnetsMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.Grouppermissionsexpirydocuments.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.Grouppermissionsexpirydocuments.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.expireddocumnetsMasterChecked, this.Grouppermissionsexpirydocuments);
    // this.settingsChecked = this.expireddocumnetsMasterChecked;


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

  onUserEmtChange(): void {
    if (this.EmtMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsEmtMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsEmtMaster.map(p => p.id).includes(permission));
    }
    this.updateSettingsCheckbox();
    // this.updateSelectedPermissions(this.locationMasterChecked, this.GrouppermissionslocationMaster);
    // this.settingsChecked = this.locationMasterChecked;


  }

  onUserFormdesChange(): void {
    if (this.FormdesMasterChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsFormdesMaster.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsFormdesMaster.map(p => p.id).includes(permission));
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

  onShiftChange(): void {
    if (this.ShiftChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsShift.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsShift.map(p => p.id).includes(permission));
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

  onLeaveaprvlvltempChange(): void {
    if (this.LeaveaprvlvltempChecked) {
      this.selectedPermissions = this.selectedPermissions.concat(this.GrouppermissionsLeaveaprvlvltemp.map(permission => permission.id));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !this.GrouppermissionsLeaveaprvlvltemp.map(p => p.id).includes(permission));
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












// Update Checkbox Sections


  updateSettingsCheckbox(): void {
    this.settingsChecked = this.isSettingsMasterChecked();
  }


  updateReportCheckbox(): void {
    this.reportchecked = this.isReportManagementMasterChecked();
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

  updateProjectCheckbox(): void {
  this.Projectchecked = this.isProjectManagementMasterChecked();
}

  updateAirTicketCheckbox(): void {
  this.AirTicketchecked = this.isAirTicketManagementMasterChecked();
}

updateDocumentCheckbox(): void {
this.Documentchecked = this.isDocumentMangementMasterChecked();
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
    ...this.GrouppermissionsAtd,
    ...this.GrouppermissionsSal,

    ...this.GrouppermissionsPay,




    
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
  this.updateAtdMasterCheckbox();
  this.updateSalMasterCheckbox();

  this.updatePayMasterCheckbox();





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
      ...this.Grouppermissionsexpirydocuments,
      ...this.GrouppermissionslocationMaster,
      ...this.GrouppermissionsDnMaster,
      ...this.GrouppermissionsCpMaster,
      ...this.GrouppermissionsEmtMaster,

      ...this.GrouppermissionsFormdesMaster


      
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
    this.updateexpiryMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateCpMasterCheckbox();
    this.updateEmtMasterCheckbox();

    this.updateFormdesMasterCheckbox();

    this.updateSettingsCheckbox();
  }


  selectReport(): void {
    const allPermissions = [
      ...this.GrouppermissionsemployeeReport,
      ...this.GrouppermissionsdocumnetReport,
      ...this.GrouppermissiionsgeneralReport,
      ...this.GrouppermissiionsLeaveReport

    ].map(permission => permission.id);
  
    if (this.reportchecked) {
      this.selectedPermissions = Array.from(new Set([...this.selectedPermissions, ...allPermissions]));
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(permission => !allPermissions.includes(permission));
    }
  
    this.updateEmpReportCheckbox();
    this.updatedocReportCheckbox();
    this.updateGenReportCheckbox();
    this.updateLeaveReportCheckbox();



    this.updateReportCheckbox();
  }

selectCalender(): void {
  const allPermissions = [
    ...this.Grouppermissionsaddweek,
    ...this.Grouppermisionsassignweek,
    ...this.Grouppermissionsaddholiday,
    ...this.Grouppermissionsassisgnholiday,
    ...this.GrouppermissionsShift

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
    ...this.GrouppermissionsLeaveaprvlvltemp,

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
  this.updateLeaveaprvlvltempCheckbox();


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
}


selectLoan(): void {
  const allPermissions = [
    ...this.GrouppermissionsLoanApproval,
    ...this.GrouppermissionsLoanType,
    ...this.GrouppermissionsLoanAprvlvl,
    ...this.GrouppermissionsLoanApp,

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
 
}


selectAsset(): void {
  const allPermissions = [
    ...this.GrouppermissionsAssetType,
    ...this.GrouppermissionsAssetmaster,
    ...this.GrouppermissionsAssetAlon,
    ...this.GrouppermissionsAssetReq,


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
  this.updateAtdMasterCheckbox();
  this.updateSalMasterCheckbox();
   this.updatePayMasterCheckbox();
  this.updateEmployeeManagementCheckbox();

 




 
}


updateSelectAlls():void{
    this.updateBranchCheckbox();
    this.updateuserMasterCheckbox();
    this.updateUsergroupMasterCheckbox();
    this.updateStateMasterCheckbox();
    this.updateassignMasterCheckbox();
    this.updatedoctypeMasterCheckbox();
    this.updateexpiryMasterCheckbox();
    this.updatelocMasterCheckbox();
    this.updateDnMasterCheckbox();
    this.updateCpMasterCheckbox();
    this.updateEmtMasterCheckbox();

    this.updateFormdesMasterCheckbox();



    this.updateSettingsCheckbox();
    this.updateIndeterminateStatesvalue();
}

updateReport(): void {
  this.updateReportCheckbox();
  this.updateEmpReportCheckbox();
  this.updatedocReportCheckbox();
  this.updateGenReportCheckbox();
  this.updateLeaveReportCheckbox();


  this.updateIndeterminateReports();
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
  this.updateLeaveaprvlvltempCheckbox();
  this.updateInderminateLeave();
  this.updateLeaveCheckbox();

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

}


updateLoan():void{
  this.updateLoanApprovalCheckbox();
  this.updateLoanTypeCheckbox();
  this.updateLoanAprvlvlCheckbox();
  this.updateLoanAppCheckbox();
  

}

updateAsset():void{
  this.updateAssetTypeCheckbox();
  this.updateAssetmasterCheckbox();
  this.updateAssetAlonCheckbox();
  this.updateAssetReqCheckbox();
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
}

updateDocument():void{

  this.updateDocumentAprlvlCheckbox();
  this.updateDocumentAprCheckbox();
  this.updateDocumentReqCheckbox();
  this.updateDocumentTypeCheckbox();


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
      ...this.Grouppermissionsexpirydocuments,
      ...this.GrouppermissionslocationMaster,
      ...this.GrouppermissionsDnMaster,
      ...this.GrouppermissionsCpMaster,
      ...this.GrouppermissionsEmtMaster,
      ...this.GrouppermissionsFormdesMaster


    ].some(permission => this.selectedPermissions.includes(permission.id));
      return hasSelectedPermissions && !this.isSettingsMasterChecked();

   
  }


isReportInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsemployeeReport,
    ...this.GrouppermissionsdocumnetReport,
    ...this.GrouppermissiionsgeneralReport,
    ...this.GrouppermissiionsLeaveReport

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isReportManagementMasterChecked();
}


isCalenderInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.Grouppermissionsaddweek,
    ...this.Grouppermisionsassignweek,
    ...this.Grouppermissionsaddholiday,
    ...this.Grouppermissionsassisgnholiday,
    ...this.GrouppermissionsShift

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
    ...this.GrouppermissionsLeaveaprvlvltemp,

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

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isPayrollManagementMasterChecked();
}

isLoanInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsLoanApproval,
    ...this.GrouppermissionsLoanType,
    ...this.GrouppermissionsLoanAprvlvl,
    ...this.GrouppermissionsLoanApp,
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isLoanManagementMasterChecked();
}


isAssetInderminate(): boolean {
  const hasSelectedPermissions = [
    ...this.GrouppermissionsAssetType,
    ...this.GrouppermissionsAssetmaster,
    ...this.GrouppermissionsAssetAlon,
    ...this.GrouppermissionsAssetReq,
    
 

  ].some(permission => this.selectedPermissions.includes(permission.id));

  return hasSelectedPermissions && !this.isAssetManagementMasterChecked();
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

showProject(): void{
  this.ProjectMastersvalue =!this.ProjectMastersvalue;
}

showAirTicket(): void{
  this.AirTicketMastersvalue =!this.AirTicketMastersvalue;
}

showDocument(): void{
  this.DocumentMastersvalue =!this.DocumentMastersvalue;
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
    .subscribe(
      (response) => {
        console.log('Data saved successfully:', response);
        alert('Permission Group Added');
        

        // ✅ Force reload the page
        (window as any).location.reload();

      },
      (error) => {
        console.error('Failed to save data:', error);
        alert(`Fail to save data! ${error}`);
      }
    );
}

  ClosePopup() {
    this.ref.close('Closed using function');
    (window as any).location.reload();
  
    
  }
}
