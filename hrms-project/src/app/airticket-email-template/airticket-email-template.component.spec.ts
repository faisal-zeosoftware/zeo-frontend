import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirticketEmailTemplateComponent } from './airticket-email-template.component';

describe('AirticketEmailTemplateComponent', () => {
  let component: AirticketEmailTemplateComponent;
  let fixture: ComponentFixture<AirticketEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirticketEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AirticketEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
