import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocReqEmailtemplateEditComponent } from './doc-req-emailtemplate-edit.component';

describe('DocReqEmailtemplateEditComponent', () => {
  let component: DocReqEmailtemplateEditComponent;
  let fixture: ComponentFixture<DocReqEmailtemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocReqEmailtemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocReqEmailtemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
