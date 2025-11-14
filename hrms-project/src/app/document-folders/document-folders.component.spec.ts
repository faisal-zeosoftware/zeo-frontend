import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentFoldersComponent } from './document-folders.component';

describe('DocumentFoldersComponent', () => {
  let component: DocumentFoldersComponent;
  let fixture: ComponentFixture<DocumentFoldersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentFoldersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentFoldersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
