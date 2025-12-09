import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetApprovalComponent } from './asset-approval.component';

describe('AssetApprovalComponent', () => {
  let component: AssetApprovalComponent;
  let fixture: ComponentFixture<AssetApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetApprovalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
