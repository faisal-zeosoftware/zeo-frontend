import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetEscalationComponent } from './asset-escalation.component';

describe('AssetEscalationComponent', () => {
  let component: AssetEscalationComponent;
  let fixture: ComponentFixture<AssetEscalationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetEscalationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssetEscalationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
