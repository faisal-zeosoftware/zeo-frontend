import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSalaryEmailtemplateComponent } from './advance-salary-emailtemplate.component';

describe('AdvanceSalaryEmailtemplateComponent', () => {
  let component: AdvanceSalaryEmailtemplateComponent;
  let fixture: ComponentFixture<AdvanceSalaryEmailtemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdvanceSalaryEmailtemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdvanceSalaryEmailtemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
