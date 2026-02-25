import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders , HttpErrorResponse  } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LeaveService {

  private apiUrl = `${environment.apiBaseUrl}`; // Use the correct `apiBaseUrl` for live and local


  constructor(private http: HttpClient) {}


  
  registerLeaveType(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/leave-type/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  registerLeaveEntitlement(data: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/leave-entitlement/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, data).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  requestLeaveResetPolicy(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/leave-reset-policy/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }

  getAllLeaveEntitlements(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-entitlement/?schema=${selectedSchema}`;
    return this.http.get(apiUrl);
  }


  getAllLeaveResetValues(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-reset-policy/?schema=${selectedSchema}`;
    return this.http.get(apiUrl);
  }
  

  registerLeaveapplicable(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/applicable_to/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  requestLeaveAdmin(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/emp-leave-request/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }



  EmployeeRechecIn(data: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    const apiUrl = `${this.apiUrl}/calendars/api/attendance/check_in/?schema=${selectedSchema}`;
    
    // Sending as a standard JSON POST
    return this.http.post(apiUrl, data);
  }


  requestCompLeaveAdmin(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/CompensatoryLeaveRequest/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }



  requestCompTransLeaveAdmin(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/emp-cmpnstry-lv-transaction/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }



  



  CreateLeaveapprovalLevel(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/leave-approval-levels/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }




  CreateLeaveBalance(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/Leave_balance/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }




  deleteLeaveBalance(categoryId: number): Observable<any> {
  // const url = `${this.baseUrl}/Catogory/${categoryId}`;
  // return this.http.delete(url);

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.'); // Return an error observable if no schema is selected
  }
 
  const apiUrl = `${this.apiUrl}/calendars/api/Leave_balance/${categoryId}/?schema=${selectedSchema}`;
 
  return this.http.delete(apiUrl);
}



  deleteLeavetype(categoryId: number): Observable<any> {
  // const url = `${this.baseUrl}/Catogory/${categoryId}`;
  // return this.http.delete(url);

  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.'); // Return an error observable if no schema is selected
  }
 
  const apiUrl = `${this.apiUrl}/calendars/api/leave-type/${categoryId}/?schema=${selectedSchema}`;
 
  return this.http.delete(apiUrl);
}



updateLeaveBalance(id: number, data: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/Leave_balance/${id}/?schema=${selectedSchema}`;
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  return this.http.put(apiUrl, data, { headers }).pipe(
    catchError((error) => {
      console.error('Error updating asset:', error);
      return throwError(error);
    })
  );
}


updateLeavetype(id: number, data: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/leave-type/${id}/?schema=${selectedSchema}`;

  return this.http.patch(apiUrl, data).pipe(
    catchError((error) => {
      console.error('Error updating leave type:', error);
      return throwError(error);
    })
  );
}


  
  CreateEmployeeOvertime(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/Emp-overtime/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  // CreateEmployeeattendance(formData: FormData): Observable<any> {
  //   const selectedSchema = localStorage.getItem('selectedSchema');
  //   if (!selectedSchema) {
  //     console.error('No schema selected.');
  //     return throwError(() => new Error('No schema selected.'));
  //   }

  //   const apiUrl = `${this.apiUrl}/calendars/api/monthly-attendance/generate/?schema=${selectedSchema}`;
    
  //   return this.http.post(apiUrl, formData).pipe(
  //     catchError((error) => {
  //       console.error('Error during employee overtime creation:', error);
  //       return throwError(() => error);
  //     })
  //   );
  // }

  // leave.service.ts

  CreateEmployeeattendance(payload: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/monthly-attendance/generate/?schema=${selectedSchema}`;
  
  // Sending as a regular POST body or FormData based on your API requirement
  return this.http.post(apiUrl, payload);
}

CreateEmployeeattendanceNew(payload: any, branchIds: number[]): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  
  // 1. Convert [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `&branch_id=[${branchIds.join(',')}]` : '';
  
  // 2. Construct the URL with Schema
  let apiUrl = `${this.apiUrl}/calendars/api/monthly-attendance/generate/?schema=${selectedSchema}`;
  
  // 3. Append branch filter if present
  if (branchParam) {
    apiUrl += branchParam;
  }
  
  // Sending payload as POST body
  return this.http.post(apiUrl, payload);
}





  registerEmailTemplateLeave(companyData: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }
   

    
    const apiUrl = `${this.apiUrl}/calendars/api/leave-template/?schema=${selectedSchema}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(apiUrl, companyData, { headers }).pipe(
      catchError((error) => {
        // Handle errors here (you can log, show a user-friendly message, etc.)
        console.error('Error during company registration:', error);
        return throwError(error);

      })
    );
    }



    registerEmailNotification(companyData: any): Observable<any> {
      const selectedSchema = localStorage.getItem('selectedSchema');
      if (!selectedSchema) {
        console.error('No schema selected.');
        return throwError('No schema selected.'); // Return an error observable if no schema is selected
      }
     
  
      
      const apiUrl = `${this.apiUrl}/employee/api/notification-settings/?schema=${selectedSchema}`;
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
      return this.http.post(apiUrl, companyData, { headers }).pipe(
        catchError((error) => {
          // Handle errors here (you can log, show a user-friendly message, etc.)
          console.error('Error during company registration:', error);
          return throwError(error);
  
        })
      );
      }

      getNotificationSettings(selectedSchema: string): Observable<any> {
        const apiUrl = `${this.apiUrl}/employee/api/notification-settings/?schema=${selectedSchema}`;
      
        // Fetch employees from the API
        return this.http.get(apiUrl);
      
        
      }


      getNotificationSettingsNew(selectedSchema: string, branchIds: number[]): Observable<any> {
        // Converts [1,3,4] into the string "[1,3,4]" for the URL
        const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
        
        let url = `${this.apiUrl}/employee/api/notification-settings/?schema=${selectedSchema}`;
        if (branchParam) {
          url += `&branch_id=${branchParam}`;
        }
        
        return this.http.get(url);
      }
      

      
      updateNot(docId: number, payload: any): Observable<any> {
        const selectedSchema = localStorage.getItem('selectedSchema');
        if (!selectedSchema) {
          console.error('No schema selected.');
          return throwError('No schema selected.');
        }
        const url = `${this.apiUrl}/employee/api/notification-settings/${docId}/?schema=${selectedSchema}`;
        return this.http.put(url, payload);
      }


      deleteNotification(permissionId: number,selectedSchema: string): Observable<any> {
        const apiUrl = `${this.apiUrl}/employee/api/notification-settings/${permissionId}/?schema=${selectedSchema}`;
        return this.http.delete(apiUrl);
      }
    
      
    
  updateEmailTemplateLeave(updatedTemplate: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/leave-template/${updatedTemplate.id}/?schema=${selectedSchema}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    return this.http.put(apiUrl, updatedTemplate, { headers }).pipe(
      catchError((error) => {
        console.error('Error updating template:', error);
        return throwError(error);
      })
    );
  }
  

//   getApprovalslistLeave(selectedSchema: string, userId: number): Observable<any> {
//     const apiUrl = `${this.apiUrl}/users/api/user/${userId}/lvapprovals/?schema=${selectedSchema}`;

//     // Fetch approvals for the user from the API
//     return this.http.get(apiUrl);
// }

getApprovalslistLeave(selectedSchema: string, userId: number): Observable<any> {
  const apiUrl = `${this.apiUrl}/calendars/api/leave-approvals/?schema=${selectedSchema}`;

  // Fetch approvals for the user from the API
  
  return this.http.get(apiUrl);
}



getApprovalslistLeaveNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/calendars/api/leave-approvals/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}


getLeaveTypeNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/calendars/api/leave-type/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}





getApprovalDetailsLeave(apiUrl: string): Observable<any> {
  return this.http.get(apiUrl);
}



approveApprovalRequestLeave(apiUrl: string, approvalData: { note: string; status: string }): Observable<any> {
  // Sending a POST request to approve with note and status
  return this.http.post(apiUrl, approvalData);
}

rejectApprovalRequestLeave(apiUrl: string, approvalData: { note: string; status: string }): Observable<any> {
  // Sending a POST request to approve with note and status
  return this.http.post(apiUrl, approvalData);
}






  getLeaveType(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-type/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

 

  getEmailTemplatesLeave(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-template/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getEmailTemplatesLeaveNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/leave-template/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  


  getLeaveBalanceAll(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/Leave_balance/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

   getAllLeaveBalanceAllNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/Leave_balance/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }


  getEmployeeOvertime(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/Emp-overtime/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getEmployeeOvertimeNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/Emp-overtime/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  

  getLeaveApprovalLevel(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-approval-levels/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }


  getLeaveApprovalLevelNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/leave-approval-levels/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
    


  getLeaveBalance(employeeId: number) {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
  return this.http.get(`${this.apiUrl}/employee/api/Employee/${employeeId}/leave_balance/?schema=${selectedSchema}`);
}


  getLeaveRequest(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/emp-leave-request/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

 

  getLeaveRequestNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/emp-leave-request/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
    

  rejectLeaveRequest(payload: any, schema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/calendars/api/immediate-reject/?schema=${schema}`;
  return this.http.post(apiUrl, payload);
}
  getEmployee(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/employee/api/Employee/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

    getemployeesMaster(selectedSchema: string): Observable<any> {
      const url = `${this.apiUrl}/employee/api/emplist/?schema=${selectedSchema}`;
      return this.http.get(url);
    }
  
  getUsers(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/users/api/user/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }
  getApproverUsers(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/users/tenant-non-ess-users/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  // leave.service.ts
generateAttendanceReport(schema: string, data: any): Observable<any> {
  const url = `${this.apiUrl}/calendars/api/monthly-attendance/generate/?schema=${schema}`;
  return this.http.post<any>(url, data);
}



  getLeaverejectionReasons(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave-rejection-reason/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }










  getBranches(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/organisation/api/Branch/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  
  getDepartments(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/organisation/api/Department/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getDepartmentsNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/organisation/api/Department/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
    



  getDesignation(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/organisation/api/Designation/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }
  getCategory(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/organisation/api/Catogory/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }






  // pay roll Services here -----------------------------------



  registerSalaryComponent(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/salarycomponent/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  registerEmpSalary(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/employeesalary/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }



  requestPayrollSettings(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/PayrollFormula/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during Payroll Formula registration:', error);
        return throwError(error);
      })
    );
  }


  requestPayroll(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/PayrollRun/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }



  requestPaySlip(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/payslip/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  requestPayslipComponent(formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/PayslipComponent/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during leave type registration:', error);
        return throwError(error);
      })
    );
  }


  updateSalaryComponent(id: number, formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) return throwError('No schema selected.');
  
    const apiUrl = `${this.apiUrl}/payroll/api/salarycomponent/${id}/?schema=${selectedSchema}`;
    return this.http.put(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during update:', error);
        return throwError(error);
      })
    );
  }
  

  updateSalaryComponentEmp(id: number, formData: FormData): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) return throwError('No schema selected.');
  
    const apiUrl = `${this.apiUrl}/payroll/api/employeesalary/${id}/?schema=${selectedSchema}`;
    return this.http.put(apiUrl, formData).pipe(
      catchError((error) => {
        console.error('Error during update:', error);
        return throwError(error);
      })
    );
  }

  getSalaryCom(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/salarycomponent/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getSalaryComNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/salarycomponent/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  


  getEmployeeSalaryCom(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/employeesalary/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }


  getEmployeeSalaryComNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/employeesalary/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  
  getPayroll(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/PayrollRun/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }
  


  getPayrollNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/PayrollRun/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  


  
  getPayrollSettings(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/PayrollFormula/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getPayrollSettingsNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/PayrollFormula/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
    

  getPaySlip(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/payslip/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
    
  }

 
  


  getPaySlipNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/payslip/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  
  
  getPaySlipApproved(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/payslip/aproved_payslips/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
    
  }

  getPaySlipApprovedNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/payslip/aproved_payslips/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }

  confirmPayslipstrial(payload: any[]): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const requests = payload.map(p =>
      this.http.put(`${this.apiUrl}/payroll/api/payslip/${p.id}/?schema=${selectedSchema}`, { trial_status  : p.trial_status   })
    );
  
    return forkJoin(requests); // Executes all PUTs in parallel
  }
  

  confirmPayslips(payload: any[]): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const requests = payload.map(p =>
      this.http.put(`${this.apiUrl}/payroll/api/payslip/${p.id}/?schema=${selectedSchema}`, { confirm_status: p.confirm_status })
    );
  
    return forkJoin(requests); // Executes all PUTs in parallel
  }
  


  getSinglePayslip(id: string): Observable<any> {

    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  

    const apiUrl = `${this.apiUrl}/payroll/api/payslip/${id}/?schema=${selectedSchema}`;
    return this.http.get(apiUrl);
  }

  getPayslipComponent(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/PayslipComponent/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getPayslipComponentNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/PayslipComponent/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
    


  
  downloadFile(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }



  getLeaveRequestHistory(employeeId: string, schema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/emp-leave-request/leave-request-history/?employee_id=${employeeId}&schema=${schema}`;
    return this.http.get(apiUrl);
  }






  getLeaveRejoins(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/employee-leave-rejoins/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }

  getLeaveRejoinsNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/calendars/api/employee-leave-rejoins/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }




  deductLeaveBalance(rejoinId: number, payload: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError(() => new Error('No schema selected.'));
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/employee-leave-rejoins/${rejoinId}/deduct-leave-balance/?schema=${selectedSchema}`;
  
    return this.http.post(apiUrl, payload).pipe(
      catchError((error) => {
        console.error('Error deducting leave balance:', error);
        return throwError(() => error);
      })
    );
  }






  getAccrualDetails(employeeId: number, schema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/test-monthwise-accrual/?employee_id=${employeeId}&schema=${schema}`;
    return this.http.get(apiUrl);
  }


  getLeaveResetPreview(payload: any, schema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/leave/reset-preview/?schema=${schema}`;
    return this.http.post(apiUrl, payload).pipe(
      catchError((error) => {
        console.error('Error fetching leave reset preview:', error);
        return throwError(() => error);
      })
    );
  }




  updatePayslip(id: string, payload: any): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.');
    }
  
    const apiUrl = `${this.apiUrl}/payroll/api/payslip/${id}/?schema=${selectedSchema}`;
    return this.http.put(apiUrl, payload);
  }




  getAllAttendance(schema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/calendars/api/monthly-attendance/?schema=${schema}`;
    return this.http.get(apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching all attendance', error);
        return throwError(() => error);
      })
    );
  }







  deletePayroll(payrollId: number): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }

    const url = `${this.apiUrl}/payroll/api/PayrollRun/${payrollId}/?schema=${selectedSchema}`;
    return this.http.delete(url);
  }



  deleteSalary(payrollId: number): Observable<any> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError('No schema selected.'); // Return an error observable if no schema is selected
    }

    const url = `${this.apiUrl}/payroll/api/salarycomponent/${payrollId}/?schema=${selectedSchema}`;
    return this.http.delete(url);
  }






  getApprovalReport(): Observable<any[]> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError(() => new Error('No schema selected.'));
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/Lv_Approval_Report/?schema=${selectedSchema}`;
    return this.http.get<any[]>(apiUrl);
  }
  
  fetchApprovalJsonData(url: string): Observable<any> {
    return this.http.get<any>(url);
  }



  getLeavebalanceReport(): Observable<any[]> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError(() => new Error('No schema selected.'));
    }
  
    const apiUrl = `${this.apiUrl}/calendars/api/lvBalanceReport/?schema=${selectedSchema}`;
    return this.http.get<any[]>(apiUrl);
  }



  
  getAssetReport(): Observable<any[]> {
    const selectedSchema = localStorage.getItem('selectedSchema');
    if (!selectedSchema) {
      console.error('No schema selected.');
      return throwError(() => new Error('No schema selected.'));
    }
  
    const apiUrl = `${this.apiUrl}/organisation/api/asset-Report/?schema=${selectedSchema}`;
    return this.http.get<any[]>(apiUrl);
  }
  

  
  getAssetReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/organisation/api/asset-Report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}
  

  fetchLeavebalanceJsonData(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  fetchAssetJsonData(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  

  fetchAssetTransactionJsonData(url: string): Observable<any> {
    return this.http.get<any>(url);
  }


  getPaysliprejectionReasons(selectedSchema: string): Observable<any> {
    const apiUrl = `${this.apiUrl}/payroll/api/approval-payroll/?schema=${selectedSchema}`;
  
    // Fetch employees from the API
    return this.http.get(apiUrl);
  
  }




// Wps APi services

  postSIFData(payload: any, selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/payroll/sif-data/?schema=${selectedSchema}`;
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.post(apiUrl, payload, { headers });
}


// document request approver level setting


getDocType(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/core/api/Documents/?schema=${selectedSchema}`;


  return this.http.get(apiUrl);


  
}


getDocRequestType(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/Doc-request-Type/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);


  
}


CreateDocRequestapprovalLevel(formData: FormData): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.');
  }

  const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval-levels/?schema=${selectedSchema}`;

  return this.http.post(apiUrl, formData).pipe(
    catchError((error) => {
      console.error('Error during leave type registration:', error);
      return throwError(error);
    })
  );
}



getDocReqApprovalLevel(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval-levels/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}




CreateDocRequest(formData: FormData): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.');
  }

  const apiUrl = `${this.apiUrl}/employee/api/Doc-request/?schema=${selectedSchema}`;

  return this.http.post(apiUrl, formData).pipe(
    catchError((error) => {
      console.error('Error during leave type registration:', error);
      return throwError(error);
    })
  );
}


  getDocRequest(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/Doc-request/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}



// document request Approvals

getApprovalslistDocrequest(selectedSchema: string, userId: number): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/Doc-request-approval/?schema=${selectedSchema}`;

  // Fetch approvals for the user from the API
  
  return this.http.get(apiUrl);
}

getApprovalDetailsDocRequest(apiUrl: string): Observable<any> {
  return this.http.get(apiUrl);
}



approveApprovalDocRequest(apiUrl: string, approvalData: { note: string; status: string }): Observable<any> {
  // Sending a POST request to approve with note and status
  return this.http.post(apiUrl, approvalData);
}

rejectApprovalDocRequest(apiUrl: string, approvalData: { note: string; status: string }): Observable<any> {
  // Sending a POST request to approve with note and status
  return this.http.post(apiUrl, approvalData);
}






// advced salary request


CreateAdvSalaryRequest(formData: FormData): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.');
  }

  const apiUrl = `${this.apiUrl}/payroll/api/advance-salary-request/?schema=${selectedSchema}`;

  return this.http.post(apiUrl, formData).pipe(
    catchError((error) => {
      console.error('Error during leave type registration:', error);
      return throwError(error);
    })
  );
}



getAdvSalaryRequest(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/payroll/api/advance-salary-request/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}


getAdvSalaryRequestNew(selectedSchema: string, branchIds: number[]): Observable<any> {
    // Converts [1,3,4] into the string "[1,3,4]" for the URL
    const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
    
    let url = `${this.apiUrl}/payroll/api/advance-salary-request/?schema=${selectedSchema}`;
    if (branchParam) {
      url += `&branch_id=${branchParam}`;
    }
    
    return this.http.get(url);
  }
  



pauseAdvsalaryApplication(id: number, data: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) return throwError('No schema selected');

  const apiUrl = `${this.apiUrl}/payroll/api/advance-salary-request/${id}/pause/?schema=${selectedSchema}`;
  return this.http.post(apiUrl, data).pipe(
    catchError((error) => {
      console.error('Pause loan error:', error);
      return throwError(error);
    })
  );
}

resumeAdvsalaryApplication(id: number, data: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) return throwError('No schema selected');

  const apiUrl = `${this.apiUrl}/payroll/api/advance-salary-request/${id}/resume/?schema=${selectedSchema}`;
  return this.http.post(apiUrl, data).pipe(
    catchError((error) => {
      console.error('Resume loan error:', error);
      return throwError(error);
    })
  );
}






// resignation setting
// ---------------------

CreateEmpResignationRequest(formData: FormData): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError('No schema selected.');
  }

  const apiUrl = `${this.apiUrl}/employee/api/employee-resignation/?schema=${selectedSchema}`;

  return this.http.post(apiUrl, formData).pipe(
    catchError((error) => {
      console.error('Error during leave type registration:', error);
      return throwError(error);
    })
  );
}



getEmpResignationRequest(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/employee-resignation/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}





getEmployeeApprovedResignation(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/employee-resignation/approved_resignations/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}


createEndOfService(employeeId: number, selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/employee-resignation/create_eos_by_employee/${employeeId}/?schema=${selectedSchema}`;
  return this.http.post(apiUrl, {}); // Empty body if backend doesn’t need payload
}


// createEndOfService(apiUrl: string): Observable<any> {
//   return this.http.post(apiUrl, {}); // Sending empty body if API doesn’t require data
// }




getEmployeeEos(selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/employee-resignation/employees_with_eos/?schema=${selectedSchema}`;

  // Fetch employees from the API
  return this.http.get(apiUrl);

}



getEmployeeEndOfService(employeeId: number, selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/end-of-service/${employeeId}/?schema=${selectedSchema}`;
  return this.http.get(apiUrl);
}



getFinalSettlementData(employeeId: number, selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/employee/api/end-of-service/${employeeId}/final-settlement-data/?schema=${selectedSchema}`;
  return this.http.get(apiUrl);
}





// leave.service.ts

getAvailableFields(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/organisation/api/asset-Report/select_employee_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}

saveCustomReport(payload: any): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/organisation/api/asset-Report/generate_employee_filter_table/?schema=${selectedSchema}`;
  return this.http.post(apiUrl, payload);
}






// assetTransaction 

getAssetTransactionReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/organisation/api/asset-transaction-report/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}



getAssetTransactionReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/organisation/api/asset-transaction-report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}


getAvailableFieldsAssetTransaction(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/organisation/api/asset-transaction-report/select_asset_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}

deleteAssetReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/organisation/api/asset-transaction-report/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}

// saveCustomReportAssetTransaction(payload: any): Observable<any> {
//   const selectedSchema = localStorage.getItem('selectedSchema');
//   const apiUrl = `${this.apiUrl}/organisation/api/asset-Report/generate_employee_filter_table/?schema=${selectedSchema}`;
//   return this.http.post(apiUrl, payload);
// }


// employee report


getAvailableFieldsempreport(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/employee/api/emp-report/select_employee_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}


getEmpReportReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/employee/api/emp-report/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}


getEmpReportReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/employee/api/emp-report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}



deleteEmpReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/employee/api/emp-report/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}




// general request report


getAvailableFieldsGeneralRequest(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/employee/api/report-general-request/select_generalreport_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}


getGenRequestReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/employee/api/report-general-request/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}


getGenRequestReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/employee/api/report-general-request/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}


deleteGenReqReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/employee/api/report-general-request/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}




// document request report

getAvailableFieldsDocument(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/employee/api/doc-report/select_document_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}


getDocumentReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/employee/api/doc-report/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}


getDocumentReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/employee/api/doc-report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}



deleteDocumentReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/employee/api/doc-report/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}



// leave report


getAvailableFieldsLeaveReport(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/leave-report/select_leavereport_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}


getLeaveReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/calendars/api/leave-report/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}


getLeaveReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/calendars/api/leave-report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}

deleteLeaveReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/calendars/api/leave-report/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}



// leave approval report



getAvailableFieldsLeaveApprovalReport(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/Lv_Approval_Report/select_approve_report_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}



getLeaveApprovalReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/calendars/api/Lv_Approval_Report/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}


getLeaveApprovalReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/calendars/api/Lv_Approval_Report/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}

deleteLeaveApprovalReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/calendars/api/Lv_Approval_Report/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}


// leave balance report 

getAvailableFieldsLeaveBalaceReport(): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  const apiUrl = `${this.apiUrl}/calendars/api/lvBalanceReport/select_attendancereport_fields/?schema=${selectedSchema}`;
  return this.http.get<any>(apiUrl);
}


getLeaveBalanceReport(): Observable<any[]> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  if (!selectedSchema) {
    console.error('No schema selected.');
    return throwError(() => new Error('No schema selected.'));
  }

  const apiUrl = `${this.apiUrl}/calendars/api/lvBalanceReport/?schema=${selectedSchema}`;
  return this.http.get<any[]>(apiUrl);
}

getLeaveBalanceReportNew(selectedSchema: string, branchIds: number[]): Observable<any> {
  // Converts [1,3,4] into the string "[1,3,4]" for the URL
  const branchParam = branchIds.length > 0 ? `[${branchIds.join(',')}]` : '';
  
  let url = `${this.apiUrl}/calendars/api/lvBalanceReport/?schema=${selectedSchema}`;
  if (branchParam) {
    url += `&branch_id=${branchParam}`;
  }
  
  return this.http.get(url);
}



deleteLeaveBalanceReport(reportId: number): Observable<any> {
  const selectedSchema = localStorage.getItem('selectedSchema');
  // Adjust the URL to match your Django/Backend URL pattern
  const apiUrl = `${this.apiUrl}/calendars/api/lvBalanceReport/${reportId}/?schema=${selectedSchema}`;
  
  return this.http.delete(apiUrl);
}


// reckeck employee checkin


postEmployeeRecheck(empCode: string, selectedSchema: string): Observable<any> {
  const apiUrl = `${this.apiUrl}/calendars/api/attendance-Recheck/email/?schema=${selectedSchema}`;
  
  // Create the payload exactly as the backend expects (emp_code)
  const payload = {
    emp_code: empCode
  };

  return this.http.post(apiUrl, payload);
}


}
