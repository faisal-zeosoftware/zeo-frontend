import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSalaryEmailtemplateEditComponent } from './advance-salary-emailtemplate-edit.component';

describe('AdvanceSalaryEmailtemplateEditComponent', () => {
  let component: AdvanceSalaryEmailtemplateEditComponent;
  let fixture: ComponentFixture<AdvanceSalaryEmailtemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdvanceSalaryEmailtemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdvanceSalaryEmailtemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
