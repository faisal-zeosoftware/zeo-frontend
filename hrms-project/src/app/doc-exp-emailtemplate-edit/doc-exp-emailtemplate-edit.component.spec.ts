import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocExpEmailtemplateEditComponent } from './doc-exp-emailtemplate-edit.component';

describe('DocExpEmailtemplateEditComponent', () => {
  let component: DocExpEmailtemplateEditComponent;
  let fixture: ComponentFixture<DocExpEmailtemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DocExpEmailtemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocExpEmailtemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
