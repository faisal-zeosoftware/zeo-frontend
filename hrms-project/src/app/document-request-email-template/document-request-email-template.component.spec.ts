import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRequestEmailTemplateComponent } from './document-request-email-template.component';

describe('DocumentRequestEmailTemplateComponent', () => {
  let component: DocumentRequestEmailTemplateComponent;
  let fixture: ComponentFixture<DocumentRequestEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentRequestEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentRequestEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
