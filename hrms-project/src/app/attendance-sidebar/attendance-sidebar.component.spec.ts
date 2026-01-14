import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSidebarComponent } from './attendance-sidebar.component';

describe('AttendanceSidebarComponent', () => {
  let component: AttendanceSidebarComponent;
  let fixture: ComponentFixture<AttendanceSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceSidebarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
