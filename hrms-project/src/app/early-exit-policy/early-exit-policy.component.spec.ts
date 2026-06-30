import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarlyExitPolicyComponent } from './early-exit-policy.component';

describe('EarlyExitPolicyComponent', () => {
  let component: EarlyExitPolicyComponent;
  let fixture: ComponentFixture<EarlyExitPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EarlyExitPolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EarlyExitPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
