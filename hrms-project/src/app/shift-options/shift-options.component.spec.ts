import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftOptionsComponent } from './shift-options.component';

describe('ShiftOptionsComponent', () => {
  let component: ShiftOptionsComponent;
  let fixture: ComponentFixture<ShiftOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftOptionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShiftOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
