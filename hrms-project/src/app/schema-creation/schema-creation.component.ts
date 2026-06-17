import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../login/authentication.service';
import { UserMasterComponent } from '../user-master/user-master.component';
import { UserService } from '../user.service';
import { UserMasterService } from '../user-master/user-master.service';
import { CountryService } from '../country.service';
import { SessionService } from '../login/session.service';


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

    // Make API call
    this.userService.getSchema(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        this.isLoading = false;

        alert('Company has been Registered! ✅');
        this.ref.close('Closed using function');

        window.location.reload();
      },
      (error) => {
        console.log('Full Error:', error);
        this.isLoading = false;

      
        if (error.status === 504 || error.status === 0) {
          alert('Company created, but server response timeout ⚠️');
          this.isLoading = false;

        } else {
          alert(error.error?.detail || 'Registration failed!');
          this.isLoading = false;

        }
      }
    );
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
