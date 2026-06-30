import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateComePolicyComponent } from './late-come-policy.component';

describe('LateComePolicyComponent', () => {
  let component: LateComePolicyComponent;
  let fixture: ComponentFixture<LateComePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LateComePolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LateComePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
