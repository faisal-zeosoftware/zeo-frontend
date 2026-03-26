import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateinEarlyoutApprovalsComponent } from './latein-earlyout-approvals.component';

describe('LateinEarlyoutApprovalsComponent', () => {
  let component: LateinEarlyoutApprovalsComponent;
  let fixture: ComponentFixture<LateinEarlyoutApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateinEarlyoutApprovalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LateinEarlyoutApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
