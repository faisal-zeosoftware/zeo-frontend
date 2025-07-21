import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpLoanComponent } from './emp-loan.component';

describe('EmpLoanComponent', () => {
  let component: EmpLoanComponent;
  let fixture: ComponentFixture<EmpLoanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmpLoanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmpLoanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
