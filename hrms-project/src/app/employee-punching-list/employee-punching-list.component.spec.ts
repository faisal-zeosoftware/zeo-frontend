import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeePunchingListComponent } from './employee-punching-list.component';

describe('EmployeePunchingListComponent', () => {
  let component: EmployeePunchingListComponent;
  let fixture: ComponentFixture<EmployeePunchingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeePunchingListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeePunchingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
