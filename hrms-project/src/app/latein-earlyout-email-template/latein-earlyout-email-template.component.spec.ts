import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateinEarlyoutEmailTemplateComponent } from './latein-earlyout-email-template.component';

describe('LateinEarlyoutEmailTemplateComponent', () => {
  let component: LateinEarlyoutEmailTemplateComponent;
  let fixture: ComponentFixture<LateinEarlyoutEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateinEarlyoutEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LateinEarlyoutEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
