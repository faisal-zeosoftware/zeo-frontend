import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanEmailTemplateComponent } from './loan-email-template.component';

describe('LoanEmailTemplateComponent', () => {
  let component: LoanEmailTemplateComponent;
  let fixture: ComponentFixture<LoanEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoanEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoanEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
