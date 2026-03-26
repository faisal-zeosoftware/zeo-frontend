import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateinEarlyoutApprovalLevelComponent } from './latein-earlyout-approval-level.component';

describe('LateinEarlyoutApprovalLevelComponent', () => {
  let component: LateinEarlyoutApprovalLevelComponent;
  let fixture: ComponentFixture<LateinEarlyoutApprovalLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateinEarlyoutApprovalLevelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LateinEarlyoutApprovalLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
