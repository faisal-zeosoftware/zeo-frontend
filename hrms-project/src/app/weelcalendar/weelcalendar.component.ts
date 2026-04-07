import { Component } from '@angular/core';
import { CountryService } from '../country.service';
import { AuthenticationService } from '../login/authentication.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DesignationService } from '../designation-master/designation.service';
import { SessionService } from '../login/session.service';
import { FormsModule } from '@angular/forms';
import {combineLatest, Subscription } from 'rxjs';
import { EmployeeService } from '../employee-master/employee.service';


@Component({
  selector: 'app-weelcalendar',
  templateUrl: './weelcalendar.component.html',
  styleUrl: './weelcalendar.component.css'
})
export class WeelcalendarComponent {

  
  private dataSubscription?: Subscription;

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  registerButtonClicked = false;

  calander_title:any='';
  description:any='';
  calendar_code:any='';
  year:any='';
  monday:any='';
  tuesday:any='';
  wednesday:any='';
  thursday:any='';
  friday:any='';
  saturday:any='';
  sunday:any='';

  selectedWeekOff: string = 'general'; // default selected




  calendars: any[] = [];
  selectedCalendar: any;
  yearDays: any[] = [];
  months: any[] = [];

  weekDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

weekList = [
  { key: 'week1', name: '1st' },
  { key: 'week2', name: '2nd' },
  { key: 'week3', name: '3rd' },
  { key: 'week4', name: '4th' },
  { key: 'week5', name: '5th' }
];

// Store checkbox values
alternativeWeekOff: any = {
  monday:   { week1: false, week2: false, week3: false, week4: false, week5: false },
  tuesday:  { week1: false, week2: false, week3: false, week4: false, week5: false },
  wednesday:{ week1: false, week2: false, week3: false, week4: false, week5: false },
  thursday: { week1: false, week2: false, week3: false, week4: false, week5: false },
  friday:   { week1: false, week2: false, week3: false, week4: false, week5: false },
  saturday: { week1: false, week2: false, week3: false, week4: false, week5: false },
  sunday:   { week1: false, week2: false, week3: false, week4: false, week5: false },
};


  isEditModalOpen = false;
  editDateDetails: any = {};


  searchQuery: string = '';
  isSearchVisible: boolean = false;  // Add this line


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

    
    // this.countryService.getWeekendCalendars().subscribe(data => {
    //   this.calendars = data;
    // });



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

               
                this.hasAddPermission = this.checkGroupPermission('add_weekend_calendar', groupPermissions);
                console.log('Has add permission:', this.hasAddPermission);
                
                this.hasEditPermission = this.checkGroupPermission('change_weekend_calendar', groupPermissions);
                console.log('Has edit permission:', this.hasEditPermission);
  
               this.hasDeletePermission = this.checkGroupPermission('delete_weekend_calendar', groupPermissions);
               console.log('Has delete permission:', this.hasDeletePermission);
  

                this.hasViewPermission = this.checkGroupPermission('view_weekend_calendar', groupPermissions);
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



  isLoading: boolean = false;

  fetchEmployees(schema: string, branchIds: number[]): void {
    this.isLoading = true;
    this.countryService.getWeekendCalendarsNew(schema, branchIds).subscribe({
      next: (data: any) => {
        // Filter active employees
        this.calendars = data;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fetch error:', err);
        this.isLoading = false;
      }
    });
  }

  onWeekOffChange(event: any) {
    this.selectedWeekOff = event.target.value;
  }
  
  
  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  


  dayTypeDisplayNames: { [key: string]: string } = {
    'fullday': 'Full Day',
    'halfday': 'Half Day',
    'weekend': 'Weekend',
    'holiday': 'Holiday',
    'leave':'Off'
  };
  
  getDayTypeDisplayName(dayType: string): string {
    return this.dayTypeDisplayNames[dayType] || dayType; // Fallback to the original value if not found
  }

  selectCalendar(event: any): void {
    const selectedId = event.target.value;
    this.selectedCalendar = this.calendars.find(calendar => calendar.id == selectedId);
  }

  filteredDetails(): any[] {
    if (!this.searchQuery) {
      return this.selectedCalendar.details;
    }
  
    const query = this.searchQuery.toLowerCase();
    return this.selectedCalendar.details.filter((detail: { date: string }) => {
      
      const formattedDate = this.formatDate(detail.date).toLowerCase();
      return formattedDate.includes(query);
    });
  }

  groupDetailsByMonth(): any {
    if (!this.selectedCalendar) return {};

    return this.selectedCalendar.details.reduce((acc: any, detail: any) => {
      const month = this.getMonthName(detail.month_of_year);
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(detail);
      return acc;
    }, {});
  }

  getMonthKeys(): string[] {
    const groupedDetails = this.groupDetailsByMonth();
    return Object.keys(groupedDetails);
  }

  getMonthName(monthIndex: string): string {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const index = parseInt(monthIndex, 10) - 1;
    return monthNames[index] || "Unknown";
  }

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    };
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', options);
  }

  getDayName(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', options);
  }
  toggleSearchDisplay(): void {
    this.isSearchVisible = !this.isSearchVisible;  // Add this method
  }
  

  convertToAlternateWeekendFormat(weeksObj: any) {
    const result: any = {};
  
    for (const day in weeksObj) {
      const weekValues = weeksObj[day];
      const selectedWeeks: number[] = [];
  
      Object.keys(weekValues).forEach((w, index) => {
        if (weekValues[w]) {
          selectedWeeks.push(index + 1); // week1 → 1, week2 → 2
        }
      });
  
      if (selectedWeeks.length > 0) {
        result[this.capitalize(day)] = selectedWeeks.join(",");
      }
    }
  
    return result;
  }
  
  capitalize(day: string) {
    return day.charAt(0).toUpperCase() + day.slice(1);
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
  allSelected: boolean = false;

toggleCheckboxes() {
  this.Delete = !this.Delete;
}

toggleSelectAllEmployees() {
    this.allSelected = !this.allSelected;
this.calendars.forEach(employee => employee.selected = this.allSelected);

}

onCheckboxChange(employee:number) {
  // No need to implement any logic here if you just want to change the style.
  // You can add any additional logic if needed.
}




  

registerweekCalendar(): void {

  let payload: any = {
    description: this.description,
    calendar_code: this.calendar_code,
    year: this.year,
    is_alternate: this.selectedWeekOff === 'alternative'
  };

  // ✅ If GENERAL
  if (this.selectedWeekOff === 'general') {
    payload = {
      ...payload,
      monday: this.monday,
      tuesday: this.tuesday,
      wednesday: this.wednesday,
      thursday: this.thursday,
      friday: this.friday,
      saturday: this.saturday,
      sunday: this.sunday,
      alternate_weekends: {}   // important
    };
  }

  // ✅ If ALTERNATIVE
  else {
    payload.alternate_weekends = this.convertToAlternateWeekendFormat(this.alternativeWeekOff);
  }

  console.log("FINAL PAYLOAD:", payload);

  this.countryService.registerWeekCalendar(payload).subscribe(
    (res) => {
      alert("Added Successfully");
      window.location.reload();
    },
    (error) => {
      console.error(error);
      alert("Error");
    }
  );
}
  
  isEditModalOpenWeekoff: boolean = false;
  editAsset: any = {}; // holds the asset being edited
  
  // openEditModalWeekoff(asset: any): void {
  //   this.editAsset = { ...asset }; // copy asset data
  //   this.isEditModalOpenWeekoff = true;
  // }

  initializeAlternativeWeekOff() {
    this.alternativeWeekOff = {};
  
    this.weekDays.forEach(day => {
      this.alternativeWeekOff[day.key] = {};
  
      this.weekList.forEach(week => {
        this.alternativeWeekOff[day.key][week.key] = false;
      });
    });
  }

  openEditModalWeekoff(asset: any): void {
    this.editAsset = { ...asset };
  
    // ✅ Set radio button
    this.selectedWeekOff = asset.is_alternate ? 'alternative' : 'general';
  
    // ✅ Step 1: Initialize FULL structure
    this.initializeAlternativeWeekOff();
  
    // ✅ Step 2: Patch API values into UI
    if (asset.is_alternate && asset.alternate_weekends) {

      Object.entries(asset.alternate_weekends).forEach(([day, weekNumbers]) => {
    
        const dayKey = day.toLowerCase(); // ✅ Fix case issue
    
        // ✅ Convert "1,2,3" → ["1","2","3"]
        const weeksArray = (weekNumbers as string).split(',');
    
        weeksArray.forEach(week => {
          const weekKey = 'week' + week.trim();
    
          if (
            this.alternativeWeekOff[dayKey] &&
            this.alternativeWeekOff[dayKey][weekKey] !== undefined
          ) {
            this.alternativeWeekOff[dayKey][weekKey] = true;
          }
        });
    
      });
    }
  
    this.isEditModalOpenWeekoff = true;
  }



  setAlternativeWeekOff(data: any) {
    this.alternativeWeekOff = {};
  
    Object.keys(data).forEach(day => {
      this.alternativeWeekOff[day] = {
        week1: false,
        week2: false,
        week3: false,
        week4: false
      };
  
      const week = 'week' + data[day]; // convert "4" → week4
      this.alternativeWeekOff[day][week] = true;
    });
  }
  
  closeEditModalWeekoff(): void {
    this.isEditModalOpenWeekoff = false;
    this.editAsset = {};
    this.selectedWeekOff = 'general'; // reset
  }



  openEditModal(detail: any): void {

    
    this.isEditModalOpen = true;
    // Fetch the details for the selected date

    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
    this.http.get<any>(`${this.apiUrl}/calendars/api/assign-days/${detail.id}/?schema=${selectedSchema}`)
      .subscribe(data => {
        this.editDateDetails = data;
      });
  }


  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editDateDetails = {};
  }

  updateDate(): void {
    // Update the date details in the backend
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      // return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
   
    this.http.put(`${this.apiUrl}/calendars/api/assign-days/${this.editDateDetails.id}/?schema=${selectedSchema}`, this.editDateDetails)
      .subscribe(() => {
        // Update the local data to reflect the changes
        const updatedDetail = this.selectedCalendar.details.find((detail: any) => detail.id === this.editDateDetails.id);
        if (updatedDetail) {
          updatedDetail.day_type = this.editDateDetails.day_type;
        }
        this.closeEditModal();
        // this.generateMonthWiseData();
        
      });
      
  }

  updateAssetType(): void {

    let payload: any = {
      ...this.editAsset,
      is_alternate: this.selectedWeekOff === 'alternative'
    };
  
    // If alternative → send alternate_weekends
    if (this.selectedWeekOff === 'alternative') {
      payload.alternate_weekends = this.convertToAlternateWeekendFormat(this.alternativeWeekOff);
    } else {
      payload.alternate_weekends = {};
    }
  
    this.employeeService.updateWeekoff(this.editAsset.id, payload).subscribe(
      (res) => {
        alert('Updated successfully');
        this.closeEditModalWeekoff();
        window.location.reload();
      },
      (error) => {
        console.error(error);
        alert('Update failed');
      }
    );
  }


  deleteSelectedAssetType() { 
    const selectedEmployeeIds = this.calendars
      .filter(employee => employee.selected)
      .map(employee => employee.id);
  
    if (selectedEmployeeIds.length === 0) {
      alert('No Weekend Calendar selected for deletion.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected Weekend Calendar?')) {
  
       let total = selectedEmployeeIds.length;
      let completed = 0;
  
  
      selectedEmployeeIds.forEach(categoryId => {
        this.employeeService.deleteWeekOff(categoryId).subscribe(
          () => {
            console.log('Weekend deleted successfully:', categoryId);
            // Remove the deleted employee from the local list
            this.calendars = this.calendars.filter(employee => employee.id !== categoryId);
            completed++;
       if (completed === total) {        
            alert('Weekend calendar deleted successfully');
            window.location.reload();
       }
  
          },
          (error) => {
            console.error('Error deleting Asset type:', error);
            alert('Error deleting Asset type: ' + error.statusText);
          }
        );
      });
    }
  }


  onViewClick(item: any) {
    console.log('View clicked:', item);
  
    // If your list already has full data → use directly
    this.openViewModal(item);
  
    // 🔴 If you need API call instead, use below 👇
    // this.getWeekendCalendarById(item.id);
  }

  isViewModalOpen = false;
viewAsset: any;

weekDaysShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

calendarMonths: any[] = [];

openViewModal(asset: any) {
  this.viewAsset = asset;
  this.generateCalendar(asset.year);
  this.isViewModalOpen = true;
}

generateCalendar(year: number) {

  this.calendarMonths = [];

  for (let month = 0; month < 12; month++) {

    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();

    const startDay = firstDay.getDay();

    let days: any[] = [];

    // empty slots
    for (let i = 0; i < startDay; i++) {
      days.push({ empty: true });
    }

    // actual days
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month, d);

      days.push({
        date: d,
        dayName: dateObj.toLocaleString('en-us', { weekday: 'long' }),
        weekNumber: Math.ceil(d / 7)
      });
    }

    this.calendarMonths.push({
      name: firstDay.toLocaleString('en-us', { month: 'long' }),
      days: days
    });
  }
}
  

getDayClass(day: any) {

  if (day.empty) return 'empty-day';

  const weekday = day.dayName.toLowerCase();

  // 🔴 ALTERNATIVE WEEK OFF
  if (this.viewAsset.is_alternate && this.viewAsset.alternate_weekends) {

    const altData = this.viewAsset.alternate_weekends;

    const apiDayKey = Object.keys(altData).find(
      d => d.toLowerCase() === weekday
    );

    if (apiDayKey) {
      const weeks = altData[apiDayKey].split(',');

      if (weeks.includes(day.weekNumber.toString())) {
        return 'off-day';
      }
    }
  }

  // 🟢 GENERAL WEEK OFF
  const dayType = this.viewAsset[weekday];

  if (dayType === 'leave') return 'off-day';
  if (dayType === 'halfday') return 'half-day';

  return 'full-day';
}


closeViewModal() {
  this.isViewModalOpen = false;
}


  
}
