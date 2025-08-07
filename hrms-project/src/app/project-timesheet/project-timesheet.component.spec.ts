import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTimesheetComponent } from './project-timesheet.component';

describe('ProjectTimesheetComponent', () => {
  let component: ProjectTimesheetComponent;
  let fixture: ComponentFixture<ProjectTimesheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectTimesheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
