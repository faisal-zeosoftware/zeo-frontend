import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanEmailtemplateEditComponent } from './loan-emailtemplate-edit.component';

describe('LoanEmailtemplateEditComponent', () => {
  let component: LoanEmailtemplateEditComponent;
  let fixture: ComponentFixture<LoanEmailtemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoanEmailtemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoanEmailtemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
