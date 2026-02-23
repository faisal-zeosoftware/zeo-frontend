import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayStructureComponent } from './pay-structure.component';

describe('PayStructureComponent', () => {
  let component: PayStructureComponent;
  let fixture: ComponentFixture<PayStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PayStructureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PayStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
