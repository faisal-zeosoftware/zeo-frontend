import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResignationApprovalLevelComponent } from './resignation-approval-level.component';

describe('ResignationApprovalLevelComponent', () => {
  let component: ResignationApprovalLevelComponent;
  let fixture: ComponentFixture<ResignationApprovalLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResignationApprovalLevelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResignationApprovalLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
