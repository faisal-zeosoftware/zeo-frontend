import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthenticationService } from '../login/authentication.service';
import { EmployeeService } from '../employee-master/employee.service';
import { UserMasterService } from '../user-master/user-master.service';
import { SessionService } from '../login/session.service';
import { DesignationService } from '../designation-master/designation.service';
import { CountryService } from '../country.service';
import { DepartmentServiceService } from '../department-master/department-service.service';
import { CompanyRegistrationService } from '../company-registration.service';
import { CatogaryService } from '../catogary-master/catogary.service';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import {combineLatest, Subscription } from 'rxjs';

import { environment } from '../../environments/environment';
declare var $: any;

@Component({
  selector: 'app-shift-employee',
  templateUrl: './shift-employee.component.html',
  styleUrl: './shift-employee.component.css'
})
export class ShiftEmployeeComponent {

    private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local
    private dataSubscription?: Subscription;


  
  hasAddPermission: boolean = false;
  hasDeletePermission: boolean = false;
  hasViewPermission: boolean =false;
  hasEditPermission: boolean = false;

  
  name: any = '';
  Patern_name:any='';
  description: any = '';
  created_by: any = '';

  

 
  
  monday_shift:any='';

  tuesday_shift:any='';

  wednesday_shift:any='';

  thursday_shift:any='';

  friday_shift:any='';

  saturday_shift:any='';

  sunday_shift:any='';





  Users:any []=[];
  // LoanTypes:any []=[];

  Shifts:any []=[];

ShiftsPattern: any[] = [];




  userId: number | null | undefined;
  userDetails: any;
  userDetailss: any[] = [];
  username: any;

  schemas: string[] = []; // Array to store schema names

  use_common_workflow:  boolean = false;



  registerButtonClicked = false;



  
  Branches:any []=[];
  Departments:any []=[];
  Categories:any []=[];
  Employee: any[] = [];
  Designations: any[] = [];

  
  allSelectedbR=false;
  allSelectedBrach=false;
  allSelecteddept=false;
  allSelectedcat=false;
  allSelectedEmp=false;
  allSelecteddes=false;


    @ViewChild('select') select: MatSelect | undefined;
  
    @ViewChild('selectDept') selectDept: MatSelect | undefined;

    @ViewChild('selectBrach') selectBrach: MatSelect | undefined;
  
    @ViewChild('selectCat') selectCat: MatSelect | undefined;
    @ViewChild('selectEmp') selectEmp: MatSelect | undefined;
    @ViewChild('selectDes') selectDes: MatSelect | undefined;


  constructor(
    private countryService: CountryService, 
    private http: HttpClient,
    private authService: AuthenticationService,
    private employeeService: EmployeeService,
    private userService: UserMasterService,
    private el: ElementRef,
    private sessionService: SessionService,
    private DesignationService: DesignationService,
        private DepartmentServiceService: DepartmentServiceService,
        private companyRegistrationService: CompanyRegistrationService, 
        private categoryService: CatogaryService,


    


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

    // Listen for sidebar changes so the dropdown updates instantly
    this.employeeService.selectedBranches$.subscribe(ids => {
      this.loadShifts();
      this.loadShiftsEmployee();
      this.loadShiftsEmployee();
      this.loadDeparmentBranch(); 
       this.loadEmployee();
       this.loadDEpartments();

    });
    

  // this.loadEmployeeshift();

 
  this.loadUsers();
  // this.loadLAssetType();

  // this.loadShiftsPattern();
  // this.loadShiftsEmployee();


    // this.loadBranch();
    this.loadCAtegory();

   
    this.loadDesignations();


  this.userId = this.sessionService.getUserId();
  
  if (this.userId !== null) {
    this.authService.getUserData(this.userId).subscribe(
      async (userData: any) => {
        this.userDetails = userData; // Store user details in userDetails property
        this.created_by = this.userId; // Automatically set the owner to logged-in user ID
  
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
  
                 
                  this.hasAddPermission = this.checkGroupPermission('add_employeeshiftschedule', groupPermissions);
                  console.log('Has add permission:', this.hasAddPermission);
                  
                  this.hasEditPermission = this.checkGroupPermission('change_employeeshiftschedule', groupPermissions);
                  console.log('Has edit permission:', this.hasEditPermission);
    
                 this.hasDeletePermission = this.checkGroupPermission('delete_employeeshiftschedule', groupPermissions);
                 console.log('Has delete permission:', this.hasDeletePermission);
    
  
                  this.hasViewPermission = this.checkGroupPermission('view_employeeshiftschedule', groupPermissions);
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

 
}

  
  
  checkGroupPermission(codeName: string, groupPermissions: any[]): boolean {
  return groupPermissions.some(permission => permission.codename === codeName);
  }
  

        loadUsers(): void {
    
          const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        
          console.log('schemastore',selectedSchema )
          // Check if selectedSchema is available
          if (selectedSchema) {
            this.userService.getSChemaUsers(selectedSchema).subscribe(
              (result: any) => {
                this.Users = result;
                console.log(' fetching Companies:');
        
              },
              (error) => {
                console.error('Error fetching Companies:', error);
              }
            );
          }
          }


          

  start_date:any='';
  end_date:any='';
  schedule_name:any='';
  shift_type:any='';
  rotation_cycle_weeks :any='';

  week1_pattern:any='';
  week2_pattern:any='';
  week3_pattern:any='';
  week4_pattern:any='';

  departments:any='';
  single_shift_pattern:any='';
  employee:any='';
  categories:any='';
  designations:any='';

  branches:any='';


  automaticNumbering: boolean = false;


  registerEmployeeallocateshifts(): void {
    this.registerButtonClicked = true;
  
    // Build the payload, converting values as necessary:
    const payload = {
      start_date: this.start_date || null,
      end_date: this.end_date || null,
      schedule_name: this.schedule_name || null,
      shift_type: this.shift_type || null,
      created_by: this.created_by ,

      // Convert to number if provided; otherwise, send null.
      rotation_cycle_weeks: this.rotation_cycle_weeks ? Number(this.rotation_cycle_weeks) : null,

      week1_pattern: this.week1_pattern || null,
      week2_pattern: this.week2_pattern || null,
      week3_pattern: this.week3_pattern || null,
      week4_pattern: this.week4_pattern || null,

      // employee: this.employee || null,
      branches: this.branches || null,
     
      // designations: this.designations || null,
      // categories: this.categories || null,
     employee: (this.employee && Array.isArray(this.employee)) ? this.employee : [],
     designations: (this.designations && Array.isArray(this.designations)) ? this.designations : [],
     categories: (this.categories && Array.isArray(this.categories)) ? this.categories : [],
      // For a multi-select field, ensure we send an array.
     departments: (this.departments && Array.isArray(this.departments)) ? this.departments : [],

      // If nothing is selected for single shift pattern, send null.
      single_shift_pattern: this.single_shift_pattern || null,
    };
  
    console.log('Payload:', payload);
  
    this.employeeService.registerEmployeeShifts(payload).subscribe(
      (response) => {
        console.log('Registration successful', response);
        alert('Shift has been added.');
        window.location.reload();
      },
      (error) => {
        console.error('Registration failed', error);
  
        // Extract backend error messages.
        let errorMsg = 'Registration failed. Please try again.';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (typeof error.error === 'object') {
            // Example: { rotation_cycle_weeks: ["A valid integer is required."], departments: ["Expected a list of items but got type \"str\"."] }
            errorMsg = Object.keys(error.error)
              .map(field => `${field}: ${error.error[field].join(', ')}`)
              .join('\n');
          }
        }
        alert(errorMsg);
      }
    );
  }
  
    loadShifts(callback?: Function): void {
    
    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

    console.log('schemastore',selectedSchema )
    // Check if selectedSchema is available
    if (selectedSchema) {
      this.countryService.getShiftsNew(selectedSchema, savedIds).subscribe(
        (result: any) => {
          this.Shifts = result;
          console.log(' fetching Companies:');
          if (callback) callback();
        },
        (error) => {
          console.error('Error fetching Companies:', error);
        }
      );
    }
    }


    loadShiftsPattern(callback?: Function): void {
    
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.countryService.getShiftsPatternNew(selectedSchema, savedIds).subscribe(
            (result: any) => {
              this.ShiftsPattern = result;
              console.log(' fetching Companies:');
              if (callback) callback();
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }



        loadShiftsEmployee(callback?: Function): void {
    
        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
        const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

        console.log('schemastore',selectedSchema )
        // Check if selectedSchema is available
        if (selectedSchema) {
          this.countryService.getShiftsEmployeeNew(selectedSchema , savedIds).subscribe(
            (result: any) => {
              this.ShiftsPattern = result;
              console.log(' fetching Companies:');
      
            },
            (error) => {
              console.error('Error fetching Companies:', error);
            }
          );
        }
        }






        loadDeparmentBranch(callback?: Function): void {
          const selectedSchema = this.authService.getSelectedSchema();
          
          if (selectedSchema) {
            this.DepartmentServiceService.getDeptBranchList(selectedSchema).subscribe(
              (result: any[]) => {
                // 1. Get the sidebar selected IDs from localStorage
                const sidebarSelectedIds: number[] = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');
        
                // 2. Filter the API result to only include branches selected in the sidebar
                // If sidebar is empty, you might want to show all, or show none. 
                // Usually, we show only the selected ones:
                if (sidebarSelectedIds.length > 0) {
                  this.Branches = result.filter(branch => sidebarSelectedIds.includes(branch.id));
                } else {
                  this.Branches = result; // Fallback: show all if nothing is selected in sidebar
                }
                // Inside the subscribe block of loadDeparmentBranch
                if (this.Branches.length === 1) {
                  this.Branches = this.Branches[0].id;
                }
        
                console.log('Filtered branches for selection:', this.Branches);
                if (callback) callback();
              },
              (error) => {
                console.error('Error fetching branches:', error);
              }
            );
          }
        }
      
          
          
          
          
          
              toggleAllSelection(): void {
                if (this.select) {
                  if (this.allSelectedbR) {
                    
                    this.select.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.select.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }

             toggleAllSelectiondept(): void {
                if (this.selectDept) {
                  if (this.allSelecteddept) {
                    this.selectDept.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectDept.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }
          
              toggleAllSelectionBrach(): void {
                if (this.selectBrach) {
                  if (this.allSelectedBrach) {
                    this.selectBrach.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectBrach.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }
          
              toggleAllSelectioncat(): void {
                if (this.selectCat) {
                  if (this.allSelectedcat) {
                    this.selectCat.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectCat.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }
          
              
              toggleAllSelectionEmp(): void {
                if (this.selectEmp) {
                  if (this.allSelectedEmp) {
                    this.selectEmp.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectEmp.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }
        
                
              
              toggleAllSelectionDes(): void {
                if (this.selectDes) {
                  if (this.allSelecteddes) {
                    this.selectDes.options.forEach((item: MatOption) => item.select());
                  } else {
                    this.selectDes.options.forEach((item: MatOption) => item.deselect());
                  }
                }
              }
          
          
               
          
                  loadDEpartments(callback?: Function): void {
              
                    const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
                    const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

                    console.log('schemastore',selectedSchema )
                    // Check if selectedSchema is available
                    if (selectedSchema) {
                      this.DepartmentServiceService.getDepartmentsMasterNew(selectedSchema,savedIds).subscribe(
                        (result: any) => {
                          this.Departments = result;
                          console.log(' fetching Companies:');
                          if (callback) callback();
                        },
                        (error) => {
                          console.error('Error fetching Companies:', error);
                        }
                      );
                    }
                    }
        
                    loadDesignations(): void {
              
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
                    
                      console.log('schemastore',selectedSchema )
                      // Check if selectedSchema is available
                      if (selectedSchema) {
                        this.employeeService.getDesignations(selectedSchema).subscribe(
                          (result: any) => {
                            this.Designations = result;
                            console.log(' fetching Companies:');
                    
                          },
                          (error) => {
                            console.error('Error fetching Companies:', error);
                          }
                        );
                      }
                      }
            
          
        
                    loadCAtegory(): void {
              
                      const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
                    
                      console.log('schemastore',selectedSchema )
                      // Check if selectedSchema is available
                      if (selectedSchema) {
                        this.categoryService.getcatogarys(selectedSchema).subscribe(
                          (result: any) => {
                            this.Categories = result;
                            console.log(' fetching Companies:');
                    
                          },
                          (error) => {
                            console.error('Error fetching Companies:', error);
                          }
                        );
                      }
                      }
          
                      loadEmployee(callback?: Function): void {
              
                        const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
                        const savedIds = JSON.parse(localStorage.getItem('selectedBranchIds') || '[]');

                        console.log('schemastore',selectedSchema )
                        // Check if selectedSchema is available
                        if (selectedSchema) {
                          this.employeeService.getemployeesMasterNew(selectedSchema, savedIds).subscribe(
                            (result: any) => {
                              this.Employee = result;
                              console.log(' fetching Employees:');
                              if (callback) callback();
                            },
                            (error) => {
                              console.error('Error fetching Employees:', error);
                            }
                          );
                        }
                        }
        
        
        



      
          // loadLAssetType(): void {
    
          //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
          
          //   console.log('schemastore',selectedSchema )
          //   // Check if selectedSchema is available
          //   if (selectedSchema) {
          //     this.employeeService.getAssetType(selectedSchema).subscribe(
          //       (result: any) => {
          //         this.LoanTypes = result;
          //         console.log(' fetching Loantypes:');
          
          //       },
          //       (error) => {
          //         console.error('Error fetching Companies:', error);
          //       }
          //     );
          //   }
          //   }
        



 iscreateEmployeeShift: boolean = false;




      openPopus():void{
        this.iscreateEmployeeShift = true;

      }
    
      closeapplicationModal():void{
        this.iscreateEmployeeShift = false;

      }




      // openEditPopuss(categoryId: number):void{
        
      // }
  
  
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
    this.ShiftsPattern.forEach(employee => employee.selected = this.allSelected);

    }
  
    onCheckboxChange(employee:number) {
      // No need to implement any logic here if you just want to change the style.
      // You can add any additional logic if needed.
    }



  isEditModalOpen: boolean = false;
 editAsset: any = {}; // holds the asset being edited

openEditModal(asset: any): void {
  this.editAsset = { ...asset }; // copy asset data
  this.isEditModalOpen = true;
}

closeEditModal(): void {
  this.isEditModalOpen = false;
  this.editAsset = {};
}


updateAssetType(): void {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema || !this.editAsset.id) {
    alert('Missing schema or asset ID');
    return;
  }

  this.employeeService.updateShiftPattern(this.editAsset.id, this.editAsset).subscribe(
    (response) => {
      alert('Shift Pattern  updated successfully!');
      this.closeEditModal();
      this.loadShiftsPattern(); // reload updated list
    },
    (error) => {
      console.error('Error updating asset:', error);
      alert('Update failed');
    }
  );
}


deleteSelectedAssetType() { 
  const selectedEmployeeIds = this.ShiftsPattern
    .filter(employee => employee.selected)
    .map(employee => employee.id);

  if (selectedEmployeeIds.length === 0) {
    alert('No shift pattern selected for deletion.');
    return;
  }

  if (confirm('Are you sure you want to delete the selected shift pattern?')) {
    selectedEmployeeIds.forEach(categoryId => {
      this.employeeService.deleteShiftPattern(categoryId).subscribe(
        () => {
          console.log('shift pattern deleted successfully:', categoryId);
          // Remove the deleted employee from the local list
          this.ShiftsPattern = this.ShiftsPattern.filter(employee => employee.id !== categoryId);
          alert(' shift pattern deleted successfully');
          window.location.reload();

        },
        (error) => {
          console.error('Error deleting Category:', error);
        }
      );
    });
  }
}






 shiftData: any = {};

  // selectedYear: number | '' = '';
  selectedSchedule: string = '';
  selectedEmployee: string = '';
  availableYears: number[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  employeeShifts: any[] = [];




        
// The raw response from the backend:

// For table display:
//  - employeeCodes: array of strings (["EMP001", "EMP2", ...])
//  - allDates: array of sorted date strings (["01-01-2025", "02-01-2025", ...])
employeeCodes: string[] = [];
    allDates: string[] = [];
    selectedYear: string = '2025'; // Default to 2025
    currentMonthIndex: number = 0; // Start with January (0 = Jan, 11 = Dec)
    currentMonth: string = '01';   // Current month in "MM" format
// Transform shift data for table display based on current month
transformShiftDataForTable(): void {
  if (!this.shiftData || !this.shiftData.shifts) {
      this.employeeCodes = [];
      this.allDates = [];
      return;
  }

  // 1) Get all employee codes
  this.employeeCodes = Object.keys(this.shiftData.shifts);

  // 2) Gather dates for the current month
  const dateSet = new Set<string>();
  for (const empCode of this.employeeCodes) {
      const schedule = this.shiftData.shifts[empCode];
      if (schedule) {
          Object.keys(schedule).forEach(date => {
              if (date.split('-')[1] === this.currentMonth) {
                  dateSet.add(date);
              }
          });
      }
  }

  // 3) Sort the dates
  this.allDates = Array.from(dateSet).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('-').map(Number);
      const [dayB, monthB, yearB] = b.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();
      return dateA - dateB;
  });
}

// Get shift for employee and date
getShift(empCode: string, date: string): string {
  if (!this.shiftData.shifts || !this.shiftData.shifts[empCode]) return '';
  return this.shiftData.shifts[empCode][date] || '';
}

// Fetch shifts for the selected year
fetchShifts(): void {
  if (!this.selectedSchedule || !this.selectedYear) {
      alert('Please select schedule and year.');
      return;
  }

  const selectedSchema = localStorage.getItem('selectedSchema');
  const url = `${this.apiUrl}/calendars/api/employee-shift/get_shifts_for_year/?schedule_id=${this.selectedSchedule}&year=${this.selectedYear}&schema=${selectedSchema}`;

  this.http.get(url).subscribe(
      (response: any) => {
          console.log('Fetched shift data:', response);
          this.shiftData = response;
          this.currentMonthIndex = 0; // Reset to January
          this.currentMonth = '01';   // January
          this.transformShiftDataForTable();
      },
      (error) => {
          console.error('Error fetching shift data:', error);
          let errorMessage = 'Error fetching shift data.';
          if (error.error) {
              errorMessage = typeof error.error === 'string' ? error.error : error.error.error || errorMessage;
          }
          alert(errorMessage);
      }
  );
}

// Navigate to next month
nextMonth(): void {
  if (this.currentMonthIndex < 11) {
      this.currentMonthIndex++;
      this.currentMonth = String(this.currentMonthIndex + 1).padStart(2, '0');
      this.transformShiftDataForTable();
  }
}

// Navigate to previous month
previousMonth(): void {
  if (this.currentMonthIndex > 0) {
      this.currentMonthIndex--;
      this.currentMonth = String(this.currentMonthIndex + 1).padStart(2, '0');
      this.transformShiftDataForTable();
  }
}

// Helper to get month name for display
getMonthName(month: string): string {
  const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[parseInt(month) - 1];
}

// Extract the day number (e.g. "25") from "DD-MM-YYYY"
getDayNumber(dateStr: string): string {
  return dateStr.split('-')[0]; // "25"
}

// Convert "DD-MM-YYYY" to a JS date, then get weekday name (e.g. "Mon", "Tuesday", etc.)
getDayName(dateStr: string): string {
  const [day, month, year] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // 'short' -> "Mon", 'long' -> "Monday"
  return date.toLocaleString('en-US', { weekday: 'short' });
}

// Extract the month name from "DD-MM-YYYY"
getMonthNameFromDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // 'short' -> "Jan", 'long' -> "January"
  return date.toLocaleString('en-US', { month: 'short' });
}





  EmployeeShifts: any[] = [];

  
    // loadEmployeeshift(): void {
    
    //   const selectedSchema = this.authService.getSelectedSchema(); // Assuming you have a method to get the selected schema
    
    //   console.log('schemastore',selectedSchema )
    //   // Check if selectedSchema is available
    //   if (selectedSchema) {
    //     this.countryService.getEmployeeShifts(selectedSchema).subscribe(
    //       (result: any) => {
    //         this.EmployeeShifts = result;
    //         console.log(' fetching Companies:');
    
    //       },
    //       (error) => {
    //         console.error('Error fetching Companies:', error);
    //       }
    //     );
    //   }
    //   }

      isLoading: boolean = false;

      fetchEmployees(schema: string, branchIds: number[]): void {
        this.isLoading = true;
        this.countryService.getEmployeeShiftsNew(schema, branchIds).subscribe({
          next: (data: any) => {
            // Filter active employees
            this.EmployeeShifts = data;
    
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Fetch error:', err);
            this.isLoading = false;
          }
        });
      }
    

}
