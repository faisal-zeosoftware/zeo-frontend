import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketEscalationComponent } from './airticket-escalation.component';

describe('AirticketEscalationComponent', () => {
  let component: AirticketEscalationComponent;
  let fixture: ComponentFixture<AirticketEscalationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketEscalationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketEscalationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
