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


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [UserService]
})
export class LoginComponent implements OnInit {
  username: string = 'admin@zeo.com';
  hide: boolean = true;
  input: any;
  register: any;
  email = '';
  password = 'admin';
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

  ngOnInit(): void {
    

    this.loadEmployee();
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

    //   email: 'testing@gmail.com',

    //   password: 'test'

    // }

    

  }

  isEssUser: boolean = true; // Default value, adjust based on your logic


  step: number = 1;  
  otp: string = '';
  userId: number | null = null;

  isLoading = false;
  
  validateCredentials() {
    if (!this.username || !this.password) {
      alert("Username & password required");
      return;
    }
    this.isLoading = true;

  
    const body = {
      username: this.username,
      password: this.password
    };
  
    this.http.post("http://127.0.0.1:8000/users/validate-credentials/", body)
      .subscribe(
        (res: any) => {
                  this.isLoading = false;

          this.userId = res.user_id;
          this.step = 2; // Go to OTP send step
        },
        () => 
          {
            this.isLoading = false;

            alert("Invalid username or password")
          }
      );
  }
  
  sendOtp() {
      this.isLoading = true;

    if (!this.userId) return;
  
    const body = { user_id: this.userId };
  
    this.http.post("http://127.0.0.1:8000/users/send-otp/", body)
      .subscribe(
        () => {
          this.isLoading = false;

          alert("OTP sent to your registered email/phone");
          this.step = 3;
        },
        () =>
          { 
            this.isLoading = false;

            alert("Failed to send OTP")
          }
      );
  }
  
  verifyOtp() {

    if (!this.userId || !this.otp) {
      alert("Enter OTP");
      return;
    }
    this.isLoading = true;

    const body = {
      user_id: this.userId,
      otp: this.otp
    };
  
    this.http.post("http://127.0.0.1:8000/users/verify-otp/", body)
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
          alert("Invalid OTP");
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
          alert("No tenant available for this user");
        }
      },
      () => alert("Error loading user data")
    );
  }

  
  

  loadEmployee(): void {
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
