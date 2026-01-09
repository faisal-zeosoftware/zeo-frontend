import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvertimePolicyComponent } from './overtime-policy.component';

describe('OvertimePolicyComponent', () => {
  let component: OvertimePolicyComponent;
  let fixture: ComponentFixture<OvertimePolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OvertimePolicyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OvertimePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
