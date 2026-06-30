import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceValidationPolicyComponent } from './attendance-validation-policy.component';

describe('AttendanceValidationPolicyComponent', () => {
  let component: AttendanceValidationPolicyComponent;
  let fixture: ComponentFixture<AttendanceValidationPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceValidationPolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceValidationPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
