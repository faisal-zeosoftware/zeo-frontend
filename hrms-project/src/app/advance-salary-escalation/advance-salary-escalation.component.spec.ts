import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSalaryEscalationComponent } from './advance-salary-escalation.component';

describe('AdvanceSalaryEscalationComponent', () => {
  let component: AdvanceSalaryEscalationComponent;
  let fixture: ComponentFixture<AdvanceSalaryEscalationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdvanceSalaryEscalationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdvanceSalaryEscalationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
