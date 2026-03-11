import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeePunchingDetailsComponent } from './employee-punching-details.component';

describe('EmployeePunchingDetailsComponent', () => {
  let component: EmployeePunchingDetailsComponent;
  let fixture: ComponentFixture<EmployeePunchingDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeePunchingDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeePunchingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
