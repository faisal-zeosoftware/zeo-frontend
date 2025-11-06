import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftOverrideComponent } from './shift-override.component';

describe('ShiftOverrideComponent', () => {
  let component: ShiftOverrideComponent;
  let fixture: ComponentFixture<ShiftOverrideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftOverrideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShiftOverrideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
