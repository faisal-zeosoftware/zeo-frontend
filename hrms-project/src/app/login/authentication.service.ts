import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { EmployeeDetailsComponent } from '../employee-details/employee-details.component';
import { EmployeeService } from '../employee-master/employee.service';
import { environment } from '../../environments/environment';

interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

// Define a Permission interface to represent permission objects
interface Permission {
  codename: string;
  // Add any other properties your permissions might have
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private apiUrl = `${environment.apiBaseUrl}/users`; // Use the correct `apiBaseUrl` for live and local

  //testing
  private tokenKey = 'auth_token';

  private userPermissionsSubject: BehaviorSubject<Permission[]> = new BehaviorSubject<Permission[]>([]);
  public user_permissions$: Observable<Permission[]> = this.userPermissionsSubject.asObservable();

  constructor(private http: HttpClient, private EmployeeService: EmployeeService) {}

  // login(username: string, password: string): Observable<any> {
  //   const url = `${this.apiUrl}/token/`;
  //   const body = { username, password };
  //   return this.http.post(url, body).pipe(
  //     tap((response: any) => {
  //       const token = response.access;
  //       this.setAuthToken(token);
  //     })
  //   );
  // }

  // login( password: string,username: string,): Observable<any> {
  //   const url = `${this.apiUrl}/token/`;
  //   const body = {  password,username, };
  //   return this.http.post(url, body).pipe(
  //     tap((response: any) => {
  //       const token = response.access;
  //       this.setAuthToken(token);
  //     })
  //   );
  // }

  login(password: string, username: string): Observable<any> {
    const url = `${this.apiUrl}/token/`;
    const body = { password, username };

    // Set custom headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json', // Specify the content type
      'Accept': 'application/json',      // Specify accepted response type
    });

    return this.http.post(url, body, { headers }).pipe(
      tap((response: any) => {
        const token = response.access;
        if (token) { this.setAuthToken(token); }   // v1.52.0 no token yet when the authenticator code comes next
      })
    );
  }

  
  private fetchUserPermissions() {
    this.http.get<string[]>(`${this.apiUrl}/api/user/7/role_grouping/`).pipe(
      map((permissions: string[]) => permissions.map(permission => ({ codename: permission } as Permission)))
    ).subscribe(permissions => {
      this.userPermissionsSubject.next(permissions);
    });
  }


  
  

  getUserPermissions(): Observable<string[]> {
    // Assuming your backend API endpoint for fetching user permissions is '/api/user/permissions'
    return this.http.get<string[]>(`${this.apiUrl}/api/user/9/role_grouping/`);

  }



  
  
  getEmployeeDetails(employeeId: number): Observable<any> {
    const url = `${this.apiUrl}/api/user/${employeeId}/`;
    return this.http.get(url);
  }

  getUserDetails(userId: number): Observable<any> {
    const url = `${this.apiUrl}/api/user/${userId}`; // Assuming your API endpoint to fetch user details is '/users/:userId'
    return this.http.get(url);
  }


  getLoggedInUserId(): number | null {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const decodedToken = this.decodeJwt(token);
      return decodedToken.userId;
    } else {
      return null;
    }
  }

  private decodeJwt(token: string): any {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }

  // v1.28.1: most screens call this two or three times while they open (rights checks) – one request is shared
  // for a few seconds and served from memory; a save that changes the login (users screen) calls forgetUserData().
  private userDataCache = new Map<number, { at: number; obs: Observable<any> }>();
  getUserData(userId: number): Observable<any> {
    const hit = this.userDataCache.get(userId);
    if (hit && Date.now() - hit.at < 8000) { return hit.obs; }
    const url = `${this.apiUrl}/api/user/${userId}/`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getAuthToken()}`
    });
    const obs = this.http.get(url, { headers }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.userDataCache.set(userId, { at: Date.now(), obs });
    return obs;
  }
  forgetUserData(): void { this.userDataCache.clear(); }

  getDesignationsPermission(selectedSchema: string): Observable<any> {

    const apiUrl = `${environment.apiBaseUrl}/organisation/api/permissions/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  // v1.56.1 (release checklist, page speed): the top bar, the company menu and the screens asked for the companies and branches
  // of the login 2–4 times while a page opened (each answer counts the notifications of every branch) – one request is
  // shared for a few seconds, like getUserData
  private schemaCache = new Map<number, { at: number; obs: Observable<any> }>();
  getUserSchema(userId: number): Observable<any> {
    const hit = this.schemaCache.get(userId);
    if (hit && Date.now() - hit.at < 8000) { return hit.obs; }
    const url = `${this.apiUrl}/api/user/${userId}/tenants`;
    const obs = this.http.get(url).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.schemaCache.set(userId, { at: Date.now(), obs });
    return obs;
  }

  fetchSchemaDetails(schemaId: number): Observable<any> {
    const url = `${this.apiUrl}/api/company/${schemaId}`;
    return this.http.get(url);
  }
  
  // getUserSchemas(): Observable<string[]> {
  //   // Replace this with your actual API endpoint
  //   return this.http.get<string[]>('http://localhost:8000/users/api/company');
  // }

  // getSelectedSchema(): string | null {
  //   // Retrieve the selected schema from localStorage
  //   const selectedSchema = localStorage.getItem('selectedSchema');
  //   return selectedSchema ? selectedSchema : null;
  // }

  getSelectedSchema(): string | null {
    // Retrieve the selected schema from localStorage
    const selectedSchema = localStorage.getItem('selectedSchema');
    return selectedSchema ? selectedSchema : null;
  }

  getSelectedSchemaId(): number | null {
    const selectedSchemaId = localStorage.getItem('selectedSchemaId');
    return selectedSchemaId ? parseInt(selectedSchemaId) : null;
  }
  
  getEmployee(): Observable<any> {
    const url = `${this.apiUrl}/api/user/`;
    return this.http.get(url);
 
  }

  // registerUser(username:'',firstname:'', lastname:'',email: string, ContactNumber:'', password: string): Observable<any> {
  //   const url = `${this.apiUrl}/api/user/`;
  //   const body = {username,firstname,lastname, email,ContactNumber, password };
  //   return this.http.post(url, body);
  // }
  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/user/`, userData);
  }
  
  
   getToken(): string | null {
    return localStorage.getItem('access_token');
  }


  setAuthToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }


  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getAuthToken();
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }


  logout(): Observable<any> {
    // v1.52.0 end this sign-in on the server too (its tokens stop working at once); an impersonation ends with it
    const t = this.getAuthToken();
    if (t) {
      const h = new HttpHeaders({ Authorization: `Bearer ${t}` });
      let imp = false;
      try { imp = !!JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).imp; } catch { imp = false; }
      this.http.post(imp ? `${this.apiUrl}/impersonate/stop/` : `${this.apiUrl}/sessions/`, imp ? {} : { action: 'sign_out' }, { headers: h }).subscribe({ error: () => {} });
    }
    try { sessionStorage.removeItem('zeo_imp_admin'); } catch { /* no storage */ }
    this.forgetUserData();
       this.clearTokens();

    localStorage.removeItem(this.tokenKey);
    return of({ success: true });
  }


//   isTokenExpired(): boolean {
//   const token = this.getToken();
//   if (!token) return true;

//   const payload = JSON.parse(atob(token.split('.')[1]));
//   return (payload.exp * 1000) < Date.now();
// }
 

  handleSessionExpiration(): void {
    // alert('Session expired. Please log in again.');
    // this.logout();  
  }

  // isAuthenticated(): boolean {
  //   return !!this.getAuthToken();
  // }

    // Remove authentication token from local storage
    // private removeAuthToken(): void {
    //   localStorage.removeItem(this.tokenKey);
    // }


    // getLoggedInUser(): Observable<any> {
    //   // Assuming you have an API endpoint for fetching logged-in user data
    //   return this.http.get<any>('http://localhost:8000/users/api/user/');
    // }
    


    validateCredentials(username: string, password: string) {
      return this.http.post(`${this.apiUrl}/users/validate-credentials/`, { username, password });
    }
    
    sendOtp(user_id: number) {
      return this.http.post(`${this.apiUrl}/users/send-otp/`, { user_id });
    }
    
    verifyOtp(user_id: number, otp: string) {
      return this.http.post(`${this.apiUrl}/users/verify-otp/`, { user_id, otp });
    }



}
