import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketApprovalsComponent } from './airticket-approvals.component';

describe('AirticketApprovalsComponent', () => {
  let component: AirticketApprovalsComponent;
  let fixture: ComponentFixture<AirticketApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketApprovalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
