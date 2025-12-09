import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetEmailTemplateEditComponent } from './asset-email-template-edit.component';

describe('AssetEmailTemplateEditComponent', () => {
  let component: AssetEmailTemplateEditComponent;
  let fixture: ComponentFixture<AssetEmailTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetEmailTemplateEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetEmailTemplateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
