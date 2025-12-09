import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketEmailTemplateEditComponent } from './airticket-email-template-edit.component';

describe('AirticketEmailTemplateEditComponent', () => {
  let component: AirticketEmailTemplateEditComponent;
  let fixture: ComponentFixture<AirticketEmailTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketEmailTemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketEmailTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
