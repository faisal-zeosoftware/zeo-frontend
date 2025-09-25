import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketRuleComponent } from './airticket-rule.component';

describe('AirticketRuleComponent', () => {
  let component: AirticketRuleComponent;
  let fixture: ComponentFixture<AirticketRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketRuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
