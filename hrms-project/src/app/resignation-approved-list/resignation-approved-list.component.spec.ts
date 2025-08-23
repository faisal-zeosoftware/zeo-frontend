import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResignationApprovedListComponent } from './resignation-approved-list.component';

describe('ResignationApprovedListComponent', () => {
  let component: ResignationApprovedListComponent;
  let fixture: ComponentFixture<ResignationApprovedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResignationApprovedListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResignationApprovedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
