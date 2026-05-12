import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeFullAttendanceComponent } from './employee-full-attendance.component';

describe('EmployeeFullAttendanceComponent', () => {
  let component: EmployeeFullAttendanceComponent;
  let fixture: ComponentFixture<EmployeeFullAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeFullAttendanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeFullAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
