import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetApprovelLevelComponent } from './asset-approvel-level.component';

describe('AssetApprovelLevelComponent', () => {
  let component: AssetApprovelLevelComponent;
  let fixture: ComponentFixture<AssetApprovelLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetApprovelLevelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetApprovelLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
