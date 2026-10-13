import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { UserService } from '../user.service';
import { HttpErrorResponse } from '@angular/common/http';
import { style } from '@angular/animations';
import { AuthenticationService } from './authentication.service';
import { UserMasterComponent } from '../user-master/user-master.component';
import { UserMasterService } from '../user-master/user-master.service';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';
import { APP_VERSION } from '../shared-ui/version';
import { i18nT } from '../shared-ui/i18n-core';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [UserService]
})
export class LoginComponent implements OnInit {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local



  // v1.15.1: never pre-fill credentials (customer finding 1). There is no remember-me; nothing is saved by the app.
  username: string = '';
  hide: boolean = true;
  input: any;
  register: any;
  email = '';
  password = '';
  contact_number: any='';

  users: any[] = [];

  registerButtonClicked = false;


  first_name: string = '';


  

  loggedInUser: any; // Assuming this contains logged-in user's data


  constructor(private UserMasterService: UserMasterService,
     private router: Router,
          private http: HttpClient,

      private authService: AuthenticationService,
      private EmployeeService: EmployeeService) { }

  cloudSignup = false;   // v1.23.0 ZEO Cloud: "Start a free trial" link

  ngOnInit(): void {
    try {   // v1.23.0: e-mail from the sign-up page, and the sign-up link when this server runs ZEO Cloud
      const u = new URLSearchParams(window.location.search).get('u');
      if (u) { this.username = u; }
    } catch { /* no URL */ }
    this.http.get<any>(`${environment.apiBaseUrl}/cloud/api/signup/plans/`).subscribe({ next: r => this.cloudSignup = !!r?.cloud, error: () => undefined });

    // v1.15.1: the login page no longer downloads the user list (it was unused and exposed user names before login).
    // user register  section

    this.register = {
      username: '',
      firstname: '',
      lastname: '',
      email: '',
      // companyrole:'',
      contact_number: '',
      password: '',

    };


    // user login section

    // this.input = {

    //   email: '',

    //   password: ''

    // }

    

  }

  isEssUser: boolean = true; // Default value, adjust based on your logic

  // v1.22.2: messages on the page instead of pop-ups
  error = '';
  notice = '';
  tried = false;
  version = APP_VERSION;
  apps = [
    { name: 'HR and Payroll', text: 'People, attendance, leave, self service, salaries and WPS' },   // v1.23.0 HR free with any app, Payroll its own app
    { name: 'Projects', text: 'Support tickets with SLA, AMC contracts and delivery' },
    { name: 'CRM', text: 'Contacts, pipelines, viewings and offers' },
    { name: 'Property', text: 'Units, leases, cheques, owners and the tenant portal' },
    { name: 'Maintenance', text: 'Work orders, preventive plans, assets and vendors' },
    { name: 'HSE', text: 'Permits to work, incidents, inspections and actions' },
  ];
  private say(msg: string): void { this.error = i18nT(msg); this.notice = ''; }
  backToStart(): void { this.step = 1; this.otp = ''; this.error = ''; this.notice = ''; this.password = ''; }


  step: number = 1;  
  otp: string = '';
  userId: number | null = null;

  isLoading = false;

  showPassword: boolean = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}
  
  validateCredentials() {

    // Basic field validation
    this.tried = true;
    if (!this.username || !this.password) {
      this.say(!this.username ? 'Enter your e-mail or employee code.' : 'Enter your password.');
      return;
    }
    this.error = '';
  
    this.isLoading = true;
  
    // Step 1 → Validate credentials API
    const body = {
      username: this.username,
      password: this.password
    };
  
    this.http.post(`${this.apiUrl}/users/validate-credentials/`, body)
      .subscribe(
        (res: any) => {
  
          // If credentials validated → get user_id
          const validatedUserId = res.user_id;
  
          // Step 2 → Login to get token
          this.authService.login(this.password, this.username).subscribe(
            (response: any) => {
  
              const token = response.access;
              this.authService.setAuthToken(token);
  
              const loggedUserId = response.user_id;
  
              // Step 3 → Fetch full user profile
              this.authService.getUserData(loggedUserId).subscribe(
                (userData: any) => {
  
                  this.isLoading = false;
  
                  const isSuperUser = userData.is_superuser;
                  const isEssUser = userData.is_ess;
                  const tenants = userData.allocated_tenants;
  
                  // **************************************************
                  // 1️⃣ SUPERUSER LOGIN → DIRECT (NO OTP)
                  // **************************************************
                  if (isSuperUser === true) {
                    this.router.navigate(['/schema-selection']);
                    return;
                  }
  
                  // **************************************************
                  // 2️⃣ ESS EMPLOYEE LOGIN → DIRECT (NO OTP)
                  // **************************************************
                  if (isEssUser === true) {
  
                    if (tenants.length > 0) {
                      const tenant = tenants[0];
                      const selectedSchema = tenant.schema_name;
                      localStorage.setItem('selectedSchema', selectedSchema);
  
                      this.router.navigate(['/employee-dashboard']);
                      return;
                    }
  
                    this.say('No company is set up for your login yet. Ask your HR team.');
                    return;
                  }
  
                  // **************************************************
                  // 3️⃣ NORMAL USER LOGIN → OTP REQUIRED
                  // **************************************************
                  // is_superuser = false AND is_ess = null/false
                  this.userId = loggedUserId;
                  this.step = 2;  // Move to OTP send step
                  
  
                },
                () => {
                  this.isLoading = false;
                  this.say('Your user details could not be loaded. Try again.');
                }
              );
  
            },
            () => {
              this.isLoading = false;
              this.say('The e-mail, employee code or password is not correct.');
            }
          );
  
        },
        () => {
          this.isLoading = false;
          this.say('The e-mail, employee code or password is not correct.');
        }
      );
  }
  
  // hbsjdfb
  
  
  sendOtp() {
      this.isLoading = true;

    if (!this.userId) return;
  
    const body = { user_id: this.userId };
  
    this.http.post(`${this.apiUrl}/users/send-otp/`, body)
      .subscribe(
        () => {
          this.isLoading = false;

          this.error = '';
          this.notice = i18nT('We sent the code to your registered e-mail or phone.');
          this.step = 3;
        },
        () =>
          { 
            this.isLoading = false;

            this.say('The code could not be sent. Try again in a minute.');
          }
      );
  }
  
  verifyOtp() {

    if (!this.userId || !this.otp) {
      this.say('Enter the code.');
      return;
    }
    this.isLoading = true;

    const body = {
      user_id: this.userId,
      otp: this.otp
    };
  
    this.http.post(`${this.apiUrl}/users/verify-otp/`, body)
      .subscribe(
        (res: any) => {
          this.isLoading = false;

          const token = res.access;
          this.authService.setAuthToken(token);
  
          // Now fetch user data → same as your current login code
          this.afterLoginRedirect();
        },
        () => {
          this.isLoading = false;
          this.say('The code is not correct or has expired.');
        }
      );
  }
    
  
  afterLoginRedirect() {
    this.authService.getUserData(this.userId!).subscribe(
      (userData: any) => {
        const isEssUser = userData.is_ess;
        const tenants = userData.allocated_tenants;
  
        if (isEssUser && tenants.length > 0) {
          const tenant = tenants[0];
          localStorage.setItem('selectedSchema', tenant.schema_name);
  
          this.router.navigate(['/employee-dashboard']);
        } else if (!isEssUser) {
          this.router.navigate(['/schema-selection']);
        } else {
          this.say('No company is set up for your login yet. Ask your HR team.');
        }
      },
      () => this.say('Your user details could not be loaded. Try again.')
    );
  }

  
  

  loadUser(): void {
    this.authService.getEmployee().subscribe(
      (result: any) => {
        this.users = result;
        console.log(' fetching Users:');

      },
      (error) => {
        console.error('Error fetching USERS:', error);
      }
    );
  }


  

  // user register button click event code here

  registerUser() {

    // this.registerButtonClicked = true;

    this.UserMasterService.registeruser(this.register).subscribe(
      _Response => {
        const token = _Response.access;  // Assuming your token key is 'access'
        this.authService.setAuthToken(token);
        alert('User has been created!')
        // this.router.navigate(['./login']);
        this.showCurrentDiv = !this.showCurrentDiv;
      },

      (error) => {
        if (error instanceof HttpErrorResponse && error.status === 400) {
          // Handle validation errors
          console.log('Validation errors:', error.error);
          // Display error messages to the user
          alert('Please enter all fields')

        } else {
          // Handle other types of errors
          console.error('Unexpected error:', error);
          alert('Something Error')
          // console.log('Please fill in the required fields.');
          // alert('enter all fields')
        }

      }
    );

  }







  // switching sign in and signup pages code here


  showCurrentDiv: boolean = true;
  showButton: boolean = true;

  toggleDivs() {
    this.showCurrentDiv = !this.showCurrentDiv;

  }





}
