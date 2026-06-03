import { Component } from '@angular/core';
import { EmployeeService } from '../employee-master/employee.service';
import { SessionService } from '../login/session.service';
import { AuthenticationService } from '../login/authentication.service';
import { DesignationService } from '../designation-master/designation.service';
import { CatogaryService } from '../catogary-master/catogary.service';

@Component({
  selector: 'app-general-sidebar',
  templateUrl: './general-sidebar.component.html',
  styleUrl: './general-sidebar.component.css'
})
export class GeneralSidebarComponent {




  // Document Permissions
  hasViewPermissionDocReqType: boolean = false;
  hasViewPermissionDocReqApr: boolean = false;
  hasViewPermissionDocAprlvl: boolean = false;
  hasViewPermissionDocReq: boolean = false;
  // General Permissions
  hasViewPermissionGenreq: boolean = false;
  hasViewPermissionReqType: boolean = false;
  hasViewPermissionAprv: boolean = false;
  hasViewPermissionAprvlvl: boolean = false;
  hasViewPermissionGenReqEsc: boolean = false;







  userId: number | null | undefined;
  userDetails: any;


  Catogaries: any[] = [];



  constructor(private EmployeeService: EmployeeService,
    private sessionService: SessionService,
    private authService: AuthenticationService,
    private DesignationService: DesignationService,
    private CatogaryService: CatogaryService




  ) {

  }



  isMenuOpen: boolean = true;
  toggleSidebarMenu(): void { this.isMenuOpen = !this.isMenuOpen; }



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
          if (!selectedSchema) {
            console.error('No schema selected.');
            return;
          }


          if (isSuperuser) {
            console.log('User is superuser or ESS user');
            // Grant all permissions


            this.hasViewPermissionDocReqType = true;
            this.hasViewPermissionDocReqApr = true;
            this.hasViewPermissionDocAprlvl = true;
            this.hasViewPermissionDocReq = true;

            this.hasViewPermissionGenreq = true;
            this.hasViewPermissionReqType = true;
            this.hasViewPermissionAprv = true;
            this.hasViewPermissionAprvlvl = true;
            this.hasViewPermissionGenReqEsc = true;





            // Fetch designations without checking permissions
            this.fetchDesignations(selectedSchema);
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

                    this.hasViewPermissionDocReqType = true;
                    this.hasViewPermissionDocReqApr = true;
                    this.hasViewPermissionDocAprlvl = true;
                    this.hasViewPermissionDocReq = true;

                    this.hasViewPermissionGenreq = true;
                    this.hasViewPermissionReqType = true;
                    this.hasViewPermissionAprv = true;
                    this.hasViewPermissionAprvlvl = true;
                    this.hasViewPermissionGenReqEsc = true;






                  } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                    const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                    console.log('Group Permissions:', groupPermissions);



                    this.hasViewPermissionDocReqType = this.checkGroupPermission('view_docrequesttype', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocReqType);

                    this.hasViewPermissionDocReqApr = this.checkGroupPermission('view_documentapproval', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocReqApr);

                    this.hasViewPermissionDocAprlvl = this.checkGroupPermission('view_documentapprovallevel', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocAprlvl);

                    this.hasViewPermissionDocReq = this.checkGroupPermission('view_documentrequest', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionDocReq);

                    this.hasViewPermissionGenreq = this.checkGroupPermission('view_generalrequest', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionGenreq);

                    this.hasViewPermissionReqType = this.checkGroupPermission('view_requesttype', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionReqType);

                    this.hasViewPermissionAprv = this.checkGroupPermission('view_approval', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAprv);

                    this.hasViewPermissionAprvlvl = this.checkGroupPermission('view_approvallevel', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionAprvlvl);

                    this.hasViewPermissionGenReqEsc = this.checkGroupPermission('view_genrl_escalation', groupPermissions);
                    console.log('Has view permission:', this.hasViewPermissionGenReqEsc);


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







  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
    return groupPermissions.some(permission => permission.codename === codeName);
  }















  fetchDesignations(selectedSchema: string) {
    this.CatogaryService.getcatogarys(selectedSchema).subscribe(
      (data: any) => {
        this.Catogaries = data;
        console.log('employee:', this.Catogaries);
      },
      (error: any) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  showGeneralRequest = false;

  toggleGeneralRequest() {
    this.showGeneralRequest = !this.showGeneralRequest;
  }

  showDocumentRequest = false;

  toggleDocumentRequest() {
    this.showDocumentRequest = !this.showDocumentRequest;
  }




}
