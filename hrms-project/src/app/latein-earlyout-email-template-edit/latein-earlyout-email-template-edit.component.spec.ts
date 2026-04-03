import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateinEarlyoutEmailTemplateEditComponent } from './latein-earlyout-email-template-edit.component';

describe('LateinEarlyoutEmailTemplateEditComponent', () => {
  let component: LateinEarlyoutEmailTemplateEditComponent;
  let fixture: ComponentFixture<LateinEarlyoutEmailTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateinEarlyoutEmailTemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LateinEarlyoutEmailTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
