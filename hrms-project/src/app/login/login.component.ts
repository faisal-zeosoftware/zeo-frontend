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
      const qp = new URLSearchParams(window.location.search);
      const u = qp.get('u');
      if (u) { this.username = u; }
      // v1.54.0 back from the company's identity provider
      const t = qp.get('sso'), e = qp.get('sso_error');
      if (t || e) { history.replaceState(null, '', window.location.pathname); }
      if (t) { this.ssoExchange(t); }
      if (e) { this.error = i18nT(e); }
      try { const n = sessionStorage.getItem('zeo_login_notice'); if (n) { sessionStorage.removeItem('zeo_login_notice'); this.notice = i18nT(n); } } catch { /* storage */ }   // v1.62.0
      try { const last = localStorage.getItem('zeo_sso_email'); if (!u && last && !t) { this.username = last; this.ssoCheck(true); } } catch { /* no storage */ }
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
  apps = [   // v1.38.0: every app, with its icon
    { icon: 'groups', name: 'HR and Payroll', text: 'Employees, attendance, leave, self service, salaries, WPS, benefits, surveys, recognition, e-signature and 360°' },
    { icon: 'account_tree', name: 'Projects', text: 'Support tickets with SLA, AMC contracts and delivery' },
    { icon: 'handshake', name: 'CRM', text: 'Leads, pipelines, quotations, sales orders and targets' },
    { icon: 'apartment', name: 'Property', text: 'Units, leases, cheques, owners and the tenant portal' },
    { icon: 'build', name: 'Maintenance', text: 'Work orders, preventive plans, assets and vendors' },
    { icon: 'inventory_2', name: 'Asset Management', text: 'Register, labels, counts, depreciation, helpdesk and spare parts' },
    { icon: 'health_and_safety', name: 'HSE', text: 'Permits to work, incidents, inspections and actions' },
    { icon: 'auto_awesome', name: 'Ask ZEO and AI assistants', text: 'Answers from your own data, payroll audit, rosters, CV matching, forecasts' },
  ];
  private say(msg: string): void { this.error = i18nT(msg); this.notice = ''; }
  /** v1.28.1: employees land on the same Home as everyone (the classic employee dashboard stays at /employee-dashboard
   *  for loans, advances and air tickets). A full load, like the staff company list, so every service starts with the
   *  employee's company (a router navigate left the top bar at "Select Company" and the Home empty). */
  private openEssHome(tenant: any): void {
    try {
      if (tenant?.id) { localStorage.setItem('selectedSchemaId', String(tenant.id)); }
      const ids = (tenant?.branches || []).map((b: any) => b.id).filter((x: any) => x);
      if (ids.length) { localStorage.setItem('selectedBranchIds', JSON.stringify(ids)); }
    } catch { /* storage blocked */ }
    window.location.href = '/main-sidebar/home';
  }
  backToStart(): void { this.step = 1; this.otp = ''; this.error = ''; this.notice = ''; this.password = ''; }

  // ---- v1.28.1: forgot password (e-mail → code → new password)
  forgotEmail = ''; forgotPassword = ''; forgotPassword2 = '';
  startForgot(): void { this.step = 10; this.error = ''; this.notice = ''; this.otp = ''; this.forgotEmail = this.username.includes('@') ? this.username.trim() : ''; }
  forgotSend(): void {
    const e = (this.forgotEmail || '').trim();
    if (!e || !e.includes('@')) { this.error = i18nT('Enter the e-mail address of your user.'); return; }
    this.isLoading = true; this.error = ''; this.notice = '';
    this.UserMasterService.sendResetOtp(e).subscribe({
      next: () => { this.isLoading = false; this.step = 11; this.notice = i18nT('A code was sent to {0}. It is valid for 10 minutes.', [e]); },
      error: (err) => { this.isLoading = false; this.error = err?.error?.error || err?.error?.detail || i18nT('The code could not be sent. Check the e-mail address.'); },
    });
  }
  forgotReset(): void {
    if (!this.otp.trim()) { this.error = i18nT('Enter the code from the e-mail.'); return; }
    if ((this.forgotPassword || '').length < 8) { this.error = i18nT('The new password must have at least 8 characters.'); return; }
    if (this.forgotPassword !== this.forgotPassword2) { this.error = i18nT('The two passwords are not the same.'); return; }
    this.isLoading = true; this.error = ''; this.notice = '';
    this.UserMasterService.resetPassword(this.forgotEmail.trim(), this.forgotPassword, this.otp.trim()).subscribe({
      next: () => { this.isLoading = false; this.backToStart(); this.username = this.forgotEmail.trim(); this.notice = i18nT('Your password was changed. Sign in with the new password.'); },
      error: (err) => { this.isLoading = false; this.error = err?.error?.error || err?.error?.detail || i18nT('The password could not be changed.'); },
    });
  }


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
              if (response?.two_factor === 'totp') {   // v1.52.0 the authenticator app code comes next
                this.isLoading = false;
                this.challenge = response.challenge; this.userId = response.user_id; this.otp = ''; this.error = ''; this.notice = '';
                this.step = 4;
                return;
              }
              if (response?.first_check) {   // v1.62.0 the company default password: one more check at the first sign-in
                this.isLoading = false;
                this.challenge = response.challenge; this.userId = response.user_id; this.eid4 = ''; this.dob = ''; this.error = ''; this.notice = '';
                this.step = 12;
                return;
              }
  
              const token = response.access;
              this.authService.setAuthToken(token);
              this.afterTokens(response);
  
              const loggedUserId = response.user_id;
              this.gate(response, () => {   // v1.62.0 a password someone else knows is changed first
  
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
                      this.openEssHome(tenant);
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
              });
  
            },
            () => {
              this.isLoading = false;
              this.say('The e-mail, employee code or password is not correct.');
            }
          );
  
        },
        (e: any) => {
          this.isLoading = false;
          const m = String(e?.error?.non_field_errors?.[0] || '');
          if (m.startsWith('Too many')) { this.error = m; return; }   // v1.52.0 locked after wrong passwords
          if (e?.error?.sso || m.includes('"')) { this.error = m; this.ssoCheck(true); return; }   // v1.54.0 the company signs in with SSO
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
          this.afterTokens(res);
  
          // Now fetch user data → same as your current login code
          this.gate(res, () => this.afterLoginRedirect());
        },
        () => {
          this.isLoading = false;
          this.say('The code is not correct or has expired.');
        }
      );
  }
    
  
  /** v1.62.0 – first sign-in with the company default password: last 4 digits of the Emirates ID and the date of birth. */
  eid4 = ''; dob = '';
  verifyFirstCheck(): void {
    if (!this.dob) { this.say('Enter your date of birth.'); return; }
    this.isLoading = true;
    this.http.post(`${this.apiUrl}/users/first-check/`, { challenge: this.challenge, eid_last4: this.eid4.trim(), dob: this.dob }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.authService.setAuthToken(res.access);
        this.afterTokens(res);
        this.gate(res, () => this.afterLoginRedirect());
      },
      error: (e: any) => {
        this.isLoading = false;
        if (e?.status === 401) { this.backToStart(); }
        this.error = e?.error?.detail || i18nT('The Emirates ID digits or the date of birth do not match.');
      },
    });
  }

  /** v1.52.0 – the second step of a sign-in with the authenticator app (no e-mail code after it). */
  challenge = '';
  verifyAuthenticator(): void {
    const code = (this.otp || '').replace(/\s/g, '');
    if (!code) { this.say('Enter the code.'); return; }
    this.isLoading = true;
    this.http.post(`${this.apiUrl}/users/2fa/login/`, { challenge: this.challenge, code }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.authService.setAuthToken(res.access);
        this.afterTokens(res);
        this.gate(res, () => { if (res.is_superuser) { this.router.navigate(['/schema-selection']); return; } this.afterLoginRedirect(); });
      },
      error: (e: any) => {
        this.isLoading = false;
        if (e?.status === 401) { this.backToStart(); }
        this.error = e?.error?.detail || i18nT('The code is not correct.');
      },
    });
  }

  // ---------------------------------------------------------------- v1.54.0 single sign-on
  sso: { provider: { id: number; name: string; kind: string }; password: boolean } | null = null;
  directory: { name: string } | null = null;   // Active Directory: the password is checked by the domain controller
  ssoBusy = false;
  private ssoTimer: any;
  private ssoFor = '';

  /** the company of the typed e-mail signs in with its identity provider? (asked once per domain, after a short pause) */
  ssoCheck(now = false): void {
    clearTimeout(this.ssoTimer);
    const email = (this.username || '').trim().toLowerCase();
    const domain = email.includes('@') ? email.split('@')[1] : '';
    if (!domain || !domain.includes('.')) { this.sso = null; this.directory = null; this.ssoFor = ''; return; }
    if (domain === this.ssoFor) { return; }
    this.ssoTimer = setTimeout(() => {
      this.http.get<any>(`${this.apiUrl}/users/sso/discover/`, { params: { email } }).subscribe({
        next: r => { this.ssoFor = domain; this.sso = r?.sso ? r : null; this.directory = r?.directory || null; },
        error: () => { this.sso = null; this.directory = null; },
      });
    }, now ? 0 : 450);
  }

  ssoStart(): void {
    if (!this.sso) { return; }
    this.ssoBusy = true; this.error = '';
    const email = (this.username || '').trim();
    try { localStorage.setItem('zeo_sso_email', email); } catch { /* no storage */ }
    this.http.get<any>(`${this.apiUrl}/users/sso/start/${this.sso.provider.id}/`, { params: { app: window.location.origin, back: window.location.pathname || '/login', email } })
      .subscribe({
        next: r => { window.location.href = r.url; },
        error: e => { this.ssoBusy = false; this.error = e?.error?.detail || i18nT('The sign-in could not be started. Try again.'); },
      });
  }

  /** the one-time ticket from the identity provider → the usual sign-in */
  ssoExchange(ticket: string): void {
    this.isLoading = true;
    this.http.post<any>(`${this.apiUrl}/users/sso/exchange/`, { ticket }).subscribe({
      next: res => {
        this.isLoading = false;
        this.userId = res.user_id;
        this.authService.setAuthToken(res.access);
        this.afterTokens(res);
        if (res.is_superuser) { this.router.navigate(['/schema-selection']); return; }
        this.afterLoginRedirect();
      },
      error: e => { this.isLoading = false; this.error = e?.error?.detail || i18nT('The sign-in took too long or was already used. Start again.'); },
    });
  }

  /** v1.62.0 – a generated, typed, start or temporary password (someone else knows it): the user chooses an own password before
   *  anything else opens (the server refuses every other request until then – 403 password_change_required). */
  newPw = ''; newPw2 = ''; private afterChange: (() => void) | null = null;
  private gate(res: any, next: () => void): void {
    if (res?.must_change_password && this.password) {
      this.isLoading = false; this.afterChange = next; this.newPw = ''; this.newPw2 = ''; this.error = ''; this.notice = '';
      this.step = 13;
      return;
    }
    next();
  }
  saveOwnPassword(): void {
    if (!this.newPw) { this.say('Enter the new password.'); return; }
    if (this.newPw !== this.newPw2) { this.say('The two passwords are not the same.'); return; }
    this.isLoading = true;
    this.http.post(`${this.apiUrl}/users/change-password/`, { old_password: this.password, new_password: this.newPw, confirm_password: this.newPw2 }).subscribe({
      next: () => {
        this.isLoading = false; this.password = ''; this.newPw = ''; this.newPw2 = '';
        const go = this.afterChange; this.afterChange = null;
        if (go) { go(); }
      },
      error: (e: any) => {
        this.isLoading = false;
        const er = e?.error || {};
        this.error = er.message || er.detail || (er.new_password || [])[0] || (er.non_field_errors || [])[0] || i18nT('The password could not be changed.');
      },
    });
  }

  /** v1.52.0 – keep the refresh token and what the sign-in rules ask for (new password, authenticator set-up). */
  afterTokens(res: any): void {
    try {
      if (res?.refresh) { localStorage.setItem('refresh_token', res.refresh); }
      const ask: string[] = [];
      if (res?.password_expired) { ask.push('password'); }
      if (res?.setup_2fa) { ask.push('2fa'); }
      if (ask.length) { sessionStorage.setItem('zeo_security_ask', ask.join(',')); } else { sessionStorage.removeItem('zeo_security_ask'); }
    } catch { /* no storage */ }
    if (res?.access) {   // v1.56.1: the cookie that opens uploaded files (/media/ needs a login)
      this.http.post(`${environment.apiBaseUrl}/users/media-cookie/`, {}, { withCredentials: true, headers: { Authorization: `Bearer ${res.access}` } })
        .subscribe({ error: () => undefined });
    }
  }

  afterLoginRedirect() {
    this.authService.getUserData(this.userId!).subscribe(
      (userData: any) => {
        const isEssUser = userData.is_ess;
        const tenants = userData.allocated_tenants;
  
        if (isEssUser && tenants.length > 0) {
          const tenant = tenants[0];
          localStorage.setItem('selectedSchema', tenant.schema_name);
          this.openEssHome(tenant);
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
