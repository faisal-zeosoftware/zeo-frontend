import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralRequestEscalationComponent } from './general-request-escalation.component';

describe('GeneralRequestEscalationComponent', () => {
  let component: GeneralRequestEscalationComponent;
  let fixture: ComponentFixture<GeneralRequestEscalationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GeneralRequestEscalationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeneralRequestEscalationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
