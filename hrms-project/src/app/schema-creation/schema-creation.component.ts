import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { UserMasterComponent } from '../user-master/user-master.component';
import { UserService } from '../user.service';
import { UserMasterService } from '../user-master/user-master.service';
import { CountryService } from '../country.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';
import { i18nT } from '../shared-ui/i18n-core';


@Component({
  selector: 'app-schema-creation',
  templateUrl: './schema-creation.component.html',
  styleUrl: './schema-creation.component.css'
})
export class SchemaCreationComponent {
  
  
  registerButtonClicked = false;
  schema_name : string = '';
  name : string = '';
  owner:any='';
  country:any='';
  currency:any='';

  industry_type : string = '';
  // v1.21.0: apps the company uses (Settings › Apps can change them later)
  appChoices = [
    { key: 'hrms', label: 'HR', hint: 'People, time, leave, documents – comes with any app', on: true },
    { key: 'payroll', label: 'Payroll', hint: 'Salaries, payslips, WPS, gratuity', on: true },   // v1.23.0 own app
    { key: 'projects', label: 'Projects', hint: 'Tickets, AMC, delivery', on: false },
    { key: 'crm', label: 'CRM', hint: 'Contacts, pipelines, deals', on: false },
    { key: 'property', label: 'Property', hint: 'Units, leases, sales', on: false },
    { key: 'maintenance', label: 'Maintenance', hint: 'Work orders, plans', on: false },
    { key: 'assets', label: 'Asset Management', hint: 'Asset register, labels, counts, depreciation', on: false },   // v1.33.0
    { key: 'people', label: 'People', hint: 'Benefits, e-signature, forms, surveys, recognition, chat, 360°', on: false },   // v1.36.0
    { key: 'hse', label: 'HSE', hint: 'Risk, permits, incidents', on: false },
  ];
  chosenApps(): string[] {   // v1.23.0: HR comes with any app
    const k = this.appChoices.filter(a => a.on).map(a => a.key);
    return k.length && !k.includes('hrms') ? ['hrms', ...k] : k;
  }
  // v1.62.1 (user request 2 Nov): "Starting setup" – standard defaults (as before) or the setup of a branch of another company
  setupMode: 'standard' | 'copy' = 'standard';
  copySources: { id: number; name: string; schema_name: string }[] = [];
  copyFrom: any = '';
  copyBranches: { id: number; name: string; code: string }[] = [];
  copyBranch: any = '';
  copyBranchName = '';
  copyBranchCode = '';
  copyLoading = false;
  private loadCopySources(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/users/api/company-copy-sources/`).subscribe({
      next: r => { this.copySources = r?.companies || []; },
      error: () => { this.copySources = []; },
    });
  }
  onCopyFrom(): void {
    this.copyBranches = []; this.copyBranch = ''; this.copyBranchName = ''; this.copyBranchCode = '';
    const c = this.copySources.find(x => String(x.id) === String(this.copyFrom));
    if (!c) { return; }
    this.copyLoading = true;
    this.http.get<any>(`${environment.apiBaseUrl}/organisation/api/Branch/?schema=${encodeURIComponent(c.schema_name)}`).subscribe({
      next: r => {
        const list = Array.isArray(r) ? r : (r?.results || []);
        this.copyBranches = list.map((b: any) => ({ id: b.id, name: b.branch_name, code: b.branch_code || '' }));
        this.copyLoading = false;
        if (this.copyBranches.length === 1) { this.copyBranch = String(this.copyBranches[0].id); this.onCopyBranch(); }
      },
      error: () => { this.copyLoading = false; this.copyBranches = []; },
    });
  }
  onCopyBranch(): void {
    const b = this.copyBranches.find(x => String(x.id) === String(this.copyBranch));
    this.copyBranchName = b ? b.name : '';
    this.copyBranchCode = b ? (b.code || '').toUpperCase() : '';
  }
  copySourceName(): string { return this.copySources.find(x => String(x.id) === String(this.copyFrom))?.name || ''; }
  copyMissing(): boolean {
    return this.setupMode === 'copy' && (!this.copyFrom || !this.copyBranch || !this.copyBranchName.trim() || !this.copyBranchCode.trim());
  }
  /** "Setup copied from X – Head office: 12 leave types, 8 salary components …" of the ready card */
  copiedText(): string {
    const c = this.job?.copied;
    if (!c || !c.source) { return ''; }
    const parts = (c.items || []).map((i: any) => `${i.count} ${i18nT(i.label)}`);
    const sep = document.documentElement.dir === 'rtl' ? '، ' : ', ';   // Arabic comma in Arabic
    return i18nT('Setup copied from {0} – {1}', [c.source, c.branch || '']) + (parts.length ? ': ' + parts.join(sep) : '');
  }
  copiedFailed(): string {
    const f = Object.keys(this.job?.copied?.failed || {});
    return f.length ? i18nT('Not copied (standard defaults kept): {0}', [f.map(x => i18nT(x)).join(', ')]) : '';
  }
  address_line1 : string = '';
  address_line2 : string = '';
  financial_year_start_month : string = '';
  financial_year : any = '';

  financial_year_start_day : string = '';
  state: any | undefined;

  state_label: string = ''; // For dynamically storing state_label

  timezone: string = '';
  city: string = '';
  pincode: string = '';

  users:any[]=[];
  countries:any[]=[];
  states: any[] = [];
  Currencies:any[]=[];
  


  logo: File | null = null;


  schemas: string[] = []; // Array to store schema names

  
  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  isLoading: boolean = false;

  constructor(
   
    private http: HttpClient,
    private authService: AuthenticationService,
    private userService: UserMasterService,
    private countryService:CountryService,
    private sessionService: SessionService,

   private ref:MatDialogRef<SchemaCreationComponent>) {}


   ngOnInit(): void {
    
    this.userId = this.sessionService.getUserId();
  
    if (this.userId !== null) {
      this.authService.getUserData(this.userId).subscribe(
        (userData: any) => {
          this.userDetails = userData;
          this.owner = this.userId; // Automatically set the owner to logged-in user ID

        },
        (error) => {
          console.error('Failed to fetch user details:', error);
        }
      );

      this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
          this.userDetailss = userData; // Store user schemas in userDetailss

          this.schemas = userData.map((schema: any) => schema.schema_name);
        },
        (error) => {
          console.error('Failed to fetch user schemas:', error);
        }
      );
    } else {
      console.error('User ID is null.');
    }

    this.loadUsers();
    this.loadCopySources();   // v1.62.1
  this.loadCountries();
  this.loadCurrencies();
   }

  //  onFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files.length > 0) {
  //     this.logo = input.files[0];
  //   } else {
  //     this.logo = null;
  //   }
  // }

  selectedFiles!: File;

    selectedFile!: File | null;

   

    onlyFirstDayFilter = (d: Date | null): boolean => {

      const date = d || new Date();
    
      // Enable ONLY 1st day
      return date.getDate() === 1;
    };

  
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.length > 0 ? event.target.files[0] : null;
  }


  registerCatogary(): void {
    this.registerButtonClicked = true;


    // Financial year validation
if (this.financial_year) {

  const selectedDate = new Date(this.financial_year);

  if (selectedDate.getDate() !== 1) {

    alert('Financial year date must be the 1st day of a month.');

    return;
  }
}
  
    if ( !this.name || !this.country) {
      let errorMessage = '';
      // if (!this.schema_name) errorMessage += 'Location Name field is blank. ';
      if (!this.name) errorMessage += 'Name field is blank. ';
      alert(errorMessage.trim());
      return; // Exit the function if validation fails
    }
    if (this.copyMissing()) { return; }   // v1.62.1: the copy fields are shown in red under the "Starting setup" choice
  
    // Validation for spaces in the schema_name field


    // const schemaNameHasSpaces = /\s/.test(this.schema_name);
    // if (schemaNameHasSpaces) {
    //   alert('Schema name should not contain spaces.');
    //   return; // Exit the function if validation fails
    // }
  
    // Prepare FormData
   
    const companyData = new FormData();
    // companyData.append('schema_name', this.schema_name);
    companyData.append('name', this.name);
    companyData.append('owner', this.owner);
    
    companyData.append('country', this.country);
    companyData.append('currency', this.currency);
    companyData.append('timezone', this.timezone);

    companyData.append('industry_type', this.industry_type);
    if (!this.chosenApps().length) { return; }   // v1.21.0: at least one app
    companyData.append('apps', this.chosenApps().join(','));
    if (this.setupMode === 'copy' && this.copySources.length) {   // v1.62.1 (user request 2 Nov)
      companyData.append('setup_mode', 'copy');
      companyData.append('copy_from', String(this.copyFrom));
      companyData.append('copy_branch', String(this.copyBranch));
      companyData.append('copy_branch_name', this.copyBranchName.trim());
      companyData.append('copy_branch_code', this.copyBranchCode.trim().toUpperCase());
    }

    companyData.append('address_line1', this.address_line1);

    companyData.append('address_line2', this.address_line2);
   // Financial Year
if (this.financial_year) {

  const formattedDate = new Date(this.financial_year)
    .toISOString()
    .split('T')[0];

  companyData.append('financial_year', formattedDate);

}

    companyData.append('city', this.city);
    companyData.append('pincode',this.pincode);

  

  // ✅ Only append state if selected
  if (this.state) {
    companyData.append('state', this.state.toString());
  } else {
    companyData.append('state', '');  // backend will save null
  }
    if (this.selectedFile) {
      companyData.append('logo', this.selectedFile);
    }

   
    this.isLoading = true;

    // Make API call – v1.26.0: answered at once with a job; the company is created in the background
    this.jobStep = 'Sending…';
    this.job = { state: 'running', percent: 0, step: 'Sending the form', detail: '', stages: [] };   // v1.62.1
    this.userService.getSchema(companyData).subscribe(
      (response: any) => {
        if (response && response.job) {
          this.watchJob(response.job);
          return;
        }
        this.isLoading = false;
        this.finishCreated(response?.name || this.name);
      },
      (error) => {
        this.isLoading = false;
        this.jobStep = '';
        this.job = null;
        const e = error?.error || {};
        const msgs: string[] = [];
        if (typeof e === 'string') msgs.push(e);
        else if (e.detail && String(e.detail).includes('copy the setup')) msgs.push(i18nT(e.detail));   // v1.62.1 copy refused (403)
        else Object.keys(e).forEach(k => msgs.push(`${k === 'detail' || k === 'error' ? '' : k + ': '}${Array.isArray(e[k]) ? e[k].join(' ') : e[k]}`));
        alert(msgs.join('\n') || 'The company could not be created. Please try again.');
      }
    );
  }

  jobStep = '';
  jobStepNo = 0;
  jobSteps = 5;
  /** v1.62.1: the job status shown by <z-job-progress> (%, what is being done, steps, time) */
  job: any = null;
  private created = '';
  private watchJob(job: string, tries = 0): void {
    this.userService.getCompanyJob(job).subscribe({
      next: (st: any) => {
        this.job = st;
        this.jobStep = st?.step || '';
        this.jobStepNo = st?.step_no || 0;
        this.jobSteps = st?.steps || 5;
        if (st?.state === 'done') {
          this.isLoading = false;
          const failed = Object.keys(st.failed || {});
          // v1.62.1: no pop-up – the progress card shows "ready" (and what could not be set up) with an Open button
          this.created = st.name || this.name;
          if (failed.length) { this.job = { ...st, detail: '' }; this.jobNote = `Not set up: ${failed.join(', ')} – activate them in Settings → Apps.`; }
        } else if (st?.state === 'failed') {
          this.isLoading = false;
          this.jobStep = '';
        } else {
          setTimeout(() => this.watchJob(job, tries + 1), 1500);
        }
      },
      error: () => {
        if (tries < 240) setTimeout(() => this.watchJob(job, tries + 1), 4000);
        else { this.isLoading = false; this.job = { ...(this.job || {}), state: 'failed', error: 'The company is still being created. Refresh the company list in a few minutes.' }; }
      }
    });
  }

  jobNote = '';
  /** v1.62.1 (user request 2 Nov): switch to the new company (the same keys as Choose a company) and open its Get started page */
  startSetup(): void {
    const sc = this.job?.schema; if (!sc) { this.openCreated(); return; }
    try {
      localStorage.setItem('selectedSchema', sc);
      if (this.job?.company_id) { localStorage.setItem('selectedSchemaId', String(this.job.company_id)); }
      localStorage.setItem('selectedSchemaStateLabel', '');
      localStorage.setItem('zeo:lastCompany', sc);
      const r = JSON.parse(localStorage.getItem('zeoRecentCompanies') || '[]');
      localStorage.setItem('zeoRecentCompanies', JSON.stringify([sc, ...r.filter((x: string) => x !== sc)].slice(0, 8)));
    } catch { /* storage blocked */ }
    this.ref.close('created');
    window.location.href = '/main-sidebar/settings/setup-guide';   // a full load, so every service starts with the new company
  }
  openCreated(): void {
    this.ref.close('created');
    window.location.reload();
  }

  private finishCreated(name: string, note = ''): void {
    this.jobStep = '';
    alert(`Company "${name}" is ready.${note ? '\n' + note : ''}`);
    this.ref.close('created');
    window.location.reload();
  }
  

  
// onCountryChange(): void {
//   if (this.country !== undefined) {
//     this.loadStatesByCountry();
//   }
// }

// onCountryChange(): void {

//   if (this.country !== undefined) {

//     // Load states
//     this.loadStatesByCountry();

//     // Find selected country object
//     const selectedCountry = this.countries.find(
//       (c: any) => c.id == this.country
//     );

//     // Set timezone automatically
//     if (selectedCountry) {
//       this.timezone = selectedCountry.timezone;
//     } else {
//       this.timezone = '';
//     }
//   }
// }

onCountryChange(): void {

  if (this.country !== undefined) {

    // Load states
    this.loadStatesByCountry();

    // Find selected country object
    const selectedCountry = this.countries.find(
      (c: any) => c.id == this.country
    );

    if (selectedCountry) {

      // Set timezone
      this.timezone = selectedCountry.timezone;

      // Set currencies
      this.Currencies = selectedCountry.currency || [];

      // Auto select first currency
      if (this.Currencies.length > 0) {

        this.currency = this.Currencies[0].id;

      } else {

        this.currency = '';

      }

    } else {

      this.timezone = '';
      this.Currencies = [];
      this.currency = '';

    }
  }
}

loadStatesByCountry(): void {
  this.countryService.getStatesByCountryId(this.country!).subscribe(
    (result: any) => {
      console.log('State Response:', result);
      this.states = result.states; // Accessing the 'states' array
      this.state_label = result.state_label; // Accessing the dynamic state label
    },
    (error) => {
      console.error('Error fetching states:', error);
    }
  );
}

  
  

  loadCountries(): void {
    this.countryService.getCountries().subscribe(
      (result: any) => {
        this.countries = result;
      },
      (error) => {
        console.error('Error fetching countries:', error);
      }
    );
  }


  loadCurrencies(): void {
    this.countryService.getCurrencies().subscribe(
      (result: any) => {
        this.Currencies = result;
      },
      (error) => {
        console.error('Error fetching Currencies:', error);
      }
    );
  }
  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (result: any) => {
        this.users = result;
      },
      (error) => {
        console.error('Error fetching countries:', error);
      }
    );
  }


  ClosePopup(){
    this.ref.close('Closed using function')
  }


}
