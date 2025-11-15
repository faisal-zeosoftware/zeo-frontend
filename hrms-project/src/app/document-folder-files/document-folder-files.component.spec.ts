import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentFolderFilesComponent } from './document-folder-files.component';

describe('DocumentFolderFilesComponent', () => {
  let component: DocumentFolderFilesComponent;
  let fixture: ComponentFixture<DocumentFolderFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocumentFolderFilesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocumentFolderFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
