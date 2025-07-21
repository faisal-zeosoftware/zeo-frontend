import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResignationApprovalsComponent } from './resignation-approvals.component';

describe('ResignationApprovalsComponent', () => {
  let component: ResignationApprovalsComponent;
  let fixture: ComponentFixture<ResignationApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResignationApprovalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResignationApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
