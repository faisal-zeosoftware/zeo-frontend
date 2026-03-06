import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeFaceRegisterComponent } from './employee-face-register.component';

describe('EmployeeFaceRegisterComponent', () => {
  let component: EmployeeFaceRegisterComponent;
  let fixture: ComponentFixture<EmployeeFaceRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeFaceRegisterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeFaceRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
