import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftEmployeeComponent } from './shift-employee.component';

describe('ShiftEmployeeComponent', () => {
  let component: ShiftEmployeeComponent;
  let fixture: ComponentFixture<ShiftEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShiftEmployeeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShiftEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
