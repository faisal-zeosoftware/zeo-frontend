import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResignationEmailTemplateComponent } from './resignation-email-template.component';

describe('ResignationEmailTemplateComponent', () => {
  let component: ResignationEmailTemplateComponent;
  let fixture: ComponentFixture<ResignationEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResignationEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResignationEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
