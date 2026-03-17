import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendancePolicyComponent } from './attendance-policy.component';

describe('AttendancePolicyComponent', () => {
  let component: AttendancePolicyComponent;
  let fixture: ComponentFixture<AttendancePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendancePolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendancePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
