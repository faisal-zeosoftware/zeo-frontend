import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpAssetRequestComponent } from './emp-asset-request.component';

describe('EmpAssetRequestComponent', () => {
  let component: EmpAssetRequestComponent;
  let fixture: ComponentFixture<EmpAssetRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmpAssetRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmpAssetRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
