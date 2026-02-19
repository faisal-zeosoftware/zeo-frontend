import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimeRuleComponent } from './overtime-rule.component';

describe('OvertimeRuleComponent', () => {
  let component: OvertimeRuleComponent;
  let fixture: ComponentFixture<OvertimeRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OvertimeRuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OvertimeRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
