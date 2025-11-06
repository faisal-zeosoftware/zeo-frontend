import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftPatternComponent } from './shift-pattern.component';

describe('ShiftPatternComponent', () => {
  let component: ShiftPatternComponent;
  let fixture: ComponentFixture<ShiftPatternComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftPatternComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShiftPatternComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
