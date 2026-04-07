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

import {combineLatest, Subscription } from 'rxjs';
import { EmployeeService } from '../employee-master/employee.service';





@Component({
  selector: 'app-holiday-calendar',
  templateUrl: './holiday-calendar.component.html',
  styleUrl: './holiday-calendar.component.css'
})
export class HolidayCalendarComponent {

  
  private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local

  @ViewChild('select') select: MatSelect | undefined;


  description:any='';
  start_date:any='';
  end_date:any='';
  year:any='';
  calendar_title:any='';

  calendar:any='';

editHoliday: any = null;

  HolidaysCalendar:any []=[];
  isEditModalOpen = false;
  // editDateDetails: any = {};

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
private employeeService: EmployeeService,

  
    
  ) {}



  ngOnInit(): void {


 // combineLatest waits for both Schema and Branches to have a value
 this.dataSubscription = combineLatest([
  this.employeeService.selectedSchema$,
  this.employeeService.selectedBranches$
]).subscribe(([schema, branchIds]) => {
  if (schema) {
    this.fetchEmployees(schema, branchIds);  
    

  }
});



    // this.loadholidayCalendar();


    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {

    this.countryService.getholidayCalendarsNew(selectedSchema, savedIds).subscribe(data => {
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
  this.editHoliday = null;
}




openEditModal(detail: any): void {
  this.isEditModalOpen = true;

  const selectedSchema = this.authService.getSelectedSchema();
  if (!selectedSchema) return;

  this.http.get<any>(
    `${this.apiUrl}/calendars/api/holiday/${detail.holiday_id}/?schema=${selectedSchema}`
  ).subscribe(data => {
    this.editHoliday = { ...data }; // clone to avoid mutation
  });
}






// updateHoliday(): void {
//   const selectedSchema = this.authService.getSelectedSchema();
//   if (!selectedSchema || !this.editHoliday?.id) return;

//   const payload = {
//     description: this.editHoliday.description,
//     start_date: this.editHoliday.start_date,
//     end_date: this.editHoliday.start_date, // single-day holiday
//     calendar: this.editHoliday.calendar
//   };

//   this.http.put(
//     `${this.apiUrl}/calendars/api/holiday/${this.editHoliday.id}/?schema=${selectedSchema}`,
//     payload
//   ).subscribe({
//     next: () => {
//       // 🔥 Update UI immediately
//       const localDetails = this.selectedCalendar.details.filter(
//         (d: any) => d.holiday_id === this.editHoliday.id
//       );

//       localDetails.forEach((d: any) => {
//         d.description = this.editHoliday.description;
//         d.date = new Date(this.editHoliday.start_date); // ✅ FIX
//       });

//       this.closeEditModal();
//     },
//     error: err => console.error('Holiday update failed', err)
//   });
// }







  

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

    // if (!this.description || !this.start_date || !this.end_date|| !this.calendar) {
    //   alert('Please fill out all required fields.');
    //   return;
    // }

    const companyData = {
      description: this.description,
      start_date: this.start_date,
      end_date: this.end_date,
      restricted: this.restricted,
      calendar: this.selectedCalendarId,
    };

    this.countryService.registerHolidayCalendar(companyData).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Holiday day has been added.');
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

    isLoading: boolean = false;

    fetchEmployees(schema: string, branchIds: number[]): void {
      this.isLoading = true;
      this.countryService.getholidayCalendarsNew(schema, branchIds).subscribe({
        next: (data: any) => {
          // Filter active employees
          this.HolidaysCalendar = data;
  
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Fetch error:', err);
          this.isLoading = false;
        }
      });
    }





    

    iscreateLoanApp: boolean = false;




    openPopus():void{
      this.iscreateLoanApp = true;

    }
  
    closeapplicationModal():void{
      this.iscreateLoanApp = false;

    }




    openEditPopuss(categoryId: number):void{
      
    }


    showEditBtn: boolean = false;

    EditShowButtons() {
      this.showEditBtn = !this.showEditBtn;
    }


    Delete: boolean = false;
    allSelectedDelete: boolean = false;

  toggleCheckboxes() {
    this.Delete = !this.Delete;
  }

  toggleSelectAllEmployees() {
      this.allSelected = !this.allSelected;
  this.HolidaysCalendar.forEach(employee => employee.selected = this.allSelected);

  }

  onCheckboxChange(employee:number) {
    // No need to implement any logic here if you just want to change the style.
    // You can add any additional logic if needed.
  }





  isCalendarModal = false;
  isHolidayModal = false;
  
 
  
  selectedCalendarId: number | null = null;

  /* ================= MODALS ================= */
openCalendarModal() {
  this.isCalendarModal = true;
}

closeCalendarModal() {
  this.isCalendarModal = false;
}

openHolidayModal(calendarId: number) {
  this.selectedCalendarId = calendarId;
  this.isHolidayModal = true;
}

closeHolidayModal() {
  this.isHolidayModal = false;
}










isEditModalOpenCal: boolean = false;
editAsset: any = {}; // holds the asset being edited

openEditModalCal(asset: any): void {
  this.editAsset = { ...asset }; // copy asset data
  this.isEditModalOpenCal = true;
}

closeEditModalCal(): void {
  this.isEditModalOpenCal = false;
  this.editAsset = {};
}


updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateHolidayCal(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Holidays Calendar updated successfully!');
      this.closeEditModal();
      // this.loadLAssetType(); // reload updated list
      window.location.reload();
    },
(error) => {
  console.error('Error updating Holidays Calendar:', error);

  let errorMsg = 'Update failed';

  const backendError = error?.error;

  if (backendError && typeof backendError === 'object') {
    // Convert the object into a readable string
    errorMsg = Object.keys(backendError)
      .map(key => `${key}: ${backendError[key].join(', ')}`)
      .join('\n');
  }

  alert(errorMsg);
}
  );
}


deleteSelectedAssetType() { 
  const selectedEmployeeIds = this.HolidaysCalendar
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No Asset type selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected Holidays Calendar?')) {

     let total = selectedEmployeeIds.length;
    let completed = 0;


    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteholidays(categoryId).subscribe(
        () => {
          console.log('HolidaysCalendar deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.HolidaysCalendar = this.HolidaysCalendar.filter(employee => employee.id !== categoryId);
          completed++;
     if (completed === total) {        
          alert(' Holidays Calendar deleted successfully');
          window.location.reload();
     }

        },
        (error) => {
          console.error('Error deleting Holidays Calendar:', error);
          alert('Error deleting Holidays Calendar: ' + error.statusText);
        }
      );
    });
  }
}



editHolidayData: any = {};
isEditHolidayModal = false;


openEditHolidayModal(holiday: any, calendarId: number) {
  this.editHolidayData = {
    ...holiday,
    calendar: calendarId
  };

  this.isEditHolidayModal = true;
}


closeEditHolidayModal() {
  this.isEditHolidayModal = false;
}


updateHoliday() {

  const data = {
    description: this.editHolidayData.description,
    start_date: this.editHolidayData.start_date,
    end_date: this.editHolidayData.end_date,
    restricted: this.editHolidayData.restricted,
    calendar: this.editHolidayData.calendar
  };

  this.countryService.updateHoliday(this.editHolidayData.id, data)
    .subscribe(() => {
      alert('Holiday Updated');
      this.closeEditHolidayModal();
  
    });
}


deleteHoliday(id: number) {

  if (!confirm('Are you sure to delete this holiday?')) return;

  this.countryService.deleteHoliday(id)
    .subscribe(() => {
      alert('Deleted Successfully');
    
    });
}


}
