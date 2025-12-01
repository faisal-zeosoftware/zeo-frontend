import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveTemplateEditComponent } from './leave-template-edit.component';

describe('LeaveTemplateEditComponent', () => {
  let component: LeaveTemplateEditComponent;
  let fixture: ComponentFixture<LeaveTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeaveTemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
