import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketApprovalLevelComponent } from './airticket-approval-level.component';

describe('AirticketApprovalLevelComponent', () => {
  let component: AirticketApprovalLevelComponent;
  let fixture: ComponentFixture<AirticketApprovalLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketApprovalLevelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketApprovalLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
