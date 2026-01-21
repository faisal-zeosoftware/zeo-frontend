import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResignationEmailTemplateEditComponent } from './resignation-email-template-edit.component';

describe('ResignationEmailTemplateEditComponent', () => {
  let component: ResignationEmailTemplateEditComponent;
  let fixture: ComponentFixture<ResignationEmailTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResignationEmailTemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResignationEmailTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
