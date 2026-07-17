
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EmployeeFamilyComponent } from '../employee-family/employee-family.component';
import { EmployeeUserComponent } from '../employee-user/employee-user.component';

@Component({
  selector: 'app-succes-modal',
  templateUrl: './succes-modal.component.html',
  styleUrl: './succes-modal.component.css'
})
export class SuccesModalComponent {

  constructor(
    private dialog: MatDialog,
    private ref: MatDialogRef<EmployeeFamilyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SuccesModalComponent>
  ) {}

  // YES - Connect employee to user
  onYesConnect(): void {
    this.dialogRef.close();
    
    // Open EmployeeUserComponent with the employee ID
    const dialogRef = this.dialog.open(EmployeeUserComponent, {
      width: '80%',
      height: '500px',
      data: {
        employeeId: this.data.emp_id  // Pass the employee ID
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('EmployeeUser modal was closed');
    });
  }

  // NO - Continue to family details (original flow)
  // onNoConnect(): void {
  //   this.dialogRef.close();
    
  //   // const dialogRef = this.dialog.open(EmployeeFamilyComponent, {
  //   //   width: '80%',
  //   //   height: '500px',
  //   //   data: {
  //   //     message: 'Employee created successfully!',
  //   //     emp_id: this.data.emp_id
  //   //   }
  //   // });

  //   // dialogRef.afterClosed().subscribe(() => {
  //     console.log('The success modal was closed');
  //   });
  // }

  closeapplicationModal(): void {
    window.location.reload();
  }
}
