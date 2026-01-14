import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeEarlyGoingComponent } from './employee-early-going.component';

describe('EmployeeEarlyGoingComponent', () => {
  let component: EmployeeEarlyGoingComponent;
  let fixture: ComponentFixture<EmployeeEarlyGoingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeEarlyGoingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeEarlyGoingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
