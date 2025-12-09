import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetEmailTemplateComponent } from './asset-email-template.component';

describe('AssetEmailTemplateComponent', () => {
  let component: AssetEmailTemplateComponent;
  let fixture: ComponentFixture<AssetEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetEmailTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
