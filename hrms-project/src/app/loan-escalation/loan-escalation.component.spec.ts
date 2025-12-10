import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanEscalationComponent } from './loan-escalation.component';

describe('LoanEscalationComponent', () => {
  let component: LoanEscalationComponent;
  let fixture: ComponentFixture<LoanEscalationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoanEscalationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoanEscalationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
