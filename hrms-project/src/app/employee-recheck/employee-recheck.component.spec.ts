import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeRecheckComponent } from './employee-recheck.component';

describe('EmployeeRecheckComponent', () => {
  let component: EmployeeRecheckComponent;
  let fixture: ComponentFixture<EmployeeRecheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeRecheckComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeRecheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
