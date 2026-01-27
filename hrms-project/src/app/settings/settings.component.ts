import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {


  userId: number | null | undefined;
  userDetails: any;

  hasPermissioncom: boolean = false;

  isAuthenticated: boolean = false;
  showComponent: boolean = false;
  
  userPermissions: string[] = [];
  user_permissions: string[] = [];

  hasViewPermissionBranch: boolean = false;
  hasViewPermissionUsers: boolean = false;
  hasViewPermissionGroups: boolean =false;
  hasViewPermissionDocType: boolean = false;
  hasViewPermissionAssignPermission: boolean = false;
  hasViewStateMaster: boolean = false;
  hasViewCompanyMaster: boolean = false;
  hasViewAnnounceMaster:boolean = false;
  hasViewDocNotifySettings:boolean = false;
  hasViewPermissionBranchPermission: boolean = false;


  hasViewNotification: boolean = false;
  hasViewDN : boolean = false;
  hasViewPermissionFormdes : boolean = false;

  hasViewPermissionCmpnyPol : boolean = false;

  hasViewPermissionConfig: boolean = false;

  hasViewPermissionEmtemp : boolean = false;
  hasViewPermissionLeaveEmtemp : boolean = false;
  hasViewPermissionDocExpEmtemp : boolean = false;
  hasViewPermissionDocReqEmtemp : boolean = false;
  hasViewPermissionAdvSalEmtemp : boolean = false;
  hasViewPermissionLoanReqEmtemp : boolean = false;
  hasViewPermissionAssetEmptemp: boolean = false;
  hasViewPermissionAirticketEmptemp: boolean = false;
  hasViewPermissionResignationEmptemp: boolean = false;


  hasViewPermissionDocReqType: boolean = false;
  hasViewPermissionDocReqApr: boolean = false;
  hasViewPermissionDocAprlvl: boolean = false;
  hasViewPermissionDocReq: boolean = false;







  hasViewWeek: boolean = false;
  hasViewWeekAssgn: boolean = false;
  hasViewHoly: boolean = false;
  hasViewHolyAssgn : boolean = false;

    hasViewShift : boolean = false;

  hasViewPermissionempreport:boolean = false;
  hasViewPermissiondocreport:boolean = false;
  hasViewPermissiongenreport:boolean = false;
  hasViewPermissiondeptreport:boolean = false;
  hasViewPermissiondesreport:boolean = false;
  hasViewPermissionLeavereport:boolean = false;
  hasViewPermissionLeaveAprreport:boolean = false;
  hasViewPermissionLeaveBalancereport:boolean = false;
  hasViewPermissionEmpAttendancereport:boolean = false;
  hasViewPermissionAssetreport:boolean = false;
  hasViewPermissionAssettransreport:boolean = false;


  hasViewPermissionEmpForm: boolean = false;
  hasviewPermissionAssetForm: boolean = false;

  stateLabel: string = ''; // Default value




  constructor(private EmployeeService:EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService



    
    ) {
     
    }


    isMenuOpen: boolean = true; 
    toggleSidebarMenu(): void
     { this.isMenuOpen = !this.isMenuOpen; }


  ngOnInit(): void {

    // Retrieve user ID
this.userId = this.sessionService.getUserId();

// Fetch user details using the obtained user ID
if (this.userId !== null) {
  this.authService.getUserData(this.userId).subscribe(
    async (userData: any) => {
      this.userDetails = userData; // Store user details in userDetails property
      console.log('User ID:', this.userId); // Log user ID
      console.log('User Details:', this.userDetails); // Log user details

      // Check if user is_superuser is true or false
      let isSuperuser = this.userDetails.is_superuser || false; // Default to false if is_superuser is undefined
      const selectedSchema = this.authService.getSelectedSchema();
      console.log('schemaname',selectedSchema);

      const selectedStateLabel = localStorage.getItem('selectedSchemaStateLabel');
      console.log("Retrieved state label:", selectedStateLabel);

      this.stateLabel = selectedStateLabel ? selectedStateLabel : '';


      if (!selectedSchema) {
        console.error('No schema selected.');
        return;
      }
    
    
      if (isSuperuser) {
        console.log('User is superuser or ESS user');
        // Grant all permissions
        this.hasViewPermissionBranch = true;
        this.hasViewPermissionUsers = true;
        this.hasViewPermissionGroups = true;
        this.hasViewPermissionDocType = true;
        this.hasViewPermissionAssignPermission = true;
        this.hasViewStateMaster = true;
        this.hasViewCompanyMaster = true;
        this.hasViewNotification = true;
        this.hasViewDN = true;
        this.hasViewAnnounceMaster = true;
        this.hasViewDocNotifySettings = true;
        this.hasViewPermissionFormdes = true;

        this.hasViewPermissionBranchPermission = true;

        this.hasViewPermissionCmpnyPol = true;

        this.hasViewPermissionEmtemp = true;
        this.hasViewPermissionLeaveEmtemp = true;
        this.hasViewPermissionDocExpEmtemp = true;
        this.hasViewPermissionDocReqEmtemp = true;
        this.hasViewPermissionAdvSalEmtemp = true;
        this.hasViewPermissionLoanReqEmtemp = true;
        this.hasViewPermissionAssetEmptemp = true;
        this.hasViewPermissionAirticketEmptemp = true;
        this.hasViewPermissionResignationEmptemp = true;




        this.hasViewWeek = true;
        this.hasViewWeekAssgn = true;
        this.hasViewHoly = true;
        this.hasViewHolyAssgn = true;
        this.hasViewShift = true;


        this.hasViewPermissionempreport = true;
        this.hasViewPermissiondocreport = true;
        this.hasViewPermissiongenreport = true;
        this.hasViewPermissiondeptreport = true;
        this.hasViewPermissiondesreport = true;
        this.hasViewPermissionLeavereport = true;
        this.hasViewPermissionLeaveAprreport = true;
        this.hasViewPermissionLeaveBalancereport = true;
        this.hasViewPermissionEmpAttendancereport = true;
        this.hasViewPermissionAssetreport = true;
        this.hasViewPermissionAssettransreport = true;

        this.hasViewPermissionEmpForm = true;
        this.hasviewPermissionAssetForm = true;

         this.hasViewPermissionConfig = true;


         this.hasViewPermissionDocReqType = true;
         this.hasViewPermissionDocReqApr = true;
         this.hasViewPermissionDocAprlvl = true;
         this.hasViewPermissionDocReq = true;






    
        // Fetch designations without checking permissions
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
                this.hasViewPermissionBranch = true;
                this.hasViewPermissionUsers = true;
                this.hasViewPermissionGroups = true;
                this.hasViewPermissionDocType = true;
                this.hasViewPermissionAssignPermission = true;
                this.hasViewStateMaster = true;
                this.hasViewCompanyMaster = true;
                this.hasViewNotification = true;
                this.hasViewDN = true;
                this.hasViewAnnounceMaster = true;
                this.hasViewDocNotifySettings = true;
                this.hasViewPermissionFormdes = true;

                this.hasViewPermissionBranchPermission = true;

                this.hasViewPermissionCmpnyPol = true;

                this.hasViewPermissionEmtemp = true;
                this.hasViewPermissionLeaveEmtemp = true;
                this.hasViewPermissionDocExpEmtemp = true;
                this.hasViewPermissionDocReqEmtemp = true;
                this.hasViewPermissionAdvSalEmtemp = true;
                this.hasViewPermissionLoanReqEmtemp = true;
                this.hasViewPermissionAssetEmptemp = true;
                this.hasViewPermissionAirticketEmptemp = true;
                this.hasViewPermissionResignationEmptemp = true;




                this.hasViewWeek = true;
                this.hasViewWeekAssgn = true;
                this.hasViewHoly = true;
                this.hasViewHolyAssgn = true;
                this.hasViewShift = true;



                this.hasViewPermissionempreport = true;
                this.hasViewPermissiondocreport = true;
                this.hasViewPermissiongenreport = true;
                this.hasViewPermissiondeptreport = true;
                this.hasViewPermissiondesreport = true;
                this.hasViewPermissionLeavereport = true;
                this.hasViewPermissionLeaveAprreport = true;
                this.hasViewPermissionLeaveBalancereport = true;
                this.hasViewPermissionEmpAttendancereport = true;
                this.hasViewPermissionAssetreport = true;
                this.hasViewPermissionAssettransreport = true;


                this.hasViewPermissionEmpForm = true;
                this.hasviewPermissionAssetForm = true;

                 this.hasViewPermissionConfig = true;

                 this.hasViewPermissionDocReqType = true;
                 this.hasViewPermissionDocReqApr = true;
                 this.hasViewPermissionDocAprlvl = true;
                 this.hasViewPermissionDocReq = true;


        
              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

                this.hasViewPermissionBranch = this.checkGroupPermission('view_brnch_mstr', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionBranch);
      
                 this.hasViewPermissionUsers = this.checkGroupPermission('view_customuser', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionUsers);
                        
                  this.hasViewPermissionGroups = this.checkGroupPermission('view_group', groupPermissions);
                   console.log('Has view permission:', this.hasViewPermissionGroups);
      
                  this.hasViewPermissionDocType = this.checkGroupPermission('view_document_type', groupPermissions);
                   console.log('Has view permission:', this.hasViewPermissionDocType);
      
                    this.hasViewPermissionAssignPermission = this.checkGroupPermission('view_permission', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAssignPermission);
              
                    this.hasViewStateMaster = this.checkGroupPermission('view_state_mstr', groupPermissions);
                  console.log('Has view permission:', this.hasViewStateMaster);
      
                  this.hasViewCompanyMaster = this.checkGroupPermission('view_company', groupPermissions);
                   console.log('Has view permission:', this.hasViewCompanyMaster);
      
                    this.hasViewNotification = this.checkGroupPermission('view_notification', groupPermissions);
                    console.log('Has view permission:', this.hasViewNotification);

                    this.hasViewDN = this.checkGroupPermission('view_documentnumbering', groupPermissions);
                    console.log('Has view permission:', this.hasViewDN);

                    this.hasViewAnnounceMaster = this.checkGroupPermission('view_announcement', groupPermissions);
                    console.log('Has view permission:', this.hasViewAnnounceMaster);

                    this.hasViewDocNotifySettings = this.checkGroupPermission('view_notificationsettings', groupPermissions);
                    console.log('Has view permission:', this.hasViewDocNotifySettings);

                    this.hasViewPermissionBranchPermission = this.checkGroupPermission('view_userbranchaccess', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionBranchPermission);
                    
                    // this.hasViewPermissionFormdes = this.checkGroupPermission('view_emp_customfield', groupPermissions);
                    // console.log('Has view permission:', this.hasViewPermissionFormdes);

                    // Email Template Permissions
                   
                    this.hasViewPermissionEmtemp = this.checkGroupPermission('view_emailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionEmtemp);
                  
                    this.hasViewPermissionLeaveEmtemp = this.checkGroupPermission('view_lvemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionLeaveEmtemp);

                    this.hasViewPermissionDocExpEmtemp = this.checkGroupPermission('view_docexpemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocExpEmtemp);

                    this.hasViewPermissionDocReqEmtemp = this.checkGroupPermission('view_docrequestemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocReqEmtemp);

                    this.hasViewPermissionAdvSalEmtemp = this.checkGroupPermission('view_advancesalaryemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAdvSalEmtemp);

                    this.hasViewPermissionLoanReqEmtemp = this.checkGroupPermission('view_loanemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionLoanReqEmtemp);

                    this.hasViewPermissionAssetEmptemp = this.checkGroupPermission('view_assetemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAssetEmptemp);

                    this.hasViewPermissionAirticketEmptemp = this.checkGroupPermission('view_airticketemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAirticketEmptemp);

                    this.hasViewPermissionResignationEmptemp = this.checkGroupPermission('view_resignationemailtemplate', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionResignationEmptemp);


                  //  Company Policy Permissions

                    this.hasViewPermissionCmpnyPol = this.checkGroupPermission('view_companypolicy', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionCmpnyPol);
                   
                  //  Calender Permissions
                   
                    this.hasViewWeek = this.checkGroupPermission('view_weekend_calendar', groupPermissions);
                    console.log('Has view permission:', this.hasViewWeek);
                    
                    this.hasViewWeekAssgn = this.checkGroupPermission('view_assign_weekend', groupPermissions);
                    console.log('Has view permission:', this.hasViewWeekAssgn);

                    this.hasViewHoly = this.checkGroupPermission('view_holiday_calendar', groupPermissions);
                    console.log('Has view permission:', this.hasViewHoly);
                   
                    this.hasViewHolyAssgn = this.checkGroupPermission('view_assign_holiday', groupPermissions);
                    console.log('Has view permission:', this.hasViewHolyAssgn);
                  
                    this.hasViewShift = this.checkGroupPermission('view_shift', groupPermissions);
                    console.log('Has view permission:', this.hasViewShift);

                    // Report List Permissions
                  
                  this.hasViewPermissionempreport = this.checkGroupPermission('view_report', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionempreport);
      
                  this.hasViewPermissiondocreport = this.checkGroupPermission('view_doc_report', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissiondocreport);
              
                  this.hasViewPermissiongenreport = this.checkGroupPermission('view_generalrequestreport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissiongenreport);

                  this.hasViewPermissiondeptreport = this.checkGroupPermission('view_dept_report', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissiondeptreport);

                  this.hasViewPermissiondesreport = this.checkGroupPermission('view_designtn_report', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissiondesreport);
                  
                  this.hasViewPermissionLeavereport = this.checkGroupPermission('view_leavereport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionLeavereport);

                  this.hasViewPermissionLeaveAprreport = this.checkGroupPermission('view_leaveapprovalreport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionLeaveAprreport);

                  this.hasViewPermissionLeaveBalancereport = this.checkGroupPermission('view_lvbalancereport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionLeaveBalancereport);

                  this.hasViewPermissionEmpAttendancereport = this.checkGroupPermission('view_attendancereport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionEmpAttendancereport);

                  this.hasViewPermissionAssetreport = this.checkGroupPermission('view_assetreport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionAssetreport);

                  this.hasViewPermissionAssettransreport = this.checkGroupPermission('view_assettransactionreport', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionAssettransreport);


                  // Customization permissions

                this.hasViewPermissionEmpForm = this.checkGroupPermission('view_emp_customfield', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionEmpForm);

                this.hasviewPermissionAssetForm = this.checkGroupPermission('view_assetcustomfield', groupPermissions);
                  console.log('Has view permission:', this.hasviewPermissionAssetForm);


                  // Customization permissions

                  this.hasViewPermissionConfig = this.checkGroupPermission('view_emailconfiguration', groupPermissions);
                  console.log('Has view permission:', this.hasViewPermissionConfig);


                  // Document Permissions

                this.hasViewPermissionDocReqType = this.checkGroupPermission('view_docrequesttype', groupPermissions);
                console.log('Has view permission:', this.hasViewPermissionDocReqType);

                this.hasViewPermissionDocReqApr = this.checkGroupPermission('view_documentapproval', groupPermissions);
                console.log('Has view permission:', this.hasViewPermissionDocReqApr);

                this.hasViewPermissionDocAprlvl = this.checkGroupPermission('view_documentapprovallevel', groupPermissions);
                console.log('Has view permission:', this.hasViewPermissionDocAprlvl);

                this.hasViewPermissionDocReq = this.checkGroupPermission('view_documentrequest', groupPermissions);
                console.log('Has view permission:', this.hasViewPermissionDocReq);
      
                 
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
} else {
  console.error('User ID is null.');
}






  }

  
  // checkViewPermission(permissions: any[]): boolean {
  //   const requiredPermission = 'view_ctgry_master' ||'add_ctgry_master' ||'delete_ctgry_master' ||'change_ctgry_master';
    
  
  //   // Check user permissions
  //   if (permissions.some(permission => permission.codename === requiredPermission)) {
  //     return true;
  //   }
  
  //   // Check group permissions (if applicable)
  //   // Replace `// TODO: Implement group permission check`
  //   // with your logic to retrieve and check group permissions
  //   // (consider using a separate service or approach)
  //   return false; // Replace with actual group permission check
  // }

  

  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }

}
