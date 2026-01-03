import { Component, ViewChild } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { environment } from '../../environments/environment';





@Component({
  selector: 'app-holiday-calendar',
  templateUrl: './holiday-calendar.component.html',
  styleUrl: './holiday-calendar.component.css'
})
export class HolidayCalendarComponent {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  @ViewChild('select') select: MatSelect | undefined;


  description:any='';
  start_date:any='';
  end_date:any='';
  year:any='';
  calendar_title:any='';

  calendar:any='';


  HolidaysCalendar:any []=[];
  isEditModalOpen = false;
  editDateDetails: any = {};

  restricted: boolean = false;


  allSelected=false;

  registerButtonClicked = false;

  selectedCalendar: any;
  calendars: any[] = [];


hasAddPermission: boolean = false;
hasDeletePermission: boolean = false;
hasViewPermission: boolean =false;
hasEditPermission: boolean = false;

userId: number | null | undefined;
userDetails: any;
userDetailss: any;
schemas: string[] = []; // Array to store schema names

  constructor(
    private countryService: CountryService, 
    private authService: AuthenticationService, 
    private categoryService: CatogaryService,

    private http: HttpClient,
    private DesignationService: DesignationService,
private sessionService: SessionService,
  
    
  ) {}



  ngOnInit(): void {
    this.loadholidayCalendar();


    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {

    this.countryService.getholidayCalendars(selectedSchema).subscribe(data => {
      this.calendars = data;
    });

    this.userId = this.sessionService.getUserId();
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
        this.hasViewPermission = true;
        this.hasAddPermission = true;
        this.hasDeletePermission = true;
        this.hasEditPermission = true;
    
        // Fetch designations without checking permissions
        // this.fetchDesignations(selectedSchema);
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
                this.hasViewPermission = true;
                this.hasAddPermission = true;
                this.hasDeletePermission = true;
                this.hasEditPermission = true;
              } else if (firstItem.groups && Array.isArray(firstItem.groups) && firstItem.groups.length > 0) {
                const groupPermissions = firstItem.groups.flatMap((group: any) => group.permissions);
                console.log('Group Permissions:', groupPermissions);

               
                this.hasAddPermission = this.checkGroupPermission('add_holiday_calendar', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_holiday_calendar', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_holiday_calendar', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_holiday_calendar', groupPermissions);
                console.log('Has view permission:', this.hasViewPermission);


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

    // this.fetchingApprovals();


    this.authService.getUserSchema(this.userId).subscribe(
        (userData: any) => {
            this.userDetailss = userData;
            this.schemas = userData.map((schema: any) => schema.schema_name);
            console.log('scehmas-de',userData)
        },
        (error) => {
            console.error('Failed to fetch user schemas:', error);
        }
    );
} else {
    console.error('User ID is null.');
}
  }


    }


    // checkViewPermission(permissions: any[]): boolean {
    //   const requiredPermission = 'add_holiday' ||'change_holiday' ||'delete_holiday' ||'view_holiday';
      
      
    //   // Check user permissions
    //   if (permissions.some(permission => permission.codename === requiredPermission)) {
    //     return true;
    //   }
      
    //   // Check group permissions (if applicable)
    //   // Replace `// TODO: Implement group permission check`
    //   // with your logic to retrieve and check group permissions
    //   // (consider using a separate service or approach)
    //   return false; // Replace with actual group permission check
    //   }
      
      
      
      
      checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
      return groupPermissions.some(permission => permission.codename === codeName);
      }
      

selectCalendar(event: any): void {
  const selectedId = event.target.value;

  const calendar = this.calendars.find(c => c.id == selectedId);
  if (!calendar) return;

  const details: any[] = [];

  // 🔁 Convert holiday ranges into daily entries
  (calendar.holiday_list || []).forEach((holiday: any) => {
    const start = new Date(holiday.start_date);
    const end = new Date(holiday.end_date);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      details.push({
        date: new Date(d),
        day_type: 'leave',          // Holiday = Off
        description: holiday.description,
        holiday_id: holiday.id
      });
    }
  });

  // ✅ Match WEEK CALENDAR STRUCTURE
  this.selectedCalendar = {
    description: calendar.calendar_title,
    year: calendar.year,
    calendar_code: calendar.id,
    details
  };

  console.log('Holiday calendar mapped like week calendar', this.selectedCalendar);
}


openEditModal(detail: any): void {
  this.isEditModalOpen = true;

  // ✅ Clone object so cancel doesn't mutate table
  this.editDateDetails = {
    holiday_id: detail.holiday_id,
    day_type: detail.day_type,
    date: detail.date,
    description: detail.description
  };

  console.log('Editing holiday detail:', this.editDateDetails);
}


  

getMonthKeys(): string[] {
  if (!this.selectedCalendar?.details) return [];

  const months = new Set<string>();

  this.selectedCalendar.details.forEach((d: any) => {
    const month = new Date(d.date).toLocaleString('default', { month: 'long' });
    months.add(month);
  });

  return Array.from(months);
}


  getMonthName(monthIndex: string): string {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const index = parseInt(monthIndex, 10) - 1;
    return monthNames[index] || "Unknown";
  }



groupDetailsByMonth(): any {
  const grouped: any = {};
  if (!this.selectedCalendar?.details) return grouped;

  this.selectedCalendar.details.forEach((detail: any) => {
    const month = new Date(detail.date).toLocaleString('default', { month: 'long' });
    grouped[month] = grouped[month] || [];
    grouped[month].push(detail);
  });

  return grouped;
}



formatDate(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

getDayName(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
}

getDayTypeDisplayName(type: string): string {
  if (type === 'leave') return 'Holiday';
  if (type === 'halfday') return 'Half Day';
  return 'Full Day';
}


  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editDateDetails = {};
  }
updateDate(): void {
  const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema) {
    console.error('No schema selected.');
    console.log('Updating holiday:', this.editDateDetails);

    return;
  }

  this.http
    .put(
      `${this.apiUrl}/calendars/api/assign-days/${this.editDateDetails.holiday_id}/?schema=${selectedSchema}`,
      { day_type: this.editDateDetails.day_type }
    )
    .subscribe({
      next: () => {
        // ✅ Update UI immediately
        const localDetail = this.selectedCalendar.details.find(
          (d: any) => d.holiday_id === this.editDateDetails.holiday_id
        );

        if (localDetail) {
          localDetail.day_type = this.editDateDetails.day_type;
        }

        this.closeEditModal();
      },
      error: (err) => {
        console.error('Update failed', err);
      }
    });
}





  

    toggleAllSelection(): void {
      if (this.select) {
        if (this.allSelected) {
          this.select.options.forEach((item: MatOption) => item.select());
        } else {
          this.select.options.forEach((item: MatOption) => item.deselect());
        }
      }
    }

  registerHolidayCalendar(): void {
    this.registerButtonClicked = true;

    if (!this.description || !this.start_date || !this.end_date|| !this.calendar) {
      alert('Please fill out all required fields.');
      return;
    }

    const companyData = {
      description: this.description,
      start_date: this.start_date,
      end_date: this.end_date,
      restricted: this.restricted,
      calendar: this.calendar,
    };

    this.countryService.registerHolidayCalendar(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Holiday calendar has been added.');
        window.location.reload();
      },
      (error) => {
        console.error('Registration failed', error);
        alert('Registration failed. Please try again.');
      }
    );
  }


  registerHolidayCalendarYear(): void {
    this.registerButtonClicked = true;

    if (!this.year || !this.calendar_title ) {
      alert('Please fill out all required fields.');
      return;
    }

    const companyData = {
      year: this.year,
      calendar_title: this.calendar_title,
      
    
    };

    this.countryService.registerHolidayCalendarYear(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Holiday calendar has been added.');
        window.location.reload();
      },
      (error) => {
        console.error('Registration failed', error);
   let errorMessage = 'Enter all required fields!';

      // ✅ Handle backend validation or field-specific errors
      if (error.error && typeof error.error === 'object') {
        const messages: string[] = [];
        for (const [key, value] of Object.entries(error.error)) {
          if (Array.isArray(value)) messages.push(`${key}: ${value.join(', ')}`);
          else if (typeof value === 'string') messages.push(`${key}: ${value}`);
          else messages.push(`${key}: ${JSON.stringify(value)}`);
        }
        if (messages.length > 0) errorMessage = messages.join('\n');
      } else if (error.error?.detail) {
        errorMessage = error.error.detail;
      }

      alert(errorMessage);
    }
    );
  }

  loadholidayCalendar(): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
  
    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.countryService.getholidayCalendars(selectedSchema).subscribe(
        (result: any) => {
          this.HolidaysCalendar = result;
          console.log(' fetching Companies:');
  
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }


}
